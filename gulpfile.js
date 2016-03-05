"use strict";

var gulp = require('gulp');
var plumber = require('gulp-plumber');
var jasmine = require('gulp-jasmine');
var istanbul = require('gulp-istanbul');
var coveralls = require('gulp-coveralls');

gulp.task('pre-test', function () {
    return gulp.src(['src/**/*.js'])
        .pipe(plumber())
        .pipe(istanbul({includeUntested: true}))
        .pipe(istanbul.hookRequire());
});

gulp.task('test', ['pre-test'], function () {
    return gulp.src('test/index.js')
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

gulp.task('default', ['test']);