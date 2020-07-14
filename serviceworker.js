/*! Copyright (c) 2020 WhatsApp Inc. All Rights Reserved. */
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 72);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(LOG) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.upload = upload;
exports.log = void 0;

var _memoize2 = _interopRequireDefault(__webpack_require__(21));

var _actions = _interopRequireDefault(__webpack_require__(1));

var _format_log_message = _interopRequireDefault(__webpack_require__(54));

var _service_worker_bus = _interopRequireDefault(__webpack_require__(3));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _templateObject() {
  var data = _taggedTemplateLiteral(["Unable to send upload request, error: ", ""]);

  _templateObject = function () {
    return data;
  };

  return data;
}

function _taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

////////////////////////////////////////////////////////////////////////////////
// Module-Level Variables / Helper Functions
////////////////////////////////////////////////////////////////////////////////
var LevelNames = {
  LOG: 'log',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  ERROR_VERBOSE: 'errorVerbose'
};
var UPLOAD_RETRY_LIMIT = 3;
var UPLOAD_RETRY_INTERVAL = 1000; // in ms

var logBuffer = [];
var flushBufferPromise = Promise.resolve();
var uploadPromise;
/**
 * Ensures method only runs once every `time` milliseconds.
 * @param  {function} method
 * @param  {number} time In milliseconds
 * @return {function} Calling the method will return a promise that gets resolved
 * to the return value of `method`
 */

function throttle(method, time) {
  var promise, called;

  function ret() {
    if (!promise) {
      var args = Array.prototype.slice.call(arguments);
      promise = new Promise(function (resolve) {
        self.setTimeout(function () {
          promise = null;

          if (called) {
            resolve(ret.apply(null, args));
            called = false;
          }

          resolve();
        }, time);
      });
      return Promise.resolve(method.apply(null, args));
    } else {
      called = true;
      return promise;
    }
  }

  return ret;
}
/**
 * @param  {number} time in ms
 * @return {Promise} Resolve after `time` ms
 */


function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
} ////////////////////////////////////////////////////////////////////////////////
// Sending to Page
////////////////////////////////////////////////////////////////////////////////


var flushBuffer = throttle(_flushBuffer, 500);
/**
 * Send logBuffer to all claimed clients
 * @return {Promise}
 */

function _flushBuffer() {
  if (logBuffer.length === 0) return Promise.resolve();
  return _service_worker_bus.default.broadcast(_actions.default.LOG, {
    buffer: logBuffer
  }).then(function (e) {
    logBuffer = [];
  }).catch(function () {});
}
/**
 * Request client to log passed in messages and upload logs.
 * This will wait for any pending log buffer flushes before sending
 * the upload message. If no clients are found then the methods waits for
 * `UPLOAD_RETRY_INTERVAL` ms and tries again. It retries `UPLOAD_RETRY_LIMIT`
 * times.
 *
 * @param {*} logMessage Any messages that should be logged before uploading
 * @return {Promise} Resolves once upload request message is sent
 */


function upload() {
  for (var _len = arguments.length, message = new Array(_len), _key = 0; _key < _len; _key++) {
    message[_key] = arguments[_key];
  }

  if (message.length) {
    logBuffer.push({
      level: LevelNames.ERROR_VERBOSE,
      message: message
    });
  }

  uploadPromise = uploadPromise || _upload();
  return uploadPromise;
}

function _upload() {
  var retryAttempts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
  return flushBufferPromise.then(function () {
    // Since it's possible that this message gets delivered before
    // the prev. flush message and we want any prev logs to get
    // processed before we upload.
    return _service_worker_bus.default.broadcast(_actions.default.UPLOAD_LOGS, {
      buffer: logBuffer
    });
  }).catch(function () {
    if (retryAttempts < UPLOAD_RETRY_LIMIT) {
      return delay(UPLOAD_RETRY_INTERVAL).then(function () {
        return _upload(retryAttempts + 1);
      });
    } else {
      // TODO (T66044382): Audit/convert to error
      // eslint-disable-next-line prefer-promise-reject-errors
      return Promise.reject('Max generation reached. Failed to upload.');
    }
  }).then(function (value) {
    uploadPromise = undefined;
    return value;
  }).catch(function (err) {
    LOG(4
    /* level=ERROR */
    )(_templateObject(), err);
    uploadPromise = undefined;
  });
} ////////////////////////////////////////////////////////////////////////////////
// Logging
////////////////////////////////////////////////////////////////////////////////
// The logging API. This is not meant to be called directly. Instead you should
// use LOG, DEV, WARN, and ERROR tagged templates and babel-plugin-wa-logging
// will transform them into calls to this. Note the use of `memoize()` to avoid
// creating a new function on every call.


var log = (0, _memoize2.default)(function (level) {
  var verbose = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  return function (strings) {
    for (var _len2 = arguments.length, substitutions = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      substitutions[_key2 - 1] = arguments[_key2];
    }

    var message = (0, _format_log_message.default)(strings, substitutions, !verbose);
    logMessage(getLevelName(level, verbose), [message]);
    return message;
  };
}, function (level, verbose) {
  return "".concat(level).concat(verbose ? 'Verbose' : '');
});
exports.log = log;

function logMessage(level, message) {
  if (message.length === 0) return;
  logBuffer.push({
    level,
    message
  });
  flushBufferPromise = flushBuffer();
}

self.addEventListener('error', function (evt) {
  upload("Global Scope error: ".concat(String(evt.error), ", stack: ").concat(evt.error ? evt.error.stack : ''));
}); ////////////////////////////////////////////////////////////////////////////////
// Exports
////////////////////////////////////////////////////////////////////////////////

/**
 * We now use integers to represent log levels. However, in order to keep the
 * server worker message format consistent, we continue to use strings in them.
 */

function getLevelName(numericLevel, verbose) {
  switch (numericLevel) {
    case 1:
      return LevelNames.INFO;

    case 2:
      return LevelNames.LOG;

    case 3:
      return LevelNames.WARN;

    case 4:
      return verbose ? LevelNames.ERROR_VERBOSE : LevelNames.ERROR;

    default:
  }

  throw new Error("Invalid numeric level ".concat(numericLevel).concat(verbose ? ', verbose' : ''));
}
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(0)["log"]))

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var Actions = {
  // SW -> Client
  REQUEST_STREAMING_INFO: 'GET_STREAMING_INFO',
  REQUEST_RMR: 'REQUEST_RMR',
  SEND_STREAMING_CHUNK: 'SEND_STREAMING_CHUNK',
  EXP_BACKOFF: 'EXP_BACKOFF',
  LOG: 'LOG',
  UPLOAD_LOGS: 'UPLOAD_LOGS',
  REQUEST_DOCUMENT_DOWNLOAD: 'REQUEST_DOCUMENT_DOWNLOAD',
  // Client -> SW
  SET_L10N: 'SET_L10N',
  STREAMING_SUPPORTED: 'STREAMING_SUPPORTED',
  REMOVE_PP: 'REMOVE_PP',
  LOGOUT: 'LOGOUT',
  CLEAN_ASSETS: 'CLEAN_ASSETS',
  PRELOAD_LAZY_LOADED_BUNDLES: 'PRELOAD_LAZY_LOADED_BUNDLES'
};
var _default = Actions;
exports.default = _default;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var UrlRegex = new RegExp("(".concat(self.registration.scope, "|https://web.whatsapp.com/|https://dyn.web.whatsapp.com/)([^?]*)(?:\\?(.*))?"));

// Base class for handling a request in the Service Worker
var SWFeature =
/*#__PURE__*/
function () {
  _createClass(SWFeature, null, [{
    key: "parseUrl",
    value: function parseUrl(url) {
      var match = url.match(UrlRegex);
      if (!match) return;
      var queryParams;

      if (match[3]) {
        var parsedParams = {};
        match[3].split('&').forEach(function (param) {
          var pair = param.split('=');
          parsedParams[pair[0]] = pair[1];
        });
        queryParams = parsedParams;
      }

      return {
        base: match[1],
        relativePath: match[2],
        queryParams: queryParams
      };
    }
  }, {
    key: "convertToUrl",
    value: function convertToUrl(url, params) {
      var paramString = Object.keys(params).map(function (key) {
        return [key, params[key]].map(encodeURIComponent).join('=');
      }).join('&');

      if (paramString.length) {
        return url.endsWith('/') ? "".concat(url, "?").concat(paramString) : "".concat(url, "/?").concat(paramString);
      } else {
        return url;
      }
    }
  }]);

  function SWFeature(cache, store) {
    _classCallCheck(this, SWFeature);

    this.matchFetch = function () {
      return false;
    };

    this.matchAction = function () {
      return false;
    };

    this.matchInstall = function () {
      return false;
    };

    this.matchActivate = function () {
      return false;
    };

    this.cache = cache;
    this.store = store;
  }

  return SWFeature;
}();

exports.default = SWFeature;
SWFeature.RequestType = {
  GET: 'GET'
};

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var ServiceWorkerBus =
/*#__PURE__*/
function () {
  function ServiceWorkerBus(requestHandler) {
    var _this = this;

    _classCallCheck(this, ServiceWorkerBus);

    this.onMessage = function (event) {
      // No action supplied
      if (!event.data || !event.data.action) return;
      var data = event.data; // Must supply a response port

      if (!event.ports || event.ports.length === 0) return;
      var ports = event.ports; // Ensure msg is from correct serviceWorker

      if (!ServiceWorkerBus.isSW() && window.navigator.serviceWorker && event.source !== window.navigator.serviceWorker.controller) {
        return;
      } // ServiceWorker can get killed. Use waitUntil to keep it open while
      // processing events.


      var waitUntil = // $FlowFixMe (T48256721) - event instanceof ServiceWorkerMessageEvent will not work here
      typeof event.waitUntil === 'function' ? // $FlowFixMe (T48256715) - event instanceof ServiceWorkerMessageEvent will not work here
      function (p) {
        return event.waitUntil(p);
      } : function () {};
      waitUntil(Promise.resolve(_this.requestHandler(data)).then(function (response) {
        ports[0].postMessage(response);
      }).catch(function (error) {
        ports[0].postMessage({
          error: error && error.toString()
        });
      }));
    };

    this.requestHandler = requestHandler;
  }

  _createClass(ServiceWorkerBus, [{
    key: "init",
    value: function init() {
      var receiver = ServiceWorkerBus.isSW() ? self : window.navigator.serviceWorker;

      try {
        if (!receiver) return;
        receiver.addEventListener('message', this.onMessage);
      } catch (e) {// TODO (T65806249) Add logging
      }
    }
  }], [{
    key: "isSW",
    value: function isSW() {
      return typeof window === 'undefined';
    }
  }, {
    key: "getRequestor",
    value: function getRequestor(client) {
      if (!ServiceWorkerBus.isSW()) {
        if (!window.navigator.serviceWorker) return Promise.resolve(null);
        return window.navigator.serviceWorker.ready.then(function () {
          if (!window.navigator.serviceWorker) return null;
          return window.navigator.serviceWorker.controller;
        });
      } else if (typeof client === 'string') {
        return self.clients.get(client);
      } else {
        return Promise.resolve(client);
      }
    } // Temporarily add this for use in the logger. This should probably be
    // removed, not sure we need a broadcast. Mainly used in the logger.

  }, {
    key: "broadcast",
    value: function broadcast(action, message) {
      if (!ServiceWorkerBus.isSW()) {
        throw new Error('Broadcast called from non-serviceworker.');
      }

      return self.clients.matchAll().then(function (clients) {
        // TODO (T66044382): Audit/convert to error
        // eslint-disable-next-line prefer-promise-reject-errors
        if (clients.length === 0) return Promise.reject('No clients available.');
        return Promise.all(clients.map(function (client) {
          return ServiceWorkerBus.request(client, action, message);
        }));
      });
    }
  }, {
    key: "request",
    value: function request(client, action, message) {
      var channel = new MessageChannel();
      var promise = new Promise(function (resolve, reject) {
        channel.port1.onmessage = function (event) {
          if (event.data && event.data.error) {
            // $FlowFixMe (T66044382): Audit/convert to error
            reject(event.data.error);
          } else {
            resolve(event.data);
          }
        };

        return ServiceWorkerBus.getRequestor(client).then(function (client) {
          // TODO (T66044382): Audit/convert to error
          // eslint-disable-next-line prefer-promise-reject-errors
          if (!client) return reject('No ServiceWorker controlling this client.');
          client.postMessage({
            action,
            message,
            version: '2.2029.4'
          }, [channel.port2]);
        });
      });
      return promise;
    }
  }]);

  return ServiceWorkerBus;
}();

exports.default = ServiceWorkerBus;

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

var getNative = __webpack_require__(9);

/* Built-in method references that are verified to be native. */
var nativeCreate = getNative(Object, 'create');

module.exports = nativeCreate;


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

var eq = __webpack_require__(44);

/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} key The key to search for.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function assocIndexOf(array, key) {
  var length = array.length;
  while (length--) {
    if (eq(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}

module.exports = assocIndexOf;


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

var isKeyable = __webpack_require__(50);

/**
 * Gets the data for `map`.
 *
 * @private
 * @param {Object} map The map to query.
 * @param {string} key The reference key.
 * @returns {*} Returns the map data.
 */
function getMapData(map, key) {
  var data = map.__data__;
  return isKeyable(key)
    ? data[typeof key == 'string' ? 'string' : 'hash']
    : data.map;
}

module.exports = getMapData;


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/**
 * Clone a request and change it's properties to those in `options`
 * This should be used if a read-only property of a request must be modified
 * Note: The `referrer` property is not copied as it can lead to problems
 * (see 042c0e9 for more info)
 *
 * @param  {string} [url] The modified url of the request, if undefined
 * `request.url` will be used
 * @param  {object} [options] Contains the modified properties that should be set
 * on the returned request. Any missing properties will be copied from the
 * passed in `request` param
 *
 * @return {Request}
 */
function manuallyCloneRequest(request, url, options_) {
  var options = options_;

  if (typeof request === 'string') {
    options = options || {};
    options.credentials = 'same-origin'; // eslint-disable-next-line compat/compat

    return new Request(url || request, options);
  } else {
    // eslint-disable-next-line compat/compat
    return new Request(url || request.url, {
      method: options.method === undefined ? request.method : options.method,
      headers: options.headers === undefined ? request.headers : options.headers,
      mode: options.mode === undefined ? request.mode : options.mode,
      credentials: 'same-origin',
      cache: options.cache === undefined ? request.cache : options.cache,
      redirect: options.redirect === undefined ? request.redirect : options.redirect,
      integrity: options.integrity === undefined ? request.integrity : options.integrity
    });
  }
}
/**
 * @return {string} The path of the index page of the locale in `l10nData`
 * or the default index path if `l10nData` doesn't contain a `lng` property
 * containing the locale
 */


function getIndexPath(l10nData) {
  if (l10nData && l10nData.locale) {
    return "%F0%9F%8C%90/".concat(l10nData.locale);
  } else {
    return '';
  }
}

var Utils = {
  manuallyCloneRequest,
  getIndexPath
};
var _default = Utils;
exports.default = _default;

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

var freeGlobal = __webpack_require__(29);

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

module.exports = root;


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

var baseIsNative = __webpack_require__(26),
    getValue = __webpack_require__(36);

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = getValue(object, key);
  return baseIsNative(value) ? value : undefined;
}

module.exports = getNative;


/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

var root = __webpack_require__(8);

/** Built-in value references. */
var Symbol = root.Symbol;

module.exports = Symbol;


/***/ }),
/* 11 */
/***/ (function(module, exports) {

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return value != null && (type == 'object' || type == 'function');
}

module.exports = isObject;


/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(LOG) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _indexed_db = _interopRequireDefault(__webpack_require__(13));

var _nullthrows = _interopRequireDefault(__webpack_require__(14));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _templateObject6() {
  var data = _taggedTemplateLiteral(["Unable to clear object store: ", ", error: ", ""]);

  _templateObject6 = function () {
    return data;
  };

  return data;
}

function _templateObject5() {
  var data = _taggedTemplateLiteral(["Unable to delete in db, object store: ", ", key: ", ", error: ", ""]);

  _templateObject5 = function () {
    return data;
  };

  return data;
}

function _templateObject4() {
  var data = _taggedTemplateLiteral(["Unable to put to db, object store: ", ", key: ", ", value: ", ", error: ", ""]);

  _templateObject4 = function () {
    return data;
  };

  return data;
}

function _templateObject3() {
  var data = _taggedTemplateLiteral(["Unable to fetch from db, object store: ", ", key: ", ", error: ", ""]);

  _templateObject3 = function () {
    return data;
  };

  return data;
}

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _templateObject2() {
  var data = _taggedTemplateLiteral(["Unable to open sw database, error: ", ""]);

  _templateObject2 = function () {
    return data;
  };

  return data;
}

function _templateObject() {
  var data = _taggedTemplateLiteral(["Unable to upgrade database, error: ", ""]);

  _templateObject = function () {
    return data;
  };

  return data;
}

function _taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

////////////////////////////////////////////////////////////////////////////////
// Module Globals
////////////////////////////////////////////////////////////////////////////////
var DBName = 'sw';
var DBVersion = 2;
var ObjectStores = {
  prefs: {},
  // empty means use inline key
  pp: {},
  stickers: {}
};
var openDBPromise; ////////////////////////////////////////////////////////////////////////////////
// Open/Setup
////////////////////////////////////////////////////////////////////////////////

function openDB() {
  if (openDBPromise) return openDBPromise;
  return openDBPromise = new Promise(function (resolve, reject) {
    var request = (0, _nullthrows.default)(_indexed_db.default).open(DBName, DBVersion);

    request.onupgradeneeded = function (evt) {
      var db = evt.target.result;

      evt.target.transaction.onerror = function (evt) {
        LOG(4
        /* level=ERROR */
        )(_templateObject(), evt.target.error);
      };

      for (var objectStore in ObjectStores) {
        if (db.objectStoreNames.contains(objectStore)) {
          db.deleteObjectStore(objectStore);
        }

        db.createObjectStore(objectStore, ObjectStores[objectStore]);
      }
    };

    request.onsuccess = function (evt) {
      resolve(evt.target.result);
    };

    request.onerror = function (evt) {
      reject(evt.target.error);
    };
  }).catch(function (err) {
    LOG(4
    /* level=ERROR */
    )(_templateObject2(), err);
    openDBPromise = undefined;
    throw err;
  });
} ////////////////////////////////////////////////////////////////////////////////
// ObjectStore Class
////////////////////////////////////////////////////////////////////////////////

/**
 * Class containing wrapped promisified versions of IDBObjectStore methods
 */


var ObjectStore =
/*#__PURE__*/
function () {
  function ObjectStore(storeName) {
    _classCallCheck(this, ObjectStore);

    this.storeName = storeName;
    this.storeCache = {};
  }

  _createClass(ObjectStore, [{
    key: "_callAction",
    value: function _callAction(action, args) {
      var _this = this;

      return openDB().then(function (db) {
        var objectStore = db.transaction([_this.storeName], 'readwrite').objectStore(_this.storeName);
        var request = objectStore[action].apply(objectStore, args);
        return new Promise(function (resolve, reject) {
          request.onsuccess = function (evt) {
            resolve(evt.target.result);
          };

          request.onerror = function (evt) {
            reject(evt.target.error);
          };
        });
      });
    }
  }, {
    key: "get",
    value: function get(key) {
      var _this2 = this;

      if (this.storeCache[key] !== undefined) return this.storeCache[key];
      return this.storeCache[key] = this._callAction('get', [key]).catch(function (err) {
        LOG(4
        /* level=ERROR */
        )(_templateObject3(), _this2.storeName, key, err);
        _this2.storeCache[key] = undefined;
      });
    }
  }, {
    key: "put",
    value: function put(key, value) {
      var _this3 = this;

      this.storeCache[key] = Promise.resolve(value);
      return this._callAction('put', [value, key]).catch(function (err) {
        LOG(4
        /* level=ERROR */
        )(_templateObject4(), _this3.storeName, key, value, err);
      });
    }
  }, {
    key: "delete",
    value: function _delete(key) {
      var _this4 = this;

      this.storeCache[key] = Promise.resolve(undefined);
      return this._callAction('delete', [key]).catch(function (err) {
        LOG(4
        /* level=ERROR */
        )(_templateObject5(), _this4.storeName, key, err);
      });
    }
  }, {
    key: "clear",
    value: function clear() {
      var _this5 = this;

      this.storeCache = {};
      return this._callAction('clear').catch(function (err) {
        LOG(4
        /* level=ERROR */
        )(_templateObject6(), _this5.storeName, err);
      });
    }
  }]);

  return ObjectStore;
}(); ////////////////////////////////////////////////////////////////////////////////
// Exports
////////////////////////////////////////////////////////////////////////////////


var thisIsGross = {
  ObjectStore: ObjectStore
};

for (var storeName in ObjectStores) {
  thisIsGross[storeName] = new ObjectStore(storeName);
} // This is infact gross


var _default = thisIsGross;
exports.default = _default;
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(0)["log"]))

