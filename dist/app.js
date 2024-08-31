import scrapMorningstar from "./scrappers/morningstar.js";
const initialiseScrapper = async () => {
    console.log("Initialising app...");
    await scrapMorningstar("EXV4");
    console.log("The app was executed successfully");
};
initialiseScrapper();
