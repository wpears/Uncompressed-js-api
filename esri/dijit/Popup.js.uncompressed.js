//>>built
// wrapped by build app
define("esri/dijit/Popup", ["dijit","dojo","dojox","dojo/require!esri/InfoWindowBase,esri/PopupBase,esri/utils,dijit/_Widget,dijit/_Templated,dojo/number,dojo/date/locale,dojox/charting/Chart2D,dojox/charting/themes/PlotKit/base,dojox/charting/action2d/Tooltip,dojo/i18n"], function(dijit,dojo,dojox){
dojo.provide("esri.dijit.Popup");

dojo.require("esri.InfoWindowBase");
dojo.require("esri.PopupBase");
dojo.require("esri.utils");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");

// TODO
// Should these be dynamic dependencies?
// Modules required for date and number formatting
dojo.require("dojo.number");
dojo.require("dojo.date.locale");
// Modules requried for charting
dojo.require("dojox.charting.Chart2D");
dojo.require("dojox.charting.themes.PlotKit.base");
dojo.require("dojox.charting.action2d.Tooltip");
//dojo.require("dojox.charting.action2d.MoveSlice");
//dojo.require("dojox.charting.action2d.Magnify");
//dojo.require("dojox.charting.action2d.Highlight");
//dojo.require("dojox.charting.widget.Legend");
dojo.require("dojo.i18n");

// Based on dojox.charting.themes.PlotKit.blue theme
(function(){
  var dc = dojox.charting, pk = dc.themes.PlotKit;

  pk.popup = pk.base.clone();
  pk.popup.chart.fill = pk.popup.plotarea.fill = "#e7eef6";
  
  // Based on colors used by Explorer Online
  pk.popup.colors = [ // 15 colors
    "#284B70", // Blue
    "#702828", // Red
    "#5F7143", // Light Green
    "#F6BC0C", // Yellow
    "#382C6C", // Indigo
    "#50224F", // Magenta
    "#1D7554", // Dark Green
    "#4C4C4C", // Gray Shade
    "#0271AE", // Light Blue
    "#706E41", // Brown
    "#446A73", // Cyan
    "#0C3E69", // Medium Blue
    "#757575", // Gray Shade 2
    "#B7B7B7", // Gray Shade 3
    "#A3A3A3" // Gray Shade 4
  ];
  pk.popup.series.stroke.width = 1;
  pk.popup.marker.stroke.width = 1;
}());

// TODO
// Optimal max-height for the content pane could be
// (map.height / 2) - (approx height of title pane + actions pane) - (approx height of the popup tail)

/*******************
 * esri.dijit.Popup
 *******************/
dojo.declare("esri.dijit.Popup", [ esri.InfoWindowBase, esri.PopupBase ], {
  
  offsetX: 3,
  offsetY: 3,
  zoomFactor: 4,
  marginLeft: 25,
  marginTop: 25,
  highlight: true,
  
  constructor: function(parameters, srcNodeRef) {
    /**
     * Supported parameters:
     *   markerSymbol
     *   lineSymbol
     *   fillSymbol
     *   offsetX (in pixels)
     *   offsetY (in pixels)
     *   zoomFactor (number of levels to zoom in)
     *   marginLeft (in pixels)
     *   marginTop (in pixels)
     *   highlight
     */
    this.initialize();
    dojo.mixin(this, parameters);
    this.domNode = dojo.byId(srcNodeRef);
    
    var nls = this._nls = dojo.mixin({}, esri.bundle.widgets.popup);

    var domNode = this.domNode;
    dojo.addClass(domNode, "esriPopup");

    /***************************
     * Create the DOM structure
     ***************************/
    
    var structure = 
      "<div class='esriPopupWrapper' style='position: absolute;'>" +
      "<div class='sizer'>" +
        "<div class='titlePane'>" +
          "<div class='spinner hidden' title='" + nls.NLS_searching + "...'></div>" +
          "<div class='title'></div>" +
          "<div class='titleButton prev hidden' title='" + nls.NLS_prevFeature + "'></div>" +
          "<div class='titleButton next hidden' title='" + nls.NLS_nextFeature + "'></div>" +
          "<div class='titleButton maximize' title='" + nls.NLS_maximize + "'></div>" +
          "<div class='titleButton close' title='" + nls.NLS_close + "'></div>" +
        "</div>" +
      "</div>" +
      
      "<div class='sizer content'>" +
        "<div class='contentPane'>" + 
        "</div>" +
      "</div>" +
      
      "<div class='sizer'>" + 
        "<div class='actionsPane'>" + 
          "<div class='actionList hidden'>" + 
            "<a class='action zoomTo' href='javascript:void(0);'>" + nls.NLS_zoomTo + "</a>" + 
          "</div>" +
        "</div>" +
      "</div>" +
      
      /*"<div class='pointer top hidden'></div>" +
      "<div class='pointer bottom hidden'></div>" +
      "<div class='pointer left hidden'></div>" +
      "<div class='pointer right hidden'></div>" +
      "<div class='pointer topLeft hidden'></div>" +
      "<div class='pointer topRight hidden'></div>" +
      "<div class='pointer bottomLeft hidden'></div>" +
      "<div class='pointer bottomRight hidden'></div>" + */

      "<div class='pointer hidden'></div>" +
      "</div>" +
      "<div class='outerPointer hidden'></div>";

    dojo.attr(domNode, "innerHTML", structure);
    
    // Get references to nodes for later use so that we don't 
    // have to perform DOM queries often
    this._sizers = dojo.query(".sizer", domNode);
    
    var titlePane = dojo.query(".titlePane", domNode)[0];
    dojo.setSelectable(titlePane, false);
    
    this._title = dojo.query(".title", titlePane)[0];
    this._prevFeatureButton = dojo.query(".prev", titlePane)[0];
    this._nextFeatureButton = dojo.query(".next", titlePane)[0];
    this._maxButton = dojo.query(".maximize", titlePane)[0];
    this._spinner = dojo.query(".spinner", titlePane)[0];
    
    this._contentPane = dojo.query(".contentPane", domNode)[0];
    this._positioner = dojo.query(".esriPopupWrapper", domNode)[0];
    this._pointer = dojo.query(".pointer", domNode)[0];
    this._outerPointer = dojo.query(".outerPointer", domNode)[0];

    this._actionList = dojo.query(".actionsPane .actionList", domNode)[0];
    
    /***********************
     * Setup event handlers
     ***********************/
    
    this._eventConnections = [
      dojo.connect(dojo.query(".close", titlePane)[0], "onclick", this, this.hide),
      dojo.connect(this._prevFeatureButton, "onclick", this, this.selectPrevious),
      dojo.connect(this._nextFeatureButton, "onclick", this, this.selectNext),
      dojo.connect(this._maxButton, "onclick", this, this._toggleSize),
      dojo.connect(dojo.query(".zoomTo", this._actionList)[0], "onclick", this, this._zoomToFeature)
    ];

    // iOS wants the user to do two-finger scrolling for overflowing elements 
    // inside the body. We want to let the users do this with one finger.
    if (esri.isTouchEnabled) {
      var handles = esri.setScrollable(this._contentPane);
      this._eventConnections.push(handles[0], handles[1]);
    }

    // Hidden initially
    //esri.hide(domNode);
    this._setVisibility(false);
    this.isShowing = false;
  },
  
  /*****************************************
   * Override and implement methods defined  
   * by the base class: InfoWindowBase
   *****************************************/
  
  setMap: function(map) {
    // Run logic defined in the base class
    this.inherited(arguments);
    
    dojo.place(this.domNode, map.root);
   
    if (this.highlight) {
      this.enableHighlight(map);
    }
    
    this._maxHeight = dojo.style(this._contentPane, "maxHeight");
  },
  
  unsetMap: function() {
    this.disableHighlight(this.map);

    // Run logic defined in the base class
    this.inherited(arguments);
  },
  
  setTitle: function(title) {
    if (!esri._isDefined(title) || title === "") {
      title = "&nbsp;";
    }
    
    this.destroyDijits(this._title);
    this.place(title, this._title);
    if (this.isShowing) {
      this.startupDijits(this._title);
      this.reposition();
    }
  },
  
  setContent: function(content) {
    if (!esri._isDefined(content) || content === "") {
      content = "&nbsp;";
    }
    
    this.destroyDijits(this._contentPane);
    this.place(content, this._contentPane);
    if (this.isShowing) {
      this.startupDijits(this._contentPane);
      this.reposition();
    }
  },
  
  show: function(location, options) {
    if (!location) {
      //esri.show(this.domNode);
      this._setVisibility(true);
      this.isShowing = true;
      return;
    }
    
    // Is location specified in map coordinates?
    var map = this.map, screenLocation;
    if (location.spatialReference) {
      this._location = location;
      screenLocation = map.toScreen(location);
    }
    else {
      this._location = map.toMap(location);
      screenLocation = location;
    }
    
    var mapFrameWidth = map._getFrameWidth();
    if (mapFrameWidth !== -1) {
      screenLocation.x = screenLocation.x % mapFrameWidth;
      if (screenLocation.x < 0) {
        screenLocation.x += mapFrameWidth;
      }
      if (map.width > mapFrameWidth) {
        var margin = (map.width - mapFrameWidth)/2;
        while (screenLocation.x < margin) {
          screenLocation.x += mapFrameWidth;
        }
      }
    }

    if (this._maximized) {
      this.restore();
    }
    else {
      this._setPosition(screenLocation);
    }    
    
    if (options && options.closestFirst) {
      this.showClosestFirst(this._location);
    }
    
    // Display
    if (!this.isShowing) {
      //esri.show(this.domNode);
      this._setVisibility(true);
      this.isShowing = true;
      this.onShow();
    }
  },
  
  hide: function() {
    if (this.isShowing) {
      //esri.hide(this.domNode);
      this._setVisibility(false);
      this.isShowing = false;
      this.onHide();
    }
  },
  
  resize: function(width, height) {
    this._sizers.style({
      width: width + "px"
    });
    
    dojo.style(this._contentPane, "maxHeight", height + "px");
    this._maxHeight = height;
    
    if (this.isShowing) {
      this.reposition();
    }
  },
  
  reposition: function() {
    // NOP if the popup is maximized
    // NOP if the popup is not currently showing
    if (this.map && this._location && !this._maximized && this.isShowing) {
      this._setPosition(this.map.toScreen(this._location));
    }
  },
  
  onShow: function() {
    this._followMap();
    this.startupDijits(this._title);
    this.startupDijits(this._contentPane);
    this.reposition();
    this.showHighlight();
  },
  
  onHide: function() {
    this._unfollowMap();
    this.hideHighlight();
  },
  
  /************************************
   * Defining some methods specific to
   * this popup info window
   ************************************/
  
  maximize: function() {
    var map = this.map;
    if (!map || this._maximized) {
      return;
    }
    
    this._maximized = true;

    var max = this._maxButton;
    dojo.removeClass(max, "maximize");
    dojo.addClass(max, "restore");
    dojo.attr(max, "title", this._nls.NLS_restore);

    var marginLeft = this.marginLeft, marginTop = this.marginTop,
        width = map.width - (2 * marginLeft), height = map.height - (2 * marginTop),
        domNode = this.domNode;
    
    // New positioning
    dojo.style(domNode, {
      left: marginLeft + "px",
      right: null,
      top: marginTop + "px",
      bottom: null
    });
    
    dojo.style(this._positioner, {
      left: null,
      right: null,
      top: null,
      bottom: null
    });

    // Save current size    
    this._savedWidth = dojo.style(this._sizers[0], "width");
    this._savedHeight = dojo.style(this._contentPane, "maxHeight");
    
    // New size
    //dojo.removeClass(domNode, "attached");
    
    this._sizers.style({
      width: width + "px"
    });
    
    // TODO
    // Instead of using magic# 65, obtain the current size
    // of title bar plus action bar
    dojo.style(this._contentPane, {
      maxHeight: (height - 65) + "px",
      height: (height - 65) + "px"
    });
    
    // Hide all tails
    this._showPointer("");
    
    // Disconnect from map
    this._unfollowMap();
    dojo.addClass(this.domNode, "esriPopupMaximized");
    
    this.onMaximize();
  },
  
  restore: function() {
    var map = this.map;
    if (!map || !this._maximized) {
      return;
    }
    
    this._maximized = false;

    var max = this._maxButton;
    dojo.removeClass(max, "restore");
    dojo.addClass(max, "maximize");
    dojo.attr(max, "title", this._nls.NLS_maximize);
   
    dojo.style(this._contentPane, "height", null);
    
    //dojo.addClass(domNode, "attached");
    this.resize(this._savedWidth, this._savedHeight);
    this._savedWidth = this._savedHeight = null;

    this.show(this._location);
    
    // Re-connect to map
    this._followMap();
    dojo.removeClass(this.domNode, "esriPopupMaximized");
    
    this.onRestore();
  },
  
  destroy: function() {
    if (this.map) {
      this.unsetMap();
    }
    this.cleanup();
    if (this.isShowing) {
      this.hide();
    }
    this.destroyDijits(this._title);
    this.destroyDijits(this._content);
    dojo.forEach(this._eventConnections, dojo.disconnect);
    dojo.destroy(this.domNode);
    
    this._sizers = this._contentPane = this._actionList =
    this._positioner = this._pointer = this._outerPointer = 
    this._title = this._prevFeatureButton = 
    this._nextFeatureButton = this._spinner = this._eventConnections = 
    this._pagerScope = this._targetLocation = this._nls = 
    this._maxButton = null;
  },
  
  selectNext: function() {
    this.select(this.selectedIndex + 1);
  },
  
  selectPrevious: function() {
    this.select(this.selectedIndex - 1);
  },
  
  /***********************************************
   * Overriding some methods defined in PopupBase
   ***********************************************/
 
  setFeatures: function() {
    this.inherited(arguments);
    
    // TODO
    // We want to do this only when deferreds are
    // passed as arguments. As far as I know there is no
    // harm in doing this for features
    this._updateUI();
  },
  
  onSetFeatures: function() {
    //console.log("onSetFeatures");
  },
  
  onClearFeatures: function() {
    //console.log("onClearFeatures");

    this.setTitle("&nbsp;");
    this.setContent("&nbsp;");
    this._setPagerCallbacks(this);
    
    this._updateUI();
    this.hideHighlight();
  },
  
  onSelectionChange: function() {
    //console.log("onSelectionChange");
    
    var ptr = this.selectedIndex;
    
    this._updateUI();
    
    if (ptr >= 0) {
      this.setContent(this.features[ptr].getContent());
      
      //this._highlight(this.features[ptr]);
      this.updateHighlight(this.map, this.features[ptr]);
      if (this.isShowing) {
        this.showHighlight();
      }
    }
  },
  
  onDfdComplete: function() {
    //console.log("onDfdComplete");
    this.inherited(arguments);
    this._updateUI();
  },
  
  onMaximize: function() {},
  onRestore: function() {},
  
  /*******************
   * Internal Methods
   *******************/
  
  _setVisibility: function(visible) {
    //this.reposition();

    //esri[visible ? "show" : "hide"](this.domNode);
    dojo.style(this.domNode, "visibility", visible ? "visible" : "hidden");
  },
  
  _followMap: function() {
    this._unfollowMap();
    //console.log("register");
    
    // Setup handlers for map navigation events
    var map = this.map;
    this._handles = [
      dojo.connect(map, "onPanStart", this, this._onPanStart),
      dojo.connect(map, "onPan", this, this._onPan),
      dojo.connect(map, "onZoomStart", this, this._onZoomStart),
      dojo.connect(map, "onExtentChange", this, this._onExtentChange)
    ];
  },
  
  _unfollowMap: function() {
    //console.log("UNregister");
    
    var handles = this._handles;
    if (handles) {
      dojo.forEach(handles, dojo.disconnect, dojo);
      this._handles = null;
    }
  },
  
  _onPanStart: function() {
    // Record the current position of my info window
    var style = this.domNode.style;
    this._panOrigin = { left: style.left, top: style.top, right: style.right, bottom: style.bottom };
  },
  
  _onPan: function(extent, delta) {
    var origin = this._panOrigin, dx = delta.x, dy = delta.y,
        left = origin.left, top = origin.top, 
        right = origin.right, bottom = origin.bottom;
    
    if (left) {
      left = (parseFloat(left) + dx) + "px";
    }
    if (top) {
      top = (parseFloat(top) + dy) + "px";
    }
    if (right) {
      right = (parseFloat(right) - dx) + "px";
    }
    if (bottom) {
      bottom = (parseFloat(bottom) - dy) + "px";
    }
    
    // Relocate the info window by the amount of pan delta
    dojo.style(this.domNode, { left: left, top: top, right: right, bottom: bottom });
  },
  
  _onZoomStart: function() {
    // Temporarily hide the info window
    //esri.hide(this.domNode);
    this._setVisibility(false);
  },
  
  _onExtentChange: function(extent, delta, levelChange) {
    if (levelChange) {
      //esri.show(this.domNode);
      this._setVisibility(true);
      this.show(this._targetLocation || this._location);
    }
    this._targetLocation = null;
  },
  
  _toggleSize: function() {
    if (this._maximized) {
      this.restore();
    }
    else {
      this.maximize();
    }
  },
  
  _setPosition: function(location) {
    var posX = location.x, posY = location.y, offX = this.offsetX || 0, offY = this.offsetY || 0, 
        pointerW = 0, pointerH = 0,
        mapBox = dojo.position(this.map.container, true), width = mapBox.w, height = mapBox.h,
        classX = "Left", classY = "bottom",
        popBox = dojo.contentBox(this._positioner), halfPopW = popBox.w/2, halfPopH = popBox.h/2,
        maxH = dojo.style(this._sizers[0], "height") + this._maxHeight + dojo.style(this._sizers[2], "height"), 
        halfMaxH = maxH / 2,
        xmin = 0, ymin = 0, xmax = width, ymax = height,
        pageX = posX, pageY = posY;

    // Take into account the current view box. The bbox
    // for calculations below expands or shrinks based on 
    // the current dimensions of the doc view box
    var docBox = dojo.getObject("dojo.window.getBox");
    if (docBox) {
      docBox = docBox();
      xmin = Math.max(docBox.l, mapBox.x);
      xmax = Math.min(docBox.l + docBox.w, mapBox.x + mapBox.w);
      ymin = Math.max(docBox.t, mapBox.y);
      ymax = Math.min(docBox.t + docBox.h, mapBox.y + mapBox.h);
      pageX += mapBox.x;
      pageY += mapBox.y;
    }
    //console.log(xmin, xmax, ymin, ymax);

    // TODO
    // 1. Find the real maximum height (maxH) from all the sizers
    // 2. Call this method whenever popup renderer content changes
    // 3. Include pointer width/height in the comparison below

    //console.log("max allowed height = " + maxH);
    //console.log("popup content box = " + dojo.toJson(popBox));
    
    // Check horizontal space first
    if ( ((pageY - ymin) > halfMaxH) && ((ymax - pageY) >= halfMaxH ) ) {
      if ( (xmax - pageX) >= popBox.w ) {
        classY  = "";
        classX = "Left";
      }
      else if ((pageX - xmin) >= popBox.w) {
        classY  = "";
        classX = "Right";
      }
    }
    
    // Check vertical space
    if (classX && classY) {
      if ( ((pageX - xmin) > halfPopW) && ((xmax - pageX) >= halfPopW ) ) {
        if ((pageY - ymin) >= maxH) {
          classX  = "";
          classY = "bottom";
        }
        else if ( (ymax - pageY) >= maxH ) {
          classX  = "";
          classY = "top";
        }
      }
    }
    
    // Check corners
    if (classX && classY) {
      if (pageX <= xmax / 2) {
        classX = "Left";
      }
      else if (pageX <= xmax) {
        classX = "Right";
      }
  
      if (pageY <= ymax / 2) {
        classY = "top";
      }
      else if (pageY <= ymax) {
        classY = "bottom";
      }
    }
    
    var className = classY + classX;
    
    // Height of the pointers (from popup.css)
    switch(className) {
      case "top":
      case "bottom":
        pointerH = 14; // 26;
        break;
      case "Left":
      case "Right":
        pointerW = 13; // 25; 
        break;
      case "topLeft":
      case "topRight":
      case "bottomLeft":
      case "bottomRight":
        pointerH = 45;
        break;
    }

    // Place popup at the right position
    dojo.style(this.domNode, {
      left: posX + "px",
      top: posY + "px",
      right: null,
      bottom: null
    });
    
    var styleVal = { left: null, right: null, top: null, bottom: null };
    
    if (classX) {
      styleVal[classX.toLowerCase()] = (pointerW + offX) + "px";
    }
    else {
      styleVal.left = (-halfPopW) + "px";
    }
    
    if (classY) {
      styleVal[classY] = (pointerH + offY) + "px";
    }
    else {
      styleVal.top = (-halfPopH) + "px";
    }

    dojo.style(this._positioner, styleVal);

    // Display pointer
    this._showPointer(className);


    /*switch(orientation) {
      case "top":
        dojo.style(this.domNode, {
          left: (posX - 135) + "px",
          right: null,
          top: null,
          bottom: (height - posY + tailDy + offY) + "px"
        });
        break;
      case "bottom":
        dojo.style(this.domNode, {
          left: (posX - 135) + "px",
          right: null,
          top: (posY + tailDy + offY) + "px",
          bottom: null
        });
        break;
      case "topLeft":
        dojo.style(this.domNode, {
          left: null,
          right: (width - posX + offX) + "px",
          top: null,
          bottom: (height - posY + tailDy + offY) + "px"
        });
        break;
      case "topRight":
        dojo.style(this.domNode, {
          left: (posX + offX) + "px",
          right: null,
          top: null,
          bottom: (height - posY + tailDy + offY) + "px"
        });
        break;
      case "bottomLeft":
        dojo.style(this.domNode, {
          left: null,
          right: (width - posX + offX) + "px",
          top: (posY + tailDy + offY) + "px",
          bottom: null
        });
        break;
      case "bottomRight":
        dojo.style(this.domNode, {
          left: (posX + offX) + "px",
          right: null,
          top: (posY + tailDy + offY) + "px",
          bottom: null
        });
        break;
    }
        
    if (orientation.indexOf("Left") !== -1) {
      posX -= box.w;
      bufferX *= -1;
    }
    if (orientation.indexOf("top") !== -1) {
      posY -= box.h;
      bufferY *= -1;
    }*/
  },
  
  _showPointer: function(className) {
    /*var pointers = [ 
      "top", "bottom", "right", "left",
      "topLeft", "topRight", "bottomRight", "bottomLeft" 
    ];
    
    dojo.forEach(pointers, function(ptr) {
      if (ptr === className) {
        dojo.query(".pointer." + ptr, this.domNode).removeClass("hidden");
      }
      else {
        dojo.query(".pointer." + ptr, this.domNode).addClass("hidden");
      }
    }, this);*/
   
    dojo.removeClass(this._pointer, [
      "top", "bottom", "right", "left",
      "topLeft", "topRight", "bottomRight", "bottomLeft", 
      "hidden" 
    ]);

    dojo.removeClass(this._outerPointer, [
      "right", "left", "hidden"
    ]);
    
    if (className === "Right" || className === "Left") {
      className = className.toLowerCase();
      dojo.addClass(this._outerPointer, className);
    }
    else {
      dojo.addClass(this._pointer, className);
    }
  },
  
  _setPagerCallbacks: function(scope, prevFunc, nextFunc) {
    if (scope === this && (!this._pagerScope || this._pagerScope === this)) {
      //console.log("return 1");
      return;
    }
    
    if (scope === this._pagerScope) {
      //console.log("return 2");
      return;
    }
    
    this._pagerScope = scope;
    
    if (scope === this) {
      prevFunc = this.selectPrevious;
      nextFunc = this.selectNext;
    }
    
    var connections = this._eventConnections;
    dojo.disconnect(connections[1]);
    dojo.disconnect(connections[2]);
    
    if (prevFunc) {
      connections[1] = dojo.connect(this._prevFeatureButton, "onclick", scope, prevFunc);
    }
    if (nextFunc) {
      connections[2] = dojo.connect(this._nextFeatureButton, "onclick", scope, nextFunc);
    }
  },
  
  _zoomToFeature: function() {
    var features = this.features, ptr = this.selectedIndex, map = this.map;
    
    if (features) {
      //var location = this._getLocation(features[ptr]);
      var geometry = features[ptr].geometry, point, extent, maxDelta = 0, maxEx;
      
      if (geometry) {
        switch(geometry.type) {
          case "point":
            point = geometry;
            break;
          case "multipoint":
            point = geometry.getPoint(0);
            extent = geometry.getExtent();
            break;
          case "polyline":
            point = geometry.getPoint(0, 0);
            extent = geometry.getExtent();
            if (map._getFrameWidth() !== -1) {
              //find the biggest geometry to zoom to.              
              dojo.forEach(geometry.paths, function(path){
                var subPolylineJson = {"paths": [path, map.spatialReference]},
                    subPolyline = new esri.geometry.Polyline(subPolylineJson),
                    subEx = subPolyline.getExtent(),
                    deltaY = Math.abs(subEx.ymax - subEx.ymin),
                    deltaX = Math.abs(subEx.xmax - subEx.xmin),
                    delta = (deltaX > deltaY) ? deltaX: deltaY;
                if (delta > maxDelta) {
                  maxDelta = delta;
                  maxEx = subEx;
                }
              });
							maxEx.spatialReference = extent.spatialReference;
              extent = maxEx;
            }
            break;
          case "polygon":
            point = geometry.getPoint(0, 0);
            extent = geometry.getExtent();
            //for wrap around case, find the smaller extent to fit the geometries with multi-parts.
            if (map._getFrameWidth() !== -1) {
              //find the biggest geometry to zoom to.
              dojo.forEach(geometry.rings, function(ring){
                var subPolygonJson = {"rings": [ring, map.spatialReference]},
                    subPolygon = new esri.geometry.Polygon(subPolygonJson),
                    subEx = subPolygon.getExtent(),
                    deltaY = Math.abs(subEx.ymax - subEx.ymin),
                    deltaX = Math.abs(subEx.xmax - subEx.xmin),
                    delta = (deltaX > deltaY) ? deltaX: deltaY;
                if (delta > maxDelta) {
                  maxDelta = delta;
                  maxEx = subEx;
                }
              });
              maxEx.spatialReference = extent.spatialReference;
              extent = maxEx;
            }
            break;
        }
      }
      
      if (!point) {
        point = this._location;
      }

      // Got to make sure that popup is "show"ed "at" the feature 
      // after zooming in.
      if (!extent || !extent.intersects(this._location)) {
        //this._targetLocation = location[0];
        this._location = point;
      }

      if (extent) { // line or polygon
        map.setExtent(extent, /*fit*/ true);
      }
      else { // point
        var numLevels = map.getNumLevels(), currentLevel = map.getLevel(), 
            last = numLevels - 1, factor = this.zoomFactor || 1;
        
        if (numLevels > 0) { // tiled base layer
          if (currentLevel === last) {
            return;
          }
        
          var targetLevel = currentLevel + factor;
          if (targetLevel > last) {
            targetLevel = last;
          }
          
          //map.centerAndZoom(location[0], targetLevel);
          
          // TODO
          // Expose this functionality via public map API
          map._scrollZoomHandler({ 
            value: (targetLevel - currentLevel), 
            mapPoint: point 
          }, true);
        }
        else { // dynamic base layer
          map._scrollZoomHandler({ 
            value: (1 / Math.pow(2, factor)) * 2, 
            mapPoint: point 
          }, true);
        }
      }
    } // features
  },
  
  _updateUI: function() {
    // TODO
    // A state machine based manipulation of UI elements'
    // visibility would greatly simplify this process
    
    var title = "&nbsp;", ptr = this.selectedIndex,
        features = this.features, deferreds = this.deferreds,
        prev = this._prevFeatureButton, next = this._nextFeatureButton,
        spinner = this._spinner, actionList = this._actionList,
        nls = this._nls;
    
    if (features && features.length > 1) {
      //title = "(" + (ptr+1) + " of " + features.length + ")";
      
      if (nls.NLS_pagingInfo) {
        title = esri.substitute({
          index: (ptr+1), 
          total: features.length
        }, nls.NLS_pagingInfo);
      }

      if (ptr === 0) {
        dojo.addClass(prev, "hidden");
      }
      else {
        dojo.removeClass(prev, "hidden");
      }
      
      if (ptr === features.length-1) {
        dojo.addClass(next, "hidden");
      }
      else {
        dojo.removeClass(next, "hidden");
      }
    }
    else {
      dojo.addClass(prev, "hidden");
      dojo.addClass(next, "hidden");
    }
    this.setTitle(title);
    
    if (deferreds && deferreds.length) {
      if (features) {
        dojo.removeClass(spinner, "hidden");
      }
      else {
        this.setContent("<div style='text-align: center;'>" + nls.NLS_searching + "...</div>");
      }
    }
    else {
      dojo.addClass(spinner, "hidden");
      if (!features || !features.length) {
        this.setContent("<div style='text-align: center;'>" + nls.NLS_noInfo + ".</div>");
      }
    }
    
    if (features && features.length) {
      dojo.removeClass(actionList, "hidden");
    }
    else {
      dojo.addClass(actionList, "hidden");
    }
  }
});


/***************************
 * esri.dijit.PopupTemplate
 ***************************/

dojo.declare("esri.dijit.PopupTemplate", [ esri.PopupInfoTemplate ], {
  chartTheme: "dojox.charting.themes.PlotKit.popup",
  
  constructor: function(json, options) {
    dojo.mixin(this, options);
    
    this.initialize(json);
    this._nls = dojo.mixin({}, esri.bundle.widgets.popup);
  },
  
  getTitle: function(graphic) {
    return this.info ? this.getComponents(graphic).title : "";
    //return "&nbsp;";
  },
  
  getContent: function(graphic) {
    return this.info ? new esri.dijit._PopupRenderer({
      template: this,
      graphic: graphic,
      chartTheme: this.chartTheme,
      _nls: this._nls
    }, dojo.create("div")).domNode : "";
  }
});

/****************************
 * esri.dijit._PopupRenderer
 ****************************/

dojo.declare("esri.dijit._PopupRenderer", [ dijit._Widget, dijit._Templated ], {
  /**
   * Properties:
   *   template
   *   graphic
   *   _nls
   */
  
  // TODO
  // Can I do this without being "Templated". Perhaps,
  // enlist dojo.parser's help?
  
  templateString:
    "<div class='esriViewPopup'>" +
  
      /** Title and Description **/
      "<div class='mainSection'>" + 
        "<div class='header' dojoAttachPoint='_title'></div>" + 
        "<div class='hzLine'></div>" + 
        "<div dojoAttachPoint='_description'></div>" +
        "<div class='break'></div>" +
      "</div>" +
      
      /** Attachments **/
      "<div class='attachmentsSection hidden'>" +
        "<div>${_nls.NLS_attach}:</div>" +
        "<ul dojoAttachPoint='_attachmentsList'>" +
        "</ul>" +
        "<div class='break'></div>" + 
      "</div>" +  
      
      /** Media Section **/
      "<div class='mediaSection hidden'>" + 
        "<div class='header' dojoAttachPoint='_mediaTitle'></div>" + 
        "<div class='hzLine'></div>" +
        "<div class='caption' dojoAttachPoint='_mediaCaption'></div>" +
        
        /** Media Gallery **/
        "<div class='gallery' dojoAttachPoint='_gallery'>" +
          "<div class='mediaHandle prev' dojoAttachPoint='_prevMedia' dojoAttachEvent='onclick: _goToPrevMedia'></div>" + 
          "<div class='mediaHandle next' dojoAttachPoint='_nextMedia' dojoAttachEvent='onclick: _goToNextMedia'></div>" + 
         
          "<ul class='summary'>" +
            "<li class='image mediaCount hidden' dojoAttachPoint='_imageCount'>0</li>" +
            "<li class='image mediaIcon hidden'></li>" +
            "<li class='chart mediaCount hidden' dojoAttachPoint='_chartCount'>0</li>" +
            "<li class='chart mediaIcon hidden'></li>" +
          "</ul>" +
          
          "<div class='frame' dojoAttachPoint='_mediaFrame'></div>" +
          
        "</div>" + // Media Gallery
        
      "</div>" + // Media Section
      
      /** Edit Summary **/
      "<div class='editSummarySection hidden' dojoAttachPoint='_editSummarySection'>" +
        "<div class='break'></div>" +
        "<div class='break hidden' dojoAttachPoint='_mediaBreak'></div>" +
        "<div class='editSummary' dojoAttachPoint='_editSummary'></div>" +
      "</div>" +
    
    "</div>",
  
  startup: function() {
    this.inherited(arguments);
    
    var template = this.template,
        graphic = this.graphic,
        components = template.getComponents(graphic),
        titleText = components.title,
        descText = components.description,
        fields = components.fields,
        mediaInfos = components.mediaInfos,
        domNode = this.domNode,
        nls = this._nls; //, tableView;
    
    this._prevMedia.title = nls.NLS_prevMedia;
    this._nextMedia.title = nls.NLS_nextMedia;
    
    // Main Section: title
    dojo.attr(this._title, "innerHTML", titleText);
    
    if (!titleText) {
      dojo.addClass(this._title, "hidden");
    }
    
    // Main Section: description
    if (!descText && fields) {
      descText = "";
      
      dojo.forEach(fields, function(row) {
        descText += ("<tr valign='top'>");
        descText += ("<td class='attrName'>" + row[0] + "</td>");

        // Note: convert attribute field values that just contain URLs 
        // into clickable links
        descText += ("<td class='attrValue'>" + 
                    row[1].replace(/^\s*(https?:\/\/[^\s]+)\s*$/i, "<a target='_blank' href='$1' title='$1'>" + nls.NLS_moreInfo + "</a>") + 
                    "</td>");
        descText += ("</tr>");
      });
      
      if (descText) {
        //tableView = 1;
        descText = "<table class='attrTable' cellpadding='0px' cellspacing='0px'>" + descText + "</table>";
      }
    }

    dojo.attr(this._description, "innerHTML", descText);
    
    if (!descText) {
      dojo.addClass(this._description, "hidden");
    }
    
    // Make links open in a new tab/window
    dojo.query("a", this._description).forEach(function(node) {
      //console.log("Link: ", node.target, node.href);
      dojo.attr(node, "target", "_blank");
    });

    if (titleText && descText) {
      dojo.query(".mainSection .hzLine", domNode).removeClass("hidden");
    }
    else {
      if (titleText || descText) {
        dojo.query(".mainSection .hzLine", domNode).addClass("hidden");
      }
      else {
        dojo.query(".mainSection", domNode).addClass("hidden");
      }
    }

    // Attachments Section
    var dfd = (this._dfd = template.getAttachments(graphic));
    if (dfd) {
      dfd.addBoth(dojo.hitch(this, this._attListHandler, dfd));
      
      dojo.attr(this._attachmentsList, "innerHTML", "<li>" + nls.NLS_searching + "...</li>");
      dojo.query(".attachmentsSection", domNode).removeClass("hidden");
    }
    
    // Media Section
    if (mediaInfos && mediaInfos.length) {
      dojo.query(".mediaSection", domNode).removeClass("hidden");
      dojo.setSelectable(this._mediaFrame, false);

      this._mediaInfos = mediaInfos;
      this._mediaPtr = 0;
      this._updateUI();
      this._displayMedia();
    }
    
    // Edit summary
    if (components.editSummary /*&& !tableView*/) {
      dojo.attr(this._editSummary, "innerHTML", components.editSummary);
      
      // We need this due to the manner in which the attachments section
      // is rendered (i.e. floating media info elements)
      if (mediaInfos && mediaInfos.length) {
        dojo.removeClass(this._mediaBreak, "hidden");
      }

      dojo.removeClass(this._editSummarySection, "hidden");
    }
  },
  
  destroy: function() {
    if (this._dfd) {
      this._dfd.cancel();
    }
    
    this._destroyFrame();
    
    this.template = this.graphic = this._nls = this._mediaInfos = 
    this._mediaPtr = this._dfd = null;
    
    this.inherited(arguments);
    //console.log("PopupRenderer: destroy");
  },
  
  /*******************
   * Internal Methods
   *******************/
  
  _goToPrevMedia: function() {
    var ptr = this._mediaPtr - 1;
    if (ptr < 0) {
      return;
    }
    
    this._mediaPtr--;
    this._updateUI();
    this._displayMedia();
  },
  
  _goToNextMedia: function() {
    var ptr = this._mediaPtr + 1;
    if (ptr === this._mediaInfos.length) {
      return;
    }
    
    this._mediaPtr++;
    this._updateUI();
    this._displayMedia();
  },
  
  _updateUI: function() {
    var infos = this._mediaInfos, count = infos.length, domNode = this.domNode,
        prevMedia = this._prevMedia, nextMedia = this._nextMedia;
    
    if (count > 1) {
      var numImages = 0, numCharts = 0;
      dojo.forEach(infos, function(info) {
        if (info.type === "image") {
          numImages++;
        }
        else if (info.type.indexOf("chart") !== -1) {
          numCharts++;
        }
      });
      
      if (numImages) {
        dojo.attr(this._imageCount, "innerHTML", numImages);
        dojo.query(".summary .image", domNode).removeClass("hidden");
      }
      
      if (numCharts) {
        dojo.attr(this._chartCount, "innerHTML", numCharts);
        dojo.query(".summary .chart", domNode).removeClass("hidden");
      }
    }
    else {
      dojo.query(".summary", domNode).addClass("hidden");
      dojo.addClass(prevMedia, "hidden");
      dojo.addClass(nextMedia, "hidden");
    }
    
    var ptr = this._mediaPtr;
    if (ptr === 0) {
      dojo.addClass(prevMedia, "hidden");
    }
    else {
      dojo.removeClass(prevMedia, "hidden");
    }
    
    if (ptr === count-1) {
      dojo.addClass(nextMedia, "hidden");
    }
    else {
      dojo.removeClass(nextMedia, "hidden");
    }
    
    this._destroyFrame();
  },
  
  _displayMedia: function() {
    var info = this._mediaInfos[this._mediaPtr],
        titleText = info.title, capText = info.caption,
        hzLine = dojo.query(".mediaSection .hzLine", this.domNode)[0];
      
    dojo.attr(this._mediaTitle, "innerHTML", titleText);
    dojo[titleText ? "removeClass" : "addClass" ](this._mediaTitle, "hidden");
      
    dojo.attr(this._mediaCaption, "innerHTML", capText);
    dojo[capText ? "removeClass" : "addClass"](this._mediaCaption, "hidden");
    
    dojo[(titleText && capText) ? "removeClass" : "addClass"](hzLine, "hidden");
    
    if (info.type === "image") {
      this._showImage(info.value);
    }
    else {
      this._showChart(info.type, info.value);
    }
  },
  
  _showImage: function(value) {
    dojo.addClass(this._mediaFrame, "image");
    
    var galleryHeight = dojo.style(this._gallery, "height"),
        html = "<img src='" + value.sourceURL + "' onload='esri.dijit._PopupRenderer.prototype._imageLoaded(this," + galleryHeight + ");' />";
    
    if (value.linkURL) {
      html = "<a target='_blank' href='" + value.linkURL + "'>" + html + "</a>";
    }
    
    dojo.attr(this._mediaFrame, "innerHTML", html);
  },
  
  _showChart: function(type, value) {
    dojo.removeClass(this._mediaFrame, "image");
    
    var chart = this._chart = new dojox.charting.Chart2D(dojo.create("div", { 
      "class": "chart" 
    }, this._mediaFrame), { 
      margins: { l:4, t:4, r:4, b:4 } 
    });
    
    // "value.theme" is not part of webmap popup spec, but we
    // added it so that developers can override default theme
    var chartTheme = value.theme || this.chartTheme || "PlotKit.popup";
    chart.setTheme(
      dojo.getObject(chartTheme) || 
      dojo.getObject("dojox.charting.themes." + chartTheme)
    );

    // TODO
    // A "grid" plot for line, column and bar charts would be
    // useful
    
    switch(type) {
      case "piechart":
        chart.addPlot("default", { type: "Pie", /*font: "14t", fontColor: "white",*/ labels: false });
        chart.addSeries("Series A", value.fields);
        break;
        
      case "linechart":
        chart.addPlot("default", { type: "Markers" });
        chart.addAxis("x", { min: 0, majorTicks: false, minorTicks: false, majorLabels: false, minorLabels: false });
        chart.addAxis("y", { includeZero: true, vertical: true, fixUpper: "minor" });
        dojo.forEach(value.fields, function(info, idx) {
          info.x = idx + 1;
        });
        chart.addSeries("Series A", value.fields);
        break;

      case "columnchart":
        chart.addPlot("default", { type: "Columns", gap: 3 });
        chart.addAxis("y", { includeZero: true, vertical: true, fixUpper: "minor" });
        chart.addSeries("Series A", value.fields);
        break;
        
      case "barchart":
        chart.addPlot("default", { type: "Bars", gap: 3 });
        chart.addAxis("x", { includeZero: true, fixUpper: "minor", minorLabels: false });
        chart.addAxis("y", { vertical: true, majorTicks: false, minorTicks: false, majorLabels: false, minorLabels: false });
        chart.addSeries("Series A", value.fields);
        break;
    }
    
    this._action = new dojox.charting.action2d.Tooltip(chart);
    // Tooltip action operates on mouseover, let's
    // intercept and use onclick event. Be careful, this will
    // probably not work for other actions
    // Ref:
    // http://dojotoolkit.org/reference-guide/dojox/charting.html
    // http://www.sitepen.com/blog/2008/06/12/dojo-charting-widgets-tooltips-and-legend/
    // TODO
    /*if (esri.isTouchEnabled) {
      this._action.disconnect();
      chart.connectToPlot("default", this, this._processPlotEvent);
    }*/
    
    chart.render();

    //this._legend = new dojox.charting.widget.Legend({chart: chart}, dojo.byId("legendNode"));
  },
  
  /*_processPlotEvent: function(o) {
    if (o.type === "onmouseover") {
      o.shape.rawNode.style.cursor = "pointer";
      return;
    }
    if (o.type === "onclick") {
      o.type = "onmouseover";
    }
    this._action.process(o);
  },*/
  
  _destroyFrame: function() {
    if (this._chart) {
      this._chart.destroy();
      this._chart = null;
    }

    // There is a reason for action being destroyed after
    // the chart: chart.destroy seems to fire onplotreset
    // event. I suspect we should let it be processed in our
    // _processPlotEvent
    if (this._action) {
      this._action.destroy();
      this._action = null;
    }
    
    dojo.attr(this._mediaFrame, "innerHTML", "");
  },
  
  _imageLoaded: function(img, galleryHeight) {
    //console.log("Height = ", img.height, ", Expected = ", galleryHeight);
    
    var imgHeight = img.height;
    if (imgHeight < galleryHeight) {
      var diff = Math.round((galleryHeight - imgHeight) / 2);
      dojo.style(img, "marginTop", diff + "px");
      //console.log("Adjusted margin-top: ", diff);
    }
  },
  
  _attListHandler: function(dfd, attInfos) {
    if (dfd === this._dfd) {
      this._dfd = null;

      /*// For debugging only. Comment this out in
      // production code when checking in to starteam
      if (attInfos instanceof Error) {
        console.log("query attachments ERROR: ", attInfos);
      }*/
      
      var html = "";
      
      if (!(attInfos instanceof Error) && attInfos && attInfos.length) {
        dojo.forEach(attInfos, function(info) {
          html += ("<li>");
          html += ("<a href='" + info.url + "' target='_blank'>" + (info.name || "[No name]") + "</a>");
          html += ("</li>");
        });
      }
      
      // TODO
      // Can we store this result in a cache? But when will the 
      // cache entries be invalidated or removed? This is tricky.
      // Policy could be:
      // - clear cache when the number of entries has reached a preset limit
      // - remove the entry for a feature if the user has edited the
      //   attachments while in "Edit" mode
      // - associate timestamps with each entry and clear them after they
      //   attain certain age.
      // I think we need a global resource cache of some sort that the viewer
      // can manage
      
      dojo.attr(this._attachmentsList, "innerHTML", html || "<li>" + this._nls.NLS_noAttach + "</li>");
    }
  }
});

});
