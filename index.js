/**
 * output json map for the runtime
 * eg:
 * {
 *    "tpl": {
 *      "demo:page/index.tpl": {
 *           "src": "/template/demo/page/index.tpl",
 *           "type": "tpl"
 *       },
 *       ...
 *    },
 *    "res": {
 *      "d41d8cd": {
 *           "src": "/static/demo/page/index.css",
 *           "type": "css",
 *           "defines": [
 *               "demo:page/index.css"
 *           ]
 *       },
 *       ...
 *    },
 *    "pkg": {
 *       "6a5a5bb": {
 *           "src": "/static/demo/pkg/aio.css",
 *           "type": "css",
 *           "defines": [
 *               "demo:widget/hehe/hehe.css",
 *               "demo:resource/css/common.css"
 *           ],
 *           "requires": [],
 *           "requireAsyncs": []
 *       },
 *       ...
 *    }
 * }
 */
'use strict';

var gutil = require('gulp-util');
var File = require('vinyl');

module.exports = function (ret, opt) {

  if (!ret)
    return;

  opt = opt || {};
  var useHash = her.config.get('useHash');
  var useDomain = her.config.get('useDomain');

  her.util.map(ret.ids, function (id, file) {
    //if file already packed, do nothing
    if (file.packed)
      return;
    if (file.release && file.useMap) {
      if (file.isJsLike || file.isCssLike) {
        var content = String(file.contents);
        var hashId = file.getHash();
        if (file.isCssLike) {
          content += "\n" + ".css_" + hashId + "{height:88px}";
          file.contents = new Buffer(content);
        }
        var res = ret.map.res[hashId] = {
          src: file.getUrl(useHash, useDomain),
          type: file.rExt.replace(/^\./, '')
        };

        res.defines = [file.id];
        if (file.requires && file.requires.length) {
          res.requires = file.requires;
        }
        if (file.extras && file.extras.async) {
          res.requireAsyncs = file.extras.async;
        }
      } else if (file.isHtmlLike) {
        file.addSameNameRequire('.css');
        var res = ret.map.tpl[file.id] = {
          src: file.getUrl(),
          type: file.rExt.replace(/^\./, '')
        };
        if(file.requires && file.requires.length){
          res.deps = file.requires;
        }
      }
    }
  });

  var cwd = process.cwd() || opt.cwd;
  var ns = her.config.get('namespace');
  var name = (ns ? ns + '-' : '') + 'map.json';
  var optimize = her.config.get('optimize');
  var mapvinyl = new File({
    cwd: cwd,
    path: cwd + '/config/' + name,
    contents: new Buffer(JSON.stringify(ret.map, null, optimize ? null : 4)),
  });
  mapvinyl.release = '/';
  var mapFile = her.file(mapvinyl);
  ret.pkg[mapFile.id] = mapFile;

};
