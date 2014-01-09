//>>built
// wrapped by build app
define("esri/geometry", ["dijit","dojo","dojox","dojo/require!dojox/gfx/_base,esri/WKIDUnitConversion,esri/geometry/utils"], function(dijit,dojo,dojox){
dojo.provide("esri.geometry");

dojo.require("dojox.gfx._base");
dojo.require("esri.WKIDUnitConversion");
dojo.require("esri.geometry.utils");

esri.Units = {
  //distance units
  CENTIMETERS: "esriCentimeters",
  DECIMAL_DEGREES: "esriDecimalDegrees",
  DEGREE_MINUTE_SECONDS: "esriDegreeMinuteSeconds",
  DECIMETERS: "esriDecimeters",
  FEET: "esriFeet",
  INCHES: "esriInches",
  KILOMETERS: "esriKilometers",
  METERS: "esriMeters",
  MILES: "esriMiles",
  MILLIMETERS: "esriMillimeters",
  NAUTICAL_MILES: "esriNauticalMiles",
  POINTS: "esriPoints",
  UNKNOWN: "esriUnknownUnits",
  YARDS: "esriYards",
  //area units
  ACRES: "esriAcres",
  ARES: "esriAres",
  SQUARE_KILOMETERS: "esriSquareKilometers",
  SQUARE_MILES: "esriSquareMiles",
  SQUARE_FEET: "esriSquareFeet",
  SQUARE_METERS: "esriSquareMeters",
  HECTARES: "esriHectares",
  SQUARE_YARDS: "esriSquareYards",
  SQUARE_INCHES: "esriSquareInches",
  SQUARE_MILLIMETERS: "esriSquareMillimeters",
  SQUARE_CENTIMETERS: "esriSquareCentimeters",
  SQUARE_DECIMETERS: "esriSquareDecimeters"
};

(function() {
  var auxSphere = 'PROJCS["WGS_1984_Web_Mercator_Auxiliary_Sphere",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Mercator_Auxiliary_Sphere"],PARAMETER["False_Easting",0.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",${Central_Meridian}],PARAMETER["Standard_Parallel_1",0.0],PARAMETER["Auxiliary_Sphere_Type",0.0],UNIT["Meter",1.0]]';
  var valid = [ -20037508.342788905, 20037508.342788905 ];
  var origin = [ -20037508.342787, 20037508.342787 ];

dojo.declare("esri.SpatialReference", null, {
    constructor: function(json) {
      // Tests:
      /*
      console.log("1. " + ( dojo.toJson((new esri.SpatialReference()).toJson()) === "null" ));
      console.log("2. " + ( dojo.toJson((new esri.SpatialReference(4326)).toJson()) === "{\"wkid\":4326}" ));
      console.log("3. " + ( dojo.toJson((new esri.SpatialReference("somewellknowntext")).toJson()) === "{\"wkt\":\"somewellknowntext\"}" ));
      console.log("4. " + ( dojo.toJson((new esri.SpatialReference({ wkid: 4326 })).toJson()) === "{\"wkid\":4326}" ));
      console.log("5. " + ( dojo.toJson((new esri.SpatialReference({ wkt: "somewellknowntext" })).toJson()) === "{\"wkt\":\"somewellknowntext\"}" ));
      console.log("6. " + ( dojo.toJson((new esri.SpatialReference({})).toJson()) === "null" ));
      */
      
      if (json) { // relax, wkid cannot be 0 and wkt cannot be empty string
        if (dojo.isObject(json)) {
          dojo.mixin(this, json);
        }
        else if (dojo.isString(json)) {
          this.wkt = json;
        }
        else {
          this.wkid = json;
        }
      }
    },

    wkid: null,
    wkt: null,
    
    /*****************
     * Internal stuff
     *****************/

    // coordinate system info
    _info: {
      // Projected CS
      
      "102113": {
        wkTemplate: 'PROJCS["WGS_1984_Web_Mercator",GEOGCS["GCS_WGS_1984_Major_Auxiliary_Sphere",DATUM["D_WGS_1984_Major_Auxiliary_Sphere",SPHEROID["WGS_1984_Major_Auxiliary_Sphere",6378137.0,0.0]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Mercator"],PARAMETER["False_Easting",0.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",${Central_Meridian}],PARAMETER["Standard_Parallel_1",0.0],UNIT["Meter",1.0]]',
        valid: valid,
        origin: origin,
        dx: 0.00001 // Maximimum allowed difference between origin[0] and tileInfo.origin.x
      },
      
      "102100": {
        wkTemplate: auxSphere,
        valid: valid,
        origin: origin,
        dx: 0.00001
      },
      
      "3857": {
        wkTemplate: auxSphere,
        valid: valid,
        origin: origin,
        dx: 0.00001
      },
      
      // Geographic CS
      
      "4326": {
        wkTemplate: 'GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",${Central_Meridian}],UNIT["Degree",0.0174532925199433]]',
        // dynamic layers need this altTemplate
        altTemplate: 'PROJCS["WGS_1984_Plate_Carree",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Plate_Carree"],PARAMETER["False_Easting",0.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",${Central_Meridian}],UNIT["Degrees",111319.491]]',
        valid: [ -180, 180 ],
        origin: [ -180, 180 ],
        dx: 0.00001
      }
    },
      
    _isWebMercator: function() {
      // true if this spatial reference is web mercator
      return dojo.indexOf([ 102113, 102100, 3857, 3785 ], this.wkid) !== -1;
    },
    
    _isWrappable: function() {
      // true if we support wrap around for this spatial reference
      return dojo.indexOf([ 102113, 102100, 3857, 3785, 4326 ], this.wkid) !== -1;
    },
    
    _getInfo: function() {
      return this.wkid ? this._info[this.wkid] : null;
    },
    
    /*****************
     * Public Methods
     *****************/

    toJson: function() {
      if (this.wkid !== null) {
        return { wkid: this.wkid };
      }
      else if (this.wkt !== null) {
        return { wkt: this.wkt };
      }
      return null;
    }
  }
);

}());


dojo.mixin(esri.geometry,
  (function() {
    var earthRad = 6378137, // in meters
        PI = 3.14159265358979323846264338327950288,
        degPerRad = 57.295779513082320,
        radPerDeg =  0.017453292519943,
        //webMercatorSR = new esri.SpatialReference({ wkid:102100 }),
        //geographicSR = new esri.SpatialReference({ wkid:4326 }),
        floor = Math.floor,
        log = Math.log,
        sin = Math.sin,
        exp = Math.exp,
        atan = Math.atan;

    //lon/lat to web mercator conversion
    function radToDeg(rad) {
      return rad * degPerRad;
    }

    function degToRad(deg) {
      return deg * radPerDeg;
    }

    function lngLatToXY(lng, lat) {
      var lat_rad = degToRad(lat);
      return [degToRad(lng) * earthRad, earthRad/2.0 * log( (1.0 + sin(lat_rad)) / (1.0 - sin(lat_rad)) )];
    }
    
    function xyToLngLat(x, y, isLinear) {
      var lng_deg = radToDeg(x / earthRad);

      if (isLinear){
        return [lng_deg, radToDeg((PI / 2) - (2 * atan(exp(-1.0 * y / earthRad))))];
      }
      return [lng_deg - (floor((lng_deg + 180) / 360) * 360), radToDeg((PI / 2) - (2 * atan(exp(-1.0 * y / earthRad))))];
    }
    
    function convert(geom, func, sr, isLinear) {
      if (geom instanceof esri.geometry.Point) {
        var pt = func(geom.x, geom.y, isLinear);
        return new esri.geometry.Point(pt[0], pt[1], new esri.SpatialReference(sr));
      }
      else if (geom instanceof esri.geometry.Extent) {
        var min = func(geom.xmin, geom.ymin, isLinear),
            max = func(geom.xmax, geom.ymax, isLinear);
        return new esri.geometry.Extent(min[0], min[1], max[0], max[1], new esri.SpatialReference(sr));
      }
      else if (geom instanceof esri.geometry.Polyline || geom instanceof esri.geometry.Polygon) {
        var isPline = geom instanceof esri.geometry.Polyline,
            iRings = isPline ? geom.paths : geom.rings,
            oRings = [], oRing;

        dojo.forEach(iRings, function(iRing) {
          oRings.push(oRing = []);
          dojo.forEach(iRing, function(iPt) {
            oRing.push(func(iPt[0], iPt[1], isLinear));
          });
        });
        
        if (isPline) {
          return new esri.geometry.Polyline({ paths:oRings, spatialReference:sr });
        }
        else {
          return new esri.geometry.Polygon({ rings:oRings, spatialReference:sr });
        }
      }
      else if (geom instanceof esri.geometry.Multipoint) {
        var oPts = [];
        dojo.forEach(geom.points, function(iPt) {
          oPts.push(func(iPt[0], iPt[1], isLinear));
        });
        return new esri.geometry.Multipoint({ points:oPts, spatialReference:sr });
      }
    }

    //for scale calculation
    var inchesPerMeter = 39.37,
        decDegToMeters = 20015077.0 / 180.0,
        ecd = esri.config.defaults,
        lookup = esri.WKIDUnitConversion;

    return {
      //xyToLngLat, geographicSR
      geographicToWebMercator: function(geom) {
        return convert(geom, lngLatToXY, { wkid:102100 });
      },
      
      //lngLatToXY, webMercatorSR
      webMercatorToGeographic: function(geom, isLinear) {
        return convert(geom, xyToLngLat, { wkid:4326 }, isLinear);
      },

      //scale calculation
      getScale: function(map) {
        var extent, width, wkid, wkt;
        
        if (arguments.length > 1) { // backward compatibility for method signature
          extent = arguments[0];
          width = arguments[1];
          wkid = arguments[2];
        }
        else {
          extent = map.extent;
          width = map.width;
          
          var sr = map.spatialReference;
          if (sr) {
            wkid = sr.wkid;
            wkt = sr.wkt;
          }
        }
        
        var unitValue;
        
        if (wkid) {
          unitValue = lookup.values[lookup[wkid]];
        }
        else if ( wkt && (wkt.search(/^PROJCS/i) !== -1) ) {
          var result = /UNIT\[([^\]]+)\]\]$/i.exec(wkt);
          if (result && result[1]) {
            unitValue = parseFloat(result[1].split(",")[1]);
          }
        }
        // else assumed to be in degrees
        
        return esri.geometry._getScale(extent, width, unitValue);
      },
      
      _getScale: function(extent, mapWd, unitValue) {
        return (extent.getWidth() / mapWd) * (unitValue || decDegToMeters) * inchesPerMeter * ecd.screenDPI;
      },
      
      getExtentForScale: function(map, scale) {
        var wkid, wkt, sr = map.spatialReference;
        if (sr) {
          wkid = sr.wkid;
          wkt = sr.wkt;
        }

        var unitValue;
        
        if (wkid) {
          unitValue = lookup.values[lookup[wkid]];
        }
        else if ( wkt && (wkt.search(/^PROJCS/i) !== -1) ) {
          var result = /UNIT\[([^\]]+)\]\]$/i.exec(wkt);
          if (result && result[1]) {
            unitValue = parseFloat(result[1].split(",")[1]);
          }
        }
        // else assumed to be in degrees
        
        return esri.geometry._getExtentForScale(map.extent, map.width, unitValue, scale, true);
      },

      _getExtentForScale: function(extent, mapWd, wkid, scale, /*internal*/ wkidIsUnitValue) {
        var unitValue;
        if (wkidIsUnitValue) {
          unitValue = wkid;
        }
        else {
          unitValue = lookup.values[lookup[wkid]];
        }
        
        return extent.expand(((scale * mapWd) / ((unitValue || decDegToMeters) * inchesPerMeter * ecd.screenDPI)) / extent.getWidth());
      }
    };
  }()),

  {
    defaultPoint:{ type:"point", x:0, y:0 },
    defaultMultipoint: { type:"multipoint", points: null },
    defaultExtent:{ type:"extent", xmin:0, ymin:0, xmax:0, ymax:0 },
    defaultPolyline: { type:"polyline", paths:null },
    defaultPolygon: { type:"polygon", rings:null },

    _rectToExtent: function(/*esri.geometry.Rect*/ rect) {
      //summary: Returns an Extent representation of the argument Rect
      // rect: esri.geometry.Rect: Rect to convert
      // returns: esri.geometry.Extent: Converted Extent
      return new esri.geometry.Extent(parseFloat(rect.x), parseFloat(rect.y) - parseFloat(rect.height), parseFloat(rect.x) + parseFloat(rect.width), parseFloat(rect.y), rect.spatialReference);
    },

    _extentToRect: function(/*esri.geometry.Extent*/ extent) {
      //summary: Returns an Rect representation of the argument Extent
      // rect: esri.geometry.Extent: Extent to convert
      // returns: esri.geometry.Rect: Converted Rect
      return new esri.geometry.Rect(extent.xmin, extent.ymax, extent.getWidth(), extent.getHeight(), extent.spatialReference);
    },

  //  _lineToPolyline: function(/*esri.geometry.Line*/ line) {
  //    return new esri.geometry.Polyline({ paths:[[[line.x1, line.y1], [line.x2, line.y2]]], spatialReference:line.spatialReference });
  //  },

    fromJson: function(/*Object*/ json) {
      //Convert json representation to appropriate esri.geometry.* object
      if (json.x !== undefined && json.y !== undefined) {
        return new esri.geometry.Point(json);
      }
      else if (json.paths !== undefined) {
        return new esri.geometry.Polyline(json);
      }
      else if (json.rings !== undefined) {
        return new esri.geometry.Polygon(json);
      }
      else if (json.points !== undefined) {
        return new esri.geometry.Multipoint(json);
      }
      else if (json.xmin !== undefined && json.ymin !== undefined && json.xmax !== undefined && json.ymax !== undefined) {
        return new esri.geometry.Extent(json);
      }
    },

    getJsonType: function(/*esri.geometry.Geometry*/ geometry) {
      //summary: Returns the JSON type name for a given geometry. This is only
      //         for geometries that can be processed by the server
      // geometry: esri.geometry.Point/Polyline/Polygon/Extent: Geometry to get type for
      // returns: String: Geometry trype name as represented on server

      if (geometry instanceof esri.geometry.Point) {
        return "esriGeometryPoint";
      }
      else if (geometry instanceof esri.geometry.Polyline) {
        return "esriGeometryPolyline";
      }
      else if (geometry instanceof esri.geometry.Polygon) {
        return "esriGeometryPolygon";
      }
      else if (geometry instanceof esri.geometry.Extent) {
        return "esriGeometryEnvelope";
      }
      else if (geometry instanceof esri.geometry.Multipoint) {
        return "esriGeometryMultipoint";
      }

      return null;
    },
  
    getGeometryType: function(/*String*/ jsonType) {
      if (jsonType === "esriGeometryPoint") {
        return esri.geometry.Point;
      }
      else if (jsonType === "esriGeometryPolyline") {
        return esri.geometry.Polyline;
      }
      else if (jsonType === "esriGeometryPolygon") {
        return esri.geometry.Polygon;
      }
      else if (jsonType === "esriGeometryEnvelope") {
        return esri.geometry.Extent;
      }
      else if (jsonType === "esriGeometryMultipoint") {
        return esri.geometry.Multipoint;
      }
    
      return null;
    },

    isClockwise: function(/*[[0:x, 1:y]], ring/path*/ arr) {
      //summary: Returns true if Polygon ring is clockwise.
      // arr: esri.geometry.Point[]: Points array representing polygon path
      // returns: Boolean: True if ring is clockwise
      var area = 0, i, il = arr.length,
          func = dojo.isArray(arr[0]) ? 
                  function(p1, p2) { return p1[0] * p2[1] - p2[0] * p1[1]; } : 
                  function(p1, p2) { return p1.x * p2.y - p2.x * p1.y; };
      for (i=0; i<il; i++) {
        area += func(arr[i], arr[(i+1) % il]);
      }
      return (area / 2) <= 0;
    },

    toScreenPoint: function(/*esri.geometry.Extent*/ ext, /*Number*/ wd, /*Number*/ ht, /*esri.geometry.Point*/ pt, doNotRound) {
      //make sure to update esri.layers.GraphicsLayer.__toScreenPoint if you update this one
      if (doNotRound) {
        return new esri.geometry.Point((pt.x - ext.xmin) * (wd / ext.getWidth()),
                                       (ext.ymax - pt.y) * (ht / ext.getHeight()));
      }
      else {
        return new esri.geometry.Point(Math.round((pt.x - ext.xmin) * (wd / ext.getWidth())),
                                       Math.round((ext.ymax - pt.y) * (ht / ext.getHeight())));
      }
    },

    toScreenGeometry: function(/*esri.geometry.Extent*/ ext, /*Number*/ wd, /*Number*/ ht, /*esri.geometry.Geometry*/ g) {
      var x = ext.xmin,
          y = ext.ymax,
          rwd = wd / ext.getWidth(),
          rht = ht / ext.getHeight(),
          forEach = dojo.forEach,
          round = Math.round;

      if (g instanceof esri.geometry.Point) {
        return new esri.geometry.Point( round((g.x - x) * rwd),
                                        round((y - g.y) * rht));
      }
      else if (g instanceof esri.geometry.Multipoint) {
        var mp = new esri.geometry.Multipoint(),
            mpp = mp.points;
        forEach(g.points, function(pt, i) {
          mpp[i] = [round((pt[0] - x) * rwd), round((y - pt[1]) * rht)];
        });
        return mp;
      }
      else if (g instanceof esri.geometry.Extent) {
        return new esri.geometry.Extent(
          round((g.xmin - x) * rwd),
          round((y - g.ymin) * rht),
          round((g.xmax - x) * rwd),
          round((y - g.ymax) * rwd)
        );
      }
      else if (g instanceof esri.geometry.Polyline) {
        var pline = new esri.geometry.Polyline(),
            paths = pline.paths,
            newPath;
        forEach(g.paths, function(path, i) {
          newPath = (paths[i] = []);
          forEach(path, function(pt, j) {
            newPath[j] = [round((pt[0] - x) * rwd), round((y - pt[1]) * rht)];
          });
        });
        return pline;
      }
      else if (g instanceof esri.geometry.Polygon) {
        var pgon = new esri.geometry.Polygon(),
            rings = pgon.rings,
            newRing;
        forEach(g.rings, function(ring, i) {
          newRing = (rings[i] = []);
          forEach(ring, function(pt, j) {
            newRing[j] = [round((pt[0] - x) * rwd), round((y - pt[1]) * rht)];
          });
        });
        return pgon;
      }
    },

    _toScreenPath: (function() {
      var convert = (function() {
        // esri.vml won't be ready at this point
        if (dojo.isIE < 9) {
          return function(x, y, rwd, rht, dx, dy, inPaths) { //toVML
            var paths = [], //paths or rings, for simplicity in function variable names, just using path. But also applies for rings
                round = Math.round, p, pl = inPaths.length,
                path, pathIndex, pathLength, pt, x1, y1, x2, y2; //, left, top, left2, top2;

            for (p=0; p<pl; p++) {
              path = inPaths[p];
              pt = path[0];

              if ((pathLength = path.length) > 1) {
                pt = path[0];
                x1 = round(((pt[0] - x) * rwd) + dx);
                y1 = round(((y - pt[1]) * rht) + dy);
                x2 = round(((path[1][0] - x) * rwd) + dx);
                y2 = round(((y - path[1][1]) * rht) + dy);
                //left2 = x2 < x1 ? x2 : x1;
                //top2 = y2 < y1 ? y2 : y1;
                paths.push(
                  "M", x1 + "," + y1,
                  "L", x2 + "," + y2
                );

                for (pathIndex=2; pathIndex<pathLength; pathIndex++) {
                  pt = path[pathIndex];
                  x1 = round(((pt[0] - x) * rwd) + dx);
                  y1 = round(((y - pt[1]) * rht) + dy);
                  //left2 = x1 < left2 ? x1 : left2;
                  //top2 = y1 < top2 ? y1 : top2;
                  paths.push(x1 + "," + y1);
                }
              }
              else {
                x1 = round(((pt[0] - x) * rwd) + dx);
                y1 = round(((y - pt[1]) * rht) + dy);
                paths.push("M", x1 + "," + y1);
              }
              
              /*if (p === 0) { // first path
                left = left2;
                top = top2;
              }
              else {
                left = left2 < left ? left2 : left;
                top = top2 < top ? top2 : top;
              }*/
            }

            // We are calculating left and top here so that it can be used to
            // identify if clipping is required. Normally, this information
            // is available for free from GFX - but we've overridden GFX path
            // in VML using esri.gfx.Path impl which prevents GFX from getting
            // the necessary data. (see _GraphicsLayer::_getCorners)
            //geom._screenLeft = left;
            //geom._screenTop = top;

            return paths;
          };
        }
        else {
          return function(x, y, rwd, rht, dx, dy, inPaths) { //toGFX/SVG
            var paths = [], i, j, il, jl, path, pt,
                round = Math.round;
                /*forEach = dojo.forEach;

            forEach(inPaths, function(path, i) {
              paths.push("M");
              forEach(path, function(pt, j) {
                paths.push(round(((pt[0] - x) * rwd) + dx) + "," + round(((y - pt[1]) * rht) + dy));
              });
            });*/
           
            for (i = 0, il = inPaths ? inPaths.length : 0; i < il; i++) {
              path = inPaths[i];
              paths.push("M");
              for (j = 0, jl = path ? path.length : 0; j < jl; j++) {
                pt = path[j];
                paths.push(round(((pt[0] - x) * rwd) + dx) + "," + round(((y - pt[1]) * rht) + dy));
              }
            }
           
            return paths;
          };
        }
      }());
        
      return function(ext, wd, ht, g, dx, dy) {
        var isPline = g instanceof esri.geometry.Polyline;
        return convert(ext.xmin, ext.ymax, wd / ext.getWidth(), ht / ext.getHeight(), dx, dy, isPline ? g.paths : g.rings);
      };
    }()),
  
    // _toScreenPath: function(ext, wd, ht, g, dx, dy) {
    //   var x = ext.xmin,
    //       y = ext.ymax,
    //       rwd = wd / ext.getWidth(),
    //       rht = ht / ext.getHeight(),
    //       forEach = dojo.forEach,
    //       round = Math.round;
    // 
    //   if (g instanceof esri.geometry.Polyline) {
    //     var paths = [];
    //     forEach(g.paths, function(path, i) {
    //       paths.push("M");
    //       forEach(path, function(pt, j) {
    //         paths.push((round((pt[0] - x) * rwd) + dx) + "," + (round((y - pt[1]) * rht) + dy));
    //       });
    //     });
    //     return paths;
    //   }
    //   else if (g instanceof esri.geometry.Polygon) {
    //     var rings = [];
    //     forEach(g.rings, function(ring, i) {
    //       rings.push("M");
    //       forEach(ring, function(pt, j) {
    //         rings.push((round((pt[0] - x) * rwd) + dx) + "," + (round((y - pt[1]) * rht) + dy));
    //       });
    //       rings.push("Z");
    //     });
    //     return rings;
    //   }
    // },

    toMapPoint: function(/*esri.geometry.Extent*/ ext, /*Number*/ wd, /*Number*/ ht, /*esri.geometry.Point*/ pt) {
      return new esri.geometry.Point(ext.xmin + (pt.x / (wd / ext.getWidth())),
                                     ext.ymax - (pt.y / (ht / ext.getHeight())),
                                     ext.spatialReference);
    },
  
    toMapGeometry: function(/*esri.geometry.Extent*/ ext, /*Number*/ wd, /*Number*/ ht, /*esri.geometry.Geometry*/ g) {
      var x = ext.xmin,
          y = ext.ymax,
          sr = ext.spatialReference,
          rwd = wd / ext.getWidth(),
          rht = ht / ext.getHeight(),
          forEach = dojo.forEach;

      if (g instanceof esri.geometry.Point) {
        return new esri.geometry.Point( x + (g.x / rwd),
                                        y - (g.y / rht),
                                        sr);
      }
      else if (g instanceof esri.geometry.Multipoint) {
        var mp = new esri.geometry.Multipoint(sr),
            mpp = mp.points;
        forEach(g.points, function(pt, i) {
          mpp[i] = [x + (pt[0] / rwd), y - (pt[1] / rht)];
        });
        return mp;
      }
      else if (g instanceof esri.geometry.Extent) {
        return new esri.geometry.Extent(x + (g.xmin / rwd),
                                        y - (g.ymin / rht),
                                        x + (g.xmax / rwd),
                                        y - (g.ymax / rht),
                                        sr);
      }
      else if (g instanceof esri.geometry.Polyline) {
        var pline = new esri.geometry.Polyline(sr),
            paths = pline.paths,
            newPath;
        forEach(g.paths, function(path, i) {
          newPath = (paths[i] = []);
          forEach(path, function(pt, j) {
            newPath[j] = [x + (pt[0] / rwd), y - (pt[1] / rht)];
          });
        });
        return pline;
      }
      else if (g instanceof esri.geometry.Polygon) {
        var pgon = new esri.geometry.Polygon(sr),
            rings = pgon.rings,
            newRing;
        forEach(g.rings, function(ring, i) {
          newRing = (rings[i] = []);
          forEach(ring, function(pt, j) {
            newRing[j] = [x + (pt[0] / rwd), y - (pt[1] / rht)];
          });
        });
        return pgon;
      }
    },
  
    getLength: function(pt1, pt2) {
      //summary: Returns the length of this line
      //returns: double: length of line
      var dx = pt2.x - pt1.x,
          dy = pt2.y - pt1.y;

      return Math.sqrt(dx*dx + dy*dy);
    },
  
    _getLength: function(pt1, pt2) {
      var dx = pt2[0] - pt1[0],
          dy = pt2[1] - pt1[1];

      return Math.sqrt(dx*dx + dy*dy);
    },
  
    getMidpoint: function(pt0, pt1) {
      return esri.geometry.getPointOnLine(pt0, pt1, 0.5);
    },

    getPointOnLine: function(pt0, pt1, fraction) {
      if (pt0 instanceof esri.geometry.Point) {
        return new esri.geometry.Point(pt0.x + fraction * (pt1.x - pt0.x), pt0.y + fraction * (pt1.y - pt0.y));
      }
      else {
        return [pt0[0] + fraction * (pt1[0] - pt0[0]), pt0[1] + fraction * (pt1[1] - pt0[1])];
      }
    },
  
    _equals: function(n1, n2) {
      return Math.abs(n1 - n2) < 1.0e-8;
    },
  
    getLineIntersection: function(line1start, line1end, line2start, line2end) {
      var pt = esri.geometry._getLineIntersection([line1start.x, line1start.y], [line1end.x, line1end.y], [line2start.x, line2start.y], [line2end.x, line2end.y]);
      if (pt) {
        pt = new esri.geometry.Point(pt[0], pt[1]);
      }
      return pt;
    },

    _getLineIntersection: function(p0, p1, p2, p3) {
      var INFINITY = 1e10, x, y,

          a0 = esri.geometry._equals(p0[0], p1[0]) ? INFINITY : (p0[1] - p1[1]) / (p0[0] - p1[0]),
          a1 = esri.geometry._equals(p2[0], p3[0]) ? INFINITY : (p2[1] - p3[1]) / (p2[0] - p3[0]),

          b0 = p0[1] - a0 * p0[0],
          b1 = p2[1] - a1 * p2[0];
          
      // a0 and a1 are line slopes
    
      // Check if lines are parallel
      if (esri.geometry._equals(a0, a1)) {
        if (!esri.geometry._equals(b0, b1)) {
          return null; // Parallell non-overlapping
        }
        else {
          if (esri.geometry._equals(p0[0], p1[0])) {
            if (Math.min(p0[1], p1[1]) < Math.max(p2[1], p3[1]) || Math.max(p0[1], p1[1]) > Math.min(p2[1], p3[1])) {
              y = (p0[1] + p1[1] + p2[1] + p3[1] - Math.min(p0[1], p1[1], p2[1], p3[1]) - Math.max(p0[1], p1[1], p2[1], p3[1])) / 2.0;
              x = (y - b0) / a0;
            }
            else {
              return null; // Parallell non-overlapping
            }
          }
          else {
            if (Math.min(p0[0], p1[0]) < Math.max(p2[0], p3[0]) || Math.max(p0[0], p1[0]) > Math.min(p2[0], p3[0])) {
              x = (p0[0] + p1[0] + p2[0] + p3[0] - Math.min(p0[0], p1[0], p2[0], p3[0]) - Math.max(p0[0], p1[0], p2[0], p3[0])) / 2.0;
              y = a0 * x + b0;
            }
            else {
              return null;
            }
          }
        
          return [x, y];
        }
      }
    
      if (esri.geometry._equals(a0, INFINITY)) {
        x = p0[0];
        y = a1 * x + b1;
      }
      else if (esri.geometry._equals(a1, INFINITY)) {
        x = p2[0];
        y = a0 * x + b0;
      }
      else {
        x = - (b0 - b1) / (a0 - a1);
        y = a0 * x + b0; 
      }

      return [x, y];
    },
    
    // Returns "true" if the given lines intersect each other
    _getLineIntersection2: function(/*[[x1, y1], [x2, y2]]*/ line1, /*[[x3, y3], [x4, y4]]*/ line2) {
      // Algorithm: http://local.wasp.uwa.edu.au/~pbourke/geometry/lineline2d/
      
      // This algorithm determines if the lines intersect
      // between the given points. For interesection points
      // beyond the lengths of the line segments use 
      // "_getLineIntersection3"
      
      var p1 = line1[0], p2 = line1[1],
          p3 = line2[0], p4 = line2[1],
          x1 = p1[0], y1 = p1[1],
          x2 = p2[0], y2 = p2[1],
          x3 = p3[0], y3 = p3[1],
          x4 = p4[0], y4 = p4[1],
          x43 = x4 - x3, x13 = x1 - x3, x21 = x2 - x1,
          y43 = y4 - y3, y13 = y1 - y3, y21 = y2 - y1,
          denom = (y43 * x21) - (x43 * y21),
          ua, ub, px, py;
      
      if (denom === 0) {
        return false; // parallel or coincident
      }
      
      ua = ( (x43 * y13) - (y43 * x13) ) / denom;
      ub = ( (x21 * y13) - (y21 * x13) ) / denom;
      
      if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
        px = x1 + (ua * (x2 - x1));
        py = y1 + (ua * (y2 - y1)); // you're seeing it right. we are using "ua"
        //console.log("Lines intersect at this point - ", px, py);
        return [px,py];
        //return true;
      }
      else {
        return false;
      }
    },
    
    _pointLineDistance: function(point, line) {
      // Returns the shortest distance from point to line
      // Algorithm: http://local.wasp.uwa.edu.au/~pbourke/geometry/pointline/
      
      var p1 = line[0], p2 = line[1],
          x1 = p1[0], y1 = p1[1], x2 = p2[0], y2 = p2[1],
          x3 = point[0], y3 = point[1],
          x21 = x2 - x1, y21 = y2 - y1,
          x31 = x3 - x1, y31 = y3 - y1,
          sqrt = Math.sqrt, pow = Math.pow,
          mag = sqrt(pow(x21, 2) + pow(y21, 2)),
          u = ((x31 * x21) + (y31 * y21)) / (mag * mag),
          x = x1 + u * x21, y = y1 + u * y21;
      
      return sqrt(pow(x3-x, 2) + pow(y3-y, 2));
    }
    
