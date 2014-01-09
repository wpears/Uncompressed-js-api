//>>built
// wrapped by build app
define("esri/dijit/editing/tools/Selection", ["dijit","dojo","dojox","dojo/require!esri/dijit/editing/tools/DropDownToolBase,esri/dijit/editing/Util,esri/dijit/editing/tools/SelectionTools"], function(dijit,dojo,dojox){
dojo.provide("esri.dijit.editing.tools.Selection");
dojo.require("esri.dijit.editing.tools.DropDownToolBase");
dojo.require("esri.dijit.editing.Util");
dojo.require("esri.dijit.editing.tools.SelectionTools");

dojo.declare("esri.dijit.editing.tools.Selection", [esri.dijit.editing.tools.DropDownToolBase] ,{
    _enabled : true,
    /************
    * Overrides 
    ************/
    activate : function() {
      this.inherited(arguments);
      this._sConnect = dojo.connect(this._toolbar, "onDrawEnd", this, "_onDrawEnd");
    },
    
    deactivate: function() {
      this.inherited(arguments);
      dojo.disconnect(this._sConnect);
      delete this._sConnect;
    },
    
    _initializeTool : function() {
        this._createSymbols();
        this._initializeLayers();
        this._toolTypes = ["select", "selectadd", "selectremove"];
    },
    
    /*****************
    * Event Listeners
    *****************/
    _onDrawEnd : function(geometry){
        this.inherited(arguments);
        this._settings.editor._hideAttributeInspector();
        var layers = this._settings.layers;
        this._selectMethod = this._activeTool._selectMethod;
        this._settings.editor._selectionHelper.selectFeaturesByGeometry(layers, geometry, this._selectMethod, dojo.hitch(this, "onFinished"));
    },

    /*******************
    * Internal Methods
    *******************/
    _createSymbols : function() {
        this._pointSelectionSymbol    = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 10, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0, 0, 0]), 1), new dojo.Color([255, 0, 0, 0.5])) ;
        this._polylineSelectionSymbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0, 200, 255]), 2);
        this._polygonSelectionSymbol  = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0, 0, 0]), 1), new dojo.Color([0, 200, 255, 0.5]));                  
    },
    
    _initializeLayers : function() {
        var layers = this._settings.layers;
        dojo.forEach(layers, this._setSelectionSymbol, this);
    },
    
    _setSelectionSymbol : function(layer){
      var symbol = null;
      switch(layer.geometryType){
          case "esriGeometryPoint": symbol = this._pointSelectionSymbol; break;
          case "esriGeometryPolyline": symbol = this._polylineSelectionSymbol; break;
          case "esriGeometryPolygon": symbol = this._polygonSelectionSymbol; break;
      }
      layer.setSelectionSymbol(layer._selectionSymbol || symbol);
    },
    
     _createTools : function() {
        dojo.forEach(this._toolTypes, this._createTool, this);
        this.inherited(arguments);
    },
    
    _createTool : function(toolName){
      var params = dojo.mixin(esri.dijit.editing.tools.SelectionTools[toolName], {settings: this._settings, onClick: dojo.hitch(this, "onItemClicked")});
      this._tools[toolName.toUpperCase()] = new esri.dijit.editing.tools.Edit(params); 
    }
});

});