/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
// Just accessing `indexedDB` can cause a SecurityError when the user disallows
// the browser from storing information. By importing this module instead, we
// can avoid this.
var indexedDB;

try {
  // eslint-disable-next-line wa-wc/no-security-errors
  indexedDB = self.indexedDB;
} catch (err) {}

var _default = indexedDB;
exports.default = _default;

/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = nullthrows;

function nullthrows(value) {
  var name = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '?';

  if (value == null) {
    throw new Error("Unexpected null or undefined: ".concat(name));
  }

  return value;
}

/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _cached_store = _interopRequireDefault(__webpack_require__(56));

var _idb_database = _interopRequireDefault(__webpack_require__(57));

var _idb_store = _interopRequireDefault(__webpack_require__(58));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function (o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function (o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var DB_NAME = 'sw';
var DB_VERSION = 2;
var db = new _idb_database.default(DB_NAME, DB_VERSION);

var PPIdbStore =
/*#__PURE__*/
function (_IdbStore) {
  _inherits(PPIdbStore, _IdbStore);

  function PPIdbStore() {
    _classCallCheck(this, PPIdbStore);

    return _possibleConstructorReturn(this, _getPrototypeOf(PPIdbStore).apply(this, arguments));
  }

  return PPIdbStore;
}(_idb_store.default);

var PrefsIdbStore =
/*#__PURE__*/
function (_IdbStore2) {
  _inherits(PrefsIdbStore, _IdbStore2);

  function PrefsIdbStore() {
    _classCallCheck(this, PrefsIdbStore);

    return _possibleConstructorReturn(this, _getPrototypeOf(PrefsIdbStore).apply(this, arguments));
  }

  return PrefsIdbStore;
}(_idb_store.default);

var StickersIdbStore =
/*#__PURE__*/
function (_IdbStore3) {
  _inherits(StickersIdbStore, _IdbStore3);

  function StickersIdbStore() {
    _classCallCheck(this, StickersIdbStore);

    return _possibleConstructorReturn(this, _getPrototypeOf(StickersIdbStore).apply(this, arguments));
  }

  return StickersIdbStore;
}(_idb_store.default);

var PPCachedStore =
/*#__PURE__*/
function (_CachedStore) {
  _inherits(PPCachedStore, _CachedStore);

  function PPCachedStore() {
    _classCallCheck(this, PPCachedStore);

    return _possibleConstructorReturn(this, _getPrototypeOf(PPCachedStore).apply(this, arguments));
  }

  return PPCachedStore;
}(_cached_store.default);

var PrefsCachedStore =
/*#__PURE__*/
function (_CachedStore2) {
  _inherits(PrefsCachedStore, _CachedStore2);

  function PrefsCachedStore() {
    _classCallCheck(this, PrefsCachedStore);

    return _possibleConstructorReturn(this, _getPrototypeOf(PrefsCachedStore).apply(this, arguments));
  }

  return PrefsCachedStore;
}(_cached_store.default);

var StickersCachedStore =
/*#__PURE__*/
function (_CachedStore3) {
  _inherits(StickersCachedStore, _CachedStore3);

  function StickersCachedStore() {
    _classCallCheck(this, StickersCachedStore);

    return _possibleConstructorReturn(this, _getPrototypeOf(StickersCachedStore).apply(this, arguments));
  }

  return StickersCachedStore;
}(_cached_store.default);

var objectStores = {
  pp: new PPCachedStore(new PPIdbStore(db, 'pp')),
  prefs: new PrefsCachedStore(new PrefsIdbStore(db, 'prefs')),
  stickers: new StickersCachedStore(new StickersIdbStore(db, 'stickers'))
};
var _default = objectStores;
exports.default = _default;

/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _abstract_open_close = _interopRequireDefault(__webpack_require__(17));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function (o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function (o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var AbstractStore =
/*#__PURE__*/
function (_AbstractOpenClose) {
  _inherits(AbstractStore, _AbstractOpenClose);

  function AbstractStore() {
    _classCallCheck(this, AbstractStore);

    return _possibleConstructorReturn(this, _getPrototypeOf(AbstractStore).apply(this, arguments));
  }

  _createClass(AbstractStore, [{
    key: "get",
    value: function get(key) {
      var _this = this;

      return this.open().then(function () {
        return _this.doGet(key);
      });
    }
  }, {
    key: "queryByIndex",
    value: function queryByIndex(indexKey, opts) {
      var _this2 = this;

      return this.open().then(function () {
        return _this2.doQueryByIndex(indexKey, opts);
      });
    }
  }, {
    key: "getAll",
    value: function getAll() {
      var _this3 = this;

      return this.open().then(function () {
        return _this3.doGetAll();
      });
    }
  }, {
    key: "put",
    value: function put(key, value) {
      var _this4 = this;

      return this.open().then(function () {
        return _this4.doPut(key, value);
      });
    }
  }, {
    key: "del",
    value: function del(key) {
      var _this5 = this;

      return this.open().then(function () {
        return _this5.doDel(key);
      });
    }
  }, {
    key: "count",
    value: function count() {
      var _this6 = this;

      return this.open().then(function () {
        return _this6.doCount();
      });
    }
  }, {
    key: "clear",
    value: function clear() {
      var _this7 = this;

      return this.open().then(function () {
        return _this7.doClear();
      });
    }
  }, {
    key: "doGet",
    value: function doGet() {
      throw new Error('Not implemented');
    }
  }, {
    key: "doQueryByIndex",
    value: function doQueryByIndex() {
      throw new Error('Not implemented');
    }
  }, {
    key: "doGetAll",
    value: function doGetAll() {
      throw new Error('Not implemented');
    }
  }, {
    key: "doPut",
    value: function doPut() {
      throw new Error('Not implemented');
    }
  }, {
    key: "doDel",
    value: function doDel() {
      throw new Error('Not implemented');
    }
  }, {
    key: "doCount",
    value: function doCount() {
      throw new Error('Not implemented');
    }
  }, {
    key: "doClear",
    value: function doClear() {
      throw new Error('Not implemented');
    }
  }, {
    key: "doOpen",
    value: function doOpen() {
      throw new Error('Not implemented');
    }
  }, {
    key: "doClose",
    value: function doClose() {
      throw new Error('Not implemented');
    }
  }]);

  return AbstractStore;
}(_abstract_open_close.default);

exports.default = AbstractStore;

/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var AbstractOpenClose =
/*#__PURE__*/
function () {
  function AbstractOpenClose() {
    _classCallCheck(this, AbstractOpenClose);
  }

  _createClass(AbstractOpenClose, [{
    key: "open",
    value: function open() {
      var _this = this;

      if (this._openPromise) return this._openPromise;

      if (this._closePromise) {
        this._openPromise = this._closePromise.catch(function (err) {
          _this._openPromise = null;
          throw err;
        }).then(function () {
          _this._openPromise = null;
          return _this.open();
        });
        return this._openPromise;
      }

      this._openPromise = this.doOpen().catch(function (err) {
        _this._openPromise = null;
        throw err;
      }).then(function () {
        _this._openPromise = null;
      });
      return this._openPromise;
    }
  }, {
    key: "close",
    value: function close() {
      var _this2 = this;

      if (this._closePromise) return this._closePromise;

      if (this._openPromise) {
        this._closePromise = this._openPromise.catch(function (err) {
          _this2._closePromise = null;
          throw err;
        }).then(function () {
          _this2._closePromise = null;
          return _this2.close();
        });
        return this._closePromise;
      }

      this._closePromise = this.doClose().catch(function (err) {
        _this2._closePromise = null;
        throw err;
      }).then(function () {
        _this2._closePromise = null;
      });
      return this._closePromise;
    }
  }, {
    key: "doOpen",
    value: function doOpen() {
      throw new Error('Not implemented');
    }
  }, {
    key: "doClose",
    value: function doClose() {
      throw new Error('Not implemented');
    }
  }]);

  return AbstractOpenClose;
}();

exports.default = AbstractOpenClose;

/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _actions = _interopRequireDefault(__webpack_require__(1));

var _sw_feature = _interopRequireDefault(__webpack_require__(2));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function (o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function (o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var ASSET_URL = '^img/';

var AssetHandler =
/*#__PURE__*/
function (_Feature) {
  _inherits(AssetHandler, _Feature);

  function AssetHandler() {
    var _getPrototypeOf2;

    var _this;

    _classCallCheck(this, AssetHandler);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = _possibleConstructorReturn(this, (_getPrototypeOf2 = _getPrototypeOf(AssetHandler)).call.apply(_getPrototypeOf2, [this].concat(args)));

    _this.matchFetch = function (event) {
      var request = event.request;

      var url = _sw_feature.default.parseUrl(request.url);

      return request.method === _sw_feature.default.RequestType.GET && !!url && url.base === self.registration.scope && !!url.relativePath.match(ASSET_URL);
    };

    _this.onFetch = function (event) {
      var request = event.request;
      return _this.cache.matchOrFetch(request).then(function (response) {
        if (!response.ok) return _this.cache.fetchAndPut(request);
        return response;
      });
    };

    _this.matchAction = function (action) {
      return _actions.default.CLEAN_ASSETS === action;
    };

    _this.onAction = function (action, assets) {
      var assetsSet = new Set(assets);
      return _this.cache.keys().then(function (cacheNames) {
        // the cache.keys() promise catches errors and could return undefined
        if (!cacheNames) {
          return;
        }

        var toDelete = []; // Find all resources that weren't in the assets from asset loader

        cacheNames.forEach(function (request) {
          var i = request.url.lastIndexOf('/') + 1;
          var hash = request.url.slice(i);

          if (!assetsSet.has(hash)) {
            toDelete.push(request);
          }
        });
        return Promise.all(toDelete.map(function (request) {
          return _this.cache.delete(request);
        }));
      }).then(function () {});
    };

    return _this;
  }

  return AssetHandler;
}(_sw_feature.default);

exports.default = AssetHandler;

/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
// $FlowFixMe (T48256704): Suppressing as the definition is injected by webpack
var _default = {"version":"2.2029.4","hashedResources":["app.28a86c90d20ffcb7a7cc.js","app2.d2c836adf419f066406b.js","lazy_loaded_high_priority_components.bf4fb038960371c93993.js","lazy_loaded_high_priority_components~lazy_loaded_low_priority_components.3edd4e2d38437584a9a7.js","lazy_loaded_low_priority_components.354be45f1b227e529560.js","pdf.worker.b3c415adffc3ab488c3963fce37aeea8.js","progress.35e755b3b0a6337e6523.js","svg.cc09a588cef3800fdc37.js","vendor1~app.f15c171b46d6987ede5f.js","vendors~app2.162477cc6c748057c8ed.js","vendors~lazy_loaded_high_priority_components~lazy_loaded_low_priority_components.2a0e4e79a825a19f345b.js","vendors~lazy_loaded_low_priority_components.313363520547c18bdc2e.js","vendors~pdf.42c52ec195c8f0ec12f0.js","vendors~unorm.d7e92b21f3c492fc0791.js","browsers_b09d77858d14ee7b8bef.css","cssm_app.a72e70ee465e3a68aa1acd9485e9c4e1.css","cssm_qr.6ae0bc51def8fe3b39c4d0f9b3447b64.css"],"unhashedResources":["apple-touch-icon.png","bryndan_write_20e48b2ec8c64b2a1ceb5b28d9bcc9d0.ttf","crossdomain.xml","favicon-48x48.ico","favicon-64x64.ico","favicon.ico","notification_0a598282e94e87dea63e466d115e4a83.mp3","robots.txt","sequential-ptt-end_62ed28be622237546fd39f9468a76a49.mp3","sequential-ptt-middle_7fa161964e93db72b8d00ae22189d75f.mp3","whatsapp-webclient-login_a0f99e8cbba9eaa747ec23ffb30d63fe.mp4","whatsapp-webclient-login-hq_10ce945f706bbd216466cd05f672164d.mp4"],"l10n":{"locales":{"af.6681eb6f2c382c25216e.js":"locales/af.6681eb6f2c382c25216e.js","ar.cc7f7eecfa6f086bb7b8.js":"locales/ar.cc7f7eecfa6f086bb7b8.js","az.bd203e924f469e9d8232.js":"locales/az.bd203e924f469e9d8232.js","bg.c87b8a80bb5f7932619f.js":"locales/bg.c87b8a80bb5f7932619f.js","bn.90b25841e46f8fb57dfb.js":"locales/bn.90b25841e46f8fb57dfb.js","ca.8f8e5cc89c756db0a920.js":"locales/ca.8f8e5cc89c756db0a920.js","cs.4a5e2f5feb543faebb81.js":"locales/cs.4a5e2f5feb543faebb81.js","da.2d762985cce6a23b1c64.js":"locales/da.2d762985cce6a23b1c64.js","de.7a4931bf85d09067aa8e.js":"locales/de.7a4931bf85d09067aa8e.js","el.c9847109bf3db3e4f872.js":"locales/el.c9847109bf3db3e4f872.js","en.bb722ad73fe1c9a7111b.js":"locales/en.bb722ad73fe1c9a7111b.js","es.9bb7780d74317646d19d.js":"locales/es.9bb7780d74317646d19d.js","et.9dbd0bcdb2aeaeebf619.js":"locales/et.9dbd0bcdb2aeaeebf619.js","fa.dfc4e287b68e4f9707bd.js":"locales/fa.dfc4e287b68e4f9707bd.js","fi.9c2aa86054059c222138.js":"locales/fi.9c2aa86054059c222138.js","fil.7dc851c0f1ad10e3b081.js":"locales/fil.7dc851c0f1ad10e3b081.js","fr.bed4fc71e5dccd7701dc.js":"locales/fr.bed4fc71e5dccd7701dc.js","gu.d7734b70064be3a922f5.js":"locales/gu.d7734b70064be3a922f5.js","he.885c0c0ea78a64811023.js":"locales/he.885c0c0ea78a64811023.js","hi.0405f9e0d9c26211410c.js":"locales/hi.0405f9e0d9c26211410c.js","hr.661b86db520d5565d26d.js":"locales/hr.661b86db520d5565d26d.js","hu.bf5fc6d8df9976588aed.js":"locales/hu.bf5fc6d8df9976588aed.js","id.f4646653138a0fe52e0d.js":"locales/id.f4646653138a0fe52e0d.js","it.6d5bb40d92ffbe9ec486.js":"locales/it.6d5bb40d92ffbe9ec486.js","ja.67d3b1858f9b7d6986d9.js":"locales/ja.67d3b1858f9b7d6986d9.js","kk.78bbb10b02cb63eb4b13.js":"locales/kk.78bbb10b02cb63eb4b13.js","kn.1fb26711ad03040b523a.js":"locales/kn.1fb26711ad03040b523a.js","ko.defa1f1b9c9a84746391.js":"locales/ko.defa1f1b9c9a84746391.js","lt.03b7474b73f8f82a64d6.js":"locales/lt.03b7474b73f8f82a64d6.js","lv.20a3e50ee2e3ca0132fa.js":"locales/lv.20a3e50ee2e3ca0132fa.js","mk.88ec8999f654fe0470e8.js":"locales/mk.88ec8999f654fe0470e8.js","ml.eb9dfbf1bf19218c67b6.js":"locales/ml.eb9dfbf1bf19218c67b6.js","mr.9a7c1cac5c48580837e5.js":"locales/mr.9a7c1cac5c48580837e5.js","ms.d5228f3577ca5850754c.js":"locales/ms.d5228f3577ca5850754c.js","nb.13dd16cc08a4200e750b.js":"locales/nb.13dd16cc08a4200e750b.js","nl.306ac155587f6fd8eae2.js":"locales/nl.306ac155587f6fd8eae2.js","pa.eefc45fa580eabb203ca.js":"locales/pa.eefc45fa580eabb203ca.js","pl.f249fac52b097faecfec.js":"locales/pl.f249fac52b097faecfec.js","pt-BR.7c5376e70df485a73e67.js":"locales/pt-BR.7c5376e70df485a73e67.js","pt.047e56d7d6d9daa3b3ed.js":"locales/pt.047e56d7d6d9daa3b3ed.js","ro.fb6acca4fae85b006bef.js":"locales/ro.fb6acca4fae85b006bef.js","ru.caed030cabd5eacefdb2.js":"locales/ru.caed030cabd5eacefdb2.js","sk.75780bce4ab1df371240.js":"locales/sk.75780bce4ab1df371240.js","sl.2cf0df1b460132664720.js":"locales/sl.2cf0df1b460132664720.js","sq.67b29b181750ef0023e2.js":"locales/sq.67b29b181750ef0023e2.js","sr.da93e4142a591a2de925.js":"locales/sr.da93e4142a591a2de925.js","sv.55ada5dce269693cd2ee.js":"locales/sv.55ada5dce269693cd2ee.js","sw.64af2f04628972c4835c.js":"locales/sw.64af2f04628972c4835c.js","ta.6974dfe1b0c9ca3c26fc.js":"locales/ta.6974dfe1b0c9ca3c26fc.js","te.46612fb088d0a15b87e2.js":"locales/te.46612fb088d0a15b87e2.js","th.062761cc340f916bed96.js":"locales/th.062761cc340f916bed96.js","tr.359102d9fe08141551e4.js":"locales/tr.359102d9fe08141551e4.js","uk.a58ac80afeb4d50484ac.js":"locales/uk.a58ac80afeb4d50484ac.js","ur.7c87c10976a3dfd681e8.js":"locales/ur.7c87c10976a3dfd681e8.js","uz.861a33eb0d78d82a6756.js":"locales/uz.861a33eb0d78d82a6756.js","vi.9abf5d0e6650bb79b6db.js":"locales/vi.9abf5d0e6650bb79b6db.js","zh-CN.ef16e8932d25bcfb92f9.js":"locales/zh-CN.ef16e8932d25bcfb92f9.js","zh-TW.3fdccde348474d78f062.js":"locales/zh-TW.3fdccde348474d78f062.js"},"styles":{}},"releaseDate":1594656903485};
exports.default = _default;

/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(LOG) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _utils = _interopRequireDefault(__webpack_require__(7));

var _object_stores = _interopRequireDefault(__webpack_require__(12));

var _object_stores2 = _interopRequireDefault(__webpack_require__(15));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _templateObject11() {
  var data = _taggedTemplateLiteral(["Could not find previous cache, current cache:", ", error: ", ""]);

  _templateObject11 = function () {
    return data;
  };

  return data;
}

function _templateObject10() {
  var data = _taggedTemplateLiteral(["Unable to match request: ", ", in cache: ", ", error: ", ""]);

  _templateObject10 = function () {
    return data;
  };

  return data;
}

function _templateObject9() {
  var data = _taggedTemplateLiteral(["Unable to delete request: ", ", in cache: ", ", error: ", ""]);

  _templateObject9 = function () {
    return data;
  };

  return data;
}

function _templateObject8() {
  var data = _taggedTemplateLiteral(["Unable to put in cache: ", ", request: ", ", response status: ", ", err: ", ""]);

  _templateObject8 = function () {
    return data;
  };

  return data;
}

function _templateObject7() {
  var data = _taggedTemplateLiteral(["Unable to match request: ", ", in cache: ", ", error: ", ""]);

  _templateObject7 = function () {
    return data;
  };

  return data;
}

function _templateObject6() {
  var data = _taggedTemplateLiteral(["Unable to fetch request: ", ", error: ", ""]);

  _templateObject6 = function () {
    return data;
  };

  return data;
}

function _templateObject5() {
  var data = _taggedTemplateLiteral(["Received invalid response, url: ", ", status: ", ", type: ", ""]);

  _templateObject5 = function () {
    return data;
  };

  return data;
}

function _templateObject4() {
  var data = _taggedTemplateLiteral(["Unable to delete cache: ", ", current cache: ", ", error: ", ""]);

  _templateObject4 = function () {
    return data;
  };

  return data;
}

function _templateObject3() {
  var data = _taggedTemplateLiteral(["Unable to match prev. cache, cache name: ", ", request: ", ", error: ", ""]);

  _templateObject3 = function () {
    return data;
  };

  return data;
}

function _templateObject2() {
  var data = _taggedTemplateLiteral(["Error occured while updating cache:", ", error: ", ""]);

  _templateObject2 = function () {
    return data;
  };

  return data;
}

function _templateObject() {
  var data = _taggedTemplateLiteral(["Updating cache: ", ""]);

  _templateObject = function () {
    return data;
  };

  return data;
}

function _taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

// eslint-disable-next-line
var objectStores = _object_stores.default; // eslint-disable-next-line

////////////////////////////////////////////////////////////////////////////////
// Module Globals
////////////////////////////////////////////////////////////////////////////////
var PrefStore = objectStores.prefs;
var CachedCacheNames = self.caches.keys();
var CACHE_NAME_MATCH = /wa\d+\.\d+\.\d+(\.[id])?(\.canary)?$/;
var PERMANENT_CACHES = ['wa-pp', 'wa-assets', 'wa-stickers']; ////////////////////////////////////////////////////////////////////////////////
// CacheHelper Class
////////////////////////////////////////////////////////////////////////////////

/**
 * Wrapper class for the Cache API. This adds any helper and update methods and
 * also wraps Cache API methods to remove an unnecessary then
 * (i.e. cache.match(...) instead of cache.then(c => c.match(...)))
 */

function CacheHelper(cacheName) {
  this.cacheName = cacheName;
  this.openCachePromise = self.caches.open(this.cacheName);
}

CacheHelper.prototype = {
  /**
   * Add all provided resources into the sw's cache. We'll only update the
   * cache if we're replacing another service worker
   * (i.e. another cache exists)
   *
   * @param  {string[]} hashedResources Resources that should be copied from
   * an existing cache if available
   * @param  {string[]} unhashedResources Resources that should always be
   * fetched
   * @return {Promise}
   */
  update(hashedResources, unhashedResources) {
    var _this = this;

    return getPrevCache(this.cacheName).then(function (prevCache) {
      if (!prevCache) return;
      LOG(2
      /* level=LOG */
      )(_templateObject(), _this.cacheName);
      return PrefStore.get('l10n').then(function (l10nData) {
        return Promise.all(_this.prefetchHashedResources(hashedResources, prevCache).concat(_this.prefetchUnhashedResources(unhashedResources, l10nData)));
      });
    }).catch(function (err) {
      LOG(4
      /* level=ERROR */
      )(_templateObject2(), _this.cacheName, err);
    });
  },

  /**
   * Store the provided hashed resources in the cache. If the resource exists
   * in `prevCache` then the method will copy over the resource from there
   * instead of sending a network request.
   *
   * @param  {string[]} resources
   * @param  {CacheHelper} prevCache
   * @return {Promise[]}
   */
  prefetchHashedResources(resources, prevCache) {
    var _this2 = this;

    return resources.map(function (relativePath) {
      var url = self.registration.scope + relativePath; // Search prev. cache before fetching

      return prevCache.match(url).catch(function (err) {
        LOG(4
        /* level=ERROR */
        )(_templateObject3(), prevCache.cacheName, url, err);
      }).then(function (response) {
        return response ? _this2.put(url, response) : _this2.fetchAndPut(url);
      });
    });
  },

  /**
   * Store the provided unhashed resources in the cache. This method always
   * sends a network request for each resource instead of searching a
   * previous cache first
   *
   * The method also caches the index for the locale locale in `l10nData`,
   * (if the index is in `resources`)
   *
   * @param  {string[]} resources
   * @param  {object} [l10nData]
   * @return {Promise[]}
   */
  prefetchUnhashedResources(resources, l10nData) {
    var _this3 = this;

    return resources.map(function (relativePath) {
      return relativePath === '' ? _this3.fetchAndPut(self.registration.scope + _utils.default.getIndexPath(l10nData), self.registration.scope, {
        cache: 'reload'
      } // always fetch index page from server
      ) : _this3.fetchAndPut(self.registration.scope + relativePath);
    });
  },

  /**
   * Removes all caches except for this one and the profile pic and sticker caches
   * @return {Promise}
   */
  cleanup() {
    var _this4 = this;

    return CachedCacheNames.then(function (cacheNames) {
      return Promise.all(cacheNames.map(function (cacheName) {
        if (cacheName !== _this4.cacheName && !PERMANENT_CACHES.includes(cacheName)) {
          return self.caches.delete(cacheName).catch(function (err) {
            LOG(4
            /* level=ERROR */
            )(_templateObject4(), cacheName, _this4.cacheName, err);
          });
        }
      }));
    });
  },

  /**
   * Attempt to retrieve a response to the passed in request from the cache
   * If there is a cache miss, the method will call `fetchAndStore` with
   * the request.
   *
   * Cache::match will be called with the `url` param. This is done because
   * Chrome does not fully support search options for the Cache API
   * (see http://crbug.com/499216), so we have to strip out the
   * query params from the url and also not attempt to match with the stored
   * response's vary headers.
   *
   * XXX: Remove `url` param and just use `request` with
   * Cache::match with `ignoreVary` and `ignoreSearch` options when the
   * majority of users are on a version of chrome that supports those
   * search options
   *
   * @param  {(Request|string)} request Request object or string url
   * @param  {string} [url] If `url` does not exist, `request.url` will be
   * used
   * @param  {object} options options to pass to fetch
   * @return {Promise<Response>}
   */
  matchOrFetch(request, url_, options) {
    var _this5 = this;

    var url = url_ || requestToUrl(request);
    return this.match(url).then(function (response) {
      return response || _this5.fetchAndPut(request, url, options);
    });
  },

  /**
   * Fetch the request and put it in the cache. This method will track
   * redirects and won't store responses that were redirected. The method
   * will use the `url` param for storing the response for the same reason as
   * the `matchOrFetch` method above.
   *
   * @param  {(Request|string)} request Request object or string url
   * @param  {string} [url] If `url` does not exist, `request.url` will be used
   * @param  {object} request options to pass to fetch
   * @return {Promise<Response>} If the request ended up redirecting, a
   * response of type 'opaqueredriect' will be returned in the promise.
   */
  fetchAndPut(request, url, options) {
    var _this6 = this;

    // Manually clone `request` and set redirect mode to 'manual' so we can
    // follow and determine if the request was redirected.
    var manualRedirectRequest = _utils.default.manuallyCloneRequest(request, undefined, {
      redirect: 'manual',
      mode: 'cors'
    });

    return self.fetch(manualRedirectRequest, options).then(function (response) {
      if (response.ok) {
        var cacheKey = url || requestToUrl(request);

        _this6.put(cacheKey, response.clone());
      } else if (response.type !== 'opaqueredirect') {
        LOG(4
        /* level=ERROR */
        )(_templateObject5(), response.url, response.status, response.type);
      }

      return response;
    }).catch(function (err) {
      LOG(4
      /* level=ERROR */
      )(_templateObject6(), requestToUrl(request), err);
      throw err;
    });
  },

  /**
   * Delete this cache and re-open it, effectively clearing the cache
   * @return {Promise<Cache>} Note: Promise resolve to Cache instance,
   * not CacheHelper instance
   */
  reset() {
    var _this7 = this;

    return this.openCachePromise = self.caches.delete(this.cacheName).then(function () {
      return self.caches.open(_this7.cacheName);
    });
  },

  /*
   * Cache API Wrapper methods. These methods catch and log errors and remove
   * the need for an extra `.then`
   */
  match(request, options) {
    var _this8 = this;

    return this.openCachePromise.then(function (cache) {
      return cache.match(request, options);
    }).catch(function (err) {
      LOG(4
      /* level=ERROR */
      )(_templateObject7(), requestToUrl(request), _this8.cacheName, err);
    });
  },

  put(request, response) {
    var _this9 = this;

    return this.openCachePromise.then(function (cache) {
      return cache.put(request, response);
    }).catch(function (err) {
      LOG(4
      /* level=ERROR */
      )(_templateObject8(), _this9.cacheName, requestToUrl(request), response.status, err);
    });
  },

  delete(request, options) {
    var _this10 = this;

    return this.openCachePromise.then(function (cache) {
      return cache.delete(request, options);
    }).catch(function (err) {
      LOG(4
      /* level=ERROR */
      )(_templateObject9(), requestToUrl(request), _this10.cacheName, err);
    });
  },

  keys(request, options) {
    var _this11 = this;

    return this.openCachePromise.then(function (cache) {
      return cache.keys(request, options);
    }).catch(function (err) {
      LOG(4
      /* level=ERROR */
      )(_templateObject10(), requestToUrl(request), _this11.cacheName, err);
    });
  }

}; ////////////////////////////////////////////////////////////////////////////////
// Private API
////////////////////////////////////////////////////////////////////////////////

/**
 * Attempt to find prev. serviceworker's cache
 * @param  {string} currentCacheName
 * @return {CacheHelper}
 */

function getPrevCache(currentCacheName) {
  var _this12 = this;

  return CachedCacheNames.then(function (cacheNames) {
    var prevCacheName = cacheNames.find(function (cacheName) {
      return cacheName !== currentCacheName && CACHE_NAME_MATCH.test(cacheName);
    });
    if (prevCacheName) return new CacheHelper(prevCacheName);
  }).catch(function (err) {
    LOG(4
    /* level=ERROR */
    )(_templateObject11(), // $FlowFixMe (T48256742)
    _this12.cacheName, err);
  });
}

var _default = CacheHelper;
exports.default = _default;

function requestToUrl(request) {
  return request instanceof Request ? request.url : request;
}
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(0)["log"]))

/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

var MapCache = __webpack_require__(22);

/** Error message constants. */
var FUNC_ERROR_TEXT = 'Expected a function';

/**
 * Creates a function that memoizes the result of `func`. If `resolver` is
 * provided, it determines the cache key for storing the result based on the
 * arguments provided to the memoized function. By default, the first argument
 * provided to the memoized function is used as the map cache key. The `func`
 * is invoked with the `this` binding of the memoized function.
 *
 * **Note:** The cache is exposed as the `cache` property on the memoized
 * function. Its creation may be customized by replacing the `_.memoize.Cache`
 * constructor with one whose instances implement the
 * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
 * method interface of `clear`, `delete`, `get`, `has`, and `set`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to have its output memoized.
 * @param {Function} [resolver] The function to resolve the cache key.
 * @returns {Function} Returns the new memoized function.
 * @example
 *
 * var object = { 'a': 1, 'b': 2 };
 * var other = { 'c': 3, 'd': 4 };
 *
 * var values = _.memoize(_.values);
 * values(object);
 * // => [1, 2]
 *
 * values(other);
 * // => [3, 4]
 *
 * object.a = 2;
 * values(object);
 * // => [1, 2]
 *
 * // Modify the result cache.
 * values.cache.set(object, ['a', 'b']);
 * values(object);
 * // => ['a', 'b']
 *
 * // Replace `_.memoize.Cache`.
 * _.memoize.Cache = WeakMap;
 */
function memoize(func, resolver) {
  if (typeof func != 'function' || (resolver != null && typeof resolver != 'function')) {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  var memoized = function() {
    var args = arguments,
        key = resolver ? resolver.apply(this, args) : args[0],
        cache = memoized.cache;

    if (cache.has(key)) {
      return cache.get(key);
    }
    var result = func.apply(this, args);
    memoized.cache = cache.set(key, result) || cache;
    return result;
  };
  memoized.cache = new (memoize.Cache || MapCache);
  return memoized;
}

// Expose `MapCache`.
memoize.Cache = MapCache;

module.exports = memoize;


/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

var mapCacheClear = __webpack_require__(23),
    mapCacheDelete = __webpack_require__(49),
    mapCacheGet = __webpack_require__(51),
    mapCacheHas = __webpack_require__(52),
    mapCacheSet = __webpack_require__(53);

/**
 * Creates a map cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function MapCache(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `MapCache`.
MapCache.prototype.clear = mapCacheClear;
MapCache.prototype['delete'] = mapCacheDelete;
MapCache.prototype.get = mapCacheGet;
MapCache.prototype.has = mapCacheHas;
MapCache.prototype.set = mapCacheSet;

module.exports = MapCache;


/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

var Hash = __webpack_require__(24),
    ListCache = __webpack_require__(41),
    Map = __webpack_require__(48);

/**
 * Removes all key-value entries from the map.
 *
 * @private
 * @name clear
 * @memberOf MapCache
 */
function mapCacheClear() {
  this.size = 0;
  this.__data__ = {
    'hash': new Hash,
    'map': new (Map || ListCache),
    'string': new Hash
  };
}

module.exports = mapCacheClear;


/***/ }),
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

var hashClear = __webpack_require__(25),
    hashDelete = __webpack_require__(37),
    hashGet = __webpack_require__(38),
    hashHas = __webpack_require__(39),
    hashSet = __webpack_require__(40);

/**
 * Creates a hash object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Hash(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `Hash`.
Hash.prototype.clear = hashClear;
Hash.prototype['delete'] = hashDelete;
Hash.prototype.get = hashGet;
Hash.prototype.has = hashHas;
Hash.prototype.set = hashSet;

module.exports = Hash;


/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

var nativeCreate = __webpack_require__(4);

/**
 * Removes all key-value entries from the hash.
 *
 * @private
 * @name clear
 * @memberOf Hash
 */
function hashClear() {
  this.__data__ = nativeCreate ? nativeCreate(null) : {};
  this.size = 0;
}

module.exports = hashClear;


/***/ }),
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

var isFunction = __webpack_require__(27),
    isMasked = __webpack_require__(33),
    isObject = __webpack_require__(11),
    toSource = __webpack_require__(35);

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

/** Used to detect host constructors (Safari). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used for built-in method references. */
var funcProto = Function.prototype,
    objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/**
 * The base implementation of `_.isNative` without bad shim checks.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 */
function baseIsNative(value) {
  if (!isObject(value) || isMasked(value)) {
    return false;
  }
  var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource(value));
}

