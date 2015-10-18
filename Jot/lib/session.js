'use strict';

var XHR_TIMEOUT_MS = 30000;

// Stub it out:
function addReadOnlyInfo(info, element) {
  // Only available in index.js:
  // log(JSON.stringify(info, Object.keys(info), 2));
}

// http://bl.ocks.org/nolanlawson/20f42479867fe0db8f66
// if (typeof require !== 'undefined') {
//   indexedDB = require('sdk/indexed-db').indexedDB;
//   IDBKeyRange = require('sdk/indexed-db').IDBKeyRange;
//   setTimeout = require('sdk/timers').setTimeout;
//   clearTimeout = require('sdk/timers').clearTimeout;
//   window = { btoa: require('sdk/base64').encode,
//              atob: require('sdk/base64').decode,
//              escape: require('sdk/querystring').escape };
//   XMLHttpRequest = require("sdk/net/xhr").XMLHttpRequest;
// }

if (typeof require !== 'undefined') {
    var indexedDB = require('sdk/indexed-db').indexedDB;
    var IDBKeyRange = require('sdk/indexed-db').IDBKeyRange;
    var setTimeout = require('sdk/timers').setTimeout;
    var clearTimeout = require('sdk/timers').clearTimeout;
    var window = { btoa: require('sdk/base64').encode,
		   atob: require('sdk/base64').decode,
		   escape: require('sdk/querystring').escape };
    var XMLHttpRequest = require("sdk/net/xhr").XMLHttpRequest;
}

exports.sessionLogin = function (/*window,*/ url, username, password) {
  // Returns AuthSession header in Firefox OS App with systemXHR permission
  var request;
  if (false && /* false && *//*window.*/location.protocol == "app:") {
    request = new /*window.*/XMLHttpRequest({ mozSystem: true, mozAnon: true });
  }
  else {
    request = new /*window.*/XMLHttpRequest({ mozSystem: false, mozAnon: false });
    // request = new /*window.*/XMLHttpRequest();
  }
  // TODO: sends username:password@ as part of the URL, exposing password in firefox net log!
  // NOTE: fauxton uses Authorization Basic
  // request.open('POST', url, !!'async'/*, username, password*/);
  request.open('POST', url, !!'async'/*, username, password*/);
  // if (/* false && */window.location.protocol == "app:") {
  // }
  // else {
  // }
  // request.withCredentials = true;
  request.setRequestHeader('Authorization', 'Basic ' + /*window.*/window.btoa(username + ':' + password));
  // request.setRequestHeader('X-Requested-With', 'xhr');
  // request.open('POST', url, !!'async', username, password);
  // request.open('POST', url, !!'async', '_', '_');
  // Required both in Firefox OS and Web App
  // request.setRequestHeader('X-PINGOTHER', 'pingpong');
  if (false && /* false && */window.location.protocol == "app:") {
  }
  else {
    request.withCredentials = true;
  }
  // request.setRequestHeader('Access-Control-Expose-Headers', 'Cookie, Set-Cookie');
  // request.setRequestHeader('Access-Control-Request-Headers', 'authorization,content-type,Set-Cookie');
  request.timeout = XHR_TIMEOUT_MS;
  request.ontimeout = onRequestError;
  request.onerror = onRequestError;
  // request.setRequestHeader('Content-Type', 'text/plain');
  request.setRequestHeader('Content-Type', 'application/json');
  // request.setRequestHeader('Accept', 'application/json, text/javascript, */*; q=0.01');
  // request.setRequestHeader('Accept', 'application/json');
  //request.setRequestHeader('Access-Control-Allow-Credentials', 'true');
  // Seems to be equivalent to state request.DONE
  // request.onload = function() {
  //     var infoNode = document.getElementById('replication_info');
  //     addReadOnlyInfo('request.onloadend ... ', infoNode);
  //     addReadOnlyInfo('this.readyState = ' + this.readyState, infoNode);
  //     addReadOnlyInfo('this.getAllResponseHeaders() = ' + this.getAllResponseHeaders(), infoNode);
  //     addReadOnlyInfo('request.responseText = ' + request.responseText, infoNode);
  //     addReadOnlyInfo('request.response = ' + request.response, infoNode);
  // };
  // request.onreadystatechange = function() {
  // request.onprogress = function() {
  request.onload = function() {
    // if (this.status == 401 || this.status == 0) {
    //   this.abort();
    // }
    if (/*true || */this.readyState == request.DONE) {
      // var infoNode = document.getElementById('replication_info');
      // addReadOnlyInfo('this.readyState = ' + this.readyState, infoNode);
      // addReadOnlyInfo('this.status = ' + this.status, infoNode);
      // addReadOnlyInfo('this.getAllResponseHeaders() = ' + this.getAllResponseHeaders(), infoNode);
      // addReadOnlyInfo('request.responseText = ' + request.responseText, infoNode);
      // addReadOnlyInfo('request.response = ' + request.response, infoNode);
      // addReadOnlyInfo('request.response.cookies = ' + request.response.cookies, infoNode);
      // // alert('this.getAllResponseHeaders() = ' + this.getAllResponseHeaders());
      // addReadOnlyInfo('this.getResponseHeader("Cookie") = ' + this.getResponseHeader('Cookie'), infoNode);
      // addReadOnlyInfo('this.getResponseHeader("Set-Cookie") = ' + this.getResponseHeader('Set-Cookie'), infoNode);
      // setCookie = this.getResponseHeader('Set-Cookie');
      // if (setCookie) {
      //   cookie = 
      //     setCookie.split(';')[0];
      //   addReadOnlyInfo(cookie, infoNode);
      //   // load.removeAttribute('disabled');
      // }
      // alert('request.responseText = ' + request.responseText);
      // alert('request.response = ' + request.response);
    }
  }
  request.send(JSON.stringify({'name': username, 'password': password/*, 'next': '/'*/}));
  // request.send();
  // FIXME: async!
  // return cookie;
};

