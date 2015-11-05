var MainContent = (function(template, parentId, utilities) {
    return function() {

        var renderTemplate = function() {
            return template.render();
        };

        var renderInsert = function() {
            var node = utilities.makeDomNode(renderTemplate());
            document.getElementById(parentId).appendChild(node);
        };

        return {
            renderInsert: renderInsert
        };
    };
})(new EJS({url: 'js/template/mainContent.ejs'}), "main-screen",
   Utilities);
