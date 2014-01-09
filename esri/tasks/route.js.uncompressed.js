//>>built
// wrapped by build app
define("esri/tasks/route", ["dijit","dojo","dojox","dojo/require!esri/tasks/na,esri/tasks/gp,esri/utils"], function(dijit,dojo,dojox){
dojo.provide("esri.tasks.route");

dojo.require("esri.tasks.na");
dojo.require("esri.tasks.gp");
dojo.require("esri.utils");

dojo.declare("esri.tasks.RouteTask", esri.tasks._Task, {
    constructor: function(/*String*/ url) {
      this._url.path += "/solve";
      this._handler = dojo.hitch(this, this._handler);
    },

    // Methods to be wrapped with normalize logic
    __msigns: [
      {
        n: "solve",
        c: 3, // number of arguments expected by the method before the normalize era
        a: [ // arguments or properties of arguments that need to be normalized
          { 
            i: 0, 
            p: [ 
              "stops.features", 
              "barriers.features", 
              "polylineBarriers.features", 
              "polygonBarriers.features" 
            ]
          }
        ],
        e: 2
      }
    ],

    _handler: function(response, io, callback, errback, dfd) {
      try {
        var routeNames = [],
            // stopRouteNames = [],
            results = [],
            dirs = response.directions || [],
            routes = response.routes ? response.routes.features : [],
            stops = response.stops ? response.stops.features : [],
            barriers = response.barriers ? response.barriers.features : [],
            polygonBarriers = response.polygonBarriers ? response.polygonBarriers.features : [],
            polylineBarriers = response.polylineBarriers ? response.polylineBarriers.features : [],
            messages = response.messages,
            _nullRouteName = "esri.tasks.RouteTask.NULL_ROUTE_NAME",  //case where user did not specify a route name, only for stops
            forEach = dojo.forEach,
            indexOf = dojo.indexOf,
            allNullStops = true,
            routeName, stopAttr;
        
        //process directions
        forEach(dirs, function(dir) {
          routeNames.push(routeName = dir.routeName);
          results[routeName] = { directions:dir };
        });
        
        //process routes
        forEach(routes, function(route) {
          if (indexOf(routeNames, (routeName = route.attributes.Name)) === -1) {
            routeNames.push(routeName);
            results[routeName] = {};
          }
          results[routeName].route = route;
        });

        //process stops
        forEach(stops, function(stop) {
          stopAttr = stop.attributes;
          if (indexOf(routeNames, (routeName = stopAttr.RouteName || _nullRouteName)) === -1) {
            routeNames.push(routeName);
            results[routeName] = {};
          }
          if (routeName !== _nullRouteName) {
            allNullStops = false;
          }
          if (results[routeName].stops === undefined) {
            results[routeName].stops = [];
          }
          results[routeName].stops.push(stop);
        });

        if (stops.length > 0 && allNullStops === true) {
          results[routeNames[0]].stops = results[_nullRouteName].stops;
          delete results[_nullRouteName];
          routeNames.splice(dojo.indexOf(routeNames, _nullRouteName), 1);
        }

        //convert json results into RouteResult objects
        var routeResults = [];
        forEach(routeNames, function(routeName, i) {
          results[routeName].routeName = routeName === _nullRouteName ? null : routeName;
          routeResults.push(new esri.tasks.RouteResult(results[routeName]));
        });

//        //create barriers array
//        forEach(barriers, function(barrier, i) {
//          barriers[i] = new esri.Graphic(barrier);
//        });
        
        // anonymous function to create barriers of all kind
        var barriersFunc = function(barrs) {
          forEach(barrs, function(barr, i) {
            barrs[i] = new esri.Graphic(barr);
          });
          return barrs;
        };
        
        //create message array
        forEach(messages, function(message, i) {
          messages[i] = new esri.tasks.NAMessage(message);
        });
        
        var solveResult = {
          routeResults: routeResults,
          barriers: barriersFunc(barriers),
          polygonBarriers: barriersFunc(polygonBarriers),
          polylineBarriers: barriersFunc(polylineBarriers),
          messages: messages
        };

        /*this.onSolveComplete(solveResult);
        if (callback) {
          callback(solveResult);
        }*/
       
        this._successHandler([ solveResult ], "onSolveComplete", callback, dfd);
      }
      catch (err) {
        this._errorHandler(err, errback, dfd);
      }
    },

    solve: function(/*esri.tasks.RouteParameters*/ params, /*function?*/ callback, /*function?*/ errback, context) {
      //TODO: Remove this check at 9.4, once CR 107142 & 110696 as resolved. Dmitry Kudinov or Matt Crowder would have more details.
      //Email date (April 29, 2009);
      var stops = params.stops;
      if (stops && stops instanceof esri.tasks.FeatureSet) {
        var routeNames = [],
            error = false,
            attr;

        dojo.forEach(stops.features, function(stop) {
          attr = stop.attributes;
          if ((!attr || !attr.RouteName) && !error) {
            error = true;
          }
          else if (dojo.indexOf(routeNames, attr ? attr.RouteName : "") === -1) {
            routeNames.push(attr ? attr.RouteName : "");
          }
        });

        if (routeNames.length > 1 && error) {
          error = new Error(esri.bundle.tasks.na.route.routeNameNotSpecified);
          this.onError(error);
          if (errback) {
            errback(error);
          }
          throw error;
        }
      }
      //TODO: End
      
      var assembly = context.assembly,
          _params = this._encode(dojo.mixin({}, this._url.query, { f:"json" }, params.toJson(assembly && assembly[0]))),
          _h = this._handler,
          _e = this._errorHandler;

      return esri.request({
        url: this._url.path,
        content: _params,
        callbackParamName: "callback",
        load: function(r, i) { _h(r, i, callback, errback, context.dfd); },
        error: function(r) { _e(r, errback, context.dfd); }
      });
    },

    onSolveComplete: function() {
      //route results: RouteResult[]
    }
  }
);

esri._createWrappers("esri.tasks.RouteTask");

dojo.declare("esri.tasks.RouteParameters", null, {
    accumulateAttributes: null,
    attributeParameterValues: null,
    barriers: null,
    directionsLanguage: null,
    directionsLengthUnits: null,
    directionsTimeAttribute: null,
    doNotLocateOnRestrictedElements: false,
    findBestSequence: null,
    ignoreInvalidLocations: null,
    impedanceAttribute: null,
    outputLines: null,
    outputGeometryPrecision: null,
    outputGeometryPrecisionUnits: null,
    outSpatialReference: null,
    polygonBarriers: null,
    polylineBarriers: null,
    preserveFirstStop: null,
    preserveLastStop: null,
    restrictionAttributes: null,
    restrictUTurns: null,
    returnBarriers: false,
    returnDirections: false,
    returnPolygonBarriers: false,
    returnPolylineBarriers: false,
    returnRoutes: true,
    returnStops: false,
    startTime: null,
    stops: null,
    useHierarchy: null,
    useTimeWindows: null,
  
    toJson: function(normalized) {
      var json = {
                    returnDirections: this.returnDirections,
                    returnRoutes: this.returnRoutes,
                    returnStops: this.returnStops,
                    returnBarriers: this.returnBarriers,
                    returnPolygonBarriers: this.returnPolygonBarriers,
                    returnPolylineBarriers: this.returnPolylineBarriers,
                    attributeParameterValues: this.attributeParameterValues && dojo.toJson(this.attributeParameterValues),
                    outSR: this.outSpatialReference ? (this.outSpatialReference.wkid || dojo.toJson(this.outSpatialReference.toJson()))  : null,
                    outputLines: this.outputLines,
                    findBestSequence: this.findBestSequence,
                    preserveFirstStop: this.preserveFirstStop,
                    preserveLastStop: this.preserveLastStop,
                    useTimeWindows: this.useTimeWindows,
                    startTime: this.startTime ? this.startTime.getTime() : null,
                    accumulateAttributeNames: this.accumulateAttributes ? this.accumulateAttributes.join(",") : null,
                    ignoreInvalidLocations: this.ignoreInvalidLocations,
                    impedanceAttributeName: this.impedanceAttribute,
                    restrictionAttributeNames: this.restrictionAttributes ? this.restrictionAttributes.join(",") : null,
                    restrictUTurns: this.restrictUTurns,
                    useHierarchy: this.useHierarchy,
                    directionsLanguage: this.directionsLanguage,
                    outputGeometryPrecision: this.outputGeometryPrecision,
                    outputGeometryPrecisionUnits: this.outputGeometryPrecisionUnits,
                    directionsLengthUnits: esri.tasks._NALengthUnit[this.directionsLengthUnits],
                    directionsTimeAttributeName: this.directionsTimeAttribute
                  },
          stops = this.stops;
      
      if (stops instanceof esri.tasks.FeatureSet && stops.features.length > 0) {
        json.stops = dojo.toJson({ 
          type:"features", 
          features:esri._encodeGraphics(stops.features, normalized && normalized["stops.features"]), 
          doNotLocateOnRestrictedElements:this.doNotLocateOnRestrictedElements 
        });
      }
      else if (stops instanceof esri.tasks.DataLayer) {
        json.stops = stops;
      }
      else if (stops instanceof esri.tasks.DataFile) {
        json.stops = dojo.toJson({
          type: "features",
          url: stops.url,
          doNotLocateOnRestrictedElements: this.doNotLocateOnRestrictedElements
        });
      }
      
      // anonymous function to process barriers of all kind
      var barriersFunc = function(barrs, paramName) {
        if (!barrs) {
          return null;
        }
        
        if (barrs instanceof esri.tasks.FeatureSet) {
          if (barrs.features.length > 0) {
            return dojo.toJson({ 
              type:"features", 
              features:esri._encodeGraphics(barrs.features, normalized && normalized[paramName]) 
            });
          }
          else {
            return null;
          }
        }
        else if (barrs instanceof esri.tasks.DataLayer) {
          return barrs;
        }
        else if (barrs instanceof esri.tasks.DataFile) {
          return dojo.toJson({
            type: "features",
            url: barrs.url
          });
        }
        return dojo.toJson(barrs);
      };
      
      if (this.barriers) {
        json.barriers = barriersFunc(this.barriers, "barriers.features");
      }
      if (this.polygonBarriers) {
        json.polygonBarriers = barriersFunc(this.polygonBarriers, "polygonBarriers.features");
      }
      if (this.polylineBarriers) {
        json.polylineBarriers = barriersFunc(this.polylineBarriers, "polylineBarriers.features");
      }
      
      return esri.filter(json, function(value) {
        if (value !== null) {
          return true;
        }
      });
    }
  }
);

dojo.declare("esri.tasks.RouteResult", null, {
    constructor: function(/*Object*/ json) {
      //create copy of compressed geometries since FeatureSet will destroy the feature.compressedGeometry property
      if (json.directions) {
        var cgs = []; //compressed geometries array
        dojo.forEach(json.directions.features, function(f, i) {
          cgs[i] = f.compressedGeometry;
        });

        this.directions = new esri.tasks.DirectionsFeatureSet(json.directions, cgs);
      }
      
      this.routeName = json.routeName;
      
      if (json.route) {
        this.route = new esri.Graphic(json.route);
      }
      
      if (json.stops) {
        var ss = (this.stops = []);
        dojo.forEach(json.stops, function(stop, i) {
          ss[stop.attributes.Sequence - 1] = new esri.Graphic(stop);
        });
      }
    },

    routeName: null,
    directions: null,
    route: null,
    stops: null
  }
);
});
