/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*- */
/*jslint browser: true, devel: true */
/*global findRegExpBar: false, chrome: false, console: false, require: false, document: false */
'use strict';
// Firefox Addon Content Script.
// require does not seem to be available in content scripts.
// let sp = require('sdk/simple-prefs');
(function() {
  var loading = "loading started at " + new Error().stack.split(/\s+/)[2] +
        "\n(" + ") takes";
  console.log(loading);
  // TODO console.time is not available in FireFox addon content script.
  if (console.time) {
    console.time(loading);
  }
  // console.log(JSON.stringify(console, null, 2));
  // console.log(Console.prototype);
  // console.log(console.log);
  // console.log(console.log.toSource());
  console.log('display.js self:', self);
  var preActivity;
  var tooltipActivity;
  var preClockin;
  var preClockout;
  var timelogEntry;
  var links = {};
  var texts = {};
  var saveButton;
  var closeButton;
  var deleteButton;

  function dateToTimeClock(d) {
    // Taken from
    // http://sajjadhossain.com/2008/10/31/javascript-string-trimming-and-padding/
    // pads left
    // Changed from String.prototype to function to remain side effect free.
    var lpad = function(strArg, padString, length) {
      var str = strArg.toString();
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
    // TODO: This try catch colsole.log message never appears in the
    // console. Right now it's better not to catch and log exceptions
    // since the addon debugger console will show them.
    // try {
      preActivity = document.querySelector('.activity');
      tooltipActivity = document.querySelector('.tooltip_activity');
      tooltipActivity.textContent =
        "When needed: Insert newline as \\n, return as \\r, tab as \\t.";
      preClockin = document.querySelector('.clockin');
      preClockout = document.querySelector('.clockout');
      timelogEntry = document.querySelector('.timelog_entry');
      self.port.on('setSnapperEntriesBlob', function(data) {
        var blob = new window.Blob([data.content], {
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
        try {
          self.port.emit('save', {
            activity: JSON.stringify(preActivity.value),
            start: preClockin.textContent,
            end: preClockout.textContent
            // start: Date.parse(preClockin.textContent),
            // end: Date.parse(preClockout.textContent)
          });
          self.port.emit('getSnapperEntries', {
            type: 'DATAFORMAT0'
          });
          self.port.emit('getSnapperEntries', {
            type: 'DATAFORMAT1'
          });
          self.port.emit('getSnapperEntries', {
            type: 'DATAFORMAT2'
          });
        } catch (exception) {
          // window.alert(exception.toString());
          console.error(exception);
        }
      }, false);
      closeButton = document.querySelector('.close');
      closeButton.addEventListener('click', function(event) {
        try {
          self.port.emit('close');
        } catch (exception) {
          // window.alert(exception.toString());
          console.error(exception);
        }
      }, false);
      deleteButton = document.querySelector('.delete');
      deleteButton.addEventListener('click', function(event) {
        try {
          self.port.emit('getSnapperEntries', {
            type: 'DATAFORMAT0',
            download: true
          });
          self.port.emit('getSnapperEntries', {
            type: 'DATAFORMAT1',
            download: true
          });
          self.port.emit('getSnapperEntries', {
            type: 'DATAFORMAT2',
            download: true
          });
          self.port.emit('delete');
          //                    location.reload(true);
        } catch (exception) {
          // window.alert(exception.toString());
          console.error(exception);
        }
      }, false);
      preActivity.addEventListener('focus', function(event) {
        try {
          var rows = event.target.value.split('\n').length;
          var cols =
                Math.max.apply(null,
                               event.target.value.split('\n').
                               map(function(value) { return value.length; }));
          // event.target.style = '';
          event.target.rows = rows;
          event.target.cols = cols;
        } catch (exception) {
          // window.alert(exception.toString());
          console.error(exception);
        }
      }, false);
      preActivity.addEventListener('blur', function(event) {
        try {
          event.target.removeAttribute('rows');
          event.target.removeAttribute('cols');
          // Filter out empty strings (at begin or end) to
          // avoid counting them as words (without trimmig
          // text content).
          var lines = event.target.value.split(/\n/g).filter(function(value) {
            if (value.length) {
              return true;
            }
            return false;
          }).length;
          var words = event.target.value.split(/\s+/g).filter(function(value) {
            if (value.length) {
              return true;
            }
            return false;
          }).length;
          tooltipActivity.textContent =
            "activity has " + event.target.value.length + " characters, " +
            words + " words, " + lines + " lines";
          // See
          // https://developer.mozilla.org/en-US/docs/Web/Reference/Events/blur#Event_delegation
        } catch (exception) {
          // window.alert(exception.toString());
          console.error(exception);
        }
      }, false);
      links['DATAFORMAT0'] = document.querySelector('.download_format0');
      links['DATAFORMAT1'] = document.querySelector('.download_format1');
      links['DATAFORMAT2'] = document.querySelector('.download_format2');
      texts['DATAFORMAT0'] = data.format0;
      texts['DATAFORMAT1'] = data.format1;
      texts['DATAFORMAT2'] = data.format2;
      // console.log(links);
      Object.getOwnPropertyNames(links).forEach(function(type) {
        links[type].textContent = texts[type];
        links[type].addEventListener('click', function(event) {
          try {
            window.setTimeout(function() {
              // TODO Please note we are showing user
              // that data has already been downloaded.
              // https://developer.mozilla.org/en-US/docs/Web/API/Element.removeAttribute#Notes
              // notes: You should use removeAttribute
              // instead of setting the attribute value
              // to null
              event.target.removeAttribute('href');
            }, 900);
          } catch (exception) {
            // window.alert(exception.toString());
            console.error(exception);
          }
        }, false);
      });
      document.title = data.self.name + " v" + data.self.version;
      var d = new Date(data.now) || new Date();
      if (d instanceof Date && !isNaN(d.getTime())) {} else {
        console.error('%o is not a valid Date', d);
        return;
      }
      self.port.emit('getSnapperEntries', {
        type: 'DATAFORMAT0'
      });
      self.port.emit('getSnapperEntries', {
        type: 'DATAFORMAT1'
      });
      self.port.emit('getSnapperEntries', {
        type: 'DATAFORMAT2'
      });
      var activity =
            "Snap!" + (data.title ? '\n# ' + data.title : '\n#') +
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
    // } catch (exception) {
    //   // window.alert(exception.toString());
    //   console.log(exception);
    // }
  }
  self.port.on('display', function(data) {
    console.log('display.js on display data:', data);
    display(data);
  });
  // TODO Place following code where timed section should end.
  if (console.timeEnd) {
    console.timeEnd(loading);
  }
  console.log("Reload it with Ctrl+R or as follows:\nlocation.reload(true)");
  console.log("injection into " + document.URL + " in\n" +
              JSON.stringify(navigator.userAgent) + "\nends at\n" +
              JSON.stringify(Date()));
})();
