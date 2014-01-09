//>>built
// wrapped by build app
define("esri/utils", ["dijit","dojo","dojox","dojo/require!dojo/io/script,esri/graphic,dojo/_base/url"], function(dijit,dojo,dojox){
dojo.provide("esri.utils");

dojo.require("dojo.io.script");
dojo.require("esri.graphic");


dojo.require("dojo._base.url");






//TODO: Replace with show/hide/toggle once introduced in dojo 0.9
esri.show = function(/*HTMLElement*/ node) {
  if (node) {
    node.style.display = "block";
  }
};

esri.hide = function(/*HTMLElement*/ node) {
  if (node) {
    node.style.display = "none";
  }
};

esri.toggle = function(/*HTMLElement*/ node) {
  node.style.display = node.style.display === "none" ? "block" : "none";
  // if (node.style.display == "none") {
  //   node.style.display = "block";
  // }
  // else {
  //   node.style.display = "none";
  // }
};

esri.valueOf = function(/*Array*/ array, /*Object*/ value) {
  //summary: Similar to dojo.indexOf, this function returns the first property
  // matching argument value. If property not found, null is returned
  // array: Array: Array to look in
  // value: Object: Object being searched for
  var i;
  for (i in array) {
    if (array[i] == value) {
      return i;
    }
  }
  return null;
};

esri.substitute = (function() {
  var _TEMPLATE_WILDCARD = "${*}",
//      _TEMPLATE_WILDCARD_STRING = "${key} = ${value}<br/>",
      _FORMATTERS = [ "NumberFormat", "DateString", "DateFormat" ];

  function cleanup(value) {
    return esri._isDefined(value) ? value : "";
  }

  function exec(key, data, template) {
    /********
     * Parse
     ********/
    var parts = template.match(/([^\(]+)(\([^\)]+\))?/i);
    var funcName = dojo.trim(parts[1]);
    // TODO
    // Parse-out options instead of eval-ing?
    var args = dojo.fromJson((parts[2] ? dojo.trim(parts[2]) : "()")
                     .replace(/^\(/, "({")
                     .replace(/\)$/, "})"));
    //console.log("[func] = ", funcName, " [args] = ", dojo.toJson(args));

    /**********
     * Execute
     **********/
    var value = data[key];
    if (dojo.indexOf(_FORMATTERS, funcName) === -1) {
      // unsupported function
      //console.warn("unknown function: ", funcName);

      // Assume this is a user-defined global function and execute it
      var ref = dojo.getObject(funcName);
      if (dojo.isFunction(ref)) {
        value = ref(value, key, data);
      }
    }
    else if ( typeof value === "number" || (typeof value === "string" && value && !isNaN(Number(value))) ) {
      value = Number(value);
      
      switch(funcName) {
        case "NumberFormat":
          // TODO
          // Is dojo.number module already part of regular and compact builds?
          if (dojo.getObject("dojo.number.format")) {
            return dojo.number.format(value, args);
          }
          break;
          
        case "DateString":
          var dateVal = new Date(value);
          
          if (args.local || args.systemLocale) {
            // American English; Uses local timezone
            
            if (args.systemLocale) {
              // Uses OS locale's conventions
              // toLocaleDateString and toLocaleTimeString are better than toLocaleString
              return dateVal.toLocaleDateString() + (args.hideTime ? "" : (" " + dateVal.toLocaleTimeString()));

              // Example: "Wednesday, December 31, 1969 4:00:00 PM"
              
              // Related Chromium bug:
              // http://code.google.com/p/chromium/issues/detail?id=3607
              // http://code.google.com/p/v8/issues/detail?id=180
            }
            else {
              // toDateString and toTimeString are better than toString
              return dateVal.toDateString() + (args.hideTime ? "" : (" " + dateVal.toTimeString()));
            }
          }
          else {
            // American English; Uses universal time convention (w.r.t GMT)
            dateVal = dateVal.toUTCString();
            if (args.hideTime) {
              dateVal = dateVal.replace(/\s+\d\d\:\d\d\:\d\d\s+(utc|gmt)/i, "");
            }
            return dateVal;

            // Example: "Thu, 01 Jan 1970 00:00:00 GMT"
            // NOTE: IE writes out UTC instead of GMT
          }
          break;
          
        case "DateFormat":
          // TODO
          // Have the user require this module explicitly, instead of
          // making utils.js directly depend on dojo.date.locale?
          if (dojo.getObject("dojo.date.locale.format")) {
            return dojo.date.locale.format(new Date(value), args);
          }
          break;
      }
    }
      
    return cleanup(value);
  }

  return function(data, template, options) {
    //summary: A function to substitute the argument data, using a template.
    // data: Array: Data object to be substituted
    // template?: String: Template string to use for substitution
    // first?: boolean: If no template, and only first data element is to be returned. Note, different browsers may interpret the for...in loop differently, thus returning different results.
    
    //  Normalize options (for backward compatibility)
    var first, dateFormat, nbrFormat;
    if (esri._isDefined(options)) {
      if (dojo.isObject(options)) {
        first = options.first;
        dateFormat = options.dateFormat;
        nbrFormat = options.numberFormat;
      }
      else {
        first = options;
      }
    }
    //options = options || {};
    //console.log("first = ", first);
    
    /*var transformFn = function(value, key) {
      if (value === undefined || value === null) {
        return "";
      }
      return value;
    };*/
    
    if (!template || template === _TEMPLATE_WILDCARD) {
      var s = [], val, i;
          /*d = {
                key: null,
                value: null
              },
          i,
          _tws = _TEMPLATE_WILDCARD_STRING;*/
      for (i in data) {
        /*d.key = i;
        d.value = data[i];
        s.push(dojo.string.substitute(_tws, d, cleanup));*/
        val = data[i];
        
        if (dateFormat && dojo.indexOf(dateFormat.properties || "", i) !== -1) {
          val = exec(i, data, dateFormat.formatter || "DateString");
        }
        else if (nbrFormat && dojo.indexOf(nbrFormat.properties || "", i) !== -1) {
          val = exec(i, data, nbrFormat.formatter || "NumberFormat");
        }

        s.push(i + " = " + cleanup(val) + "<br/>");
        
        if (first) {
          break;
        }
      }
      return s.join("");
    }
    else {
      //return dojo.string.substitute(template, data, transformFn);
      
      return dojo.replace(template, dojo.hitch({obj:data}, function(_, key){
        //console.log("Processing... ", _);
        
        var colonSplit = key.split(":");
        if (colonSplit.length > 1) {
          key = colonSplit[0];
          colonSplit.shift();
          return exec(key, this.obj, colonSplit.join(":"));
        }
        else {
          //console.log("No function");
          
          // Lookup common date format options
          if (dateFormat && dojo.indexOf(dateFormat.properties || "", key) !== -1) {
            return exec(key, this.obj, dateFormat.formatter || "DateString");
          }
          
          // Lookup common number format options
          if (nbrFormat && dojo.indexOf(nbrFormat.properties || "", key) !== -1) {
            return exec(key, this.obj, nbrFormat.formatter || "NumberFormat");
          }
        }
        
        return cleanup(this.obj[key]);
      }), /\$\{([^\}]+)\}/g);
    }
  };
  
}());

esri.documentBox = dojo.isIE ? { w:document.documentElement.clientWidth, h:document.documentElement.clientHeight } : { w:window.innerWidth, h:window.innerHeight };

esri.urlToObject = function(/*String*/ url) {
  //summary: Returns an object representation of the argument url string
  // url: String: URL in the format of http://path?query
  // returns: { path:String, query:{ key:value } }: Object representing url as path string & query object
  var iq = url.indexOf("?");
  if (iq === -1) {
    return { path:url, query:null }; //{}
  }
  else {
    return { path:url.substring(0, iq), query:dojo.queryToObject(url.substring(iq + 1)) };
  }
};

esri._getProxyUrl = function(isSecureResource) {
  var proxyUrl = esri.config.defaults.io.proxyUrl,
      retVal, fixed, hasFix;
  
  if (!proxyUrl) {
    console.log(esri.bundle.io.proxyNotSet);
    throw new Error(esri.bundle.io.proxyNotSet);
  }
  
  if (isSecureResource && window.location.href.toLowerCase().indexOf("https:") !== 0) {
    fixed = proxyUrl;
    
    if (fixed.toLowerCase().indexOf("http") !== 0) { // is relative url?
      fixed = esri._getAbsoluteUrl(fixed);
    }
    
    fixed = fixed.replace(/^http:/i, "https:");
    
    if (esri._canDoXOXHR(fixed)) {
      proxyUrl = fixed;
      hasFix = 1;
    }
  }
  
  retVal = esri.urlToObject(proxyUrl);
  retVal._xo = hasFix;
  
  return retVal;
};

esri._getProxiedUrl = function(/*String*/ url) {
  if (esri.config.defaults.io.alwaysUseProxy) {
    var proxyUrl = esri._getProxyUrl(),
        _url = esri.urlToObject(url);
    url = proxyUrl.path + "?" + _url.path;
    var params = dojo.objectToQuery(dojo.mixin(proxyUrl.query || {}, _url.query));
    if (params) {
      url += ("?" + params);
    }
  }
  
  return url;
};

esri._hasSameOrigin = function(url1, url2, ignoreProtocol) {
  // Returns:
  //   true - if the given urls have the same origin as defined here:
  //          https://developer.mozilla.org/en/Same_origin_policy_for_JavaScript
  //   false - otherwise
  
  // Tests:
  /*
  console.log("1. " + (esri._hasSameOrigin("http://abc.com", "http://abc.com") === true));
  console.log("2. " + (esri._hasSameOrigin("http://abc.com:9090", "http://abc.com:9090") === true));
  console.log("3. " + (esri._hasSameOrigin("https://abc.com", "https://abc.com") === true));
  console.log("4. " + (esri._hasSameOrigin("https://abc.com:9090", "https://abc.com:9090") === true));
  console.log("5. " + (esri._hasSameOrigin("http://abc.com/", "http://abc.com") === true));
  console.log("6. " + (esri._hasSameOrigin("http://abc.com/res", "http://abc.com/res2/res3") === true));
  console.log("7. " + (esri._hasSameOrigin("http://abc.com:9090/res", "http://abc.com:9090/res2/res3") === true));

  console.log("8. " + (esri._hasSameOrigin("http://abc.com", "http://xyz.com") === false));
  console.log("9. " + (esri._hasSameOrigin("http://abc.com", "http://abc.com:9090") === false));
  console.log("10. " + (esri._hasSameOrigin("http://abc.com", "https://abc.com") === false));
  console.log("11. " + (esri._hasSameOrigin("http://abc.com", "https://abc.com:9090") === false));
  console.log("12. " + (esri._hasSameOrigin("http://abc.com", "https://xyz.com:9090") === false));

  console.log("13. " + (esri._hasSameOrigin("http://abc.com", "https://abc.com", true) === true));
  console.log("14. " + (esri._hasSameOrigin("http://abc.com:9090", "https://abc.com:9090", true) === true));
  console.log("15. " + (esri._hasSameOrigin("http://xyz.com:9090", "https://xyz.com:9090", true) === true));
  
  // The following tests assume the app is hosted on "http://pponnusamy.esri.com"
  console.log("16. " + (esri._hasSameOrigin("http://pponnusamy.esri.com:9090", "/app.html") === true));
  console.log("17. " + (esri._hasSameOrigin("https://pponnusamy.esri.com:9090", "app.html") === false));
  console.log("18. " + (esri._hasSameOrigin("http://pponnusamy.esri.com:9090", "./app.html") === true));
  console.log("19. " + (esri._hasSameOrigin("https://pponnusamy.esri.com:9090", "../app.html") === false));
  
  console.log("20. " + (esri._hasSameOrigin("app.html", "/app.html") === true));
  console.log("21. " + (esri._hasSameOrigin("./app.html", "app.html") === true));
  console.log("22. " + (esri._hasSameOrigin("../app.html", "./app.html") === true));
  console.log("23. " + (esri._hasSameOrigin("/app.html", "../app.html") === true));
  
  console.log("24. " + (esri._hasSameOrigin("/app.html", "https://pponnusamy.esri.com:9090") === false));
  console.log("25. " + (esri._hasSameOrigin("app.html", "http://pponnusamy.esri.com:9090") === true));
  console.log("26. " + (esri._hasSameOrigin("./app.html", "https://pponnusamy.esri.com:9090") === false));
  console.log("27. " + (esri._hasSameOrigin("../app.html", "http://pponnusamy.esri.com:9090") === true));

  console.log("28. " + (esri._hasSameOrigin("app.html", "http://abc.com") === false));
  console.log("29. " + (esri._hasSameOrigin("./app.html", "http://xyz.com:9090") === false));
  */
 
  url1 = url1.toLowerCase();
  url2 = url2.toLowerCase();
  
  var appUrl = window.location.href.toLowerCase();
  
  url1 = url1.indexOf("http") === 0 ? // is absolute url?
           new dojo._Url(url1) : 
           (appUrl = new dojo._Url(appUrl)); // relative urls have the same authority as the application

  url2 = url2.indexOf("http") === 0 ? 
           new dojo._Url(url2) : 
           (dojo.isString(appUrl) ? new dojo._Url(appUrl) : appUrl);
  
  return (
    (ignoreProtocol || (url1.scheme === url2.scheme)) && 
    url1.host === url2.host && 
    url1.port === url2.port
  );
};

esri._canDoXOXHR = function(url, returnIndex) {
  // Returns:
  //   true - if the library can make cross-origin XHR request to the
  //          given url
  //   false - otherwise
  
  // Tests:
  /*
  esri._hasCors = true;
  
  var corsServers = [
    "http://abc.com",
    "https://xyz.com",
    "http://klm.com:9090",
    "https://ijk.com:8080",
    "asdf.net",
    "asdf.net:6080"
  ];
  
  var V_TRUE = true, ALWAYS_TRUE = true, V_FALSE = false;
  
  function test_print(actual, expected) {
    if (actual === expected) {
      console.log("true");
    }
    else {
      console.info("false");
    }
  }
  
  function test_run(num) {
    console.log("(" + num + "): hasCors: " + esri._hasCors + ", #servers: " + (esri.config.defaults.io.corsEnabledServers ? esri.config.defaults.io.corsEnabledServers.length : 0) + ", #builtins: " + (esri.config.defaults.io.corsEnabledPortalServers ? esri.config.defaults.io.corsEnabledPortalServers.length : 0));
    
    test_print(esri._canDoXOXHR("http://abc.com"), V_TRUE);
    test_print(esri._canDoXOXHR("http://abc.com/res1/res2/"), V_TRUE);
    test_print(esri._canDoXOXHR("http://abc.com:99"), V_FALSE);
    test_print(esri._canDoXOXHR("https://abc.com"), V_FALSE);
    test_print(esri._canDoXOXHR("https://abc.com:99"), V_FALSE);

    test_print(esri._canDoXOXHR("https://xyz.com"), V_TRUE);
    test_print(esri._canDoXOXHR("https://xyz.com/res1/res2/"), V_TRUE);
    test_print(esri._canDoXOXHR("https://xyz.com:99"), V_FALSE);
    test_print(esri._canDoXOXHR("http://xyz.com"), V_FALSE);
    test_print(esri._canDoXOXHR("http://xyz.com:99"), V_FALSE);
  
    test_print(esri._canDoXOXHR("http://klm.com:9090"), V_TRUE);
    test_print(esri._canDoXOXHR("http://klm.com:9090/res1/res2/"), V_TRUE);
    test_print(esri._canDoXOXHR("http://klm.com"), V_FALSE);
    test_print(esri._canDoXOXHR("http://klm.com:88"), V_FALSE);
    test_print(esri._canDoXOXHR("https://klm.com"), V_FALSE);
    test_print(esri._canDoXOXHR("https://klm.com:9090"), V_FALSE);
    test_print(esri._canDoXOXHR("https://klm.com:88"), V_FALSE);

    test_print(esri._canDoXOXHR("https://ijk.com:8080"), V_TRUE);
    test_print(esri._canDoXOXHR("https://ijk.com:8080/res1/res2/"), V_TRUE);
    test_print(esri._canDoXOXHR("https://ijk.com"), V_FALSE);
    test_print(esri._canDoXOXHR("https://ijk.com:88"), V_FALSE);
    test_print(esri._canDoXOXHR("http://ijk.com"), V_FALSE);
    test_print(esri._canDoXOXHR("http://ijk.com:8080"), V_FALSE);
    test_print(esri._canDoXOXHR("http://ijk.com:88"), V_FALSE);
    
    test_print(esri._canDoXOXHR("http://asdf.net"), V_TRUE);
    test_print(esri._canDoXOXHR("http://asdf.net/res1/res2/"), V_TRUE);
    test_print(esri._canDoXOXHR("https://asdf.net"), V_TRUE);
    test_print(esri._canDoXOXHR("http://asdf.net:99"), V_FALSE);
    test_print(esri._canDoXOXHR("https://asdf.net:99"), V_FALSE);
    
    test_print(esri._canDoXOXHR("http://asdf.net:6080"), V_TRUE);
    test_print(esri._canDoXOXHR("http://asdf.net:6080/res1/res2/"), V_TRUE);
    test_print(esri._canDoXOXHR("https://asdf.net:6080"), V_TRUE);
    
    test_print(esri._canDoXOXHR("http://www.arcgis.com"), esri._hasCors && ALWAYS_TRUE);
    test_print(esri._canDoXOXHR("http://www.arcgis.com/sharing/"), esri._hasCors && ALWAYS_TRUE);
    test_print(esri._canDoXOXHR("https://www.arcgis.com"), esri._hasCors && ALWAYS_TRUE);
    test_print(esri._canDoXOXHR("http://tiles.arcgis.com"), esri._hasCors && ALWAYS_TRUE);
    test_print(esri._canDoXOXHR("https://services.arcgis.com/sharing/"), esri._hasCors && ALWAYS_TRUE);
  }
  
  var saved = esri.config.defaults.io.corsEnabledServers;
  
  esri.config.defaults.io.corsEnabledServers = saved.concat(corsServers);
  test_run(1);
  
  esri._hasCors = false;
  V_TRUE = false;
  test_run(2);
  
  esri._hasCors = false;
  esri.config.defaults.io.corsEnabledServers = saved;
  V_TRUE = false;
  test_run(3);
  
  esri._hasCors = true;
  esri.config.defaults.io.corsEnabledServers = saved;
  V_TRUE = false;
  test_run(4);
  
  esri._hasCors = true;
  esri.config.defaults.io.corsEnabledServers = null;
  V_TRUE = false;
  ALWAYS_TRUE = false;
  test_run(5);
  */
  
  var canDo = false, hasSameOrigin = esri._hasSameOrigin,
      servers = esri.config.defaults.io.corsEnabledServers,
      //builtin = esri.config.defaults.io.corsEnabledPortalServers,
      sansProtocol, found = -1;
  
  //servers = (servers && builtin) ? servers.concat(builtin) : (servers || builtin);
  
  if (esri._hasCors && servers && servers.length) {
    canDo = dojo.some(servers, function(server, idx) {
      sansProtocol = (dojo.trim(server).toLowerCase().indexOf("http") !== 0);
      
      if (hasSameOrigin(url, sansProtocol ? ("http://" + server) : server) || 
         (sansProtocol && hasSameOrigin(url, "https://" + server))) {
        found = idx;
        return true;
      }
      
      return false;
    });
  }
  
  return returnIndex ? found : canDo;
};

esri.request = function(req, options) {
  var dfd, form = req.form,
      isMultipart = form && dojo.some(form.elements, function(el) { return el.type === "file"; }),
      hasToken = (
                  req.url.toLowerCase().indexOf("token=") !== -1 || 
                  (req.content && req.content.token) ||
                  (isMultipart && dojo.some(form.elements, function(el) { return el.name === "token"; }))
                 ) ? 1 : 0;

  // Let's kick off CORS detection now. "this" request will not be able to
  // use the result of detection as the detection process is asynchronous.
  // However subsequent requests to the same server have better chance of 
  // seeing/using the result.
  esri._detectCors(req.url);
  
  // TODO
  // Note that neither "this" request nor any subsequent request will wait
  // for the detection process to complete. Should we do this in the future?
  // Pro: CORS enabled servers will never ever see a JSONP request from JSAPI
  // Con: Is the detection process fast enough and reliable enough to justify
  //      low latency for the first request?
  
  // initialization stuff
  if (req._usrDfd) {
    dfd = req._usrDfd;
  }
  else {
    dfd = new dojo.Deferred(esri._dfdCanceller);
    
    dfd.addBoth(function(response) {
      // This will notify the caller about SSL requirement, and let it use
      // HTTPS for any further requests so that we don't keep bumping into
      // "403 - ssl required" error - 
      // for example: feature layer query requests
      // See Layer._useSSL and _Task._useSSL

      if ( 
        response && 
        // Catch XML Document response in IE
        // nodeType cannot be 0 (http://www.w3.org/TR/REC-DOM-Level-1/level-one-core.html)
        (!dojo.isIE || !response.nodeType) 
      ) {
        response._ssl = req._ssl;
      }
      
      // TODO
      // What is the strategy to return _ssl to the caller for non-json
      // response?
  
      // TODO
      // We need a formal way to return "credential" and "ssl" to the caller
      // We don't have the proper API today (in Dojo) to return a response
      // that contains data + credential + ssl + etc. However future IO
      // enhancement in Dojo would allow this - see here:
      // http://livedocs.dojotoolkit.org/dojo/request
    });
   
    // setup this dfd to invoke caller's "load" and
    // "error" functions as the first order of business
    // Based on pattern in dojo._ioSetArgs (xhr.js)
    var ld = req.load, errFunc = req.error;
    if (ld) {
      dfd.addCallback(function(value) {
        var realDfd = dfd._pendingDfd,
            ioArgs = realDfd && realDfd.ioArgs,
            args = ioArgs && ioArgs.args;
        return ld.call(args, value, ioArgs);
      });
    }
     
    if (errFunc) {
      dfd.addErrback(function(value) {
        var realDfd = dfd._pendingDfd,
            ioArgs = realDfd && realDfd.ioArgs,
            args = ioArgs && ioArgs.args;
        return errFunc.call(args, value, ioArgs);
      });
    }
    
    // TODO
    // What about caller's "handle" function?
  }
  
  // Does IdentityManager have a Credential for this Service? 
  var noLookup = options && options.disableIdentityLookup;
  if (esri.id 
      && !hasToken && !req._token 
      && !esri.id._isPublic(req.url) 
      && !noLookup
      //&& esri.id.findServerInfo(req.url)
  ) {
    // We're only looking for already acquired credential, if any
    var credential = esri.id.findCredential(req.url);

    if (credential) {
      //console.log("found existing credential = ", credential);
      req._token = credential.token;
      req._ssl = credential.ssl;
    }
    
    /*dfd._pendingDfd = esri.id.getCredential(req.url);
    dfd._pendingDfd
      .addCallback(function(credential) {
        req._token = credential.token;
        req._usrDfd = dfd;
        esri.request(req, options);
      })
      .addErrback(function(error) {
        req._usrDfd = null;
        dfd.errback(error);
        dfd._pendingDfd = null;
      });*/
  }
  
  //else {
    dfd._pendingDfd = esri._request(req, options, isMultipart);
    
    if (!dfd._pendingDfd) {
      dfd.ioArgs = dfd._pendingDfd && dfd._pendingDfd.ioArgs;
      var err = new Error("Deferred object is missing");
      err.log = dojo.config.isDebug; // see Deferred.js:reject for context
      req._usrDfd = null;
      dfd.errback(err);
      dfd._pendingDfd = null;
      return dfd;
    }
    
    dfd._pendingDfd
      .addCallback(function(response) {
        // dfd.ioArgs is being accessed here: arcgis/utils.js, BasemapGallery, FeatureLayer
        // Let's pass it out to the caller
        dfd.ioArgs = dfd._pendingDfd && dfd._pendingDfd.ioArgs;
        
        req._usrDfd = null;
        dfd.callback(response);
        dfd._pendingDfd = null;
      })
      .addErrback(function(error) {
        // Check for SSL required error
        if (
          error && error.code == 403 && 
          
          // We need to differentiate based on "message", because 403
          // can be returned for "you do not have permissions" case as well 
          error.message && 
          error.message.toLowerCase().indexOf("ssl") > -1 &&
          error.message.toLowerCase().indexOf("permission") === -1 
          // covers the case where arcgis server includes "folderName/serviceName"
          // in a "403: do not have permissions" error and folder or service name
          // contains "ssl" in it.
        ) {
          //console.log("ssl = ", req._ssl);
          
          if (!req._ssl) { // prevent infinite loop, obviously something is wrong - let the error bubble up to the caller
            // Flag for esri._request to fix the protocol
            req._ssl = req._sslFromServer = true;
            
            // "_sslFromServer" is a pristine property that is not affected
            // by whatever credential is tried out for this resource

            req._usrDfd = dfd;
            esri.request(req, options);
            return;
          }
        }
        else if (error && error.status == 415) {
          // Java SDS strangely supports CORS for rest/info and rest/services
          // but not for other resources like services and layers. Let's 
          // disable CORS for such servers.
          
          //console.log("CORS ERR: ", error);
          var found = esri._disableCors(req.url);

          if (!req._err415) {
            // Indicates that we've handled 415 error once. Subsequest 415 error
            // for the "same" request (different transport) should be considered an
            // error
            req._err415 = 1; 
            
            req._usrDfd = dfd;
            esri.request(req, options);
            return;
          }
        }
        // Check for "unauthorized access" error
        else if (esri.id 
            && dojo.indexOf(esri.id._errorCodes, error.code) !== -1 
            && !esri.id._isPublic(req.url)
            && !noLookup
            // TODO
            // Treat "subscription disabled" as error
        ) {
          // We're testing error."code" which is typically returned by
          // arcgis server or arcgis.com. So I think it is safe to assume
          // that we'll enter this block for urls that idmgr knows how to handle
          
          dfd._pendingDfd = esri.id.getCredential(req.url, {
            token: req._token,
            error: error
          });
          dfd._pendingDfd
            .addCallback(function(credential) {
              req._token = credential.token;
              req._usrDfd = dfd;
              
              // More weight to the fact that this request may already insist on
              // using SSL. Scenario:
              //  - Resource requires SSL
              //  - This credential is valid but for another user that does not 
              //    require SSL
              //  We don't want to lose the fact that resource still requires SSL
              req._ssl = req._sslFromServer || credential.ssl;
              // Note that it's very likely that this credential will not work
              // for this request if credential.ssl differs from req._ssl.
              // Note that credential.ssl is currently returned only by arcgis.com
              // token service and by federated arcgis server token service
              
              esri.request(req, options);
            })
            .addErrback(function(error) {
              req._usrDfd = null;
              dfd.errback(error);
              dfd._pendingDfd = null;
            });
          return;
        }

        dfd.ioArgs = dfd._pendingDfd && dfd._pendingDfd.ioArgs;
        req._usrDfd = null;
        dfd.errback(error);
        dfd._pendingDfd = null;
      });
  //}
  
  return dfd;
};

esri._request = function(/*Object*/ req, /*Object?*/ options, /*Boolean?*/ isMultipart) {
  // pre-process options
  var useProxy = false, usePost = false;
  if (esri._isDefined(options)) {
    if (dojo.isObject(options)) {
      useProxy = !!options.useProxy;
      usePost = !!options.usePost;
    }
    else { // backward compatibility
      useProxy = !!options;
    }
  }
  
  req = dojo.mixin({}, req);
  
  if (req._ssl) {
    // Fix the protocol before making the request
    req.url = req.url.replace(/^http:/i, "https:");
    
    // TODO
    // What about the port number for HTTPS protocol?
    // Port number could be different for ArcGIS Server where a web
    // adaptor is not configured
    // For example: at 10.1, HTTP runs on 6080 and HTTPS on 6443 by default
  }
  
  var content = req.content,
      path = req.url,
      form = isMultipart && req.form,
      cfgIO = esri.config.defaults.io;

  // Intercept and check for REST error
  req.load = function(response) {
    //esri._detectCors(dojo.getObject("args.url", false, ioArgs));
    
    var err;
    if (response) {
      if (response.error) {
        err = dojo.mixin(new Error(), response.error);
        err.log = dojo.config.isDebug; // see Deferred.js:reject for context
      }
      else if (response.status === "error") { // arcgis server admin resource
        err = dojo.mixin(new Error(), {
          code: response.code,
          message: response.messages && response.messages.join && response.messages.join(".")
        });
        err.log = dojo.config.isDebug; // see Deferred.js:reject for context
      }
    }
    
    return err || response;
  };
  
  // Intercept and create proper JS Error object
  req.error = function(error, io) {
    if (io && io.xhr) {
      io.xhr.abort();
    }

    if (!(error instanceof Error)) {
      error = dojo.mixin(new Error(), error);
    }
    
    error.log = dojo.config.isDebug; // see Deferred.js:reject for context
    
    cfgIO.errorHandler(error, io);
    return error;
  };
 
  if (req._token) {
    req.content = req.content || {};
    req.content.token = req._token;
  }

  // get the length of URL string
  var len = 0;
  if (content && path) {
    len = dojo.objectToQuery(content).length + path.length + 1;
  }

  req.timeout = esri._isDefined(req.timeout) ? req.timeout : cfgIO.timeout;
  req.handleAs = req.handleAs || "json";

  // send the request
  try {
    var proxyUrl, proxyPath,
        sentinel = esri._reqPreCallback, 
        canDoXo = esri._canDoXOXHR(req.url) && !(/https?:\/\/[^\/]+\/[^\/]+\/admin\/?(\/.*)?$/i.test(req.url)),
        sameOrigin = (esri._hasSameOrigin(req.url, window.location.href) || canDoXo),
        doPost = (usePost || isMultipart || len > cfgIO.postLength) ? true : false,
        doJSONP = (!sameOrigin && req.handleAs.indexOf("json") !== -1 && req.callbackParamName && !isMultipart) ? true : false,
        // TODO
        // Override alwaysUseProxy and useProxy for sameOrigin requests?
        doProxy = (
                    cfgIO.alwaysUseProxy || useProxy || 
                    ((!doJSONP || doPost) && !sameOrigin) 
                  ) ? true : false; 
    
    /*if (!doJSONP && request.handleAs.indexOf("json") !== -1) {
      console.log("esri.request: if the service you're trying to call supports JSONP response format, then you need to set 'callbackParamName' option in the request. Consult the service documentation to find out this callback parameter name.");
    }*/
    
    if (isMultipart && !esri._hasFileUpload && !doProxy && canDoXo) {
      // CORS does not help make iframe.send. Iframe technique inherently
      // requires strict same-origin condition
      doProxy = true;
    }
    
    if (doProxy) {
      proxyUrl = esri._getProxyUrl(dojo.trim(path).toLowerCase().indexOf("https:") === 0);
      proxyPath = proxyUrl.path;
      
      // We need to use HTTPS endpoint for the proxy if the resource 
      // being accessed has HTTPS endpoint
      //proxyPath = esri._fixProxyProtocol(proxyPath, path);
      
      if (proxyUrl._xo) {
        canDoXo = true;
      }
      
      // Make sure we dont have to post 
      if (!doPost && (proxyPath.length + 1 + len) > cfgIO.postLength) {
        doPost = true;
      }

      // Modify the request object as necessary
      //request = dojo.mixin({}, request);
      req.url = proxyPath + "?" + path;
      
      if (doPost) {
        req.content = dojo.mixin(proxyUrl.query || {}, content);
      }
      else {
        var kvString = dojo.objectToQuery(dojo.mixin(proxyUrl.query || {}, content));
        if (kvString) {
          req.url += ("?" + kvString);
        }
        
        req.content = null;
      }
    }
    
    if (doJSONP && !doPost) { // using dynamic SCRIPT tag
      // Background info:
      // Servery seems to be slow responding to some queries at certain times 
      // and as a result queries sent after this slow request are blocked on 
      // the client. Server returned the response to these blocked queries but 
      // they are not processed(jsonp script execution) by Firefox until the 
      // slow request has either succeeded or timed out. This has to do with 
      // how Firefox handles script tags. This issue has been fixed at 
      // Firefox 3.6 (via an async attribute to script tags)  
      // Chrome, Safari and IE exhibit async=true by default
      // References:
      // http://trac.dojotoolkit.org/ticket/11953
      // https://developer.mozilla.org/En/HTML/Element/Script
      // http://stackoverflow.com/questions/2804212/dynamic-script-addition-should-be-ordered
      // http://blogs.msdn.com/b/kristoffer/archive/2006/12/22/loading-javascript-files-in-parallel.aspx
      // http://code.google.com/p/jquery-jsonp/issues/detail?id=20
      // http://tagneto.blogspot.com/2010/01/script-async-raindrop-and-firefox-36.html
      if (!esri._isDefined(req.isAsync) && dojo.isFF < 4) {
        // Default is true for FF 3.6 if the caller did not set it
        req.isAsync = true;
      }

      //console.log("++++++++++++++++[ dojo.io.script.get ]");
      return dojo.io.script.get(sentinel ? sentinel(req) : req);
    }
    else {
      // Background info: http://trac.dojotoolkit.org/ticket/9486
      var hdrs = req.headers;
      if (canDoXo && (!hdrs || !hdrs.hasOwnProperty("X-Requested-With"))) {
        hdrs = req.headers = (hdrs || {});
        // Prevent unnecessary preflighted CORS request
        hdrs["X-Requested-With"] = null;
      }
      
      // Make form modifications for multipart requests
      if (isMultipart) {
        var paramName = req.callbackParamName || "callback.html", 
            elementName = req.callbackElementName || "textarea",
            param, found, paramValue, i, il = form.elements.length, el;
        
        // Copy content over to the form
        content = req.content;
        if (content) {
          for (param in content) {
            paramValue = content[param];
            
            if (esri._isDefined(paramValue)) {
              found = null;
              
              for (i = 0; i < il; i++) {
                el = form.elements[i];
                if (el.name === param) {
                  found = el;
                  break;
                }
              }
              
              /*dojo.some(form.elements, function(el) {
                if (el.name === param) {
                  found = el;
                  return true;
                }
                return false;
              });*/
              
              if (found) {
                found.value = paramValue;
              }
              else {
                form.appendChild( dojo.create("input", { type: "hidden", name: param, value: paramValue }) );
              }
            }
          }
        }
        
        if (esri._hasFileUpload) {
          //console.log("[req FormData]");
          
          // Remove "callback.html" if present in the form, because
          // we're going to process the response as normal JSON
          dojo.forEach(form.elements, function(el) {
            if (el.name === paramName) {
              //console.log("Removed callback.html element from the form");
              form.removeChild(el);
            }
          });
          
          // This usage of contentType is available after backporting a 
          // Dojo 1.7 patch to Dojo 1.6.1.
          // See: dojo/_base/xhr.js - dojo.xhr
          // http://trac.dojotoolkit.org/changeset/25326/dojo
          req.contentType = false;
          req.postData = new FormData(form);
          delete req.form;
        }
        else {
          //console.log("[req IFrame]");
          
          form.enctype = "multipart/form-data";
          if (dojo.isIE < 9) {
            // In IE, dynamically setting the value of "enctype" attribute
            // does not seem to take effect
            form.encoding = "multipart/form-data";
          }
          form.method = "post";
          
          // Add "callback.html" if not already in the form
          if ( !dojo.some(form.elements, function(el) { return el.name === paramName; }) ) {
            form.appendChild( dojo.create("input", { type: "hidden", name: paramName, value: elementName }) );
          }
    
          // A version of arcgis server before 10.1 (.net or java) would fail without
          // callback.html parameter in the URL for add and update attachment operations
          if (path.toLowerCase().indexOf("addattachment") !== -1 || path.toLowerCase().indexOf("updateattachment") !== -1) {
            req.url = path + ((path.indexOf("?") === -1) ? "?" : "&") + paramName + "=" + elementName;
            if (doProxy) {
              req.url = proxyPath + "?" + req.url;
            }
            //console.log("fixed: " + req.url);
          }
          
          // iframe typically supports content object. However IE 7 (IE 8 in IE 7 standards mode)
          // throws an error related to element focus if this is not deleted here.
          // Could be something to do with iframe impl deleting form elements that it
          // adds from content object
          delete req.content;
        }
      }
      
      req = sentinel ? sentinel(req) : req;
          
      // TODO
      // Connect xhr download and upload progress events for
      // xhr get and post
      
      if (doPost) {
        if (isMultipart && !esri._hasFileUpload) {
          //console.log("++++++++++++++++[ dojo.io.iframe.send ]");
          return dojo.io.iframe.send(req);
        }
        else {
          //console.log("++++++++++++++++[ dojo.rawXhrPost ]");
          return dojo.rawXhrPost(req);
        }
      }
      else {
        //console.log("++++++++++++++++[ dojo.xhrGet ]");
        return dojo.xhrGet(req);
      }
    }
  }
  catch (e) {
    var dfd = new dojo.Deferred();
    dfd.errback(req.error(e));
    return dfd;
  }
};

esri._disableCors = function(url) {
  //console.log("esri._disableCors: ", url);
  
  var ioConfig = esri.config.defaults.io,
      processed = ioConfig._processedCorsServers,
      origin = new dojo._Url(url), found = -1;
      
  origin = (origin.host + (origin.port ? (":" + origin.port) : "")).toLowerCase();
  found = esri._canDoXOXHR(url, true);

  if (found > -1) {
    //console.log("index: ", found);
    ioConfig.corsEnabledServers.splice(found, 1);
  }
  
  processed[origin] = 1;
  
  return found;
};

esri._detectCors = function(url) {
  // I know we don't want to get used to the habit of using try-catch
  // programming, but esri.request is a core part of the API.
  // We don't want unexpected(*) error in the code below to affect
  // normal response processing workflow (not to mention what we're doing
  // below is an optimization - not a critical functionality)
  // Note: the term "unexpected" means the developer overlooked something

  var ioConfig = esri.config.defaults.io,
      processed = ioConfig._processedCorsServers;
  
  if (!ioConfig.corsDetection) {
    return;
  }
  
  try {
    var origin = new dojo._Url(url);
    origin = (origin.host + (origin.port ? (":" + origin.port) : "")).toLowerCase();
    
    if (
      // Browser support
      esri._hasCors &&
      
      // ServerInfo is available since version 10.0, but token service has
      // issues prior to 10 SP1
      //this.version >= 10.01 && 
      
      // Interested in ArcGIS REST resources only
      (url && url.toLowerCase().indexOf("/rest/services") !== -1) &&
      
      // AND server not already known to support CORS
      (!esri._hasSameOrigin(url, window.location.href) && !esri._canDoXOXHR(url)) &&
      
      // AND NOT already processed
      !processed[origin]
    ) {
      //console.log("***************** esri._detectCors *********** ]", url);
      //console.log("***************** [fetching server info] **************** ", origin);
      processed[origin] = -1;
      
      // TODO
      // Can we use fetch "rest/services" instead of "rest/info"? This will allow
      // 9.3 servers to get in the action.
      // How reliable and fast is "rest/services" resource?
      
      // If we use esri.request, it will use proxy to get the response.
      // We don't want that - because we want to find out if cross-origin
      // XHR works. So let's use dojo.xhrGet directly.
      dojo.xhrGet({
        url: url.substring(0, url.toLowerCase().indexOf("/rest/") + "/rest/".length) + "info",
        content: { f: "json" },
        handleAs: "json",
        headers: { "X-Requested-With": null }
        
      }).then(
        function(response) {
          //console.log("REST Info response: ", arguments);

          if (response) {
            processed[origin] = 2;
            
            // Add this server to corsEnabledServers list
            if (!esri._canDoXOXHR(url)) {
              ioConfig.corsEnabledServers.push(origin);
            }

            // Yes - response.error is also considered as confirmation for
            // CORS support
          }
          else {
            // Indicates no support for CORS on this server. Older servers
            // that don't support ServerInfo will follow this path.
            // Dojo returns null in this case.
            processed[origin] = 1;
          }
        },
        
        function(error) {
          //console.error("REST Info FAILED: ", error);
          
          // Mark this server so that we don't make info request again
          processed[origin] = 1;
        }
      );
    }
  }
  catch (e) {
    console.log("esri._detectCors: an unknown error occurred while detecting CORS support");
  }
};

/*
 * Related info and discussion:
 * http://o.dojotoolkit.org/forum/dojo-core-dojo-0-9/dojo-core-support/ajax-send-callback
 * http://trac.dojotoolkit.org/ticket/5882
 * http://api.jquery.com/jQuery.ajax/#options
 */
esri.setRequestPreCallback = function(callback) {
  esri._reqPreCallback = callback;
};

esri._getParts = function(arr, obj, cb) {
	return [ 
		dojo.isString(arr) ? arr.split("") : arr, 
		obj || dojo.global,
		// FIXME: cache the anonymous functions we create here?
		dojo.isString(cb) ? new Function("item", "index", "array", cb) : cb
	];
};

esri.filter = function(arr, callback, thisObject) {
  var _p = esri._getParts(arr, thisObject, callback), outArr = {}, i;
  arr = _p[0];

  for (i in arr) {
    if (_p[2].call(_p[i], arr[i], i, arr)) {
      outArr[i] = arr[i];
    }
  }

  return outArr; // Array
};

esri.TileUtils = (function() {
  function getClosestLodInfo(map, ti, extent) {
//    var tw = ti.width,
//        th = ti.height,

    var wd = map.width, // / tw, //widthRatio
        ht = map.height, // / th, //heightRatio

        ew = extent.xmax - extent.xmin, //extentW
        eh = extent.ymax - extent.ymin, //extentH

        ed = -1, //extentDiff
        lods = ti.lods,
        i, il = lods.length,
        abs = Math.abs,
        lod, cl, ced; //currLod, currExtentDiff

    for (i=0; i<il; i++) {
      cl = lods[i];
      ced = ew > eh ? abs( eh - (ht * cl.resolution) ) : abs( ew - (wd * cl.resolution) );
      if (ed < 0 || ced <= ed) {
        lod = cl;
        ed = ced;
      }
      else {
        break;
      }
    }
    return lod;
  }
  
  function getAdjustedExtent(map, extent, lod) {
    var res = lod.resolution, //resolution
        cx = (extent.xmin + extent.xmax) / 2, //centerX
        cy = (extent.ymin + extent.ymax) / 2, //centerY
        w2res = (map.width / 2) * res,
        h2res = (map.height / 2) * res;

    return new esri.geometry.Extent(cx-(w2res), cy-(h2res), cx+(w2res), cy+(h2res), extent.spatialReference);
  }
  
  function getContainingTile(map, ti, point, lod) {
    var res = lod.resolution,
        tw = ti.width, //tileWidth
        th = ti.height, //tileHeight
        to = ti.origin, //tileOrigin
        mv = map.__visibleDelta,
        floor = Math.floor,

        tmw = tw * res, //tileMapWidth
        tmh = th * res, //tileMapHeight
        tr = floor( (to.y - point.y) / tmh ), //tileRow
        tc = floor( (point.x - to.x) / tmw ), //tileCol
        tmox = to.x + (tc * tmw), //tileMapOriginX
        tmoy = to.y - (tr * tmh), //tileMapOriginY
        oX = floor( Math.abs( (point.x - tmox) * tw / tmw ) ) + mv.x, //offsetX
        oY = floor( Math.abs( (point.y - tmoy) * th / tmh ) ) + mv.y; //offsetY

    return { point:point, coords:{ row:tr, col:tc }, offsets:{ x:oX, y:oY } };
  }
  
  return {
    _addFrameInfo: function(tileInfo, srInfo) {
      // NOTE
      // This method will augment tileInfo.lods with
      // frame info. If you don't want that you should
      // pass in a cloned tileInfo
      
      var pixelsCoveringWorld, numTiles, 
          world = 2 * srInfo.origin[1], m180 = srInfo.origin[0],
          originX = tileInfo.origin.x, tileWidth = tileInfo.width,
          m180Col;
      
      dojo.forEach(tileInfo.lods, function(lod){
        pixelsCoveringWorld = Math.round(world / lod.resolution);
        numTiles = Math.ceil(pixelsCoveringWorld / tileWidth);
        m180Col = Math.floor( (m180 - originX) / (tileWidth * lod.resolution) );
        
        if (!lod._frameInfo) {
          lod._frameInfo = [ 
            /* #tiles */ numTiles, 
            /* -180 */ m180Col, 
            /* +180 */ m180Col + numTiles - 1, 
            /* pixels per world */ pixelsCoveringWorld // used in _coremap.js:_getFrameWidth
          ];
          //console.log(lod.level, ": ", lod._frameInfo);
        }
      });
    },
    
    getContainingTileCoords: function(ti, point, lod) {
      var to = ti.origin,
          res = lod.resolution,
          tmw = ti.width * res, //tileMapWidth
          tmh = ti.height * res, //tileMapHeight
          tc = Math.floor((point.x - to.x) / tmw), //tileColumn
          tr = Math.floor((to.y - point.y) / tmh); //tileRow
      return { row:tr, col:tc };
    },

    getCandidateTileInfo: function(map, ti, extent) {
      var lod = getClosestLodInfo(map, ti, extent),
          adj = getAdjustedExtent(map, extent, lod), //adjustedExtent
          ct = getContainingTile(map, ti, new esri.geometry.Point(adj.xmin, adj.ymax, extent.spatialReference), lod); //containingTile
      return { tile:ct, lod:lod, extent:adj };
    },

    getTileExtent: function(ti, level, row, col) {
      // console.log(map + ", " + ti ", " level + ", " + row + ", " + col);
      var to = ti.origin,
          lod = ti.lods[level],
          res = lod.resolution,
          // sr = lod.startTileRow,
          // sc = lod.startTileCol,
          tw = ti.width,
          th = ti.height;

      return new esri.geometry.Extent(
        ((col * res) * tw) + to.x,
        to.y - ((row + 1) * res) * th,
        (((col + 1) * res) * tw) + to.x,
        to.y - ((row * res) * th),
        ti.spatialReference
      );
    }
  };
}());

esri.graphicsExtent = function(/*esri.Graphic[]*/ graphics) {
  var g = graphics[0].geometry,
      fullExt = g.getExtent(),
      ext, i, il = graphics.length;
      
  if (fullExt === null) {
    fullExt = new esri.geometry.Extent(g.x, g.y, g.x, g.y, g.spatialReference);
  }

  for (i=1; i<il; i++) {
    ext = (g = graphics[i].geometry).getExtent();
    if (ext === null) {
      ext = new esri.geometry.Extent(g.x, g.y, g.x, g.y, g.spatialReference);
    }

    fullExt = fullExt.union(ext);
  }

  if (fullExt.getWidth() <= 0 && fullExt.getHeight() <= 0) {
    return null;
  }
  
  return fullExt;
};

esri.getGeometries = function(/*esri.Graphic[]*/ graphics) {
  return dojo.map(graphics, function(graphic) {
    return graphic.geometry;
  });
};

esri._encodeGraphics = function(/*esri.Graphic[]*/ graphics, normalized) {
  var encoded = [], json, enc, norm;
  dojo.forEach(graphics, function(g, i) {
    json = g.toJson();
    enc = {};
    if (json.geometry) {
      norm = normalized && normalized[i];
      enc.geometry = norm && norm.toJson() || json.geometry;
    }
    if (json.attributes) {
      enc.attributes = json.attributes;
    }
    encoded[i] = enc;
  });
  return encoded;
};

esri._serializeLayerDefinitions = function(/*String[] (sparse array)*/ layerDefinitions) {
  // Test cases
  /*
   var result = _serializeLayerDefinitions();
   console.log(result === null, result);
  
   var result = _serializeLayerDefinitions(null);
   console.log(result === null, result);
  
   var result = _serializeLayerDefinitions([]);
   console.log(result === null, result);

   var definitions = [];
   definitions[0] = "abc = 100";
   definitions[5] = "def LIKE '%test%'";
   var result = _serializeLayerDefinitions(definitions);
   console.log(result === "0:abc = 100;5:def LIKE '%test%'", result);

   var definitions = [];
   definitions[0] = "abc = 100";
   definitions[5] = "def LIKE '%te:st%'";
   var result = _serializeLayerDefinitions(definitions);
   console.log(result === '{"0":"abc = 100","5":"def LIKE \'%te:st%\'"}', result);

   var definitions = [];
   definitions[0] = "abc = 100";
   definitions[5] = "def LIKE '%te;st%'";
   var result = _serializeLayerDefinitions(definitions);
   console.log(result === '{"0":"abc = 100","5":"def LIKE \'%te;st%\'"}', result);

   var definitions = [];
   definitions[0] = "abc:xyz = 100";
   definitions[5] = "def LIKE '%te;st%'";
   var result = _serializeLayerDefinitions(definitions);
   console.log(result === '{"0":"abc:xyz = 100","5":"def LIKE \'%te;st%\'"}', result);
  */
  
  var defs = [], hasSpecialChars = false, re = /[:;]/;
  
  if (layerDefinitions) {
    dojo.forEach(layerDefinitions, function(defn, i) {
      if (defn) {
        defs.push([ i, defn ]);
        
        if (!hasSpecialChars && re.test(defn)) {
          hasSpecialChars = true;
        }
      } // if defn
    }); // forEach
  
    if (defs.length > 0) {
      var retVal;
      
      if (hasSpecialChars) { // 9.4 format
        retVal = {};
        dojo.forEach(defs, function(defn) {
          retVal[defn[0]] = defn[1];
        });
        retVal = dojo.toJson(retVal);
      }
      else { // old format
        retVal = [];
        dojo.forEach(defs, function(defn) {
          retVal.push(defn[0] + ":" + defn[1]);
        });
        retVal = retVal.join(";");
      }
      
      return retVal;
    } // if defs.length
    
  } // if layerDefinitions
  
  return null;
};

esri._serializeTimeOptions = function(layerTimeOptions, ids) {
  if (!layerTimeOptions) {
    return;
  }
  
  var retVal = [];
  
  dojo.forEach(layerTimeOptions, function(option, i) {
    // It's going to be a sparse array. So we got to
    // make sure the element is not empty
    if (option) {
      var json = option.toJson();
      if (ids && dojo.indexOf(ids, i) !== -1) {
        json.useTime = false;
      }
      retVal.push("\"" + i + "\":" + dojo.toJson(json));
    }
  });
  
  if (retVal.length) {
    return "{" + retVal.join(",") + "}";
  }
};

esri._isDefined = function(value) {
  return (value !== undefined) && (value !== null);
};

esri._sanitize = function(obj, recursive) {
  // Helper method to remove properties with undefined value.
  // Notes:
  // - This should happen in dojo.toJson. It cannot allow an
  //   invalid json value like undefined. See http://json.org
  // - Does not recurse
  var prop;
  
  if (recursive) {
    for (prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        if (obj[prop] === undefined || obj[prop] === null) {
          delete obj[prop];
        }
        else if (obj[prop] instanceof Object) {
          esri._sanitize(obj[prop], true);
        }
      }
    }
  }
  else {
    for (prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        if (obj[prop] === undefined) {
          delete obj[prop];
        }
      }
    } // for
  }
  return obj;
};

