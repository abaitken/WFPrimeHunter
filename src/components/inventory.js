const view = require("./inventory.html");

const PAGE_SIZE = 25;

function PagedItems(ko) {
    var self = this;

    self.items = ko.observableArray();
    self.pageIndex = ko.observable(0);
    self.pageCount = ko.computed(function () {
        var result = Math.floor(self.items().length / PAGE_SIZE);
        result += self.items().length % PAGE_SIZE > 0 ? 1 : 0;
        return result - 1;
    });
    self.pages = ko.computed(function () {
        let result = [];
        for (let index = 0; index <= self.pageCount(); index++) {
            result.push(index + 1);
        }
        return result;
    });

    self.gotoPage = function (pageNumber) {
        self.pageIndex(pageNumber - 1);
    };

    self.pagedItems = ko.computed(function () {
        var startIndex = self.pageIndex() * PAGE_SIZE;
        return self.items.slice(startIndex, startIndex + PAGE_SIZE);
    });

    self.hasPrevious = ko.computed(function () {
        return self.pageIndex() !== 0;
    });

    self.hasNext = ko.computed(function () {
        return self.pageIndex() !== self.pageCount();
    });

    self.next = function () {
        if (self.pageIndex() < self.pageCount()) {
            self.pageIndex(self.pageIndex() + 1);
        }
    }

    self.previous = function () {
        if (self.pageIndex() != 0) {
            self.pageIndex(self.pageIndex() - 1);
        }
    }

    self.addItem = function (item) {
        self.items.push(item);
    };

    self.removeItem = function (item) {
        var index = self.items().indexOf(item);
        self.items.splice(index, 1);
    };
};

module.exports = function (ko, $) {
    return {
        viewModel: function (root) {
            var self = this;
            self.acquired = new PagedItems(ko);
            self.required = new PagedItems(ko);

            self._moveItem = function (item, from, to) {
                from.removeItem(item);
                to.addItem(item);
            };

            self.itemAcquired = function (item) {                
                self.required.removeItem(item);
                self.acquired.addItem(item);
            };

            self.itemLost = function (item) {
                self.acquired.removeItem(item);
                self.required.addItem(item);
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