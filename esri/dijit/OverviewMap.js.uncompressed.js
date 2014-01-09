//>>built
// wrapped by build app
define("esri/dijit/OverviewMap", ["dijit","dojo","dojox","dojo/require!dijit/_Widget,dijit/_Templated,dojo/dnd/Mover,dojo/dnd/Moveable,dojo/dnd/move"], function(dijit,dojo,dojox){
dojo.provide("esri.dijit.OverviewMap");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");
dojo.require("dojo.dnd.Mover");
dojo.require("dojo.dnd.Moveable");
dojo.require("dojo.dnd.move");

/***************
 * CSS Includes
 ***************/
//anonymous function to load CSS files required for this module
(function() {
  var css = [
    dojo.moduleUrl("esri.dijit", "css/OverviewMap.css")
  ];

  var head = document.getElementsByTagName("head").item(0), link, 
      i, il = css.length;
  for (i=0; i<il; i++) {
    link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = css[i].toString();
    head.appendChild(link);
  }
}());

/********************
 * OverviewMap Dijit
 ********************/
dojo.declare("esri.dijit.OverviewMap", [dijit._Widget, dijit._Templated], {

  widgetsInTemplate: true,
  templateString:"<div class=\"esriOverviewMap\">\r\n  <div class=\"ovwContainer\" dojoattachpoint=\"_body\" style=\"width: ${width}px; height: ${height}px;\">\r\n    <div id=\"${id}-map\" style=\"width: 100%; height: 100%;\">\r\n      <div class=\"ovwHighlight\" dojoattachpoint=\"_focusDiv\" title=\"${NLS_drag}\" style=\"border: 1px solid ${color}; background-color: ${color};\"></div>\r\n    </div>\r\n  </div>\r\n  <div class=\"ovwButton ovwController\" title=\"${NLS_show}\" dojoattachpoint=\"_controllerDiv\" dojoattachevent=\"onclick: _visibilityHandler\">\r\n  </div>\r\n  <div class=\"ovwButton ovwMaximizer\" title=\"${NLS_maximize}\" dojoattachpoint=\"_maximizerDiv\" dojoattachevent=\"onclick: _maximizeHandler\">\r\n  </div>\r\n</div>\r\n",
  basePath: dojo.moduleUrl("esri.dijit"),
  
  /********************
   * Overriden Methods
   ********************/
  
  constructor: function(params, srcNodeRef) {
    // Mixin i18n strings
    dojo.mixin(this, esri.bundle.widgets.overviewMap);
    
    params = params || {};
    if (!params.map) {
      console.error("esri.dijit.OverviewMap: " + this.NLS_noMap);
      return;
    }
    
    var coords = {};
    if (srcNodeRef) { // user has provided a DOM node that should be used as the container for overview map
      this._detached = true;
      coords = dojo.coords(srcNodeRef, true);
    }

    /**************************
     * Configurable Properties
     **************************/
    
    this.map = params.map; // REQUIRED
    this.baseLayer = params.baseLayer;
    this.width = params.width || coords.w || this.map.width / 4;
    this.height = params.height || coords.h || this.map.height / 4;
    this.attachTo = params.attachTo || "top-right";
    this.expandFactor = params.expandFactor || 2;
    this.color = params.color || "#000000";
    this.opacity = params.opacity || 0.5;
    this.maximizeButton = !!params.maximizeButton;
    this.visible = !!params.visible;
    
    // Initial setup
    
    this._mainMapLayer = this.map.getLayer(this.map.layerIds[0]);
    if (!this._mainMapLayer) {
      console.error("esri.dijit.OverviewMap: " + this.NLS_noLayer);
      return;
    }
    //var mainMapLayerType = this._mainMapLayer.declaredClass;
    
    var layer = this.baseLayer || this._mainMapLayer; //, layerType = layer.declaredClass;
    var mapSR = this.map.spatialReference, lyrSR = layer.spatialReference;
    if ((lyrSR.wkid !== mapSR.wkid) && (lyrSR.wkt !== mapSR.wkt)) {
      console.error("esri.dijit.OverviewMap: " + this.NLS_invalidSR);
      return;
    }
    
    var layerType = layer.declaredClass;
    if (layer instanceof esri.layers.TiledMapServiceLayer) { // overview map will be tiled (with an exception)
      //if (this._mainMapLayer instanceof esri.layers.TiledMapServiceLayer) { // main map is tiled at its base
        if (params.baseLayer) { // user defined overview map base layer
          this.baseLayer = params.baseLayer;
        }
        else { // get the layer from main map
          if (layerType.indexOf("VETiledLayer") !== -1) {
            this.baseLayer = new esri.virtualearth.VETiledLayer({ resourceInfo: layer.getResourceInfo(), culture: layer.culture, mapStyle: layer.mapStyle, bingMapsKey: layer.bingMapsKey });
          }
          else if (layerType.indexOf("OpenStreetMapLayer") !== -1) {
            this.baseLayer = new esri.layers.OpenStreetMapLayer({ tileServers: layer.tileServers });
          }
          else {
            this.baseLayer = new esri.layers.ArcGISTiledMapServiceLayer(layer.url, { resourceInfo: layer.getResourceInfo() });
          }
        }
      /*}
      else { // main map is dynamic at its base
        console.error("esri.dijit.OverviewMap: overview map with a tiled-layer is not supported for a map with a dynamic layer as its base layer");
        return;
      }*/
    }
    else if (layer instanceof esri.layers.DynamicMapServiceLayer) { // overview map will be dynamic
      if (params.baseLayer) {
        this.baseLayer = params.baseLayer;
      }
      else {
        if (layerType.indexOf("ArcGISImageServiceLayer") !== -1) {
          this.baseLayer = new esri.layers.ArcGISImageServiceLayer(layer.url);
        }
        else {
          this.baseLayer = new esri.layers.ArcGISDynamicMapServiceLayer(layer.url);
          this.baseLayer.setImageFormat("png24");
        }
      }
    }
    else {
      console.error("esri.dijit.OverviewMap: " + this.NLS_invalidType);
      return;
    }
    
    /*switch (layerType) {
      case "esri.layers.ArcGISTiledMapServiceLayer": // overview map will be tiled (with an exception)
        if (mainMapLayerType === "esri.layers.ArcGISTiledMapServiceLayer") { // main map is tiled at its base
          this.baseLayer = params.baseLayer || new esri.layers.ArcGISTiledMapServiceLayer(layer.url);
          if (this.baseLayer.loaded) {
            this._calculateLods();
          }
          else {
            dojo.connect(this.baseLayer, "onLoad", this, this._calculateLods);
          }
          this.dynamicVersion = new esri.layers.ArcGISDynamicMapServiceLayer(layer.url);
          this.dynamicVersion.hide();
          this.dynamicVersion.setImageFormat("png24");
        }
        else { // main map is dynamic at its base
          console.error("esri.dijit.OverviewMap: overview map with a tiled-layer is not supported for a map with a dynamic layer as its base layer");
          return;
        }
        break;
      case "esri.layers.ArcGISDynamicMapServiceLayer": // overview map will be dynamic
        if (params.baseLayer) {
          this.baseLayer = params.baseLayer;
        }
        else {
          this.baseLayer = new esri.layers.ArcGISDynamicMapServiceLayer(layer.url);
          this.baseLayer.setImageFormat("png24");
        }
        break;
      default:
        console.error("esri.dijit.OverviewMap: unsupported layer type. valid types are 'ArcGISTiledMapServiceLayer' and 'ArcGISDynamicMapServiceLayer'");
        return;
    }*/
    
    // UI customization
    
    if (this._detached) {
      //this._xanchor = this._yanchor = this._border = this._padding = this._expandImg = this._maximizeImg = "";
      this.visible = true;
    }
    /*else {
      var anchor = this.attachTo.split("-");
      this._xanchor = anchor[1] + ": 0px;";
      this._yanchor = anchor[0] + ": 0px;";
      var anti_xanchor = (anchor[1] === "left" ? "right" : "left");
      var anti_yanchor = (anchor[0] === "top" ? "bottom" : "top");
      this._border = "border-" + anti_xanchor + ": 1px solid #000; border-" + anti_yanchor + ": 1px solid #000;";
      this._padding = "padding-" + anti_xanchor + ": 2px; padding-" + anti_yanchor + ": 2px;";
    }*/
    this._maximized = false;
  },
  
  startup: function() {
    this.inherited(arguments);
    
    // [GOTCHA] add the domNode of this dijit to the page if it is not added already
    if (dojo.isIE) {
      if (!this.domNode.parentElement) {
        this.map.container.appendChild(this.domNode);
      }
    }
    else {
      if (!this.domNode.parentNode) {
        this.map.container.appendChild(this.domNode);
      }
    }
    
    if (this._detached) { // we don't want the controller and maximizer
      dojo.style(this._body, "display", "block");
      dojo.style(this._controllerDiv, "display", "none");
      dojo.style(this._maximizerDiv, "display", "none");
      if (this.baseLayer.loaded) {
        this._initialize();
      }
      else {
        dojo.connect(this.baseLayer, "onLoad", this, this._initialize);
      }
    }
    else {
      // the controller icon (arrow) should always be at the corner
      if (this.attachTo.split("-")[0] === "bottom") {
        this.domNode.insertBefore(this._maximizerDiv, this._controllerDiv);
      }
      
      if (!this.maximizeButton) {
        dojo.addClass(this._maximizerDiv, "ovwDisabledButton");
      }

      dojo.addClass(this.domNode, {
        "top-left": "ovwTL",
        "top-right": "ovwTR",
        "bottom-left": "ovwBL",
        "bottom-right": "ovwBR"
      }[this.attachTo]);
      dojo.addClass(this._controllerDiv, "ovwShow");
      dojo.addClass(this._maximizerDiv, "ovwMaximize");

      if (this.visible) {
        var showFunc = function() {
          this.visible = false;
          this._show();
        };
        
        if (this.baseLayer.loaded) {
          showFunc.call(this);
        }
        else {
          dojo.connect(this.baseLayer, "onLoad", this, showFunc);
        }
      }
    }
    
    dojo.style(this._focusDiv, "opacity", this.opacity);
  },
  
  destroy: function() {
    this._deactivate();
    if (this.overviewMap) {
      this.overviewMap.destroy();
    }
    this.overviewMap = this.baseLayer = null; // this.dynamicVersion = null;
    this.inherited(arguments);
  },
  
  resize: function(size) {
    //console.log("resize: ", size && size.w, size && size.h);
    if (!size || size.w <=0 || size.h <= 0) {
      return;
    }
    this._resize(size.w, size.h);
  },
  
  /*****************
   * Public Methods
   *****************/
  
  /*******************
   * Internal Methods
   *******************/
  
  /*_calculateLods: function() {
    // find lods additionally required for the overview map
    var i, j, scale, lod, multiplier = (this.map.width / this.width) * this.expandFactor, lods = [];
    var mainMapLods = this._mainMapLayer.tileInfo.lods, mapSvcLods = this.baseLayer.tileInfo.lods;
    
    for (i = mainMapLods.length - 1; i >= 0; i--) {
      scale = mainMapLods[i].scale * multiplier;
      j = mapSvcLods.length - 1;
      while (j >= 0 && mapSvcLods[j].scale < scale) j--;
      if (j < 0 && (mapSvcLods[0].scale + 1 - scale) < 0) {
        lods.push({ resolution: mainMapLods[i].resolution * multiplier, scale: scale });
      }
    }
    lods.sort(function(a, b) {
      if (a.scale > b.scale) return -1;
      if (a.scale < b.scale) return 1;
      return 0;
    });
    //console.log(lods);

    for (i = 0; i < lods.length; i++) {
      lods[i].level = i;
    }
    this._levelCutoff = i;
    for (j = 0; j < mapSvcLods.length; j++) {
      lod = mapSvcLods[j];
      lods.push({ level: lod.level + i, resolution: lod.resolution, scale: lod.scale });
    }
    //console.log(lods);
    this._overviewLods = lods;
  },*/
  
  _visibilityHandler: function() {
    if (this.visible) { // hide
      this._hide();
    }
    else { // show
      this._show();
    }
  },
  
  _show: function() {
    if (!this.visible) {
      var div = this._controllerDiv;
      div.title = this.NLS_hide;
      dojo.removeClass(div, "ovwShow");
      dojo.addClass(div, "ovwHide");
      
      esri.show(this._body);
      esri.show(this._maximizerDiv);
      this._initialize();
      this.visible = true;
    }
  },
  
  _hide: function() {
    if (this.visible) {
      var div = this._controllerDiv;
      div.title = this.NLS_show;
      dojo.removeClass(div, "ovwHide");
      dojo.addClass(div, "ovwShow");
      
      if (this._maximized) {
        this._maximizeHandler();
      }
      esri.hide(this._body);
      esri.hide(this._maximizerDiv);
      this._deactivate();
      this.visible = false;
    }
  },
  
  _maximizeHandler: function() {
    var div = this._maximizerDiv;
    if (this._maximized) { // minimize
      div.title = this.NLS_maximize;
      dojo.removeClass(div, "ovwRestore");
      dojo.addClass(div, "ovwMaximize");
      this._resize(this.width, this.height);
    }
    else { // maximize
      div.title = this.NLS_restore;
      dojo.removeClass(div, "ovwMaximize");
      dojo.addClass(div, "ovwRestore");
      this._resize(this.map.width, this.map.height);
    }
    this._maximized = ! this._maximized;
  },
  
  _resize: function(width, height) {
    dojo.style(this._body, { width: width + "px", height: height + "px" });
    var savedPanDuration = esri.config.defaults.map.panDuration, ovMap = this.overviewMap; //, temp = false, dv = this.dynamicVersion;
    esri.config.defaults.map.panDuration = 0;
    /*if (dv && dv.visible) {
      temp = true;
      dv.hide();
    }*/
    ovMap.resize(true);
    ovMap.centerAt(this._focusExtent.getCenter());
    /*if (temp) {
      dv.show();
    }*/
    esri.config.defaults.map.panDuration = savedPanDuration;
  },
  
  _initialize: function() {
    if (!this.overviewMap) {
      var ovMap;
      ovMap = (this.overviewMap = new esri.Map(this.id + "-map", { 
        slider: false, 
        lods: this._overviewLods,
        wrapAround180: this.map.wrapAround180
      }));
      dojo.connect(ovMap, "onLoad", this, function() {
        this._map_resize_override = dojo.hitch(ovMap, this._map_resize_override);
        ovMap.disableMapNavigation();
        this._activate();
      });
      /*if (this.dynamicVersion) {
        ovMap.addLayer(this.dynamicVersion);
      }*/
      ovMap.addLayer(this.baseLayer);
    }
    else {
      this._activate();
    }
  },
  
  _activate: function() {
    var map = this.map, ovMap = this.overviewMap;
    this._moveableHandle = new dojo.dnd.Moveable(this._focusDiv);
    this._soeConnect = dojo.connect(map, "onExtentChange", this, this._syncOverviewMap);
    this._ufoConnect = dojo.connect(map, "onPan", this, this._updateFocus);
    this._oecConnect = dojo.connect(ovMap, "onExtentChange", this, this._ovwExtentChangeHandler);
    this._opaConnect = dojo.connect(ovMap, "onPan", this, this._ovwPanHandler);
    this._ozsConnect = dojo.connect(ovMap, "onZoomStart", this, function() { esri.hide(this._focusDiv); });
    this._ozeConnect = dojo.connect(ovMap, "onZoomEnd", this, function() { esri.show(this._focusDiv); });
    this._omsConnect = dojo.connect(this._moveableHandle, "onMoveStop", this, this._moveStopHandler);
    this._syncOverviewMap(map.extent, null, null, null);
  },
  
  _deactivate: function() {
    dojo.disconnect(this._soeConnect); 
    dojo.disconnect(this._ufoConnect); 
    dojo.disconnect(this._oecConnect); 
    dojo.disconnect(this._opaConnect); 
    dojo.disconnect(this._ozsConnect); 
    dojo.disconnect(this._ozeConnect);
    dojo.disconnect(this._omsConnect);
    if (this._moveableHandle) {
      this._moveableHandle.destroy();
    } 
  },
  
  _syncOverviewMap: function(ext, delta, levelChange, lod) {
    if (this._suspendPanHandling) {
      this._suspendPanHandling = false;
      return;
    }
    //this._updateFocus(ext);
    this._focusExtent = ext;
    
    /*if (this.dynamicVersion && (levelChange || firstTime)) {
      this._switchLayers = (this.map.getLevel() < this._levelCutoff) ? "D" : "T";
    }*/
    this.overviewMap.setExtent(ext.expand(this.expandFactor), true);
  },
  
  _updateFocus: function(ext) {
    if (this._suspendPanHandling) {
      return;
    } 
    this._focusExtent = ext;
    this._drawFocusDiv(ext);
  },
  
  _drawFocusDiv: function(ext, delta) {
    var ovMap = this.overviewMap;
    var tl = ovMap.toScreen(new esri.geometry.Point(ext.xmin, ext.ymax, ovMap.spatialReference));
    var br = ovMap.toScreen(new esri.geometry.Point(ext.xmax, ext.ymin, ovMap.spatialReference));
    //console.log(ovMap.width + ", " + ovMap.height + ", " + (br.x - tl.x) + " px, " + (br.y - tl.y) + " px");
    
    var width = br.x - tl.x, height = br.y - tl.y, enable = true;
    if ((width > this.overviewMap.width) && (height > this.overviewMap.height)) {
      enable = false;
    }
    
    dojo.style(this._focusDiv, {
      left: tl.x + (delta ? delta.x : 0) + "px",
      top: tl.y + (delta ? delta.y : 0) + "px",
      width: width + "px",
      height: height + "px",
      display: enable ? "block" : "none"
    });
  },
  
  _moveStopHandler: function(evt) {
    var style = this._moveableHandle.node.style;
    var ext = this._focusExtent;
    var ovMap = this.overviewMap;

    var leftTop = ovMap.toMap(new esri.geometry.Point(parseInt(style.left, 10), parseInt(style.top, 10)));
    var prev = new esri.geometry.Point(ext.xmin, ext.ymax, ovMap.spatialReference);
    
    this._focusExtent = ext.offset(leftTop.x - prev.x, leftTop.y - prev.y);
    if (this._maximized) {
      this._maximizeHandler();
    }
    else {
      ovMap.centerAt(this._focusExtent.getCenter());
    }

    this._suspendPanHandling = true;
    this.map.setExtent(this._focusExtent);
  },
  
  _ovwExtentChangeHandler: function() {
    /*if (this._switchLayers) {
      if (this._switchLayers === "D") { // switch to dynamic version of the cached map service layer
        //console.log("-dynamic-");
        this.dynamicVersion.show();
        this.baseLayer.hide();
      }
      else {
        //console.log("-CacheD-");
        this.baseLayer.show();
        this.dynamicVersion.hide();
      }
      this._switchLayers = null;
    }*/
    this._drawFocusDiv(this._focusExtent);
  },
  
  _ovwPanHandler: function(ext ,delta) {
    this._drawFocusDiv(this._focusExtent, delta);
  }
});

});
