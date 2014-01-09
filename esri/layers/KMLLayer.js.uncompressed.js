//>>built
// wrapped by build app
define("esri/layers/KMLLayer", ["dijit","dojo","dojox","dojo/require!esri/utils,esri/layers/layer,esri/layers/MapImageLayer,esri/layers/FeatureLayer,esri/dijit/Popup"], function(dijit,dojo,dojox){
dojo.provide("esri.layers.KMLLayer");

dojo.require("esri.utils");
dojo.require("esri.layers.layer");
dojo.require("esri.layers.MapImageLayer");
dojo.require("esri.layers.FeatureLayer");
dojo.require("esri.dijit.Popup");

// TODO
// JSON format notes: http://mediawikidev.esri.com/index.php/JSAPI/version2.4/kml
//   - featureInfo.type as enum instead of string
//   - add kmlId to common properties
//
// Should we rename "visibility" everywhere to "initialVisibility"
// or "defaultVisibility"?

dojo.declare("esri.layers.KMLLayer", [ esri.layers.Layer ], {

  //serviceUrl: "http://flash3:8080/gw-core/kml",
  //serviceUrl: "http://dev.arcgis.com/sharing/kml",
  serviceUrl: "http://utility.arcgis.com/sharing/kml",
  
  constructor: function(url, options) {
    if (!url) {
      console.log("KMLLayer:constructor - please provide url for the KML file");
    }
    
    /*if (options && options.outSR) {
      this._outSR = options.outSR;  
      this._outSR = (this._outSR) ? this._outSR.wkid : null;  //kml service only supports wkid numbers now
    }*/
    
    this._outSR = (options && options.outSR) || new esri.SpatialReference({ wkid: 4326 });
    this._options = options;

    if (esri.config.defaults.kmlService) {
      this.serviceUrl = esri.config.defaults.kmlService;
    }
    
    // TODO
    // For testing only:
    // 1. I have this only to support test scenario in test-kml-layer.html
    // 2. Remove/comment this when checking in
    /*if (!dojo.isString(url)) { // by value
      this._initLayer(url);
      return;
    }*/

    var link = (this.linkInfo = options && options.linkInfo);
    if (link) {
      this.visible = !!link.visibility;
      
      // Why should we prevent loading if viewFormat is defined?
      // Presence of viewFormat indicates the link needs map extent or center
      // So, loading the layer before map is available is moot.
      // The parent layer of this link will trigger loading of this layer
      // when it gets reference to the map. See _addInternalLayers
      this._waitingForMap = !!link.viewFormat;
    }

    // If NetworkLink:
    //   - Do not parse document if initial visibility is 0
    if (!link || (link && link.visibility && !this._waitingForMap)) {
      this._parseKml();
    }
    
    this.refresh = dojo.hitch(this, this.refresh);
   
    // TODO
    // For testing: remove setTimeout later
    /*var self = this;
    setTimeout(function() {
      self._initLayer(window.kmlJson);
    }, 0);*/
  },
  
  /*****************
   * Public Methods
   *****************/
  
  getFeature: function(/*Object*/ featureInfo) {
    if (!featureInfo) {
      return;
    }
    
    var type = featureInfo.type, id = featureInfo.id,
        feature, i, len;
    
    switch (type) {
      case "esriGeometryPoint":
      case "esriGeometryPolyline":
      case "esriGeometryPolygon":
        var layer = this["_" + type];
        if (layer) {
          //feature = this._getGraphic(layer, id);
          feature = dojo.getObject("_mode._featureMap." + id, false, layer);
        }
        break;
        
      case "GroundOverlay":
        var groundLyr = this._groundLyr;
        
        if (groundLyr) {
          // TODO
          // Can cache this
          var grounds = groundLyr.getImages();
          len = grounds.length;
          
          for (i = 0; i < len; i++) {
            if (grounds[i].id === id) {
              feature = grounds[i];
              break;
            }
          }
        }
        break;
        
      case "ScreenOverlay":
        // TODO
        break;
        
      case "NetworkLink":
        // Read from this._links and return a reference to KMLLayer
        // that represents the given network link
        //console.log('nl',this._links);
        dojo.some(this._links, function(link) {
          if(link.linkInfo && link.linkInfo.id === id) {
            feature = link;
            return true;
          } else {
            return false;
          }
        });
        break;
        
      case "Folder":
        var folders = this.folders;
        len = folders ? folders.length : 0;
        
        for (i = 0; i < len; i++) {
          if (folders[i].id === id) {
            feature = folders[i];
            break;
          }
        }
        break;
        
      default:
        console.log("KMLLayer:getFeature - unknown feature type");
        break;
    }
    
    return feature;
  },
  
  getLayers: function() {
    // Returns internal layers created by this KMLLayer instance
    
    var retVal = [];
    
    if (this._groundLyr) {
      retVal.push(this._groundLyr);
    }
    
    if (this._fLayers) {
      retVal = retVal.concat(this._fLayers);
    }

    if (this._links) {
      dojo.forEach(this._links, function(link) {
        if (link.declaredClass) {
          retVal.push(link);
        }
      });
    }
    
    return retVal;
  },
  
  setFolderVisibility: function(/*KMLFolder*/ folder, /*Boolean*/ isVisible) {
    // Implements the behavior required for ArcGIS.com use-case.
    // This method is to be called whenever user changes the state of 
    // the check-box next to each folder in this layer
    
    if (!folder) {
      return;
    }
    
    this._fireUpdateStart();
    
    // Update the current state of this folder.
    folder.visible = isVisible;

    if (isVisible) {
      // Let's check that this folder is "really" visible based on
      // the visibility of its ancestors
      
      /*var parents = this._getParentFolders(folder, []);
      //console.log(parents);
      
      if (parents.length > 0) {
        isVisible = dojo.every(parents, function(parent){
          return parent.visible;
        });
      }*/
     
      isVisible = this._areLocalAncestorsVisible(folder);
    }

    this._setState(folder, isVisible);
    this._fireUpdateEnd();
  },
  
  onRefresh: function() {},
    
  /*******************
   * Internal Methods
   *******************/
  
  _parseKml: function(map) {
    var self = this;

    this._fireUpdateStart();
    
    // Send viewFormat as necessary if this kml layer represents a
    // network link i.e., in the constructor options.linkInfo is
    // available and linkInfo has viewFormat property
    this._io = esri.request({
      url: this.serviceUrl,
      content: {
        url: this._url.path + this._getQueryParameters(map),
        model: "simple",
        folders: "",
        refresh: this.loaded ? true : undefined, // prompt the servlet to ignore its internal cache and fetch the KML from its source
        outSR: dojo.toJson(this._outSR.toJson())
      },
      callbackParamName: "callback",
      
      load: function(response) {
        self._io = null;
        
        //console.log("Response: ", response);
        //self._initLayer(window.sampleKmlJson);
        self._initLayer(response);
      },
      
      error: function(err) {
        self._io = null;
        
        err = dojo.mixin(new Error(), err);
        err.message = "Unable to load KML: " + self.url + " " + (err.message || "");
        
        //console.error("Error: ", err);
        self._fireUpdateEnd(err);
        self.onError(err);
      }
    });
  },
  
  _initLayer: function(json) {
    
    // Are we here on layer refresh?
    if (this.loaded) {
      // clear current state of this layer
      this._removeInternalLayers();
      
      // go on and (re)init this layer with latest contents of the kml file
    }
    
    // TODO
    // The following four properties should be removed. They were added to
    // the JSON spec under the assumption that a KML file can have one only 
    // one top-level Document element. This is not true, a file can have
    // a Document element in multiple places. See this file:
    // http://code.google.com/apis/kml/documentation/KML_Samples.kml
    this.name = json.name;
    this.description = json.description;
    this.snippet = json.snippet;
    this.visibility = json.visibility;
    
    this.featureInfos = json.featureInfos;
    
    // TODO
    // Handle screen overlays
    
    var i, len;
    
    // Folders
    var folders = (this.folders = json.folders), rootFolders = [], fldr;
    if (folders) {
      len = folders.length;
      
      for (i = 0; i < len; i++) {
        fldr = (folders[i] = new esri.layers.KMLFolder(folders[i]));
        
        if (fldr.parentFolderId === -1) {
          rootFolders.push(fldr);
        }
      }
    }
    
    // Process network links, if any
    var links = (this._links = json.networkLinks),
        options;
        
    len = links ? links.length : 0;
    for (i = 0; i < len; i++) {
      //console.log("Link id: " + links[i].id);

      // Region not supported
      if (links[i].viewRefreshMode && links[i].viewRefreshMode.toLowerCase().indexOf("onregion") !== -1) {
        continue;
      }
      
      options = dojo.mixin({}, this._options);
      options.linkInfo = links[i];
      
      if (options.id) {
        options.id = options.id + "_" + i;
      }
      
      links[i] = new esri.layers.KMLLayer(links[i].href, options);
      
      links[i]._parentLayer = this;
      links[i]._parentFolderId = this._getLinkParentId(links[i].linkInfo.id);
    }
    
    // Create internal map image layer to draw ground overlays
    var groundOverlays = json.groundOverlays;
    
    if (groundOverlays && groundOverlays.length > 0) {
      options = dojo.mixin({}, this._options);
      
      if (options.id) {
        options.id = options.id + "_" + "mapImage";
      }
      
      var mapImageLayer = (this._groundLyr = new esri.layers.MapImageLayer(options));
      
      len = groundOverlays.length;
      for (i = 0; i < len; i++) {
        mapImageLayer.addImage(new esri.layers.KMLGroundOverlay(groundOverlays[i]));
      }
    }

    // Create internal feature layers to draw placemarks
    var colletionLayers = dojo.getObject("featureCollection.layers", false, json);
    
    if (colletionLayers && colletionLayers.length > 0) {
      this._fLayers = [];
      
      dojo.forEach(colletionLayers, function(layerSpec, i) {
        var features = dojo.getObject("featureSet.features", false, layerSpec),
            layer;
        
        if (features && features.length > 0) {
          // Fix this issue in KmlServlet and remove this
          // code
          /*if (esri._isDefined(features[0].geometry.x)) {
            layerSpec.featureSet.geometryType = "esriGeometryPoint";
            layerSpec.layerDefinition.drawingInfo.renderer = this._defaultPointRenderer;
          }
          else if (esri._isDefined(features[0].geometry.paths)) {
            layerSpec.featureSet.geometryType = "esriGeometryPolyline";
            layerSpec.layerDefinition.drawingInfo.renderer = this._defaultPolylineRenderer;
          }
          else if (esri._isDefined(features[0].geometry.rings)) {
            layerSpec.featureSet.geometryType = "esriGeometryPolygon";
            layerSpec.layerDefinition.drawingInfo.renderer = this._defaultPolygonRenderer;
          }
          */
          
          options = dojo.mixin({
              outFields: [ "*" ],
              infoTemplate: layerSpec.popupInfo ? new esri.dijit.PopupTemplate(layerSpec.popupInfo) : null,  
              editable: false
          }, this._options);
          
          if (options.id) {
            options.id = options.id + "_" + i;
          }

          layerSpec.layerDefinition.capabilities = "Query,Data";
          layer = new esri.layers.FeatureLayer(layerSpec,options);
          
          // For convenience. Used in getFeature method
          if (layer.geometryType) {
            this["_" + layer.geometryType] = layer;
          }

          this._fLayers.push(layer);
        }
      }, this);
      
      if (this._fLayers.length === 0) {
        delete this._fLayers;
      }
    }
    
    // Do not add the above layers to map until this KMLLayer itself
    // is added to the map. See _setMap method below.
    
    // By registering onLoad handler for this layer,
    // users can now access these layers by calling getLayers method.
    // Perhaps they can set a custom renderer for feature layers etc.

    // "visibility" of top-level folders is enforced down their children
    len = rootFolders.length;
    for (i = 0; i < len; i++) {
      fldr = rootFolders[i];
      this._setState(fldr, fldr.visible);
    }
    
    // TODO
    // Enable/repair this block and set the visibility of uncategorized features to true.
    // This means that the visibility of these features are ties to the visibility
    // of the KMLLayer itself.
    /*
    var rootFeatures = this.featureInfos,
        visible = this.visible;
        
    len = rootFeatures ? rootFeatures.length : 0;
    for (i = 0; i < len; i++) {
      info = rootFeatures[i];
      
      if (info.type !== "Folder") {
        this.setFeatureVisibility(info, visible);
      }
    }*/
   
    this._fireUpdateEnd();
    
    if (this.loaded) {
      this._addInternalLayers();
      this.onRefresh();
    }
    else {
      this.loaded = true;
      this.onLoad(this);
    }
  },
  
  _addInternalLayers: function() {
    var map = this._map;
    
    this._fireUpdateStart();
    
    // Add supported network link layers to the map
    if (this._links) {
      dojo.forEach(this._links, function(link) {
        if (link.declaredClass) {
          map.addLayer(link);

          if (link._waitingForMap) {
            link._waitingForMap = null;
            
            if (link.visible) {
              link._parseKml(map);
            }
            else {
              link._wMap = map;
            }
          } // wait...
        }
      });
    }
    
    var mapSR = map.spatialReference, outSR = this._outSR, 
        match, converter;

    // Check if mapSR and outSR match
    if (mapSR.wkid) {
      match = (mapSR._isWebMercator() && outSR._isWebMercator()) || (mapSR.wkid === outSR.wkid);
    }
    else if (mapSR.wkt) {
      match = (mapSR.wkt === outSR.wkt);
    }
    else {
      console.log("KMLLayer:_setMap - map has invalid spatial reference");
      return;
    }

    // if they don't match, convert them on the client if possible
    if (!match) {
      if (mapSR._isWebMercator() && outSR.wkid === 4326) {
        converter = esri.geometry.geographicToWebMercator;
      }
      else if (outSR._isWebMercator() && mapSR.wkid === 4326) {
        converter = esri.geometry.webMercatorToGeographic;
      }
      else {
        // TODO
        // How do we handle the case where map.sr is NOT 4326 and NOT 102100?
        // Make geometry service calls, one per layers in feature collection and
        // ground overlays
        console.log("KMLLayer:_setMap - unsupported workflow. Spatial reference of the map and kml layer do not match, and the conversion cannot be done on the client.");
        return;
      }
    }
    
    // Add map image layer to the map
    if (this._groundLyr) {
      // We should probably do the conversion between wgs84 and mercator
      // here as well. See similar logic below in feature collection handling
      // Once conversion is done here, MapImageLayer doesnt have to do the same
      // in its _attach method. As for the MapImageLayer API we can say that map images
      // added should be in the spatial reference of the map
      
      if (converter) {
        dojo.forEach(this._groundLyr.getImages(), function(mapImage) {
          mapImage.extent = converter(mapImage.extent);
        });
      }
      
      map.addLayer(this._groundLyr/*, map.layerIds.length*/);
    }
    
    // Add feature layers to the map
    var featureLayers = this._fLayers;
    if (featureLayers && featureLayers.length > 0) {
      dojo.forEach(featureLayers, function(layer) {
        if (converter) {
          var graphics = layer.graphics, i, geom, 
              len = graphics ? graphics.length : 0;
          
          for (i = 0; i < len; i++) {
            geom = graphics[i].geometry;
            if (geom) {
              graphics[i].setGeometry(converter(geom));
            }
          }
        }
        
        map.addLayer(layer);
      });
    }
    
    this.onVisibilityChange(this.visible);
  },
  
  _removeInternalLayers: function() {
    var map = this._map;

    if (this._links) {
      dojo.forEach(this._links, function(link) {
        // if a link is still loading, cancel IO
        if (link.declaredClass && link._io) {
          link._io.cancel();
        }
      });
    }
    
    if (map) {
      dojo.forEach(this.getLayers(), map.removeLayer, map);
    }
  },
  
  _setState: function(folder, isVisible) {
    // For the given folder, turn its graphics, overlays
    // on/off. If this folder contains sub-folders, then
    // drill in recusively and set the visibility of their
    // features according to the sub-folder visibility
    
    var infos = folder.featureInfos, 
        info, feature, i, len = infos ? infos.length : 0,
        methodName = isVisible ? "show" : "hide";

    for (i = 0; i < len; i++) {
      info = infos[i];
      feature = this.getFeature(info);

      // TODO
      // Remove this later when screen overlays and others
      // are supported. Since screen overlays are not implemented
      // yet, getFeature will return undefined values
      if (!feature) {
        continue;
      }
      
      if (info.type === "Folder") {
        this._setState(feature, isVisible && feature.visible);
      }
      else if (info.type === "NetworkLink") {
        this._setInternalVisibility(feature, isVisible);
      }
      else {
        feature[methodName]();
      }
    }
  },
  
  /*_getParentFolders: function(folder, parentFolderIds) {
    // Returns the parent folders ids of the given
    // folder
    
    var parentId = folder.parentFolderId;
    
    if (parentId !== -1) {
      var parentFolder = this.getFeature({ type: "Folder", id: parentId });
      parentFolderIds.push(parentFolder);
      return this._getParentFolders(parentFolder, parentFolderIds);
    }
    
    return parentFolderIds;
  },*/
  
  _areLocalAncestorsVisible: function(folder) {
    // Returns:
    //   true - if all the ancestors of the given folder are visible
    //   false - otherwise
    
    var parentId = folder.parentFolderId, isVisible = folder.visible;
    
    while (isVisible && parentId !== -1) {
      var parentFolder = this.getFeature({ type: "Folder", id: parentId });
      
      isVisible = isVisible && parentFolder.visible;
      parentId = parentFolder.parentFolderId;
    }
    
    return isVisible;
  },
  
  _setInternalVisibility: function(/*KMLLayer*/ layer, /*Boolean*/ isVisible) {
    // Compute and intersect with ancestral visibility, to find 
    // the true visibility of "this" layer
    var parentLayer = layer._parentLayer,
        parentFolderId = layer._parentFolderId;
    
    isVisible = isVisible && layer.visible;
    
    while (isVisible && parentLayer) {
      isVisible = isVisible && parentLayer.visible;
      
      if (parentFolderId > -1) {
        isVisible = isVisible && parentLayer._areLocalAncestorsVisible(parentLayer.getFeature({ type: "Folder", id: parentFolderId }));
      }
      
      parentFolderId = parentLayer._parentFolderId;
      parentLayer = parentLayer._parentLayer;
    }
    
    this._setIntState(layer, isVisible);
  },
  
  _setIntState: function(/*KMLLayer*/ link, /*Boolean*/ isVisible) {
    if (!link) {
      return;
    }

    dojo.forEach(link.getLayers(), function (internal) {
      if (internal.linkInfo) {
        link._setIntState(internal, isVisible && internal.visible && link._areLocalAncestorsVisible(link.getFeature({ type: "Folder", id: internal._parentFolderId })));
      }
      else {
        internal.setVisibility(isVisible);
      }
    });
  },
  
  _getLinkParentId: function(id) {
    var parentId = -1;
    
    if (this.folders) {
      dojo.some(this.folders, function(folder) {
        if (folder.networkLinkIds && dojo.indexOf(folder.networkLinkIds, id) !== -1) {
          parentId = folder.id;
          return true;
        }
        
        return false;
      });
    }
    
    return parentId;
  },
  
  _checkAutoRefresh: function() {
    var linkInfo = this.linkInfo;
    
    // auto-refresh applies only to network links
    if (linkInfo) {
      if (this.visible) {
        // Don't bother to create timer if link has not loaded or if 
        // it has not been added to the map yet
        if (this.loaded && this._map) {
          var refreshMode = linkInfo.refreshMode,
              refreshInterval = linkInfo.refreshInterval,
              viewRefreshMode = linkInfo.viewRefreshMode,
              viewRefreshTime = linkInfo.viewRefreshTime;
              
          if (refreshMode && refreshMode.toLowerCase().indexOf("oninterval") !== -1 && refreshInterval > 0) {
            this._stopAutoRefresh();
            this._timeoutHandle = setTimeout(this.refresh, refreshInterval * 1000);
          }
          
          if (viewRefreshMode && viewRefreshMode.toLowerCase().indexOf("onstop") !== -1 && viewRefreshTime > 0) {
            if (!this._extChgHandle) {
              this._extChgHandle = dojo.connect(this._map, "onExtentChange", this, this._extentChanged);
            }
          }
        }
      }
      else { // if the link is not visible, disable refresh timer
        this._stopAutoRefresh();
        dojo.disconnect(this._extChgHandle);
        delete this._extChgHandle;
      }
    }
  },
  
  _stopAutoRefresh: function() {
    clearTimeout(this._timeoutHandle);
    this._timeoutHandle = null;
  },
  
  _getQueryParameters: function(map) {
    map = map || this._map;
    
    // Mixin this._url.query + Link.viewFormat + Link.httpQuery
    var parameters = {}, linkInfo = this.linkInfo, extent = map && map.extent;
    
    if (this._url.query) {
      dojo.mixin(parameters, this._url.query);
    }
    
    if (linkInfo) {
      var viewFormat = linkInfo.viewFormat, httpQuery = linkInfo.httpQuery,
          scale = linkInfo.viewBoundScale;
      
      if (extent && viewFormat) {
        var geoExtent = extent, webmExtent = extent,
            sr = extent.spatialReference;
        
        // Convert coordinates from 102100/102113/3857 to 4326 as required
        //  - "center" and "scale" should be calculated in degrees
        //  - "range" should be calculated in meters
        if (sr) {
          if (sr._isWebMercator()) {
            geoExtent = esri.geometry.webMercatorToGeographic(extent);
          }
          else if (sr.wkid === 4326) {
            webmExtent = esri.geometry.geographicToWebMercator(extent);
          }
        }

        var center = geoExtent.getCenter(), 
            range = Math.max(webmExtent.getWidth(), webmExtent.getHeight());
        
        // Assuming the extent is a square:
        // 1) If range = half the extent width, then horizFov=90
        // 2) If range = 2 * half the extent width, then horizFov=60
        // Basic pythagorean rule, where:
        //  side "o" is the straight line from the lookAt point on the ground to a point located at the height of "altitude" meters
        //  side "a" is the base
        //  side "h" is the hypotenuse
        // http://mathworld.wolfram.com/Trigonometry.html
        // theta = 45 deg, for case 1 above
        // theta = 60 deg, for case 2 above. This means the angle opposite to theta is 30 deg: one half of the horizontal field of view. 
        
        if (scale) {
          // Google Earth (6.0.3.2197) seems to just "add" scale value to xmax  
          // and "subtract" scale value from xmin. This cannot be right.
          // Online information is practically non-existent.
          // Example: http://pponnusamy.esri.com:9090/jsapi/mapapps/testing/kml/data/LINK-onStop-query-params.kml
          geoExtent = geoExtent.expand(scale);
        }
        
        // References:
        // http://code.google.com/apis/kml/documentation/kmlreference.html#lookat
        // http://code.google.com/apis/kml/documentation/photos.html
        // https://groups.google.com/forum/embed/?place=forum/kml-support-advanced&showsearch=true&showpopout=true&parenturl=http://code.google.com/apis/kml/forum/advanced.html#!searchin/kml-support-advanced/convert$20lookat$20to$20camera/kml-support-advanced/1ZVBB_ILKtc/NWh6JYBVaK0J
        // https://groups.google.com/forum/embed/?place=forum/kml-support-advanced&showsearch=true&showpopout=true&parenturl=http://code.google.com/apis/kml/forum/advanced.html#!searchin/kml-support-advanced/calculate$20altitude/kml-support-advanced/YvGzqmYqLUE/-o-Dds5y2DsJ
        // http://www.nearby.org.uk/project-kml.php
        // http://bbs.keyhole.com/ubb/ubbthreads.php?ubb=showflat&Number=166379&site_id=1#import
        // https://groups.google.com/forum/embed/?place=forum/kml-support-getting-started&showsearch=true&showpopout=true&parenturl=http://code.google.com/apis/kml/forum/getting-started.html#!searchin/kml-support-getting-started/horizFov/kml-support-getting-started/c-f9tHPQum8/tQemdEi2s5UJ
        // https://groups.google.com/forum/embed/?place=forum/kml-support-getting-started&showsearch=true&showpopout=true&parenturl=http://code.google.com/apis/kml/forum/getting-started.html#!searchin/kml-support-getting-started/horizFov/kml-support-getting-started/JRDEJNriQOs/eeB9Bysv2zwJ
        // http://www.nearby.org.uk/google.html
        // http://www.czmartin.com/home/i24/utm/directory.html
        
        // More:
        // http://www.angelfire.com/indie/aerostuff/PhotoGrammetry101-A.htm
        // http://rst.gsfc.nasa.gov/Sect10/Sect10_3.html
        // http://www.geog.ucsb.edu/~jeff/115a/lectures/scale_and_area_measurement.html
        // http://www.czmartin.com/home/i24/utm/earth_msl.htm

        viewFormat = viewFormat
                      .replace(/\[bboxWest\]/ig, geoExtent.xmin)
                      .replace(/\[bboxEast\]/ig, geoExtent.xmax)
                      .replace(/\[bboxSouth\]/ig, geoExtent.ymin)
                      .replace(/\[bboxNorth\]/ig, geoExtent.ymax)
                      .replace(/\[lookatLon\]/ig, center.x)
                      .replace(/\[lookatLat\]/ig, center.y)
                      .replace(/\[lookatRange\]/ig, range)
                      .replace(/\[lookatTilt\]/ig, 0)
                      .replace(/\[lookatHeading\]/ig, 0)
                      .replace(/\[lookatTerrainLon\]/ig, center.x)
                      .replace(/\[lookatTerrainLat\]/ig, center.y)
                      .replace(/\[lookatTerrainAlt\]/ig, 0)
                      .replace(/\[cameraLon\]/ig, center.x)
                      .replace(/\[cameraLat\]/ig, center.y)
                      .replace(/\[cameraAlt\]/ig, range)
                      .replace(/\[horizFov\]/ig, 60)
                      .replace(/\[vertFov\]/ig, 60)
                      .replace(/\[horizPixels\]/ig, map.width)
                      .replace(/\[vertPixels\]/ig, map.height)
                      .replace(/\[terrainEnabled\]/ig, 0); // Google Earth (6.0.3.2197) uses 0 or 1
        
        dojo.mixin(parameters, dojo.queryToObject(viewFormat));
      }
      
      // For testing only
      // httpQuery = "clientName=[clientName]&clientVersion=[clientVersion]&kmlVersion=[kmlVersion]&language=[language]";
      
      if (httpQuery) {
        // NOTE
        // Google Earth (6.0.3.2197) substitutes the following values:
        // clientName = Google Earth
        // clientVersion = 6.0.3.2197
        // kmlVersion = 2.2 (Regardless of the version in KML namespace declaration - <kml xmlns...>. Looks like this is supposed to be the latest KML version that the client can support)
        // language = en
        
        httpQuery = httpQuery
                      .replace(/\[clientVersion\]/ig, esri.version)
                      .replace(/\[kmlVersion\]/ig, 2.2)
                      .replace(/\[clientName\]/ig, "ArcGIS API for JavaScript")
                      .replace(/\[language\]/ig, dojo.locale);
        
        dojo.mixin(parameters, dojo.queryToObject(httpQuery));
      }
    }
    
    /*// TODO
    // Comment this out when installing code
    if (parameters) {
      for (var prop in parameters) {
        console.log(prop + " = " + parameters[prop]);
      }
    }*/
    
    //parameters = dojo.objectToQuery(parameters);
    
    // Using objectToQuery here would result in double-encoding of the "url" 
    // parameter in _parseKml because Dojo IO encodes parameters passed in 
    // request "content" object (see dojo._ioSetArgs). 
    // For example: if double-encoding happens, this KMLLayer URL:
    // https://www.google.com/fusiontables/exporttable?query=select+col2+from+2854057+&o=kmllink&g=col2
    // would be encoded as:
    // url=https%3A%2F%2Fwww.google.com%2Ffusiontables%2Fexporttable%3Fquery%3Dselect%252Bcol2%252Bfrom%252B2854057%252B%26o%3Dkmllink%26g%3Dcol2
    // instead of:
    // url=https%3A%2F%2Fwww.google.com%2Ffusiontables%2Fexporttable%3Fquery%3Dselect%2Bcol2%2Bfrom%2B2854057%2B%26o%3Dkmllink%26g%3Dcol2
    // Note that "+" would be encoded as %252B instead of %2B which the KMLService
    // would have trouble decoding.
    // References:
    // https://developers.google.com/fusiontables/docs/developers_guide#UrlEncoding
    var queryString = [], param;
    for (param in parameters) {
      if ( esri._isDefined(parameters[param]) ) {
        queryString.push(param + "=" + parameters[param]);
      }
    }
    queryString = queryString.join("&");
    
    return queryString ? ("?" + queryString) : "";
  },
    
  /************
   * Layer API
   ************/

  _setMap: function(map, container){
    // Map will call this method after the layer has loaded
    
    //console.log("_setMap");
    this._map = map;
    
    // TODO
    // This div is just a placeholder. Do we need it?
    // If not, map should tolerate its absence i.e, this method should
    // be able to return null value to the map
    var div = this._div = dojo.create("div", null, container);
    dojo.style(div, "position", "absolute");
    
    this._addInternalLayers();
    
    return div;
  },

  _unsetMap: function(map, container){
    //console.log("_unsetMap");
    
    // Remove all internal layers
    /*if (this._groundLyr) {
      map.removeLayer(this._groundLyr);
    }
    
    if (this._fLayers) {
      dojo.forEach(this._fLayers, function(layer) {
        map.removeLayer(layer);
      });
    }
    
    if (this._links) {
      dojo.forEach(this._links, function(link) {
        if (link.declaredClass) {
          map.removeLayer(link);
        }
      });
    }*/
   
    if (this._io) {
      this._io.cancel();
    }
    this._stopAutoRefresh();
    dojo.disconnect(this._extChgHandle);
    delete this._extChgHandle;
   
    //dojo.forEach(this.getLayers(), map.removeLayer, map);
    this._removeInternalLayers();

    // Detach and destroy the DOM structure
    var div = this._div;
    if (div) {
      container.removeChild(div);
      dojo.destroy(div);
    }
    
    // Release objects
    this._map = this._wMap = this._div = null; 
  },
  
  onVisibilityChange: function(isVisible) {
    if (!this.loaded) {
      // If this is the first time this network link layer
      // is made visible, then parse it and get the json representation.
      // In other words, "load" it.
      // See constructor for related logic
      if (this.linkInfo && isVisible) {
        
        if (!this._waitingForMap) {
          this._parseKml(this._wMap);
        }
      }
      
      return;
    }
    
    /*if (isVisible && this.linkInfo && !this.loaded) {
      this._parseKml();
    }
    else {
      // Compute and intersect with ancestral visibility, to find 
      // the true visibility of "this" layer
      var parentLayer = this._parentLayer,
          parentFolderId = this._parentFolderId;
      
      while (parentLayer) {
        isVisible = isVisible && parentLayer.visible;
        
        if (parentFolderId > -1) {
          isVisible = isVisible && parentLayer._areAncestorsVisible(parentLayer.getFeature({ type: "Folder", id: parentFolderId }));
        }
        
        parentFolderId = parentLayer._parentFolderId;
        parentLayer = parentLayer._parentLayer;
      }

      if (this._groundLyr) {
        this._groundLyr.setVisibility(isVisible);
      }
      
      if (this._fLayers) {
        dojo.forEach(this._fLayers, function(layer) {
          layer.setVisibility(isVisible);
        });
      }
      
      if (this._links) {
        dojo.forEach(this._links, function(link) {
          if (link.declaredClass) {
            this._setLinkState(link, isVisible && link.visible);
          }
        }, this);
      }*/
     
      this._fireUpdateStart();
      
      this._setInternalVisibility(this, isVisible);
      this._checkAutoRefresh();
      
      this._fireUpdateEnd();
      
    //}
  },
  
  refresh: function() {
    // NOP if the layer has not loaded yet or if it has not 
    // been added to the map yet, or if the layer is in the
    // middle of a refresh cycle
    if (!this.loaded || !this._map || this._io) {
      return;
    }

    // fetch the associated kml file
    this._parseKml();
  },
    
  /*****************
   * Event Handlers
   *****************/
  
  _extentChanged: function() {
    // We will not be here unless there is a linkInfo
    // and the link is loaded and added to the map and visible
    // See _checkAutoRefresh

    this._stopAutoRefresh();
    this._timeoutHandle = setTimeout(this.refresh, this.linkInfo.viewRefreshTime * 1000);
  }
});


dojo.declare("esri.layers.KMLGroundOverlay", [ esri.layers.MapImage ], {
  constructor: function(json) {
    // Superclass will mixin json with "this"
    
    // The initial visibility of a ground overlay is based on its
    // "visibility" property
    if (esri._isDefined(this.visibility)) {
      this.visible = !!this.visibility;
    }
  }
});


dojo.declare("esri.layers.KMLFolder", null, {
  constructor: function(json) {
    dojo.mixin(this, json);
    
    // The initial visibility is based on the
    // "visibility" value
    if (esri._isDefined(this.visibility)) {
      this.visible = !!this.visibility;
    }
  }
});

});
