/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*- */
/*jslint browser: true, devel: true */
/*global findRegExpBar: false, chrome: false, console: false, require: false, document: false */
;'use strict';
//
// Replace /\b(const|let)\B/ with "$1 "
// Replace [/^( *)function (\w+)/] with [$1var $2 = function]
//
// Author: adrian.aichner@gmail.com
//
// Firefox Addon Content Script.
// require is not available in content scripts.
// let sp = require('sdk/simple-prefs');
(function() {
  let DEBUG_ADDON = false;
  try {
    DEBUG_ADDON &&
      console.log("self.port is true", self);
    self.port.on('jot_icon_show', function (data) {
      let div = window.setupIcon('jot_icon_div', 'request_position_save', data, function (event) {
        // console.log("selection", window.getSelection().toString());
        event.preventDefault();
        event.stopPropagation();
        if (this.children[1].style.display == 'none') {
          this.children[1].style.display = 'inline-block';
        }
        else {
          this.children[1].style.display = 'none';
        }
      });
      
      let divClose = document.createElement('span');
      let close = document.createElement('a');
      close.href = 'close';
      close.innerHTML = '&times;';
      close.addEventListener('click', function(event) {
        event.preventDefault();
        event.target.parentElement.parentElement.parentElement.removeChild(event.target.parentElement.parentElement);
      });
      // let divDiffs = document.createElement('div');
      // divDiffs.style = 'position: fixed;  background-color: white; bottom: 2mm; left: 2mm; right: 2mm; top: 2mm; overflow: auto';
      // let style = 'position: fixed; ';
      // style += ' left: 2mm; top: 2mm; background-color: white';
      // div.style = style;
      // divClose.style = 'position: fixed;  background-color: white; bottom: 2mm; right: 2mm; font-size: large';
      divClose.appendChild(close);
      div.appendChild(divClose);
      // close.style = 'position: relative;  top: 0; left: 0; font-size: large';

      var menu = div.appendChild(document.createElement('div'));
      menu.className = 'menu';
      menu.style.display = 'none';
      menu.style.opacity = 0.7;
      // menu.style.backgroundColor = (efpBC == 'transparent' ? bodyBC : efpBC);
      menu.style.borderRadius = '3px';
      menu.style.borderColor = menu.style.color;
      menu.style.border = '2px solid';
      window.setupMenuItem(menu, 'jot', data.menu.jot, function (event) {
        console.log("selection", window.getSelection().toString());
        event.preventDefault();
        event.stopPropagation();
        // self.port.on('fly_safely', function(data) {
        //   reportFeedbackInformation(data);
        // });
        // NOTE: Now we need to get latest site extensions, which
        // might have been changed by user since add-on content
        // script was loaded.
        self.port.emit('jot', { selection: window.getSelection().toString() });
      });
      window.setupMenuItem(menu, 'help', data.menu.help);
      window.setupMenuItem(menu, 'settings', data.menu.settings, function (event) {
        event.preventDefault();
        event.stopPropagation();
        // FIXME: Only works until a new tab receives response.
        // self.port.emit('request_options');
        self.port.emit('settings', { url: 'settings.html' });
      });
    });
    // }
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
    (typeof self !== 'undefined') && self.port.emit('jot_icon_ready');
    // exports.PigeonDispatcher = PigeonDispatcher;
  }
  catch (exception) {
    // DEBUG_ADDON &&
    // console.error(new Error());
    // DEBUG_ADDON &&
    // reportError(exception);
    // DEBUG_ADDON && console.error(exception);
    // DEBUG_ADDON && window.alert(exception.message + '\n\n' + exception.stack);
  }
  if (typeof exports !== 'undefined') {
    // Used by test/test-index.js
    exports.reportFeedbackInformation = reportFeedbackInformation;
  }
})();
