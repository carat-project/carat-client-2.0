module.exports = {
	echo: function(name, success, error) {
		var exec = require("cordova/exec");
        exec(success,
        	error,
        	"CaratPlugin",
        	"echo",
        	[name]
        );
	}
};