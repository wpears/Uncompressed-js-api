//>>built
// wrapped by build app
define("esri/dijit/BasemapGallery", ["dijit","dojo","dojox","dojo/require!esri/virtualearth/VETiledLayer,esri/layers/osm,dijit/_Widget,dijit/_Templated,dojo/DeferredList"], function(dijit,dojo,dojox){
dojo.provide("esri.dijit.BasemapGallery");

dojo.require("esri.virtualearth.VETiledLayer");
dojo.require("esri.layers.osm");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");
dojo.require("dojo.DeferredList");

/***************
 * CSS Includes
 ***************/
//anonymous function to load CSS required for this module
(function () {
  var css = [
  dojo.moduleUrl("esri.dijit", "css/BasemapGallery.css")];

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

/********************
 * Constant
 ********************/

// needed in esri.dijit.BasemapGallery and esri.dijit.Basemap
esri.dijit._arcgisUrl = "http://www.arcgis.com/sharing/rest";

/********************
 * Basemap Gallery Dijit
 ********************/
dojo.declare("esri.dijit.BasemapGallery", [dijit._Widget, dijit._Templated], {

  // Let the dijit framework know that the template for this dijit 
  // uses other dijits such as BorderContainer, StackContainer, Grid etc
  widgetsInTemplate: true,

  // Let the dijit framework know the location of the template file where
  // the UI for this dijit is defined 
  templateString:"<div class=\"esriBasemapGallery\">\r\n  <div dojoAttachPoint=\"flowContainer\">\r\n  </div>\r\n</div>",

  // Path to the folder containing the resources used by this dijit.
  // This can be used to refer to images in the template or other
  // resources
  basePath: dojo.moduleUrl("esri.dijit"),

  /********************
   * Public properties
   ********************/

  // widget has loaded ArcGIS.com basemaps
  loaded: false,

  // list of all basemaps, for user to see
  basemaps: [],

  // user provided Bing Maps key
  bingMapsKey: null,

  // Implicit public properties: flowContainer
  flowContainer: null,

  /**********************
   * Internal Properties
   **********************/

  // build a UI or not
  _hasUI: false,

  // currently selected basemap
  _selectedBasemap: null,

  /********************
   * Overridden Methods
   ********************/

  constructor: function (params, srcNodeRef) {
    params = params || {};

    if (!params.map) {
      console.error("esri.dijit.BasemapGallery: Unable to find the 'map' property in parameters");
    }

    /**************************
     * Configurable Properties
     **************************/

    this.map = params.map; // REQUIRED
    this._hasUI = srcNodeRef ? true : false;
    this.bingMapsKey = (params.bingMapsKey && params.bingMapsKey.length > 0) ? params.bingMapsKey : null;
    this.showArcGISBasemaps = (params.showArcGISBasemaps === false) ? false : true;
    this.basemaps = params.basemaps ? params.basemaps : [];
    this.basemapIds = params.basemapIds;
    this.referenceIds = params.referenceIds;
    this.basemapsGroup = params.basemapsGroup;

    if (location.protocol === "https:") {
       esri.dijit._arcgisUrl = esri.dijit._arcgisUrl.replace('http:', 'https:');
    }

    this.init();
  },

  init: function () {
    // overriding methods typically call their implementation up the inheritance chain
    this.inherited(arguments);

    // don't check here if Bing Maps Key is available for Bing Maps. 
    dojo.forEach(this.basemaps, function (basemap, i) {
      if (!basemap.id || basemap.id.length === 0) {
        basemap.id = this._getUniqueId();
      }
      dojo.forEach(basemap.layers, function (layer) {
        layer.opacity = (layer.opacity >= 0) ? layer.opacity : 1;
        layer.visibility = true;
      }, this);
    }, this);

    if (this.basemapIds && this.basemapIds.length > 0) {
      dojo.forEach(this.basemapIds, function (basemapId) {
        var layer = this.map.getLayer(basemapId);
        layer._basemapGalleryLayerType = "basemap";
      }, this);
    }
    if (this.referenceIds && this.referenceIds.length > 0) {
      dojo.forEach(this.referenceIds, function (referenceId) {
        var layer = this.map.getLayer(referenceId);
        layer._basemapGalleryLayerType = "reference";
      }, this);
    }

    if (this.basemapsGroup && ((this.basemapsGroup.owner && this.basemapsGroup.title) || this.basemapsGroup.id)) {
        this._findCustomBasemapsGroup(dojo.hitch(this, "_handleArcGISBasemapsResponse"));
		} else {
			if (this.showArcGISBasemaps) {
				this._findArcGISBasemapsGroup(dojo.hitch(this, "_handleArcGISBasemapsResponse"));
			} else {
				this._finishStartup();
			}
		}
  },

  /*****************
   * Public Methods
   *****************/

  startup: function () {
    if (this.loaded) {
      this._refreshUI();
    } else {
      dojo.connect(this, "onLoad", dojo.hitch(this, function () {
        this._refreshUI();
      }));
    }
  },

  select: function (id) {
    this._select(id);
  },

  getSelected: function () {
    return this._selectedBasemap;
  },

  get: function (id) {
    for (var i = 0; i < this.basemaps.length; i++) {
      if (this.basemaps[i].id == id) {
        return this.basemaps[i];
      }
    }
    return null;
  },

  add: function (basemap) {
    if (basemap && !basemap.id) {
      basemap.id = this._getUniqueId();
      this.basemaps.push(basemap);
      this._refreshUI();
      this.onAdd(basemap);
      return true;
    } else if (basemap && this._isUniqueId(basemap.id)) {
      this.basemaps.push(basemap);
      this._refreshUI();
      this.onAdd(basemap);
      return true;
    }
    return false;
  },

  remove: function (id) {
    for (var i = 0; i < this.basemaps.length; i++) {
      var basemap = this.basemaps[i];
      if (basemap.id === id) {
        if (this._selectedBasemap && this._selectedBasemap.id === basemap.id) {
          this._selectedBasemap = null;
        }
        this.basemaps.splice(i, 1);
        this._refreshUI();
        this.onRemove(basemap);
        return basemap;
      }
    }
    return null;
  },

  /*****************
   * Events
   *****************/

  onLoad: function () {
    //summary: When dijit is loaded
  },

  onSelectionChange: function () {
    //summary: When the map updated with a new basemap
  },

  onAdd: function (basemap) {
    //summary: When new basemap is added to list
  },

  onRemove: function (basemap) {
    //summary: When basemap is removed from list
  },

  onError: function (msg) {
    //summary: Error: Event fired whenever there is an error
  },

  /*******************
   * Internal Methods
   *******************/

  _defaultBasemapGalleryGroupQuery: "title:\"ArcGIS Online Basemaps\" AND owner:esri",
  _basemapGalleryGroupQuery: null, 

  _finishStartup: function () {

    this.loaded = true;
    this.onLoad();

    // if map is empty add first basemap
    if (this.map.layerIds.length === 0 && this.basemaps.length > 0) {
      this._select(this.basemaps[0].id);
    }
  },

  _findCustomBasemapsGroup: function (handler) {

    if (this.basemapsGroup && this.basemapsGroup.id) {
      this._findArcGISBasemaps(this.basemapsGroup.id, handler);
		} else {
      this._basemapGalleryGroupQuery = "title:\""+this.basemapsGroup.title+"\" AND owner:"+this.basemapsGroup.owner;
      this._findArcGISBasemapsGroup(handler);
		}
  },

  _findArcGISBasemapsGroup: function (handler) {
		
		if (!this._basemapGalleryGroupQuery) {
			// make self call to get group name and owner

	    var url = esri.dijit._arcgisUrl + "/accounts/self";
	    var params = {};
	    params.f = "json";
      params.culture = dojo.locale;
	    esri.request({
	      url: url,
	      content: params,
	      callbackParamName: "callback",
	      load: dojo.hitch(this, function (response, args) {
	        if (response && response.basemapGalleryGroupQuery) {
	          this._basemapGalleryGroupQuery = response.basemapGalleryGroupQuery;
	        } else {
	          this._basemapGalleryGroupQuery = this._defaultBasemapGalleryGroupQuery;
	        }
					this._findArcGISBasemapsGroupContent(handler);
	      }),
	      error: function (response, args) {
          this._basemapGalleryGroupQuery = this._defaultBasemapGalleryGroupQuery;
        }
	    });
		} else {
			this._findArcGISBasemapsGroupContent(handler);
		}
  },

  _findArcGISBasemapsGroupContent: function (handler) {
    // find group id from name+owner
    var findArcGISBasemaps = dojo.hitch(this, "_findArcGISBasemaps");

    var url = esri.dijit._arcgisUrl + "/community/groups";
    var params = {};
    params.q = this._basemapGalleryGroupQuery;
    params.f = "json";
    esri.request({
      url: url,
      content: params,
      callbackParamName: "callback",
      load: function (response, args) {
        if (response.results.length > 0) {
          findArcGISBasemaps(response.results[0].id, handler);
        } else {
          console.error("esri.dijit.BasemapGallery: could not find group for basemaps.");
        }
      },
      error: esriConfig.defaults.io.errorHandler
    });
  },

  _findArcGISBasemaps: function (groupId, handler) {
    // find web maps in group
    var url = esri.dijit._arcgisUrl + "/search";
    var params = {};
    params.q = "group:" + groupId + " AND type:\"web map\"";
    params.sortField = "name";
    params.sortOrder = "desc";
    params.num = 50;
    params.f = "json";
    esri.request({
      url: url,
      content: params,
      callbackParamName: "callback",
      load: function (response, args) {
        handler(response.results);
      },
      error: esriConfig.defaults.io.errorHandler
    });
  },

  _handleArcGISBasemapsResponse: function (items) {

    if (items.length > 0) {
      // build basemaps list
      dojo.forEach(items, function (item, i) {
        // we don't want to get all web map configs to check if it's Bing. Just use the title.
        // only add Bing Maps if a Bing Maps Key is available
        if (this.bingMapsKey || (!this.bingMapsKey && item.title && item.title.indexOf("Bing Maps") == -1)) {
          var params = {};
          params.id = this._getUniqueId();
          params.title = item.title;
          params.thumbnailUrl = (item.thumbnail && item.thumbnail.length > 0) ? (esri.dijit._arcgisUrl + "/content/items/" + item.id + "/info/" + item.thumbnail) : "";
          // we don't know the layers yet
          params.itemId = item.id;
          var basemap = new esri.dijit.Basemap(params);
          // add ArcGIS.com basemaps in front of user basemaps
          this.basemaps.splice(0, 0, basemap);
        }
      }, this);

      this._finishStartup();
    }
  },

  _refreshUI: function () {
    if (this._hasUI) {
      dojo.empty(this.flowContainer);

      dojo.forEach(this.basemaps, function (basemap, i) {
        if (!basemap.id) {
          basemap.id = "basemap_" + i;
        }
        // we don't want to get all web map configs to check if it's Bing. Just use the title.
        this.flowContainer.appendChild(this._buildNodeLayout(basemap));
      }, this);

      dojo.create("br", {
        style: {
          clear: "both"
        }
      }, this.flowContainer);

      this._markSelected(this._selectedBasemap);
    }
  },

  _buildNodeLayout: function (basemap) {

    var nId = "galleryNode_" + basemap.id;
    var n = dojo.create("div", {
      id: nId,
      "class": "esriBasemapGalleryNode"
    });

    var anchor = dojo.create("a", {
      href: "#"
    }, n);
    dojo.connect(anchor, "onclick", dojo.hitch(this, "_onNodeClick", basemap));
    if (basemap.thumbnailUrl) {
      dojo.create("img", {
        "class": "esriBasemapGalleryThumbnail",
        src: basemap.thumbnailUrl
      }, anchor);
    } else {
      dojo.create("img", {
        "class": "esriBasemapGalleryThumbnail",
        src: this.basePath.toString() + "images/transparent.gif"
      }, anchor);
    }

    var label = dojo.create("div", {
      "class": "esriBasemapGalleryLabelContainer"
    }, n);
    var labelText = basemap.title || "";
    dojo.create("span", {
      innerHTML: labelText,
      alt: labelText,
      title: labelText
    }, label);

    return n;
  },

  _onNodeClick: function (basemap, e) {
    e.preventDefault();

    this._markSelected(basemap);
    this.select(basemap.id);
  },

  _markSelected: function (basemap) {
    if (basemap) {
      // unselect all basemap gallery items
      dojo.forEach(dojo.query(".esriBasemapGallerySelectedNode", this.domNode), function (node) {
        dojo.removeClass(node, "esriBasemapGallerySelectedNode");
      });
      // select current basemap gallery item
      var basemapNode = dojo.byId("galleryNode_" + basemap.id);
      if (basemapNode) {
        dojo.addClass(basemapNode, "esriBasemapGallerySelectedNode");
      }
    }
  },

  _select: function (id) {

    var basemap = this.get(id);
    if (basemap.layers) {
      this._getServiceInfos(basemap);
    } else {
      var returnValue = basemap.getLayers();
      if (dojo.isArray(returnValue)) {
        this._getServiceInfos(basemap);
      } else { // returnValue instanceof dojo.Deferred
        returnValue.addCallback(dojo.hitch(this, function (layers) {
          this._getServiceInfos(basemap);
        }));
      }
    }
    this._markSelected(basemap);
  },

  _getServiceInfos: function (basemap) {

    if (location.protocol == "https:") {
      dojo.forEach(basemap.layers, function(layer){
        if (this._isAgolService(layer.url) || this._isHostedService(layer.url)) {
          layer.url = layer.url.replace('http:', 'https:');
        }
      }, this);
    }
    
    this._selectedBasemap = basemap;

    var deferreds = [];
    dojo.forEach(basemap.layers, function (baseMapLayer) {
      if (baseMapLayer.url && baseMapLayer.url.length > 0 && !baseMapLayer.isReference) {
        // ArcGIS Server
        baseMapLayer.deferredsPos = deferreds.length;
        deferreds.push(this._getServiceInfo(baseMapLayer.url));
      }
    }, this);

    if (deferreds.length > 0) {
      var deferredsList = new dojo.DeferredList(deferreds);
      deferredsList.addCallback(dojo.hitch(this, function (response) {
        var sumExtent = null;
        dojo.forEach(basemap.layers, function (baseMapLayer) {
          if (baseMapLayer.deferredsPos === 0 || baseMapLayer.deferredsPos) {
            baseMapLayer.serviceInfoResponse = response[baseMapLayer.deferredsPos][1];
            var ext = baseMapLayer.serviceInfoResponse.fullExtent;
            if (!ext) {
              ext = baseMapLayer.serviceInfoResponse.extent;
            }
            if (!sumExtent) {
              sumExtent = new esri.geometry.Extent(ext);
            } else {
              sumExtent = sumExtent.union(new esri.geometry.Extent(ext));
            }
          }
        }, this);

        if (this.map.extent) {
          var percent = this._getIntersectionPercent(sumExtent, this.map.extent);
          if (percent < 5) {
            this.map.setExtent(sumExtent, true);
          }
        } // else map is empty
        this._switchBasemapLayers(basemap);
        this._updateReferenceLayer(basemap);
      }));
    } else {
      // no ArcGIS services as basemap layers
      this._switchBasemapLayers(basemap);
      this._updateReferenceLayer(basemap);
    }
  },

  _switchBasemapLayers: function (basemap) {
    // projections and tiles must fit, no check here
    var layers = basemap.layers;
    if (this.map.layerIds.length > 0 && this.map.getNumLevels() === 0 && (layers[0].type === "OpenStreetMap" || (layers[0].type && layers[0].type.indexOf("BingMaps") > -1))) {
      var msg = "esri.dijit.BasemapGallery: Unable to switch basemap because new basemap is a tiled service and cannot be loaded as a dynamic layer.";
      this.onError(msg);
      return;
    }

    // before removing current basemap make sure we have a key for bing maps
    dojo.forEach(layers, function (baseMapLayer) {
      if (!baseMapLayer.isReference && baseMapLayer.type && baseMapLayer.type.indexOf("BingMaps") > -1 && !this.bingMapsKey) {
        var msg = "esri.dijit.BasemapGallery: Invalid Bing Maps key.";
        this.onError(msg);
        return;
      }
    }, this);

    this._removeBasemapLayers();

    dojo.forEach(layers, function (baseMapLayer) {

      if (!baseMapLayer.isReference) {
        var layer;
        if (baseMapLayer.type === "OpenStreetMap") {
          // OpenStreetMap
          if (this.map.layerIds.length > 0 && this.map.getNumLevels() === 0) {
            var msg = "esri.dijit.BasemapGallery: Unable to switch basemap because new basemap is a tiled service and cannot be loaded as a dynamic layer.";
            this.onError(msg);
            return;
          }

          layer = new esri.layers.OpenStreetMapLayer({
            id: "layer_osm",
            opacity: baseMapLayer.opacity
          });

        } else if (baseMapLayer.type && baseMapLayer.type.indexOf("BingMaps") > -1) {
          // Bing  
          if (this.map.layerIds.length > 0 && this.map.getNumLevels() === 0) {
            var msg = "esri.dijit.BasemapGallery: Unable to switch basemap because new basemap is a tiled service and cannot be loaded as a dynamic layer.";
            this.onError(msg);
            return;
          }

          var style = esri.virtualearth.VETiledLayer.MAP_STYLE_AERIAL_WITH_LABELS; // type == "BingMapsHybrid"
          if (baseMapLayer.type == "BingMapsAerial") {
            style = esri.virtualearth.VETiledLayer.MAP_STYLE_AERIAL;
          } else if (baseMapLayer.type == "BingMapsRoad") {
            style = esri.virtualearth.VETiledLayer.MAP_STYLE_ROAD;
          }

          // load as Bing layer
          layer = new esri.virtualearth.VETiledLayer({
            id: "layer_bing",
            bingMapsKey: this.bingMapsKey,
            mapStyle: style,
            opacity: baseMapLayer.opacity
          });

        } else if (baseMapLayer.serviceInfoResponse && baseMapLayer.serviceInfoResponse.mapName) {
          // map service
          if ((this.map.layerIds.length === 0 || this.map.getNumLevels() > 0) && baseMapLayer.serviceInfoResponse.singleFusedMapCache === true) {
            // map is empty or has a zoom level slider
            layer = this._loadAsCached(baseMapLayer);
          } else {
            layer = this._loadAsDynamic(baseMapLayer);
          }

        } else if (baseMapLayer.serviceInfoResponse && baseMapLayer.serviceInfoResponse.pixelSizeX) {
          // image service
          var imageServiceParameters = new esri.layers.ImageServiceParameters();
          imageServiceParameters.bandIds = baseMapLayer.bandIds;
          if (!baseMapLayer.bandIds && baseMapLayer.serviceInfoResponse.bandCount && parseInt(baseMapLayer.serviceInfoResponse.bandCount) > 3) {
            imageServiceParameters.bandIds = [0, 1, 2];
          }
          layer = new esri.layers.ArcGISImageServiceLayer(baseMapLayer.url, {
            resourceInfo: baseMapLayer.serviceInfoResponse,
            opacity: baseMapLayer.opacity,
            visible: baseMapLayer.visibility,
            imageServiceParameters: imageServiceParameters
          });
        }

        if (layer) {
          layer._basemapGalleryLayerType = "basemap";
          this.map.addLayer(layer, 0);
        }
      }
    }, this);

    this.onSelectionChange();
  },

  // remove all layers of type basemap
  _removeBasemapLayers: function () {
    // Feature Layer cannot be a Basemap
    var layerIds = this.map.layerIds;
    var removeList = [];
    dojo.forEach(layerIds, function (id) {
      var layer = this.map.getLayer(id);
      if (layer._basemapGalleryLayerType === "basemap") {
        removeList.push(layer);
      }
    }, this);
    if (removeList.length === 0 && layerIds.length > 0) {
      // no type specification on the layer; remove first layer in list
      removeList.push(this.map.getLayer(layerIds[0]));
    }

    if (removeList.length > 0) {
      dojo.forEach(removeList, function (layer) {
        this.map.removeLayer(layer);
      }, this);
    } // else map could have no layers
  },

  _updateReferenceLayer: function (basemap) {
    this._removeReferenceLayer();

    for (var i = 0; i < basemap.layers.length; i++) {
      if (basemap.layers[i].isReference === true) {
        this._addReferenceLayer(basemap.layers[i]);
      }
    }
  },

  _removeReferenceLayer: function () {
    // only map services and image services supported
    for (var i = this.map.layerIds.length-1; i >= 0; i--) {
			var id = this.map.layerIds[i];
      var layer = this.map.getLayer(id);
      if (layer._basemapGalleryLayerType === "reference") {
        this.map.removeLayer(layer);
      }
    }
  },

  _addReferenceLayer: function (baseMapLayer) {
    // only map services and image services supported as reference layers
    this._getServiceInfo(baseMapLayer.url, dojo.hitch(this, "_handleReferenceServiceInfoResponse", baseMapLayer));
  },

  _handleReferenceServiceInfoResponse: function (baseMapLayer, serviceInfoResponse, args) {
    var layer;
    baseMapLayer.serviceInfoResponse = serviceInfoResponse;
    if (serviceInfoResponse && serviceInfoResponse.mapName) {
      // map service
      if (serviceInfoResponse.singleFusedMapCache === true) {
        layer = this._loadAsCached(baseMapLayer);
      } else {
        layer = this._loadAsDynamic(baseMapLayer);
      }

    } else if (serviceInfoResponse && serviceInfoResponse.pixelSizeX) {
      // image service
      var imageServiceParameters = new esri.layers.ImageServiceParameters();
      imageServiceParameters.bandIds = baseMapLayer.bandIds;
      if (!baseMapLayer.bandIds && serviceInfoResponse.bandCount && parseInt(serviceInfoResponse.bandCount) > 3) {
        imageServiceParameters.bandIds = [0, 1, 2];
      }
      layer = new esri.layers.ArcGISImageServiceLayer(baseMapLayer.url, {
        resourceInfo: serviceInfoResponse,
        opacity: baseMapLayer.opacity,
        visible: baseMapLayer.visibility,
        imageServiceParameters: imageServiceParameters
      });
    }

    if (layer) {
      layer._basemapGalleryLayerType = "reference";
      this.map.addLayer(layer);
    }

  },

  _getServiceInfo: function (url, handler) {

    var params = {};
    params.f = "json";
    var request = esri.request({
      url: url,
      content: params,
      callbackParamName: "callback",
      load: function (response, args) {
        if (handler) {
          handler(response, args);
        }
      },
      error: esriConfig.defaults.io.errorHandler
    });
    return request;
  },

  _loadAsCached: function (baseMapLayer) {

    var serviceLods = [];
    if (!baseMapLayer.displayLevels) {
      serviceLods = dojo.map(baseMapLayer.serviceInfoResponse.tileInfo.lods, function (lod) {
        return lod.level;
      });
    }
    var layer = new esri.layers.ArcGISTiledMapServiceLayer(baseMapLayer.url, {
      resourceInfo: baseMapLayer.serviceInfoResponse,
      opacity: baseMapLayer.opacity,
      visible: baseMapLayer.visibility,
      displayLevels: (baseMapLayer.displayLevels) ? baseMapLayer.displayLevels : serviceLods
    });
    return layer;
  },

  _loadAsDynamic: function (baseMapLayer) {

    var layer = new esri.layers.ArcGISDynamicMapServiceLayer(baseMapLayer.url, {
      resourceInfo: baseMapLayer.serviceInfoResponse,
      opacity: baseMapLayer.opacity,
      visible: baseMapLayer.visibility
    });
    if (baseMapLayer.visibleLayers) {
      layer.setVisibleLayers(baseMapLayer.visibleLayers);
    }
    return layer;
  },

  // return percentage value on how much the new extent overlaps the map extent
  _getIntersectionPercent: function (newExtent, mapExtent) {
    // make sure defaultExtent is partially inside mapExtent
    var intersects = mapExtent.intersects(newExtent);
    if (intersects) {
      // new extent overlaps current map extent
      // if intersection covers only 5% or less of the current map extent zoom
      // otherwise don't zoom
      var areaIntersection = intersects.getWidth() * intersects.getHeight();
      var areaMapExtent = mapExtent.getWidth() * mapExtent.getHeight();
      return (areaIntersection / areaMapExtent) * 100;
    } else {
      return 0;
    }
  },

  _getIds: function () {
    var ids = [];
    dojo.forEach(this.basemaps, function (basemap) {
      ids.push(basemap.id);
    }, this);
    return ids;
  },

  _getUniqueId: function () {
    var usedIds = "," + this._getIds().toString() + ",";
    var count = 0;
    while (true) {
      if (usedIds.indexOf(",basemap_" + count + ",") > -1) {
        count++;
      } else {
        return "basemap_" + count;
      }
    }
  },

  _isUniqueId: function (id) {
    var usedIds = "," + this._getIds().toString() + ",";
    if (usedIds.indexOf("," + id + ",") === -1) {
      return true;
    }
    return false;
  },

  _isAgolService: function(url){
    if (!url) {
      return false;
    }
    // Agol service: http://services.arcgisonline.com or http://server.arcgisonline.com
    return (url.indexOf("/services.arcgisonline.com/") !== -1 || url.indexOf("/server.arcgisonline.com/") !== -1);
  },

  _isHostedService: function(url){
    if (!url) {
      return false;
    }
    return (url.indexOf(".arcgis.com/") !== -1);
  }

});

/********************
 * Basemap object
 ********************/

dojo.declare("esri.dijit.Basemap", null, {

  id: null,
  title: "",
  thumbnailUrl: null,

  layers: null,
  itemId: null,

  constructor: function (params) {
    params = params || {};

    if (!params.layers && !params.itemId) {
      console.error("esri.dijit.Basemap: unable to find the 'layers' property in parameters");
    }

    this.id = params.id;
    this.itemId = params.itemId;
    this.layers = params.layers; // array of esri.dijit.BasemapLayer
    this.title = params.title ? params.title : "";
    this.thumbnailUrl = params.thumbnailUrl;
  },

  getLayers: function () {
/* usage
     var returnValue = basemap.getLayers();
     if (dojo.isArray(returnValue)) {
       alert("Basemap has "+returnValue.length+" layers.");
     } else if (returnValue instanceof dojo.Deferred) {
       returnValue.addCallback(function(layers) {
         alert("Basemap has "+layers.length+" layers.");
       });
     }
    */

    if (this.layers) {

      // one of the user supplied basemaps or one the user requested before
      return this.layers;

    } else if (this.itemId) {

      // get web map config
      var url = esri.dijit._arcgisUrl + "/content/items/" + this.itemId + "/data";
      var params = {};
      params.f = "json";
      var request = esri.request({
        url: url,
        content: params,
        callbackParamName: "callback",
        error: esriConfig.defaults.io.errorHandler
      });

      request.addCallback(dojo.hitch(this, function (response, args) {
        this.layers = [];
        dojo.forEach(response.baseMap.baseMapLayers, function (baseMapLayer) {
          var params = {};
          if (baseMapLayer.url) {
            params.url = baseMapLayer.url;
          }
          if (baseMapLayer.type) {
            params.type = baseMapLayer.type;
          }
          if (baseMapLayer.isReference) {
            params.isReference = baseMapLayer.isReference;
          }
          if (baseMapLayer.displayLevels) {
            params.displayLevels = baseMapLayer.displayLevels;
          }
          if (baseMapLayer.visibleLayers) {
            params.visibleLayers = baseMapLayer.visibleLayers;
          }
          if (baseMapLayer.bandIds) {
            params.bandIds = baseMapLayer.bandIds;
          }
          this.layers.push(new esri.dijit.BasemapLayer(params));
        }, this);

        return this.layers;
      }));

      return request;
    }
  }
  
});

/********************
 * BasemapLayer object
 ********************/

dojo.declare("esri.dijit.BasemapLayer", null, {

  constructor: function (params) {
    params = params || {};

    if (!params.url && !params.type) {
      console.error("esri.dijit.BasemapLayer: unable to find the 'url' or 'type' property in parameters");
    }

    this.url = params.url; // used for ArcGIS services
    this.type = params.type; // ["BingMapsAerial"|"BingMapsHybrid"|"BingMapsRoad"|"OpenStreetMap"]
    this.isReference = (params.isReference === true) ? true : false;
    this.displayLevels = params.displayLevels; // e.g. [1,2,3,4,5,6,7,8,9] for cached map services
    this.visibleLayers = params.visibleLayers; // e.g. [2,6,8] for dynamic map services
    this.bandIds = params.bandIds; // e.g. [0,1,2] for image services
    this.opacity = params.opacity; 
  }

});
});
