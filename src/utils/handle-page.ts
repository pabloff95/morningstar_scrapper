import { Page } from "puppeteer";

const cleanString = (text: string | null | undefined): string => {
  if (!text) {
    return "";
  }

  return text.replace(/\s+/g, " ").trim();
};

const getText = async ({
  page,
  selector,
}: {
  page: Page;
  selector: string;
}): Promise<string> => {
  await page.waitForSelector(selector, { visible: true });

  return await page
    .evaluate((element) => element?.textContent, await page.$(selector))
    .then((output) => cleanString(output));
};

const getNumber = async ({
  page,
  selector,
}: {
  page: Page;
  selector: string;
}): Promise<number> => {
  await page.waitForSelector(selector, { visible: true });

  return await page
    .evaluate((element) => element?.textContent, await page.$(selector))
    .then((output) => {
      if (output) {
        return parseFloat(output);
      }

      return 0;
    });
};

const navigateToPage = async ({
  page,
  selector,
}: {
  page: Page;
  selector: string;
}): Promise<void> => {
  await page.waitForSelector(selector, {
    visible: true,
  });
  await page.click(selector);
};

export { getText, getNumber, navigateToPage };
