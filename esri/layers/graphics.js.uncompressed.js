//>>built
// wrapped by build app
define("esri/layers/graphics", ["dijit","dojo","dojox","dojo/require!esri/layers/layer,dojox/gfx,esri/graphic,esri/renderer"], function(dijit,dojo,dojox){
dojo.provide("esri.layers.graphics");

dojo.require("esri.layers.layer");
dojo.require("dojox.gfx");
dojo.require("esri.graphic");
dojo.require("esri.renderer");

if (dojox.gfx.renderer === "vml") {
  esri.vml = true;
  
  dojo.addOnLoad(function() {
    dojo.declare("esri.gfx.Path", dojox.gfx.Path, {
      setShape: function(newShape) {
        this.rawNode.path.v = (this.vmlPath = newShape);
        return this;
      }
    });
  
    esri.gfx.Path.nodeType = "shape";
    
    // Overrides to support layer opacity in IE
    
    var shapeClass = dojox.gfx.Shape || dojox.gfx.vml.Shape, 
        gfxSetStroke = shapeClass.prototype.setStroke;
        
    shapeClass.prototype.setStroke = function() {
      var retVal = gfxSetStroke.apply(this, arguments);
      
      var node = this.rawNode, stroke = node && node.stroke, parent = this.getParent();
      if (stroke && parent) {
        var op = esri._isDefined(parent._esriIeOpacity) ? parent._esriIeOpacity : 1;
        stroke.opacity *= op;
      }
      
      return retVal;
    };

    var gfxSetFill = shapeClass.prototype.setFill;
    shapeClass.prototype.setFill = function() {
      var retVal = gfxSetFill.apply(this, arguments);
      
      var node = this.rawNode, fill = node && node.fill, parent = this.getParent();
      if (fill && parent) {
        var op = esri._isDefined(parent._esriIeOpacity) ? parent._esriIeOpacity : 1;
        
        if (fill.type === "tile") {
          dojo.style(node, "opacity", op);
        }
        else {
          fill.opacity *= op;
        }
      }
      
      return retVal;
    };
    
    /*// Note: We don't call setFill and setStroke for PictureMarkerSymbol 
    var imgCreate = dojox.gfx.Group.prototype.createImage;
    dojox.gfx.Group.prototype.createImage = function() {
      var retVal = imgCreate.apply(this, arguments);
      
      // TODO
      // Transforms applied to images is messing with opacity.
      // It's risky to mess with that part of GFX code
      var node = retVal.rawNode, parent = retVal.getParent();
      if (node && parent) {
        var op = esri._isDefined(parent._esriIeOpacity) ? parent._esriIeOpacity : 1;
        dojo.style(node, "opacity", op);
      }
      
      return retVal;
    };*/
  }); // end of add on load
} // if ie

dojo.declare("esri.layers._GraphicsContainer", null, {
    _setMap: function(map, divContainer) {
      var es, connects = (this._connects = []);

      this._map = map;
      
      if (dojox.gfx.renderer === "canvas") { // canvas
        es = dojo.create("div", { style: "overflow: visible; position: absolute;" }, divContainer);
        
        // faking a GFX surface object
        // map doesn't seem to use anything other than getEventSource at this point
        this._surface = {
          getEventSource: function() {
            return es;
          }
        };
        
        connects.push(dojo.connect(es, "onmousedown", this, this._canvasDownHandler));
        connects.push(dojo.connect(es, "onmouseup", this, this._canvasUpHandler));
        connects.push(dojo.connect(es, "onclick", this, this._canvasClickHandler));
        
        esri.layers._GraphicsLayer.prototype._canvas = true;
      }
      else {
        var surface = (this._surface = dojox.gfx.createSurface(divContainer, map.width, map.height));
        es = surface.getEventSource();
  
        dojo.style((es = esri.vml ? es.parentNode : es), { overflow:"visible", position:"absolute" }); //position:"relative" //position at v1.1
      }
      
      connects.push(dojo.connect(map, "onResize", this, "_onResizeHandler"));
      return es;
    },
    
    _onResizeHandler: function(extent, width, height) {
      var es = this._surface.getEventSource(), map = this._map, layer;
      
      if (esri.vml) {
        dojo.style((es = es.parentNode), { width:width + "px", height:height + "px", clip:"rect(0px " + width + "px " + height + "px 0px)" });
      }
      dojo.attr(es, "width", width);
      dojo.attr(es, "height", height);
      
      if (!this._surface.declaredClass) { // canvas
        dojo.forEach(es.childNodes, function(canvasNode) {
          dojo.attr(canvasNode, "width", width);
          dojo.attr(canvasNode, "height", height);
        });
      }
      
      if (map.loaded) {
        if (!map.graphics._suspended) {
          //console.log(map.graphics.id);
          map.graphics._resized = true;
        }
        
        dojo.forEach(map.graphicsLayerIds, function(layerId) {
          layer = map.getLayer(layerId);
          
          if (!layer._suspended) {
            //console.log(layerId);
            layer._resized = true;
          }
        });
      }

      // es.setAttribute("width", width);
      // es.setAttribute("height", height);
    },
    
    _cleanUp: function() {
      dojo.forEach(this._connects, dojo.disconnect, dojo);
      this._map = this._surface = null;
    },
    
    /**************************
     * Canvas specific methods
     **************************/
    
    _processEvent: function(evt) {
      var map = this._map;
      evt.screenPoint = new esri.geometry.Point(evt.pageX - map.position.x, evt.pageY - map.position.y);
      evt.mapPoint = map.toMap(evt.screenPoint);
    },
    
    _canvasDownHandler: function(evt) {
      this._processEvent(evt);
      this._downPt = evt.screenPoint.x + "," + evt.screenPoint.y;
    },
    
    _canvasUpHandler: function(evt) {
      this._processEvent(evt);
      this._upPt = evt.screenPoint.x + "," + evt.screenPoint.y;
    },
    
    _tolerance: 15, // pixels
    
    _canvasClickHandler: function(evt) {
      //console.log("Div click handler...", evt, this._downPt, this._upPt);
      if (!this._downPt || !this._upPt || this._downPt !== this._upPt) {
        return;
      }
      //console.log("clicked...");

      this._processEvent(evt);
      
      //Canvas hit-test implementation:
      var map = this._map;
      
      // get qualified graphics layers
      var layers = dojo.map(map.graphicsLayerIds, function(id) {
        return map.getLayer(id);
      });
      layers.push(map.graphics);
      layers.reverse();
      
      layers = dojo.filter(layers, function(layer) {
        return layer.loaded && layer._mouseEvents &&  layer.visible && (!esri._isDefined(layer.opacity) || layer.opacity > 0);
      });
      
//      dojo.forEach(layers, function(layer) {
//        console.log(layer.id);
//      });
      
      //1. Create an extent around the screenPoint where the user clicked
      var screenPoint = evt.screenPoint, geo = esri.geometry, tolerance = this._tolerance;
      var xmin = screenPoint.x - tolerance, ymin = screenPoint.y + tolerance;
      var xmax = screenPoint.x + tolerance, ymax = screenPoint.y - tolerance;
      var screenExtent = new geo.Extent(xmin, ymax, xmax, ymin);
      
      //2. Convert the above extent from screen coordinates to map coordinates.
      var bottomLeft = map.toMap(new geo.Point(xmin, ymin));
      var topRight = map.toMap(new geo.Point(xmax, ymax));
      var queryExtent = new geo.Extent(bottomLeft.x, bottomLeft.y, topRight.x, topRight.y);
      //map.graphics.add(new esri.Graphic(queryExtent, new esri.symbol.SimpleFillSymbol()));
      
      var match, touch = esri.isTouchEnabled;
      
      //3. Intersect the above query extent with the extents of all the graphics in the top-most graphics layer
      //4. If step 3 did not yield any result, repeat it with the next layer. If there are no layers left, go to step 6.
      dojo.some(layers, function(layer) {
        
        // a) Get a list of all graphics whose extent contains the clicked location. If there are none, go to step 4, else go to step 3.b.
        var primary = dojo.filter(layer.graphics, function(graphic) {
          var shape = graphic.getDojoShape();
          
          if (!graphic.visible || !shape) {
            return false;
          }
          
          var bbox = shape.getTransformedBoundingBox();
          //console.log(bbox);
          
          if (bbox) {
            var graphicExtent = new geo.Extent(bbox[0].x, bbox[0].y, bbox[2].x, bbox[2].y);
            return touch ? graphicExtent.intersects(screenExtent) : graphicExtent.contains(screenPoint);
          }
          else {
            // this is a multipoint graphic
            return dojo.some(shape.children || [], function(child) {
              bbox = child.getTransformedBoundingBox();
              //console.log(bbox);
              var graphicExtent = new geo.Extent(bbox[0].x, bbox[0].y, bbox[2].x, bbox[2].y);
              return touch ? graphicExtent.intersects(screenExtent) : graphicExtent.contains(screenPoint);
            });
          }
        }); // foreach
        
        if (primary.length > 0) {
          //console.log("Primary: ", primary);
          var secondary;
          
          // b) From the list obtained from 3.a, filter it further to find the list of graphics with geometry intersecting the query extent. If there are none, go to step 4, else go to step 3.c.
          dojo.some(primary, function(graphic) {
            //if (graphic.geometry.contains(mapPoint)) {
            if (graphic.geometry && queryExtent.intersects(graphic.geometry)) {
              // c) Pick the first matching graphic
              secondary = graphic;
              return true;
            }
            return false;
          }); // foreach
          
          if (secondary) {
            match = secondary;
            return true;
          }
        } // if primary
        
        return false;
      }); // some
      
      //5. Fire click event on the layer that contains the graphic found in step 3.c
      if (match) {
        var layer = match.getLayer();
        if (layer) {
          evt.graphic = match;
          layer.onClick(evt);
        }
      }
      
      //6. Done
    }
  }
);

dojo.declare("esri.layers._GraphicsLayer", esri.layers.Layer, {
    constructor: function(params) {
      // TODO
      // This is a hack!
      // This is really really ugly!
      // At Dojo 1.4, we have more control over how the constructor
      // chaining happens between subclass and super classes.
      // When we move to 1.4, we need to take advantage of that
      // and remove this ugly hack
      // REF: http://docs.dojocampus.org/dojo/declare#manual-constructor-chaining
      if (params && (dojo.isString(params) || (dojo.isObject(params) && params.layerDefinition) )) {
        params = arguments[1]; // assuming signature: (url, params) - ignore url - see FeatureLayer
      }
      
      this._params = dojo.mixin({ displayOnPan: true, drawMode: true }, params || {});
      this.infoTemplate = params && params.infoTemplate;

      this.graphics = [];
      this._init = false;
      this._suspended = false;

      this._draw = dojo.hitch(this, this._draw);
      this._refresh = dojo.hitch(this, this._refresh);
    },
    
    setDrawMode: function(/*Boolean*/ value) {
      this._params.drawMode = value;
    },
    
    renderer: null,

    _setMap: function(map, surface) {
      this._map = map;
      
      var mapSR = map.spatialReference;
      this._wrap = map.wrapAround180 /*&& mapSR._isWrappable()*/;
      this._srInfo = mapSR._getInfo();
      
      // multi-graphics v2

      if (!this._canvas) {
        this._div = surface.createGroup();
      }
      else { // canvas
        surface = dojox.gfx.createSurface(surface.getEventSource(), map.width, map.height);
        dojo.style(surface.rawNode, "position", "absolute");
        this._div = surface.createGroup();
        
        // GFX canvas renderer does not support events yet so the 
        // event source has been disabled at the GFX tier. But we
        // need to fake it so that existing code can live happily
        this._div.getEventSource = function() {
          return surface.rawNode;
        };
        
        // See also:
        // _canvasRender
        // dojox.gfx.canvas.Group::_render
        this._renderProto = this._div.constructor.prototype._render;
        this._div._render = dojo.hitch(this, this._canvasRender);
      }
      
      this._div.getEventSource().id = this.id + "_layer";
      
      this._enableAllConnectors();
      
      this._updateStatus();

      if (!this._suspended && map.extent && map.loaded === true) {
        this._onExtentChangeHandler(map.extent, null, null, null);
      }

      //this._visibilityChangeHandler(this.visible);
      
      var op = this.opacity;
      if (esri._isDefined(op) && op < 1) {
        this.setOpacity(op, true);
      }

      return this._div;
    },
    
    _unsetMap: function(map, surface) {
      dojo.forEach(this.graphics, function(g) {
        g._shape = null;
      });

      if (!this._canvas) {
        this._div.clear();
        surface.remove(this._div);
        dojo.destroy(this._div.getEventSource());
      }
      else { // canvas
        surface = this._div.getParent();
        
        // HACK
        // hack to prevent dojox.gfx.shape.Surface::destroy from destroying 
        // other graphics layers (canvases) in the graphics container
        surface._parent = {};
        
        dojo.destroy(surface.rawNode);
        surface.destroy();
      }
      this._map = this._div = null;
      this._init = false;
      this._disableAllConnectors();
    },

    _onZoomStartHandler: function() {
      esri.hide(this._div.getEventSource());
    },

    _onExtentChangeHandler: function(extent, delta, levelChange, lod) {
      if (levelChange || !this._init) {
        //summary: Redraw graphics on extent change
        var _mvr = this._map.__visibleRect, group = this._div;
        this._init = true;

        this._refresh(true);

        group.setTransform(dojox.gfx.matrix.translate({ x:_mvr.x, y:_mvr.y }));
        
        if (this._renderProto && group.surface.pendingRender) { // canvas
          this._dirty = true;
        }
        else {
          if (this.visible) {
            esri.show(group.getEventSource());
          }
        }
      }
      else if (this._resized) {
        // "this._resized" equals true indicates that this extent change event
        // is for an immediately preceding map resize event. 
        // Background: we no longer fire pan events when map is resized - as a
        // result of cleanup that occurred when adding support for css-transforms
        // So, we need to perform resize chore here - this is very similar to 
        // pan end chore.
        
        //console.log("resized... " + this.id);
        this._refresh(false);
        this._resized = false;
      }

      if (this.graphics.length > 0) {
        this.onUpdate();
      }
    },
    
    _canvasRender: function() {
      // This method is an override for dojox.gfx.canvas.Group::_render
      // to run "show" GraphicsLayer only after GFX has finished 
      // rendering the group (i.e. the children)
      
      var group = this._div;
      
      if (this._dirty) {
        //console.log("...dirty...", this.id);
        delete this._dirty;
        
        if (this.visible) {
          esri.show(group.getEventSource());
        }
      }
      
      return this._renderProto.apply(group, arguments);
    },

    _refresh: function(redraw) {
      var gs = this.graphics,
          il = gs.length, i,
          _draw = this._draw;

      for (i=0; i<il; i++) {
        _draw(gs[i], redraw);
      }
    },
    
    refresh: function() {
      this._refresh(true);
    },

    // displayOnPan = true (default)
    _onPanHandler: function(extent, delta) {
      this._panDx = delta.x;
      this._panDy = delta.y;

      var _mvr = this._map.__visibleRect;
      this._div.setTransform(dojox.gfx.matrix.translate({ x:_mvr.x + delta.x, y:_mvr.y + delta.y }));
    },

    _onPanEndUpdateHandler: function(extent, delta) {
      // It is possible that PAN (mousemove) handler is not fired for 
      // the mouse position at which this PAN END (mouseup) happened.
      // Graphics position will not be in sync with map unless we check
      // for this condition and call setTransform. So far, I/people have
      // seen this behavior only in Chrome.
      // See _onPanHandler for related changes
      if (!this._params._child && (delta.x !== this._panDx || delta.y !== this._panDy)) {
        var _mvr = this._map.__visibleRect;
        this._div.setTransform(dojox.gfx.matrix.translate({ x:_mvr.x, y:_mvr.y }));
      }
      
      this._refresh(false);
      if (this.graphics.length) {
        this.onUpdate();
      }
    },

    // displayOnPan = false
    _onPanStartHandler: function() {
      esri.hide(this._div.getEventSource());
    },

    _onPanEndHandler: function() {
      var _mvr = this._map.__visibleRect, group = this._div;
      group.setTransform(dojox.gfx.matrix.translate({ x:_mvr.x, y:_mvr.y }));
      
      this._refresh(false);
      
      if (this._renderProto && group.surface.pendingRender) {
        this._dirty = true;
      }
      else {
        esri.show(group.getEventSource());
      }
      //this._visibilityChangeHandler(this.visible);
      
      if (this.graphics.length) {
        this.onUpdate();
      }
    },
    
    _getDesiredStatus: function() {
      // Returns true if the layer should be alive, false otherwise
      return this.visible;
    },
    
    _updateStatus: function() {
      //console.log("update status...");
      // Put the layer in the desired status
      if (this._getDesiredStatus()) {
        if (this._suspended) {
          //console.log("resuming...");
          this._resume();
        }
      }
      else {
        if (!this._suspended) {
          //console.log("suspending...");
          this._suspend();
        }
      }
    },
    
    // Hide and be passive to map events
    _suspend: function() {
      this._suspended = true;
      esri.hide(this._div.getEventSource());
      this._disableDrawConnectors();
    },
    
    // Resume normal operations
    _resume: function() {
      var group = this._div;
      
      this._suspended = false;
      this._enableDrawConnectors();
      var _mvr = this._map.__visibleRect;
      group.setTransform(dojox.gfx.matrix.translate({ x:_mvr.x, y:_mvr.y }));
      this._refresh(true);
      
      //this._visibilityChangeHandler(this.visible);
      if (this._renderProto && group.surface.pendingRender) {
        this._dirty = true;
      }
      else {
        esri.show(group.getEventSource());
      }
    },
    
    // enable level 1 connectors
    // - when the layer is added to the map
    _enableAllConnectors: function() {
      this._disableAllConnectors();
      //this._cleanUp_connect = dojo.connect(this._map, "onUnload", this, "_cleanUp");
      this._onVisibilityChangeHandler_connect = dojo.connect(this, "onVisibilityChange", this, this._updateStatus);
      this._enableDrawConnectors();
    },
    
    // disable level 1 connectors
    // - when the layer is removed from the map
    // - when the layer is destroyed
    _disableAllConnectors: function() {
      this._disableDrawConnectors();
      //dojo.disconnect(this._cleanUp_connect);
      dojo.disconnect(this._onVisibilityChangeHandler_connect);
      this._onVisibilityChangeHandler_connect = null;
    },
    
    // enable level 2 connectors
    // - when the layer wants to internally turn itself ON
    _enableDrawConnectors: function() {
      var map = this._map, dc = dojo.connect;
      this._disableDrawConnectors();
      
      if (this._params.displayOnPan) {
        if (!this._params._child) { // see esri.layers._TrackManager:initialize for context
          this._onPanHandler_connect = dc(map, "onPan", this, "_onPanHandler");
        }
        this._onPanEndHandler_connect = dc(map, "onPanEnd", this, "_onPanEndUpdateHandler");
      }
      else {
        this._onPanStartHandler_connect = dc(map, "onPanStart", this, "_onPanStartHandler");
        this._onPanEndHandler_connect = dc(map, "onPanEnd", this, "_onPanEndHandler");
      }
      this._onZoomStartHandler_connect = dc(map, "onZoomStart", this, "_onZoomStartHandler");
      this._onExtentChangeHandler_connect = dc(map, "onExtentChange", this, "_onExtentChangeHandler");
    },
    
    // disable level 2 connectors
    // - when the layer wants to internally turn itself OFF
    _disableDrawConnectors: function() {
      var dd = dojo.disconnect;

      dd(this._onExtentChangeHandler_connect);
      dd(this._onZoomStartHandler_connect);
      dd(this._onPanHandler_connect);
      dd(this._onPanStartHandler_connect);
      dd(this._onPanEndHandler_connect);
      
      // Let's clear out the handles so that next time disableConnectors is called
      // right before enableConnectors, handle.remove (inside dojo.disconnect) will
      // not be called once more on the handle that is removed in "this" current call.
      // Obviously calling remove twice on the same handle leads to some funky
      // behavior (seen in Dojo 1.7).
      this._onExtentChangeHandler_connect = this._onZoomStartHandler_connect =
      this._onPanHandler_connect = this._onPanStartHandler_connect =
      this._onPanEndHandler_connect = null;
    },

    _updateExtent: function(graphic) {
      var geom = graphic.geometry, eg = esri.geometry;
      
      if (!geom) {
        graphic._extent = null;
        return;
      }
      
      var _e = (graphic._extent = geom.getExtent());
      if (! _e) {
        var x, y;
        if (geom instanceof eg.Point) {
          x = geom.x;
          y = geom.y;
        }
        else if (geom instanceof eg.Multipoint) {
          x = geom.points[0][0];
          y = geom.points[0][1];
        }
        else {
          //Extent not calculated for this type of geometry. All geometries should return an extent, what geometry type failed?
          //console.debug("Error condition: " + this.declaredClass + "._updateExtent(" + geom.type + ").");
          graphic._extent = null;
          return;
        }
        
        graphic._extent = new eg.Extent(x, y, x, y, geom.spatialReference);
      }
    },
    
    _intersects: function(map, extent, originOnly) {
      // "_originOnly" is an internal flag to draw this geometry only over its
      // originating frame. Used when drawing map's zoom box, 
      // and when drawing using extent tool.

      if (this._wrap && !originOnly) {
        var offsets = [], world = map._getFrameWidth(), info = this._srInfo,
            partsGE, mapExtent = map._clip ? map._getAvailExtent() : map.extent, 
            partsME = mapExtent._getParts(info),
            g, m, f, gl, ml, fl, gePart, mePart, filtered = [],
            partwise = extent._partwise;

        // If the geometry is a line or polygon, we need to
        // perform "partwise" extent comparison with map extent.
        // This will avoid a situation where a polygon split by
        // the 180deg and "moved" a little bit will result in
        // identical xmin and xmax (before calling normalizeCM),
        // thereby not repeated the right amount.
        // See Polygon/Polyline::getExtent for "_partwise" creation
        if (partwise && partwise.length) {
          partsGE = [];
          for (g = 0, gl = partwise.length; g < gl; g++ ) {
            partsGE = partsGE.concat(partwise[g]._getParts(info));
          }
        }
        else {
          partsGE = extent._getParts(info);
        }

        for (g = 0, gl = partsGE.length; g < gl; g++) {
          gePart = partsGE[g];
          
          for (m = 0, ml = partsME.length; m < ml; m++) {
            mePart = partsME[m];
            
            if (mePart.extent.intersects(gePart.extent)) {
              for (f = 0, fl = gePart.frameIds.length; f < fl; f++) {
                offsets.push( (mePart.frameIds[0] - gePart.frameIds[f]) * world );
              }
            }
          } // loop m
          
        } // loop g
        
        // remove duplicate offsets
        for (g = 0, gl = offsets.length; g < gl; g++) {
          f = offsets[g];
          if (dojo.indexOf(offsets, f) === g) {
            filtered.push(f);
          }
        }

        /*dojo.forEach(partsGE, function(gePart) {
          dojo.forEach(partsME, function(mePart) {
            if (mePart.extent.intersects(gePart.extent)) {
              dojo.forEach(gePart.frameIds, function(gFrame) {
                offsets.push( (mePart.frameIds[0] - gFrame) * world );
              });
            }
          });
        
          // remove duplicate offsets
          offsets = dojo.filter(offsets, function(offset, k) {
            return dojo.indexOf(offsets, offset) === k;
          });
          
          if (offsets.length === 2) {
            return true;
          }
          
          return false;
        });
        
        // remove duplicate offsets
        offsets = dojo.filter(offsets, function(offset, k) {
          return dojo.indexOf(offsets, offset) === k;
        });*/
        
        //console.log("offsets = ", filtered);
        return (filtered.length) ? filtered : null;
      }
      else {
        return map.extent.intersects(extent) ? [ 0 ] : null;
      }
    },
    
    _draw: function(graphic, redraw) {
      if (!this._params.drawMode || !this._map) {
        return;
      }
      
      try {
        // TODO
        // No extent indicates graphic with no geometry, we could
        // optimize this by combining it with _visible to create
        // a new variable that would answer "should I attempt to draw this graphic now?" 
        var extent = graphic._extent, offsets;
        // Do we really want to charge normal graphics with this check for an
        // uncommon scenario?
        
        if (graphic.visible && extent && (offsets = this._intersects(this._map, extent, graphic.geometry._originOnly))) {
          if (! graphic.getDojoShape() || redraw || offsets) {
            var type = graphic.geometry.type;
      
            if (type === "point") {
              this._drawMarker(graphic, offsets);
              this._symbolizeMarker(graphic);
            }
            else if (type === "multipoint") {
              this._drawMarkers(graphic, offsets);
              this._symbolizeMarkers(graphic);
            }
            else {
              this._drawShape(graphic, offsets);
              this._symbolizeShape(graphic);
            }
          }
        }
        else if (graphic.getDojoShape() /*|| ! graphic.visible*/) {
          this._removeShape(graphic);
        }
      }
      catch (err) {
        this._errorHandler(err, graphic);
      }
    },
    
    _removeShape: function(graphic) {
      var shape = graphic.getDojoShape();
      shape.removeShape();
      graphic._shape = null;
    },

    _drawShape: function(graphic, offsets) {
      var geometry = graphic.geometry,
          type = geometry.type,
          map = this._map,
          me = map.extent,
          mw = map.width,
          mh = map.height,
          eg = esri.geometry,
          _mvr = map.__visibleRect,
          paths = [], i, il;
 
      if (type === "rect" || type === "extent") {
        // TODO
        // Need to be able to duplicate rects/extents when wrapping
        // Will have to render them as polygons to do that, which means
        // may need clipping like polygons below.
        var rect;
        if (type === "extent") {
          rect = eg.toScreenGeometry(me, mw, mh, geometry);
          rect = { x:rect.xmin - _mvr.x + offsets[0], y:rect.ymax - _mvr.y, width:rect.getWidth(), height:rect.getHeight() };
        }
        else {
          var xy = eg.toScreenPoint(me, mw, mh, geometry),
              wh = eg.toScreenPoint(me, mw, mh, { x:geometry.x + geometry.width, y:geometry.y + geometry.height });
          rect = { x: xy.x - _mvr.x + offsets[0], y: xy.y - _mvr.y, width: wh.x - xy.x, height: xy.y - wh.y };
        }

        if (rect.width === 0) {
          rect.width = 1;
        }
        if (rect.height === 0) {
          rect.height = 1;
        }
        graphic._shape = this._drawRect(this._div, graphic.getDojoShape(), rect);
      }
      else if (type === "polyline" || type === "polygon") {
        for (i = 0, il = offsets.length; i < il; i++) {
          paths = paths.concat(eg._toScreenPath(me, mw, mh, geometry, -_mvr.x + offsets[i], -_mvr.y));
        }
        /*dojo.forEach(offsets, function(offset) {
          paths = paths.concat(eg._toScreenPath(me, mw, mh, geometry, -_mvr.x + offset, -_mvr.y));
        });*/
        
        graphic._shape = this._drawPath(this._div, graphic.getDojoShape(), paths);
        if (this._rendererLimits) {
          if (type === "polyline") {
            this._clipPolyline(graphic._shape, geometry);
          }
          else {
            this._clipPolygon(graphic._shape, geometry);
          }
        }
      }
      /*else if (type === "polygon") {
        graphic._shape = this._drawPath(this._div, graphic.getDojoShape(), eg._toScreenPath(me, mw, mh, geometry, -_mvr.x, -_mvr.y));
        if (this._rendererLimits) {
          this._clipPolygon(graphic._shape, geometry);
        }
      }*/
    },

    _drawRect: function(/*dojox.gfx.Surface/Group*/ container, /*dojox.gfx.Shape*/ shape, /*dojox.gfx.Rect*/ rect) {
      return shape ? shape.setShape(rect) : container.createRect(rect);
    },

    _drawImage: function(container, shape, image) {
      return shape ? shape.setShape(image) : container.createImage(image);
    },

    _drawCircle: function(container, shape, circle) {
      return shape ? shape.setShape(circle) : container.createCircle(circle);
    },

    _drawPath: (function() {
      if (esri.vml) {
        return function(container, shape, /*String[]*/ path) {
          if (shape) {
            return shape.setShape(path.join(" "));
          }
          else {
            var p = container.createObject(esri.gfx.Path, path.join(" "));
            container._overrideSize(p.getEventSource());
            return p;
          }
        };
      }
      else {
        return function(container, shape, /*String[]*/ path) {
          return shape ? shape.setShape(path.join(" ")) : container.createPath(path.join(" "));
        };
      }
    }()),

    _drawText: function(container, shape, text) {
      return shape ? shape.setShape(text) : container.createText(text);
    },

    //glyph
    // _drawGlyph: function(container, shape, text, symbol) {
    //   if (shape) {
    //     shape.removeShape();
    //   }
    // 
    //   var scale = 0.1,
    //       font = symbol.font,
    //       wd = font.getWidth(text.text, scale),
    //       ht = font.getLineHeight(scale),
    //       x = text.x - (wd/2),
    //       y = text.y - (ht/2),
    //       matrix = dojox.gfx.matrix;
    // 
    //   var glyph = symbol.font.draw(
    //     container.createGroup(),
    //     { text:text.text }, //, x:x, y:y
    //     { size:"10px" },
    //     symbol.getFill()
    //   );
    // 
    //   glyph.children[0].setTransform(
    //     dojox.gfx.matrix.multiply(
    //       matrix.translate(text.x, text.y),
    //       matrix.scale(scale),
    //       matrix.rotateg(-symbol.angle)
    //     )
    //   );
    // 
    //   // glyph.children[0].setTransform(
    //   //   dojox.gfx.matrix.multiply(
    //   //     // dojox.gfx.matrix.translate(-wd/2, -ht/2),
    //   //     dojox.gfx.matrix.scale(scale),
    //   //               dojox.gfx.matrix.rotategAt(-45, text.x, text.y)
    //   //   )
    //   // );
    // 
    //   // , dojox.gfx.matrix.rotateg(-45)
    //   // dojox.gfx.matrix.translate(x, y), 
    //   
    //   // glyph.children[0].setTransform(
    //   //   new dojox.gfx.Matrix2D([
    //   //     dojox.gfx.matrix.rotategAt(-45, x, y),
    //   //     dojox.gfx.matrix.scale(scale)
    //   //   ])
    //   // );
    //   
    //   return glyph;
    // },
    
    _getSymbol: function(graphic) {
      return graphic.symbol || (this.renderer ? this.renderer.getSymbol(graphic) : null) || null;
    },

    _symbolizeShape: function(graphic) {
      var symbol = this._getSymbol(graphic);
//      if (!symbol) {
//        return;
//      }
      
      var stroke = symbol._stroke,
          fill = symbol._fill;

      if (stroke === null || fill === null) {
        stroke = symbol.getStroke();
        fill = symbol.getFill();
      }

      graphic.getDojoShape().setStroke(stroke).setFill(fill);
      symbol._stroke = stroke;
      symbol._fill = fill;
    },
    
    _smsToPath: (function() {
      if (esri.vml) {
        return function(SMS, style, x, y, xMh, xPh, yMh, yPh, spikeSize) {
          switch (style) {
            case SMS.STYLE_SQUARE:
              return ["M", xMh + "," + yMh, "L", xPh + "," + yMh, xPh + "," + yPh, xMh + "," + yPh, "X", "E"];
            case SMS.STYLE_CROSS:
              return ["M", x + "," + yMh, "L", x + "," + yPh, "M", xMh + "," + y, "L", xPh + "," + y, "E"];
            case SMS.STYLE_X:
              return ["M", xMh + "," + yMh, "L", xPh + "," + yPh, "M", xMh + "," + yPh, "L", xPh + "," + yMh, "E"];
            case SMS.STYLE_DIAMOND:
              return ["M", x + "," + yMh, "L", xPh + "," + y, x + "," + yPh, xMh + "," + y, "X", "E"];
            case SMS.STYLE_TARGET:
              return [
                "M", xMh + "," + yMh, "L", xPh + "," + yMh, xPh + "," + yPh, xMh + "," + yPh, xMh + "," + yMh,
                "M", (xMh - spikeSize) + "," + y, "L", xMh + "," + y,
                "M", x + "," + (yMh - spikeSize), "L", x + "," + yMh,
                "M", (xPh + spikeSize) + "," + y, "L", xPh + "," + y,
                "M", x + "," + (yPh + spikeSize), "L", x + "," + yPh, 
                "E"
              ];
          }
        };
      }
      else {
        return function(SMS, style, x, y, xMh, xPh, yMh, yPh, spikeSize) {
          switch (style) {
            case SMS.STYLE_SQUARE:
              return ["M", xMh + "," + yMh, xPh + "," + yMh, xPh + "," + yPh, xMh + "," + yPh, "Z"];
            case SMS.STYLE_CROSS:
              return ["M", x + "," + yMh, x + "," + yPh, "M", xMh + "," + y, xPh + "," + y];
            case SMS.STYLE_X:
              return ["M", xMh + "," + yMh, xPh + "," + yPh, "M", xMh + "," + yPh, xPh + "," + yMh];
            case SMS.STYLE_DIAMOND:
              return ["M", x + "," + yMh, xPh + "," + y, x + "," + yPh, xMh + "," + y, "Z"];
            case SMS.STYLE_TARGET:
              return [
                "M", xMh + "," + yMh, xPh + "," + yMh, xPh + "," + yPh, xMh + "," + yPh, xMh + "," + yMh,
                "M", (xMh - spikeSize) + "," + y, xMh + "," + y,
                "M", x + "," + (yMh - spikeSize), x + "," + yMh,
                "M", (xPh + spikeSize) + "," + y, xPh + "," + y,
                "M", x + "," + (yPh + spikeSize), x + "," + yPh
              ];
          }
        };

        // return function(SMS, style, x, y, h) {
        //   switch (style) {
        //     case SMS.STYLE_SQUARE:
        //       return ["M", (x - h) + "," + (y - h), (x + h) + "," + (y - h), (x + h) + "," + (y + h), (x - h) + "," + (y + h), "Z"];
        //     case SMS.STYLE_CROSS:
        //       return ["M", x + "," + (y - h), x + "," + (y + h), "M", (x - h) + "," + y, (x + h) + "," + y];
        //     case SMS.STYLE_X:
        //       return ["M", (x - h) + "," + (y - h), (x + h) + "," + (y + h), "M", (x - h) + "," + (y + h), (x + h) + "," + (y - h)];
        //     case SMS.STYLE_DIAMOND:
        //       return ["M", x + "," + (y - h), (x + h) + "," + y, x + "," + (y + h), (x - h) + "," + y, "Z"];
        //   }
        // }
      }
    }()),
    
    _pathStyles: {
      "square": 1, "cross": 1, "x": 1, "diamond": 1, "target": 1
    },
    
    _typeMaps: {
      "picturemarkersymbol": "image",
      "textsymbol": "text"
    },
    
    _isInvalidShape: function(symbol, shape) {
      // GFX Shape Types: SMS (circle, path), PMS (image), TS(text)
      // SYM Type Styles: SMS (circle, square, cross, x, diamond, target), PMS, TS
      var shpType = shape && shape.shape && shape.shape.type, 
          symType = symbol && symbol.type, 
          symStyle = symbol && symbol.style;
      
      if (!symStyle) {
        if (symType) {
          symStyle = this._typeMaps[symType];
        }
      }
      else if (this._pathStyles[symStyle]) {
        symStyle = "path";
      }
      //console.log(shpType, symStyle);
      
      if (shpType && symStyle && (shpType !== symStyle)) {
        //console.info("Clear out...");
        return true;
      }
    },

    _drawPoint: function(container, geometry, symbol, _shape, offsets) {
//      if (!symbol) {
//        return;
//      }

      var type = symbol.type,
          map = this._map,
          _mvr = map.__visibleRect,
          point = esri.geometry.toScreenPoint(map.extent, map.width, map.height, geometry).offset(-_mvr.x + offsets[0], -_mvr.y),
          px = point.x,
          py = point.y,
          shape;

      if (this._isInvalidShape(symbol, _shape)) {
        // Remove existing shape if the new shape is incompatible
        // with it at the node level
        _shape.removeShape();
        _shape = null;
      }
      
      if (type === "simplemarkersymbol") {
        var style = symbol.style,
            half = symbol.size / 2,
            round = Math.round,
            SMS = esri.symbol.SimpleMarkerSymbol;

        switch (style) {
          case SMS.STYLE_SQUARE:
          case SMS.STYLE_CROSS:
          case SMS.STYLE_X:
          case SMS.STYLE_DIAMOND:
            shape = this._drawPath(container, _shape, this._smsToPath(SMS, style, px, py, round(px - half), round(px + half), round(py - half), round(py + half)));
            break;
          case SMS.STYLE_TARGET:
            var halfWidth = symbol._targetWidth / 2,
                halfHeight = symbol._targetHeight / 2;
            
            shape = this._drawPath(container, _shape, this._smsToPath(SMS, style, px, py, round(px - halfWidth), round(px + halfWidth), round(py - halfHeight), round(py + halfHeight), symbol._spikeSize));
            break;
          default:
            shape = this._drawCircle(container, _shape, {cx:px, cy:py, r:half});
        }

        // if (style === SMS.STYLE_CIRCLE) {
        //   shape = this._drawCircle(container, _shape, {cx:px, cy:py, r:half});
        // }
        // else {
        //   shape = this._drawPath(container, _shape, this._smsToPath(SMS, style, px, py, round(px - half), round(px + half), round(py - half), round(py + half)));
        // }
        
        // switch (symbol.style) {
        //   case SMS.STYLE_SQUARE:
        //     shape = this._drawPath(container, _shape, ["M", (px - half) + "," + (py - half), (px + half) + "," + (py - half), (px + half) + "," + (py + half), (px - half) + "," + (py + half), "Z"]);
        //     break;
        //   case SMS.STYLE_CROSS:
        //     shape = this._drawPath(container, _shape, ["M", px + "," + (py - half), px + "," + (py + half), "M", (px - half) + "," + py, (px + half) + "," + py]);
        //     break;
        //   case SMS.STYLE_X:
        //     shape = this._drawPath(container, _shape, ["M", (px - half) + "," + (py - half), (px + half) + "," + (py + half), "M", (px - half) + "," + (py + half), (px + half) + "," + (py - half)]);
        //     break;
        //   case SMS.STYLE_DIAMOND:
        //     shape = this._drawPath(container, _shape, ["M", px + "," + (py - half), (px + half) + "," + py, px + "," + (py + half), (px - half) + "," + py, "Z"]);
        //     break;
        //   default:
        //     shape = this._drawCircle(container, _shape, {cx:px, cy:py, r:half});
        // }
      }
      else if (type === "picturemarkersymbol") {
        var w = symbol.width,
            h = symbol.height;
        shape = this._drawImage(container, _shape, {x:px - (w/2), y:py - (h/2), width:w, height:h, src:symbol.url});
      }
      else if (type === "textsymbol") {
        shape = this._drawText(container, _shape, { type:"text", text:symbol.text, x:px, y:py, align:symbol.align, decoration:symbol.decoration, rotated:symbol.rotated, kerning:symbol.kerning });

        //glyph
        // var text = { type:"text", text:symbol.text, x:px, y:py, align:symbol.align, decoration:symbol.decoration, rotated:symbol.rotated, kerning:symbol.kerning };
        // if (symbol.font instanceof dojox.gfx.VectorFont) {
        //   shape = this._drawGlyph(this._div, _shape, text, symbol);
        // }
        // else {
        //   shape = this._drawText(this._div, _shape, text);
        // }
      }

      shape.setTransform(dojox.gfx.matrix.multiply(dojox.gfx.matrix.translate(symbol.xoffset, -symbol.yoffset), dojox.gfx.matrix.rotategAt(symbol.angle, point)));
      shape._wrapOffsets = offsets; // used by _VertexMover.js, _Box.js to figure out offset to use for ghost lines
      return shape;
    },

    _symbolizePoint: function(shape, symbol) {
//      if (!symbol) {
//        return;
//      }
      
      var type = symbol.type;
      if (type === "picturemarkersymbol") {
        return;
      }

      var stroke = symbol._stroke,
          fill = symbol._fill;

      if (type === "textsymbol") {
        shape.setFont(symbol.font).setFill(symbol.getFill());

        //glyph
        // if (! (symbol.font instanceof dojox.gfx.VectorFont)) {
        //   shape.setFont(symbol.font).setFill(symbol.getFill());
        // }
      }
      else {
        if (stroke === null || fill === null) {
          stroke = symbol.getStroke();
          fill = symbol.getFill();
        }

        if (type === "simplemarkersymbol") {
          shape.setFill(fill).setStroke(stroke);
        }

        symbol._stroke = stroke;
        symbol._fill = fill;
      }
    },

    _drawMarker: function(graphic, offsets) {
      graphic._shape = this._drawPoint(this._div, graphic.geometry, this._getSymbol(graphic), graphic.getDojoShape(), offsets);
    },

    _symbolizeMarker: function(graphic) {
      this._symbolizePoint(graphic.getDojoShape(), this._getSymbol(graphic));
    },

    _drawMarkers: function(graphic, offsets) {
      var geometry = graphic.geometry,
          points = geometry.points,
          symbol = this._getSymbol(graphic),
          group = graphic.getDojoShape() || this._div.createGroup(),
          point, i, il = points.length, temp = [], idx = 0,
          j, jl = offsets ? offsets.length : 0;

      if (group.children[0] && this._isInvalidShape(symbol, group.children[0])) {
        // Remove existing shapes in the group if the new symbol is incompatible
        // with it at the node level
        group.clear();
      }
          
      for (i = 0; i < il; i++) {
        point = points[i];
        
        for (j = 0; j < jl; j++) {
          temp[0] = offsets[j]; // optimization to avoid creating temp arrays
          this._drawPoint(group, { x:point[0], y:point[1] }, symbol, group.children[idx++], temp);
        }
      }
      
      var numChildren = group.children.length;
      if (il * offsets.length < numChildren) { // means one or more points have been removed from the multipoint geometry
        for (i = numChildren - 1; i >= il * offsets.length; i--) {
          group.children[i].removeShape();
        }
      }

      graphic._shape = group;
    },

    _symbolizeMarkers: function(graphic) {
      var symbol = this._getSymbol(graphic),
          group = graphic.getDojoShape(),
          children = group.children, i, il = children.length;
          
      for (i=0; i<il; i++) {
        this._symbolizePoint(children[i], symbol);
      }
    },

    _errorHandler: function(err, graphic) {
      var msg = esri.bundle.layers.graphics.drawingError;
      if (graphic) {
        err.message = msg +
          "(geometry:" + (graphic.geometry ? graphic.geometry.declaredClass : null) +
          ", symbol:" + (graphic.symbol ? graphic.symbol.declaredClass : null) + "): " +
          err.message;
      }
      else {
        err.message = msg + "(null): " + err.message;
      }
      this.inherited(arguments);
    },
    
    _rendererLimits: (function() {
      var clipLimit, rangeMin, rangeMax;
      // clipLimit - defines the boundary of the clipper
      // rangeXXX  - the min/max coordinate values beyond which renderers choke
      
      // TODO
      // Verify the need for this when using Canvas renderer
      
      // TODO
      // The following limits are obtained by trial and 
      // error using the test case at hand.
      // Why are clipLimit and  rangeXXX values not the same? 
      // Need confirmation
      // [Firefox]
      // http://groups.google.com/group/mozilla.dev.tech.svg/browse_thread/thread/4480e0e872c7f9aa#
      // https://bugzilla.mozilla.org/show_bug.cgi?id=539436
      // [Chrome]
      // http://code.google.com/p/chromium/issues/detail?id=35915
      if (dojo.isFF) {
        clipLimit = 16125;
        rangeMin = -32250;
        rangeMax = 32250;
      }
      else if (dojo.isIE < 9) {
        clipLimit = 100000; // 175000
        rangeMin = -100000; // -200000
        rangeMax = 100000; // 200000
      }
      else if (dojo.isChrome && dojo.isChrome < 6) {
        clipLimit = 8150;
        rangeMin = -10000;
        rangeMax = 10000;
      }
      //else {
        // Assumed Safari - no known renderer limits - no clipper
        // Or, Chrome 6.x
      //}
      
      if (clipLimit) {
        var clipBBox, clipSegments;
        
        // clipper boundary (browser specific)  
        // [ left, top, right, bottom ]
        clipBBox = [ -clipLimit, -clipLimit, clipLimit, clipLimit ];

        clipSegments = [
          [ [ -clipLimit, -clipLimit ], [ clipLimit, -clipLimit ] ], // topLeft -> topRight
          [ [ clipLimit, -clipLimit ],  [ clipLimit, clipLimit ] ], // topRight -> bottomRight
          [ [ clipLimit, clipLimit ],   [ -clipLimit, clipLimit ] ], // bottomRight -> bottomLeft
          [ [ -clipLimit, clipLimit ],  [ -clipLimit, -clipLimit ] ] // bottomLeft -> topLeft
        ];
        
        return {
          clipLimit: clipLimit,
          rangeMin: rangeMin,
          rangeMax: rangeMax,
          clipBBox: clipBBox,
          clipSegments: clipSegments
        };
      } // if clipLimit
    }()),
    
    /*_didPanBeyondLimits: function(transform) {
      var limits = this._rendererLimits;
      if (!limits) {
        return;
      }
      
      var isPointWithinRange = this._isPointWithinRange;
      return !isPointWithinRange({ x: transform.dx, y: transform.dy }, limits.rangeMin, limits.rangeMax);
    },*/
    
    _clipPolyline: function(shape, geometry) {
      //console.log("_clipPolyline");
      // clips the given polyline to a browser specific
      // boundary. We are not implementing this clipping logic in
      // esri.geometry._toScreenPath in order to avoid perf penalty 
      // for rendering normal graphics.
      
      var corners = this._getCorners(shape, geometry);
      var topLeft = corners.tl, bottomRight = corners.br; // extremes
      
      var limits = this._rendererLimits;
      var rangeMin = limits.rangeMin, rangeMax = limits.rangeMax, clipBBox = limits.clipBBox, clipSegments = limits.clipSegments;
      var isPointWithinRange = this._isPointWithinRange, isPointWithinBBox = this._isPointWithinBBox, getClipperIntersection = this._getClipperIntersection, getPlaneIndex = this._getPlaneIndex;

      if (!isPointWithinRange(topLeft, rangeMin, rangeMax) || 
          !isPointWithinRange(bottomRight, rangeMin, rangeMax)) {
        // Implies there is atleast one point in the shape
        // that is beyond the browser limits - Need to apply fix
        //console.log("manually clipping this shape: ", node);
        
        // A side-effect of esri.gfx.Path impl. We may be okay with the
        // perf penalty here as this code is reached only for graphics
        // that need the fix which imposes the overhead anyways.
        if (esri.vml) {
          //shape.segments = this._getPathsFromPathString(shape.getNode().path.v);
          this._createSegments(shape);
        }

        var outPaths = [];
        dojo.forEach(shape.segments, function(segment) {
          var inPath = segment.args, len = inPath.length, outPath = [], i;
          //console.log(dojo.toJson(inPath));
          for (i = 0; i < len; i +=2) {
            var pt1 = [ inPath[i], inPath[i+1] ];
            var pt2 = [ inPath[i+2], inPath[i+3] ];
            var inside1 = isPointWithinBBox(pt1, clipBBox);
            var inside2 = isPointWithinBBox(pt2, clipBBox);
            if (inside1 ^ inside2) {
              var intersection = getClipperIntersection([ pt1, pt2 ], clipSegments);
              if (intersection) {
                //console.log("points " + (pt1) + " and " + (pt2) + " intersect clip boundary!", intersection);
                if (!inside1) { // pt1 is outside the clip boundary
                  outPath.push(intersection[1], pt2);
                }
                else { // pt2 is outside the clip boundary
                  if (i) {
                    outPath.push(intersection[1]);
                  }
                  else {
                    outPath.push(pt1, intersection[1]);
                  }
                  outPaths.push(outPath);
                  outPath = [];
                }
              } // intersection
            } // if XOR
            else { // both points lie inside or outside the clipper
              if (inside1) { // both points are inside the clipper
                if (i) {
                  outPath.push(pt2);
                }
                else {
                  outPath.push(pt1, pt2);
                }
              }
              else { // both points lie outside the clipper
                var plane1 = getPlaneIndex(pt1, clipBBox);
                var plane2 = getPlaneIndex(pt2, clipBBox);
                //console.log("plane1,plane2: ", plane1, plane2);
                if (plane1 === -1 || plane2 === -1 || plane1 === plane2) {
                  continue;
                }

                var intersectionData = getClipperIntersection([ pt1, pt2 ], clipSegments, true);
                if (intersectionData.length > 0) {
                  //console.log("intersectionData[]: ", dojo.toJson(intersectionData));
                  
                  if (!intersectionData[plane1]) {
                    plane1 = intersectionData[plane1[0]] ? plane1[0] : plane1[1];
                  }
                  if (!intersectionData[plane2]) {
                    plane2 = intersectionData[plane2[0]] ? plane2[0] : plane2[1];
                  }
                  
                  var intPoint1 = intersectionData[plane1], intPoint2 = intersectionData[plane2];
                  if (intPoint1) {
                    outPath.push(intPoint1);
                  }
                  if (intPoint2) {
                    outPath.push(intPoint2);
                    outPaths.push(outPath);
                    outPath = [];
                  }
                } // intersectionData.length
              }
            } // if XOR
          } // for i
          
          //console.info("path after manual clipping: ", outPath);
          outPaths.push(outPath);
        });
        
        //console.info("shape after manual clipping: ", pathString);
        shape.setShape(this._getPathStringFromPaths(outPaths));
      } // if !isPointWithinRange
    },
    
    _clipPolygon: function(shape, geometry) {
      //console.log("_clipPolygon");
      var corners = this._getCorners(shape, geometry);
      var topLeft = corners.tl, bottomRight = corners.br; // extremes
      
      var limits = this._rendererLimits;
      var clipLimit = limits.clipLimit, rangeMin = limits.rangeMin, rangeMax = limits.rangeMax, clipBBox = limits.clipBBox, clipSegments = limits.clipSegments;
      var isPointWithinRange = this._isPointWithinRange, isPointWithinBBox = this._isPointWithinBBox, getClipperIntersection = this._getClipperIntersection, getPlaneIndex = this._getPlaneIndex, pointLineDistance = esri.geometry._pointLineDistance;

      if (!isPointWithinRange(topLeft, rangeMin, rangeMax) || 
          !isPointWithinRange(bottomRight, rangeMin, rangeMax)) {

        if (esri.vml) {
          //shape.segments = this._getPathsFromPathString(shape.getNode().path.v);
          this._createSegments(shape);
        }

        var outPaths = dojo.map(shape.segments, function(segment) {
          var inPath = segment.args, len = inPath.length, outPath = [], pathData = [], i;
          //console.log(dojo.toJson(inPath));
          for (i = 0; i < len; i +=2) {
            var pt1 = [ inPath[i], inPath[i+1] ];
            var pt2 = [ inPath[i+2], inPath[i+3] ];
            if (i === (len-2)) {
              outPath.push(pt1);
              break;
            }
            
            var inside1 = isPointWithinBBox(pt1, clipBBox);
            var inside2 = isPointWithinBBox(pt2, clipBBox);
            outPath.push(pt1);
            //console.log("layout ", inside1, inside2);
            
            if (inside1 ^ inside2) { // one is inside and the other is outside 
              var intersectionData = getClipperIntersection([ pt1, pt2 ], clipSegments);
              if (intersectionData) {
                //console.log("points " + pt1 + " and " + pt2 + " intersects clip boundary!", intersectionData);
                var point = intersectionData[1];
                point[inside1 ? "inOut" : "outIn"] = true;
                outPath.push(point);
                
                // [ inside-to-outside?, index of intersection point in the path, intersecting plane index ]
                pathData.push([ inside1 ? "INOUT" : "OUTIN", outPath.length - 1, intersectionData[0] ]);
              } // if intersection
            } // if XOR
            else {
              if (!inside1) { // both points lie outside one or more half planes
                //console.log("outside-outside: ", dojo.toJson(pt1), dojo.toJson(pt2));
                var plane1 = getPlaneIndex(pt1, clipBBox);
                var plane2 = getPlaneIndex(pt2, clipBBox);
                //console.log("plane1,plane2: ", plane1, plane2);
                if (plane1 === -1 || plane2 === -1 || plane1 === plane2) {
                  continue;
                }
                
                var intersectionData = getClipperIntersection([ pt1, pt2 ], clipSegments, true);
                if (intersectionData.length > 0) {
                  //console.log("intersectionData[]: ", dojo.toJson(intersectionData));
                  
                  if (!intersectionData[plane1]) {
                    plane1 = intersectionData[plane1[0]] ? plane1[0] : plane1[1];
                  }

                  if (!intersectionData[plane2]) {
                    plane2 = intersectionData[plane2[0]] ? plane2[0] : plane2[1];
                  }
                  
                  var intPoint1 = intersectionData[plane1], intPoint2 = intersectionData[plane2];
                  
                  if (intPoint1) {
                    intPoint1.outIn = true;
                    outPath.push(intPoint1);
                    pathData.push(["OUTIN", outPath.length - 1, plane1]);
                  }
                  
                  if (intPoint2) {
                    intPoint2.inOut = true;
                    outPath.push(intPoint2);
                    pathData.push(["INOUT", outPath.length - 1, plane2]);
                  }
                } // intersectionData.length
                else {
                  if (dojo.isArray(plane1) && dojo.isArray(plane2)) {
                    var planes = plane1.concat(plane2);
                    planes.sort();
                    if (planes.join("") === "0123") {
                      //console.log("[ special case... ]");
                      var candidates = [];
                      if ((plane1[0] + plane1[1]) === 3) { // tl <-> br
                        candidates.push([clipLimit, -clipLimit], [-clipLimit, clipLimit]);
                      }
                      else { // tr <-> bl
                        candidates.push([-clipLimit, -clipLimit], [clipLimit, clipLimit]);
                      }
                      var d1 = pointLineDistance(candidates[0], [pt1, pt2]);
                      var d2 = pointLineDistance(candidates[1], [pt1, pt2]);
                      outPath.push((d1 < d2) ? candidates[0] : candidates[1]);
                    } // join 
                  } // isArray
                }
              } // if !inside
            } // inside-inside or outside-outside
          } // for i
          //console.log("pathData: ", dojo.toJson(pathData));
          
          var xmin = clipBBox[0], ymin = clipBBox[1], xmax = clipBBox[2], ymax = clipBBox[3];
        
          // Half plane XMin
          dojo.forEach(outPath, function(point) {
            if (point[0] < xmin) {
              if (point[1] >= ymin && point[1] <= ymax) { // between ymin and ymax?
                point[0] = xmin; // project this point onto the half plane xmin
              }
              else {
                //point[2] = true; // mark this point for deletion
                point[0] = xmin;
                point[1] = point[1] < ymin ? ymin : ymax;
              }
            }
          });
          
          // Half plane YMin
          dojo.forEach(outPath, function(point) {
            if (point[1] < ymin) {
              if (point[0] >= xmin && point[0] <= xmax) { // between xmin and xmax?
                point[1] = ymin;
              }
              else {
                //point[2] = true;
                point[1] = ymin;
                point[0] = point[0] < xmin ? xmin : xmax;
              }
            }
          });
          
          // Half plane XMax
          dojo.forEach(outPath, function(point) {
            if (point[0] > xmax) {
              if (point[1] >= ymin && point[1] <= ymax) { // between ymin and ymax?
                point[0] = xmax;
              }
              else {
                //point[2] = true;
                point[0] = xmax;
                point[1] = point[1] < ymin ? ymin : ymax;
              }
            }
          });
          
          // Half plane YMax
          dojo.forEach(outPath, function(point) {
            if (point[1] > ymax) {
              if (point[0] >= xmin && point[0] <= xmax) { // between xmin and xmax?
                point[1] = ymax;
              }
              else {
                //point[2] = true;
                point[1] = ymax;
                point[0] = point[0] < xmin ? xmin : xmax;
              }
            }
          });
          
          //console.log("Before loop check: ", dojo.toJson(outPath));
          var k = 0, len = pathData.length;
          if (len > 0) {
            do {
              var curr = pathData[k];
              var next = pathData[(k + 1) % len];
              
              // remove superfluous points (loop anchored on a half plane outside the clipper )
              if (curr[2] === next[2] && curr[0] === "INOUT" && next[0] === "OUTIN") { // if inout -> outin on the same half plance
                var start = curr[1], end = next[1], u;
                if (start < end) {
                  // mark for deletion
                  for (u = start + 1; u < end; u++) {
                    outPath[u][2] = true;
                  }
                }
                else if (start > end) {
                  // mark for deletion
                  for (u = start + 1; u < outPath.length; u++) {
                    outPath[u][2] = true;
                  }
                  for (u = 0; u < end; u++) {
                    outPath[u][2] = true;
                  }
                }
              }
              
              k = (k + 1) % len;
            } while (k !== 0);
          }
          //console.log("After loop check: ", dojo.toJson(outPath));
          
          // preprocess before deleting marked points
          var first = outPath[0], last = outPath[outPath.length - 1];
          if (first[2]) { // the first point is marked for removal
            last[2] = true; // mark its buddy (the last point) as well
            
            // if the point at index 1 is an intersection point,
            // add it to the end of the path as well to close the path
            dojo.some(pathData, function(data) {
              if (data[1] === 1) {
                outPath.splice(outPath.length - 1, 0, dojo.clone(outPath[1]));
                return true;
              }
              return false;
            });
          }

          // remove points marked for deletion
          outPath = dojo.filter(outPath, function(point) {
            return point[2] ? false : true;
          });
          //console.log("After deleting marked points: ", dojo.toJson(outPath));
          
          // remove consecutive identical points
          for (k = 0; k < outPath.length - 1; k++) {
            var now = outPath[k];
            var next = outPath[k + 1];
            if (!next || (now[0] !== next[0]) || (now[1] !== next[1])) {
              continue;
            }
            
            if (next.outIn) {
              now.outIn = true;
            }
            else if (next.inOut) {
              now.inOut = true;
            }
            
            outPath.splice(k + 1, 1);
          }
          //console.log("After deleting consecutive identical points: ", dojo.toJson(outPath));
          
          // add corners of the clipper if they're engulfed
          var abs = Math.abs, cornerPointsData = [];
          for (k = 0; k < outPath.length - 1; k++) {
            var curr = outPath[k], cx = curr[0], cy = curr[1];
            var x1 = (abs(cx) === clipLimit);
            var y1 = (abs(cy) === clipLimit);
            var next = outPath[k + 1], nx = next[0], ny = next[1];
            var x2 = (abs(nx) === clipLimit);
            var y2 = (abs(ny) === clipLimit);
            
            if (x1 && y2) {
              cornerPointsData.push([ k + 1, [ cx, ny ] ]);
            }
            else if (y1 && x2) {
              cornerPointsData.push([ k + 1, [ nx, cy ] ]);
            }
          }
          //console.log("cornerPointsData: ", dojo.toJson(cornerPointsData));
          
          for (k = cornerPointsData.length - 1; k >= 0; k--) {
            var data = cornerPointsData[k];
            var prev = outPath[data[0]-1];
            var now = outPath[data[0]];
            /*if (outPath[data[0]-1].outIn && outPath[data[0]].inOut) {
              continue;
            }*/
            if (prev.outIn || prev.inOut || now.outIn || now.inOut) {
              continue;
            }
            outPath.splice(data[0], 0, data[1]);
          }
          
          // check if the path is closed
          var first = outPath[0], last = outPath[outPath.length - 1];
          if (first[0] !== last[0] || first[1] !== last[1]) {
            outPath.push(first);
          }
          
          //console.info("path after manual clipping: ", dojo.toJson(outPath));
          return outPath;
        }); // dojo.map(myPath.segments)
        
        //console.info("shape after manual clipping: ", dojo.toJson(outPaths));
        shape.setShape(this._getPathStringFromPaths(outPaths));
      } // if !isPointWithinRange
    },
    
    _getCorners: function(shape, geometry) {
      if (esri.vml) {
        // Typically we would just call shape.getTransformedBoundingBox(),
        // but the esri.gfx.Path impl for IE prevents GFX from getting the 
        // the necessary data to do this calculation.
        // Ref: https://support.sitepen.com/issues/64
        /*var box = dojo.contentBox(shape.getNode());
        var left = geometry._screenLeft, top = geometry._screenTop;
        //console.log(dojo.toJson(topLeft), dojo.toJson(bottomRight), node.path.v);
        return {
          tl: { x: left, y: top }, 
          br: { x: left + box.w, y: top + box.h }
        };*/

        var map = this._map;
        var extent = geometry.getExtent();
        var topLeft = map.toScreen(new esri.geometry.Point(extent.xmin, extent.ymax));
        var bottomRight = map.toScreen(new esri.geometry.Point(extent.xmax, extent.ymin));
        return {
          tl: topLeft, 
          br: bottomRight
        };
        
        // Ideally you'd want to use dojo.coords like below. But
        // unfortunately calling coords messes up the positioning of
        // paths in IE by a small amount (gets corrected on map pan). 
        // This is puzzling because coords is supposed to do read 
        // operations only.
        /*var coords = dojo.coords(shape.getEventSource());
        topLeft = { x: coords.x, y: coords.y };
        bottomRight = { x: coords.x + coords.w, y: coords.y + coords.h };*/
      }
      else {
        var shpBBox = shape.getTransformedBoundingBox();
        //console.log(dojo.toJson(shpBBox));
        return { tl: shpBBox[0], br: shpBBox[2] };
      }
    },
    
    _createSegments: function(shape) {
      // See dojox/gfx/path.js::setShape method for 
      // more information and context
      shape.shape.path = shape.vmlPath;
      shape.segmented = false;
      shape._confirmSegmented();
      
      var segments = shape.segments;
      if (segments.length > 1) {
        shape.segments = dojo.filter(segments, function(segment, idx, arr) {
          var next = arr[idx + 1];
          if (segment.action === "M" && next && next.action === "L") {
            segment.args = segment.args.concat(next.args);
            return true;
          }
          return false;
        });
      }
    },
    
    /*_getPathsFromPathString: function(pathString) {
      var paths = pathString.replace(/[\ e]/g, "").split("m");
      paths.shift();
      return dojo.map(paths, function(pathStr) {
        var coords = pathStr.replace(/l/g, ",").split(",");
        return {
          action: "M",
          args: dojo.map(coords, function(coord) {
            return parseInt(coord, 10);
          })
        };
      }); // map
    },*/
    
    _getPathStringFromPaths: function(paths) {
      if (esri.vml) { // path spec for VML
        paths = dojo.map(paths, function(path) {
          var newPath = dojo.map(path, function(point, idx) {
            return (idx === 1 ? "l " : "") + point.join(",");
          });
          return "m " + newPath.join(" ");
        });
        paths.push("e");
      }
      else {
        paths = dojo.map(paths, function(path) {
          var newPath = dojo.map(path, function(point) {
            return point.join(",");
          });
          return "M " + newPath.join(" ");
        });
      }
      return paths.join(" ");
    },

    _isPointWithinBBox: function(point, bbox) {
      var left = bbox[0], top = bbox[1];
      var right = bbox[2], bottom = bbox[3];
      var x = point[0], y = point[1];
      //if (x >= left && x <= right && y >= top && y <= bottom) {
      if (x > left && x < right && y > top && y < bottom) {
        return true;
      }
      else {
        return false;
      }
    },
    
    _isPointWithinRange: function(point, rangeMin, rangeMax) {
      var x = point.x, y = point.y;
      if (x < rangeMin || y < rangeMin || x > rangeMax || y > rangeMax) {
        return false;
      }
      else {
        return true;
      }
    },
    
    _getClipperIntersection: function(line, clipSegments, processAllHalfPlanes) {
      var i, check = esri.geometry._getLineIntersection2, round = Math.round, data = { length: 0 };
      for (i = 0; i < 4; i++) {
        var intersection = check(line, clipSegments[i]);
        if (intersection) {
          intersection[0] = round(intersection[0]);
          intersection[1] = round(intersection[1]);
          if (!processAllHalfPlanes) {
            return [ i, intersection ];
          }
          else {
            data[i] = intersection;
            data.length++;
          }
        } // if intersection
      }
      return processAllHalfPlanes ? data : null;
    },
    
    _getPlaneIndex: function(point, clipBBox) {
      var px = point[0], py = point[1], xmin = clipBBox[0], ymin = clipBBox[1], xmax = clipBBox[2], ymax = clipBBox[3];
      
      if (px <= xmin) { // xmin
        if ((py >= ymin) && (py <= ymax)) {
          return 3;
        }
        else {
          return (py < ymin) ? [0,3] : [2,3];
        }
      }
      
      if (py <= ymin) { // ymin
        if ((px >= xmin) && (px <= xmax)) {
          return 0;
        }
        else {
          return (px < xmin) ? [3,0] : [1,0];
        }
      }
      
      if (px >= xmax) { // xmax
        if ((py >= ymin) && (py <= ymax)) {
          return 1;
        }
        else {
          return (py < ymin) ? [0,1] : [2,1];
        }
      }
      
      if (py >= ymax) { // ymax
        if ((px >= xmin) && (px <= xmax)) {
          return 2;
        }
        else {
          return (px < xmin) ? [3,2] : [1,2];
        }
      }
      
      return -1;
    },

    //PUBLIC METHODS
    //Events
    onGraphicAdd: function() {
      //summary: Event fired when graphic is added to layer
      // arguments[0]: esri.Graphic: Added graphic feature
    },

    onGraphicRemove: function() {
      //summary: Event fired when graphic is removed from layer
      // arguments[0]: esri.Graphic: Removed graphic feature
    },

    onGraphicsClear: function() {
      //summary: Event fired when all graphics are removed from layer
    },
    
    onOpacityChange: function() {
      // arguments[0]: Number: current opacity
    },
  
    setInfoTemplate: function(newTemplate) {
      this.infoTemplate = newTemplate;
    },

    add: function(graphic) {
      //summary: Add a graphic object onto this layer
      // graphic: esri.Graphic: Graphic to be added. If graphic already contained
      //          in collection, returns the previously added graphic and does not
      //          redraw.
      //    returns: esri.Graphic: Added graphic or previously added graphic
      var silent = arguments[1];

      /*if ((i = dojo.indexOf(this.graphics, graphic)) !== -1) {
        return this.graphics[i];
      }*/
     
      if (graphic._graphicsLayer === this) {
        return graphic;
      }

      if (! silent) {
        this.graphics.push(graphic);
      }

      graphic._graphicsLayer = this;
      this._updateExtent(graphic);
      this._draw(graphic);
      if (! silent) {
        this.onGraphicAdd(graphic);
      }
      return graphic;
    },

    remove: function(graphic) {
      //summary: Remove argument graphic from this layer
      // g: esri.Graphic: Graphic to be removed
      //    returns: esri.Graphic: Removed graphic object
      // var silent = arguments[1];

      if (! arguments[1]) {
        var graphics = this.graphics,
            i;
        if ((i = dojo.indexOf(graphics, graphic)) === -1) {
          return null;
        }
        
        graphic = this.graphics.splice(i, 1)[0];
      }

      if (graphic.getDojoShape()) {
        this._removeShape(graphic);
      }
      graphic._shape = graphic._graphicsLayer = null;

      this.onGraphicRemove(graphic);
      return graphic;
    },

    clear: function() {
      //summary: Remove all graphics from this layer
      var silent = arguments[1],
          g = this.graphics;
      
      while (g.length > 0) {
        this.remove(g[0]);
      }

      if (! silent) {
        this.onGraphicsClear();
      }
    },
    
    setOpacity: function(op, _init) {
      if (_init || this.opacity != op) { // is there a change in opacity?
      
        var div = this._div;
        if (div) {
          if (esri.vml) { // IE
          
            dojo.forEach(this.graphics, function(graphic) {
              var shape = graphic._shape;
              var node = shape && shape.getNode();
              if (node) {
                var strokeStyle = shape.strokeStyle, stroke = node.stroke;
                if (strokeStyle && stroke) {
                  stroke.opacity = strokeStyle.color.a * op;
                } // stroke
                
                var fillStyle = shape.fillStyle, fill = node.fill;
                if (fillStyle && fill) {
                  if (fill.type === "tile") {
                    dojo.style(node, "opacity", op);
                  }
                  else {
                    fill.opacity = fillStyle.a * op;
                  }
                } // fill
                
                /*if (shape.declaredClass === "dojox.gfx.Image") {
                  dojo.style(node, "opacity", op);
                }*/
                
              } // if node
            }); // loop end
            
            div._esriIeOpacity = op;
          } // if IE
          
          else if (this._canvas) { // canvas
            dojo.style(div.getEventSource(), "opacity", op);
          }
          
          else { // SVG
            //dojo.style(div.getEventSource(), "opacity", op);
            div.getEventSource().setAttribute("opacity", op);
            
            // Ref:
            // http://www.w3.org/TR/SVG/masking.html#OpacityProperty
          }
        } // if div
        
        this.opacity = op;
        
        if (!_init) {
          this.onOpacityChange(op);
        }
      } // if
    },
    
    setRenderer: function(ren) {
      this.renderer = ren;
    }
  }
);

dojo.declare("esri.layers.GraphicsLayer", esri.layers._GraphicsLayer, {
    constructor: function() {
      this.enableMouseEvents = dojo.hitch(this, this.enableMouseEvents);
      this.disableMouseEvents = dojo.hitch(this, this.disableMouseEvents);
      this._processEvent = dojo.hitch(this, this._processEvent);

      this._initLayer();
    },
    
    _initLayer: function() {
      this.loaded = true;
      this.onLoad(this);
    },
    
    _setMap: function() {
      var d = this.inherited("_setMap", arguments);
      this.enableMouseEvents();
      return d;
    },
    
    _unsetMap: function() {
      this.disableMouseEvents();
      this.inherited("_unsetMap", arguments);
    },

    //mouse event handling
    _processEvent: function(/*Event*/ evt) {
      //summary: Get XY coordinates of event
      // returns: esri.geometry.Point: Screen point
      var _m = this._map,
          g = this.graphics,
          gl = g.length;
      evt.screenPoint = new esri.geometry.Point(evt.pageX - _m.position.x, evt.pageY - _m.position.y);
      evt.mapPoint = _m.toMap(evt.screenPoint);

      var i, es, gr, ds,
          target = evt.target,
          targetParent = target.parentNode;
      for (i=0; i<gl; i++) {
        gr = g[i];
        ds = gr.getDojoShape();
        if (ds) {
          es = ds.getEventSource();
          if (es === target || es === targetParent) {
            evt.graphic = gr;
            return evt;
          }
        }
      }
    },

    _onMouseOverHandler: function(/*Event*/ evt) {
      if (this._processEvent(evt)) {
        this.onMouseOver(evt);
      }
    },

    _onMouseMoveHandler: function(/*Event*/ evt) {
      if (this._processEvent(evt)) {
        this.onMouseMove(evt);
      }
    },
    
    _onMouseDragHandler: function(/*Event*/ evt) {
      if (this._processEvent(evt)) {
        this.onMouseDrag(evt);
      }
    },

    _onMouseOutHandler: function(/*Event*/ evt) {
      if (this._processEvent(evt)) {
        this.onMouseOut(evt);
      }
    },

    _onMouseDownHandler: function(/*Event*/ evt) {
      this._downGr = this._downPt = null;
      if (this._processEvent(evt)) {
        dojo.disconnect(this._onmousemove_connect);
        dojo.disconnect(this._onmousedrag_connect);
        this._onmousedrag_connect = dojo.connect(this._div.getEventSource(), "onmousemove", this, "_onMouseDragHandler");
        this._downGr = evt.graphic;
        this._downPt = evt.screenPoint.x + "," + evt.screenPoint.y;
        this.onMouseDown(evt);
      }
    },

    _onMouseUpHandler: function(/*Event*/ evt) {
      this._upGr = this._upPt = null;
      if (this._processEvent(evt)) {
        dojo.disconnect(this._onmousedrag_connect);
        dojo.disconnect(this._onmousemove_connect);
        this._onmousemove_connect = dojo.connect(this._div.getEventSource(), "onmousemove", this, "_onMouseMoveHandler");
        this._upGr = evt.graphic;
        this._upPt = evt.screenPoint.x + "," + evt.screenPoint.y;
        this.onMouseUp(evt);
      }
    },

    _onClickHandler: function(/*Event*/ evt) {
      if (this._processEvent(evt)) {
        var downGr = this._downGr, upGr = this._upGr;
        if (downGr && upGr && downGr === upGr && this._downPt === this._upPt) {
          // Click is perceived as MouseDown followed by MouseUp on the same graphic
          // where the Down and Up happened on the same screen location
          // We are not bothered about the graphic/location for the click event
          // as a click on a different graphic/location cannot happen without the
          // corresponding MouseDown and MouseUp events.
          // Do we really need this click handler then? We could infer click from within
          // the mouse up handler itself.
          
          // In non-IE browsers, "graphic" property attached to the event object
          // (by _processEvt method) is seen by map click handlers. This workaround 
          // will do the same in IE. Having the clicked graphic available to map
          // onClick handlers will simplify listening to click event on multiple
          // graphics layers. The alternative would be to register click event 
          // listeners for each graphics layer (or) provide a static GraphicsLayer
          // event named "onClick". We still MAY NOT want to announce it to the public that:
          // "listen to map onClick and if the event argument has a "graphic" property
          // that means the click happened on a graphic"
          // See also: _MapContainer::_fireClickEvent method
          if (dojo.isIE < 9) {
            esri.layers.GraphicsLayer._clicked = evt.graphic;
          }

          this.onClick(evt);
        }
      }
    },
    
    _onDblClickHandler: function(/*Event*/ evt) {
      if (this._processEvent(evt)) {
        this.onDblClick(evt);
      }
    },

    //Mouse event
    onMouseOver: function() {
      //summary: Mouse enters graphic
      // arguments[0]: Event: Mouse event
      //             : Event.screenPoint: Screen coordinates, wrt map's top-left
      //             : Event.mapPoint: Map coordinates
      //             : Event.graphic: Target graphic triggering event
    },

    onMouseMove: function() {
      //summary: Mouse move over graphic
      // arguments[0]: Event: Mouse event
      //             : Event.screenPoint: Screen coordinates, wrt map's top-left
      //             : Event.mapPoint: Map coordinates
      //             : Event.graphic: Target graphic triggering event
    },

    onMouseDrag: function() {
      //summary: Mouse move over graphic
      // arguments[0]: Event: Mouse event
      //             : Event.screenPoint: Screen coordinates, wrt map's top-left
      //             : Event.mapPoint: Map coordinates
      //             : Event.graphic: Target graphic triggering event
    },

    onMouseOut: function() {
      //summary: Mouse exits graphic
      // arguments[0]: Event: Mouse event
      //             : Event.screenPoint: Screen coordinates, wrt map's top-left
      //             : Event.mapPoint: Map coordinates
      //             : Event.graphic: Target graphic triggering event
    },

    onMouseDown: function() {
      //summary: Mouse is pressed on a graphic
      // arguments[0]: Event: Mouse event
      //             : Event.screenPoint: Screen coordinates, wrt map's top-left
      //             : Event.mapPoint: Map coordinates
      //             : Event.graphic: Target graphic triggering event
    },

    onMouseUp: function() {
      //summary: Mouse is released on a graphic
      // arguments[0]: Event: Mouse event
      //             : Event.screenPoint: Screen coordinates, wrt map's top-left
      //             : Event.mapPoint: Map coordinates
      //             : Event.graphic: Target graphic triggering event
    },

    onClick: function() {
      //summary: Mouse clicked on graphic
      // arguments[0]: Event: Mouse event
      //             : Event.screenPoint: Screen coordinates, wrt map's top-left
      //             : Event.mapPoint: Map coordinates
      //             : Event.graphic: Target graphic triggering event
    },

    onDblClick: function() {
      //summary: Mouse double clicked on a graphic
      // arguments[0]: Event: Mouse event
      //             : Event.screenPoint: Screen coordinates, wrt map's top-left
      //             : Event.mapPoint: Map coordinates
      //             : Event.graphic: Target graphic triggering event
    },

    enableMouseEvents: function() {
      if (this._mouseEvents) {
        return;
      }

      var dc = dojo.connect,
          gc = this._div.getEventSource();
          
      if (dojox.gfx.renderer !== "canvas") { // canvas
        this._onmouseover_connect =  dc(gc, "onmouseover", this, "_onMouseOverHandler");
        this._onmousemove_connect = dc(gc, "onmousemove", this, "_onMouseMoveHandler");
        this._onmouseout_connect = dc(gc, "onmouseout", this, "_onMouseOutHandler");
        this._onmousedown_connect = dc(gc, "onmousedown", this, "_onMouseDownHandler");
        this._onmouseup_connect = dc(gc, "onmouseup", this, "_onMouseUpHandler");
        this._onclick_connect = dc(gc, "onclick",  this, "_onClickHandler");
        this._ondblclick_connect = dc(gc, "ondblclick",  this, "_onDblClickHandler");
      }
      this._mouseEvents = true;
    },

    disableMouseEvents: function() {
      if (! this._mouseEvents) {
        return;
      }

      var ddc = dojo.disconnect;
      ddc(this._onmouseover_connect);
      ddc(this._onmousemove_connect);
      ddc(this._onmousedrag_connect);
      ddc(this._onmouseout_connect);
      ddc(this._onmousedown_connect);
      ddc(this._onmouseup_connect);
      ddc(this._onclick_connect);
      ddc(this._ondblclick_connect);
      this._mouseEvents = false;
    }
  }
);
});
