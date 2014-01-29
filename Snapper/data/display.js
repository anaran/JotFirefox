/*jslint browser: true, devel: true */
/*global findRegExpBar: false, chrome: false, console: false, require: false, document: false */
    'use strict';
(function() {
    // var loading = "loading started at " + new Error().stack.split(/\s+/)[2] + "\n(" + (chrome.app.getDetails() && chrome.app.getDetails().name || "no chrome.app.getDetails()") + ") takes";
    // console.time(loading);
    //TODO Place following code where timed section should end.
    //console.timeEnd(loading);
    //console.log("Reload it with Ctrl+R or as follows:\nlocation.reload(true)");
    //console.log("injection into " + document.URL + " in\n" + JSON.stringify(navigator.userAgent) + "\nends at\n" + JSON.stringify(Date()));
    var preActivity;
    var tooltipActivity;
    var preClockin;
    var preClockout;
    var timelogEntry;
    var downloadButton;
    var downloadLink;
    var saveButton;
    var closeButton;

    // Modified version of my own function from popchrom in
    // https://code.google.com/p/trnsfrmr/source/browse/Transformer/scripts/date.js?name=v1.8#92
    var replaceDates = function(format, date) {
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

    function dateToTimeClock(d) {
        // Taken from http://sajjadhossain.com/2008/10/31/javascript-string-trimming-and-padding/
        // pads left
        // Changed from String.prototype to function to remain side effect free.
        var lpad = function(strArg, padString, length) {
            var str = strArg.toString();
            while (str.length < length) {
                str = padString + str;
            }
            return str;
        };
        return lpad((d.getFullYear()), "0", 4) + "/" + lpad((d.getMonth() + 1), "0", 2) + "/" + lpad(d.getDate(), "0", 2) + " " + lpad(d.getHours(), "0", 2) + ":" + lpad(d.getMinutes(), "0", 2) + ":" + lpad(d.getSeconds(), "0", 2);
    }

    function display(data) {
        try {
            var d = new Date(data.now) || new Date();
            if (d instanceof Date && !isNaN(d.getTime())) {} else {
                console.error('%o is not a valid Date', d);
                return;
            };
            var activity = "Snap!" + (data.title ? '\n# ' + data.title : '\n#') + (data.title ? '\n@ ' + data.url : '\n@') + (data.selection ? '\n' + data.selection : '');
            if (activity) {
                preActivity.blur();
                preActivity.textContent = JSON.stringify(activity);
                preClockin.textContent = dateToTimeClock(d);
                preClockout.textContent = preClockin.textContent;
                timelogEntry.click();
            }
        } catch (exception) {
            //window.alert(new Date() + '\n\nexception.stack: ' + exception.stack);
            console.error(exception.message, exception.stack);
        }
    }
    document.addEventListener('readystatechange', function(event) {
        try {
            if (event.target.readyState !== "complete") {
                return;
            }
            preActivity = document.querySelector('.activity');
            tooltipActivity = document.querySelector('.tooltip_activity');
            tooltipActivity.textContent = "When needed: Insert newline as \\n, return as \\r, tab as \\t.";
            preClockin = document.querySelector('.clockin');
            preClockout = document.querySelector('.clockout');
            timelogEntry = document.querySelector('.timelog_entry');
            downloadButton = document.querySelector('.download');
            downloadLink = document.querySelector('a[download]');
                self.port.on('entries', function(data) {
                var blob = new window.Blob([JSON.stringify(data.entries, null, 4)], {
                    'type': 'text/utf-8'
                });
                downloadLink.href = window.URL.createObjectURL(blob);
                downloadLink.download = self.name + '@' + Date.now() + '.txt';
    });
            downloadButton.addEventListener('click', function(event) {
                try {

                    self.port.emit('download');
                } catch (exception) {
                    //window.alert(new Date() + '\n\nexception.stack: ' + exception.stack);
                    console.error(exception.message, exception.stack);
                    // console.error("exception:", exception);
                }
            }, false);
            saveButton = document.querySelector('.save');
            saveButton.addEventListener('click', function(event) {
                try {
                    self.port.emit('save', {
                        activity: preActivity.textContent,
                        start: preClockin.textContent,
                        end: preClockout.textContent
                    });
                } catch (exception) {
                    //window.alert(new Date() + '\n\nexception.stack: ' + exception.stack);
                    console.error(exception.message, exception.stack);
                    // console.error("exception:", exception);
                }
            }, false);
            closeButton = document.querySelector('.close');
            preActivity.addEventListener('focus', function(event) {
                try {
                    // console.log('focus');
                    event.target.textContent = JSON.parse(event.target.textContent);
                    tooltipActivity.textContent = "When needed: Insert newline as \\n, return as \\r, tab as \\t.";
                    // See https://developer.mozilla.org/en-US/docs/Web/Reference/Events/focus#Event_delegation
                    //}, !!"useCapture");
                } catch (exception) {
                    //window.alert(new Date() + '\n\nexception.stack: ' + exception.stack);
                    console.error(exception.message, exception.stack);
                }
            }, false);
            preActivity.addEventListener('blur', function(event) {
                try {
                    event.target.textContent = event.target.textContent.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t');
                    console.log('before stringify in blur:', event.target.textContent);
                    // Filter out empty strings (at begin or end) to avoid counting them as words (without trimmig text content).
                    var lines = event.target.textContent.split(/\n/g).filter(function(value) {
                        if (value.length) return value;
                    }).length;
                    var words = event.target.textContent.split(/\s+/g).filter(function(value) {
                        if (value.length) return value;
                    }).length;
                    tooltipActivity.textContent = "activity has " + event.target.textContent.length + " characters, " + words + " words, " + lines + " lines";
                    event.target.textContent = JSON.stringify(event.target.textContent);
                    // See https://developer.mozilla.org/en-US/docs/Web/Reference/Events/blur#Event_delegation
                    //}, !!"useCapture");
                } catch (exception) {
                    //window.alert(new Date() + '\n\nexception.stack: ' + exception.stack);
                    console.error(exception.message, exception.stack);
                }
            }, false);
            //                preActivity.focus();
            //                preActivity.blur();
            timelogEntry.addEventListener('click', function(event) {
                if (event.currentTarget === event.target) {
                    var selection = window.getSelection();
                    selection.removeAllRanges();
                    var range = document.createRange();
                    range.selectNodeContents(event.target);
                    // range.collapse(!'toStart');
                    // Always add the range to restore focus.
                    selection.addRange(range);
                }
            }, false);
            //            chrome.runtime.sendMessage({
            //                greeting: "display"
            //            }, function(response) {
            //                display(response.activity);
            //            });
        } catch (exception) {
            //window.alert(new Date() + '\n\nexception.stack: ' + exception.stack);
            console.error(exception.message, exception.stack);
        }
    }, false);
    //    var cb = function(request, sender, sendResponse) {
    //        console.log(sender.tab ?
    //            "from a content script:" + sender.tab.url :
    //            "from the extension");
    //        if (request.greeting === "display") {
    //            display(request.activity);
    //        }
    //    };
    //    chrome.runtime.onMessage.addListener(cb);
    //    console.timeEnd(loading);
    self.port.on('display', function(data) {
        display(data);
    });
    console.log("Reload it with Ctrl+R or as follows:\nlocation.reload(true)");
    console.log("injection into " + document.URL + " in\n" + JSON.stringify(navigator.userAgent) + "\nends at\n" + JSON.stringify(Date()));
})();