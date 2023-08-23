const { conn, pushError } = require("./config");
const { google } = require("googleapis");

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

async function main(spreadsheetId, dbTable) {
  conn.query(`SELECT * FROM ${dbTable}`, async (isQuery, rows) => {
    if (isQuery) {
      pushError(`${dbTable} Not Fetcth tabtosheet:7 `, isQuery);
      return;
    }

    if (rows.length > 0) {
      const columnNames = Object.keys(rows[0]);

      // Prepare data rows
      const valuesToWrite = [
        columnNames,
        ...rows.map((row) => columnNames.map((column) => row[column])),
      ];

      await googleSheetsInstance.spreadsheets.values.clear({
        auth,
        spreadsheetId,
        range: "Sheet1",
      });

      const writeData = googleSheetsInstance.spreadsheets.values.append({
        auth,
        spreadsheetId,
        range: "Sheet1",
        valueInputOption: "RAW", // This interprets the input as user-entered values
        insertDataOption: "INSERT_ROWS", // This inserts the data as new rows
        resource: {
          values: valuesToWrite,
        },
      });

      writeData.then(function (res) {
        if (res.status !== 200) {
          pushError("Error: not updated. Msg : " + res.statusText);
        } else {
          console.log(`Sheet for ${dbTable} Updated`);
        }
      });
    }
  });
}

module.exports = {
  run: main,
};
