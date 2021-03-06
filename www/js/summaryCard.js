function showOrHideActions() {
    
    var button = document.querySelector("#summary-button");
    var bugs = document.querySelector("#bugTitleAndCount").innerHTML;
    var hogs = document.querySelector("#hogTitleAndCount").innerHTML;
    
    
    var hogGrid = document.querySelector("#hogSummaryGrid");
    var bugGrid = document.querySelector("#bugSummaryGrid");

    // opens hogs and bugs
    if (button.innerHTML == "Less"){
        hogGrid.className="carat_hide";
        bugGrid.className="carat_hide";
        button.innerHTML=("More");
        button.href="#summary";    
    // closes hogs and bugs
    } else {
        if (bugs!=="0 bugs") {
            bugGrid.className="carat_show"; 
        }
        if (hogs!=="0 hogs") {
            hogGrid.className="carat_show";
        }
        button.innerHTML=("Less");
        button.href="#";
        button.className="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect";
        } 
} 


    