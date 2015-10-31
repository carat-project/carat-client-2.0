/* This is a prototype borrowed from Mat Scales at http://codepen.io/wibblymat/pen/avAjq */
var createSnackbar = (function() {
  // Any snackbar that is already shown
  var previous = null;

  return function(message, actionText, action) {
    if (previous) {
      previous.dismiss();
    }
    var snackbar = document.createElement('div');
    snackbar.className = 'paper-snackbar';
    snackbar.dismiss = function() {
      this.style.opacity = 0;
    };
    var text = document.createTextNode(message);
    snackbar.appendChild(text);
    if (actionText) {
      if (!action) {
        action = snackbar.dismiss.bind(snackbar);
      }
      var actionButton = document.createElement('button');
      actionButton.className = 'action';
      actionButton.innerHTML = actionText;
      actionButton.addEventListener('click', function(){
      	action();
      	previous.dismiss(); //Fade out
      });
      snackbar.appendChild(actionButton);
    }
    setTimeout(function() {
      if (previous === this) {
        previous.dismiss();
      }
    }.bind(snackbar), 3000);

    snackbar.addEventListener('transitionend', function(event, elapsed) {
      if (event.propertyName === 'opacity' && this.style.opacity == 0) {
        this.parentElement.removeChild(this);
        if (previous === this) {
          previous = null;
        }
      }
    }.bind(snackbar));



    previous = snackbar;
    document.body.appendChild(snackbar);
    // In order for the animations to trigger, I have to force the original style to be computed, and then change it.
    getComputedStyle(snackbar).bottom;
    snackbar.style.bottom = '0px';
    snackbar.style.opacity = 1;
  };
})();

var longMessage = "This is a longer message that won't fit on one line. It is, inevitably, quite a boring thing. Hopefully it is still useful.";
var shortMessage = 'The card will not be shown again';

//document.getElementById('single').addEventListener('click', function() {
//  createSnackbar(shortMessage);
//});
//
//document.getElementById('multi').addEventListener('click', function() {
//  createSnackbar(longMessage);
//});

//document.getElementById('singleaction').addEventListener('click', function() {
//  createSnackbar(shortMessage, 'Undo');
//});

//document.getElementById('multiaction').addEventListener('click', function() {
//  createSnackbar(longMessage, 'Wot?', function() { alert('Moo!'); });
//});





