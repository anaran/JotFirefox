// 'use strict';
/*global require: false, console: false, gBrowser: false, URL: false */

let sp = require('sdk/simple-prefs');
let self = require('sdk/self');
var data = self.data;

var DEBUG = sp.prefs.DEBUG;
var DATEFORMAT = sp.prefs.DATEFORMAT;
var INFOFORMAT = sp.prefs.INFOFORMAT;

sp.on('DEBUG', function() {
    DEBUG = sp.prefs.DEBUG;
    var name = "extensions." + self.id + ".sdk.console.logLevel";
    // TODO Using error to make sure message will always be visible -- not ideal.
    console.error('Setting log level for ' + self.name + ' version ' + self.version + ' to ' + (DEBUG ? 'all' : 'error'));
    require("sdk/preferences/service").set(name, (DEBUG ? 'all' : 'error'));
});
sp.on('download', function() {
    console.error('Downloading data for ' + self.name + ' version ' + self.version + ' in JSON format.');
                console.log(snapperStorage.storage.entries);
                var blob = new recent.Blob([JSON.stringify(snapperStorage.storage.entries, null, 4)], {
                    'type': 'text/utf-8'
                });
                var myDocument = recent.document;
                var a = myDocument.createElement('a');
                a.href = recent.URL.createObjectURL(blob);
                a.download = self.name + '@' + Date.now() + '.txt';
                a.textContent = 'Download ' + self.name + ' data';
                console.dir(a);
                console.dir(document);
                console.dir(window);
                console.dir(recent);
                //recent.document.body.appendChild(a);
                // a.click();
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
                snapperStorage.storage.entries.push(data);
                console.log(snapperStorage.storage.entries);
            });
            worker.port.on('download', function(data) {
                console.log('snapperStorage.quotaUsage:', snapperStorage.quotaUsage);
            worker.port.emit("entries", {entries: snapperStorage.storage.entries});
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