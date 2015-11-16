var Utilities = require("../helper/Utilities.js").Utilities;

module.exports.HogBug = (function(template, utilities, buttonActions) {
    /**
     * @class HogBug
     * @param {} data Raw data from the server.
     * @param {} gestureCallback The actions that happen when
     a gesture occurs.
     */
    return function(data, gestureCallback) {

        var benefitSubstrings = utilities
                .splitTimeDrainString(data.benefit);

        var benefit = benefitSubstrings.timeDrainPart;
        var benefitError = benefitSubstrings.timeDrainErrorPart;
        var expected = data.expected;
        var icon = data.icon;
        var samples = data.samples;
        var label = data.label;
        var packageName = data.name;
        var running = data.running;
        var killable = data.running && data.killable;
        var uninstallable = data.removable;
        var id = utilities.makeIdFromAppName(data.name, data.type);
        var uninstallId = utilities.makeIdFromAppName(data.name,
                                                      data.type,
                                                      "uninstall");
        var closeId = utilities.makeIdFromAppName(data.name,
                                                  data.type,
                                                  "close");

        /**
         * @function
         * @instance
         * @returns {Object} All the fields of this object.
         * @memberOf HogBug
         */
        var getFields = function() {
            return {
                benefit: benefit,
                benefitError: benefitError,
                expected: expected,
                icon: icon,
                samples: samples,
                label: label,
                running: running,
                id: id,
                uninstallId: uninstallId,
                closeId: closeId,
                killable: killable,
                uninstallable: uninstallable
            };
        };

        /**
         * @function
         * @instance
         * @returns {String} Id for the HTML-element id field.
         * @memberOf HogBug
         */
        var getId = function() {
            return id;
        };

        /**
         * @function
         * @instance
         * @returns {String} Id for the close button
         HTML-element id field.
         * @memberOf HogBug
         */
        var getCloseId = function() {
            return closeId;
        };

        /**
         * @function
         * @instance
         * @returns {String} Id for the uninstall button
         HTML-element id field.
         * @memberOf HogBug
         */
        var getUninstallId = function() {
            return uninstallId;
        };

        /**
         * @function
         * @instance
         * @returns {Boolean} Whether or not this app is
         currently running.
         * @memberOf HogBug
         */
        var getRunning = function() {
            return running;
        };

        /**
         * @function
         * @instance
         * @returns {String} The package name of this app
         for native plugin use.
         * @memberOf HogBug
         */
        var getPackageName = function() {
            return packageName;
        };

        /**
         * @function
         * @instance
         * @returns {String} The name of the app that is
         displayed for the end user.
         * @memberOf HogBug
         */
        var getLabel = function() {
            return label;
        };

        /**
         * @function
         * @instance
         * @returns {Boolean} Whether or not you can uninstall this app.
         * @memberOf HogBug
         */
        var getUninstallable = function() {
            return uninstallable;
        };

        var html = template.render(getFields());

        var domNode = (function() {
            var node = utilities.makeDomNode(html);
            var closeButton = utilities.findById(node, closeId);
            var uninstallButton = utilities.findById(node, uninstallId);

            closeButton.addEventListener("click", function() {
                buttonActions.close(
                    packageName,
                    function(state) {
                        console.log("Killing app: " + state);
                    });
            });

            uninstallButton.addEventListener("click", function() {
                buttonActions.uninstall(
                    packageName,
                    function(state) {
                        console.log("Uninstalling app: " + state);
                    });
            });

            if(window.localStorage.getItem(id)
               === 'dismissed') {
                node.style.display = 'none';
            } else {
                gestureCallback(node);
            }


            return node;
        })();

        /**
         * @function
         * @instance
         * @returns {DOM-element} Rendered DOM element
         representing a hog or a bug.
         * @memberOf HogBug
         */
        var render = function() {
            return domNode;
        };


        return {
            render: render,
            getFields: getFields,
            getId: getId,
            getCloseId: getCloseId,
            getLabel: getLabel,
            getUninstallId: getUninstallId,
            getPackageName: getPackageName,
            getRunning: getRunning,
            getUninstallable: getUninstallable
        };
    };
})(new EJS({url: 'js/template/hogBugCard.ejs'}),
   Utilities,
   {close: window.carat.killApp,
    uninstall: window.carat.uninstallApp});