//    // TODO
//    // Need to replace _getLineIntersection above with this algorithm
//    // as it is much faster
//    // Test page: http://pponnusamy.esri.com:9090/jsapi/mapapps/testing/v20/line-intersection-tests.html
//    _getLineIntersection3: function(/*[[x1, y1], [x2, y2]]*/ line1, /*[[x3, y3], [x4, y4]]*/ line2) {
//      // Algorithm: http://en.wikipedia.org/wiki/Line-line_intersection
//
//      // Note that the intersection point is for the infinitely long lines 
//      // defined by the points, rather than the line segments between the points, 
//      // and can produce an intersection point beyond the lengths of the line segments.
//
//      var p1 = line1[0], p2 = line1[1];
//      var p3 = line2[0], p4 = line2[1];
//      var x1 = p1[0], y1 = p1[1];
//      var x2 = p2[0], y2 = p2[1];
//      var x3 = p3[0], y3 = p3[1];
//      var x4 = p4[0], y4 = p4[1];
//      
//      var dx12 = x1 - x2, dy12 = y1 - y2;
//      var dx34 = x3 - x4, dy34 = y3 - y4;
//      var x1y2 = x1 * y2, y1x2 = y1 * x2;
//      var x3y4 = x3 * y4, y3x4 = y3 * x4;
//      
//      var denom = (dx12 * dy34) - (dy12 * dx34);
//      var diff1 = x1y2 - y1x2;
//      var diff2 = x3y4 - y3x4;
//      var px = ( (diff1 * dx34) - (dx12 * diff2) ) / denom;
//      var py = ( (diff1 * dy34) - (dy12 * diff2) ) / denom;
//      //console.log("Lines intersect at this point - ", px, py);
//      return [px, py];
//    }

  }
);

