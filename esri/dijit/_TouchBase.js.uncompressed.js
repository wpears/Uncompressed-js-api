//>>built
// wrapped by build app
define("esri/dijit/_TouchBase", ["dijit","dojo","dojox"], function(dijit,dojo,dojox){
dojo.provide("esri.dijit._TouchBase");

dojo.declare("esri.dijit._TouchBase", null, {
  _preventDefault: true,
  _swipeThreshold: 20,
  
  constructor: function(node, params) {
    this.domNode = dojo.byId(node);
    this.events = [
    dojo.connect(this.domNode, "touchstart", this, this._touchStartHandler),
    dojo.connect(this.domNode, "touchmove", this, this._touchMoveHandler),
    dojo.connect(this.domNode, "touchend", this, this._touchEndHandler),
    dojo.connect(this.domNode, "onclick", this, this._clickHandler)
    ]
  },
  
  setPreventDefault: function(args) {
    this._preventDefault = args;
  },
  
  disableOnClick: function() {
    dojo.disconnect(this.events.pop());
  },
  
  _clickHandler: function(e) {
    if (!this._moved) {
      this.onclick(e);
    }
    else {
      e.preventDefault();
    }
  },
  
  _touchStartHandler: function(e) {
    this._moved = false;

    this.client_x = e.targetTouches[0].clientX;
    this.client_y = e.targetTouches[0].clientY;
    
    this.down_x = e.targetTouches[0].pageX;
    this.down_y = e.targetTouches[0].pageY;
    
    e.downX = this.down_x;
    e.downY = this.down_y;
    
    this.onTouchStart(e);
  },

  _touchMoveHandler: function(e) {
    if (this._preventDefault) {
      e.preventDefault();
    }
    this._moved = true;
    
    this.up_x = e.targetTouches[0].pageX;
    
    this.cur_x = e.targetTouches[0].pageX - this.down_x;
    this.cur_y = e.targetTouches[0].pageY - this.down_y;
    
    e.curX = this.cur_x;
    e.curY = this.cur_y;
    
    this.onTouchMove(e);
  },

  _touchEndHandler: function(e) {
    if (!this._moved)
    {
      e.clientX = this.client_x;
      e.clientY = this.client_y;
      
      //this.domNode.click();
    }
    else
    {
      e.curX = this.cur_x;
      e.curY = this.cur_y;
      
      if (this.down_x - this.up_x > this._swipeThreshold) {
        e.swipeDirection = "left";
      }
      else if (this.up_x - this.down_x > this._swipeThreshold) {
        e.swipeDirection = "right";
      }
      
      //this.onTouchEnd(e);
    }
    
    this.onTouchEnd(e);
    
  },
  
  //events
  onTouchStart: function(evt){},
  onTouchMove: function(evt){},
  onTouchEnd: function(evt){},
  onclick: function(evt){}
});

});
