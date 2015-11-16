var DeviceStats = require("../model/DeviceStats.js").DeviceStats;
var Utilities = require("../helper/Utilities.js").Utilities;

module.exports.StatsCards = (function(gestureCallback, utilities) {
    /**
     * @class StatsCards
     */
    return function() {

        var docLocation = document.querySelector("#system .page-content");

        var defaultDataSource = function(callback) {

            window.carat.getMainReports(function(main) {
                window.carat.getMemoryInfo(function(memInfo) {
                    window.carat.getUuid(function(uuid) {
                        callback({
                            modelName: window.device.model,
                            osVersion: window.device.version,
                            jScore: main.jscore,
                            uuid: uuid,
                            usedMemory: memInfo.total
                                - memInfo.available,
                            totalMemory: memInfo.total,
                            percentage: memInfo.available
                                / memInfo.total
                        });
                    });
                });
            });
        };

        var dataSource = defaultDataSource;

        var renderAsyncSource = function(sourceCallback) {

            return function(onResultCallback) {
                sourceCallback(function(data) {
                    var myDeviceModel = new DeviceStats(data);
                    var rendered = myDeviceModel.render();

                    onResultCallback(rendered);
                });
            };
        };

        var renderAsync = (function(source) {
            return renderAsyncSource(source);
        })(dataSource);

        /**
         * @function
         * @instance
         * @param {} freshDataSource A callback which is used for
         acquiring data from the server.
         * @memberOf StatsCards
         */
        var setDataSource = function(freshDataSource) {
            dataSource = freshDataSource;
            renderAsync = renderAsyncSource(freshDataSource);
        };

        /**
         * @function
         * @instance
         * @memberOf StatsCards
         * @summary Insert these cards as a part of the document.
         */
        var renderInsert = function() {
            renderAsync(function(renderedTemplate) {
                var node = utilities.makeDomNode(renderedTemplate);
                docLocation.appendChild(node);

                gestureCallback(node);
            });
        };

        return {
            setDataSource: setDataSource,
            renderInsert: renderInsert
        };
    };
})(makeElemPanSwipable, Utilities);
