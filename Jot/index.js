/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*- */
/*global require: false, console: false, gBrowser: false, URL: false */
'use strict';
;(function() {
  let DEBUG_ADDON = false;
  //
  // NOTE Change Function Scope variable DEBUG_ADDON from false to true in the debugger variables panel before continuing to get console messages logged.
  // Make sure option "Console Logging Level" is not set to "off".
  //
  // debugger;
  let pd = require('./lib/pouchdb-shimmed');
  const tabs = require("sdk/tabs");
  const _ = require("sdk/l10n").get;
  DEBUG_ADDON &&
    console.log('Logging enabled via debugger');
  exports.dummy = function(text, callback) {
    let session = require('./lib/anaran-jetpack-add-on/session');
    callback(text);
  }
  // Workaround for https://bugzil.la/1102504
  // let bad = require('./reference-error');
  // if (false && "https://bugzil.la/1102504 NOT FIXED" &&
  //     require("sdk/system/xul-app").is("Fennec")) {
  //   tabs = require("./addon-sdk-patches/tabs");
  // } else {
  // }
  let settingsTab, helpTab;
  let sp = require('sdk/simple-prefs');
  const self = require('sdk/self');
  // Only available for options natively supported by firefox, i.e. in jpm.
  const lo = require("@loader/options");
  const metadata = lo.metadata;
  if (!lo || !lo.metadata.title) {
    let ps = require("sdk/preferences/service");
    ps.reset('extensions.' + self.id + '.sdk.baseURI');
    ps.reset('extensions.' + self.id + '.sdk.rootURI');
    ps.reset('extensions.' + self.id + '.sdk.version');
  }
  const myTitle = self.title || metadata.title || self.name;
  let loading =
      'addon ' + myTitle + ' ' + self.version + ' $Format:%h%d$ loads ' +
      // NOTE: Introduce fragment specifier before line spec to make
      // clickable link work in console.log.
      (new Error).stack.replace(/:(\d+):(\d+)/g, '#L$1C$2');
  DEBUG_ADDON &&
    console.log(loading);
  // TODO Place following code where timed section should start.
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
  //   const { Cu } = require("chrome");
  //   const { Services } = Cu.import("resource://gre/modules/Services.jsm", {});

  //   let inlineOptionsDocument;
  //   let observer = {
  //     observe: function(aSubject, aTopic, aData) {
  //       DEBUG_ADDON &&
  //         console.log(aSubject, aTopic, aData, self, this);
  //       // Prepared for handling other notification types
  //       switch (aTopic) {
  //       case "addon-options-displayed":
  //         if (self && aData === self.id) {
  //           inlineOptionsDocument = aSubject;
  //           var spn = inlineOptionsDocument.querySelectorAll('setting[pref-name]');
  //           var collapseOptions = !sp.prefs['SHOW_OPTIONS'];
  //           for (let i = 0, len = spn.length; i < len; i++) {
  //             DEBUG_ADDON &&
  //               console.log(spn[i].collapsed);
  //             if (spn[i].getAttribute('pref-name') !== 'SHOW_OPTIONS' &&
  //                 spn[i].getAttribute('pref-name') !== 'REPORT_ISSUE' &&
  //                 spn[i].collapsed !== collapseOptions) {
  //               spn[i].collapsed = collapseOptions;
  //             }
  //           }
  //         }
  //         break;
  //       default:
  //       }
  //       return;
  //     }
  //   };

  //   let observableNotifications = {
  //     OPTIONS_NOTIFICATION_DISPLAYED: "addon-options-displayed",
  //     // Options notification will be hidden
  //     OPTIONS_NOTIFICATION_HIDDEN: "addon-options-hidden",

  //     // Constants for getStartupChanges, addStartupChange and removeStartupChange
  //     // Add-ons that were detected as installed during startup. Doesn't include
  //     // add-ons that were pending installation the last time the application ran.
  //     STARTUP_CHANGE_INSTALLED: "installed",
  //     // Add-ons that were detected as changed during startup. This includes an
  //     // add-on moving to a different location, changing version or just having
  //     // been detected as possibly changed.
  //     STARTUP_CHANGE_CHANGED: "changed",
  //     // Add-ons that were detected as uninstalled during startup. Doesn't include
  //     // add-ons that were pending uninstallation the last time the application ran.
  //     STARTUP_CHANGE_UNINSTALLED: "uninstalled",
  //     // Add-ons that were detected as disabled during startup, normally because of
  //     // an application change making an add-on incompatible. Doesn't include
  //     // add-ons that were pending being disabled the last time the application ran.
  //     STARTUP_CHANGE_DISABLED: "disabled",
  //     // Add-ons that were detected as enabled during startup, normally because of
  //     // an application change making an add-on compatible. Doesn't include
  //     // add-ons that were pending being enabled the last time the application ran.
  //     STARTUP_CHANGE_ENABLED: "enabled",

  //     // Constants for the Addon.userDisabled property
  //     // Indicates that the userDisabled state of this add-on is currently
  //     // ask-to-activate. That is, it can be conditionally enabled on a
  //     // case-by-case basis.
  //     STATE_ASK_TO_ACTIVATE: "askToActivate"
  //   };

  //   // Not ready to use Object.values shim directly. See
  //   // http://stackoverflow.com/questions/7306669/how-to-get-all-properties-values-of-a-javascript-object-without-knowing-the-key
  //   let getObjectValues = obj => Object.keys(obj).map(key => obj[key]);

  //   exports.main = function myMain(options, callbacks) {
  //     DEBUG_ADDON &&
  //       console.log(exports.main.name + ' of version ' + self.version +
  //                   ' of addon ' + self.name, options, callbacks);
  //     getObjectValues(observableNotifications).forEach(function (name) {
  //       Services.obs.addObserver(observer, name, false);
  //     });
  //   };
  //   exports.onUnload = function myOnUnload(reason) {
  //     DEBUG_ADDON &&
  //       console.log(exports.onUnload.name + ' of version ' + self.version +
  //                   ' of addon ' + self.name, reason);
  //     getObjectValues(observableNotifications).forEach(function (name) {
  //       Services.obs.removeObserver(observer, name);
  //     });
  //   };
  //   require('sdk/system/unload').when(exports.onUnload);

  let handleErrors = function (exception) {
    // FIXME: Perhaps this should open a styled error page and just
    // post error data to it.
    tabs.open({
      // inNewWindow: true,
      url: 'data:text/html;charset=utf-8,<html><head><title>' + myTitle
      + ' Error</title></head><body><h1>' + myTitle
      + ' Error</h1><pre>'
      + (JSON.stringify(exception,
                        Object.getOwnPropertyNames(exception), 2))
      .replace(/(:\d+)+/g, '$&\n')
      .replace(/->/g, '\n$&')
      .replace(/\n/g, '%0a')
      + '</pre>',
      onClose: function() {
        tabs.activeTab.activate();
      }});
  };

  sp.on('sdk.console.logLevel', function(prefName) {
    DEBUG_ADDON &&
      console.log('Setting ' + prefName + ' for ' + self.name + ' version ' +
                  self.version + ' to ' + sp.prefs[prefName]);
  });

  sp.on('SHOW_OPTIONS', function(prefName) {
    DEBUG_ADDON &&
      console.log('Setting ' + prefName + ' for ' + self.name + ' version ' +
                  self.version + ' to ' + sp.prefs[prefName]);
    //     DEBUG_ADDON &&
    //       console.log('reloading ' + inlineOptionsDocument.location);
    //     inlineOptionsDocument.location.reload(true);
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
              tabs.activeTab.activate();
            }});
        }});
      DEBUG_ADDON &&
        console.error(exception);
    }
  });

  let getAboutData = function getAboutData() {
    let quotaUse = (new Number(ss.quotaUsage * 100)).toFixed(2),
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
    let activeTab = tabs.activeTab;
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
        // worker.port.emit('display', snapData);
        worker.port.on('close', function(data) {
          tabs.activeTab.close();
        });
        worker.port.on('options', function(data) {
          // TODO: Remove button does not properly hide preferences when
          // opened by BrowserOpenAddonsMgr().
          // I got it working for my SHOW_OPTIONS logic using location.reload().
          // Services.wm.getMostRecentWindow('navigator:browser').
          //   BrowserOpenAddonsMgr('addons://detail/' + self.id +
          //   '/preferences');
          // let tabs = tabs;
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
              tabs.activeTab.activate();
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
        worker.port.on('sync', function(data) {
          let localDb = new pd('jot');
          localDb.info().then(function (result) {
            // handle result
            if (result.doc_count == 0) {
              for (let i = 0, len = ss.storage.entries.length;
                   i < len; i++) {
                localDb.post({
                  activity: ss.storage.entries[i].activity,
                  start: ss.storage.entries[i].astart,
                  end: ss.storage.entries[i].end
                }).catch(function (err) {
                  worker.port.emit('sync_info', err);
                  return;
                });
              }
            }
            else {
              let protocol = sp.prefs['protocol'],
                  site = sp.prefs['site'],
                  port = sp.prefs['port'],
                  path = sp.prefs['path'];
              if (protocol && site && port && path) {
                var XMLHttpRequest = require("sdk/net/xhr").XMLHttpRequest;
                var myXHR = function () {
                  var request;
                  if (false && /* false && */window.location.protocol == "app:") {
                    request = new XMLHttpRequest({ mozSystem: true, mozAnon: true });
                  }
                  else {
                    request = new XMLHttpRequest({ mozSystem: false, mozAnon: false });
                    // request = new XMLHttpRequest();
                  }
                  return request;
                }
                var opts = {
                  ajax: {
                    xhr: myXHR,
                    // headers: { 'Cookie': cookie },
                    timeout: 30000
                  }
                };
                let url = protocol + '://' + site + ':' + port + path;
                let remoteDb = new pd(url, opts);
                for (let i = 0, len = ss.storage.entries.length;
                     i < len; i++) {
                  remoteDb.post({
                    activity: ss.storage.entries[i].activity,
                    start: ss.storage.entries[i].astart,
                    end: ss.storage.entries[i].end
                  }, opts).then(function (result) {
                    // handle result
                    worker.port.emit('sync_info', { remoteDB: result });
                  }).catch(function (err) {
                    worker.port.emit('sync_info', err);
                    return;
                  });
                }
                // localDb.sync(remoteDb).on('change', function (info) {
                localDb.sync(remoteDb, opts).on('change', function (info) {
                  // handle change
                  worker.port.emit('sync_info', {'sync_change': info});
                }).on('paused', function (err) {
                  // replication paused (e.g. user went offline)
                  worker.port.emit('sync_info', {'sync_paused': err});
                }).on('active', function (what) {
                  // replicate resumed (e.g. user went back online)
                  worker.port.emit('sync_info', {'sync_active': what});
                }).on('denied', function (info) {
                  // a document failed to replicate, e.g. due to permissions
                  worker.port.emit('sync_info', {'sync_denied': info});
                }).on('complete', function (info) {
                  // handle complete
                  worker.port.emit('sync_info', {'sync_complete': info});
                }).on('error', function (err) {
                  // handle error
                  worker.port.emit('sync_info', {'sync_err_result': err.result});
                  return;
                });
              }
            }
            worker.port.emit('sync_info', result);
          }).catch(function (err) {
            worker.port.emit('sync_info_err', { info_error: err });
            return;
          });
        });
        worker.port.on('request_export', function(data) {
          let localDb = new pd('jot');
          localDb.allDocs({
            include_docs: true/*, 
  attachments: true*/
          }).then(function (result) {
            // handle result
            worker.port.emit('export_data', result);
          }).catch(function (err) {
            worker.port.emit('sync_info', { export_error: err });
          });
        });
        worker.port.on('session', function(data) {
          let session = require('./anaran-jetpack-add-on/session');
          let protocol = sp.prefs['protocol'],
              site = sp.prefs['site'],
              port = sp.prefs['port'],
              path = sp.prefs['path'],
              user = sp.prefs['user'];
          if (protocol && site && port && path && user) {
            let url = protocol + '://' + site + ':' + port + path;
            let sessionUrl = protocol + '://' + site + ':' + port + '/_session';
            if (data.password) {
              session.sessionLogin(sessionUrl, user, data.password);
              // loggedIn = true;
            }
            else {
              session.sessionLogout(sessionUrl);
              // loggedIn = false;
            }
          }
        });
        worker.port.emit('display', snapData);
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

  // IP SECTION START
  let worker;
  tabs.on('ready', function(tab) {
    let setupWorkers = function() {
      worker = tab.attach({
        // let worker = tabs.activeTab.attach({
        // contentScriptFile: self.data.url('reportFeedbackInformation.js'),
        contentScriptFile: [
          './anaran-jetpack-content/setup_icon.js',
          './anaran-jetpack-content/setup_menu_item.js',
          './jot.js',
        ],
        onError: handleErrors
      });
      worker.port.emit('updateIconPosition', {
        position: sp.prefs['position'] && JSON.parse(sp.prefs['position']) || {}
      });
      worker.port.on('help', function (data) {
        // handleErrors({'settings_title': _('settings_title')});
        let originallyActiveTab = tabs.activeTab;
        if (helpTab) {
          helpTab.activate();
          helpTab.on('close', function() {
            helpTab = false;
            for (let t of tabs) {
              if (t === originallyActiveTab) {
                originallyActiveTab.activate();
                break;
              }
            }
          });
        }
        else {
          tabs.open({
            url: _('help_path'),
            onReady: function(tab) {
              helpTab = tab;
            },
            onClose: function() {
              helpTab = false;
              for (let t of tabs) {
                if (t === originallyActiveTab) {
                  originallyActiveTab.activate();
                  break;
                }
              }
            }
          });
        }
      });
      worker.port.on('save', function (data) {
        saveKnownSitesExtensions(data);
      });
      worker.port.on('settings', function (data) {
        let originallyActiveTab = tabs.activeTab;
        let settingsWorker;
        if (settingsTab) {
          if (settingsTab.url == self.data.url(data.url)) {
            settingsTab.activate();
          }
          else {
            // Need to reload URL, e.g. after Help link was clicked in Settings tab.
            settingsTab.url = self.data.url(data.url);
          }
          settingsTab.on('close', function() {
            settingsTab = false;
            for (let t of tabs) {
              if (t === originallyActiveTab) {
                originallyActiveTab.activate();
                break;
              }
            }
          });
        }
        else {
          tabs.open({
            // inNewWindow: true,
            url: data.url,
            onReady: function(tab) {
              // console.log('tab.url', tab.url, settingsTab.url, originallyActiveTab.url);
              settingsTab = tab;
              settingsWorker = tab.attach({
                contentScriptFile: [
                  './anaran-jetpack-content/settings.js',
                  // './report-json-parse-error.js',
                  // './diagnostics_overlay.js'
                ],
                onError: handleErrors
              });
              let localizedPreferences = metadata.preferences.map(function(pref) {
                pref.title = _(pref.name + '_title');
                pref.description = _(pref.name + '_description');
                return pref;
              });
              settingsWorker.port.on('request_settings', function (data) {
                settingsWorker.port.emit('load_settings', {
                  localizedPreferences: localizedPreferences,
                  prefs: sp.prefs
                });
              });
              settingsWorker.port.on('save_setting', function (data) {
                sp.prefs[data.name] = data.value;
                // NOTE: We don't need this as long as we don't incrementally update the settings UI.
                // Need a way to address pref selection in UI, e.g.
                // label.radio input[name="sdk.console.logLevel"][value="off"]
                // This works:
                // document.querySelector('.menulist[name*="sdk"]').value = "error"
                // document.querySelector('label.radio input[name="sdk.console.logLevel"][value="all"]').checked = true;
                settingsWorker.port.emit('load_settings', {
                  localizedPreferences: localizedPreferences,
                  prefs: sp.prefs
                });
              });
              sp.on('position', function(prefName) {
                settingsWorker.port.emit('load_settings', {
                  localizedPreferences: localizedPreferences,
                  prefs: sp.prefs
                });
              });
            },
            onClose: function() {
              settingsTab = false;
              // NOTE: See https://bugzilla.mozilla.org/show_bug.cgi?id=1208499
              // let me = originallyActiveTab.index;
              for (let t of tabs) {
                if (t === originallyActiveTab) {
                  originallyActiveTab.activate();
                  break;
                }
              }
            }});
        }
      });
      worker.port.on('unsupported', function (data) {
        let title = self.name + ': Cannot fly home';
        notifications.notify({
          title: title,
          text: "\nClick to report this\n" + data,
          data: qs.stringify({
            title:
            title + ' in ' + self.version,
            body:
            "(Please review for any private data you may want to remove before submitting)\n\n" + data
          }),
          onClick: function (data) {
            tabs.open({
              inNewWindow: true,
              url: 'https://github.com/anaran/IssuePigeonFirefox/issues/new?' + data,
              onClose: function() {
                require("sdk/tabs").activeTab.activate();
              }});
          }});
      });
      worker.port.on('jot', function (data) {
        openJotTab(data.selection);
      });
      worker.port.on('jot_icon_ready', function (data) {
        worker.port.emit('jot_icon_show', {
          'icon': metadata.icon,
          'menu': {
            'jot': _('jot_menu_entry'),
            'help': _('help_menu_entry'),
            'settings': _('settings_menu_entry')
          },
          'position': sp.prefs['position'] && JSON.parse(sp.prefs['position']) || {}
        });
      });
      worker.port.on('request_position_save', function (data) {
        sp.prefs['position'] = JSON.stringify(data);
      });
    };
    switch (sp.prefs['loading']) {
      case "delayed":
        tab.on('activate', function(tab) {
          setupWorkers();
        });
        break;
      case "immediate":
        setupWorkers();
        break;
      case "disabled":
        break;
    }
  });
  // IP SECTION END

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
