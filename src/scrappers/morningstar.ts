import puppeteer, { Browser, Page } from "puppeteer";

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
      companyCell: {
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
        companyCell: {
          country: 1,
          percentage: 2,
        },
      },
      totalHoldings: "div.holdings-summary:nth-of-type(1) .sal-dp-value",
    },
  },
};

type company = {
  name: string;
  portfolioWeight: number;
  sector: string;
};

type countryWeight = {
  name: string;
  percentage: number;
};

enum dividendStrategy {
  DIST = "DIST",
  ACC = "ACC",
}

interface StockInformation {
  name: string;
  ticket: string;
  dividend: {
    strategy: dividendStrategy | null;
    yield: number | null;
  };
  totalHoldings: number;
  holdings: company[];
  assetsInTopTenHoldings: number;
  topHoldingCountries: countryWeight[];
}

const cleanString = (text: string | null | undefined): string => {
  if (!text) {
    return "";
  }

  return text.replace(/\s+/g, " ").trim();
};

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
  await page.waitForSelector(SELECTORS.stockPage.stockName);

  stockInformation.name = await page
    .evaluate(
      (element) => element?.textContent,
      await page.$(SELECTORS.stockPage.stockName)
    )
    .then((name) => cleanString(name));

  // - Dividend strategy and yield
  await page.waitForSelector(SELECTORS.stockPage.dividendStrategy);

  const dividendTwelveMonthsYield: string = await page
    .evaluate(
      (element) => element?.textContent,
      await page.$(SELECTORS.stockPage.dividendStrategy)
    )
    .then((text) => cleanString(text));

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
  await page.waitForSelector(SELECTORS.stockPage.topHoldingCompany.row);
  const topHoldingCompanyRows = await page.$$(
    SELECTORS.stockPage.topHoldingCompany.row
  );

  stockInformation.holdings = await Promise.all(
    topHoldingCompanyRows.map(async (row) => {
      const companyName = await row.$(
        `td:nth-child(${SELECTORS.stockPage.topHoldingCompany.companyCell.name})`
      );
      const companyPortfolioWeight = await row.$(
        `td:nth-child(${SELECTORS.stockPage.topHoldingCompany.companyCell.weight})`
      );
      const companySector = await row.$(
        `td:nth-child(${SELECTORS.stockPage.topHoldingCompany.companyCell.sector})`
      );
      return {
        name: companyName
          ? await companyName.evaluate((el) => el.innerText)
          : "",
        portfolioWeight: companyPortfolioWeight
          ? parseFloat(
              await companyPortfolioWeight.evaluate((el) => el.innerText)
            )
          : 0,
        sector: companySector
          ? await companySector.evaluate((el) => el.innerText)
          : "",
      };
    })
  );
  stockInformation.holdings.sort(
    (a, b) => b.portfolioWeight - a.portfolioWeight
  );

  // - Assets on top 10 holdings
  await page.waitForSelector(SELECTORS.stockPage.assetsInTopTenHoldings);
  stockInformation.assetsInTopTenHoldings = await page
    .evaluate(
      (element) => element?.textContent,
      await page.$(SELECTORS.stockPage.assetsInTopTenHoldings)
    )
    .then((assetsPercentage) => parseFloat(assetsPercentage || ""));

  // - Navigate to portfolio sub-tab and get the country weights
  await page.click(SELECTORS.stockPage.portfolio.linkButton);

  await page.waitForSelector(SELECTORS.stockPage.portfolio.country.button);

  const countryButton = await page.$(
    SELECTORS.stockPage.portfolio.country.button
  );
  await countryButton?.evaluate((b: any) => b.click());

  await page.waitForSelector(SELECTORS.stockPage.portfolio.country.row);
  const topCountriesRows = await page.$$(
    SELECTORS.stockPage.portfolio.country.row
  );

  stockInformation.topHoldingCountries = await Promise.all(
    topCountriesRows.map(async (row) => {
      const countryName = await row.$(
        `td:nth-child(${SELECTORS.stockPage.portfolio.country.companyCell.country})`
      );
      const countryPercentage = await row.$(
        `td:nth-child(${SELECTORS.stockPage.portfolio.country.companyCell.percentage})`
      );
      return {
        name: countryName
          ? await countryName.evaluate((el) => el.innerText)
          : "",
        percentage: countryPercentage
          ? parseFloat(await countryPercentage.evaluate((el) => el.innerText))
          : 0,
      };
    })
  );
  stockInformation.topHoldingCountries.sort(
    (a, b) => b.percentage - a.percentage
  );

  // - Get total holdings
  await page.waitForSelector(SELECTORS.stockPage.portfolio.totalHoldings);

  stockInformation.totalHoldings = await page
    .evaluate(
      (element) => element?.textContent,
      await page.$(SELECTORS.stockPage.portfolio.totalHoldings)
    )
    .then((name) => parseInt(name || ""));

  await page.screenshot({ path: "./output/screenshot.png" }); // TODO: keep this only temporary for debugging purposes, remove when finished

  await browser.close();

  return stockInformation;
};

export default scrapMorningstar;
export { StockInformation };
