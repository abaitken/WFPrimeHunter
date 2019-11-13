const view = require("./inventory.html");

const PAGE_SIZE = 25;

function PagedItems(ko) {
    var self = this;

    self.items = ko.observableArray();
    self.pageIndex = ko.observable(0);
    self.pageCount = ko.computed(function() {
        var result = Math.floor(self.items().length / PAGE_SIZE);
        result += self.items().length % PAGE_SIZE > 0 ? 1 : 0;
        return result - 1;
    });
    
    self.pagedItems = ko.computed(function() {
        var startIndex = self.pageIndex() * PAGE_SIZE;
        return self.items.slice(startIndex, startIndex + PAGE_SIZE);
    });

};

module.exports = function (ko, $) {
    return {
        viewModel: function (root) {
            var self = this;
            self.acquired = new PagedItems(ko);
            self.required = new PagedItems(ko);

            self._moveItem = function (item, from, to) {
                var index = from.items().indexOf(item);
                from.items.splice(index, 1);
                to.items.push(item);
            };

            self.itemAcquired = function (item) {
                self._moveItem(item, self.required, self.acquired);
            };

            self.itemLost = function (item) {
                self._moveItem(item, self.acquired, self.required);
            };

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
                                name: name
                            });
                        }
                        list.sort(function (a, b) {
                            return a.name > b.name;
                        });
                        self.required.items(list);
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