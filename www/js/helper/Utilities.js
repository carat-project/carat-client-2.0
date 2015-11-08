module.exports.Utilities = (function() {

    var makeIdFromAppName = function(appName,
                                     hogOrBug,
                                     additional) {

        var idPrefix = appName.replace(/-/g, "--")
                .replace(/\./g, "-");

        if(!additional) {
            return idPrefix + "-" + hogOrBug;
        }

        return idPrefix + "-" + hogOrBug + "-" + additional;
    };

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

    var makeDomNode = function(htmlString) {

        var dummyNode = document.createElement("div");
        dummyNode.innerHTML = htmlString;

        return dummyNode.firstChild;
    };

    return {
        makeIdFromAppName: makeIdFromAppName,
        splitTimeDrainString: splitTimeDrainString,
        pluralize: pluralize,
        makeDomNode: makeDomNode
    };
})();
