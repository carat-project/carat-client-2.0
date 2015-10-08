function showOrHideActions() {
    
    var button = document.querySelector("#summary-button");

    console.log(button);
    console.log(button.innerHTML);
    var bugs = document.querySelector("#bugTitleAndCount").innerHTML;
    var hogs = document.querySelector("#hogTitleAndCount").innerHTML;
    
    
    var hogGrid = document.querySelector("#hogSummaryGrid");
    var bugGrid = document.querySelector("#bugSummaryGrid");

    // opens hogs and bugs
    if (button.innerHTML == "Less"){
        console.log("less");
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
        } 
} 


    