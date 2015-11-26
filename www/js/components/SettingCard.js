import ejs from "ejs";
import {Utilities} from "../helper/Utilities.js";
const fs = require("fs");

let Template = fs.readFileSync(__dirname + "/../template/settingCard.ejs", "utf-8");

class SettingCard {
	constructor(data) {
		// Prepare and reformat data
		data.label = data.label.split(/(?=[A-Z])/).join(" "); // Temporary split
		data.label = data.label.toLowerCase();
		data.label = Utilities.capitalize(data.label);

		// Create initial node
		this.data = data;
		let html = ejs.render(Template, data);
		this.node = Utilities.makeDomNode(html);

		// Bind button responsbile for changing the setting
		let button = this.node.querySelector(".action-button");
		button.addEventListener("click", () => {
			this.openSetting()
		});

		// Make card swipeable
		makeElemPanSwipable(this.node);
	}

	render(){
		return this.node;
	}

	openSetting(){
		carat.showToast("Open "+this.data.label + " settings");
	}
}

export default SettingCard;