var backPressed = false;

var app = {
    // This sets up our app
    initialize: function() {
        console.log("Initializing application");
        this.bindEvents();
    },

    bindEvents: function() {
        console.log("Binding events");
        document.addEventListener("deviceready", this.onDeviceReady, false);

        // Listener for changing uuid
        var uuidButton = document.getElementById("changeUuid");
        uuidButton.addEventListener("click", this.onUuidChange, false);

        // Listener for menu
        initializeListeners();
    },

    // Clear and refresh storage data
    getData: function(uuid){
        // This fires the dataready event
        console.log("Getting fresh data for uuid " +uuid);
        carat.clear(function(){
            var state = document.getElementById("state");
            carat.refreshData(function(status){
                app.pluginStatus(status, state);
            });
            //app.showProgress();
        });
    },

    getUuid: function(status) {
        console.log("Checking uuid status");
        carat.getUuid(function(uuid){
            // If uuid is empty
            if(!uuid){
                // Prompt the user for it
                uuid = prompt("Enter your uuid:");
                if(uuid == null) uuid="";
                carat.setUuid(uuid, app.getData);
            } else {
                // Refresh existing data if needed
                console.log("Getting data for existing uuid "+uuid);
                carat.refreshData(function(status){
                    var state = document.getElementById("state");
                    app.pluginStatus(status, state);
                });
                //app.showProgress();
            }
        });
    },

    // When device is ready we start up the plugin
    onDeviceReady: function() {
        app.receivedEvent("deviceready");

        // Specify back button behavior
        document.addEventListener("backbutton", function(e){
            if(window.location.hash.indexOf("dialog") > -1){
                window.location.hash = "";
                app.closeDialog();
            } else if(window.location.href.indexOf("index.html") > -1){
                if(window.history.state === "#home") {
                    var hometab = document.getElementById("home-tab");
                    hometab.click();
                    window.history.pushState(null, "", "#home");
                } else if(backPressed){
                    navigator.app.exitApp();
                } else {
                    carat.showToast("Press back again to exit");
                    backPressed = true;
                    setTimeout(function(){
                        backPressed = false;
                    }, 4000);
                }
            } else {
                navigator.app.backHistory();
            }
        }, false);

        // Attempt at making taps faster
        FastClick.attach(document.body);

        // Start setting up plugin
        console.log("Initializing plugin");
        app.showProgress();
        carat.setup(app.getUuid);
    },

    onUuidChange: function(){
        var newUuid = prompt("Enter new uuid:");

        // Use a new uuid if provided
        if(newUuid == null || !newUuid) return;
        console.log("Changing uuid to " + newUuid);
        carat.setUuid(newUuid, app.getData);
    },

    // Load objects asynchronously with callbacks
    onDataReady: function(){
        console.log("Requesting data from plugin");
        var masterView = new MasterView();
        masterView.render();

        // Start of the callback chain
        var displayData = function(){
            carat.getHogs(displayHogs);
        };

        // Create cards for hogs and append to system tab
        var displayHogs = function(hogs){
            console.log("Received Data: hogs");
            // Pass hogs to controller

            carat.getBugs(function(bugs) {
                return displayBugsAndSummary(bugs, hogs);
            });
        };

        // Create cards for bugs and append to system tab
        // NOTE: temporary solution for generating summary card
        var displayBugsAndSummary = function(bugs, hogs){
            console.log("Received Data: bugs");

            // Pass bugs to controller
            itemCards.generateSummary(hogs, bugs);
            itemCards.generateCards(bugs, hogs, carat.killApp, carat.uninstallApp);

            carat.getMainReports(displayMain);
        };

        // Handle main reports
        var displayMain = function(main){

            // Get memory info and generate statistics
            var getMemoryInfo = function(uuid){
                    carat.getMemoryInfo(function(meminfo){

                        // Convert from kiB to MiB
                        var usedMemory = Math.round((meminfo.total - meminfo.available) / 1000);
                        var totalMemory = Math.round(meminfo.total / 1000);
                        var percentage = Math.floor((usedMemory/totalMemory)*100);
                        var duration = main;

                        var deviceInfo = {
                            batteryLife: main.batteryLife,
                            modelName: device.model,
                            osVersion: device.platform + " " + device.version,
                            caratId: uuid,
                            memoryUsed: percentage + "%",
                            memoryTotal: totalMemory + " MiB"
                        };

                        itemCards.generateSummaryStatistics(main, deviceInfo);


                        // Remove progress indicator
                        document.getElementById("progress").innerHTML = "";

                        console.log("Finished rendering");
                        cordova.fireDocumentEvent("renderfinished");
                    });
            };

            // Get uuid for deviceInfo
            carat.getUuid(function(uuid){
                    if(uuid == null || !uuid) {
                        uuid = "Default";
                    }
                    getMemoryInfo(uuid);
            });
            // ...
        };

        // Begin the callback chain
        displayData();
    },

    showProgress: function(){
        var indicator = document.createElement("img");
        indicator.src = "img/progress.gif";
        indicator.alt = "Loading..";
        indicator.width = "15";
        indicator.height = "15";
        document.getElementById("progress").appendChild(indicator);
    },

    // Display plugin status temporarily in header
    pluginStatus: function(status, state){
        if(status == "READY"){
            app.onDataReady();
            state.innerHTML = "";
        } else {
            console.log("Plugin: " + status);
            state.innerHTML = status + "..";
        }
    },

    // Update DOM on a Received Event
    receivedEvent: function(id) {
        console.log('Received Event: ' + id);
    }
};
