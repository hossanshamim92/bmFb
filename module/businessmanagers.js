const { google } = require("googleapis");
const { conn, pushError, sheet } = require("./config");

async function main() {
  const auth = new google.auth.GoogleAuth({
    keyFile: "./src/json/config.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets",
  });

  const authClientObject = await auth.getClient();
  const googleSheetsInstance = google.sheets({
    version: "v4",
    auth: authClientObject,
  });

  const readData = await googleSheetsInstance.spreadsheets.values.get({
    auth,
    spreadsheetId: sheet.id,
    range: "BMTOKEN!A:C",
  });

  if (Object.keys(readData.data.values).length > 0) {
    let sheet = readData.data.values;
    let row = sheet.shift();

    sheet.forEach(function (item, index) {
      let bm_name = item[0];
      let account_id = item[1];
      let token = item[2];

      let searchSql = `SELECT * FROM business_managers WHERE account_id='${account_id}'`;
      let inSql =
        "INSERT INTO `business_managers`(`bm_name`,`account_id`,`token`) VALUES (?, ?, ?)";
      let inVal = [bm_name, account_id, token];
      conn.query(searchSql, (queryErr, rows) => {
        if (queryErr) {
          pushError("business_managers: Error fetching:", queryErr.message);
          return;
        }

        if (rows.length == 0) {
          conn.query(inSql, inVal, (insertErr) => {
            if (insertErr) {
              pushError("business_managers: Error inserting data: ", insertErr);
            } else {
              console.log(`business_managers: Inserted for ${account_id}`);
            }
          });
        } else {
          let updateSql = `UPDATE business_managers SET bm_name = ?, token = ? WHERE account_id = ?`;
          let updateInVal = [bm_name, token, account_id];
          conn.query(updateSql, updateInVal, (queryErr, rows) => {
            if (queryErr) {
              pushError("business_managers: Error fetching:", queryErr.message);
              return;
            }

            console.log("Business Token updated for account " + account_id);
          });
        }
      });
    });
  } else {
    console.log("business_managers: No Data found");
  }
}

module.exports = {
  run: main,
};
