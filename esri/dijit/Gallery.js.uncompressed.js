//>>built
// wrapped by build app
define("esri/dijit/Gallery", ["dijit","dojo","dojox","dojo/require!esri/dijit/_TouchBase"], function(dijit,dojo,dojox){
dojo.provide("esri.dijit.Gallery");

dojo.require("esri.dijit._TouchBase");

/* Load the css from the html page */
/* <link rel="stylesheet" type="text/css" href="js/esri/mobile/css/Gallery.css"> */

dojo.declare("esri.dijit.Gallery", null, {
 
  /********************
   * Public Properties
   ********************/
  container: null,
  
  /********************
   * Internal Properties
   ********************/
  _items: [],
  
  _currentIndex: 0,
  
  _left: 0,
  
  _offset: 10,
  
  _slideDiv: null,
  
  _thumbnailStyle: "default",
  
  _focusedIndex: null,
  
  _selectedIndex: -1,
  
  _slideStep: 1,
  
  _showTitle: true,
  
  /********************
   * Constructor
   ********************/
  constructor: function(params, containerId) {
    this.container = dojo.byId(containerId);
    
    // instantiate a _TouchBase object
    this._touchBase = esri.dijit._TouchBase(this.container, null);
    
    // create sliding container as the first child of the container
    this._slideDiv = dojo.create('div', {"class":"slideContainer"}, this.container, "first");
    
    // conntect _TouchBase events to handlers
    this.events = [
      dojo.connect(this._touchBase, 'onTouchStart', this, this._onTouchStartHandler),
      dojo.connect(this._touchBase, 'onTouchMove', this, this._onTouchMoveHandler),
      dojo.connect(this._touchBase, 'onTouchEnd', this, this._onTouchEndHandler),
      dojo.connect(this._touchBase, 'onclick', this, this._onClickHandler)
    ];
    
    //handle resize
    this._resizeHandle = dojo.connect(window, "onorientationchange", dojo.hitch(this, this._onResizeHandler));
    
    //store passing params
    this._items = params.items;
        
    if (params.thumbnailStyle && params.thumbnailStyle == "small") {
        this._thumbnailStyle = "small";
        this._offset = 4;
        this._slideStep = 3;
        this._thumbnailWidth = 100;
    }
    else {
      this._thumbnailStyle = "default"
      this._offset = 10;
      this._slideStep = 1;
      this._thumbnailWidth = 200;
    }
    
    if (params.showTitle == false) {
      this._showTitle = false;
    }
    
    this.container.setAttribute((document.all ? 'className' : 'class'), "esriMobileGallery");
    
    var columnHeight, height;
    
    // init gallery
    for (var i = 0; i < this._items.length; i++)
    {
      var div, divTitle, divMoreInfo, img;
      
      div = dojo.create("div", {
        "class": "thumbnailcontainer"
      }, this._slideDiv);
      
      // create img element and append to _slideDiv
      img = dojo.create("img", {
          "class": "thumbnail",
          src: this._items[i].thumbnailUrl
      }, div);

      img._index = i;
      img._item = this._items[i];
        
      divTitle = dojo.create("div", {
        "class": "title",
        "innerHTML": this._items[i].title
      }, div);
      
      divMoreInfo = dojo.create("div", {
        "class": "title"
      }, div);
      
      if (this._thumbnailStyle == "small") {
        dojo.addClass(div, "small");
        dojo.addClass(img, "small");
        dojo.addClass(divTitle, "small");
        dojo.addClass(divMoreInfo, "small");
        dojo.addClass(this._slideDiv, "small");
      }

      if (!this._showTitle) {
        divTitle.style.display = "none";
      }
      
      height = dojo.contentBox(div).h;
      
      if (!columnHeight) {
        columnHeight = height;
      }
      
      if (height > columnHeight) {
        columnHeight = height;
      }
      
    }
    
    for(var i = 0; i < this._slideDiv.childNodes.length; i++) {
      dojo.contentBox(this._slideDiv.childNodes[i], {h: columnHeight});
    }
    
    // set thumbnail container width
    this._thumbnailWidth = dojo.contentBox(this._slideDiv.childNodes[0]).w;
    
    // need to calculate margin box 
    this._slideDiv.style.width = this._items.length * (this._thumbnailWidth + this._offset) + 'px';
    
    // safely add css class
    if (window.orientation)
    {
      if (window.orientation == 90 || window.orientation == -90) {
        dojo.addClass(this.container, "galleryLandscape");
      }
    }
    
    //automatically calculate slidestep and div margin
    this._calculateSlideStep();
    
  },
  
  /********************
   * Public Methods
   ********************/
  startup: function() {
    //fire event for the first focused item
    this._focusedIndex = 0;
    
    this.onFocus(this._items[this._focusedIndex]);
  },
  
  destroy: function() {
    //disconnect all events
    dojo.forEach(this.events, dojo.disconnect);
    dojo.disconnect(this._resizeHandle);
    
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
  
  setFocus: function(item) {
    if (!item) {
      return;
    }
    
    //perform a focus on the item passed
    for(var i=0, il=this._items.length; i < il; i++){
      if (this._items[i] == item) {
        //call internal _setFocus
        this._setFocus(i);
        
        //fire event
        this.onFocus(this._items[this._focusedIndex]);
      }  
    }
  },
  
  select: function(item) {
    if (!item) {
      return;
    }

    // perform a select based on the item passed
    for(var i=0, il=this._items.length; i < il; i++){
      if (this._items[i] == item) {
        
        if (this._selectedIndex != -1) {
          this.onUnSelect(this._items[this._selectedIndex]);
        }
        
        this._select(i);
        
        //fire onSelect event and hide lower level click event
        this.onSelect(this._items[this._selectedIndex]);
        
        break;
      }  
    }
  },
  
  getFocusedItem: function() {
    //return focused item
    return this._items[this._focusedIndex];
  },
  
  getSelectedItem: function() {
    //return selected item
    return this._items[this._selectedIndex];
  },
  
  next: function() {
    // set focus on next item and fire onFocus event
    this._next();
    this._startTransition();
    
    //fire event
    this.onFocus(this._items[this._currentIndex]);
  },

  previous: function() {
    // set focus on previous item and fire onFocus event
    this._previous();
    this._startTransition();
    
    //fire event
    this.onFocus(this._items[this._currentIndex]);
  },
  
  getTitleNode: function(item) {
    if (!item) {
      return;
    }

    // perform a select based on the item passed
    for(var i=0, il=this._items.length; i < il; i++){
      if (this._items[i] == item) {
        return this._slideDiv.childNodes[i].childNodes[1]
        break;
      }  
    }    
  },
  
  getInfoNode: function(item) {
    if (!item) {
      return;
    }

    // perform a select based on the item passed
    for(var i=0, il=this._items.length; i < il; i++){
      if (this._items[i] == item) {
        return this._slideDiv.childNodes[i].childNodes[2]
        break;
      }  
    }    
  },
  
  showTitle: function(item) {
    if (!item) {
      return;
    }

    // perform a select based on the item passed
    for(var i=0, il=this._items.length; i < il; i++){
      if (this._items[i] == item) {
        this._slideDiv.childNodes[i].childNodes[1].style.display = "block";
        
        break;
      }  
    }    
  },
  
  hideTitle: function(item) {
    if (!item) {
      return;
    }

    // perform a select based on the item passed
    for(var i=0, il=this._items.length; i < il; i++){
      if (this._items[i] == item) {
        this._slideDiv.childNodes[i].childNodes[1].style.display = "none";
        
        break;
      }  
    }    
  },  
  
  /********************
   * Events
   ********************/  
  onFocus: function(item){},
  
  onSelect: function(item){},
  
  onUnSelect: function(item){},
  
  /********************
   * Internal Methods
   ********************/
  _onClickHandler: function(e) {
    // fire event only on HTMLImageElement 
    if (e.target instanceof HTMLImageElement) {
      var index = e.target._index;
      
      if (this._selectedIndex != -1) {
        this.onUnSelect(this._items[this._selectedIndex]);
      }
      
      this._select(index);
      
      //fire onSelect event and hide lower level click event
      this.onSelect(this._items[this._selectedIndex]);
    }
  },
  
  _onTouchStartHandler: function(e) {
    this._moveDirection = null;
    
    this._left = this._currentIndex * (-(this._thumbnailWidth) - this._offset) ;
    
    // reset Duration to 0
    this._slideDiv.style.WebkitTransitionDuration = "0s";
  },
  
  _onTouchMoveHandler: function(e) {
    // detect move direction
    if (!this._moveDirection) {
      if (Math.abs(e.curY) > Math.abs(e.curX)) {
        this._moveDirection = "vertical";
    }
      else {
        this._moveDirection = "horizontal";
      }
    }
        
    if (this._moveDirection == "vertical") {
      if (!this._touchBase._preventDefault == false) {
        this._touchBase._preventDefault = false;
      }
      return;
    }
    else if (this._moveDirection == "horizontal") {
      if (!this._touchBase._preventDefault) {
        this._touchBase._preventDefault = true; 
      }
    
      var currentVal = this._left + e.curX;
    
      this._slideDiv.style.webkitTransform = 'translate3d(' + currentVal + 'px, 0, 0)';
    }
  },
  
  _onTouchEndHandler: function(e) {
    var index = this._currentIndex;
    
    // set transition Duration
    this._slideDiv.style.WebkitTransitionDuration = "0.5s";
    
    if (e.swipeDirection == 'left') {
      this._next();
    }
    else if (e.swipeDirection == 'right')
    {
      this._previous();
    }

    this._left = this._currentIndex * (-(this._thumbnailWidth) - this._offset) ;
    this._slideDiv.style.webkitTransform = 'translate3d(' + this._left + 'px, 0, 0)';
    
    //fire event
    if (index != this._currentIndex) {
      this.onFocus(this._items[this._currentIndex]);
    }
  },
  
  _onResizeHandler: function(e) {
    var orientation = window.orientation;
    switch(orientation) {
    case 0:
      dojo.removeClass(this.container, "galleryLandscape");
      break;
      
    case 90:
    case -90:
      dojo.addClass(this.container, "galleryLandscape");
      break;
    }
    
    this._calculateSlideStep();
  },
  
  _startTransition: function() {
    this._slideDiv.style.WebkitTransitionDuration = "0.5s"; 
    this._left = this._currentIndex * (-(this._thumbnailWidth) - this._offset);
    this._slideDiv.style.webkitTransform = 'translate3d(' + this._left + 'px, 0, 0)';
  },
  
  _markUnSelected: function(imageNode) {
    dojo.removeClass(imageNode, "selected");
    dojo.removeClass(imageNode.parentNode, "selected");
    dojo.removeClass(imageNode.parentNode.childNodes[1], "selected");
    dojo.removeClass(imageNode.parentNode.childNodes[2], "selected");
  },
  
  _markSelected: function(imageNode) {
    //dojo.query("img", this.container).forEach(function(node){
    //});
    dojo.addClass(imageNode, "selected");
    dojo.addClass(imageNode.parentNode, "selected");
    dojo.addClass(imageNode.parentNode.childNodes[1], "selected");
    dojo.addClass(imageNode.parentNode.childNodes[2], "selected");
  },
  
  _next: function() {
    if (this._currentIndex + this._slideStep < this._items.length) {
      this._currentIndex += this._slideStep;
      
      this._focusedIndex = this._currentIndex;
    }
  },
  
  _previous: function() {
    if (this._currentIndex - this._slideStep >= 0) {
      this._currentIndex -= this._slideStep;
    }
    
    this._focusedIndex = this._currentIndex;
  },
  
  _setFocus: function(index) {
    this._focusedIndex = index;
    
    this._currentIndex = Math.floor(index/this._slideStep) * this._slideStep;
    this._startTransition();
  },
  
  _select: function(index) {
    if (this._selectedIndex != -1) {
      this._markUnSelected(this._slideDiv.childNodes[this._selectedIndex].childNodes[0]);
    }
    
    this._selectedIndex = index;
    this._markSelected(this._slideDiv.childNodes[this._selectedIndex].childNodes[0]);
  },
  
  _calculateSlideStep: function() {
    var contentBox = dojo.contentBox(this.container);
    
    var step = Math.floor((contentBox.w + this._offset)/(this._thumbnailWidth + this._offset));
    
    if (step >= 1) {
      var remainder = contentBox.w - (this._thumbnailWidth + this._offset)*step;
      
      if (remainder > 0) {
        this._slideDiv.style.marginLeft = Math.floor(remainder/2) + 'px';
      }
      else {
        this._slideDiv.style.marginLeft = '0px';
      }
       
      this._slideStep = step;
    }
    else {
      this._slideStep = 1; 
    }
    if (this._selectedIndex != -1) {
      this._setFocus(this._selectedIndex);
    }
    else {
      this._setFocus(this._focusedIndex);
    }
    
  }

});

});
