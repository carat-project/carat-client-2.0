function makeElemTappable(el, defaultExpand, mc, timer,
                          ticking, requestElementUpdate,
                          resetElement) {

    if(!defaultExpand) {
        defaultExpand = false;
    }

    if(!timer) {
        var dummyTimer;
        timer = dummyTimer;
        clearTimeout(timer);
    }

    if(!ticking) {
        ticking = false;
    }

    if(!mc) {
        mc = new Hammer.Manager(el);
    }

    if(!resetElement) {
        resetElement = function(){};
    }

    if(!requestElementUpdate) {
        requestElementUpdate = function(){};
    }

    var onTap = function(ev) {
        if(!ev) {
            showOrHideCollapse(ev);
            return;
        }

        // filters out buttons, links and bug/hog symbols from the action-info div
        if(ev != null && ev.target != null
           && ev.target.className != "expand-button"
           && ev.target.nodeName === "BUTTON"
           || ev.target.nodeName === "A"
           || ev.target.classList.contains("action-info")
           || ev.target.classList.contains("action-info-text")
           || ev.target.classList.contains("no-tap-event")) {
            return;
        }

        showOrHideCollapse(ev);
    };

    var toggleShowOnExpand = function() {
        var togglees = el.querySelectorAll(".show-on-expand");

        if(togglees.length === 0) {
            return;
        }

        for(var i = 0; i < togglees.length; i++) {
            var iteratee = togglees[i];
            if(!iteratee.style
               || !iteratee.style.visibility
               || iteratee.style.visibility === 'hidden') {
                iteratee.style.visibility = 'visible';
            } else {
                iteratee.style["visibility"] = 'hidden';
            }
        };
    };

    var showOrHideCollapse = function(ev) {

        if (el.id =="statistics-jscore"){
            $(el).find("#card-" + el.id + "-textpand").toggleClass("in_large");

        } else if(el.id == "summary-0"){
            $(el).find("#card-summary-0-textpand > .collapse").toggleClass("in");
        } else {
            $(el).find("#card-" + el.id + "-textpand").toggleClass("in");
        }
        changeExpandArrow(ev);
    };

    //changes expand arrow, uses strange material design character in if statement
    var changeExpandArrow = function(ev) {
        var icon = el.querySelector("i.material-icons");
        if(icon.className.indexOf && icon.className.indexOf("no-flip") > -1) return;
        var iconNode = $(icon);
        if(iconNode.hasClass("normal-icon")){
            iconNode.removeClass("normal-icon");
            iconNode.addClass("rotated-icon");
        } else {
            iconNode.removeClass("rotated-icon");
            iconNode.addClass("normal-icon");
        }
        /*if (icon.innerHTML != "") {
         icon.innerHTML = "&#xE5CF";
         } else {
         icon.innerHTML = "&#xE5CE";
         }*/
        toggleShowOnExpand();

    };

    //if an element should be expanded by default, call on tap with null event
    if(defaultExpand) {
        onTap(null);
    }

    mc.add( new Hammer.Tap(
        { threshold:15, pointers: 1, event: 'singletap' }) );
    mc.on("singletap", onTap);
}
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
        if (angle >= 90 && angle < 150)
            return;
        if (angle > 30 && angle < 90)
            return;
        moving = true;
    };

    // while moving
    var onPanMove = function(ev) {
        if (moving == true) {

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


    // ends moving
    var onPanEnd = function(ev) {
        if (moving == true) {
            moving = false;
        }
    };

    var onSwipeRight = function(ev) {

        // hides Suggestions in home screen, contains no extra logic
        if (el.classList.contains("worstBug") || el.classList.contains("worstHog")) {
            el.style.display='none';
            el.style.visibility='hidden';
            return;
        }

        hideCard(ev);
        snooze(el.id);

        if (el.style.display==='none'){

            //name to snackbar
            var name = el.querySelector(".mdl-card__title-text").innerHTML.split('<')[0];
            createSnackbar(name + ' hidden', 'Undo', function() {
                cancel(el.id);
            }); //torkutetusta kortista snackbar ja palautusnappi
        }
    };

    var onSwipeLeft = function(ev) {
        onSwipeRight(ev);
    };


    var hideCard = function(ev){
        el.style.display='none';
    };


    mc.add(new Hammer.Pan({ threshold: 5, pointers: 1, direction: Hammer.DIRECTION_HORIZONTAL}));
    mc.add(new Hammer.Swipe({ threshold: 150, pointers: 1, velocity: 0.5 })).recognizeWith(mc.get('pan'));
    mc.on("panstart", onPanStart);
    mc.on("panmove", onPanMove);
    mc.on("panend", onPanEnd);
    mc.on("swiperight", onSwipeRight);
    mc.on("swipeleft", onSwipeLeft);
    mc.on("hammer.input", function(ev) {
        if(ev.isFinal) {
            resetElement();
        }
    });
    makeElemTappable(el, false, mc, timer, ticking,
                     requestElementUpdate, resetElement);
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
