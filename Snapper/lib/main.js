// 'use strict';
/*global require: false */
var cm = require("sdk/context-menu");
var data = require("sdk/self").data;
var selection = require("sdk/selection");
var notifications = require("sdk/notifications");
var pageMod = require("sdk/page-mod");
pageMod.PageMod({
    include: ['*'],
    contentScriptWhen: 'ready',
     attachTo: ["existing", "top"],
  onAttach: function(worker) {
//    worker.port.emit("getElements", tag);
    worker.port.emit("welcome", 'content');
    worker.port.on("hello", function(reply) {
        console.log(reply);
    });
    worker.port.on("contextmenu", function(reply) {
        console.log("contextmenu", reply);
    });
  },
    contentScriptFile: data.url("content.js")
});
var textSelections = [];

if (!selection.isContiguous) {
    for (var subselection in selection) {
        textSelections.push(subselection.text);
    }
} else {
    textSelections.push(selection.text);
}

//cm.Item({
//    label: "Snap Information",
//    // context: /* New in Firefox 29 */ PredicateContext(function(context) { return true; }),
//    contentScriptFile: data.url('context-menu.js'),
//    onMessage: function(message) {
//        // /* window is not defined */ window.alert(message);
//        notifications.notify({
//            title: "Snapped Information",
//            text: JSON.stringify(message)
//            // data: "did gyre and gimble in the wabe",
//            /* onClick: function (data) {
//    console.log(data);
//    // console.log(this.data) would produce the same result.
//  } */
//        });
//        // console.log('onMessage', message);
//    }
//});