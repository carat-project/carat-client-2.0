import ejs from "ejs";
import HogBug from "../model/HogBug.js";
import {Utilities} from "../helper/Utilities.js";
const fs = require("fs");

var Template = fs.readFileSync(__dirname + "/../template/hogBugListing.ejs", "utf-8");

 /**
 * @class HogBugCards
 * @summary List view for hog/bug cards.
 */
class HogBugCards {

    constructor(dataSource, outputElemId){
        this.dataSource = dataSource;
        this.outputElemId = outputElemId;
        this.docLocation = document.getElementById(outputElemId);
        this.renderAsync = this.renderAsyncSource(dataSource);
        this.cardLocIds = {
            runningId: this.cardLocIdMaker("running"),
            inactiveId: this.cardLocIdMaker("inactive"),
            systemId: this.cardLocIdMaker("system")
        };
    }

    cardLocIdMaker(locName) {
        return Utilities.makeIdFromOtherId(this.outputElemId,locName);
    };

    renderTemplate(hogBugsArray) {

        var templateData = {
            cardLocIds: this.cardLocIds,
            hogBugsArray: hogBugsArray
        };
        var html = ejs.render(Template, templateData);
        var rendered = Utilities.makeDomNode(html);


        var runningLoc = Utilities.findById(rendered, this.cardLocIds.runningId);
        var inactiveLoc = Utilities.findById(rendered, this.cardLocIds.inactiveId);
        var systemLoc = Utilities.findById(rendered, this.cardLocIds.systemId);

        Utilities.appendChildAll(runningLoc, hogBugsArray.running);
        Utilities.appendChildAll(inactiveLoc, hogBugsArray.inactive);
        Utilities.appendChildAll(systemLoc, hogBugsArray.system);

        return rendered;
    };

    makeModels(rawData) {

        var result = {
            running: [],
            inactive: [],
            system: []
        };

        for(var key in rawData) {
            var model = new HogBug(rawData[key]);

            if(model.getRunning()) {
                result.running.push(model);
            } else if(!model.getUninstallable()) {
                result.system.push(model);
            } else {
                result.inactive.push(model);
            }
        }

        return result;
    };

    renderModels(categories) {

        var morphToHTML = function(model) {
            return model.render();
        };

        return {
            running: categories.running.map(morphToHTML),
            inactive: categories.inactive.map(morphToHTML),
            system: categories.system.map(morphToHTML)
        };
    };

    renderAsyncSource(sourceCallback) {
        let _this = this;
        return function(onResultCallback) {
            sourceCallback(function(data) {
                var models = _this.makeModels(data);
                var result = _this.renderTemplate(_this.renderModels(models));
                if(onResultCallback) {
                    onResultCallback(result);
                }
            });
        };
    };


    /**
     * @function
     * @instance
     * @param {} freshDataSource A callback which is used for
     acquiring data from the server.
     * @memberOf HogBugCards
     */
    setDataSource(freshDataSource) {
        this.dataSource = freshDataSource;
        this.renderAsync = this.renderAsyncSource(freshDataSource);
    };

    /**
     * @function
     * @instance
     * @memberOf HogBugCards
     * @summary Insert these cards as a part of the document.
     */
    renderInsert(){
        let _this = this;
        this.renderAsync(function(renderedTemplate) {
            _this.docLocation.appendChild(renderedTemplate);
        });
    };
}

export default HogBugCards;
