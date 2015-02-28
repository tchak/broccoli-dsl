import util from 'util';
import broccoliMerge from 'broccoli-merge-trees';
import broccoliStatic from 'broccoli-static-compiler';

import requireRelative from 'require-relative';

function tryToLoad(plugin) {
  return requireRelative('broccoli-dsl-' + plugin, process.cwd());
}

const TRANSFORMS = {
  'babel':   transpiler,
  'concat': concat,
  'wrap':   wrap,
  'iife':   iife,
  'sass':   sass,
  'jshint': jshint
};

var broccoliTranspiler;
function transpiler(tree, options) {
  options = options || {};
  options.modules = options.modules || 'amd';

  if (options.modules === 'amd') {
    options.moduleIds = true;
    if (options.namespace) {
      options.moduleRoot = options.namespace;
    }
  }
  delete options.namespace;

  broccoliTranspiler = broccoliTranspiler || require('broccoli-babel-transpiler');
  return broccoliTranspiler(tree, options);
}

var broccoliConcat;
function concat(tree, options) {
  options = options || {};

  if (typeof options === 'string') {
    options = { outputFile: options };
  } else if (options.out) {
    options.outputFile = options.out;
  }

  options.outputFile = options.outputFile || '/scripts.js';

  if (!options.outputFile.match(/^\//)) {
    options.outputFile = `/${options.outputFile}`;
  }

  options.inputFiles = options.src || [ '**/*.js' ];

  delete options.src;
  delete options.out;

  broccoliConcat = broccoliConcat || require('broccoli-concat');
  return broccoliConcat(tree, options);
}

var broccoliWrap;
function wrap(tree, options) {
  broccoliWrap = broccoliWrap || require('broccoli-wrap');
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
  var outputFile = options.out || 'styles.css';

  delete options.src;
  delete options.out;

  broccoliSass = broccoliSass || require('broccoli-sass');
  broccoliSass([tree], inputFile, outputFile, options);
}

var broccoliJshint;
function jshint(tree, options) {
  options = options || {};
  options.disableTestGenerator = true;

  broccoliJshint = broccoliJshint || require('broccoli-jshint');
  return broccoliJshint(tree, options);
}

class DSL {
  constructor(tree) {
    this.tree = tree;
  }

  transform(fn, options) {
    if (typeof fn === 'string') {
      fn = TRANSFORMS[fn] || tryToLoad(fn);
    }

    this.tree = fn(this.tree, options);

    return this;
  }

  read(readTree) {
    return this.tree.read(readTree);
  }

  cleanup() {
    return this.tree.cleanup();
  }
}

export default function getTree(input, options) {
  if (input instanceof DSL) {
    return input;
  }

  if (util.isArray(input)) {
    return merge(input.map(getTree));
  }

  if (typeof input === 'string') {
    return source(input, options);
  }
}

function merge(inputs) {
  var tree = broccoliMerge(inputs);
  return new DSL(tree);
}

function source(input, options) {
  options = options || {};

  if (typeof options === 'string') {
    options = { files: options };
  }

  options.srcDir = options.src || '/';
  options.destDir = options.out || '/';

  delete options.src;
  delete options.out;

  var tree = broccoliStatic(input, options);
  return new DSL(tree);
}
