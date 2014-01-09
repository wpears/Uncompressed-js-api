//>>built
// wrapped by build app
define("esri/arcgis/csv", ["dijit","dojo","dojox","dojo/require!dojox/data/CsvStore"], function(dijit,dojo,dojox){
dojo.provide("esri.arcgis.csv");

dojo.require("dojox.data.CsvStore");

(function(){

  var EAC = esri.arcgis.csv;
  
  EAC.latFieldStrings = ["lat", "latitude", "y", "ycenter", "latitude83", "latdecdeg", "POINT-Y"];
  EAC.longFieldStrings = ["lon", "lng", "long", "longitude", "x", "xcenter", "longitude83", "longdecdeg", "POINT-X"];
  
  /*****************
   * Public methods
   *****************/
  /* layerJson = 
   {"type": "CSV",
   "url": "http://www.arcgis.com/xxx/sales.csv",
   "id": "Sales",
   "visibility": true,
   "opacity": 1,
   "title": "Sales" ,
   "layerDefinition" : {
   },
   "popupInfo" : {
   },
   "locationInfo" : {
   "locationType": coordinates | address | lookup,
   "latitudeFieldName" : If locationType = coordinates, the name of the field which contains the Y coordinate
   "longitudeFieldName" : If locationType = coordinates, the name of the field which contains the X coordinate
   "addressTemplate" :  if locationType = address, a string value which defines the address to find based on CSV field values.  Example: "{Address} {City}, {State} {Zip}"
   }
   */
  EAC.buildCSVFeatureCollection = function(layerJson){
  
    var deferred = new dojo.Deferred();
    
    var processCSVDataHandler = function(featureCollection){
      deferred.callback(featureCollection);
    };
    
    var requestHandle = esri.request({
      url: layerJson.url,
      handleAs: "text",
      load: function(response){
        EAC._processCsvData(response, layerJson, dojo.hitch(this, processCSVDataHandler));
      },
      error: function(error){
        console.error("error: " + error);
      }
    }, {
      usePost: false
    });
    
    return deferred;
  };
  
  EAC.projectFeatureCollection = function(featureCollection, outSR){
  
    var deferred = new dojo.Deferred();
    
    var projectFeatureSetHandler = function(featureCollection2){
      deferred.callback(featureCollection2);
    };
    
    EAC._projectFeatureSet(featureCollection, new esri.SpatialReference({
      wkid: 4326
    }), outSR, dojo.hitch(this, projectFeatureSetHandler));
    
    return deferred;
  };
  
  EAC.generateDefaultPopupInfo = function(featureCollection){
    var fields = featureCollection.layerDefinition.fields;
    
    var decimal = {
      'esriFieldTypeDouble': 1,
      'esriFieldTypeSingle': 1
    };
    
    var integer = {
      'esriFieldTypeInteger': 1,
      'esriFieldTypeSmallInteger': 1
    };
    
    var dt = {
      'esriFieldTypeDate': 1
    };
    
    var displayField = null;
    var fieldInfos = dojo.map(fields, dojo.hitch(this, function(item){
    
      if (item.name.toUpperCase() === "NAME") {
        displayField = item.name;
      }
      var visible = (item.type !== "esriFieldTypeOID" && item.type !== "esriFieldTypeGlobalID" && item.type !== "esriFieldTypeGeometry");
      var format = null;
      
      if (visible) {
        var f = item.name.toLowerCase();
        var hideFieldsStr = ",stretched value,fnode_,tnode_,lpoly_,rpoly_,poly_,subclass,subclass_,rings_ok,rings_nok,";
        
        if (hideFieldsStr.indexOf("," + f + ",") > -1 || f.indexOf("area") > -1 || f.indexOf("length") > -1 ||
        f.indexOf("shape") > -1 ||
        f.indexOf("perimeter") > -1 ||
        f.indexOf("objectid") > -1 ||
        f.indexOf("_") === f.length - 1 ||
        (f.indexOf("_i") === f.length - 2 && f.length > 1)) {
          visible = false;
        }
        if (item.type in integer) {
          format = {
            places: 0,
            digitSeparator: true
          };
        } else if (item.type in decimal) {
          format = {
            places: 2,
            digitSeparator: true
          };
        } else if (item.type in dt) {
          format = {
            dateFormat: 'shortDateShortTime'
          };
        }
      }
      
      return dojo.mixin({}, {
        fieldName: item.name,
        label: item.alias,
        isEditable: true,
        tooltip: "",
        visible: visible,
        format: format,
        stringFieldOption: 'textbox'
      });
    }));
    
    var popupInfo = {
      title: displayField ? '{' + displayField + '}' : '',
      fieldInfos: fieldInfos,
      description: null,
      showAttachments: false,
      mediaInfos: []
    };
    return popupInfo;
  };
  
  /*****************
   * Internal methods
   *****************/
  EAC._processCsvData = function(data, layerJson, handler){
    var newLineIdx = data.indexOf("\n");
    var firstLine = dojo.trim(data.substr(0, newLineIdx)); //remove extra whitespace, not sure if I need to do this since I threw out space delimiters
    var separator = layerJson.columnDelimiter;
    if (!separator) {
      separator = EAC._getSeparator(firstLine);
    }
    
    var csvStore = new dojox.data.CsvStore({
      data: data,
      separator: separator
    });
    var count = (dojo.isIE < 9) ? 750 : 1001;
    csvStore.fetch({
      start: 0,
      count: count,
      onComplete: function(items, request){
        var objectId = 0;
        
        var featureCollection = {
          "layerDefinition": layerJson.layerDefinition,
          "featureSet": {
            "features": [],
            "geometryType": "esriGeometryPoint"
          }
        };
        
        var objectIdFieldName = featureCollection.layerDefinition.objectIdField;
        if (!objectIdFieldName) {
          if (!dojo.some(featureCollection.layerDefinition.fields, function(field){
            if (field.type == 'esriFieldTypeOID') {
              objectIdFieldName = field.name;
              return true;
            }
            return false;
          })) {
            featureCollection.layerDefinition.fields.push({
              "name": "__OBJECTID",
              "alias": "__OBJECTID",
              "type": "esriFieldTypeOID",
              "editable": false,
              "domain": null
            });
            objectIdFieldName = "__OBJECTID";
          }
        }
        
        var latField, longField;
        
        // var fieldNames = csvStore.getAttributes(items[0]); if first item has null values we end up missing fields 
        var fieldNames = csvStore._attributes;
        
        var dateFieldPosList = [];
        var numberFieldPosList = [];
        dojo.forEach(featureCollection.layerDefinition.fields, function(field, index){
          if (field.type === "esriFieldTypeDate") {
            dateFieldPosList.push(field.name);
          } else if (field.type === "esriFieldTypeDouble" || field.type === "esriFieldTypeInteger") {
            numberFieldPosList.push(field.name);
          }
        });
        
        if (layerJson.locationInfo && layerJson.locationInfo.locationType === "coordinates") {
          latField = layerJson.locationInfo.latitudeFieldName;
          longField = layerJson.locationInfo.longitudeFieldName;
        } else {
          dojo.forEach(fieldNames, function(fieldName){
            var matchId;
            matchId = dojo.indexOf(EAC.latFieldStrings, fieldName.toLowerCase());
            if (matchId !== -1) {
              latField = fieldName;
            }
            
            matchId = dojo.indexOf(EAC.longFieldStrings, fieldName.toLowerCase());
            if (matchId !== -1) {
              longField = fieldName;
            }
          }, this);
        }
        
        if (!latField || !longField) {
          // otherwise dialog doesn't show up in IE or Safari
          setTimeout(function(){
            console.error("File does not seem to contain fields with point coordinates.");
          }, 1);
          return;
        }
        
        // Add records in this CSV store as graphics
        var i = 0, il = items.length;
        for (i; i < il; i++) {
          if (featureCollection.featureSet.features.length >= 1000) {
            // setTimeout for Safari
            setTimeout(function(){
              console.error("1000 feature limit reached. Unable to load any more data.");
            }, 1);
            break;
          }
          
          var item = items[i];
          
          var attrs = csvStore.getAttributes(item), attributes = {};
          
          // Read all the attributes for  this record/item
          dojo.forEach(attrs, function(attr, index){
        	  
            if (attr) {
				var origAttr = attr;
				if (attr.length === 0) {
					dojo.forEach(featureCollection.layerDefinition.fields, function(field, idx){
						if (field.name === "attribute_" + (idx - 1)) {
							attr = "attribute_" + (idx - 1);
						}
					});
				}
				
                // objectId field is added as first field...
                if (dojo.some(dateFieldPosList, function(a){
                  return a === attr;
                })) {
                  // date field
                  var val = csvStore.getValue(item, origAttr), date = new Date(val);
                  attributes[attr] = EAC._isValidDate(date, val) ? date.getTime() : null;
                } else if (dojo.some(numberFieldPosList, function(a){
                  return a === attr;
                })) {
                  // number fields
                  var value = dojo.number.parse(csvStore.getValue(item, origAttr));
                  if ((attr == latField || attr == longField) && (isNaN(value) || Math.abs(value) > 181)) {
                    // locale set to english:
                    // dojo.number.parse works fine for 1.234
                    // dojo.number.parse returns 1234 for 1,234
                    // dojo.number.parse returns NaN for 1,2345
                    // parseFloat returns 1 for 1,234
                    // locale set to french:
                    // dojo.number.parse works fine for 1,234
                    // dojo.number.parse returns 1234 for 1.234
                    // dojo.number.parse returns NaN for 1.2345
                    // parseFloat works for 1.234
                    value = parseFloat(csvStore.getValue(item, origAttr));
                    if (isNaN(value)) {
                      attributes[attr] = null;
                    } else {
                      attributes[attr] = value;
                    }
                  } else if (isNaN(value)) {
                    attributes[attr] = null;
                  } else {
                    attributes[attr] = value;
                  }
                } else {
                  attributes[attr] = csvStore.getValue(item, origAttr);
                }
            } // else CSV file bad. Line has more values than fields
          });
          
          attributes[objectIdFieldName] = objectId;
          objectId++;
          
          var latitude = attributes[latField];
          var longitude = attributes[longField];
          
          // values are null if field is type number, but actual value is a string
          if (longitude == null || latitude == null || isNaN(latitude) || isNaN(longitude)) {
            continue;
          }
          
          var geometry = new esri.geometry.Point(longitude, latitude, new esri.SpatialReference({
            wkid: 4326
          }));
          var feature = {
            "geometry": geometry.toJson(),
            "attributes": attributes
          };
          featureCollection.featureSet.features.push(feature);
        }
        
        featureCollection.layerDefinition.name = "csv";
        
        if (handler) {
          handler(featureCollection);
        }
        
      },
      onError: function(error){
        console.error("Error fetching items from CSV store: ", error);
      }
    });
    
    return true;
  };
  
  EAC._getSeparator = function(string){
    var separators = [",", " ", ";", "|", "\t"];
    var maxSeparatorLength = 0;
    var maxSeparatorValue = "";
    dojo.forEach(separators, function(separator){
      var length = string.split(separator).length;
      if (length > maxSeparatorLength) {
        maxSeparatorLength = length;
        maxSeparatorValue = separator;
      }
    });
    return maxSeparatorValue;
  };
  
  EAC._isValidDate = function(d, strValue){
    if (!d || Object.prototype.toString.call(d) !== "[object Date]" || isNaN(d.getTime())) {
      return false;
    }
    
    var isDate = true;
    
    // Check for false positives in Chrome where the following strings are
    // parsed as Date objects:
    //   new Date("technology 10")
    //   new Date("http://a.com/b/c/570")
    // Related bug: http://code.google.com/p/chromium/issues/detail?id=53209
    // The situation is a real mess.
    // http://www.google.com/codesearch#search&q=DateParseString+package:http://v8\.googlecode\.com
    // http://www.google.com/codesearch#W9JxUuHYyMg/trunk/src/dateparser-inl.h
    // Note these comments in dateparser-inl.h:
    //   Any unrecognized word before the first number is ignored.
    //   Garbage words are illegal if a number has been read.
    // http://code.google.com/p/v8/source/browse/trunk/src/date.js#1056
    // http://code.google.com/p/v8/source/browse/trunk/src/date.js#534
    
    // IMPORTANT NOTE
    // If this routine is updated, make sure esri\arcgisonline\map\fileImport.js
    // is updated as well
    
    if (dojo.isChrome && /\d+\W*$/.test(strValue)) { // strings ends with a number
      var match = strValue.match(/[a-zA-Z]{2,}/);
      if (match) { // process all words that have only alphabet characters
        var garbageFound = false, i = 0, len = match.length, reKeywords = /^((jan(uary)?)|(feb(ruary)?)|(mar(ch)?)|(apr(il)?)|(may)|(jun(e)?)|(jul(y)?)|(aug(ust)?)|(sep(tember)?)|(oct(ober)?)|(nov(ember)?)|(dec(ember)?)|(am)|(pm)|(gmt)|(utc))$/i;
        
        while (!garbageFound && (i <= len) && !(garbageFound = !reKeywords.test(match[i]))) {
          i++;
        }
        
        isDate = !garbageFound;
      }
    }
    
    return isDate;
  };
  
  EAC._projectFeatureSet = function(fcLayer, oldSpatialReference, newSpatialReference, handler){
    if (!fcLayer.featureSet || fcLayer.featureSet.length === 0) {
      return;
    }
    
    if (EAC._sameSpatialReference(newSpatialReference, oldSpatialReference)) {
      handler(fcLayer);
      return;
    }
    
    var projectHandler = function(jsonGeometries){
      var newFeatures = [];
      dojo.forEach(fcLayer.featureSet.features, function(feature, i){
        if (jsonGeometries[i]) {
          feature.geometry = jsonGeometries[i];
          newFeatures.push(feature);
        } // else feature could not get projected; take it out
      }, this);
      // fcLayer.featureSet.features = newFeatures;
      // update extent
      //results in bad JSON in config fcLayer.layerDefinition.extent = esri.arcgisonline.map.featColl.getFeatureSetFullExtent(fcLayer.featureSet);
      handler(fcLayer);
    };
    
    var projectErrorHandler = function(result, args){
      console.error("error projecting featureSet (" + fcLayer.layerDefinition.name + "). Try one more time.");
      // give it one more try
      EAC._projectGeometries(geometries, fcLayer.featureSet.geometryType, oldSpatialReference, newSpatialReference, dojo.hitch(this, projectHandler), dojo.hitch(this, finalProjectErrorHandler));
    };
    
    var finalProjectErrorHandler = function(result, args){
      // don't do anything
      console.error("error projecting featureSet (" + fcLayer.layerDefinition.name + "). Final try.");
      // fcLayer.layerDefinition.extent = null;
      handler(fcLayer);
    };
    
    if (fcLayer.featureSet.features && fcLayer.featureSet.features.length > 0) {
      var geometries = [];
      dojo.forEach(fcLayer.featureSet.features, function(feature){
        geometries.push(feature.geometry);
      });
      EAC._projectGeometries(geometries, fcLayer.featureSet.geometryType, oldSpatialReference, newSpatialReference, dojo.hitch(this, projectHandler), dojo.hitch(this, projectErrorHandler));
    } else {
      // fcLayer.layerDefinition.extent = null;
      handler(fcLayer);
    }
  };
  
  EAC._projectGeometries = function(jsonGeometries, geometryType, inSR, outSR, handler, errorHandler){
    if (jsonGeometries.length === 0) {
      handler(null);
    }
    
    // build esri.Geometry objects 
    var Geometry = esri.geometry.getGeometryType(geometryType);
    var geometries = [];
    dojo.forEach(jsonGeometries, function(jsonGeometry){
      var geometry = new Geometry(jsonGeometry);
      geometry.spatialReference = inSR;
      geometries.push(geometry);
    }, this);
    
    var mercator = [102113, 102100, 3857];
    if (inSR.wkid && inSR.wkid === 4326 && outSR.wkid && dojo.indexOf(mercator, outSR.wkid) > -1) {
    
      dojo.forEach(geometries, function(geometry){
        // clip it, so it's not going to Infinity
        if (geometry.xmin) {
          geometry.xmin = Math.max(geometry.xmin, -180);
          geometry.xmax = Math.min(geometry.xmax, 180);
          geometry.ymin = Math.max(geometry.ymin, -89.99);
          geometry.ymax = Math.min(geometry.ymax, 89.99);
        } else if (geometry.rings) {
          dojo.forEach(geometry.rings, function(ring){
            dojo.forEach(ring, function(point){
              point[0] = Math.min(Math.max(point[0], -180), 180);
              point[1] = Math.min(Math.max(point[1], -89.99), 89.99);
            }, this);
          }, this);
        } else if (geometry.paths) {
          dojo.forEach(geometry.paths, function(path){
            dojo.forEach(path, function(point){
              point[0] = Math.min(Math.max(point[0], -180), 180);
              point[1] = Math.min(Math.max(point[1], -89.99), 89.99);
            }, this);
          }, this);
        } else if (geometry.x) {
          geometry.x = Math.min(Math.max(geometry.x, -180), 180);
          geometry.y = Math.min(Math.max(geometry.y, -89.99), 89.99);
        }
      }, this);
      
      jsonGeometries = [];
      dojo.forEach(geometries, function(geometry){
        var outGeometry = esri.geometry.geographicToWebMercator(geometry);
        if (outSR.wkid !== 102100) {
          // geographicToWebMercator returns 102100; make sure it's what we want
          outGeometry.spatialReference = outSR;
        }
        jsonGeometries.push(outGeometry.toJson());
      }, this);
      handler(jsonGeometries);
      
    } else if (inSR.wkid !== null && dojo.indexOf(mercator, inSR.wkid) > -1 && outSR.wkid !== null && outSR.wkid === 4326) {
    
      jsonGeometries = [];
      dojo.forEach(geometries, function(geometry){
        jsonGeometries.push(esri.geometry.webMercatorToGeographic(geometry).toJson());
      }, this);
      handler(jsonGeometries);
      
    } else {
    
      var projectHandler = function(result, args){
        // check if response is valid
        // [{"type":"extent","xmin":NaN,"ymin":NaN,"xmax":NaN,"ymax":NaN,"spatialReference":{"wkid":29902,"wkt":null,"declaredClass":"esri.SpatialReference"},"declaredClass":"esri.geometry.Extent"}]
        if (result && result.length === jsonGeometries.length) {
          jsonGeometries = [];
          dojo.forEach(result, function(geometry){
            if (geometry &&
            ((geometry.rings && geometry.rings.length > 0 && geometry.rings[0].length > 0 && geometry.rings[0][0].length > 0 && !isNaN(geometry.rings[0][0][0]) && !isNaN(geometry.rings[0][0][1])) ||
            (geometry.paths && geometry.paths.length > 0 && geometry.paths[0].length > 0 && geometry.paths[0][0].length > 0 && !isNaN(geometry.paths[0][0][0]) && !isNaN(geometry.paths[0][0][1])) ||
            (geometry.xmin && !isNaN(geometry.xmin) && geometry.ymin && !isNaN(geometry.ymin)) ||
            (geometry.x && !isNaN(geometry.x) && geometry.y && !isNaN(geometry.y)))) {
              jsonGeometries.push(geometry.toJson());
            } else {
              // invalid geometry
              jsonGeometries.push(null);
            }
          }, this);
          handler(jsonGeometries);
        } else {
          errorHandler(result, args);
        }
      };
      if (esri.config.defaults.geometryService) {
        esri.config.defaults.geometryService.project(geometries, outSR, dojo.hitch(this, projectHandler), errorHandler);
      } else {
        handler(null);
      }
    }
  };
  
  EAC._sameSpatialReference = function(sp1, sp2){
    var mercator = [102113, 102100, 3857];
    if (sp1 && sp2 && sp1.wkid === sp2.wkid && sp1.wkt === sp2.wkt) {
      return true;
    } else if (sp1 && sp2 && sp1.wkid && sp2.wkid && dojo.indexOf(mercator, sp1.wkid) > -1 && dojo.indexOf(mercator, sp2.wkid) > -1) {
      return true;
    }
    
    return false;
  };
  
}()); // end of module anonymous

});
