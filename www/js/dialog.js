function addDataToModal(titleText,mainText) {
    var modal = document.querySelector("#popup-modal");
    var maintext = modal.querySelector(".mdl-card__supporting-text");
    var titletext = modal.querySelector(".mdl-card__title-text");
    
    
    titletext.innerHTML = titleText;
    maintext.innerHTML = mainText;
}

function closeModal() {
    var modal = document.querySelector("#popup-modal");
    var overlay = document.querySelector("#popup-overlay");

    overlay.style.display = 'none';
    overlay.style.visibility = 'hidden';
    modal.style.display = 'none'; 
    modal.style.visibility = 'hidden';
}

function showModal() {

    var modal = document.querySelector("#popup-modal");
    var overlay = document.querySelector("#popup-overlay");
    
    overlay.style.visibility = "visible";
    overlay.style.display = "initial";
    modal.style.visibility = "visible";
    modal.style.display = "initial"; 

} 

function JscoreInfo() {
    var titleText = "What is a J-Score?";
    var mainText = "The J-Score represents the percentile battery life you see relative to all other devices being measured by Carat. So, if you have a J-Score of 50, that means your expected battery life is better than half of our users; a score of 99 means you have better battery life than 99% of our users. Of course, a single number does not provide a complete description of your battery life. A low J-Score could mean that your device is using a big battery inefficiently or a small battery with average efficiency. Similarly, a high J-Score could simply mean that you don't use your device heavily. Carat computes a huge variety of statistics, and the J-Score is just one of them.";
  
    addDataToModal(titleText, mainText);
    showModal();
}