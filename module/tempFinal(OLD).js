const moment = require("moment");
const { conn, pushError, dataStartDate } = require("./config");

let leftAccountInfo = [];

// Function to fetch account information
async function fetchAccountInfo(accountId, token) {
  const url = `https://graph.facebook.com/v17.0/${accountId}?fields=account_status,agency_client_declaration,amount_spent,currency,end_advertiser,end_advertiser_name,funding_source,funding_source_details,fb_entity,name,owner,spend_cap,timezone_name,timezone_id&access_token=${token}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    if (error.hasOwnProperty("cause") && error.cause.hasOwnProperty("code")) {
      if (error.cause.code == "ETIMEDOUT") {
        leftAccountInfo.push({ accountId, token });
        fetchAccountInfo(accountId, token);
        return null;
      }
    }
    pushError("Error fetching account information: ", error);
    return null;
  }
}

async function fetchBMAdAccounts(bmId, token) {
  const pageSize = 1000;
  let adAccounts = [];

  let hasNextPage = true;
  let afterCursor = "";

  while (hasNextPage) {
    const url = `https://graph.facebook.com/v17.0/${bmId}/owned_ad_accounts?fields=name,account_id&limit=${pageSize}&access_token=${token}&after=${afterCursor}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.hasOwnProperty("error") && data.error != "") {
        pushError("TempFinal.js fetchBMAdAccounts Error: ", data.error);
        return adAccounts;
      } else {
        if (data.data.length > 0) {
          adAccounts = adAccounts.concat(data.data);
          afterCursor = data.paging.cursors.after;

          // Check if there are more pages
          hasNextPage = data.paging && data.paging.next;
        } else {
          console.log(`No Ad Account Found for BM ${bmId}`);
          return adAccounts;
        }
      }
    } catch (error) {
      console.error("Error fetching BMAdAccount information:", error);
      return adAccounts;
    }
  }
  return adAccounts;
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
  let perPage = 1000; // Number of items per page
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
          let twoDaysAgo = moment().subtract(3, "days"); // Was 2 made it 3 now

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

          if (moment(dateOfSpentStop, "DD/MM/YYYY").isBefore(twoDaysAgo)) {
            let checkFinal = `SELECT * FROM spendinfo_final WHERE account_name = '${accountName}' AND id_account = '${idAccount}' AND bm_name = '${bmName}' AND bm_id = '${bmId}' AND timezone = '${timezone}' AND status = '${status}' AND currency = '${currency}' AND line_credit_payment_method = '${lineCreditPaymentMethod}' AND name_line_credit = '${nameLineCredit}' AND date_of_spent_start = '${dateOfSpentStart}' AND date_of_spent_stop = '${dateOfSpentStop}'`;
            conn.query(checkFinal, (finCheckErr, finalResult) => {
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

                  // console.log(
                  //   `spendinfo_final inserted for id_account ${idAccount} bmId ${bmId}`
                  // );
                });
              }
            });

            continue;
          } else {
            let insertQuery =
              "INSERT INTO `spendinfo_temp`(`account_name`, `id_account`, `bm_name`, `bm_id`, `total_amount_spent`, `spend_cap`, `timezone`, `status`, `currency`, `line_credit_payment_method`, `name_line_credit`, `date_of_spent_start`, `date_of_spent_stop`, `spent_of_the_day`, `createdat`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            conn.query(insertQuery, values, (insertErr) => {
              if (insertErr) {
                pushError(
                  "Error inserting data into the database: ",
                  insertErr
                );
                return;
              }

              console.log(
                `spendinfo_temp inserted for id_account ${idAccount} bmId ${bmId}`
              );
            });
          }
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
      if (error.hasOwnProperty("cause") && error.cause.hasOwnProperty("code")) {
        if (error.cause.code == "ETIMEDOUT") {
          fetchSpendingData(accountId, token, startDate, endDate, otherData);
          return null;
        }
      }
      pushError("Error fetching spending data: ", error);
      return null;
    }
  }

  if (hasNextPage == true) {
    console.log(`Still processing for accountId ${accountId}`);
  } else {
    console.log(`processing is finished for accountId ${accountId}`);
  }
}

async function fetchDataAndInsert(getAccountId, token) {
  try {
    const startDate = dataStartDate;
    const endDate = moment().format("YYYY-MM-DD");

    const bmInfo = await fetchBMAdAccounts(getAccountId, token);

    if (bmInfo.length > 0) {
      const promises = bmInfo.map(async function (bmAcId) {
        let bmAcInSql =
          "SELECT * FROM `adsaccount` WHERE adAccount = ? AND bmId = ?";
        let bmAcInSqlData = [bmAcId.id, getAccountId];
        conn.query(bmAcInSql, bmAcInSqlData, async function (bmErr, bmResult) {
          if (bmErr) {
            pushError("adsaccount: check if adAccount Exist Error : ", bmErr);
            return;
          }

          if (bmResult.length == 0) {
            let createdat = moment().format("DD/MM/YYYY HH:mm");
            let sql =
              "INSERT INTO `adsaccount`(`adAccount`, `bmId`, `name`, `bmToken`, `createdat`) VALUES (?, ?, ?, ?, ?)";
            let sqlValue = [
              bmAcId.id,
              getAccountId,
              bmAcId.name,
              token,
              createdat,
            ];

            conn.query(sql, sqlValue, async function (insertErr) {
              if (insertErr) {
                pushError("adsaccount: insert ad account error: ", insertErr);
                return;
              }

              console.log(`${bmAcId.id} is inserted bm -> ${getAccountId}`);
            });
          }
        });

        const accountId = bmAcId.id;
        const accountInfo = await fetchAccountInfo(accountId, token);

        if (!accountInfo) {
          // pushError(`Account Info not found for ${accountId}`);
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
        let lineCreditPaymentMethod = accountInfo.hasOwnProperty(
          "funding_source"
        )
          ? accountInfo.funding_source
          : "noFundingSource";
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

        const deleteQueryPromise = new Promise((resolve, reject) => {
          conn.query(checkBMId, [idAccount, bmId], function (checkErr) {
            if (checkErr) {
              reject(new Error(checkErr));
            } else {
              console.log(`spendinfo_temp delted for idAccount ${idAccount}`);
              resolve();
            }
          });
        });

        try {
          await deleteQueryPromise;

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
        } catch (checkErr) {
          pushError(
            "Error deleting data for spendinginfo_temp tempFinal.js : ",
            checkErr
          );
          return;
        }
      });

      await Promise.all(promises);
    }
  } catch (error) {
    pushError("Error fetching or inserting data: ", error);
  }
}

module.exports = { fetchDataAndInsert, leftAccountInfo };
