/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*- */
'use strict';
let DEBUG_ADDON = false;

var lo = require("@loader/options");
let sp = require('sdk/simple-prefs');
// See https://github.com/mozilla-jetpack/jpm/issues/339
sp.prefs['sdk.console.logLevel'] = 'info';
DEBUG_ADDON &&
  console.dir(lo);
var path;
if (lo && lo.metadata.title) {
  path = ("../");
} else {
  path = ("./main");
}
var main = require(path);
// var main = require("../lib/main");
exports["test main"] = function(assert) {
  assert.pass("Unit test running!");
};

exports["test main async"] = function(assert, done) {
  assert.pass("async Unit test running!");
  done();
};

exports["test dummy"] = function(assert, done) {
  main.dummy("foo", function(text) {
    assert.ok((text === "foo"), "Is the text (" + text + ") actually 'foo'");
    done();
  });
};

require("sdk/test").run(exports);
