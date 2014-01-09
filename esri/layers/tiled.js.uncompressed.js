//>>built
// wrapped by build app
define("esri/layers/tiled", ["dijit","dojo","dojox","dojo/require!dojox/collections/ArrayList,esri/layers/layer,esri/geometry,dojox/gfx/matrix"], function(dijit,dojo,dojox){
dojo.provide("esri.layers.tiled");

dojo.require("dojox.collections.ArrayList");
dojo.require("esri.layers.layer");
dojo.require("esri.geometry");
dojo.require("dojox.gfx.matrix");

dojo.declare("esri.layers.TiledMapServiceLayer", esri.layers.Layer, {
    constructor: function(/*String*/ url, /*Object?*/ options) {
      //options: displayLevels: Number[]: Levels to display in layer, based on LOD.level
      dojo.connect(this, "onLoad", this, "_initTiledLayer");
      
      this._displayLevels = options ? options.displayLevels : null;

      var dh = dojo.hitch;

      this._addImage = dh(this, this._addImage);
      this._tileLoadHandler = dh(this, this._tileLoadHandler);
      this._tileErrorHandler = dh(this, this._tileErrorHandler);
      this._tilePopPop = dh(this, this._tilePopPop);
      this._cleanUpRemovedImages = dh(this, this._cleanUpRemovedImages);
      this._fireOnUpdateEvent = dh(this, this._fireOnUpdateEvent);
      this._transitionEnd = dh(this, this._transitionEnd);
    },
    
    opacity: 1,
    isPNG32: false,
    
    _initTiledLayer: function() {
      //tiling scheme
      var ti = this.tileInfo,
          lods = ti.lods;
      //this._tileOrigin = new esri.geometry.Point(dojo.mixin(ti.origin, this.spatialReference));
      this._tileW = ti.width;
      this._tileH = ti.height;
      this._normalizedScales = [];
      
      var scales = (this.scales = []),
          dl = this._displayLevels,
          fe = this.fullExtent,
          ul = new esri.geometry.Point(fe.xmin, fe.ymax),
          lr = new esri.geometry.Point(fe.xmax, fe.ymin),
          gctc = esri.TileUtils.getContainingTileCoords,
          coords, lod, i, len = lods.length;

      for (i=0; i<len; i++) {
        lod = lods[i];
        coords = gctc(ti, ul, lod);
        lod.startTileRow = coords.row < 0 ? 0 : coords.row;
        lod.startTileCol = coords.col < 0 ? 0 : coords.col;
        coords = gctc(ti, lr, lod);
        lod.endTileRow = coords.row;
        lod.endTileCol = coords.col;
        
        if (! dl || dojo.indexOf(dl, lod.level) !== -1) {
          scales[i] = lod.scale;
          this._normalizedScales[i] = lod.scale/ti.dpi;
        }
      }
      
      // Mixed mode caching will have tiles in both PNG32 AND JPG formats.
      // We need to apply IE 6 patch for this mode as well. Looks like the patch
      // does not negatively impact JPG rendering.
      this._patchIE = dojo.isIE >= 6 && dojo.isIE < 7 && (this.isPNG32 || ti.format === "Mixed");
    },

    //Layer specific
    _setMap: function(map, container, index, lod) {
      //console.log("setMap: ", this.url, map._jobs);
      this._map = map;
      var d = (this._div = dojo.create("div", null, container));
      this._layerIndex = index;

      var _mv = map.__visibleDelta,
          dc = dojo.connect,
          names = esri._css.names,
          css = {
            position: "absolute", 
            width: map.width + "px", 
            height: map.height + "px", 
            overflow: "visible" 
          };
      
      if (map.navigationMode === "css-transforms") {
        css[names.transform] = esri._css.translate(-_mv.x, -_mv.y);
        dojo.style(d, css);
        
        delete css[names.transform];
        css[names.transition] = names.transformName + " " + esri.config.defaults.map.zoomDuration + "ms ease";
        
        dojo.style((this._active = dojo.create("div", null, d)), css);
        this._active._remove = 0;
        this._passives = [];

        this._onScaleHandler_connect = dc(map, "onScale", this, this._onScaleHandler);

        // We don't want to suspend dom mutation on desktop browsers
        if (esri.isTouchEnabled) {
          this._standby = [];
          var self = this,
              // Prevent *displaying* images in the dom when zoom/pan has begun, thereby
              // prevent _cleanUpRemovedImages from running. Or else, old img where
              // touchmove originated is destroyed and hence touch sequence is broken
              // and no more events are fired.
              // Related info:
              // http://stackoverflow.com/questions/2598529/touch-event-missing-when-pushing-new-view
              // http://stackoverflow.com/questions/6328978/click-event-on-new-element-after-html-update-in-sencha-touch
              suspendDOM = function() { self._noDom = 1; };
          this._onPanStartHandler_connect = dc(map, "onPanStart", suspendDOM);
          this._onZoomStartHandler_connect = dc(map, "onZoomStart", suspendDOM);
        }
      }
      else {
        css.left = -_mv.x + "px";
        css.top = -_mv.y + "px";
        dojo.style(d, css);
        this._onZoomHandler_connect = dc(map, "onZoom", this, "_onZoomHandler");
      }
      
      this._onPanHandler_connect = dc(map, "onPan", this, "_onPanHandler");
      this._onExtentChangeHandler_connect = dc(map, "onExtentChange", this, "_onExtentChangeHandler");
      this._onResizeHandler_connect = dc(map, "onResize", this, "_onResizeHandler");
      this._opacityChangeHandler_connect = dc(this, "onOpacityChange", this, "_opacityChangeHandler");
      this._visibilityChangeHandler_connect = dc(this, "onVisibilityChange", this, "_visibilityChangeHandler");

      //visual properties
      this._tileIds = [];
      this._tiles = [];
      this._tileBounds = [];
      this._ct = null;
      this._removeList = new dojox.collections.ArrayList();
      this._loadingList = new dojox.collections.ArrayList();
      
      // wrap around support
      var tileInfo = this.tileInfo, sr = tileInfo.spatialReference,
          info = sr._getInfo();

      // TODO
      // We need to overlap tiles to fix an issue where the horizon
      // does not align with tile boundary. This can happen if one of the
      // following conditions is true:
      // 1. tile origin is not -180
      // 2. scale for a given level is chosen such that horizon does not
      //    align with tile boundary
      // Once we fix this issue, the "third condition" in the following
      // decision block can be removed
      // See also: Map::_addLayerHandler
      this._wrap = map.wrapAround180 && sr._isWrappable() && Math.abs(info.origin[0] - tileInfo.origin.x) <= info.dx;

      if (this._wrap) {
        // Note that tileInfo will be augmented by _addFrameInfo
        esri.TileUtils._addFrameInfo(tileInfo, info);
      }

      var mapExtent = map.extent;
      if (! this.visible) {
        this._visibilityChangeHandler(this.visible);
      }
      if (mapExtent && map.loaded) {
        this._onExtentChangeHandler(mapExtent, null, null, lod);
      }

      // if (map._baseLayerId == this.id) {
        // this._ct = esri.TileUtils.getCandidateTileInfo(map, this.tileInfo, mapExtent || this.initialExtent);
      // }

      return d;
    },
    
    //event handlers
    _unsetMap: function(map, container) {
      //console.log("UNSETmap", this.url, map._jobs);
      /*if (container) {
        this._div = container.removeChild(this._div);
      }*/
      
      var tiles = this._tiles, loadingList = this._loadingList, img,
          dd = dojo.disconnect;

      // Let's clear out images that are still loading. This would prevent
      // _cleanUpRemovedImages from being executed unnecessarily after this
      // layer is removed from map.
      if (loadingList && loadingList.count > 0) {
        //console.log("BEFORE COUNT ==== ", loadingList.count);
        
        loadingList.forEach(function(imgId) {
          //console.log("destroying...", imgId);
          img = tiles[imgId];
          
          if (img) {
            dd(img._onload_connect);
            dd(img._onerror_connect);
            dd(img._onabort_connect);
            img._onload_connect = img._onerror_connect = img._onabort_connect = null;
          }
        });
        
        loadingList.clear();
        this._fireUpdateEnd();
        //console.log("AFTER COUNT ==== ", loadingList.count, map._jobs);
      }

      dojo.destroy(this._div);
      this._map = this._layerIndex = this._div = this._standby = null;

      dd(this._onExtentChangeHandler_connect);
      dd(this._onPanHandler_connect);
      dd(this._onZoomHandler_connect);
      dd(this._onScaleHandler_connect);
      dd(this._onLayerReorderHandler_connect);
      dd(this._onResizeHandler_connect);
      dd(this._opacityChangeHandler_connect);
      dd(this._visibilityChangeHandler_connect);
      dd(this._onPanStartHandler_connect);
      dd(this._onZoomStartHandler_connect);
    },
    
    _visibilityChangeHandler: function(v) {
      if (v) {
        esri.show(this._div);
        var map = this._map;
        if (map.navigationMode === "css-transforms") {
          this._onScaleHandler_connect = dojo.connect(map, "onScale", this, this._onScaleHandler);
        }
        else {
          this._onZoomHandler_connect = dojo.connect(map, "onZoom", this, "_onZoomHandler");
        }
        this._onPanHandler_connect = dojo.connect(map, "onPan", this, "_onPanHandler");
        this._onExtentChangeHandler(map.extent, null, true);
      }
      else {
        esri.hide(this._div);
        dojo.disconnect(this._onPanHandler_connect);
        dojo.disconnect(this._onZoomHandler_connect);
        dojo.disconnect(this._onScaleHandler_connect);
      }
    },
    
    //map event handlers
    _onResizeHandler: function(extent, width, height) {
      var css = { width: width + "px", height: height + "px" },
          ds = dojo.style, i;
      
      ds(this._div, css); //, clip:"rect(0px " + width + "px " + height + "px 0px)"
      
      if (this._map.navigationMode === "css-transforms") {
        if (this._active) {
          ds(this._active, css);
        }
  
        for (i = this._passives.length - 1; i >= 0; i--) {
          ds(this._passives[i], css);
        }
      }
    },

    _onExtentChangeHandler: function(extent, delta, levelChange, lod) {
      var map = this._map, i, standby = this._standby, img, passive;

      if (map._isPanningOrZooming()) {
        // Bail out if we're here while the map is still panning or zooming,
        // thereby avoid unnecessary network requests
        
        // You can end up here as a result of the following sequence:
        // - map has a base layer
        // - now switch the base map to a different layer:
        //   - change map extent to the new layer's initial extent
        //     (thereby triggering map animation)
        //   - remove old base layer
        //   - add new base layer of the same spatial reference
        // In this sequence, this extent change handler will be called twice:
        // First, from within the new layer's _setMap - resulting in tiles 
        // loaded for old map level.
        // Second, when the current map animation ends - resulting in tiles
        // loaded for the new map level. However in "css-transforms" mode
        // tiles from the old level are left intact because there are no
        // passive nodes yet and the old tiles are within the active node
        // (see the css-transforms block below that attempts to destroy
        // passives).
        
        return;
      }

      if (map.navigationMode === "css-transforms") {
        if (levelChange) {
          for (i = this._passives.length - 1; i >= 0; i--) {
            passive = this._passives[i];
            
            // Conclude transition *now*
            dojo.style(passive, esri._css.names.transition, "none");
            
            if (passive._marked) {
              this._passives.splice(i, 1);
              if (passive.parentNode) {
                passive.parentNode.removeChild(passive);
              }
              dojo.destroy(passive);
              //console.log("destroyed 2: " + passive.childNodes.length);
            }
            // Let's remember the current matrix so that when the
            // next scaling begins before this passive node destroys,
            // we can apply the matrix
            else if (passive.childNodes.length > 0) {
              passive._multiply = passive._multiply ? 
                                    dojox.gfx.matrix.multiply(passive._matrix, passive._multiply) : 
                                    passive._matrix;
            }
          }
          
          /*if (lod) {
            return;
          }*/
        }

        // Let's append pending images to the DOM.
        this._noDom = 0;
        if (standby && standby.length) {
          for (i = standby.length - 1; i >= 0; i--) {
            img = standby[i];
            dojo.style(img, "visibility", "visible");
            this._tilePopPop(img);
            standby.splice(i, 1);
          }
        }
      }
      
      
      var showing = true;
      this._refreshArgs = { extent:extent, lod:lod };
      if (! this.visible) {
        showing = false;
      }

      var scale;
      if (lod) {
        scale = dojo.indexOf(this.scales, lod.scale) === -1;
        if (this.declaredClass === "esri.layers.WMTSLayer") {       
          var baseMapDpi = map._params.tileInfo.dpi;
          var wider = map.width > map.height? map.width:map.height;      
          scale = true;
          var s1, s2 = lod.scale/baseMapDpi;
          for (i=0; i< this._normalizedScales.length; i++){
            s1 = this._normalizedScales[i];
            if (Math.abs((s1 - s2)/s1) < (1/wider)){
              scale = false;
              break;
            }
          }
        }
      }
      else {
        var _lev = map.getLevel(),
            _scale = (_lev !== -1) ? map._params.tileInfo.lods[_lev].scale : -1;
        scale = ( dojo.indexOf(this.scales, _scale) === -1 );
      }

      if (showing) {
        var dd = dojo.disconnect;
        if (scale) {
          showing = false;
          esri.hide(this._div);
          dd(this._onPanHandler_connect);
          dd(this._onZoomHandler_connect);
          dd(this._onScaleHandler_connect);
        }
        else {
          this._fireUpdateStart();
          esri.show(this._div);
          dd(this._onPanHandler_connect);
          dd(this._onZoomHandler_connect);
          dd(this._onScaleHandler_connect);
          if (map.navigationMode === "css-transforms") {
            this._onScaleHandler_connect = dojo.connect(map, "onScale", this, this._onScaleHandler);
          }
          else {
            this._onZoomHandler_connect = dojo.connect(map, "onZoom", this, "_onZoomHandler");
          }
          this._onPanHandler_connect = dojo.connect(map, "onPan", this, "_onPanHandler");
        }
      }

      this._rrIndex = 0;
      var ct = esri.TileUtils.getCandidateTileInfo(map, this.tileInfo, extent),
          mv = map.__visibleDelta, id;

      if (!this._ct || ct.lod.level !== this._ct.lod.level || levelChange) {
        var didZoom = (ct && this._ct && ct.lod.level !== this._ct.lod.level);
        
        this._ct = ct;
        var _tiles = this._tiles,
            _tileIds = this._tileIds,
            _tileBounds = this._tileBounds,
            _removeList = this._removeList,
            tile, il=_tileIds.length;

        this._cleanUpRemovedImages();

        for (i=0; i < il; i++) {
          id = _tileIds[i];
          tile = _tiles[id];
          _tileBounds[id] = _tileIds[i] = null;
          if (
            (map.navigationMode === "css-transforms") && didZoom && 
            tile.parentNode && map.fadeOnZoom && 
            showing 
            // If not visible or showing, let's not mark them fadeOut so that 
            // they'll be immediately destroyed by cleanUp call below.
            // If these images stay, later when the layer becomes visible, we'll
            // have images from two levels displayed at the same time.
            // TODO
            // Why are we even here after the layer has been hidden?
            // Do these calcs outside the loop
          ) {
            tile._fadeOut = didZoom;
            tile.parentNode._remove++;
          }
          _removeList.add(tile);
        }

        if (levelChange) {
          this._tileIds = [];
          this._tiles = [];
          this._tileBounds = [];
        }
      }

      var mx = mv.x,
          my = mv.y;
      
      if (map.navigationMode === "css-transforms") {
        var css = {};
        css[esri._css.names.transform] = esri._css.translate(mx, my);
        dojo.style(this._div, css);
      }
      else {
        dojo.style(this._div, {
          left: mx + "px", 
          top: my + "px"
        });
      }
      
      if (showing && !scale) {
        this.__coords_dx = mx;
        this.__coords_dy = my;
        this._updateImages(new esri.geometry.Rect(0, 0, mv.width, mv.height));

        if (this._loadingList.count === 0) {
          this.onUpdate();
          this._fireUpdateEnd();
        }
        else {
          this._fireOnUpdate = true;
        }
      }
      else {
        this._cleanUpRemovedImages();
      }

      //tile cleanup
      var coords, rect,
          tileW = this._tileW,
          tileH = this._tileH;
          mv = new esri.geometry.Rect(-mv.x, -mv.y, mv.width, mv.height);

      for (i=this._tileIds.length-1; i>=0; i--) {
        id = this._tileIds[i];
        if (id) {
          img = this._tiles[id];
          
          coords = dojo.coords(img);
          rect = new esri.geometry.Rect(coords.l, coords.t, tileW, tileH);
          if (map.navigationMode === "css-transforms") {
            rect.x = img._left;
            rect.y = img._top;
          }
          
          if (mv.intersects(rect)) {
            this._tileBounds[id] = rect;
          }
          else {
            if (this._loadingList.contains(id)) {
              this._tilePopPop(img);
            }
            dojo.destroy(img);
            this._tileIds.splice(i, 1);
            delete this._tileBounds[id];
            delete this._tiles[id];
          }
        }
        else {
          this._tileIds.splice(i, 1);
          delete this._tileBounds[id];
          delete this._tiles[id];
        }
      }
    },

    _onPanHandler: function(extent, delta) {
      var map = this._map,
          mv = map.__visibleDelta.offset(delta.x, delta.y);
          
      this.__coords_dx = this.__coords_dy = 0;
      
      if (map.navigationMode === "css-transforms") {
        var css = {};
        css[esri._css.names.transform] = esri._css.translate(mv.x, mv.y);
        dojo.style(this._div, css);
        
        if (!esri.isTouchEnabled) {
          this._updateImages({ x:-mv.x, y:-mv.y, width:mv.width, height:mv.height });
        }
      }
      else {
        dojo.style(this._div, {
          left: mv.x + "px", 
          top: mv.y + "px"
        });

        // TODO
        // On mobile, to compensate for not doing this update on pan, let's
        // fetch one more row and column of tiles on all sides of the map
        this._updateImages({ x:-mv.x, y:-mv.y, width:mv.width, height:mv.height });
      }
      
      // NOTE
      // Is it advisable to fire update start event on pan?
      // Depending on what the users do in the event handler,
      // this could slow down the actual update.
      // Users shouldn't be doing crazy things
      if (this._loadingList.count > 0) {
        this._fireUpdateStart();
        this._fireOnUpdate = true;
      }
    },
    
    _onScaleHandler: function(mtx, immediate) {
      // TODO
      // Need to stop adding new images to "passive" containers
      // Passives are obsolete anyway
      
      // NOTE
      // Chrome and Firefox seem to do sub-pixel scaling
      // for transitioning css transformations. This shows
      // up as white line between tiles while zooming in/out.
      
      var i, css = {}, names = esri._css.names, map = this._map;

      for (i = this._passives.length - 1; i >= 0; i--) {
        var passive = this._passives[i];
        if (passive.childNodes.length === 0) {
          // Cleanup unused passive nodes
          this._passives.splice(i, 1);
          dojo.destroy(passive);
        }
        else {
          // We set it to "none" onExtentChange. Let's re-set the
          // transition duration.
          if (passive.style[names.transition] === "none") {
            dojo.style(passive, names.transition, names.transformName + " " + esri.config.defaults.map.zoomDuration + "ms ease");
          }
          
          dojo.style(passive, names.transition, immediate ? "none" : (names.transformName + " " + esri.config.defaults.map.zoomDuration + "ms ease"));
          
          // Scale passives that still have old images
          //passive._matrix = dojox.gfx.matrix.multiply(mtx, passive._matrix);
          //css[names.transform] = esri._css.matrix(passive._matrix);
          passive._matrix = mtx;
          css[names.transform] = esri._css.matrix(
                                   passive._multiply ?
                                   dojox.gfx.matrix.multiply(mtx, passive._multiply) :
                                   mtx
                                 );
          
          //console.log("xply: " + dojo.toJson(css[names.transform]));
          dojo.style(passive, css);
          
          // _matrix holds the matrix applied since the previous onExtentChange
          // _multiply holds the matrix applied prior to the previous onExtentChange
        }
      }
      
      if (this._active && this._active.childNodes.length === 0) {
        // Active node is still fresh. No need to create another
        return;
      }

      dojo.style(this._active, names.transition, immediate ? "none" : (names.transformName + " " + esri.config.defaults.map.zoomDuration + "ms ease"));

      // Scale currently active node
      // http://docs.dojocampus.org/dojox/gfx/#transformations-around-a-point
      // http://www.w3.org/TR/css3-3d-transforms/#transform-functions
      this._active._matrix = mtx;
      css[names.transform] = esri._css.matrix(this._active._matrix);
      //console.log(dojo.toJson(css[names.transform]));
      dojo.style(this._active, css);
      
      // Push the active node into passive list and create a new active node
      // Note that any new img element will be appended to "active" node:
      // see _addImage function in this class
      this._passives.push(this._active);

      css = {
        position: "absolute", 
        width: map.width + "px", 
        height: map.height + "px", 
        overflow: "visible" 
      };
      css[names.transition] = names.transformName + " " + esri.config.defaults.map.zoomDuration + "ms ease";
      dojo.style((this._active = dojo.create("div", null, this._div)), css);
      this._active._remove = 0;
      if (map.fadeOnZoom) {
        dojo.place(this._active, this._div, "first");
      }
    },
    
    _onZoomHandler: function(/*esri.geometry.Extent*/ extent, /*Number*/ scale, /*esri.geometry.Point*/ anchor) {
      var coords = dojo.coords(this._div);
      anchor = anchor.offset(-coords.l, -coords.t);

      var bounds,
          sizeW = this._tileW * scale,
          sizeH = this._tileH * scale,
          _tileBounds = this._tileBounds,
          _tiles = this._tiles,
          es = dojo.style;
          
      var isIE = dojo.isIE;

      if (isIE && isIE < 8) {
        dojo.forEach(this._tileIds, function(id) {
          bounds = _tileBounds[id];
          es(_tiles[id], {  left:(bounds.x - ((sizeW - bounds.width) * (anchor.x - bounds.x) / bounds.width)) + "px",
                            top:(bounds.y - ((sizeH - bounds.height) * (anchor.y - bounds.y) / bounds.height)) + "px",
                            zoom:scale });
        });
      }
      else {
        dojo.forEach(this._tileIds, function(id) {
          bounds = _tileBounds[id];
        
          es(_tiles[id], {  left:(bounds.x - ((sizeW - bounds.width) * (anchor.x - bounds.x) / bounds.width)) + "px",
                            top:(bounds.y - ((sizeH - bounds.height) * (anchor.y - bounds.y) / bounds.height)) + "px",
                            width:sizeW + "px",
                            height:sizeH + "px" });
        });
      }
    },

    _updateImages: function(rect) {
      var id,
          _tw = this._tileW,
          _th = this._tileH,
          _ct = this._ct,
          lod = _ct.lod,
          tile = _ct.tile,
          off = tile.offsets,
          coords = tile.coords,
          cr = coords.row,
          cc = coords.col,
          level = lod.level,
          opacity = this.opacity,
          _tileIds = this._tileIds,
          _loadingList = this._loadingList,
          _addImage = this._addImage,
          mId = this._map.id,
          tId = this.id,
          rx = rect.x,
          ry = rect.y,
          str = lod.startTileRow,
          etr = lod.endTileRow,
          stc = lod.startTileCol,
          etc = lod.endTileCol,
          indexOf = dojo.indexOf,
          r, c,
          mvx = -rect.x,
          mvy = -rect.y,
          ct_offsetx = off.x - this.__coords_dx,
          ct_offsety = off.y - this.__coords_dy,
          vx = ((_tw - ct_offsetx) + mvx),
          vy = ((_th - ct_offsety) + mvy),
          ceil = Math.ceil,
          ct_viewx = (vx > 0) ? (vx % _tw) :  ( (_tw - (Math.abs(vx) % _tw)) ),
          ct_viewy = (vy > 0) ? (vy % _th) :  ( (_th - (Math.abs(vy) % _th)) ),
          colstart = (rx > 0) ? Math.floor( (rx+ct_offsetx)/_tw ) : ceil( (rx-(_tw-ct_offsetx))/_tw ),
          rowstart = (ry > 0) ? Math.floor( (ry+ct_offsety)/_th ) : ceil( (ry-(_th-ct_offsety))/_th ),
          colend = colstart + ceil( (rect.width - ct_viewx)/_tw ),
          rowend = rowstart + ceil( (rect.height - ct_viewy)/_th ),
          frameInfo, total_cols, m180, p180,
          col, row;
         
      if (this._wrap) {
        frameInfo = lod._frameInfo;
        total_cols = frameInfo[0]; 
        m180 = frameInfo[1]; 
        p180 = frameInfo[2];
      }

      for (col=colstart; col<=colend; col++) {
        for (row=rowstart; row<=rowend; row++) {
          r = cr + row;
          c = cc + col;

          // wrap tile coords into valid space if necessary
          if (this._wrap) {
            if (c < m180 /*&& c >= m360*/) {
              /*while (c < m180) {
                c += total_cols;
              }*/
              c = c % total_cols;
              c = c < m180 ? c + total_cols : c;
            }
            else if (c > p180 /*&& c <= p360*/) {
              /*while (c > p180) {
                c -= total_cols;
              }*/
              c = c % total_cols;
            }
          }

          if (r >= str && r <= etr && c >= stc && c <= etc) {
            id = mId + "_" + tId + "_tile_" + level + "_" + row + "_" + col;
            if (indexOf(_tileIds, id) === -1) {
              //console.log("level = " + level + ", row = " + r + ", col = " + c + ", x = " + ((_tw * col) - off.x) + ", y = " + ((_th * row) - off.y));
              
              _loadingList.add(id);
              _tileIds.push(id);
              _addImage(level, row, r, col, c, id, _tw, _th, opacity, tile, off);
            }
          }
        }
      }
    },

    _cleanUpRemovedImages: function() {
      //console.log("cleanup..", this.url);
      var list = this._removeList,
          dd = dojo.destroy, i, names = esri._css.names;
      
      list.forEach(function(img) {
        /*if (img._fadeOut) {
          dojo.style(img, esri._css.names.transition, "opacity 0.4s linear");
          dojo.style(img, "opacity", 0);
          img._next = "destroy";
        }
        else {*/
        if (!img._fadeOut) {
          img.style.filter = "";
          img.style.zoom = 1.0;
          dd(img);
        }
        //}
      });

      // _removeList is empty now. Let's cleanup unused passive nodes
      if (this._map.navigationMode === "css-transforms") {
        for (i = this._passives.length - 1; i >= 0; i--) {
          var passive = this._passives[i];
          if (passive.childNodes.length === 0) {
            this._passives.splice(i, 1);
            dd(passive);
          }
          else if (this._map.fadeOnZoom && !passive._marked && (passive._remove === passive.childNodes.length)) {
            dojo.style(passive, names.transition, "opacity 0.65s");
            dojo.style(passive, "opacity", 0);
            passive._marked = 1;
            //console.log("fadeout: " + passive.childNodes.length);
            if (dojo.isIE >= 10) {
              passive.addEventListener(names.endEvent, this._transitionEnd, false);
            }
            else {
              passive._endHandle = dojo.connect(passive, names.endEvent, this._transitionEnd);
            }
          }
        }
      }
      
      list.clear();
    },
    
    _transitionEnd: function(evt) {
      var passive = evt.target, idx;
      //console.log("event: " + evt.propertyName + passive.childNodes.length);
      if (evt.propertyName !== "opacity") {
        return;
      }
      
      if (dojo.isIE >= 10) {
        passive.removeEventListener(esri._css.names.endEvent, this._transitionEnd, false);
      }
      else {
        dojo.disconnect(passive._endHandle);
        passive._endHandle = null;
      }
      
      idx = dojo.indexOf(this._passives, passive);
      if (idx > -1) {
        this._passives.splice(idx, 1);
      }
      
      // TODO
      // Can we avoid removing+destroying passive nodes?
      // Perhaps hide them and later recycle
      
      // TODO
      // The following logic causes panning to break down in IE 10
      // (observed on samsung tablet). Also, from then on onGestureDoubleTap
      // stops firing. Probably on Android as well
      if (passive.parentNode) {
        passive.parentNode.removeChild(passive);
      }
      dojo.destroy(passive);
      //console.log("destroyed: " + passive.childNodes.length);
    },
    
    _addImage: function(level, row, r, col, c, id, tileW, tileH, opacity, tile, offsets) {
      if (this._patchIE) {
        var div = (this._tiles[id] = dojo.create("div"));
        
        div.id = id;
        dojo.addClass(div, "layerTile");
        dojo.style(div, {
          left:((tileW * col) - offsets.x) + "px",
          top:((tileH * row) - offsets.y) + "px",
          width:tileW + "px",
          height:tileH + "px",
          filter:"progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + this.getTileUrl(level, r, c) + "', sizingMethod='scale')"
        });
        
        if (opacity < 1) {
          dojo.style(div, "opacity", opacity);
        }

        var innerDiv = div.appendChild(dojo.create("div"));
        dojo.style(innerDiv, { opacity:0, width:tileW + "px", height:tileH + "px" });

        this._div.appendChild(div);
        div = null;
        
        this._loadingList.remove(id);
        this._fireOnUpdateEvent();
      }
      else {
        var img = (this._tiles[id] = dojo.create("img")),
            dc = dojo.connect;

        img.id = id;
        dojo.addClass(img, "layerTile");
        
        var left = (tileW * col) - offsets.x, top = (tileH * row) - offsets.y,
            map = this._map, names = esri._css.names,
            css = {
              width: tileW + "px", 
              height: tileH + "px",
              visibility: "hidden"
            };
        
        if (map.navigationMode === "css-transforms") {
          css[names.transform] = esri._css.translate(left, top);
          //css[names.transition] = "opacity 0.4s linear";
          //css.opacity = 0;
          dojo.style(img, css);

          img._left = left;
          img._top = top;
          //img._transition_connect = dc(img, names.endEvent, this, this._transitionEnd);
        }
        else {
          css.left = left + "px";
          css.top = top + "px";
          //css.visibility = "hidden";
          dojo.style(img, css);
        }

        if (opacity < 1) {
          dojo.style(img, "opacity", opacity);
        }

        img._onload_connect = dc(img, "onload", this, "_tileLoadHandler");
        img._onerror_connect = dc(img, "onerror", this, "_tileErrorHandler");
        img._onabort_connect = dc(img, "onabort", this, "_tileErrorHandler");

        var url = this.getTileUrl(level, r, c, img);
        if (url) {
          img.src = url;
        }
        
        if (map.navigationMode === "css-transforms") {
          this._active.appendChild(img);
        }
        else {
          this._div.appendChild(img);
        }
        
        img = null;
      }
    },
    
    /*_transitionEnd: function(evt) {
      var img = evt.currentTarget;
      //console.log("[end]");
      
      switch (img._next) {
        case "off":
          //console.log("off: " + img.id);
          dojo.style(img, esri._css.names.transition, "none");
          break;
        case "destroy":
          //console.log("destroy: " + img.id);
          dojo.disconnect(img._transition_connect);
          img._transition_connect = null;
          dojo.destroy(img);
          img._next = null;

          if (this._removeList.count === 0) {
            for (var i = this._passives.length - 1; i >= 0; i--) {
              var passive = this._passives[i];
              if (passive.childNodes.length === 0) {
                this._passives.splice(i, 1);
                dojo.destroy(passive);
              }
            }
          }
          break;
      }
    },*/
    
    getTileUrl: function(level, row, col) {
      //method to be implemented by child for url to retrieve tile images
    },
    
    refresh: function() {
      var ra = this._refreshArgs;
      this._onExtentChangeHandler(ra.extent, null, true, ra.lod);
    },
    
    _tilePopPop: function(img) {
      var dd = dojo.disconnect;

      dd(img._onload_connect);
      dd(img._onerror_connect);
      dd(img._onabort_connect);
      img._onload_connect = img._onerror_connect = img._onabort_connect = null;

      this._loadingList.remove(img.id);
      this._fireOnUpdateEvent();
    },

    _tileLoadHandler: function(evt) {
      var img = evt.currentTarget;

      if (this._noDom) {
        this._standby.push(img);
        return;
      }
      
      /*if (this._map.navigationMode === "css-transforms") {
        dojo.style(img, "opacity", this.opacity);
        img._next = "off";
      }
      else {*/
        dojo.style(img, "visibility", "visible");
      //}
      
      this._tilePopPop(img);
    },

    _tileErrorHandler: function(evt) {
      var img = evt.currentTarget;
      this.onError(new Error(esri.bundle.layers.tiled.tileError + ": " + img.src));
      dojo.style(img, "visibility", "hidden");
      this._tilePopPop(img);
    },
    
    _fireOnUpdateEvent: function() {
      if (this._loadingList.count === 0) {
        this._cleanUpRemovedImages();

        if (this._fireOnUpdate) {
          this._fireOnUpdate = false;
          this.onUpdate();
          this._fireUpdateEnd();
        }
      }
    },
    
    setOpacity: function(o) {
      if (this.opacity != o) {
        this.onOpacityChange(this.opacity = o);
      }
    },
    
    onOpacityChange: function() {},
    
    _opacityChangeHandler: function(/*Number*/ value) {
      //summary: Method to handle changing opacity on a layer
      var djs = dojo.style, i, j, nodes;
      
      if (this._map.navigationMode === "css-transforms") {
        if (this._active) {
          nodes = this._active.childNodes;
          for (i = nodes.length - 1; i >= 0; i--) {
            djs(nodes[i], "opacity", value);
          }
        }
  
        for (i = this._passives.length - 1; i >= 0; i--) {
          nodes = this._passives[i].childNodes;
          for (j = nodes.length - 1; j >=0; j--) {
            djs(nodes[j], "opacity", value);
          }
        }
        
        return;
      }
      
      nodes = this._div.childNodes;
      for (i = nodes.length - 1; i >= 0; i--) {
        djs(nodes[i], "opacity", value);
      }
    }
  }
);

dojo.declare("esri.layers.TileInfo", null, {
    constructor: function(json) {
      this.width = json.cols || json.width;
      this.height = json.rows || json.height;
      this.dpi = json.dpi;
      this.format = json.format;

      var sr = json.spatialReference, ori = json.origin;
      
      if (sr) {
        sr = (this.spatialReference = new esri.SpatialReference(sr.declaredClass ? sr.toJson() : sr));
      }
      
      if (ori) { // "Hallowed are the Ori"
        ori = (this.origin = new esri.geometry.Point(ori.declaredClass ? ori.toJson() : ori));
        
        if (!ori.spatialReference && sr) {
          ori.setSpatialReference(new esri.SpatialReference(sr.toJson()));
        }
      }
      
      var lods = (this.lods = []);
      dojo.forEach(json.lods, function(lod, i) {
        lods[i] = new esri.layers.LOD(lod);
      });
    }
  }
);

dojo.declare("esri.layers.LOD", null, {
    constructor: function(json) {
      dojo.mixin(this, json);
    }
  }
);
});
