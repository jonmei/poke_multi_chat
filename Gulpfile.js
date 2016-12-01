var gulp = require('gulp');
var sass = require('gulp-sass');
var cleanCSS = require('gulp-clean-css');
var concat = require('gulp-concat');
var merge = require('merge-stream');
var uglify = require('gulp-uglify');
var watch = require('gulp-watch');
var stripDebug = require('gulp-strip-debug');

var sources = {
    mainSrc: './public/',
    assetsSrc: function() {
        return sources.mainSrc + 'assets/';
    },
    sassSrc: function() {
        return sources.assetsSrc() + 'sass/';
    },
    cssSrc: function() {
        return sources.assetsSrc() + 'css/';
    },
    jsSrc: function() {
        return sources.assetsSrc() + 'js/';
    },
    dist: function() {
        return sources.mainSrc + 'dist/';
    }
};

gulp.task('styles_chat', function() {

    var scssStream = gulp.src(sources.sassSrc() + 'chat.scss')
        .pipe(sass())
        .pipe(concat('scss-files.scss'));

    var cssStream = gulp.src([
        sources.cssSrc() + 'jquery.mCustomScrollbar.min.css'
    ]).pipe(concat('css-files.css'));

    var mergedStream = merge(cssStream, scssStream)
        .pipe(concat('chat.min.css'))
        .pipe(cleanCSS({compatibility: 'ie8'}))
        .pipe(gulp.dest(sources.dist));

    return mergedStream;
});

gulp.task('styles_home', function() {

    var scssStream = gulp.src(sources.sassSrc() + 'home.scss')
        .pipe(sass())
        .pipe(concat('scss-files.scss'));

    var cssStream = gulp.src([]).pipe(concat('css-files.css'));

    return merge(cssStream, scssStream)
        .pipe(concat('home.min.css'))
        .pipe(cleanCSS({compatibility: 'ie8'}))
        .pipe(gulp.dest(sources.dist));
});

gulp.task('scripts_chat', function(){
    return gulp.src([
        sources.jsSrc() + 'libs/jquery.mCustomScrollbar.concat.min.js',
        sources.jsSrc() + 'chat.js'
    ])
        .pipe(concat('chat.min.js'))
        .pipe(stripDebug())
        .pipe(uglify())
        .pipe(gulp.dest(sources.dist));
});

gulp.task('scripts_home', function(){
    return gulp.src([
        sources.jsSrc() + 'home.js'
    ])
        .pipe(concat('home.min.js'))
        .pipe(stripDebug())
        // .pipe(uglify())
        .pipe(gulp.dest(sources.dist));
});

gulp.task('watch', function(){
    gulp.watch(sources.sassSrc() + '**/*.scss', ['styles']);
});

