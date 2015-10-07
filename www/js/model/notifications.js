model = {notifications: {}};
model.notifications = (function() {

    //basically a bug or hog card model representation
    //secondaryText: the text you get when you expand the card
    //
    //timeDrain: how much the item reduces battery life in minutes,
    //always positive or zero (but displayed as negative or zero minutes)
    var makeNotification = function(title, icon, mainText,
                                    secondaryText, classes,
                                    timeDrain, id) {

        return {
            item: {
                title: title,
                icon: icon,
                mainText: mainText,
                secondaryText: secondaryText,
                classes: classes,
                timeDrain: timeDrain,
                id: id
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

//    var makeSummaryGroup = function(name, timeDrain, entries) {
//        return {
//            summaryGroup: {
//                name: name,
//                timeDrain: timeDrain,
//                entries: entries
//            }
//        };
//    };

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

    var purifySummaryEntries = function(arr) {
        return arr.map(function(entry) {
            var icons = ["face", "favorite"];
            var randomIcon =
                    icons[Math.floor(Math.random() * icons.length)];
            var cutLabel = entry.label.length() > 10 ?
                    entry.label.slice(0,9) : entry.label;

            return makeSummaryEntry(cutLabel, entry.benefit, randomIcon);

//            var cutName = entry.label.slice(0, 9);

//            return makeSummaryEntry(cutName, entry.benefit, randomIcon);
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

    //function that cleans up data straight from native plugin
    //so it can be passed forward
    var hogsBugsPurify = function(arr) {
        return arr.map(function(elem) {
            var idPrefix = elem.name.replace(/-/g, "--").replace(/\./g, "-");
            var result =  makeNotification(elem.label,
            							   elem.icon,
                                           elem.name,
                                           "Samples: " + elem.samples,
                                           ["sleeker",
                                            "smaller-time-text"],
                                           elem.benefit,
                                           idPrefix + "-" + elem.type);
            return result;
        });
    };


    //clean up bugs data
    var getBugs = function(bugsSource) {
        var bugs = hogsBugsPurify(bugsSource);
        return bugs;
    };

    //clean up hogs data
    var getHogs = function(hogsSource) {
        var hogs = hogsBugsPurify(hogsSource);
        return hogs;
    };

    //nothing at the moment
    var getSystem = function() {
        return [];
    };


    //public methods of the module
    return {
        getGeneral: getGeneral,
        getBugs: getBugs,
        getHogs: getHogs,
        getSystem: getSystem,
        getSummary: getSummary
    };
})();
