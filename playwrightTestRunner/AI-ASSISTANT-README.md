# AI-Assisted Test Authoring

This project includes optional Playwright Test Agents to help plan, write and
debug browser tests. They assist a tester; their output must be reviewed.
Agents do not run automatically during normal tests or CI, and they do not
automatically repair failures.

## The agents

| Agent | Purpose | Typical output |
| --- | --- | --- |
| `playwright-test-planner` | Explore the application and identify scenarios. | A test plan. |
| `playwright-test-generator` | Create a Playwright test from a reviewed scenario. | A `.spec.ts` file. |
| `playwright-test-healer` | Investigate a failing Playwright test. | A diagnosis and possible fix. |

Their definitions are in [`.github/agents/`](../.github/agents/). The
Playwright Test MCP server in [`.vscode/mcp.json`](../.vscode/mcp.json)
provides tools for inspecting and interacting with the browser.

The [agent configuration](./configs/playwright.agents.config.ts) uses Google
Chrome in headless mode. The [seed test](./step-definitions/e2e/seed.spec.ts)
opens the Sauce Demo login page without logging in. It is excluded from normal
browser test discovery, but can be run explicitly:

```sh
npx playwright test --config=playwrightTestRunner/configs/playwright.agents.config.ts seed.spec.ts
```

Run commands from the project root. This check requires installed project
dependencies, Google Chrome and network access to Sauce Demo. See the
[main README](../README.md#prerequisites-and-setup) for setup.

## Use the agents in VS Code

Open the repository folder in VS Code, sign in to GitHub Copilot and open
Copilot Chat. Select an agent from the agent picker. VS Code may ask you to
approve starting the MCP server.

### 1. Plan scenarios

Select **`playwright-test-planner`** and provide a specific task, for example:

```text
Explore the Sauce Demo shopping cart using the project's seed test.
Create a test plan for adding and removing products. Include expected results,
negative cases and independent starting conditions.
Do not modify Cucumber features or steps.
```

The planner can explore the application and save a Markdown test plan. Review
the plan before generating tests:

- Are the scenarios useful and already covered elsewhere?
- Are the expected results correct?
- Can each scenario run independently?

### 2. Generate a test

Select **`playwright-test-generator`** and provide one scenario from the
reviewed plan:

```text
Generate one Playwright test from the reviewed shopping cart plan.

Scenario: Add a product, open the cart, remove the product, and verify that it
is no longer in the cart.

Use the project's seed test and existing page objects where appropriate.
Place the test under playwrightTestRunner/step-definitions/e2e/.
Do not modify Cucumber features or steps.
```

The generator can interact with the application and write a test. Treat the
result as a draft: review its locators, assertions, test data and independence.

### 3. Run and review the test

For example, if the generated file is named `remove-product.spec.ts`:

```sh
npm run typecheck
npm run test:pw -- playwrightTestRunner/step-definitions/e2e/remove-product.spec.ts --project="Google Chrome"
```

A passing test alone does not prove that the intended behavior is covered.
Check that its assertions verify the expected outcome.

### 4. Investigate a failing test

Select **`playwright-test-healer`** and provide the failing test and context:

```text
Investigate the failure in remove-product.spec.ts.
Identify the root cause and propose a fix. Preserve the expected behavior;
do not skip the test or weaken its assertions.
```

Review the diagnosis: a failure could be a test issue, an environment issue or
a real application defect. The healer instructions prohibit skipping, disabling
or marking a test `test.fixme()` to make it pass. If the intended behavior
cannot be preserved, the agent should stop and report its findings for review.

## Boundaries and safety

- The agents assist **Playwright Test authoring**. Cucumber features and steps
  require separate human-reviewed work.
- Instructions are guardrails, not a technical guarantee. Review every plan,
  generated test and proposed fix.
- Browser content and test context may be sent to the configured AI provider.
  Use demo data and review the provider's data-handling settings. Generated
  `.playwright-mcp/` output is ignored by Git and may contain browser data;
  review it before sharing.
- The offline regression suite checks that the MCP server starts and discovers
  the seed. It does not launch a browser, invoke AI or verify the interactive
  Copilot workflow.

## Regenerate agent definitions

After upgrading Playwright, regenerate and review the definitions. **The
generator can overwrite agent and MCP configuration files and create or
overwrite a Copilot setup workflow.** Preserve your changes first or generate
in a separate checkout:

```sh
npx playwright init-agents --loop=vscode --config=playwrightTestRunner/configs/playwright.agents.config.ts --project="Google Chrome"
```

Review the output and reapply this project's Chrome configuration, model
choice, and review/no-skip guardrails before use.

## Other optional tools

- [Playwright CLI and skills](https://github.com/microsoft/playwright-cli)
  provide browser commands for coding-agent workflows.
- [Playwright MCP](https://github.com/microsoft/playwright-mcp) provides general
  browser automation tools over MCP. It is separate from the Playwright Test
  MCP server configured here for the test agents.

Neither alternative is installed or required by this project.
