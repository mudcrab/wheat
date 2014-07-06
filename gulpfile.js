var gulp = require('gulp');
var mocha = require('gulp-mocha');
var nodemon = require('gulp-nodemon');

function handleError(err) {
	console.log(err.toString());
	this.emit('end');
}

gulp.task('test', function() {
	gulp.src('test/test.js', { read: false })
		.pipe(mocha({ reporter: 'spec' }))
		.on('error', handleError);
});

gulp.task('runtest', function() {
	
});

gulp.task('watch', function() {
  
	nodemon({ script: 'server.js', ext: 'js', ignore: ['./test/**'] });
	gulp.watch(['./test/*.js'], ['test']);
	gulp.watch(['./**/*.js', 'server.js'], ['test']);

});


gulp.task('default', ['watch']);
