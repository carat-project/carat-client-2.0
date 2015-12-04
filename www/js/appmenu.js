//function to show all snoozed cards again and remove from localstorage
function initializeListeners() {
    
    //listener for menu item "show Hidden Bugs"
    var cancelBugSnooze = document.querySelector("#showHiddenBugCards");
    cancelBugSnooze.addEventListener('click', function () {
        cancelBug();
    });
    
    //listener for menu item "show Hidden Hogs"
    var cancelHogSnooze = document.querySelector("#showHiddenHogCards");
    cancelHogSnooze.addEventListener('click', function () {
        cancelHog();
    });
}
    
 function listenMenu () {
     disableMenuItem();
}


// disables menu option "show hidden bugs/hogs" when not in correct view
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
	moveToPage('sendFeedback', 'feedback.html');
}

function appSettings(){
    moveToPage('appSettings', 'settings.html');
}

function appStatistics() {
	moveToPage('appStatistics', 'statistics.html');	
}

function appDescription() {
	moveToPage('appDescription', 'aboutCarat.html');
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
appDescription();
