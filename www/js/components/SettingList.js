import ejs from "ejs";
import SettingCard from "../components/SettingCard.js";
import {Utilities} from "../helper/Utilities.js";
const fs = require("fs");

let Template = fs.readFileSync(__dirname + "/../template/settingList.ejs", "utf-8");

class SettingList {
	constructor(suggestions) {
		let html = ejs.render(Template, {count: suggestions.length});
		this.node = Utilities.makeDomNode(html);
		if(suggestions.length >= 1){
			this.cardContainer = this.node.querySelector("#system-cards");
			suggestions.forEach((suggestion) => {
	                let card = new SettingCard(suggestion);
	               	this.cardContainer.appendChild(card.render());
	       	});
		}
	}

	render() {
		return this.node;
	}
}

export default SettingList;