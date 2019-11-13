const view = require("./relics.html");


module.exports = function (ko, $) {
    return {
        viewModel: function (root) {
            var self = this;
            self.tiers = root.tiers;

            self.filteredRelics = ko.computed(function () {
                if (!root.requiredItems())
                    return self.tiers();

                let tierLookup = {};
                let result = [];

                for (let index = 0; index < root.requiredItems().length; index++) {
                    const requiredItem = root.requiredItems()[index];
                    const relics = root.itemRelicLookup[requiredItem.id].relics;

                    for (let r = 0; r < relics.length; r++) {
                        const relic = relics[r];

                        if (!tierLookup[relic.tier]) {
                            tierLookup[relic.tier] = {
                                index: result.length,
                                relics: {}
                            };
                            result.push({
                                name: relic.tier,
                                relics: []
                            });
                        }

                        var tierIndex = tierLookup[relic.tier].index;
                        if (!tierLookup[relic.tier].relics[relic.name]) {
                            tierLookup[relic.tier].relics[relic.name] = true;
                            result[tierIndex].relics.push(relic.name);
                            result[tierIndex].relics.sort();
                        }
                    }
                }

                result.sort(function (a, b) {
                    return a.name > b.name ? 1 : -1;
                });
                return result;
            });

            self.onRoutedEvent = function (eventName, args) {

            };

            root.eventRouter.subscribe(self.onRoutedEvent);
        },
        template: view
    };
};