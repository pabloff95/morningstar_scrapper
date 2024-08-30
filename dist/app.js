import scrapIdealista from "./scrappers/idealista.js";
const initialiseScrapper = async () => {
    console.log("Initialising app...");
    await scrapIdealista();
    console.log("The app was executed successfully");
};
initialiseScrapper();
