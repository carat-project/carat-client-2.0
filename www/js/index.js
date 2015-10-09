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
    // Construct controller
    initialize: function() {
        console.log("Initializing application");
        this.bindEvents();
    },

    // Bind functions to their corresponding events
    bindEvents: function() {
        console.log("Binding events");
        document.addEventListener('deviceready', this.onDeviceReady, false);
        document.addEventListener('dataready', this.onDataReady, false);
    },


    // These functions get called when device is ready
    onDeviceReady: function() {
        app.receivedEvent('deviceready');

        // Start waiting for data after cordova has fully loaded
        console.log("Initializing plugin");
        carat.initialize();
    },

    // Attempt at event driven async loading with a callback chain
    onDataReady: function(){
        app.receivedEvent('dataready');
        console.log("Requesting data from plugin");

        // Start of the callback chain
        var displayData = function(){
            carat.getJscore(displayJscore);
        };

        // Display jscore in a premade card in home tab
        var displayJscore = function(jscore){
            console.log("Received Data: jscore");
            document.getElementById("jscore").innerHTML = "<h3>Your J-Score: "+jscore+"</h3>";

            carat.getHogs(displayHogs);
        };

        // Create cards for hogs and append to system tab
        var displayHogs = function(hogs){
            console.log("Received Data: hogs");
            //pass hogs to controller
            itemCards.generateHogs(hogs, carat.killApp, carat.uninstallApp);

            carat.getBugs(function(bugs) {
                return displayBugsAndSummary(bugs, hogs);
            });
        };

        // Create cards for bugs and append to system tab
        //NOTE: temporary solution for generating summary card
        var displayBugsAndSummary = function(bugs, hogs){
            console.log("Received Data: bugs");

            // Application information example, see console
            for(i in bugs){
                console.log(
                    bugs[i].label + "\n "
                    + "running: "      + bugs[i].running    + "\n "
                    + "killable: "     + bugs[i].killable   + "\n "
                    + "removable: "    + bugs[i].removable  + "\n"
                    );
            }

            //pass bugs to controller
            itemCards.generateBugs(bugs, carat.killApp, carat.uninstallApp);
            itemCards.generateSummary(hogs, bugs);

            carat.getMainReports(displayMain);
        };

        // Handle main reports
        var displayMain = function(main){
            console.log("Finished rendering");
            // ...
        };

        // Begin callback chain
        displayData();
    },

    // Update DOM on a Received Event
    receivedEvent: function(id) {
        console.log('Received Event: ' + id);
    },


    // This should eventually be moved to a separate file.
    // But for now, pretend we're react.
    constructCardHTML: function(hogBug){
        var cardHTML =
                '<div class="mdl-card mdl-shadow--2dp"> ' +
                '<div class="carat-card__title">' +
                '<div class="mdl-card__title-text">' + hogBug.name + '</div>'+
                '<div class="mdl-layout-spacer"></div>'+
                '<span class="carat-card-time">' + hogBug.benefit + '</span>'+
                '</div>'+
                '<div class="mdl-card__supporting-text">'+
                'Type: ' + hogBug.type +
                '<div class="collapse"></div>'+
                '</div>'+
                '<div class="mdl-card__actions">'+
                '<a class="mdl-card__more" '+
                'role="button" '+
                'data-toggle="collapse" '+
                'aria-expanded="false" '+
                'aria-controls="collapseExample">More</a>'+
                '</div>'+
                '</div>';

        var card = document.createElement('div');
        card.innerHTML = cardHTML;
        return card;
    }
};
