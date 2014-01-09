//>>built
// wrapped by build app
define("esri/toolbars/_Box", ["dijit","dojo","dojox","dojo/require!dojox/gfx/Moveable,dojox/gfx/matrix"], function(dijit,dojo,dojox){
dojo.provide("esri.toolbars._Box");

dojo.require("dojox.gfx.Moveable");
dojo.require("dojox.gfx.matrix");

dojo.declare("esri.toolbars._Box", null, {
  constructor: function(graphic, map, toolbar, scale, rotate) {
    this._graphic = graphic;
    this._map = map;
    this._toolbar = toolbar;
    this._scale = scale;
    this._rotate = rotate;
    this._defaultEventArgs = {};
    this._scaleEvent = "Scale";
    this._rotateEvent = "Rotate";
    
    // symbols
    var options = toolbar._options;
    this._markerSymbol = options.boxHandleSymbol; // new esri.symbol.SimpleMarkerSymbol();
    this._lineSymbol = options.boxLineSymbol; // new esri.symbol.SimpleLineSymbol();
    
    this._moveStartHandler = dojo.hitch(this, this._moveStartHandler);
    this._firstMoveHandler = dojo.hitch(this, this._firstMoveHandler);
    this._moveStopHandler = dojo.hitch(this, this._moveStopHandler);
    this._moveHandler = dojo.hitch(this, this._moveHandler);
    
    this._init();
  },
  
  destroy: function() {
    this._cleanUp();
    this._graphic = this._map = this._toolbar = this._markerSymbol = this._lineSymbol = null;
  },
  
  refresh: function() {
    this._draw();
  },
  
  suspend: function() {
    dojo.forEach(this._getAllGraphics(), function(g) {
      g.hide();
    });
  },
  
  resume: function() {
    dojo.forEach(this._getAllGraphics(), function(g) {
      g.show();
    });

    this._draw();
  },
  
  /***************************
   * Events
   * 
   * Handled for Edit toolbar
   *   onScaleStart (graphic)
   *   onScaleFirstMove (graphic)
   *   onScale (graphic, info)
   *   onScaleStop (graphic, info)
   *   onRotateStart (graphic)
   *   onRotateFirstMove (graphic)
   *   onRotate (graphic, info)
   *   onRotateStop (graphic, info)
   ***************************/
  
  /*******************
   * Internal Methods
   *******************/
  
  _init: function() {
    this._draw();
  },
  
  _cleanUp: function() {
    if (this._connects) {
      dojo.forEach(this._connects, dojo.disconnect, dojo);
    }

    var gLayer = this._toolbar._scratchGL;
    if (this._anchors) {
      dojo.forEach(this._anchors, function(info) {
        gLayer.remove(info.graphic);
        var mov = info.moveable;
        if (mov) {
          mov.destroy();
        }
      });
    }
    
    if (this._box) {
      gLayer.remove(this._box);
    }
    
    this._box = this._anchors = this._connects = null;
  },
  
  _draw: function() {
    if (!this._graphic.getDojoShape()) {
      this._cleanUp();
      return;
    }
    
    var map = this._map, gLayer = this._toolbar._scratchGL;
    var points = this._getBoxCoords();

    // Box
    var polyline = new esri.geometry.Polyline(map.spatialReference);
    var path = dojo.clone(dojo.filter(points, function(pt, index) {
      // remove rotor and midpoints
      return (index !== 8  && index % 2 === 0);
    }));
    if (path[0]) {
      path.push([ path[0][0], path[0][1] ]);
    }
    polyline.addPath(path);
    
    if (this._rotate) {
      polyline.addPath([points[1], points[8]]);
    }
    
    if (this._box) {
      // Update box
      this._box.setGeometry(polyline);
    }
    else {
      // Create box
      this._box = new esri.Graphic(polyline, this._lineSymbol);
      gLayer.add(this._box);
    }
    
    // Anchors
    if (this._anchors) {
      // Update existing anchors
      dojo.forEach(this._anchors, function(info, index) {
        if (!this._scale) {
          index = 8;
        }
        
        // update geometry
        var point = new esri.geometry.Point(points[index], map.spatialReference);
        info.graphic.setGeometry(point);
        
        // refresh moveable
        var mov = info.moveable, shape = info.graphic.getDojoShape();
        if (shape) {
          if (!mov) {
            info.moveable = this._getMoveable(info.graphic, index);
          }
          else if (shape !== mov.shape) {
            mov.destroy();
            info.moveable = this._getMoveable(info.graphic, index);
          }
        }
      }, this); // loop
    }
    else {
      // Create anchors
      this._anchors = [];
      this._connects = [];
      
      dojo.forEach(points, function(point, index) {
        if (!this._scale && index < 8) {
          return;
        }
        
        point = new esri.geometry.Point(point, map.spatialReference);
        var anchor = new esri.Graphic(point, this._markerSymbol);
        gLayer.add(anchor);
  
        this._anchors.push({ graphic: anchor, moveable: this._getMoveable(anchor, index) });
      }, this); // loop
    }
  },
  
  _getBoxCoords: function(returnScreen) {
    var graphic = this._graphic,
        map = this._map,
        bbox = this._getTransformedBoundingBox(graphic), points = [],
        pt, next, midpt;
    
    dojo.forEach(bbox, function(coord, index, arr) {
      pt = coord;
      
      // midpoint
      next = arr[index + 1];
      if (!next) {
        next = arr[0];
      }
      midpt = { x: (pt.x + next.x) / 2, y: (pt.y + next.y) / 2 };

      if (!returnScreen) {
        pt = map.toMap(pt);
        midpt = map.toMap(midpt);
      }

      points.push([ pt.x, pt.y ]);
      points.push([ midpt.x, midpt.y ]);
    });

    if (this._rotate) {
      var rotorPoint = dojo.clone(points[1]);
      rotorPoint = returnScreen ? { x: rotorPoint[0], y: rotorPoint[1] } : map.toScreen({ x: rotorPoint[0], y: rotorPoint[1] });
      rotorPoint.y -= this._toolbar._options.rotateHandleOffset;
      if (!returnScreen) {
        rotorPoint = map.toMap(rotorPoint);
      }
      points.push([ rotorPoint.x, rotorPoint.y ]);
    }
    
    return points;
  },
  
  _getTransformedBoundingBox: function(graphic) {
    // When map wrapping is enabled, Shape::getTransformedBoundingBox
    // will not help. Let's do it at geometry level for all browsers
    
    //if (dojo.isIE) {
      // Normally we dont need this routine, but we've overridden
      // GFX path in VML using esri.gfx.Path impl. This prevents
      // GFX from having the necessary data to compute transformed
      // bounding box
      var map = this._map;
      var extent = graphic.geometry.getExtent();
      var topLeft = new esri.geometry.Point(extent.xmin, extent.ymax);
      var bottomRight = new esri.geometry.Point(extent.xmax, extent.ymin);
      topLeft = map.toScreen(topLeft);
      bottomRight = map.toScreen(bottomRight);
      return [
        { x: topLeft.x, y: topLeft.y },
        { x: bottomRight.x, y: topLeft.y },
        { x: bottomRight.x, y: bottomRight.y },
        { x: topLeft.x, y: bottomRight.y }
      ];
    /*}
    else {
      return graphic.getDojoShape().getTransformedBoundingBox();
    }*/
  },
  
  _getAllGraphics: function() {
    var graphics = [ this._box ];
    
    if (this._anchors) {
      dojo.forEach(this._anchors, function(anchor) {
        graphics.push(anchor.graphic);
      });
    }
    
    graphics = dojo.filter(graphics, esri._isDefined);
    return graphics;
  },
  
  _getMoveable: function(anchor, index) {
    var shape = anchor.getDojoShape();
    if (!shape) {
      return;
    }
    
    var moveable = new dojox.gfx.Moveable(shape);
    moveable._index = index;
    // 0 - TL, 2 - TR, 4 - BR, 6 - BL
    // 1 - (TL+TR)/2, 3 - (TR+BR)/2, 5 - (BR+BL)/2, 7 - (BL+TR)/2
    // 8 - RotateHandle
    
    this._connects.push(dojo.connect(moveable, "onMoveStart", this._moveStartHandler));
    this._connects.push(dojo.connect(moveable, "onFirstMove", this._firstMoveHandler));
    this._connects.push(dojo.connect(moveable, "onMoveStop", this._moveStopHandler));
    
    // We dont want to move the anchor itself.
    // See: dojox.gfx.Moveable::onMove method
    // So, override Moveable's onMove impl
    moveable.onMove = this._moveHandler;
    
    var node = shape.getEventSource();
    if (node) {
      dojo.style(node, "cursor", this._toolbar._cursors["box" + index]);
    }
    
    return moveable;
  },
  
  _moveStartHandler: function(mover) {
    this._toolbar["on" + (mover.host._index === 8 ? this._rotateEvent : this._scaleEvent) + "Start"](this._graphic);
  },
  
  _firstMoveHandler: function(mover) {
    //console.log("START: ", mover);
    
    var index = mover.host._index, wrapOffset = (this._wrapOffset = mover.host.shape._wrapOffsets[0] || 0),
        surfaceTx = this._graphic.getLayer()._div.getTransform(), mx = dojox.gfx.matrix,
        moverCoord, anchorCoord, boxCenter,
        coords = dojo.map(this._getBoxCoords(true), function(arr) {
          return { x: arr[0] + wrapOffset, y: arr[1] };
        });
    
    if (index === 8) {
      // Rotate
      moverCoord = mx.multiplyPoint(mx.invert(surfaceTx), coords[1]);
      boxCenter = { x: coords[1].x, y: coords[3].y };
      anchorCoord = mx.multiplyPoint(mx.invert(surfaceTx), boxCenter);
      this._startLine = [ anchorCoord, moverCoord ];
      this._moveLine = dojo.clone(this._startLine);
    }
    else {
      // Scale
      moverCoord = mx.multiplyPoint(mx.invert(surfaceTx), coords[index]);
      anchorCoord = mx.multiplyPoint(mx.invert(surfaceTx), coords[(index + 4) % 8]);
      
      this._startBox = anchorCoord;
      this._startBox.width = (coords[4].x - coords[0].x);
      this._startBox.height = (coords[4].y - coords[0].y);
      this._moveBox = dojo.clone(this._startBox);
      
      this._xfactor = moverCoord.x > anchorCoord.x ? 1 : -1;
      this._yfactor = moverCoord.y > anchorCoord.y ? 1 : -1;
      if (index === 1 || index === 5) {
        this._xfactor = 0;
      }
      else if (index === 3 || index === 7) {
        this._yfactor = 0;
      }
    }
    
    this._toolbar._beginOperation("BOX");
    this._toolbar["on" + (index === 8 ? this._rotateEvent : this._scaleEvent) + "FirstMove"](this._graphic);
  },
  
  _moveHandler: function(mover, shift) {
    //console.log(dojo.toJson(shift));
    
    var index = mover.host._index, args = this._defaultEventArgs,
        start, move, tx, pt, angle, xscale, yscale;
    
    args.angle = 0;
    args.scaleX = 1;
    args.scaleY = 1;
    
    if (index === 8) {
      // Rotate
      start = this._startLine;
      move = this._moveLine;
      pt = move[1];
      pt.x += shift.dx;
      pt.y += shift.dy;
      angle = this._getAngle(start, move);
      
      tx = dojox.gfx.matrix.rotategAt(angle, start[0]);
      this._graphic.getDojoShape().setTransform(tx);
      
      args.transform = tx;
      args.angle = angle;
      args.around = start[0];
    }
    else {
      // Scale
      start = this._startBox;
      move = this._moveBox;
      move.width += (shift.dx * this._xfactor);
      move.height += (shift.dy * this._yfactor);
      xscale = move.width / start.width;
      yscale = move.height / start.height;
      
      // Avoid NaNs or Infinitys for scale factors
      if (isNaN(xscale) || xscale === Infinity || xscale === -Infinity) {
        xscale = 1;
      }
      if (isNaN(yscale) || yscale === Infinity || yscale === -Infinity) {
        yscale = 1;
      }
      
      tx = dojox.gfx.matrix.scaleAt(xscale, yscale, start);
      this._graphic.getDojoShape().setTransform(tx);

      args.transform = tx;
      args.scaleX = xscale;
      args.scaleY = yscale;
      args.around = start;
    }
    
    this._toolbar["on" + (index === 8 ? this._rotateEvent : this._scaleEvent)](this._graphic, args);
  },
  
  _moveStopHandler: function(mover) {
    //console.log("END");
    var graphic = this._graphic, geometry = graphic.geometry.toJson(),
        shape = graphic.getDojoShape(), transform = shape.getTransform(),
        surfaceTx = graphic.getLayer()._div.getTransform();
    
    // update geometry
    this._updateSegments(geometry.paths || geometry.rings, transform, surfaceTx);
    shape.setTransform(null);
    graphic.setGeometry(esri.geometry.fromJson(geometry));
    
    // redraw box
    this._draw();
    
    // reset state
    this._startBox = this._moveBox = this._xfactor = this._yfactor = null;
    this._startLine = this._moveLine = null;
    
    this._toolbar._endOperation("BOX");
    this._defaultEventArgs.transform = transform;
    this._toolbar["on" + (mover.host._index === 8 ? this._rotateEvent : this._scaleEvent) + "Stop"](this._graphic, this._defaultEventArgs);
  },
  
  _updateSegments: function(segments, transform, surfaceTx) {
    var mx = dojox.gfx.matrix, map = this._map, wrapOffset = this._wrapOffset || 0;
    
    dojo.forEach(segments, function(segment) {
      dojo.forEach(segment, function(point) {
        var screenPt = map.toScreen({ x: point[0], y: point[1] }, /*doNotRound*/ true);
        screenPt.x += wrapOffset;
        // This is same as multiplying in this sequence:
        // 1. multiply with mx.invert(surfaceTx)
        // 2. multiply with transform
        // 3. multiply with surfaceTx
        screenPt = mx.multiplyPoint([surfaceTx, transform, mx.invert(surfaceTx)], screenPt);
        screenPt.x -= wrapOffset;
        
        var mapPt = map.toMap(screenPt);
        // Update in-place
        point[0] = mapPt.x;
        point[1] = mapPt.y;
      });
    });
  },
  
  _getAngle: function(line1, line2) {
    /*// points
    var p1 = line1[0], p2 = line1[1];
    var p3 = line2[0], p4 = line2[1];
    
    // 2D corrdinates
    var x1 = p1.x, y1 = p1.y;
    var x2 = p2.x, y2 = p2.y;
    var x3 = p3.x, y3 = p3.y;
    var x4 = p4.x, y4 = p4.y;

    // Deltas
    var dx1 = x2 - x1, dy1 = y2 - y1;
    var dx2 = x4 - x3, dy2 = y4 - y3;
    
    var dot = (dx1 * dx2) + (dy1 * dy2);
    var l2 = (dx1 * dx1 + dy1 * dy1) * (dx2 * dx2 + dy2 * dy2);
    
    var angle = Math.acos(dot / Math.sqrt(l2)) * 180 / Math.PI;
    //console.log(angle);
    return angle;*/
   
    /*var m1 = this.slope(line1[0], line1[1]);
    var m2 = this.slope(line2[0], line2[1]);
    var angle = Math.atan((m1 - m2) / (1 - (m1 * m2))) * 180 / Math.PI;
    console.log(angle);
    return angle;*/
   
    var angle1 = Math.atan2(line1[0].y - line1[1].y, line1[0].x - line1[1].x) * 180 / Math.PI,
        angle2 = Math.atan2(line2[0].y - line2[1].y, line2[0].x - line2[1].x) * 180 / Math.PI;
    return angle2 - angle1;
  }
});

// Reading related to SVG non-scaling-stroke:
// http://stackoverflow.com/questions/3127973/svg-polyline-and-path-scaling-issue
// http://www.w3.org/TR/SVGTiny12/painting.html#NonScalingStroke
// http://stackoverflow.com/questions/1039714/svg-problems
// https://bugs.webkit.org/show_bug.cgi?id=31438
// https://bugzilla.mozilla.org/show_bug.cgi?id=528332
// http://code.google.com/p/svg-edit/wiki/BrowserBugs

});
