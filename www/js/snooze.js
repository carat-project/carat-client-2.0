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

//function to show all snoozed cards again and remove from localstorage
function cancelAll(){
    
    var li = document.querySelector("#showAllHiddenCards");
    
    li.addEventListener('click', function () {
        var keys = Object.keys(localStorage);
        i = keys.length;

        while (i--) {
            if (localStorage.getItem(keys[i]) == "dismissed") {
                cancel(keys[i]);
                localStorage.removeItem(keys[i]);
            }
        }
    });
}