dojo.declare("esri.geometry.Geometry", null, {
    // spatialReference: esri.SpatialReference: spatial reference well-known-id
    spatialReference: null,
    type: null,

    setSpatialReference: function(/*esri.SpatialReference*/ sr) {
      this.spatialReference = sr;
      return this;
    },

    getExtent: function() {
      return null;
    }
  }
);

dojo.declare("esri.geometry.Point", esri.geometry.Geometry, {
    constructor: function(/*Array|Object|Number*/ x, /*esri.SpatialReference|Number*/ y, /*esri.SpatialReference*/ spatialReference) {
      //summary: Create a new Point object
      // x: Number or Object: x coordinate of point or { x, y, spatialReference } object
      // y: Number: y coordinate of point
      // spatialReference: esri.SpatialReference: spatial reference well-known-id
      dojo.mixin(this, esri.geometry.defaultPoint);
      if (dojo.isArray(x)) {
        this.x = x[0];
        this.y = x[1];
        this.spatialReference = y;
      }
      else if (dojo.isObject(x)) {
        dojo.mixin(this, x);
        if (this.spatialReference) {
          this.spatialReference = new esri.SpatialReference(this.spatialReference);
        }
      }
      else {
        this.x = x;
        this.y = y;
        this.spatialReference = spatialReference;
      }
    },

    offset: function(/*Number*/ x, /*Number*/ y) {
      //summary: Creates and returns new point offsetted by argument distance
      // x: Number: Offset in x direction
      // y: Number: Offset in y direction
      // return: esri.geometry.Point: offsetted point
      return new esri.geometry.Point(this.x + x, this.y + y, this.spatialReference);
    },

    setX: function(/*Number*/ x) {
      this.x = x;
      return this;
    },

    setY: function(/*Number*/ y) {
      this.y = y;
      return this;
    },
    
    update: function(x, y) {
      this.x = x;
      this.y = y;
      return this;
    },
    
    /*getExtent: function() {
      var x = this.x, y = this.y, sr = this.spatialReference;
      
      return new esri.geometry.Extent(
        x, y, x, y, 
        sr && new esri.SpatialReference(sr.toJson())
      );
    },*/
    
    normalize: function() {
      // Shifts "x" to within +/- 180 span
      
      /*// Test cases:
      var res, sr = new esri.SpatialReference({ wkid: 4326 });
      res = esri.geometry.Point.prototype.normalize.call({ x: -200, spatialReference: sr });
      console.log(res.x === 160);
      res = esri.geometry.Point.prototype.normalize.call({ x: -528, spatialReference: sr });
      console.log(res.x === -168);
      res = esri.geometry.Point.prototype.normalize.call({ x: -1676, spatialReference: sr });
      console.log(res.x === 124);
      res = esri.geometry.Point.prototype.normalize.call({ x: -181, spatialReference: sr });
      console.log(res.x === 179);
      res = esri.geometry.Point.prototype.normalize.call({ x: 250, spatialReference: sr });
      console.log(res.x === -110);
      res = esri.geometry.Point.prototype.normalize.call({ x: 896, spatialReference: sr });
      console.log(res.x === 176);
      res = esri.geometry.Point.prototype.normalize.call({ x: 181, spatialReference: sr });
      console.log(res.x === -179);
      res = esri.geometry.Point.prototype.normalize.call({ x: 2346, spatialReference: sr });
      console.log(res.x === -174);*/
      
      var x = this.x, sr = this.spatialReference;
      
      if (sr) {
        var info = sr._getInfo();
        if (info) {
          var minus180 = info.valid[0], plus180 = info.valid[1], world = 2 * plus180, ratio;
  
          if (x > plus180) {
            /*while (x > plus180) {
              x -= world;
            }*/
            ratio = Math.ceil(Math.abs(x - plus180) / world);
            x -= (ratio * world);
          }
          else if (x < minus180) {
            /*while (x < minus180) {
              x += world;
            }*/
            ratio = Math.ceil(Math.abs(x - minus180) / world);
            x += (ratio * world);
          }
        }
      }

      return new esri.geometry.Point(x, this.y, sr);
    },

//    toString: function() {
//      return this.declaredClass + "(" + this.x + ", " + this.y + (this.spatialReference ? ", " + this.spatialReference : "") + ")";
//    },

    toJson: function() {
      var json = { x:this.x, y:this.y },
          sr = this.spatialReference;
      if (sr) {
        json.spatialReference = sr.toJson();
      }
      return json;
    }
  }
);

