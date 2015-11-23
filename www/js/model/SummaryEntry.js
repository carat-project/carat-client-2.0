import ejs from "ejs";
import {Utilities} from "../helper/Utilities.js";
const fs = require("fs");

var Template = fs.readFileSync(__dirname + "/../template/summaryEntry.ejs", "utf-8");

/**
 * @class SummaryEntry
 * @param {} data Raw data from the server.
 */
class SummaryEntry {

    constructor(data){
        // Prepare and reformat data
        data.label = Utilities.cutLabel(data.label, 6);
        data.benefit = Utilities.splitTimeDrainString(data.benefit).timeDrainPart;
        data.id = Utilities.makeIdFromAppName(data.name, data.type, "entry");
        data.targetId = Utilities.makeIdFromAppName(data.name, data.type);

        this.data = data;

        // Render template
        var html = ejs.render(Template, data);
        this.node = this.createNode(html);
    }

    /**
     * @function
     * @instance
     * @returns {String} The id for the HTML-element
     id field.
     * @memberOf SummaryEntry
     */
    getId() {
        return this.data.id;
    };

    /**
     * @function
     * @instance
     * @returns {String} The id of the item that clicking
     this entry links to.
     * @memberOf SummaryEntry
     */
    getTargetId() {
        return this.data.targetId;
    };

    /**
     * @function
     * @instance
     * @returns {String} What kind of entry this is,
     hog or a bug.
     * @memberOf SummaryEntry
     */
    getType() {
        return this.data.type;
    };

    createNode(html) {
        var node = Utilities.makeDomNode(html);

        var tab;

        if(this.data.type === "BUG") {
            tab = "bugs-tab";
        } else if(this.data.type === "HOG") {
            tab = "hogs-tab";
        } else {
            return node;
        }

        node.addEventListener("click", function() {
            document.getElementById(tab).click();
            window.location.hash = targetId;
        });

        return node;
    }

    /**
     * @function
     * @instance
     * @returns {DOM-element} Rendered DOM element
     representing an app featured in the summary.
     * @memberOf SummaryEntry
     */
    render() {
        return this.node;
    };
}

export default SummaryEntry;