//>>built
// wrapped by build app
define("esri/touchcontainer", ["dijit","dojo","dojox"], function(dijit,dojo,dojox){
dojo.provide("esri.touchcontainer");

// Reference:
// Handling Events: http://developer.apple.com/library/IOS/documentation/AppleApplications/Reference/SafariWebContent/HandlingEvents/HandlingEvents.html
// Safari DOM Additions Reference: http://developer.apple.com/library/safari/#documentation/appleapplications/reference/SafariJSRef/_index.html
// Multitouch Gestures: http://jonoscript.wordpress.com/2010/10/29/game-on-2010-example-code-multitouch-gestures/
// http://www.sitepen.com/blog/2008/07/10/touching-and-gesturing-on-the-iphone/

//all map container functionality
dojo.declare("esri._MapContainer", esri._CoreMap, (function() {
    var connect = dojo.connect,
        disconnect = dojo.disconnect,
        Point = esri.geometry.Point; //local var since Point constructor is used in processEvent
    
    var _CLICK_DURATION = 300;
               
    return {
      constructor: function() {
        this._onTouchStart_connect = connect(this.__container, "ontouchstart", this, this._onTouchStartHandler);
        this._gestureStartConnect = connect(this.__container, "ongesturestart", this, this._onGestureStartHandler);
        
        //this._connects.push(connect(this.__container, "ongesturestart", this, this._onGestureStartHandler));
        this._connects.push(connect(this.__container, "onmouseover", this, this._onMouseOverHandler));       
        this._connects.push(connect(this.__container, "onmouseout",  this, this._onMouseOutHandler));
        this._connects.push(connect(this.__container, "onmousedown", this, this._onMouseDownHandler));
        this._connects.push(connect(this.__container, "onmouseup",   this, this._onMouseUpHandler));
        this._connects.push(connect(this.__container, "onclick",     this, this._onClickHandler));
        
        this._endX = this._endY = 0;
        this._firstTapOn = false;
        this._processDoubleTap = false;
        this._processMultiTouchTap = false;
        this._doubleTapTimeoutObject = false;
        this._doubleTapTimeout = dojo.hitch(this, this._doubleTapTimeout);
      },
      
      _doubleTapTimeout: function() {
        this._firstTapOn = false;
      },

      _cleanUp: function() {
        var i;
        for (i=this._connects.length; i>=0; i--) {
          disconnect(this._connects[i]);
          delete this._connects[i];
        }
        
        disconnect(this._onTouchMoveHandler_connect);
        disconnect(this._onTouchEndHandler_connect);
        disconnect(this._onTouchCancelHandler_connect);
        
        this.inherited("_cleanUp", arguments);
      },
      
      __setClickDuration: function(dur) {        
        this._clickDuration = dur;
      },
      
      __resetClickDuration: function() {        
        this._clickDuration = _CLICK_DURATION;
      },
      
      _processEvent: function(evt) {
        if (evt.type.indexOf("touch") !== -1) {
          if (evt.touches.length === 2) {
            evt.screenPoints = [
              new Point(evt.touches.item(0).pageX - this.position.x, evt.touches.item(0).pageY - this.position.y),
              new Point(evt.touches.item(1).pageX - this.position.x, evt.touches.item(1).pageY - this.position.y)
            ];
            return evt;
          }
          else {
            if (evt.type === "touchstart") {
              evt.screenPoint = new Point(evt.targetTouches.item(0).pageX - this.position.x, evt.targetTouches.item(0).pageY - this.position.y);
            }
            else {
              evt.screenPoint = new Point(evt.changedTouches.item(0).pageX - this.position.x, evt.changedTouches.item(0).pageY - this.position.y);
            }
            evt.mapPoint = this.extent ? this.toMap(evt.screenPoint) : new Point();
            return evt;
          }
        }

        evt.screenPoint = new Point(evt.pageX - this.position.x, evt.pageY - this.position.y);
        evt.mapPoint = this.extent ? this.toMap(evt.screenPoint) : new Point();
        return evt;
      },
      
      _onClickHandler: function(evt) {
        evt = this._processEvent(evt);        
        var dx = Math.abs(this._endX - evt.screenPoint.x);
        var dy = Math.abs(this._endY - evt.screenPoint.y);
        
        // BlackBerry Torch have different coordinates value in the evt of touchend vs onclick. 
        // We need to branch the codes to allow onclick to fire.
        if (esri.isBlackBerry) {
            clearTimeout(this._doubleTapTimeoutObject);
            this._firstTapOn = false;
            // BlackBerry Torch sometimes fire click event while panning. Need to add logic to prevent it.
            if (!this._tmoved) {
              this.onClick(evt);
            }
        }
        else {
          if (dx <= 1 && dy <= 1) {
            var ts = (new Date()).getTime(),
                doDoubleClick = this._clkTS && ((ts - this._clkTS) <= 400),
                diffX = doDoubleClick && Math.abs(this._lastClickX - evt.pageX),
                diffY = doDoubleClick && Math.abs(this._lastClickY - evt.pageY);
            
            clearTimeout(this._doubleTapTimeoutObject);
            this._firstTapOn = false;
            this.onClick(evt);
            
            // iOS browser does not fire a click event during double-tap gesture 
            // However, Android does (atleast on Android 3.2.1 on Xoom). 
            // This disrupts double tap processing on touch-end, thereby preventing
            // onDblClick - and double-tap-to-zoomin action.
            // In Android 2.x we don't get into this if block because dx and dy
            // are usually large. This in itself is strange because why would touchend
            // and click event coords differ by a large amount. However this seems to be
            // fixed in 3.x and hence we get into this if block resulting in cancellation
            // of impending double-tap. Ugly flow.
            // TODO
            // I hate this solution - have to tolerate such hacks until this 
            // module is rewritten. See MSPointerContainer.js for future direction
            if (esri.isAndroid && doDoubleClick && diffX <= 15 && diffY <= 15) {
              this.onDblClick(evt);
              this._processDoubleTap = false;
            }
          }
        }
      },
               
      _onMouseOverHandler: function(evt){
        evt = this._processEvent(evt);
        this.onMouseOver(evt);        
      },
               
      _onMouseOutHandler: function(evt){
        evt = this._processEvent(evt);
        this.onMouseOut(evt);
      },
      
      _onMouseDownHandler: function(evt){
        evt = this._processEvent(evt);
        this.onMouseDown(evt);
      },
      
      _onMouseUpHandler: function(evt){
        evt = this._processEvent(evt);
        this.onMouseUp(evt);
      },
               
      _onTouchStartHandler: function(evt) {
        var fireEnd;
        
        if (this._firstTapOn) {
          // Fix BlackBerry Torch issue, discard second touch start if first touch start established without a touch end.
          if (esri.isBlackBerry) {
            if (this._lastTouchEvent === "touchend") {
              this._processDoubleTap = true;
              clearTimeout(this._doubleTapTimeoutObject);
              this._firstTapOn = false;
              
              // BlackBerry Torch is missing second touchend so we need to properly fire it by calling onTouchEndHandler              
              //this._onTouchEndHandler(evt);
              fireEnd = 1;
            }
          }
          else {
            this._processDoubleTap = true;
            clearTimeout(this._doubleTapTimeoutObject);
            this._firstTapOn = false;
          }
        }
        else {
          this._firstTapOn = true;
          this._doubleTapTimeoutObject = setTimeout(this._doubleTapTimeout, 400);
        }
        
        this._lastTouchEvent = "touchstart";
        
        evt = this._processEvent(evt);
        this._tmoved = false;
        
        disconnect(this._onTouchMoveHandler_connect);
        disconnect(this._onTouchEndHandler_connect);
        disconnect(this._onTouchCancelHandler_connect);
        this._onTouchMoveHandler_connect = connect(this.__container, "ontouchmove", this, this._onTouchMoveHandler);
        this._onTouchEndHandler_connect = connect(this.__container, "ontouchend", this, this._onTouchEndHandler);
        this._onTouchCancelHandler_connect = connect(this.__container, "ontouchcancel", this, this._onTouchEndHandler);
        
        this.onTouchStart(evt);
        
        if (fireEnd) {
          this._onTouchEndHandler(evt);
        }
      },
      
      _onTouchMoveHandler: function(evt) {
        this._tmoved = true;
        this.onTouchMove(this._processEvent(evt));
      },
      
      _onTouchEndHandler: function(evt) {
        disconnect(this._onTouchMoveHandler_connect);
        disconnect(this._onTouchEndHandler_connect);
        disconnect(this._onTouchCancelHandler_connect);

        this._lastTouchEvent = "touchend";
        evt = this._processEvent(evt);
        
        var dx = Math.abs(this._endX - evt.screenPoint.x),
            dy = Math.abs(this._endY - evt.screenPoint.y);
        this._endX = evt.screenPoint.x;
        this._endY = evt.screenPoint.y;
               
        this.onTouchEnd(evt);
        
        if (this._processDoubleTap) {
          if (dx <= 15 && dy <= 15) {
            // This check is to avoid inadvertently zooming-in when:
            // 1. the taps fall far from each other
            // 2. panning rapidly
            this.onDblClick(evt);
          }
          this._processDoubleTap = false;
        }
        /*if (!this._tmoved) {
          this.onClick(evt);
        }*/
      },
      
      _onGestureStartHandler: function(evt) {
        // TODO
        // Ideally we'd want to keep touchstart event wired up so that
        // when a finger is lifted up while pinching, panning still happens.
        // When the whole event inference logic is rewritten we should be
        // able to easily do this.
        disconnect(this._onTouchStart_connect);
        disconnect(this._gestureStartConnect);
        disconnect(this._onTouchMoveHandler_connect);
        disconnect(this._onTouchEndHandler_connect);
        disconnect(this._onTouchCancelHandler_connect);
        
        this._processMultiTouchTap = true;
        
        this._onTouchMoveHandler_connect = connect(this.__container, "ontouchmove", this, this._onGestureTouchMoveHandler);
        this._onTouchEndHandler_connect = connect(this.__container, "ontouchend", this, this._onGestureTouchEndHandler);
        this._onTouchCancelHandler_connect = connect(this.__container, "ontouchcancel", this, this._onGestureTouchEndHandler);
        
        this.onGestureStart(this._processEvent(evt));
      },
      
      _onGestureTouchMoveHandler: function(evt) {
        this._processMultiTouchTap = false;
        
        this.onGestureChange(this._processEvent(evt));
      },
      
      _onGestureTouchEndHandler: function(evt) {
        disconnect(this._onTouchMoveHandler_connect);
        disconnect(this._onTouchEndHandler_connect);
        disconnect(this._onTouchCancelHandler_connect);
        this._onTouchStart_connect = connect(this.__container, "ontouchstart", this, this._onTouchStartHandler);
        this._gestureStartConnect = connect(this.__container, "ongesturestart", this, this._onGestureStartHandler);
        
        if (this._processMultiTouchTap) {
          evt.processMultiTouchTap = true;
          this._processMultiTouchTap = false;
        }
        
        this.onGestureEnd(this._processEvent(evt));
      },
         
      //events
      onClick: function(evt){ 
        this._clkTS = (new Date()).getTime(); 
        this._lastClickX = evt.pageX; 
        this._lastClickY = evt.pageY; 
      },
      
      onMouseOver: function(){},     
      onMouseOut:  function(){},
      onMouseDown: function(){},
      onMouseUp:   function(){},
         
      //touch events
      onTouchStart: function() {},
      onTouchMove: function() {},
      onTouchEnd: function() {},
      
      //gesture events
      onGestureStart: function() {},
      onGestureChange: function() {},
      onGestureEnd: function() {}
    };
  }())
);
});
