export default {
  paths: ["features/e2e/"],
  import: [
    "step-definitions/e2e/support/world.ts",
    "step-definitions/e2e/support/support.ts",
    "step-definitions/e2e/*.step.ts",
  ],
  format: ["allure-cucumberjs/reporter"],
  formatOptions: {
    snippetInterface: "async-await",
    resultsDir: "allure-results",
  },
  parallel: 3,
  retry: 2,
};
