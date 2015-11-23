var HogBugCards = require("./HogBugCards.js").HogBugCards;

/**
 * @class HogCards
 * @extends HogBugCards
 * @param {} hogsSource A callback that is used for fetching
 the hogs from the server.
 * @summary Specializes HogBugCards for hogs specifically.
 */
module.exports.HogCards = function(hogsSource) {

    if(!hogsSource) {
        hogsSource = window.carat.getHogs;
    }
    return new HogBugCards(hogsSource, "hogs", makeElemPanSwipable);
};