/***************************************************
 * Routines to manage deferreds and method wrappers
 **************************************************/

esri._dfdCanceller = function(dfd) {
  dfd.canceled = true;
  
  var pending = dfd._pendingDfd;
  if (dfd.fired === -1 && pending && pending.fired === -1) { // both "dfd" and "pending" are not fired yet
    //console.log("Cancelling... ", pending.ioArgs);
    pending.cancel();
    // In our arch, by the time "cancel" returns
    // "dfd" would have been deemed finished because
    // "pending"s rejection is wired to reject "dfd"
  }
  dfd._pendingDfd = null;
};

esri._fixDfd = function(dfd) {
  // Use this method only if your deferred supports
  // more than one result arguments for its callback
  
  // Refer to dojo/_base/Deferred.js::notify() for context
  // before reading this function
  
  // TODO
  // Are there better/alternative solutions?
  
  var saved = dfd.then;
  
  // Patch "then"
  dfd.then = function(resolvedCallback, b, c) {
    if (resolvedCallback) {
      var resolved = resolvedCallback;
      
      // Patch "resolved callback"
      resolvedCallback = function(result) {
        if (result && result._argsArray) {
          return resolved.apply(null, result);
        }
        return resolved(result);
      };
    }
    
    return saved.call(this, resolvedCallback, b, c);
  };
  
  return dfd;
};

