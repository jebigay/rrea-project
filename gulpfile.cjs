const gulp = require("gulp");
const browsersync = require("browser-sync").create();
const del = require("del");
const insert = require("gulp-insert");
const merge = require("merge-stream");
const plumber = require("gulp-plumber");
const rename = require("gulp-rename");
const dartSass = require("sass");
const gulpSass = require("gulp-sass")(dartSass);
const uglify = require("gulp-uglify");
const pkg = require("./package.json");
const path = require("path");
const fs = require("fs");

// Dynamically import ES module packages as functions
let autoprefixer, cleanCSS;

(async () => {
  autoprefixer = (await import("gulp-autoprefixer")).default;  // Default export
  cleanCSS = (await import("gulp-clean-css")).default;        // Default export
})();

// Vendor management tasks
const vendor = gulp.series(clean, modules);

// Banner template
const banner = `/*! 
 * Start Bootstrap - ${pkg.title} v${pkg.version} (${pkg.homepage})
 * Copyright 2013-${new Date().getFullYear()} ${pkg.author}
 * Licensed under ${pkg.license} (https://github.com/BlackrockDigital/${pkg.name}/blob/master/LICENSE)
 */
`;

// BrowserSync
function browserSync(done) {
  browsersync.init({
    server: { baseDir: "./" },
    port: 3000,
  });
  done();
}

function browserSyncReload(done) {
  browsersync.reload();
  done();
}

// Clean vendor
function clean() {
  return del(["./vendor/"]);
}

// Copy vendor modules
function modules() {
  const bootstrap = gulp.src("./node_modules/bootstrap/dist/**/*")
    .pipe(gulp.dest("./vendor/bootstrap"));

  const fontAwesomeCSS = gulp.src("./node_modules/@fortawesome/fontawesome-free/css/**/*")
    .pipe(gulp.dest("/vendor/fontawesome-free/css"));

  const fontAwesomeWebfonts = gulp.src("./node_modules/@fortawesome/fontawesome-free/webfonts/**/*")
    .pipe(gulp.dest("./vendor/fontawesome-free/webfonts"));

  const jqueryEasing = gulp.src("./node_modules/jquery.easing/*.js")
    .pipe(gulp.dest("./vendor/jquery-easing"));

  const jquery = gulp.src([
    "./node_modules/jquery/dist/*",
    "!./node_modules/jquery/dist/core.js"
  ])
    .pipe(gulp.dest("./vendor/jquery"));

  return merge(bootstrap, fontAwesomeCSS, fontAwesomeWebfonts, jqueryEasing, jquery);
}

// CSS task
async function css() {
  console.log("Running CSS task...");

  // Ensure dynamic imports are resolved
  if (!autoprefixer || !cleanCSS) {
    const ap = await import("gulp-autoprefixer");
    autoprefixer = ap.default;
    const cc = await import("gulp-clean-css");
    cleanCSS = cc.default;
  }

  return gulp.src("./scss/**/*.scss", { allowEmpty: true })
    .pipe(plumber())
    .pipe(gulpSass({ outputStyle: "expanded" }).on("error", gulpSass.logError))
    .pipe(autoprefixer({ cascade: false }))
    .pipe(insert.prepend("/* Custom banner */"))
    .pipe(gulp.dest("./css"))
    .pipe(rename({ suffix: ".min" }))
    .pipe(cleanCSS())
    .pipe(gulp.dest("./css"))
    .pipe(browsersync.stream());
}


// JS task
function js() {
  console.log("Running JS task...");

  return gulp.src(["./js/*.js", "!./js/*.min.js", "!./js/contact_me.js", "!./js/jqBootstrapValidation.js"], { allowEmpty: true })
    .pipe(plumber())
    .pipe(uglify().on("error", function (err) {
      console.error("Uglify error:", err.toString());
      this.emit("end");  // Prevent crash
    }))
    .pipe(insert.prepend("/* Custom banner */"))
    .pipe(rename({ suffix: ".min" }))
    .pipe(gulp.dest("./js"))
    .pipe(browsersync.stream());
}

// Watch files
const build = gulp.series(vendor, gulp.parallel(css, js));

function watchFiles(done) {
  gulp.watch("./scss/**/*", css);
  gulp.watch(["./js/**/*", "!./js/**/*.min.js"], js);
  gulp.watch("./**/*.html", browserSyncReload);
  done(); // Signal that watchFiles is done
}

const watch = gulp.series(build, gulp.parallel(watchFiles, browserSync));

// Export tasks
exports.css = css;
exports.js = js;
exports.clean = clean;
exports.modules = modules;
exports.vendor = vendor;
exports.build = build;
exports.watch = watch;
exports.default = build;
exports.browserSyncReload = browserSyncReload;
exports.watchFiles = watchFiles;
