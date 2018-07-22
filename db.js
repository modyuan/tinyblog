/*
    operate database
 */
const sqlite = require('sqlite3').verbose();
const fs = require('fs');


exports.initTable = initTable;
exports.connDB = connDB;
exports.initDB = initDB;
exports.getArticleById = getArticleById;
exports.getArticleList = getArticleList;
exports.addArticle = addArticle;
exports.closeDB = closeDB;
exports.updateArticle=updateArticle;
exports.delArticle = delArticle;

//default database path
const DBPath = process.env.npm_package_config_DBPath;

//global db object.
var globalDB;


//when app is first to run,invoke initDB()
//before first invoke api ,run connDB()
//when app will be closed,run closeDB()

//promise object
function initTable(db) {
    return new Promise(function (resolve, reject) {
        db.exec(`    CREATE TABLE ARTICLES 
                    ( ID     INTEGER PRIMARY KEY NOT NULL,
                    DATE     INTEGER             NOT NULL,
                    TITLE    TEXT                NOT NULL,
                    CONTENT  TEXT );`, (err) => {
            if (err) {
                reject("initTable():" + err);
            } else {
                resolve();
            }
        });
    });

}

function closeDB() {
    globalDB.close();
}

//Connect to database as global var globalDB
//and it will not be closed until app exits
function connDB() {
    return new Promise(function (resolve, reject) {
        let db = new sqlite.Database(DBPath, err => {
            if (err) {
                reject(err);
            } else {
                globalDB = db;
                resolve(db);
            }
        });
    });
}

//Init database(create file and create table)
function initDB() {
    return new Promise(function (resolve, reject) {
        if (fs.existsSync(DBPath)) {
            reject({'Error': 'database is already exists!'})
        } else {
            connDB(sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE)
                .then(initTable).then(resolve).catch(reject);
        }
    });
}

//Get blog article by id,
//when succeed it return {id: [int],date: utc ms[int],title: [string],content:[string]}
//when error it return {Error:[string]} (when SQL error) , or null(when id not exist).
function getArticleById(id) {
    return new Promise(function (resolve, reject) {
        globalDB.get(`SELECT * FROM ARTICLES WHERE ID = ? `, id, (err, row) => {
            //it depends on $row ,when select get data , $row !==undefined.
            //err just occur when sql is wrong.
            if (row) {
                resolve(row);
            } else {
                reject(err);
            }
        });
    });
}

//This function is not be exported.
//whether id exists,it return nothing
function existID(id) {
    return new Promise(function (resolve, reject) {
        globalDB.get("SELECT ID FROM ARTICLES WHERE ID = ? ",
            id, (err, row) => {
                if (row) {
                    resolve();
                } else {
                    reject();
                }
            });
    });
}

//Get last [num] blog articles list
//num>0  : get latest num article
//num<=0 : get all article
//return (err,rows):rows can be emtpy array when articles is empty.
//                  err only be not null when SQL errors.
function getArticleList(num) {
    if(!num) num=0;
    return new Promise(function (resolve, reject) {
        if (num > 0) {
            globalDB.all(`SELECT ID, DATE, TITLE FROM ARTICLES \
                ORDER BY DATE DESC LIMIT ?`, num, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            })
        } else {
            globalDB.all(`SELECT ID, DATE, TITLE FROM ARTICLES \
                ORDER BY DATE DESC`, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            })
        }
    })

}

//Add a article contain title and content.id and date will be filled by app.
function addArticle(title, content) {
    return new Promise(function (resolve, reject) {
        var utc = (new Date()).getTime();
        globalDB.run(`INSERT INTO ARTICLES VALUES(NULL, ?, ?, ?);`,
            [utc, title, content], err => {
                if (err) {
                    reject(err);
                } else {
                    globalDB.get(`SELECT ID FROM ARTICLES WHERE DATE = ?`,utc,(err,row)=>{
                       resolve(row);
                    });
                }
            });
    });
}

function updateArticle(id, title, content) {
    return new Promise(function (resolve, reject) {
        var utc = (new Date()).getTime();
        globalDB.run(`UPDATE ARTICLES SET DATE = ? ,
                      TITLE = ? , CONTENT = ? WHERE ID = ?;`
            , utc, title, content, id, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
    });
}


//Delete a article by id.
//reject will be invoke when article is not exist or fail to delete.
function delArticle(id) {
    return new Promise(function (resolve, reject) {
        existID(id).then(() => {
            globalDB.run("DELETE FROM ARTICLES WHERE ID = ? ", id);
            existID(id).then(() => {
                reject({"Error": "Fail to delete article!","type":0});
            }).catch(() => {
                resolve();
            });
        }).catch(() => {
            reject({"Error": "The article is not exists!","type":1});
        });
    });
}