esri._resDfd = function(dfd, /*Anything[]*/ args, isError) {
  var count = args.length;
  
  if (count === 1) {
    if (isError) {
      dfd.errback(args[0]);
    }
    else {
      dfd.callback(args[0]);
    }
  }
  else if (count > 1) {
    // NOTE
    // See esri._fixDfd for context
    args._argsArray = true;
    dfd.callback(args);
  }
  else {
    dfd.callback();
  }
};

// TODO
// Will this routine be available at any time a module is
// loaded?
// May need to be hosted in esri.js
esri._createWrappers = function(className) {
  var classProto = dojo.getObject(className + ".prototype");

  /**
   * Spec for the method signature:
   * {
   *   n: <String>,
   *      // Name of the method being wrapped
   *   
   *   c: <Number>,
   *      // Number of arguments supported by the method before
   *      // normalization came into play.
   *   
   *      // List of arguments or properties of arguments that
   *      // need to be normalized
   *   a: [
   *    {
   *      i: <Number>,
   *         // Index of this argument in the method signature
   *      
   *      p: <String[]>
   *         // If this argument is an object that may contain
   *         // properties that need to be normalized, indicate
   *         // such properties here. OPTIONAL.
   *    }
   *   ],
   *   
   *   e: <Number>,
   *      // Index of the argument that is an error callback
   *   
   *   f: <Number>
   *      // Specify 1 if the deferred object should be fixed
   *      // to support multiple callback arguments
   * }
   */  
  dojo.forEach(classProto.__msigns, function(sig) {
    //console.log("Patching: ", className + ".prototype." + sig.n);
    var methodProto = classProto[sig.n];
    
    // Define wrapper
    // methodInfo and methodProto will be available within 
    // this wrapper via closure
    // Test multiple consecutive invocations of the wrapped
    // method -- seems to be doing okay
    classProto[sig.n] = function() {
      var self = this, inArgs = [], i,
          outDfd = new dojo.Deferred(esri._dfdCanceller);
      
      if (sig.f) {
        esri._fixDfd(outDfd);
      }
      
      // Pre-process input arguments
      for (i = 0; i < sig.c; i++) {
        inArgs[i] = arguments[i];
      }
      
      // Make sure the wrapped method is aware that
      // "context" is passed as the last argument
      var context = { dfd: outDfd };
      inArgs.push(context);
      
      var components, toBeNormalized = [], intermediateDfd;

      if (self.normalization && !self._isTable) { // normalize if not a feature layer "table"
        components = esri._disassemble(inArgs, sig.a);
        
        dojo.forEach(components, function(comp) {
          toBeNormalized = toBeNormalized.concat(comp.value);
        });
        
        //intermediateDfd = esri._fakeNormalize(toBeNormalized.length ? toBeNormalized : null); 
        
        if (toBeNormalized.length) {
          var sr = toBeNormalized[0].spatialReference;
          if (sr && sr._isWrappable()) {
            intermediateDfd = esri.geometry.normalizeCentralMeridian(toBeNormalized, esri.config.defaults.geometryService);
          }
        }
      }
      
      // Check if normalize routine is initiated
      if (intermediateDfd) {
        // Register proper callbacks to be called when we
        // have normalize results
        //console.log("Normalizing...");
        outDfd._pendingDfd = intermediateDfd;
        
        intermediateDfd.addCallbacks(
          function(normalized) {
            //console.log("Normalized: ", normalized);
            if (outDfd.canceled) {
              return;
            }
           
            context.assembly = esri._reassemble(normalized, components);
            //console.log("Assembly: ", context.assembly);

            // We need to invoke the actual method now that we have
            // the normalized geometry
            outDfd._pendingDfd = methodProto.apply(self, inArgs);
          }, 
          function(err) {
            var className = self.declaredClass;
            if (className && className.indexOf("FeatureLayer") !== -1) {
              // See FeatureLayer.js
              self._resolve([err], null, inArgs[sig.e], outDfd, true);
            }
            else { // tasks have _errorHandler
              // See _task.js
              self._errorHandler(err, inArgs[sig.e], outDfd);
            }
          }
        );
      }
      else {
        //console.log("Normalizing not happening...");
        
        // We're not normalizing, just execute the query 
        outDfd._pendingDfd = methodProto.apply(self, inArgs);
      }
      
      // Caller can add its callbacks and error callbacks to
      // this deferred
      return outDfd;
    };
    
  }); // methods
  
};