module.exports = baseIsNative;


/***/ }),
/* 27 */
/***/ (function(module, exports, __webpack_require__) {

var baseGetTag = __webpack_require__(28),
    isObject = __webpack_require__(11);

/** `Object#toString` result references. */
var asyncTag = '[object AsyncFunction]',
    funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]',
    proxyTag = '[object Proxy]';

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  if (!isObject(value)) {
    return false;
  }
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 9 which returns 'object' for typed arrays and other constructors.
  var tag = baseGetTag(value);
  return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
}

module.exports = isFunction;


/***/ }),
/* 28 */
/***/ (function(module, exports, __webpack_require__) {

var Symbol = __webpack_require__(10),
    getRawTag = __webpack_require__(31),
    objectToString = __webpack_require__(32);

/** `Object#toString` result references. */
var nullTag = '[object Null]',
    undefinedTag = '[object Undefined]';

/** Built-in value references. */
var symToStringTag = Symbol ? Symbol.toStringTag : undefined;

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag;
  }
  return (symToStringTag && symToStringTag in Object(value))
    ? getRawTag(value)
    : objectToString(value);
}

module.exports = baseGetTag;


/***/ }),
/* 29 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global) {/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

module.exports = freeGlobal;

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(30)))

/***/ }),
/* 30 */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || new Function("return this")();
} catch (e) {
	// This works if the window reference is available
	if (typeof window === "object") g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),
