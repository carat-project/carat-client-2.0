var MasterView = (function(bugsView, hogsView, homeView) {
    return function() {

        var bugsRawData = [];
        var hogsRawData = [];

        var bugsFetcherAsync = function(callback) {

            if(bugsRawData.length < 1) {
                window.carat.getBugs(function(bugs) {

                    bugsRawData = bugs;
                    callback(bugs);
                });
            } else {
                callback(bugsRawData);
            }
        };

        var hogsFetcherAsync = function(callback) {

            if(hogsRawData.length < 1) {
                window.carat.getHogs(function(hogs) {

                    hogsRawData = hogs;
                    callback(hogs);
                });
            } else {
                callback(hogsRawData);
            }
        };

        var hogsAndBugsFetcherAsync = function(callback) {

            bugsFetcherAsync(function(bugs) {
                hogsFetcherAsync(function(hogs) {
                    callback({
                        bugs: bugs,
                        hogs: hogs
                    });
                });
            });
        };

        bugsView.setDataSource(bugsFetcherAsync);
        hogsView.setDataSource(hogsFetcherAsync);
        homeView.setDataSource(hogsAndBugsFetcherAsync);

        var render = function() {
            bugsView.renderInsert();
            hogsView.renderInsert();
            homeView.renderInsert();
        };

        return {
            render: render
        };
    };
})(new BugCards(), new HogCards(), new HomeCards());
