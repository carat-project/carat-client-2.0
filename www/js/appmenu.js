/*placeholder functions for menu items. They don't work for some reason, because apparently I'm dumb or something*/

//function to show all snoozed cards again and remove from localstorage

function initializeListeners() {
    var cancelA = document.querySelector("#showAllHiddenCards");
    
//    cancelA.addEventListener('click', function () {
//        cancelAll();
//    });
                             
    var cancelB = document.querySelector("#showHiddenBugCards");
    cancelB.addEventListener('click', function () {
        cancelBug();
    });
    
    var cancelH = document.querySelector("#showHiddenHogCards");
    cancelH.addEventListener('click', function () {
        cancelHog();
    });                             
                             
}
//
//function cancelAll(){ 
//        var keys = Object.keys(localStorage);
//        i = keys.length;
//
//        while (i--) {
//            var item = localStorage.getItem(keys[i]);
//            if (item == "bug_dismissed" || item == "hog_dismissed") {
//                cancel(keys[i]);
//                localStorage.removeItem(keys[i]);
//            }
//        }
//}
    
function cancelBug(){ 
    var keys = Object.keys(localStorage);
    i = keys.length;

    while (i--) {
        var item = localStorage.getItem(keys[i]);
        if (item == "bug_dismissed") {
            cancel(keys[i]);
            localStorage.removeItem(keys[i]);
        }
    }
}
    
function cancelHog(){ 
    var keys = Object.keys(localStorage);
    i = keys.length;

    while (i--) {
        var item = localStorage.getItem(keys[i]);
        if (item == "hog_dismissed") {
            cancel(keys[i]);
            localStorage.removeItem(keys[i]);
        }
    }
}

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
