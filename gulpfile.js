// Import config
const config = require('./config.js');

// Gulp imports
const gulp = require('gulp');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;
const clean = require('gulp-clean');
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');
const replace = require('gulp-replace');
const responsive = require('gulp-responsive');
const plumber = require('gulp-plumber');
const pump = require('pump');

// Browser sync import
const browserSync = require('browser-sync').create();

// Gulp tasks
gulp.task(
    'default',
    ['copy-html', 'copy-images', 'scripts', 'copy-from-root', 'styles', 'idb', 'vendor'],
    defaultTask
);
gulp.task(
    'dist',
    ['copy-html', 'copy-images', 'scripts-dist', 'copy-from-root', 'styles', 'idb', 'vendor'],
    defaultTask
);
gulp.task('styles', sassConverter);
gulp.task('copy-html', copyHtml);
gulp.task('copy-images', copyImages);
gulp.task('copy-from-root', copyFromRoot);
gulp.task('scripts', scripts);
gulp.task('scripts-dist', scriptsDist);
gulp.task('vendor', vendor);
gulp.task('clean', cleanDist);
gulp.task('idb', copyIdb);
gulp.task('uglify-error-debugging', uglifyErrorDebugging);

// Functions for tasks
function defaultTask() {
    browserSync.init({
        server: './dist',
        port: 8002
    });
    browserSync.stream();
    gulp.watch('sass/**/*.scss', ['styles']);
    gulp.watch(['*.html'], ['copy-html']);
    gulp.watch(['sw.js'], ['service-worker']);
    gulp.watch(['js/**/*.js'], ['scripts']);
}

function copyHtml() {
    return gulp
        .src('*.html')
        .pipe(plumber())
        .pipe(replace('@@GOOGLE_MAPS_API_KEY', config.GOOGLE_MAPS_API_KEY))
        .pipe(gulp.dest('dist'));
}

function copyImages() {
    return gulp
        .src('img/*')
        .pipe(plumber())
        .pipe(responsive({
            '*.jpg': {
                width: 700,
                quality: 60
            },
            '*.png': {

            }
        }))
        .pipe(gulp.dest('dist/img'));
}

function sassConverter() {
    return gulp
        .src('./sass/**/*.scss')
        .pipe(plumber())
        .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
        .pipe(
            autoprefixer({
                browsers: ['last 2 versions']
            })
        )
        .pipe(gulp.dest('dist/css'));
}

function scripts() {
    return gulp
        .src(['js/**/*.js'])
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(
            babel({
                presets: [
                    ['env',
                        {
                            'targets': {
                                'browsers': ['last 2 versions', 'safari >= 7']
                            },
                            modules: false
                        }
                    ]
                ],
            })
        )
        // .pipe(concat('all.js'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist/js'));
}

function scriptsDist() {
    return gulp
        .src(['js/**/*.js'])
        .pipe(sourcemaps.init())
        .pipe(
            babel({
                presets: [
                    ['env',
                        {
                            'targets': {
                                'browsers': ['last 2 versions', 'safari >= 7']
                            },
                        }]
                ],
            })
        )
        // .pipe(concat('all.js'))
        .pipe(sourcemaps.write('.'))
        .pipe(uglify())
        .pipe(gulp.dest('dist/js'));
}

function vendor() {
    return gulp
        .src(['vendor/**/*.js'])
        .pipe(plumber())
        .pipe(concat('vendor.js'))
        .pipe(gulp.dest('dist/vendor'));
}

function copyFromRoot() {
    return gulp
        .src(['sw.js', 'manifest.webmanifest', 'favicon.ico'])
        .pipe(plumber())
        .pipe(gulp.dest('dist'));
}

function cleanDist() {
    return gulp
        .src('dist', { read: false })
        .pipe(clean());
}

function copyIdb() {
    return gulp
        .src('js/idb.js')
        .pipe(plumber())
        .pipe(
            babel({
                presets: [
                    ['env',
                        {
                            'targets': {
                                'browsers': ['last 2 versions', 'safari >= 7']
                            },
                        }]
                ]
            })
        )
        .pipe(uglify())
        .pipe(gulp.dest('dist/js'));
}

function uglifyErrorDebugging(cb) {
    pump([
        gulp.src('vendor/idb.js'),
        uglify(),
        gulp.dest('./dist/')
    ], cb);
}