/* 31 */
/***/ (function(module, exports, __webpack_require__) {

var Symbol = __webpack_require__(10);

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/** Built-in value references. */
var symToStringTag = Symbol ? Symbol.toStringTag : undefined;

/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag(value) {
  var isOwn = hasOwnProperty.call(value, symToStringTag),
      tag = value[symToStringTag];

  try {
    value[symToStringTag] = undefined;
    var unmasked = true;
  } catch (e) {}

  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }
  return result;
}

module.exports = getRawTag;


/***/ }),
/* 32 */
/***/ (function(module, exports) {

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString(value) {
  return nativeObjectToString.call(value);
}

module.exports = objectToString;


/***/ }),
/* 33 */
/***/ (function(module, exports, __webpack_require__) {

var coreJsData = __webpack_require__(34);

/** Used to detect methods masquerading as native. */
var maskSrcKey = (function() {
  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
  return uid ? ('Symbol(src)_1.' + uid) : '';
}());

/**
 * Checks if `func` has its source masked.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
 */
function isMasked(func) {
  return !!maskSrcKey && (maskSrcKey in func);
}

module.exports = isMasked;


/***/ }),
/* 34 */
/***/ (function(module, exports, __webpack_require__) {

var root = __webpack_require__(8);

/** Used to detect overreaching core-js shims. */
var coreJsData = root['__core-js_shared__'];

module.exports = coreJsData;


/***/ }),
/* 35 */
/***/ (function(module, exports) {

/** Used for built-in method references. */
var funcProto = Function.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to convert.
 * @returns {string} Returns the source code.
 */
function toSource(func) {
  if (func != null) {
    try {
      return funcToString.call(func);
    } catch (e) {}
    try {
      return (func + '');
    } catch (e) {}
  }
  return '';
}

module.exports = toSource;


/***/ }),
/* 36 */
/***/ (function(module, exports) {

/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function getValue(object, key) {
  return object == null ? undefined : object[key];
}

module.exports = getValue;


/***/ }),
/* 37 */
/***/ (function(module, exports) {

/**
 * Removes `key` and its value from the hash.
 *
 * @private
 * @name delete
 * @memberOf Hash
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function hashDelete(key) {
  var result = this.has(key) && delete this.__data__[key];
  this.size -= result ? 1 : 0;
  return result;
}

module.exports = hashDelete;


/***/ }),
/* 38 */
/***/ (function(module, exports, __webpack_require__) {

var nativeCreate = __webpack_require__(4);

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Gets the hash value for `key`.
 *
 * @private
 * @name get
 * @memberOf Hash
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function hashGet(key) {
  var data = this.__data__;
  if (nativeCreate) {
    var result = data[key];
    return result === HASH_UNDEFINED ? undefined : result;
  }
  return hasOwnProperty.call(data, key) ? data[key] : undefined;
}

module.exports = hashGet;


/***/ }),
/* 39 */
/***/ (function(module, exports, __webpack_require__) {

var nativeCreate = __webpack_require__(4);

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Checks if a hash value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Hash
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function hashHas(key) {
  var data = this.__data__;
  return nativeCreate ? (data[key] !== undefined) : hasOwnProperty.call(data, key);
}

module.exports = hashHas;


/***/ }),
/* 40 */
/***/ (function(module, exports, __webpack_require__) {

var nativeCreate = __webpack_require__(4);

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/**
 * Sets the hash `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Hash
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the hash instance.
 */
function hashSet(key, value) {
  var data = this.__data__;
  this.size += this.has(key) ? 0 : 1;
  data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED : value;
  return this;
}

module.exports = hashSet;


/***/ }),
/* 41 */
/***/ (function(module, exports, __webpack_require__) {

var listCacheClear = __webpack_require__(42),
    listCacheDelete = __webpack_require__(43),
    listCacheGet = __webpack_require__(45),
    listCacheHas = __webpack_require__(46),
    listCacheSet = __webpack_require__(47);

/**
 * Creates an list cache object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function ListCache(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `ListCache`.
ListCache.prototype.clear = listCacheClear;
ListCache.prototype['delete'] = listCacheDelete;
ListCache.prototype.get = listCacheGet;
ListCache.prototype.has = listCacheHas;
ListCache.prototype.set = listCacheSet;

module.exports = ListCache;


/***/ }),
/* 42 */
/***/ (function(module, exports) {

/**
 * Removes all key-value entries from the list cache.
 *
 * @private
 * @name clear
 * @memberOf ListCache
 */
function listCacheClear() {
  this.__data__ = [];
  this.size = 0;
}

module.exports = listCacheClear;


/***/ }),
/* 43 */
/***/ (function(module, exports, __webpack_require__) {

var assocIndexOf = __webpack_require__(5);

/** Used for built-in method references. */
var arrayProto = Array.prototype;

/** Built-in value references. */
var splice = arrayProto.splice;

/**
 * Removes `key` and its value from the list cache.
 *
 * @private
 * @name delete
 * @memberOf ListCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function listCacheDelete(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }
  --this.size;
  return true;
}

module.exports = listCacheDelete;


/***/ }),
/* 44 */
/***/ (function(module, exports) {

/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq(value, other) {
  return value === other || (value !== value && other !== other);
}

module.exports = eq;


/***/ }),
/* 45 */
/***/ (function(module, exports, __webpack_require__) {

var assocIndexOf = __webpack_require__(5);

/**
 * Gets the list cache value for `key`.
 *
 * @private
 * @name get
 * @memberOf ListCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function listCacheGet(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  return index < 0 ? undefined : data[index][1];
}

module.exports = listCacheGet;


/***/ }),
/* 46 */
/***/ (function(module, exports, __webpack_require__) {

var assocIndexOf = __webpack_require__(5);

/**
 * Checks if a list cache value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf ListCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function listCacheHas(key) {
  return assocIndexOf(this.__data__, key) > -1;
}

module.exports = listCacheHas;


/***/ }),
/* 47 */
/***/ (function(module, exports, __webpack_require__) {

var assocIndexOf = __webpack_require__(5);

/**
 * Sets the list cache `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf ListCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the list cache instance.
 */
function listCacheSet(key, value) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    ++this.size;
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}

module.exports = listCacheSet;


/***/ }),
/* 48 */
/***/ (function(module, exports, __webpack_require__) {

var getNative = __webpack_require__(9),
    root = __webpack_require__(8);

/* Built-in method references that are verified to be native. */
var Map = getNative(root, 'Map');

module.exports = Map;


/***/ }),
/* 49 */
/***/ (function(module, exports, __webpack_require__) {

var getMapData = __webpack_require__(6);

/**
 * Removes `key` and its value from the map.
 *
 * @private
 * @name delete
 * @memberOf MapCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function mapCacheDelete(key) {
  var result = getMapData(this, key)['delete'](key);
  this.size -= result ? 1 : 0;
  return result;
}

module.exports = mapCacheDelete;


/***/ }),
/* 50 */
/***/ (function(module, exports) {

/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */
function isKeyable(value) {
  var type = typeof value;
  return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
    ? (value !== '__proto__')
    : (value === null);
}

module.exports = isKeyable;


/***/ }),
/* 51 */
/***/ (function(module, exports, __webpack_require__) {

var getMapData = __webpack_require__(6);

/**
 * Gets the map value for `key`.
 *
 * @private
 * @name get
 * @memberOf MapCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function mapCacheGet(key) {
  return getMapData(this, key).get(key);
}

module.exports = mapCacheGet;


/***/ }),
/* 52 */
/***/ (function(module, exports, __webpack_require__) {

var getMapData = __webpack_require__(6);

/**
 * Checks if a map value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf MapCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function mapCacheHas(key) {
  return getMapData(this, key).has(key);
}

module.exports = mapCacheHas;


/***/ }),
/* 53 */
/***/ (function(module, exports, __webpack_require__) {

var getMapData = __webpack_require__(6);

/**
 * Sets the map `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf MapCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the map cache instance.
 */
function mapCacheSet(key, value) {
  var data = getMapData(this, key),
      size = data.size;

  data.set(key, value);
  this.size += data.size == size ? 0 : 1;
  return this;
}

module.exports = mapCacheSet;


/***/ }),
/* 54 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = formatLogMessage;

var _interleave = _interopRequireDefault(__webpack_require__(55));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//
// IMPORTANT: This module is imported by size-sensitive parts of the application
// (e.g. the service worker) so it shouldn't get too large.
//
var MAX_LOG_CHARS = 250;

function formatLogMessage(strings, substitutions, truncate) {
  // Create the message string.
  var message = (0, _interleave.default)(strings, // TODO (T63805237): Implement custom serialization for substitutions.
  substitutions.map(String)).join('');
  var maxLength = truncate ? MAX_LOG_CHARS : Number.POSITIVE_INFINITY;

  if (message.length > maxLength) {
    message = message.slice(0, maxLength).replace(/\s+$/, ' [truncated]');
  }

  return message;
}

/***/ }),
/* 55 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = interleave;

function interleave(a, b) {
  var combined = [];
  var aLength = a.length;
  var bLength = b.length;
  var maxLength = Math.max(aLength, bLength);

  for (var i = 0; i < maxLength; i++) {
    if (i < aLength) combined.push(a[i]);
    if (i < bLength) combined.push(b[i]);
  }

  return combined;
}

/***/ }),
/* 56 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _abstract_store = _interopRequireDefault(__webpack_require__(16));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function (o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function (o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var CachedStore =
/*#__PURE__*/
function (_AbstractStore) {
  _inherits(CachedStore, _AbstractStore);

  function CachedStore(store) {
    var _this;

    _classCallCheck(this, CachedStore);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(CachedStore).call(this));
    _this._store = store;
    _this._cache = {};
    return _this;
  }

  _createClass(CachedStore, [{
    key: "doGet",
    value: function doGet(key) {
      var _this2 = this;

      if (key in this._cache) {
        return Promise.resolve(this._cache[key]);
      }

      return this._store.get(key).then(function (result) {
        if (result != null) {
          _this2._cache[key] = result;
        }

        return result;
      });
    }
  }, {
    key: "doPut",
    value: function doPut(key, value) {
      var _this3 = this;

      this._cache[key] = value;

      this._store.put(key, value).catch(function (err) {
        delete _this3._cache[key];
        throw err;
      });

      return Promise.resolve(value);
    }
  }, {
    key: "doDel",
    value: function doDel(key) {
      delete this._cache[key];
      return this._store.del(key);
    }
  }, {
    key: "doClear",
    value: function doClear() {
      this._cache = {};
      return this._store.clear();
    }
  }, {
    key: "doOpen",
    value: function doOpen() {
      return this._store.open();
    }
  }, {
    key: "doClose",
    value: function doClose() {
      return this._store.close();
    }
  }]);

  return CachedStore;
}(_abstract_store.default);

exports.default = CachedStore;

