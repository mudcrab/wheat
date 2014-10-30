var fs = require('fs');
var Moment = require('moment-timezone');
var util = require('util');

(function() {
	var Log = function(path, options)
	{
		this.path = path;
		this.options = options || {
			echo: false,
			timestamp: false
		};
	};

	Log.prototype.log = function()
	{
		var args = Array.prototype.slice.call(arguments, 0);
		writeLog.call(this, 'LOG', args);
	};

	Log.prototype.info = function()
	{
		var args = Array.prototype.slice.call(arguments, 0);
		writeLog.call(this, 'INFO', args);
	};

	Log.prototype.warn = function()
	{
		var args = Array.prototype.slice.call(arguments, 0);
		writeLog.call(this, 'WARNING', args);
	};

	Log.prototype.error = function()
	{
		var args = Array.prototype.slice.call(arguments, 0);
		writeLog.call(this, 'ERROR', args);
	};

	function writeLog(prefix, data)
	{
		var tmp = [];
		var timestamp = '';

		if(this.options.timestamp)
			timestamp = Moment.tz("Europe/Tallinn").format("YYYY-MM-DD HH:MM:SS") + ' ';
		
		if(data.join('').match('%s') || data.join('').match('%d'))
		{
			var tmp = util.format.apply(this, data);
		}
		else
		{
			data.forEach(function(val) {
				if(typeof val == 'object')
					tmp.push(JSON.stringify(val));
				else
					tmp.push(val);
			});
		}

		tmp = (typeof tmp == 'object' ? tmp.join(' ') : tmp);
		var logStr = '[' + prefix + '] ' + timestamp + (tmp || ' - ');

		fs.appendFile(this.path, logStr + '\n', function(err) {
			if (err) throw err;
		});

		if(this.options.echo)
		{
			console.log(logStr);
		}
	};

	module.exports = Log;

})();