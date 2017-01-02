// webpackのentryとして使うjsファイル
var test1 = require("./emcjs/test1.emc");
test1();

var test2 = require("./emcjs/test2.emc");
console.log(test2());

var test3 = require("./entry.ts");
test3.ts();

