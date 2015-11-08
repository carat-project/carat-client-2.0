(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports.Utilities = (function() {

    var makeIdFromAppName = function(appName,
                                     hogOrBug,
                                     additional) {

        var idPrefix = appName.replace(/-/g, "--")
                .replace(/\./g, "-");

        if(!additional) {
            return idPrefix + "-" + hogOrBug;
        }

        return idPrefix + "-" + hogOrBug + "-" + additional;
    };

    var splitTimeDrainString = function(timeDrainString) {
        var timeDrainSplit = timeDrainString.split("±", 2);

        var timeDrainPart;
        var timeDrainErrorPart;

        if(timeDrainSplit.length === 2) {
            timeDrainPart = timeDrainSplit[0];
            timeDrainErrorPart = "±" + timeDrainSplit[1];
        } else {
            timeDrainPart = timeDrainString;
            timeDrainErrorPart = "";
        }

        return {timeDrainPart: timeDrainPart,
                timeDrainErrorPart: timeDrainErrorPart};
    };

    var pluralize = function(count, singular) {

        var form;

        if(count === 1) {
            form = singular;
        } else {
            form = singular + 's';
        }

        if(count === 0) {
            return "No " + form;
        } else {
            return count + " " + form;
        }
    };

    var makeDomNode = function(htmlString) {

        var dummyNode = document.createElement("div");
        dummyNode.innerHTML = htmlString;

        return dummyNode.firstChild;
    };

    return {
        makeIdFromAppName: makeIdFromAppName,
        splitTimeDrainString: splitTimeDrainString,
        pluralize: pluralize,
        makeDomNode: makeDomNode
    };
})();

},{}],2:[function(require,module,exports){
module.exports.DeviceStats = (function(template) {

    return function(data) {

        var jScore = Math.round(data.jScore * 100);
        console.log(jScore, data.jscore);
        var osVersion = data.osVersion;
        var uuid = data.uuid;
        var deviceModel = data.modelName;
        var totalMemory = data.totalMemory;
        var memoryPercentage = data.memoryPercentage;

        var getFields = function() {
            return {
                jScore: jScore,
                osVersion: osVersion,
                uuid: uuid,
                deviceModel: deviceModel,
                totalMemory: totalMemory,
                memoryPercentage: memoryPercentage
            };
        };

        var html = template.render(getFields());

        var render = function() {
            return html;
        };

        return {
            getFields: getFields,
            render: render
        };
    };
})(new EJS({url: 'js/template/myDevice.ejs'}));

},{}],3:[function(require,module,exports){
var Utilities = require("../helper/Utilities.js").Utilities;

module.exports.HogBug = (function(template, utilities) {

    return function(data) {

        var benefitSubstrings = utilities
                .splitTimeDrainString(data.benefit);

        var benefit = benefitSubstrings.timeDrainPart;
        var benefitError = benefitSubstrings.timeDrainErrorPart;
        var expected = data.expected;
        var icon = data.icon;
        var samples = data.samples;
        var label = data.label;
        var packageName = data.name;
        var running = data.running;
        var killable = data.running && data.killable;
        var uninstallable = data.removable;
        var id = utilities.makeIdFromAppName(data.name, data.type);
        var uninstallId = utilities.makeIdFromAppName(data.name,
                                                      data.type,
                                                      "uninstall");
        var closeId = utilities.makeIdFromAppName(data.name,
                                                  data.type,
                                                  "close");

        var getFields = function() {
            return {
                benefit: benefit,
                benefitError: benefitError,
                expected: expected,
                icon: icon,
                samples: samples,
                label: label,
                running: running,
                id: id,
                uninstallId: uninstallId,
                closeId: closeId,
                killable: killable,
                uninstallable: uninstallable
            };
        };

        var getId = function() {
            return id;
        };

        var getCloseId = function() {
            return closeId;
        };

        var getUninstallId = function() {
            return uninstallId;
        };

        var getRunning = function() {
            return running;
        };

        var getPackageName = function() {
            return packageName;
        };

        var getLabel = function() {
            return label;
        };

        var getUninstallable = function() {
            return uninstallable;
        };

        var html = template.render(getFields());

        var render = function() {
            return html;
        };


        return {
            render: render,
            getFields: getFields,
            getId: getId,
            getCloseId: getCloseId,
            getLabel: getLabel,
            getUninstallId: getUninstallId,
            getPackageName: getPackageName,
            getRunning: getRunning,
            getUninstallable: getUninstallable
        };
    };
})(new EJS({url: 'js/template/hogBugCard.ejs'}), Utilities);


},{"../helper/Utilities.js":1}],4:[function(require,module,exports){
var SummaryEntry = require("./SummaryEntry.js").SummaryEntry;
var Utilities = require("../helper/Utilities.js").Utilities;

module.exports.SummaryContainer = (function(template, utilities) {

    return function(bugs, hogs) {

        var makeModels = function(data) {

            var result = [];

            for(var key in data) {
                result.push(new SummaryEntry(data[key]));
            }

            return result;
        };

        var bugEntries = makeModels(bugs);

        var hogEntries = makeModels(hogs);

        var getFields = function() {
            return {
                bugEntries: bugEntries,
                hogEntries: hogEntries
            };
        };

        var getBugs = function() {
            return bugEntries;
        };

        var getHogs = function() {
            return hogEntries;
        };

        console.log(getFields());

        var getRendered = function() {

            var renderedBugs = bugEntries.map(function(bug) {
                return bug.render();
            });


            var renderedHogs = hogEntries.map(function(hog) {
                return hog.render();
            });

            console.log(renderedHogs);

            var bugsCount = utilities.pluralize(renderedBugs.length,
                                                "bug");
            var hogsCount = utilities.pluralize(renderedHogs.length,
                                                "hog");

            return {
                hogs: renderedHogs,
                bugs: renderedBugs,
                bugsCount: bugsCount,
                hogsCount: hogsCount
            };

        };

        var html = template.render(getRendered());

        var render = function() {
            return html;
        };

        return {
            render: render,
            getFields: getFields,
            getBugs: getBugs,
            getHogs: getHogs
        };
    };
})(new EJS({url: "js/template/summary.ejs"}), Utilities);

},{"../helper/Utilities.js":1,"./SummaryEntry.js":5}],5:[function(require,module,exports){
var Utilities = require("../helper/Utilities.js").Utilities;

module.exports.SummaryEntry = (function(template, utilities) {
    return function(data) {

        var cutLabel = function(labelToCut) {
            var ellipsis = String.fromCharCode(8230);
            // Charcode 8230 is ellipsis
            return labelToCut.length > 9 ?
                labelToCut.slice(0,6) + ellipsis : labelToCut;
        };

        var id = utilities.makeIdFromAppName(data.name,
                                             data.type,
                                             "entry");
        var targetId = utilities.makeIdFromAppName(data.name,
                                                   data.type);
        var benefit = utilities.splitTimeDrainString(data.benefit)
                .timeDrainPart;
        var label = cutLabel(data.label);
        var icon = data.icon;
        var type = data.type;

        var getFields = function() {

            return {
                id: id,
                benefit: benefit,
                label: label,
                icon: icon
            };
        };

        var getId = function() {
            return id;
        };

        var getTargetId = function() {
            return targetId;
        };

        var getType = function() {
            return type;
        };

        var html = template.render(getFields());

        var render = function() {
            return html;
        };

        return {
            render: render,
            getId: getId,
            getTargetId: getTargetId,
            getType: getType
        };

    };
})(new EJS({url: "js/template/summaryEntry.ejs"}), Utilities);

},{"../helper/Utilities.js":1}],6:[function(require,module,exports){
var HogBugCards = require("./HogBugCards.js").HogBugCards;

module.exports.BugCards = function(bugsSource) {

    if(!bugsSource) {
        bugsSource = window.carat.getBugs;
    }
    return new HogBugCards(bugsSource, "bugs",
                           makeElemPanSwipable);
};

},{"./HogBugCards.js":8}],7:[function(require,module,exports){
var Utilities = require("../helper/Utilities.js").Utilities;

module.exports.Headerbar = (function(template, elemId, parentId, utilities) {
    return function() {

        var renderTemplate = function() {
            return template.render();
        };

        var hide = function() {
            var elem = document.getElementById(elemId);

            if(elem) {
                elem.style["display"] = "none";
            }
        };

        var show = function() {
            var elem = document.getElementById(elemId);

            if(elem) {
                elem.style["display"] = "inherit";
            }
        };

        var renderInsert = function() {
            var node = utilities.makeDomNode(renderTemplate());
            document.getElementById(parentId).appendChild(node);
        };

        return {
            renderInsert: renderInsert,
            hide: hide,
            show: show
        };
    };
})(new EJS({url: 'js/template/headerbar.ejs'}), "header-bar",
   "main-screen", Utilities);

},{"../helper/Utilities.js":1}],8:[function(require,module,exports){
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

},{"../helper/Utilities.js":1,"../model/HogBug.js":3}],9:[function(require,module,exports){
var HogBugCards = require("./HogBugCards.js").HogBugCards;

module.exports.HogCards = function(hogsSource) {

    if(!hogsSource) {
        hogsSource = window.carat.getHogs;
    }
    return new HogBugCards(hogsSource,
                           "hogs", makeElemPanSwipable);
};

},{"./HogBugCards.js":8}],10:[function(require,module,exports){
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

},{"../helper/Utilities.js":1,"../model/SummaryContainer.js":4}],11:[function(require,module,exports){
var Utilities = require("../helper/Utilities.js").Utilities;

module.exports.MainContent = (function(template, parentId, utilities) {
    return function() {

        var renderTemplate = function() {
            return template.render();
        };

        var renderInsert = function() {
            var node = utilities.makeDomNode(renderTemplate());
            console.log(node);
            document.getElementById(parentId).appendChild(node);
        };

        return {
            renderInsert: renderInsert
        };
    };
})(new EJS({url: 'js/template/mainContent.ejs'}), "main-screen",
   Utilities);

},{"../helper/Utilities.js":1}],12:[function(require,module,exports){
var HogCards = require("./HogCards.js").HogCards;
var BugCards = require("./BugCards.js").BugCards;
var HomeCards = require("./HomeCards.js").HomeCards;
var StatsCards = require("./StatsCards.js").StatsCards;
var Headerbar = require("./Headerbar.js").Headerbar;
var MainContent = require("./MainContent.js").MainContent;

MasterView = (function(headerView, mainView,
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
            bugsView.renderInsert();
            hogsView.renderInsert();
            homeView.renderInsert();
            statsView.renderInsert();
        };

        var renderBase = function() {
            headerView.renderInsert();
            mainView.renderInsert();
        };

        return {
            render: render,
            renderBase: renderBase
        };
    };
})(new Headerbar(), new MainContent(),
   new BugCards(), new HogCards(),
   new HomeCards(), new StatsCards());

},{"./BugCards.js":6,"./Headerbar.js":7,"./HogCards.js":9,"./HomeCards.js":10,"./MainContent.js":11,"./StatsCards.js":13}],13:[function(require,module,exports){
var DeviceStats = require("../model/DeviceStats.js").DeviceStats;
var Utilities = require("../helper/Utilities.js").Utilities;

module.exports.StatsCards = (function(gestureCallback, utilities) {

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

        var setDataSource = function(freshDataSource) {
            dataSource = freshDataSource;
            renderAsync = renderAsyncSource(freshDataSource);
        };

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

},{"../helper/Utilities.js":1,"../model/DeviceStats.js":2}]},{},[12]);
