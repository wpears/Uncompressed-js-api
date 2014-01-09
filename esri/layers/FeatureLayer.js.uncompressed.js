//>>built
// wrapped by build app
define("esri/layers/FeatureLayer", ["dijit","dojo","dojox","dojo/require!esri/layers/graphics,esri/tasks/query,dojo/io/iframe,esri/layers/agscommon,dojo/date/locale"], function(dijit,dojo,dojox){
dojo.provide("esri.layers.FeatureLayer");

dojo.require("esri.layers.graphics");
dojo.require("esri.tasks.query");
dojo.require("dojo.io.iframe");
dojo.require("esri.layers.agscommon");
dojo.require("dojo.date.locale");

// TODO
// Support for spatial definition in snapshot mode
// Optimize zoom-in operation in on-demand mode
// In snapshot mode, "selection" and "query" should happen on the client for most cases.
// Looks like we need to "suspend" the layer when the layer defn and map time extent did not overlap 
// [NEED TO REPRO] In snapshot mode, panning after zooming into a small area with a handful of features causes page freeze for a while.
//   - Need to optimize this based on a spatial index featureMap/cellMap similar to on-demand mode
// what about onLoad, onUpdate(on-demand mode) etc?
// onUpdate/onRefresh/onRedraw
// data store
// clustering
// modify GL to perform clipping using the grid extent in ondemand mode
// should the graphics layer always display the selected features? (clipping). Yes - it will be good for user experience 
// [FIXED] modify esri.request to fix the etag issue - utils.js, query.js, xhr.js
// [DONE] time offset
// [DONE] Client-side selection should honor query.timeExtent (i.e. time definition, map time extent)
// [DONE] Apply - layer defn expr, layer time defn, map time extent - to selectFeatures, queryFeatures, queryIds
// [DONE] Layer refresh is not honoring the map's time extent
// [DONE] Snapshot mode should honor map time extent (i.e. filter) after querying
// [DONE] Add refresh impl
// [NON-ISSUE] fix coded values domain format
// [DONE] min/max scale
// [DONE] enable infoTemplate
// [PARTIAL] [haitham] select a feature and move it, then zoom in, the feature layer shows the feature in the old location
//   - the feature will be in the new location as long as it remains selected thru the zoom operation
//   - need not be selected if the FL caches features across zoom levels
// [JEREMY] Unable to change the selection symbol between various types.
// [DONE] Add add/remove/refresh impl [NOTE: may be revoked later]
// [DONE] do not "select" when double clicking on a feature (map zoom in).
// [AS DESIGNED] add selectFeatures(oids/features, selectionMethod)?
// [DONE] add query methods
// [DONE] definition expression. set "null" in snapshot mode does "1=1", in ondemand mode uses "null". getter should return appropriate value
// [DONE] initial implementation for editing
// [DONE] add "map-render" mode
// [DONE] outFields issue - oidField in snapshot, ondemand modes
// [DONE] cannot lose selection on zoom in/out, property change
// [DONE] add "paging" mode for tables? - FeatureLayer will act as a data source in this case.
// [DONE] update/finish snapshot mode
// [DONE] get rid of the dependency on layer's full extent (need to discuss this with keyur again)
// [DONE] cannot remove a "selected" feature even when it goes out of focus or extent changes
// [DONE] panning the map by dragging on a feature "selects" it. fix it. -- jayant fixed it for 1.5 - yay! 

/***************************
 * esri.layers.FeatureLayer
 ***************************/

dojo.declare("esri.layers.FeatureLayer", esri.layers.GraphicsLayer, {
  
  /************
   * Overrides 
   ************/
  
  // TODO
  // At Dojo 1.4, we have more control over how the constructor
  // chaining happens between subclass and super classes.
  // When we move to 1.4, we need to take advantage of that
  // and remove the ugly hack from <_GraphicsLayer> constructor
  // REF: http://docs.dojocampus.org/dojo/declare#manual-constructor-chaining

  constructor: function(/*String*/ url, /*Object?*/ options) {
    // "url" is processed by <Layer> and "options" is processed by <_GraphicsLayer>
    //console.log("featurelayer: ", url, options);
    
    // custom options
    this._outFields = options && options.outFields;
    //this._infoTemplate = options && options.infoTemplate; // || "${*}";
    this._loadCallback = options && options.loadCallback;
    
    var patch = options && options._usePatch;
    this._usePatch = (patch === null || patch === undefined) ? true : patch;
    //console.log("patch status: ", this._usePatch);
    
    this._trackIdField = options && options.trackIdField;
    this.objectIdField = options && options.objectIdField;
    this._maxOffset = options && options.maxAllowableOffset;
    this._optEditable = options && options.editable;
    this._optAutoGen = options && options.autoGeneralize;
    this.editSummaryCallback = options && options.editSummaryCallback;
    this.userId = options && options.userId;
    this.userIsAdmin = options && options.userIsAdmin;

    this.useMapTime = (options && options.hasOwnProperty("useMapTime")) ? 
                      (!!options.useMapTime) : 
                      true;
    this.source = options && options.source;
    this.gdbVersion = options && options.gdbVersion;
    
    // other defaults
    this._selectedFeatures = {};
    this._selectedFeaturesArr = [];
    this._newFeatures = [];
    this._deletedFeatures = {};

    // this value will be unique for each feature layer
    // in an application
    this._ulid = this._getUniqueId();
    
    // construct appropriate "mode"
    var ctor = this.constructor, mode = this.mode = (esri._isDefined(options && options.mode) ? options.mode : ctor.MODE_ONDEMAND);
    switch(mode) {
      case ctor.MODE_SNAPSHOT:
        this._mode = new esri.layers._SnapshotMode(this);
        this._isSnapshot = true;
        break;
      case ctor.MODE_ONDEMAND:
        this._tileWidth = (options && options.tileWidth) || 512;
        this._tileHeight = (options && options.tileHeight) || 512;
        this._mode = new esri.layers._OnDemandMode(this);
    
        var lattice = options && options.latticeTiling;
        this.latticeTiling = /*!esri._isDefined(lattice) ||*/ lattice;
        break;
      case ctor.MODE_SELECTION:
        this._mode = new esri.layers._SelectionMode(this);
        this._isSelOnly = true;
        break;
    }

    this._initLayer = dojo.hitch(this, this._initLayer);
    //this._preprocess = dojo.hitch(this, this._preprocess);
    this._selectHandler = dojo.hitch(this, this._selectHandler);
    this._editable = false;
    
    // Deal with feature collection
    if (dojo.isObject(url) && url.layerDefinition) {
      var json = url;
      this._collection = true;
      this.mode = ctor.MODE_SNAPSHOT;
      this._initLayer(json);
      return this;
    }

    this._task = new esri.tasks.QueryTask(this.url, {
      source: this.source, 
      gdbVersion: this.gdbVersion
    });
    
    // is the layer editable?
    var urlPath = this._url.path;
    this._fserver = false;
    if (urlPath.search(/\/FeatureServer\//i) !== -1) {
      // TODO
      // template picker uses this variable as well
      this._fserver = true;
      //console.log(" -- is editable --");
    }

    var resourceInfo = options && options.resourceInfo;
    if (resourceInfo) {
      this._initLayer(resourceInfo);
    }
    else {
      // fetch layer information
      if (this.source) {
        var layer = {source: this.source.toJson()};
        this._url.query = dojo.mixin(this._url.query, {layer: dojo.toJson(layer)});
      }
      if (this.gdbVersion) {
        this._url.query = dojo.mixin(this._url.query, {gdbVersion: this.gdbVersion});
      }
      esri.request({
        url: urlPath,
        content: dojo.mixin({ f:"json" }, this._url.query),
        callbackParamName: "callback",
        load: this._initLayer, // this._preprocess,
        error: this._errorHandler
      });
    }
  },
  
  // (override)
  _initLayer: function(response, io) {
    // do not enter if this method is invoked by GraphicsLayer constructor
    if (response || io) {
      this._json = response; // TODO
      
      this._findCredential();
      
      // See esri.request for context regarding "_ssl"
      var ssl = (this.credential && this.credential.ssl) || (response && response._ssl);
      if (ssl) {
        this._useSSL();
        this._task._useSSL();
      }
      
      // check if this an ArcGIS Online Feature Collection Item
      if (this._collection) {
        // force snapshot mode
        this._mode = new esri.layers._SnapshotMode(this);
        this._isSnapshot = true;
        this._featureSet = response.featureSet;
        this._nextId = response.nextObjectId; // webmap spec
        response = response.layerDefinition;
      }
      
      if (response.hasOwnProperty("capabilities")) {
        var capabilities = (this.capabilities = response.capabilities);
        if (capabilities && capabilities.toLowerCase().indexOf("editing") !== -1) {
          this._editable = true;
        }
        else {
          this._editable = false;
        }
      }
      else if (!this._collection) {
        this._editable = this._fserver;
      }
      
      if (esri._isDefined(this._optEditable)) {
        this._editable = this._optEditable;
        delete this._optEditable;
      }
      
      //if (!this._collection) {
        // let's serialize and store
        this._json = dojo.toJson(this._json);
      //}
      
      // offset not applicable when the layer is editable
      if (this.isEditable()) {
        delete this._maxOffset;
      }
      // autoGeneralize applicable to non-editable, on-demand layers only
      else if (
        this.mode !== this.constructor.MODE_SNAPSHOT &&
        ((response.geometryType === "esriGeometryPolyline") || (response.geometryType === "esriGeometryPolygon"))
      ) {
        this._autoGeneralize = esri._isDefined(this._optAutoGen) ? 
                                this._optAutoGen :
                                (this.mode === this.constructor.MODE_ONDEMAND); 
        delete this._optAutoGen;
      }
      
      // process layer information
      this.minScale = response.effectiveMinScale || response.minScale || 0;
      this.maxScale = response.effectiveMaxScale || response.maxScale || 0;

      this.layerId = response.id;
      this.name = response.name;
      this.description = response.description;
      this.copyright = response.copyrightText;
      this.type = response.type;
      this.geometryType = response.geometryType;
      this.displayField = response.displayField;
      this.defaultDefinitionExpression = response.definitionExpression;
      this.fullExtent = new esri.geometry.Extent(response.extent);
      this.defaultVisibility = response.defaultVisibility;
      
      // disable lattice tiling for point and multipoint layers
      if (
        (this.geometryType === "esriGeometryPoint") || 
        (this.geometryType === "esriGeometryMultipoint")
      ) {
        this.latticeTiling = false;
      }
      
      // properties added since server 10.1
      this.indexedFields = response.indexedFields;
      this.maxRecordCount = response.maxRecordCount;
      this.canModifyLayer = response.canModifyLayer;
      this.supportsStatistics = response.supportsStatistics;
      this.supportsAdvancedQueries = response.supportsAdvancedQueries;
      this.hasLabels = response.hasLabels;
      this.canScaleSymbols = response.canScaleSymbols;
      this.supportsRollbackOnFailure = response.supportsRollbackOnFailure;
      this.syncCanReturnChanges = response.syncCanReturnChanges;
      this.isDataVersioned = response.isDataVersioned;
      this.editFieldsInfo = response.editFieldsInfo;
      this.ownershipBasedAccessControlForFeatures = response.ownershipBasedAccessControlForFeatures;
      if (this.editFieldsInfo && this.ownershipBasedAccessControlForFeatures) {
        this.creatorField = this.editFieldsInfo.creatorField;
      }
      this.relationships = response.relationships;
      this.allowGeometryUpdates = esri._isDefined(response.allowGeometryUpdates) ? response.allowGeometryUpdates : true;
      
      this._isTable = (this.type === "Table");
      
      // TODO
      // This is related to adding a FL as the base map layer. There
      // are some difficulties in _addLayerHandler in map code.
      //this.spatialReference = this.fullExtent.spatialReference;
      
      // fields
      var fieldObjs = (this.fields = []),
          fields = response.fields, i;
      
      for (i = 0; i < fields.length; i++) {
        fieldObjs.push(new esri.layers.Field(fields[i]));
      }
      
      // determine object id field for this layer
      if (!this.objectIdField) {
        /*if (this._collection) {
          this.objectIdField = "__object__id__";
        }
        else {*/
          this.objectIdField = response.objectIdField;
          if (!this.objectIdField) {
            // identify the field that provides unique id for the features in the layer
            fields = response.fields;
            for (i = 0; i < fields.length; i++) {
              var field = fields[i];
              if (field.type === "esriFieldTypeOID") {
                this.objectIdField = field.name;
                break;
              }
            }
          }
        //}
        
        if (!this.objectIdField) {
          console.debug("esri.layers.FeatureLayer: " + esri.substitute({ url: this.url }, esri.bundle.layers.FeatureLayer.noOIDField));
        }
      }

      if (!esri._isDefined(this._nextId)) {
        // Let's determine the oid that we need to use if a feature
        // is added
        var oidField = this.objectIdField, maxId = -1;
        if (this._collection && oidField) {
          var fset = this._featureSet, 
              features = fset && fset.features, 
              il = features ? features.length : 0, oid, attr;
          
          // find the max of existing oids
          for (i = 0; i < il; i++) {
            attr = features[i].attributes;
            oid = attr && attr[oidField];
    
            if (oid > maxId) {
              maxId = oid;
            }
          }
        }
        
        this._nextId = /*(maxId === -1) ? this._getUniqueId() :*/ (maxId + 1);
      }
      
      this.globalIdField = response.globalIdField;
      
      var fieldName = (this.typeIdField = response.typeIdField), fieldInfo;

      // Fix typeIdField if necessary - it's known to have different case
      // compared to this.fields
      if (fieldName) {
        fieldInfo = !this._getField(fieldName) && this._getField(fieldName, true);
        
        if (fieldInfo) {
          this.typeIdField = fieldInfo.name;
        }
      }
      
      // webmap spec
      this.visibilityField = response.visibilityField;
      
      // default symbol
      var symbol = response.defaultSymbol;

      if (symbol) {
        this.defaultSymbol = esri.symbol.fromJson(symbol);
      }
      
      // sub-types
      var typeObjs = this.types = [],
          types = response.types,
          fType, fTemplates, protoAttributes,
          fieldsInfo = this.editFieldsInfo, 
          creatorField = fieldsInfo && fieldsInfo.creatorField,
          editorField = fieldsInfo && fieldsInfo.editorField,
          fix = (creatorField || editorField), fixList = [];
          
      if (types) {
        for (i = 0; i < types.length; i++) {
          fType = new esri.layers.FeatureType(types[i]);
          
          fTemplates = fType.templates;
          if (fix && fTemplates && fTemplates.length) {
            fixList = fixList.concat(fTemplates);
          }
          
          typeObjs.push(fType);
        }
      }
      
      // templates for the layer
      var templates = response.templates, template,
          templateObjs = this.templates = [];
          
      if (templates) {
        for (i = 0; i < templates.length; i++) {
          template = new esri.layers.FeatureTemplate(templates[i]);
          
          if (fix) {
            fixList.push(template);
          }
          
          templateObjs.push(template);
        }
      }
      
      // Fix 10.1 server bug where prototypes contain null values for 
      // creator and editor fields. null values have special meaning as
      // userIds and hence should not be returned with prototypes
      // Server CR 222052 (Prototype feature should not return the read-only fields) 
      // for this issue is scheduled to be fixed in 10.1 SP1
      for (i = 0; i < fixList.length; i++) {
        protoAttributes = dojo.getObject("prototype.attributes", false, fixList[i]);

        if (protoAttributes) {
          if (creatorField) {
            delete protoAttributes[creatorField];
          }
          if (editorField) {
            delete protoAttributes[editorField];
          }
        }
      }
      
      // the layer is time aware if it has time info
      var timeInfo = response.timeInfo;
      if (timeInfo) {
        this.timeInfo = new esri.layers.TimeInfo(timeInfo);
        this._startTimeField = timeInfo.startTimeField;
        this._endTimeField = timeInfo.endTimeField;
        if (this._startTimeField && this._endTimeField) {
          this._twoTimeFields = true;
        }
        
        if (this._trackIdField) {
          timeInfo.trackIdField = this._trackIdField;
        }
        else {
          this._trackIdField = timeInfo.trackIdField;
        }
      }
      
      this.hasAttachments = (!this._collection && response.hasAttachments) ? true : false;
      this.htmlPopupType = response.htmlPopupType;

      var drawingInfo = response.drawingInfo, renderer;      
      if (!this.renderer) {
        
        if (drawingInfo && drawingInfo.renderer) {
          renderer = drawingInfo.renderer;
          this.setRenderer(esri.renderer.fromJson(renderer));
          if (renderer.type === "classBreaks") {
            this.renderer._setMaxInclusiveness(true);
          }
          
          // translate relative image resources defined in pms/pfs to absolute paths
          // see - http://nil/rest-docs/msimage.html
          if (!this._collection) {
            
            var rendererType = renderer.type, symbols = [];
            renderer = this.renderer;
            
            switch(rendererType) {
              case "simple":
                symbols.push(renderer.symbol);
                break;
              case "uniqueValue":
              case "classBreaks":
                symbols.push(renderer.defaultSymbol);
                symbols = symbols.concat(dojo.map(renderer.infos, function(info) {
                  return info.symbol;
                }));
                break;
            } // switch
            
            symbols = dojo.filter(symbols, esri._isDefined);
            
            var baseUrl = this._url.path + "/images/", token = this._getToken();
            dojo.forEach(symbols, function(sym) {
              var url = sym.url;
              if (url) {
                // translate relative image resources defined in pms/pfs to absolute paths
                if ( (url.search(/https?\:/) === -1) && (url.indexOf("data:") === -1) ) {
                  sym.url = baseUrl + url;
                }
                //console.log(sym.url);
                
                // append token
                if (token && sym.url.search(/https?\:/) !== -1) {
                  sym.url += ("?token=" + token);
                }
              }
            });
            
          } // not a collection
        }
        else if (symbol) { // default symbol defined in the layer resource
          types = this.types;
          if (types.length > 0) {
            renderer = new esri.renderer.UniqueValueRenderer(this.defaultSymbol, this.typeIdField);
            
            dojo.forEach(types, function(type) {
              renderer.addValue(type.id, type.symbol);
            });
          }
          else {
            renderer = new esri.renderer.SimpleRenderer(this.defaultSymbol);
          }
          
          this.setRenderer(renderer);
        }
        else if (!this._isTable) { // fallback
          var fallbackSymbol;
          switch(this.geometryType) {
            case "esriGeometryPoint":
            case "esriGeometryMultipoint":
              fallbackSymbol = new esri.symbol.SimpleMarkerSymbol();
              break;
            case "esriGeometryPolyline":
              fallbackSymbol = new esri.symbol.SimpleLineSymbol();
              break;
            case "esriGeometryPolygon":
              fallbackSymbol = new esri.symbol.SimpleFillSymbol();
              break;
          }
          
          this.setRenderer(fallbackSymbol ? new esri.renderer.SimpleRenderer(fallbackSymbol) : null);
        }
      } // renderer
      
      // layer transparency
      var transparency = (drawingInfo && drawingInfo.transparency) || 0 ;
      if (!esri._isDefined(this.opacity) && transparency > 0) {
        this.opacity = 1 - (transparency / 100);
      }
    
//      // initialize the "mode" with layer info
//      var mode = this._mode;
//      if (mode) {
//        mode.layerInfoHandler(response);
//      }

      // REST added currentVersion property to some resources
      // at 10 SP1
      this.version = response.currentVersion;
      
      if (!this.version) {
        var ver;
        
        if (
          "capabilities" in response || "drawingInfo" in response || 
          "hasAttachments" in response || "htmlPopupType" in response || 
          "relationships" in response || "timeInfo" in response || 
          "typeIdField" in response || "types" in response 
        ) {
          ver = 10;
        }
        else {
          ver = 9.3; // or could be 9.3.1
        }
        
        this.version = ver;
      } // version
      
      if ((dojo.isIE || dojo.isSafari) && this.isEditable() && this.version < 10.02) {
        this._ts = true;
      }
      
      // announce "loaded", imples ready to be added to the map
      this.loaded = true;
      
      this._fixRendererFields();
      this._checkFields();
      this._updateCaps();

      if (this._collection) {
        this._fireUpdateStart();
        
        var featureSet = this._featureSet;
        delete this._featureSet;
        
        this._mode._drawFeatures(new esri.tasks.FeatureSet(featureSet));
        this._fcAdded = true;
      }

      this.onLoad(this);
      var callback = this._loadCallback;
      if (callback) {
        delete this._loadCallback;
        callback(this);
      }
    }
  },
    
  // (extend)
  setRenderer: function(ren) {
    this.inherited("setRenderer", arguments);
    
    var renderer = this.renderer;
    if (renderer) {
      this._ager = (renderer.declaredClass.indexOf("TemporalRenderer") !== -1 && renderer.observationAger && renderer.observationRenderer);
      
      var renderers = dojo.filter([
        renderer, renderer.observationRenderer, 
        renderer.latestObservationRenderer, renderer.trackRenderer
      ], esri._isDefined);
      
      var fields = [];
      dojo.forEach(renderers, function(rnd) {
        fields.push(rnd.attributeField);
        fields.push(rnd.attributeField2);
        fields.push(rnd.attributeField3);
      }, this);
      this._rendererFields = dojo.filter(fields, esri._isDefined);
    } 
    else {
      this._ager = false;
      this._rendererFields = [];
    }
    
    if (this.loaded && this._rendererFields.length > 0) {
      this._fixRendererFields();
      this._checkFields(this._rendererFields);
    }

    if (this.loaded && this._collection) {
      // we want to write out the renderer in toJson()
      this._typesDirty = true;
    }
  },

  // (extend)
  _setMap: function(map, surface) {
    this._map = map;

    // if the layer is time-aware, listen for changes in time extent
    this._toggleTime(true);
    
    // invoke superclass version of this method
    var div = this.inherited("_setMap", arguments);
    
    this.clearSelection(); // flush out features brought down before being added to the map
    
    // do we have a temporal renderer?
    var renderer = this.renderer;
    /*if (renderer) {
      this._ager = (renderer.declaredClass.indexOf("TemporalRenderer") !== -1 && renderer.observationAger);
      
      //this._rendererAttrField = renderer.observationRenderer ? renderer.observationRenderer.attributeField : renderer.attributeField;
      
      var renderers = dojo.filter([
        renderer, renderer.observationRenderer, 
        renderer.latestObservationRenderer, renderer.trackRenderer
      ], esri._isDefined);
      
      var fields = [];
      dojo.forEach(renderers, function(rnd) {
        fields.push(rnd.attributeField);
        fields.push(rnd.attributeField2);
        fields.push(rnd.attributeField3);
      });
      this._rendererFields = dojo.filter(fields, esri._isDefined);
    } 
    
    this._checkFields();*/
    
    if (this.timeInfo) {
      // tracking management
      if (this._trackIdField || ( renderer && (renderer.latestObservationRenderer || renderer.trackRenderer) )) {
        this._trackManager = new esri.layers._TrackManager(this);
        this._trackManager.initialize(map);
      }
    }
    
    /*// listen for map zoom to act on scale dependency
    //this.minScale = 0; this.maxScale = 44000;
    if (this.minScale !== 0 || this.maxScale !== 0) {
      this._zoomConnect = dojo.connect(map, "onZoomEnd", this, this._updateStatus);
      //this._zoomHandler();
    }*/
   
    // listen for map zoom end to act on scale dependency and auto-generalization
    this._zoomConnect = dojo.connect(map, "onZoomEnd", this, this._zoomHandler);
    this._zoomHandler();
   
    //this.setScaleRange(this.minScale, this.maxScale);
    
    // initialize the "mode" with map
    var mode = this._mode;
    if (mode) {
      mode.initialize(map);
    }
    
    return div;
  },
  
  // (extend)
  _unsetMap: function(map, surface) {
    var mode = this._mode;
    if (mode) {
      mode.destroy();
      this._mode = null;
    }
    if (this._trackManager) {
      this._trackManager.destroy();
      this._trackManager = null;
    }
    dojo.disconnect(this._zoomConnect);
    this._zoomConnect = null;
    this._toggleTime(false);
    this.inherited("_unsetMap", arguments);
  },
  
//  // (override)
//  add: function(graphic) {
//    graphic.attributes = graphic.attributes || {};
//    var attributes = graphic.attributes, oidField = this.objectIdField;
//    if (/*!attributes ||*/ !attributes[oidField]) { // brand new feature
//      this._registerNew(graphic);
//      return this._add(graphic);
//    }
//    else { // feature that was previously removed (known to feature layer)
//      this._unRegisterDelete(graphic);
//      this._mode.drawFeature(graphic);
//      return graphic;
//    }
//  },
//  
//  // (override)
//  remove: function(graphic) {
//    var attributes = graphic.attributes, oidField = this.objectIdField;
//    if (/*!attributes ||*/ !attributes[oidField]) { // brand new feature previously added
//      this._unRegisterNew(graphic);
//      
//      // unselect
//      this._unSelectNewFeature(graphic);
//      
//      return this._remove(graphic);
//    }
//    else { // existing feature (known to feature layer)
//      this._registerDelete(graphic);
//      
//      var oid = attributes[oidField], mode = this._mode;
//      
//      // unselect
//      this._unSelectFeatureIIf(oid, mode);
//      
//      // remove
//      graphic._count = 0;
//      return mode._removeFeatureIIf(oid);
//    }
//  },

  // (incompatible override)
  refresh: function() {
    // Lose all the features and fetch them again 
    // from the server
    var mode = this._mode;
    if (mode) {
      mode.refresh();
    }
  },
  
  /*****************
   * Public Methods
   *****************/
  
  setEditable: function(/*Boolean*/ editable) {
    // Currently supported for by-value layers only
    if (!this._collection) {
      console.log("FeatureLayer:setEditable - this functionality is not yet supported for layer in a feature service");
      return this;
    }
    
    if (!this.loaded) {
      // Just record user's choice and leave. We'll process them
      // when the layer has loaded
      this._optEditable = editable;
      return this;
    }
    
    var previousState = this._editable;
    this._editable = editable;
    this._updateCaps();
    
    if (previousState !== editable) {
      this.onCapabilitiesChange();
    }
    return this;
  },
  
  getEditCapabilities: function(options) {
    /*
      // Tests:
      (function() {
      
      var scope = {
            loaded: false, _editable: null,
            capabilities: null,
            editFieldsInfo: null,
            ownershipBasedAccessControlForFeatures: null,
            getUserId: esri.layers.FeatureLayer.prototype.getUserId,
            isEditable: esri.layers.FeatureLayer.prototype.isEditable
          }, 
          fieldsInfo = { creatorField: "creator" },
          othersTT = { allowUpdateToOthers: true, allowDeleteToOthers: true },
          othersFF = { allowUpdateToOthers: false, allowDeleteToOthers: false },
          othersTF = { allowUpdateToOthers: true, allowDeleteToOthers: false },
          othersFT = { allowUpdateToOthers: false, allowDeleteToOthers: true };
      
      var FFF = '{"canCreate":false,"canUpdate":false,"canDelete":false}',
          TTT = '{"canCreate":true,"canUpdate":true,"canDelete":true}',
          TFF = '{"canCreate":true,"canUpdate":false,"canDelete":false}',
          FTF = '{"canCreate":false,"canUpdate":true,"canDelete":false}',
          FFT = '{"canCreate":false,"canUpdate":false,"canDelete":true}',
          TTF = '{"canCreate":true,"canUpdate":true,"canDelete":false}',
          FTT = '{"canCreate":false,"canUpdate":true,"canDelete":true}',
          TFT = '{"canCreate":true,"canUpdate":false,"canDelete":true}',
          T = true,
          F = false;
      
      var fUserA = { attributes: { creator: "UserA" } },
          fUserB = { attributes: { creator: "UserB" } },
          fUserAnonymous = { attributes: { creator: "" } },
          fUserNull = { attributes: { creator: null } },
          fNoAttr = {},
          fNoField = { attributes: {} },
          opts = {}, result;
      
      ////////// Layer level capabilities //////////
      console.log("Layer level capabilities");
      
      scope.loaded = F; scope._editable = F;
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("1. " + (result === FFF));

      scope.loaded = T; scope._editable = F;
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("2. " + (result === FFF));

      scope.loaded = T; scope._editable = F;
      scope.userIsAdmin = true;
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("2.1. " + (result === TTT));
      scope.userIsAdmin = undefined;

      scope.loaded = T; scope._editable = T;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("3. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("4. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("5. " + (result === FTF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("6. " + (result === FFT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("7. " + (result === TTF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("8. " + (result === TFT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("9. " + (result === FTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("10. " + (result === TTT));
      
      console.log("Layer level capabilities, loggedInUser: IS-ADMIN");
      scope.userIsAdmin = true;
      
      scope.capabilities = "Map,Query";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("2. " + (result === TTT));
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("3. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("4. " + (result === TTT));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("5. " + (result === TTT));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("6. " + (result === TTT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("7. " + (result === TTT));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("8. " + (result === TTT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("9. " + (result === TTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("10. " + (result === TTT));
      
      scope.userIsAdmin = undefined;
      
      console.log("Layer level capabilities, feature Y");
      opts.feature = fUserA;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("11. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("12. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("13. " + (result === FTF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("14. " + (result === FFT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("15. " + (result === TTF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("16. " + (result === TFT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("17. " + (result === FTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("18. " + (result === TTT));
      
      scope.userIsAdmin = true;
      console.log("Layer level capabilities, loggedInUser: IS-ADMIN, feature Y");
      opts.feature = fUserA;
      
      scope.capabilities = "Map,Query";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("10. " + (result === TTT));
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("11. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("12. " + (result === TTT));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("13. " + (result === TTT));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("14. " + (result === TTT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("15. " + (result === TTT));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("16. " + (result === TTT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("17. " + (result === TTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("18. " + (result === TTT));
      
      scope.userIsAdmin = undefined;
    
      ////////// LoggedInUser = Creator //////////
      
      opts.userId = "UserA";
      opts.feature = fUserA;
    
      console.log("LoggedInUser = Creator, No Access Control");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = null;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("1. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("2. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("3. " + (result === FTF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("4. " + (result === FFT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("5. " + (result === TTF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("6. " + (result === TFT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("7. " + (result === FTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("8. " + (result === TTT));
    
      console.log("LoggedInUser = Creator, AccessControl = othersFF");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = othersFF;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("9. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("10. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("11. " + (result === FTF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("12. " + (result === FFT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("13. " + (result === TTF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("14. " + (result === TFT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("15. " + (result === FTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("16. " + (result === TTT));
    
      opts.userId = "UserA";
      opts.feature = fUserAnonymous;
      console.log("LoggedInUser = Creator, Feature owned by ANONYMOUS, AccessControl = othersFF");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = othersFF;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("17. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("18. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("19. " + (result === FTF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("20. " + (result === FFT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("21. " + (result === TTF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("22. " + (result === TFT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("23. " + (result === FTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("24. " + (result === TTT));
    
      ////////// LoggedInUser !== Creator //////////
      
      opts.userId = "UserA";
      opts.feature = fUserB;
    
      console.log("LoggedInUser !== Creator, No Access Control");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = null;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("1. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("2. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("3. " + (result === FTF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("4. " + (result === FFT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("5. " + (result === TTF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("6. " + (result === TFT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("7. " + (result === FTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("8. " + (result === TTT));
    
      console.log("LoggedInUser !== Creator, AccessControl = othersFF");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = othersFF;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("9. " + (result === TFF));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("10. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("11. " + (result === FFF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("12. " + (result === FFF));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("13. " + (result === TFF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("14. " + (result === TFF));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("15. " + (result === FFF));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("16. " + (result === TFF));
    
      scope.userIsAdmin = true;
      console.log("LoggedInUser !== Creator, LoggedInUser: IS-ADMIN, AccessControl = othersFF");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = othersFF;
      
      scope.capabilities = "Map,Query";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("8. " + (result === TTT));
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("9. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("10. " + (result === TTT));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("11. " + (result === TTT));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("12. " + (result === TTT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("13. " + (result === TTT));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("14. " + (result === TTT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("15. " + (result === TTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("16. " + (result === TTT));

      scope.userIsAdmin = undefined;
    
      console.log("LoggedInUser !== Creator, AccessControl = othersTT");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = othersTT;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("17. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("18. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("19. " + (result === FTF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("20. " + (result === FFT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("21. " + (result === TTF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("22. " + (result === TFT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("23. " + (result === FTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("24. " + (result === TTT));
    
      console.log("LoggedInUser !== Creator, AccessControl = othersTF");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = othersTF;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("25. " + (result === TTF));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("26. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("27. " + (result === FTF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("28. " + (result === FFF));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("29. " + (result === TTF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("30. " + (result === TFF));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("31. " + (result === FTF));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("32. " + (result === TTF));
    
      console.log("LoggedInUser !== Creator, AccessControl = othersFT");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = othersFT;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("33. " + (result === TFT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("34. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("35. " + (result === FFF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("36. " + (result === FFT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("37. " + (result === TFF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("38. " + (result === TFT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("39. " + (result === FFT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("40. " + (result === TFT));
      
      ////////// NO LoggedInUser //////////

      opts.userId = "";
      opts.feature = fUserB;
    
      console.log("NO LoggedInUser, AccessControl = othersTT");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = othersTT;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("1. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("2. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("3. " + (result === FTF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("4. " + (result === FFT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("5. " + (result === TTF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("6. " + (result === TFT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("7. " + (result === FTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("8. " + (result === TTT));
    
      console.log("NO LoggedInUser, AccessControl = othersFF");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = othersFF;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("9. " + (result === TFF));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("10. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("11. " + (result === FFF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("12. " + (result === FFF));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("13. " + (result === TFF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("14. " + (result === TFF));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("15. " + (result === FFF));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("16. " + (result === TFF));

      opts.userId = "";
      opts.feature = fUserNull;
      console.log("NO LoggedInUser, Feature owned by NULL, AccessControl = othersTT");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = othersTT;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("17. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("18. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("19. " + (result === FTF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("20. " + (result === FFT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("21. " + (result === TTF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("22. " + (result === TFT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("23. " + (result === FTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("24. " + (result === TTT));

      opts.userId = "";
      opts.feature = fUserNull;
      console.log("NO LoggedInUser, Feature owned by NULL, AccessControl = othersFF");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = othersFF;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("25. " + (result === TFF));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("26. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("27. " + (result === FFF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("28. " + (result === FFF));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("29. " + (result === TFF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("30. " + (result === TFF));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("31. " + (result === FFF));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("32. " + (result === TFF));
    
      }());
    
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("X. " + (result === TTT));
    */
    
    var denyAll = { "canCreate": false, "canUpdate": false, "canDelete": false };
    
    if (!this.loaded || !this.isEditable()) {
      return denyAll;
    }
    
    var feature = options && options.feature, userId = options && options.userId,
        caps = dojo.map((this.capabilities ? this.capabilities.toLowerCase().split(",") : []), dojo.trim),
        layerEditing = dojo.indexOf(caps, "editing") > -1,
        layerCreate = layerEditing && (dojo.indexOf(caps, "create") > -1),
        layerUpdate = layerEditing && (dojo.indexOf(caps, "update") > -1),
        layerDelete = layerEditing && (dojo.indexOf(caps, "delete") > -1),
        accessCtrl = this.ownershipBasedAccessControlForFeatures,
        fieldsInfo = this.editFieldsInfo,
        creatorField = fieldsInfo && fieldsInfo.creatorField,
        realm = fieldsInfo && fieldsInfo.realm,
        attributes = feature && feature.attributes,
        creator = (attributes && creatorField) ? attributes[creatorField] : undefined,
        retVal, userIsAdmin = !!this.userIsAdmin,
        othersCanUpdate = !accessCtrl || userIsAdmin || !!(accessCtrl.allowOthersToUpdate || accessCtrl.allowUpdateToOthers), 
        othersCanDelete = !accessCtrl || userIsAdmin || !!(accessCtrl.allowOthersToDelete || accessCtrl.allowDeleteToOthers);
    
    if (
      userIsAdmin || // arcgis.com use-case
      (layerEditing && !(layerCreate || layerUpdate || layerDelete)) // Pre 10.1 layers
    ) {
      layerCreate = layerUpdate = layerDelete = true;
    }
    
    // Start with what layer allows
    retVal = {
      "canCreate": layerCreate, 
      "canUpdate": layerUpdate, 
      "canDelete": layerDelete 
    };
    
    // Refine retVal based on various available information
    if (creator === null) {
      // Feature created by no one:
      // Can be updated or deleted by "" or "<userId>" if accessCtrl allows
      // "Feature created by null is owned by no one"
      retVal.canUpdate = layerUpdate && othersCanUpdate;
      retVal.canDelete = layerDelete && othersCanDelete;
    }
    else if (creator === "") {
      // Feature created by an anonymous user:
      // Use layer's capabilities.
      // "Feature created by anonymous users is owned by everyone"
      return retVal;
    }
    else if (creator) {
      // userId can only be "" or "<userId>". You cannot login as null.
      userId = userId || this.getUserId();
      
      if (userId && realm) {
        userId = userId + "@" + realm;
        
        // Note that realm will not be appended to anonymous users 
        // (i.e. <empty-string> values) either
      }

      if (userId.toLowerCase() === creator.toLowerCase()) {
        // Logged in user is the owner
        return retVal;
      }
      else {
        // Logged in user is NOT the owner
        // Or, user is not logged in at all (anonymous) 
        retVal.canUpdate = layerUpdate && othersCanUpdate;
        retVal.canDelete = layerDelete && othersCanDelete;
      }
    }
    
    return retVal;
  },
  
  getUserId: function() {
    var userId;
    
    if (this.loaded) {
      userId = (this.credential && this.credential.userId) || this.userId || "";
    }

    return userId;
  },
  
  setUserIsAdmin: function(isAdmin) {
    // This information will be factored in within the getEditCapabilities
    // logic above - so that widgets and other consuming code can allow or
    // disallow certain editing tools.
    // It is assumed that the calling code "somehow" determined that the 
    // logged in user is someone who owns this layer i.e. an "admin" in 
    // arcgis.com context
    this.userIsAdmin = isAdmin;
  },
  
  setEditSummaryCallback: function(callback) {
    this.editSummaryCallback = callback;
  },
  
  getEditSummary: function(feature, options, /*For Testing Only*/ currentTime) {
    // Requirements driven by arcgis.com
    // Example:
    //   Edited by Mikem on 2/1/2012 at 3:28 PM
    //   Edited by MWaltuch on Tuesday at 1:20 PM
    //   Created by mapper on Wednesday at 1:20 PM
    // Action: 
    //   Edited
    //   Created
    // Name: 
    //   by <userId>
    // Date/Time:
    //   0 - less than   1 min:   "seconds ago"
    //   1 - less than   2 mins:  "a minute ago"
    //   2 - less than  60 mins:  "<n> minutes ago" (round down)
    //  60 - less than 120 mins:  "an hour ago"
    //   2 - less than  24 hours: "<n> hours ago" (round down)
    //   1 - less than   7 days:  "on <day of the week> at <time>"
    //   Equals or greater than 7 days: "on <date> at <time>"

    /*
      // Tests:
      (function() {
      
      var scope = {
            loaded: false,
            editFieldsInfo: null,
            getEditInfo: esri.layers.FeatureLayer.prototype.getEditInfo,
            _getEditData: esri.layers.FeatureLayer.prototype._getEditData
          }, 
          testFunc = esri.layers.FeatureLayer.prototype.getEditSummary,
          infoA = { creatorField: "creator", creationDateField: "creationDate", editorField: "editor", editDateField: "editDate" }, 
          infoB = { creatorField: "creator", editorField: "editor" }, 
          infoC = { creationDateField: "creationDate", editDateField: "editDate" }, 
          infoD = { creatorField: "creator", creationDateField: "creationDate" }, 
          infoE = { editorField: "editor", editDateField: "editDate" }, 
          infoF = { creatorField: "creator" }, 
          infoG = { editorField: "editor" }, 
          infoH = { creationDateField: "creationDate" }, 
          infoI = { editDateField: "editDate" };
      
      var noAttr = {},
          emptyAttr = { attributes: {} },
          attrA1 = { attributes: { creator: "UserA", creationDate: 0 } },
          attrA2 = { attributes: { creator: "UserA", creationDate: 0, editor: "UserB", editDate: 1 } },
          attrB1 = { attributes: { creator: "UserA" } },
          attrB2 = { attributes: { creator: "UserA", editor: "UserB" } },
          attrC1 = { attributes: { creationDate: 0 } },
          attrC2 = { attributes: { creationDate: 0, editDate: 1 } },
          attrD = { attributes: { creator: "UserA", creationDate: 0 } },
          attrE = { attributes: { editor: "UserB", editDate: 1 } },
          attrF = { attributes: { creator: "UserA" } },
          attrG = { attributes: { editor: "UserB" } },
          attrH = { attributes: { creationDate: 0 } },
          attrI = { attributes: { editDate: 1 } };
      
      var printFunc = function(testNum, check, result) {
        console[check ? "log" : "error"](testNum + check + " - " + result + (result ? (" - " + esri.bundle.layers.FeatureLayer[result]) : "") );
      };
      
      var wrapper = function(testNum, attr, currentTime, expectedResult1, expectedResult2, expectedResult3) {
        var result;
        
        result = testFunc.call(scope, attr, null, currentTime);
        printFunc(testNum + "a. ", (result === expectedResult1), result);
        
        result = testFunc.call(scope, attr, { action: "creation" }, currentTime);
        printFunc(testNum + "b. ", (result === expectedResult2), result);

        result = testFunc.call(scope, attr, { action: "edit" }, currentTime);
        printFunc(testNum + "c. ", (result === expectedResult3), result);

        result = testFunc.call(scope, attr, { 
          callback: function(feature, info) {} 
        }, currentTime);
        printFunc(testNum + "d. ", (result === ""), result);

        result = testFunc.call(scope, attr, { 
          callback: function(feature, info) {
            return "<testing callback>";
          } 
        }, currentTime);
        printFunc(testNum + "e. ", (result === "<testing callback>"), result);

        scope.editSummaryCallback = function(feature, info) {
          return "<testing callback>";
        };
        result = testFunc.call(scope, attr, currentTime);
        printFunc(testNum + "f. ", (result === "<testing callback>"), result);
        scope.editSummaryCallback = null;

        result = testFunc.call(scope, attr, { 
          callback: function(feature, info) {
            if (info && (info.displayPattern === "Full")) {
              info.displayPattern = "WeekDay";
            }
            return info;
          } 
        }, currentTime);
        var exp = ( 
                    expectedResult1.indexOf("Full") > -1 ? 
                    expectedResult1.replace("Full", "WeekDay") : 
                    expectedResult1 
                   );
        printFunc(testNum + "g. ", (result === exp), result);
      };
      
      scope.loaded = false;
      console.log("0. " + (testFunc.call(scope, emptyAttr) === ""));
          
      scope.loaded = true;
      console.log("0. " + (testFunc.call(scope, emptyAttr) === ""));
      
      scope.editFieldsInfo = infoA;
      
      attrA1.attributes.creationDate = -40000;
      wrapper(1, attrA1, 0, "createUserSeconds", "createUserSeconds", "");
      attrA1.attributes.creationDate = -80000;
      wrapper(2, attrA1, 0, "createUserMinute", "createUserMinute", "");
      attrA1.attributes.creationDate = -3000000;
      wrapper(3, attrA1, 0, "createUserMinutes", "createUserMinutes", "");
      attrA1.attributes.creationDate = -2 * 3000000;
      wrapper(4, attrA1, 0, "createUserHour", "createUserHour", "");
      attrA1.attributes.creationDate = -24 * 3000000;
      wrapper(5, attrA1, 0, "createUserHours", "createUserHours", "");
      attrA1.attributes.creationDate = -7 * 24 * 3000000;
      wrapper(6, attrA1, 0, "createUserWeekDay", "createUserWeekDay", "");
      attrA1.attributes.creationDate = -14 * 24 * 3000000;
      wrapper(7, attrA1, 0, "createUserFull", "createUserFull", "");
      
      attrA2.attributes.editDate = attrA2.attributes.creationDate = -40000;
      wrapper(8, attrA2, 0, "editUserSeconds", "createUserSeconds", "editUserSeconds");
      attrA2.attributes.editDate = attrA2.attributes.creationDate = -80000;
      wrapper(9, attrA2, 0, "editUserMinute", "createUserMinute", "editUserMinute");
      attrA2.attributes.editDate = attrA2.attributes.creationDate = -3000000;
      wrapper(10, attrA2, 0, "editUserMinutes", "createUserMinutes", "editUserMinutes");
      attrA2.attributes.editDate = attrA2.attributes.creationDate = -2 * 3000000;
      wrapper(11, attrA2, 0, "editUserHour", "createUserHour", "editUserHour");
      attrA2.attributes.editDate = attrA2.attributes.creationDate = -24 * 3000000;
      wrapper(12, attrA2, 0, "editUserHours", "createUserHours", "editUserHours");
      attrA2.attributes.editDate = attrA2.attributes.creationDate = -7 * 24 * 3000000;
      wrapper(13, attrA2, 0, "editUserWeekDay", "createUserWeekDay", "editUserWeekDay");
      attrA2.attributes.editDate = attrA2.attributes.creationDate = -14 * 24 * 3000000;
      wrapper(14, attrA2, 0, "editUserFull", "createUserFull", "editUserFull");
      
      scope.editFieldsInfo = infoB;
      wrapper(15, attrB1, 0, "createUser", "createUser", "");
      wrapper(16, attrB2, 0, "editUser", "createUser", "editUser");
      
      scope.editFieldsInfo = infoC;
      
      attrC1.attributes.creationDate = -40000;
      wrapper(17, attrC1, 0, "createSeconds", "createSeconds", "");
      attrC1.attributes.creationDate = -80000;
      wrapper(18, attrC1, 0, "createMinute", "createMinute", "");
      attrC1.attributes.creationDate = -3000000;
      wrapper(19, attrC1, 0, "createMinutes", "createMinutes", "");
      attrC1.attributes.creationDate = -2 * 3000000;
      wrapper(20, attrC1, 0, "createHour", "createHour", "");
      attrC1.attributes.creationDate = -24 * 3000000;
      wrapper(21, attrC1, 0, "createHours", "createHours", "");
      attrC1.attributes.creationDate = -7 * 24 * 3000000;
      wrapper(22, attrC1, 0, "createWeekDay", "createWeekDay", "");
      attrC1.attributes.creationDate = -14 * 24 * 3000000;
      wrapper(23, attrC1, 0, "createFull", "createFull", "");
      
      attrC2.attributes.editDate = attrC2.attributes.creationDate = -40000;
      wrapper(24, attrC2, 0, "editSeconds", "createSeconds", "editSeconds");
      attrC2.attributes.editDate = attrC2.attributes.creationDate = -80000;
      wrapper(25, attrC2, 0, "editMinute", "createMinute", "editMinute");
      attrC2.attributes.editDate = attrC2.attributes.creationDate = -3000000;
      wrapper(26, attrC2, 0, "editMinutes", "createMinutes", "editMinutes");
      attrC2.attributes.editDate = attrC2.attributes.creationDate = -2 * 3000000;
      wrapper(27, attrC2, 0, "editHour", "createHour", "editHour");
      attrC2.attributes.editDate = attrC2.attributes.creationDate = -24 * 3000000;
      wrapper(28, attrC2, 0, "editHours", "createHours", "editHours");
      attrC2.attributes.editDate = attrC2.attributes.creationDate = -7 * 24 * 3000000;
      wrapper(29, attrC2, 0, "editWeekDay", "createWeekDay", "editWeekDay");
      attrC2.attributes.editDate = attrC2.attributes.creationDate = -14 * 24 * 3000000;
      wrapper(30, attrC2, 0, "editFull", "createFull", "editFull");
      
      scope.editFieldsInfo = infoD;
      
      attrD.attributes.creationDate = -40000;
      wrapper(31, attrD, 0, "createUserSeconds", "createUserSeconds", "");
      attrD.attributes.creationDate = -80000;
      wrapper(32, attrD, 0, "createUserMinute", "createUserMinute", "");
      attrD.attributes.creationDate = -3000000;
      wrapper(33, attrD, 0, "createUserMinutes", "createUserMinutes", "");
      attrD.attributes.creationDate = -2 * 3000000;
      wrapper(34, attrD, 0, "createUserHour", "createUserHour", "");
      attrD.attributes.creationDate = -24 * 3000000;
      wrapper(35, attrD, 0, "createUserHours", "createUserHours", "");
      attrD.attributes.creationDate = -7 * 24 * 3000000;
      wrapper(36, attrD, 0, "createUserWeekDay", "createUserWeekDay", "");
      attrD.attributes.creationDate = -14 * 24 * 3000000;
      wrapper(37, attrD, 0, "createUserFull", "createUserFull", "");
      
      scope.editFieldsInfo = infoE;
      
      attrE.attributes.editDate = -40000;
      wrapper(38, attrE, 0, "editUserSeconds", "", "editUserSeconds");
      attrE.attributes.editDate = -80000;
      wrapper(39, attrE, 0, "editUserMinute", "", "editUserMinute");
      attrE.attributes.editDate = -3000000;
      wrapper(40, attrE, 0, "editUserMinutes", "", "editUserMinutes");
      attrE.attributes.editDate = -2 * 3000000;
      wrapper(41, attrE, 0, "editUserHour", "", "editUserHour");
      attrE.attributes.editDate = -24 * 3000000;
      wrapper(42, attrE, 0, "editUserHours", "", "editUserHours");
      attrE.attributes.editDate = -7 * 24 * 3000000;
      wrapper(43, attrE, 0, "editUserWeekDay", "", "editUserWeekDay");
      attrE.attributes.editDate = -14 * 24 * 3000000;
      wrapper(44, attrE, 0, "editUserFull", "", "editUserFull");
      
      scope.editFieldsInfo = infoF;
      wrapper(45, attrF, 0, "createUser", "createUser", "");
      
      scope.editFieldsInfo = infoG;
      wrapper(46, attrG, 0, "editUser", "", "editUser");
                
      scope.editFieldsInfo = infoH;
      
      attrH.attributes.creationDate = -40000;
      wrapper(47, attrH, 0, "createSeconds", "createSeconds", "");
      attrH.attributes.creationDate = -80000;
      wrapper(48, attrH, 0, "createMinute", "createMinute", "");
      attrH.attributes.creationDate = -3000000;
      wrapper(49, attrH, 0, "createMinutes", "createMinutes", "");
      attrH.attributes.creationDate = -2 * 3000000;
      wrapper(50, attrH, 0, "createHour", "createHour", "");
      attrH.attributes.creationDate = -24 * 3000000;
      wrapper(51, attrH, 0, "createHours", "createHours", "");
      attrH.attributes.creationDate = -7 * 24 * 3000000;
      wrapper(52, attrH, 0, "createWeekDay", "createWeekDay", "");
      attrH.attributes.creationDate = -14 * 24 * 3000000;
      wrapper(53, attrH, 0, "createFull", "createFull", "");
      
      scope.editFieldsInfo = infoI;
      
      attrI.attributes.editDate = -40000;
      wrapper(54, attrI, 0, "editSeconds", "", "editSeconds");
      attrI.attributes.editDate = -80000;
      wrapper(55, attrI, 0, "editMinute", "", "editMinute");
      attrI.attributes.editDate = -3000000;
      wrapper(56, attrI, 0, "editMinutes", "", "editMinutes");
      attrI.attributes.editDate = -2 * 3000000;
      wrapper(57, attrI, 0, "editHour", "", "editHour");
      attrI.attributes.editDate = -24 * 3000000;
      wrapper(58, attrI, 0, "editHours", "", "editHours");
      attrI.attributes.editDate = -7 * 24 * 3000000;
      wrapper(59, attrI, 0, "editWeekDay", "", "editWeekDay");
      attrI.attributes.editDate = -14 * 24 * 3000000;
      wrapper(60, attrI, 0, "editFull", "", "editFull");

      }());
    */
    
    currentTime = esri._isDefined(currentTime) ? currentTime : (new Date()).getTime();

    var summary = "", info = this.getEditInfo(feature, options, currentTime),
        callback = (options && options.callback) || this.editSummaryCallback;
    
    // Callback support for developer customization
    if (callback) {
      info = callback(feature, info) || "";
      
      // callback function may return one of the following:
      // - "info" object with modified properties
      // - final "summary" string (callback should take care of localization if needed)
      // - null/undefined/"" implying empty string
    }
    
    if (dojo.isString(info)) {
      summary = info;
    }
    else {
      if (info) {
        var action = info.action, userId = info.userId, timeValue = info.timeValue,
            count = 0;
        
        // How many display components do we have?
        if (action) { count++; }
        if (userId) { count++; } // null and <empty string> are not displayworthy
        if (esri._isDefined(timeValue)) { count++; }
        
        // We need atleast two components to display a meaningful summary
        if (count > 1) {
          summary = (action === "edit" ? "edit" : "create") + 
                    (userId ? "User" : "") + 
                    (esri._isDefined(timeValue) ? info.displayPattern : "");
        }
      }

      // NOTE
      // Comment out this section when testing using the unit test cases at the
      // beginning of this method
      //console.log(info, summary);
      summary = summary && esri.substitute(info, esri.bundle.layers.FeatureLayer[summary]);
    }
    
    return summary;
  },
  
  getEditInfo: function(feature, options, /*For Testing Only*/ currentTime) {
    if (!this.loaded) {
      return;
    }
    
    currentTime = esri._isDefined(currentTime) ? currentTime : (new Date()).getTime();
    
    var reqAction = (options && options.action) || "last",
        fieldsInfo = this.editFieldsInfo,
        creatorField = fieldsInfo && fieldsInfo.creatorField,
        creationDateField = fieldsInfo && fieldsInfo.creationDateField,
        editorField = fieldsInfo && fieldsInfo.editorField,
        editDateField = fieldsInfo && fieldsInfo.editDateField,
        realm = fieldsInfo && fieldsInfo.realm,
        attributes = feature && feature.attributes,
        creator = (attributes && creatorField) ? attributes[creatorField] : undefined,
        creationDate = (attributes && creationDateField) ? attributes[creationDateField] : null,
        editor = (attributes && editorField) ? attributes[editorField] : undefined,
        editDate = (attributes && editDateField) ? attributes[editDateField] : null,
        creationData = this._getEditData(creator, creationDate, currentTime),
        editData = this._getEditData(editor, editDate, currentTime),
        retVal;
    
    switch(reqAction) {
      case "creation":
        retVal = creationData;
        break;
      case "edit":
        retVal = editData;
        break;
      case "last":
        retVal = editData || creationData;
        break;
    }
    
    if (retVal) {
      retVal.action = (retVal === editData) ? "edit" : "creation";
      //retVal.userId = retVal.userId || ""; // we don't want to show null and "" as userIds
    }
    
    return retVal;
  },
  
  _getEditData: function(userId, timeValue, currentTime) {
    var data, timeDiff, displayPattern,
        oneMin = 60000,
        mins60 = 3600000, // 60 * 60 * 1000,
        mins120 = 2 * mins60,
        hours24 = 24 * mins60,
        days7 = 7 * hours24;
    
    if (esri._isDefined(timeValue)) {
      timeDiff = currentTime - timeValue;
      //console.log(currentTime, timeValue, timeDiff );
      
      if (timeDiff < 0) {
        // This condition is really a fallback for assertion failure.
        // Assertion: a feature cannot have timestamp later than current time
        displayPattern = "Full";
      }
      else if (timeDiff < oneMin) {
        displayPattern = "Seconds";
      }
      else if (timeDiff < (2 * oneMin)) {
        displayPattern = "Minute";
      }
      else if (timeDiff < mins60) {
        displayPattern = "Minutes";
      }
      else if (timeDiff < mins120) {
        displayPattern = "Hour";
      }
      else if (timeDiff < hours24) {
        displayPattern = "Hours";
      }
      else if (timeDiff < days7) {
        displayPattern = "WeekDay";
      }
      else {
        displayPattern = "Full";
      }
    }

    if ((userId !== undefined) || displayPattern) {
      data = data || {};

      data.userId = userId; // can be undefined, null, "" or "<userId>"

      if (displayPattern) {
        var localeFormat = dojo.date.locale.format, dateObject = new Date(timeValue);
        
        data.minutes = Math.floor(timeDiff / oneMin);
        data.hours = Math.floor(timeDiff / mins60);
        data.weekDay = localeFormat(dateObject, { datePattern: "EEEE", selector: "date" });
        data.formattedDate = localeFormat(dateObject, { selector: "date" });
        data.formattedTime = localeFormat(dateObject, { selector: "time" });
        data.displayPattern = displayPattern;
        data.timeValue = timeValue;
      }
    }
    
    return data; // can be: undefined/have userId/have time components/have both userId and time
  },
  
  isEditable: function() {
    return !!(this._editable || this.userIsAdmin);
  },
  
  setMaxAllowableOffset: function(offset) {
    if (!this.isEditable()) {
      this._maxOffset = offset;
    }
    return this;
  },
  
  getMaxAllowableOffset: function() {
    return this._maxOffset;
  },
  
  setAutoGeneralize: function(enable) {
    if (!this.loaded) {
      this._optAutoGen = enable;
    }
    else if (
      !this.isEditable() && 
      (this.mode !== this.constructor.MODE_SNAPSHOT) &&
      ((this.geometryType === "esriGeometryPolyline") || (this.geometryType === "esriGeometryPolygon"))
    ) {
      this._autoGeneralize = enable;
      
      if (enable) {
        var map = this._map;
        if (map && map.loaded) {
          this._maxOffset = Math.floor(map.extent.getWidth() / map.width);
        }
      }
      else {
        delete this._maxOffset;
      }
    }
    
    return this;
  },
  
  setScaleRange: function(/*Number*/ minScale, /*Number*/ maxScale) {
    this.minScale = minScale || 0;
    this.maxScale = maxScale || 0;
    
    // listen for map zoom end to act on scale dependency
    //this.minScale = 0; this.maxScale = 44000;
    if (this._map && this._map.loaded) {
      /*if (minScale !== 0 || maxScale !== 0) {
        if (!this._zoomConnect) {
          this._zoomConnect = dojo.connect(this._map, "onZoomEnd", this, this._updateStatus);
        }
      }
      else {
        dojo.disconnect(this._zoomConnect);
        this._zoomConnect = null;
      }*/

      // effective immediately
      this._updateStatus();
    }
  },
  
  setGDBVersion: function(versionName) {
    if (
      !this._collection && 
      (versionName !== this.gdbVersion) && 
      (versionName || this.gdbVersion) // to catch null !== undefined !== "" passing the above condition
    ) {
      this.gdbVersion = versionName;
      this._task.gdbVersion = versionName;
      this._url.query = dojo.mixin(this._url.query, { gdbVersion: versionName });
      
      if (this.loaded) { // layer has loaded
        // this should finalize ongoing edits
        this.clearSelection();
        
        if (this._map) { // layer has been added to the map
          this.refresh();
        }
      }
      
      this.onGDBVersionChange();
    }
    
    return this;
  },
  
  setDefinitionExpression: function(/*String*/ expr) {
    this._defnExpr = expr;
    var mode = this._mode;
    if (mode) {
      mode.propertyChangeHandler(/*definition expression changed*/ 1);
    }
    return this;
  },
  
  getDefinitionExpression: function() {
    return this._defnExpr; // === undefined ? this.defaultDefinitionExpression : this._defnExpr;
  },
  
  setTimeDefinition: function(/*esri.TimeExtent*/ timeDefn) {
    if (/*this.timeInfo &&*/ this._isSnapshot) {
      this._timeDefn = timeDefn;
  
      var mode = this._mode;
      if (mode) {
        mode.propertyChangeHandler(/*snapshot time definition changed*/ 2);
      }
    }
    return this;
  },
  
  getTimeDefinition: function() {
    return this._timeDefn;
  },
  
  setTimeOffset: function(offsetValue, offsetUnits) {
    this._timeOffset = offsetValue;
    this._timeOffsetUnits = offsetUnits;
    var mode = this._mode;
    if (mode) {
      mode.propertyChangeHandler(/*map time extent changed*/ 0);
    }
    return this;
  },
  
  setUseMapTime: function(use) {
    this.useMapTime = use;
    this._toggleTime(!this._suspended);

    var mode = this._mode;
    if (mode) {
      mode.propertyChangeHandler(/*map time extent changed*/ 0);
    }
  },
  
  selectFeatures: function(/*esri.tasks.Query*/ query, /*Number?*/ selectionMethod, /*Function?*/ callback, /*Function?*/ errback) {
    selectionMethod = selectionMethod || this.constructor.SELECTION_NEW;
    
    var query2 = this._getShallowClone(query),
        map = this._map, featureSet,
        dfd = esri._fixDfd(new dojo.Deferred(esri._dfdCanceller));
    
    // override user query
    query2.outFields = this._getOutFields();
    query2.returnGeometry = true;
    if (map) {
      query2.outSpatialReference = new esri.SpatialReference(map.spatialReference.toJson());
    }
    
    // apply query filters
    if (!this._applyQueryFilters(query2)) {
//      return; // abort selection
      featureSet = { features: [] };
      // TODO
      // Need to consider doing setTimeout with delay=0
      this._selectHandler(featureSet, selectionMethod, callback, errback, dfd);
      //return this._getDeferred([featureSet.features, selectionMethod]);
      return dfd;
    }
    
    var queryTypes = this._canDoClientSideQuery(query2);
    if (queryTypes) { // use client-side implementation of selection
      featureSet = { features: this._doQuery(query2, queryTypes) };
      this._selectHandler(featureSet, selectionMethod, callback, errback, dfd);
      //return this._getDeferred([featureSet.features, selectionMethod]);
      return dfd;
    }
    else { // go to server
      if (this._collection) {
        var err = new Error("FeatureLayer::selectFeatures - " + esri.bundle.layers.FeatureLayer.invalidParams);
        /*if (errback) {
          errback(err);
        }
        return this._getDeferred(null, err);*/
       
        this._resolve([err], null, errback, dfd, true);
        return dfd;
      }

      var self = this;
      
      if (this._ts) {
        query2._ts = (new Date()).getTime();
      }

      var temp = dfd._pendingDfd = this._task.execute(query2);
      temp.addCallbacks(
        function(response) {
          self._selectHandler(response, selectionMethod, callback, errback, dfd);
        }, 
        function(err) {
          //dfd.errback(err);
          self._resolve([err], null, errback, dfd, true);
        }
      );
      
      return dfd;
    }
  },
  
  getSelectedFeatures: function() {
    var selected = this._selectedFeatures, retVal = [], item;
    
    for (item in selected) {
      if (selected.hasOwnProperty(item)) {
        retVal.push(selected[item]);
      }
    }
    
    /*selected = this._selectedFeaturesArr;
    if (selected.length > 0) {
      retVal = retVal.concat(selected);
    }*/
    
    return retVal;
  },
  
  clearSelection: function(silent) {
    // unselect and clear the selection
    var selected = this._selectedFeatures, mode = this._mode, item;
    
    for (item in selected) {
      if (selected.hasOwnProperty(item)) {
        this._unSelectFeatureIIf(item, mode);
        mode._removeFeatureIIf(item);
      }
    }
    this._selectedFeatures = {};
    
    /*selected = this._selectedFeaturesArr;
    var i = selected.length;
    while (i >= 0) {
      this._unSelectNewFeature(selected[i]);
      i--;
    }
    this._selectedFeaturesArr = [];*/

    if (this._isSelOnly) {
      mode._applyTimeFilter(true);
    }
    
    if (!silent) {
      this.onSelectionClear();
    }
    return this;
  },
  
  setSelectionSymbol: function(/*esri.symbol.Symbol*/ symbol) {
    this._selectionSymbol = symbol;
    
    if (symbol) {
      // apply it to the current selection
      var selected = this._selectedFeatures, item;
      for (item in selected) {
        if (selected.hasOwnProperty(item)) {
          selected[item].setSymbol(symbol);
        }
      }
    }
    
    return this;
  },
  
  getSelectionSymbol: function() {
    return this._selectionSymbol;
  },
  
  // Methods to be wrapped with normalize logic
  __msigns: [
    {
      n: "applyEdits",
      c: 5, // number of arguments expected by the method before the normalize era
      a: [ // arguments or properties of arguments that need to be normalized
        { i: 0 },
        { i: 1 }
      ],
      e: 4,
      f: 1
    }
  ],
  
  applyEdits: function(/*esri.Graphic[]*/ adds, /*esri.Graphic[]*/ updates, /*esri.Graphic[]*/ deletes, 
                       /*Function?*/ callback, /*Function?*/ errback, context) {
    
    // Use normalized geometries in place of the originals
    var assembly = context.assembly, dfd = context.dfd;
    // "adds" and "updates" will be mutated in-place
    this._applyNormalized(adds, assembly && assembly[0]);
    this._applyNormalized(updates, assembly && assembly[1]);
    
    // This event will be fired just before the edits request is sent 
    // to the server when 'FeatureLayer.applyEdits' method is called. 
    // You wouldn't need to use this event for most cases. But when 
    // using the Editor widget, this event can be used to intercept 
    // feature edits to, for example, to add additional attributes to 
    // newly created features that you did not want to show in the 
    // attribute inspector.
    this.onBeforeApplyEdits(adds, updates, deletes);
    
    var i, updatesMap = {}, oidField = this.objectIdField, content = { f: "json" }, dirty = false;

    if (this._collection) {
      // process edits on the client. there is no service to talk to.
      var response = {};
      
      response.addResults = adds ? dojo.map(adds, function() {
        dirty = true;
        return { objectId: this._nextId++, success: true };
      }, this) : null;
      
      response.updateResults = updates ? dojo.map(updates, function(feature) {
        dirty = true;
        var oid = feature.attributes[oidField];
        updatesMap[oid] = feature;
        return { objectId: oid, success: true };
      }, this) : null;
      
      response.deleteResults = deletes ? dojo.map(deletes, function(feature) {
        dirty = true;
        return { objectId: feature.attributes[oidField], success: true };
      }, this) : null;
      
      if (dirty) {
        this._editHandler(response, adds, updatesMap, callback, errback, dfd);
        //return this._getDeferred([response.addResults, response.updateResults, response.deleteResults]);
      }
      return;
    }
    
    // add features
    if (adds && adds.length > 0) {
      content.adds = this._convertFeaturesToJson(adds, 0, 1);
      dirty = true;
    }
    
    // update features
    if (updates && updates.length > 0) {
      for (i = 0; i < updates.length; i++) {
        var update = updates[i];
        updatesMap[update.attributes[oidField]] = update;
      }
      content.updates = this._convertFeaturesToJson(updates, 0, 0, 1);
      dirty = true;
    }
    
    // delete features
    if (deletes && deletes.length > 0) {
      var ids = [];
      for (i = 0; i < deletes.length; i++) {
        ids.push(deletes[i].attributes[oidField]);
      }
      content.deletes = ids.join(",");
      dirty = true;
    }
    
    if (dirty) {
      var self = this;
      
      return esri.request({
        url: this._url.path + "/applyEdits",
        content: dojo.mixin(content, this._url.query),
        callbackParamName: "callback",
        load: function(response) {
          self._editHandler(response, adds, updatesMap, callback, errback, dfd);
        },
        error: function(err) {
          self._resolve([err], null, errback, dfd, true);
        }
      }, { usePost: true });
    }
  },
  
  queryFeatures: function(/*esri.tasks.Query*/ query, /*Function?*/ callback, /*Function?*/ errback) {
    return this._query("execute", "onQueryFeaturesComplete", query, callback, errback);
  },
  
  queryRelatedFeatures: function(/*esri.tasks.RelationshipQuery*/ query, /*Function?*/ callback, /*Function?*/ errback) {
    return this._query("executeRelationshipQuery", "onQueryRelatedFeaturesComplete", query, callback, errback);
  },
  
  queryIds: function(/*esri.tasks.Query*/ query, /*Function?*/ callback, /*Function?*/ errback) {
    return this._query("executeForIds", "onQueryIdsComplete", query, callback, errback);
  },
  
  queryCount: function(/*esri.tasks.Query*/ query, /*Function?*/ callback, /*Function?*/ errback) {
    return this._query("executeForCount", "onQueryCountComplete", query, callback, errback);
  },
  
  queryAttachmentInfos: function(/*Number*/ objectId, callback, errback) {
    var url = this._url.path + "/" + objectId + "/attachments",
        dfd = new dojo.Deferred(esri._dfdCanceller),
        self = this;
    
    dfd._pendingDfd = esri.request({
      url: url,
      content: dojo.mixin({ f: "json" }, this._url.query),
      callbackParamName: "callback",
      
      load: function(response) {
        var infos = response.attachmentInfos,
          params;
        dojo.forEach(infos, function(info) {
          params = dojo.objectToQuery({
            gdbVersion: self._url.query && self._url.query.gdbVersion,
            layer: self._url.query && self._url.query.layer,
            token: self._getToken()
          });
          info.url = url + "/" + info.id + (params ? ("?" + params) : "");
          info.objectId = objectId;
        });
        
        /*this.onQueryAttachmentInfosComplete(infos);
        if (callback) {
          callback(infos);
        }*/
        
        self._resolve([infos], "onQueryAttachmentInfosComplete", callback, dfd);
      },
      
      error: function(err) {
        self._resolve([err], null, errback, dfd, true);
      }
    });
    
    return dfd;
  },
  
  addAttachment: function(/*Number*/ objectId, formNode, callback, errback) {
    return this._sendAttachment("add", objectId, formNode, callback, errback);
  },
  
  updateAttachment: function(/*Number*/ objectId, /*Number*/ attachmentId, formNode, callback, errback) {
    formNode.appendChild( dojo.create("input", { type: "hidden", name: "attachmentId", value: attachmentId }) );
    return this._sendAttachment("update", objectId, formNode, callback, errback);
  },
  
  deleteAttachments: function(/*Number*/ objectId, /*Number[]*/ attachmentIds, callback, errback) {
    var url = this._url.path + "/" + objectId + "/deleteAttachments",
        dfd = new dojo.Deferred(esri._dfdCanceller),
        self = this,
        content = {
          f: "json",
          attachmentIds: attachmentIds.join(",")
        };
    
    dfd._pendingDfd = esri.request({
      url: url,
      content: dojo.mixin(content, this._url.query),
      callbackParamName: "callback",
      
      load: dojo.hitch(this, function(response) {
        var results = response.deleteAttachmentResults;
        results = dojo.map(results, function(result) {
          var res = new esri.layers.FeatureEditResult(result);
          res.attachmentId = res.objectId;
          res.objectId = objectId;
          return res;
        });
        
        /*this.onDeleteAttachmentsComplete(results);
        if (callback) {
          callback(results);
        }*/
        
        self._resolve([results], "onDeleteAttachmentsComplete", callback, dfd);
      }), // load handler
      
      error: function(err) {
        self._resolve([err], null, errback, dfd, true);
      }
    }, { usePost: true });
    
    return dfd;
  },
  
  addType: function(newType) {
    // we want to add types to FS layers that are editable but don't have types and templates
    // this is the case for old hosted FS
    //if (!this._collection) {
    //  return false;
    //}
    
    var types = this.types;

    if (types) {
      var found = dojo.some(types, function(type) {
        if (type.id == newType.id) {
          return true;
        }
        return false;
      }); // some
      
      if (found) { // type already exists
        return false;
      }
      else { // new type, add it
        types.push(newType);
      }
    }
    else { // layer has no types yet
      this.types = [ newType ];
    }

    this._typesDirty = true;
    return true;
  },
  
  deleteType: function(typeId) {
    if (!this._collection) {
      return;
    }
    
    var types = this.types;
    
    if (types) {
      var found = -1;
      dojo.some(types, function(type, index) {
        if (type.id == typeId) {
          found = index;
          return true;
        }
        return false;
      }); // some
      
      if (found > -1) { // type exists
        this._typesDirty = true;
        return types.splice(found, 1)[0];
      }
    }
  },
  
  toJson: function() {
    var _json = this._json, json = dojo.isString(_json) ? dojo.fromJson(_json) : dojo.clone(_json);
    if (!json) {
      return;
    }
    
    json = json.layerDefinition ? json : { layerDefinition: json };
    
    var definition = json.layerDefinition, collection = this._collection;
    
    // if collection, update layerDefinition
    if (collection && this._typesDirty) {
      // update types
      definition.types = dojo.map(this.types || [], function(type) {
        return type.toJson();
      });

      // update renderer
      var renderer = this.renderer, drawInfo = definition.drawingInfo;
      if (drawInfo && renderer && renderer.declaredClass.indexOf("TemporalRenderer") === -1) {
        drawInfo.renderer = renderer.toJson();
      }
    }
    
    var outFeatureSet = null;
    if (!(collection && !this._fcAdded)) {
      outFeatureSet = {
        geometryType: definition.geometryType,
        features: this._convertFeaturesToJson(this.graphics, true/*, collection ? this.objectIdField : null*/)
      };
    }
    
    json.featureSet = dojo.mixin({}, json.featureSet || {}, outFeatureSet);
    
    // webmap spec
    if (collection) {
      json.nextObjectId = this._nextId;
      definition.capabilities = this.capabilities;
    }
    
    return json;
  },
  
  /*********
   * Events
   *********/
  
  onSelectionComplete: function() {},
  onSelectionClear: function() {},
  onBeforeApplyEdits: function() {},
  onEditsComplete: function() {},
  onQueryFeaturesComplete: function() {},
  onQueryRelatedFeaturesComplete: function() {},
  onQueryIdsComplete: function() {},
  onQueryCountComplete: function() {},
  onQueryAttachmentInfosComplete: function() {},
  onAddAttachmentComplete: function() {},
  onUpdateAttachmentComplete: function() {},
  onDeleteAttachmentsComplete: function() {},
  onCapabilitiesChange: function() {},
  onGDBVersionChange: function() {},
  onQueryLimitExceeded: function() {},
  
  /*******************
   * Internal Methods
   *******************/
  
  _updateCaps: function() {
    /*
      // Tests:
      (function() {
      
      var scope = { _editable: null, capabilities: null },
          result;
      
      console.log("Editable = FALSE");
      
      scope._editable = false; scope.capabilities = "";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("1. " + (scope.capabilities === ""));
          
      scope._editable = false; scope.capabilities = "Editing";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("2. " + (scope.capabilities === ""));
          
      scope._editable = false; scope.capabilities = "Editing,Create";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("3. " + (scope.capabilities === ""));
          
      scope._editable = false; scope.capabilities = "Editing,Create,Update";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("4. " + (scope.capabilities === ""));
          
      scope._editable = false; scope.capabilities = "Editing,Create,Update,Delete";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("5. " + (scope.capabilities === ""));
      
      scope._editable = false; scope.capabilities = undefined;
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("6. " + (scope.capabilities === ""));
          
      scope._editable = false; scope.capabilities = "Query";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("7. " + (scope.capabilities === "Query"));
          
      scope._editable = false; scope.capabilities = "Query,Editing";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("8. " + (scope.capabilities === "Query"));
      
      console.log("Editable = TRUE");
      
      scope._editable = true; scope.capabilities = "";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("1. " + (scope.capabilities === "Editing"));
          
      scope._editable = true; scope.capabilities = "Editing";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("2. " + (scope.capabilities === "Editing"));
          
      scope._editable = true; scope.capabilities = "Editing,Create";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("3. " + (scope.capabilities === "Editing,Create"));
          
      scope._editable = true; scope.capabilities = "Editing,Create,Update";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("4. " + (scope.capabilities === "Editing,Create,Update"));
          
      scope._editable = true; scope.capabilities = "Editing,Create,Update,Delete";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("5. " + (scope.capabilities === "Editing,Create,Update,Delete"));
      
      scope._editable = true; scope.capabilities = undefined;
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("6. " + (scope.capabilities === "Editing"));
          
      scope._editable = true; scope.capabilities = "Query";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("7. " + (scope.capabilities === "Query,Editing"));
          
      scope._editable = true; scope.capabilities = "Query,Editing";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("8. " + (scope.capabilities === "Query,Editing"));

      console.log("Editable = TRUE, SPACES in capabilities");
          
      scope._editable = true; scope.capabilities = "Query, Editing, Delete";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("1. " + (scope.capabilities === "Query,Editing,Delete"));
          
      scope._editable = true; scope.capabilities = "Query, Editing, Update";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("2. " + (scope.capabilities === "Query,Editing,Update"));
          
      scope._editable = true; scope.capabilities = "Query, Editing, Update, Delete";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("3. " + (scope.capabilities === "Query,Editing,Update,Delete"));
          
      scope._editable = true; scope.capabilities = "Query, Editing, Create, Delete";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("4. " + (scope.capabilities === "Query,Editing,Create,Delete"));
          
      scope._editable = true; scope.capabilities = "Query, Editing, Create, Update";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("5. " + (scope.capabilities === "Query,Editing,Create,Update"));
          
      scope._editable = true; scope.capabilities = "Query, Editing, Create";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("6. " + (scope.capabilities === "Query,Editing,Create"));
          
      scope._editable = true; scope.capabilities = "Query, Editing, Create, Update, Delete";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("7. " + (scope.capabilities === "Query,Editing,Create,Update,Delete"));
      
      }());
      
      result = dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("X. " + (result === TTT));
    */
    
    // Update "capabilities" to reflect current state of the layer's
    // editability
    
    var editable = this._editable, capabilities = dojo.trim(this.capabilities || ""),
        outCaps = dojo.map((capabilities ? capabilities.split(",") : []), dojo.trim),
        caps = dojo.map((capabilities ? capabilities.toLowerCase().split(",") : []), dojo.trim),
        found = dojo.indexOf(caps, "editing"), cap, i, toRemove,
        specifics = {
          "Create": dojo.indexOf(caps, "create"),
          "Update": dojo.indexOf(caps, "update"),
          "Delete": dojo.indexOf(caps, "delete")
        };
    
    if (editable && found === -1) {
      outCaps.push("Editing");
      
      // Push Create, Update and Delete as well
      /*for (cap in specifics) {
        if (specifics[cap] === -1) {
          outCaps.push(cap);
        }
      }*/
    }
    else if (!editable && found > -1) {
      toRemove = [ found ];
      
      // Remove Create, Update and Delete as well
      for (cap in specifics) {
        if (specifics[cap] > -1) {
          toRemove.push(specifics[cap]);
        }
      }
      
      toRemove.sort();
      for (i = toRemove.length - 1; i >=0; i--) {
        outCaps.splice(toRemove[i], 1);
      }
    }
    
    this.capabilities = outCaps.join(",");
  },
  
  _counter: { value: 0 }, // this object will be shared by all feature layer instances
  
  _getUniqueId: function() {
    return this._counter.value++;
  },
    
  // (override)
  _getDesiredStatus: function() {
    // Returns true if the layer shold be alive, false otherwise
    return this.visible && this._isMapAtVisibleScale();
  },
  
  _isMapAtVisibleScale: function() {
    if (!this._map) {
      return false;
    }
    
    var scale = esri.geometry.getScale(this._map);
    //console.info(scale);
    
    // Examples:
    // minScale = 25000, maxScale = 7500
    // minScale = 0, maxScale = 7500
    // minScale = 7499, maxScale = 0
    // minScale = 0, maxScale = 0
    // More on semantics here: http://webhelp.esri.com/arcgisdesktop/9.3/index.cfm?TopicName=Displaying_layers_at_certain_scales
    
    var minScale = this.minScale, maxScale = this.maxScale, minPassed = !minScale, maxPassed = !maxScale;
    if (!minPassed && scale <= minScale) {
      minPassed = true;
    }
    if (!maxPassed && scale >= maxScale) {
      maxPassed = true;
    }
    
    return (minPassed && maxPassed) ? true : false;
  },
  
  // (extend)
  _suspend: function() {
    //console.info("suspending...");
    this.inherited("_suspend", arguments);
    this._toggleTime(false);
    var mode = this._mode;
    if (mode) {
      mode.suspend();
    }
  },
  
  // (extend)
  _resume: function() {
    //console.info("resuming...");
    this.inherited("_resume", arguments);
    this._toggleTime(true);
    var mode = this._mode;
    if (mode) {
      mode.resume();
    }
  },
  
  _zoomHandler: function() {
    var map = this._map;

    if (map && map.loaded) {
      if (this._autoGeneralize) {
        this._maxOffset = Math.floor(map.extent.getWidth() / map.width);
      }

      this._updateStatus();
    }
  },
  
  _toggleTime: function(enable) {
    //if (this.timeInfo) {
      var map = this._map;
      if (enable && this.timeInfo && this.useMapTime && map) {
        this._mapTimeExtent = map.timeExtent;
        if (!this._timeConnect) {
          this._timeConnect = dojo.connect(map, "onTimeExtentChange", this, this._timeChangeHandler);
        }
      }
      else {
        this._mapTimeExtent = null;
        dojo.disconnect(this._timeConnect);
        this._timeConnect = null;
      }
    //} 
  },
  
  _timeChangeHandler: function(newTimeExtent) {
    this._mapTimeExtent = newTimeExtent;
    var mode = this._mode;
    if (mode) {
      mode.propertyChangeHandler(/*map time extent changed*/ 0);
    }
  },
  
  _getOffsettedTE: function(timeExtent) {
    var offset = this._timeOffset, units = this._timeOffsetUnits;
    return (timeExtent && offset && units) ? timeExtent.offset(-1 * offset, units) : timeExtent;
  },
  
  _getTimeOverlap: function(timeExtent1, timeExtent2) {
    if (timeExtent1 && timeExtent2) {
      return timeExtent1.intersection(timeExtent2);
    }
    else {
      return timeExtent1 || timeExtent2;
    }
  },
  
  _getTimeFilter: function(queryTime) {
    // The effective time filter is the overlap
    // between query time, layer time defn and map time extent
    // If atleast two of the above variables have values and there is no
    // overlap, then ABORT selection
    
    // Group 1: NO queryTime
    
    /*// Subgroup 1: NO time definition, NO time extent
       var tDefn = null;
       var tExtent = null;
       console.log( (ov = _getTimeFilter(null)) && ov[0] === true && !ov[1] );
    
    // Subgroup 2: time definition + time extent
    
    //   Subgroup 1: overlap
         var tDefn = { startTime: 10, endTime: 20 };
         var tExtent = { startTime: 5, endTime: 15 };
         console.log( (ov = _getTimeFilter(null)) && ov[0] === true && (ov[1].startTime + "," + ov[1].endTime === "10,15") );
    
    //   Subgroup 2: NO overlap
         var tDefn = { startTime: 10, endTime: 20 };
         var tExtent = { startTime: 30, endTime: 40 };
         console.log( (ov = _getTimeFilter(null)) && ov[0] === false );
    
    // Subgroup 3: time definition + NO time extent
       var tDefn = { startTime: 10, endTime: 20 };
       var tExtent = null;
       console.log( (ov = _getTimeFilter(null)) && ov[0] === true && (ov[1].startTime + "," + ov[1].endTime === "10,20") );
    
    // Subgroup 4: NO time definition + time extent
       var tDefn = null;
       var tExtent = { startTime: 5, endTime: 10 };
       console.log( (ov = _getTimeFilter(null)) && ov[0] === true && (ov[1].startTime + "," + ov[1].endTime === "5,10") );*/

    // Group 2: queryTime is defined
    
    /*// Subgroup 1: NO time definition, NO time extent
       var tDefn = null;
       var tExtent = null;
       console.log( (ov = _getTimeFilter({ startTime: 5, endTime: 15 })) && ov[0] === true && (ov[1].startTime + "," + ov[1].endTime === "5,15") );
    
    // Subgroup 2: time definition + time extent
    
    //   Subgroup 1: overlap
         var tDefn = { startTime: 13, endTime: 20 };
         var tExtent = { startTime: 11, endTime: 17 };
         console.log( (ov = _getTimeFilter({ startTime: 5, endTime: 15 })) && ov[0] === true && (ov[1].startTime + "," + ov[1].endTime === "13,15") );
         console.log( (ov = _getTimeFilter({ startTime: 5, endTime: 12 })) && ov[0] === false );
         console.log( (ov = _getTimeFilter({ startTime: 18, endTime: 20 })) && ov[0] === false );
         console.log( (ov = _getTimeFilter({ startTime: 5, endTime: 10 })) && ov[0] === false );
    
    //   Subgroup 2: NO overlap
         var tDefn = { startTime: 20, endTime: 30 };
         var tExtent = { startTime: 35, endTime: 45 };
         console.log( (ov = _getTimeFilter({ startTime: 5, endTime: 15 })) && ov[0] === false );
         console.log( (ov = _getTimeFilter({ startTime: 15, endTime: 25 })) && ov[0] === false );
         console.log( (ov = _getTimeFilter({ startTime: 35, endTime: 40 })) && ov[0] === false );
    
    // Subgroup 3: time definition + NO time extent
       var tDefn = { startTime: 10, endTime: 20 };
       var tExtent = null;
       console.log( (ov = _getTimeFilter({ startTime: 5, endTime: 15 })) && ov[0] === true && (ov[1].startTime + "," + ov[1].endTime === "10,15") );
       console.log( (ov = _getTimeFilter({ startTime: 1, endTime: 5 })) && ov[0] === false );
    
    // Subgroup 4: NO time definition + time extent
       var tDefn = null;
       var tExtent = { startTime: 10, endTime: 20 };
       console.log( (ov = _getTimeFilter({ startTime: 5, endTime: 15 })) && ov[0] === true && (ov[1].startTime + "," + ov[1].endTime === "10,15") );
       console.log( (ov = _getTimeFilter({ startTime: 1, endTime: 5 })) && ov[0] === false );*/
    

    // Updated Test Cases: "map time extent is never used"
    
    /*// Group 1: NO queryTime
    var tDefn = null;
    console.log( (ov = _getTimeFilter(null)) && ov[0] === true && !ov[1] );

    var tDefn = new esri.TimeExtent();
    tDefn.startTime = new Date(10);
    tDefn.endTime = new Date(20);
    console.log( (ov = _getTimeFilter(null)) && ov[0] === true && (ov[1].startTime.getTime() + "," + ov[1].endTime.getTime() === "10,20") );
    
    // Group 2: queryTime is defined
    var tDefn = null;
    var qTime = new esri.TimeExtent();
    qTime.startTime = new Date(5);
    qTime.endTime = new Date(15);
    console.log( (ov = _getTimeFilter(qTime)) && ov[0] === true && (ov[1].startTime.getTime() + "," + ov[1].endTime.getTime() === "5,15") );

    var tDefn = new esri.TimeExtent();
    tDefn.startTime = new Date(10);
    tDefn.endTime = new Date(20);
    
    var qTime = new esri.TimeExtent();
    qTime.startTime = new Date(1);
    qTime.endTime = new Date(5);
    console.log( (ov = _getTimeFilter(qTime)) && ov[0] === false );
    
    var qTime = new esri.TimeExtent();
    qTime.startTime = new Date(25);
    qTime.endTime = new Date(30);
    console.log( (ov = _getTimeFilter(qTime)) && ov[0] === false );

    var qTime = new esri.TimeExtent();
    qTime.startTime = new Date(5);
    qTime.endTime = new Date(15);
    console.log( (ov = _getTimeFilter(qTime)) && ov[0] === true && (ov[1].startTime.getTime() + "," + ov[1].endTime.getTime() === "10,15") );

    var qTime = new esri.TimeExtent();
    qTime.startTime = new Date(15);
    qTime.endTime = new Date(23);
    console.log( (ov = _getTimeFilter(qTime)) && ov[0] === true && (ov[1].startTime.getTime() + "," + ov[1].endTime.getTime() === "15,20") );*/
    
    
    var timeDefn = this.getTimeDefinition(), mapTime = null /*this._getOffsettedTE(this._mapTimeExtent)*/, overlap;
    if (timeDefn || mapTime) {
      overlap = this._getTimeOverlap(timeDefn, mapTime);
      if (!overlap) {
        return [ false ]; // abort selection
      }
    }
    
    if (queryTime) {
      queryTime = overlap ? this._getTimeOverlap(queryTime, overlap) : queryTime;
      if (!queryTime) {
        return [ false ]; // abort selection
      }
    }
    else {
      queryTime = overlap;
    }
    
    return [ true, queryTime ];
  },
  
  _getAttributeFilter: function(queryWhere) {
    // The effective where clause is an AND 
    // between query where and layer definition
    
    // TODO
    // Add test cases
    
    var defExpr = this.getDefinitionExpression();
    if (queryWhere) {
      //queryWhere = defExpr ? queryWhere + " AND " + defExpr : queryWhere;
      queryWhere = defExpr ? "(" + defExpr + ") AND (" + queryWhere + ")" : queryWhere;
    }
    else {
      queryWhere = defExpr;
    }
    return queryWhere;
  },
  
  _applyQueryFilters: function(query) {
    // definition expression
    query.where = this._getAttributeFilter(query.where);
    query.maxAllowableOffset = this._maxOffset;
    
    // time
    if (this.timeInfo) {
      var result = this._getTimeFilter(query.timeExtent);
      if (!result[0]) {
        return false; // abort
      }
      else {
        query.timeExtent = result[1];
        //console.log("Time Filter ", "query.timeExtent: ", query.timeExtent.startTime, ", ", query.timeExtent.endTime);
      }
    }
    
    return true;
  },
  
  /*_registerNew: function(feature) {
    this._unRegisterNew(feature);
    this._newFeatures.push(feature);
    feature._count = 1;
  },
  
  _unRegisterNew: function(feature) {
    var newFeatures = this._newFeatures;
    var index = dojo.indexOf(newFeatures, feature);
    if (index !== -1) {
      newFeatures.splice(index, 1);
      feature._count = 0;
    }
  },
  
  _isNew: function(feature) {
    var index = dojo.indexOf(this._newFeatures, feature);
    return index === -1 ? false : true;
  },*/
  
  /*_registerDelete: function(feature) {
    var attributes = feature.attributes, oidField = this.objectIdField, oid = attributes[oidField];
    this._deletedFeatures[oid] = feature;
  },
  
  _unRegisterDelete: function(feature) {
    var attributes = feature.attributes, oidField = this.objectIdField, oid = attributes[oidField];
    delete this._deletedFeatures[oid];
  },
  
  _isDeleted: function(feature) {
    var attributes = feature.attributes, oidField = this.objectIdField, oid = attributes[oidField];
    return this._deletedFeatures[oid] ? true : false;
  },*/
  
  _add: function(graphic) {
    var symbol = this._selectionSymbol, attr = graphic.attributes,
        visField = this.visibilityField;

    // set correct symbology for the graphic
    if (symbol && this._isSelOnly) {
      graphic.setSymbol(symbol);
    }
    
    // webmap spec
    if (visField && attr && attr.hasOwnProperty(visField)) {
      graphic[attr[visField] ? "show" : "hide"]();
    }
    
    // [Dojo 1.4.0] Calling an inherited method by name from a function 
    // that does not have the same name as the overridden method does not 
    // work at Dojo 1.4.0 (If the derived class had a method with the same 
    // name as the inherited method, then that would be called instead)
    
    //return this.inherited("add", arguments);
    return this.add.apply(this, arguments);
  },
  
  _remove: function() {
    //return this.inherited("remove", arguments);
    return this.remove.apply(this, arguments);
  },
  
  _canDoClientSideQuery: function(query) {
    // Return values:
    //  null/undefined --> cannot perform client-side query
    //  1 --> can do client side query for "extent"
    //  2 --> can do client side query for "object ids"
    //  3 --> can do client side query for "time"
    //console.log("_canDoClientSideQuery");
    var retVal = [], map = this._map;
    
    if (this._isTable || !map) {
      return;
    }
    
    // cannot do most attribute based queries on the client
    if ( query.text || (query.where && query.where !== this.getDefinitionExpression()) ) {
      return;
    }
    
    var isSnapshot = this._isSnapshot, selOnly = this._isSelOnly;
    
    // geometry
    var geometry = query.geometry;
    if (geometry) {
      if (!selOnly && 
          query.spatialRelationship === esri.tasks.Query.SPATIAL_REL_INTERSECTS && 
          (geometry.type === "extent" && (isSnapshot || map.extent.contains(geometry)))
      ) {
        // can do extent based intersection query, if it is within the current map extent
        retVal.push(1);
      }
      else {
        return;
      }
    }

    // object ids
    var ids = query.objectIds;
    if (ids) {
      if (isSnapshot) {
        retVal.push(2);
      }
      else {
        var len = ids.length, mode = this._mode, matchCount = 0, i;
        for (i = 0; i < len; i++) {
          if (mode._getFeature(ids[i])) {
            matchCount++;
          }
        }
        
        if (matchCount === len) {
          // can do client-side if "all" object ids in the request are
          // currently available locally
          retVal.push(2);
        }
        else {
          return;
        }
      } // if snapshot
    }
    
    // time
    if (this.timeInfo) {
      var queryTime = query.timeExtent, mapTime = this._mapTimeExtent;
      
      if (isSnapshot) {
        if (queryTime) {
          retVal.push(3);
        }
      }
      else if (selOnly) {
        if (queryTime) {
          return;
        }
      }
      else { // on-demand
        if (mapTime) {
          if (dojo.indexOf(retVal, 2) !== -1) {
            if (queryTime) {
              retVal.push(3);
            }
          }
          else {
            // Does not matter if query has time or not - 
            // we need to go to the server
            return;
          }
        }
        else {
          if (retVal.length > 0) {
            if (queryTime) {
              retVal.push(3);
            }
          }
          else {
            if (queryTime) {
              return;
            }
          }
        } // mapTime
      } // on-demand
    }
    
//    // time
//    if (query.timeExtent) {
//      if (isSnapshot) {
//        retVal.push(3);
//      }
//      else {
//        if (selOnly) {
//          return;
//        }
//        else { // on-demand mode
//          if (retVal.length > 0) {
//            retVal.push(3);
//          }
//        } // if selOnly
//      } // if isSnapshot
//    }
    
    return retVal.length > 0 ? retVal : null;
  },

  _doQuery: function(query, queryTypes, returnIdsOnly) {
    //console.log("_doQuery");
    var matched = [], mode = this._mode, oidField = this.objectIdField, i,
        len, features;

    if (dojo.indexOf(queryTypes, 2) !== -1) { // object ids
      matched = [];
      var ids = query.objectIds;
      len = ids.length;
      for (i = 0; i < len; i++) {
        var obj = mode._getFeature(ids[i]);
        if (obj) {
          matched.push(obj);
        }
      }
      
      if (matched.length === 0) {
        return [];
      }
    }

    if (dojo.indexOf(queryTypes, 1) !== -1) { // query extent
      features = matched.length > 0 ? matched : this.graphics; 
      len = features.length; 
      
      var extent = query.geometry._normalize(null, true); // can be an extent or an array of extents
      
      matched = [];
      
      for (i = 0; i < len; i++) {
        var feature = features[i], geometry = feature.geometry;
        
        if (geometry) {
          if (this.normalization && extent.length) {
            // there will be two extents in the array (see Extent::_normalize to understand why)
            if (extent[0].intersects(geometry) || extent[1].intersects(geometry)) {
              matched.push(feature);
            }
          }
          else {
            if (extent.intersects(geometry)) {
              matched.push(feature);
            }
          }
        }
      }
      
      if (matched.length === 0) {
        return [];
      }
    }

    if (dojo.indexOf(queryTypes, 3) !== -1) { // time
      if (this.timeInfo) {
        // layer is time-aware
        features = matched.length > 0 ? matched : this.graphics;
        var time = query.timeExtent, result = this._filterByTime(features, time.startTime, time.endTime);
        matched = result.match;
      }
    }

    if (returnIdsOnly) {
      return dojo.map(matched, function(obj) {
        return obj.attributes[oidField];
      }, this);
    }
    else {
      return matched;
    }
  },
  
  _filterByTime: function(graphics, startTime, endTime) {
    var startTimeField = this._startTimeField, endTimeField = this._endTimeField, timeField;
    if (!this._twoTimeFields) {
      timeField = startTimeField || endTimeField;
    }
    
    var isDef = esri._isDefined, yea = [], nay = [], i, len = graphics.length, graphic, attributes;
    startTime = startTime ? startTime.getTime() : -Infinity;
    endTime = endTime ? endTime.getTime() : Infinity;
    
    /*if (startTime && endTime) { // time extent?
      startTime = startTime.getTime();
      endTime = endTime.getTime();*/

      if (timeField) { // there is only one time field
        for (i = 0; i < len; i++) {
          graphic = graphics[i];
          attributes = graphic.attributes;
          
          var time = attributes[timeField];
          
          if ( time >= startTime && time <= endTime ) {
            yea.push(graphic); //graphic.show();
          }
          else {
            nay.push(graphic); //graphic.hide();
          }
        } // loop
      }
      else { // we have start and end time fields
        for (i = 0; i < len; i++) {
          graphic = graphics[i];
          attributes = graphic.attributes;
          
          var start = attributes[startTimeField], end = attributes[endTimeField];
          start = isDef(start) ? start : -Infinity;
          end = isDef(end) ? end : Infinity;
          
          // Should it be INTERSECTS or CONTAINS? Looks like it should be
          // INTERSECTS
          if ( (start >= startTime && start <= endTime) || // feature-start within filter's timespan
               (end >= startTime && end <= endTime) || //  feature-end within filter's timespan
               (startTime >= start && endTime <= end) // filter's timespan completely within feature's timespan
             ) {
            yea.push(graphic); //graphic.show();
          }
          else {
            nay.push(graphic); //graphic.hide();
          }
        }
      } // timeField
      
    /*}
    else if (startTime || endTime) { // time instant?
      startTime = (startTime || endTime).getTime();

      if (timeField) { // there is only one time field
        for (var i = 0, len = graphics.length; i < len; i++) {
          var graphic = graphics[i], attributes = graphic.attributes;
          var time = attributes[timeField];
          
          if (time === startTime) {
            yea.push(graphic); //graphic.show();
          }
          else {
            nay.push(graphic); //graphic.hide();
          }
        } // loop
      }
      else { // we have start and end time fields
        for (var i = 0, len = graphics.length; i < len; i++) {
          var graphic = graphics[i], attributes = graphic.attributes;
          var start = attributes[startTimeField], end = attributes[endTimeField];
          start = isNotDefined(start) ? -Infinity : start;
          end = isNotDefined(end) ? Infinity : end;
          
          if (startTime >= start && startTime <= end) {
            yea.push(graphic); //graphic.show();
          }
          else {
            nay.push(graphic); //graphic.hide();
          }
        }
      } // timeField

    }*/
    return { match: yea, noMatch: nay };
  },
  
  /*_getDeferred: function(response, error) {
    var df = new dojo.Deferred();
    
    if (error) {
      df.errback(error);
    }
    else {
      //df.callback(response);
      if (dojo.isArray(response) && response.length > 1) {
        df = esri._fixDfd(df);
      }
      esri._resDfd(df, response);
    }
    
    return df;
  },*/
  
  _resolve: function(args, eventName, callback, dfd, isError) {
    // Fire Event
    if (eventName) {
      this[eventName].apply(this, args);
    }
    
    // Invoke Callback
    if (callback) {
      callback.apply(null, args);
    }
    
    // Resolve Deferred
    if (dfd) {
      esri._resDfd(dfd, args, isError);
    }
  },
  
  _getShallowClone: function(query) {
    // clone (shallow) query object
    var query2 = new esri.tasks.Query(), prop;
    for (prop in query) {
      if (query.hasOwnProperty(prop)) {
        query2[prop] = query[prop];
      }
    }
    return query2;
  },
  
  _query: function(type, eventName, query, callback, errback) {
    var that = this, 
        dfd = new dojo.Deferred(esri._dfdCanceller);
    
    var cbFunc = function(response, noLookup) {
      if (!noLookup && type === "execute" && !that._isTable) {
        // if some features are already on the client,
        // we need to replace them with references that we
        // already have
        var features = response.features, mode = that._mode, oidField = that.objectIdField,
            il = features.length, i;
            
        for (i = il - 1; i >= 0; i--) {
          var oid = features[i].attributes[oidField];
          var localRef = mode._getFeature(oid);
          if (localRef) {
            features.splice(i, 1, localRef);
          }
        }
      }
      
      /*that[eventName](response);
      if (callback) {
        callback(response);
      }
      if (dfd) {
        esri._resDfd(dfd, [response]);
      }*/
      that._resolve([response], eventName, callback, dfd);
    };

    if (type !== "executeRelationshipQuery") {
      query = this._getShallowClone(query);
      query.outFields = this._getOutFields();
      query.returnGeometry = true;
      
      var map = this._map, output;
      if (map) {
        query.outSpatialReference = new esri.SpatialReference(map.spatialReference.toJson());
      }
      
      // apply query filters
      if (!this._applyQueryFilters(query)) {
        //var output = (type === "execute") ? new esri.tasks.FeatureSet({ features: [] }) : [];
        switch(type) {
          case "execute":
            output = new esri.tasks.FeatureSet({ features: [] });
            break;
          case "executeForIds":
            output = [];
            break;
          case "executeForCount":
            output = 0;
            break;
        }
        
        cbFunc(output, true);
        //return this._getDeferred([output]);
        return dfd;
      }
      
      // execute the query: client-side or server-side
      var queryTypes = this._canDoClientSideQuery(query);
      if (queryTypes) {
        var features = this._doQuery(query, queryTypes, (type === "executeForIds" || type === "executeForCount"));
        
        //var output = (type === "execute") ? { features: features } : features;
        /*var output = features;
        if (type === "execute") {
          output = new esri.tasks.FeatureSet();
          output.features = features;
        }*/
        
        switch(type) {
          case "execute":
            output = new esri.tasks.FeatureSet();
            output.features = features;
            break;
          case "executeForIds":
            output = features;
            break;
          case "executeForCount":
            output = features.length;
            break;
        }
        
        cbFunc(output, true);
        //return this._getDeferred([output]);
        return dfd;
      }
    }

    if (this._collection) {
      var err = new Error("FeatureLayer::_query - " + esri.bundle.layers.FeatureLayer.invalidParams);
      /*if (errback) {
        errback(err);
      }
      return this._getDeferred(null, err);*/
     
      this._resolve([err], null, errback, dfd, true);
      return dfd;
    }

    if (this._ts) {
      query._ts = (new Date()).getTime();
    }
    
    var temp = dfd._pendingDfd = this._task[type](query);
    temp.addCallbacks(
      cbFunc,
      function(err) {
        that._resolve([err], null, errback, dfd, true);
      }
    );
    
    return dfd;
  },
  
  _convertFeaturesToJson: function(features, dontStringify, isAdd, isUpdate) {
    var json = [], selSymbol = this._selectionSymbol,
        visField = this.visibilityField, i, nonEditableFields,
        oidField = this.objectIdField;
    
    // Identify non-editable fields so that we can avoid sending
    // them to the server
    if (this.loaded && (isAdd || isUpdate)) {
      nonEditableFields = dojo.filter(this.fields, function(field) {
        return (field.editable === false) && 
               (!isUpdate || (field.name !== oidField));
      });
    }
    
    for (i = 0; i < features.length; i++) {
      var feature = features[i], featureJson = {}, 
          geometry = feature.geometry, attr = feature.attributes,
          symbol = feature.symbol;
          
      if (geometry && (!isUpdate || !this.loaded || this.allowGeometryUpdates)) {
        featureJson.geometry = geometry.toJson();
      }
      
      // webmap spec
      // Write out visibilityField
      if (visField) {
        featureJson.attributes = attr = dojo.mixin({}, attr);
        attr[visField] = feature.visible ? 1 : 0;
      }
      else if (attr) {
        featureJson.attributes = dojo.mixin({}, attr);
        /*if (suppressField) {
          delete featureJson.attributes[suppressField];
        }*/
      }
      
      // Remove non-editable fields from the attributes
      if (featureJson.attributes && nonEditableFields && nonEditableFields.length) {
        dojo.forEach(nonEditableFields, function(field) {
          delete featureJson.attributes[field.name];
        });
      }
      
      if (symbol && (symbol !== selSymbol)) {
        featureJson.symbol = symbol.toJson();
      }
      
      json.push(featureJson);
    }
    
    return dontStringify ? json : dojo.toJson(json);
  },
  
  _selectHandler: function(response, selectionMethod, callback, errback, dfd) {
    //console.log(" select features: ", response);

    // To select or to not select these new features?
    var doSelect, ctor = this.constructor;
    switch(selectionMethod) {
      case ctor.SELECTION_NEW:
        this.clearSelection(true);
        doSelect = true;
        break;
      case ctor.SELECTION_ADD:
        doSelect = true;
        break;
      case ctor.SELECTION_SUBTRACT:
        doSelect = false;
        break;
    }
    
    // process the features
    var i, features = response.features, mode = this._mode, retVal = [], oidField = this.objectIdField,
        feature, oid;
    if (doSelect) {
      for (i = 0; i < features.length; i++) {
        feature = features[i];
        oid = feature.attributes[oidField];
        
        /*if (this._isNew(feature)) {
          retVal.push(feature);
          this._selectNewFeature(feature);
        }
        else if (!this._isDeleted(feature)) {*/
          var added = mode._addFeatureIIf(oid, feature);
          retVal.push(added);
          this._selectFeatureIIf(oid, added, mode);
        //}
      }
    }
    else {
      for (i = 0; i < features.length; i++) {
        feature = features[i];
        oid = feature.attributes[oidField];
        
        /*if (this._isNew(feature)) {
          retVal.push(feature);
          this._unSelectNewFeature(feature);
        }
        else {*/
          this._unSelectFeatureIIf(oid, mode);
          var removed = mode._removeFeatureIIf(oid);
          retVal.push(removed || feature);
        //}
      }
    }

    if (this._isSelOnly) {
      mode._applyTimeFilter(true);
    }
    
    /*this.onSelectionComplete(retVal, selectionMethod);
    if (callback) {
      callback(retVal, selectionMethod);
    }
    if (dfd) {
      esri._resDfd(dfd, [retVal, selectionMethod]);
    }*/

    this._resolve(
      [retVal, selectionMethod, response.exceededTransferLimit ? { queryLimitExceeded: true } : null], 
      "onSelectionComplete", callback, dfd
    );
    
    if (response.exceededTransferLimit) {
      this.onQueryLimitExceeded();
    }
  },
  
  _selectFeatureIIf: function(oid, feature, mode) {
    var selected = this._selectedFeatures, found = selected[oid]; //, symbol = this._selectionSymbol, isSelOnly = this._isSelOnly;
    if (!found) {
      mode._incRefCount(oid);
      selected[oid] = feature;
      if (!this._isTable) {
        this._setSelectSymbol(feature);
      }
    }
    return found || feature;
  },

  _unSelectFeatureIIf: function(oid, mode) {
    var found = this._selectedFeatures[oid];
    if (found) {
      mode._decRefCount(oid);
      delete this._selectedFeatures[oid];
      if (!this._isTable) {
        this._setUnSelectSymbol(found);
      }
    }
    return found;
  },
  
  /*_selectNewFeature: function(feature) {
    var selected = this._selectedFeaturesArr;
    var index = dojo.indexOf(selected, feature);
    if (index === -1) {
      selected.push(feature);
      feature._count++;
      this._setSelectSymbol(feature);
    }
    return feature;
  },
  
  _unSelectNewFeature: function(feature) {
    var selected = this._selectedFeaturesArr;
    var index = dojo.indexOf(selected, feature), found;
    if (index !== -1) {
      found = selected[index];
      found._count = 1;
      this._setUnSelectSymbol(found);
      selected.splice(index, 1);
    }
    return found;
  },*/
  
  _isSelected: function(feature) {
    // TODO
  },
  
  _setSelectSymbol: function(feature) {
    var symbol = this._selectionSymbol;
    if (symbol && !this._isSelOnly) {
      // TODO 
      // How should we handle if feature
      // has its own symbol?
      feature.setSymbol(symbol);
    }
  },
  
  _setUnSelectSymbol: function(feature) {
    var symbol = this._selectionSymbol;
    if (symbol && !this._isSelOnly) {
      //feature.setSymbol(this.renderer.getSymbol(feature));
      if (symbol === feature.symbol) {
        feature.setSymbol(null, true);
      }
    }
  },
  
  /*_getSymbol: function(feature) {
    if (this.isEditable()) { // layer in a feature service 
      return this._getSymbolByType(feature.attributes[this.typeIdField]) || this.defaultSymbol;
    }
    else { // layer in a map service
      return null;
    }
  },
  
  _getSymbolByType: function(typeId) {
    if (typeId === undefined || typeId === null) {
      return null;
    }
    
    var types = this.types;
    for (var i = 0; i < types.length; i++) {
      var type = types[i];
      if (type.id == typeId) {
        return type.symbol;
      }
    }
    return null;
  },*/
  
  _getOutFields: function() {
    // Test Cases:
    /*console.log(featureLayer._getOutFields.call({
      objectIdField: "oid",
      typeIdField: "tid",
      _startTimeField: "stid",
      _endTimeField: "endid",
      _trackIdField: "tkid",
      
      _rendererFields: [ "rndid", "rndid2" ],
      _outFields: null
    }).join(",") === "oid,tid,stid,endid,tkid,rndid,rndid2");
    
    console.log(featureLayer._getOutFields.call({
      objectIdField: "oid",
      typeIdField: "tid",
      _startTimeField: "stid",
      _endTimeField: "endid",
      _trackIdField: "tkid",
      
      _rendererFields: [ "rndid" ],
      _outFields: [ "*" ]
    }).join(",") === "*");
    
    console.log(featureLayer._getOutFields.call({
      objectIdField: "oid",
      typeIdField: "tid",
      _startTimeField: "stid",
      _endTimeField: "endid",
      _trackIdField: "tkid",
      
      _rendererFields: [ "rndid" ],
      _outFields: ["f1", "f2"]
    }).join(",") === "f1,f2,oid,tid,stid,endid,tkid,rndid");
    
    console.log(featureLayer._getOutFields.call({
      objectIdField: "oid",
      typeIdField: "tid",
      _startTimeField: "stid",
      _endTimeField: "endid",
      _trackIdField: "tkid",
      
      _rendererFields: [ "rndid" ],
      _outFields: ["oid", "tkid", "f1", "f2"]
    }).join(",") === "oid,tkid,f1,f2,tid,stid,endid,rndid");
    
    console.log(featureLayer._getOutFields.call({
      objectIdField: "oid",
      typeIdField: null,
      _startTimeField: "stid",
      _endTimeField: null,
      _trackIdField: null,
      
      _rendererFields: [ "rndid" ],
      _outFields: null
    }).join(",") === "oid,stid,rndid");
    
    console.log(featureLayer._getOutFields.call({
      objectIdField: null,
      typeIdField: null,
      _startTimeField: null,
      _endTimeField: null,
      _trackIdField: null,
      
      _rendererFields: null,
      _outFields: null
    }).join(",") === "");
    
    console.log(featureLayer._getOutFields.call({
      objectIdField: "OBJECTID",
      typeIdField: "",
      _startTimeField: null,
      _endTimeField: null,
      _trackIdField: "",
      
      _rendererFields: [ "rndid", null, "" ],
      _outFields: null
    }).join(",") === "OBJECTID,rndid");
    
    console.log(featureLayer._getOutFields.call({
      objectIdField: "oid",
      typeIdField: "stid",
      _startTimeField: null,
      _endTimeField: null,
      _trackIdField: "oid",
      
      _rendererFields: [ "stid" ],
      _outFields: null
    }).join(",") === "oid,stid");
    */
    
    var requiredFields = dojo.filter([
      this.objectIdField,
      this.typeIdField,
      this.creatorField,
      this._startTimeField,
      this._endTimeField,
      this._trackIdField
    ].concat(this._rendererFields), function(field, index, arr) {
      return !!field && (dojo.indexOf(arr, field) === index);
    });
    
    var outFields = dojo.clone(this._outFields);
    if (outFields) {
      if (dojo.indexOf(outFields, "*") !== -1) {
        return outFields;
      }
      
      dojo.forEach(requiredFields, function(field) {
        if (dojo.indexOf(outFields, field) === -1) {
          outFields.push(field);
        }
      });
      return outFields;
    }
    else {
      return requiredFields;
    }
  },
  
  _checkFields: function(inFields) {
    var requiredFields = inFields || this._getOutFields();
    
    dojo.forEach(requiredFields, function(reqField) {
      if (reqField === "*" /*|| reqField === "__object__id__"*/) {
        return;
      }
      
//      var found = dojo.some(this.fields, function(fieldInfo) {
//        return (fieldInfo && fieldInfo.name === reqField) ? true : false;
//      });
      
      if (!this._getField(reqField)) {
        console.debug("esri.layers.FeatureLayer: " + esri.substitute({ url: this.url, field: reqField }, esri.bundle.layers.FeatureLayer.fieldNotFound));
      }
    }, this);
    
    if (!inFields && !this._isTable && !this._fserver && !this._collection) {
      var found = dojo.some(this.fields, function(fieldInfo) {
        return (fieldInfo && fieldInfo.type === "esriFieldTypeGeometry") ? true : false;
      });
      
      if (!found) {
        console.debug("esri.layers.FeatureLayer: " + esri.substitute({ url: this.url }, esri.bundle.layers.FeatureLayer.noGeometryField));
      }
    }
  },
  
  _fixRendererFields: function() {
    var renderer = this.renderer;
    
    if (renderer && this.fields.length > 0) {
      var renderers = dojo.filter([
        renderer, renderer.observationRenderer, 
        renderer.latestObservationRenderer, renderer.trackRenderer
      ], esri._isDefined);
      
      var fields = [];
      dojo.forEach(renderers, function(rnd) {
        var fieldInfo, fieldName;
        
        fieldName = rnd.attributeField;
        if (fieldName) {
          fieldInfo = !this._getField(fieldName) && this._getField(fieldName, true);
          if (fieldInfo) {
            rnd.attributeField = fieldInfo.name;
          }
        }

        fieldName = rnd.attributeField2;
        if (fieldName) {
          fieldInfo = !this._getField(fieldName) && this._getField(fieldName, true);
          if (fieldInfo) {
            rnd.attributeField2 = fieldInfo.name;
          }
        }

        fieldName = rnd.attributeField3;
        if (fieldName) {
          fieldInfo = !this._getField(fieldName) && this._getField(fieldName, true);
          if (fieldInfo) {
            rnd.attributeField3 = fieldInfo.name;
          }
        }

        fields.push(rnd.attributeField);
        fields.push(rnd.attributeField2);
        fields.push(rnd.attributeField3);
      }, this); // for loop
      
      this._rendererFields = dojo.filter(fields, esri._isDefined);
      
    } // if renderer
  },
  
  _getField: function(fieldName, ignoreCase) {
    var fields = this.fields;
    if (fields.length === 0) {
      return null;
    }

    var retVal;
    
    if (ignoreCase) {
      fieldName = fieldName.toLowerCase();
    }
    
    dojo.some(fields, function(fieldInfo) {
      var found = false;
      if (ignoreCase) {
        found = (fieldInfo && fieldInfo.name.toLowerCase() === fieldName) ? true : false;
      }
      else {
        found = (fieldInfo && fieldInfo.name === fieldName) ? true : false;
      }
      
      if (found) {
        retVal = fieldInfo;
      }
      
      return found;
    });
    
    return retVal;
  },
  
  _getDateOpts: function() {
    /*
     * Internally used by Graphic::getTitle and 
     * getContent methods
     */
    
    if (!this._dtOpts) {
      var props = dojo.map(
        dojo.filter(this.fields, function(fieldInfo) {
          return !!(fieldInfo && fieldInfo.type === "esriFieldTypeDate");
        }),
        function(fieldInfo) {
          return fieldInfo.name;
        }
      );
      
      // See esri.substitute for this object's spec
      this._dtOpts = { properties: props };
    }

    return this._dtOpts;
  },
  
  _applyNormalized: function(features, normalized) {
    // note: "features" are mutated with "normalized"
    
    if (features && normalized) {
      dojo.forEach(features, function(feature, index) {
        if (feature && normalized[index]) {
          feature.setGeometry(normalized[index]);
        }
      });
    }
  },
  
  _editHandler: function(response, adds, updatesMap, callback, errback, dfd) {
    var addResults = response.addResults, updateResults = response.updateResults, 
        deleteResults = response.deleteResults, i, result, oid, feature,
        attr, oidField = this.objectIdField,
        mode = this._mode, isTable = this._isTable/*, calculate,
        extent, newExtent, dataSR, fullExtent = this.fullExtent,
        extSR = fullExtent && fullExtent.spatialReference*/;
    
    // TODO
    // do not do display related stuff if the FL is not on the map

    var fieldsInfo = this.editFieldsInfo,
        outFields = this._getOutFields() || [],
        creatorField = fieldsInfo && fieldsInfo.creatorField,
        creationDateField = fieldsInfo && fieldsInfo.creationDateField,
        editorField = fieldsInfo && fieldsInfo.editorField,
        editDateField = fieldsInfo && fieldsInfo.editDateField,
        realm = fieldsInfo && fieldsInfo.realm;
    
    // Make sure the editor tracking fields are defined in the layer's outFields config
    // If they are not defined, we don't want to assign time and userId
    // for newly added and updated features
    if (dojo.indexOf(outFields, "*") === -1) {
      if (creatorField && dojo.indexOf(outFields, creatorField) === -1) {
        creatorField = null;
      }

      if (creationDateField && dojo.indexOf(outFields, creationDateField) === -1) {
        creationDateField = null;
      }

      if (editorField && dojo.indexOf(outFields, editorField) === -1) {
        editorField = null;
      }

      if (editDateField && dojo.indexOf(outFields, editDateField) === -1) {
        editDateField = null;
      }
    }

    // Calculate currentTime and userId if required
    var currentTime = (creationDateField || editDateField) ? 
                      (new Date()).getTime() : null,
        userId = (creatorField || editorField) ? 
                 this.getUserId() : undefined;
    
    if (userId && realm) {
      userId = userId + "@" + realm;
      
      // Note that realm will not be appended to anonymous users 
      // (i.e. <empty-string> values) either
    }
    
    if (addResults) {
      /*if (this._collection) {
        dataSR = dojo.getObject("0.geometry.spatialReference", false, adds);

        if ( !extSR || (dataSR && extSR._isEqual(dataSR)) ) {
          console.log("[ calculating extent 2... ]");
          calculate = true;
        }
      }*/
      
      for (i = 0; i < addResults.length; i++) {
        addResults[i] = new esri.layers.FeatureEditResult(addResults[i]);
        if (isTable) {
          continue;
        }
        
        result = addResults[i];
        if (result.success) {
          oid = result.objectId;
          feature = adds[i];
          
          var gl = feature._graphicsLayer;
          if (gl && gl !== this) {
            gl.remove(feature);
          }
          
          // attach the object id returned to the feature
          attr = feature.attributes || {};
          
          attr[oidField] = oid;
          
          if (creatorField) {
            attr[creatorField] = userId;
          }
          
          if (editorField) {
            attr[editorField] = userId;
          }
          
          if (creationDateField) {
            attr[creationDateField] = currentTime;
          }
          
          if (editDateField) {
            attr[editDateField] = currentTime;
          }
          
          feature.setAttributes(attr);
          
          if (mode._init) {
            mode.drawFeature(feature);
          }
          
          // extent calculation
          /*if (calculate) {
            extent = feature.geometry && feature.geometry.getExtent();
            
            if (extent) {
              newExtent = newExtent ? (newExtent.union(extent)) : extent;
            }
          }*/
          
        }
      } // for
      
      /*if (newExtent) {
        this.fullExtent = extSR ? (fullExtent.union(newExtent)) : newExtent;
      }*/
    }
    
    if (updateResults) {
      //var selected = this._selectedFeatures, selSymbol = this._selectionSymbol;
      for (i = 0; i < updateResults.length; i++) {
        updateResults[i] = new esri.layers.FeatureEditResult(updateResults[i]);
        if (isTable) {
          continue;
        }
        
        result = updateResults[i];
        if (result.success) {
          oid = result.objectId;
          feature = updatesMap[oid];
          
          // update geometry - technically we don't have to
          // update because "found" and "feature" should be
          // one and the same 
          var found = mode._getFeature(oid);
          if (found) {
            if (found.geometry !== feature.geometry) {
              found.setGeometry(esri.geometry.fromJson(feature.geometry.toJson()));
            }
            
            /*if (!(oid in selected) || !selSymbol) {
              // trigger repaint
              found.setSymbol(null);
            }*/
            this._repaint(found, oid);
          } // found
          
          feature = found || feature;

          attr = feature.attributes || {};
          
          if (editorField) {
            attr[editorField] = userId;
          }
          
          if (editDateField) {
            attr[editDateField] = currentTime;
          }

          feature.setAttributes(attr);
        }
      } // for
    }
    
    if (deleteResults) {
      var unselected = [];
      for (i = 0; i < deleteResults.length; i++) {
        deleteResults[i] = new esri.layers.FeatureEditResult(deleteResults[i]);
        if (isTable) {
          continue;
        }
        
        result = deleteResults[i];
        if (result.success) {
          oid = result.objectId;
          feature = mode._getFeature(oid);
          if (feature) {
            // unselect
            if (this._unSelectFeatureIIf(oid, mode)) {
              unselected.push(feature);
            }
            
            // force remove
            feature._count = 0;
            mode._removeFeatureIIf(oid);
          } // if feature
        }
      } // for
      
      /*if (this._collection && this.graphics.length === 0) {
        console.log("deleting fullExtent property");
        delete this.fullExtent;
      }*/
      
      if (unselected.length > 0) {
        this.onSelectionComplete(unselected, this.constructor.SELECTION_SUBTRACT);
      }
    }
    
    // disseminate the information
    /*this.onEditsComplete(addResults, updateResults, deleteResults);
    if (callback) {
      callback(addResults, updateResults, deleteResults);
    }*/
    this._resolve([addResults, updateResults, deleteResults], "onEditsComplete", callback, dfd);
  },
  
  _sendAttachment: function(type, objectId, formNode, callback, errback) {
    var operationName = (type === "add") ? "addAttachment" : "updateAttachment",
        url = this._url.path + "/" + objectId + "/" + operationName,
        self = this;

    /*formNode.enctype = "multipart/form-data";
    if (dojo.isIE < 9) {
      // in IE, dynamically setting the value of "enctype" attribute
      // does not seem to take effect
      formNode.encoding = "multipart/form-data";
    }
    formNode.method = "post";
    
    var elements = formNode.elements;
    
    // add "f" if not already in the form
    if ( !dojo.some(elements, function(el) { return el.name === "f"; }) ) {
      formNode.appendChild( dojo.create("input", { type: "hidden", name: "f", value: "json" }) );
    }
    
    // add "callback.html" if not already in the form
    if ( !dojo.some(elements, function(el) { return el.name === "callback.html"; }) ) {
      formNode.appendChild( dojo.create("input", { type: "hidden", name: "callback.html", value: "textarea" }) );
    }
    
    // add token
    var token = this._getToken();
    if (token && !dojo.some(elements, function(el) { return el.name === "token"; }) ) {
      formNode.appendChild( dojo.create("input", { type: "hidden", name: "token", value: token }) );
    }
    
    var dfd = new dojo.Deferred(esri._dfdCanceller),
        self = this,
        _errorFunc = function(error) {
          if (!(error instanceof Error)) {
            error = dojo.mixin(new Error(), error);
          }
          //if (errback) {
            //errback(error);
          //}
          self._resolve([error], null, errback, dfd, true);
        },
        proxy = (esri.config.defaults.io.alwaysUseProxy || !esri._hasSameOrigin(url, window.location.href)) ? 
                esri._getProxyUrl() : 
                null;
    
    dfd._pendingDfd = dojo.io.iframe.send({
      url: (proxy ? (proxy.path + "?") : "") + url + "?callback.html=textarea",
      form: formNode,
      handleAs: "json",
      
      load:  dojo.hitch(this, function(response, io) {
        var error = response.error;
        if (error) {
          _errorFunc(error);
          return;
        }
        
        var propertyName = (type === "add") ? "addAttachmentResult" : "updateAttachmentResult";
        var eventName = (type === "add") ? "onAddAttachmentComplete" : "onUpdateAttachmentComplete";
        
        var result = new esri.layers.FeatureEditResult(response[propertyName]);
        result.attachmentId = result.objectId;
        result.objectId = objectId;
        
        //this[eventName](result);
        //if (callback) {
          //callback(result);
        //}
        
        self._resolve([result], eventName, callback, dfd);
      }), // load handler
      
      error: _errorFunc
    });*/
    
    var dfd = esri.request({
      url: url,
      form: formNode,
      content: dojo.mixin(this._url.query, {f:"json", token: this._getToken() || undefined}),
      callbackParamName: "callback.html",
      handleAs: "json"
    })
    .addCallback(function(response) {
      var propertyName = (type === "add") ? "addAttachmentResult" : "updateAttachmentResult",
          eventName = (type === "add") ? "onAddAttachmentComplete" : "onUpdateAttachmentComplete",
          result = new esri.layers.FeatureEditResult(response[propertyName]);
          
      result.attachmentId = result.objectId;
      result.objectId = objectId;
      
      self._resolve([result], eventName, callback);
      return result;
    })
    .addErrback(function(error) {
      self._resolve([error], null, errback, null, true);
    });
    
    return dfd;
  },
  
  _repaint: function(feature, oid, force) {
    oid = esri._isDefined(oid) ? oid : feature.attributes[this.objectIdField];
    if (!(oid in this._selectedFeatures) || !this._selectionSymbol) {
      // repaint only when:
      // - the feature is not selected, or
      // - the feature is selected but the layer has no selection symbol
      feature.setSymbol(feature.symbol, force);
    }
  },
  
  /***************************
   * Tracking related methods
   ***************************/
  
  _getKind: function(feature) {
    var trackManager = this._trackManager;
    if (trackManager) {
      return trackManager.isLatestObservation(feature) ? 1 : 0;
    }
    return 0;
  }
  
});

// mixin enums for FeatureLayer
dojo.mixin(esri.layers.FeatureLayer, {
  MODE_SNAPSHOT: 0,
  MODE_ONDEMAND: 1,
  MODE_SELECTION: 2,
  SELECTION_NEW: 3,
  SELECTION_ADD: 4,
  SELECTION_SUBTRACT: 5,
  POPUP_NONE: "esriServerHTMLPopupTypeNone",
  POPUP_HTML_TEXT: "esriServerHTMLPopupTypeAsHTMLText",
  POPUP_URL: "esriServerHTMLPopupTypeAsURL"
});

esri._createWrappers("esri.layers.FeatureLayer");

/**************************
 * esri.layers.FeatureType
 **************************/

dojo.declare("esri.layers.FeatureType", null, {
  constructor: function(json) {
    if (json && dojo.isObject(json)) {
      this.id = json.id;
      this.name = json.name;

      var symbol = json.symbol;
      
      if (symbol) {
        this.symbol = esri.symbol.fromJson(symbol);
      }
      
      // domains
      var domains = json.domains, field, i;
      var domainObjs = this.domains = {};
      for (field in domains) {
        if (domains.hasOwnProperty(field)) {
          var domain = domains[field];
          switch(domain.type) {
            case "range":
              domainObjs[field] = new esri.layers.RangeDomain(domain);
              break;
            case "codedValue":
              domainObjs[field] = new esri.layers.CodedValueDomain(domain);
              break;
            case "inherited":
              domainObjs[field] = new esri.layers.InheritedDomain(domain);
              break;
          }
        } // if
      }
      
      // templates
      var templates = json.templates;
      if (templates) {
        var templateObjs = this.templates = [];
        for (i = 0; i < templates.length; i++) {
          templateObjs.push(new esri.layers.FeatureTemplate(templates[i]));
        }
      }
      
    } // json
  },
  
  toJson: function() {
    var json = {
      id: this.id,
      name: this.name,
      symbol: this.symbol && this.symbol.toJson()
    };
    
    var field, domains = this.domains, templates = this.templates, sanitize = esri._sanitize;
    if (domains) {
      var newCopy = json.domains = {};
      for (field in domains) {
        if (domains.hasOwnProperty(field)) {
          newCopy[field] = domains[field] && domains[field].toJson();
        }
      }
      sanitize(newCopy);
    }
    if (templates) {
      json.templates = dojo.map(templates, function(template) {
        return template.toJson();
      });
    }
    
    return sanitize(json);
  }
});

/******************************
 * esri.layers.FeatureTemplate
 ******************************/

dojo.declare("esri.layers.FeatureTemplate", null, {
  constructor: function(json) {
    if (json && dojo.isObject(json)) {
      this.name = json.name;
      this.description = json.description;
      this.drawingTool = json.drawingTool;
      
      // prototypical feature
      var prototype = json.prototype;
      this.prototype = new esri.Graphic(prototype.geometry, null, prototype.attributes);
    }
  },
  
  toJson: function() {
    return esri._sanitize({
      name: this.name,
      description: this.description,
      drawingTool: this.drawingTool,
      prototype: this.prototype && this.prototype.toJson() 
    });
  }
});

// mixin enums for FeatureTemplate
dojo.mixin(esri.layers.FeatureTemplate, {
  TOOL_AUTO_COMPLETE_POLYGON: "esriFeatureEditToolAutoCompletePolygon",
  TOOL_CIRCLE: "esriFeatureEditToolCircle", // mapped to TOOL_POLYGON
  TOOL_ELLIPSE: "esriFeatureEditToolEllipse", // mapped to TOOL_POLYGON
  TOOL_FREEHAND: "esriFeatureEditToolFreehand",
  TOOL_LINE: "esriFeatureEditToolLine",
  TOOL_NONE: "esriFeatureEditToolNone", // for non-spatial tables; cannot be set for spatial data in ArcMap
  TOOL_POINT: "esriFeatureEditToolPoint",
  TOOL_POLYGON: "esriFeatureEditToolPolygon",
  TOOL_RECTANGLE: "esriFeatureEditToolRectangle",
  TOOL_ARROW: "esriFeatureEditToolArrow",
  TOOL_TRIANGLE: "esriFeatureEditToolTriangle",
  TOOL_LEFT_ARROW: "esriFeatureEditToolLeftArrow",
  TOOL_RIGHT_ARROW: "esriFeatureEditToolRightArrow",
  TOOL_UP_ARROW: "esriFeatureEditToolUpArrow",
  TOOL_DOWN_ARROW: "esriFeatureEditToolDownArrow"
});

/********************************
 * esri.layers.FeatureEditResult
 ********************************/

dojo.declare("esri.layers.FeatureEditResult", null, {
  constructor: function(json) {
    if (json && dojo.isObject(json)) {
      this.objectId = json.objectId;
      this.success = json.success;
      if (!json.success) {
        var err = json.error;
        this.error = new Error();
        this.error.code = err.code;
        this.error.message = err.description;
      }
    }
  }
});

/**************************
 * esri.layers._RenderMode
 **************************/

dojo.declare("esri.layers._RenderMode", null, {
  constructor: function() {
    this._prefix = "jsonp_" + (dojo._scopeName || "dojo") + "IoScript";
  },
//  layerInfoHandler: function(layerInfo) {},
  initialize: function(map) {},
  propertyChangeHandler: function(type) {
    /*
     * type = 0 denotes map time extent changed
     * type = 1 denotes layer definition expression changed
     * type = 2 denotes layer time definition changed
     */
  },
  destroy: function() {},
  drawFeature: function(feature) {},
  suspend: function() {},
  resume: function() {},
  refresh: function() {},
  
  _incRefCount: function(oid) {
    var found = this._featureMap[oid];
    if (found) {
      found._count++;
    }
  },
  
  _decRefCount: function(oid) {
    var found = this._featureMap[oid];
    if (found) {
      found._count--;
    }
  },
  
  _getFeature: function(oid) {
    return this._featureMap[oid];
  },
  
  _addFeatureIIf: function(oid, feature) {
    var fmap = this._featureMap, found = fmap[oid], layer = this.featureLayer; //, template = layer._infoTemplate;
    if (!found) {
      fmap[oid] = feature;
      /*if (template) {
        feature.setInfoTemplate(template);
      }*/
      layer._add(feature);
      feature._count = 0;
    }
    return found || feature;
  },
  
  _removeFeatureIIf: function(oid) {
    var found = this._featureMap[oid], layer = this.featureLayer;
    if (found) {
      if (found._count) {
        return;
      }
      delete this._featureMap[oid];
      layer._remove(found); 
    }
    return found;
  },
  
  _clearIIf: function() {
    var i, layer = this.featureLayer, graphics = layer.graphics, 
        selected = layer._selectedFeatures, oidField = layer.objectIdField;
        
    for (i = graphics.length - 1; i >= 0; i--) {
      var feature = graphics[i];
      var oid = feature.attributes[oidField];
      if (oid in selected) {
        feature._count = 1;
        continue;
      }
      feature._count = 0;
      this._removeFeatureIIf(oid);
    }
  },
  
//  _fireUpdateStart: function() {
//    if (this._started) {
//      return;
//    }
//    this._started = true;
//    this.featureLayer.onUpdateStart();
//  },
//  
//  _fireUpdateEnd: function() {
//    this._started = false;
//    this.featureLayer.onUpdateEnd();
//  },
  
  _isPending: function(id) {
    var dfd = dojo.io.script[this._prefix + id]; // see dojo.io.script._makeScriptDeferred
    return dfd ? true : false;
  },
  
  // Methods to make ETags useful
  _cancelPendingRequest: function(dfd, id) {
    dfd = dfd || dojo.io.script[this._prefix + id]; // see dojo.io.script._makeScriptDeferred
    if (dfd) {
      try {
        dfd.cancel(); // call ends up at dojo.io.script._deferredCancel
        dojo.io.script._validCheck(dfd);
        //console.info(dfd.startTime, dfd.canceled, dfd);
      }
      catch(e) {}
    }
  },
  
  _purgeRequests: function() {
    // The first argument is not used in this method
    dojo.io.script._validCheck(null);
  },

  _toggleVisibility: function(/*Boolean*/ show) {
    var layer = this.featureLayer, graphics = layer.graphics, 
        methodName = show ? "show" : "hide", i, len = graphics.length;
    
    show = show && layer._ager; // show morphs here
    for (i = 0; i < len; i++) {
      var graphic = graphics[i];
      graphic[methodName]();
      if (show) {
        layer._repaint(graphic);
      }
    }
  },

  _applyTimeFilter: function(silent) {
    // Display only features that belong in the intersection of
    // snapshot time definition and map time extent
    
    var layer = this.featureLayer;
    if (!layer.timeInfo || layer._suspended) {
      // layer is not time aware
      return;
    }
    
    if (!silent) {
      layer._fireUpdateStart();
    }
    
    // clear all the track lines
    var trackManager = layer._trackManager;
    if (trackManager) {
      trackManager.clearTracks();
    }
     
    var defn = layer.getTimeDefinition(), timeExtent = layer._getOffsettedTE(layer._mapTimeExtent);
    if (timeExtent) {
      timeExtent = layer._getTimeOverlap(defn, timeExtent);
      if (timeExtent) { // there is overlap, do filter
        //console.log("Snapshot Client Filter ", "query.timeExtent: ", timeExtent.startTime, ", ", timeExtent.endTime);
        var result = layer._filterByTime(layer.graphics, timeExtent.startTime, timeExtent.endTime);
    
        if (trackManager) {
          trackManager.addFeatures(result.match);
        }
        dojo.forEach(result.match, function(graphic) {
          var shape = graphic._shape;
          if (!graphic.visible) {
            graphic.show();
            shape = graphic._shape;
            shape && shape._moveToFront();
          }
          if (layer._ager && shape) {
            layer._repaint(graphic);
          }
        });
        
        dojo.forEach(result.noMatch, function(graphic) {
          if (graphic.visible) {
            graphic.hide();
          }
        });
      }
      else { // there is no overlap, so hide everything
        this._toggleVisibility(false);
      }
    }
    else { // map time extent is set to null
      if (trackManager) {
        trackManager.addFeatures(layer.graphics);
      }
      this._toggleVisibility(true);
    }
    
    // draw track lines corresponding to the observations
    if (trackManager) {
      trackManager.moveLatestToFront();
      trackManager.drawTracks();
    }
    
    if (!silent) {
      layer._fireUpdateEnd();
    }
  }
});

/*****************************
 * esri.layers._SelectionMode
 *****************************/

dojo.declare("esri.layers._SelectionMode", [ esri.layers._RenderMode ], {
  
  /************
   * Overrides 
   ************/
  
  constructor: function(featureLayer) {
    //console.log("entering 'selection only' mode...");
    this.featureLayer = featureLayer;
    this._featureMap = {};
  },
  
//  layerInfoHandler: function(layerInfo) {
//    this.layerInfo = layerInfo;
//  },

  initialize: function(map) {
    this.map = map;
    this._init = true;
  },

  propertyChangeHandler: function(type) {
    if (this._init && type === 0) {
      // map time extent changed
      this._applyTimeFilter();
    }
  },

  destroy: function() {
    this._init = false;
  },
  
  resume: function() {
    this.propertyChangeHandler(0);
  }
});

/****************************
 * esri.layers._SnapshotMode
 ****************************/

dojo.declare("esri.layers._SnapshotMode", [ esri.layers._RenderMode ], {
  
  /************
   * Overrides 
   ************/
  
  constructor: function(featureLayer) {
    //console.log("entering 'snapshot' mode...");
    this.featureLayer = featureLayer;
    this._featureMap = {};
    this._drawFeatures = dojo.hitch(this, this._drawFeatures);
    this._queryErrorHandler = dojo.hitch(this, this._queryErrorHandler);
  },
  
//  layerInfoHandler: function(layerInfo) {
//    this.layerInfo = layerInfo;
//  },

  initialize: function(map) {
    this.map = map;
    var layer = this.featureLayer;
    if (layer._collection) {
      /*layer._fireUpdateStart();
      
      // create and assign unique ids for features 
      var featureSet = layer._featureSet;
      delete layer._featureSet;
      
      this._drawFeatures(new esri.tasks.FeatureSet(featureSet));
      layer._fcAdded = true;*/
     
      this._applyTimeFilter();
    }
    else {
      this._fetchAll();
    }
    this._init = true;
  },

  propertyChangeHandler: function(type) {
    if (this._init) {
      if (type) {
        this._fetchAll();
      }
      else { // map time extent changed
        this._applyTimeFilter();
      }
    }
  },

  destroy: function() {
    this._init = false;
  },
  
  drawFeature: function(feature) {
    var layer = this.featureLayer, oidField = layer.objectIdField, oid = feature.attributes[oidField];
    //if (!layer._isDeleted(feature)) {
      this._addFeatureIIf(oid, feature);
      this._incRefCount(oid);
    //}
  },
  
  resume: function() {
    this.propertyChangeHandler(0);
  },
  
  refresh: function() {
    var layer = this.featureLayer;
    
    if (layer._collection) {
      layer._fireUpdateStart();
      layer._refresh(true);
      layer._fireUpdateEnd();
    }
    else {
      this._fetchAll();
    }
  },
  
  /*******************
   * Internal Methods
   *******************/
  
  _getRequestId: function(layer) {
    var id = "_" + layer.name + layer.layerId + layer._ulid;
    return id.replace(/[^a-zA-Z0-9\_]+/g, "_"); // cannot have hyphens in callback function names
  },
  
  _fetchAll: function() {
    var layer = this.featureLayer;
    if (layer._collection) {
      return;
    }

    layer._fireUpdateStart();
    this._clearIIf();
    this._sendRequest();
  },
  
  _sendRequest: function() {
    //console.log("fetching...");
    var map = this.map, layer = this.featureLayer, defExpr = layer.getDefinitionExpression();
    
    var query = new esri.tasks.Query();
    query.outFields = layer._getOutFields();
    query.where = defExpr || "1=1";
    query.returnGeometry = true;
    query.outSpatialReference = new esri.SpatialReference(map.spatialReference.toJson());
    query.timeExtent = layer.getTimeDefinition();
    //query.timeExtent && console.log("Snapshot ", "query.timeExtent: ", query.timeExtent.startTime, ", ", query.timeExtent.endTime);
    query.maxAllowableOffset = layer._maxOffset;
    if (layer._ts) {
      query._ts = (new Date()).getTime();
    }

    var callbackSuffix;
    if (layer._usePatch) {
      // get an id for this request
      callbackSuffix = this._getRequestId(layer);

      // cancel the previous request of the same kind
      this._cancelPendingRequest(null, callbackSuffix);
    }
  
    layer._task.execute(query, this._drawFeatures, this._queryErrorHandler, callbackSuffix);
  },
    
  _drawFeatures: function(response) {
    //console.log("drawing");
    this._purgeRequests();

    var features = response.features, layer = this.featureLayer, 
        oidField = layer.objectIdField, i, len = features.length,
        feature, oid/*, newExtent, extent, calculate*/;
    
    /*if (layer._collection) {
      var extSR = layer.fullExtent && layer.fullExtent.spatialReference;
      
      if (!extSR) {
        console.log("[ calculating extent... ]");
        calculate = true;
      }
    }*/
    
    // add features to the map
    for (i = 0; i < len; i++) {
      feature = features[i];
      oid = feature.attributes[oidField];
      //if (!layer._isDeleted(feature)) {
        this._addFeatureIIf(oid, feature);
        this._incRefCount(oid);
      //}
      
      /*if (calculate) {
        extent = feature.geometry && feature.geometry.getExtent();
        
        if (extent) {
          newExtent = newExtent ? (newExtent.union(extent)) : extent;
        }
      }*/
    }
    
    /*if (newExtent) {
      layer.fullExtent = newExtent;
    }*/
    
    // process and apply map time extent
    this._applyTimeFilter(true);
    
    layer._fireUpdateEnd(null, response.exceededTransferLimit ? { queryLimitExceeded: true } : null);
    
    if (response.exceededTransferLimit) {
      layer.onQueryLimitExceeded();
    }
  },
  
  _queryErrorHandler: function(err) {
    //console.log("query error! ", err);
    
    this._purgeRequests();
    
    var layer = this.featureLayer;
    layer._errorHandler(err);
    layer._fireUpdateEnd(err);
  }
  
});

/****************************
 * esri.layers._OnDemandMode
 ****************************/

dojo.declare("esri.layers._OnDemandMode", [ esri.layers._RenderMode ], {
  
  /************
   * Overrides 
   ************/
  
  constructor: function(featureLayer) {
    //console.log("entering 'on-demand' mode...");
    this.featureLayer = featureLayer;
    this._featureMap = {};
    this._queryErrorHandler = dojo.hitch(this, this._queryErrorHandler);
  },
  
//  layerInfoHandler: function(layerInfo) {
//    this.layerInfo = layerInfo;
//  },
  
  initialize: function(map) {
    this.map = map;
    this._initialize();
    this._init = true;
  },
  
  propertyChangeHandler: function(type) {
    if (this._init) {
      if (type < 2) {
        this._zoomHandler();
      }
      // On-demand mode is not affected by time definition (type = 2)?
    }
  },
  
  destroy: function() {
    this._disableConnectors();
    this._init = false;
  },
  
  drawFeature: function(feature) {
    // find the cells touching the feature
    var gridLayer = this._gridLayer, geom = feature.geometry, cells = [];

    if (!geom) {
      return;
    }
    
    cells = gridLayer.getCellsInExtent(
      (geom.type === "point") ?
       { xmin: geom.x, ymin: geom.y, xmax: geom.x, ymax: geom.y } :
       geom.getExtent(),
       false
    ).cells;
    
    //console.log("cells = ", cells);
    
    // add and set ref-count based on the #cells this feature intersects
    var cellMap = this._cellMap, i, cell,
        oid = feature.attributes[this.featureLayer.objectIdField],
        cLatticeID, row, col;
    
    for (i = 0; i < cells.length; i++) {
      cell = cells[i];
      cLatticeID = cell.latticeID;
      row = cell.row;
      col = cell.col;
      
      if (cLatticeID) {
        cell = (cellMap[cLatticeID] = (cellMap[cLatticeID] || cell));
      }
      else {
        cellMap[row] = cellMap[row] || {};
        cell = (cellMap[row][col] = (cellMap[row][col] || cell));
      }
      
      cell.features = cell.features || [];
      cell.features.push(feature);
      
      this._addFeatureIIf(oid, feature);
      this._incRefCount(oid);
    }
  },
  
  suspend: function() {
    if (!this._init) {
      return;
    }
    this._disableConnectors();
  },
  
  resume: function() {
    if (!this._init) {
      return;
    }
    this._enableConnectors();
    this._zoomHandler();
  },
  
  refresh: function() {
    this._zoomHandler();
  },
  
  /*******************
   * Internal Methods
   *******************/
  
  _initialize: function() {
    var map = this.map, layer = this.featureLayer;
    
    // Set -180 as the grid layout origin
    // NOTE: _wrap and _srInfo are defined by _GraphicsLayer::_setMap
    var srInfo = /*layer._wrap &&*/ layer._srInfo;
    
    this._gridLayer = new esri.layers._GridLayout(
//      map.extent.getCenter(),
      new esri.geometry.Point(srInfo ? srInfo.valid[0] : map.extent.xmin, map.extent.ymax, map.spatialReference),
      { width: layer._tileWidth, height: layer._tileHeight }, 
      { width: map.width, height: map.height },
      srInfo
    );
  
    this._ioQueue = [];
    if (!layer._suspended) {
      this._zoomHandler();
      this._enableConnectors();
    }
  },
  
  _enableConnectors: function() {
    var map = this.map;
    this._zoomConnect = dojo.connect(map, "onZoomEnd", this, this._zoomHandler);
    this._panConnect = dojo.connect(map, "onPanEnd", this, this._panHandler);
    this._resizeConnect = dojo.connect(map, "onResize", this, this._panHandler);
  },
  
  _disableConnectors: function() {
    dojo.disconnect(this._zoomConnect);
    dojo.disconnect(this._panConnect);
    dojo.disconnect(this._resizeConnect);
  },
    
  _zoomHandler: function() {
    this._processIOQueue(true);
    var layer = this.featureLayer, map = this.map;
    
    // we need to do this check here because even though
    // this zoom handler is disconnected on suspend, the handler
    // is still called one last time. Reason: suspension also happens in one of 
    // the zoom end listeners and this handler is not removed (in practice) from the
    // list of listeners that dojo maintains as part of connect-disconnect
    // infrastructure (the zoom end callback sequence has already started)
    // Perhaps, we can remove this check when ondemand uses "onExtentChange"
    // instead of "onZoomEnd"
    if (layer._suspended) {
      return;
    }
    
    /*if (layer._autoGeneralize) {
      layer._maxOffset = Math.floor(map.extent.getWidth() / map.width);
    }*/

    layer._fireUpdateStart();
    this._clearIIf();
    var trackManager = layer._trackManager;
    if (trackManager) {
      trackManager.clearTracks();
    }

    this._cellMap = {};
    this._gridLayer.setResolution(map.extent);
    
    this._sendRequest();
  },
    
  _panHandler: function() {
    this.featureLayer._fireUpdateStart();
    this._sendRequest(this.featureLayer._resized && arguments[0]);
  },
  
  _getRequestId: function(layer, cell) {
    var id = "_" + layer.name + layer.layerId + layer._ulid + "_" + cell.resolution + "_" + 
             (cell.latticeID || (cell.row + "_" +  cell.col));
    
    return id.replace(/[^a-zA-Z0-9\_]+/g, "_"); // cannot have hyphens in callback function names
  },
  
  _sendRequest: function(resized) {
    //console.log("fetching...");
    this._exceeds = false;
    
    var layer = this.featureLayer, map = this.map, extent = resized || map.extent,
        gridInfo = this._gridLayer.getCellsInExtent(extent, layer.latticeTiling), 
        cells = gridInfo.cells;
    
    //console.log(gridInfo.minRow, gridInfo.maxRow, gridInfo.minCol, gridInfo.maxCol);
    
//    // debug
//    this._debugClear();
//    this._debugInfo(cells);

    if (!layer.isEditable()) {
      // filter out the cells that already have content (optimization for non-editable layers)
      var cellMap = this._cellMap;
      cells = dojo.filter(cells, function(cell) {
        // cell map lookup
        if (cell.lattice) {
          if (cellMap[cell.latticeID]) {
            return false;
          }
        }
        else if (cellMap[cell.row] && cellMap[cell.row][cell.col]) {
          return false;
        }
        return true;
      });
    }

    var fields = layer._getOutFields(),
        where = layer.getDefinitionExpression(),
        time = layer._getOffsettedTE(layer._mapTimeExtent),
        patch = layer._usePatch, ioQueue = this._ioQueue, i,
        self = this, func = this._drawFeatures, cell, query, callbackSuffix;
    //time && console.log("OnDemand ", "query.timeExtent: ", time.startTime, ", ", time.endTime);
    
    // send requests
    //this._pending = cells.length;
    this._pending = this._pending || 0;
    for (i = 0; i < cells.length; i++) {
      cell = cells[i];
      
      // query
      query = new esri.tasks.Query();
      query.geometry = cell.extent || cell.lattice;
      query.outFields = fields;
      query.where = where;
      if (layer.latticeTiling && cell.extent) {
        query.spatialRelationship = esri.tasks.Query.SPATIAL_REL_CONTAINS;
      }
      query.returnGeometry = true;
      query.timeExtent = time;
      query.maxAllowableOffset = layer._maxOffset;
      if (layer._ts) {
        query._ts = (new Date()).getTime();
      }
      
      callbackSuffix = null;
      if (patch) {
        // callback suffix
        callbackSuffix = this._getRequestId(layer, cell);
        
        // cancel the previous request for the given zoom level, row, col
        //this._cancelPendingRequest(callbackSuffix);
        
        if (this._isPending(callbackSuffix)) {
          continue;
        }
      }
    
      // execute
      //console.log("requesting for cell: ", cell.row, cell.col);
      this._pending++;
      ioQueue.push(layer._task.execute(query, function() {
        var cellInfo = cell;
        return function(response) { // callback
          func.apply(self, [ response, cellInfo ]);
        };
      }.call(this), this._queryErrorHandler, callbackSuffix));
    } // loop
    
    //console.log("pending = ", this._pending, ioQueue);
    this._removeOldCells(extent);
    this._endCheck();
  },
    
  _drawFeatures: function(response, cell) {
    //console.log("drawing " + cell.row + ", " + cell.col + "," + cell.resolution);
    this._exceeds = this._exceeds || response.exceededTransferLimit;
    this._finalizeIO();
    
    var layer = this.featureLayer, map = this.map, mExtent = map.extent, 
        cExtent = cell.extent, row = cell.row, col = cell.col, 
        oidField = layer.objectIdField,
        features = response.features, gridLayer = this._gridLayer,
        // lookup cell map
        cellMap = this._cellMap, i, len,
        cLatticeID = cell.latticeID,
        found = cLatticeID ? cellMap[cLatticeID] : (cellMap[row] && cellMap[row][col]);
    
    // don't add the cell if it does not intersect the current map extent or does not belong to this level
    if ( 
      (cell.resolution != gridLayer._resolution) || 
      ( 
        cLatticeID ? 
        (cLatticeID !== gridLayer.getLatticeID(mExtent)) : 
        (!gridLayer.intersects(cExtent, mExtent)) 
      )
    ) {
      if (found) {
        this._removeCell(row, col, cLatticeID);
      }
    }
    // already displayed, update it
    else if (found) {
      // update existing cell with new features
      this._updateCell(found, features);
    }
    else {
      // record
      cell.features = features;
      
      if (cLatticeID) {
        cellMap[cLatticeID] = cell;
      }
      else {
        cellMap[row] = cellMap[row] || {};
        cellMap[row][col] = cell;
      }
      
      len = features.length;
      
      // add features to the map
      for (i = 0; i < len; i++) {
        var feature = features[i];
        var oid = feature.attributes[oidField];
        
        //if (!layer._isDeleted(feature)) {
          this._addFeatureIIf(oid, feature);
          this._incRefCount(oid);
        //}
        //console.log(" [count] ", feature.attributes["STATE_NAME"], fmap[oid]._count);
      } // loop
    }
    
    // Be careful when adding code here! Consider branching above.

    // finalize the request    
    this._endCheck();
  },
  
  _queryErrorHandler: function(err) {
    //console.log("query error! ", err);
    
    this._finalizeIO();
    this.featureLayer._errorHandler(err);
    this._endCheck(true);
  },
  
  _finalizeIO: function() {
    this._purgeRequests();
    this._pending--;
  },
  
  _endCheck: function(isError) {
    if (this._pending === 0) {
      this._processIOQueue();
      
      // tracking functionality
      var layer = this.featureLayer, trackManager = layer._trackManager;
      if (trackManager) {
        trackManager.clearTracks();
        trackManager.addFeatures(layer.graphics);
        if (layer._ager) {
          dojo.forEach(layer.graphics, function(graphic) {
            if (graphic._shape) {
              layer._repaint(graphic);
            }
          });
        }
        trackManager.moveLatestToFront();
        trackManager.drawTracks();
      }
      
      this.featureLayer._fireUpdateEnd(
        isError && new Error("FeatureLayer: " + esri.bundle.layers.FeatureLayer.updateError),
        this._exceeds ? { queryLimitExceeded: true } : null
      );
      
      if (this._exceeds) {
        layer.onQueryLimitExceeded();
      }
    }
  },
  
  _processIOQueue: function(cancel) {
    this._ioQueue = dojo.filter(this._ioQueue, function(dfd) {
      var keep = dfd.fired > -1 ? /*success or error*/ false : /*initial condition*/ true;
      return keep;
    });
    
    if (cancel) {
      dojo.forEach(this._ioQueue, this._cancelPendingRequest);
    }
  },
  
  _removeOldCells: function(extent) {
    var cellMap = this._cellMap, gridLayer = this._gridLayer, rowNum, colNum;
    
    for (rowNum in cellMap) {
      if (cellMap[rowNum]) { // can be a rowNum or latticeID
        var row = cellMap[rowNum],
            cLatticeID = row.latticeID,
            count = 0, removed = 0;
        
        if (cLatticeID) { // lattice entry
          count++;
          if (cLatticeID !== gridLayer.getLatticeID(extent)) {
            this._removeCell(null, null, cLatticeID);
            removed++;
          }
        }
        else { // regular row/col entry
          for (colNum in row) {
            if (row[colNum]) {
              count++;
              var cExtent = row[colNum].extent;
              //if (!cExtent.intersects(extent)) { // remove the cell if it does not intersect the given extent
              if (!gridLayer.intersects(cExtent, extent)) {
                //console.log("[removing old cell] ", rowNum, colNum);
                this._removeCell(rowNum, colNum);
                removed++;
              } // does not intersect
            }
          } // cols
        }
        
        if (removed === count) { // empty row
          delete cellMap[rowNum];
        }
      }
    } // rows
  },
  
  _updateCell: function(cell, latestFeatures) {
    //console.log("_updateCell");
    var layer = this.featureLayer, oidField = layer.objectIdField, selected = layer._selectedFeatures,
        i, len = latestFeatures.length;
    
    cell.features = cell.features || [];
    
    for (i = 0; i < len; i++) {
      var feature = latestFeatures[i];
      var oid = feature.attributes[oidField];
      
      var found = this._addFeatureIIf(oid, feature);
      if (found === feature) { // this feature is a new member of the cell
        this._incRefCount(oid);
        cell.features.push(found);
      }
      else { // update the existing feature (geometry and attributes) if not selected
        if (!(oid in selected)) {
          found.setGeometry(feature.geometry);
          found.setAttributes(feature.attributes);
        }
      }
    } // for loop
  },
    
  _removeCell: function(row, col, cLatticeID) {
    var cellMap = this._cellMap, layer = this.featureLayer, oidField = layer.objectIdField;
    var cell = cLatticeID ? cellMap[cLatticeID] : (cellMap[row] && cellMap[row][col]);

    if (cell) {
      // delete cell map 
      if (cLatticeID) {
        delete cellMap[cLatticeID];
      }
      else {
        delete cellMap[row][col];
      }

      // remove cell's features
      var features = cell.features, i;
      for (i = 0; i < features.length; i++) {
        var feature = features[i];
        var oid = feature.attributes[oidField];
        //console.log("- attempting ", oid, feature.attributes["STATE_NAME"], row, col);
        this._decRefCount(oid);
        if (oid in layer._selectedFeatures) { // this may not be needed after all because we are ref-counting the selection.
          continue; // do not remove if this feature is currently selected. DON'T BREAK THE CONTRACT
        }
        this._removeFeatureIIf(oid);
        //console.log("--- removing ", oid, feature.attributes["STATE_NAME"], row, col);
      }
    } // if
  }//,
    
  /*************************
   * For debugging purposes
   *************************/
  
  /*_debugClear: function() {
    var gs = this._cellExtentGraphics, i;
    if (gs) {
      for (i = 0; i < gs.length; i++) {
        this.map.graphics.remove(gs[i]);
      }
      this._cellExtentGraphics = null;
    }
  },
  
  _debugInfo: function(cells) {
    // draw the cell extents
    var outline = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0, 0, 0, 1]), 1),
        i, symbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, outline, new dojo.Color([0, 0, 0, 0.25]));
    
    this._cellExtentGraphics = [];
    for (i = 0; i < cells.length; i++) {
      var polygon = this._extentToPolygon(this._gridLayer.getCellExtent(cells[i].row, cells[i].col));
      var graphic = new esri.Graphic(polygon, symbol);
      this.map.graphics.add(graphic);
      this._cellExtentGraphics.push(graphic);
    }
  },

  _extentToPolygon: function(extent) {
    //console.log("_extentToPolygon");
    var xmin = extent.xmin, ymin = extent.ymin, xmax = extent.xmax, ymax = extent.ymax;
    return new esri.geometry.Polygon({
      "rings": [
        [ [ xmin, ymin ], [ xmin, ymax ], [ xmax, ymax ], [ xmax, ymin ], [ xmin, ymin ] ]
      ],
      "spatialReference": extent.spatialReference.toJson()
    });
  }*/
});


/**************************
 * esri.layers._GridLayout
 **************************/

dojo.declare("esri.layers._GridLayout", null, {
  /*
   * cellSize = { width: <Number>, height: <Number> }
   * mapSize  = { width: <Number>, height: <Number> }
   */
  constructor: function(origin, cellSize, mapSize, srInfo) {
    this.origin = origin;
    this.cellWidth = cellSize.width;
    this.cellHeight = cellSize.height;
    this.mapWidth = mapSize.width;
    this.mapHeight = mapSize.height;
    this.srInfo = srInfo; // map wrapping is enabled and sr is wrappable
  },
  
  /*****************
   * Public Methods
   *****************/
  
  setResolution: function(mapExtent) {
    this._resolution = (mapExtent.xmax - mapExtent.xmin) / this.mapWidth;

    if (this.srInfo) {
      // Logic borrowed from tiled layer
      var pixelsCoveringWorld = Math.round((2 * this.srInfo.valid[1]) / this._resolution),
          numTiles = Math.round(pixelsCoveringWorld / this.cellWidth);
      
      this._frameStats = [ 
        /* #tiles */ numTiles, 
        /* -180 */ 0, 
        /* +180 */ numTiles - 1 
      ];
    }
  },
  
  getCellCoordinates: function(point) {
    //console.log("getCellCoordinates");
    var res = this._resolution,
        origin = this.origin;
    return {
      row: Math.floor((origin.y - point.y) / (this.cellHeight * res)),
      col: Math.floor((point.x - origin.x) / (this.cellWidth * res))
    };
  },
  
  normalize: function(col) {
    var frameStats = this._frameStats;
    if (frameStats) {
      // Logic borrowed from tiled layer
      var total_cols = frameStats[0], m180 = frameStats[1], p180 = frameStats[2];

      if (col < m180) {
        /*while (col < m180) {
          col += total_cols;
        }*/
        col = col % total_cols;
        col = col < m180 ? col + total_cols : col;
      }
      else if (col > p180) {
        /*while (col > p180) {
          col -= total_cols;
        }*/
        col = col % total_cols;
      }
    }
    
    return col;
  },
  
  intersects: function(cExtent, mExtent) {
    // cExtent assumed to be normalized already
    // and does not span across dateline
    
    var srInfo = this.srInfo;
    if (srInfo) {
      return dojo.some(mExtent._getParts(srInfo), function(mePart) {
        return cExtent.intersects(mePart.extent);
      });
    }
    else {
      return cExtent.intersects(mExtent);
    }
  },
  
  getCellExtent: function(row, col) {
    //console.log("getCellExtent");
    var res = this._resolution,
        origin = this.origin,
        cellWidth = this.cellWidth,
        cellHeight = this.cellHeight;
        
    return new esri.geometry.Extent(
      (col * cellWidth * res) + origin.x,
      origin.y - ( (row + 1) * cellHeight * res),
      ( (col + 1) * cellWidth * res) + origin.x,
      origin.y - (row * cellHeight * res),
      new esri.SpatialReference(origin.spatialReference.toJson())
    );
  },
  
  getLatticeID: function(mExtent) {
    var topLeftCoord = this.getCellCoordinates({ x: mExtent.xmin, y: mExtent.ymax }),
        bottomRightCoord = this.getCellCoordinates({ x: mExtent.xmax, y: mExtent.ymin }),
        minRow = topLeftCoord.row, 
        maxRow = bottomRightCoord.row,
        minCol = this.normalize(topLeftCoord.col), 
        maxCol = this.normalize(bottomRightCoord.col);
        
    return minRow + "_" + maxRow + "_" + minCol + "_" + maxCol;
  },
  
  sorter: function(a, b) {
    return (a < b) ? -1 : 1;
  },
  
  getCellsInExtent: function(extent, needLattice) {
    //console.log("getCellsInExtent");
    var topLeftCoord = this.getCellCoordinates({ x: extent.xmin, y: extent.ymax }),
        bottomRightCoord = this.getCellCoordinates({ x: extent.xmax, y: extent.ymin }),
        minRow = topLeftCoord.row, maxRow = bottomRightCoord.row,
        minCol = topLeftCoord.col, maxCol = bottomRightCoord.col,
        cells = [], i, j, nj, xcoords = [], ycoords = [], 
        len, xmin, xmax, ymin, ymax, paths = [], lattice, latticeID;
        
    for (i = minRow; i <= maxRow; i++) {
      for (j = minCol; j <= maxCol; j++) {
        nj = this.normalize(j);
        extent = this.getCellExtent(i, nj);
        
        cells.push({ 
          row: i, col: nj, 
          extent: extent, 
          resolution: this._resolution 
        });
        
        if (needLattice) {
          xcoords.push(extent.xmin, extent.xmax);
          ycoords.push(extent.ymin, extent.ymax);
        }
      }
    }
    //console.log(cells);
    
    minCol = this.normalize(minCol);
    maxCol = this.normalize(maxCol);
    
    // create a unique lost of x-coordinatesd and y-coordinates
    xcoords.sort(this.sorter);
    ycoords.sort(this.sorter);
    
    len = xcoords.length;
    for (i = len - 1; i >= 0; i--) {
      if (i < (len - 1)) {
        if (xcoords[i] === xcoords[i + 1]) {
          xcoords.splice(i, 1);
        }
      }
    }
    
    len = ycoords.length;
    for (i = len - 1; i >= 0; i--) {
      if (i < (len - 1)) {
        if (ycoords[i] === ycoords[i + 1]) {
          ycoords.splice(i, 1);
        }
      }
    }
    //console.log(xcoords, ycoords);
    
    // create the lattice
    if (xcoords.length && ycoords.length) {
      xmin = xcoords[0];
      xmax = xcoords[xcoords.length - 1];
      ymin = ycoords[0];
      ymax = ycoords[ycoords.length - 1];
      //console.log(xmin, xmax, ymin, ymax);
  
      len = xcoords.length;
      for (i = 0; i < len; i++) {
        // a line from ymax to ymin at this x-coordinate
        paths.push([ 
          [xcoords[i], ymax],
          [xcoords[i], ymin]
        ]);
      }
  
      len = ycoords.length;
      for (i = 0; i < len; i++) {
        // a line from xmin to xmax at this y-coordinate
        paths.push([
          [xmin, ycoords[i]],
          [xmax, ycoords[i]]
        ]);
      }
      
      lattice = new esri.geometry.Polyline({
        paths: paths,
        spatialReference: this.origin.spatialReference.toJson()
      });

      latticeID = minRow + "_" + maxRow + "_" + minCol + "_" + maxCol;
      
      //console.log("lattice = ", paths.length, dojo.toJson(lattice.toJson()));
      //console.log("key = " + latticeID);
      
      cells.push({
        latticeID: latticeID,
        lattice: lattice, // a polyline
        resolution: this._resolution
      });
    }
    
    return {
      minRow: minRow,
      maxRow: maxRow,
      minCol: minCol,
      maxCol: maxCol,
      cells: cells
    }; // cellInfo
  }
});

  
/****************************
 * esri.layers._TrackManager
 ****************************/

dojo.declare("esri.layers._TrackManager", null, {
  constructor: function(layer) {
    this.layer = layer;
    this.trackMap = {};
  },
  
  initialize: function(map) {
    this.map = map;
    
    var layer = this.layer, trackRenderer = layer.renderer.trackRenderer;
    if (trackRenderer && (layer.geometryType === "esriGeometryPoint")) {
      // TODO
      // Investigate the feasibility of doing this using a 
      // GroupElement or GroupGraphic that can be added to 
      // a graphics layer
      
      var container = (this.container = new esri.layers._GraphicsLayer({ 
        id: layer.id + "_tracks",
        _child: true 
      }));
      
      //container._onPanHandler = function() {}; // we don't want "translate" applied twice on pan
      container._setMap(map, layer._div);
      container.setRenderer(trackRenderer);
    }
  },
  
  addFeatures: function(features) {
    var tkid, trackMap = this.trackMap, layer = this.layer, tkidField = layer._trackIdField;
    
    // create a list of all the tracks and their corresponding features
    dojo.forEach(features, function(feature) {
      var attributes = feature.attributes; 
      tkid = attributes[tkidField];
      var ary = (trackMap[tkid] = (trackMap[tkid] || []));
      ary.push(feature);
    });

    // sort features in each track from oldest to newest
    var timeField = layer._startTimeField, oidField = layer.objectIdField;
    
    var sorter = function(a, b) {
      var time1 = a.attributes[timeField], time2 = b.attributes[timeField];
      if (time1 === time2) {
        // See:
        // http://code.google.com/p/v8/issues/detail?id=324
        // http://code.google.com/p/v8/issues/detail?id=90
        return (a.attributes[oidField] < b.attributes[oidField]) ? -1 : 1;
      }
      else {
        return (time1 < time2) ? -1 : 1;
      }
    };
    
    for (tkid in trackMap) {
      trackMap[tkid].sort(sorter);
      
      /*var ary = trackMap[tkid];
      ary.sort(function(a, b){
        var time1 = a.attributes[timeField], time2 = b.attributes[timeField];
        if (time1 === time2) {
          // See:
          // http://code.google.com/p/v8/issues/detail?id=324
          // http://code.google.com/p/v8/issues/detail?id=90
          return (a.attributes[oidField] < b.attributes[oidField]) ? -1 : 1;
        }
        else {
          return (time1 < time2) ? -1 : 1;
        }

//        if (time1 < time2) {
//          return -1;
//        }
//        if (time1 >= time2) {
//          return 1;
//        }
//        return 0;
      });*/
      
//      if (latestRendering) {
//        layer._repaint(ary[ary.length - 1]);
//      }
    }
  },
  
  drawTracks: function() {
    var container = this.container;
    if (!container) {
      return;
    }
    
    var trackMap = this.trackMap, sr = this.map.spatialReference,
        tkid, ary, path, i, point, tkidField = this.layer._trackIdField,
        attrs;
    
    /*var mapper = function(feature) {
      var point = feature.geometry;
      return [point.x, point.y];
    };*/
    
    // draw track lines
    for (tkid in trackMap) {
      // create polyline representing a track and add it to the container
      //var path = dojo.map(trackMap[tkid], mapper);
      ary = trackMap[tkid];
      path = [];
      
      for (i = ary.length - 1; i >=0 ; i--) {
        point = ary[i].geometry;
        
        if (point) {
          path.push([ point.x, point.y ]);
        }
      }
      
      attrs = {};
      attrs[tkidField] = tkid;
      
      if (path.length > 0) {
        container.add(
          new esri.Graphic(
            new esri.geometry.Polyline({ paths: [path], spatialReference: sr }),
            null,
            attrs
          )
        );
      }
    }
  },
  
  moveLatestToFront: function() {
    /*var layer = this.layer;
    if (!layer.renderer.latestObservationRenderer) {
      return;
    }
    
    var trackMap = this.trackMap;
    
    for (var tkid in trackMap) {
      var ary = trackMap[tkid];
      var graphic = ary[ary.length - 1], shape = graphic._shape;
      shape && shape._moveToFront();
      layer._repaint(graphic);
    }*/

    dojo.forEach(this.getLatestObservations(), function(graphic) {
      var shape = graphic._shape;
      shape && shape._moveToFront();
      this._repaint(graphic, null, true);
    }, this.layer);
  },
  
  getLatestObservations: function() {
    var retVal = [];
    if (!this.layer.renderer.latestObservationRenderer) {
      return retVal;
    }
    
    var trackMap = this.trackMap, tkid;
    
    for (tkid in trackMap) {
      var ary = trackMap[tkid];
      retVal.push(ary[ary.length - 1]);
    }
    
    return retVal;
  },
  
  clearTracks: function() {
    var latest = this.getLatestObservations();
    
    this.trackMap = {};
    var container = this.container;
    if (container) {
      container.clear();
    }
    
    dojo.forEach(latest, function(graphic) {
      this._repaint(graphic, null, true);
    }, this.layer);
  },
  
  isLatestObservation: function(feature) {
    var tkidField = this.layer._trackIdField;
    var track = this.trackMap[feature.attributes[tkidField]];
    if (track) {
      return (track[track.length - 1] === feature); 
    }
    return false;
  },
  
  destroy: function() {
    var container = this.container;
    if (container) {
      container.clear();
      container._unsetMap(this.map, this.layer._div);
      this.container = null;
    }
    this.map = null;
    this.layer = null;
    this.trackMap = null;
  }
});

});
