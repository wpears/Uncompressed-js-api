//>>built
// wrapped by build app
define("esri/dijit/InfoView", ["dijit","dojo","dojox","dojo/require!esri/dijit/_TouchBase"], function(dijit,dojo,dojox){
dojo.provide("esri.dijit.InfoView");

dojo.require("esri.dijit._TouchBase");

/* Load the css from the html page */
/* <link rel="stylesheet" type="text/css" href="js/esri/dijit/css/InfoView.css"> */

dojo.declare("esri.dijit.InfoView", null, {
  /********************
   * Internal Properties
   ********************/
  _items: [],
  
  //_node: null,
  
  _top: null,
  
  _sections: [],
  
  _isDecelerate: false,
  
  /********************
   * Constructor
   ********************/
  constructor: function(params, containerId) {
    this.container = dojo.byId(containerId);
    
    // instantiate a _TouchBase object
    this._touchBase = esri.dijit._TouchBase(this.container, null);
    
    // create sliding container as the first child of the container
    this._slideDiv = dojo.create('div', null, this.container, "first");

    // events
    this.events = [
    ];

    //store passing params
    this._items = params.items;
    
    if (params.sections) {
      this._sections = params.sections;
    }
    // set div class
    //this.container.setAttribute((document.all ? 'className' : 'class'), "esriMobileInfoView");
    dojo.addClass(this.container,"esriMobileInfoView");
    
    // create an inner div as container holder
    //var innerDiv = dojo.create("div",{}, this._slideDiv);
    
    if (this._sections.length === 0) {
      dojo.create("div", {
        //"class": "esriMobileInfoViewSection"
      }, this._slideDiv);
    }
    else {
      for (var i = 0; i < this._sections.length; i++)
      {
        var sectionDiv = dojo.create("div", {
          "class": "esriMobileInfoViewSection"
        }, this._slideDiv);
        
        dojo.create("div", {
          innerHTML: this._sections[i].title
        }, sectionDiv);
      }
    }
    for (var i= 0; i < this._items.length; i++)
    {
      var node, div;
      
      var section = 0;
      if (this._items[i].section) {
        section = this._items[i].section;
      }
      
      switch (this._items[i].type) {
        /*
        case "img":
          div = dojo.create("div", {
            "class": "esriMobileInfoViewItem",
            style: this._items[i].style
          }, this._slideDiv.childNodes[section]);
          
          node = dojo.create("img", {
            src: this._items[i].src,
            style: {width:"100%", height:"100%"}
          }, div);
          break;
        
        case "span":
          div = dojo.create("div", {
            "class": "esriMobileInfoViewItem",
            style: this._items[i].style
          }, this._slideDiv.childNodes[section]);
          
          node = dojo.create("span", {innerHTML:this._items[i].text}, div);
          break;
        */
      
        case "div":
          div = dojo.create("div", {
            "class": "esriMobileInfoViewItem",
            style: this._items[i].style
          }, this._slideDiv.childNodes[section]);
          
          node = dojo.create('div', {innerHTML: this._items[i].text}, div);
          break;
      }
      
      if (this._items[i].className) {
        dojo.addClass(node, this._items[i].className);
      }
      
      node._index = i;
      node._item = this._items[i];
      
      this._items[i]._node = node;
      

    }
    
    this.startTouchY = 0;
    //this._animateTo(0);
    
  },
  
  /********************
   * Public Methods
   ********************/
  startup: function() {
    this.onCreate(this._items);
    //this.startTouchY = 0;
    this._animateTo(0);
  },
  
  destroy: function() {
    //disconnect all events
    dojo.forEach(this.events, dojo.disconnect);
    
    //remove objects created
    this._touchBase = null;
    
    //remove added attributes
    dojo.query("img", this.container).forEach(function(node){
      node._index = null;
      node._item = null;
      dojo.destroy(node);
      node = null;
    });
    
    //release references to objects passed in the constructor
    this._items = null;
    
    //destroy dom node and child nodes
    dojo.destroy(this._slideDiv);
    dojo.destroy(this.container);
    this.container = this._slideDiv = null;
  },
  
  getItems: function() {
    return this._items;
  },
  
  setPreventDefault: function(value) {
    this._touchBase.setPreventDefault(value);
  },
  
  enableTouchScroll: function() {
    this._touchBase.setPreventDefault(true);
    this.events.push(dojo.connect(this._touchBase, 'onTouchStart', this, this._onTouchStartHandler));
    this.events.push(dojo.connect(this._touchBase, 'onTouchMove', this, this._onTouchMoveHandler));
    this.events.push(dojo.connect(this._touchBase, 'onTouchEnd', this, this._onTouchEndHandler));
    
    this._slideDiv.style.webkitTransform = 'translate3d(0,' + this._top + 'px, 0)';
  },
  
  disableTouchScroll: function() {
    dojo.disconnect(this.events.pop());
    dojo.disconnect(this.events.pop());
    dojo.disconnect(this.events.pop());
    this._touchBase.setPreventDefault(false);
    
    this._slideDiv.style.webkitTransform = 'translate3d(0, 0px, 0)';
  },
  
  animateTo: function() {
    this._slideDiv.style.WebkitTransitionDuration = "0s";
    this._animateTo(0);
  },
  
  /********************
   * Events
   ********************/  
  onSelect: function(item){},
  
  onUnSelect: function(item){},
  
  onCreate: function(items){
  },
  
  onClick: function(e){},
  
  onSwipeLeft: function(){},
  
  onSwipeRight: function(){},
  
  /********************
   * Internal Methods
   ********************/   
 _onTouchStartHandler: function(e){
    this._slideDiv.style.WebkitTransitionDuration = "0s";

    this._moveDirection = null;
    this._startTime = new Date();
    
    this.startTouchY = e.touches[0].clientY;
    this.contentStartOffsetY = this.contentOffsetY;
    //if (!this._top) {
    //  this._top = 0;
    //}
  },
  
  _onTouchMoveHandler: function(e){
    // detect move direction
    if (!this._moveDirection) {
      if (Math.abs(e.curY) > Math.abs(e.curX)) {
        this._moveDirection = "vertical";
    }
      else {
        this._moveDirection = "horizontal";
      }
    }
        
    if (this._moveDirection === "horizontal") {
      return;
    }
    else if (this._moveDirection === "vertical") {
      var currentY = e.touches[0].clientY;
      var deltaY = currentY - this.startTouchY;
      var newY = deltaY + this.contentStartOffsetY;

      this._animateTo(newY);
    }
  },
  
  _onTouchEndHandler: function(e){
    this._endTime = new Date();
    this._deltaMovement = e.curY;

    if (this._moveDirection === "vertical") {
      if (this._shouldStartMomentum()) {
        this._doMomentum();
      }
      else {
        this._snapToBounds();
      }
    }
    else if (this._moveDirection === "horizontal") {
      if (e.swipeDirection === "left") {
        this.onSwipeLeft();
      }
      else if (e.swipeDirection === "right") {
        this.onSwipeRight();
      }
    }
  },
  
  _shouldStartMomentum: function() {
    this._diff = this._endTime - this._startTime;
    this._velocity = this._deltaMovement/this._diff;
    
    if (Math.abs(this._velocity) > 0.2 && this._diff < 200) {
      return true;
    }
    else {
      return false;
    }
  },
  
  _pullToStop: function(delta) {
    
    if (Math.abs(delta) > 80) {
      delta = delta > 0 ? 80: (-contentBox.h + parentBox.h - 10) -80;
    }
    console.log(delta);
    
    this._slideDiv.style.webkitTransition = '-webkit-transform 200ms cubic-bezier(0, 0, 1, 1)';
    
    var callback = dojo.connect(this._slideDiv, "webkitTransitionEnd", this, function(){
      if (delta > 0) {
        this._animateTo(0);
      }
      else {
        this._animateTo(-contentBox.h + parentBox.h - 10);
      }
      dojo.disconnect(callback);
    });
    
    this._animateTo(delta);
  },
  
  _doMomentum: function() {
    var contentBox = dojo.contentBox(this.container);
    var acceleration = this._velocity < 0 ? 0.001: -0.001;
    var displacement = - (this._velocity * this._velocity) / (2 * acceleration);
    var time = - this._velocity / acceleration;
    
    //var flickingTF = [0, 0.3, 0.6, 1];
    //var snapBackTF = [0.4, 0, 1, 1];
    
    // X(t) = ax * t ^ 3 + bx * t ^ 2 + cx * t + x0
    // x1 = x0 + cx / 3
    // x2 = x1 + (cx + bx) / 3
    // x3 = x0 + cx + bx + ax
    
    var p0 = {x:0.0, y:0.0};
    var p1 = {x:0.0, y:0.3};
    var p2 = {x:0.6, y:1.0};
    var p3 = {x:1.0, y:1.0};
    var cx = 3 * (p1.x - p0.x);
    var bx = 3 * (p2.x - p1.x) - cx;
    var ax = p3.x - p0.x - cx - bx;
    var cy = 3 * (p1.y - p0.y);
    var by = 3 * (p2.y - p1.y) - cy;
    var ay = p3.y - p0.y - cy - by;
    var temp = 0, time1 = 0;
    
    if (contentBox.h > this._slideDiv.scrollHeight) {
      this.contentOffsetY = 0;
      time1 = 300;
    }
    else if (this.contentOffsetY + displacement > 0) {
      for (var i = 0, il = Math.floor(time/20); i < il; i++ ) {
        temp = (ax * (i * 20)  ^ 3) + (bx * (i * 20) ^ 2) + cx * (i * 20) + p0.x;
        temp = this._velocity < 0 ? -temp: temp;
        
        if (this.contentOffsetY + temp > 0) {
          time1 = i * 20;
          break;
        }
      }
      
      if (time1 === 0) {
        time1 = 300;
      }
      this.contentOffsetY = 0; 
    }
    else if (Math.abs(this.contentOffsetY + displacement) + contentBox.h > this._slideDiv.scrollHeight) {
      this.contentOffsetY = contentBox.h - this._slideDiv.scrollHeight;
      for (var i = 0, il = Math.floor(time/20); i < il; i++ ) {
        temp = (ax * (i * 20)  ^ 3) + (bx * (i * 20) ^ 2) + cx * (i * 20) + p0.x;
        temp = this._velocity < 0 ? -temp: temp;
        
        if (Math.abs(this.contentOffsetY + temp) > this._slideDiv.scrollHeight) {
          time1 = i * 20;
          break;
        }
      }
    }
    else {
      time1 = time;
      this.contentOffsetY = this.contentOffsetY + displacement;
    }
    
    this._slideDiv.style.webkitTransition = '-webkit-transform ' + time1 + 'ms cubic-bezier(0, 0.3, 0.6, 1)';
    this._animateTo(this.contentOffsetY);
  },
  
  _snapToBounds: function() {
    var contentBox = dojo.contentBox(this.container);
    
    if (contentBox.h > this._slideDiv.scrollHeight) {
      this.contentOffsetY = 0;
    }
    else if (this.contentOffsetY > 0) {
      this.contentOffsetY = 0;
    }
  
    else if (Math.abs(this.contentOffsetY) + contentBox.h > this._slideDiv.scrollHeight) {
      this.contentOffsetY = contentBox.h - this._slideDiv.scrollHeight;
    }
  
    this._slideDiv.style.WebkitTransitionDuration = "0.5s";
    this._animateTo(this.contentOffsetY);
  },
  
  _animateTo: function(offsetY) {
    this.contentOffsetY = offsetY;
    this._slideDiv.style.webkitTransform = 'translate3d(0, ' + offsetY + 'px, 0)';
  },
  
  _stopMomentum: function() {
    if (this._isDecelerating()){
      var style = document.defaultView.getComputedStyle(this._slideDiv, null);
      var transform = new WebKitCSSMatrix(style.webkitTransform);
      this._slideDiv.style.webkitTransition = '';
      this.animateTo(transform.m42);
    }
  },
  
  _isDecelerating: function() {
    if (this.isDecelerate) {
      return true;
    }
    else {
      return false;
    }
  },
  
  _toggleNode: function(imageNode, item) {
    if (item.toggleState === 'ON') {
      item.toggleState = 'OFF';
      if (item.src) {
        imageNode.src = item.src.toString();
      }

      this.onUnSelect(item);
    }
    else {
      item.toggleState = 'ON';
        if (item.srcAlt) {
          imageNode.src = item.srcAlt;
        }

      this.onSelect(item);
    }
    
  }

});

});
