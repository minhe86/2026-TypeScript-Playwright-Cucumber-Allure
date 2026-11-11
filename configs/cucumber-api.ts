export default {
  paths: ["features/api/"],
  import: [
    "step-definitions/api/support/support.ts",
    "step-definitions/api/*.step.ts",
  ],
  format: ["summary", "progress-bar", ["html", "cucumber-report.html"]],
  formatOptions: {
    snippetInterface: "async-await",
  },
  // format: ["allure-cucumberjs/reporter"],
  // formatOptions: {
  //   snippetInterface: "async-await",
  //   resultsDir: "allure-results",
  // },
  dryRun: false,
  retry: 2,
};
