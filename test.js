const session = require("./session");

var a=session.parseCookie("apt ; ff = 123 ; ; ;");

console.log(JSON.stringify(a));