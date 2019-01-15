"use strict";

var gulp = require('gulp');
var plumber = require('gulp-plumber');
var jasmine = require('gulp-jasmine');
var istanbul = require('gulp-istanbul');
var coveralls = require('mwittig-gulp-coveralls');
var replace = require('gulp-replace');
var rename = require('gulp-rename');
var print = require('gulp-print');

gulp.task('pre-test', function () {
    return gulp.src(['src/**/*.js'])
        .pipe(plumber())
        .pipe(istanbul({includeUntested: true}))
        .pipe(istanbul.hookRequire());
});

gulp.task('test', ['pre-test'], function () {
    //process.env.MILIGHT_DEBUG = true;
    return gulp.src(['test/v6.js', 'test/legacy.js'])
        .pipe(plumber())
        .pipe(jasmine({
            verbose: false,
            includeStackTrace: true
        }))
        .pipe(istanbul.writeReports({
            dir: './coverage',
            reporters: ['lcov', 'json', 'text', 'text-summary'],
            reportOpts: {dir: './coverage'}
        }))
        .pipe(istanbul.enforceThresholds({ thresholds: { global: 50 } }));
});

gulp.task('coveralls', function () {
    return gulp.src('./coverage/**/lcov.info')
        .pipe(coveralls())
});

gulp.task('build', function() {
    return gulp.src(['src/commands.js'])
        .pipe(replace(/,\s{0,}0x55/g, ''))
        .pipe(print())
        .pipe(rename('commands2.js'))
        .pipe(gulp.dest('src'))
});

gulp.task('default', ['test']);