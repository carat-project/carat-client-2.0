model = {notifications: {}};
model.notifications = (function() {

    //basically a bug or hog card model representation
    //secondaryText: the text you get when you expand the card
    //
    //timeDrain: how much the item reduces battery life in minutes,
    //always positive or zero (but displayed as negative or zero minutes)

    var sortedHogBugList;
    var ellipsis = String.fromCharCode(8230);

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

	var makeCarat = function(chart) {
		
		return {
			carat: {
				chart: chart
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
                    // Charcode 8230 is ellipsis
                    entry.label.slice(0,6) + ellipsis : entry.label;
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
                                  appCloseCallback, appUninstallCallback, styles) {
        var hogBugs = arr.map(function(elem) {
            var times = splitTimeDrainString(elem.benefit);
            var label = elem.label.length > 20 ?
                elem.label.slice(0,19) + ellipsis : elem.label;

            var result =  makeNotification(label,
                                           elem.icon,
                                           elem.name,
                                           elem.name,
                                           "Samples: " + elem.samples,
                                           styles,
                                           times.timeDrainPart,
                                           times.timeDrainErrorPart,
                                           elem.killable && elem.running,
                                           elem.removable &&
                                           !(elem.killable && elem.running),
                                           makeIdFromAppName(elem.name, elem.type),
                                           appCloseCallback,
                                           appUninstallCallback);

            return result;
        });


        return hogBugs;
    };

    //clean up bugs data
    var getBugs = function(bugsSource,
                           appCloseCallback, appUninstallCallback) {
        var styles = ["sleeker", "smaller-time-text"];
        var bugs = hogsBugsPurify(bugsSource, appCloseCallback, appUninstallCallback, styles);
        return bugs;
    };

    //clean up hogs data
    var getHogs = function(hogsSource,
                           appCloseCallback, appUninstallCallback) {
                var styles = ["sleeker", "smaller-time-text"];
        var hogs = hogsBugsPurify(hogsSource, appCloseCallback, appUninstallCallback, styles);
        return hogs;
    };

    var getWorstBugs = function(bugsSource,
                           appCloseCallback, appUninstallCallback) {
        var styles = [];
        var bugs = hogsBugsPurify(bugsSource, appCloseCallback, appUninstallCallback, styles);
        return bugs;
    };
        
    //nothing at the moment
    var getSystem = function() {
        return [];
    };

    var getStatistics = function(mainDataSource) {
        var statistics = makeStatistics(Math.floor(mainDataSource.jscore * 100));

        return statistics;
    };

	var getCarat = function(statisticsDataSource) {
	
		var carat = makeCarat(createChart(statisticsDataSource));
		
		return carat;
	}

    //public methods of the module
    return {
        getGeneral: getGeneral,
        getBugs: getBugs,
        getHogs: getHogs,
        getSystem: getSystem,
        getWorstBugs: getWorstBugs,
        getSummary: getSummary,
        getStatistics: getStatistics,
		getCarat: getCarat,
        makeIdFromAppName: makeIdFromAppName
    };
})();
