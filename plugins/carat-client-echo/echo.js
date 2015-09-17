module.exports = {
    testiToimiiko: function() {
        var exec = require("cordova/exec");
        

        exec(
            function(winParam) {
                var pluginNode = document.getElementById("plugin-test");
                var messageNode = document.createTextNode(winParam);

                pluginNode.replaceChild(messageNode, pluginNode.childNodes[0]);

            },
            function(error) {
                var pluginNode = document.getElementById("plugin-test");
                var messageNode = document.createTextNode(error);

                pluginNode.replaceChild(messageNode, pluginNode.childNodes[0]);


            },
            "echoPlugin",
            "echo",
            ["plugin toimii"]);
    }
};
