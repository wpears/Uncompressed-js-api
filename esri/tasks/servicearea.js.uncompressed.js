//>>built
// wrapped by build app
define("esri/tasks/servicearea", ["dijit","dojo","dojox","dojo/require!esri/tasks/_task,esri/tasks/gp,esri/tasks/na"], function(dijit,dojo,dojox){
dojo.provide("esri.tasks.servicearea");

dojo.require("esri.tasks._task");
dojo.require("esri.tasks.gp");
dojo.require("esri.tasks.na");

dojo.declare("esri.tasks.ServiceAreaTask", esri.tasks._Task, {
    constructor: function(/*String*/ url) {
      this._url.path += "/solveServiceArea";
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
        var solveLastResult = new esri.tasks.ServiceAreaSolveResult(response);   
                                            
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

    solve: function(/*esri.tasks.ServiceAreaParameters*/ params, /*function?*/ callback, /*function?*/ errback, context) {
      
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
      //service area results: ServiceAreaSolveResult
    }
  }
);

esri._createWrappers("esri.tasks.ServiceAreaTask");

dojo.declare("esri.tasks.ServiceAreaParameters", null, {
    accumulateAttributes: null,
    attributeParameterValues: null,
    defaultBreaks: null,
    doNotLocateOnRestrictedElements: false,
    excludeSourcesFromPolygons: null,
    facilities: null,
    impedanceAttribute: null,
    mergeSimilarPolygonRanges: false,
    outputGeometryPrecision: null,
    outputGeometryPrecisionUnits: null,
    outputLines: null,
    outputPolygons: null,
    outSpatialReference : null,
    overlapLines: false,
    overlapPolygons: false,
    pointBarriers: null,
    polygonBarriers: null,
    polylineBarriers: null,
    restrictionAttributes: null,
    restrictUTurns: null,
    returnFacilities: false,
    returnPointBarriers: false,
    returnPolylgonBarriers: false,
    returnPolylineBarriers: false,
    splitLinesAtBreaks: false,
    splitPolygonsAtBreaks: false,
    travelDirection: null,
    trimOuterPolygon: false,
    trimPolygonDistance: null,
    trimPolygonDistanceUnits: null,
    useHierarchy: null,
    timeOfDay: null,
      
    toJson: function(normalized) {
      var json = {                    
                    returnFacilities: this.returnFacilities,                    
                    returnBarriers: this.returnPointBarriers,
                    returnPolygonBarriers: this.returnPolygonBarriers,
                    returnPolylineBarriers: this.returnPolylineBarriers,
                    mergeSimilarPolygonRanges: this.mergeSimilarPolygonRanges,
                    overlapLines: this.overlapLines,
                    overlapPolygons: this.overlapPolygons,
                    splitLinesAtBreaks: this.splitLinesAtBreaks,
                    splitPolygonsAtBreaks: this.splitPolygonsAtBreaks,
                    trimOuterPolygon: this.trimOuterPolygon,                                                            
                    accumulateAttributeNames: this.accumulateAttributes ? this.accumulateAttributes.join(",") : null,                                                                                                   
                    attributeParameterValues: this.attributeParameterValues && dojo.toJson(this.attributeParameterValues),
                    defaultBreaks: this.defaultBreaks ? this.defaultBreaks.join(",") : null,
                    excludeSourcesFromPolygons: this.excludeSourcesFromPolygons ? this.excludeSourcesFromPolygons.join(",") : null,
                    impedanceAttributeName: this.impedanceAttribute,
                    outputGeometryPrecision: this.outputGeometryPrecision,
                    outputGeometryPrecisionUnits: this.outputGeometryPrecisionUnits,
                    outputLines: this.outputLines,
                    outputPolygons: this.outputPolygons,
                    outSR: this.outSpatialReference ? (this.outSpatialReference.wkid || dojo.toJson(this.outSpatialReference.toJson()))  : null,
                    restrictionAttributeNames: this.restrictionAttributes ? this.restrictionAttributes.join(",") : null,
                    restrictUTurns: this.restrictUTurns,
                    travelDirection: this.travelDirection,
                    trimPolygonDistance: this.trimPolygonDistance,
                    trimPolygonDistanceUnits: this.trimPolygonDistanceUnits,
                    useHierarchy: this.useHierarchy,
                    timeOfDay: this.timeOfDay && this.timeOfDay.getTime()
                  };
                  
      
      
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

dojo.declare("esri.tasks.ServiceAreaSolveResult", null, {
    constructor: function(/*Object*/ json) {
              
      if (json.saPolygons){
        this.serviceAreaPolygons = this._graphicsFromJson(json.saPolygons);                          
      }
      
      if (json.saPolylines){
        this.serviceAreaPolylines = this._graphicsFromJson(json.saPolylines);
      }
      
      if (json.facilities){
        this.facilities = this._graphicsFromJson(json.facilities);
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

    serviceAreaPolygons: null,
    serviceAreaPolylines: null,
    facilities: null,
    pointBarriers: null,
    polylineBarriers: null,
    polygonBarriers: null,    
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
