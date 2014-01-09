//>>built
// wrapped by build app
define("esri/dijit/editing/Editor", ["dijit","dojo","dojox","dojo/require!dijit/ProgressBar,dijit/_Widget,dijit/_Templated,esri/toolbars/edit,esri/toolbars/draw,esri/layers/FeatureLayer,esri/dijit/editing/Util,esri/dijit/editing/toolbars/Drawing,esri/dijit/editing/TemplatePicker,esri/dijit/AttributeInspector,esri/dijit/editing/SelectionHelper,esri/undoManager,esri/dijit/editing/editOperation"], function(dijit,dojo,dojox){
dojo.provide("esri.dijit.editing.Editor");
dojo.require("dijit.ProgressBar");
dojo.require("dijit._Widget");
dojo.require("dijit._Templated");

dojo.require("esri.toolbars.edit");
dojo.require("esri.toolbars.draw");
dojo.require("esri.layers.FeatureLayer");
dojo.require("esri.dijit.editing.Util");
dojo.require("esri.dijit.editing.toolbars.Drawing");
dojo.require("esri.dijit.editing.TemplatePicker");
dojo.require("esri.dijit.AttributeInspector");
dojo.require("esri.dijit.editing.SelectionHelper");
dojo.require("esri.undoManager");
dojo.require("esri.dijit.editing.editOperation");

/***************
 * CSS Includes
 ***************/
//anonymous function to load CSS files required for this module
(function() {
  var css = [
    dojo.moduleUrl("esri.dijit.editing", "css/editor.css")
  ];

  var head = document.getElementsByTagName("head").item(0), link;
  for (var i=0, il=css.length; i<il; i++) {
    link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = css[i].toString();
    head.appendChild(link);
  }
}());

dojo.declare("esri.dijit.editing.Editor", [dijit._Widget, dijit._Templated], {

    widgetsInTemplate: true,
    templateString:"<div class=\"esriEditor\">\r\n    <div class=\"esriTemplatePicker\" dojoAttachPoint=\"templatePickerDiv\"></div>\r\n    <div class=\"esriDrawingToolbar\" dojoAttachPoint=\"drawingToolbarDiv\"></div>\r\n    <div class=\"progressBar\" dojoAttachPoint=\"progressBar\" indeterminate=\"true\" dojoType=\"dijit.ProgressBar\" />\r\n</div>",

    /********************
     * Overrides
     *********************/
    constructor: function (params, srcNodeRef) {
        params = params || {};
        if (!params.settings) {
            console.error("Editor: please provide 'settings' parameter in the constructor");
        }
        if (!params.settings.layerInfos) {
            console.error("Editor: please provide 'layerInfos' parameter in the constructor");
        }
        this._settings = params.settings;
        this._eConnects = [];
    },

    postCreate: function () {
        this._setDefaultOptions();
        this._initLayers();
        this._connectEvents();
        this._createWidgets();
        this._reset();
        this._enableMapClickHandler();
    },

    stopEditing: function(callback) {
      this._updateCurrentFeature(dojo.hitch(this, function() {
        this._clearSelection(false);
        callback && callback();
      }));
    },

    destroy: function () {
        if (this.drawingToolbar) {
            this.drawingToolbar.destroy();
        }

        if (this.attributeInspector) {
            this.attributeInspector.destroy();
        }

        if (this.templatePicker) {
            this.templatePicker.destroy();
        }
        
        if (this._selectionHelper){
            this._selectionHelper.destroy();
        }

        if (this._drawToolbar){
          this._drawToolbar.deactivate();
        }
        
        //if (this.undoManager){
          //TODO: when undomanager implements destroy
          //this.undoManager.destroy();
        //}

        this._reset();
        this._disableMapClickHandler();
        dojo.forEach(this._eConnects, "dojo.disconnect(item);");
        dojo.disconnect(this._dtConnect);
        dojo.disconnect(this._templatePickerOnSelectionChangeEvent);
                
        this._layer = this._currentGraphic = this._activeType = this._activeTemplate = this._drawingTool =
        this._drawToolbar = this._editToolbar = this.drawingToolbar = this.attributeInspector = this.templatePicker =
        this.undoManager = null;
        
        if (this._settings.map.infoWindow && this._settings.map.infoWindow.clearFeatures){ 
          this._settings.map.infoWindow.clearFeatures(); 
        }

        this.inherited(arguments);
    },

    /*******************
     * Initialization
     *******************/
    _setDefaultOptions: function () {
        this._drawToolbar = this._settings.drawToolbar || new esri.toolbars.Draw(this._settings.map);
        this._settings.drawToolbar = this._drawToolbar;
        this._editToolbar = this._settings.editToolbar || new esri.toolbars.Edit(this._settings.map);
        this._settings.editToolbar = this._editToolbar;
        this._settings.toolbarVisible = this._settings.toolbarVisible || false;
        this._settings.toolbarOptions = dojo.mixin({reshapeVisible: false, cutVisible: false,  mergeVisible: false }, this._settings.toolbarOptions);
        this._settings.createOptions = dojo.mixin({polylineDrawTools: [esri.dijit.editing.Editor.CREATE_TOOL_POLYLINE], polygonDrawTools: [esri.dijit.editing.Editor.CREATE_TOOL_POLYGON], editAttributesImmediately: true }, this._settings.createOptions);
        this._settings.singleSelectionTolerance = this._settings.singleSelectionTolerance || 3;
        this._settings.maxUndoRedoOperations = this._settings.maxUndoRedoOperations || 10;
        this._settings.editor = this;
        this._usePopup = this._settings.usePopup = this._settings.map.infoWindow._setPagerCallbacks ? true : false;
        this._datePackage = this._settings.datePackage;
        
        var defaults = esri.config.defaults;
        this._settings.geometryService = this._settings.geometryService || defaults.geometryService;
        defaults.geometryService = defaults.geometryService || this._settings.geometryService;
    },

    _initLayers: function () {
        this._settings.layers = [];
        this._settings.userIds = {};
        this._settings.createOnlyLayer = {};
        var lInfos = this._settings.layerInfos;
        dojo.forEach(lInfos, function(layer) {
            if (layer.featureLayer && layer.featureLayer.loaded){
                this._settings.layers.push(layer.featureLayer);
                var layerId = layer.featureLayer.id;
                if (layer.featureLayer.credential) {
                  this._settings.userIds[layerId] = layer.featureLayer.credential.userId;
                }
                if (layer.userId) {
                  this._settings.userIds[layerId] = layer.userId;
                }
                var editCapabilities = layer.featureLayer.getEditCapabilities();
                if (editCapabilities.canCreate && !editCapabilities.canUpdate) {
                  this._settings.createOnlyLayer[layerId] = true;
                }
                else {
                  this._settings.createOnlyLayer[layerId] = false;
                }
            }
        }, this);
    },

    _reset: function () {
        this._hideAttributeInspector();
        this._editToolbar.deactivate();
        
        this._editVertices = true;
        this._layer = null;
        this._currentGraphic = null;
        this._activeType = null;
        this._activeTemplate = null;
        this._drawingTool = null;
        this._attributeChanged = false;
    },
    
    _saveFeatureOnClient: function (feature) {
      //feature is a geometry object here.      
      var selected = this.templatePicker.getSelected();
      var selectedSymbol;
      if (selected.template) {
        selectedSymbol = selected.featureLayer.renderer.getSymbol(selected.template.prototype);
      }
      else {
        selectedSymbol = selected.symbolInfo.symbol;
      }
      var fields = selected.featureLayer.fields;
      var att = {};
      dojo.forEach(fields, function(field, idx){
        att[field.name] = null;
      });
      this._tempGraphic = new esri.Graphic(feature, selectedSymbol, att, null);     
      var map = this._settings.map;
      map.graphics.add(this._tempGraphic);
      var point = this._findCenterPoint(feature);
      this._createAttributeInspector(true);
      map.infoWindow.setTitle(selected.featureLayer ? selected.featureLayer.name : esri.bundle.widgets.attributeInspector.NLS_title);
      this.attributeInspector.showFeature(this._tempGraphic, selected.featureLayer); 
      map.infoWindow.show(point, map.getInfoWindowAnchor(point));
      if (this._settings.createOnlyLayer[selected.featureLayer.id]) {
        this._infoWindowHideEvent = dojo.connect(map.infoWindow, "onHide", this, "_infoWindowHide");        
      }
      dojo.disconnect(this._templatePickerOnSelectionChangeEvent);      
      this.templatePicker.clearSelection();       
      this._drawToolbar.deactivate();      
      this._enableMapClickHandler();
        
      if (this.drawingToolbar){
        this.drawingToolbar.deactivate();
      }
      this._templatePickerOnSelectionChangeEvent = dojo.connect(this.templatePicker, "onSelectionChange", dojo.hitch(this, "_onCreateFeature"));
    },
    
    _saveAttributesOnClient: function (feature, fieldName, newFieldValue) {
      this._tempGraphic.attributes[fieldName] = (typeof(newFieldValue) === "number" && isNaN(newFieldValue)) ? null : newFieldValue;
    },
    
    _infoWindowHide: function(){
      this._createFeature(this._tempGraphic.geometry, this._tempGraphic.attributes);
      dojo.disconnect(this._infoWindowHideEvent);
    },

    _createFeature: function (feature, attributes) {
        // Cache center point, for case of wraparound
        this._editClickPoint = this._findCenterPoint(feature);
        
        // Point feature
        if (!feature.rings) {
            this._applyEdits([{ layer: this._layer, adds: [this._createGraphic(feature, attributes)]}]);
            return;
        }

        // Polyline || Polygon, simplify first
        this._simplify(feature, dojo.hitch(this, function (geometry) {
            if (this._drawingTool !== esri.layers.FeatureTemplate.TOOL_AUTO_COMPLETE_POLYGON) {
                this._applyEdits([{ layer: this._layer, adds: [this._createGraphic(geometry, attributes)]}]);
            } else {
                // AutoComplete Drawing Tool
                this._autoComplete(geometry, dojo.hitch(this, function (geometries) {
                    if (geometries && geometries.length){
                        this._applyEdits([{ layer: this._layer, adds: dojo.map(geometries, dojo.hitch(this, function(geometry){ return this._createGraphic(geometry, attributes); }))}]);
                    }
                }));
            }
        }));
    },
    
    _updateCurrentFeature : function(callback){
        //Applys edits to feature currently being edited if it was modified
        var modifiedFeature = this._isModified();
        if (modifiedFeature) {
            this._updateFeature(modifiedFeature, callback);
        } else if (callback) {
            callback(false);
        }
    },

    _updateFeature: function (feature, callback) {
        var geom = feature.geometry;
        // Point feature
        if (!geom.rings) {
            this._applyEdits([{ layer: feature.getLayer(), updates: [feature]}], callback);
        } else {
          // Polyline || Polygon, simplify first
          this._simplify(geom, dojo.hitch(this, function (geometry) {
            this._applyEdits([{ layer: feature.getLayer(), updates: [dojo.mixin(feature, {geometry:geometry})]}], callback);
          }));
        }
    },

    _deleteFeature: function (feature, callback) {
        var edits = [];
        if (!feature) {
            var layers = this._settings.layers;
            edits = dojo.map(dojo.filter(layers, function(layer){ return layer.getSelectedFeatures().length > 0; } ), "return {layer:item, deletes: item.getSelectedFeatures()}");
            if ((!edits || !edits.length) && this._currentGraphic) {
                edits.push({ layer: this._layer, deletes: [this._currentGraphic] });
            }
        } else {
            edits.push({ layer: feature.getLayer(), deletes: [feature] });
        }
        this._applyEdits(edits, (callback));
    },

    _stopEditing: function (layer, adds, updates, deletes) {
        esri.hide(this.progressBar.domNode);
        this._undoRedoAdd();
        var mapService;
        if (layer._isSelOnly === true) {
            if (adds && adds.length) { // selection only layer
                // "select" new feature to pull it to the client
                this.templatePicker.clearSelection();
                var query = new esri.tasks.Query();
                query.objectIds = [adds[0].objectId];
                if (!this._settings.createOnlyLayer[layer.id]) {
                  this._selectFeatures([layer], query, dojo.hitch(this, "_onEditFeature"));
                }
                else {
                  this._settings.map.graphics.remove(this._tempGraphic);
                }
            }
        } else { // Not "selection only" layer
            // Refresh any map services corresponding to this feature layer
            mapService = this._selectionHelper.findMapService(this._settings.map, layer);
            if (mapService) { mapService.refresh(); }
            if (adds && adds.length) {
                this.templatePicker.clearSelection();
                if (!this._settings.createOnlyLayer[layer.id]) {
                  esri.dijit.editing.Util.LayerHelper.findFeatures(adds, layer, dojo.hitch(this, "_onEditFeature"));
                }
                else {
                  this._settings.map.graphics.remove(this._tempGraphic);
                }
            }
        }
        
        if (deletes && deletes.length){
          this._clearSelection(true);
          if (this._undoRedo){
              mapService = this._selectionHelper.findMapService(layer, this._settings.map);
              if (mapService) { mapService.refresh(); }
          }
        }
        
        if (this._undoRedo && updates && updates.length){
          mapService = this._selectionHelper.findMapService(layer, this._settings.map);
          if (mapService) { mapService.refresh(); }
          this.attributeInspector.refresh();
          this._undoRedo = false;
        }
        
        if (this.drawingToolbar){
          this.drawingToolbar._updateUI();
        }
        this._undoRedo = false;
    },
        
    _undoRedoAdd: function(){
        this._settings._isApplyEditsCall = false;
        if (!this._settings.undoManager){ return;}
        if (this._activeTool === "CUT" || this._activeTool === "UNION"){ return; }
        var edit = (this._edits && this._edits.length) ? this._edits[0] : null;
        if (!edit){ return; }
        var adds = edit.adds || [];
        var updates = edit.updates || [];
        var deletes = edit.deletes || [];
        var param = {featureLayer: edit.layer};
        if (adds.length){
          this.undoManager.add(new esri.dijit.editing.Add(dojo.mixin(param, {addedGraphics:adds})));
        } else if (deletes.length){
          this.undoManager.add(new esri.dijit.editing.Delete(dojo.mixin(param, {deletedGraphics:deletes})));
        } else if (updates.length){
          this.undoManager.add(new esri.dijit.editing.Update(dojo.mixin(param, {preUpdatedGraphics:[this._preUpdates], postUpdatedGraphics:updates})));
        }
        this._edits = null;
        this._preUpdates = null;
    },

    _activateDrawToolbar: function (template) {
        this._layer = template.featureLayer;
        this._activeType = template.type;
        this._activeTemplate = template.template;
        this._drawingTool = this._activeTemplate ? this._activeTemplate.drawingTool : null;
        this._drawTool = this._toDrawTool(this._drawingTool, template.featureLayer);
        dojo.disconnect(this._dtConnect);
        //only create is allow for the feature service, for this case, 
        //editor should NOT create a feature right away when onDrawEnd event fires.
        //Because if creating it, it would be NOT possible to add attributes information later on.
        //The solution is to associate the close event of the infowindow, and hold on sending request
        //to server until the window is closed so that users have a chance to input attribute values.
        if (this._settings.createOnlyLayer[template.featureLayer.id]) {
          this._dtConnect = dojo.connect(this._drawToolbar, "onDrawEnd", this, "_saveFeatureOnClient");
        }
        else {
          this._dtConnect = dojo.connect(this._drawToolbar, "onDrawEnd", this, "_createFeature");
        }
        this._editToolbar.deactivate();
        this._disableMapClickHandler();
        if (!this.drawingToolbar){
            this._drawToolbar.activate(this._drawTool);
        } else {
            this.drawingToolbar.activateEditing(this._drawTool, this._layer);
        }
    },

    _activateEditToolbar: function (feature, info) {
        var layer = feature.getLayer();
        var geometryType = layer ? layer.geometryType : null;
        var editOptions = esri.toolbars.Edit.MOVE;
        if (geometryType !== "esriGeometryPoint" && this._isNotesFeature(feature) === true) {
            editOptions = editOptions | esri.toolbars.Edit.ROTATE | esri.toolbars.Edit.SCALE;
            this._editVertices = false;
        } else if (geometryType !== "esriGeometryPoint" && this._editVertices === true) {
            editOptions = editOptions | esri.toolbars.Edit.ROTATE | esri.toolbars.Edit.SCALE;
            this._editVertices = false;
        } else {
            editOptions = editOptions | esri.toolbars.Edit.EDIT_VERTICES;
            this._editVertices = true;
        }
        this._attributeChanged = this._isModified();
        this._preUpdates = new esri.Graphic(dojo.clone(feature.toJson()));
        //ownership base access control
        var editCapabilities = layer.getEditCapabilities({feature: feature, userId: this._settings.userIds[layer.id]});
        var currentLayerInfo = dojo.filter(this._settings.layerInfos, function(item){
          return item.featureLayer["layerId"] === layer.layerId;
        })[0];
        if (editCapabilities.canUpdate && !currentLayerInfo.disableGeometryUpdate && layer.allowGeometryUpdates) {
          this._editToolbar.activate(editOptions, feature);
        }
        
        if (!this._settings.map.infoWindow.isShowing){
            var point = (info && info.screenPoint) || this._findCenterPoint(feature); 
            this._settings.map.infoWindow.show(point, this._settings.map.getInfoWindowAnchor(point));
        }
    },

    _createGraphic: function (geometry, attributes) {
        var symbol = (this._activeType && this._activeType.symbol) || this._layer.defaultSymbol;
        var graphic = new esri.Graphic(geometry, symbol, attributes);
        if (this._activeTemplate || attributes) {
            graphic.attributes = attributes || dojo.mixin({}, this._activeTemplate.prototype.attributes);
        } else {
            graphic.attributes = graphic.attributes || [];
            dojo.forEach(this._layer.fields, function(field){ graphic.attributes[field.name] = null; }, this);
        }
        return graphic;
    },

    /********************
     * Events
     *********************/
    _connectEvents: function () {
        var layers = this._settings.layers;
        dojo.forEach(layers, "this._connect(item, 'onEditsComplete', dojo.hitch(this, '_stopEditing', item))", this);
        dojo.forEach(layers, "this._connect(item, 'onBeforeApplyEdits', dojo.hitch(this, function() { esri.show(this.progressBar.domNode); this._settings._isApplyEditsCall = true;  }))", this);
        this._connect(this._editToolbar, "onGraphicClick", dojo.hitch(this, "_activateEditToolbar"));
        this._connect(this._editToolbar, "onGraphicFirstMove", dojo.hitch(this, "_hideAttributeInspector"));
        this._connect(this._editToolbar, "onVertexFirstMove", dojo.hitch(this, "_hideAttributeInspector"));
        this._connect(this._editToolbar, "onScaleStart", dojo.hitch(this, "_hideAttributeInspector"));
        this._connect(this._editToolbar, "onRotateStart", dojo.hitch(this, "_hideAttributeInspector"));
    },

    _connect: function(node, evt, func){
        this._eConnects.push(dojo.connect(node, evt, func));
    },

    /********************
     * Widgets
     *********************/
    _createWidgets: function () {
        this._selectionHelper = new esri.dijit.editing.SelectionHelper(this._settings);
        this._createTemplatePicker();
        this._createAttributeInspector();
        this._createDrawingToolbar();
        this._createUndoRedoManager();
    },

    _createTemplatePicker: function () {
        if (!this._settings.templatePicker) {
            var layers = dojo.filter(this._settings.layers, function(item){return item.getEditCapabilities().canCreate;});
            this.templatePicker = new esri.dijit.editing.TemplatePicker({
                'class': 'esriTemplatePicker',
                featureLayers: layers,
                showTooltip: true,
                maxLabelLength: this._settings.typesCharacterLimit,
                columns: "auto",
                rows: "auto"
            }, this.templatePickerDiv);
            this.templatePicker.startup();
            this._settings.templatePicker = this.templatePicker;
        }
        else {
            this.templatePicker = this._settings.templatePicker;
            esri.hide(this.templatePickerDiv);
        }
        
        this._templatePickerOnSelectionChangeEvent = dojo.connect(this.templatePicker, "onSelectionChange", dojo.hitch(this, "_onCreateFeature"));
    },

    _createAttributeInspector: function (createOnly) {
        if (!this._settings.attributeInspector) {
            this._customAttributeInspector = false;
            var map = this._settings.map;
            this.attributeInspector = new esri.dijit.AttributeInspector({
                layerInfos: this._settings.layerInfos,
                hideNavButtons: this._usePopup,
                datePackage: this._datePackage
            }, dojo.create("div"));
            this.attributeInspector.startup();
            map.infoWindow.setContent(this.attributeInspector.domNode);
            map.infoWindow.setTitle(esri.bundle.widgets.attributeInspector.NLS_title);
            map.infoWindow.resize(350, 375);
            dojo.query('.esriAttributeInspector .atiLayerName').style({display:'none'});
        }
        else {
            this._customAttributeInspector = true;
            this.attributeInspector = this._settings.attributeInspector;
        }
        
        this._connect(this.attributeInspector, "onDelete", dojo.hitch(this, "_deleteFeature"));
        this._connect(this.attributeInspector, "onNext", dojo.hitch(this, function(feature) {
            this._updateCurrentFeature(dojo.hitch(this, function() { 
                this._attributeChanged = false;
                this._onEditFeature(feature);  
            }));
        }));
        
        if (this._usePopup){
            this._settings.map.infoWindow._setPagerCallbacks(this.attributeInspector, dojo.hitch(this.attributeInspector, "next"), dojo.hitch(this.attributeInspector, "previous"));
        }

        if (createOnly) {
            this._connect(this.attributeInspector, "onAttributeChange", dojo.hitch(this, "_saveAttributesOnClient"));
        }
        else {
            this._connect(this.attributeInspector, "onAttributeChange", dojo.hitch(this, function (feature, fieldName, newFieldValue) {
                this._preUpdates = new esri.Graphic(dojo.clone(feature.toJson()));
                this._currentGraphic.attributes[fieldName] = (typeof(newFieldValue) === "number" && isNaN(newFieldValue)) ? null : newFieldValue;
                this._updateFeature(this._currentGraphic, null);
                this._attributeChanged = false;
            }));
        }
    },

    _createDrawingToolbar: function () {
        if (this._settings.toolbarVisible === true) {
            this.drawingToolbar = new esri.dijit.editing.toolbars.Drawing({
                'class': 'esriDrawingToolbar',
                drawToolbar: this._drawToolbar,
                editToolbar: this._editToolbar,
                settings: this._settings,
                onDelete: dojo.hitch(this, "_deleteFeature"),
                onApplyEdits: dojo.hitch(this, "_applyEdits"),
                onShowAttributeInspector: dojo.hitch(this, "_onEditFeature")
            }, this.drawingToolbarDiv);
        }
    },
    
    _createUndoRedoManager: function() {
        if (!this._settings.enableUndoRedo && !this._settings.undoManager){ return; }
        this._settings.enableUndoRedo = true;
        this.undoManager = this._settings.undoManager;
        if (!this.undoManager){
          this.undoManager = this._settings.undoManager = new esri.UndoManager({maxOperations: this._settings.maxUndoRedoOperations});
        }
        
        this._connect(document, "onkeypress", dojo.hitch(this, function(evt){
            if (evt.metaKey || evt.ctrlKey){
              if (evt.charOrCode === 'z'){ this._undo(); }
              if (evt.charOrCode === 'y'){ this._redo(); }
            }
        }));
    },

    _enableMapClickHandler: function () {
        this._mapClickHandler = dojo.connect(this._settings.map, "onClick", dojo.hitch(this, function (evt) {
            if (this._drawToolbar._geometryType) { return; }
            
            if (this._activeTool === "SELECT"){
                this._activeTool = "";
                return;
            }
            
            this._updateCurrentFeature(dojo.hitch(this, function() {
                this._reset();
                this._updateSelection(evt);
            }));
        }));
    },

    _disableMapClickHandler: function () {
        dojo.disconnect(this._mapClickHandler);
    },

    _onCreateFeature: function () {
        var template = this.templatePicker.getSelected();
        if (template){
            // Check for a feature that was being edited
            this._updateCurrentFeature(dojo.hitch(this, function(){
                if (this._currentGraphic) { this._clearSelection(false); }
                this._reset();
                this._activateDrawToolbar(template);
            }));
        } else {
            this._reset();
            dojo.disconnect(this._dtConnect);
            this._drawToolbar.deactivate();
            this._enableMapClickHandler();
            if (this.drawingToolbar){
              this.drawingToolbar.deactivate();
            }
        }
    },
    
    _onEditFeature: function (feature, point) {
        feature = (dojo.isArray(feature) ? feature[0] : feature) || null;
        if (!feature){ return; }
        if (!this._customAttributeInspector) {
            point = point || this._editClickPoint || this._findCenterPoint(feature);
            var fLayer = feature.getLayer();
            this._settings.map.infoWindow.setTitle(fLayer ? fLayer.name : esri.bundle.widgets.attributeInspector.NLS_title);
            if (this.drawingToolbar || !this._settings.map.infoWindow.isShowing){
                this._settings.map.infoWindow.show(point, this._settings.map.getInfoWindowAnchor(point));
            }
            this._editClickPoint = null;
        }
        if (feature === this._currentGraphic){ return; }
        this._editVertices = true;
        this._layer = feature.getLayer();
        this._currentGraphic = feature;
        if (feature.getDojoShape()){ feature.getDojoShape().moveToFront(); }
        this._activateEditToolbar(feature);
    },

    _applyEdits: function (edits, callback) {
        edits = edits || [];
        if (edits.length <= 0) { return; }
        //editor tracking
        /*var featureLayer = edits[0].layer;     
        var editFieldsInfo = featureLayer.editFieldsInfo;
        var date;
        if (edits[0].adds && editFieldsInfo) {
          if (editFieldsInfo.creatorField){
            var creatorField = editFieldsInfo.creatorField;  
            edits[0].adds[0].attributes[creatorField] = this._settings.userIds[featureLayer.layerId];
          }
          if (editFieldsInfo.creationDateField){
            var creationDateField = editFieldsInfo.creationDateField;
            date = new Date();            
            edits[0].adds[0].attributes[creationDateField] = date;
          }
          if (editFieldsInfo.editorField){
            var editorField = editFieldsInfo.editorField;  
        	edits[0].adds[0].attributes[editorField] = this._settings.userIds[featureLayer.layerId];
          }
          if (editFieldsInfo.editDateField){
            var editDateField = editFieldsInfo.editDateField;
            date = new Date();            
            edits[0].adds[0].attributes[editDateField] = date;
          }
        }
        if (edits[0].updates && editFieldsInfo) {
          if (editFieldsInfo.editorField){
            var editorField = editFieldsInfo.editorField;  
        	edits[0].updates[0].attributes[editorField] = this._settings.userIds[featureLayer.layerId];
          }
          if (editFieldsInfo.editDateField){
            var editDateField = editFieldsInfo.editDateField;
            date = new Date();            
            edits[0].updates[0].attributes[editDateField] = date;
          }
        }*/
        
        this._edits = edits;
        
        //esri.show(this.progressBar.domNode);
        var deferreds = dojo.map(edits, function (edit) {
            return edit.layer.applyEdits(edit.adds, edit.updates, edit.deletes);
        });

        this._deferredsList = new dojo.DeferredList(deferreds).addCallback(dojo.hitch(this, function() {
            esri.hide(this.progressBar.domNode);
            
            if (callback) {
                callback();
            }
        
            // Editor uses the infowindow in such a way that infowindow.setContent
            // is only called once when attribute inspector is setup initially
            // when the editor is initialized. From then on, attribute inspector
            // keeps changing its content as needed. This will result in incorrect
            // positioning of popup (esri.dijit.Popup) pointer (left, right) - for example
            // when creating a new point feature 
            // Hence this piece of code. 
            var map = this._settings.map;
            if (map && map.infoWindow.reposition && map.infoWindow.isShowing) {
              map.infoWindow.reposition();
            }
        }));
    },
    
    _undo: function() {
      if (this._settings.undoManager && !this._settings._isApplyEditsCall){
          this._editToolbar.deactivate();
          //this._hideAttributeInspector();
          this._undoRedo = true;
          this._settings.undoManager.undo();
      }
    },
    
    _redo: function() {
      if (this._settings.undoManager && !this._settings._isApplyEditsCall){
          this._editToolbar.deactivate();
          //this._hideAttributeInspector();
          this._undoRedo = true;
          this._settings.undoManager.redo();
      }
    },

    /********************
     * Helpers
     *********************/
   _simplify : function(geometry, callback){
        if (esri.geometry.polygonSelfIntersecting(geometry)){
            this._settings.geometryService.simplify([geometry], function(simplifiedGeometries){
                  var geometry = (simplifiedGeometries && simplifiedGeometries.length) ? simplifiedGeometries[0] : geometry;
                  if (callback) {
                      callback(geometry);
                  }
            });
        } else if (callback) {
            callback(geometry);
        }
    },
    
    _autoComplete : function(geometry, callback){
        var layers = this._getLayers("esriGeometryPolygon");
        
        var query = new esri.tasks.Query(); 
        query.geometry = geometry;
        query.returnGeometry = true;

        this._selectFeatures(layers, query, dojo.hitch(this, function(selectionSet){
            if (!selectionSet || selectionSet.length <= 0) {
                if (callback) {
                    callback([geometry]);
                }
            } else {
                this._settings.geometryService.autoComplete(esri.getGeometries(selectionSet), this._toPolylines([query.geometry]), function(geometries){
                    if (callback) {
                        callback(geometries);
                    }
                });
            }
        }));
    },
    
    _getLayers : function(geomType) {
         var layers = this._settings.layers;
         return dojo.filter(layers, function(layer){ return layer.geometryType === geomType; });
    },

    _selectFeatures: function (layers, query, callback, mode) {
        this._selectionHelper.selectFeatures(layers, query, mode || esri.layers.FeatureLayer.SELECTION_NEW, callback);
    },

    _updateSelection: function (evt) {
        var mapPoint = evt.mapPoint;
        var graphic = evt.graphic;
        this._selectionHelper.selectFeaturesByGeometry(this._settings.layers, mapPoint, esri.layers.FeatureLayer.SELECTION_NEW, dojo.hitch(this, function(features) {
            var containsGraphic = dojo.some(features, dojo.hitch(this, function(item){ return item == graphic; }));
            if (graphic && !containsGraphic){
                var gLayer = graphic.getLayer();
								if (this._isValidLayer(gLayer)) {
	                var query  = new esri.tasks.Query();
	                query.objectIds = [graphic.attributes[gLayer.objectIdField]];
	                this._selectionHelper.selectFeatures([gLayer], query, esri.layers.FeatureLayer.SELECTION_ADD, dojo.hitch(this, function(features){
	                    this._updatePopupButtons(features);
	                    this._onEditFeature(features, mapPoint);
	                }));
								} else {
                  this._clearSelection();
								}
								
            } else if (features && features.length) {
                this._updatePopupButtons(features);
                this._onEditFeature(features, mapPoint);
            } else{
                this._clearSelection();
            }
        }));
    },
    
    _updatePopupButtons: function(features) {
        if (!this._usePopup || !features){ return; }
        var count = features.length;
        var buttons = [this._settings.map.infoWindow._prevFeatureButton, this._settings.map.infoWindow._nextFeatureButton];
        dojo.forEach(buttons, dojo.hitch(this, function(item){ (count > 1) ? dojo.removeClass(item, "hidden") : dojo.addClass(item, "hidden");}));
    },
    
    _clearSelection: function(doNotRefresh){
      this._selectionHelper.clearSelection(doNotRefresh || false);
      this._reset();
    },

    _findCenterPoint: function (graphic) {
        var geometry = graphic.geometry || graphic;
        var point;
        switch (geometry.type) {
        case "point":
            point = geometry;
            break;
        case "polyline":
            var pathLength = geometry.paths[0].length;
            point = geometry.getPoint(0, Math.ceil(pathLength / 2));
            break;
        case "polygon":
            var lastRing = geometry.rings.length - 1;
            var lastPoint = geometry.rings[lastRing].length - 1;
            point = geometry.getPoint(lastRing, lastPoint);
            break;
        }
        return this._settings.map.toScreen(point);
    },

    _hideAttributeInspector: function () {
        if (!this._customAttributeInspector && this._settings.map.infoWindow) {
            this._settings.map.infoWindow.hide();
        }
    },

    _toPolylines : function(polygons) {
        var polylines = dojo.map(polygons, function(polygon) {
          var polyline = new esri.geometry.Polyline(polygon.spatialReference);
          dojo.forEach(polygon.rings, function(ring) { polyline.addPath(ring); });
          return polyline;
        });
        return polylines;
   },

    _isNotesFeature: function (feature) {
        var layer = feature.getLayer();
        var types = layer ? layer.types || null : null;
        if (!types) {
            return false;
        }
        var typeId = feature.attributes[layer.typeIdField];
        var templates;
        dojo.some(types, function(type){ 
          if (type.id === typeId) {
              templates = type.templates;
              return true;
          }
          return false; 
        });
        
        if (!templates) {
            return false;
        }
        var template = templates[0] || null;
        if (!template) {
            return false;
        }
        var drawingTool = this._isShapeTool(template.drawingTool) || null;
        return drawingTool ? true : false;
    },
		
    _isValidLayer: function(layer){
			var lInfos = this._settings.layerInfos;
			for (var i = 0; i < lInfos.length; i++) {
				var validLayer = lInfos[i];
				if (layer.id == validLayer.layerId) {
					return true;
				}
			}
			return false;
		},

    _isShapeTool: function (drawingTool) {
        switch (drawingTool) {
        case esri.layers.FeatureTemplate.TOOL_ARROW:
            return esri.toolbars.Draw.ARROW;
        case esri.layers.FeatureTemplate.TOOL_LEFT_ARROW:
            return esri.toolbars.Draw.LEFT_ARROW;
        case esri.layers.FeatureTemplate.TOOL_RIGHT_ARROW:
            return esri.toolbars.Draw.RIGHT_ARROW;
        case esri.layers.FeatureTemplate.TOOL_UP_ARROW:
            return esri.toolbars.Draw.UP_ARROW;
        case esri.layers.FeatureTemplate.TOOL_DOWN_ARROW:
            return esri.toolbars.Draw.DOWN_ARROW;
        case esri.layers.FeatureTemplate.TOOL_CIRCLE:
            return esri.toolbars.Draw.CIRCLE;
        case esri.layers.FeatureTemplate.TOOL_ELLIPSE:
            return esri.toolbars.Draw.ELLIPSE;
        case esri.layers.FeatureTemplate.TOOL_TRIANGLE:
            return esri.toolbars.Draw.TRIANGLE;
        case esri.layers.FeatureTemplate.TOOL_RECTANGLE:
            return esri.toolbars.Draw.RECTANGLE;
        default:
            return null;
        }
    },

    _toDrawTool: function (drawingTool, layer) {
        var geometryType = layer.geometryType;
        switch (drawingTool) {
        case esri.layers.FeatureTemplate.TOOL_POINT:
            return esri.toolbars.Draw.POINT;
        case esri.layers.FeatureTemplate.TOOL_ARROW:
            return esri.toolbars.Draw.ARROW;
        case esri.layers.FeatureTemplate.TOOL_LEFT_ARROW:
            return esri.toolbars.Draw.LEFT_ARROW;
        case esri.layers.FeatureTemplate.TOOL_RIGHT_ARROW:
            return esri.toolbars.Draw.RIGHT_ARROW;
        case esri.layers.FeatureTemplate.TOOL_UP_ARROW:
            return esri.toolbars.Draw.UP_ARROW;
        case esri.layers.FeatureTemplate.TOOL_DOWN_ARROW:
            return esri.toolbars.Draw.DOWN_ARROW;
        case esri.layers.FeatureTemplate.TOOL_CIRCLE:
            return esri.toolbars.Draw.CIRCLE;
        case esri.layers.FeatureTemplate.TOOL_ELLIPSE:
            return esri.toolbars.Draw.ELLIPSE;
        case esri.layers.FeatureTemplate.TOOL_TRIANGLE:
            return esri.toolbars.Draw.TRIANGLE;
        case esri.layers.FeatureTemplate.TOOL_RECTANGLE:
            return esri.toolbars.Draw.RECTANGLE;
        case esri.layers.FeatureTemplate.TOOL_LINE:
            return esri.toolbars.Draw.POLYLINE;
        case esri.layers.FeatureTemplate.TOOL_POLYGON:
            return esri.toolbars.Draw.POLYGON;
        case esri.layers.FeatureTemplate.TOOL_FREEHAND:
            if (geometryType === "esriGeometryPolyline") {
                return esri.toolbars.Draw.FREEHAND_POLYLINE;
            } else {
                return esri.toolbars.Draw.FREEHAND_POLYGON;
            }
            break;
        default:
            //No drawTool specified, pick a default for them
            var drawType = esri.toolbars.Draw.POINT;
            if (geometryType === "esriGeometryPolyline") {
                drawType = esri.toolbars.Draw.POLYLINE;
                if (this._settings.createOptions.polylineDrawTools[0] === esri.dijit.editing.Editor.CREATE_TOOL_FREEHAND_POLYLINE) {
                    drawType = esri.toolbars.Draw.FREEHAND_POLYLINE;
                }
            } else if (geometryType === "esriGeometryPolygon") {
                drawType = esri.toolbars.Draw.POLYGON;
                if (this._settings.createOptions.polygonDrawTools[0] === esri.dijit.editing.Editor.CREATE_TOOL_FREEHAND_POLYGON) {
                    drawType = esri.toolbars.Draw.FREEHAND_POLYGON;
                }
            }
            return drawType;
        }
    },

    _isModified: function () {
        var status = this._editToolbar.getCurrentState();
        return ((status.isModified || this._attributeChanged) && status.graphic) ? status.graphic :  null;
    }
});

dojo.mixin(esri.dijit.editing.Editor, {
    CREATE_TOOL_POLYLINE: "polyline", CREATE_TOOL_FREEHAND_POLYLINE: "freehandpolyline", CREATE_TOOL_POLYGON: "polygon", CREATE_TOOL_FREEHAND_POLYGON: "freehandpolygon",
    CREATE_TOOL_AUTOCOMPLETE: "autocomplete", CREATE_TOOL_RECTANGLE: "rectangle", CREATE_TOOL_TRIANGLE: "triangle", CREATE_TOOL_CIRCLE: "circle",
    CREATE_TOOL_ELLIPSE: "ellipse", CREATE_TOOL_ARROW: "arrow", CREATE_TOOL_UP_ARROW: "uparrow", CREATE_TOOL_DOWN_ARROW: "downarrow", CREATE_TOOL_RIGHT_ARROW: "rightarrow", CREATE_TOOL_LEFT_ARROW: "leftarrow"
});
});
