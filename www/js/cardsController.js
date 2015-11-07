itemCards = (function(notificationsArray, gestureCallbacks, cardTemplates) {
    //                  ^dependency callbacks/objects

    //adds a swipe hint background to a card
    //better to add this after doing everything else
    //just in case it messes something up
    var makeSwipeHintBackground = function(cardDom) {

        var backgroundNode = document.createElement("div");
        backgroundNode.classList.add("mdl-card-background");
        //backgroundNode.classList.add("mdl-shadow--2dp");
        backgroundNode.classList.add("mdl-cell");
        backgroundNode.classList.add("mdl-cell--4-col");
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

        var versionContainer = cardDomNode.querySelector("#version");
        var samplesContainer = cardDomNode.querySelector("#samples");
        var moreButton = cardDomNode
                .querySelector(".mdl-card__more");
        var nodeId = "card-" + notificationId + "-textpand";


        if(!secondaryText || (!secondaryText.samples && !secondaryText.version)) {
            trashANode(secondaryTextNode);
            if(moreButton) {
                trashANode(moreButton);
            }
        } else {
            addNodeText(versionContainer, secondaryText.version);
            addNodeText(samplesContainer, secondaryText.samples);
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
                var paragraphNode = document.createElement("div");
                paragraphNode.style.marginBottom = "6px";
                var textNode = document.createTextNode(paragraph);

                paragraphNode.appendChild(textNode);
                console.log(paragraphNode);

                secondaryTextNode.insertBefore(paragraphNode, secondaryTextNode.firstChild);
            }

            secondaryTextNode.id = nodeId;
        }
    };
    
    var injectParagraphSecondaryText = function(cardDomNode,
                                                     secondaryTextParagraph,
                                                     notificationId) {
        var secondaryTextNode = cardDomNode
                .querySelector(".collapse");

        var nodeId = "card-" + notificationId + "-textpand";

        if(!secondaryTextParagraph) {
            trashANode(secondaryTextNode);
            
        } else {
            var paragraphNode = document.createElement("p");
            var textNode = document.createTextNode(secondaryTextParagraph);
            paragraphNode.appendChild(textNode);
            console.log(paragraphNode);

                secondaryTextNode.appendChild(paragraphNode);
            }

            secondaryTextNode.id = nodeId;
        
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
                                                appUninstallCallback,
                                                appName) {

        if(!hasCloseButton && !hasUninstallButton) {
            return;
        }

        var buttonSpot = cardDomNode
                .querySelector(".mdl-card__actions");

        buttonSpot.className = "mdl-card__actions mdl-card--border";

        if(hasCloseButton) {
            var closeButton = document.createElement("span");
            var closeLink = document.createElement("a");
            closeLink.className = "mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect";

            closeLink.innerHTML = "Close app";
            closeButton.appendChild(closeLink);

            console.log(appCloseCallback);

            closeButton.addEventListener("click",  function(ev) {
                var button = ev.target;
				console.log("rivi 262 errori", packageName);
                appCloseCallback(packageName, function(state) {
                    console.log("Killing app: " + state);
                    if(state == "Success"){
                        carat.showToast(appName+ " closed", function(state){
                            trashANode(button);
                        });
                    } else {
                        carat.showToast(appName + " couldn't be closed!", function(state){
                            button.disabled = true;
                        });
                    }
                });
            });

            buttonSpot.appendChild(closeButton);
        }
        if (hasUninstallButton) {
            var uninstallButton = document.createElement("span");
            var uninstallLink = document.createElement("a");
            uninstallLink.className = "mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect";

            uninstallLink.innerHTML = "Uninstall";
            uninstallButton.appendChild(uninstallLink);

            uninstallButton.addEventListener("click", function(ev){
                appUninstallCallback(packageName, function(state) {
                    console.log("Opening app details: " + state);

                    // Setup this when we have dynamic onResume
                    // cardDomNode.style.display = "none";
                });
            });

            buttonSpot.appendChild(uninstallButton);
        }
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
        var circle = statisticsDomNode.querySelector(".outerCircle");
        var degree = jscore*3.6;
        var color;
        if(degree <= 180){
            degree = 90+degree;
            color= "#FBE2B6";
        } else  {
            degree = degree-90;
            color = "#F7A71B";
        }
        circle.style.backgroundImage = "linear-gradient("+degree+"deg, transparent 50%, "+color+" 50%), linear-gradient(90deg, #F7A71B 50%, transparent 50%)";

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
        var expandText = [
                          "Carat id: " + deviceInfo.caratId,
                          "Memory used: " + deviceInfo.memoryUsed,
                          "Memory total: " + deviceInfo.memoryTotal,
                          "Battery duration: " + deviceInfo.batteryLife,
                          "Device model: " + deviceInfo.modelName,
                          "OS version: " + deviceInfo.osVersion,
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
		var expandText = "Carat is a free app that tells you what is using up the battery of your mobile device, whether that's normal, and what you can do about it. After running Carat for about a week, you will start to receive personalized recommendations for improving your battery life. Carat is a research project based out of the AMP Lab in the EECS Department at UC Berkeley, collaborating with the University of Helsinki.";
		injectMultiparagraphSecondaryText(caratDomNode,
										  expandText,
										  caratCardId);
	}

    //constructs summary card from summary model object
    var makeSummaryCard = function(summaryObject,
                                   summaryDomNode) {

//        //summary title
//        injectSummaryTitle(summaryDomNode,
//                           summaryObject.title);

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
                                {
                                    samples: itemData.samples,
                                    version: itemData.version
                                },
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
                                         itemData.appUninstallCallback,
                                         itemData.title);

            if(localStorage.getItem(itemData.id) === 'dismissed') {
                newCardNode.style.display = 'none';
            }
            
        } else if (notificationObject.worstBug) {
            var itemData = notificationObject.worstBug;

            newCardNode = cardTemplates
                .getNewWorstBugHogTemplate();

            gestureCallbacks.panSwipefy(newCardNode);

            injectTitle(newCardNode, itemData.title);
            injectIcon(newCardNode, itemData.icon);
            injectMainText(newCardNode,
                           "Update or Uninstall - Unexpectedly heavy use of energy.");
            injectParagraphSecondaryText(newCardNode,
                           itemData.textfield, itemData.id);
            injectSecondaryText(newCardNode,
                                {
                                    samples: itemData.samples,
                                    version: itemData.version
                                },
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
                                         itemData.appUninstallCallback,
                                         itemData.title);

            if(localStorage.getItem(itemData.id) === 'dismissed') {
                newCardNode.style.display = 'none';
            }
            
        } else if (notificationObject.worstHog) {
            var itemData = notificationObject.worstHog;

            newCardNode = cardTemplates
                .getNewWorstBugHogTemplate();

            gestureCallbacks.panSwipefy(newCardNode);

            injectTitle(newCardNode, itemData.title);
            injectIcon(newCardNode, itemData.icon);
            injectMainText(newCardNode,
                           "Close or Uninstall - Increased use of energy.");
            injectParagraphSecondaryText(newCardNode,
                           itemData.textfield, itemData.id);
            injectSecondaryText(newCardNode,
                                {
                                    samples: itemData.samples,
                                    version: itemData.version
                                },
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
                                         itemData.appUninstallCallback,
                                         itemData.title);

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
    var getHomeCards = function(bugOrHogSource, bugOrHogSelector,
                                appCloseCallback, appUninstallCallback) {
                
        var bugsOrHogs = new Array();
        
        for(i = 0; i < bugOrHogSource.length; i++) {
            bugsOrHogs.push(bugOrHogSource[i]);
        };
        
        var result;
        
        if (bugOrHogSelector == "bug") {        
            result = homebrewMap(notificationsArray
                                  .getWorstBugs(bugsOrHogs,
                                           appCloseCallback,
                                           appUninstallCallback),
                                  makeCardBasedOnModel);
        } else {
            result = homebrewMap(notificationsArray
                                  .getWorstHogs(bugsOrHogs,
                                           appCloseCallback,
                                           appUninstallCallback),
                                  makeCardBasedOnModel);
        }

        for (i=0; i<result.length-1; i++){
            result[i].style.display="none";
        }
        
        
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
        
        var rightSpot;
        if(selector==='#suggestions' || selector==='#summary') {
            rightSpot = document.querySelector(selector);
            homebrewConcatChildren(rightSpot,
                                       rightSpot.firstChild,
                                       nodeArray);
            
        } else {
        rightSpot = selectCardsSpot(selector);
        }
        
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
    var generateCards = function(bugsSource, hogsSource, appCloseCallback, appUninstallCallback) {
        if (typeof hogsSource !== 'undefined' && hogsSource.length>0) {
            generatePage("#suggestions", getHomeCards(hogsSource, "hog", appCloseCallback, appUninstallCallback));
        }
        if (typeof bugsSource !== 'undefined' && bugsSource.length>0) {
            generatePage("#suggestions", getHomeCards(bugsSource, "bug", appCloseCallback, appUninstallCallback));
        }
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
        generatePage("#summary", getSummaryCard(hogsSource, bugsSource));
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
