import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

test("both browser runners reject invalid configuration without exposing its contents", async () => {
  const directory = await mkdtemp(join(tmpdir(), "browser-config-"));
  try {
    await mkdir(join(directory, "configs"));
    const configPath = join(directory, "configs", "config.default.json");
    const commands = [
      [
        "--import", import.meta.resolve("tsx"),
        resolve("node_modules/@cucumber/cucumber/bin/cucumber.js"),
        "--import", resolve("step-definitions/e2e/support/world.ts"),
        "--import", resolve("step-definitions/e2e/support/support.ts"),
        "--import", resolve("step-definitions/e2e/*.step.ts"),
        "--dry-run", resolve("features/e2e/"),
      ],
      [
        resolve("node_modules/@playwright/test/cli.js"), "test", "--list",
        `--config=${resolve("playwrightTestRunner/configs/playwright.config.ts")}`,
        "--reporter=list",
      ],
    ];
    const invalidConfigs = [
      { contents: '{"password":"secret-value", invalid}', error: /must contain valid JSON/ },
      { contents: "null", error: /must contain a JSON object/ },
      { contents: '["secret-value"]', error: /must contain a JSON object/ },
      { contents: '"secret-value"', error: /must contain a JSON object/ },
      { contents: "42", error: /must contain a JSON object/ },
    ];
    for (const { contents, error } of invalidConfigs) {
      await writeFile(configPath, contents);
      for (const args of commands) {
        const result = spawnSync(process.execPath, args, { cwd: directory, encoding: "utf8", timeout: 20_000 });
        assert.ifError(result.error);
        assert.notEqual(result.status, 0);
        const output = result.stdout + result.stderr;
        assert.match(output, /configs\/config\.default\.json/);
        assert.match(output, error);
        assert.doesNotMatch(output, /secret-value/);
      }
    }

    await writeFile(configPath, JSON.stringify({
      swagLabsBaseUrl: "https://file.example",
      headless: true,
    }));
    const setup = pathToFileURL(resolve("playwrightTestRunner/configs/test.setup.ts")).href;
    const script = `
      import ${JSON.stringify(setup)};
      import nconf from ${JSON.stringify(import.meta.resolve("nconf"))};
      console.log(JSON.stringify({ url: nconf.get("swagLabsBaseUrl"), headless: nconf.get("headless") }));
    `;
    const env = { ...process.env, swagLabsBaseUrl: "https://env.example", headless: "false" };
    const result = spawnSync(process.execPath, [
      "--import", import.meta.resolve("tsx"), "--input-type=module", "-e", script,
      "--", "probe", "--swagLabsBaseUrl=https://argv.example",
    ], { cwd: directory, env, encoding: "utf8", timeout: 20_000 });
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), { url: "https://env.example", headless: false });

    const argvEnv: NodeJS.ProcessEnv = { ...process.env };
    delete argvEnv.swagLabsBaseUrl;
    delete argvEnv.headless;
    const argvResult = spawnSync(process.execPath, [
      "--import", import.meta.resolve("tsx"), "--input-type=module", "-e", script,
      "--", "probe", "--swagLabsBaseUrl=https://argv.example",
    ], { cwd: directory, env: argvEnv, encoding: "utf8", timeout: 20_000 });
    assert.ifError(argvResult.error);
    assert.equal(argvResult.status, 0, argvResult.stderr);
    assert.deepEqual(JSON.parse(argvResult.stdout), { url: "https://argv.example", headless: true });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
