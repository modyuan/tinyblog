const http = require('http');
const url = require('url');
const api = require('./api');
const db = require('./db')

exports.run = runApiServer;
const port = process.env.npm_package_config_apiport;

function unsupportedApi(response) {
    response.writeHead(404, {'Content-Type': 'application/json'});
    response.end("{'Error':'Unsupported API method'}");
}

function runApiServer() {

    db.connDB().then(() => {
        console.error("Linked to DB")
    })
        .catch((err) => {
            console.error("Fail to link DB."+err);
            process.exit(2);
        });

    var server = http.createServer(function (request, response) {
        var body = '';
        const pathname = url.parse(request.url).pathname.substr(1);

        console.log("pathname:"+pathname+",method:"+request.method);

        request.on('data', function (chunk) {
            body += chunk;
        });

        request.on('end', function () {

            console.log('data->'+body);
            response.setHeader("Access-Control-Allow-Origin","*");
            if (request.method === "GET") {

                if (api.apiList.indexOf(pathname) > -1
                    && api.apiList.indexOf(pathname) < 3) {
                    //getXXX
                    api[pathname](request, response);
                } else {
                    unsupportedApi(response);
                }


            } else if (request.method === "POST") {
                if (pathname === 'addArticle' || pathname === 'updateArticle') {
                    api[pathname](request, response, body);
                } else {
                    unsupportedApi(response);
                }


            } else if (request.method === "OPTIONS"){
                response.writeHead(200,{"Access-Control-Allow-Methods":["POST", "GET", "OPTIONS","DELETE"]});
                response.end();

            }else if (request.method === "DELETE") {
                if (pathname === 'delArticle') {
                    api.delArticle(request, response);
                } else {
                    unsupportedApi(response);
                }
            } else {
                // 不接受其他方法
                response.writeHead(405, {'Content-Type': 'application/json'});
                response.end("{'Error':'Unsupported HTTP method'}")
            }
        })

    });
    process.on('SIGINT', function() {
        server.close();
        console.error("API server is closed.");
    });

    server.on('close',()=>{
        db.closeDB();
        console.error("closed DB");
    });
    //server.on('error'(err))
    server.listen(port);
    console.error("API server is running at http://127.0.0.1:" + port.toString());
}




