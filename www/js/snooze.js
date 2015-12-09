/*Function to dismiss card forever/snooze it*/
function snooze(id){
//    toggleVisibilityOff();
    if (id.indexOf("BUG") !=-1) {
        localStorage.setItem(id, "bug_dismissed");
    } else {
        localStorage.setItem(id, "hog_dismissed");
    }    
}

// function to show card again, cancel snooze
function cancel(id){
    var el = document.getElementById(id);
    
    el.style.display = 'inherit';
    el.style.opacity="0";
    setTimeout(function() {
    el.style.opacity="1";     
    }, 1);
}