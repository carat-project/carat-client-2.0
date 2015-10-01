model = {notifications: {}};
model.notifications = (function() {
    //secondaryText: the text you get when you expand the card
    //
    //timeDrain: how much the item reduces battery life in minutes,
    //always positive or zero (but displayed as negative or zero minutes)
    var makeNotification = function(title, mainText,
                                    secondaryText, classes,
                                    timeDrain, id) {

        return {
            item: {
                title: title,
                mainText: mainText,
                secondaryText: secondaryText,
                classes: classes,
                timeDrain: timeDrain,
                id: id
            }
        };
    };

    var makeSummaryEntry = function(name, timeDrain, icon) {

        return {
            summaryEntry: {
                name: name,
                timeDrain: timeDrain,
                icon: icon
            }
        };
    };

    var makeSummary = function(title, entries, id) {

        return {
            summary: {
                title: title,
                entries: entries,
                id: id
            }
        };
    };

    var getGeneral = function() {

        return [
            makeNotification("Bluetooth",
                             "Info text in here. Something something. Info text in here. Something something.",
                             "Nulla quis ante nisl. Ut auctor arcu ut felis volutpat, vitae vestibulum neque molestie. Vivamus varius finibus purus, id condimentum libero imperdiet vel. In auctor vehicula elit quis mollis. Nullam dapibus, diam at maximus pulvinar, nisl ante feugiat justo, et iaculis lorem ipsum eu lorem.",
                             [],
                             39,
                             "item-0"),
            makeNotification("Vaihtoehtoinen kortti",
                             "Tältä näyttää kun teksti on keskellä ja sen väri on tumman turkoosi minttua taustaa vasten.",
                             "Nulla quis ante nisl. Ut auctor arcu ut felis volutpat, vitae vestibulum neque molestie. Vivamus varius finibus purus, id condimentum libero imperdiet vel. In auctor vehicula elit quis mollis. Nullam dapibus, diam at maximus pulvinar, nisl ante feugiat justo, et iaculis lorem ipsum eu lorem.",
                             ["mint"],
                             39,
                             "item-1"),
            makeNotification("Wifi",
                             "Swipe this card! Info text in here. Something something. Info text in here. Something something.",
                             "Nulla quis ante nisl. Ut auctor arcu ut felis volutpat, vitae vestibulum neque molestie. Vivamus varius finibus purus, id condimentum libero imperdiet vel. In auctor vehicula elit quis mollis. Nullam dapibus, diam at maximus pulvinar, nisl ante feugiat justo, et iaculis lorem ipsum eu lorem.",
                             [],
                             49,
                             "item-2"),
            makeSummary("Hogs",
                        [makeSummaryEntry("Facebook",
                                          38,
                                          "face"),
                         makeSummaryEntry("Tinder",
                                          72,
                                          "favorite"),
                         makeSummaryEntry("testi",
                                          38,
                                          "face"),
                         makeSummaryEntry("testi",
                                          38,
                                          "face")
                        ],
                        "summary-0")
        ];
    };

    var hogsBugsPurify = function(arr) {
        return arr.map(function(elem) {
            var idPrefix = elem.name.replace(/-/g, "--").replace(/\./g, "-");
            var result =  makeNotification("",
                                           elem.name,
                                           "Samples: " + elem.samples,
                                           ["smaller-time-text"],
                                           elem.benefit,
                                           idPrefix + "-" + elem.type);
            return result;
        });
    };


    var getBugs = function(bugsSource) {
        var bugs = hogsBugsPurify(bugsSource);
        return bugs;
    };

    var getHogs = function(hogsSource) {
        var hogs = hogsBugsPurify(hogsSource);
        return hogs;
    };

    var getSystem = function() {
        return [];
    };


    return {
        getGeneral: getGeneral,
        getBugs: getBugs,
        getHogs: getHogs,
        getSystem: getSystem
    };
})();
