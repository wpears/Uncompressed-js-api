//>>built
// wrapped by build app
define("esri/layers/agscommon", ["dijit","dojo","dojox","dojo/require!esri/geometry,esri/utils"], function(dijit,dojo,dojox){
dojo.provide("esri.layers.agscommon");

dojo.require("esri.geometry");
dojo.require("esri.utils");

dojo.declare("esri.layers.ArcGISMapServiceLayer", null, {
    constructor: function(url, options) {
      //layers: Array:
      this.layerInfos = [];
      
      // this._url = esri.urlToObject(url);

      var _params = (this._params = {}),
          token = this._url.query ? this._url.query.token : null;
      if (token) {
        _params.token = token;
      }
    },

    _load: function() {
      esri.request({
        url: this._url.path,
        content: dojo.mixin({ f:"json" }, this._params),
        callbackParamName: "callback",
        load: this._initLayer,
        error: this._errorHandler
      });
    },

    //spatialReference: esri.SpatialReference: spatial reference object
    spatialReference: null,
    //initialExtent: esri.geometry.Extent: Initial extent of layers in map
    initialExtent: null,
    //fullExtent: esri.geometry.Extent: Full extent of layers
    fullExtent: null,
    //description: String: Description of map document
    description: null,
    //units: String: Map units
    units: null,

    _initLayer: function(response, io) {
      try {
        this._findCredential();

        // See esri.request for context regarding "_ssl"
        var ssl = (this.credential && this.credential.ssl) || (response && response._ssl);
        if (ssl) {
          this._useSSL();
        }
        
        this.description = response.description;
        this.copyright = response.copyrightText;
        this.spatialReference = response.spatialReference && new esri.SpatialReference(response.spatialReference);
        this.initialExtent = response.initialExtent && new esri.geometry.Extent(response.initialExtent);
        this.fullExtent = response.fullExtent && new esri.geometry.Extent(response.fullExtent);
        this.units = response.units;
        this.maxRecordCount = response.maxRecordCount;
        this.maxImageHeight = response.maxImageHeight;
        this.maxImageWidth = response.maxImageWidth;
        this.supportsDynamicLayers = response.supportsDynamicLayers;
      
        var layerInfos = (this.layerInfos = []),
            lyrs = response.layers,
            dvl = (this._defaultVisibleLayers = []);
          
        dojo.forEach(lyrs, function(lyr, i) {
          layerInfos[i] = new esri.layers.LayerInfo(lyr);
          if (lyr.defaultVisibility) {
            dvl.push(lyr.id);
          }
        });

        if (! this.visibleLayers) {
          this.visibleLayers = dvl;
        }

        // for (var i=0, il=lyrs.length; i<il; i++) {
        //   layerInfos.push(new esri.layers.LayerInfo(lyrs[i]));
        //   if (lyrs[i].defaultVisibility) {
        //     _defaultLayerVisibility.push(i);
        //   }
        // }

        // REST added currentVersion property to some resources
        // at 10 SP1
        this.version = response.currentVersion;
        
        if (!this.version) {
          var ver;
          
          if ( "capabilities" in response || "tables" in response ) {
            ver = 10;
          }
          else if ("supportedImageFormatTypes" in response) {
            ver = 9.31;
          }
          else {
            ver = 9.3;
          }
          
          this.version = ver;
        } // version
        
        this.capabilities = response.capabilities;

      }
      catch (e) {
        this._errorHandler(e);
      }
    }
  }
);

dojo.declare("esri.layers.LayerInfo", null, {
    constructor: function(/*Object*/ json) {
      dojo.mixin(this, json);
    },
    toJson: function () {
      var json = {
        defaultVisibility: this.defaultVisibility,
        id: this.id,
        maxScale: this.maxScale,
        minScale: this.minScale,
        name: this.name,
        parentLayerId: this.parentLayerId,
        subLayerIds: this.subLayerIds
      };
      return esri._sanitize(json);
    }
  }
);

dojo.declare("esri.layers.TimeInfo", null, {
    constructor: function(json) {
      //timeInterval : Number
      //timeIntervalUnits : String    
      //endTimeField : String    
      //exportOptions : LayerTimeOptions  
      //startTimeField : String    
      //timeExtent : TimeExtent    
      //timeReference : TimeReference    
      //trackIdField : String      
      if (json !== null) {
          dojo.mixin(this, json);
          if (json.exportOptions) {
              this.exportOptions = new esri.layers.LayerTimeOptions(json.exportOptions);
          }
          
          this.timeExtent = new esri.TimeExtent(json.timeExtent);
          this.timeReference = new esri.layers.TimeReference(json.timeReference);
      }      
    }
  }
);

dojo.mixin(esri.layers.TimeInfo, {
   UNIT_CENTURIES: "esriTimeUnitsCenturies", 
   UNIT_DAYS: "esriTimeUnitsDays", 
   UNIT_DECADES: "esriTimeUnitsDecades", 
   UNIT_HOURS: "esriTimeUnitsHours",
   UNIT_MILLISECONDS: "esriTimeUnitsMilliseconds",
   UNIT_MINUTES: "esriTimeUnitsMinutes",
   UNIT_MONTHS: "esriTimeUnitsMonths",
   UNIT_SECONDS: "esriTimeUnitsSeconds",
   UNIT_UNKNOWN: "esriTimeUnitsUnknown",
   UNIT_WEEKS: "esriTimeUnitsWeeks",
   UNIT_YEARS: "esriTimeUnitsYears"
});

dojo.declare("esri.layers.LayerTimeOptions", null, {
    constructor: function(json) {
     //timeDataCumulative:Boolean
     //timeOffset:Number
     //timeOffsetUnits:String
     //useTime:Boolean     
     if (json) {
         dojo.mixin(this, json);
     }
    },
    
    toJson : function() {
     var json = {
         timeDataCumulative: this.timeDataCumulative,
         timeOffset: this.timeOffset,
         timeOffsetUnits: this.timeOffsetUnits,
         useTime: this.useTime                            
     };
     
     return esri._sanitize(json);                   
    }
   }
 );
 
 dojo.declare("esri.layers.TimeReference", null, {
   constructor: function(json) {
     //respectsDaylightSaving : Boolean      
     //timeZone : String
     if (json) {
         dojo.mixin(this, json);      
     }             
   }
 }
);

/********************
 * esri.layers.Field
 ********************/

dojo.declare("esri.layers.Field", null, {
  constructor: function(json) {
    if (json && dojo.isObject(json)) {
      this.name = json.name;
      this.type = json.type;
      this.alias = json.alias;
      this.length = json.length;
      this.editable = json.editable;
      this.nullable = json.nullable;
      var domain = json.domain;
      if (domain && dojo.isObject(domain)) {
        switch(domain.type) {
          case "range":
            this.domain = new esri.layers.RangeDomain(domain);
            break;
          case "codedValue":
            this.domain = new esri.layers.CodedValueDomain(domain);
            break;
        }
      } // domain
    }
  }
});

/*********************
 * esri.layers.Domain
 *********************/

dojo.declare("esri.layers.Domain", null, {
  constructor: function(json) {
    if (json && dojo.isObject(json)) {
      this.name = json.name;
      this.type = json.type;
    }
  },
  
  toJson: function() {
    return esri._sanitize({
      name: this.name,
      type: this.type
    });
  }
});

/**************************
 * esri.layers.RangeDomain
 **************************/

dojo.declare("esri.layers.RangeDomain", [ esri.layers.Domain ], {
  constructor: function(json) {
    if (json && dojo.isObject(json)) {
      this.minValue = json.range[0];
      this.maxValue = json.range[1];
    }
  },
  
  toJson: function() {
    var json = this.inherited(arguments);
    json.range = [ this.minValue, this.maxValue ];
    return esri._sanitize(json);
  }
});

/*******************************
 * esri.layers.CodedValueDomain
 *******************************/

dojo.declare("esri.layers.CodedValueDomain", [ esri.layers.Domain ], {
  constructor: function(json) {
    if (json && dojo.isObject(json)) {
      this.codedValues = json.codedValues;
    }
  },
  
  toJson: function() {
    var json = this.inherited(arguments);
    json.codedValues = dojo.clone(this.codedValues);
    return esri._sanitize(json);
  }
});

/*******************************
 * esri.layers.InheritedDomain
 *******************************/

dojo.declare("esri.layers.InheritedDomain", [ esri.layers.Domain ], {});

/*******************************
 * dynamic layer related classes
 *******************************/
dojo.declare("esri.layers.LayerSource", null, {
  type: null,
  
  constructor: function(json) {
    if (json) {
      dojo.mixin(this, json);
    }             
  },
  
  toJson: function () {
  }
});

dojo.declare("esri.layers.LayerMapSource", esri.layers.LayerSource, {
  type: "mapLayer",
  
  toJson: function () {
    var json = {type: "mapLayer", mapLayerId: this.mapLayerId, gdbVersion: this.gdbVersion};
    return esri._sanitize(json);
  }
});

dojo.declare("esri.layers.LayerDataSource", esri.layers.LayerSource, {
  type: "dataLayer",
  
  toJson: function () {
    var json = {type: "dataLayer", dataSource: this.dataSource && this.dataSource.toJson()};
    return esri._sanitize(json);
  }
});

dojo.declare("esri.layers.DataSource", null, {
  constructor: function(json) {
    if (json) {
      dojo.mixin(this, json);
    }             
  },
  
  toJson: function(){    
  }
});

dojo.declare("esri.layers.TableDataSource", esri.layers.DataSource, {  
  toJson: function () {
    var json = {
      type: "table",
      workspaceId: this.workspaceId,
      dataSourceName: this.dataSourceName,
      gdbVersion: this.gdbVersion
    };
    return esri._sanitize(json);
  }
});

dojo.declare("esri.layers.QueryDataSource", esri.layers.DataSource, {  
  toJson: function () {
    var json = {
      type: "queryTable",
      workspaceId: this.workspaceId,
      query: this.query,
      oidFields: this.oidFields && this.oidFields.join(),
      spatialReference: this.spatialReference && this.spatialReference.toJson()
    };
    if (this.geometryType) {
      var geometryType;
      if (this.geometryType.toLowerCase() === "point") {
        geometryType = "esriGeometryPoint";
      }
      else if (this.geometryType.toLowerCase() === "multipoint") {
        geometryType = "esriGeometryMultipoint";
      }
      else if (this.geometryType.toLowerCase() === "polyline") {
        geometryType = "esriGeometryPolyline";
      }
      else if (this.geometryType.toLowerCase() === "polygon") {
        geometryType = "esriGeometryPolygon";
      }
      else {
        geometryType = this.geometryType;
      }
      json.geometryType = geometryType;
    }
    return esri._sanitize(json);
  }
});

dojo.declare("esri.layers.JoinDataSource", esri.layers.DataSource, {  
  toJson: function () {
    var json = {
      type: "joinTable",
      leftTableSource: this.leftTableSource && this.leftTableSource.toJson(),
      rightTableSource: this.rightTableSource && this.rightTableSource.toJson(),
      leftTableKey: this.leftTableKey,
      rightTableKey: this.rightTableKey
    };
    var joinType;
    if (this.joinType.toLowerCase() === "left-outer-join") {
      joinType = "esriLeftOuterJoin";
    }
    else if (this.joinType.toLowerCase() === "left-inner-join") {
      joinType = "esriLeftInnerJoin";
    }
    else {
      joinType = this.joinType;
    }
    json.joinType = joinType;
    return esri._sanitize(json);
  }
});

dojo.declare("esri.layers.RasterDataSource", esri.layers.DataSource, {  
  toJson: function () {
    var json = {
      type: "raster",
      workspaceId: this.workspaceId,
      dataSourceName: this.dataSourceName
    };
    return esri._sanitize(json);
  }
});

dojo.declare("esri.layers.DynamicLayerInfo", esri.layers.LayerInfo, {
  defaultVisibility: true,
  parentLayerId: -1,
  maxScale: 0,
  minScale: 0,
  
  constructor: function(/*Object*/ json) {    
    if (json && !json.source) {
      var mapLayerSource = new esri.layers.LayerMapSource();
      mapLayerSource.mapLayerId = this.id;
      this.source = mapLayerSource; 
    }
  },
  
  toJson: function() {
    var json = this.inherited(arguments);
    json.source = this.source && this.source.toJson();
    return esri._sanitize(json);
  }
});

dojo.declare("esri.layers.LayerDrawingOptions", null, {
  constructor: function(json) {
    if (json) {
      dojo.mixin(this, json);
    }             
  },
  
  toJson: function () {
    var json = {
      renderer: this.renderer && this.renderer.toJson(),
      transparency: this.transparency,
      scaleSymbols: this.scaleSymbols,
      showLabels: this.showLabels
    }; 
    return esri._sanitize(json);
  }
});
});
