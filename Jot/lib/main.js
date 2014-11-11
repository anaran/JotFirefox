/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*- */
/*global require: false, console: false, gBrowser: false, URL: false */
'use strict';
;(function() {
  let DEBUG_ADDON = false;
  //
  // NOTE Change Function Scope variable DEBUG_ADDON from false to true in the debugger variables panel before continuing to get console messages logged.
  // Make sure option "Console Logging Level" is not set to "off".
  //
  debugger;
  DEBUG_ADDON &&
    console.log('Logging enabled via debugger');
  let sp = require('sdk/simple-prefs');
  const self = require('sdk/self');
  // Only available for options natively supported by firefox, i.e. in jpm.
  const lo = require("@loader/options");
  const metadata = lo.metadata;
  if (!lo || !lo.metadata.title) {
    let ps = require("sdk/preferences/service");
    ps.reset('extensions.issue-pigeon@addons.mozilla.org.sdk.baseURI');
    ps.reset('extensions.issue-pigeon@addons.mozilla.org.sdk.rootURI');
  }
  const myTitle = self.title || metadata.title || self.name;
  let loading =
      'addon ' + myTitle + ' ' + self.version + ' $Format:%h%d$ loads ' +
      // NOTE: Introduce fragment specifier before line spec to make
      // clickable link work in console.log.
      (new Error).stack.replace(/:(\d+):(\d+)/g, '#L$1C$2');
  DEBUG_ADDON &&
    console.log(loading);
  if (console.time) {
    DEBUG_ADDON &&
      console.time('load time');
  }
  if (console.profile) {
    DEBUG_ADDON &&
      console.log('start profiling');
    DEBUG_ADDON &&
      console.profile('addon ' + self.name + ' ' + self.version + 'profile');
  }
  let ss = require("sdk/simple-storage");
  let ps = require("sdk/preferences/service");
  let notifications = require("sdk/notifications");
  let tabs = require("sdk/tabs");
  // TODO Place following code where timed section should start.

  const { Cu } = require("chrome");
  const { Services } = Cu.import("resource://gre/modules/Services.jsm", {});

  let inlineOptionsDocument;
  let observer = {
    observe: function(aSubject, aTopic, aData) {
      DEBUG_ADDON &&
        console.log(aSubject, aTopic, aData, self, this);
      // Prepared for handling other notification types
      switch (aTopic) {
      case "addon-options-displayed":
        if (self && aData === self.id) {
          inlineOptionsDocument = aSubject;
          var spn = inlineOptionsDocument.querySelectorAll('setting[pref-name]');
          var collapseOptions = !sp.prefs['SHOW_OPTIONS'];
          for (let i = 0, len = spn.length; i < len; i++) {
            DEBUG_ADDON &&
              console.log(spn[i].collapsed);
            if (spn[i].getAttribute('pref-name') !== 'SHOW_OPTIONS' &&
                spn[i].getAttribute('pref-name') !== 'REPORT_ISSUE' &&
                spn[i].collapsed !== collapseOptions) {
              spn[i].collapsed = collapseOptions;
            }
          }
        }
        break;
      default:
      }
      return;
    }
  };

  let observableNotifications = {
    OPTIONS_NOTIFICATION_DISPLAYED: "addon-options-displayed",
    // Options notification will be hidden
    OPTIONS_NOTIFICATION_HIDDEN: "addon-options-hidden",

    // Constants for getStartupChanges, addStartupChange and removeStartupChange
    // Add-ons that were detected as installed during startup. Doesn't include
    // add-ons that were pending installation the last time the application ran.
    STARTUP_CHANGE_INSTALLED: "installed",
    // Add-ons that were detected as changed during startup. This includes an
    // add-on moving to a different location, changing version or just having
    // been detected as possibly changed.
    STARTUP_CHANGE_CHANGED: "changed",
    // Add-ons that were detected as uninstalled during startup. Doesn't include
    // add-ons that were pending uninstallation the last time the application ran.
    STARTUP_CHANGE_UNINSTALLED: "uninstalled",
    // Add-ons that were detected as disabled during startup, normally because of
    // an application change making an add-on incompatible. Doesn't include
    // add-ons that were pending being disabled the last time the application ran.
    STARTUP_CHANGE_DISABLED: "disabled",
    // Add-ons that were detected as enabled during startup, normally because of
    // an application change making an add-on compatible. Doesn't include
    // add-ons that were pending being enabled the last time the application ran.
    STARTUP_CHANGE_ENABLED: "enabled",

    // Constants for the Addon.userDisabled property
    // Indicates that the userDisabled state of this add-on is currently
    // ask-to-activate. That is, it can be conditionally enabled on a
    // case-by-case basis.
    STATE_ASK_TO_ACTIVATE: "askToActivate"
  };

  // Not ready to use Object.values shim directly. See
  // http://stackoverflow.com/questions/7306669/how-to-get-all-properties-values-of-a-javascript-object-without-knowing-the-key
  let getObjectValues = obj => Object.keys(obj).map(key => obj[key]);

  exports.main = function myMain(options, callbacks) {
    DEBUG_ADDON &&
      console.log(exports.main.name + ' of version ' + self.version +
                  ' of addon ' + self.name, options, callbacks);
    getObjectValues(observableNotifications).forEach(function (name) {
      Services.obs.addObserver(observer, name, false);
    });
  };
  exports.onUnload = function myOnUnload(reason) {
    DEBUG_ADDON &&
      console.log(exports.onUnload.name + ' of version ' + self.version +
                  ' of addon ' + self.name, reason);
    getObjectValues(observableNotifications).forEach(function (name) {
      Services.obs.removeObserver(observer, name);
    });
  };
  require('sdk/system/unload').when(exports.onUnload);

  sp.on('sdk.console.logLevel', function(prefName) {
    DEBUG_ADDON &&
      console.log('Setting ' + prefName + ' for ' + self.name + ' version ' +
                    self.version + ' to ' + sp.prefs[prefName]);
  });

  sp.on('SHOW_OPTIONS', function(prefName) {
    DEBUG_ADDON &&
      console.log('Setting ' + prefName + ' for ' + self.name + ' version ' +
                    self.version + ' to ' + sp.prefs[prefName]);
    DEBUG_ADDON &&
      console.log('reloading ' + inlineOptionsDocument.location);
    inlineOptionsDocument.location.reload(true);
  });

  sp.on('REPORT_ISSUE', function() {
    tabs.open({
      url: self.data.url(sp.prefs['REPORT_ISSUE_URL']),
      inNewWindow: true
    });
  });

  sp.on('SYNC_DATA', function(prefName) {
    DEBUG_ADDON &&
      console.log('Setting ' + prefName + ' for ' + self.name + ' version ' +
                    self.version + ' to ' + sp.prefs[prefName]);
    ps.set("services.sync.prefs.sync.extensions." + self.id + ".syncstorage", sp.prefs[prefName]);
  });

  sp.on("syncstorage", function(prefname) {
    try {
      let syncstorage = JSON.parse(sp.prefs["syncstorage"]);
      if (syncstorage.hasOwnProperty('entries')) {
        console.error('converting legacy format ', syncstorage);
        syncstorage = syncstorage.entries;
      }
      console.error(syncstorage);
      let mergeFrom, mergeTo;
      if (syncstorage && syncstorage.length && ss.storage.entries && ss.storage.entries.length) {
        if (syncstorage.length > ss.storage.entries.length) {
          mergeFrom = ss.storage.entries;
          mergeTo = syncstorage;
        }
        else {
          mergeFrom = syncstorage;
          mergeTo = ss.storage.entries;
        }
        mergeFrom.forEach(function(fromValue, fromIndex, fromObject) {
          if(!mergeTo.some(function(toValue, toIndex, toObject) {
            return fromValue.start == toValue.start
              && fromValue.end == toValue.end
              && fromValue.activity == toValue.activity;
          })) {
            mergeTo.push(fromValue);
          }
        });
      }
      ss.storage.entries = mergeTo;
      sp.prefs["syncstorage"] = JSON.stringify(ss.storage.entries);
    }
    catch (exception) {
      // NOTE Anonymize user profile in stack trace
      exception.stack = exception.stack.replace(new RegExp("\\S+(/extensions/" + self.id + ")", "g"), "PROFILE_PATH$1");
      let profilePath = exception.fileName.match(new RegExp("(\\S+)/extensions/" + self.id))[0];
      exception.fileName = exception.fileName.replace(new RegExp("\\S+(/extensions/" + self.id + ")", "g"), "PROFILE_PATH$1");
      let system = require("sdk/system");
      let qs = require("sdk/querystring");
      let title = 'Jot Sync Error';
      let exceptionText = JSON.stringify(exception,
                                         Object.getOwnPropertyNames(exception),
                                         2);
      let systemText = JSON.stringify(system,
                                         Object.getOwnPropertyNames(system),
                                         2);
      notifications.notify({
        title: title,
        text: exceptionText,
        data: qs.stringify({
          title:
          title + ' in ' + self.version,
          body:
          "(Please review for any private data you may want to remove before submitting)\n\nPROFILE_PATH:\n\n" + profilePath + "\n\n"
          + "Sytem: " + systemText + "\n\nException: " + exceptionText + "\n"
        }),
        onClick: function (data) {
          tabs.open({
            inNewWindow: true,
            url: 'https://github.com/anaran/JotFirefox/issues/new?' + data,
            onClose: function() {
              require("sdk/tabs").activeTab.activate();
            }});
        }});
      DEBUG_ADDON &&
        console.error(exception);
    }
  });

  let getAboutData = function getAboutData() {
    let quotaUse = (new Number(ss.quotaUsage * 100)).toPrecision(3),
        len = ss.storage.entries ? ss.storage.entries.length : 0,
        start, end, min_start, max_start, min_end, max_end,
        text, min_text, max_text;
    for (let i = 0; i < len; i++) {
      start = (ss.storage.entries[i].start);
      end = (ss.storage.entries[i].end);
      text = ss.storage.entries[i].activity;
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
    return { quotaUse: quotaUse, len: len, min_text: min_text,
              max_text: max_text, min_start: min_start, max_start: max_start };
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
    DEBUG_ADDON &&
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
      DEBUG_ADDON &&
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
    if (!ss.storage.entries ||
        !ss.storage.entries.length) {
      return;
    }
    //TODO Please note that file extensions .csv or .json just cause
    //trouble downloading or opening in Firefox.
    let start, end, text, content, dateFormat, infoFormat, entryFormat,
        filename =
          self.name + '_' + sp.prefs[data.type] + '_' +
          ss.storage.entries.length + '@' + Date.now() + '.txt';
    DEBUG_ADDON &&
      console.log('ss.quotaUsage:', ss.quotaUsage);
    switch (data.type) {
    case 'DATAFORMAT0':
      worker.port.emit('setJotEntriesBlob', {
        content: JSON.stringify(ss.storage.entries, null, 2),
        filename: filename,
        type: data.type,
        download: !! data.download
      });
      break;
    case 'DATAFORMAT1':
      content = '', dateFormat = sp.prefs['DATEFORMAT1'],
      infoFormat = sp.prefs['INFOFORMAT1'],
      entryFormat = sp.prefs['ENTRYFORMAT1'];
      for (let i = 0, len = ss.storage.entries.length;
           i < len; i++) {
        start = (ss.storage.entries[i].start);
        end = (ss.storage.entries[i].end);
        //                                start = replaceDates(dateFormat, ss.storage.entries[i].start);
        //                                end = replaceDates(dateFormat, ss.storage.entries[i].end);
        text = ss.storage.entries[i].activity;
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
      for (let i = 0, len = ss.storage.entries.length;
           i < len; i++) {
        start = (ss.storage.entries[i].start);
        end = (ss.storage.entries[i].end);
        // start = replaceDates(dateFormat, ss.storage.entries[i].start);
        // end = replaceDates(dateFormat, ss.storage.entries[i].end);
        text = ss.storage.entries[i].activity;
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
      DEBUG_ADDON &&
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
    ss.on("OverQuota", function() {
      let { quotaUse, len,
            min_text, max_text, min_start, max_start } = getAboutData();
      notifications.notify({
        title: 'Jot Quota Exceeded!',
        text: 'Use of storage quota: ' +
          quotaUse +
          '%\nNumber of snaps: ' + len + '\nshortest: ' + min_text +
          ' characters\nlongest: ' + max_text + ' characters\noldest: ' +
          min_start + '\nnewest: ' + max_start
      });
      DEBUG_ADDON &&
        console.error('ss.quotaUsage:', ss.quotaUsage);
    });
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
        worker.port.on('options', function(data) {
          // TODO: Remove button does not properly hide preferences when
          // opened by BrowserOpenAddonsMgr().
          // I got it working for my SHOW_OPTIONS logic using location.reload().
          // Services.wm.getMostRecentWindow('navigator:browser').
          //   BrowserOpenAddonsMgr('addons://detail/' + self.id +
          //   '/preferences');
          let tabs = require("sdk/tabs");
          try {
            for each (var tab in tabs) {
              DEBUG_ADDON &&
                console.debug(tab.url);
              if (tab && tab.url &&
                  /^about:addons\b/.test(tab.url)) {
                tab.activate();
                return;
              }
            }
          }
          catch (exception) {
            DEBUG_ADDON &&
              console.error(exception);
          }
          tabs.open({
            // url: encodeURI('addons://detail/' + self.id + '/preferences')
            // inNewWindow: true,
            // gViewController.currentViewId
            // url: 'addons://detail/jid1-HE38Y6vsW9TpHg%40jetpack/preferences'
            url: 'about:addons',
            onClose: function() {
              require("sdk/tabs").activeTab.activate();
            }
          });
        });
        worker.port.on('delete', function(data) {
          if (!ss.storage.entries ||
              !ss.storage.entries.length) {
            notifications.notify({
              title: 'Jot Notification',
              text: 'There is no data to be deleted.'
            });
            DEBUG_ADDON &&
              console.log('notify:' + 'There is no data to be deleted.');
          } else {
            notifications.notify({
              title: 'Jot Notification',
              text: 'Deleting all ' + ss.storage.entries.length +
                ' entries of jot data, see browser\'s downloads directory' +
                ' for exported data.'
            });
            DEBUG_ADDON &&
              console.log('notify:' + 'Deleting all ' +
                          ss.storage.entries.length +
                          ' entries of jot data, see browser downloads' +
                          ' directory for exported data.');
            ss.storage.entries = [];
          }
        });
        worker.port.on('save', function(data) {
          if (!ss.storage.entries) {
            ss.storage.entries = [];
          }
          for (let i = 0, len = ss.storage.entries.length; i < len;
               i++) {
            if (JSON.stringify(ss.storage.entries[i]) ===
                JSON.stringify(data)) {
              notifications.notify({
                title: 'Jot Notification',
                text: 'Already saved (skipping) ' + JSON.stringify(data)
              });
              DEBUG_ADDON &&
                console.log('notify:' + 'Already saved (skipping) ' +
                            JSON.stringify(data));
              return;
            }
          }
          notifications.notify({
            title: 'Jot Notification',
            text: 'Saving ' + JSON.stringify(data)
          });
          DEBUG_ADDON &&
            console.log('notify:' + 'Saving ' + JSON.stringify(data));
          ss.storage.entries.push(data);
          sp.prefs["syncstorage"] = JSON.stringify(ss.storage.entries);
        });
        worker.port.on('getJotEntries', function(data) {
          getJotEntries(worker, data);
        });
      };
      require("sdk/tabs").open({
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
        let s = target.ownerDocument.getSelection();
        let selectionText = s.toString();
        let rangesText = "";
        for (var i = 0; i < s.rangeCount; i++) {
          rangesText += s.getRangeAt(i).toString();
        }
        openJotTab(rangesText.contains("\n") && !selectionText.contains("\n") ? rangesText : selectionText);
      }
    });
  } else {
    let cm = require("sdk/context-menu");
    cm.Item({
      label: "Jot",
      context: cm.URLContext("*"),
      contentScript: 'self.on("click", function (node, data) {' +
        'let s = document.getSelection();' +
        'let selectionText = s.toString();' +
        'let rangesText = "";' +
        'for (var i = 0; i < s.rangeCount; i++) {' +
        '  rangesText += s.getRangeAt(i).toString();' +
        '}' +
        ' self.postMessage(rangesText.contains("\\n") && !selectionText.contains("\\n") ? rangesText : selectionText); });',
      onMessage: function(selection) {
        openJotTab(selection);
      },
      data: 'snap'
    });
  }
  // TODO Place following code where timed section should end.
  if (console.timeEnd) {
    DEBUG_ADDON &&
      console.timeEnd('load time');
  }
  if (console.profileEnd) {
    DEBUG_ADDON &&
      console.log('end profiling');
    DEBUG_ADDON &&
      console.profileEnd();
  }
})();
