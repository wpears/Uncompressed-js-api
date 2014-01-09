//>>built
// wrapped by build app
define("esri/dijit/editing/tools/AdvancedTools", ["dijit","dojo","dojox","dojo/require!esri/dijit/editing/tools/ToggleToolBase,esri/dijit/editing/tools/ButtonToolBase"], function(dijit,dojo,dojox){
dojo.require("esri.dijit.editing.tools.ToggleToolBase");
dojo.require("esri.dijit.editing.tools.ButtonToolBase");

dojo.provide("esri.dijit.editing.tools.AdvancedTools");

dojo.declare("esri.dijit.editing.tools.Cut", [esri.dijit.editing.tools.ToggleToolBase] ,{
    id            : "btnFeatureCut",
    _enabledIcon  : "toolbarIcon cutIcon",
    _disabledIcon : "toolbarIcon cutIcon", 
    _drawType     : esri.toolbars.Draw.POLYLINE,
    _enabled      : true,
    _label        : "NLS_cutLbl",
    _cutConnects  : [],

    /************
    * Overrides 
    ************/
    activate : function() {
        this._cutConnects.push(dojo.connect(this._toolbar, "onDrawEnd", this, "_onDrawEnd"));
        this.inherited(arguments);
    },

    deactivate : function() {
        this.inherited(arguments);
        dojo.forEach(this._cutConnects, "dojo.disconnect(item);");
        this._cutConnects = [];
        this._edits = [];
    },
    
    _onDrawEnd : function(geometry){
        var layers = this._settings.layers;
        var cutLayers = this._cutLayers = dojo.filter(layers, function(layer) {
            return ((layer.geometryType === "esriGeometryPolygon") || (layer.geometryType === "esriGeometryPolyline") &&
                     layer.visible && layer._isMapAtVisibleScale());
        });

        this._cutConnects = this._cutConnects.concat(dojo.map(cutLayers, dojo.hitch(this, function(layer){
            return dojo.connect(layer, "onEditsComplete", dojo.hitch(this, function(adds, updates, deletes){
              if (this._settings.undoRedoManager){
                  var undoMgr = this._settings.undoRedoManager;
                  dojo.forEach(this._edits, dojo.hitch(this, function(edit){
                    undoMgr.add(new esri.dijit.editing.Cut({featureLayer: edit.layer,
                                                            addedGraphics:edit.adds,
                                                            preUpdatedGraphics:edit.preUpdates,
                                                            postUpdatedGraphics:edit.updates}));
                  }), this);
              }
              this.onFinished();
            }));
        })));
        
        var query  = new esri.tasks.Query(); 
        query.geometry = geometry;
         dojo.forEach(cutLayers, function(layer, idx){
              this._settings.editor._selectionHelper.selectFeatures([layer], query, esri.layers.FeatureLayer.SELECTION_NEW, dojo.hitch(this, "_cutFeatures", layer, query));
          }, this);
    },
       
    _cutFeatures : function(layer, query, features){
        if (!features || !features.length){
           return;
        }
  
        this._edits = [];
        var deferreds = [];
        deferreds.push(this._settings.geometryService.cut(esri.getGeometries(features), query.geometry, dojo.hitch(this, "_cutHandler", layer, features)));
        var deferredsList = new dojo.DeferredList(deferreds).addCallback(dojo.hitch(this, function() { this.onApplyEdits(this._edits); }));
    },
   
    _cutHandler : function(layer, features, cutResult){
        var additions = [];
        var updates   = [];
        var preUpdates = dojo.map(features, 'return new esri.Graphic(dojo.clone(item.toJson()))');
        var currentCutIndex;
        var graphic;
        dojo.forEach(cutResult.cutIndexes, function(cutIndex,i) {
              if (currentCutIndex!=cutIndex) {
                //update existing
                currentCutIndex = cutIndex;
                updates.push(features[cutIndex].setGeometry(cutResult.geometries[i]));
              } else {
               //add new
                graphic = new esri.Graphic(cutResult.geometries[i],null, dojo.mixin({}, features[cutIndex].attributes),null);
                graphic.attributes[features[0].getLayer().objectIdField] = null;
                additions.push(graphic);
              }
        }, this);
       this._edits.push({layer:layer, adds:additions, updates:updates, preUpdates:preUpdates});
   }
});

dojo.declare("esri.dijit.editing.tools.Reshape", [esri.dijit.editing.tools.ToggleToolBase], {
    id: "btnFeatureReshape",
    _enabledIcon: "toolbarIcon reshapeIcon",
    _disabledIcon: "toolbarIcon reshapeIcon",
    _drawType: esri.toolbars.Draw.POLYLINE,
    _enabled: true,
    _label: "NLS_reshapeLbl",
    
    /************
     * Overrides
     ************/
    activate: function() {
      dojo.disconnect(this._rConnect);
      this._rConnect = dojo.connect(this._toolbar, "onDrawEnd", this, "_onDrawEnd");
      this.inherited(arguments);
    },
    
    deactivate: function() {
      this.inherited(arguments);
      dojo.disconnect(this._rConnect);
      delete this._rConnect;
    },
    
    _onDrawEnd: function(geometry) {
      var layers = this._settings.layers;
      var query = new esri.tasks.Query();
      query.geometry = geometry;
      var reshapeLayers = this._reshapeLayers = dojo.filter(layers, function(layer) { return (layer.geometryType === "esriGeometryPolygon" || "esriGeometryPolyline"); });
      this._settings.editor._selectionHelper.selectFeatures(reshapeLayers, query, esri.layers.FeatureLayer.SELECTION_NEW, dojo.hitch(this, "_reshape", query));
    },
    
    _reshape : function(query, selectionSet){
      var edits = [];
      var features = selectionSet;
      if (features.length !== 1){ return; }
     
      this._settings.geometryService.reshape(features[0].geometry, query.geometry, dojo.hitch(this, function(geometry) {
        var updates = [features[0].setGeometry(geometry)];
        this.onApplyEdits([{layer: features[0].getLayer(), updates: updates}], dojo.hitch(this, function() {
          this._settings.editor._selectionHelper.clearSelection(false);
          this.onFinished();
        }));
      }));
    }
});

dojo.declare("esri.dijit.editing.tools.Union", [esri.dijit.editing.tools.ButtonToolBase], {
  id: "btnFeatureUnion",
  _enabledIcon: "toolbarIcon unionIcon",
  _disabledIcon: "toolbarIcon unionIcon",
  _drawType: esri.toolbars.Draw.POLYLINE,
  _enabled: true,
  _label : "NLS_unionLbl",
  /*****************
   * Event Listeners
   *****************/
  _onClick: function(evt) {
    this._settings.editor._activeTool = "UNION";
    var layers = this._settings.layers;
    var unionLayers = dojo.filter(layers, "return (item.geometryType === 'esriGeometryPolygon') && (item.visible && item._isMapAtVisibleScale());");
    
    var edits = [];
    var count = 0;
    dojo.forEach(unionLayers, function(layer, idx) {
      var features = layer.getSelectedFeatures();
      if (features.length >= 2) {
        count++;
        var preUpdates = dojo.map(features, 'return new esri.Graphic(dojo.clone(item.toJson()))');
        this._settings.geometryService.union(esri.getGeometries(features), dojo.hitch(this, function(unionedGeometry) {
          var updates = [features.pop().setGeometry(unionedGeometry)];
          edits.push({layer: layer, updates: updates, deletes: features, preUpdates:preUpdates });
          count--;
          if (count <= 0) {
            this.onApplyEdits(edits, dojo.hitch(this, function() {
              if (this._settings.undoRedoManager){
                  var undoMgr = this._settings.undoRedoManager;
                  dojo.forEach(this._edits, dojo.hitch(this, function(edit){
                    undoMgr.add(new esri.dijit.editing.Union({featureLayer: edit.layer,
                                                              addedGraphics:edit.deletes,
                                                              preUpdatedGraphics:edit.preUpdates,
                                                              postUpdatedGraphics:edit.updates}));
                  }), this);
              }
              this._settings.editor._selectionHelper.clearSelection(false);
              this.onFinished();
            }));
          }
        }));
      }
    }, this);
  }
});
});
