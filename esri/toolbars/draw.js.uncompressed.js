//>>built
// wrapped by build app
define("esri/toolbars/draw", ["dijit","dojo","dojox","dojo/require!esri/toolbars/_toolbar,esri/geometry,esri/symbol,esri/utils"], function(dijit,dojo,dojox){
dojo.provide("esri.toolbars.draw");

dojo.require("esri.toolbars._toolbar");
dojo.require("esri.geometry");
dojo.require("esri.symbol");
dojo.require("esri.utils");

dojo.declare("esri.toolbars.Draw", esri.toolbars._Toolbar, {
    constructor: function(/*esri.Map*/ map,  /*Object?*/ options) {
      //summary: Create a new toolbar to draw geometries (point, line,
      //         rect, polyline, polygon, circle, oval) on a map.
      this.markerSymbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_SOLID, 10, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255,0,0]), 2), new dojo.Color([0,0,0,0.25]));
      this.lineSymbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255,0,0]), 2);
      this.fillSymbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255,0,0]), 2), new dojo.Color([0,0,0,0.25]));

      this._points = [];
      
      // default options
      this._defaultOptions = {
          showTooltips: true,
          drawTime  : 75,
          tolerance : 8,
          tooltipOffset: 15         
      };
      
      this._options = dojo.mixin(dojo.mixin({}, this._defaultOptions), options || {});
      
      // disable tooltip on touch devices
      if (esri.isTouchEnabled) {
        this._options.showTooltips = false;
      }
                       
      this._onKeyDownHandler = dojo.hitch(this, this._onKeyDownHandler);
      this._onMouseDownHandler = dojo.hitch(this, this._onMouseDownHandler);
      this._onMouseUpHandler = dojo.hitch(this, this._onMouseUpHandler);
      this._onClickHandler = dojo.hitch(this, this._onClickHandler);
      this._onMouseMoveHandler = dojo.hitch(this, this._onMouseMoveHandler);
      this._onMouseDragHandler = dojo.hitch(this, this._onMouseDragHandler);
      this._onDblClickHandler = dojo.hitch(this, this._onDblClickHandler);
      this._updateTooltip = dojo.hitch(this, this._updateTooltip);
      this._hideTooltip = dojo.hitch(this, this._hideTooltip);
      this._redrawGraphic = dojo.hitch(this, this._redrawGraphic);
    },

    _geometryType: null,
    respectDrawingVertexOrder: false,

    setRespectDrawingVertexOrder: function(set) {
      this.respectDrawingVertexOrder = set;
    },

    setMarkerSymbol: function(markerSymbol) {
      this.markerSymbol = markerSymbol;
    },

    setLineSymbol: function(lineSymbol) {
      this.lineSymbol = lineSymbol;
    },

    setFillSymbol: function(fillSymbol) {
      this.fillSymbol = fillSymbol;
    },

    activate: function(/*String*/ geometryType, /*Object?*/ options) {
      //summary: Activates tool to draw geometry
      // geometry: String: Geometry type to be drawn (esri.toolbar.Draw.GEOMETRIES.<type>)
      // symbol?: esri.symbol.Symbol: Symbology to be used to draw geometry
      if (this._geometryType) {
        this.deactivate();
      }

      var map = this.map,
          dc = dojo.connect,
          Draw = esri.toolbars.Draw;
          
      this._options = dojo.mixin(dojo.mixin({}, this._options), options || {});       
      map.__resetClickDuration();

      switch (geometryType) {
        case Draw.POINT:
        case Draw.ARROW:
        case Draw.LEFT_ARROW:
        case Draw.RIGHT_ARROW:
        case Draw.UP_ARROW:
        case Draw.DOWN_ARROW:		
        case Draw.TRIANGLE:
        case Draw.CIRCLE:
        case Draw.ELLIPSE:
        case Draw.RECTANGLE:
          this._onClickHandler_connect = dc(map, "onClick", this._onClickHandler);
          break;
          
        case Draw.LINE:
        case Draw.EXTENT:
        case Draw.FREEHAND_POLYLINE:
        case Draw.FREEHAND_POLYGON:
          this._deactivateMapTools(true, false, false, true);
          this._onMouseDownHandler_connect = dc(map, esri.isTouchEnabled ? "onTouchStart" : "onMouseDown", this._onMouseDownHandler);
          this._onMouseDragHandler_connect = dc(map, esri.isTouchEnabled ? "onTouchMove" : "onMouseDrag", this._onMouseDragHandler);
          this._onMouseUpHandler_connect = dc(map, esri.isTouchEnabled ? "onTouchEnd" : "onMouseUp", this._onMouseUpHandler);
          break;
          
        case Draw.POLYLINE:
        case Draw.POLYGON:
        case Draw.MULTI_POINT:
          map.__setClickDuration(0);
          this._onClickHandler_connect = dc(map, "onClick", this._onClickHandler);
          this._onDblClickHandler_connect = dc(map, "onDblClick", this._onDblClickHandler);
          map.disableDoubleClickZoom();
          break;
          
        default:
          console.error(esri.bundle.toolbars.draw.invalidType + ": " + geometryType);
          return;
      }

      this._onKeyDown_connect = dc(map, "onKeyDown", this._onKeyDownHandler);
      this._redrawConnect = dc(map, "onExtentChange", this._redrawGraphic);

      //this._deactivateMapTools(true, false, false, true);
      this._geometryType = geometryType;
      this._toggleTooltip(true);
      if (map.snappingManager && this._geometryType !== "freehandpolyline" && this._geometryType !== "freehandpolygon" && !esri.isTouchEnabled) {
        map.snappingManager._startSelectionLayerQuery();
        map.snappingManager._setUpSnapping();
      }
      this.onActivate(this._geometryType);
    },

    deactivate: function() {
      //summary: Deactivate draw tools
      var map = this.map;
      this._clear();

      var ddc = dojo.disconnect;
      ddc(this._onMouseDownHandler_connect);
      ddc(this._onMouseMoveHandler_connect);
      ddc(this._onMouseDragHandler_connect);
      ddc(this._onMouseUpHandler_connect);
      ddc(this._onClickHandler_connect);
      ddc(this._onDblClickHandler_connect);
      ddc(this._onKeyDown_connect);
      ddc(this._redrawConnect);
	  if (map.snappingManager) {
        map.snappingManager._stopSelectionLayerQuery();
	    map.snappingManager._killOffSnapping();
      }
      
      switch (this._geometryType) {       
        case esri.toolbars.Draw.LINE:
        case esri.toolbars.Draw.EXTENT:
        case esri.toolbars.Draw.FREEHAND_POLYLINE:
        case esri.toolbars.Draw.FREEHAND_POLYGON:                    
          this._activateMapTools(true, false, false, true);
          break;
          
        case esri.toolbars.Draw.POLYLINE:
        case esri.toolbars.Draw.POLYGON:
        case esri.toolbars.Draw.MULTI_POINT:
          map.enableDoubleClickZoom();
          break;
      }
                            
      var geometryType = this._geometryType;
      this._geometryType = null;
            
      map.__resetClickDuration();
      this._toggleTooltip(false);
      this.onDeactivate(geometryType);      
    },
    
    _clear: function() {
      if (this._graphic) {
        this.map.graphics.remove(this._graphic, true);
      }

      if (this._tGraphic) {
        this.map.graphics.remove(this._tGraphic, true);
      }
      
      this._graphic = this._tGraphic = null;
      if (this.map.snappingManager) {
        this.map.snappingManager._setGraphic(null);
      }
      this._points = [];
    },
    
    finishDrawing : function() {
      var geometry,
          _pts = this._points,
          map = this.map,
          spatialReference = map.spatialReference,
          Draw = esri.toolbars.Draw;
      
      _pts = _pts.slice(0, _pts.length);            
      switch (this._geometryType) {
        case Draw.POLYLINE:
          if (! this._graphic || _pts.length < 2) {            
            return;
          }

          geometry = new esri.geometry.Polyline(spatialReference);
          geometry.addPath([].concat(_pts));
          break;
        case Draw.POLYGON:
          if (! this._graphic || _pts.length < 3) {            
            return;
          }

          geometry = new esri.geometry.Polygon(spatialReference);
          var ring = [].concat(_pts, [_pts[0].offset(0, 0)]); //this._points, [evt.mapPoint.offset(0, 0), this._points[0].offset(0, 0)]);

          if (! esri.geometry.isClockwise(ring) && ! this.respectDrawingVertexOrder) {
            console.debug(this.declaredClass + " : " + esri.bundle.toolbars.draw.convertAntiClockwisePolygon);
            ring.reverse();
          }          
          geometry.addRing(ring);
          break;
        case Draw.MULTI_POINT:
          geometry = new esri.geometry.Multipoint(spatialReference);
          dojo.forEach(_pts, function(pt) {
            geometry.addPoint(pt);
          });                  
          break;                  
      }

      dojo.disconnect(this._onMouseMoveHandler_connect);
      this._clear();
      this._setTooltipMessage(0);
      if (geometry) {
        this.onDrawEnd(geometry);
      }
    },

    _normalizeRect: function(start, end, spatialReference) {
      var sx = start.x,
          sy = start.y,
          ex = end.x,
          ey = end.y,
          width = Math.abs(sx - ex), // || 1;
          height = Math.abs(sy - ey); // || 1;
      return { x:Math.min(sx, ex), y:Math.max(sy, ey), width:width, height:height, spatialReference:spatialReference };
    },

    _onMouseDownHandler: function(evt) {
      this._dragged = false;
      var snappingPoint;
      if (this.map.snappingManager) {
        snappingPoint = this.map.snappingManager._snappingPoint;
      }
      var start = snappingPoint || evt.mapPoint,
          Draw = esri.toolbars.Draw,
          map = this.map,
          spatialReference = map.spatialReference;

      this._points.push(start.offset(0, 0));
      switch (this._geometryType) {
        case Draw.LINE:
          this._graphic = map.graphics.add(new esri.Graphic(new esri.geometry.Polyline({ paths:[[[start.x, start.y], [start.x, start.y]]] }), this.lineSymbol), true);
          if (map.snappingManager) {
            map.snappingManager._setGraphic(this._graphic);
          }
          break;
          
        case Draw.EXTENT:
          //this._graphic = map.graphics.add(new esri.Graphic(new esri.geometry.Rect(start.x, start.y, 0, 0, spatialReference), this.fillSymbol), true);
          break;
          
        case Draw.FREEHAND_POLYLINE:
          this._oldPoint = evt.screenPoint;
          var polyline = new esri.geometry.Polyline(spatialReference);
          polyline.addPath(this._points);
          this._graphic = map.graphics.add(new esri.Graphic(polyline, this.lineSymbol), true);
          if (map.snappingManager) {
            map.snappingManager._setGraphic(this._graphic);
          }
          break;
          
        case Draw.FREEHAND_POLYGON:
          this._oldPoint = evt.screenPoint;
          var polygon = new esri.geometry.Polygon(spatialReference);
          polygon.addRing(this._points);
          this._graphic = map.graphics.add(new esri.Graphic(polygon, this.fillSymbol), true);
          if (map.snappingManager) {
            map.snappingManager._setGraphic(this._graphic);
          }
          break;
      }
      
      if (esri.isTouchEnabled) {
        // This is essential to stop iOS from firing
        // synthesized(delayed) mouse events later. 
        // Why?
        // Typically users deactivate the toolbar onDrawEnd. But
        // delayed mouse events are synthesized and fired after
        // deactivate happens - at this point graphics layer events
        // are active and will capture over-down-up-click events. Now
        // if the app is wired to activate edit toolbar on map.graphics.click,
        // this will cause edit toolbars to appear right after the user has
        // finished drawing the geometry - this is not desirable.
        evt.preventDefault();

        // Alternative solution is for the apps to do this in onDrawEnd handler:
        //   setTimeout(function() { drawToolbar.deactivate(); }, 0);
        // This new JS context will be executed after the browser has finished
        // firing the delayed mouse events. Hence there is no chance for 
        // graphics layers to inadvertently catch these events and act on them.
      }
    },

    _onMouseMoveHandler: function(evt) {
      var snappingPoint;
      if (this.map.snappingManager) {
        snappingPoint = this.map.snappingManager._snappingPoint;
      }
      var start = this._points[this._points.length - 1],
          end = snappingPoint || evt.mapPoint,
          tGraphic = this._tGraphic, geom = tGraphic.geometry;

      switch (this._geometryType) {
        case esri.toolbars.Draw.POLYLINE:
        case esri.toolbars.Draw.POLYGON:
          //_tGraphic.setGeometry(dojo.mixin(_tGraphic.geometry, { paths:[[[start.x, start.y], [end.x, end.y]]] }));
          geom.setPoint(0, 0, { x: start.x, y: start.y });
          geom.setPoint(0, 1, { x: end.x, y: end.y });
          tGraphic.setGeometry(geom);
          break;
      }
    },

    _onMouseDragHandler: function(evt) {
      if (esri.isTouchEnabled && !this._points.length) {
        // BlackBerry Torch certainly needs this
        // to prevent page from panning
        evt.preventDefault();
        
        return;
      }
      
      this._dragged = true;
      var snappingPoint;
      if (this.map.snappingManager) {
        snappingPoint = this.map.snappingManager._snappingPoint;
      }
      var start = this._points[0],
          end = snappingPoint || evt.mapPoint,
          map = this.map,
          spatialReference = map.spatialReference,
          _graphic = this._graphic,
          Draw = esri.toolbars.Draw;
                     
      switch (this._geometryType) {
        case Draw.LINE:
          _graphic.setGeometry(dojo.mixin(_graphic.geometry, { paths:[[[start.x, start.y], [end.x, end.y]]] }));
          break;
        case Draw.EXTENT:
          if (_graphic) {
            map.graphics.remove(_graphic, true);
          }
          var rect = new esri.geometry.Rect(this._normalizeRect(start, end, spatialReference));
          // TODO
          // We can remove this once graphics layer is able to duplicate
          // rects/extens when wrapping (we may have to render them as polygons).
          rect._originOnly = true;
          this._graphic = map.graphics.add(new esri.Graphic(rect, this.fillSymbol), true);
          if (map.snappingManager) {
            map.snappingManager._setGraphic(this._graphic);
          }
          // _graphic.setGeometry(dojo.mixin(_graphic.geometry, this._normalizeRect(start, end, spatialReference)));
          break;
        case Draw.FREEHAND_POLYLINE:
          this._hideTooltip();
          if (this._canDrawFreehandPoint(evt) === false){
              if (esri.isTouchEnabled) {
                // BlackBerry Torch certainly needs this
                // to prevent page from panning
                evt.preventDefault();
              }
              return;
          }
                    
          this._points.push(evt.mapPoint.offset(0, 0));
          _graphic.geometry._insertPoints([end.offset(0, 0)], 0);
          _graphic.setGeometry(_graphic.geometry);
          break;
        case Draw.FREEHAND_POLYGON:
          this._hideTooltip();
          if (this._canDrawFreehandPoint(evt) === false){
              if (esri.isTouchEnabled) {
                // BlackBerry Torch certainly needs this
                // to prevent page from panning
                evt.preventDefault();
              }
              return;
          }
                        
          this._points.push(evt.mapPoint.offset(0, 0));
          _graphic.geometry._insertPoints([end.offset(0, 0)], 0);
          _graphic.setGeometry(_graphic.geometry);
          break;
      }
      
      if (esri.isTouchEnabled) {
        // Prevent iOS from panning the web page
        evt.preventDefault();
      }
    },
           
    _canDrawFreehandPoint : function(evt) {
        if (!this._oldPoint){
            return false;
        }
            
        var dx = this._oldPoint.x - evt.screenPoint.x;
        dx = (dx < 0) ? dx * -1 : dx;
        
        var dy = this._oldPoint.y - evt.screenPoint.y;
        dy = (dy < 0) ? dy * -1 : dy;
        
        var tolerance = this._options.tolerance;
        if (dx < tolerance && dy < tolerance){
            return false;
        }
        
        var now = new Date();
        var timeDiff = now - this._startTime;
        if (timeDiff < this._options.drawTime){
            return false;
        }

        this._startTime = now;      
        this._oldPoint = evt.screenPoint;        
        return true;        
    },

    _onMouseUpHandler: function(evt) {
      if (!this._dragged) {
        // It is not going to be a valid geometry.
        // Clear state and return. Do not fire onDrawEnd.
        this._clear();
        return;
      }
      
      // IE seems to have a problem when double clicking on the map
      // when polyline/polygon/multipoint tool is active.
      if (this._points.length === 0) {
        this._points.push(evt.mapPoint.offset(0,0));
      }
      var snappingPoint;
      if (this.map.snappingManager) {
        snappingPoint = this.map.snappingManager._snappingPoint;
      }
      var start = this._points[0],
          end = snappingPoint || evt.mapPoint,
          map = this.map,
          spatialReference = map.spatialReference,
          Draw = esri.toolbars.Draw,
          geometry;
          
      switch (this._geometryType) {
        case Draw.LINE:
          geometry = new esri.geometry.Polyline({ paths:[[[start.x, start.y], [end.x, end.y]]], spatialReference:spatialReference });
          break;
          
        case Draw.EXTENT:
          geometry = esri.geometry._rectToExtent(new esri.geometry.Rect(this._normalizeRect(start, end, spatialReference)));
          break;
          
        case Draw.FREEHAND_POLYLINE:
          geometry = new esri.geometry.Polyline(spatialReference);
          geometry.addPath([].concat(this._points, [end.offset(0, 0)]));
          break;
          
        case Draw.FREEHAND_POLYGON:
          geometry = new esri.geometry.Polygon(spatialReference);
          var ring = [].concat(this._points, [end.offset(0, 0), this._points[0].offset(0, 0)]);

          if (! esri.geometry.isClockwise(ring) && ! this.respectDrawingVertexOrder) {
            console.debug(this.declaredClass + " : " + esri.bundle.toolbars.draw.convertAntiClockwisePolygon);
            ring.reverse();
          }

          geometry.addRing(ring);
          break;
      }
      
      if (esri.isTouchEnabled) {
        evt.preventDefault();
      }
     
      this._clear();
      this.onDrawEnd(geometry);
    },

    _onClickHandler: function(evt) {
      var snappingPoint;
      if (this.map.snappingManager) {
        snappingPoint = this.map.snappingManager._snappingPoint;
      }
      var start = snappingPoint || evt.mapPoint,
          map = this.map,
          screenPoint = map.toScreen(start),
          Draw = esri.toolbars.Draw,
          pts, dx, dy, numPts, i, tGraphic, geom;

      this._points.push(start.offset(0, 0));
      switch (this._geometryType) {
        case Draw.POINT:          
          this.onDrawEnd(start.offset(0, 0));
          this._setTooltipMessage(0);          
          break;
        case Draw.POLYLINE:
          if (this._points.length === 1) {
            var polyline = new esri.geometry.Polyline(map.spatialReference);
            polyline.addPath(this._points);
            this._graphic = map.graphics.add(new esri.Graphic(polyline, this.lineSymbol), true);
            if (map.snappingManager) {
              map.snappingManager._setGraphic(this._graphic);
            }
            this._onMouseMoveHandler_connect = dojo.connect(map, "onMouseMove", this._onMouseMoveHandler);

            this._tGraphic = map.graphics.add(new esri.Graphic(new esri.geometry.Polyline({ paths: [[[start.x, start.y], [start.x, start.y]]] }), this.lineSymbol), true);
          }
          else {
            this._graphic.geometry._insertPoints([start.offset(0, 0)], 0);
//            map.graphics.remove(this._tGraphic, true);
            this._graphic.setGeometry(this._graphic.geometry).setSymbol(this.lineSymbol);

            tGraphic = this._tGraphic;
            geom = tGraphic.geometry;
            //geom._insertPoints([start.offset(0, 0), start.offset(0, 0)], 0);
            geom.setPoint(0, 0, start.offset(0, 0));
            geom.setPoint(0, 1, start.offset(0, 0));
            tGraphic.setGeometry(geom);
          }
          break;
        case Draw.POLYGON:
          if (this._points.length === 1) {
            var polygon = new esri.geometry.Polygon(map.spatialReference);
            polygon.addRing(this._points);
            this._graphic = map.graphics.add(new esri.Graphic(polygon, this.fillSymbol), true);
            if (map.snappingManager) {
              map.snappingManager._setGraphic(this._graphic);
            }
            this._onMouseMoveHandler_connect = dojo.connect(map, "onMouseMove", this._onMouseMoveHandler);

            /*
             * IE gets confused when we delete and create this polyline every
             * time a point is added. Deleting and inserting a node
             * on which click happened clobbers double-click event.
             * Note - click/double-click to add a point sometimes falls
             * on this polyline which is the root of the problem in IE.  
             * POLYLINE tool above has the same problem
             */
            this._tGraphic = map.graphics.add(new esri.Graphic(new esri.geometry.Polyline({ paths: [[[start.x, start.y], [start.x, start.y]]] }), this.fillSymbol), true);
          }
          else {
            this._graphic.geometry._insertPoints([start.offset(0, 0)], 0);
//            map.graphics.remove(this._tGraphic, true);
            this._graphic.setGeometry(this._graphic.geometry).setSymbol(this.fillSymbol);

            tGraphic = this._tGraphic;
            geom = tGraphic.geometry;
            //geom._insertPoints([start.offset(0, 0), start.offset(0, 0)], 0);
            geom.setPoint(0, 0, start.offset(0, 0));
            geom.setPoint(0, 1, start.offset(0, 0));
            tGraphic.setGeometry(geom);
          }
          break;
        case Draw.MULTI_POINT:
          var tps = this._points;
          if (tps.length === 1) {
            var multiPoint = new esri.geometry.Multipoint(map.spatialReference);
            multiPoint.addPoint(tps[tps.length - 1]);
            this._graphic = map.graphics.add(new esri.Graphic(multiPoint, this.markerSymbol), true);
            if (map.snappingManager) {
              map.snappingManager._setGraphic(this._graphic);
            }
          }
          else {
            this._graphic.geometry.addPoint(tps[tps.length - 1]);
            this._graphic.setGeometry(this._graphic.geometry).setSymbol(this.markerSymbol);
          }
          break;
          
        case Draw.ARROW:
           pts = [[96,24],[72,52],[72,40],[0,40],[0,12],[72,12],[72,0],[96,24]];
           dx = screenPoint.x - 36;
           dy = screenPoint.y - 24;
           this._addShape(pts, dx, dy);
           break;

        case Draw.LEFT_ARROW:
           pts = [[0,24],[24,52],[24,40],[96,40],[96,12],[24,12],[24,0],[0,24]];
           dx = screenPoint.x - 60;
           dy = screenPoint.y - 24;
           this._addShape(pts, dx, dy);
           break;

        case Draw.RIGHT_ARROW:
           pts = [[96,24],[72,52],[72,40],[0,40],[0,12],[72,12],[72,0],[96,24]];
           dx = screenPoint.x - 36;
           dy = screenPoint.y - 24;
           this._addShape(pts, dx, dy);
           break;

        case Draw.UP_ARROW:
           pts = [[24,0],[52,24],[40,24],[40,96],[12,96],[12,24],[0,24],[24,0]];
           dx = screenPoint.x - 24;
           dy = screenPoint.y - 60;
           this._addShape(pts, dx, dy);
           break;

        case Draw.DOWN_ARROW:
           pts = [[24,96],[52,72],[40,72],[40,0],[12,0],[12,72],[0,72],[24,96]];
           dx = screenPoint.x - 24;
           dy = screenPoint.y - 36;
           this._addShape(pts, dx, dy);
           break;
           
        case Draw.TRIANGLE:
           pts = [[0,96],[48,0],[96,96],[0,96]];
           dx = screenPoint.x - 48; 
           dy = screenPoint.y - 48;
           this._addShape(pts, dx, dy); 
           break;
        
        case Draw.RECTANGLE:
           pts = [[0,-96],[96,-96],[96,0],[0,0], [0,-96]];
           dx = screenPoint.x - 48; 
           dy = screenPoint.y + 48;
           this._addShape(pts, dx, dy); 
           break;
           
        case Draw.CIRCLE: 
           numPts = 360;
           var angle = (2 * Math.PI) / numPts;
           pts = [];
           for (i = 0; i < numPts; i++) { 
               pts.push([48 * Math.cos(angle * i), 48 * Math.sin(angle * i)]);
           }
           pts.push(pts[0]);
           this._addShape(pts, screenPoint.x, screenPoint.y);
           break;
           
        case Draw.ELLIPSE:
           var rad = Math.PI / 180;
           var beta = -rad; 
           var sinbeta = Math.sin(beta);
           var cosbeta = Math.cos(beta);
           numPts = 360;
           pts = []; 
           for (i = 0; i < numPts; i++) 
           {
               var alpha = i * (rad) ;
               var sinalpha = Math.sin(alpha);
               var cosalpha = Math.cos(alpha);
 
               var x = (48 * cosalpha * cosbeta - 24 * sinalpha * sinbeta);
               var y = (48 * cosalpha * sinbeta + 24 * sinalpha * cosbeta);
 
               pts.push([x, y]);
           }
           pts.push(pts[0]);  
           this._addShape(pts, screenPoint.x, screenPoint.y);
           break;
      }
      
      this._setTooltipMessage(this._points.length);
    },
    
    _addShape : function(path, dx, dy){
       var graphic = this.map.graphics.add(new esri.Graphic(this._toPolygon(path, dx, dy), this.fillSymbol), true);
       this._setTooltipMessage(0);
       var geom;
       if (graphic) {
         geom = esri.geometry.fromJson(graphic.geometry.toJson());
         this.map.graphics.remove(graphic, true);
       }
       this.onDrawEnd(geom);
       graphic = geom = null;
    },
    
    _toPolygon : function(path, dx, dy){
        var map = this.map;
        var polygon = new esri.geometry.Polygon(map.spatialReference);
        polygon.addRing(dojo.map(path, function(pt) { return map.toMap( {x:pt[0] + dx, y:pt[1] + dy}); }));        
        return polygon;
    },

    _onDblClickHandler: function(evt) {
      var geometry,
          _pts = this._points,
          map = this.map,
          spatialReference = map.spatialReference,
          Draw = esri.toolbars.Draw;
      
      if (esri.isTouchEnabled) {
        _pts.push(evt.mapPoint);
      }    
          
      _pts = _pts.slice(0, _pts.length); // - (1 + (dojo.isIE ? 0: 1)));            
      switch (this._geometryType) {
        case Draw.POLYLINE:
          if (! this._graphic || _pts.length < 2) {
            dojo.disconnect(this._onMouseMoveHandler_connect);
            this._clear();
            this._onClickHandler(evt);
            return;
          }

          geometry = new esri.geometry.Polyline(spatialReference);
          geometry.addPath([].concat(_pts)); //this._points, [evt.mapPoint.offset(0, 0)]));
          break;
        case Draw.POLYGON:
          if (! this._graphic || _pts.length < 2) { //this._points.length < 2) {
            dojo.disconnect(this._onMouseMoveHandler_connect);
            this._clear();
            this._onClickHandler(evt);
            return;
          }

          geometry = new esri.geometry.Polygon(spatialReference);
          var ring = [].concat(_pts, [_pts[0].offset(0, 0)]); //this._points, [evt.mapPoint.offset(0, 0), this._points[0].offset(0, 0)]);

          if (! esri.geometry.isClockwise(ring) && ! this.respectDrawingVertexOrder) {
            console.debug(this.declaredClass + " : " + esri.bundle.toolbars.draw.convertAntiClockwisePolygon);
            ring.reverse();
          }
          
          geometry.addRing(ring);
          break;
        case Draw.MULTI_POINT:
          geometry = new esri.geometry.Multipoint(spatialReference);
          dojo.forEach(_pts, function(pt) {
            geometry.addPoint(pt);
          });
        
          // if (this._graphic) {
          //   var geom = this._graphic.geometry;
          //   // geom.addPoint(evt.mapPoint.offset(0, 0));
          //   // geometry = new esri.geometry.Multipoint({ points:[].concat([], geom.points.slice(0, geom.points.length - 1)), spatialReference: spatialReference });
          // }
          // else {
          //   geometry = new esri.geometry.Multipoint(spatialReference);
          //   geometry.addPoint(evt.mapPoint.offset(0, 0));
          // }
          break;
      }

      dojo.disconnect(this._onMouseMoveHandler_connect);
      this._clear();
      this._setTooltipMessage(0);
      this.onDrawEnd(geometry);
    },
    
    _onKeyDownHandler : function(evt) {
      if (evt.keyCode === dojo.keys.ESCAPE) {
        dojo.disconnect(this._onMouseMoveHandler_connect);
        this._clear();
        this._setTooltipMessage(0);     
      }
    },
               
    _toggleTooltip: function(show) {
      if (!this._options.showTooltips){
          return;
      }
      
      if (show) { // enable if not already enabled
        if (this._tooltip) {
          return;
        }
      
        var domNode = this.map.container;
        this._tooltip = dojo.create("div", { "class": "tooltip" }, domNode);
        this._tooltip.style.display = "none";
        this._tooltip.style.position = "fixed";
        
        this._setTooltipMessage(0);
             
        this._onTooltipMouseEnterHandler_connect = dojo.connect(this.map, "onMouseOver", this._updateTooltip);
        this._onTooltipMouseLeaveHandler_connect = dojo.connect(this.map, "onMouseOut",  this._hideTooltip);
        this._onTooltipMouseMoveHandler_connect = dojo.connect(this.map, "onMouseMove",  this._updateTooltip);
      }
      else { // disable
        if (this._tooltip) {
          dojo.disconnect(this._onTooltipMouseEnterHandler_connect);
          dojo.disconnect(this._onTooltipMouseLeaveHandler_connect);
          dojo.disconnect(this._onTooltipMouseMoveHandler_connect);
          dojo.destroy(this._tooltip);
          this._tooltip = null;
        }
      }
    },
    
    _hideTooltip : function() {
      var tooltip = this._tooltip;
      if (!tooltip){
          return;
      }
                
      tooltip.style.display = "none";
    },
    
    _setTooltipMessage : function(numPoints) {
     var tooltip = this._tooltip;
        if (!tooltip){
            return;
        }
         
     var points = numPoints;
     var message = "";
     switch (this._geometryType) {       
        case esri.toolbars.Draw.POINT:                      
          message = esri.bundle.toolbars.draw.addPoint;                            
          break;
        case esri.toolbars.Draw.ARROW:
        case esri.toolbars.Draw.LEFT_ARROW:
        case esri.toolbars.Draw.RIGHT_ARROW:
        case esri.toolbars.Draw.UP_ARROW:
        case esri.toolbars.Draw.DOWN_ARROW:
        case esri.toolbars.Draw.TRIANGLE:
        case esri.toolbars.Draw.RECTANGLE:
        case esri.toolbars.Draw.CIRCLE:
        case esri.toolbars.Draw.ELLIPSE:
          message = esri.bundle.toolbars.draw.addShape;
          break;        
        case esri.toolbars.Draw.LINE:
        case esri.toolbars.Draw.EXTENT:
        case esri.toolbars.Draw.FREEHAND_POLYLINE:
        case esri.toolbars.Draw.FREEHAND_POLYGON: 
          message = esri.bundle.toolbars.draw.freehand; 
          break;
        case esri.toolbars.Draw.POLYLINE:
        case esri.toolbars.Draw.POLYGON:
           message = esri.bundle.toolbars.draw.start;
           if (points === 1){
             message = esri.bundle.toolbars.draw.resume;
           } else if (points >= 2) {
             message = esri.bundle.toolbars.draw.complete;
           }
           break;        
        case esri.toolbars.Draw.MULTI_POINT:           
            message = esri.bundle.toolbars.draw.addMultipoint;
            if (points >= 1) {
                message = esri.bundle.toolbars.draw.finish;
              }
            break;                  
      }       
     
      tooltip.innerHTML = message;                     
    },
    
    _updateTooltip : function(evt) {
        var tooltip = this._tooltip;
        if (!tooltip){
            return;
        }
                                
        var px, py;        
        if (evt.clientX || evt.pageY) {
            px = evt.clientX;
            py = evt.clientY;
        } else {
            px = evt.clientX + dojo.body().scrollLeft - dojo.body().clientLeft;
            py = evt.clientY + dojo.body().scrollTop - dojo.body().clientTop;
        }
                       
        tooltip.style.display = "none";
        dojo.style(tooltip, { left: (px + this._options.tooltipOffset) + "px", top: (py) + "px" });
        tooltip.style.display = "";            
    },

    _redrawGraphic: function(extent, delta, levelChange, lod) {
      if (levelChange || this.map.wrapAround180) {
        var g = this._graphic;
        if (g) {
          g.setGeometry(g.geometry);
        }
        
        g = this._tGraphic;
        if (g) {
          g.setGeometry(g.geometry);
        }
      }
    },
    
   /*********
   * Events
   *********/

    onActivate: function() {
      // Arguments:
      //  <String> geometryType
    },
    
    onDeactivate: function() {
      // Arguments:
      //  <String> geometryType
    },
    
    onDrawEnd: function() {
      //summary: Event fired when a new geometry drawing is complete.
      //         arguments[0]: esri.geometry.Point: If geometryType == esri.toolbar.Draw.POINT
      //         arguments[0]: esri.geometry.Rect: If geometryType == esri.toolbar.Draw.RECT
      //         arguments[0]: esri.geometry.Extent: If geometryType == esri.toolbar.Draw.EXTENT
      //         arguments[0]: esri.geometry.Polyline: If geometryType == esri.toolbar.Draw.POLYLINE
      //         arguments[0]: esri.geometry.Polyline: If geometryType == esri.toolbar.Draw.FREEHAND_POLYLINE
      //         arguments[0]: esri.geometry.Polygon: If geometryType == esri.toolbar.Draw.POLYGON
      //         arguments[0]: esri.geometry.Polygon: If geometryType == esri.toolbar.Draw.FREEHAND_POLYGON
      //         arguments[0]: esri.geometry.Line: If geometryType == esri.toolbar.Draw.LINE
      //         arguments[0]: esri.geometry.Circle: If geometryType == esri.toolbar.Draw.CIRCLE
      //         arguments[0]: esri.geometry.Ellipse: If geometryType == esri.toolbar.Draw.ELLIPSE
    }
  }
);

dojo.mixin(esri.toolbars.Draw, {
  POINT: "point", 
  MULTI_POINT: "multipoint", 
  LINE: "line", 
  EXTENT: "extent", 
  POLYLINE: "polyline", 
  POLYGON:"polygon",
  FREEHAND_POLYLINE:"freehandpolyline", 
  FREEHAND_POLYGON:"freehandpolygon", 
  ARROW:"arrow", 
  LEFT_ARROW:"leftarrow", 
  RIGHT_ARROW:"rightarrow", 
  UP_ARROW:"uparrow", 
  DOWN_ARROW:"downarrow", 
  TRIANGLE:"triangle", 
  CIRCLE:"circle", 
  ELLIPSE:"ellipse", 
  RECTANGLE:"rectangle"
});
});
