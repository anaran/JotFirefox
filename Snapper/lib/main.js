// 'use strict';
/*global require: false, console: false, gBrowser: false, URL: false */

let sp = require('sdk/simple-prefs');
let self = require('sdk/self');
let notifications = require("sdk/notifications");
var data = self.data;

var consoleLogLevel = sp.prefs.consoleLogLevel;
var DATEFORMAT = sp.prefs.DATEFORMAT;
var INFOFORMAT = sp.prefs.INFOFORMAT;

sp.on('consoleLogLevel', function() {
    consoleLogLevel = sp.prefs.consoleLogLevel;
    var name = "extensions." + self.id + ".sdk.console.logLevel";
    // TODO Using error to make sure message will always be visible -- not ideal.
    console.error('Setting log level for ' + self.name + ' version ' + self.version + ' to ' + consoleLogLevel);
    require("sdk/preferences/service").set(name, consoleLogLevel);
});
//sp.on('DATE_FORMAT', function() {
//    DATE_FORMAT = sp.prefs.DATE_FORMAT;
//    console.log('DEBUG set to ' + DATE_FORMAT);
//});
//sp.on('INFORMATION_FORMAT', function() {
//    INFORMATION_FORMAT = sp.prefs.INFORMATION_FORMAT;
//    console.log('DEBUG set to ' + INFORMATION_FORMAT);
//});
// See https://blog.mozilla.org/addons/2013/06/13/jetpack-fennec-and-nativewindow
// get a global window reference
const utils = require('sdk/window/utils');
const recent = utils.getMostRecentBrowserWindow();

var snapperStorage = require("sdk/simple-storage");
var openSnapperTab = function(data) {
    snapperStorage.on("OverQuota", function() {
        //  while (ss.snapperStorage > 1)
        //    ss.storage.myList.pop();
        console.log('snapperStorage.quotaUsage:', snapperStorage.quotaUsage);
    });
    var tabs = require("sdk/tabs");
    if (data.now && data.title && data.url) {
        function runScript(tab) {
            var worker = tab.attach({
                contentScriptFile: self.data.url('display.js')
            });
            worker.port.emit("display", data);
            worker.port.on('save', function(data) {
                console.log('snapperStorage.quotaUsage:', snapperStorage.quotaUsage);
                if (!snapperStorage.storage.entries) {
                    snapperStorage.storage.entries = [];
                }
                console.log(snapperStorage.storage.entries);
                for (var i = 0, len = snapperStorage.storage.entries.length; i < len; i++) {
                    if (JSON.stringify(snapperStorage.storage.entries[i]) === JSON.stringify(data)) {
                        notifications.notify({
                            text: 'Already saved (skipping) ' + JSON.stringify(data)
                        });
                        return;
                    }
                }
                notifications.notify({
                    text: 'Saving ' + JSON.stringify(data)
                });
                snapperStorage.storage.entries.push(data);
                console.log(snapperStorage.storage.entries);
            });
            worker.port.on('download', function(data) {
                var filename = self.name + snapperStorage.storage.entries.length + '@' + Date.now() + '.txt';
                console.log('snapperStorage.quotaUsage:', snapperStorage.quotaUsage);
                console.log(JSON.stringify(snapperStorage.storage.entries));
                if ( !! snapperStorage.storage.entries) {
                    notifications.notify({
                        text: 'Downloading ' + filename
                    });
                    worker.port.emit("entries", {
                        entries: snapperStorage.storage.entries,
                        filename: filename
                    });
                }
            });
        }
        tabs.open({
            url: self.data.url('display.html'),
            onReady: runScript
        });
    }
};
if (recent.NativeWindow) {
    let nw = require('./nativewindow');
    var snapperId = nw.addContextMenu({
        name: 'Snapper',
        // TODO Please report mozilla bug to the fact that Fennec contextmenu and text selection are mutually exclusive!
        context: nw.SelectorContext('a'),
        callback: function(target) {
            var activeTab = require("sdk/tabs").activeTab;
            var selection = target.ownerDocument.getSelection();
            var data = {
                now: Date.now(),
                selection: selection.toString(),
                title: activeTab.title,
                url: activeTab.url
            };
            //recent.NativeWindow.toast.show("Snap!" + (activeTab ? ('\n' + activeTab.title + '\n' + activeTab.url) : ('\nNo Title\nNo URL')) + (selection ? '\n' + selection.toString() : ''), "long");
            console.log(target);
            openSnapperTab(data);
        }
    });
} else {
    var cm = require("sdk/context-menu");
    cm.Item({
        label: "Snapper",
        context: cm.URLContext("*"),
        contentScriptFile: data.url("content.js"),
        onMessage: function(data) {
            var notifications = require("sdk/notifications");
            openSnapperTab(data);
        },
        data: 'snap'
    });
}