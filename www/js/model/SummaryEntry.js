var SummaryEntry = (function(template, utilities) {
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

        var getId = function() {
            return id;
        };

        var getTargetId = function() {
            return targetId;
        };

        var getType = function() {
            return type;
        };

        var html = template.render(getFields());

        var render = function() {
            return html;
        };

        return {
            render: render,
            getId: getId,
            getTargetId: getTargetId,
            getType: getType
        };

    };
})(new EJS({url: "js/template/summaryEntry.ejs"}), Utilities);
