const db = require("./db");

db.initDB()
    .then(() => {
        console.log("Init DB succeed.")
    })
    .catch((err) => {
        console.error("Fail to init DB, " + err);
        process.exit(2);
    });
