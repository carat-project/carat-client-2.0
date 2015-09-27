itemCards = (function(notificationsArray, panSwipeCallback) {

    var parseDomNode = function(htmlString) {

        var dummyDiv = document.createElement("div");
        dummyDiv.innerHTML = htmlString;

        var result = dummyDiv.firstChild;

        return result;
    };
    //get template Dom-node for a card
    var getNewItemDomNodeTemplate = function() {

        var htmlString = '<div class="mdl-card mdl-shadow--2dp"><div class="carat-card__title"><div class="mdl-card__title-text"></div><div class="mdl-layout-spacer"></div><span class="carat-card-time"></span></div><div class="mdl-card__supporting-text"><div class="collapse"></div></div><div class="mdl-card__actions"><a class="mdl-card__more" role="button" data-toggle="collapse" aria-expanded="false" aria-controls="collapseExample">More</a></div></div>';

        var domNode = parseDomNode(htmlString);

        panSwipeCallback(domNode);

        return domNode;
    };

    var getNewSummaryEntryDomNodeTemplate = function() {
        var htmlString = '<div class="mdl-cell mdl-cell--2-col"><div><i class="material-icons"></i></div><div><strong></strong></div><div><span class="mdl-color-text--red-300"></span></div></div>';

        var domNode = parseDomNode(htmlString);

        return domNode;
    };

    var getNewSummaryDomNodeTemplate = function() {
        var htmlString = '<div class="mdl-card mdl-shadow--2dp"><div class="carat-card__title"><div class="mdl-card__title-text"></div><div class="mdl-layout-spacer"></div></div><div class="mdl-card__supporting-text"><div class="mdl-grid"></div></div></div>';

        var domNode = parseDomNode(htmlString);

        return domNode;
    };

    var trashANode = function(nodeToBeTrashed) {

        var parent = nodeToBeTrashed.parentNode;
        parent.removeChild(nodeToBeTrashed);
    };

    var addNodeText = function(nodeToBeTextified, text) {

        var textNode = document.createTextNode(text);
        nodeToBeTextified
            .insertBefore(textNode,
                          nodeToBeTextified.firstChild);
    };

    var appendTextOrRemoveNode = function(nodeMaybeTextified,
                                          text) {
        if(!text) {
            trashANode(nodeMaybeTextified);
        } else {
            addNodeText(nodeMaybeTextified, text);
        }
    };

    var injectIdToCard = function(cardDomNode, id) {

        cardDomNode.id = id;
    };

    var injectTitle = function(cardDomNode, title) {

        var titleNode = cardDomNode
            .querySelector(".mdl-card__title-text");

        appendTextOrRemoveNode(titleNode, title);
    };

    var injectMainText = function(cardDomNode, mainText) {

        var mainTextNode = cardDomNode
            .querySelector(".mdl-card__supporting-text");

        appendTextOrRemoveNode(mainTextNode, mainText);
    };

    var injectSecondaryText = function(cardDomNode,
                                       secondaryText,
                                       notificationId) {

        var secondaryTextNode = cardDomNode
            .querySelector(".collapse");
        var moreButton = cardDomNode
            .querySelector(".mdl-card__more");
        var nodeId = "card-" + notificationId + "-textpand";


        if(!secondaryText) {
            trashANode(secondaryTextNode);
            trashANode(moreButton);
        } else {
            addNodeText(secondaryTextNode, secondaryText);
            secondaryTextNode.id = nodeId;
            moreButton.href = "#" + nodeId;
        }
    };

    var injectClasses = function(cardDomNode, classes) {

        var nodeClassList = cardDomNode.classList;

        for(var i = 0; i < classes.length; i++) {
            nodeClassList.add(classes[i]);
        }
    };

    var makeTimeDrainText = function(timeDrainNode,
                                     timeDrain) {
        if(!timeDrain) {
            trashANode(timeDrainNode);
        } else {
            var timeDrainText = "-" + timeDrain + "min";
            addNodeText(timeDrainNode, timeDrainText);
        }

        return timeDrainNode;
    };

    var injectTimeDrain = function(cardDomNode, timeDrain) {

        var timeDrainNode = cardDomNode
            .querySelector(".carat-card-time");

        makeTimeDrainText(timeDrainNode, timeDrain);

    };

    var injectSummaryEntryName = function(summaryEntryDomNode,
                                          name) {
        var nameNode = summaryEntryDomNode
            .querySelector(".mdl-cell > div strong");

        appendTextOrRemoveNode(nameNode, name);
    };

    var injectSummaryEntryIcon = function(summaryEntryDomNode,
                                          icon) {
        var iconNode = summaryEntryDomNode
            .querySelector("i.material-icons");

        appendTextOrRemoveNode(iconNode, icon);
    };

    var injectSummaryEntryTimeDrain = function(
        summaryEntryDomNode, timeDrain) {

        var timeDrainNode = summaryEntryDomNode
            .querySelector("div.mdl-cell div span");

        makeTimeDrainText(timeDrainNode, timeDrain);
    };

    var injectSummaryTitle = function(summaryDomNode,
                                      title) {

        var titleNode = summaryDomNode
            .querySelector("div.mdl-card__title-text");

        appendTextOrRemoveNode(titleNode, title);
    };

    var homebrewMap = function(array, callback) {
        for(var i = 0; i < array.length; i++) {
            array[i] = callback(array[i]);
        }

        return array;
    };

    var homebrewConcatChildren = function(spot,
                                          firstChild,
                                          concatees) {

        for(var i = 0; i < concatees.length; i++) {
            spot.insertBefore(concatees[i], firstChild);
        }

    };

    var makeSummaryEntry = function(summaryEntryObject) {

        var domNode = getNewSummaryEntryDomNodeTemplate();
        var entryFields = summaryEntryObject.summaryEntry;

        injectSummaryEntryName(domNode, entryFields.name);
        injectSummaryEntryIcon(domNode, entryFields.icon);
        injectSummaryEntryTimeDrain(domNode,
                                    entryFields.timeDrain);

        return domNode;
    };

    var makeSummaryCard = function(summaryObject,
                                   summaryDomNode) {

        injectSummaryTitle(summaryDomNode,
                           summaryObject.title);

        var summaryEntryNodes = homebrewMap(
            summaryObject.entries, makeSummaryEntry);
        var spot = summaryDomNode
            .querySelector("div.mdl-grid");
        homebrewConcatChildren(spot, spot.firstChild,
                               summaryEntryNodes);
    };

    var makeCardBasedOnModel = function(notificationObject) {

        var newCardNode;

        if(notificationObject.item) {

            var itemData = notificationObject.item;

            newCardNode = getNewItemDomNodeTemplate();

            injectTitle(newCardNode, itemData.title);
            injectMainText(newCardNode,
                           itemData.mainText);
            injectSecondaryText(newCardNode,
                                itemData.secondaryText,
                                itemData.id);
            injectClasses(newCardNode,
                          itemData.classes);
            injectTimeDrain(newCardNode,
                            itemData.timeDrain);
            injectIdToCard(newCardNode, itemData.id);

            if(localStorage.getItem(itemData.id) === 'dismissed') {
                newCardNode.style.display = 'none';
            }
        } else if(notificationObject.summary) {

            newCardNode = getNewSummaryDomNodeTemplate();

            var summaryData = notificationObject.summary;
            makeSummaryCard(summaryData, newCardNode);
            injectIdToCard(newCardNode, summaryData.id);
        }


        return newCardNode;
    };



    var getHomeCards = function() {

        var result = homebrewMap(notificationsArray.getGeneral(),
                                 makeCardBasedOnModel);
        return result;
    };

    var getHogsCards = function() {

        return homebrewMap(notificationsArray.getHogs(),
                           makeCardBasedOnModel);
    };

    var getBugsCards = function() {

        return homebrewMap(notificationsArray.getBugs(),
                           makeCardBasedOnModel);
    };

    var getSystemCards = function() {

        return homebrewMap(notificationsArray.getSystem(),
                           makeCardBasedOnModel);
    };

    var selectCardsSpot = function(selector) {

        return document.querySelector(selector + " .page-content");
    };


    var generatePage = function(selector, nodeArray) {

        var rightSpot = selectCardsSpot(selector);
        var children = rightSpot.childNodes;
        rightSpot.childNodes =
            homebrewConcatChildren(rightSpot,
                                   rightSpot.firstChild,
                                   nodeArray);
    };

    var generateCards = function() {

        generatePage("#home", getHomeCards());
        generatePage("#bugs", getBugsCards());
        generatePage("#hogs", getHogsCards());
        generatePage("#system", getSystemCards());
    };

    return {
        generateCards: generateCards
    };
})(model.notifications, makeElemPanSwipable);

itemCards.generateCards();
