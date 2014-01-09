//>>built
// wrapped by build app
define("esri/dijit/InfoWindow", ["dijit","dojo","dojox","dojo/require!dijit/_Widget,dijit/_Templated,dijit/_Container,esri/InfoWindowBase,esri/utils"], function(dijit,dojo,dojox){
dojo.provide("esri.dijit.InfoWindow");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");
dojo.require("dijit._Container");
dojo.require("esri.InfoWindowBase");
dojo.require("esri.utils");

dojo.declare("esri.dijit.InfoWindow", [dijit._Widget, dijit._Templated, dijit._Container, esri.InfoWindowBase], {
    isContainer: true,
    templateString:"<div id=\"${id}.infowindow\" class=\"infowindow\" dojoAttachPoint=\"_infowindow\"\r\n  ><div style=\"position:relative;\"\r\n    ><div class=\"window\" dojoAttachPoint=\"_window\"\r\n      ><div class=\"top\"\r\n        ><div class=\"left\" dojoAttachPoint=\"_topleft\"><div class=\"sprite\"></div></div\r\n    \t\t><div class=\"right\" dojoAttachPoint=\"_topright\"\r\n    \t\t\t><div class=\"sprite\"></div\r\n    \t\t\t><div class=\"user\" dojoAttachPoint=\"_user\"\r\n    \t\t\t  ><div class=\"titlebar\" dojoAttachPoint=\"_titlebar\"\r\n    \t\t\t    ><a class=\"hide\" dojoAttachPoint=\"_hide\" dojoAttachEvent=\"onclick:hide\"><div class=\"sprite\"></div></a\r\n              ><div class=\"title\" dojoAttachPoint=\"_title\">${title}</div\r\n    \t\t\t  ></div\r\n            ><div class=\"border\" dojoAttachPoint=\"_border\"></div\r\n    \t\t\t  ><div class=\"layout content\" dojoAttachPoint=\"_content, containerNode\"\r\n    \t\t\t  ></div\r\n    \t\t\t></div\r\n    \t\t></div\r\n        ><div class=\"bottom\"\r\n          ><div class=\"left\" dojoAttachPoint=\"_bottomleft\"><div class=\"sprite\"></div></div\r\n\t\t      ><div class=\"right\" dojoAttachPoint=\"_bottomright\"><div class=\"sprite\"></div></div\r\n        ></div\r\n      ></div\r\n    ></div\r\n    ><div class=\"pointer\" dojoAttachPoint=\"_pointer\"><div dojoAttachPoint=\"_sprite\" class=\"sprite\"></div></div\r\n  ></div\r\n></div>",

    //boolean: default anchor
    anchor: "upperright",
    //String: fixed anchor, if anchor position should not be fixed
    fixedAnchor: null,
    //coords: current coords
    coords: null,

    //boolean: whether InfoWindow is showing
    isShowing: true,
    //boolean: whether content is showing
    isContentShowing: true,
    //boolean: whether title is showing
    isTitleBarShowing: true,
    //number: width of infowindow
    width: 250,
    //number: height of infowindow
    height: 150,
    //string: title property
    title: "Info Window",

    startup: function() {
      if (this._started) {
        return;
      }
      
      this.inherited(arguments);
      
      //Anchor position of info window, w.r.t point specified to display at
      this._ANCHORS = [esri.dijit.InfoWindow.ANCHOR_UPPERRIGHT, esri.dijit.InfoWindow.ANCHOR_LOWERRIGHT, esri.dijit.InfoWindow.ANCHOR_LOWERLEFT, esri.dijit.InfoWindow.ANCHOR_UPPERLEFT];
      //this._anchorsLength = this._ANCHORS.length;
      
      if (dojo.isIE < 7) {
        var url = dojo.getComputedStyle(this._sprite).backgroundImage.replace(/url\(\"/i, "").replace(/\"\)/, ""),
            filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(enabled='true', sizingMethod='crop', src='" + url + "')";

        var s = dojo.create("div", null, dojo.body());
        dojo.style(s, { width:"1px", height:"1px", display:"none", backgroundImage:"none", filter:filter });
        var t = setTimeout(function() {
          dojo.destroy(s);
          clearTimeout(t);
          t = s = null;
        }, 100);

        dojo.query(".sprite", this.domNode).forEach(function(n) {
          n.style.backgroundImage = "none";
          n.style.filter = filter;
        });
      }

      this.resize(this.width, this.height);
      this.hide();
    },
    
    destroy: function() {
      if (this._destroyed) {
        return;
      }
      
      this.__unregisterMapListeners();
      this.destroyDijits(this._title);
      this.destroyDijits(this._content);
      this._title.innerHTML = this._content.innerHTML = "";
      
      this.inherited(arguments);
    },

    resize: function(width, height) {
      if (!width || !height) {
        return;
      }
      var style = dojo.style;
      style(this._topleft, { height:height + "px", marginLeft:width + "px" });
      style(this._topright, { width:width + "px", height:height + "px" });
      style(this._user, "width", (width - 8) + "px");
      style(this._hide, "marginLeft", (width - 22) + "px");
      style(this._title, "width", (width - 25) + "px");
      style(this._content, "height", (height - 37) + "px");
      style(this._bottomleft, { marginLeft:width + "px", marginTop:height + "px" });
      style(this._bottomright, { width:(width - 5) + "px", marginTop:height + "px" });

      this.width = width;
      this.height = height;
      if (this.coords) {
        this._adjustPosition(this.coords, this.anchor);
      }
      this.onResize(width, height);
    },
    
    _adjustPosition: function(point, anchor) {
      var style = dojo.style;
      style(this._infowindow, { left: Math.round(point.x) + "px", top: Math.round(point.y) + "px" });
      if (anchor === esri.dijit.InfoWindow.ANCHOR_UPPERLEFT) {
        style(this._window, { left:null, right:(this.width + 18) + "px", top:null, bottom:(this.height + 50) + "px" });
      }
      else if (anchor === esri.dijit.InfoWindow.ANCHOR_UPPERRIGHT) {
        style(this._window, { left:"6px", right:null, top:null, bottom:(this.height + 50) + "px" });
      }
      else if (anchor === esri.dijit.InfoWindow.ANCHOR_LOWERRIGHT) {
        style(this._window, { left:"6px", right:null, top:"43px", bottom:null });
      }
      else if (anchor === esri.dijit.InfoWindow.ANCHOR_LOWERLEFT) {
        style(this._window, { left:null, right:(this.width + 18) + "px", top:"43px", bottom:null });
      }
    },
    
    show: function(/*esri.geometry.Point*/ point, /*String?*/ anchor) {
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
      
      var mapFrameWidth = this.map._getFrameWidth();
      if (mapFrameWidth !== -1) {
        point.x = point.x % mapFrameWidth;
        if (point.x < 0) {
          point.x += mapFrameWidth;
        }
        if (this.map.width > mapFrameWidth) {
          var margin = (this.map.width - mapFrameWidth)/2;
          while (point.x < margin) {
            point.x += mapFrameWidth;
          }
        }
      }
      
      if (! anchor || dojo.indexOf(this._ANCHORS, anchor) === -1) {
        anchor = this.map.getInfoWindowAnchor(point); //this._ANCHORS[0];
      }
      
      dojo.removeClass(this._pointer, this.anchor);

      anchor = (this.anchor = this.fixedAnchor || anchor);
      
      this._adjustPosition(point, anchor);

      dojo.addClass(this._pointer, anchor);

      esri.show(this.domNode);
      this.isShowing = true;
      if (! arguments[2]) {
        this.onShow();
      }
    },
    
    hide: function(evt) {
      esri.hide(this.domNode);
      this.isShowing = false;
      if (! arguments[1]) {
        this.onHide();
      }
    },
    
    showTitleBar: function() {
      esri.show(this._titlebar);
      esri.show(this._border);
      this.isTitleBarShowing = true;
    },

    hideTitleBar: function() {
      esri.hide(this._titlebar);
      esri.hide(this._border);
      this.isTitleBarShowing = false;
    },

    showContent: function() {
      esri.show(this._content);
      esri.show(this._border);
      this.isContentShowing = true;
    },

    hideContent: function() {
      esri.hide(this._content);
      esri.hide(this._border);
      this.isContentShowing = false;
    },

    move: function(/*esri.geometry.Point*/ point, isDelta) {
      // Boolean isDelta: internal argument used by map
      if (isDelta) { // point is delta from this.coords
        point = this.coords.offset(point.x, point.y);
      }
      else {
        this.coords = point;

        if (this.mapCoords) {
          this.mapCoords = this.map.toMap(point);
        }
      }
      
      dojo.style(this._infowindow, { left: Math.round(point.x) + "px", top: Math.round(point.y) + "px" });
    },
    
    setFixedAnchor: function(/*String*/ anchor) {
      if (anchor && dojo.indexOf(this._ANCHORS, anchor) === -1) {
        return;
      }
      this.fixedAnchor = anchor;
      if (this.isShowing) {
        this.show(this.mapCoords || this.coords, anchor);
      }
      this.onAnchorChange(anchor);
    },

    setTitle: function(title) {
      this.destroyDijits(this._title);
      this.__setValue("_title", title);
      return this;
    },

    setContent: function(content) {
      this.destroyDijits(this._content);
      this.__setValue("_content", content);
      return this;
    },
    
    onShow: function() {
      //summary:
      this.__registerMapListeners();
      this.startupDijits(this._title);
      this.startupDijits(this._content);
    },

    onHide: function() {
      //summary:
      this.__unregisterMapListeners();
    },
    
    onResize: function() {
      //summary: Event fired whenever info window is resized
      //width: number
      //height: number
    },
    
    onAnchorChange: function() {
      //summary: Event fired whenever info window's anchor is changed
      //anchor: string
    }
  }
);

dojo.mixin(esri.dijit.InfoWindow, {
  ANCHOR_UPPERRIGHT: "upperright", ANCHOR_LOWERRIGHT: "lowerright", ANCHOR_LOWERLEFT: "lowerleft", ANCHOR_UPPERLEFT: "upperleft"
});
});
