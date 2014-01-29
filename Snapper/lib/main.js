// 'use strict';
/*global require: false, console: false, gBrowser: false */

let sp = require('sdk/simple-prefs');

//var DEBUG = sp.prefs.DEBUG;
//var DATE_FORMAT = sp.prefs.DATE_FORMAT;
//var INFORMATION_FORMAT = sp.prefs.INFORMATION_FORMAT;

//sp.on('DEBUG', function() {
//    DEBUG = sp.prefs.DEBUG;
//    console.log('DEBUG set to ' + DEBUG);
//});
//sp.on('DATE_FORMAT', function() {
//    DATE_FORMAT = sp.prefs.DATE_FORMAT;
//    console.log('DEBUG set to ' + DATE_FORMAT);
//});
//sp.on('INFORMATION_FORMAT', function() {
//    INFORMATION_FORMAT = sp.prefs.INFORMATION_FORMAT;
//    console.log('DEBUG set to ' + INFORMATION_FORMAT);
//});
var data = require("sdk/self").data;
// See https://blog.mozilla.org/addons/2013/06/13/jetpack-fennec-and-nativewindow
// get a global window reference
const utils = require('sdk/window/utils');
const recent = utils.getMostRecentBrowserWindow();

var openSnapperTab = function(data) {
    var tabs = require("sdk/tabs");
    var self = require("sdk/self");
    if (data.now && data.title && data.url) {
        function runScript(tab) {
            var worker = tab.attach({
                contentScriptFile: self.data.url('display.js')
            });
            worker.port.emit("display", data);
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