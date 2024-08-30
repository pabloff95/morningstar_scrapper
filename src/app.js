const puppeteer = require("puppeteer");

console.log("Initialising the app...");

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--start-maximized"],
    defaultViewport: null,
  });

  const page = await browser.newPage();
  await page.goto("https://www.idealista.com/");

  await page.screenshot({ path: "screenshot.png" });

  await browser.close();
})();
