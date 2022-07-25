function loadScript(url) {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: url,
      dataType: "script",
      success: function (data) {
        resolve(data);
      },
      error: function (error) {
        reject(error);
      }
    });
  });
}

function loadView(url) {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: url,
      dataType: 'html',
      success: function (data) {
        resolve(data);
      },
      error: function (error) {
        reject(error);
      }
    });
  });
}

function loadData(url) {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "GET",
      url: url,
      dataType: "json",
      mimeType: "application/json",
      success: function (data) {
        resolve(data);
      },
      error: function (error) {
        reject(error);
      }
    });
  });
}

ko.bindingHandlers.commandId = {
  init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
    var value = valueAccessor();
    $(element).attr('id', value + 'Command');
  },
  update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
  }
};
ko.bindingHandlers.containerId = {
  init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
    var value = valueAccessor();
    $(element).attr('id', value + 'Container');
  },
  update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
  }
};

function EventRouter() {
  this.subscribers = [];
  this.subscribe = function (callback) {
    this.subscribers.push(callback);
  };
  this.raise = function (eventName, args) {
    for (let index = 0; index < this.subscribers.length; index++) {
      const subscriber = this.subscribers[index];
      subscriber(eventName, args);
    }
  };
}

var ERROR_TYPES = {
  ERROR: 0,
  INFO: 1
};
function ErrorHandling() {
  this.ERROR_TYPES = ERROR_TYPES;
  this.messages = ko.observableArray([]);
  this.error = function (text) {
    console.error(text);
    this.messages.push({
      text: text,
      type: ERROR_TYPES.ERROR
    })
  };
  this.info = function (text) {
    console.log(text);
    this.messages.push({
      text: text,
      type: ERROR_TYPES.INFO
    })
  };
}

function ViewModel() {
  var self = this;

  /* Reusable Fns */
  self.ItemSortComparer = function (a, b) {
    return a.name > b.name ? 1 : -1;
  };

  self.eventRouter = new EventRouter();
  self.errors = new ErrorHandling();
  self.views = [];


  self.indexOfArrayEx = function (array, propertyName, value) {
    for (let index = 0; index < array.length; index++) {
      const element = array[index];
      if (element[propertyName] === value)
        return index;
    }

    return -1;
  };

  /* Page/Navigation */
  self._focusContainer = function (containerPrefix) {
    const selectedClass = 'active';
    $('.viewCommand').removeClass(selectedClass);
    $('.viewContainer').hide();

    $('#' + containerPrefix + 'Command').addClass(selectedClass);
    $('#' + containerPrefix + 'Container').show();
  };

  self.switchViewCommand = function (view) {
    self._focusContainer(view.id);
  };

  self.requiredItems = ko.observableArray();
  self.tiers = ko.observableArray();
  self.itemRelicLookup = {};

  /* INIT */
  self.Init = function () {

    let components = [
      {
        id: 'introduction',
        model: IntroductionViewModel
      },
      {
        id: 'inventory',
        model: InventoryViewModel
      },
      {
        id: 'rewards',
        model: RewardsViewModel
      },
      {
        id: 'relics',
        model: RelicsViewModel
      }
    ];

    let promises = [];

    let loadComponent = function (componentDef) {
      return new Promise((resolve, reject) => {
        loadView('components/' + componentDef.id + '.html')
          .then((view) => {
            // loadScript('components/' + componentId + '.js')
            //   .then((script) => {
            //   });
            resolve({
              id: componentDef.id,
              name: componentDef.id.toUpperCase(),
              viewModel: componentDef.model,
              template: view
            });
          });
      });
    };

    for (let index = 0; index < components.length; index++) {
      let componentDef = components[index];
      promises.push(loadComponent(componentDef));
    }

    Promise.all(promises)
      .then((values) => {
        values.forEach(component => {
          ko.components.register(component.id, component);

          self.views.push({
            id: component.id,
            name: component.name
          });
        });

        loadData('data.json')
          .then((data) => {
            self.itemRelicLookup = data.items;
            let list = [];
            for (let index = 0; index < data.itemids.length; index++) {
              const id = data.itemids[index];
              const item = self.itemRelicLookup[id];

              list.push({
                id: id,
                name: item.name,
                relics: item.relics
              });
            }
            list.sort(self.ItemSortComparer);
            self.requiredItems(list);

            self.tiers(data.tiers);

            ko.applyBindings(self);
            self.switchViewCommand(self.views[0]);
            self.eventRouter.raise('dataloaded', {});
          })
          .catch((jqXHR, textStatus, errorThrown) => {
            root.errors.error(errorThrown);
          });
      });
  };
}

let vm = new ViewModel();
vm.Init();