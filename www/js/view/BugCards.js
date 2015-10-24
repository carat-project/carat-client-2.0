var BugCards = function(bugsSource) {

    if(!bugsSource) {
        bugsSource = window.carat.getBugs;
    }
    return new HogBugCards(bugsSource, "bugs",
                           makeElemPanSwipable);
};
