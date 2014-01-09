//>>built
// wrapped by build app
define("esri/tasks/closestfacility", ["dijit","dojo","dojox","dojo/require!esri/tasks/_task,esri/tasks/gp,esri/tasks/na"], function(dijit,dojo,dojox){
dojo.provide("esri.tasks.closestfacility");

dojo.require("esri.tasks._task");
dojo.require("esri.tasks.gp");
dojo.require("esri.tasks.na");

dojo.declare("esri.tasks.ClosestFacilityTask", esri.tasks._Task, {
    constructor: function(/*String*/ url) {
      this._url.path += "/solveClosestFacility";
      this._handler = dojo.hitch(this, this._handler);
    },

    // Methods to be wrapped with normalize logic
    __msigns: [
      {
        n: "solve",
        c: 3, // number of arguments expected by the method before the normalize era
        a: [ // arguments or properties of arguments that need to be normalized
          { 
            i: 0, 
            p: [ 
              "incidents.features", 
              "facilities.features", 
              "pointBarriers.features", 
              "polylineBarriers.features", 
              "polygonBarriers.features" 
            ]
          }
        ],
        e: 2
      }
    ],

    _handler: function(response, io, callback, errback, dfd) {
      try {                                
        var solveLastResult = new esri.tasks.ClosestFacilitySolveResult(response);                                       
        
        /*this.onSolveComplete(solveLastResult);
        if (callback) {
          callback(solveLastResult);
        }*/
       
        this._successHandler([ solveLastResult ], "onSolveComplete", callback, dfd);
      }
      catch (err) {
        this._errorHandler(err, errback, dfd);
      }
    },
        
    solve: function(/*esri.tasks.ClosestFacilityParameters*/ params, /*function?*/ callback, /*function?*/ errback, context) {
      
      var assembly = context.assembly,
          _params = this._encode(dojo.mixin({}, this._url.query, { f:"json" }, params.toJson(assembly && assembly[0]))),
          handler = this._handler,
          errHandler = this._errorHandler;
      
      return esri.request({
        url: this._url.path,
        content: _params,
        callbackParamName: "callback",
        load: function(r, i) { handler(r, i, callback, errback, context.dfd); },
        error: function(r) { errHandler(r, errback, context.dfd); }
      });
    },

    onSolveComplete: function() {
      //closest facility results: ClosestFacilitySolveResult
    }
  }
);

esri._createWrappers("esri.tasks.ClosestFacilityTask");

dojo.declare("esri.tasks.ClosestFacilityParameters", null, {
    accumulateAttributes: null,
    attributeParameterValues: null,
    defaultCutoff: null,
    defaultTargetFacilityCount: null,
    directionsLanguage: null,
    directionsLengthUnits: null,
    directionsTimeAttribute: false,
    doNotLocateOnRestrictedElements: false,
    facilities: null,
    impedanceAttribute: null,
    incidents: null,
    outputGeometryPrecision: null,
    outputGeometryPrecisionUnits: null,
    outputLines: null,
    outSpatialReference: null,
    pointBarriers: null,
    polygonBarriers: null,
    polylineBarriers: null,
    restrictionAttributes: null,
    restrictUTurns: null,
    returnDirections: false,
    returnFacilities: false,
    returnIncidents: false,
    returnPointBarriers: false,
    returnPolylgonBarriers: false,
    returnPolylineBarriers: false,
    returnRoutes: true,
    travelDirection: null,
    useHierarchy: false,
    timeOfDay: null,
    timeOfDayUsage: null,
      
    toJson: function(normalized) {
      var json = {
                    returnDirections: this.returnDirections,
                    returnFacilities: this.returnFacilities,
                    returnIncidents: this.returnIncidents,
                    returnBarriers: this.returnPointBarriers,
                    returnPolygonBarriers: this.returnPolygonBarriers,
                    returnPolylineBarriers: this.returnPolylineBarriers,
                    returnCFRoutes: this.returnRoutes,
                    useHierarchy: this.useHierarchy,                                                                                                   
                    attributeParameterValues: this.attributeParameterValues && dojo.toJson(this.attributeParameterValues),
                    defaultCutoff: this.defaultCutoff,
                    defaultTargetFacilityCount: this.defaultTargetFacilityCount,
                    directionsLanguage: this.directionsLanguage,
                    directionsLengthUnits: esri.tasks._NALengthUnit[this.directionsLengthUnits],
                    directionsTimeAttributeName: this.directionsTimeAttribute,                    
                    impedanceAttributeName: this.impedanceAttribute,                    
                    outputGeometryPrecision: this.outputGeometryPrecision,
                    outputGeometryPrecisionUnits: this.outputGeometryPrecisionUnits,  
                    outputLines: this.outputLines,                    
                    outSR: this.outSpatialReference ? (this.outSpatialReference.wkid || dojo.toJson(this.outSpatialReference.toJson()))  : null,                                        
                    restrictionAttributeNames: this.restrictionAttributes ? this.restrictionAttributes.join(",") : null,
                    restrictUTurns: this.restrictUTurns,
                    accumulateAttributeNames: this.accumulateAttributes ? this.accumulateAttributes.join(",") : null,                                                                                                
                    travelDirection: this.travelDirection,
                    timeOfDay: this.timeOfDay && this.timeOfDay.getTime()
                  };      
            
      if (this.timeOfDayUsage) {
        var timeOfDayUsage;
        switch (this.timeOfDayUsage.toLowerCase()) {
          case "start":
            timeOfDayUsage = "esriNATimeOfDayUseAsStartTime";
            break;
          case "end":
            timeOfDayUsage = "esriNATimeOfDayUseAsEndTime";
            break;
          default:
            timeOfDayUsage = this.timeOfDayUsage;
        }
        json.timeOfDayUsage = timeOfDayUsage;
      }
      var incidents = this.incidents;
      if (incidents instanceof esri.tasks.FeatureSet && incidents.features.length > 0) {
        json.incidents = dojo.toJson({ 
          type:"features", 
          features:esri._encodeGraphics(incidents.features, normalized && normalized["incidents.features"]),
          doNotLocateOnRestrictedElements: this.doNotLocateOnRestrictedElements
        });
      }
      else if (incidents instanceof esri.tasks.DataLayer) {
        json.incidents = incidents;
      }
      else if (incidents instanceof esri.tasks.DataFile) {
        json.incidents = dojo.toJson({
          type: "features",
          url: incidents.url,
          doNotLocateOnRestrictedElements: this.doNotLocateOnRestrictedElements
        });
      }
      
      var facilities = this.facilities;
      if (facilities instanceof esri.tasks.FeatureSet && facilities.features.length > 0) {
        json.facilities = dojo.toJson({ 
          type:"features", 
          features:esri._encodeGraphics(facilities.features, normalized && normalized["facilities.features"]),
          doNotLocateOnRestrictedElements: this.doNotLocateOnRestrictedElements
        });
      }
      else if (facilities instanceof esri.tasks.DataLayer) {
        json.facilities = facilities;
      }
      else if (facilities instanceof esri.tasks.DataFile) {
        json.facilities = dojo.toJson({
          type: "features",
          url: facilities.url,
          doNotLocateOnRestrictedElements: this.doNotLocateOnRestrictedElements
        });
      }
               
      // anonymous function to process barriers of all kind
      var barriersFunc = function(barrs, paramName) {
        if (!barrs) {
          return null;
        }
        
        if (barrs instanceof esri.tasks.FeatureSet) {
          if (barrs.features.length > 0) {
            return dojo.toJson({ 
              type:"features", 
              features:esri._encodeGraphics(barrs.features, normalized && normalized[paramName]) 
            });
          }
          else {
            return null;
          }
        }
        else if (barrs instanceof esri.tasks.DataLayer) {
          return barrs;
        }
        else if (barrs instanceof esri.tasks.DataFile) {
          return dojo.toJson({
            type: "features",
            url: barrs.url
          });
        }
        return dojo.toJson(barrs);
      };
      
      if (this.pointBarriers) {
        json.barriers = barriersFunc(this.pointBarriers, "pointBarriers.features");
      }
      if (this.polygonBarriers) {
        json.polygonBarriers = barriersFunc(this.polygonBarriers, "polygonBarriers.features");
      }
      if (this.polylineBarriers) {
        json.polylineBarriers = barriersFunc(this.polylineBarriers, "polylineBarriers.features");
      }
      
      return esri.filter(json, function(value) {
        if (value !== null) {
          return true;
        }
      });
    }
  }
);

dojo.declare("esri.tasks.ClosestFacilitySolveResult", null, {
    constructor: function(/*Object*/ json) {        
      if (json.directions) {
        this.directions = [];
        dojo.forEach(json.directions, function(direction, idx){
          //create copy of compressed geometries since FeatureSet will destroy the feature.compressedGeometry property
          var cgs = []; //compressed geometries array
          dojo.forEach(direction.features, function(f, i) {
            cgs[i] = f.compressedGeometry;
          });
          this.directions[idx] = new esri.tasks.DirectionsFeatureSet(direction, cgs);
        }, this);
      }
      
      if (json.routes){
        this.routes = this._graphicsFromJson(json.routes);
      }
      
      if (json.facilities){
        this.facilities = this._graphicsFromJson(json.facilities);
      }
      
      if (json.incidents){
        this.incidents = this._graphicsFromJson(json.incidents);
      }
      
      if (json.barriers){
        this.pointBarriers = this._graphicsFromJson(json.barriers);
      }
      
      if (json.polylineBarriers){
        this.polylineBarriers = this._graphicsFromJson(json.polylineBarriers);
      }
      
      if (json.polygonBarriers){
        this.polygonBarriers = this._graphicsFromJson(json.polygonBarriers);
      } 
      
      if (json.messages) {
          this.messages = dojo.map(json.messages, function(message, i){ return new esri.tasks.NAMessage(message); });
      }           
    },

    routes: null,
    facilities: null,
    incidents: null,
    pointBarriers: null,
    polylineBarriers: null,
    polygonBarriers: null,
    directions: null,
    messages:null,
    
    _graphicsFromJson : function(json){
     var sr = new esri.SpatialReference(json.spatialReference);
     var features = json.features;
     return dojo.map(features, function(feature, i) {
          var graphic = new esri.Graphic(feature);
          graphic.geometry.setSpatialReference(sr); 
          return graphic;
        });
      }                  
  }           
);
});