/***/ }),
/* 57 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(LOG) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _abstract_open_close = _interopRequireDefault(__webpack_require__(17));

var _indexed_db = _interopRequireDefault(__webpack_require__(13));

var _nullthrows = _interopRequireDefault(__webpack_require__(14));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _templateObject3() {
  var data = _taggedTemplateLiteral(["Unable to upgrade database, error: ", ""]);

  _templateObject3 = function () {
    return data;
  };

  return data;
}

function _templateObject2() {
  var data = _taggedTemplateLiteral(["The databse ", " has unexpectedly closed, ", ""]);

  _templateObject2 = function () {
    return data;
  };

  return data;
}

function _templateObject() {
  var data = _taggedTemplateLiteral(["Unable to open database, error: "]);

  _templateObject = function () {
    return data;
  };

  return data;
}

function _taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function (o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function (o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var IdbDatabase =
/*#__PURE__*/
function (_AbstractOpenClose) {
  _inherits(IdbDatabase, _AbstractOpenClose);

  function IdbDatabase(name, version) {
    var _this;

    _classCallCheck(this, IdbDatabase);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(IdbDatabase).call(this));
    _this.name = name;
    _this.version = version;
    _this._stores = {};
    return _this;
  }
  /**
   * public methods
   */


  _createClass(IdbDatabase, [{
    key: "close",
    value: function close() {
      var _this2 = this;

      return new Promise(function (resolve) {
        // check if db is open
        if (!_this2._db) return resolve(); // db is open, close it.

        _this2._db.close();

        _this2._db = null;
        resolve();
      });
    }
  }, {
    key: "open",
    value: function open() {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        // check if db is open
        if (_this3._db) return resolve(); // db is closed, open it.

        var openRequest = (0, _nullthrows.default)(_indexed_db.default).open(_this3.name, _this3.version);

        openRequest.onerror = function (evt) {
          LOG(4
          /* level=ERROR */
          )(_templateObject());
          reject(evt.target.error);
        };

        openRequest.onsuccess = function (evt) {
          // result is an IDBDatabase not IDBObjectStore
          var db = evt.target.result;
          _this3._db = db;

          db.onclose = function (evt) {
            _this3._db = null;
            LOG(4
            /* level=ERROR */
            )(_templateObject2(), _this3.name, evt.target);
          };

          resolve();
        };

        openRequest.onupgradeneeded = function (evt) {
          // result is an IDBDatabase not IDBObjectStore
          var db = evt.target.result;

          evt.target.transaction.onerror = function (evt) {
            LOG(4
            /* level=ERROR */
            )(_templateObject3(), evt.target.error);
          };

          if (_this3._stores) {
            var _loop = function (objectStoreName) {
              // The Flow typing is wrong thus it needs casting.
              var objectStoreNames = db.objectStoreNames; // delete old stores

              if (objectStoreNames.contains(objectStoreName)) {
                db.deleteObjectStore(objectStoreName);
              } // create new stores


              var store = db.createObjectStore(objectStoreName, _this3._stores[objectStoreName].opts); // create indexes

              var indexes = _this3._stores[objectStoreName].indexes;
              indexes.forEach(function (index) {
                store.createIndex(index.indexName, index.keyPath, index.objParam);
              });
            };

            for (var objectStoreName in _this3._stores) {
              _loop(objectStoreName);
            }
          }
        };
      });
    }
  }, {
    key: "addStoreInfo",
    value: function addStoreInfo(storeName, storeInfo) {
      if (this._openPromise) {
        throw new Error('Cannot addStoreInfo after database is already open');
      }

      this._stores[storeName] = storeInfo;
    }
  }, {
    key: "store",
    value: function store(name, mode) {
      if (!this._db) throw new Error('db is not open');
      if (!(name in this._stores)) throw new Error("unknown store name: '".concat(name, "'"));
      return this._db.transaction([name], mode).objectStore(name);
    }
  }]);

  return IdbDatabase;
}(_abstract_open_close.default);

exports.default = IdbDatabase;
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(0)["log"]))

/***/ }),
/* 58 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(LOG) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _abstract_store = _interopRequireDefault(__webpack_require__(16));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _templateObject8() {
  var data = _taggedTemplateLiteral(["Unable to clear store ", ""]);

  _templateObject8 = function () {
    return data;
  };

  return data;
}

function _templateObject7() {
  var data = _taggedTemplateLiteral(["Unable to count in store ", ""]);

  _templateObject7 = function () {
    return data;
  };

  return data;
}

function _templateObject6() {
  var data = _taggedTemplateLiteral(["Unable to delete with key: ", " in store ", ""]);

  _templateObject6 = function () {
    return data;
  };

  return data;
}

function _templateObject5() {
  var data = _taggedTemplateLiteral(["Unable to put with key: ", ", and value: ", ""]);

  _templateObject5 = function () {
    return data;
  };

  return data;
}

function _templateObject4() {
  var data = _taggedTemplateLiteral(["Unable to getAll in store ", ""]);

  _templateObject4 = function () {
    return data;
  };

  return data;
}

function _templateObject3() {
  var data = _taggedTemplateLiteral(["Error occurs when querying by index: ", " in store ", ""]);

  _templateObject3 = function () {
    return data;
  };

  return data;
}

function _templateObject2() {
  var data = _taggedTemplateLiteral(["Unable to get index: ", " in store ", ""]);

  _templateObject2 = function () {
    return data;
  };

  return data;
}

function _templateObject() {
  var data = _taggedTemplateLiteral(["Unable to get with key: ", " in store ", ""]);

  _templateObject = function () {
    return data;
  };

  return data;
}

function _taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function (o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function (o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var IdbStore =
/*#__PURE__*/
function (_AbstractStore) {
  _inherits(IdbStore, _AbstractStore);

  function IdbStore(db, name, opts) {
    var _this;

    _classCallCheck(this, IdbStore);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(IdbStore).call(this));
    _this._db = db;
    _this._opts = opts;
    _this.name = name;

    _this._addStoreInfo(name, opts);

    return _this;
  }

  _createClass(IdbStore, [{
    key: "doGet",
    value: function doGet(key) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        var objectStore = _this2._db.store(_this2.name, 'readonly');

        var request = objectStore.get(key);

        request.onsuccess = function (evt) {
          resolve(evt.target.result);
        };

        request.onerror = function (evt) {
          LOG(4
          /* level=ERROR */
          )(_templateObject(), key, _this2.name);
          reject(evt.target.error);
        };
      });
    }
  }, {
    key: "doQueryByIndex",
    value: function doQueryByIndex(indexName, opts) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        var results = [];

        if (opts.limit <= 0) {
          resolve(results);
          return;
        }

        var objectStore = _this3._db.store(_this3.name, 'readonly');

        var index;

        try {
          index = objectStore.index(indexName);
        } catch (err) {
          LOG(4
          /* level=ERROR */
          )(_templateObject2(), indexName, _this3.name);
          throw err;
        }

        var request = index.openCursor();

        request.onerror = function (evt) {
          LOG(4
          /* level=ERROR */
          )(_templateObject3(), indexName, _this3.name);
          reject(evt.target.error);
        };

        request.onsuccess = function (evt) {
          var cursor = evt.target.result;

          if (!cursor) {
            resolve(results);
            return;
          }

          results.push(cursor.value);

          if (results.length === opts.limit) {
            resolve(results);
            return;
          }

          cursor.continue();
        };
      });
    }
  }, {
    key: "doGetAll",
    value: function doGetAll() {
      var _this4 = this;

      return new Promise(function (resolve, reject) {
        var objectStore = _this4._db.store(_this4.name, 'readonly'); // $FlowFixMe (T48256758) - Not defined in Flow but exists in https://w3c.github.io/IndexedDB/#object-store-interface


        var request = objectStore.getAll();

        request.onsuccess = function (evt) {
          resolve(evt.target.result);
        };

        request.onerror = function (evt) {
          LOG(4
          /* level=ERROR */
          )(_templateObject4(), _this4.name);
          reject(evt.target.error);
        };
      });
    }
  }, {
    key: "doPut",
    value: function doPut(key, value) {
      var _this5 = this;

      // $FlowFixMe (T48256716) - indexer property is missing in T
      if (this._opts && value[this._opts.primaryIndexKey] !== key) {
        // note: this is an error for developers
        return Promise.reject(new Error('The key specified in the put request does not match the keyPath defined in IndexedDB.'));
      }

      return new Promise(function (resolve, reject) {
        var objectStore = _this5._db.store(_this5.name, 'readwrite');

        var args = _this5._opts && _this5._opts.primaryIndexKey != null ? [value] : [value, key];
        var request = objectStore.put.apply(objectStore, args);

        request.onsuccess = function (evt) {
          resolve(evt.target.result);
        };

        request.onerror = function (evt) {
          LOG(4
          /* level=ERROR */
          )(_templateObject5(), key, value);
          reject(evt.target.error);
        };
      });
    }
  }, {
    key: "doDel",
    value: function doDel(key) {
      var _this6 = this;

      return new Promise(function (resolve, reject) {
        var objectStore = _this6._db.store(_this6.name, 'readwrite');

        var request = objectStore.delete(key);

        request.onsuccess = function (evt) {
          resolve(evt.target.result);
        };

        request.onerror = function (evt) {
          LOG(4
          /* level=ERROR */
          )(_templateObject6(), key, _this6.name);
          reject(evt.target.error);
        };
      });
    }
  }, {
    key: "doCount",
    value: function doCount() {
      var _this7 = this;

      return new Promise(function (resolve, reject) {
        var objectStore = _this7._db.store(_this7.name, 'readonly');

        var request = objectStore.count();

        request.onsuccess = function (evt) {
          resolve(evt.target.result);
        };

        request.onerror = function (evt) {
          LOG(4
          /* level=ERROR */
          )(_templateObject7(), _this7.name);
          reject(evt.target.error);
        };
      });
    }
  }, {
    key: "doClear",
    value: function doClear() {
      var _this8 = this;

      return new Promise(function (resolve, reject) {
        var objectStore = _this8._db.store(_this8.name, 'readwrite');

        var request = objectStore.clear();

        request.onsuccess = function () {
          resolve();
        };

        request.onerror = function (evt) {
          LOG(4
          /* level=ERROR */
          )(_templateObject8(), _this8.name);
          reject(evt.target.error);
        };
      });
    }
  }, {
    key: "_addStoreInfo",
    value: function _addStoreInfo(storeName, opts) {
      if (!opts) {
        this._db.addStoreInfo(storeName, {
          opts: {},
          indexes: []
        });

        return;
      }

      var dbOpts = {
        keyPath: opts.primaryIndexKey
      };
      var indexes = opts.secondaryIndexes.map(function (i) {
        return {
          indexName: i.key,
          keyPath: i.key,
          objParam: {
            unique: i.unique ? true : false
          }
        };
      });

      this._db.addStoreInfo(storeName, {
        opts: dbOpts,
        indexes
      });
    }
  }, {
    key: "doOpen",
    value: function doOpen() {
      return this._db.open();
    }
  }, {
    key: "doClose",
    value: function doClose() {
      return this._db.close();
    }
  }]);

  return IdbStore;
}(_abstract_store.default);

exports.default = IdbStore;
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(0)["log"]))

/***/ }),
/* 59 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _actions = _interopRequireDefault(__webpack_require__(1));

var _service_worker_bus = _interopRequireDefault(__webpack_require__(3));

var _sw_feature = _interopRequireDefault(__webpack_require__(2));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function (o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function (o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var DOWNLOAD_URL = 'download/blob';

var DocumentDownloadHandler =
/*#__PURE__*/
function (_Feature) {
  _inherits(DocumentDownloadHandler, _Feature);

  function DocumentDownloadHandler() {
    var _getPrototypeOf2;

    var _this;

    _classCallCheck(this, DocumentDownloadHandler);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = _possibleConstructorReturn(this, (_getPrototypeOf2 = _getPrototypeOf(DocumentDownloadHandler)).call.apply(_getPrototypeOf2, [this].concat(args)));

    _this.matchFetch = function (event) {
      var request = event.request;

      var url = _sw_feature.default.parseUrl(request.url);

      return request.method === _sw_feature.default.RequestType.GET && !!url && !!url.relativePath.match(DOWNLOAD_URL);
    };

    _this.onFetch = function (event) {
      var request = event.request,
          client = event.client,
          clientId = event.clientId; // Grr. Cast this so flow doesn't complain. We know the url is valid
      // as it has already passed matchFetch.

      var url = _sw_feature.default.parseUrl(request.url);

      if (!url.queryParams || !url.queryParams.msgId) {
        // TODO (T66044382): Audit/convert to error
        // eslint-disable-next-line prefer-promise-reject-errors
        return Promise.reject('Invalid msgId');
      }

      var cid = clientId || client && client.id; // TODO (T66044382): Audit/convert to error
      // eslint-disable-next-line prefer-promise-reject-errors

      if (!cid) return Promise.reject('No client id found.');
      return _service_worker_bus.default.request(cid, _actions.default.REQUEST_DOCUMENT_DOWNLOAD, url.queryParams.msgId);
    };

    return _this;
  }

  return DocumentDownloadHandler;
}(_sw_feature.default);

exports.default = DocumentDownloadHandler;

/***/ }),
/* 60 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _sw_feature = _interopRequireDefault(__webpack_require__(2));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function (o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function (o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

// FIXME (T48256665): The sticker cache should be cleared on logout. Unfortunately, the
// service worker bus is currently written to only allow one handler per action
// and the profile pic handler already handles the logout action.
var dynWebFetchOptions = {
  credentials: 'include'
}; // TODO (T48256747): This handles the old-style sticker URLs and can be removed entirely once
// D14431440 has been in the wild long enough for clients to be upgraded.

var LegacyStickerHandler =
/*#__PURE__*/
function (_Feature) {
  _inherits(LegacyStickerHandler, _Feature);

  function LegacyStickerHandler() {
    var _getPrototypeOf2;

    var _this;

    _classCallCheck(this, LegacyStickerHandler);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = _possibleConstructorReturn(this, (_getPrototypeOf2 = _getPrototypeOf(LegacyStickerHandler)).call.apply(_getPrototypeOf2, [this].concat(args)));

    _this.matchFetch = function (event) {
      var request = event.request;

      var url = _sw_feature.default.parseUrl(request.url);

      return request.method === _sw_feature.default.RequestType.GET && !!url && (url.base === 'https://web.whatsapp.com/' || url.base === 'https://dyn.web.whatsapp.com/') && url.relativePath === 'stickers';
    };

    _this.onFetch = function (event) {
      var request = event.request;

      var url = _sw_feature.default.parseUrl(request.url);

      if (!url || !url.queryParams) {
        return self.fetch(request);
      }

      if (!url.queryParams.u) return self.fetch(request);
      var mmsUrl = self.decodeURIComponent(url.queryParams.u);
      var cacheUrl = "".concat(url.base).concat(url.relativePath, "?u=").concat(mmsUrl); // Generate stable path: __DYN_ORIGIN__/sticker?u=${mmsUrl}

      return _this.cache.matchOrFetch(mmsUrl, cacheUrl).then(function (response) {
        if (!response.ok) return _this.cache.fetchAndPut(request, cacheUrl, dynWebFetchOptions);
        return response;
      });
    };

    return _this;
  }

  return LegacyStickerHandler;
}(_sw_feature.default);

exports.default = LegacyStickerHandler;

/***/ }),
/* 61 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _actions = _interopRequireDefault(__webpack_require__(1));

var _sw_feature = _interopRequireDefault(__webpack_require__(2));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function (o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function (o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var PPHandler =
/*#__PURE__*/
function (_Feature) {
  _inherits(PPHandler, _Feature);

  function PPHandler() {
    var _getPrototypeOf2;

    var _this;

    _classCallCheck(this, PPHandler);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = _possibleConstructorReturn(this, (_getPrototypeOf2 = _getPrototypeOf(PPHandler)).call.apply(_getPrototypeOf2, [this].concat(args)));

    _this.matchFetch = function (event) {
      var request = event.request;

      var url = _sw_feature.default.parseUrl(request.url);

      return request.method === _sw_feature.default.RequestType.GET && !!url && (url.base === 'https://web.whatsapp.com/' || url.base === 'https://dyn.web.whatsapp.com/') && url.relativePath === 'pp';
    };

    _this.onFetch = function (event) {
      var request = event.request;

      var url = _sw_feature.default.parseUrl(request.url);

      if (!url || !url.queryParams) return self.fetch(request);
      var _url$queryParams = url.queryParams,
          eUrl = _url$queryParams.e,
          size = _url$queryParams.t,
          id = _url$queryParams.u,
          tag = _url$queryParams.i,
          token = _url$queryParams.n; // Generate stable path: __DYN_ORIGIN__/pp?t=${size}&u=${wid}&i=${tag}
      // Remove everstore url (e), ref, tok

      var ppUrl = "".concat(url.base).concat(url.relativePath, "?t=").concat(size, "&u=").concat(id, "&i=").concat(tag, "&n=").concat(token);
      var requestUrl = eUrl ? self.decodeURIComponent(eUrl) : request;
      return _this.cache.matchOrFetch(requestUrl, ppUrl).then(function (response) {
        if (response.ok) {
          _this.store.get(id).then(function (oldTag) {
            if (oldTag === tag) return;
            return Promise.all([_this.removePPFromCache(id, tag), _this.store.put(id, tag)]);
          });
        }

        return response;
      });
    };

    _this.matchAction = function (action) {
      return _actions.default.REMOVE_PP === action || _actions.default.LOGOUT === action;
    };

    _this.onAction = function (action, message) {
      switch (action) {
        case _actions.default.REMOVE_PP:
          var id = self.encodeURIComponent(message);
          return _this.store.get(id).then(function (tag) {
            if (!tag) return;
            return Promise.all([_this.removePPFromCache(id, tag), _this.store.delete(id)]);
          }).then(function () {});
        // case Actions.LOGOUT:

        default:
          return Promise.all([_this.cache.reset(), _this.store.clear()]).then(function () {});
      }
    };

    return _this;
  }

  _createClass(PPHandler, [{
    key: "removePPFromCache",
    value: function removePPFromCache(id, tag) {
      return Promise.all([this.cache.delete("https://web.whatsapp.com/pp?t=s&u=".concat(id, "&i=").concat(tag)), this.cache.delete("https://web.whatsapp.com/pp?t=l&u=".concat(id, "&i=").concat(tag)), this.cache.delete("https://dyn.web.whatsapp.com/pp?t=s&u=".concat(id, "&i=").concat(tag)), this.cache.delete("https://dyn.web.whatsapp.com/pp?t=l&u=".concat(id, "&i=").concat(tag))]);
    }
  }]);

  return PPHandler;
}(_sw_feature.default);

