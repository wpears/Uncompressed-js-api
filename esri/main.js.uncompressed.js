//>>built
define("esri/main", ["dojo", "dojo/i18n!esri/nls/jsapi"], function(dojo, jsapiBundle) {
  // module:
  //    esri/main
  // summary:
  //    This is the package main module for the esri package; it bootstraps the execution environment.


  //dojo.registerModulePath("esri", "../../esri");

  //Declare esri namespace object
  dojo.mixin((typeof window.esri === "undefined") ? (window.esri = {}) : esri, {

    //version
    version: 3.0,
    
    //application base url
    _appBaseUrl: window.location.protocol + "//" + window.location.host + window.location.pathname.substring(0, window.location.pathname.lastIndexOf(window.location.pathname.split("/")[window.location.pathname.split("/").length - 1])),
    
    //Configuration used by JavaScript API.
    config: {
      defaults: {
        //screen DPI
        screenDPI: 96.0,

        geometryService: null,
        kmlService: null,

        map: {
          //default width of map
          width: 400,
          //default height of map
          height: 400,

          //default layer to be displayed on map. If null, no default layer.
          // type: String: Object name of layer
          // url: String: Url to end-point for layer
          // options: Object: All layer options
          // layer: null,
          //default prefix added for all layers, without id, added to the map
          layerNamePrefix: "layer",
          graphicsLayerNamePrefix: "graphicsLayer",

          //position & size of slider on map
          slider: { left: "30px", top: "30px", width:null, height:"200px" },

          //add labels to slider
          //if sliderLabel is null, no labels or ticks will be displayed
          //  labels: Array: Array of labels to be displayed
          //  style: String: Default style for displaying labels
          sliderLabel: { tick:5, labels: null, style: "width:2em; font-family:Verdana; font-size:75%;" },

          //change slider values immediately
          sliderChangeImmediate: true,

          //color of zoom rectangle
          // stroke: { color:[r, g, b, a], width:int }: Stroke data object
          // fill: Array: [r, g, b, a]
          zoomSymbol: { color:[0,0,0,64], outline:{ color:[255,0,0,255], width:1.25, style:"esriSLSSolid" }, style:"esriSFSSolid" },

          //zoomDuration: dojo._Animation.duration: Duration of animation
          zoomDuration: 500,
          //zoomRate: dojo._Animation.rate: Animation frame rate
          zoomRate: 25,

          //duration a map's recentering should take, in milliseconds
          panDuration: 350,
          //slideRate: dojo_Animation.rate: Animation frame rate
          panRate: 25,

          //url to link opened when logo is clicked
          logoLink: "http://www.esri.com"
        },

        io: {
          //default io error handler
          errorHandler: function(error, io) {
            dojo.publish("esri.Error", [ error ]);
          },

          //cross domain post using proxy
          proxyUrl: null,
          alwaysUseProxy: false,

          // Array of servers that have CORS support enabled
          // See: http://mediawikidev.esri.com/index.php/JSAPI/Research/Cross-Origin_Resource_Sharing
          corsEnabledServers: [
            /** Production setup **/
            "www.arcgis.com",
            "tiles.arcgis.com",
            "services.arcgis.com", // Not enabled yet

            /** QA setup **/
            "qaext.arcgis.com",
            "tilesqa.arcgis.com",
            "servicesqa.arcgis.com", // Not enabled yet

            /** Dev setup **/
            "dev.arcgis.com",
            "devext.arcgis.com",
            "tilesdevext.arcgis.com",
            "servicesdev.arcgis.com"
          ],

          // Note that servers don't have protocol - implies CORS enabled
          // for both HTTP and HTTPS
          
          corsDetection: true,
          
          _processedCorsServers: {
            // "<host:port?>": -1/0/1
            // -1 indicates ServerInfo request is in-flight
            //  1 indicates CORS support not available
            //  2 indicates CORS support available
          },

          //post request length
          postLength: 2000,

          //default timeout for all requests
          timeout:60000
        }
      }
    }
  });

  /**********************
   * Mobile OS detection
   **********************/

  var nua = navigator.userAgent, match;
  //esri.isiPhone = esri.isAndroid = 0;

  match = nua.match(/(iPhone|iPad|CPU)\s+OS\s+(\d+\_\d+)/i);
  if (match) {
    esri.isiPhone = parseFloat(match[2].replace("_", "."));
  }

  match = nua.match(/Android\s+(\d+\.\d+)/i);
  if (match) {
    esri.isAndroid = parseFloat(match[1]);
  }

  match = nua.match(/Fennec\/(\d+\.\d+)/i);
  if (match) {
    esri.isFennec = parseFloat(match[1]);
  }

  if (nua.indexOf("BlackBerry") >= 0) {
    if (nua.indexOf("WebKit") >= 0) {
      esri.isBlackBerry = 1;
    }
  }

  esri.isTouchEnabled = (esri.isiPhone || esri.isAndroid || esri.isBlackBerry || (esri.isFennec >= 6)) ? true : false;

  /*// Future Work
  if (!esri.isTouchEnabled) {
    // References:
    // http://modernizr.github.com/Modernizr/touch.html
    // http://stackoverflow.com/questions/2607248/optimize-website-for-touch-devices
    esri.isTouchEnabled = "ontouchstart" in document;
  }*/

  esri._getDOMAccessor = function(propName) {
    var prefix = "";

    if (dojo.isFF) {
      prefix = "Moz";
    }
    else if (dojo.isWebKit) {
      prefix = "Webkit";
    }
    else if (dojo.isIE) {
      prefix = "ms";
    }
    else if (dojo.isOpera) {
      prefix = "O";
    }

    return prefix + propName.charAt(0).toUpperCase() + propName.substr(1);
  };

  // See: http://caniuse.com/#search=cross-origin
  esri._hasCors = dojo.isChrome >= 4 || dojo.isFF >= 3.5 || 
                  dojo.isSafari >= 4 || dojo.isIE >= 10;

  // See: 
  // http://www.html5rocks.com/en/tutorials/file/xhr2/
  // https://developer.mozilla.org/En/XMLHttpRequest/Using_XMLHttpRequest#Using_FormData_objects
  // https://developer.mozilla.org/en/DOM/XMLHttpRequest/FormData
  esri._hasFileUpload = window.FormData && window.FileList;

  // TODO
  // See here for discussion related to feature detection:
  // http://hacks.mozilla.org/2011/10/css-3d-transformations-in-firefox-nightly/comment-page-1/#comment-991061
  // Android 2.x bug: http://code.google.com/p/android/issues/detail?id=12451
  // Dojo version sniffing bug in Opera: http://bugs.dojotoolkit.org/ticket/13159
  esri._hasTransforms =   dojo.isIE >= 9 || dojo.isFF >= 3.5 || 
                          dojo.isChrome >= 4 || dojo.isSafari >= 3.1 || 
                          dojo.isOpera >= 10.5 || 
                          esri.isiPhone >= 3.2 || esri.isAndroid >= 2.1;

  esri._hasTransitions =  dojo.isIE >= 10 || dojo.isFF >= 4 || 
                          dojo.isChrome >= 4 || dojo.isSafari >= 3.1 || 
                          dojo.isOpera >= 10.5 || 
                          esri.isiPhone >= 3.2 || esri.isAndroid >= 2.1;

  esri._has3DTransforms = dojo.isIE >= 11 || dojo.isFF >= 10 || 
                          dojo.isChrome >= 12 || dojo.isSafari >= 4 || 
                          esri.isiPhone >= 3.2 || esri.isAndroid >= 3;

  // ========== Internet Explorer Notes ==========
  // Looks like 3D Transform is only supported in IE 10 Developer Preview.
  // Not in Platform Preview. Developer Preview is available only with Windows 8.
  // Still 3D Transforms scale image in a peculiar manner such that images
  // appear watered down and wobble when scaling over multiple map levels

  // ========== Chrome Bug ==========
  // Technically Chrome supports 3D Transforms since version 12, but has the 
  // following problem identified in v15:
  // Overall there are 3 unique issues:
  // 1) Navigating from one feature to the next in the popup does not set proper 
  //    scrollbar height - unless you pan the map while the popup is open with 
  //    scrollbar leaking out. This issue is fixed by the txSuffix workaround
  //    described below in esri._css scope.
  // 2) On Windows, the scrollbar is invisible or very transparent so that users
  //    dont see them, But can be clicked or dragged
  // 3) Dragging the scrollbar or using mouse wheel does not scroll the popup
  //    content
  // Chrome at version 17 seems to have fixed issues #2 and #3 above.
  // Note: 15.0.874.121 m is the stable version at the time of this writing, and
  // 17.0.942.0 dev-m is the dev version.
  // Note: 15.0.874.121 m with 2D transform flickers when opening a new tab
  // and begin to zoom in.

  // ========== Android Bug ==========
  // Catch the case where Android Browser identifies itself as Safari as well
  // i.e. both isSafari and isAndroid will be true.
  // Android 2.x bug: http://code.google.com/p/android/issues/detail?id=12451
  if (esri.isAndroid < 3) {
    esri._hasTransforms = esri._hasTransitions = esri._has3DTransforms = false;
  }

  esri._css = function(force3D) {
    var has3D = esri._has3DTransforms;

    // Override to force 3D
    if (esri._isDefined(force3D)) {
      has3D = force3D;
    }
    // Override to disable 3D on some versions of Chrome and Safari on Desktop
    else if (has3D) {
      // Adelheid reported some issues in Safari:
      //   a duplicate focus highlight below find input box
      //   text leaking outside the textbox in "Share" dialog etc
      if ((dojo.isChrome /*&& dojo.isChrome < 17*/) || (dojo.isSafari && !esri.isiPhone)) {
          has3D = false;
      }
      // As of this writing, Chrome scrollbar bug is not fixed at "18.0.1010.0 canary"
      // Let's always do 2D in Chrome.
    }

    var txPrefix = has3D ? "translate3d(" : "translate(",
        txSuffix = has3D ? (dojo.isChrome ? ",-1px)" : ",0px)") : ")",
        scalePrefix = has3D ? "scale3d(" : "scale(",
        scaleSuffix = has3D ? ",1)" : ")",
        rotPrefix = has3D ? "rotate3d(0,0,1," : "rotate(",
        matrixPrefix = has3D ? "matrix3d(" : "matrix(",
        matrixC1 = has3D ? ",0,0," : ",",
        matrixC2 = has3D ? ",0,0,0,0,1,0," : ",",
        matrixSuffix = has3D ? ",0,1)" : ")";

    // Background info on txSuffix (scrollFix):
    // Workaround for a Chrome bug where children and grand-children of the  
    // parent of a 3d-translated element have messed-up scrollbars.
    //   3d-translated element = map layers
    //   parent = map container
    //   one of the children = Popup contentPane
    // Observed in Chrome 15.0.874.121 m (Win and Mac)
    // Test case: 
    // http://pponnusamy.esri.com:9090/jsapi/mapapps/testing/map/transforms/chrome-scrollbar-bug.html
    // Discussion:
    // http://stackoverflow.com/questions/6810174/z-index-on-position-fixed-in-webkit-nightly
    // https://bugs.webkit.org/show_bug.cgi?id=56917

    return {
      // Reference:
      // https://developer.mozilla.org/en/CSS/CSS_transitions
      // http://www.opera.com/docs/specs/presto25/css/transitions/#events
      names: {
        transition:    (dojo.isWebKit && "-webkit-transition") || (dojo.isFF && "MozTransition") || 
                       (dojo.isOpera && "OTransition") || (dojo.isIE && "msTransition"),

        transform:     (dojo.isWebKit && "-webkit-transform") || (dojo.isFF && "MozTransform") || 
                       (dojo.isOpera && "OTransform") || (dojo.isIE && "msTransform"),

        transformName: (dojo.isWebKit && "-webkit-transform") || (dojo.isFF && "-moz-transform") || 
                       (dojo.isOpera && "-o-transform") || (dojo.isIE && "-ms-transform"),

        origin:        (dojo.isWebKit && "-webkit-transform-origin") || (dojo.isFF && "MozTransformOrigin") || 
                       (dojo.isOpera && "OTransformOrigin") || (dojo.isIE && "msTransformOrigin"),

        endEvent:      (dojo.isWebKit && "webkitTransitionEnd") || (dojo.isFF && "transitionend") || 
                       (dojo.isOpera && "oTransitionEnd") || (dojo.isIE && "MSTransitionEnd")
      },

      translate: function(x, y) {
        return txPrefix + x + "px," + y + "px" + txSuffix;
      },

      scale: function(factor) {
        return scalePrefix + factor + "," + factor + scaleSuffix;
      },

      rotate: function(angle) {
        return rotPrefix + angle + "deg)";
      },

      matrix: function(m) {
        // http://www.w3.org/TR/css3-3d-transforms/#transform-functions
        // http://www.useragentman.com/blog/2011/01/07/css3-matrix-transform-for-the-mathematically-challenged/
        // http://www.useragentman.com/matrix/
        // http://www.eleqtriq.com/2010/05/css-3d-matrix-transformations/
        // http://www.eleqtriq.com/2010/05/understanding-css-3d-transforms/
        // http://developer.apple.com/library/safari/#documentation/InternetWeb/Conceptual/SafariVisualEffectsProgGuide/Transforms/Transforms.html
        // http://9elements.com/html5demos/matrix3d/
        // Firefox does not accept unitless values for dx and dy: https://developer.mozilla.org/en/CSS/-moz-transform#matrix
        return matrixPrefix + m.xx + "," + m.xy + matrixC1 +  
               m.yx + "," + m.yy + matrixC2 + 
               m.dx.toFixed(10) + (dojo.isFF ? "px," : ",") + m.dy.toFixed(10) + (dojo.isFF ? "px" : "") +
               matrixSuffix;

        // Without toFixed above for dx and dy, transforms will silently fail if
        // the values contain "e" (exponent notation) in them

        /*return "matrix(" +
               m.xx + "," + m.xy + "," + m.yx + "," + m.yy + "," + m.dx + "," + m.dy +
               ")";*/
      }
    };
  };

  //deprecated (remove at v2.0)
  esriConfig = esri.config;


  //load css files
  var h = document.getElementsByTagName("head")[0],
      //list of css files to be included (in specified order)
      csss = [
        dojo.moduleUrl("esri") + "../../css/jsapi.css", //map
        dojo.moduleUrl("esri") + "dijit/css/InfoWindow.css" //info window
      ],
      attr = { rel:"stylesheet", type:"text/css", media:"all" };

  dojo.forEach(csss, function(css) {
    // Do not expect that css.toString() will be called.
    // See IE 8 remark at the bottom of this page:
    // http://msdn.microsoft.com/en-us/library/ms536739%28VS.85%29.aspx
    // dojo.create -> dojo.attr -> node.setAttribute(...)
    attr.href = css.toString();
    dojo.create("link", attr, h);
  });
  
  // Various widgets and classes expect localized string bundles to be 
  // available via esri.bundle object
  esri.bundle = jsapiBundle;


  /*dojo.addOnLoad(function() {

    if (esri.IdentityManager) {
      //console.log("Instantiating identity manager...");
      esri.id = new esri.IdentityManager();
    }*/

    // See: 
    // http://ejohn.org/blog/ecmascript-5-objects-and-properties/
    // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object/defineProperty
    // http://blogs.msdn.com/b/ie/archive/2009/01/13/responding-to-change-updated-getter-setter-syntax-in-ie8-rc-1.aspx
    // http://webreflection.blogspot.com/2011/02/btw-getters-setters-for-ie-6-7-and-8.html
    /*if (Object.defineProperty) {
      Object.defineProperty(esri, "id", { writable: false, configurable: false });
      //console.log("esri.id", dojo.toJson(Object.getOwnPropertyDescriptor(esri, "id")));

      Object.defineProperty(esri.id, "generateToken", { writable: false, configurable: false });
      //console.log("esri.id.generateToken", dojo.toJson(Object.getOwnPropertyDescriptor(esri.id, "generateToken")));

      // TODO
      // Ideally we need to make the following methods un-writable and un-configurable as well:
      // esri.request
      // esri._request
      // dojo.io.script.get
      // dojo.xhrGet
      // dojo.rawXhrPost
      // dojo.xhr
      // ...pretty much any method that gets passed request query parameters for
      // some kind of processing should be frozen as well
    }*/
  //});

  return esri;
});
