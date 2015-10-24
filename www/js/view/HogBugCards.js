var HogBugCards = (function(template) {

    return function(dataOrigin, outputElemId, gestureCallback) {

        var makeDomNode = function(htmlString) {

            var dummyNode = document.createElement("div");
            dummyNode.innerHTML = htmlString;

            return dummyNode.firstChild;
        };

        var dataSource = dataOrigin;

        var setDataSource = function(freshDataSource) {
            dataSource = freshDataSource;
        };

        var docLocation = document.getElementById(outputElemId);

        var renderTemplate = function(hogBugsArray) {

            return template.render(hogBugsArray);
        };

        var makeModels = function(rawData) {

            var result = {
                running: [],
                rest: []
            };

            for(var key in rawData) {
                var model = new HogBug(rawData[key]);

                if(model.getRunning()) {
                    result.running.push(model);
                } else {
                    result.rest.push(model);
                }

            }

            return result;
        };

        var renderModels = function(categories) {

            var morphToHTML = function(model) {
                return model.render();
            };

            return {
                running: categories.running.map(morphToHTML),
                rest: categories.rest.map(morphToHTML)
            };
        };

        var renderAsyncSource = function(sourceCallback) {
            return function(onResultCallback, onNodesCallback) {
                sourceCallback(function(data) {
                    var models = makeModels(data);
                    var result = renderTemplate(renderModels(models));

                    if(onResultCallback) {
                        onResultCallback(result);
                    }

                    if(onNodesCallback) {
                        onNodesCallback(models);
                    }
                });
            };
        };

        var renderAsync = (function(sourceCallback) {
            return renderAsyncSource(sourceCallback);
        })(dataSource);

        var renderInsert = function() {
            renderAsync(function(renderedTemplate) {

                var node = makeDomNode(renderedTemplate);
                docLocation.appendChild(node);

            }, function(models) {

                var applyActions = function(model) {
                    console.log(model.getFields());
                    var nodeId = model.getId();

                    var actualNode = document.getElementById(nodeId);
                    console.log(nodeId, actualNode);
                    if(window.localStorage.getItem(nodeId)
                       === 'dismissed') {
                        actualNode.style.display = 'none';
                    } else {
                        gestureCallback(actualNode);
                    }

                };

                for(var keyRunning in models.running) {
                    applyActions(models.running[keyRunning]);
                }

                for(var keyRest in models.rest) {
                    applyActions(models.rest[keyRest]);
                }
            });
        };

        return {
            renderAsync: renderAsync,
            renderInsert: renderInsert,
            setDataSource: setDataSource
        };
    };
})(new EJS({url: 'js/template/hogBugListing.ejs'}));
