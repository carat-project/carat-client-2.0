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
        inGraphDataFontSize : 8,
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

   
    		var legendPlace = document.getElementById(id + "-legend");
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

        var other = template("#F7464A", "#FF5A5E");
        var two = template("#FDB45C", "#FFC870");
        var three= template("#7E57C2", "#5C6BC0");
        var four = template("#66BB6A", "#4CAF50");
        var five = template("#00BCD4", "#26C6DA");

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

var fetchAndRenderDeviceChart = function() {

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

        var other = template("#66BB6A", "#4CAF50");
        var samsungGalaxy = template("#FDB45C", "#FFC870");
        var htc= template("#7E57C2", "#5C6BC0");
        var nexus = template("#F7464A", "#FF5A5E");
        var droid = template("#00BCD4", "#26C6DA");


        if(!rawData.All.Android) {
            return [];
        }

        var android = rawData.All.Android;
        console.log(android);

        var result = {regions: [], total: 0};

        var sumOther = 0;
        var sumSamsungGalaxy = 0;
        var sumHtc = 0;
        var sumNexus = 0;
        var sumDroid = 0;

        for(var version in android) {

            console.log(version);

            var androidVersion = android[version];

            for (var device in androidVersion) {


                result.total += androidVersion[device];

                if (device === "Other") {
                    sumOther += androidVersion[device];
                } else if (device.indexOf("Samsung Galaxy" || "Epic" || "GT-I8190" || "SPH-L710" || "SM-N9005" || "SCH-I545") > -1) {
                    sumSamsungGalaxy += androidVersion[device];
                } else if (device.indexOf("Nexus") > -1) {
                    sumNexus += androidVersion[device];
                } else if (device.indexOf("HTC" || "ADR" || "PC") > -1) {
                    sumHtc += androidVersion[device];
                } else if (device.indexOf("DROID") > -1) {
                    sumDroid += androidVersion[device];
                } else {
                    sumOther += androidVersion[device];
                }
            }

        }

        result.regions.push(other(sumOther, "Other"));
        result.regions.push(htc(sumHtc, "HTC"));
        result.regions.push(nexus(sumNexus, "Nexus"));
        result.regions.push(droid(sumDroid, "DROID"));
        result.regions.push(samsungGalaxy(sumSamsungGalaxy, "Samsung Galaxy"));


        console.log(result);
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

        var filtered = filterData(asObject);

        if(!filtered || filtered.length < 1) {
            return false;
        }
        console.log(filtered);

        createChart(filtered.regions, filtered.total, "DeviceChart");

        return true;
    };

	  req.open("GET", "http://carat.cs.helsinki.fi/statistics-data/shares.json",
             true);
    req.send();
};

console.log("DATA: ",fetchAndRenderDeviceChart());
