//>>built
// wrapped by build app
define("esri/tasks/na", ["dijit","dojo","dojox","dojo/require!esri/tasks/_task"], function(dijit,dojo,dojox){
dojo.provide("esri.tasks.na");

dojo.require("esri.tasks._task");

// esri.tasks.NALengthUnit = {
//   // CENTIMETERS: "esriNAUCentimeters",
//   // DAYS: "esriNAUDays",
//   // DECIMALDEGREES: "esriNAUDecimalDegrees",
//   // DECIMETERS: "esriNAUDecimeters",
//   FEET: "esriNAUFeet",
//   // HOURS: "esriNAUHours",
//   // INCHES: "esriNAUInches",
//   KILOMETERS: "esriNAUKilometers",
//   METERS: "esriNAUMeters",
//   MILES: "esriNAUMiles",
//   // MILLIMETERS: "esriNAUMillimeters",
//   // MINUTES: "esriNAUMinutes",
//   NAUTICALMILES: "esriNAUNauticalMiles",
//   // POINTS: "esriNAUPoints",
//   // SECONDS: "esriNAUSeconds",
//   // UNKNOWN: "esriNAUUnknown",
//   YARDS: "esriNAUYards"
// };

esri.tasks._NALengthUnit = {
  esriFeet: "esriNAUFeet",
  esriKilometers: "esriNAUKilometers",
  esriMeters: "esriNAUMeters",
  esriMiles: "esriNAUMiles",
  esriNauticalMiles: "esriNAUNauticalMiles",
  esriYards: "esriNAUYards"
};

esri.tasks.NAOutputLine = {
  NONE: "esriNAOutputLineNone",
  STRAIGHT: "esriNAOutputLineStraight",
  TRUE_SHAPE: "esriNAOutputLineTrueShape",
  TRUE_SHAPE_WITH_MEASURE: "esriNAOutputLineTrueShapeWithMeasure"
};

esri.tasks.NAUTurn = {
  ALLOW_BACKTRACK: "esriNFSBAllowBacktrack",
  AT_DEAD_ENDS_ONLY: "esriNFSBAtDeadEndsOnly",
  NO_BACKTRACK: "esriNFSBNoBacktrack",
  AT_DEAD_ENDS_AND_INTERSECTIONS: "esriNFSBAtDeadEndsAndIntersections"
};

esri.tasks.NAOutputPolygon = {
  NONE: "esriNAOutputPolygonNone",
  SIMPLIFIED: "esriNAOutputPolygonSimplified",
  DETAILED: "esriNAOutputPolygonDetailed"
};

esri.tasks.NATravelDirection = {
  FROM_FACILITY: "esriNATravelDirectionFromFacility",
  TO_FACILITY: "esriNATravelDirectionToFacility"
};

// esri.tasks.NAFeatureStatus = {
//   OK: 0,
//   NOTLOCATED: 1,
//   ELEMENTNOTLOCATED: 2,
//   ELEMENTNOTTRAVERSABLE: 3,
//   INVALIDFIELDVALUES: 4,
//   NOTREACHED: 5,
//   TIMEWINDOWVIOLATION: 6
// };

// dojo.declare("esri.tasks.NAFeatures", null, {
//     constructor: function() {
//       this.features = [];
//     },
//   
//     doNotLocateOnRestrictedElements: false,
//   
//     toJson: function() {
//       var json = { type:"features", features:esri._encodeGraphics(this.features) };
//       if (this.doNotLocateOnRestrictedElements !== null) {
//         json.doNotLocateOnRestrictedElements = this.doNotLocateOnRestrictedElements;
//       }
//       return json;
//     }
//   }
// );

dojo.declare("esri.tasks.NAMessage", null, {
    constructor: function(/*Object*/ message) {
      dojo.mixin(this, message);
    }
  }
);

dojo.mixin(esri.tasks.NAMessage, {
  TYPE_INFORMATIVE: 0,
  TYPE_PROCESS_DEFINITION: 1,
  TYPE_PROCESS_START: 2,
  TYPE_PROCESS_STOP: 3,
  TYPE_WARNING: 50,
  TYPE_ERROR: 100,
  TYPE_EMPTY: 101,
  TYPE_ABORT: 200
});

dojo.declare("esri.tasks.DataLayer", null, {
    name: null,
    where: null,
    geometry: null,
    spatialRelationship: null,
    
    toJson: function() {
      var json = {
        type: "layer",
        layerName: this.name,
        where: this.where,
        spatialRel: this.spatialRelationship
      };
      
      var g = this.geometry;
      if (g) {
        json.geometryType = esri.geometry.getJsonType(g);
        json.geometry = g.toJson();
      }
      
      return esri.filter(json, function(value) {
        if (value !== null) {
          return true;
        }
      });
    }
  }
);

dojo.mixin(esri.tasks.DataLayer, esri.tasks._SpatialRelationship);

// esri.tasks.na._compressedGeomToPolyline = function(str) {
//   var xDiffPrev = 0,
//       yDiffPrev = 0,
//       points =[], point,
//       xDiff, nX, yDiff, nY,
//       strings = str.split(/([\+\-])/),
//       coefficient = parseInt(strings[1] + strings[2],32);
// 
//   for (var j=3, jl=strings.length; j<jl; j=j+4) {
//     point = new esri.geometry.Point();
//     
//     //current parse string is for x.  strings[j] = sign, strings[j+1] = value
//     xDiff = parseInt(strings[j] + strings[j+1],32);
//     nX = (xDiff + xDiffPrev);
//     xDiffPrev = nX;
//     point.setX(nX/coefficient);
//     
//     //current parse string is for y
//     yDiff = parseInt(strings[j+2] + strings[j+3],32);
//     nY = (yDiff + yDiffPrev);
//     yDiffPrev = nY;
//     point.setY(nY/coefficient);
//     
//     points.push(point);
//   }
// 
//   var polyline = new esri.geometry.Polyline();
//   polyline.addPath(points);
//   return polyline;
// };

dojo.declare("esri.tasks.DirectionsFeatureSet", esri.tasks.FeatureSet, {
    constructor: function(json, cgs) {
      this.routeId = json.routeId;
      this.routeName = json.routeName;
      dojo.mixin(this, json.summary);
      this.extent = new esri.geometry.Extent(this.envelope);

      var cgToPline = this._fromCompressedGeometry,
          features = this.features,
          sr = this.extent.spatialReference,
          geometries = [];

      dojo.forEach(cgs, function(cg, i) {
        features[i].setGeometry(geometries[i] = cgToPline(cg, sr));
      });
      this.mergedGeometry = this._mergePolylinesToSinglePath(geometries, sr);
      this.geometryType = "esriGeometryPolyline";

      delete this.envelope;
    },
  
    _fromCompressedGeometry: function(/*String*/ str, /*SpatialReference*/ sr) {
      var xDiffPrev = 0,
          yDiffPrev = 0,
          points =[],
          x, y,
          strings = str.replace(/(\+)|(\-)/g,' $&').split(" "),
          coefficient = parseInt(strings[1], 32);

      for (var j=2, jl=strings.length; j<jl; j+=2) {
        //j is for x.
        // x = (parseInt(strings[j], 32) + xDiffPrev);
        // xDiffPrev = x;
        xDiffPrev = (x = (parseInt(strings[j], 32) + xDiffPrev));

        //j+1 is for y
        // y = (parseInt(strings[j+1], 32) + yDiffPrev);
        // yDiffPrev = y;
        yDiffPrev = (y = (parseInt(strings[j+1], 32) + yDiffPrev));

        points.push([x/coefficient, y/coefficient]);
      }

      var po = new esri.geometry.Polyline({ paths:[points] });
      po.setSpatialReference(sr);
      return po;
    },

    _mergePolylinesToSinglePath: function(polylines, sr) {
      //merge all paths into 1 single path
      var points = [];
      dojo.forEach(polylines, function(polyline) {
        dojo.forEach(polyline.paths, function(path) {
          points = points.concat(path);
        });
      });

      //remove all duplicate points
      var path = [],
          prevPt = [0, 0];
      dojo.forEach(points, function(point) {
        if (point[0] !== prevPt[0] || point[1] !== prevPt[1]) {
          path.push(point);
          prevPt = point;
        }
      });

      return new esri.geometry.Polyline({ paths:[path] }).setSpatialReference(sr);
    }
  }
);
});
