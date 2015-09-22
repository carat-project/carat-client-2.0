itemCards = (function(notificationsArray, panSwipeCallback) {

    //get template Dom-node for a card
    var getNewCardDomNodeTemplate = function() {

        var htmlString = '<div class="mdl-card mdl-shadow--2dp"><div class="carat-card__title"><div class="mdl-card__title-text"></div><div class="mdl-layout-spacer"></div><span class="carat-card-time"></span></div><div class="mdl-card__supporting-text"><div class="collapse"></div></div><div class="mdl-card__actions"><a class="mdl-card__more" role="button" data-toggle="collapse" aria-expanded="false" aria-controls="collapseExample">More</a></div></div>';

        var dummyDiv = document.createElement("div");
        dummyDiv.innerHTML = htmlString;

        var result = dummyDiv.firstChild;
        panSwipeCallback(result);

        return result;
    }

    var trashANode = function(nodeToBeTrashed) {

        var parent = nodeToBeTrashed.parentNode;
        parent.removeChild(nodeToBeTrashed);
    }

    var addNodeText = function(nodeToBeTextified, text) {

        var textNode = document.createTextNode(text);
        nodeToBeTextified
            .insertBefore(textNode,
                          nodeToBeTextified.firstChild);
    }

    var appendTextOrRemoveNode = function(nodeMaybeTextified,
                                          text) {
        if(!text) {
            trashANode(nodeMaybeTextified);
        } else {
            addNodeText(nodeMaybeTextified, text);
        }
    }

    var injectTitle = function(cardDomNode, title) {

        var titleNode = cardDomNode
            .querySelector(".mdl-card__title-text");

        appendTextOrRemoveNode(titleNode, title);
    }

    var injectMainText = function(cardDomNode, mainText) {

        var mainTextNode = cardDomNode
            .querySelector(".mdl-card__supporting-text");

        appendTextOrRemoveNode(mainTextNode, mainText);
    }

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
    }

    var injectClasses = function(cardDomNode, classes) {

        var nodeClassList = cardDomNode.classList;

        for(var i = 0; i < classes.length; i++) {
            nodeClassList.add(classes[i]);
        }
    }

    var injectTimeDrain = function(cardDomNode, timeDrain) {

        var timeDrainNode = cardDomNode
            .querySelector(".carat-card-time");

        if(!timeDrain) {
            trashANode(timeDrainNode);
        } else {
            var timeDrainText = "-" + timeDrain + "min";
            addNodeText(timeDrainNode, timeDrainText);
        }
    }

    var makeCardBasedOnModel = function(notificationObject) {

        var newCardNode = getNewCardDomNodeTemplate();

        injectTitle(newCardNode, notificationObject.title);
        injectMainText(newCardNode,
                       notificationObject.mainText);
        injectSecondaryText(newCardNode,
                            notificationObject.secondaryText,
                            notificationObject.id);
        injectClasses(newCardNode,
                      notificationObject.classes);
        injectTimeDrain(newCardNode,
                        notificationObject.timeDrain);

        return newCardNode;
    }


    var homebrewMap = function(array, callback) {
        for(var i = 0; i < array.length; i++) {
            array[i] = callback(array[i]);
        }

        return array;
    }

    var getHomeCards = function() {

        var result = homebrewMap(notificationsArray.getGeneral(),
                           makeCardBasedOnModel);
        return result;
    }

    var getHogsCards = function() {

        return homebrewMap(notificationsArray.getHogs(),
                           makeCardBasedOnModel);
    }

    var getBugsCards = function() {

        return homebrewMap(notificationsArray.getBugs(),
                           makeCardBasedOnModel);
    }

    var getSystemCards = function() {

        return homebrewMap(notificationsArray.getSystem(),
                           makeCardBasedOnModel);
    }

    var selectCardsSpot = function(selector) {

        return document.querySelector(selector + " .page-content");
    }

    var homebrewConcatChildren = function(spot,
                                          firstChild,
                                          concatees) {

        for(var i = 0; i < concatees.length; i++) {
            spot.insertBefore(concatees[i], firstChild);
        }

    }

    var generatePage = function(selector, nodeArray) {

        var rightSpot = selectCardsSpot(selector);
        var children = rightSpot.childNodes;
        rightSpot.childNodes =
            homebrewConcatChildren(rightSpot,
                                   rightSpot.firstChild,
                                   nodeArray);
    }

    var generateCards = function() {

        generatePage("#home", getHomeCards());
        generatePage("#bugs", getBugsCards());
        generatePage("#hogs", getHogsCards());
        generatePage("#system", getSystemCards());
    }

    return {
        generateCards: generateCards
    }
})(model.notifications, makeElemPanSwipable);

itemCards.generateCards();
