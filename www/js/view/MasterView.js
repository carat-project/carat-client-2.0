var MasterView = (function(bugsView, hogsView) {
    return function() {

        var bugsRawData = [];
        var hogsRawData = [];

        var bugsFetcherAsync = function(callback) {

            if(!bugsRawData) {
                window.carat.getBugs(function(bugs) {

                    bugsRawData = bugs;
                    callback(bugs);
                });
            } else {
                callback(bugsRawData);
            }
        };

        var hogsFetcherAsync = function(callback) {

            if(!hogsRawData) {
                window.carat.getHogs(function(hogs) {

                    hogsRawData = hogs;
                    callback(hogs);
                });
            } else {
                callback(hogsRawData);
            }
        };

        bugsView.setDataSource(bugsFetcherAsync);
        hogsView.setDataSource(hogsFetcherAsync);

        var render = function() {
            bugsView.renderInsert();
            hogsView.renderInsert();
        };

        return {
            render: render
        };
    };
})(new BugCards(), new HogCards());
