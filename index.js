"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

module.exports = getTree;

var util = _interopRequire(require("util"));

var broccoliMerge = _interopRequire(require("broccoli-merge-trees"));

var broccoliStatic = _interopRequire(require("broccoli-static-compiler"));

var requireRelative = _interopRequire(require("require-relative"));

function tryToLoad(plugin) {
  return requireRelative("broccoli-dsl-" + plugin, process.cwd());
}

var TRANSFORMS = {
  "6to5": transpiler,
  concat: concat,
  wrap: wrap,
  iife: iife,
  sass: sass,
  jshint: jshint
};

var broccoliTranspiler;
function transpiler(tree, options) {
  options = options || {};
  options.modules = options.modules || "amd";

  if (options.modules === "amd") {
    options.moduleIds = true;
    if (options.namespace) {
      options.moduleRoot = options.namespace;
    }
  }
  delete options.namespace;

  broccoliTranspiler = broccoliTranspiler || require("broccoli-6to5-transpiler");
  return broccoliTranspiler(tree, options);
}

var broccoliConcat;
function concat(tree, options) {
  options = options || {};

  if (typeof options === "string") {
    options = { outputFile: options };
  } else if (options.out) {
    options.outputFile = options.out;
  }

  options.outputFile = options.outputFile || "/scripts.js";

  if (!options.outputFile.match(/^\//)) {
    options.outputFile = "/" + options.outputFile;
  }

  options.inputFiles = options.src || ["**/*.js"];

  delete options.src;
  delete options.out;

  broccoliConcat = broccoliConcat || require("broccoli-concat");
  return broccoliConcat(tree, options);
}

var broccoliWrap;
function wrap(tree, options) {
  broccoliWrap = broccoliWrap || require("broccoli-wrap");
  return broccoliWrap(tree, options);
}

function iife(tree) {
  var options = { wrapper: ["(function(){;\n", "})();"] };

  return wrapper(tree, options);
}

var broccoliSass;
function sass(tree, options) {
  options = options || {};
  var inputFile = options.src;
  var outputFile = options.out || "styles.css";

  delete options.src;
  delete options.out;

  broccoliSass = broccoliSass || require("broccoli-sass");
  broccoliSass([tree], inputFile, outputFile, options);
}

var broccoliJshint;
function jshint(tree, options) {
  options = options || {};
  options.disableTestGenerator = true;

  broccoliJshint = broccoliJshint || require("broccoli-jshint");
  return broccoliJshint(tree, options);
}

var DSL = (function () {
  function DSL(tree) {
    _classCallCheck(this, DSL);

    this.tree = tree;
  }

  _prototypeProperties(DSL, null, {
    transform: {
      value: function transform(fn, options) {
        if (typeof fn === "string") {
          fn = TRANSFORMS[fn] || tryToLoad(fn);
        }

        this.tree = fn(this.tree, options);

        return this;
      },
      writable: true,
      configurable: true
    },
    read: {
      value: function read(readTree) {
        return this.tree.read(readTree);
      },
      writable: true,
      configurable: true
    },
    cleanup: {
      value: function cleanup() {
        return this.tree.cleanup();
      },
      writable: true,
      configurable: true
    }
  });

  return DSL;
})();

function getTree(input, options) {
  if (input instanceof DSL) {
    return input;
  }

  if (util.isArray(input)) {
    return merge(input.map(getTree));
  }

  if (typeof input === "string") {
    return source(input, options);
  }
}

function merge(inputs) {
  var tree = broccoliMerge(inputs);
  return new DSL(tree);
}

function source(input, options) {
  options = options || {};

  if (typeof options === "string") {
    options = { files: options };
  }

  options.srcDir = options.src || "/";
  options.destDir = options.out || "/";

  delete options.src;
  delete options.out;

  var tree = broccoliStatic(input, options);
  return new DSL(tree);
}
