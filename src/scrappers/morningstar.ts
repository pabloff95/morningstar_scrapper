import puppeteer, { Browser, Page } from "puppeteer";
import {
  getText,
  getNumber,
  navigateToPage,
  getCellsTextFromTableRows,
  getCellsTextFromSingeRow,
  CellData,
} from "../utils/handle-page.js";

interface Selectors {
  homePage: {
    [key: string]: string;
  };
  searchPage: {
    [key: string]: string;
  };
  stockPage: {
    [key: string]: any;
  };
}

const SELECTORS: Selectors = {
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
    assetsInTopTenHoldings:
      ".mdc-fund-top-holdings__summary-item__mdc > span >.mdc-data-point--number",
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
  },
};

enum dividendStrategy {
  DIST = "DIST",
  ACC = "ACC",
}

type performance = {
  yearOne: number | string;
  yearThree: number | string;
  yearFive: number | string;
  yearTen: number | string;
  yearFifteen: number | string;
};

interface StockInformation {
  name: string;
  ticket: string;
  dividend: {
    strategy: dividendStrategy | null;
    yield: number | null;
  };
  totalHoldings: number;
  holdings: CellData[];
  assetsInTopTenHoldings: number;
  topHoldingCountries: CellData[];
  performance: performance;
}

const scrapMorningstar: (
  stockTicket: string
) => Promise<StockInformation> = async (stockTicket) => {
  const stockInformation: StockInformation = {
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
  };

  const browser: Browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });
  const page: Page = await browser.newPage();

  // Navigate and search input
  await page.goto("https://www.morningstar.com/");
  await page.waitForSelector(SELECTORS.homePage.searchInput);
  await page.click(SELECTORS.homePage.searchInput);
  await page.type(SELECTORS.homePage.searchInput, stockTicket);
  await page.keyboard.press("Enter");

  // Click on search list item
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
    strategy:
      dividendTwelveMonthsYield === "—"
        ? dividendStrategy.DIST
        : dividendStrategy.ACC,
    yield:
      dividendTwelveMonthsYield === "—"
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

  // - Navigate to portfolio sub-tab and get the country weights
  await navigateToPage({
    page,
    selector: SELECTORS.stockPage.portfolio.linkButton,
  });

  await page.waitForSelector(SELECTORS.stockPage.portfolio.country.button);

  const countryButton = await page.$(
    SELECTORS.stockPage.portfolio.country.button
  );
  await countryButton?.evaluate((b: any) => b.click());

  stockInformation.topHoldingCountries = await getCellsTextFromTableRows({
    page,
    rowSelector: SELECTORS.stockPage.portfolio.country.row,
    cellSelectors: {
      name: SELECTORS.stockPage.portfolio.country.cell.country,
      percentage: SELECTORS.stockPage.portfolio.country.cell.percentage,
    },
    orderByKey: "topHoldingCountries",
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
export { StockInformation };
