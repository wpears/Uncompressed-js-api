//>>built
// wrapped by build app
define("esri/tasks/GenerateRendererTask", ["dijit","dojo","dojox","dojo/require!esri/tasks/_task,esri/symbol"], function(dijit,dojo,dojox){
dojo.provide("esri.tasks.GenerateRendererTask");

dojo.require("esri.tasks._task");
dojo.require("esri.symbol");

dojo.declare("esri.tasks.GenerateRendererTask", esri.tasks._Task, {
    constructor: function(/*String*/ url, options) {
      this.url = url;
      //workaround for arcgis.com hosted services, which use the name "generaterenderer".
      //10.1 final fixes the name. Now it's always "generateRenderer". Remove the workaround.
      /*var domainName = url.split("://")[1].split("/")[0].toLowerCase();
      if (domainName.indexOf("arcgis.com") !== -1) {
        this._url.path += "/generateRenderer";
      }
      else {
        this._url.path += "/generateDataClasses";
      }*/
      this._url.path += "/generateRenderer";
      this._handler = dojo.hitch(this, this._handler);
      this.source = options && options.source;
      this.gdbVersion = options && options.gdbVersion;
    },

    _handler: function(response, io, callback, errback, dfd) {
      try {
        var renderer = esri.renderer.fromJson(response);
        if (response.type === "classBreaks") {
          renderer._setMaxInclusiveness(true);
        }
        this._successHandler([ renderer ], "onComplete", callback, dfd);
      }
      catch (err) {
        this._errorHandler(err, errback, dfd);
      }
    },

    execute: function(/*esri.tasks.GenerateRendererParameters*/ params, /*Function?*/ callback, /*Function?*/ errback) {
      //summary: Execute the task and fire onComplete event. If callback is provided, the
      //         callback function will also be called.
      // params: esri.tasks.ClassificationDefinition and where clause Parameters to pass to server to execute task
      // callback: Function?: Function to be called once task completes
      // errback: Function?: Function to be called in case of server error
      var _params = dojo.mixin(params.toJson(), {f: "json"}),
          _h = this._handler,
          _e = this._errorHandler;
      if (this.source) {
        var layer = {source: this.source.toJson()};
        _params.layer = dojo.toJson(layer);
      }
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
      // arguments[0]: esri.renderer.renderer: renderer created.
    }
  }
);

dojo.declare("esri.tasks.GenerateRendererParameters", null, {
  classificationDefinition: null,
  where: null,
  toJson: function(){
    var json = {classificationDef: dojo.toJson(this.classificationDefinition.toJson()), where: this.where};
    return json;
  }
});

dojo.declare("esri.tasks.ClassificationDefinition", null, {
  type: null,
  baseSymbol:null,
  colorRamp: null,
  
  toJson: function(){
    var json = {};
    if (this.baseSymbol) {
      dojo.mixin(json, {baseSymbol: this.baseSymbol.toJson()});
    }
    if (this.colorRamp) {
      dojo.mixin(json, {colorRamp: this.colorRamp.toJson()});
    }
    return json;
  }
});

dojo.declare("esri.tasks.ClassBreaksDefinition", esri.tasks.ClassificationDefinition, {
  type: "classBreaksDef",
  classificationField: null,
  classificationMethod: null,
  breakCount: null,
  standardDeviationInterval: null,
  normalizationType: null,
  normalizationField: null,
  
  toJson: function(){
    var json = this.inherited(arguments);
    var classificationMethod;
    switch (this.classificationMethod.toLowerCase()) {
    case "natural-breaks":
      classificationMethod = "esriClassifyNaturalBreaks";
      break;
    case "equal-interval":
      classificationMethod = "esriClassifyEqualInterval";
      break;
    case "quantile":
      classificationMethod = "esriClassifyQuantile";
      break;
    case "standard-deviation":
      classificationMethod = "esriClassifyStandardDeviation";
      break;
    case "geometrical-interval":
      classificationMethod = "esriClassifyGeometricalInterval";
      break;
    default:
      classificationMethod = this.classificationMethod;
    }    
    dojo.mixin(json, {type: this.type, classificationField: this.classificationField, classificationMethod: classificationMethod, breakCount: this.breakCount});
    if (this.normalizationType) {
      var normalizationType;
      switch (this.normalizationType.toLowerCase()) {
      case "field":
        normalizationType = "esriNormalizeByField";
        break;
      case "log":
        normalizationType = "esriNormalizeByLog";
        break;
      case "percent-of-total":
        normalizationType = "esriNormalizeByPercentOfTotal";
        break;
      default:
        normalizationType = this.normalizationType;
      }
      dojo.mixin(json, {normalizationType: normalizationType});
    }
    if (this.normalizationField) {
      dojo.mixin(json, {normalizationField: this.normalizationField});
    }
    if (this.standardDeviationInterval) {
      dojo.mixin(json, {standardDeviationInterval: this.standardDeviationInterval});
    }
    return json;
  }
});

dojo.declare("esri.tasks.UniqueValueDefinition", esri.tasks.ClassificationDefinition, {
  type: "uniqueValueDef",
  attributeField: null,
  attributeField2: null,
  attributeField3: null,
  fieldDelimiter: null,
  
  toJson: function () {
    var json = this.inherited(arguments);
    this.uniqueValueFields = [];
    if (this.attributeField) {
      this.uniqueValueFields.push(this.attributeField);
    }
    if (this.attributeField2) {
      this.uniqueValueFields.push(this.attributeField2);
    }
    if (this.attributeField3) {
      this.uniqueValueFields.push(this.attributeField3);
    }
    dojo.mixin(json, {type: this.type, uniqueValueFields: this.uniqueValueFields});
    if (this.fieldDelimiter) {
      dojo.mixin(json, {fieldDelimiter: this.fieldDelimiter});
    }
    return json;
  }
});

dojo.declare("esri.tasks.ColorRamp", null, {
  type: null
});

dojo.declare("esri.tasks.AlgorithmicColorRamp", esri.tasks.ColorRamp, {
  type: "algorithmic",
  fromColor: null,
  toColor: null,
  algorithm: null,
  
  toJson: function (){
    var algorithm;
    switch (this.algorithm.toLowerCase()) {
    case "cie-lab":
      algorithm = "esriCIELabAlgorithm";
      break;
    case "hsv":
      algorithm = "esriHSVAlgorithm";
      break;
    case "lab-lch":
      algorithm = "esriLabLChAlgorithm";
      break;
    default:
    }
    var json = {type: "algorithmic", algorithm: algorithm};
    /*json.fromColor = [];
    json.fromColor.push(this.fromColor.r);
    json.fromColor.push(this.fromColor.g);
    json.fromColor.push(this.fromColor.b);
    json.fromColor.push(this.fromColor.a);
    json.toColor = [];
    json.toColor.push(this.toColor.r);
    json.toColor.push(this.toColor.g);
    json.toColor.push(this.toColor.b);
    json.toColor.push(this.toColor.a);*/
    json.fromColor = esri.symbol.toJsonColor(this.fromColor);
    json.toColor = esri.symbol.toJsonColor(this.toColor);
    return json;
  }
});

dojo.declare("esri.tasks.MultipartColorRamp", esri.tasks.ColorRamp, {
  type: "multipart",
  colorRamps: [],
  
  toJson: function () {
    var colorRampsJson = dojo.map(this.colorRamps, function(colorRamp){return colorRamp.toJson();});
    var json = {type: "multipart", colorRamps: colorRampsJson};
    return json;
  }
});
});
