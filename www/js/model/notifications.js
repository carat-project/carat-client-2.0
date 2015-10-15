model = {notifications: {}};
model.notifications = (function() {

    //basically a bug or hog card model representation
    //secondaryText: the text you get when you expand the card
    //
    //timeDrain: how much the item reduces battery life in minutes,
    //always positive or zero (but displayed as negative or zero minutes)

    var sortedHogBugList;

    var makeNotification = function(title, icon, label, packageName,
                                    samples, classes,
                                    timeDrain,
                                    timeDrainErrorString,
                                    killButton, removeButton,
                                    id, appCloseCallback, appUninstallCallback) {
        return {
            item: {
                title: title,
                icon: icon,
                label: label,
                packageName: packageName,
                samples: samples,
                classes: classes,
                timeDrain: timeDrain,
                timeDrainErrorString: timeDrainErrorString,
                buttons: {
                    killButton: killButton,
                    removeButton: removeButton
                },
                id: id,
                appCloseCallback: appCloseCallback,
                appUninstallCallback: appUninstallCallback
            }
        };
    };

    //summary item model representation
    var makeSummaryEntry = function(name, nameTag, type, timeDrain,
                                    expectedFigure, icon) {

        return {
            summaryEntry: {
                name: name,
                nameTag: nameTag,
                type: type,
                timeDrain: timeDrain,
                expectedFigure: expectedFigure,
                icon: icon
            }
        };
    };

    //summary model representation
    var makeSummary = function(title, hogEntries, bugEntries, id) {

        return {
            summary: {
                title: title,
                bugEntries: bugEntries,
                hogEntries: hogEntries,
                id: id
            }
        };
    };

    var makeStatistics = function(jscore) {

        return {
            statistics: {
                jscore: jscore
            }
        };
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

    var purifySummaryEntries = function(arr) {
        var entries = arr.map(function(entry) {
            var cutLabel = entry.label.length > 9 ?
                    entry.label.slice(0,8) : entry.label;
            var timeBenefit = splitTimeDrainString(entry.benefit)
                    .timeDrainPart;

            return makeSummaryEntry(cutLabel, entry.name, entry.type,
                                    timeBenefit,
                                    entry.expected, entry.icon);
        });


        entries.sort(function(fst, snd) {
            return snd.expectedFigure - fst.expectedFigure;
        });

        return entries;
    };

    //currently dummy data
    var getSummary = function(hogsSource, bugsSource) {

        return [makeSummary("Summary",
                            purifySummaryEntries(hogsSource),
                            purifySummaryEntries(bugsSource),
                            "summary-0")];
    };

    var getGeneral = function() {
        return [];
    };

    // gives an id based on an app name
    var makeIdFromAppName = function(appName, hogOrBug) {
        var idPrefix = appName.replace(/-/g, "--").replace(/\./g, "-");
        return idPrefix + "-" + hogOrBug;
    };

    //function that cleans up data straight from native plugin
    //so it can be passed forward
    var hogsBugsPurify = function(arr,
                                  appCloseCallback, appUninstallCallback) {
        var hogBugs = arr.map(function(elem) {
            var times = splitTimeDrainString(elem.benefit);

            var result =  makeNotification(elem.label,
                                           elem.icon,
                                           elem.name,
                                           elem.name,
                                           "Samples: " + elem.samples,
                                           ["sleeker",
                                            "smaller-time-text"],
                                           times.timeDrainPart,
                                           times.timeDrainErrorPart,
                                           elem.killable && elem.running,
                                           elem.removable &&
                                           !(elem.killable && elem.running),
                                           makeIdFromAppName(elem.name, elem.type),
                                           appCloseCallback,
                                           appUninstallCallback);
            console.log(result);
            return result;
        });


        return hogBugs;
    };

    //clean up bugs data
    var getBugs = function(bugsSource,
                           appCloseCallback, appUninstallCallback) {
        var bugs = hogsBugsPurify(bugsSource, appCloseCallback, appUninstallCallback);
        return bugs;
    };

    //clean up hogs data
    var getHogs = function(hogsSource,
                           appCloseCallback, appUninstallCallback) {
        var hogs = hogsBugsPurify(hogsSource, appCloseCallback, appUninstallCallback);
        return hogs;
    };

    //nothing at the moment
    var getSystem = function() {
        return [];
    };

    var getStatistics = function(mainDataSource) {
        var statistics = makeStatistics(Math.floor(mainDataSource.jscore * 100));

        return statistics;
    };


    //public methods of the module
    return {
        getGeneral: getGeneral,
        getBugs: getBugs,
        getHogs: getHogs,
        getSystem: getSystem,
        getSummary: getSummary,
        getStatistics: getStatistics,
        makeIdFromAppName: makeIdFromAppName
    };
})();
