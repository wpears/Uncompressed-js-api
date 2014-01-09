//>>built
// wrapped by build app
define("esri/layers/agsimageservice", ["dijit","dojo","dojox","dojo/require!esri/layers/dynamic,esri/layers/agscommon,esri/utils"], function(dijit,dojo,dojox){
dojo.provide("esri.layers.agsimageservice");

dojo.require("esri.layers.dynamic");
dojo.require("esri.layers.agscommon");
dojo.require("esri.utils");

dojo.declare("esri.layers.ArcGISImageServiceLayer", esri.layers.DynamicMapServiceLayer, {
    constructor: function(url, options) {
      this._url = esri.urlToObject(url);

      var imgParams = options && options.imageServiceParameters;
      this.format = imgParams && imgParams.format;
      this.interpolation = imgParams ? imgParams.interpolation : null;
      this.compressionQuality = imgParams ? imgParams.compressionQuality : null;
      this.bandIds = imgParams ? imgParams.bandIds : null;
      this.mosaicRule = imgParams ? imgParams.mosaicRule : null;
      this.renderingRule = imgParams ? imgParams.renderingRule : null;
      
      this._params = dojo.mixin({},
                                this._url.query,
                                {
                                  f:"image",
                                  interpolation: this.interpolation,
                                  format: this.format,
                                  compressionQuality: this.compressionQuality,
                                  bandIds: this.bandIds ? this.bandIds.join(",") : null
                                },
                                imgParams ? imgParams.toJson() : {});

      this._initLayer = dojo.hitch(this, this._initLayer);
      
      this.useMapImage = (options && options.useMapImage) || false;

      this._loadCallback = options && options.loadCallback;
      var resourceInfo = options && options.resourceInfo;
      if (resourceInfo) {
        this._initLayer(resourceInfo);
      }
      else {
        esri.request({
          url: this._url.path,
          content: dojo.mixin({ f:"json" }, this._url.query),
          callbackParamName: "callback",
          load: this._initLayer,
          error: this._errorHandler
        });
      }
    },
    
    disableClientCaching: false,
    
    _initLayer: function(response, io) {
      this._findCredential();

      // See esri.request for context regarding "_ssl"
      var ssl = (this.credential && this.credential.ssl) || (response && response._ssl);
      if (ssl) {
        this._useSSL();
      }

      dojo.mixin(this, response);
      this.initialExtent = (this.fullExtent = this.extent = (new esri.geometry.Extent(response.extent)));
      this.spatialReference = this.initialExtent.spatialReference;

      // this.pixelSize = { width:parseFloat(this.pixelSizeX), height:parseFloat(this.pixelSizeY) }; //new esri.geometry.Point(parseFloat(this.pixelSizeX), parseFloat(this.pixelSizeY));
      this.pixelSizeX = parseFloat(this.pixelSizeX);
      this.pixelSizeY = parseFloat(this.pixelSizeY);

      var i, il, mins = this.minValues,
          maxs = this.maxValues,
          means = this.meanValues,
          stdvs = this.stdvValues,
          bs = (this.bands = []);
      for (i=0, il=this.bandCount; i<il; i++) {
        bs[i] = { min:mins[i], max:maxs[i], mean:means[i], stddev:stdvs[i] };
      }

      // .NET REST has a bug at 10.0 SP1 where it returns timeInfo with null timeExtent,
      // for a layer that is not time-aware. We need to workaround it and set timeInfo
      // to null for that case.
      var timeInfo = this.timeInfo;
      this.timeInfo = (timeInfo && timeInfo.timeExtent) ? new esri.layers.TimeInfo(timeInfo) : null;

      var fieldObjs = this.fields = [];
      var fields = response.fields;
      if (fields) {
          for (i = 0; i < fields.length; i++) {
              fieldObjs.push(new esri.layers.Field(fields[i]));
          }
      }

      // REST added currentVersion property to some resources
      // at 10 SP1
      this.version = response.currentVersion;
      
      if (!this.version) {
        var ver;
        
        if (
          "fields" in response || "objectIdField" in response || 
          "timeInfo" in response 
        ) {
          ver = 10;
        }
        else {
          ver = 9.3; // or could be 9.3.1
        }
        
        this.version = ver;
      } // version
      
      this.loaded = true;
      this.onLoad(this);
      
      var callback = this._loadCallback;
      if (callback) {
        delete this._loadCallback;
        callback(this);
      }
    },

    getImageUrl: function(extent, width, height, callback) {
      var sr = extent.spatialReference.wkid || dojo.toJson(extent.spatialReference.toJson());
      delete this._params._ts;
      
      var path = this._url.path + "/exportImage?";

      dojo.mixin(
        this._params,
        {
          bbox: extent.xmin + "," + extent.ymin + "," + extent.xmax + "," + extent.ymax, //dojo.toJson(extent.toJson()),
          imageSR: sr,
          bboxSR: sr,
          size: width + "," + height
        },
        this.disableClientCaching ? { _ts: new Date().getTime() } : {}
      );
      
      var token = (this._params.token = this._getToken()),
          requestString = esri._getProxiedUrl(path + dojo.objectToQuery(dojo.mixin(this._params, { f:"image" })));
      
      if ((requestString.length > esri.config.defaults.io.postLength) || this.useMapImage) {
        this._jsonRequest = esri.request({
          url: path,
          content: dojo.mixin(this._params, { f:"json" }),
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
          
          error: this._errorHandler
        });
      }
      else {
        callback(requestString);
      }
    },

    // setFormat: function(/*String*/ format) {
    //   this.format = (this._params.format = format);
    //   this.refresh();
    // },

    setInterpolation: function(/*String*/ interpolation, /*Boolean?*/ doNotRefresh) {
      this.interpolation = (this._params.interpolation = interpolation);
      if (!doNotRefresh) {
        this.refresh(true);
      }
    },

    setCompressionQuality: function(/*Number*/ compQual, /*Boolean?*/ doNotRefresh) {
      this.compressionQuality = (this._params.compressionQuality = compQual);
      if (!doNotRefresh) {
        this.refresh(true);
      }
    },

    setBandIds: function(/*Number[]*/ ids, /*Boolean?*/ doNotRefresh) {
      this.bandIds = ids;
      this._params.bandIds = ids.join(",");
      if (!doNotRefresh) {
        this.refresh(true);
      }
    },
    
    setDefaultBandIds: function(/*Boolean?*/ doNotRefresh) {
      this.bandIds = (this._params.bandIds = null);
      if (!doNotRefresh) {
        this.refresh(true);
      }
    },
    
    setDisableClientCaching: function(/*boolean*/ caching) {
      this.disableClientCaching = caching;
    },
    
    setMosaicRule : function(/*MosaicRule*/ mosaicRule, /*Boolean?*/ doNotRefresh){
      this.mosaicRule = mosaicRule; 
      this._params.mosaicRule = dojo.toJson(mosaicRule.toJson());
      if (!doNotRefresh) {
        this.refresh(true);
      }
    },
    
    setRenderingRule: function(/*RenderingRule*/ renderingRule, /*Boolean?*/ doNotRefresh){
      this.renderingRule = renderingRule; 
      this._params.renderingRule = dojo.toJson(renderingRule.toJson());
      if (!doNotRefresh) {
        this.refresh(true);
      }
    },
    
    setImageFormat: function(/*String*/ format, /*Boolean?*/ doNotRefresh) {
      this.format = (this._params.format = format);
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
    
    exportMapImage: function(/*esri.layers.ImageServiceParameters?*/ params, /*Function?*/ callback) {
      var m = esri.config.defaults.map,
          p = dojo.mixin({ size:m.width + "," + m.height }, this._params, params ? params.toJson(this.normalization) : {}, { f:"json" });
      delete p._ts;
      
      this._exportMapImage(this._url.path + "/exportImage", p, callback);
    }
  }
);

dojo.declare("esri.layers.ImageServiceParameters", null, {
    extent: null,
    width: null,
    height: null,
    imageSpatialReference: null,
    format: null,
    interpolation: null,
    compressionQuality: null,
    bandIds: null,
    timeExtent: null,
    mosaicRule:null,
    renderingRule:null,
    noData: null,
    
    toJson: function(doNormalize) {
      var ext = this.bbox || this.extent;
      ext = ext && doNormalize && ext._normalize(true);

      var wkid = ext ? (ext.spatialReference.wkid || dojo.toJson(ext.spatialReference.toJson())) : null,
          imageSR = this.imageSpatialReference,
          json = {
                   bbox: ext ? (ext.xmin + "," + ext.ymin + "," + ext.xmax + "," + ext.ymax) : null,
                   bboxSR: wkid,
                   size: (this.width !== null && this.height !== null ? this.width + "," + this.height : null),
                   imageSR: (imageSR ? (imageSR.wkid || dojo.toJson(imageSR.toJson())) : wkid),
                   format: this.format,
                   interpolation: this.interpolation,
                   compressionQuality: this.compressionQuality,
                   bandIds: this.bandIds ? this.bandIds.join(",") : null,                 
                   mosaicRule: this.mosaicRule ? dojo.toJson(this.mosaicRule.toJson()) : null,
                   renderingRule: this.renderingRule ? dojo.toJson(this.renderingRule.toJson()) : null,
                   noData: this.noData
                 };

      var timeExtent = this.timeExtent;
      json.time = timeExtent ? timeExtent.toJson().join(",") : null;

      return esri.filter(json, function(value) {
        if (value !== null) {
          return true;
        }
      });
    }
  }
);

dojo.mixin(esri.layers.ImageServiceParameters, {
  INTERPOLATION_BILINEAR: "RSP_BilinearInterpolation", INTERPOLATION_CUBICCONVOLUTION: "RSP_CubicConvolution",
  INTERPOLATION_MAJORITY: "RSP_Majority", INTERPOLATION_NEARESTNEIGHBOR: "RSP_NearestNeighbor"
});

dojo.declare("esri.layers.MosaicRule", null, {
    method: null,
    where: null,
    sortField:null,
    sortValue:null,
    ascending:false,
    lockRasterIds:null,
    viewpoint:null,
    objectIds:null,
    operation:null,
    
    toJson: function() {
        var json = {
            mosaicMethod: this.method,
            where: this.where,
            sortField: this.sortField,
            sortValue: this.sortValue ? dojo.toJson(this.sortValue) : null,
            ascending: this.ascending,
            lockRasterIds: this.lockRasterIds,
            viewpoint: this.viewpoint ? this.viewpoint.toJson() : null,
            fids: this.objectIds,
            mosaicOperation: this.operation            
        };
        
        return esri.filter(json, function(value) {
        if (value !== null) {
          return true;
        }
      });    
    }                   
  }
);

dojo.mixin(esri.layers.MosaicRule, {
    METHOD_NONE: "esriMosaicNone", METHOD_CENTER: "esriMosaicCenter", METHOD_NADIR: "esriMosaicNadir", METHOD_VIEWPOINT: "esriMosaicViewpoint", 
    METHOD_ATTRIBUTE: "esriMosaicAttribute", METHOD_LOCKRASTER: "esriMosaicLockRaster", METHOD_NORTHWEST: "esriMosaicNorthwest", METHOD_SEAMLINE: "esriMosaicSeamline",
    OPERATION_FIRST: "MT_FIRST", OPERATION_LAST:"MT_LAST", OPERATION_MIN:"MT_MIN", OPERATION_MAX: "MT_MAX", OPERATION_MEAN: "MT_MEAN", OPERATION_BLEND:"MT_BLEND"    
});

dojo.declare("esri.layers.RasterFunction", null, {
    functionName: null,
    "arguments":null,
    variableName:null,
    
    toJson: function() {
        var json = {
            rasterFunction: this.functionName,
            rasterFunctionArguments: this["arguments"],
            variableName: this.variableName                
        };
        
        return esri.filter(json, function(value) {
        if (value !== null) {
          return true;
        }
      });       
    }    
  }
);

});
