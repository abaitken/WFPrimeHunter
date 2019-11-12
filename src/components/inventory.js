const view = require("./inventory.html");


module.exports = function (ko, $) {
    return {
        viewModel: function (root) {
            var self = this;
            self.items = ko.observableArray();

            self.init = function () {

                $.ajax({
                    type: "GET",
                    url: 'data.json',
                    dataType: "json",
                    mimeType: "application/json"
                })
                    .done(function (data) {

                        let list = [];
                        for (let index = 0; index < data.itemids.length; index++) {
                            const name = data.items[data.itemids[index]];
                            list.push({
                                id: data.itemids[index],
                                name: name,
                                owned: false
                            });
                        }
                        list.sort(function(a, b){
                            return a.name > b.name;
                        });
                        self.items(list);
                    })
                    .fail(function (jqXHR, textStatus, errorThrown) {
                        root.errors.error(errorThrown);
                    });
            };

            self.onRoutedEvent = function (eventName, args) {

            };

            root.eventRouter.subscribe(self.onRoutedEvent);
            self.init();
        },
        template: view
    };
};