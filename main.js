/*
 * Entry of tinyBlog APP
 */
const router = require('./router');
const api = require('./api');
const http = require('http');
const db = require('./db');

const port = process.env.npm_package_config_port;

router.active.set("/api/getArticleList", api.getArticleList);
router.active.set("/api/getArticleSum", api.getArticleSum); //Deprecated
router.active.set("/api/getArticleById", api.getArticleById);

router.active.set("/api/addArticle", "POST", api.addArticle);
router.active.set("/api/updateArticle", "POST", api.updateArticle);

router.active.set("/api/delArticle", "DELETE", api.delArticle);

router.active.set("/api/login", "POST", api.login);
router.active.set("/api/logout", api.logout);

router.active.set("/","GET",(request,response)=>{router.static.do(request,response,"/index.html")});
router.static.add("static", "/");


db.connDB()
    .then(() => console.log("Linked to DB"))
    .catch((err) => {
        console.error("Fail to link DB." + JSON.stringify(err));
        process.exit(2);
    });

let server = http.createServer(function (request, response) {
    let body = '';
    console.log(request.url);

    request.on('data', chunk => body += chunk);

    request.on('end', function () {
        if (!router.active.do(request, response, body)) {
            if (!router.static.do(request, response)) {
                router.return404(response);
            }
        }
    })

});
process.on('SIGINT', function () {
    server.close();
    console.error("API server is closed.");
});

server.on('close', () => {
    db.closeDB();
    console.error("closed DB");
});

server.listen(port);
console.log("server is running at http://127.0.0.1:" + port);
