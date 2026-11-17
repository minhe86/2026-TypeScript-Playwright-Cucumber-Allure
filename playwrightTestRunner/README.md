# Playwright Test Suite with Allure Reporting

This suite runs TypeScript `.spec.ts` tests directly with Playwright Test and
reports results using `allure-playwright`. It does not use Cucumber feature
files. It shares page objects, configuration, and test data with the Cucumber
suite. See the [main README](../README.md) for setup and both runners.

## Test coverage

- **E2E:** successful and unsuccessful login, product selection, checkout, and logout.
- **API:** authentication, user creation and retrieval, and invalid registration requests using Playwright's request fixture.

The purchase journey is one test with named Playwright steps. It uses a fresh
browser context, and a retry reruns the whole journey rather than an individual
step. Reports count the journey as one test per browser project.

Browser discovery currently lists 19 tests per project: four Sauce Demo tests
(three invalid-login cases and one purchase journey) and fifteen local HTML
assertion regressions. Across the four configured projects, that is 76 test
executions, not 76 distinct scenarios. The agent seed is excluded from normal
browser runs.

Playwright applies a 60-second timeout to each test; the checkout journey has
120 seconds. There is no suite-wide timeout, so CI should enforce a job timeout.

The API tests depend on ReqRes and its current data and authentication rules.
The user creation and retrieval tests run independently. The retrieval example
uses a fixed existing ID rather than retrieving the created resource.

The Playwright API helpers read their URL from `configs/config.api.json`.
For controlled API testing, `PLAYWRIGHT_API_BASE_URL` overrides that URL.
Both values must be absolute HTTP or HTTPS URLs; an invalid override fails
without printing the URL. Login also requires non-empty `user.email` and
`user.password` values in the API configuration. The Cucumber API suite is configured
separately. The helper regression tests use a local server; they do not
validate ReqRes itself.
Run `npm run test:api:local` from the project root to execute both API suites
against that local fixture without a browser or external API.

## Run tests

From the project root, run the browser tests across all configured projects:

```sh
npm run test:pw
```

To opt in to the Playwright API tests against the configured live service:

```sh
npm run test:pw:api:live
```

The API tests run once, without the browser project matrix. Use
`npm run test:api:local` instead to run both API suites against the local fixture.

The configuration includes Firefox, Mobile Chrome, Mobile Safari, and Google
Chrome projects. Install the Playwright browsers as described in the
[main README](../README.md); the Google Chrome project requires a separate
Google Chrome installation.

To run only the installed Google Chrome project:

```sh
npm run test:pw -- --project="Google Chrome"
```

To run the local regression tests for product assertions and navigation:

```sh
npm run test:pw -- homeAssertions.spec.ts --project="Google Chrome"
```

These tests use local HTML fixtures and do not contact Sauce Demo.

## Optional Playwright Test Agents

Optional planner, generator and healer agents assist Playwright test authoring
in VS Code with Copilot. Their output requires human review; normal test runs
and CI do not invoke AI.

See the [AI assistant guide](./AI-ASSISTANT-README.md) for setup, example
prompts, safety guidance and regeneration instructions.

## Reports

- **Allure:** run `npm run report:pw` for Playwright results, or `npm run report`
  for a combined Cucumber and Playwright report. Playwright results accumulate
  in `allure-results/playwright/` at the project root.
  Use `npm run report:generate:pw` to generate a static report in
  `allure-report/playwright/`; it will not overwrite an existing report.
- **Playwright HTML:** browser results go to `playwrightTestRunner/html-results/`;
  live API results go to `playwrightTestRunner/api-html-results/`. The reporter
  opens on failure locally, but not in CI, by default. Open either manually:

  ```sh
  npx playwright show-report playwrightTestRunner/html-results
  npx playwright show-report playwrightTestRunner/api-html-results
  ```

Failure screenshots and traces are retained according to the Playwright
configuration.

## Example screenshots

- [Playwright Allure result](../screenshots/PlaywrightTestRunner_allure.png)
- [Allure device results](../screenshots/PlaywrightTestRunner_allure_devices.png)
- [Playwright HTML result](../screenshots/PlaywrightTestRunner_html.png)
- [Playwright list result](../screenshots/PlaywrightTestRunner_list.png)
