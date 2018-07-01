const path = require('path');
const url = require('url');
const fs = require('fs');

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
    '.doc': 'application/msword',
    'other': 'unknow'
};


function return404(response) {
    response.writeHead(404, {'Content-Type': 'text/html'});
    response.end();//TODO:use 404.html in the future.
};

const static = {

    routemap: [], // [ [webpath,localpath1, ...], ... }
    add: function (localpath, webpath) {
        webpath = webpath || '/';
        let i = this.routemap.findIndex((ele)=>ele[0]===webpath);
        if (i===-1){
            this.routemap.push([webpath,localpath]);
        }else{
            this.routemap[i].push(localpath);
        }
    },
    do: function (request, response , redir) {
        const pathname =  redir || url.parse(request.url).pathname;
        if (pathname.indexOf('..') !== -1) {
            return404(response);
            return true;
        } else {
            return 0 <= this.routemap.findIndex((ele) => {
                if (pathname.indexOf(ele[0]) !== 0) {
                    return false;
                } else {
                    let localpaths = ele.slice(1);
                    return 0<= localpaths.findIndex(localpath => {
                        let r = path.join(localpath, pathname.slice(ele[0].length));
                        try {
                            let buffer = fs.readFileSync(r);
                            let l = r.lastIndexOf(".");
                            let ext;
                            if (l === -1) {
                                ext = 'other';                            } else {
                                ext = r.slice(l);
                            }
                            response.writeHead(200, {'Content-Type': typemap[ext]});
                            response.end(buffer);
                            return true;
                        }catch (e) {
                            return false;
                        }
                    });
                }
            });
        }
    }
};

const active = {
    routemap: {}, // {webpath: [method],<function>, ... }
    set: function (webpath, method, f) {
        f = f || method;
        method = (typeof method) === 'string' ? method : 'GET';
        this.routemap[webpath] = [method, f];
    },
    do: function (request, response, body) {
        const pathname = url.parse(request.url).pathname;
        const method = request.method;
        let result = this.routemap.hasOwnProperty(pathname);
        if (result && method === this.routemap[pathname][0]) {
            this.routemap[pathname][1](request, response, body);
            return true;
        } else {
            return false
        }
    }
};

module.exports = {
    static: static,
    active: active,
    return404: return404,
    typemap: typemap
}
