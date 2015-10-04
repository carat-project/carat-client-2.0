function showOrHideActions() {
    
    var button = document.querySelector("#summary-button");
    console.log(button);
//    button.addEventListener('click', function() {
        var actionGrid = document.querySelector("#summaryGrid");
        console.log(actionGrid);
    
        if (actionGrid.className=="carat_hide") {
            actionGrid.className="carat_show"; 
            button.innerHTML=("Less");
            button.href="#";
        } else {
            actionGrid.className="carat_hide";
            button.innerHTML=("More");
            button.href="#summary";
        }
//    });
}
    
    