/*Function to dismiss card forever/snooze it*/

function snooze(id){
    toggleVisibilityOff();
    localStorage.setItem(id, "dismissed");
    console.log(localStorage.getItem(id));
}

function cancel(id){
    toggleVisibilityOff();
    var el = document.getElementById(id);
    el.style.display = 'inherit';
}

