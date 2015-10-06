function showOrHideActions() {
    
    var button = document.querySelector("#summary-button");
    console.log(button);

    var actionGrid = document.querySelector("#hogSummaryGrid");
    
    if (actionGrid.className=="carat_hide") {
        actionGrid.className="carat_show"; 
        document.querySelector("#bugSummaryGrid").className="carat_show";
        button.innerHTML=("Less");
        button.href="#";
    } else {
        actionGrid.className="carat_hide";
        document.querySelector("#bugSummaryGrid").className="carat_hide";
        button.innerHTML=("More");
        button.href="#summary";
        }
} 
    