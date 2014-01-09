//>>built
// wrapped by build app
define("esri/tasks/geometry", ["dijit","dojo","dojox","dojo/require!esri/tasks/_task"], function(dijit,dojo,dojox){
dojo.provide("esri.tasks.geometry");

dojo.require("esri.tasks._task");

dojo.declare("esri.tasks.GeometryService", esri.tasks._Task, {
    constructor: function(/*String*/ url) {
      var hitch = dojo.hitch;
      this._projectHandler = hitch(this, this._projectHandler);
      this._simplifyHandler = hitch(this, this._simplifyHandler);
      this._bufferHandler = hitch(this, this._bufferHandler);
      this._areasAndLengthsHandler = hitch(this, this._areasAndLengthsHandler);
      this._lengthsHandler = hitch(this, this._lengthsHandler);
      this._labelPointsHandler = hitch(this, this._labelPointsHandler);
      this._relationHandler = hitch(this, this._relationHandler);
      this._convexHullHandler = hitch(this, this._convexHullHandler);
      this._unionHandler = hitch(this, this._unionHandler);      
      this._autoCompleteHandler = hitch(this, this._autoCompleteHandler);      
      this._reshapeHandler = hitch(this, this._reshapeHandler);            
      this._cutHandler = hitch(this, this._cutHandler);            
      this._intersectHandler = hitch(this, this._intersectHandler);            
      this._differenceHandler = hitch(this, this._differenceHandler);            
      this._trimExtendHandler = hitch(this, this._trimExtendHandler);
      this._densifyHandler = hitch(this, this._densifyHandler);                  
      this._generalizeHandler = hitch(this, this._densifyHandler);
      this._offsetHandler = hitch(this, this._offsetHandler);
      this._distanceHandler = hitch(this, this._distanceHandler);
    },

    _encodeGeometries: function(geometries) {
      var gs = [];
      for (var i = 0, il = geometries.length; i < il; i++) {
        gs.push(geometries[i].toJson());
      }
      return { geometryType: esri.geometry.getJsonType(geometries[0]), geometries: gs };      
    },

    _decodeGeometries: function(response, geometryType, sr) {
      var Geometry = esri.geometry.getGeometryType(geometryType),          
          geometries = response.geometries,
          fs = [],
          srJson = { spatialReference: sr.toJson() },
          mixin = dojo.mixin;

      dojo.forEach(geometries, function(g, i) {
        fs[i] = new Geometry(mixin(g, srJson));
      });

      return fs;
    },
    
    _toProjectGeometry: function(geometry) {
      var sr = geometry.spatialReference.toJson();
      if (geometry instanceof esri.geometry.Extent) {
        return new esri.geometry.Polygon({ rings:[[[geometry.xmin, geometry.ymin], [geometry.xmin, geometry.ymax], [geometry.xmax, geometry.ymax], [geometry.xmax, geometry.ymin], [geometry.xmin, geometry.ymin]]], spatialReference:sr });
      }
      else {
        return new esri.geometry.Polyline({ paths:[[].concat(geometry.points)], spatialReference:sr });
      }
    },
    
    _fromProjectedGeometry: function(geometry, geometryType, outSR) {
      if (geometryType === "esriGeometryEnvelope") {
        var ring = geometry.rings[0];
        return new esri.geometry.Extent(ring[0][0], ring[0][1], ring[2][0], ring[2][1], outSR);
      }
      else {
        return new esri.geometry.Multipoint({ points:geometry.paths[0], spatialReference: outSR.toJson() });
      }
    },

    project: function(/*esri.geometry.Geometry[]*/ geometries, /*esri.SpatialReference*/ outSR, /*Function?*/ callback, /*Function?*/ errback) {
      //summary: Project argument graphic feature geometries to argument out spatial reference
      // geometries: esri.geometry.Geometry[]: geometries to be projected
      // outSR: Number: Spatial reference well known ID to project geometries to
      
      //10.1 adds 2 new params, transformation and transformationForward
      //new signature is function(/*object*/ params, /*Function?*/ callback, /*Function?*/ errback)
      //the old signature still works
      var params = dojo.mixin({}, this._url.query, {f: "json"}), 
          geometry;
      if (!geometries.geometries) {
        geometry = geometries[0];
        params = dojo.mixin(params,
                   {
                     outSR: outSR.wkid || dojo.toJson(outSR.toJson()),
                     inSR: geometry.spatialReference.wkid || dojo.toJson(geometry.spatialReference.toJson()),
                     geometries: dojo.toJson(this._encodeGeometries(geometries))
                   });
      }
      else {
        errback = callback;
        callback = outSR;
        outSR = geometries.outSR;
        geometry = geometries.geometries[0];
        params = dojo.mixin(params, geometries.toJson());
      }

      var geometryType = esri.geometry.getJsonType(geometry),
          _h = this._projectHandler,
          _e = this._errorHandler,
          dfd = new dojo.Deferred(esri._dfdCanceller);
                 
      dfd._pendingDfd = esri.request({
        url: this._url.path + "/project",
        content: params,
        callbackParamName: "callback",
        load: (function(r, i) { _h(r, i, geometryType, outSR, callback, errback, dfd); }),
        error: (function(r) { _e(r, errback, dfd); })
      });
      
      return dfd;
    },

    _projectHandler: function(response, io, geometryType, outSR, callback, errback, dfd) {
      try{
        var fs = this._decodeGeometries(response, geometryType, outSR);

        /*this.onProjectComplete(fs);
        if (callback) {
          callback(fs);
        }*/
        
        this._successHandler([ fs ], "onProjectComplete", callback, dfd);
      }
      catch (err) {
        this._errorHandler(err, errback, dfd);
      }
    },

    onProjectComplete: function() {
      //summary: Event fired when Geometry Service project completes
    },

    simplify: function(/*esri.geometry.Geometry[]*/ geometries, /*Function?*/ callback, /*Function?*/ errback) {
      //summary: Simplify argument graphic feature geometries
      // geometries: esri.geometry.Geometry[]: geometries to be simplified
      var outSR = geometries[0].spatialReference;
      var params = dojo.mixin({},
                              this._url.query,
                              {
                                f:"json",
                                sr:outSR.wkid ? outSR.wkid : dojo.toJson(outSR.toJson()),
                                geometries: dojo.toJson(this._encodeGeometries(geometries))
                              }
                              ),
          geometryType = esri.geometry.getJsonType(geometries[0]),
          _h = this._simplifyHandler,
          _e = this._errorHandler,
          dfd = new dojo.Deferred(esri._dfdCanceller);

      dfd._pendingDfd = esri.request({
        url: this._url.path + "/simplify",
        content: params,
        callbackParamName: "callback",
        load: (function(r, i) { _h(r, i, geometryType, outSR, callback, errback, dfd); }),
        error: (function(r) { _e(r, errback, dfd); })
      });
      return dfd;
    },

    _simplifyHandler: function(response, io, geometryType, sr, callback, errback, dfd) {
      try {
        var fs = this._decodeGeometries(response, geometryType, sr);

        /*this.onSimplifyComplete(fs);
        if (callback) {
          callback(fs);
        }*/
        this._successHandler([ fs ], "onSimplifyComplete", callback, dfd);
      }
      catch (err) {
        this._errorHandler(err, errback, dfd);
      }
    },

    onSimplifyComplete: function() {
      //summary: Event fired when Geometry Service simplify completes
    },

    convexHull: function(/*esri.geometry.Geometry[]*/ geometries, /*Function?*/ callback, /*Function?*/ errback) {
      //summary: Create a convex hull from input graphic feature geometries
      // geometries: esri.geometry.Geometry[]: geometries to be used to compute covex hull
      var outSR = geometries[0].spatialReference;
      var params = dojo.mixin({},
                              this._url.query,
                              {
                                f:"json",
                                sr:dojo.toJson(outSR.toJson()),
                                geometries: dojo.toJson(this._encodeGeometries(geometries))
                              }
                              ),
          _h = this._convexHullHandler,
          _e = this._errorHandler,
          dfd = new dojo.Deferred(esri._dfdCanceller);

      dfd._pendingDfd = esri.request({
        url: this._url.path + "/convexHull",
        content: params,
        callbackParamName: "callback",
        load: (function(r, i) { _h(r, i, outSR, callback, errback, dfd); }),
        error: (function(r) { _e(r, errback, dfd); })
      });
      return dfd;
    },

    _convexHullHandler: function(response, io, outSR, callback, errback, dfd) {
      try {
        var geom = esri.geometry.fromJson(response.geometry).setSpatialReference(outSR);
        
        /*this.onConvexHullComplete(geom);
        if (callback) {
          callback(geom);
        }*/
       
        this._successHandler([ geom ], "onConvexHullComplete", callback, dfd);
      }
      catch (err) {
        this._errorHandler(err, errback, dfd);
      }
    },

    onConvexHullComplete: function() {
      //summary: Event fired when Geometry Service convexHull completes
    },

    union: function(/*esri.geometry.Geometry[]*/ geometries, /*Function?*/ callback, /*Function?*/ errback) {
      //summary: Constructs the set theoretic union from input geometries
      // geometries: esri.geometry.Geometry[]: geometries to be unioned
      var outSR = geometries[0].spatialReference;
      var params = dojo.mixin({},
                              this._url.query,
                              {
                                f:"json",
                                sr:dojo.toJson(outSR.toJson()),
                                geometries: dojo.toJson(this._encodeGeometries(geometries))
                              }
                              ),
          _h = this._unionHandler,
          _e = this._errorHandler,
          dfd = new dojo.Deferred(esri._dfdCanceller);

      dfd._pendingDfd = esri.request({
        url: this._url.path + "/union",
        content: params,
        callbackParamName: "callback",
        load: (function(r, i) { _h(r, i, outSR, callback, errback, dfd); }),
        error: (function(r) { _e(r, errback, dfd); })
      });
      return dfd;
    },

    _unionHandler: function(response, io, outSR, callback, errback, dfd) {
      try {
        var geom = esri.geometry.fromJson(response.geometry).setSpatialReference(outSR);
        
        /*this.onUnionComplete(geom);
        if (callback) {
          callback(geom);
        }*/
       
        this._successHandler([ geom ], "onUnionComplete", callback, dfd);
      }
      catch (err) {
        this._errorHandler(err, errback, dfd);
      }
    },

    onUnionComplete: function() {
      //summary: Event fired when Geometry Service union completes
    },

    autoComplete: function(/*esri.geometry.Geometry[]*/ polygons, /*esri.geometry.Geometry[]*/ polylines, /*Function?*/ callback, /*Function?*/ errback) {
      //summary: Creates new polygons based on input polygons and input polylines
      // polygons: esri.geometry.Geometry[]: polygon features that have boundaries that are to be used when constructing new polygon
      // polylines: esri.geometry.Geometry[]: polyline features that should be used when constructing new polygons
      var outSR = polygons[0].spatialReference;
      var params = dojo.mixin({},
                              this._url.query,
                              {
                                f:"json",
                                sr:dojo.toJson(outSR.toJson()),
                                polygons: dojo.toJson(this._encodeGeometries(polygons).geometries),
                                polylines: dojo.toJson(this._encodeGeometries(polylines).geometries)                                
                              }
                              ),
          _h = this._autoCompleteHandler,
          _e = this._errorHandler,
          dfd = new dojo.Deferred(esri._dfdCanceller);

      dfd._pendingDfd = esri.request({
        url: this._url.path + "/autoComplete",
        content: params,
        callbackParamName: "callback",
        load: (function(r, i) { _h(r, i, outSR, callback, errback, dfd); }),
        error: (function(r) { _e(r, errback, dfd); })
      });
      return dfd;
    },

    _autoCompleteHandler: function(response, io, outSR, callback, errback, dfd) {
      try {
        var Pgon = esri.geometry.Polygon,
            geoms = response.geometries,
            results = [];

        for (var i=0, il=geoms.length; i<il; i++) {
          results[i] = new Pgon({spatialReference:outSR, rings:geoms[i].rings});
        }

        /*this.onAutoCompleteComplete(results);
        if (callback) {
          callback(results);
        }*/
       
        this._successHandler([ results ], "onAutoCompleteComplete", callback, dfd);
      }
      catch (err) {
        this._errorHandler(err, errback, dfd);
      }
    },

    onAutoCompleteComplete: function() {
      //summary: Event fired when Geometry Service AutoComplete completes
    },

    reshape: function(/*esri.geometry.Geometry*/ geometry, /*esri.geometry.Geometry*/ reshaper, /*Function?*/ callback, /*Function?*/ errback) {
      //summary: reshape input geometry (polyline/polygon) with input reshaper polyline
      // geometry: esri.Graphic: target graphic (polyline or polygon) feature to be reshaped
      // reshaper: esri.Graphic: polyline that does the reshaping
      var outSR = geometry.spatialReference;
      var params = dojo.mixin({},
                              this._url.query,
                              {
                                f:"json",
                                sr:dojo.toJson(outSR.toJson()),
                                target: dojo.toJson({ geometryType:esri.geometry.getJsonType(geometry), geometry:geometry.toJson() }),
                                reshaper: dojo.toJson(reshaper.toJson())
                              }
                              ),
          _h = this._reshapeHandler,
          _e = this._errorHandler,
          dfd = new dojo.Deferred(esri._dfdCanceller);

      dfd._pendingDfd = esri.request({
        url: this._url.path + "/reshape",
        content: params,
        callbackParamName: "callback",
        load: (function(r, i) { _h(r, i, outSR, callback, errback, dfd); }),
        error: (function(r) { _e(r, errback, dfd); })
      });
      return dfd;
    },

    _reshapeHandler: function(response, io, outSR, callback, errback, dfd) {
      try {
        var geom = esri.geometry.fromJson(response.geometry).setSpatialReference(outSR);
        
        /*this.onReshapeComplete(geom);
        if (callback) {
          callback(geom);
        }*/
       
        this._successHandler([ geom ], "onReshapeComplete", callback, dfd);
      }
      catch (err) {
        this._errorHandler(err, errback, dfd);
      }
    },

    onReshapeComplete: function() {
      //summary: Event fired when Geometry Service reshape completes
    },

    cut: function(/*esri.geometry.Geometry[] */ geometries, /*esri.Graphic*/ cutter, /*Function?*/ callback, /*Function?*/ errback) {
      //summary: cut input geometry (polyline/polygon) with input cutter polyline
      // geometries: esri.geometry.Geometry: geometry (polyline or polygon) feature to be cut
      // cutter: esri.geometry.Geometry: polyline that will be used to divide the target geometry into pieces
      var outSR = geometries[0].spatialReference;
      var geoms = dojo.map(geometries, function(geometry) {
        return geometry.toJson();
      });
      var params = dojo.mixin({},
                              this._url.query,
                              {
                                f:"json",
                                sr:dojo.toJson(outSR.toJson()),
                                target: dojo.toJson({ geometryType:esri.geometry.getJsonType(geometries[0]), geometries:geoms }),
                                cutter: dojo.toJson(cutter.toJson())
                              }
                              ),
          _h = this._cutHandler,
          _e = this._errorHandler,
          dfd = new dojo.Deferred(esri._dfdCanceller);

      dfd._pendingDfd = esri.request({
        url: this._url.path + "/cut",
        content: params,
        callbackParamName: "callback",
        load: (function(r, i) { _h(r, i, outSR, callback, errback, dfd); }),
        error: (function(r) { _e(r, errback, dfd); })
      });
      return dfd;
    },

    _cutHandler: function(response, io, outSR, callback, errback, dfd) {
      try {
        var geoms = response.geometries;
        var results = {};
            results.cutIndexes = response.cutIndexes;
            results.geometries = [];

        dojo.forEach(geoms,function(geom) {
          results.geometries.push(esri.geometry.fromJson(geom).setSpatialReference(outSR));
        });

        /*this.onCutComplete(results);
        if (callback) {
          callback(results);
        }*/
        this._successHandler([ results ], "onCutComplete", callback, dfd);
      }
      catch (err) {
        this._errorHandler(err, errback, dfd);
      }
    },

    onCutComplete: function() {
      //summary: Event fired when Geometry Service cut completes
    },

    intersect: function(/*esri.geometry.Geometry[]*/ geometries, /*esri.geometry.Geometry*/ geometry, /*Function?*/ callback, /*Function?*/ errback) {
      //summary: constructs set-theoretic intersection between array of features and another feature
      // geometries: esri.geometry.Geometry[]: geometries to test against
      // geometry: esri.Graphic: feature of any geometry type that has a dimension of equal or greater value to features
      var outSR = geometries[0].spatialReference;
      var params = dojo.mixin({},
                              this._url.query,
                              {
                                f:"json",
                                sr:dojo.toJson(outSR.toJson()),
                                geometries: dojo.toJson(this._encodeGeometries(geometries)),                                
                                geometry: dojo.toJson({geometryType:esri.geometry.getJsonType(geometry), geometry:geometry.toJson()})
                              }
                              ),
          _h = this._intersectHandler,
          _e = this._errorHandler,
          dfd = new dojo.Deferred(esri._dfdCanceller);

      dfd._pendingDfd = esri.request({
        url: this._url.path + "/intersect",
        content: params,
        callbackParamName: "callback",
        load: (function(r, i) { _h(r, i, outSR, callback, errback, dfd); }),
        error: (function(r) { _e(r, errback, dfd); })
      });
      return dfd;
    },

    _intersectHandler: function(response, io, outSR, callback, errback, dfd) {
      try {
        var geoms = response.geometries,
            results = [];

        dojo.forEach(geoms,function(geom) {
          results.push(esri.geometry.fromJson(geom).setSpatialReference(outSR));
        });

        /*this.onIntersectComplete(results);
        if (callback) {
          callback(results);
        }*/
       
        this._successHandler([ results ], "onIntersectComplete", callback, dfd);
      }
      catch (err) {
        this._errorHandler(err, errback, dfd);
      }
    },

    onIntersectComplete: function() {
      //summary: Event fired when Geometry Service intersect completes
    },

    difference: function(/*esri.geometry.Geometry[]*/ geometries, /*esri.geometry.Geometry*/ geometry, /*Function?*/ callback, /*Function?*/ errback) {
      //summary: Creates new geometry based on the set-theoretic difference between the geometry inputs
      // geometries: esri.geometry.Geometry[]: Input geometries
      // geometry: esri.geometry.Geometry: Geometry whose dimension is equal to or greater than geometries dimension
      var outSR = geometries[0].spatialReference;
      var params = dojo.mixin({},
                              this._url.query,
                              {
                                f:"json",
                                sr:dojo.toJson(outSR.toJson()),
                                geometries: dojo.toJson(this._encodeGeometries(geometries)),
                                geometry: dojo.toJson({ geometryType:esri.geometry.getJsonType(geometry), geometry:geometry.toJson() })                               
                              }
                              ),
          _h = this._differenceHandler,
          _e = this._errorHandler,
          dfd = new dojo.Deferred(esri._dfdCanceller);

      dfd._pendingDfd = esri.request({
        url: this._url.path + "/difference",
        content: params,
        callbackParamName: "callback",
        load: (function(r, i) { _h(r, i, outSR, callback, errback, dfd); }),
        error: (function(r) { _e(r, errback, dfd); })
      });
      return dfd;
    },

    _differenceHandler: function(response, io, outSR, callback, errback, dfd) {
      try {
        var geoms = response.geometries,
            results = [];

        dojo.forEach(geoms,function(geom) {
          results.push(esri.geometry.fromJson(geom).setSpatialReference(outSR));
        });

        /*this.onDifferenceComplete(results);
        if (callback) {
          callback(results);
        }*/
       
        this._successHandler([ results ], "onDifferenceComplete", callback, dfd);
      }
      catch (err) {
        this._errorHandler(err, errback, dfd);
      }
    },

    onDifferenceComplete: function() {
      //summary: Event fired when Geometry Service AutoComplete completes
    },
    
    buffer: function(/*esri.tasks.BufferParameters*/ params, /*Function?*/ callback, /*Function?*/ errback) {
      //summary: Buffer graphic feature geometries specified in the argument params
      // params: esri.tasks.BufferParameters: Parameters to pass to server to buffer
      // callback: Function to be called once task completes
      
      var _params = dojo.mixin( {},
                                this._url.query,
                                { f:"json" },
                                params.toJson()
                              ),
          sr = params.outSpatialReference || params.geometries[0].spatialReference,
          _h = this._bufferHandler,
          _e = this._errorHandler,
          dfd = new dojo.Deferred(esri._dfdCanceller);

      dfd._pendingDfd = esri.request({
        url: this._url.path + "/buffer",
        content: _params,
        callbackParamName: "callback",
        load: (function(r, i) { _h(r, i, sr, callback, errback, dfd); }),
        error: (function(r) { _e(r, errback, dfd); })
      });
      return dfd;
    },
    
    _bufferHandler: function(response, io, sr, callback, errback, dfd) {
      try {
        var Pgon = esri.geometry.Polygon,
            geoms = response.geometries,
            result = [];

        for (var i=0, il=geoms.length; i<il; i++) {
          result[i] = new Pgon({spatialReference:sr, rings:geoms[i].rings});
        }

        /*this.onBufferComplete(result);
        if (callback) {
          callback(result);
        }*/
       
        this._successHandler([ result ], "onBufferComplete", callback, dfd);
      }
      catch (err) {
        this._errorHandler(err, errback, dfd);
      }
    },
    
    onBufferComplete: function() {
      //summary: Event fired when Geometry Service buffer completes
    },
    
    areasAndLengths: function(/*esri.tasks.AreasAndLengthsParameters*/ params, /*Function?*/ callback, /*Function?*/ errback) {
      //summary:  geometries specified in the argument params
      // params: esri.tasks.AreaAndLengthsParameters: Parameters to pass to server
      // callback: Function to be called once task completes
       var _params = dojo.mixin( {},
                                this._url.query,
                                { f:"json" },
                                params.toJson()
                              ),          
          _h = this._areasAndLengthsHandler,
          _e = this._errorHandler,
          dfd = new dojo.Deferred(esri._dfdCanceller);

      dfd._pendingDfd = esri.request({
        url: this._url.path + "/areasAndLengths",
        content: _params,
        callbackParamName: "callback",
        load: (function(r, i) { _h(r, i, callback, errback, dfd); }),
        error: (function(r) { _e(r, errback, dfd); })
      });
      return dfd;
    },
    
    _areasAndLengthsHandler: function(response, io, callback, errback, dfd) {
      try {
        /*this.onAreasAndLengthsComplete(response);
        if (callback) {
          callback(response);
        }*/
       
        this._successHandler([ response ], "onAreasAndLengthsComplete", callback, dfd);
      }
      catch (err) {
        this._errorHandler(err, errback, dfd);
      }
    },
    
    onAreasAndLengthsComplete: function() {
      //summary: Event fired when Geometry Service areasAndLengths completes
    },
    
    lengths: function(/*esri.tasks.LengthsParameters*/ params, /*Function?*/ callback, /*Function?*/ errback) {
      //summary:  geometries specified in the argument params
      // params: esri.tasks.LengthsParameters: Parameters to pass to server
      // callback: Function to be called once task completes
      var _params = dojo.mixin( {},
                                this._url.query,
                                { f:"json" },
                                params.toJson()
                              ),          
          _h = this._lengthsHandler,
          _e = this._errorHandler,
          dfd = new dojo.Deferred(esri._dfdCanceller);

      dfd._pendingDfd = esri.request({
        url: this._url.path + "/lengths",
        content: _params,
        callbackParamName: "callback",
        load: (function(r, i) { _h(r, i, callback, errback, dfd); }),
        error: (function(r) { _e(r, errback, dfd); })
      });
      return dfd;
    },
    
    _lengthsHandler: function(response, io, callback, errback, dfd) {
      try {
        /*this.onLengthsComplete(response);
        if (callback) {
          callback(response);
        }*/
       
        this._successHandler([ response ], "onLengthsComplete", callback, dfd);
      }
      catch (err) {
        this._errorHandler(err, errback, dfd);
      }
    },
    
    onLengthsComplete: function() {
      //summary: Event fired when Geometry Service lengths completes
    },
    
    labelPoints: function(/*esri.geometry.Polygons[]*/ polygons, /*Function?*/ callback, /*Function?*/ errback) {
      var geoms = dojo.map(polygons, function(geom){
        return geom.toJson();
      });
      var sr = polygons[0].spatialReference,
          params = dojo.mixin({},
                              this._url.query,
                              {
                                f:"json",
                                sr:sr.wkid ? sr.wkid : dojo.toJson(sr.toJson()),
                                polygons: dojo.toJson(geoms)
                              }
                             ),
          _h = this._labelPointsHandler,
          _e = this._errorHandler,
          dfd = new dojo.Deferred(esri._dfdCanceller);

      dfd._pendingDfd = esri.request({
        url: this._url.path + "/labelPoints",
        content: params,
        callbackParamName: "callback",
        load: (function(r, i) { _h(r, i, polygons, sr, callback, errback, dfd); }),
        error: (function(r) { _e(r, errback, dfd); })
      });
      return dfd;
    },

    _labelPointsHandler: function(response, io, polygons, sr, callback, errback, dfd) {
      try {
        
        var geoms = response.labelPoints,
            results = [];

        dojo.forEach(geoms,function(geom) {
          results.push(esri.geometry.fromJson(geom).setSpatialReference(sr));
        });
                              
        /*this.onLabelPointsComplete(results);
        if (callback) {
          callback(results);
        }*/
       
        this._successHandler([ results ], "onLabelPointsComplete", callback, dfd);
      }
      catch (err) {
        this._errorHandler(err, errback, dfd);
      }
    },

    onLabelPointsComplete: function() {
      //summary: Event fired when Geometry Service labelPoints completes
    },
    
    relation: function(/*esri.tasks.RelationParameters*/ params, /*Function?*/ callback, /*Function?*/ errback) {
          var _params = dojo.mixin(  {},
                                    this._url.query,
                                    { f:"json" },
                                    params.toJson()
                                  ),          
          _h = this._relationHandler,
          _e = this._errorHandler,
          dfd = new dojo.Deferred(esri._dfdCanceller);

      dfd._pendingDfd = esri.request({
        url: this._url.path + "/relation",
        content: _params,
        callbackParamName: "callback",
        load: (function(r, i) { _h(r, i, callback, errback, dfd); }),
        error: (function(r) { _e(r, errback, dfd); })
      });
      return dfd;
    },

    _relationHandler: function(response, io, callback, errback, dfd) {
      try {
        var relas = response.relations;  
             
        /*this.onRelationComplete(relas);
        if (callback) {
          callback(relas);
        }*/
       
        this._successHandler([ relas ], "onRelationComplete", callback, dfd);
      }
      catch (err) {
        this._errorHandler(err, errback, dfd);
      }
    },

    onRelationComplete: function() {
      //summary: Event fired when Geometry Service relation completes
    },
    
    trimExtend: function(/*esri.tasks.TrimExtendParameters*/ params, /*Function?*/ callback, /*Function?*/ errback) {
      //summary: This operation trims / extends each polyline specified in the input array, using the user specified guide polylines. 
      //When trimming features, the part to the left of the oriented cutting line is preserved in the output and the other part is discarded. 
      //An empty polyline is added to the output array if the corresponding input polyline is neither cut nor extended. 
      // params.polylines: esri.geometry.Polyline[]: array of polylines to trim extend to
      // params.trimExtendTo: esri.geometry.Polyline: A polyline which is used as a guide for trimming / extending input polylines.
      // params.extendHow:  esri.tasks.TrimExtendParameters.

      var _params = dojo.mixin( {},
                                this._url.query,
                                { f:"json" },
                                params.toJson()
                              ),
          outSR = params.sr,
          _h = this._trimExtendHandler,
          _e = this._errorHandler,
          dfd = new dojo.Deferred(esri._dfdCanceller);

      dfd._pendingDfd = esri.request({
        url: this._url.path + "/trimExtend",
        content: _params,
        callbackParamName: "callback",
        load: (function(r, i) { _h(r, i, outSR, callback, errback, dfd); }),
        error: (function(r) { _e(r, errback, dfd); })
      });
      return dfd;
    },

    _trimExtendHandler: function(response, io, outSR, callback, errback, dfd) {
      try {
        var Polyline = esri.geometry.Polyline,
            geoms = response.geometries,
            results = [];

        for (var i=0, il=geoms.length; i<il; i++) {
          results[i] = new Polyline({spatialReference:outSR, paths:geoms[i].paths});
        }

        /*this.onTrimExtendComplete(results);
        if (callback) {
          callback(results);
        }*/
       
        this._successHandler([ results ], "onTrimExtendComplete", callback, dfd);
      }
      catch (err) {
        this._errorHandler(err, errback, dfd);
      }
    },

    onTrimExtendComplete: function() {
      //summary: Event fired when Geometry Service TrimExtend completes
    },
    
    densify: function(/*esri.tasks.DensifyParameters*/ params, /*Function?*/ callback, /*Function?*/ errback) {
     
      var _params = dojo.mixin( {},
                                this._url.query,
                                { f:"json" },
                                params.toJson()
                              ),
          outSR = params.geometries[0].spatialReference,
          _h = this._densifyHandler,
          _e = this._errorHandler,
          dfd = new dojo.Deferred(esri._dfdCanceller);

      dfd._pendingDfd = esri.request({
        url: this._url.path + "/densify",
        content: _params,
        callbackParamName: "callback",
        load: (function(r, i) { _h(r, i, outSR, callback, errback, dfd); }),
        error: (function(r) { _e(r, errback, dfd); })
      });
      return dfd;
    },

    _densifyHandler: function(response, io, outSR, callback, errback, dfd) {
      try {
        var geoms = response.geometries,
            results = [];

        dojo.forEach(geoms,function(geom) {
          results.push(esri.geometry.fromJson(geom).setSpatialReference(outSR));
        });

        /*this.onDensifyComplete(results);
        if (callback) {
          callback(results);
        }*/
       
        this._successHandler([ results ], "onDensifyComplete", callback, dfd);
      }
      catch (err) {
        this._errorHandler(err, errback, dfd);
      }
    },

    onDensifyComplete: function() {
      //summary: Event fired when Geometry Service Densify completes
    },
    
    generalize: function(/*esri.tasks.GeneralizeParameters*/ params, /*Function?*/ callback, /*Function?*/ errback) {
     
      var _params = dojo.mixin( {},
                                this._url.query,
                                { f:"json" },
                                params.toJson()
                              ),
          outSR = params.geometries[0].spatialReference,
          _h = this._generalizeHandler,
          _e = this._errorHandler,
          dfd = new dojo.Deferred(esri._dfdCanceller);

      dfd._pendingDfd = esri.request({
        url: this._url.path + "/generalize",
        content: _params,
        callbackParamName: "callback",
        load: (function(r, i) { _h(r, i, outSR, callback, errback, dfd); }),
        error: (function(r) { _e(r, errback, dfd); })
      });
      return dfd;
    },

    _generalizeHandler: function(response, io, outSR, callback, errback, dfd) {
      try {
        var geoms = response.geometries,
            results = [];

        dojo.forEach(geoms,function(geom) {
          results.push(esri.geometry.fromJson(geom).setSpatialReference(outSR));
        });

        /*this.onGeneralizeComplete(results);
        if (callback) {
          callback(results);
        }*/
       
        this._successHandler([ results ], "onGeneralizeComplete", callback, dfd);
      }
      catch (err) {
        this._errorHandler(err, errback, dfd);
      }
    },

    onGeneralizeComplete: function() {
      //summary: Event fired when Geometry Service Generalize completes
    },
    
    offset: function(/*esri.tasks.OffsetParameters*/ params, /*Function?*/ callback, /*Function?*/ errback) {
     
      var _params = dojo.mixin( {},
                                this._url.query,
                                { f:"json" },
                                params.toJson()
                              ),
          outSR = params.geometries[0].spatialReference,
          _h = this._offsetHandler,
          _e = this._errorHandler,
          dfd = new dojo.Deferred(esri._dfdCanceller);

      dfd._pendingDfd = esri.request({
        url: this._url.path + "/offset",
        content: _params,
        callbackParamName: "callback",
        load: (function(r, i) { _h(r, i, outSR, callback, errback, dfd); }),
        error: (function(r) { _e(r, errback, dfd); })
      });
      return dfd;
    },

    _offsetHandler: function(response, io, outSR, callback, errback, dfd) {
      try {
        var geoms = response.geometries,
            results = [];

        dojo.forEach(geoms,function(geom) {
          results.push(esri.geometry.fromJson(geom).setSpatialReference(outSR));
        });

        /*this.onOffsetComplete(results);
        if (callback) {
          callback(results);
        }*/
       
        this._successHandler([ results ], "onOffsetComplete", callback, dfd);
      }
      catch (err) {
        this._errorHandler(err, errback, dfd);
      }
    },

    onOffsetComplete: function() {
      //summary: Event fired when Geometry Service Offset completes
    },
    
    distance: function(/*esri.tasks.DistanceParameters*/ params, /*Function?*/ callback, /*Function?*/ errback) {
     
      var _params = dojo.mixin( {},
                                this._url.query,
                                { f:"json" },
                                params.toJson()
                              ),
          outSR = params.geometry1.spatialReference,
          _h = this._distanceHandler,
          _e = this._errorHandler,
          dfd = new dojo.Deferred(esri._dfdCanceller);

      dfd._pendingDfd = esri.request({
        url: this._url.path + "/distance",
        content: _params,
        callbackParamName: "callback",
        load: (function(r, i) { _h(r, i, outSR, callback, errback, dfd); }),
        error: (function(r) { _e(r, errback, dfd); })
      });
      return dfd;
    },

    _distanceHandler: function(response, io, outSR, callback, errback, dfd) {
      try {
//        var geoms = response.geometries,
//            results = [];
//
//        dojo.forEach(geoms,function(geom) {
//          results.push(esri.geometry.fromJson(geom).setSpatialReference(outSR));
//        });

        response = response && response.distance;
        
        /*this.onDistanceComplete(response);
        if (callback) {
          callback(response);
        }*/
        
        this._successHandler([ response ], "onDistanceComplete", callback, dfd);
      }
      catch (err) {
        this._errorHandler(err, errback, dfd);
      }
    },

    onDistanceComplete: function() {
      //summary: Event fired when Geometry Service Offset completes
    }    
  }
);

dojo.declare("esri.tasks.TrimExtendParameters", null, {
    polylines: null,  // esri.geometry.Polyline[]
    trimExtendTo: null,  //esri.geometry.Polyline
    extendHow: null,
    
    toJson: function() {
      var geoms = dojo.map(this.polylines,function(geom){
        return geom.toJson();
      });

      var json = {};
          json.polylines = dojo.toJson(geoms);
          json.trimExtendTo = dojo.toJson(this.trimExtendTo.toJson());
          json.sr = dojo.toJson(this.polylines[0].spatialReference.toJson());
          json.extendHow = this.extendHow||0;
      return json;
    }
  }
);

dojo.mixin(esri.tasks.TrimExtendParameters, {
  DEFAULT_CURVE_EXTENSION: 0, RELOCATE_ENDS: 1, KEEP_END_ATTRIBUTES: 2, NO_END_ATTRIBUTES: 4, NO_EXTEND_AT_FROM: 8, NO_EXTEND_AT_TO: 16
});

dojo.declare("esri.tasks.BufferParameters", null, {
    // "esriSRUnitType" Constants
    // see http://edndoc.esri.com/arcobjects/9.2/ComponentHelp/esriGeometry/esriSRUnitType.htm
    // and http://edndoc.esri.com/arcobjects/9.2/ComponentHelp/esriGeometry/esriSRUnit2Type.htm 

    geometries: null,
    outSpatialReference: null,
    bufferSpatialReference: null,
    distances: null,
    unit: null,
    unionResults: false,
    geodesic: false,
    
    toJson: function() {
      var json = { unit:this.unit, unionResults: this.unionResults, geodesic:this.geodesic },         
          dt = this.distances,
          outsr = this.outSpatialReference,
          bufsr = this.bufferSpatialReference;
          
      
      var geoms = dojo.map(this.geometries, function(geom){
        geom = (geom.type === "extent") ? this._extentToPolygon(geom) : geom;
        return geom.toJson();
      }, this);
                                 
      var geometries = this.geometries;      
      if (geometries && geometries.length > 0) {        
        var geomType =  geometries[0].type === "extent" ? "esriGeometryPolygon" : esri.geometry.getJsonType(geometries[0]);
        json.geometries = dojo.toJson({ geometryType:geomType, geometries:geoms });
        json.inSR = geometries[0].spatialReference.wkid ? geometries[0].spatialReference.wkid : dojo.toJson(geometries[0].spatialReference.toJson());
      }
      
      if (dt) {
        json.distances = dt.join(",");
      }
      
      if (outsr) {
        json.outSR = outsr.wkid ? outsr.wkid : dojo.toJson(outsr.toJson());
      }
      
      if (bufsr) {
        json.bufferSR = bufsr.wkid ? bufsr.wkid : dojo.toJson(bufsr.toJson());
      }
      
      return json;
    },
    
    _extentToPolygon: function(extent) {    
        var xmin = extent.xmin, ymin = extent.ymin, xmax = extent.xmax, ymax = extent.ymax;
        return new esri.geometry.Polygon({
            "rings": [
                [ [ xmin, ymin ], [ xmin, ymax ], [ xmax, ymax ], [ xmax, ymin ], [ xmin, ymin ] ]
            ],
            "spatialReference": extent.spatialReference.toJson()
        });
     }
  }
);

dojo.mixin(esri.tasks.GeometryService, {
  UNIT_METER: 9001, UNIT_GERMAN_METER: 9031, UNIT_FOOT: 9002, UNIT_SURVEY_FOOT: 9003, UNIT_CLARKE_FOOT: 9005, UNIT_FATHOM: 9014, UNIT_NAUTICAL_MILE: 9030,
  UNIT_SURVEY_CHAIN: 9033, UNIT_SURVEY_LINK: 9034, UNIT_SURVEY_MILE: 9035, UNIT_KILOMETER: 9036, UNIT_CLARKE_YARD: 9037, UNIT_CLARKE_CHAIN: 9038,
  UNIT_CLARKE_LINK: 9039, UNIT_SEARS_YARD: 9040, UNIT_SEARS_FOOT: 9041, UNIT_SEARS_CHAIN: 9042, UNIT_SEARS_LINK: 9043, UNIT_BENOIT_1895A_YARD: 9050,
  UNIT_BENOIT_1895A_FOOT: 9051, UNIT_BENOIT_1895A_CHAIN: 9052, UNIT_BENOIT_1895A_LINK: 9053, UNIT_BENOIT_1895B_YARD: 9060, UNIT_BENOIT_1895B_FOOT: 9061,
  UNIT_BENOIT_1895B_CHAIN: 9062, UNIT_BENOIT_1895B_LINK: 9063, UNIT_INDIAN_FOOT: 9080, UNIT_INDIAN_1937_FOOT: 9081, UNIT_INDIAN_1962_FOOT: 9082,
  UNIT_INDIAN_1975_FOOT: 9083, UNIT_INDIAN_YARD: 9084, UNIT_INDIAN_1937_YARD: 9085, UNIT_INDIAN_1962_YARD: 9086, UNIT_INDIAN_1975_YARD: 9087,
  UNIT_FOOT_1865: 9070, UNIT_RADIAN: 9101, UNIT_DEGREE: 9102, UNIT_ARCMINUTE: 9103, UNIT_ARCSECOND: 9104, UNIT_GRAD: 9105, UNIT_GON: 9106, UNIT_MICRORADIAN: 9109,
  UNIT_ARCMINUTE_CENTESIMAL: 9112, UNIT_ARCSECOND_CENTESIMAL: 9113, UNIT_MIL6400: 9114, UNIT_BRITISH_1936_FOOT: 9095, UNIT_GOLDCOAST_FOOT: 9094,
  UNIT_INTERNATIONAL_CHAIN: 109003, UNIT_INTERNATIONAL_LINK: 109004, UNIT_INTERNATIONAL_YARD: 109001, UNIT_STATUTE_MILE: 9093, UNIT_SURVEY_YARD: 109002,
  UNIT_50KILOMETER_LENGTH: 109030, UNIT_150KILOMETER_LENGTH: 109031, UNIT_DECIMETER: 109005, UNIT_CENTIMETER: 109006, UNIT_MILLIMETER: 109007,
  UNIT_INTERNATIONAL_INCH: 109008, UNIT_US_SURVEY_INCH: 109009, UNIT_INTERNATIONAL_ROD: 109010, UNIT_US_SURVEY_ROD: 109011, UNIT_US_NAUTICAL_MILE: 109012, UNIT_UK_NAUTICAL_MILE: 109013,
  UNIT_SQUARE_INCHES: "esriSquareInches",UNIT_SQUARE_FEET: "esriSquareFeet",UNIT_SQUARE_YARDS: "esriSquareYards",UNIT_ACRES: "esriAcres",UNIT_SQUARE_MILES: "esriSquareMiles",
  UNIT_SQUARE_MILLIMETERS: "esriSquareMillimeters",UNIT_SQUARE_CENTIMETERS: "esriSquareCentimeters",UNIT_SQUARE_DECIMETERS: "esriSquareDecimeters",UNIT_SQUARE_METERS: "esriSquareMeters",
  UNIT_ARES: "esriAres",UNIT_HECTARES: "esriHectares",UNIT_SQUARE_KILOMETERS: "esriSquareKilometers"
});

dojo.declare("esri.tasks.AreasAndLengthsParameters", null, {
    polygons: null,  // esri.geometry.Polygon[]
    lengthUnit: null, 
    areaUnit: null,
    calculationType: null,
    
    toJson: function() {
      var geoms = dojo.map(this.polygons, function(geom){
        return geom.toJson();
      });

      var json = {};
          json.polygons = dojo.toJson(geoms);          
          var outSr = this.polygons[0].spatialReference;
          json.sr = outSr.wkid ? outSr.wkid : dojo.toJson(outSr.toJson());
          
          if (this.lengthUnit) {
              json.lengthUnit = this.lengthUnit;
          }
          
          if (this.areaUnit) {
            if (dojo.isString(this.areaUnit)) {
              json.areaUnit = dojo.toJson({"areaUnit":this.areaUnit});              
            } else {
              json.areaUnit = this.areaUnit;
            }
          }
          
          if (this.calculationType) {
            json.calculationType = this.calculationType;
          }
      return json;
    }
  }
);

dojo.declare("esri.tasks.LengthsParameters", null, {
    polylines: null,  // esri.geometry.Polyline[]
    lengthUnit: null, 
    geodesic: null,
    calculationType: null,
    
    toJson: function() {
      var geoms = dojo.map(this.polylines, function(geom){
        return geom.toJson();
      });

      var json = {};
          json.polylines = dojo.toJson(geoms);          
          var outSr = this.polylines[0].spatialReference;
          json.sr = outSr.wkid ? outSr.wkid : dojo.toJson(outSr.toJson());
          
          if (this.lengthUnit) {
              json.lengthUnit = this.lengthUnit;
          }
          
          if (this.geodesic) {
              json.geodesic = this.geodesic;
          }
          
          if (this.calculationType) {
              json.calculationType = this.calculationType;
          }
      return json;
    }
  }
);

dojo.declare("esri.tasks.RelationParameters", null, {
    geometries1: null,  // esri.geometry.Geometry[]
    geometries2: null,  // esri.geometry.Geometry[]
    relation: null, 
    relationParam: null,
    
    toJson: function() {
      var geoms1 = dojo.map(this.geometries1, function(geom){
        return geom.toJson();
      });
      
      var geoms2 = dojo.map(this.geometries2, function(geom){
        return geom.toJson();
      });

      var json = {};
          
          var geometries1 = this.geometries1;
          if (geometries1 && geometries1.length > 0) {
              json.geometries1 = dojo.toJson({ geometryType:esri.geometry.getJsonType(geometries1[0]), geometries:geoms1 });
              var outSr = this.geometries1[0].spatialReference;
              json.sr = outSr.wkid ? outSr.wkid : dojo.toJson(outSr.toJson());
          }
          
          var geometries2 = this.geometries2;
          if (geometries2 && geometries2.length > 0) {
              json.geometries2 = dojo.toJson({ geometryType:esri.geometry.getJsonType(geometries2[0]), geometries:geoms2 });              
          }
                                                                  
          if (this.relation) {
              json.relation = this.relation;
          }
          
          if (this.relationParam) {
              json.relationParam = dojo.toJson(this.relationParam);
          }
      return json;
    }
  }
);

dojo.mixin(esri.tasks.RelationParameters, {
  SPATIAL_REL_CROSS: "esriGeometryRelationCross", SPATIAL_REL_DISJOINT: "esriGeometryRelationDisjoint", SPATIAL_REL_IN: "esriGeometryRelationIn",
  SPATIAL_REL_INTERIORINTERSECTION: "esriGeometryRelationInteriorIntersection", SPATIAL_REL_INTERSECTION: "esriGeometryRelationIntersection", SPATIAL_REL_COINCIDENCE: "esriGeometryRelationLineCoincidence", 
  SPATIAL_REL_LINETOUCH: "esriGeometryRelationLineTouch", SPATIAL_REL_OVERLAP: "esriGeometryRelationOverlap", SPATIAL_REL_POINTTOUCH: "esriGeometryRelationPointTouch",
  SPATIAL_REL_TOUCH: "esriGeometryRelationTouch", SPATIAL_REL_WITHIN: "esriGeometryRelationWithin", SPATIAL_REL_RELATION: "esriGeometryRelationRelation"
});

dojo.declare("esri.tasks.DensifyParameters", null, {
    geometries: null,  // esri.geometry.Geometry[]
    geodesic: null,
    lengthUnit: null, 
    maxSegmentLength: null,
    
    toJson: function() {
      var geoms = dojo.map(this.geometries, function(geom) {
        return geom.toJson();
      });
            
      var json = {};
          
          if (this.geometries && this.geometries.length > 0) {
              json.geometries = dojo.toJson({ geometryType:esri.geometry.getJsonType(this.geometries[0]), geometries:geoms });
              json.sr = dojo.toJson(this.geometries[0].spatialReference.toJson());
          }
          
          if (this.geodesic) {
              json.geodesic = this.geodesic;
          }
          
          if (this.lengthUnit) {
              json.lengthUnit = this.lengthUnit;
          }
          
          if (this.maxSegmentLength) {
              json.maxSegmentLength = this.maxSegmentLength;
          }
      return json;
    }
  }
);

dojo.declare("esri.tasks.GeneralizeParameters", null, {
    geometries: null,  // esri.geometry.Geometry[]
    deviationUnit: null,
    maxDeviation: null, 
        
    toJson: function() {
      var geoms = dojo.map(this.geometries, function(geom){
        return geom.toJson();
      });
            
      var json = {};
          if (this.geometries && this.geometries.length > 0) {
              json.geometries = dojo.toJson({ geometryType:esri.geometry.getJsonType(this.geometries[0]), geometries:geoms });
              json.sr = dojo.toJson(this.geometries[0].spatialReference.toJson());
          }
          
          if (this.deviationUnit) {
              json.deviationUnit = this.deviationUnit;
          }
          
          if (this.maxDeviation) {
              json.maxDeviation = this.maxDeviation;
          }                      
      return json;
    }
  }
);

dojo.declare("esri.tasks.OffsetParameters", null, {
    geometries: null,  // esri.geometry.Geometry[]
    bevelRatio: null,
    offsetDistance: null,
    offsetHow:null,
    offsetUnit:null, 
        
    toJson: function() {
      var geoms = dojo.map(this.geometries, function(geom){
        return geom.toJson();
      });
            
      var json = {};
          if (this.geometries && this.geometries.length > 0) {
              json.geometries = dojo.toJson({ geometryType:esri.geometry.getJsonType(this.geometries[0]), geometries:geoms });
              json.sr = dojo.toJson(this.geometries[0].spatialReference.toJson());
          }
          
          if (this.bevelRatio) {
              json.bevelRatio = this.bevelRatio;
          }
          
          if (this.offsetDistance) {
              json.offsetDistance = this.offsetDistance;
          }    
          
          if (this.offsetHow) {
              json.offsetHow = this.offsetHow;
          }
          
          if (this.offsetUnit) {
              json.offsetUnit = this.offsetUnit;
          }  
      return json;
    }
  }
);

dojo.mixin(esri.tasks.OffsetParameters, {
  OFFSET_BEVELLED: "esriGeometryOffsetBevelled", 
  OFFSET_MITERED: "esriGeometryOffsetMitered", 
  OFFSET_ROUNDED:"esriGeometryOffsetRounded"
});

dojo.declare("esri.tasks.DistanceParameters", null, {
    geometry1: null,  // esri.geometry.Geometry
    geometry2: null,  // esri.geometry.Geometry
    distanceUnit: null,
    geodesic: null,
           
    toJson: function() {
                 
      var json = {};
          
          var geometry1 = this.geometry1;
          if (geometry1) {
              json.geometry1 = dojo.toJson({ geometryType:esri.geometry.getJsonType(geometry1), geometry:geometry1 });              
          }
          
         var geometry2 = this.geometry2;
          if (geometry2) {
              json.geometry2 = dojo.toJson({ geometryType:esri.geometry.getJsonType(geometry2), geometry:geometry2 });              
          }
                    
          json.sr = dojo.toJson(this.geometry1.spatialReference.toJson());
          
          if (this.distanceUnit) {
              json.distanceUnit = this.distanceUnit;
          }
          if (this.geodesic) {
              json.geodesic = this.geodesic;                       
          }
      return json;
    }
  }
);

dojo.declare("esri.tasks.ProjectParameters", null, {
    geometries: null,
    outSR: null,
    transformation: null,
    transformationForward: null,

    toJson: function() {
      var geoms = dojo.map(this.geometries, function(geom){
        return geom.toJson();
      });

      var json = {};
      json.outSR = this.outSR.wkid || dojo.toJson(this.outSR.toJson());
      json.inSR = this.geometries[0].spatialReference.wkid || dojo.toJson(this.geometries[0].spatialReference.toJson());
      json.geometries = dojo.toJson({ geometryType:esri.geometry.getJsonType(this.geometries[0]), geometries:geoms });
      if (this.transformation) {
        json.transformation = this.transformation.wkid || dojo.toJson(this.transformation);
      }
      if (this.tranformationForward) {
        json.transformationForward = this.transformationForward;
      }
      return json;
    }
  }
);

});
