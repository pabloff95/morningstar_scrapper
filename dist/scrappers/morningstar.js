import puppeteer from "puppeteer";
const SELECTORS = {
    homePage: {
        headerImage: 'a[href="/"] > img',
        searchInput: 'form > div > input[type="text"]',
    },
    searchPage: {
        stockLink: ".search-all__hit > a",
    },
    stockPage: {
        topHoldingCompany: {
            row: "tbody > tr:has(> td > a)",
            companyCell: {
                name: 1,
                weight: 2,
                sector: 4,
            },
        },
    },
};
const scrapMorningstar = async (stock) => {
    const stockInformation = {};
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
    });
    const page = await browser.newPage();
    // Navigate and search input
    await page.goto("https://www.morningstar.com/");
    await page.waitForSelector(SELECTORS.homePage.searchInput);
    await page.click(SELECTORS.homePage.searchInput);
    await page.type(SELECTORS.homePage.searchInput, stock);
    await page.keyboard.press("Enter");
    // Click on search list item
    await page.waitForSelector(SELECTORS.searchPage.stockLink);
    await page.click(SELECTORS.searchPage.stockLink);
    // Collect data from the stock page
    // 1 - Top holding companies
    await page.waitForSelector(SELECTORS.stockPage.topHoldingCompany.row);
    const topHoldingCompanyRows = await page.$$(SELECTORS.stockPage.topHoldingCompany.row);
    stockInformation.holdings = await Promise.all(topHoldingCompanyRows.map(async (row) => {
        const companyName = await row.$(`td:nth-child(${SELECTORS.stockPage.topHoldingCompany.companyCell.name})`);
        const companyPortfolioWeight = await row.$(`td:nth-child(${SELECTORS.stockPage.topHoldingCompany.companyCell.weight})`);
        const companySector = await row.$(`td:nth-child(${SELECTORS.stockPage.topHoldingCompany.companyCell.sector})`);
        return {
            name: companyName
                ? await companyName.evaluate((el) => el.innerText)
                : "",
            portfolioWeight: companyPortfolioWeight
                ? parseFloat(await companyPortfolioWeight.evaluate((el) => el.innerText))
                : 0,
            sector: companySector
                ? await companySector.evaluate((el) => el.innerText)
                : "",
        };
    }));
    await page.screenshot({ path: "./output/screenshot.png" }); // TODO: keep this only temporary for debugging purposes, remove when finished
    await browser.close();
    return stockInformation;
};
export default scrapMorningstar;
