itemCards = (function(notificationsArray, gestureCallbacks, cardTemplates) {
    //                  ^dependency callbacks/objects

    //adds a swipe hint background to a card
    //better to add this after doing everything else
    //just in case it messes something up
    var makeSwipeHintBackground = function(cardDom) {

        var backgroundNode = document.createElement("div");
        backgroundNode.classList.add("mdl-card-background");
        backgroundNode.classList.add("mdl-shadow--2dp");
        backgroundNode.appendChild(cardDom);

        return backgroundNode;
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

        var iconNode = cardDomNode
                .querySelector(".mdl-card__icon");

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
    
    var injectJScoreText = function(cardDomNode, mainText) {

        if(!mainText) {
            return;
        }

        var mainTextNode = cardDomNode
                .querySelector(".carat-Jscore-text");

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
            if(moreButton) {
                trashANode(moreButton);
            }
        } else {
            addNodeText(secondaryTextNode, secondaryText);
            secondaryTextNode.id = nodeId;
            //            moreButton.href = "#" + nodeId;
        }
    };

    var injectMultiparagraphSecondaryText = function(cardDomNode,
                                                     secondaryTextParagraphs,
                                                     notificationId) {
        var secondaryTextNode = cardDomNode
                .querySelector(".collapse");
        var moreButton = cardDomNode
                .querySelector(".mdl-card__more");
        var nodeId = "card-" + notificationId + "-textpand";

        if(!secondaryTextParagraphs) {
            trashANode(secondaryTextNode);
            if(moreButton) {
                trashANode(moreButton);
            }
        } else {
            for(var paragraphKey in secondaryTextParagraphs) {
                var paragraph = secondaryTextParagraphs[paragraphKey];
                var paragraphNode = document.createElement("p");
                var textNode = document.createTextNode(paragraph);

                paragraphNode.appendChild(textNode);
                console.log(paragraphNode);

                secondaryTextNode.appendChild(paragraphNode);
            }

            secondaryTextNode.id = nodeId;
        }
    };

    //inject css style classes to card
    var injectClasses = function(cardDomNode, classes) {

        var nodeClassList = cardDomNode.classList;

        for(var i = 0; i < classes.length; i++) {
            nodeClassList.add(classes[i]);
        }
    };

	  //adds a click event listener for element
    //that directs user to right card using id
    var linkifySummaryEntry = function(element, nameTag, type) {

        var tab;

        if(type === "BUG") {
            tab = "bugs-tab";
        } else if(type === "HOG") {
            tab = "hogs-tab";
        } else {
            return;
        }

        var elemId = notificationsArray.makeIdFromAppName(nameTag, type);

        element.addEventListener("click", function() {
            document.getElementById(tab).click();
            window.location.hash = elemId;
        });
    };

    //will add either close button or uninstall button,
    //depending on whether the flags are set
    var injectCloseOrUninstallButton = function(cardDomNode,
                                                hasCloseButton,
                                                hasUninstallButton,
                                                packageName,
                                                appCloseCallback,
                                                appUninstallCallback) {

        if(!hasCloseButton && !hasUninstallButton) {
            return;
        }

        var buttonSpot = cardDomNode
                .querySelector(".mdl-card__actions");

        var button = document.createElement("button");

        button.className ="mdl-button mdl-js-button mdl-button--raised";

        var buttonText;

        if(hasCloseButton) {
            buttonText = document.createTextNode("Close");
            button.appendChild(buttonText);

            console.log(appCloseCallback);

            button.addEventListener("click",  function(ev) {
                appCloseCallback(packageName, function(state) {
                    console.log("Killing app: " + state);
                    cardDomNode.style.display = "none";
                });
            });
        } else {
            buttonText = document.createTextNode("Uninstall");
            button.appendChild(buttonText);

            button.addEventListener("click", function(ev){
                appUninstallCallback(packageName, function(state) {
                    console.log("Opening app details: " + state);

                    // Setup this when we have dynamic onResume
                    // cardDomNode.style.display = "none";
                });
            });
        }

        changePaddingForButton(buttonSpot);
        buttonSpot.appendChild(button);

    };
    
    var changePaddingForButton = function(cardDomNode) {
      cardDomNode.style.padding = "0px 10px 10px";  
    };

    //style the time drain or benefit text accordingly,
    //based on whether it was given as an integer or string
    var makeTimeDrainText = function(timeDrainNode,
                                     timeDrain,
                                     timeDrainError) {
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

        if(timeDrainError) {
            var timeErrorElem = document.createElement("span");
            var timeErrorText = document
                    .createTextNode(timeDrainError);
            timeErrorElem.appendChild(timeErrorText);
            timeErrorElem.classList.add("show-on-expand");

            timeDrainNode.appendChild(timeErrorElem);
        }

        return timeDrainNode;
    };

    //inject time drain or benefit text to a node, styling
    //it correctly
    var injectTimeDrain = function(cardDomNode, timeDrain,
                                   timeDrainError) {

        var timeDrainNode = cardDomNode
                .querySelector(".carat-card-time");

        makeTimeDrainText(timeDrainNode, timeDrain,
                          timeDrainError);

    };

    //name of summary item
    var injectSummaryEntryName = function(summaryEntryDomNode,
                                          name) {
        var nameNode = summaryEntryDomNode
                .querySelector(".carat_summaryCard_app_name");

        appendTextOrRemoveNode(nameNode, name);
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

    var injectSummaryBugHogCount = function(summaryDomNode,
                                            count, bugOrHog) {

        var bug = "bugTitleAndCount";
        var hog = "hogTitleAndCount";
        var countNode;

        if (bugOrHog=="bug"){
            countNode = summaryDomNode
                .querySelector("#" + bug);
        } else {
            countNode = summaryDomNode
                .querySelector("#" + hog);
        }

        appendTextOrRemoveNode(countNode, count + " " + bugOrHog+"s");
    };

    var injectJscore = function(statisticsDomNode,
                                jscore) {
        var spot = statisticsDomNode.querySelector(".numberCircle");

        appendTextOrRemoveNode(spot, jscore);
    };

	var injectChart = function(caratDomnode,
							   chart) {
		var spot = caratDomNode.querySelector(".chart");
		
		appendTextOrRemoveNode(spot, chart);
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

        for(var i = concatees.length -1; i >= 0; i--) {
            spot.insertBefore(concatees[i], firstChild);
        }
    };

    //like homebrewConcatChildren with maximium number of concatees
    var homebrewConcatChildrenWithMaxNumber = function(spot,
                                                       firstChild,
                                                       concatees, maxNumber) {

        var limit = concatees.length <= maxNumber ?
                concatees.length - 1 : concatees.length - maxNumber;
        for(var i = concatees.length - 1; i >= limit; i--) {
            spot.insertBefore(concatees[i], firstChild);
        }
    };

    //creates summary entry dom node from summary entry model object
    var makeSummaryEntry = function(summaryEntryObject) {

        var domNode = cardTemplates.getNewSummaryEntryDomNodeTemplate();
        var entryFields = summaryEntryObject.summaryEntry;

        injectSummaryEntryName(domNode, entryFields.name);
        injectIcon(domNode, entryFields.icon);

        //        injectSummaryEntryIcon(domNode, entryFields.icon);
        injectSummaryEntryTimeDrain(domNode,
                                    entryFields.timeDrain);
        linkifySummaryEntry(domNode, entryFields.nameTag, entryFields.type);

        return domNode;
    };

    var makeStatisticsCard = function(statisticsObject,
                                      deviceInfo,
                                      statisticsDomNode) {
        var statisticsCardId = "statistics-jscore";
        console.log(deviceInfo.osVersion);

        injectTitle(statisticsDomNode, "My Device");
        injectJScoreText(statisticsDomNode,
                                          "Your device is more energy efficient than " + statisticsObject.jscore +
                            "% of other devices measured by Carat.");
        injectJscore(statisticsDomNode, statisticsObject.jscore);
        injectIdToCard(statisticsDomNode, statisticsCardId);
        var expandText = ["Battery duration: ",
                          "Memory used: " + deviceInfo.memoryUsed,
                          "Memory total: " + deviceInfo.memoryTotal,
                          "Cpu usage: -",
                          "OS version: " + deviceInfo.osVersion,
                          "Device model: " + deviceInfo.modelName,
                          "Carat id: " + deviceInfo.caratId,
                         ];
        injectMultiparagraphSecondaryText(statisticsDomNode,
                                          expandText,
                                          statisticsCardId);
    };

	var makeCaratCard = function(caratDomNode,
								 caratObject) {
		var caratCardId = "carat-chart";	
		
		injectTitle(caratDomNode, "Carat");
		injectChart(caratDomNode, caratObject.chart);
		injectIdToCard(caratDomNode, caratCardId);
		var expandText = "Carat is research project...";
		injectMultiparagraphSecondaryText(caratDomNode,
										  expandText,
										  caratCardId);
	}

    //constructs summary card from summary model object
    var makeSummaryCard = function(summaryObject,
                                   summaryDomNode) {

        //summary title
        injectSummaryTitle(summaryDomNode,
                           summaryObject.title);

        // all bugEntries
        var summaryEntryBugNodes = homebrewMap(
            summaryObject.bugEntries, makeSummaryEntry);

        //Bug group title and amount of bugs
        injectSummaryBugHogCount(summaryDomNode, summaryEntryBugNodes.length, "bug");

        //adds bugs to grid
        if(summaryEntryBugNodes.length != 0) {
            var bugSpot = summaryDomNode
                    .querySelector("#bugsGrid");
            homebrewConcatChildren(bugSpot, bugSpot.firstChild,
                                                summaryEntryBugNodes);
        }

        var summaryEntryHogNodes = homebrewMap(
            summaryObject.hogEntries, makeSummaryEntry);

        //Hog group title and amount of hogs
        injectSummaryBugHogCount(summaryDomNode, summaryEntryHogNodes.length, "hog");
        //adds hogs to grid
        if(summaryEntryHogNodes.length != 0) {
            var hogSpot = summaryDomNode
                    .querySelector("#hogsGrid");
            homebrewConcatChildren(hogSpot, hogSpot.firstChild,
                                                summaryEntryHogNodes);
        }
    };

    //make either an item card (hog or bug) or summary card
    //from a model object that represents either one
    var makeCardBasedOnModel = function(notificationObject) {

        var newCardNode;

        if(notificationObject.item) {

            var itemData = notificationObject.item;

            newCardNode = cardTemplates
                .getNewItemDomNodeTemplate();

            gestureCallbacks.panSwipefy(newCardNode);

            injectTitle(newCardNode, itemData.title);
            injectIcon(newCardNode, itemData.icon);
            injectMainText(newCardNode,
                           itemData.textfield);
            injectSecondaryText(newCardNode,
                                itemData.samples,
                                itemData.id);
            injectClasses(newCardNode,
                          itemData.classes);
            injectTimeDrain(newCardNode,
                            itemData.timeDrain,
                            itemData.timeDrainErrorString);
            injectIdToCard(newCardNode, itemData.id);
            injectCloseOrUninstallButton(newCardNode,
                                         itemData.buttons.killButton,
                                         itemData.buttons.removeButton,
                                         itemData.packageName,
                                         itemData.appCloseCallback,
                                         itemData.appUninstallCallback);

            if(localStorage.getItem(itemData.id) === 'dismissed') {
                newCardNode.style.display = 'none';
            }

        } else if(notificationObject.summary) {

            newCardNode = cardTemplates
                .getNewSummaryDomNodeTemplate();

            var summaryData = notificationObject.summary;
            makeSummaryCard(summaryData, newCardNode);
            injectIdToCard(newCardNode, summaryData.id);
        
        } else if(notificationObject.statistics) {

            newCardNode = cardTemplates
                .getNewStatisticsDomNodeTemplate();

            gestureCallbacks
                .onlyTapify(newCardNode);

            var statisticsData = notificationObject.statistics;
            console.log(statisticsData);

            makeStatisticsCard(statisticsData,
                               notificationObject.deviceInfo, newCardNode);
        } else if(notificationObject.carat) {
			
			newCardNode = cardTemplates
				.getNewCaratDomNodeTemplate();
				
			var caratData = notificationObject.carat;
			makeCaratCard(newCardNode, caratData);	
		}

        return newCardNode;
    };


    //fetch correct models for the home tab and create corresponding cards
    //for them
    var getHomeCards = function(bugsSource,
                                appCloseCallback, appUninstallCallback) {
        
        var bugs = new Array();
        
        for(i = bugsSource.length - 2; i <= bugsSource.length; i++) {
            bugs.push(bugsSource[i-1]);
        };
        
        var result =  homebrewMap(notificationsArray
                                  .getWorstBugs(bugs,
                                           appCloseCallback,
                                           appUninstallCallback),
                                  makeCardBasedOnModel);
        
        console.log(result);
        return result;
    };

    //pass hogs source(data from server) to
    //model and get get a cleaned-up model object
    //to create cards from
    var getHogsCards = function(hogsSource,
                                appCloseCallback, appUninstallCallback) {

        return homebrewMap(notificationsArray
                           .getHogs(hogsSource,
                                    appCloseCallback, appUninstallCallback),
                           makeCardBasedOnModel);
    };

    //pass bugs source(data from server) to
    //model and get a cleaned-up model object
    //to create cards from
    var getBugsCards = function(bugsSource,
                                appCloseCallback, appUninstallCallback) {

        var result =  homebrewMap(notificationsArray
                                  .getBugs(bugsSource,
                                           appCloseCallback,
                                           appUninstallCallback),
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

    var getStatisticsCard = function(mainDataSource, deviceInfo) {

        var statisticsObject = notificationsArray
                .getStatistics(mainDataSource);
        statisticsObject.deviceInfo = deviceInfo;

        return makeCardBasedOnModel(statisticsObject);
    };
	
	var getCaradCard = function(statisticsDataSource) {
	
		var caratObject = notificationsArray.getCarat(statisticsDataSource);
		
		return makeCardBasedOnModel(caratObject);
	}

    //select the correct spot to enter the cards in each tab
    var selectCardsSpot = function(selector) {

        return document.querySelector(selector + " .page-content");
    };


    //generate cards for each tab (tab id passed in "selector", cards
    //in "nodeArray")
    var generatePage = function(selector, nodeArray) {

        console.log("generatePage");
        var rightSpot = selectCardsSpot(selector);

        var children = rightSpot.childNodes;

        if(selector === "#bugs" || selector === "#hogs") {
            var withSwipeBackgrounds = nodeArray
                    .map(makeSwipeHintBackground);
            rightSpot.childNodes =
                homebrewConcatChildren(rightSpot,
                                       rightSpot.firstChild,
                                       withSwipeBackgrounds);    
       
        } else {
            rightSpot.childNodes =
                homebrewConcatChildren(rightSpot,
                                       rightSpot.firstChild,
                                       nodeArray);
        }
    };

    //generate home and system tab cards
    var generateCards = function(bugsSource, appCloseCallback, appUninstallCallback) {
        generatePage("#home", getHomeCards(bugsSource, appCloseCallback, appUninstallCallback));
        generatePage("#system", getSystemCards());
    };

    //receive bugs server data; create and add corresponding cards
    var generateBugs = function(bugsSource, appCloseCallback, appUninstallCallback) {
        generatePage("#bugs", getBugsCards(bugsSource, appCloseCallback, appUninstallCallback));
    };

    //receive hogs server data; create and add corresponding cards
    var generateHogs = function(hogsSource, appCloseCallback, appUninstallCallback) {
        generatePage("#hogs", getHogsCards(hogsSource, appCloseCallback, appUninstallCallback));
    };

    //make summary card (and for the time being other cards in home tab)
    //based on server data
    var generateSummary = function(hogsSource, bugsSource) {
        generatePage("#home", getSummaryCard(hogsSource, bugsSource));
        //calls summaryCard.js and opens summary entries grid
        showOrHideActions();
    };

    var generateStatistics = function(mainDataSource, deviceInfo) {
        generatePage("#system", [getStatisticsCard(mainDataSource,
                                                 deviceInfo)]);
    };

    //public methods of the module
    return {
        generateCards: generateCards,
        generateBugs: generateBugs,
        generateHogs: generateHogs,
        generateSummary: generateSummary,
        generateStatistics: generateStatistics
    };
})(model.notifications, {panSwipefy: makeElemPanSwipable,
                         onlyTapify: makeElemTappable},
   cardTemplates); //dependencies

itemCards.generateCards(); //bugs and hogs are generated elsewhere
