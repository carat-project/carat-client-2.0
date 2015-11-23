var HogBugCards = require("./HogBugCards.js").HogBugCards;

/**
 * @class BugCards
 * @extends HogBugCards
 * @param {} bugsSource A callback that is used for fetching
 the bugs from the server.
 * @summary Specializes HogBugCards for bugs specifically.
 */
module.exports.BugCards = function(bugsSource) {

    if(!bugsSource) {
        bugsSource = window.carat.getBugs;
    }
    return new HogBugCards(bugsSource, "bugs", makeElemPanSwipable);
};
