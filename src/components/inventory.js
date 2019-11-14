const view = require("./inventory.html");

const PAGE_SIZE = 15;

function StringContainsCaseInsensitive(haystack, needle) {
    return haystack.toLowerCase().indexOf(needle.toLowerCase()) !== -1;
}

function PagedItems(ko, filter, root, items) {

    var self = this;
    self.items = items;

    self.filteredItems = ko.computed(function () {
        if (!filter()) {
            return self.items();
        } else {
            return ko.utils.arrayFilter(self.items(), function (item) {
                return StringContainsCaseInsensitive(item.name, filter());
            });
        }
    });

    self.pageIndex = ko.observable(0);
    self.pageCount = ko.computed(function () {
        var result = Math.floor(self.filteredItems().length / PAGE_SIZE);
        result += self.filteredItems().length % PAGE_SIZE > 0 ? 1 : 0;
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
        return self.filteredItems().slice(startIndex, startIndex + PAGE_SIZE);
    });

    self.updateCurrentPage = function () {
        var pageCount = self.pageCount();
        if(self.pageIndex() >= pageCount)
            self.pageIndex(pageCount);
    };

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
        self.items.sort(root.ItemSortComparer);
    };

    self.addPage = function (items) {
        for (let index = 0; index < items.length; index++) {
            const item = items[index];
            self.items.push(item);
        }
        self.items.sort(root.ItemSortComparer);
    };

    self.removeItem = function (item) {
        var index = self.items().indexOf(item);
        self.items.splice(index, 1);
        self.updateCurrentPage();
    };

    self.removePage = function () {
        if (!filter()) {
            var startIndex = self.pageIndex() * PAGE_SIZE;
            var result = self.items.splice(startIndex, startIndex + PAGE_SIZE);
            self.updateCurrentPage();
            return result;
        }
        else {
            var result = self.pagedItems();

            for (let index = 0; index < result.length; index++) {
                const item = result[index];
                self.removeItem(item);
            }

            self.updateCurrentPage();
            return result;
        }
    };
};

module.exports = function (ko, $) {
    return {
        viewModel: function (root) {

            ko.bindingHandlers.relics = {
                init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                    var relics = valueAccessor();
                    let result = "";

                    for (let index = 0; index < relics.length; index++) {
                        const relic = relics[index];

                        if (result.length > 0)
                            result += ', ';
                        result += relic.tier + ' ' + relic.name + ': ' + relic.rarity;
                    }

                    $(element).text('(' + result + ')');
                },
                update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                }
            };

            var self = this;
            self.filterText = ko.observable();
            self.acquired = new PagedItems(ko, self.filterText, root, ko.observableArray());
            self.required = new PagedItems(ko, self.filterText, root, root.requiredItems);

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

            self.pageAcquired = function () {
                var items = self.required.removePage();
                self.acquired.addPage(items);
            };

            self.pageLost = function (item) {
                var items = self.acquired.removePage();
                self.required.addPage(items);
            };

            self.clearFilter = function () {
                self.filterText('');
            };

            self.onRoutedEvent = function (eventName, args) {

            };

            root.eventRouter.subscribe(self.onRoutedEvent);
        },
        template: view
    };
};