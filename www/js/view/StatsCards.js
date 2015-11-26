import ejs from "ejs";
import DeviceStats from "../model/DeviceStats.js";
import SettingList from "../components/SettingList.js";
import {Utilities} from "../helper/Utilities.js";

const fs = require("fs");

var Template = fs.readFileSync(__dirname + "/../template/systemTab.ejs", "utf-8");

 /**
 * @class StatsCards
 * @summary Handles device information.
 */
class StatsCards {

    constructor(){
        this.dataSource = this.defaultDataSource;
        let html = ejs.render(Template);
        this.node = Utilities.makeDomNode(html);

        // Get mutable elements
        this.info = this.node.querySelector("#system-info");
        this.cardList = this.node.querySelector("#system-card-list");

        // Start loading system information and suggestions
        // Rendering can take place before these finish
        this.loadInfo();
        this.loadSuggestions();
    }

    loadInfo() {
        carat.getMainReports((main) => {
            carat.getMemoryInfo((memInfo) => {
                carat.getUuid((uuid) => {
                    let systemCard = new DeviceStats({
                        modelName: window.device.model,
                        osVersion: window.device.version,
                        jScore: main.jscore,
                        uuid: uuid,
                        usedMemory: memInfo.total - memInfo.available,
                        totalMemory: memInfo.total,
                        percentage: memInfo.available / memInfo.total,
                        batteryLife: main.batteryLife
                    });
                    this.info.appendChild(systemCard.render());
                });
            });
        });
    };

    loadSuggestions() {
        carat.getSettings((suggestions) => {
           let settingsList = new SettingList(suggestions);
           this.cardList.appendChild(settingsList.render());
        });
    }

    render(){
        return this.node;
    }
}

export default StatsCards;