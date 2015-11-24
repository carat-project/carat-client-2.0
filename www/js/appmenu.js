/*placeholder functions for menu items. They don't work for some reason, because apparently I'm dumb or something*/

//function to show all snoozed cards again and remove from localstorage

function initializeListeners() {
    var cancelA = document.querySelector("#showAllHiddenCards");
                             
    var cancelBugSnooze = document.querySelector("#showHiddenBugCards");
    cancelBugSnooze.addEventListener('click', function () {
        cancelBug();
    });
    
    var cancelHogSnooze = document.querySelector("#showHiddenHogCards");
    cancelHogSnooze.addEventListener('click', function () {
        cancelHog();
    });
    
    //listeners for tabs
    var tabs = document.querySelectorAll(".mdl-layout__tab");  
    for (i=0; i<tabs.length; i++) {
        tabs[i].addEventListener("click", function(){
        removeHighlight(); 
        });
    }    
}
    
 function listenMenu () {
     disableMenuItem();
}

function removeHighlight() {
    var restored = document.querySelectorAll(".restored");
   
    if (restored !== null) {
        i = restored.length;
        while (i--) {
            restored[i].classList.remove("restored");
        }
    }

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

    //var li = document.querySelector("#sendFeedback");
//
//   	li.addEventListener('click', function () {
//    	window.open('mailto:carat@cs.helsinki.fi?subject=Carat 2.0 Feedback&body=Dear Carat team, Your socks stink.');
//		});

	moveToPage('sendFeedback', 'feedback.html');
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

function appStatistics() {
	moveToPage('appStatistics', 'statistics.html');	
}

function moveToPage(pagename, address){
    var li = document.querySelector("#"+pagename);

       	li.addEventListener('click', function () {
        	window.location = address;
    		});
}

function handleSetting(e) {
    console.log($(e));
    $(e).find("label").toggleClass("is-checked");
}


	sendFeedback();
	appSettings();
	appStatistics();
	backToIndex();
