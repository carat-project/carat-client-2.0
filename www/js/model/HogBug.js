var HogBug = (function(template, utilities) {

    return function(data) {

        var benefitSubstrings = utilities
                .splitTimeDrainString(data.benefit);

        var benefit = benefitSubstrings.timeDrainPart;
        var benefitError = benefitSubstrings.timeDrainErrorPart;
        var expected = data.expected;
        var icon = data.icon;
        var samples = data.samples;
        var label = data.label;
        var running = data.running;
        var id = utilities.makeIdFromAppName(data.name, data.type);

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
})(new EJS({url: 'js/template/hogBugCard.ejs'}), Utilities);

