cardTemplates = (function() {

    var parseDomNode = function(htmlString) {

        var dummyDiv = document.createElement("div");
        dummyDiv.innerHTML = htmlString;

        var result = dummyDiv.firstChild;

        return result;
    };

    //get template Dom-node for a card
    var getNewItemDomNodeTemplate = function() {

        var htmlString = '<div class="mdl-card mdl-shadow--2dp">' +
                            '<div class="carat-card__title">' +
                                '<div class="mdl-card__icon"></div>' +
                                '<div class="mdl-card__title-text">' +
                                    '<div class="expand">' +
                                        '<i class="material-icons">&#xE5CF;</i>'+
                                    '</div>'+
                                '</div>' +
                                '<div class="carat-card-time"></div>'+
                            '</div>' +
                            '<div class="mdl-card__supporting-text">' +
                                '<div class="collapse">'+
                                    '<div id="version"></div>' +
                                    '<div id="samples"></div>' +
                                '</div>'+
                            '</div>'+
                            '<div class="mdl-card__actions carat_card_actions"></div>'+
                        '</div>';

        var domNode = parseDomNode(htmlString);


        return domNode;
    };
    
        //get template Dom-node for a card
    var getNewWorstBugHogTemplate = function() {

        var htmlString = '<div class="mdl-card mdl-shadow--2dp">' +
                '<div class="carat-card__title">' +
                '<div class="mdl-card__icon"></div>' +
                '<div class="mdl-card__title-text">' +
                '<div class="expand">' +
                '<i class="material-icons">&#xE5CF;</i></div></div>' +
                '<div class="carat-card-time"></div></div>' +
                '<div class="mdl-card__supporting-text">' +
                '<div class="collapse">' +
                '<div id="version"></div>' +
                '<div id="samples"></div>' +
                '</div></div><div class="mdl-card__actions carat_card_actions"></div></div>';

        var domNode = parseDomNode(htmlString);


        return domNode;
    };

    //summary card item template
    var getNewSummaryEntryDomNodeTemplate = function() {
        var htmlString ='<div class="mdl-cell mdl-cell--2-col mdl-cell--1-col-phone carat_summary_item">' +
                '<div class="carat_summaryCard_app_icon">' +
                '<div class="mdl-card__icon"></div>' +
                '<i class="material-icons"></i></div>' +
                '<div class="carat_summaryCard_app_name"></div>' +
                '<div class="carat_summaryCard_app_time"></div></div>';

        var domNode = parseDomNode(htmlString);

        return domNode;
    };

    //summary card template
    var getNewSummaryDomNodeTemplate = function() {
        var htmlString ='<div class="mdl-card mdl-shadow--2dp">' +
//                '<div class="carat-card__title" id="summary">' +
//                '<div class="mdl-card__title-text carat_summaryCard_title_text">' +
//                '<div class="expand"><i class="material-icons">&#xE5CE;</i></div></div></div>' +
                '<div class="mdl-card__supporting-text carat-card__supporting-text">' +
                '<div class="carat_summaryCard_group_title" id ="bugTitleAndCount"></div>' +
                '<div id="bugSummaryGrid" class="carat_hide">' +
                '<div class="carat_summary_grid" id="bugsGrid"></div></div>' +
                '<div class="carat_summaryCard_group_title" id ="hogTitleAndCount"></div>' +
                '<div id="hogSummaryGrid" class="carat_hide">' +
                '<div class="carat_summary_grid" id="hogsGrid"></div></div>' +
                '<div class="carat_summaryCard_group_title">0 System notifications</div></div>' +
                '<div class="mdl-card__actions carat-card__actions">' +
                '<a class="mdl-card__more" id="summary-button" role="button" onclick="showOrHideActions()" href="#">More</a></div></div>';

        var domNode = parseDomNode(htmlString);

        return domNode;
    };

    var progressBar = function(barId, initialText) {
        return '<div id="'+barId+'" class="progressBar">'+
                    '<span>'+initialText+'</span>'+
                    '<div></div>'
                '</div>'
    }


    var getNewStatisticsDomNodeTemplate = function() {

        var htmlString = '<div class="mdl-card mdl-shadow--2dp">' +
                            '<div class="carat-card__title">' +
                                '<div class="mdl-card__title-text carat_summaryCard_title_text">' +
                                    '<div class="expand">' +
                                        '<i class="material-icons">&#xE5CF;</i>'+
                                    '</div>'+
                                '</div>' +
                            '</div>' +
                            '<div class="mdl-card__supporting-text">' +
                                '<div class="carat-Jscore-text"></div>'+
                                '<div class="circleContainer">'+
                                    '<div class="outerCircle">'+
                                        '<div class="innerCircle">'+
                                            '<div class="numberCircle">'+
                                                '<button class="info" onclick="JscoreInfo()"></button>'+
                                            '</div>'+
                                        '</div>'+
                                    '</div>'+
                                '</div>'+
                                '<div class="collapse">'+
                                    '<div style="display: inline-block">CPU usage: '+progressBar("cpuProgressBar", "Calculating..")+'</div>'+
                                '</div>' +
                            '</div>' +
                        '</div>';

        var domNode = parseDomNode(htmlString);

        return domNode;
    };

	// carat card template
	var getNewCaratDomNodeTemplate = function() {

		var htmlString = '<div class="mdl-card mdl-shadow--2dp">' +
                			'<div class="carat-caratCard__title">' +
                				'<div class="mdl-card__title-text carat_caratCard_title_text">' +
                					'<div class="expand">' +
                					'<button class="mdl-button mdl-js-button mdl-button--icon">' +
                						'<i class="material-icons">&#xE5CF;</i>' +
                					'</button>' +
                       				'</div>' +
                    			'</div>' +
                 			'</div>' +
                 			'<div class="carat-card__supporting-text">' +
                    			'<canvas id="chart" width="200" height="200"></canvas>' +
                   				'<div class="collapse">info</div>' +
                			'</div>' +
						'</div>'
		var domNode = parseDomNode(htmlString);

        return domNode;
	};

    return {
        getNewItemDomNodeTemplate: getNewItemDomNodeTemplate,
        getNewWorstBugHogTemplate: getNewWorstBugHogTemplate,
        getNewSummaryDomNodeTemplate: getNewSummaryDomNodeTemplate,
        getNewSummaryEntryDomNodeTemplate: getNewSummaryEntryDomNodeTemplate,
        getNewStatisticsDomNodeTemplate: getNewStatisticsDomNodeTemplate,
        getNewCaratDomNodeTemplate: getNewCaratDomNodeTemplate
    };

})();
