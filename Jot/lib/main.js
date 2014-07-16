/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*- */
'use strict';
/*global require: false, console: false, gBrowser: false, URL: false */

var observer = {
  observe: function(aSubject, aTopic, aData) {
    if (aTopic == "addon-options-displayed" && aData == "MY_ADDON@MY_DOMAIN") {
      var doc = aSubject;
      var control = doc.getElementById("myaddon-pref-control");
      control.value = "test";
    }
  }
};

// const { Cu } = require("chrome");
// const { Services } = Cu.import("resource://gre/modules/Services.jsm", {});
// Services.obs.addObserver(observer, "addon-options-displayed", false);
// Don't forget to remove your observer when your add-on is shut down.

let sp = require('sdk/simple-prefs');
let self = require('sdk/self');
let jotStorage = require("sdk/simple-storage");
let notifications = require("sdk/notifications");
let tabs = require("sdk/tabs");
let loading =
      "time loading addon " + self.name + ' v' + self.version +" started at " +
      new Error().stack.split(/\s+/)[2];
// TODO Please note that console.time is not available in FireFox
// addon content script.
console.time(loading);

sp.on('consoleLogLevel', function(prefName) {
  console.error('Setting ' + prefName + ' for ' + self.name + ' version ' +
                self.version + ' to ' + sp.prefs[prefName]);
});

sp.on('REPORT_ISSUE', function() {
    tabs.open({
      url: self.data.url(sp.prefs['REPORT_ISSUE_URL']),
      inNewWindow: true
      // inBackground: true
/*,
      onClose: function() {
        tabs.activeTab.activate();
      }*/
    });
});

