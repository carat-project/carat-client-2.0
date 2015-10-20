function createChart(statisticsDataSource) {
		var ctx = document.getElementById("chart").getContext("2d");
		var data = [
    		{
        		value: 300,
        		color:"#F7464A",
        		highlight: "#FF5A5E",
        		label: "Red"
    		},
			{
    		    value: 200,
    		    color: "#FDB45C",
        		highlight: "#FFC870",
        		label: "Yellow"
    		},
    		{
        		value: 100,
        		color: "#46BFBD",
        		highlight: "#5AD3D1",
        		label: "Green"
    		}
		];

    var options = {
        segmentShowStroke: true
    };

		var pieChart = new Chart(ctx).Pie(data, options);
}

createChart();
