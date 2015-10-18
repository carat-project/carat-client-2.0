/*placeholder functions for menu items. They don't work for some reason, because apparently I'm dumb or something*/

function sendFeedback(){

    var li = document.querySelector("#sendFeedback");

   	li.addEventListener('click', function () {
    	alert("Your socks stink");
		});
}

//function appSettings(){
//    var li = document.querySelector("#appSettings");
//
//       	li.addEventListener('click', function () {
//        	window.location = "settings.html";
//    		});
//}

function appSettings(){
    moveToPage('appSettings', 'settings.html');
}


function moveToPage(pagename, address){
    var li = document.querySelector("#"+pagename);

       	li.addEventListener('click', function () {
        	window.location = address;
    		});
}



	sendFeedback();
	appSettings();
	backToIndex();
