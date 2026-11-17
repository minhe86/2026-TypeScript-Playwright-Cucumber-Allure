import { strict as assert } from "node:assert";
import { spawn } from "node:child_process";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve as resolvePath } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";
import { createReporters } from "../playwrightTestRunner/configs/reporters.ts";
import { startLocalApiServer } from "./support/local-api-server.ts";

test("HTML reports default to opening on local failure and not in CI", () => {
  const previous = process.env.CI;
  try {
    delete process.env.CI;
    assert.equal(createReporters("report")[0]?.[1]?.open, "on-failure");
    process.env.CI = "true";
    assert.equal(createReporters("report")[0]?.[1]?.open, "never");
  } finally {
    if (previous === undefined) delete process.env.CI;
    else process.env.CI = previous;
  }
});

test("browser and live API HTML reports do not overwrite each other", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "playwright-html-isolation-"));
  try {
    const server = await startLocalApiServer();
    try {
      await mkdir(join(tempDir, "configs"));
      for (const name of ["config.api.json", "config.default.json"]) {
        await copyFile(join("configs", name), join(tempDir, "configs", name));
      }
      const env: NodeJS.ProcessEnv = {
        ...process.env,
        CI: "1",
        PLAYWRIGHT_API_BASE_URL: server.baseUrl,
        PLAYWRIGHT_HTML_OPEN: "never",
        NO_COLOR: "1",
      };
      delete env.PLAYWRIGHT_HTML_OUTPUT_DIR;
      delete env.PLAYWRIGHT_HTML_REPORT;

      for (const [name, config] of [
        ["browser", "playwright.config.ts"],
        ["api", "playwright.api-live.config.ts"],
      ] as const) {
        const baseUrl = pathToFileURL(resolvePath("playwrightTestRunner/configs", config)).href;
        const wrapper = `
          import config from ${JSON.stringify(baseUrl)};
          export default { ...config, testDir: ${JSON.stringify(resolvePath("playwrightTestRunner/step-definitions/api"))},
            projects: [{ name: "API" }], workers: 1, retries: 0,
            reporter: config.reporter.filter(([name]) => name === "html") };
        `;
        const configPath = join(tempDir, "configs", `${name}.mjs`);
        await writeFile(configPath, wrapper);

        const result = await new Promise<{ code: number | null; output: string }>((resolve, reject) => {
          const child = spawn(process.execPath, [
            "--import", import.meta.resolve("tsx"),
            resolvePath("node_modules/@playwright/test/cli.js"),
            "test",
            `--config=${configPath}`,
            "--grep=creates a user resource",
            `--output=${join(tempDir, `${name}-test-results`)}`,
          ], { cwd: tempDir, env });
          let output = "";
          child.stdout.on("data", (chunk: Buffer) => { output += chunk.toString(); });
          child.stderr.on("data", (chunk: Buffer) => { output += chunk.toString(); });
          child.on("error", reject);
          child.on("close", (code) => resolve({ code, output }));
        });
        assert.equal(result.code, 0, result.output);

        if (name === "browser") {
          const report = await readFile(join(tempDir, "html-results/index.html"), "utf8");
          assert.match(report, /<!DOCTYPE html>/i);
          await writeFile(join(tempDir, "html-results/sentinel.txt"), "browser report");
        }
      }

      const apiReport = await readFile(join(tempDir, "api-html-results/index.html"), "utf8");
      assert.match(apiReport, /<!DOCTYPE html>/i);
      assert.equal(await readFile(join(tempDir, "html-results/sentinel.txt"), "utf8"), "browser report");
    } finally {
      await server.close();
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
