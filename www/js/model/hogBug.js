var HogBug = (function(template) {

    return function(data) {

        var makeIdFromAppName = function(appName, hogOrBug) {
            var idPrefix = appName.replace(/-/g, "--")
                    .replace(/\./g, "-");
            return idPrefix + "-" + hogOrBug;
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

        var benefitSubstrings = splitTimeDrainString(data.benefit);

        var benefit = benefitSubstrings.timeDrainPart;
        var benefitError = benefitSubstrings.timeDrainErrorPart;
        var expected = data.expected;
        var icon = data.icon;
        var samples = data.samples;
        var label = data.label;
        var running = data.running;
        var id = makeIdFromAppName(data.name, data.type);

        var getFields = function() {
            return {
                benefit: benefit,
                benefitError: benefitError,
                expected: expected,
                icon: icon,
                samples: samples,
                label: label,
                running: running,
                id: id
            };
        };

        var getId = function() {
            return id;
        };

        var getRunning = function() {
            return running;
        };

        var html = template.render(getFields());

        var render = function() {
            return html;
        };

        return {
            render: render,
            getFields: getFields,
            getId: getId,
            getRunning: getRunning
        };
    };
})(new EJS({url: 'js/template/hogBugCard.ejs'}));

