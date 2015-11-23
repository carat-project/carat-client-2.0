import ejs from "ejs";
import DeviceStats from "../model/DeviceStats.js";
import {Utilities} from "../helper/Utilities.js";

class StatsCards {

    constructor(){
        this.docLocation = document.querySelector("#system .page-content");
        this.dataSource = this.defaultDataSource;

        let _this = this;
        this.renderAsync = (function(source) {
            return _this.renderAsyncSource(source);
        }) (this.dataSource);
    }

    defaultDataSource(callback) {

        carat.getMainReports(function(main) {
            carat.getMemoryInfo(function(memInfo) {
                carat.getUuid(function(uuid) {
                    callback({
                        modelName: window.device.model,
                        osVersion: window.device.version,
                        jScore: main.jscore,
                        uuid: uuid,
                        usedMemory: memInfo.total - memInfo.available,
                        totalMemory: memInfo.total,
                        percentage: memInfo.available / memInfo.total,
                        batteryLife: main.batteryLife
                    });
                });
            });
        });
    };

    renderAsyncSource(sourceCallback) {
        var _this = this;
        return function(onResultCallback) {
            sourceCallback(function(data) {
                var myDeviceModel = new DeviceStats(data);
                var rendered = myDeviceModel.render();
                onResultCallback(rendered);
            });
        };
    };

    /**
     * @function
     * @instance
     * @param {} freshDataSource A callback which is used for
     acquiring data from the server.
     * @memberOf StatsCards
     */
    setDataSource(freshDataSource) {
        this.dataSource = freshDataSource;
        this.renderAsync = this.renderAsyncSource(freshDataSource);
    };

    /**
     * @function
     * @instance
     * @memberOf StatsCards
     * @summary Insert these cards as a part of the document.
     */
    renderInsert() {
        let _this = this;
        this.renderAsync(function(renderedTemplate) {
            var node = renderedTemplate;
            _this.docLocation.appendChild(node);
        });
    };
}

export default StatsCards;