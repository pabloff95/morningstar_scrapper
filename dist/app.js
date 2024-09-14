import scrapMorningstar from "./scrappers/morningstar.js";
import stockInformationToJson from "./utils/sock-information-to-json.js";
const initialiseScrapper = async () => {
    const stockTicket = "EXV4";
    const stockInformation = await scrapMorningstar(stockTicket);
    stockInformationToJson({ stockInformation, stockTicket });
};
initialiseScrapper();
