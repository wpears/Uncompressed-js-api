//>>built
// wrapped by build app
define("esri/PopupBase", ["dijit","dojo","dojox"], function(dijit,dojo,dojox){
dojo.provide("esri.PopupBase");


/*****************
 * esri.PopupBase
 *****************/

dojo.declare("esri.PopupBase", null, {
  
  /****************************
   * Properties:
   *   Graphic[] features
   *  Deferred[] deferreds
   *      Number count
   *      Number selectedIndex
   *      Symbol markerSymbol
   *      Symbol lineSymbol
   *      Symbol fillSymbol
   */
  
  /*********
   * Events
   *********/
  
  onSetFeatures: function() {
    //console.log("onSetFeatures");
  },
  
  onClearFeatures: function() {
    //console.log("onClearFeatures");
  },
  
  onSelectionChange: function() {
    //console.log("onSelectionChange");
  },
  
  onDfdComplete: function() {
    //console.log("onDfdComplete");
    
    var location = this._marked;
    if (location) {
      //console.log("=== enter ===");
      this._marked = null;
      this.showClosestFirst(location);
      //console.log("=== exit ===");
    }
  },
  
  /*****************
   * Public Methods
   *****************/

  initialize: function() {
    //console.log("initialize");
    this.count = 0;
    this.selectedIndex = -1;
  },
  
  cleanup: function() {
    this.features = this.deferreds = null;
  },
  
  setFeatures: function(/*Graphic[] or Deferred[]*/ arg) {
    if (!arg || !arg.length) {
      return;
    }
    
    // TODO
    // If some features in the input are already
    // being viewed in the popup, retain them. But
    // how does it work for deferreds?? Should we
    // retain the old features so that I can compare
    // when deferreds finish?
    
    this.clearFeatures();

    // classify
    var features, deferreds;
    if (arg[0] instanceof dojo.Deferred) {
      deferreds = arg; 
    }
    else {
      features = arg; 
    }

    //this.show();
    
    // process
    if (features) {
      this._updateFeatures(null, features);
    }
    else {
      this.deferreds = deferreds;
      
      // When selecting features in a feature collection, where
      // query operation is performed on the client, _updateFeatures
      // executes within the call to addCallback which ends up 
      // modifying the deferreds array and causing confusion in the
      // loop below by corrupting the positional index of deferreds
      // in the array. Let's create a new array and avodi this problem. 
      deferreds = deferreds.slice(0);
      
      dojo.forEach(deferreds, function(dfd) {
        dfd.addBoth(dojo.hitch(this, this._updateFeatures, dfd));
      }, this);
      //this._updateUI();
    }
    
    //dojo.removeClass(this._actionList, "hidden");
  },
  
  clearFeatures: function() {
    //this.setTitle("&nbsp;");
    //this.setContent("&nbsp;");
    //this._setPagerCallbacks(this);
    //dojo.addClass(this._actionList, "hidden");

    this.features = this.deferreds = this._marked = null;
    this.count = 0;

    var beforePtr = this.selectedIndex;
    this.selectedIndex = -1;

    /*this._updateUI();
    if (this._highlighted) {
      this._highlighted.hide();
    }*/
    
    if (beforePtr > -1) {
      this.onSelectionChange();
    }
    this.onClearFeatures();
  },
  
  /**************************************
   * Methods to manage feature selection
   **************************************/
  
  getSelectedFeature: function() {
    var features = this.features;
    if (features) {
      return features[this.selectedIndex];
    }
  },
  
  select: function(index) {
    if (index < 0 || index >= this.count) {
      return;
    }
    
    this.selectedIndex = index;
    this.onSelectionChange();
  },
  
  /************************************************
   * Helper methods to manage feature highlighting
   ************************************************/
  
  enableHighlight: function(map) {
    this._highlighted = map.graphics.add(new esri.Graphic(new esri.geometry.Point(0, 0, map.spatialReference)));
    this._highlighted.hide();
    
    var ESYM = esri.symbol;
    if (!this.markerSymbol) {
      var symbol = (this.markerSymbol = new ESYM.SimpleMarkerSymbol());
      symbol.setStyle(ESYM.SimpleMarkerSymbol.STYLE_TARGET);
      symbol._setDim(16, 16, 7);
      
      /*symbol.setOutline(new esri.symbol.SimpleLineSymbol(
        esri.symbol.SimpleLineSymbol.STYLE_SOLID,
        new dojo.Color([0, 255, 255]),
        2
      ));*/
     
      symbol.setOutline(new ESYM.CartographicLineSymbol(
        ESYM.SimpleLineSymbol.STYLE_SOLID,
        new dojo.Color([0, 255, 255]),
        2,
        ESYM.CartographicLineSymbol.CAP_ROUND,
        ESYM.CartographicLineSymbol.JOIN_ROUND
      ));
      
      symbol.setColor(new dojo.Color([0, 0, 0, 0]));
    }
    
    if (!this.lineSymbol) {
      this.lineSymbol = new ESYM.SimpleLineSymbol(
        ESYM.SimpleLineSymbol.STYLE_SOLID,
        new dojo.Color([0, 255, 255]),
        2
      );
    }
    
    if (!this.fillSymbol) {
      this.fillSymbol = new ESYM.SimpleFillSymbol(
        ESYM.SimpleFillSymbol.STYLE_NULL,
        new ESYM.SimpleLineSymbol(
          ESYM.SimpleLineSymbol.STYLE_SOLID,
          new dojo.Color([0, 255, 255]),
          2
        ),
        new dojo.Color([0, 0, 0, 0])
      );
    }
  },
  
  disableHighlight: function(map) {
    var highlighted = this._highlighted;
    if (highlighted) {
      highlighted.hide();
      map.graphics.remove(highlighted);
      delete this._highlighted;
    }
    
    this.markerSymbol = this.lineSymbol = this.fillSymbol = null;
  },
  
  showHighlight: function() {
    if (this._highlighted && this.features && this.features[this.selectedIndex]) {
      this._highlighted.show();
    }
  },
  
  hideHighlight: function() {
    if (this._highlighted) {
      this._highlighted.hide();
    }
  },
  
  updateHighlight: function(map, feature) {
    var geometry = feature.geometry, highlighted = this._highlighted;
    if (!geometry || !highlighted) {
      return;
    }
    
    highlighted.hide();
    
    if (!highlighted.getLayer() && map) {
      map.graphics.add(highlighted);
    }
    
    highlighted.setGeometry(esri.geometry.fromJson(geometry.toJson()));
    
    var symbol;
    switch(geometry.type) {
      case "point":
      case "multipoint":
        symbol = this.markerSymbol;
        
        symbol.setOffset(0, 0);
        symbol.setAngle(0);

        var lyr = feature.getLayer();
        if (lyr) {
          var realSymbol = lyr._getSymbol(feature),
              width, height, xoff = 0, yoff = 0, angle = 0;
              
          if (realSymbol) {
            switch(realSymbol.type) {
              case "simplemarkersymbol":
                width = height = (realSymbol.size || 0);
                break;
              case "picturemarkersymbol":
                width = (realSymbol.width || 0);
                height = (realSymbol.height || 0);
                break;
            }
            
            xoff = realSymbol.xoffset || 0;
            yoff = realSymbol.yoffset || 0;
            angle = realSymbol.angle || 0;
          } // realSymbol
          
          if (width && height) {
            //console.log("Inferred width and height = ", (width + 1), (height + 1));
            symbol._setDim(width + 1, height + 1, 7);
          }
          
          symbol.setOffset(xoff, yoff);
          symbol.setAngle(angle);
        }
        break;
      case "polyline":
        symbol = this.lineSymbol;
        break;
      case "polygon":
        symbol = this.fillSymbol;
        break;
    }
    highlighted.setSymbol(symbol);
  },
  
  showClosestFirst: function(location) {
    var features = this.features;
    
    if (features && features.length) {
      if (features.length > 1) {
        //console.log("_moveClosestToFront processing...");
        
        var i, minDistance = Infinity, closestIdx = -1, geom,
            getLength = esri.geometry.getLength, distance;
        
        for (i = features.length - 1; i >= 0; i--) {
          geom = features[i].geometry;
          distance = 0;
          
          try {
            distance = (geom.type === "point") ? 
                        getLength(location, geom) : 
                        getLength(location, geom.getExtent().getCenter());
          }
          catch(e) {
            // ssshhh...squelch
            // We'll silently ignore this exceptions since "moveClosestToFront" 
            // is not a critical operation
          }
          
          //console.log("distance = ", distance, i);
          if (distance > 0 && distance < minDistance) {
            minDistance = distance;
            closestIdx = i;
          }
        }
        
        if (closestIdx > 0) {
          //console.log("closest = ", closestIdx);
          features.splice( 0, 0, features.splice(closestIdx, 1)[0] );
          this.select(0);
        }
      }
    }
    else if (this.deferreds) {
      //console.log("marking....");
      this._marked = location;
    }
  },
  
  /*******************
   * Internal Methods
   *******************/
  
  _unbind: function(dfd) {
    var index = dojo.indexOf(this.deferreds, dfd);
    if (index === -1) {
      return; // dfd not found
    }
    
    this.deferreds.splice(index, 1);
    if (!this.deferreds.length) {
      this.deferreds = null;
      return 2; // indicates we received results from all expected deferreds
    }
    
    return 1; // dfd found and removed
  },
  
  _updateFeatures: function(dfd, features) {
    //console.log("REGISTER: ", arguments);
    
    if (dfd) {
      if (this.deferreds) {
        var res = this._unbind(dfd);
        if (!res) {
          // dfd not in the current working set
          //console.log("Ignoring dfd...");
          return;
        }

        if (features && features instanceof Error) {
          // discard err-ed out dfd
          //console.log("Error case: ", features);
          //this._updateUI();
          
          this.onDfdComplete(features);
          if (res === 2) {
            this.onSetFeatures();
          }
          return;
        }
        
        if (features && features.length) {
          if (!this.features) {
            this.features = features;
            this.count = features.length;
            this.selectedIndex = 0;
            
            /*this._updateUI();
            if (res === 2) {
              this.onSetFeatures();
            }
            this._displayFeature(true);*/
           
            this.onDfdComplete();
            if (res === 2) {
              this.onSetFeatures();
            }
            this.select(0);
          }
          else {
            //this.features = this.features.concat(features);

            // TODO
            // TEST
            // Verify that duplicate features are ignored
            
            var filtered = dojo.filter(features, function(feature) {
              return dojo.indexOf(this.features, feature) === -1;
            }, this);
            
            this.features = this.features.concat(filtered);
            this.count = this.features.length;
            
            //this._updateUI();
            this.onDfdComplete();
            if (res === 2) {
              this.onSetFeatures();
            }
          }
        }
        else {
          //this._updateUI();
          this.onDfdComplete();
          if (res === 2) {
            this.onSetFeatures();
          }
        }
      }
    }
    else {
      this.features = features;
      this.count = features.length;
      this.selectedIndex = 0;
      
      /*this._updateUI();
      this.onSetFeatures();
      this._displayFeature(true);*/
     
      this.onSetFeatures();
      this.select(0);
    }
  }
});


/*************************
 * esri.PopupInfoTemplate
 * 
 * Sub-classes MUST override getTitle and getContent methods
 * and can make use of helpers: getComponents and getAttachments
 *************************/

dojo.declare("esri.PopupInfoTemplate", [ esri.InfoTemplate ], {
  "-chains-": {
    // Incompatible constructor arguments. So let's cut-off
    // the inheritance chain. Note also that sub-classes have
    // to explicitly call the ctor of this class like this:
    // this.inherited(arguments);
    constructor: "manual"
  },
  
  initialize: function(json) {
    // Spec for "json":
    // http://mediawikidev.esri.com/index.php/ArcGIS.com/V1.2#Popups

    if (!json) {
      return;
    }
    
    this.info = json;
    
    // InfoTemplate API defines title and content that
    // can be functions. Wire them up.
    this.title = this.getTitle;
    this.content = this.getContent;
    
    // Store field info in a dictionary for later use
    var flabels = (this._fieldLabels = {}),
        fmaps = (this._fieldsMap = {});
    if (json.fieldInfos) {
      dojo.forEach(json.fieldInfos, function(fieldInfo) {
        flabels[fieldInfo.fieldName] = fieldInfo.label;
        fmaps[fieldInfo.fieldName] = fieldInfo;
      });
    }
  },
  
  toJson: function() {
    return dojo.fromJson(dojo.toJson(this.info));
  },
  
  getTitle: function(/* graphic */) {
    // To be implemented by sub-classes
  },
  
  getContent: function(/* graphic */) {
    // To be implemented by sub-classes
  },
  
  /*****************
   * Helper Methods
   *****************/
  
  getComponents: function(graphic) {
    var popupInfo = this.info,
        layer = graphic.getLayer(),
        attributes = dojo.clone(graphic.attributes) || {},
        formatted = dojo.clone(attributes),
        fieldInfos = popupInfo.fieldInfos,
        titleText = "", descText = "", tableView, fieldName, value,
        properties = layer && layer._getDateOpts && layer._getDateOpts().properties,
        substOptions = {
          // FeatureLayer::_getDateOpts caches result, but we're going to
          // add "formatter" to it. So, lets create a new object
          dateFormat: {
            properties: properties,
            formatter: "DateFormat" + this._dateFormats["shortDateShortTime"]
          }
        };
    
    if (fieldInfos) {
      //this._format(formatted, fieldInfos, substOptions, this._fieldLabels, this._fieldsMap);

      // Format values as per fieldInfos and keep them handy
      dojo.forEach(fieldInfos, function(fieldInfo) {
        var fieldName = fieldInfo.fieldName, val = formatted[fieldName];
        
        formatted[fieldName] = this._formatValue(val, fieldName, substOptions);
        
        // Let's not double format this field, so remove it from the generic
        // "properties" list
        if (properties && fieldInfo.format && fieldInfo.format.dateFormat) {
          var pos = dojo.indexOf(properties, fieldName);
          if (pos > -1) {
            properties.splice(pos, 1);
          }
        }
        
      }, this);
    }
    
    if (layer) {
      var types = layer.types,
          typeField = layer.typeIdField,
          typeId = typeField && attributes[typeField];

      for (fieldName in attributes) {
        value = attributes[fieldName];
        
        if (esri._isDefined(value)) {
          var domainName = this._getDomainName(layer, types, typeId, fieldName, value);
          if (esri._isDefined(domainName)) {
            formatted[fieldName] = domainName;
          }
          else if (fieldName === typeField) {
            var typeName = this._getTypeName(layer, value);
            if (esri._isDefined(typeName)) {
              formatted[fieldName] = typeName;
            }
          }
        }
        
      } // loop
    }
    
    // Main Section: title
    if (popupInfo.title) {
      titleText = dojo.trim(esri.substitute(formatted, this._fixTokens(popupInfo.title), substOptions) || "");
      //console.log("Title text = ", titleText);
    }
    
    // Main Section: description
    if (popupInfo.description) {
      descText = dojo.trim(esri.substitute(formatted, this._fixTokens(popupInfo.description), substOptions) || "");
      //console.log("Desc text = ", descText);
    }
    
    if (fieldInfos) {
      tableView = [];
      
      dojo.forEach(fieldInfos, function(fieldInfo) {
        fieldName = fieldInfo.fieldName;
        if (fieldName && fieldInfo.visible) {
          tableView.push([
            // Field Name:
            fieldInfo.label || fieldName,

            // Field Value:
            esri.substitute(formatted, "${" + fieldName + "}", substOptions) || ""
          ]);
        }
      });
    }

    // Filter out mediaInfos for which one of the following is true:
    // image:
    //  - no sourceURL (invalid mediaInfo)
    //  - feature does not have a value for sourceURL field
    // chart:
    //  - type not one of pie, line, column, bar
    //  - feature does not have values for any of the fields
    var filteredMedia, valid;
    
    if (popupInfo.mediaInfos) {
      filteredMedia = [];
      
      dojo.forEach(popupInfo.mediaInfos, function(minfo) {
        valid = 0;
        value = minfo.value;
        
        switch(minfo.type) {
          case "image":
            var url = value.sourceURL;
            url = url && dojo.trim(esri.substitute(attributes, this._fixTokens(url)));
            //console.log("URL = ", url);
            valid = !!url;
            break;
            
          case "piechart":
          case "linechart":
          case "columnchart":
          case "barchart":
            valid = dojo.some(value.fields, function(field) {
                     return esri._isDefined(attributes[field]);
                   });
            break;
            
          default:
            return;
        }
        
        if (valid) {
          // Clone media info, make substitutions and push into the 
          // outgoing array
          minfo = dojo.clone(minfo);
          value = minfo.value;
          
          minfo.title = minfo.title ? dojo.trim(esri.substitute(formatted, this._fixTokens(minfo.title), substOptions) || "") : "";
          //console.log("Media title text = ", minfo.title);
          
          minfo.caption = minfo.caption ? dojo.trim(esri.substitute(formatted, this._fixTokens(minfo.caption), substOptions) || "") : "";
          //console.log("Media caption text = ", minfo.caption);
          
          if (minfo.type === "image") {
            value.sourceURL = esri.substitute(attributes, this._fixTokens(value.sourceURL));
            
            if (value.linkURL) {
              value.linkURL = dojo.trim(esri.substitute(attributes, this._fixTokens(value.linkURL)) || "");
            }
          }
          else { // chart
            var normalizer = attributes[value.normalizeField] || 0;
            
            value.fields = dojo.map(value.fields, function(fieldName) {
              var data = attributes[fieldName];
              // NOTE
              // Not clear why charting code does not equate
              // undefined values to null
              data = (data === undefined) ? null : data; 
              if (data && normalizer) {
                data = data / normalizer;
                //console.log("[PIE] Normalized data = ", data);
              }
              
              return {
                y: data,
                tooltip: (this._fieldLabels[fieldName] || fieldName) + ":<br/>" + this._formatValue(data, fieldName, substOptions) // formatted[fieldName]
              };
            }, this);
          }
          
          filteredMedia.push(minfo);
        }
      }, this);
    }
    
    return {
      title: titleText,
      description: descText,
      fields: (tableView && tableView.length) ? tableView : null,
      mediaInfos: (filteredMedia && filteredMedia.length) ? filteredMedia : null,
      formatted: formatted,
      editSummary: (layer && layer.getEditSummary) ? layer.getEditSummary(graphic) : ""
    };
  },
  
  getAttachments: function(graphic) {
    var layer = graphic.getLayer(), attributes = graphic.attributes;
    
    if (this.info.showAttachments && layer && layer.hasAttachments && layer.objectIdField) {
      var oid = attributes && attributes[layer.objectIdField];
      if (oid) {
        return layer.queryAttachmentInfos(oid);
      }
    }
  },
  
  /*******************
   * Internal Members
   *******************/
  
  _dateFormats: {
    "shortDate":            "(datePattern: 'M/d/y', selector: 'date')",
    "longMonthDayYear":     "(datePattern: 'MMMM d, y', selector: 'date')", 
    "dayShortMonthYear":    "(datePattern: 'd MMM y', selector: 'date')", 
    "longDate":             "(datePattern: 'EEEE, MMMM d, y', selector: 'date')", 
    "shortDateShortTime":   "(datePattern: 'M/d/y', timePattern: 'h:mm a', selector: 'date and time')", 
    "shortDateShortTime24": "(datePattern: 'M/d/y', timePattern: 'H:mm', selector: 'date and time')", 
    "longMonthYear":        "(datePattern: 'MMMM y', selector: 'date')", 
    "shortMonthYear":       "(datePattern: 'MMM y', selector: 'date')",
    "year":                 "(datePattern: 'y', selector: 'date')"
  },
  
  _fixTokens: function(template) {
    // Replace {xyz} with ${xyz}
    
    // Note: existing ${xyz} are retained. 
    // Update: We may not be able to support this case because a 
    // arcgis.com user might enter a monetary value like this: 
    // ${AMOUNT} where expected result is: $10000.
    // This means that a popupInfo constructed in an app built 
    // using the JSAPI cannot use the ${TOKEN} format either as it
    // gets ambiguous
    //return template.replace(/\$?(\{[^\{\r\n]+\})/g, "$$$1");
    return template.replace(/(\{[^\{\r\n]+\})/g, "$$$1");
  },
  
  _formatValue: function(val, fieldName, substOptions) {
    var fieldInfo = this._fieldsMap[fieldName], 
        fmt = fieldInfo && fieldInfo.format;
    
    if (!esri._isDefined(val) || !fieldInfo || 
        !esri._isDefined(fmt)
    ) {
      return val;
    }
    
    var formatterFunc = "", options = [],
        isNumberFormat = fmt.hasOwnProperty("places") || fmt.hasOwnProperty("digitSeparator"),
        digitSep = fmt.hasOwnProperty("digitSeparator") ? fmt.digitSeparator : true;
    
    if (isNumberFormat) {
      formatterFunc = "NumberFormat";
      
      options.push("places: " + (esri._isDefined(fmt.places) ? Number(fmt.places) : "Infinity"));
      
      if (options.length) {
        formatterFunc += ("(" + options.join(",") + ")");
      }
    }
    else if (fmt.dateFormat) {
      // guard against unknown format string
      formatterFunc = "DateFormat" + (this._dateFormats[fmt.dateFormat] || this._dateFormats["shortDateShortTime"]);
    }
    else {
      // unknown format definition
      return val;
    }

    //console.log("formatterFunc = ", formatterFunc);
    
    var formattedValue = esri.substitute(
      { "myKey": val }, 
      "${myKey:" + formatterFunc + "}", 
      substOptions
    ) || "";
    
    // Remove digit separator if not required
    if (isNumberFormat && !digitSep) {
      var bundle = dojo.i18n.getLocalization("dojo.cldr", "number");
          
      if (bundle.group) {
        formattedValue = formattedValue.replace(new RegExp("\\" + bundle.group, "g"), "");
      }
    }
    
    //console.log("Formatted: ", fieldName, ": ", formattedValue);
    
    return formattedValue;
  },

  _getDomainName: function(layer, types, typeId, fieldName, value) {
    var domain, stop;

    // start looking for domain in sub-types
    if (types && esri._isDefined(typeId)) {
      
      dojo.some(types, function(typeInfo) {
        if (typeInfo.id == typeId) {
          domain = typeInfo.domains && typeInfo.domains[fieldName];
          
          if (domain && domain.type === "inherited") {
            // let's find out if the field has a domain defined
            // in the layer's fields description
            domain = this._getLayerDomain(layer, fieldName);
            
            stop = true; // indicates that layer.fields has been searched.
          }
          
          // Note that a sub-type with no domain implies
          // no domains for all fields. Shouldnt go looking
          // for domain defined in layer's fields description
          
          return true;
        }
        return false;
      }, this);
    }
    
    
    if (!stop && !domain) {
      domain = this._getLayerDomain(layer, fieldName);
    }
    
    // Let's find out the domain name from its code value
    if (domain && domain.codedValues) {
      var domainName;
      
      dojo.some(domain.codedValues, function(codedValue) {
        if (codedValue.code == value) {
          domainName = codedValue.name;
          return true;
        }
        return false;
      });
      
      return domainName;
    }
  },
  
  _getLayerDomain: function(layer, fieldName) {
    var fields = layer.fields;
    if (fields) {
      var domain; 
      
      dojo.some(fields, function(fieldInfo) {
        if (fieldInfo.name === fieldName) {
          domain = fieldInfo.domain;
          return true;
        }
        return false;
      });
      
      return domain;
    }
  },
  
  _getTypeName: function(layer, id) {
    var types = layer.types;
    if (types) {
      var typeName;
      
      dojo.some(types, function(typeInfo) {
        if (typeInfo.id == id) {
          typeName = typeInfo.name;
          return true;
        }
        return false;
      });
      
      return typeName;
    }
  }
});

});