dojo.declare("esri.geometry.Polyline", esri.geometry.Geometry, {
    constructor: function(/*Object*/ obj) {
      //summary: Create a new Polyline object
      // sr: esri.SpatialReference: spatial reference or REST JSON object
      dojo.mixin(this, esri.geometry.defaultPolyline);
      this.paths = [];
      this._path = 0;
  
      if (obj) {
        if (obj.paths) {
          dojo.mixin(this, obj);
        }
        else {
          this.spatialReference = obj;
        }
        this.spatialReference = new esri.SpatialReference(this.spatialReference);
      }
    },

    _extent: null,
//    _length: null,

    addPath: function(/*esri.geometry.Point[] or json.paths[i]*/ points) {
      //summary: Add path to polyline
      // points: esri.geometry.Point[] or json.paths[i]: Points on path or a path in json format
      this._extent = null; //this._length 
      this._path = this.paths.length;
      this.paths[this._path] = [];
      if (dojo.isArray(points[0])) {
        dojo.forEach(points, this._addPointArr, this);
      }
      else {
        dojo.forEach(points, this._addPoint, this);
      }
      return this;
    },

    _addPointArr: function(/*[x, y]*/ point) {
      // point: [x, y]: Add point to path
      this.paths[this._path].push(point); //[point[0], point[1]]);
    },

    _addPoint: function(/*esri.geometry.Point*/ point) {
      // point: esri.geometry.Point: Add point to path
      this.paths[this._path].push([point.x, point.y]);
    },

    _insertPoints: function(/*esri.geometry.Point[]*/ points, /*int*/ index) {
      //summary: insert points into path at specified path index
      // points: esri.geometry.Point[]: Points to insert into path
      // index: int: Index to insert points in path
      this._extent = null; //this._length
      this._path = index;
      if (! this.paths[this._path]) {
        this.paths[this._path] = [];
      }
      dojo.forEach(points, this._addPoint, this);
    },

    _validateInputs: function(pathIndex, pointIndex) {
      if ((pathIndex !== null && pathIndex !== undefined) && (pathIndex < 0 || pathIndex >= this.paths.length)) {
        return false;
      }

      if ((pointIndex !== null && pathIndex !== undefined) && (pointIndex < 0 || pointIndex >= this.paths[pathIndex].length)) {
        return false;
      }

      return true;
    },

    getPoint: function(pathIndex, pointIndex) {
      //summary: 
      if (this._validateInputs(pathIndex, pointIndex)) {
        return new esri.geometry.Point(this.paths[pathIndex][pointIndex], this.spatialReference);

        /*var point = this.paths[pathIndex][pointIndex];
        point = new esri.geometry.Point(point[0], point[1], this.spatialReference);
        point.setSpatialReference(this.spatialReference);
        return point;*/
      }
    },

    setPoint: function(pathIndex, pointIndex, point) {
      if (this._validateInputs(pathIndex, pointIndex)) {
        this._extent = null;
        this.paths[pathIndex][pointIndex] = [point.x, point.y];
        return this;
      }
    },
    
    insertPoint: function(pathIndex, pointIndex, point) {
      if (
        this._validateInputs(pathIndex) && 
        esri._isDefined(pointIndex) && (pointIndex >= 0 && pointIndex <= this.paths[pathIndex].length) 
      ) {
        this._extent = null;
        this.paths[pathIndex].splice(pointIndex, 0, [point.x, point.y]);
        return this;
      }
    },

    removePath: function(index) {
      //summary: remove path at argument index
      // index: int: Index of path to be removed
      // returns: esri.geometry.Point[]: Returns array of points representing the removed path
      if (this._validateInputs(index, null)) {
        this._extent = null; //this._length = 
        var arr = this.paths.splice(index, 1)[0],
            i, il = arr.length,
            point = esri.geometry.Point,
            sr = this.spatialReference;
        for (i = 0; i < il; i++) {
          arr[i] = new point(arr[i], sr);
        }
        return arr;
      }
    },

    removePoint: function(pathIndex, pointIndex) {
      if (this._validateInputs(pathIndex, pointIndex)) {
        this._extent = null;
        return new esri.geometry.Point(this.paths[pathIndex].splice(pointIndex, 1)[0], this.spatialReference);
      }
    },

    getExtent: function() {
      var retVal;
      if (this._extent) {
        retVal = new esri.geometry.Extent(this._extent);
        retVal._partwise = this._partwise;
        return retVal;
      }

      var paths = this.paths, pal = paths.length;
      if (!pal || !paths[0].length) {
        return;
      }

      var path, point, x, y, xmax, ymax, pa, pt, ptl,
          xmin = (xmax = paths[0][0][0]),
          ymin = (ymax = paths[0][0][1]),
          min = Math.min,
          max = Math.max,
          sr = this.spatialReference,
          parts = [], rxmin, rxmax, rymin, rymax;
          
      for (pa=0; pa<pal; pa++) {
        path = paths[pa];
        rxmin = (rxmax = path[0] && path[0][0]);
        rymin = (rymax = path[0] && path[0][1]);
        ptl = path.length;
        
        for (pt=0; pt < ptl; pt++) {
          point = path[pt];
          x = point[0];
          y = point[1];
          xmin = min(xmin, x);
          ymin = min(ymin, y);
          xmax = max(xmax, x);
          ymax = max(ymax, y);
          
          rxmin = min(rxmin, x);
          rymin = min(rymin, y);
          rxmax = max(rxmax, x);
          rymax = max(rymax, y);
        }
        parts.push(new esri.geometry.Extent({ xmin: rxmin, ymin: rymin, xmax: rxmax, ymax: rymax, spatialReference:(sr ? sr.toJson() : null) }));
      }
      
      this._extent = { xmin:xmin, ymin:ymin, xmax:xmax, ymax:ymax, spatialReference:sr ? sr.toJson() : null };
      this._partwise = parts.length > 1 ? parts : null;
      
      retVal = new esri.geometry.Extent(this._extent);
      retVal._partwise = this._partwise;
      return retVal;
    },

    /*getLength: function() {
      if (this._length) {
        return this._length;
      }

      var paths = this.paths, path, l = 0, gl = esri.geometry._getLength;
      for (var pa = 0, pal=paths.length; pa < pal; pa++) {
        path = paths[pa];

        for (var p=0, pl=path.length; p<pl-1; p++) {
          l += gl(path[p], path[p+1]);
        }
      }

      return (this._length = l);
    },

    intersects: function(point) {
      var paths = this.paths, path, length, gl = esri.geometry._getLength, u, pi, pj, xp, yp, l;

      for (var pa=0, pal=paths.length; pa<pal; pa++) {
        path = paths[pa];

        for (var p=0, pl=path.length-1; p<pl; p++) {
          pi = path[p];
          pj = path[p+1];
          length = gl(pi, pj);

          if (length == 0) {
            length = gl(path[p], [point.x, point.y]);
          }

          u = ((point.x - pi[0]) * (pj[0] - pi[0]) + (point.y - pi[1]) * (pj[1] - pi[1])) / (length * length);
              
          xp = pi[0] + u * (pj[0] - pi[0]);
          yp = pi[1] + u * (pj[1] - pi[1]);

          l = gl([xp, yp], [point.x, point.y]);
          if (! l) {
            return true;
          }
        }
      }

      return false;
    },*/

//    toString: function() {
//      return this.declaredClass + "(" + this.paths + (this.spatialReference ? ", " + this.spatialReference : "") + ")";
//    },

    toJson: function() {
      //var json = { paths: [].concat(this.paths) },
      var json = { paths: dojo.clone(this.paths) },
          sr = this.spatialReference;
      if (sr) {
        json.spatialReference = sr.toJson();
      }
      return json;
    }
  }
);

