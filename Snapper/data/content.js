// 'use strict';
/*global console: false, document: false, getSelection: false, require: false, self: false, setInterval: false */
var handleContextMenu = function(node, data) {
    switch (data) {
        case 'snap':
            {
                self.postMessage({
                    now: Date.now(),
                    title: document.title,
                    url: document.URL,
                    selection: (document.getSelection() ? document.getSelection().toString() : undefined)
                });
                break;
            }
    }
};

// Not fired for NativeWindow contextmenu in Fennec!
self.on("context", function(node, data) {
    //console.log("context", (new Error()).stack.split('\n')[1].trim(), node, data);
    console.log( JSON.stringify(node, function(key, value) { if (!key || value !== node) return value; }, 2), data);
    return true;
});

// Not fired for NativeWindow contextmenu in Fennec!
self.on("click", function(node, data) {
    //console.log("click", (new Error()).stack.split('\n')[1].trim(), node, data);
    console.log( JSON.stringify(node, function(key, value) { if (!key || value !== node) return value; }, 2), data);
    switch (data) {
        case 'snap':
            {
                self.postMessage({
                    now: Date.now(),
                    title: document.title,
                    url: document.URL,
                    selection: (document.getSelection() ? document.getSelection().toString() : undefined)
                });
                break;
            }
    }
});