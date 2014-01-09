//>>built
// wrapped by build app
define("esri/tasks/_task", ["dijit","dojo","dojox","dojo/require!esri/graphic,esri/utils"], function(dijit,dojo,dojox){
dojo.provide("esri.tasks._task");

dojo.require("esri.graphic");
dojo.require("esri.utils");

dojo.declare("esri.tasks._Task", null, {
    constructor: function(/*String*/ url) {
      //summary: Base class for all simple tasks. This is an abstract class and overriding
      //         classes can override any specific behavior.
      // url: String: Url to service/layer to use to execute task
      if (url && dojo.isString(url)) {
        this._url = esri.urlToObject(this.url = url);
      }
      
      this.normalization = true;
      this._errorHandler = dojo.hitch(this, this._errorHandler);
    },
    
    _useSSL: function() {
      var urlObject = this._url, re = /^http:/i, rep = "https:";
      
      if (this.url) {
        this.url = this.url.replace(re, rep);
      }
      
      if (urlObject && urlObject.path) {
        urlObject.path = urlObject.path.replace(re, rep);
      }
    },

    _encode: function(/*Object*/ params, doNotStringify, normalized) {
      //summary: Method may be implemented by extending classes if additional encoding
      //         parameters/modifications are required. This method is called before the
      //         request is sent to the server for processing.
      // params: Object: Parameters to be sent to server. f:"json" is added by default
      // doNotStringify is used by "gp" module when handling GPMultiValued input parameters
      var param, type, result = {}, i, p, pl;
      for (i in params) {
        if (i === "declaredClass") {
          continue;
        }
        param = params[i];
        type = typeof(param);
        if (param !== null && param !== undefined && type !== "function") {
          if (dojo.isArray(param)) {
            result[i] = [];
            pl = param.length;
            
            for (p=0; p<pl; p++) {
              result[i][p] = this._encode(param[p]);
            }
          }
          else if (type === "object") {
            if (param.toJson) {
              var json = param.toJson(normalized && normalized[i]); // normalized geometries for gp feature set parameter
              if (param instanceof esri.tasks.FeatureSet){
                //in order to workaround the issue in GP service 9.3, which doesn't take spatialReference as input featureset
                //replace spatialReference as sr.
                if (json.spatialReference){
                  json.sr = json.spatialReference;
                  delete json.spatialReference;
                }
              }
              result[i] = doNotStringify ? json : dojo.toJson(json);
            }
          }
          else {
            result[i] = param;
          }
        }
      }
      return result;
    },
    
    _successHandler: function(args, eventName, callback, dfd) {
      // Fire Event
      if (eventName) {
        this[eventName].apply(this, args);
      }
      
      // Invoke Callback
      if (callback) {
        callback.apply(null, args);
      }
      
      // Resolve Deferred
      if (dfd) {
        esri._resDfd(dfd, args);
      }
    },

    _errorHandler: function(err, errback, dfd) {
      this.onError(err);

      if (errback) {
        errback(err);
      }
      
      if (dfd) {
        dfd.errback(err);
      }
    },
    
    setNormalization: function(/*Booelan*/ enable) {
      this.normalization = enable;
    },

    onError: function() {
      //summary event fired whenever there is an error
    }
  }
);

//common
dojo.declare("esri.tasks.FeatureSet", null, {
    constructor: function(/*Object*/ json) {
      if (json) {
        dojo.mixin(this, json);
        var features = this.features,
            sr = json.spatialReference,
            Graphic = esri.Graphic,
            Geometry = esri.geometry.getGeometryType(json.geometryType);

        sr = (this.spatialReference = new esri.SpatialReference(sr));
        this.geometryType = json.geometryType;
        if (json.fields) {
          this.fields = json.fields;
        }

        dojo.forEach(features, function(feature, i) {
          var hasSR = feature.geometry && feature.geometry.spatialReference;
          
          features[i] = new Graphic(
            (Geometry && feature.geometry) ? new Geometry(feature.geometry) : null, 
            feature.symbol && esri.symbol.fromJson(feature.symbol), 
            feature.attributes
          );
          
          if (features[i].geometry && !hasSR) {
            features[i].geometry.setSpatialReference(sr);
          }
        });
      }
      else {
        this.features = [];
        this.fields = [];
      }
    },

    displayFieldName: null,
    geometryType: null,
    spatialReference: null,
    fieldAliases: null,    

    toJson: function(normalized) {
      var json = {};
      if (this.displayFieldName) {
        json.displayFieldName = this.displayFieldName;
      }
      // if (this.geometryType) {
      //   json.geometryType = this.geometryType;
      // }
      if (this.fields) {
        json.fields = this.fields;
      }

      if (this.spatialReference) {
        json.spatialReference = this.spatialReference.toJson();
      }
      else if (this.features[0] && this.features[0].geometry) {
        json.spatialReference = this.features[0].geometry.spatialReference.toJson();
      }

      // var fjson, gjson, jfeatures = (json.features = []), features = this.features;
      // for (var i=0, il=features.length; i<il; i++) {
      //   fjson = features[i].toJson();
      //   gjson = {};
      //   if (fjson.geometry) {
      //     gjson.geometry = fjson.geometry;
      //   }
      //   if (fjson.attributes) {
      //     gjson.attributes = fjson.attributes;
      //   }
      //   jfeatures.push(gjson);
      // }
      
      if (this.features[0]) {
        // TODO
        // What if the first feature did not have a geometry?
        // FIX THIS!
        if (this.features[0].geometry) {
          json.geometryType = esri.geometry.getJsonType(this.features[0].geometry);
        }
        json.features = esri._encodeGraphics(this.features, normalized);
      }
      
      json.exceededTransferLimit = this.exceededTransferLimit;
      
      return esri._sanitize(json);
    }
  }
);

esri.tasks._SpatialRelationship = {
  SPATIAL_REL_INTERSECTS: "esriSpatialRelIntersects",
  SPATIAL_REL_CONTAINS: "esriSpatialRelContains",
  SPATIAL_REL_CROSSES: "esriSpatialRelCrosses",
  SPATIAL_REL_ENVELOPEINTERSECTS: "esriSpatialRelEnvelopeIntersects",
  SPATIAL_REL_INDEXINTERSECTS: "esriSpatialRelIndexIntersects",
  SPATIAL_REL_OVERLAPS: "esriSpatialRelOverlaps",
  SPATIAL_REL_TOUCHES: "esriSpatialRelTouches",
  SPATIAL_REL_WITHIN: "esriSpatialRelWithin",
  SPATIAL_REL_RELATION: "esriSpatialRelRelation"
};
});
