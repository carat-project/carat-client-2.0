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

model = {
    notifications: {}
};

var app = {
    // Construct controller
    initialize: function() {
        console.log("Initializing");
        this.bindEvents();
    },


    // Bind functions to their corresponding events
    bindEvents: function() {
        console.log("Binding deviceready");
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },


    // These functions get called when device is ready
    onDeviceReady: function() {
        console.log("Device is ready");
        app.receivedEvent('deviceready');
        var updateData = function(){
            console.log("Plugin finished fetching data, updating UI..");


            //These return JSON-type data
            carat.getJscore(displayJscore);
            carat.getHogs(displayHogs);
            carat.getBugs(displayBugs);
        }

        //Display callsbacks get called once whenReady fires
        var displayJscore = function(jscore){
            document.getElementById("jscore").innerHTML = "<h3>"+jscore+"</h3>";
        }

        var displayHogs = function(hogs){
            console.log(hogs);
            document.getElementById("hogdebug").innerHTML = JSON.stringify(hogs);
        }

        var displayBugs = function(bugs){
            document.getElementById("bugdebug").innerHTML = JSON.stringify(bugs);
        }

        //Temporary solution for waiting plugin to finish
        carat.whenReady(updateData);
    },

    // Update DOM on a Received Event
    receivedEvent: function(id) {
        console.log('Received Event: ' + id);
    }
};
