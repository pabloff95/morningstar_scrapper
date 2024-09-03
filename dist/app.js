import scrapMorningstar from "./scrappers/morningstar.js";
const initialiseScrapper = async () => {
    console.log("Initialising app...");
    const stockInformation = await scrapMorningstar("EXV4");
    console.log(stockInformation);
    console.log("The app was executed successfully");
};
initialiseScrapper();
