/*placeholder functions for menu items. They don't work for some reason, because apparently I'm dumb or something*/

function sendFeedback(){
    
    var li = document.querySelector("#sendFeedback");
   
   	li.addEventListener('click', function () {
    	alert("Your socks stink");
		});
}

function appSettings(){
    var li = document.querySelector("#appSettings");

       	li.addEventListener('click', function () {
        	console.log("app settings clicked");
    		});
}

	sendFeedback();
	appSettings();