dojo.declare("esri.geometry.Polygon", esri.geometry.Geometry, {
    constructor: function(/*Object*/ obj) {
      //summary: Create a new Polygon object
      // sr: esri.SpatialReference: spatial reference or REST JSON
      dojo.mixin(this, esri.geometry.defaultPolygon);
      this.rings = [];
      this._ring = 0;
  
      if (obj) {
        if (obj.rings) {
          dojo.mixin(this, obj);
        }
        else {
          this.spatialReference = obj;
        }
        this.spatialReference = new esri.SpatialReference(this.spatialReference);
      }
    },

    _extent: null,
//    _area: null,
//    _length: null,

    addRing: function(/*esri.geometry.Point[]*/ points) {
      //summary: Add ring to polylgon
      // points: esri.geometry.Point[] or json.rings[i]: Points on ring or a ring in json format
      this._extent = null; //(this._area = (this._length = null))
      this._ring = this.rings.length;
      this.rings[this._ring] = [];

      if (dojo.isArray(points[0])) {
        dojo.forEach(points, this._addPointArr, this);
      }
      else {
        dojo.forEach(points, this._addPoint, this);
      }
      return this;
    },

    _addPointArr: function(/*[x, y]*/ point) {
      // point: [x, y]: Add point to ring
      this.rings[this._ring].push(point); //[point[0], point[1]]);
    },

    _addPoint: function(/*esri.geometry.Point*/ point) {
      // point: esri.geometry.Point: Add point to ring
      this.rings[this._ring].push([point.x, point.y]);
    },

    _insertPoints: function(/*esri.geometry.Point[]*/ points, /*int*/ index) {
      //summary: insert points into ring at specified ring index
      // points: esri.geometry.Point[]: Points to insert into path
      // index: int: Index to insert points in path
      this._extent = null; //(this._area = (this._length = null))
      this._ring = index;
      if (! this.rings[this._ring]) {
        this.rings[this._ring] = [];
      }
      dojo.forEach(points, this._addPoint, this);
    },

    _validateInputs: function(ringIndex, pointIndex) {
      if ((ringIndex !== null && ringIndex !== undefined) && (ringIndex < 0 || ringIndex >= this.rings.length)) {
        return false;
      }

      if ((pointIndex !== null && ringIndex !== undefined) && (pointIndex < 0 || pointIndex >= this.rings[ringIndex].length)) {
        return false;
      }

      return true;
    },

    getPoint: function(ringIndex, pointIndex) {
      //summary: 
      if (this._validateInputs(ringIndex, pointIndex)) {
        return new esri.geometry.Point(this.rings[ringIndex][pointIndex], this.spatialReference);
        
        /*var point = this.rings[ringIndex][pointIndex];
        point = new esri.geometry.Point(point[0], point[1], this.spatialReference);
        point.setSpatialReference(this.spatialReference);
        return point;*/
      }
    },

    setPoint: function(ringIndex, pointIndex, point) {
      if (this._validateInputs(ringIndex, pointIndex)) {
        this._extent = null;
        this.rings[ringIndex][pointIndex] = [point.x, point.y];
        return this;
      }
    },

    insertPoint: function(ringIndex, pointIndex, point) {
      // Note: its the caller's responsibility to make sure the ring is 
      // properly closed i.e. first and the last point should be the same
      
      if (
        this._validateInputs(ringIndex) &&
        esri._isDefined(pointIndex) && (pointIndex >= 0 && pointIndex <= this.rings[ringIndex].length)
      ) {
        this._extent = null;
        this.rings[ringIndex].splice(pointIndex, 0, [point.x, point.y]);
        return this;
      }
    },

    removeRing: function(index) {
      //summary: remove ring at argument index
      // index: int: Index of ring to be removed
      // returns: esri.geometry.Point[]: Returns array of points representing the removed ring
      if (this._validateInputs(index, null)) {
        this._extent = null; //(this._area = (this._length = null)
        var arr = this.rings.splice(index, 1)[0],
            i, il = arr.length,
            point = esri.geometry.Point,
            sr = this.spatialReference;
        for (i = 0; i < il; i++) {
          arr[i] = new point(arr[i], sr);
        }
        return arr;
      }
    },
    
    removePoint: function(ringIndex, pointIndex) {
      if (this._validateInputs(ringIndex, pointIndex)) {
        this._extent = null;
        return new esri.geometry.Point(this.rings[ringIndex].splice(pointIndex, 1)[0], this.spatialReference);
      }
    },

    getExtent: function() {
      var retVal;
      if (this._extent) {
        retVal = new esri.geometry.Extent(this._extent);
        retVal._partwise = this._partwise;
        return retVal;
      }

      var rings = this.rings, pal = rings.length;
      if (!pal || !rings[0].length) {
        return;
      }
      
      var ring, point, x, y, xmax, ymax, pa, pt, ptl,
          xmin = (xmax = rings[0][0][0]),
          ymin = (ymax = rings[0][0][1]),
          min = Math.min,
          max = Math.max,
          sr = this.spatialReference, 
          parts = [], rxmin, rxmax, rymin, rymax;
          
      for (pa=0; pa<pal; pa++) {
        ring = rings[pa];
        rxmin = (rxmax = ring[0] && ring[0][0]);
        rymin = (rymax = ring[0] && ring[0][1]);
        ptl = ring.length;
        
        for (pt=0; pt < ptl; pt++) {
          point = ring[pt];
          x = point[0];
          y = point[1];
          xmin = min(xmin, x);
          ymin = min(ymin, y);
          xmax = max(xmax, x);
          ymax = max(ymax, y);
          
          rxmin = min(rxmin, x);
          rymin = min(rymin, y);
          rxmax = max(rxmax, x);
          rymax = max(rymax, y);
        }
        parts.push(new esri.geometry.Extent({ xmin: rxmin, ymin: rymin, xmax: rxmax, ymax: rymax, spatialReference:(sr ? sr.toJson() : null) }));
      }
      
      this._extent = { xmin:xmin, ymin:ymin, xmax:xmax, ymax:ymax, spatialReference:(sr ? sr.toJson() : null) };
      this._partwise = parts.length > 1 ? parts : null;
      
      retVal = new esri.geometry.Extent(this._extent);
      retVal._partwise = this._partwise;
      return retVal;
    },
    
    contains: function(point) {
      var rings = this.rings, ring, isInside = false, pi, pj, nPoints, j, i, pa, pal = rings.length;

      for (pa=0; pa<pal; pa++) {
        ring = rings[pa];

        nPoints = ring.length;
        j = 0;
        for (i=0; i<nPoints; i++) {
          j++;
          if (j === nPoints) {
            j = 0;
          }
          pi = ring[i];
          pj = ring[j];

          if ((pi[1] < point.y && pj[1] >= point.y || pj[1] < point.y && pi[1] >= point.y) && (pi[0] + (point.y - pi[1]) / (pj[1] - pi[1]) * (pj[0] - pi[0]) < point.x)) {
            isInside = !isInside;
          }
        }            
      }

      return isInside;
    },

    /*getArea: function() {
      if (this._area) {
        return this._area;
      }

      var rings = this.rings;
      var area = 0;

      for (var pa = 0, pal = rings.length; pa < pal; pa++) {
        area += this._getArea(rings[pa]);
      }

      return (this._area = Math.abs(area));
    },

    _getArea: function(ring) {
      var pi, pj, n = ring.length, area = 0;

      for (var i=0; i<n-1; i++) {
        pi = ring[i];
        pj = ring[i+1];
        area += (pi[0] * pj[1]) - (pj[0] * pi[1]);
      }

      pi = ring[0];
      pj = ring[n-1];
      
      area += (pj[0] * pi[1]) - (pi[0] * pj[1]);
      return area * 0.5;
    },

    getLength: function() {
      if (this._length) {
        return this._length;
      }

      var paths = this.paths, path, l = 0, gl = esri.geometry._getLength;
      for (var pa = 0, pal=paths.length; pa < pal; pa++) {
        path = paths[pa];

        for (var p=0, pl=path.length; p<pl-1; p++) {
          l += gl(path[p], path[p+1]);
        }

        l += gl(path[path.length - 1], path[0]);
      }

      return (this._length = l);
    },*/

//    toString: function() {
//      return this.declaredClass + "(" + this.rings + (this.spatialReference ? ", " + this.spatialReference : "") + ")";
//    },

    toJson: function() {
      //var json = { rings: [].concat(this.rings) },
      var json = { rings: dojo.clone(this.rings) },
          sr = this.spatialReference;
      if (sr) {
        json.spatialReference = sr.toJson();
      }
      return json;
    }
  }
);

