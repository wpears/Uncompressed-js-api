//>>built
// wrapped by build app
define("esri/layers/agsdynamic", ["dijit","dojo","dojox","dojo/require!esri/layers/dynamic,esri/layers/agscommon,esri/_time"], function(dijit,dojo,dojox){
dojo.provide("esri.layers.agsdynamic");

dojo.require("esri.layers.dynamic");
dojo.require("esri.layers.agscommon");
dojo.require("esri._time");

dojo.declare("esri.layers.ArcGISDynamicMapServiceLayer", [esri.layers.DynamicMapServiceLayer, esri.layers.ArcGISMapServiceLayer], {
    constructor: function(url, options) {
      var imgParams = options && options.imageParameters,
          dh = dojo.hitch;

      if (imgParams) {
        var ldef = imgParams.layerDefinitions;
        if (ldef) {
          this.setLayerDefinitions(ldef);
        }
        if (imgParams.layerOption === esri.layers.ImageParameters.LAYER_OPTION_SHOW) {
          this.visibleLayers = [].concat(imgParams.layerIds);
        }
      }
      
      this._setIsPNG32 = dh(this, this._setIsPNG32);
      
      this.dpi = (imgParams && imgParams.dpi) || 96;
      this.imageFormat = (imgParams && imgParams.format) || "png8";
      this.imageTransparency = (imgParams && imgParams.transparent === false) ? false : true;
      this._setIsPNG32();
      this.gdbVersion = options && options.gdbVersion;
      this._params.gdbVersion = this.gdbVersion;

      dojo.mixin( this._params,
                  this._url.query,
                  {
                    dpi: this.dpi,
                    transparent: this.imageTransparency,
                    format: this.imageFormat
                  },
                  imgParams ? imgParams.toJson() : {});

      this.getImageUrl = dh(this, this.getImageUrl);
      this._initLayer = dh(this, this._initLayer);
      this._load = dh(this, this._load);
      
      this.useMapImage = options ? options.useMapImage : false;
      if (this.useMapImage) {
        this._imageExportHandler = dh(this, this._imageExportHandler);
      }
      
      this._loadCallback = options && options.loadCallback;
      var resourceInfo = options && options.resourceInfo;
      if (resourceInfo) {
        this._initLayer(resourceInfo);
      }
      else if (arguments[2] === undefined || arguments[2] === false) {
        this._load();
      }
    },

    disableClientCaching: false,
    layerDefinitions: null,
    
    _initLayer: function(response, io) {
      this.inherited(arguments);
      
      if (response.timeInfo) {
          this.timeInfo = new esri.layers.TimeInfo(response.timeInfo);
      }
      
      this.loaded = true;
      this.onLoad(this);
      
      var callback = this._loadCallback;
      if (callback) {
        delete this._loadCallback;
        callback(this);
      }
    },
    
    getImageUrl: function(extent, width, height, callback) {
      var path = this._url.path + "/export?",
          _p = this._params,
          sr = extent.spatialReference.wkid || dojo.toJson(extent.spatialReference.toJson()),
          _errorHandler = this._errorHandler;
      delete _p._ts;

      dojo.mixin( _p,
                  {
                    bbox: extent.xmin + "," + extent.ymin + "," + extent.xmax + "," + extent.ymax, //dojo.toJson(extent.toJson()),
                    bboxSR: sr,
                    imageSR: sr,
                    size: width + "," + height
                  },
                  this.disableClientCaching ? { _ts: new Date().getTime() } : {}
                );

      if (_p.layerDefs) {
        var defs = _p.layerDefs;
        delete _p.layerDefs;
        dojo.mixin(_p, { layerDefs:defs });
      }
      
      var token = (_p.token = this._getToken()),
          requestString = esri._getProxiedUrl(path + dojo.objectToQuery(dojo.mixin({}, _p, { f:"image" })));

      if ((requestString.length > esri.config.defaults.io.postLength) || this.useMapImage) {
        //var _h = this._imageExportHandler;
        
        // we need a reference to this request, so that we
        // we can cancel it if necessary.
        // see also: _onExtentChangeHandler in dynamic.js
        // TODO
        // Ideally, we should let this class completely
        // manage the cancellation, instead of dynamic.js.
        // I'm postponing this effort for another time, as this is
        // an internal affair. In general, we could manage the contract
        // between DynamicMapServiceLayer and its subclasses better, not 
        // just from the user perspective but as a discipline for
        // inter-module contracts (as opposed to magic/dangling assumptions).
        this._jsonRequest = esri.request({
          url: path,
          content: dojo.mixin(_p, { f:"json" }),
          callbackParamName: "callback",
          
          load: function(response, io) {
            var href = response.href;
            
            // 10.1 servers require token to access output directory URLs as well
            if (token) {
              href += (
                href.indexOf("?") === -1 ? 
                  ("?token=" + token) : 
                  ("&token=" + token)
              );
            }
            
            //console.log("token=" + token);
            callback(esri._getProxiedUrl(href));
          },
          
          error: _errorHandler //esri.config.defaults.io.errorHandler //this._errorHandler
        });
      }
      else {
        callback(requestString);
      }
    },
    
    /*_imageExportHandler: function(response, io, callback) {
      callback(esri._getProxiedUrl(response.href));
    },*/

    _setIsPNG32: function() {
      var format = this.imageFormat.toLowerCase();
      var isIE = dojo.isIE;
      this.isPNG32 = isIE && isIE === 6 && (format === "png32" || format === "png24") && this.imageTransparency;
    },
    
    _setTime: function(timeExtent) {
      // This method is a copy of _setTime in dynamic.js.
      // Re-implemented here for the sole purpose of applying
      // the workaround below.
      
      //console.log("testing..");
      var timeInfo = this.timeInfo,
          time = (this._params.time = timeExtent ? timeExtent.toJson().join(",") : null);
      
      // Workaround for server version < 10.02 where "some" time-aware
      // layers do not return a valid image if "time" parameter is absent
      if (this.version < 10.02 && timeInfo) {
        if (!time) {
          // When there is no "time", go ahead and turn
          // time for all sub-layers
          
          var layerInfos = this.layerInfos;
              
          if (layerInfos) {
            var current = this.layerTimeOptions,
                dupOptions = current ? current.slice(0) : [], 
                ids = [];
            
            // Get all the sub-layer ids
            dojo.forEach(layerInfos, function(info) {
              if (!info.subLayerIds) {
                ids.push(info.id);
              }
            });
            //console.log("ids: ", ids);
            
            if (ids.length) {
              // Let's make sure all sub-layers have a corresponding
              // layer time options object
              dojo.forEach(ids, function(id) {
                if (!dupOptions[id]) {
                  var opt = new esri.layers.LayerTimeOptions();
                  opt.useTime = false;
                  dupOptions[id] = opt;
                }
              });
              
              this._params.layerTimeOptions = esri._serializeTimeOptions(dupOptions, ids);
            }
          } // layerInfos
        }
        else {
          // Restore layer time options to user-defined value
          this._params.layerTimeOptions = esri._serializeTimeOptions(this.layerTimeOptions);
        }
      }
      
      // Workaround for server version >= 10.02 where time=null,null
      // will give all the features
      if (this.version >= 10.02 && timeInfo) {
        if (!time && !timeInfo.hasLiveData) {
          this._params.time = "null,null";
        }
        
        // From REST API Reference at 10.1:
        // hasLiveData returns a boolean value. If true, export and identify 
        // operations will default the value for time parameter to be 
        // [<current server time - defaultTimeWindow>, <current server time>]
        // http://nil/rest-docs/mapserver.html
      }
      
      // It is possible that we don't need this workaround beyond
      // 10.02 but not sure if this will be completely fixed at 10.1
    },
    
    setDPI: function(/*Number*/ dpi, /*Boolean?*/ doNotRefresh) {
      this.dpi = (this._params.dpi = dpi);
      if (!doNotRefresh) {
        this.refresh(true);
      }
    },

    setImageFormat: function(/*String*/ format, /*Boolean?*/ doNotRefresh) {
      this.imageFormat = (this._params.format = format);
      this._setIsPNG32();
      if (!doNotRefresh) {
        this.refresh(true);
      }
    },
    
    setImageTransparency: function(/*Boolean*/ transparent, /*Boolean?*/ doNotRefresh) {
      this.imageTransparency = (this._params.transparent = transparent);
      this._setIsPNG32();
      if (!doNotRefresh) {
        this.refresh(true);
      }
    },
    
    setVisibleLayers: function(/*Number[]*/ layerIds, /*Boolean?*/ doNotRefresh) {
      this.visibleLayers = layerIds;
      this._params.layers = esri.layers.ImageParameters.LAYER_OPTION_SHOW + ":" + layerIds.join(",");
      this._updateDynamicLayers();
      if (!doNotRefresh) {
        this.refresh(true);
      }
    },

    setDefaultVisibleLayers: function(/*Boolean?*/ doNotRefresh) {
      this.visibleLayers = this._defaultVisibleLayers;
      this._params.layers = null;
      this._updateDynamicLayers();
      if (!doNotRefresh) {
        this.refresh(true);
      }
    },
    
    setLayerDefinitions: function(/*String[]*/ layerDefinitions, /*Boolean?*/ doNotRefresh) {
      this.layerDefinitions = layerDefinitions;

      this._params.layerDefs = esri._serializeLayerDefinitions(layerDefinitions);
      this._updateDynamicLayers();
      if (!doNotRefresh) {
        this.refresh(true);
      }
    },
    
    setDefaultLayerDefinitions: function(/*Boolean?*/ doNotRefresh) {
      this.layerDefinitions = this._params.layerDefs = null;
      this._updateDynamicLayers();
      if (!doNotRefresh) {
        this.refresh(true);
      }
    },
    
    setDisableClientCaching: function(/*boolean*/ caching) {
      this.disableClientCaching = caching;
    },
                  
    setLayerTimeOptions : function(/*esri.layers.LayerTimeOptions*/ layerTimeOptions, /*Boolean?*/ doNotRefresh) {
      this.layerTimeOptions = layerTimeOptions;
      
      /*var layerTimeOptionsArr = [];
      
      dojo.forEach(layerTimeOptions, function(lyrTimeOption, i){
         if (lyrTimeOption) {
             layerTimeOptionsArr.push(i + ":" + lyrTimeOption.toJson());
         }          
      });
                  
      this._params.layerTimeOptions = (layerTimeOptionsArr.length > 0) ? layerTimeOptionsArr.join(",") : null;*/               
      
      this._params.layerTimeOptions = esri._serializeTimeOptions(layerTimeOptions);
      this._updateDynamicLayers();
      
      if (!doNotRefresh) {
        this.refresh(true);
      }
    },
            
    refresh: function(/*Boolean?*/ _noCacheOverride) {
      if (_noCacheOverride) {
        this.inherited(arguments);
      }
      else {
        var dc = this.disableClientCaching;
        this.disableClientCaching = true;
        this.inherited(arguments);
        this.disableClientCaching = dc;
      }
    },
    
    /*******************************
    * dynamic layer related methods
    *******************************/
    setLayerDrawingOptions: function(/*array of esri.layers.LayerDrawingOptions*/ layerDrawingOptions, /*Boolean?*/ doNotRefresh) {
      this.layerDrawingOptions = layerDrawingOptions; 
      this._updateDynamicLayers();
      
      if (!doNotRefresh) {
        this.refresh(true);
      }
    },
    
    setDynamicLayerInfos: function(/*array of esri.layers.DynamicLayerInfo*/ dynamicLayerInfos, /*Boolean?*/ doNotRefresh) {            
      if (dynamicLayerInfos && dynamicLayerInfos.length > 0) {
        this.dynamicLayerInfos = dynamicLayerInfos;
        this.visibleLayers = esri._getDefaultVisibleLayers(dynamicLayerInfos);
      }
      else {
        this.dynamicLayerInfos = this.layerDrawingOptions = null;
      }
      this._updateDynamicLayers();
      
      if (!doNotRefresh) {
        this.refresh(true);
      }
    },
    
    createDynamicLayerInfosFromLayerInfos: function () {
      var dynamicLayerInfos = [],
        dynamicLayerInfo,
        mapLayerSource;
      dojo.forEach(this.layerInfos, function (layerInfo, idx) {
        dynamicLayerInfo = new esri.layers.DynamicLayerInfo(layerInfo.toJson());
        dynamicLayerInfo.source = new esri.layers.LayerMapSource({mapLayerId: layerInfo.id});       
        dynamicLayerInfos.push(dynamicLayerInfo);
      });
      return dynamicLayerInfos;
    },
    
    _onDynamicLayersChange: function () {},

    _updateDynamicLayers: function () {
      //only when this.dynamicLayerInfos or this.layerDrawingOptions presents, dynamicLayers need to be sent to server.
      if ((this.dynamicLayerInfos && this.dynamicLayerInfos.length > 0) || (this.layerDrawingOptions && this.layerDrawingOptions.length > 0)) {
        var result,
          infos = this.dynamicLayerInfos || this.layerInfos,
          dynLayerObjs = [],
          mapScale = this._map && esri.geometry.getScale(this._map),
          visibleLayers = this.visibleLayers,
          layersInScale = mapScale ? esri._getLayersForScale(mapScale, infos) : visibleLayers;

        dojo.forEach(infos, function (info) {
          if (!info.subLayerIds) // skip group layers
          {
            var layerId = info.id;
            // if visible and in scale
            if (dojo.indexOf(visibleLayers, layerId) !== -1 && dojo.indexOf(layersInScale, layerId) !== -1) {
              var dynLayerObj = {
                id: layerId
              };
              if (this.dynamicLayerInfos) {
                dynLayerObj.source = info.source && info.source.toJson();
              } else {
                dynLayerObj.source = {
                  type: "mapLayer",
                  mapLayerId: layerId
                };
              }
              var definitionExpression;
              if (this.layerDefinitions && this.layerDefinitions[layerId]) {
                definitionExpression = this.layerDefinitions[layerId];
              }
              if (definitionExpression) {
                dynLayerObj.definitionExpression = definitionExpression;
              }
              var layerDrawingOptions;
              if (this.layerDrawingOptions && this.layerDrawingOptions[layerId]) {
                layerDrawingOptions = this.layerDrawingOptions[layerId];
              }
              if (layerDrawingOptions) {
                dynLayerObj.drawingInfo = layerDrawingOptions.toJson();
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
        //if dynamic layers should not show any layers, for example, if the scale range doesn't allow to draw the layer,
        //then it has to send an array with an empty object to prevent server from drawing the default existing map layers.
        //Note: this is a server bug.
        if (result === "[]") {
          result = "[{}]";
        }
        if (!this._params.dynamicLayers || (this._params.dynamicLayers.length !== result.length || this._params.dynamicLayers !== result)) {
          this._params.dynamicLayers = result;
          this._onDynamicLayersChange(this._params.dynamicLayers);
        }
      }
      else {
        if (this._params.dynamicLayers) {
          this._params.dynamicLayers = null;
          this._onDynamicLayersChange(null);
        }
        else {
          this._params.dynamicLayers = null;
        }
      }
    },

    _onExtentChangeHandler: function (extent, delta, levelChange) {
      if (levelChange) {
        this._updateDynamicLayers();
      }
      this.inherited(arguments);
    },
    
    _setMap: function(map, container, index) {
      this._map = map;
      this._updateDynamicLayers();
      return this.inherited(arguments);
    },
    /*******************************
    * end of dynamic layer related methods
    *******************************/
    
    //From ArcGIS Server 10.1, ExportImage supports gdbVersion
    onGDBVersionChange: function(){},
    
    setGDBVersion: function(/*String*/ gdbVersion, /*Boolean*/doNotRefresh){
      this.gdbVersion = gdbVersion;
      this._params.gdbVersion = gdbVersion;
      this.onGDBVersionChange();
      
      if (!doNotRefresh) {
        this.refresh(true);
      }
    },
    
    exportMapImage: function(/*esri.layers.ImageParameters?*/ params, /*function*/ callback) {
      var m = esri.config.defaults.map,
          p = dojo.mixin({ size:m.width + "," + m.height }, this._params, params ? params.toJson(this.normalization) : {}, { f:"json" });
      delete p._ts;

      //FIXME: .NET REST bug where layerDefs needs to be last query param.
      if (p.layerDefs) {
        var defs = p.layerDefs;
        delete p.layerDefs;
        dojo.mixin(p, { layerDefs:defs });
      }
      
      this._exportMapImage(this._url.path + "/export", p, callback);
    }
  }
);

dojo.declare("esri.layers.ImageParameters", null, {
    constructor: function() {
      this.layerDefinitions = [];
      this._bundle = dojo.i18n.getLocalization("esri", "jsapi");
    },
  
    bbox: null,
    extent: null,
    width: null,
    height: null,
    dpi: null,
    format: null,
    imageSpatialReference: null,
    layerOption: null,
    layerIds: null,
    transparent: null,
    timeExtent: null,
    layerTimeOptions: null,

    toJson: function(doNormalize) {
      if (this.bbox) {
        dojo.deprecated(this.declaredClass + " : " + this._bundle.layers.imageParameters.deprecateBBox);
      }

      var bb = this.bbox || this.extent;
      bb = bb && doNormalize && bb._normalize(true);
      
      var layerOption = this.layerOption,
          wkid = bb ? (bb.spatialReference.wkid || dojo.toJson(bb.spatialReference.toJson())) : null,
          imageSR = this.imageSpatialReference,
          json = {
            dpi: this.dpi,
            format: this.format,
            transparent: this.transparent,
            size: (this.width !== null && this.height !== null ? this.width + "," + this.height : null),
            bbox: (bb ? (bb.xmin + "," + bb.ymin + "," + bb.xmax + "," + bb.ymax) : null),
            bboxSR: wkid,
            layers: (layerOption ? layerOption + ":" + this.layerIds.join(",") : null),
            imageSR: (imageSR ? (imageSR.wkid || dojo.toJson(imageSR.toJson())) : wkid)
          };
      
      json.layerDefs = esri._serializeLayerDefinitions(this.layerDefinitions);
     
      var timeExtent = this.timeExtent;
      json.time = timeExtent ? timeExtent.toJson().join(",") : null;
     
      json.layerTimeOptions = esri._serializeTimeOptions(this.layerTimeOptions);
           
      return esri.filter(json, function(value) {
        if (value !== null) {
          return true;
        }
      });
    }
  }
);

dojo.mixin(esri.layers.ImageParameters, {
  LAYER_OPTION_SHOW: "show", LAYER_OPTION_HIDE: "hide", LAYER_OPTION_INCLUDE: "include", LAYER_OPTION_EXCLUDE: "exclude"
});

dojo.declare("esri.layers.MapImage", null, {
    constructor: function(/*Object*/ json) {
      dojo.mixin(this, json);
      this.extent = new esri.geometry.Extent(this.extent);
    }
  }
);
});
