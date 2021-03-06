import ejs from "ejs";
import {Utilities} from "../helper/Utilities.js";
import SummaryEntry from "./SummaryEntry.js";
const fs = require("fs");

var Template = fs.readFileSync(__dirname + "/../template/summary.ejs", "utf-8");

 /**
 * @class SummaryContainer
 * @summary Summary card
 */
class SummaryContainer {

    constructor(bugs, hogs){
        if(!bugs) {
            this.bugEntries = [];
        } else {
            this.bugEntries = this.makeModels(bugs);
        }

        if(!hogs) {
            this.hogEntries = [];
        } else {
            this.hogEntries = this.makeModels(hogs);
        }

        this.node = this.createNode();
        this.id = "summary-0";

        let jscoreButton = this.node.querySelector(".info");
        jscoreButton.addEventListener("click", function(){
            app.showDialog({
                title: "What is a J-Score?",
                text: fs.readFileSync(__dirname + "/../template/strings/jscoreInfo.ejs")
            });
        });
    }

    /**
     * @function
     * @instance
     * @returns {Array} All the bug entries listed
     in the summary.
     * @memberOf SummaryContainer
     */
    getBugs() {
        return this.bugEntries;
    };

    /**
     * @function
     * @instance
     * @returns {Array} All the hog entries listed
     in the summary.
     * @memberOf SummaryContainer
     */
    getHogs() {
        return this.hogEntries;
    };

    // Create summary entry cards
    makeModels(data) {
        var result = [];
        for(var key in data) {
            result.push(new SummaryEntry(data[key]));
        }
        return result;
    };

    getRendered() {
        var renderedBugs = this.bugEntries.map(function(bug) {
            return bug.render();
        });

        var renderedHogs = this.hogEntries.map(function(hog) {
            return hog.render();
        });

        var bugsCount = Utilities.pluralize(renderedBugs.length, "Bug");
        var hogsCount = Utilities.pluralize(renderedHogs.length, "Hog");

        return {
            hogs: renderedHogs,
            bugs: renderedBugs,
            bugsCount: bugsCount+" »",
            hogsCount: hogsCount+" »"
        };
    };

    createNode() {

        var rendered = this.getRendered();
        var html = ejs.render(Template, rendered);
        var node = Utilities.makeDomNode(html);

        var hogsLoc = Utilities.findById(node, "hogsGrid");
        var bugsLoc = Utilities.findById(node, "bugsGrid");


        Utilities.appendChildAll(hogsLoc, rendered.hogs);
        Utilities.appendChildAll(bugsLoc, rendered.bugs);

        //makeElemTappable(node, true);

        return node;
    }

    /**
     * @function
     * @instance
     * @returns {DOM-element} Rendered DOM element
     representing the summary.
     * @memberOf SummaryContainer
     */
    render() {
        return this.node;
    };

    refreshModel(bugs, hogs) {
        this.bugEntries = this.makeModels(bugs);
        this.hogEntries = this.makeModels(hogs);

        this.node = this.createNode();

        let jscoreButton = this.node.querySelector(".info");
        jscoreButton.addEventListener("click", function(){
            app.showDialog({
                title: "What is a J-Score?",
                text: fs.readFileSync(__dirname + "/../template/strings/jscoreInfo.ejs")
            });
        });
    }
}

export default SummaryContainer;
