var SummaryEntry = require("./SummaryEntry.js").SummaryEntry;
var Utilities = require("../helper/Utilities.js").Utilities;

module.exports.SummaryContainer = (function(template, utilities) {
    /**
     * @class SummaryContainer
     * @param {} bugs Array of raw data representing
     the bugs that are listed in the summary.
     * @param {} hogs Array of raw data representing
     the hogs that are listed in the summary.
     */
    return function(bugs, hogs) {

        var makeModels = function(data) {

            var result = [];

            for(var key in data) {
                result.push(new SummaryEntry(data[key]));
            }

            return result;
        };

        var bugEntries = makeModels(bugs);

        var hogEntries = makeModels(hogs);

        /**
         * @function
         * @instance
         * @returns {Object} All the fields of this object.
         * @memberOf SummaryContainer
         */
        var getFields = function() {
            return {
                bugEntries: bugEntries,
                hogEntries: hogEntries
            };
        };

        /**
         * @function
         * @instance
         * @returns {Array} All the bug entries listed
         in the summary.
         * @memberOf SummaryContainer
         */
        var getBugs = function() {
            return bugEntries;
        };

        /**
         * @function
         * @instance
         * @returns {Array} All the hog entries listed
         in the summary.
         * @memberOf SummaryContainer
         */
        var getHogs = function() {
            return hogEntries;
        };

        var getRendered = function() {

            var renderedBugs = bugEntries.map(function(bug) {
                return bug.render();
            });


            var renderedHogs = hogEntries.map(function(hog) {
                return hog.render();
            });

            var bugsCount = utilities.pluralize(renderedBugs.length,
                                                "bug");
            var hogsCount = utilities.pluralize(renderedHogs.length,
                                                "hog");

            return {
                hogs: renderedHogs,
                bugs: renderedBugs,
                bugsCount: bugsCount,
                hogsCount: hogsCount
            };

        };

        var domNode = (function() {

            var rendered = getRendered();
            var html = template.render(rendered);

            var node = utilities.makeDomNode(html);

            var hogsLoc = utilities.findById(node, "hogsGrid");
            var bugsLoc = utilities.findById(node, "bugsGrid");


            utilities.appendChildAll(hogsLoc, rendered.hogs);
            utilities.appendChildAll(bugsLoc, rendered.bugs);

            return node;
        })();

        /**
         * @function
         * @instance
         * @returns {DOM-element} Rendered DOM element
         representing the summary.
         * @memberOf SummaryContainer
         */
        var render = function() {
            return domNode;
        };

        return {
            render: render,
            getFields: getFields,
            getBugs: getBugs,
            getHogs: getHogs
        };
    };
})(new EJS({url: "js/template/summary.ejs"}), Utilities);
