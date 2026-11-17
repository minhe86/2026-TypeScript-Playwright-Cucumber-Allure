import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";
import { getApiBaseUrl } from "../playwrightTestRunner/step-definitions/api/utils/config.ts";

test("the API URL override must be HTTP(S), without exposing its value", () => {
  const previous = process.env.PLAYWRIGHT_API_BASE_URL;
  try {
    for (const value of ["", " ", "not-a-url", "file:///tmp/data", "https://user:secret@"]) {
      process.env.PLAYWRIGHT_API_BASE_URL = value;
      assert.throws(() => getApiBaseUrl(), (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.match(error.message, /PLAYWRIGHT_API_BASE_URL must be an absolute HTTP or HTTPS URL/);
        assert.doesNotMatch(error.message, /secret/);
        return true;
      });
    }
    for (const value of ["http://127.0.0.1:1234", "https://example.test/base"]) {
      process.env.PLAYWRIGHT_API_BASE_URL = value;
      assert.equal(getApiBaseUrl(), value);
    }
  } finally {
    if (previous === undefined) delete process.env.PLAYWRIGHT_API_BASE_URL;
    else process.env.PLAYWRIGHT_API_BASE_URL = previous;
  }
});

test("the configured API URL is validated when there is no override", async () => {
  const directory = await mkdtemp(join(tmpdir(), "playwright-api-url-"));
  try {
    await mkdir(join(directory, "configs"));
    const configPath = join(directory, "configs", "config.api.json");
    const moduleUrl = pathToFileURL(resolve("playwrightTestRunner/step-definitions/api/utils/config.ts")).href;
    const env = { ...process.env };
    delete env.PLAYWRIGHT_API_BASE_URL;
    const readConfig = () => spawnSync(process.execPath, [
      "--import", resolve("node_modules/tsx/dist/loader.mjs"),
      "--input-type=module", "-e",
      `import { getApiBaseUrl } from ${JSON.stringify(moduleUrl)}; console.log(getApiBaseUrl());`,
    ], { cwd: directory, env, encoding: "utf8" });

    await writeFile(configPath, JSON.stringify({ apiBaseUrl: "file:///secret-value" }));
    const invalid = readConfig();
    assert.notEqual(invalid.status, 0);
    assert.match(invalid.stderr, /apiBaseUrl in configs\/config\.api\.json must be an absolute HTTP or HTTPS URL/);
    assert.doesNotMatch(invalid.stderr, /secret-value/);

    await writeFile(configPath, '{"password":"secret-value", invalid}');
    const malformed = readConfig();
    assert.notEqual(malformed.status, 0);
    assert.match(malformed.stderr, /configs\/config\.api\.json must contain valid JSON/);
    assert.doesNotMatch(malformed.stderr, /secret-value/);

    const authUrl = pathToFileURL(resolve("playwrightTestRunner/step-definitions/api/utils/auth.ts")).href;
    const readAuth = () => spawnSync(process.execPath, [
      "--import", resolve("node_modules/tsx/dist/loader.mjs"),
      "--input-type=module", "-e",
      `import { getAuthToken } from ${JSON.stringify(authUrl)}; await getAuthToken({});`,
    ], { cwd: directory, env: { ...env, PLAYWRIGHT_API_BASE_URL: "https://example.test" }, encoding: "utf8" });
    const auth = readAuth();
    assert.notEqual(auth.status, 0);
    assert.match(auth.stderr, /configs\/config\.api\.json must contain valid JSON/);
    assert.doesNotMatch(auth.stderr, /secret-value/);

    for (const contents of ["null", '["secret-value"]', '"secret-value"']) {
      await writeFile(configPath, contents);
      for (const result of [readConfig(), readAuth()]) {
        assert.notEqual(result.status, 0);
        assert.match(result.stderr, /configs\/config\.api\.json must contain a JSON object/);
        assert.doesNotMatch(result.stderr, /secret-value/);
      }
    }

    await writeFile(configPath, JSON.stringify({ user: { email: "secret-value", password: "" } }));
    const invalidUser = readAuth();
    assert.notEqual(invalidUser.status, 0);
    assert.match(invalidUser.stderr, /user\.email and user\.password must be non-empty strings/);
    assert.doesNotMatch(invalidUser.stderr, /secret-value/);

    await writeFile(configPath, JSON.stringify({ apiBaseUrl: "https://example.test" }));
    const valid = readConfig();
    assert.equal(valid.status, 0, valid.stderr);
    assert.equal(valid.stdout.trim(), "https://example.test");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