esri._disassemble = function(inArgs, argInfos) {
  // This method will look into the input arguments
  // or their individual properties, find values as 
  // specified by argInfos and put them in an array.
  
  // TODO
  // Add test cases
  
  var bucket = [];
  
  // Look for geometry(s) in the input arguments
  // and push them into a bucket to be normalized
  // Disassembly: arguments broken down
  dojo.forEach(argInfos, function(argInfo) {
    var argIndex = argInfo.i,
        arg = inArgs[argIndex], 
        properties = argInfo.p, prop;
    
    // We want to look for geometry(s) only
    if (!dojo.isObject(arg) || !arg) {
      return;
    }
    
    if (properties) { // argument has property(s) that need to be normalized
      if (properties[0] === "*") { 
        // UNKNOWN parameters. GP FeatureSet parameters
        for (prop in arg) {
          if (arg.hasOwnProperty(prop)) {
            esri._addToBucket(arg[prop], bucket, argIndex, prop);
          }
        }
      }
      else {
        dojo.forEach(properties, function(prop) {
          esri._addToBucket(dojo.getObject(prop, false, arg) /*arg[prop]*/, bucket, argIndex, prop);
        });
      }
    }
    else { // argument itself needs to be normalized
      esri._addToBucket(arg, bucket, argIndex);
    }    
  });
  
  return bucket;
};

