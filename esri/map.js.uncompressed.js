//>>built
// wrapped by build app
define("esri/map", ["dijit","dojo","dojox","dojo/require!esri/main,esri/_coremap,esri/touchcontainer,dijit/form/HorizontalSlider,dijit/form/VerticalSlider,dijit/form/HorizontalRule,dijit/form/VerticalRule,dijit/form/HorizontalRuleLabels,dijit/form/VerticalRuleLabels,esri/layers/agsdynamic,esri/layers/agstiled,esri/layers/agsimageservice"], function(dijit,dojo,dojox){
dojo.provide("esri.map");


dojo.require("esri.main");


dojo.require("esri._coremap");

if (esri.isTouchEnabled) {
  dojo.require("esri.touchcontainer");
}
else {
//all map container functionality
dojo.declare("esri._MapContainer", esri._CoreMap, (function() {
    //function/class alias
    var dc = dojo.connect,
        ddc = dojo.disconnect,
        dh = dojo.hitch,
        mixin = dojo.mixin,
        isMoz = dojo.isMozilla,
        stopEvt = dojo.stopEvent,
        dfe = dojo.fixEvent, //local var since fixEvent is called in processEvent
        Point = esri.geometry.Point; //local var since Point constructor is used in processEvent
        
    //constants
    var WHEEL_MOZ = navigator.userAgent.indexOf("Macintosh") !== -1 ? 1 : 3,
        WHEEL = dojo.isChrome < 2 ? 360 : 120,
        WHEEL_MIN = 1,
        WHEEL_MAX = 1,
        //_WHEEL_DURATION = 300,
        _CLICK_DURATION = 300;

    return {
      constructor: function(/*String/Node*/ containerId) {
        //variables
        mixin(this, { _dragEnd:false, _clickDuration:_CLICK_DURATION, //_mouseWheelEvent:{},
          _downCoords:null,
          _clickTimer:null,
          //_mouseWheelTimer:null,
          // _clickEvent:null, _fireClickEvent:null, _fireMouseWheel:null,
          _onKeyDown_connect:null, _onKeyUp_connect:null,
          // _onMouseMoveHandler_connect, _onMouseUpHandler_connect,
          _onMouseDragHandler_connect:null
        });
        
        var _cont = this.__container,
            cons = this._connects;
        
        // if (dojo.isIE || dojo.isWebKit) {
          // Shift-Click or drawing a zoom rectangle on a map with dynamic layer that has PNG32 fix applied
          // will lead to text selection like behaviour on elements within the map. The following
          // hack fixes that issue.
          cons.push(
            dc(_cont, "onselectstart", function(evt) { stopEvt(evt); return false; }),
            dc(_cont, "ondragstart", function(evt) { stopEvt(evt); return false; })
          );
        // }
        // cons.push(dc(_cont, "onfocus", function(evt) { stopEvt(evt); return false; }));
        // _cont.onselectstart = function() { return false; };

        if (isMoz) {
          dojo.style(_cont, "MozUserSelect", "none");
        }
        
        cons.push(
          dc(_cont, "onmouseenter", this, "_onMouseEnterHandler"),
          dc(_cont, "onmouseleave", this, "_onMouseLeaveHandler"),
          dc(_cont, "onmousedown", this, "_onMouseDownHandler"),
          dc(_cont, "onclick", this, "_onClickHandler"),
          dc(_cont, "ondblclick", this, "_onDblClickHandler")
        );

        this.enableMouseWheel(false); // enable per-line resolution
        this._onMouseMoveHandler_connect = dc(_cont, "onmousemove", this, "_onMouseMoveHandler");
        this._onMouseUpHandler_connect = dc(_cont, "onmouseup", this, "_onMouseUpHandler");

        this._processEvent = dh(this, this._processEvent);
        this._fireClickEvent = dh(this, this._fireClickEvent);
        //this._fireMouseWheel = dh(this, this._fireMouseWheel);
      },

      _cleanUp: function() {
        ddc(this._onMouseMoveHandler_connect);
        ddc(this._onMouseUpHandler_connect);
        ddc(this._onMouseDragHandler_connect);
        ddc(this._scrollHandle);
        
        var cons = this._connects, i;
        
        for (i=cons.length; i>=0; i--) {
          ddc(cons[i]);
          delete cons[i];
        }
        
        this.inherited("_cleanUp", arguments);
      },
      
      //event processing function
      _processEvent: function(/*MouseEvent*/ evt) {
        evt = dfe(evt, evt.target);
        if (evt.type === "DOMMouseScroll" && dojo.isFF < 3) {
          evt.screenPoint = new Point(window.scrollX + evt.screenX - this.position.x, window.scrollY + evt.screenY - this.position.y);
        }
        else {
          evt.screenPoint = new Point(evt.pageX - this.position.x, evt.pageY - this.position.y);
        }
        evt.mapPoint = this.extent ? this.toMap(evt.screenPoint) : new Point();
        return evt;
      },

      //event handlers
      _onMouseEnterHandler: function(evt) {
        //summary: handle mouseover event on container
        // evt: Event: Mouse event
        ddc(this._onKeyDown_connect);
        ddc(this._onKeyUp_connect);

        this._onKeyDown_connect = dc(document, "onkeydown", this, "_onKeyDownHandler");
        this._onKeyUp_connect = dc(document, "onkeyup", this, "_onKeyUpHandler");
        
        this.onMouseOver(this._processEvent(evt));
      },

      _onMouseLeaveHandler: function(evt) {
        //summary: handle mouseout event on container
        // evt: Event: Mouse event
        ddc(this._onKeyDown_connect);
        ddc(this._onKeyUp_connect);
        
        this.onMouseOut(this._processEvent(evt));
      },

      _onMouseMoveHandler: function(evt) {
        //summary: handle mousemove event on container
        // evt: Event: Mouse event
        if (this._dragEnd) {
          this._dragEnd = false;
          return;
        }

        this.onMouseMove(this._processEvent(evt));
      },
      
      _onMouseDownHandler: function(evt) {
        //summary: handle mousedown event on container
        // evt: Event: Mouse event
        ddc(this._onMouseMoveHandler_connect);
        var _cont = this.__container;
        if(_cont.setCapture) {
          // References:
          // http://stackoverflow.com/questions/1685326/responding-to-the-onmousemove-event-outside-of-the-browser-window-in-ie
          // http://msdn.microsoft.com/en-us/library/ms536742%28VS.85,loband%29.aspx
          _cont.setCapture(false);
          // TODO
          // we may not need "_docLeaveConnect" connection in IE when using setCapture
          // perhaps need to verify with frame sets as well?
          // see - http://pponnusamy.esri.com:9090/jsapi/mapapps/bugs/v1.6/iframe/main-fixed.html
        }
        this._onMouseDragHandler_connect = dc(document, "onmousemove", this, "_onMouseDragHandler");

        evt = this._processEvent(evt);
        this._downCoords = evt.screenPoint.x + "," + evt.screenPoint.y;
        this.onMouseDown(evt);
      },
      
      _onMouseUpHandler: function(evt) {
        //summary: handle mouseUp event on container
        // evt: Event: Mouse event
        var _cont = this.__container;
        if(_cont.releaseCapture) {
          _cont.releaseCapture();
        }
        evt = this._processEvent(evt);
        
        ddc(this._onMouseDragHandler_connect);
        ddc(this._onMouseMoveHandler_connect);
        this._onMouseMoveHandler_connect = dc(_cont, "onmousemove", this, "_onMouseMoveHandler");
        this.onMouseUp(evt);
      },
      
      _onMouseDragHandler: function(evt) {
        //summary: handle mousemove event on container. This handler is connected on mouse down and disconnected on mouseup
        // evt: Event: Mouse event
        ddc(this._onMouseDragHandler_connect);
        this._onMouseDragHandler_connect = dc(document, "onmousemove", this, "_onMouseDraggingHandler");

        ddc(this._onMouseUpHandler_connect);
        this._onMouseUpHandler_connect = dc(document, "onmouseup", this, "_onDragMouseUpHandler");
        
        // To be notified when drag goes out of an iframe and into the parent document
        this._docLeaveConnect = dc(document, "onmouseout", this, "_onDocMouseOut");
        
        this.onMouseDragStart(this._processEvent(evt));
      },
      
      _onDocMouseOut: function(evt) {
        /*
        // The following logic will let us listen for mousemove and
        // mouseup events of an iframe's parent. However chrome displays
        // "unsafe operation" error in the console that might appear to
        // users as if our map control is trying to access privileged
        // information.
        // Let's not do this right now.
        var fromElt = evt.fromElement, toElt = evt.toElement,
            sameOriginParent, docElt;
        
        if (dojo.isChrome && fromElt && toElt) {
          if (toElt instanceof HTMLHtmlElement) {
            console.log("in-out");
            try {
              var parentURL = window.parent.document.URL;
              sameOriginParent = true;
              docElt = window.parent.document;
            } 
            catch (e) {
              sameOriginParent = false;
            }
          }
          else if (fromElt instanceof HTMLHtmlElement && this._moveOut) {
            console.log("out-in");
            docElt = document;
          }
        }
        
        if (docElt) {
          console.log("switching...");
          this._moveOut = (docElt !== document);
          ddc(this._onMouseDragHandler_connect);
          ddc(this._onMouseUpHandler_connect);
          this._onMouseDragHandler_connect = dc(docElt, "onmousemove", this, "_onMouseDraggingHandler");
          this._onMouseUpHandler_connect = dc(docElt, "onmouseup", this, "_onDragMouseUpHandler");
          return;
        }
        
        if (sameOriginParent === false) {
          this._onDragMouseUpHandler(evt);
          return;
        }*/
        
        var related = evt.relatedTarget, 
            nodeName = evt.relatedTarget && evt.relatedTarget.nodeName.toLowerCase();
        
        if (!related || (dojo.isChrome && nodeName === "html")) {
          // venturing outside the known universe (eg: out of an iframe)
          this._onDragMouseUpHandler(evt);
        }
        // NOTE: In Chrome, "related" will not be NULL when dragging the mouse
        // from inside the iframe and exiting the iframe document onto the 
        // parent document. However, it is NULL when you normally move the mouse
        // out of the iframe onto the parent. Hence the following.
        // IE, FF: map pan is concluded when mouse drag crosses over to the parent
        // Chrome, Safari: map pan will continue (looks like this behavior has
        // changed atleast in Chrome on Windows)
        
        // Note about nodeName check above: it appears Chrome on Mac does seem
        // to fire mousemove events for an iframe while the user is moving
        // the mouse over its parent document. However this is not consistent.
        // Stopping the mouse over the iframe-parent boundary seems to disable
        // this behavior. So as a general rule let's just conclude pan instead
        // of relying on inconsistent impl across platforms
      },

      _onMouseDraggingHandler: function(evt) {
        this.onMouseDrag(this._processEvent(evt));
        dojo.stopEvent(evt);
      },
      
      _onDragMouseUpHandler: function(evt) {
        var _cont = this.__container;
        if(_cont.releaseCapture) {
          _cont.releaseCapture();
        }
        this._dragEnd = true;
        //this._moveOut = false;
        
        evt = this._processEvent(evt);
        this.onMouseDragEnd(evt);
        
        ddc(this._docLeaveConnect);
        ddc(this._onMouseDragHandler_connect);
        ddc(this._onMouseUpHandler_connect);
        
        this._onMouseMoveHandler_connect = dc(_cont, "onmousemove", this, "_onMouseMoveHandler");
        this._onMouseUpHandler_connect = dc(_cont, "onmouseup", this, "_onMouseUpHandler");
        
        this.onMouseUp(evt);
      },
      
      _onClickHandler: function(evt) {
        evt = this._processEvent(evt);
        if (this._downCoords !== (evt.screenPoint.x + "," + evt.screenPoint.y)) {
          return;
        }
        
        clearTimeout(this._clickTimer);
        this._clickEvent = mixin({}, evt);
        this._clickTimer = setTimeout(this._fireClickEvent, this._clickDuration);
      },
      
      _fireClickEvent: function() {
        clearTimeout(this._clickTimer);
        if (dojo.isIE < 9) {
          // See GraphicsLayer::_onClickHandler for reasoning
          // behind this piece of code
          var GL = esri.layers.GraphicsLayer;
          this._clickEvent.graphic = GL._clicked;
          delete GL._clicked;
        }
        this.onClick(this._clickEvent);
      },
      
      _onDblClickHandler: function(evt) {
        clearTimeout(this._clickTimer);
        this.onDblClick(this._processEvent(evt));
      },
      
      _onMouseWheelHandler: function(evt) {
        if (this.__canStopSWEvt()) {
          dojo.stopEvent(evt);
        }
        
        /*var currentTime = evt.timeStamp;
        
        // IE less than 9 don't have "timeStamp" and Opera upto 11.52 always returns 0.
        // Firefox (8.0.1) on Windows XP SP 3 returns negative values. Also see: http://bugs.jquery.com/ticket/10755
        // http://help.dottoro.com/ljmhtrht.php
        // http://www.quirksmode.org/dom/w3c_events.html
        if (!esri._isDefined(currentTime) || currentTime <= 0) {
          currentTime = (new Date()).getTime();
        }

        //if (currentTime !== undefined && currentTime !== 0) {
          var elapsedTime = this._ts ? (currentTime - this._ts) : currentTime;
          
          //console.log("elapsedTime = " + elapsedTime + " / value = " + evt.value + " / detail = " + evt.detail + " / wheelDelta = " + evt.wheelDelta);
          if (elapsedTime < 50) {
            //console.log("[a b o r t e d ] !");
            return;
          }
          
          this._ts = currentTime;
        //}*/

        //clearTimeout(this._mouseWheelTimer);
        
        // https://developer.mozilla.org/en/Gecko-Specific_DOM_Events#DOMMouseScroll
        // http://stackoverflow.com/questions/5527601/normalizing-mousewheel-speed-across-browsers
        // https://github.com/cubiq/iscroll/issues/44
        // http://www.javascriptkit.com/javatutors/onmousewheel.shtml
        // http://www.quirksmode.org/dom/w3c_events.html
        // http://www.switchonthecode.com/tutorials/javascript-tutorial-the-scroll-wheel
        // http://www.adomas.org/javascript-mouse-wheel/
        
        evt = this._processEvent(evt);
        var value = dojo.isIE || dojo.isWebKit ? evt.wheelDelta / WHEEL : -evt.detail / WHEEL_MOZ,
            absValue = Math.abs(value);
        
        if (absValue <= WHEEL_MIN) {
          absValue = WHEEL_MIN;
        }
        else {
          absValue = WHEEL_MAX;
        }
        evt.value = value < 0 ? -absValue : absValue;
        //mixin(this._mouseWheelEvent, evt);

        //clearTimeout(this._mouseWheelTimer);
        //this._mouseWheelTimer = setTimeout(this._fireMouseWheel, _WHEEL_DURATION);
        
        //console.log("F I R E D");
        //this._fireMouseWheel(evt);
        this.onMouseWheel(evt);
      },
      
      __canStopSWEvt: function() {
        // TO BE IMPLEMENTED BY THE SUB CLASSES
        // Summary: specifies whether this _MapContainer
        // can stop scroll wheel events from bubbling up
        // the dom tree
        // Returns: Boolean
      },
      
      //_fireMouseWheel: function(evt) {
        //this.onMouseWheel(evt);
        //this._mouseWheelEvent = {};
        //this._mouseWheelTimer = null;
      //},
      
      _onKeyDownHandler: function(evt) {
        //summary: handle key down event on document
        // evt: KeyEvent: Keyboard event
        this.onKeyDown(evt);
      },

      _onKeyUpHandler: function(evt) {
        //summary: handle key up event on document
        // evt: KeyEvent: Keyboard event\
        this.onKeyUp(evt);
      },

      //protected
      __setClickDuration: function(dur) {
        this._clickDuration = dur;
      },
      
      __resetClickDuration: function() {
        this._clickDuration = _CLICK_DURATION;
      },
      
      enableMouseWheel: function(pixelPrecision) {
        // <Boolean> pixelPrecision: true indicates pixel resolution; false indicates
        //   line resolution
        // See: https://developer.mozilla.org/en/Gecko-Specific_DOM_Events#MozMousePixelScroll
        
        ddc(this._scrollHandle);

        this._scrollHandle = dc(
          this.__container, 
          (dojo.isFF || isMoz) ? (pixelPrecision ? "MozMousePixelScroll" : "DOMMouseScroll") : "onmousewheel", 
          this, this._onMouseWheelHandler
        );
      },

      //PUBLIC EVENTS
      onMouseOver: function() {
        //summary: When mouse enters map
      },
      onMouseMove: function() {
        //summary: When mouse moves over map
      },
      onMouseOut: function() {
        //summary: When mouse leaves map
      },
      onMouseDown: function() {
        //summary: When user presses mouse on map
      },
      onMouseDragStart: function() {
        //summary: User starts dragging mouse on map with mouse button down
      },
      onMouseDrag: function() {
        //summary: User drags mouse on map
      },
      onMouseDragEnd: function() {
        //summary: User completes drag and mouse button is up
      },
      onMouseUp: function() {
        //summary: User release mouse button
      },
      onClick: function() {
        //summary: User clicks mouse button
      },
      onDblClick: function() {
        //summary: User double clicks mouse button
      },
      onMouseWheel: function() {
        //console.log("=========== MOUSE WHEEL EVENT =========== value: " + arguments[0].value);
        //summary: User scrolls mouse wheel up/down
      },

      //keyboard events
      onKeyDown: function() {
        //summary: User presses key on keyboard
      },
      onKeyUp: function() {
        //summary: User release key on keyboard
      }
    };
  }())
);
}

/*--------------*/
/*-- esri.Map --*/
/*--------------*/

// BUILD DIRECTIVE
dojo.require("dijit.form.HorizontalSlider");
dojo.require("dijit.form.VerticalSlider");
dojo.require("dijit.form.HorizontalRule");
dojo.require("dijit.form.VerticalRule");
dojo.require("dijit.form.HorizontalRuleLabels");
dojo.require("dijit.form.VerticalRuleLabels");

//all map navigation functionily
dojo.declare("esri.Map", esri._MapContainer, (function() {
    //CLASS VARIABLES
    //constants
    var _ZINDEX_NAV = 30,
        _WHEEL_DURATION = 100,
        _ZINDEX_SLIDER = 30,
        _PAN_PX = 10,
        _ZOOM_IN = 1,
        _ZOOM_OUT = -1,
        LEFT_BUT = dojo.mouseButtons.LEFT,
        _FIXEDPAN_CARDINAL = { up:"panUp", right:"panRight", down:"panDown", left:"panLeft" },
        _FIXEDPAN_DIAGONAL = { upperRight:"panUpperRight", lowerRight:"panLowerRight", lowerLeft:"panLowerLeft", upperLeft:"panUpperLeft" };

    //function/class pointers
    var dc = dojo.connect,
        ddc = dojo.disconnect,
        dcr = dojo.create,
        ds = dojo.style,
        dh = dojo.hitch,
        abs = Math.abs,
        coords = dojo.coords,
        deprecated = dojo.deprecated,
        dk = dojo.keys,
        mixin = dojo.mixin,
        Rect = esri.geometry.Rect,
        Point = esri.geometry.Point,
        Extent = esri.geometry.Extent;

    var _NAV_KEYS = [ dk.NUMPAD_PLUS, 61, dk.NUMPAD_MINUS, //zoom
                      dk.UP_ARROW, dk.NUMPAD_8, dk.RIGHT_ARROW, dk.NUMPAD_6, dk.DOWN_ARROW, dk.NUMPAD_2, dk.LEFT_ARROW, dk.NUMPAD_4, //pan cardinal
                      dk.PAGE_UP, dk.NUMPAD_9, dk.PAGE_DOWN, dk.NUMPAD_3, dk.END, dk.NUMPAD_1, dk.HOME, dk.NUMPAD_7]; //pan diagonal 

    return {
      constructor: function(containerId, params) {
        //INSTANCE VARIABLES
        mixin(this, {
          _dragOrigin:null, _slider:null, _navDiv:null, _zoomRect:null,
          _mapParams: mixin({ slider:true, nav:false, logo:true, sliderStyle: "default" }, params || {}),
          //_sliderChangeAnchor:null,
          _zoom:0,
          _keyboardPanDx:0, //keyboard navigation key set
          _keyboardPanDy:0
          //_ogol: null
        });
        
        mixin(this, {
          _onLoadHandler_connect:null,
          _panHandler_connect:null, _panStartHandler_connect:null, _upPanHandler_connect:null,
          _dblClickZoomHandler_connect:null,
          _recenterZoomHandler_connect:null, _recenterHandler_connect:null,
          _downPanHandler_connect:null, _downZoomHandler_connect:null,
          _keyNavigatingHandler_connect:null, _keyNavigationEndHandler_connect:null,
          _scrollZoomHandler_connect:null,
          _zoomHandler_connect:null, _upZoomHandler_connect:null
          //_slider_connect:null, _slidermovestop_connect:null
          //_ogol_connect: null
          //_slidermove_connect:null,
          // _normalizeRect:null, _isPanningOrZooming;null, _canZoom:null
        });
        
        mixin(this, {
          isDoubleClickZoom:false, //isDoubleClickZoom: boolean: Whether double click zoom is enabled
          isShiftDoubleClickZoom:false, //isShiftDoubleClickZoom: boolean: Whether shift double click zoom is enabled
          isClickRecenter:false, //isClickRecenter: boolean: Whether click + shift recenter is enabled
          isScrollWheelZoom:false, //isScrollWheelZoom: boolean: Whether mouse scroll wheel zoom in/out is enabled
          isPan:false, //isPan: boolean: Whether map panning is enabled

          isRubberBandZoom:false, //isRubberBandZoom: boolean: Whether rubber band zooming is enabled
          isKeyboardNavigation:false, //isKeyboardControl: boolean: Whether keyboard map navigation is enabled

          // FIXES CR 58077: For Map:  include enable and disable methods for map navigation arrows and slider
          isPanArrows:false, //isPanArrows: boolean: Whether map panning using arrows is enabled
          isZoomSlider:false //isZoomSlider: boolean: Whether slider zoom is enabled
        });
        
        if (dojo.isFunction(esri._css)) {
          esri._css = esri._css(this._mapParams.force3DTransforms);
          this.force3DTransforms = this._mapParams.force3DTransforms;
        }
        
        var canDoTransforms = (esri._hasTransforms && esri._hasTransitions);
        
        this.navigationMode = this._mapParams.navigationMode || (canDoTransforms && "css-transforms") || "classic";
        if (this.navigationMode === "css-transforms" && !canDoTransforms) {
          this.navigationMode = "classic";
        }
        
        this.fadeOnZoom = esri._isDefined(this._mapParams.fadeOnZoom) ? 
                          this._mapParams.fadeOnZoom :
                          (this.navigationMode === "css-transforms");
        if (this.navigationMode !== "css-transforms") {
          this.fadeOnZoom = false;
        }
        
        this._zoomRect = new esri.Graphic(null, new esri.symbol.SimpleFillSymbol(esri.config.defaults.map.zoomSymbol));
        this.setMapCursor("default");
        
        this.smartNavigation = params && params.smartNavigation;
        
        if (!esri._isDefined(this.smartNavigation) && dojo.isMac && !esri.isTouchEnabled && !(dojo.isFF <= 3.5)) {
          // Ideally we want the Browser to give us proper gesture events
          // from Trackpad and MagicMouse, or give us the source device of
          // the mousewheel event. Firefox seems to have the infrastructure
          // for exposing the source device but for whatever reason is not
          // exposed
          // See: http://www.trymbill.is/in-browser-multitouch-gestures-with-the-trackpad/
          
          // userAgent examples:
          // Firefox 10: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.6; rv:10.0) Gecko/20100101 Firefox/10.0"
          // Chrome:     "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/535.7 (KHTML, like Gecko) Chrome/16.0.912.77 Safari/535.7"
          // Safari:     "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/534.52.7 (KHTML, like Gecko) Version/5.1.2 Safari/534.52.7"
          // Note Firefox has 10.6 and WebKit has 10_6_x
          var parts = navigator.userAgent.match(/Mac\s+OS\s+X\s+([\d]+)(\.|\_)([\d]+)\D/i);
          if (parts && esri._isDefined(parts[1]) && esri._isDefined(parts[3])) {
            var majorVersion = parseInt(parts[1], 10),
                minorVersion = parseInt(parts[3], 10);
            //console.log("Mac OS Version = " + majorVersion + "." + minorVersion);
            
            // Snow Leopard, Lion and Beyond
            this.smartNavigation = (
              (majorVersion > 10) || 
              (majorVersion === 10 && minorVersion >= 6)
            );
          }
        }
        
        //this._normalizeRect = dh(this, this._normalizeRect);
        // this._panHandler = dh(this, this._panHandler);
        // this._zoomHandler = dh(this, this._zoomHandler);
        // this._recenterHandler = dh(this, this._recenterHandler);
        // this._recenterZoomHandler = dh(this, this._recenterZoomHandler);
        // this._dblClickZoomHandler = dh(this, this._dblClickZoomHandler);
        // this._scrollZoomHandler = dh(this, this._scrollZoomHandler);
        // this._keyNavigatingHandler = dh(this, this._keyNavigatingHandler);
        // this._keyNavigationEndHandler = dh(this, this._keyNavigationEndHandler);
        //this._isPanningOrZooming = dh(this, this._isPanningOrZooming);
        //this._canZoom = dh(this, this._canZoom);

        this._onLoadHandler_connect = dc(this, "onLoad", this, "_onLoadInitNavsHandler");
        
        //initialize logo
        if (this._mapParams.logo) {
          var style = {
            right:(this._mapParams.nav ? "25px" : "") 
          };
                              
          if (dojo.isIE === 6) {
            style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(enabled='true', sizingMethod='crop', src='" + dojo.moduleUrl("esri") + "../../images/map/logo-med.png" + "')";
          }
          
          var logo = this._ogol = dcr("div", { style: style }, this.root);          
          if ((this.root.clientWidth * this.root.clientHeight) < 250000){
              dojo.addClass(logo, "logo-sm");    
          } else {
              dojo.addClass(logo, "logo-med");   
          }
          if (!esri.isTouchEnabled) {
            this._ogol_connect = dc(logo, "onclick", this, "_openLogoLink");
          }
        }
        
        if (esri.isTouchEnabled) {
          this._panInitEvent = "onTouchStart";
          this._zoomInitEvent = "onGestureStart";
        }
        else {
          this._panInitEvent = "onMouseDown";
          this._zoomInitEvent = "onMouseDown";
        }
      },
      
      _cleanUp: function() {
        this.disableMapNavigation();
        
        var i;
        for (i=this._connects.length; i>=0; i--) {
          ddc(this._connects[i]);
          delete this._connects[i];
        }
        
        ddc(this._slider_connect);
        ddc(this._ogol_connect);
        
        var slider = this._slider;
        if (slider && slider.destroy && !slider._destroyed) {
          slider.destroy();
        }
        
        var navDiv = this._navDiv;
        if (navDiv) {
          dojo.destroy(navDiv);
        }
        
        this.inherited("_cleanUp", arguments);
      },
                  
      //MAP EVENT HANDLERS
      _normalizeRect: function(evt) {
        var xy = evt.screenPoint,
            dx = this._dragOrigin.x,
            dy = this._dragOrigin.y,
            rect = new Rect((xy.x < dx ? xy.x : dx) - this.__visibleRect.x,
                            (xy.y < dy ? xy.y : dy) - this.__visibleRect.y,
                            abs(xy.x - dx),
                            abs(xy.y - dy));

        if (rect.width === 0) {
          rect.width = 1;
        }
        if (rect.height === 0) {
          rect.height = 1;
        }

        return rect;
      },
      
      _downZoomHandler: function(evt) {
        if (evt.button === LEFT_BUT && evt.shiftKey && this.isRubberBandZoom) {
          this._dragOrigin = mixin({}, evt.screenPoint);

          this.setCursor("crosshair");
          this._zoomHandler_connect = dc(this, "onMouseDrag", this, "_zoomHandler");
          this._upZoomHandler_connect = dc(this, "onMouseUp", this, "_upZoomHandler");

          if (evt.ctrlKey) {
            this._zoom = _ZOOM_OUT;
          }
          else {
            this._zoom = _ZOOM_IN;
          }
        
          if (dojo.isChrome) {
            // Prevent text outside map from being selected when dragging the
            // map outside of its bounds
            evt.preventDefault();
          }
        }
      },
      
      _zoomHandler: function(evt) {
        var rect = this._normalizeRect(evt).offset(this.__visibleRect.x, this.__visibleRect.y),
            g = this.graphics, zoomRect = this._zoomRect;

        if (! zoomRect.geometry) {
          this.setCursor("crosshair");
        }

        if (zoomRect.geometry) {
          g.remove(zoomRect, true);
        }

        var tl = this.toMap(new Point(rect.x, rect.y)),
            br = this.toMap(new Point(rect.x + rect.width, rect.y + rect.height));
            
        rect = new Rect(tl.x, tl.y, br.x - tl.x, tl.y - br.y);
        rect._originOnly = true;
        zoomRect.setGeometry(rect);
        g.add(zoomRect, true);
      },
      
      _upZoomHandler: function(evt) {
        var _zoomRect = this._zoomRect;
        
        ddc(this._zoomHandler_connect);
        ddc(this._upZoomHandler_connect);

        if (this._canZoom(this._zoom) && _zoomRect.getDojoShape()) {
          this.graphics.remove(_zoomRect);
          _zoomRect.geometry = null;

          var rect = this._normalizeRect(evt);
          rect.x += this.__visibleRect.x;
          rect.y += this.__visibleRect.y;

          var extent;
          if (this._zoom === _ZOOM_OUT) {
            var mapWidth = this.extent.getWidth(),
                newWidth = (mapWidth * this.width) / rect.width,
                deltaW = (newWidth - mapWidth) / 2,
                ext = this.extent;
            extent = new Extent(ext.xmin - deltaW, ext.ymin - deltaW, ext.xmax + deltaW, ext.ymax + deltaW, this.spatialReference);
          }
          else /*(_zoom == this._ZOOM_IN)*/ {
            var min = this.toMap({ x: rect.x, y: (rect.y + rect.height) }),
                max = this.toMap({ x: (rect.x + rect.width), y: rect.y });
            extent = new Extent(min.x, min.y, max.x, max.y, this.spatialReference);
          }

          //this.__setExtent(extent); //, null, this.toScreen(extent.getCenter()));
          this._extentUtil(null, null, extent);
        }

        if (_zoomRect.getDojoShape()) {
          this.graphics.remove(_zoomRect, true);
        }
        this._zoom = 0;
        this.resetMapCursor();
      },

      _downPanHandler: function(evt) {
        if (evt.button === LEFT_BUT && ! evt.shiftKey && this.isPan) {
          this._dragOrigin = new Point(0, 0);
          mixin(this._dragOrigin, evt.screenPoint);

          this._panHandler_connect = dc(this, "onMouseDrag", this, "_panHandler");
          this._panStartHandler_connect = dc(this, "onMouseDragStart", this, "_panStartHandler");
          this._upPanHandler_connect = dc(this, "onMouseUp", this, "_upPanHandler");
        
          if (dojo.isChrome) {
            // Prevent text outside map from being selected when dragging the
            // map outside of its bounds
            evt.preventDefault();
          }
        }
      },
      
      _panStartHandler: function(evt) {
        this.setCursor("move");
        this.__panStart(evt.screenPoint.x, evt.screenPoint.y);
      },

      _panHandler: function(evt) {
        this.__pan(evt.screenPoint.x - this._dragOrigin.x, evt.screenPoint.y - this._dragOrigin.y);
      },

      _upPanHandler: function(evt) {
        ddc(this._panHandler_connect);
        ddc(this._panStartHandler_connect);
        ddc(this._upPanHandler_connect);
        
        if (this.__panning) {
          this.__panEnd(evt.screenPoint.x - this._dragOrigin.x, evt.screenPoint.y - this._dragOrigin.y);
          this.resetMapCursor();
        }
      },

      _isPanningOrZooming: function() {
        return this.__panning || this.__zooming;
      },

      _recenterHandler: function(evt) {
        if (evt.shiftKey && ! this._isPanningOrZooming()) {
          this.centerAt(evt.mapPoint);
        }
      },

      _recenterZoomHandler: function(evt) {
        if (evt.shiftKey && ! this._isPanningOrZooming()) {
          evt.value = evt.ctrlKey ? -1 : 1;
          this._scrollZoomHandler(evt, true);
        }
      },

      _dblClickZoomHandler: function(evt) {
        if (! this._isPanningOrZooming()) {
          evt.value = 1;
          this._scrollZoomHandler(evt, true);
        }
      },

      _canZoom: function(value) {
        if (! this.__tileInfo) {
          return true;
        }

        // 'level' will be -1 if dynamic baselayer
        var level = this.getLevel(), // current zoom level if tiled baselayer
            maxLevel = this.getNumLevels(); // max zoom level if tiled baselayer

        if ((level === 0 && value < 0) || (level === maxLevel-1 && value > 0)) { // this 'if' expression will always fail if dynamic baselayer
          return false;
        }
        return true;
      },

      _scrollZoomHandler: function(evt, nonMouseWheelSrc) {
        if (!nonMouseWheelSrc) {
          if (this.smartNavigation && !evt.shiftKey && !this._isPanningOrZooming()) {
            this.disableScrollWheelZoom();
            this._setScrollWheelPan(true);
            this._scrollPanHandler(evt);
            return;
          }
          
          var currentTime = evt.timeStamp;
          
          // IE less than 9 don't have "timeStamp" and Opera upto 11.52 always returns 0.
          // Firefox (8.0.1) on Windows XP SP 3 returns negative values. Also see: http://bugs.jquery.com/ticket/10755
          // http://help.dottoro.com/ljmhtrht.php
          // http://www.quirksmode.org/dom/w3c_events.html
          if (!esri._isDefined(currentTime) || currentTime <= 0) {
            currentTime = (new Date()).getTime();
          }
  
          var elapsedTime = this._ts ? (currentTime - this._ts) : currentTime;
          
          //console.log("elapsedTime = " + elapsedTime + " / value = " + evt.value + " / detail = " + evt.detail + " / wheelDelta = " + evt.wheelDelta);
          if (elapsedTime < _WHEEL_DURATION) {
            //console.log("[a b o r t e d ] !");
            return;
          }
          
          this._ts = currentTime;
        }

        if (!this._canZoom(evt.value)) {
          return;
        }
        
        this._extentUtil({
          numLevels: evt.value, 
          mapAnchor: evt.mapPoint,
          screenAnchor: evt.screenPoint
        });
        
        /*var start = this.extent, size;
        if (this.__tileInfo) {
          size = this.__getExtentForLevel(this.getLevel() + evt.value).extent;
        }
        else {
          size = start.expand(evt.value > 0 ? 0.5 * evt.value : 2 * -evt.value);
        }

        var center = evt.mapPoint,
            xmin = start.xmin - ((size.getWidth() - start.getWidth()) * (center.x - start.xmin) / start.getWidth()),
            ymax = start.ymax - ((size.getHeight() - start.getHeight()) * (center.y - start.ymax) / start.getHeight());

        this.__setExtent(new Extent(xmin, ymax - size.getHeight(), xmin + size.getWidth(), ymax, this.spatialReference),
                        null,
                        evt.screenPoint);*/
      },
      
      _scrollPanHandler: function(evt) {
        // SHIFT + MouseWheel implies Zoom
        if (evt.shiftKey && !this._isPanningOrZooming()) {
          this._setScrollWheelPan(false);
          this.enableScrollWheelZoom();
          this._scrollZoomHandler(evt);
          return;
        }

        // Let's make sense out of the scroll event
        var dx = 0, dy = 0;
        
        if (dojo.isFF) {
          if (evt.axis === evt.HORIZONTAL_AXIS) {
            dx = -evt.detail;
          }
          else {
            dy = -evt.detail;
          }
        }
        else {
          dx = evt.wheelDeltaX;
          dy = evt.wheelDeltaY;
        }
        
        this.translate(dx, dy);
      },

      _keyNavigatingHandler: function(evt) {
        var kc = evt.keyCode;

        if (dojo.indexOf(_NAV_KEYS, kc) !== -1) {
          //var ti = this.__tileInfo;

          if (kc === dk.NUMPAD_PLUS || kc === 61) {
            /*if (ti) {
              this.setLevel(this.getLevel() + 1);
            }
            else {
              this.__setExtent(this.extent.expand(0.5));
            }*/
            this._extentUtil({ numLevels: 1 });
          }
          else if (kc === dk.NUMPAD_MINUS) {
            /*if (ti) {
              this.setLevel(this.getLevel() - 1);
            }
            else {
              this.__setExtent(this.extent.expand(2));
            }*/
            this._extentUtil({ numLevels: -1 });
          }
          else {
            if (! this.__panning) {
              this.__panStart(0, 0);
            }

            switch (kc) {
              case dk.UP_ARROW: //pan up
              case dk.NUMPAD_8:
                this._keyboardPanDy += _PAN_PX;
                break;
              case dk.RIGHT_ARROW: //pan right
              case dk.NUMPAD_6:
                this._keyboardPanDx -= _PAN_PX;
                break;
              case dk.DOWN_ARROW: //pan down
              case dk.NUMPAD_2:
                this._keyboardPanDy -= _PAN_PX;
                break;
              case dk.LEFT_ARROW: //pan left
              case dk.NUMPAD_4:
                this._keyboardPanDx += _PAN_PX;
                break;
              case dk.PAGE_UP: //pan upper right
              case dk.NUMPAD_9:
                this._keyboardPanDx -= _PAN_PX;
                this._keyboardPanDy += _PAN_PX;
                break;
              case dk.PAGE_DOWN: //pan lower right
              case dk.NUMPAD_3:
                this._keyboardPanDx -= _PAN_PX;
                this._keyboardPanDy -= _PAN_PX;
                break;
              case dk.END: //pan lower left
              case dk.NUMPAD_1:
                this._keyboardPanDx += _PAN_PX;
                this._keyboardPanDy -= _PAN_PX;
                break;
              case dk.HOME: //pan upper left
              case dk.NUMPAD_7:
                this._keyboardPanDx += _PAN_PX;
                this._keyboardPanDy += _PAN_PX;
                break;
              default:
                return;
            }
            
            this.__pan(this._keyboardPanDx, this._keyboardPanDy);
          }

          dojo.stopEvent(evt);
        }
      },

      _keyNavigationEndHandler: function(evt) {
        if (this.__panning && (evt.keyCode !== dk.SHIFT)) {
          this.__panEnd(this._keyboardPanDx, this._keyboardPanDy);
          this._keyboardPanDx = this._keyboardPanDy = 0;
        }
      },
      
      _onLoadInitNavsHandler: function() {
        this.enableMapNavigation();
        this._createNav();
        
        if (this._mapParams.sliderStyle === "small" || !this._createSlider) {
          this._createSimpleSlider();
        }
        else {
          this._createSlider();
        }
        
        ddc(this._onLoadHandler_connect);
      },
      
      //NAV ARROWS
      _createNav: function() {
        //create navigation controls
        // FIXES CR 58077: For Map:  include enable and disable methods for map navigation arrows and slider
        if (this._mapParams.nav) {
          var div, v, i,
              addClass = dojo.addClass,
              id = this.id;

          this._navDiv = dcr("div", { id:id + "_navdiv" }, this.root);

          addClass(this._navDiv, "navDiv");

          var w2 = this.width / 2,
              h2 = this.height / 2,
              wh;
          for (i in _FIXEDPAN_CARDINAL) {
            v = _FIXEDPAN_CARDINAL[i];
            div = dcr("div", { id:id + "_pan_" + i }, this._navDiv);
            addClass(div, "fixedPan " + v);

            if (i === "up" || i === "down") {
              wh = parseInt(coords(div).w, 10) / 2;
              ds(div, { left: (w2 - wh) + "px", zIndex: _ZINDEX_NAV });
            }
            else {
              wh = parseInt(coords(div).h, 10) / 2;
              ds(div, { top: (h2 - wh) + "px", zIndex: _ZINDEX_NAV });
            }

            this._connects.push(dc(div, "onclick", dh(this, this[v])));
          }

          this._onMapResizeNavHandler_connect = dc(this, "onResize", this, "_onMapResizeNavHandler");

          for (i in _FIXEDPAN_DIAGONAL) {
            v = _FIXEDPAN_DIAGONAL[i];
            div = dcr("div", { id:id + "_pan_" + i, style:{ zIndex:_ZINDEX_NAV } }, this._navDiv);
            addClass(div, "fixedPan " + v);
            this._connects.push(dc(div, "onclick", dh(this, this[v])));
          }

          this.isPanArrows = true;
        }
      },

      _onMapResizeNavHandler: function(extent, wd, ht) {
        var id = this.id,
            w2 = wd / 2,
            h2 = ht / 2,
            byId = dojo.byId,
            i, div, wh;

        for (i in _FIXEDPAN_CARDINAL) {
          div = byId(id + "_pan_" + i);

          if (i === "up" || i === "down") {
            wh = parseInt(coords(div).w, 10) / 2;
            ds(div, "left", (w2 - wh) + "px");
          }
          else {
            wh = parseInt(coords(div).h, 10) / 2;
            ds(div, "top", (h2 - wh) + "px");
          }
        }
      },
      
      _createSimpleSlider: function() {
        if (this._mapParams.slider) {
          var sliderContainer  = (this._slider = dcr("div", {
            id: this.id + "_zoom_slider",
            "class": "esriSimpleSlider",
            style: "z-index: " + _ZINDEX_SLIDER + ";"
          }));
          
          dojo.addClass(sliderContainer, esri.config.defaults.map.slider.width ? "esriSimpleSliderHorizontal" : "esriSimpleSliderVertical");
          
          var incButton = dcr("div", { "class": "esriSimpleSliderIncrementButton" }, sliderContainer);
          incButton.innerHTML = "+";
          
          var decButton = dcr("div", { "class": "esriSimpleSliderDecrementButton" }, sliderContainer);
          decButton.innerHTML = "-";
          if (dojo.isIE < 8) {
            dojo.addClass(decButton, "dj_ie67Fix");
          }
          
          this._connects.push(dc(incButton, "onclick", this, this._simpleSliderChangeHandler));
          this._connects.push(dc(decButton, "onclick", this, this._simpleSliderChangeHandler));
          
          this.root.appendChild(sliderContainer);
          this.isZoomSlider = true;
        }
      },
      
      _simpleSliderChangeHandler: function(evt) {
        var zoomIn = (evt.currentTarget.className.indexOf("IncrementButton") !== -1) ? true : false;
        
        /*var currentLevel = this.getLevel();
        
        if (currentLevel !== -1) { // base layer is 'tiled'
          var newLevel = zoomIn ? (currentLevel + 1) : (currentLevel - 1);
          this.setLevel(newLevel);
        }
        else { // base layer is 'dynamic'
          var zoomFactor = zoomIn ? 0.5 : 2;
          this.__setExtent(this.extent.expand(zoomFactor));
        }*/
       
        this._extentUtil({ numLevels: zoomIn ? 1 : -1 });
      },

// BUILD DIRECTIVE
      //SLIDER
      _createSlider: function() {
        //create slider controls
        // FIXES CR 58077: For Map:  include enable and disable methods for map navigation arrows and slider
        if (this._mapParams.slider) {
          var div = dcr("div", { id:this.id + "_zoom_slider" }, this.root),
              mapDefaults = esri.config.defaults.map,
              isHorizontal = mapDefaults.slider.width,
              SliderClass = isHorizontal ? dijit.form.HorizontalSlider : dijit.form.VerticalSlider,
              sliderStyle = dojo.toJson(mixin({ position: "absolute" }, mapDefaults.slider)),
              numLevels = this.getNumLevels(),
              dform = dijit.form,
              i, il, slider;

          sliderStyle = sliderStyle.substring(1, sliderStyle.length - 1).split("\"").join("").split(",").join(";");

          if (numLevels > 0) {
            var rulesRightNode, sliderRightRules, rulesRightLabelsNode, rulesRightLabels, labels,
                sliderLabel = mapDefaults.sliderLabel;

            if (sliderLabel) {
              var SliderRule = isHorizontal ? dform.HorizontalRule : dform.VerticalRule,
                  SliderRuleLabels = isHorizontal ? dform.HorizontalRuleLabels : dform.VerticalRuleLabels,
                  cont = isHorizontal ? "topDecoration" : "rightDecoration",
                  tick = isHorizontal ? "height:" + sliderLabel.tick + "px" : "width:" + sliderLabel.tick + "px";

              labels = sliderLabel.labels;
              if (labels === null) {
                labels = [];
                for (i = 0, il = numLevels; i < il; i++) {
                  labels[i] = "";
                }
              }

              rulesRightNode = dcr('div');
              div.appendChild(rulesRightNode);
              sliderRightRules = new SliderRule({ container: cont, count: numLevels, style: tick }, rulesRightNode);

              rulesRightLabelsNode = dcr('div');
              div.appendChild(rulesRightLabelsNode);
              rulesRightLabels = new SliderRuleLabels({ container: cont, count: numLevels, labels: labels, style: sliderLabel.style }, rulesRightLabelsNode);

              rulesRightNode = rulesRightLabelsNode = null;
            }

            slider = (this._slider = new SliderClass({
              id:div.id,
              minimum:0,
              maximum:numLevels - 1,
              discreteValues:numLevels,
              value:this.getLevel(),
              clickSelect: true,
              intermediateChanges: true, //mapDefaults.sliderChangeImmediate,
              style: sliderStyle + "; z-index:" + _ZINDEX_SLIDER + ";"
            }, div));

            slider.startup();
            if (sliderLabel) {
              sliderRightRules.startup();
              rulesRightLabels.startup();
            }

            this._slider_connect = dc(slider, "onChange", this, "_onSliderChangeHandler");
            this._connects.push(dc(this, "onExtentChange", this, "_onExtentChangeSliderHandler"));
            
            // Initialize slider drag processing after "onFirstMove" instead of "onMoveStart" 
            // to avoid triggering Map::onExtentChange just by clicking the slider handle and 
            // to avoid triggering Map::onExtentChange twice when clicking on a slider tick to zoom.
            this._connects.push(dc(slider._movable, "onFirstMove", this, "_onSliderMoveStartHandler"));
          }
          else {
            slider = (this._slider = new SliderClass({ id:div.id,
                                       minimum:0,
                                       maximum:2,
                                       discreteValues:3,
                                       value:1,
                                       clickSelect: true,
                                       intermediateChanges: mapDefaults.sliderChangeImmediate,
                                       style: sliderStyle + " height:100px; z-index:" + _ZINDEX_SLIDER + ";"
                                    }, div));

            var children = slider.domNode.firstChild.childNodes;
            for (i=1; i<=3; i++) {
              ds(children[i], "visibility", "hidden");
            }

            slider.startup();
            this._slider_connect = dc(slider, "onChange", this, "_onDynSliderChangeHandler");
            this._connects.push(dc(this, "onExtentChange", this, "_onExtentChangeDynSliderHandler"));
          }
          
          var incButton = slider.incrementButton, decButton = slider.decrementButton;




          // disable the annoying outline artifacts
          incButton.style.outline = "none";
          decButton.style.outline = "none";
          slider.sliderHandle.style.outline = "none";

          // disable controlling slider through keys such as UP/DOWN etc
          slider._onKeyPress = function() {};
          
          // Fix for NIM053825
          // In IE, if left and right buttons are both pressed and released,
          // event.button values across down and up do not cancel out.
          // References:
          // https://developer.mozilla.org/en/DOM/event.button
          // http://msdn.microsoft.com/en-us/library/ms533544%28VS.85%29.aspx
          // http://www.quirksmode.org/js/events_properties.html#button
          var movable = slider._movable;
          if (movable) {
            var saved = movable.onMouseDown;
            movable.onMouseDown = function(e) {
              if (dojo.isIE < 9 && e.button !== 1) {
                // do not respond if it is not LEFT mouse button in IE
                return;
              }
              saved.apply(this, arguments);
            };
          }

          this.isZoomSlider = true;
        }
      },
      
      _onSliderMoveStartHandler: function() {
        ddc(this._slider_connect);
        ddc(this._slidermovestop_connect);
        this._slider_connect = dc(this._slider, "onChange", this, "_onSliderChangeDragHandler");
        this._slidermovestop_connect = dc(this._slider._movable, "onMoveStop", this, "_onSliderMoveEndHandler");
        
        /*this._sliderChangeAnchor = this.toScreen(this.extent.getCenter());
        this._startingLevel = this._slider.value;
        this.__zoomStart(this.extent, this._sliderChangeAnchor);*/
      },
      
      _onSliderChangeDragHandler: function(value) {
        /*var extent = this.__getExtentForLevel(value).extent,
            scale = this.extent.getWidth() / extent.getWidth();
        this.__zoom(extent, scale, this._sliderChangeAnchor);*/
       
        this._extentUtil({ targetLevel: value });
      },
      
      _onSliderMoveEndHandler: function() {
        ddc(this._slider_connect);
        ddc(this._slidermovestop_connect);

        /*var extLod = this.__getExtentForLevel(this._slider.value),
            extent = extLod.extent,
            scale = this.extent.getWidth() / extent.getWidth();*/
            
        //this.__zoomEnd(extent, scale, this._sliderChangeAnchor, extLod.lod, true /*this._slider.value != this._startingLevel*/);

        //this._sliderChangeAnchor = null;
      },

      _onSliderChangeHandler: function(value) {
        this.setLevel(value);
      },
      
      _updateSliderValue: function(newValue, changeHandlerName) {
        ddc(this._slider_connect);
        var slider = this._slider;
        
        // At Dojo 1.4, calling "attr" to change the value
        // delays onChange event (async). This is a problem because
        // we reconnect to onChange right after. Now when 
        // onChange is fired and processed, it will result in 
        // map onExtentChange fired once more. Looking at:
        // dijit.form._FormWidget::_handleOnChange method,
        // there is a internal variable named "_onChangeActive"
        // which we can use to suppress onChange from being fired
        // alltogether. We don't need onChange at this particular
        // moment anyways - that's why we were disconnecting before
        // calling "attr" and reconnecting after
        // Related dojo ticket: http://bugs.dojotoolkit.org/ticket/9531
        // See also: http://docs.dojocampus.org/releasenotes/1.4#onchange-event-handling
        
        var saved = slider._onChangeActive;
        slider._onChangeActive = false;
        slider.set("value", newValue);
        slider._onChangeActive = saved;
        
        this._slider_connect = dc(slider, "onChange", this, changeHandlerName);
      },

      _onExtentChangeSliderHandler: function(extent, anchor, levelChange, lod) {
        ddc(this._slidermovestop_connect);
        this._updateSliderValue(lod.level, "_onSliderChangeHandler");
      },

      //dynamic slider
      _onDynSliderChangeHandler: function(value) {
        /*if (value > 0) {
          this.__setExtent(this.extent.expand(0.5));
        }
        else {
          this.__setExtent(this.extent.expand(2));
        }*/
        this._extentUtil({ numLevels: value > 0 ? 1 : -1 });
      },

      _onExtentChangeDynSliderHandler: function() {
//        ddc(this._slider_connect);
//        this._slider.attr("value", 1);
//        this._slider_connect = dc(this._slider, "onChange", this, "_onDynSliderChangeHandler");

        this._updateSliderValue(1, "_onDynSliderChangeHandler");
      },
      
//      //logo link function
      _openLogoLink: function(evt) {
        window.open(esri.config.defaults.map.logoLink, "_blank");
        dojo.stopEvent(evt);
      },
      
      //PUBLIC METHODS
      enableMapNavigation: function() {
        //summary: Enable map navigation
        this.enableDoubleClickZoom();
        this.enableClickRecenter();
        this.enablePan();
        this.enableRubberBandZoom();
        this.enableKeyboardNavigation();
        
        if (this.smartNavigation) {
          this._setScrollWheelPan(true);
        }
        else {
          this.enableScrollWheelZoom();
        }
      },

      disableMapNavigation: function() {
        //summary: Disable map navigation
        this.disableDoubleClickZoom();
        this.disableClickRecenter();
        this.disablePan();
        this.disableRubberBandZoom();
        this.disableKeyboardNavigation();
        this.disableScrollWheelZoom();
        if (this.smartNavigation) {
          this._setScrollWheelPan(false);
        }
      },

      enableDoubleClickZoom: function() {
        //summary: Enable double click map zooming
        if (! this.isDoubleClickZoom) {
          this._dblClickZoomHandler_connect = dc(this, "onDblClick", this, "_dblClickZoomHandler");
          this.isDoubleClickZoom = true;
        }
      },

      disableDoubleClickZoom: function() {
        //summary: Disable double click map zooming
        if (this.isDoubleClickZoom) {
          ddc(this._dblClickZoomHandler_connect);
          this.isDoubleClickZoom = false;
        }
      },

      enableShiftDoubleClickZoom: function() {
        if (! this.isShiftDoubleClickZoom) {
          deprecated(this.declaredClass + ": " + esri.bundle.map.deprecateShiftDblClickZoom, null, "v2.0");
          this._recenterZoomHandler_connect = dc(this, "onDblClick", this, "_recenterZoomHandler");
          this.isShiftDoubleClickZoom = true;
        }
      },

      disableShiftDoubleClickZoom: function() {
        if (this.isShiftDoubleClickZoom) {
          deprecated(this.declaredClass + ": " + esri.bundle.map.deprecateShiftDblClickZoom, null, "v2.0");
          ddc(this._recenterZoomHandler_connect);
          this.isShiftDoubleClickZoom = false;
        }
      },

      enableClickRecenter: function() {
        //summary: Enable click + shift recenter
        if (! this.isClickRecenter) {
          this._recenterHandler_connect = dc(this, "onClick", this, "_recenterHandler");
          this.isClickRecenter = true;
        }
      },

      disableClickRecenter: function() {
        //summary: Disable click + shift recenter
        if (this.isClickRecenter) {
          ddc(this._recenterHandler_connect);
          this.isClickRecenter = false;
        }
      },

      enablePan: function() {
        //summary: Enable map panning
        if (! this.isPan) {
          this._downPanHandler_connect = dc(this, this._panInitEvent, this, "_downPanHandler");
          this.isPan = true;
        }
      },

      disablePan: function() {
        //summary: Disable map panning
        if (this.isPan) {
          ddc(this._downPanHandler_connect);
          this.isPan = false;
        }
      },

      enableRubberBandZoom: function() {
        //summary: Enable rubber band zooming in/out
        if (! this.isRubberBandZoom) {
          this._downZoomHandler_connect = dc(this, this._zoomInitEvent, this, "_downZoomHandler");
          this.isRubberBandZoom = true;
        }
      },

      disableRubberBandZoom: function() {
        //summary: Disable rubber band zooming in/out
        if (this.isRubberBandZoom) {
          ddc(this._downZoomHandler_connect);
          this.isRubberBandZoom = false;
        }
      },

      enableKeyboardNavigation: function() {
        //summary: Enable keyboard map navigation
        if (! this.isKeyboardNavigation) {
          this._keyNavigatingHandler_connect = dc(this, "onKeyDown", this, "_keyNavigatingHandler");
          this._keyNavigationEndHandler_connect = dc(this, "onKeyUp", this, "_keyNavigationEndHandler");
          this.isKeyboardNavigation = true;
        }
      },

      disableKeyboardNavigation: function() {
        //summary: Disable keyboard map navigation
        if (this.isKeyboardNavigation) {
          ddc(this._keyNavigatingHandler_connect);
          ddc(this._keyNavigationEndHandler_connect);
          this.isKeyboardNavigation = false;
        }
      },

      enableScrollWheelZoom: function() {
        //summary: Enable mouse scroll wheel zoom in/out
        if (! this.isScrollWheelZoom) {
          this._scrollZoomHandler_connect = dc(this, "onMouseWheel", this, "_scrollZoomHandler");
          this.isScrollWheelZoom = true;
        }
      },
      
      __canStopSWEvt: function() {
        // overrides _MapContainer::__canStopSWEvt
        return this.isScrollWheelZoom || this.isScrollWheelPan;
      },

      disableScrollWheelZoom: function() {
        //summary: Disable mouse scroll wheel zoom in/out
        if (this.isScrollWheelZoom) {
          ddc(this._scrollZoomHandler_connect);
          this.isScrollWheelZoom = false;
        }
      },
      
      _setScrollWheelPan: function(enable) {
        this.isScrollWheelPan = enable;
        this.enableMouseWheel(enable); // enable per-line resolution
        ddc(this._mwMacHandle);
        
        if (enable) {
          this._mwMacHandle = dc(this, "onMouseWheel", this, this._scrollPanHandler);
        }
      },

      // FIXES CR 58077: For Map:  include enable and disable methods for map navigation arrows and slider            
      showPanArrows: function() {
        //summary: Enable map panning using the arrows
        if (this._navDiv) {
          esri.show(this._navDiv);
          this.isPanArrows = true;
        }
      },

      hidePanArrows: function() {
        //summary: Disable map panning using the arrows
        if (this._navDiv) {
          esri.hide(this._navDiv);
          this.isPanArrows = false;
        }
      },

      showZoomSlider: function() {
        //summary: Enable slider zooming in/out
        if (this._slider) {
          ds(this._slider.domNode || this._slider, "visibility", "visible");
          this.isZoomSlider = true;
        }
      },

      hideZoomSlider: function() {
        //summary: Disable slider zooming in/out
        if (this._slider) {
          ds(this._slider.domNode || this._slider, "visibility", "hidden");
          this.isZoomSlider = false;
        }
      }
    };
  }())
);

dojo.require("esri.layers.agsdynamic");
dojo.require("esri.layers.agstiled");
// BUILD DIRECTIVE
dojo.require("esri.layers.agsimageservice");

if (esri.isTouchEnabled) {
dojo.extend(esri.Map, (function() {
    var dc = dojo.connect,
        ddc = dojo.disconnect,
        Point = esri.geometry.Point,
        getLength = esri.geometry.getLength,        
        getCandidateTileInfo = esri.TileUtils.getCandidateTileInfo;
                 
    return {
      /*constructor: function(container, params) {                
        
        this._connects.push(dc(this, "onTouchStart", this, this._downPanHandler));
        this._connects.push(dc(this, "onGestureStart", this, this._downZoomHandler));
      },
      
      _cleanUp: function() {
        for (var i=this._connects.length; i>=0; i--) {
          ddc(this._connects[i]);
          delete this._connects[i];
        }
        
        ddc(this._panHandler_connect);
        ddc(this._upPanHandler_connect);
        
        this.inherited("_cleanUp", arguments);
      },*/
     
      _multiTouchTapZoomHandler: function(evt) {
        if (! this._isPanningOrZooming()) {
          evt.value = -1;
          this._scrollZoomHandler(evt, true);
        }
      },
            
      _downPanHandler: function(evt) {
        var prevAnim = this._zoomAnim || this._panAnim;
        if (prevAnim && prevAnim._active) {
          prevAnim.stop();
          prevAnim._fire("onEnd", [prevAnim.node]);
        }
//        else if (this.__zooming) {
//          console.log("finalize ZOOM");
//          evt.screenPoint = new Point(this._panX, this._panY);
//          evt.mapPoint = this.toMap(evt.screenPoint);
//          this._upPanHandler(evt);
//        }

        this._dragOrigin = new Point(0, 0);
        dojo.mixin(this._dragOrigin, evt.screenPoint);

        ddc(this._panHandler_connect);
        ddc(this._upPanHandler_connect);
        this._panHandler_connect = dc(this, "onTouchMove", this, this._panHandler);
        this._upPanHandler_connect = dc(this, "onTouchEnd", this, this._upPanHandler);
        //dojo.stopEvent(evt);
      },
      
      _panHandler: function(evt) {
        evt.preventDefault();

        if (this.__panning) {
          this._panX = evt.screenPoint.x;
          this._panY = evt.screenPoint.y;
          
          this.__pan(evt.screenPoint.x - this._dragOrigin.x, evt.screenPoint.y - this._dragOrigin.y);
        }
        else {
          this.setCursor("move");
          this.__panStart(evt.screenPoint.x, evt.screenPoint.y);
        }
        //dojo.stopEvent(evt);
      },
      
      _upPanHandler: function(evt) {
        ddc(this._panHandler_connect);
        ddc(this._upPanHandler_connect);
        
        if (this.__panning) {
          this.__panEnd(evt.screenPoint.x - this._dragOrigin.x, evt.screenPoint.y - this._dragOrigin.y);
          this.resetMapCursor();
        }
        //dojo.stopEvent(evt);
      },
      
      _downZoomHandler: function(evt) {
        var prevAnim = this._zoomAnim || this._panAnim;
        if (prevAnim && prevAnim._active) {
          prevAnim.stop();
          prevAnim._fire("onEnd", [prevAnim.node]);
        }
        else if (this.__panning) {
          evt.screenPoint = new Point(this._panX, this._panY);
          evt.mapPoint = this.toMap(evt.screenPoint);
          this._upPanHandler(evt);
        }
        
        ddc(this._zoomHandler_connect);
        ddc(this._upZoomHandler_connect);
        this._zoomHandler_connect = dc(this, "onGestureChange", this, this._zoomHandler);
        this._upZoomHandler_connect = dc(this, "onGestureEnd", this, this._upZoomHandler);
        //dojo.stopEvent(evt);
      },
      
      _zoomHandler: function(evt) {
        if (evt.screenPoints) {
          evt.preventDefault();
          this.currLength = getLength(evt.screenPoints[0], evt.screenPoints[1]);
          
          // TODO
          // Need to fix the selection of anchor point. The map locations underneath
          // the fingers at the start of gesture do not remain so as the gesture
          // progresses (try moving only finger 1, then moving only finger 2).
          // We need a solution where two map location act as anchors
          
          if (this.__zooming) {
            var scale = this.currLength / this._length;
            this._zoomStartExtent = this.__scaleExtent(this.extent, scale, this._dragOrigin);
            this.__zoom(this._zoomStartExtent, scale, this._dragOrigin);
          }
          else {
            this._dragOrigin = new Point((evt.screenPoints[0].x + evt.screenPoints[1].x) / 2, (evt.screenPoints[0].y + evt.screenPoints[1].y) / 2);
            this._length = this.currLength;
            this.__zoomStart(this.extent, this._dragOrigin);
          }

          this._fireOnScale(this.currLength / this._length, this._dragOrigin, true);
        }
        //dojo.stopEvent(evt);
      },
      
      _upZoomHandler: function(evt) {
        ddc(this._zoomHandler_connect);
        ddc(this._upZoomHandler_connect);
        
        if (evt.processMultiTouchTap) {
          this._multiTouchTapZoomHandler(evt);
          evt.preventDefault();
        }
        else {
          if (this.__zooming && this._zoomAnim === null) {
            var scale = this.currLength / this._length, extWd = this.extent.getWidth();
            this._zoomAnimAnchor = this.toMap(this._dragOrigin);
            this._zoomStartExtent = this.__scaleExtent(this.extent, 1 / scale, this._zoomAnimAnchor);
            
            if (this.__tileInfo) {
              var ct = getCandidateTileInfo(this, this.__tileInfo, this._zoomStartExtent),
                  extLod = this.__getExtentForLevel(ct.lod.level, this._zoomAnimAnchor), 
                  maxLevel = this.getNumLevels() - 1,
                  endExtent = extLod.extent, endLod = extLod.lod,
                  targetScale = extWd / endExtent.getWidth(),
                  targetLevel = ct.lod.level;
                  
              if (scale < 1) { // zooming out
                if (targetScale > scale) {
                  targetLevel--;
                }
              }
              else { // zoom in
                if (targetScale < scale) {
                  targetLevel++;
                }
              }
              
              if (targetLevel < 0) {
                targetLevel = 0;
              }
              else if (targetLevel > maxLevel) {
                targetLevel = maxLevel;
              }
              
              if (targetLevel !== ct.lod.level) {
                extLod = this.__getExtentForLevel(targetLevel, this._zoomAnimAnchor);
                endExtent = extLod.extent;
                endLod = extLod.lod;
              }

              this._zoomEndExtent = endExtent;
              this._zoomEndLod = endLod;
              
              this._zoomAnim = esri.fx.animateRange({
                range: {
                  start: (extWd / this._zoomStartExtent.getWidth()),
                  end: targetScale
                },
                duration: esri.config.defaults.map.zoomDuration,
                rate: esri.config.defaults.map.zoomRate,
                onAnimate: dojo.hitch(this, "_adjustZoomHandler"),
                onEnd: dojo.hitch(this, "_adjustZoomEndHandler")
              }).play();

              this._fireOnScale(this.extent.getWidth()/this._zoomEndExtent.getWidth(), this._dragOrigin);
            }
            else {
              this._zoomEndExtent = this._zoomStartExtent;
              this._fireOnScale(this.extent.getWidth()/this._zoomEndExtent.getWidth(), this._dragOrigin);
              this._adjustZoomEndHandler();
            }
          }
        }
      },
      
      _adjustZoomHandler: function(scale) {
        var extent = this.__scaleExtent(this.extent, scale, this._zoomAnimAnchor);
        this.__zoom(extent, scale, this._dragOrigin);
      },
      
      _adjustZoomEndHandler: function() {
        var scale = this.extent.getWidth() / this._zoomEndExtent.getWidth(),
            extent = this.__scaleExtent(this.extent, 1/scale, this._zoomAnimAnchor);
            
        this.__zoomEnd(extent, scale, this._dragOrigin, this._zoomEndLod, /*this.__LOD ? (this.__LOD.level != this._zoomEndLod.level) :*/ true);
        this._zoomStartExtent = this._zoomEndExtent = this._zoomEndLod = this._dragOrigin = this._zoomAnim = this._zoomAnimAnchor = null;
      }
    };
  }())
);
}

});
