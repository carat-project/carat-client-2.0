(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":3}],3:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],4:[function(require,module,exports){
/*
 * EJS Embedded JavaScript templates
 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/

'use strict';

/**
 * @file Embedded JavaScript templating engine.
 * @author Matthew Eernisse <mde@fleegix.org>
 * @author Tiancheng "Timothy" Gu <timothygu99@gmail.com>
 * @project EJS
 * @license {@link http://www.apache.org/licenses/LICENSE-2.0 Apache License, Version 2.0}
 */

/**
 * EJS internal functions.
 *
 * Technically this "module" lies in the same file as {@link module:ejs}, for
 * the sake of organization all the private functions re grouped into this
 * module.
 *
 * @module ejs-internal
 * @private
 */

/**
 * Embedded JavaScript templating engine.
 *
 * @module ejs
 * @public
 */

var fs = require('fs')
  , utils = require('./utils')
  , scopeOptionWarned = false
  , _VERSION_STRING = require('../package.json').version
  , _DEFAULT_DELIMITER = '%'
  , _DEFAULT_LOCALS_NAME = 'locals'
  , _REGEX_STRING = '(<%%|<%=|<%-|<%_|<%#|<%|%>|-%>|_%>)'
  , _OPTS = [ 'cache', 'filename', 'delimiter', 'scope', 'context'
            , 'debug', 'compileDebug', 'client', '_with', 'rmWhitespace'
            ]
  , _TRAILING_SEMCOL = /;\s*$/
  , _BOM = /^\uFEFF/;

/**
 * EJS template function cache. This can be a LRU object from lru-cache NPM
 * module. By default, it is {@link module:utils.cache}, a simple in-process
 * cache that grows continuously.
 *
 * @type {Cache}
 */

exports.cache = utils.cache;

/**
 * Name of the object containing the locals.
 *
 * This variable is overriden by {@link Options}`.localsName` if it is not
 * `undefined`.
 *
 * @type {String}
 * @public
 */

exports.localsName = _DEFAULT_LOCALS_NAME;

/**
 * Get the path to the included file from the parent file path and the
 * specified path.
 *
 * @param {String} name     specified path
 * @param {String} filename parent file path
 * @return {String}
 */

exports.resolveInclude = function(name, filename) {
  var path = require('path')
    , dirname = path.dirname
    , extname = path.extname
    , resolve = path.resolve
    , includePath = resolve(dirname(filename), name)
    , ext = extname(name);
  if (!ext) {
    includePath += '.ejs';
  }
  return includePath;
};

/**
 * Get the template from a string or a file, either compiled on-the-fly or
 * read from cache (if enabled), and cache the template if needed.
 *
 * If `template` is not set, the file specified in `options.filename` will be
 * read.
 *
 * If `options.cache` is true, this function reads the file from
 * `options.filename` so it must be set prior to calling this function.
 *
 * @memberof module:ejs-internal
 * @param {Options} options   compilation options
 * @param {String} [template] template source
 * @return {(TemplateFunction|ClientFunction)}
 * Depending on the value of `options.client`, either type might be returned.
 * @static
 */

function handleCache(options, template) {
  var fn
    , path = options.filename
    , hasTemplate = arguments.length > 1;

  if (options.cache) {
    if (!path) {
      throw new Error('cache option requires a filename');
    }
    fn = exports.cache.get(path);
    if (fn) {
      return fn;
    }
    if (!hasTemplate) {
      template = fs.readFileSync(path).toString().replace(_BOM, '');
    }
  }
  else if (!hasTemplate) {
    // istanbul ignore if: should not happen at all
    if (!path) {
      throw new Error('Internal EJS error: no file name or template '
                    + 'provided');
    }
    template = fs.readFileSync(path).toString().replace(_BOM, '');
  }
  fn = exports.compile(template, options);
  if (options.cache) {
    exports.cache.set(path, fn);
  }
  return fn;
}

/**
 * Get the template function.
 *
 * If `options.cache` is `true`, then the template is cached.
 *
 * @memberof module:ejs-internal
 * @param {String}  path    path for the specified file
 * @param {Options} options compilation options
 * @return {(TemplateFunction|ClientFunction)}
 * Depending on the value of `options.client`, either type might be returned
 * @static
 */

function includeFile(path, options) {
  var opts = utils.shallowCopy({}, options);
  if (!opts.filename) {
    throw new Error('`include` requires the \'filename\' option.');
  }
  opts.filename = exports.resolveInclude(path, opts.filename);
  return handleCache(opts);
}

/**
 * Get the JavaScript source of an included file.
 *
 * @memberof module:ejs-internal
 * @param {String}  path    path for the specified file
 * @param {Options} options compilation options
 * @return {String}
 * @static
 */

function includeSource(path, options) {
  var opts = utils.shallowCopy({}, options)
    , includePath
    , template;
  if (!opts.filename) {
    throw new Error('`include` requires the \'filename\' option.');
  }
  includePath = exports.resolveInclude(path, opts.filename);
  template = fs.readFileSync(includePath).toString().replace(_BOM, '');

  opts.filename = includePath;
  var templ = new Template(template, opts);
  templ.generateSource();
  return templ.source;
}

/**
 * Re-throw the given `err` in context to the `str` of ejs, `filename`, and
 * `lineno`.
 *
 * @implements RethrowCallback
 * @memberof module:ejs-internal
 * @param {Error}  err      Error object
 * @param {String} str      EJS source
 * @param {String} filename file name of the EJS file
 * @param {String} lineno   line number of the error
 * @static
 */

function rethrow(err, str, filename, lineno){
  var lines = str.split('\n')
    , start = Math.max(lineno - 3, 0)
    , end = Math.min(lines.length, lineno + 3);

  // Error context
  var context = lines.slice(start, end).map(function (line, i){
    var curr = i + start + 1;
    return (curr == lineno ? ' >> ' : '    ')
      + curr
      + '| '
      + line;
  }).join('\n');

  // Alter exception message
  err.path = filename;
  err.message = (filename || 'ejs') + ':'
    + lineno + '\n'
    + context + '\n\n'
    + err.message;

  throw err;
}

/**
 * Copy properties in data object that are recognized as options to an
 * options object.
 *
 * This is used for compatibility with earlier versions of EJS and Express.js.
 *
 * @memberof module:ejs-internal
 * @param {Object}  data data object
 * @param {Options} opts options object
 * @static
 */

function cpOptsInData(data, opts) {
  _OPTS.forEach(function (p) {
    if (typeof data[p] != 'undefined') {
      opts[p] = data[p];
    }
  });
}

/**
 * Compile the given `str` of ejs into a template function.
 *
 * @param {String}  template EJS template
 *
 * @param {Options} opts     compilation options
 *
 * @return {(TemplateFunction|ClientFunction)}
 * Depending on the value of `opts.client`, either type might be returned.
 * @public
 */

exports.compile = function compile(template, opts) {
  var templ;

  // v1 compat
  // 'scope' is 'context'
  // FIXME: Remove this in a future version
  if (opts && opts.scope) {
    if (!scopeOptionWarned){
      console.warn('`scope` option is deprecated and will be removed in EJS 3');
      scopeOptionWarned = true;
    }
    if (!opts.context) {
      opts.context = opts.scope;
    }
    delete opts.scope;
  }
  templ = new Template(template, opts);
  return templ.compile();
};

/**
 * Render the given `template` of ejs.
 *
 * If you would like to include options but not data, you need to explicitly
 * call this function with `data` being an empty object or `null`.
 *
 * @param {String}   template EJS template
 * @param {Object}  [data={}] template data
 * @param {Options} [opts={}] compilation and rendering options
 * @return {String}
 * @public
 */

exports.render = function (template, data, opts) {
  data = data || {};
  opts = opts || {};
  var fn;

  // No options object -- if there are optiony names
  // in the data, copy them to options
  if (arguments.length == 2) {
    cpOptsInData(data, opts);
  }

  return handleCache(opts, template)(data);
};

/**
 * Render an EJS file at the given `path` and callback `cb(err, str)`.
 *
 * If you would like to include options but not data, you need to explicitly
 * call this function with `data` being an empty object or `null`.
 *
 * @param {String}             path     path to the EJS file
 * @param {Object}            [data={}] template data
 * @param {Options}           [opts={}] compilation and rendering options
 * @param {RenderFileCallback} cb callback
 * @public
 */

exports.renderFile = function () {
  var args = Array.prototype.slice.call(arguments)
    , path = args.shift()
    , cb = args.pop()
    , data = args.shift() || {}
    , opts = args.pop() || {}
    , result;

  // Don't pollute passed in opts obj with new vals
  opts = utils.shallowCopy({}, opts);

  // No options object -- if there are optiony names
  // in the data, copy them to options
  if (arguments.length == 3) {
    cpOptsInData(data, opts);
  }
  opts.filename = path;

  try {
    result = handleCache(opts)(data);
  }
  catch(err) {
    return cb(err);
  }
  return cb(null, result);
};

/**
 * Clear intermediate JavaScript cache. Calls {@link Cache#reset}.
 * @public
 */

exports.clearCache = function () {
  exports.cache.reset();
};

function Template(text, opts) {
  opts = opts || {};
  var options = {};
  this.templateText = text;
  this.mode = null;
  this.truncate = false;
  this.currentLine = 1;
  this.source = '';
  this.dependencies = [];
  options.client = opts.client || false;
  options.escapeFunction = opts.escape || utils.escapeXML;
  options.compileDebug = opts.compileDebug !== false;
  options.debug = !!opts.debug;
  options.filename = opts.filename;
  options.delimiter = opts.delimiter || exports.delimiter || _DEFAULT_DELIMITER;
  options._with = typeof opts._with != 'undefined' ? opts._with : true;
  options.context = opts.context;
  options.cache = opts.cache || false;
  options.rmWhitespace = opts.rmWhitespace;
  this.opts = options;

  this.regex = this.createRegex();
}

Template.modes = {
  EVAL: 'eval'
, ESCAPED: 'escaped'
, RAW: 'raw'
, COMMENT: 'comment'
, LITERAL: 'literal'
};

Template.prototype = {
  createRegex: function () {
    var str = _REGEX_STRING
      , delim = utils.escapeRegExpChars(this.opts.delimiter);
    str = str.replace(/%/g, delim);
    return new RegExp(str);
  }

, compile: function () {
    var src
      , fn
      , opts = this.opts
      , prepended = ''
      , appended = ''
      , escape = opts.escapeFunction;

    if (opts.rmWhitespace) {
      // Have to use two separate replace here as `^` and `$` operators don't
      // work well with `\r`.
      this.templateText =
        this.templateText.replace(/\r/g, '').replace(/^\s+|\s+$/gm, '');
    }

    // Slurp spaces and tabs before <%_ and after _%>
    this.templateText =
      this.templateText.replace(/[ \t]*<%_/gm, '<%_').replace(/_%>[ \t]*/gm, '_%>');

    if (!this.source) {
      this.generateSource();
      prepended += '  var __output = [], __append = __output.push.bind(__output);' + '\n';
      if (opts._with !== false) {
        prepended +=  '  with (' + exports.localsName + ' || {}) {' + '\n';
        appended += '  }' + '\n';
      }
      appended += '  return __output.join("");' + '\n';
      this.source = prepended + this.source + appended;
    }

    if (opts.compileDebug) {
      src = 'var __line = 1' + '\n'
          + '  , __lines = ' + JSON.stringify(this.templateText) + '\n'
          + '  , __filename = ' + (opts.filename ?
                JSON.stringify(opts.filename) : 'undefined') + ';' + '\n'
          + 'try {' + '\n'
          + this.source
          + '} catch (e) {' + '\n'
          + '  rethrow(e, __lines, __filename, __line);' + '\n'
          + '}' + '\n';
    }
    else {
      src = this.source;
    }

    if (opts.debug) {
      console.log(src);
    }

    if (opts.client) {
      src = 'escape = escape || ' + escape.toString() + ';' + '\n' + src;
      if (opts.compileDebug) {
        src = 'rethrow = rethrow || ' + rethrow.toString() + ';' + '\n' + src;
      }
    }

    try {
      fn = new Function(exports.localsName + ', escape, include, rethrow', src);
    }
    catch(e) {
      // istanbul ignore else
      if (e instanceof SyntaxError) {
        if (opts.filename) {
          e.message += ' in ' + opts.filename;
        }
        e.message += ' while compiling ejs';
      }
      throw e;
    }

    if (opts.client) {
      fn.dependencies = this.dependencies;
      return fn;
    }

    // Return a callable function which will execute the function
    // created by the source-code, with the passed data as locals
    // Adds a local `include` function which allows full recursive include
    var returnedFn = function (data) {
      var include = function (path, includeData) {
        var d = utils.shallowCopy({}, data);
        if (includeData) {
          d = utils.shallowCopy(d, includeData);
        }
        return includeFile(path, opts)(d);
      };
      return fn.apply(opts.context, [data || {}, escape, include, rethrow]);
    };
    returnedFn.dependencies = this.dependencies;
    return returnedFn;
  }

, generateSource: function () {
    var self = this
      , matches = this.parseTemplateText()
      , d = this.opts.delimiter;

    if (matches && matches.length) {
      matches.forEach(function (line, index) {
        var opening
          , closing
          , include
          , includeOpts
          , includeSrc;
        // If this is an opening tag, check for closing tags
        // FIXME: May end up with some false positives here
        // Better to store modes as k/v with '<' + delimiter as key
        // Then this can simply check against the map
        if ( line.indexOf('<' + d) === 0        // If it is a tag
          && line.indexOf('<' + d + d) !== 0) { // and is not escaped
          closing = matches[index + 2];
          if (!(closing == d + '>' || closing == '-' + d + '>' || closing == '_' + d + '>')) {
            throw new Error('Could not find matching close tag for "' + line + '".');
          }
        }
        // HACK: backward-compat `include` preprocessor directives
        if ((include = line.match(/^\s*include\s+(\S+)/))) {
          opening = matches[index - 1];
          // Must be in EVAL or RAW mode
          if (opening && (opening == '<' + d || opening == '<' + d + '-' || opening == '<' + d + '_')) {
            includeOpts = utils.shallowCopy({}, self.opts);
            includeSrc = includeSource(include[1], includeOpts);
            includeSrc = '    ; (function(){' + '\n' + includeSrc +
                '    ; })()' + '\n';
            self.source += includeSrc;
            self.dependencies.push(exports.resolveInclude(include[1],
                includeOpts.filename));
            return;
          }
        }
        self.scanLine(line);
      });
    }

  }

, parseTemplateText: function () {
    var str = this.templateText
      , pat = this.regex
      , result = pat.exec(str)
      , arr = []
      , firstPos
      , lastPos;

    while (result) {
      firstPos = result.index;
      lastPos = pat.lastIndex;

      if (firstPos !== 0) {
        arr.push(str.substring(0, firstPos));
        str = str.slice(firstPos);
      }

      arr.push(result[0]);
      str = str.slice(result[0].length);
      result = pat.exec(str);
    }

    if (str) {
      arr.push(str);
    }

    return arr;
  }

, scanLine: function (line) {
    var self = this
      , d = this.opts.delimiter
      , newLineCount = 0;

    function _addOutput() {
      if (self.truncate) {
        line = line.replace('\n', '');
        self.truncate = false;
      }
      else if (self.opts.rmWhitespace) {
        // Gotta me more careful here.
        // .replace(/^(\s*)\n/, '$1') might be more appropriate here but as
        // rmWhitespace already removes trailing spaces anyway so meh.
        line = line.replace(/^\n/, '');
      }
      if (!line) {
        return;
      }

      // Preserve literal slashes
      line = line.replace(/\\/g, '\\\\');

      // Convert linebreaks
      line = line.replace(/\n/g, '\\n');
      line = line.replace(/\r/g, '\\r');

      // Escape double-quotes
      // - this will be the delimiter during execution
      line = line.replace(/"/g, '\\"');
      self.source += '    ; __append("' + line + '")' + '\n';
    }

    newLineCount = (line.split('\n').length - 1);

    switch (line) {
      case '<' + d:
      case '<' + d + '_':
        this.mode = Template.modes.EVAL;
        break;
      case '<' + d + '=':
        this.mode = Template.modes.ESCAPED;
        break;
      case '<' + d + '-':
        this.mode = Template.modes.RAW;
        break;
      case '<' + d + '#':
        this.mode = Template.modes.COMMENT;
        break;
      case '<' + d + d:
        this.mode = Template.modes.LITERAL;
        this.source += '    ; __append("' + line.replace('<' + d + d, '<' + d) + '")' + '\n';
        break;
      case d + '>':
      case '-' + d + '>':
      case '_' + d + '>':
        if (this.mode == Template.modes.LITERAL) {
          _addOutput();
        }

        this.mode = null;
        this.truncate = line.indexOf('-') === 0 || line.indexOf('_') === 0;
        break;
      default:
        // In script mode, depends on type of tag
        if (this.mode) {
          // If '//' is found without a line break, add a line break.
          switch (this.mode) {
            case Template.modes.EVAL:
            case Template.modes.ESCAPED:
            case Template.modes.RAW:
              if (line.lastIndexOf('//') > line.lastIndexOf('\n')) {
                line += '\n';
              }
          }
          switch (this.mode) {
            // Just executing code
            case Template.modes.EVAL:
              this.source += '    ; ' + line + '\n';
              break;
            // Exec, esc, and output
            case Template.modes.ESCAPED:
              this.source += '    ; __append(escape(' +
                line.replace(_TRAILING_SEMCOL, '').trim() + '))' + '\n';
              break;
            // Exec and output
            case Template.modes.RAW:
              this.source += '    ; __append(' +
                line.replace(_TRAILING_SEMCOL, '').trim() + ')' + '\n';
              break;
            case Template.modes.COMMENT:
              // Do nothing
              break;
            // Literal <%% mode, append as raw output
            case Template.modes.LITERAL:
              _addOutput();
              break;
          }
        }
        // In string mode, just add the output
        else {
          _addOutput();
        }
    }

    if (self.opts.compileDebug && newLineCount) {
      this.currentLine += newLineCount;
      this.source += '    ; __line = ' + this.currentLine + '\n';
    }
  }
};

/**
 * Express.js support.
 *
 * This is an alias for {@link module:ejs.renderFile}, in order to support
 * Express.js out-of-the-box.
 *
 * @func
 */

exports.__express = exports.renderFile;

// Add require support
/* istanbul ignore else */
if (require.extensions) {
  require.extensions['.ejs'] = function (module, filename) {
    filename = filename || /* istanbul ignore next */ module.filename;
    var options = {
          filename: filename
        , client: true
        }
      , template = fs.readFileSync(filename).toString()
      , fn = exports.compile(template, options);
    module._compile('module.exports = ' + fn.toString() + ';', filename);
  };
}

/**
 * Version of EJS.
 *
 * @readonly
 * @type {String}
 * @public
 */

exports.VERSION = _VERSION_STRING;

/* istanbul ignore if */
if (typeof window != 'undefined') {
  window.ejs = exports;
}

},{"../package.json":6,"./utils":5,"fs":1,"path":2}],5:[function(require,module,exports){
/*
 * EJS Embedded JavaScript templates
 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/

/**
 * Private utility functions
 * @module utils
 * @private
 */

'use strict';

var regExpChars = /[|\\{}()[\]^$+*?.]/g;

/**
 * Escape characters reserved in regular expressions.
 *
 * If `string` is `undefined` or `null`, the empty string is returned.
 *
 * @param {String} string Input string
 * @return {String} Escaped string
 * @static
 * @private
 */
exports.escapeRegExpChars = function (string) {
  // istanbul ignore if
  if (!string) {
    return '';
  }
  return String(string).replace(regExpChars, '\\$&');
};

var _ENCODE_HTML_RULES = {
      '&': '&amp;'
    , '<': '&lt;'
    , '>': '&gt;'
    , '"': '&#34;'
    , "'": '&#39;'
    }
  , _MATCH_HTML = /[&<>\'"]/g;

function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};

/**
 * Stringified version of constants used by {@link module:utils.escapeXML}.
 *
 * It is used in the process of generating {@link ClientFunction}s.
 *
 * @readonly
 * @type {String}
 */

var escapeFuncStr =
  'var _ENCODE_HTML_RULES = {\n'
+ '      "&": "&amp;"\n'
+ '    , "<": "&lt;"\n'
+ '    , ">": "&gt;"\n'
+ '    , \'"\': "&#34;"\n'
+ '    , "\'": "&#39;"\n'
+ '    }\n'
+ '  , _MATCH_HTML = /[&<>\'"]/g;\n'
+ 'function encode_char(c) {\n'
+ '  return _ENCODE_HTML_RULES[c] || c;\n'
+ '};\n';

/**
 * Escape characters reserved in XML.
 *
 * If `markup` is `undefined` or `null`, the empty string is returned.
 *
 * @implements {EscapeCallback}
 * @param {String} markup Input string
 * @return {String} Escaped string
 * @static
 * @private
 */

exports.escapeXML = function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
        .replace(_MATCH_HTML, encode_char);
};
exports.escapeXML.toString = function () {
  return Function.prototype.toString.call(this) + ';\n' + escapeFuncStr
};

/**
 * Copy all properties from one object to another, in a shallow fashion.
 *
 * @param  {Object} to   Destination object
 * @param  {Object} from Source object
 * @return {Object}      Destination object
 * @static
 * @private
 */
exports.shallowCopy = function (to, from) {
  from = from || {};
  for (var p in from) {
    to[p] = from[p];
  }
  return to;
};

/**
 * Simple in-process cache implementation. Does not implement limits of any
 * sort.
 *
 * @implements Cache
 * @static
 * @private
 */
exports.cache = {
  _data: {},
  set: function (key, val) {
    this._data[key] = val;
  },
  get: function (key) {
    return this._data[key];
  },
  reset: function () {
    this._data = {};
  }
};


},{}],6:[function(require,module,exports){
module.exports={
  "name": "ejs",
  "description": "Embedded JavaScript templates",
  "keywords": [
    "template",
    "engine",
    "ejs"
  ],
  "version": "2.3.4",
  "author": {
    "name": "Matthew Eernisse",
    "email": "mde@fleegix.org",
    "url": "http://fleegix.org"
  },
  "contributors": [
    {
      "name": "Timothy Gu",
      "email": "timothygu99@gmail.com",
      "url": "https://timothygu.github.io"
    }
  ],
  "license": "Apache-2.0",
  "main": "./lib/ejs.js",
  "repository": {
    "type": "git",
    "url": "git://github.com/mde/ejs.git"
  },
  "bugs": {
    "url": "https://github.com/mde/ejs/issues"
  },
  "homepage": "https://github.com/mde/ejs",
  "dependencies": {},
  "devDependencies": {
    "browserify": "^8.0.3",
    "istanbul": "~0.3.5",
    "jake": "^8.0.0",
    "jsdoc": "^3.3.0-beta1",
    "lru-cache": "^2.5.0",
    "mocha": "^2.1.0",
    "rimraf": "^2.2.8",
    "uglify-js": "^2.4.16"
  },
  "engines": {
    "node": ">=0.10.0"
  },
  "scripts": {
    "test": "mocha",
    "coverage": "istanbul cover node_modules/mocha/bin/_mocha",
    "doc": "rimraf out && jsdoc -c jsdoc.json lib/* docs/jsdoc/*",
    "devdoc": "rimraf out && jsdoc -p -c jsdoc.json lib/* docs/jsdoc/*"
  },
  "_id": "ejs@2.3.4",
  "_shasum": "3c76caa09664b3583b0037af9dc136e79ec68b98",
  "_resolved": "https://registry.npmjs.org/ejs/-/ejs-2.3.4.tgz",
  "_from": "ejs@2.3.4",
  "_npmVersion": "2.10.1",
  "_nodeVersion": "0.12.4",
  "_npmUser": {
    "name": "mde",
    "email": "mde@fleegix.org"
  },
  "maintainers": [
    {
      "name": "tjholowaychuk",
      "email": "tj@vision-media.ca"
    },
    {
      "name": "mde",
      "email": "mde@fleegix.org"
    }
  ],
  "dist": {
    "shasum": "3c76caa09664b3583b0037af9dc136e79ec68b98",
    "tarball": "http://registry.npmjs.org/ejs/-/ejs-2.3.4.tgz"
  },
  "directories": {},
  "readme": "ERROR: No README data found!"
}

},{}],7:[function(require,module,exports){
"use strict"

/**
 * @namespace Utilities
 */
;
module.exports.Utilities = (function () {

    /**
     * @function
     * @static
     * @param {String} id
     * @param {String} additional
     * @returns {String} An is that is formed from the given data.
     * @memberOf Utilities
     */
    var makeIdFromOtherId = function makeIdFromOtherId(id, additional) {

        return id + "-" + additional;
    };

    /**
     * @function
     * @static
     * @param {String} appName
     * @param {String} hogOrBug
     * @param {String} additional
     * @returns {String} An id that is formed from the given data.
     * @memberOf Utilities
     */
    var makeIdFromAppName = function makeIdFromAppName(appName, hogOrBug, additional) {

        var idPrefix = appName.replace(/-/g, "--").replace(/\./g, "-");

        var standardPart = idPrefix + "-" + hogOrBug;

        if (!additional) {
            return standardPart;
        }

        return makeIdFromOtherId(standardPart, additional);
    };

    /**
     * @function
     * @static
     * @param {DOM-element} elem A DOM element that should contain
     an element with the matching id as a sub-element.
     * @param {String} id Id of the element one is searching for.
     * @returns {DOM-element} Element which is a child of the given
     element and has the corresponding id given as a parameter.
     * @memberOf Utilities
     */
    var findById = function findById(elem, id) {
        if (!elem.querySelector) return;
        return elem.querySelector("#" + id);
    };

    /**
     * @function
     * @static
     * @param {DOM-element} elem The to-be parent of the appendees.
     * @param {Array} appendees Array of DOM nodes that are to
     be appended as children of the given element.
     * @memberOf Utilities
     */
    var appendChildAll = function appendChildAll(elem, appendees) {
        for (var key in appendees) {
            if (elem && elem.appendChild) {
                elem.appendChild(appendees[key]);
            }
        }
    };

    /**
     * @function
     * @static
     * @param {String} timeDrainString String that represents
     the time benefit of getting rid of the app.
     * @returns {Object} The string split into two parts containing
     the expected benefit of getting rid of the app and the error
     part associated with the expected benefit.
     * @memberOf Utilities
     */
    var splitTimeDrainString = function splitTimeDrainString(timeDrainString) {
        var timeDrainSplit = timeDrainString.split("±", 2);

        var timeDrainPart;
        var timeDrainErrorPart;

        if (timeDrainSplit.length === 2) {
            timeDrainPart = timeDrainSplit[0];
            timeDrainErrorPart = "±" + timeDrainSplit[1];
        } else {
            timeDrainPart = timeDrainString;
            timeDrainErrorPart = "";
        }

        return { timeDrainPart: timeDrainPart,
            timeDrainErrorPart: timeDrainErrorPart };
    };

    /**
     * @function
     * @static
     * @param {Number} count The amount of "the thing".
     * @param {String} singular The singular form of the word
     for "the thing" at hand.
     * @returns {String} End-user readable form of the given
     word associated with the given number.
     * @memberOf Utilities
     */
    var pluralize = function pluralize(count, singular) {

        var form;

        if (count === 1) {
            form = singular;
        } else {
            form = singular + 's';
        }

        if (count === 0) {
            return "No " + form;
        } else {
            return count + " " + form;
        }
    };

    /**
     * @function
     * @static
     * @param {String} htmlString A string that should be valid
     HTML.
     * @returns {DOM-element} Corresponding DOM element that is
     created from the given HTML string.
     * @memberOf Utilities
     */
    var makeDomNode = function makeDomNode(htmlString) {

        var dummyNode = document.createElement("div");
        dummyNode.innerHTML = htmlString;
        return dummyNode.firstChild;
    };

    var cutLabel = function cutLabel(label, length) {
        // Charcode 8230 is ellipsis
        var ellipsis = String.fromCharCode(8230);
        return label.length > length ? label.slice(0, length - 3) + ellipsis : label;
    };

    return {
        cutLabel: cutLabel,
        makeIdFromAppName: makeIdFromAppName,
        splitTimeDrainString: splitTimeDrainString,
        pluralize: pluralize,
        makeDomNode: makeDomNode,
        makeIdFromOtherId: makeIdFromOtherId,
        appendChildAll: appendChildAll,
        findById: findById
    };
})();

},{}],8:[function(require,module,exports){
"use strict";

var _createClass = (function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
})();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _ejs = require("ejs");

var _ejs2 = _interopRequireDefault(_ejs);

var _Utilities = require("../helper/Utilities.js");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

// Template
var Template = "<div class=\"mdl-card mdl-shadow--2dp\"\r\n     id=\"statistics-jscore\"\r\n     style=\"-webkit-user-select: none;\r\n            -webkit-user-drag: none;\r\n            -webkit-tap-highlight-color: rgba(0, 0, 0, 0);\">\r\n    <div class=\"carat-card__title\">\r\n        <div class=\"mdl-card__title-text carat_summaryCard_title_text\">\r\n            My Device\r\n        </div>\r\n    </div>\r\n    <div class=\"mdl-card__supporting-text in_large\">\r\n        <div>OS version: <%= osVersion %></div>\r\n        <div>Device model: <%= deviceModel %></div>\r\n        <div>Battery duration: <%= batteryLife %></div>\r\n        <div>Memory total: <%= totalMemory %> MiB</div>\r\n        <div>Carat id: <%= uuid %></div>\r\n        <div style=\"display: inline-block;\">\r\n            CPU usage:&nbsp;\r\n            <div id=\"cpuProgressBar\" class=\"progressBar\">\r\n                <span>?</span>\r\n                <div></div>\r\n            </div>\r\n        </div>\r\n        <div style=\"display: inline-block;\">\r\n            Memory usage:&nbsp;\r\n            <div id=\"memProgressBar\" class=\"progressBar\">\r\n                <span>?</span>\r\n                <div></div>\r\n            </div>\r\n        </div>\r\n    </div>\r\n</div>\r\n";

var DeviceStats = (function () {
    function DeviceStats(data) {
        _classCallCheck(this, DeviceStats);

        data.jScore = Math.round(data.jScore * 100);
        data.deviceModel = data.modelName;

        this.data = data;

        var html = _ejs2.default.render(Template, data);
        this.node = this.createNode(html);
    }

    // create node and bind functions

    _createClass(DeviceStats, [{
        key: "createNode",
        value: function createNode(html) {
            var node = _Utilities.Utilities.makeDomNode(html);
            makeElemPanSwipable(node);

            var cpuText = node.querySelector("#cpuProgressBar span");
            var cpuLoad = node.querySelector("#cpuProgressBar div");

            var memoryText = node.querySelector("#memProgressBar span");
            var memoryLoad = node.querySelector("#memProgressBar div");

            carat.startCpuPolling(function (usage) {
                cpuText.style.color = usage > 65 ? "#fff" : "#000";
                usage = usage + "%";
                cpuText.innerHTML = usage;
                cpuLoad.style.width = usage;
            }, 4000);

            carat.startMemoryPolling(function (usage) {
                memoryText.style.color = usage > 65 ? "#fff" : "#000";
                usage = usage + "%";
                memoryText.innerHTML = usage;
                memoryLoad.style.width = usage;
            }, 4000);

            return node;
        }
    }, {
        key: "render",
        value: function render() {
            return this.node;
        }
    }, {
        key: "getFields",
        value: function getFields() {
            return this.data;
        }
    }]);

    return DeviceStats;
})();

exports.default = DeviceStats;

},{"../helper/Utilities.js":7,"ejs":4}],9:[function(require,module,exports){
"use strict";

var _createClass = (function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
})();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _ejs = require("ejs");

var _ejs2 = _interopRequireDefault(_ejs);

var _Utilities = require("../helper/Utilities.js");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

var Template = "<div class=\"mdl-card sleeker smaller-time-text mdl-shadow--2dp\"\r\n     id=\"<%= id %>\">\r\n    <div class=\"carat-card__title\">\r\n        <div class=\"mdl-card__icon\"><img src=\"<%= icon %>\"></div>\r\n        <div class=\"mdl-card__title-text\">\r\n            <%= label %>\r\n            <div class=\"expand\">\r\n                <button class=\"expand-button\">\r\n                    <i class=\"material-icons\r\n                              md-light\r\n                              normal-icon\">\r\n                        &#xE5CF;\r\n                    </i>\r\n                </button>\r\n            </div>\r\n        </div>\r\n        <div class=\"carat-card-time\">\r\n            <%= benefit %>\r\n            <span class=\"benefit-error\">\r\n                <%= benefitError %>\r\n            </span>\r\n        </div>\r\n    </div>\r\n    <div class=\"mdl-card__supporting-text\">\r\n        <div class=\"collapse\" id=\"card-<%= id %>-textpand\">\r\n            <div><%= \"Version: \" + version %></div>\r\n            <div><%= \"Samples: \" + samples %></div>\r\n            <div><%= \"Found in \" + popularity + \"% of devices.\" %></div>\r\n        </div>\r\n    </div>\r\n    <div class=\"mdl-card__actions mdl-card--border\">\r\n        <span>\r\n            <button class=\"action-button\"\r\n               id=\"<%= closeId %>\"\r\n               <% if(!killable) { %>\r\n               disabled\r\n               <% } %>>\r\n                Close app\r\n            </button>\r\n        </span>\r\n        <span>\r\n            <button class=\"action-button\"\r\n               id=\"<%= uninstallId %>\"\r\n               <% if(!uninstallable) { %>\r\n               disabled\r\n               <% } %>>\r\n                Uninstall\r\n            </button>\r\n        </span>\r\n    </div>\r\n</div>\r\n";

var HogBug = (function () {
    function HogBug(data) {
        _classCallCheck(this, HogBug);

        // Prepare and reformat data
        data.label = _Utilities.Utilities.cutLabel(data.label, 20);
        data.benefitSubstrings = _Utilities.Utilities.splitTimeDrainString(data.benefit);
        data.benefit = data.benefitSubstrings.timeDrainPart;
        data.benefitError = data.benefitSubstrings.timeDrainErrorPart;
        data.killable = data.running && data.killable;
        data.uninstallable = data.removable;
        data.id = _Utilities.Utilities.makeIdFromAppName(data.name, data.type);
        data.uninstallId = _Utilities.Utilities.makeIdFromAppName(data.name, data.type, "uninstall");
        data.closeId = _Utilities.Utilities.makeIdFromAppName(data.name, data.type, "close");

        this.data = data;

        // render template
        var html = _ejs2.default.render(Template, data);
        this.node = this.createNode(html);
    }

    /**
     * @function
     * @instance
     * @returns {String} Id for the HTML-element id field.
     * @memberOf HogBug
     */

    _createClass(HogBug, [{
        key: "getId",
        value: function getId() {
            return this.data.id;
        }
    }, {
        key: "getCloseId",

        /**
         * @function
         * @instance
         * @returns {String} Id for the close button
         HTML-element id field.
         * @memberOf HogBug
         */
        value: function getCloseId() {
            return this.data.closeId;
        }
    }, {
        key: "getUninstallId",

        /**
         * @function
         * @instance
         * @returns {String} Id for the uninstall button
         HTML-element id field.
         * @memberOf HogBug
         */
        value: function getUninstallId() {
            return this.data.uninstallId;
        }
    }, {
        key: "getRunning",

        /**
         * @function
         * @instance
         * @returns {Boolean} Whether or not this app is
         currently running.
         * @memberOf HogBug
         */
        value: function getRunning() {
            return this.data.running;
        }
    }, {
        key: "getPackageName",

        /**
         * @function
         * @instance
         * @returns {String} The package name of this app
         for native plugin use.
         * @memberOf HogBug
         */
        value: function getPackageName() {
            return this.data.packageName;
        }

        /**
         * @function
         * @instance
         * @returns {String} The name of the app that is
         displayed for the end user.
         * @memberOf HogBug
         */

    }, {
        key: "getLabel",
        value: function getLabel() {
            return this.data.label;
        }
    }, {
        key: "getUninstallable",

        /**
         * @function
         * @instance
         * @returns {Boolean} Whether or not you can uninstall this app.
         * @memberOf HogBug
         */
        value: function getUninstallable() {
            return this.data.uninstallable;
        }
    }, {
        key: "createNode",
        value: function createNode(html) {
            var node = _Utilities.Utilities.makeDomNode(html);
            var closeButton = _Utilities.Utilities.findById(node, this.data.closeId);
            var uninstallButton = _Utilities.Utilities.findById(node, this.data.uninstallId);

            var _this = this;
            closeButton.addEventListener("click", function () {
                carat.killApp(_this.data.name, function (state) {
                    closeButton.disabled = true;
                    if (state == "Success") {
                        carat.showToast(_this.data.label + " closed");
                    } else {
                        carat.showToast(_this.data.label + " couldn't be closed!");
                    }
                });
            });

            uninstallButton.addEventListener("click", function () {
                carat.uninstallApp(_this.data.name, function (state) {
                    console.log("Uninstalling app: " + state);
                });
            });

            if (window.localStorage.getItem(this.data.id) === "dismissed") {
                node.style.display = "none";
            } else {
                makeElemPanSwipable(node);
            }

            return node;
        }

        /**
         * @function
         * @instance
         * @returns {DOM-element} Rendered DOM element
         representing a hog or a bug.
         * @memberOf HogBug
         */

    }, {
        key: "render",
        value: function render() {
            return this.node;
        }
    }]);

    return HogBug;
})();

exports.default = HogBug;

},{"../helper/Utilities.js":7,"ejs":4}],10:[function(require,module,exports){
"use strict";

var _createClass = (function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
})();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _ejs = require("ejs");

var _ejs2 = _interopRequireDefault(_ejs);

var _Utilities = require("../helper/Utilities.js");

var _SummaryEntry = require("./SummaryEntry.js");

var _SummaryEntry2 = _interopRequireDefault(_SummaryEntry);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

var Template = "<div class=\"mdl-card mdl-shadow--2dp\" id=\"summary-0\">\r\n    <div class=\"carat-card__title\" id=\"summary\">\r\n        <div class=\"mdl-card__title-text carat_summaryCard_title_text\">\r\n            Summary\r\n        </div>\r\n    </div>\r\n    <div class=\"mdl-card__supporting-text carat-card__supporting-text\">\r\n        <div class=\"ScoreAndBattery\">\r\n            <div class=\"carat-Jscore-text\"></div>\r\n            <div class=\"carat-battery-text\"></div>\r\n            <div class=\"circleContainer\">\r\n                <div class=\"outerCircle\">\r\n                    <div class=\"innerCircle\">\r\n                        <div class=\"numberCircle\">\r\n                            <button class=\"info\" onclick=\"JscoreInfo()\"></button>\r\n                        </div>\r\n                    </div>\r\n                </div>\r\n            </div>\r\n        </div>\r\n        <div class=\"carat_summaryCard_group_title\" id=\"bugTitleAndCount\">\r\n            <%= bugsCount %>\r\n        </div>\r\n        <div id=\"bugSummaryGrid\" class=\"carat_hide\">\r\n            <div class=\"carat_summary_grid\" id=\"bugsGrid\">\r\n            </div>\r\n        </div>\r\n        <div class=\"carat_summaryCard_group_title\" id=\"hogTitleAndCount\">\r\n             <%= hogsCount %>\r\n        </div>\r\n        <div id=\"hogSummaryGrid\" class=\"carat_show\">\r\n            <div class=\"carat_summary_grid\" id=\"hogsGrid\">\r\n            </div>\r\n        </div>\r\n        <div class=\"carat_summaryCard_group_title\">\r\n             0 System notifications\r\n        </div>\r\n    </div>\r\n    <div class=\"mdl-card__actions carat-card__actions\">\r\n        <a class=\"mdl-card__more\" id=\"summary-button\" role=\"button\" onclick=\"showOrHideActions()\" href=\"#\">\r\n           More\r\n        </a>\r\n    </div>\r\n</div>\r\n";

var SummaryContainer = (function () {
    function SummaryContainer(bugs, hogs) {
        _classCallCheck(this, SummaryContainer);

        this.bugEntries = this.makeModels(bugs);
        this.hogEntries = this.makeModels(hogs);
        this.node = this.createNode();
    }

    /**
     * @function
     * @instance
     * @returns {Array} All the bug entries listed
     in the summary.
     * @memberOf SummaryContainer
     */

    _createClass(SummaryContainer, [{
        key: "getBugs",
        value: function getBugs() {
            return this.bugEntries;
        }
    }, {
        key: "getHogs",

        /**
         * @function
         * @instance
         * @returns {Array} All the hog entries listed
         in the summary.
         * @memberOf SummaryContainer
         */
        value: function getHogs() {
            return this.hogEntries;
        }
    }, {
        key: "makeModels",

        // Create summary entry cards
        value: function makeModels(data) {
            var result = [];
            for (var key in data) {
                result.push(new _SummaryEntry2.default(data[key]));
            }
            return result;
        }
    }, {
        key: "getRendered",
        value: function getRendered() {
            var renderedBugs = this.bugEntries.map(function (bug) {
                return bug.render();
            });

            var renderedHogs = this.hogEntries.map(function (hog) {
                return hog.render();
            });

            var bugsCount = _Utilities.Utilities.pluralize(renderedBugs.length, "bug");
            var hogsCount = _Utilities.Utilities.pluralize(renderedHogs.length, "hog");

            return {
                hogs: renderedHogs,
                bugs: renderedBugs,
                bugsCount: bugsCount,
                hogsCount: hogsCount
            };
        }
    }, {
        key: "createNode",
        value: function createNode(html) {

            var rendered = this.getRendered();
            var html = _ejs2.default.render(Template, rendered);
            var node = _Utilities.Utilities.makeDomNode(html);

            var hogsLoc = _Utilities.Utilities.findById(node, "hogsGrid");
            var bugsLoc = _Utilities.Utilities.findById(node, "bugsGrid");

            _Utilities.Utilities.appendChildAll(hogsLoc, rendered.hogs);
            _Utilities.Utilities.appendChildAll(bugsLoc, rendered.bugs);

            return node;
        }

        /**
         * @function
         * @instance
         * @returns {DOM-element} Rendered DOM element
         representing the summary.
         * @memberOf SummaryContainer
         */

    }, {
        key: "render",
        value: function render() {
            return this.node;
        }
    }]);

    return SummaryContainer;
})();

exports.default = SummaryContainer;

},{"../helper/Utilities.js":7,"./SummaryEntry.js":11,"ejs":4}],11:[function(require,module,exports){
"use strict";

var _createClass = (function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
})();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _ejs = require("ejs");

var _ejs2 = _interopRequireDefault(_ejs);

var _Utilities = require("../helper/Utilities.js");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

var Template = "<div class=\"mdl-cell mdl-cell--2-col mdl-cell--1-col-phone carat_summary_item\" id=\"<%= id %>\">\r\n    <div class=\"carat_summaryCard_app_icon\">\r\n        <div class=\"mdl-card__icon\">\r\n            <img src=\"<%= icon %>\">\r\n        </div>\r\n        <i class=\"material-icons\"></i>\r\n    </div>\r\n    <div class=\"carat_summaryCard_app_name\"><%= label %></div>\r\n    <div class=\"carat_summaryCard_app_time\"><%= benefit %></div>\r\n</div>\r\n";

/**
 * @class SummaryEntry
 * @param {} data Raw data from the server.
 */

var SummaryEntry = (function () {
    function SummaryEntry(data) {
        _classCallCheck(this, SummaryEntry);

        // Prepare and reformat data
        data.label = _Utilities.Utilities.cutLabel(data.label, 6);
        data.benefit = _Utilities.Utilities.splitTimeDrainString(data.benefit).timeDrainPart;
        data.id = _Utilities.Utilities.makeIdFromAppName(data.name, data.type, "entry");
        data.targetId = _Utilities.Utilities.makeIdFromAppName(data.name, data.type);

        this.data = data;

        // Render template
        var html = _ejs2.default.render(Template, data);
        this.node = this.createNode(html);
    }

    /**
     * @function
     * @instance
     * @returns {String} The id for the HTML-element
     id field.
     * @memberOf SummaryEntry
     */

    _createClass(SummaryEntry, [{
        key: "getId",
        value: function getId() {
            return this.data.id;
        }
    }, {
        key: "getTargetId",

        /**
         * @function
         * @instance
         * @returns {String} The id of the item that clicking
         this entry links to.
         * @memberOf SummaryEntry
         */
        value: function getTargetId() {
            return this.data.targetId;
        }
    }, {
        key: "getType",

        /**
         * @function
         * @instance
         * @returns {String} What kind of entry this is,
         hog or a bug.
         * @memberOf SummaryEntry
         */
        value: function getType() {
            return this.data.type;
        }
    }, {
        key: "createNode",
        value: function createNode(html) {
            var node = _Utilities.Utilities.makeDomNode(html);

            var tab;

            if (this.data.type === "BUG") {
                tab = "bugs-tab";
            } else if (this.data.type === "HOG") {
                tab = "hogs-tab";
            } else {
                return node;
            }

            node.addEventListener("click", function () {
                document.getElementById(tab).click();
                window.location.hash = targetId;
            });

            return node;
        }

        /**
         * @function
         * @instance
         * @returns {DOM-element} Rendered DOM element
         representing an app featured in the summary.
         * @memberOf SummaryEntry
         */

    }, {
        key: "render",
        value: function render() {
            return this.node;
        }
    }]);

    return SummaryEntry;
})();

exports.default = SummaryEntry;

},{"../helper/Utilities.js":7,"ejs":4}],12:[function(require,module,exports){
"use strict";

var _createClass = (function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
})();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _ejs = require("ejs");

var _ejs2 = _interopRequireDefault(_ejs);

var _Utilities = require("../helper/Utilities.js");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

var Template = "<header class=\"mdl-layout__header mdl-color--blue-grey-500\"\r\n        id=\"header-bar\">\r\n    <img class=\"mdl-layout-icon\" src=\"img/icon.png\"></img>\r\n    <div class=\"mdl-layout__header-row mdl-layout-title\"\r\n         style=\"float:left; left:0px; top:2px;\">\r\n        <!-- Title -->\r\n        <span>Carat 2.0</span>\r\n        <span id=\"progress\"></span>\r\n        <span id=\"usage\"></span>\r\n\r\n        <div class=\"mdl-layout-spacer\"></div>\r\n        <button class=\"mdl-button mdl-js-button mdl-button--icon\"\r\n                id=\"menu\" onclick=\"listenMenu();\">\r\n            <i class=\"material-icons\">more_vert</i>\r\n        </button>\r\n        <ul class=\"mdl-menu mdl-js-menu mdl-menu--bottom-right\"\r\n            for=\"menu\">\r\n            <li class=\"mdl-menu__item\" id=\"showHiddenBugCards\"\r\n                disabled=\"true\">Show hidden bugs</li>\r\n            <li class=\"mdl-menu__item\" id=\"showHiddenHogCards\"\r\n                disabled=\"true\">Show hidden hogs</li>\r\n            <li class=\"mdl-menu__item\" id=\"sendFeedback\">\r\n                Send Feedback\r\n            </li>\r\n            <li class=\"mdl-menu__item\" id=\"changeUuid\">Change UUID</li>\r\n            <li class=\"mdl-menu__item\" id=\"appSettings\">Settings</li>\r\n        </ul>\r\n\r\n    </div>\r\n\r\n    <!-- Tabs -->\r\n    <div class=\"mdl-layout__tab-bar mdl-color--blue-grey-500\">\r\n        <a href=\"#home\" class=\"mdl-layout__tab is-active\" id=\"home-tab\">\r\n            Home\r\n        </a>\r\n        <a href=\"#bugs\" class=\"mdl-layout__tab\" id=\"bugs-tab\">Bugs</a>\r\n        <a href=\"#hogs\" class=\"mdl-layout__tab\" id=\"hogs-tab\">Hogs</a>\r\n        <a href=\"#system\" class=\"mdl-layout__tab\" id=\"system-tab\">\r\n            Stats\r\n        </a>\r\n    </div>\r\n</header>\r\n";

var Headerbar = (function () {
    function Headerbar() {
        _classCallCheck(this, Headerbar);

        this.elemId = "header-bar";
        this.parentId = "main-screen";
    }

    _createClass(Headerbar, [{
        key: "renderTemplate",
        value: function renderTemplate() {
            return _ejs2.default.render(Template);
        }
    }, {
        key: "hide",
        value: function hide() {
            var elem = document.getElementById(elemId);

            if (elem) {
                elem.style["display"] = "none";
            }
        }
    }, {
        key: "show",
        value: function show() {
            var elem = document.getElementById(elemId);

            if (elem) {
                elem.style["display"] = "inherit";
            }
        }
    }, {
        key: "renderInsert",
        value: function renderInsert() {
            var node = _Utilities.Utilities.makeDomNode(renderTemplate());
            document.getElementById(parentId).appendChild(node);
        }
    }]);

    return Headerbar;
})();

exports.default = Headerbar;

},{"../helper/Utilities.js":7,"ejs":4}],13:[function(require,module,exports){
"use strict";

var _createClass = (function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
})();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _ejs = require("ejs");

var _ejs2 = _interopRequireDefault(_ejs);

var _HogBug = require("../model/HogBug.js");

var _HogBug2 = _interopRequireDefault(_HogBug);

var _Utilities = require("../helper/Utilities.js");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

var Template = "<div class=\"page-content\">\r\n    <% if(hogBugsArray && hogBugsArray.running && hogBugsArray.running.length >= 1) { %>\r\n        <div class=\"carat-module\">\r\n            <div class=\"carat-module-title\">\r\n                Running:&nbsp; <%= hogBugsArray.running.length %>\r\n            </div>\r\n            <div class=\"carat-module-content\" id=\"<%= cardLocIds.runningId %>\"></div>\r\n        </div>\r\n    <% } %>\r\n    <% if(hogBugsArray && hogBugsArray.inactive && hogBugsArray.inactive.length >= 1) { %>\r\n        <div class=\"carat-module\">\r\n            <div class=\"carat-module-title\">\r\n                Inactive:&nbsp; <%= hogBugsArray.inactive.length %>\r\n            </div>\r\n            <div class=\"carat-module-content\" id=\"<%= cardLocIds.inactiveId %>\"></div>\r\n        </div>\r\n    <% } %>\r\n    <% if(hogBugsArray && hogBugsArray.system && hogBugsArray.system.length >= 1) { %>\r\n        <div class=\"carat-module\">\r\n            <div class=\"carat-module-title\">\r\n                System:&nbsp;<%= hogBugsArray.system.length %>\r\n            </div>\r\n            <div class=\"carat-module-content\" id=\"<%= cardLocIds.systemId %>\"></div>\r\n        </div>\r\n    <% } %>\r\n</div>\r\n";

var HogBugCards = (function () {
    function HogBugCards(dataSource, outputElemId) {
        _classCallCheck(this, HogBugCards);

        this.dataSource = dataSource;
        this.outputElemId = outputElemId;
        this.docLocation = document.getElementById(outputElemId);
        this.renderAsync = this.renderAsyncSource(dataSource);
        this.cardLocIds = {
            runningId: this.cardLocIdMaker("running"),
            inactiveId: this.cardLocIdMaker("inactive"),
            systemId: this.cardLocIdMaker("system")
        };
    }

    _createClass(HogBugCards, [{
        key: "cardLocIdMaker",
        value: function cardLocIdMaker(locName) {
            return _Utilities.Utilities.makeIdFromOtherId(this.outputElemId, locName);
        }
    }, {
        key: "renderTemplate",
        value: function renderTemplate(hogBugsArray) {

            var templateData = {
                cardLocIds: this.cardLocIds,
                hogBugsArray: hogBugsArray
            };
            var html = _ejs2.default.render(Template, templateData);
            var rendered = _Utilities.Utilities.makeDomNode(html);

            var runningLoc = _Utilities.Utilities.findById(rendered, this.cardLocIds.runningId);
            var inactiveLoc = _Utilities.Utilities.findById(rendered, this.cardLocIds.inactiveId);
            var systemLoc = _Utilities.Utilities.findById(rendered, this.cardLocIds.systemId);

            _Utilities.Utilities.appendChildAll(runningLoc, hogBugsArray.running);
            _Utilities.Utilities.appendChildAll(inactiveLoc, hogBugsArray.inactive);
            _Utilities.Utilities.appendChildAll(systemLoc, hogBugsArray.system);

            return rendered;
        }
    }, {
        key: "makeModels",
        value: function makeModels(rawData) {

            var result = {
                running: [],
                inactive: [],
                system: []
            };

            for (var key in rawData) {
                var model = new _HogBug2.default(rawData[key]);

                if (model.getRunning()) {
                    result.running.push(model);
                } else if (!model.getUninstallable()) {
                    result.system.push(model);
                } else {
                    result.inactive.push(model);
                }
            }

            return result;
        }
    }, {
        key: "renderModels",
        value: function renderModels(categories) {

            var morphToHTML = function morphToHTML(model) {
                return model.render();
            };

            return {
                running: categories.running.map(morphToHTML),
                inactive: categories.inactive.map(morphToHTML),
                system: categories.system.map(morphToHTML)
            };
        }
    }, {
        key: "renderAsyncSource",
        value: function renderAsyncSource(sourceCallback) {
            var _this = this;
            return function (onResultCallback) {
                sourceCallback(function (data) {
                    var models = _this.makeModels(data);
                    var result = _this.renderTemplate(_this.renderModels(models));
                    if (onResultCallback) {
                        onResultCallback(result);
                    }
                });
            };
        }
    }, {
        key: "setDataSource",

        /**
         * @function
         * @instance
         * @param {} freshDataSource A callback which is used for
         acquiring data from the server.
         * @memberOf HogBugCards
         */
        value: function setDataSource(freshDataSource) {
            this.dataSource = freshDataSource;
            this.renderAsync = this.renderAsyncSource(freshDataSource);
        }
    }, {
        key: "renderInsert",

        /**
         * @function
         * @instance
         * @memberOf HogBugCards
         * @summary Insert these cards as a part of the document.
         */
        value: function renderInsert() {
            var _this = this;
            this.renderAsync(function (renderedTemplate) {
                _this.docLocation.appendChild(renderedTemplate);
            });
        }
    }]);

    return HogBugCards;
})();

exports.default = HogBugCards;

},{"../helper/Utilities.js":7,"../model/HogBug.js":9,"ejs":4}],14:[function(require,module,exports){
"use strict";

var _createClass = (function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
})();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _ejs = require("ejs");

var _ejs2 = _interopRequireDefault(_ejs);

var _SummaryContainer = require("../model/SummaryContainer.js");

var _SummaryContainer2 = _interopRequireDefault(_SummaryContainer);

var _Utilities = require("../helper/Utilities.js");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

/**
 * @class HomeCards
 */

var HomeCards = (function () {
    function HomeCards() {
        _classCallCheck(this, HomeCards);

        this.docLocation = document.querySelector("#home .page-content");
        this.dataSource = this.defaultDataSource;

        var _this = this;
        this.renderAsync = (function (source) {
            return _this.renderAsyncSource(source);
        })(this.dataSource);
    }

    _createClass(HomeCards, [{
        key: "defaultDataSource",
        value: function defaultDataSource(callback) {
            window.carat.getBugs(function (bugs) {
                window.carat.getHogs(function (hogs) {
                    callback({
                        bugs: bugs,
                        hogs: hogs
                    });
                });
            });
        }
    }, {
        key: "renderAsyncSource",
        value: function renderAsyncSource(sourceCallback) {
            return function (onResultCallback) {
                sourceCallback(function (data) {

                    var model = new _SummaryContainer2.default(data.bugs, data.hogs);
                    var rendered = model.render();

                    if (onResultCallback) {
                        onResultCallback(rendered);
                    }
                });
            };
        }
    }, {
        key: "setDataSource",

        /**
         * @function
         * @instance
         * @param {} freshDataSource A callback which is used for
         acquiring data from the server.
         * @memberOf HomeCards
         */
        value: function setDataSource(freshDataSource) {
            this.dataSource = freshDataSource;
            this.renderAsync = this.renderAsyncSource(freshDataSource);
        }
    }, {
        key: "renderInsert",

        /**
         * @function
         * @instance
         * @memberOf HomeCards
         * @summary Insert these cards as a part of the document.
         */
        value: function renderInsert() {
            var _this = this;
            this.renderAsync(function (renderedTemplate) {
                var node = renderedTemplate;
                _this.docLocation.appendChild(node);
                showOrHideActions();
            });
        }
    }]);

    return HomeCards;
})();

exports.default = HomeCards;

},{"../helper/Utilities.js":7,"../model/SummaryContainer.js":10,"ejs":4}],15:[function(require,module,exports){
"use strict";

var _createClass = (function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
})();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _ejs = require("ejs");

var _ejs2 = _interopRequireDefault(_ejs);

var _Utilities = require("../helper/Utilities.js");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

var Template = "<main class=\"mdl-layout__content\">\r\n    <!-- Home view -->\r\n    <section class=\"mdl-layout__tab-panel is-active\" id=\"home\">\r\n\r\n        <!-- Pie card -->\r\n        <div class=\"page-content\">\r\n            <div class=\"mdl-card mdl-shadow--2dp\">\r\n                <div class=\"carat-caratCard__title\">\r\n                    <div class=\"mdl-card__title-text\r\n                                carat_caratCard_title_text\">\r\n                        Global Statistics\r\n                    </div>\r\n                </div>\r\n                <div class=\"carat-card__supporting-text\">\r\n                    <div class=\"canvas-container\">\r\n                        <canvas width=\"350\" height=\"250\"\r\n                                id=\"chart\"></canvas>\r\n                    </div>\r\n                    <ul id=\"chart-legend\"></ul>\r\n                </div>\r\n            </div>\r\n        </div>\r\n\r\n    </section>\r\n\r\n    <!-- Bugs tabs view -->\r\n    <section class=\"mdl-layout__tab-panel\" id=\"bugs\">\r\n        <div class=\"page-content mdl-grid\">\r\n        </div>\r\n    </section>\r\n\r\n    <!-- Hogs tab view -->\r\n    <section class=\"mdl-layout__tab-panel\" id=\"hogs\">\r\n        <div class=\"page-content mdl-grid\">\r\n        </div>\r\n\r\n        <!-- System tab view -->\r\n    </section>\r\n    <section class=\"mdl-layout__tab-panel\" id=\"system\">\r\n        <div class=\"page-content\">\r\n        </div>\r\n    </section>\r\n</main>\r\n";

var MainContent = (function () {
    function MainContent() {
        _classCallCheck(this, MainContent);

        this.parentId = "main-screen";
    }

    _createClass(MainContent, [{
        key: "renderTemplate",
        value: function renderTemplate() {
            return _ejs2.default.render(Template);
        }
    }, {
        key: "renderInsert",
        value: function renderInsert() {
            var node = _Utilities.Utilities.makeDomNode(renderTemplate());
            document.getElementById(parentId).appendChild(node);
        }
    }]);

    return MainContent;
})();

exports.default = MainContent;

},{"../helper/Utilities.js":7,"ejs":4}],16:[function(require,module,exports){
"use strict";

var _createClass = (function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
})();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _ejs = require("ejs");

var _ejs2 = _interopRequireDefault(_ejs);

var _DeviceStats = require("../model/DeviceStats.js");

var _DeviceStats2 = _interopRequireDefault(_DeviceStats);

var _Utilities = require("../helper/Utilities.js");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

var StatsCards = (function () {
    function StatsCards() {
        _classCallCheck(this, StatsCards);

        this.docLocation = document.querySelector("#system .page-content");
        this.dataSource = this.defaultDataSource;

        var _this = this;
        this.renderAsync = (function (source) {
            return _this.renderAsyncSource(source);
        })(this.dataSource);
    }

    _createClass(StatsCards, [{
        key: "defaultDataSource",
        value: function defaultDataSource(callback) {

            carat.getMainReports(function (main) {
                carat.getMemoryInfo(function (memInfo) {
                    carat.getUuid(function (uuid) {
                        callback({
                            modelName: window.device.model,
                            osVersion: window.device.version,
                            jScore: main.jscore,
                            uuid: uuid,
                            usedMemory: memInfo.total - memInfo.available,
                            totalMemory: memInfo.total,
                            percentage: memInfo.available / memInfo.total,
                            batteryLife: main.batteryLife
                        });
                    });
                });
            });
        }
    }, {
        key: "renderAsyncSource",
        value: function renderAsyncSource(sourceCallback) {
            var _this = this;
            return function (onResultCallback) {
                sourceCallback(function (data) {
                    var myDeviceModel = new _DeviceStats2.default(data);
                    var rendered = myDeviceModel.render();
                    onResultCallback(rendered);
                });
            };
        }
    }, {
        key: "setDataSource",

        /**
         * @function
         * @instance
         * @param {} freshDataSource A callback which is used for
         acquiring data from the server.
         * @memberOf StatsCards
         */
        value: function setDataSource(freshDataSource) {
            this.dataSource = freshDataSource;
            this.renderAsync = this.renderAsyncSource(freshDataSource);
        }
    }, {
        key: "renderInsert",

        /**
         * @function
         * @instance
         * @memberOf StatsCards
         * @summary Insert these cards as a part of the document.
         */
        value: function renderInsert() {
            var _this = this;
            this.renderAsync(function (renderedTemplate) {
                var node = renderedTemplate;
                _this.docLocation.appendChild(node);
            });
        }
    }]);

    return StatsCards;
})();

exports.default = StatsCards;

},{"../helper/Utilities.js":7,"../model/DeviceStats.js":8,"ejs":4}],17:[function(require,module,exports){
"use strict";

var _createClass = (function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
})();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _HomeCards = require("./HomeCards.js");

var _HomeCards2 = _interopRequireDefault(_HomeCards);

var _HogBugCards = require("./HogBugCards.js");

var _HogBugCards2 = _interopRequireDefault(_HogBugCards);

var _StatsCards = require("./StatsCards.js");

var _StatsCards2 = _interopRequireDefault(_StatsCards);

var _Headerbar = require("./Headerbar.js");

var _Headerbar2 = _interopRequireDefault(_Headerbar);

var _MainContent = require("./MainContent.js");

var _MainContent2 = _interopRequireDefault(_MainContent);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

/**
* @class MasterView
* @summary Class that wraps up all other views.
*/

var MasterView = (function () {
    function MasterView() {
        _classCallCheck(this, MasterView);

        this.bugsRawData = [];
        this.hogsRawData = [];
        this.mainReportsRawData = [];
        this.deviceInfoRawData = [];
        this.memoryRawData = [];
        this.savedUuid = "";

        this.headerView = new _Headerbar2.default();
        this.mainView = new _MainContent2.default();
        this.homeView = new _HomeCards2.default();
        this.statsView = new _StatsCards2.default();
        this.bugsView = new _HogBugCards2.default(carat.getHogs, "bugs");
        this.hogsView = new _HogBugCards2.default(carat.getBugs, "hogs");

        this.bugsFetcherAsync = this.bugsFetcherAsync.bind(this);
        this.hogsFetcherAsync = this.hogsFetcherAsync.bind(this);
        this.hogsAndBugsFetcherAsync = this.hogsAndBugsFetcherAsync.bind(this);
        this.myDeviceFetcherAsync = this.myDeviceFetcherAsync.bind(this);
        this.memoryStatsFetcherAsync = this.memoryStatsFetcherAsync.bind(this);

        this.bugsView.setDataSource(this.bugsFetcherAsync);
        this.hogsView.setDataSource(this.hogsFetcherAsync);
        this.homeView.setDataSource(this.hogsAndBugsFetcherAsync);
        this.statsView.setDataSource(this.myDeviceFetcherAsync);
    }

    _createClass(MasterView, [{
        key: "savedInfoFetcherAsync",
        value: function savedInfoFetcherAsync(savedInfo, dataSource, callback) {
            if (!savedInfo || savedInfo.length === 0) {

                dataSource(function (data) {

                    savedInfo = data;
                    callback(data);
                });
            } else {
                callback(savedInfo);
            }
        }
    }, {
        key: "uuidFetcherAsync",
        value: function uuidFetcherAsync(callback) {

            var uuidGetter = function uuidGetter(action) {
                carat.getUuid(function (uuid) {
                    if (!uuid) {
                        action("Default");
                    }

                    action(uuid);
                });
            };

            this.savedInfoFetcherAsync(this.savedUuid, uuidGetter, callback);
        }
    }, {
        key: "memoryStatsFetcherAsync",
        value: function memoryStatsFetcherAsync(callback) {

            var getMemory = function getMemory(action) {
                carat.getMemoryInfo(function (memInfo) {
                    var usedMemory = Math.round((memInfo.total - memInfo.available) / 1000);
                    var totalMemory = Math.round(memInfo.total / 1000);
                    var percentage = Math.floor(usedMemory / totalMemory * 100);

                    var result = {
                        usedMemory: usedMemory,
                        totalMemory: totalMemory,
                        percentage: percentage
                    };

                    action(result);
                });
            };

            this.savedInfoFetcherAsync(this.memoryRawData, getMemory, callback);
        }
    }, {
        key: "mainReportsFetcherAsync",
        value: function mainReportsFetcherAsync(callback) {

            this.savedInfoFetcherAsync(this.mainReportsRawData, carat.getMainReports, callback);
        }
    }, {
        key: "deviceInfoFetcherAsync",
        value: function deviceInfoFetcherAsync(callback) {

            var getDeviceInfo = function getDeviceInfo(action) {
                var device = {
                    modelName: window.device.model,
                    osVersion: window.device.platform + " " + window.device.version
                };
                action(device);
            };

            this.savedInfoFetcherAsync(this.deviceInfoRawData, getDeviceInfo, callback);
        }
    }, {
        key: "myDeviceFetcherAsync",
        value: function myDeviceFetcherAsync(callback) {

            var _this = this;
            _this.deviceInfoFetcherAsync(function (deviceInfo) {
                _this.memoryStatsFetcherAsync(function (memInfo) {
                    _this.mainReportsFetcherAsync(function (mainData) {
                        _this.uuidFetcherAsync(function (uuid) {
                            callback({
                                modelName: deviceInfo.modelName,
                                osVersion: deviceInfo.osVersion,
                                jScore: mainData.jscore,
                                uuid: uuid,
                                usedMemory: memInfo.usedMemory,
                                totalMemory: memInfo.totalMemory,
                                memoryPercentage: memInfo.percentage,
                                batteryLife: mainData.batteryLife
                            });
                        });
                    });
                });
            });
        }
    }, {
        key: "bugsFetcherAsync",
        value: function bugsFetcherAsync(callback) {
            this.savedInfoFetcherAsync(this.bugsRawData, carat.getBugs, callback);
        }
    }, {
        key: "hogsFetcherAsync",
        value: function hogsFetcherAsync(callback) {

            this.savedInfoFetcherAsync(this.hogsRawData, carat.getHogs, callback);
        }
    }, {
        key: "hogsAndBugsFetcherAsync",
        value: function hogsAndBugsFetcherAsync(callback) {

            var _this = this;
            _this.bugsFetcherAsync(function (bugs) {
                _this.hogsFetcherAsync(function (hogs) {
                    callback({
                        bugs: bugs,
                        hogs: hogs
                    });
                });
            });
        }
    }, {
        key: "render",
        value: function render() {
            this.bugsView.renderInsert();
            this.hogsView.renderInsert();
            this.homeView.renderInsert();
            this.statsView.renderInsert();
        }
    }, {
        key: "renderBase",
        value: function renderBase() {
            this.headerView.renderInsert();
            this.mainView.renderInsert();
        }
    }]);

    return MasterView;
})();

window.MasterView = MasterView;
exports.default = MasterView;

},{"./Headerbar.js":12,"./HogBugCards.js":13,"./HomeCards.js":14,"./MainContent.js":15,"./StatsCards.js":16}]},{},[17]);
