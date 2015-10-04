itemCards = (function(notificationsArray, panSwipeCallback) {
    //                  ^dependency callbacks/objects

    var parseDomNode = function(htmlString) {

        var dummyDiv = document.createElement("div");
        dummyDiv.innerHTML = htmlString;

        var result = dummyDiv.firstChild;

        return result;
    };
    //get template Dom-node for a card
    var getNewItemDomNodeTemplate = function() {

        var htmlString = '<div class="mdl-card mdl-shadow--2dp"><div class="carat-card__title"><div class="mdl-card__icon"></div><div class="mdl-card__title-text"></div><div class="mdl-layout-spacer"></div><span class="carat-card-time"></span></div><div class="mdl-card__supporting-text"><div class="collapse"></div></div><div class="mdl-card__actions"><a class="mdl-card__more" role="button" data-toggle="collapse" aria-expanded="false" aria-controls="collapseExample">More</a></div></div>';

        var domNode = parseDomNode(htmlString);

        panSwipeCallback(domNode);

        return domNode;
    };

    //summary card item template
    var getNewSummaryEntryDomNodeTemplate = function() {
        var htmlString ='<div class="mdl-cell mdl-cell--2-col mdl-cell--1-col-phone"><div class="carat_summaryCard_app_icon"><i class="material-icons"></i></div><div class="carat_summaryCard_app_name"></div><div class="carat_summaryCard_app_time"></div></div>';

        var domNode = parseDomNode(htmlString);

        return domNode;
    };

    //summary card template, still partly static
    var getNewSummaryDomNodeTemplate = function() {
        var htmlString ='<div class="mdl-card mdl-shadow--2dp"><div class="carat-card__title" id="summary"><div class="mdl-card__title-text"></div></div><div class="mdl-card__supporting-text"><div class="carat_summaryCard_group_title">4 Bugs<span class="carat_summaryCard_group_title_summary_time">-1h 54min</span></div><div class="carat_summaryCard_group_title">7 Hogs<span class="carat_summaryCard_group_title_summary_time">-1h 54min</span></div><div class="carat_summaryCard_group_title">3 System notifications<span class="carat_summaryCard_group_title_summary_time">-1h 54min</span></div><div id="summaryGrid" class="carat_hide"><div class="mdl-grid carat_summary_grid"></div></div></div><div class="mdl-card__actions"><a class="mdl-card__more" id="summary-button" role="button" onclick="showOrHideActions()" href="#">More</a></div></div>';

            
//left the old template html if we decide to go backwards  
        
//            '<div class="mdl-card mdl-shadow--2dp"><div class="carat_summaryCard_title"><div class="carat_summaryCard_title_text mdl-card__title-text"><i class="material-icons carat_material-icons_arrow">&#xE5CE</i></div><div class="mdl-layout-spacer"></div></div><div class="mdl-card__supporting-text"><div class="mdl-grid"></div></div></div>';
        


        
        var domNode = parseDomNode(htmlString);

        return domNode;
    };

    //remove a node from dom
    var trashANode = function(nodeToBeTrashed) {

        var parent = nodeToBeTrashed.parentNode;
        parent.removeChild(nodeToBeTrashed);
    };

    //add a text node with text as content as a child of a node
    var addNodeText = function(nodeToBeTextified, text) {

        var textNode = document.createTextNode(text);
        nodeToBeTextified
            .insertBefore(textNode,
                          nodeToBeTextified.firstChild);
    };

    // create an image node, give it the base64 data and append
    var addNodeImage = function(nodeToBeTextified, image) {
        var img = document.createElement("img");
        img.src = image;
        nodeToBeTextified.appendChild(img);
    };

    //if text exists, add a text node as child, otherwise remove node
    var appendTextOrRemoveNode = function(nodeMaybeTextified,
                                          text) {
        if(!text) {
            trashANode(nodeMaybeTextified);
        } else {
            addNodeText(nodeMaybeTextified, text);
        }
    };

    // append image to a node if image exists
    var appendImageOrRemoveNode = function(nodeMaybeTextified,
                                          image) {
        if(!image) {
            trashANode(nodeMaybeTextified);
        } else {
            addNodeImage(nodeMaybeTextified, image);
        }
    };

    //add id to the right place in a card
    var injectIdToCard = function(cardDomNode, id) {

        cardDomNode.id = id;
    };

    //add title to the right place in a card
    var injectTitle = function(cardDomNode, title) {

        if(!title) {
            return;
        }

        var titleNode = cardDomNode
            .querySelector(".mdl-card__title-text");

        appendTextOrRemoveNode(titleNode, title);
    };

    // find card node for icon and append to it
    var injectIcon = function(cardDomNode, icon){

        if(!icon){
            return;
        }
        var iconNode = cardDomNode
            .querySelector(".mdl-card__icon");

        console.log("Icon node is "+iconNode);
        appendImageOrRemoveNode(iconNode, icon);
    };

    //add main text (the one that is always visible) to a card
    var injectMainText = function(cardDomNode, mainText) {

        if(!mainText) {
            return;
        }

        var mainTextNode = cardDomNode
            .querySelector(".mdl-card__supporting-text");

        appendTextOrRemoveNode(mainTextNode, mainText);
    };

    //add additional text to a card, id is required for
    //the expand to work
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

    //inject css style classes to card
    var injectClasses = function(cardDomNode, classes) {

        var nodeClassList = cardDomNode.classList;

        for(var i = 0; i < classes.length; i++) {
            nodeClassList.add(classes[i]);
        }
    };

    //style the time drain or benefit text accordingly,
    //based on whether it was given as an integer or string
    var makeTimeDrainText = function(timeDrainNode,
                                     timeDrain) {
        var timeDrainText;

        if(!timeDrain) {
            trashANode(timeDrainNode);

            return timeDrainNode;
        } else if(typeof timeDrain === "number"){
            timeDrainText = "-" + timeDrain + "min";
        } else {
            timeDrainText = timeDrain;
        }

        addNodeText(timeDrainNode, timeDrainText);

        return timeDrainNode;
    };

    //inject time drain or benefit text to a node, styling
    //it correctly
    var injectTimeDrain = function(cardDomNode, timeDrain) {

        var timeDrainNode = cardDomNode
            .querySelector(".carat-card-time");

        makeTimeDrainText(timeDrainNode, timeDrain);

    };
    
    //name of summary item
    var injectSummaryEntryName = function(summaryEntryDomNode,
                                          name) {
        var nameNode = summaryEntryDomNode
            .querySelector(".carat_summaryCard_app_name");

        appendTextOrRemoveNode(nameNode, name);
    };

    //add summary item icon (for example, facebook icon)
    var injectSummaryEntryIcon = function(summaryEntryDomNode,
                                          icon) {
        var iconNode = summaryEntryDomNode
            .querySelector("i.material-icons");

        appendTextOrRemoveNode(iconNode, icon);
    };

    //time drain or benefit of the item in question
    var injectSummaryEntryTimeDrain = function(
        summaryEntryDomNode, timeDrain) {

        var timeDrainNode = summaryEntryDomNode
            .querySelector(".carat_summaryCard_app_time");

        makeTimeDrainText(timeDrainNode, timeDrain);
    };

    //summary card title
    var injectSummaryTitle = function(summaryDomNode,
                                      title) {

        var titleNode = summaryDomNode
            .querySelector("div.mdl-card__title-text");

        appendTextOrRemoveNode(titleNode, title);
    };

    //implementation of the map function, because for
    //some reason the normal JS array map didn't work
    var homebrewMap = function(array, callback) {
        for(var i = 0; i < array.length; i++) {
            array[i] = callback(array[i]);
        }

        return array;
    };

    //insert concatees (array with some number of nodes)
    //as children of 'spot' element, inserting them before first child
    var homebrewConcatChildren = function(spot,
                                          firstChild,
                                          concatees) {

        for(var i = 0; i < concatees.length; i++) {
            spot.insertBefore(concatees[i], firstChild);
        }
    };

    //creates summary entry dom node from summary entry model object
    var makeSummaryEntry = function(summaryEntryObject) {

        var domNode = getNewSummaryEntryDomNodeTemplate();
        var entryFields = summaryEntryObject.summaryEntry;

        injectSummaryEntryName(domNode, entryFields.name);
        injectSummaryEntryIcon(domNode, entryFields.icon);
        injectSummaryEntryTimeDrain(domNode,
                                    entryFields.timeDrain);

        return domNode;
    };

    //contructs summary card from summary model object
    var makeSummaryCard = function(summaryObject,
                                   summaryDomNode) {

        injectSummaryTitle(summaryDomNode,
                           summaryObject.title);

        var summaryEntryNodes = homebrewMap(
            summaryObject.bugEntries.concat(summaryObject.hogEntries), makeSummaryEntry);
        var spot = summaryDomNode
            .querySelector("div.mdl-grid");
        homebrewConcatChildren(spot, spot.firstChild,
                               summaryEntryNodes);
    };

    //make either an item card (hog or bug) or summary card
    //from a model object that represents either one
    var makeCardBasedOnModel = function(notificationObject) {

        var newCardNode;

        if(notificationObject.item) {

            var itemData = notificationObject.item;

            newCardNode = getNewItemDomNodeTemplate();

            injectTitle(newCardNode, itemData.title);
            injectIcon(newCardNode, itemData.icon);
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
            console.log("NEWCARD: " + summaryData);
            makeSummaryCard(summaryData, newCardNode);
            injectIdToCard(newCardNode, summaryData.id);
        }


        return newCardNode;
    };


    //fetch correct models for the home tab and create corresponding cards
    //for them
    var getHomeCards = function() {

        var result = homebrewMap(notificationsArray.getGeneral(),
                                 makeCardBasedOnModel);
        return result;
    };

    //pass hogs source(data from server) to
    //model and get get a cleaned-up model object
    //to create cards from
    var getHogsCards = function(hogsSource) {

        return homebrewMap(notificationsArray.getHogs(hogsSource),
                           makeCardBasedOnModel);
    };

    //pass bugs source(data from server) to
    //model and get a cleaned-up model object
    //to create cards from
    var getBugsCards = function(bugsSource) {

        var result =  homebrewMap(notificationsArray.getBugs(bugsSource),
                           makeCardBasedOnModel);

        return result;
    };

    //fetch a model object for the system tab cards
    //and create corresponding cards for the tab
    var getSystemCards = function() {

        return homebrewMap(notificationsArray.getSystem(),
                           makeCardBasedOnModel);
    };

    var getSummaryCard = function(hogsSource, bugsSource) {

        var summaryObject = notificationsArray.getSummary(hogsSource,
                                                          bugsSource);
        return homebrewMap(summaryObject,
                           makeCardBasedOnModel);
    };

    //select the correct spot to enter the cards in each tab
    var selectCardsSpot = function(selector) {

        return document.querySelector(selector + " .page-content");
    };


    //generate cards for each tab (tab id passed in "selector", cards
    //in "nodeArray")
    var generatePage = function(selector, nodeArray) {

        var rightSpot = selectCardsSpot(selector);
        var children = rightSpot.childNodes;
        rightSpot.childNodes =
            homebrewConcatChildren(rightSpot,
                                   rightSpot.firstChild,
                                   nodeArray);
    };

    //generate home and system tab cards
    var generateCards = function() {

        generatePage("#home", getHomeCards());
        generatePage("#system", getSystemCards());
    };

    //receive bugs server data; create and add corresponding cards
    var generateBugs = function(bugsSource) {
        generatePage("#bugs", getBugsCards(bugsSource));
    };

    //receive hogs server data; create and add corresponding cards
    var generateHogs = function(hogsSource) {
        generatePage("#hogs", getHogsCards(hogsSource));
    };

    //make summary card (and for the time being other cards in home tab)
    //based on server data
    var generateSummary = function(hogsSource, bugsSource) {
        generatePage("#home", getSummaryCard(hogsSource, bugsSource));
    };

    //public methods of the module
    return {
        generateCards: generateCards,
        generateBugs: generateBugs,
        generateHogs: generateHogs,
        generateSummary: generateSummary
    };
})(model.notifications, makeElemPanSwipable); //dependencies

itemCards.generateCards(); //bugs and hogs are generated elsewhere
