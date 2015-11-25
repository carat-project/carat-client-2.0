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
    refreshData: function(callback){
        exec(callback, callback, service, "refresh", [""]);
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
    getSettings: function(callback){
        exec(callback, callback, service, "settings", [""]);
    },
    getMemoryInfo: function(callback){
        exec(callback, callback, service, "memory", [""]);
    },
    startCpuPolling: function(callback, interval){
        exec(callback, callback, service, "cpupoll", [interval]);
    },
    startMemoryPolling: function(callback, interval){
        exec(callback, callback, service, "mempoll", [interval]);
    },
    killApp: function(packageName, callback){
        exec(callback, callback, service, "kill", [packageName]);
    },
    uninstallApp: function(packageName, callback){
        exec(callback, callback, service, "uninstall", [packageName]);
    },
    showToast: function(message, callback){
        exec(callback, callback, service, "toast", [message]);
    },
    showNotification: function(title, message, callback){
        exec(callback, callback, service, "notify", [title, message]);
    },
    changeStatusbarColor: function(color, callback) {
        exec(callback, callback, service, "color", [color]);
    }
};