exports.default = PPHandler;

/***/ }),
/* 62 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _shared_constants = __webpack_require__(63);

var _sw_feature = _interopRequireDefault(__webpack_require__(2));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function (o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function (o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

// FIXME (T48256666): The sticker cache should be cleared on logout. Unfortunately, the
// service worker bus is currently written to only allow one handler per action
// and the profile pic handler already handles the logout action.
var StickerHandler =
/*#__PURE__*/
function (_Feature) {
  _inherits(StickerHandler, _Feature);

  function StickerHandler() {
    var _getPrototypeOf2;

    var _this;

    _classCallCheck(this, StickerHandler);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = _possibleConstructorReturn(this, (_getPrototypeOf2 = _getPrototypeOf(StickerHandler)).call.apply(_getPrototypeOf2, [this].concat(args)));

    _this.matchFetch = function (event) {
      var request = event.request;
      var url = new URL(request.url); // TODO (T48824231) Audit ignored unsupported APIs
      // eslint-disable-next-line compat/compat

      var params = new URLSearchParams(url.search);
      return request.method === _sw_feature.default.RequestType.GET && params.has(_shared_constants.IS_MMS_URL_SEARCH_PARAM) && (url.pathname.indexOf('/mms/sticker/') === 0 || // regular endpoint
      params.get(_shared_constants.MMS_URL_MEDIA_TYPE_SEARCH_PARAM) === 'sticker') // direct path
      ;
    };

    _this.onFetch = function (event) {
      return _this.cache.matchOrFetch(event.request);
    };

    return _this;
  }

  return StickerHandler;
}(_sw_feature.default);

exports.default = StickerHandler;

/***/ }),
/* 63 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MMS_URL_MEDIA_TYPE_SEARCH_PARAM = exports.IS_MMS_URL_SEARCH_PARAM = void 0;
// This file contains constants that are shared by both the client and the
// service worker.
var IS_MMS_URL_SEARCH_PARAM = '__wa-mms';
exports.IS_MMS_URL_SEARCH_PARAM = IS_MMS_URL_SEARCH_PARAM;
var MMS_URL_MEDIA_TYPE_SEARCH_PARAM = 'mms-type';
exports.MMS_URL_MEDIA_TYPE_SEARCH_PARAM = MMS_URL_MEDIA_TYPE_SEARCH_PARAM;

/***/ }),
/* 64 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(LOG) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _service_worker_bus = _interopRequireDefault(__webpack_require__(3));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _templateObject4() {
  var data = _taggedTemplateLiteral(["onActivate error: ", "."]);

  _templateObject4 = function () {
    return data;
  };

  return data;
}

function _templateObject3() {
  var data = _taggedTemplateLiteral(["Activating..."]);

  _templateObject3 = function () {
    return data;
  };

  return data;
}

function _templateObject2() {
  var data = _taggedTemplateLiteral(["onInstall error: ", ""]);

  _templateObject2 = function () {
    return data;
  };

  return data;
}

function _templateObject() {
  var data = _taggedTemplateLiteral(["Installing..."]);

  _templateObject = function () {
    return data;
  };

  return data;
}

function _taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var _default = function _default(handlers) {
  ////////////////////////////////////////////////////////////////////////////////
  // SW Event Handlers
  ////////////////////////////////////////////////////////////////////////////////
  self.addEventListener('install', function (event) {
    LOG(2
    /* level=LOG */
    )(_templateObject());
    var installHandlers = handlers.filter(function (handler) {
      return handler.matchInstall(event);
    }).map(function (handler) {
      return Promise.resolve(handler.onInstall(event));
    });
    event.waitUntil(Promise.all(installHandlers).then(function () {
      return self.skipWaiting();
    }).catch(function (err) {
      LOG(4
      /* level=ERROR */
      )(_templateObject2(), String(err));
    }));
  });
  self.addEventListener('activate', function (event) {
    LOG(2
    /* level=LOG */
    )(_templateObject3());
    var activateHandlers = handlers.filter(function (handler) {
      return handler.matchActivate(event);
    }).map(function (handler) {
      return handler.onActivate(event);
    });
    event.waitUntil(self.clients.claim().then(function () {
      return Promise.all(activateHandlers);
    }).catch(function (err) {
      LOG(4
      /* level=ERROR */
      )(_templateObject4(), err);
    }));
  });
  self.addEventListener('fetch', function (event) {
    var handler = handlers.find(function (handler) {
      return handler.matchFetch(event);
    });

    if (handler) {
      return event.respondWith(handler.onFetch(event));
    }
  }); ////////////////////////////////////////////////////////////////////////////////
  // ServiceWorkerBus. Used for all incoming client requests
  ////////////////////////////////////////////////////////////////////////////////

  var serviceWorkerBus = new _service_worker_bus.default(function (_ref) {
    var action = _ref.action,
        message = _ref.message;
    var handler = handlers.find(function (handler) {
      return handler.matchAction(action);
    });
    if (handler) return handler.onAction(action, message); // TODO (T66044382): Audit/convert to error
    // eslint-disable-next-line prefer-promise-reject-errors
    else return Promise.reject("Invalid Action: ".concat(action));
  });
  serviceWorkerBus.init();
};

exports.default = _default;
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(0)["log"]))

/***/ }),
/* 65 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _actions = _interopRequireDefault(__webpack_require__(1));

var _service_worker_bus = _interopRequireDefault(__webpack_require__(3));

var _sw_feature = _interopRequireDefault(__webpack_require__(2));

var _video_streamer = _interopRequireDefault(__webpack_require__(66));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function (o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function (o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var VIDEO_STREAM_URL = '/stream/video';

var VideoStreamingHandler =
/*#__PURE__*/
function (_Feature) {
  _inherits(VideoStreamingHandler, _Feature);

  function VideoStreamingHandler() {
    var _getPrototypeOf2;

    var _this;

    _classCallCheck(this, VideoStreamingHandler);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = _possibleConstructorReturn(this, (_getPrototypeOf2 = _getPrototypeOf(VideoStreamingHandler)).call.apply(_getPrototypeOf2, [this].concat(args)));

    _this.matchFetch = function (event) {
      var request = event.request;

      var url = _sw_feature.default.parseUrl(request.url);

      return request.method === _sw_feature.default.RequestType.GET && !!url && !!url.queryParams && !!url.queryParams.key && !!request.url.match(VIDEO_STREAM_URL);
    };

    _this.onFetch = function (event) {
      var request = event.request,
          client = event.client,
          clientId = event.clientId; // Grr. Cast this so flow doesn't complain. We know the url is valid
      // as it has already passed matchFetch.

      var url = _sw_feature.default.parseUrl(request.url); // TODO (T48256703): Cache and store multiple Streamers and test with SW lifecycle.


      var cid = clientId || client && client.id;

      if (!cid) {
        // TODO (T66044382): Audit/convert to error
        // eslint-disable-next-line prefer-promise-reject-errors
        return Promise.reject('No client id found.');
      }

      return _service_worker_bus.default.request(cid, _actions.default.REQUEST_STREAMING_INFO, {
        key: url.queryParams.key
      }).then(function (_ref) {
        var cryptoKeys = _ref.cryptoKeys,
            streamData = _ref.streamData;
        var streamer = new _video_streamer.default(cid, cryptoKeys, streamData);
        return streamer.fetchAndDecrypt(request);
      });
    };

    _this.matchAction = function (action) {
      return action === _actions.default.STREAMING_SUPPORTED;
    };

    _this.onAction = function () {
      return !!self.crypto && (!!self.crypto.subtle || !!self.crypto.webkitSubtle);
    };

    return _this;
  }

  return VideoStreamingHandler;
}(_sw_feature.default);

exports.default = VideoStreamingHandler;

