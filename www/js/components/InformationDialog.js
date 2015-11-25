import ejs from "ejs";
import {Utilities} from "../helper/Utilities.js";
const fs = require("fs");

var Template = fs.readFileSync(__dirname + "/../template/informationDialog.ejs", "utf-8");

/**
 * Dynamic popup dialog over the application view.
 */
class InformationDialog {
	constructor(){
		// Render component
		var html = ejs.render(Template);
		this.node = Utilities.makeDomNode(html);

		// Get functional component elements
		this.title = this.node.querySelector(".mdl-card__title-text");
		this.text = this.node.querySelector(".mdl-card__supporting-text");

		// Bind close buttons to hide
		var closeButtons = this.node.querySelectorAll(".close");
		for(let i=0; i< closeButtons.length; i++){
			closeButtons[i].addEventListener("click", () => this.hide());
		}

		document.body.insertBefore(this.node, document.body.firstChild);
	}

	/**
	 * Shows a dialog window
	 * @param  {object} content contains
	 * dialog properties title and text.
	 */
	show(content){
		this.title.innerHTML = content.title;
		this.text.innerHTML = content.text;
		carat.changeStatusbarColor("#794800", (status) => {
			this.node.style.visibility = "visible";
		});
	}

	/**
	 * Hides a dialog window
	 */
	hide(){
		carat.changeStatusbarColor("#F1840C", (status) => {
			this.node.style.visibility = "hidden";
		});
	}
}

export default InformationDialog;