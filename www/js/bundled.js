(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * @namespace Utilities
 */
module.exports.Utilities = (function() {

    /**
     * @function
     * @static
     * @param {String} id
     * @param {String} additional
     * @returns {String} An is that is formed from the given data.
     * @memberOf Utilities
     */
    var makeIdFromOtherId = function(id, additional) {

        return id + "-" + additional;
    };

    /**
     * @function
     * @static
     * @param {String} appName
     * @param {String} hogOrBug
     * @param {String} additional
     * @returns {String} An id that is formed from the given data.
     * @memberOf Utilities
     */
    var makeIdFromAppName = function(appName,
                                     hogOrBug,
                                     additional) {

        var idPrefix = appName.replace(/-/g, "--")
                .replace(/\./g, "-");

        var standardPart = idPrefix + "-" + hogOrBug;

        if(!additional) {
            return standardPart;
        }

        return makeIdFromOtherId(standardPart, additional);
    };

    /**
     * @function
     * @static
     * @param {DOM-element} elem A DOM element that should contain
     an element with the matching id as a sub-element.
     * @param {String} id Id of the element one is searching for.
     * @returns {DOM-element} Element which is a child of the given
     element and has the corresponding id given as a parameter.
     * @memberOf Utilities
     */
    var findById = function(elem, id) {
        return elem.querySelector("#" + id);
    };

    /**
     * @function
     * @static
     * @param {DOM-element} elem The to-be parent of the appendees.
     * @param {Array} appendees Array of DOM nodes that are to
     be appended as children of the given element.
     * @memberOf Utilities
     */
    var appendChildAll = function(elem, appendees) {
        for(var key in appendees) {
            elem.appendChild(appendees[key]);
        }
    };

    /**
     * @function
     * @static
     * @param {String} timeDrainString String that represents
     the time benefit of getting rid of the app.
     * @returns {Object} The string split into two parts containing
     the expected benefit of getting rid of the app and the error
     part associated with the expected benefit.
     * @memberOf Utilities
     */
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

    /**
     * @function
     * @static
     * @param {Number} count The amount of "the thing".
     * @param {String} singular The singular form of the word
     for "the thing" at hand.
     * @returns {String} End-user readable form of the given
     word associated with the given number.
     * @memberOf Utilities
     */
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

    /**
     * @function
     * @static
     * @param {String} htmlString A string that should be valid
     HTML.
     * @returns {DOM-element} Corresponding DOM element that is
     created from the given HTML string.
     * @memberOf Utilities
     */
    var makeDomNode = function(htmlString) {

        var dummyNode = document.createElement("div");
        dummyNode.innerHTML = htmlString;

        return dummyNode.firstChild;
    };

    return {
        makeIdFromAppName: makeIdFromAppName,
        splitTimeDrainString: splitTimeDrainString,
        pluralize: pluralize,
        makeDomNode: makeDomNode,
        makeIdFromOtherId: makeIdFromOtherId,
        appendChildAll: appendChildAll,
        findById: findById
    };
})();

},{}],2:[function(require,module,exports){
var Utilities = require('../helper/Utilities.js').Utilities;

module.exports.DeviceStats = (function(template, utilities, statsPoller) {

    return function(data, gestureCallback) {

        var jScore = Math.round(data.jScore * 100);
        var osVersion = data.osVersion;
        var uuid = data.uuid;
        var deviceModel = data.modelName;
        var totalMemory = data.totalMemory;
        var memoryPercentage = data.memoryPercentage;
        var batteryLife = data.batteryLife;
        console.log(batteryLife);

        var getFields = function() {
            return {
                jScore: jScore,
                osVersion: osVersion,
                batteryLife: batteryLife,
                uuid: uuid,
                deviceModel: deviceModel,
                totalMemory: totalMemory,
                memoryPercentage: memoryPercentage
            };
        };

        var html = template.render(getFields());

        var domNode = (function() {
            var node = utilities.makeDomNode(html);
            gestureCallback(node);


            var cpuText = node.querySelector(
                "#cpuProgressBar span");
            var cpuLoad = node.querySelector(
                "#cpuProgressBar div");

            var memoryText = node.querySelector(
                "#memProgressBar span");
            var memoryLoad = node.querySelector(
                "#memProgressBar div");

            statsPoller.cpuPoller(function(usage) {
                cpuText.style.color = (usage > 65) ?
                    "#fff" : "#000";
                usage = usage + "%";
                console.log(usage);
                cpuText.innerHTML = usage;
                cpuLoad.style.width = usage;
            }, 4000);

            statsPoller.memoryPoller(function(usage) {
                memoryText.style.color = (usage > 65) ?
                    "#fff" : "#000";
                usage = usage + "%";
                memoryText.innerHTML = usage;
                memoryLoad.style.width = usage;
            }, 4000);

            return node;
        })();

        var render = function() {
            return domNode;
        };

        return {
            getFields: getFields,
            render: render
        };
    };
})(new EJS({url: 'js/template/myDevice.ejs'}), Utilities,
   {cpuPoller: window.carat.startCpuPolling,
    memoryPoller: window.carat.startMemoryPolling});

},{"../helper/Utilities.js":1}],3:[function(require,module,exports){
var Utilities = require("../helper/Utilities.js").Utilities;

module.exports.HogBug = (function(template, utilities, buttonActions) {
    /**
     * @class HogBug
     * @param {} data Raw data from the server.
     * @param {} gestureCallback The actions that happen when
     a gesture occurs.
     */
    return function(data, gestureCallback) {

        var benefitSubstrings = utilities
                .splitTimeDrainString(data.benefit);
        var benefit = benefitSubstrings.timeDrainPart;
        var benefitError = benefitSubstrings.timeDrainErrorPart;
        var expected = data.expected;
        var version = data.version;
        var popularity = data.popularity;
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

        /**
         * @function
         * @instance
         * @returns {Object} All the fields of this object.
         * @memberOf HogBug
         */
        var getFields = function() {
            return {
                benefit: benefit,
                benefitError: benefitError,
                expected: expected,
                icon: icon,
                samples: samples,
                label: label,
                version: version,
                popularity: popularity,
                running: running,
                id: id,
                uninstallId: uninstallId,
                closeId: closeId,
                killable: killable,
                uninstallable: uninstallable
            };
        };

        /**
         * @function
         * @instance
         * @returns {String} Id for the HTML-element id field.
         * @memberOf HogBug
         */
        var getId = function() {
            return id;
        };

        /**
         * @function
         * @instance
         * @returns {String} Id for the close button
         HTML-element id field.
         * @memberOf HogBug
         */
        var getCloseId = function() {
            return closeId;
        };

        /**
         * @function
         * @instance
         * @returns {String} Id for the uninstall button
         HTML-element id field.
         * @memberOf HogBug
         */
        var getUninstallId = function() {
            return uninstallId;
        };

        /**
         * @function
         * @instance
         * @returns {Boolean} Whether or not this app is
         currently running.
         * @memberOf HogBug
         */
        var getRunning = function() {
            return running;
        };

        /**
         * @function
         * @instance
         * @returns {String} The package name of this app
         for native plugin use.
         * @memberOf HogBug
         */
        var getPackageName = function() {
            return packageName;
        };

        /**
         * @function
         * @instance
         * @returns {String} The name of the app that is
         displayed for the end user.
         * @memberOf HogBug
         */
        var getLabel = function() {
            return label;
        };

        /**
         * @function
         * @instance
         * @returns {Boolean} Whether or not you can uninstall this app.
         * @memberOf HogBug
         */
        var getUninstallable = function() {
            return uninstallable;
        };

        var html = template.render(getFields());

        var domNode = (function() {
            var node = utilities.makeDomNode(html);
            var closeButton = utilities.findById(node, closeId);
            var uninstallButton = utilities.findById(node, uninstallId);

            closeButton.addEventListener("click", function() {
                buttonActions.close(
                    packageName,
                    function(state) {
                        console.log("Killing app: " + state);
                    });
            });

            uninstallButton.addEventListener("click", function() {
                buttonActions.uninstall(
                    packageName,
                    function(state) {
                        console.log("Uninstalling app: " + state);
                    });
            });

            if(window.localStorage.getItem(id)
               === 'dismissed') {
                node.style.display = 'none';
            } else {
                gestureCallback(node);
            }


            return node;
        })();

        /**
         * @function
         * @instance
         * @returns {DOM-element} Rendered DOM element
         representing a hog or a bug.
         * @memberOf HogBug
         */
        var render = function() {
            return domNode;
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
})(new EJS({url: 'js/template/hogBugCard.ejs'}),
   Utilities,
   {close: window.carat.killApp,
    uninstall: window.carat.uninstallApp});


},{"../helper/Utilities.js":1}],4:[function(require,module,exports){
var SummaryEntry = require("./SummaryEntry.js").SummaryEntry;
var Utilities = require("../helper/Utilities.js").Utilities;

module.exports.SummaryContainer = (function(template, utilities) {
    /**
     * @class SummaryContainer
     * @param {} bugs Array of raw data representing
     the bugs that are listed in the summary.
     * @param {} hogs Array of raw data representing
     the hogs that are listed in the summary.
     */
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

        /**
         * @function
         * @instance
         * @returns {Object} All the fields of this object.
         * @memberOf SummaryContainer
         */
        var getFields = function() {
            return {
                bugEntries: bugEntries,
                hogEntries: hogEntries
            };
        };

        /**
         * @function
         * @instance
         * @returns {Array} All the bug entries listed
         in the summary.
         * @memberOf SummaryContainer
         */
        var getBugs = function() {
            return bugEntries;
        };

        /**
         * @function
         * @instance
         * @returns {Array} All the hog entries listed
         in the summary.
         * @memberOf SummaryContainer
         */
        var getHogs = function() {
            return hogEntries;
        };

        var getRendered = function() {

            var renderedBugs = bugEntries.map(function(bug) {
                return bug.render();
            });


            var renderedHogs = hogEntries.map(function(hog) {
                return hog.render();
            });

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

        var domNode = (function() {

            var rendered = getRendered();
            var html = template.render(rendered);

            var node = utilities.makeDomNode(html);

            var hogsLoc = utilities.findById(node, "hogsGrid");
            var bugsLoc = utilities.findById(node, "bugsGrid");


            utilities.appendChildAll(hogsLoc, rendered.hogs);
            utilities.appendChildAll(bugsLoc, rendered.bugs);

            return node;
        })();

        /**
         * @function
         * @instance
         * @returns {DOM-element} Rendered DOM element
         representing the summary.
         * @memberOf SummaryContainer
         */
        var render = function() {
            return domNode;
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
    /**
     * @class SummaryEntry
     * @param {} data Raw data from the server.
     */
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

        /**
         * @function
         * @instance
         * @returns {String} The id for the HTML-element
         id field.
         * @memberOf SummaryEntry
         */
        var getId = function() {
            return id;
        };

        /**
         * @function
         * @instance
         * @returns {String} The id of the item that clicking
         this entry links to.
         * @memberOf SummaryEntry
         */
        var getTargetId = function() {
            return targetId;
        };

        /**
         * @function
         * @instance
         * @returns {String} What kind of entry this is,
         hog or a bug.
         * @memberOf SummaryEntry
         */
        var getType = function() {
            return type;
        };

        var html = template.render(getFields());

        var domNode = (function() {
            var node = utilities.makeDomNode(html);

            var tab;

            if(type === "BUG") {
                tab = "bugs-tab";
            } else if(type === "HOG") {
                tab = "hogs-tab";
            } else {
                return node;
            }

            node.addEventListener("click", function() {
                document.getElementById(tab).click();
                window.location.hash = targetId;
            });

            return node;
        })();

        /**
         * @function
         * @instance
         * @returns {DOM-element} Rendered DOM element
         representing an app featured in the summary.
         * @memberOf SummaryEntry
         */
        var render = function() {
            return domNode;
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

/**
 * @class BugCards
 * @extends HogBugCards
 * @param {} bugsSource A callback that is used for fetching
 the bugs from the server.
 * @summary Specializes HogBugCards for bugs specifically.
 */
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
    /**
     * @class HogBugCards
     * @param {} dataOrigin Callback that is used for acquiring
     raw data from the server.
     * @param {} outputElemId The id of the parent HTML element.
     * @param {} gestureCallback Actions that are performed when
     a gesture occurs.
     */
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

            var templateData = {
                cardLocIds: cardLocIds,
                hogBugsArray: hogBugsArray
            };

            var rendered = utilities
                    .makeDomNode(template.render(templateData));

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

        /**
         * @function
         * @instance
         * @param {} freshDataSource A callback which is used for
         acquiring data from the server.
         * @memberOf HogBugCards
         */
        var setDataSource = function(freshDataSource) {
            dataSource = freshDataSource;
            renderAsync = renderAsyncSource(freshDataSource);
        };

        /**
         * @function
         * @instance
         * @memberOf HogBugCards
         * @summary Insert these cards as a part of the document.
         */
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

},{"../helper/Utilities.js":1,"../model/HogBug.js":3}],9:[function(require,module,exports){
var HogBugCards = require("./HogBugCards.js").HogBugCards;

/**
 * @class HogCards
 * @extends HogBugCards
 * @param {} hogsSource A callback that is used for fetching
 the hogs from the server.
 * @summary Specializes HogBugCards for hogs specifically.
 */
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
    /**
     * @class HomeCards
     */
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

        /**
         * @function
         * @instance
         * @param {} freshDataSource A callback which is used for
         acquiring data from the server.
         * @memberOf HomeCards
         */
        var setDataSource = function(freshDataSource) {
            dataSource = freshDataSource;
            renderAsync = renderAsyncSource(freshDataSource);
        };

        /**
         * @function
         * @instance
         * @memberOf HomeCards
         * @summary Insert these cards as a part of the document.
         */
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
    /**
     * @class MasterView
     * @summary Class that wraps up all other views.
     */
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
                memoryStatsFetcherAsync(function(memInfo) {
                    mainReportsFetcherAsync(function(mainData) {
                        uuidFetcherAsync(function(uuid) {
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

        /**
         * @function
         * @instance
         * @memberOf MasterView
         * @summary Render all views and insert the results as
         part of the document.
         */
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

module.exports.MasterView = MasterView;

},{"./BugCards.js":6,"./Headerbar.js":7,"./HogCards.js":9,"./HomeCards.js":10,"./MainContent.js":11,"./StatsCards.js":13}],13:[function(require,module,exports){
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
                                / memInfo.total,
                            batteryLife: main.batteryLife
                        });
                    });
                });
            });
        };

        var dataSource = defaultDataSource;

        var renderAsyncSource = function(sourceCallback) {

            return function(onResultCallback) {
                sourceCallback(function(data) {
                    var myDeviceModel = new DeviceStats(data,
                                                        gestureCallback);
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
                var node = renderedTemplate;
                docLocation.appendChild(node);
            });
        };

        return {
            setDataSource: setDataSource,
            renderInsert: renderInsert
        };
    };
})(makeElemTappable, Utilities);

},{"../helper/Utilities.js":1,"../model/DeviceStats.js":2}]},{},[12]);