/***/ }),
/* 66 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(LOG) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _actions = _interopRequireDefault(__webpack_require__(1));

var _concat = _interopRequireDefault(__webpack_require__(67));

var _crypto = __webpack_require__(68);

var _deep_equal = _interopRequireDefault(__webpack_require__(69));

var _service_worker_bus = _interopRequireDefault(__webpack_require__(3));

var _utils = _interopRequireDefault(__webpack_require__(7));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _templateObject6() {
  var data = _taggedTemplateLiteral(["sw:videoStreaming:getEncryptedPadding encrypt error: ", ""]);

  _templateObject6 = function () {
    return data;
  };

  return data;
}

function _templateObject5() {
  var data = _taggedTemplateLiteral(["sw:videoStreaming:getEncryptedPadding importKey error: ", ""]);

  _templateObject5 = function () {
    return data;
  };

  return data;
}

function _templateObject4() {
  var data = _taggedTemplateLiteral(["sw:videoStreaming:decrypt decrypt error: ", ""]);

  _templateObject4 = function () {
    return data;
  };

  return data;
}

function _templateObject3() {
  var data = _taggedTemplateLiteral(["sw:videoStreaming:decrypt importKey error: ", ""]);

  _templateObject3 = function () {
    return data;
  };

  return data;
}

function _templateObject2() {
  var data = _taggedTemplateLiteral(["sw:videoStreaming:processRequest ciphertext is too short - ", " bytes"]);

  _templateObject2 = function () {
    return data;
  };

  return data;
}

function _templateObject() {
  var data = _taggedTemplateLiteral(["sw:videoStreaming:processRequest server returns ", " error"]);

  _templateObject = function () {
    return data;
  };

  return data;
}

function _taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

// kilobyte
var kB = 1024; // the block size we use for AES-CBC

var BLOCK_SIZE = 16; // we currently store the first 10 bytes of HMAC for media, at the end of encrypted payload

var HMAC_SIZE = 10; // 64kB used for validating the sidecar

var CHUNK_SIZE = 64 * kB; // TODO (T48256738): figure out the optimal chunk size
//       too big, the user will wait too long
//       too small, network roundtrip time will accumulate
// TODO (T48256668): right now CHUNK_SIZE is only used for 'bytes=START_RANGE-' requests,
//       (no END_RANGE). think about if we should set an upper threshold of
//       the maximum number of bytes we should get at once

var FETCH_SIZE = CHUNK_SIZE * 24; // 64kb * 24 = 1.5MB

var VideoStreamer =
/*#__PURE__*/
function () {
  function VideoStreamer(clientId, cryptoKeys, streamData) {
    _classCallCheck(this, VideoStreamer);

    this.generation = 0;
    var rawSidecar = cryptoKeys.sidecar;
    var sidecar = [];

    for (var start = 0; start < rawSidecar.byteLength; start += HMAC_SIZE) {
      sidecar.push(rawSidecar.slice(start, start + HMAC_SIZE));
    }

    this.cryptoKeys = {
      iv: cryptoKeys.iv,
      sidecar,
      encKey: cryptoKeys.encKey,
      macKey: cryptoKeys.macKey
    };
    this.streamData = streamData;
    this.clientId = clientId;
  }

  _createClass(VideoStreamer, [{
    key: "fetchAndDecrypt",
    value: function fetchAndDecrypt(clientRequest) {
      var _this = this;

      var _this$streamData = this.streamData,
          clientUrl = _this$streamData.clientUrl,
          msgKey = _this$streamData.msgKey; // get the byte range from the client request
      // NOTE: clientRangeEnd is null if the client request doesn't specify one

      var _parseClientRange = parseClientRange(clientRequest),
          clientRangeStart = _parseClientRange.clientRangeStart,
          clientRangeEnd = _parseClientRange.clientRangeEnd; // figure out the byte range for the server request
      // NOTE: serverRangeEnd can pass beyond the end of the file


      var _this$computeServerRa = this.computeServerRange(clientRangeStart, clientRangeEnd),
          serverRangeStart = _this$computeServerRa.serverRangeStart,
          serverRangeEnd = _this$computeServerRa.serverRangeEnd;

      var serverRequest = this.createServerRequest(clientRequest, serverRangeStart, serverRangeEnd, clientUrl); // actually fetch data from the server
      // eslint-disable-next-line compat/compat

      return fetch(serverRequest).then(function (serverResponse) {
        // request media reupload if server returns 404s
        if (serverResponse.status === 404) {
          return _this.handleRMR(clientRequest, msgKey);
        } // just forward all other errors


        if (serverResponse.status >= 400) {
          LOG(2
          /* level=LOG */
          )(_templateObject(), serverResponse.status);
          _this.generation++;
          return _service_worker_bus.default.request(_this.clientId, _actions.default.EXP_BACKOFF, {
            generation: _this.generation
          }).then(function () {
            return _this.fetchAndDecrypt(clientRequest);
          });
        }

        _this.generation = 0;
        return serverResponse.arrayBuffer().then(function (ciphertext) {
          var numBytes = ciphertext.byteLength;

          if (!ciphertext || numBytes < BLOCK_SIZE) {
            LOG(2
            /* level=LOG */
            )(_templateObject2(), numBytes); // eslint-disable-next-line compat/compat

            return new Response("Ciphertext is too short - ".concat(numBytes, " bytes"), {
              status: 500
            });
          } // once we have the correct ciphertext and iv, decrypt it


          return _this.validateSidecar(serverRangeStart, ciphertext).then(function () {
            return _this.cleanupCiphertextAndIv(serverRangeStart, ciphertext);
          }).then(function (_ref) {
            var ciphertext = _ref.ciphertext,
                iv = _ref.iv;
            return _this.decrypt(ciphertext, iv);
          }) // then process the plaintext and create a response
          .then(function (plaintext) {
            var cleaned = _this.cleanupPlaintext(plaintext, {
              clientRangeStart,
              clientRangeEnd
            }, {
              serverRangeStart,
              serverRangeEnd
            });

            var clientResponse = _this.createClientResponse(serverResponse, cleaned, clientRangeStart);

            _this.sendBackArrayBuffer(clientRangeStart, cleaned);

            return clientResponse;
          });
        });
      });
    } // ciphertext already has fake padding

  }, {
    key: "decrypt",
    value: function decrypt(ciphertext, iv) {
      var encKey = this.cryptoKeys.encKey;
      var AES_CBC = {
        name: 'AES-CBC',
        iv: new Uint8Array(iv)
      };
      return (0, _crypto.getCrypto)().importKey('raw', new Uint8Array(encKey), AES_CBC, false, ['decrypt']).catch(function (error) {
        LOG(2
        /* level=LOG */
        )(_templateObject3(), String(error));
        throw error;
      }).then(function (key) {
        return (0, _crypto.getCrypto)().decrypt(AES_CBC, key, ciphertext);
      }).catch(function (error) {
        LOG(2
        /* level=LOG */
        )(_templateObject4(), String(error));
        throw error;
      });
    } // triggers an RMR from the main app, and calls fetchAndDecrypt when RMR completes

  }, {
    key: "handleRMR",
    value: function handleRMR(clientRequest, msgKey) {
      var _this2 = this;

      return _service_worker_bus.default.request(this.clientId, _actions.default.REQUEST_RMR, {
        key: msgKey
      }).then(function (data) {
        _this2.cryptoKeys.encKey = data.encKey;
        _this2.cryptoKeys.iv = data.iv;
        _this2.streamData.clientUrl = data.clientUrl;
        _this2.streamData.size = data.size;
        return _this2.fetchAndDecrypt(clientRequest);
      });
    } // 1) get the ciphertext to the right length, with the right padding
    // 2) return the iv for decryption

  }, {
    key: "cleanupCiphertextAndIv",
    value: function cleanupCiphertextAndIv(serverRangeStart, ciphertext_) {
      var ciphertext = ciphertext_;
      var ciphertextContainsFullBlocks = ciphertext.byteLength % BLOCK_SIZE === 0; // NOTE: if this is the last block, it will not be multiple of 16
      // because of the 10-byte HMAC
      // TODO (T48256728): this may be incorrect!! -tj

      var iv;

      if (serverRangeStart === 0) {
        // if the ciphertext range contains the first chunk, use the file's
        // iv as the ciphertext iv
        iv = this.cryptoKeys.iv;
      } else {
        // if the ciphertext range doesn't contain the first chunk, use the
        // first block as the ciphertext iv
        iv = ciphertext.slice(0, BLOCK_SIZE);
        ciphertext = ciphertext.slice(BLOCK_SIZE);
      }

      if (!ciphertextContainsFullBlocks) {
        // if the ciphertext range contains the last chunk, remove the hmac
        ciphertext = ciphertext.slice(0, ciphertext.byteLength - HMAC_SIZE);
      } //


      if (ciphertextContainsFullBlocks) {
        // if the ciphertext range contains full blocks, encrypted padding
        // is added to normalized padding removal after decryption
        return this.getEncryptedPadding(ciphertext).then(function (padding) {
          // we have to create an ArrayBufferView (an Uint8Array)
          // before concatenating
          ciphertext = (0, _concat.default)(Uint8Array, [new Uint8Array(ciphertext), new Uint8Array(padding)]);
          return {
            ciphertext,
            iv
          };
        });
      }

      return Promise.resolve({
        ciphertext,
        iv
      });
    } // only return the plaintext in byte range that client requested

  }, {
    key: "cleanupPlaintext",
    value: function cleanupPlaintext(plaintext, _ref2, _ref3) {
      var clientRangeStart = _ref2.clientRangeStart,
          clientRangeEnd = _ref2.clientRangeEnd;
      var serverRangeStart = _ref3.serverRangeStart,
          serverRangeEnd = _ref3.serverRangeEnd;
      // calculate extra bytes added at the start to round out to chunks size
      var numBytesCutFromStart = serverRangeStart === 0 ? 0 : // adjust serverRangeStart to ignore additional chunk-iv
      clientRangeStart - (serverRangeStart + BLOCK_SIZE); // calculate extra bytes added at the end to round out to chunks size

      var numBytesCutFromEnd = clientRangeEnd != null ? serverRangeEnd - clientRangeEnd : 0; // remove unrequested bytes

      return plaintext.slice(numBytesCutFromStart, plaintext.byteLength - numBytesCutFromEnd);
    }
  }, {
    key: "getEncryptedPadding",
    value: function getEncryptedPadding(ciphertext) {
      var encKey = this.cryptoKeys.encKey;
      var AES_CBC = {
        name: 'AES-CBC',
        iv: ciphertext.slice(0 - BLOCK_SIZE)
      };
      return (0, _crypto.getCrypto)().importKey('raw', new Uint8Array(encKey), AES_CBC, false, ['encrypt']).catch(function (error) {
        LOG(2
        /* level=LOG */
        )(_templateObject5(), String(error));
      }).then(function (key) {
        // if we encrypt an empty array, AES-CBC will add the padding automatically
        // because 0 % 16 = 0. See https://tools.ietf.org/html/rfc2315#section-10.3
        var plaintext = new Uint8Array([]);
        return (0, _crypto.getCrypto)().encrypt(AES_CBC, key, plaintext);
      }).catch(function (error) {
        LOG(2
        /* level=LOG */
        )(_templateObject6(), String(error));
      });
    }
  }, {
    key: "validateSidecar",
    value: function validateSidecar(serverRangeStart, ciphertext_) {
      var _this3 = this;

      var ciphertext = ciphertext_;
      var _this$cryptoKeys = this.cryptoKeys,
          macKey = _this$cryptoKeys.macKey,
          iv = _this$cryptoKeys.iv,
          sidecar = _this$cryptoKeys.sidecar;
      var startChunkIndex;
      var nextChunkIV; // normalize chunk format to [chunk-data|next-chunk-iv]

      if (serverRangeStart === 0) {
        // chunk format: [chunk-data|next-chunk-iv]
        startChunkIndex = 0; // first chunk iv is file iv

        nextChunkIV = iv;
      } else {
        // chunk format: [chunk-iv|chunk-data] -> [chunk-data|next-chunk-iv]
        startChunkIndex = (serverRangeStart + BLOCK_SIZE) / CHUNK_SIZE;
        nextChunkIV = ciphertext.slice(0, BLOCK_SIZE);
        ciphertext = ciphertext.slice(BLOCK_SIZE);
      } // ciphertext byte length is not perfectly divisible by chunk size bc
      // the last chunk does not contain "next chunk" iv


      var numChunks = ciphertext.byteLength / CHUNK_SIZE;
      return (0, _crypto.getCrypto)().importKey('raw', new Uint8Array(macKey), {
        name: 'HMAC',
        hash: {
          name: 'SHA-256'
        }
      }, false, ['sign']).then(function (key) {
        var chunks = []; // console.log('validate_sidecar:', 'RANGE_START:', serverRangeStart);

        for (var i = 0; i < numChunks; i++) {
          var sidecarIndex = startChunkIndex + i;
          var chunkSidecar = sidecar[sidecarIndex]; // chunk format: [chunk-data|next-chunk-iv]

          var chunkDataStartByteIndex = i * CHUNK_SIZE;
          var chunkData = ciphertext.slice(chunkDataStartByteIndex, chunkDataStartByteIndex + CHUNK_SIZE);
          var chunkIV = nextChunkIV;
          nextChunkIV = chunkData.slice(CHUNK_SIZE - BLOCK_SIZE, CHUNK_SIZE - BLOCK_SIZE + BLOCK_SIZE);
          var ciphertextChunk = (0, _concat.default)(Uint8Array, [new Uint8Array(chunkIV), new Uint8Array(chunkData)]);
          chunks.push(_this3.validateChunk(ciphertextChunk, key, chunkSidecar));
        }

        return Promise.all(chunks);
      });
    }
  }, {
    key: "validateChunk",
    value: function validateChunk(ciphertext, key, sidecarChunk) {
      return (0, _crypto.getCrypto)().sign({
        name: 'HMAC'
      }, key, ciphertext).then(function (signature) {
        var first10 = signature.slice(0, HMAC_SIZE);

        if (!(0, _deep_equal.default)(first10, sidecarChunk)) {
          // TODO (T66044382): Audit/convert to error
          // eslint-disable-next-line prefer-promise-reject-errors
          return Promise.reject('Invalid Chunk: Does not match sidecar.');
        }
      });
    } // If we send our request with bytestart and byteend query params (instead
    // of headers), we're opting into a custom response format as well; the
    // server will respond with a 200 status (instead of a 206) and no
    // "Content-Range"/"Content-Length" headers. The purpose of this method is
    // to translate that back to the standard for consumption by the client.

  }, {
    key: "createClientResponse",
    value: function createClientResponse(serverResponse, plaintext, // ArrayBuffer
    clientRangeStart) {
      var size = this.streamData.size;

      var _this$getContentRange = this.getContentRange(clientRangeStart, plaintext),
          contentRangeStart = _this$getContentRange.contentRangeStart,
          contentRangeEnd = _this$getContentRange.contentRangeEnd;

      var contentRangeStr = "bytes ".concat(contentRangeStart, "-").concat(contentRangeEnd, "/").concat(size); // eslint-disable-next-line compat/compat

      var clientResponseHeaders = new Headers(serverResponse.headers); // the following two headers let the client (in this case, <video>)
      // know how big is the entire file so it can make intelligent
      // decisions about what byte range to request next

      clientResponseHeaders.set('Content-Range', contentRangeStr);
      clientResponseHeaders.set('Content-Length', "".concat(plaintext.byteLength)); // eslint-disable-next-line compat/compat

      var clientResponse = new Response(plaintext, {
        status: serverResponse.status === 200 ? 206 : serverResponse.status,
        statusText: serverResponse.statusText,
        headers: clientResponseHeaders
      });
      return clientResponse;
    } // used in the Content-Range response header

  }, {
    key: "getContentRange",
    value: function getContentRange(clientRangeStart, plaintext) {
      var contentRangeEnd = clientRangeStart + plaintext.byteLength - 1; // inclusive

      return {
        contentRangeStart: clientRangeStart,
        contentRangeEnd
      };
    } // send the ArrayBuffer back to the client so it can save
    // the blob for downloading/streaming it the second time

  }, {
    key: "sendBackArrayBuffer",
    value: function sendBackArrayBuffer(clientRangeStart, plaintext) {
      var _this$getContentRange2 = this.getContentRange(clientRangeStart, plaintext),
          contentRangeStart = _this$getContentRange2.contentRangeStart,
          contentRangeEnd = _this$getContentRange2.contentRangeEnd;

      _service_worker_bus.default.request(this.clientId, _actions.default.SEND_STREAMING_CHUNK, {
        msgKey: this.streamData.msgKey,
        data: {
          start: contentRangeStart,
          end: contentRangeEnd,
          buffer: plaintext
        }
      });
    } // generate the request that we will send to the server

  }, {
    key: "createServerRequest",
    value: function createServerRequest(clientRequest, serverRangeStart, serverRangeEnd, mediaUrl) {
      // In order to avoid a CORS preflight request, we send the range using
      // query params instead of a Range header. This will trigger the server
      // to return a custom response, which we'll need to process (see
      // `createClientResponse()`)
      var url = new URL(mediaUrl);
      url.searchParams.set('bytestart', serverRangeStart.toString());
      url.searchParams.set('byteend', serverRangeEnd.toString());

      var serverRequest = _utils.default.manuallyCloneRequest(clientRequest, url.toString(), {
        // We don't want to send cookies because the server doesn't respond
        // with Access-Control-Allow-Credentials and we will get a CORS violation
        credentials: 'omit',
        // We want to keep this a "simple" request (for the sake of
        // CORS), so we clear the headers.
        headers: new Headers({}),
        // eslint-disable-line compat/compat
        mode: 'cors',
        // overwrite the default referrer `about:client`
        referrer: clientRequest.referrer
      });

      return serverRequest;
    } // compute the range in the server request based on the range in the client request
    // 1) round down the range start to the nearest 16
    // 2) round up the range end to the nearest 16
    // 3) if the range end is not set, only load FETCH_SIZE bytes
    // 4) if it is not the first BLOCK_SIZE, request the 16 bytes prior to the range

  }, {
    key: "computeServerRange",
    value: function computeServerRange(clientRangeStart, clientRangeEnd) {
      var serverRangeStart = clientRangeStart;
      var serverRangeEnd = clientRangeEnd;

      if (clientRangeStart) {
        serverRangeStart = this.roundDown(clientRangeStart, CHUNK_SIZE);
      } else {
        serverRangeStart = 0;
      }

      if (clientRangeEnd != null && clientRangeEnd !== 0) {
        // range end is inclusive, so we subtract 1
        serverRangeEnd = this.roundUp(clientRangeEnd, CHUNK_SIZE) - 1;
      } else {
        // handle `bytes=0-` case, load progressively
        serverRangeEnd = serverRangeStart + FETCH_SIZE - 1;
      }

      if (serverRangeStart > 0) {
        // get last block in previous chunk to use as chunk IV
        serverRangeStart -= BLOCK_SIZE;
      } // discard last block: IV for chunk outside of byte range
      // serverRangeEnd -= BLOCK_SIZE;


      return {
        serverRangeStart,
        serverRangeEnd
      };
    } // rounds up `number` to the nearest `nearest`
    // e.g. roundUp(0, 16) => 0, roundUp(1, 16) => 16, roundUp(30, 16) => 32

  }, {
    key: "roundUp",
    value: function roundUp(number, nearest) {
      return Math.ceil(number / nearest) * nearest;
    } // rounds down `number` to the nearest `nearest`
    // e.g. roundUp(0, 16) => 0, roundUp(1, 16) => 0, roundUp(30, 16) => 16

  }, {
    key: "roundDown",
    value: function roundDown(number, nearest) {
      return Math.floor(number / nearest) * nearest;
    }
  }]);

  return VideoStreamer;
}(); // Parse the Range header to get the starting and ending byte position, either
// from the header or the special query params.


exports.default = VideoStreamer;

function parseClientRange(clientRequest) {
  var clientRangeStart;
  var clientRangeEnd;
  var rangeHeader = clientRequest.headers.get('Range');

  if (rangeHeader) {
    // TODO (T48256737): handle negative range request (e.g. bytes=-100) and multiple range
    // request (e.g. bytes=100-200, 300-400), although I haven't seen <video>
    // sending these though.
    var _rangeHeader$replace$ = rangeHeader.replace('bytes=', '').split('-');

    var _rangeHeader$replace$2 = _slicedToArray(_rangeHeader$replace$, 2);

    clientRangeStart = _rangeHeader$replace$2[0];
    clientRangeEnd = _rangeHeader$replace$2[1];
  } else {
    var url = new URL(clientRequest.url);
    clientRangeStart = url.searchParams.get('bytesstart');
    clientRangeEnd = url.searchParams.get('bytesend');
  }

  clientRangeStart = parseInt(clientRangeStart, 10) || 0;
  clientRangeEnd = parseInt(clientRangeEnd, 10);
  if (isNaN(clientRangeEnd)) clientRangeEnd = null;
  return {
    clientRangeStart,
    clientRangeEnd
  };
}
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(0)["log"]))

