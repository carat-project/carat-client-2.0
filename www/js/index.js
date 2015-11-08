/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

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
        document.addEventListener("dataready", this.onDataReady, false);
        document.addEventListener("renderfinished", this.refreshCpuUsage, false);

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
            carat.refreshData();
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
                carat.refreshData();
                //app.showProgress();
            }
        });
    },

    getCpuUsage: function(progressText, progressLoad){
        carat.getCpuUsage(function(usage){
            usage = usage + "%";
            progressText.innerHTML = usage;
            progressLoad.style.width = usage;
        });
    },

    // When device is ready we start up the plugin
    onDeviceReady: function() {
        app.receivedEvent('deviceready');

        // Specify back button behavior
        document.addEventListener("backbutton", function(e){
            if(window.location.href.indexOf("index.html")){
                if(backPressed){
                    navigator.app.exitApp();
                } else {
                    carat.showToast("Press back again to exit");
                    backPressed = true;
                    setTimeout(function(){
                        backPressed = false
                    }, 4000);
                }
            }
            navigator.app.backHistory();
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
        app.receivedEvent('dataready');
        console.log("Requesting data from plugin");

        // Start of the callback chain
        var displayData = function(){
            carat.getHogs(displayHogs);
        };

        // Create cards for hogs and append to system tab
        var displayHogs = function(hogs){
            console.log("Received Data: hogs");
            // Pass hogs to controller
            itemCards.generateHogs(hogs, carat.killApp, carat.uninstallApp);

            carat.getBugs(function(bugs) {
                return displayBugsAndSummary(bugs, hogs);
            });
        };

        // Create cards for bugs and append to system tab
        // NOTE: temporary solution for generating summary card
        var displayBugsAndSummary = function(bugs, hogs){
            console.log("Received Data: bugs");

            // Pass bugs to controller
            itemCards.generateBugs(bugs, carat.killApp, carat.uninstallApp);
            itemCards.generateSummary(hogs, bugs);
            itemCards.generateCards(bugs, hogs);

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
                        var duration = main

                        var deviceInfo = {
                            batteryLife: main.batteryLife,
                            modelName: device.model,
                            osVersion: device.platform + " " + device.version,
                            caratId: uuid,
                            memoryUsed: percentage + "%",
                            memoryTotal: totalMemory + " MiB"
                        };

                        itemCards.generateStatistics(main, deviceInfo);

                        // Remove progress indicator
                        document.getElementById("progress").innerHTML = "";
                        console.log("Finished rendering");
                        cordova.fireDocumentEvent("renderfinished");
                    });
            }

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

        // Display setting suggestions for debugging
        carat.getSettings(function(settings){
            if((typeof settings !== "undefined") && (settings !== null) && (settings.length > 0)){
                var suggestion = settings[0];
                var benefit = suggestion.benefit
                var length =  benefit.indexOf("±");
                var benefit = benefit.substr(0, length-1);

                carat.showNotification("Change to "+suggestion.changeTo, "Benefit: "+benefit, function(success){
                    console.log("Showing placeholder notification for a system setting");
                });
            }
            //console.log(JSON.stringify(settings));
        });
    },

    // Set an interval for refreshing cpu usage
    refreshCpuUsage: function() {

        var progressText = document.querySelector("#cpuProgressBar > span");
        var progressLoad = document.querySelector("#cpuProgressBar > div");

        app.getCpuUsage(progressText, progressLoad);
        setInterval(function(){
            app.getCpuUsage(progressText, progressLoad);
        }, 2000);
    },

    showProgress: function(){
        var indicator = document.createElement("img");
        indicator.src = "img/progress.gif";
        indicator.alt = "Loading..";
        indicator.width = "17";
        indicator.height = "17";
        document.getElementById("progress").appendChild(indicator);
    },

    // Update DOM on a Received Event
    receivedEvent: function(id) {
        console.log('Received Event: ' + id);
    }
};
