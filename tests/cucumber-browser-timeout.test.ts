import { strict as assert } from "node:assert";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";

test("Cucumber browser steps use the configured timeout", async () => {
  const directory = await mkdtemp(join(tmpdir(), "cucumber-browser-timeout-"));
  try {
    await mkdir(join(directory, "configs"));
    await writeFile(join(directory, "probe.feature"), "Feature: Timeout\n  Scenario: Wait\n    Given a timeout probe waits\n");
    await writeFile(join(directory, "probe.mjs"), `
      import { Given } from ${JSON.stringify(import.meta.resolve("@cucumber/cucumber"))};
      Given("a timeout probe waits", async function () {
        await new Promise((resolve) => setTimeout(resolve, 150));
      });
    `);

    const cucumberApi = import.meta.resolve("@cucumber/cucumber/api");
    const imports = [
      resolve("step-definitions/e2e/support/world.ts"),
      resolve("step-definitions/e2e/support/support.ts"),
      resolve("step-definitions/e2e/*.step.ts"),
      join(directory, "probe.mjs"),
    ];
    const script = `
      import { loadConfiguration, loadSupport, runCucumber } from ${JSON.stringify(cucumberApi)};
      const { runConfiguration } = await loadConfiguration({
        file: false,
        provided: { paths: ["probe.feature"], import: ${JSON.stringify(imports)}, format: ["progress"], retry: 0 },
      });
      const support = await loadSupport(runConfiguration);
      const { success } = await runCucumber({
        ...runConfiguration,
        support: { ...support, beforeTestCaseHookDefinitions: [], afterTestCaseHookDefinitions: [],
          afterTestStepHookDefinitions: [] },
      });
      process.exitCode = success ? 0 : 1;
    `;
    const run = (override?: string) => new Promise<{ code: number | null; output: string }>((resolveRun, reject) => {
      const env: NodeJS.ProcessEnv = { ...process.env, NO_COLOR: "1" };
      delete env["cucumberTimeout:default"];
      if (override !== undefined) env["cucumberTimeout:default"] = override;
      const child = spawn(process.execPath, [
        "--import", import.meta.resolve("tsx"), "--input-type=module", "-e", script,
      ], { cwd: directory, env });
      let output = "";
      child.stdout.on("data", (chunk: Buffer) => { output += chunk.toString(); });
      child.stderr.on("data", (chunk: Buffer) => { output += chunk.toString(); });
      child.once("error", reject);
      child.once("close", (code) => resolveRun({ code, output }));
    });

    const configPath = join(directory, "configs", "config.default.json");
    await writeFile(configPath, JSON.stringify({ cucumberTimeout: { default: 2000 } }));
    const passes = await run();
    assert.equal(passes.code, 0, passes.output);

    const timesOut = await run("40");
    assert.equal(timesOut.code, 1, timesOut.output);
    assert.match(timesOut.output, /within 40 milliseconds/);

    await writeFile(configPath, JSON.stringify({ cucumberTimeout: { default: 40 } }));
    const configuredTimeout = await run();
    assert.equal(configuredTimeout.code, 1, configuredTimeout.output);
    assert.match(configuredTimeout.output, /within 40 milliseconds/);

    for (const value of [undefined, 0, -1, 1.5, 2_147_483_648, "secret-invalid"]) {
      await writeFile(configPath, JSON.stringify({ cucumberTimeout: { default: value } }));
      const invalid = await run();
      assert.notEqual(invalid.code, 0, invalid.output);
      assert.match(invalid.output, /cucumberTimeout\.default must be a positive integer/);
      assert.doesNotMatch(invalid.output, /secret-invalid/);
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
