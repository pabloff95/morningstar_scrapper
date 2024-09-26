import puppeteer from "puppeteer";
import { getText, getNumber, navigateToPage, getCellsTextFromTableRows, getCellsTextFromSingeRow, } from "../utils/handle-page.js";
const SELECTORS = {
    homePage: {
        headerImage: 'a[href="/"] > img',
        searchInput: 'form > div > input[type="text"]',
    },
    searchPage: {
        stockLink: ".search-all__hit > a",
    },
    stockPage: {
        stockName: "header > div > div > h1",
        topHoldingCompany: {
            row: "tbody > tr:has(> td > a)",
            cell: {
                name: 1,
                weight: 2,
                sector: 4,
            },
        },
        assetsInTopTenHoldings: ".mdc-fund-top-holdings__summary-item__mdc > span >.mdc-data-point--number",
        dividendStrategy: ".sal-snap-panel:nth-of-type(8) .sal-dp-value",
        portfolio: {
            linkButton: "li#etf__tab-portfolio > a",
            country: {
                button: "button#country",
                row: "table.sal-country-exposure__country-table > tbody > tr",
                cell: {
                    country: 1,
                    percentage: 2,
                },
            },
            totalHoldings: "div.holdings-summary:nth-of-type(1) .sal-dp-value",
            price: {
                per: {
                    row: "div.sal-measures__value-table > * tbody > tr.sal-measures__table-data:nth-of-type(1)",
                    stock: 2,
                    category: 3,
                    index: 4,
                },
                priceCashFlow: {
                    row: "div.sal-measures__value-table > * tbody > tr.sal-measures__table-data:nth-of-type(4)",
                    stock: 2,
                    category: 3,
                    index: 4,
                },
            },
        },
        performance: {
            linkButton: "li#etf__tab-performance > a",
            totalReturn: {
                row: ".mds-table__scroller__sal > table > tbody > tr:nth-of-type(1)",
                cell: {
                    yearOne: 7,
                    yearThree: 8,
                    yearFive: 9,
                    yearTen: 10,
                    yearFifteen: 11,
                },
            },
        },
        people: {
            linkButton: "li#etf__tab-people > a",
            fundingDate: "div.sal-people-summary__dps > div:nth-of-type(1)  > div.sal-pillar-dp__value--large",
        },
    },
};
var dividendStrategy;
(function (dividendStrategy) {
    dividendStrategy["DIST"] = "DIST";
    dividendStrategy["ACC"] = "ACC";
})(dividendStrategy || (dividendStrategy = {}));
const scrapMorningstar = async (stockTicket) => {
    const stockInformation = {
        name: "",
        ticket: stockTicket,
        dividend: {
            strategy: null,
            yield: null,
        },
        totalHoldings: 0,
        holdings: [],
        assetsInTopTenHoldings: 0,
        topHoldingCountries: [],
        performance: {
            yearOne: "-",
            yearThree: "-",
            yearFive: "-",
            yearTen: "-",
            yearFifteen: "-",
        },
        fundingDate: "",
        price: {
            per: {
                stock: 0,
                category: 0,
                referenceIndex: 0,
            },
            priceCashFlow: {
                stock: 0,
                category: 0,
                referenceIndex: 0,
            },
        },
    };
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
    });
    const page = await browser.newPage();
    // Navigate and click on search list item
    await page.goto(`https://www.morningstar.com/search?query=${stockTicket}`);
    await page.waitForSelector(SELECTORS.searchPage.stockLink);
    await page.click(SELECTORS.searchPage.stockLink);
    // Collect data from the stock page
    // - Title
    stockInformation.name = await getText({
        page,
        selector: SELECTORS.stockPage.stockName,
    });
    // - Dividend strategy and yield
    const dividendTwelveMonthsYield = await getText({
        page,
        selector: SELECTORS.stockPage.dividendStrategy,
    });
    stockInformation.dividend = {
        strategy: dividendTwelveMonthsYield === "—"
            ? dividendStrategy.ACC
            : dividendStrategy.DIST,
        yield: dividendTwelveMonthsYield === "—"
            ? null
            : parseFloat(dividendTwelveMonthsYield),
    };
    // - Top holding companies
    stockInformation.holdings = await getCellsTextFromTableRows({
        page,
        rowSelector: SELECTORS.stockPage.topHoldingCompany.row,
        cellSelectors: {
            name: SELECTORS.stockPage.topHoldingCompany.cell.name,
            portfolioWeight: SELECTORS.stockPage.topHoldingCompany.cell.weight,
            sector: SELECTORS.stockPage.topHoldingCompany.cell.sector,
        },
        orderByKey: "portfolioWeight",
    });
    // - Assets on top 10 holdings
    stockInformation.assetsInTopTenHoldings = await getNumber({
        page,
        selector: SELECTORS.stockPage.assetsInTopTenHoldings,
    });
    // - Navigate to performance sub-tab and get the performance track
    await navigateToPage({
        page,
        selector: SELECTORS.stockPage.performance.linkButton,
    });
    stockInformation.performance = await getCellsTextFromSingeRow({
        page,
        rowSelector: SELECTORS.stockPage.performance.totalReturn.row,
        cellSelectors: {
            yearOne: SELECTORS.stockPage.performance.totalReturn.cell.yearOne,
            yearThree: SELECTORS.stockPage.performance.totalReturn.cell.yearThree,
            yearFive: SELECTORS.stockPage.performance.totalReturn.cell.yearFive,
            yearTen: SELECTORS.stockPage.performance.totalReturn.cell.yearTen,
            yearFifteen: SELECTORS.stockPage.performance.totalReturn.cell.yearFifteen,
        },
    });
    // - Navigate to parent sub-tab and get the funding year
    await navigateToPage({
        page,
        selector: SELECTORS.stockPage.people.linkButton,
    });
    stockInformation.fundingDate = await getText({
        page,
        selector: SELECTORS.stockPage.people.fundingDate,
    });
    // - Navigate to portfolio sub-tab and get the country weights
    await navigateToPage({
        page,
        selector: SELECTORS.stockPage.portfolio.linkButton,
    });
    await page.waitForSelector(SELECTORS.stockPage.portfolio.country.button);
    const countryButton = await page.$(SELECTORS.stockPage.portfolio.country.button);
    await (countryButton === null || countryButton === void 0 ? void 0 : countryButton.evaluate((b) => b.click()));
    stockInformation.topHoldingCountries = await getCellsTextFromTableRows({
        page,
        rowSelector: SELECTORS.stockPage.portfolio.country.row,
        cellSelectors: {
            name: SELECTORS.stockPage.portfolio.country.cell.country,
            percentage: SELECTORS.stockPage.portfolio.country.cell.percentage,
        },
        orderByKey: "topHoldingCountries",
    });
    stockInformation.price.per = await getCellsTextFromSingeRow({
        page,
        rowSelector: SELECTORS.stockPage.portfolio.price.per.row,
        cellSelectors: {
            stock: SELECTORS.stockPage.portfolio.price.per.stock,
            category: SELECTORS.stockPage.portfolio.price.per.category,
            referenceIndex: SELECTORS.stockPage.portfolio.price.per.index,
        },
    });
    stockInformation.price.priceCashFlow = await getCellsTextFromSingeRow({
        page,
        rowSelector: SELECTORS.stockPage.portfolio.price.priceCashFlow.row,
        cellSelectors: {
            stock: SELECTORS.stockPage.portfolio.price.priceCashFlow.stock,
            category: SELECTORS.stockPage.portfolio.price.priceCashFlow.category,
            referenceIndex: SELECTORS.stockPage.portfolio.price.priceCashFlow.index,
        },
    });
    // - Get total holdings
    stockInformation.totalHoldings = await getNumber({
        page,
        selector: SELECTORS.stockPage.portfolio.totalHoldings,
    });
    await page.screenshot({ path: "./output/screenshot.png" }); // TODO: keep this only temporary for debugging purposes, remove when finished
    await browser.close();
    return stockInformation;
};
export default scrapMorningstar;
