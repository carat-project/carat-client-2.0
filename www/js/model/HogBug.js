var Utilities = require("../helper/Utilities.js").Utilities;

module.exports.HogBug = (function(template, utilities, buttonActions) {

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

        var getId = function() {
            return id;
        };

        var getCloseId = function() {
            return closeId;
        };

        var getUninstallId = function() {
            return uninstallId;
        };

        var getRunning = function() {
            return running;
        };

        var getPackageName = function() {
            return packageName;
        };

        var getLabel = function() {
            return label;
        };

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

