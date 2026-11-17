import { strict as assert } from "node:assert";
import { spawn } from "node:child_process";
import { test } from "node:test";

interface Spec {
  file: string;
  title: string;
  tests: { projectName: string }[];
}

interface Suite {
  specs?: Spec[];
  suites?: Suite[];
}

function listSpecs(config: string): Promise<Spec[]> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [
      "./node_modules/@playwright/test/cli.js",
      "test",
      `--config=playwrightTestRunner/configs/${config}`,
      "--list",
      "--reporter=json",
    ]);
    let output = "";
    let errors = "";
    child.stdout.on("data", (chunk: Buffer) => { output += chunk.toString(); });
    child.stderr.on("data", (chunk: Buffer) => { errors += chunk.toString(); });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Playwright discovery failed: ${errors}`));
        return;
      }
      const report: { suites: Suite[] } = JSON.parse(output);
      const collect = (suites: Suite[]): Spec[] =>
        suites.flatMap((suite) => [...(suite.specs ?? []), ...collect(suite.suites ?? [])]);
      resolve(collect(report.suites));
    });
  });
}

test("browser and API configs discover separate suites", async () => {
  const [browserSpecs, liveApiSpecs, localApiSpecs] = await Promise.all([
    listSpecs("playwright.config.ts"),
    listSpecs("playwright.api-live.config.ts"),
    listSpecs("playwright.api-local.config.ts"),
  ]);
  assert.ok(browserSpecs.length > 0);
  assert.ok(liveApiSpecs.length > 0);

  const browserFiles = new Set(browserSpecs.map((spec) => spec.file));
  const liveApiFiles = new Set(liveApiSpecs.map((spec) => spec.file));
  const localApiFiles = new Set(localApiSpecs.map((spec) => spec.file));
  assert.deepEqual(liveApiFiles, localApiFiles);
  for (const spec of liveApiSpecs) {
    assert.ok(!browserFiles.has(spec.file), "Browser tests must not include API specs");
    assert.equal(spec.tests.length, 1, "Live API tests must run only once");
    assert.equal(spec.tests[0]?.projectName, "API");
  }

  const loginSpecs = browserSpecs.filter((spec) => spec.file.endsWith("loginFailureTests.spec.ts"));
  assert.ok(loginSpecs.length >= 3, "Each invalid-login case must be discoverable as a test");
  for (const spec of loginSpecs) {
    assert.doesNotMatch(spec.title, /randomPW|secret_sauce|standard_user|randomUser|locked_out_user/);
  }
});

test("the agent seed is opt-in and uses the Google Chrome project", async () => {
  const [browserSpecs, agentSpecs] = await Promise.all([
    listSpecs("playwright.config.ts"),
    listSpecs("playwright.agents.config.ts"),
  ]);
  assert.ok(!browserSpecs.some((spec) => spec.file.endsWith("seed.spec.ts")));
  const seeds = agentSpecs.filter((spec) => spec.file.endsWith("seed.spec.ts"));
  assert.equal(seeds.length, 1);
  assert.equal(seeds[0]?.tests.length, 1);
  assert.equal(seeds[0]?.tests[0]?.projectName, "Google Chrome");
});
