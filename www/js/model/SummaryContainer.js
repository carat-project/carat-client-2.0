var SummaryEntry = require("./SummaryEntry.js").SummaryEntry;
var Utilities = require("../helper/Utilities.js").Utilities;

module.exports.SummaryContainer = (function(template, utilities) {

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

        var getFields = function() {
            return {
                bugEntries: bugEntries,
                hogEntries: hogEntries
            };
        };

        var getBugs = function() {
            return bugEntries;
        };

        var getHogs = function() {
            return hogEntries;
        };

        console.log(getFields());

        var getRendered = function() {

            var renderedBugs = bugEntries.map(function(bug) {
                return bug.render();
            });


            var renderedHogs = hogEntries.map(function(hog) {
                return hog.render();
            });

            console.log(renderedHogs);

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

        var html = template.render(getRendered());

        var render = function() {
            return html;
        };

        return {
            render: render,
            getFields: getFields,
            getBugs: getBugs,
            getHogs: getHogs
        };
    };
})(new EJS({url: "js/template/summary.ejs"}), Utilities);
