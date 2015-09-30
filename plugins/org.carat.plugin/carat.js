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
        getMainReports: function(callback){
                var exec = require("cordova/exec");
                exec(callback,
                       callback,
                       "CaratPlugin",
                       "main",
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