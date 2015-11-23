import ejs from "ejs";
import {Utilities} from "../helper/Utilities.js";
const fs = require("fs");

var Template = fs.readFileSync(__dirname + "/../template/headerbar.ejs", "utf-8");

class Headerbar {
    constructor(){
        this.elemId = "header-bar";
        this.parentId = "main-screen";
    }

    renderTemplate() {
        return ejs.render(Template);
    };

    hide() {
        var elem = document.getElementById(elemId);

        if(elem) {
            elem.style["display"] = "none";
        }
    };

    show() {
        var elem = document.getElementById(elemId);

        if(elem) {
            elem.style["display"] = "inherit";
        }
    };

    renderInsert() {
        var node = Utilities.makeDomNode(renderTemplate());
        document.getElementById(parentId).appendChild(node);
    };
}

export default Headerbar;