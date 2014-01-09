//>>built
// wrapped by build app
define("esri/dijit/editing/tools/Editing", ["dijit","dojo","dojox","dojo/require!esri/dijit/editing/tools/DropDownToolBase,esri/dijit/editing/Util,esri/dijit/editing/tools/EditingTools"], function(dijit,dojo,dojox){
dojo.provide("esri.dijit.editing.tools.Editing");

dojo.require("esri.dijit.editing.tools.DropDownToolBase");
dojo.require("esri.dijit.editing.Util");
dojo.require("esri.dijit.editing.tools.EditingTools");

dojo.declare("esri.dijit.editing.tools.Editing", [esri.dijit.editing.tools.DropDownToolBase] ,{

    _enabled : false,
    /********************
    * Overrides
    *********************/ 
    deactivate: function() {
        if (!this._enabled){ return; }
        this._enabled = false;
        this.inherited(arguments);
        this._settings.templatePicker.clearSelection();
    },
    
    onItemClicked : function(evt){
        this.inherited(arguments);
        if (this._activeTool === this._tools.AUTOCOMPLETE){
          this._settings.editor._drawingTool = esri.layers.FeatureTemplate.TOOL_AUTO_COMPLETE_POLYGON;
        }
    },

    /*******************
    * Internal Methods
    *******************/
   _activateTool: function(drawTool, geometryType){
       this.enable(geometryType);
       //Only show available tools in menu
       for (var i in this._tools){
            if (this._tools.hasOwnProperty(i)){
                this.dropDown.removeChild(this._tools[i]);
                if (this._tools[i]._enabled === true){
                    this.dropDown.addChild(this._tools[i]);
                }
            }
       }
       if (this._activeTool._enabled === false){
           this._activeTool = this._tools[drawTool.toUpperCase()];
       }
       this._activeTool.activate();
       this._activeTool.setChecked(true);
       this._updateUI();
   },
   
    _initializeTool : function(settings){
        this.inherited(arguments);
        this._initializeTools();
    },

    _initializeTools : function() {
      var layers = this._settings.layers;
      var editor = this._settings.editor;
      var point = false, line = false, poly = false;
      var drawingTools = this._toolTypes = [];
      var geomType;
      dojo.forEach(layers, function(layer){
         geomType = layer.geometryType;
         point  = point || geomType === "esriGeometryPoint";
         line   = line  || geomType === "esriGeometryPolyline";
         poly   = poly  || geomType === "esriGeometryPolygon";
         drawingTools = drawingTools.concat(dojo.map(this._getTemplatesFromLayer(layer), dojo.hitch(this, function(template){
             return editor._toDrawTool(template.drawingTool, layer);
         })));
      }, this);

      var createOptions = this._settings.createOptions;
      if (point){ this._toolTypes.push("point"); }
      if (line) { this._toolTypes = this._toolTypes.concat(createOptions.polylineDrawTools); }
      if (poly) { this._toolTypes = this._toolTypes.concat(createOptions.polygonDrawTools); }
      
      this._toolTypes = this._toUnique(this._toolTypes.concat(drawingTools));
    },

    _toUnique : function(arr){
        var test = {};
        return dojo.filter(arr, function(val){
            return test[val] ? false : (test[val] = true);
        });
    },

    _getTemplatesFromLayer : function(layer){
        var templates = layer.templates || [];
        var types = layer.types;
        dojo.forEach(types, function(type){ templates = templates.concat(type.templates); });
        return dojo.filter(templates, esri._isDefined);
    },
   
    _createTools : function() {
        dojo.forEach(this._toolTypes, this._createTool, this);
        this.inherited(arguments);
    },
    
    _createTool : function(toolName){
      var params = dojo.mixin(esri.dijit.editing.tools.EditingTools[toolName], {settings: this._settings, onClick: dojo.hitch(this, "onItemClicked")});
      this._tools[toolName.toUpperCase()] = new esri.dijit.editing.tools.Edit(params); 
    }
});
});
