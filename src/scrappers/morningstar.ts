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
  },
};

type company = {
  name: string;
  portfolioWeight: number;
  sector: string;
};

interface StockInformation {
  name: string;
  ticket: string;
  holdings: company[];
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
    holdings: [],
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
  // 1- Title
  await page.waitForSelector(SELECTORS.stockPage.stockName);

  stockInformation.name = await page
    .evaluate(
      (element) => element?.textContent,
      await page.$(SELECTORS.stockPage.stockName)
    )
    .then((name) => cleanString(name));

  // 2 - Top holding companies
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

  await page.screenshot({ path: "./output/screenshot.png" }); // TODO: keep this only temporary for debugging purposes, remove when finished

  await browser.close();

  return stockInformation;
};

export default scrapMorningstar;
export { StockInformation };
