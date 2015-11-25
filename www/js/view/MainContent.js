import ejs from "ejs";
import {Utilities} from "../helper/Utilities.js";
const fs = require("fs");

var Template = fs.readFileSync(__dirname + "/../template/mainContent.ejs", "utf-8");

 /**
 * @class MainContent
 * @summary Content view
 */
class MainContent {
    constructor(){
        this.parentId = "main-screen";
    }

    renderTemplate() {
        return ejs.render(Template);
    };

    renderInsert() {
        var node = Utilities.makeDomNode(renderTemplate());
        document.getElementById(parentId).appendChild(node);
    };
}

export default MainContent;