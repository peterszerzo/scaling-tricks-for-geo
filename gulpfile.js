var gulp = require('gulp'),
    mochaPhantomJs = require('gulp-mocha-phantomjs'),
    jshint = require('gulp-jshint'),
    ghPages = require('gulp-gh-pages');

gulp.task('lint', function() {
	return gulp.src('src/**/*.js')
		.pipe(jshint())
		.pipe(jshint.reporter('default'));
});

gulp.task('spec', ['lint'], function() {
    return gulp.src('spec/runner.html')
        .pipe(mochaPhantomJs({ reporter: 'spec' }));
});

gulp.task('deploy', function() {
	return gulp.src([ 'index.html', 'style.css', 'data/**/*.json', 'fonts/**/*', 'bower_components/**/*', 'src/**/*.js' ]);
});

gulp.task('default', [ 'spec' ]);