// node v4.1.1 on Windows XP requires double-quotes, no semicolon
// before, must be first statement.
"use strict";

const gulp = require('gulp');
const concat = require('gulp-concat');

gulp.task('shim-pouchdb', function() {
	return gulp.src([
		'./lib/anaran-jetpack-add-on/pouchdb-add-on-sdk-shim.js',
		'./node_modules/pouchdb/dist/pouchdb.min.js'])
		.pipe(concat('pouchdb-shimmed.js'))
		.pipe(gulp.dest('./lib'));
});
