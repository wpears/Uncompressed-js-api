//>>built
// wrapped by build app
define("esri/layers/dynamic", ["dijit","dojo","dojox","dojo/require!esri/layers/layer,esri/geometry,dojox/xml/parser,dojox/gfx/matrix"], function(dijit,dojo,dojox){
dojo.provide("esri.layers.dynamic");

dojo.require("esri.layers.layer");
dojo.require("esri.geometry");
dojo.require("dojox.xml.parser");
dojo.require("dojox.gfx.matrix");

dojo.declare("esri.layers.DynamicMapServiceLayer", esri.layers.Layer, {
    constructor: function(/*String*/ url, /*Object?*/ options) {
      this.useMapTime = (options && options.hasOwnProperty("useMapTime")) ? 
                        (!!options.useMapTime) : 
                        true;
      
      var hitch = dojo.hitch;
      this._exportMapImageHandler = hitch(this, this._exportMapImageHandler);
      this._imgSrcFunc = hitch(this, this._imgSrcFunc);
      this._divAlphaImageFunc = hitch(this, this._divAlphaImageFunc);
      this._tileLoadHandler = hitch(this, this._tileLoadHandler);
      this._tileErrorHandler = hitch(this, this._tileErrorHandler);
    },

    opacity: 1,
    isPNG32: false,
  
    _setMap: function(map, container, index) {
      this._map = map;

      var d = (this._div = dojo.create("div", null, container)),
          names = esri._css.names,
          css = {
            position: "absolute", 
            width: map.width + "px", 
            height: map.height + "px", 
            overflow: "visible", 
            opacity: this.opacity 
          },
          isIE = dojo.isIE,
          connect = dojo.connect,
          vd = map.__visibleDelta;
          
      if (isIE && isIE > 7) {
        delete css.opacity;
      }
      
      if (map.navigationMode === "css-transforms") {
        // Without visibleDelta, scaling anchor is correct only when
        // this layer is added before any map pan has occured.
        css[names.transform] = esri._css.translate(vd.x, vd.y);
        dojo.style(d, css);

        this._onScaleHandler_connect = connect(map, "onScale", this, this._onScaleHandler);
        this._left = vd.x; 
        this._top = vd.y;
      }
      else {
        css.left = "0px";
        css.top = "0px";
        dojo.style(d, css);
        this._onZoomHandler_connect = connect(map, "onZoom", this, "_onZoomHandler");
        this._left = this._top = 0;
      }
      
      dojo.style(d, css);
      
      this._onPanHandler_connect = connect(map, "onPan", this, "_onPanHandler");
      this._onExtentChangeHandler_connect = connect(map, "onExtentChange", this, "_onExtentChangeHandler");
      this._onResizeHandler_connect = connect(map, "onResize", this, "_onResizeHandler");
      this._opacityChangeHandler_connect = connect(this, "onOpacityChange", this, "_opacityChangeHandler");
      this._visibilityChangeHandler_connect = connect(this, "onVisibilityChange", this, "_visibilityChangeHandler");
      this._toggleTime();

      this._layerIndex = index;
      this._img_loading = null;
      this._dragOrigin = { x:0, y:0 };

      if (!this.visible) {
        this._visibilityChangeHandler(this.visible);
      }
      else if (map.extent && map.loaded) {
        this._onExtentChangeHandler(map.extent);
      }
      
      return d;
    },
    
    _unsetMap: function(map, container) {
      /*if (container) {
        this._div = container.removeChild(this._div);
      }*/
      dojo.destroy(this._div);
      this._map = this._layerIndex = this._div = null;
      
      var disconnect = dojo.disconnect;
      disconnect(this._onPanHandler_connect);
      disconnect(this._onExtentChangeHandler_connect);
      disconnect(this._onZoomHandler_connect);
      disconnect(this._onScaleHandler_connect);
      disconnect(this._onResizeHandler_connect);
      disconnect(this._opacityChangeHandler_connect);
      disconnect(this._visibilityChangeHandler_connect);
      this._toggleTime();
    },
    
    _onResizeHandler: function(extent, width, height) {
      dojo.style(this._div, { width:width + "px", height:height + "px" });
      this._onExtentChangeHandler(extent);
    },

    _visibilityChangeHandler: function(v) {
      var connect = dojo.connect,
          disconnect = dojo.disconnect,
          map = this._map;

      this._toggleTime();

      if (v) {
        // We need to sync our div with map here, because map have been panned 
        // while this layer was hidden
        if (map.navigationMode === "css-transforms") {
          var vd = map.__visibleDelta;
          this._left = vd.x;
          this._top =  vd.y;
          dojo.style(this._div, esri._css.names.transform, esri._css.translate(this._left, this._top));
        }

        this._onExtentChangeHandler(map.extent);
        this._onPanHandler_connect = connect(map, "onPan", this, "_onPanHandler");              
        this._onExtentChangeHandler_connect = connect(map, "onExtentChange", this, "_onExtentChangeHandler");
        if (map.navigationMode === "css-transforms") {
          this._onScaleHandler_connect = connect(map, "onScale", this, this._onScaleHandler);
        }
        else {
          this._onZoomHandler_connect = connect(map, "onZoom", this, "_onZoomHandler");
        }
      }
      else {
        esri.hide(this._div);
        disconnect(this._onPanHandler_connect);
        disconnect(this._onExtentChangeHandler_connect);
        disconnect(this._onZoomHandler_connect);
        disconnect(this._onScaleHandler_connect);
      }
    },
    
    _toggleTime: function() {
      var map = this._map;
      
      // Listen for map timeextent change when all controlling factors are ON
      // Disconnect from map when one of the controlling factors is OFF
      // Note that this method should be called when the state of a  
      // controlling factor changes.
      
      if (this.timeInfo && this.useMapTime && map && this.visible) {
        if (!this._timeConnect) {
          this._timeConnect = dojo.connect(map, "onTimeExtentChange", this, this._onTimeExtentChangeHandler);
        }
        
        this._setTime(map.timeExtent);
      }
      else {
        dojo.disconnect(this._timeConnect);
        this._timeConnect = null;
        this._setTime(null);
      }
    },
    
    _setTime: function(timeExtent) {
      if (this._params) {
        this._params.time = timeExtent ? timeExtent.toJson().join(",") : null;
      }
    },

    _onPanHandler: function(extent, delta) {
      this._panDx = delta.x;
      this._panDy = delta.y;

      var dragOrigin = this._dragOrigin,
          vd = this._map.__visibleDelta,
          img = this._img;
          
      if (img) {
        if (this._map.navigationMode === "css-transforms") {
          this._left = vd.x + delta.x;
          this._top =  vd.y + delta.y;
          dojo.style(this._div, esri._css.names.transform, esri._css.translate(this._left, this._top));
        }
        else {
          dojo.style(img, {
            left: (dragOrigin.x + delta.x) + "px",
            top: (dragOrigin.y + delta.y) + "px"
          });
        }
      }
    },
    
    _onExtentChangeHandler: function(extent, delta, levelChange) {
      if (! this.visible) {
        return;
      }
      
      var _m = this._map,
          // params = this._getImageParams(_m, extent),
          _i = this._img,
          _istyle = _i && _i.style,
          _do = this._dragOrigin;

      // See GraphicsLayer::_onPanEndUpdateHandler for details on the bug
      // that this piece of code fixes.
      // Ideally, we want to do this onPanEnd like in GraphicsLayer, but 
      // works just as well here. We don't have to attach another event
      // handler just to do this.
      if (delta && !levelChange && _i && (delta.x !== this._panDx || delta.y !== this._panDy)) {
        if (_m.navigationMode === "css-transforms") {
          var vd = _m.__visibleDelta;
          this._left = vd.x;
          this._top =  vd.y;
          dojo.style(this._div, esri._css.names.transform, esri._css.translate(this._left, this._top));
        }
        else {
          dojo.style(_i, { left: (_do.x + delta.x) + "px", top: (_do.y + delta.y) + "px" });
        }
      }

      // Record the current position of the image. Will need 
      // this in _onPanHandler() if the user starts to drag the map
      // while the new image is still loading.
      if (_i) {
        _do.x = parseInt(_istyle.left, 10);
        _do.y = parseInt(_istyle.top, 10);
      }
      else {
        _do.x = (_do.y = 0);
      }
      
      if (_m.navigationMode === "css-transforms") {
        if (levelChange && _i) {
          // Conclude transition *now*
          dojo.style(_i, esri._css.names.transition, "none");
          
          // Let's remember the current matrix so that when the
          // next scaling begins before the new map image loads,
          // we can apply the matrix
          _i._multiply = _i._multiply ? 
                         dojox.gfx.matrix.multiply(_i._matrix, _i._multiply) : 
                         _i._matrix;
        }
      }

      //if (window._halt) return;
      
      this._fireUpdateStart();

      // If an image is already loading, abort it. Why?
      // Because, we are now here as the user has changed the extent and
      // hence the image that is already loading is obsolete.
      // if (this._img_onload_connect) {
      var loading = this._img_loading;
      if (loading) {
        dojo.disconnect(loading._onload_connect);
        dojo.disconnect(loading._onerror_connect);
        dojo.disconnect(loading._onabort_connect);
        dojo.destroy(loading);
        this._img_loading = null;
        
        // _jsonRequest is used if useMapImage option is enabled.
        // see also getImageUrl in agsdynamic.js
        var request = this._jsonRequest;
        if (request) {
          try {
            request.cancel();
          }
          catch(e) {}
          this._jsonRequest = null;
        }
      }
      
      if (this.version >= 10 && _m.wrapAround180 /*&& _m.spatialReference._isWrappable()*/) {
        //extent = extent._shiftCM();
        extent = extent._normalize(true);
        // _shiftCM caches the result. So, multiple dynamic map service layers
        // can reuse it.
      }

      if (this.isPNG32) {
        var div = (this._img_loading = dojo.create("div"));
        div.id = _m.id + "_" + this.id + "_" + new Date().getTime();
        dojo.style(div, { position:"absolute", left:"0px", top:"0px", width:_m.width+"px", height:_m.height+"px" });
        
        var innerDiv = div.appendChild(dojo.create("div"));
        dojo.style(innerDiv, { opacity:0, width:_m.width + "px", height:_m.height + "px" });
        
        this.getImageUrl(extent, _m.width, _m.height, this._divAlphaImageFunc);
        div = null;
      }
      else {
        var img = (this._img_loading = dojo.create("img")),
            names = esri._css.names,
            isIE = dojo.isIE,
            css = { 
              position: "absolute", 
              width: _m.width + "px", 
              height: _m.height + "px" 
            };

        if (isIE && isIE > 7) {
          css.opacity = this.opacity;
        }
        
        if (_m.navigationMode === "css-transforms") {
          css[names.transform] = esri._css.translate(-this._left, -this._top);
          img._tdx = -this._left;
          img._tdy = -this._top;
          css[names.transition] = names.transformName + " " + esri.config.defaults.map.zoomDuration + "ms ease";
        }
        else {
          css.left = "0px";
          css.top = "0px";
        }

        img.id = _m.id + "_" + this.id + "_" + new Date().getTime();
        dojo.style(img, css);

        img._onload_connect = dojo.connect(img, "onload", this, "_onLoadHandler");
        img._onerror_connect = dojo.connect(img, "onerror", this, "_onErrorHandler");
        img._onabort_connect = dojo.connect(img, "onabort", this, "_onErrorHandler");
        
        // need to place this *before* getImageUrl() as the image might be fetched from the browser cache (and _onLoadHandler called immediately)
        // and we don't want to be incorrect after getImageUrl() 
        this._startRect = { left: _do.x, top: _do.y, width: _i ? parseInt(_istyle.width, 10) : _m.width, height: _i ? parseInt(_istyle.height, 10) : _m.height, zoom: (_istyle && _istyle.zoom) ? parseFloat(_istyle.zoom) : 1 };
      
        this.getImageUrl(extent, _m.width, _m.height, this._imgSrcFunc);
        img = null;
      }
    },
    
    _onTimeExtentChangeHandler : function(timeExtent){
      if (! this.visible) {
        return;
      }
      
      this._setTime(timeExtent);
      this.refresh(true);            
    },
       
    getImageUrl: function(extent, wd, ht, callback) {
      //function to be implemented by extending class to provide an image
    },
    
    _imgSrcFunc: function(src) {
      this._img_loading.src = src;
    },
    
    _divAlphaImageFunc: function(src) {
      dojo.style(this._img_loading, "filter", "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + src + "', sizingMethod='scale')");
      this._onLoadHandler({ currentTarget:this._img_loading });
    },
    
    _onLoadHandler: function(evt) {
      var img = evt.currentTarget,
          disconnect = dojo.disconnect,
          _m = this._map;
      
      disconnect(img._onload_connect);
      disconnect(img._onerror_connect);
      disconnect(img._onabort_connect);

      if (! _m || _m.__panning || _m.__zooming) { // Is map in the middle of panning? (eg: user dragging) then ABORT
        dojo.destroy(img);
        this._fireUpdateEnd();
        return;
      }

      // var cn = _d.childNodes;
      // if (dojo.isIE) {
      //   for (var i=0, il=cn.length; i<il; i++) {
      //     cn.item(i).setAttribute("src", null);
      //   }
      // }

      // TODO
      // Remove this XML parser dependency
      dojox.xml.parser.removeChildren(this._div);
      this._img = img;
      this._startRect = { left: 0, top: 0, width: _m.width, height: _m.height, zoom: 1 };
      this._div.appendChild(img);

      // This line was moved from _visibilityChangeHandler() to here.
      // Fixes the following problem:
      // 1. Add a tiled layer and a dynamic layer to the map.
      // 2. 'Hide' the dynamic layer
      // 3. Drag on the map to change its extent
      // 4. 'Show' the dynamic layer --> it'll show up in its previous position 
      //    and only then load the new image for the current extent.
      // TODO: What about similar scenario for a tiled layer ??
      if (this.visible) {
        esri.show(this._div);
      }

      img._onload_connect = img._onerror_connect = img._onabort_connect = this._img_loading = null;
      var _do = this._dragOrigin;
      _do.x = (_do.y = 0);

      this.onUpdate();
      this._fireUpdateEnd();
    },

    _onErrorHandler: function(evt) {
      var img = evt.currentTarget,
          disconnect = dojo.disconnect;
      dojo.style(img, "visibility", "hidden");

      disconnect(img._onload_connect);
      disconnect(img._onerror_connect);
      disconnect(img._onabort_connect);
      img._onload_connect = img._onerror_connect = img._onabort_connect = null;
      
      var error = new Error(esri.bundle.layers.dynamic.imageError + ": " + img.src);
      this.onError(error);
      this._fireUpdateEnd(error);
    },
    
    setUseMapTime: function(/*Boolean*/ use, /*Boolean?*/ doNotRefresh) {
      this.useMapTime = use;
      this._toggleTime();
      
      if (!doNotRefresh) {
        this.refresh(true);
      }
    },

    refresh: function() {
      if (this._map) {
        this._onExtentChangeHandler(this._map.extent);
      }
    },
    
    _onScaleHandler: function(mtx, immediate) {
      var css = {}, names = esri._css.names,
          img = this._img;
      
      if (!img) {
        return;
      }
      
      dojo.style(img, names.transition, immediate ? "none" : (names.transformName + " " + esri.config.defaults.map.zoomDuration + "ms ease"));
      
      img._matrix = mtx;
      
      // "_multiply" has the transformation applied to the image during the 
      // previous zoom sequence (in case a new image has not been loaded
      // yet after the previous sequence)
      // Map sends the cumulative transformation for this sequence in "mtx" 
      mtx = img._multiply ?
            dojox.gfx.matrix.multiply(mtx, img._multiply) :
            mtx;
      
      // The image may contain its own translation as well. We can get
      // it from _tdx and _tdy
      if (img._tdx || img._tdy) {
        mtx = dojox.gfx.matrix.multiply(mtx, {
          "xx": 1,"xy": 0,"yx": 0,"yy": 1,
          "dx": img._tdx,
          "dy": img._tdy
        });
      }
      
      css[names.transform] = esri._css.matrix(mtx);
      //console.log("xply: " + dojo.toJson(css[names.transform]));
      dojo.style(img, css);
    },

    _onZoomHandler: function(extent, scale, anchor) {
      var start = this._startRect,
          targetWidth = start.width * scale, 
          targetHeight = start.height * scale,
          img = this._img, isIE = dojo.isIE;
          
      if (img) {
        if (isIE && isIE < 8) {
          dojo.style(img, {
            left: (start.left - ((targetWidth - start.width) * (anchor.x - start.left) / start.width)) + "px",
            top: (start.top - ((targetHeight - start.height) * (anchor.y - start.top) / start.height)) + "px",
            zoom: scale * start.zoom
          });
        }
        else {
          dojo.style(img, {
            left: (start.left - ((targetWidth - start.width) * (anchor.x - start.left) / start.width)) + "px",
            top: (start.top - ((targetHeight - start.height) * (anchor.y - start.top) / start.height)) + "px",
            width: targetWidth + "px",
            height: targetHeight + "px"
          });
        }
      }
    },
    
    _exportMapImage: function(url, params, callback) {
      var _h = this._exportMapImageHandler;
      
      params.token = this._getToken();
      
      esri.request({
        url: url,
        content: params,
        callbackParamName: "callback",
        load: function() { _h(arguments[0], arguments[1], callback); },
        error: esri.config.defaults.io.errorHandler
      });
    },
    
    _exportMapImageHandler: function(response, io, callback) {
      var mapImage = new esri.layers.MapImage(response);
      this.onMapImageExport(mapImage);
      if (callback) {
        callback(mapImage);
      }
    },

    onMapImageExport: function() {
      //summary: Event fired when exportMapImage completes
      // args[0]: esri.layers.MapImage: Map image returned from server
    },
    
    setOpacity: function(o) {
      if (this.opacity != o) {
        this.onOpacityChange(this.opacity = o);
      }
    },
    
    onOpacityChange: function() {
    },
    
    _opacityChangeHandler: function(value) {
      dojo.style(this._div, "opacity", value);
    }
  }
);
});
