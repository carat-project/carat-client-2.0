var exec = require("cordova/exec"),
    service = "CaratPlugin";

var generic = function(d) {
	return;
};

module.exports = {
    setup: function(callback){
        exec(callback, callback, service, "setup", [""]);
    },
    clear: function(callback){
    	exec(callback, callback, service, "clear", [""]);
    },
    getUuid: function(callback){
    	exec(callback, callback, service,"uuid", ["get"]);
    },
    setUuid: function(uuid, callback){
    	exec(callback, callback, service, "uuid", [uuid]);
    },
    refreshData: function(){
    	exec(generic, generic, service, "refresh", [""]);
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
    getMemoryInfo: function(callback){
    	exec(callback, callback, service, "memory", [""]);
    },
    killApp: function(packageName, callback){
        exec(callback, callback, service, "kill", [packageName]);
    },
    uninstallApp: function(packageName, callback){
        exec(callback, callback, service, "uninstall", [packageName]);
    }
};
