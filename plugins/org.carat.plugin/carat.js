module.exports = {
	getJscore: function(callback) {
		var exec = require("cordova/exec");
        exec(callback,
        	callback,
        	"CaratPlugin",
        	"jscore",
        	[""]
        );
	}
};