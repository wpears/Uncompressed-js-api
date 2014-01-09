//>>built
// wrapped by build app
define("esri/layers/wmts", ["dijit","dojo","dojox","dojo/require!esri/layers/tiled,esri/layers/agscommon,esri/WKIDUnitConversion,dojox/xml/parser"], function(dijit,dojo,dojox){
dojo.provide("esri.layers.wmts");

dojo.require("esri.layers.tiled");
dojo.require("esri.layers.agscommon");
dojo.require("esri.WKIDUnitConversion");
dojo.require("dojox.xml.parser");

dojo.declare("esri.layers.WMTSLayer", [esri.layers.TiledMapServiceLayer], {
  copyright: null,
  extent: null,
  tileUrl: null,
  layerInfo: null,
  spatialReference: null,
  tileInfo: null,
  constructor: function (url, options) {
    this.version = "1.0.0";
    this.tileUr = this._url = url;
    this.serviceMode = "RESTful";
    this._parseCapabilities = dojo.hitch(this, this._parseCapabilities);
    this._getCapabilitiesError = dojo.hitch(this, this._getCapabilitiesError);
    if (!options) {
      options = {};
    }
    if (options.serviceMode) {
      if (options.serviceMode === "KVP" || options.serviceMode === "RESTful") {
        this.serviceMode = options.serviceMode;
      } else {
        console.error("WMTS mode could only be 'KVP' or 'RESTful'");
        return;
      }
    }

    if (options.layerInfo) {
      this.layerInfo = options.layerInfo;
      this._identifier = options.layerInfo.identifier;
      this._tileMatrixSetId = options.layerInfo.tileMatrixSet;
      this.format = "image/" + options.layerInfo.format;
      this._style = options.layerInfo.style;
      this.title = options.layerInfo.title;
    }

    if (options.resourceInfo) {
      this.version = options.resourceInfo.version;
      if (options.resourceInfo.getTileUrl) {
        this._url = this.tileUrl = options.resourceInfo.getTileUrl;
      }
      this.copyright = options.resourceInfo.copyright;
      this.layerInfos = options.resourceInfo.layerInfos;
      this._parseResourceInfo();
      this.loaded = true;
      this.onLoad(this);
    } else {
      this._getCapabilities();
    }

    this._formatDictionary = {
      "image/png": ".png",
      "image/png8": ".png",
      "image/png24": ".png",
      "image/png32": ".png",
      "image/jpg": ".jpg",
      "image/jpeg": ".jpg",
      "image/gif": ".gif",
      "image/bmp": ".bmp",
      "image/tiff": ".tif"
    };
  },

  setActiveLayer: function (layerInfo) {
    this.layerInfo = layerInfo;
    this._identifier = layerInfo.identifier;
    this._tileMatrixSetId = layerInfo.tileMatrixSet;
    if (layerInfo.format) {
      this.format = "image/" + layerInfo.format;
    }
    this._style = layerInfo.style;
    this.title = layerInfo.title;
    this._parseResourceInfo();
    this.refresh(true);
  },

  getTileUrl: function (level, row, col) {
    var tileUrl;
    if (this.serviceMode === "KVP") {
      tileUrl = this._url + "SERVICE=WMTS&VERSION=" + this.version + "&REQUEST=GetTile" + "&LAYER=" + this._identifier + "&STYLE=" + this._style + "&FORMAT=" + this.format + "&TILEMATRIXSET=" + this._tileMatrixSetId + "&TILEMATRIX=" + level + "&TILEROW=" + row + "&TILECOL=" + col;
    } else if (this.serviceMode === "RESTful") {
      var imagePostfix;
      if (this._formatDictionary[this.format]) {
        imagePostfix = this._formatDictionary[this.format];
      }
      tileUrl = this._url + this._identifier + "/" + this._style + "/" + this._tileMatrixSetId + "/" + level + "/" + row + "/" + col + imagePostfix;
    }
    return tileUrl;
  },

  _parseResourceInfo: function () {
    var layerInfos = this.layerInfos;
    if (this.serviceMode === "KVP") {
      this._url += (this._url.substring(this._url.length - 1, this._url.length) == "?") ? "" : "?";
    }
    
    for (var i = 0; i < layerInfos.length; i++) {
      if ((!this._identifier || layerInfos[i].identifier === this._identifier) && (!this.title || layerInfos[i].title === this.title) && (!this._tileMatrixSetId || layerInfos[i].tileMatrixSet === this._tileMatrixSetId) && (!this.format || "image/" + layerInfos[i].format === this.format) && (!this._style || layerInfos[i].style === this._style)) {
        dojo.mixin(this, {"description": layerInfos[i].description, tileInfo: layerInfos[i].tileInfo, spatialReference: layerInfos[i].tileInfo.spatialReference, fullExtent: layerInfos[i].fullExtent, initialExtent: layerInfos[i].initialExtent, _identifier: layerInfos[i].identifier, _tileMatrixSetId: layerInfos[i].tileMatrixSet, format: "image/" + layerInfos[i].format, _style: layerInfos[i].style});
        break;
      }
    }
  },

  _getCapabilities: function () {
    var capabilitiesUrl;
    if (this.serviceMode === "KVP") {
      capabilitiesUrl = this._url + "?request=GetCapabilities&service=WMTS&version=" + this.version;
    } else if (this.serviceMode === "RESTful") {
      capabilitiesUrl = this._url + "/" + this.version + "/WMTSCapabilities.xml";
    }

    esri.request({
      url: capabilitiesUrl,
      handleAs: "text",
      load: this._parseCapabilities,
      error: this._getCapabilitiesError
    });
  },

  _parseCapabilities: function (xmlText) {
    xmlText = xmlText.replace(/ows:/gi, "");
    var xml = dojox.xml.parser.parse(xmlText);
    //copryright is AccessConstraints
    //find the url for getTile operation
    var metaData = dojo.query("OperationsMetadata", xml)[0];
    var getTile = dojo.query("[name='GetTile']", metaData)[0];
    var tileUrl = this.tileUrl;
    if (this._getAttributeValue("Get", "xlink:href", getTile)) {
      tileUrl = this._getAttributeValue("Get", "xlink:href", getTile);
    }
    if (tileUrl.indexOf("/1.0.0/") === -1 && this.serviceMode === "RESTful") {
      tileUrl += "/1.0.0/";
    }
    if (this.serviceMode === "KVP") {
      tileUrl += (tileUrl.substring(tileUrl.length - 1, tileUrl.length) == "?") ? "" : "?";
    }
    this._url = tileUrl;

    var contents = dojo.query("Contents", xml)[0];
    var rows, cols, origin, wkid, lod, lods = [];
    //find the layer
    if (!this._identifier) {
      this._identifier = this._getTagValues('Capabilities>Contents>Layer>Identifier', xml)[0];
    }
    //find copyright info according to AccessConstraints
    this.copyright = this._getTagValues('Capabilities>ServiceIdentification>AccessConstraints', xml)[0];
    var layer = this._getTagWithChildTagValue("Layer", "Identifier", this._identifier, contents);
    //find the description
    this.description = this._getTagValues("Abstract", layer)[0];
    this.title = this._getTagValues("Title", layer)[0];
    //find the style
    if (!this._style) {
      var styleTag = dojo.query("[isDefault='true']", layer)[0];
      if (styleTag) {
        this._style = this._getTagValues("Identifier", styleTag)[0];
      }
      this._style = this._getTagValues("Identifier", dojo.query("Style", layer)[0])[0];
    }
    //check if the format is supported
    var formats = this._getTagValues("Format", layer);
    if (!this.format) {
      this.format = formats[0];
    }
    if (dojo.indexOf(formats, this.format) === -1) {
      console.error("The format " + this.format + " is not supported by the service");
    }
    //if user doesn't provide tileMatrixSetId, search for "GoogleMapsCompatible",
    //then, use the first one.    
    var layerMatrixSetIds = this._getTagValues("TileMatrixSet", layer);
    if (!this._tileMatrixSetId) {
      if (dojo.indexOf(layerMatrixSetIds, "GoogleMapsCompatible") !== -1) {
        this._tileMatrixSetId = "GoogleMapsCompatible";
      } else {
        this._tileMatrixSetId = layerMatrixSetIds[0];
      }
    }

    var matrixSetLink = this._getTagWithChildTagValue("TileMatrixSetLink", "TileMatrixSet", this._tileMatrixSetId, layer);
    var layerMatrixIds = this._getTagValues("TileMatrix", matrixSetLink);
    var tileMatrixSet = this._getTagWithChildTagValue("TileMatrixSet", "Identifier", this._tileMatrixSetId, contents);
    var crs = this._getTagValues("SupportedCRS", tileMatrixSet)[0];
    wkid = crs.split(":").pop();
    if (wkid == 900913) {
      wkid = 3857;
    }
    this.spatialReference = new esri.SpatialReference({
      "wkid": wkid
    });
    var firstTileMatrix = dojo.query("TileMatrix", tileMatrixSet)[0];
    rows = parseInt(this._getTagValues("TileWidth", firstTileMatrix)[0], 10);
    cols = parseInt(this._getTagValues("TileHeight", firstTileMatrix)[0], 10);
    var topLeft = this._getTagValues("TopLeftCorner", firstTileMatrix)[0].split(" ");
    var top = topLeft[0],
        left = topLeft[1];
    if (top.split("E").length > 1) {
      var topNumbers = top.split("E");
      top = topNumbers[0] * Math.pow(10, topNumbers[1]);
    }
    if (left.split("E").length > 1) {
      var leftNumbers = left.split("E");
      left = leftNumbers[0] * Math.pow(10, leftNumbers[1]);
    }
    origin = {
      "x": parseInt(top, 10),
      "y": parseInt(left, 10)
    };

    //due to a wrong order of the topleft point in some of openlayer sample services
    //it needs to hard code the origin point. The only way is to look at the wkid
    if (wkid == 3857 || wkid == 102113 || wkid == 102100) {
      origin = {
        "x": -20037508.342787,
        "y": 20037508.342787
      };
    } else if (wkid == 4326) {
      origin = {
        "x": -180,
        "y": 90
      };
    }
    var matrixWidth = this._getTagValues("MatrixWidth", firstTileMatrix)[0];
    var matrixHeight = this._getTagValues("MatrixHeight", firstTileMatrix)[0];
    //find lod information, including level, scale and resolution for each level
    if (layerMatrixIds.length === 0) {
      var tileMatrixes = dojo.query("TileMatrix", tileMatrixSet);
      for (var j = 0; j < tileMatrixes.length; j++) {
        lod = this._getLodFromTileMatrix(tileMatrixes[j], wkid);
        lods.push(lod);
      }
    } else {
      for (var i = 0; i < layerMatrixIds.length; i++) {
        var tileMatrix = this._getTagWithChildTagValue("TileMatrix", "Identifier", layerMatrixIds[i], tileMatrixSet);
        lod = this._getLodFromTileMatrix(tileMatrix, wkid);
        lods.push(lod);
      }
    }

    var xmin = origin.x;
    var ymax = origin.y;
    //due to a bug in ArcGIS Server WMTS, always pick the larger one as horizontal number of tiles
    var horizontalTileNumber = matrixWidth > matrixHeight ? matrixWidth : matrixHeight;
    var verticalTileNumber = matrixWidth > matrixHeight ? matrixHeight : matrixWidth;
    var xmax = xmin + horizontalTileNumber * cols * lods[0].resolution;
    var ymin = ymax - verticalTileNumber * rows * lods[0].resolution;
    var extent = new esri.geometry.Extent(xmin, ymin, xmax, ymax);
    this.fullExtent = this.initialExtent = extent;
    this.tileInfo = new esri.layers.TileInfo({
      "dpi": 90.71428571428571
    });
    dojo.mixin(this.tileInfo, {
      "spatialReference": this.spatialReference
    }, {
      "format": this.format
    }, {
      "height": rows
    }, {
      "width": cols
    }, {
      "origin": origin
    }, {
      "lods": lods
    });

    this.loaded = true;
    this.onLoad(this);
  },

  _getCapabilitiesError: function (err) {
    console.error("Failed to get capabilities xml");
  },

  _getLodFromTileMatrix: function (tileMatrix, wkid) {
    var id = this._getTagValues("Identifier", tileMatrix)[0];
    var matrixScale = this._getTagValues("ScaleDenominator", tileMatrix)[0];
    if (matrixScale.split("E").length > 1) {
      var scaleNumbers = matrixScale.split("E");
      matrixScale = scaleNumbers[0] * Math.pow(10, scaleNumbers[1]);
    } else {
      matrixScale = parseFloat(matrixScale);
    }
    var unitConversion;
    if (esri._isDefined(esri.WKIDUnitConversion[wkid])) {
      unitConversion = esri.WKIDUnitConversion.values[esri.WKIDUnitConversion[wkid]];
    } else {
      //1 degree equals to a*2*PI/360 meters
      unitConversion = 111194.6519066546;
    }
    var resolution = matrixScale * 7 / 25000 / unitConversion;
    var lod = {
      "level": id,
      "scale": matrixScale,
      "resolution": resolution
    };
    return lod;
  },

  _getTag: function (tagName, xml) {
    var tags = dojo.query(tagName, xml);
    if (tags && tags.length > 0) {
      return tags[0];
    } else {
      return null;
    }
  },

  _getTagValues: function (tagTreeName, xml) {
    var tagValues = [];
    var tagNames = tagTreeName.split(">");
    var tag, values;
    tag = dojo.query(tagNames[0], xml)[0];
    if (tagNames.length > 1) {
      for (var i = 1; i < tagNames.length - 1; i++) {
        tag = dojo.query(tagNames[i], tag)[0];
      }
      values = dojo.query(tagNames[tagNames.length - 1], tag);
    } else {
      values = dojo.query(tagNames[0], xml);
    }

    if (values && values.length > 0) {
      dojo.forEach(values, function (value) {
        if (dojo.isIE) {
          tagValues.push(value.childNodes[0].nodeValue);
        } else {
          tagValues.push(value.textContent);
        }
      });
    }
    return tagValues;
  },

  _getAttributeValue: function (tagName, attrName, xml, defaultValue) {
    var value = dojo.query(tagName, xml);
    if (value && value.length > 0) {
      return value[0].getAttribute(attrName);
    } else {
      return defaultValue;
    }
  },

  _getTagWithChildTagValue: function (parentTagName, childTagName, tagValue, xml) {
    //find the immediate children with the name of parentTagName
    var children = xml.childNodes;
    var childTagValue;
    for (var j = 0; j < children.length; j++) {
      if (children[j].nodeName === parentTagName) {
        //tags.push(children[j]);
        if (dojo.isIE) {
          if (esri._isDefined(dojo.query(childTagName, children[j])[0])) {
            childTagValue = dojo.query(childTagName, children[j])[0].childNodes[0].nodeValue;
          }
        } else {
          if (esri._isDefined(dojo.query(childTagName, children[j])[0])) {
            childTagValue = dojo.query(childTagName, children[j])[0].textContent;
          }
        }
        if (childTagValue === tagValue) {
          return children[j];
        }
      }
    }
  }
});

dojo.declare("esri.layers.WMTSLayerInfo", null, {
  identifier: null,
  tileMatrixSet: null,
  format: null,
  style: null,
  tileInfo: null,
  title: null,
  fullExtent: null,
  initialExtent: null,
  description: null,
  constructor: function (params) {
    if (params) {
      this.title = params.title;
      this.tileMatrixSet = params.tileMatrixSet;
      this.format = params.format;
      this.style = params.style;
      this.tileInfo = params.tileInfo;
      this.fullExtent = params.fullExtent;
      this.initialExtent = params.initialExtent;
      this.identifier = params.identifier;
      this.description = params.description;
    }
  }
});
});
