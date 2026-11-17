import { spawn } from "node:child_process";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

const modes = {
  combined: ["cucumber", "playwright"],
  cucumber: ["cucumber"],
  playwright: ["playwright"],
} as const;

const mode = process.argv[2];
if (mode !== "combined" && mode !== "cucumber" && mode !== "playwright") {
  throw new Error("Report mode must be combined, cucumber, or playwright");
}

const directories = modes[mode].map((runner) => join("allure-results", runner));
for (const directory of directories) {
  let entries: string[];
  try {
    entries = await readdir(directory);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw new Error(`Allure results directory not found: ${directory}; run the corresponding test suite first`);
    }
    throw error;
  }
  if (!entries.some((entry) => entry.endsWith("-result.json"))) {
    throw new Error(`No Allure results found in ${directory}; run the corresponding test suite first`);
  }
}

const output = join("allure-report", mode);
const args = [
  "./node_modules/allure-commandline/bin/allure",
  "generate",
  ...directories,
  "--output",
  output,
];
const exitCode = await new Promise<number | null>((resolve, reject) => {
  const child = spawn(process.execPath, args, { stdio: "inherit" });
  child.once("error", reject);
  child.once("close", (code, signal) => {
    if (signal) reject(new Error(`Allure generation terminated by ${signal}`));
    else resolve(code);
  });
});
if (exitCode !== 0) {
  throw new Error(`Allure generation failed with exit code ${exitCode}`);
}
