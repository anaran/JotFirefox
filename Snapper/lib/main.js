// 'use strict';
/*global require: false, console: false, gBrowser: false, URL: false */

let sp = require('sdk/simple-prefs');
let self = require('sdk/self');
let snapperStorage = require("sdk/simple-storage");
let notifications = require("sdk/notifications");
var data = self.data;

var consoleLogLevel = sp.prefs['consoleLogLevel'];
//var DATEFORMAT = sp.prefs.DATEFORMAT;
//var INFOFORMAT = sp.prefs.INFOFORMAT;

sp.on('consoleLogLevel', function() {
    consoleLogLevel = sp.prefs['consoleLogLevel'];
    var name = "extensions." + self.id + ".sdk.console.logLevel";
    // TODO Using error to make sure message will always be visible -- not ideal.
    console.error('Setting log level for ' + self.name + ' version ' + self.version + ' to ' + consoleLogLevel);
    require("sdk/preferences/service").set(name, consoleLogLevel);
});
sp.on('ABOUTDATA', function() {
    let start, end, min_start, max_start, min_end, max_end, text, min_text, max_text;
    for (var i = 0, len = snapperStorage.storage.entries.length; i < len; i++) {
        start = (snapperStorage.storage.entries[i].start);
        end = (snapperStorage.storage.entries[i].end);
        text = snapperStorage.storage.entries[i].activity;
        if (!max_text || (text.length > max_text)) {
            max_text = text.length;
        }
        if (!min_text || (text.length < min_text)) {
            min_text = text.length;
        }
        if (!min_start || (start.localeCompare(min_start) < 0)) {
            min_start = start;
        }
        if (!max_start || (start.localeCompare(max_start) > 0)) {
            max_start = start;
        }
    }
    notifications.notify({
        title: 'About Snapper Data',
        text: 'Use of storage quota: ' + (new Number(snapperStorage.quotaUsage * 100)).toPrecision(3) + '%\nNumber of snaps: ' + len + '\nshortest: ' + min_text + ' characters\nlongest: ' + max_text + ' characters\noldest: ' + min_start + '\nnewest: ' + max_start
    });
});
//sp.on('INFORMATION_FORMAT', function() {
//    INFORMATION_FORMAT = sp.prefs.INFORMATION_FORMAT;
//    console.log('DEBUG set to ' + INFORMATION_FORMAT);
//});
// See https://blog.mozilla.org/addons/2013/06/13/jetpack-fennec-and-nativewindow
// get a global window reference
const utils = require('sdk/window/utils');
const recent = utils.getMostRecentBrowserWindow();


