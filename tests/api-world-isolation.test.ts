import { strict as assert } from "node:assert";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve as resolvePath } from "node:path";
import { test } from "node:test";

function runCucumber(feature: string, baseUrl?: string, format = "progress", cwd = process.cwd()) {
  return new Promise<{ code: number | null; output: string }>((resolve, reject) => {
    const env = { ...process.env };
    if (baseUrl === undefined) delete env.apiBaseUrl;
    else env.apiBaseUrl = baseUrl;
    const child = spawn(
      process.execPath,
      [
        "--import", resolvePath("node_modules/tsx/dist/loader.mjs"),
        resolvePath("node_modules/@cucumber/cucumber/bin/cucumber.js"),
        "--import", resolvePath("step-definitions/api/support/support.ts"),
        "--import", resolvePath("step-definitions/api/*.step.ts"),
        "--format", format,
        join(process.cwd(), feature),
      ],
      { cwd, env }
    );
    let output = "";
    child.stdout.on("data", (chunk: Buffer) => { output += chunk.toString(); });
    child.stderr.on("data", (chunk: Buffer) => { output += chunk.toString(); });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, output }));
  });
}

test("Cucumber API configuration failures do not expose values", async () => {
  const directory = await mkdtemp(join(tmpdir(), "cucumber-api-config-"));
  try {
    await mkdir(join(directory, "configs"));
    const configPath = join(directory, "configs", "config.api.json");
    const feature = "features/api/resource.feature";
    const cases = [
      { contents: JSON.stringify({ user: { email: "secret-value", password: "pass" } }), error: /apiBaseUrl must be an absolute HTTP or HTTPS URL/ },
      { contents: JSON.stringify({ apiBaseUrl: "file:///secret-value", user: { email: "email", password: "pass" } }), error: /apiBaseUrl must be an absolute HTTP or HTTPS URL/ },
      { contents: JSON.stringify({ apiBaseUrl: "https://example.test" }), error: /user\.email and user\.password must be non-empty strings/ },
      { contents: JSON.stringify({ apiBaseUrl: "https://example.test", user: { email: "secret-value", password: "" } }), error: /user\.email and user\.password must be non-empty strings/ },
      { contents: '{"password":"secret-value", invalid}', error: /configs\/config\.api\.json must contain valid JSON/ },
      { contents: "null", error: /configs\/config\.api\.json must contain a JSON object/ },
      { contents: '["secret-value"]', error: /configs\/config\.api\.json must contain a JSON object/ },
      { contents: '"secret-value"', error: /configs\/config\.api\.json must contain a JSON object/ },
    ];
    for (const { contents, error } of cases) {
      await writeFile(configPath, contents);
      const result = await runCucumber(feature, undefined, "progress", directory);
      assert.equal(result.code, 1, result.output);
      assert.match(result.output, error);
      assert.doesNotMatch(result.output, /secret-value/);
    }

    await writeFile(configPath, JSON.stringify({ apiBaseUrl: "https://example.test", user: { email: "email", password: "pass" } }));
    const invalidOverride = await runCucumber(feature, "file:///secret-value", "progress", directory);
    assert.equal(invalidOverride.code, 1, invalidOverride.output);
    assert.match(invalidOverride.output, /apiBaseUrl must be an absolute HTTP or HTTPS URL/);
    assert.doesNotMatch(invalidOverride.output, /secret-value/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("Cucumber rejects invalid login tokens before creating a resource client", async () => {
  let loginResponse: unknown;
  let resourceRequests = 0;
  const server = createServer((request, response) => {
    request.resume();
    response.setHeader("Content-Type", "application/json");
    if (request.method === "POST" && request.url === "/api/login") {
      response.end(JSON.stringify(loginResponse));
    } else {
      resourceRequests++;
      response.writeHead(500).end();
    }
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    for (const body of [null, {}, { token: "" }, { token: 123, detail: "secret-value" }]) {
      loginResponse = body;
      const result = await runCucumber("features/api/resource.feature", `http://127.0.0.1:${address.port}`);
      assert.equal(result.code, 1, result.output);
      assert.match(result.output, /API login response must contain a non-empty token/);
      assert.doesNotMatch(result.output, /secret-value/);
    }
    assert.equal(resourceRequests, 0, "Invalid authentication must not reach resource endpoints");
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test("Cucumber API scenarios keep clients and responses isolated", async () => {
  let createRequests = 0;
  const server = createServer((request, response) => {
    request.resume();
    response.setHeader("Content-Type", "application/json");
    if (request.method === "POST" && request.url === "/api/login") {
      response.end(JSON.stringify({ token: "test-token" }));
    } else if (request.headers.authorization !== "Bearer test-token") {
      response.writeHead(401).end(JSON.stringify({ error: "Missing authorization" }));
    } else if (request.method === "POST" && request.url === "/api/users") {
      createRequests++;
      response.writeHead(201).end(JSON.stringify({ name: "First", email: "first@example.test", id: "1" }));
    } else if (request.method === "GET" && request.url === "/api/users/4") {
      response.end(JSON.stringify({ data: { id: 4, first_name: "Michael", email: "michael.lawson@reqres.in" } }));
    } else if (request.method === "POST" && request.url === "/api/register") {
      response.writeHead(400).end(JSON.stringify({ error: "Missing email or username" }));
    } else {
      response.writeHead(404).end(JSON.stringify({ error: "Unexpected request" }));
    }
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const normalRun = await runCucumber("features/api/resource.feature", baseUrl, "message");
    assert.equal(normalRun.code, 0, normalRun.output);
    const attachments = normalRun.output.trim().split("\n")
      .map((line): { attachment?: { body: string; contentEncoding: string } } => JSON.parse(line))
      .flatMap((message) => message.attachment ? [message.attachment] : []);
    assert.ok(attachments.length > 0, "Expected Cucumber attachment messages");
    for (const attachment of attachments) {
      const body = attachment.contentEncoding === "BASE64"
        ? Buffer.from(attachment.body, "base64").toString("utf8")
        : attachment.body;
      assert.ok(!body.includes("test-token"), "The token must not appear in Cucumber attachments");
    }

    const isolationRun = await runCucumber("tests/fixtures/api-world-isolation.feature", baseUrl);
    assert.equal(isolationRun.code, 1, isolationRun.output);
    assert.match(isolationRun.output, /Resource client is not set in the World/);
    assert.match(isolationRun.output, /User resource has not been created in this scenario/);
    assert.match(isolationRun.output, /User resource has not been retrieved in this scenario/);
    assert.equal(createRequests, 2, "The second scenario must not reuse the first scenario's client");
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
