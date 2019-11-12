const view = require("./relics.html");


module.exports = function (ko, $) {
    return {
        viewModel: function (root) {
            var self = this;
            self.tiers = ko.observableArray();

            self.init = function () {

                self.tiers([{
                    name: 'Axi',
                    relics: [{ name: 'A1' },
                    { name: 'A2' }
                    ]
                }, {
                    name: 'Lith',
                    relics: [{ name: 'A1' },
                    { name: 'A2' }
                    ]
                }, {
                    name: 'Neo',
                    relics: [{ name: 'A1' },
                    { name: 'A2' }
                    ]
                }, {
                    name: 'Meso',
                    relics: [{ name: 'A1' },
                    { name: 'A2' }
                    ]
                }])
                // $.ajax({
                //     type: "GET",
                //     url: 'data.json',
                //     dataType: "json",
                //     mimeType: "application/json"
                // })
                //     .done(function (data) {

                //         let list = [];
                //         for (let index = 0; index < data.itemids.length; index++) {
                //             const name = data.items[data.itemids[index]];
                //             list.push({
                //                 id: data.itemids[index],
                //                 name: name,
                //                 owned: false
                //             });
                //         }
                //         list.sort(function(a, b){
                //             return a.name > b.name;
                //         });
                //         self.tiers(list);
                //     })
                //     .fail(function (jqXHR, textStatus, errorThrown) {
                //         root.errors.error(errorThrown);
                //     });
            };

            self.onRoutedEvent = function (eventName, args) {

            };

            root.eventRouter.subscribe(self.onRoutedEvent);
            self.init();
        },
        template: view
    };
};