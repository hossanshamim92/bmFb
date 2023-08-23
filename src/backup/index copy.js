const moment = require("moment");
const { google } = require("googleapis");
const { conn, pushError, sheetTempId } = require("../../module/config");

// Create the auth for google sheet
const auth = new google.auth.GoogleAuth({
  keyFile: "./src/json/config.json",
  scopes: "https://www.googleapis.com/auth/spreadsheets",
});

const authClientObject = auth.getClient();
const googleSheetsInstance = google.sheets({
  version: "v4",
  auth: authClientObject,
});

// Function to fetch account information
async function fetchAccountInfo(accountId, token) {
  const url = `https://graph.facebook.com/v17.0/${accountId}?fields=account_status,agency_client_declaration,amount_spent,currency,end_advertiser,end_advertiser_name,funding_source,funding_source_details,fb_entity,name,owner,spend_cap,timezone_name,timezone_id&access_token=${token}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    pushError("Error fetching account information: ", error);
    return null;
  }
}

// Function to fetch LegalEnity Name
async function fetchLegalEnityName(accountId, token) {
  const url = `https://graph.facebook.com/v17.0/5626516890792584?fields=legal_entity_name&access_token=${token}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    pushError("Error fetching Legal Enity Name: ", error);
    return null;
  }
}

// Function to fetch spending data for a specific account
async function fetchSpendingData(
  accountId,
  token,
  startDate,
  endDate,
  otherData
) {
  let perPage = 100; // Number of items per page
  let allData = [];
  let hasNextPage = true;
  let afterCursor = null;

  while (hasNextPage) {
    let url = `https://graph.facebook.com/v17.0/${accountId}/insights?fields=spend,date_start,date_stop&time_increment=1&time_range={"since":"${startDate}","until":"${endDate}"}&access_token=${token}&limit=${perPage}`;

    if (afterCursor) {
      url += `&after=${afterCursor}`;
    }

    try {
      const response = await fetch(url);
      const responseData = await response.json();

      if (responseData.data && responseData.data.length > 0) {
        let {
          accountName,
          idAccount,
          bmName,
          bmId,
          totalAmountSpent,
          spendCap,
          timezone,
          status,
          currency,
          lineCreditPaymentMethod,
          nameLineCredit,
        } = otherData;

        for (const entry of responseData.data) {
          let dateOfSpentStart = moment(entry.date_start).format("DD/MM/YYYY");
          let dateOfSpentStop = moment(entry.date_stop).format("DD/MM/YYYY");
          let createdat = moment().format("DD/MM/YYYY HH:mm");
          let spentOfTheDay = parseFloat(entry.spend);
          let twoDaysAgo = moment().subtract(2, "days");

          if (!isNaN(spentOfTheDay)) {
            spentOfTheDay = spentOfTheDay.toFixed(2).replace(".", ",");
          }

          if (!isNaN(totalAmountSpent) && !isNaN(spendCap)) {
            totalAmountSpent = totalAmountSpent.toFixed(2).replace(".", ",");
            spendCap = spendCap.toFixed(2).replace(".", ",");
          }

          let values = [
            accountName,
            idAccount,
            bmName,
            bmId,
            totalAmountSpent,
            spendCap,
            timezone,
            status,
            currency,
            lineCreditPaymentMethod,
            nameLineCredit,
            dateOfSpentStart,
            dateOfSpentStop,
            spentOfTheDay,
            createdat,
          ];

          let checkValueFinal = [
            accountName,
            idAccount,
            bmName,
            bmId,
            totalAmountSpent,
            spendCap,
            timezone,
            status,
            currency,
            lineCreditPaymentMethod,
            nameLineCredit,
            dateOfSpentStart,
            dateOfSpentStop,
            spentOfTheDay,
          ];

          if (moment(dateOfSpentStop, "DD/MM/YYYY").isBefore(twoDaysAgo)) {
            let checkFinal =
              "SELECT * FROM `spendinfo_final` WHERE account_name = ? AND id_account = ? AND bm_name = ? AND bm_id = ? AND total_amount_spent = ? AND spend_cap = ? AND timezone = ? AND status = ? AND currency = ? AND line_credit_payment_method = ? AND name_line_credit = ? AND date_of_spent_start = ? AND date_of_spent_stop = ? AND spent_of_the_day = ?";
            conn.query(
              checkFinal,
              checkValueFinal,
              (finCheckErr, finalResult) => {
                if (finCheckErr) {
                  pushError(
                    "Error checking data spendinfo_final:140: ",
                    finCheckErr
                  );
                  return;
                }

                if (finalResult.length == 0) {
                  let insertQuery =
                    "INSERT INTO `spendinfo_final`(`account_name`, `id_account`, `bm_name`, `bm_id`, `total_amount_spent`, `spend_cap`, `timezone`, `status`, `currency`, `line_credit_payment_method`, `name_line_credit`, `date_of_spent_start`, `date_of_spent_stop`, `spent_of_the_day`, `createdat`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                  conn.query(insertQuery, values, (insertErr) => {
                    if (insertErr) {
                      pushError(
                        "Error inserting data spendinfo_final:156 : ",
                        insertErr
                      );
                      return;
                    }
                  });
                }
              }
            );

            continue;
          }

          allData.push(values);

          let insertQuery =
            "INSERT INTO `spendinfo_temp`(`account_name`, `id_account`, `bm_name`, `bm_id`, `total_amount_spent`, `spend_cap`, `timezone`, `status`, `currency`, `line_credit_payment_method`, `name_line_credit`, `date_of_spent_start`, `date_of_spent_stop`, `spent_of_the_day`, `createdat`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
          conn.query(insertQuery, values, (insertErr) => {
            if (insertErr) {
              pushError("Error inserting data into the database: ", insertErr);
              return;
            }
          });
        }
      }

      if (
        responseData.paging &&
        responseData.paging.cursors &&
        responseData.paging.cursors.after
      ) {
        afterCursor = responseData.paging.cursors.after;
      } else {
        hasNextPage = false;
      }
    } catch (error) {
      pushError("Error fetching spending data: ", error);
      return null;
    }
  }

  // const writeData = googleSheetsInstance.spreadsheets.values.append({
  //   auth,
  //   bmMangerSheetId: sheetTempId,
  //   range: "Sheet1",
  //   valueInputOption: "RAW", // This interprets the input as user-entered values
  //   insertDataOption: "INSERT_ROWS", // This inserts the data as new rows
  //   resource: { values: allData },
  // });

  // writeData.then(function (res) {
  //   if (res.status != 200) {
  //     pushError(
  //       "Inserted But Sheet Not Updated index.js:212 : " + res.statusText
  //     );
  //     return;
  //   } else {
  //     console.log("Sheet is ready " + allData.length);
  //   }
  // });

  console.log(allData.length + " is inserted");
}

