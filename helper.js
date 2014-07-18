(function() {
	var helper = {};

	helper.socketData = function(type, data)
	{
		return JSON.stringify({
			type: type,
			data: data || {}
		});
	}

	module.exports = helper;
})();