var gulp        = require('gulp'),
    semver      = require('semver'),
    shell       = require('gulp-shell'),
    watch       = require('gulp-watch'),
    bump        = require('gulp-bump'),
    pkg         = require('./package.json');

gulp.task('deploy-master', function(){
  var newVer = semver.inc(pkg.version, 'patch');
  return gulp.src(['./package.json'])
    .pipe(bump({version: newVer}))
    .pipe(gulp.dest('./'))
    .on('end', shell.task([
            'git add --all',
            'git commit -m "' + newVer + '"', 
            'git tag -a "' + newVer + '" -m "' + newVer + '"',
            'git push origin master', 
            'git push origin --tags'
           ]));

});

gulp.task('link', function(cb) {
  watch(['lib/**/*'], shell.task(['jspm link github:gundy/jssynth@dev -y']));
});

gulp.task('bundle-watch', function(cb) {
    watch(['lib/**/*'], shell.task(['jspm bundle lib/jssynth.js dist/jssynth.js', 'jspm bundle lib/jssynth.js dist/jssynth.min.js --minify']));
});

gulp.task('bundle-now', shell.task(['jspm bundle lib/jssynth.js dist/jssynth.js', 'jspm bundle lib/jssynth.js dist/jssynth.min.js --minify']));