dojo.declare("esri.geometry.Multipoint", esri.geometry.Geometry, {
    constructor: function(/*JSON or esri.SpatialReference*/ obj) {
      dojo.mixin(this, esri.geometry.defaultMultipoint);
      this.points = [];

      if (obj) {
        if (obj.points) {
          dojo.mixin(this, obj);
        }
        else {
          this.spatialReference = obj;
        }
        this.spatialReference = new esri.SpatialReference(this.spatialReference);
      }
    },

    _extent: null,

    addPoint: function(/*Array[x,y]|esri.geometry.Point*/ point) {
      this._extent = null;
      if (dojo.isArray(point)) {
        this.points.push(point);
      }
      else {
        this.points.push([point.x, point.y]);
      }
      return this;
    },

    removePoint: function(index) {
      if (this._validateInputs(index)) {
        this._extent = null;
        return new esri.geometry.Point(this.points.splice(index, 1)[0], this.spatialReference);
      }
    },

    getExtent: function() {
      if (this._extent) {
        return new esri.geometry.Extent(this._extent);
      }

      var points = this.points, il = points.length;
      if (!il) {
        return;
      }

      var point = points[0], xmax, ymax,
          xmin = (xmax = point[0]),
          ymin = (ymax = point[1]),
          min = Math.min,
          max = Math.max,
          sr = this.spatialReference,
          x, y, i;

      for (i=0; i<il; i++) {
        point = points[i];
        x = point[0];
        y = point[1];
        xmin = min(xmin, x);
        ymin = min(ymin, y);
        xmax = max(xmax, x);
        ymax = max(ymax, y);
      }
      
      this._extent = { xmin:xmin, ymin:ymin, xmax:xmax, ymax:ymax, spatialReference:sr ? sr.toJson() : null };
      return new esri.geometry.Extent(this._extent);
    },

    _validateInputs: function(index) {
      if (index === null || index < 0 || index >= this.points.length) {
        return false;
      }
      
      return true;
    },

    getPoint: function(index) {
      if (this._validateInputs(index)) {
        var point = this.points[index];
        return new esri.geometry.Point(point[0], point[1], this.spatialReference);
      }
    },

    setPoint: function(index, point) {
      if (this._validateInputs(index)) {
        this._extent = null;
        this.points[index] = [ point.x, point.y ];
        return this;
      }
    },

//    toString: function() {
//      return this.declaredClass + "(" + this.points + (this.spatialReference ? ", " + this.spatialReference : "") + ")";
//    },

    toJson: function() {
      //var json = { points: [].concat(this.points) },
      var json = { points: dojo.clone(this.points) },
          sr = this.spatialReference;
      if (sr) {
        json.spatialReference = sr.toJson();
      }
      return json;
    }
  }
);

