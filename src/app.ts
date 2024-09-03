import scrapMorningstar, { StockInformation } from "./scrappers/morningstar.js";

const initialiseScrapper: () => void = async () => {
  console.log("Initialising app...");

  const stockInformation: StockInformation = await scrapMorningstar("EXV4");

  console.log(stockInformation);

  console.log("The app was executed successfully");
};

initialiseScrapper();