exports.sessionLogout = function (/*window, */url) {
  var request;
  if (false && /* false && */window.location.protocol == "app:") {
    request = new /*window.*/XMLHttpRequest({ mozSystem: true, mozAnon: true });
  }
  else {
    request = new /*window.*/XMLHttpRequest({ mozSystem: false, mozAnon: false });
    // request = new window.XMLHttpRequest();
  }
  request.open('DELETE', url, !!'async');
  if (false && /* false && */window.location.protocol == "app:") {
    request.setRequestHeader('Cookie', cookie);
    cookie = "";
  }
  else {
    request.withCredentials = true;
  }
  // request.setRequestHeader('Authorization', 'Basic ' + window.btoa(document.getElementById('user').value + ':' + document.getElementById('pass').value));
  // Verified to be necessary in Firefox OS to delete cookie.
  request.timeout = XHR_TIMEOUT_MS;
  request.ontimeout = onRequestError;
  request.onerror = onRequestError;
  // request.onreadystatechange = function() {
  // request.onprogress = function() {
  request.onload = function() {
    if (/* true || */this.readyState == request.DONE) {
      // var infoNode = document.getElementById('replication_info');
      // addReadOnlyInfo('this.getAllResponseHeaders() = ' + this.getAllResponseHeaders(), infoNode);
      // addReadOnlyInfo('request.responseText = ' + request.responseText, infoNode);
      // addReadOnlyInfo('request.response = ' + request.response, infoNode);
      // // alert('this.getAllResponseHeaders() = ' + this.getAllResponseHeaders());
      // // alert('this.getResponseHeader("Set-Cookie") = ' + this.getResponseHeader('Set-Cookie'));
      // var data = request.response && JSON.parse(request.response);
      // if (data && data.ok) {
      //   // load.setAttribute('disabled', true);
      // }
      // // FIXME: async!
      // // return data.ok;
    }
  }
  request.send();
  // FIXME: async!
  // return false;
};

var onRequestError = function (event) {
  var errorMessage = JSON.stringify(event, [ 'type', 'lengthComputable', 'loaded', 'total' ], 2);
  if (event.type == 'error') {
    // window.alert('Please press Login');
  }
  // alert(errorMessage);
  showError(errorMessage);
};

var showError = function (text) {
  var infoNode = document.getElementById('replication_info');
  addReadOnlyInfo(text, infoNode);
  // errorMsg.textContent = text;
  // errorMsg.hidden = false;
  // results.hidden = true;
};
