// webpackのentryとして使うjsファイル
var test1 = require("..!./emcjs/test1.emc.js");
test1();
var test2 = require("..!./emcjs/test2.emc.js");
console.log(test2());
