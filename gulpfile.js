var gulp = require('gulp'),
    mochaPhantomJs = require('gulp-mocha-phantomjs'),
    jshint = require('gulp-jshint'),
    ghPages = require('gulp-gh-pages'),
    copy = require('gulp-copy'),
    path = require('path');

// Lint JavaScript.
gulp.task('lint', function() {
	return gulp.src('src/**/*.js')
		.pipe(jshint())
		.pipe(jshint.reporter('default'));
});

// Run client-side tests.
gulp.task('spec', ['lint'], function() {
    return gulp.src('spec/runner.html')
        .pipe(mochaPhantomJs({ reporter: 'spec' }));
});

// Define default task.
gulp.task('default', [ 'spec' ]);

// Define task copying deployables to gh-pages folder.
var ghPagesSource = [ './index.html', './style.css', './data/**/*.json', './fonts/**/*', './bower_components/**/*.js', './src/**/*.js' ];

gulp.task('copy-deploy', function() {
	gulp.src(ghPagesSource)
		.pipe(copy('./gh-pages/'));
});
