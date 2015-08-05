var gulp = require('gulp'),
    mochaPhantomJs = require('gulp-mocha-phantomjs'),
    jshint = require('gulp-jshint'),
    ghPages = require('gulp-gh-pages'),
    copy = require('gulp-copy'),
    path = require('path');

var jsSource = {
    vendor: [ 
        "bower_components/underscore/underscore.js",
        "bower_components/jquery/dist/jquery.js",
        "bower_components/backbone/backbone.js",
        "bower_components/marionette/lib/backbone.marionette.js",
        "bower_components/d3/d3.js",
        "bower_components/topojson/topojson.js"
    ]
};

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

// Copy vendor scripts out of bower_components so that they transfer to GitHub pages branch.
gulp.task('copy-vendor', function() {
    gulp.src(jsSource.vendor)
        .pipe(copy('vendor', { prefix: 1 }));
});

// Define default task.
gulp.task('default', [ 'spec' ]);

// Define task copying deployables to gh-pages folder.
var ghPagesSource = [ './index.html', './style.css', './data/**/*.json', './fonts/**/*', './bower_components/**/*.js', './src/**/*.js' ];

gulp.task('copy-deploy', function() {
	gulp.src(ghPagesSource)
		.pipe(copy('./gh-pages/'));
});
