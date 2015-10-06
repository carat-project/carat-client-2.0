var exec = require("cordova/exec"),
    service = "CaratPlugin";

module.exports = {
    initialize: function(){
        // Replace this
        var callback = function(d) {
            return;
        }
        exec(callback, callback, service, "init", [""]);
    },
	getJscore: function(callback) {
        exec(callback, callback, service, "jscore", [""]);
	},
    getMainReports: function(callback){
        exec(callback, callback, service, "main", [""]);
    },
	getHogs: function(callback){
        exec(callback, callback, service, "hogs", [""]);
	},
	getBugs: function(callback){
        exec(callback, callback, service, "bugs", [""]);
	},
    killApp: function(packageName, callback){
        exec(callback, callback, service, "kill", [packageName]);
    }
};