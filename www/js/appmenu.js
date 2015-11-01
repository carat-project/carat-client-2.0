/*placeholder functions for menu items. They don't work for some reason, because apparently I'm dumb or something*/

//function to show all snoozed cards again and remove from localstorage

function initializeListeners() {
    var cancelA = document.querySelector("#showAllHiddenCards");
    
//    cancelA.addEventListener('click', function () {
//        cancelAll();
//    });
                             
    var cancelBugSnooze = document.querySelector("#showHiddenBugCards");
    cancelBugSnooze.addEventListener('click', function () {
        cancelBug();
    });
    
    var cancelHogSnooze = document.querySelector("#showHiddenHogCards");
    cancelHogSnooze.addEventListener('click', function () {
        cancelHog();
    }); 
}
    
 function listenMenu () {
     disableMenuItem();
}


function disableMenuItem(){
    var bugtab = document.querySelector("#bugs-tab");
    var hogtab = document.querySelector("#hogs-tab");
    
    bugmenuitem = document.querySelector("#showHiddenBugCards");
    hogmenuitem = document.querySelector("#showHiddenHogCards");
         
        bugmenuitem.setAttribute("disabled", true);
        hogmenuitem.setAttribute("disabled", true);
    
    if (bugtab.classList.contains("is-active")) {
        bugmenuitem.removeAttribute("disabled");
    } else if (hogtab.classList.contains("is-active")) {
        hogmenuitem.removeAttribute("disabled");

    }
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
