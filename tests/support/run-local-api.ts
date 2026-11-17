import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { startLocalApiServer } from "./local-api-server.ts";

function run(name: string, args: string[], env: NodeJS.ProcessEnv): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { env, stdio: "inherit" });
    child.on("error", (error) => reject(new Error(`${name} API test runner could not start`, { cause: error })));
    child.on("close", (code, signal) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${name} API test runner failed (${signal ? `signal ${signal}` : `exit ${code}`})`));
      }
    });
  });
}

const outputDir = await mkdtemp(join(tmpdir(), "local-api-results-"));
try {
  const server = await startLocalApiServer();
  try {
    const env = {
      ...process.env,
      apiBaseUrl: server.baseUrl,
      PLAYWRIGHT_API_BASE_URL: server.baseUrl,
    };

    const suites = [
      {
        name: "Cucumber",
        message: "Running Cucumber API scenarios against the local fixture...",
        args: [
          "--import", "tsx",
          "./node_modules/@cucumber/cucumber/bin/cucumber.js",
          "--import", "step-definitions/api/support/support.ts",
          "--import", "step-definitions/api/*.step.ts",
          "--format", "progress",
          "--retry", "0",
          "features/api/",
        ],
      },
      {
        name: "Playwright",
        message: "Running Playwright API tests against the local fixture...",
        args: [
          "./node_modules/@playwright/test/cli.js",
          "test",
          "--config=playwrightTestRunner/configs/playwright.api-local.config.ts",
          `--output=${outputDir}`,
        ],
      },
    ];
    const failures: unknown[] = [];
    for (const suite of suites) {
      console.log(suite.message);
      try {
        await run(suite.name, suite.args, env);
      } catch (error) {
        failures.push(error);
      }
    }
    if (failures.length > 0) {
      throw new AggregateError(failures, "Local API suites failed");
    }
  } finally {
    await server.close();
  }
} finally {
  await rm(outputDir, { recursive: true, force: true });
}
