/**
 * @namespace Utilities
 */
module.exports.Utilities = (function() {

    /**
     * @function
     * @static
     * @param {String} id
     * @param {String} additional
     * @returns {String} An is that is formed from the given data.
     * @memberOf Utilities
     */
    var makeIdFromOtherId = function(id, additional) {

        return id + "-" + additional;
    };

    /**
     * @function
     * @static
     * @param {String} appName
     * @param {String} hogOrBug
     * @param {String} additional
     * @returns {String} An id that is formed from the given data.
     * @memberOf Utilities
     */
    var makeIdFromAppName = function(appName,
                                     hogOrBug,
                                     additional) {

        var idPrefix = appName.replace(/-/g, "--")
                .replace(/\./g, "-");

        var standardPart = idPrefix + "-" + hogOrBug;

        if(!additional) {
            return standardPart;
        }

        return makeIdFromOtherId(standardPart, additional);
    };

    /**
     * @function
     * @static
     * @param {DOM-element} elem A DOM element that should contain
     an element with the matching id as a sub-element.
     * @param {String} id Id of the element one is searching for.
     * @returns {DOM-element} Element which is a child of the given
     element and has the corresponding id given as a parameter.
     * @memberOf Utilities
     */
    var findById = function(elem, id) {
        if(!elem.querySelector) {
            return null;
        } else {
            return elem.querySelector("#" + id);
        }
    };

    var appendOrReplace = function(appendLocation,
                                  updateId, elem) {
        var oldElem = findById(appendLocation, updateId);

        if(!oldElem) {
            appendLocation.appendChild(elem);
        } else {
            oldElem.parentNode.replaceChild(elem, oldElem);
        }
    };

    /**
     * @function
     * @static
     * @param {DOM-element} elem The to-be parent of the appendees.
     * @param {Array} appendees Array of DOM nodes that are to
     be appended as children of the given element.
     * @memberOf Utilities
     */
    var appendChildAll = function(elem, appendees) {
        for(var key in appendees) {
            if(elem && elem.appendChild){
                elem.appendChild(appendees[key]);
            }
        }
    };

    /**
     * @function
     * @static
     * @param {String} timeDrainString String that represents
     the time benefit of getting rid of the app.
     * @returns {Object} The string split into two parts containing
     the expected benefit of getting rid of the app and the error
     part associated with the expected benefit.
     * @memberOf Utilities
     */
    var splitTimeDrainString = function(timeDrainString) {
        var timeDrainSplit = timeDrainString.split("±", 2);

        var timeDrainPart;
        var timeDrainErrorPart;

        if(timeDrainSplit.length === 2) {
            timeDrainPart = timeDrainSplit[0];
            timeDrainErrorPart = "±" + timeDrainSplit[1];
        } else {
            timeDrainPart = timeDrainString;
            timeDrainErrorPart = "";
        }

        return {timeDrainPart: timeDrainPart,
                timeDrainErrorPart: timeDrainErrorPart};
    };

    /**
     * @function
     * @static
     * @param {Number} count The amount of "the thing".
     * @param {String} singular The singular form of the word
     for "the thing" at hand.
     * @returns {String} End-user readable form of the given
     word associated with the given number.
     * @memberOf Utilities
     */
    var pluralize = function(count, singular) {

        var form;

        if(count === 1) {
            form = singular;
        } else {
            form = singular + 's';
        }

        if(count === 0) {
            return "No " + form;
        } else {
            return count + " " + form;
        }
    };

    /**
     * @function
     * @static
     * @param {String} htmlString A string that should be valid
     HTML.
     * @returns {DOM-element} Corresponding DOM element that is
     created from the given HTML string.
     * @memberOf Utilities
     */
    var makeDomNode = function(htmlString) {

        var dummyNode = document.createElement("div");
        dummyNode.innerHTML = htmlString;
        return dummyNode.firstChild;
    };

    var cutLabel = function(label, length){
        // Charcode 8230 is ellipsis
        var ellipsis = String.fromCharCode(8230);
        return label.length > length ?
            label.slice(0,length-3) + "..": label;
    };

    var capitalize = function(string) {
        return string[0].toUpperCase() + string.slice(1);
    };

    return {
        cutLabel: cutLabel,
        makeIdFromAppName: makeIdFromAppName,
        splitTimeDrainString: splitTimeDrainString,
        pluralize: pluralize,
        makeDomNode: makeDomNode,
        makeIdFromOtherId: makeIdFromOtherId,
        appendChildAll: appendChildAll,
        findById: findById,
        capitalize: capitalize,
        appendOrReplace: appendOrReplace
    };
})();
