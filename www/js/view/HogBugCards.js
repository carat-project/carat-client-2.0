var HogBug = require("../model/HogBug.js").HogBug;
var Utilities = require("../helper/Utilities.js").Utilities;

module.exports.HogBugCards = (function(template, utilities, buttonActions) {

    return function(dataOrigin, outputElemId, gestureCallback) {

        var dataSource = dataOrigin;


        var docLocation = document.getElementById(outputElemId);

        var cardLocIdMaker = function(locName) {
            return utilities.makeIdFromOtherId(outputElemId,
                                               locName);
        };

        var cardLocIds = {
            runningId: cardLocIdMaker("running"),
            inactiveId: cardLocIdMaker("inactive"),
            systemId: cardLocIdMaker("system")
        };

        var renderTemplate = function(hogBugsArray) {

            var rendered = utilities
                    .makeDomNode(template.render(cardLocIds));

            var runningLoc = utilities
                    .findById(rendered, cardLocIds.runningId);
            var inactiveLoc = utilities
                    .findById(rendered, cardLocIds.inactiveId);
            var systemLoc = utilities
                    .findById(rendered, cardLocIds.systemId);

            utilities.appendChildAll(runningLoc,
                                     hogBugsArray.running);
            utilities.appendChildAll(inactiveLoc,
                                     hogBugsArray.inactive);
            utilities.appendChildAll(systemLoc,
                                     hogBugsArray.system);

            return rendered;
        };

        var makeModels = function(rawData) {

            var result = {
                running: [],
                inactive: [],
                system: []
            };

            for(var key in rawData) {
                var model = new HogBug(rawData[key], gestureCallback);

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
            return function(onResultCallback) {
                sourceCallback(function(data) {
                    var models = makeModels(data);
                    var result = renderTemplate(renderModels(models));

                    if(onResultCallback) {
                        onResultCallback(result);
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

                docLocation.appendChild(renderedTemplate);

            });
        };


        return {
            renderInsert: renderInsert,
            setDataSource: setDataSource
        };
    };
})(new EJS({url: 'js/template/hogBugListing.ejs'}),
   Utilities,
   {close: window.carat.killApp,
    uninstall: window.carat.uninstallApp});
