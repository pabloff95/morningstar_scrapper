import scrapMorningstar, { StockInformation } from "./scrappers/morningstar.js";
import stockInformationToJson from "./utils/sock-information-to-json.js";

const initialiseScrapper: () => void = async () => {
  const stockTicket: string = "EXV4";
  const stockInformation: StockInformation = await scrapMorningstar(
    stockTicket
  );

  stockInformationToJson({ stockInformation, stockTicket });
};

initialiseScrapper();