let getAboutData = function getAboutData() {
  let quotaUse = (new Number(jotStorage.quotaUsage * 100)).toPrecision(3),
      len = jotStorage.storage.entries ? jotStorage.storage.entries.length : 0,
      start, end, min_start, max_start, min_end, max_end,
      text, min_text, max_text;
  for (let i = 0; i < len; i++) {
    start = (jotStorage.storage.entries[i].start);
    end = (jotStorage.storage.entries[i].end);
    text = jotStorage.storage.entries[i].activity;
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
  return { quotaUse, len, min_text, max_text, min_start, max_start };
};

sp.on('ABOUTDATA', function () {
let { quotaUse, len,
      min_text, max_text, min_start, max_start } = getAboutData();
  notifications.notify({
    title: 'About Jot Data',
    text: 'Use of storage quota: ' +
      quotaUse +
      '%\nNumber of snaps: ' + len + '\nshortest: ' + min_text +
      ' characters\nlongest: ' + max_text + ' characters\noldest: ' +
      min_start + '\nnewest: ' + max_start
  });
  console.log('notify:' + 'Use of storage quota: ' +
              quotaUse +
              '%\nNumber of snaps: ' + len + '\nshortest: ' + min_text +
              ' characters\nlongest: ' + max_text + ' characters\noldest: ' +
              min_start + '\nnewest: ' + max_start);
});
// See https://blog.mozilla.org/addons/2013/06/13/jetpack-fennec-and-nativewindow
// get a global window reference
const utils = require('sdk/window/utils');
const recent = utils.getMostRecentBrowserWindow();


let formatEntry = function(entryFormat, start, end, text) {
  // Expand character escapes (\n, \r, \t) first, before text (most
  // likely with character escapes of its own, although quotes) gets
  // replaced.
  entryFormat = entryFormat.replace(/\\n/g, '\n').replace(/\\r/g, '\r').
    replace(/\\t/g, '\t');
  entryFormat = entryFormat.replace(/%e\b/g, self.title);
  entryFormat = entryFormat.replace(/%i\b/g, start);
  entryFormat = entryFormat.replace(/%o\b/g, end);
  entryFormat = entryFormat.replace(/%t\b/g, text);
  entryFormat =
    entryFormat.replace(/%T\b/g, '"' +
                        JSON.parse(text).replace(/"/g, '""') +
                        '"');
  return entryFormat;
};

// Modified version of my own function from popchrom in
// https://code.google.com/p/trnsfrmr/source/browse/Transformer/scripts/date.js?name=v1.8#92
let replaceDates = function(format, date) {
  let d = date || new Date();
  if (d instanceof Date && !isNaN(d.getTime())) {} else {
    console.error('%o is not a valid Date', d);
    return format;
  }
  // TODO getDay() returns the day of week,
  // see http://www.ecma-international.org/ecma-262/5.1/#sec-15.9.5.16
  format =
    format.replace(/(?:%DAY%|%d)/, (d.getDate() < 10) ? "0" + //$NON-NLS-0$
                   d.getDate() : d.getDate());
  let month = d.getMonth() + 1;
  format =
    format.replace(/(?:%MONTH%|%m)/, (month < 10) ? "0" + month : month); //$NON-NLS-0$
  format = format.replace(/(?:%YEAR%|%Y)/, d.getFullYear());
  let hours = d.getHours();
  format = format.replace(/%H/, (hours < 10) ? "0" + hours : hours); //$NON-NLS-0$
  let minutes = d.getMinutes();
  format = format.replace(/%M/, (minutes < 10) ? "0" + minutes : minutes);
  let seconds = d.getSeconds();
  format = format.replace(/%S/, (seconds < 10) ? "0" + seconds : seconds); //$NON-NLS-0$
  let timeZoneOffset = -d.getTimezoneOffset();
  let offsetMinutes = timeZoneOffset % 60;
  let offsetHours = (timeZoneOffset - offsetMinutes) / 60;
  format = format.replace(/%z/, (offsetHours > 0 ? "+" : "") + ((offsetHours < 10) ? "0" + offsetHours : offsetHours) + ((offsetMinutes < 10) ? "0" + offsetMinutes : offsetMinutes)); //$NON-NLS-0$
  // format = replaceDate(format);
  return format;
};

let getJotEntries = function(worker, data) {
  if (!jotStorage.storage.entries ||
      !jotStorage.storage.entries.length) {
    return;
  }
  //TODO Please note that file extensions .csv or .json just cause
  //trouble downloading or opening in Firefox.
  let start, end, text, content, dateFormat, infoFormat, entryFormat,
      filename =
        self.name + '_' + sp.prefs[data.type] + '_' +
        jotStorage.storage.entries.length + '@' + Date.now() + '.txt';
  // console.log('jotStorage.quotaUsage:', jotStorage.quotaUsage);
  // console.log(JSON.stringify(jotStorage.storage.entries));
  switch (data.type) {
  case 'DATAFORMAT0':
    worker.port.emit('setJotEntriesBlob', {
      content: JSON.stringify(jotStorage.storage.entries, null, 2),
      filename: filename,
      type: data.type,
      download: !! data.download
    });
    break;
  case 'DATAFORMAT1':
    content = '', dateFormat = sp.prefs['DATEFORMAT1'],
    infoFormat = sp.prefs['INFOFORMAT1'],
    entryFormat = sp.prefs['ENTRYFORMAT1'];
    for (let i = 0, len = jotStorage.storage.entries.length;
         i < len; i++) {
      start = (jotStorage.storage.entries[i].start);
      end = (jotStorage.storage.entries[i].end);
      //                                start = replaceDates(dateFormat, jotStorage.storage.entries[i].start);
      //                                end = replaceDates(dateFormat, jotStorage.storage.entries[i].end);
      text = jotStorage.storage.entries[i].activity;
      content += formatEntry(entryFormat, start, end, text);
    }
    worker.port.emit('setJotEntriesBlob', {
      content: content,
      filename: filename,
      type: data.type,
      download: !! data.download
    });
    break;
  case 'DATAFORMAT2':
    content = '', dateFormat = sp.prefs['DATEFORMAT2'],
    infoFormat = sp.prefs['INFOFORMAT2'],
    entryFormat = sp.prefs['ENTRYFORMAT2'];
    for (let i = 0, len = jotStorage.storage.entries.length;
         i < len; i++) {
      start = (jotStorage.storage.entries[i].start);
      end = (jotStorage.storage.entries[i].end);
      // start = replaceDates(dateFormat, jotStorage.storage.entries[i].start);
      // end = replaceDates(dateFormat, jotStorage.storage.entries[i].end);
      text = jotStorage.storage.entries[i].activity;
      content += formatEntry(entryFormat, start, end, text);
    }
    worker.port.emit('setJotEntriesBlob', {
      content: content,
      filename: filename,
      type: data.type,
      download: !! data.download
    });
    break;
  default:
    notifications.notify({
      title: 'Jot Notification',
      text: 'Don\'t know how to download ' + sp.prefs[data.type]
    });
    console.log('notify:' + 'Don\'t know how to download ' +
                sp.prefs[data.type]);
    break;
  }
};

let openJotTab = function(selection) {
  let activeTab = require("sdk/tabs").activeTab;
  let snapData = {
    about: getAboutData(),
    now: Date.now(),
    selection: selection,
    title: activeTab.title,
    url: activeTab.url,
    // Pass self to content script for it to get self.version, self.id,
    // self.name, etc.
    self: self,
    // Add names of user data formats to be sent to content script.
    format0: sp.prefs['DATAFORMAT0'],
    format1: sp.prefs['DATAFORMAT1'],
    format2: sp.prefs['DATAFORMAT2']
  };
  jotStorage.on("OverQuota", function() {
    console.error('jotStorage.quotaUsage:', jotStorage.quotaUsage);
  });
  let tabs = require("sdk/tabs");
  // TODO Please note data.title can be undefined
  if (snapData.now && snapData.url) {
    let runScript = function runScript(tab) {
      let worker = tab.attach({
        contentScriptFile: self.data.url('display.js')
      });
      worker.port.emit('display', snapData);
      worker.port.on('close', function(data) {
        require("sdk/tabs").activeTab.close();
      });
      worker.port.on('delete', function(data) {
        if (!jotStorage.storage.entries ||
            !jotStorage.storage.entries.length) {
          notifications.notify({
            title: 'Jot Notification',
            text: 'There is no data to be deleted.'
          });
          console.log('notify:' + 'There is no data to be deleted.');
        } else {
          notifications.notify({
            title: 'Jot Notification',
            text: 'Deleting all ' + jotStorage.storage.entries.length +
              ' entries of jot data, see browser\'s downloads directory' +
              ' for exported data.'
          });
          console.log('notify:' + 'Deleting all ' +
                      jotStorage.storage.entries.length +
                      ' entries of jot data, see browser downloads' +
                      ' directory for exported data.');
          jotStorage.storage.entries = [];
        }
      });
      worker.port.on('save', function(data) {
        if (!jotStorage.storage.entries) {
          jotStorage.storage.entries = [];
        }
        for (let i = 0, len = jotStorage.storage.entries.length; i < len;
             i++) {
          if (JSON.stringify(jotStorage.storage.entries[i]) ===
              JSON.stringify(data)) {
            notifications.notify({
              title: 'Jot Notification',
              text: 'Already saved (skipping) ' + JSON.stringify(data)
            });
            console.log('notify:' + 'Already saved (skipping) ' +
                        JSON.stringify(data));
            return;
          }
        }
        notifications.notify({
          title: 'Jot Notification',
          text: 'Saving ' + JSON.stringify(data)
        });
        console.log('notify:' + 'Saving ' + JSON.stringify(data));
        jotStorage.storage.entries.push(data);
      });
      worker.port.on('getJotEntries', function(data) {
        getJotEntries(worker, data);
      });
    };
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
  let jotId = nw.addContextMenu({
    name: 'Jot',
    // TODO Please report mozilla bug to the fact that Fennec
    // contextmenu and text selection are mutually exclusive!
    context: nw.SelectorContext('a'),
    callback: function(target) {
      openJotTab(target.ownerDocument.getSelection().toString());
    }
  });
} else {
  let cm = require("sdk/context-menu");
  cm.Item({
    label: "Jot",
    context: cm.URLContext("*"),
    contentScript: 'self.on("click", function (node, data) {' +
      ' self.postMessage(document.getSelection().toString()); });',
    onMessage: function(selection) {
      openJotTab(selection);
    },
    data: 'snap'
  });
}
console.timeEnd(loading);
