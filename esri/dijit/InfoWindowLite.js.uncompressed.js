//>>built
// wrapped by build app
define("esri/dijit/InfoWindowLite", ["dijit","dojo","dojox","dojo/require!esri/InfoWindowBase,esri/utils"], function(dijit,dojo,dojox){
dojo.provide("esri.dijit.InfoWindowLite");

dojo.require("esri.InfoWindowBase");
dojo.require("esri.utils");

dojo.declare("esri.dijit.InfoWindow", [ esri.InfoWindowBase ], {
  constructor: function(params, srcNodeRef) {
    dojo.mixin(this, params);
    
    var domNode = (this.domNode = dojo.byId(srcNodeRef));
    domNode.id = this.id || dijit.getUniqueId(this.declaredClass);
    dojo.addClass(domNode, "simpleInfoWindow");
    
    this._title = dojo.create("div", { "class": "title" }, domNode);
    this._content = dojo.create("div", { "class": "content" }, domNode);
    this._close = dojo.create("div", { "class": "close" }, domNode);
  },
  
  /********************
   * Public Properties
   ********************/

  domNode: null,
  
  //boolean: default anchor
  anchor: "upperright",
  
  //String: fixed anchor, if anchor position should not be fixed
  fixedAnchor: null,
  
  //coords: current coords
  coords: null,

  //boolean: whether InfoWindow is showing
  isShowing: true,

  //number: width of infowindow
  width: 250,
  
  //number: height of infowindow
  height: 150,
  
  //string: title property
  title: "Info Window",
  
  /**********************
   * Internal Properties
   *   _title (DOMNode)
   *   _content (DOMNode)
   *   _anchors
   **********************/
  
  _bufferWidth: 10,
  _bufferHeight: 10,
  
  /*****************
   * Public Methods
   *****************/
  
  startup: function() {
    this._anchors = [esri.dijit.InfoWindow.ANCHOR_UPPERRIGHT, esri.dijit.InfoWindow.ANCHOR_LOWERRIGHT, esri.dijit.InfoWindow.ANCHOR_LOWERLEFT, esri.dijit.InfoWindow.ANCHOR_UPPERLEFT];
    this.resize(this.width, this.height);
    this.hide();
    this._closeConnect = dojo.connect(this._close, "onclick", this, this.hide);
  },

  destroy: function() {
    if (this.isShowing) {
      this.hide();
    }
    this.destroyDijits(this._title);
    this.destroyDijits(this._content);
    dojo.disconnect(this._closeConnect);
    dojo.destroy(this.domNode);
    this.domNode = this._title = this._content = this._anchors = this._closeConnect = null;
  },

  setTitle: function(/*String*/ title) {
    if (!title) {
      dojo.addClass(this._title, "empty");
    }
    else {
      dojo.removeClass(this._title, "empty");
    }
    
    this.destroyDijits(this._title);
    this.__setValue("_title", title);
    //this._adjustContentArea();
    
    return this;
  },

  setContent: function(/*String | DOMNode*/ content) {
    if (!content) {
      dojo.addClass(this._title, "empty");
    }
    else {
      dojo.removeClass(this._title, "empty");
    }

    this.destroyDijits(this._content);
    this.__setValue("_content", content);

    return this;
  },

  setFixedAnchor: function(/*String*/ anchor) {
    if (anchor && dojo.indexOf(this._anchors, anchor) === -1) {
      return;
    }
    this.fixedAnchor = anchor;
    if (this.isShowing) {
      this.show(this.mapCoords || this.coords, anchor);
    }
    this.onAnchorChange(anchor);
  },

  show: function(/*Point*/ point, /*String?*/ anchor) {
    if (!point) {
      return;
    }
    
    if (point.spatialReference) {
      this.mapCoords = point;
      point = this.coords = this.map.toScreen(point, true);
    }
    else {
      this.mapCoords = null;
      this.coords = point;
    }
    
    if (! anchor || dojo.indexOf(this._anchors, anchor) === -1) {
      anchor = this.map.getInfoWindowAnchor(point); //this._anchors[0];
    }
    
    //dojo.removeClass(this._pointer, this.anchor);

    anchor = (this.anchor = this.fixedAnchor || anchor);
    
    //dojo.addClass(this._pointer, anchor);

    esri.show(this.domNode);
    this._adjustContentArea();
    this._adjustPosition(point, anchor);
    this.isShowing = true;
    if (! arguments[2]) {
      this.onShow();
    }
  },

  hide: function() {
    esri.hide(this.domNode);
    this.isShowing = false;
    if (!arguments[1]) {
      this.onHide();
    }
  },

  move: function(/*Point*/ screenPoint, isDelta) {
    // Boolean isDelta: internal argument used by map
    if (isDelta) { // point is delta from this.coords
      screenPoint = this.coords.offset(screenPoint.x, screenPoint.y);
    }
    else {
      this.coords = screenPoint;

      if (this.mapCoords) {
        this.mapCoords = this.map.toMap(screenPoint);
      }
    }
    
    this._adjustPosition(screenPoint, this.anchor);
  },

  resize: function(/*Number*/ width, /*Number*/ height) {
    this.width = width;
    this.height = height;
    dojo.style(this.domNode, { width: width + "px", height: height + "px" });
    dojo.style(this._close, { left: (width - 2) + "px", top: "-12px" });
    this._adjustContentArea();
    if (this.coords) {
      this._adjustPosition(this.coords, this.anchor);
    }
    this.onResize(width, height);
  },
  
  /*********
   * Events
   *********/
  
  onShow: function() {
    this.__registerMapListeners();
    this.startupDijits(this._title);
    this.startupDijits(this._content);
  },
  
  onHide: function() {
    this.__unregisterMapListeners();
  },
  
  onResize: function() {},
  onAnchorChange: function() {},
  
  /*******************
   * Internal Methods
   *******************/
  
  _adjustContentArea: function() {
    var box = dojo.contentBox(this.domNode);
    //console.log(dojo.toJson(box));
    var titleCoords = dojo.coords(this._title);
    //console.log(dojo.toJson(titleCoords));
    
    var contentCoords = dojo.coords(this._content);
    //console.log(dojo.toJson(contentCoords));
    var contentBox = dojo.contentBox(this._content);
    //console.log(dojo.toJson(contentBox));
    var diff = contentCoords.h - contentBox.h;
    
    dojo.style(this._content, { height: (box.h - titleCoords.h - diff) + "px" });
  },
    
  _adjustPosition: function(/*Point*/ screenPoint, /*String*/ anchor) {
    var posX = Math.round(screenPoint.x), posY = Math.round(screenPoint.y);
    var bufferWidth = this._bufferWidth, bufferHeight = this._bufferHeight;
    var coords = dojo.coords(this.domNode);

    switch(anchor) {
      case esri.dijit.InfoWindow.ANCHOR_UPPERLEFT:
        posX -= (coords.w + bufferWidth);
        posY -= (coords.h + bufferHeight);
        break;
      case esri.dijit.InfoWindow.ANCHOR_UPPERRIGHT:
        posX += bufferWidth;
        posY -= (coords.h + bufferHeight);
        break;
      case esri.dijit.InfoWindow.ANCHOR_LOWERRIGHT:
        posX += bufferWidth;
        posY += bufferHeight;
        break;
      case esri.dijit.InfoWindow.ANCHOR_LOWERLEFT:
        posX -= (coords.w + bufferWidth);
        posY += bufferHeight;
        break;
    }
    
    dojo.style(this.domNode, { left: posX + "px", top: posY + "px" });
  }
});

dojo.mixin(esri.dijit.InfoWindow, {
  ANCHOR_UPPERRIGHT: "upperright", ANCHOR_LOWERRIGHT: "lowerright", ANCHOR_LOWERLEFT: "lowerleft", ANCHOR_UPPERLEFT: "upperleft"
});
});
