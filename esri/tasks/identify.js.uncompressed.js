//>>built
// wrapped by build app
define("esri/tasks/identify", ["dijit","dojo","dojox","dojo/require!esri/tasks/_task"], function(dijit,dojo,dojox){
dojo.provide("esri.tasks.identify");

dojo.require("esri.tasks._task");

dojo.declare("esri.tasks.IdentifyTask", esri.tasks._Task, {
    constructor: function(/*String*/ url, options) {
      this._url.path += "/identify";
      this._handler = dojo.hitch(this, this._handler);
      this.gdbVersion = options && options.gdbVersion;
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
      try {
        var outResults = [],
            IdentifyResult = esri.tasks.IdentifyResult;
        
        dojo.forEach(response.results, function(result, i) {
          outResults[i] = new IdentifyResult(result);
        });

        /*this.onComplete(outResults);
        if (callback) {
          callback(outResults);
        }*/
        
        this._successHandler([ outResults ], "onComplete", callback, dfd);
      }
      catch (err) {
        this._errorHandler(err, errback, dfd);
      }
    },

    execute: function(/*esri.tasks.IdentifyParameters*/ params, /*Function?*/ callback, /*Function?*/ errback, context) {
      //summary: Execute the task and fire onComplete event. If callback is provided, the
      //         callback function will also be called.
      // params: esri.tasks.IdentifyParameters: Parameters to pass to server to execute task
      // callback: Function?: Function to be called once task completes

      var assembly = context.assembly,
          _params = this._encode(dojo.mixin({}, this._url.query, { f:"json" }, params.toJson(assembly && assembly[0]))),
          _h = this._handler,
          _e = this._errorHandler;
      if (this.gdbVersion) {
        _params.gdbVersion = this.gdbVersion;
      }

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
      // arguments[0]: esri.task.IdentfyResult[]: Identify results
    }
  }
);

esri._createWrappers("esri.tasks.IdentifyTask");

dojo.declare("esri.tasks.IdentifyParameters", null, {
    constructor: function() {
      this.layerOption = esri.tasks.IdentifyParameters.LAYER_OPTION_TOP;
    },
  
    geometry: null,
    spatialReference: null,
    layerIds: null,
    tolerance: null,
    returnGeometry: false,
    mapExtent: null,
    width: esri.config.defaults.map.width,
    height: esri.config.defaults.map.height,
    dpi: 96,
    layerDefinitions: null,
    timeExtent: null,
    layerTimeOptions: null,
    dynamicLayerInfos: null,

    toJson: function(normalized) {
      var g = normalized && normalized["geometry"] || this.geometry,
          ext = this.mapExtent,
          sr = this.spatialReference,
          layerIds = this.layerIds,
          json = { 
            geometry: g, 
            tolerance: this.tolerance, 
            returnGeometry: this.returnGeometry, 
            mapExtent: ext, 
            imageDisplay: this.width + "," + this.height + "," + this.dpi, 
            maxAllowableOffset: this.maxAllowableOffset 
          };
      
      if (g) {
        json.geometryType = esri.geometry.getJsonType(g);
      }

      if (sr !== null) {
        json.sr = sr.wkid || dojo.toJson(sr.toJson());
      }
      else {
        if (g) {
          json.sr = g.spatialReference.wkid || dojo.toJson(g.spatialReference.toJson());
        }
        else if (ext) {
          json.sr = ext.spatialReference.wkid || dojo.toJson(ext.spatialReference.toJson());
        }
      }

      json.layers = this.layerOption;
      if (layerIds) {
        json.layers += ":" + layerIds.join(",");
      }
      
      json.layerDefs = esri._serializeLayerDefinitions(this.layerDefinitions);
      
      var timeExtent = this.timeExtent;
      json.time = timeExtent ? timeExtent.toJson().join(",") : null;
     
      json.layerTimeOptions = esri._serializeTimeOptions(this.layerTimeOptions);
      
      if (this.dynamicLayerInfos && this.dynamicLayerInfos.length > 0) {
        var result,
          scaleParams = {extent: ext, width: this.width, spatialReference: ext.spatialReference},
          mapScale = esri.geometry.getScale(scaleParams),
          layersInScale = esri._getLayersForScale(mapScale, this.dynamicLayerInfos),
          dynLayerObjs = [];

        dojo.forEach(this.dynamicLayerInfos, function (info) {
          if (!info.subLayerIds) {// skip group layers
            var layerId = info.id;
            // if visible and in scale
            if ((!this.layerIds || (this.layerIds && dojo.indexOf(this.layerIds, layerId) !== -1)) && dojo.indexOf(layersInScale, layerId) !== -1 ) {
              var dynLayerObj = {
                id: layerId
              };
              dynLayerObj.source = info.source && info.source.toJson();
              
              var definitionExpression;
              if (this.layerDefinitions && this.layerDefinitions[layerId]) {
                definitionExpression = this.layerDefinitions[layerId];
              }
              if (definitionExpression) {
                dynLayerObj.definitionExpression = definitionExpression;
              }
              var layerTimeOptions;
              if (this.layerTimeOptions && this.layerTimeOptions[layerId]) {
                layerTimeOptions = this.layerTimeOptions[layerId];
              }
              if (layerTimeOptions) {
                dynLayerObj.layerTimeOptions = layerTimeOptions.toJson();
              }
              dynLayerObjs.push(dynLayerObj);
            }
          }
        }, this);

        result = dojo.toJson(dynLayerObjs);
        //Server side bug which draw the existing layers when dynamicLayers is "[]". By changing it to "[{}]", it draws
        //an empty map.
        if (result === "[]") {
          result = "[{}]";
        }      
        json.dynamicLayers = result;
      }

      return json;
    }
  }
);

dojo.mixin(esri.tasks.IdentifyParameters, {
  LAYER_OPTION_TOP: "top", LAYER_OPTION_VISIBLE: "visible", LAYER_OPTION_ALL: "all"
});

dojo.declare("esri.tasks.IdentifyResult", null, {
    constructor: function(/*Object*/ json) {
      dojo.mixin(this, json);
      this.feature = new esri.Graphic(json.geometry ? esri.geometry.fromJson(json.geometry) : null, null, json.attributes);

      delete this.geometry;
      delete this.attributes;
    }
  }
);
});
