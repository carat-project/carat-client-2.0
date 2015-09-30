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

    var onPan = function(ev) {
        if(el.classList.contains("animation")) {
            el.classList.remove("animation");
        }
        transform.translate = {
            x: START_X + ev.deltaX,
            y: START_Y
        };
        requestElementUpdate();
    }

    var onSwipeRight = function(ev) {
        transform.ry = (ev.direction & Hammer.DIRECTION_HORIZONTAL) ? 1 : 0;

        clearTimeout(timer);
        timer = setTimeout(function () {
            resetElement();
        }, 300);
        requestElementUpdate();
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
    
    var onTap = function(ev) {
    console.log(el.className);
        var moreText = document.querySelector("#card-" + el.id + "-textpand");
    console.log(moreText);
    if (moreText.className == "collapse.in") {
        moreText.className="collapse";
    } else {
        moreText.className = "collapse.in";
    }
        clearTimeout(timer);
        timer = setTimeout(function () {
            resetElement();
        }, 200);
        requestElementUpdate();
    }


    mc.add(new Hammer.Pan({ threshold: 30, pointers: 0 }));
    mc.add(new Hammer.Swipe()).recognizeWith(mc.get('pan'));
    mc.add( new Hammer.Tap({ threshold:15, event: 'singletap' }) );
    mc.on("panstart panmove", onPan);
    mc.on("swiperight", onSwipeRight);
    mc.on("swipeleft", onSwipeLeft);
    mc.on("singletap", onTap);


    mc.on("hammer.input", function(ev) {
        if(ev.isFinal) {
            resetElement();
        }
    });
    resetElement();
}

function toggleElemVisibilityOn(id) {
    var elem = document.getElementById(id);
    elem.style.display = 'initial';
    elem.style.visibility = 'visible';
}

function toggleElemVisibilityOff(id) {
    var elem = document.getElementById(id);
    elem.style.visibility = 'hidden';
    elem.style.display= 'none';
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