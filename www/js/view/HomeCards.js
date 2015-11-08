var SummaryContainer = require("../model/SummaryContainer.js").SummaryContainer;
var Utilities = require("../helper/Utilities.js").Utilities;

module.exports.HomeCards = (function(utilities) {
    return function() {

        var docLocation = document.querySelector("#home .page-content");

        var defaultDataSource = function(callback) {
            window.carat.getBugs(function(bugs) {
                window.carat.getHogs(function(hogs) {
                    callback({
                        bugs: bugs,
                        hogs: hogs
                    });
                });
            });
        };

        var linkifySummaryEntry = function(originId, targetId, type) {

            var tab;

            if(type === "BUG") {
                tab = "bugs-tab";
            } else if(type === "HOG") {
                tab = "hogs-tab";
            } else {
                return;
            }

            var element = document.getElementById(originId);


            element.addEventListener("click", function() {
                document.getElementById(tab).click();
                window.location.hash = targetId;
            });
        };

        var dataSource = defaultDataSource;

        var renderAsyncSource = function(sourceCallback) {

            return function(onResultCallback, onModelCallback) {
                sourceCallback(function(data) {

                    var model = new SummaryContainer(data.bugs,
                                                     data.hogs);
                    var rendered = model.render();

                    if(onResultCallback) {
                        onResultCallback(rendered);
                    }

                    if(onModelCallback) {
                        onModelCallback(model);
                    }
                });
            };
        };

        var renderAsync = (function(source) {
            return renderAsyncSource(source);
        })(dataSource);

        var setDataSource = function(freshDataSource) {
            dataSource = freshDataSource;
            renderAsync = renderAsyncSource(freshDataSource);
        };


        var renderInsert = function() {
            renderAsync(function(renderedTemplate) {
                var node = utilities.makeDomNode(renderedTemplate);
                docLocation.appendChild(node);
                showOrHideActions();
            }, function(model) {

                var bugs = model.getBugs();
                var hogs = model.getHogs();

                var linkifyEntries = function(entries) {
                    for(var key in entries) {
                        var entry = entries[key];

                        linkifySummaryEntry(entry.getId(),
                                            entry.getTargetId(),
                                            entry.getType());
                    }
                };

                linkifyEntries(bugs);
                linkifyEntries(hogs);

            });
        };

        return {
            setDataSource: setDataSource,
            renderInsert: renderInsert
        };
    };

})(Utilities);
