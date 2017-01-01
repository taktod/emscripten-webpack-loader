// loaderの本体
/*
 * 動作はloaderの開始時に同じwebpackの動作を実行し、情報を収集
 * 収集のプロセスがおわったら、本家の動作でemscriptenで出力したデータを結合する。
 * というもの。
 */
// ファイルの出入力を扱うのに使う。
var fs = require("fs");
// 別プロセスを実行するのに使います。
var exec = require("child_process").execSync;
// パスの解決とかで利用
var path = require("path");
// loaderUtilsを使ってwebpackのloaderの情報を参照する。
var loaderUtils = require("loader-utils");

// 現在のプロセスがcheck動作か否かの判定
var checkFlag = true;
// 初アクセスであるかの判定
var firstFlag = true;
// funcデータの書き出しで利用するwriteStream
var funcstream = null;
// ldflagsの書き出しで利用するwriteStream
var ldflagsstream = null;
// ファイルがあるかどうか判定関数
function isExistFile(file) {
  try {
    fs.statSync(file);
    return true
  } catch(err) {
    if(err.code === 'ENOENT') return false
  }
};
function arrayRemove(array, element) {
  var idx = array.indexOf(element);
  if(idx == -1) {
    return array;
  }
  return array.splice(idx, 1);
}
// .emscripten_loaderの作業ディレクトリがない場合
if(!isExistFile(".emscripten_loader")) {
  try {
    // 作業ディレクトリを作る。
    exec("mkdir .emscripten_loader");
    exec("mkdir .emscripten_loader/o");
    exec("mkdir .emscripten_loader/js");
  }
  catch(e) {
  }
}
// ロックされているかで判定する。lockない -> 親プロセス
// lockある -> 子プロセス(check用)
if(!isExistFile(".emscripten_loader/lock")) {
  checkFlag = false; // チェックしない。
  try {
    // とりあえずクリアしておく。
    exec("rm .emscripten_loader/o/* 2>/dev/null");
    exec("rm .emscripten_loader/js/* 2>/dev/null");
  }
  catch(e) {
  }
  // post_jsで追加するentry.jsを作っておく。
  exec("echo \"module.exports = Module;\" > .emscripten_loader/js/entry.js");
  // lock用ファイルつくっておく。
  exec("touch .emscripten_loader/lock");
  // 現状と同じプロセスを実行する。
  // ここで-wとか--watchが付いているコンパイルがくると、応答が帰ってこなくなって死ぬ。
  // 他にも撤去すべき引数あるかもしれないけど、とりあえず放置
  var out = "" + exec(arrayRemove(arrayRemove(process.argv, "-w"), "--watch").join(" "));
  // 前の処理がおわったので、ロックを撤去(中途でプロセスが殺されるとlockが消えないのでまずいね。)
//  console.log(out);
  exec("rm .emscripten_loader/lock");
  // emcc test.o test2.o -o hoge.js -s EXPORTED_FUNCTIONS="['_test', '_test2']" -O2 --post-js src/entry.js
  // こういう感じのをつくる必要がある。
  // コマンドを実行
  exec("emcc " + ("" + exec("find .emscripten_loader/o -name \"*.o\"")).split("\n").join(" ") + " -o .emscripten_loader/js/emc.js -s EXPORTED_FUNCTIONS=\"[" + exec("cat .emscripten_loader/funcs.txt") + "]\" -O2 --post-js .emscripten_loader/js/entry.js");
  // jsとjs.memができるはず。js.memは出力jsと同じところにおいときたい。
}
else {
  // チェックプロセスでは、exportするfuncsと結合コンパイルに必要となる。ldflagsを収集しておく必要がある。
  // あとemccでoファイルをつくる。
  funcstream = fs.createWriteStream(".emscripten_loader/funcs.txt");
  ldflagsstream = fs.createWriteStream(".emscripten_loader/ldflags.txt");
}

// 実際のloaderの動作
module.exports = function(source) {
  this.cacheable(); // よくわからないけど、cacheableにしとく。
  if(checkFlag) {
    // チェック動作の場合
    try {
      try {
        // sourceを実行する。jsであることを期待する。
        eval(source);
        // source、func、cflags、ldflagsがあることを期待しておく。
      }
      catch(e) {
      }
      // 実行パスを確認しておく。
      var basepath = loaderUtils.interpolateName(this, "[path]", {context: this.options.context})
      var precommand = "";
      if(basepath.match(/node_modules\/^\/+/)) {
        precommand = "cd " + basepath.match(/^node_modules\/[^\/]+/)[0] + ";";
      }
      // emccを実行してoファイルをつくっておく。
      exec(precommand + "emcc " + source.join(" ") + " -o " + process.env["PWD"] + "/.emscripten_loader/o/" + loaderUtils.interpolateName(this, "[name]", {context: this.options.context}) + ".o " + cflags.join(" "));
      // funcの中身はobjectになってると思うので、自力でファイルに書き出しておく。
      Object.keys(func).forEach(function(f) {
        if(!firstFlag) {
          funcstream.write(",");
        }
        funcstream.write("'" + f + "'");
        firstFlag = false;
      });
      // ldflagsの中身は単なる配列なので、joinでOK
      ldflagsstream.write(ldflags.join(" ") + " ");
    }
    catch(e) {
    }
    // このプロセスでつくったデータはすぐに上書きされるはずなので、適当なコードを応答しておく。
    return "module.exports = {};";
  }
  else {
    // こっちは本番動作
    // 出力jsと同じところにemscriptenのjs.memをコピーしておく。
    // emscriptenのコンパイル後１度実行すればOKなのだが、configデータを参照する方法がわからなかったので、loaderの実行時にやってみる。
    // エラーになったときを考えてtryでくくってある。
    var targetPath = path.dirname(path.resolve(this.options["output"]["path"]) + "/" + this.options["output"]["filename"]);
    // ここで実行するコピーについて確認しなければならない。
    try {
      exec("cp .emscripten_loader/js/emc.js.mem " + targetPath);
    }
    catch(e) {
    }
    // 処理対象のjsのパスから、先頭に追加すべき、emscriptenのjsへアクセスするためのrequireを追加する。
    var target = loaderUtils.interpolateName(this, "[path]", {context: this.options.context});
    target = path.normalize(target);
    target = target.replace(/[^\/]+/g, "..");
    return "var Module = require('" + target + ".emscripten_loader/js/emc.js');\n" + source; 
  }
}
