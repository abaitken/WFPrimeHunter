function RewardsViewModel(root) {
    ko.bindingHandlers.rewardClass = {
        init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
            var rarity = valueAccessor();
            $(element).addClass('reward' + rarity);
        },
        update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        }
    };

    var self = this;
    self.tiers = root.tiers;

    self.tiersNavigation = ko.computed(function () {
        let result = [];

        if (self.tiers() !== undefined)
            for (let index = 0; index < self.tiers().length; index++) {
                const tier = self.tiers()[index];
                result.push({
                    name: tier.name,
                    link: '#' + tier.name
                })
            }

        return result;
    });

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
                if (tierLookup[relic.tier].relics[relic.name] === undefined) {
                    tierLookup[relic.tier].relics[relic.name] = result[tierIndex].relics.length;
                    result[tierIndex].relics.push({
                        name: relic.name,
                        items: []
                    });
                }

                var relicIndex = tierLookup[relic.tier].relics[relic.name];
                result[tierIndex].relics[relicIndex].items.push({
                    name: requiredItem.name,
                    rarity: relic.rarity
                });
            }
        }

        result.sort(function (a, b) {
            return a.name > b.name ? 1 : -1;
        });

        for (let index = 0; index < result.length; index++) {
            const tier = result[index];
            tier.relics.sort(function (a, b) {
                return a.name > b.name ? 1 : -1;
            });

            for (let j = 0; j < tier.relics.length; j++) {
                const relic = tier.relics[j];
                relic.items.sort(function (a, b) {

                    if (a.rarity == b.rarity)
                        return a.name > b.name ? 1 : -1;

                    return a.rarity > b.rarity ? 1 : -1;
                });
            }
        }
        return result;
    });

    self.onRoutedEvent = function (eventName, args) {

    };

    root.eventRouter.subscribe(self.onRoutedEvent);
}