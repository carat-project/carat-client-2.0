var getNewItemDomNodeTemplate = function() {

    var htmlString = '<div class="mdl-card">' +
            '<div class="carat-card__title">' +
            '<div class="mdl-card__icon"></div>' +
            '<div class="mdl-card__title-text">' +
            '<div class="expand">' +
            '<i class="material-icons">&#xE5CF;</i></div></div>' +
            '<div class="carat-card-time"></div></div>' +
            '<div class="mdl-card__supporting-text">' +
            '<div class="collapse">' +
            '</div></div><div class="mdl-card__actions carat_card_actions"></div></div>';


    var dummyDiv = document.createElement('div');
    dummyDiv.innerHTML = htmlString;
    var domNode = dummyDiv.firstChild;

    return domNode;
};
