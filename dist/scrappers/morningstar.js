import puppeteer from "puppeteer";
const SELECTORS = {
    homePage: {
        headerImage: 'a[href="/"] > img',
        searchInput: 'form > div > input[type="text"]',
    },
};
const waitForCallback = () => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const pageContent = document.querySelector(SELECTORS.homePage.headerImage);
            if (pageContent !== null) {
                resolve();
            }
        }, 10000);
    });
};
const scrapMorningstar = async (ticket) => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
    });
    const page = await browser.newPage();
    await page.goto("https://www.morningstar.com/");
    await page.click(SELECTORS.homePage.searchInput);
    await page.type(SELECTORS.homePage.searchInput, ticket);
    await page.screenshot({ path: "./output/screenshot.png" });
    await browser.close();
};
export default scrapMorningstar;
