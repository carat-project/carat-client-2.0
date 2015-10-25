var HogBugCards = (function(template, utilities) {

    return function(dataOrigin, outputElemId, gestureCallback) {

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
            return function(onResultCallback, onModelsCallback) {
                sourceCallback(function(data) {
                    var models = makeModels(data);
                    var result = renderTemplate(renderModels(models));

                    if(onResultCallback) {
                        onResultCallback(result);
                    }

                    if(onModelsCallback) {
                        onModelsCallback(models);
                    }
                });
            };
        };

        var renderAsync = (function(sourceCallback) {
            return renderAsyncSource(sourceCallback);
        })(dataSource);

        var renderInsert = function() {
            renderAsync(function(renderedTemplate) {

                var node = utilities.makeDomNode(renderedTemplate);
                docLocation.appendChild(node);

            }, function(models) {

                var applyActions = function(model) {
                    var nodeId = model.getId();

                    var actualNode = document.getElementById(nodeId);
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
})(new EJS({url: 'js/template/hogBugListing.ejs'}), Utilities);
