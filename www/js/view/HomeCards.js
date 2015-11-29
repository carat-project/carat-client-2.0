import ejs from "ejs";
import SummaryContainer from "../model/SummaryContainer.js";
import {Utilities} from "../helper/Utilities.js";
const fs = require("fs");

/**
 * @class HomeCards
 */
class HomeCards {

    constructor() {
        this.docLocation = document.querySelector("#home .page-content");
        this.dataSource = this.defaultDataSource;
        this.summaryContainer = new SummaryContainer();

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
        let _this = this;
        return function(onResultCallback) {
            sourceCallback(function(data) {

                if(!_this.summaryContainer) {
                    _this.summaryContainer =
                        new SummaryContainer(data.bugs,
                                             data.hogs);
                } else {
                    _this.summaryContainer
                        .refreshModel(data.bugs,
                                      data.hogs);
                }
                var rendered = _this.summaryContainer.render();

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

    refreshSummaryCard() {
        Utilities.appendOrReplace(this.docLocation,
                                  this.summaryContainer.id,
                                  this.summaryContainer.render());
    }

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
            _this.refreshSummaryCard();
            showOrHideActions();
        });
    };

}

export default HomeCards;
