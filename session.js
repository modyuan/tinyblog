const uuid = require("uuid/v1");


const sessionExpiration = 60 * 1000; // 1 minute
const cookieExpiration = 1000 * 60 * 60;// 1 hour
const globalSession = {};//{uid:{user:xx,time:xxx},uid2....}

setInterval(() => {
    let now = (new Date()).getTime();
    for (let id in globalSession) {
        if (now - globalSession[id].time > sessionExpiration) {
            console.log("delete session. uid:"+id);
            delete globalSession[id];
        }
    }
}, 1000 * 10); //check every 10s.

module.exports = {
    cookieExpiration:cookieExpiration,
    createByUser: function (user) {
        return new Promise(function (resolve, reject) {
            if (!user || user.length === 0) user = '匿名';
            let id = uuid();
            globalSession.id = {user: user, time: (new Date()).getTime()};
            resolve(id);
        });

    },
    getUserById: function (id) {
        return new Promise(function (resolve, reject) {
            if (globalSession.hasOwnProperty(id)) {
                //when session is used, update the expiration time
                globalSession.id.time = (new Date()).getTime();
                resolve(globalSession.id.user);
            } else {
                reject();
            }
        });
    },
    deleteUserById: function (id) {
        return new Promise(function (resolve, reject) {
            if (globalSession.hasOwnProperty(id)) {
                delete globalSession.id;
            } else {
                reject();
            }
        });
    },
    parseCookie:function(c){
        var c2 = c.split(';');
        var out={};
        for(let i=0;i<c2.length;i++){
            c2[i]=c2[i].split('=');
            if (c2[i][0]===''){
                continue;
            }else if(c2[i].length===1){
                out[c2[i][0]]='';
            }else{
                out[c2[i][0]]=c2[i][1];
            }

        }
        return out;

    }
}


