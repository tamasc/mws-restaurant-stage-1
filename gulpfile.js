// Import config
const config = require('./config.js');

// Gulp imports
const gulp = require('gulp');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const clean = require('gulp-clean');
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');
const replace = require('gulp-replace');

// Browser sync import
const browserSync = require('browser-sync').create();

// Gulp tasks
gulp.task(
    'default',
    ['copy-html', 'copy-images', 'scripts', 'service-worker', 'styles', 'idb'],
    defaultTask
);
gulp.task(
    'dist',
    ['copy-html', 'copy-images', 'scripts-dist', 'service-worker', 'styles', 'idb'],
    defaultTask
);
gulp.task('styles', sassConverter);
gulp.task('copy-html', copyHtml);
gulp.task('copy-images', copyImages);
gulp.task('service-worker', serviceWorker);
gulp.task('scripts', scripts);
gulp.task('scripts-dist', scriptsDist);
gulp.task('clean', cleanDist);
gulp.task('idb', copyIdb);

// Functions for tasks
function defaultTask() {
    browserSync.init({
        server: './dist',
        port: 8001
    });
    browserSync.stream();
    gulp.watch('sass/**/*.scss', ['styles']);
    gulp.watch(['*.html'], ['copy-html']);
    gulp.watch(['sw.js'], ['service-worker']);
    gulp.watch(['js/**/*.js'], ['scripts']);
}

function copyHtml() {
    return gulp.src('*.html')
        .pipe(replace('@@GOOGLE_MAPS_API_KEY', config.GOOGLE_MAPS_API_KEY))
        .pipe(gulp.dest('dist'));
}

function copyImages() {
    return gulp.src('img/*').pipe(gulp.dest('dist/img'));
}

function sassConverter() {
    return gulp
        .src('./sass/**/*.scss')
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
        .src(['js/**/*.js', '!js/idb.js'])
        .pipe(sourcemaps.init())
        .pipe(
            babel({
                presets: [
                    ['env',
                        {
                            'targets': {
                                'browsers': ['last 2 versions', 'safari >= 7']
                            },
                        }
                    ]
                ],
                // plugins: [
                //     ['transform-es2015-modules-commonjs', {
                //         'allowTopLevelThis': true
                //     }]
                // ]
            })
        )
        // .pipe(concat('all.js'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist/js'));
}

function scriptsDist() {
    return gulp
        .src('js/**/*.js')
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
                // plugins: [
                //     ['transform-es2015-modules-commonjs', {
                //         'allowTopLevelThis': true
                //     }]
                // ]
            })
        )
        // .pipe(concat('all.js'))
        .pipe(sourcemaps.write('.'))
        .pipe(uglify())
        .pipe(gulp.dest('dist/js'));
}

function serviceWorker() {
    return gulp.src('sw.js').pipe(gulp.dest('dist'));
}

function cleanDist() {
    return gulp.src('dist', { read: false }).pipe(clean());
}

function copyIdb() {
    return gulp.src('js/idb.js')
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
