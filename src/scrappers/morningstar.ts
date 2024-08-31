import puppeteer, { Browser, Page } from "puppeteer";

interface SelectorsInterface {
  homePage: {
    [key: string]: string;
  };
}

const SELECTORS: SelectorsInterface = {
  homePage: {
    headerImage: 'a[href="/"] > img',
    searchInput: 'form > div > input[type="text"]',
  },
};

const waitForCallback: () => Promise<void> = () => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      const pageContent = document.querySelector(
        SELECTORS.homePage.headerImage
      );

      if (pageContent !== null) {
        resolve();
      }
    }, 10000);
  });
};

const scrapMorningstar: (ticket: string) => Promise<void> = async (ticket) => {
  const browser: Browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  const page: Page = await browser.newPage();
  await page.goto("https://www.morningstar.com/");

  await page.click(SELECTORS.homePage.searchInput);
  await page.type(SELECTORS.homePage.searchInput, ticket);
  await page.screenshot({ path: "./output/screenshot.png" });

  await browser.close();
};

export default scrapMorningstar;
