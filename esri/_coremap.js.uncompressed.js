//>>built
// wrapped by build app
define("esri/_coremap", ["dijit","dojo","dojox","dojo/require!dijit/_base/manager,esri/geometry,esri/utils,esri/fx,dojox/gfx/matrix,esri/layers/graphics,esri/dijit/InfoWindow"], function(dijit,dojo,dojox){
dojo.provide("esri._coremap");

dojo.require("dijit._base.manager");

dojo.require("esri.geometry");
dojo.require("esri.utils");
dojo.require("esri.fx");
dojo.require("dojox.gfx.matrix");

dojo.require("esri.layers.graphics");

// BUILD DIRECTIVE
dojo.require("esri.dijit.InfoWindow");


  


//all mapping functionality
dojo.declare("esri._CoreMap", null, (function() {
    //CLASS VARIABLES
    //classes & methods
    var toMapPt = esri.geometry.toMapPoint, //coords converters
        toScreenPt = esri.geometry.toScreenPoint,
        dc = dojo.connect,
        ddc = dojo.disconnect,
        dh = dojo.hitch,
        ds = dojo.style,
        iOf = dojo.indexOf,
        mixin = dojo.mixin,
        Point = esri.geometry.Point,
        Extent = esri.geometry.Extent,
        GraphicsLayer = esri.layers.GraphicsLayer,
        Rect = esri.geometry.Rect,
        uid = 0,
        mapDefaults = esri.config.defaults.map; //map default configuration
       
    //factors and constants 
    var _LEVEL_CHANGE_FACTOR = 1000000,
        _FIXED_PAN_FACTOR = 0.75,
        _FIT_ZOOM_FACTOR = 0.25,
        _FIT_ZOOM_MAX = 3.0,
        _ZINDEX_GRAPHICS = 20,
        _ZINDEX_INFO = 40; 
    
    //functions
    function _initTileInfo(tileInfo, params) {
      // TODO
      // This method is doing unwanted things like
      // updating the incoming "params". Why?
      // Also, both caller and callee are cloning
      // tileInfo. Why?
      
      var lods = tileInfo.lods;
      
      //sort lods based on scale
      lods.sort(function(l1, l2) {
        if (l1.scale > l2.scale) {
          return -1;
        }
        else if (l1.scale < l2.scale) {
          return 1;
        }
        return 0;
      });
      
      //remove any duplicate scales
      var scales = [];
      lods = dojo.filter(lods, function(l) {
        if (iOf(scales, l.scale) === -1) {
          scales.push(l.scale);
          return true;
        }
      });

      //add/set level attribute to each lod
      var pl = (params.lods = []),
          l;
      dojo.forEach(lods, function(lod, index) {
        l = (pl[index] = new esri.layers.LOD(lod));
        l.level = index;
      });

      params.tileInfo = new esri.layers.TileInfo(
        mixin(tileInfo, { lods:pl })
      );
    }
    
    return {
      resizeDelay: 300, // in milliseconds
      
      constructor: function(containerId, params) {
        //summary: Creates a container using HTMLElement with argument id and
        //         normalizes all mouse/key events.
        // containerId: String: Id of HTMLElement (generally div)
        // options: Object: Optional parameters
        //        : layer: Layer to initialize map with
      
        //INSTANCE VARIABLES
        //variables with default values
        mixin(this, { _internalLayerIds:[], _layers:[], _layerDivs:[], _layerSize:0, _clickHandles: [], _connects:[]/*, _infoWindowIsShowing:false*/ });
        
        //variables with no default value
        mixin(this, {
          /*_infoWindowCoords:null, _iwPan_connect:null, _iwZoomStart_connect:null, _iwExtentChange_connect:null,*/
          _zoomAnimDiv:null, _zoomAnim:null, //zoom animation
          _layersDiv:null, _firstLayerId:null,
          _delta:null,
          _gc: null,
          // _zoomStartHandler:null, _zoomingHandler: null, _zoomEndHandler:null,
          // _panningHandler: null, _panEndHandler:null,
          // _fixedPan: null,
          _cursor: null,
          
          //were protected, but not required
          _ratioW:1, _ratioH:1,
          _params:null
        });
        
        //public variables
        mixin(this, {
          // container:null, id:null, position:null, width:0, height:0, extent:null, spatialReference:null, infoWindow:null,
          cursor:null,
          layerIds:[],
          graphicsLayerIds:[],
          graphics:null,
          loaded:false //loaded: boolean: Whether the map control is loaded
        });
        
        //protected variables
        mixin(this, {
          __panning:false, __zooming:false, __container:null, root:null, __LOD:null,
          __tileInfo:null,
          __visibleRect:null, __visibleDelta:null
        });
      
        //START: _MapContainer
        var cont = (this.container = dojo.byId(containerId));
        var id = (this.id = dojo.attr(cont, "id") || dijit.getUniqueId(this.declaredClass));
        dojo.addClass(cont, "map");

        //position of container on screen
        var box = dojo.contentBox(cont), //container box
            dac = dojo.addClass,
            dcr = dojo.create;

        //position
        this.position = new Point(0, 0);
        this._reposition();

        //width: int: Width of map
        var width = (this.width = (box.w || mapDefaults.width));
        //height: int: height of map control
        var height = (this.height = box.h || mapDefaults.height);

        if (box.w === 0) {
          ds(cont, "width", width + "px");
        }
        if (box.h === 0) {
          ds(cont, "height", height + "px");
        }

        // TODO
        // containerId can be a node reference. Fix id below
        var _root = (this.root = dcr("div", { id:id + "_root", style:{ width:width + "px", height:height + "px" } }));
        dac(_root, "container");

        var _cont = (this.__container = dcr("div", { id:id + "_container" }, _root));
        ds(_cont, "position", "absolute");
        dac(_cont, "container");
        cont.appendChild(_root);
        //END: _MapContainer
      
        var _params = (this._params = mixin({
          slider:true, 
          nav:false, 
          extent:null, 
          layer:null, 
          scales:null, 
          showInfoWindowOnClick:true, 
          displayGraphicsOnPan:true, 
          lods:null, 
          tileInfo:null, 
          wrapAround180: false,
          fitExtent: false 
        }, params || {}));
        
        this.wrapAround180 = _params.wrapAround180;
        
        if (esri._isDefined(_params.resizeDelay)) {
          this.resizeDelay =  _params.resizeDelay;
        }

        if (_params.lods) {
          _initTileInfo({ rows: 512, cols: 512, dpi: 96, format: "JPEG", compressionQuality: 75, origin: { x:-180, y:90 }, spatialReference: { wkid: 4326 }, lods:_params.lods }, _params);
          this.__tileInfo = _params.tileInfo;
        }
      
        //id: String: Id of map control
        //this.id = null;
        //layerIds: String[]: Ids of layers currently displayed on map

        //layerIds: String[]: Ids of graphics layers currently displayed on map
      
        //extent: esri.geometry.Extent: Currently visible extent of map
        var ext = (this.extent = _params.extent);
        //spatialReference: esri.SpatialReference: spatial reference well-known-id
        this.spatialReference = (ext && ext.spatialReference) ? ext.spatialReference : null;
      
        //currently visible area of map
        this.__visibleRect = new Rect(0, 0, width, height);
        this.__visibleDelta = new Rect(0, 0, width, height);
      
        var _layersDiv = (this._layersDiv = dcr("div", { id:id + "_layers" }));
        dac(_layersDiv, "layersDiv");
        _cont.appendChild(_layersDiv);
      
        //initialize zoom animation div
        this._zoomAnimDiv = dcr("div", { style:{ position:"absolute" }});

        if (_params.infoWindow) {
          this.infoWindow = _params.infoWindow;
        }
        else {
          //initialize div for info window
          var iw = (this.infoWindow = new esri.dijit.InfoWindow({ map: this, title:"", id:id + "_infowindow" }, dcr("div", null, _root)));
          iw.startup();
          iw._ootb = true; // mark for internal use
          //infoWindow.hide();
          ds(iw.domNode, "zIndex", _ZINDEX_INFO);
        }

        // this._infoWindowZoomStartHandler = dh(this, this._infoWindowZoomStartHandler);
        // this._infoWindowExtentChangeHandler = dh(this, this._infoWindowExtentChangeHandler);

        //this._connects.push(dc(infoWindow, "onShow", this, "_infoWindowShowHandler"), dc(infoWindow, "onHide", this, "_infoWindowHideHandler"));

        this._zoomStartHandler = dh(this, this._zoomStartHandler);
        this._zoomingHandler = dh(this, this._zoomingHandler);
        this._zoomEndHandler = dh(this, this._zoomEndHandler);
        this._panningHandler = dh(this, this._panningHandler);
        this._panEndHandler = dh(this, this._panEndHandler);
        this._endTranslate = dh(this, this._endTranslate);
        
        dojo.addOnWindowUnload(this, this.destroy);
      },
      
      _cleanUp: function() {
        // this.inherited("_cleanUp", arguments);
        //summary: clean up to prevent browser memory leaks
        //event handlers

        var iw = this.infoWindow;
        if (iw) {
          //iw.hide();
          if (iw._ootb) {
            iw.destroy();
          }
          else {
            iw.unsetMap(this);
          }
          delete this.infoWindow;
        }
        
        var cons = this._connects, i;

        for (i=cons.length-1; i>=0; i--) {
          ddc(cons[i]);
          delete cons[i];
        }
        
        ddc(this._tsTimeExtentChange_connect);
        this.setInfoWindowOnClick(false);
        
        dojo.destroy(this.root);
        this.root = null;
      },
      
      //layer handling
      _addLayer: function(/*esri.layers.Layer*/ layer, /*[]*/ layersArr, /*Number?*/ index) {
        //set layer id if none already specified
        var id = (layer.id = layer.id || (layer instanceof GraphicsLayer ? mapDefaults.graphicsLayerNamePrefix : mapDefaults.layerNamePrefix) + (uid++) /*layersArr.length*/);
        this._layers[id] = layer;

        var i;
        if (layersArr === this.layerIds || layersArr === this.graphicsLayerIds) {
          i = this._layerSize;
          this._layerSize++;
        }

        index = (index === undefined || index < 0 || index > layersArr.length) ? layersArr.length : index;

        //determine if base layer
        if (i === 0) {
          this._firstLayerId = id;
        }

        //determine index for layer
        layersArr.splice(index, 0, id);

        // TODO
        // Need to destroy all the connect tokens after the 
        // corresponding event has fired
        var _addLayerHandler = dh(this, this._addLayerHandler),
            self = this,
            _connects = this._connects,
            addLayerClosure = function() {
                                if (layer.loaded) {
                                  _addLayerHandler(layer);
                                }
                                else {
                                  self[id + "_addtoken_load"] = dc(layer, "onLoad", self, "_addLayerHandler");
                                  self[id + "_addtoken_err"] = dc(layer, "onError", self, function(error) {
                                    _addLayerHandler(layer, error, layersArr);
                                  });
                                }
                              };

        if (this.loaded || i === 0 || (layer.loaded && iOf(this.graphicsLayerIds, id) === -1)) {
          addLayerClosure();
        }
        else {
          _connects.push(dc(this, "onLoad", addLayerClosure));
        }

        return layer;
      },

      _addLayerHandler: function(/*esri.layers.Layer*/ layer, /*Error?*/ error, /*String[]?*/ layersArr) {
        var id = this.id,
            layerId = layer.id,
            layerIndex = iOf(layer instanceof GraphicsLayer ? this.graphicsLayerIds : this.layerIds, layerId),
            zIndex = layerIndex,
            isInternalLayer = false,
            _params = this._params;
            
        // disconnect the load/error tokens for this layer
        ddc(this[layerId + "_addtoken_load"]);
        ddc(this[layerId + "_addtoken_err"]);

        // Check if error occurred while loading the layer
        if (error) {
          delete this._layers[layerId];
          if (layerIndex !== -1) {
            layersArr.splice(layerIndex, 1);
            this.onLayerAddResult(layer, error);
          }
          return;
        }
        
        if (layerIndex === -1) {
          layerIndex = iOf(this._internalLayerIds, layerId);
          zIndex = _ZINDEX_GRAPHICS + layerIndex;
          isInternalLayer = true;
        }

        if (layer instanceof GraphicsLayer) {
          var group = layer._setMap(this, this._gc._surface);
          group.id = id + "_" + layerId;
          this._layerDivs[layerId] = group;
          this._reorderLayers(this.graphicsLayerIds);

          //TODO: Move to _Map
          if (_params.showInfoWindowOnClick) {
            this._clickHandles.push(dc(layer, "onClick", this, "_gClickHandler"));
            // TODO
            // We should be disconnecting when this layer is removed from map
          }
        }
        else {
          var layerDiv = layer._setMap(this, this._layersDiv, zIndex, this.__LOD);
          layerDiv.id = id + "_" + layerId;
          //ds(layerDiv, "zIndex", zIndex);
          this._layerDivs[layerId] = layerDiv;
          this._reorderLayers(this.layerIds);
          if (!isInternalLayer && layer.declaredClass.indexOf("VETiledLayer") !== -1){
            this._onBingLayerAdd(layer);
          }
        }

        if (layerId === this._firstLayerId) {
          this.spatialReference = this.spatialReference || layer.spatialReference;
          
          // Verify wrap support now that map's SR is available
          var mapSR = this.spatialReference;
          this.wrapAround180 = (this.wrapAround180 && mapSR && mapSR._isWrappable()) ? true : false;
          
          if (layer.tileInfo) {
            if (!this.__tileInfo) {
              _initTileInfo(mixin({}, layer.tileInfo), _params);
              this.__tileInfo = _params.tileInfo;
            }
            else {
              // We've already got "lods" but other tileInfo properties
              // are placeholders added in the constructor without
              // any knowledge of the tiled layer to be added. So,
              // let's mixin those other properties
              var lods = this.__tileInfo.lods;
              this.__tileInfo = mixin({}, layer.tileInfo);
              this.__tileInfo.lods = lods;
            }
          }
          
          if (this.wrapAround180) {
            var tileInfo = this.__tileInfo, info = mapSR._getInfo();
            
            // TODO
            // We need to overlap tiles to fix an issue where the horizon
            // does not align with tile boundary. This can happen if one of the
            // following conditions is true:
            // 1. tile origin is not -180
            // 2. scale for a given level is chosen such that horizon does not
            //    align with tile boundary
            // Once we fix this issue, the "second condition" in the following
            // decision block can be removed.
            // See also: TiledMapServiceLayer::_setMap
            if (!tileInfo || Math.abs(info.origin[0] - tileInfo.origin.x) > info.dx) {
              this.wrapAround180 = false;
            }
            
            if (this.wrapAround180 && tileInfo) {
              // Let's make sure all LODs have _frameInfo
              // Note that tileInfo will be augmented by _addFrameInfo
              esri.TileUtils._addFrameInfo(tileInfo, info);
            }
          }
          
          _params.units = layer.units;

          this._gc = new esri.layers._GraphicsContainer();
          var gc = this._gc._setMap(this, this._layersDiv);
          gc.id = id + "_gc";
          //ds(gc, "zIndex", _ZINDEX_GRAPHICS);

          this.graphics = new GraphicsLayer({
            id: id + "_graphics",
            displayOnPan: _params.displayGraphicsOnPan
          });
          this._addLayer(this.graphics, this._internalLayerIds, _ZINDEX_GRAPHICS);
        }

        if (layer === this.graphics) {
          // FIXES CR 58077: For Map:  include enable and disable methods for map navigation arrows and slider
          // These statements moved into enableMapNavigation()

          // TODO
          // Ideally, we don't want to reshape here as it is automatically
          // done within __setExtent. But, in IE, that would result in a crash 
          // while creating the slider trying to access __LOD in getLevel().
          // Fix it when adding "fit" to constructor options
          if (this.extent) {
            //var x = this._getAdjustedExtent(this.extent);
            var x = this._fixExtent(this.extent, _params.fitExtent);
            this.extent = x.extent;
            this.__LOD = x.lod;
          }

          var fli = this._firstLayerId;
          this._firstLayerId = null;
          this.__setExtent(this.extent || new Extent(this._layers[fli].initialExtent || this._layers[fli].fullExtent), null, null, _params.fitExtent);

          this.loaded = true;
          this.infoWindow.setMap(this);
          this.onLoad(this);
        }

        if (! isInternalLayer) {
          this.onLayerAdd(layer);
          this.onLayerAddResult(layer);
        }
        ddc(this[layerId + "_addLayerHandler_connect"]);
      },
      
      /*_filterLods: function(tileInfo, mapSR) {
        mapSR = mapSR || this.spatialReference;
        
        var mapWidth = this.width, info = mapSR._getInfo(), world = 2 * info.valid[1];
        
        //console.log("Before: ", lods.length);
        var lods = dojo.filter(tileInfo.lods, function(lod) {
          return (lod.resolution * mapWidth) <= world;
        });
        //console.log("After: ", lods.length);
        
        dojo.forEach(lods, function(lod, index) {
          lod.level = index;
        });
        
        tileInfo.lods = lods;
        
        // Let's make sure all LODs have _frameInfo
        // Note that tileInfo will be augmented by _addFrameInfo
        esri.TileUtils._addFrameInfo(tileInfo, info);
      },*/
      
      _reorderLayers: function(layerIds) {
        //reorder layer z-indices whenever a new layer is added/removed or reordered
        var onLayerReorder = this.onLayerReorder,
            djp = dojo.place,
            _layerDivs = this._layerDivs,
            _layers = this._layers,
            gcES = this._gc ? this._gc._surface.getEventSource() : null;

        if (layerIds === this.graphicsLayerIds) {
          dojo.forEach(layerIds, function(id, i) {
            var layerDiv = _layerDivs[id];
            if (layerDiv) {
              djp(layerDiv.getEventSource(), gcES, i);
              onLayerReorder(_layers[id], i);
            }
          });
        }
        else {
          var g = this.graphics,
              gId = g ? g.id : null,
              _layersDiv = this._layersDiv,
              layerDiv;

          dojo.forEach(layerIds, function(id, i) {
            layerDiv = _layerDivs[id];
            if (id !== gId && layerDiv) {
              djp(layerDiv, _layersDiv, i);
              //ds(layerDiv, "zIndex", i);
              onLayerReorder(_layers[id], i);
            }
          });

          if (gcES) {
            gcES = esri.vml ? gcES.parentNode : gcES;
            djp(gcES, gcES.parentNode, layerIds.length);
          }
        }

        this.onLayersReordered([].concat(layerIds));
      },

      //zoom animation handlers
      _zoomStartHandler: function() {
        this.__zoomStart(this._zoomAnimDiv.startingExtent, this._zoomAnimDiv.anchor);
      },

      _zoomingHandler: function(rect) {
        var rl = parseFloat(rect.left),
            rt = parseFloat(rect.top),
            extent = new Extent(rl, rt - parseFloat(rect.height), rl + parseFloat(rect.width), rt, this.spatialReference),
            scale = this.extent.getWidth() / extent.getWidth();

        this.__zoom(extent, scale, this._zoomAnimDiv.anchor);
      },

      _zoomEndHandler: function() {
        var _zAD = this._zoomAnimDiv,
            extent = _zAD.extent,
            scale = this.extent.getWidth() / extent.getWidth();
        
        var anchor = _zAD.anchor, newLod = _zAD.newLod, change = _zAD.levelChange;
        _zAD.extent = _zAD.anchor = _zAD.levelChange = _zAD.startingExtent = _zAD.newLod = this._delta = this._zoomAnim = null;

        this.__zoomEnd(extent, scale, anchor, newLod, change);
      },

      //pan animation handlers
      _panningHandler: function(delta) {
        // "delta" can be NaN if panDuration is 0. We need better high-level
        // map APIs to support the case where user wants immediate (non-animated)
        // change to map extent
        if (isNaN(parseFloat(delta.left)) || isNaN(parseFloat(delta.top))) {
          var round = Math.round, dojoStyle = dojo.style,  
              node = this._panAnim.node;
          
          // IE: Update the input "delta" object so that no more exceptions
          // thrown in dojo/_base/fx.js:_cycle after firing onAnimate
          delta.left = (-1 * (this._delta.x - round(this.width / 2))) + "px";
          delta.top = (-1 * (this._delta.y - round(this.height / 2))) + "px";
          
          // Update the animated node so that panEndHandler below can make
          // informed decision
          dojoStyle(node, "left", delta.left);
          dojoStyle(node, "top", delta.top);
        }
        
        var d = new Point(parseFloat(delta.left), parseFloat(delta.top)),
            dm = this.toMap(d);
            
        this.onPan(this.extent.offset(dm.x, dm.y), d);
      },

      _panEndHandler: function(node) {
        // FIXES CR 58626: The second call of PanWhatever() does not work in two continuous pan calls.
        this.__panning = false;

        var round = Math.round, delta = new Point(-round(parseFloat(node.style.left)), -round(parseFloat(node.style.top))), // this._delta.offset(-round(this.width / 2), -round(this.height / 2)),
            dx = delta.x,
            dy = delta.y,
            _vr = this.__visibleRect,
            _vd = this.__visibleDelta;

        _vr.x += -dx;
        _vr.y += -dy;
        _vd.x += -dx;
        _vd.y += -dy;

        ds(this._zoomAnimDiv, { left:"0px", top:"0px" });

        var extent = this.extent,
            rw = this._ratioW,
            rh = this._ratioH;
        extent = (this.extent = new Extent(extent.xmin + (dx / rw),
                                           extent.ymin - (dy / rh),
                                           extent.xmax + (dx / rw),
                                           extent.ymax - (dy / rh),
                                           this.spatialReference));

        delta.setX(-delta.x);
        delta.setY(-delta.y);

        this._delta = this._panAnim = null;
        this.onPanEnd(extent, delta);
        this.onExtentChange(extent, delta, false, this.__LOD);
      },
      
      _fixExtent: function(extent, /*Boolean?*/ fit) {
        var reshaped = this._reshapeExtent(extent),
            zoomFactor = 1.0 + _FIT_ZOOM_FACTOR;

        while (fit === true &&
            (reshaped.extent.getWidth() < extent.getWidth() || reshaped.extent.getHeight() < extent.getHeight()) &&
            reshaped.lod.level > 0 &&
            zoomFactor <= _FIT_ZOOM_MAX) {
          reshaped = this._reshapeExtent(extent.expand(zoomFactor));
          zoomFactor += _FIT_ZOOM_FACTOR;
        }
        
        return reshaped;
      },
      
      _getFrameWidth: function() {
        // Assumes being called after the map is loaded
        var width = -1, info = this.spatialReference._getInfo();
        
        if (this.__LOD) { // tiled base layer
          var frameInfo = this.__LOD._frameInfo;
          if (frameInfo) {
            width = frameInfo[3];
          }
        }
        else if (info) { // dynamic base layer
          width = Math.round( (2 * info.valid[1]) / (this.extent.getWidth() / this.width) );
        }
        
        return width;
      },
      
      //extent handling
      _reshapeExtent: function(extent) {
        //summary: Reshapes and returns the argument extent such that its aspect ratio matches that of the map
        // extent: esri.geometry.Extent: Extent object to reshape
        // anchor?: String: Named position to use as anchor when resizing extent. Same as resize anchor argument.
        var w = extent.getWidth(),
            h = extent.getHeight(),
            r = w / h,
            ratio = this.width / this.height,

            dw = 0,
            dh = 0;

        // The input extent need not necessarily have the same aspect ratio
        // as the map control. So, the general idea behind this reshaping is 
        // to fix the extent so that its aspect ratio is the same as that of
        // map control, while making sure that the user can see the extent in
        // its entirety.

        if (this.width > this.height) {
          if (w > h) {
            if (ratio > r) {
              dw = (h * ratio) - w;
            }
            else {
              dh = (w / ratio) - h;
            }
          }
          else if (w < h) {
            dw = (h * ratio) - w;
          }
          else {
            dw = (h * ratio) - w;
          }
        }
        else if (this.width < this.height) {
          if (w > h) {
            dh = (w / ratio) - h;
          }
          else if (w < h) {
            if (ratio > r) {
              //dh = (w / ratio) - h;
              dw = (h * ratio) - w;
            }
            else {
              //dw = (h * ratio) - w;
              dh = (w / ratio) - h;
            }
          }
          else {
            dh = (w / ratio) - h;
          }
        }
        else {
          if (w < h) {
            dw = h - w;
          }
          else if (w > h) {
            dh = (w / ratio) - h;
          }
        }

        if (dw) {
          extent.xmin -= dw / 2;
          extent.xmax += dw / 2;
        }
        if (dh) {
          extent.ymin -= dh / 2;
          extent.ymax += dh / 2;
        }

        return this._getAdjustedExtent(extent);
      },

      _getAdjustedExtent: function(extent) {
        if (this.__tileInfo) {
          return esri.TileUtils.getCandidateTileInfo(this, this.__tileInfo, extent);
        }
        else {
          return { extent:extent };
        }
      },
      
      //pan operation
//      _panTo: function(/*esri.geometry.Point*/ point) {
//        // point: map coordinates of new center point
//        var ewd = this.extent.getWidth(),
//            eht = this.extent.getHeight(),
//            xmin = point.x - (ewd / 2),
//            xmax = xmin + ewd,
//            ymin = point.y - (eht / 2),
//            ymax = ymin + eht;
//        this.__setExtent(new Extent(xmin, ymin, xmax, ymax));
//      },
      
      _fixedPan: function(dx, dy) {
        //this._panTo(this.toMap(new Point((this.width / 2) + dx, (this.height / 2) + dy)));
        this._extentUtil(null, { dx: dx, dy: dy });
      },
      
      //info window handling
      _gClickHandler: function(evt) {
        var graphic = evt.graphic, iw = this.infoWindow;
        // TODO
        // Why should we check if the graphic has an infotemplate,
        // can't we just call getTitle/getContent?
        if (graphic._getEffInfoTemplate() && iw) {
          dojo.stopEvent(evt);
          //this._showInfoWindow(graphic, evt.mapPoint);

          var geometry = graphic.geometry, 
              mapPoint = (geometry && geometry.type === "point") ? geometry : evt.mapPoint;
          
          iw.setTitle(graphic.getTitle());
          iw.setContent(graphic.getContent());
          iw.show(mapPoint/*, this.getInfoWindowAnchor(sp)*/);
        }
      },
      
      _onBingLayerAdd : function(layer){
        this["__" + layer.id + "_vis_connect"] = dojo.connect(layer, "onVisibilityChange", this, "_toggleBingLogo");        
        this._toggleBingLogo(layer.visible);
      },
      
      _onBingLayerRemove : function(layer){
        dojo.disconnect(this["__" + layer.id + "_vis_connect"]);
        delete this["__" + layer.id + "_vis_connect"];
        
        //Check if any other layers in the map are bing layers.
        var layerIds = this.layerIds;
        var moreBing = dojo.some(layerIds, function(layerId){
          var layer = this._layers[layerId];
          return layer && layer.visible && layer.declaredClass.indexOf("VETiledLayer") !== -1;
        }, this);
        
        this._toggleBingLogo(moreBing);
      },
      
      _toggleBingLogo : function(visibility){
        if (visibility && !this._bingLogo){
          var style = {left:(this._mapParams && this._mapParams.nav ? "25px" : "")};
          if (dojo.isIE === 6) {
            style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(enabled='true', sizingMethod='crop', src='" + dojo.moduleUrl("esri") + "../../images/map/logo-med.png" + "')";             
          }
          var bingLogo = this._bingLogo = dojo.create("div", { style: style }, this.root);
          dojo.addClass(bingLogo, "bingLogo-lg");
        } else if (!visibility && this._bingLogo){
          dojo.destroy(this._bingLogo);
          delete this._bingLogo;
        }
      },

      /*_infoWindowShowHandler: function() {
        this._infoWindowIsShowing = true;
        if (! this._iwPan_connect) {
          this._iwPan_connect = dc(this, "onPan", this, "_infoWindowPanHandler");
          this._iwZoomStart_connect = dc(this, "onZoomStart", this, "_infoWindowZoomStartHandler");
          ddc(this._iwExtentChange_connect);
          this._iwExtentChange_connect = dc(this, "onExtentChange", this, "_infoWindowExtentChangeHandler");
        }
      },

      _infoWindowHideHandler: function() {
        this._infoWindowIsShowing = false;
        ddc(this._iwPan_connect);
        ddc(this._iwZoomStart_connect);
        ddc(this._iwExtentChange_connect);
        this._iwPan_connect = this._iwZoomStart_connect = this._iwExtentChange_connect = null;
      },

      _infoWindowPanHandler: function(extent, delta) {
        //this.infoWindow.move(this.infoWindow.coords.offset(delta.x, delta.y));
        this.infoWindow.move(delta, true);
      },

      _infoWindowZoomStartHandler: function() {
        this.infoWindow.hide(null, true);
        this._infoWindowCoords = this.toMap(new Point(this.infoWindow.coords));
        this._infoWindowIsShowing = true;
      },

      _infoWindowExtentChangeHandler: function(extent, delta, levelChange) {
        if (this._infoWindowIsShowing) {
          var _isc;
          if (levelChange) {
            _isc = this.toScreen(this._infoWindowCoords);
          }
          else {
            _isc = this.infoWindow.coords.offset(delta.x, delta.y);
          }
          this.infoWindow.show(_isc, this.getInfoWindowAnchor(_isc), true);
        }
      },

      _showInfoWindow: function(graphic, mp) {
        //summary: Display info window for argument graphic at argument coordinate
        // graphic: esri.Graphic: Graphic to use to display info window
        // coords: esri.geometry.Point: Map coordinate to display info window at
        //var git = graphic.infoTemplate;
        //if (git) {
          var sp = this.toScreen(mp),  //.offset(2, 2);
              iw = this.infoWindow;
          //iw.hide();
          iw.setTitle(graphic.getTitle()).setContent(graphic.getContent());
          iw.show(sp, this.getInfoWindowAnchor(sp));
        //}
      },*/

      //PROTECTED
      __panStart: function(x, y) {
        var zoomAnim = this._zoomAnim,
            panAnim = this._panAnim;
        
        if (zoomAnim && zoomAnim._active) {
          // Let's go to the end of zoom animation and fire
          // onZoomEnd and onExtentChange. Then let *this* pan
          // sequence take over starting with onPanStart call below
          //zoomAnim.gotoPercent(1, true); // this ends up firing onZoomStart which we dont want
          zoomAnim.stop();
          zoomAnim._fire("onEnd", [zoomAnim.node]);
        }
        else if (panAnim && panAnim._active) {
          panAnim.stop(); // freeze frame right where it is at this moment
          this._panAnim = null;

          var rect = panAnim.curve.getValue(panAnim._getStep()),
              rl = Math.round(parseFloat(rect.left)),
              rt = Math.round(parseFloat(rect.top)),
              drag = this._dragOrigin;
          
          // We don't want to fire onPanStart again because pan animation
          // would have already fired it. 
          // Let's continue on with onPan events
          this.__pan(rl, rt);
          
          // Adjust dragOrigin so that _panHandler in map.js can take
          // over from here
          if (drag) {
            drag.x -= rl;
            drag.y -= rt;
          }
          return; // Let's return, we don't want to fire onPanStart
        }

        this.__panning = true;
        this.onPanStart(this.extent, new Point(x, y));
      },
      
      __pan: function(dx, dy) {
        var extent = this.extent,
            rw = this._ratioW,
            rh = this._ratioH;

        this.onPan(new Extent( extent.xmin - (dx / rw),
                               extent.ymin + (dy / rh),
                               extent.xmax - (dx / rw),
                               extent.ymax + (dy / rh),
                               this.spatialReference),
                   new Point(dx, dy));
      },
      
      __panEnd: function(dx, dy) {
        var _vr =this.__visibleRect,
            _vd = this.__visibleDelta;
        
        _vr.x += dx;
        _vr.y += dy;
        _vd.x += dx;
        _vd.y += dy;

        var d = new Point(dx, dy),
            extent = this.extent,
            rw = this._ratioW,
            rh = this._ratioH;
        extent = (this.extent = new Extent(extent.xmin - (dx / rw), extent.ymin + (dy / rh), extent.xmax - (dx / rw), extent.ymax + (dy / rh), this.spatialReference));

        this.__panning = false;
        this.onPanEnd(extent, d);
        this.onExtentChange(extent, d, false, this.__LOD);
      },

      __zoomStart: function(extent, anchor) {
        this.__zooming = true;
        this.onZoomStart(extent, 1, anchor, this.__LOD ? this.__LOD.level : null);
      },
      
      __zoom: function(extent, scale, anchor) {
          this.onZoom(extent, scale, anchor);
      },
      
      __zoomEnd: function(extent, scale, anchor, lod, levelChange) {
        ds(this._layersDiv, { left:"0px", top:"0px" });
        this._delta = new Point(0, 0);
        this.__visibleRect.x = (this.__visibleRect.y = 0);
        
        extent = (this.extent = new Extent(extent));
        this.__LOD = lod;
        
        this._ratioW = this.width / extent.getWidth();
        this._ratioH = this.height / extent.getHeight();
        
        var delta = this._delta;
        this._delta = null;
        this.__zooming = false;
        
        this.onZoomEnd(extent, scale, anchor, lod ? lod.level : null);
        this.onExtentChange(extent, delta, levelChange, lod);
      },
      
      _extentUtil: function(zoom, pan, targetExtent, fit, immediate) {
        // TODO
        // Need a better solution instead of "immediate" option: feels
        // like an ugly shortcut/workaround
        //console.log("[ _extentUtil ]");
        
        // TESTS:
        // Set esri.config.defaults.map.zoomDuration to 2000 before running the
        // tests:
        // Continuously scroll mouse wheel over a map location
        // Scroll mouse wheel down once and up once in quick succession to end up in the extent where you started
        // Scroll mouse wheel over location, immediately scroll over another location
        // Keep pressing NUMPAD_MINUS or NUMPAD_PLUS
        // Press NUMPAD_MINUS once and NUMPAD_PLUS once in quick succession to end up in the extent where you started
        // Keep pressing slider PLUS or MINUS buttons
        // Press slider MINUS once and slider PLUS once in quick succession to end up in the extent where you started
        // Initiate zoom, then call map.panRight
        // Initiate zoom, then call map.centerAt
        // Initiate zoom, then call map.centerAndZoom
        //   Case 1: map.centerAndZoom(esri.geometry.fromJson({"x":364986.4881850274,"y":6252854.5,"spatialReference":{"wkid":102100}}), 10)
        //   Case 2: map.centerAndZoom(esri.geometry.fromJson({"x":364986.4881850274,"y":6252854.5,"spatialReference":{"wkid":102100}}), 110)
        // Initiate zoom, then call map.setExtent
        // Initiate zoom, then call dojo.style(map.container, { width: "1200px"}); map.resize();
        
        var numLevels, targetLevel, factor, mapAnchor, screenAnchor, mapCenter,
            dx, dy, mapWidth = this.width, mapHeight = this.height;
        
        // Unpack input parameters
        if (zoom) {
          numLevels = zoom.numLevels; 
          targetLevel = zoom.targetLevel; 
          factor = zoom.factor;
          mapAnchor = zoom.mapAnchor; 
          screenAnchor = zoom.screenAnchor;
          mapCenter = zoom.mapCenter;
        }
        if (pan) {
          dx = pan.dx;
          dy = pan.dy;
          mapCenter = pan.mapCenter;
        }
        
        var panAnim = this._panAnim, 
            zoomAnim = this._stopAnim(), 
            currentExtent = zoomAnim ? zoomAnim.divExtent : this.extent,
            tileInfo = this.__tileInfo,
            xmin, ymin, ewd, eht;
       
       if (panAnim && mapAnchor && screenAnchor) {
         // Re-calculate the map anchor based on the latest map extent
         mapAnchor = toMapPt(this.extent, mapWidth, mapHeight, screenAnchor);
       }
       
       if (zoomAnim && mapAnchor && screenAnchor) {
         // The current anchor may be different from the previous one.
         // Let's adjust the map coordinates of the current anchor so that
         // the targetExtent is correct (after zoom end) and in sync with the anchor
         mapAnchor = toMapPt(zoomAnim.divExtent, mapWidth, mapHeight, screenAnchor);
         // TODO
         // Even after we make this adjustment this, positioning during onZoom 
         // does not feel right:
         // Could be paritally fixed by having __setExtent use "anchor" for 
         // _zAD.anchor even if zoomAnchor is available
       }
       
        // Pre-process "targetLevel" and convert it to "numLevels"
        if (esri._isDefined(targetLevel)) {
          if (tileInfo) {
            var maxLevel = this.getNumLevels() - 1;
            if (targetLevel < 0) {
              targetLevel = 0;
            }
            else if (targetLevel > maxLevel) {
              targetLevel = maxLevel;
            }
            
            numLevels = targetLevel - (zoomAnim ? zoomAnim.level : this.getLevel());
          }
          else {
            numLevels = targetLevel > 0 ? -1 : 1;
          }
        }
            
        if (targetExtent) {
          // Nothing to do here. Just call __setExtent.
        }
        // ===== ZOOM ROUTINE =====
        else if (esri._isDefined(numLevels)) {
          var size;
          if (tileInfo) {
            var currentLevel = zoomAnim ? zoomAnim.level : this.getLevel();
            size = this.__getExtentForLevel(currentLevel + numLevels, mapCenter, currentExtent).extent;
          }
          else {
            // NOTE
            // It's debatable if we need to use temp instead of currentExtent.
            // At this time, in the interest of maintaining compat in cases where
            // user clicks on zoom buttons or use scroll wheel (where basemap is 
            // a dynamic layer), temp is used.
            var temp = zoomAnim ? zoomAnim.end : this.extent;
            size = temp.expand(numLevels > 0 ? 0.5 * numLevels : 2 * -numLevels);
          }
          
          if (size) {
            if (mapCenter) {
              targetExtent = size;
            }
            else {
              var center = mapAnchor || currentExtent.getCenter(),
                  ymax = currentExtent.ymax - ((size.getHeight() - currentExtent.getHeight()) * (center.y - currentExtent.ymax) / currentExtent.getHeight());

              xmin = currentExtent.xmin - ((size.getWidth() - currentExtent.getWidth()) * (center.x - currentExtent.xmin) / currentExtent.getWidth());
              
              targetExtent = new Extent(xmin, ymax - size.getHeight(), xmin + size.getWidth(), ymax, this.spatialReference);
            }
          }
        }
        else if (esri._isDefined(factor)) {
          // TODO
          // Probably don't need this code path - not used?
          targetExtent = currentExtent.expand(factor);
        }
        // ===== PAN ROUTINE =====
        else if (dx || dy) {
          //console.log("dx = ", dx, ", dy = ", dy, ", mapCenter = ", dojo.toJson(mapCenter.toJson()));
          
          if (zoomAnim) {
            var end = zoomAnim.end,
                c1 = end.getCenter(),
                c2 = toScreenPt(end, mapWidth, mapHeight, c1);
            c2.x += dx;
            c2.y += dy;
            c2 = toMapPt(end, mapWidth, mapHeight, c2);
            
            targetExtent = end.offset(c2.x - c1.x, c2.y - c1.y);
          }
          else {
            var screenPt = new Point((mapWidth / 2) + dx, (mapHeight / 2) + dy),
                mapPt = toMapPt(currentExtent, mapWidth, mapHeight, screenPt);

            ewd = currentExtent.getWidth();
            eht = currentExtent.getHeight();
            xmin = mapPt.x - (ewd / 2);
            ymin = mapPt.y - (eht / 2);
            
            targetExtent = new Extent(xmin, ymin, xmin + ewd, ymin + eht);
          }
        }
        
        // Fallback
        if (!targetExtent) {
          if (mapCenter) {
            var ext = zoomAnim ? zoomAnim.end : currentExtent;
            
            ewd = ext.getWidth();
            eht = ext.getHeight();
            xmin = mapCenter.x - (ewd / 2);
            ymin = mapCenter.y - (eht / 2);
            
            targetExtent = new Extent(xmin, ymin, xmin + ewd, ymin + eht);
          }
          else if (zoomAnim) {
            targetExtent = zoomAnim.end;
          }
        }
        
        if (targetExtent) {
          this.__setExtent(targetExtent, null, screenAnchor, fit, zoomAnim, immediate);
        }
      },

      __setExtent: function(/*Extent*/ extent, /*Object*/ delta, /*esri.geometry.Point? screenPoint*/ zoomAnchor, /*Boolean?*/ fit, /*Object?*/ zoomAnim, immediate) {
        try {
        if (this._firstLayerId) {
          this.extent = extent;
          return;
        }
        
        //console.log("__setExtent: target scale = ", this.extent.getWidth() / extent.getWidth());

        var levelChange = true,
            ext = zoomAnim ? zoomAnim.divExtent : this.extent,
            reshaped = this._fixExtent(extent, fit || false);

        extent = reshaped.extent;
        
        var extentwd = extent.getWidth(),
            extentht = extent.getHeight(),
            round = Math.round;

        if (ext) {
          var tw = round(ext.getWidth() * _LEVEL_CHANGE_FACTOR),
              w = round(extentwd * _LEVEL_CHANGE_FACTOR),
              th = round(ext.getHeight() * _LEVEL_CHANGE_FACTOR),
              h = round(extentht * _LEVEL_CHANGE_FACTOR);
          levelChange = (tw !== w) || (th !== h);
        }
        
        //console.log("1. levelChange = " + levelChange);

        var anchor, end, ratioW, ratioH, //ratioW/H for resize animation
            start = zoomAnim && zoomAnim.rect,
            startingExtent = zoomAnim && zoomAnim.divExtent;
        
        if (mapDefaults.zoomDuration && levelChange && ext) {
          startingExtent = startingExtent || new Extent(ext); //mixin({}, ext);
          start = start || { left:ext.xmin, top:ext.ymax, width:ext.getWidth(), height:ext.getHeight() };
          end = { left:extent.xmin, top:extent.ymax, width:extentwd, height:extentht };
          ratioW = start.width / end.width;
          ratioH = start.height / end.height;

          // Draw a line from top-left corner of current extent -> top-left corner of new extent
          // Draw a line from bottom-left corner of current extent -> bottom-left corner of new extent
          // "anchor" is the point where the above two lines (extended) intersect
          var mtl = new Point(extent.xmin, extent.ymax),
              mbl = new Point(extent.xmin, extent.ymin),
              etl = new Point(this.extent.xmin, this.extent.ymax),
              ebl = new Point(this.extent.xmin, this.extent.ymin);
          anchor = esri.geometry.getLineIntersection(etl, mtl, ebl, mbl);
          //console.log("calc anchor = " + (anchor ? dojo.toJson(anchor.toJson()) : "null"));
          if (!anchor && !zoomAnim) {
            // no intersection => parallel lines => no level change
            
            // However, if there was zoomAnim that is now stopped, then we know from
            // the fact there was previous animation sequence that we certainly have a 
            // levelChange. So let's not make it false just because the lines were
            // parallel
            levelChange = false;
          }
        }

        //ratioW/H for map
        this._ratioW = this.width / extentwd; //Math.abs(ext.xmax - ext.xmin);
        this._ratioH = this.height / extentht; //Math.abs(ext.ymax - ext.ymin);
        
        var _zAD = this._zoomAnimDiv;
        
        //console.log("2. levelChange = " + levelChange);

        if (levelChange) {
          ds(this._layersDiv, { left:"0px", top:"0px" });
          delta = new Point(0, 0);

          // FIXES CR 58592: layer.hide()/show() do not work properly.
          // ISSUE: Misalignment of the layers when you do a PAN and then ZOOM.
          // This fix avoids tiledlayer._div from being reset to 0,0 in layer._onExtentChangehandler() - thereby avoiding the
          this.__visibleRect.x = (this.__visibleRect.y = 0);

          if (start && end) {
            this._delta = delta;
            _zAD.id = "_zAD";
            _zAD.startingExtent = startingExtent;
            _zAD.extent = extent;
            _zAD.levelChange = levelChange;
            _zAD.newLod = reshaped.lod;

            if (zoomAnchor) {
              //console.log("zoomAnchor = " + dojo.toJson(zoomAnchor.toJson()));
              _zAD.anchor = zoomAnchor;
            }
            else {
              if (!anchor && zoomAnim) {
                // Happens when you zoom out(NUMPAD_MINUS) => In the middle of anim zoom back in (NUMPAD_PLUS),
                // where getLineIntersection returns null due to parallel lines
                _zAD.anchor = zoomAnim.anchor;
              }
              else {
                _zAD.anchor = toScreenPt(this.extent, this.width, this.height, anchor);
              }
              //console.log("_zAD.anchor = " + dojo.toJson(_zAD.anchor.toJson()));
            }
            
            // window.requestAnimationFrame API:
            // Is an alternative to dojo.Animation (dojo/_base/fx.js):
            // http://notes.jetienne.com/2011/05/18/cancelRequestAnimFrame-for-paul-irish-requestAnimFrame.html
            // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
            // https://developer.mozilla.org/en/DOM/window.mozRequestAnimationFrame

            this._zoomAnim = esri.fx.resize({
              node: _zAD,
              start: start,
              end: end,
              duration: mapDefaults.zoomDuration,
              rate: mapDefaults.zoomRate,
              beforeBegin: !zoomAnim ? this._zoomStartHandler : null,
              onAnimate: this._zoomingHandler,
              onEnd: this._zoomEndHandler
            }).play();

            /*if (this.navigationMode === "css-transforms") {
              // Fire onScale event if map.navigationMode is "css-transforms"
              var scaleFactor = this.extent.getWidth() / extent.getWidth(),
                  vd = this.__visibleDelta,
                  mtx = dojox.gfx.matrix.scaleAt(scaleFactor, {
                    x: -1 * ( (this.width / 2) - (_zAD.anchor.x - vd.x) ),
                    y: -1 * ( (this.height / 2) - (_zAD.anchor.y - vd.y) )
                  });
              
              this.onScale(mtx);
            }*/
            this._fireOnScale(this.extent.getWidth() / extent.getWidth(), _zAD.anchor);
          }
          else {
            this.extent = extent;
            this.onExtentChange(this.extent, delta, levelChange, (this.__LOD = reshaped.lod));
          }
        }
        else {
          if (! this.__panning) {
            if (this.loaded === false || immediate) {
              this.extent = extent;
              this.onExtentChange(this.extent, delta, levelChange, (this.__LOD = reshaped.lod));
            }
            else {
              // FIXES CR 58626: The second call of PanWhatever() does not work in two continuous pan calls.
              this.__panning = true;

              //summary: Pans map to argument 
              start = new Rect(0, 0, this.width, this.height, this.spatialReference).getCenter();
              start.x = round(start.x);
              start.y = round(start.y);
              this.onPanStart(this.extent, new Point(0, 0));

              // See _panningHandler for how this._delta is used
              var point = (this._delta = this.toScreen(extent.getCenter()));
              
              this._panAnim = esri.fx.slideTo({
                node: _zAD,
                left: start.x - point.x,
                top: start.y - point.y,
                duration: mapDefaults.panDuration,
                rate: mapDefaults.panRate,
                onAnimate: this._panningHandler,
                onEnd: this._panEndHandler
              });
              
              // "play" call is a separate statement so that this._panAnim
              // reference is available to _panningHandler
              this._panAnim.play();
            }
          }
        }
        }
        catch(e) {
          console.log(e.stack);
          console.error(e);
        }
      },
      
      _fireOnScale: function(scaleFactor, anchor, immediate) {
        if (this.navigationMode === "css-transforms") {
          // Fire onScale event if map.navigationMode is "css-transforms"
          var vd = this.__visibleDelta;
          
          this.onScale(dojox.gfx.matrix.scaleAt(
            scaleFactor, 
            {
              x: -1 * ( (this.width / 2) - (anchor.x - vd.x) ),
              y: -1 * ( (this.height / 2) - (anchor.y - vd.y) )
            }
          ), immediate);
        }
      },
      
      _stopAnim: function() {
        var zoomAnim = this._zoomAnim,
            panAnim = this._panAnim;
        
        // NOTE
        // Internal members used here: see dojo/_base/fx.js for reference
        
        // TODO
        // IE 9 stalls a bit when panning right after initiating zoom
        // IE 7, 8, 9: initiate zoom by a level, then grab the map to start
        //   panning, you'll notice that the map image doesn't reflect zoom-end.
        //   Rather it stays right where it is at that moment in animation sequence
        
        if (zoomAnim && zoomAnim._active) {
          zoomAnim.stop();
          //console.log("ZOOM STOPPED: ", zoomAnim._percent, " - ", zoomAnim._getStep(), " - ", dojo.toJson(zoomAnim.curve.getValue(zoomAnim._getStep())));

          var rect = zoomAnim.curve.getValue(zoomAnim._getStep()),
              rl = parseFloat(rect.left),
              rt = parseFloat(rect.top),
              node = zoomAnim.node;
          
          //console.log("node width = " + node.style.width);
          
          return {
            anchor: node.anchor,
            start: node.startingExtent,
            end: node.extent,
            level: node.newLod && node.newLod.level,
            rect: rect,
            divExtent: new Extent(rl, rt - parseFloat(rect.height), rl + parseFloat(rect.width), rt, this.spatialReference)
          };
        }
        // Don't expect to see live pan and zoom animations at the same time
        else if (panAnim && panAnim._active) {
          panAnim.stop();
          //console.log("PAN STOPPED: ", panAnim._percent, " - ", panAnim._getStep(), " - ", dojo.toJson(panAnim.curve.getValue(panAnim._getStep())));
          
          // Officially end this pan sequence in its current state
          panAnim._fire("onEnd", [panAnim.node]);
        }
      },

      __getExtentForLevel: function(/*Number*/ level, /*esri.geometry.Point?*/ center, /*esri.Extent?*/ extent) {
        //previously _setLevel
        //summary: Sets the level of the map if within range of base TiledLayer's range
        // level: int: Level of map to zoom to
        var ti = this.__tileInfo;
        extent = extent || this.extent;
        center = center || extent.getCenter();

        if (ti) {
          var lods = ti.lods;

          if (level < 0 || level >= lods.length) {
            return {};
          }

          var lod = lods[level],
              extW2 = this.width * lod.resolution / 2,
              extH2 = this.height * lod.resolution / 2;

          return { extent: new Extent(center.x - extW2, center.y - extH2, center.x + extW2, center.y + extH2, center.spatialReference), lod: lod };
        }
        else {
          return { extent: extent.expand(level).centerAt(center) };
        }
      },

      __scaleExtent: function(extent, scale, center) {
        var anchor = center || extent.getCenter();

        var newExt = extent.expand(scale),
            xmin = extent.xmin - ((newExt.getWidth() - extent.getWidth()) * (anchor.x - extent.xmin) / extent.getWidth()),
            ymax = extent.ymax - ((newExt.getHeight() - extent.getHeight()) * (anchor.y - extent.ymax) / extent.getHeight());

        return new Extent(xmin, ymax - newExt.getHeight(), xmin + newExt.getWidth(), ymax, extent.spatialReference);
      },
      
      _jobs: 0, // indicates the number of pending updates

      _incr: function() {
        /*
         * This function will be called by all map layers
         * when they begin updating their content
         * See Layer::_fireUpdateStart
         */
        if ((++this._jobs) === 1) {
          // Fire the event for the first update only
          this.updating = true;
          this.onUpdateStart();
        }
      },
      
      _decr: function() {
        /*
         * This function will be called by all map layers
         * when they are done updating their content
         * See Layer::_fireUpdateEnd
         */
        var count = --this._jobs;
        if (!count) {
          // Fire the event if there are no pending updates
          this.updating = false;
          this.onUpdateEnd();
        }
        else if (count < 0) {
          this._jobs = 0;
        }
      },
      
      onUpdateStart: function() {},
      onUpdateEnd: function(/*Error?*/) {},

      //EVENTS
      //when map has been initialized with 1 layer
      onLoad: function() {
        //summary: Event fired when map is loaded
        this._setClipRect();
      },
      onUnload: function() {
        //summary: Event fired when map is unloaded
      },

      //extent events
      onExtentChange: function(a, b, levelChange) {
        //summary: Event fired once map extent has changed
        // esri.geometry.Extent : extent
        // esri.geometry.Point : delta
        // boolean : levelChange
        // esri.layers.LOD : lod
        //console.log("ON-EXTENT-CHANGE");
        if (levelChange) {
          this._setClipRect();
        }
      },
      
      onTimeExtentChange: function() {
        // Arguments: timeExtent
      },

      //layer events
      onLayerAdd: function() {
        //summary: Event fired when layer added to map
      },
      onLayerAddResult: function() {
        //summary: Event fired after a layer add operation succeeded or failed
        // Arguments: layer, error?
      },
      onLayersAddResult: function() {
        //summary: Event fired when a group of layers are added to the
        // map by calling addLayers method
        // Arguments:
        // [
        //  { layer: <Layer>, success: <Boolean>, error: <Error> },
        //  ...
        // ]
      },
      onLayerRemove: function() {
        //summary: Event fired when a layer is removed
        //Layer : layer
      },
      onLayersRemoved: function() {
        //summary: Event fired when all layers are removed
      },

      onLayerReorder: function() {
        //summary: Event fired when layers are reordered on map
        //esri.layers.Layer : layer
        //Number : new index
      },
      onLayersReordered: function() {
        //summary: Event fired after all layers have been reordered
        //String[]: reordered layer ids list
      },

      //pan
      onPanStart: function() {
        //console.log("<<<<<<<<<<<<<<<<< PAN-START " + dojo.toJson(arguments[1].toJson()));
        //summary: Event fired before map panning starts
      },
      onPan: function() {
        //console.log("pan: " + dojo.toJson(arguments[1].toJson()));
        //summary: Event fired during map pan
      },
      onPanEnd: function() {
        //console.log(">>>>>>>>>>>>>>>>> PAN-END " + dojo.toJson(arguments[1].toJson()));
        //summary: Event fired once map pan has ended
      },
      
      onScale: function() {
        //console.log("------- scale: " + dojo.toJson(arguments[0]));
        // arguments:
        //  matrix - matrix representation of this scale transformation
      },

      //zoom
      onZoomStart: function() {
        //console.log(arguments[1] + "," + arguments[3] + "ZOOM-START <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");
        //summary: Event fired before map zoom starts
      },
      onZoom: function() {
        //console.log("zoom: ", arguments[1]);
        //summary: Event fired during map zoom
        //esri.geometry.Extent extent
        //Number scale
        //esri.geometry.Point anchor
      },
      onZoomEnd: function() {
        //console.log(arguments[1] + "," + arguments[3]+ "ZOOM-END >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
        //summary: Event fired once map zoom has ended
      },

      //map control resize
      onResize: function() {
        //summary: Event fired when the map container is resized.
        // arguments[0]: Extent of map
        // arguments[1]: Number: New width
        // arguments[2]: Number: New height
        this._setClipRect();
      },
      onReposition: function() {
        //summary: Event fired when map is respositions
        // arguments[0]: Number: Top-left x coordinate
        // arguments[1]: Number: Top-left y coordinate
      },
      
      //PUBLIC METHODS
      destroy: function() {
        if (!this._destroyed) {
          this.removeAllLayers();
          this._cleanUp();
          if (this._gc) {
            this._gc._cleanUp();
          }
  
          this._destroyed = true;
          this.onUnload(this);
        }
      },
      
      //cursor functions
      setCursor: function(cursor) {
        ds(this.__container, "cursor", (this.cursor = cursor));
      },
      
      setMapCursor: function(c) {
        this.setCursor((this._cursor = c));
      },
      
      resetMapCursor: function() {
        this.setCursor(this._cursor);
      },
      
      setInfoWindow: function(infoWindow) {
        var iw = this.infoWindow;
        if (iw) {
          iw.unsetMap(this);
        }
        
        this.infoWindow = infoWindow;
        
        if (this.loaded && infoWindow) {
          infoWindow.setMap(this);
        }
      },
      
      setInfoWindowOnClick: function(enable) {
        var params = this._params;
        
        if (enable) {
          if (!params.showInfoWindowOnClick) {
            var graphicsLayers = [ this.graphics ].concat(dojo.map(this.graphicsLayerIds, this.getLayer, this));
            
            dojo.map(graphicsLayers, function(layer) {
              if (layer && layer.loaded) {
                this._clickHandles.push(dc(layer, "onClick", this, "_gClickHandler"));
              }
              
              // Note that when a graphics layer is loaded, based on the then
              // showInfoWindowOnClick setting, _addLayerHandler will establish
              // connection (or not)
            }, this);
          }
        }
        else {
          dojo.forEach(this._clickHandles, ddc);
          this._clickHandles = [];
        }

        params.showInfoWindowOnClick = enable;
      },
      
      getInfoWindowAnchor: function(pt) {
        var w2 = this.width / 2,
            h2 = this.height / 2,
            anchor;

        if (pt.y < h2) {
          anchor = "LOWER";
        }
        else {
          anchor = "UPPER";
        }

        if (pt.x < w2) {
          return esri.dijit.InfoWindow["ANCHOR_" + anchor + "RIGHT"];
        }
        else {
          return esri.dijit.InfoWindow["ANCHOR_" + anchor + "LEFT"];
        }
      },
      
      toScreen: function(/*esri.geometry.Point*/ pt, doNotRound) {
        //summary: Converts a point in map coordinates to screen coordinates
        // pt: esri.geometry.Point: Map point to be converted
        // returns: esri.geometry.Point: Resultant point in screen coordinates
        
        // doNotRound is currently used by esri.toolbars._Box to avoid losing
        // precision when doing: map -> screen -> transform screen -> map
        return toScreenPt(this.extent, this.width, this.height, pt, doNotRound);
      },

      toMap: function(/*esri.geometry.Point*/ pt) {
        //summary: Converts a point from screen coordinates to map coordinates.
        // pt: esri.geometry.Point: Screen point to be converted
        // returns: esri.geometry.Point: Resultant point in map coordinates
        return toMapPt(this.extent, this.width, this.height, pt);
      },
      
      //layer functions
      addLayer: function(/*esri.layers.Layer*/ layer, /*int?*/ index) {
        //summary: Add layer to map
        // layer: esri.layers.Layer: Layer object to add to map
        // index: int?: Index of layer from bottom. Base Layer/Bottom most layer is index 0 and the indices increase going up the layer stack. By default the layer is added to the top of the layer stack
        return this._addLayer(layer, layer instanceof GraphicsLayer ? this.graphicsLayerIds : this.layerIds, index);
      },
      
      addLayers: function(layers) {
        var results = [], count = layers.length, token, i, len = layers.length;
        
        // This callback will be called after each layer is added to the map
        var callback = function(layer, error) {
          if (dojo.indexOf(layers, layer) !== -1) {
            count--;
            results.push({ "layer": layer, "success": !error, "error": error });
            if (!count) {
              dojo.disconnect(token);
              this.onLayersAddResult(results);
            }
          }
        };
        token = dojo.connect(this, "onLayerAddResult", callback);
        
        for (i = 0; i < len; i++) {
          this.addLayer(layers[i]);
        }
        return this;
      },

      removeLayer: function(/*esri.layers.Layer*/ layer, doNotReorder) {
        var id = layer.id,
            ids = layer instanceof GraphicsLayer ? this.graphicsLayerIds : this.layerIds,
            i = iOf(ids, id);

        if (i >= 0) {
          ids.splice(i, 1);
          if (layer instanceof GraphicsLayer) {
            ddc(this["_gl_" + layer.id + "_click_connect"]);
            
            // Dont have to call unset on a layer that never finished loading.
            // setMap would've been called if and only when the layer loads.
            // So it doesnt make sense to call unsetMap if the layer has not
            // loaded
            if (layer.loaded) {
              layer._unsetMap(this, this._gc._surface);
            }
          }
          else {
            if (layer.loaded) {
              layer._unsetMap(this, this._layersDiv);
              if (layer.declaredClass.indexOf("VETiledLayer") !== -1) {
                this._onBingLayerRemove(layer);
              }
            }
          }

          delete this._layers[id];
          delete this._layerDivs[id];

          // Avoid re-ordering DOM nodes when we're going down - map is being
          // destroyed
          if (!doNotReorder) {
            this._reorderLayers(ids);
          }
          
          this.onLayerRemove(layer);
        }
      },

      removeAllLayers: function() {
        var ids = this.layerIds, i;
        for (i=ids.length-1; i>=0; i--) {
          this.removeLayer(this._layers[ids[i]], 1);
        }
        ids = this.graphicsLayerIds;
        for (i=ids.length-1; i>=0; i--) {
          this.removeLayer(this._layers[ids[i]], 1);
        }
        this.onLayersRemoved();
      },

      reorderLayer: function(/*String|Layer*/ layer, /*Number*/ index) {
        //summary: Reorders layer with argument id to specified index. If index > top most layer, the index is changed appropriately
        // id: String: Id of layer to be reordered
        // index: Number: New index of layer as displayed on map
        if (dojo.isString(layer)) {
          dojo.deprecated(this.declaredClass + ": " + esri.bundle.map.deprecateReorderLayerString, null, "v2.0");
          layer = this.getLayer(layer);
        }

        var id = layer.id,
            ids = layer instanceof GraphicsLayer ? this.graphicsLayerIds : this.layerIds;

        if (index < 0) {
          index = 0;
        }
        else if (index >= ids.length) {
          index = ids.length - 1;
        }

        var i = iOf(ids, id);
        if (i === -1 || i === index) {
          return;
        }

        ids.splice(i, 1);

        ids.splice(index, 0, id);
        this._reorderLayers(ids);
      },

      getLayer: function(/*String*/ id) {
        //summary: Get layer with argument id
        //id: String: Id of layer
        return this._layers[id];
      },

      //extent manipulation
      setExtent: function(/*esri.geometry.Extent*/ extent, /*Boolean?*/ fit) {
        //summary: Set the extent of the map
        // extent: esri.geometry.Extent: Extent to be set
        extent = new esri.geometry.Extent(extent.toJson());
        
        var width = extent.getWidth(), height = extent.getHeight();
        //console.log("extent width = ", width, ", extent height = ", height);
        
        if (width === 0 && height === 0) { // point
          this.centerAt(new esri.geometry.Point({
            x: extent.xmin,
            y: extent.ymin,
            spatialReference: extent.spatialReference && extent.spatialReference.toJson()
          }));
        }
        else {
          //this.__setExtent(extent, null, null, fit);
          this._extentUtil(null, null, extent, fit);
        }
      },

      centerAt: function(/*esri.geometry.Point*/ point) {
        //summary: Recenters the map at argument map point
        // point: esri.geometry.Point: Map coordinates of new center point
        //this._panTo(point);
        this._extentUtil(null, {
          mapCenter: point
        });
      },

      centerAndZoom: function(/*esri.geometry.Point*/ center, /*Number*/ level) {
        /*var ext = this.__getExtentForLevel(level, center).extent;
        if (ext) {
          this.__setExtent(ext);
        }
        else {
          this.centerAt(center);
        }*/
        this._extentUtil({
          targetLevel: level,
          mapCenter: center
        });
      },

      getNumLevels: function() {
        return this.__tileInfo ? this.__tileInfo.lods.length : 0;
      },

      getLevel: function() {
        //summary: Get current level on map, if base layer is a TiledLayer
        // returns: int: Current level displayed if TiledLayer else -1
        return this.__LOD ? this.__LOD.level : -1;
      },

      setLevel: function(/*Number*/ level) {
        //summary: Sets the level of the map if within range of base TiledLayer's range
        // level: int: Level of map to zoom to
        /*var ext = this.__getExtentForLevel(level).extent;
        if (ext) {
          this.setExtent(ext);
        }*/
        this._extentUtil({ targetLevel: level });
      },
      
      translate: function(dx, dy) {
        dx = dx || 0;
        dy = dy || 0;
        
        if (!this._txTimer) {
          //console.log("PAN-START");
          this._tx = this._ty = 0;
    
          var center = this.toScreen(this.extent.getCenter());      
          this.__panStart(center.x, center.y);
        }
        
        this._tx += dx;
        this._ty += dy;
        //console.log("pan... ", x, y);
        this.__pan(this._tx, this._ty);
    
        clearTimeout(this._txTimer);
        this._txTimer = setTimeout(this._endTranslate, 150);
      },
      
      _endTranslate: function() {
        //console.log("PAN-END");
        
        clearTimeout(this._txTimer);
        this._txTimer = null;

        var dx = this._tx, dy = this._ty;
        this._tx = this._ty = 0;
        
        this.__panEnd(dx, dy);
      },
      
      setTimeExtent: function(timeExtent) {
        this.timeExtent = timeExtent;

        var arg = timeExtent ? new esri.TimeExtent(timeExtent.startTime, timeExtent.endTime) : null;
        this.onTimeExtentChange(arg);
      },
      
      setTimeSlider : function(timeSlider){          
          if (this.timeSlider) {
              ddc(this._tsTimeExtentChange_connect);
              this._tsTimeExtentChange_connect = null;
              this.timeSlider = null;
          }    
          
          if (timeSlider){              
              this.timeSlider = timeSlider;
              this.setTimeExtent(timeSlider.getCurrentTimeExtent());
              this._tsTimeExtentChange_connect = dc(timeSlider, "onTimeExtentChange", this, "setTimeExtent");                  
          }                                      
      },
      
      resize: function(immediate) {
        var self = this, 
            execResize = function() {
              //console.log("Resizing map...");
              clearTimeout(self._resizeT);
              
              self.reposition();
              self._resize();
            };
        //console.log("[rsz]");

        clearTimeout(self._resizeT);
        
        // WARNING!
        // Ideally "if (immediate)" would be okay, but when this function is
        // tied to a dijit resize like below, the argument can be something
        // else. So let's explicitly check for boolean true value:
        // dojo.connect(dijit.byId('map'), 'resize', map,map.resize)
        if (immediate === true) {
          // This usage can be seen in esri/dijit/OverviewMap.js
          execResize();
        }
        else {
          self._resizeT = setTimeout(execResize, self.resizeDelay);
        }
        
        // Alternate solution (not fully supported on webkit):
        // Make use of "onresize" in IE, "DOMAttrModified" (height) in Firefox
        // http://www.west-wind.com/weblog/posts/2011/Feb/22/A-jQuery-Plugin-to-monitor-Html-Element-CSS-Changes
      },
      
      _resize: function() {
        var w = this.width, h = this.height, 
            box = dojo.contentBox(this.container);

        if (w === box.w && h === box.h) {
          //console.log("nothing changed!");
          return;
        }

        var prevAnim = this._zoomAnim || this._panAnim;
        if (prevAnim) {
          //prevAnim.gotoPercent(1, true);
          prevAnim.stop();
          prevAnim._fire("onEnd", [prevAnim.node]);
        }

        ds(this.root, { width:(this.width = box.w) + "px", height:(this.height = box.h) + "px" });

        var wd = this.width,
            ht = this.height;

        this.__visibleRect.update(this.__visibleRect.x, this.__visibleRect.y, wd, ht);
        this.__visibleDelta.update(this.__visibleDelta.x, this.__visibleDelta.y, wd, ht);
        
        var r = esri.geometry._extentToRect(this.extent),
            ne = (esri.geometry._rectToExtent(new Rect(r.x, r.y, r.width * (wd / w), r.height * (ht / h), this.spatialReference)));
        
        this.onResize(ne, wd, ht);
        //this.__setExtent(ne);
        this._extentUtil(null, null, ne, null, true);
      },

      reposition: function() {
        this._reposition();
        this.onReposition(this.position.x, this.position.y);
      },
      
      _reposition: function() {
        var pos = dojo.coords(this.container, true), // need to include the effect of scrolling in firefox 
            brdr = dojo._getPadBorderExtents(this.container);
        this.position.update(pos.x + brdr.l, pos.y + brdr.t);
      },
      
      _setClipRect: function() {
        delete this._clip;
        
        var clipRect = dojo.isIE ? "rect(auto,auto,auto,auto)" : null;
        
        if (this.wrapAround180) {
          var mapWidth = this.width, mapHeight = this.height,
              world = this._getFrameWidth(), // clipRect = null,
              diff = mapWidth - world;
          
          if (diff > 0) {
            // In wrapAround mode, do not show more than
            // 360 degree of map area.
            var left = diff / 2;
            clipRect = "rect(0px," + (left + world) + "px," + mapHeight + "px," + left + "px)";
            
            var oldWidth = this.extent.getWidth(),
                newWidth = oldWidth * (world / mapWidth); 
                
            this._clip = [ (oldWidth - newWidth) / 2, newWidth ];
            //console.log("Clip = ", this._clip);
          }
          /*else {
            if (dojo.isIE) {
              // IE throws error when setting clip=null. Cross fingers!
              clipRect = "rect(0px," + mapWidth + "px," + mapHeight + "px,0px)";
            }
          }*/
          
          //console.log("Clip Rectangle: ", clipRect);
          //ds(this.__container, "clip", clipRect);
        }
        
        ds(this.__container, "clip", clipRect);
        //console.log("Clip Rect: ", this.__container.style.clip);
      },
      
      _getAvailExtent: function() {
        var extent = this.extent, clip = this._clip;
        
        if (clip) {
          if (!extent._clip) {
            var rect = new esri.geometry._extentToRect(extent);
            rect.width = clip[1];
            rect.x = rect.x + clip[0];
            
            extent._clip = rect.getExtent();
          }
          
          return extent._clip;  
        }
        
        return extent;
      },
      
      //fixed panning methods
      panUp: function() {
        this._fixedPan(0, this.height * -_FIXED_PAN_FACTOR);
      },

      panUpperRight: function() {
        this._fixedPan(this.width * _FIXED_PAN_FACTOR, this.height * -_FIXED_PAN_FACTOR);
      },

      panRight: function() {
        this._fixedPan(this.width * _FIXED_PAN_FACTOR, 0);
      },

      panLowerRight: function() {
        this._fixedPan(this.width * _FIXED_PAN_FACTOR, this.height * _FIXED_PAN_FACTOR);
      },

      panDown: function() {
        this._fixedPan(0, this.height * _FIXED_PAN_FACTOR);
      },

      panLowerLeft: function() {
        this._fixedPan(this.width * -_FIXED_PAN_FACTOR, this.height * _FIXED_PAN_FACTOR);
      },

      panLeft: function() {
        this._fixedPan(this.width * -_FIXED_PAN_FACTOR, 0);
      },

      panUpperLeft: function() {
        this._fixedPan(this.width * -_FIXED_PAN_FACTOR, this.height * -_FIXED_PAN_FACTOR);
      },
      
      enableSnapping: function(snapOptions) {
        if (!snapOptions) {
          snapOptions = {};
        }
        if (snapOptions.declaredClass === "esri.SnappingManager") {
          this.snappingManager = snapOptions;
        }
        else {        
          this.snappingManager = new esri.SnappingManager(dojo.mixin({map: this}, snapOptions));
        }
        //this.snappingManager._setUpSnapping();
        return this.snappingManager;
      },

      disableSnapping: function() {
        if (this.snappingManager) {
          this.snappingManager.destroy();
        }
        this.snappingManager = null;
      }
    };
  }())
);
});
