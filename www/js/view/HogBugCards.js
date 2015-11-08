var HogBug = require("../model/HogBug.js").HogBug;
var Utilities = require("../helper/Utilities.js").Utilities;

module.exports.HogBugCards = (function(template, utilities, buttonActions) {

    return function(dataOrigin, outputElemId, gestureCallback) {

        var dataSource = dataOrigin;


        var docLocation = document.getElementById(outputElemId);

        var renderTemplate = function(hogBugsArray) {

            return template.render(hogBugsArray);
        };

        var makeModels = function(rawData) {

            var result = {
                running: [],
                inactive: [],
                system: []
            };

            for(var key in rawData) {
                var model = new HogBug(rawData[key]);

                if(model.getRunning()) {
                    result.running.push(model);
                } else if(!model.getUninstallable()) {
                    result.system.push(model);
                } else {
                    result.inactive.push(model);
                }

            }

            return result;
        };

        var renderModels = function(categories) {
            console.log(categories);

            var morphToHTML = function(model) {
                return model.render();
            };

            return {
                running: categories.running.map(morphToHTML),
                inactive: categories.inactive.map(morphToHTML),
                system: categories.system.map(morphToHTML)
            };
        };

        var renderAsyncSource = function(sourceCallback) {
            return function(onResultCallback, onModelsCallback) {
                sourceCallback(function(data) {
                    var models = makeModels(data);
                    var result = renderTemplate(renderModels(models));

                    if(onResultCallback) {
                        onResultCallback(result);
                    }

                    if(onModelsCallback) {
                        onModelsCallback(models);
                    }
                });
            };
        };

        var renderAsync = renderAsyncSource(dataSource);

        var setDataSource = function(freshDataSource) {
            dataSource = freshDataSource;
            renderAsync = renderAsyncSource(freshDataSource);
        };

        var renderInsert = function() {
            renderAsync(function(renderedTemplate) {

                var node = utilities.makeDomNode(renderedTemplate);
                docLocation.appendChild(node);

            }, function(models) {

                var applyActions = function(model) {
                    var nodeId = model.getId();
                    var closeButtonId = model.getCloseId();
                    var uninstallButtonId = model.getUninstallId();

                    var actualNode = document.getElementById(nodeId);
                    var closeButton = document.getElementById(closeButtonId);
                    var uninstallButton = document.getElementById(
                        uninstallButtonId);

                    closeButton.addEventListener("click", function() {
                        buttonActions.close(
                            model.getPackageName(),
                            function(state) {
                                console.log("Killing app: " + state);
                            });
                    });

                    uninstallButton.addEventListener("click", function() {
                        buttonActions.uninstall(
                            model.getPackageName(),
                            function(state) {
                                console.log("Uninstalling app: " + state);
                            });
                    });

                    if(window.localStorage.getItem(nodeId)
                       === 'dismissed') {
                        actualNode.style.display = 'none';
                    } else {
                        gestureCallback(actualNode);
                    }

                };

                for(var keyRunning in models.running) {
                    applyActions(models.running[keyRunning]);
                }

                for(var keyInactive in models.inactive) {
                    applyActions(models.inactive[keyInactive]);
                }

                for(var keySystem in models.system) {
                    applyActions(models.system[keySystem]);
                }
            });
        };

        console.log(window.carat.killApp);

        return {
            renderInsert: renderInsert,
            setDataSource: setDataSource
        };
    };
})(new EJS({url: 'js/template/hogBugListing.ejs'}),
   Utilities,
   {close: window.carat.killApp,
    uninstall: window.carat.uninstallApp});
