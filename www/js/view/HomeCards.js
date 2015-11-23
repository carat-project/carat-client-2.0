import ejs from "ejs";
import SummaryContainer from "../model/SummaryContainer.js";
import {Utilities} from "../helper/Utilities.js";
const fs = require("fs");

/**
 * @class HomeCards
 */
class HomeCards {

    constructor(){
        this.docLocation = document.querySelector("#home .page-content");
        this.dataSource = this.defaultDataSource;

        let _this = this;
        this.renderAsync = (function(source) {
            return _this.renderAsyncSource(source);
        })(this.dataSource);
    }

    defaultDataSource(callback) {
        window.carat.getBugs(function(bugs) {
            window.carat.getHogs(function(hogs) {
                callback({
                    bugs: bugs,
                    hogs: hogs
                });
            });
        });
    };


    renderAsyncSource(sourceCallback) {
        return function(onResultCallback) {
            sourceCallback(function(data) {

                var model = new SummaryContainer(data.bugs, data.hogs);
                var rendered = model.render();

                if(onResultCallback) {
                    onResultCallback(rendered);
                }
            });
        };
    };

    /**
     * @function
     * @instance
     * @param {} freshDataSource A callback which is used for
     acquiring data from the server.
     * @memberOf HomeCards
     */
    setDataSource(freshDataSource) {
        this.dataSource = freshDataSource;
        this.renderAsync = this.renderAsyncSource(freshDataSource);
    };

    /**
     * @function
     * @instance
     * @memberOf HomeCards
     * @summary Insert these cards as a part of the document.
     */
    renderInsert(){
        let _this = this;
        this.renderAsync(function(renderedTemplate) {
            var node = renderedTemplate;
            _this.docLocation.appendChild(node);
            showOrHideActions();
        });
    };

}

export default HomeCards;