async function fetchDataAndInsert(getAccountId, token) {
  try {
    const startDate = "2023-08-10";
    const endDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const accountId = "act_" + getAccountId;
    const accountInfo = await fetchAccountInfo(accountId, token);

    if (!accountInfo) {
      return;
    }

    if (accountInfo.hasOwnProperty("error") && accountInfo.error != "") {
      pushError(
        "Account Info Not Found. Error: " + accountInfo.error.message,
        accountInfo
      );
      return;
    }

    // const legalEnityName = await fetchLegalEnityName(accountId, token);
    // if (!legalEnityName) {
    //   return;
    // }

    let accountName = accountInfo.name;
    let idAccount = accountInfo.id.replace("act_", "");
    let bmName = accountInfo.end_advertiser_name;
    let bmId = accountInfo.end_advertiser;
    let totalAmountSpent = parseFloat(accountInfo.amount_spent) / 100;
    let spendCap = parseFloat(accountInfo.spend_cap) / 100;
    let timezone = accountInfo.timezone_name;
    let status = accountInfo.account_status;
    let currency = accountInfo.currency;
    let lineCreditPaymentMethod = accountInfo.funding_source;
    let nameLineCredit = "noPermission"; //accountId?fields=legal_entity_name

    if (status == "1") {
      status = "Active";
    } else {
      status = "Disabled";
    }

    const otherData = {
      accountName,
      idAccount,
      bmName,
      bmId,
      totalAmountSpent,
      spendCap,
      timezone,
      status,
      currency,
      lineCreditPaymentMethod,
      nameLineCredit,
    };

    let checkBMId =
      "DELETE FROM `spendinfo_temp` WHERE `id_account` = ? AND `bm_id` = ?";
    conn.query(checkBMId, [idAccount, bmId], async (checkErr) => {
      if (checkErr) {
        pushError(
          "Error deleting data for spendinginfo_temp index:272: ",
          checkErr
        );
        return;
      }

      const spendingData = await fetchSpendingData(
        accountId,
        token,
        startDate,
        endDate,
        otherData
      );

      if (!spendingData) {
        return;
      }
    });
  } catch (error) {
    pushError("Error fetching or inserting data: ", error);
  }
}

const checkQuery = "SELECT * FROM `business_managers`";
conn.query(checkQuery, [], async (checkErr, rows) => {
  if (checkErr) {
    pushError("Error checking data: ", checkErr);
    return;
  }

  // Create a function to loop through rows and insert data sequentially
  const processRows = async () => {
    for (const item of rows) {
      try {
        await fetchDataAndInsert(item.account_id, item.token);
      } catch (error) {
        pushError("Error processing row: ", error);
      }
    }
  };

  // const emptyTab = "TRUNCATE spendinfo_temp";
  // conn.query(emptyTab, [], async (isEmptyError) => {
  //   if (isEmptyError) {
  //     pushError("Error TRUNCATE spendinfo_temp: ", isEmptyError);
  //     return;
  //   }

  //   await googleSheetsInstance.spreadsheets.values.clear({
  //     auth,
  //     bmMangerSheetId: sheetTempId,
  //     range: "Sheet1!A2:R",
  //   });
  // });

  // Call the function to start the sequential processing
  processRows();
});
