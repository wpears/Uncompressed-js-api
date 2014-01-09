//>>built
// wrapped by build app
define("esri/layers/agstiled", ["dijit","dojo","dojox","dojo/require!esri/layers/tiled,esri/layers/agscommon"], function(dijit,dojo,dojox){
dojo.provide("esri.layers.agstiled");

dojo.require("esri.layers.tiled");
dojo.require("esri.layers.agscommon");

dojo.declare("esri.layers.ArcGISTiledMapServiceLayer", [esri.layers.TiledMapServiceLayer, esri.layers.ArcGISMapServiceLayer], {
    constructor: function(/*String*/ url, /*Object?*/ options) {
      //options: tileServers: String[]: Array of servers where tiles can be retrieved from.
      if (options) {
        if (options.roundrobin) {
          dojo.deprecated(this.declaredClass + " : " + esri.bundle.layers.agstiled.deprecateRoundrobin);
          options.tileServers = options.roundrobin;
        }
        
        /*var ts = (this.tileServers = options.tileServers);
        if (ts) {
          if (ts.length === 0) {
            ts = null;
          }
          else {
            for (var i=0, il=ts.length; i<il; i++) {
              ts[i] = esri.urlToObject(ts[i]).path;
            }
          }
        }*/
        this._setTileServers(options.tileServers);
        this._loadCallback = options.loadCallback;
      }
      
      this._params = dojo.mixin({}, this._url.query);
  
      //this.tsi = 0; //tileServerIndex
      
      this._initLayer = dojo.hitch(this, this._initLayer);

      var resourceInfo = options && options.resourceInfo;
      if (resourceInfo) {
        this._initLayer(resourceInfo);
      }
      else {
        this._load = dojo.hitch(this, this._load);
        this._load();
      }
    },
    
    _TILE_FORMATS: { PNG:"png", PNG8:"png", PNG24:"png", PNG32:"png", JPG:"jpg", JPEG:"jpg", GIF:"gif" },
    
    _setTileServers: function(list) {
      if (list && list.length > 0) {
        this.tileServers = list;

        var i, il = list.length;
        for (i=0; i < il; i++) {
          list[i] = esri.urlToObject(list[i]).path;
        }
      }
    },
    
    _initLayer: function(response, io) {
      this.inherited(arguments);
      
      // Ideally we'd put this in agscommon.js but considering
      // this is really only needed for overview map use-case, we dont
      // want dynamic layers to incur this charge.
      // See Layer::getResourceInfo (layer.js) for more context
      this.resourceInfo = dojo.toJson(response);

      this.tileInfo = new esri.layers.TileInfo(response.tileInfo);
//      this._tileFormat = this._TILE_FORMATS[this.tileInfo.format];
      this.isPNG32 = this.tileInfo.format === "PNG24" || this.tileInfo.format === "PNG32";
      
      if (response.timeInfo) {
          this.timeInfo = new esri.layers.TimeInfo(response.timeInfo);
      }
      
      if (!this.tileServers) {
        var path = this._url.path;
        
        if (response.tileServers) {
          this._setTileServers(response.tileServers);
        }
        else {
          var isServer   = (path.search(/^https?\:\/\/server\.arcgisonline\.com/i) !== -1),
              isServices = (path.search(/^https?\:\/\/services\.arcgisonline\.com/i) !== -1);
          
          if (isServer || isServices) {
            this._setTileServers([
              path,
              path.replace(
                (isServer ? /server\.arcgisonline/i : /services\.arcgisonline/i),
                (isServer ? "services.arcgisonline" : "server.arcgisonline")
              )
            ]);
          }
        }
      }

      this.loaded = true;
      this.onLoad(this);
      
      var callback = this._loadCallback;
      if (callback) {
        delete this._loadCallback;
        callback(this);
      }
    },
    
    getTileUrl: function(level, row, col) {
      // Using "Column ID" for tileServer selection may lead to relatively faster
      // exhaustion of a server's max connection limit - given that tiled.js or 
      // the implementation that calls this method does so in "column major"
      // order fashion i.e. outer loop iterating through columns and inner
      // loop iterating through rows. Consider this pattern for example:
      //   1  2  3  4  1  2
      //   1  2  3  4  1  2
      //   1  2  3  4  1* 2*
      //   1  2  3  4  1* 2*
      // Numbers 1 through 4 indicate the tileServer indices.
      // * indicates blocking request (assuming Firefox that has max connection
      // limit of 6)
      
      // Using "Row ID" on the otherhand is better because the servers are 
      // exhausted equally (relatively) with respect to each other.
      // For the example above, using row id will yield the following pattern:
      //   1  1  1  1  1  1
      //   2  2  2  2  2  2
      //   3  3  3  3  3  3
      //   4  4  4  4  4  4
      // Note that there is no blocking in this pattern.
      // But it under-utilizes the tileServers if the map height is such 
      // that it displays only 2 rows where we have a total of 4 tile servers. 
      // This is bound to happen when using "Col ID" as well.

      // Ideally we would want a selection algorithm that has the distribution
      // characteristics of using an ever incrementing counter but also maximizes
      // the cache hit ratio. Granted, it's hard to come up with an algorithm
      // that can satisfy these two factors equally for varying map control size,
      // browser connection limit and number of tileServers. Here are some thoughts
      // on measuring the overall efficency:
      // - Distribution (number of requests served by a server over a period of time)
      // - Avg latency of individual tileServers over a period of time
      // - Max idle time (how long a server sits idle without handling a request)
      // - Total idle time
      // - Raw computational efficiency of the algorithm
      
      // The new algorithm based on "Row ID" will not necessarily load tiles 
      // faster than before but it certainly avoids trashing the browser's cache 
      // by mapping tiles to a certain tileServer consistently.
      
      var ts = this.tileServers,
          query = this._url.query,
          iurl = (ts ? ts[row % ts.length] : this._url.path) + "/tile/" + level + "/" + row + "/" + col;

      if (query) {
        iurl += ("?" + dojo.objectToQuery(query));
      }
      
      var token = this._getToken();
      if (token && (!query || !query.token)) {
        iurl += (iurl.indexOf("?") === -1 ? "?" : "&") + "token=" + token;
      }

      return esri._getProxiedUrl(iurl);
    }
  }
);
});
