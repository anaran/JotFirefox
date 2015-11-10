// node v4.1.1 on Windows XP requires double-quotes, no semicolon
// before, must be first statement.
"use strict";

const gulp = require('gulp');
const concat = require('gulp-concat');

const gulpMarked = require('gulp-marked');
const marked = require('marked');

const pre =
    '<!DOCTYPE html>\n' +
    '<html lang="en">\n' +
    '    <head>\n' +
    '        <meta charset=utf-8>\n' +
    '        <meta name="viewport" content="height=device-height, width=device-width, initial-scale=1, minimum-scale=0.25, maximum-scale=4, user-scalable=yes">\n' +
    '        <title data-l10n-id="help_title">$TITLE$</title>\n' +
    '        <link rel="icon" href="icon48.png" id="favicon" type="image/png">\n' +
    '        <link rel="stylesheet" href="../data/help.css"/>\n' +
    '    </head>\n' +
    '    <body class="help_body">\n' +
    '        <div class="help_div">\n';
const post =
    '        </div>\n' +
    '    </body>\n' +
    '</html>\n';

let toc = [];
const addTableOfContents = function (err, out) {
  let tocHTML = '<h1 id="table-of-contents">Index</h1>\n<ul>';
  toc.forEach(function (entry) {
    tocHTML += '<li><a href="#'+entry.anchor+'">'+entry.text+'</a></li>\n';
  });
  toc = [];
  tocHTML += '</ul>\n';
  return pre + out + tocHTML + post;
};

const renderer = (function() {
  let renderer = new marked.Renderer();
  renderer.heading = function(text, level, raw) {
    let anchor = this.options.headerPrefix + raw.toLowerCase().replace(/[^\w]+/g, '-');
    toc.push({
      anchor: anchor,
      level: level,
      text: text
    });
    return '<h'
    + level
    + ' id="'
    + anchor
    + '">'
    + text
    + '</h'
    + level
    + '>\n'
    + '<a href="#table-of-contents">Index</a>\n';
  };
  renderer.link = function(href, title, text) {
    let out = '<a href="' + href.replace(/\.md$/, outputExtension) + '"';
  if (title) {
    out += ' title="' + title + '"';
  }
  out += '>' + text + '</a>';
  return out;
  };
  return renderer;
})();

// NOTE: Currently an implied assumption:
const outputExtension = '.html';

// Requires https://github.com/lmtm/gulp-marked/pull/15
gulp.task('md2html', function() {
  gulp.src(['data/*.md'])
  .pipe(gulpMarked({
    renderer: renderer,
    gfm: true,
    tables: true,
    breaks: false,
    pedantic: false,
    sanitize: true,
    smartLists: true,
    smartypants: false
  }, addTableOfContents))
  .pipe(gulp.dest('data/'));
});

gulp.task('shim-pouchdb', function() {
	return gulp.src([
		'./lib/anaran-jetpack-add-on/pouchdb-add-on-sdk-shim.js',
		'./node_modules/pouchdb/dist/pouchdb.min.js'])
		.pipe(concat('pouchdb-shimmed.js'))
		.pipe(gulp.dest('./lib'));
});
