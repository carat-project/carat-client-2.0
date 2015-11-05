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
			var li = makeLi(data[key].color, percentageString + data[key].title);
			
		    result += li;
        }

        return result;

    };

    var options = {
      inGraphDataShow : true,
      //inGraphDataAnglePosition : 2,
//	  inGraphDataRadiusPosition: [2, 3, 2],
	  inGraphDataFontSize : 11,
	  inGraphDataAlign : "center",
	  inGraphDataVAlign : "middle",
	  inGraphDataRotate : "inRadiusAxisRotateLabels",
	  inGraphDataFontColor : "white",
inGraphDataAnglePosition : 2,
inGraphDataRadiusPosition: 2,
	  inGraphDataTmpl: "<%= v1 + ': ' + v6 + '%' %>"
	  
				};

    console.log(options);

		var pieChart = new Chart(ctx).Pie(statisticsDataSource, options);
    console.log(pieChart);
    
}


var fetchAndRenderChart = function() {

    var filterData = function(rawData) {

        var template = function(color, highlight) {
            return function(value, label) {
                return {
                    color: color,
                    highlight: highlight,
                    title: label,
                    value: value
                };
            };
        };

        var wellBehaved = template("#66BB6A", "#4CAF50");
        var hog = template("#FDB45C", "#FFC870");
        var bug = template("#F7464A", "#FF5A5E");

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
                result.regions.push(wellBehaved(observation.value, "fine"));
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

	