esri._addToBucket = function(value, bucket, argIndex, property) {
  // TODO
  // Add test cases
  var flag = false, className;
  
  if (dojo.isObject(value) && value) {
    if (dojo.isArray(value)) {
      if (value.length) {
        className = value[0] && value[0].declaredClass;
        if (className && className.indexOf("Graphic") !== -1) {
          // Array of Graphics. Extract Geometries
          value = dojo.map(value, function(feature) {
            return feature.geometry;
          });
          value = dojo.filter(value, esri._isDefined);
          flag = value.length ? true : false;
        }
        else if (className && className.indexOf("esri.geometry.") !== -1) {
          // Array of Geometries
          flag = true;
        }
      }
    }
    else {
      className = value.declaredClass;
      if (className && className.indexOf("FeatureSet") !== -1) {
        // Array of Graphics. Extract Geometries
        value = dojo.map(value.features || [], function(feature) {
          return feature.geometry;
        });
        value = dojo.filter(value, esri._isDefined);
        flag = value.length ? true : false;
      }
      else if (className && className.indexOf("esri.geometry.") !== -1) {
        // Geometry
        flag = true;
      }
      //flag = true;
    }
  }
  
  if (flag) {
    bucket.push({
      index: argIndex,
      property: property, // optional
      value: value // can be a single geometry or array of geometries
    });
  }
};

