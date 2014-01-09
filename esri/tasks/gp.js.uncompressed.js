//>>built
// wrapped by build app
define("esri/tasks/gp", ["dijit","dojo","dojox","dojo/require!esri/tasks/_task,esri/layers/agsdynamic,dojo/date/locale"], function(dijit,dojo,dojox){
dojo.provide("esri.tasks.gp");

dojo.require("esri.tasks._task");
dojo.require("esri.layers.agsdynamic");
dojo.require("dojo.date.locale");

dojo.declare("esri.tasks.Geoprocessor", esri.tasks._Task, {
    constructor: function(/*String*/ url) {
      //summary: Execute Geoprocessing task
      this._jobUpdateHandler = dojo.hitch(this, this._jobUpdateHandler);
      this._getJobStatus = dojo.hitch(this, this._getJobStatus);
      this._getResultDataHandler = dojo.hitch(this, this._getResultDataHandler);
      this._getResultImageHandler = dojo.hitch(this, this._getResultImageHandler);
      this._executeHandler = dojo.hitch(this, this._executeHandler);
      this._updateTimers = [];
    },

    updateDelay: 1000,
    processSpatialReference: null,
    outputSpatialReference: null,
    outSpatialReference: null,

    setUpdateDelay: function(/*Number*/ delay) {
      //summary: Set delay time to check for job status updates
      this.updateDelay = delay;
    },

    setProcessSpatialReference: function(sr) {
      this.processSpatialReference = sr;
    },

    setOutputSpatialReference: function(sr) {
      this._setOutSR(sr);
    },

    setOutSpatialReference: function(sr) {
      this._setOutSR(sr);
    },

    // Methods to be wrapped with normalize logic
    __msigns: [
      {
        n: "execute",
        c: 3, // number of arguments expected by the method before the normalize era
        a: [ // arguments or properties of arguments that need to be normalized
          { i: 0, p: [ "*" ] }
        ],
        e: 2,
        f: 1
      },
      {
        n: "submitJob",
        c: 4,
        a: [
          { i: 0, p: [ "*" ] }
        ],
        e: 3
      }
    ],
    
    _setOutSR: function(sr) {
      this.outSpatialReference = this.outputSpatialReference = sr;
    },
    
    _getOutSR: function() {
      return this.outSpatialReference || this.outputSpatialReference;
    },
    
    _gpEncode: function(/*Object*/ params, doNotStringify, normalized) {
      for (var i in params) {
        var param = params[i];
        
        if (dojo.isArray(param)) {
          params[i] = dojo.toJson(dojo.map(param, function(item) {
            return this._gpEncode({ item: item }, true).item;
          }, this));
        }
        else if (param instanceof Date) {
          params[i] = param.getTime();
        }
      }
      return this._encode(params, doNotStringify, normalized);
    },

    _decode: function(response) {
      var dataType = response.dataType, value,
          result = new esri.tasks.ParameterValue(response);

      if (dojo.indexOf(["GPBoolean", "GPDouble", "GPLong", "GPString"], dataType) !== -1) {
        return result;
      }
  
      if (dataType === "GPLinearUnit") {
        result.value = new esri.tasks.LinearUnit(result.value);
      }
      else if (dataType === "GPFeatureRecordSetLayer" || dataType === "GPRecordSet") {
        result.value = new esri.tasks.FeatureSet(result.value);
      }
      else if (dataType === "GPDataFile") {
        result.value = new esri.tasks.DataFile(result.value);
      }
      else if (dataType === "GPDate") {
        value = result.value;
        if (dojo.isString(value)) {
          result.value = new esri.tasks.Date({ date: value });
        }
        else {
          result.value = new Date(value);
        }
      }
      else if (dataType === "GPRasterData" || dataType === "GPRasterDataLayer") {
        var mapImage = response.value.mapImage;
        if (mapImage) {
          result.value = new esri.layers.MapImage(mapImage);
        }
        else {
          result.value = new esri.tasks.RasterData(result.value);
        }
      }
      else if (dataType.indexOf("GPMultiValue:") !== -1) {
        var type = dataType.split(":")[1];
        value = result.value;
        
        result.value = dojo.map(value, function(item) {
          return this._decode({
            paramName: "_name",
            dataType: type,
            value: item
          }).value;
        }, this);
      }
      else {
        console.log(this.declaredClass + " : " + esri.bundle.tasks.gp.gpDataTypeNotHandled + " : " + result.dataType);
        result = null;
      }
      return result;
    },

    submitJob: function(/*Object*/ params, /*function?*/ callback, /*Function?*/ statusCallback, /*Function?*/ errback, context) {
      var outSR = this._getOutSR();
      var assembly = context.assembly,
          _params = this._gpEncode(
                                 dojo.mixin({},
                                            this._url.query,
                                            { f: "json",
                                              "env:outSR": (outSR ? (outSR.wkid || dojo.toJson(outSR.toJson())): null),
                                              "env:processSR": (this.processSpatialReference ? (this.processSpatialReference.wkid || dojo.toJson(this.processSpatialReference.toJson()))  : null)
                                            },
                                            params
                                          ),
                                  null,
                                  assembly && assembly[0]
                                ),
          _h = this._jobUpdateHandler,
          _e = this._errorHandler;

      return esri.request({
        url: this._url.path + "/submitJob",
        content: _params,
        callbackParamName: "callback",
        load: function(r, i) { _h(r, i, false, callback, statusCallback, context.dfd); },
        error: function(r) { _e(r, errback, context.dfd); }
      });
    },

    _jobUpdateHandler: function(response, io, single, callback, statusCallback, dfd) {
      var jobId = response.jobId,
          jobInfo = new esri.tasks.JobInfo(response);
      
      /*this.onStatusUpdate(jobInfo);
      if (statusCallback) {
        statusCallback(jobInfo);
      }*/
     
      this._successHandler([ jobInfo ], "onStatusUpdate", statusCallback, single && dfd);

      if (! single) {
        clearTimeout(this._updateTimers[jobId]);
        this._updateTimers[jobId] = null;
        if (dfd) {
          dfd.progress(jobInfo);
        }
  
        switch (response.jobStatus) {
          case esri.tasks.JobInfo.STATUS_SUBMITTED:
          case esri.tasks.JobInfo.STATUS_EXECUTING:
          case esri.tasks.JobInfo.STATUS_WAITING:
          case esri.tasks.JobInfo.STATUS_NEW:
            var _gJS = this._getJobStatus;
            this._updateTimers[jobId] = setTimeout(function() { _gJS(jobId, single, callback, statusCallback, dfd); }, this.updateDelay);
            break;
          default:
            /*this.onJobComplete(jobInfo);
            if (callback) {
              callback(jobInfo);
            }*/
            this._successHandler([ jobInfo ], "onJobComplete", callback, dfd);
        }
      }
    },

    _getJobStatus: function(jobid, single, callback, statusCallback, dfd) {
      var _h = this._jobUpdateHandler;
      esri.request({
        url: this._url.path + "/jobs/" + jobid,
        content: dojo.mixin({}, this._url.query, { f:"json" }), //  { f:"json", token:this._url.query ? this._url.query.token : null },
        callbackParamName: "callback",
        load: function() { _h(arguments[0], arguments[1], single, callback, statusCallback, dfd); },
        error: this._errorHandler
      });
    },

    _getResultDataHandler: function(response, io, callback, errback, dfd) {
      try {
        var result = this._decode(response);
        
        /*this.onGetResultDataComplete(result);
        if (callback) {
          callback(result);
        }*/
       
        this._successHandler([ result ], "onGetResultDataComplete", callback, dfd);
      }
      catch (err) {
        this._errorHandler(err, errback, dfd);
      }
    },

    getResultData: function(/*String*/ jobId, /*String*/ resultName, /*Function?*/ callback, /*Function?*/ errback) {
      var _r = this._getResultDataHandler,
          _e = this._errorHandler;
      
      var dfd = new dojo.Deferred(esri._dfdCanceller);
      
      dfd._pendingDfd = esri.request({
        url: this._url.path + "/jobs/" + jobId + "/results/" + resultName,
        content: dojo.mixin({}, this._url.query, { f:"json", returnType:"data" }),
        callbackParamName: "callback",
        load: function(r, i) { _r(r, i, callback, errback, dfd); },
        error: function(r) { _e(r, errback, dfd); }
      });
      
      return dfd;
    },

    checkJobStatus: function(/*String*/ jobId, /*Function?*/ callback, /*Function?*/ errback) {
      var _h = this._jobUpdateHandler,
          _e = this._errorHandler;
          
      var dfd = new dojo.Deferred(esri._dfdCanceller);
          
      dfd._pendingDfd = esri.request({
        url: this._url.path + "/jobs/" + jobId,
        content: dojo.mixin({}, this._url.query, { f:"json" }),
        callbackParamName: "callback",
        load: function(r, i) { _h(r, i, true, null, callback, dfd); },
        error: function(r) { _e(r, errback, dfd); }
      });
      
      return dfd;
    },
    
    cancelJob: function(/*String*/ jobId, /*Function?*/ callback, /*Function?*/ errback) {
      var _e = this._errorHandler;
          
      var dfd = new dojo.Deferred(esri._dfdCanceller);
          
      dfd._pendingDfd = esri.request({
        url: this._url.path + "/jobs/" + jobId + "/cancel",
        content: dojo.mixin({}, this._url.query, { f:"json" }),
        callbackParamName: "callback",
        load: dojo.hitch(this, function(r, i) {
                               this._successHandler([ r ], "onJobCancel", callback, dfd); 
                             }),
        error: function(r) { _e(r, errback, dfd); }
      });
      
      return dfd;
    },

    execute: function(/*Object*/ params, /*Function?*/ callback, /*Function?*/ errback, context) {
      var outSR = this._getOutSR();
      var assembly = context.assembly,
          _params = this._gpEncode(
                                 dojo.mixin({},
                                            this._url.query,
                                            { f:"json",
                                              "env:outSR": (outSR ? (outSR.wkid || dojo.toJson(outSR.toJson())): null),
                                              "env:processSR": (this.processSpatialReference ? (this.processSpatialReference.wkid || dojo.toJson(this.processSpatialReference.toJson()))  : null)
                                            },
                                            params
                                           ),
                                  null,
                                  assembly && assembly[0]
                                ),
          _h = this._executeHandler,
          _e = this._errorHandler;

      return esri.request({
        url: this._url.path + "/execute",
        content: _params,
        callbackParamName: "callback",
        load: function(r, i) { _h(r, i, callback, errback, context.dfd); },
        error: function(r) { _e(r, errback, context.dfd); }
      });
    },

    _executeHandler: function(response, io, callback, errback, dfd) {
      try {
        var results = response.results,
            i, il,
            messages = response.messages;
          
        for (i=0, il=results.length; i<il; i++) {
          results[i] = this._decode(results[i]);
        }

        for (i=0, il=messages.length; i<il; i++) {
          messages[i] = new esri.tasks.GPMessage(messages[i]);
        }

        /*this.onExecuteComplete(results, messages);
        if (callback) {
          callback(results, messages);
        }*/
       
        this._successHandler([ results, messages ], "onExecuteComplete", callback, dfd);
      }
      catch (err) {
        this._errorHandler(err, errback, dfd);
      }
    },

//    getInput: function(/*String*/ jobId, /*String*/ parameterName, /*function?*/ callback) {
//    },

    _getResultImageHandler: function(response, io, callback, errback, dfd) {
      try {
        var result = this._decode(response);
        
        /*this.onGetResultImageComplete(result);
        if (callback) {
          callback(result);
        }*/
        
        this._successHandler([ result ], "onGetResultImageComplete", callback, dfd);
      }
      catch (err) {
        this._errorHandler(err, errback, dfd);
      }
    },

    getResultImage: function(/*String*/ jobId, /*String*/ resultName, /*esri.layers.ImageParameters*/ imageParams, /*function?*/ callback, /*Function?*/ errback) {
      var _r = this._getResultImageHandler,
          _e = this._errorHandler,
          _params = this._gpEncode(dojo.mixin({}, this._url.query, { f:"json" }, imageParams.toJson()));

      var dfd = new dojo.Deferred(esri._dfdCanceller);

      dfd._pendingDfd = esri.request({
        url: this._url.path + "/jobs/" + jobId + "/results/" + resultName,
        content: _params,
        callbackParamName: "callback",
        load: function(r, i) { _r(r, i, callback, errback, dfd); },
        error: function(r) { _e(r, errback, dfd); }
      });
      
      return dfd;
    },

    cancelJobStatusUpdates: function(/*String*/ jobId) {
      //summary: Cancels the timer object created to check job status.
      // Cancelling job timer, will cancel status & job complete callbacks.
      clearTimeout(this._updateTimers[jobId]);
      this._updateTimers[jobId] = null;
    },

    getResultImageLayer: function(/*String*/ jobId, /*String*/ resultName, /*esri.layers.ImageParameters*/ imageParams, /*Function?*/ callback) {
      var url = this._url.path + "/jobs/" + jobId + "/results/" + resultName;
      if (this._url.query) {
        url += "?" + dojo.objectToQuery(this._url.query);
      }

      var layer = new esri.tasks._GPResultImageLayer(url, { imageParameters:imageParams }, true);
      this.onGetResultImageLayerComplete(layer);
      if (callback) {
        callback(layer);
      }
      return layer;
    },

    //events
    onStatusUpdate: function() {
      //summary: Event fired when a status check is made
      // arguments[0]: esri.tasks.GPJobStatus: Status message
    },

    onJobComplete: function() {
      //summary: Event fired when submitJob completed.
      // arguments[0]: esri.tasks.JobInfo
    },

    onExecuteComplete: function() {
      //summary: Event fired when a GP task completes synchronous execution
      // arguments[0]: Boolean: Whether GP task completed successfully
      // arguments[1]: { type:String, description:String }[]: Array of messages
      // arguments[2]: esri.tasks.ParameterValue[]: GP job results
    },

//    onInputComplete: function() {
//    },

    onGetResultDataComplete: function() {
      //summary: Event fired when result data is successfully retrieved
      // arguments[0]: esri.tasks.ParameterValue: GP job result
    },

    onGetResultImageComplete: function() {
      //summary: Event fired when result image is successfully retrieved
      // arguments[0]: esri.layers.MapImage: Map image returned from server
    },

    onGetResultImageLayerComplete: function() {
      //summary: Event fired when result image layer is successfull created
      // arguments[0]: esri.layers._GPResultImageLayer
    },
    
    onJobCancel: function() {
      //summary: Event fired when cancel job operation finished
      // arguments[0]: has two properties, jobID and jobStatus, which is a message indicating if the cancellation is successful or not
    }
  }
);

esri._createWrappers("esri.tasks.Geoprocessor");

dojo.declare("esri.tasks.JobInfo", null, {
    constructor: function(/*Object*/ status) {
      this.messages = [];
      dojo.mixin(this, status);

      var messages = this.messages;
      for (var i=0, il=messages.length; i<il; i++) {
        messages[i] = new esri.tasks.GPMessage(messages[i]);
      }
    },

    jobId: "",
    jobStatus: ""
  }
);

dojo.mixin(esri.tasks.JobInfo, {
  STATUS_CANCELLED:"esriJobCancelled", STATUS_CANCELLING:"esriJobCancelling", STATUS_DELETED:"esriJobDeleted", STATUS_DELETING:"esriJobDeleting",
  STATUS_EXECUTING:"esriJobExecuting", STATUS_FAILED:"esriJobFailed", STATUS_NEW:"esriJobNew", STATUS_SUBMITTED:"esriJobSubmitted",
  STATUS_SUCCEEDED:"esriJobSucceeded", STATUS_TIMED_OUT:"esriJobTimedOut", STATUS_WAITING:"esriJobWaiting"
});

dojo.declare("esri.tasks.GPMessage", null, {
    constructor: function(/*Object*/ message) {
      dojo.mixin(this, message);
    }
  }
);

dojo.mixin(esri.tasks.GPMessage, {
  TYPE_INFORMATIVE: "esriJobMessageTypeInformative",
  TYPE_PROCESS_DEFINITION: "esriJobMessageTypeProcessDefinition", 
  TYPE_PROCESS_START: "esriJobMessageTypeProcessStart", 
  TYPE_PROCESS_STOP: "esriJobMessageTypeProcessStop",
  TYPE_WARNING: "esriJobMessageTypeWarning", 
  TYPE_ERROR: "esriJobMessageTypeError", 
  TYPE_EMPTY: "esriJobMessageTypeEmpty", 
  TYPE_ABORT: "esriJobMessageTypeAbort"
});

dojo.declare("esri.tasks.LinearUnit", null, {
    constructor: function(/*Object*/ json) {
      if (json) {
        dojo.mixin(this, json);
      }
    },

    distance: 0,
    units: null,

    toJson: function() {
      var json = {};
      if (this.distance) {
        json.distance = this.distance;
      }
      if (this.units) {
        json.units = this.units;
      }
      return json;
    }
  }
);

dojo.declare("esri.tasks.DataFile", null, {
    constructor: function(/*Object*/ json) {
      if (json) {
        dojo.mixin(this, json);
      }
    },
    
    url: null,
    itemID: null,

    toJson: function() {
      var json = {};
      if (this.url) {
        json.url = this.url;
      }
      if (this.itemID) {
        json.itemID = this.itemID;
      }
      return json;
    }
  }
);

dojo.declare("esri.tasks.RasterData", null, {
    constructor: function(/*Object*/ json) {
      if (json) {
        dojo.mixin(this, json);
      }
    },

    url: null,
    format: null,
    itemID: null,

    toJson: function() {
      var json = {};
      if (this.url) {
        json.url = this.url;
      }
      if (this.format) {
        json.format = this.format;
      }
      if (this.itemID) {
        json.itemID = this.itemID;
      }
      return json;
    }
  }
);

dojo.declare("esri.tasks.Date", null, {
    constructor: function(/*Object*/ json) {
      if (json) {
        if (json.format) {
          this.format = json.format;
        }
        this.date = dojo.date.locale.parse(json.date, { selector:"date", datePattern:this.format });
      }
    },

    date: new Date(),
    format: "EEE MMM dd HH:mm:ss zzz yyyy",

    toJson: function() {
      return {
        date: dojo.date.locale.format(this.date, { selector:"date", datePattern:this.format }),
        format: this.format
      };
    }
  }
);

dojo.declare("esri.tasks.ParameterValue", null, {
    constructor: function(/*Object*/ json) {
      dojo.mixin(this, json);
    }
  }
);

dojo.declare("esri.tasks._GPResultImageLayer", esri.layers.ArcGISDynamicMapServiceLayer, {
    constructor: function(url, options) {
      if (options && options.imageParameters && options.imageParameters.extent) {
        this.initialExtent = (this.fullExtent = options.imageParameters.extent);
        this.spatialReference = this.initialExtent.spatialReference;
      }

      this.getImageUrl = dojo.hitch(this, this.getImageUrl);

      this.loaded = true;
      this.onLoad(this);
    },

    // overriden methods
    getImageUrl: function(extent, width, height, callback) {
      var path = this._url.path + "?",
          _p = this._params,
          sr = extent.spatialReference.wkid;

      callback(path + dojo.objectToQuery(dojo.mixin(_p,
                                                    {
                                                      f:"image",
                                                      bbox:dojo.toJson(extent.toJson()),
                                                      bboxSR:sr,
                                                      imageSR:sr,
                                                      size:width + "," + height
                                                    }
      )));
    }
  }
);

});
