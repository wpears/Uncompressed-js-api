//>>built
// wrapped by build app
define("esri/tasks/query", ["dijit","dojo","dojox","dojo/require!esri/tasks/_task,esri/_time"], function(dijit,dojo,dojox){
dojo.provide("esri.tasks.query");

dojo.require("esri.tasks._task");
dojo.require("esri._time");

dojo.declare("esri.tasks.QueryTask", esri.tasks._Task, {
    constructor: function(/*String*/ url, options) {
      //summary: Perform query on layer and return results
      this._handler = dojo.hitch(this, this._handler);
      this._relationshipQueryHandler = dojo.hitch(this, this._relationshipQueryHandler);
      this._executeForIdsHandler = dojo.hitch(this, this._executeForIdsHandler);
      this._countHandler = dojo.hitch(this, this._countHandler);
      this.source = options && options.source;
      this.gdbVersion = options && options.gdbVersion;
    },
    
    // Methods to be wrapped with normalize logic
    __msigns: [
      {
        n: "execute",
        c: 4, // number of arguments expected by the method before the normalize era
        a: [ // arguments or properties of arguments that need to be normalized
          { i: 0, p: [ "geometry"/*, "test1", "test2", "test3.features"*/ ] }
        ],
        e: 2
      },
      {
        n: "executeForIds",
        c: 3,
        a: [
          { i: 0, p: [ "geometry" ] }
        ],
        e: 2
      },
      {
        n: "executeForCount",
        c: 3,
        a: [
          { i: 0, p: [ "geometry" ] }
        ],
        e: 2
      }
    ],
    
    /*********
     * Events
     *********/

    onComplete: function() {},
    onExecuteRelationshipQueryComplete: function() {},
    onExecuteForIdsComplete: function() {},
    onExecuteForCountComplete: function() {},
    
    /*****************
     * Public Methods
     *****************/

    execute: function(/*Object*/ params, /*Function?*/ callback, /*Function?*/ errback, /*String?*/ callbackSuffix, context) {
      //summary: Execute the task and fire onComplete event. If callback is provided, the
      //         callback function will also be called.
      // params: Object: Parameters to pass to server to execute task
      // callback: Function?: Function to be called once task completes

      var assembly = context.assembly,
          _params = this._encode(dojo.mixin({}, this._url.query, { f:"json" }, params.toJson(assembly && assembly[0]))),
          _h = this._handler,
          _e = this._errorHandler;
      if (this.source) {
        var layer = {source: this.source.toJson()};
        _params.layer = dojo.toJson(layer);
      }
      if (this.gdbVersion) {
        _params.gdbVersion = this.gdbVersion;
      }
      
      return esri.request({
        url: this._url.path + "/query",
        content: _params,
        callbackParamName: "callback",
        load: function(r, i) { _h(r, i, callback, errback, context.dfd); },
        error: function(r) { _e(r, errback, context.dfd); },
        callbackSuffix: callbackSuffix
      });
    },
  
    executeRelationshipQuery: function(/*Object*/ relationshipQuery, /*Function?*/ callback, /*Function?*/ errback) {
      //summary: Execute the task and fire onComplete event. If callback is provided, the
      //         callback function will also be called.
      // relationShipQuery: Object: Parameters to pass to server to execute task
      // callback: Function?: Function to be called once task completes

      var _params = this._encode(dojo.mixin({}, this._url.query, { f:"json" }, relationshipQuery.toJson())),
          _h = this._relationshipQueryHandler,
          _e = this._errorHandler;
      if (this.gdbVersion) {
        _params.gdbVersion = this.gdbVersion;
      }

      var dfd = new dojo.Deferred(esri._dfdCanceller);

      dfd._pendingDfd = esri.request({
        url: this._url.path + "/queryRelatedRecords",
        content: _params,
        callbackParamName: "callback",
        load: function(r, i) { _h(r, i, callback, errback, dfd); },
        error: function(r) { _e(r, errback, dfd); }
      });
      
      return dfd;
    },

    executeForIds: function(/*Object*/ params, /*Function?*/ callback, /*Function?*/ errback, context) {
      //summary: Execute the task and fire onComplete event. If callback is provided, the
      //         callback function will also be called.
      // params: Object: Parameters to pass to server to execute task
      // callback: Function?: Function to be called once task completes

      var assembly = context.assembly,
          _params = this._encode(dojo.mixin({}, this._url.query, { f:"json", returnIdsOnly:true }, params.toJson(assembly && assembly[0]))),
          _h = this._executeForIdsHandler,
          _e = this._errorHandler;
      if (this.source) {
        var layer = {source: this.source.toJson()};
        _params.layer = dojo.toJson(layer);
      }
      if (this.gdbVersion) {
        _params.gdbVersion = this.gdbVersion;
      }

      return esri.request({
        url: this._url.path + "/query",
        content: _params,
        callbackParamName: "callback",
        load: function(r, i) { _h(r, i, callback, errback, context.dfd); },
        error: function(r) { _e(r, errback, context.dfd); }
      });
    },
    
    executeForCount: function(/*Object*/ query, /*Function?*/ callback, /*Function?*/ errback, context) {
      var assembly = context.assembly,
          _params = this._encode(dojo.mixin({}, this._url.query, { f:"json", returnIdsOnly:true, returnCountOnly:true }, query.toJson(assembly && assembly[0]))),
          _h = this._countHandler,
          _e = this._errorHandler;
      if (this.source) {
        var layer = {source: this.source.toJson()};
        _params.layer = dojo.toJson(layer);
      }
      if (this.gdbVersion) {
        _params.gdbVersion = this.gdbVersion;
      }

      return esri.request({
        url: this._url.path + "/query",
        content: _params,
        callbackParamName: "callback",
        load: function(r, i) { _h(r, i, callback, errback, context.dfd); },
        error: function(r) { _e(r, errback, context.dfd); }
      });
    },
    
    /*******************
     * Internal Methods
     *******************/

    _handler: function(response, io, callback, errback, dfd) {
      try {
        var result = new esri.tasks.FeatureSet(response);
        
        /*this.onComplete(result);
        if (callback) {
          callback(result);
        }*/
       
        this._successHandler([ result ], "onComplete", callback, dfd);
      }
      catch (err) {
        this._errorHandler(err, errback, dfd);
      }
    },

    _relationshipQueryHandler: function(response, io, callback, errback, dfd) {
      try {       
        var gt = response.geometryType, sr = response.spatialReference, result={};
        dojo.forEach(response.relatedRecordGroups, function(gr) {
          var fsetJson = {};
          fsetJson.geometryType = gt;
          fsetJson.spatialReference = sr;
          fsetJson.features = gr.relatedRecords;
          var fset = new esri.tasks.FeatureSet(fsetJson);
          result[gr.objectId] = fset;
        });
        
        /*this.onExecuteRelationshipQueryComplete(result);
        if (callback) {
          callback(result);
        }*/
        
        this._successHandler([ result ], "onExecuteRelationshipQueryComplete", callback, dfd);
      }
      catch (err) {
        this._errorHandler(err, errback, dfd);
      }
    },

    _executeForIdsHandler: function(response, io, callback, errback, dfd) {
      try {
        /*this.onExecuteForIdsComplete(response.objectIds);
        if (callback) {
          callback(response.objectIds);
        }*/
        this._successHandler([ response.objectIds ], "onExecuteForIdsComplete", callback, dfd);
      }
      catch (err) {
        this._errorHandler(err, errback, dfd);
      }
    },
    
    _countHandler: function(response, io, callback, errback, dfd) {
      try {
        var returnValue, features = response.features, ids = response.objectIds;
        
        if (ids) {
          // 10.0 server
          // Query operation of this layer does not seem to support
          // 'returnCountOnly' parameter. Let's return the count 
          // anyway. 
          returnValue = ids.length;
        }
        else if (features) {
          // 9.3 or 9.3.1 server
          // Query responses containing feature set are subject to 
          // limitation on the number of features returned and does
          // not reflect the exact count. Throw an error.
          throw new Error(esri.bundle.tasks.query.invalid);
        }
        else {
          // 10 SP1 server
          returnValue = response.count;
        }
        
        /*this.onExecuteForCountComplete(returnValue);
        if (callback) {
          callback(returnValue);
        }*/
       
        this._successHandler([ returnValue ], "onExecuteForCountComplete", callback, dfd);
      }
      catch (err) {
        this._errorHandler(err, errback, dfd);
      }
    }
  }
);

esri._createWrappers("esri.tasks.QueryTask");

dojo.declare("esri.tasks.Query", null, {
    constructor: function() {
      this.spatialRelationship = esri.tasks.Query.SPATIAL_REL_INTERSECTS;
    },

    text: null,
    where: "",
    geometry: null,
    groupByFieldsForStatistics: null,
    objectIds: null,
    returnGeometry: false,
    orderByFields: null,
    outSpatialReference: null,
    outFields: null,
    outStatistics: null,    
    timeExtent:null,
    relationParam: null,

    toJson: function(normalized) {
      var json = { text:this.text, where:this.where, returnGeometry:this.returnGeometry, spatialRel:this.spatialRelationship, maxAllowableOffset: this.maxAllowableOffset, geometryPrecision: this.geometryPrecision },
          g = normalized && normalized["geometry"] || this.geometry,
          ids = this.objectIds,
          outFields = this.outFields,
          outSR = this.outSpatialReference,
          groupByFieldsForStatistics = this.groupByFieldsForStatistics,
          orderByFields = this.orderByFields,
          outStatistics = this.outStatistics;
      
      if (g) {
        json.geometry = g;
        json.geometryType = esri.geometry.getJsonType(g);
        json.inSR = g.spatialReference.wkid || dojo.toJson(g.spatialReference.toJson());
      }
      
      if (ids) {
        json.objectIds = ids.join(",");
      }

      if (outFields) {
        json.outFields = outFields.join(",");
      }
      
      if (groupByFieldsForStatistics) {
        json.groupByFieldsForStatistics = groupByFieldsForStatistics.join(",");
      }
      
      if (orderByFields) {
        json.orderByFields = orderByFields.join(",");
      }
      
      if (outStatistics) {
        var outStatisticsJson = [];
        dojo.forEach(outStatistics, function(item, idx){
          outStatisticsJson.push(item.toJson());
        });
        json.outStatistics = dojo.toJson(outStatisticsJson);
      }

      if (outSR !== null) {
        json.outSR = outSR.wkid || dojo.toJson(outSR.toJson());
      }
      else if (g) {
        json.outSR = g.spatialReference.wkid || dojo.toJson(g.spatialReference.toJson()) ;
      }
     
      var timeExtent = this.timeExtent;
      json.time = timeExtent ? timeExtent.toJson().join(",") : null;
      
      var relationParam = this.relationParam;
      if (relationParam && this.spatialRelationship === esri.tasks.Query.SPATIAL_REL_RELATION) {
        json.relationParam = relationParam;
      }
      
      // NOTE
      // Used by feature layer to set a timestamp under
      // certain conditions. See FeatureLayer.js for details
      json._ts = this._ts;
                                               
      return json;
    }
  }
);

dojo.mixin(esri.tasks.Query, esri.tasks._SpatialRelationship);

dojo.declare("esri.tasks.RelationshipQuery", null, {
    definitionExpression: "",
    relationshipId: null,
    returnGeometry: false,
    objectIds: null,
    outSpatialReference: null,
    outFields: null,

    toJson: function() {
      var json = { definitionExpression:this.definitionExpression, relationshipId:this.relationshipId, returnGeometry:this.returnGeometry, maxAllowableOffset: this.maxAllowableOffset, geometryPrecision: this.geometryPrecision },
          objectIds = this.objectIds,
          outFields = this.outFields,
          outSR = this.outSpatialReference;

      if (objectIds) {
        json.objectIds = objectIds.join(",");
      }
      
      if (outFields) {
        json.outFields = outFields.join(",");
      }

      if (outSR) {
        json.outSR = outSR.toJson();
      }
      
      // NOTE
      // Used by feature layer to set a timestamp under
      // certain conditions. See FeatureLayer.js for details
      json._ts = this._ts;

      return json;
    }
  }
);

dojo.declare("esri.tasks.StatisticDefinition", null, {
  statisticType: null,
  onStatisticField: null,
  outStatisticFieldName: null,
  
  toJson: function(){
    var json = {statisticType: this.statisticType, onStatisticField: this.onStatisticField};
    if (this.outStatisticFieldName) {
      json.outStatisticFieldName = this.outStatisticFieldName;
    }
    return json;
  }
});

});
