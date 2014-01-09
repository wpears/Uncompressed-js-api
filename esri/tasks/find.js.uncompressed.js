//>>built
// wrapped by build app
define("esri/tasks/find", ["dijit","dojo","dojox","dojo/require!esri/tasks/_task"], function(dijit,dojo,dojox){
dojo.provide("esri.tasks.find");

dojo.require("esri.tasks._task");

dojo.declare("esri.tasks.FindTask", esri.tasks._Task, {
    constructor: function(/*String*/ url, options) {
      this._url.path += "/find";
      this._handler = dojo.hitch(this, this._handler);
      this.gdbVersion = options && options.gdbVersion;
    },

    _handler: function(response, io, callback, errback, dfd) {
      try {
        var outResults = [],
            FindResult = esri.tasks.FindResult;
        
        dojo.forEach(response.results, function(result, i) {
          outResults[i] = new FindResult(result);
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

    execute: function(/*esri.tasks.FindParameters*/ params, /*Function?*/ callback, /*Function?*/ errback) {
      //summary: Execute the task and fire onComplete event. If callback is provided, the
      //         callback function will also be called.
      // params: esri.tasks.FindParameters: Parameters to pass to server to execute task
      // callback: Function?: Function to be called once task completes
      // errback: Function?: Function to be called in case of server error

      var _params = this._encode(dojo.mixin({}, this._url.query, { f:"json" }, params.toJson())),
          _h = this._handler,
          _e = this._errorHandler;
      if (this.gdbVersion) {
        _params.gdbVersion = this.gdbVersion;
      }
      
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

    onComplete: function() {
      //summary: Event fired when find completes
      // arguments[0]: esri.task.FindResult[]: Results found
    }
  }
);

dojo.declare("esri.tasks.FindParameters", null, {
    searchText: null,
    contains: true,
    searchFields: null,
    outSpatialReference: null,
    layerIds: null,
    returnGeometry: false,
    layerDefinitions: null,
    dynamicLayerInfos: null,

    toJson: function() {
      var json = { searchText:this.searchText, contains:this.contains, returnGeometry:this.returnGeometry, maxAllowableOffset: this.maxAllowableOffset },
          layerIds = this.layerIds,
          searchFields = this.searchFields,
          outSR = this.outSpatialReference;
          
      if (layerIds) {
        json.layers = layerIds.join(",");
      }

      if (searchFields) {
        json.searchFields = searchFields.join(",");
      }

      if (outSR) {
        json.sr = outSR.wkid || dojo.toJson(outSR.toJson());
      }
      
      json.layerDefs = esri._serializeLayerDefinitions(this.layerDefinitions);
      
      if (this.dynamicLayerInfos && this.dynamicLayerInfos.length > 0) {
        var result,
          dynLayerObjs = [];

        dojo.forEach(this.dynamicLayerInfos, function (info) {
          if (!info.subLayerIds) {// skip group layers
            var layerId = info.id;
            // layerIds is required for REST service of Find operation.
            if (this.layerIds && dojo.indexOf(this.layerIds, layerId) !== -1) {
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

dojo.declare("esri.tasks.FindResult", null, {
    constructor: function(json) {
      dojo.mixin(this, json);
      this.feature = new esri.Graphic(json.geometry ? esri.geometry.fromJson(json.geometry) : null, null, json.attributes);
      
      delete this.geometry;
      delete this.attributes;
    }
  }
);
});
