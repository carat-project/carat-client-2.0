import ejs from "ejs";
import {Utilities} from "../helper/Utilities.js";
const fs = require("fs");

let Template = fs.readFileSync(__dirname + "/../template/settingCard.ejs", "utf-8");

 /**
 * @public
 * @class SettingCard
 * @summary Setting suggestion card.
 */
class SettingCard {
	constructor(data) {
		// Prepare and reformat data
		data.label = data.label.split(/(?=[A-Z])/).join(" "); // Temporary split
		data.label = data.label.toLowerCase();
		data.label = Utilities.capitalize(data.label);

		this.data = data;

		// Create initial node
		let _html = ejs.render(Template, data);
		this.node = Utilities.makeDomNode(_html);

		// Bind card buttons
		this._bindEvents();

		// Make card swipeable
		makeElemPanSwipable(this.node);
	}

	/**
	 * Opens a setting related to the card
	 * @private
	 */
	_openSetting(){
		carat.openSetting(this.data.setting);
	}

	/**
	 * Shows setting related information dialog
	 * @private
	 */
	_showInfo(){
		app.showDialog({
			title: this.data.label,
			text: "Under construction. Here you'll see information about changing " +
			"a setting which has no specific toggle in the system settings."
		});
	}

	/**
	 * Binds card actions to buttons
	 * @private
	 */
	_bindEvents(){
		let _actionButton = this.node.querySelector(".action-button");
		if(this.data.setting != "unknown") {
			_actionButton.addEventListener("click", () => {
				this._openSetting();
			});
		} else {
			// Gray out action button
			_actionButton.disabled = true;

			let _infoButton = this.node.querySelector(".setting-info-button");
			_infoButton.addEventListener("click", () => {
				this._showInfo();
			});
		}
	}

	/**
	 * Tells if node is attached to a parent node
	 * @return {Boolean} True if component is mounted
	 */
	isComponentMounted(){
		return !!this.node.parent;
	}

	/**
	 * Returns a rendered setting card
	 * @return {node} Card node
	 */
	render(){
		return this.node;
	}
}

export default SettingCard;