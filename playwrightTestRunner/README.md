# Playwright Test Suite with Allure Reporting

This suite runs TypeScript `.spec.ts` tests directly with Playwright Test and
reports results using `allure-playwright`. It does not use Cucumber feature
files. It shares page objects, configuration, and test data with the Cucumber
suite. See the [main README](../README.md) for setup and both runners.

## Test coverage

- **E2E:** successful and unsuccessful login, product selection, checkout, and logout.
- **API:** authentication, user creation and retrieval, and invalid registration requests using Playwright's request fixture.

The API tests depend on ReqRes and its current data and authentication rules.
The user retrieval example uses a fixed existing ID rather than retrieving the
resource created in the preceding request.

## Run tests

From the project root, run all configured projects:

```sh
npm run test:pw
```

The configuration includes Firefox, Mobile Chrome, Mobile Safari, and Google
Chrome projects. Install the Playwright browsers as described in the
[main README](../README.md); the Google Chrome project requires a separate
Google Chrome installation.

To run only the installed Google Chrome project:

```sh
npm run test:pw -- --project="Google Chrome"
```

## Reports

- **Allure:** run `npm run report` after the tests. Results are stored in
  `allure-results/` at the project root; results from previous runs may also be
  included.
- **Playwright HTML:** the report is written to
  `playwrightTestRunner/html-results/`. The reporter attempts to open it
  automatically; to open it manually from the project root, run:

  ```sh
  npx playwright show-report playwrightTestRunner/html-results
  ```

Failure screenshots and traces are retained according to the Playwright
configuration.

## Example screenshots

- [Playwright Allure result](../screenshots/PlaywrightTestRunner_allure.png)
- [Allure device results](../screenshots/PlaywrightTestRunner_allure_devices.png)
- [Playwright HTML result](../screenshots/PlaywrightTestRunner_html.png)
- [Playwright list result](../screenshots/PlaywrightTestRunner_list.png)
