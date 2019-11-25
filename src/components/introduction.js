const view = require("./introduction.html");

module.exports = function (ko, $) {
    return {
        viewModel: function (root) {
        },
        template: view
    };
};
