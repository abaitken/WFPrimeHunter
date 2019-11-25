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
        let pageCount = self.pageCount();
        if (pageCount < 0)
            return result;

        let currentIndex = self.pageIndex();
        var startIndex = pageCount <= 10 || currentIndex <= 5
            ? 0
            : Math.min(Math.max(currentIndex - 5, 0), 10);

        var endIndex = pageCount <= 10 || pageCount - currentIndex <= 5
            ? pageCount
            : Math.max(Math.min(currentIndex + 5, pageCount), 10);

        for (let index = startIndex; index <= endIndex; index++) {
            result.push({
                text: index + 1,
                pageNumber: index + 1,
                isActive: currentIndex === index
            });
        }

        return result;
    });

    self.gotoPage = function (page) {
        self.pageIndex(page.pageNumber - 1);
    };

    self.pagedItems = ko.computed(function () {
        var startIndex = self.pageIndex() * PAGE_SIZE;
        return self.filteredItems().slice(startIndex, startIndex + PAGE_SIZE);
    });

    self.updateCurrentPage = function () {
        var pageCount = self.pageCount();
        var pageIndex = self.pageIndex();

        if (pageIndex >= pageCount)
            self.pageIndex(pageCount);
        else if (pageIndex <= 0)
            self.pageIndex(0);
        else
            self.pageIndex(pageIndex);
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
        if (self.pageIndex() > 0) {
            self.pageIndex(self.pageIndex() - 1);
        }
    }

    self.addItem = function (item) {
        self.items.push(item);
        self.items.sort(root.ItemSortComparer);
    };

    self.addPage = function (items) {
        ko.utils.arrayPushAll(self.items, items);
        self.items.sort(root.ItemSortComparer);
        self.updateCurrentPage();
    };

    self.removeItem = function (item, update) {
        if (update === undefined) update = true;

        var index = self.items().indexOf(item);
        self.items.splice(index, 1);

        if (update)
            self.updateCurrentPage();
    };

    self.removePage = function () {
        if (!filter()) {
            var startIndex = self.pageIndex() * PAGE_SIZE;
            var result = self.items.splice(startIndex, PAGE_SIZE);
            self.updateCurrentPage();
            return result;
        }
        else {
            var result = self.pagedItems();

            for (let index = 0; index < result.length; index++) {
                const item = result[index];
                self.removeItem(item, false);
            }

            self.updateCurrentPage();
            return result;
        }
    };
};

function Range() {
    var self = this;
    self.from = -1;
    self.to = -1;
    self.length = function () {
        return self.to - self.from + 1;
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
            ko.bindingHandlers.activePage = {
                init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                    var value = valueAccessor();

                    if (value.isActive)
                        $(element).addClass('active');
                    else
                        $(element).removeClass('active');
                },
                update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                }
            };

            var self = this;
            self.filterText = ko.observable();

            self.filterText.subscribe(function () {
                self.acquired.pageIndex(0);
                self.required.pageIndex(0);
            });

            self.acquired = new PagedItems(ko, self.filterText, root, ko.observableArray());
            self.required = new PagedItems(ko, self.filterText, root, root.requiredItems);

            self.itemAcquired = function (item) {
                self.required.removeItem(item);
                self.acquired.addItem(item);
                //self.saveData();
            };

            self.itemLost = function (item) {
                self.acquired.removeItem(item);
                self.required.addItem(item);
                //self.saveData();
            };

            self.pageAcquired = function () {
                var items = self.required.removePage();
                self.acquired.addPage(items);
                //self.saveData();
            };

            self.pageLost = function (item) {
                var items = self.acquired.removePage();
                self.required.addPage(items);
                //self.saveData();
            };

            self.clearFilter = function () {
                self.filterText('');
            };

            self.loadData = function () {
                let storedacquiredIds = localStorage.getItem('acquiredIds');

                if (!storedacquiredIds)
                    return;

                var acquiredIds = JSON.parse(storedacquiredIds);
                let acquiredItems = [];
                let removeRanges = [];

                let currentRange = new Range();

                for (let index = 0; index < self.required.items().length; index++) {
                    const item = self.required.items()[index];
                    if (acquiredIds[item.id]) {

                        if (currentRange.from == -1) {
                            currentRange.from = index;
                        }
                        currentRange.to = index;

                        acquiredItems.push(item);
                    }
                    else if (currentRange.from != -1) {
                        removeRanges.push(currentRange);
                        currentRange = new Range();
                    }
                }

                if (currentRange.from != -1)
                    removeRanges.push(currentRange);

                for (let index = removeRanges.length - 1; index >= 0; index--) {
                    const range = removeRanges[index];
                    self.required.items.splice(range.from, range.length());
                }

                self.acquired.addPage(acquiredItems);
            };

            self.saveData = function () {
                let acquiredIds = {};
                for (let index = 0; index < self.acquired.items().length; index++) {
                    const item = self.acquired.items()[index];
                    acquiredIds[item.id] = true;
                }
                var storeJson = JSON.stringify(acquiredIds);
                localStorage.setItem('acquiredIds', storeJson);
                let savedTextElement = $('#savedText');
                savedTextElement.removeClass(['hide', 'fade-hide']);
                setTimeout(function () {
                    savedTextElement.addClass(['fade-hide']);
                }, 2000);
            };

            self.clearData = function () {
                localStorage.clear();
                let savedTextElement = $('#savedText');
                savedTextElement.removeClass(['hide', 'fade-hide']);
                setTimeout(function () {
                    savedTextElement.addClass(['fade-hide']);
                }, 2000);
            };

            self.onRoutedEvent = function (eventName, args) {
                switch (eventName) {
                    case 'dataloaded':
                        self.loadData();
                        break;
                }
            };

            root.eventRouter.subscribe(self.onRoutedEvent);
        },
        template: view
    };
};