dojo.declare("esri.geometry.Extent", esri.geometry.Geometry, {
    constructor: function(/*Number or Object*/ xmin, /*Number*/ ymin, /*Number*/ xmax, /*Number*/ ymax, /*esri.SpatialReference*/ spatialReference) {
      //summary: Create a new Extent object
      // xmin: Number or Object: Bottom-left x coordinate or { xmin, ymin, xmax, ymax, spatialReference } object.
      // ymin: Number: Bottom-left y coordinate
      // xmax: Number: Top-right x coordinate
      // ymax: Number: Top-right y coordinate
      // spatialReference: esri.SpatialReference: spatial reference well-known-id
      dojo.mixin(this, esri.geometry.defaultExtent);
      
      if (dojo.isObject(xmin)) {
        dojo.mixin(this, xmin);
        this.spatialReference = new esri.SpatialReference(this.spatialReference);
        //this._fix();
      }
      else {
        this.update(xmin, ymin, xmax, ymax, spatialReference);
      }
    },
    
    /*_fix: function() {
      var xmin = this.xmin, ymin = this.ymin,
          xmax = this.xmax, ymax = this.ymax;
    
      this.xmin = xmin || xmax || 0;
      this.ymin = ymin || ymax || 0;
      this.xmax = xmax || xmin || 0;
      this.ymax = ymax || ymin || 0;
    },*/

    getWidth: function() {
      //returns: Number: Returns the width of the Extent
      return Math.abs(this.xmax - this.xmin);
    },

    getHeight: function() {
      //returns: Number: Returns the height of the Extent
      return Math.abs(this.ymax - this.ymin);
    },

    getCenter: function() {
      //returns: esri.geometry.Point: Return center point of extent
      return new esri.geometry.Point((this.xmin + this.xmax)/2, (this.ymin + this.ymax)/2, this.spatialReference);
    },

    centerAt: function(/*esri.geometry.Point*/ point) {
      var center = this.getCenter(),
          dx = point.x - center.x,
          dy = point.y - center.y;
      return new esri.geometry.Extent(this.xmin + dx, this.ymin + dy, this.xmax + dx, this.ymax + dy, this.spatialReference);

//      this.update(this.xmin + dx, this.ymin + dy, this.xmax + dx, this.ymax + dy, this.spatialReference);
    },

    update: function(/*Number*/ xmin, /*Number*/ ymin, /*Number*/ xmax, /*Number*/ ymax, /*esri.SpatialReference*/ spatialReference) {
      this.xmin = xmin;
      this.ymin = ymin;
      this.xmax = xmax;
      this.ymax = ymax;
      this.spatialReference = spatialReference;
      //this._fix();
      return this;
    },

    offset: function(/*Number*/ ox, /*Number*/ oy) {
      //summary: esri.geometry.Extent: Return new extent object by offsetting by
      //         argument x and y
      // ox: Number: Offset x distance
      // oy: Number: Offset y distance
      // returns: esri.geometry.Extent: Returns offsetted extent object
      return new esri.geometry.Extent(this.xmin + ox, this.ymin + oy, this.xmax + ox, this.ymax + oy, this.spatialReference);
    },

    expand: function(/*Number*/ factor) {
      //summary: Expands the Extent object by argument factor. If 0 > factor < 1,
      //         the Extent shrinks. If factor > 1, the Extent expands.
      // factor: Number: Factor to expand the Extent by
      var deltaf = (1 - factor) / 2,
          deltaw = this.getWidth() * deltaf,
          deltah = this.getHeight() * deltaf;

      return new esri.geometry.Extent(this.xmin + deltaw, this.ymin + deltah, this.xmax - deltaw, this.ymax - deltah, this.spatialReference);
    },
    
    intersects: function(/*Point | Multipoint | Extent | Polygon | Polyline*/ geometry) {
      var type = geometry.type;
      switch(type) {
        case "point":
          return this.contains(geometry);
        case "multipoint":
          return this._intersectsMultipoint(geometry);
        case "extent":
          return this._intersectsExtent(geometry);
        case "polygon":
          return this._intersectsPolygon(geometry);
        case "polyline":
          return this._intersectsPolyline(geometry);
      }
    },
    
    _intersectsMultipoint: function(multipoint) {
      var len = multipoint.points.length, i;
      for (i = 0; i < len; i++) {
        if (this.contains(multipoint.getPoint(i))) {
          return true;
        }
      }
      return false;
    },

    _intersectsExtent: function(extent) {
      var xmin, ymin, width, height, emptyIntersection = false;

      // check on horizontal overlap
      if (this.xmin <= extent.xmin) {
        xmin = extent.xmin;
        if (this.xmax < xmin) {
          emptyIntersection = true;
        }
        else {
          width = Math.min(this.xmax, extent.xmax) - xmin;
        }
      }
      else {
        xmin = this.xmin;
        if (extent.xmax < xmin) {
          emptyIntersection = true;
        }
        else {
          width = Math.min(this.xmax, extent.xmax) - xmin;
        }
      }

      // check on vertical overlap
      if (this.ymin <= extent.ymin) {
        ymin = extent.ymin;
        if (this.ymax < ymin) {
          emptyIntersection = true;
        }
        else {
          height = Math.min(this.ymax, extent.ymax) - ymin;
        }
      }
      else {
        ymin = this.ymin;
        if (extent.ymax < ymin) {
          emptyIntersection = true;
        }
        else {
          height = Math.min(this.ymax, extent.ymax) - ymin;
        }
      }

      if (emptyIntersection) {
        return null;
      }

      return new esri.geometry.Extent(xmin, ymin, xmin + width, ymin + height, this.spatialReference);
    },
    
    _intersectsPolygon: function(polygon) {
      // Convert this extent into line segments
      var topLeft =  [ this.xmin, this.ymax ], topRight = [ this.xmax, this.ymax ],
          bottomLeft = [ this.xmin, this.ymin ], bottomRight = [ this.xmax, this.ymin ],
          corners = [ topLeft, topRight, bottomLeft, bottomRight ],
          extentLines = [
            [ bottomLeft,  topLeft ],
            [ topLeft,     topRight ],
            [ topRight,    bottomRight ],
            [ bottomRight, bottomLeft ]
          ],
          i, j, rings = polygon.rings, ringsLength = rings.length, ring, len, point = new esri.geometry.Point(0, 0);

      // Check if the polygon contains any of the points
      // defining the extent
      len = corners.length;
      for (i = 0; i < len; i++) {
        point.update(corners[i][0], corners[i][1]);
        if (polygon.contains(point)) {
          return true;
        }
      }
      
      // Check if any line segment of the extent and polygon intersect
      // each other
      var pi, pj;
      for(i = 0; i < ringsLength; i++) {
        ring = rings[i];
        len = ring.length;
        
        // Ideally we don't expect a ring to be empty.
        // However we have seen this in the wild
        if (!len) {
          continue;
        }
        
        pi = ring[0];
        
        // check if the first point in this ring
        // is within this extent
        point.update(pi[0], pi[1]);
        if (this.contains(point)) {
          return true;
        }

        for(j = 1; j < len; j++) {
          pj = ring[j];
          point.update(pj[0], pj[1]);
          if (this.contains(point) || this._intersectsLine([pi, pj], extentLines)) {
            return true;
          }
          pi = pj;
        }
      }
      
      return false;
    },
    
    _intersectsPolyline: function(polyline) {
      // Convert this extent into line segments 
      var extentLines = [
        [ [ this.xmin, this.ymin ], [ this.xmin, this.ymax ] ],
        [ [ this.xmin, this.ymax ], [ this.xmax, this.ymax ] ],
        [ [ this.xmax, this.ymax ], [ this.xmax, this.ymin ] ],
        [ [ this.xmax, this.ymin ], [ this.xmin, this.ymin ] ]
      ];
      
      // Check if any line segment of the extent and polyline intersect
      // each other
      var i, j, paths = polyline.paths, pathsLength = paths.length, path, len; 
      var pi, pj, point = new esri.geometry.Point(0, 0);
      
      for(i = 0; i < pathsLength; i++) {
        path = paths[i];
        len = path.length;
        
        // Ideally we don't expect a path to be empty.
        // However we have seen this in the wild
        if (!len) {
          continue;
        }
        
        pi = path[0];
        
        // check if the first point in this path
        // is within this extent
        point.update(pi[0], pi[1]);
        if (this.contains(point)) {
          return true;
        }
        
        for(j = 1; j < len; j++) {
          pj = path[j];
          point.update(pj[0], pj[1]);
          if (this.contains(point) || this._intersectsLine([pi, pj], extentLines)) {
            return true;
          }
          pi = pj;
        }
      }

      return false;
    },
    
    // Returns "true" if the given line intersects this extent
    _intersectsLine: function(/*[[x1, y1], [x2, y2]]*/ line, extentLines) {
      var check = esri.geometry._getLineIntersection2, i, len = extentLines.length;
      for (i = 0; i < len; i++ ) {
        if (check(line, extentLines[i])) {
          return true;
        }
      }
      return false;
    },

    contains: function(/*Point | Extent*/ geometry) {
      //summary: Returns true if argument point contained within this Extent
      // returns: boolean: true if contained, else false
      if (!geometry) {
        return false;
      }

      var type = geometry.type;
      switch(type) {
        case "point":
          return geometry.x >= this.xmin && geometry.x <= this.xmax && geometry.y >= this.ymin && geometry.y <= this.ymax;
        case "extent":
          return this._containsExtent(geometry);
      }
      return false;
    },
    
    _containsExtent: function(extent) {
      var xmin = extent.xmin, ymin = extent.ymin,
          xmax = extent.xmax, ymax = extent.ymax,
          pt1 = new esri.geometry.Point(xmin, ymin),
          pt2 = new esri.geometry.Point(xmin, ymax),
          pt3 = new esri.geometry.Point(xmax, ymax),
          pt4 = new esri.geometry.Point(xmax, ymin);
      
      if (this.contains(pt1) && this.contains(pt2) && this.contains(pt3) && this.contains(pt4)) {
        return true;
      }
      return false;
    },

		union: function(/*esri.geometry.Extent*/ extent) {
			//summary: Returns the union of this and argument Extents
			// returns: esri.geometry.Extent: unioned Extent
			return new esri.geometry.Extent(Math.min(this.xmin, extent.xmin), Math.min(this.ymin, extent.ymin), Math.max(this.xmax, extent.xmax), Math.max(this.ymax, extent.ymax), this.spatialReference);
		},
		
		getExtent: function() {
		  //summary: esri.geometry.Extent: Returns a copy of this extent object
      var sr = this.spatialReference;
      
			return new esri.geometry.Extent(
        this.xmin, this.ymin, 
        this.xmax, this.ymax, 
        sr && new esri.SpatialReference(sr.toJson())
      );
		},

//    toString: function() {
//      return this.declaredClass + "(" + this.xmin + ", " + this.ymin + ", " + this.xmax + ", " + this.ymax + (this.spatialReference ? ", " + this.spatialReference : "") + ")";
//    },

    _shiftCM: function(info) {
      // Shift the central meridian if necessary and adjust the
      // extent accordingly
      
      if (!this._shifted) {
        var EG = esri.geometry, newExtent = EG.fromJson(this.toJson()), 
            sr = newExtent.spatialReference;
        
        info = info || sr._getInfo();
        if (info) {
          var newMeridian = this._getCM(info);
          
          if (newMeridian) {
            // Adjust extent
            var meridianInDeg = sr._isWebMercator() ? EG.webMercatorToGeographic(newMeridian) : newMeridian;
            newExtent.xmin -= newMeridian.x;
            newExtent.xmax -= newMeridian.x;
            
            // GCS seems to have a problem with CM > 720
            if (!sr._isWebMercator()) {
              meridianInDeg.x = this._normalizeX(meridianInDeg.x, info).x;
            }
  
            // Set central meridian via WKT
            //newExtent.spatialReference.wkt = info.wkTemplate.replace(/\[\"Central_Meridian\",[^\]]+\]/, "\[\"Central_Meridian\"," + meridianInDeg.x + "\]");
            newExtent.spatialReference.wkt = esri.substitute({ Central_Meridian: meridianInDeg.x }, sr.wkid === 4326 ? info.altTemplate : info.wkTemplate);
            newExtent.spatialReference.wkid = null;
          }
        }
        
        this._shifted = newExtent;
      }
      
      return this._shifted;
    },
    
    _getCM: function(info) {
      // Returns a new central meridian if the extent
      // intersects beyond +/- 180 span
      
      var newMeridian, minus180 = info.valid[0], plus180 = info.valid[1],
          xmin = this.xmin, xmax = this.xmax;
      
      //if ( this.getWidth() <= (2 * plus180) ) {
        var isMinValid = (xmin >= minus180 && xmin <= plus180),
            isMaxValid = (xmax >= minus180 && xmax <= plus180);
        // TODO
        // We can normalize xmin and xmax before doing
        // this comparison coz we dont have to shift CM
        // for an extent which when normalized does not
        // cross 180
            
        if (!(isMinValid && isMaxValid)) {
          newMeridian = this.getCenter();
        }
      //}
      
      //console.log("_getCM: ", newMeridian && newMeridian.x);
      
      return newMeridian;
    },
    
    _normalize: function(shift, sameType, info) {
      // Returns normalized extent or a polygon with two rings
      // TODO
      // Add test cases
      
      var EG = esri.geometry, newExtent = EG.fromJson(this.toJson()), 
          sr = newExtent.spatialReference;
      
      if (sr) {
        info = info || sr._getInfo();
        if (info) {
          
          var extents = dojo.map(this._getParts(info), function(part) {
            return part.extent;
          });    
          
          if (extents.length > 2) {
            if (shift) {
              return this._shiftCM(info);
            }
            else {
              // _getParts returns more than 2 extents for graphics pipeline.
              // We dont need them here. In this case, it is the entire world
              return newExtent.update(info.valid[0], newExtent.ymin, info.valid[1], newExtent.ymax, sr);
            }
          }
          else if (extents.length === 2) {
            // Let's convert the extent to polygon only
            // when necessary
            if (shift) {
              return this._shiftCM(info);
            }
            else {
              return sameType ? extents : new EG.Polygon({
                "rings": dojo.map(extents, function(extent) {
                  return [ 
                    [ extent.xmin, extent.ymin ], [ extent.xmin, extent.ymax ], 
                    [ extent.xmax, extent.ymax ], [ extent.xmax, extent.ymin ],
                    [ extent.xmin, extent.ymin ] 
                  ];
                }),
                "spatialReference": sr
              });
            }
          }
          else {
            return extents[0] || newExtent;
          }
          
        } // info
      } // sr

      return newExtent;
    },
    
    _getParts: function(info) {
      // Split this extent into one or more valid
      // extents (parts) if necessary. Also return 
      // the world frames that these parts intersect
      
      if (!this._parts) {
        var xmin = this.xmin, xmax = this.xmax, 
            ymin = this.ymin, ymax = this.ymax, sr = this.spatialReference,
            linearWidth = this.getWidth(), linearXmin = xmin, linearXmax = xmax,
            minFrame = 0, maxFrame = 0, nrml, parts = [], minus180, plus180, nexus;
        
        info = info || sr._getInfo();
        minus180 = info.valid[0];
        plus180 = info.valid[1];
  
        nrml = this._normalizeX(xmin, info);
        xmin = nrml.x;
        minFrame = nrml.frameId;
        
        nrml = this._normalizeX(xmax, info);
        xmax = nrml.x;
        maxFrame = nrml.frameId;
        
        nexus = (xmin === xmax && linearWidth > 0);
  
  //      console.log(xmin, xmax, minFrame, maxFrame);
        
        if (linearWidth > (2 * plus180)) { // really wide extent!
          var E1 = new esri.geometry.Extent(linearXmin < linearXmax ? xmin : xmax, ymin, plus180, ymax, sr),
              E2 = new esri.geometry.Extent(minus180, ymin, linearXmin < linearXmax ? xmax : xmin, ymax, sr),
              E3 = new esri.geometry.Extent(0, ymin, plus180, ymax, sr),
              E4 = new esri.geometry.Extent(minus180, ymin, 0, ymax, sr),
              k, framesE3 = [], framesE4 = []; //, countE3 = 0, countE4 = 0;
              
          if (E1.contains(E3)) {
            //countE3++;
            framesE3.push(minFrame);
          }
          if (E1.contains(E4)) {
            //countE4++;
            framesE4.push(minFrame);
          }
          if (E2.contains(E3)) {
            //countE3++;
            framesE3.push(maxFrame);
          }
          if (E2.contains(E4)) {
            //countE4++;
            framesE4.push(maxFrame);
          }
          
          for (k = minFrame + 1; k < maxFrame; k++) {
            //countE3++;
            //countE4++;
            framesE3.push(k);
            framesE4.push(k);
          }
          
          parts.push(
            { extent: E1, frameIds: [ minFrame ] }, 
            { extent: E2, frameIds: [ maxFrame ] }, 
            { extent: E3, frameIds: framesE3 }, 
            { extent: E4, frameIds: framesE4 }
          );
        }
        else if ((xmin > xmax) || nexus) { // extent crosses dateline (partly invalid)
          parts.push(
            {
              extent: new esri.geometry.Extent(xmin, ymin, plus180, ymax, sr),
              frameIds: [ minFrame ]
            }, 
            {
              extent: new esri.geometry.Extent(minus180, ymin, xmax, ymax, sr),
              frameIds: [ maxFrame ]
            }
          );
        }
        else { // a valid extent
          parts.push({
            extent: new esri.geometry.Extent(xmin, ymin, xmax, ymax, sr),
            frameIds: [ minFrame ]
          });
        }
        
        /*console.log("_normalize:");
        dojo.forEach(parts, function(part) {
          console.log(dojo.toJson(part.extent.toJson()), part.count, part.frameIds);
        });*/
       
        this._parts = parts;
      }
      
      return this._parts;
    },
    
    _normalizeX: function(x, info) {
      // Shifts "x" to within +/- 180 span
      // Calculates the world frame where "x" lies (Point::normalize does not do this)
      
      /*// Test cases:
      var info, res;
      info = esri.SpatialReference.prototype._info["4326"];
      res = esri.geometry.Extent.prototype._normalizeX(-200, info);
      console.log(res.x === 160, res.frameId === -1);
      res = esri.geometry.Extent.prototype._normalizeX(-528, info);
      console.log(res.x === -168, res.frameId === -1);
      res = esri.geometry.Extent.prototype._normalizeX(-1676, info);
      console.log(res.x === 124, res.frameId === -5);
      res = esri.geometry.Extent.prototype._normalizeX(-181, info);
      console.log(res.x === 179, res.frameId === -1);
      res = esri.geometry.Extent.prototype._normalizeX(250, info);
      console.log(res.x === -110, res.frameId === 1);
      res = esri.geometry.Extent.prototype._normalizeX(896, info);
      console.log(res.x === 176, res.frameId === 2);
      res = esri.geometry.Extent.prototype._normalizeX(181, info);
      console.log(res.x === -179, res.frameId === 1);
      res = esri.geometry.Extent.prototype._normalizeX(2346, info);
      console.log(res.x === -174, res.frameId === 7);*/
      
      var frameId = 0, minus180 = info.valid[0], plus180 = info.valid[1], world = 2 * plus180, ratio;
      
      if (x > plus180) {
        /*while (x > plus180) {
          x -= world;
          frameId++;
        }*/
        ratio = Math.ceil(Math.abs(x - plus180) / world);
        x -= (ratio * world);
        frameId = ratio;
      }
      else if (x < minus180) {
        /*while (x < minus180) {
          x += world;
          frameId--;
        }*/
        ratio = Math.ceil(Math.abs(x - minus180) / world);
        x += (ratio * world);
        frameId = -ratio;
      }

      return { x: x, frameId: frameId };
    },

    toJson: function() {
      var json = { xmin: this.xmin, ymin: this.ymin, xmax: this.xmax, ymax: this.ymax },
          sr = this.spatialReference;
      if (sr) {
        json.spatialReference = sr.toJson();
      }
      return json;
    }
  }
);

