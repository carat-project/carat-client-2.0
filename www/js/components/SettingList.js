import ejs from "ejs";
import SettingCard from "../components/SettingCard.js";
import {Utilities} from "../helper/Utilities.js";
const fs = require("fs");

let Template = fs.readFileSync(__dirname + "/../template/settingList.ejs", "utf-8");

 /**
 * @class SettingList
 * @summary Listview of system setting suggestions.
 */
class SettingList {
	constructor() {
		let html = ejs.render(Template);
		this.node = Utilities.makeDomNode(html);

		this.clear = this.clear.bind(this);
		this._showNotification = this._showNotification.bind(this); 
		this.cardCount = this.node.querySelector("#system-card-count")
		this.cardContainer = this.node.querySelector("#system-cards");

		this.reload();

		let refreshButton = this.node.querySelector("#system-card-refresh");
		refreshButton.addEventListener("click", ()=>{
			carat.showToast("Reloading settings..");
			this.reload();
		});
	}

	/**
	 * Clears the list for rerendering
	 */
	clear(){
		this.cardContainer.innerHTML = "";
	}

	/**
	 * Displays a placeholder notification for a setting suggestion
	 * @param  {Object} suggestion System setting suggestion
	 * @private
	 */
	_showNotification(suggestion){
        let benefit = suggestion.benefit
        let length =  benefit.indexOf("±");
        benefit = benefit.substr(0, length-1);

        carat.showNotification("Change to "+suggestion.changeTo, "Benefit: "+benefit, (success) => {
            console.log("Showing placeholder notification for a system setting");
        });
	}


	/**
	 * Reloads and appends setting cards
	 */
	reload(){
		carat.getSettings((suggestions)=>{
			// Display a notification
			if((typeof suggestions !== "undefined")
				&& (suggestions !== null)
				&& (suggestions.length > 0)){
				this._showNotification(suggestions[0]);
			}

			// Refresh the view
			this.cardCount.innerHTML = suggestions.length;
			this.clear();
			if(suggestions.length >= 1){
				this.cardContainer = this.node.querySelector("#system-cards");
				suggestions.forEach((suggestion) => {
	                let card = new SettingCard(suggestion);
	               	this.cardContainer.appendChild(card.render());
	       		});
			}
		});
	}

	/**
	 * Returns a rendered setting list
	 * @return {node} List node
	 */
	render() {
		return this.node;
	}
}

export default SettingList;