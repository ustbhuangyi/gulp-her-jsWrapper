/**
 * analysis 'require(xxx)' and wrap define function
 */
'use strict';

var gutil = require('gulp-util');
var through = require('through2');
var PluginError = gutil.PluginError;

var stringRegStr = '(?:' +
  '\"(?:[^\\\\\"\\r\\n\\f]|\\\\[\\s\\S])*\"' + //match the " delimiter string
  '|' +
  '\'(?:[^\\\\\'\\r\\n\\f]|\\\\[\\s\\S])*\'' + //match the ' delimiter string
  ')';
var jscommentRegStr = '(?:' +
  '\\/\\/[^\\r\\n\\f]*' + // match the single line comment
  '|' +
  '\\/\\*[\\s\\S]+?\\*\\/' + //match the multi line comment
  ')';

//construct the regexExp to analysis strings like require("xxx") ，string and comment first。
var requireRegStr = stringRegStr + '|' +
  jscommentRegStr + '|' +
  '([^\\$\\.]|^)(\\brequire\\s*\\(\\s*(' +
  stringRegStr + ')\\s*\\))';

var defaultDeps = ['global', 'module', 'exports', 'require'];

var pluginName = 'gulp-her-jswrapper';

function createError(file, err) {
  if (typeof err === 'string') {
    return new PluginError(pluginName, file.path + ': ' + err, {
      fileName: file.path,
      showStack: false
    });
  }

  var msg = err.message || err.msg || 'unspecified error';

  return new PluginError(pluginName, file.path + ': ' + msg, {
    fileName: file.path,
    lineNumber: err.line,
    stack: err.stack,
    showStack: false
  });
}

module.exports = function (opt) {
  function wrapper(file, encoding, callback) {

    if (file.isNull()) {
      return callback(null, file);
    }

    if (file.isStream()) {
      return callback(createError(file, 'Streaming not supported'));
    }

    var content = String(file.contents);
    var reg = new RegExp(requireRegStr, 'g');
    var deps = [];

    content = content.replace(reg, function (all, requirePrefix, requireStr, requireValueStr) {
      //requirePrefix is undefined when match from string or comment
      if (requirePrefix !== undefined) {
        var rest = her.util.stringQuote(requireValueStr).rest;
        //standard
        var dep = her.uri.getId(rest, file.dirname).id;

        if (deps.indexOf(dep) < 0) {
          deps.push(dep);
        }
        return requirePrefix + requireStr.replace(rest, dep);
      }
      return all;
    });

    //deps = deps.concat(defaultDeps);

    var id = file.getId();

    content = 'define(\'' + id + '\',' + JSON.stringify(defaultDeps.concat(deps)) +
    ',function(' + defaultDeps.join(', ') + '){\n\n' + content + '\n\n});';

    file.contents = new Buffer(content);

    callback(null, file);
  }

  return through.obj(wrapper);
};
