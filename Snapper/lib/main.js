// 'use strict';
/*global require: false, console: false, gBrowser: false */
// var cm = require("sdk/context-menu");
var data = require("sdk/self").data;
// var selection = require("sdk/selection");
// var notifications = require("sdk/notifications");
var pageMod = require("sdk/page-mod");
pageMod.PageMod({
    include: ['*'],
    contentScriptWhen: 'end',
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
// See https://blog.mozilla.org/addons/2013/06/13/jetpack-fennec-and-nativewindow
// get a global window reference
const utils = require('sdk/window/utils');
const recent = utils.getMostRecentBrowserWindow();
if (recent.NativeWindow) {
    // Add a menu item
    // var menuID = recent.NativeWindow.menu.add(label, icon, callback);
    var menuID = recent.NativeWindow.menu.add('Snapper', null, function() {
        var activeTab = require("sdk/tabs").activeTab;
        // var activeTab = undefined;
        // recent.NativeWindow.toast.show("Snap!", "long");
        recent.NativeWindow.toast.show("Snap!\n" + (activeTab ? (activeTab.title + '\n' + activeTab.url) : ('No Title' + '\n' + 'No URL')), "long");
        // activeTab.attach({
        //       contentScript:
        //         'displayInformation();'
        //   });
        // Show a doorhanger
        // recent.NativeWindow.doorhanger.show(message, value, buttons, tabID, options);

        // add a context menu item
        // var contextMenuID = recent.NativeWindow.contextmenu.add(label, selector, callback);

        // show a 'toast' notification
        // recent.NativeWindow.toast.show(message, duration);
        // See https://gist.github.com/canuckistani/7559147/raw/d23d43f2a8a1cfafb14dda44452278aa77e45cd6/tools-menu-hack.js
        //    require("tools-menu-hack").addMenuItem('Snapper', function() {
        //        worker.port.emit("display", 'information');
        //    });
    });
} else {
    var menuitem = require("menuitems").Menuitem({
        id: "snapper",
        menuid: "menu_ToolsPopup",
        label: "Snapper",
        accesskey: 'n',
        onCommand: function() {
            var activeTab = require("sdk/tabs").activeTab;
            // var activeTab = undefined;
            // recent.NativeWindow.toast.show("Snap!", "long");
            recent.alert("Snap!\n" + (activeTab ? (activeTab.title + '\n' + activeTab.url) : ('No Title' + '\n' + 'No URL')), "long");
            //            worker.port.emit("display", 'information');
            //            console.log("clicked");
        },
        // insertbefore: "menu_pageInfo"
    });
}