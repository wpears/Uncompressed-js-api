//>>built
// wrapped by build app
define("esri/toolbars/_VertexEditor", ["dijit","dojo","dojox","dojo/require!dijit/Menu,esri/toolbars/_VertexMover"], function(dijit,dojo,dojox){
dojo.provide("esri.toolbars._VertexEditor");

dojo.require("dijit.Menu");
dojo.require("esri.toolbars._VertexMover");

/************************************
 * esri.toolbars._GraphicVertexEditor
 ************************************/

dojo.declare("esri.toolbars._GraphicVertexEditor", null, {
  /*****************
   * Public Methods
   *****************/
  
  constructor: function(graphic, map, toolbar) {
    this.graphic = graphic;
    this.map = map;
    this.toolbar = toolbar;
    
    // symbols
    var options = toolbar._options;
    this._symbol1 = options.vertexSymbol;
    this._symbol2 = options.ghostVertexSymbol;
    var symbol = options.ghostLineSymbol;
    this._lineStroke = { style: symbol.style, width: symbol.width, color: symbol.color };
    
    // other options
    this._canDel = options.allowDeleteVertices;
    this._canAdd = options.allowAddVertices;
    
    this._addControllers();
  },
  
  destroy: function() {
    this._removeControllers();
  },
  
  refresh: function(force) {
    if (force) {
      this._removeControllers();
      this._addControllers();
    }
    else {
      this._refresh(this._vertexMovers);
      this._refresh(this._mpVertexMovers);
    }
  },
  
  suspend: function() {
    if (!this._suspended) {
      this._removeControllers();
    }
    this._suspended = true;
  },
  
  resume: function() {
    if (this._suspended) {
      this._addControllers();
    }
    this._suspended = false;
  },
  
  /***************************
   * Events
   * 
   * Handled for Edit toolbar
   *   onVertexMouseOver (graphic, vertexInfo)
   *   onVertexMouseOut (graphic, vertexInfo)
   *   onVertexDelete (graphic, vertexInfo)
   ***************************/
  
  /*******************
   * Internal Methods
   *******************/
  
  _addControllers: function() {
    this._firstMoveHandle = dojo.connect(esri.toolbars.VertexMover, "onFirstMove", this, this._firstMoveHandler);
    this._moveStopHandle = dojo.connect(esri.toolbars.VertexMover, "onMoveStop", this, this._moveStopHandler);
    
    // make the existing vertices moveable
    this._vertexMovers = this._add(this._getSegments(this.graphic.geometry), this._symbol1);
    
    // add place holders for new vertices at the midpoints of existing vertices
    if (this._canAdd) {
      this._mpVertexMovers = this._add(this._getMidpointSegments(this.graphic.geometry), this._symbol2, true);
    }

    // misc handlers
    var graphicsLayer = this._getGraphicsLayer();
    this._mouseOverHandle = dojo.connect(graphicsLayer, "onMouseOver", this, this._mouseOverHandler);
    this._mouseOutHandle = dojo.connect(graphicsLayer, "onMouseOut", this, this._mouseOutHandler);

    if (this._canDel) {
      // create right-click context menu for existing vertices
      this._ctxMenu = new dijit.Menu({ style: "font-size: 12px; margin-left: 5px; margin-top: 5px;" });
      var menuItem = (this._ctxDelete = new dijit.MenuItem({ label: esri.bundle.toolbars.edit.deleteLabel, iconClass: "vertexDeleteIcon", style: "outline: none;" }));
      this._deleteHandle = dojo.connect(menuItem, "onClick", this, this._deleteHandler);
      this._ctxMenu.addChild(menuItem);
      this._ctxMenu.startup();
    }
  },
  
  _removeControllers: function() {
    dojo.disconnect(this._firstMoveHandle);
    dojo.disconnect(this._moveStopHandle);
    dojo.disconnect(this._mouseOverHandle);
    dojo.disconnect(this._mouseOutHandle);
    dojo.disconnect(this._deleteHandle);
    if (this._ctxMenu) {
      this._ctxDelete = null;
      this._unbindCtxNode();
      this._ctxMenu.destroyRecursive();
    }
    this._remove(this._vertexMovers);
    this._remove(this._mpVertexMovers);
    this._vertexMovers = this._mpVertexMovers = null;
  },
  
  _add: function(segments, symbol, placeholders) {
    var i, j, graphic = this.graphic, movers = [];
    for (i = 0; i < segments.length; i++) {
      var segment = segments[i], group = [];
      for (j = 0; j < segment.length; j++) {
        group.push(
          new esri.toolbars.VertexMover(segment[j], symbol, graphic, i, j, segment.length, this, placeholders)
        );
      }
      movers.push(group);
    }
    return movers;
  },
  
  _remove: function(movers) {
    if (movers) {
      dojo.forEach(movers, function(group) {
        dojo.forEach(group, function(mover) {
          mover.destroy();
        });
      });
    }
  },
  
  _refresh: function(movers) {
    if (movers) {
      dojo.forEach(movers, function(group) {
        dojo.forEach(group, function(mover) {
          mover.refresh();
        });
      });
    }
  },
  
  _isNew: function(mover) {
    return (dojo.indexOf(this._vertexMovers[mover.segIndex], mover) === -1) ? true : false;
  },
  
  _getGraphicsLayer: function() {
    return this.toolbar._scratchGL;
  },
  
  _deleteHandler: function(evt) {
    var mover = this._selectedMover, ptIndex = mover.ptIndex;
    //console.log(mover.segIndex, mover.ptIndex);
    
//    if (window.confirm("Are you sure you want to delete this vertex?")) {
      this._updateRelatedGraphic(mover, mover.relatedGraphic, mover.graphic.geometry, mover.segIndex, mover.ptIndex, mover.segLength, false, true);
      if (this._canAdd) {
        this._deleteMidpoints(mover);
      }
      this._deleteVertex(mover);
//    }
    this.toolbar._endOperation("VERTICES");
  },
  
  _mouseOverHandler: function(evt) {
    ////console.log("O V E R");
    var graphic = evt.graphic, mover = this._findMover(graphic);
    if (mover) {
      this.toolbar.onVertexMouseOver(this.graphic, mover._getInfo());
      if (!mover._placeholder) { // context-menu only for existing vertices
        this._selectedMover = mover;
        if (this._canDel) {
          this._bindCtxNode(graphic.getDojoShape().getNode());
        }
      }
    }
  },
  
  _mouseOutHandler: function(evt) {
    ////console.log("O U T");
    var graphic = evt.graphic, mover = this._findMover(graphic);
    if (mover) {
      this.toolbar.onVertexMouseOut(this.graphic, mover._getInfo());
    }
  },
  
  _bindCtxNode: function(node) {
    // TODO
    // Don't bind if node === this._bindNode
    this._unbindCtxNode();
    this._ctxDelete.set("disabled", (this._selectedMover.segLength <= this.minLength) ? true : false);
    this._ctxMenu.bindDomNode(node);
    this._bindNode = node;
  },
  
  _unbindCtxNode: function() {
    var node = this._bindNode;
    if (node) {
      this._ctxMenu.unBindDomNode(node);
    }
  },
  
  _findMover: function(graphic) {
    var i, movers = [], mpMovers = this._mpVertexMovers;
    
    dojo.forEach(this._vertexMovers, function(group) {
      movers = movers.concat(group);
    });

    if (mpMovers) {
      dojo.forEach(mpMovers, function(group) {
        movers = movers.concat(group);
      });
    }
    
    for (i = 0; i < movers.length; i++) {
      var mover = movers[i];
      if (mover.graphic === graphic) {
        return mover;
      }
    }
  },
  
  _firstMoveHandler: function(mover) {
    if (!this._isNew(mover) && this._canAdd) {
      // hide related midpoints
      this._hideRelatedMidpoints(mover);
    }
    this.toolbar._beginOperation("VERTICES");
  },
  
  _moveStopHandler: function(mover, tx) {
    //console.log("_moveStopHandler");
    var add = this._isNew(mover);
    
    if (!tx || !tx.dx && !tx.dy) {
      if (!add && this._canAdd) {
        this._showRelatedMidpoints(mover);
      }
      return;
    }
    
    this._updateRelatedGraphic(mover, mover.relatedGraphic, mover.graphic.geometry, mover.segIndex, mover.ptIndex, mover.segLength, add);
    
    if (this._canAdd) {
      if (add) {
        // update midpoints list
        this._addMidpoints(mover);
      }
      else {
        // 1. update the location of related midpoints
        this._repositionRelatedMidpoints(mover);
              
        // 2. show hidden midpoints
        this._showRelatedMidpoints(mover);
      }
    }
    
    this.toolbar._endOperation("VERTICES");
  },
  
  _showRelatedMidpoints: function(mover) {
    var i, indices = this._getAdjacentMidpoints(mover.ptIndex, mover.segLength), movers = this._mpVertexMovers[mover.segIndex];
    //console.log("showing mps - ", indices);
    for (i = 0; i < indices.length; i++) {
      var mvr = movers[indices[i]];
      mvr.graphic.show();
      mvr.refresh();
    }
  },
  
  _hideRelatedMidpoints: function(mover) {
    var i, indices = this._getAdjacentMidpoints(mover.ptIndex, mover.segLength), movers = this._mpVertexMovers[mover.segIndex];
    //console.log("hiding mps - ", indices);
    for (i = 0; i < indices.length; i++) {
      movers[indices[i]].graphic.hide();
    }
  },
  
  _repositionRelatedMidpoints: function(mover) {
    var i, indices = this._getAdjacentMidpoints(mover.ptIndex, mover.segLength), movers = this._mpVertexMovers[mover.segIndex];
    //console.log("updating mps - ", indices);
    for (i = 0; i < indices.length; i++) {
      var verts = this._getAdjacentVertices(indices[i], mover.segLength);
      //console.log("verts - ", verts);
      var point1 = mover.relatedGraphic.geometry.getPoint(mover.segIndex, verts[0]), point2 = mover.relatedGraphic.geometry.getPoint(mover.segIndex, verts[1]);
      var midpoint = new esri.geometry.Point({ x: (point1.x + point2.x ) / 2, y: (point1.y + point2.y ) / 2, spatialReference: point1.spatialReference.toJson() });
      movers[indices[i]].graphic.setGeometry(midpoint);
    }
  },
  
  _addMidpoints: function(mover) {
    var segIndex = mover.segIndex, ptIndex = mover.ptIndex, segLength = mover.segLength;
    var newIndex = ptIndex + 1;
    var i, newLength = segLength + 1;

    // remove from the midpoint movers list      
    this._mpVertexMovers[segIndex].splice(ptIndex, 1);
    
    // update vertex movers list
    var movers = this._vertexMovers[segIndex];
    for (i = 0; i < newIndex; i++) {
      movers[i].segLength += 1;
    }
    for (i = newIndex; i < movers.length; i++) {
      movers[i].ptIndex += 1;
      movers[i].segLength += 1;
    }
    
    // insert into to vertex movers list
    mover.ptIndex = newIndex;
    mover.segLength = movers.length + 1;
    movers.splice(newIndex, 0, mover);
    
    // change symbology
    mover.graphic.setSymbol(this._symbol1);
    
    // update the midpoints list
    movers = this._mpVertexMovers[segIndex];
    for (i = 0; i < ptIndex; i++) {
      movers[i].segLength += 1;
    }
    for (i = ptIndex; i < segLength - 1; i++) {
      movers[i].ptIndex += 1;
      movers[i].segLength += 1;
    }
    
    //console.log("ptIndex ", ptIndex);
    //console.log("segLength ", segLength);
    //console.log("newIndex ", newIndex);
    //console.log("newLength ", newLength);
    
    var verts1 = this._getAdjacentVertices(ptIndex, newLength);
    var verts2 = this._getAdjacentVertices(ptIndex + 1, newLength);
    //console.log("verts1 - ", verts1);
    //console.log("verts2 - ", verts2);
    
    var point1, point2;
    point1 = mover.relatedGraphic.geometry.getPoint(mover.segIndex, verts1[0]);
    point2 = mover.relatedGraphic.geometry.getPoint(mover.segIndex, verts1[1]);
    var midpoint1 = new esri.geometry.Point({ x: (point1.x + point2.x ) / 2, y: (point1.y + point2.y ) / 2, spatialReference: point1.spatialReference.toJson() });
    
    point1 = mover.relatedGraphic.geometry.getPoint(mover.segIndex, verts2[0]);
    point2 = mover.relatedGraphic.geometry.getPoint(mover.segIndex, verts2[1]);
    var midpoint2 = new esri.geometry.Point({ x: (point1.x + point2.x ) / 2, y: (point1.y + point2.y ) / 2, spatialReference: point1.spatialReference.toJson() });
    
    var mvr1 = new esri.toolbars.VertexMover(midpoint1, this._symbol2, this.graphic, mover.segIndex, ptIndex, newLength, this, true);
    var mvr2 = new esri.toolbars.VertexMover(midpoint2, this._symbol2, this.graphic, mover.segIndex, ptIndex + 1, newLength, this, true);
    movers.splice(ptIndex, 0, mvr1, mvr2);
  },
  
  _deleteVertex: function(mover) {
    var i, segIndex = mover.segIndex, ptIndex = mover.ptIndex;
    
    // update vertex movers list
    var movers = this._vertexMovers[segIndex];
    for (i = 0; i < ptIndex; i++) {
      movers[i].segLength -= 1;
    }
    for (i = ptIndex + 1; i < movers.length; i++) {
      var mvr = movers[i];
      mvr.ptIndex -= 1;
      mvr.segLength -= 1;
    }
    movers.splice(ptIndex, 1);
    var info = mover._getInfo();
    mover.destroy();
    this.toolbar.onVertexDelete(this.graphic, info);
  }
});

// statics
dojo.mixin(esri.toolbars._GraphicVertexEditor, {
  create: function(graphic, map, toolbar) {
    var type = graphic.geometry.type;
    switch(type) {
      case "multipoint":
        return new esri.toolbars._MultipointVertexEditor(graphic, map, toolbar);
        break;
      case "polyline":
        return new esri.toolbars._PolylineVertexEditor(graphic, map, toolbar);
        break;
      case "polygon":
        return new esri.toolbars._PolygonVertexEditor(graphic, map, toolbar);
        break;
    }
  }
});

/***************************************
 * esri.toolbars._MultipointVertexEditor
 ***************************************/

dojo.declare("esri.toolbars._MultipointVertexEditor", esri.toolbars._GraphicVertexEditor, {
  minLength: 1, // end-user will not be able to delete the last remaining point
  
  constructor: function() {
    this._moveStartHandle = dojo.connect(esri.toolbars.VertexMover, "onMoveStart", this, this._moveStartHandler);
    dojo.disconnect(this._firstMoveHandle);
  },
  
  destroy: function() {
    this.inherited(arguments);
    dojo.disconnect(this._moveStartHandle);
  },
  
  _getSegments: function(geometry) {
    var i, points = geometry.points, segment = [], sr = geometry.spatialReference;
    for (i = 0; i < points.length; i++) {
      var point = points[i];
      segment.push(new esri.geometry.Point({ x: point[0], y: point[1], spatialReference: sr.toJson() }));
    }
    return [ segment ];
  },
  
  _getMidpointSegments: function(geometry) {
    return [];
  },
  
  _getControlPoints: function(mover, geometry, segIndex, ptIndex, segLength) {
    return [];
  },
  
  _getGraphicsLayer: function() {
    return this.graphic._graphicsLayer;
  },
  
  _mouseOverHandler: function(evt) {
    ////console.log("O V E R");
    var graphic = evt.graphic, mover = this._findMover(evt);
    if (mover) {
      this.toolbar.onVertexMouseOver(graphic, mover._getInfo());
      this._selectedMover = mover;
      if (this._canDel) {
        this._bindCtxNode(mover.graphic.getDojoShape().getNode());
      }
    }
  },
  
  _mouseOutHandler: function(evt) {
    ////console.log("O U T");
    var graphic = evt.graphic, mover = this._findMover(evt);
    if (mover) {
      this.toolbar.onVertexMouseOut(graphic, mover._getInfo());
    }
  },
  
  _findMover: function(evt) {
    var i, movers = [].concat(this._vertexMovers[0]), target = evt.target;
    for (i = 0; i < movers.length; i++) {
      var mover = movers[i];
      if (mover.graphic.getDojoShape().getNode() === target) {
        return mover;
      }
    }
  },
  
  _moveStartHandler: function(mover) {
    var geom = mover.relatedGraphic.geometry, ptIndex = mover.ptIndex;

    // adjust the links (we need this because we are moving the shape to the front)
    var newIndex = mover.segLength - 1;
    var points = geom.points;
    var spliced = points.splice(ptIndex, 1);
    points.push(spliced[0]);
    
    var j, movers = this._vertexMovers[0];
    for (j = newIndex; j > ptIndex; j--) {
      movers[j].ptIndex -= 1; 
    }
    spliced = movers.splice(ptIndex, 1);
    movers.push(spliced[0]);
    spliced[0].ptIndex = newIndex;
  },
  
  _moveStopHandler: function(mover) {
    this._updateRelatedGraphic(mover, mover.relatedGraphic, mover.graphic.geometry, mover.segIndex, mover.ptIndex, mover.segLength);
    this.toolbar._endOperation("VERTICES");
  },
  
  _updateRelatedGraphic: function(mover, graphic, newPoint, segIndex, ptIndex, segLen, add, del) {
    // Note: add is unused
    var geom = graphic.geometry;

    if (del) {
      geom.removePoint(ptIndex);
    }
    else {
      geom.setPoint(ptIndex, newPoint);
//      geom.points[ptIndex] = [ newPoint.x, newPoint.y ];
//      // ISSUE: GL clipping is broken because of obsolete geometry extent
//      // At the time of this writing (07/30/09), multipoint does not support
//      // setters to modify the geometry, unlike polyine/polygon.
//      // If mulitpoint supports setters, then we need to clear out
//      // _extent within the setters.
//      geom._extent = null;
    }

    graphic.setGeometry(geom);
  },
  
  _deleteMidpoints: function(mover){
  }
});

/*************************************
 * esri.toolbars._PolylineVertexEditor
 *************************************/

dojo.declare("esri.toolbars._PolylineVertexEditor", esri.toolbars._GraphicVertexEditor, {
  minLength: 2,
  
  _getSegments: function(geometry) {
    var i, j, paths = geometry.paths, segments = [];
    for (i = 0; i < paths.length; i++) {
      var path = paths[i], segment = [];
      for (j = 0; j < path.length; j++) {
        segment.push(geometry.getPoint(i, j));
      }
      segments.push(segment);
    }
    return segments;
  },
  
  _getMidpointSegments: function(geometry) {
    var i, j, paths = geometry.paths, segments = [], sr = geometry.spatialReference;
    for (i = 0; i < paths.length; i++) {
      var path = paths[i], segment = [];
      for (j = 0; j < path.length - 1; j++) {
        var point1 = geometry.getPoint(i, j), point2 = geometry.getPoint(i, j + 1);
        var midX = (point1.x + point2.x ) / 2, midY = (point1.y + point2.y ) / 2;
        var midpoint = new esri.geometry.Point({ x: midX, y: midY, spatialReference: sr.toJson() });
        segment.push(midpoint);
      }
      segments.push(segment);
    }
    return segments;
  },
  
  _getControlPoints: function(mover, geometry, segIndex, ptIndex, segLength) {
    var map = this.map, idx1, idx2, pt1, pt2;
    //console.log(segIndex, ptIndex, segLength);
    
    if (this._isNew(mover)) {
      idx1 = ptIndex;
      idx2 = ptIndex + 1;
      if (idx1 >= 0) {
        pt1 = map.toScreen(geometry.getPoint(segIndex, idx1));
      }
      if (idx2 <= segLength) {
        pt2 = map.toScreen(geometry.getPoint(segIndex, idx2));
      }
    }
    else {
      idx1 = ptIndex - 1;
      idx2 = ptIndex + 1;
      if (idx1 >= 0) {
        pt1 = map.toScreen(geometry.getPoint(segIndex, idx1));
      }
      if (idx2 < segLength) {
        pt2 = map.toScreen(geometry.getPoint(segIndex, idx2));
      }
    }
    
    return [ pt1, pt2 ];
  },
  
  _getAdjacentMidpoints: function(vtxIndex, segLength) {
    var points = [];
    var idx1 = vtxIndex - 1;
    if (idx1 >= 0) {
      points.push(idx1);
    }
    var idx2 = vtxIndex;
    if (idx2 < segLength - 1) {
      points.push(idx2);
    }
    return points;
  },
  
  _getAdjacentVertices: function(midPtIndex, segLength) {
    return [ midPtIndex, midPtIndex + 1 ];
  },
  
  _deleteMidpoints: function(mover) {
    var segIndex = mover.segIndex, ptIndex = mover.ptIndex, segLength = mover.segLength;

    // update the midpoints list
    var movers = this._mpVertexMovers[segIndex], newLength = movers.length - 1;  
    var indices = this._getAdjacentMidpoints(ptIndex, segLength).sort();
    var i, min = indices[0];

    for (i = 0; i < min; i++) {
      movers[i].segLength -= 1;
    }
    for (i = min + 1; i < movers.length; i++) {
      var mvr = movers[i];
      mvr.ptIndex -= 1;
      mvr.segLength -= 1;
    }
    
    if (indices.length === 1) { // deleting first or last vertex
      movers.splice(min, 1)[0].destroy();
    }
    else {
      // create mover for the new midpoint
      var verts = this._getAdjacentVertices(min, newLength);
      var point1 = mover.relatedGraphic.geometry.getPoint(mover.segIndex, verts[0]);
      var point2 = mover.relatedGraphic.geometry.getPoint(mover.segIndex, verts[1]);
      var midpoint1 = new esri.geometry.Point({ x: (point1.x + point2.x ) / 2, y: (point1.y + point2.y ) / 2, spatialReference: point1.spatialReference.toJson() });
      var mvr1 = new esri.toolbars.VertexMover(midpoint1, this._symbol2, this.graphic, mover.segIndex, min, newLength, this, true);
      var spliced = movers.splice(min, indices.length, mvr1);
      for (i = 0; i < spliced.length; i++) {
        spliced[i].destroy();
      }
    }
  },
  
  _updateRelatedGraphic: function(mover, graphic, newPoint, segIndex, ptIndex, segLen, add, del) {
    var geom = graphic.geometry;
    
    if (add) {
      geom.insertPoint(segIndex, ptIndex + 1, esri.geometry.fromJson(newPoint.toJson()));
    }
    else if (del) {
      geom.removePoint(segIndex, ptIndex);
    }
    else {
      geom.setPoint(segIndex, ptIndex, esri.geometry.fromJson(newPoint.toJson()));
    }
    
    graphic.setGeometry(geom);
  }
});

/************************************
 * esri.toolbars._PolygonVertexEditor
 ************************************/

dojo.declare("esri.toolbars._PolygonVertexEditor", esri.toolbars._GraphicVertexEditor, {
  minLength: 3,
  
  _getSegments: function(geometry) {
    var i, j, rings = geometry.rings, segments = [];
    for (i = 0; i < rings.length; i++) {
      var ring = rings[i], segment = [];
      for (j = 0; j < ring.length - 1; j++) { // exclude the last point in the ring
        segment.push(geometry.getPoint(i, j));
      }
      segments.push(segment);
    }
    return segments;
  },
  
  _getMidpointSegments: function(geometry) {
    var i, j, rings = geometry.rings, segments = [], sr = geometry.spatialReference;
    for (i = 0; i < rings.length; i++) {
      var ring = rings[i], segment = [];
      for (j = 0; j < ring.length - 1; j++) {
        var point1 = geometry.getPoint(i, j), point2 = geometry.getPoint(i, j + 1);
        var midX = (point1.x + point2.x ) / 2, midY = (point1.y + point2.y ) / 2;
        var midpoint = new esri.geometry.Point({ x: midX, y: midY, spatialReference: sr.toJson() });
        segment.push(midpoint);
      }
      segments.push(segment);
    }
    return segments;
  },
  
  _getControlPoints: function(mover, geometry, segIndex, ptIndex, segLength) {
    var map = this.map, idx1, idx2, pt1, pt2;
    
    if (this._isNew(mover)) { // new vertex
      idx1 = ptIndex;
      idx2 = (ptIndex + 1) % segLength;
    }
    else { // movement of existing vertices
      idx1 = ptIndex - 1;
      idx1 = idx1 < 0 ? (segLength + idx1) % segLength  : idx1;
      idx2 = (ptIndex + 1) % segLength;
    }
    
    pt1 = map.toScreen(geometry.getPoint(segIndex, idx1));
    pt2 = map.toScreen(geometry.getPoint(segIndex, idx2));
    return [ pt1, pt2 ];
  },
  
  _getAdjacentMidpoints: function(vtxIndex, segLength) {
    var idx1 = vtxIndex - 1;
    idx1 = idx1 < 0 ? (segLength + idx1) % segLength  : idx1;
    var idx2 = vtxIndex;
    return [ idx1, idx2 ];
  },
  
  _getAdjacentVertices: function(midPtIndex, segLength) {
    return [ midPtIndex, (midPtIndex + 1) % segLength ];
  },
  
  _deleteMidpoints: function(mover) {
    var segIndex = mover.segIndex, ptIndex = mover.ptIndex, segLength = mover.segLength;

    // update the midpoints list
    var movers = this._mpVertexMovers[segIndex], newLength = movers.length - 1,  
        indices = this._getAdjacentMidpoints(ptIndex, segLength).sort(),
        verts, point1, point2, midpoint1, i, mvr1, mvr, 
        min = indices[0], max = indices[indices.length - 1];
    
    if (ptIndex === 0) {
      // create mover for the new midpoint
      verts = this._getAdjacentVertices(newLength - 1, newLength);
      point1 = mover.relatedGraphic.geometry.getPoint(mover.segIndex, verts[0]);
      point2 = mover.relatedGraphic.geometry.getPoint(mover.segIndex, verts[1]);
      midpoint1 = new esri.geometry.Point({ x: (point1.x + point2.x ) / 2, y: (point1.y + point2.y ) / 2, spatialReference: point1.spatialReference.toJson() });
      mvr1 = new esri.toolbars.VertexMover(midpoint1, this._symbol2, this.graphic, mover.segIndex, newLength - 1, newLength, this, true);
      movers.splice(max, 1, mvr1)[0].destroy();
      movers.splice(min, 1)[0].destroy();
      
      for (i = 0; i < movers.length - 1; i++) {
        mvr = movers[i];
        mvr.ptIndex -= 1;
        mvr.segLength -= 1;
      }
    }
    else {
      // create mover for the new midpoint
      verts = this._getAdjacentVertices(min, newLength);
      point1 = mover.relatedGraphic.geometry.getPoint(mover.segIndex, verts[0]);
      point2 = mover.relatedGraphic.geometry.getPoint(mover.segIndex, verts[1]);
      midpoint1 = new esri.geometry.Point({ x: (point1.x + point2.x ) / 2, y: (point1.y + point2.y ) / 2, spatialReference: point1.spatialReference.toJson() });
      mvr1 = new esri.toolbars.VertexMover(midpoint1, this._symbol2, this.graphic, mover.segIndex, min, newLength, this, true);
      var spliced = movers.splice(min, indices.length, mvr1);
      for (i = 0; i < spliced.length; i++) {
        spliced[i].destroy();
      }
      
      for (i = 0; i < min; i++) {
        movers[i].segLength -= 1;
      }
      for (i = min + 1; i < movers.length; i++) {
        mvr = movers[i];
        mvr.ptIndex -= 1;
        mvr.segLength -= 1;
      }
    }
  },
  
  _updateRelatedGraphic: function(mover, graphic, newPoint, segIndex, ptIndex, segLen, add, del) {
    var geom = graphic.geometry;
    
    if (add) {
      geom.insertPoint(segIndex, ptIndex + 1, esri.geometry.fromJson(newPoint.toJson()));
    }
    else if (del) {
      geom.removePoint(segIndex, ptIndex);
      if (ptIndex === 0) {
        //geom.removePoint(segIndex, segLen);
        geom.setPoint(segIndex, segLen - 1, esri.geometry.fromJson(geom.getPoint(segIndex, 0).toJson()));
      }
    }
    else {
      geom.setPoint(segIndex, ptIndex, esri.geometry.fromJson(newPoint.toJson()));
      if (ptIndex === 0) { // polygons are "closed", remember? first & last points must be updated together
        geom.setPoint(segIndex, segLen, esri.geometry.fromJson(newPoint.toJson()));
      }
    }
    
    graphic.setGeometry(geom);
  }
});

});
