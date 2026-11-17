import { strict as assert } from "node:assert";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";

function generate(cwd: string, mode: string) {
  return new Promise<{ code: number | null; output: string }>((resolveRun, reject) => {
    const child = spawn(process.execPath, [
      "--import", resolve("node_modules/tsx/dist/loader.mjs"),
      resolve("scripts/generate-allure-report.ts"),
      mode,
    ], { cwd });
    let output = "";
    child.stdout.on("data", (chunk: Buffer) => { output += chunk.toString(); });
    child.stderr.on("data", (chunk: Buffer) => { output += chunk.toString(); });
    child.once("error", reject);
    child.once("close", (code) => resolveRun({ code, output }));
  });
}

test("static report generation rejects invalid or missing results", async () => {
  const directory = await mkdtemp(join(tmpdir(), "allure-report-input-"));
  try {
    const invalid = await generate(directory, "invalid");
    assert.notEqual(invalid.code, 0);
    assert.match(invalid.output, /Report mode must be/);

    const missing = await generate(directory, "cucumber");
    assert.notEqual(missing.code, 0);
    assert.match(missing.output, /Allure results directory not found/);

    await mkdir(join(directory, "allure-results", "cucumber"), { recursive: true });
    await writeFile(join(directory, "allure-results", "cucumber", "test-result.json"), "{}");
    await mkdir(join(directory, "allure-results", "playwright"));
    const empty = await generate(directory, "combined");
    assert.notEqual(empty.code, 0);
    assert.match(empty.output, /No Allure results found in allure-results[/\\]playwright/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
