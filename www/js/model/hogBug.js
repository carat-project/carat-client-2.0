var HogBug = (function(template) {

    return function(data) {

        var html = template.render(data);

        var render = function() {
            return html;
        };
    };
})();
