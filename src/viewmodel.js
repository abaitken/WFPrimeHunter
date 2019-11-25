import $ from 'jquery';
import ko from 'knockout';
import 'bootstrap';
import 'popper.js';
import '@fortawesome/fontawesome-free/js/all.js'
import '@fortawesome/fontawesome-free/css/all.css'
import './custom.scss';

const inventory = require("./components/inventory")(ko, $);
ko.components.register("inventory", inventory);

const relics = require("./components/relics")(ko, $);
ko.components.register("relics", relics);

const introduction = require("./components/introduction")(ko, $);
ko.components.register("introduction", introduction);

var views = [{
  name: 'INTRODUCTION',
  id: 'introduction'
},
{
  name: 'INVENTORY',
  id: 'inventory'
},
{
  name: 'RELICS',
  id: 'relics'
}];

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
  self.views = views;


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

  self.switchViewCommand = function (data) {
    self._focusContainer(data.id);
  };

  self.requiredItems = ko.observableArray();
  self.tiers = ko.observableArray();
  self.itemRelicLookup = {};

  /* INIT */
  self.Init = function () {
    ko.applyBindings(self);
    self.switchViewCommand(views[0]);

    $.ajax({
      type: "GET",
      url: 'data.json',
      dataType: "json",
      mimeType: "application/json"
    })
      .done(function (data) {

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
        self.eventRouter.raise('dataloaded', {});
      })
      .fail(function (jqXHR, textStatus, errorThrown) {
        root.errors.error(errorThrown);
      });
  };
}

var vm = new ViewModel();
vm.Init();
