    var reqAnimationFrame = (function () {
        return window[Hammer.prefixed(window, 'requestAnimationFrame')] || function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
    })();
    var el = document.querySelector("#hit");
    var START_X = 0;
    var START_Y = 0;
    var ticking = false;
    var transform;
    var timer;
    var mc = new Hammer.Manager(el, { touchAction: "pan-y" });
    mc.add(new Hammer.Pan({ threshold: 0, pointers: 0 }));
    mc.add(new Hammer.Swipe()).recognizeWith(mc.get('pan'));
    mc.on("panstart panmove", onPan);
    mc.on("swipe", onSwipe);

    mc.on("hammer.input", function(ev) {
        if(ev.isFinal) {
            resetElement();
        }
    });
    function resetElement() {
        el.className = 'animate mdl-card mdl-shadow--2dp';
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
    
    function updateElementTransform() {
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
    function requestElementUpdate() {
        if(!ticking) {
            reqAnimationFrame(updateElementTransform);
            ticking = true;
        }
    }
    function logEvent(str) {
        //log.insertBefore(document.createTextNode(str +"\n"), log.firstChild);
    }
    function onPan(ev) {
        el.className = 'mdl-card mdl-shadow--2dp';
        transform.translate = {
            x: START_X + ev.deltaX,
            y: START_Y
        };
        requestElementUpdate();
        logEvent(ev.type);
    }

    function onSwipe(ev) {
        transform.ry = (ev.direction & Hammer.DIRECTION_HORIZONTAL) ? 1 : 0;

        clearTimeout(timer);
        timer = setTimeout(function () {
            resetElement();
        }, 300);
        requestElementUpdate();
        logEvent(ev.type);
        el.style.display='none';      
    }
    resetElement();