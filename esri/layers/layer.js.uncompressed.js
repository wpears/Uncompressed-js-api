//>>built
// wrapped by build app
define("esri/layers/layer", ["dijit","dojo","dojox","dojo/require!esri/utils"], function(dijit,dojo,dojox){
dojo.provide("esri.layers.layer");

dojo.require("esri.utils");

dojo.declare("esri.layers.Layer", null, {
    constructor: function(/*String*/ url, /*Object?*/ options) {
      //summary: Creates a new Layer that can be added onto a map
      // url: String: Url to resource to display layer on map
      // options: Object?: Initial options for layer
      //        : id: String: Layer id to assign to this layer. If not assigned, will be assigned by esri.Map
      //        : visible: boolean: Initial visibility of layer
      //        : opacity: double: Initial opacity of layer

      // TEST
      // Need to add test cases for the various url-options scenarios 
      // handled here:
      //  TiledLayer(url)
      //  TiledLayer(url, options)
      //  DynamicLayer(url)
      //  DynamicLayer(url, options)
      //  GraphicsLayer()
      //  GraphicsLayer(options)
      //  VETiledLayer()
      //  VETiledLayer(options)
      //  OSM()
      //  OSM(options)
      //  WMS()
      //  WMS(options)
      //  FeatureLayer(url)
      //  FeatureLayer(url, options)
      //  FeatureLayer(featureCollection)
      //  FeatureLayer(featureCollection, options)

      //members to be used by inheriting classes
      if (url && dojo.isString(url)) {
        this._url = esri.urlToObject(this.url = url);
      }
      else {
        this.url = (this._url = null);
        //assuming the options specified instead of url (for example: Graphics Layer & VETiledLayer)
        options = options || url;
        
        // NOTE
        // new FeatureLayer(featureCollection):
        // This will result in options pointing to
        // the collection object. Let's check.
        if (options && options.layerDefinition) {
          options = null;
        }
      }

      this._map = this._div = null;
      this.normalization = true;

      if (options) {
        if (options.id) {
          this.id = options.id;
        }
        if (options.visible === false) {
          this.visible = false;
        }
        if (options.opacity !== undefined) {
          this.opacity = options.opacity;
        }
      }
      
      this._errorHandler = dojo.hitch(this, this._errorHandler);
    },

    //id: String: Id of layer as specified by user or set when added to map
    id: null,
    //visible: boolean: Whether layer is currently visible
    visible: true,
    // //opacity: double (0-1): Opacity of layer
    // opacity: 1,
    //loaded: boolean: True if layer has been loaded, else false
    loaded: false,

    //PRIVATE METHODS

    // _opacityChangeHandler: function(/*Number*/ value) {
    //   //summary: Method to handle changing opacity on a layer
    //   // var djs = dojo.style;
    //   // dojo.forEach(this._div.childNodes, function(node) {
    //   //   djs(node, "opacity", value);
    //   // });
    //   dojo.style(this._div, "opacity", value);
    // },
    
    _errorHandler: function(err) {
      this.onError(err);
    },

    //METHODS TO BE OVERRIDDEN BY INHERITING CLASSES
    _setMap: function(/*esri.Map*/ map, /*HTMLElement*/ divContainer, /*Number*/ index, /*Object*/ lod) {
      //summary: The _setMap is called by the map when the layer successfully completes
      //loads and fires the onLoad event, or isLoaded is true when calling map.addLayer.
      // map: esri.Map: Map within which layer is added
      // divContainer: HTMLElement: Div whose child this._div is to be added
      // index: Number: Index of layer in map
      // lod: Object: Map base layer's Level Of Detail (only if base layer is ArcGISTiledMapServiceLayer)
      // returns: HTMLElement: Reference to this._div
    },

    _unsetMap: function(/*esri.Map*/ map, /*HTMLElement*/ container) {
      //summary: The _unsetMap is called by the map when the layer is to be removed
    },

    _cleanUp: function() {
      //summary: Disconnect all mouse event
      this._map = this._div = null;
    },
  
    _fireUpdateStart: function() {
      if (this.updating) {
        return;
      }
      this.updating = true;
      this.onUpdateStart();
      
      // Notify map
      if (this._map) {
        this._map._incr();
      }
    },
    
    _fireUpdateEnd: function(error, info) {
      this.updating = false;
      this.onUpdateEnd(error, info);
      
      // Notify map
      if (this._map) {
        this._map._decr();
      }
    },
    
    _getToken: function() {
      var url = this._url, crd = this.credential;
      
      // TODO
      // If credential.token has expired, initiate token refresh
      
      // 1. Note that url.query.token is looked at first
      // 2. this.credential will be available if the sub-classes called
      //    _findCredential after they are loaded.
      // 3. Also note that reading directly from the "credential" object 
      //    ensures token freshness
      return (url && url.query && url.query.token) || (crd && crd.token) || undefined;
    },
    
    _findCredential: function() {
      this.credential = esri.id && this._url && esri.id.findCredential(this._url.path);
    },
    
    _useSSL: function() {
      var urlObject = this._url, re = /^http:/i, rep = "https:";
      
      if (this.url) {
        this.url = this.url.replace(re, rep);
      }
      
      if (urlObject && urlObject.path) {
        urlObject.path = urlObject.path.replace(re, rep);
      }
    },
    
    refresh: function() {
      //to be implemented by children
    },

    //PUBLIC METHODS
    show: function() {
      //summary: Show layer
      this.setVisibility(true);
    },

    hide: function() {
      //summary: Hide layer
      this.setVisibility(false);
    },
  
    // For internal use at this point. Used by
    // overview map widget and intended for 
    // tiled and vetiled layers
    // Have to think about implications with
    // respect to toJson pattern. How it fits
    // in the presence of cache manager.
    getResourceInfo: function() {
      // It is the layer's responsibility to
      // set resourceInfo
      // See VETiledLayer.js::_initLayer and
      // agstiled.js::_initLayer
      var info = this.resourceInfo;
      return dojo.isString(info) ? dojo.fromJson(info) : dojo.clone(info);
    },
    
    setNormalization: function(/*Booelan*/ enable) {
      this.normalization = enable;
    },
    
    setVisibility: function(/*boolean*/ v) {
      if (this.visible !== v) {
        this.visible = v;
        this.onVisibilityChange(this.visible);
      }
    },

    // setOpacity: function(/*double*/ o) {
    //   //summary: Set layer's opacity as displayed in map
    //   // o: double: Opacity, in range 0-1.
    //   if (this.opacity != o) {
    //     this.opacity = o;
    //     this.onOpacityChange(this.opacity);
    //   }
    // },

    //LAYER EVENTS
    onLoad: function() {
      //summary: When layer is loaded
      // arguments[0]: esri.layers.Layer: This layer
    },

    onVisibilityChange: function() {
      //summary: When visibility of layer is changed
      // arguments[0]: boolean: Layer's visibility
    },

    // onOpacityChange: function() {
    //   //summary: When opacity of layer is changed
    //   // arguments[0]: Number: New opacity value
    // },
    
    onUpdate: function() {
      // DEPRECATED AT v2.0
      //summary: Event fired when the layer has been updated. Usually fired
      //         when the layer has finished loading all images. This event
      //         should not be confused with the onLoad which is fired when
      //         the layer finishes loading.
    },

    onUpdateStart: function() {},
    onUpdateEnd: function(/*Error?*/) {},
    
    onError: function() {
      //summary: Error: Event fired whenever there is an error
    }
  }
);

});
