//>>built
// wrapped by build app
define("esri/toolbars/_VertexMover", ["dijit","dojo","dojox","dojo/require!dojox/gfx/move"], function(dijit,dojo,dojox){
dojo.provide("esri.toolbars._VertexMover");

dojo.require("dojox.gfx.move");

dojo.declare("esri.toolbars.VertexMover", null, {
  constructor: function(point, symbol, relatedGraphic, segIndex, ptIndex, segLength, editor, placeholder) {
    this.point = point;
    this.symbol = symbol;
    this.relatedGraphic = relatedGraphic;
    this.segIndex = segIndex;
    this.ptIndex = ptIndex;
    this.segLength = segLength;
    this.editor = editor;
    this.map = editor.map;
    this._scratchGL = editor.toolbar._scratchGL;
    this._placeholder = placeholder || false;
    
    this._type = relatedGraphic.geometry.type;
    this._init();
    this._enable();
  },
  
  refresh: function(force) {
    if (force || this._needRefresh()) {
      this._disable();
      this._enable();
    }
  },
  
  destroy: function() {
    this._disable();
    if (this.graphic) {
      this._scratchGL.remove(this.graphic);
    }
    this.point = this.symbol = this.graphic = this.relatedGraphic = this.segIndex = this.ptIndex = this.segLength = this.editor = this.map = this._scratchGL = null;
  },
  
  /***************************
   * Events
   * 
   * Handled for Edit toolbar
   *   onVertexMoveStart (graphic, vertexInfo)
   *   onVertexFirstMove (graphic, vertexInfo)
   *   onVertexMove (graphic, vertexInfo, transform)
   *   onVertexMoveStop (graphic, vertexInfo, transform)
   *   onVertexAdd (graphic, vertexInfo)
   *   onVertexClick (graphic, vertexInfo)
   ***************************/
  
  /*******************
   * Internal Methods
   *******************/
  
  _init: function() {
    var newPt = new esri.geometry.Point(this.point.toJson());
    var ptGraphic = new esri.Graphic(newPt, this.symbol);

    switch(this._type) {
      case "multipoint":
        // don't add the graphic to GL, just pretend
        ptGraphic._shape = this.relatedGraphic.getDojoShape().children[this.ptIndex];
        break;
      case "polyline":
      case "polygon":
        this._scratchGL.add(ptGraphic);
        break;        
    }
    this.graphic = ptGraphic;
  },
  
  _enable: function() {
    var shape = this.graphic.getDojoShape();
    if (shape) {
      shape._hasMover = true;
      this._moveable = this._getMoveable(shape);
      
      var node = shape.getEventSource();
      if (node) {
        dojo.style(node, "cursor", this.editor.toolbar._cursors[this._placeholder ? "move-gv" : "move-v"]);
      }
    }
  },
  
  _disable: function() {
    var moveable = this._moveable;
    if (moveable) {
      dojo.disconnect(this._startHandle);
      dojo.disconnect(this._firstHandle);
      dojo.disconnect(this._movingHandle);
      dojo.disconnect(this._stopHandle);
      var shape = moveable.shape;
      if (shape) {
        var node = shape.getEventSource();
        if (node) {
          dojo.style(node, "cursor", null);
        }
      }
      moveable.destroy();
      this._moveable = null;
    }
  },
  
  _needRefresh: function() {
    var shape = this.graphic.getDojoShape(), need = false;
    if (shape) {
      switch(this._type) {
        case "multipoint":
          var group = this.relatedGraphic.getDojoShape();
          if (group) {
            var child = group.children[this.ptIndex];
            if (shape !== child) {
              shape = child;
              this.graphic._shape = shape;
              need = true;
            }
          }
          break;
        case "polyline":
        case "polygon":
          need = !shape._hasMover;
          break;
      }
    }
    return need;
  },
  
  _getMoveable: function(shape) {
    // Note that support for leftButtonOnly is added to dojox/gfx/Moveable.js
    // as a local/private patch for Dojo 1.6.1
    // TODO
    // Perhaps we should enable leftButtonOnly for all browsers
    var moveable = new dojox.gfx.Moveable(shape, dojo.isMac && dojo.isFF && !esri.isTouchEnabled && { leftButtonOnly: true } );
    this._startHandle = dojo.connect(moveable, "onMoveStart", this, this._moveStartHandler);
    this._firstHandle = dojo.connect(moveable, "onFirstMove", this, this._firstMoveHandler);
    this._movingHandle = dojo.connect(moveable, "onMoving", this, this._movingHandler);
    this._stopHandle = dojo.connect(moveable, "onMoveStop", this, this._moveStopHandler);
    return moveable;
  },
  
  _getPtIndex: function() {
    return this.ptIndex + (this._placeholder ? 1 : 0);
  },
  
  _getInfo: function() {
    return {
      graphic: this.graphic,
      isGhost: this._placeholder,
      segmentIndex: this.segIndex,
      pointIndex: this._getPtIndex()
    };
  },
  
  _moveStartHandler: function(mover) {
    //console.log("[M-START]");
    var map = this.map;
    if (map.snappingManager) {
      map.snappingManager._setUpSnapping();
    }
    mover.shape.moveToFront();
    this.constructor.onMoveStart(this);
    this.editor.toolbar.onVertexMoveStart(this.relatedGraphic, this._getInfo());
  },
  
  _firstMoveHandler: function(mover) {
    //console.log("[M-FIRST START]");
    var shape = mover.shape;
    var edges = this._getControlEdges();
    var surface = this._scratchGL._div;
    
    var i, lines = [], wrapOffset = mover.host.shape._wrapOffsets[0] || 0;
    for (i = 0; i < edges.length; i++) {
      var edge = edges[i];
      edge.x1 += wrapOffset;
      edge.x2 += wrapOffset;
      lines.push([ surface.createLine({x1: edge.x1, y1: edge.y1, x2: edge.x2, y2: edge.y2}).setStroke(this.editor._lineStroke), edge.x1, edge.y1, edge.x2, edge.y2 ]);
    }
    shape._lines = lines;
    mover.shape.moveToFront();
    
    this.constructor.onFirstMove(this);
    this.editor.toolbar.onVertexFirstMove(this.relatedGraphic, this._getInfo());
  },
  
  _movingHandler: function(mover) {
    var shape = mover.shape, tx = shape.getTransform();
    
    // update guide lines
    var i, lines = shape._lines;
    for (i = 0; i < lines.length; i++) {
      var line = lines[i];
      line[0].setShape({x1: line[1] + tx.dx, y1: line[2] + tx.dy, x2: line[3], y2: line[4]});
    }
    
    this.editor.toolbar.onVertexMove(this.relatedGraphic, this._getInfo(), tx);
  },
  
  _moveStopHandler: function(mover) {
    //console.log("[M-STOP]");
    var shape = mover.shape, tx = shape.getTransform(), map = this.map;
    var host = this.graphic;

    // remove guide lines
    var i, lines = shape._lines;
    if (lines) {
      for (i = 0; i < lines.length; i++) {
        lines[i][0].removeShape();
      }
      shape._lines = null;
    }
    
    var ph = false, moved = true, info = this._getInfo();
    if (tx && (tx.dx || tx.dy)) {
      if (this._placeholder) {
        this._placeholder = false;
        ph = true;
      }
    }
    else {
      moved = false; // no movement
    }
    
    // update geometry for control graphic
    var snappingPoint;
    if (this.map.snappingManager) {
      snappingPoint = this.map.snappingManager._snappingPoint;
    }
    var newMapPt = snappingPoint || map.toMap(map.toScreen(host.geometry).offset(tx.dx, tx.dy));
    if(this.map.snappingManager) {
      this.map.snappingManager._killOffSnapping();
    }
    shape.setTransform(null);
    host.setGeometry(newMapPt);
    
    this.constructor.onMoveStop(this, tx);
    this.editor.toolbar.onVertexMoveStop(this.relatedGraphic, info, tx);
    if (!moved) {
      this.editor.toolbar.onVertexClick(this.relatedGraphic, info);
    }
    if (ph) {
      this.editor.toolbar.onVertexAdd(this.relatedGraphic, this._getInfo());
    }
  },
  
  _getControlEdges: function() {
    var map = this.map;
    var geometry = this.relatedGraphic.geometry;
    var segIndex = this.segIndex, ptIndex = this.ptIndex, segLen = this.segLength;
    ////console.log("seg ", segIndex, " point ", ptIndex, " length ", segLen);

    var surface = this._scratchGL._div;
    var surfaceTx = surface.getTransform(); // after map pan, the surface will have a transformation set, consider it as well
    var sdx = surfaceTx.dx, sdy = surfaceTx.dy;
    ////console.log(sdx, sdy);

    var pt = map.toScreen(this.graphic.geometry);
    var x = pt.x - sdx, y = pt.y - sdy;

    var edges = [];
    var cpoints = this.editor._getControlPoints(this, geometry, segIndex, ptIndex, segLen);
    if (cpoints[0]) {
      edges.push({x1: x, y1: y, x2: cpoints[0].x - sdx, y2: cpoints[0].y - sdy});
    }
    if (cpoints[1]) {
      edges.push({x1: x, y1: y, x2: cpoints[1].x - sdx, y2: cpoints[1].y - sdy});
    }
    
    return edges;
  }
});

// mixins
dojo.mixin(esri.toolbars.VertexMover, {
  onMoveStart: function() {},
  onFirstMove: function() {},
  onMoveStop: function() {}
});

});
