//>>built
// wrapped by build app
define("esri/toolbars/edit", ["dijit","dojo","dojox","dojo/require!esri/toolbars/_toolbar,esri/toolbars/_GraphicMover,esri/toolbars/_VertexEditor,esri/toolbars/_Box"], function(dijit,dojo,dojox){
dojo.provide("esri.toolbars.edit");

dojo.require("esri.toolbars._toolbar");
dojo.require("esri.toolbars._GraphicMover");
dojo.require("esri.toolbars._VertexEditor");
dojo.require("esri.toolbars._Box");

// TODO
// [haitham] vertex move stop is fired when right-clicking on a vertex
// [DONE] arguments for onVertexClick etc for interpolated vertices
// [DONE] support multiple rings and paths
// DEL after clicking a vertex can delete the vertex
// ESC while moving a vertex or ghost vertex should cancel the current move
// optimize vertex movers by not creating moveable until mouseover
// add a point to multipoint
// context sensitive cursors
// undo/redo methods
// [DONE] Double click event for GL
// [GL?] moving a graphic in MOVE mode, fires graphic click at the end of move (http://pponnusamy.esri.com:9090/jsapi/mapapps/prototypes/editing/test-click-to-change.html)
//   - this problem is tough to solve when using moveable
// [DONE] remove vertices
// [DONE] vertex selection/unselection or just click?
// [DONE] context menu for vertices


/***************
 * CSS Includes
 ***************/
//anonymous function to load CSS files required for this module
(function() {
  var link = document.createElement("link");
  link.type = "text/css";
  link.rel = "stylesheet";
  link.href = dojo.moduleUrl("esri", "toolbars/css/edit.css").toString();
  document.getElementsByTagName("head").item(0).appendChild(link);
}());


/*********************
 * esri.toolbars.Edit
 *********************/

dojo.declare("esri.toolbars.Edit", esri.toolbars._Toolbar, {
  
  /**************
   * Constructor
   **************/
  
  constructor: function(/*esri.Map*/ map, /*Object?*/ options) {
    //console.log("edit toolbar constructor");
    this._map = map;
    this._tool = 0;

    //this._scratchGL = new esri.layers.GraphicsLayer();
    //map.addLayer(this._scratchGL);
    this._scratchGL = map.graphics;
    
    // default options
    var touch = esri.isTouchEnabled;
    
    this._defaultOptions = dojo.mixin({
      vertexSymbol: new esri.symbol.SimpleMarkerSymbol(
        esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 
        touch ? 20 : 12, 
        new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0, 0, 0, 0.5]), 1), 
        new dojo.Color([128, 128, 128])
      ),
      ghostVertexSymbol: new esri.symbol.SimpleMarkerSymbol(
        esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 
        touch ? 18 : 10, 
        new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0, 0, 0, 0.5]), 1), 
        new dojo.Color([255, 255, 255, 0.75])
      ),
      ghostLineSymbol: new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DOT, new dojo.Color([128, 128, 128]), 2),
      allowDeleteVertices: true,
      allowAddVertices: true,
      
      rotateHandleOffset: touch ? 24 : 16,
      boxLineSymbol: new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASH, new dojo.Color([64, 64, 64]), 1),
      boxHandleSymbol: new esri.symbol.SimpleMarkerSymbol(
        esri.symbol.SimpleMarkerSymbol.STYLE_SQUARE, 
        touch ? 16 : 9, 
        new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0, 0, 0, 0.5]), 1), 
        new dojo.Color([255, 255, 255, 0.75])
      )
    }, options || {});    
  },
  
  /*****************
   * Public Methods
   *****************/
  
  activate: function(/*Number*/ tool, /*esri.Graphic*/ graphic, /*Object?*/ options) {
    //console.log("Activate");
    this.deactivate();
    this._graphic = graphic;
    this._options = dojo.mixin(dojo.mixin({}, this._defaultOptions), options || {});

    var MOVE = esri.toolbars.Edit.MOVE, EDIT = esri.toolbars.Edit.EDIT_VERTICES;
    var SCALE = esri.toolbars.Edit.SCALE, ROTATE = esri.toolbars.Edit.ROTATE;
    var move = false, edit = false, box = false;
    
    if ((tool & MOVE) === MOVE) {
      move = this._enableMove(graphic);
    }
    
    var scale = ((tool & SCALE) === SCALE), rotate = ((tool & ROTATE) === ROTATE);
    if (scale || rotate) {
      box = this._enableBoxEditing(graphic, scale, rotate);
    }
    
    if ((tool & EDIT) === EDIT) {
      edit = this._enableVertexEditing(graphic);
    }
    
//    if (move || edit) {
//      if (move && edit) {
//        this._setupMultitoolMode();
//      }
//    }
    
    if (!(move || edit || box)) {
      throw new Error("[esri.toolbars.Edit::activate] " + esri.bundle.toolbars.edit.invalidType);
    }
    
    this._tool = tool;

    // post processing
    var map = this._map;
    if (this._tool) {
      // we need to redraw the graphics that were previously clipped out
      // and now getting into the viewport
      this._mapPanEndHandle = dojo.connect(map, "onPanEnd", this, this._mapPanEndHandler);
      this._mapExtChgHandle = dojo.connect(map, "onExtentChange", this, this._mapExtentChangeHandler);

      this.onActivate(this._tool, graphic);
    }
    if (map.snappingManager && (move || edit)) {
      map.snappingManager._startSelectionLayerQuery();
    }
  },
  
  deactivate: function() {
    //console.log("De-activate");
    var tool = this._tool, graphic = this._graphic;
    if (!tool) {
      return;
    }

    var modified = !!this._modified;
    
    this._clear();
    //this._setTool(0);
    dojo.disconnect(this._mapPanEndHandle);
    dojo.disconnect(this._mapExtChgHandle);
    //dojo.disconnect(this._gFMHandle);
    //dojo.disconnect(this._gMSHandle);
    this._graphic = null;
    this.onDeactivate(tool, graphic, {
      isModified: modified
    });
    if (this._map.snappingManager) {
      this._map.snappingManager._stopSelectionLayerQuery();
    }
  },
  
  refresh: function() {
    this._refreshMoveables(/*force*/ true); 
  },
  
  getCurrentState: function() {
    return {
      tool: this._tool,
      graphic: this._graphic,
      isModified: !!this._modified
    };
  },
  
  /*********
   * Events
   *********/
  
  onActivate: function(tool, graphic) {},
  onDeactivate: function(tool, graphic, info) {},
  
  // delegated to _GraphicMover
  onGraphicMoveStart: function(graphic) {},
  onGraphicFirstMove: function(graphic) { this._modified = true; },
  onGraphicMove: function(graphic, transform) {},
  onGraphicMoveStop: function(graphic, transform) {},
  onGraphicClick: function(graphic, info) {},
  
  // delegated to _vertexMover
  onVertexMoveStart: function(graphic, vertexInfo) {},
  onVertexFirstMove: function(graphic, vertexInfo) { this._modified = true; },
  onVertexMove: function(graphic, vertexInfo, transform) {},
  onVertexMoveStop: function(graphic, vertexInfo, transform) {},
  onVertexAdd: function(graphic, vertexInfo) { this._modified = true; },
  onVertexClick: function(graphic, vertexInfo) {},
  
  // delegated to _vertexEditor
  onVertexMouseOver: function(graphic, vertexInfo) {},
  onVertexMouseOut: function(graphic, vertexInfo) {},
  onVertexDelete: function(graphic, vertexInfo) { this._modified = true; },
  
  // delegated to _Box
  onScaleStart: function(graphic) {},
  onScaleFirstMove: function(graphic) { this._modified = true; },
  onScale: function(graphic, info) {},
  onScaleStop: function(graphic, info) {},
  onRotateStart: function(graphic) {},
  onRotateFirstMove: function(graphic) { this._modified = true; },
  onRotate: function(graphic, info) {},
  onRotateStop: function(graphic, info) {},
  
  /*******************
   * Internal Methods
   *******************/
  
  _enableMove: function(graphic) {
    //console.log("_enableMove");
    var map = this._map, type = graphic.geometry.type;
    
    switch(type) {
      case "point":
      case "polyline":
      case "polygon":
        this._graphicMover = new esri.toolbars._GraphicMover(graphic, map, this);
        return true;
      case "multipoint": // would a user want to move a multipoint graphic as a whole?
        break;
    }
    return false;
  },
  
  _enableVertexEditing: function(graphic) {
    //console.log("_enableVertexEditing");
    var map = this._map, type = graphic.geometry.type;
    
    switch(type) {
      case "point":
        break;
      case "multipoint":
      case "polyline":
      case "polygon":
        this._vertexEditor = esri.toolbars._GraphicVertexEditor.create(graphic, map, this);
        return true;
    }
    return false;
  },
  
  _enableBoxEditing: function(graphic, scale, rotate) {
    //console.log("_enableBoxEditing");
    var map = this._map, type = graphic.geometry.type;
    
    switch(type) {
      case "point":
      case "multipoint":
        break;
      case "polyline":
      case "polygon":
        this._boxEditor = new esri.toolbars._Box(graphic, map, this, scale, rotate);
        return true;
    }
    return false;
  },
  
  _disableMove: function() {
    //console.log("_disableMove");
    var graphicMover = this._graphicMover;
    if (graphicMover) {
      graphicMover.destroy();
      this._graphicMover = null;
    }
  },
  
  _disableVertexEditing: function() {
    //console.log("_disableVertexEditing");
    var vertexEditor = this._vertexEditor;
    if (vertexEditor) {
      vertexEditor.destroy();
      this._vertexEditor = null;
    }
  },
  
  _disableBoxEditing: function() {
    //console.log("_disableBoxEditing");
    var box = this._boxEditor;
    if (box) {
      box.destroy();
      this._boxEditor = null;
    }
  },
  
  _clear: function() {
    this._disableMove();
    this._disableVertexEditing();
    this._disableBoxEditing();
    this._tool = 0;
    this._modified = false;
  },
  
  _mapPanEndHandler: function() {
    //console.log("_mapPanEndHandler");
    this._refreshMoveables();
  },
  
  _mapExtentChangeHandler: function(e, d, levelChange) {
    if (levelChange) {
      //console.log("_mapExtentChangeHandler");
      this._refreshMoveables();    
    }
  },

  _refreshMoveables: function(force) {
    //console.log("_refreshMoveables");
    /*var graphicMover = this._graphicMover;
    if (graphicMover) {
      graphicMover.refresh(force);
    }

    var vertexEditor = this._vertexEditor;
    if (vertexEditor) {
      vertexEditor.refresh(force);
    }*/
    
    var tools = dojo.filter([
      this._graphicMover, this._vertexEditor, 
      this._boxEditor 
    ], esri._isDefined);
    
    dojo.forEach(tools, function(mov) {
      mov.refresh(force);
    });
  },
  
  // _beginOperation and _endOperation will be called by
  // the tools to indicate that the user is currently
  // interacting with the said tool. Used to suspend or
  // resume other tools. We could have gone the formal
  // route of tools firing events and the Edit module
  // would react but that's probably too much considering
  // this is an internal aspect.
  _beginOperation: function(toolName) {
    dojo.forEach(this._getAffectedTools(toolName), function(tool) {
      tool.suspend();
    });
  },
  
  _endOperation: function(toolName) {
    dojo.forEach(this._getAffectedTools(toolName), function(tool) {
      tool.resume();
    });
  },
  
  _getAffectedTools: function(toolName) {
    var tools = [];
    
    switch(toolName) {
      case "MOVE":
        tools = [ this._vertexEditor, this._boxEditor ];
        break;
      case "VERTICES":
        tools = [ this._boxEditor ];
        break;
      case "BOX":
        tools = [ this._vertexEditor ];
        break;
    }
    
    tools = dojo.filter(tools, esri._isDefined);
    return tools;
  }/*,
  
  _setupMultitoolMode: function() {
    dojo.disconnect(this._gFMHandle);
    dojo.disconnect(this._gMSHandle);
    this._gFMHandle = dojo.connect(esri.toolbars._GraphicMover, "onFirstMove", this, this._gFirstMoveHandler);
    this._gMSHandle = dojo.connect(esri.toolbars._GraphicMover, "onMoveStop", this, this._gMoveStopHandler);
  },
  
  _gFirstMoveHandler: function() {
    //console.log("FM");
    var vertexEditor = this._vertexEditor;
    if (vertexEditor) {
      vertexEditor.suspend();
    }
  },
  
  _gMoveStopHandler: function() {
    //console.log("MSTOP");
    var vertexEditor = this._vertexEditor;
    if (vertexEditor) {
      vertexEditor.resume();
    }
  }*/
});

// Tool type constants
dojo.mixin(esri.toolbars.Edit, {
  MOVE: 1,
  EDIT_VERTICES: 2,
  SCALE: 4,
  ROTATE: 8
});

});
