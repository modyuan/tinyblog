/*
    api for front-end to invoke
 */
const db = require("./db.js");
const util = require("util");
const url = require("url");
const querystring = require('querystring');
const session = require('./session.js');
const router = require('./router.js');
const uuid = require('uuid/v1');
const crypto = require('crypto');


const salt = uuid();
const hashedPassword = '123456';//md5(salt + process.env.npm_package_config_passwd);
const myuser = process.env.npm_package_config_user;
const jsonHeader = {'Content-Type': 'application/json'};

function md5(text) {
    var hasher = crypto.createHash("md5");
    hasher.update(text);
    return hasher.digest('hex');
}


module.exports = {
    apiList: ['getArticleList', 'getArticleSum', 'getArticleById'
        , 'addArticle', 'updateArticle', 'delArticle', 'login', 'logout'],
    //get
    getArticleList: getArticleList,
    getArticleSum: getArticleSum,
    getArticleById: getArticleById,

    //post
    addArticle: addArticle,
    updateArticle: updateArticle,

    //delete
    delArticle: delArticle,
    login: login,
    logout: logout
};


//GET
function getArticleList(request, response) {
    let num = url.parse(request.url, true).query.num;
    if (!num) num = 0;
    db.getArticleList(num)
        .then(rows => {
            response.writeHead(200, jsonHeader);
            response.end(JSON.stringify(rows));
        })
        .catch(err => {
                response.writeHead(500, jsonHeader);
                response.end({'Error': 'SQL error', 'Detail': JSON.stringify(err)});
            }
        );
}

//GET just for test
function getArticleSum(request, response) {
    db.getArticleList()
        .then(rows => {
            let sum = rows.length;
            response.writeHead(200, jsonHeader);
            response.end(util.format('{"sum":%d}', sum));
        })
        .catch(err => {
                response.writeHead(500, jsonHeader);
                response.end({'Error': 'SQL error', 'Detail': JSON.stringify(err)});
            }
        );
}

//GET
function getArticleById(request, response) {
    let query = url.parse(request.url, true).query;
    db.getArticleById(query["id"])
        .then(msg => {
            response.writeHead(200, jsonHeader);
            response.end(JSON.stringify(msg));
        })
        .catch(err => {
            if (!err) {
                response.writeHead(404, jsonHeader);
                response.end(JSON.stringify({'Error': 'Can not find the article.'}));
            } else {
                response.writeHead(500, jsonHeader);
                response.end({'Error': 'SQL error', 'Detail': JSON.stringify(err)}); //SQL error
            }

        })
}

//POST
//need extra var data of all client post
//receive json {title:<title>,content:<content>}
function addArticle(request, response, data) {
    logined(request)
        .then(() => {
            let query=JSON.parse(data);
            if (query.title !== undefined && query.content !== undefined
                && query.title.length > 0 && query.content.length > 0) {
                db.addArticle(query.title, query.content)
                    .then((newid) => {
                        response.writeHead(200, jsonHeader);
                        response.end(JSON.stringify({id:newid.ID}));
                    })
                    .catch((err) => {
                        response.writeHead(500, jsonHeader);
                        response.end(JSON.stringify(err));
                    });

            } else {
                response.writeHead(400, jsonHeader);
                response.end("{'Error':'Invalid parameter'}");
            }
        })
        .catch(() => {
            response.writeHead(403);
            response.end();
        })

}

//POST
//need extra var data of all client post
//receive json {id:<id>,title:<title>,content:<content>}
function updateArticle(request, response, data) {
    logined(request)
        .then(() => {
            let query=JSON.parse(data);
            if (query.title !== undefined && query.content !== undefined && query.id !== undefined
                && query.title.length > 0 && query.content.length > 0 && query.id > 0) {
                db.updateArticle(query.id, query.title, query.content)
                    .then(() => {
                        response.writeHead(200);
                        response.end();
                    })
                    .catch((err) => {
                        response.writeHead(500, jsonHeader);
                        response.end({'Error': 'SQL error', 'Detail': JSON.stringify(err)});
                    });

            } else {
                response.writeHead(400, jsonHeader);
                response.end("{'Error':'Invalid parameter'}");
            }

        })
        .catch(() => {
            response.writeHead(403);
            response.end();
        });


}

//TODO：https
//POST
function login(request, response, data) {
    var query = querystring.parse(data);
    logined(request)
        .then((user,id)=>{
                response.writeHead(200,jsonHeader);
                response.end(JSON.stringify({Message:"Has already logined.",user,logined:true}));

        })
        .catch(()=>{
            if (query.user !== undefined && query.passwd !== undefined
                && query.user === myuser && query.passwd === hashedPassword) {
                session.createByUser(query.user).then((uuid) => {
                    response.setHeader("Set-Cookie","uuid="+uuid+"; Path=/; Max-Age="+session.cookieExpiration/1000+"; HttpOnly");
                    response.writeHead(200);
                    response.end(JSON.stringify({Message:"login succeed.",user:query.user,logined:false}));
                });

            } else {//user or password wrong.
                response.writeHead(400, jsonHeader);
                response.end('{"Error":"Wrong username or password!"} ');
            }
        })

}

//GET
function logout(request, response) {
    logined(request)
        .then((user, id) => {
            session.deleteUserById(id);
            response.setHeader('Set-Cookie', 'uuid=0; Max-Age=0; Path=/; HttpOnly');
            response.writeHead(200);
            response.end();

        })
        .catch(() => {
            response.setHeader('Set-Cookie', 'uuid=0; Max-Age=0; Path=/; HttpOnly');
            response.writeHead(403);
            response.end();
        });
}

//serve for other API
function logined(request) {
    return new Promise(function (resolve, reject) {
        if (request.headers.cookie) {
            let cookie = session.parseCookie(request.headers.cookie);
            if (cookie.uuid) {
                console.log(cookie.uuid);
                session.getUserById(cookie.uuid)
                    .then((user) => resolve(user, cookie.uuid))
                    .catch(() => reject());
            }else{
                reject();
            }
        }else{
            reject();
        }

    });
}

//DELETE
function delArticle(request, response) {
    logined(request).then(() => {
        let id = url.parse(request.url, true).query.id;
        if (isNaN(id)) {
            response.writeHead(400, jsonHeader);
            response.end("{'Error':'Invalid parameter'}");
            return;
        }
        db.delArticle(id)
            .then(() => {
                response.writeHead(200, jsonHeader);
                response.end();
            })
            .catch((err) => {
                    var code = (err.type === 0 ? 500 : 404);
                    response.writeHead(code, jsonHeader);
                    response.end(JSON.stringify(err));
                }
            );
    })
        .catch(() => {
            response.writeHead(403, jsonHeader);
            response.end("{'Error':'Not logged in'}");
        })

}