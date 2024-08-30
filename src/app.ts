import scrapIdealista from "./scrappers/idealista.js";

const initialiseScrapper: () => void = async () => {
  console.log("Initialising app...");

  await scrapIdealista();

  console.log("The app was executed successfully");
};

initialiseScrapper();
