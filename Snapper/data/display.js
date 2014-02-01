/*jslint browser: true, devel: true */
/*global findRegExpBar: false, chrome: false, console: false, require: false, document: false */
    'use strict';
// require does not seem to be available in content scripts.
//let sp = require('sdk/simple-prefs');
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
    var downloadFormat0Button;
    var downloadFormat1Button;
    var downloadFormat2Button;
    var downloadLink;
    var saveButton;
    var closeButton;
    var deleteButton;

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
            downloadFormat0Button.value = data.format0;
            downloadFormat1Button.value = data.format1;
            downloadFormat2Button.value = data.format2;
            var activity = "Snap!" + (data.title ? '\n# ' + data.title : '\n#') + (data.title ? '\n@ ' + data.url : '\n@') + (data.selection ? '\n' + data.selection : '');
            if (activity) {
                preActivity.blur();
                preActivity.textContent = JSON.stringify(activity);
                preClockin.textContent = dateToTimeClock(d);
                //preClockin.textContent = d.toString();
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
            downloadFormat0Button = document.querySelector('.download_format0');
            downloadFormat1Button = document.querySelector('.download_format1');
            downloadFormat2Button = document.querySelector('.download_format2');
            // Shared link for all download types for now.
            downloadLink = document.querySelector('a[download]');
            self.port.on('content', function(data) {
                var blob = new window.Blob([data.content], {
                    'type': 'text/utf-8'
                });
                downloadLink.href = window.URL.createObjectURL(blob);
                downloadLink.download = data.filename;
                downloadLink.click();
            });
            downloadFormat0Button.addEventListener('click', function(event) {
                try {
                    self.port.emit('download', {
                        type: 'DATAFORMAT0'
                    });
                } catch (exception) {
                    //window.alert(new Date() + '\n\nexception.stack: ' + exception.stack);
                    console.error(exception.message, exception.stack);
                    // console.error("exception:", exception);
                }
            }, false);
            downloadFormat1Button.addEventListener('click', function(event) {
                try {
                    self.port.emit('download', {
                        type: 'DATAFORMAT1'
                    });
                } catch (exception) {
                    //window.alert(new Date() + '\n\nexception.stack: ' + exception.stack);
                    console.error(exception.message, exception.stack);
                    // console.error("exception:", exception);
                }
            }, false);
            downloadFormat2Button.addEventListener('click', function(event) {
                try {
                    self.port.emit('download', {
                        type: 'DATAFORMAT2'
                    });
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
                        //                        start: Date.parse(preClockin.textContent),
                        //                        end: Date.parse(preClockout.textContent)
                    });
                } catch (exception) {
                    //window.alert(new Date() + '\n\nexception.stack: ' + exception.stack);
                    console.error(exception.message, exception.stack);
                    // console.error("exception:", exception);
                }
            }, false);
            closeButton = document.querySelector('.close');
            closeButton.addEventListener('click', function(event) {
                try {
                    self.port.emit('close');
                } catch (exception) {
                    //window.alert(new Date() + '\n\nexception.stack: ' + exception.stack);
                    console.error(exception.message, exception.stack);
                    // console.error("exception:", exception);
                }
            }, false);
            deleteButton = document.querySelector('.delete');
            deleteButton.addEventListener('click', function(event) {
                try {
                    self.port.emit('download', {
                        type: 'DATAFORMAT0'
                    });
                    self.port.emit('download', {
                        type: 'DATAFORMAT1'
                    });
                    self.port.emit('download', {
                        type: 'DATAFORMAT2'
                    });
                    self.port.emit('delete');
                } catch (exception) {
                    //window.alert(new Date() + '\n\nexception.stack: ' + exception.stack);
                    console.error(exception.message, exception.stack);
                    // console.error("exception:", exception);
                }
            }, false);
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
            if (false) {
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
            }
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