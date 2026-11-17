import { strict as assert } from "node:assert";
import { spawn } from "node:child_process";
import { test } from "node:test";

function runLocalApi(env: NodeJS.ProcessEnv = {}) {
  return new Promise<{ code: number | null; output: string }>((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ["--import", "tsx", "tests/support/run-local-api.ts"],
      { env: { ...process.env, NO_COLOR: "1", ...env } }
    );
    let output = "";
    child.stdout.on("data", (chunk: Buffer) => { output += chunk.toString(); });
    child.stderr.on("data", (chunk: Buffer) => { output += chunk.toString(); });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, output }));
  });
}

test("local API command runs both suites", async () => {
  const result = await runLocalApi();
  assert.equal(result.code, 0, result.output);
  const [cucumber, playwright] = result.output.split("Running Playwright API tests against the local fixture...");
  assert.ok(cucumber && playwright, result.output);
  assert.match(cucumber, /[1-9]\d* scenarios? \([1-9]\d* passed\)/);
  assert.match(playwright, /[1-9]\d* passed/);
});

test("local API command runs Playwright and fails overall when Cucumber fails", async () => {
  const result = await runLocalApi({ "user:password": "" });
  assert.notEqual(result.code, 0, result.output);
  assert.match(result.output, /user\.email and user\.password must be non-empty strings/);
  const [, playwright] = result.output.split("Running Playwright API tests against the local fixture...");
  assert.ok(playwright, result.output);
  assert.match(playwright, /[1-9]\d* passed/);
  assert.match(playwright, /Cucumber API test runner failed/);
});
