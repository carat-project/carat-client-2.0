function init() {
    var url = "http://carat.cs.helsinki.fi/statistics-data/stats.json";
    load(url);
}


    function load(url) {
        var req = new XMLHttpRequest();
        req.open("GET", "url", true);
        req.send();
        req.onreadystatechange = function () {
            if (req.readyState !== 4 && req.status !== 200) {
                console.log(req.readyState);
                console.log(req.status);
                false;
            } else {
                var stats = req.responseText;
                console.log(stats);
                allStats = JSON.parse(stats);                              
            }
        }
    };