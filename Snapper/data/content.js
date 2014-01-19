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
//document.addEventListener('contextmenu', function(event) {
//    console.log(event.type, event.target, event.detail);
//    //    window.alert(JSON.stringify({ event.type, event.target, event.detail }));
//}, false);
self.port.on("welcome", function(tag) {
    console.log(tag);
    // document.addEventListener('contextmenu', function(event) {
    // document.addEventListener('click', function(event) {
    var myDocument = document;
        var autosaveIndicator = myDocument.createElement('div');
        autosaveIndicator.style.position = 'fixed';
        autosaveIndicator.style.top = '20px';
        autosaveIndicator.style.left = '20px';
//        autosaveIndicator.style.bottom = '1em';
//        autosaveIndicator.style.right = '1em';
        autosaveIndicator.style.backgroundColor = 'white';
        autosaveIndicator.style.border = '1px dashed';
        // autosaveIndicator.style.transition = 'opacity 1s 0s';

        var downloadLink = myDocument.createElement('pre');
        downloadLink.textContent = document.URL + '\n' + document.title + '\n';
        autosaveIndicator.appendChild(downloadLink);

        var close = autosaveIndicator.appendChild(myDocument.createElement('span'));
        close.textContent = "[x]";
        close.addEventListener('click', function(event) {
            event.preventDefault();
                document.body.removeChild(autosaveIndicator);
        }, false);
        myDocument.body.appendChild(autosaveIndicator);
    document.addEventListener('touchstart', function(event) {
//    self.on('contextmenu', function(event) {
        console.log(event.type, event.target, event.detail);
        self.port.emit('contextmenu', event.type);

        //    window.alert(JSON.stringify({ event.type, event.target, event.detail }));
    });
    self.port.emit('hello', 'goodbye');
});
// self.on("click", postInformation);
// setInterval(postInformation, 5000);