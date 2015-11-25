import ejs from "ejs";
import {Utilities} from "../helper/Utilities.js";
const fs = require("fs");

var Template = fs.readFileSync(__dirname + "/../template/hogBugCard.ejs", "utf-8");

 /**
 * @class HogBug
 * @summary Hog/bug cards with actions.
 */
class HogBug {

    constructor(data){
        // Prepare and reformat data
        data.label = Utilities.cutLabel(data.label, 20);
        data.benefitSubstrings = Utilities.splitTimeDrainString(data.benefit);
        data.benefit = data.benefitSubstrings.timeDrainPart;
        data.benefitError = data.benefitSubstrings.timeDrainErrorPart;
        data.killable = data.running && data.killable;
        data.uninstallable = data.removable;
        data.id = Utilities.makeIdFromAppName(data.name, data.type);
        data.uninstallId = Utilities.makeIdFromAppName(data.name,data.type,"uninstall");
        data.closeId = Utilities.makeIdFromAppName(data.name,data.type,"close");

        this.data = data;

        // render template
        var html = ejs.render(Template, data);
        this.node =  this.createNode(html);
    }

    /**
     * @function
     * @instance
     * @returns {String} Id for the HTML-element id field.
     * @memberOf HogBug
     */
    getId() {
        return this.data.id;
    };

    /**
     * @function
     * @instance
     * @returns {String} Id for the close button
     HTML-element id field.
     * @memberOf HogBug
     */
    getCloseId() {
        return this.data.closeId;
    };

    /**
     * @function
     * @instance
     * @returns {String} Id for the uninstall button
     HTML-element id field.
     * @memberOf HogBug
     */
    getUninstallId() {
        return this.data.uninstallId;
    };

    /**
     * @function
     * @instance
     * @returns {Boolean} Whether or not this app is
     currently running.
     * @memberOf HogBug
     */
    getRunning() {
        return this.data.running;
    };

    /**
     * @function
     * @instance
     * @returns {String} The package name of this app
     for native plugin use.
     * @memberOf HogBug
     */
    getPackageName() {
        return this.data.packageName;
    }

    /**
     * @function
     * @instance
     * @returns {String} The name of the app that is
     displayed for the end user.
     * @memberOf HogBug
     */
    getLabel() {
        return this.data.label;
    };

    /**
     * @function
     * @instance
     * @returns {Boolean} Whether or not you can uninstall this app.
     * @memberOf HogBug
     */
    getUninstallable() {
        return this.data.uninstallable;
    };

    createNode(html) {
        var node = Utilities.makeDomNode(html);
        var closeButton = Utilities.findById(node, this.data.closeId);
        var uninstallButton = Utilities.findById(node, this.data.uninstallId);

        let _this = this;
        closeButton.addEventListener("click", function() {
            carat.killApp(_this.data.name, function(state) {
                closeButton.disabled = true;
                if(state == "Success") {
                    carat.showToast(_this.data.label + " closed");
                } else {
                    carat.showToast(_this.data.label + " couldn't be closed!");
                }
            });
        });

        uninstallButton.addEventListener("click", function() {
            carat.uninstallApp(_this.data.name, function(state) {
                console.log("Uninstalling app: " + state);
            });
        });

        if(window.localStorage.getItem(this.data.id) === "dismissed") {
            node.style.display = "none";
        } else {
            makeElemPanSwipable(node);
        }

        return node;
    }

    /**
     * @function
     * @instance
     * @returns {DOM-element} Rendered DOM element
     representing a hog or a bug.
     * @memberOf HogBug
     */
    render() {
        return this.node;
    };
}

export default HogBug;