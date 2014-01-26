// 'use strict';
/*global require: false, console: false, gBrowser: false */

let sp = require('sdk/simple-prefs');

var DEBUG = sp.prefs.DEBUG;
var DATE_FORMAT = sp.prefs.DATE_FORMAT;
var INFORMATION_FORMAT = sp.prefs.INFORMATION_FORMAT;

sp.on('DEBUG', function() {
    DEBUG = sp.prefs.DEBUG;
    console.log('DEBUG set to ' + DEBUG);
});
sp.on('DATE_FORMAT', function() {
    DATE_FORMAT = sp.prefs.DATE_FORMAT;
    console.log('DEBUG set to ' + DATE_FORMAT);
});
sp.on('INFORMATION_FORMAT', function() {
    INFORMATION_FORMAT = sp.prefs.INFORMATION_FORMAT;
    console.log('DEBUG set to ' + INFORMATION_FORMAT);
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
        label: "Snapper",
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

// Modified version of my own function from popchrom in
// https://code.google.com/p/trnsfrmr/source/browse/Transformer/scripts/date.js?name=v1.8#92
function replaceDates(format, date) {
    var d = date || new Date();
    if (d instanceof Date && !isNaN(d.getTime())) {} else {
        console.error('%o is not a valid Date', d);
        return format;
    };
    //	TODO getDay() returns the day of week,
    //	see http://www.ecma-international.org/ecma-262/5.1/#sec-15.9.5.16
    format = format.replace(/(?:%DAY%|%d)/, (d.getDate() < 10) ? "0" + d.getDate() : d.getDate()); //$NON-NLS-0$
    var month = d.getMonth() + 1;
    format = format.replace(/(?:%MONTH%|%m)/, (month < 10) ? "0" + month : month); //$NON-NLS-0$
    format = format.replace(/(?:%YEAR%|%Y)/, d.getFullYear());
    var hours = d.getHours();
    format = format.replace(/%H/, (hours < 10) ? "0" + hours : hours); //$NON-NLS-0$
    var minutes = d.getMinutes();
    format = format.replace(/%M/, (minutes < 10) ? "0" + minutes : minutes);
    var seconds = d.getSeconds();
    format = format.replace(/%S/, (seconds < 10) ? "0" + seconds : seconds); //$NON-NLS-0$
    var timeZoneOffset = -d.getTimezoneOffset();
    var offsetMinutes = timeZoneOffset % 60;
    var offsetHours = (timeZoneOffset - offsetMinutes) / 60;
    format = format.replace(/%z/, (offsetHours > 0 ? "+" : "") + ((offsetHours < 10) ? "0" + offsetHours : offsetHours) + ((offsetMinutes < 10) ? "0" + offsetMinutes : offsetMinutes)); //$NON-NLS-0$
    // format = replaceDate(format);
    return format;
}