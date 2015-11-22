var Utilities = require('../helper/Utilities.js').Utilities;

module.exports.DeviceStats = (function(template, utilities, statsPoller) {

    return function(data, gestureCallback) {

        var jScore = Math.round(data.jScore * 100);
        var osVersion = data.osVersion;
        var uuid = data.uuid;
        var deviceModel = data.modelName;
        var totalMemory = data.totalMemory;
        var memoryPercentage = data.memoryPercentage;
        var batteryLife = data.batteryLife;
        console.log(batteryLife);

        var getFields = function() {
            return {
                jScore: jScore,
                osVersion: osVersion,
                batteryLife: batteryLife,
                uuid: uuid,
                deviceModel: deviceModel,
                totalMemory: totalMemory,
                memoryPercentage: memoryPercentage
            };
        };

        var html = template.render(getFields());

        var domNode = (function() {
            var node = utilities.makeDomNode(html);
            gestureCallback(node);


            var cpuText = node.querySelector(
                "#cpuProgressBar span");
            var cpuLoad = node.querySelector(
                "#cpuProgressBar div");

            var memoryText = node.querySelector(
                "#memProgressBar span");
            var memoryLoad = node.querySelector(
                "#memProgressBar div");

            statsPoller.cpuPoller(function(usage) {
                cpuText.style.color = (usage > 65) ?
                    "#fff" : "#000";
                usage = usage + "%";
                console.log(usage);
                cpuText.innerHTML = usage;
                cpuLoad.style.width = usage;
            }, 4000);

            statsPoller.memoryPoller(function(usage) {
                memoryText.style.color = (usage > 65) ?
                    "#fff" : "#000";
                usage = usage + "%";
                memoryText.innerHTML = usage;
                memoryLoad.style.width = usage;
            }, 4000);

            return node;
        })();

        var render = function() {
            return domNode;
        };

        return {
            getFields: getFields,
            render: render
        };
    };
})(new EJS({url: 'js/template/myDevice.ejs'}), Utilities,
   {cpuPoller: window.carat.startCpuPolling,
    memoryPoller: window.carat.startMemoryPolling});
