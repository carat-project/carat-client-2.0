var HogBugCards = require("./HogBugCards.js").HogBugCards;

module.exports.HogCards = function(hogsSource) {

    if(!hogsSource) {
        hogsSource = window.carat.getHogs;
    }
    return new HogBugCards(hogsSource,
                           "hogs", makeElemPanSwipable);
};