dojo.declare("esri.geometry.Rect", esri.geometry.Geometry, {
    constructor: function(/*Number or Object*/ json, /*Number*/ y, /*Number*/ width, /*Number*/ height, /*esri.SpatialReference*/ spatialReference) {
      //summary: Create a new Rectangle object with top-left point ( x, y ) and width
      //         and height of rectangle
      // json: Number or Object: x coordinate of top-left point or { x, y, width, id, spatialReference } object
      // y: Number: y coordinate of top-left point
      // width: Number: width of rectangle
      // height: Number: height of rectangle
      // spatialReference: esri.SpatialReference: spatial reference well-known-id
      dojo.mixin(this, dojox.gfx.defaultRect);
      if (dojo.isObject(json)) {
        dojo.mixin(this, json);
        this.spatialReference = new esri.SpatialReference(this.spatialReference);
      }
      else {
        this.x = json;
        this.y = y;
        this.width = width;
        this.height = height;
        this.spatialReference = spatialReference;
      }
    },

    getCenter: function() {
      //summary: Get center point of Rect
      // returns: esri.geometry.Point: Center point of rectangle
      return new esri.geometry.Point(this.x + this.width/2, this.y + this.height/2, this.spatialReference);
    },

		offset: function(/*Number*/ ox, /*Number*/ oy) {
			//summary: esri.geometry.Extent: Return new extent object by offsetting by
      //         argument x and y
      // ox: Number: Offset x distance
      // oy: Number: Offset y distance
      // returns: esri.geometry.Extent: Returns offsetted extent object
      return new esri.geometry.Rect(this.x + ox, this.y + oy, this.width, this.height, this.spatialReference);
		},

    intersects: function(/*esri.geometry.Rect*/ rect) {
      //summary: Return true if argument Rect intersects this Rect
      // returns: boolean: true if intersects, else false
      if ((rect.x + rect.width) <= this.x) {
        return false;
      }
      if ((rect.y + rect.height) <= this.y) {
        return false;
      }
      if (rect.y >= (this.y + this.height)) {
        return false;
      }
      if (rect.x >= (this.x + this.width)) {
        return false;
      }
    
      return true;
    },

    getExtent: function() {
      return esri.geometry._rectToExtent(this);
    },

//    contains: function(/*esri.geometry.Point*/ point) {
//      //summary: Return true if argument Point is fully contained within this Rect
//      // returns: boolean: true if contained, else false
//      return point !== null && point.x >= this.x && point.x <= (this.x + this.width) && point.y >= this.y && point.y <= (this.y + this.height);
//    },
//
//      union: function(/*esri.geometry.Rect*/ rect) {
//        //summary: Returns the union of this and argument Rects
//        // returns: esri.geometry.Rect: unioned Rect
//        var x = Math.min(this.x, rect.x);
//        var y = Math.min(this.y, rect.y);
//        var r = Math.max(this.x + this.width, rect.x + rect.width);
//        var b = Math.max(this.y + this.height, rect.y + rect.height);
//        return new esri.geometry.Rect(x, y, r - x, b - y, this.spatialReference);
//      },

    update: function(x, y, width, height, spatialReference) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.spatialReference = spatialReference;
      return this;
    } //,

//    toString: function() {
//      return this.declaredClass + "(" + this.x + ", " + this.y + ", " + this.width + ", " + this.height + (this.spatialReference ? ", " + this.spatialReference : "") + ")";
//    }
  }
);

//dojo.declare("esri.geometry.Image", esri.geometry.Geometry, {
//    constructor: function(/*Number or Object*/ json, /*Number*/ y, /*Number*/ width, /*Number*/ height, /*String*/ src, /*esri.SpatialReference*/ spatialReference) {
//      //summary: Create a new Image object
//      // json: Number or Object: X coordinate of top-left point of image or { x, y, width, height, src, spatialReference } object
//      // y: Number: Y coordinate of top-left point of image
//      // width: Number: Width of image
//      // height: Number: Height of image
//      // src: String: Path to image
//      // spatialReference: esri.SpatialReference: spatial reference well-known-id
//      dojo.mixin(this, dojox.gfx.defaultImage);
//      if (dojo.isObject(json)) {
//        dojo.mixin(this, json);
//        this.spatialReference = new esri.SpatialReference(this.spatialReference);
//      }
//      else {
//        this.x = json;
//        this.y = y;
//        this.width = width; //in map units
//        this.height = height; //in map units
//        this.src = src;
//        this.spatialReference = spatialReference;
//      }
//    },
//
//    toString: function() {
//      return this.declaredClass + "(" + this.src + ", " + this.x + ", " + this.y + ", " + this.width + ", " + this.height + (this.spatialReference ? ", " + this.spatialReference : "") + ")";
//    }
//  }
//);
//
//dojo.declare("esri.geometry.Line", esri.geometry.Geometry, {
//    constructor: function(/*Number or Object*/ x1, /*Number*/ y1, /*Number*/ x2, /*Number*/ y2, /*esri.SpatialReference*/ spatialReference) {
//      //summary: Create a new Line object
//      // x1: Number or Object: X coordinate of starting point or { x1, y1, x2, y2, spatialReference } object
//      // y1: Number: Y coordinate of starting point
//      // x2: Number: X coordinate of ending point
//      // y2: Number: Y coordinate of ending point
//      // spatialReference: esri.SpatialReference: spatial reference well-known-id
//      dojo.mixin(this, dojox.gfx.defaultLine);
//      if (dojo.isObject(x1)) {
//        dojo.mixin(this, x1);
//      }
//      else {
//        this.x1 = x1;
//        this.y1 = y1;
//        this.x2 = x2;
//        this.y2 = y2;
//        this.spatialReference = spatialReference;
//      }
//      this.spatialReference = new esri.SpatialReference(this.spatialReference);
//    },
//
//    /*getLength: function() {
//      //summary: Returns the length of this line
//      //returns: double: length of line
//      return esri.geometry.getLength([x1, y1], [x2, y2]);
//    },*/
//
//    toString: function() {
//      return this.declaredClass + "(" + this.x1 + ", " + this.y1 + " - " + this.x2 + ", " + this.y2 + (this.spatialReference ? ", " + this.spatialReference : "");
//    }
//  }
//);
//
//dojo.declare("esri.geometry.Ellipse", esri.geometry.Geometry, {
//    constructor: function(/*Number or Object*/ cx, /*Number*/ cy, /*Number*/ rx, /*Number*/ ry, /*esri.SpatialReference*/ spatialReference) {
//      //summary: Create a new Ellipse object
//      // cx: Number of Object: X coordinate of center of ellipse or { cx, cy, rx, ry, spatialReference } object
//      // cy: Number: Y coordinate of center of ellipse
//      // rx: Number: Radius of ellipse along x axis
//      // ry: Number: Radius of ellipse along y axis
//      // spatialReference: esri.SpatialReference: spatial reference well-known-id
//      dojo.mixin(this, dojox.gfx.defaultEllipse);
//      if (dojo.isObject(cx)) {
//        dojo.mixin(this, cx);
//        this.spatialReference = new esri.SpatialReference(this.spatialReference);
//      }
//      else {
//        this.cx = cx;
//        this.cy = cy;
//        this.rx = rx;
//        this.ry = ry;
//        this.spatialReference = spatialReference;
//      }
//    },
//
//    toString: function() {
//      return this.declaredClass + "(" + this.cx + ", " + this.cy + " " + this.rx + ", " + this.ry + (this.spatialReference ? ", " + this.spatialReference : "") + ")";
//    }
//  }
//);
//
//dojo.declare("esri.geometry.Circle", esri.geometry.Geometry, {
//    constructor: function(/*Number or Object*/ cx, /*Number*/ cy, /*Number*/ r, /*esri.SpatialReference*/ spatialReference) {
//      //summary: Create a new Circle object
//      // cx: Number or Object: X coordinate of center of circle or { cx, cy, r, spatialReference } object
//      // cy: Number: Y coordinate of center of circle
//      // r: Number: Radius of circle
//      // spatialReference: esri.SpatialReference: spatial reference well-known-id
//      dojo.mixin(this, dojox.gfx.defaultCircle);
//      if (dojo.isObject(cx)) {
//        dojo.mixin(this, cx);
//        this.spatialReference = new esri.SpatialReference(this.spatialReference);
//      }
//      else {
//        this.cx = cx;
//        this.cy = cy;
//        this.r = r;
//        this.spatialReference = spatialReference;
//      }
//    },
//
//    toString: function() {
//      return this.declaredClass + "(" + this.cx + ", " + this.cy + " " + this.r + (this.spatialReference ? ", " + this.spatialReference : "") + ")";
//    }
//  }
//);
});
