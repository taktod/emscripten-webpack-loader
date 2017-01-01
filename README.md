# emscripten-webpack-loader

.emc.jsの拡張子をみて、emscriptenかけてくれるwebpack_loader

# 作者
taktod <https://twitter.com/taktod>

# 概要
webpackでemscriptenを使ったコードを取り扱いたかった。
.emc.jsというjsファイルを定義しておきます。
詳しくはtestディレクトリの内部みてください。

emccにパスが通ってることが必須条件
他にもあるかな。

# .emc.jsのルール

```
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
```

# 動作概要
loaderを読み込んだ時に、webpackをもう１つ起動する。
起動したwebpackのプロセスでc言語のコンパイルと必要となる出力関数のデータ等を収集する。
本家のプロセスでems.js、ems.js.memの準備を実施し、本命のデータを作成する。

という動作
.emscripten_loaderというディレクトリを勝手につくって、そこに必要なデータを記録していく形になっている。
途中でプロセスが死んだ場合は、lockファイルが残り動作不能になる可能性がある。

# 動作テスト
このプログラムがきちんと動作するかテスト動作がはいってます。

使い方。

```
npm install
npm test
cd test
node out.js
```
これでtest1とtest2_retがきちんとcallされていればOK
