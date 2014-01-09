//>>built
// wrapped by build app
define("esri/InfoWindowBase", ["dijit","dojo","dojox","dojo/require!dijit/_base/manager"], function(dijit,dojo,dojox){
dojo.provide("esri.InfoWindowBase");

dojo.require("dijit._base.manager");

/**
 * Base class for InfoWindow implementation. It defines
 * the following:
 * - Defines what esri.Map expects from an InfoWindow.
 * - Provides implementation for some functionality that
 *   may be used by most implementations.
 * 
 * Sub-classes may define additional properties, methods
 * and events on top of what is defined by this base class.
 */
dojo.declare("esri.InfoWindowBase", null, {
  constructor: function() {
    var hitch = dojo.hitch;
    this.__set_title = hitch(this, this.__set_title);
    this.__err_title = hitch(this, this.__err_title);
    this.__set_content = hitch(this, this.__set_content);
    this.__err_content = hitch(this, this.__err_content);
  },

  /*************
   * Properties
   *************/
  
  /*
   * isShowing: <Boolean>
   * 
   * Return true if the info window is visible.
   * Else, return false.
   * 
   * domNode: <Object>
   * 
   * Return the HTML element where the info window
   * is rendered
   */
  
  /**********
   * Methods
   **********/
  
  setMap: function(map) {
    /*
     * This method will be called by the map (after the map has loaded) 
     * when this object is set as its info window.
     * 
     * Sub-classes can override this method to do more.
     */
    
    this.map = map;
  },
  
  unsetMap: function(map) {
    /*
     * This method will be called by the map when this object is no
     * longer the map's info window. This method will be called
     * when the map is destroyed, if this object is the map's info window
     * at the time of its destruction.
     * 
     * Sub-classes can override this method to do more.
     */
    
    delete this.map;
  },
  
  setTitle: function(/* title */) {
    /*
     * Set the given value as title for the info window.
     * 
     * Value can be one of the following:
     *   String
     *   DOM Node or DOM Node of a Dijit
     *   Instance of dojo.Deferred
     *   null or undefined (clear the current title)
     */
  },
  
  setContent: function(/* content */) {
    /*
     * Set the given value as the info window content.
     * 
     * Value can be one of the following:
     *   String
     *   DOM Node or DOM Node of a Dijit
     *   Instance of dojo.Deferred
     *   null or undefined (clear the current content)
     *   
     * Possible implementation variations:
     *
     * [1] Sub-class may choose to render title as integral
     * part of the content/body.
     * 
     * [2] Sub-class may choose to not make the content
     * visible by default. It can be shown (or animated-in) 
     * in response to user clicking on the title.
     */
  },
  
  show: function(/* location */) {
    /*
     * Make the info window visible - all or part of it. If displaying
     * partially, the rest of the UI can be displayed in response to 
     * user interaction.
     * 
     * Fire onShow event at the end of show logic.
     * 
     * "location" is an instance of esri.geometry.Point. If the location
     * contains spatialReference, then it is assumed to be in map 
     * coordinates. Else, it is assumed to be in screen coordinates.
     * Screen coordinates are measured in pixels from the top-left corner
     * of the map control. Map::toMap and Map::toScreen methods can be
     * used for conversion between map and screen coordinates.
     */
  },
  
  hide: function() {
    /*
     * Hide the info window completely.
     * 
     * Fire onHide event at the end of hide logic.
     */
  },
  
  resize: function(/* width, height */) {
    /*
     * Resize the info window to the given width and height (in pixels)
     */
  },
  
  /*********
   * Events
   *********/
  
  onShow: function() {
    /*
     * Fire this event after the info window becomes visible.
     */
  },
  
  onHide: function() {
    /*
     * Fire this event after the info window is hidden. 
     */
  },
  
  /*********************************
   * Helper Methods for Sub-Classes
   *********************************/
  
  place: function(/* String|DOM Node|null|undefined */ newValue, /* DOM Node */ parentNode) {
    if (esri._isDefined(newValue)) {
      if (dojo.isObject(newValue)) {
        dojo.place(newValue, parentNode, "only");
      }
      else {
        parentNode.innerHTML = newValue;        
      }
    }
    else {
      parentNode.innerHTML = "";
    }
  },
  
  startupDijits: function(/* DOM Node */ node) {
    this._processDijits(node);
  },
  
  destroyDijits: function(/* DOM Node */ node) {
    this._processDijits(node, true);
  },
  
  /*******************
   * Internal Methods
   *******************/

  _processDijits: function(node, destroy) {
    if (node && node.children.length === 1) {
      var child = node.children[0];
      if (child) {
        var widget = dijit.byNode(child);
        var widgets = widget ? [ widget ] : dijit.findWidgets(child);
        
        dojo.forEach(widgets, function(widget) {
          if (destroy) {
            if (widget._started && !widget._destroyed) {
              try {
                //console.log("destroy...", widget.id);
                if (widget.destroyRecursive) {
                  widget.destroyRecursive();
                }
                else if (widget.destroy) {
                  widget.destroy();
                }
              }
              catch (ex) {
                console.debug("An error occurred when destroying a widget embedded within InfoWindow: " + ex.message);
              }
            }
          } // destroy
          else {
            if (!widget._started) {
              try {
                //console.log("startup.....", widget.id);
                widget.startup();
              }
              catch (ex2) {
                console.debug("An error occurred when starting a widget embedded within InfoWindow: " + ex2.message);
              }
            }
          } // startup
        });
      } // child
    } // node
  },
  
  /*******************
   * Internal Methods
   *******************/
  
  /**
   * For internal use by out-of-the-box InfoWindow 
   * implementations only. I didn't want to define
   * another internal class to hold this implementation
   * just for out-of-the-box InfoWindows.
   */
  
  __registerMapListeners: function() {
    this.__unregisterMapListeners();
    //console.log("register");
    
    var map = this.map;
    this.__handles = [
      dojo.connect(map, "onPan", this, this.__onMapPan),
      dojo.connect(map, "onZoomStart", this, this.__onMapZmStart),
      dojo.connect(map, "onExtentChange", this, this.__onMapExtChg)
    ];
  },
  
  __unregisterMapListeners: function() {
    //console.log("UNregister");
    
    var handles = this.__handles;
    if (handles) {
      dojo.forEach(handles, dojo.disconnect, dojo);
      this.__handles = null;
    }
  },
  
  __onMapPan: function(extent, delta) {
    //console.log("pan");

    this.move(delta, true);
  },
  
  __onMapZmStart: function() {
    //console.log("zoom start");
    
    this.__mcoords = this.mapCoords || this.map.toMap(new esri.geometry.Point(this.coords));
    this.hide(null, true);
  },
  
  __onMapExtChg: function(extent, delta, levelChange) {
    //console.log("extent change");
    
    var map = this.map, mapPoint = this.mapCoords;
    if (mapPoint) {
      this.show(mapPoint, null /*map.getInfoWindowAnchor(map.toScreen(mapPoint))*/, true);
    }
    else {
      var screenPoint;
      if (levelChange) {
        screenPoint = map.toScreen(this.__mcoords);
      }
      else {
        // delta will not be available when map extent change event is fired
        // due to map resize
        screenPoint = this.coords.offset(
          (delta && delta.x) || 0, 
          (delta && delta.y) || 0
        );
      }
      this.show(screenPoint, null /*map.getInfoWindowAnchor(screenPoint)*/, true);
    }
  },
  
  __setValue: function(propertyName, newValue) {
    this[propertyName].innerHTML = "";
    
    // Cancel pending unfired deferred
    var dfd = "_dfd" + propertyName, pending = this[dfd];
    if (pending && pending.fired === -1) {
      //console.log("Cancelling...", pending);
      pending.cancel();
      this[dfd] = null;
      //console.log("cancelled.");
    }
    
    if (esri._isDefined(newValue)) { // we don't want to miss 0 or false
      if (newValue instanceof dojo.Deferred) {
        this[dfd] = newValue;
        newValue.addCallbacks(this["__set" + propertyName], this["__err" + propertyName]);
      }
      else {
        this.__render(propertyName, newValue);
      }
    }
  },
    
  __set_title: function(response) {
    //console.log("rendering title...");
    this._dfd_title = null;
    this.__render("_title", response);
  },
  
  __err_title: function(error) {
    //console.log("ERROR rendering title...", error);
    this._dfd_title = null;
  },
  
  __set_content: function(response) {
    //console.log("rendering content...");
    this._dfd_content = null;
    this.__render("_content", response);
  },
  
  __err_content: function(error) {
    //console.log("ERROR rendering content...", error);
    this._dfd_content = null;
  },
  
  __render: function(propertyName, newValue) {
    var node = this[propertyName];
    this.place(newValue, node);
    
    // If the infowindow is visible, startup widgets
    // right away.
    if (this.isShowing) {
      this.startupDijits(node);
    
      if (propertyName === "_title" && this._adjustContentArea) {
        this._adjustContentArea();
      }
    }
  }
});

});
