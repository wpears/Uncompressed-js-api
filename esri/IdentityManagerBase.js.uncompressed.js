//>>built
// wrapped by build app
define("esri/IdentityManagerBase", ["dijit","dojo","dojox","dojo/require!dojo/cookie,esri/utils"], function(dijit,dojo,dojox){
dojo.provide("esri.IdentityManagerBase");

dojo.require("dojo.cookie");
dojo.require("esri.utils");


// TODO
// Test in IE
// IE 6, 7 bug: http://trac.dojotoolkit.org/ticket/13493
// Test esri.request with "proxy?url" urls

// TODO
// Token service bugs:
// Returns error.code: 200 for invalid username/password
// Doesnt seem to honor "expiration" for requests without clientid

// References
// http://superuser.com/questions/104146/add-permanent-ssl-certificate-exception-in-chrome-linux
// http://superuser.com/questions/27268/how-do-i-disable-the-warning-chrome-gives-if-a-security-certificate-is-not-truste
// http://code.google.com/p/chromium/issues/detail?id=9252


(function() { // module anonymous
  
// Holds username and password
var keyring = {};

// This function is truly private to prevent someone from replacing it with 
// an implementation that always returns true and thereby allowing a malicious 
// arcgis server to claim federation with arcgis.com
var verifyFederation = function(owningSystemUrl, sinfo) {
  //console.log("verifyFederation: ", owningSystemUrl, sinfo.server);    

  var owningSystem = new dojo._Url(owningSystemUrl).host,
      server = new dojo._Url(sinfo.server).host,
      regex = /.+\.arcgis\.com$/i;
      
  return (regex.test(owningSystem) && regex.test(server));
};


/***************************
 * esri.IdentityManagerBase
 ***************************/

dojo.declare("esri.IdentityManagerBase", null, {
  constructor: function() {
    // NOTE
    // See esri/arcgisonline/config.js
    this._portalConfig = dojo.getObject("esriGeowConfig");
    
    /*var restBaseUrl = dojo.getObject("esriGeowConfig.restBaseUrl");
    if (restBaseUrl) {
      this._portalDomains.push( (new dojo._Url(restBaseUrl)).authority );
    }*/
  },
  
  // TODO
  // Should we handle two gis server instances hosted on the same origin?
  // Example: dexter2k8/gis/rest/services, dexter2k8/arcgis/rest/services
  serverInfos: [], // will have one entry per unique origin
  
  credentials: [], // will have one entry per userId-server combination
  tokenValidity: 60, // minutes
  signInPage: null,
  
  _busy: null,
  _soReqs: [],
  _xoReqs: [],
  
  //_agsTokenUrl: "/ArcGIS/tokens",
  //_gwRoot: "/sharing/",
  //_gwDomain: "arcgis.com",

  _gwTokenUrl: "/sharing/generateToken",
  _agsRest: "/rest/services", // "/arcgis/rest",
  _agsAdmin: /https?:\/\/[^\/]+\/[^\/]+\/admin\/?(\/.*)?$/i,
  _agolSuffix: ".arcgis.com",
  
  _gwDomains: [
    { 
      regex: /https?:\/\/www\.arcgis\.com/i, 
      tokenServiceUrl: "https://www.arcgis.com/sharing/generateToken"
    },
    { 
      regex: /https?:\/\/dev\.arcgis\.com/i, 
      tokenServiceUrl: "https://dev.arcgis.com/sharing/generateToken"
    },
    { 
      //regex: /https?:\/\/.*dev.*\.arcgis\.com/i, 
      regex: /https?:\/\/.*dev[^.]*\.arcgis\.com/i, 
      tokenServiceUrl: "https://devext.arcgis.com/sharing/generateToken"
    },
    { 
      //regex: /https?:\/\/.*qa.*\.arcgis\.com/i, 
      regex: /https?:\/\/.*qa[^.]*\.arcgis\.com/i, 
      tokenServiceUrl: "https://qaext.arcgis.com/sharing/generateToken"
    },
    {
      regex: /https?:\/\/.*.arcgis\.com/i,
      tokenServiceUrl: "https://www.arcgis.com/sharing/generateToken"
    }
  ],
  
  /*_portalDomains: [
    "arcgis.com"
  ],*/
  
  _regexSDirUrl: /http.+\/rest\/services\/?/ig, // /http.+\/arcgis\/rest\/services\/?/ig,
  _regexServerType: /(\/(MapServer|GeocodeServer|GPServer|GeometryServer|ImageServer|NAServer|FeatureServer|GeoDataServer|GlobeServer|MobileServer)).*/ig,
  
  _gwUser: /http.+\/users\/([^\/]+)\/?.*/i,
  _gwItem: /http.+\/items\/([^\/]+)\/?.*/i,
  _gwGroup: /http.+\/groups\/([^\/]+)\/?.*/i,

  // arcgis server returns 499 (>= 10.01) or 498 (< 10.01) when accessing resources without token
  // geowarehouse api returns 403 when accessing resources without token
  // SDS seems to return 401 when accessing resources without/invalid token
  _errorCodes: [ 499, 498, 403, 401 ],
  
  _publicUrls: [
    /\/arcgis\/tokens/i,
    /\/sharing\/generatetoken/i,
    /\/rest\/info/i
  ],
  
  registerServers: function(/*ServerInfo[]*/ serverInfos) {
    var infos = this.serverInfos;
    
    if (infos) {
      serverInfos = dojo.filter(serverInfos, function(info) {
        return !this.findServerInfo(info.server);
      }, this);
      
      this.serverInfos = infos.concat(serverInfos);
    }
    else {
      this.serverInfos = serverInfos;
    }
  },
  
  toJson: function() {
    return esri._sanitize({
      "serverInfos": dojo.map(this.serverInfos, function(sinfo) {
        return sinfo.toJson();
      }),
      
      "credentials": dojo.map(this.credentials, function(crd) {
        return crd.toJson();
      })
    });
  },
  
  initialize: function(json) {
    // "json": returned by toJson method. See above.
    
    // Together, "toJson" and "initialize" can be used to serialize, persist and 
    // restore the state of id manager
    
    if (!json) {
      return; 
    }
    
    // convert json string to json object
    if (dojo.isString(json)) {
      json = dojo.fromJson(json);
    }
    
    // Process and add server-infos and credentials
    // - ignore serverInfos without token service url
    // - ignore credentials with expired token
    var serverInfos = json.serverInfos, credentials = json.credentials;
    
    if (serverInfos) {
      var infos = [];
      
      dojo.forEach(serverInfos, function(sinfo) {
        if (sinfo.server && sinfo.tokenServiceUrl) {
          infos.push(sinfo.declaredClass ? sinfo : new esri.ServerInfo(sinfo));
        }
        // All credentials should have a valid corresponding serverInfo,
        // so it should be safe to ignore invalid server-infos without any
        // consequences since there won't be any credentials for them.
      });
      
      if (infos.length) {
        this.registerServers(infos);
      }
    }
    
    if (credentials) {
      dojo.forEach(credentials, function(crd) {
        if ( crd.userId && crd.server && crd.token && crd.expires && (crd.expires > (new Date()).getTime()) ) {
          crd = crd.declaredClass ? crd : new esri.Credential(crd);
          crd.onTokenChange();

          this.credentials.push(crd);
        }
        
        // Based on the conditional above, we're ignoring credentials created from
        // arcgis.com cookie. It's okay because any future access to an arcgis.com
        // resource will go through a code path that looks into the esri_auth
        // cookie. If the cookie is still valid and hence available, we'd use it -
        // if not, we'd redirect.
      }, this);
    }
  },
  
  findServerInfo: function(/*String*/ resUrl) {
    var retVal;
    
    resUrl = this._sanitizeUrl(resUrl);
    
    dojo.some(this.serverInfos, function(info) {
      if (esri._hasSameOrigin(info.server, resUrl, true)) {
        retVal = info;
        //return true;
      }
      
      return !!retVal;
    });
    
    return retVal;
  },
  
  findCredential: function(/*String*/ resUrl, /*String, Optional*/ userId) {
    var retVal;
    
    resUrl = this._sanitizeUrl(resUrl);
    
    if (userId) {
      dojo.some(this.credentials, function(crd) {
        if (esri._hasSameOrigin(resUrl, crd.server, true) && userId === crd.userId) {
          retVal = crd;
          //return true;
        }
        
        return !!retVal;
      }, this);
    }
    else {
      dojo.some(this.credentials, function(crd) {
        if (esri._hasSameOrigin(resUrl, crd.server, true) && this._getIdenticalSvcIdx(resUrl, crd) !== -1) {
          retVal = crd;
          /*if (this._getIdenticalSvcIdx(resUrl, crd) !== -1) {
            return true;
          }*/
        }
        
        return !!retVal;
      }, this);
    }
    
    return retVal;
  },
  
  getCredential: function(/*String*/ resUrl, /*Boolean(deprecated) -or- Object (optional)*/ options) {
    var retry;
    
    if (esri._isDefined(options)) {
      if (dojo.isObject(options)) {
        retry = !!options.token;
      }
      else { // Boolean (before 3.0)
        retry = options;
      }
    }
    
    resUrl = this._sanitizeUrl(resUrl);

    var dfd = new dojo.Deferred(esri._dfdCanceller), err,
        isAdmin = this._isAdminResource(resUrl),
        esri_auth = (retry && this._doPortalSignIn(resUrl)) ? dojo.cookie("esri_auth") : null;
    
    if (esri_auth) {
      esri_auth = dojo.fromJson(esri_auth);
      
      err = new Error("You are currently signed in as: '" + esri_auth.email + "'. You do not have access to this resource: " + resUrl);
      err.code = "IdentityManagerBase." + 1;
      err.log = dojo.config.isDebug;
      dfd.errback(err);
      return dfd;
    }
    
    var match = this._findCredential(resUrl, options);
    
    // TODO
    // Check if the token has expired. If so, refresh before 
    // returning the "match" to the caller. We should not create 
    // a new credential here as consumers of this credential expect
    // it to be refreshed not "replaced"
    
    if (match) {
      dfd.callback(match);
      return dfd;
    }
    
    var serverInfo = this.findServerInfo(resUrl);
    
    // Make sure we have server-info before proceeding any further
    if (!serverInfo) {
      // guess token service endpoint
      var tokenSvcUrl = this._getTokenSvcUrl(resUrl);
      
      if (!tokenSvcUrl) {
        err = new Error("Unknown resource - could not find token service endpoint.");
        err.code = "IdentityManagerBase." + 2;
        err.log = dojo.config.isDebug; // see Deferred.js:reject for context
        dfd.errback(err);
        return dfd;
      }
        
      // create and register ServerInfo
      serverInfo = new esri.ServerInfo();
      serverInfo.server = this._getOrigin(resUrl);
      
      if (dojo.isString(tokenSvcUrl)) {
        serverInfo.tokenServiceUrl = tokenSvcUrl;
      }
      else {
        serverInfo._restInfoDfd = tokenSvcUrl;
      }
      
      this.registerServers([ serverInfo ]);
    }
    
    /*dfd.resUrl_ = resUrl;
    dfd.sinfo_ = serverInfo;

    if (this._busy) {
      if (esri._hasSameOrigin(resUrl, this._busy.resUrl_, true)) {
        this._soReqs.push(dfd);
      }
      else {
        this._xoReqs.push(dfd);
      }
    }
    else {
      // Get to work!
      this._doSignIn(dfd);
    }*/
   
    return this._enqueue(resUrl, serverInfo, options, dfd, isAdmin);
  },

  getResourceName: function(resUrl) {
    /*
     // Tests:
     console.log("servicesbeta");
     console.log("1. " + (esri.id.getResourceName("https://servicesbeta.esri.com/ArcGIS/rest/services/SanJuan/Trails/MapServer") === "SanJuan/Trails"));
     console.log("2. " + (esri.id.getResourceName("https://servicesbeta.esri.com/ArcGIS/rest/services/SanJuan/Trails/MapServer/1") === "SanJuan/Trails"));
     console.log("3. " + (esri.id.getResourceName("https://servicesbeta.esri.com/ArcGIS/rest/services/SanJuan/Trails/MapServer/1/query") === "SanJuan/Trails"));
     console.log("4. " + (esri.id.getResourceName("https://servicesbeta.esri.com/ArcGIS/rest/services/USA/MapServer") === "USA"));
     console.log("5. " + (esri.id.getResourceName("https://servicesbeta.esri.com/ArcGIS/rest/services") === ""));
     
     console.log("premium.arcgisonline");
     console.log("1. " + (esri.id.getResourceName("https://premium.arcgisonline.com/Server/rest/services/World_Imagery/MapServer") === "World_Imagery"));
     console.log("2. " + (esri.id.getResourceName("https://premium.arcgisonline.com/Server/rest/services/World_Imagery/MapServer/0") === "World_Imagery"));
     console.log("3. " + (esri.id.getResourceName("https://premium.arcgisonline.com/Server/rest/services/World_Imagery/MapServer/0/query") === "World_Imagery"));
     console.log("4. " + (esri.id.getResourceName("https://premium.arcgisonline.com/Server/rest/services/Reference/World_Transportation/MapServer/0") === "Reference/World_Transportation"));
     console.log("5. " + (esri.id.getResourceName("https://premium.arcgisonline.com/Server/rest/services") === ""));
     
     console.log("hosted services");
     console.log("1. " + (esri.id.getResourceName("https://servicesdev.arcgis.com/f7ee40282cbc40998572834591021976/arcgis/rest/services/cities_States/FeatureServer/0") === "cities_States"));
     console.log("1. " + (esri.id.getResourceName("https://arcgis.com/f7ee40282cbc40998572834591021976/arcgis/rest/services/cities_States/FeatureServer/0") === "cities_States"));
     
     console.log("misc server");
     console.log("1. " + (esri.id.getResourceName("https://servicesbeta.esri.com/ArcGIS/rest/services/SanJuan/Trails/MapServer?f=json&dpi=96&transparent=true&format=png8&callback=dojo.io.script.jsonp_dojoIoScript2._jsonpCallback") === "SanJuan/Trails"));
     console.log("2. " + (esri.id.getResourceName("http://10.113.11.36:8080/rest/services/st/MapServer") === "st"));
     console.log("3. " + (esri.id.getResourceName("http://10.113.11.36:8080/rest/services") === ""));
     console.log("4. " + (esri.id.getResourceName("http://etat.geneve.ch/ags1/rest/services/Apiculture/MapServer") === "Apiculture"));

     console.log("arcgis.com items");
     console.log("1. " + (esri.id.getResourceName("") === ""));
    */

    if (this._isRESTService(resUrl)) {
      // arcgis server resource
      return resUrl.replace(this._regexSDirUrl, "").replace(this._regexServerType, "")
             || "";
    }
    else {
      // Assumed geowarehouse resource. Since username is easily identifiable
      // we'll give it the highest priority
      return (this._gwUser.test(resUrl) && resUrl.replace(this._gwUser, "$1")) 
             || (this._gwItem.test(resUrl) && resUrl.replace(this._gwItem, "$1"))
             || (this._gwGroup.test(resUrl) && resUrl.replace(this._gwGroup, "$1"))
             || "";
    }
  },
  
  generateToken: function(serverInfo, userInfo, options) {
    var isAdmin = options && options.isAdmin;
    
    // This request will work for servers 10.0 SP 1 and later versions
    var generate = esri.request({
      url: isAdmin ? serverInfo.adminTokenServiceUrl : serverInfo.tokenServiceUrl,
      
      content: {
        request: "getToken",
        username: userInfo.username,
        password: userInfo.password,
        
        // TODO
        // Looks like the arcgis server token service always uses the 
        // configured expiration setting for short-lived tokens.
        // Doesn't seem to honor this parameter
        // What about agol token service?
        expiration: esri.id.tokenValidity,
        
        // Token service of ArcGIS Online Sharing API requires some sort of
        // client identifier: http://dev.arcgisonline.com/apidocs/sharing/index.html?generatetoken.html
        referer: (isAdmin || serverInfo.tokenServiceUrl.toLowerCase().indexOf("/sharing/generatetoken") !== -1) ? window.location.href : null,
        // TODO
        // Make sure all our proxies forward HTTP Referer header
        
        client: isAdmin ? "referer" : null,
        
        f: "json"
      },
      handleAs: "json"
    }, { 
      usePost: true, 
      disableIdentityLookup: true,
      // TODO
      // CORS is not supported by token service at 10.1
      // Update version check below if token service is not fixed at 10.1 SP1
      useProxy: this._useProxy(serverInfo, options)
    });
    
    generate.addCallback(function(response) {
      // request.error wrapper function in esri.request is not
      // returning error object. We've got to handle this case here.
      // However, note that error handler passed in the request object
      // for esri.request will still be called. But since the error
      // wrapper does not return the error object deferred's errbacks
      // are not called. Fix esri.request but watch out for regressions 
      /*if (response.error) {
        return dojo.mixin(new Error(), response.error);
      }*/
     
      // TODO
      // The following block of code could potentially handle server
      // versions 10.0 and above if "handleAs" is set to "text"
      /*if (response) {
        if (dojo.isString(response)) {
          try {
            var json = dojo.fromJson(response);
            if (json && json.token) {
              response = json;
            }
          }
          catch(e) {
            console.error("Caught error: ", e);
            response = {
              token: response
            };
          }
        }
      }*/
     
      if (!response || !response.token) {
        var err = new Error("Unable to generate token");
        err.code = "IdentityManagerBase." + 3;
        err.log = dojo.config.isDebug;
        return err;
      }
      
      //console.log("token generation complete: ", dojo.toJson(response));
      
      // Store credentials in keyring for later use
      var server = serverInfo.server;
      if (!keyring[server]) {
        keyring[server] = {};
      }
      
      // TODO
      // Don't store pwd in plain text.
      keyring[server][userInfo.username] = userInfo.password;
      
      return response;
    });
    
    generate.addErrback(function(error) {
      //console.log("token generation failed: ", error.code, error.message);
    });
    
    return generate;
  },
  
  /*setPortalDomain: function(domain) {
    this._portalDomain = domain;
  },*/
 
  isBusy: function() {
    return !!this._busy;
  },
  
  setRedirectionHandler: function(handlerFunc) {
    this._redirectFunc = handlerFunc;
  },
  
  setProtocolErrorHandler: function(handlerFunc) {
    this._protocolFunc = handlerFunc;
    // return true from your handler if you want to proceed anyway
    // with the mismatch
  },
  
  signIn: function() {
    /**
     * To be implemented by sub-classes
     * Arguments:
     *      <String> resUrl 
     *  <ServerInfo> serverInfo
     *     <Object>  options?
     */
  },
  
  /*******************
   * Internal Members
   *******************/
  
  _findCredential: function(resUrl, options) {
    var idx = -1, 
        lastToken = options && options.token,
    
        // Get all creds from the same origin
        creds = dojo.filter(this.credentials, function(crd) {
          return esri._hasSameOrigin(crd.server, resUrl, true);
        });
    
    if (creds.length) {
      if (creds.length === 1) {
        idx = this._getIdenticalSvcIdx(resUrl, creds[0]);
        
        if (lastToken) {
          if (idx !== -1) {
            // [ CASE 1 ]
            // Remove the existing credential for this resource.
            // Obviously it did not work for the caller.
            // Challenge again.
            creds[0].resources.splice(idx, 1);
            
            //if (!creds[0].resources.length) {
              //this.credentials.splice(dojo.indexOf(this.credentials, creds[0]), 1);
              
              // This implies that there shouldnt be any credential
              // without a single rsrc
              
              // The end-user may enter the same userid-password combo
              // for a server for which there is already a credential
              // Make sure we don't call token service for a userId-server
              // combo that is already in credentials
              // See execute_ function in _createLoginDialog (IdentityManager.js)
            //}
          }
          //else {
            // [ CASE 2 ]
            // User tried using this token on a service that is different
            // from the one it was generated for.
            // Challenge.
          //}
        }
        else {
          // [ CASE 3 ]
          if (idx === -1) {
            creds[0].resources.push(resUrl);
          }
          
          return creds[0];
        }
      }
      else { // we have multiple creds (i.e. users) for the server hosting this resource
        // Find the credential with resource on the same service as
        // this request
        var found, i;
        
        dojo.some(creds, function(crd) {
          i = this._getIdenticalSvcIdx(resUrl, crd);
          if (i !== -1) {
            // I don't expect to see multiple creds for resources from one
            // service
            found = crd;
            idx = i;
            return true;
          }
          return false;
        }, this);

        if (lastToken) {
          if (found) {
            // [ CASE 4 ]
            found.resources.splice(idx, 1);
            
            //if (!found.resources.length) {
              //this.credentials.splice(dojo.indexOf(this.credentials, found), 1);
            //}
          }
          //else {
            // [ CASE 5 ]
            // We don't expect to be here
          //}
        }
        else {
          if (found) {
            // [ CASE 6 ]
            return found;
          }
          //else {
            // [ CASE 7 ]
            // There are more than one matching credentials for this
            // server but none of them on the same service as this resource
            // The user-experience can't be screwed up anymore than it already
            // is, let's challenge the user.
            // If the resulting token doesnt work, the next try would land in
            // CASE 4
            
            // TODO
            // What if there is a credential with resources.length = 0. Such a
            // credential could have been left over from a previous attempt to
            // create credential for another secured service on this server
            // We could potentially try such credential in this case.
          //}
        }
      }
    }
  },
  
  _useProxy: function(sinfo, options) {
    // Returns true if generateToken has to use proxy - even overriding 
    // CORS support
    return (options && options.isAdmin) || (
            !this._isPortalDomain(sinfo.tokenServiceUrl) && 
             sinfo.currentVersion == 10.1 &&
            !esri._hasSameOrigin(sinfo.tokenServiceUrl, window.location.href)
           );
  },
  
  _getOrigin: function(resUrl) {
    var uri = new dojo._Url(resUrl);
    return uri.scheme + "://" + uri.host + (esri._isDefined(uri.port) ? (":" + uri.port) : "");
  },
  
  _sanitizeUrl: function(url) {
    url = dojo.trim(url);
    
    var proxyUrl = (esri.config.defaults.io.proxyUrl || "").toLowerCase(),
        mark = proxyUrl ? url.toLowerCase().indexOf(proxyUrl + "?") : -1;
    
    if (mark !== -1) {
      // This URL is of the form: http://example.com/proxy.jsp?http://target.server.com/...
      url = url.substring(mark + proxyUrl.length + 1);
    }
    
    return esri.urlToObject(url).path;
  },
  
  _isRESTService: function(resUrl) {
    return (resUrl.indexOf(this._agsRest) > -1);
  },
  
  _isAdminResource: function(resUrl) {
    return this._agsAdmin.test(resUrl);
  },
  
  _isIdenticalService: function(resUrl1, resUrl2) {
    // It is assumed that the two resources are from the same origin
    
    // Ideally, this method would be named "_haveIdenticalSecBoundary"
    // For ArcGIS Server resources, we know that a "service" defines the
    // security boundary i.e., it is possible that two different services 
    // be accessed using two difference users.
   
    var retVal;
   
    if (this._isRESTService(resUrl1) && this._isRESTService(resUrl2)) {
      var name1 = this._getSuffix(resUrl1).toLowerCase(), 
          name2 = this._getSuffix(resUrl2).toLowerCase();
      
      retVal = (name1 === name2);
      
      if (!retVal) {
        // Consider "s1/MapServer" and "s1/FeatureServer" as belonging to the same
        // security boundary (FS is just an extenstion of MS)
        var regex = /(.*)\/(MapServer|FeatureServer).*/ig;
        retVal = (name1.replace(regex, "$1") === name2.replace(regex, "$1"));
      }
    }
    else if (this._isPortalDomain(resUrl1)) {
      // indicates both are geowarehouse resources
      retVal = true;
    }
    else if (this._isAdminResource(resUrl1) && this._isAdminResource(resUrl2)) {
      return true;
    }
   
    return retVal;
  },
  
  _isPortalDomain: function(resUrl) {
    resUrl = resUrl.toLowerCase();

    var resAuthority = (new dojo._Url(resUrl)).authority,
        portalCfg = this._portalConfig,
        
        // arcgis.com?
        found = (resAuthority.indexOf(this._agolSuffix) !== -1); 
    
    // are we running within an app hosted on an on-premise portal?
    // i.e. not hosted at "*.arcgis.com". If so, check if the resource
    // has the same origin as esriGeowConfig.restBaseUrl
    if (!found && portalCfg) {
      found = esri._hasSameOrigin(portalCfg.restBaseUrl, resUrl, true);
    }
    
    // are we running within a custom js app? If so, check if the resource
    // has the same origin as "esri.arcgis.utils.arcgisUrl"
    if (!found) {
      if (!this._arcgisUrl) {
        // See esri/arcgis/utils.js
        var arcgisUrl = dojo.getObject("esri.arcgis.utils.arcgisUrl");
        if (arcgisUrl) {
          this._arcgisUrl = (new dojo._Url(arcgisUrl)).authority;
        }
      }
      
      if (this._arcgisUrl) {
        found = (this._arcgisUrl.toLowerCase() === resAuthority);
      }
    }
    
    return found;
  },
  
  _isIdProvider: function(server, resource) {
    // server and resource are assumed one of portal domains
    
    /*
     // Tests:
     var app = "http://www.arcgis.com";
     console.log(app);
     console.log("1. " + (esri.id._isIdProvider(app, "http://www.arcgis.com") === true));
     console.log("2. " + (esri.id._isIdProvider(app, "http://tiles.arcgis.com") === true));
     console.log("3. " + (esri.id._isIdProvider(app, "http://services.arcgis.com") === true));
     console.log("4. " + (esri.id._isIdProvider(app, "http://apps.arcgis.com") === true));
     console.log("5. " + (esri.id._isIdProvider(app, "https://www.arcgis.com") === true));
     console.log("6. " + (esri.id._isIdProvider(app, "http://candor.maps.arcgis.com") === true));
     console.log("7. " + (esri.id._isIdProvider(app, "http://candordev.maps.arcgis.com") === true));
     console.log("8. " + (esri.id._isIdProvider(app, "http://candordevext.maps.arcgis.com") === true));
     console.log("9. " + (esri.id._isIdProvider(app, "http://candorqa.maps.arcgis.com") === true));
     console.log("10. " + (esri.id._isIdProvider(app, "http://candorqaext.maps.arcgis.com") === true));

     app = "https://www.arcgis.com";
     console.log(app);
     console.log("1. " + (esri.id._isIdProvider(app, "http://www.arcgis.com") === true));
     console.log("2. " + (esri.id._isIdProvider(app, "http://tiles.arcgis.com") === true));
     console.log("3. " + (esri.id._isIdProvider(app, "http://services.arcgis.com") === true));
     console.log("4. " + (esri.id._isIdProvider(app, "http://apps.arcgis.com") === true));
     console.log("5. " + (esri.id._isIdProvider(app, "https://www.arcgis.com") === true));
     console.log("6. " + (esri.id._isIdProvider(app, "https://candor.maps.arcgis.com") === true));
     console.log("7. " + (esri.id._isIdProvider(app, "https://candordev.maps.arcgis.com") === true));
     console.log("8. " + (esri.id._isIdProvider(app, "https://candordevext.maps.arcgis.com") === true));
     console.log("9. " + (esri.id._isIdProvider(app, "http://candorqa.maps.arcgis.com") === true));
     console.log("10. " + (esri.id._isIdProvider(app, "http://candorqaext.maps.arcgis.com") === true));

     app = "http://qaext.arcgis.com";
     console.log(app);
     console.log("1. " + (esri.id._isIdProvider(app, "http://qaext.arcgis.com") === true));
     console.log("2. " + (esri.id._isIdProvider(app, "http://tilesqaext.arcgis.com") === true));
     console.log("3. " + (esri.id._isIdProvider(app, "http://servicesqaext.arcgis.com") === true));
     console.log("4. " + (esri.id._isIdProvider(app, "https://qaext.arcgis.com") === true));
     console.log("5. " + (esri.id._isIdProvider(app, "http://tilesqa.arcgis.com") === true));
     console.log("6. " + (esri.id._isIdProvider(app, "http://servicesqa.arcgis.com") === true));
     console.log("7. " + (esri.id._isIdProvider(app, "http://appsqa.arcgis.com") === true));
     console.log("8. " + (esri.id._isIdProvider(app, "http://candorqa.maps.arcgis.com") === false));
     console.log("9. " + (esri.id._isIdProvider(app, "http://candorqaext.maps.arcgis.com") === false));

     app = "http://teamqa.maps.arcgis.com";
     console.log(app);
     console.log("1. " + (esri.id._isIdProvider(app, "http://www.arcgis.com") === true));
     console.log("2. " + (esri.id._isIdProvider(app, "http://tiles.arcgis.com") === true));
     console.log("3. " + (esri.id._isIdProvider(app, "http://services.arcgis.com") === true));
     console.log("4. " + (esri.id._isIdProvider(app, "http://apps.arcgis.com") === true));
     console.log("5. " + (esri.id._isIdProvider(app, "http://teamqa.maps.arcgis.com") === true));

     app = "http://teamqaext.maps.arcgis.com";
     console.log(app);
     console.log("1. " + (esri.id._isIdProvider(app, "http://www.arcgis.com") === true));
     console.log("2. " + (esri.id._isIdProvider(app, "http://tiles.arcgis.com") === true));
     console.log("3. " + (esri.id._isIdProvider(app, "http://services.arcgis.com") === true));
     console.log("4. " + (esri.id._isIdProvider(app, "http://apps.arcgis.com") === true));
     console.log("5. " + (esri.id._isIdProvider(app, "http://teamqaext.maps.arcgis.com") === true));

     app = "http://appsqa.arcgis.com";
     console.log(app);
     console.log("1. " + (esri.id._isIdProvider(app, "http://qaext.arcgis.com") === true));
     console.log("2. " + (esri.id._isIdProvider(app, "http://tilesqaext.arcgis.com") === true));
     console.log("3. " + (esri.id._isIdProvider(app, "http://servicesqaext.arcgis.com") === true));
     console.log("4. " + (esri.id._isIdProvider(app, "https://qaext.arcgis.com") === true));
     console.log("5. " + (esri.id._isIdProvider(app, "http://tilesqa.arcgis.com") === true));
     console.log("6. " + (esri.id._isIdProvider(app, "http://servicesqa.arcgis.com") === true));
     console.log("7. " + (esri.id._isIdProvider(app, "http://appsqa.arcgis.com") === true));

     app = "http://devext.arcgis.com";
     console.log(app);
     console.log("1. " + (esri.id._isIdProvider(app, "http://devext.arcgis.com") === true));
     console.log("2. " + (esri.id._isIdProvider(app, "http://tilesdevext.arcgis.com") === true));
     console.log("3. " + (esri.id._isIdProvider(app, "http://servicesdevext.arcgis.com") === true));
     console.log("4. " + (esri.id._isIdProvider(app, "http://servicesdev.arcgis.com") === true));
     console.log("5. " + (esri.id._isIdProvider(app, "https://devext.arcgis.com") === true));
     console.log("6. " + (esri.id._isIdProvider(app, "http://candor.mapsdevext.arcgis.com") === true));
     console.log("7. " + (esri.id._isIdProvider(app, "http://candordev.maps.arcgis.com") === false));
     console.log("8. " + (esri.id._isIdProvider(app, "http://candordevext.maps.arcgis.com") === false));

     app = "http://dev.arcgis.com";
     console.log(app);
     console.log("1. " + (esri.id._isIdProvider(app, "http://dev.arcgis.com") === true));
     console.log("2. " + (esri.id._isIdProvider(app, "http://tilesdev.arcgis.com") === true));
     console.log("3. " + (esri.id._isIdProvider(app, "http://servicesdev.arcgis.com") === true));
     console.log("4. " + (esri.id._isIdProvider(app, "https://dev.arcgis.com") === true));

     app = "http://teamdevext.maps.arcgis.com";
     console.log(app);
     console.log("1. " + (esri.id._isIdProvider(app, "http://www.arcgis.com") === true));
     console.log("2. " + (esri.id._isIdProvider(app, "http://tiles.arcgis.com") === true));
     console.log("3. " + (esri.id._isIdProvider(app, "http://services.arcgis.com") === true));
     console.log("4. " + (esri.id._isIdProvider(app, "http://apps.arcgis.com") === true));
     console.log("5. " + (esri.id._isIdProvider(app, "http://teamdevext.maps.arcgis.com") === true));

     app = "http://candor.mapsdevext.arcgis.com";
     console.log(app);
     console.log("1. " + (esri.id._isIdProvider(app, "http://devext.arcgis.com") === true));
     console.log("2. " + (esri.id._isIdProvider(app, "http://tilesdevext.arcgis.com") === true));
     console.log("3. " + (esri.id._isIdProvider(app, "http://servicesdevext.arcgis.com") === true));
     console.log("4. " + (esri.id._isIdProvider(app, "http://servicesdev.arcgis.com") === true));
     console.log("5. " + (esri.id._isIdProvider(app, "https://devext.arcgis.com") === true));
     console.log("6. " + (esri.id._isIdProvider(app, "http://candor.mapsdevext.arcgis.com") === true));
    */
    
    var i = -1, j = -1;
    
    dojo.forEach(this._gwDomains, function(domain, idx) {
      if (i === -1 && domain.regex.test(server)) {
        i = idx;
      }
      if (j === -1 && domain.regex.test(resource)) {
        j = idx;
      }
    });
    
    var retVal = false;
    
    if (i > -1 && j > -1) {
      if (i === 0 || i === 4) {
        if (j === 0 || j === 4) {
          retVal = true;
        }
      }
      else if (i === 1) {
        if (j === 1 || j === 2) {
          retVal = true;
        }
      }
      else if (i === 2) {
        if (j === 2) {
          retVal = true;
        }
      }
      else if (i === 3) {
        if (j === 3) {
          retVal = true;
        }
      }
    }
    
    // Check if the "resource" is hosted on a server that has an owning system.
    // If so, may be "server" === "owning server"
    if (!retVal) {
      var sinfo = this.findServerInfo(resource),
          owningSystemUrl = sinfo && sinfo.owningSystemUrl;
      
      // TODO
      // Add test cases to cover this scenario
      if (
        owningSystemUrl && verifyFederation(owningSystemUrl, sinfo) &&
        this._isPortalDomain(owningSystemUrl) && 
        this._isIdProvider(server, owningSystemUrl)
      ) {
        retVal = true;
      }
      
      // Recursion is eventually broken because of the fact that ServerInfo of 
      // a provider (or owning system) will not have an owningSystemUrl
    }
    
    return retVal;
  },
  
  _isPublic: function(resUrl) {
    resUrl = this._sanitizeUrl(resUrl);
    
    return dojo.some(this._publicUrls, function(regex) {
      return regex.test(resUrl);
    });
  },
  
  _getIdenticalSvcIdx: function(resUrl, credential) {
    var idx = -1;
    
    dojo.some(credential.resources, function(rsrc, i) {
      if ( this._isIdenticalService(resUrl, rsrc) ) {
        idx = i;
        return true;
      }
      
      return false;
    }, this);
    
    return idx;
  },
  
  _getSuffix: function(resUrl) {
    /*
     // Tests:
     console.log("servicesbeta");
     console.log("1. " + (esri.id._getSuffix("https://servicesbeta.esri.com/ArcGIS/rest/services/SanJuan/Trails/MapServer") === "SanJuan/Trails/MapServer"));
     console.log("2. " + (esri.id._getSuffix("https://servicesbeta.esri.com/ArcGIS/rest/services/SanJuan/Trails/MapServer/1") === "SanJuan/Trails/MapServer"));
     console.log("3. " + (esri.id._getSuffix("https://servicesbeta.esri.com/ArcGIS/rest/services/SanJuan/Trails/MapServer/1/query") === "SanJuan/Trails/MapServer"));
     console.log("4. " + (esri.id._getSuffix("https://servicesbeta.esri.com/ArcGIS/rest/services/USA/MapServer") === "USA/MapServer"));
     console.log("5. " + (esri.id._getSuffix("https://servicesbeta.esri.com/ArcGIS/rest/services") === ""));
     
     console.log("premium.arcgisonline");
     console.log("1. " + (esri.id._getSuffix("https://premium.arcgisonline.com/Server/rest/services/World_Imagery/MapServer") === "World_Imagery/MapServer"));
     console.log("2. " + (esri.id._getSuffix("https://premium.arcgisonline.com/Server/rest/services/World_Imagery/MapServer/0") === "World_Imagery/MapServer"));
     console.log("3. " + (esri.id._getSuffix("https://premium.arcgisonline.com/Server/rest/services/World_Imagery/MapServer/0/query") === "World_Imagery/MapServer"));
     console.log("4. " + (esri.id._getSuffix("https://premium.arcgisonline.com/Server/rest/services/Reference/World_Transportation/MapServer/0") === "Reference/World_Transportation/MapServer"));
     console.log("5. " + (esri.id._getSuffix("https://premium.arcgisonline.com/Server/rest/services") === ""));
     
     console.log("misc server");
     console.log("1. " + (esri.id._getSuffix("https://servicesbeta.esri.com/ArcGIS/rest/services/SanJuan/Trails/MapServer?f=json&dpi=96&transparent=true&format=png8&callback=dojo.io.script.jsonp_dojoIoScript2._jsonpCallback") === "SanJuan/Trails/MapServer"));
     console.log("2. " + (esri.id._getSuffix("http://10.113.11.36:8080/rest/services/st/MapServer") === "st/MapServer"));
     console.log("3. " + (esri.id._getSuffix("http://10.113.11.36:8080/rest/services") === ""));
     console.log("4. " + (esri.id._getSuffix("http://etat.geneve.ch/ags1/rest/services/Apiculture/MapServer") === "Apiculture/MapServer"));
    */

    return resUrl.replace(this._regexSDirUrl, "").replace(this._regexServerType, "$1");
  },
  
  _getTokenSvcUrl: function(resUrl) {
    /*
    // Test cases:
    console.log(esri.id._getTokenSvcUrl("http://www.arcgis.com/sharing") === esri.id._gwDomains[0].tokenServiceUrl);
    console.log(esri.id._getTokenSvcUrl("http://dev.arcgis.com/sharing") === esri.id._gwDomains[1].tokenServiceUrl);
    console.log(esri.id._getTokenSvcUrl("http://devext.arcgis.com/sharing") === esri.id._gwDomains[2].tokenServiceUrl);
    console.log(esri.id._getTokenSvcUrl("http://qaext.arcgis.com/sharing") === esri.id._gwDomains[3].tokenServiceUrl);
    console.log(esri.id._getTokenSvcUrl("http://tiles.arcgis.com/sharing") === esri.id._gwDomains[4].tokenServiceUrl);
    console.log(esri.id._getTokenSvcUrl("http://tilesdev.arcgis.com/sharing") === esri.id._gwDomains[2].tokenServiceUrl);
    console.log(esri.id._getTokenSvcUrl("http://tilesqa.arcgis.com/sharing") === esri.id._gwDomains[3].tokenServiceUrl);
    console.log(esri.id._getTokenSvcUrl("http://services.arcgis.com/sharing") === esri.id._gwDomains[4].tokenServiceUrl);
    console.log(esri.id._getTokenSvcUrl("http://servicesdev.arcgis.com/sharing") === esri.id._gwDomains[2].tokenServiceUrl);
    console.log(esri.id._getTokenSvcUrl("http://servicesqa.arcgis.com/sharing") === esri.id._gwDomains[3].tokenServiceUrl);
    esri.id._portalConfig = { restBaseUrl: "http://portal.usgs.gov" };
    console.log(esri.id._getTokenSvcUrl("http://portal.usgs.gov/sharing") === "https://portal.usgs.gov/sharing/generateToken");
    */
   
    var adminUrl, dfd;
   
    if (this._isRESTService(resUrl)) {
      //return resUrl.substring(0, resUrl.toLowerCase().indexOf("/arcgis/") + "/arcgis/".length) + "tokens";
      
      adminUrl = resUrl.substring(0, resUrl.toLowerCase().indexOf("/rest/")) + "/admin/generateToken";
      resUrl = resUrl.substring(0, resUrl.toLowerCase().indexOf("/rest/") + "/rest/".length) + "info";
      
      // Always use HTTPS version of the rest/info resource for 
      // hosted services - because some organizations may have strict
      // SSL requirement for all resources (in such cases HTTP is not
      // available)
      if (this._isPortalDomain(resUrl)) {
        resUrl = resUrl.replace(/http:/i, "https:");
      }
      
      dfd = esri.request({
        url: resUrl,
        content: { f: "json" },
        handleAs: "json",
        callbackParamName: "callback"
      });
      
      dfd.adminUrl_ = adminUrl;
      
      return dfd;
    }
    else if (this._isPortalDomain(resUrl)) {
      var url = "";
          
      dojo.some(this._gwDomains, function(domain) {
        if (domain.regex.test(resUrl)) {
          url = domain.tokenServiceUrl;
          return true;
        }
        return false;
      });
      
      if (!url) {
        // On-premise Portal?
        var origin = this._getOrigin(resUrl);
        url = origin.replace(/http:/i, "https:") + this._gwTokenUrl;
      }
      
      return url;
    }
    else if (resUrl.toLowerCase().indexOf("premium.arcgisonline.com") !== -1) {
      return "https://premium.arcgisonline.com/server/tokens";
    }
    else if (this._isAdminResource(resUrl)) {
      adminUrl = resUrl.substring(0, resUrl.toLowerCase().indexOf("/admin/") + "/admin/".length) + "generateToken";
      resUrl = resUrl.substring(0, resUrl.toLowerCase().indexOf("/admin/")) + "/rest/info";
      
      dfd = esri.request({
        url: resUrl,
        content: { f: "json" },
        handleAs: "json",
        callbackParamName: "callback"
      });
      
      dfd.adminUrl_ = adminUrl;
      
      return dfd;
    }
  },
  
  _doPortalSignIn: function(resUrl) {
    if (dojo.cookie.isSupported()) {
      // Create credential from cookie if the app is hosted on one of the
      // arcgis.com domains
      //var appOrigin = this._getOrigin(window.location.href),
      var esri_auth = dojo.cookie("esri_auth"), 
          portalCfg = this._portalConfig,
          appUrl = window.location.href,
          sinfo = this.findServerInfo(resUrl);
      //console.log("esri_auth: ", dojo.toJson(esri_auth));
      
      if ( (portalCfg || this._isPortalDomain(appUrl) || esri_auth) 
           && (this._isPortalDomain(resUrl) || (sinfo && sinfo.owningSystemUrl && this._isPortalDomain(sinfo.owningSystemUrl)) )
           && ( 
            this._isIdProvider(appUrl, resUrl) || 
            ( portalCfg && (esri._hasSameOrigin(portalCfg.restBaseUrl, resUrl, true) || this._isIdProvider(portalCfg.restBaseUrl, resUrl)) ) 
           )
      ) {
        return true;
      }
    }
    
    return false;
  },
  
  _checkProtocol: function(resUrl, sinfo, errbackFunc) {
    var proceed = true, tokenSvcUrl = sinfo.tokenServiceUrl;
    
    // Is the app running over HTTP and the user has configured a secure
    // token service endpoint? If so, abort by default unless the app has
    // registered a protocol error handler to handle this scenario
    if (
      dojo.trim(tokenSvcUrl).toLowerCase().indexOf("https:") === 0 && 
      window.location.href.toLowerCase().indexOf("https:") !== 0 && // true implies the proxy has to be HTTP as well
      !esri._canDoXOXHR(tokenSvcUrl) &&
      !esri._canDoXOXHR(esri._getProxyUrl(true).path) 
    ) {
      proceed = this._protocolFunc ? !!this._protocolFunc({
        resourceUrl: resUrl,
        serverInfo: sinfo
      }) : false;
      
      // On arcgis.com, the above function call will not return.
      // Instead the page will be reloaded over HTTPS

      if (!proceed) {
        var err = new Error("Aborted the Sign-In process to avoid sending password over insecure connection.");
        err.code = "IdentityManagerBase." + 4;
        err.log = dojo.config.isDebug; // see Deferred.js:reject for context
        console.log(err.message);
        errbackFunc(err);
      }
    }
    
    return proceed;
  },
  
  _enqueue: function(resUrl, serverInfo, options, dfd, isAdmin) {
    // This method is the entry point if you want the user to
    // go through a sign-in process (dialog box or redirection)
    
    if (!dfd) {
      dfd = new dojo.Deferred(esri._dfdCanceller);
    }
    
    dfd.resUrl_ = resUrl;
    dfd.sinfo_ = serverInfo;
    dfd.options_ = options;
    dfd.admin_ = isAdmin;

    if (this._busy) {
      if (esri._hasSameOrigin(resUrl, this._busy.resUrl_, true)) {
        this._soReqs.push(dfd);
      }
      else {
        this._xoReqs.push(dfd);
      }
    }
    else {
      // Get to work!
      this._doSignIn(dfd);
    }

    return dfd;
  },
  
  _doSignIn: function(dfd) {
    this._busy = dfd;
    
    var self = this;
    
    var callbackFunc = function(credential) {
      //console.log("challenge complete: ", credential && dojo.toJson(credential._toJson()));
    
      if (!credential.resources) {
        credential.resources = [];
      }
      credential.resources.push(dfd.resUrl_);
      
      credential.onTokenChange();
      
      if (dojo.indexOf(self.credentials, credential) === -1) {
        self.credentials.push(credential);
      }
      
      // Process pending requests for the same origin
      var reqs = self._soReqs, bucket = {};
      self._soReqs = [];
      
      //if (!self._isPortalDomain(dfd.resUrl_)) {
        dojo.forEach(reqs, function(reqDfd) {
          if (!this._isIdenticalService(dfd.resUrl_, reqDfd.resUrl_)) {
            var suffix = this._getSuffix(reqDfd.resUrl_);
           
            if (!bucket[suffix]) {
              bucket[suffix] = true;
              credential.resources.push(reqDfd.resUrl_);
            }
          }
        }, self);
      //}
      
      dfd.callback(credential);
      
      dojo.forEach(reqs, function(reqDfd) {
        reqDfd.callback(credential);
      });
      
      self._busy = dfd.resUrl_ = dfd.sinfo_ = null;
      
      // Process pending requests for different origins
      if (self._xoReqs.length) {
        self._doSignIn(self._xoReqs.shift());
      }
    },
    
    errbackFunc = function(error) {
      //console.log("challenge failed: ", error.code, error.message);
      
      dfd.errback(error);
      
      self._busy = dfd.resUrl_ = dfd.sinfo_ = null;
      
      // TODO
      // Should we call errback for requests from the same service?
      
      // Process pending requests for the same origin
      if (self._soReqs.length) {
        self._doSignIn(self._soReqs.shift());
      }

      // Process pending requests for different origins
      if (self._xoReqs.length) {
        self._doSignIn(self._xoReqs.shift());
      }
    },
    
    signIn = function() {
      if (self._doPortalSignIn(dfd.resUrl_)) {
        // Apps running in arcgis.com or on-premise portal go through this 
        // code path
        
        // Create credential from cookie if the app is hosted on one of the
        // arcgis.com domains
        var esri_auth = dojo.cookie("esri_auth"), 
            portalCfg = self._portalConfig;
        //console.log("esri_auth: ", dojo.toJson(esri_auth));
          
        // Initialize IdentityManager using the credential info from cookie
        if (esri_auth) {
          esri_auth = dojo.fromJson(esri_auth);
          
          callbackFunc(new esri.Credential({
            userId: esri_auth.email,
            server: dfd.sinfo_.server,
            token: esri_auth.token,
            expires: null // We don't know the expiration time of this token
          }));
          
          return;
        }
        else {
          // TODO
          // Should we show a message to the user before performing this 
          // redirection?
          
          // Send the user to ArcGIS.com sign-in page which in-turn will redirect
          // the user back to this page
          var signInUrl = "", appUrl = window.location.href;
          
          if (self.signInPage) {
            signInUrl = self.signInPage;
          }
          else if (portalCfg) {
            signInUrl = portalCfg.baseUrl + portalCfg.signin;
          }
          else if (self._isIdProvider(appUrl, dfd.resUrl_)) {
            signInUrl = self._getOrigin(appUrl) + "/home/signin.html";
          }
          else {
            signInUrl = dfd.sinfo_.server + "/home/signin.html";
          }
          
          // Always use HTTPS version of the portal sign-in page
          signInUrl = signInUrl.replace(/http:/i, "https:");
          
          if (portalCfg && portalCfg.useSSL === false) {
            // Dev setups such as may.esri.com typically don't have SSL enabled
            signInUrl = signInUrl.replace(/https:/i, "http:");
          }
          
          if (appUrl.toLowerCase().replace("https", "http").indexOf(signInUrl.toLowerCase().replace("https", "http")) === 0) {
            // we don't want to trigger another signin workflow from "within" 
            // signin page. OTOH, you'd also want such requests to use 
            // "disableIdentityLookup" option and handle "token required" errors.
            
            var err = new Error("Cannot redirect to Sign-In page from within Sign-In page. URL of the resource that triggered this workflow: " + dfd.resUrl_);
            err.code = "IdentityManagerBase." + 5;
            err.log = dojo.config.isDebug; // see Deferred.js:reject for context
            errbackFunc(err);
          }
          else {
            if (self._redirectFunc) {
              self._redirectFunc({
                signInPage: signInUrl,
                returnUrlParamName: "returnUrl",
                returnUrl: appUrl,
                resourceUrl: dfd.resUrl_,
                serverInfo: dfd.sinfo_
              });
            }
            else {
              window.location = signInUrl + "?returnUrl=" + window.escape(appUrl);
            }
          }
          
          // In any case we're done with sign-in process
          return;
        }
      }
      else if (self._checkProtocol(dfd.resUrl_, dfd.sinfo_, errbackFunc)) {
        // Standalone apps go through this code path
        
        var options = dfd.options_;
        if (dfd.admin_) {
          options = options || {};
          options.isAdmin = true;
        }
        
        // Wire up dfd.cancel to cancel signInDfd, which
        // will end up rejecting dfd with an error.
        dfd._pendingDfd = self.signIn(dfd.resUrl_, dfd.sinfo_, options)
                            .addCallbacks(callbackFunc, errbackFunc);
      }
    };

    var tokenSvcUrl = dfd.sinfo_.tokenServiceUrl;
    if (tokenSvcUrl) {
      /*if (this._checkProtocol(dfd.resUrl_, dfd.sinfo_, errbackFunc)) {
        // Wire up dfd.cancel to cancel signInDfd, which
        // will end up rejecting dfd with an error.
        dfd._pendingDfd = this.signIn(dfd.resUrl_, dfd.sinfo_).addCallbacks(callbackFunc, errbackFunc);
      }*/
     
      signIn();
    }
    else {
      dfd.sinfo_._restInfoDfd
      .addCallbacks(
        function(response) {
          var sinfo = dfd.sinfo_;
          sinfo.adminTokenServiceUrl = sinfo._restInfoDfd.adminUrl_;
          
          sinfo._restInfoDfd = null;

          sinfo.tokenServiceUrl = dojo.getObject("authInfo.tokenServicesUrl", false, response) || 
                                  dojo.getObject("authInfo.tokenServiceUrl", false, response) ||
                                  dojo.getObject("tokenServiceUrl", false, response);

          sinfo.shortLivedTokenValidity = dojo.getObject("authInfo.shortLivedTokenValidity", false, response);
          
          sinfo.currentVersion = response.currentVersion;
          sinfo.owningTenant = response.owningTenant;

          // Check if we already have credential for the owning portal.
          // Tokens generated for www.arcgis.com can be used for all
          // its other properties like: tiles.arcgis.com, services.arcgis.com
          // and so on for devext and qaext.
          // This will handle the case where a webamp hosted on qaext.arcgis.com
          // has a hosted map service as an operational layer but the token obtained
          // for webmap may be applicable to the hosted service as well.
          var owningSystemUrl = (sinfo.owningSystemUrl = response.owningSystemUrl);
          
          if (owningSystemUrl && verifyFederation(owningSystemUrl, sinfo)) {
            var found = self.findCredential(owningSystemUrl);
            
            // If there is no credential that exactly matches the
            // hostname of the owning system url:
            // check if there is a credential already obtained for one of
            // the custom portal URLs. For example, if:
            // owningSystemUrl = "http://devext.arcgis.com"
            // is there an existing credential for ggg.mapsdevext.arcgis.com?
            if (!found) {
              dojo.some(self.credentials, function(cred) {
                if (this._isIdProvider(owningSystemUrl, cred.server)) {
                  found = cred;
                }
                
                return !!found;
              }, self);
            }
            
            if (found) {
              found = found.toJson();
              found.resources = null; // we don't want to copy over "resources"
              found.server = sinfo.server;
              
              callbackFunc(new esri.Credential(found));
              return;
            }
          }

          // owningSystemUrl will be available for hosted services and 
          // on-premise arcgis servers that are federated with arcgis.com
          // or on-premise portal
         
          signIn();
        },
        
        function() {
          dfd.sinfo_._restInfoDfd = null;
          
          var err = new Error("Unknown resource - could not find token service endpoint.");
          err.code = "IdentityManagerBase." + 2;
          err.log = dojo.config.isDebug; // see Deferred.js:reject for context
          errbackFunc(err);
        }
      );
    }
  }
});


/******************
 * esri.ServerInfo
 ******************/

dojo.declare("esri.ServerInfo", null, {
  
  /****************************
   * Properties:
   *    String server
   *    String tokenServiceUrl
   *    String adminTokenServiceUrl
   *    Number shortLivedTokenValidity
   *    String owningSystemUrl
   *    String owningTenant
   *    Number currentVersion
   */

  constructor: function(json) {
    dojo.mixin(this, json);
  },
  
  toJson: function() {
    return esri._sanitize({
      server: this.server,
      tokenServiceUrl: this.tokenServiceUrl,
      adminTokenServiceUrl: this.adminTokenServiceUrl,
      shortLivedTokenValidity: this.shortLivedTokenValidity,
      owningSystemUrl: this.owningSystemUrl,
      owningTenant: this.owningTenant,
      currentVersion: this.currentVersion
    });
  }
});


/******************
 * esri.Credential
 ******************/

dojo.declare("esri.Credential", null, {
  
  /****************************
   * Properties:
   *    String userId
   *    String server
   *    String token
   *    Number expires
   *    Number validity
   *  String[] resources
   *    Number creationTime
   *   Boolean ssl
   *   Boolean isAdmin
   */
  
  tokenRefreshBuffer: 2,  // 2 minutes before expiration time

  constructor: function(json) {
    dojo.mixin(this, json);
    
    this.resources = this.resources || [];
    
    // Creation time provides a reference point for "validity"
    // when this credential is re-hydrated from a cookie or localStorage
    // Remember validity takes precedence over expires when setting
    // up refresh timer
    if (!esri._isDefined(this.creationTime)) {
      this.creationTime = (new Date()).getTime();
    }
  },
  
  refreshToken: function() {
    var self = this, 
        serverInfo = esri.id.findServerInfo(this.server),
        kserver = keyring[this.server],
        kpwd = kserver && kserver[this.userId];
    
    // We may not have pwd if this credential was created as a result
    // of re-hydrating the state of IdentityManager from a cookie or
    // localStorage. Note that IdentityManagerBase.toJson will not
    // return pwds
    if (!kpwd) {
      var dfd, resUrl = this.resources && this.resources[0];
      
      if (resUrl) {
        resUrl = esri.id._sanitizeUrl(resUrl);
        
        // Indicates this credential has been enqueued for user sign-in
        this._enqueued = 1;
        
        // Let's ask the user for password and generate token. 
        // TODO
        // We could perhaps go through getCredential instead of inventing 
        // _enqueue, but _findCredential (as it is implemented today) will  
        // totally remove "this" credential from its inventory
        dfd = esri.id._enqueue(resUrl, serverInfo, null, null, this.isAdmin);
        
        // When this dfd resolves successfully, "this" credential
        // will be automatically refreshed with a new token.
        // See callbackFunc in _doSignIn method.
        // TODO
        // However what if the user entered a different user credential
        // now and token generation succeeds?
        // Solution #1: show the existing userId in the dialog box
        // Solution #2: tolerate this new userId which may fail layer
        // when the consumer of this credential accessed the resource
        
        dfd.addBoth(function() {
          self._enqueued = 0;
        });
        
        // TODO
        // If this dfd fails, the existing token will eventually fail at 
        // some point in the future.
      }
      
      return dfd;
    }
    
    return esri.id.generateToken(serverInfo, {
      username: self.userId, 
      password: kpwd
    }, self.isAdmin ? { isAdmin: true } : null)
    .addCallback(function(response) {
      self.token = response.token;
      self.expires = esri._isDefined(response.expires) ? Number(response.expires) : null;
      self.creationTime = (new Date()).getTime();
      self.onTokenChange();
    })
    .addErrback(function() {
      // TODO
      // start a timer to notify consumers when this token
      // eventually expires?
      /*if (esri._isDefined(this.expires)) {
        if ((new Date()).getTime() < this.expires) {
        }
      }*/
    });
  },
  
  onTokenChange: function() {
    clearTimeout(this._refreshTimer);
    
    if (esri._isDefined(this.expires) || esri._isDefined(this.validity)) {
      // lets setup a timer to refresh the token
      // before it expired
      this._startRefreshTimer();
    }
  },
  
  onDestroy: function() {},
  
  destroy: function() {
    // render this credential unusable
    this.userId = this.server = this.token = this.expires = 
    this.validity = this.resources = this.creationTime = null;
    
    var found = dojo.indexOf(esri.id.credentials, this);
    if (found > -1) {
      esri.id.credentials.splice(found, 1);
    }
    
    this.onTokenChange();
    this.onDestroy();
  },
  
  toJson: function() {
    return this._toJson();
  },
  
  _toJson: function() {
    var json = esri._sanitize({
      userId: this.userId,
      server: this.server,
      token: this.token,
      expires: this.expires,
      validity: this.validity,
      ssl: this.ssl,
      isAdmin: this.isAdmin,
      creationTime: this.creationTime
    });
    
    var rsrcs = this.resources;
    if (rsrcs && rsrcs.length > 0) {
      json.resources = rsrcs;
    }
    
    return json;
  },
  
  _startRefreshTimer: function() {
    clearTimeout(this._refreshTimer);

    var buffer = this.tokenRefreshBuffer * 60000,
        expires = this.validity ? 
                    (this.creationTime + (this.validity * 60000)) : 
                    this.expires,
        delay = (expires - (new Date()).getTime());
    
    if (delay < 0) {
      // We need to do this because IE 8 doesn't fire if delay is negative.
      // Other browsers treat negative delay as 0ms which is expected
      delay = 0;
      
      // delay=0 indicates the function will be executed after the
      // current "JS context" has been executed
    }
    
    this._refreshTimer = setTimeout(
      dojo.hitch(this, this.refreshToken),
      (delay > buffer) ? (delay - buffer) : delay
    );
    
    // TODO
    // Test setTimeout behavior after system wakeup
  }
});

}());

});
