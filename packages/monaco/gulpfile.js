let gulp = require("gulp");
let ts = require("gulp-typescript");
let sourcemaps = require('gulp-sourcemaps');
let less = require("gulp-less");

let tsProject = ts.createProject("tsconfig.json");

gulp.task("ts", function () {
    return tsProject.src()
        .pipe(sourcemaps.init())
        .pipe(tsProject())
        .pipe(sourcemaps.write("../lib"))
        .pipe(gulp.dest("lib"));
});

gulp.task("less", function () {
    return gulp.src("./src/style/**.less")
        .pipe(less())
        .pipe(gulp.dest("./lib/style"));
});

gulp.task("assets", function () {
    return gulp.src("./src/assets/**")
        .pipe(gulp.dest("./lib/assets"));
});

gulp.task("watch", function () {
    gulp.watch("./src/style/**.less", gulp.parallel("less"));
    gulp.watch("./src/**/**.ts", gulp.parallel("ts"));
    gulp.watch("./src/**/**.tsx", gulp.parallel("ts"));
    gulp.watch("./src/assets/**", gulp.parallel("assets"));
});

gulp.task("default", gulp.parallel("ts", "less", "assets"));