esri._reassemble = function(normalized, components) {
  var idx = 0, assembly = {};
  
  dojo.forEach(components, function(comp) {
    var index = comp.index,
        property = comp.property,
        value = comp.value,
        len = value.length || 1;
    
    var result = normalized.slice(idx, idx + len);
    if (!dojo.isArray(value)) {
      result = result[0];
    }
    
    idx += len;
    delete comp.value;
    
    if (property) {
      assembly[index] = assembly[index] || {};
      assembly[index][property] = result;
    }
    else {
      assembly[index] = result;
    }
  });
  
  return assembly;
};

/*esri._fakeNormalize = function(values) {
  if (values && values.length) {
    var dfd = new dojo.Deferred();
    
    setTimeout(function() {
      var normalized = [];
      for (var i = 0; i < values.length; i++) {
        //normalized[i] = { x: i };
        normalized[i] = esri.geometry.fromJson(values[i].toJson());
        normalized[i].x *= 10;
        normalized[i].y *= 10;
      }
      dfd.callback(normalized);
    }, 1000);
    
    return dfd;
  }
};*/

esri.setScrollable = function(node) {
  var previousX = 0, previousY = 0, sWidth = 0, sHeight = 0, cWidth = 0, cHeight = 0;
  
  return [
    dojo.connect(node, "ontouchstart", function(evt) {
      previousX = evt.touches[0].screenX;
      previousY = evt.touches[0].screenY;
      
      sWidth = node.scrollWidth;
      sHeight = node.scrollHeight;
      cWidth = node.clientWidth;
      cHeight = node.clientHeight;
    }),
    
    dojo.connect(node, "ontouchmove", function(evt) {
      // Prevent page from scrolling
      evt.preventDefault();
      
      var child = node.firstChild; 
      if (child instanceof Text) {
        child = node.childNodes[1];
      }    
      var currentX = child._currentX || 0,
          currentY = child._currentY || 0;
          
      currentX += (evt.touches[0].screenX - previousX);
      if (currentX > 0) {
        currentX = 0;
      }
      else if (currentX < 0 && (Math.abs(currentX) + cWidth) > sWidth) {
        currentX = -1 * (sWidth - cWidth);
      }
      child._currentX = currentX;

      currentY += (evt.touches[0].screenY - previousY);
      if (currentY > 0) {
        currentY = 0;
      }
      else if (currentY < 0 && (Math.abs(currentY) + cHeight) > sHeight) {
        currentY = -1 * (sHeight - cHeight);
      }
      child._currentY = currentY;
      
      dojo.style(child, {
        "-webkit-transition-property": "-webkit-transform",
        "-webkit-transform": "translate(" + currentX + "px, " + currentY + "px)"
      });
      
      previousX = evt.touches[0].screenX;
      previousY = evt.touches[0].screenY;
    })
  ];
};

