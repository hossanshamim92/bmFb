const moment = require("moment");
const { conn, pushError, dataStartDate } = require("./config");

const BATCH_SIZE = 20; // Number of account IDs per batch

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

async function fetchBatchAccountInfo(batch, token) {
  const batchRequests = batch.map((accountId) => {
    return {
      method: "GET",
      relative_url: `v17.0/${accountId}?fields=account_status,agency_client_declaration,amount_spent,currency,end_advertiser,end_advertiser_name,funding_source,funding_source_details,fb_entity,name,owner,spend_cap,timezone_name,timezone_id&access_token=${token}`,
    };
  });

  const url = `https://graph.facebook.com/?batch=${encodeURIComponent(
    JSON.stringify(batchRequests)
  )}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const responseData = await response.json();

    const accountInfoList = responseData.map((data) => {
      if (data.code === 200) {
        return JSON.parse(data.body);
      }
      return null;
    });

    return accountInfoList;
  } catch (error) {
    pushError("Error fetching batch account information: ", error);
    return [];
  }
}

async function fetchDataAndInsert(getAccountId, token) {
  try {
    const startDate = dataStartDate;
    const endDate = moment().format("YYYY-MM-DD");

    const bmInfo = await fetchBMAdAccounts(getAccountId, token);

    if (bmInfo.length > 0) {
      const batches = [];
      for (let i = 0; i < bmInfo.length; i += BATCH_SIZE) {
        batches.push(bmInfo.slice(i, i + BATCH_SIZE));
      }

      for (const batch of batches) {
        const accountInfoBatch = await fetchBatchAccountInfo(
          batch.map((info) => info.id),
          token
        );

        for (let i = 0; i < batch.length; i++) {
          const accountId = batch[i].id;
          const accountInfo = accountInfoBatch[i];

          if (!accountInfo) {
            pushError(`Account Info not found for ${accountId}`);
            continue;
          }

          if (accountInfo.hasOwnProperty("error") && accountInfo.error != "") {
            pushError(
              "Account Info Not Found. Error: " + accountInfo.error.message,
              accountInfo
            );
            continue;
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

          await delay(1000); // Introduce a delay to avoid rate limits
        }
      }
    }
  } catch (error) {
    pushError("Error fetching or inserting data: ", error);
  }
}

// Utility function for delaying execution
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { fetchDataAndInsert, leftAccountInfo };
