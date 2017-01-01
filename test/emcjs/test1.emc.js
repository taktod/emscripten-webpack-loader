// c言語のソースの定義
var source = ["test/c/test1.c"];
// 利用したい関数指定
var func = {_test1: "_test1"};
// コンパイル時に利用するcflags
var cflags = [];
// コンパイル時に利用するldflags
var ldflags = [];
// emscriptenからModule = require("emc.js");を追加する。今はないので、エラー対策にいれておく。
var Module;
// 以下は必要な定義の書き出し

module.exports = Module[func._test1];
