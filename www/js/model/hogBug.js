var HogBug = (function(template) {

    return function(data) {

        var html = template.render(data);

        var render = function() {
            var dummyDiv = document.createElement('div');
            dummyDiv.innerHTML = html;
            return dummyDiv.firstChild;
        };

        return {
            render: render
        };
    };
})(new EJS({url: 'js/template/hogBugCard.ejs'}));

console.log(new HogBug({test: 'toimii'}).render());
