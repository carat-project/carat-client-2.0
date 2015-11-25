// creates a piechart from given data and puts it in the element of given id
function createChart(statisticsDataSource, observations, id) {
	if(!document.getElementById(id)) return;
    var ctx = document.getElementById(id).getContext("2d");
    // creates legends to chart
    var makeLegend = function(data) {
        //transfers a data value to a percentage
        var countPercentage = function(value) {
            return Math.floor((value/observations) * 100);
        };
        // creates a list element for a legend
        var makeLi =  function(color, label) {
            return '<li style="margin-left: 7px;">' +
                '<span class="chartLegend" style="background-color:'+ color +';">' +
                '</span>' + label + '</li>';
        };

        var result = "";

        for(var key in data) {

            var percentageString = countPercentage(data[key].value) + "%";
            var li = makeLi(data[key].color, data[key].title + ": " + percentageString);

            result += li;
        }

        return result;

    };
    // details of the charts layout
    var options = {

        segmentShowStroke : false
    };


    var pieChart = new Chart(ctx).Pie(statisticsDataSource, options);

    var legendPlace = document.getElementById(id + "-legend");

    var legend = makeLegend(statisticsDataSource);

    legendPlace.innerHTML = legend;

}

// creates the parts of template
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
// fetch data and transforms it to a chart
var render = function(chartName, source) {
    var req = new XMLHttpRequest();

    req.onreadystatechange = function() {

        if(req.readyState !== this.DONE) {
            return false;
        }

        if(req.status !== 200) {
            return false;
        }

        var asObject = JSON.parse(req.responseText);

        if (chartName === "HogBugChart") {
            var filtered = filterAppData(asObject);
        }
        else if (chartName === "AndroidVersionChart") {
            var filtered = filterVersionData(asObject);
        }
        else if (chartName === "DeviceChart") {
            var filtered = filterDeviceData(asObject);
        }

        if(!filtered || filtered.length < 1) {
            return false;
        }

        createChart(filtered.regions, filtered.total, chartName);

        return true;
    };

    req.open("GET", source, true);
    req.send();

};

// defines how the data is filtered for an app-chart
var filterAppData = function(rawData) {

    var wellBehaved = template("#66BB6A", "#4CAF50");
    var hog = template("#FDB45C", "#FFC870");
    var bug = template("#F7464A", "#FF5A5E");

    if(!rawData["android-apps"]) {
        return [];
    }

    var android = rawData["android-apps"];

    var result = {regions: [], total: 0};

    for(var appsKey in android) {

        var observation = android[appsKey];
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

// calls the render function for app-chart and gives it the chart name and the and source
var fetchAndRenderAppChart = function() {

    return render("HogBugChart", "http://carat.cs.helsinki.fi/statistics-data/stats.json");
}

// defines how the data is filtered for a version-chart
var filterVersionData = function(rawData) {

    var other = template("#F7464A", "#FF5A5E");
    var two = template("#FDB45C", "#FFC870");
    var three= template("#7E57C2", "#5C6BC0");
    var four = template("#66BB6A", "#4CAF50");
    var five = template("#00BCD4", "#26C6DA");

    if(!rawData.All.Android) {
        return [];
    }

    var android = rawData.All.Android;

    var result = {regions: [], total: 0};

    var sumOther = 0;
    var sumTwo = 0;
    var sumThree = 0;
    var sumFour = 0;
    var sumFive = 0;

    for(var version in android) {


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

// calls the render function for version-chart and gives it the chart name and the and source
var fetchAndRenderVersionChart = function() {

    return render("AndroidVersionChart", "http://carat.cs.helsinki.fi/statistics-data/shares.json");
}

// defines how the data is filtered for a device-chart
var filterDeviceData = function(rawData) {

    var other = template("#66BB6A", "#4CAF50");
    var samsungGalaxy = template("#FDB45C", "#FFC870");
    var htc= template("#7E57C2", "#5C6BC0");
    var nexus = template("#F7464A", "#FF5A5E");
    var droid = template("#00BCD4", "#26C6DA");


    if(!rawData.All.Android) {
        return [];
    }

    var android = rawData.All.Android;

    var result = {regions: [], total: 0};

    var sumOther = 0;
    var sumSamsungGalaxy = 0;
    var sumHtc = 0;
    var sumNexus = 0;
    var sumDroid = 0;

    for(var version in android) {


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


    return result;

};

// calls the render function for device-chart and gives it the chart name and the and source
var fetchAndRenderDeviceChart = function() {

    return render("DeviceChart", "http://carat.cs.helsinki.fi/statistics-data/shares.json");

}

fetchAndRenderAppChart();
fetchAndRenderVersionChart();
fetchAndRenderDeviceChart();
