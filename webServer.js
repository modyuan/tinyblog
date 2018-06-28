const http = require('http');
const url = require('url');
const fs = require('fs');
const uuid = require("uuid/v1");
const crypto = require('crypto');
const path = require('path');
const session = require('./session');
const querystring = require("querystring");

const port = process.env.npm_package_config_webport;
module.exports = {
    run:function () {
        webserver.listen(port);
    }
}

const typemap = {
    '.ico': 'image/x-icon',
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword'
};

const salt = uuid();
const hashedPassword = md5(salt + process.env.npm_package_config_passwd)


function md5(text) {
    const hasher = crypto.createHash("md5");
    hasher.update(text);
    return hasher.digest('hex');
}

function auth(passwd) {
    return (passwd === hashedPassword)
}


function return404(response) {
    response.writeHead(404, {'Content-Type': 'text/html'});
    response.end();//TODO:use 404.html in the future.
}

var webserver = http.createServer(function (request, response) {
    const pathname = url.parse(request.url).pathname;
    var body = '';

    request.on('data', function (chunk) {
        body += chunk;
    });

    request.on('end', function () {

        if (request.method === 'GET') {
            var ccpath= path.resolve("static");
            var fpath = path.resolve(ccpath, pathname.substr(1));
            if (fpath.indexOf(ccpath)!==0){
                return404(response); // out of 'static'
                return;
            }
            var g = pathname.lastIndexOf('.');
            var ext = pathname.substr(g);

            fs.readFile(fpath, (err, data) => {
                if (err) {
                    return404(response);
                } else {
                    if (ext in typemap) {
                        response.writeHead(200, {'Content-Type': typemap[ext]});
                        response.end(data);
                    } else {
                        response.writeHead(200, {'Content-Type': 'unknowable'});
                        response.end(data);
                    }

                }
            });

        } else if (request.method === 'POST') {
            var query = querystring.parse(data);
            if (pathname === '/login' && auth(query.passwd)) {
                session.createByUser(query.user).then((uuid)=>{
                    response.writeHead(200,{'Set-Cookie': 'uuid='+uuid+";HttpOnly"});
                    response.end('OK')
                });

            } else {
                return404(response);
            }
        }
    });
    request.on('error', function (err) {
        console.error('WEB server error occurs:');
        console.error(err);
        response.writeHead(500);
        response.end();
    })

});
process.on('SIGINT', function() {
    webserver.close();
    console.error("WEB server is closed.");
})
console.error("WEB server is running at http://127.0.0.1:"+port);
