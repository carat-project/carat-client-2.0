model.notifications = (function() {
    var debugIds = 0;
    //secondaryText: the text you get when you expand the card
    //
    //timeDrain: how much the item reduces battery life in minutes,
    //always positive or zero (but displayed as negative or zero minutes)
    var makeNotification = function(title, mainText,
                                    secondaryText, classes,
                                    timeDrain) {
        var debugId = debugIds;
        debugIds += 1;

        return {
            item: {
                title: title,
                mainText: mainText,
                secondaryText: secondaryText,
                classes: classes,
                timeDrain: timeDrain,
                id: debugId
            }
        };
    }

    var makeSummaryEntry = function(name, timeDrain, icon) {

        return {
            summaryEntry: {
                name: name,
                timeDrain: timeDrain,
                icon: icon
            }
        };
    }

    var makeSummary = function(title, entries) {

        return {
            summary: {
                title: title,
                entries: entries
            }
        };
    }

    var getGeneral = function() {

        return [
            makeNotification("Bluetooth",
                             "Info text in here. Something something. Info text in here. Something something.",
                             "Nulla quis ante nisl. Ut auctor arcu ut felis volutpat, vitae vestibulum neque molestie. Vivamus varius finibus purus, id condimentum libero imperdiet vel. In auctor vehicula elit quis mollis. Nullam dapibus, diam at maximus pulvinar, nisl ante feugiat justo, et iaculis lorem ipsum eu lorem.",
                             [],
                             39),
            makeNotification("Vaihtoehtoinen kortti",
                             "Tältä näyttää kun teksti on keskellä ja sen väri on tumman turkoosi minttua taustaa vasten.",
                             "Nulla quis ante nisl. Ut auctor arcu ut felis volutpat, vitae vestibulum neque molestie. Vivamus varius finibus purus, id condimentum libero imperdiet vel. In auctor vehicula elit quis mollis. Nullam dapibus, diam at maximus pulvinar, nisl ante feugiat justo, et iaculis lorem ipsum eu lorem.",
                             ["mint"],
                             39),
            makeNotification("Swipe!",
                             "Swipe this card! Swipidiswaip.",
                             "Nulla quis ante nisl. Ut auctor arcu ut felis volutpat, vitae vestibulum neque molestie. Vivamus varius finibus purus, id condimentum libero imperdiet vel. In auctor vehicula elit quis mollis. Nullam dapibus, diam at maximus pulvinar, nisl ante feugiat justo, et iaculis lorem ipsum eu lorem.",
                             [],
                             49),
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
                        ])
        ];
    }

    var getBugs = function() {
        return [];
    }

    var getHogs = function() {
        return [
            makeNotification("Hogs",
                             "Hogs are etc. text in here. Something something. Hogs are etc. text in here. Something something. Hogs are etc. text in here. Something something.",
                             "",
                             ["gray-title"],
                             0),
            makeNotification("Facebook",
                             "Hogs are etc. text in here. Something something. Hogs are etc. text in here. Something something. Hogs are etc. text in here. Something something.",
                             "",
                             [],
                             39),
            makeNotification("Maps",
                             "Info text in here. Something something.",
                             "",
                             [],
                             0)
        ];
    }

    var getSystem = function() {
        return [];
    }


    return {
        getGeneral: getGeneral,
        getBugs: getBugs,
        getHogs: getHogs,
        getSystem: getSystem
    }
})();
