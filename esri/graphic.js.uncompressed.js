//>>built
// wrapped by build app
define("esri/graphic", ["dijit","dojo","dojox","dojo/require!esri/geometry,esri/symbol"], function(dijit,dojo,dojox){
dojo.provide("esri.graphic");

dojo.require("esri.geometry");
dojo.require("esri.symbol");

dojo.declare("esri.Graphic", null, {
    constructor: function(/*esri.geometry.Geometry|Object*/ json, /*esri.symbol.Symbol*/ symbol, /*HashMap*/ attributes, /*esri.InfoTemplate*/ infoTemplate) {
      //summary: Create a new Graphic object
      // geometry: esri.geometry.Geometry: Geometry to display
      // symbol: esri.symbol.Symbol: Symbol to render geometry
      // attributes: HashMap: Attributes object { key1:value1, key2:value2, ..., keyN, valueN }
      // info: esri.InfoTemplate: Info object ({ title:String, content:String }), defining formatting of attributes.

      if (json && ! (json instanceof esri.geometry.Geometry)) {
        this.geometry = json.geometry ? esri.geometry.fromJson(json.geometry) : null;
        this.symbol = json.symbol ? esri.symbol.fromJson(json.symbol) : null;
        this.attributes = json.attributes || null;
        this.infoTemplate = json.infoTemplate ? new esri.InfoTemplate(json.infoTemplate) : null;
      }
      else {
        this.geometry = json;
        this.symbol = symbol;
        this.attributes = attributes;
        this.infoTemplate = infoTemplate;
      }
    },

    // _shape: dojox.gfx.Shape: populated by esri.layers.GraphicsLayer
    _shape: null,

    // _graphicsLayer: esri.layers.GraphicsLayer: graphics layer in which this graphic is added
    _graphicsLayer: null,
    
    // _visible: Boolean: whether graphic is visible
    _visible: true,
    visible: true,

    getDojoShape: function() {
      //summary: Returns the dojox.gfx.Shape object, if currently displayed on esri.layers.GraphicsLayer
      // returns: dojox.gfx.Shape: Rendered dojo shape, else null
      return this._shape;
    },
    
    getLayer: function() {
      return this._graphicsLayer;
    },

    setGeometry: function(geometry) {
      this.geometry = geometry;
      var gl = this._graphicsLayer;
      if (gl) {
        //var type = geometry.type;
        gl._updateExtent(this);
        gl._draw(this, true);
      }
      return this;
    },

    setSymbol: function(symbol, /*Boolean?*/ _force) {
      // TODO
      // We may want to create a _getActiveSymbol on graphic or something like that
      var gl = this._graphicsLayer, shape = this._shape; //, renderer = gl && gl.renderer;
      //var prevSymbol = this.symbol || (renderer && renderer.getSymbol(this));
      this.symbol = symbol;
      if (symbol) {
        this.symbol._stroke = this.symbol._fill = null;
      }
      if (gl) {
        
        // See FeatureLayer::_repaint for when _force is used
        // TODO
        // This does not feel right but it works for now.
        // Need to do some code reorg in graphics layer to better
        // manage graphic rendering routines
        if (_force) {
          if (shape) {
            gl._removeShape(this);
          }
          gl._draw(this, true);
          return this;
        }
        
        if (!this.geometry) {
          return this;
        }
        
        var type = this.geometry.type;
        if (type === "point" || type === "multipoint") {
          // Invalidate shape if symbol type has changed
          // Or, incompatible style change for an SMS
          /*if (shape && prevSymbol && symbol) {
            var type1 = prevSymbol.type, type2 = symbol.type, circle = esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE;
            if (type1 !== type2 || (type1 === "simplemarkersymbol" && prevSymbol.style !== symbol.style && (prevSymbol.style === circle || symbol.style === circle))) {
              //console.log(type1, type2, prevSymbol.style, symbol.style);
              gl._removeShape(this);
            }
          }*/
          
          gl._draw(this, true);
        }
        else if (shape) {
          gl._symbolizeShape(this);
        }
      }
      
      return this;
    },

    setAttributes: function(/*Object*/ attributes) {
      this.attributes = attributes;
      return this;
    },

    setInfoTemplate: function(/*esri.InfoTemplate*/ infoTemplate) {
      this.infoTemplate = infoTemplate;
      return this;
    },
    
    _getEffInfoTemplate: function() {
      // Convenience method for internal use only.
      // Returns the effective info template applicable to
      // this graphic.
      // Returns: 
      // Instance of esri.InfoTemplate or null/undefined
      var layer = this.getLayer();
      return this.infoTemplate || (layer && layer.infoTemplate);
    },

    getTitle: function() {
      var template = this._getEffInfoTemplate();
      var title = template && template.title;
      
      if (dojo.isFunction(title)) {
        title = title.call(template, this);
      }
      else if (dojo.isString(title)) {
        var layer = this._graphicsLayer;
        var func = layer && layer._getDateOpts; // feature layer

        title = esri.substitute(this.attributes, title, {
          first: true,
          dateFormat: func && func.call(layer)
        });
      }
      
      return title;
    },

    getContent: function() {
      var template = this._getEffInfoTemplate();
      var content = template && template.content;
      
      if (dojo.isFunction(content)) {
        content = content.call(template, this);
      }
      else if (dojo.isString(content)) {
        var layer = this._graphicsLayer;
        var func = layer && layer._getDateOpts; // feature layer

        content = esri.substitute(this.attributes, content, {
          dateFormat: func && func.call(layer)
        });
      }
      
      return content;
    },

    show: function() {
      this.visible = this._visible = true;

      if (this._shape) {
        var source = this._shape.getEventSource();
        if (source) {
          esri.show(source);
        }
        // else
        // canvas
      }
      else if (this._graphicsLayer) {
        this._graphicsLayer._draw(this, true);
      }

      return this;
    },

    hide: function() {
      this.visible = this._visible = false;

      var shape = this._shape;
      if (shape) {
        var source = shape.getEventSource();
        
        if (source) {
          esri.hide(source);
        }
        else { // canvas
          var layer = this._graphicsLayer;
          if (layer) {
            layer._removeShape(this);
          }
        }
      }

      return this;
    },

    toJson: function() {
      var json = {};
      if (this.geometry) {
        json.geometry = this.geometry.toJson();
      }
      if (this.attributes) {
        json.attributes = dojo.mixin({}, this.attributes);
      }
      if (this.symbol) {
        json.symbol = this.symbol.toJson();
      }
      if (this.infoTemplate) {
        json.infoTemplate = this.infoTemplate.toJson();
      }
      return json;
    }
  }
);

dojo.declare("esri.InfoTemplate", null, {
    /**
     * ========== Constructor 1 ==========
     * new esri.InfoTemplate(title, content);
     * 
     * title: <String|Function>
     * content: <String|Function>
     *
     * Function: A user-defined function that will be
     * passed reference to the graphic being processed.
     * Returns one of the following:
     *   String
     *   DOMNode
     *   Instance of dojo.Deferred
     * 
     * ========== Constructor 2 ==========
     * new esri.InfoTemplate(JSON);
     * 
     * JSON: {
     *   title: <String|DOMNode|Function>,
     *   content: <String|DOMNode|Function>
     * }
     */
    constructor: function(/*String|Object*/ title, /*String*/ content) {
      if (title && dojo.isObject(title) && !dojo.isFunction(title)) {
        dojo.mixin(this, title);
      }
      else {
        this.title = title || "${*}";
        this.content = content || "${*}";
      }
    },

    setTitle: function(title) {
      this.title = title;
      return this;
    },

    setContent: function(content) {
      this.content = content;
      return this;
    },

    toJson: function() {
      return esri._sanitize({
        title: this.title,
        content: this.content
      });
    }
  }
);
});
