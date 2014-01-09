//>>built
// wrapped by build app
define("esri/layers/MapImageLayer", ["dijit","dojo","dojox","dojo/require!esri/utils,esri/layers/layer,esri/geometry"], function(dijit,dojo,dojox){
dojo.provide("esri.layers.MapImageLayer");

dojo.require("esri.utils");
dojo.require("esri.layers.layer");
dojo.require("esri.geometry");

// TODO
// Fire update events?
//
// How can I create map images from exportMap that behaves like a ground overlay? Looks like
//  I overlooked the part where the server may adjust the extent - this extent should
//  be used when adding the map image to this layer

dojo.declare("esri.layers.MapImageLayer", [ esri.layers.Layer ], {
    "-chains-": {
      // Incompatible constructor arguments with "Layer". So let's cut-off
      // the inheritance chain. Note also that sub-classes have
      // to explicitly call the ctor of this class like this:
      // this.inherited(arguments);
      constructor: "manual"
    },

    constructor: function(options) {
      // Handle options
      this.inherited(arguments, [null, options]);
      
      // TODO
      // Use a simple dictionary instead?
      this._mapImages = [];
      
      var hitch = dojo.hitch;
      this._panStart = hitch(this, this._panStart);
      this._pan = hitch(this, this._pan);
      this._extentChange = hitch(this, this._extentChange);
      this._zoom = hitch(this, this._zoom);
      this._zoomStart = hitch(this, this._zoomStart);
      this._scale = hitch(this, this._scale);
      this._resize = hitch(this, this._resize);
      
      this.loaded = true;
      this.onLoad(this);
    },

    opacity: 1,
    
    // MozTransform/WebkitTransform/msTransform/OTransform
    // See esri/utils.js
    _transform: esri._getDOMAccessor("transform"),
    
    /*****************
     * Public Methods
     *****************/
    
    addImage: function(mapImage) {
      //console.log("add");
      
      // TODO
      // What if this mapImage is already added to this layer
      // or some other layer?
      
      var newLen = this._mapImages.push(mapImage);
      newLen = newLen - 1;

      mapImage._idx = newLen;
      mapImage._layer = this;
      
      if (this._div) {
        this._createImage(mapImage, newLen);
      }
    },
    
    removeImage: function(mapImage) {
      //console.log("remove");
      
      if (mapImage) {
        var idx = mapImage._idx, mapImages = this._mapImages;
            
        if (mapImages[idx] === mapImage) {
          delete mapImages[idx];
          
          var node = mapImage._node;
          if (node) {
            this._clearEvents(node);
            
            node.e_idx = node.e_bl = node.e_tr = 
            node.e_l = node.e_t = node.e_w = node.e_h = null;
            
            // https://developer.mozilla.org/En/DOM/Node.parentNode
            // http://reference.sitepoint.com/javascript/Node/parentNode
            // http://www.quirksmode.org/dom/w3c_core.html
            if (node.parentNode) {
              node.parentNode.removeChild(node);
              dojo.destroy(node);
            }
          }
          
          mapImage._node = mapImage._idx = mapImage._layer = null;
        }
      }
    },
    
    removeAllImages: function() {
      var mapImages = this._mapImages, i, len = mapImages.length;
      
      for (i = 0; i < len; i++) {
        var mapImage = mapImages[i];
        
        if (mapImage) {
          this.removeImage(mapImage);
        }
      }
      
      this._mapImages = [];
    },
    
    getImages: function() {
      var mapImages = this._mapImages, retVal = [], 
          i, len = mapImages.length;
      
      for (i = 0; i < len; i++) {
        if (mapImages[i]) {
          retVal.push(mapImages[i]);
        }
      }
      
      return retVal;
    },
    
    setOpacity: function(opacity) {
      if (this.opacity != opacity) {
        this.onOpacityChange(this.opacity = opacity);
      }
    },
    
    /*********
     * Events
     *********/
    
    onOpacityChange: function(value) {
      var div = this._div, i, len, nodes;
      
      if (div) {
        if (!dojo.isIE || dojo.isIE > 8) {
          dojo.style(div, "opacity", value);
        }
        else {
          nodes = div.childNodes;
          len = nodes.length;
          
          for (i = 0; i < len; i++) {
            dojo.style(nodes[i], "opacity", value);
          }
        }
      }
    },
    
    /*******************
     * Internal Methods
     *******************/
    
    _createImage: function(mapImage, idx) {
      var node = dojo.create("img");
      
      dojo.style(node, { position: "absolute" });

      if (dojo.isIE <= 8) {
        dojo.style(node, "opacity", this.opacity);
      }
      
      if (mapImage.rotation) {
        var transformFunc = "rotate(" + (360 - mapImage.rotation) + "deg)";
        
        if (dojo.isIE < 9) {
          // TODO
          // Options:
          // 1. Do not show this image if impl is not possible
          // 2. Use IE filters for implementation. See documents lilsted
          //    below for help.
          // References:
          // https://developer.mozilla.org/En/CSS/-moz-transform
          // http://msdn.microsoft.com/en-us/library/ms532847%28v=vs.85%29.aspx
          // http://msdn.microsoft.com/en-us/library/bb554293%28v=vs.85%29.aspx
          // http://msdn.microsoft.com/en-us/library/ms532972%28v=vs.85%29.aspx
          // http://msdn.microsoft.com/en-us/library/ms537452%28v=VS.85%29.aspx
          // http://msdn.microsoft.com/en-us/library/ms533014%28VS.85,loband%29.aspx
          // http://blog.siteroller.net/cross-browser-css-rotation
          // http://www.useragentman.com/blog/2010/03/09/cross-browser-css-transforms-even-in-ie/
          // http://robertnyman.com/css3/css-transitions/css-transitions-mac-os-x-stacks.html
          // http://www.useragentman.com/IETransformsTranslator/
          // https://github.com/heygrady/transform/wiki/correcting-transform-origin-and-translate-in-ie
          // Examples:
          // http://www.useragentman.com/tests/cssSandpaper/rotateTest.html
          // http://samples.msdn.microsoft.com/workshop/samples/author/dhtml/filters/matrix.htm
          // http://samples.msdn.microsoft.com/workshop/samples/author/dhtml/filters/matrix.htm
          // http://siteroller.net/archive/blog/rotate.htm
          // http://samples.msdn.microsoft.com/workshop/samples/author/filter/BasicImage.htm
          // ... ...
          // ... and oh yes, don't forget to check if the stars are aligned.
          // Good Luck!
        }
        else {
          dojo.style(node, this._transform, transformFunc);
          dojo.style(node, "transform", transformFunc);
        }
      }

      mapImage._node = node;
      
      node.e_idx = idx;
      node.e_layer = this;
      node.e_load = dojo.connect(node, "onload", esri.layers.MapImageLayer.prototype._imageLoaded);
      node.e_error = dojo.connect(node, "onerror", esri.layers.MapImageLayer.prototype._imageError);
      node.e_abort = dojo.connect(node, "onabort", esri.layers.MapImageLayer.prototype._imageError);
      
      node.src = mapImage.href;
    },
    
    _imageLoaded: function(evt, img) {
      // TODO
      // May have to call dojo.fixEvent to normalize properties
      //console.log("_imageLoaded: ", evt, evt.target || evt.currentTarget);
      var node = img || evt.target || evt.currentTarget, self = node.e_layer,
          mapImage = self._mapImages[node.e_idx];

      if (self._map && (self._map.__zooming || self._map.__panning)) {
        // Ideally we'd just want to push the "evt" object, but in Chrome
        // event object doesn't seem to have null target when this method is 
        // called later.
        self._standby.push(node);
        return;
      }

      self._clearEvents(node);
      
      if (!mapImage || mapImage._node !== node) {
        // Unknown image node 
        return;
      }
      
      // "map" may not be available at this point because this layer has not
      // been added to the map yet. So check.
      if (self._map) {
        self._attach(mapImage);
      }
    },
    
    _imageError: function(evt) {
      //console.log("_imageError: ", evt, evt.target || evt.currentTarget);
      
      var node = evt.target || evt.currentTarget, self = node.e_layer,
          mapImage = self._mapImages[node.e_idx];

      self._clearEvents(node);
      
      if (mapImage) {
        mapImage._node = null;
      }
    },
    
    _clearEvents: function(node) {
      var disconnect = dojo.disconnect;
      disconnect(node.e_load);
      disconnect(node.e_error);
      disconnect(node.e_abort);
      
      // "delete" operator on DOM nodes not allowed in IE (7,8?)
      node.e_load = node.e_error = node.e_abort = node.e_layer = null;
    },
    
    _attach: function(mapImage) {
      // This method should be called once for each mapImage
      
      var extent = mapImage.extent, match,
          envSR = extent.spatialReference, mapSR = this._sr,
          div = this._div,
          node = mapImage._node,
          bottomLeft = new esri.geometry.Point({ x: extent.xmin, y: extent.ymin }),
          topRight = new esri.geometry.Point({ x: extent.xmax, y: extent.ymax });
    
      // TODO
      // We don't need this logic if we say that the users have to 
      // provide the extent in the spatial reference of the map
      // Check if mapSR and envSR match
      if (mapSR.wkid) {
        match = (mapSR._isWebMercator() && envSR._isWebMercator()) || (mapSR.wkid === envSR.wkid);
      }
      else if (mapSR.wkt) {
        match = (mapSR.wkt === envSR.wkt);
      }
  
      // if they don't match, convert them on the client if possible
      if (!match) {
        if (mapSR._isWebMercator() && envSR.wkid === 4326) {
          bottomLeft = esri.geometry.geographicToWebMercator(bottomLeft);
          topRight = esri.geometry.geographicToWebMercator(topRight);
        }
        else if (envSR._isWebMercator() && mapSR.wkid === 4326) {
          bottomLeft = esri.geometry.webMercatorToGeographic(bottomLeft);
          topRight = esri.geometry.webMercatorToGeographic(topRight);
        }
      }

      node.e_bl = bottomLeft;
      node.e_tr = topRight;
      
      if (mapImage.visible) {
        //this._setPos(node, dojo.style(div, "left"), dojo.style(div, "top"));
        this._setPos(node, div._left, div._top);
        (this._active || div).appendChild(node);
      }
    },
    
    _setPos: function(node, divLeft, divTop) {
      var bottomLeft = node.e_bl,
          topRight = node.e_tr,
          map = this._map;
    
      //console.log(dojo.toJson(bottomLeft.toJson()));
      //console.log(dojo.toJson(topRight.toJson()));
    
      bottomLeft = map.toScreen(bottomLeft);
      topRight = map.toScreen(topRight);
      
      var left = bottomLeft.x - divLeft,
          top = topRight.y - divTop,
          width = Math.abs(topRight.x - bottomLeft.x),
          height = Math.abs(bottomLeft.y - topRight.y),
          css = {
            width: width + "px",
            height: height + "px"
          },
          mapImage = this._mapImages[node.e_idx];
      
      if (map.navigationMode === "css-transforms") {
        css[esri._css.names.transform] = esri._css.translate(left, top) + 
                                         (mapImage.rotation ? (" " + esri._css.rotate(360 - mapImage.rotation)) : "");
      }
      else {
        css.left = left + "px";
        css.top = top + "px";
      }

      dojo.style(node, css);
      
      node.e_l = left;
      node.e_t = top;
      node.e_w = width;
      node.e_h = height;
    },
    
    /************
     * Layer API
     ************/

    _setMap: function(map, container) {
      //console.log("_setMap");
      this._map = map;
      this._sr = map.spatialReference;
      
      // TODO
      // IE doesn't honor "style" as a property of the second arg to dojo.create
      // 7,8?

      var div = this._div = dojo.create("div", null, container),
          names = esri._css.names,
          css = { position: "absolute" },
          vd = map.__visibleDelta;
      
      if (!dojo.isIE || dojo.isIE > 8) {
        css.opacity = this.opacity;
      }
      
      if (map.navigationMode === "css-transforms") {
        // Without visibleDelta, scaling anchor is correct only when
        // this layer is added before any map pan has occured.
        css[names.transform] = esri._css.translate(vd.x, vd.y);
        dojo.style(div, css);
        div._left = vd.x;
        div._top = vd.y;
        
        // These divs will let us perform scale animation
        css = {
          position: "absolute", 
          width: map.width + "px", 
          height: map.height + "px", 
          overflow: "visible" 
        };
        this._active = dojo.create("div", null, div);
        dojo.style(this._active, css);

        this._passive = dojo.create("div", null, div);
        dojo.style(this._passive, css);
      }
      else {
        div._left = 0;
        div._top = 0;
        dojo.style(div, css);
      }

      // "_left" and "_top" will hold the current positioning
      // of this layer. They are used regardless of the map's
      // navigation mode
      this._standby = [];
      
      // What if the layer already has some map images when this method
      // is called by the map? Let's draw them now.
      var mapImages = this._mapImages, i, len = mapImages.length;
      for (i = 0; i < len; i++) {
        var mapImage = mapImages[i], node = mapImage._node;
        
        if (!node) {
          this._createImage(mapImage, mapImage._idx);
        }
        
        /*if (mapImage && node && !node.e_load) { // only a successfully loaded mapimage will "have node" and "no e_load"
          this._attach(mapImage);
        }*/
      }
      
      this.onVisibilityChange(this.visible); 
      
      return div;
    },

    _unsetMap: function(map, container) {
      //console.log("_unsetMap");
      this._disconnect();
      
      var div = this._div;
      if (div) {
        // Detach map images (if any) from their nodes
        var mapImages = this._mapImages, i, len = mapImages.length;
        for (i = 0; i < len; i++) {
          var mapImage = mapImages[i];
          if (mapImage) {
            var node = mapImage._node;
            if (node) {
              this._clearEvents(node);
              
              node.e_idx = node.e_bl = node.e_tr = 
              node.e_l = node.e_t = node.e_w = node.e_h = null;
            }
            
            mapImage._node = null;
          }
        }

        // Destroy DOM structure
        container.removeChild(div);
        dojo.destroy(div);
      }
      
      this._map = this._div = this._sr = this._active = this._passive = this._standby = null;
    },
  
    onVisibilityChange: function(isVisible) {
      var div = this._div;
      
      if (div) {
        if (isVisible) {
          this._redraw();
          this._connect(this._map);
          esri.show(div);
        }
        else {
          this._disconnect();
          esri.hide(div);
        }
      }
    },
    
    /*****************
     * Event Handlers
     *****************/
    
    _connect: function(map) {
      if (!this._connections) {
        var connect = dojo.connect,
            hasTransforms = (map.navigationMode === "css-transforms");
        
        this._connections = [
          connect(map, "onPanStart", this._panStart),
          connect(map, "onPan", this._pan),
          connect(map, "onExtentChange", this._extentChange),
          
          hasTransforms && connect(map, "onZoomStart", this._zoomStart),
          hasTransforms ? 
            connect(map, "onScale", this._scale) : 
            connect(map, "onZoom", this._zoom),
          hasTransforms && connect(map, "onResize", this._resize)
        ];
      }
    },
    
    _disconnect: function() {
      if (this._connections) {
        dojo.forEach(this._connections, dojo.disconnect);
        this._connections = null;
      }
    },
    
    _panStart: function() {
      this._panL = this._div._left; // dojo.style(this._div, "left");
      this._panT = this._div._top; // dojo.style(this._div, "top");
      //console.log("pan start: ", this._panL, this._panT);
    },
    
    _pan: function(extent, delta) {
      //console.log("_pan: ", dojo.toJson(delta.toJson()));
      
      var div = this._div;
      div._left = this._panL + delta.x;
      div._top = this._panT + delta.y;
      
      if (this._map.navigationMode === "css-transforms") {
        dojo.style(div, esri._css.names.transform, esri._css.translate(div._left, div._top));
      }
      else {
        dojo.style(div, {
          left: div._left + "px",
          top: div._top + "px"
        });
      }
    },
    
    _extentChange: function(extent, delta, levelChange) {
      if (levelChange) {
        this._redraw(this._map.navigationMode === "css-transforms");
      }
      else {
        if (delta) {
          /*dojo.style(this._div, {
            left: this._panL + delta.x + "px",
            top: this._panT + delta.y + "px"
          });*/
          this._pan(extent, delta);
        }
      }
    
      // Let's process pending images waiting to handle their
      // "load" event.
      var i, standby = this._standby;
      if (standby && standby.length) {
        for (i = standby.length - 1; i >= 0; i--) {
          this._imageLoaded(null, standby[i]);
          standby.splice(i, 1);
        }
      }
    },
    
    _redraw: function(reclaim) {
      if (reclaim) {
        var passive = this._passive, names = esri._css.names;
        dojo.style(passive, names.transition, "none");
        this._moveImages(passive, this._active);
        dojo.style(passive, names.transform, "none");
      }
      
      var div = this._active || this._div,
          divLeft = this._div._left, // dojo.style(div, "left"),
          divTop = this._div._top, //dojo.style(div, "top"),
          i, len = div.childNodes.length, node;
      
      for (i = 0; i < len; i++) {
        node = div.childNodes[i];
        //console.log(node.e_idx);
        this._setPos(node, divLeft, divTop);
      }
    },
    
    _zoom: function(extent, factor, anchor) {
      //console.log("zoom: ", factor);
      
      // These values represent how much panning has happened
      // until now
      var div = this._div,
          divLeft = div._left, // dojo.style(div, "left"),
          divTop = div._top, //dojo.style(div, "top"),
          i, len = div.childNodes.length, node;

      for (i = 0; i < len; i++) {
        node = div.childNodes[i];
        
        var newWidth = node.e_w * factor,
            newHeight = node.e_h * factor,
            diffLeft = (anchor.x - divLeft - node.e_l) * (newWidth - node.e_w) / node.e_w,
            diffTop = (anchor.y - divTop - node.e_t) * (newHeight - node.e_h) / node.e_h;

        // IE throws "Invalild argument" error at dojo.style for NaN values
        // Fix it here
        diffLeft = isNaN(diffLeft) ? 0 : diffLeft;
        diffTop = isNaN(diffTop) ? 0 : diffTop;

        dojo.style(node, {
          left: (node.e_l - diffLeft) + "px",
          top: (node.e_t - diffTop) + "px",
          width: newWidth + "px",
          height: newHeight + "px"
        });
      } // loop
    },
    
    // These event handlers are executed only when map navigation mode is 
    // "css-transforms" - see _connect method above
    
    _zoomStart: function() {
      this._moveImages(this._active, this._passive);
    },
    
    _moveImages: function(source, dest) {
      // Move all images from source to destination
      var images = source.childNodes,
          i, len = images.length;
      
      if (len > 0) {
        for (i = len - 1; i >= 0; i--) {
          dest.appendChild(images[i]);
        }
      }
    },
    
    _scale: function(mtx, immediate) {
      var css = {}, names = esri._css.names,
          passive = this._passive;
      
      dojo.style(passive, names.transition, immediate ? "none" : (names.transformName + " " + esri.config.defaults.map.zoomDuration + "ms ease"));
      
      css[names.transform] = esri._css.matrix(mtx);
      //console.log("xply: " + dojo.toJson(css[names.transform]));

      // Map sends the cumulative transformation for this sequence in "mtx" 
      dojo.style(passive, names.transform, esri._css.matrix(mtx));
    },
    
    _resize: function(extent, width, height) {
      dojo.style(this._active, { width: width + "px", height: height + "px" });
      dojo.style(this._passive, { width: width + "px", height: height + "px" });
    }
  }
);


dojo.extend(esri.layers.MapImage, {
  visible: true,

  /**
   * Internal members, managed by esri.layers.MapImageLayer
   * _node
   * _idx
   * _layer
   */
  
  getLayer: function() {
    return this._layer;
  },
  
  getNode: function() {
    return this._node;
  },
  
  show: function() {
    if (!this.visible) {
      this.visible = true;

      var node = this._node, layer = this._layer, div;
      if (node) {
        div = layer && layer._div;
        
        // Re-append this node to the DOM
        if (div) {
          //layer._setPos(node, dojo.style(layer._div, "left"), dojo.style(layer._div, "top"));
          layer._setPos(node, div._left, div._top);
          (layer._active || div).appendChild(node);
        }
        
        esri.show(node);
      }
    }
  },
  
  hide: function() {
    if (this.visible) {
      this.visible = false;

      var node = this._node;
      if (node) {
        esri.hide(node);

        // To optimize navigation performance, we remove this node
        // from DOM
        if (node.parentNode) {
          node.parentNode.removeChild(node);
        }
      }
    }
  }
});

});
