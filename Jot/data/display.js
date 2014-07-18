/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*- */
/*jslint browser: true, devel: true */
/*global findRegExpBar: false, chrome: false, console: false, require: false, document: false */
'use strict';
// Firefox Addon Content Script.
// require does not seem to be available in content scripts.
// let sp = require('sdk/simple-prefs');
(function() {
  let loading = "content script load time $Format:%h%d$ in " + document.URL +
        " using " + JSON.stringify(navigator.userAgent) + ' ' +
        (new Error).stack;
  //       "\n(" + ") takes";
  // TODO Place following code where timed section should start.
  if (console.time) {
    console.time(loading);
  }
  else {
    console.log(loading);
  }
  // console.log('display.js self:', self);
  let divAboutData;
  let preActivity;
  let tooltipActivity;
  let preClockin;
  let preClockout;
  let timelogEntry;
  let links = {};
  let texts = {};
  let saveButton;
  let optionsButton;
  let closeButton;
  let deleteButton;

  function dateToTimeClock(d) {
    // Taken from
    // http://sajjadhossain.com/2008/10/31/javascript-string-trimming-and-padding/
    // pads left
    // Changed from String.prototype to function to remain side effect free.
    let lpad = function(strArg, padString, length) {
      let str = strArg.toString();
      while (str.length < length) {
        str = padString + str;
      }
      return str;
    };
    return lpad((d.getFullYear()), "0", 4) + "/" +
      lpad((d.getMonth() + 1), "0", 2) + "/" + lpad(d.getDate(), "0", 2) +
      " " + lpad(d.getHours(), "0", 2) + ":" + lpad(d.getMinutes(), "0", 2) +
      ":" + lpad(d.getSeconds(), "0", 2);
  }

  function display(data) {
    let { quotaUse, len, 
          min_text, max_text, min_start, max_start } = data.about;
    divAboutData = document.querySelector('.about');
    divAboutData.textContent = '\nUse of storage quota: ' + quotaUse +
      '%\nNumber of snaps: ' + len + '\nshortest: ' + min_text +
      ' characters\nlongest: ' + max_text + ' characters\noldest: ' +
      min_start + '\nnewest: ' + max_start + '\n';
    var selectAll = function(event) {
      var selection = getSelection();
      var range = document.createRange();
      range.selectNode(event.target);
      selection.addRange(range);
    };
    divAboutData.addEventListener('click', selectAll, false);
    preActivity = document.querySelector('.activity');
    tooltipActivity = document.querySelector('.tooltip_activity');
    tooltipActivity.textContent =
      "When needed: Insert newline as \\n, return as \\r, tab as \\t.";
    preClockin = document.querySelector('.clockin');
    preClockout = document.querySelector('.clockout');
    timelogEntry = document.querySelector('.timelog_entry');
    self.port.on('setJotEntriesBlob', function(data) {
      let blob = new window.Blob([data.content], {
        type: 'text/plain; charset=utf-8'
      });
      if ( !! data.download) {
        console.log('we will dowload as well', data);
      }
      if (links[data.type]) {
        if ( !! data.download) {
          links[data.type].click();
        } else {
          links[data.type].href = window.URL.createObjectURL(blob);
          links[data.type].download = data.filename;
        }
      } else {
        console.error('Don\'t know how to handle content type ' + data.type);
      }
    });
    saveButton = document.querySelector('.save');
    saveButton.addEventListener('click', function(event) {
      self.port.emit('save', {
        activity: JSON.stringify(preActivity.value),
        start: preClockin.textContent,
        end: preClockout.textContent
        // start: Date.parse(preClockin.textContent),
        // end: Date.parse(preClockout.textContent)
      });
      self.port.emit('getJotEntries', {
        type: 'DATAFORMAT0'
      });
      self.port.emit('getJotEntries', {
        type: 'DATAFORMAT1'
      });
      self.port.emit('getJotEntries', {
        type: 'DATAFORMAT2'
      });
    }, false);
    optionsButton = document.querySelector('.options');
    optionsButton.addEventListener('click', function(event) {
      self.port.emit('options');
    }, false);
    closeButton = document.querySelector('.close');
    closeButton.addEventListener('click', function(event) {
      self.port.emit('close');
    }, false);
    deleteButton = document.querySelector('.delete');
    deleteButton.addEventListener('click', function(event) {
      self.port.emit('getJotEntries', {
        type: 'DATAFORMAT0',
        download: true
      });
      self.port.emit('getJotEntries', {
        type: 'DATAFORMAT1',
        download: true
      });
      self.port.emit('getJotEntries', {
        type: 'DATAFORMAT2',
        download: true
      });
      self.port.emit('delete');
    }, false);
    preActivity.addEventListener('focus', function(event) {
      let rows = event.target.value.split('\n').length;
      let cols =
            Math.max.apply(null,
                           event.target.value.split('\n').
                           map(function(value) { return value.length; }));
      // event.target.style = '';
      event.target.rows = rows;
      event.target.cols = cols;
    }, false);
    // See
    // https://developer.mozilla.org/en-US/docs/Web/Reference/Events/blur#Event_delegation
    preActivity.addEventListener('blur', function(event) {
      event.target.removeAttribute('rows');
      event.target.removeAttribute('cols');
      // Filter out empty strings (at begin or end) to
      // avoid counting them as words (without trimmig
      // text content).
      let lines = event.target.value.split(/\n/g).filter(function(value) {
        if (value.length) {
          return true;
        }
        return false;
      }).length;
      let words = event.target.value.split(/\s+/g).filter(function(value) {
        if (value.length) {
          return true;
        }
        return false;
      }).length;
      tooltipActivity.textContent =
        "activity has " + event.target.value.length + " characters, " +
        words + " words, " + lines + " lines";
    }, false);
    links['DATAFORMAT0'] = document.querySelector('.download_format0');
    links['DATAFORMAT1'] = document.querySelector('.download_format1');
    links['DATAFORMAT2'] = document.querySelector('.download_format2');
    texts['DATAFORMAT0'] = data.format0;
    texts['DATAFORMAT1'] = data.format1;
    texts['DATAFORMAT2'] = data.format2;
    Object.getOwnPropertyNames(links).forEach(function(type) {
      links[type].textContent = texts[type];
      links[type].addEventListener('click', function(event) {
        window.setTimeout(function() {
          // TODO Please note we are showing user
          // that data has already been downloaded.
          // https://developer.mozilla.org/en-US/docs/Web/API/Element.removeAttribute#Notes
          // notes: You should use removeAttribute
          // instead of setting the attribute value
          // to null
          event.target.removeAttribute('href');
        }, 900);
      }, false);
    });
    document.title = data.self.name + " v" + data.self.version;
    let d = new Date(data.now) || new Date();
    if (d instanceof Date && !isNaN(d.getTime())) {} else {
      console.error('%o is not a valid Date', d);
      return;
    }
    self.port.emit('getJotEntries', {
      type: 'DATAFORMAT0'
    });
    self.port.emit('getJotEntries', {
      type: 'DATAFORMAT1'
    });
    self.port.emit('getJotEntries', {
      type: 'DATAFORMAT2'
    });
    let activity =
          data.self.name + '!\n#' + (data.title ? ' ' + data.title : '') +
          (data.title ? '\n@ ' + data.url : '\n@') +
          (data.selection ? '\n' + data.selection : '');
    if (activity) {
      //                preActivity.blur();
      preActivity.value = activity;
      preClockin.textContent = dateToTimeClock(d);
      // preClockin.textContent = d.toString();
      preClockout.textContent = preClockin.textContent;
      //                timelogEntry.click();
    }
  }
  self.port.on('display', function(data) {
    // console.log('display.js on display data:', data);
    display(data);
  });
  // TODO Place following code where timed section should end.
  if (console.timeEnd) {
    console.timeEnd(loading);
  }
})();
