var Utilities = require("./Utilities.js").Utilities;

model.exports.Rendering = (function(utilities) {
    return function(htmlString, callbacks) {

        if(!htmlString) {
            htmlString = "";
        }

        if(!callbacks) {
            callbacks = [];
        }

        var getHtmlString = function() {
            return htmlString;
        };

        var getCallbacks = function() {
            return callbacks;
        };

        var getAsDomNode = function() {
            return utilities.makeDomNode(htmlString);
        }

        var addCallback = function(callback) {
            callbacks.push(callback);
        };

        var runCallbacks = function() {

            while(callbacks.length > 0) {
                var callback = callbacks.pop();
                callback();
            }
        };

        return {
        };

    };
})(Utilities);
