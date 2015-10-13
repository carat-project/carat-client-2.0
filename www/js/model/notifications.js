model = {notifications: {}};
model.notifications = (function() {

    //basically a bug or hog card model representation
    //secondaryText: the text you get when you expand the card
    //
    //timeDrain: how much the item reduces battery life in minutes,
    //always positive or zero (but displayed as negative or zero minutes)

    var makeNotification = function(title, icon, label, packageName,
                                    samples, classes,
                                    timeDrain,
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
    var makeSummaryEntry = function(name, timeDrain, icon) {

        return {
            summaryEntry: {
                name: name,
                timeDrain: timeDrain,
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

    var purifySummaryEntries = function(arr) {
        return arr.map(function(entry) {
//            var icons = ["face", "favorite"];
//            var randomIcon =
//                    icons[Math.floor(Math.random() * icons.length)];
            var cutLabel = entry.label.length > 9 ?
                    entry.label.slice(0,8) : entry.label;

            return makeSummaryEntry(cutLabel, entry.benefit, entry.icon);
        });
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
    var hogsBugsPurify = function(arr, appCloseCallback, appUninstallCallback) {
        return arr.map(function(elem) {
            var result =  makeNotification(elem.label,
                                           elem.icon,
                                           elem.name,
                                           elem.name,
                                           "Samples: " + elem.samples,
                                           ["sleeker",
                                            "smaller-time-text"],
                                           elem.benefit,
                                           elem.killable && elem.running,
                                           elem.removable &&
                                           !(elem.killable && elem.running),
                                           makeIdFromAppName(elem.name, elem.type),
                                           appCloseCallback,
                                           appUninstallCallback);
            return result;
        });
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
