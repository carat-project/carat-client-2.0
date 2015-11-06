var MasterView = (function(headerView, mainView,
                           bugsView, hogsView,
                           homeView, statsView) {
    return function() {

        var bugsRawData = [];
        var hogsRawData = [];
        var mainReportsRawData = [];
        var deviceInfoRawData = [];
        var memoryRawData = [];
        var savedUuid = "";

        var savedInfoFetcherAsync = function(savedInfo, dataSource,
                                             callback) {
            console.log(savedInfo, dataSource, callback);
            if(!savedInfo || savedInfo.length === 0) {

                dataSource(function(data) {

                    savedInfo = data;
                    callback(data);
                });
            } else {
                callback(savedInfo);
            }
        };

        var uuidFetcherAsync = function(callback) {

            var uuidGetter = function(action) {
                window.carat.getUuid(function(uuid) {
                    if(!uuid) {
                        action("Default");
                    }

                    action(uuid);
                });
            };

            savedInfoFetcherAsync(savedUuid,
                                  uuidGetter,
                                  callback);
        };

        var memoryStatsFetcherAsync = function(callback) {

            var getMemory = function(action) {
                window.carat.getMemoryInfo(function(memInfo) {
                    var usedMemory = Math.round((memInfo.total
                                                 - memInfo.available)
                                                / 1000);
                    var totalMemory = Math.round(memInfo.total
                                                 / 1000);
                    var percentage = Math.floor((usedMemory
                                                 / totalMemory)
                                                * 100);


                    var result = {
                        usedMemory: usedMemory,
                        totalMemory: totalMemory,
                        percentage: percentage
                    };

                    action(result);
                });
            };

            savedInfoFetcherAsync(memoryRawData,
                                  getMemory,
                                  callback);
        };

        var mainReportsFetcherAsync = function(callback) {

            savedInfoFetcherAsync(mainReportsRawData,
                                  window.carat.getMainReports,
                                  callback);
        };

        var deviceInfoFetcherAsync = function(callback) {

            var getDeviceInfo = function(action) {
                var device = {
                    modelName: window.device.model,
                    osVersion: window.device.platform
                        + " " + window.device.version

                };
                action(device);
            };

            savedInfoFetcherAsync(deviceInfoRawData,
                                  getDeviceInfo,
                                  callback);
        };

        var myDeviceFetcherAsync = function(callback) {

            deviceInfoFetcherAsync(function(deviceInfo) {
                console.log(deviceInfo);
                memoryStatsFetcherAsync(function(memInfo) {
                    console.log(memInfo);
                    mainReportsFetcherAsync(function(mainData) {
                        console.log(mainData);
                        uuidFetcherAsync(function(uuid) {
                            console.log(uuid);
                            callback({
                                modelName: deviceInfo.modelName,
                                osVersion: deviceInfo.osVersion,
                                jScore: mainData.jscore,
                                uuid: uuid,
                                usedMemory: memInfo.usedMemory,
                                totalMemory: memInfo.totalMemory,
                                memoryPercentage: memInfo.percentage
                            });
                        });
                    });
                });
            });
        };

        var bugsFetcherAsync = function(callback) {

            savedInfoFetcherAsync(bugsRawData,
                                  window.carat.getBugs,
                                  callback);
        };

        var hogsFetcherAsync = function(callback) {

            savedInfoFetcherAsync(hogsRawData,
                                  window.carat.getHogs,
                                  callback);
        };

        var hogsAndBugsFetcherAsync = function(callback) {

            bugsFetcherAsync(function(bugs) {
                hogsFetcherAsync(function(hogs) {
                    callback({
                        bugs: bugs,
                        hogs: hogs
                    });
                });
            });
        };

        bugsView.setDataSource(bugsFetcherAsync);
        hogsView.setDataSource(hogsFetcherAsync);
        homeView.setDataSource(hogsAndBugsFetcherAsync);
        statsView.setDataSource(myDeviceFetcherAsync);

        var render = function() {
            headerView.renderInsert();
            mainView.renderInsert();
            bugsView.renderInsert();
            hogsView.renderInsert();
            homeView.renderInsert();
            statsView.renderInsert();
        };

        return {
            render: render
        };
    };
})(new Headerbar(), new MainContent(),
   new BugCards(), new HogCards(),
   new HomeCards(), new StatsCards());
