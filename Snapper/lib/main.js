// 'use strict';
/*global require: false, console: false, gBrowser: false */

let sp = require('sdk/simple-prefs');

var DEBUG = sp.prefs.DEBUG;

sp.on('DEBUG', function() {
    DEBUG = sp.prefs.DEBUG;
    console.log('DEBUG set to ' + DEBUG);
});
var data = require("sdk/self").data;
// See https://blog.mozilla.org/addons/2013/06/13/jetpack-fennec-and-nativewindow
// get a global window reference
const utils = require('sdk/window/utils');
const recent = utils.getMostRecentBrowserWindow();
if (recent.NativeWindow) {
    // Add a menu item
    var menuID = recent.NativeWindow.menu.add('Snapper', null, function(target) {
        var activeTab = require("sdk/tabs").activeTab;
        var selection = recent.getSelection();
        recent.NativeWindow.toast.show("Snap!" + (activeTab ? ('\n' + activeTab.title + '\n' + activeTab.url) : ('\nNo Title\nNo URL')) + (selection ? '\n' + selection.toString() : ''), "long");
    });
    let nw = require('./nativewindow');
    var snapperId = nw.addContextMenu({
        name: 'Snapper',
        // TODO Please report mozilla bug to the fact that Fennec contextmenu and text selection are mutually exclusive!
        context: nw.SelectorContext('a'),
        //        context: {
        //            matches: function(el) {
        //                console.log('SELECTION', (recent.getSelection() && recent.getSelection().toString()));
        //                return (recent.getSelection() && recent.getSelection().toString());
        //            }
        //        },
        callback: function(target) {
            var activeTab = require("sdk/tabs").activeTab;
            var selection = target.ownerDocument.getSelection();
            recent.NativeWindow.toast.show("Snap!" + (activeTab ? ('\n' + activeTab.title + '\n' + activeTab.url) : ('\nNo Title\nNo URL')) + (selection ? '\n' + selection.toString() : ''), "long");
            console.log(target);
        }
    });
} else {
    var cm = require("sdk/context-menu");
    cm.Item({
        label: "My Snapper",
        context: cm.URLContext("*"),
        contentScriptFile: data.url("content.js"),
        onMessage: function(data) {
            var notifications = require("sdk/notifications");
            notifications.notify({
                text: 'onMessage called with ' + JSON.stringify(data)
            });
        }
    });
    var menuitem = require("menuitems").Menuitem({
        id: "snapper",
        menuid: "menu_ToolsPopup",
        label: "Snapper",
        accesskey: 'n',
        onCommand: function() {
            var activeTab = require("sdk/tabs").activeTab;
            var info = "Snap!\n" + (activeTab ? (activeTab.title + '\n' + activeTab.url) : ('No Title' + '\n' + 'No URL'));
            if (false) {
                require("sdk/widget").Widget({
                    id: "hello-display",
                    label: "My Hello Widget",
                    content: info,
                    width: 50
                });
            } else {
                var notifications = require("sdk/notifications");
                notifications.notify({
                    text: info
                });
            }
            recent.alert(info);
        },
    });
}