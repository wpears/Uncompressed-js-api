//>>built
// wrapped by build app
define("esri/dijit/Measurement", ["dijit","dojo","dojox","dojo/require!dijit/_Widget,dijit/_Templated,esri/map,esri/geometry,esri/symbol,dojo/parser,dijit/layout/ContentPane,dijit/Menu,dijit/form/Button,esri/tasks/geometry,esri/WKIDUnitConversion"], function(dijit,dojo,dojox){
dojo.provide("esri.dijit.Measurement");
dojo.require("dijit._Widget");
dojo.require("dijit._Templated");
dojo.require("esri.map");
dojo.require("esri.geometry");
dojo.require("esri.symbol");
dojo.require("dojo.parser");
dojo.require("dijit.layout.ContentPane");
dojo.require("dijit.Menu");
dojo.require("dijit.form.Button");
dojo.require("esri.tasks.geometry");
dojo.require("esri.WKIDUnitConversion");

//anonymous function to load CSS files required for this module
(function () {
  var css = [dojo.moduleUrl("esri.dijit", "css/Measurement.css")];
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

dojo.declare("esri.dijit.Measurement", [dijit._Widget, dijit._Templated], {
  widgetsInTemplate: true,
  templateString:"<div class=\"esriMeasurement\">\r\n  <div dojoType='dijit.form.ToggleButton' baseClass='esriButton' dojoAttachPoint='area' checked='false' iconClass='areaIcon' showLabel='false' dojoAttachEvent='onClick:areaToggleButton'></div>\r\n  <div dojoType='dijit.form.ToggleButton' baseClass='esriButton' dojoAttachPoint='distance' iconClass='distanceIcon' showLabel='false' dojoAttachEvent='onClick:distanceToggleButton'></div>\r\n  <div dojoType='dijit.form.ToggleButton' baseClass='esriButton' dojoAttachPoint='location' iconClass='locationIcon' showLabel='false' dojoAttachEvent='onClick:locationToggleButton'></div>\r\n  <div style=\"display:inline;margin-left:2px;margin-right:2px;padding-top:2px;\">|</div>\r\n  <button dojoType='dijit.form.DropDownButton' baseClass='esriToggleButton' dojoAttachPoint='unit' label='unit' value='unit' style='visibility:hidden;'></button>\r\n  <div dojoType='dijit.layout.ContentPane' dojoAttachPoint='resultLabel' class='resultLabel'></div>\r\n  <div dojoType='dijit.layout.ContentPane' dojoAttachPoint='resultValue' align='left' class='result'></div>\r\n</div>",
  unitDictionary: [],
  result: null,
  inputPoints: [],
  measureGraphics: [],
  numberPattern: "#,###,###,##0.0",
  constructor: function (params, srcNodeRef) {
    params = params || {};
    if (!params.map) {
      console.log("dijit.MeasureTool: unable to find the 'map' property in parameters");
      return;
    }
    this._map = params.map;
    this._map.cs = this._checkCS(this._map.spatialReference);
    this._geometryService = esri.config.defaults.geometryService;

    if (params.pointSymbol) {
      this._pointSymbol = params.pointSymbol;
    } else {
      var url = dojo.moduleUrl("esri.dijit", "./images/flag.png").toString();      
      this._pointSymbol = new esri.symbol.PictureMarkerSymbol(url, 24, 24);
      this._pointSymbol.setOffset(9, 11);
    }

    if (params.lineSymbol) {
      this._lineSymbol = params.lineSymbol;
    } else {
      this._lineSymbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0, 128, 255]), 3);
    }
    
    if (params.defaultLengthUnit) {
      this._defaultLengthUnit = params.defaultLengthUnit;
    } else {
      this._defaultLengthUnit = esri.Units.MILES;
    }

    if (params.defaultAreaUnit) {
      this._defaultAreaUnit = params.defaultAreaUnit;
    } else {
      this._defaultAreaUnit = esri.Units.ACRES;
    }
    
    if (params.defaultLocationUnit) {
      this._defaultLocationUnit = params.defaultLocationUnit;
    } else {
      this._defaultLocationUnit = esri.Units.DECIMAL_DEGREES;
    }
    
    this._snappingCallback = dojo.hitch(this, this._snappingCallback);
  },

  startup: function () {
    var localStrings = esri.bundle.widgets.measurement;
    //length unit conversion from mile
    this.unitDictionary[localStrings.NLS_length_miles] = 1;
    this.unitDictionary[localStrings.NLS_length_kilometers] = 1.609344;
    this.unitDictionary[localStrings.NLS_length_feet] = 5280;
    this.unitDictionary[localStrings.NLS_length_meters] = 1609.34;
    this.unitDictionary[localStrings.NLS_length_yards] = 1760;
    this.unitDictionary["Nautical Miles"] = 0.869;
    //area unit conversion from acres
    this.unitDictionary[localStrings.NLS_area_acres] = 1;
    this.unitDictionary[localStrings.NLS_area_sq_kilometers] = 0.004047;
    this.unitDictionary[localStrings.NLS_area_sq_miles] = 0.0015625;
    this.unitDictionary[localStrings.NLS_area_sq_feet] = 43560;
    this.unitDictionary[localStrings.NLS_area_sq_meters] = 4046.87;
    this.unitDictionary[localStrings.NLS_area_hectares] = 0.4047;
    this.unitDictionary[localStrings.NLS_area_sq_yards] = 4840;
    
    //mapping esri units with localized string
    this.units = {
    //length unit conversion from miles
    "esriMiles": localStrings.NLS_length_miles,
    "esriKilometers": localStrings.NLS_length_kilometers,
    "esriFeet": localStrings.NLS_length_feet,
    "esriMeters": localStrings.NLS_length_meters,
    "esriYards": localStrings.NLS_length_yards, 
    //area unit conversion from acres
    "esriAcres": localStrings.NLS_area_acres,
    "esriSquareKilometers": localStrings.NLS_area_sq_kilometers,
    "esriSquareMiles": localStrings.NLS_area_sq_miles,
    "esriSquareFeet": localStrings.NLS_area_sq_feet,
    "esriSquareMeters": localStrings.NLS_area_sq_meters,
    "esriHectares": localStrings.NLS_area_hectares,
    "esriSquareYards": localStrings.NLS_area_sq_yards,
    //location unit
    "esriDecimalDegrees": localStrings.NLS_decimal_degrees,
    "esriDegreeMinuteSeconds": localStrings.NLS_deg_min_sec
    };
    
    dijit.byNode(this.distance.domNode).setLabel(esri.bundle.widgets.measurement.NLS_distance);
    dijit.byNode(this.area.domNode).setLabel(esri.bundle.widgets.measurement.NLS_area);
    dijit.byNode(this.location.domNode).setLabel(esri.bundle.widgets.measurement.NLS_location);    
    dijit.byNode(this.resultLabel.domNode).setContent(esri.bundle.widgets.measurement.NLS_resultLabel);
  },

  /*****************
   * Public Methods
   *****************/
  measureArea: function () {
    this._map.__setClickDuration(0);
    this._createAreaUnitList();
    this.inputPoints = [];
    this.tempGraphic = new esri.Graphic();
    this.tempGraphic.setSymbol(this._lineSymbol);
    this.tempGraphic.setGeometry(new esri.geometry.Polyline());
    this._map.graphics.add(this.tempGraphic);
    if (this._map.cs === "PCS") {
      this._geometryAreaHandler = dojo.connect(this._geometryService, "onAreasAndLengthsComplete", this, "_outputArea");
    }
    this.mouseClickMapHandler = dojo.connect(this._map, "onClick", this, "_measureAreaMouseClickHandler");
    this.doubleClickMapHandler = dojo.connect(this._map, "onDblClick", this, "_measureAreaDblClickHandler");
  },

  measureDistance: function () {
    this._map.__setClickDuration(0);
    //set up all the events
    //start measuring
    if (this._map.cs === "PCS") {
      this._projectMapExtent(this._map.extent);
      this._mapExtentChangeHandler = dojo.connect(this._map, "onExtentChange", this, "_projectMapExtent");
    }

    this.inputPoints = [];
    this._createLengthUnitList();
    this.mouseClickMapHandler = dojo.connect(this._map, "onClick", this, "_measureDistanceMouseClickHandler");
    this.doubleClickMapHandler = dojo.connect(this._map, "onDblClick", this, "_measureDistanceDblClickHandler");
  },

  measureLocation: function () {
    this._map.__setClickDuration(0);
    this.measureGraphics = [];
    this._createLocationUnitList();
    this._map.graphics.remove(this.locationGraphic);
    if (this._map.cs === "PCS") {
      this._projectMapExtent(this._map.extent);
      this._mapExtentChangeHandler = dojo.connect(this._map, "onExtentChange", dojo.hitch(this, this._projectMapExtent));
    }
    this._clickMapHandler = dojo.connect(this._map, "onClick", this, "_measureLocationClickHandler");
    this.mouseMoveMapHandler = dojo.connect(this._map, "onMouseMove", this, "_showCoordinates");
    this.mouseDragMapHandler = dojo.connect(this._map, "onMouseDrag", dojo.hitch(this, function () {
      dijit.byNode(this.resultValue.domNode).setAttribute("disabled", true);
    }));
  },
  
  setTool: function (toolName, checked) {
    this.closeTool();
    var toggled = dijit.byNode(this[toolName].domNode).checked;
    dojo.style(this.unit.domNode, "visibility", "visible");
    dijit.byNode(this.area.domNode).setAttribute("checked", false);
    dijit.byNode(this.distance.domNode).setAttribute("checked", false);
    dijit.byNode(this.location.domNode).setAttribute("checked", false);
    if (checked === true || checked === false) {
      toggled = checked;            
    }
    dijit.byNode(this[toolName].domNode).setAttribute("checked", toggled);
    if (toggled) {
      this.activeTool = toolName;
      if(this.map.isDoubleClickZoom){
        this._map.disableDoubleClickZoom();
      }
      if (toolName === "area") {
        this.measureArea();
      }
      else if (toolName === "distance") {
        this.measureDistance();
      }
      else if (toolName === "location") {
        this.measureLocation();
      }
      if (this._map.snappingManager) {
        this._map.snappingManager._startSelectionLayerQuery();
        this._map.snappingManager._setUpSnapping();
      }
    }
  },

  areaToggleButton: function () {
    this.clearResult();
    this.setTool("area");
  },

  distanceToggleButton: function () {
    this.clearResult();
    this.setTool("distance");    
  },

  locationToggleButton: function () {
    this.clearResult();
    this.setTool("location");
  },

  closeTool: function () {
    var map = this._map;
    map.__resetClickDuration();
    if(!map.isDoubleClickZoom){
      map.enableDoubleClickZoom();
    }
    this.inputPoints = [];
    if (map.snappingManager && map.snappingManager._snappingGraphic) {
      map.graphics.remove(map.snappingManager._snappingGraphic);
    }
    dojo.disconnect(this.mouseClickMapHandler);
    dojo.disconnect(this.mouseMoveMapHandler);
    dojo.disconnect(this.doubleClickMapHandler);
    dojo.disconnect(this.mouseDragMapHandler);
    dojo.disconnect(this._clickMapHandler);
    dojo.disconnect(this._mapExtentChangeHandler);
    dojo.disconnect(this._geometryAreaHandler);
    if (this._map.snappingManager) {
      this._map.snappingManager._stopSelectionLayerQuery();
      this._map.snappingManager._killOffSnapping();
    }
  },

  clearResult: function () {
    var map = this._map;
    this.result = 0;
    dijit.byNode(this.resultValue.domNode).setAttribute("content", '');
    for (var i = 0; i < this.measureGraphics.length; i++) {
      map.graphics.remove(this.measureGraphics[i]);
    }
    this.measureGraphics = [];
    map.graphics.remove(this.tempGraphic);
  },

  show: function () {
    esri.show(this.domNode);
  },

  hide: function () {
    esri.hide(this.domNode);
  },

  showTool: function (toolName) {
    var tool = this[toolName].domNode;
    tool.style.display = "inline";
  },
  
  hideTool: function (toolName) {
    var tool = this[toolName].domNode;
    tool.style.display = "none";
  },

  destroy: function () {
    this.closeTool();
    this.clearResult();
    this.inherited(arguments);
    this._map = this._geometryService = this.measureGraphic = this.measureGraphic = this.tempGraphic = null;
  },
  
  //events
  onMeasureEnd: function () {/*activeTool: the current active tool, geometry: the measurement geometry*/},


  /*****************
   * Internal Methods
   *****************/
  _densifyGeometry: function (geom) {
    if (this._map.cs === "Web Mercator") {
      geom = esri.geometry.webMercatorToGeographic(geom);
    }
    var densifiedLine;
    if (this._map.cs === "PCS") {
      densifiedLine = geom;
    } else {
      densifiedLine = esri.geometry.geodesicDensify(geom, 500000);
    }
    if (this._map.cs === "Web Mercator") {
      densifiedLine = esri.geometry.geographicToWebMercator(densifiedLine);
    }
    return densifiedLine;
  },

  _measureAreaMouseClickHandler: function (evt) {
    var snappingPoint;
    if (this._map.snappingManager) {
      snappingPoint = this._map.snappingManager._snappingPoint;
    }
    var mapPoint = snappingPoint || evt.mapPoint;
    this.inputPoints.push(mapPoint);
    this._currentStartPt = mapPoint;
    if (this.inputPoints.length === 1) {
      this.tempGraphic.setGeometry(new esri.geometry.Polyline());
      for (var i = 0; i < this.measureGraphics.length; i++) {
        this._map.graphics.remove(this.measureGraphics[i]);
      }
      this.measureGraphics = [];
      this.result = 0;
      this._outputResult(this.result, esri.bundle.widgets.measurement.NLS_area_acres);
      this.mouseMoveMapHandler = dojo.connect(this._map, "onMouseMove", this, "_measureAreaMouseMoveHandler");
    }
    this.measureGraphic = new esri.Graphic();
    this.measureGraphic.setSymbol(this._lineSymbol);
    this.measureGraphics.push(this.measureGraphic);

    if (this.inputPoints.length > 1) {
      var line = new esri.geometry.Polyline(this._map.spatialReference);
      line.addPath([this.inputPoints[this.inputPoints.length - 2], mapPoint]);
      var closeLine = new esri.geometry.Polyline(this._map.spatialReference);
      closeLine.addPath([this.inputPoints[0], mapPoint]);
      var densifiedLine = this._densifyGeometry(line);
      var densifiedCloseLine = this._densifyGeometry(closeLine);
      this.tempGraphic.setGeometry(densifiedCloseLine);
      this.measureGraphic.setGeometry(densifiedLine);
      this._map.graphics.add(this.measureGraphic);
    }
  },

  _measureAreaMouseMoveHandler: function (evt) {
    var mapPoint;
    if (this.inputPoints.length > 0) {
      var line = new esri.geometry.Polyline(this._map.spatialReference);
      var snappingPoint;
      if (this._map.snappingManager) {
        snappingPoint = this._map.snappingManager._snappingPoint;
      }
      mapPoint = snappingPoint || evt.mapPoint;
      line.addPath([this._currentStartPt, mapPoint]);
      var densifiedLine = this._densifyGeometry(line);
      this.tempGraphic.setGeometry(densifiedLine);
    }
    if (this.inputPoints.length > 1) {
      var closeLine = new esri.geometry.Polyline(this._map.spatialReference);
      closeLine.addPath([mapPoint, this.inputPoints[0]]);
      var closeDensifiedLine = this._densifyGeometry(closeLine);
      this.tempGraphic.setGeometry(this.tempGraphic.geometry.addPath(closeDensifiedLine.paths[0]));
    }
  },

  _measureAreaDblClickHandler: function (evt) {
    dojo.disconnect(this.mouseMoveMapHandler);
    var polygon = new esri.geometry.Polygon(this._map.spatialReference);
    var ring = [];
    for (var i = 0; i < this.inputPoints.length; i++) {
      ring.push([this.inputPoints[i].x, this.inputPoints[i].y]);
    }
    ring.push([this.inputPoints[0].x, this.inputPoints[0].y]);
    polygon.addRing(ring);
    this.inputPoints = [];
    this.measurementGeometry = this._densifyGeometry(polygon);
    this._getArea(polygon);
  },

  _getArea: function (geometry) {
    var geographicGeometries = [];
    var areasAndLengthParams = new esri.tasks.AreasAndLengthsParameters();
    areasAndLengthParams.areaUnit = esri.tasks.GeometryService.UNIT_ACRES;
    //if self intersecting, simplify using geometry service
    if (esri.geometry.polygonSelfIntersecting(geometry)) {
      //if self intersecting, simplify using geometry service
      this._geometryService.simplify([geometry], dojo.hitch(this, function (simplifiedGeometries) {
        dojo.forEach(simplifiedGeometries, dojo.hitch(this, function (simplifiedGeometry, idx) {
          if (this._map.cs === "PCS") {
            areasAndLengthParams.polygons = simplifiedGeometries;
            this._geometryService.areasAndLengths(areasAndLengthParams);
            return;
          } else if (this._map.cs === "Web Mercator") {
            simplifiedGeometry = esri.geometry.webMercatorToGeographic(simplifiedGeometry);
          }
          geographicGeometries.push(simplifiedGeometry);
        }));
        var areas = esri.geometry.geodesicAreas(geographicGeometries, esri.Units.ACRES);
        this._showArea(areas[0]);
      }));
    } else {
      if (this._map.cs === "Web Mercator") {
        geometry = esri.geometry.webMercatorToGeographic(geometry);
      }
      geographicGeometries.push(geometry);
      if (this._map.cs === "PCS") {
        areasAndLengthParams.polygons = geographicGeometries;
        this._geometryService.areasAndLengths(areasAndLengthParams);
        return;
      }
      var areas = esri.geometry.geodesicAreas(geographicGeometries, esri.Units.ACRES);
      this._showArea(Math.abs(areas[0]));
    }
  },

  _outputArea: function (result) {
    this._showArea(Math.abs(result.areas[0]));
    //this.closeTool();
  },

  _showArea: function (area) {
    if (area) {
      this.result = area;
      var unit = dijit.byNode(this.unit.domNode).label;
      this._outputResult(this.result, unit);
    }
    this.onMeasureEnd(this.activeTool, this.measurementGeometry);
  },

  _measureDistanceDblClickHandler: function (evt) {
    dojo.disconnect(this.mouseMoveMapHandler);
    var measurementGeometry = new esri.geometry.Polyline(this._map.spatialReference);
    measurementGeometry.addPath(this.inputPoints);
    measurementGeometry = this._densifyGeometry(measurementGeometry);
    this.inputPoints = [];
    this.onMeasureEnd(this.activeTool, measurementGeometry);
  },

  _measureDistanceMouseClickHandler: function (evt) {
    //if it's a new measurement, store the first pt, clear previous results and graphics
    //if it's in the middle of a measurement, show the static result and geodesics, reset the currentstartpt
    var snappingPoint;
    if (this._map.snappingManager) {
      snappingPoint = this._map.snappingManager._snappingPoint;
    }
    var mapPoint = snappingPoint || evt.mapPoint;
    this.inputPoints.push(mapPoint);
    this._currentStartPt = mapPoint;

    if (this.inputPoints.length === 1) {
      // A new measurement starts
      for (var i = 0; i < this.measureGraphics.length; i++) {
        this._map.graphics.remove(this.measureGraphics[i]);
      }
      this._map.graphics.remove(this.tempGraphic);
      this.measureGraphics = [];
      this.result = 0;
      this._outputResult(this.result, esri.bundle.widgets.measurement.NLS_length_miles);
      this.tempGraphic = new esri.Graphic();
      this.tempGraphic.setSymbol(this._lineSymbol);
      this._map.graphics.add(this.tempGraphic);
      this.mouseMoveMapHandler = dojo.connect(this._map, "onMouseMove", this, "_measureDistanceMouseMoveHandler");
    }
    this.tempGraphic.setGeometry(new esri.geometry.Polyline());
    this.flagGraphic = new esri.Graphic();
    this.flagGraphic.setSymbol(this._pointSymbol);
    this.flagGraphic.setGeometry(mapPoint);
    this.measureGraphics.push(this.flagGraphic);
    this._map.graphics.add(this.flagGraphic);

    if (this.inputPoints.length > 1) {
      this.measureGraphic = new esri.Graphic();
      this.measureGraphic.setSymbol(this._lineSymbol);
      this.measureGraphics.push(this.measureGraphic);
      var line = new esri.geometry.Polyline(this._map.spatialReference);
      line.addPath([this.inputPoints[this.inputPoints.length - 2], mapPoint]);
      var densifiedLine = this._densifyGeometry(line);
      this.measureGraphic.setGeometry(densifiedLine);
      this._map.graphics.add(this.measureGraphic);
      this.result += this._geodesicDistance(this.inputPoints[this.inputPoints.length - 2], mapPoint);
      this._showDistance(this.result);
    }
  },

  _measureDistanceMouseMoveHandler: function (evt) {
    if (this.inputPoints.length > 0) {
      var line = new esri.geometry.Polyline(this._map.spatialReference);
      var snappingPoint;
      if (this._map.snappingManager) {
        snappingPoint = this._map.snappingManager._snappingPoint;
      }
      var mapPoint = snappingPoint || evt.mapPoint;
      //var mapPoint = evt.mapPoint;
      line.addPath([this._currentStartPt, mapPoint]);
      var densifiedLine = this._densifyGeometry(line);
      this.tempGraphic.setGeometry(densifiedLine);
      var distance = this._geodesicDistance(this._currentStartPt, mapPoint);
      this._showDistance(distance + this.result);
    }
  },

  _geodesicDistance: function (pt1, pt2) {
    //if there are two input points call the geometry service and perform the distance operation
    var polyline = new esri.geometry.Polyline(this._map.spatialReference);
    if (this._map.cs === "PCS") {
      pt1 = this._getGCSLocation(pt1);
      pt2 = this._getGCSLocation(pt2);
    }
    polyline.addPath([pt1, pt2]);
    if (this._map.cs === "Web Mercator") {
      polyline = esri.geometry.webMercatorToGeographic(polyline);
    }
    return esri.geometry.geodesicLengths([polyline], esri.Units.MILES)[0];
    //this._showDistance(esri.geometry.geodesicLengths([polyline], esri.Units.MILES)[0] + baseDistance);
  },

  _showDistance: function (distance) {
    if (distance) {
      this._outputResult(distance, dijit.byNode(this.unit.domNode).label);
    }
  },

  _measureLocationClickHandler: function (evt) {
    dijit.byNode(this.location.domNode).setAttribute("checked", false);
    var snappingPoint;
    if (this._map.snappingManager) {
      snappingPoint = this._map.snappingManager._snappingPoint;
    }
    var mapPt = snappingPoint || evt.mapPoint;
    this.locationToggleButton();
    this.locationGraphic = new esri.Graphic();

    this.locationGraphic.setGeometry(mapPt);
    this.locationGraphic.setSymbol(this._pointSymbol);
    this._map.graphics.add(this.locationGraphic);
    this.measureGraphics.push(this.locationGraphic);
    var snapedPt = {
      mapPoint: mapPt
    };
    this._showCoordinates(snapedPt);
    this.onMeasureEnd(this.activeTool, mapPt);
  },

  _getGCSLocation: function (pt) {
    var mapPt = pt;
    if (this._map.cs === "Web Mercator") {
      mapPt = esri.geometry.webMercatorToGeographic(mapPt);
    } else if (this._map.cs === "PCS") {
      if (this._map._newExtent) {
        var ratioX = Math.abs((this._map._newExtent.xmax - this._map._newExtent.xmin) / (this._map.extent.xmax - this._map.extent.xmin));
        var ratioY = Math.abs((this._map._newExtent.ymax - this._map._newExtent.ymin) / (this._map.extent.ymax - this._map.extent.ymin));
        var newX = (mapPt.x - this._map.extent.xmin) * ratioX + this._map._newExtent.xmin;
        var newY = (mapPt.y - this._map.extent.ymin) * ratioY + this._map._newExtent.ymin;
        mapPt = new esri.geometry.Point(newX, newY);
      }
    }
    return mapPt;
  },

  _projectMapExtent: function (extent) {
    //only when reproject process finished, the mouse move and drag events will be associated.
    var graphic = new esri.Graphic(extent);
    var outSR = new esri.SpatialReference({
      wkid: 4326
    });

    this._geometryService.project([graphic.geometry], outSR, dojo.hitch(this, function (features) {
      //after reprojected, connect to listen to mouse move & drag events
      if (!this.mouseMoveMapHandler && this.activeTool === "location") {
        this.mouseMoveMapHandler = dojo.connect(this._map, "onMouseMove", dojo.hitch(this, this._showCoordinates));
        this.mouseDragMapHandler = dojo.connect(this._map, "onMouseDrag", dojo.hitch(this, function () {
          dijit.byNode(this.resultValue.domNode).setAttribute("disabled", true);
        }));
      }
      this._map._newExtent = features[0];
    }));
  },

  _showCoordinates: function (evt) {
    //get mapPoint from event
    var snappingPoint;
    if (this._map.snappingManager) {
      snappingPoint = this._map.snappingManager._snappingPoint;
    }
    var currentMapPt = snappingPoint || evt.mapPoint;
    var mapPt = this._getGCSLocation(currentMapPt);
    this.locationX = mapPt.x;
    this.locationY = mapPt.y;
    this._outputLocationResult(mapPt.x, mapPt.y, dijit.byNode(this.unit.domNode).label);
  },

  _checkCS: function (spatialReference) {
    if (spatialReference.wkid) {
      if (spatialReference.wkid === 3857 || spatialReference.wkid === 102100 || spatialReference.wkid === 102113) {
        return "Web Mercator";
      }
      if (esri._isDefined(esri.WKIDUnitConversion[spatialReference.wkid])) {
        return "PCS";
      }
      return "GCS";
    }

    if (spatialReference.wkt) {
      if (spatialReference.wkt.indexOf("WGS_1984_Web_Mercator") !== -1) {
        return "Web Mercator";
      }
      if (spatialReference.wkt.indexOf("PROJCS") === 0) {
        return "PCS";
      }
      return "GCS";
    }
  },

  _switchUnit: function (unit) {
    //set the unit and call output
    dijit.byNode(this.unit.domNode).setAttribute("label", unit);
    if (this.result === null) {
      return;
    }
    this._outputResult(this.result, unit);
  },

  _outputResult: function (result, unit) {
    var finalResult = result * this.unitDictionary[unit];
    if (finalResult === 0) {
      dijit.byNode(this.resultValue.domNode).setAttribute("content", '');
    } else if (finalResult > 1000000) {
      dijit.byNode(this.resultValue.domNode).setAttribute("content", dojo.number.format(finalResult.toPrecision(9), {pattern: this.numberPattern}) + ' ' + unit);
    } else {
      dijit.byNode(this.resultValue.domNode).setAttribute("content", dojo.number.format(finalResult.toFixed(2), {pattern: this.numberPattern}) + ' ' + unit);
    }  
	},
  
  _switchLocationUnit: function (unit) {
    dijit.byNode(this.unit.domNode).setAttribute("label", unit);
    if (this.result === null) {
      return;
    }
    this._outputLocationResult(this.locationX, this.locationY, unit);
  },
  
  _outputLocationResult: function (x, y, unit) {
    var lon, lat;
    var localStrings = esri.bundle.widgets.measurement;
    if (unit === localStrings.NLS_decimal_degrees) {
      lon = x.toFixed(6);
      lat = y.toFixed(6);
    }
    else if (unit === localStrings.NLS_deg_min_sec) {
      var negativeX = false;
      var negativeY = false;
      if (x < 0) {
        negativeX = true;
        x = Math.abs(x);
      }
      if (y < 0) {
        negativeY = true;
        y = Math.abs(y);
      }
      lon = Math.floor(x) + "\u00B0" + Math.floor((x - Math.floor(x)) * 60) + "'" + Math.floor(((x - Math.floor(x)) * 60 - Math.floor((x - Math.floor(x)) * 60)) * 60) + '"';
      lat = Math.floor(y) + "\u00B0" + Math.floor((y - Math.floor(y)) * 60) + "'" + Math.floor(((y - Math.floor(y)) * 60 - Math.floor((y - Math.floor(y)) * 60)) * 60) + '"';
      if (negativeX){
        lon = "-" + lon;
      }
      if (negativeY){
        lat = "-" + lat;
      }      
    }
    dijit.byNode(this.resultValue.domNode).setAttribute("content", esri.bundle.widgets.measurement.NLS_longitude + ": " + lon + "<br/>" + esri.bundle.widgets.measurement.NLS_latitude + ": " + lat);   
  },

  _createLengthUnitList: function () {
    var menu = new dijit.Menu({
      style: "display: none;"
    });
    var localStrings = esri.bundle.widgets.measurement;
    var lengthUnits = [localStrings.NLS_length_miles, localStrings.NLS_length_kilometers, localStrings.NLS_length_feet, localStrings.NLS_length_meters, localStrings.NLS_length_yards];
    dojo.forEach(lengthUnits, dojo.hitch(this, function (lengthUnit, idx) {
      var menuItem = new dijit.MenuItem({
        label: lengthUnit,
        onClick: dojo.hitch(this, function () {
          this._switchUnit(lengthUnit);
        })
      });
      menuItem.setAttribute("class", "unitDropDown");
      menu.addChild(menuItem);
    }));
    dijit.byNode(this.unit.domNode).setAttribute("dropDown", menu);
    var defaultUnit = this.units[this._defaultLengthUnit];
    dijit.byNode(this.unit.domNode).setAttribute("label", defaultUnit);
  },

  _createAreaUnitList: function () {
    var menu = new dijit.Menu({
      style: "display: none;"
    });
    var localStrings = esri.bundle.widgets.measurement;
    var areaUnits = [localStrings.NLS_area_acres, localStrings.NLS_area_sq_miles, localStrings.NLS_area_sq_kilometers, localStrings.NLS_area_hectares, localStrings.NLS_area_sq_yards, localStrings.NLS_area_sq_feet, localStrings.NLS_area_sq_meters];
    dojo.forEach(areaUnits, dojo.hitch(this, function (areaUnit, idx) {
      var menuItem = new dijit.MenuItem({
        label: areaUnit,
        onClick: dojo.hitch(this, function () {
          this._switchUnit(areaUnit);
        })
      });
      menuItem.setAttribute("class", "unitDropDown");
      menu.addChild(menuItem);
    }));

    dijit.byNode(this.unit.domNode).setAttribute("dropDown", menu);
    var defaultUnit = this.units[this._defaultAreaUnit];
    dijit.byNode(this.unit.domNode).setAttribute("label", defaultUnit);
  },
  
  _createLocationUnitList: function () {
    var menu = new dijit.Menu({
      style: "display: none;"
    });
    var localStrings = esri.bundle.widgets.measurement;
    var locationUnits = [localStrings.NLS_decimal_degrees, localStrings.NLS_deg_min_sec];
    dojo.forEach(locationUnits, dojo.hitch(this, function (locationUnit, idx) {
      var menuItem = new dijit.MenuItem({
        label: locationUnit,
        onClick: dojo.hitch(this, function () {
          this._switchLocationUnit(locationUnit);
        })
      });
      menuItem.setAttribute("class", "unitDropDown");
      menu.addChild(menuItem);
    }));

    dijit.byNode(this.unit.domNode).setAttribute("dropDown", menu);
    var defaultUnit = this.units[this._defaultLocationUnit];
    dijit.byNode(this.unit.domNode).setAttribute("label", defaultUnit);
  }
});
});
