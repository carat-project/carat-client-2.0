var HogBugCards = require("./HogBugCards.js").HogBugCards;

module.exports.BugCards = function(bugsSource) {

    if(!bugsSource) {
        bugsSource = window.carat.getBugs;
    }
    return new HogBugCards(bugsSource, "bugs",
                           makeElemPanSwipable);
};
