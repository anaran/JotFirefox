// 'use strict';
/*global document: false, self: false, setInterval: false */
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

// Not fired for NativeWindow contextmenu in Fennec!
// TODO: Remove completely!
self.on("context", function(node, data) {
    console.log("context", (new Error()).stack.split('\n')[1].trim(), node, data);
    return true;
});

// Not fired for NativeWindow contextmenu in Fennec!
// TODO: Remove completely!
self.on("click", function(node, data) {
    console.log("click", (new Error()).stack.split('\n')[1].trim(), node, data);
    self.postMessage({
        now: Date.now(),
        title: document.title,
        url: document.URL,
        selection: (document.getSelection() ? document.getSelection().toString() : undefined)
    });
});