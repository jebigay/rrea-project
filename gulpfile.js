"use strict";

// Import required plugins (use dynamic import for ES Modules)
import autoprefixer from "gulp-autoprefixer";
import browsersync from "browser-sync";
import cleanCSS from "gulp-clean-css";
import del from "del";
import gulp from "gulp";
import insert from "gulp-insert"; // ✅ Replaced gulp-header with gulp-insert
import merge from "merge-stream";
import plumber from "gulp-plumber";
import rename from "gulp-rename";
import sass from "gulp-sass";
import uglify from "gulp-uglify";
// import sourcemaps from "gulp-sourcemaps";

// Import package.json for banner
import pkg from './package.json' assert { type: 'json' };


// Initialize the browsersync instance
const browsersyncInstance = browsersync.create();

// Set the banner content
const banner = [
  '/*!\n',
  ' * Start Bootstrap - <%= pkg.title %> v<%= pkg.version %> (<%= pkg.homepage %>)\n',
  ' * Copyright 2013-' + new Date().getFullYear(), ' <%= pkg.author %>\n',
  ' * Licensed under <%= pkg.license %> (https://github.com/BlackrockDigital/<%= pkg.name %>/blob/master/LICENSE)\n',
  ' */\n',
  '\n'
].join('');

// BrowserSync function
function browserSync(done) {
  browsersyncInstance.init({
    server: {
      baseDir: "./"
    },
    port: 3000
  });
  done();
}

// BrowserSync reload function
function browserSyncReload(done) {
  browsersyncInstance.reload();
  done();
}

// Clean vendor folder
function clean() {
  return del(["./vendor/"]);
}

// Bring third-party dependencies from node_modules into vendor directory
function modules() {
  const bootstrap = gulp.src('./node_modules/bootstrap/dist/**/*')
    .pipe(gulp.dest('./vendor/bootstrap'));
  
  const fontAwesomeCSS = gulp.src('./node_modules/@fortawesome/fontawesome-free/css/**/*')
    .pipe(gulp.dest('./vendor/fontawesome-free/css'));
  
  const fontAwesomeWebfonts = gulp.src('./node_modules/@fortawesome/fontawesome-free/webfonts/**/*')
    .pipe(gulp.dest('./vendor/fontawesome-free/webfonts'));
  
  const jqueryEasing = gulp.src('./node_modules/jquery.easing/*.js')
    .pipe(gulp.dest('./vendor/jquery-easing'));
  
  const jquery = gulp.src([
    './node_modules/jquery/dist/*',
    '!./node_modules/jquery/dist/core.js'
  ])
    .pipe(gulp.dest('./vendor/jquery'));

  return merge(bootstrap, fontAwesomeCSS, fontAwesomeWebfonts, jquery, jqueryEasing);
}

// CSS task
function css() {
  return gulp
    .src("./scss/**/*.scss")
    .pipe(plumber())
    .pipe(sass({
      outputStyle: "expanded",
      includePaths: "./node_modules",
    }).on("error", sass.logError))
    .pipe(autoprefixer({
      cascade: false
    }))
    .pipe(insert.prepend(banner)) // ✅ Using insert.prepend for banner
    .pipe(gulp.dest("./css"))
    .pipe(rename({ suffix: ".min" }))
    .pipe(cleanCSS())
    .pipe(gulp.dest("./css"))
    .pipe(browsersyncInstance.stream());
}

// JS task
function js() {
  return gulp
    .src([
      './js/*.js',
      '!./js/*.min.js',
      '!./js/contact_me.js',
      '!./js/jqBootstrapValidation.js'
    ])
    .pipe(uglify())
    .pipe(insert.prepend(banner)) // ✅ Using insert.prepend for banner
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('./js'))
    .pipe(browsersyncInstance.stream());
}

// Watch files
function watchFiles() {
  gulp.watch("./scss/**/*", css);
  gulp.watch(["./js/**/*", "!./js/**/*.min.js"], js);
  gulp.watch("./**/*.html", browserSyncReload);
}

// Define complex tasks
const vendor = gulp.series(clean, modules);
const build = gulp.series(vendor, gulp.parallel(css, js));
const watch = gulp.series(build, gulp.parallel(watchFiles, browserSync));

// Export tasks
export { css, js, clean, vendor, build, watch, browserSync, browserSyncReload };
export default build;
