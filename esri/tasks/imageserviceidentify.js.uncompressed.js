//>>built
// wrapped by build app
define("esri/tasks/imageserviceidentify", ["dijit","dojo","dojox","dojo/require!esri/tasks/_task"], function(dijit,dojo,dojox){
dojo.provide("esri.tasks.imageserviceidentify");

dojo.require("esri.tasks._task");

dojo.declare("esri.tasks.ImageServiceIdentifyTask", esri.tasks._Task, {
    constructor: function(/*String*/ url) {
      this._url.path += "/identify";
      this._handler = dojo.hitch(this, this._handler);
    },
    
    // Methods to be wrapped with normalize logic
    __msigns: [
      {
        n: "execute",
        c: 3, // number of arguments expected by the method before the normalize era
        a: [ // arguments or properties of arguments that need to be normalized
          { i: 0, p: [ "geometry" ] }
        ],
        e: 2
      }
    ],

    _handler: function(response, io, callback, errback, dfd) {                            
      try{  
        var outResult = new esri.tasks.ImageServiceIdentifyResult(response);                        
        
        /*this.onComplete(outResult);
        if (callback) {
          callback(outResult);
        }*/
       
        this._successHandler([ outResult ], "onComplete", callback, dfd);
      }
      catch (err) {
        this._errorHandler(err, errback, dfd);
      }
    },

    execute: function(/*esri.tasks.ImageServiceIdentifyParameters*/ params, /*Function?*/ callback, /*Function?*/ errback, context) {
      //summary: Execute the task and fire onComplete event. If callback is provided, the
      //         callback function will also be called.
      // params: esri.tasks.ImageServiceIdentifyParameters: Parameters to pass to server to execute task
      // callback: Function?: Function to be called once task completes

      var assembly = context.assembly,
          _params = this._encode(dojo.mixin({}, this._url.query, { f:"json" }, params.toJson(assembly && assembly[0]))),
          _h = this._handler,
          _e = this._errorHandler;

      return esri.request({
        url: this._url.path,
        content: _params,
        callbackParamName: "callback",
        load: function(r, i) { _h(r, i, callback, errback, context.dfd); },
        error: function(r) { _e(r, errback, context.dfd); }
      });
    },

    onComplete: function() {
      //summary: Event fired when identify completes
      // arguments[0]: esri.task.ImageServiceIdentifyResult[]: Identify results
    }
  }
);

esri._createWrappers("esri.tasks.ImageServiceIdentifyTask");

dojo.declare("esri.tasks.ImageServiceIdentifyParameters", null, {      
    geometry: null,
    mosaicRule: null,
    pixelSizeX: null,
    pixelSizeY: null,
    toJson: function(normalized) {
      var g = normalized && normalized["geometry"] || this.geometry,         
          json = { geometry:g, 
                   mosaicRule: this.mosaicRule ? dojo.toJson(this.mosaicRule.toJson()) : null                                      
                 };          
      
      if (g) {
        json.geometryType = esri.geometry.getJsonType(g);
      }    
      
      if (esri._isDefined(this.pixelSizeX) && esri._isDefined(this.pixelSizeY)){
          json.pixelSize = dojo.toJson({x: parseFloat(this.pixelSizeX), y: parseFloat(this.pixelSizeY)});   
      }
      
      return json;
    }
  }
);

dojo.declare("esri.tasks.ImageServiceIdentifyResult", null, {
    constructor: function(/*Object*/ json) {
      if (json.catalogItems){
          this.catalogItems = new esri.tasks.FeatureSet(json.catalogItems);
      }
      
      if (json.location){
          this.location = esri.geometry.fromJson(json.location);
      } 
      
      this.catalogItemVisibilities = json.catalogItemVisibilities;
      this.name = json.name;
      this.objectId = json.objectId;      
      this.value = json.value;
      this.properties = json.properties;     
    }
  }
);
});
