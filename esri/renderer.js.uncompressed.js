//>>built
// wrapped by build app
define("esri/renderer", ["dijit","dojo","dojox","dojo/require!esri/graphic,dojo/date"], function(dijit,dojo,dojox){
dojo.provide("esri.renderer");

dojo.require("esri.graphic");
dojo.require("dojo.date");

// Utility method to deserialize a renderer from json
// returned by REST
esri.renderer.fromJson = function(json) {
  var type = json.type || "", renderer;
  switch(type) {
    case "simple":
      renderer = new esri.renderer.SimpleRenderer(json);
      break;
    case "uniqueValue":
      renderer = new esri.renderer.UniqueValueRenderer(json);
      break;
    case "classBreaks":
      renderer = new esri.renderer.ClassBreaksRenderer(json);
      break;
  }
  return renderer;
};

dojo.declare("esri.renderer.Renderer", null, {
    constructor: function() {
      this.getSymbol = dojo.hitch(this, this.getSymbol);
    },
  
    getSymbol: function(graphic) {
      //to be implemented by Renderer
    },
    
    toJson: function() {
      //to be implemented by subclasses
    }
  }
);

dojo.declare("esri.renderer.SimpleRenderer", esri.renderer.Renderer, {
    constructor: function(sym) {
      // 2nd constructor signature added at v2.0:
      // esri.renderer.SimpleRenderer(<Object> json);

      if (sym && !sym.declaredClass) {
        // REST JSON representation
        var json = sym;
        sym = json.symbol;
        
        if (sym) {
          this.symbol = esri.symbol.fromJson(sym);
        }
        
        this.label = json.label;
        this.description = json.description;
      }
      else {
        this.symbol = sym;
      }
      
      /*var className = sym.declaredClass;
      if (className && (className.indexOf("esri.symbol") !== -1)) { // symbol
        this.symbol = sym;
      }
      else { // json
        var json = sym, sym = json.symbol;
        if (sym) {
          this.symbol = esri.symbol.fromJson(sym);
        }
        this.label = json.label;
        this.description = json.description;
      }*/
    },

    getSymbol: function(graphic) {
      return this.symbol;
    },
    
    toJson: function() {
      return esri._sanitize({
        type: "simple",
        label: this.label,
        description: this.description,
        symbol: this.symbol && this.symbol.toJson()
      });
    }
  }
);

dojo.declare("esri.renderer.UniqueValueRenderer", esri.renderer.Renderer, {
    constructor: function(sym, attr, /*Optional*/ attr2, /*Optional*/ attr3, /*Optional*/ fieldDelimiter) {
      // 2nd constructor signature added at v2.0:
      // esri.renderer.UniqueValueRenderer(<Object> json);
      this.values = [];
      this._values = [];
      this.infos = [];
      
      if (sym && !sym.declaredClass) {
        // REST JSON representation
        var json = sym;
        sym = json.defaultSymbol;
        
        if (sym) {
          this.defaultSymbol = esri.symbol.fromJson(sym);
        }
        this.attributeField = json.field1;
        this.attributeField2 = json.field2;
        this.attributeField3 = json.field3;
        this.fieldDelimiter = json.fieldDelimiter;
        this.defaultLabel = json.defaultLabel;
        
        dojo.forEach(json.uniqueValueInfos, this._addValueInfo, this);
      }
      else {
        this.defaultSymbol = sym;
        this.attributeField = attr;
        this.attributeField2 = attr2;
        this.attributeField3 = attr3;
        this.fieldDelimiter = fieldDelimiter;
      }

      /*var className = sym.declaredClass;
      if (className && (className.indexOf("esri.symbol") !== -1)) { // symbol, ...
        this.defaultSymbol = sym;
        this.attributeField = attr;
        this.attributeField2 = attr2;
        this.attributeField3 = attr3;
        this.fieldDelimiter = fieldDelimiter;
      }
      else { // json
        var json = sym, sym = json.defaultSymbol;
        if (sym) {
          this.defaultSymbol = esri.symbol.fromJson(sym);
        }
        this.attributeField = json.field1;
        this.attributeField2 = json.field2;
        this.attributeField3 = json.field3;
        this.fieldDelimiter = json.fieldDelimiter;
        this.defaultLabel = json.defaultLabel;
        dojo.forEach(json.uniqueValueInfos, this._addValueInfo, this);
      }*/
      
      this._multi = (this.attributeField2) ? true : false;
    },
    
    addValue: function(value, symbol) {
      // 2nd method signature added at v2.0:
      // addValue(<Object> info); 
      var info = dojo.isObject(value) ? value : { value: value, symbol: symbol };
      this._addValueInfo(info);
    },
    
    removeValue: function(value) {
      var i = dojo.indexOf(this.values, value);
      if (i === -1) {
        return;
      }
      
      this.values.splice(i, 1);
      delete this._values[value];
      this.infos.splice(i, 1);
    },
    
    getSymbol: function(graphic) {
      if (this._multi) {
        var attributes = graphic.attributes, field1 = this.attributeField, field2 = this.attributeField2, field3 = this.attributeField3;
        var values = [];
        if (field1) {
          values.push(attributes[field1]);
        }
        if (field2) {
          values.push(attributes[field2]);
        }
        if (field3) {
          values.push(attributes[field3]);
        }
        return this._values[values.join(this.fieldDelimiter || "")] || this.defaultSymbol;
      }
      else {
        return this._values[graphic.attributes[this.attributeField]] || this.defaultSymbol;
      }
    },
    
    /*******************
     * Internal Methods
     *******************/
    
    _addValueInfo: function(/*Object*/ info) {
      /*
       * info = {
       *   value: <String>,
       *   symbol: <Symbol | json>,
       *   label: <String>,
       *   description: <String>
       * }
       */
      var value = info.value;
      this.values.push(value);
      this.infos.push(info);
      
      var symbol = info.symbol;
      if (symbol) {
        if (!symbol.declaredClass) { // symbol in its json form?
          info.symbol = esri.symbol.fromJson(symbol);
        }
      }
      this._values[value] = info.symbol;
    },
    
    toJson: function() {
      var sanitize = esri._sanitize;
      return sanitize({
        type: "uniqueValue",
        field1: this.attributeField,
        field2: this.attributeField2,
        field3: this.attributeField3,
        fieldDelimiter: this.fieldDelimiter,
        defaultSymbol: this.defaultSymbol && this.defaultSymbol.toJson(),
        defaultLabel: this.defaultLabel,
        uniqueValueInfos: dojo.map(this.infos || [], function(info) {
          info = dojo.mixin({}, info);
          info.symbol = info.symbol && info.symbol.toJson();
          // http://stackoverflow.com/questions/5765398/whats-the-best-way-to-convert-a-number-to-a-string
          info.value = info.value + "";
          return sanitize(info);
        })
      });
    }
  }
);

dojo.declare("esri.renderer.ClassBreaksRenderer", esri.renderer.Renderer, {
    constructor: function(sym, attr) {
      // 2nd constructor signature added at v2.0:
      // esri.renderer.ClassBreaksRenderer(<Object> json);
      this.breaks = [];
      this._symbols = [];
      this.infos = [];
      
      if (sym && !sym.declaredClass) {
        // REST JSON representation
        var json = sym;
        this.attributeField = json.field;

        sym = json.defaultSymbol;
        if (sym) {
          this.defaultSymbol = esri.symbol.fromJson(sym);
        }
        
        this.defaultLabel = json.defaultLabel;
        
        var min = json.minValue, infos = json.classBreakInfos;
        if (infos && infos[0] && esri._isDefined(infos[0].classMaxValue)) {
          dojo.forEach(infos, function(info) {
            var classMax = info.classMaxValue;
            info.minValue = min;
            info.maxValue = classMax;
            min = classMax;
          }, this);
        }
        
        dojo.forEach(infos, this._addBreakInfo, this);
      }
      else {
        this.defaultSymbol = sym;
        this.attributeField = attr;
      }

      /*var className = sym.declaredClass;
      if (className && (className.indexOf("esri.symbol") !== -1)) { // symbol, ...
        this.defaultSymbol = sym;
        this.attributeField = attr;
      }
      else { // json
        var json = sym;
        this.attributeField = json.field;
        
        var min = json.minValue, infos = json.classBreakInfos;
        if (infos && infos[0] && esri._isDefined(infos[0].classMaxValue)) {
          dojo.forEach(infos, function(info) {
            var classMax = info.classMaxValue;
            info.minValue = min;
            info.maxValue = classMax;
            min = classMax;
          }, this);
        }
        dojo.forEach(infos, this._addBreakInfo, this);
      }*/
    },
    
    addBreak: function(min, max, symbol) {
      // 2nd method signature added at v2.0:
      // addBreak(<Object> info); 
      var info = dojo.isObject(min) ? min : { minValue: min, maxValue: max, symbol: symbol };
      this._addBreakInfo(info);
    },

    removeBreak: function(min, max) {
      var range, ranges = this.breaks,
          i, il = ranges.length,
          _syms = this._symbols;
      for (i=0; i<il; i++) {
        range = ranges[i];
        if (range[0] == min && range[1] == max) {
          ranges.splice(i, 1);
          delete _syms[min + "-" + max];
          this.infos.splice(i, 1);
          break;
        }
      }
    },

    getSymbol: function(graphic) {
      var val = parseFloat(graphic.attributes[this.attributeField]),
          rs = this.breaks,
          i, il = rs.length,
          _syms = this._symbols,
          range, incl = this.isMaxInclusive;
      
      for (i=0; i<il; i++) {
        range = rs[i];
        if (range[0] <= val && (incl ? (val <= range[1]) : (val < range[1])) ) {
          return _syms[range[0] + "-" + range[1]];
        }
      }
      
      return this.defaultSymbol;
    },
    
    /*******************
     * Internal Methods
     *******************/
    
    _setMaxInclusiveness: function(isInclusive) {
      this.isMaxInclusive = isInclusive;
    },
    
    _addBreakInfo: function(/*Object*/ info) {
      /*
       * info = {
       *   minValue: <Number>,
       *   maxValue: <Number>,
       *   symbol: <Symbol | json>,
       *   label: <String>,
       *   description: <String>
       * }
       */
      var min = info.minValue, max = info.maxValue;
      this.breaks.push([min, max]);
      this.infos.push(info);
      
      var symbol = info.symbol;
      if (symbol) {
        if (!symbol.declaredClass) { // symbol in its json form?
          info.symbol = esri.symbol.fromJson(symbol);
        }
      }
      this._symbols[min + "-" + max] = info.symbol;
      
      //this._sort();
    },

    toJson: function() {
      var infos = this.infos || [], sanitize = esri._sanitize;
      var minValue = infos[0] && infos[0].minValue;
      return sanitize({
        type: "classBreaks",
        field: this.attributeField,
        defaultSymbol: this.defaultSymbol && this.defaultSymbol.toJson(),
        defaultLabel: this.defaultLabel,
        minValue: (minValue === -Infinity) ? -Number.MAX_VALUE : minValue,
        classBreakInfos: dojo.map(infos, function(info) {
          info = dojo.mixin({}, info);
          info.symbol = info.symbol && info.symbol.toJson();
          info.classMaxValue = (info.maxValue === Infinity) ? Number.MAX_VALUE : info.maxValue;
          delete info.minValue;
          delete info.maxValue;
          return sanitize(info);
        })
      });
    }
    
    /*_sort: function() {
      this.breaks.sort(function(a, b) {
        var min1 = a[0], min2 = b[0];
        if (min1 < min2) {
          return -1;
        }
        if (min1 > min2) {
          return 1;
        }
        return 0;
      });

      this.infos.sort(function(a, b) {
        var min1 = a.minValue, min2 = b.minValue;
        if (min1 < min2) {
          return -1;
        }
        if (min1 > min2) {
          return 1;
        }
        return 0;
      });
    }*/
  }
);


/********************
 * Temporal Renderer
 ********************/

dojo.declare("esri.renderer.TemporalRenderer", esri.renderer.Renderer, {
  constructor: function(observationRenderer, latestObservationRenderer, trackRenderer, observationAger) {
    this.observationRenderer = observationRenderer;
    this.latestObservationRenderer = latestObservationRenderer;
    this.trackRenderer = trackRenderer;
    this.observationAger = observationAger;
  },

  // Uses internal feature layer members: _getKind, _map
  getSymbol: function(graphic) {
    var featureLayer = graphic.getLayer();
    var kind = featureLayer._getKind(graphic);
    
    var renderer = (kind === 0) ? this.observationRenderer 
                   : (this.latestObservationRenderer || this.observationRenderer);
    
    var symbol = (renderer && renderer.getSymbol(graphic));
    
    // age the symbol for regular observations
    var ager = this.observationAger;
    if (featureLayer.timeInfo && featureLayer._map.timeExtent && 
       (renderer === this.observationRenderer) && ager && symbol) {
      symbol = ager.getAgedSymbol(symbol, graphic);
    }
    
    return symbol;
  }
});


/***************
 * Symbol Agers
 ***************/
 
dojo.declare("esri.renderer.SymbolAger", null, {
  getAgedSymbol: function(symbol, graphic) {
    // to be implemented by subclasses
  },
  
  _setSymbolSize: function(symbol, size) {
    switch(symbol.type) {
      case "simplemarkersymbol":
        symbol.setSize(size);
        break;
      case "picturemarkersymbol":
        symbol.setWidth(size);
        symbol.setHeight(size);
        break;
      case "simplelinesymbol":
      case "cartographiclinesymbol":
        symbol.setWidth(size);
        break;
      case "simplefillsymbol":
      case "picturefillsymbol":
        if (symbol.outline) {
          symbol.outline.setWidth(size);
        }
        break;
    }
  }
});
 
dojo.declare("esri.renderer.TimeClassBreaksAger", esri.renderer.SymbolAger, {
  constructor: function(/*Object[]*/ infos, /*String?*/ timeUnits) {
    /*
     * [
     *   {
     *     minAge: <Number>,
     *     maxAge: <Number>,
     *     color: <dojo.Color>,
     *     size: <Number>,
     *     alpha: <Number>
     *   }
     *   ,...
     * ]
     */
    this.infos = infos;
    this.timeUnits = timeUnits || "day"; // see constants mixin below
    
    // re-arrange infos in incremental order
    infos.sort(function(a, b) {
      if (a.minAge < b.minAge) {
        return -1;
      }
      if (a.minAge > b.minAge) {
        return 1;
      }
      return 0;
    });
  },
  
  // Uses internal feature layer members: _map, _startTimeField
  getAgedSymbol: function(symbol, graphic) {
    var featureLayer = graphic.getLayer(), attributes = graphic.attributes, isDef = esri._isDefined;
    symbol = esri.symbol.fromJson(symbol.toJson());
    
    // get map time
    var mapTimeExtent = featureLayer._map.timeExtent;
    var mapEndTime = mapTimeExtent.endTime;
    if (!mapEndTime) {
      return symbol;
    }
    
    // get timestamp of the graphic
    var featureStartTime = new Date(attributes[featureLayer._startTimeField]);
    
    // find the difference between the above
    var diff = dojo.date.difference(featureStartTime, mapEndTime, this.timeUnits);
    
    // modify symbol based on the class break that the difference falls between
    dojo.some(this.infos, function(info) {
      if (diff >= info.minAge && diff <= info.maxAge) {
        var color = info.color, size = info.size, alpha = info.alpha;
        
        if (color) {
          symbol.setColor(color);
        }
        
        if (isDef(size)) {
          //symbol.setSize(size);
          this._setSymbolSize(symbol, size);
        }
        
        if (isDef(alpha) && symbol.color) {
          symbol.color.a = alpha;
        }
        
        return true;
      } // diff
    }, this);
    
    return symbol;
  }
});

dojo.mixin(esri.renderer.TimeClassBreaksAger, {
  UNIT_DAYS:         "day",         // default
  UNIT_HOURS:        "hour",
  UNIT_MILLISECONDS: "millisecond",
  UNIT_MINUTES:      "minute",
  UNIT_MONTHS:       "month",
  UNIT_SECONDS:      "second",
  UNIT_WEEKS:        "week",
  UNIT_YEARS:        "year"
});
 
dojo.declare("esri.renderer.TimeRampAger", esri.renderer.SymbolAger, {
  constructor: function(/*dojo.Color[]?*/ colorRange, /*Number[]?*/ sizeRange, /*Number[]?*/ alphaRange) {
    this.colorRange = colorRange; // || [ new dojo.Color([0,0,0,0.1]), new dojo.Color([0,0,255,1]) ];
    this.sizeRange = sizeRange; // || [ 2, 10 ];
    this.alphaRange = alphaRange;
  },
  
  // Uses internal feature layer members: _map, _startTimeField
  getAgedSymbol: function(symbol, graphic) {
    var featureLayer = graphic.getLayer(), attributes = graphic.attributes;
    symbol = esri.symbol.fromJson(symbol.toJson());
    
    // get map time
    var mapTimeExtent = featureLayer._map.timeExtent;
    var mapStartTime = mapTimeExtent.startTime, mapEndTime = mapTimeExtent.endTime;
    if (!mapStartTime || !mapEndTime) {
      return symbol;
    }
    mapStartTime = mapStartTime.getTime();
    mapEndTime = mapEndTime.getTime();
    
    // get timestamp of the graphic
    var featureStartTime = new Date(attributes[featureLayer._startTimeField]);
    featureStartTime = featureStartTime.getTime();
    if (featureStartTime < mapStartTime) {
      featureStartTime = mapStartTime;
    }
    
    // find the ratio
    var ratio = (mapEndTime === mapStartTime) ? 
                1 : 
                (featureStartTime - mapStartTime) / (mapEndTime - mapStartTime);
    
    // set size
    var range = this.sizeRange, color, delta;
    if (range) {
      var from = range[0], to = range[1];
      delta = Math.abs(to - from) * ratio;
      
      //symbol.setSize( (from < to) ? (from + delta) : (from - delta) );
      this._setSymbolSize(symbol, (from < to) ? (from + delta) : (from - delta));
    }
    
    // set color
    range = this.colorRange;
    if (range) {
      var fromColor = range[0], toColor = range[1], round = Math.round;
      color = new dojo.Color();
      
      // R
      var fromR = fromColor.r, toR = toColor.r;
      delta = Math.abs(toR - fromR) * ratio;
      color.r = round((fromR < toR) ? (fromR + delta) : (fromR - delta));
      
      // G
      var fromG = fromColor.g, toG = toColor.g;
      delta = Math.abs(toG - fromG) * ratio;
      color.g = round((fromG < toG) ? (fromG + delta) : (fromG - delta));
      
      // B
      var fromB = fromColor.b, toB = toColor.b;
      delta = Math.abs(toB - fromB) * ratio;
      color.b = round((fromB < toB) ? (fromB + delta) : (fromB - delta));
      
      // A
      var fromA = fromColor.a, toA = toColor.a;
      delta = Math.abs(toA - fromA) * ratio;
      color.a = (fromA < toA) ? (fromA + delta) : (fromA - delta);
      
      symbol.setColor(color);
    }
    
    // set alpha for color if available
    color = symbol.color;
    range = this.alphaRange;
    if (range && color) {
      var fromAlpha = range[0], toAlpha = range[1];
      delta = Math.abs(toAlpha - fromAlpha) * ratio;
      
      color.a = (fromAlpha < toAlpha) ? (fromAlpha + delta) : (fromAlpha - delta);
    }
    
    return symbol;
  }
});

});
