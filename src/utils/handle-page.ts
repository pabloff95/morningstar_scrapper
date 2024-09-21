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

interface CellData {
  [key: string]: string | number;
}

const getCellsTextFromTableRows = async ({
  page,
  rowSelector,
  cellSelectors,
  orderByKey,
}: {
  page: Page;
  rowSelector: string;
  cellSelectors: { [key: string]: number };
  orderByKey: string;
}): Promise<CellData[]> => {
  await page.waitForSelector(rowSelector);
  const rowElements = await page.$$(rowSelector);

  const cellsData = await Promise.all(
    rowElements.map(async (row: any) => {
      const result: CellData = {};

      for (const [key, cellIndex] of Object.entries(cellSelectors)) {
        const element = await row.$(`td:nth-child(${cellIndex})`);
        result[key] = element
          ? await element.evaluate((el: any) => el.innerText)
          : "";
      }

      return result;
    })
  );

  cellsData.sort(
    (a, b) => (b[orderByKey] as number) - (a[orderByKey] as number)
  );

  return cellsData;
};

export {
  getText,
  getNumber,
  navigateToPage,
  getCellsTextFromTableRows,
  CellData,
};
