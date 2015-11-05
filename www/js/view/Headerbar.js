var Headerbar = (function(template, elemId, parentId, utilities) {
    return function() {

        var renderTemplate = function() {
            return template.render();
        };

        var hide = function() {
            var elem = document.getElementById(elemId);

            if(elem) {
                elem.style["display"] = "none";
            }
        };

        var show = function() {
            var elem = document.getElementById(elemId);

            if(elem) {
                elem.style["display"] = "inherit";
            }
        };

        var renderInsert = function() {
            var node = utilities.makeDomNode(renderTemplate());
            document.getElementById(parentId).appendChild(node);
        };

        return {
            renderInsert: renderInsert
        };
    };
})(new EJS({url: 'js/template/headerbar.ejs'}), "header-bar",
   "main-screen", Utilities);
