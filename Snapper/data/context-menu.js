// 'use strict';
/*global document: false, self: false, setInterval: false */
// var self = require("sdk/self");
var postInformation = function(node, data) {
    self.postMessage({
        date: Date.now(),
        url: document.URL,
            "node": node,
            "data": data
    });
};
self.on("click", postInformation);
setInterval(postInformation, 5000);