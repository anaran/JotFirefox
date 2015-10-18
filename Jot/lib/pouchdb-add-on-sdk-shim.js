if (typeof require !== 'undefined') {
    indexedDB = require('sdk/indexed-db').indexedDB;
    IDBKeyRange = require('sdk/indexed-db').IDBKeyRange;
    setTimeout = require('sdk/timers').setTimeout;
    clearTimeout = require('sdk/timers').clearTimeout;
    btoa = require('sdk/base64').encode;
    window = { btoa: require('sdk/base64').encode,
               atob: require('sdk/base64').decode,
               escape: require('sdk/querystring').escape };
    Blob = require('sdk/addon/window').window.Blob;
    URL = require('sdk/addon/window').window.URL;
    XMLHttpRequest = require("sdk/net/xhr").XMLHttpRequest;
}
