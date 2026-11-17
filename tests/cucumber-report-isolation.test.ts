import { strict as assert } from "node:assert";
import { spawn } from "node:child_process";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";
import { startLocalApiServer } from "./support/local-api-server.ts";

test("Cucumber API reporting does not overwrite the browser report", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "cucumber-report-isolation-"));
  try {
    const server = await startLocalApiServer();
    try {
      await mkdir(join(tempDir, "configs"));
      await copyFile("configs/config.api.json", join(tempDir, "configs/config.api.json"));
      await writeFile(join(tempDir, "cucumber-report.html"), "existing browser report");

      const cucumberApi = import.meta.resolve("@cucumber/cucumber/api");
      const configFile = pathToFileURL(resolve("configs/cucumber-api.ts")).href;
      const featurePath = resolve("features/api/");
      const supportPath = resolve("step-definitions/api/support/support.ts");
      const stepPath = resolve("step-definitions/api/*.step.ts");
      const script = `
        import { loadConfiguration, runCucumber } from ${JSON.stringify(cucumberApi)};
        import config from ${JSON.stringify(configFile)};
        const { runConfiguration } = await loadConfiguration({
          file: false,
          provided: { ...config, paths: [${JSON.stringify(featurePath)}],
            import: [${JSON.stringify(supportPath)}, ${JSON.stringify(stepPath)}], retry: 0 },
        });
        const { success } = await runCucumber(runConfiguration);
        process.exitCode = success ? 0 : 1;
      `;
      const result = await new Promise<{ code: number | null; output: string }>((resolve, reject) => {
        const child = spawn(
          process.execPath,
          ["--import", import.meta.resolve("tsx"), "--input-type=module", "-e", script],
          { cwd: tempDir, env: { ...process.env, apiBaseUrl: server.baseUrl, NO_COLOR: "1" } }
        );
        let output = "";
        child.stdout.on("data", (chunk: Buffer) => { output += chunk.toString(); });
        child.stderr.on("data", (chunk: Buffer) => { output += chunk.toString(); });
        child.on("error", reject);
        child.on("close", (code) => resolve({ code, output }));
      });

      assert.equal(result.code, 0, result.output);
      assert.equal(await readFile(join(tempDir, "cucumber-report.html"), "utf8"), "existing browser report");
      const apiReport = await readFile(join(tempDir, "cucumber-api-report.html"), "utf8");
      assert.match(apiReport, /Create and retrieve a user resource/);
    } finally {
      await server.close();
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
