var gulp = require('gulp');
var mocha = require('gulp-mocha');
var nodemon = require('gulp-nodemon');

function handleError(err) {
	// console.log(err.toString());
	if(!process.env.NODE_TEST)
		this.emit('end');
}

gulp.task('init', function() {
	// process.env['NODE_ENV'] = 'development';
	// nodemon({ script: 'wheat.js', ext: 'js', ignore: ['test/**'] });
});

gulp.task('test', function() {
	process.env['NODE_ENV'] = 'test';
	gulp.src('test/**/*.js', { read: false })
		.pipe(mocha({ reporter: 'spec' }))
		.on('error', handleError);
});

gulp.task('runtest', function() {

});

gulp.task('watch', function() {
	// console.log(arguments)
	gulp.watch(['./**/*.js', './test/*.js', '!./node-modules/**'], { interval: 500 }, ['test']);
});


gulp.task('default', ['init', 'watch']);
