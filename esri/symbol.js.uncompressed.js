//>>built
// wrapped by build app
define("esri/symbol", ["dijit","dojo","dojox","dojo/require!dojo/_base/Color,dojox/gfx/_base,esri/utils"], function(dijit,dojo,dojox){
dojo.provide("esri.symbol");

dojo.require("dojo._base.Color");
dojo.require("dojox.gfx._base");
dojo.require("esri.utils");

dojo.mixin(esri.symbol, {
    toDojoColor: function(clr) {
      return clr && new dojo.Color([clr[0], clr[1], clr[2], clr[3] / 255]);
    },

    toJsonColor: function(clr) {
      return clr && [clr.r, clr.g, clr.b, Math.round(clr.a * 255)];
    },

    fromJson: function(/*Object*/ json) {
      //Convert json representation to appropriate esri.symbol.* object
      var type = json.type,
          symbol = null;
      switch (type.substring(0, "esriXX".length)) {
        case "esriSM":
          symbol = new esri.symbol.SimpleMarkerSymbol(json);
          break;
        case "esriPM":
          symbol = new esri.symbol.PictureMarkerSymbol(json);
          break;
        case "esriTS":
          symbol = new esri.symbol.TextSymbol(json);
          break;
        case "esriSL":
          if (json.cap !== undefined) {
            symbol = new esri.symbol.CartographicLineSymbol(json);
          }
          else {
            symbol = new esri.symbol.SimpleLineSymbol(json);
          }
          break;
        // case "esriCLS":
        //   symbol = new esri.symbol.CartographicLineSymbol(json);
        //   break;
        case "esriSF":
          symbol = new esri.symbol.SimpleFillSymbol(json);
          break;
        case "esriPF":
          symbol = new esri.symbol.PictureFillSymbol(json);
          break;
      }

      return symbol;
    }
  }
);

dojo.declare("esri.symbol.Symbol", null, {
    color: new dojo.Color([0,0,0,1]),
    type: null,
    _stroke: null,
    _fill: null,

    constructor: function(json) {
      if (json && dojo.isObject(json)) {
        dojo.mixin(this, json);
        
        // Check if color is an array. We could just do dojo.isArray
        // but would fail when run from another (child) window
        if (this.color && esri._isDefined(this.color[0])) {
          this.color = esri.symbol.toDojoColor(this.color);
        }
        
        // For some reason, we are not exposing the "type" code
        // as returned by REST. Let's do the translation.  
        var type = this.type;
        if (type && type.indexOf("esri") === 0) {
          this.type = {
            "esriSMS": "simplemarkersymbol",
            "esriPMS": "picturemarkersymbol",
            "esriSLS": "simplelinesymbol",
            "esriCLS": "cartographiclinesymbol",
            "esriSFS": "simplefillsymbol",
            "esriPFS": "picturefillsymbol",
            "esriTS": "textsymbol"
          }[type];
        }
      }
    },

    setColor: function(/*dojo.Color*/ color) {
      this.color = color;
      return this;
    },

    toJson: function() {
      return { color: esri.symbol.toJsonColor(this.color) };
    }
  }
);

//MARKERS
dojo.declare("esri.symbol.MarkerSymbol", esri.symbol.Symbol, {
    constructor: function(/*JSON*/ json) {
      if (json && dojo.isObject(json)) {
        this.size = dojox.gfx.pt2px(this.size);
        this.xoffset = dojox.gfx.pt2px(this.xoffset);
        this.yoffset = dojox.gfx.pt2px(this.yoffset);
      }
    },

    setAngle: function(/*Number*/ angle) {
      this.angle = angle;
      return this;
    },

    setSize: function(/*Number*/ size) {
      this.size = size;
      return this;
    },

    setOffset: function(/*Number*/ x, /*Number*/ y) {
      this.xoffset = x;
      this.yoffset = y;
      return this;
    },

    toJson: function() {
      var size = dojox.gfx.px2pt(this.size);
      size = isNaN(size) ? undefined : size;
      
      var xoff = dojox.gfx.px2pt(this.xoffset);
      xoff = isNaN(xoff) ? undefined : xoff;
      
      var yoff = dojox.gfx.px2pt(this.yoffset);
      yoff = isNaN(yoff) ? undefined : yoff;
      
      return dojo.mixin(
        this.inherited("toJson", arguments), 
        { 
          size: size, 
          angle: this.angle, 
          xoffset: xoff, 
          yoffset: yoff 
        }
      );
    },

    angle: 0,
    xoffset: 0,
    yoffset: 0,
    size: 12
  }
);

/* {
 * style: "esriSMSCircle|esriSMSSquare|esriSMSCross|esriSMSX|esriSMSDiamond",
 * color: [r,g,b,a] (0-255),
 * outline: true|false,
 * outlineColor: { red:0-255, green:0-255, blue: 0-255, transparency: 0-255 },
 * outlineSize: 1-n (in points),
 * size: 0-n (in points),
 * angle: 0-360,
 * xoffset: 0-n (in points),
 * yoffset: 0-n (in points)
 * }
 */
dojo.declare("esri.symbol.SimpleMarkerSymbol", esri.symbol.MarkerSymbol, {
    constructor: function(/*String|JSON*/ json, /*Number*/ size, /*esri.symbol.SimpleLineSymbol*/ outline, /*dojo.Color*/ color) {
      if (json) {
        if (dojo.isString(json)) {
          this.style = json;
          if (size) {
            this.size = size;
          }
          if (outline) {
            this.outline = outline;
          }
          if (color) {
            this.color = color;
          }
        }
        else {
          this.style = esri.valueOf(this._styles, this.style);
          if (json.outline) {
            this.outline = new esri.symbol.SimpleLineSymbol(json.outline);
          }
        }
      }
      else {
        dojo.mixin(this, esri.symbol.defaultSimpleMarkerSymbol);
        this.size = dojox.gfx.pt2px(this.size);
        this.outline = new esri.symbol.SimpleLineSymbol(this.outline);
        this.color = new dojo.Color(this.color);
      }

      if (! this.style) {
        this.style = esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE;
      }
    },
    
    type: "simplemarkersymbol",

    setStyle: function(/*String*/ style) {
      this.style = style;
      return this;
    },

    setOutline: function(/*esri.symbol.SimpleLineSymbol*/ outline) {
      this.outline = outline;
      return this;
    },

    getStroke: function() {
      return this.outline && this.outline.getStroke();
    },

    getFill: function() {
      return this.color;
    },
    
    _setDim: function(targetWidth, targetHeight, spikeSize) {
      this._targetWidth = targetWidth;
      this._targetHeight = targetHeight;
      this._spikeSize = spikeSize;
    },

    toJson: function() {
      var json = dojo.mixin(this.inherited("toJson", arguments), { type:"esriSMS", style:this._styles[this.style] }),
          outline = this.outline;

      if (outline) {
        json.outline = outline.toJson();
      }
      /*else {
        json.outline = false;
      }*/

      return esri._sanitize(json);
    },

    _styles: { circle:"esriSMSCircle", square:"esriSMSSquare", cross:"esriSMSCross", x:"esriSMSX", diamond:"esriSMSDiamond" }
  }
);

dojo.mixin(esri.symbol.SimpleMarkerSymbol, {
  STYLE_CIRCLE: "circle", 
  STYLE_SQUARE: "square", 
  STYLE_CROSS: "cross", 
  STYLE_X: "x", 
  STYLE_DIAMOND: "diamond",
  STYLE_TARGET: "target"
  // TODO
  // STYLE_TARGET and _setDim is an intermediate solution until
  // we can support STYLE_PATH
});

/* {
 * url: "http://...",
 * size: 0-n (in points),
 * angle: 0-360,
 * xoffset: 0-n (in points),
 * yoffset: 0-n (in points)
 * }
 */
dojo.declare("esri.symbol.PictureMarkerSymbol", esri.symbol.MarkerSymbol, {
    constructor: function(/*String|JSON*/ json, /*Number*/ width, /*Number*/ height) {
      if (json) {
        if (dojo.isString(json)) {
          this.url = json;
          if (width) {
            this.width = width;
          }
          if (height) {
            this.height = height;
          }
        }
        else {
          this.width = dojox.gfx.pt2px(json.width);
          this.height = dojox.gfx.pt2px(json.height);

          // see - http://en.wikipedia.org/wiki/Data_Uri
          // also - https://developer.mozilla.org/en/data_URIs
          // "IE 8 does not support data URIs for VML image elements": 
          // http://code.google.com/p/explorercanvas/issues/detail?id=60#c1
          var imageData = json.imageData;
          if ( (!esri.vml /*|| (isIE && isIE >= 8 && imageData.length <= 32768)*/) && imageData ) {
            var temp = this.url;
            this.url = "data:" + (json.contentType || "image") + ";base64," + imageData;
            this.imageData = temp;
          }
          
          // TODO
          // Got to revisit this again
//          if (this.size) {
//            this.width = this.height = this.size;
//          }
        }
      }
      else {
        dojo.mixin(this, esri.symbol.defaultPictureMarkerSymbol);
        this.width = dojox.gfx.pt2px(this.width);
        this.height = dojox.gfx.pt2px(this.height);
      }
    },

    type: "picturemarkersymbol",

    getStroke: function() {
      return null;
    },

    getFill: function() {
      return null;
    },

    setWidth: function(/*Number*/ width) {
      this.width = width;
      return this;
    },

    setHeight: function(/*Number*/ height) {
      this.height = height;
      return this;
    },

    setUrl: function(/*String*/ url) {
      if (url !== this.url) {
        delete this.imageData;
        delete this.contentType;
      }
      this.url = url;
      return this;
    },

    toJson: function() {
      // Swap url and imageData if necessary
      var url = this.url, imageData = this.imageData;
      if (url.indexOf("data:") === 0) {
        var temp = url;
        url = imageData;
        
        var index = temp.indexOf(";base64,") + 8;
        imageData = temp.substr(index);
      }
      url = esri._getAbsoluteUrl(url);
      
      var width = dojox.gfx.px2pt(this.width);
      width = isNaN(width) ? undefined : width;
      
      var height = dojox.gfx.px2pt(this.height);
      height = isNaN(height) ? undefined : height;

      var retVal = esri._sanitize(dojo.mixin(this.inherited("toJson", arguments), { 
        type: "esriPMS", 
        /*style: "esriPMS", */
        url: url, 
        imageData: imageData,
        contentType: this.contentType,
        width: width, 
        height: height
      }));
      
      // http://nil/rest-docs/symbol.html#pms
      delete retVal.color;
      delete retVal.size;
      if (!retVal.imageData) {
        delete retVal.imageData;
      }
      
      return retVal;
    }
  }
);

//LINES
dojo.declare("esri.symbol.LineSymbol", esri.symbol.Symbol, {
    constructor: function(/*JSON*/ json) {
      if (dojo.isObject(json)) {
        this.width = dojox.gfx.pt2px(this.width);
      }
      else {
        this.width = 12;
      }
    },

    setWidth: function(/*Number*/ width) {
      this.width = width;
      return this;
    },

    toJson: function() {
      var width = dojox.gfx.px2pt(this.width);
      width = isNaN(width) ? undefined : width;
      
      return dojo.mixin(
        this.inherited("toJson", arguments),
        { width: width }
      );
    }
  }
);

/* {
 * style: "esriSLSSolid|esriSLSDash|esriSLSDot|esriSLSDashDot|esriSLSDashDotDot|esriSLSNull|esriSLSInsideFrame",
 * color: [r,g,b,a] (0-255),
 * width: 1-n (in points)
 * }
 */
dojo.declare("esri.symbol.SimpleLineSymbol", esri.symbol.LineSymbol, {
    constructor: function(/*String|JSON*/ json, /*dojo.Color*/ color, /*Number*/ width) {
      if (json) {
        if (dojo.isString(json)) {
          this.style = json;
          if (color) {
            this.color = color;
          }
          if (width) {
            this.width = width;
          }
        }
        else {
          this.style = esri.valueOf(this._styles, json.style) || esri.symbol.SimpleLineSymbol.STYLE_SOLID;
        }
      }
      else {
        dojo.mixin(this, esri.symbol.defaultSimpleLineSymbol);
        this.color = new dojo.Color(this.color);
        this.width = dojox.gfx.pt2px(this.width);
      }
    },
    
    type: "simplelinesymbol",

    setStyle: function(/*String*/ style) {
      this.style = style;
      return this;
    },

    getStroke: function() {
      return (this.style === esri.symbol.SimpleLineSymbol.STYLE_NULL || this.width === 0) ? null : { color:this.color, style:this.style, width:this.width };
    },

    getFill: function() {
      return null;
    },

    toJson: function() {
      return esri._sanitize(dojo.mixin(this.inherited("toJson", arguments), { type:"esriSLS", style: this._styles[this.style] }));
    },

    _styles: { solid:"esriSLSSolid", dash:"esriSLSDash", dot:"esriSLSDot", dashdot:"esriSLSDashDot", longdashdotdot:"esriSLSDashDotDot", none:"esriSLSNull", insideframe:"esriSLSInsideFrame" }
  }
);

dojo.mixin(esri.symbol.SimpleLineSymbol, {
  STYLE_SOLID: "solid", STYLE_DASH: "dash", STYLE_DOT: "dot", STYLE_DASHDOT: "dashdot", STYLE_DASHDOTDOT: "longdashdotdot", STYLE_NULL: "none"
});

/* {
 * style: "esriSLSSolid|esriSLSDash|esriSLSDot|esriSLSDashDot|esriSLSDashDotDot|esriSLSNull|esriSLSInsideFrame",
 * color: [r,g,b,a] (0-255),
 * width: 1-n (in points),
 * cap: "esriLCSButt|esriLCSRound|esriLCSSquare",
 * join: "esriLJSMiter|esriLJSRound|esriLJSBevel",
 * miterLimit: 1-n (in points)
 * }
 */
dojo.declare("esri.symbol.CartographicLineSymbol", esri.symbol.SimpleLineSymbol, {
    constructor: function(/*String|JSON*/ json, /*dojo.Color*/ color, /*Number*/ width, /*String*/ cap, /*String*/ join, /*Number*/ miterLimit) {
      if (json) {
        if (dojo.isString(json)) {
          this.style = json;
          if (color) {
            this.color = color;
          }
          if (width !== undefined) {
            this.width = width;
          }
          if (cap) {
            this.cap = cap;
          }
          if (join) {
            this.join = join;
          }
          if (miterLimit !== undefined) {
            this.miterLimit = miterLimit;
          }
        }
        else {
          this.cap = esri.valueOf(this._caps, json.cap);
          this.join = esri.valueOf(this._joins, json.join);
          this.width = dojox.gfx.pt2px(json.width);
          this.miterLimit = dojox.gfx.pt2px(json.miterLimit);
        }
      }
      else {
        dojo.mixin(this, esri.symbol.defaultCartographicLineSymbol);
        this.color = new dojo.Color(this.color);
        this.width = dojox.gfx.pt2px(this.width);
        this.miterLimit = dojox.gfx.pt2px(this.miterLimit);
      }
    },

    type: "cartographiclinesymbol",

    setCap: function(/*String*/ cap) {
      this.cap = cap;
      return this;
    },

    setJoin: function(/*String*/ join) {
      this.join = join;
      return this;
    },

    setMiterLimit: function(/*Number*/ miterLimit) {
      this.miterLimit = miterLimit;
      return this;
    },

    getStroke: function() {
      return dojo.mixin(this.inherited("getStroke", arguments), { cap:this.cap, join:(this.join === esri.symbol.CartographicLineSymbol.JOIN_MITER ? this.miterLimit : this.join) });
    },

    getFill: function() {
      return null;
    },

    toJson: function() {
      var miter = dojox.gfx.px2pt(this.miterLimit);
      miter = isNaN(miter) ? undefined : miter;
      
      return esri._sanitize(dojo.mixin(
        this.inherited("toJson", arguments),
        { 
          type:"esriCLS", 
          cap:this._caps[this.cap], 
          join:this._joins[this.join], 
          miterLimit: miter 
        }
      ));
    },

    _caps: { butt: "esriLCSButt", round: "esriLCSRound", square: "esriLCSSquare" },
    _joins: { miter: "esriLJSMiter", round: "esriLJSRound", bevel: "esriLJSBevel" }
  }
);

//BUG: STYLE_NULL doesn't do anything. It still draws it
dojo.mixin(esri.symbol.CartographicLineSymbol, {
  STYLE_SOLID: "solid", STYLE_DASH: "dash", STYLE_DOT: "dot", STYLE_DASHDOT: "dashdot", STYLE_DASHDOTDOT: "longdashdotdot", STYLE_NULL: "none", STYLE_INSIDE_FRAME: "insideframe",
  CAP_BUTT: "butt", CAP_ROUND: "round", CAP_SQUARE: "square",
  JOIN_MITER: "miter", JOIN_ROUND: "round", JOIN_BEVEL: "bevel"
});

//FILLS
dojo.declare("esri.symbol.FillSymbol", esri.symbol.Symbol, {
    constructor: function(/*JSON*/ json) {
      if (json && dojo.isObject(json) && json.outline) {
        this.outline = new esri.symbol.SimpleLineSymbol(json.outline);
      }
    },

    setOutline: function(outline) {
      this.outline = outline;
      return this;
    },

    toJson: function() {
      var json = this.inherited("toJson", arguments);
      if (this.outline) {
        json.outline = this.outline.toJson();
      }
      return json;
    }
  }
);

/* {
 * style: "esriSFSSolid|esriSFSNull|esriSFSHorizontal|esriSFSVertical|esriSFSForwardDiagonal|esriSFSBackwardDiagonal|esriSFSCross|esriSFSDiagonalCross",
 * color: [r,g,b,a] (0-255),
 * outline: JSON representation for SimpleLineSymbol
 * }
 */
dojo.declare("esri.symbol.SimpleFillSymbol", esri.symbol.FillSymbol, {
    constructor: function(/*String|JSON*/ json, /*SimpleLineSymbol*/ outline, /*dojo.Color*/ color) {
      if (json) {
        if (dojo.isString(json)) {
          this.style = json;
          if (outline !== undefined) {
            this.outline = outline;
          }
          if (color !== undefined) {
            this.color = color;
          }
        }
        else {
          this.style = esri.valueOf(this._styles, json.style);
        }
      }
      else {
        dojo.mixin(this, esri.symbol.defaultSimpleFillSymbol);
        this.outline = new esri.symbol.SimpleLineSymbol(this.outline);
        this.color = new dojo.Color(this.color);
      }

      var style = this.style;
      if (style !== "solid" && style !== "none") {
        this._src = dojo.moduleUrl("esri") + "../../images/symbol/sfs/" + style + ".png";
      }
    },

    type: "simplefillsymbol",

    setStyle: function(/*String*/ style) {
      this.style = style;
      return this;
    },

    getStroke: function() {
      return this.outline && this.outline.getStroke();
    },

    getFill: function() {
      var style = this.style;
      if (style === esri.symbol.SimpleFillSymbol.STYLE_NULL) {
        return null;
      }
      else if (style === esri.symbol.SimpleFillSymbol.STYLE_SOLID) {
        return this.color;
      }
      else {
        return dojo.mixin(dojo.mixin({}, dojox.gfx.defaultPattern), { src: this._src, width:10, height:10 });
      }
    },

    toJson: function() {
      return esri._sanitize(dojo.mixin(this.inherited("toJson", arguments), { type:"esriSFS", style:this._styles[this.style] }));
    },

    _styles: { solid: "esriSFSSolid", none: "esriSFSNull", horizontal: "esriSFSHorizontal", vertical: "esriSFSVertical", forwarddiagonal: "esriSFSForwardDiagonal", backwarddiagonal: "esriSFSBackwardDiagonal", cross: "esriSFSCross", diagonalcross: "esriSFSDiagonalCross" }
  }
);

//BUG INCORRECT NAMES: STYLE_FORWARDDIAGONAL, STYLE_BACKWARDDIAGONAL, STYLE_DIAGONALCROSS
dojo.mixin(esri.symbol.SimpleFillSymbol, {
  STYLE_SOLID: "solid", STYLE_NULL: "none", STYLE_HORIZONTAL: "horizontal", STYLE_VERTICAL: "vertical", STYLE_FORWARD_DIAGONAL: "forwarddiagonal", STYLE_BACKWARD_DIAGONAL: "backwarddiagonal", STYLE_CROSS: "cross", STYLE_DIAGONAL_CROSS: "diagonalcross",
  STYLE_FORWARDDIAGONAL: "forwarddiagonal", STYLE_BACKWARDDIAGONAL: "backwarddiagonal", STYLE_DIAGONALCROSS: "diagonalcross"
});

/* {
 * pictureUri: String,
 * xoffset: 0-n (in points),
 * yoffset: 0-n (in points),
 * xscale: 0-n,
 * yscale: 0-n,
 * color: [r,g,b,a] (0-255),
 * outline: JSON representation for SimpleLineSymbol,
 * angle: 0-n,
 * backgroundColor: [r,g,b,a] (0-255),
 * bitmapTransparencyColor: [r,g,b,a] (0-255),
 * xseparation: 0-n,
 * yseparation: 0-n
 * }
 */
dojo.declare("esri.symbol.PictureFillSymbol", esri.symbol.FillSymbol, {
    constructor: function(/*String|JSON*/ json, /*SimpleLineSymbol*/ outline, /*Number*/ width, /*Number*/ height) {
      if (json) {
        if (dojo.isString(json)) {
          this.url = json;
          if (outline !== undefined) {
            this.outline = outline;
          }
          if (width !== undefined) {
            this.width = width;
          }
          if (height !== undefined) {
            this.height = height;
          }
        }
        else {
          this.xoffset = dojox.gfx.pt2px(json.xoffset);
          this.yoffset = dojox.gfx.pt2px(json.yoffset);
          this.width = dojox.gfx.pt2px(json.width);
          this.height = dojox.gfx.pt2px(json.height);

          // see - http://en.wikipedia.org/wiki/Data_Uri
          // also - https://developer.mozilla.org/en/data_URIs
          // also - PictureMarkerSymbol
          // "IE 8 does not support data URIs for VML image elements": 
          // http://code.google.com/p/explorercanvas/issues/detail?id=60#c1
          var imageData = json.imageData;
          if ( (!esri.vml /*|| (isIE && isIE >= 8 && imageData.length <= 32768)*/) && imageData ) {
            var temp = this.url;
            this.url = "data:" + (json.contentType || "image") + ";base64," + imageData;
            this.imageData = temp;
          }
          
        }
      }
      else {
        dojo.mixin(this, esri.symbol.defaultPictureFillSymbol);
        this.width = dojox.gfx.pt2px(this.width);
        this.height = dojox.gfx.pt2px(this.height);
      }
    },

    type: "picturefillsymbol",
    xscale: 1,
    yscale: 1,
    xoffset: 0,
    yoffset: 0,

    setWidth: function(/*Number*/ width) {
      this.width = width;
      return this;
    },

    setHeight: function(/*Number*/ height) {
      this.height = height;
      return this;
    },

    setOffset: function(/*Number*/ x, /*Number*/ y) {
      this.xoffset = x;
      this.yoffset = y;
      return this;
    },

    setUrl: function(/*String*/ url) {
      if (url !== this.url) {
        delete this.imageData;
        delete this.contentType;
      }
      this.url = url;
      return this;
    },

    setXScale: function(/*Number*/ scale) {
      this.xscale = scale;
      return this;
    },

    setYScale: function(/*Number*/ scale) {
      this.yscale = scale;
      return this;
    },

    getStroke: function() {
      return this.outline && this.outline.getStroke();
    },

    getFill: function() {
      return dojo.mixin({}, dojox.gfx.defaultPattern,
                        { src:this.url, width:(this.width * this.xscale), height:(this.height * this.yscale), x:this.xoffset, y:this.yoffset });
    },

    toJson: function() {
      // Swap url and imageData if necessary
      var url = this.url, imageData = this.imageData;
      if (url.indexOf("data:") === 0) {
        var temp = url;
        url = imageData;
        
        var index = temp.indexOf(";base64,") + 8;
        imageData = temp.substr(index);
      }
      url = esri._getAbsoluteUrl(url);
      
      var width = dojox.gfx.px2pt(this.width);
      width = isNaN(width) ? undefined : width;
      
      var height = dojox.gfx.px2pt(this.height);
      height = isNaN(height) ? undefined : height;
      
      var xoff = dojox.gfx.px2pt(this.xoffset);
      xoff = isNaN(xoff) ? undefined : xoff;
      
      var yoff = dojox.gfx.px2pt(this.yoffset);
      yoff = isNaN(yoff) ? undefined : yoff;

      var json = esri._sanitize(dojo.mixin(
        this.inherited("toJson", arguments),
        { 
          type: "esriPFS", 
          /*style: "esriPFS", */
          url: url, 
          imageData: imageData,
          contentType: this.contentType,
          width: width, 
          height: height, 
          xoffset: xoff, 
          yoffset: yoff, 
          xscale: this.xscale, 
          yscale: this.yscale 
        }
      ));
      if (!json.imageData) {
        delete json.imageData;
      }
      return json;
    }
  }
);

dojo.declare("esri.symbol.Font", null, {
    constructor: function(/*String|JSON*/ json, /*String*/ style, /*String*/ variant, /*String|Number*/ weight, /*String*/ family) {
      if (json) {
        if (dojo.isObject(json)) {
          dojo.mixin(this, json);
        }
        else {
          this.size = json;
          if (style !== undefined) {
            this.style = style;
          }
          if (variant !== undefined) {
            this.variant = variant;
          }
          if (weight !== undefined) {
            this.weight = weight;
          }
          if (family !== undefined) {
            this.family = family;
          }
        }
      }
      else {
        dojo.mixin(this, dojox.gfx.defaultFont);
      }
    },

    setSize: function(size) {
      this.size = size;
      return this;
    },

    setStyle: function(style) {
      this.style = style;
      return this;
    },

    setVariant: function(variant) {
      this.variant = variant;
      return this;
    },

    setWeight: function(weight) {
      this.weight = weight;
      return this;
    },

    setFamily: function(family) {
      this.family = family;
      return this;
    },

    toJson: function() {
      return esri._sanitize({ 
        size:this.size, 
        style:this.style, 
        variant:this.variant,
        decoration: this.decoration, 
        weight:this.weight, 
        family:this.family 
      });
    }
  }
);

dojo.mixin(esri.symbol.Font, {
  STYLE_NORMAL: "normal", STYLE_ITALIC: "italic", STYLE_OBLIQUE: "oblique",
  VARIANT_NORMAL: "normal", VARIANT_SMALLCAPS: "small-caps",
  WEIGHT_NORMAL:"normal", WEIGHT_BOLD: "bold", WEIGHT_BOLDER: "bolder", WEIGHT_LIGHTER: "lighter"
});

dojo.declare("esri.symbol.TextSymbol", esri.symbol.Symbol, {
    constructor: function(/*String|JSON*/ json, /*esri.symbol.Font*/ font, /*dojo.Color*/ color) {
      dojo.mixin(this, esri.symbol.defaultTextSymbol);
      this.font = new esri.symbol.Font(this.font);
      this.color = new dojo.Color(this.color);

      if (json) {
        if (dojo.isObject(json)) {
          dojo.mixin(this, json);
          
          // Check if color is an array. We could just do dojo.isArray
          // but would fail when run from another (child) window
          if (this.color && esri._isDefined(this.color[0])) {
            this.color = esri.symbol.toDojoColor(this.color);
          }
          
          // TODO
          // I don't really want to override type here.
          // Ideally, I'd want to remove the two preceding lines
          // as they are already done in Symbol ctor. But doing so messes up
          // the TextSymbol defaults set earlier in this method.
          // Overall, the way defaults and later overrides are handled in
          // the esri.symbol package feels out of place. I'd like to rewrite
          // it but not at v1.5
          this.type = "textsymbol";
          this.font = new esri.symbol.Font(this.font);
          this.xoffset = dojox.gfx.pt2px(this.xoffset);
          this.yoffset = dojox.gfx.pt2px(this.yoffset);
        }
        else {
          this.text = json;
          if (font) {
            this.font = font;
          }
          if (color) {
            this.color = color;
          }
        }
      }
    },

    angle: 0,
    xoffset: 0,
    yoffset: 0,
    
    setFont: function(/*esri.symbol.Font*/ font) {
      this.font = font;
      return this;
    },
    
    setAngle: function(/*Number*/ angle) {
      this.angle = angle;
      return this;
    },

    setOffset: function(/*Number*/ x, /*Number*/ y) {
      this.xoffset = x;
      this.yoffset = y;
      return this;
    },

    setAlign: function(/*String*/ align) {
      this.align = align;
      return this;
    },

    setDecoration: function(/*String*/ decoration) {
      // TODO
      // We need to move this into "Font"
      // See: http://nil/rest-docs/symbol.html
      this.decoration = decoration;
      return this;
    },

    setRotated: function(/*boolean*/ rotated) {
      this.rotated = rotated;
      return this;
    },

    setKerning: function(/*boolean*/ kerning) {
      this.kerning = kerning;
      return this;
    },

    setText: function(/*String*/ text) {
      this.text = text;
      return this;
    },

    getStroke: function() {
      return null;
    },

    getFill: function() {
      return this.color;
    },

    toJson: function() {
      var xoff = dojox.gfx.px2pt(this.xoffset);
      xoff = isNaN(xoff) ? undefined : xoff;
      
      var yoff = dojox.gfx.px2pt(this.yoffset);
      yoff = isNaN(yoff) ? undefined : yoff;
      
      // NOTE
      // We don't support backgroundColor, borderLineColor, verticalAlignment
      // and horizontalAlignment, but we need to serialize them back to not
      // mess with other environments reading this serialized json.
      // See: http://nil/rest-docs/symbol.html
      
      return esri._sanitize(dojo.mixin(
        this.inherited("toJson", arguments),
        { 
          type:"esriTS", /*style:"esriTS",*/ 
          backgroundColor: this.backgroundColor,
          borderLineColor: this.borderLineColor,
          verticalAlignment: this.verticalAlignment,
          horizontalAlignment: this.horizontalAlignment,
          rightToLeft: this.rightToLeft,
          width: this.width, // Not in REST model but Explorer online has it. Let's serialize it out.
          angle: this.angle, 
          xoffset: xoff, 
          yoffset: yoff, 
          text:this.text, 
          align:this.align, 
          decoration:this.decoration, 
          rotated:this.rotated, 
          kerning:this.kerning, 
          font:this.font.toJson() 
        }
      ));
    }
  }
);

dojo.mixin(esri.symbol.TextSymbol, {
  ALIGN_START: "start", ALIGN_MIDDLE: "middle", ALIGN_END: "end",
  DECORATION_NONE: "none", DECORATION_UNDERLINE: "underline", DECORATION_OVERLINE: "overline", DECORATION_LINETHROUGH: "line-through"
});

dojo.mixin(esri.symbol, {
    defaultSimpleLineSymbol: { color:[0,0,0,1], style:esri.symbol.SimpleLineSymbol.STYLE_SOLID, width:1 },
    defaultSimpleMarkerSymbol: { style:esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, color:[255,255,255,0.25], outline:esri.symbol.defaultSimpleLineSymbol, size:12, angle:0, xoffset:0, yoffset:0 },
    defaultPictureMarkerSymbol: { url:"", width:12, height:12, angle:0, xoffset:0, yoffset:0 },
    defaultCartographicLineSymbol: { color:[0,0,0,1], style:esri.symbol.CartographicLineSymbol.STYLE_SOLID, width:1, cap:esri.symbol.CartographicLineSymbol.CAP_BUTT, join:esri.symbol.CartographicLineSymbol.JOIN_MITER, miterLimit:10 },
    defaultSimpleFillSymbol: { style:esri.symbol.SimpleFillSymbol.STYLE_SOLID, color:[0,0,0,0.25], outline:esri.symbol.defaultSimpleLineSymbol },
    defaultPictureFillSymbol: { xoffset:0, yoffset:0, width:12, height:12 },
    defaultTextSymbol: { color:[0,0,0,1], font:dojox.gfx.defaultFont, angle:0, xoffset:0, yoffset:0 },
    
    getShapeDescriptors: function(symbol) {
      var shape, fill, stroke;
      
      // shape
      var type = symbol.type;
      switch(type) {
        case "simplemarkersymbol":
          var style = symbol.style, SMS = esri.symbol.SimpleMarkerSymbol;
          var size = symbol.size || dojox.gfx.pt2px(esri.symbol.defaultSimpleMarkerSymbol.size), cx = 0, cy = 0, half = size / 2;
          var left = cx - half, right = cx + half, top = cy - half, bottom = cy + half;
          
          switch(style) {
            case SMS.STYLE_CIRCLE:
              shape = { type: "circle", cx: cx, cy: cy, r: half };
              fill = symbol.getFill();
              stroke = symbol.getStroke();
              if (stroke) {
                stroke.style = stroke.style || "Solid";
              }
              break;
            case SMS.STYLE_CROSS:
              shape = { type: "path", path: "M " + left + ",0 L " + right + ",0 M 0," + top + " L 0," + bottom + " E" };
              fill = null;
              stroke = symbol.getStroke();
              break;
            case SMS.STYLE_DIAMOND:
              shape = { type: "path", path: "M " + left + ",0 L 0," + top + " L " + right + ",0 L 0," + bottom + " L " + left + ",0 E" };
              fill = symbol.getFill();
              stroke = symbol.getStroke();
              break;
            case SMS.STYLE_SQUARE:
              shape = { type: "path", path: "M " + left + "," + bottom + " L " + left + "," + top + " L " + right + "," + top + " L " + right + "," + bottom + " L " + left + "," + bottom + " E" };
              fill = symbol.getFill();
              stroke = symbol.getStroke();
              break;
            case SMS.STYLE_X:
              shape = { type: "path", path: "M " + left + "," + bottom + " L " + right + "," + top + " M " + left + "," + top + " L " + right + "," + bottom + " E" };
              fill = null;
              stroke = symbol.getStroke();
              break;
          }
          break;
        case "picturemarkersymbol":
          shape = { type: "image", x: 0, y: 0, width: 16, height: 16, src: "" };
          shape.x = shape.x - Math.round(symbol.width / 2);
          shape.y = shape.y - Math.round(symbol.height / 2);
          shape.width = symbol.width;
          shape.height = symbol.height;
          shape.src = symbol.url;
          break;
        case "simplelinesymbol":
        case "cartographiclinesymbol":
          //shape = { type: "path", path: "M -15,10 L 0,-10 L 0,10 L 15,-10 E" };
          shape = { type: "path", path: "M -15,0 L 15,0 E" };
          fill = null;
          stroke = symbol.getStroke();
          break;
        case "simplefillsymbol":
        case "picturefillsymbol":
          shape = { type: "path", path: "M -10,-10 L 10,0 L 10,10 L -10,10 L -10,-10 E" };
          fill = symbol.getFill();
          stroke = symbol.getStroke();
          break;
      }
      
      return { defaultShape: shape, fill: fill, stroke: stroke };
    }
  }
);

dojo.mixin(esri.symbol.defaultTextSymbol, dojox.gfx.defaultText, { type:"textsymbol", align:"middle" });
});
