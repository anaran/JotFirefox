'use strict';
/*global require: false */
var cm = require("sdk/context-menu");
var selection = require("sdk/selection");
var notifications = require("sdk/notifications");
var textSelections = [];

if (!selection.isContiguous) {
    for (var subselection in selection) {
        textSelections.push(subselection.text);
    }
} else {
    textSelections.push(selection.text);
}

cm.Item({
    label: "Snap Information",
    // context: /* New in Firefox 29 */ PredicateContext(function(context) { return true; }),
    contentScript: 'self.on("click", function (node, data) {' +
        '  self.postMessage({date: Date.now(), url: document.URL, "node": node, "data": data });' +
        '});',
    onMessage: function(message) {
        // /* window is not defined */ window.alert(message);
        notifications.notify({
            title: "Snapped Information",
            text: JSON.stringify(message)
            // data: "did gyre and gimble in the wabe",
            /* onClick: function (data) {
    console.log(data);
    // console.log(this.data) would produce the same result.
  } */
        });
        // console.log('onMessage', message);
    }
});