/***/ }),
/* 67 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = concat;

function concat(TypedArray, arrays) {
  var len = arrays.reduce(function (len, buffer) {
    return len + buffer.length;
  }, 0);
  var tmp = new TypedArray(len);
  var offset = 0;
  arrays.forEach(function (arr) {
    tmp.set(arr, offset);
    offset += arr.length;
  });
  return tmp;
}

/***/ }),
/* 68 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getCrypto = getCrypto;

// Utilities that SW and Client both use
function getCrypto() {
  return self.crypto.subtle || self.crypto.webkitSubtle; // webkitSubtle for Safari
}

/***/ }),
/* 69 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = arrayBuffersDeepEqual;

function arrayBuffersDeepEqual(buffer1, buffer2) {
  if (buffer1.byteLength !== buffer2.byteLength) return false;
  var view1 = new DataView(buffer1);
  var view2 = new DataView(buffer2);

  for (var i = 0; i < view1.byteLength; i++) {
    if (view1.getUint8(i) !== view2.getUint8(i)) return false;
  }

  return true;
}

/***/ }),
/* 70 */,
/* 71 */,
/* 72 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _asset_handler = _interopRequireDefault(__webpack_require__(18));

var _beta_cache_handler = _interopRequireDefault(__webpack_require__(73));

var _cache_helper = _interopRequireDefault(__webpack_require__(20));

var _document_download_handler = _interopRequireDefault(__webpack_require__(59));

var _legacy_sticker_handler = _interopRequireDefault(__webpack_require__(60));

var _object_stores = _interopRequireDefault(__webpack_require__(12));

var _object_stores2 = _interopRequireDefault(__webpack_require__(15));

var _profile_pic_handler = _interopRequireDefault(__webpack_require__(61));

var _sticker_handler = _interopRequireDefault(__webpack_require__(62));

var _sw_base = _interopRequireDefault(__webpack_require__(64));

var _video_streaming_handler = _interopRequireDefault(__webpack_require__(65));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// eslint-disable-next-line no-unused-vars
// eslint-disable-next-line no-unused-vars
// eslint-disable-next-line
var objectStores = _object_stores.default; // eslint-disable-next-line

var stickerCache = new _cache_helper.default('wa-stickers');
var handlers = [new _document_download_handler.default(), new _profile_pic_handler.default(new _cache_helper.default('wa-pp'), objectStores.pp), new _video_streaming_handler.default(), new _beta_cache_handler.default(new _cache_helper.default('wa2.2029.4.canary'), objectStores.prefs), new _asset_handler.default(new _cache_helper.default('wa-assets')), new _legacy_sticker_handler.default(stickerCache, objectStores.stickers), new _sticker_handler.default(stickerCache, objectStores.stickers)];
(0, _sw_base.default)(handlers);

/***/ }),
/* 73 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(LOG) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _actions = _interopRequireDefault(__webpack_require__(1));

var _sw_cache_list = _interopRequireDefault(__webpack_require__(19));

var _sw_feature = _interopRequireDefault(__webpack_require__(2));

var _utils = _interopRequireDefault(__webpack_require__(7));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _templateObject3() {
  var data = _taggedTemplateLiteral(["Unable to determine if user was chosen for beta, err:", ""]);

  _templateObject3 = function () {
    return data;
  };

  return data;
}

function _templateObject2() {
  var data = _taggedTemplateLiteral(["Received invalid response, url: ", ", status: ", ", type: ", ""]);

  _templateObject2 = function () {
    return data;
  };

  return data;
}

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _templateObject() {
  var data = _taggedTemplateLiteral(["Beta serviceworker unable to read current version's cache list: ", ""]);

  _templateObject = function () {
    return data;
  };

  return data;
}

function _taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function (o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function (o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var LIFETIME = 604800000; // 7 days in ms

var BETA_KEY = 'force_beta';
var Dir = {
  LTR: 'LTR',
  RTL: 'RTL'
};
var HTML_REGEX = /^text\/html/;

var getEmptyCache = function () {
  return {
    version: '2.2029.4',
    releaseDate: 0,
    // Expire rightaway
    unhashedResources: [],
    hashedResources: [],
    l10n: {
      styles: {},
      locales: {}
    }
  };
};

var BetaCacheHandler =
/*#__PURE__*/
function (_Feature) {
  _inherits(BetaCacheHandler, _Feature);

  function BetaCacheHandler(cache, store) {
    var _this;

    _classCallCheck(this, BetaCacheHandler);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(BetaCacheHandler).call(this, cache, store));

    _this.matchInstall = function () {
      return true;
    };

    _this.onInstall = function () {
      // unset isCanary so we're not using an old value left behind
      _this.store.delete('isCanary') // eslint-disable-next-line compat/compat
      .then(function () {
        return _this.fetchIndex(new Request(self.registration.scope));
      }).then(function () {
        return Promise.all([_this.store.get('isCanary'), _this.store.get('l10n')]);
      }).then(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
            isCanary = _ref2[0],
            l10n = _ref2[1];

        var hashes = [].concat(_toConsumableArray(_this.cacheObject.hashedResources), _toConsumableArray(_this.cachedL10nHashes(_this.cacheObject, l10n)));

        if (isCanary) {
          hashes.push.apply(hashes, _toConsumableArray(_this.betaCacheObject.hashedResources).concat(_toConsumableArray(_this.cachedL10nHashes(_this.betaCacheObject, l10n))));
        } // Remove index from unhashedResources for beta version
        // since fetchIndex is in charge of storing current index


        var indexIdx = _this.betaCacheObject.unhashedResources.indexOf('');

        if (indexIdx !== -1) _this.betaCacheObject.unhashedResources.splice(indexIdx, 1);
        return _this.cache.update(Array.from(new Set(hashes)), _this.betaCacheObject.unhashedResources);
      });
    };

    _this.matchActivate = function () {
      return true;
    };

    _this.onActivate = function () {
      return _this.cache.cleanup();
    };

    _this.matchFetch = function (event) {
      var request = event.request;

      var url = _sw_feature.default.parseUrl(request.url);

      return request.method === _sw_feature.default.RequestType.GET && !_this.isCacheStale() && !!url && url.base === self.registration.scope && (_this.cacheList.has(url.relativePath) || _this.betaCacheList.has(url.relativePath) || url.relativePath === '');
    };

    _this.onFetch = function (event) {
      var request = event.request;

      var url = _sw_feature.default.parseUrl(request.url);

      if (!url) return self.fetch(request);

      if (url.relativePath === '') {
        return _this.fetchIndex(request);
      } else {
        return _this.cache.matchOrFetch(request, "".concat(url.base).concat(url.relativePath));
      }
    };

    _this.matchAction = function (action) {
      return action === _actions.default.SET_L10N;
    };

    _this.onAction = function (action, l10n) {
      return Promise.all([_this.store.get('isCanary'), _this.store.get('l10n')]).then(function (_ref3) {
        var _ref4 = _slicedToArray(_ref3, 2),
            isCanary = _ref4[0],
            oldL10n = _ref4[1];

        if (oldL10n && l10n.locale === oldL10n.locale) return;
        var cacheObject = isCanary ? _this.betaCacheObject : _this.cacheObject;

        var _this$cachedL10nHashe = _this.cachedL10nHashes(cacheObject, l10n),
            _this$cachedL10nHashe2 = _slicedToArray(_this$cachedL10nHashe, 2),
            locale = _this$cachedL10nHashe2[0],
            style = _this$cachedL10nHashe2[1];

        if (!locale || !style) return _this.store.delete('l10n');
        var params = isCanary ? {
          v: _this.betaCacheObject.version
        } : {};

        var path = _sw_feature.default.convertToUrl("".concat(self.registration.scope).concat(_utils.default.getIndexPath(l10n)), params);

        return Promise.all([_this.cache.fetchAndPut(path, self.registration.scope), _this.store.put('l10n', {
          locale: l10n.locale,
          isRTL: l10n.isRTL
        })]);
      }).then(function () {});
    };

    try {
      // Server injects this from prev. versions cache_list.json
      // $FlowFixMe (T48256686): Suppressing as the definition is injected
      _this.cacheObject = {"version":"2.2027.10","hashedResources":["app.4c60d7b55c54a1f988b7.js","app2.fbe6a92a4bb7c363214b.js","lazy_loaded_high_priority_components.d96b141124a23d60a120.js","lazy_loaded_high_priority_components~lazy_loaded_low_priority_components.fcf172f23f363a24f1bf.js","lazy_loaded_low_priority_components.7abb86e5b05680851cb3.js","pdf.worker.b3c415adffc3ab488c3963fce37aeea8.js","progress.8b683b3e1f84bd4d911d.js","svg.e1d3ded5b81008531ccc.js","vendor1~app.b3a339e29535a3e4cd46.js","vendors~app2.c9bbb8f56c3498a36849.js","vendors~lazy_loaded_low_priority_components.ed814fc932a5b3091cd8.js","vendors~pdf.0ce7324201fc646fd45f.js","vendors~unorm.e42837f8780742834e41.js","browsers_c746d12d48141e728ab8.css","cssm_app.d096319c86d0e8be742282b4a6faabe5.css","cssm_qr.db7a60c5c1a058a71a6f4139c02da1ec.css"],"unhashedResources":["apple-touch-icon.png","bryndan_write_20e48b2ec8c64b2a1ceb5b28d9bcc9d0.ttf","crossdomain.xml","favicon-48x48.ico","favicon-64x64.ico","favicon.ico","notification_0a598282e94e87dea63e466d115e4a83.mp3","robots.txt","sequential-ptt-end_62ed28be622237546fd39f9468a76a49.mp3","sequential-ptt-middle_7fa161964e93db72b8d00ae22189d75f.mp3","whatsapp-webclient-login_a0f99e8cbba9eaa747ec23ffb30d63fe.mp4","whatsapp-webclient-login-hq_10ce945f706bbd216466cd05f672164d.mp4"],"l10n":{"locales":{"af.669da06f4466d944bf13.js":"locales/af.669da06f4466d944bf13.js","ar.f369f2f56dcd829d62f6.js":"locales/ar.f369f2f56dcd829d62f6.js","az.1ff7ca777f8f8e394707.js":"locales/az.1ff7ca777f8f8e394707.js","bg.ccb457937a8504ea32f7.js":"locales/bg.ccb457937a8504ea32f7.js","bn.19bf143a3e3a04db8b97.js":"locales/bn.19bf143a3e3a04db8b97.js","ca.98d85c944111e0fdbbad.js":"locales/ca.98d85c944111e0fdbbad.js","cs.ec0ee7515ac553ea73ad.js":"locales/cs.ec0ee7515ac553ea73ad.js","da.d3179b33e431ed11d36f.js":"locales/da.d3179b33e431ed11d36f.js","de.ec1875ec97d45782d0db.js":"locales/de.ec1875ec97d45782d0db.js","el.f004f473e337a7d4b535.js":"locales/el.f004f473e337a7d4b535.js","en.104e66ba636ccc75de45.js":"locales/en.104e66ba636ccc75de45.js","es.84ba4b21542ef3c8b00c.js":"locales/es.84ba4b21542ef3c8b00c.js","et.d0e4324175ffa93044ed.js":"locales/et.d0e4324175ffa93044ed.js","fa.bdb0d1b27e5630832bc7.js":"locales/fa.bdb0d1b27e5630832bc7.js","fi.377f188dba46c3ce136e.js":"locales/fi.377f188dba46c3ce136e.js","fil.b0d8a7cd7a57fbd56871.js":"locales/fil.b0d8a7cd7a57fbd56871.js","fr.41aefbfb97caaab22a82.js":"locales/fr.41aefbfb97caaab22a82.js","gu.b70ddde0b8d5269229b6.js":"locales/gu.b70ddde0b8d5269229b6.js","he.d912d750116ee636f8a3.js":"locales/he.d912d750116ee636f8a3.js","hi.b4b3c27de8a4a1fbec2c.js":"locales/hi.b4b3c27de8a4a1fbec2c.js","hr.9c591cc5fe0e9358c409.js":"locales/hr.9c591cc5fe0e9358c409.js","hu.defe2f82c8be2dbf815b.js":"locales/hu.defe2f82c8be2dbf815b.js","id.a5adbe1f66cde9f4a516.js":"locales/id.a5adbe1f66cde9f4a516.js","it.b77f30e6c8a78b71ea63.js":"locales/it.b77f30e6c8a78b71ea63.js","ja.0046773a7814f320d10a.js":"locales/ja.0046773a7814f320d10a.js","kk.548c5f6f287f6cae2db4.js":"locales/kk.548c5f6f287f6cae2db4.js","kn.5d3363d914a2c1cf2dfb.js":"locales/kn.5d3363d914a2c1cf2dfb.js","ko.6ebabdbf0d335bc7e77f.js":"locales/ko.6ebabdbf0d335bc7e77f.js","lt.ff7d4a0195e0b039baef.js":"locales/lt.ff7d4a0195e0b039baef.js","lv.582fa2f526ae27c18265.js":"locales/lv.582fa2f526ae27c18265.js","mk.97e336975f476173a414.js":"locales/mk.97e336975f476173a414.js","ml.7412792b4ecfdf87b061.js":"locales/ml.7412792b4ecfdf87b061.js","mr.51c88feb64f4cbc8016d.js":"locales/mr.51c88feb64f4cbc8016d.js","ms.913a2691f8fd8748bf5a.js":"locales/ms.913a2691f8fd8748bf5a.js","nb.af7615d42da6e850e62c.js":"locales/nb.af7615d42da6e850e62c.js","nl.1178c9a299554de88eeb.js":"locales/nl.1178c9a299554de88eeb.js","pa.9e08ab2a62482d5f65d8.js":"locales/pa.9e08ab2a62482d5f65d8.js","pl.46ea87bc8a35c3a032c7.js":"locales/pl.46ea87bc8a35c3a032c7.js","pt-BR.ff88be2b9d8d471cf2ba.js":"locales/pt-BR.ff88be2b9d8d471cf2ba.js","pt.5913f7e3783949b8e1d4.js":"locales/pt.5913f7e3783949b8e1d4.js","ro.24e44d63c130959b1ba3.js":"locales/ro.24e44d63c130959b1ba3.js","ru.9443b565dfbf5032d787.js":"locales/ru.9443b565dfbf5032d787.js","sk.fac44ae5e87e8946454c.js":"locales/sk.fac44ae5e87e8946454c.js","sl.04d5c3f461b760a0c080.js":"locales/sl.04d5c3f461b760a0c080.js","sq.70bf1a337c977785b4a2.js":"locales/sq.70bf1a337c977785b4a2.js","sr.5bb53cb4405d8e4fece9.js":"locales/sr.5bb53cb4405d8e4fece9.js","sv.ea15673238247260442b.js":"locales/sv.ea15673238247260442b.js","sw.30d5b846c227d4b49a3f.js":"locales/sw.30d5b846c227d4b49a3f.js","ta.181b3e2b1468c84a498d.js":"locales/ta.181b3e2b1468c84a498d.js","te.7584140c944e1e1cfdfc.js":"locales/te.7584140c944e1e1cfdfc.js","th.9e58273b05c4a7fcdfbe.js":"locales/th.9e58273b05c4a7fcdfbe.js","tr.ff657c2c0ce5b8c94250.js":"locales/tr.ff657c2c0ce5b8c94250.js","uk.3a70e0866302e7e9afce.js":"locales/uk.3a70e0866302e7e9afce.js","ur.dec98131018c5fe8ffb8.js":"locales/ur.dec98131018c5fe8ffb8.js","uz.3b477ac247b45d3f49c4.js":"locales/uz.3b477ac247b45d3f49c4.js","vi.732ddc89e735eb64cb32.js":"locales/vi.732ddc89e735eb64cb32.js","zh-CN.f3fee6fc09c6df048abe.js":"locales/zh-CN.f3fee6fc09c6df048abe.js","zh-TW.68b2bf29336a25efe302.js":"locales/zh-TW.68b2bf29336a25efe302.js"},"styles":{}},"releaseDate":1593638128529}; // TODO (T48256669): Add proper schema validation

      if (!_this.cacheObject.l10n || !_this.cacheObject.l10n.styles || !_this.cacheObject.l10n.locales) {
        throw new Error('Outdated Cache Schema');
      }
    } catch (err) {
      _this.cacheObject = getEmptyCache();
      LOG(4
      /* level=ERROR */
      )(_templateObject(), err);
    }

    _this.betaCacheObject = _sw_cache_list.default;
    _this.cacheList = new Set([].concat(_toConsumableArray(_this.cacheObject.hashedResources), _toConsumableArray(_this.cacheObject.unhashedResources), _toConsumableArray(Object.keys(_this.cacheObject.l10n.styles).map(function (key) {
      return _this.cacheObject.l10n.styles[key];
    })), _toConsumableArray(Object.keys(_this.cacheObject.l10n.locales).map(function (key) {
      return _this.cacheObject.l10n.locales[key];
    }))));
    _this.betaCacheList = new Set([].concat(_toConsumableArray(_this.betaCacheObject.hashedResources), _toConsumableArray(_this.betaCacheObject.unhashedResources), _toConsumableArray(Object.keys(_this.betaCacheObject.l10n.styles).map(function (key) {
      return _this.betaCacheObject.l10n.styles[key];
    })), _toConsumableArray(Object.keys(_this.betaCacheObject.l10n.locales).map(function (key) {
      return _this.betaCacheObject.l10n.locales[key];
    }))));
    return _this;
  }

  _createClass(BetaCacheHandler, [{
    key: "cachedL10nHashes",
    value: function cachedL10nHashes(cacheObject) {
      var l10nData = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var locale = l10nData.locale,
          isRTL = l10nData.isRTL;
      var dir = isRTL ? Dir.RTL : Dir.LTR;
      var loc = cacheObject.l10n.locales[locale];
      var style = cacheObject.l10n.styles && cacheObject.l10n.styles[dir];
      if (loc && style) return [loc, style];
      return [];
    }
  }, {
    key: "fetchIndex",
    value: function fetchIndex(request) {
      var _this2 = this;

      var url = _sw_feature.default.parseUrl(request.url);

      return Promise.all([this.store.get('isCanary'), this.store.get('l10n')]).then(function (_ref5) {
        var _ref6 = _slicedToArray(_ref5, 2),
            isCanary = _ref6[0],
            l10n = _ref6[1];

        // Do we want to attempt canary on every req or just initial?
        if (!isCanary && isCanary !== undefined) {
          return _this2.cache.matchOrFetch(request, self.registration.scope).then(function (response) {
            // make sure response is HTML
            var isHtml = HTML_REGEX.test(response.headers.get('Content-Type') || '');
            return [isCanary, l10n, isHtml ? response : null];
          });
        }

        return [isCanary, l10n, null];
      }).then(function (_ref7) {
        var _ref8 = _slicedToArray(_ref7, 3),
            isCanary = _ref8[0],
            l10n = _ref8[1],
            response = _ref8[2];

        if (response) {
          return response;
        }

        var params = _objectSpread({}, url && url.queryParams || {});

        var isBetaRequest = params[BETA_KEY] || isCanary;
        if (isBetaRequest) params['v'] = _this2.betaCacheObject.version;

        var indexUrl = _sw_feature.default.convertToUrl("".concat(self.registration.scope).concat(_utils.default.getIndexPath(l10n)), params);

        var newRequest = _utils.default.manuallyCloneRequest(request, indexUrl, {
          mode: 'same-origin',
          redirect: 'manual'
        });

        return self.fetch(newRequest);
      }).then(function (response) {
        if (response.ok) {
          return _this2.determineBeta(response.clone()).then(function () {
            return response;
          });
        } else if (response.type !== 'opaqueredirect') {
          LOG(4
          /* level=ERROR */
          )(_templateObject2(), response.url, response.status, response.type);
        }

        return response;
      });
    }
  }, {
    key: "determineBeta",
    value: function determineBeta(response) {
      var _this3 = this;

      // Could be no beta
      return response.clone().text().then(function (responseText) {
        return _this3.store.get('isCanary').then(function (cachedIsCanary) {
          // only store isCanary if it hasn't been set before
          if (cachedIsCanary !== undefined) return;
          var isCanary = responseText.includes('x-wa-beta="1"');
          var updateCaches = [_this3.store.put('isCanary', isCanary)];

          if (!isCanary) {
            updateCaches.push(_this3.cache.put(self.registration.scope, response));
          }

          return Promise.all(updateCaches);
        });
      }).catch(function (err) {
        LOG(4
        /* level=ERROR */
        )(_templateObject3(), err);
      });
    }
  }, {
    key: "isCacheStale",
    value: function isCacheStale() {
      return new Date().getTime() - this.betaCacheObject.releaseDate >= LIFETIME;
    }
  }]);

  return BetaCacheHandler;
}(_sw_feature.default);

exports.default = BetaCacheHandler;
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(0)["log"]))

/***/ })
/******/ ]);