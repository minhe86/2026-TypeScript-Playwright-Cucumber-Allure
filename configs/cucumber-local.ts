export default {
  paths: ["features/e2e/"],
  import: [
    "step-definitions/e2e/support/world.ts",
    "step-definitions/e2e/support/support.ts",
    "step-definitions/e2e/*.step.ts",
  ],
  format: ["summary", "progress-bar", ["html", "cucumber-report.html"]],
  formatOptions: {
    snippetInterface: "async-await",
  },
  dryRun: false,
  retry: 2,
};
