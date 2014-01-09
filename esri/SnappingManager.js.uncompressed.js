//>>built
// wrapped by build app
define("esri/SnappingManager", ["dijit","dojo","dojox","dojo/require!esri/tasks/query"], function(dijit,dojo,dojox){
dojo.provide("esri.SnappingManager");

dojo.require("esri.tasks.query");

dojo.declare("esri.SnappingManager", null, {
  constructor: function (params) {
    params = params || {};
    if (!params.map) {
      console.error("map is not specified for SnappingManager");
    }
    this.map = params.map;
    this.tolerance = params.tolerance || 15;
    this.layerInfos = [];
    if (params.layerInfos) {
      this.layerInfos = params.layerInfos;
    } else {
      var i;
      for (i = 0; i < this.map.graphicsLayerIds.length; i++) {
        var layer = this.map.getLayer(this.map.graphicsLayerIds[i]);
        this.layerInfos.push({
          "layer": layer
        });
      }
      this.layerInfos.push({
        "layer": this.map.graphics
      });
    }
    if (params.snapPointSymbol) {
      this.snapPointSymbol = params.snapPointSymbol;
    } else {
      this.snapPointSymbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CROSS, 15, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0, 255, 255]), 1), new dojo.Color([0, 255, 0, 0]));
    }
    if (params.alwaysSnap) {
      this.alwaysSnap = params.alwaysSnap;
    } else {
      this.alwaysSnap = false;
    }
    if (params.snapKey) {
      this.snapKey = params.snapKey;
    } else {
      this.snapKey = dojo.keys.copyKey;
    }
    this._SelectionLyrQuery = new esri.tasks.Query();
    this._SelectionLyrQuery.spatialRelationship = esri.tasks.Query.SPATIAL_REL_INTERSECTS;
    this._snappingGraphic = new esri.Graphic();
    this.setLayerInfos(this.layerInfos);
    this._currentGraphicOption = {
      snapToPoint: true,
      snapToVertex: true,
      snapToEdge: true
    };
    this._snappingCallback = dojo.hitch(this, this._snappingCallback);
  },

  /*****************
   * Public Methods
   *****************/

  getSnappingPoint: function (screenPoint) {
    var layers = this.layers,
        tolerance = this.tolerance,
        map = this.map,
        layerOptions = this.layerOptions,
        bottomLeft = map.toMap(screenPoint.offset(-tolerance, tolerance)),
        topRight = map.toMap(screenPoint.offset(tolerance, -tolerance)),
        queryExtent = new esri.geometry.Extent(bottomLeft.x, bottomLeft.y, topRight.x, topRight.y, map.spatialReference),
        query = new esri.tasks.Query();
    query.geometry = queryExtent;
    query.spatialRelationship = esri.tasks.Query.SPATIAL_REL_INTERSECTS;
    //featurePts is the array of all points, including point and vertex, which may be snapped to
    var featurePts = [],
        featureLines = [],
        snappingPoint, extractPointsAndLines = this._extractPointsAndLines,
        deferred = new dojo.Deferred(),
        count = this._nonSelectionLayerCount,
        layerIdx,
        xmin = queryExtent.xmin,
        xmax = queryExtent.xmax;
    if (map.spatialReference._isWrappable()) {
      xmin = esri.geometry.Extent.prototype._normalizeX(queryExtent.xmin, map.spatialReference._getInfo()).x;
      xmax = esri.geometry.Extent.prototype._normalizeX(queryExtent.xmax, map.spatialReference._getInfo()).x;
    }
    var graphicsQueryExtent = new esri.geometry.Extent(xmin, queryExtent.ymin, xmax, queryExtent.ymax, map.spatialReference);

    //Query and add feature from graphicslayer(s) to featurePts and featureLines
    dojo.forEach(layers, function (layer, idx) {
      if (layer.declaredClass === "esri.layers.GraphicsLayer" && layer.visible) {
        var graphics = [];
        dojo.forEach(layer.graphics, function (graphic) {
        if (graphic) {
          if (graphic.visible && graphicsQueryExtent.intersects(graphic.geometry)) {
            graphics.push(graphic);
          }}
        });
        var ptsAndLines = extractPointsAndLines(graphics, layerOptions[idx]);
        featurePts = featurePts.concat(ptsAndLines[0]);
        featureLines = featureLines.concat(ptsAndLines[1]);
      }
    });

    // Process the result from query
    var callback = dojo.hitch(this, function (response) {
      count--;
      if (response instanceof Error) {
        var msg = "getSnappingPoint: query features failed";
        console.log(msg);
      } else {
        var ptsAndLines = extractPointsAndLines(response.features, layerOptions[layerIdx]);
        featurePts = featurePts.concat(ptsAndLines[0]);
        featureLines = featureLines.concat(ptsAndLines[1]);
      }
      if (!count) {
        snappingPoint = this._getSnappingPoint(featurePts, featureLines, screenPoint);
        deferred.callback(snappingPoint);
      }
    });

    //featurelayer query happened.
    var happend = false;
    dojo.forEach(layers, function (layer, idx) {
      if (layer.visible && layer.loaded) {
        layerIdx = idx;
        if ((layer.declaredClass === "esri.layers.FeatureLayer") && layer.mode !== esri.layers.FeatureLayer.MODE_SELECTION) {
          happend = true;
          layer.queryFeatures(query, callback, callback);
        }
      }
    });

    if (!happend) {
      //There is no featurelayer (non-select ones)
      snappingPoint = this._getSnappingPoint(featurePts, featureLines, screenPoint);
      deferred.callback(snappingPoint);
    }
    return deferred;
  },

  setLayerInfos: function (layerInfos) {
    this.layers = [];
    this.layerOptions = [];
    var i;
    for (i = 0; i < layerInfos.length; i++) {
      this.layers.push(layerInfos[i].layer);
      // If snap options are not provided, by default, they are true
      this.layerOptions.push({
        snapToPoint: true,
        snapToVertex: true,
        snapToEdge: true
      });
      if (layerInfos[i].snapToPoint === false) {
        this.layerOptions[i].snapToPoint = layerInfos[i].snapToPoint;
      }
      if (layerInfos[i].snapToVertex === false) {
        this.layerOptions[i].snapToVertex = layerInfos[i].snapToVertex;
      }
      if (layerInfos[i].snapToEdge === false) {
        this.layerOptions[i].snapToEdge = layerInfos[i].snapToEdge;
      }
    }
    this._nonSelectionLayerCount = 0;
    this._featurePtsFromSelectionLayer = [];
    this._featureLinesFromSelectionLayer = [];
    this._selectionLayers = [];
    this._selectionLayerOptions = [];
    dojo.forEach(this.layers, function (layer, idx) {
      if (layer.declaredClass === "esri.layers.FeatureLayer") {
        // if the featurelayer is in selection only mode, query the layer with current map extent.
        if (layer.mode === esri.layers.FeatureLayer.MODE_SELECTION) {
          this._selectionLayers.push(layer);
          this._selectionLayerOptions.push(this.layerOptions[idx]);
        } else {
          this._nonSelectionLayerCount++;
        }
      }
    }, this);
    this.layerInfos = layerInfos;
  },

  destroy: function () {
    dojo.disconnect(this._onExtentChangeConnect);
    this._killOffSnapping();
    this._featurePtsFromSelectionLayer = this._featureLinesFromSelectionLayer = this._currentFeaturePts = this._currentFeatureLines = this.layers = this.map = null;
  },

  /*****************
   * Internal Methods
   *****************/
  _startSelectionLayerQuery: function () {
    dojo.disconnect(this._onExtentChangeConnect);
    this._mapExtentChangeHandler(this._selectionLayers, this._selectionLayerOptions, this.map.extent);
    this._onExtentChangeConnect = dojo.connect(this.map, "onExtentChange", dojo.hitch(this, "_mapExtentChangeHandler", this._selectionLayers, this._selectionLayerOptions));
  },

  _stopSelectionLayerQuery: function () {
    dojo.disconnect(this._onExtentChangeConnect);
  },

  _mapExtentChangeHandler: function (layers, layerOptions, extent) {
    this._featurePtsFromSelectionLayer = [];
    this._featureLinesFromSelectionLayer = [];
    var layerIdx;
    this._SelectionLyrQuery.geometry = extent;
    var callback = dojo.hitch(this, function (response) {
      if (response instanceof Error) {
        var msg = "getSnappingPoint: query features failed";
        console.log(msg);
      } else {
        var ptsAndLines = this._extractPointsAndLines(response.features, layerOptions[layerIdx]);
        this._featurePtsFromSelectionLayer = this._featurePtsFromSelectionLayer.concat(ptsAndLines[0]);
        this._featureLinesFromSelectionLayer = this._featureLinesFromSelectionLayer.concat(ptsAndLines[1]);
      }
    });
    dojo.forEach(layers, function (layer, idx) {
      if (layer.visible && layer.loaded) {
        layerIdx = idx;
        layer.queryFeatures(this._SelectionLyrQuery, callback, callback);
      }
    }, this);
  },

  _extractPointsAndLines: function (features, layerOption) {
    var featurePts = [],
        featureLines = [];
    var i, j;
    dojo.forEach(features, function (feature, idx) {
      if (feature.visible && feature.geometry) {
        if (feature.geometry.type === "point" && layerOption.snapToPoint) {
          featurePts.push(feature.geometry);
        } else if (feature.geometry.type === "polyline") {
          for (i = 0; i < feature.geometry.paths.length; i++) {
            featureLines.push("lineStart");
            for (j = 0; j < feature.geometry.paths[i].length; j++) {
              var linePt = feature.geometry.getPoint(i, j);
              if (layerOption.snapToVertex) {
                featurePts.push(linePt);
              }
              if (layerOption.snapToEdge) {
                featureLines.push(linePt);
              }
            }
            featureLines.push("lineEnd");
          }
        } else if (feature.geometry.type === "polygon") {
          for (i = 0; i < feature.geometry.rings.length; i++) {
            featureLines.push("lineStart");
            for (j = 0; j < feature.geometry.rings[i].length; j++) {
              var polygonPt = feature.geometry.getPoint(i, j);
              if (layerOption.snapToVertex) {
                featurePts.push(polygonPt);
              }
              if (layerOption.snapToEdge) {
                featureLines.push(polygonPt);
              }
            }
            featureLines.push("lineEnd");
          }
        }
      }
    });
    return [featurePts, featureLines];
  },

  _getSnappingPoint: function (featurePts, featureLines, screenPoint) {
    // At this point, all layers have finished query
    // concat points/vertecies/lines from selectionfeaturelayer and currently being drawn graphic
    var dist, snappingPoint, shortestDist = this.tolerance;
    var map = this.map;
    var mapFrameWidth = this.map._getFrameWidth();
    featurePts = featurePts.concat(this._featurePtsFromSelectionLayer);
    featureLines = featureLines.concat(this._featureLinesFromSelectionLayer);
    if (this._currentGraphic) {
      var currentGraphicPtsAndLines = this._extractPointsAndLines([this._currentGraphic], this._currentGraphicOption);
      featurePts = featurePts.concat(currentGraphicPtsAndLines[0]);
      featureLines = featureLines.concat(currentGraphicPtsAndLines[1]);
    }
    //find the closest snapping point/vertext
    var pointX, pointY;
    dojo.forEach(featurePts, function (pt, idx) {
      var featureScreenPt = map.toScreen(pt, true);
      // Move the screen point to the world in which the current map extent is
      if (mapFrameWidth !== -1) {
        featureScreenPt.x = featureScreenPt.x % mapFrameWidth;
        if (featureScreenPt.x < 0) {
          featureScreenPt.x += mapFrameWidth;
        }
        if (map.width > mapFrameWidth) {
          var margin = (map.width - mapFrameWidth)/2;
          while (featureScreenPt.x < margin) {
            featureScreenPt.x += mapFrameWidth;
          }
        }
      }
      dist = Math.sqrt((featureScreenPt.x - screenPoint.x) * (featureScreenPt.x - screenPoint.x) + (featureScreenPt.y - screenPoint.y) * (featureScreenPt.y - screenPoint.y));
      if (dist <= shortestDist) {
        shortestDist = dist;
        pointX = featureScreenPt.x;
        pointY = featureScreenPt.y;
      }
    });

    if (pointX) {
      var snappingVertexPoint = new esri.geometry.Point(pointX, pointY);
      snappingVertexPoint = map.toMap(snappingVertexPoint);
      snappingPoint = snappingVertexPoint;
    } else {
      // If no point/vertex was found for snapping, trying to find the closest snapping edge
      var edgePointX, edgePointY, i, j;
      shortestDist = this.tolerance;
      for (i = 0; i < featureLines.length; i++) {
        if (featureLines[i] === "lineStart") {
          for (j = i + 1; j < featureLines.length; j++) {
            if (featureLines[j + 1] !== "lineEnd" && featureLines[j + 1] !== "lineStart" && featureLines[j] !== "lineEnd" && featureLines[j] !== "lineStart") {
              var screenPt1 = map.toScreen(featureLines[j], true),
                  screenPt2 = map.toScreen(featureLines[j + 1], true),
                  rightPoint = (screenPt1.x >= screenPt2.x) ? screenPt1 : screenPt2,
                  leftPoint = (screenPt1.x >= screenPt2.x) ? screenPt2 : screenPt1;
              if (mapFrameWidth !== -1) {
                rightPoint.x = rightPoint.x % mapFrameWidth;
                if (rightPoint.x < 0) {
                  rightPoint.x += mapFrameWidth;
                }
                leftPoint.x = leftPoint.x % mapFrameWidth;
                if (leftPoint.x < 0) {
                  leftPoint.x += mapFrameWidth;
                }
                if (leftPoint.x > rightPoint.x) {
                  leftPoint.x -= mapFrameWidth;
                }
              }
              // Find the intersected point between the line({x1,y1}, {x2, y2}) and the line
              // which is perpendicular to it and starting from the current mouse screen point
              var x1 = rightPoint.x,
                  y1 = rightPoint.y,
                  x2 = leftPoint.x,
                  y2 = leftPoint.y;
              var intersectedPtX, intersectedPtY, smallX, largeX, smallY, largeY;
              if (x1 === x2) {
                intersectedPtX = x1;
                intersectedPtY = screenPoint.y;
                smallX = largeX = x1;
                smallY = (y1 <= y2) ? y1 : y2;
                largeY = (y1 <= y2) ? y2 : y1;
              }
              else if (y1 === y2) {
                intersectedPtX = screenPoint.x;
                intersectedPtY = y1;
                smallX = (x1 <= x2) ? x1 : x2;
                largeX = (x1 <= x2) ? x2 : x1;
                smallY = largeY = y1;
              }
              else {
                var  a = (y2 - y1) / (x2 - x1),
                  b = (y1 * x2 - x1 * y2) / (x2 - x1),
                  perpendicularLineA = (x1 - x2) / (y2 - y1),
                  perpendicularLineB = (screenPoint.y * y2 - screenPoint.y * y1 - screenPoint.x * x1 + screenPoint.x * x2) / (y2 - y1);
                intersectedPtX = (b - perpendicularLineB) / (perpendicularLineA - a);
                intersectedPtY = a * intersectedPtX + b;
                smallX = (x1 <= x2) ? x1 : x2;
                largeX = (x1 <= x2) ? x2 : x1;
                smallY = (y1 <= y2) ? y1 : y2;
                largeY = (y1 <= y2) ? y2 : y1;
              }
              // Make sure the intersected point is within the line segment of ({x1, y1}, {x2, y2})
              if (intersectedPtX >= smallX && intersectedPtX <= largeX && intersectedPtY >= smallY && intersectedPtY <= largeY) {
                var distToEdge = Math.sqrt((screenPoint.x - intersectedPtX) * (screenPoint.x - intersectedPtX) + (screenPoint.y - intersectedPtY) * (screenPoint.y - intersectedPtY));
                if (distToEdge <= shortestDist) {
                  shortestDist = distToEdge;
                  edgePointX = intersectedPtX;
                  edgePointY = intersectedPtY;
                }
              }
              else {//if it's outside the line segment, check the end points.
                var distToEndPoint1 = Math.sqrt((x1 - screenPoint.x) * (x1 - screenPoint.x) + (y1 - screenPoint.y) * (y1 - screenPoint.y));
                var distToEndPoint2 = Math.sqrt((x2 - screenPoint.x) * (x2 - screenPoint.x) + (y2 - screenPoint.y) * (y2 - screenPoint.y));
                var distToEndPoint;
                if (distToEndPoint1 <= distToEndPoint2) {
                  distToEndPoint = distToEndPoint1;
                  intersectedPtX = x1;
                  intersectedPtY = y1;
                }
                else {
                  distToEndPoint = distToEndPoint2;
                  intersectedPtX = x2;
                  intersectedPtY = y2;
                }
                if (distToEndPoint <= shortestDist) {
                  shortestDist = distToEndPoint;
                  edgePointX = intersectedPtX;
                  edgePointY = intersectedPtY;
                }
              }
            }

            if (featureLines[j] === "lineEnd") {
              i = j;
              break;
            }
          }
        }
      }
      if (edgePointX) {
        var edgePoint = new esri.geometry.Point(edgePointX, edgePointY);
        edgePoint = map.toMap(edgePoint);
        snappingPoint = edgePoint;
      }
    }
    return snappingPoint;
  },

  //This method is designed for adding particular graphic which will be snapped to.
  //The event handler "_onSnappingMouseMoveHandler" in draw toolbar calls this method in order to 
  //be able to snap to the currently being drawn graphic itself.
  _setGraphic: function (graphic) {
    this._currentGraphic = graphic;
  },

  _addSnappingPointGraphic: function () {
    var map = this.map;
    var ptSymbol = this.snapPointSymbol;
    this._snappingGraphic.setSymbol(ptSymbol);
    map.graphics.add(this._snappingGraphic);
  },

  _setUpSnapping: function () {
    var map = this.map;
    this._onSnapKeyDown_connect = dojo.connect(map, "onKeyDown", this, "_onSnapKeyDownHandler");
    this._onSnapKeyUp_connect = dojo.connect(map, "onKeyUp", this, "_onSnapKeyUpHandler");
    this._onSnappingMouseMove_connect = dojo.connect(map, "onMouseMove", this, "_onSnappingMouseMoveHandler");
    this._onSnappingMouseDrag_connect = dojo.connect(map, "onMouseDrag", this, "_onSnappingMouseMoveHandler");
    if (this.alwaysSnap) {
      this._activateSnapping();
    }
  },

  _killOffSnapping: function () {
    dojo.disconnect(this._onSnapKeyDown_connect);
    dojo.disconnect(this._onSnapKeyUp_connect);
    dojo.disconnect(this._onSnappingMouseMove_connect);
    dojo.disconnect(this._onSnappingMouseDrag_connect);
    this._deactivateSnapping();
  },

  _onSnapKeyDownHandler: function (evt) {
    if (evt.keyCode === this.snapKey) {
      dojo.disconnect(this._onSnapKeyDown_connect);
      if (this.alwaysSnap) {
        this._deactivateSnapping();
      } else {
        this._activateSnapping();
      }
    }
  },

  _activateSnapping: function () {
    this._snappingActive = true;
    this._addSnappingPointGraphic();
    if (this._currentLocation) {
      this._onSnappingMouseMoveHandler(this._currentLocation);
    }
  },

  _onSnapKeyUpHandler: function (evt) {
    if (evt.keyCode === this.snapKey) {
      this._onSnapKeyDown_connect = dojo.connect(this.map, "onKeyDown", this, "_onSnapKeyDownHandler");
      if (this.alwaysSnap) {
        this._activateSnapping();
      } else {
        this._deactivateSnapping();
      }
    }
  },

  _deactivateSnapping: function () {
    this._snappingActive = false;
    this._snappingPoint = null;
    this.map.graphics.remove(this._snappingGraphic);
    this._snappingGraphic.setGeometry(null);
  },

  _onSnappingMouseMoveHandler: function (evt) {
    this._currentLocation = evt;
    this._snappingPoint = null;
    if (this._snappingActive) {
      this._snappingGraphic.hide();
      var deferred = this.getSnappingPoint(evt.screenPoint);
      deferred.addCallback(this._snappingCallback);
    }
  },

  _snappingCallback: function (result) {
    this._snappingPoint = result;
    if (result) {
      this._snappingGraphic.show();
      this._snappingGraphic.setGeometry(result);
    }
  }
});
});
