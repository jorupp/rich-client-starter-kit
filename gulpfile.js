var gulp = require('gulp');
var wiredep = require('wiredep');
var merge = require('gulp-merge');
var sourcemaps = require('gulp-sourcemaps');
var ts = require('gulp-typescript');
var runSequence = require('run-sequence');
var changed = require('gulp-changed');
var less = require('gulp-less');
var connect = require('gulp-connect');
var open = require('open');
var serveStatic = require('serve-static');
var inject = require('gulp-inject');

var SCRIPT_SOURCE = 'src/**/*.ts'
var STYLE_SOURCE = 'src/**/*.less'
var INDEX_SOURCE = 'src/index.html'
var PORT = 4567;

var tsProject = ts.createProject({
    declartionFiles: true,
    noExternalResolve: true,
    sortProject: true
});
gulp.task('scripts', [], function() {
    var tsResult =
        gulp.src(SCRIPT_SOURCE)
        .pipe(sourcemaps.init())
        .pipe(ts(tsProject, undefined, ts.reporter.longReporter()));
    return merge([
        tsResult.dts
            .pipe(gulp.dest('dist/definitions')),
        tsResult.js
            .pipe(sourcemaps.write())
            .pipe(gulp.dest('dist/scripts'))
    ]);
});
gulp.task('styles', ['fonts'], function () {
    return gulp.src(STYLE_SOURCE)
        .pipe(changed('dist/styles'))
        .pipe(sourcemaps.init())
        .pipe(wiredep.stream())
        .pipe(less())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('dist/styles'));
});
gulp.task('fonts', [], function() {
    return gulp.src('bower_components/bootstrap-less/fonts/*')
        .pipe(gulp.dest('dist/fonts'));
});

gulp.task('index', ['scripts', 'styles'], function() {
    return gulp.src(INDEX_SOURCE)
        .pipe(wiredep.stream())
        .pipe(inject(gulp.src(['dist/scripts/**/*.js', 'dist/styles/**/*.css'], { read: false}), { ignorePath: 'dist' }))
        .pipe(gulp.dest('./dist'));
});

gulp.task('server', ['index'], function() {
    connect.server({ 
        livereload: { port: 12345 }, 
        port: PORT, 
        root: ['dist', '.'], 
        middleware: function(c, opt) {
            return [
               // c.proto.use('bower_components', serveStatic('bower_components'))
            ];
        }
    });
});
gulp.task('open', ['server'], function() {
    open('http://localhost:' + PORT);
});
gulp.task('reload', [], function() {
    connect.reload();
});

gulp.task('watch', ['scripts'], function() {
    gulp.watch(SCRIPT_SOURCE, function() { runSequence('scripts', 'index', 'reload'); });
    gulp.watch(STYLE_SOURCE, function() { runSequence('styles', 'index', 'reload'); });
    gulp.watch(INDEX_SOURCE, function() { runSequence('index', 'reload'); });
});

gulp.task('default', function(callback) {
    runSequence('open', 'watch', callback);
});
