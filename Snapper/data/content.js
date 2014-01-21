// 'use strict';
/*global document: false, self: false, setInterval: false */
// var self = require("sdk/self");
//var postInformation = function(node, data) {
//    self.postMessage({
//        date: Date.now(),
//        url: document.URL,
//            "node": node,
//            "data": data
//    });
//};
var displayInformation = function( /*event*/ ) {
    //        var myX = (event.targetTouches) ? event.targetTouches[event.targetTouches.length - 1].clientX : event.clientX;
    //        var myY = (event.targetTouches) ? event.targetTouches[event.targetTouches.length - 1].clientY : event.clientY;
    //        console.log(event.type, event.target, event.detail);
    var myDocument = document;
    var snapperDiv = myDocument.createElement('div');
    snapperDiv.style.position = 'fixed';
    //        if (true && document.documentElement && (myX > document.documentElement.clientWidth / 2)) {
    //            snapperDiv.style.right = (document.documentElement.clientWidth - myX) + 'px';
    //        } else {
    //            snapperDiv.style.left = myX + 'px';
    //        }
    //        if (true && document.documentElement && (myY > document.documentElement.clientHeight / 2)) {
    //            snapperDiv.style.bottom = (document.documentElement.clientHeight - myY) + 'px';
    //        } else {
    //            snapperDiv.style.top = myY + 'px';
    //        }
    snapperDiv.style.left = '2em';
    snapperDiv.style.top = '2em';
    snapperDiv.style.backgroundColor = 'white';
    snapperDiv.style.padding = '2px';
    snapperDiv.style.border = '1px dashed';
    var snapperPre = myDocument.createElement('pre');
    var selection = document.getSelection().toString();
    snapperPre.textContent = document.title + (selection ? '\n\n' + selection : '') + '\n\n' + document.URL + '\n';
    snapperDiv.appendChild(snapperPre);
    var close = snapperDiv.appendChild(myDocument.createElement('input'));
    close.value = "Close";
    close.type = 'button';
    close.addEventListener('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        document.body.removeChild(snapperDiv);
    }, false);
    myDocument.body.appendChild(snapperDiv);
};
self.port.on("welcome", function(tag) {
    console.log(tag);
    //    (function() {
    // See https://developer.mozilla.org/en-US/Add-ons/Firefox_for_Android/Initialization_and_Cleanup?redirectlocale=en-US&redirectslug=Extensions%2FMobile%2FInitialization_and_Cleanup
    //        var Cc = Components.classes;
    //        var Ci = Components.interfaces;
    //        var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
    //
    //        // Load into any existing windows
    //        var windows = wm.getEnumerator("navigator:browser");
    //        var domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
    // if ( !! domWindow && domWindow.NativeWindow) {
    //    document.addEventListener('contextmenu', displayInformation, false);
    //    document.addEventListener('touchend', displayInformation, false);
    // })();
    self.port.emit('hello', 'goodbye');
    self.port.on("display", function(tag) {
        if (tag === "information") {
            displayInformation();
        }
    });
});
// self.on("click", postInformation);
// setInterval(postInformation, 5000);