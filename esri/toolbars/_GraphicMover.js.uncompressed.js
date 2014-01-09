//>>built
// wrapped by build app
define("esri/toolbars/_GraphicMover", ["dijit","dojo","dojox","dojo/require!dojox/gfx/move"], function(dijit,dojo,dojox){
dojo.provide("esri.toolbars._GraphicMover");

dojo.require("dojox.gfx.move");

// ALERT
// We extend the gfx mover here so that we can record
// the last event and extract the screen point out of it
// for the onGraphicClick event
// Need a keep an eye on the constructor signature for
// dojox.gfx.Mover at every dojo release
dojo.declare("esri.toolbars._Mover", dojox.gfx.Mover, {
  constructor: function(shape, e, host) {
    this.__e = e;
  }
});

dojo.declare("esri.toolbars._GraphicMover", null, {
  constructor: function(graphic, map, toolbar) {
    this.graphic = graphic;
    this.map = map;
    this.toolbar = toolbar;
    
    this._enableGraphicMover();
    this._moved = false;
  },
  
  refresh: function(force) {
    var shape = this.graphic.getDojoShape();
    if (shape && (force || !shape._hostGraphic)) { // just clipped-in?
      //console.log("_GraphicMover - refresh");
      this._disableGraphicMover();
      this._enableGraphicMover();
    }
  },
  
  destroy: function() {
    this._disableGraphicMover();
  },
  
  hasMoved: function() {
    return this._moved;
  },
  
  /***************************
   * Events
   * 
   * Handled for Edit toolbar
   *   onGraphicMoveStart (graphic)
   *   onGraphicFirstMove (graphic)
   *   onGraphicMove (graphic, transform)
   *   onGraphicMoveStop (graphic, transform)
   *   onGraphicClick (graphic, info)
   ***************************/
  
  /*******************
   * Internal Methods
   *******************/
  
  _enableGraphicMover: function() {
    var graphic = this.graphic;
    var dojoShape = graphic.getDojoShape();
    if (dojoShape) {
      dojoShape._hostGraphic = graphic;
      this._moveable = new dojox.gfx.Moveable(dojoShape, { mover: esri.toolbars._Mover });
      this._moveStartHandle = dojo.connect(this._moveable, "onMoveStart", this, this._moveStartHandler);
      this._firstMoveHandle = dojo.connect(this._moveable, "onFirstMove", this, this._firstMoveHandler);
      this._movingHandle = dojo.connect(this._moveable, "onMoving", this, this._movingHandler);
      this._moveStopHandle = dojo.connect(this._moveable, "onMoveStop", this, this._moveStopHandler);
      
      var node = dojoShape.getEventSource();
      if (node) {
        dojo.style(node, "cursor", this.toolbar._cursors.move);
      }
    }
  },
  
  _disableGraphicMover: function() {
    var moveable = this._moveable;
    if (moveable) {
      dojo.disconnect(this._moveStartHandle);
      dojo.disconnect(this._firstMoveHandle);
      dojo.disconnect(this._movingHandle);
      dojo.disconnect(this._moveStopHandle);
      var shape = moveable.shape;
      if (shape) {
        shape._hostGraphic = null;
      
        var node = shape.getEventSource();
        if (node) {
          dojo.style(node, "cursor", null);
        }
      }
      moveable.destroy();
    }
    this._moveable = null;
  },
  
  _moveStartHandler: function() {
    var graphic = this.graphic;
    this._startTx = graphic.getDojoShape().getTransform();
    if (this.graphic.geometry.type === "point") {
      var map = this.map;
      if (map.snappingManager) {
        map.snappingManager._setUpSnapping();
      }
    }
    //console.log(dojo.toJson(this._startTx));
    this.toolbar.onGraphicMoveStart(graphic);
  },
  
  _firstMoveHandler: function() {
    //this.constructor.onFirstMove(this);
    this.toolbar._beginOperation("MOVE");
    this.toolbar.onGraphicFirstMove(this.graphic);
  },
  
  _movingHandler: function(mover) {
    this.toolbar.onGraphicMove(this.graphic, mover.shape.getTransform());
  },
  
  _moveStopHandler: function(mover) {
    //console.log("_moveStopHandler");
    var graphic = /*evt.graphic*/ /*this._moveable.shape._hostGraphic*/ this.graphic,
        map = this.map,
        mx = dojox.gfx.matrix,
        geometry = graphic.geometry,
        type = geometry.type,
        dojoShape = graphic.getDojoShape(),
        tx = dojoShape.getTransform();
    //console.log(dojo.toJson(tx));
    //if (!tx || !tx.dx && !tx.dy) {
    if ( dojo.toJson(tx) !==  dojo.toJson(this._startTx) ) {
      this._moved = true;
      
      switch(type) {
        case "point":
          //var newMapPt = map.toMap(map.toScreen(firstPt).offset(tx.dx, tx.dy));          
          var matrix = [ tx, mx.invert(this._startTx) ];
          var snappingPoint;
          if (map.snappingManager) {
            snappingPoint = map.snappingManager._snappingPoint;
          }
          geometry = snappingPoint || map.toMap(mx.multiplyPoint(matrix, map.toScreen(geometry, /*doNotRound*/ true)));
          if(map.snappingManager) {
            map.snappingManager._killOffSnapping();
          }
          break;
        case "polyline":
          geometry = this._updatePolyGeometry(geometry, geometry.paths, tx);
          break;
        case "polygon":
          geometry = this._updatePolyGeometry(geometry, geometry.rings, tx);
          break;
      }
      
      dojoShape.setTransform(null);
      graphic.setGeometry(geometry);
    }
    else {
      this._moved = false;
    }
    //this.constructor.onMoveStop(this);
    this.toolbar._endOperation("MOVE");
    this.toolbar.onGraphicMoveStop(graphic, tx);
    if (!this._moved) {
      var e = mover.__e,
          mapPosition = this.map.position,
          pt = new esri.geometry.Point(e.pageX - mapPosition.x, e.pageY - mapPosition.y);
      this.toolbar.onGraphicClick(graphic, { screenPoint: pt, mapPoint: this.map.toMap(pt) });
    }
  },
  
  _updatePolyGeometry: function(geometry, /*rings or paths*/ segments, transform) {
    var map = this.map;
    var firstPt = geometry.getPoint(0, 0);
    var newMapPt = map.toMap(map.toScreen(firstPt).offset(transform.dx, transform.dy));
    var d_mapX = newMapPt.x - firstPt.x;
    var d_mapY = newMapPt.y - firstPt.y;
  
    //var rings = geometry.rings;
    for (var i = 0; i < segments.length; i++) {
      var seg = segments[i];
      for (var j = 0; j < seg.length; j++) {
        var point = geometry.getPoint(i, j);
        geometry.setPoint(i, j, point.offset(d_mapX, d_mapY));
      }
    }
    return geometry;
  }
});

// mixins
//dojo.mixin(esri.toolbars._GraphicMover, {
//  onFirstMove: function() {},
//  onMoveStop: function() {}
//});

});
