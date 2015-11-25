import ejs from "ejs";
import {Utilities} from "../helper/Utilities.js";
const fs = require("fs");

// Template
var Template = fs.readFileSync(__dirname + "/../template/myDevice.ejs", "utf-8");

class DeviceStats {
    constructor(data){
        data.jScore = Math.round(data.jScore * 100);
        data.deviceModel = data.modelName;

        this.data = data;

        var html = ejs.render(Template, data);
        this.node = this.createNode(html);
    }

    // create node and bind functions
    createNode(html) {
        var node = Utilities.makeDomNode(html);
        makeElemPanSwipable(node);

        var cpuText = node.querySelector("#cpuProgressBar span");
        var cpuLoad = node.querySelector("#cpuProgressBar div");

        var memoryText = node.querySelector("#memProgressBar span");
        var memoryLoad = node.querySelector("#memProgressBar div");

        carat.startCpuPolling(function(usage) {
            cpuText.style.color = (usage > 65) ? "#fff" : "#000";
            usage = usage + "%";
            cpuText.innerHTML = usage;
            cpuLoad.style.width = usage;
        }, 4000);

        carat.startMemoryPolling(function(usage) {
            memoryText.style.color = (usage > 65) ? "#fff" : "#000";
            usage = usage + "%";
            memoryText.innerHTML = usage;
            memoryLoad.style.width = usage;
        }, 4000);

        return node;
    }

    render() {
        return this.node;
    }

    getFields() {
        return this.data;
    }
}

export default DeviceStats;