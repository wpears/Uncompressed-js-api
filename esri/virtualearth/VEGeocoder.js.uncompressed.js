//>>built
// wrapped by build app
define("esri/virtualearth/VEGeocoder", ["dijit","dojo","dojox","dojo/require!esri/tasks/_task,esri/geometry,esri/utils"], function(dijit,dojo,dojox){
dojo.provide("esri.virtualearth.VEGeocoder");

dojo.require("esri.tasks._task");
dojo.require("esri.geometry");
dojo.require("esri.utils");

dojo.declare("esri.virtualearth.VEGeocoder", esri.tasks._Task, {
    constructor: function(options) {
      try {        
        //options = dojo.mixin({ environment:"staging", tokenDuration:480 }, options || {});        
        //this.environment = options.environment;
        options = dojo.mixin({ bingMapsKey:null }, options || {});
                
        this.url = "http://serverapi.arcgisonline.com/veadaptor/production/services/geocode/geocode";
        this._url = esri.urlToObject(this.url);
        
        this._queue = [];
        
        //this.tokenDuration = options.tokenDuration;

        //layer properties
        //this.serverToken = options.serverToken;
        //this.tokenUrl = options.tokenUrl;

        this.bingMapsKey = options.bingMapsKey;
        this.culture = options.culture || "en-US";

        this._errorHandler = dojo.hitch(this, this._errorHandler);
        //this._updateToken = dojo.hitch(this, this._updateToken);
        //this._updateServerToken = dojo.hitch(this, this._updateServerToken);
        
        this._addressToLocationsHandler = dojo.hitch(this, this._addressToLocationsHandler);
        
        if (! this.bingMapsKey) {
          throw new Error(esri.bundle.virtualearth.vegeocode.bingMapsKeyNotSpecified);
        }
        
        //if (this.tokenUrl) {
        //  this._tokenUrl = esri.urlToObject(this.tokenUrl);
        //}
        
        //initialize layer
        //if (this.serverToken && this.tokenUrl) {
        //  this._updateTokenTimer = setTimeout(this._updateToken, ((this.tokenDuration - 1) * 60 * 1000));
        //}
        //else if (! this.serverToken && this.tokenUrl) {
        //  this._updateToken();
        //}
        //else if (! this.serverToken && ! this.tokenUrl) {
        //  throw new Error(esri.bundle.virtualearth.vegeocode.tokensNotSpecified);
        //}
      }
      catch (e) {
        this.onError(e);
        throw e;
      }
    },
    
    addressToLocations: function(query, callback, errback) {
      //if (! this.serverToken) {
      //  console.debug(esri.bundle.virtualearth.vegeocode.requestQueued);
      //  this._queue.push(arguments);
      //  return;
      //}
      
      if (! this.bingMapsKey) {
        console.debug(esri.bundle.virtualearth.vegeocode.requestQueued);
        this._queue.push(arguments);
        return;
      }
      
      var _params = dojo.mixin({}, this._url.query, { query:query, token:this.bingMapsKey, culture:this.culture }),      
          _h = this._addressToLocationsHandler,
          _e = this._errorHandler;

      var dfd = new dojo.Deferred(esri._dfdCanceller);

      dfd._pendingDfd = esri.request({
        url: this._url.path,
        content: _params,
        callbackParamName: "callback",
        load: function(r, i) { _h(r, i, callback, errback, dfd); },
        error: function(r) { _e(r, errback, dfd); }
      });
      
      return dfd;
    },
    
    _addressToLocationsHandler: function(results, io, callback, errback, dfd) {
      try {
        dojo.forEach(results, function(result, i) {
          results[i] = new esri.virtualearth.VEGeocodeResult(result);
        });
        
        /*this.onAddressToLocationsComplete(results);
        if (callback) {
          callback(results);
        }*/
       
        this._successHandler([ results ], "onAddressToLocationsComplete", callback, dfd);
      }
      catch (err) {
        this._errorHandler(err, errback, dfd);
      }
    },
    
    onAddressToLocationsComplete: function() {
      //summary: Event fired when addressToLocations completes
    },
    
    /*_updateToken: function() {
      clearTimeout(this._updateTokenTimer);
      
      var tokenDur = this.tokenDuration,
          url = this._tokenUrl.path,
          params = dojo.mixin(this._tokenUrl.params, { iptype:"server", environment:this.environment, duration:this.tokenDuration }),
          _updateServerToken = this._updateServerToken,
          _errorHandler = this._errorHandler;

      esri.request({
        url: url,
        content: params,
        callbackParamName: "callback",
        load: _updateServerToken,
        error: _errorHandler
      });
      
      this._updateTokenTimer = setTimeout(this._updateToken, ((tokenDur - 1) * 60 * 1000));
    },
    
    
    _updateServerToken: function(response) {
      this.setServerToken(response.token);
      
      var il;
      while ((il = this._queue.length) > 0) {
        this.addressToLocations.apply(this, this._queue.splice(0, 1)[0]);
      }
    },
    
    setServerToken: function(token) {
      this.serverToken = token;
    },
    */
    setBingMapsKey: function(bingMapsKey){
      this.bingMapsKey = bingMapsKey;    
    },
    
    setCulture: function(/*String*/ culture) {
      this.culture = culture;
    }
  }
);

dojo.declare("esri.virtualearth.VEAddress", null, {
    constructor: function(json) {
      dojo.mixin(this, { addressLine:null, adminDistrict:null, countryRegion:null, district:null, formattedAddress:null, locality:null, postalCode:null, postalTown:null }, json);
    }
  }
);

dojo.declare("esri.virtualearth.VEGeocodeResult", null, {
    constructor: function(json) {
      dojo.mixin(this, { address:null, bestView:null, calculationMethod:null, confidence:null, displayName:null, entityType:null, location:null, matchCodes:null }, json);
      if (this.address) {
        this.address = new esri.virtualearth.VEAddress(this.address);
      }
      if (this.bestView) {
        this.bestView = new esri.geometry.Extent(this.bestView);
      }
      if (this.locationArray) {
        this.calculationMethod = this.locationArray[0].calculationMethod;
        this.location = new esri.geometry.Point(this.locationArray[0]);
      }
    }
  }
);

});
