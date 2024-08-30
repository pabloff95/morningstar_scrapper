import puppeteer from "puppeteer";
const scrapIdealista = async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
    });
    const page = await browser.newPage();
    await page.goto("https://www.idealista.com/");
    await page.screenshot({ path: "screenshot.png" });
    await browser.close();
};
export default scrapIdealista;
