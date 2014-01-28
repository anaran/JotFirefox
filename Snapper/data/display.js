/*jslint browser: true, devel: true */
/*global findRegExpBar: false, chrome: false, console: false, navigator: false, document: false */
    'use strict';
(function() {
    // var loading = "loading started at " + new Error().stack.split(/\s+/)[2] + "\n(" + (chrome.app.getDetails() && chrome.app.getDetails().name || "no chrome.app.getDetails()") + ") takes";
    // console.time(loading);
    //TODO Place following code where timed section should end.
    //console.timeEnd(loading);
    //console.log("Reload it with Ctrl+R or as follows:\nlocation.reload(true)");
    //console.log("injection into " + document.URL + " in\n" + JSON.stringify(navigator.userAgent) + "\nends at\n" + JSON.stringify(Date()));
    var preActivity;
    var preClockin;
    var preClockout;
    var timelogEntry;

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

    function display(activity) {
        try {
            if (activity) {
                preActivity.blur();
                preActivity.textContent = activity;
                preClockin.textContent = dateToTimeClock(new Date());
                preClockout.textContent = preClockin.textContent;
                timelogEntry.click();
            }
        } catch (exception) {
            //window.alert(new Date() + '\n\nexception.stack: ' + exception.stack);
            console.error(new Date(), "exception:", exception);
        }
    }
    document.addEventListener('readystatechange', function(event) {
        try {
            if (event.target.readyState !== "complete") {
                return;
            }
            preActivity = document.querySelector('.activity');
            preClockin = document.querySelector('.clockin');
            preClockout = document.querySelector('.clockout');
            timelogEntry = document.querySelector('.timelog_entry');
            preActivity.addEventListener('focus', function(event) {
                try {
                    // console.log('focus');
                    event.target.textContent = JSON.parse(event.target.textContent);
                    // See https://developer.mozilla.org/en-US/docs/Web/Reference/Events/focus#Event_delegation
                    //}, !!"useCapture");
                } catch (exception) {
                    //window.alert(new Date() + '\n\nexception.stack: ' + exception.stack);
                    console.error(new Date(), "exception:", exception);
                }
            }, false);
            preActivity.addEventListener('blur', function(event) {
                try {
                    // console.log('blur');
                    event.target.title = "activity has " + event.target.textContent.length + " characters, " + event.target.textContent.split(/\s+/g).length + " words";
                    event.target.textContent = JSON.stringify(event.target.textContent);
                    // See https://developer.mozilla.org/en-US/docs/Web/Reference/Events/blur#Event_delegation
                    //}, !!"useCapture");
                } catch (exception) {
                    //window.alert(new Date() + '\n\nexception.stack: ' + exception.stack);
                    console.error(new Date(), "exception:", exception);
                }
            }, focus);
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
            console.error(new Date(), "exception:", exception);
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
        display("Snap!" + (data.title ? '\n# ' + data.title : '\n#') + (data.title ? '\n@ ' + data.url : '\n@') + (data.selection ? '\n' + data.selection : ''));
    });
    console.log("Reload it with Ctrl+R or as follows:\nlocation.reload(true)");
    console.log("injection into " + document.URL + " in\n" + JSON.stringify(navigator.userAgent) + "\nends at\n" + JSON.stringify(Date()));
})();