/*Function to dismiss card forever/snooze it*/

function snooze(id){
//    toggleVisibilityOff();
    var element = document.getElementById(id);
    console.log(id);
    console.log(element);
    if (element.classList.contains("bug")) {
        localStorage.setItem(id, "bug_dismissed");
    } else {
        localStorage.setItem(id, "hog_dismissed");
    }
    
    console.log(localStorage.getItem(id));
}

function cancel(id){
//    toggleVisibilityOff();
    var el = document.getElementById(id);
    el.style.display = 'inherit';
//    el.style.backgroundColor='#F0F0F0';
    el.style.opacity="0";
//    el.classList.add("showHiddenCard");
    setTimeout(function() {
    el.style.opacity="1";
    }, 1);
}

