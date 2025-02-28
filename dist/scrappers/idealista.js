import puppeteer from "puppeteer";
const SELECTORS = {
    homePage: {
        searchInput: 'form > div > input[type="text"]',
    },
};
// const waitForCallback = () => {
//   return new Promise<void>((resolve) => {
//     setTimeout(() => {
//       const pageContent = document.querySelector("#main-header * > a > img");
//       if (pageContent !== null) {
//         resolve();
//       }
//     }, 10000);
//   });
// };
// await page.waitForFunction(waitForCallback);
const scrapIdealista = async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
    });
    const page = await browser.newPage();
    await page.goto("https://www.morningstar.com/");
    await page.click(SELECTORS.homePage.searchInput);
    await page.type(SELECTORS.homePage.searchInput, "hello");
    await page.screenshot({ path: "./output/screenshot.png" });
    await browser.close();
};
export default scrapIdealista;
