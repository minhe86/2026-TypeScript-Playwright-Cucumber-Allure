import _ from "lodash";
import { test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { launchAppUrl, beDirectedToPage } from './utils/common.ts';
import LoginPage from "../../../pages/Login.ts";

test.describe.configure({ mode: 'serial' });
test.describe('Verify Error Message for invalid users.', () => {
    let page: Page;

    test.beforeAll(async ({ browser }) => {
        const context = await browser.newContext();
        page = await context.newPage();
    });

    test.afterAll(async () => {
        await page.close();
    });

    [{ "userName": "standard_user", "password": "randomPW" }, { "userName": "randomUser", "password": "secret_sauce" }, { "userName": "locked_out_user", "password": "secret_sauce" }].forEach((user, index) => {
        const username = user.userName;
        const password = user.password;
        const pageName = 'Login';

        test(`Iteration ${index + 1} - User launches SwagLabs application URL"`, async () => {
            await launchAppUrl(page);
        });

        test(`Iteration ${index + 1} - User is directed to "${pageName}" page`, async () => {
            await beDirectedToPage(page, pageName);
        });

        test(`Iteration ${index + 1} - User logs in the app using username "${username}" and password "${password}"`, async () => {
            test.info().attach('Test Data:', {
                body: JSON.stringify(user),
                contentType: 'application/json',
            });

            const loginPage = await LoginPage.create(page);
            await loginPage.loginApplication(username, password);
        });

        test(`Iteration ${index + 1} - User can see error message for "${username}" and "${password}" on Login page`, async () => {
            const screenshot = await page.screenshot();
            test.info().attach('Screenshot:', {
                body: screenshot,
                contentType: 'image/png',
            });

            const loginPage = await LoginPage.create(page);
            await loginPage.verifyLoginErrorMessage(username, password);
        });
    });
});
