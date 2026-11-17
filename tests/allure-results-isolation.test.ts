import { strict as assert } from "node:assert";
import { spawn } from "node:child_process";
import { copyFile, mkdir, mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";
import { startLocalApiServer } from "./support/local-api-server.ts";

function run(args: string[], cwd: string, env: NodeJS.ProcessEnv) {
  return new Promise<{ code: number | null; output: string }>((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd, env });
    let output = "";
    child.stdout.on("data", (chunk: Buffer) => { output += chunk.toString(); });
    child.stderr.on("data", (chunk: Buffer) => { output += chunk.toString(); });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, output }));
  });
}

test("Cucumber and Playwright write Allure results to separate directories", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "allure-results-isolation-"));
  try {
    const server = await startLocalApiServer();
    try {
      await mkdir(join(tempDir, "configs"));
      for (const name of ["config.api.json", "config.default.json"]) {
        await copyFile(join("configs", name), join(tempDir, "configs", name));
      }
      const env = {
        ...process.env,
        apiBaseUrl: server.baseUrl,
        PLAYWRIGHT_API_BASE_URL: server.baseUrl,
        PLAYWRIGHT_HTML_OPEN: "never",
        PLAYWRIGHT_HTML_OUTPUT_DIR: join(tempDir, "html"),
        NO_COLOR: "1",
      };

      const cucumberApi = import.meta.resolve("@cucumber/cucumber/api");
      const configFile = pathToFileURL(resolve("configs/cucumber-allure.ts")).href;
      const featurePath = resolve("features/api/");
      const supportPath = resolve("step-definitions/api/support/support.ts");
      const stepPath = resolve("step-definitions/api/*.step.ts");
      const script = `
        import { loadConfiguration, runCucumber } from ${JSON.stringify(cucumberApi)};
        import config from ${JSON.stringify(configFile)};
        const { runConfiguration } = await loadConfiguration({
          file: false,
          provided: { ...config, paths: [${JSON.stringify(featurePath)}],
            import: [${JSON.stringify(supportPath)}, ${JSON.stringify(stepPath)}],
            parallel: 0, retry: 0 },
        });
        const { success } = await runCucumber(runConfiguration);
        process.exitCode = success ? 0 : 1;
      `;
      const cucumber = await run(
        ["--import", import.meta.resolve("tsx"), "--input-type=module", "-e", script],
        tempDir,
        env
      );
      assert.equal(cucumber.code, 0, cucumber.output);

      const playwright = await run([
        resolve("node_modules/@playwright/test/cli.js"),
        "test",
        `--config=${resolve("playwrightTestRunner/configs/playwright.api-live.config.ts")}`,
        "--retries=0",
        `--output=${join(tempDir, "test-results")}`,
      ], tempDir, env);
      assert.equal(playwright.code, 0, playwright.output);

      const root = join(tempDir, "allure-results");
      const rootEntries = await readdir(root);
      assert.ok(!rootEntries.some((name) => name.endsWith("-result.json")));
      for (const runner of ["cucumber", "playwright"]) {
        const directory = join(root, runner);
        const results = (await readdir(directory)).filter((name) => name.endsWith("-result.json"));
        assert.ok(results.length > 0, `${runner} must produce Allure results`);
        for (const filename of results) {
          const result: { status: string } = JSON.parse(await readFile(join(directory, filename), "utf8"));
          assert.equal(result.status, "passed");
        }
      }
    } finally {
      await server.close();
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
