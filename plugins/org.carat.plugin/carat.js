module.exports = {
	getJscore: function(callback) {
		var exec = require("cordova/exec");
        exec(callback,
        	callback,
        	"CaratPlugin",
        	"jscore",
        	[""]
        );
	},
	getHogs: function(callback){
		var exec = require("cordova/exec");
        exec(callback,
        	callback,
        	"CaratPlugin",
        	"hogs",
        	[""]
        );
	},
	getBugs: function(callback){
		var exec = require("cordova/exec");
        exec(callback,
        	callback,
        	"CaratPlugin",
        	"bugs",
        	[""]
        );
	},
	whenReady: function(callback){
		var exec = require("cordova/exec");
        exec(callback,
        	callback,
        	"CaratPlugin",
        	"ready",
        	[""]
        );
	}
};