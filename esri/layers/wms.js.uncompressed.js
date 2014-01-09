//>>built
// wrapped by build app
define("esri/layers/wms", ["dijit","dojo","dojox","dojo/require!esri/layers/dynamic,esri/layers/agscommon"], function(dijit,dojo,dojox){
dojo.provide("esri.layers.wms");

dojo.require("esri.layers.dynamic");
dojo.require("esri.layers.agscommon");

dojo.declare("esri.layers.WMSLayer", [esri.layers.DynamicMapServiceLayer], {

  _CRS_TO_EPSG: {
    84: 4326,
    83: 4269,
    27: 4267
  },
  _REVERSED_LAT_LONG_RANGES: [[4001, 4999], [2044, 2045], [2081, 2083], [2085, 2086], [2093, 2093], [2096, 2098], [2105, 2132], [2169, 2170], [2176, 2180], [2193, 2193], [2200, 2200], [2206, 2212], [2319, 2319], [2320, 2462], [2523, 2549], [2551, 2735], [2738, 2758], [2935, 2941], [2953, 2953], [3006, 3030], [3034, 3035], [3058, 3059], [3068, 3068], [3114, 3118], [3126, 3138], [3300, 3301], [3328, 3335], [3346, 3346], [3350, 3352], [3366, 3366], [3416, 3416], [20004, 20032], [20064, 20092], [21413, 21423], [21473, 21483], [21896, 21899], [22171, 22177], [22181, 22187], [22191, 22197], [25884, 25884], [27205, 27232], [27391, 27398], [27492, 27492], [28402, 28432], [28462, 28492], [30161, 30179], [30800, 30800], [31251, 31259], [31275, 31279], [31281, 31290], [31466, 31700]],
  
  _WEB_MERCATOR: [102100, 3857, 102113, 900913],
  _WORLD_MERCATOR: [3395, 54004],
  
  // stores all extents available in the capabilites response
  // position 0 contains the LatLonBoundingBox/EX_GeographicBoundingBox
  allExtents: [],
  
  constructor: function(url, options){
  
    url = this._stripParameters(url, ['version', 'service', 'request', 'bbox', 'format', 'height', 'width', 'layers', 'srs', 'crs', 'styles', 'transparent', 'bgcolor', 'exceptions', 'time', 'elevation', 'sld', 'wfs']);
    this.url = url;
    this._url = esri.urlToObject(url);
    this._getCapabilitiesURL = url;
    
    this._initLayer = dojo.hitch(this, this._initLayer);
    this._parseCapabilities = dojo.hitch(this, this._parseCapabilities);
    this._getCapabilitiesError = dojo.hitch(this, this._getCapabilitiesError);
    
    if (options) {
      this.imageFormat = this._getImageFormat(options.format);
      this.imageTransparency = (options.transparent === false) ? false : true;
      this.visibleLayers = options.visibleLayers ? options.visibleLayers : [];
      if (options.resourceInfo) {
        this._readResourceInfo(options.resourceInfo);
      } else {
        this._getCapabilities();
      }
    } else {
      this.imageFormat = "image/png";
      this.imageTransparency = true;
      this.visibleLayers = [];
      this._getCapabilities();
    }
    
    this._blankImageURL = require.toUrl("esri/layers") + "/../../../images/pixel.png";
    //before dojo 1.7    this._blankImageURL = dojo.moduleUrl("esri", "../../images/pixel.png").uri;
  },
  
  setVisibleLayers: function(visibleLayers){
  
    visibleLayers = this._checkVisibleLayersList(visibleLayers);
    this.visibleLayers = (visibleLayers) ? visibleLayers : [];
    this.refresh(true);
  },
  
  setImageFormat: function(format){
    this.imageFormat = this._getImageFormat(format);
    this.refresh(true);
  },
  
  setImageTransparency: function(transparent){
    this.imageTransparency = transparent;
    this.refresh(true);
  },
  
  getImageUrl: function(extent, width, height, callback){
  
    if (!this.visibleLayers || this.visibleLayers.length === 0) {
      callback(this._blankImageURL);
      return;
    }
    
    // check if spatial reference in extent matches one of the service supported spatial references in case of Web Mercator
    var wkid = extent.spatialReference.wkid;
    if (dojo.some(this._WEB_MERCATOR, function(el){
      return el == wkid;
    })) {
      // extent is in Web Mercator
      var common = dojo.filter(this.spatialReferences, function(el){
        return (dojo.some(this._WEB_MERCATOR, function(el2){
          return el2 == el;
        }));
      }, this);
      if (common.length == 0) {
        // try world mercator
        common = dojo.filter(this.spatialReferences, function(el){
          return (dojo.some(this._WORLD_MERCATOR, function(el2){
            return el2 == el;
          }));
        }, this);
      }
      if (common.length > 0) {
        // make sure we use a service supported id for Web/World Mercator
        wkid = common[0];
      } else {
        // extent is in none of the service supported ids; use the first Mercator id then and hope for the best
        wkid = this._WEB_MERCATOR[0];
      }
    } // else extent not in Web Mercator
    // move used wkid to first position in spatialReferences list
    var list = dojo.filter(this.spatialReferences, function(el){
      return el !== wkid;
    });
    this.spatialReferences = list;
    this.spatialReferences.unshift(wkid);
    // we don't want to modify the extent object
    var xmin = extent.xmin;
    var xmax = extent.xmax;
    var ymin = extent.ymin;
    var ymax = extent.ymax;
    
    var urlVariables = {};
    urlVariables.SERVICE = "WMS";
    urlVariables.REQUEST = "GetMap";
    urlVariables.FORMAT = this.imageFormat;
    urlVariables.TRANSPARENT = this.imageTransparency ? "TRUE" : "FALSE";
    urlVariables.STYLES = "";
    urlVariables.VERSION = this.version;
    urlVariables.LAYERS = this.visibleLayers ? this.visibleLayers.toString() : null;
    
    // map size
    urlVariables.WIDTH = width;
    urlVariables.HEIGHT = height;
    if (this.maxWidth < width) {
      // change image width and then stretch image
      urlVariables.WIDTH = this.maxWidth;
    }
    if (this.maxHeight < height) {
      // change image height and then stretch image
      urlVariables.HEIGHT = this.maxHeight;
    }
    
    // spatial reference
    var extentWKID = wkid ? wkid : NaN;
    if (!isNaN(extentWKID)) {
      if (this.version == "1.3.0") {
        urlVariables.CRS = "EPSG:" + extentWKID;
      } else {
        urlVariables.SRS = "EPSG:" + extentWKID;
      }
    }
    
    // extent
    if (this.version == "1.3.0" && this._useLatLong(extentWKID)) {
      urlVariables.BBOX = ymin + "," + xmin + "," + ymax + "," + xmax;
    } else {
      urlVariables.BBOX = xmin + "," + ymin + "," + xmax + "," + ymax;
    }
    
    var requestString = this.getMapURL;
    requestString += (requestString.indexOf("?") == -1) ? "?" : "";
    for (var key in urlVariables) {
      requestString += (requestString.substring(requestString.length - 1, requestString.length) == "?") ? "" : "&";
      requestString += key + "=" + urlVariables[key];
    }
    callback(requestString);
  },
  
  _initLayer: function(response, io){
  
    this.spatialReference = new esri.SpatialReference(this.extent.spatialReference);
    this.initialExtent = new esri.geometry.Extent(this.extent);
    this.fullExtent = new esri.geometry.Extent(this.extent);
    
    this.visibleLayers = this._checkVisibleLayersList(this.visibleLayers);
    
    this.loaded = true;
    this.onLoad(this);
    
    var callback = this._loadCallback;
    if (callback) {
      delete this._loadCallback;
      callback(this);
    }
  },
  
  _readResourceInfo: function(resourceInfo){
  
    // required parameters
    if (!resourceInfo.extent) {
      console.error("esri.layers.WMSLayer: unable to find the 'extent' property in resourceInfo");
      return;
    }
    if (!resourceInfo.layerInfos) {
      console.error("esri.layers.WMSLayer: unable to find the 'layerInfos' property in resourceInfo");
      return;
    }
    this.extent = resourceInfo.extent;
    this.allExtents[0] = resourceInfo.extent;
    this.layerInfos = resourceInfo.layerInfos;
    
    // optional parameters
    this.description = resourceInfo.description ? resourceInfo.description : "";
    this.copyright = resourceInfo.copyright ? resourceInfo.copyright : "";
    this.title = resourceInfo.title ? resourceInfo.title : "";
    this.getMapURL = resourceInfo.getMapURL ? resourceInfo.getMapURL : this._getCapabilitiesURL;
    this.version = resourceInfo.version ? resourceInfo.version : "1.3.0";
    this.maxWidth = resourceInfo.maxWidth ? resourceInfo.maxWidth : 5000;
    this.maxHeight = resourceInfo.maxHeight ? resourceInfo.maxHeight : 5000;
    this.spatialReferences = resourceInfo.spatialReferences ? resourceInfo.spatialReferences : [];
    this.imageFormat = this._getImageFormat(resourceInfo.format);
    
    this._initLayer();
  },
  
  _getCapabilities: function(){
    var params = this._url.query ? this._url.query : {};
    params.SERVICE = "WMS";
    params.REQUEST = "GetCapabilities";
    // we need the params in the URL, otherwise it doesn't work
    var uri = this._url.path + "?";
    for (var key in params) {
      uri += (uri.substring(uri.length - 1, uri.length) == "?") ? "" : "&";
      uri += key + "=" + params[key];
    }
    var requestHandle = esri.request({
      url: uri,
      handleAs: "xml",
      load: this._parseCapabilities,
      error: this._getCapabilitiesError
    }, {
      usePost: false
    });
    // work around until esri.request is fixed to do dojo.xhr get when handleAs is xml.  Currently request is a dynamic script tag which doesn't support handling xml.
    //var requestHandle = dojo.xhr("GET", {
    //  url: esri.config.defaults.io.proxyUrl + "?" + uri,
    //  handleAs: "xml",
    //  load: this._parseCapabilities,
    //  error: this._getCapabilitiesError
    //});   fixed esri.request on June 21st, remove workaround
  },
  
  _parseCapabilities: function(xml){
    if (!xml) {
      this.onError("GetCapabilities request for " + this._getCapabilitiesURL + " failed. (Response is null.)");
      return;
    }
    this.version = this._getAttributeValue("WMS_Capabilities", "version", xml, null);
    if (!this.version) {
      this.version = this._getAttributeValue("WMT_MS_Capabilities", "version", xml, "1.3.0");
    }
    var service = this._getTag("Service", xml);
    this.title = this._getTagValue("Title", service, "");
    if (!this.title || this.title.length == 0) {
      this.title = this._getTagValue("Name", service, "");
    }
    this.copyright = this._getTagValue("AccessConstraints", service, "");
    this.description = this._getTagValue("Abstract", service, "");
    this.maxWidth = parseInt(this._getTagValue("MaxWidth", service, 5000));
    this.maxHeight = parseInt(this._getTagValue("MaxHeight", service, 5000));
    
    // get extent and list of layers
    var layerXML = this._getTag("Layer", xml);
    if (!layerXML) {
      this._getCapabilitiesError({
        "error": {
          "message": "Response does not contain any layers."
        }
      });
      return;
    }
    var rootLayerInfo = this._getLayerInfo(layerXML);
    if (rootLayerInfo) {
      this.layerInfos = rootLayerInfo.subLayers;
      if (!this.layerInfos || this.layerInfos.length == 0) {
        // we only have the root layer
        this.layerInfos = [rootLayerInfo];
      }
      this.extent = rootLayerInfo.extent;
      this.allExtents = rootLayerInfo.allExtents;
      this.spatialReferences = rootLayerInfo.spatialReferences; 
			// maybe the root layer didn't have any spatial reference info
			if (this.spatialReferences.length == 0 && this.layerInfos.length > 0) {
				this.spatialReferences = this.layerInfos[0].spatialReferences;
			} 
    }
    
    // get endpoint for GetMap requests
    this.getMapURL = this._getCapabilitiesURL;
    var dcpXML = dojo.query("DCPType", this._getTag("GetMap", xml));
    if (dcpXML && dcpXML.length > 0) {
      var httpXML = dojo.query("HTTP", dcpXML[0]);
      if (httpXML && httpXML.length > 0) {
        var getXML = dojo.query("Get", httpXML[0]);
        if (getXML && getXML.length > 0) {
          var getMapHREF = this._getAttributeValue("OnlineResource", "xlink:href", getXML[0], null);
          if (getMapHREF) {
            if (getMapHREF.indexOf("&") == (getMapHREF.length - 1)) {
              // remove trailing &
              getMapHREF = getMapHREF.substring(0, getMapHREF.length - 1);
            }
            this.getMapURL = getMapHREF;
          }
        }
      }
    }
    
    // get supported GetMap formats
    this.getMapFormats = [];
		if (dojo.query("Operation", xml).length == 0){
	    dojo.forEach(dojo.query("Format", this._getTag("GetMap", xml)), function(format){
	      this.getMapFormats.push(format.text ? format.text : format.textContent);
	    }, this);
		} else {
      dojo.forEach(dojo.query("Operation", xml), function(operation){
				if (operation.getAttribute("name") == "GetMap") {
		      dojo.forEach(dojo.query("Format", operation), function(format){
		        this.getMapFormats.push(format.text ? format.text : format.textContent);
		      }, this);
				}
      }, this);
		}
    // make sure the format we want is supported; otherwise switch
    if (!dojo.some(this.getMapFormats, function(el){
			// also support: <Format>image/png; mode=24bit</Format>
      return el.indexOf(this.imageFormat) > -1;
    }, this)) {
      this.imageFormat = this.getMapFormats[0];
    }
    
    this._initLayer();
  },
  
  _getCapabilitiesError: function(response, io){
    this.onError("GetCapabilities request for " + this._getCapabilitiesURL + " failed. (" + dojo.toJson(response) + ")");
  },
  
  _getLayerInfo: function(layerXML){
  
    if (!layerXML) {
      return null;
    }
    
    var result = new esri.layers.WMSLayerInfo();
    result.name = "";
    result.title = "";
    result.description = "";
    result.allExtents = [];
    result.spatialReferences = [];
    result.subLayers = []; // not sure why this has to be done
    // all services have LatLonBoundingBox or EX_GeographicBoundingBox (might not be on the first layer ...)
    var latLonBoundingBox = this._getTag("LatLonBoundingBox", layerXML);
    if (latLonBoundingBox) {
      result.allExtents[0] = this._getExtent(latLonBoundingBox, 4326);
    }
    var geographicBoundingBox = this._getTag("EX_GeographicBoundingBox", layerXML);
    if (geographicBoundingBox) {
      var extent = new esri.geometry.Extent(0, 0, 0, 0, new esri.SpatialReference({
        wkid: 4326
      }));
      extent.xmin = parseFloat(this._getTagValue("westBoundLongitude", geographicBoundingBox, 0));
      extent.ymin = parseFloat(this._getTagValue("southBoundLatitude", geographicBoundingBox, 0));
      extent.xmax = parseFloat(this._getTagValue("eastBoundLongitude", geographicBoundingBox, 0));
      extent.ymax = parseFloat(this._getTagValue("northBoundLatitude", geographicBoundingBox, 0));
      result.allExtents[0] = extent;
    }
    result.extent = result.allExtents[0];
    
    //var srAttrName = (this.version == "1.3.0") ? "CRS" : "SRS";
    var srAttrName = (dojo.indexOf(["1.0.0","1.1.0","1.1.1"],this.version) > -1) ? "SRS" : "CRS";
    dojo.forEach(layerXML.childNodes, function(childNode){
      if (childNode.nodeName == "Name") {
        // unique name
        result.name = (childNode.text ? childNode.text : childNode.textContent) || "";
      } else if (childNode.nodeName == "Title") {
        // title
        result.title = (childNode.text ? childNode.text : childNode.textContent) || "";
      } else if (childNode.nodeName == "Abstract") {
        //description
        result.description = (childNode.text ? childNode.text : childNode.textContent) || "";
        
      } else if (childNode.nodeName == "BoundingBox") {
        // other extents
        // <BoundingBox CRS="CRS:84" minx="-164.765831" miny="25.845557" maxx="-67.790980" maxy="70.409756"/>  
        // <BoundingBox CRS="EPSG:4326" minx="25.845557" miny="-164.765831" maxx="70.409756" maxy="-67.790980"/>  
        srAttr = childNode.getAttribute(srAttrName);
        if (srAttr && srAttr.indexOf("EPSG:") === 0) {
          wkid = parseInt(srAttr.substring(5));
          if (wkid !== 0 && !isNaN(wkid)) {
            var extent;
            if (this.version == "1.3.0") {
              extent = this._getExtent(childNode, wkid, this._useLatLong(wkid));
            } else {
              extent = this._getExtent(childNode, wkid);
            }
            result.allExtents[wkid] = extent;
            if (!result.extent) {
              result.extent = extent; // only first one
            }
          }
        } else if (srAttr && srAttr.indexOf("CRS:") === 0) {
          wkid = parseInt(srAttr.substring(4));
          if (wkid !== 0 && !isNaN(wkid)) {
            if (this._CRS_TO_EPSG[wkid]) {
              wkid = this._CRS_TO_EPSG[wkid];
            }
            result.allExtents[wkid] = this._getExtent(childNode, wkid);
          }
        } else {
          wkid = parseInt(srAttr);
          if (wkid !== 0 && !isNaN(wkid)) {
            result.allExtents[wkid] = this._getExtent(childNode, wkid);
          }
        }
        
      } else if (childNode.nodeName == srAttrName) {
        // supported spatial references
        // <SRS>EPSG:4326</SRS> or <SRS>EPSG:4326 EPSG:32624 EPSG:32661</SRS>
        var value = childNode.text ? childNode.text : childNode.textContent; // EPSG:102100
        var arr = value.split(" ");
        dojo.forEach(arr, function(val){
          if (val.indexOf(":") > -1) {
            val = parseInt(val.split(":")[1]);
          } else {
            val = parseInt(val);
          }
          if (val !== 84 && val !== 0 && !isNaN(val)) {
            if (!dojo.some(result.spatialReferences, function(el){
              return (el == val);
            })) {
              result.spatialReferences.push(val);
            }
          }
        }, this);
        
      } else if (childNode.nodeName == "Style") {
        // legend URL
        var legendXML = this._getTag("LegendURL", childNode);
        if (legendXML) {
          var onlineResourceXML = this._getTag("OnlineResource", legendXML);
          if (onlineResourceXML) {
            result.legendURL = onlineResourceXML.getAttribute("xlink:href");
          }
        }
        
      } else if (childNode.nodeName === "Layer") {
        // sub layers
        result.subLayers.push(this._getLayerInfo(childNode));
      }
    }, this);
    
    return result;
  },
  
  _getImageFormat: function(format){
    // png | png8 | png24 | png32 | jpg | pdf | bmp | gif | svg 
    // http://www.w3schools.com/media/media_mimeref.asp 
    // image/bmp | image/cis-cod | image/gif | image/ief | image/jpeg | image/pipeg | image/png | image/svg+xml | image/tiff 	
    var imageFormat = format ? format.toLowerCase() : "";
    switch (imageFormat) {
      case "jpg":
        return "image/jpeg";
      case "bmp":
        return "image/bmp";
      case "gif":
        return "image/gif";
      case "svg":
        return "image/svg+xml";
      default:
        return "image/png";
    }
  },
  
  getImageFormat: function(){
    // png | png8 | png24 | png32 | jpg | pdf | bmp | gif | svg 
    // http://www.w3schools.com/media/media_mimeref.asp 
    // image/bmp | image/cis-cod | image/gif | image/ief | image/jpeg | image/pipeg | image/png | image/svg+xml | image/tiff  
    var imageFormat = this.imageFormat ? this.imageFormat.toLowerCase() : "";
    switch (imageFormat) {
      case "image/jpeg":
        return "jpg";
      case "image/bmp":
        return "bmp";
      case "image/gif":
        return "gif";
      case "image/svg+xml":
        return "svg";
      default:
        return "png";
    }
  },
  
  _getExtent: function(boundsXML, wkid, coordsReversed){
    var result;
    
    if (boundsXML) {
      result = new esri.geometry.Extent();
      
      var minx = parseFloat(boundsXML.getAttribute("minx"));
      var miny = parseFloat(boundsXML.getAttribute("miny"));
      var maxx = parseFloat(boundsXML.getAttribute("maxx"));
      var maxy = parseFloat(boundsXML.getAttribute("maxy"));
      
      if (coordsReversed) {
        result.xmin = isNaN(miny) ? ((-1)*Number.MAX_VALUE) : miny;
        result.ymin = isNaN(minx) ? ((-1)*Number.MAX_VALUE) : minx;
        result.xmax = isNaN(maxy) ? Number.MAX_VALUE : maxy;
        result.ymax = isNaN(maxx) ? Number.MAX_VALUE : maxx;
      } else {
        result.xmin = isNaN(minx) ? ((-1)*Number.MAX_VALUE) : minx;
        result.ymin = isNaN(miny) ? ((-1)*Number.MAX_VALUE) : miny;
        result.xmax = isNaN(maxx) ? Number.MAX_VALUE : maxx;
        result.ymax = isNaN(maxy) ? Number.MAX_VALUE : maxy;
      }
      
      result.spatialReference = new esri.SpatialReference({
        wkid: wkid
      });
    }
    
    return result;
  },
  
  _useLatLong: function(wkid){
    var result;
    for (var i = 0; i < this._REVERSED_LAT_LONG_RANGES.length; i++) {
      var range = this._REVERSED_LAT_LONG_RANGES[i];
      if (wkid >= range[0] && wkid <= range[1]) {
        result = true;
        break;
      }
    }
    return result;
  },
  
  _getTag: function(tagName, xml){
    var tags = dojo.query(tagName, xml);
    if (tags && tags.length > 0) {
      return tags[0];
    } else {
      return null;
    }
  },
  
  _getTagValue: function(tagName, xml, defaultValue){
    var value = dojo.query(tagName, xml);
    if (value && value.length > 0) {
      if (value[0].text) {
        return value[0].text;
      } else {
        return value[0].textContent;
      }
    } else {
      return defaultValue;
    }
  },
  
  _getAttributeValue: function(tagName, attrName, xml, defaultValue){
    var value = dojo.query(tagName, xml);
    if (value && value.length > 0) {
      return value[0].getAttribute(attrName);
    } else {
      return defaultValue;
    }
  },
  
  _checkVisibleLayersList: function(visibleLayers){
    // check to see if we got a list of layer positions or layer names
    // we must have this.layerInfos to do this
    if (visibleLayers && visibleLayers.length > 0 && this.layerInfos && this.layerInfos.length > 0) {
      if ((typeof visibleLayers[0]) == "number") {
        // positions
        var list = [];
        dojo.forEach(visibleLayers, function(pos){
          if (pos < this.layerInfos.length) {
            list.push(this.layerInfos[pos].name);
          }
        }, this);
        visibleLayers = list;
      }
    }
    return visibleLayers;
  },
  
  _stripParameters: function(url, params){
    var obj = esri.urlToObject(url);
    qs = [];
    for (var prop in obj.query) {
      if (dojo.indexOf(params, prop.toLowerCase()) === -1) {
        qs.push(prop + '=' + obj.query[prop]);
      }
    }
    return obj.path + (qs.length ? ("?" + qs.join('&')) : '');
  }
  
});

dojo.declare("esri.layers.WMSLayerInfo", null, {
  // name of the layer. Used to set layer visibilities.
  name: null,
  // title of the layer.
  title: null,
  // Gets the abstract of the layer.
  description: null,
  // extent of the layer.
  extent: null,
  // url to legend image
  legendURL: null,
  // sub layers. These are also instances of WMSLayerInfo.
  subLayers: [],
  // all bounding boxes defined for this layer
  allExtents: [],
  // all spatial references defined for this layer
  spatialReferences: [],
  
  constructor: function(params){
    if (params) {
      this.name = params.name;
      this.title = params.title;
      this.description = params.description;
      this.extent = params.extent;
      this.legendURL = params.legendURL;
      this.subLayers = params.subLayers ? params.subLayers : [];
      this.allExtents = params.allExtents ? params.allExtents : [];
      this.spatialReferences = params.spatialReferences ? params.spatialReferences : [];
    }
  },
	
	clone: function() {
		var info = {
		  name: this.name,
		  title: this.title,
		  description: this.description,
		  legendURL: this.legendURL
		};
		if (this.extent){
		  info.extent = this.extent.getExtent();
		}
    info.subLayers = [];
    dojo.forEach(this.subLayers,function(layer){
      info.subLayers.push(layer.clone());
    });
		info.allExtents = [];
		for(var wkid in this.allExtents){
			wkid = parseInt(wkid);
			if (!isNaN(wkid)) {
	     info.allExtents[wkid] = this.allExtents[wkid].getExtent();
      }
		}
    info.spatialReferences = [];
    dojo.forEach(this.spatialReferences,function(wkid){
			info.spatialReferences.push(wkid);
    });
		return info;
	}
  
});

});
