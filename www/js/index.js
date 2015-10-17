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

        // Listener for changing uuid
        var uuidButton = document.getElementById("changeUuid");
        uuidButton.addEventListener("click", this.onUuidChange, false);
    },

    // Clear and refresh storage data
    getData: function(uuid){
        // This fires the dataready event
        console.log("Getting fresh data for uuid " +uuid);
        carat.clear(function(){
            carat.refreshData();
            app.showProgress();
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
                app.showProgress();
            }
        });
    },

    // When device is ready we start up the plugin
    onDeviceReady: function() {
        app.receivedEvent('deviceready');

        // Set up storage
        console.log("Initializing plugin");
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

            carat.getMainReports(displayMain);
        };

        // Handle main reports
        var displayMain = function(main){

            var deviceInfo = {
                modelName: device.model,
                osVersion: device.platform + " " + device.version,
                caratId: device.uuid
            };

            itemCards.generateStatistics(main, deviceInfo);
            document.getElementById("progress").innerHTML = "";

            console.log("Finished rendering");
            console.log(device);
            // ...
        };

        // Begin callback chain
        displayData();
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
