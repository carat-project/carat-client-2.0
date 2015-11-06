function createChart(statisticsDataSource, observations, id) {
	var ctx = document.getElementById(id).getContext("2d");

    var makeLegend = function(data) {

        var countPercentage = function(value) {
            return Math.floor((value/observations) * 100);
        };

        var makeLi =  function(color, label) {
            return '<li style="display: inline-block; margin-right: 7px"><span style="-moz-border-radius:7px 7px 7px 7px; border-radius:7px 7px 7px 7px; margin-right:4px;width:15px;height:15px;display:inline-block;background-color:'+ color +';"></span>' + label + '</li>';
        };

        var result = "";

        for(var key in data) {

            var percentageString = countPercentage(data[key].value) + "%";
			var li = makeLi(data[key].color, data[key].title + ": " + percentageString);
			
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
		segmentShowStroke : false,
	  inGraphDataTmpl: "<%= v1 + ': ' + v6 + '%' %>"
	  
				};

    console.log(options);

	var pieChart = new Chart(ctx).Pie(statisticsDataSource, options);
    
	console.log(pieChart);
    
	//if ( id === "AndroidVersionChart") {
//		var legendPlace = document.getElementById("chart-legend");
//    	console.log(legendPlace);
//    	var legend = makeLegend(statisticsDataSource);
//    	console.log(legend, legendPlace);
//    	legendPlace.innerHTML = legend;
//	}
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

        createChart(filtered.regions, filtered.total, "HogBugChart");

        return true;
    };

    req.open("GET", "http://carat.cs.helsinki.fi/statistics-data/stats.json",
             true);
    req.send();
};

console.log("DATA: ",fetchAndRenderChart());
	
var fetchAndRenderVersionChart = function() {

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
		
		var other = template("#E91E63", "#EC407A");
		var two = template("#3F51B5", "#5C6BC0");
		var three= template("#00BCD4", "#26C6DA");
		var four = template("#8BC34A", "#9CCC65");
		var five = template("#FFC107", "#FFCA28");

        if(!rawData.All.Android) {
            return [];
        }

        var android = rawData.All.Android;
        console.log(android);

        var result = {regions: [], total: 0};
		
		var sumOther = 0;
		var sumTwo = 0;
		var sumThree = 0;
		var sumFour = 0;
		var sumFive = 0;

		for(var version in android) {

			console.log(version);
			
			var sumDevices = function(devices) {
				var summary = 0;
				for(var device in devices) {
						summary += devices[device];
				}
				
			 return summary;	
			}
			var sum = sumDevices(android[version]);
            result.total += sum;

            if(version === "Other") {
                sumOther += sum;
            } else if(version.charAt(0) === "2") {
                sumTwo += sum;
            } else if(version.charAt(0) === "3") {
                sumThree += sum;
            } else if(version.charAt(0) === "4") {
                sumFour += sum;
            } else if(version.charAt(0) === "5") {
                sumFive += sum;
            }
        }
		
		result.regions.push(other(sumOther, "Other"));
        result.regions.push(two(sumTwo, "Version 2"));
		result.regions.push(three(sumThree, "Version 3"));
		result.regions.push(five(sumFive, "Version 5"));
		result.regions.push(four(sumFour, "Version 4"));
		
		
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

        createChart(filtered.regions, filtered.total, "AndroidVersionChart");

        return true;
    };
	
	req.open("GET", "http://carat.cs.helsinki.fi/statistics-data/shares.json",
             true);
    req.send();
};

console.log("DATA: ",fetchAndRenderVersionChart());
	