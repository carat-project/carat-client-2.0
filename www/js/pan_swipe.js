//function that makes an element pannable and swipable
function makeElemPanSwipable(el) {
    var reqAnimationFrame = (function () {
        return window[Hammer.prefixed(window, 'requestAnimationFrame')]
            || function (callback) {
                window.setTimeout(callback, 1000 / 60);
            };
    })();
    var START_X = 0;
    var START_Y = 0;
    var ticking = false;
    var transform;
    var timer;
    var mc = new Hammer.Manager(el, { touchAction: "pan-y" });

    var resetElement = function() {
        if(!el.classList.contains("animation")) {
            el.classList.add("animation");
        }
        transform = {
            translate: { x: START_X, y: START_Y },
            scale: 1,
            angle: 0,
            rx: 0,
            ry: 0,
            rz: 0
        };
        requestElementUpdate();
    }

    var updateElementTransform = function() {

        var value = [
            'translate3d(' + transform.translate.x + 'px, ' + transform.translate.y + 'px, 0)',
            'scale(' + transform.scale + ', ' + transform.scale + ')',
            'rotate3d('+ transform.rx +','+ transform.ry +','+ transform.rz +','+  transform.angle + 'deg)'
        ];
        value = value.join(" ");
        el.style.webkitTransform = value;
        el.style.mozTransform = value;
        el.style.transform = value;
        ticking = false;
    }
    var requestElementUpdate = function() {
        if(!ticking) {
            reqAnimationFrame(updateElementTransform);
            ticking = true;
        }
    }
    var logEvent = function(str) {
        //log.insertBefore(document.createTextNode(str +"\n"), log.firstChild);
    }
    var onPan = function(ev) {
        if(el.classList.contains("animation")) {
            el.classList.remove("animation");
        }
        transform.translate = {
            x: START_X + ev.deltaX,
            y: START_Y
        };
        requestElementUpdate();
        logEvent(ev.type);
    }

    var onSwipeRight = function(ev) {
        transform.ry = (ev.direction & Hammer.DIRECTION_HORIZONTAL) ? 1 : 0;

        clearTimeout(timer);
        timer = setTimeout(function () {
            resetElement();
        }, 300);
        requestElementUpdate();
        logEvent(ev.type);
        el.style.display='none';
    }


    var onSwipeLeft = function(ev) {
        onSwipeRight(ev);

        var acceptCallback = function() {
            snooze(el.id);
        }
        var cancelCallback = function() {
            cancel(el.id);
        }
        toggleVisibility(acceptCallback, cancelCallback);
    }


    mc.add(new Hammer.Pan({ threshold: 0, pointers: 0 }));
    mc.add(new Hammer.Swipe()).recognizeWith(mc.get('pan'));
    mc.on("panstart panmove", onPan);
    mc.on("swiperight", onSwipeRight);
    mc.on("swipeleft", onSwipeLeft);

    mc.on("hammer.input", function(ev) {
        if(ev.isFinal) {
            resetElement();
        }
    });
    resetElement();
}

function toggleElemVisibilityOn(id) {
    var elem = document.getElementById(id);
    elem.style.visibility = 'visible';
}

function toggleElemVisibilityOff(id) {
    var elem = document.getElementById(id);
    elem.style.visibility = 'hidden';
}

function setPopupAcceptCallback(callback) {
    var acceptButton = document
        .getElementById("popup-accept-button");
    acceptButton.onclick = callback;
}

function setPopupCancelCallback(callback) {
    var cancelButton = document
        .getElementById("popup-cancel-button");
    cancelButton.onclick = callback;
}

function toggleVisibility(acceptCallback, cancelCallback) {
    toggleElemVisibilityOn("popup-modal");
    toggleElemVisibilityOn("popup-overlay");
    setPopupAcceptCallback(acceptCallback);
    setPopupCancelCallback(cancelCallback);
}

function toggleVisibilityOff() {
    toggleElemVisibilityOff("popup-modal");
    toggleElemVisibilityOff("popup-overlay");
}

function makeModal() {
    var modal = document.createElement("div");
    modal.className = "modal";
    modal.innerHTML = "testitesti";
    var button = document.createElement("button");
    button.id = el.id + "button";
    modal.appendChild(button);
    button.innerHTML = (button.id);

    var body = document.querySelector("body");
    body.appendChild(modal);
}

function selectPanSwipable(selectors) {
    //select all elements matching selectors and
    //apply pannability and swipability

    var elems = document.querySelectorAll(selectors);

    if(elems) {
        for(var i = 0; i < elems.length; i++) {
            makeElemPanSwipable(elems[i]);
        }
    }
}