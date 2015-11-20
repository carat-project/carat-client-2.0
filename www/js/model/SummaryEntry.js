var Utilities = require("../helper/Utilities.js").Utilities;

module.exports.SummaryEntry = (function(template, utilities) {
    /**
     * @class SummaryEntry
     * @param {} data Raw data from the server.
     */
    return function(data) {

        var cutLabel = function(labelToCut) {
            var ellipsis = String.fromCharCode(8230);
            // Charcode 8230 is ellipsis
            return labelToCut.length > 9 ?
                labelToCut.slice(0,6) + ellipsis : labelToCut;
        };

        var id = utilities.makeIdFromAppName(data.name,
                                             data.type,
                                             "entry");
        var targetId = utilities.makeIdFromAppName(data.name,
                                                   data.type);
        var benefit = utilities.splitTimeDrainString(data.benefit)
                .timeDrainPart;
        var label = cutLabel(data.label);
        var icon = data.icon;
        var type = data.type;

        var getFields = function() {

            return {
                id: id,
                benefit: benefit,
                label: label,
                icon: icon
            };
        };

        /**
         * @function
         * @instance
         * @returns {String} The id for the HTML-element
         id field.
         * @memberOf SummaryEntry
         */
        var getId = function() {
            return id;
        };

        /**
         * @function
         * @instance
         * @returns {String} The id of the item that clicking
         this entry links to.
         * @memberOf SummaryEntry
         */
        var getTargetId = function() {
            return targetId;
        };

        /**
         * @function
         * @instance
         * @returns {String} What kind of entry this is,
         hog or a bug.
         * @memberOf SummaryEntry
         */
        var getType = function() {
            return type;
        };

        var html = template.render(getFields());

        var domNode = (function() {
            var node = utilities.makeDomNode(html);

            var tab;

            if(type === "BUG") {
                tab = "bugs-tab";
            } else if(type === "HOG") {
                tab = "hogs-tab";
            } else {
                return node;
            }

            node.addEventListener("click", function() {
                document.getElementById(tab).click();
                window.location.hash = targetId;
            });

            return node;
        })();

        /**
         * @function
         * @instance
         * @returns {DOM-element} Rendered DOM element
         representing an app featured in the summary.
         * @memberOf SummaryEntry
         */
        var render = function() {
            return domNode;
        };

        return {
            render: render,
            getId: getId,
            getTargetId: getTargetId,
            getType: getType
        };

    };
})(new EJS({url: "js/template/summaryEntry.ejs"}), Utilities);