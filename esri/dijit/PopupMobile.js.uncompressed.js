//>>built
// wrapped by build app
define("esri/dijit/PopupMobile", ["dijit","dojo","dojox","dojo/require!esri/InfoWindowBase,esri/PopupBase,esri/dijit/NavigationBar,esri/dijit/InfoView,dojo/number,dojo/date/locale,dojox/charting/Chart2D,dojox/charting/themes/PlotKit/base,dojox/charting/action2d/Tooltip,dojo/i18n"], function(dijit,dojo,dojox){
dojo.provide("esri.dijit.PopupMobile");

dojo.require("esri.InfoWindowBase");
dojo.require("esri.PopupBase");
dojo.require("esri.dijit.NavigationBar");
dojo.require("esri.dijit.InfoView");

//TODO
//Should these be dynamic dependencies?
//Modules required for date and number formatting
dojo.require("dojo.number");
dojo.require("dojo.date.locale");
//Modules requried for charting
dojo.require("dojox.charting.Chart2D");
dojo.require("dojox.charting.themes.PlotKit.base");
dojo.require("dojox.charting.action2d.Tooltip");
//dojo.require("dojox.charting.action2d.MoveSlice");
//dojo.require("dojox.charting.action2d.Magnify");
//dojo.require("dojox.charting.action2d.Highlight");
//dojo.require("dojox.charting.widget.Legend");
dojo.require("dojo.i18n");

//Based on dojox.charting.themes.PlotKit.blue theme
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

//TODO
//Optimal max-height for the content pane could be
//(map.height / 2) - (approx height of title pane + actions pane) - (approx height of the popup tail)

/*******************
* esri.dijit.Popup
*******************/
dojo.declare("esri.dijit.PopupMobile", [ esri.InfoWindowBase, esri.PopupBase ], {

  offsetX: 3,
  offsetY: 3,
  zoomFactor: 4,
  marginLeft: 10,
  marginTop: 10,
  highlight: true,
  popupNavigationBar: null,
  popupInfoView: null,
  location: null,
  xIcon:dojo.moduleUrl("esri.dijit","./images/whitex.png"),
  dArrowIcon:dojo.moduleUrl("esri.dijit","./images/whitedown.png"),
  lArrowIcon:dojo.moduleUrl("esri.dijit","./images/whitel.png"),
  rArrowIcon:dojo.moduleUrl("esri.dijit","./images/whiter.png"), 
 //xIcon:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABl0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjUuODc7gF0AAAIySURBVFhH7VYhT8NQEJ6YmCRTSzAEQQgKiSKbQ9aBJAExyU+YWzLDzJhEIidRZHJycnIJBokEtfF9zV1zPNq+a7Ft8tLX9u6777539/pareZqFHAqsN/vT3e73RzjA/M/F95/YjzjQ98J6TMDYE+As6B43mIszdhYRnyP53NfhBIrgjCYgguRXGBRaEwlaI/7F25JbRISXMGY0ZEHTBSbG0Wqk2AwzZxZewKHNvB7UCUwv6iEAYeFOC8rOQbGwHkUnLUbh9KbNey5HXMMgdMxXeNbCq14sv9PcPU1S7Fy4WkVs6qtA54HprDeMG/zO+6HGN/y7R33buBHFdgRvOKFLPJv8tji28SQGAoBktHrMs/P1FTqU3oJgUUBgTa+24BPJvh9ETBsRmI3isWnpNxEClsvkFzjT8uAgTeM4Wb+YvhSBgibO5M5p2cR+1QBEBl7FSisWOAcY2jRKY+sKAtqIN0Z2RFRAqxYqdqD0BgYtgZIwhblpAjc7KrxHRHGr0Vs8X5qpL/N6YJBSILbsOBto9kLYCIO/O931AnzaxN8Zt53zZJQlRMbCARW7vVXRzit3W1TkhZwbiQ4NyL/tg7jvsk2cUkXGMGfZ4l0B3QVX87apb1bBwA+iTmYzOskkProj0RIrPF8Fel3Zr00xOsHN0XGbLKDKFtK/vMjEkIw3nkUy86F0srxnvdKw26gGtrPpj5+TUlUyPkLzkvCKMIDC7dWZs6T8Vie+1WxGvtGASrwAxhByzDtneIfAAAAAElFTkSuQmCC",
  //whiteda.png
 // dArrowIcon:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwQAADsEBuJFr7QAAABl0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjUuODc7gF0AAAMISURBVFhH7ZY7TBRRFIZBUVDQZRXXJ0o0GipDY0KJvQWNiY29JSWFBY0hsVk7OsFGCk200w4qKSwoLLAxBBq02sLCZnfH7x/PnZwdd3Zm3NKd5OTOvfc8/vufcx9DQ4NvwEAJBqIoWmy32x+QX/z/9THeQNaZmCvhNl8Vhws43g0RBQDZQTYVEHmH7HlEGqM/k+89RwNHT1zgI/pL9Ce7mTE+y3w9MES73xcbFizEX+FnLATW6sSMScdKGbuE7ZYMlZbo67f50kxg+9hRuph20Gq1VnCuABH/290CWD1I51CgCoNA+SJG320FyxnO1wKAZrP5MSMl8rNtfl4XAoDyKEbLZvSF9jRyFhnxDqz4YgYA8N7PoTuFXEPOI3cdk/dyQRgAFY+cP6C5gFSQM3IcHGQBQGccmRDlBnwK3Tfmb4O2mgnCVjtvyspbHDgrvy4FHQy4QhVz8nHffP6grfVkAYVnpvyyl6Lt/ZCCtxk1cMcA1NA/kN8iKdB20/dcyrTH3IrOiVb1tc3cLtgw3avMn0CU/5tKGXIFuYzup0IA3P6Ntx5Gx5GGgQrFpULtACCgSNWCBv1J+qc0FvzmMoDiqgUTEycRFZT/FKTK3v/sGNhkTMVaS+leFxOBsUIMoBSnQECMAVEqR/6rAODQAXjB5K2UTrJjDEB8V+QygI6OVwHYc7kfZmjaBwDAgQPwKh2c/riznzWfjVwAhvbIHM4ZC6P0VQsJEyF4aJn7aTbS1Vkw7c6MOK06O4oCqJvBlluFAGgXqLp1/utKTi080raLi9HZ6WJqmOJCIQAoyyg8OuLdYEwoFZLbqcgKcANRxU/4IPhZSy+mEAgMde//uU7dC8cAjBgbUtG8WNGdUUkFDz60mDidpT6HXnQ/ShsbmOEu42Po1x1LCYulAFhBxhQaG3qGJY8LYyE52+kr8BISF7Gl8d+DuyqW0+Qhyv++sfOw/bSuc0KPE70Lvc6uB1t65V1oVWGuKrijVr8dfeZ3GOt/1b0Qa2VGtQCtGwN6vM70vdKBg/+Ogd9+1ULBHjIkzwAAAABJRU5ErkJggg==",
  //whitela.png
  //lArrowIcon:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwQAADsEBuJFr7QAAABl0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjUuODc7gF0AAALiSURBVFhH7ZY7bBNBEIZNEkgwkBePmFdAQUAqlAbJpekpUtLQU7qktJBQJBqX6QgVFBSUlElFSgoKaJBFGqByidLYfP9q9jTenLlzEjcoK41293Zn5t9/ZmevUjlp/xMD/X7/CrIwtjNhvNHr9baQLuMDje+/kTcsPDxWEBhcw/C298j8q76ZfKL/kay/ZV47MhCMrGP8j4zr5MgGw9VomPEl5KrR/4j19xEI473+t+/1Q4OQc2dsMz0R8xXkLHINmTMRoAc434mgxeDIIDBQdydv5hnA8DIybyzco581uUi/pHwxEB362yOBQPmzKbeHOL/J+jlzHokSIzXkRtSJuUP/oTSASD1KPxnPpIp8W8hx3pVj5LxAuRypRSZLhwKFXTv9AerNwQT9dDy29Yr9aQFLAWOvbfa2CllQrGyzMn/g9LampFPB8S0UIOT6kHCtms1uIQDQPrPNWcyYn5IifRW5lTi/w/wyMvEv46ob0isEwJ6WOWi5OE4aACVZ1wG4L3DIcpFhJWEpAHZ1Or39/RdGtRxEBrxz0a6Yh7WiFq9k0b6KVTpVPVW0Re8goX7WWCkL4F1ZBpqWA5suBJEBAfJNiaf4LxadLN6son1ioG4AOjn3f4q1uwmIOeYCMj3MOGvzqgWSQgDawMaOgRh4SCzhlBNKxpQJFaEQlpw6EFn9WBaAXjzlwa5X4JNOKwCTiN4B31SIFKKsClqOzFhF1d71UgDYmJVPlJ/khEIAJHoPsmYOL/BhyuVPuNZ6W0o5j5tQiLSpIq7lgFApDjXAEIQqZyzFG5I953xvjATAckH/AOFHJKWPuWqAHh4xEaogvU6vW1FF53mkRtV1ZOeOiQDCgGx7NhifSXMEZ4+RL06neWjnPhzuSRUj+h9UorboRfMr+tfInnP8i/HTIzt3yaTEbLuMjr4Gel1ho3/p2JznJGDDTr+BM4VFmf4SURFTcg4tSmMDZUlYHauDE+PjYOAvrKO4xbDyAMwAAAAASUVORK5CYII=",
  //whitera.png
  //rArrowIcon:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwQAADsEBuJFr7QAAABl0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjUuODc7gF0AAALbSURBVFhH7ZY/TFRBEMZRRBD/HKCC/0AiUamMjQnl2VtcaWNPaWl5MTGX2FDSiZUUFpSWZyUlBQU25kUatbrS0Nz5+15mX4b1HfuOM1ETNpns7u3szDffzsy7kZGT8T8x0Ov1ppHZv4IZx4+63e5b5Afr3wa/d5ANDup/FCAGr2H4nffI/ivyCWmb7EXnbfYPhwbS+/xlBQf7wTjr96wf6xmQ68iV4IT1MuctMSF95p9MjWODUATO2Ef2D+QQqZncYD6H3PFOjLF1x8jgILi8iPPMItG7ziGXkUsm9wzMFPNCWZTcfx6YYL0yEBNc2LLLbUfxLUWniF10YuQ8Mt8HxJrZ2akMQNQH5HLoAMjZBURAOiUgpmMn6EwQzDfTrfYUVkpKorUSg4p2zOh3GHrjbE4LYHzHPcV2JRZC4mFsuewCv99E8obkEdheSbkYJaVYUEVoHDorBWT07x2F1qK9yrwUgbjNflJ3mU8FGy6nVpMsGICtlCJ6C3KC3HcgOqzzsmQedfnTNJ1myq4u6v03kooWJerKCf8cncCAAZztHhy8ZJ1VsmsANqsCMGfqD8VwkYuhGeugCqyVtGsAkhkrw4jyQAnpx0xJDuSdURWRBKCMtayd6qeMLZWdHNci53fZnykpxcwApDsizj8chZYz0a1mFEeuDinKi+wXELVhs5clozfqGnZBHWwiqml1Q1Gv2Q9VxKgBqPk7ANg2e+n3d3W7Y9aLshG1yEUD6Z3Pm/Oi7Jydp+Zcjaho60kmUK47Dw2X6Xl0nHXsPPSC8dgo5/qc5x2wUvKVJM5qAIGBF6wnEWV9YEG9X7TrAzUWPVXD/ZdYT0bcTyF8SCyKXfZPWB96Y/ZnXd0r6rYDfnznzugzjH53RvfZv2H/mlkJ21SDQYr/hVbK6ZqvSg1O5vQMSOazL17r26/P+EAJNwAINR+J6vqVRa5/xS2tkXpVW0PpKRmHMnBy+V9j4BeOwLjFLyR3DwAAAABJRU5ErkJggg==",
  
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
    dojo.addClass(domNode, "esriPopupMobile");

    /***************************
     * Create the DOM structure
     ***************************/
    
    var structure = 
      "<div class='sizer'>" +
        "<div class='titlePane'>" +
          "<div class='spinner hidden'>" +
          "</div>" +
          "<div class='title'></div>" +
          "<div style='text-align:center'>" +
          "<div class='titleButton prev hidden'></div>" +
          "<div class='footer' style='display:inline-block;width:60px;height:15px;'></div>" +
          "<div class='titleButton next hidden'></div>" +
          "</div>" +
          //"<div class='titleButton prev'></div>" +
          //"<div class='titleButton next'></div>" +
          //"<div class='titleButton maximize'></div>" +
          "<div class='titleButton close'></div>" +
          "<div class='titleButton arrow hidden'></div>" +
        "</div>" +
      "</div>" +
        
      /* +
      "<div class='sizer content'>" +
        "<div class='contentPane'>" + 
        "</div>" +
      "</div>" +
      
      "<div class='sizer'>" + 
        "<div class='actionsPane'>" + 
          "<div class='actionList hidden'>" + 
            "<a class='action zoomTo' href='javascript:void(0);'>Zoom to</a>" + 
          "</div>" +
        "</div>" +
      "</div>" +
      */
      
      "<div class='pointer top hidden'></div>" +
      "<div class='pointer bottom hidden'></div>";
      /*"<div class='pointer left hidden'></div>" +
      "<div class='pointer right hidden'></div>" +
      "<div class='pointer topLeft hidden'></div>" +
      "<div class='pointer topRight hidden'></div>" +
      "<div class='pointer bottomLeft hidden'></div>" +
      "<div class='pointer bottomRight hidden'></div>";*/
      
    dojo.attr(domNode, "innerHTML", structure);
   
    
    // Get references to nodes for later use so that we don't 
    // have to perform DOM queries often
    //this._sizers = dojo.query(".sizer", domNode);
    
    var titlePane = dojo.query(".titlePane", domNode)[0];
    //dojo.setSelectable(titlePane, false);

    this._arrowButton = dojo.query(".arrow", titlePane)[0];
    
    this._pointerTop = dojo.query(".top", domNode)[0];
    this._pointerBottom = dojo.query(".bottom", domNode)[0];
    
    
    this._title = dojo.query(".title", titlePane)[0];
    this._footer = dojo.query(".footer", titlePane)[0];

    this._prev = dojo.query(".prev", titlePane)[0];
    this._next = dojo.query(".next", titlePane)[0];
    
    //this._prevFeatureButton = dojo.query(".prev", titlePane)[0];
    //this._nextFeatureButton = dojo.query(".next", titlePane)[0];
    //this._maxButton = dojo.query(".maximize", titlePane)[0];
    this._spinner = dojo.query(".spinner", titlePane)[0];
    
    //this._contentPane = dojo.query(".contentPane", domNode)[0];

    //this._actionList = dojo.query(".actionsPane .actionList", domNode)[0];
    
    
    /***********************
     * Setup event handlers
     ***********************/
    
    this._eventConnections = [
      dojo.connect(dojo.query(".close", titlePane)[0], "onclick", this, this.hide),
      dojo.connect(this._arrowButton, "onclick", this, this._toggleView),
      dojo.connect(this._prev, "onclick", this, function(){
        this.selectPrevious();
        this._updateUI();
      }),
      dojo.connect(this._next, "onclick", this, function(){
        this.selectNext();
        this._updateUI();
      })

      //dojo.connect(this._prevFeatureButton, "onclick", this, this.selectPrevious),
      //dojo.connect(this._nextFeatureButton, "onclick", this, this.selectNext),
      //dojo.connect(this._maxButton, "onclick", this, this._toggleSize),
      //dojo.connect(dojo.query(".zoomTo", this._actionList)[0], "onclick", this, this._zoomToFeature)
    ];

    /*
    // iOS wants the user to do two-finger scrolling for overflowing elements 
    // inside the body. We want to let the users do this with one finger.
    if (esri.isTouchEnabled) {
      var handles = esri.setScrollable(this._contentPane);
      this._eventConnections.push(handles[0], handles[1]);
    }
    */

    this._initPopupNavigationBar();
    this._initPopupInfoView();
    
    // Hidden initially
    esri.hide(domNode);
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
  },
  
  unsetMap: function() {
    this.disableHighlight(this.map);

    // Run logic defined in the base class
    this.inherited(arguments);
  },
  
  setTitle: function(title, footer) {
    this.destroyDijits(this._title);
    this.place(title, this._title);
    
    this.destroyDijits(this._footer);
    this.place(footer, this._footer);
    
    if (this.isShowing) {
      this.startupDijits(this._title);
      this.startupDijits(this._footer);
    }
  },
  
  //set full view content
  setContent: function(content) {
    this.destroyDijits(this._contentPane);
    this.place(content, this._contentPane);
    //if (this.isShowing) {
      this.startupDijits(this._contentPane);
    //}
  },
  
  show: function(location) {
    if (!location) {
      esri.show(this.domNode);
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

    if (this._maximized) {
      this.restore();
    }
    else {
      this._setPosition(screenLocation);
    }    
    
    // Display
    if (!this.isShowing) {
      esri.show(this.domNode);
      this.isShowing = true;
      this.onShow();
    }
  },
  
  hide: function() {
    if (this.isShowing) {
      esri.hide(this.domNode);
      this.isShowing = false;
      this.onHide();
    }
  },
  
  onShow: function() {
    this._followMap();
    this.startupDijits(this._title);
    //this.startupDijits(this._contentPane);
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
  destroy: function() {
    if (this.map) {
      this.unsetMap();
    }
    this.cleanup();
    if (this.isShowing) {
      this.hide();
    }
    this.destroyDijits(this._title);
    this.destroyDijits(this._footer);

    //this.destroyDijits(this._content);
    dojo.forEach(this._eventConnections, dojo.disconnect);
    dojo.destroy(this.domNode);
    
    //this._sizers = this._contentPane = this._actionList =
    //this._title = this._prevFeatureButton = 
    //this._nextFeatureButton = this._spinner = this._eventConnections = 
    //this._pagerScope = this._targetLocation = this._nls = 
    //this._maxButton = null;
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
    //console.log("setFeatures");
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
    this.setTitle("&nbsp;", "&nbsp;");
    //this.setFooter("&nbsp;");
    dojo.addClass(this._arrowButton, "hidden");
    
    //this.setTitle("&nbsp;");
    //this.setContent("&nbsp;");
    //this._setPagerCallbacks(this);
    
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
    
    this._updateUI();
  },  
  
  /*******************
   * Internal Methods
   *******************/
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
    esri.hide(this.domNode);
  },
  
  _onExtentChange: function(extent, delta, levelChange) {
    //change position only when zoom level changes
    if (levelChange) {
      esri.show(this.domNode);
      this.show(this._targetLocation || this._location);
      this._targetLocation = null;
    }
  },
  
  _setPosition: function(location) {
    var posX = location.x, posY = location.y, mapBox = dojo.contentBox(this.map.container), width = mapBox.w, height = mapBox.h;
    var boxLeft = 0, boxTop = posY + 10, pointerX = 118, leftBound = 18, rightBound = width - leftBound;
   //offX = this.offsetX || 0, offY = this.offsetY || 0,
    
    if (posX > leftBound && posX < rightBound) {
      boxLeft = posX - 130;
      
      if (boxLeft < 0) {
        boxLeft = 0;
      } else if (boxLeft > width - 260) {
        boxLeft = width - 260;
      }
      
    } else {
      if (posX <= leftBound) {
        boxLeft = posX - leftBound;
      }
      else if (posX >= rightBound) {
        boxLeft = (width - 260) + (posX - rightBound);
      }
    }

    if (posX > 118 && posX < width - 130) {
      pointerX = 118;
    }
    else if (posX <= 118) {
      if (posX > leftBound) {
        pointerX = posX - 12;
      }
      else if (posX <= leftBound) {
        pointerX = 6;
      }
    }
    else if (posX >= width - 130) {
      if (posX < rightBound) {
        pointerX = 118 + posX - (width - 130) ;
      }
      else if (posX >= rightBound) {
        pointerX = 118 + (rightBound) - (width - 130) ; //width - 90;
      }
    }
    
    if (posY <= height / 2) {
      dojo.style(this.domNode, {
        left: boxLeft + "px",
        top: boxTop + "px",
        bottom: null
      });
      
      dojo.style(this._pointerTop, {
        left: pointerX + "px"
      });

      dojo.addClass(this._pointerBottom, "hidden");
      dojo.removeClass(this._pointerTop, "hidden");
    }
    else
    {
      dojo.style(this.domNode, {
        left: boxLeft + "px",
        top: boxTop - 64 + 'px',
        bottom: null
      });
      
      dojo.style(this._pointerBottom, {
        left: pointerX + "px"
      });
      
      dojo.addClass(this._pointerTop, "hidden");
      dojo.removeClass(this._pointerBottom, "hidden");
    }
  },
  
  _showPointer: function(className) {
    var pointers = [ 
      /*"top", "bottom", "right", "left",*/ 
      "topLeft", "topRight", "bottomRight", "bottomLeft" 
    ];
    
    dojo.forEach(pointers, function(ptr) {
      if (ptr === className) {
        dojo.query(".pointer." + ptr, this.domNode).removeClass("hidden");
      }
      else {
        dojo.query(".pointer." + ptr, this.domNode).addClass("hidden");
      }
    }, this);
  },
  
  _toggleView: function(){
    if (!this.popupNavigationBar) {
      this._initPopupNavigationBar();
    }
    
    if (!this.popupInfoView) {
      this._initPopupInfoView();
    }
    
    this.hide();
    esri.show(this.popupNavigationBar.container);
    esri.show(this.popupInfoView.container);

    var title = "";
    if (this.selectedIndex >= 0) {
      title = (this.selectedIndex+1) + " of " + this.features.length;
      this.setContent(this.features[this.selectedIndex].getContent());
     }
    
    //this.popupNavigationBar.getItems()[1]._node.innerHTML = title;
  },
  
  _handleNavigationBar: function(item) {
    this.popupInfoView.animateTo(0);

    switch(item.name) {
    case "CloseButton":
      esri.hide(this.popupNavigationBar.container);
      esri.hide(this.popupInfoView.container);
      this.hide();
      break;
    case "ToggleButton":
      esri.hide(this.popupNavigationBar.container);
      esri.hide(this.popupInfoView.container);
      this.show(this._location);
      break;
    case "PreviousButton":
      this.selectPrevious();
      this._updateUI();
      break;
      
    case "NextButton":
      this.selectNext();
      this._updateUI();
      break;
    }
  },
  
  _initPopupNavigationBar: function() {
    var params = {};
    params.items = [
      {name:"CloseButton", type:"img", src:this.xIcon, srcAlt:this.xIcon, position:"left"},
      {name:"Title", type:"span", text:"", position:"center"},
      {name:"ToggleButton", type:"img", src:this.dArrowIcon, srcAlt:this.dArrowIcon, position:"right", toggleGroup:"toggle"},
      {name:"PreviousButton", type:"img", src:this.lArrowIcon, srcAlt:this.lArrowIcon, position:"right2", toggleGroup:"previous"},
      {name:"NextButton", type:"img", src:this.rArrowIcon, srcAlt:this.rArrowIcon, position:"right1", toggleGroup:"next"}
    ];

    this.popupNavigationBar = new esri.dijit.NavigationBar(params, dojo.create("div", {}, dojo.body()));
    
    dojo.connect(this.popupNavigationBar, "onCreate", this, function(items){
      this._prevFeatureButton = items[3]._node;
      this._nextFeatureButton = items[4]._node;
    });
    
    dojo.connect(this.popupNavigationBar, "onSelect", this, this._handleNavigationBar);
    dojo.connect(this.popupNavigationBar, "onUnSelect", this, this._handleNavigationBar);

    this.popupNavigationBar.startup();
    esri.hide(this.popupNavigationBar.container);
  },
  
  _initPopupInfoView: function(){
    var params = {
    items: [{name:"Navigator", type:"div", text:""},
            {name:"content", type:"div", text:""},
            {name:"attachment", type:"div", text:""}]
    };
    
    this.popupInfoView = new esri.dijit.InfoView(params, dojo.create("div", {}, dojo.body()));
    //this.popupInfoView.container.setAttribute((document.all ? 'className' : 'class'), "esriMobilePopupInfoView");
    dojo.addClass(this.popupInfoView.container,"esriMobilePopupInfoView");
    
    this.popupInfoView.enableTouchScroll();
    
    dojo.connect(this.popupInfoView, "onCreate", this, function(items){
      this._contentPane = items[1]._node;
      if (this.selectedIndex >= 0) {
        this.setContent(this.features[this.selectedIndex].getContent());
      }
    });
    
    dojo.connect(this.popupInfoView, "onSwipeLeft", this, function(){
    });
    
    dojo.connect(this.popupInfoView, "onSwipeRight", this, function(){
    });
    
    this.popupInfoView.startup();
  },
  
  _updateUI: function(){
    var title = "&nbsp;", footer = "&nbsp;", ptr = this.selectedIndex,
    features = this.features, deferreds = this.deferreds,
    prev = this._prevFeatureButton.parentNode, next = this._nextFeatureButton.parentNode,
    spinner = this._spinner, actionList = this._actionList,
    nls = this._nls;

    if (features && features.length >= 1) {
      title = features[ptr].getTitle();
      //footer = "<img src='" + this.lLongArrowIcon + "'/> " + "(" + (ptr+1) + " of " + features.length + ")" + " <img src='" + this.rLongArrowIcon + "'/>"
      footer = (ptr+1) + " of " + features.length;
      dojo.removeClass(this._arrowButton, "hidden");
      
      if (ptr === 0) {
        dojo.addClass(prev, "hidden");
        dojo.addClass(this._prev, "hidden");
      }
      else {
        dojo.removeClass(prev, "hidden");
        dojo.removeClass(this._prev, "hidden");
      }
      
      if (ptr === features.length-1) {
        dojo.addClass(next, "hidden");
        dojo.addClass(this._next, "hidden");
      }
      else {
        dojo.removeClass(next, "hidden");
        dojo.removeClass(this._next, "hidden");
      }
    }
    else {
      dojo.addClass(this._arrowButton, "hidden");
      dojo.addClass(prev, "hidden");
      dojo.addClass(next, "hidden");
      dojo.addClass(this._prev, "hidden");
      dojo.addClass(this._next, "hidden");
    }
    this.setTitle(title, footer);

    this.popupNavigationBar.getItems()[1]._node.innerHTML = footer;
    //this.popupNavigationBar.getItems()[1]._node.innerHTML = "<div class='expandedTitleButton prev'></div>" + footer + "<div class='expandedTitleButton next'></div>";
    
    if (deferreds && deferreds.length) {

      //if (features) {
        dojo.removeClass(spinner, "hidden");
      //}
      //else {
        this.setTitle(nls.NLS_searching + "...", "&nbsp;");
      //}
    }
    else {
      dojo.addClass(spinner, "hidden");
      if (!features || !features.length) {
        this.setTitle("No Information", "&nbsp;");
      }
    }
    
    /*
    if (features && features.length) {
      dojo.removeClass(actionList, "hidden");
    }
    else {
      dojo.addClass(actionList, "hidden");
    }
    */
  }
});
  

});
