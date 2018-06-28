const uuid = require("uuid/v1");


const sessionExpiration = 60 * 1000; // 1 minute
const cookieExpiration = 1000 * 60 * 60;// 1 hour
const globalSession = {};//{uid:{user:xx,time:xxx},uid2....}

setInterval(() => {
    var now = (new Date()).getTime();
    for (let id in globalSession) {
        if (now - id.time > sessionExpiration) {
            delete globalSession[id];
        }
    }
}, 1000 * 10); //check every 10s.

module.exports = {
    cookieExpiration:cookieExpiration,
    createByUser: function (user) {
        return new Promise(function (resolve, reject) {
            if (!user || user.length === 0) user = '匿名';
            var id = uuid();
            globalSession.id = {user: user, time: (new Date()).getTime()};
            resolve(id);
        });

    },
    getUserById: function (id) {
        return new Promise(function (resolve, reject) {
            if (globalSession.hasOwnProperty(id)) {
                //when session is used, update the expiration time
                globalSession.id.time = (new Date()).getTime();
                resolve(globalSession.id);
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
}


