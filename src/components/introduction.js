const view = require("./introduction.html");

module.exports = function (ko, $) {
    return {
        name: 'INTRODUCTION',
        viewModel: function (root) {
        },
        template: view
    };
};
