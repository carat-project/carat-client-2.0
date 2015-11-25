import HomeCards from "./HomeCards.js";
import HogBugCards from "./HogBugCards.js";
import StatsCards from "./StatsCards.js";
import Headerbar from "./Headerbar.js";
import MainContent from "./MainContent.js";
import InformationDialog from "../components/InformationDialog.js";

 /**
 * @class MasterView
 * @summary Class that wraps up all other views.
 */
class MasterView {

    constructor() {
        this.bugsRawData = [];
        this.hogsRawData = [];
        this.mainReportsRawData = [];
        this.deviceInfoRawData = [];
        this.memoryRawData = [];
        this.savedUuid = "";

        this.headerView = new Headerbar();
        this.mainView = new MainContent();
        this.homeView = new HomeCards();
        this.statsView = new StatsCards();
        this.bugsView = new HogBugCards(carat.getHogs, "bugs");
        this.hogsView = new HogBugCards(carat.getBugs, "hogs");

        // Make dialog globally accessible via app namespace
        var dialog = new InformationDialog();
        app.showDialog = dialog.show.bind(dialog);

        this.bugsFetcherAsync = this.bugsFetcherAsync.bind(this);
        this.hogsFetcherAsync = this.hogsFetcherAsync.bind(this);
        this.hogsAndBugsFetcherAsync = this.hogsAndBugsFetcherAsync.bind(this);
        this.myDeviceFetcherAsync = this.myDeviceFetcherAsync.bind(this);
        this.memoryStatsFetcherAsync = this.memoryStatsFetcherAsync.bind(this);

        this.bugsView.setDataSource(this.bugsFetcherAsync);
        this.hogsView.setDataSource(this.hogsFetcherAsync);
        this.homeView.setDataSource(this.hogsAndBugsFetcherAsync);
        this.statsView.setDataSource(this.myDeviceFetcherAsync);
    }

    savedInfoFetcherAsync(savedInfo, dataSource, callback) {
        if(!savedInfo || savedInfo.length === 0) {

            dataSource(function(data) {

                savedInfo = data;
                callback(data);
            });
        } else {
            callback(savedInfo);
        }
    };

    uuidFetcherAsync(callback) {

        var uuidGetter = function(action) {
            carat.getUuid(function(uuid) {
                if(!uuid) {
                    action("Default");
                }

                action(uuid);
            });
        };

        this.savedInfoFetcherAsync(this.savedUuid, uuidGetter, callback);
    };

    memoryStatsFetcherAsync(callback) {

        var getMemory = function(action) {
            carat.getMemoryInfo(function(memInfo) {
                var usedMemory = Math.round((memInfo.total- memInfo.available) / 1000);
                var totalMemory = Math.round(memInfo.total / 1000);
                var percentage = Math.floor((usedMemory / totalMemory)* 100);


                var result = {
                    usedMemory: usedMemory,
                    totalMemory: totalMemory,
                    percentage: percentage
                };

                action(result);
            });
        };

        this.savedInfoFetcherAsync(this.memoryRawData,
                              getMemory,
                              callback);
    };

    mainReportsFetcherAsync(callback) {

        this.savedInfoFetcherAsync(this.mainReportsRawData, carat.getMainReports, callback);
    };

    deviceInfoFetcherAsync(callback) {

        var getDeviceInfo = function(action) {
            var device = {
                modelName: window.device.model,
                osVersion: window.device.platform + " " + window.device.version
            };
            action(device);
        };

        this.savedInfoFetcherAsync(this.deviceInfoRawData, getDeviceInfo, callback);
    };

    myDeviceFetcherAsync(callback) {

        let _this = this;
        _this.deviceInfoFetcherAsync(function(deviceInfo) {
            _this.memoryStatsFetcherAsync(function(memInfo) {
                _this.mainReportsFetcherAsync(function(mainData) {
                    _this.uuidFetcherAsync(function(uuid) {
                        callback({
                            modelName: deviceInfo.modelName,
                            osVersion: deviceInfo.osVersion,
                            jScore: mainData.jscore,
                            uuid: uuid,
                            usedMemory: memInfo.usedMemory,
                            totalMemory: memInfo.totalMemory,
                            memoryPercentage: memInfo.percentage,
                            batteryLife: mainData.batteryLife
                        });
                    });
                });
            });
        });

    };

    bugsFetcherAsync(callback) {
        this.savedInfoFetcherAsync(this.bugsRawData, carat.getBugs, callback);
    };

    hogsFetcherAsync(callback) {

        this.savedInfoFetcherAsync(this.hogsRawData, carat.getHogs, callback);
    };

    hogsAndBugsFetcherAsync(callback) {

        let _this = this;
        _this.bugsFetcherAsync(function(bugs) {
            _this.hogsFetcherAsync(function(hogs) {
                callback({
                    bugs: bugs,
                    hogs: hogs
                });
            });
        });
    };

    render() {
        this.bugsView.renderInsert();
        this.hogsView.renderInsert();
        this.homeView.renderInsert();
        this.statsView.renderInsert();
    };

    renderBase() {
        this.headerView.renderInsert();
        this.mainView.renderInsert();
    };

}

window.MasterView = MasterView;
export default MasterView;