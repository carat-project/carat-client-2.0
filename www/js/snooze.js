/*Function to dismiss card forever/snooze it*/

function snooze(id){
	localStorage.setItem(id, "dismissed");
	toggleVisibilityOff();
	console.log(localStorage.getItem(id));

}

function cancel(id){
	var el = document.querySelector('#'+id);
	el.style.display='inherit';
	toggleVisibilityOff();
}

