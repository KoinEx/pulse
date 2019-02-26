var gulp = require('gulp');
var sass = require('gulp-sass');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var browserSync = require('browser-sync').create();



gulp.task('scripts', function(){
    return browserify(['./src/app/services/contentScriptService.js'])
    .transform("babelify", {presets: [["es2015"],["minify",{mangle:true,removeConsole:true,builtIns:false}]]})
    .bundle()
    .pipe(source('vendor.min.js'))
    .pipe(gulp.dest('./pulse/'));
});


gulp.task('browserify', function() {
    return browserify(['./src/app/app.js'])
    .transform("babelify", {plugins: ["angularjs-annotate"],presets: [["es2015"],["minify",{mangle:true,removeConsole:true,builtIns: false}]]})
    .bundle()
    .pipe(source('main.js'))
    .pipe(gulp.dest('./pulse/'));
})


gulp.task('background',['contentScript'],function() {
    return browserify(['./src/background.js'])
    .transform("babelify", {presets: [["es2015"],["minify",{mangle:true,removeConsole:true,builtIns: false}]]})
    .bundle()
    .pipe(source('background.js'))
    .pipe(gulp.dest('./pulse/'));  
})

gulp.task('contentScript',function() {
    return browserify(['./src/contentscript.js'])
    .transform("babelify", {presets: [["es2015"],["minify",{mangle:true,removeConsole:true,builtIns:false}]]})
    .bundle()
    .pipe(source('contentscript.js'))
    .pipe(gulp.dest('./pulse/'));  
})

gulp.task('images',function() {
    gulp.src('./src/**/*.png')
        .pipe(gulp.dest('./pulse'))
});


gulp.task('copy', ['browserify','scss'], function() {
    gulp.src(['./src/**/*.html','./src/**/styles.css'])
        .pipe(gulp.dest('./pulse'))
		.pipe(browserSync.stream())
});

gulp.task('scss', function() {
    gulp.src('./src/assets/scss/styles.scss')
        .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(gulp.dest('./src/assets/stylesheets/'));
});



gulp.task('build',['scss', 'copy' ,'background', 'scripts','images']);

gulp.task('browser-sync', ['build'], function() {
    browserSync.init({
        server: {
            baseDir: "./pulse",
        },
    });
});


gulp.task('default', ['browser-sync'], function(){
	gulp.watch("./src/**/*.*", ["build"]);
	gulp.watch("./pulse/**/*.*").on('change', browserSync.reload);
})
