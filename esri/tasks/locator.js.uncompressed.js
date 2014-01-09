//>>built
// wrapped by build app
define("esri/tasks/locator", ["dijit","dojo","dojox","dojo/require!esri/tasks/_task"], function(dijit,dojo,dojox){
dojo.provide("esri.tasks.locator");

dojo.require("esri.tasks._task");

dojo.declare("esri.tasks.Locator", esri.tasks._Task, {
    constructor: function(/*String*/ url) {
      this._geocodeHandler = dojo.hitch(this, this._geocodeHandler);
      this._geocodeAddressesHandler = dojo.hitch(this, this._geocodeAddressesHandler);
      this._reverseGeocodeHandler = dojo.hitch(this, this._reverseGeocodeHandler);
    },
    
    outSpatialReference: null,
    
    setOutSpatialReference: function(sr) {
      this.outSpatialReference = sr;
    },

    _geocodeHandler: function(response, io, callback, errback, dfd) {
      try {
        var candidates = response.candidates, candidate, out = [],
            i, il = candidates.length,
            sr = response.spatialReference;
            
        for (i=0; i<il; i++) {
          candidate = candidates[i];
          // out[i] = new esri.tasks.AddressCandidate(candidate.address, new esri.geometry.Point(candidate.location), candidate.score, candidate.attributes);
          out[i] = new esri.tasks.AddressCandidate(candidate);
          
          var location = out[i].location;
          if (sr && location && !location.spatialReference) {
            location.setSpatialReference(new esri.SpatialReference(sr));
          }
        }
       
        this._successHandler([ out ], "onAddressToLocationsComplete", callback, dfd);
      }
      catch (err) {
        this._errorHandler(err, errback, dfd);
      }
    },
    
    _geocodeAddressesHandler: function(response, io, callback, errback, dfd) {
      try {
        var locations = response.locations, out = [],
            i, il = locations.length,
            sr = response.spatialReference;
            
        for (i=0; i<il; i++) {
          out[i] = new esri.tasks.AddressCandidate(locations[i]);
          
          var location = out[i].location;
          if (sr && location && !location.spatialReference) {
            location.setSpatialReference(new esri.SpatialReference(sr));
          }
        }
       
        this._successHandler([ out ], "onAddressesToLocationsComplete", callback, dfd);
      }
      catch (err) {
        this._errorHandler(err, errback, dfd);
      }
    },

    addressToLocations: function(/*Object*/ address, /*String[]?*/ outFields, /*Function?*/ callback, /*Function?*/ errback, /*Envelope?*/ searchExtent) {
      //summary: Find all address candidates for given address
      // address: esri.tasks.AddressCandidate: Address to find candidates for
      // calback: function?: Callback function when operation completes
      // from 2.6, address, outFields and searchExtent should be congregated as a params obj. For backward compatible reason,
      // it supports both signature. 
      // new signature function(/*Object*/ params, /*Function?*/ callback, /*Function?*/ errback)
      if (address.address) {
        errback = callback;
        callback = outFields;        
        outFields = address.outFields;
        searchExtent = address.searchExtent;
        address = address.address;        
      }
      if (searchExtent) {
        searchExtent = searchExtent._normalize(true);
      }
      var outSR = this.outSpatialReference;
      var _params = this._encode(dojo.mixin({}, this._url.query, address, { f:"json", outSR: outSR && dojo.toJson(outSR.toJson()), outFields: (outFields && outFields.join(",")) || null, searchExtent: searchExtent && dojo.toJson(searchExtent.toJson()) })),
          _h = this._geocodeHandler,
          _e = this._errorHandler;

      var dfd = new dojo.Deferred(esri._dfdCanceller);

      dfd._pendingDfd = esri.request({
        url: this._url.path + "/findAddressCandidates",
        content: _params,
        callbackParamName: "callback",
        load: function(r, i) { _h(r, i, callback, errback, dfd); },
        error: function(r) { _e(r, errback, dfd); }
      });
      
      return dfd;
    },
    
    addressesToLocations: function(/*Object*/ params, /*Function?*/ callback, /*Function?*/ errback) {
      var outSR = this.outSpatialReference;
      var records = [], addresses = params.addresses;
      dojo.forEach(addresses, function(address, idx){
        records.push({attributes: address});
      });

      var _params = this._encode(dojo.mixin(
                      {},
                      this._url.query,
                      {addresses: dojo.toJson({records: records})},
                      {f:"json", outSR: outSR && dojo.toJson(outSR.toJson())}
                    )),
          _h = this._geocodeAddressesHandler,
          _e = this._errorHandler;

      var dfd = new dojo.Deferred(esri._dfdCanceller);

      dfd._pendingDfd = esri.request({
        url: this._url.path + "/geocodeAddresses",
        content: _params,
        callbackParamName: "callback",
        load: function(r, i) { _h(r, i, callback, errback, dfd); },
        error: function(r) { _e(r, errback, dfd); }
      });
      
      return dfd;      
    },

    _reverseGeocodeHandler: function(response, io, callback, errback, dfd) {
      try {
        var candidate = new esri.tasks.AddressCandidate({ address:response.address, location:response.location, score:100 });
       
        this._successHandler([ candidate ], "onLocationToAddressComplete", callback, dfd);
      }
      catch (err) {
        this._errorHandler(err, errback, dfd);
      }
    },

    locationToAddress: function(/*esri.geometry.Point*/ location, /*Number*/ distance, /*Function?*/ callback, /*Function?*/ errback) {
      //summary: Reverse geocode location on map and get address
      // location: esri.tasks.Point: Point to reverse reverse geocode
      // distance: Number: Tolerance distance within which to find an address
      // calback: function?: Callback function when operation completes
      if (location && this.normalization) {
        location = location.normalize();
      }

      var outSR = this.outSpatialReference;
      var _params = this._encode(dojo.mixin(
            {}, 
            this._url.query, 
            { 
              outSR: outSR && dojo.toJson(outSR.toJson()), 
              location: location && dojo.toJson(location.toJson()), 
              distance:distance, 
              f:"json" 
            }
          )),
          _h = this._reverseGeocodeHandler,
          _e = this._errorHandler;

      var dfd = new dojo.Deferred(esri._dfdCanceller);

      dfd._pendingDfd = esri.request({
        url: this._url.path + "/reverseGeocode",
        content: _params,
        callbackParamName: "callback",
        load: function(r, i) { _h(r, i, callback, errback, dfd); },
        error: function(r) { _e(r, errback, dfd); }
      });
      
      return dfd;
    },

    //events
    onAddressToLocationsComplete: function() {
      //summary: Event fired when addressToLocations completes
      // arguments[1]: esri.tasks.AddressCandidate[]: Array of possible address candidates
    },
    
    onAddressesToLocationsComplete: function() {
      //summary: Event fired when addressesToLocations completes
      // arguments[1]: esri.tasks.AddressCandidate[]: Array of possible address candidates
    },

    onLocationToAddressComplete: function() {
      //summary: Event fired when locationToAddress completes
      // arguments[1]: esri.tasks.AddressCandidate: Address candidate found closest to input location
    }
  }
);

dojo.declare("esri.tasks.AddressCandidate", null, {
    constructor: function(json) {
      dojo.mixin(this, json);
      this.location = new esri.geometry.Point(this.location);
    }
  }
);
});