esri._getAbsoluteUrl = function (url) {
  if (dojo.isString(url) && url.indexOf("http://") === -1 && url.indexOf("https://") === -1) {
    if (url.indexOf("//") === 0) {
      return window.location.protocol + url;
    }
    else if (url.indexOf("/") === 0) {
      return window.location.protocol + "//" + window.location.host + url;
    } else {          
      return esri._appBaseUrl + url;
    }
  }
  return url;
};
//test cases for the method _getAbsoluteUrl
//call the method in a page, such as http://myserver.com/hello/app.html
//esri._getAbsoluteUrl("http://myserver.com/hello/world.jpg"); it should return "http://myserver.com/hello/world.jpg"
//esri._getAbsoluteUrl("//myserver.com/hello/world.jpg"); it should return "http://myserver.com/hello/world.jpg"
//esri._getAbsoluteUrl("/hey/world.jpg"); it should return "http://myserver.com/hey/world.jpg"
//esri._getAbsoluteUrl("../world.jpg"); it should return "http://myserver.com/world.jpg"
//esri._getAbsoluteUrl("./world.jpg"); it should return "http://myserver.com/hello/world.jpg"
//esri._getAbsoluteUrl("world.jpg"); it should return "http://myserver.com/hello/world.jpg"
//Additionally, it should pass different window.location senario.
//http://myserver.com/
//http://myserver.com/myapp    note: browser will always resolve this as http://myserver.com/myapp/
//http://myserver.com/myapp/   
//http://myserver.com/myapp/test.html
//http://myserver.com/myapp/test.html?f=1&g=2
//http://myserver.com/myapp/test.html?f=/1&g=/?2

