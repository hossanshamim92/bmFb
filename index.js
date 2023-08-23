const businessmanagers = require("./module/businessmanagers");
const { fetchDataAndInsert } = require("./module/tempFinal");
const tabToSheet = require("./module/tabtosheet");
const { conn, pushError, sheet } = require("./module/config");
const cron = require("node-cron");

async function main() {
  // // ?? Test to see if mysql table goes to google sheet
  // console.log("0 */2 * * *");
  // tabToSheet.run(sheet.tabFinal, "FINAL");
  // tabToSheet.run(sheet.tabTemp, "TEMP");
  // return;

  // // ?? Test to see if business maneger data comes to
  // await businessmanagers.run();
  // return;

  // // ?? Test facbook endpoints
  // console.log("0 * * * *");
  // const checkQuery = "SELECT * FROM `business_managers`";
  // conn.query(checkQuery, [], async (checkErr, rows) => {
  //   if (checkErr) {
  //     pushError("Error checking data: ", checkErr);
  //     return;
  //   }

  //   if (rows.length > 0) {
  //     const processRows = async () => {
  //       for (const item of rows) {
  //         try {
  //           console.log(`fetchingDataAndInsert for ${item.account_id}`);
  //           await fetchDataAndInsert(item.account_id, item.token);
  //         } catch (error) {
  //           pushError("Error processing row: ", error);
  //         }
  //       }
  //     };

  //     // Call the function to start the sequential processing
  //     processRows();
  //   } else {
  //     console.log("business_managers: No Table Data Found");
  //   }
  // });
  // return;

  const everyFiftyMins = cron.schedule("*/50 * * * *", () => {
    console.log("*/50 * * * *");
    businessmanagers.run();
  });

  const everyHour = cron.schedule("0 * * * *", () => {
    console.log("0 * * * *");
    const checkQuery = "SELECT * FROM `business_managers`";
    conn.query(checkQuery, [], async (checkErr, rows) => {
      if (checkErr) {
        pushError("Error checking data: ", checkErr);
        return;
      }

      if (rows.length > 0) {
        const processRows = async () => {
          for (const item of rows) {
            try {
              console.log(`fetchingDataAndInsert for ${item.account_id}`);
              await fetchDataAndInsert(item.account_id, item.token);
            } catch (error) {
              pushError("Error processing row: ", error);
            }
          }
        };

        // Call the function to start the sequential processing
        processRows();
      } else {
        console.log("business_managers: No Table Data Found");
      }
    });
  });

  const everyTwoHour = cron.schedule("0 */2 * * *", () => {
    console.log("0 */2 * * *");
    tabToSheet.run(sheet.tabFinal, "FINAL");
    tabToSheet.run(sheet.tabTemp, "TEMP");
  });

  // Start the cron job
  everyFiftyMins.start();
  everyHour.start();
  everyTwoHour.start();
}

main();
