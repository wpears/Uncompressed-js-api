//>>built
// wrapped by build app
define("esri/dijit/NavigationBar", ["dijit","dojo","dojox","dojo/require!esri/dijit/_TouchBase"], function(dijit,dojo,dojox){
dojo.provide("esri.dijit.NavigationBar");

dojo.require("esri.dijit._TouchBase");

/* Load the css from the html page */
/* <link rel="stylesheet" type="text/css" href="js/esri/mobile/css/NavigationBar.css"> */

dojo.declare("esri.dijit.NavigationBar", null, {
  /********************
   * Internal Properties
   ********************/
  _items: [],
  
  /********************
   * Constructor
   ********************/
  constructor: function(params, containerId) {
    this.container = dojo.byId(containerId);
    
    // instantiate a _TouchBase object
    this._touchBase = esri.dijit._TouchBase(this.container, null);
    
    // create sliding container as the first child of the container
    this._slideDiv = dojo.create('div', {}, this.container, "first");

    // events
    this.events = [
      dojo.connect(this._touchBase, 'onclick', this, this._onClickHandler)
    ];

    //store passing params
    this._items = params.items;
    
    // set div class
    //this.container.setAttribute((document.all ? 'className' : 'class'), "esriMobileNavigationBar");
    dojo.addClass(this.container,"esriMobileNavigationBar");
    
    // create an inner div as container holder
    var innerDiv = dojo.create("div",{}, this._slideDiv);
    
    // init
    for (var i = 0; i < this._items.length; i++)
    {
      var node, div;
      switch (this._items[i].type) {
        case "img":
          div = dojo.create("div", {
            "class": "esriMobileNavigationItem"
            //style: this._items[i].style
          }, innerDiv);
          
          node = dojo.create("img", {
            src: this._items[i].src.toString(),
            style: {width:"100%", height:"100%"}
          }, div);
          break;
        
        case "span":
          div = dojo.create("div", {
            "class": "esriMobileNavigationItem"
            //style: this._items[i].style
          }, innerDiv);
          
          node = dojo.create("span", {innerHTML:this._items[i].text}, div);
          break;
          
        case "div":
          div = dojo.create("div", {
            "class": "esriMobileNavigationInfoPanel"
            //style: this._items[i].style
          }, innerDiv);
          
          //div.innerHTML = this._items[i].text;
          //alert(div.innerHTML);
          node = dojo.create('div', {innerHTML: this._items[i].text}, div);

          break;
          
      }
      
      dojo.addClass(div, this._items[i].position);
      
      if (this._items[i].className) {
        dojo.addClass(node, this._items[i].className);
      }
            
      node._index = i;
      node._item = this._items[i];
      
      this._items[i]._node = node;
    }
    
  },
  
  /********************
   * Public Methods
   ********************/
  startup: function() {
    this.onCreate(this._items);
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
  
  select: function(item) {
    this._markSelected(item._node, item);
  },
  
  /********************
   * Events
   ********************/  
  onSelect: function(item){},
  
  onUnSelect: function(item){},
  
  onCreate: function(items){
  },
  
  /********************
   * Internal Methods
   ********************/  
  _onClickHandler: function(e) {
    //if (esri.isiPhone) {
    //  window.scrollTo(0, 0);
    //}
    
    //IE complains about HTMLImageElement
    // fire event only on HTMLImageElement - 
    // if (e.target instanceof HTMLImageElement) {
     if(e.target.tagName.toLowerCase() === 'img'){
      var img = e.target;
      var index = img._index;
      var item = img._item;

      dojo.query("img", this.container).forEach(function(node){
        if (node !== img && node._item.toggleGroup === item.toggleGroup) {
          this._markUnSelected(node, node._item);
        }
      }, this);
      
      this._toggleNode(img, item);
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
    
  },
  
  _markSelected: function(imageNode, item) {
    item.toggleState = 'ON';
    
    if (item.srcAlt) {
      imageNode.src = item.srcAlt;
    }
    this.onSelect(item);
  },
  
  _markUnSelected: function(imageNode, item) {
    if (item.toggleState === 'ON') {
      item.toggleState = 'OFF';
    
      if (item.src) {
        imageNode.src = item.src.toString();
      }
      this.onUnSelect(item);
    }
  }

});

});
