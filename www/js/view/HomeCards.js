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

        var dataSource = defaultDataSource;

        var renderAsyncSource = function(sourceCallback) {

            return function(onResultCallback) {
                sourceCallback(function(data) {

                    var model = new SummaryContainer(data.bugs,
                                                     data.hogs);
                    var rendered = model.render();

                    if(onResultCallback) {
                        onResultCallback(rendered);
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
                var node = renderedTemplate;
                docLocation.appendChild(node);
                showOrHideActions();
            });
        };

        return {
            setDataSource: setDataSource,
            renderInsert: renderInsert
        };
    };

})(Utilities);