let formatEntry = function(entryFormat, start, end, text) {
    // Expand character escapes (\n, \r, \t) first, before text (most likely with character escapes of its own, although quotes) gets replaced.
    entryFormat = entryFormat.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t');
    entryFormat = entryFormat.replace(/%i\b/g, start);
    entryFormat = entryFormat.replace(/%o\b/g, end);
    entryFormat = entryFormat.replace(/%t\b/g, text);
    entryFormat = entryFormat.replace(/%T\b/g, '"' + JSON.parse(text).replace(/"/g, '""') + '"');
    return entryFormat;
}

// Modified version of my own function from popchrom in
// https://code.google.com/p/trnsfrmr/source/browse/Transformer/scripts/date.js?name=v1.8#92
let replaceDates = function(format, date) {
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
};

var performDownload = function(worker, data) {
    //TODO Please note that file extensions .csv or .json just cause trouble downloading or opening in Firefox.
    var filename = self.name + '_' + sp.prefs[data.type] + '_' + snapperStorage.storage.entries.length + '@' + Date.now() + '.txt';
    console.log('snapperStorage.quotaUsage:', snapperStorage.quotaUsage);
    console.log(JSON.stringify(snapperStorage.storage.entries));
    if (!snapperStorage.storage.entries || !snapperStorage.storage.entries.length) {
        notifications.notify({
            text: 'There is no data to be downloaded in ' + sp.prefs[data.type] + ' format.'
        });
        return;
    }
    switch (data.type) {
        case 'DATAFORMAT0':
            {
                notifications.notify({
                    text: 'Downloading ' + filename
                });
                worker.port.emit('content', {
                    content: JSON.stringify(snapperStorage.storage.entries, null, 2),
                    filename: filename,
                    type: data.type
                });
                break;
            }
        case 'DATAFORMAT1':
            {
                let start, end, text, content = '', dateFormat = sp.prefs['DATEFORMAT1'], infoFormat = sp.prefs['INFOFORMAT1'], entryFormat = sp.prefs['ENTRYFORMAT1'];
                for (var i = 0, len = snapperStorage.storage.entries.length; i < len; i++) {
                    start = (snapperStorage.storage.entries[i].start);
                    end = (snapperStorage.storage.entries[i].end);
                    //                                start = replaceDates(dateFormat, snapperStorage.storage.entries[i].start);
                    //                                end = replaceDates(dateFormat, snapperStorage.storage.entries[i].end);
                    text = snapperStorage.storage.entries[i].activity;
                    content += formatEntry(entryFormat, start, end, text);
                }
                notifications.notify({
                    text: 'Downloading ' + filename
                });
                worker.port.emit('content', {
                    content: content,
                    filename: filename,
                    type: data.type
                });
                break;
            }
        case 'DATAFORMAT2':
            {
                let start, end, text, content = '', dateFormat = sp.prefs['DATEFORMAT2'], infoFormat = sp.prefs['INFOFORMAT2'], entryFormat = sp.prefs['ENTRYFORMAT2'];
                for (var i = 0, len = snapperStorage.storage.entries.length; i < len; i++) {
                    start = (snapperStorage.storage.entries[i].start);
                    end = (snapperStorage.storage.entries[i].end);
                    //                                start = replaceDates(dateFormat, snapperStorage.storage.entries[i].start);
                    //                                end = replaceDates(dateFormat, snapperStorage.storage.entries[i].end);
                    text = snapperStorage.storage.entries[i].activity;
                    content += formatEntry(entryFormat, start, end, text);
                }
                notifications.notify({
                    text: 'Downloading ' + filename
                });
                worker.port.emit('content', {
                    content: content,
                    filename: filename,
                    type: data.type
                });
                break;
            }
        default:
            {
                notifications.notify({
                    text: 'Don\'t know how to download ' + sp.prefs[data.type]
                });
                break;
            }
    }
};

var openSnapperTab = function(data) {
    // Add names of user data formats to be sent to content script.
    data.format0 = sp.prefs['DATAFORMAT0'];
    data.format1 = sp.prefs['DATAFORMAT1'];
    data.format2 = sp.prefs['DATAFORMAT2'];
    snapperStorage.on("OverQuota", function() {
        console.log('snapperStorage.quotaUsage:', snapperStorage.quotaUsage);
    });
    let activeTab = require("sdk/tabs").activeTab;
    var tabs = require("sdk/tabs");
    if (data.now && data.title && data.url) {
        function runScript(tab) {
            var worker = tab.attach({
                contentScriptFile: self.data.url('display.js')
            });
            worker.port.on('close', function(data) {
                require("sdk/tabs").activeTab.close();
            });
            worker.port.on('delete', function(data) {
                if (!snapperStorage.storage.entries || !snapperStorage.storage.entries.length) {
                    notifications.notify({
                        text: 'There is no data to be deleted.'
                    });
                } else {
                    notifications.notify({
                        text: 'Deleting all ' + snapperStorage.storage.entries.length + ' entries of snapper data, see browser downloads directory for exported data.'
                    });
                    snapperStorage.storage.entries = [];
                }
            });
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
                performDownload(worker, data);
            });
            worker.port.emit("display", data);
        }
        tabs.open({
            url: self.data.url('display.html'),
            onReady: runScript,
            onClose: function() {
                activeTab.activate();
            }
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
            let activeTab = require("sdk/tabs").activeTab;
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
            openSnapperTab(data);
        },
        data: 'snap'
    });
}