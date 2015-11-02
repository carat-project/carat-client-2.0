var DeviceStats = (function(template) {

    return function(data) {

        var jScore = Math.round(data.jScore * 100);
        console.log(jScore, data.jscore);
        var osVersion = data.osVersion;
        var uuid = data.uuid;
        var deviceModel = data.modelName;
        var totalMemory = data.totalMemory;
        var memoryPercentage = data.memoryPercentage;

        var getFields = function() {
            return {
                jScore: jScore,
                osVersion: osVersion,
                uuid: uuid,
                deviceModel: deviceModel,
                totalMemory: totalMemory,
                memoryPercentage: memoryPercentage
            };
        };

        var html = template.render(getFields());

        var render = function() {
            return html;
        };

        return {
            getFields: getFields,
            render: render
        };
    };
})(new EJS({url: 'js/template/myDevice.ejs'}));
