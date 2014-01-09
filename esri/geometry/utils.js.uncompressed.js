//>>built
// wrapped by build app
define("esri/geometry/utils", ["dijit","dojo","dojox"], function(dijit,dojo,dojox){
dojo.provide("esri.geometry.utils");

(function () {
  var EG = esri.geometry;
  
  /*****************
   * Public Methods
   *****************/
  
  /*****************************************
   * esri.geometry.normalizeCentralMeridian
   *****************************************/

  EG.normalizeCentralMeridian = function (geometries, geometryService, callback, errorCallback) {
    // Deferred
    var dfd = new dojo.Deferred();
    dfd.addCallbacks(callback, errorCallback);

    var normalizedGeometries = [],
        geometriesToBeCut = [],
        normalizedSR = geometries[0].spatialReference, 
        info = normalizedSR._getInfo(), //input SR
        webMercatorFlag = normalizedSR._isWebMercator(),
        maxX = webMercatorFlag ? 20037508.342788905 : 180,
        minX = webMercatorFlag ? -20037508.342788905 : -180,
        plus180Line = new esri.geometry.Polyline({
          'paths': [
            [
              [maxX, minX],
              [maxX, maxX]
            ]
          ]
        }),
        minus180Line = new esri.geometry.Polyline({
          'paths': [
            [
              [minX, minX],
              [minX, maxX]
            ]
          ]
        }),
        geometryMaxX = 0;  //used to define the maxX for all geometries.  
    
    dojo.forEach(geometries, function (geometry) {
      //first pass through geometries to see if they need to be normalized (shift OR cut and shift).  
      //If geometry type point then offset point if needed.
      //Else If geometry type is multipoint, then offset each point as needed to ensure points between -180 and 180.
      //Else geometry is polyline or polygon, translate geometry if needed so that geometry extent.xmin is within -180 and 180 and then test if geometry extent intersects either -180 or +180
      var newGeometry = esri.geometry.fromJson(dojo.fromJson(dojo.toJson(geometry.toJson()))), //clone geometry.
          geomExtent = geometry.getExtent();

      if (geometry.type === "point") {  //
      
        normalizedGeometries.push(EG._pointNormalization(newGeometry, maxX, minX));
        
      } else if (geometry.type === "multipoint") {
        
        newGeometry.points = dojo.map(newGeometry.points, function(point) {
          return EG._pointNormalization(point, maxX, minX);
        });
        normalizedGeometries.push(newGeometry);
        
      } else if (geometry.type === "extent") {
       
        normalizedGeometries.push(geomExtent._normalize(null, null, info));
        
      } else {  //geometry is polyline or polygon, translate geometry so that geometry extent.xmin is within -180 and 180
      
        var magnitude = EG._offsetMagnitude(geomExtent.xmin,minX),  //magnitude of offset with respect to minX
            offset = magnitude * (2 * maxX);
        newGeometry = (offset === 0) ? newGeometry : EG._updatePolyGeometry(newGeometry, offset);  //offset if needed to bring into range
        geomExtent = geomExtent.offset(offset,0);       
        
        if (geomExtent.intersects(plus180Line) && (geomExtent.xmax !== maxX)) {
          geometryMaxX = (geomExtent.xmax > geometryMaxX) ? geomExtent.xmax : geometryMaxX;  
          newGeometry = EG._prepareGeometryForCut(newGeometry,webMercatorFlag);
          geometriesToBeCut.push(newGeometry); //intersects 180, candidate for cut
          normalizedGeometries.push("cut"); //place holder for cut geometry        
        
        } else if (geomExtent.intersects(minus180Line) && (geomExtent.xmin !== minX)) {
          geometryMaxX = (geomExtent.xmax * (2*maxX) > geometryMaxX) ? geomExtent.xmax * (2*maxX) : geometryMaxX;
          newGeometry = EG._prepareGeometryForCut(newGeometry,webMercatorFlag,360);
          geometriesToBeCut.push(newGeometry); //intersects -180 candidate for cut against 180 cut line after offset
          normalizedGeometries.push("cut"); //place holder for cut geometry        
        
        } else {
          //console.log(newGeometry);
          normalizedGeometries.push(newGeometry);  //geometry is within -180 and +180      
        }
      }
    });

    var cutLineDegrees = new esri.geometry.Polyline(),
        cutCount = EG._offsetMagnitude(geometryMaxX,maxX),  //offset magnitude from maxX defines the number of cut lines needed.
        yLast = -90, count = cutCount;
    while (cutCount > 0) {
      var cutLongitude = -180 + (360 * cutCount);
      cutLineDegrees.addPath([[cutLongitude,yLast],[cutLongitude,yLast * -1]]);
      yLast = yLast * -1;
      cutCount--;
    }
    //console.log(dojo.toJson(cutLineDegrees.toJson()));
    
    // "count" could be 0 if geometryMaxX and maxX are equal
    if (geometriesToBeCut.length > 0 && count > 0) {  //need to call geometry service to cut; after cut operation is done, push features back into normalizedGeometries array
      
      if (geometryService) {
        geometryService.cut(geometriesToBeCut,cutLineDegrees,function(cutResults) {
          geometriesToBeCut = EG._foldCutResults(geometriesToBeCut,cutResults);
          
          var geometriesToBeSimplified = [];
          dojo.forEach(normalizedGeometries, function (normalizedGeometry, i) { //keep order of input geometries
            if (normalizedGeometry === "cut") {
              var newGeometry = geometriesToBeCut.shift();
              
              // The "equals" case in the if condition below happens in the 
              // following scenario:
              // 1. Draw a polygon across the dateline and normalize it, 
              //    resulting in two rings.
              // 2. Move the polygon so that it is contained within -180 and 
              //    +180.
              // 3. Normalize the polygon now. You'll get here after cut 
              //    finished on this polygon.
              
              if ((geometries[i].rings) && (geometries[i].rings.length > 1) && (newGeometry.rings.length >= geometries[i].rings.length)) {  //candidate for simplify if orig geometry is polygon and has more than 1 ring and the new geometry has more ringss than the orig geometry
                normalizedGeometries[i] = "simplify";
                geometriesToBeSimplified.push(newGeometry);
              } else {  //convert back to web mercator if needed and assign to normalizedGeometries array
                normalizedGeometries[i] = (webMercatorFlag === true) ? EG.geographicToWebMercator(newGeometry) : newGeometry;            
              }
            }
          });
          
          if (geometriesToBeSimplified.length > 0) {
            geometryService.simplify(geometriesToBeSimplified,function(simplifiedGeometries) {
              dojo.forEach(normalizedGeometries, function(normalizedGeometry,i) {
                if (normalizedGeometry === "simplify") {
                  normalizedGeometries[i] = (webMercatorFlag === true) ? EG.geographicToWebMercator(simplifiedGeometries.shift()) : simplifiedGeometries.shift();            
                }
              });
              dfd.callback(normalizedGeometries);  //return normalizedGeometries to caller
            }, function(error) {
              dfd.errback(error);
            });
          } else {
            dfd.callback(normalizedGeometries);  //return normalizedGeometries to caller
          }
          
        }, function(error) {
          dfd.errback(error);
        });
        
      } else { // geometryService argument is missing
        dfd.errback(new Error("esri.geometry.normalizeCentralMeridian: 'geometryService' argument is missing."));
      }
      
    } else {
      // It is possible that some geometries were marked for "cut" but are 
      // false positives. 
      // Example: an input polygon that is split on either side of +180 or -180.
      // Let's handle them before returning to the caller.
      dojo.forEach(normalizedGeometries, function (normalizedGeometry, i) {
        if (normalizedGeometry === "cut") {
          var newGeometry = geometriesToBeCut.shift();
          //console.log("False positive: ", newGeometry);
          normalizedGeometries[i] = (webMercatorFlag === true) ? EG.geographicToWebMercator(newGeometry) : newGeometry;
        }
      });
      
      dfd.callback(normalizedGeometries);  //return normalizedGeometries to caller
    }
    
    return dfd;
  };
  
  /********************************
   * esri.geometry.geodesicDensify
   ********************************/

  EG.geodesicDensify = function (geom, maxSegmentLength) {
    //geom must be under WGS84
    var toRad = Math.PI / 180;
    var radius = 6371008.771515059;
    if (maxSegmentLength < radius / 10000) {
      maxSegmentLength = radius / 10000;
    }
    if (!(geom instanceof esri.geometry.Polyline || geom instanceof esri.geometry.Polygon)) {
      var msg = "_geodesicDensify: the input geometry is neither polyline nor polygon";
      console.error(msg);
      throw new Error(msg);
    }
    var isPline = geom instanceof esri.geometry.Polyline,
        iRings = isPline ? geom.paths : geom.rings,
        oRings = [],
        oRing;
    dojo.forEach(iRings, function (ring) {
      oRings.push(oRing = []);
      oRing.push([ring[0][0], ring[0][1]]);
      var lon1, lat1, lon2, lat2, i, j;
      lon1 = ring[0][0] * toRad;
      lat1 = ring[0][1] * toRad;
      for (i = 0; i < ring.length - 1; i++) {
        lon2 = ring[i + 1][0] * toRad;
        lat2 = ring[i + 1][1] * toRad;
        var inverseGeodeticResult = EG._inverseGeodeticSolver(lat1, lon1, lat2, lon2);
        var azimuth = inverseGeodeticResult.azimuth; //radians
        var geodesicDist = inverseGeodeticResult.geodesicDistance; //meters
        var numberOfSegment = geodesicDist / maxSegmentLength;
        if (numberOfSegment > 1) {
          for (j = 1; j <= numberOfSegment - 1; j++) {
            var length = j * maxSegmentLength;
            var pt = EG._directGeodeticSolver(lat1, lon1, azimuth, length);
            oRing.push([pt.x, pt.y]);
          }
          var lastDensifiedLength = (geodesicDist + Math.floor(numberOfSegment - 1) * maxSegmentLength) / 2;
          var lastSecondPt = EG._directGeodeticSolver(lat1, lon1, azimuth, lastDensifiedLength);
          oRing.push([lastSecondPt.x, lastSecondPt.y]);
        }
        var endPt = EG._directGeodeticSolver(lat1, lon1, azimuth, geodesicDist);
        oRing.push([endPt.x, endPt.y]);
        lon1 = endPt.x * toRad;
        lat1 = endPt.y * toRad;
      }
    });
    if (isPline) {
      return new esri.geometry.Polyline({
        paths: oRings,
        spatialReference: geom.spatialReference
      });
    } else {
      return new esri.geometry.Polygon({
        rings: oRings,
        spatialReference: geom.spatialReference
      });
    }
  };
  
  /********************************
   * esri.geometry.geodesicLengths
   ********************************/

  EG.geodesicLengths = function (polylines, lengthUnit) {
    var toRan = Math.PI / 180;
    var lengths = [];
    dojo.forEach(polylines, function (polyline, idx) {
      var length = 0;
      dojo.forEach(polyline.paths, function (path, idx) {
        var subLength = 0;
        var i, lon1, lon2, lat1, lat2, inverseGeodeticResult;
        for (i = 1; i < path.length; i++) {
          lon1 = path[i - 1][0] * toRan;
          lon2 = path[i][0] * toRan;
          lat1 = path[i - 1][1] * toRan;
          lat2 = path[i][1] * toRan;
          inverseGeodeticResult = EG._inverseGeodeticSolver(lat1, lon1, lat2, lon2);
          subLength += inverseGeodeticResult.geodesicDistance / 1609.344; //miles
        }
        length += subLength;
      });
      length *= EG._unitsDictionary[lengthUnit];
      lengths.push(length);
    });
    return lengths;
  };
  
  /********************************
   * esri.geometry.geodesicAreas
   ********************************/

  EG.geodesicAreas = function (polygons, areaUnit) {
    var geodesicDensifiedPolygons = [];
    dojo.forEach(polygons, function (polygon, idx) {
      var geodesicDensifiedPolygon = EG.geodesicDensify(polygon, 10000);
      geodesicDensifiedPolygons.push(geodesicDensifiedPolygon);
    });
    var areas = [];
    var point1, point2;
    dojo.forEach(geodesicDensifiedPolygons, function (polygon, idx) {
      var area = 0;
      dojo.forEach(polygon.rings, function (ring, idx) {
        point1 = EG._toEqualAreaPoint(new esri.geometry.Point(ring[0][0], ring[0][1]));
        point2 = EG._toEqualAreaPoint(new esri.geometry.Point(ring[ring.length - 1][0], ring[ring.length - 1][1]));
        var subArea = point2.x * point1.y - point1.x * point2.y;
        var i;
        for (i = 0; i < ring.length - 1; i++) {
          point1 = EG._toEqualAreaPoint(new esri.geometry.Point(ring[i + 1][0], ring[i + 1][1]));
          point2 = EG._toEqualAreaPoint(new esri.geometry.Point(ring[i][0], ring[i][1]));
          subArea += point2.x * point1.y - point1.x * point2.y;
        }
        subArea /= 4046.87; //acres
        area += subArea;
      });
      area *= EG._unitsDictionary[areaUnit];
      areas.push(area / (-2));
    });
    return areas;
  };

  EG.polygonSelfIntersecting = function (polygon) {
    var i, j, k, m, line1, line2, intersectResult, ringCount = polygon.rings.length;
    
    for (k = 0; k < ringCount; k++) {
      //check if rings cross each other
      for (i = 0; i < polygon.rings[k].length - 1; i++) {
        line1 = [
          [polygon.rings[k][i][0], polygon.rings[k][i][1]],
          [polygon.rings[k][i + 1][0], polygon.rings[k][i + 1][1]]
        ];
        for (j = k + 1; j < ringCount; j++){
          for (m = 0; m < polygon.rings[j].length - 1; m++){
            line2 = [
              [polygon.rings[j][m][0], polygon.rings[j][m][1]],
              [polygon.rings[j][m + 1][0], polygon.rings[j][m + 1][1]]
            ];
            intersectResult = esri.geometry._getLineIntersection2(line1, line2);
            if (intersectResult) {
              //in case the intersecting point is the start/end point of the compared lines
            if(!((intersectResult[0] === line1[0][0] && intersectResult[1] === line1[0][1]) ||
               (intersectResult[0] === line2[0][0] && intersectResult[1] === line2[0][1]) ||
               (intersectResult[0] === line1[1][0] && intersectResult[1] === line1[1][1]) ||
               (intersectResult[0] === line2[1][0] && intersectResult[1] === line2[1][1]))){
              return true;
            }
            }            
          }
        }
      }
      //check if the ring self intersecting
      var vertexCount = polygon.rings[k].length;
      if (vertexCount <= 4) {
        // the ring is a triangle
        continue;
      }
      for (i = 0; i < vertexCount - 3; i++) {
        var compareLineCount = vertexCount - 1;
        if (i === 0) {
          compareLineCount = vertexCount - 2;
        }
        line1 = [
          [polygon.rings[k][i][0], polygon.rings[k][i][1]],
          [polygon.rings[k][i + 1][0], polygon.rings[k][i + 1][1]]
        ];
        for (j = i + 2; j < compareLineCount; j++) {
          line2 = [
            [polygon.rings[k][j][0], polygon.rings[k][j][1]],
            [polygon.rings[k][j + 1][0], polygon.rings[k][j + 1][1]]
          ];
          intersectResult = esri.geometry._getLineIntersection2(line1, line2);
          if (intersectResult) {
            //in case the intersecting point is the start/end point of the compared lines
            if(!((intersectResult[0] === line1[0][0] && intersectResult[1] === line1[0][1]) ||
               (intersectResult[0] === line2[0][0] && intersectResult[1] === line2[0][1]) ||
               (intersectResult[0] === line1[1][0] && intersectResult[1] === line1[1][1]) ||
               (intersectResult[0] === line2[1][0] && intersectResult[1] === line2[1][1]))){
              return true;
            }
          }
        }
      }
    }
    return false;
  };

  /*******************
   * Internal Methods
   *******************/
  
  /***********************************
   * normalizeCentralMeridian Helpers
   ***********************************/
 
  EG._foldCutResults = function(geometries,cutResults) {
    var currentGeometryIndex = -1;
    dojo.forEach(cutResults.cutIndexes, function(cutIndex, i) {
      var currentGeometry = cutResults.geometries[i];
      var geometryParts = currentGeometry.rings || currentGeometry.paths;

      dojo.forEach(geometryParts, function(points, geometryPartIndex) {
        dojo.some(points,function(point) {  //test if geometry part is to the right of 180, if so then shift to bring within -180 and +180
          /*if (point[0] === (180 + (offsetMagnitude * 360))) {  //point is equal to either 180, 540, 900, etc.  need to test next point
            return false;  //continue test
          } else*/ 
          
          if (point[0] < 180) {
            return true;  //geometry doesn't need to be shifted; exit out of function
          } else {  //point should be shifted.  Use offsetMagnitude to determine offset.
          
            var partMaxX = 0, j, jl = points.length, ptX;
            for (j = 0; j < jl; j++) {
              ptX = points[j][0];
              partMaxX = ptX > partMaxX ? ptX : partMaxX;
            }
            
            var offsetMagnitude = EG._offsetMagnitude(partMaxX,180),
                offsetX = offsetMagnitude * -360,
                pointIndex, pointsLength = points.length;
            
            for (pointIndex = 0; pointIndex < pointsLength; pointIndex++) {
              var currentPoint = currentGeometry.getPoint(geometryPartIndex, pointIndex);
              currentGeometry.setPoint(geometryPartIndex,pointIndex,currentPoint.offset(offsetX,0));
            }

            return true;  //exit out of function
          }      
        });  //end points array.some 
      });  //end geometryPart loop
      
      //cut geometry is either added to geometries array as a new geometry or it is added as a new ring/path to the existing geometry.  
      if (cutIndex === currentGeometryIndex) {  //cut index is equal to current geometry index; add geometry to existing geometry as new rings
        if (currentGeometry.rings) {  //polygon
          dojo.forEach(currentGeometry.rings, function(ring,j) {  //each ring in cut geometry should be added to existing geometry
            geometries[cutIndex] = geometries[cutIndex].addRing(ring);
          });
        } else { //polyline
          dojo.forEach(currentGeometry.paths, function(path,j) {  //each path in cut geometry should be added to existing geometry
            geometries[cutIndex] = geometries[cutIndex].addPath(path);
          });        
        }
      } else {  //new geometry; add to geometries array.
        currentGeometryIndex = cutIndex;
        geometries[cutIndex] = currentGeometry;
      }
    });
    return geometries;
  };


  EG._prepareGeometryForCut = function(geometry,mercatorFlag,offsetX) {  //prepares geometry for projection input.
    var densifiedMaxSegementLength = 1000000;  //1000km max segment length.  Should this be configurable?
    if (mercatorFlag) {  //densify and conver to wgs84 if coord system is web mercator.  Call webMercatorToGeographic with flag that keeps coordinates in linear space (x can be greater than 180 or less than -180
      var densifiedGeometry = EG._straightLineDensify(geometry,densifiedMaxSegementLength);
      geometry = EG.webMercatorToGeographic(densifiedGeometry,true);
    }
    if (offsetX) {  //offset geometry if defined
      geometry = EG._updatePolyGeometry(geometry, offsetX);
    }
    return geometry;
  };

  EG._offsetMagnitude = function(xCoord,offsetFromX) {  //takes xCoord and computes offsetMagnitude with respect to offsetFromX value   
    return Math.ceil((xCoord - offsetFromX) / (offsetFromX * 2));
  };
  
  EG._pointNormalization = function (point, maxX, minX) {
    var pointX = point.x || point[0];  //point or multipoint
    var offsetMagnitude;
    if (pointX > maxX) {
      offsetMagnitude = EG._offsetMagnitude(pointX,maxX); 
      if (point.x) {
        point = point.offset(offsetMagnitude * (-2 * maxX),0);
      } else {
        point[0] = pointX + (offsetMagnitude * (-2 * maxX));
      }
    } else if (pointX < minX) {
      offsetMagnitude = EG._offsetMagnitude(pointX,minX);  
      if (point.x) {
        point = point.offset(offsetMagnitude * (-2 * minX),0);
      } else {
        point[0] = pointX + (offsetMagnitude * (-2 * minX));
      }
    }
    //console.log(point);
    return point;
  };

  EG._updatePolyGeometry = function (geometry, offsetX) {  //transforms polyline or polygon geometry types
    var geometryParts = geometry.paths || geometry.rings,
        i, j, il = geometryParts.length, jl;
        
    for (i = 0; i < il; i++) {
      var geometryPart = geometryParts[i];
      jl = geometryPart.length;
      
      for (j = 0; j < jl; j++) {
        var currentPoint = geometry.getPoint(i, j);
        geometry.setPoint(i,j,currentPoint.offset(offsetX,0));
      }
    }
    return geometry;
  };

  EG._straightLineDensify = function (geom, maxSegmentLength) {
    if (!(geom instanceof esri.geometry.Polyline || geom instanceof esri.geometry.Polygon)) {
      var msg = "_straightLineDensify: the input geometry is neither polyline nor polygon";
      console.error(msg);
      throw new Error(msg);
    }
    var isPline = geom instanceof esri.geometry.Polyline,
        iRings = isPline ? geom.paths : geom.rings,
        oRings = [],
        oRing;
    dojo.forEach(iRings, function (ring) {
      oRings.push(oRing = []);
      oRing.push([ring[0][0], ring[0][1]]);
      var x1, y1, x2, y2;
      var i, j, straightLineDist, sinAlpha, cosAlpha, numberOfSegment, xj, yj;
      for (i = 0; i < ring.length - 1; i++) {
        x1 = ring[i][0];
        y1 = ring[i][1];
        x2 = ring[i + 1][0];
        y2 = ring[i + 1][1];
        straightLineDist = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
        sinAlpha = (y2 - y1) / straightLineDist;
        cosAlpha = (x2 - x1) / straightLineDist;
        numberOfSegment = straightLineDist / maxSegmentLength;
        if (numberOfSegment > 1) {
          for (j = 1; j <= numberOfSegment - 1; j++) {
            var length = j * maxSegmentLength;
            xj = cosAlpha * length + x1;
            yj = sinAlpha * length + y1;
            oRing.push([xj, yj]);
          }
          //the last segment which is longer than the max, but shorter than 2*max
          //devide it in the middle to prevent the result of a very small segment          
          var lastDensifiedLength = (straightLineDist + Math.floor(numberOfSegment - 1) * maxSegmentLength) / 2;
          xj = cosAlpha * lastDensifiedLength + x1;
          yj = sinAlpha * lastDensifiedLength + y1;
          oRing.push([xj, yj]);
        }
        //add the end of the original segment
        oRing.push([x2, y2]);
      }
    });
    if (isPline) {
      return new esri.geometry.Polyline({
        paths: oRings,
        spatialReference: geom.spatialReference
      });
    } else {
      return new esri.geometry.Polygon({
        rings: oRings,
        spatialReference: geom.spatialReference
      });
    }
  };

  /*// This logic can be moved into normalizeCentralMerdian method
  EG._normalizeGeometries = function(geometries) {
    var geometryService = esri.config.defaults.geometryService;
    
    if (geometries && geometries.length && geometryService) {
      var sr = geometries[0].spatialReference;
      if (sr && sr._isWrappable()) {
        return esri.geometry.normalizeCentralMeridian(geometries, geometryService);
      }
    }
  };*/
  
  EG._unitsDictionary = {
    //length unit conversion from miles
    "esriMiles": 1,
    "esriKilometers": 1.609344,
    "esriFeet": 5280,
    "esriMeters": 1609.34,
    "esriYards": 1760,
    "esriNauticalMiles": 0.869,
    "esriCentimeters": 160934,
    "esriDecimeters": 16093.4,
    "esriInches": 63360,
    "esriMillimeters": 1609340,    
    //area unit conversion from acres
    "esriAcres": 1,
    "esriAres": 40.4685642,
    "esriSquareKilometers": 0.00404685642,
    "esriSquareMiles": 0.0015625,
    "esriSquareFeet": 43560,
    "esriSquareMeters": 4046.85642,
    "esriHectares": 0.404685642,
    "esriSquareYards": 4840,
    "esriSquareInches": 6272640,
    "esriSquareMillimeters": 4046856420,
    "esriSquareCentimeters": 40468564.2,
    "esriSquareDecimeters": 404685.642
  };

  EG._toEqualAreaPoint = function (pt) {
    var toRad = Math.PI / 180;
    var a = 6378137;
    var eSq = 0.00669437999019741354678198566736,
        e = 0.08181919084296430236105472696748;
    var sinY = Math.sin(pt.y * toRad);
    var q = (1 - eSq) * ((sinY / (1 - eSq * (sinY * sinY)) - (1 / (2 * e)) * Math.log((1 - e * sinY) / (1 + e * sinY))));
    var x = a * pt.x * toRad;
    var y = a * q * 0.5;
    var equalAreaCynlindricalProjectedPt = new esri.geometry.Point(x, y);
    return equalAreaCynlindricalProjectedPt;
  };
  
  /**************************
   * geodesicDensify Helpers
   **************************/

  EG._directGeodeticSolver = function ( /*radians*/ lat1, /*radians*/ lon1, /*radians*/ alpha1, /*meters*/ s) {
    var a = 6378137,
        b = 6356752.31424518,
        f = 1 / 298.257223563; // WGS84 ellipsoid params
    var sinAlpha1 = Math.sin(alpha1);
    var cosAlpha1 = Math.cos(alpha1);
    var tanU1 = (1 - f) * Math.tan(lat1);
    var cosU1 = 1 / Math.sqrt((1 + tanU1 * tanU1)),
        sinU1 = tanU1 * cosU1;
    var sigma1 = Math.atan2(tanU1, cosAlpha1);
    var sinAlpha = cosU1 * sinAlpha1;
    var cosSqAlpha = 1 - sinAlpha * sinAlpha;
    var uSq = cosSqAlpha * (a * a - b * b) / (b * b);
    var A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
    var B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
    var sigma = s / (b * A),
        sigmaP = 2 * Math.PI;
    var sinSigma, cosSigma, cos2SigmaM;
    while (Math.abs(sigma - sigmaP) > 1e-12) {
      cos2SigmaM = Math.cos(2 * sigma1 + sigma);
      sinSigma = Math.sin(sigma);
      cosSigma = Math.cos(sigma);
      var deltaSigma = B * sinSigma * (cos2SigmaM + B / 4 * (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) - B / 6 * cos2SigmaM * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM * cos2SigmaM)));
      sigmaP = sigma;
      sigma = s / (b * A) + deltaSigma;
    }
    var tmp = sinU1 * sinSigma - cosU1 * cosSigma * cosAlpha1;
    var lat2 = Math.atan2(sinU1 * cosSigma + cosU1 * sinSigma * cosAlpha1, (1 - f) * Math.sqrt(sinAlpha * sinAlpha + tmp * tmp));
    var lambda = Math.atan2(sinSigma * sinAlpha1, cosU1 * cosSigma - sinU1 * sinSigma * cosAlpha1);
    var C = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
    var L = lambda - (1 - C) * f * sinAlpha * (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));
    //var revAz = Math.atan2(sinAlpha, -tmp); // final bearing
    var lat2Deg = lat2 / (Math.PI / 180);
    var lon2Deg = (lon1 + L) / (Math.PI / 180);
    var pt = new esri.geometry.Point(lon2Deg, lat2Deg, new esri.SpatialReference({
      wkid: 4326
    }));
    return pt;
  };

  EG._inverseGeodeticSolver = function ( /*radians*/ lat1, /*radians*/ lon1, /*radians*/ lat2, /*radians*/ lon2) {
    var a = 6378137,
        b = 6356752.31424518,
        f = 1 / 298.257223563; // WGS84 ellipsoid params
    var L = (lon2 - lon1);
    var U1 = Math.atan((1 - f) * Math.tan(lat1));
    var U2 = Math.atan((1 - f) * Math.tan(lat2));
    var sinU1 = Math.sin(U1),
        cosU1 = Math.cos(U1);
    var sinU2 = Math.sin(U2),
        cosU2 = Math.cos(U2);
    var lambda = L,
        lambdaP, iterLimit = 1000;
    var cosSqAlpha, sinSigma, cos2SigmaM, cosSigma, sigma;
    do {
      var sinLambda = Math.sin(lambda),
          cosLambda = Math.cos(lambda);
      sinSigma = Math.sqrt((cosU2 * sinLambda) * (cosU2 * sinLambda) + (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) * (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda));
      if (sinSigma === 0) {
        return 0;
      }
      cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
      sigma = Math.atan2(sinSigma, cosSigma);
      var sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma;
      cosSqAlpha = 1 - sinAlpha * sinAlpha;
      cos2SigmaM = cosSigma - 2 * sinU1 * sinU2 / cosSqAlpha;
      if (isNaN(cos2SigmaM)) {
        cos2SigmaM = 0;
      }
      var C = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
      lambdaP = lambda;
      lambda = L + (1 - C) * f * sinAlpha * (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));
    }
    while (Math.abs(lambda - lambdaP) > 1e-12 && --iterLimit > 0);
    if (iterLimit === 0) {
      //return NaN;
      //As Vincenty pointed out, when two points are nearly antipodal, the formula may not converge
      //It's time to switch to other formula, which may not as highly accurate as Vincenty's. Just for the special case.
      //Here implements Haversine formula
      var haversine_R = 6371009; // km
      var haversine_d = Math.acos(Math.sin(lat1)*Math.sin(lat2) + Math.cos(lat1)*Math.cos(lat2) * Math.cos(lon2-lon1)) * haversine_R;
      var dLon = lon2-lon1; 
      var y = Math.sin(dLon) * Math.cos(lat2);
      var x = Math.cos(lat1)*Math.sin(lat2) - Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon);
      var brng = Math.atan2(y, x);
      return {"azimuth": brng, "geodesicDistance": haversine_d};
    }
    var uSq = cosSqAlpha * (a * a - b * b) / (b * b);
    var A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
    var B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
    var deltaSigma = B * sinSigma * (cos2SigmaM + B / 4 * (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) - B / 6 * cos2SigmaM * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM * cos2SigmaM)));
    var s = b * A * (sigma - deltaSigma);
    var alpha1 = Math.atan2(cosU2 * Math.sin(lambda), cosU1 * sinU2 - sinU1 * cosU2 * Math.cos(lambda));
    var alpha2 = Math.atan2(cosU1 * Math.sin(lambda), cosU1 * sinU2 * Math.cos(lambda) - sinU1 * cosU2);
    var inverseResult = {
      azimuth: alpha1,
      geodesicDistance: s,
      reverseAzimuth: alpha2
    };
    return inverseResult;
  };
  
}()); // end of module anonymous
});
