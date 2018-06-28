/*
    api for front-end to invoke
 */
const db = require("./db.js");
const util = require("util");
const url = require("url");
const querystring = require('querystring');
//get
exports.getArticleList = getArticleList;
exports.getArticleSum = getArticleSum;
exports.getArticleById = getArticleById;

//post
exports.addArticle = addArticle;
exports.updateArticle = updateArticle;

//delete
exports.delArticle = delArticle;
exports.apiList = ['getArticleList', 'getArticleSum', 'getArticleById'
    , 'addArticle', 'updateArticle', 'delArticle'];

//GET
function getArticleList(request, response) {
    var num = url.parse(request.url,true).query.num;
    if (!num) num=0;
    db.getArticleList(num)
        .then((rows => {
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(rows));
        }))
        .catch((err) => {
                response.writeHead(500, {'Content-Type': 'application/json'});
                response.end(JSON.stringify(err));
            }
        );
}

//GET
function getArticleSum(request, response) {
    db.getArticleList()
        .then((rows => {
            var sum = rows.length;
            console.log("sum:"+sum);

            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(util.format('{"sum":%d}', sum));
        }))
        .catch((err) => {
                response.writeHead(500, {'Content-Type': 'application/json'});
                response.end(JSON.stringify(err));
            }
        );
}

//GET
function getArticleById(request, response) {
    var query = url.parse(request.url, true).query;
    db.getArticleById(query["id"])
        .then(msg => {
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(msg));
        })
        .catch(err => {
            if (!err) {
                response.writeHead(404, {'Content-Type': 'application/json'});
                response.end(JSON.stringify({'Error': 'Can not find the article.'}));
            }else {
                response.writeHead(500, {'Content-Type': 'application/json'});
                response.end(JSON.stringify(err)); //SQL error
            }

        })
}

//POST
//need extra var data of all client post
function addArticle(request, response, data) {
    var query = querystring.parse(data);
    if (query.title!=undefined && query.content != undefined
        && query.title.length > 0 && query.content.length > 0) {
        db.addArticle(query.title, query.content)
            .then(() => {
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end("");
            })
            .catch((err) => {
                response.writeHead(500, {'Content-Type': 'application/json'});
                response.end(JSON.stringify(err));
            });

    } else {
        response.writeHead(400, {'Content-Type': 'application/json'});
        response.end("{'Error':'Invalid parameter'}");
    }


}

//POST
//need extra var data of all client post
function updateArticle(request, response, data) {
    var query = querystring.parse(data);
    if (query.title!=undefined && query.content!=undefined && query.id!=undefined
        && query.title.length > 0 && query.content.length > 0 && query.id.length>0) {
        db.updateArticle(query.id, query.title, query.content)
            .then(() => {
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end("");
            })
            .catch((err) => {
                response.writeHead(500, {'Content-Type': 'application/json'});
                response.end(JSON.stringify(err));
            });

    } else {
        response.writeHead(400, {'Content-Type': 'application/json'});
        response.end("{'Error':'Invalid parameter'}");
    }

}

//DELETE
function delArticle(request, response) {
    var id = url.parse(request.url,true).query.id;
    if (isNaN(id)){
        response.writeHead(400, {'Content-Type': 'application/json'});
        response.end("{'Error':'Invalid parameter'}");
        return;
    }
    db.delArticle(id)
        .then(() => {
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end();
        })
        .catch((err) => {
                var code = (err.type === 0 ? 500 : 404);
                response.writeHead(code, {'Content-Type': 'application/json'});
                response.end(JSON.stringify(err));
            }
        );
}