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
    var moving = false;
    var mc = new Hammer.Manager(el, { touchAction: "pan-y" });

    var resetElement = function() {
        if(!el.classList.contains("animate")) {
            el.classList.add("animate");
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
    };

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
    };
    var requestElementUpdate = function() {
        if(!ticking) {
            reqAnimationFrame(updateElementTransform);
            ticking = true;
        }
    };

    //detects start movement with angle filter. If movement is sideways, moving starts
    var onPanStart = function(ev) {
        var angle = Math.abs(ev.angle);
        console.log("trying to start"  + angle);

        if (angle >= 90 && angle < 150)
            return;
        if (angle > 30 && angle < 90)
            return;

        moving = true;
        console.log("start");
    };

    var onPanMove = function(ev) {
        if (moving == true) {
            console.log("moving");

            if(el.classList.contains("animate")) {
                el.classList.remove("animate");
            }
            transform.translate = {
                x: START_X + ev.deltaX,
                y: START_Y
            };
            requestElementUpdate();
        }
    };



    var onPanEnd = function(ev) {
        if (moving == true) {
            moving = false;
            console.log("end");
        }
    };

//    var onPan = function(ev) {
//        var angle = Math.abs(ev.angle);
//        console.log(angle);
//        if(el.classList.contains("animate")) {
//            el.classList.remove("animate");
//        }
//        transform.translate = {
//            x: START_X + ev.deltaX,
//            y: START_Y
//        };
//        requestElementUpdate();
//
//    };

    var onSwipeRight = function(ev) {
        transform.ry = (ev.direction & Hammer.DIRECTION_HORIZONTAL) ? 1 : 0;

        clearTimeout(timer);
        timer = setTimeout(function () {
            resetElement();
        }, 300);
        requestElementUpdate();
        el.style.display='none';
        if (el.style.display==='none'){
        createSnackbar('Card dismissed', 'Undo', function(){ el.style.display='inline'}); //torkutetusta kortista snackbar ja palautusnappi
        }
    };

    var onSwipeLeft = function(ev) {
        onSwipeRight(ev);

        var acceptCallback = function() {
            snooze(el.id);
        };
        var cancelCallback = function() {
            cancel(el.id);
        };
        toggleVisibility(acceptCallback, cancelCallback);
    };

    var onTap = function(ev) {
        
        showOrHideCollapse(ev);
        clearTimeout(timer);
        timer = setTimeout(function () {
            resetElement();
        }, 200);
        requestElementUpdate();
    };

    var showOrHideCollapse = function(ev) {
        var moreText = document.querySelector
        ("#card-" + el.id + "-textpand");

        //hide
        if (moreText && moreText.className === "collapse.in") {
            moreText.className="collapse";
        //show
        } else if (moreText && moreText.className === "collapse") {
            moreText.className = "collapse.in";
        }
    };

    mc.add(new Hammer.Pan({ threshold: 5, pointers: 1, direction: Hammer.DIRECTION_HORIZONTAL}));
    mc.add(new Hammer.Swipe({ threshold: 150, pointers: 1, velocity: 0.5 })).recognizeWith(mc.get('pan'));
    mc.add( new Hammer.Tap({ threshold:15, pointers: 1, event: 'singletap' }) );
    mc.on("panstart", onPanStart);
    mc.on("panmove", onPanMove);
    mc.on("panend", onPanEnd);
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
