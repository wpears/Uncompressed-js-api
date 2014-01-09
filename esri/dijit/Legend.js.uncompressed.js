//>>built
// wrapped by build app
define("esri/dijit/Legend", ["dijit","dojo","dojox","dojo/require!dijit/_Widget,dojo/DeferredList,dojox/html/entities"], function(dijit,dojo,dojox){
dojo.provide("esri.dijit.Legend");

dojo.require("dijit._Widget");
dojo.require("dojo.DeferredList");
dojo.require("dojox.html.entities");

/***************
 * CSS Includes
 ***************/
//anonymous function to load CSS required for this module
(function(){
  var css = [dojo.moduleUrl("esri.dijit", "css/Legend.css")];
  
  var head = document.getElementsByTagName("head").item(0), link;
  for (var i = 0, il = css.length; i < il; i++) {
  
    link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = css[i].toString();
    head.appendChild(link);
  }
}());

/********************
 * Legend Dijit
 ********************/
dojo.declare("esri.dijit.Legend", [dijit._Widget], {

  /********************
   * constants
   ********************/
  widgetsInTemplate: false,
  
  
  layers: null,
  alignRight: false,
  
  _ieTimer: 100, // milliseconds
  /********************
   * Overriden Methods
   ********************/
  constructor: function(params, srcNodeRef){
    // Mixin i18n strings
    dojo.mixin(this, esri.bundle.widgets.legend);
    
    params = params || {};
    
    if (!params.map) {
      console.error("esri.dijit.Legend: unable to find the 'map' property in parameters");
      return;
    }
    
    if (!srcNodeRef) { // user has provided a DOM node that should be used as the container for legend
      console.error("esri.dijit.Legend: must specify a container for the legend");
      return;
    }
    
    /**************************
     * Configurable Properties
     **************************/
    this.map = params.map; // REQUIRED
    this.layerInfos = params.layerInfos;
    this._respectCurrentMapScale = (params.respectCurrentMapScale === false) ? false : true;
    this.arrangement = (params.arrangement === esri.dijit.Legend.ALIGN_RIGHT) ? esri.dijit.Legend.ALIGN_RIGHT : esri.dijit.Legend.ALIGN_LEFT;
    if (this.arrangement === esri.dijit.Legend.ALIGN_RIGHT) {
      this.alignRight = true;
    }
    this.autoUpdate = (params.autoUpdate === false) ? false : true;
    
    this._surfaceItems = [];
  },
  
  startup: function(){
    this.inherited(arguments);
    this._initialize();
    
    if (dojo.isIE) {
      this._repaintItems = dojo.hitch(this, this._repaintItems);
      setTimeout(this._repaintItems, this._ieTimer);
    }
  },
  
  destroy: function(){
    this._deactivate();
    this.inherited(arguments);
  },
  
  /*****************
   * Public Methods
   *****************/
  /* 
   Refresh the legend with a new list of layers.
   Layers is optional, if set it replaces the layers set in the constructor.
   */
  refresh: function(layerInfos){
  
    // a refresh is going on alredy
    if (!this.domNode) {
      return;
    }
    
    // if layerInfos is an empty list treat it as valid layerInfos object
    if (layerInfos) {
      this.layerInfos = layerInfos;
      this.layers = [];
      // save title of each layer in layer object
      dojo.forEach(this.layerInfos, function(layerInfo){
        if (this._isSupportedLayerType(layerInfo.layer)) {
          if (layerInfo.title) {
            layerInfo.layer._titleForLegend = layerInfo.title;
          }
          if (layerInfo.defaultSymbol === false) {
            layerInfo.layer._hideDefaultSymbolInLegend = true;
          }
          if (layerInfo.hideLayers) {
            layerInfo.layer._hideLayersInLegend = layerInfo.hideLayers;
            this._addSubLayersToHide(layerInfo);
          } else {
						layerInfo.layer._hideLayersInLegend = [];
					}
          this.layers.push(layerInfo.layer);
        }
      }, this);
    } else if (this.useAllMapLayers) {
      // build a new list
      this.layerInfos = null;
      this.layers = null;
    }
    
    // destroy all children
    for (var i = this.domNode.children.length - 1; i >= 0; i--) {
      dojo.destroy(this.domNode.children[i]);
    }
    
    this.startup();
  },
  
  /*******************
   * Internal Methods
   *******************/
  _legendUrl: "http://utility.arcgis.com/sharing/tools/legend",
  
  _initialize: function(){
    // if layerInfos is an empty list treat it as valid layerInfos object
    // save title of each layer in layer object
    if (this.layerInfos) {
      this.layers = [];
      dojo.forEach(this.layerInfos, function(layerInfo){
        if (this._isSupportedLayerType(layerInfo.layer)) {
          if (layerInfo.title) {
            layerInfo.layer._titleForLegend = layerInfo.title;
          }
          if (layerInfo.defaultSymbol === false) {
            layerInfo.layer._hideDefaultSymbol = true;
          }
          if (layerInfo.hideLayers) {
            layerInfo.layer._hideLayersInLegend = layerInfo.hideLayers;
            this._addSubLayersToHide(layerInfo);
          } else {
            layerInfo.layer._hideLayersInLegend = [];
          }
          this.layers.push(layerInfo.layer);
        }
      }, this);
    }
    
    this.useAllMapLayers = false;
    if (!this.layers) {
      this.useAllMapLayers = true;
      this.layers = [];
      var kmlLayerIds = [];
      dojo.forEach(this.map.layerIds, function(layerId){
        var layer = this.map.getLayer(layerId);
        if (this._isSupportedLayerType(layer)) {
          if (layer.arcgisProps && layer.arcgisProps.title) {
            layer._titleForLegend = layer.arcgisProps.title;
          }
          this.layers.push(layer);
        }
        if (layer.declaredClass == "esri.layers.KMLLayer") {
          dojo.forEach(layer.getLayers(), function(iLayer){
            kmlLayerIds.push(iLayer.id)
          }, this);
        }
      }, this);
      dojo.forEach(this.map.graphicsLayerIds, function(layerId){
        var layer = this.map.getLayer(layerId);
        // don't list each KML sub layer separately
        if (dojo.indexOf(kmlLayerIds, layerId) == -1) {
          // check drawMode so we don't include layers created for pop-ups        
          if (this._isSupportedLayerType(layer) && layer._params && layer._params.drawMode) {
            if (layer.arcgisProps && layer.arcgisProps.title) {
              layer._titleForLegend = layer.arcgisProps.title;
            }
            this.layers.push(layer);
          }
        }
      }, this);
    }
    
    this._createLegend();
  },
  
  _activate: function(){
    this._deactivate();
    
    if (!this.autoUpdate) {
      return;
    }
    
    if (this._respectCurrentMapScale) {
      this._ozeConnect = dojo.connect(this.map, "onZoomEnd", this, "_refreshLayers");
    }
    
    if (this.useAllMapLayers) {
      this._olaConnect = dojo.connect(this.map, "onLayerAdd", this, "_updateAllMapLayers");
      this._olrConnect = dojo.connect(this.map, "onLayerRemove", this, "_updateAllMapLayers");
      this._olroConnect = dojo.connect(this.map, "onLayersReordered", this, "_updateAllMapLayers");
    }
    
    dojo.forEach(this.layers, function(layer){
      layer.ovcConnect = dojo.connect(layer, "onVisibilityChange", this, "_refreshLayers");
      if (layer.declaredClass === "esri.layers.ArcGISDynamicMapServiceLayer" && layer.supportsDynamicLayers) {
        layer.odcConnect = dojo.connect(layer, "_onDynamicLayersChange", this, "_updateDynamicLayers");
      }
    }, this);
  },
  
  _deactivate: function(){
    if (this._ozeConnect) {
      dojo.disconnect(this._ozeConnect);
    }
    if (this._olaConnect) {
      dojo.disconnect(this._olaConnect);
    }
    if (this._olroConnect) {
      dojo.disconnect(this._olroConnect);
    }
    if (this._olrConnect) {
      dojo.disconnect(this._olrConnect);
    }
    dojo.forEach(this.layers, function(layer){
      if (layer.ovcConnect) {
        dojo.disconnect(layer.ovcConnect);
      }
      if (layer.odcConnect) {
        dojo.disconnect(layer.odcConnect);
      }
    }, this);
  },
  
  _updateDynamicLayers: function(){
    this._dynamicLayerChanged = true;
    this._refreshLayers();
  },
  
  _refreshLayers: function(){
    this.refresh();
  },
  
  _updateAllMapLayers: function(){
  
    this.layers = [];
    dojo.forEach(this.map.layerIds, function(layerId){
      var layer = this.map.getLayer(layerId);
      if (this._isSupportedLayerType(layer)) {
        this.layers.push(layer);
      }
    }, this);
    dojo.forEach(this.map.graphicsLayerIds, function(layerId){
      var layer = this.map.getLayer(layerId);
      // check drawMode so we don't include layers created for pop-ups        
      if (this._isSupportedLayerType(layer) && layer._params && layer._params.drawMode) {
        this.layers.push(layer);
      }
    }, this);
    this.refresh();
  },
  
  _createLegend: function(){
  
    // make sure the symbols scroll with the labels in IE
    dojo.style(this.domNode, "position", "relative");
    
    dojo.create("div", {
      id: this.id + "_msg",
      innerHTML: this.NLS_creatingLegend + "..."
    }, this.domNode);
    
    var legendLayers = [];
    dojo.forEach(this.layers, function(layer){
      if (layer.declaredClass == "esri.layers.KMLLayer") {
        dojo.forEach(layer.getLayers(), function(iLayer){
          if (iLayer.declaredClass == "esri.layers.FeatureLayer" && layer._titleForLegend) {
            iLayer._titleForLegend = layer._titleForLegend + " - ";
            if (iLayer.geometryType == "esriGeometryPoint") {
              iLayer._titleForLegend += "Points";
            } else if (iLayer.geometryType == "esriGeometryPolyline") {
              iLayer._titleForLegend += "Lines";
            } else if (iLayer.geometryType == "esriGeometryPolygon") {
              iLayer._titleForLegend += "Polygons";
            }
            legendLayers.push(iLayer);
          }
        });
      } else {
        legendLayers.push(layer);
      }
    }, this);
    
    var deferreds = [];
    dojo.forEach(legendLayers, function(layer){
      if (layer.visible === true && (layer.layerInfos || layer.renderer)) {
      
        // we create these divs here in order to keep the order of the layers in the legend
        // if one of these layers does not return a legend the div will stay hidden
        var d = dojo.create("div", {
          id: this.id + "_" + layer.id,
          style: "display: none;",
          "class": "esriLegendService"
        });
        dojo.create("span", {
          innerHTML: this._getServiceTitle(layer),
          "class": "esriLegendServiceLabel"
        }, dojo.create("td", {
          align: (this.alignRight ? "right" : "")
        }, dojo.create("tr", {}, dojo.create("tbody", {}, dojo.create("table", {
          width: "95%"
        }, d)))));
        dojo.place(d, this.id, "first");
        
        if (dojo.isIE) {
          // don't do this earlier; byId() returns null
          dojo.style(dojo.byId(this.id + "_" + layer.id), "display", "none");
        }
        
        if ((layer.legendResponse || layer.renderer) && !this._dynamicLayerChanged) {
          // we already have the legend or it's a feature layer with renderer info
          this._createLegendForLayer(layer);
        } else {
          // when the legend has to be recreated from server, call this method.
          // when this._dynamicLayerChanged is true, it means the legend has to be recreated by sending request to server.
          deferreds.push(this._legendRequest(layer));
        }
        this._dynamicLayerChanged = false;
      }
    }, this);
    
    if (deferreds.length === 0) {
      dojo.byId(this.id + "_msg").innerHTML = this.NLS_noLegend;
      this._activate();
    } else {
      var deferredsList = new dojo.DeferredList(deferreds);
      deferredsList.addCallback(dojo.hitch(this, function(response){
        // now all requests have returned
        // if any of the layers show any legend, this div is hidden
        dojo.byId(this.id + "_msg").innerHTML = this.NLS_noLegend;
        this._activate();
      }));
    }
  },
  
  _createLegendForLayer: function(layer){
    if (layer.legendResponse || layer.renderer) {
    
      var foundOne = false;
      if (layer.legendResponse) {
        // it's a Map Service
        dojo.forEach(layer.layerInfos, function(layerInfo, i){
          if (!layer._hideLayersInLegend || dojo.indexOf(layer._hideLayersInLegend, layerInfo.id) == -1) {
            var f = this._buildLegendItems(layer, layerInfo, i);
            foundOne = foundOne || f;
          }
        }, this);
        
      } else if (layer.renderer) {
        // it's a Feature Layer
        var id;
        if (!layer.url) {
          // feature collection
          id = "fc_" + layer.id;
        } else {
          id = layer.url.substring(layer.url.lastIndexOf("/") + 1, layer.url.length);
        }
        var layerInfo = {
          id: id,
          name: null,
          subLayerIds: null,
          parentLayerId: -1
        };
        foundOne = this._buildLegendItems(layer, layerInfo, 0);
      }
      
      if (foundOne) {
        dojo.style(dojo.byId(this.id + "_" + layer.id), "display", "block");
        dojo.style(dojo.byId(this.id + "_msg"), "display", "none");
      }
    }
  },
  
  _legendRequest: function(layer){
    if (!layer.loaded) {
      // we have to wait
      dojo.connect(layer, "onLoad", dojo.hitch(this, "_legendRequest"));
      return;
    }
    if (layer.version >= 10.01) {
      return this._legendRequestServer(layer);
    } else {
      return this._legendRequestTools(layer);
    }
  },
  
  _legendRequestServer: function(layer){
    var url = layer.url;
    var pos = url.indexOf("?");
    if (pos > -1) {
      url = url.substring(0, pos) + "/legend" + url.substring(pos);
    } else {
      url += "/legend";
    }
		
    var token = layer._getToken();
    if (token) {
      url += "?token=" + token;
    }
    
    var processLegendResponse = dojo.hitch(this, "_processLegendResponse");
    
    var params = {};
    params.f = "json";
    if (layer._params.dynamicLayers) {
      params.dynamicLayers = layer._params.dynamicLayers;
      if (params.dynamicLayers === "[{}]") {
        params.dynamicLayers = "[]";
      }
    }
    
    var request = esri.request({
      url: url,
      content: params,
      callbackParamName: "callback",
      load: function(result, args){
        processLegendResponse(layer, result, args);
      },
      error: esriConfig.defaults.io.errorHandler
    });
    return request;
  },
  
  _legendRequestTools: function(layer){
    var p = layer.url.toLowerCase().indexOf("/rest/");
    var soapURL = layer.url.substring(0, p) + layer.url.substring(p + 5, layer.url.length);
    // test error case
    //if (soapURL.indexOf('Gulf_Coast_Fishery_Closure') > -1) {
    //soapURL = soapURL.replace('Gulf_Coast_Fishery_Closure','xxx');																						// "Unable to generate legends: HTTP status code {404 - Service Not Found or Not Started} received from server"		
    //soapURL = soapURL.replace('Gulf_Coast_Fishery_Closure','xxx/Gulf_Coast_Fishery_Closure');									// "Unable to generate legends: HTTP status code {404 - Folder xxx is not found.} received from server"
    //soapURL = soapURL.replace('ArcGIS/services/Gulf_Coast_Fishery_Closure','xxx/Gulf_Coast_Fishery_Closure');	// "Unable to generate legends: HTTP status code {404 - Not Found} received from server"
    //soapURL = soapURL.replace('events.arcgisonline.com','xxx');																						    // "Unable to generate legends: xxx\nUnable to connect to Host: xxx Port: -1"
    //soapURL = soapURL.replace('events.arcgisonline.com','xxx.esri.com');																			// "Unable to generate legends: xxx.esri.com\nUnable to connect to Host: xxx.esri.com Port: -1
    //}
    // legend request
    var url = this._legendUrl + "?soapUrl=" + escape(soapURL);
    // test error case
    //if (url.indexOf('Gulf_Coast_Fishery_Closure') > -1) {
    //	url = url.replace('www.arcgis.com','xxx');	// 
    //}
    if (!dojo.isIE || dojo.isIE > 8) {
      url += "&returnbytes=true";
    }
    
    var processLegendResponse = dojo.hitch(this, "_processLegendResponse");
    
    var params = {};
    params.f = "json";
    var request = esri.request({
      url: url,
      content: params,
      callbackParamName: "callback",
      load: function(result, args){
        processLegendResponse(layer, result, args);
      },
      error: esriConfig.defaults.io.errorHandler
    });
    return request;
  },
  
  _processLegendResponse: function(layer, response){
    if (response && response.layers) {
      layer.legendResponse = response;
      this._createLegendForLayer(layer);
    } else {
      // response is undefined if the legend tool is not available (1 min timeout)
      // if any error happens with the actual ArcGIS server legend call a response.error is returned
      console.log("Legend could not get generated for " + layer.url + ": " + dojo.toJson(response));
    }
  },
  
  _buildLegendItems: function(layer, layerInfo, pos){
    var foundOne = false;
    var mainNode = dojo.byId(this.id + "_" + layer.id);
    var subLayerIds = layerInfo.subLayerIds;
    var parentLayerId = layerInfo.parentLayerId; // -1, or layer id
    if (subLayerIds) {
    
      // only display this group layer name if there is a legend somewhere inside
      var node = dojo.create("div", {
        id: this.id + "_" + layer.id + "_" + layerInfo.id + "_group",
        style: "display: none;",
        "class": (parentLayerId == -1) ? ((pos > 0) ? "esriLegendGroupLayer" : "") : (this.alignRight ? "esriLegendRight" : "esriLegendLeft")
      }, (parentLayerId == -1) ? mainNode : dojo.byId(this.id + "_" + layer.id + "_" + parentLayerId + "_group"));
      if (dojo.isIE) {
        dojo.style(dojo.byId(this.id + "_" + layer.id + "_" + layerInfo.id + "_group"), "display", "none");
      }
      dojo.create("td", {
        innerHTML: layerInfo.name.replace(/[\<]/g, "&lt;").replace(/[\>]/g, "&gt;"),
        align: (this.alignRight ? "right" : "")
      }, dojo.create("tr", {}, dojo.create("tbody", {}, dojo.create("table", {
        width: "95%",
        "class": "esriLegendLayerLabel"
      }, node))));
      
    } else {
    
      if (layer.visibleLayers && ("," + layer.visibleLayers + ",").indexOf("," + layerInfo.id + ",") == -1) {
        // layer is not visible in map
        return foundOne;
      }
      
      // only display this layer name if there is a legend
      // we have to create this div now, otherwise the gfx symbols won't draw
      var d = dojo.create("div", {
        id: this.id + "_" + layer.id + "_" + layerInfo.id,
        style: "display:none;",
        "class": (parentLayerId > -1) ? (this.alignRight ? "esriLegendRight" : "esriLegendLeft") : ""
      }, (parentLayerId == -1) ? mainNode : dojo.byId(this.id + "_" + layer.id + "_" + parentLayerId + "_group"));
      if (dojo.isIE) {
        dojo.style(dojo.byId(this.id + "_" + layer.id + "_" + layerInfo.id), "display", "none");
      }
      dojo.create("td", {
        innerHTML: (layerInfo.name) ? layerInfo.name.replace(/[\<]/g, "&lt;").replace(/[\>]/g, "&gt;") : "",
        align: (this.alignRight ? "right" : "")
      }, dojo.create("tr", {}, dojo.create("tbody", {}, dojo.create("table", {
        width: "95%",
        "class": "esriLegendLayerLabel"
      }, d))));
      
      if (layer.legendResponse) {
        foundOne = foundOne || this._buildLegendItems_Tools(layer, layerInfo, d);
      } else if (layer.renderer) {
        foundOne = foundOne || this._buildLegendItems_Renderer(layer, layerInfo, d);
      }
    }
    return foundOne;
  },
  
  _buildLegendItems_Tools: function(layer, layerInfo, node){
    // ArcGIS.com tools legend
    var parentLayerId = layerInfo.parentLayerId; // -1, or layer id
    var mapScale = esri.geometry.getScale(this.map);
    var foundOne = false;
    
    if (!this._respectCurrentMapScale || (this._respectCurrentMapScale && this._isLayerInScale(layer, layerInfo, mapScale))) {
    
      for (var i = 0; i < layer.legendResponse.layers.length; i++) {
        if (layerInfo.id == layer.legendResponse.layers[i].layerId) {
          var legend = layer.legendResponse.layers[i].legend;
          // raster layer legend: [{"label":"Red:Band_1","url":"http://...png","imageData":""},{"label":"Green:Band_2","url":"http://...png","imageData":""},{"label":"Blue:Band_3","url":"http://...png","imageData":""}]}
          if (legend.length == 3 && legend[0].label.replace(/\s+/g, '').indexOf(":Band_") > -1) {
            // raster layer
          } else {
            var tableBody = dojo.create("tbody", {}, dojo.create("table", {
              cellpadding: 0,
              cellspacing: 0,
              width: "95%",
              "class": "esriLegendLayer"
            }, node));
            
            dojo.forEach(legend, function(legendItem){
              if ((legendItem.url && legendItem.url.indexOf("http") === 0) || (legendItem.imageData && legendItem.imageData.length > 0)) {
                foundOne = true;
                this._buildRow_Tools(legendItem, tableBody, layer, layerInfo.id);
              }
            }, this);
          }
          break;
        }
      }
    }
    
    if (foundOne) {
      // only display layer name and group layer name if there is at least one legend
      dojo.style(dojo.byId(this.id + "_" + layer.id + "_" + layerInfo.id), "display", "block");
      if (parentLayerId > -1) {
        dojo.style(dojo.byId(this.id + "_" + layer.id + "_" + parentLayerId + "_group"), "display", "block");
        this._findParentGroup(layer.id, layer, parentLayerId);
      }
    }
    
    return foundOne;
  },
  
  _buildRow_Tools: function(legend, table, layer, subLayerId){
  
    var tr = dojo.create("tr", {}, table);
    
    var labelTD;
    var imageTD;
    if (this.alignRight) {
      labelTD = dojo.create("td", {
        align: "right"
      }, tr);
      imageTD = dojo.create("td", {
        align: "right",
        width: 35
      }, tr);
    } else {
      imageTD = dojo.create("td", {
        width: 35
      }, tr);
      labelTD = dojo.create("td", {}, tr);
    }
    
    var src = legend.url;
    if ((!dojo.isIE || dojo.isIE > 8) && legend.imageData && legend.imageData.length > 0) {
      // <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsA���A4u4ZIibnkFcAAAAASUVORK5CYII="/>
      src = "data:image/png;base64," + legend.imageData;
    } else if (legend.url.indexOf("http") !== 0) {
      // ArcGIS server legend
      src = layer.url + "/" + subLayerId + "/images/" + legend.url;
      var token = layer._getToken();
      if (token) {
        src += "?token=" + token;
      }
    } // else arcgis.com legend returns full URL to swatch
    var img = dojo.create("img", {
      src: src,
      border: 0,
      style: "opacity:" + layer.opacity
    }, imageTD);
    
    dojo.create("td", {
      innerHTML: legend.label.replace(/[\<]/g, "&lt;").replace(/[\>]/g, "&gt;"),
      align: (this.alignRight ? "right" : "")
    }, dojo.create("tr", {}, dojo.create("tbody", {}, dojo.create("table", {
      width: "95%",
      dir: "ltr"
    }, labelTD))));
    
    if (dojo.isIE < 9) {
      // it seems we have to add this setting here, later 
      img.style.filter = "alpha(opacity=" + (layer.opacity * 100) + ")";
    }
  },
  
  _buildLegendItems_Renderer: function(layer, layerInfo, node){
  
    var parentLayerId = layerInfo.parentLayerId; // -1, or layer id
    var mapScale = esri.geometry.getScale(this.map);
    var foundOne = false;
    
    if (!this._respectCurrentMapScale || this._isLayerInScale(layer, layerInfo, mapScale)) {
    
      var tableBody;
      if (layer.renderer instanceof esri.renderer.UniqueValueRenderer) {
        if (layer.renderer.infos && layer.renderer.infos.length > 0) {
          foundOne = true;
          tableBody = dojo.create("tbody", {}, dojo.create("table", {
            cellpadding: 0,
            cellspacing: 0,
            width: "95%",
            "class": "esriLegendLayer"
          }, node));
          dojo.forEach(layer.renderer.infos, function(uniqueValue, index){
            var template = null;
            if (layer._editable && layer.types) {
              template = this._getTemplateFromTypes(layer.types, uniqueValue.value);
            }
            //console.log(template?template.drawingTool:"null");      
            var label = uniqueValue.label;
            if (!label || label.length === 0) {
              label = uniqueValue.value;
            }
            this._buildRow_Renderer(layer, uniqueValue.symbol, label, template, tableBody);
          }, this);
        }
      }
      if (layer.renderer instanceof esri.renderer.ClassBreaksRenderer) {
        /*
         "infos":[
         {
         "minValue":1065335,
         "maxValue":15554934.6,
         "symbol":{"style":"solid","outline":{"width":1,"style":"solid","color":{"r":255,"g":0,"b":0,"a":0.5},"type":"simplelinesymbol","_styles":{"solid":"esriSLSSolid","dash":"esriSLSDash","dot":"esriSLSDot","dashdot":"esriSLSDashDot","longdashdotdot":"esriSLSDashDotDot","none":"esriSLSNull","insideframe":"esriSLSInsideFrame"},"declaredClass":"esri.symbol.SimpleLineSymbol","_stroke":null,"_fill":null},
         "color":{"r":255,"g":200,"b":0,"a":0.5},
         "type":"simplefillsymbol",
         "_styles":{"solid":"esriSFSSolid","none":"esriSFSNull","horizontal":"esriSFSHorizontal","vertical":"esriSFSVertical","forwarddiagonal":"esriSFSForwardDiagonal","backwarddiagonal":"esriSFSBackwardDiagonal","cross":"esriSFSCross","diagonalcross":"esriSFSDiagonalCross"},
         "declaredClass":"esri.symbol.SimpleFillSymbol","_stroke":null,"_fill":null}
         }
         ]
         */
        if (layer.renderer.infos && layer.renderer.infos.length > 0) {
          foundOne = true;
          tableBody = dojo.create("tbody", {}, dojo.create("table", {
            cellpadding: 0,
            cellspacing: 0,
            width: "95%",
            "class": "esriLegendLayer"
          }, node));
          dojo.forEach(layer.renderer.infos, function(classBreak, index){
            var label = classBreak.label;
            if (!label || label.length === 0) {
              label = classBreak.minValue + " - " + classBreak.maxValue;
            }
            this._buildRow_Renderer(layer, classBreak.symbol, label, null, tableBody);
          }, this);
        }
      }
      if (layer.renderer instanceof esri.renderer.SimpleRenderer) {
        foundOne = true;
        tableBody = dojo.create("tbody", {}, dojo.create("table", {
          cellpadding: 0,
          cellspacing: 0,
          width: "95%",
          "class": "esriLegendLayer"
        }, node));
        var template = null;
        if (layer._editable && layer.templates && layer.templates.length > 0) {
          template = layer.templates[0];
        }
        this._buildRow_Renderer(layer, layer.renderer.symbol, layer.renderer.label, template, tableBody);
      }
      if (!layer._hideDefaultSymbol && layer.renderer.defaultSymbol) {
        foundOne = true;
        tableBody = dojo.create("tbody", {}, dojo.create("table", {
          cellpadding: 0,
          cellspacing: 0,
          width: "95%",
          "class": "esriLegendLayer"
        }, node));
        this._buildRow_Renderer(layer, layer.renderer.defaultSymbol, layer.renderer.defaultLabel ? layer.renderer.defaultLabel : "others", null, tableBody);
      }
    }
    
    if (foundOne) {
      // only display layer name and group layer name if there is at least one legend
      dojo.style(dojo.byId(this.id + "_" + layer.id + "_" + layerInfo.id), "display", "block");
      if (parentLayerId > -1) {
        dojo.style(dojo.byId(this.id + "_" + layer.id + "_" + parentLayerId + "_group"), "display", "block");
        this._findParentGroup(layer.id, parentLayerId);
      }
    }
    
    return foundOne;
  },
  
  _buildRow_Renderer: function(layer, symbol, label, template, table){
  
    var tr = dojo.create("tr", {}, table);
    var labelTD;
    var imageTD;
    if (this.alignRight) {
      labelTD = dojo.create("td", {
        align: "right"
      }, tr);
      imageTD = dojo.create("td", {
        align: "right",
        width: 35
      }, tr);
    } else {
      imageTD = dojo.create("td", {
        width: 35
      }, tr);
      labelTD = dojo.create("td", {}, tr);
    }
    
    var space = 30;
    // show point symbols in their actual size
    if (symbol.type == "simplemarkersymbol") {
      // extra padding for the outline width
      space = Math.min(Math.max(space, symbol.size + 12), 125);
    } else if (symbol.type == "picturemarkersymbol") {
      space = Math.min(Math.max(space, symbol.width), 125);
    }
    var div = dojo.create("div", {
      style: "width:" + space + "px;height:" + space + "px;"
    }, imageTD);
    dojo.create("td", {
      innerHTML: label ? label.replace(/[\<]/g, "&lt;").replace(/[\>]/g, "&gt;").replace(/^#/, '') : "",
      align: (this.alignRight ? "right" : "")
    }, dojo.create("tr", {}, dojo.create("tbody", {}, dojo.create("table", {
      width: "95%"
    }, labelTD))));
    var surface = this._drawSymbol(div, symbol, space, space, template, layer.opacity);
    this._surfaceItems.push(surface);
  },
  
  _drawSymbol: function(node, sym, sWidth, sHeight, template, layerOpacity){
    /* old
     var surface = dojox.gfx.createSurface(node, sWidth, sHeight);
     var descriptors = esri.symbol.getShapeDescriptors(symbol);
     var shape = surface.createShape(descriptors.defaultShape).setFill(descriptors.fill).setStroke(descriptors.stroke);
     shape.applyTransform({
     dx: (sWidth / 2),
     dy: (sHeight / 2)
     }); // center the shape at coordinates (25, 25)
     return surface;
     */
    // apply layer opacity, but don't change the original symbol
    var symbol = esri.symbol.fromJson(sym.toJson());
    if (symbol.type === "simplelinesymbol" || symbol.type === "cartographiclinesymbol" || symbol.type === "textsymbol") {
			if (!symbol.color) {
				return;
			}
      var rgba = symbol.color.toRgba();
      rgba[3] = rgba[3] * layerOpacity;
      symbol.color.setColor(rgba);
    } else if (symbol.type === "simplemarkersymbol" || symbol.type === "simplefillsymbol") {
      if (!symbol.color) {
        return;
      }
      var rgba = symbol.color.toRgba();
      rgba[3] = rgba[3] * layerOpacity;
      symbol.color.setColor(rgba);
      if (symbol.outline && symbol.outline.color) {
        rgba = symbol.outline.color.toRgba();
        rgba[3] = rgba[3] * layerOpacity;
        symbol.outline.color.setColor(rgba);
      }
    } else if (symbol.type === "picturemarkersymbol") {
      node.style.opacity = layerOpacity;
      /* For IE8 and earlier */
      node.style.filter = "alpha(opacity=(" + layerOpacity * 100 + "))";
      //} else if (symbol.type === "picturefillsymbol") {
    }
    
    var surface = dojox.gfx.createSurface(node, sWidth, sHeight);
    if (dojo.isIE) {
      // Fixes an issue in IE where the shape is partially drawn and
      // positioned to the right of the table cell  
      var source = surface.getEventSource();
      dojo.style(source, "position", "relative");
      dojo.style(source.parentNode, "position", "relative");
    }
    var shapeDesc = this._getDrawingToolShape(symbol, template) || esri.symbol.getShapeDescriptors(symbol);
    
    var gfxShape;
    try {
      gfxShape = surface.createShape(shapeDesc.defaultShape).setFill(shapeDesc.fill).setStroke(shapeDesc.stroke);
    } 
    catch (e) {
      surface.clear();
      surface.destroy();
      return;
    }
    
    var dim = surface.getDimensions();
    var transform = {
      dx: dim.width / 2,
      dy: dim.height / 2
    };
    
    var bbox = gfxShape.getBoundingBox(), width = bbox.width, height = bbox.height;
    if (width > sWidth || height > sHeight) {
      var actualSize = width > height ? width : height;
      var refSize = sWidth < sHeight ? sWidth : sHeight;
      var scaleBy = (refSize - 5) / actualSize;
      dojo.mixin(transform, {
        xx: scaleBy,
        yy: scaleBy
      });
    }
    
    gfxShape.applyTransform(transform);
    return surface;
  },
  
  _getDrawingToolShape: function(symbol, template){
    var shape, drawingTool = template ? template.drawingTool || null : null;
    switch (drawingTool) {
      case "esriFeatureEditToolArrow":
        shape = {
          type: "path",
          path: "M 10,1 L 3,8 L 3,5 L -15,5 L -15,-2 L 3,-2 L 3,-5 L 10,1 E"
        };
        break;
      case "esriFeatureEditToolTriangle":
        shape = {
          type: "path",
          path: "M -10,14 L 2,-10 L 14,14 L -10,14 E"
        };
        break;
      case "esriFeatureEditToolRectangle":
        shape = {
          type: "path",
          path: "M -10,-10 L 10,-10 L 10,10 L -10,10 L -10,-10 E"
        };
        break;
      case "esriFeatureEditToolCircle":
        shape = {
          type: "circle",
          cx: 0,
          cy: 0,
          r: 10
        };
        break;
      case "esriFeatureEditToolEllipse":
        shape = {
          type: "ellipse",
          cx: 0,
          cy: 0,
          rx: 10,
          ry: 5
        };
        break;
      default:
        return null;
    }
    return {
      defaultShape: shape,
      fill: symbol.getFill(),
      stroke: symbol.getStroke()
    };
  },
  
  _repaintItems: function(){
    dojo.forEach(this._surfaceItems, function(surface){
      this._repaint(surface);
    }, this);
  },
  
  _repaint: function(shape){
    if (!shape) {
      return;
    }
    if (shape.getStroke && shape.setStroke) {
      shape.setStroke(shape.getStroke());
    }
    
    try {
      if (shape.getFill && shape.setFill) {
        shape.setFill(shape.getFill());
      }
    } 
    catch (e) {
    }
    
    if (shape.children && dojo.isArray(shape.children)) {
      dojo.forEach(shape.children, this._repaint, this);
    }
  },
  
  _getTemplateFromTypes: function(types, value){
    for (var i = 0; i < types.length; i++) {
      if (types[i].id == value && types[i].templates && types[i].templates.length > 0) {
        return types[i].templates[0];
      }
    }
    return null;
  },
  
  _findParentGroup: function(serviceId, layer, parentLayerId){
    var layerInfos = layer.layerInfos;
    for (var k = 0; k < layerInfos.length; k++) {
      if (parentLayerId == layerInfos[k].id) {
      
        if (layerInfos[k].parentLayerId > -1) {
          dojo.style(dojo.byId(this.id + "_" + serviceId + "_" + layerInfos[k].parentLayerId + "_group"), "display", "block");
          this._findParentGroup(serviceId, layer, layerInfos[k].parentLayerId);
        }
        break;
      }
    }
  },
  
  _addSubLayersToHide: function(layerInfo){
    // add all sub layers of these layers into the list
    dojo.forEach(layerInfo.layer._hideLayersInLegend, function(layerId){
      for (var i = 0; i < layerInfo.layer.layerInfos.length; i++) {
        if (layerInfo.layer.layerInfos[i].id === layerId && layerInfo.layer.layerInfos[i].subLayerIds) {
          dojo.forEach(layerInfo.layer.layerInfos[i].subLayerIds, function(subLayerId){
            if (dojo.indexOf(layerInfo.layer._hideLayersInLegend, subLayerId) === -1) {
              layerInfo.layer._hideLayersInLegend.push(subLayerId);
            }
          });
        }
      }
    });
  },
  
  _isLayerInScale: function(layer, layerInfo, mapScale){
    var inScale = true;
    if (layer.legendResponse && layer.legendResponse.layers) {
      // ArcGIS.com tools legend
      for (var i = 0; i < layer.legendResponse.layers.length; i++) {
        var legendResponse = layer.legendResponse.layers[i];
        if (layerInfo.id == legendResponse.layerId) {
          // for tiled layers we have to also take into consideration the scale range of the layer
          if (legendResponse.minScale == 0 && layer.tileInfo) {
            legendResponse.minScale = layer.tileInfo.lods[0].scale + 1;
          }
          if (legendResponse.maxScale == 0 && layer.tileInfo) {
            legendResponse.maxScale = layer.tileInfo.lods[layer.tileInfo.lods.length - 1].scale - 1;
          }
          if ((legendResponse.minScale > 0 && legendResponse.minScale < mapScale) || legendResponse.maxScale > mapScale) {
            inScale = false;
          }
          break;
        }
      }
    } else if (layer.minScale || layer.maxScale) {
      // Feature Layer
      if ((layer.minScale && layer.minScale < mapScale) || layer.maxScale && layer.maxScale > mapScale) {
        inScale = false;
      }
    }
    return inScale;
  },
  
  _getServiceTitle: function(layer){
  
    // did user set a title?
    var serviceTitle = layer._titleForLegend;
    if (!serviceTitle) {
      // no, then use service name
      serviceTitle = layer.url;
      if (!layer.url) {
        // feature collection
        serviceTitle = "";
      } else if (layer.url.indexOf("/MapServer") > -1) {
        serviceTitle = layer.url.substring(0, layer.url.indexOf("/MapServer"));
        serviceTitle = serviceTitle.substring(serviceTitle.lastIndexOf("/") + 1, serviceTitle.length);
      } else if (layer.url.indexOf("/ImageServer") > -1) {
        serviceTitle = layer.url.substring(0, layer.url.indexOf("/ImageServer"));
        serviceTitle = serviceTitle.substring(serviceTitle.lastIndexOf("/") + 1, serviceTitle.length);
      } else if (layer.url.indexOf("/FeatureServer") > -1) {
        serviceTitle = layer.url.substring(0, layer.url.indexOf("/FeatureServer"));
        serviceTitle = serviceTitle.substring(serviceTitle.lastIndexOf("/") + 1, serviceTitle.length);
      }
      if (layer.name) {
        if (serviceTitle.length > 0) {
          serviceTitle += " - " + layer.name;
        } else {
          serviceTitle = layer.name;
        }
      }
    }
    // dojox.html.entities.encode so we see Umlauts
    return dojox.html.entities.encode(serviceTitle);
  },
  
  _isSupportedLayerType: function(layer){
  
    if (layer && (layer.declaredClass === "esri.layers.ArcGISDynamicMapServiceLayer" || layer.declaredClass === "esri.layers.ArcGISTiledMapServiceLayer" || layer.declaredClass === "esri.layers.FeatureLayer" || layer.declaredClass == "esri.layers.KMLLayer")) {
      return true;
    }
    return false;
  }
  
});

// mixin enums for Legend
dojo.mixin(esri.dijit.Legend, {
  ALIGN_LEFT: 0,
  ALIGN_RIGHT: 1
});

});
