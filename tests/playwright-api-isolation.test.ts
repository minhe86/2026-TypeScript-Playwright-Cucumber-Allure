import { strict as assert } from "node:assert";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";

function runApiCase(
  spec: string,
  name: string,
  baseUrl: string | undefined,
  outputDir: string,
  cwd = process.cwd()
) {
  return new Promise<{ code: number | null; output: string }>((resolve, reject) => {
    const env = { ...process.env };
    if (baseUrl === undefined) {
      delete env.PLAYWRIGHT_API_BASE_URL;
    } else {
      env.PLAYWRIGHT_API_BASE_URL = baseUrl;
    }
    const child = spawn(process.execPath, [
      join(process.cwd(), "node_modules/@playwright/test/cli.js"),
      "test",
      `--config=${join(process.cwd(), "playwrightTestRunner/configs/playwright.api-live.config.ts")}`,
      spec,
      "--project=API",
      `--grep=${name}`,
      "--reporter=line",
      "--retries=0",
      `--output=${outputDir}`,
    ], { cwd, env });
    let output = "";
    child.stdout.on("data", (chunk: Buffer) => { output += chunk.toString(); });
    child.stderr.on("data", (chunk: Buffer) => { output += chunk.toString(); });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, output }));
  });
}

test("Playwright login and resource requests use the configured API URL", async () => {
  const paths: string[] = [];
  const server = createServer((request, response) => {
    request.resume();
    response.setHeader("Content-Type", "application/json");
    if (request.method === "POST" && request.url === "/api/login") {
      paths.push(request.url);
      response.end(JSON.stringify({ token: "test-token" }));
    } else if (request.method === "POST" && request.url === "/api/users") {
      paths.push(request.url);
      response.writeHead(201).end(JSON.stringify({ id: "created-user" }));
    } else {
      response.writeHead(404).end(JSON.stringify({ error: "Unexpected request" }));
    }
  });
  const tempDir = await mkdtemp(join(tmpdir(), "playwright-api-config-"));
  try {
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    await mkdir(join(tempDir, "configs"));
    await writeFile(join(tempDir, "configs/config.api.json"), JSON.stringify({
      apiBaseUrl: `http://127.0.0.1:${address.port}`,
      user: { firstName: "Example", email: "example@example.test", password: "example" },
    }));
    await writeFile(join(tempDir, "configs/config.default.json"), "{}");

    const result = await runApiCase(
      "userResourceTests.spec.ts",
      "creates a user resource",
      undefined,
      resolve(tempDir, "results"),
      tempDir
    );
    assert.equal(result.code, 0, result.output);
    assert.match(result.output, /1 passed/);
    assert.deepEqual(paths, ["/api/login", "/api/users"]);
  } finally {
    if (server.listening) {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("Playwright API cases run independently", async () => {
  const registrations: unknown[] = [];
  const createdUsers: unknown[] = [];
  const retrievedUsers: string[] = [];
  let logins = 0;
  const config: { user: { firstName: string; email: string; password: string } } = JSON.parse(
    await readFile("configs/config.api.json", "utf8")
  );
  const server = createServer((request, response) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk: string) => { body += chunk; });
    request.on("end", () => {
      response.setHeader("Content-Type", "application/json");
      if (request.method === "POST" && request.url === "/api/login") {
        logins++;
        const credentials: unknown = JSON.parse(body);
        if (
          typeof credentials === "object" && credentials !== null &&
          Reflect.get(credentials, "email") === config.user.email &&
          Reflect.get(credentials, "password") === config.user.password
        ) {
          response.end(JSON.stringify({ token: "test-token" }));
        } else {
          response.writeHead(400).end(JSON.stringify({ error: "Invalid login" }));
        }
      } else if (request.method === "POST" && request.url === "/api/register") {
        const data: unknown = JSON.parse(body);
        registrations.push(data);
        if (
          typeof data === "object" && data !== null &&
          typeof Reflect.get(data, "email") === "string" &&
          typeof Reflect.get(data, "password") === "string"
        ) {
          response.end(JSON.stringify({ id: 1 }));
        } else {
          response.writeHead(400).end(JSON.stringify({ error: "Invalid registration" }));
        }
      } else if (request.method === "POST" && request.url === "/api/users") {
        createdUsers.push(JSON.parse(body));
        response.writeHead(201).end(JSON.stringify({ id: "created-user" }));
      } else if (request.method === "GET" && request.url === "/api/users/7") {
        retrievedUsers.push(request.url);
        response.end(JSON.stringify({ data: {
          first_name: config.user.firstName,
          email: config.user.email,
        } }));
      } else {
        response.writeHead(404).end(JSON.stringify({ error: "Unexpected request" }));
      }
    });
  });
  const outputDir = await mkdtemp(join(tmpdir(), "playwright-api-isolation-"));
  try {
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const baseUrl = `http://127.0.0.1:${address.port}`;

    for (const name of ["empty data", "missing password", "missing email"]) {
      const result = await runApiCase("registerResourceInvalidTests.spec.ts", name, baseUrl, outputDir);
      assert.equal(result.code, 0, result.output);
      assert.match(result.output, /1 passed/);
    }

    assert.equal(logins, 3);
    assert.deepEqual(registrations, [
      {},
      { email: "sydney@fife" },
      { password: "test" },
    ]);
    const validRegistration = await fetch(`${baseUrl}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.test", password: "test" }),
    });
    assert.equal(validRegistration.status, 200);

    const retrieval = await runApiCase(
      "userResourceTests.spec.ts", "retrieves an existing user resource", baseUrl, outputDir
    );
    assert.equal(retrieval.code, 0, retrieval.output);
    assert.match(retrieval.output, /1 passed/);
    assert.deepEqual(retrievedUsers, ["/api/users/7"]);
    assert.equal(createdUsers.length, 0, "Retrieval must not depend on creating a user first");

    const creation = await runApiCase(
      "userResourceTests.spec.ts", "creates a user resource", baseUrl, outputDir
    );
    assert.equal(creation.code, 0, creation.output);
    assert.match(creation.output, /1 passed/);
    assert.deepEqual(createdUsers, [
      { firstName: config.user.firstName, email: config.user.email },
    ]);
    assert.equal(logins, 5);
  } finally {
    if (server.listening) {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
    await rm(outputDir, { recursive: true, force: true });
  }
});
