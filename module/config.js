const mysql = require("/var/www/wlp-app.com/new_app/node_modules/mysql2");

let dbConfig = {
  host: 'localhost',
  user: 'nello2',
  password: '',
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
    // console.log(msg, obj);
    // return;
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
  sheet: {
    id: "1JjUxbAomODMK9Joh8hm2TE6AWQ2SDf7tGVZPn_cAS7w",
    idBMToken: "",
    tabTemp: "spendinfo_temp",
    tabFinal: "spendinfo_final",
  },
  dataStartDate: "2022-01-01",
};
