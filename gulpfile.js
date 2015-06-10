var gulp = require('gulp'),
    mochaPhantomJs = require('gulp-mocha-phantomjs');


gulp.task('spec', function() {
    return gulp.src('spec/runner.html')
        .pipe(mochaPhantomJs({ reporter: 'spec' }));
});