function createChart(statisticsDataSource, observations) {
		var ctx = document.getElementById("chart").getContext("2d");

    var makeLegend = function(data) {

        var countPercentage = function(value) {
            return Math.floor((value/observations) * 100);
        };

        var makeLi =  function(color, label) {
            return '<li style="display: inline-block; margin-right: 7px"><span style="-moz-border-radius:7px 7px 7px 7px; border-radius:7px 7px 7px 7px; margin-right:4px;width:15px;height:15px;display:inline-block;background-color:'+ color +';"></span>' + label + '</li>';
        };

        var result = "";

        for(var key in data) {

            var percentageString = countPercentage(data[key].value) + "% ";
            var li = makeLi(data[key].color, percentageString + data[key].label);
            result += li;
        }

        return result;

    };

    var options = {
    };

    console.log(options);

		var pieChart = new Chart(ctx).Pie(statisticsDataSource);
    console.log(pieChart);
    var legendPlace = document.getElementById("chart-legend");
    console.log(legendPlace);
    var legend = makeLegend(statisticsDataSource);
    console.log(legend, legendPlace);
    legendPlace.innerHTML = legend;
}


var fetchAndRenderChart = function() {

    var filterData = function(rawData) {

        var template = function(color, highlight) {
            return function(value, label) {
                return {
                    color: color,
                    highlight: highlight,
                    label: label,
                    value: value
                };
            };
        };

        var wellBehaved = template("#46BFBD", "#5AD3D1");
        var hog = template("#F7464A", "#FF5A5E");
        var bug = template("#FDB45C", "#FFC870");

        if(!rawData["android-apps"]) {
            return [];
        }

        var android = rawData["android-apps"];
        console.log(android);

        var result = {regions: [], total: 0};

        for(var appsKey in android) {

            var observation = android[appsKey];
            console.log(observation);
            result.total += observation.value;

            if(observation.key === "well-behaved") {
                result.regions.push(wellBehaved(observation.value, observation.key));
            } else if(observation.key === "hogs") {
                result.regions.push(hog(observation.value, observation.key));
            } else if(observation.key === "bugs") {
                result.regions.push(bug(observation.value, observation.key));
            }
        }

        return result;
    };

    var req = new XMLHttpRequest();

    req.onreadystatechange = function() {

        if(req.readyState !== this.DONE) {
            return false;
        }

        if(req.status !== 200) {
            return false;
        }

        var asObject = JSON.parse(req.responseText);
        console.log(req.responseText);

        var filtered = filterData(asObject);

        if(!filtered || filtered.length < 1) {
            return false;
        }
        console.log(filtered);

        createChart(filtered.regions, filtered.total);

        return true;
    };

    req.open("GET", "http://carat.cs.helsinki.fi/statistics-data/stats.json",
             true);
    req.send();
};

console.log("DATA: ",fetchAndRenderChart());

