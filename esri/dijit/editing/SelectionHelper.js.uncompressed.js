//>>built
// wrapped by build app
define("esri/dijit/editing/SelectionHelper", ["dijit","dojo","dojox"], function(dijit,dojo,dojox){
dojo.provide("esri.dijit.editing.SelectionHelper");
dojo.declare("esri.dijit.editing.SelectionHelper", null, {
    constructor: function(settings) {
        this._settings = settings || {};
        this._sConnects = [];
        this._mapServiceCount = 0;
        this._map = this._settings.map;
        this._tolerance = this._settings.singleSelectionTolerance;
        this._initMapServiceInfos(this._settings.layers);
    },

    destroy: function(){
        for(var connect in this._sConnects){
            if (this._sConnects.hasOwnProperty(connect)){
                dojo.disconnect(this._sConnects[connect]);
            }
        }
    },

    selectFeatures : function(layers, query, selectionMethod, callback) {
        // Reset if doing a new selection
        if (selectionMethod === esri.layers.FeatureLayer.SELECTION_NEW){
            this._resetMapServiceInfos();
            this.getSelection(layers);
        }
        
        // Select features across layers
        var deferreds = [];
        dojo.forEach(layers,function(layer) {
          if (layer.visible === true && layer._isMapAtVisibleScale() === true){
              var selMethod = selectionMethod;
              if (layer._isSelOnly && selMethod === esri.layers.FeatureLayer.SELECTION_NEW){
                  selMethod = esri.layers.FeatureLayer.SELECTION_ADD;
              }
              deferreds.push(layer.selectFeatures(query, selMethod));
          }
        });
        var deferredsList = new dojo.DeferredList(deferreds);
        deferredsList.addCallback(dojo.hitch(this, function(response) {
          var features = [];
          dojo.forEach(response, function(set, idx) {
              dojo.forEach(set[1], function(feature) {
                var objectId = feature.attributes[layers[idx].objectIdField];
                feature = layers[idx]._mode._getFeature(objectId) || null;
                if (feature){
                    features.push(feature);
                }
              }, this);
          }, this);

          if (!this._mapServiceCount){
              callback(features);
              return;
          }
          
          // Create layer definitions
          var subtract = selectionMethod === esri.layers.FeatureLayer.SELECTION_SUBTRACT;
          if (subtract){
              this._resetMapServiceInfos();
              this._createLayerDefs(this._getLayerInfosFromSelection(layers));
          } else {
              this._createLayerDefs(this._getLayerInfosFromFeatures(features));
          }
          //Update layerDefs (for selection only layers)
          this._updateLayerDefs(this._mapServiceInfos, false, !((features && features.length) || subtract), dojo.hitch(this, callback, features));
        }));
    },

    selectFeaturesByGeometry : function(layers, geometry, selectionMethod, callback) {
        var selGeom = geometry;
        if (geometry.declaredClass.indexOf("Extent") !== -1){
          if (geometry.xmax == geometry.xmin && geometry.ymax == geometry.ymin){
              selGeom = new esri.geometry.Point(geometry.xmax, geometry.ymax);
          }
        }
        selGeom = (selGeom.declaredClass.indexOf("Point") !== -1) ? this._extentFromPoint(selGeom) : selGeom;
        var query = new esri.tasks.Query();
        query.geometry = selGeom;
        this.selectFeatures(layers, query, selectionMethod, callback);
    },

    clearSelection: function(doNotRefresh) {
        var nonSelOnlyLayers = this._nonSelOnlyLayers;
        dojo.forEach(nonSelOnlyLayers, 'if (item.clearSelection){ item.clearSelection(); }');
        if (!this._mapServiceCount){ return; }
        this._resetMapServiceInfos();
        var lInfos = this._getLayerInfosFromSelection(this._settings.layers);
        var selection = dojo.some(lInfos, 'return item.oids && item.oids.length');
        if (selection){
            this._createLayerDefs(lInfos);
            this._updateLayerDefs(this._mapServiceInfos, true, doNotRefresh || false);
        }
    },

    findMapService: function (layer) {
        var map = this._map;
        var layerIds = map.layerIds;
        var layerUrl = (layer && layer._url) ? layer._url.path.toLowerCase() : "";
        var mapService;
        for (var layerId in layerIds) {
            if (layerIds.hasOwnProperty(layerId)){
                mapService = map.getLayer(layerIds[layerId]);
                var tstUrl = mapService._url ? mapService._url.path.toLowerCase().replace("mapserver", "featureserver") : "";
                if (layerUrl.substr(0, tstUrl.length) === tstUrl && mapService.declaredClass === "esri.layers.ArcGISDynamicMapServiceLayer") {
                    return mapService;
                }
            }
        }
    },
    
    getSelection: function(layers){
        var layerInfos = [];
        dojo.forEach(layers, function(layer){ if (layer._isSelOnly){ layerInfos.push(this._createLayerInfo(layer)); }}, this);
        dojo.forEach(layerInfos, function(layerInfo){
            var mapServiceInfo = this._createMapServiceInfo(this.findMapService(layerInfo.layer));
            if (mapServiceInfo){ mapServiceInfo.layerInfos[layerInfo.layer.layerId] = layerInfo; }
        }, this);
    },

    //// Internal Methods
    _initMapServiceInfos: function(layers) {
        this._nonSelOnlyLayers = [];
        this._mapServiceInfos  = [];
         dojo.forEach(layers, function(layer){ 
           var mapServiceInfo = this.findMapService(layer);
           if (mapServiceInfo){
               this._mapServiceCount++;
               this._createMapServiceInfo(mapServiceInfo);
               if (mapServiceInfo){ mapServiceInfo.setDisableClientCaching(true); }
           } else {
               this._nonSelOnlyLayers.push(layer);
           }
         }, this);
    },

    _createMapServiceInfo: function(mapService){
        if (!mapService){ return null; }
        var mapServiceInfos = this._mapServiceInfos;
        var mapServiceInfo = mapServiceInfos[mapService.id];
        if (!mapServiceInfo) {
            mapServiceInfo = mapServiceInfos[mapService.id] = { mapService: mapService, layerInfos:[], layerDefs: dojo.mixin([], mapService.layerDefinitions || []), origLayerDefs: dojo.mixin([], mapService.layerDefinitions || []) };
        }
        return mapServiceInfo;
    },

    _resetMapServiceInfo: function(mapServiceInfo){
        dojo.forEach(mapServiceInfo.layerInfos, this._resetLayerInfo);
        mapServiceInfo.layerDefs = dojo.mixin([], mapServiceInfo.origLayerDefs || []);
    },
    
    _resetMapServiceInfos: function() {
          var mapServiceInfos = this._mapServiceInfos;
          for (var mapServiceInfo in mapServiceInfos){
              if (mapServiceInfos.hasOwnProperty(mapServiceInfo)){
                  this._resetMapServiceInfo(mapServiceInfos[mapServiceInfo]);
              }
          }
    },

    _createLayerInfo: function(layer, doNotSelect){
        var oidField = layer.objectIdField;
        var features = doNotSelect ? [] : layer.getSelectedFeatures();
        return { layer: layer, selectedFeatures: features || [], oids: dojo.map(features, function(feature){ return feature.attributes[oidField]; }) };
    },

    _resetLayerInfo: function(layerInfo){
        if (!layerInfo){ return; }
        layerInfo.selectedFeatures = [];
        layerInfo.oids = [];
    },

    _updateLayerDefs: function(mapServiceInfos, resetLayerDefs, doNotRefresh, callback){
        for (var mapServiceId in mapServiceInfos){
            if (mapServiceInfos.hasOwnProperty(mapServiceId)){
                var mapServiceInfo = mapServiceInfos[mapServiceId];
                var mapService = mapServiceInfo.mapService;
                var layerDefs = mapServiceInfo.layerDefs = (resetLayerDefs ? dojo.mixin([], mapServiceInfo.origLayerDefs || []) : mapServiceInfo.layerDefs);
                if (layerDefs){
                    if (!doNotRefresh){
                        this._sConnects[mapService.id] = (dojo.connect(mapService, "onUpdateEnd", dojo.hitch(this, "_onMapServiceUpdate", mapServiceInfo, resetLayerDefs, callback)));
                    } else if (callback) { 
                        callback(); 
                    }
                    mapService.setLayerDefinitions(layerDefs, doNotRefresh || false);
                } else if (callback){
                    callback();
                }
            }
        }
    },

    _onMapServiceUpdate: function(mapServiceInfo, resetLayerDefs, callback){
        dojo.disconnect(this._sConnects[mapServiceInfo.mapService.id]);
        dojo.forEach(mapServiceInfo.layerInfos, function(layerInfo){
          if (resetLayerDefs){
            if (layerInfo){ layerInfo.layer.clearSelection(); }
          } else {
            var query = new esri.tasks.Query();
            query.objectIds = layerInfo ? layerInfo.oids : [];
            if (query.objectIds.length){
                layerInfo.layer.selectFeatures(query, esri.layers.FeatureLayer.SELECTION_SUBTRACT);
            }
          }
        }, this);
        if (resetLayerDefs){
          this._resetMapServiceInfo(mapServiceInfo);
        }
        if (callback){
          callback();
        }
    },

    _createLayerDefs: function(layerInfos){
        dojo.forEach(layerInfos, function(layerInfo){
            var layer = layerInfo.layer;
            var mapServiceInfo = this._createMapServiceInfo(this.findMapService(layerInfo.layer));
            if (!mapServiceInfo){ return; }
            var mapService = mapServiceInfo.mapService;
            var layerDefs = mapServiceInfo.layerDefs;
            var oidFld = layer.objectIdField;
            var layerId = layer.layerId;
            var layerDef = "(\"" + oidFld +  "\" NOT IN (";
            var oids = layerInfo.oids;
            if (oids && oids.length){
                dojo.forEach(layerInfo.oids, function(oid, idx){ oids = true; if (idx) { layerDef += ','; } layerDef += "'" + oid + "'"; });
                layerDef += "))";
                if (layerDefs.length && (layerDefs[layerId] && layerDefs[layerId].length)){
                    layerDefs[layerId] += " AND" + layerDef;
                } else {
                    layerDefs[layerId] = layerDef;
                }
          }
            
        }, this);
    },

    _getLayerInfosFromFeatures: function(features) {
        var layers = [];
        dojo.forEach(features, function(feature){
            var layer = feature.getLayer();
            if (layer && layer._isSelOnly){
                if (!layers[layer.id]) { layers[layer.id] = this._createLayerInfo(layer, true); }
                layers[layer.id].selectedFeatures.push(feature);
                layers[layer.id].oids.push(feature.attributes[layer.objectIdField]);
            }
        }, this);
        var layerInfos = [];
        for (var layerId in layers){
          if (layers.hasOwnProperty(layerId)){
            layerInfos.push(layers[layerId]);
          }
        }
        return layerInfos;
      },
      
      _getLayerInfosFromSelection: function(layers) {
        var layerInfos = [];
        dojo.forEach(layers, function(layer){
            if (layer._isSelOnly){
              layerInfos.push(this._createLayerInfo(layer, false));
            }
        }, this);
        return layerInfos;
      },

    _extentFromPoint : function(geometry){
        var tolerance = this._tolerance;
        var map = this._map;
        //Get a screen point representing the selection point to apply the tolerance on
        var scrPnt = map.toScreen(geometry);

        //Calculate new extent to be passed to the server
        var pnt1 = new esri.geometry.Point(scrPnt.x - tolerance, scrPnt.y + tolerance);
        var pnt2 = new esri.geometry.Point(scrPnt.x + tolerance, scrPnt.y - tolerance);

        //Convert the points back into map points
        var mapPnt1 = map.toMap(pnt1);
        var mapPnt2 = map.toMap(pnt2);

        //Calculate the extent used for querying
        return new esri.geometry.Extent(mapPnt1.x, mapPnt1.y, mapPnt2.x, mapPnt2.y, map.spatialReference);
    }
});

});
