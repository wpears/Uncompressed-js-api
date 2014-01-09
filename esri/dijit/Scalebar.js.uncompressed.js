//>>built
// wrapped by build app
define("esri/dijit/Scalebar", ["dijit","dojo","dojox","dojo/require!esri/geometry,esri/map,esri/WKIDUnitConversion"], function(dijit,dojo,dojox){
dojo.provide("esri.dijit.Scalebar");
dojo.require("esri.geometry");
dojo.require("esri.map");
dojo.require("esri.WKIDUnitConversion");
//anonymous function to load CSS files required for this module
(function () {
  var css = [dojo.moduleUrl("esri.dijit", "css/Scalebar.css")];
  var head = document.getElementsByTagName("head").item(0),
      link;
  for (var i = 0, il = css.length; i < il; i++) {
    link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = css[i].toString();
    head.appendChild(link);
  }
}());

dojo.declare("esri.dijit.Scalebar", null, {
  map: null,
  mapUnit: null,
  scalebarUnit: null,
  unitsDictionary: [],
  domNode: null,
  screenPt1: null,
  screenPt2: null,

  constructor: function (params, srcNodeRef) {
    this.domNode = dojo.create("div", {
      innerHTML: "<div class='esriScalebarRuler'><div class='esriScalebarRulerBlock upper_firstpiece'></div><div class='esriScalebarRulerBlock upper_secondpiece'></div><div class='esriScalebarRulerBlock lower_firstpiece'></div><div class='esriScalebarRulerBlock lower_secondpiece'></div></div><div class='scaleLabelDiv'><div class='esriScalebarLabel' style='left: -3%'>0</div><div class='esriScalebarLabel esriScalebarFirstNumber'></div><div class='esriScalebarLabel esriScalebarSecondNumber'></div></div>"
    });
    params = params || {};
    if (!params.map) {
      console.error("scalebar: unable to find the 'map' property in parameters");
      return;
    }
    // Unit setting
    if (!params.scalebarUnit) {
      this.scalebarUnit = 'mi';
    }
    else {
      //If users provide wrong scalebar unit other than english or metric
      if (params.scalebarUnit !== "english" && params.scalebarUnit !== "metric") {
        console.error("scalebar unit only accepts english or metric");
        return;
      }
      else {
        this.scalebarUnit = (params.scalebarUnit === "english") ? "mi" : "km";
      }
    }
    this.map = params.map;
    // Place the scalebar in a user-defined element, otherwise put it in the bottom left corner of the map by default
    if (srcNodeRef) {
      srcNodeRef.appendChild(this.domNode);
    }
    else {
      this.map.container.appendChild(this.domNode);
      // Define the postion
      if (params.attachTo) {
        dojo.addClass(this.domNode, "scalebar_" + params.attachTo);
      }
      // Default position
      else {
        dojo.addClass(this.domNode, "scalebar_bottom-left");
      }
    }
    dojo.addClass(this.domNode, "esriScalebar");
    // Draw the scalebar initially
    this._getDistance(this.map.extent);
    // Check if overlapped with bing logo initially if the scalebar is at default position
    this._checkBingMaps();
    // Wire to map events    
    this._mapOnPan = dojo.connect(this.map, "onPan", this, this._getDistance);
    this._mapOnExtentChange = dojo.connect(this.map, "onExtentChange", this, this._getDistance);    
    // If Bing maps present and visible,
    // And at the same time, if the scalebar is at bottom left corner,
    // move the scalebar towards right a little
    dojo.forEach(this.map.layerIds, function (layerId, idx) {
      if (this.map.getLayer(layerId).declaredClass === "esri.virtualearth.VETiledLayer") {
        dojo.connect(this.map.getLayer(layerId), "onVisibilityChange", dojo.hitch(this, function (visbility) {
          this._checkBingMaps();
        }));
      }
    }, this);

    this._mapOnLayerAdd = dojo.connect(this.map, "onLayerAdd", dojo.hitch(this, function (layer) {
      if (layer.declaredClass === "esri.virtualearth.VETiledLayer") {
        dojo.connect(layer, "onVisibilityChange", dojo.hitch(this, function (visbility) {
          this._checkBingMaps();
        }));
      }
      this._checkBingMaps();
    }));
    this._mapOnLayerRemove = dojo.connect(this.map, "onLayerRemove", dojo.hitch(this, this._checkBingMaps));
  },

  hide: function () {
    this._hidden = true;
    esri.hide(this.domNode);
  },

  show: function () {
    this._hidden = false;
    esri.show(this.domNode);
  },
  
  destroy: function () {
    dojo.disconnect(this._mapOnPan);
    dojo.disconnect(this._mapOnExtentChange);
    dojo.disconnect(this._mapOnLayerAdd);
    dojo.disconnect(this._mapOnLayerRemove);
    this.hide();
    this.map = null;
    dojo.destroy(this.domNode);    
  },

  _checkBingMaps: function () {
    if (dojo.hasClass(this.domNode, "scalebar_bottom-left")) {
      // Honor the default position first
      dojo.style(this.domNode, "left", "25px");
      dojo.forEach(this.map.layerIds, function (layerId, idx) {
        if (this.map.getLayer(layerId).declaredClass === "esri.virtualearth.VETiledLayer" && this.map.getLayer(layerId).visible) {
          var positionX = "95px";
          if (this.map._mapParams.nav) {
            positionX = "115px";
          }
          dojo.style(this.domNode, "left", positionX);
        }
      }, this);
    }
  },

  _getDistance: function (extent) {
    // Define the points to calculate the scale value based on where the scalebar is
    var position = dojo.position(this.domNode, true);
    var screenPtY = position.y - this.map.position.y;
    // If the scalebar is outside the map, use the bottom or top line
    screenPtY = (screenPtY > this.map.height) ? this.map.height : screenPtY;
    screenPtY = (screenPtY < 0) ? 0 : screenPtY;
    var screenPt1 = new esri.geometry.Point(0, screenPtY, this.map.spatialReference);
    var screenPt2 = new esri.geometry.Point(this.map.width, screenPtY, this.map.spatialReference);
    var distance, midDistance;
    this.mapUnit = "esriDecimalDegrees";
    // Convert to map point to calculate scale value	
    var pt1 = esri.geometry.toMapPoint(extent, this.map.width, this.map.height, screenPt1);
    var pt2 = esri.geometry.toMapPoint(extent, this.map.width, this.map.height, screenPt2);
    var midPt1 = new esri.geometry.Point(extent.xmin, (extent.ymin+extent.ymax)/2, this.map.spatialReference);
    var midPt2 = new esri.geometry.Point(extent.xmax, (extent.ymin+extent.ymax)/2, this.map.spatialReference);
    if (this.map.spatialReference.wkid === 3857 || this.map.spatialReference.wkid === 102100 || this.map.spatialReference.wkid === 102113 || (this.map.spatialReference.wkt && this.map.spatialReference.wkt.indexOf("WGS_1984_Web_Mercator") != -1)) {
      //if the map projection is web mercator, convert to lat/lon first
      pt1 = esri.geometry.webMercatorToGeographic(pt1, true);
      pt2 = esri.geometry.webMercatorToGeographic(pt2, true);
      midPt1 = esri.geometry.webMercatorToGeographic(midPt1, true);
      midPt2 = esri.geometry.webMercatorToGeographic(midPt2, true);
    }
    else if (esri._isDefined(esri.WKIDUnitConversion[this.map.spatialReference.wkid]) || (this.map.spatialReference.wkt && this.map.spatialReference.wkt.indexOf("PROJCS") === 0) ) {     
      //it's a PCS other than web mercator
      // for those PCSs, it doesn't take scale distortion into account
      this.mapUnit = "linearUnit";
      distance = Math.abs(extent.xmax - extent.xmin);
      var coeff;
      if (esri._isDefined(esri.WKIDUnitConversion[this.map.spatialReference.wkid])) {
        coeff = esri.WKIDUnitConversion.values[esri.WKIDUnitConversion[this.map.spatialReference.wkid]];
      }
      else {
        var wkt = this.map.spatialReference.wkt;
        var start = wkt.lastIndexOf(",") + 1;
        var end = wkt.lastIndexOf("]]");
        coeff = parseFloat(wkt.substring(start, end));
      }
      distance *= coeff; //in meters
      if (this.scalebarUnit === "mi") {
        distance /= 1609;
      }
      else {
        distance /= 1000;
      }
    }
    if (this.mapUnit === "esriDecimalDegrees") {
      //if the map is geographic coordinate system, including web mercator as it's been converted
      var line = new esri.geometry.Polyline(new esri.SpatialReference({wkid:4326}));
      line.addPath([pt1, pt2]);
      var densifiedLine = esri.geometry._straightLineDensify(line, 10); //densify the line to get the straight line distance and prevent the great circle less than half of the perimeter
      distance = esri.geometry.geodesicLengths([densifiedLine], esri.Units.KILOMETERS)[0];
      var midLine = new esri.geometry.Polyline(new esri.SpatialReference({wkid:4326}));
      midLine.addPath([midPt1, midPt2]);
      var densifiedMidLine = esri.geometry._straightLineDensify(midLine, 10); //densify the line to get the straight line distance and prevent the great circle less than half of the perimeter
      midDistance = esri.geometry.geodesicLengths([densifiedMidLine], esri.Units.KILOMETERS)[0];      
      if (this.scalebarUnit === "mi") {
        distance /= 1.609;
        midDistance /= 1.609;
      }
    }
    this._getScaleBarLength(distance);
    if (midDistance) {
      if (distance/midDistance > 0.1) {
        if (!this._hidden) {
          esri.show(this.domNode);
        }
      }
      else {
        esri.hide(this.domNode);
      }
    }
  },

  _getScaleBarLength: function (distance) {
    // The scalebar was compose of 2 pieces,
    // Set the initial length of one piece as 50 pixels.
    var iniScaleBarLength = 50;
    var iniLength = iniScaleBarLength * distance / this.map.width;
    var adjustedLength = iniLength;
    var i = 0;
    var adjustedUnit = this.scalebarUnit;
    // Adjust it to the nearest values as the round number of 1,1.5, 2,3, 5 or 10	
    if (adjustedLength < 0.1) {
      // If it's in very small area, convert to feet or meters
      if (this.scalebarUnit === "mi") {
        adjustedLength *= 5280;
        adjustedUnit = "ft";
      }
      else if (this.scalebarUnit === "km") {
        adjustedLength *= 1000;
        adjustedUnit = "m";
      }
    }
    while (adjustedLength >= 1) {
      adjustedLength /= 10;
      i++;
    }
    var maxValue, minValue;
    if (adjustedLength > 0.5) {
      maxValue = 1;
      minValue = 0.5;
    }
    else if (adjustedLength > 0.3) {
      maxValue = 0.5;
      minValue = 0.3;
    }
    else if (adjustedLength > 0.2) {
      maxValue = 0.3;
      minValue = 0.2;
    }
    else if (adjustedLength > 0.15) {
      maxValue = 0.2;
      minValue = 0.15;
    }
    else if (adjustedLength > 0.1) {
      maxValue = 0.15;
      minValue = 0.1;
    }
    // If it's closer to the minvalue area, move it to the minvalue;	  
    var closerValue = ((maxValue / adjustedLength) >= (adjustedLength / minValue)) ? minValue : maxValue;
    var adjustedFactor = closerValue / adjustedLength;
    var adjustedScaleBarLength = iniScaleBarLength * adjustedFactor;
    var scaleValue = Math.pow(10, i) * closerValue;
    this._drawScaleBar(adjustedScaleBarLength, scaleValue, adjustedUnit);
  },

  _drawScaleBar: function (adjustedScaleBarLength, scaleValue, adjustedUnit) {
    var mainwid = 2 * Math.round(adjustedScaleBarLength) + "px";
    this.domNode.style.width = mainwid;
    // If there are multiple scalebars on the same page, it has to query within the current instance
    dojo.forEach(dojo.query(".esriScalebarFirstNumber", this.domNode), function (firstNumber, idx) {
      firstNumber.innerHTML = scaleValue;
    }, this);
    dojo.forEach(dojo.query(".esriScalebarSecondNumber", this.domNode), function (secondNumber, idx) {
      if (this.mapUnit !== "esriUnknown") {
        secondNumber.innerHTML = 2 * scaleValue + adjustedUnit;
      }
      else {
        secondNumber.innerHTML = 2 * scaleValue + "Unknown Unit";
      }
    }, this);
  }
});
});
