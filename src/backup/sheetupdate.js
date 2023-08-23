const { google } = require("googleapis");
const { conn, pushError } = require("../../module/config");
const bmMangerSheetId = "1xCJBAq59ZdlMlF3zFttdQeftfW_fwFWaE_CcfwY89RQ";

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

  // Clear existing data (except the first row)
  await googleSheetsInstance.spreadsheets.values.clear({
    auth,
    bmMangerSheetId,
    range: "Sheet1!A2",
  });

  conn.query("SELECT * FROM spendinfo_temp", async (isQuery, rows) => {
    if (isQuery) {
      pushError(
        "Sheet not updated from spendinfo_temp sheetupdate.js:27",
        isQuery.message
      );
      return;
    }

    const valuesToWrite = rows.map((row) => [
      row.date_of_spent_stop,
      row.date_of_spent_stop,
      row.date_of_spent_stop,
      row.date_of_spent_stop,
      row.total_amount_spent,
      row.spend_cap,
      row.timezone,
      row.status,
      row.currency,
      row.line_credit_payment_method,
      row.name_line_credit,
      row.date_of_spent_start,
      row.date_of_spent_stop,
      row.spent_of_the_day,
      row.createdat,
    ]);

    const writeData = googleSheetsInstance.spreadsheets.values.append({
      auth,
      bmMangerSheetId,
      range: "Sheet1",
      valueInputOption: "USER_ENTERED", // This interprets the input as user-entered values
      insertDataOption: "INSERT_ROWS", // This inserts the data as new rows
      resource: {
        values: valuesToWrite,
      },
    });

    writeData.then(function (res) {
      if (res.status != 200) {
        pushError("Error: not updated. Msg : " + res.statusText);
      }
    });
  });
}

main();
