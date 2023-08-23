const mysql = require("mysql");

let dbConfig = {
  host: "localhost",
  user: "freelancer_nayem",
  password: "Shamimhossanshamim",
  database: "bm",
};

let conn = mysql.createConnection(dbConfig);
conn.connect((err) => {
  if (err) {
    console.error("Database conn error:", err);
    return;
  }
});

module.exports = {
  conn: conn,
  pushError: function (msg, obj = false) {
    if (typeof obj === "object") {
      msg = msg + JSON.stringify(obj);
    }
    const insertQuery = `INSERT INTO error_logs (error_message, timestamp) VALUES (?, ?)`;
    const timestamp = new Date().toISOString().split("T")[0];
    const values = [msg, timestamp];

    conn.query(insertQuery, values, (insertErr) => {
      if (insertErr) {
        console.error("Error inserting data into the database:", insertErr);
        return false;
      } else {
        return true;
      }
    });
  },
  insertDataIntoDatabase: async function (query, values, callback = null) {
    return new Promise((resolve, reject) => {
      conn.query(query, values, (err, result) => {
        if (err) {
          this.pushError(query + " Error " + values);
          reject(err);
        } else {
          if (callback) {
            callback(result);
          }
          resolve(result);
        }
      });
    });
  },
  temp: {
    id: "1xCJBAq59ZdlMlF3zFttdQeftfW_fwFWaE_CcfwY89RQ",
    table: "spendinfo_temp",
  },
  final: {
    id: "1Fwd6sMUF5FY08QfLkz_a3B1bWAfHXfUO5loaeUDz6HM",
    table: "spendinfo_final",
  },
  bmMangerSheetId: "1BzMfsHXiPATFupUc2w0VIJmXXTpEKvWjKxxzm7ZGH-w",
  dataStartDate: "2023-01-01",
};
