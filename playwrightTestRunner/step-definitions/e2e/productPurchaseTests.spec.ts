import _ from "lodash";
import { test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { launchAppUrl, beDirectedToPage } from './utils/common.ts';
import SideNavigationMenu from "../../../pages/components/SideNavigationMenu.ts";
import LoginPage from "../../../pages/Login.ts";
import HomePage from "../../../pages/Home.ts";
import CheckoutCartPage from "../../../pages/CheckoutCart.ts";
import CheckoutCompletePage from "../../../pages/CheckoutComplete.ts";
import CheckoutInformationPage from "../../../pages/CheckoutInformation.ts";
import CheckoutOverviewPage from "../../../pages/CheckoutOverview.ts";
import { getProducts } from "../../../data/utils.ts";
import type { Product } from "../../../data/utils.ts";
import nconf from 'nconf';
import { faker } from '@faker-js/faker';

test.describe.configure({ mode: 'serial' });
test.describe('User login, purchase products, and log out.', () => {
    let page: Page;

    test.beforeAll(async ({ browser }) => {
        const context = await browser.newContext();
        page = await context.newPage();
    });

    test.afterAll(async () => {
        await page.close();
    });

    let products: Product[];

    test(`1 - User launches SwagLabs application URL`, async () => {
        await launchAppUrl(page);
    });

    const pageName1 = 'Login';
    test(`2 - User is directed to "${pageName1}" page`, async () => {
        await beDirectedToPage(page, pageName1);
    });

    const username = nconf.get('standardUsername');
    const password = nconf.get('passwordFallUsers');
    test(`3 - User logs in the app using username "${username}" and password "${password}"`, async () => {
        const user = { "userName": username, "password": password };
        test.info().attach('Test Data:', {
            body: JSON.stringify(user),
            contentType: 'application/json',
        });

        const loginPage = await LoginPage.create(page);
        await loginPage.loginApplication(username, password);
    });

    const pageName2 = 'Home';
    test(`4 - User is directed to "${pageName2}" page`, async () => {
        await beDirectedToPage(page, pageName2);
    });

    const productIndex = 2;
    test(`5 - User verifies the product details of product "${productIndex}" on Home page`, async () => {
        const filePath = "data/products.csv";
        products = await getProducts(filePath);
        const selectedProduct = _.find(products, { productNo: productIndex });
        if (!selectedProduct) {
            throw new Error(`Product ${productIndex} not found in ${filePath}`);
        }
        test.info().attach('Test Data:', {
            body: JSON.stringify(selectedProduct),
            contentType: 'application/json',
        });

        const homePage = await HomePage.create(page);
        await homePage.verifyProductDetails(selectedProduct);
    });

    const productsIndex = [0, 2];
    test(`6 - User adds products "[${productsIndex}]" to the cart`, async () => {
        const toSelectProducts = products.filter((product, index) => productsIndex.includes(index));

        const homePage = await HomePage.create(page);
        for (const toSelectProduct of toSelectProducts) {
            await homePage.addProductToCart(toSelectProduct);
            if (!toSelectProduct.selected) {
                toSelectProduct.selected = true;
            }
        }
        test.info().attach('Test Data:', {
            body: JSON.stringify(toSelectProducts),
            contentType: 'application/json',
        });
    });

    test(`7 - User navigates to checkout`, async () => {
        const homePage = await HomePage.create(page);
        await homePage.navigateToShoppingCart();
    });

    const pageName3 = 'Checkout Cart';
    test(`8 - User is directed to "${pageName3}" page`, async () => {
        await beDirectedToPage(page, pageName3);
    });

    test(`9 - User can see details on "${pageName3}" page`, async () => {
        const checkoutCartPage = await CheckoutCartPage.create(page);
        const selectedProducts = _.filter(products, ['selected', true]);
        await checkoutCartPage.verifyPageDetails(selectedProducts);
    });

    test(`10 - User checkouts products`, async () => {
        const checkoutCartPage = await CheckoutCartPage.create(page);
        await checkoutCartPage.checkout();
    });

    const pageName4 = 'Checkout Information';
    test(`11 - User is directed to "${pageName4}" page`, async () => {
        await beDirectedToPage(page, pageName4);
    });

    test(`12 - User inputs user information`, async () => {
        const checkoutFirstName = faker.person.firstName();
        const checkoutLastName = faker.person.lastName();
        const checkoutZipCode = faker.location.zipCode();
        const checkoutInformationPage = await CheckoutInformationPage.create(page);
        await checkoutInformationPage.inputInformation(checkoutFirstName, checkoutLastName, checkoutZipCode);
        await checkoutInformationPage.clickContinue();
    });

    const pageName5 = 'Checkout Overview';
    test(`13 - User is directed to "${pageName5}" page`, async () => {
        await beDirectedToPage(page, pageName5);
    });

    test(`14 - User can see details on "${pageName5}" page`, async () => {
        const checkoutOverviewPage = await CheckoutOverviewPage.create(page);
        const selectedProducts = _.filter(products, ['selected', true]);
        await checkoutOverviewPage.verifyPageDetails(selectedProducts);
    });

    test(`15 - User completes the purchase`, async () => {
        const screenshot = await page.screenshot();
        test.info().attach('Screenshot:', {
            body: screenshot,
            contentType: 'image/png',
        });
        const selectedProducts = _.filter(products, ['selected', true]);
        test.info().attach('Test Data:', {
            body: JSON.stringify(selectedProducts),
            contentType: 'application/json',
        });

        const checkoutOverviewPage = await CheckoutOverviewPage.create(page);
        await checkoutOverviewPage.clickFinish();
    });

    const pageName6 = 'Checkout Complete';
    test(`16 - User is directed to "${pageName6}" page`, async () => {
        await beDirectedToPage(page, pageName6);
    });

    test(`17 - User backs to Home Page`, async () => {
        const checkoutCompletePage = await CheckoutCompletePage.create(page);
        await checkoutCompletePage.clickBackHome();
    });

    test(`18 - User logs out`, async () => {
        const homePage = await HomePage.create(page);
        await homePage.navigateToSideMenu();

        const sideNavigationMenu = await SideNavigationMenu.create(page);
        await sideNavigationMenu.logout();
    });

    test(`19 - User is directed to "${pageName1}" page again`, async () => {
        await beDirectedToPage(page, pageName1);
    });

});