esri._getDefaultVisibleLayers = function (infos) {
  //tests:
  //use http://nil:6080/arcgis/rest/services/usa_sde_dynamic/MapServer as an example. The layerInfos is:
  /*[{
        "id":0,
        "name":"USA",
        "parentLayerId":-1,
        "defaultVisibility":true,
        "subLayerIds":[1,
            3,
            4,
            5,
            6,
            7
        ],
        "minScale":0,
        "maxScale":0,
        "declaredClass":"esri.layers.LayerInfo"
    },
    {
        "id":1,
        "name":"countiesAnno",
        "parentLayerId":0,
        "defaultVisibility":false,
        "subLayerIds":[2
        ],
        "minScale":0,
        "maxScale":0,
        "declaredClass":"esri.layers.LayerInfo"
    },
    {
        "id":2,
        "name":"Default",
        "parentLayerId":1,
        "defaultVisibility":true,
        "subLayerIds":null,
        "minScale":0,
        "maxScale":0,
        "declaredClass":"esri.layers.LayerInfo"
    },
    {
        "id":3,
        "name":"wind",
        "parentLayerId":0,
        "defaultVisibility":true,
        "subLayerIds":null,
        "minScale":0,
        "maxScale":0,
        "declaredClass":"esri.layers.LayerInfo"
    },
    {
        "id":4,
        "name":"ushigh",
        "parentLayerId":0,
        "defaultVisibility":true,
        "subLayerIds":null,
        "minScale":0,
        "maxScale":0,
        "declaredClass":"esri.layers.LayerInfo"
    },
    {
        "id":5,
        "name":"counties",
        "parentLayerId":0,
        "defaultVisibility":false,
        "subLayerIds":null,
        "minScale":0,
        "maxScale":0,
        "declaredClass":"esri.layers.LayerInfo"
    },
    {
        "id":6,
        "name":"states",
        "parentLayerId":0,
        "defaultVisibility":true,
        "subLayerIds":null,
        "minScale":0,
        "maxScale":0,
        "declaredClass":"esri.layers.LayerInfo"
    },
    {
        "id":7,
        "name":"sde.SDE.usacatalog",
        "parentLayerId":0,
        "defaultVisibility":true,
        "subLayerIds":null,
        "minScale":0,
        "maxScale":0,
        "declaredClass":"esri.layers.LayerInfo"
    }
  ]*/
  //esri._getDefaultVisibleLayers(layerInfos) === [0, 3, 4, 6, 7];
  var result = [], i;
  if (!infos) {
    return result;
  }
  for (i = 0; i < infos.length; i++) {
    if (infos[i].parentLayerId >= 0 && dojo.indexOf(result, infos[i].parentLayerId) === -1) {
      // layer is not visible if it's parent is not visible
      continue;
    }
    if (infos[i].defaultVisibility) {
      result.push(infos[i].id);
    }
  }
  return result;
};

esri._getLayersForScale = function (scale, infos) {
  //tests:
  //use http://servicesbeta4.esri.com/arcgis/rest/services/Census/MapServer as test sample.
  /*  var map;
      function init() {
        map = new esri.Map("map");
        var usaLayer = new esri.layers.ArcGISDynamicMapServiceLayer("http://servicesbeta4.esri.com/arcgis/rest/services/Census/MapServer");
        map.addLayer(usaLayer);
        dojo.connect(usaLayer, "onLoad", function(layer){
          console.log(esri._getLayerForScale(esri.geometry.getScale(map), layer.layerInfos);
        });
      }
  */
  //When zooming in/out, the results should be different. For example,
  //when mapScale == 73957190.94894394, the result is [2,3,5];
  //when mapScale == 577790.5542889987, the result is [1,2,4,5];
  //when mapScale == 36111.9096430061, the result is [0,1,2,4,5];
  var result = [];
  if (scale > 0 && infos) {
    var i;
    for (i = 0; i < infos.length; i++) {
      if (infos[i].parentLayerId >= 0 && dojo.indexOf(result, infos[i].parentLayerId) === -1) {
        // layer is not in scale range if it's parent is not in scale range
        continue;
      }
      if (infos[i].id >= 0) {
        var isInScaleRange = true,
          maxScale = infos[i].maxScale,
          minScale = infos[i].minScale;
        if (maxScale > 0 || minScale > 0) {
          if (maxScale > 0 && minScale > 0) {
            isInScaleRange = maxScale <= scale && scale <= minScale;
          } else if (maxScale > 0) {
            isInScaleRange = maxScale <= scale;
          } else if (minScale > 0) {
            isInScaleRange = scale <= minScale;
          }
        }
        if (isInScaleRange) {
          result.push(infos[i].id);
        }
      }
    }
  }
  return result;
};    
});
