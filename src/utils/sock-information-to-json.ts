import { StockInformation } from "../scrappers/morningstar";
import fs from "fs";

const stockInformationToJson: ({
  stockInformation,
  stockTicket,
}: {
  stockInformation: StockInformation;
  stockTicket: string;
    }) => void = ({ stockInformation, stockTicket }) => {
      const filePath: string = `./output/${stockTicket}-data.json`;

  fs.writeFile(filePath,JSON.stringify(stockInformation, null, 4),
    (error) => {
      if (error) {
          console.error(error);
          return;
      }

      console.log(`File saved at ${filePath}`)
    }
  );
};

export default stockInformationToJson;
