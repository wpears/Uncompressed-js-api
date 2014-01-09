/*
 COPYRIGHT 2009 ESRI

 TRADE SECRETS: ESRI PROPRIETARY AND CONFIDENTIAL
 Unpublished material - all rights reserved under the
 Copyright Laws of the United States and applicable international
 laws, treaties, and conventions.

 For additional information, contact:
 Environmental Systems Research Institute, Inc.
 Attn: Contracts and Legal Services Department
 380 New York Street
 Redlands, California, 92373
 USA

 email: contracts@esri.com
 */
//>>built
require({cache:{
'dojox/charting/plot2d/Lines':function(){
define("dojox/charting/plot2d/Lines", ["dojo/_base/declare", "./Default"], function(declare, Default){
/*=====
var Default = dojox.charting.plot2d.Default;
=====*/
	return declare("dojox.charting.plot2d.Lines", Default, {
		//	summary:
		//		A convenience constructor to create a typical line chart.
		constructor: function(){
			//	summary:
			//		Preset our default plot to be line-based.
			this.opt.lines = true;
		}
	});
});

},
'dojox/charting/plot2d/ClusteredBars':function(){
define("dojox/charting/plot2d/ClusteredBars", ["dojo/_base/lang", "dojo/_base/array", "dojo/_base/declare", "./Bars", "./common", 
		"dojox/lang/functional", "dojox/lang/functional/reversed", "dojox/lang/utils"], 
	function(lang, arr, declare, Bars, dc, df, dfr, du){
/*=====
var Bars = dojox.charting.plot2d.Bars;
=====*/

	var purgeGroup = dfr.lambda("item.purgeGroup()");

	return declare("dojox.charting.plot2d.ClusteredBars", Bars, {
		//	summary:
		//		A plot representing grouped or clustered bars (horizontal bars)
		render: function(dim, offsets){
			//	summary:
			//		Run the calculations for any axes for this plot.
			//	dim: Object
			//		An object in the form of { width, height }
			//	offsets: Object
			//		An object of the form { l, r, t, b}.
			//	returns: dojox.charting.plot2d.ClusteredBars
			//		A reference to this plot for functional chaining.
			if(this.zoom && !this.isDataDirty()){
				return this.performZoom(dim, offsets);
			}
			this.resetEvents();
			this.dirty = this.isDirty();
			if(this.dirty){
				arr.forEach(this.series, purgeGroup);
				this._eventSeries = {};
				this.cleanGroup();
				var s = this.group;
				df.forEachRev(this.series, function(item){ item.cleanGroup(s); });
			}
			var t = this.chart.theme, f, gap, height, thickness,
				ht = this._hScaler.scaler.getTransformerFromModel(this._hScaler),
				vt = this._vScaler.scaler.getTransformerFromModel(this._vScaler),
				baseline = Math.max(0, this._hScaler.bounds.lower),
				baselineWidth = ht(baseline),
				events = this.events();
			f = dc.calculateBarSize(this._vScaler.bounds.scale, this.opt, this.series.length);
			gap = f.gap;
			height = thickness = f.size;
			for(var i = this.series.length - 1; i >= 0; --i){
				var run = this.series[i], shift = thickness * (this.series.length - i - 1);
				if(!this.dirty && !run.dirty){
					t.skip();
					this._reconnectEvents(run.name);
					continue;
				}
				run.cleanGroup();
				var theme = t.next("bar", [this.opt, run]), s = run.group,
					eventSeries = new Array(run.data.length);
				for(var j = 0; j < run.data.length; ++j){
					var value = run.data[j];
					if(value !== null){
						var v = typeof value == "number" ? value : value.y,
							hv = ht(v),
							width = hv - baselineWidth,
							w = Math.abs(width),
							finalTheme = typeof value != "number" ?
								t.addMixin(theme, "bar", value, true) :
								t.post(theme, "bar");
						if(w >= 0 && height >= 1){
							var rect = {
								x: offsets.l + (v < baseline ? hv : baselineWidth),
								y: dim.height - offsets.b - vt(j + 1.5) + gap + shift,
								width: w, height: height
							};
							var specialFill = this._plotFill(finalTheme.series.fill, dim, offsets);
							specialFill = this._shapeFill(specialFill, rect);
							var shape = s.createRect(rect).setFill(specialFill).setStroke(finalTheme.series.stroke);
							run.dyn.fill   = shape.getFill();
							run.dyn.stroke = shape.getStroke();
							if(events){
								var o = {
									element: "bar",
									index:   j,
									run:     run,
									shape:   shape,
									x:       v,
									y:       j + 1.5
								};
								this._connectEvents(o);
								eventSeries[j] = o;
							}
							if(this.animate){
								this._animateBar(shape, offsets.l + baselineWidth, -width);
							}
						}
					}
				}
				this._eventSeries[run.name] = eventSeries;
				run.dirty = false;
			}
			this.dirty = false;
			return this;	//	dojox.charting.plot2d.ClusteredBars
		}
	});
});

},
'dojox/gfx/utils':function(){
define("dojox/gfx/utils", ["dojo/_base/kernel","dojo/_base/lang","./_base", "dojo/_base/html","dojo/_base/array", "dojo/_base/window", "dojo/_base/json", 
	"dojo/_base/Deferred", "dojo/_base/sniff", "require","dojo/_base/config"], 
  function(kernel, lang, g, html, arr, win, jsonLib, Deferred, has, require, config){
	var gu = g.utils = {};
	/*===== g= dojox.gfx; gu = dojox.gfx.utils; =====*/

	lang.mixin(gu, {
		forEach: function(
			/*dojox.gfx.Surface|dojox.gfx.Shape*/ object,
			/*Function|String|Array*/ f, /*Object?*/ o
		){
			// summary:
			//		Takes a shape or a surface and applies a function "f" to in the context of "o" 
			//		(or global, if missing). If "shape" was a surface or a group, it applies the same 
			//		function to all children recursively effectively visiting all shapes of the underlying scene graph.
			// object : The gfx container to iterate.
			// f : The function to apply.
			// o : The scope.
			o = o || win.global;
			f.call(o, object);
			if(object instanceof g.Surface || object instanceof g.Group){
				arr.forEach(object.children, function(shape){
					gu.forEach(shape, f, o);
				});
			}
		},

		serialize: function(
			/* dojox.gfx.Surface|dojox.gfx.Shape */ object
		){
			// summary:
			//		Takes a shape or a surface and returns a DOM object, which describes underlying shapes.
			var t = {}, v, isSurface = object instanceof g.Surface;
			if(isSurface || object instanceof g.Group){
				t.children = arr.map(object.children, gu.serialize);
				if(isSurface){
					return t.children;	// Array
				}
			}else{
				t.shape = object.getShape();
			}
			if(object.getTransform){
				v = object.getTransform();
				if(v){ t.transform = v; }
			}
			if(object.getStroke){
				v = object.getStroke();
				if(v){ t.stroke = v; }
			}
			if(object.getFill){
				v = object.getFill();
				if(v){ t.fill = v; }
			}
			if(object.getFont){
				v = object.getFont();
				if(v){ t.font = v; }
			}
			return t;	// Object
		},

		toJson: function(
			/* dojox.gfx.Surface|dojox.gfx.Shape */ object,
			/* Boolean? */ prettyPrint
		){
			// summary:
			//		Works just like serialize() but returns a JSON string. If prettyPrint is true, the string is pretty-printed to make it more human-readable.
			return jsonLib.toJson(gu.serialize(object), prettyPrint);	// String
		},

		deserialize: function(
			/* dojox.gfx.Surface|dojox.gfx.Shape */ parent,
			/* dojox.gfx.Shape|Array */ object
		){
			// summary:
			//		Takes a surface or a shape and populates it with an object produced by serialize().
			if(object instanceof Array){
				return arr.map(object, lang.hitch(null, gu.deserialize, parent));	// Array
			}
			var shape = ("shape" in object) ? parent.createShape(object.shape) : parent.createGroup();
			if("transform" in object){
				shape.setTransform(object.transform);
			}
			if("stroke" in object){
				shape.setStroke(object.stroke);
			}
			if("fill" in object){
				shape.setFill(object.fill);
			}
			if("font" in object){
				shape.setFont(object.font);
			}
			if("children" in object){
				arr.forEach(object.children, lang.hitch(null, gu.deserialize, shape));
			}
			return shape;	// dojox.gfx.Shape
		},

		fromJson: function(
			/* dojox.gfx.Surface|dojox.gfx.Shape */ parent,
			/* String */ json){
			// summary:
			//		Works just like deserialize() but takes a JSON representation of the object.
			return gu.deserialize(parent, jsonLib.fromJson(json));	// Array || dojox.gfx.Shape
		},

		toSvg: function(/*GFX object*/surface){
			// summary:
			//		Function to serialize a GFX surface to SVG text.
			// description:
			//		Function to serialize a GFX surface to SVG text.  The value of this output
			//		is that there are numerous serverside parser libraries that can render
			//		SVG into images in various formats.  This provides a way that GFX objects
			//		can be captured in a known format and sent serverside for serialization
			//		into an image.
			// surface:
			//		The GFX surface to serialize.
			// returns:
			//		Deferred object that will be called when SVG serialization is complete.
		
			//Since the init and even surface creation can be async, we need to
			//return a deferred that will be called when content has serialized.
			var deferred = new Deferred();
		
			if(g.renderer === "svg"){
				//If we're already in SVG mode, this is easy and quick.
				try{
					var svg = gu._cleanSvg(gu._innerXML(surface.rawNode));
					deferred.callback(svg);
				}catch(e){
					deferred.errback(e);
				}
			}else{
				//Okay, now we have to get creative with hidden iframes and the like to
				//serialize SVG.
				if (!gu._initSvgSerializerDeferred) {
					gu._initSvgSerializer();
				}
				var jsonForm = gu.toJson(surface);
				var serializer = function(){
					try{
						var sDim = surface.getDimensions();
						var width = sDim.width;
						var	height = sDim.height;

						//Create an attach point in the iframe for the contents.
						var node = gu._gfxSvgProxy.document.createElement("div");
						gu._gfxSvgProxy.document.body.appendChild(node);
						//Set the node scaling.
						win.withDoc(gu._gfxSvgProxy.document, function() {
							html.style(node, "width", width);
							html.style(node, "height", height);
						}, this);

						//Create temp surface to render object to and render.
						var ts = gu._gfxSvgProxy[dojox._scopeName].gfx.createSurface(node, width, height);

						//It's apparently possible that a suface creation is async, so we need to use
						//the whenLoaded function.  Probably not needed for SVG, but making it common
						var draw = function(surface) {
							try{
								gu._gfxSvgProxy[dojox._scopeName].gfx.utils.fromJson(surface, jsonForm);

								//Get contents and remove temp surface.
								var svg = gu._cleanSvg(node.innerHTML);
								surface.clear();
								surface.destroy();
								gu._gfxSvgProxy.document.body.removeChild(node);
								deferred.callback(svg);
							}catch(e){
								deferred.errback(e);
							}
						};
						ts.whenLoaded(null,draw);
					 }catch (ex) {
						deferred.errback(ex);
					}
				};
				//See if we can call it directly or pass it to the deferred to be
				//called on initialization.
				if(gu._initSvgSerializerDeferred.fired > 0){
					serializer();
				}else{
					gu._initSvgSerializerDeferred.addCallback(serializer);
				}
			}
			return deferred; //dojo.Deferred that will be called when serialization finishes.
		},

		//iFrame document used for handling SVG serialization.
		_gfxSvgProxy: null,

		//Serializer loaded.
		_initSvgSerializerDeferred: null,

		_svgSerializerInitialized: function() {
			// summary:
			//		Internal function to call when the serializer init completed.
			// tags:
			//		private
			gu._initSvgSerializerDeferred.callback(true);
		},

		_initSvgSerializer: function(){
			// summary:
			//		Internal function to initialize the hidden iframe where SVG rendering
			//		will occur.
			// tags:
			//		private
			if(!gu._initSvgSerializerDeferred){
				gu._initSvgSerializerDeferred = new Deferred();
				var f = win.doc.createElement("iframe");
				html.style(f, {
					display: "none",
					position: "absolute",
					width: "1em",
					height: "1em",
					top: "-10000px"
				});
				var intv;
				if(has("ie")){
					f.onreadystatechange = function(){
						if(f.contentWindow.document.readyState == "complete"){
							f.onreadystatechange = function() {};
							intv = setInterval(function() {
								if(f.contentWindow[kernel.scopeMap["dojo"][1]._scopeName] &&
								   f.contentWindow[kernel.scopeMap["dojox"][1]._scopeName].gfx &&
								   f.contentWindow[kernel.scopeMap["dojox"][1]._scopeName].gfx.utils){
									clearInterval(intv);
									f.contentWindow.parent[kernel.scopeMap["dojox"][1]._scopeName].gfx.utils._gfxSvgProxy = f.contentWindow;
									f.contentWindow.parent[kernel.scopeMap["dojox"][1]._scopeName].gfx.utils._svgSerializerInitialized();
								}
							}, 50);
						}
					};
				}else{
					f.onload = function(){
						f.onload = function() {};
						intv = setInterval(function() {
							if(f.contentWindow[kernel.scopeMap["dojo"][1]._scopeName] &&
							   f.contentWindow[kernel.scopeMap["dojox"][1]._scopeName].gfx &&
							   f.contentWindow[kernel.scopeMap["dojox"][1]._scopeName].gfx.utils){
								clearInterval(intv);
								f.contentWindow.parent[kernel.scopeMap["dojox"][1]._scopeName].gfx.utils._gfxSvgProxy = f.contentWindow;
								f.contentWindow.parent[kernel.scopeMap["dojox"][1]._scopeName].gfx.utils._svgSerializerInitialized();
							}
						}, 50);
					};
				}
				//We have to load the GFX SVG proxy frame.  Default is to use the one packaged in dojox.
				var uri = (config["dojoxGfxSvgProxyFrameUrl"]||require.toUrl("dojox/gfx/resources/gfxSvgProxyFrame.html"));
				f.setAttribute("src", uri.toString());
				win.body().appendChild(f);
			}
		},

		_innerXML: function(/*Node*/node){
			// summary:
			//		Implementation of MS's innerXML function, borrowed from dojox.xml.parser.
			// node:
			//		The node from which to generate the XML text representation.
			// tags:
			//		private
			if(node.innerXML){
				return node.innerXML;	//String
			}else if(node.xml){
				return node.xml;		//String
			}else if(typeof XMLSerializer != "undefined"){
				return (new XMLSerializer()).serializeToString(node);	//String
			}
			return null;
		},

		_cleanSvg: function(svg) {
			// summary:
			//		Internal function that cleans up artifacts in extracted SVG content.
			// tags:
			//		private
			if(svg){
				//Make sure the namespace is set.
				if(svg.indexOf("xmlns=\"http://www.w3.org/2000/svg\"") == -1){
					svg = svg.substring(4, svg.length);
					svg = "<svg xmlns=\"http://www.w3.org/2000/svg\"" + svg;
				}
				//Same for xmlns:xlink (missing in Chrome and Safari)
				if(svg.indexOf("xmlns:xlink=\"http://www.w3.org/1999/xlink\"") == -1){
					svg = svg.substring(4, svg.length);
					svg = "<svg xmlns:xlink=\"http://www.w3.org/1999/xlink\"" + svg;
				}
				//and add namespace to href attribute if not done yet 
				//(FF 5+ adds xlink:href but not the xmlns def)
				if(svg.indexOf("xlink:href") === -1){
					svg = svg.replace(/href\s*=/g, "xlink:href=");
				}
				//Do some other cleanup, like stripping out the
				//dojoGfx attributes and quoting ids.
				svg = svg.replace(/\bdojoGfx\w*\s*=\s*(['"])\w*\1/g, "");
				svg = svg.replace(/\b__gfxObject__\s*=\s*(['"])\w*\1/g, "");
				svg = svg.replace(/[=]([^"']+?)(\s|>)/g,'="$1"$2');
			}
			return svg;  //Cleaned SVG text.
		}
	});

	return gu;
});

},
'dojox/charting/plot2d/Areas':function(){
define("dojox/charting/plot2d/Areas", ["dojo/_base/declare", "./Default"], 
  function(declare, Default){
/*=====
var Default = dojox.charting.plot2d.Default;
=====*/
	return declare("dojox.charting.plot2d.Areas", Default, {
		//	summary:
		//		Represents an area chart.  See dojox.charting.plot2d.Default for details.
		constructor: function(){
			this.opt.lines = true;
			this.opt.areas = true;
		}
	});
});

},
'dojox/lang/functional/array':function(){
define("dojox/lang/functional/array", ["dojo/_base/kernel", "dojo/_base/lang", "dojo/_base/array", "dojo/_base/window", "./lambda"], 
	function(dojo, lang, arr, win, df){

// This module adds high-level functions and related constructs:
//	- array-processing functions similar to standard JS functions

// Notes:
//	- this module provides JS standard methods similar to high-level functions in dojo/_base/array.js:
//		forEach, map, filter, every, some

// Defined methods:
//	- take any valid lambda argument as the functional argument
//	- operate on dense arrays
//	- take a string as the array argument
//	- take an iterator objects as the array argument

	var empty = {};

/*=====
	var df = dojox.lang.functional;
 =====*/
	lang.mixin(df, {
		// JS 1.6 standard array functions, which can take a lambda as a parameter.
		// Consider using dojo._base.array functions, if you don't need the lambda support.
		filter: function(/*Array|String|Object*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary: creates a new array with all elements that pass the test
			//	implemented by the provided function.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || win.global; f = df.lambda(f);
			var t = [], v, i, n;
			if(lang.isArray(a)){
				// array
				for(i = 0, n = a.length; i < n; ++i){
					v = a[i];
					if(f.call(o, v, i, a)){ t.push(v); }
				}
			}else if(typeof a.hasNext == "function" && typeof a.next == "function"){
				// iterator
				for(i = 0; a.hasNext();){
					v = a.next();
					if(f.call(o, v, i++, a)){ t.push(v); }
				}
			}else{
				// object/dictionary
				for(i in a){
					if(!(i in empty)){
						v = a[i];
						if(f.call(o, v, i, a)){ t.push(v); }
					}
				}
			}
			return t;	// Array
		},
		forEach: function(/*Array|String|Object*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary: executes a provided function once per array element.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || win.global; f = df.lambda(f);
			var i, n;
			if(lang.isArray(a)){
				// array
				for(i = 0, n = a.length; i < n; f.call(o, a[i], i, a), ++i);
			}else if(typeof a.hasNext == "function" && typeof a.next == "function"){
				// iterator
				for(i = 0; a.hasNext(); f.call(o, a.next(), i++, a));
			}else{
				// object/dictionary
				for(i in a){
					if(!(i in empty)){
						f.call(o, a[i], i, a);
					}
				}
			}
			return o;	// Object
		},
		map: function(/*Array|String|Object*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary: creates a new array with the results of calling
			//	a provided function on every element in this array.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || win.global; f = df.lambda(f);
			var t, n, i;
			if(lang.isArray(a)){
				// array
				t = new Array(n = a.length);
				for(i = 0; i < n; t[i] = f.call(o, a[i], i, a), ++i);
			}else if(typeof a.hasNext == "function" && typeof a.next == "function"){
				// iterator
				t = [];
				for(i = 0; a.hasNext(); t.push(f.call(o, a.next(), i++, a)));
			}else{
				// object/dictionary
				t = [];
				for(i in a){
					if(!(i in empty)){
						t.push(f.call(o, a[i], i, a));
					}
				}
			}
			return t;	// Array
		},
		every: function(/*Array|String|Object*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary: tests whether all elements in the array pass the test
			//	implemented by the provided function.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || win.global; f = df.lambda(f);
			var i, n;
			if(lang.isArray(a)){
				// array
				for(i = 0, n = a.length; i < n; ++i){
					if(!f.call(o, a[i], i, a)){
						return false;	// Boolean
					}
				}
			}else if(typeof a.hasNext == "function" && typeof a.next == "function"){
				// iterator
				for(i = 0; a.hasNext();){
					if(!f.call(o, a.next(), i++, a)){
						return false;	// Boolean
					}
				}
			}else{
				// object/dictionary
				for(i in a){
					if(!(i in empty)){
						if(!f.call(o, a[i], i, a)){
							return false;	// Boolean
						}
					}
				}
			}
			return true;	// Boolean
		},
		some: function(/*Array|String|Object*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary: tests whether some element in the array passes the test
			//	implemented by the provided function.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || win.global; f = df.lambda(f);
			var i, n;
			if(lang.isArray(a)){
				// array
				for(i = 0, n = a.length; i < n; ++i){
					if(f.call(o, a[i], i, a)){
						return true;	// Boolean
					}
				}
			}else if(typeof a.hasNext == "function" && typeof a.next == "function"){
				// iterator
				for(i = 0; a.hasNext();){
					if(f.call(o, a.next(), i++, a)){
						return true;	// Boolean
					}
				}
			}else{
				// object/dictionary
				for(i in a){
					if(!(i in empty)){
						if(f.call(o, a[i], i, a)){
							return true;	// Boolean
						}
					}
				}
			}
			return false;	// Boolean
		}
	});
	
	return df;
});

},
'dojox/charting/Chart2D':function(){
define("dojox/charting/Chart2D", ["dojo/_base/kernel", "dojox", "./Chart", 
	"./axis2d/Default", "./axis2d/Invisible", "./plot2d/Default", "./plot2d/Lines", "./plot2d/Areas",
	"./plot2d/Markers", "./plot2d/MarkersOnly", "./plot2d/Scatter", "./plot2d/Stacked", "./plot2d/StackedLines",
	"./plot2d/StackedAreas", "./plot2d/Columns", "./plot2d/StackedColumns", "./plot2d/ClusteredColumns",
	"./plot2d/Bars", "./plot2d/StackedBars", "./plot2d/ClusteredBars", "./plot2d/Grid", "./plot2d/Pie",
	"./plot2d/Bubble", "./plot2d/Candlesticks", "./plot2d/OHLC", "./plot2d/Spider"], 
	  function(dojo, dojox, Chart){
	dojo.deprecated("dojox.charting.Chart2D", "Use dojo.charting.Chart instead and require all other components explicitly", "2.0");
	// module:
	//		dojox/charting/Chart2D
	// summary:
	//		This is a compatibility module which loads all charting modules that used to be automatically
	//		loaded in versions prior to 1.6.  It is highly recommended for performance reasons that
	//		this module no longer be referenced by applications.  Instead, use dojox/charting/Chart.
	return dojox.charting.Chart2D = Chart;
});

},
'dojox/charting/Series':function(){
define("dojox/charting/Series", ["dojo/_base/lang", "dojo/_base/declare", "./Element"], 
	function(lang, declare, Element){ 
	/*=====
	dojox.charting.__SeriesCtorArgs = function(plot){
		//	summary:
		//		An optional arguments object that can be used in the Series constructor.
		//	plot: String?
		//		The plot (by name) that this series belongs to.
		this.plot = plot;
	}

	var Element = dojox.charting.Element;
	=====*/
	return declare("dojox.charting.Series", Element, {
		//	summary:
		//		An object representing a series of data for plotting on a chart.
		constructor: function(chart, data, kwArgs){
			//	summary:
			//		Create a new data series object for use within charting.
			//	chart: dojox.charting.Chart
			//		The chart that this series belongs to.
			//	data: Array|Object:
			//		The array of data points (either numbers or objects) that
			//		represents the data to be drawn. Or it can be an object. In
			//		the latter case, it should have a property "data" (an array),
			//		destroy(), and setSeriesObject().
			//	kwArgs: dojox.charting.__SeriesCtorArgs?
			//		An optional keyword arguments object to set details for this series.
			lang.mixin(this, kwArgs);
			if(typeof this.plot != "string"){ this.plot = "default"; }
			this.update(data);
		},
	
		clear: function(){
			//	summary:
			//		Clear the calculated additional parameters set on this series.
			this.dyn = {};
		},
		
		update: function(data){
			//	summary:
			//		Set data and make this object dirty, so it can be redrawn.
			//	data: Array|Object:
			//		The array of data points (either numbers or objects) that
			//		represents the data to be drawn. Or it can be an object. In
			//		the latter case, it should have a property "data" (an array),
			//		destroy(), and setSeriesObject().
			if(lang.isArray(data)){
				this.data = data;
			}else{
				this.source = data;
				this.data = this.source.data;
				if(this.source.setSeriesObject){
					this.source.setSeriesObject(this);
				}
			}
			this.dirty = true;
			this.clear();
		}
	});

});

},
'esri/layers/osm':function(){
// wrapped by build app
define(["dijit","dojo","dojox","dojo/require!esri/layers/tiled"], function(dijit,dojo,dojox){
dojo.provide("esri.layers.osm");

dojo.require("esri.layers.tiled");

dojo.declare("esri.layers.OpenStreetMapLayer", esri.layers.TiledMapServiceLayer, {
  constructor: function(/*Object?*/ options){
    this.spatialReference = new esri.SpatialReference({ wkid: 102100 });
    
    this.tileInfo = new esri.layers.TileInfo({
      rows: 256,
      cols: 256,
      dpi: 96,
      format: "PNG8",
      compressionQuality: 0,
      origin: { x: -20037508.342787, y: 20037508.342787 },
      spatialReference: { wkid: 102100 },
      lods: [
        { level: 0, scale: 591657527.591555, resolution: 156543.033928 },
        { level: 1, scale: 295828763.795777, resolution: 78271.5169639999 },
        { level: 2, scale: 147914381.897889, resolution: 39135.7584820001 },
        { level: 3, scale: 73957190.948944, resolution: 19567.8792409999 },
        { level: 4, scale: 36978595.474472, resolution: 9783.93962049996 },
        { level: 5, scale: 18489297.737236, resolution: 4891.96981024998 },
        { level: 6, scale: 9244648.868618, resolution: 2445.98490512499 },
        { level: 7, scale: 4622324.434309, resolution: 1222.99245256249 },
        { level: 8, scale: 2311162.217155, resolution: 611.49622628138 },
        { level: 9, scale: 1155581.108577, resolution: 305.748113140558 },
        { level: 10, scale: 577790.554289, resolution: 152.874056570411 },
        { level: 11, scale: 288895.277144, resolution: 76.4370282850732 },
        { level: 12, scale: 144447.638572, resolution: 38.2185141425366 },
        { level: 13, scale: 72223.819286, resolution: 19.1092570712683 },
        { level: 14, scale: 36111.909643, resolution: 9.55462853563415 },
        { level: 15, scale: 18055.954822, resolution: 4.77731426794937 },
        { level: 16, scale: 9027.977411, resolution: 2.38865713397468 },
        { level: 17, scale: 4513.988705, resolution: 1.19432856685505 },
        { level: 18, scale: 2256.994353, resolution: 0.597164283559817 }
      ]
    });
    // http://wiki.openstreetmap.org/wiki/Zoom_levels
    
    this.fullExtent = new esri.geometry.Extent({
      xmin: -20037508.34,
      ymin: -20037508.34,
      xmax: 20037508.34,
      ymax: 20037508.34,
      spatialReference: { wkid: 102100 }
    });
    
    this.initialExtent = new esri.geometry.Extent({
      xmin: -20037508.34,
      ymin: -20037508.34,
      xmax: 20037508.34,
      ymax: 20037508.34,
      spatialReference: { wkid: 102100 }
    });
    
    this.tileServers = (options && options.tileServers) || [
      "http://a.tile.openstreetmap.org",
      "http://b.tile.openstreetmap.org",
      "http://c.tile.openstreetmap.org"
    ];
    this.serversLength = this.tileServers.length;
    //this.serverIndex = 0;
    
    // see esri.layers.TiledMapServiceLayer constructor for info
    this._displayLevels = options ? options.displayLevels : null;
    
    this.loaded = true;
    this.onLoad(this);

    var callback = options && options.loadCallback;
    if (callback) {
      callback(this);
    }
  },
  
  getTileUrl: function(level, row, col){
    return esri._getProxiedUrl(this.tileServers[row % this.serversLength] + "/" + level + "/" + col + "/" + row + ".png");
  }
});

});

},
'esri/layers/KMLLayer':function(){
// wrapped by build app
define(["dijit","dojo","dojox","dojo/require!esri/utils,esri/layers/layer,esri/layers/MapImageLayer,esri/layers/FeatureLayer,esri/dijit/Popup"], function(dijit,dojo,dojox){
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

},
'dojox/charting/plot2d/Spider':function(){
define("dojox/charting/plot2d/Spider", ["dojo/_base/lang", "dojo/_base/declare", "dojo/_base/connect", "dojo/_base/html", "dojo/_base/array",
	"dojo/dom-geometry", "dojo/_base/fx", "dojo/fx", "dojo/_base/sniff", 
	"../Element", "./_PlotEvents", "dojo/_base/Color", "dojox/color/_base", "./common", "../axis2d/common", 
	"../scaler/primitive", "dojox/gfx", "dojox/gfx/matrix", "dojox/gfx/fx", "dojox/lang/functional", 
	"dojox/lang/utils", "dojo/fx/easing"],
	function(lang, declare, hub, html, arr, domGeom, baseFx, coreFx, has, 
			Element, PlotEvents, Color, dxcolor, dc, da, primitive,
			g, m, gfxfx, df, du, easing){
/*=====
var Element = dojox.charting.Element;
var PlotEvents = dojox.charting.plot2d._PlotEvents;
=====*/
	var FUDGE_FACTOR = 0.2; // use to overlap fans

	var Spider = declare("dojox.charting.plot2d.Spider", [Element, PlotEvents], {
		//	summary:
		//		The plot that represents a typical Spider chart.
		defaultParams: {
			labels:			true,
			ticks:			false,
			fixed:			true,
			precision:		1,
			labelOffset:	-10,
			labelStyle:		"default",	// default/rows/auto
			htmlLabels:		true,		// use HTML to draw labels
			startAngle:		-90,		// start angle for slices in degrees
			divisions:		 3,			// radius tick count
			axisColor:		 "",		// spider axis color
			axisWidth:		 0,			// spider axis stroke width
			spiderColor:	 "",		// spider web color
			spiderWidth:	 0,			// spider web stroke width
			seriesWidth:	 0,			// plot border with
			seriesFillAlpha: 0.2,		// plot fill alpha
			spiderOrigin:	 0.16,
			markerSize:		 3,			// radius of plot vertex (px)
			spiderType:		 "polygon", //"circle"
			animationType:	 easing.backOut,
			axisTickFont:		"",
			axisTickFontColor:	"",
			axisFont:			"",
			axisFontColor:		""
		},
		optionalParams: {
			radius:		0,
			font:		"",
			fontColor:	""
		},

		constructor: function(chart, kwArgs){
			//	summary:
			//		Create a Spider plot.
			this.opt = lang.clone(this.defaultParams);
			du.updateWithObject(this.opt, kwArgs);
			du.updateWithPattern(this.opt, kwArgs, this.optionalParams);
			this.series = [];
			this.dyn = [];
			this.datas = {};
			this.labelKey = [];
			this.oldSeriePoints = {};
			this.animations = {};
		},
		clear: function(){
			//	summary:
			//		Clear out all of the information tied to this plot.
			//	returns: dojox.charting.plot2d.Spider
			//		A reference to this plot for functional chaining.
			this.dirty = true;
			this.dyn = [];
			this.series = [];
			this.datas = {};
			this.labelKey = [];
			this.oldSeriePoints = {};
			this.animations = {};
			return this;	//	dojox.charting.plot2d.Spider
		},
		setAxis: function(axis){
			//	summary:
			//		Dummy method, since axes are irrelevant with a Spider chart.
			//	returns: dojox.charting.plot2d.Spider
			//		The reference to this plot for functional chaining.
			return this;	//	dojox.charting.plot2d.Spider
		},
		addSeries: function(run){
			//	summary:
			//		Add a data series to this plot.
			//	run: dojox.charting.Series
			//		The series to be added.
			//	returns: dojox.charting.plot2d.Base
			//		A reference to this plot for functional chaining.
			var matched = false;
			this.series.push(run);
			for(var key in run.data){
				var val = run.data[key],
					data = this.datas[key];
				if(data){
					data.vlist.push(val);
					data.min = Math.min(data.min, val);
					data.max = Math.max(data.max, val);
				}else{
					this.datas[key] = {min: val, max: val, vlist: [val]};
				}
			}
			if (this.labelKey.length <= 0) {
				for (var key in run.data) {
					this.labelKey.push(key);
				}
			}
			return this;	//	dojox.charting.plot2d.Base
		},
		getSeriesStats: function(){
			//	summary:
			//		Calculate the min/max on all attached series in both directions.
			//	returns: Object
			//		{hmin, hmax, vmin, vmax} min/max in both directions.
			return dc.collectSimpleStats(this.series);
		},
		calculateAxes: function(dim){
			//	summary:
			//		Stub function for running the axis calculations (depricated).
			//	dim: Object
			//		An object of the form { width, height }
			//	returns: dojox.charting.plot2d.Base
			//		A reference to this plot for functional chaining.
			this.initializeScalers(dim, this.getSeriesStats());
			return this;	//	dojox.charting.plot2d.Base
		},
		getRequiredColors: function(){
			//	summary:
			//		Get how many data series we have, so we know how many colors to use.
			//	returns: Number
			//		The number of colors needed.
			return this.series.length;	//	Number
		},
		initializeScalers: function(dim, stats){
			//	summary:
			//		Initializes scalers using attached axes.
			//	dim: Object:
			//		Size of a plot area in pixels as {width, height}.
			//	stats: Object:
			//		Min/max of data in both directions as {hmin, hmax, vmin, vmax}.
			//	returns: dojox.charting.plot2d.Base
			//		A reference to this plot for functional chaining.
			if(this._hAxis){
				if(!this._hAxis.initialized()){
					this._hAxis.calculate(stats.hmin, stats.hmax, dim.width);
				}
				this._hScaler = this._hAxis.getScaler();
			}else{
				this._hScaler = primitive.buildScaler(stats.hmin, stats.hmax, dim.width);
			}
			if(this._vAxis){
				if(!this._vAxis.initialized()){
					this._vAxis.calculate(stats.vmin, stats.vmax, dim.height);
				}
				this._vScaler = this._vAxis.getScaler();
			}else{
				this._vScaler = primitive.buildScaler(stats.vmin, stats.vmax, dim.height);
			}
			return this;	//	dojox.charting.plot2d.Base
		},
		render: function(dim, offsets){
			//	summary:
			//		Render the plot on the chart.
			//	dim: Object
			//		An object of the form { width, height }.
			//	offsets: Object
			//		An object of the form { l, r, t, b }.
			//	returns: dojox.charting.plot2d.Spider
			//		A reference to this plot for functional chaining.
			if(!this.dirty){ return this; }
			this.dirty = false;
			this.cleanGroup();
			var s = this.group, t = this.chart.theme;
			this.resetEvents();

			if(!this.series || !this.series.length){
				return this;
			}

			// calculate the geometry
			var o = this.opt, ta = t.axis,
				rx = (dim.width	 - offsets.l - offsets.r) / 2,
				ry = (dim.height - offsets.t - offsets.b) / 2,
				r  = Math.min(rx, ry),
				axisTickFont = o.font || (ta.majorTick && ta.majorTick.font) || (ta.tick && ta.tick.font) || "normal normal normal 7pt Tahoma",
				axisFont = o.axisFont || (ta.tick && ta.tick.titleFont) || "normal normal normal 11pt Tahoma",
				axisTickFontColor = o.axisTickFontColor || (ta.majorTick && ta.majorTick.fontColor) || (ta.tick && ta.tick.fontColor) || "silver",
				axisFontColor = o.axisFontColor || (ta.tick && ta.tick.titleFontColor) || "black",
				axisColor = o.axisColor || (ta.tick && ta.tick.axisColor) || "silver",
				spiderColor = o.spiderColor || (ta.tick && ta.tick.spiderColor) || "silver",
				axisWidth = o.axisWidth || (ta.stroke && ta.stroke.width) || 2,
				spiderWidth = o.spiderWidth || (ta.stroke && ta.stroke.width) || 2,
				seriesWidth = o.seriesWidth || (ta.stroke && ta.stroke.width) || 2,
				asize = g.normalizedLength(g.splitFontString(axisFont).size),
				startAngle = m._degToRad(o.startAngle),
				start = startAngle, step, filteredRun, slices, labels, shift, labelR,
				outerPoints, innerPoints, divisionPoints, divisionRadius, labelPoints,
				ro = o.spiderOrigin, dv = o.divisions >= 3 ? o.divisions : 3, ms = o.markerSize,
				spt = o.spiderType, at = o.animationType, lboffset = o.labelOffset < -10 ? o.labelOffset : -10,
				axisExtra = 0.2;
			
			if(o.labels){
				labels = arr.map(this.series, function(s){
					return s.name;
				}, this);
				shift = df.foldl1(df.map(labels, function(label, i){
					var font = t.series.font;
					return g._base._getTextBox(label, {
						font: font
					}).w;
				}, this), "Math.max(a, b)") / 2;
				r = Math.min(rx - 2 * shift, ry - asize) + lboffset;
				labelR = r - lboffset;
			}
			if ("radius" in o) {
				r = o.radius;
				labelR = r - lboffset;
			}
			r /= (1+axisExtra);
			var circle = {
				cx: offsets.l + rx,
				cy: offsets.t + ry,
				r: r
			};
			
			for (var i = this.series.length - 1; i >= 0; i--) {
				var serieEntry = this.series[i];
				if (!this.dirty && !serieEntry.dirty) {
					t.skip();
					continue;
				}
				serieEntry.cleanGroup();
				var run = serieEntry.data;
				if (run !== null) {
					var len = this._getObjectLength(run);
					//construct connect points
					if (!outerPoints || outerPoints.length <= 0) {
						outerPoints = [], innerPoints = [], labelPoints = [];
						this._buildPoints(outerPoints, len, circle, r, start, true);
						this._buildPoints(innerPoints, len, circle, r*ro, start, true);
						this._buildPoints(labelPoints, len, circle, labelR, start);
						if(dv > 2){
							divisionPoints = [], divisionRadius = [];
							for (var j = 0; j < dv - 2; j++) {
								divisionPoints[j] = [];
								this._buildPoints(divisionPoints[j], len, circle, r*(ro + (1-ro)*(j+1)/(dv-1)), start, true);
								divisionRadius[j] = r*(ro + (1-ro)*(j+1)/(dv-1));
							}
						}
					}
				}
			}
			
			//draw Spider
			//axis
			var axisGroup = s.createGroup(), axisStroke = {color: axisColor, width: axisWidth},
				spiderStroke = {color: spiderColor, width: spiderWidth};
			for (var j = outerPoints.length - 1; j >= 0; --j) {
				var point = outerPoints[j],
					st = {
						x: point.x + (point.x - circle.cx) * axisExtra,
						y: point.y + (point.y - circle.cy) * axisExtra
					},
					nd = {
						x: point.x + (point.x - circle.cx) * axisExtra / 2,
						y: point.y + (point.y - circle.cy) * axisExtra / 2
					};
				axisGroup.createLine({
					x1: circle.cx,
					y1: circle.cy,
					x2: st.x,
					y2: st.y
				}).setStroke(axisStroke);
				//arrow
				this._drawArrow(axisGroup, st, nd, axisStroke);
			}
			
			// draw the label
			var labelGroup = s.createGroup();
			for (var j = labelPoints.length - 1; j >= 0; --j) {
				var point = labelPoints[j],
					fontWidth = g._base._getTextBox(this.labelKey[j], {font: axisFont}).w || 0,
					render = this.opt.htmlLabels && g.renderer != "vml" ? "html" : "gfx",
					elem = da.createText[render](this.chart, labelGroup, (!domGeom.isBodyLtr() && render == "html") ? (point.x + fontWidth - dim.width) : point.x, point.y,
							"middle", this.labelKey[j], axisFont, axisFontColor);
				if (this.opt.htmlLabels) {
					this.htmlElements.push(elem);
				}
			}
			
			//spider web: polygon or circle
			var spiderGroup = s.createGroup();
			if(spt == "polygon"){
				spiderGroup.createPolyline(outerPoints).setStroke(spiderStroke);
				spiderGroup.createPolyline(innerPoints).setStroke(spiderStroke);
				if (divisionPoints.length > 0) {
					for (var j = divisionPoints.length - 1; j >= 0; --j) {
						spiderGroup.createPolyline(divisionPoints[j]).setStroke(spiderStroke);
					}
				}
			}else{//circle
				var ccount = this._getObjectLength(this.datas);
				spiderGroup.createCircle({cx: circle.cx, cy: circle.cy, r: r}).setStroke(spiderStroke);
				spiderGroup.createCircle({cx: circle.cx, cy: circle.cy, r: r*ro}).setStroke(spiderStroke);
				if (divisionRadius.length > 0) {
					for (var j = divisionRadius.length - 1; j >= 0; --j) {
						spiderGroup.createCircle({cx: circle.cx, cy: circle.cy, r: divisionRadius[j]}).setStroke(spiderStroke);
					}
				}
			}
			//text
			var textGroup = s.createGroup(), len = this._getObjectLength(this.datas), k = 0;
			for(var key in this.datas){
				var data = this.datas[key], min = data.min, max = data.max, distance = max - min,
					end = start + 2 * Math.PI * k / len;
				for (var i = 0; i < dv; i++) {
					var text = min + distance*i/(dv-1), point = this._getCoordinate(circle, r*(ro + (1-ro)*i/(dv-1)), end);
					text = this._getLabel(text);
					var fontWidth = g._base._getTextBox(text, {font: axisTickFont}).w || 0,
						render = this.opt.htmlLabels && g.renderer != "vml" ? "html" : "gfx";
					if (this.opt.htmlLabels) {
						this.htmlElements.push(da.createText[render]
							(this.chart, textGroup, (!domGeom.isBodyLtr() && render == "html") ? (point.x + fontWidth - dim.width) : point.x, point.y,
								"start", text, axisTickFont, axisTickFontColor));
					}
				}
				k++;
			}
			
			//draw series (animation)
			this.chart.seriesShapes = {};
			var animationConnections = [];
			for (var i = this.series.length - 1; i >= 0; i--) {
				var serieEntry = this.series[i], run = serieEntry.data;
				if (run !== null) {
					//series polygon
					var seriePoints = [], k = 0, tipData = [];
					for(var key in run){
						var data = this.datas[key], min = data.min, max = data.max, distance = max - min,
							entry = run[key], end = start + 2 * Math.PI * k / len,
							point = this._getCoordinate(circle, r*(ro + (1-ro)*(entry-min)/distance), end);
						seriePoints.push(point);
						tipData.push({sname: serieEntry.name, key: key, data: entry});
						k++;
					}
					seriePoints[seriePoints.length] = seriePoints[0];
					tipData[tipData.length] = tipData[0];
					var polygonBoundRect = this._getBoundary(seriePoints),
						theme = t.next("spider", [o, serieEntry]), ts = serieEntry.group,
						f = g.normalizeColor(theme.series.fill), sk = {color: theme.series.fill, width: seriesWidth};
					f.a = o.seriesFillAlpha;
					serieEntry.dyn = {fill: f, stroke: sk};
					
					var osps = this.oldSeriePoints[serieEntry.name];
					var cs = this._createSeriesEntry(ts, (osps || innerPoints), seriePoints, f, sk, r, ro, ms, at);
					this.chart.seriesShapes[serieEntry.name] = cs;
					this.oldSeriePoints[serieEntry.name] = seriePoints;
					
					var po = {
						element: "spider_poly",
						index:	 i,
						id:		 "spider_poly_"+serieEntry.name,
						run:	 serieEntry,
						plot:	 this,
						shape:	 cs.poly,
						parent:	 ts,
						brect:	 polygonBoundRect,
						cx:		 circle.cx,
						cy:		 circle.cy,
						cr:		 r,
						f:		 f,
						s:		 s
					};
					this._connectEvents(po);
					
					var so = {
						element: "spider_plot",
						index:	 i,
						id:		 "spider_plot_"+serieEntry.name,
						run:	 serieEntry,
						plot:	 this,
						shape:	 serieEntry.group
					};
					this._connectEvents(so);
					
					arr.forEach(cs.circles, function(c, i){
						var shape = c.getShape(),
							co = {
								element: "spider_circle",
								index:	 i,
								id:		 "spider_circle_"+serieEntry.name+i,
								run:	 serieEntry,
								plot:	 this,
								shape:	 c,
								parent:	 ts,
								tdata:	 tipData[i],
								cx:		 seriePoints[i].x,
								cy:		 seriePoints[i].y,
								f:		 f,
								s:		 s
							};
						this._connectEvents(co);
					}, this);
				}
			}
			return this;	//	dojox.charting.plot2d.Spider
		},
		_createSeriesEntry: function(ts, osps, sps, f, sk, r, ro, ms, at){
			//polygon
			var spoly = ts.createPolyline(osps).setFill(f).setStroke(sk), scircle = [];
			for (var j = 0; j < osps.length; j++) {
				var point = osps[j], cr = ms;
				var circle = ts.createCircle({cx: point.x, cy: point.y, r: cr}).setFill(f).setStroke(sk);
				scircle.push(circle);
			}
			
			var anims = arr.map(sps, function(np, j){
				// create animation
				var sp = osps[j],
					anim = new baseFx.Animation({
					duration: 1000,
					easing:	  at,
					curve:	  [sp.y, np.y]
				});
				var spl = spoly, sc = scircle[j];
				hub.connect(anim, "onAnimate", function(y){
					//apply poly
					var pshape = spl.getShape();
					pshape.points[j].y = y;
					spl.setShape(pshape);
					//apply circle
					var cshape = sc.getShape();
					cshape.cy = y;
					sc.setShape(cshape);
				});
				return anim;
			});
			
			var anims1 = arr.map(sps, function(np, j){
				// create animation
				var sp = osps[j],
					anim = new baseFx.Animation({
					duration: 1000,
					easing:	  at,
					curve:	  [sp.x, np.x]
				});
				var spl = spoly, sc = scircle[j];
				hub.connect(anim, "onAnimate", function(x){
					//apply poly
					var pshape = spl.getShape();
					pshape.points[j].x = x;
					spl.setShape(pshape);
					//apply circle
					var cshape = sc.getShape();
					cshape.cx = x;
					sc.setShape(cshape);
				});
				return anim;
			});
			var masterAnimation = coreFx.combine(anims.concat(anims1)); //dojo.fx.chain(anims);
			masterAnimation.play();
			return {group :ts, poly: spoly, circles: scircle};
		},
		plotEvent: function(o){
			//	summary:
			//		Stub function for use by specific plots.
			//	o: Object
			//		An object intended to represent event parameters.
			var runName = o.id ? o.id : "default", a;
			if (runName in this.animations) {
				a = this.animations[runName];
				a.anim && a.anim.stop(true);
			} else {
				a = this.animations[runName] = {};
			}
			if(o.element == "spider_poly"){
				if(!a.color){
					var color = o.shape.getFill();
					if(!color || !(color instanceof Color)){
						return;
					}
					a.color = {
						start: color,
						end:   transColor(color)
					};
				}
				var start = a.color.start, end = a.color.end;
				if(o.type == "onmouseout"){
					// swap colors
					var t = start; start = end; end = t;
				}
				a.anim = gfxfx.animateFill({
					shape:	  o.shape,
					duration: 800,
					easing:	  easing.backOut,
					color:	  {start: start, end: end}
				});
				a.anim.play();
			}else if(o.element == "spider_circle"){
				var init, scale, defaultScale = 1.5;
				if(o.type == "onmouseover"){
					init  = m.identity;
					scale = defaultScale;
					//show tooltip
					var aroundRect = {type: "rect"};
					aroundRect.x = o.cx;
					aroundRect.y = o.cy;
					aroundRect.width = aroundRect.height = 1;
					var lt = html.coords(this.chart.node, true);
					aroundRect.x += lt.x;
					aroundRect.y += lt.y;
					aroundRect.x = Math.round(aroundRect.x);
					aroundRect.y = Math.round(aroundRect.y);
					aroundRect.width = Math.ceil(aroundRect.width);
					aroundRect.height = Math.ceil(aroundRect.height);
					this.aroundRect = aroundRect;
					var position = ["after", "before"];
					dc.doIfLoaded("dijit/Tooltip", dojo.hitch(this, function(Tooltip){
						Tooltip.show(o.tdata.sname + "<br/>" + o.tdata.key + "<br/>" + o.tdata.data, this.aroundRect, position);
					}));
				}else{
					init  = m.scaleAt(defaultScale, o.cx, o.cy);
					scale = 1/defaultScale;
					dc.doIfLoaded("dijit/Tooltip", dojo.hitch(this, function(Tooltip){
						this.aroundRect && Tooltip.hide(this.aroundRect);
					}));
				}
				var cs = o.shape.getShape(),
					init = m.scaleAt(defaultScale, cs.cx, cs.cy),
					kwArgs = {
						shape: o.shape,
						duration: 200,
						easing:	  easing.backOut,
						transform: [
							{name: "scaleAt", start: [1, cs.cx, cs.cy], end: [scale, cs.cx, cs.cy]},
							init
						]
					};
				a.anim = gfxfx.animateTransform(kwArgs);
				a.anim.play();
			}else if(o.element == "spider_plot"){
				//dojo gfx function "moveToFront" not work in IE
				if (o.type == "onmouseover" && !has("ie")) {
					o.shape.moveToFront();
				}
			}
		},
		_getBoundary: function(points){
			var xmax = points[0].x,
				xmin = points[0].x,
				ymax = points[0].y,
				ymin = points[0].y;
			for(var i = 0; i < points.length; i++){
				var point = points[i];
				xmax = Math.max(point.x, xmax);
				ymax = Math.max(point.y, ymax);
				xmin = Math.min(point.x, xmin);
				ymin = Math.min(point.y, ymin);
			}
			return {
				x: xmin,
				y: ymin,
				width: xmax - xmin,
				height: ymax - ymin
			};
		},
		
		_drawArrow: function(s, start, end, stroke){
			var len = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)),
				sin = (end.y - start.y)/len, cos = (end.x - start.x)/len,
				point2 = {x: end.x + (len/3)*(-sin), y: end.y + (len/3)*cos},
				point3 = {x: end.x + (len/3)*sin, y: end.y + (len/3)*(-cos)};
			s.createPolyline([start, point2, point3]).setFill(stroke.color).setStroke(stroke);
		},
		
		_buildPoints: function(points, count, circle, radius, angle, recursive){
			for (var i = 0; i < count; i++) {
				var end = angle + 2 * Math.PI * i / count;
				points.push(this._getCoordinate(circle, radius, end));
			}
			if(recursive){
				points.push(this._getCoordinate(circle, radius, angle + 2 * Math.PI));
			}
		},
		
		_getCoordinate: function(circle, radius, angle){
			return {
				x: circle.cx + radius * Math.cos(angle),
				y: circle.cy + radius * Math.sin(angle)
			}
		},
		
		_getObjectLength: function(obj){
			var count = 0;
			if(lang.isObject(obj)){
				for(var key in obj){
					count++;
				}
			}
			return count;
		},

		// utilities
		_getLabel: function(number){
			return dc.getLabel(number, this.opt.fixed, this.opt.precision);
		}
	});
	
	function transColor(color){
		var a = new dxcolor.Color(color),
			x = a.toHsl();
		if(x.s == 0){
			x.l = x.l < 50 ? 100 : 0;
		}else{
			x.s = 100;
			if(x.l < 50){
				x.l = 75;
			}else if(x.l > 75){
				x.l = 50;
			}else{
				x.l = x.l - 50 > 75 - x.l ?
					50 : 75;
			}
		}
		var color = dxcolor.fromHsl(x);
		color.a = 0.7;
		return color;
	}
	
	return Spider; // dojox.plot2d.Spider
});

},
'dojox/charting/Theme':function(){
define("dojox/charting/Theme", ["dojo/_base/lang", "dojo/_base/array","dojo/_base/declare","dojo/_base/Color",
	    "dojox/color/_base", "dojox/color/Palette", "dojox/lang/utils", "dojox/gfx/gradutils"], 
	function(lang, arr, declare, Color, colorX, Palette, dlu, dgg){ 
	
	var Theme = declare("dojox.charting.Theme", null, {
	//	summary:
	//		A Theme is a pre-defined object, primarily JSON-based, that makes up the definitions to
	//		style a chart.
	//
	//	description:
	//		While you can set up style definitions on a chart directly (usually through the various add methods
	//		on a dojox.charting.Chart object), a Theme simplifies this manual setup by allowing you to
	//		pre-define all of the various visual parameters of each element in a chart.
	//
	//		Most of the properties of a Theme are straight-forward; if something is line-based (such as
	//		an axis or the ticks on an axis), they will be defined using basic stroke parameters.  Likewise,
	//		if an element is primarily block-based (such as the background of a chart), it will be primarily
	//		fill-based.
	//
	//		In addition (for convenience), a Theme definition does not have to contain the entire JSON-based
	//		structure.  Each theme is built on top of a default theme (which serves as the basis for the theme
	//		"GreySkies"), and is mixed into the default theme object.  This allows you to create a theme based,
	//		say, solely on colors for data series.
	//
	//		Defining a new theme is relatively easy; see any of the themes in dojox.charting.themes for examples
	//		on how to define your own.
	//
	//		When you set a theme on a chart, the theme itself is deep-cloned.  This means that you cannot alter
	//		the theme itself after setting the theme value on a chart, and expect it to change your chart.  If you
	//		are looking to make alterations to a theme for a chart, the suggestion would be to create your own
	//		theme, based on the one you want to use, that makes those alterations before it is applied to a chart.
	//
	//		Finally, a Theme contains a number of functions to facilitate rendering operations on a chart--the main
	//		helper of which is the ~next~ method, in which a chart asks for the information for the next data series
	//		to be rendered.
	//
	//		A note on colors:
	//		The Theme constructor was on the use of dojox.color.Palette (in general) for creating a visually distinct
	//		set of colors for usage in a chart.  A palette is usually comprised of 5 different color definitions, and
	//		no more.  If you have a need to render a chart with more than 5 data elements, you can simply "push"
	//		new color definitions into the theme's .color array.  Make sure that you do that with the actual
	//		theme object from a Chart, and not in the theme itself (i.e. either do that before using .setTheme
	//		on a chart).
	//
	//		example:
	//			The default theme (and structure) looks like so:
	//	|	// all objects are structs used directly in dojox.gfx
	//	|	chart:{
	//	|		stroke: null,
	//	|		fill: "white",
	//	|		pageStyle: null // suggested page style as an object suitable for dojo.style()
	//	|	},
	//	|	plotarea:{
	//	|		stroke: null,
	//	|		fill: "white"
	//	|	},
	//	|	axis:{
	//	|		stroke:	{ // the axis itself
	//	|			color: "#333",
	//	|			width: 1
	//	|		},
	//	|		tick: {	// used as a foundation for all ticks
	//	|			color:     "#666",
	//	|			position:  "center",
	//	|			font:      "normal normal normal 7pt Tahoma",	// labels on axis
	//	|			fontColor: "#333"								// color of labels
	//	|		},
	//	|		majorTick:	{ // major ticks on axis, and used for major gridlines
	//	|			width:  1,
	//	|			length: 6
	//	|		},
	//	|		minorTick:	{ // minor ticks on axis, and used for minor gridlines
	//	|			width:  0.8,
	//	|			length: 3
	//	|		},
	//	|		microTick:	{ // minor ticks on axis, and used for minor gridlines
	//	|			width:  0.5,
	//	|			length: 1
	//	|		}
	//	|	},
	//	|	series: {
	//	|		stroke:  {width: 1.5, color: "#333"},		// line
	//	|		outline: {width: 0.1, color: "#ccc"},		// outline
	//	|		//shadow:  {dx: 1, dy: 1, width: 2, color: [0, 0, 0, 0.3]},
	//	|		shadow: null,								// no shadow
	//	|		fill:    "#ccc",							// fill, if appropriate
	//	|		font:    "normal normal normal 8pt Tahoma",	// if there's a label
	//	|		fontColor: "#000"							// color of labels
	//	|		labelWiring: {width: 1, color: "#ccc"},		// connect marker and target data item(slice, column, bar...)
	//	|	},
	//	|	marker: {	// any markers on a series
	//	|		symbol:  "m-3,3 l3,-6 3,6 z",				// symbol
	//	|		stroke:  {width: 1.5, color: "#333"},		// stroke
	//	|		outline: {width: 0.1, color: "#ccc"},		// outline
	//	|		shadow: null,								// no shadow
	//	|		fill:    "#ccc",							// fill if needed
	//	|		font:    "normal normal normal 8pt Tahoma",	// label
	//	|		fontColor: "#000"
	//	|	},
	//	|	indicator: {
	//	|		lineStroke:  {width: 1.5, color: "#333"},		// line
	//	|		lineOutline: {width: 0.1, color: "#ccc"},		// line outline
	//	|		lineShadow: null,								// no line shadow
	//	|		stroke:  {width: 1.5, color: "#333"},			// label background stroke
	//	|		outline: {width: 0.1, color: "#ccc"},			// label background outline
	//	|		shadow: null,									// no label background shadow
	//	|		fill:  "#ccc",									// label background fill
	//	|		radius: 3,										// radius of the label background
	//	|		font:    "normal normal normal 10pt Tahoma",	// label font
	//	|		fontColor: "#000"								// label color
	//	|		markerFill:    "#ccc",							// marker fill
	//	|		markerSymbol:  "m-3,0 c0,-4 6,-4 6,0 m-6,0 c0,4 6,4 6,0",	// marker symbol
	//	|		markerStroke:  {width: 1.5, color: "#333"},		// marker stroke
	//	|		markerOutline: {width: 0.1, color: "#ccc"},		// marker outline
	//	|		markerShadow: null,								// no marker shadow
	//	|	}
	//
	//	example:
	//		Defining a new theme is pretty simple:
	//	|	dojox.charting.themes.Grasslands = new dojox.charting.Theme({
	//	|		colors: [ "#70803a", "#dde574", "#788062", "#b1cc5d", "#eff2c2" ]
	//	|	});
	//	|
	//	|	myChart.setTheme(dojox.charting.themes.Grasslands);

	shapeSpaces: {shape: 1, shapeX: 1, shapeY: 1},

	constructor: function(kwArgs){
		//	summary:
		//		Initialize a theme using the keyword arguments.  Note that the arguments
		//		look like the example (above), and may include a few more parameters.
		kwArgs = kwArgs || {};

		// populate theme with defaults updating them if needed
		var def = Theme.defaultTheme;
		arr.forEach(["chart", "plotarea", "axis", "series", "marker", "indicator"], function(name){
			this[name] = lang.delegate(def[name], kwArgs[name]);
		}, this);

		// personalize theme
		if(kwArgs.seriesThemes && kwArgs.seriesThemes.length){
			this.colors  = null;
			this.seriesThemes = kwArgs.seriesThemes.slice(0);
		}else{
			this.seriesThemes = null;
			this.colors = (kwArgs.colors || Theme.defaultColors).slice(0);
		}
		this.markerThemes = null;
		if(kwArgs.markerThemes && kwArgs.markerThemes.length){
			this.markerThemes = kwArgs.markerThemes.slice(0);
		}
		this.markers = kwArgs.markers ? lang.clone(kwArgs.markers) : lang.delegate(Theme.defaultMarkers);

		// set flags
		this.noGradConv = kwArgs.noGradConv;
		this.noRadialConv = kwArgs.noRadialConv;
		if(kwArgs.reverseFills){
			this.reverseFills();
		}

		//	private housekeeping
		this._current = 0;
		this._buildMarkerArray();
	},

	clone: function(){
		//	summary:
		//		Clone the current theme.
		//	returns: dojox.charting.Theme
		//		The cloned theme; any alterations made will not affect the original.
		var theme = new Theme({
			// theme components
			chart: this.chart,
			plotarea: this.plotarea,
			axis: this.axis,
			series: this.series,
			marker: this.marker,
			// individual arrays
			colors: this.colors,
			markers: this.markers,
			indicator: this.indicator,
			seriesThemes: this.seriesThemes,
			markerThemes: this.markerThemes,
			// flags
			noGradConv: this.noGradConv,
			noRadialConv: this.noRadialConv
		});
		// copy custom methods
		arr.forEach(
			["clone", "clear", "next", "skip", "addMixin", "post", "getTick"],
			function(name){
				if(this.hasOwnProperty(name)){
					theme[name] = this[name];
				}
			},
			this
		);
		return theme;	//	dojox.charting.Theme
	},

	clear: function(){
		//	summary:
		//		Clear and reset the internal pointer to start fresh.
		this._current = 0;
	},

	next: function(elementType, mixin, doPost){
		//	summary:
		//		Get the next color or series theme.
		//	elementType: String?
		//		An optional element type (for use with series themes)
		//	mixin: Object?
		//		An optional object to mix into the theme.
		//	doPost: Boolean?
		//		A flag to post-process the results.
		//	returns: Object
		//		An object of the structure { series, marker, symbol }
		var merge = dlu.merge, series, marker;
		if(this.colors){
			series = lang.delegate(this.series);
			marker = lang.delegate(this.marker);
			var color = new Color(this.colors[this._current % this.colors.length]), old;
			// modify the stroke
			if(series.stroke && series.stroke.color){
				series.stroke = lang.delegate(series.stroke);
				old = new Color(series.stroke.color);
				series.stroke.color = new Color(color);
				series.stroke.color.a = old.a;
			}else{
				series.stroke = {color: color};
			}
			if(marker.stroke && marker.stroke.color){
				marker.stroke = lang.delegate(marker.stroke);
				old = new Color(marker.stroke.color);
				marker.stroke.color = new Color(color);
				marker.stroke.color.a = old.a;
			}else{
				marker.stroke = {color: color};
			}
			// modify the fill
			if(!series.fill || series.fill.type){
				series.fill = color;
			}else{
				old = new Color(series.fill);
				series.fill = new Color(color);
				series.fill.a = old.a;
			}
			if(!marker.fill || marker.fill.type){
				marker.fill = color;
			}else{
				old = new Color(marker.fill);
				marker.fill = new Color(color);
				marker.fill.a = old.a;
			}
		}else{
			series = this.seriesThemes ?
				merge(this.series, this.seriesThemes[this._current % this.seriesThemes.length]) :
				this.series;
			marker = this.markerThemes ?
				merge(this.marker, this.markerThemes[this._current % this.markerThemes.length]) :
				series;
		}

		var symbol = marker && marker.symbol || this._markers[this._current % this._markers.length];

		var theme = {series: series, marker: marker, symbol: symbol};
		
		// advance the counter
		++this._current;

		if(mixin){
			theme = this.addMixin(theme, elementType, mixin);
		}
		if(doPost){
			theme = this.post(theme, elementType);
		}

		return theme;	//	Object
	},

	skip: function(){
		//	summary:
		//		Skip the next internal color.
		++this._current;
	},

	addMixin: function(theme, elementType, mixin, doPost){
		//	summary:
		//		Add a mixin object to the passed theme and process.
		//	theme: dojox.charting.Theme
		//		The theme to mixin to.
		//	elementType: String
		//		The type of element in question. Can be "line", "bar" or "circle"
		//	mixin: Object|Array
		//		The object or objects to mix into the theme.
		//	doPost: Boolean
		//		If true, run the new theme through the post-processor.
		//	returns: dojox.charting.Theme
		//		The new theme.
		if(lang.isArray(mixin)){
			arr.forEach(mixin, function(m){
				theme = this.addMixin(theme, elementType, m);
			}, this);
		}else{
			var t = {};
			if("color" in mixin){
				if(elementType == "line" || elementType == "area"){
					lang.setObject("series.stroke.color", mixin.color, t);
					lang.setObject("marker.stroke.color", mixin.color, t);
				}else{
					lang.setObject("series.fill", mixin.color, t);
				}
			}
			arr.forEach(["stroke", "outline", "shadow", "fill", "font", "fontColor", "labelWiring"], function(name){
				var markerName = "marker" + name.charAt(0).toUpperCase() + name.substr(1),
					b = markerName in mixin;
				if(name in mixin){
					lang.setObject("series." + name, mixin[name], t);
					if(!b){
						lang.setObject("marker." + name, mixin[name], t);
					}
				}
				if(b){
					lang.setObject("marker." + name, mixin[markerName], t);
				}
			});
			if("marker" in mixin){
				t.symbol = mixin.marker;
			}
			theme = dlu.merge(theme, t);
		}
		if(doPost){
			theme = this.post(theme, elementType);
		}
		return theme;	//	dojox.charting.Theme
	},

	post: function(theme, elementType){
		//	summary:
		//		Process any post-shape fills.
		//	theme: dojox.charting.Theme
		//		The theme to post process with.
		//	elementType: String
		//		The type of element being filled.  Can be "bar" or "circle".
		//	returns: dojox.charting.Theme
		//		The post-processed theme.
		var fill = theme.series.fill, t;
		if(!this.noGradConv && this.shapeSpaces[fill.space] && fill.type == "linear"){
			if(elementType == "bar"){
				// transpose start and end points
				t = {
					x1: fill.y1,
					y1: fill.x1,
					x2: fill.y2,
					y2: fill.x2
				};
			}else if(!this.noRadialConv && fill.space == "shape" && (elementType == "slice" || elementType == "circle")){
				// switch to radial
				t = {
					type: "radial",
					cx: 0,
					cy: 0,
					r:  100
				};
			}
			if(t){
				return dlu.merge(theme, {series: {fill: t}});
			}
		}
		return theme;	//	dojox.charting.Theme
	},

	getTick: function(name, mixin){
		//	summary:
		//		Calculates and merges tick parameters.
		//	name: String
		//		Tick name, can be "major", "minor", or "micro".
		//	mixin: Object?
		//		Optional object to mix in to the tick.
		var tick = this.axis.tick, tickName = name + "Tick",
			merge = dlu.merge;
		if(tick){
			if(this.axis[tickName]){
				tick = merge(tick, this.axis[tickName]);
			}
		}else{
			tick = this.axis[tickName];
		}
		if(mixin){
			if(tick){
				if(mixin[tickName]){
					tick = merge(tick, mixin[tickName]);
				}
			}else{
				tick = mixin[tickName];
			}
		}
		return tick;	//	Object
	},

	inspectObjects: function(f){
		arr.forEach(["chart", "plotarea", "axis", "series", "marker", "indicator"], function(name){
			f(this[name]);
		}, this);
		if(this.seriesThemes){
			arr.forEach(this.seriesThemes, f);
		}
		if(this.markerThemes){
			arr.forEach(this.markerThemes, f);
		}
	},

	reverseFills: function(){
		this.inspectObjects(function(o){
			if(o && o.fill){
				o.fill = dgg.reverse(o.fill);
			}
		});
	},

	addMarker:function(/*String*/ name, /*String*/ segment){
		//	summary:
		//		Add a custom marker to this theme.
		//	example:
		//	|	myTheme.addMarker("Ellipse", foo);
		this.markers[name] = segment;
		this._buildMarkerArray();
	},

	setMarkers:function(/*Object*/ obj){
		//	summary:
		//		Set all the markers of this theme at once.  obj should be a
		//		dictionary of keys and path segments.
		//
		//	example:
		//	|	myTheme.setMarkers({ "CIRCLE": foo });
		this.markers = obj;
		this._buildMarkerArray();
	},

	_buildMarkerArray: function(){
		this._markers = [];
		for(var p in this.markers){
			this._markers.push(this.markers[p]);
		}
	}
});

/*=====
dojox.charting.Theme.__DefineColorArgs = function(num, colors, hue, saturation, low, high, base, generator){
	//	summary:
	//		The arguments object that can be passed to define colors for a theme.
	//	num: Number?
	//		The number of colors to generate.  Defaults to 5.
	//	colors: String[]|dojo.Color[]?
	//		A pre-defined set of colors; this is passed through to the Theme directly.
	//	hue: Number?
	//		A hue to base the generated colors from (a number from 0 - 359).
	//	saturation: Number?
	//		If a hue is passed, this is used for the saturation value (0 - 100).
	//	low: Number?
	//		An optional value to determine the lowest value used to generate a color (HSV model)
	//	high: Number?
	//		An optional value to determine the highest value used to generate a color (HSV model)
	//	base: String|dojo.Color?
	//		A base color to use if we are defining colors using dojox.color.Palette
	//	generator: String?
	//		The generator function name from dojox.color.Palette.
	this.num = num;
	this.colors = colors;
	this.hue = hue;
	this.saturation = saturation;
	this.low = low;
	this.high = high;
	this.base = base;
	this.generator = generator;
}
=====*/
lang.mixin(Theme, {
	defaultMarkers: {
		CIRCLE:   "m-3,0 c0,-4 6,-4 6,0 m-6,0 c0,4 6,4 6,0",
		SQUARE:   "m-3,-3 l0,6 6,0 0,-6 z",
		DIAMOND:  "m0,-3 l3,3 -3,3 -3,-3 z",
		CROSS:    "m0,-3 l0,6 m-3,-3 l6,0",
		X:        "m-3,-3 l6,6 m0,-6 l-6,6",
		TRIANGLE: "m-3,3 l3,-6 3,6 z",
		TRIANGLE_INVERTED: "m-3,-3 l3,6 3,-6 z"
	},

	defaultColors:[
		// gray skies
		"#54544c", "#858e94", "#6e767a", "#948585", "#474747"
	],

	defaultTheme: {
		// all objects are structs used directly in dojox.gfx
		chart:{
			stroke: null,
			fill: "white",
			pageStyle: null,
			titleGap:		20,
			titlePos:		"top",
			titleFont:      "normal normal bold 14pt Tahoma",	// labels on axis
			titleFontColor: "#333"
		},
		plotarea:{
			stroke: null,
			fill: "white"
		},
		// TODO: label rotation on axis
		axis:{
			stroke:	{ // the axis itself
				color: "#333",
				width: 1
			},
			tick: {	// used as a foundation for all ticks
				color:     "#666",
				position:  "center",
				font:      "normal normal normal 7pt Tahoma",	// labels on axis
				fontColor: "#333",								// color of labels
				titleGap:  15,
				titleFont: "normal normal normal 11pt Tahoma",	// labels on axis
				titleFontColor: "#333",							// color of labels
				titleOrientation: "axis"						// "axis": facing the axis, "away": facing away
			},
			majorTick:	{ // major ticks on axis, and used for major gridlines
				width:  1,
				length: 6
			},
			minorTick:	{ // minor ticks on axis, and used for minor gridlines
				width:  0.8,
				length: 3
			},
			microTick:	{ // minor ticks on axis, and used for minor gridlines
				width:  0.5,
				length: 1
			}
		},
		series: {
			// used as a "main" theme for series, sThemes augment it
			stroke:  {width: 1.5, color: "#333"},		// line
			outline: {width: 0.1, color: "#ccc"},		// outline
			//shadow:  {dx: 1, dy: 1, width: 2, color: [0, 0, 0, 0.3]},
			shadow: null,								// no shadow
			fill:    "#ccc",							// fill, if appropriate
			font:    "normal normal normal 8pt Tahoma",	// if there's a label
			fontColor: "#000",							// color of labels
			labelWiring: {width: 1, color: "#ccc"}		// connect marker and target data item(slice, column, bar...)
		},
		marker: {	// any markers on a series
			stroke:  {width: 1.5, color: "#333"},		// stroke
			outline: {width: 0.1, color: "#ccc"},		// outline
			//shadow:  {dx: 1, dy: 1, width: 2, color: [0, 0, 0, 0.3]},
			shadow: null,								// no shadow
			fill:    "#ccc",							// fill if needed
			font:    "normal normal normal 8pt Tahoma",	// label
			fontColor: "#000"
		},
		indicator: {
			lineStroke:  {width: 1.5, color: "#333"},		
			lineOutline: {width: 0.1, color: "#ccc"},		
			lineShadow: null,
			stroke:  {width: 1.5, color: "#333"},		
			outline: {width: 0.1, color: "#ccc"},		
			shadow: null,								
			fill : "#ccc",
			radius: 3,
			font:    "normal normal normal 10pt Tahoma",	
			fontColor: "#000",							
			markerFill:    "#ccc",							
			markerSymbol:  "m-3,0 c0,-4 6,-4 6,0 m-6,0 c0,4 6,4 6,0",			
			markerStroke:  {width: 1.5, color: "#333"},		
			markerOutline: {width: 0.1, color: "#ccc"},		
			markerShadow: null								
		}
	},

	defineColors: function(kwArgs){
		//	summary:
		//		Generate a set of colors for the theme based on keyword
		//		arguments.
		//	kwArgs: dojox.charting.Theme.__DefineColorArgs
		//		The arguments object used to define colors.
		//	returns: dojo.Color[]
		//		An array of colors for use in a theme.
		//
		//	example:
		//	|	var colors = dojox.charting.Theme.defineColors({
		//	|		base: "#369",
		//	|		generator: "compound"
		//	|	});
		//
		//	example:
		//	|	var colors = dojox.charting.Theme.defineColors({
		//	|		hue: 60,
		//	|		saturation: 90,
		//	|		low: 30,
		//	|		high: 80
		//	|	});
		kwArgs = kwArgs || {};
		var l, c = [], n = kwArgs.num || 5;	// the number of colors to generate
		if(kwArgs.colors){
			// we have an array of colors predefined, so fix for the number of series.
			l = kwArgs.colors.length;
			for(var i = 0; i < n; i++){
				c.push(kwArgs.colors[i % l]);
			}
			return c;	//	dojo.Color[]
		}
		if(kwArgs.hue){
			// single hue, generate a set based on brightness
			var s = kwArgs.saturation || 100,	// saturation
				st = kwArgs.low || 30,
				end = kwArgs.high || 90;
			// we'd like it to be a little on the darker side.
			l = (end + st) / 2;
			// alternately, use "shades"
			return colorX.Palette.generate(
				colorX.fromHsv(kwArgs.hue, s, l), "monochromatic"
			).colors;
		}
		if(kwArgs.generator){
			//	pass a base color and the name of a generator
			return colorX.Palette.generate(kwArgs.base, kwArgs.generator).colors;
		}
		return c;	//	dojo.Color[]
	},
	
	generateGradient: function(fillPattern, colorFrom, colorTo){
		var fill = lang.delegate(fillPattern);
		fill.colors = [
			{offset: 0, color: colorFrom},
			{offset: 1, color: colorTo}
		];
		return fill;
	},
	
	generateHslColor: function(color, luminance){
		color = new Color(color);
		var hsl    = color.toHsl(),
			result = colorX.fromHsl(hsl.h, hsl.s, luminance);
		result.a = color.a;	// add missing opacity
		return result;
	},

	generateHslGradient: function(color, fillPattern, lumFrom, lumTo){
		color = new Color(color);
		var hsl       = color.toHsl(),
			colorFrom = colorX.fromHsl(hsl.h, hsl.s, lumFrom),
			colorTo   = colorX.fromHsl(hsl.h, hsl.s, lumTo);
		colorFrom.a = colorTo.a = color.a;	// add missing opacity
		return Theme.generateGradient(fillPattern, colorFrom, colorTo);	// Object
	}
});

return Theme;
});

},
'dojox/charting/axis2d/Invisible':function(){
define("dojox/charting/axis2d/Invisible", ["dojo/_base/lang", "dojo/_base/declare", "./Base", "../scaler/linear", 
	"dojox/gfx", "dojox/lang/utils", "dojox/lang/functional", "dojo/string"],
	function(lang, declare, Base, lin, g, du, df, dstring){
/*=====
var Base = dojox.charting.axis2d.Base;
=====*/ 
	var merge = du.merge,
		labelGap = 4,			// in pixels
		centerAnchorLimit = 45;	// in degrees

	return declare("dojox.charting.axis2d.Invisible", Base, {
		//	summary:
		//		The default axis object used in dojox.charting.  See dojox.charting.Chart.addAxis for details.
		//
		//	defaultParams: Object
		//		The default parameters used to define any axis.
		//	optionalParams: Object
		//		Any optional parameters needed to define an axis.

		/*
		//	TODO: the documentation tools need these to be pre-defined in order to pick them up
		//	correctly, but the code here is partially predicated on whether or not the properties
		//	actually exist.  For now, we will leave these undocumented but in the code for later. -- TRT

		//	opt: Object
		//		The actual options used to define this axis, created at initialization.
		//	scalar: Object
		//		The calculated helper object to tell charts how to draw an axis and any data.
		//	ticks: Object
		//		The calculated tick object that helps a chart draw the scaling on an axis.
		//	dirty: Boolean
		//		The state of the axis (whether it needs to be redrawn or not)
		//	scale: Number
		//		The current scale of the axis.
		//	offset: Number
		//		The current offset of the axis.

		opt: null,
		scalar: null,
		ticks: null,
		dirty: true,
		scale: 1,
		offset: 0,
		*/
		defaultParams: {
			vertical:    false,		// true for vertical axis
			fixUpper:    "none",	// align the upper on ticks: "major", "minor", "micro", "none"
			fixLower:    "none",	// align the lower on ticks: "major", "minor", "micro", "none"
			natural:     false,		// all tick marks should be made on natural numbers
			leftBottom:  true,		// position of the axis, used with "vertical"
			includeZero: false,		// 0 should be included
			fixed:       true,		// all labels are fixed numbers
			majorLabels: true,		// draw major labels
			minorTicks:  true,		// draw minor ticks
			minorLabels: true,		// draw minor labels
			microTicks:  false,		// draw micro ticks
			rotation:    0			// label rotation angle in degrees
		},
		optionalParams: {
			min:			0,	// minimal value on this axis
			max:			1,	// maximal value on this axis
			from:			0,	// visible from this value
			to:				1,	// visible to this value
			majorTickStep:	4,	// major tick step
			minorTickStep:	2,	// minor tick step
			microTickStep:	1,	// micro tick step
			labels:			[],	// array of labels for major ticks
								// with corresponding numeric values
								// ordered by values
			labelFunc:		null, // function to compute label values
			maxLabelSize:	0,	// size in px. For use with labelFunc
			maxLabelCharCount:	0,	// size in word count.
			trailingSymbol:			null

			// TODO: add support for minRange!
			// minRange:		1,	// smallest distance from min allowed on the axis
		},

		constructor: function(chart, kwArgs){
			//	summary:
			//		The constructor for an axis.
			//	chart: dojox.charting.Chart
			//		The chart the axis belongs to.
			//	kwArgs: dojox.charting.axis2d.__AxisCtorArgs?
			//		Any optional keyword arguments to be used to define this axis.
			this.opt = lang.clone(this.defaultParams);
            du.updateWithObject(this.opt, kwArgs);
			du.updateWithPattern(this.opt, kwArgs, this.optionalParams);
		},
		dependOnData: function(){
			//	summary:
			//		Find out whether or not the axis options depend on the data in the axis.
			return !("min" in this.opt) || !("max" in this.opt);	//	Boolean
		},
		clear: function(){
			//	summary:
			//		Clear out all calculated properties on this axis;
			//	returns: dojox.charting.axis2d.Default
			//		The reference to the axis for functional chaining.
			delete this.scaler;
			delete this.ticks;
			this.dirty = true;
			return this;	//	dojox.charting.axis2d.Default
		},
		initialized: function(){
			//	summary:
			//		Finds out if this axis has been initialized or not.
			//	returns: Boolean
			//		Whether a scaler has been calculated and if the axis is not dirty.
			return "scaler" in this && !(this.dirty && this.dependOnData());
		},
		setWindow: function(scale, offset){
			//	summary:
			//		Set the drawing "window" for the axis.
			//	scale: Number
			//		The new scale for the axis.
			//	offset: Number
			//		The new offset for the axis.
			//	returns: dojox.charting.axis2d.Default
			//		The reference to the axis for functional chaining.
			this.scale  = scale;
			this.offset = offset;
			return this.clear();	//	dojox.charting.axis2d.Default
		},
		getWindowScale: function(){
			//	summary:
			//		Get the current windowing scale of the axis.
			return "scale" in this ? this.scale : 1;	//	Number
		},
		getWindowOffset: function(){
			//	summary:
			//		Get the current windowing offset for the axis.
			return "offset" in this ? this.offset : 0;	//	Number
		},
		_groupLabelWidth: function(labels, font, wcLimit){
			if(!labels.length){
				return 0;
			}
			if(lang.isObject(labels[0])){
				labels = df.map(labels, function(label){ return label.text; });
			}
			if (wcLimit) {
				labels = df.map(labels, function(label){
					return lang.trim(label).length == 0 ? "" : label.substring(0, wcLimit) + this.trailingSymbol;
				}, this);
			}
			var s = labels.join("<br>");
			return g._base._getTextBox(s, {font: font}).w || 0;
		},
		calculate: function(min, max, span, labels){
			//	summary:
			//		Perform all calculations needed to render this axis.
			//	min: Number
			//		The smallest value represented on this axis.
			//	max: Number
			//		The largest value represented on this axis.
			//	span: Number
			//		The span in pixels over which axis calculations are made.
			//	labels: String[]
			//		Optional list of labels.
			//	returns: dojox.charting.axis2d.Default
			//		The reference to the axis for functional chaining.
			if(this.initialized()){
				return this;
			}
			var o = this.opt;
			this.labels = "labels" in o  ? o.labels : labels;
			this.scaler = lin.buildScaler(min, max, span, o);
			var tsb = this.scaler.bounds;
			if("scale" in this){
				// calculate new range
				o.from = tsb.lower + this.offset;
				o.to   = (tsb.upper - tsb.lower) / this.scale + o.from;
				// make sure that bounds are correct
				if( !isFinite(o.from) ||
					isNaN(o.from) ||
					!isFinite(o.to) ||
					isNaN(o.to) ||
					o.to - o.from >= tsb.upper - tsb.lower
				){
					// any error --- remove from/to bounds
					delete o.from;
					delete o.to;
					delete this.scale;
					delete this.offset;
				}else{
					// shift the window, if we are out of bounds
					if(o.from < tsb.lower){
						o.to += tsb.lower - o.from;
						o.from = tsb.lower;
					}else if(o.to > tsb.upper){
						o.from += tsb.upper - o.to;
						o.to = tsb.upper;
					}
					// update the offset
					this.offset = o.from - tsb.lower;
				}
				// re-calculate the scaler
				this.scaler = lin.buildScaler(min, max, span, o);
				tsb = this.scaler.bounds;
				// cleanup
				if(this.scale == 1 && this.offset == 0){
					delete this.scale;
					delete this.offset;
				}
			}

			var ta = this.chart.theme.axis, labelWidth = 0, rotation = o.rotation % 360,
				// TODO: we use one font --- of major tick, we need to use major and minor fonts
				taFont = o.font || (ta.majorTick && ta.majorTick.font) || (ta.tick && ta.tick.font),
				size = taFont ? g.normalizedLength(g.splitFontString(taFont).size) : 0,
				cosr = Math.abs(Math.cos(rotation * Math.PI / 180)),
				sinr = Math.abs(Math.sin(rotation * Math.PI / 180));

			if(rotation < 0){
				rotation += 360;
			}

			if(size){
				if(this.vertical ? rotation != 0 && rotation != 180 : rotation != 90 && rotation != 270){
					// we need width of all labels
					if(this.labels){
						labelWidth = this._groupLabelWidth(this.labels, taFont, o.maxLabelCharCount);
					}else{
						var labelLength = Math.ceil(
								Math.log(
									Math.max(
										Math.abs(tsb.from),
										Math.abs(tsb.to)
									)
								) / Math.LN10
							),
							t = [];
						if(tsb.from < 0 || tsb.to < 0){
							t.push("-");
						}
						t.push(dstring.rep("9", labelLength));
						var precision = Math.floor(
							Math.log( tsb.to - tsb.from ) / Math.LN10
						);
						if(precision > 0){
							t.push(".");
							t.push(dstring.rep("9", precision));
						}
						labelWidth = g._base._getTextBox(
							t.join(""),
							{ font: taFont }
						).w;
					}
					labelWidth = o.maxLabelSize ? Math.min(o.maxLabelSize, labelWidth) : labelWidth;
				}else{
					labelWidth = size;
				}
				switch(rotation){
					case 0:
					case 90:
					case 180:
					case 270:
						// trivial cases: use labelWidth
						break;
					default:
						// rotated labels
						var gap1 = Math.sqrt(labelWidth * labelWidth + size * size),									// short labels
							gap2 = this.vertical ? size * cosr + labelWidth * sinr : labelWidth * cosr + size * sinr;	// slanted labels
						labelWidth = Math.min(gap1, gap2);
						break;
				}
			}

			this.scaler.minMinorStep = labelWidth + labelGap;
			this.ticks = lin.buildTicks(this.scaler, o);
			return this;	//	dojox.charting.axis2d.Default
		},
		getScaler: function(){
			//	summary:
			//		Get the pre-calculated scaler object.
			return this.scaler;	//	Object
		},
		getTicks: function(){
			//	summary:
			//		Get the pre-calculated ticks object.
			return this.ticks;	//	Object
		}
	});
});

},
'esri/layers/MapImageLayer':function(){
// wrapped by build app
define(["dijit","dojo","dojox","dojo/require!esri/utils,esri/layers/layer,esri/geometry"], function(dijit,dojo,dojox){
dojo.provide("esri.layers.MapImageLayer");

dojo.require("esri.utils");
dojo.require("esri.layers.layer");
dojo.require("esri.geometry");

// TODO
// Fire update events?
//
// How can I create map images from exportMap that behaves like a ground overlay? Looks like
//  I overlooked the part where the server may adjust the extent - this extent should
//  be used when adding the map image to this layer

dojo.declare("esri.layers.MapImageLayer", [ esri.layers.Layer ], {
    "-chains-": {
      // Incompatible constructor arguments with "Layer". So let's cut-off
      // the inheritance chain. Note also that sub-classes have
      // to explicitly call the ctor of this class like this:
      // this.inherited(arguments);
      constructor: "manual"
    },

    constructor: function(options) {
      // Handle options
      this.inherited(arguments, [null, options]);
      
      // TODO
      // Use a simple dictionary instead?
      this._mapImages = [];
      
      var hitch = dojo.hitch;
      this._panStart = hitch(this, this._panStart);
      this._pan = hitch(this, this._pan);
      this._extentChange = hitch(this, this._extentChange);
      this._zoom = hitch(this, this._zoom);
      this._zoomStart = hitch(this, this._zoomStart);
      this._scale = hitch(this, this._scale);
      this._resize = hitch(this, this._resize);
      
      this.loaded = true;
      this.onLoad(this);
    },

    opacity: 1,
    
    // MozTransform/WebkitTransform/msTransform/OTransform
    // See esri/utils.js
    _transform: esri._getDOMAccessor("transform"),
    
    /*****************
     * Public Methods
     *****************/
    
    addImage: function(mapImage) {
      //console.log("add");
      
      // TODO
      // What if this mapImage is already added to this layer
      // or some other layer?
      
      var newLen = this._mapImages.push(mapImage);
      newLen = newLen - 1;

      mapImage._idx = newLen;
      mapImage._layer = this;
      
      if (this._div) {
        this._createImage(mapImage, newLen);
      }
    },
    
    removeImage: function(mapImage) {
      //console.log("remove");
      
      if (mapImage) {
        var idx = mapImage._idx, mapImages = this._mapImages;
            
        if (mapImages[idx] === mapImage) {
          delete mapImages[idx];
          
          var node = mapImage._node;
          if (node) {
            this._clearEvents(node);
            
            node.e_idx = node.e_bl = node.e_tr = 
            node.e_l = node.e_t = node.e_w = node.e_h = null;
            
            // https://developer.mozilla.org/En/DOM/Node.parentNode
            // http://reference.sitepoint.com/javascript/Node/parentNode
            // http://www.quirksmode.org/dom/w3c_core.html
            if (node.parentNode) {
              node.parentNode.removeChild(node);
              dojo.destroy(node);
            }
          }
          
          mapImage._node = mapImage._idx = mapImage._layer = null;
        }
      }
    },
    
    removeAllImages: function() {
      var mapImages = this._mapImages, i, len = mapImages.length;
      
      for (i = 0; i < len; i++) {
        var mapImage = mapImages[i];
        
        if (mapImage) {
          this.removeImage(mapImage);
        }
      }
      
      this._mapImages = [];
    },
    
    getImages: function() {
      var mapImages = this._mapImages, retVal = [], 
          i, len = mapImages.length;
      
      for (i = 0; i < len; i++) {
        if (mapImages[i]) {
          retVal.push(mapImages[i]);
        }
      }
      
      return retVal;
    },
    
    setOpacity: function(opacity) {
      if (this.opacity != opacity) {
        this.onOpacityChange(this.opacity = opacity);
      }
    },
    
    /*********
     * Events
     *********/
    
    onOpacityChange: function(value) {
      var div = this._div, i, len, nodes;
      
      if (div) {
        if (!dojo.isIE || dojo.isIE > 8) {
          dojo.style(div, "opacity", value);
        }
        else {
          nodes = div.childNodes;
          len = nodes.length;
          
          for (i = 0; i < len; i++) {
            dojo.style(nodes[i], "opacity", value);
          }
        }
      }
    },
    
    /*******************
     * Internal Methods
     *******************/
    
    _createImage: function(mapImage, idx) {
      var node = dojo.create("img");
      
      dojo.style(node, { position: "absolute" });

      if (dojo.isIE <= 8) {
        dojo.style(node, "opacity", this.opacity);
      }
      
      if (mapImage.rotation) {
        var transformFunc = "rotate(" + (360 - mapImage.rotation) + "deg)";
        
        if (dojo.isIE < 9) {
          // TODO
          // Options:
          // 1. Do not show this image if impl is not possible
          // 2. Use IE filters for implementation. See documents lilsted
          //    below for help.
          // References:
          // https://developer.mozilla.org/En/CSS/-moz-transform
          // http://msdn.microsoft.com/en-us/library/ms532847%28v=vs.85%29.aspx
          // http://msdn.microsoft.com/en-us/library/bb554293%28v=vs.85%29.aspx
          // http://msdn.microsoft.com/en-us/library/ms532972%28v=vs.85%29.aspx
          // http://msdn.microsoft.com/en-us/library/ms537452%28v=VS.85%29.aspx
          // http://msdn.microsoft.com/en-us/library/ms533014%28VS.85,loband%29.aspx
          // http://blog.siteroller.net/cross-browser-css-rotation
          // http://www.useragentman.com/blog/2010/03/09/cross-browser-css-transforms-even-in-ie/
          // http://robertnyman.com/css3/css-transitions/css-transitions-mac-os-x-stacks.html
          // http://www.useragentman.com/IETransformsTranslator/
          // https://github.com/heygrady/transform/wiki/correcting-transform-origin-and-translate-in-ie
          // Examples:
          // http://www.useragentman.com/tests/cssSandpaper/rotateTest.html
          // http://samples.msdn.microsoft.com/workshop/samples/author/dhtml/filters/matrix.htm
          // http://samples.msdn.microsoft.com/workshop/samples/author/dhtml/filters/matrix.htm
          // http://siteroller.net/archive/blog/rotate.htm
          // http://samples.msdn.microsoft.com/workshop/samples/author/filter/BasicImage.htm
          // ... ...
          // ... and oh yes, don't forget to check if the stars are aligned.
          // Good Luck!
        }
        else {
          dojo.style(node, this._transform, transformFunc);
          dojo.style(node, "transform", transformFunc);
        }
      }

      mapImage._node = node;
      
      node.e_idx = idx;
      node.e_layer = this;
      node.e_load = dojo.connect(node, "onload", esri.layers.MapImageLayer.prototype._imageLoaded);
      node.e_error = dojo.connect(node, "onerror", esri.layers.MapImageLayer.prototype._imageError);
      node.e_abort = dojo.connect(node, "onabort", esri.layers.MapImageLayer.prototype._imageError);
      
      node.src = mapImage.href;
    },
    
    _imageLoaded: function(evt, img) {
      // TODO
      // May have to call dojo.fixEvent to normalize properties
      //console.log("_imageLoaded: ", evt, evt.target || evt.currentTarget);
      var node = img || evt.target || evt.currentTarget, self = node.e_layer,
          mapImage = self._mapImages[node.e_idx];

      if (self._map && (self._map.__zooming || self._map.__panning)) {
        // Ideally we'd just want to push the "evt" object, but in Chrome
        // event object doesn't seem to have null target when this method is 
        // called later.
        self._standby.push(node);
        return;
      }

      self._clearEvents(node);
      
      if (!mapImage || mapImage._node !== node) {
        // Unknown image node 
        return;
      }
      
      // "map" may not be available at this point because this layer has not
      // been added to the map yet. So check.
      if (self._map) {
        self._attach(mapImage);
      }
    },
    
    _imageError: function(evt) {
      //console.log("_imageError: ", evt, evt.target || evt.currentTarget);
      
      var node = evt.target || evt.currentTarget, self = node.e_layer,
          mapImage = self._mapImages[node.e_idx];

      self._clearEvents(node);
      
      if (mapImage) {
        mapImage._node = null;
      }
    },
    
    _clearEvents: function(node) {
      var disconnect = dojo.disconnect;
      disconnect(node.e_load);
      disconnect(node.e_error);
      disconnect(node.e_abort);
      
      // "delete" operator on DOM nodes not allowed in IE (7,8?)
      node.e_load = node.e_error = node.e_abort = node.e_layer = null;
    },
    
    _attach: function(mapImage) {
      // This method should be called once for each mapImage
      
      var extent = mapImage.extent, match,
          envSR = extent.spatialReference, mapSR = this._sr,
          div = this._div,
          node = mapImage._node,
          bottomLeft = new esri.geometry.Point({ x: extent.xmin, y: extent.ymin }),
          topRight = new esri.geometry.Point({ x: extent.xmax, y: extent.ymax });
    
      // TODO
      // We don't need this logic if we say that the users have to 
      // provide the extent in the spatial reference of the map
      // Check if mapSR and envSR match
      if (mapSR.wkid) {
        match = (mapSR._isWebMercator() && envSR._isWebMercator()) || (mapSR.wkid === envSR.wkid);
      }
      else if (mapSR.wkt) {
        match = (mapSR.wkt === envSR.wkt);
      }
  
      // if they don't match, convert them on the client if possible
      if (!match) {
        if (mapSR._isWebMercator() && envSR.wkid === 4326) {
          bottomLeft = esri.geometry.geographicToWebMercator(bottomLeft);
          topRight = esri.geometry.geographicToWebMercator(topRight);
        }
        else if (envSR._isWebMercator() && mapSR.wkid === 4326) {
          bottomLeft = esri.geometry.webMercatorToGeographic(bottomLeft);
          topRight = esri.geometry.webMercatorToGeographic(topRight);
        }
      }

      node.e_bl = bottomLeft;
      node.e_tr = topRight;
      
      if (mapImage.visible) {
        //this._setPos(node, dojo.style(div, "left"), dojo.style(div, "top"));
        this._setPos(node, div._left, div._top);
        (this._active || div).appendChild(node);
      }
    },
    
    _setPos: function(node, divLeft, divTop) {
      var bottomLeft = node.e_bl,
          topRight = node.e_tr,
          map = this._map;
    
      //console.log(dojo.toJson(bottomLeft.toJson()));
      //console.log(dojo.toJson(topRight.toJson()));
    
      bottomLeft = map.toScreen(bottomLeft);
      topRight = map.toScreen(topRight);
      
      var left = bottomLeft.x - divLeft,
          top = topRight.y - divTop,
          width = Math.abs(topRight.x - bottomLeft.x),
          height = Math.abs(bottomLeft.y - topRight.y),
          css = {
            width: width + "px",
            height: height + "px"
          },
          mapImage = this._mapImages[node.e_idx];
      
      if (map.navigationMode === "css-transforms") {
        css[esri._css.names.transform] = esri._css.translate(left, top) + 
                                         (mapImage.rotation ? (" " + esri._css.rotate(360 - mapImage.rotation)) : "");
      }
      else {
        css.left = left + "px";
        css.top = top + "px";
      }

      dojo.style(node, css);
      
      node.e_l = left;
      node.e_t = top;
      node.e_w = width;
      node.e_h = height;
    },
    
    /************
     * Layer API
     ************/

    _setMap: function(map, container) {
      //console.log("_setMap");
      this._map = map;
      this._sr = map.spatialReference;
      
      // TODO
      // IE doesn't honor "style" as a property of the second arg to dojo.create
      // 7,8?

      var div = this._div = dojo.create("div", null, container),
          names = esri._css.names,
          css = { position: "absolute" },
          vd = map.__visibleDelta;
      
      if (!dojo.isIE || dojo.isIE > 8) {
        css.opacity = this.opacity;
      }
      
      if (map.navigationMode === "css-transforms") {
        // Without visibleDelta, scaling anchor is correct only when
        // this layer is added before any map pan has occured.
        css[names.transform] = esri._css.translate(vd.x, vd.y);
        dojo.style(div, css);
        div._left = vd.x;
        div._top = vd.y;
        
        // These divs will let us perform scale animation
        css = {
          position: "absolute", 
          width: map.width + "px", 
          height: map.height + "px", 
          overflow: "visible" 
        };
        this._active = dojo.create("div", null, div);
        dojo.style(this._active, css);

        this._passive = dojo.create("div", null, div);
        dojo.style(this._passive, css);
      }
      else {
        div._left = 0;
        div._top = 0;
        dojo.style(div, css);
      }

      // "_left" and "_top" will hold the current positioning
      // of this layer. They are used regardless of the map's
      // navigation mode
      this._standby = [];
      
      // What if the layer already has some map images when this method
      // is called by the map? Let's draw them now.
      var mapImages = this._mapImages, i, len = mapImages.length;
      for (i = 0; i < len; i++) {
        var mapImage = mapImages[i], node = mapImage._node;
        
        if (!node) {
          this._createImage(mapImage, mapImage._idx);
        }
        
        /*if (mapImage && node && !node.e_load) { // only a successfully loaded mapimage will "have node" and "no e_load"
          this._attach(mapImage);
        }*/
      }
      
      this.onVisibilityChange(this.visible); 
      
      return div;
    },

    _unsetMap: function(map, container) {
      //console.log("_unsetMap");
      this._disconnect();
      
      var div = this._div;
      if (div) {
        // Detach map images (if any) from their nodes
        var mapImages = this._mapImages, i, len = mapImages.length;
        for (i = 0; i < len; i++) {
          var mapImage = mapImages[i];
          if (mapImage) {
            var node = mapImage._node;
            if (node) {
              this._clearEvents(node);
              
              node.e_idx = node.e_bl = node.e_tr = 
              node.e_l = node.e_t = node.e_w = node.e_h = null;
            }
            
            mapImage._node = null;
          }
        }

        // Destroy DOM structure
        container.removeChild(div);
        dojo.destroy(div);
      }
      
      this._map = this._div = this._sr = this._active = this._passive = this._standby = null;
    },
  
    onVisibilityChange: function(isVisible) {
      var div = this._div;
      
      if (div) {
        if (isVisible) {
          this._redraw();
          this._connect(this._map);
          esri.show(div);
        }
        else {
          this._disconnect();
          esri.hide(div);
        }
      }
    },
    
    /*****************
     * Event Handlers
     *****************/
    
    _connect: function(map) {
      if (!this._connections) {
        var connect = dojo.connect,
            hasTransforms = (map.navigationMode === "css-transforms");
        
        this._connections = [
          connect(map, "onPanStart", this._panStart),
          connect(map, "onPan", this._pan),
          connect(map, "onExtentChange", this._extentChange),
          
          hasTransforms && connect(map, "onZoomStart", this._zoomStart),
          hasTransforms ? 
            connect(map, "onScale", this._scale) : 
            connect(map, "onZoom", this._zoom),
          hasTransforms && connect(map, "onResize", this._resize)
        ];
      }
    },
    
    _disconnect: function() {
      if (this._connections) {
        dojo.forEach(this._connections, dojo.disconnect);
        this._connections = null;
      }
    },
    
    _panStart: function() {
      this._panL = this._div._left; // dojo.style(this._div, "left");
      this._panT = this._div._top; // dojo.style(this._div, "top");
      //console.log("pan start: ", this._panL, this._panT);
    },
    
    _pan: function(extent, delta) {
      //console.log("_pan: ", dojo.toJson(delta.toJson()));
      
      var div = this._div;
      div._left = this._panL + delta.x;
      div._top = this._panT + delta.y;
      
      if (this._map.navigationMode === "css-transforms") {
        dojo.style(div, esri._css.names.transform, esri._css.translate(div._left, div._top));
      }
      else {
        dojo.style(div, {
          left: div._left + "px",
          top: div._top + "px"
        });
      }
    },
    
    _extentChange: function(extent, delta, levelChange) {
      if (levelChange) {
        this._redraw(this._map.navigationMode === "css-transforms");
      }
      else {
        if (delta) {
          /*dojo.style(this._div, {
            left: this._panL + delta.x + "px",
            top: this._panT + delta.y + "px"
          });*/
          this._pan(extent, delta);
        }
      }
    
      // Let's process pending images waiting to handle their
      // "load" event.
      var i, standby = this._standby;
      if (standby && standby.length) {
        for (i = standby.length - 1; i >= 0; i--) {
          this._imageLoaded(null, standby[i]);
          standby.splice(i, 1);
        }
      }
    },
    
    _redraw: function(reclaim) {
      if (reclaim) {
        var passive = this._passive, names = esri._css.names;
        dojo.style(passive, names.transition, "none");
        this._moveImages(passive, this._active);
        dojo.style(passive, names.transform, "none");
      }
      
      var div = this._active || this._div,
          divLeft = this._div._left, // dojo.style(div, "left"),
          divTop = this._div._top, //dojo.style(div, "top"),
          i, len = div.childNodes.length, node;
      
      for (i = 0; i < len; i++) {
        node = div.childNodes[i];
        //console.log(node.e_idx);
        this._setPos(node, divLeft, divTop);
      }
    },
    
    _zoom: function(extent, factor, anchor) {
      //console.log("zoom: ", factor);
      
      // These values represent how much panning has happened
      // until now
      var div = this._div,
          divLeft = div._left, // dojo.style(div, "left"),
          divTop = div._top, //dojo.style(div, "top"),
          i, len = div.childNodes.length, node;

      for (i = 0; i < len; i++) {
        node = div.childNodes[i];
        
        var newWidth = node.e_w * factor,
            newHeight = node.e_h * factor,
            diffLeft = (anchor.x - divLeft - node.e_l) * (newWidth - node.e_w) / node.e_w,
            diffTop = (anchor.y - divTop - node.e_t) * (newHeight - node.e_h) / node.e_h;

        // IE throws "Invalild argument" error at dojo.style for NaN values
        // Fix it here
        diffLeft = isNaN(diffLeft) ? 0 : diffLeft;
        diffTop = isNaN(diffTop) ? 0 : diffTop;

        dojo.style(node, {
          left: (node.e_l - diffLeft) + "px",
          top: (node.e_t - diffTop) + "px",
          width: newWidth + "px",
          height: newHeight + "px"
        });
      } // loop
    },
    
    // These event handlers are executed only when map navigation mode is 
    // "css-transforms" - see _connect method above
    
    _zoomStart: function() {
      this._moveImages(this._active, this._passive);
    },
    
    _moveImages: function(source, dest) {
      // Move all images from source to destination
      var images = source.childNodes,
          i, len = images.length;
      
      if (len > 0) {
        for (i = len - 1; i >= 0; i--) {
          dest.appendChild(images[i]);
        }
      }
    },
    
    _scale: function(mtx, immediate) {
      var css = {}, names = esri._css.names,
          passive = this._passive;
      
      dojo.style(passive, names.transition, immediate ? "none" : (names.transformName + " " + esri.config.defaults.map.zoomDuration + "ms ease"));
      
      css[names.transform] = esri._css.matrix(mtx);
      //console.log("xply: " + dojo.toJson(css[names.transform]));

      // Map sends the cumulative transformation for this sequence in "mtx" 
      dojo.style(passive, names.transform, esri._css.matrix(mtx));
    },
    
    _resize: function(extent, width, height) {
      dojo.style(this._active, { width: width + "px", height: height + "px" });
      dojo.style(this._passive, { width: width + "px", height: height + "px" });
    }
  }
);


dojo.extend(esri.layers.MapImage, {
  visible: true,

  /**
   * Internal members, managed by esri.layers.MapImageLayer
   * _node
   * _idx
   * _layer
   */
  
  getLayer: function() {
    return this._layer;
  },
  
  getNode: function() {
    return this._node;
  },
  
  show: function() {
    if (!this.visible) {
      this.visible = true;

      var node = this._node, layer = this._layer, div;
      if (node) {
        div = layer && layer._div;
        
        // Re-append this node to the DOM
        if (div) {
          //layer._setPos(node, dojo.style(layer._div, "left"), dojo.style(layer._div, "top"));
          layer._setPos(node, div._left, div._top);
          (layer._active || div).appendChild(node);
        }
        
        esri.show(node);
      }
    }
  },
  
  hide: function() {
    if (this.visible) {
      this.visible = false;

      var node = this._node;
      if (node) {
        esri.hide(node);

        // To optimize navigation performance, we remove this node
        // from DOM
        if (node.parentNode) {
          node.parentNode.removeChild(node);
        }
      }
    }
  }
});

});

},
'dojox/charting/plot2d/common':function(){
define("dojox/charting/plot2d/common", ["dojo/_base/lang", "dojo/_base/array", "dojo/_base/Color", 
		"dojox/gfx", "dojox/lang/functional", "../scaler/common"], 
	function(lang, arr, Color, g, df, sc){
	
	var common = lang.getObject("dojox.charting.plot2d.common", true);
	
	return lang.mixin(common, {	
		doIfLoaded: sc.doIfLoaded,
		makeStroke: function(stroke){
			if(!stroke){ return stroke; }
			if(typeof stroke == "string" || stroke instanceof Color){
				stroke = {color: stroke};
			}
			return g.makeParameters(g.defaultStroke, stroke);
		},
		augmentColor: function(target, color){
			var t = new Color(target),
				c = new Color(color);
			c.a = t.a;
			return c;
		},
		augmentStroke: function(stroke, color){
			var s = common.makeStroke(stroke);
			if(s){
				s.color = common.augmentColor(s.color, color);
			}
			return s;
		},
		augmentFill: function(fill, color){
			var fc, c = new Color(color);
			if(typeof fill == "string" || fill instanceof Color){
				return common.augmentColor(fill, color);
			}
			return fill;
		},

		defaultStats: {
			vmin: Number.POSITIVE_INFINITY, vmax: Number.NEGATIVE_INFINITY,
			hmin: Number.POSITIVE_INFINITY, hmax: Number.NEGATIVE_INFINITY
		},

		collectSimpleStats: function(series){
			var stats = lang.delegate(common.defaultStats);
			for(var i = 0; i < series.length; ++i){
				var run = series[i];
				for(var j = 0; j < run.data.length; j++){
					if(run.data[j] !== null){
						if(typeof run.data[j] == "number"){
							// 1D case
							var old_vmin = stats.vmin, old_vmax = stats.vmax;
							if(!("ymin" in run) || !("ymax" in run)){
								arr.forEach(run.data, function(val, i){
									if(val !== null){
										var x = i + 1, y = val;
										if(isNaN(y)){ y = 0; }
										stats.hmin = Math.min(stats.hmin, x);
										stats.hmax = Math.max(stats.hmax, x);
										stats.vmin = Math.min(stats.vmin, y);
										stats.vmax = Math.max(stats.vmax, y);
									}
								});
							}
							if("ymin" in run){ stats.vmin = Math.min(old_vmin, run.ymin); }
							if("ymax" in run){ stats.vmax = Math.max(old_vmax, run.ymax); }
						}else{
							// 2D case
							var old_hmin = stats.hmin, old_hmax = stats.hmax,
								old_vmin = stats.vmin, old_vmax = stats.vmax;
							if(!("xmin" in run) || !("xmax" in run) || !("ymin" in run) || !("ymax" in run)){
								arr.forEach(run.data, function(val, i){
									if(val !== null){
										var x = "x" in val ? val.x : i + 1, y = val.y;
										if(isNaN(x)){ x = 0; }
										if(isNaN(y)){ y = 0; }
										stats.hmin = Math.min(stats.hmin, x);
										stats.hmax = Math.max(stats.hmax, x);
										stats.vmin = Math.min(stats.vmin, y);
										stats.vmax = Math.max(stats.vmax, y);
									}
								});
							}
							if("xmin" in run){ stats.hmin = Math.min(old_hmin, run.xmin); }
							if("xmax" in run){ stats.hmax = Math.max(old_hmax, run.xmax); }
							if("ymin" in run){ stats.vmin = Math.min(old_vmin, run.ymin); }
							if("ymax" in run){ stats.vmax = Math.max(old_vmax, run.ymax); }
						}

						break;
					}
				}
			}
			return stats;
		},

		calculateBarSize: function(/* Number */ availableSize, /* Object */ opt, /* Number? */ clusterSize){
			if(!clusterSize){
				clusterSize = 1;
			}
			var gap = opt.gap, size = (availableSize - 2 * gap) / clusterSize;
			if("minBarSize" in opt){
				size = Math.max(size, opt.minBarSize);
			}
			if("maxBarSize" in opt){
				size = Math.min(size, opt.maxBarSize);
			}
			size = Math.max(size, 1);
			gap = (availableSize - size * clusterSize) / 2;
			return {size: size, gap: gap};	// Object
		},

		collectStackedStats: function(series){
			// collect statistics
			var stats = lang.clone(common.defaultStats);
			if(series.length){
				// 1st pass: find the maximal length of runs
				stats.hmin = Math.min(stats.hmin, 1);
				stats.hmax = df.foldl(series, "seed, run -> Math.max(seed, run.data.length)", stats.hmax);
				// 2nd pass: stack values
				for(var i = 0; i < stats.hmax; ++i){
					var v = series[0].data[i];
                    v = v && (typeof v == "number" ? v : v.y);
					if(isNaN(v)){ v = 0; }
					stats.vmin = Math.min(stats.vmin, v);
					for(var j = 1; j < series.length; ++j){
						var t = series[j].data[i];
                        t = t && (typeof t == "number" ? t : t.y);
						if(isNaN(t)){ t = 0; }
						v += t;
					}
					stats.vmax = Math.max(stats.vmax, v);
				}
			}
			return stats;
		},

		curve: function(/* Number[] */a, /* Number|String */tension){
			//	FIX for #7235, submitted by Enzo Michelangeli.
			//	Emulates the smoothing algorithms used in a famous, unnamed spreadsheet
			//		program ;)
			var array = a.slice(0);
			if(tension == "x") {
				array[array.length] = arr[0];   // add a last element equal to the first, closing the loop
			}
			var p=arr.map(array, function(item, i){
				if(i==0){ return "M" + item.x + "," + item.y; }
				if(!isNaN(tension)) { // use standard Dojo smoothing in tension is numeric
					var dx=item.x-array[i-1].x, dy=array[i-1].y;
					return "C"+(item.x-(tension-1)*(dx/tension))+","+dy+" "+(item.x-(dx/tension))+","+item.y+" "+item.x+","+item.y;
				} else if(tension == "X" || tension == "x" || tension == "S") {
					// use Excel "line smoothing" algorithm (http://xlrotor.com/resources/files.shtml)
					var p0, p1 = array[i-1], p2 = array[i], p3;
					var bz1x, bz1y, bz2x, bz2y;
					var f = 1/6;
					if(i==1) {
						if(tension == "x") {
							p0 = array[array.length-2];
						} else { // "tension == X || tension == "S"
							p0 = p1;
						}
						f = 1/3;
					} else {
						p0 = array[i-2];
					}
					if(i==(array.length-1)) {
						if(tension == "x") {
							p3 = array[1];
						} else { // "tension == X || tension == "S"
							p3 = p2;
						}
						f = 1/3;
					} else {
						p3 = array[i+1];
					}
					var p1p2 = Math.sqrt((p2.x-p1.x)*(p2.x-p1.x)+(p2.y-p1.y)*(p2.y-p1.y));
					var p0p2 = Math.sqrt((p2.x-p0.x)*(p2.x-p0.x)+(p2.y-p0.y)*(p2.y-p0.y));
					var p1p3 = Math.sqrt((p3.x-p1.x)*(p3.x-p1.x)+(p3.y-p1.y)*(p3.y-p1.y));

					var p0p2f = p0p2 * f;
					var p1p3f = p1p3 * f;

					if(p0p2f > p1p2/2 && p1p3f > p1p2/2) {
						p0p2f = p1p2/2;
						p1p3f = p1p2/2;
					} else if(p0p2f > p1p2/2) {
						p0p2f = p1p2/2;
						p1p3f = p1p2/2 * p1p3/p0p2;
					} else if(p1p3f > p1p2/2) {
						p1p3f = p1p2/2;
						p0p2f = p1p2/2 * p0p2/p1p3;
					}

					if(tension == "S") {
						if(p0 == p1) { p0p2f = 0; }
						if(p2 == p3) { p1p3f = 0; }
					}

					bz1x = p1.x + p0p2f*(p2.x - p0.x)/p0p2;
					bz1y = p1.y + p0p2f*(p2.y - p0.y)/p0p2;
					bz2x = p2.x - p1p3f*(p3.x - p1.x)/p1p3;
					bz2y = p2.y - p1p3f*(p3.y - p1.y)/p1p3;
				}
				return "C"+(bz1x+","+bz1y+" "+bz2x+","+bz2y+" "+p2.x+","+p2.y);
			});
			return p.join(" ");
		},
		
		getLabel: function(/*Number*/number, /*Boolean*/fixed, /*Number*/precision){
			return sc.doIfLoaded("dojo/number", function(numberLib){
				return (fixed ? numberLib.format(number, {places : precision}) :
					numberLib.format(number)) || "";
			}, function(){
				return fixed ? number.toFixed(precision) : number.toString();
			});
		}
	});
});

},
'dojox/gfx/shape':function(){
define("dojox/gfx/shape", ["./_base", "dojo/_base/lang", "dojo/_base/declare", "dojo/_base/window", "dojo/_base/sniff",
	"dojo/_base/connect", "dojo/_base/array", "dojo/dom-construct", "dojo/_base/Color", "./matrix"], 
  function(g, lang, declare, win, has, events, arr, domConstruct, Color, matrixLib){

/*===== 
	dojox.gfx.shape = {
		// summary:
		//		This module contains the core graphics Shape API.
		//		Different graphics renderer implementation modules (svg, canvas, vml, silverlight, etc.) extend this 
		//		basic api to provide renderer-specific implementations for each shape.
	};
  =====*/

	var shape = g.shape = {};
	// a set of ids (keys=type)
	var _ids = {};
	// a simple set impl to map shape<->id
	var registry = {};
	
	shape.register = function(/*dojox.gfx.shape.Shape*/shape){
		// summary: 
		//		Register the specified shape into the graphics registry.
		// shape: dojox.gfx.shape.Shape
		//		The shape to register.
		// returns:
		//		The unique id associated with this shape.
		// the id pattern : type+number (ex: Rect0,Rect1,etc)
		var t = shape.declaredClass.split('.').pop();
		var i = t in _ids ? ++_ids[t] : ((_ids[t] = 0));
		var uid = t+i;
		registry[uid] = shape;
		return uid;
	};
	
	shape.byId = function(/*String*/id){
		// summary: 
		//		Returns the shape that matches the specified id.
		// id: String
		//		The unique identifier for this Shape.
		return registry[id]; //dojox.gfx.shape.Shape
	};
	
	shape.dispose = function(/*dojox.gfx.shape.Shape*/shape){
		// summary: 
		//		Removes the specified shape from the registry.
		// shape: dojox.gfx.shape.Shape
		//		The shape to unregister.
		delete registry[shape.getUID()];
	};
	
	declare("dojox.gfx.shape.Shape", null, {
		// summary: a Shape object, which knows how to apply
		// graphical attributes and transformations
	
		constructor: function(){
			//	rawNode: Node
			//		underlying graphics-renderer-specific implementation object (if applicable)
			this.rawNode = null;
			//	shape: Object: an abstract shape object
			//	(see dojox.gfx.defaultPath,
			//	dojox.gfx.defaultPolyline,
			//	dojox.gfx.defaultRect,
			//	dojox.gfx.defaultEllipse,
			//	dojox.gfx.defaultCircle,
			//	dojox.gfx.defaultLine,
			//	or dojox.gfx.defaultImage)
			this.shape = null;
	
			//	matrix: dojox.gfx.Matrix2D
			//		a transformation matrix
			this.matrix = null;
	
			//	fillStyle: Object
			//		a fill object
			//		(see dojox.gfx.defaultLinearGradient,
			//		dojox.gfx.defaultRadialGradient,
			//		dojox.gfx.defaultPattern,
			//		or dojo.Color)
			this.fillStyle = null;
	
			//	strokeStyle: Object
			//		a stroke object
			//		(see dojox.gfx.defaultStroke)
			this.strokeStyle = null;
	
			// bbox: dojox.gfx.Rectangle
			//		a bounding box of this shape
			//		(see dojox.gfx.defaultRect)
			this.bbox = null;
	
			// virtual group structure
	
			// parent: Object
			//		a parent or null
			//		(see dojox.gfx.Surface,
			//		dojox.gfx.shape.VirtualGroup,
			//		or dojox.gfx.Group)
			this.parent = null;
	
			// parentMatrix: dojox.gfx.Matrix2D
			//	a transformation matrix inherited from the parent
			this.parentMatrix = null;
			
			var uid = shape.register(this);
			this.getUID = function(){
				return uid;
			}
		},	
	
		// trivial getters
	
		getNode: function(){
			// summary: Different graphics rendering subsystems implement shapes in different ways.  This
			//	method provides access to the underlying graphics subsystem object.  Clients calling this
			//	method and using the return value must be careful not to try sharing or using the underlying node
			//	in a general way across renderer implementation.
			//	Returns the underlying graphics Node, or null if no underlying graphics node is used by this shape.
			return this.rawNode; // Node
		},
		getShape: function(){
			// summary: returns the current Shape object or null
			//	(see dojox.gfx.defaultPath,
			//	dojox.gfx.defaultPolyline,
			//	dojox.gfx.defaultRect,
			//	dojox.gfx.defaultEllipse,
			//	dojox.gfx.defaultCircle,
			//	dojox.gfx.defaultLine,
			//	or dojox.gfx.defaultImage)
			return this.shape; // Object
		},
		getTransform: function(){
			// summary: Returns the current transformation matrix applied to this Shape or null
			return this.matrix;	// dojox.gfx.Matrix2D
		},
		getFill: function(){
			// summary: Returns the current fill object or null
			//	(see dojox.gfx.defaultLinearGradient,
			//	dojox.gfx.defaultRadialGradient,
			//	dojox.gfx.defaultPattern,
			//	or dojo.Color)
			return this.fillStyle;	// Object
		},
		getStroke: function(){
			// summary: Returns the current stroke object or null
			//	(see dojox.gfx.defaultStroke)
			return this.strokeStyle;	// Object
		},
		getParent: function(){
			// summary: Returns the parent Shape, Group or VirtualGroup or null if this Shape is unparented.
			//	(see dojox.gfx.Surface,
			//	dojox.gfx.shape.VirtualGroup,
			//	or dojox.gfx.Group)
			return this.parent;	// Object
		},
		getBoundingBox: function(){
			// summary: Returns the bounding box Rectanagle for this shape or null if a BoundingBox cannot be
			//	calculated for the shape on the current renderer or for shapes with no geometric area (points).
			//	A bounding box is a rectangular geometric region
			//	defining the X and Y extent of the shape.
			//	(see dojox.gfx.defaultRect)
			return this.bbox;	// dojox.gfx.Rectangle
		},
		getTransformedBoundingBox: function(){
			// summary: returns an array of four points or null
			//	four points represent four corners of the untransformed bounding box
			var b = this.getBoundingBox();
			if(!b){
				return null;	// null
			}
			var m = this._getRealMatrix(),
				gm = matrixLib;
			return [	// Array
					gm.multiplyPoint(m, b.x, b.y),
					gm.multiplyPoint(m, b.x + b.width, b.y),
					gm.multiplyPoint(m, b.x + b.width, b.y + b.height),
					gm.multiplyPoint(m, b.x, b.y + b.height)
				];
		},
		getEventSource: function(){
			// summary: returns a Node, which is used as
			//	a source of events for this shape
			// COULD BE RE-IMPLEMENTED BY THE RENDERER!
			return this.rawNode;	// Node
		},
	
		// empty settings
	
		setShape: function(shape){
			// summary: sets a shape object
			//	(the default implementation simply ignores it)
			// shape: Object
			//	a shape object
			//	(see dojox.gfx.defaultPath,
			//	dojox.gfx.defaultPolyline,
			//	dojox.gfx.defaultRect,
			//	dojox.gfx.defaultEllipse,
			//	dojox.gfx.defaultCircle,
			//	dojox.gfx.defaultLine,
			//	or dojox.gfx.defaultImage)
			// COULD BE RE-IMPLEMENTED BY THE RENDERER!
			this.shape = g.makeParameters(this.shape, shape);
			this.bbox = null;
			return this;	// self
		},
		setFill: function(fill){
			// summary: sets a fill object
			//	(the default implementation simply ignores it)
			// fill: Object
			//	a fill object
			//	(see dojox.gfx.defaultLinearGradient,
			//	dojox.gfx.defaultRadialGradient,
			//	dojox.gfx.defaultPattern,
			//	or dojo.Color)
			// COULD BE RE-IMPLEMENTED BY THE RENDERER!
			if(!fill){
				// don't fill
				this.fillStyle = null;
				return this;	// self
			}
			var f = null;
			if(typeof(fill) == "object" && "type" in fill){
				// gradient or pattern
				switch(fill.type){
					case "linear":
						f = g.makeParameters(g.defaultLinearGradient, fill);
						break;
					case "radial":
						f = g.makeParameters(g.defaultRadialGradient, fill);
						break;
					case "pattern":
						f = g.makeParameters(g.defaultPattern, fill);
						break;
				}
			}else{
				// color object
				f = g.normalizeColor(fill);
			}
			this.fillStyle = f;
			return this;	// self
		},
		setStroke: function(stroke){
			// summary: sets a stroke object
			//	(the default implementation simply ignores it)
			// stroke: Object
			//	a stroke object
			//	(see dojox.gfx.defaultStroke)
			// COULD BE RE-IMPLEMENTED BY THE RENDERER!
			if(!stroke){
				// don't stroke
				this.strokeStyle = null;
				return this;	// self
			}
			// normalize the stroke
			if(typeof stroke == "string" || lang.isArray(stroke) || stroke instanceof Color){
				stroke = {color: stroke};
			}
			var s = this.strokeStyle = g.makeParameters(g.defaultStroke, stroke);
			s.color = g.normalizeColor(s.color);
			return this;	// self
		},
		setTransform: function(matrix){
			// summary: sets a transformation matrix
			// matrix: dojox.gfx.Matrix2D
			//	a matrix or a matrix-like object
			//	(see an argument of dojox.gfx.Matrix2D
			//	constructor for a list of acceptable arguments)
			// COULD BE RE-IMPLEMENTED BY THE RENDERER!
			this.matrix = matrixLib.clone(matrix ? matrixLib.normalize(matrix) : matrixLib.identity);
			return this._applyTransform();	// self
		},
	
		_applyTransform: function(){
			// summary: physically sets a matrix
			// COULD BE RE-IMPLEMENTED BY THE RENDERER!
			return this;	// self
		},
	
		// z-index
	
		moveToFront: function(){
			// summary: moves a shape to front of its parent's list of shapes
			var p = this.getParent();
			if(p){
				p._moveChildToFront(this);
				this._moveToFront();	// execute renderer-specific action
			}
			return this;	// self
		},
		moveToBack: function(){
			// summary: moves a shape to back of its parent's list of shapes
			var p = this.getParent();
			if(p){
				p._moveChildToBack(this);
				this._moveToBack();	// execute renderer-specific action
			}
			return this;
		},
		_moveToFront: function(){
			// summary: renderer-specific hook, see dojox.gfx.shape.Shape.moveToFront()
			// COULD BE RE-IMPLEMENTED BY THE RENDERER!
		},
		_moveToBack: function(){
			// summary: renderer-specific hook, see dojox.gfx.shape.Shape.moveToFront()
			// COULD BE RE-IMPLEMENTED BY THE RENDERER!
		},
	
		// apply left & right transformation
	
		applyRightTransform: function(matrix){
			// summary: multiplies the existing matrix with an argument on right side
			//	(this.matrix * matrix)
			// matrix: dojox.gfx.Matrix2D
			//	a matrix or a matrix-like object
			//	(see an argument of dojox.gfx.Matrix2D
			//	constructor for a list of acceptable arguments)
			return matrix ? this.setTransform([this.matrix, matrix]) : this;	// self
		},
		applyLeftTransform: function(matrix){
			// summary: multiplies the existing matrix with an argument on left side
			//	(matrix * this.matrix)
			// matrix: dojox.gfx.Matrix2D
			//	a matrix or a matrix-like object
			//	(see an argument of dojox.gfx.Matrix2D
			//	constructor for a list of acceptable arguments)
			return matrix ? this.setTransform([matrix, this.matrix]) : this;	// self
		},
		applyTransform: function(matrix){
			// summary: a shortcut for dojox.gfx.Shape.applyRightTransform
			// matrix: dojox.gfx.Matrix2D
			//	a matrix or a matrix-like object
			//	(see an argument of dojox.gfx.Matrix2D
			//	constructor for a list of acceptable arguments)
			return matrix ? this.setTransform([this.matrix, matrix]) : this;	// self
		},
	
		// virtual group methods
	
		removeShape: function(silently){
			// summary: removes the shape from its parent's list of shapes
			// silently: Boolean
			// 		if true, do not redraw a picture yet
			if(this.parent){
				this.parent.remove(this, silently);
			}
			return this;	// self
		},
		_setParent: function(parent, matrix){
			// summary: sets a parent
			// parent: Object
			//	a parent or null
			//	(see dojox.gfx.Surface,
			//	dojox.gfx.shape.VirtualGroup,
			//	or dojox.gfx.Group)
			// matrix: dojox.gfx.Matrix2D
			//	a 2D matrix or a matrix-like object
			this.parent = parent;
			return this._updateParentMatrix(matrix);	// self
		},
		_updateParentMatrix: function(matrix){
			// summary: updates the parent matrix with new matrix
			// matrix: dojox.gfx.Matrix2D
			//	a 2D matrix or a matrix-like object
			this.parentMatrix = matrix ? matrixLib.clone(matrix) : null;
			return this._applyTransform();	// self
		},
		_getRealMatrix: function(){
			// summary: returns the cumulative ('real') transformation matrix
			//	by combining the shape's matrix with its parent's matrix
			var m = this.matrix;
			var p = this.parent;
			while(p){
				if(p.matrix){
					m = matrixLib.multiply(p.matrix, m);
				}
				p = p.parent;
			}
			return m;	// dojox.gfx.Matrix2D
		}
	});
	
	shape._eventsProcessing = {
		connect: function(name, object, method){
			// summary: connects a handler to an event on this shape
			// COULD BE RE-IMPLEMENTED BY THE RENDERER!
			// redirect to fixCallback to normalize events and add the gfxTarget to the event. The latter
			// is done by dojox.gfx.fixTarget which is defined by each renderer
			return events.connect(this.getEventSource(), name, shape.fixCallback(this, g.fixTarget, object, method));
			
		},
		disconnect: function(token){
			// summary: connects a handler by token from an event on this shape
			// COULD BE RE-IMPLEMENTED BY THE RENDERER!
	
			events.disconnect(token);
		}
	};
	
	shape.fixCallback = function(gfxElement, fixFunction, scope, method){
		//  summary:
		//      Wraps the callback to allow for tests and event normalization
		//      before it gets invoked. This is where 'fixTarget' is invoked.
		//  gfxElement: Object
		//      The GFX object that triggers the action (ex.: 
		//      dojox.gfx.Surface and dojox.gfx.Shape). A new event property
		//      'gfxTarget' is added to the event to reference this object.
		//      for easy manipulation of GFX objects by the event handlers.
		//  fixFunction: Function
		//      The function that implements the logic to set the 'gfxTarget'
		//      property to the event. It should be 'dojox.gfx.fixTarget' for
		//      most of the cases
		//  scope: Object
		//      Optional. The scope to be used when invoking 'method'. If
		//      omitted, a global scope is used.
		//  method: Function|String
		//      The original callback to be invoked.
		if(!method){
			method = scope;
			scope = null;
		}
		if(lang.isString(method)){
			scope = scope || win.global;
			if(!scope[method]){ throw(['dojox.gfx.shape.fixCallback: scope["', method, '"] is null (scope="', scope, '")'].join('')); }
			return function(e){  
				return fixFunction(e,gfxElement) ? scope[method].apply(scope, arguments || []) : undefined; }; // Function
		}
		return !scope 
			? function(e){ 
				return fixFunction(e,gfxElement) ? method.apply(scope, arguments) : undefined; } 
			: function(e){ 
				return fixFunction(e,gfxElement) ? method.apply(scope, arguments || []) : undefined; }; // Function
	};
	lang.extend(shape.Shape, shape._eventsProcessing);
	
	shape.Container = {
		// summary: a container of shapes, which can be used
		//	as a foundation for renderer-specific groups, or as a way
		//	to logically group shapes (e.g, to propagate matricies)
	
		_init: function() {
			// children: Array: a list of children
			this.children = [];
		},
	
		// group management
	
		openBatch: function() {
			// summary: starts a new batch, subsequent new child shapes will be held in
			//	the batch instead of appending to the container directly
		},
		closeBatch: function() {
			// summary: submits the current batch, append all pending child shapes to DOM
		},
		add: function(shape){
			// summary: adds a shape to the list
			// shape: dojox.gfx.Shape
			//		the shape to add to the list
			var oldParent = shape.getParent();
			if(oldParent){
				oldParent.remove(shape, true);
			}
			this.children.push(shape);
			return shape._setParent(this, this._getRealMatrix());	// self
		},
		remove: function(shape, silently){
			// summary: removes a shape from the list
			//	shape: dojox.gfx.shape.Shape
			//		the shape to remove
			// silently: Boolean
			//		if true, do not redraw a picture yet
			for(var i = 0; i < this.children.length; ++i){
				if(this.children[i] == shape){
					if(silently){
						// skip for now
					}else{
						shape.parent = null;
						shape.parentMatrix = null;
					}
					this.children.splice(i, 1);
					break;
				}
			}
			return this;	// self
		},
		clear: function(){
			// summary: removes all shapes from a group/surface
			var shape;
			for(var i = 0; i < this.children.length;++i){
				shape = this.children[i];
				shape.parent = null;
				shape.parentMatrix = null;
			}
			this.children = [];
			return this;	// self
		},
	
		// moving child nodes
	
		_moveChildToFront: function(shape){
			// summary: moves a shape to front of the list of shapes
			//	shape: dojox.gfx.shape.Shape
			//		one of the child shapes to move to the front
			for(var i = 0; i < this.children.length; ++i){
				if(this.children[i] == shape){
					this.children.splice(i, 1);
					this.children.push(shape);
					break;
				}
			}
			return this;	// self
		},
		_moveChildToBack: function(shape){
			// summary: moves a shape to back of the list of shapes
			//	shape: dojox.gfx.shape.Shape
			//		one of the child shapes to move to the front
			for(var i = 0; i < this.children.length; ++i){
				if(this.children[i] == shape){
					this.children.splice(i, 1);
					this.children.unshift(shape);
					break;
				}
			}
			return this;	// self
		}
	};
	
	declare("dojox.gfx.shape.Surface", null, {
		// summary: a surface object to be used for drawings
		constructor: function(){
			// underlying node
			this.rawNode = null;
			// the parent node
			this._parent = null;
			// the list of DOM nodes to be deleted in the case of destruction
			this._nodes = [];
			// the list of events to be detached in the case of destruction
			this._events = [];
		},
		destroy: function(){
			// summary: destroy all relevant external resources and release all
			//	external references to make this object garbage-collectible
			arr.forEach(this._nodes, domConstruct.destroy);
			this._nodes = [];
			arr.forEach(this._events, events.disconnect);
			this._events = [];
			this.rawNode = null;	// recycle it in _nodes, if it needs to be recycled
			if(has("ie")){
				while(this._parent.lastChild){
					domConstruct.destroy(this._parent.lastChild);
				}
			}else{
				this._parent.innerHTML = "";
			}
			this._parent = null;
		},
		getEventSource: function(){
			// summary: returns a node, which can be used to attach event listeners
			return this.rawNode; // Node
		},
		_getRealMatrix: function(){
			// summary: always returns the identity matrix
			return null;	// dojox.gfx.Matrix2D
		},
		isLoaded: true,
		onLoad: function(/*dojox.gfx.Surface*/ surface){
			// summary: local event, fired once when the surface is created
			// asynchronously, used only when isLoaded is false, required
			// only for Silverlight.
		},
		whenLoaded: function(/*Object|Null*/ context, /*Function|String*/ method){
			var f = lang.hitch(context, method);
			if(this.isLoaded){
				f(this);
			}else{
				var h = events.connect(this, "onLoad", function(surface){
					events.disconnect(h);
					f(surface);
				});
			}
		}
	});
	
	lang.extend(shape.Surface, shape._eventsProcessing);
	
	declare("dojox.gfx.Point", null, {
		// summary: a hypothetical 2D point to be used for drawings - {x, y}
		// description: This object is defined for documentation purposes.
		//	You should use the naked object instead: {x: 1, y: 2}.
	});
	
	declare("dojox.gfx.Rectangle", null, {
		// summary: a hypothetical rectangle - {x, y, width, height}
		// description: This object is defined for documentation purposes.
		//	You should use the naked object instead: {x: 1, y: 2, width: 100, height: 200}.
	});
	
	declare("dojox.gfx.shape.Rect", shape.Shape, {
		// summary: a generic rectangle
		constructor: function(rawNode){
			// rawNode: Node
			//		The underlying graphics system object (typically a DOM Node)
			this.shape = g.getDefault("Rect");
			this.rawNode = rawNode;
		},
		getBoundingBox: function(){
			// summary: returns the bounding box (its shape in this case)
			return this.shape;	// dojox.gfx.Rectangle
		}
	});
	
	declare("dojox.gfx.shape.Ellipse", shape.Shape, {
		// summary: a generic ellipse
		constructor: function(rawNode){
			// rawNode: Node
			//		a DOM Node
			this.shape = g.getDefault("Ellipse");
			this.rawNode = rawNode;
		},
		getBoundingBox: function(){
			// summary: returns the bounding box
			if(!this.bbox){
				var shape = this.shape;
				this.bbox = {x: shape.cx - shape.rx, y: shape.cy - shape.ry,
					width: 2 * shape.rx, height: 2 * shape.ry};
			}
			return this.bbox;	// dojox.gfx.Rectangle
		}
	});
	
	declare("dojox.gfx.shape.Circle", shape.Shape, {
		// summary: a generic circle
		//	(this is a helper object, which is defined for convenience)
		constructor: function(rawNode){
			// rawNode: Node
			//		a DOM Node
			this.shape = g.getDefault("Circle");
			this.rawNode = rawNode;
		},
		getBoundingBox: function(){
			// summary: returns the bounding box
			if(!this.bbox){
				var shape = this.shape;
				this.bbox = {x: shape.cx - shape.r, y: shape.cy - shape.r,
					width: 2 * shape.r, height: 2 * shape.r};
			}
			return this.bbox;	// dojox.gfx.Rectangle
		}
	});
	
	declare("dojox.gfx.shape.Line", shape.Shape, {
		// summary: a generic line
		//	(this is a helper object, which is defined for convenience)
		constructor: function(rawNode){
			// rawNode: Node
			//		a DOM Node
			this.shape = g.getDefault("Line");
			this.rawNode = rawNode;
		},
		getBoundingBox: function(){
			// summary: returns the bounding box
			if(!this.bbox){
				var shape = this.shape;
				this.bbox = {
					x:		Math.min(shape.x1, shape.x2),
					y:		Math.min(shape.y1, shape.y2),
					width:	Math.abs(shape.x2 - shape.x1),
					height:	Math.abs(shape.y2 - shape.y1)
				};
			}
			return this.bbox;	// dojox.gfx.Rectangle
		}
	});
	
	declare("dojox.gfx.shape.Polyline", shape.Shape, {
		// summary: a generic polyline/polygon
		//	(this is a helper object, which is defined for convenience)
		constructor: function(rawNode){
			// rawNode: Node
			//		a DOM Node
			this.shape = g.getDefault("Polyline");
			this.rawNode = rawNode;
		},
		setShape: function(points, closed){
			// summary: sets a polyline/polygon shape object
			// points: Object
			//		a polyline/polygon shape object
			// closed: Boolean
			//		close the polyline to make a polygon
			if(points && points instanceof Array){
				// points: Array: an array of points
				this.inherited(arguments, [{points: points}]);
				if(closed && this.shape.points.length){
					this.shape.points.push(this.shape.points[0]);
				}
			}else{
				this.inherited(arguments, [points]);
			}
			return this;	// self
		},
		_normalizePoints: function(){
			// summary: normalize points to array of {x:number, y:number}
			var p = this.shape.points, l = p && p.length;
			if(l && typeof p[0] == "number"){
				var points = [];
				for(var i = 0; i < l; i += 2){
					points.push({x: p[i], y: p[i + 1]});
				}
				this.shape.points = points;
			}
		},
		getBoundingBox: function(){
			// summary: returns the bounding box
			if(!this.bbox && this.shape.points.length){
				var p = this.shape.points;
				var l = p.length;
				var t = p[0];
				var bbox = {l: t.x, t: t.y, r: t.x, b: t.y};
				for(var i = 1; i < l; ++i){
					t = p[i];
					if(bbox.l > t.x) bbox.l = t.x;
					if(bbox.r < t.x) bbox.r = t.x;
					if(bbox.t > t.y) bbox.t = t.y;
					if(bbox.b < t.y) bbox.b = t.y;
				}
				this.bbox = {
					x:		bbox.l,
					y:		bbox.t,
					width:	bbox.r - bbox.l,
					height:	bbox.b - bbox.t
				};
			}
			return this.bbox;	// dojox.gfx.Rectangle
		}
	});
	
	declare("dojox.gfx.shape.Image", shape.Shape, {
		// summary: a generic image
		//	(this is a helper object, which is defined for convenience)
		constructor: function(rawNode){
			// rawNode: Node
			//		a DOM Node
			this.shape = g.getDefault("Image");
			this.rawNode = rawNode;
		},
		getBoundingBox: function(){
			// summary: returns the bounding box (its shape in this case)
			return this.shape;	// dojox.gfx.Rectangle
		},
		setStroke: function(){
			// summary: ignore setting a stroke style
			return this;	// self
		},
		setFill: function(){
			// summary: ignore setting a fill style
			return this;	// self
		}
	});
	
	declare("dojox.gfx.shape.Text", shape.Shape, {
		// summary: a generic text
		constructor: function(rawNode){
			// rawNode: Node
			//		a DOM Node
			this.fontStyle = null;
			this.shape = g.getDefault("Text");
			this.rawNode = rawNode;
		},
		getFont: function(){
			// summary: returns the current font object or null
			return this.fontStyle;	// Object
		},
		setFont: function(newFont){
			// summary: sets a font for text
			// newFont: Object
			//		a font object (see dojox.gfx.defaultFont) or a font string
			this.fontStyle = typeof newFont == "string" ? g.splitFontString(newFont) :
				g.makeParameters(g.defaultFont, newFont);
			this._setFont();
			return this;	// self
		}
	});
	
	shape.Creator = {
		// summary: shape creators
		createShape: function(shape){
			// summary: creates a shape object based on its type; it is meant to be used
			//	by group-like objects
			// shape: Object
			//		a shape descriptor object
			switch(shape.type){
				case g.defaultPath.type:		return this.createPath(shape);
				case g.defaultRect.type:		return this.createRect(shape);
				case g.defaultCircle.type:	return this.createCircle(shape);
				case g.defaultEllipse.type:	return this.createEllipse(shape);
				case g.defaultLine.type:		return this.createLine(shape);
				case g.defaultPolyline.type:	return this.createPolyline(shape);
				case g.defaultImage.type:		return this.createImage(shape);
				case g.defaultText.type:		return this.createText(shape);
				case g.defaultTextPath.type:	return this.createTextPath(shape);
			}
			return null;
		},
		createGroup: function(){
			// summary: creates a group shape
			return this.createObject(g.Group);	// dojox.gfx.Group
		},
		createRect: function(rect){
			// summary: creates a rectangle shape
			// rect: Object
			//		a path object (see dojox.gfx.defaultRect)
			return this.createObject(g.Rect, rect);	// dojox.gfx.Rect
		},
		createEllipse: function(ellipse){
			// summary: creates an ellipse shape
			// ellipse: Object
			//		an ellipse object (see dojox.gfx.defaultEllipse)
			return this.createObject(g.Ellipse, ellipse);	// dojox.gfx.Ellipse
		},
		createCircle: function(circle){
			// summary: creates a circle shape
			// circle: Object
			//		a circle object (see dojox.gfx.defaultCircle)
			return this.createObject(g.Circle, circle);	// dojox.gfx.Circle
		},
		createLine: function(line){
			// summary: creates a line shape
			// line: Object
			//		a line object (see dojox.gfx.defaultLine)
			return this.createObject(g.Line, line);	// dojox.gfx.Line
		},
		createPolyline: function(points){
			// summary: creates a polyline/polygon shape
			// points: Object
			//		a points object (see dojox.gfx.defaultPolyline)
			//		or an Array of points
			return this.createObject(g.Polyline, points);	// dojox.gfx.Polyline
		},
		createImage: function(image){
			// summary: creates a image shape
			// image: Object
			//		an image object (see dojox.gfx.defaultImage)
			return this.createObject(g.Image, image);	// dojox.gfx.Image
		},
		createText: function(text){
			// summary: creates a text shape
			// text: Object
			//		a text object (see dojox.gfx.defaultText)
			return this.createObject(g.Text, text);	// dojox.gfx.Text
		},
		createPath: function(path){
			// summary: creates a path shape
			// path: Object
			//		a path object (see dojox.gfx.defaultPath)
			return this.createObject(g.Path, path);	// dojox.gfx.Path
		},
		createTextPath: function(text){
			// summary: creates a text shape
			// text: Object
			//		a textpath object (see dojox.gfx.defaultTextPath)
			return this.createObject(g.TextPath, {}).setText(text);	// dojox.gfx.TextPath
		},
		createObject: function(shapeType, rawShape){
			// summary: creates an instance of the passed shapeType class
			// SHOULD BE RE-IMPLEMENTED BY THE RENDERER!
			// shapeType: Function
			//		a class constructor to create an instance of
			// rawShape: Object 
			//		properties to be passed in to the classes 'setShape' method
	
			return null;	// dojox.gfx.Shape
		}
	};
	
	return shape;
});


},
'dojox/charting/action2d/Tooltip':function(){
define("dojox/charting/action2d/Tooltip", ["dojo/_base/kernel", "dijit/Tooltip","dojo/_base/lang", "dojo/_base/html", "dojo/_base/declare", "./PlotAction", 
	"dojox/gfx/matrix", "dojox/lang/functional", "dojox/lang/functional/scan", "dojox/lang/functional/fold"], 
	function(dojo, Tooltip, lang, html, declare, PlotAction, m, df, dfs, dff){
	
	/*=====
	dojo.declare("dojox.charting.action2d.__TooltipCtorArgs", dojox.charting.action2d.__PlotActionCtorArgs, {
		//	summary:
		//		Additional arguments for tooltip actions.
	
		//	text: Function?
		//		The function that produces the text to be shown within a tooltip.  By default this will be
		//		set by the plot in question, by returning the value of the element.
		text: null
	});
	var PlotAction = dojox.charting.action2d.PlotAction;
	=====*/

	var DEFAULT_TEXT = function(o){
		var t = o.run && o.run.data && o.run.data[o.index];
		if(t && typeof t != "number" && (t.tooltip || t.text)){
			return t.tooltip || t.text;
		}
		if(o.element == "candlestick"){
			return '<table cellpadding="1" cellspacing="0" border="0" style="font-size:0.9em;">'
				+ '<tr><td>Open:</td><td align="right"><strong>' + o.data.open + '</strong></td></tr>'
				+ '<tr><td>High:</td><td align="right"><strong>' + o.data.high + '</strong></td></tr>'
				+ '<tr><td>Low:</td><td align="right"><strong>' + o.data.low + '</strong></td></tr>'
				+ '<tr><td>Close:</td><td align="right"><strong>' + o.data.close + '</strong></td></tr>'
				+ (o.data.mid !== undefined ? '<tr><td>Mid:</td><td align="right"><strong>' + o.data.mid + '</strong></td></tr>' : '')
				+ '</table>';
		}
		return o.element == "bar" ? o.x : o.y;
	};

	var pi4 = Math.PI / 4, pi2 = Math.PI / 2;
	
	return declare("dojox.charting.action2d.Tooltip", PlotAction, {
		//	summary:
		//		Create an action on a plot where a tooltip is shown when hovering over an element.

		// the data description block for the widget parser
		defaultParams: {
			text: DEFAULT_TEXT	// the function to produce a tooltip from the object
		},
		optionalParams: {},	// no optional parameters

		constructor: function(chart, plot, kwArgs){
			//	summary:
			//		Create the tooltip action and connect it to the plot.
			//	chart: dojox.charting.Chart
			//		The chart this action belongs to.
			//	plot: String?
			//		The plot this action is attached to.  If not passed, "default" is assumed.
			//	kwArgs: dojox.charting.action2d.__TooltipCtorArgs?
			//		Optional keyword arguments object for setting parameters.
			this.text = kwArgs && kwArgs.text ? kwArgs.text : DEFAULT_TEXT;
			
			this.connect();
		},
		
		process: function(o){
			//	summary:
			//		Process the action on the given object.
			//	o: dojox.gfx.Shape
			//		The object on which to process the highlighting action.
			if(o.type === "onplotreset" || o.type === "onmouseout"){
                Tooltip.hide(this.aroundRect);
				this.aroundRect = null;
				if(o.type === "onplotreset"){
					delete this.angles;
				}
				return;
			}
			
			if(!o.shape || o.type !== "onmouseover"){ return; }
			
			// calculate relative coordinates and the position
			var aroundRect = {type: "rect"}, position = ["after", "before"];
			switch(o.element){
				case "marker":
					aroundRect.x = o.cx;
					aroundRect.y = o.cy;
					aroundRect.w = aroundRect.h = 1;
					break;
				case "circle":
					aroundRect.x = o.cx - o.cr;
					aroundRect.y = o.cy - o.cr;
					aroundRect.w = aroundRect.h = 2 * o.cr;
					break;
				case "column":
					position = ["above", "below"];
					// intentional fall down
				case "bar":
					aroundRect = lang.clone(o.shape.getShape());
					aroundRect.w = aroundRect.width;
					aroundRect.h = aroundRect.height;
					break;
				case "candlestick":
					aroundRect.x = o.x;
					aroundRect.y = o.y;
					aroundRect.w = o.width;
					aroundRect.h = o.height;
					break;
				default:
				//case "slice":
					if(!this.angles){
						// calculate the running total of slice angles
						if(typeof o.run.data[0] == "number"){
							this.angles = df.map(df.scanl(o.run.data, "+", 0),
								"* 2 * Math.PI / this", df.foldl(o.run.data, "+", 0));
						}else{
							this.angles = df.map(df.scanl(o.run.data, "a + b.y", 0),
								"* 2 * Math.PI / this", df.foldl(o.run.data, "a + b.y", 0));
						}
					}
					var startAngle = m._degToRad(o.plot.opt.startAngle),
						angle = (this.angles[o.index] + this.angles[o.index + 1]) / 2 + startAngle;
					aroundRect.x = o.cx + o.cr * Math.cos(angle);
					aroundRect.y = o.cy + o.cr * Math.sin(angle);
					aroundRect.w = aroundRect.h = 1;
					// calculate the position
					if(angle < pi4){
						// do nothing: the position is right
					}else if(angle < pi2 + pi4){
						position = ["below", "above"];
					}else if(angle < Math.PI + pi4){
						position = ["before", "after"];
					}else if(angle < 2 * Math.PI - pi4){
						position = ["above", "below"];
					}
					/*
					else{
						// do nothing: the position is right
					}
					*/
					break;
			}
			
			// adjust relative coordinates to absolute, and remove fractions
			var lt = this.chart.getCoords();
			aroundRect.x += lt.x;
			aroundRect.y += lt.y;
			aroundRect.x = Math.round(aroundRect.x);
			aroundRect.y = Math.round(aroundRect.y);
			aroundRect.w = Math.ceil(aroundRect.w);
			aroundRect.h = Math.ceil(aroundRect.h);
			this.aroundRect = aroundRect;

			var tooltip = this.text(o);
			if(this.chart.getTextDir){
				var isChartDirectionRtl = (html.style(this.chart.node,"direction") == "rtl");
				var isBaseTextDirRtl = (this.chart.getTextDir(tooltip) == "rtl");
			}
			if(tooltip){
				if(isBaseTextDirRtl && !isChartDirectionRtl){
					Tooltip.show("<span dir = 'rtl'>" + tooltip +"</span>", this.aroundRect, position);
				}
				else if(!isBaseTextDirRtl && isChartDirectionRtl){
					Tooltip.show("<span dir = 'ltr'>" + tooltip +"</span>", this.aroundRect, position);
				}else{
					Tooltip.show(tooltip, this.aroundRect, position);
				}
			}
		}
	});
});

},
'dojox/charting/plot2d/Grid':function(){
define("dojox/charting/plot2d/Grid", ["dojo/_base/lang", "dojo/_base/declare", "dojo/_base/connect", "dojo/_base/array",
		"../Element", "./common", "dojox/lang/utils", "dojox/gfx/fx"], 
	function(lang, declare, hub, arr, Element, dc, du, fx){

	/*=====
	dojo.declare("dojox.charting.plot2d.__GridCtorArgs", dojox.charting.plot2d.__DefaultCtorArgs, {
		//	summary:
		//		A special keyword arguments object that is specific to a grid "plot".
	
		//	hMajorLines: Boolean?
		//		Whether to show lines at the major ticks along the horizontal axis. Default is true.
		hMajorLines: true,
	
		//	hMinorLines: Boolean?
		//		Whether to show lines at the minor ticks along the horizontal axis. Default is false.
		hMinorLines: false,
	
		//	vMajorLines: Boolean?
		//		Whether to show lines at the major ticks along the vertical axis. Default is true.
		vMajorLines: true,
	
		//	vMinorLines: Boolean?
		//		Whether to show lines at the major ticks along the vertical axis. Default is false.
		vMinorLines: false,
	
		//	hStripes: String?
		//		Whether or not to show stripes (alternating fills) along the horizontal axis. Default is "none".
		hStripes: "none",
	
		//	vStripes: String?
		//		Whether or not to show stripes (alternating fills) along the vertical axis. Default is "none".
		vStripes: "none",
		
		//	enableCache: Boolean?
		//		Whether the grid lines are cached from one rendering to another. This improves the rendering performance of
		//		successive rendering but penalize the first rendering.  Default false.
		enableCache: false
	});
	var Element = dojox.charting.plot2d.Element;
	=====*/

	return declare("dojox.charting.plot2d.Grid", Element, {
		//	summary:
		//		A "faux" plot that can be placed behind other plots to represent
		//		a grid against which other plots can be easily measured.
		defaultParams: {
			hAxis: "x",			// use a horizontal axis named "x"
			vAxis: "y",			// use a vertical axis named "y"
			hMajorLines: true,	// draw horizontal major lines
			hMinorLines: false,	// draw horizontal minor lines
			vMajorLines: true,	// draw vertical major lines
			vMinorLines: false,	// draw vertical minor lines
			hStripes: "none",	// TBD
			vStripes: "none",	// TBD
			animate: null,   // animate bars into place
			enableCache: false
		},
		optionalParams: {},	// no optional parameters

		constructor: function(chart, kwArgs){
			//	summary:
			//		Create the faux Grid plot.
			//	chart: dojox.charting.Chart
			//		The chart this plot belongs to.
			//	kwArgs: dojox.charting.plot2d.__GridCtorArgs?
			//		An optional keyword arguments object to help define the parameters of the underlying grid.
			this.opt = lang.clone(this.defaultParams);
			du.updateWithObject(this.opt, kwArgs);
			this.hAxis = this.opt.hAxis;
			this.vAxis = this.opt.vAxis;
			this.dirty = true;
			this.animate = this.opt.animate;
			this.zoom = null,
			this.zoomQueue = [];	// zooming action task queue
			this.lastWindow = {vscale: 1, hscale: 1, xoffset: 0, yoffset: 0};
			if(this.opt.enableCache){
				this._lineFreePool = [];
				this._lineUsePool = [];
			}
		},
		clear: function(){
			//	summary:
			//		Clear out any parameters set on this plot.
			//	returns: dojox.charting.plot2d.Grid
			//		The reference to this plot for functional chaining.
			this._hAxis = null;
			this._vAxis = null;
			this.dirty = true;
			return this;	//	dojox.charting.plot2d.Grid
		},
		setAxis: function(axis){
			//	summary:
			//		Set an axis for this plot.
			//	returns: dojox.charting.plot2d.Grid
			//		The reference to this plot for functional chaining.
			if(axis){
				this[axis.vertical ? "_vAxis" : "_hAxis"] = axis;
			}
			return this;	//	dojox.charting.plot2d.Grid
		},
		addSeries: function(run){
			//	summary:
			//		Ignored but included as a dummy method.
			//	returns: dojox.charting.plot2d.Grid
			//		The reference to this plot for functional chaining.
			return this;	//	dojox.charting.plot2d.Grid
		},
		getSeriesStats: function(){
			//	summary:
			//		Returns default stats (irrelevant for this type of plot).
			//	returns: Object
			//		{hmin, hmax, vmin, vmax} min/max in both directions.
			return lang.delegate(dc.defaultStats);
		},
		initializeScalers: function(){
			//	summary:
			//		Does nothing (irrelevant for this type of plot).
			return this;
		},
		isDirty: function(){
			//	summary:
			//		Return whether or not this plot needs to be redrawn.
			//	returns: Boolean
			//		If this plot needs to be rendered, this will return true.
			return this.dirty || this._hAxis && this._hAxis.dirty || this._vAxis && this._vAxis.dirty;	//	Boolean
		},
		performZoom: function(dim, offsets){
			//	summary:
			//		Create/alter any zooming windows on this plot.
			//	dim: Object
			//		An object of the form { width, height }.
			//	offsets: Object
			//		An object of the form { l, r, t, b }.
			//	returns: dojox.charting.plot2d.Grid
			//		A reference to this plot for functional chaining.

			// get current zooming various
			var vs = this._vAxis.scale || 1,
				hs = this._hAxis.scale || 1,
				vOffset = dim.height - offsets.b,
				hBounds = this._hAxis.getScaler().bounds,
				xOffset = (hBounds.from - hBounds.lower) * hBounds.scale,
				vBounds = this._vAxis.getScaler().bounds,
				yOffset = (vBounds.from - vBounds.lower) * vBounds.scale,
				// get incremental zooming various
				rVScale = vs / this.lastWindow.vscale,
				rHScale = hs / this.lastWindow.hscale,
				rXOffset = (this.lastWindow.xoffset - xOffset)/
					((this.lastWindow.hscale == 1)? hs : this.lastWindow.hscale),
				rYOffset = (yOffset - this.lastWindow.yoffset)/
					((this.lastWindow.vscale == 1)? vs : this.lastWindow.vscale),

				shape = this.group,
				anim = fx.animateTransform(lang.delegate({
					shape: shape,
					duration: 1200,
					transform:[
						{name:"translate", start:[0, 0], end: [offsets.l * (1 - rHScale), vOffset * (1 - rVScale)]},
						{name:"scale", start:[1, 1], end: [rHScale, rVScale]},
						{name:"original"},
						{name:"translate", start: [0, 0], end: [rXOffset, rYOffset]}
					]}, this.zoom));

			lang.mixin(this.lastWindow, {vscale: vs, hscale: hs, xoffset: xOffset, yoffset: yOffset});
			//add anim to zooming action queue,
			//in order to avoid several zooming action happened at the same time
			this.zoomQueue.push(anim);
			//perform each anim one by one in zoomQueue
			hub.connect(anim, "onEnd", this, function(){
				this.zoom = null;
				this.zoomQueue.shift();
				if(this.zoomQueue.length > 0){
					this.zoomQueue[0].play();
				}
			});
			if(this.zoomQueue.length == 1){
				this.zoomQueue[0].play();
			}
			return this;	//	dojox.charting.plot2d.Grid
		},
		getRequiredColors: function(){
			//	summary:
			//		Ignored but included as a dummy method.
			//	returns: Number
			//		Returns 0, since there are no series associated with this plot type.
			return 0;	//	Number
		},
		cleanGroup: function(){
			this.inherited(arguments);
			if(this.opt.enableCache){
				this._lineFreePool = this._lineFreePool.concat(this._lineUsePool);
				this._lineUsePool = [];
			}
		},
		createLine: function(creator, params){
			var line;
			if(this.opt.enableCache && this._lineFreePool.length > 0){
				line = this._lineFreePool.pop();
				line.setShape(params);
				// was cleared, add it back
				creator.add(line);
			}else{
				line = creator.createLine(params);
			}
			if(this.opt.enableCache){
				this._lineUsePool.push(line);
			}
			return line;
		},
		render: function(dim, offsets){
			//	summary:
			//		Render the plot on the chart.
			//	dim: Object
			//		An object of the form { width, height }.
			//	offsets: Object
			//		An object of the form { l, r, t, b }.
			//	returns: dojox.charting.plot2d.Grid
			//		A reference to this plot for functional chaining.
			if(this.zoom){
				return this.performZoom(dim, offsets);
			}
			this.dirty = this.isDirty();
			if(!this.dirty){ return this; }
			this.cleanGroup();
			var s = this.group, ta = this.chart.theme.axis;
			// draw horizontal stripes and lines
			try{
				var vScaler = this._vAxis.getScaler(),
					vt = vScaler.scaler.getTransformerFromModel(vScaler),
					ticks = this._vAxis.getTicks();
				if(ticks != null){
					if(this.opt.hMinorLines){
						arr.forEach(ticks.minor, function(tick){
							var y = dim.height - offsets.b - vt(tick.value);
							var hMinorLine = this.createLine(s, {
								x1: offsets.l,
								y1: y,
								x2: dim.width - offsets.r,
								y2: y
							}).setStroke(ta.minorTick);
							if(this.animate){
								this._animateGrid(hMinorLine, "h", offsets.l, offsets.r + offsets.l - dim.width);
							}
						}, this);
					}
					if(this.opt.hMajorLines){
						arr.forEach(ticks.major, function(tick){
							var y = dim.height - offsets.b - vt(tick.value);
							var hMajorLine = this.createLine(s, {
								x1: offsets.l,
								y1: y,
								x2: dim.width - offsets.r,
								y2: y
							}).setStroke(ta.majorTick);
							if(this.animate){
								this._animateGrid(hMajorLine, "h", offsets.l, offsets.r + offsets.l - dim.width);
							}
						}, this);
					}
				}
			}catch(e){
				// squelch
			}
			// draw vertical stripes and lines
			try{
				var hScaler = this._hAxis.getScaler(),
					ht = hScaler.scaler.getTransformerFromModel(hScaler),
					ticks = this._hAxis.getTicks();
				if(this != null){
					if(ticks && this.opt.vMinorLines){
						arr.forEach(ticks.minor, function(tick){
							var x = offsets.l + ht(tick.value);
							var vMinorLine = this.createLine(s, {
								x1: x,
								y1: offsets.t,
								x2: x,
								y2: dim.height - offsets.b
							}).setStroke(ta.minorTick);
							if(this.animate){
								this._animateGrid(vMinorLine, "v", dim.height - offsets.b, dim.height - offsets.b - offsets.t);
							}
						}, this);
					}
					if(ticks && this.opt.vMajorLines){
						arr.forEach(ticks.major, function(tick){
							var x = offsets.l + ht(tick.value);
							var vMajorLine = this.createLine(s, {
								x1: x,
								y1: offsets.t,
								x2: x,
								y2: dim.height - offsets.b
							}).setStroke(ta.majorTick);
							if(this.animate){
								this._animateGrid(vMajorLine, "v", dim.height - offsets.b, dim.height - offsets.b - offsets.t);
							}
						}, this);
					}
				}
			}catch(e){
				// squelch
			}
			this.dirty = false;
			return this;	//	dojox.charting.plot2d.Grid
		},
		_animateGrid: function(shape, type, offset, size){
			var transStart = type == "h" ? [offset, 0] : [0, offset];
			var scaleStart = type == "h" ? [1/size, 1] : [1, 1/size];
			fx.animateTransform(lang.delegate({
				shape: shape,
				duration: 1200,
				transform: [
					{name: "translate", start: transStart, end: [0, 0]},
					{name: "scale", start: scaleStart, end: [1, 1]},
					{name: "original"}
				]
			}, this.animate)).play();
		}
	});
});

},
'dojox/charting/plot2d/Markers':function(){
define("dojox/charting/plot2d/Markers", ["dojo/_base/declare", "./Default"], function(declare, Default){
/*=====
var Default = dojox.charting.plot2d.Default
=====*/
	return declare("dojox.charting.plot2d.Markers", Default, {
		//	summary:
		//		A convenience plot to draw a line chart with markers.
		constructor: function(){
			//	summary:
			//		Set up the plot for lines and markers.
			this.opt.markers = true;
		}
	});
});

},
'dojox/lang/functional/sequence':function(){
define("dojox/lang/functional/sequence", ["dojo/_base/lang", "./lambda"], function(lang, df){

// This module adds high-level functions and related constructs:
//	- sequence generators

// If you want more general sequence builders check out listcomp.js and
// unfold() (in fold.js).

// Defined methods:
//	- take any valid lambda argument as the functional argument

/*=====
	var df = dojox.lang.functional;
 =====*/

	lang.mixin(df, {
		// sequence generators
		repeat: function(/*Number*/ n, /*Function|String|Array*/ f, /*Object*/ z, /*Object?*/ o){
			// summary: builds an array by repeatedly applying a unary function N times
			//	with a seed value Z. N should be greater than 0.
			o = o || dojo.global; f = df.lambda(f);
			var t = new Array(n), i = 1;
			t[0] = z;
			for(; i < n; t[i] = z = f.call(o, z), ++i);
			return t;	// Array
		},
		until: function(/*Function|String|Array*/ pr, /*Function|String|Array*/ f, /*Object*/ z, /*Object?*/ o){
			// summary: builds an array by repeatedly applying a unary function with
			//	a seed value Z until the predicate is satisfied.
			o = o || dojo.global; f = df.lambda(f); pr = df.lambda(pr);
			var t = [];
			for(; !pr.call(o, z); t.push(z), z = f.call(o, z));
			return t;	// Array
		}
	});
	
	return df;
});

},
'dojox/lang/utils':function(){
define("dojox/lang/utils", ["..", "dojo/_base/lang"], 
  function(dojox, lang){
	var du = lang.getObject("lang.utils", true, dojox);
	
	var empty = {}, opts = Object.prototype.toString;

	var clone = function(o){
		if(o){
			switch(opts.call(o)){
				case "[object Array]":
					return o.slice(0);
				case "[object Object]":
					return lang.delegate(o);
			}
		}
		return o;
	}
	
	lang.mixin(du, {
		coerceType: function(target, source){
			// summary: Coerces one object to the type of another.
			// target: Object: object, which typeof result is used to coerce "source" object.
			// source: Object: object, which will be forced to change type.
			switch(typeof target){
				case "number":	return Number(eval("(" + source + ")"));
				case "string":	return String(source);
				case "boolean":	return Boolean(eval("(" + source + ")"));
			}
			return eval("(" + source + ")");
		},
		
		updateWithObject: function(target, source, conv){
			// summary: Updates an existing object in place with properties from an "source" object.
			// target: Object: the "target" object to be updated
			// source: Object: the "source" object, whose properties will be used to source the existed object.
			// conv: Boolean?: force conversion to the original type
			if(!source){ return target; }
			for(var x in target){
				if(x in source && !(x in empty)){
					var t = target[x];
					if(t && typeof t == "object"){
						du.updateWithObject(t, source[x], conv);
					}else{
						target[x] = conv ? du.coerceType(t, source[x]) : clone(source[x]);
					}
				}
			}
			return target;	// Object
		},
	
		updateWithPattern: function(target, source, pattern, conv){
			// summary: Updates an existing object in place with properties from an "source" object.
			// target: Object: the "target" object to be updated
			// source: Object: the "source" object, whose properties will be used to source the existed object.
			// pattern: Object: object, whose properties will be used to pull values from the "source"
			// conv: Boolean?: force conversion to the original type
			if(!source || !pattern){ return target; }
			for(var x in pattern){
				if(x in source && !(x in empty)){
					target[x] = conv ? du.coerceType(pattern[x], source[x]) : clone(source[x]);
				}
			}
			return target;	// Object
		},
		
		merge: function(object, mixin){
			// summary: Merge two objects structurally, mixin properties will override object's properties.
			// object: Object: original object.
			// mixin: Object: additional object, which properties will override object's properties.
			if(mixin){
				var otype = opts.call(object), mtype = opts.call(mixin), t, i, l, m;
				switch(mtype){
					case "[object Array]":
						if(mtype == otype){
							t = new Array(Math.max(object.length, mixin.length));
							for(i = 0, l = t.length; i < l; ++i){
								t[i] = du.merge(object[i], mixin[i]);
							}
							return t;
						}
						return mixin.slice(0);
					case "[object Object]":
						if(mtype == otype && object){
							t = lang.delegate(object);
							for(i in mixin){
								if(i in object){
									l = object[i];
									m = mixin[i];
									if(m !== l){
										t[i] = du.merge(l, m);
									}
								}else{
									t[i] = lang.clone(mixin[i]);
								}
							}
							return t;
						}
						return lang.clone(mixin);
				}
			}
			return mixin;
		}
	});
	
	return du;
});

},
'dojox/charting/plot2d/Columns':function(){
define("dojox/charting/plot2d/Columns", ["dojo/_base/lang", "dojo/_base/array", "dojo/_base/declare", "./Base", "./common", 
		"dojox/lang/functional", "dojox/lang/functional/reversed", "dojox/lang/utils", "dojox/gfx/fx"], 
	function(lang, arr, declare, Base, dc, df, dfr, du, fx){

	var purgeGroup = dfr.lambda("item.purgeGroup()");
/*=====
var Base = dojox.charting.plot2d.Base;
=====*/

	return declare("dojox.charting.plot2d.Columns", Base, {
		//	summary:
		//		The plot object representing a column chart (vertical bars).
		defaultParams: {
			hAxis: "x",		// use a horizontal axis named "x"
			vAxis: "y",		// use a vertical axis named "y"
			gap:	0,		// gap between columns in pixels
			animate: null,  // animate bars into place
			enableCache: false
		},
		optionalParams: {
			minBarSize:	1,	// minimal column width in pixels
			maxBarSize:	1,	// maximal column width in pixels
			// theme component
			stroke:		{},
			outline:	{},
			shadow:		{},
			fill:		{},
			font:		"",
			fontColor:	""
		},

		constructor: function(chart, kwArgs){
			//	summary:
			//		The constructor for a columns chart.
			//	chart: dojox.charting.Chart
			//		The chart this plot belongs to.
			//	kwArgs: dojox.charting.plot2d.__BarCtorArgs?
			//		An optional keyword arguments object to help define the plot.
			this.opt = lang.clone(this.defaultParams);
			du.updateWithObject(this.opt, kwArgs);
			du.updateWithPattern(this.opt, kwArgs, this.optionalParams);
			this.series = [];
			this.hAxis = this.opt.hAxis;
			this.vAxis = this.opt.vAxis;
			this.animate = this.opt.animate;
		},

		getSeriesStats: function(){
			//	summary:
			//		Calculate the min/max on all attached series in both directions.
			//	returns: Object
			//		{hmin, hmax, vmin, vmax} min/max in both directions.
			var stats = dc.collectSimpleStats(this.series);
			stats.hmin -= 0.5;
			stats.hmax += 0.5;
			return stats;
		},
		
		createRect: function(run, creator, params){
			var rect;
			if(this.opt.enableCache && run._rectFreePool.length > 0){
				rect = run._rectFreePool.pop();
				rect.setShape(params);
				// was cleared, add it back
				creator.add(rect);
			}else{
				rect = creator.createRect(params);
			}
			if(this.opt.enableCache){
				run._rectUsePool.push(rect);
			}
			return rect;
		},

		render: function(dim, offsets){
			//	summary:
			//		Run the calculations for any axes for this plot.
			//	dim: Object
			//		An object in the form of { width, height }
			//	offsets: Object
			//		An object of the form { l, r, t, b}.
			//	returns: dojox.charting.plot2d.Columns
			//		A reference to this plot for functional chaining.
			if(this.zoom && !this.isDataDirty()){
				return this.performZoom(dim, offsets);
			}
			var t = this.getSeriesStats();
			this.resetEvents();
			this.dirty = this.isDirty();
			if(this.dirty){
				arr.forEach(this.series, purgeGroup);
				this._eventSeries = {};
				this.cleanGroup();
				var s = this.group;
				df.forEachRev(this.series, function(item){ item.cleanGroup(s); });
			}
			var t = this.chart.theme, f, gap, width,
				ht = this._hScaler.scaler.getTransformerFromModel(this._hScaler),
				vt = this._vScaler.scaler.getTransformerFromModel(this._vScaler),
				baseline = Math.max(0, this._vScaler.bounds.lower),
				baselineHeight = vt(baseline),
				min = Math.max(0, Math.floor(this._hScaler.bounds.from - 1)), max = Math.ceil(this._hScaler.bounds.to),
				events = this.events();
			f = dc.calculateBarSize(this._hScaler.bounds.scale, this.opt);
			gap = f.gap;
			width = f.size;
			for(var i = this.series.length - 1; i >= 0; --i){
				var run = this.series[i];
				if(!this.dirty && !run.dirty){
					t.skip();
					this._reconnectEvents(run.name);
					continue;
				}
				run.cleanGroup();
				if(this.opt.enableCache){
					run._rectFreePool = (run._rectFreePool?run._rectFreePool:[]).concat(run._rectUsePool?run._rectUsePool:[]);
					run._rectUsePool = [];
				}
				var theme = t.next("column", [this.opt, run]), s = run.group,
					eventSeries = new Array(run.data.length);
				var l = Math.min(run.data.length, max);
				for(var j = min; j < l; ++j){
					var value = run.data[j];
					if(value !== null){
						var v = typeof value == "number" ? value : value.y,
							vv = vt(v),
							height = vv - baselineHeight,
							h = Math.abs(height),
							finalTheme = typeof value != "number" ?
								t.addMixin(theme, "column", value, true) :
								t.post(theme, "column");
						if(width >= 1 && h >= 0){
							var rect = {
								x: offsets.l + ht(j + 0.5) + gap,
								y: dim.height - offsets.b - (v > baseline ? vv : baselineHeight),
								width: width, height: h
							};
							var specialFill = this._plotFill(finalTheme.series.fill, dim, offsets);
							specialFill = this._shapeFill(specialFill, rect);
							var shape = this.createRect(run, s, rect).setFill(specialFill).setStroke(finalTheme.series.stroke);
							run.dyn.fill   = shape.getFill();
							run.dyn.stroke = shape.getStroke();
							if(events){
								var o = {
									element: "column",
									index:   j,
									run:     run,
									shape:   shape,
									x:       j + 0.5,
									y:       v
								};
								this._connectEvents(o);
								eventSeries[j] = o;
							}
							if(this.animate){
								this._animateColumn(shape, dim.height - offsets.b - baselineHeight, h);
							}
						}
					}
				}
				this._eventSeries[run.name] = eventSeries;
				run.dirty = false;
			}
			this.dirty = false;
			return this;	//	dojox.charting.plot2d.Columns
		},
		_animateColumn: function(shape, voffset, vsize){
			fx.animateTransform(lang.delegate({
				shape: shape,
				duration: 1200,
				transform: [
					{name: "translate", start: [0, voffset - (voffset/vsize)], end: [0, 0]},
					{name: "scale", start: [1, 1/vsize], end: [1, 1]},
					{name: "original"}
				]
			}, this.animate)).play();
		}
	});
});

},
'dojox/lang/functional':function(){
define("dojox/lang/functional", ["./functional/lambda", "./functional/array", "./functional/object"], function(df){
	return df;
});

},
'dojox/charting/plot2d/StackedBars':function(){
define("dojox/charting/plot2d/StackedBars", ["dojo/_base/lang", "dojo/_base/array", "dojo/_base/declare", "./Bars", "./common", 
	"dojox/lang/functional", "dojox/lang/functional/reversed", "dojox/lang/functional/sequence"], 
	function(lang, arr, declare, Bars, dc, df, dfr, dfs){

	var	purgeGroup = dfr.lambda("item.purgeGroup()");
/*=====
var bars = dojox.charting.plot2d.Bars;
=====*/
	return declare("dojox.charting.plot2d.StackedBars", Bars, {
		//	summary:
		//		The plot object representing a stacked bar chart (horizontal bars).
		getSeriesStats: function(){
			//	summary:
			//		Calculate the min/max on all attached series in both directions.
			//	returns: Object
			//		{hmin, hmax, vmin, vmax} min/max in both directions.
			var stats = dc.collectStackedStats(this.series), t;
			this._maxRunLength = stats.hmax;
			stats.hmin -= 0.5;
			stats.hmax += 0.5;
			t = stats.hmin, stats.hmin = stats.vmin, stats.vmin = t;
			t = stats.hmax, stats.hmax = stats.vmax, stats.vmax = t;
			return stats;
		},
		render: function(dim, offsets){
			//	summary:
			//		Run the calculations for any axes for this plot.
			//	dim: Object
			//		An object in the form of { width, height }
			//	offsets: Object
			//		An object of the form { l, r, t, b}.
			//	returns: dojox.charting.plot2d.StackedBars
			//		A reference to this plot for functional chaining.
			if(this._maxRunLength <= 0){
				return this;
			}

			// stack all values
			var acc = df.repeat(this._maxRunLength, "-> 0", 0);
			for(var i = 0; i < this.series.length; ++i){
				var run = this.series[i];
				for(var j = 0; j < run.data.length; ++j){
					var value = run.data[j];
					if(value !== null){
						var v = typeof value == "number" ? value : value.y;
						if(isNaN(v)){ v = 0; }
						acc[j] += v;
					}
				}
			}
			// draw runs in backwards
			if(this.zoom && !this.isDataDirty()){
				return this.performZoom(dim, offsets);
			}
			this.resetEvents();
			this.dirty = this.isDirty();
			if(this.dirty){
				arr.forEach(this.series, purgeGroup);
				this._eventSeries = {};
				this.cleanGroup();
				var s = this.group;
				df.forEachRev(this.series, function(item){ item.cleanGroup(s); });
			}
			var t = this.chart.theme, f, gap, height,
				ht = this._hScaler.scaler.getTransformerFromModel(this._hScaler),
				vt = this._vScaler.scaler.getTransformerFromModel(this._vScaler),
				events = this.events();
			f = dc.calculateBarSize(this._vScaler.bounds.scale, this.opt);
			gap = f.gap;
			height = f.size;
			for(var i = this.series.length - 1; i >= 0; --i){
				var run = this.series[i];
				if(!this.dirty && !run.dirty){
					t.skip();
					this._reconnectEvents(run.name);
					continue;
				}
				run.cleanGroup();
				var theme = t.next("bar", [this.opt, run]), s = run.group,
					eventSeries = new Array(acc.length);
				for(var j = 0; j < acc.length; ++j){
					var value = run.data[j];
					if(value !== null){
						var v = acc[j],
							width = ht(v),
							finalTheme = typeof value != "number" ?
								t.addMixin(theme, "bar", value, true) :
								t.post(theme, "bar");
						if(width >= 0 && height >= 1){
							var rect = {
								x: offsets.l,
								y: dim.height - offsets.b - vt(j + 1.5) + gap,
								width: width, height: height
							};
							var specialFill = this._plotFill(finalTheme.series.fill, dim, offsets);
							specialFill = this._shapeFill(specialFill, rect);
							var shape = s.createRect(rect).setFill(specialFill).setStroke(finalTheme.series.stroke);
							run.dyn.fill   = shape.getFill();
							run.dyn.stroke = shape.getStroke();
							if(events){
								var o = {
									element: "bar",
									index:   j,
									run:     run,
									shape:   shape,
									x:       v,
									y:       j + 1.5
								};
								this._connectEvents(o);
								eventSeries[j] = o;
							}
							if(this.animate){
								this._animateBar(shape, offsets.l, -width);
							}
						}
					}
				}
				this._eventSeries[run.name] = eventSeries;
				run.dirty = false;
				// update the accumulator
				for(var j = 0; j < run.data.length; ++j){
					var value = run.data[j];
					if(value !== null){
						var v = typeof value == "number" ? value : value.y;
						if(isNaN(v)){ v = 0; }
						acc[j] -= v;
					}
				}
			}
			this.dirty = false;
			return this;	//	dojox.charting.plot2d.StackedBars
		}
	});
});

},
'dijit/Tooltip':function(){
require({cache:{
'url:dijit/templates/Tooltip.html':"<div class=\"dijitTooltip dijitTooltipLeft\" id=\"dojoTooltip\"\r\n\t><div class=\"dijitTooltipContainer dijitTooltipContents\" data-dojo-attach-point=\"containerNode\" role='alert'></div\r\n\t><div class=\"dijitTooltipConnector\" data-dojo-attach-point=\"connectorNode\"></div\r\n></div>\r\n"}});
define("dijit/Tooltip", [
	"dojo/_base/array", // array.forEach array.indexOf array.map
	"dojo/_base/declare", // declare
	"dojo/_base/fx", // fx.fadeIn fx.fadeOut
	"dojo/dom", // dom.byId
	"dojo/dom-class", // domClass.add
	"dojo/dom-geometry", // domGeometry.getMarginBox domGeometry.position
	"dojo/dom-style", // domStyle.set, domStyle.get
	"dojo/_base/lang", // lang.hitch lang.isArrayLike
	"dojo/_base/sniff", // has("ie")
	"dojo/_base/window", // win.body
	"./_base/manager",	// manager.defaultDuration
	"./place",
	"./_Widget",
	"./_TemplatedMixin",
	"./BackgroundIframe",
	"dojo/text!./templates/Tooltip.html",
	"."		// sets dijit.showTooltip etc. for back-compat
], function(array, declare, fx, dom, domClass, domGeometry, domStyle, lang, has, win,
			manager, place, _Widget, _TemplatedMixin, BackgroundIframe, template, dijit){

/*=====
	var _Widget = dijit._Widget;
	var BackgroundIframe = dijit.BackgroundIframe;
	var _TemplatedMixin = dijit._TemplatedMixin;
=====*/

	// module:
	//		dijit/Tooltip
	// summary:
	//		Defines dijit.Tooltip widget (to display a tooltip), showTooltip()/hideTooltip(), and _MasterTooltip


	var MasterTooltip = declare("dijit._MasterTooltip", [_Widget, _TemplatedMixin], {
		// summary:
		//		Internal widget that holds the actual tooltip markup,
		//		which occurs once per page.
		//		Called by Tooltip widgets which are just containers to hold
		//		the markup
		// tags:
		//		protected

		// duration: Integer
		//		Milliseconds to fade in/fade out
		duration: manager.defaultDuration,

		templateString: template,

		postCreate: function(){
			win.body().appendChild(this.domNode);

			this.bgIframe = new BackgroundIframe(this.domNode);

			// Setup fade-in and fade-out functions.
			this.fadeIn = fx.fadeIn({ node: this.domNode, duration: this.duration, onEnd: lang.hitch(this, "_onShow") });
			this.fadeOut = fx.fadeOut({ node: this.domNode, duration: this.duration, onEnd: lang.hitch(this, "_onHide") });
		},

		show: function(innerHTML, aroundNode, position, rtl, textDir){
			// summary:
			//		Display tooltip w/specified contents to right of specified node
			//		(To left if there's no space on the right, or if rtl == true)
			// innerHTML: String
			//		Contents of the tooltip
			// aroundNode: DomNode || dijit.__Rectangle
			//		Specifies that tooltip should be next to this node / area
			// position: String[]?
			//		List of positions to try to position tooltip (ex: ["right", "above"])
			// rtl: Boolean?
			//		Corresponds to `WidgetBase.dir` attribute, where false means "ltr" and true
			//		means "rtl"; specifies GUI direction, not text direction.
			// textDir: String?
			//		Corresponds to `WidgetBase.textdir` attribute; specifies direction of text.


			if(this.aroundNode && this.aroundNode === aroundNode && this.containerNode.innerHTML == innerHTML){
				return;
			}

			// reset width; it may have been set by orient() on a previous tooltip show()
			this.domNode.width = "auto";

			if(this.fadeOut.status() == "playing"){
				// previous tooltip is being hidden; wait until the hide completes then show new one
				this._onDeck=arguments;
				return;
			}
			this.containerNode.innerHTML=innerHTML;
			
			this.set("textDir", textDir);
			this.containerNode.align = rtl? "right" : "left"; //fix the text alignment

			var pos = place.around(this.domNode, aroundNode,
				position && position.length ? position : Tooltip.defaultPosition, !rtl, lang.hitch(this, "orient"));

			// Position the tooltip connector for middle alignment.
			// This could not have been done in orient() since the tooltip wasn't positioned at that time.
			var aroundNodeCoords = pos.aroundNodePos;
			if(pos.corner.charAt(0) == 'M' && pos.aroundCorner.charAt(0) == 'M'){
				this.connectorNode.style.top = aroundNodeCoords.y + ((aroundNodeCoords.h - this.connectorNode.offsetHeight) >> 1) - pos.y + "px";
				this.connectorNode.style.left = "";
			}else if(pos.corner.charAt(1) == 'M' && pos.aroundCorner.charAt(1) == 'M'){
				this.connectorNode.style.left = aroundNodeCoords.x + ((aroundNodeCoords.w - this.connectorNode.offsetWidth) >> 1) - pos.x + "px";
			}

			// show it
			domStyle.set(this.domNode, "opacity", 0);
			this.fadeIn.play();
			this.isShowingNow = true;
			this.aroundNode = aroundNode;
		},

		orient: function(/*DomNode*/ node, /*String*/ aroundCorner, /*String*/ tooltipCorner, /*Object*/ spaceAvailable, /*Object*/ aroundNodeCoords){
			// summary:
			//		Private function to set CSS for tooltip node based on which position it's in.
			//		This is called by the dijit popup code.   It will also reduce the tooltip's
			//		width to whatever width is available
			// tags:
			//		protected
			this.connectorNode.style.top = ""; //reset to default

			//Adjust the spaceAvailable width, without changing the spaceAvailable object
			var tooltipSpaceAvaliableWidth = spaceAvailable.w - this.connectorNode.offsetWidth;

			node.className = "dijitTooltip " +
				{
					"MR-ML": "dijitTooltipRight",
					"ML-MR": "dijitTooltipLeft",
					"TM-BM": "dijitTooltipAbove",
					"BM-TM": "dijitTooltipBelow",
					"BL-TL": "dijitTooltipBelow dijitTooltipABLeft",
					"TL-BL": "dijitTooltipAbove dijitTooltipABLeft",
					"BR-TR": "dijitTooltipBelow dijitTooltipABRight",
					"TR-BR": "dijitTooltipAbove dijitTooltipABRight",
					"BR-BL": "dijitTooltipRight",
					"BL-BR": "dijitTooltipLeft"
				}[aroundCorner + "-" + tooltipCorner];

			// reduce tooltip's width to the amount of width available, so that it doesn't overflow screen
			this.domNode.style.width = "auto";
			var size = domGeometry.getContentBox(this.domNode);

			var width = Math.min((Math.max(tooltipSpaceAvaliableWidth,1)), size.w);
			var widthWasReduced = width < size.w;

			this.domNode.style.width = width+"px";

			//Adjust width for tooltips that have a really long word or a nowrap setting
			if(widthWasReduced){
				this.containerNode.style.overflow = "auto"; //temp change to overflow to detect if our tooltip needs to be wider to support the content
				var scrollWidth = this.containerNode.scrollWidth;
				this.containerNode.style.overflow = "visible"; //change it back
				if(scrollWidth > width){
					scrollWidth = scrollWidth + domStyle.get(this.domNode,"paddingLeft") + domStyle.get(this.domNode,"paddingRight");
					this.domNode.style.width = scrollWidth + "px";
				}
			}

			// Reposition the tooltip connector.
			if(tooltipCorner.charAt(0) == 'B' && aroundCorner.charAt(0) == 'B'){
				var mb = domGeometry.getMarginBox(node);
				var tooltipConnectorHeight = this.connectorNode.offsetHeight;
				if(mb.h > spaceAvailable.h){
					// The tooltip starts at the top of the page and will extend past the aroundNode
					var aroundNodePlacement = spaceAvailable.h - ((aroundNodeCoords.h + tooltipConnectorHeight) >> 1);
					this.connectorNode.style.top = aroundNodePlacement + "px";
					this.connectorNode.style.bottom = "";
				}else{
					// Align center of connector with center of aroundNode, except don't let bottom
					// of connector extend below bottom of tooltip content, or top of connector
					// extend past top of tooltip content
					this.connectorNode.style.bottom = Math.min(
						Math.max(aroundNodeCoords.h/2 - tooltipConnectorHeight/2, 0),
						mb.h - tooltipConnectorHeight) + "px";
					this.connectorNode.style.top = "";
				}
			}else{
				// reset the tooltip back to the defaults
				this.connectorNode.style.top = "";
				this.connectorNode.style.bottom = "";
			}

			return Math.max(0, size.w - tooltipSpaceAvaliableWidth);
		},

		_onShow: function(){
			// summary:
			//		Called at end of fade-in operation
			// tags:
			//		protected
			if(has("ie")){
				// the arrow won't show up on a node w/an opacity filter
				this.domNode.style.filter="";
			}
		},

		hide: function(aroundNode){
			// summary:
			//		Hide the tooltip

			if(this._onDeck && this._onDeck[1] == aroundNode){
				// this hide request is for a show() that hasn't even started yet;
				// just cancel the pending show()
				this._onDeck=null;
			}else if(this.aroundNode === aroundNode){
				// this hide request is for the currently displayed tooltip
				this.fadeIn.stop();
				this.isShowingNow = false;
				this.aroundNode = null;
				this.fadeOut.play();
			}else{
				// just ignore the call, it's for a tooltip that has already been erased
			}
		},

		_onHide: function(){
			// summary:
			//		Called at end of fade-out operation
			// tags:
			//		protected

			this.domNode.style.cssText="";	// to position offscreen again
			this.containerNode.innerHTML="";
			if(this._onDeck){
				// a show request has been queued up; do it now
				this.show.apply(this, this._onDeck);
				this._onDeck=null;
			}
		},
		
		_setAutoTextDir: function(/*Object*/node){
		    // summary:
		    //	    Resolve "auto" text direction for children nodes
		    // tags:
		    //		private

            this.applyTextDir(node, has("ie") ? node.outerText : node.textContent);
            array.forEach(node.children, function(child){this._setAutoTextDir(child); }, this);
		},
		
		_setTextDirAttr: function(/*String*/ textDir){
		    // summary:
		    //		Setter for textDir.
		    // description:
		    //		Users shouldn't call this function; they should be calling
		    //		set('textDir', value)
		    // tags:
		    //		private
	
            this._set("textDir", typeof textDir != 'undefined'? textDir : "");
    	    if (textDir == "auto"){
    	        this._setAutoTextDir(this.containerNode);
    	    }else{
    	        this.containerNode.dir = this.textDir;
    	    }  		             		        
        }
	});

	dijit.showTooltip = function(innerHTML, aroundNode, position, rtl, textDir){
		// summary:
		//		Static method to display tooltip w/specified contents in specified position.
		//		See description of dijit.Tooltip.defaultPosition for details on position parameter.
		//		If position is not specified then dijit.Tooltip.defaultPosition is used.
		// innerHTML: String
		//		Contents of the tooltip
		// aroundNode: dijit.__Rectangle
		//		Specifies that tooltip should be next to this node / area
		// position: String[]?
		//		List of positions to try to position tooltip (ex: ["right", "above"])
		// rtl: Boolean?
		//		Corresponds to `WidgetBase.dir` attribute, where false means "ltr" and true
		//		means "rtl"; specifies GUI direction, not text direction.
		// textDir: String?
		//		Corresponds to `WidgetBase.textdir` attribute; specifies direction of text.

		// after/before don't work, but they used to, so for back-compat convert them to after-centered, before-centered
		if(position){
			position = array.map(position, function(val){
				return {after: "after-centered", before: "before-centered"}[val] || val;
			});
		}

		if(!Tooltip._masterTT){ dijit._masterTT = Tooltip._masterTT = new MasterTooltip(); }
		return Tooltip._masterTT.show(innerHTML, aroundNode, position, rtl, textDir);
	};

	dijit.hideTooltip = function(aroundNode){
		// summary:
		//		Static method to hide the tooltip displayed via showTooltip()
		return Tooltip._masterTT && Tooltip._masterTT.hide(aroundNode);
	};

	var Tooltip = declare("dijit.Tooltip", _Widget, {
		// summary:
		//		Pops up a tooltip (a help message) when you hover over a node.

		// label: String
		//		Text to display in the tooltip.
		//		Specified as innerHTML when creating the widget from markup.
		label: "",

		// showDelay: Integer
		//		Number of milliseconds to wait after hovering over/focusing on the object, before
		//		the tooltip is displayed.
		showDelay: 400,

		// connectId: String|String[]
		//		Id of domNode(s) to attach the tooltip to.
		//		When user hovers over specified dom node, the tooltip will appear.
		connectId: [],

		// position: String[]
		//		See description of `dijit.Tooltip.defaultPosition` for details on position parameter.
		position: [],

		_setConnectIdAttr: function(/*String|String[]*/ newId){
			// summary:
			//		Connect to specified node(s)

			// Remove connections to old nodes (if there are any)
			array.forEach(this._connections || [], function(nested){
				array.forEach(nested, lang.hitch(this, "disconnect"));
			}, this);

			// Make array of id's to connect to, excluding entries for nodes that don't exist yet, see startup()
			this._connectIds = array.filter(lang.isArrayLike(newId) ? newId : (newId ? [newId] : []),
					function(id){ return dom.byId(id); });

			// Make connections
			this._connections = array.map(this._connectIds, function(id){
				var node = dom.byId(id);
				return [
					this.connect(node, "onmouseenter", "_onHover"),
					this.connect(node, "onmouseleave", "_onUnHover"),
					this.connect(node, "onfocus", "_onHover"),
					this.connect(node, "onblur", "_onUnHover")
				];
			}, this);

			this._set("connectId", newId);
		},

		addTarget: function(/*DOMNODE || String*/ node){
			// summary:
			//		Attach tooltip to specified node if it's not already connected

			// TODO: remove in 2.0 and just use set("connectId", ...) interface

			var id = node.id || node;
			if(array.indexOf(this._connectIds, id) == -1){
				this.set("connectId", this._connectIds.concat(id));
			}
		},

		removeTarget: function(/*DomNode || String*/ node){
			// summary:
			//		Detach tooltip from specified node

			// TODO: remove in 2.0 and just use set("connectId", ...) interface

			var id = node.id || node,	// map from DOMNode back to plain id string
				idx = array.indexOf(this._connectIds, id);
			if(idx >= 0){
				// remove id (modifies original this._connectIds but that's OK in this case)
				this._connectIds.splice(idx, 1);
				this.set("connectId", this._connectIds);
			}
		},

		buildRendering: function(){
			this.inherited(arguments);
			domClass.add(this.domNode,"dijitTooltipData");
		},

		startup: function(){
			this.inherited(arguments);

			// If this tooltip was created in a template, or for some other reason the specified connectId[s]
			// didn't exist during the widget's initialization, then connect now.
			var ids = this.connectId;
			array.forEach(lang.isArrayLike(ids) ? ids : [ids], this.addTarget, this);
		},

		_onHover: function(/*Event*/ e){
			// summary:
			//		Despite the name of this method, it actually handles both hover and focus
			//		events on the target node, setting a timer to show the tooltip.
			// tags:
			//		private
			if(!this._showTimer){
				var target = e.target;
				this._showTimer = setTimeout(lang.hitch(this, function(){this.open(target)}), this.showDelay);
			}
		},

		_onUnHover: function(/*Event*/ /*===== e =====*/){
			// summary:
			//		Despite the name of this method, it actually handles both mouseleave and blur
			//		events on the target node, hiding the tooltip.
			// tags:
			//		private

			// keep a tooltip open if the associated element still has focus (even though the
			// mouse moved away)
			if(this._focus){ return; }

			if(this._showTimer){
				clearTimeout(this._showTimer);
				delete this._showTimer;
			}
			this.close();
		},

		open: function(/*DomNode*/ target){
 			// summary:
			//		Display the tooltip; usually not called directly.
			// tags:
			//		private

			if(this._showTimer){
				clearTimeout(this._showTimer);
				delete this._showTimer;
			}
			Tooltip.show(this.label || this.domNode.innerHTML, target, this.position, !this.isLeftToRight(), this.textDir);

			this._connectNode = target;
			this.onShow(target, this.position);
		},

		close: function(){
			// summary:
			//		Hide the tooltip or cancel timer for show of tooltip
			// tags:
			//		private

			if(this._connectNode){
				// if tooltip is currently shown
				Tooltip.hide(this._connectNode);
				delete this._connectNode;
				this.onHide();
			}
			if(this._showTimer){
				// if tooltip is scheduled to be shown (after a brief delay)
				clearTimeout(this._showTimer);
				delete this._showTimer;
			}
		},

		onShow: function(/*===== target, position =====*/){
			// summary:
			//		Called when the tooltip is shown
			// tags:
			//		callback
		},

		onHide: function(){
			// summary:
			//		Called when the tooltip is hidden
			// tags:
			//		callback
		},

		uninitialize: function(){
			this.close();
			this.inherited(arguments);
		}
	});

	Tooltip._MasterTooltip = MasterTooltip;		// for monkey patching
	Tooltip.show = dijit.showTooltip;		// export function through module return value
	Tooltip.hide = dijit.hideTooltip;		// export function through module return value

	// dijit.Tooltip.defaultPosition: String[]
	//		This variable controls the position of tooltips, if the position is not specified to
	//		the Tooltip widget or *TextBox widget itself.  It's an array of strings with the values
	//		possible for `dijit/place::around()`.   The recommended values are:
	//
	//			* before-centered: centers tooltip to the left of the anchor node/widget, or to the right
	//				 in the case of RTL scripts like Hebrew and Arabic
	//			* after-centered: centers tooltip to the right of the anchor node/widget, or to the left
	//				 in the case of RTL scripts like Hebrew and Arabic
	//			* above-centered: tooltip is centered above anchor node
	//			* below-centered: tooltip is centered above anchor node
	//
	//		The list is positions is tried, in order, until a position is found where the tooltip fits
	//		within the viewport.
	//
	//		Be careful setting this parameter.  A value of "above-centered" may work fine until the user scrolls
	//		the screen so that there's no room above the target node.   Nodes with drop downs, like
	//		DropDownButton or FilteringSelect, are especially problematic, in that you need to be sure
	//		that the drop down and tooltip don't overlap, even when the viewport is scrolled so that there
	//		is only room below (or above) the target node, but not both.
	Tooltip.defaultPosition = ["after-centered", "before-centered"];


	return Tooltip;
});

},
'dojox/charting/action2d/Base':function(){
define("dojox/charting/action2d/Base", ["dojo/_base/lang", "dojo/_base/declare"], 
	function(lang, declare){

	return declare("dojox.charting.action2d.Base", null, {
		//	summary:
		//		Base action class for plot and chart actions.
	
		constructor: function(chart, plot){
			//	summary:
			//		Create a new base action.  This can either be a plot or a chart action.
			//	chart: dojox.charting.Chart
			//		The chart this action applies to.
			//	plot: String?|dojox.charting.plot2d.Base?
			//		Optional target plot for this action.  Default is "default".
			this.chart = chart;
			this.plot = plot ? (lang.isString(plot) ? this.chart.getPlot(plot) : plot) : this.chart.getPlot("default");
		},
	
		connect: function(){
			//	summary:
			//		Connect this action to the plot or the chart.
		},
	
		disconnect: function(){
			//	summary:
			//		Disconnect this action from the plot or the chart.
		},
		
		destroy: function(){
			//	summary:
			//		Do any cleanup needed when destroying parent elements.
			this.disconnect();
		}
	});

});

},
'dojox/charting/plot2d/Stacked':function(){
define("dojox/charting/plot2d/Stacked", ["dojo/_base/lang", "dojo/_base/declare", "dojo/_base/array", "./Default", "./common", 
	"dojox/lang/functional", "dojox/lang/functional/reversed", "dojox/lang/functional/sequence"], 
	function(lang, declare, arr, Default, dc, df, dfr, dfs){
/*=====
var Default = dojox.charting.plot2d.Default;
=====*/
	var purgeGroup = dfr.lambda("item.purgeGroup()");

	return declare("dojox.charting.plot2d.Stacked", Default, {
		//	summary:
		//		Like the default plot, Stacked sets up lines, areas and markers
		//		in a stacked fashion (values on the y axis added to each other)
		//		as opposed to a direct one.
		getSeriesStats: function(){
			//	summary:
			//		Calculate the min/max on all attached series in both directions.
			//	returns: Object
			//		{hmin, hmax, vmin, vmax} min/max in both directions.
			var stats = dc.collectStackedStats(this.series);
			this._maxRunLength = stats.hmax;
			return stats;
		},
		render: function(dim, offsets){
			//	summary:
			//		Run the calculations for any axes for this plot.
			//	dim: Object
			//		An object in the form of { width, height }
			//	offsets: Object
			//		An object of the form { l, r, t, b}.
			//	returns: dojox.charting.plot2d.Stacked
			//		A reference to this plot for functional chaining.
			if(this._maxRunLength <= 0){
				return this;
			}

			// stack all values
			var acc = df.repeat(this._maxRunLength, "-> 0", 0);
			for(var i = 0; i < this.series.length; ++i){
				var run = this.series[i];
				for(var j = 0; j < run.data.length; ++j){
					var v = run.data[j];
					if(v !== null){
						if(isNaN(v)){ v = 0; }
						acc[j] += v;
					}
				}
			}
			// draw runs in backwards
			if(this.zoom && !this.isDataDirty()){
				return this.performZoom(dim, offsets);
			}
			this.resetEvents();
			this.dirty = this.isDirty();
			if(this.dirty){
				arr.forEach(this.series, purgeGroup);
				this._eventSeries = {};
				this.cleanGroup();
				var s = this.group;
				df.forEachRev(this.series, function(item){ item.cleanGroup(s); });
			}

			var t = this.chart.theme, events = this.events(),
				ht = this._hScaler.scaler.getTransformerFromModel(this._hScaler),
				vt = this._vScaler.scaler.getTransformerFromModel(this._vScaler);

			for(var i = this.series.length - 1; i >= 0; --i){
				var run = this.series[i];
				if(!this.dirty && !run.dirty){
					t.skip();
					this._reconnectEvents(run.name);
					continue;
				}
				run.cleanGroup();
				var theme = t.next(this.opt.areas ? "area" : "line", [this.opt, run], true),
					s = run.group, outline,
					lpoly = arr.map(acc, function(v, i){
						return {
							x: ht(i + 1) + offsets.l,
							y: dim.height - offsets.b - vt(v)
						};
					}, this);

				var lpath = this.opt.tension ? dc.curve(lpoly, this.opt.tension) : "";

				if(this.opt.areas){
					var apoly = lang.clone(lpoly);
					if(this.opt.tension){
						var p=dc.curve(apoly, this.opt.tension);
						p += " L" + lpoly[lpoly.length - 1].x + "," + (dim.height - offsets.b) +
							" L" + lpoly[0].x + "," + (dim.height - offsets.b) +
							" L" + lpoly[0].x + "," + lpoly[0].y;
						run.dyn.fill = s.createPath(p).setFill(theme.series.fill).getFill();
					} else {
						apoly.push({x: lpoly[lpoly.length - 1].x, y: dim.height - offsets.b});
						apoly.push({x: lpoly[0].x, y: dim.height - offsets.b});
						apoly.push(lpoly[0]);
						run.dyn.fill = s.createPolyline(apoly).setFill(theme.series.fill).getFill();
					}
				}
				if(this.opt.lines || this.opt.markers){
					if(theme.series.outline){
						outline = dc.makeStroke(theme.series.outline);
						outline.width = 2 * outline.width + theme.series.stroke.width;
					}
				}
				if(this.opt.markers){
					run.dyn.marker = theme.symbol;
				}
				var frontMarkers, outlineMarkers, shadowMarkers;
				if(theme.series.shadow && theme.series.stroke){
					var shadow = theme.series.shadow,
						spoly = arr.map(lpoly, function(c){
							return {x: c.x + shadow.dx, y: c.y + shadow.dy};
						});
					if(this.opt.lines){
						if(this.opt.tension){
							run.dyn.shadow = s.createPath(dc.curve(spoly, this.opt.tension)).setStroke(shadow).getStroke();
						} else {
							run.dyn.shadow = s.createPolyline(spoly).setStroke(shadow).getStroke();
						}
					}
					if(this.opt.markers){
						shadow = theme.marker.shadow;
						shadowMarkers = arr.map(spoly, function(c){
							return s.createPath("M" + c.x + " " + c.y + " " + theme.symbol).
								setStroke(shadow).setFill(shadow.color);
						}, this);
					}
				}
				if(this.opt.lines){
					if(outline){
						if(this.opt.tension){
							run.dyn.outline = s.createPath(lpath).setStroke(outline).getStroke();
						} else {
							run.dyn.outline = s.createPolyline(lpoly).setStroke(outline).getStroke();
						}
					}
					if(this.opt.tension){
						run.dyn.stroke = s.createPath(lpath).setStroke(theme.series.stroke).getStroke();
					} else {
						run.dyn.stroke = s.createPolyline(lpoly).setStroke(theme.series.stroke).getStroke();
					}
				}
				if(this.opt.markers){
					frontMarkers = new Array(lpoly.length);
					outlineMarkers = new Array(lpoly.length);
					outline = null;
					if(theme.marker.outline){
						outline = dc.makeStroke(theme.marker.outline);
						outline.width = 2 * outline.width + (theme.marker.stroke ? theme.marker.stroke.width : 0);
					}
					arr.forEach(lpoly, function(c, i){
						var path = "M" + c.x + " " + c.y + " " + theme.symbol;
						if(outline){
							outlineMarkers[i] = s.createPath(path).setStroke(outline);
						}
						frontMarkers[i] = s.createPath(path).setStroke(theme.marker.stroke).setFill(theme.marker.fill);
					}, this);
					if(events){
						var eventSeries = new Array(frontMarkers.length);
						arr.forEach(frontMarkers, function(s, i){
							var o = {
								element: "marker",
								index:   i,
								run:     run,
								shape:   s,
								outline: outlineMarkers[i] || null,
								shadow:  shadowMarkers && shadowMarkers[i] || null,
								cx:      lpoly[i].x,
								cy:      lpoly[i].y,
								x:       i + 1,
								y:       run.data[i]
							};
							this._connectEvents(o);
							eventSeries[i] = o;
						}, this);
						this._eventSeries[run.name] = eventSeries;
					}else{
						delete this._eventSeries[run.name];
					}
				}
				run.dirty = false;
				// update the accumulator
				for(var j = 0; j < run.data.length; ++j){
					var v = run.data[j];
					if(v !== null){
						if(isNaN(v)){ v = 0; }
						acc[j] -= v;
					}
				}
			}
			this.dirty = false;
			return this;	//	dojox.charting.plot2d.Stacked
		}
	});
});

},
'dojox/charting/plot2d/Pie':function(){
define("dojox/charting/plot2d/Pie", ["dojo/_base/lang", "dojo/_base/array" ,"dojo/_base/declare", 
		"../Element", "./_PlotEvents", "./common", "../axis2d/common", 
		"dojox/gfx", "dojox/gfx/matrix", "dojox/lang/functional", "dojox/lang/utils"],
	function(lang, arr, declare, Element, PlotEvents, dc, da, g, m, df, du){

	/*=====
	var Element = dojox.charting.Element;
	var PlotEvents = dojox.charting.plot2d._PlotEvents;
	dojo.declare("dojox.charting.plot2d.__PieCtorArgs", dojox.charting.plot2d.__DefaultCtorArgs, {
		//	summary:
		//		Specialized keyword arguments object for use in defining parameters on a Pie chart.
	
		//	labels: Boolean?
		//		Whether or not to draw labels for each pie slice.  Default is true.
		labels:			true,
	
		//	ticks: Boolean?
		//		Whether or not to draw ticks to labels within each slice. Default is false.
		ticks:			false,
	
		//	fixed: Boolean?
		//		TODO
		fixed:			true,
	
		//	precision: Number?
		//		The precision at which to sum/add data values. Default is 1.
		precision:		1,
	
		//	labelOffset: Number?
		//		The amount in pixels by which to offset labels.  Default is 20.
		labelOffset:	20,
	
		//	labelStyle: String?
		//		Options as to where to draw labels.  Values include "default", and "columns".	Default is "default".
		labelStyle:		"default",	// default/columns
	
		//	htmlLabels: Boolean?
		//		Whether or not to use HTML to render slice labels. Default is true.
		htmlLabels:		true,
	
		//	radGrad: String?
		//		The type of radial gradient to use in rendering.  Default is "native".
		radGrad:        "native",
	
		//	fanSize: Number?
		//		The amount for a radial gradient.  Default is 5.
		fanSize:		5,
	
		//	startAngle: Number?
		//		Where to being rendering gradients in slices, in degrees.  Default is 0.
		startAngle:     0,
	
		//	radius: Number?
		//		The size of the radial gradient.  Default is 0.
		radius:		0
	});
	=====*/

	var FUDGE_FACTOR = 0.2; // use to overlap fans

	return declare("dojox.charting.plot2d.Pie", [Element, PlotEvents], {
		//	summary:
		//		The plot that represents a typical pie chart.
		defaultParams: {
			labels:			true,
			ticks:			false,
			fixed:			true,
			precision:		1,
			labelOffset:	20,
			labelStyle:		"default",	// default/columns
			htmlLabels:		true,		// use HTML to draw labels
			radGrad:        "native",	// or "linear", or "fan"
			fanSize:		5,			// maximum fan size in degrees
			startAngle:     0			// start angle for slices in degrees
		},
		optionalParams: {
			radius:		0,
			// theme components
			stroke:		{},
			outline:	{},
			shadow:		{},
			fill:		{},
			font:		"",
			fontColor:	"",
			labelWiring: {}
		},

		constructor: function(chart, kwArgs){
			//	summary:
			//		Create a pie plot.
			this.opt = lang.clone(this.defaultParams);
			du.updateWithObject(this.opt, kwArgs);
			du.updateWithPattern(this.opt, kwArgs, this.optionalParams);
			this.run = null;
			this.dyn = [];
		},
		clear: function(){
			//	summary:
			//		Clear out all of the information tied to this plot.
			//	returns: dojox.charting.plot2d.Pie
			//		A reference to this plot for functional chaining.
			this.dirty = true;
			this.dyn = [];
			this.run = null;
			return this;	//	dojox.charting.plot2d.Pie
		},
		setAxis: function(axis){
			//	summary:
			//		Dummy method, since axes are irrelevant with a Pie chart.
			//	returns: dojox.charting.plot2d.Pie
			//		The reference to this plot for functional chaining.
			return this;	//	dojox.charting.plot2d.Pie
		},
		addSeries: function(run){
			//	summary:
			//		Add a series of data to this plot.
			//	returns: dojox.charting.plot2d.Pie
			//		The reference to this plot for functional chaining.
			this.run = run;
			return this;	//	dojox.charting.plot2d.Pie
		},
		getSeriesStats: function(){
			//	summary:
			//		Returns default stats (irrelevant for this type of plot).
			//	returns: Object
			//		{hmin, hmax, vmin, vmax} min/max in both directions.
			return lang.delegate(dc.defaultStats);
		},
		initializeScalers: function(){
			//	summary:
			//		Does nothing (irrelevant for this type of plot).
			return this;
		},
		getRequiredColors: function(){
			//	summary:
			//		Return the number of colors needed to draw this plot.
			return this.run ? this.run.data.length : 0;
		},

		render: function(dim, offsets){
			//	summary:
			//		Render the plot on the chart.
			//	dim: Object
			//		An object of the form { width, height }.
			//	offsets: Object
			//		An object of the form { l, r, t, b }.
			//	returns: dojox.charting.plot2d.Pie
			//		A reference to this plot for functional chaining.
			if(!this.dirty){ return this; }
			this.resetEvents();
			this.dirty = false;
			this._eventSeries = {};
			this.cleanGroup();
			var s = this.group, t = this.chart.theme;

			if(!this.run || !this.run.data.length){
				return this;
			}

			// calculate the geometry
			var rx = (dim.width  - offsets.l - offsets.r) / 2,
				ry = (dim.height - offsets.t - offsets.b) / 2,
				r  = Math.min(rx, ry),
				taFont = "font" in this.opt ? this.opt.font : t.axis.font,
				size = taFont ? g.normalizedLength(g.splitFontString(taFont).size) : 0,
				taFontColor = "fontColor" in this.opt ? this.opt.fontColor : t.axis.fontColor,
				startAngle = m._degToRad(this.opt.startAngle),
				start = startAngle, step, filteredRun, slices, labels, shift, labelR,
				run = this.run.data,
				events = this.events();
			if(typeof run[0] == "number"){
				filteredRun = df.map(run, "x ? Math.max(x, 0) : 0");
				if(df.every(filteredRun, "<= 0")){
					return this;
				}
				slices = df.map(filteredRun, "/this", df.foldl(filteredRun, "+", 0));
				if(this.opt.labels){
					labels = arr.map(slices, function(x){
						return x > 0 ? this._getLabel(x * 100) + "%" : "";
					}, this);
				}
			}else{
				filteredRun = df.map(run, "x ? Math.max(x.y, 0) : 0");
				if(df.every(filteredRun, "<= 0")){
					return this;
				}
				slices = df.map(filteredRun, "/this", df.foldl(filteredRun, "+", 0));
				if(this.opt.labels){
					labels = arr.map(slices, function(x, i){
						if(x <= 0){ return ""; }
						var v = run[i];
						return "text" in v ? v.text : this._getLabel(x * 100) + "%";
					}, this);
				}
			}
			var themes = df.map(run, function(v, i){
				if(v === null || typeof v == "number"){
					return t.next("slice", [this.opt, this.run], true);
				}
				return t.next("slice", [this.opt, this.run, v], true);
			}, this);
			if(this.opt.labels){
				shift = df.foldl1(df.map(labels, function(label, i){
					var font = themes[i].series.font;
					return g._base._getTextBox(label, {font: font}).w;
				}, this), "Math.max(a, b)") / 2;
				if(this.opt.labelOffset < 0){
					r = Math.min(rx - 2 * shift, ry - size) + this.opt.labelOffset;
				}
				labelR = r - this.opt.labelOffset;
			}
			if("radius" in this.opt){
				r = this.opt.radius;
				labelR = r - this.opt.labelOffset;
			}
			var	circle = {
					cx: offsets.l + rx,
					cy: offsets.t + ry,
					r:  r
				};

			this.dyn = [];
			// draw slices
			var eventSeries = new Array(slices.length);
			arr.some(slices, function(slice, i){
				if(slice < 0){
					// degenerated slice
					return false;	// continue
				}
				if(slice == 0){
				  this.dyn.push({fill: null, stroke: null});
				  return false;
				}
				var v = run[i], theme = themes[i], specialFill;
				if(slice >= 1){
					// whole pie
					specialFill = this._plotFill(theme.series.fill, dim, offsets);
					specialFill = this._shapeFill(specialFill,
						{
							x: circle.cx - circle.r, y: circle.cy - circle.r,
							width: 2 * circle.r, height: 2 * circle.r
						});
					specialFill = this._pseudoRadialFill(specialFill, {x: circle.cx, y: circle.cy}, circle.r);
					var shape = s.createCircle(circle).setFill(specialFill).setStroke(theme.series.stroke);
					this.dyn.push({fill: specialFill, stroke: theme.series.stroke});

					if(events){
						var o = {
							element: "slice",
							index:   i,
							run:     this.run,
							shape:   shape,
							x:       i,
							y:       typeof v == "number" ? v : v.y,
							cx:      circle.cx,
							cy:      circle.cy,
							cr:      r
						};
						this._connectEvents(o);
						eventSeries[i] = o;
					}

					return true;	// stop iteration
				}
				// calculate the geometry of the slice
				var end = start + slice * 2 * Math.PI;
				if(i + 1 == slices.length){
					end = startAngle + 2 * Math.PI;
				}
				var	step = end - start,
					x1 = circle.cx + r * Math.cos(start),
					y1 = circle.cy + r * Math.sin(start),
					x2 = circle.cx + r * Math.cos(end),
					y2 = circle.cy + r * Math.sin(end);
				// draw the slice
				var fanSize = m._degToRad(this.opt.fanSize);
				if(theme.series.fill && theme.series.fill.type === "radial" && this.opt.radGrad === "fan" && step > fanSize){
					var group = s.createGroup(), nfans = Math.ceil(step / fanSize), delta = step / nfans;
					specialFill = this._shapeFill(theme.series.fill,
						{x: circle.cx - circle.r, y: circle.cy - circle.r, width: 2 * circle.r, height: 2 * circle.r});
					for(var j = 0; j < nfans; ++j){
						var fansx = j == 0 ? x1 : circle.cx + r * Math.cos(start + (j - FUDGE_FACTOR) * delta),
							fansy = j == 0 ? y1 : circle.cy + r * Math.sin(start + (j - FUDGE_FACTOR) * delta),
							fanex = j == nfans - 1 ? x2 : circle.cx + r * Math.cos(start + (j + 1 + FUDGE_FACTOR) * delta),
							faney = j == nfans - 1 ? y2 : circle.cy + r * Math.sin(start + (j + 1 + FUDGE_FACTOR) * delta),
							fan = group.createPath().
								moveTo(circle.cx, circle.cy).
								lineTo(fansx, fansy).
								arcTo(r, r, 0, delta > Math.PI, true, fanex, faney).
								lineTo(circle.cx, circle.cy).
								closePath().
								setFill(this._pseudoRadialFill(specialFill, {x: circle.cx, y: circle.cy}, r, start + (j + 0.5) * delta, start + (j + 0.5) * delta));
					}
					group.createPath().
						moveTo(circle.cx, circle.cy).
						lineTo(x1, y1).
						arcTo(r, r, 0, step > Math.PI, true, x2, y2).
						lineTo(circle.cx, circle.cy).
						closePath().
						setStroke(theme.series.stroke);
					shape = group;
				}else{
					shape = s.createPath().
						moveTo(circle.cx, circle.cy).
						lineTo(x1, y1).
						arcTo(r, r, 0, step > Math.PI, true, x2, y2).
						lineTo(circle.cx, circle.cy).
						closePath().
						setStroke(theme.series.stroke);
					var specialFill = theme.series.fill;
					if(specialFill && specialFill.type === "radial"){
						specialFill = this._shapeFill(specialFill, {x: circle.cx - circle.r, y: circle.cy - circle.r, width: 2 * circle.r, height: 2 * circle.r});
						if(this.opt.radGrad === "linear"){
							specialFill = this._pseudoRadialFill(specialFill, {x: circle.cx, y: circle.cy}, r, start, end);
						}
					}else if(specialFill && specialFill.type === "linear"){
						specialFill = this._plotFill(specialFill, dim, offsets);
						specialFill = this._shapeFill(specialFill, shape.getBoundingBox());
					}
					shape.setFill(specialFill);
				}
				this.dyn.push({fill: specialFill, stroke: theme.series.stroke});

				if(events){
					var o = {
						element: "slice",
						index:   i,
						run:     this.run,
						shape:   shape,
						x:       i,
						y:       typeof v == "number" ? v : v.y,
						cx:      circle.cx,
						cy:      circle.cy,
						cr:      r
					};
					this._connectEvents(o);
					eventSeries[i] = o;
				}

				start = end;

				return false;	// continue
			}, this);
			// draw labels
			if(this.opt.labels){
				if(this.opt.labelStyle == "default"){
					start = startAngle;
					arr.some(slices, function(slice, i){
						if(slice <= 0){
							// degenerated slice
							return false;	// continue
						}
						var theme = themes[i];
						if(slice >= 1){
							// whole pie
							var v = run[i], elem = da.createText[this.opt.htmlLabels && g.renderer != "vml" ? "html" : "gfx"](
									this.chart, s, circle.cx, circle.cy + size / 2, "middle", labels[i],
									theme.series.font, theme.series.fontColor);
							if(this.opt.htmlLabels){
								this.htmlElements.push(elem);
							}
							return true;	// stop iteration
						}
						// calculate the geometry of the slice
						var end = start + slice * 2 * Math.PI, v = run[i];
						if(i + 1 == slices.length){
							end = startAngle + 2 * Math.PI;
						}
						var	labelAngle = (start + end) / 2,
							x = circle.cx + labelR * Math.cos(labelAngle),
							y = circle.cy + labelR * Math.sin(labelAngle) + size / 2;
						// draw the label
						var elem = da.createText[this.opt.htmlLabels && g.renderer != "vml" ? "html" : "gfx"]
								(this.chart, s, x, y, "middle", labels[i], theme.series.font, theme.series.fontColor);
						if(this.opt.htmlLabels){
							this.htmlElements.push(elem);
						}
						start = end;
						return false;	// continue
					}, this);
				}else if(this.opt.labelStyle == "columns"){
					start = startAngle;
					//calculate label angles
					var labeledSlices = [];
					arr.forEach(slices, function(slice, i){
						var end = start + slice * 2 * Math.PI;
						if(i + 1 == slices.length){
							end = startAngle + 2 * Math.PI;
						}
						var labelAngle = (start + end) / 2;
						labeledSlices.push({
							angle: labelAngle,
							left: Math.cos(labelAngle) < 0,
							theme: themes[i],
							index: i,
							omit: end - start < 0.001
						});
						start = end;
					});
					//calculate label radius to each slice
					var labelHeight = g._base._getTextBox("a",{font:taFont}).h;
					this._getProperLabelRadius(labeledSlices, labelHeight, circle.r * 1.1);
					//draw label and wiring
					arr.forEach(labeledSlices, function(slice, i){
						if (!slice.omit) {
							var leftColumn = circle.cx - circle.r * 2,
								rightColumn = circle.cx + circle.r * 2,
								labelWidth = g._base._getTextBox(labels[i], {font: taFont}).w,
								x = circle.cx + slice.labelR * Math.cos(slice.angle),
								y = circle.cy + slice.labelR * Math.sin(slice.angle),
								jointX = (slice.left) ? (leftColumn + labelWidth) : (rightColumn - labelWidth),
								labelX = (slice.left) ? leftColumn : jointX;
							var wiring = s.createPath().moveTo(circle.cx + circle.r * Math.cos(slice.angle), circle.cy + circle.r * Math.sin(slice.angle))
							if (Math.abs(slice.labelR * Math.cos(slice.angle)) < circle.r * 2 - labelWidth) {
								wiring.lineTo(x, y);
							}
							wiring.lineTo(jointX, y).setStroke(slice.theme.series.labelWiring);
							var elem = da.createText[this.opt.htmlLabels && g.renderer != "vml" ? "html" : "gfx"](
								this.chart, s, labelX, y, "left", labels[i], slice.theme.series.font, slice.theme.series.fontColor);
							if (this.opt.htmlLabels) {
								this.htmlElements.push(elem);
							}
						}
					},this);
				}
			}
			// post-process events to restore the original indexing
			var esi = 0;
			this._eventSeries[this.run.name] = df.map(run, function(v){
				return v <= 0 ? null : eventSeries[esi++];
			});
			return this;	//	dojox.charting.plot2d.Pie
		},
		
		_getProperLabelRadius: function(slices, labelHeight, minRidius){
			var leftCenterSlice = {},rightCenterSlice = {},leftMinSIN = 1, rightMinSIN = 1;
			if (slices.length == 1) {
				slices[0].labelR = minRidius;
				return;
			}
			for(var i = 0;i<slices.length;i++){
				var tempSIN = Math.abs(Math.sin(slices[i].angle));
				if(slices[i].left){
					if(leftMinSIN >= tempSIN){
						leftMinSIN = tempSIN;
						leftCenterSlice = slices[i];
					}
				}else{
					if(rightMinSIN >= tempSIN){
						rightMinSIN = tempSIN;
						rightCenterSlice = slices[i];
					}
				}
			}
			leftCenterSlice.labelR = rightCenterSlice.labelR = minRidius;
			this._calculateLabelR(leftCenterSlice,slices,labelHeight);
			this._calculateLabelR(rightCenterSlice,slices,labelHeight);
		},
		_calculateLabelR: function(firstSlice,slices,labelHeight){
			var i = firstSlice.index,length = slices.length,
				currentLabelR = firstSlice.labelR;
			while(!(slices[i%length].left ^ slices[(i+1)%length].left)){
				if (!slices[(i + 1) % length].omit) {
					var nextLabelR = (Math.sin(slices[i % length].angle) * currentLabelR + ((slices[i % length].left) ? (-labelHeight) : labelHeight)) /
					Math.sin(slices[(i + 1) % length].angle);
					currentLabelR = (nextLabelR < firstSlice.labelR) ? firstSlice.labelR : nextLabelR;
					slices[(i + 1) % length].labelR = currentLabelR;
				}
				i++;
			}
			i = firstSlice.index;
			var j = (i == 0)?length-1 : i - 1;
			while(!(slices[i].left ^ slices[j].left)){
				if (!slices[j].omit) {
					var nextLabelR = (Math.sin(slices[i].angle) * currentLabelR + ((slices[i].left) ? labelHeight : (-labelHeight))) /
					Math.sin(slices[j].angle);
					currentLabelR = (nextLabelR < firstSlice.labelR) ? firstSlice.labelR : nextLabelR;
					slices[j].labelR = currentLabelR;
				}
				i--;j--;
				i = (i < 0)?i+slices.length:i;
				j = (j < 0)?j+slices.length:j;
			}
		},
		// utilities
		_getLabel: function(number){
			return dc.getLabel(number, this.opt.fixed, this.opt.precision);
		}
	});
});

},
'dojox/color/_base':function(){
define("dojox/color/_base", ["dojo/_base/kernel", "../main", "dojo/_base/lang", "dojo/_base/Color", "dojo/colors"], 
	function(dojo, dojox, lang, Color, colors){

var cx = lang.getObject("dojox.color", true);
/*===== cx = dojox.color =====*/
		
//	alias all the dojo.Color mechanisms
cx.Color=Color;
cx.blend=Color.blendColors;
cx.fromRgb=Color.fromRgb;
cx.fromHex=Color.fromHex;
cx.fromArray=Color.fromArray;
cx.fromString=Color.fromString;

//	alias the dojo.colors mechanisms
cx.greyscale=colors.makeGrey;

lang.mixin(cx,{
	fromCmy: function(/* Object|Array|int */cyan, /*int*/magenta, /*int*/yellow){
		//	summary
		//	Create a dojox.color.Color from a CMY defined color.
		//	All colors should be expressed as 0-100 (percentage)
	
		if(lang.isArray(cyan)){
			magenta=cyan[1], yellow=cyan[2], cyan=cyan[0];
		} else if(lang.isObject(cyan)){
			magenta=cyan.m, yellow=cyan.y, cyan=cyan.c;
		}
		cyan/=100, magenta/=100, yellow/=100;
	
		var r=1-cyan, g=1-magenta, b=1-yellow;
		return new Color({ r:Math.round(r*255), g:Math.round(g*255), b:Math.round(b*255) });	//	dojox.color.Color
	},
	
	fromCmyk: function(/* Object|Array|int */cyan, /*int*/magenta, /*int*/yellow, /*int*/black){
		//	summary
		//	Create a dojox.color.Color from a CMYK defined color.
		//	All colors should be expressed as 0-100 (percentage)
	
		if(lang.isArray(cyan)){
			magenta=cyan[1], yellow=cyan[2], black=cyan[3], cyan=cyan[0];
		} else if(lang.isObject(cyan)){
			magenta=cyan.m, yellow=cyan.y, black=cyan.b, cyan=cyan.c;
		}
		cyan/=100, magenta/=100, yellow/=100, black/=100;
		var r,g,b;
		r = 1-Math.min(1, cyan*(1-black)+black);
		g = 1-Math.min(1, magenta*(1-black)+black);
		b = 1-Math.min(1, yellow*(1-black)+black);
		return new Color({ r:Math.round(r*255), g:Math.round(g*255), b:Math.round(b*255) });	//	dojox.color.Color
	},
		
	fromHsl: function(/* Object|Array|int */hue, /* int */saturation, /* int */luminosity){
		//	summary
		//	Create a dojox.color.Color from an HSL defined color.
		//	hue from 0-359 (degrees), saturation and luminosity 0-100.
	
		if(lang.isArray(hue)){
			saturation=hue[1], luminosity=hue[2], hue=hue[0];
		} else if(lang.isObject(hue)){
			saturation=hue.s, luminosity=hue.l, hue=hue.h;
		}
		saturation/=100;
		luminosity/=100;
	
		while(hue<0){ hue+=360; }
		while(hue>=360){ hue-=360; }
		
		var r, g, b;
		if(hue<120){
			r=(120-hue)/60, g=hue/60, b=0;
		} else if (hue<240){
			r=0, g=(240-hue)/60, b=(hue-120)/60;
		} else {
			r=(hue-240)/60, g=0, b=(360-hue)/60;
		}
		
		r=2*saturation*Math.min(r, 1)+(1-saturation);
		g=2*saturation*Math.min(g, 1)+(1-saturation);
		b=2*saturation*Math.min(b, 1)+(1-saturation);
		if(luminosity<0.5){
			r*=luminosity, g*=luminosity, b*=luminosity;
		}else{
			r=(1-luminosity)*r+2*luminosity-1;
			g=(1-luminosity)*g+2*luminosity-1;
			b=(1-luminosity)*b+2*luminosity-1;
		}
		return new Color({ r:Math.round(r*255), g:Math.round(g*255), b:Math.round(b*255) });	//	dojox.color.Color
	}
});
	
cx.fromHsv = function(/* Object|Array|int */hue, /* int */saturation, /* int */value){
	//	summary
	//	Create a dojox.color.Color from an HSV defined color.
	//	hue from 0-359 (degrees), saturation and value 0-100.

	if(lang.isArray(hue)){
		saturation=hue[1], value=hue[2], hue=hue[0];
	} else if (lang.isObject(hue)){
		saturation=hue.s, value=hue.v, hue=hue.h;
	}
	
	if(hue==360){ hue=0; }
	saturation/=100;
	value/=100;
	
	var r, g, b;
	if(saturation==0){
		r=value, b=value, g=value;
	}else{
		var hTemp=hue/60, i=Math.floor(hTemp), f=hTemp-i;
		var p=value*(1-saturation);
		var q=value*(1-(saturation*f));
		var t=value*(1-(saturation*(1-f)));
		switch(i){
			case 0:{ r=value, g=t, b=p; break; }
			case 1:{ r=q, g=value, b=p; break; }
			case 2:{ r=p, g=value, b=t; break; }
			case 3:{ r=p, g=q, b=value; break; }
			case 4:{ r=t, g=p, b=value; break; }
			case 5:{ r=value, g=p, b=q; break; }
		}
	}
	return new Color({ r:Math.round(r*255), g:Math.round(g*255), b:Math.round(b*255) });	//	dojox.color.Color
};
lang.extend(Color,{
	toCmy: function(){
		//	summary
		//	Convert this Color to a CMY definition.
		var cyan=1-(this.r/255), magenta=1-(this.g/255), yellow=1-(this.b/255);
		return { c:Math.round(cyan*100), m:Math.round(magenta*100), y:Math.round(yellow*100) };		//	Object
	},
		
	toCmyk: function(){
		//	summary
		//	Convert this Color to a CMYK definition.
		var cyan, magenta, yellow, black;
		var r=this.r/255, g=this.g/255, b=this.b/255;
		black = Math.min(1-r, 1-g, 1-b);
		cyan = (1-r-black)/(1-black);
		magenta = (1-g-black)/(1-black);
		yellow = (1-b-black)/(1-black);
		return { c:Math.round(cyan*100), m:Math.round(magenta*100), y:Math.round(yellow*100), b:Math.round(black*100) };	//	Object
	},
		
	toHsl: function(){
		//	summary
		//	Convert this Color to an HSL definition.
		var r=this.r/255, g=this.g/255, b=this.b/255;
		var min = Math.min(r, b, g), max = Math.max(r, g, b);
		var delta = max-min;
		var h=0, s=0, l=(min+max)/2;
		if(l>0 && l<1){
			s = delta/((l<0.5)?(2*l):(2-2*l));
		}
		if(delta>0){
			if(max==r && max!=g){
				h+=(g-b)/delta;
			}
			if(max==g && max!=b){
				h+=(2+(b-r)/delta);
			}
			if(max==b && max!=r){
				h+=(4+(r-g)/delta);
			}
			h*=60;
		}
		return { h:h, s:Math.round(s*100), l:Math.round(l*100) };	//	Object
	},
	
	toHsv: function(){
		//	summary
		//	Convert this Color to an HSV definition.
		var r=this.r/255, g=this.g/255, b=this.b/255;
		var min = Math.min(r, b, g), max = Math.max(r, g, b);
		var delta = max-min;
		var h = null, s = (max==0)?0:(delta/max);
		if(s==0){
			h = 0;
		}else{
			if(r==max){
				h = 60*(g-b)/delta;
			}else if(g==max){
				h = 120 + 60*(b-r)/delta;
			}else{
				h = 240 + 60*(r-g)/delta;
			}
	
			if(h<0){ h+=360; }
		}
		return { h:h, s:Math.round(s*100), v:Math.round(max*100) };	//	Object
	}
});

return cx;
});

},
'dojox/charting/action2d/PlotAction':function(){
define("dojox/charting/action2d/PlotAction", ["dojo/_base/connect", "dojo/_base/declare", "./Base", "dojo/fx/easing", "dojox/lang/functional", 
		"dojox/lang/functional/object"], 
	function(hub, declare, Base, dfe, df, dlfo){
	
	/*=====
	dojox.charting.action2d.__PlotActionCtorArgs = function(duration, easing){
	 	//	summary:
		//		The base keyword arguments object for creating an action2d.
		//	duration: Number?
		//		The amount of time in milliseconds for an animation to last.  Default is 400.
		//	easing: dojo.fx.easing.*?
		//		An easing object (see dojo.fx.easing) for use in an animation.  The
		//		default is dojo.fx.easing.backOut.
		this.duration = duration;
		this.easing = easing;
	}
	var Base = dojox.charting.action2d.Base;
	=====*/

	var DEFAULT_DURATION = 400,	// ms
		DEFAULT_EASING   = dfe.backOut;

	return declare("dojox.charting.action2d.PlotAction", Base, {
		//	summary:
		//		Base action class for plot actions.

		overOutEvents: {onmouseover: 1, onmouseout: 1},

		constructor: function(chart, plot, kwargs){
			//	summary:
			//		Create a new base PlotAction.
			//	chart: dojox.charting.Chart
			//		The chart this action applies to.
			//	plot: String?
			//		The name of the plot this action belongs to.  If none is passed "default" is assumed.
			//	kwargs: dojox.charting.action2d.__PlotActionCtorArgs?
			//		Optional arguments for the action.
			this.anim = {};

			// process common optional named parameters
			if(!kwargs){ kwargs = {}; }
			this.duration = kwargs.duration ? kwargs.duration : DEFAULT_DURATION;
			this.easing   = kwargs.easing   ? kwargs.easing   : DEFAULT_EASING;
		},

		connect: function(){
			//	summary:
			//		Connect this action to the given plot.
			this.handle = this.chart.connectToPlot(this.plot.name, this, "process");
		},

		disconnect: function(){
			//	summary:
			//		Disconnect this action from the given plot, if connected.
			if(this.handle){
				hub.disconnect(this.handle);
				this.handle = null;
			}
		},

		reset: function(){
			//	summary:
			//		Reset the action.
		},

		destroy: function(){
			//	summary:
			//		Do any cleanup needed when destroying parent elements.
			this.inherited(arguments);
			df.forIn(this.anim, function(o){
				df.forIn(o, function(anim){
					anim.action.stop(true);
				});
			});
			this.anim = {};
		}
	});
});

},
'dojox/lang/functional/fold':function(){
define("dojox/lang/functional/fold", ["dojo/_base/lang", "dojo/_base/array", "dojo/_base/window", "./lambda"],
	function(lang, arr, win, df){

// This module adds high-level functions and related constructs:
//	- "fold" family of functions

// Notes:
//	- missing high-level functions are provided with the compatible API:
//		foldl, foldl1, foldr, foldr1
//	- missing JS standard functions are provided with the compatible API:
//		reduce, reduceRight
//	- the fold's counterpart: unfold

// Defined methods:
//	- take any valid lambda argument as the functional argument
//	- operate on dense arrays
//	- take a string as the array argument
//	- take an iterator objects as the array argument (only foldl, foldl1, and reduce)

	var empty = {};

/*=====
	var df = dojox.lang.functional;
 =====*/
	lang.mixin(df, {
		// classic reduce-class functions
		foldl: function(/*Array|String|Object*/ a, /*Function*/ f, /*Object*/ z, /*Object?*/ o){
			// summary: repeatedly applies a binary function to an array from left
			//	to right using a seed value as a starting point; returns the final
			//	value.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || win.global; f = df.lambda(f);
			var i, n;
			if(lang.isArray(a)){
				// array
				for(i = 0, n = a.length; i < n; z = f.call(o, z, a[i], i, a), ++i);
			}else if(typeof a.hasNext == "function" && typeof a.next == "function"){
				// iterator
				for(i = 0; a.hasNext(); z = f.call(o, z, a.next(), i++, a));
			}else{
				// object/dictionary
				for(i in a){
					if(!(i in empty)){
						z = f.call(o, z, a[i], i, a);
					}
				}
			}
			return z;	// Object
		},
		foldl1: function(/*Array|String|Object*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary: repeatedly applies a binary function to an array from left
			//	to right; returns the final value.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || win.global; f = df.lambda(f);
			var z, i, n;
			if(lang.isArray(a)){
				// array
				z = a[0];
				for(i = 1, n = a.length; i < n; z = f.call(o, z, a[i], i, a), ++i);
			}else if(typeof a.hasNext == "function" && typeof a.next == "function"){
				// iterator
				if(a.hasNext()){
					z = a.next();
					for(i = 1; a.hasNext(); z = f.call(o, z, a.next(), i++, a));
				}
			}else{
				// object/dictionary
				var first = true;
				for(i in a){
					if(!(i in empty)){
						if(first){
							z = a[i];
							first = false;
						}else{
							z = f.call(o, z, a[i], i, a);
						}
					}
				}
			}
			return z;	// Object
		},
		foldr: function(/*Array|String*/ a, /*Function|String|Array*/ f, /*Object*/ z, /*Object?*/ o){
			// summary: repeatedly applies a binary function to an array from right
			//	to left using a seed value as a starting point; returns the final
			//	value.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || win.global; f = df.lambda(f);
			for(var i = a.length; i > 0; --i, z = f.call(o, z, a[i], i, a));
			return z;	// Object
		},
		foldr1: function(/*Array|String*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary: repeatedly applies a binary function to an array from right
			//	to left; returns the final value.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || win.global; f = df.lambda(f);
			var n = a.length, z = a[n - 1], i = n - 1;
			for(; i > 0; --i, z = f.call(o, z, a[i], i, a));
			return z;	// Object
		},
		// JS 1.8 standard array functions, which can take a lambda as a parameter.
		reduce: function(/*Array|String|Object*/ a, /*Function|String|Array*/ f, /*Object?*/ z){
			// summary: apply a function simultaneously against two values of the array
			//	(from left-to-right) as to reduce it to a single value.
			return arguments.length < 3 ? df.foldl1(a, f) : df.foldl(a, f, z);	// Object
		},
		reduceRight: function(/*Array|String*/ a, /*Function|String|Array*/ f, /*Object?*/ z){
			// summary: apply a function simultaneously against two values of the array
			//	(from right-to-left) as to reduce it to a single value.
			return arguments.length < 3 ? df.foldr1(a, f) : df.foldr(a, f, z);	// Object
		},
		// the fold's counterpart: unfold
		unfold: function(/*Function|String|Array*/ pr, /*Function|String|Array*/ f,
						/*Function|String|Array*/ g, /*Object*/ z, /*Object?*/ o){
			// summary: builds an array by unfolding a value
			o = o || win.global; f = df.lambda(f); g = df.lambda(g); pr = df.lambda(pr);
			var t = [];
			for(; !pr.call(o, z); t.push(f.call(o, z)), z = g.call(o, z));
			return t;	// Array
		}
	});
});

},
'dojox/charting/plot2d/Bars':function(){
define("dojox/charting/plot2d/Bars", ["dojo/_base/kernel", "dojo/_base/lang", "dojo/_base/array", "dojo/_base/declare", "./Base", "./common", 
	"dojox/gfx/fx", "dojox/lang/utils", "dojox/lang/functional", "dojox/lang/functional/reversed"], 
	function(dojo, lang, arr, declare, Base, dc, fx, du, df, dfr){
		
	/*=====
	dojo.declare("dojox.charting.plot2d.__BarCtorArgs", dojox.charting.plot2d.__DefaultCtorArgs, {
		//	summary:
		//		Additional keyword arguments for bar charts.
	
		//	minBarSize: Number?
		//		The minimum size for a bar in pixels.  Default is 1.
		minBarSize: 1,
	
		//	maxBarSize: Number?
		//		The maximum size for a bar in pixels.  Default is 1.
		maxBarSize: 1,
		
		//	enableCache: Boolean?
		//		Whether the bars rect are cached from one rendering to another. This improves the rendering performance of
		//		successive rendering but penalize the first rendering.  Default false.
		enableCache: false
	});
	var Base = dojox.charting.plot2d.Base;
	=====*/
	var purgeGroup = dfr.lambda("item.purgeGroup()");

	return declare("dojox.charting.plot2d.Bars", Base, {
		//	summary:
		//		The plot object representing a bar chart (horizontal bars).
		defaultParams: {
			hAxis: "x",		// use a horizontal axis named "x"
			vAxis: "y",		// use a vertical axis named "y"
			gap:	0,		// gap between columns in pixels
			animate: null,   // animate bars into place
			enableCache: false
		},
		optionalParams: {
			minBarSize:	1,	// minimal bar width in pixels
			maxBarSize:	1,	// maximal bar width in pixels
			// theme component
			stroke:		{},
			outline:	{},
			shadow:		{},
			fill:		{},
			font:		"",
			fontColor:	""
		},

		constructor: function(chart, kwArgs){
			//	summary:
			//		The constructor for a bar chart.
			//	chart: dojox.charting.Chart
			//		The chart this plot belongs to.
			//	kwArgs: dojox.charting.plot2d.__BarCtorArgs?
			//		An optional keyword arguments object to help define the plot.
			this.opt = lang.clone(this.defaultParams);
			du.updateWithObject(this.opt, kwArgs);
			du.updateWithPattern(this.opt, kwArgs, this.optionalParams);
			this.series = [];
			this.hAxis = this.opt.hAxis;
			this.vAxis = this.opt.vAxis;
			this.animate = this.opt.animate;
		},

		getSeriesStats: function(){
			//	summary:
			//		Calculate the min/max on all attached series in both directions.
			//	returns: Object
			//		{hmin, hmax, vmin, vmax} min/max in both directions.
			var stats = dc.collectSimpleStats(this.series), t;
			stats.hmin -= 0.5;
			stats.hmax += 0.5;
			t = stats.hmin, stats.hmin = stats.vmin, stats.vmin = t;
			t = stats.hmax, stats.hmax = stats.vmax, stats.vmax = t;
			return stats;
		},
		
		createRect: function(run, creator, params){
			var rect;
			if(this.opt.enableCache && run._rectFreePool.length > 0){
				rect = run._rectFreePool.pop();
				rect.setShape(params);
				// was cleared, add it back
				creator.add(rect);
			}else{
				rect = creator.createRect(params);
			}
			if(this.opt.enableCache){
				run._rectUsePool.push(rect);
			}
			return rect;
		},

		render: function(dim, offsets){
			//	summary:
			//		Run the calculations for any axes for this plot.
			//	dim: Object
			//		An object in the form of { width, height }
			//	offsets: Object
			//		An object of the form { l, r, t, b}.
			//	returns: dojox.charting.plot2d.Bars
			//		A reference to this plot for functional chaining.
			if(this.zoom && !this.isDataDirty()){
				return this.performZoom(dim, offsets);
			}
			this.dirty = this.isDirty();
			this.resetEvents();
			if(this.dirty){
				arr.forEach(this.series, purgeGroup);
				this._eventSeries = {};
				this.cleanGroup();
				var s = this.group;
				df.forEachRev(this.series, function(item){ item.cleanGroup(s); });
			}
			var t = this.chart.theme, f, gap, height,
				ht = this._hScaler.scaler.getTransformerFromModel(this._hScaler),
				vt = this._vScaler.scaler.getTransformerFromModel(this._vScaler),
				baseline = Math.max(0, this._hScaler.bounds.lower),
				baselineWidth = ht(baseline),
				events = this.events();
			f = dc.calculateBarSize(this._vScaler.bounds.scale, this.opt);
			gap = f.gap;
			height = f.size;
			for(var i = this.series.length - 1; i >= 0; --i){
				var run = this.series[i];
				if(!this.dirty && !run.dirty){
					t.skip();
					this._reconnectEvents(run.name);
					continue;
				}
				run.cleanGroup();
				if(this.opt.enableCache){
					run._rectFreePool = (run._rectFreePool?run._rectFreePool:[]).concat(run._rectUsePool?run._rectUsePool:[]);
					run._rectUsePool = [];
				}
				var theme = t.next("bar", [this.opt, run]), s = run.group,
					eventSeries = new Array(run.data.length);
				for(var j = 0; j < run.data.length; ++j){
					var value = run.data[j];
					if(value !== null){
						var v = typeof value == "number" ? value : value.y,
							hv = ht(v),
							width = hv - baselineWidth,
							w = Math.abs(width),
							finalTheme = typeof value != "number" ?
								t.addMixin(theme, "bar", value, true) :
								t.post(theme, "bar");
						if(w >= 0 && height >= 1){
							var rect = {
								x: offsets.l + (v < baseline ? hv : baselineWidth),
								y: dim.height - offsets.b - vt(j + 1.5) + gap,
								width: w, height: height
							};
							var specialFill = this._plotFill(finalTheme.series.fill, dim, offsets);
							specialFill = this._shapeFill(specialFill, rect);
							var shape = this.createRect(run, s, rect).setFill(specialFill).setStroke(finalTheme.series.stroke);
							run.dyn.fill   = shape.getFill();
							run.dyn.stroke = shape.getStroke();
							if(events){
								var o = {
									element: "bar",
									index:   j,
									run:     run,
									shape:   shape,
									x:       v,
									y:       j + 1.5
								};
								this._connectEvents(o);
								eventSeries[j] = o;
							}
							if(this.animate){
								this._animateBar(shape, offsets.l + baselineWidth, -w);
							}
						}
					}
				}
				this._eventSeries[run.name] = eventSeries;
				run.dirty = false;
			}
			this.dirty = false;
			return this;	//	dojox.charting.plot2d.Bars
		},
		_animateBar: function(shape, hoffset, hsize){
			fx.animateTransform(lang.delegate({
				shape: shape,
				duration: 1200,
				transform: [
					{name: "translate", start: [hoffset - (hoffset/hsize), 0], end: [0, 0]},
					{name: "scale", start: [1/hsize, 1], end: [1, 1]},
					{name: "original"}
				]
			}, this.animate)).play();
		}
	});
});

},
'dojox/lang/functional/object':function(){
define("dojox/lang/functional/object", ["dojo/_base/kernel", "dojo/_base/lang", "dojo/_base/window", "./lambda"], function(dojo, lang, win, df){

// This module adds high-level functions and related constructs:
//	- object/dictionary helpers

// Defined methods:
//	- take any valid lambda argument as the functional argument
//	- skip all attributes that are present in the empty object
//		(IE and/or 3rd-party libraries).

	var empty = {};

/*=====
	var df = dojox.lang.functional;
 =====*/
	lang.mixin(df, {
		// object helpers
		keys: function(/*Object*/ obj){
			// summary: returns an array of all keys in the object
			var t = [];
			for(var i in obj){
				if(!(i in empty)){
					t.push(i);
				}
			}
			return	t; // Array
		},
		values: function(/*Object*/ obj){
			// summary: returns an array of all values in the object
			var t = [];
			for(var i in obj){
				if(!(i in empty)){
					t.push(obj[i]);
				}
			}
			return	t; // Array
		},
		filterIn: function(/*Object*/ obj, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary: creates new object with all attributes that pass the test
			//	implemented by the provided function.
			o = o || win.global; f = df.lambda(f);
			var t = {}, v, i;
			for(i in obj){
				if(!(i in empty)){
					v = obj[i];
					if(f.call(o, v, i, obj)){ t[i] = v; }
				}
			}
			return t;	// Object
		},
		forIn: function(/*Object*/ obj, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary: iterates over all object attributes.
			o = o || win.global; f = df.lambda(f);
			for(var i in obj){
				if(!(i in empty)){
					f.call(o, obj[i], i, obj);
				}
			}
			return o;	// Object
		},
		mapIn: function(/*Object*/ obj, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary: creates new object with the results of calling
			//	a provided function on every attribute in this object.
			o = o || win.global; f = df.lambda(f);
			var t = {}, i;
			for(i in obj){
				if(!(i in empty)){
					t[i] = f.call(o, obj[i], i, obj);
				}
			}
			return t;	// Object
		}
	});
	
	return df;
});

},
'esri/arcgis/csv':function(){
// wrapped by build app
define(["dijit","dojo","dojox","dojo/require!dojox/data/CsvStore"], function(dijit,dojo,dojox){
dojo.provide("esri.arcgis.csv");

dojo.require("dojox.data.CsvStore");

(function(){

  var EAC = esri.arcgis.csv;
  
  EAC.latFieldStrings = ["lat", "latitude", "y", "ycenter", "latitude83", "latdecdeg", "POINT-Y"];
  EAC.longFieldStrings = ["lon", "lng", "long", "longitude", "x", "xcenter", "longitude83", "longdecdeg", "POINT-X"];
  
  /*****************
   * Public methods
   *****************/
  /* layerJson = 
   {"type": "CSV",
   "url": "http://www.arcgis.com/xxx/sales.csv",
   "id": "Sales",
   "visibility": true,
   "opacity": 1,
   "title": "Sales" ,
   "layerDefinition" : {
   },
   "popupInfo" : {
   },
   "locationInfo" : {
   "locationType": coordinates | address | lookup,
   "latitudeFieldName" : If locationType = coordinates, the name of the field which contains the Y coordinate
   "longitudeFieldName" : If locationType = coordinates, the name of the field which contains the X coordinate
   "addressTemplate" :  if locationType = address, a string value which defines the address to find based on CSV field values.  Example: "{Address} {City}, {State} {Zip}"
   }
   */
  EAC.buildCSVFeatureCollection = function(layerJson){
  
    var deferred = new dojo.Deferred();
    
    var processCSVDataHandler = function(featureCollection){
      deferred.callback(featureCollection);
    };
    
    var requestHandle = esri.request({
      url: layerJson.url,
      handleAs: "text",
      load: function(response){
        EAC._processCsvData(response, layerJson, dojo.hitch(this, processCSVDataHandler));
      },
      error: function(error){
        console.error("error: " + error);
      }
    }, {
      usePost: false
    });
    
    return deferred;
  };
  
  EAC.projectFeatureCollection = function(featureCollection, outSR){
  
    var deferred = new dojo.Deferred();
    
    var projectFeatureSetHandler = function(featureCollection2){
      deferred.callback(featureCollection2);
    };
    
    EAC._projectFeatureSet(featureCollection, new esri.SpatialReference({
      wkid: 4326
    }), outSR, dojo.hitch(this, projectFeatureSetHandler));
    
    return deferred;
  };
  
  EAC.generateDefaultPopupInfo = function(featureCollection){
    var fields = featureCollection.layerDefinition.fields;
    
    var decimal = {
      'esriFieldTypeDouble': 1,
      'esriFieldTypeSingle': 1
    };
    
    var integer = {
      'esriFieldTypeInteger': 1,
      'esriFieldTypeSmallInteger': 1
    };
    
    var dt = {
      'esriFieldTypeDate': 1
    };
    
    var displayField = null;
    var fieldInfos = dojo.map(fields, dojo.hitch(this, function(item){
    
      if (item.name.toUpperCase() === "NAME") {
        displayField = item.name;
      }
      var visible = (item.type !== "esriFieldTypeOID" && item.type !== "esriFieldTypeGlobalID" && item.type !== "esriFieldTypeGeometry");
      var format = null;
      
      if (visible) {
        var f = item.name.toLowerCase();
        var hideFieldsStr = ",stretched value,fnode_,tnode_,lpoly_,rpoly_,poly_,subclass,subclass_,rings_ok,rings_nok,";
        
        if (hideFieldsStr.indexOf("," + f + ",") > -1 || f.indexOf("area") > -1 || f.indexOf("length") > -1 ||
        f.indexOf("shape") > -1 ||
        f.indexOf("perimeter") > -1 ||
        f.indexOf("objectid") > -1 ||
        f.indexOf("_") === f.length - 1 ||
        (f.indexOf("_i") === f.length - 2 && f.length > 1)) {
          visible = false;
        }
        if (item.type in integer) {
          format = {
            places: 0,
            digitSeparator: true
          };
        } else if (item.type in decimal) {
          format = {
            places: 2,
            digitSeparator: true
          };
        } else if (item.type in dt) {
          format = {
            dateFormat: 'shortDateShortTime'
          };
        }
      }
      
      return dojo.mixin({}, {
        fieldName: item.name,
        label: item.alias,
        isEditable: true,
        tooltip: "",
        visible: visible,
        format: format,
        stringFieldOption: 'textbox'
      });
    }));
    
    var popupInfo = {
      title: displayField ? '{' + displayField + '}' : '',
      fieldInfos: fieldInfos,
      description: null,
      showAttachments: false,
      mediaInfos: []
    };
    return popupInfo;
  };
  
  /*****************
   * Internal methods
   *****************/
  EAC._processCsvData = function(data, layerJson, handler){
    var newLineIdx = data.indexOf("\n");
    var firstLine = dojo.trim(data.substr(0, newLineIdx)); //remove extra whitespace, not sure if I need to do this since I threw out space delimiters
    var separator = layerJson.columnDelimiter;
    if (!separator) {
      separator = EAC._getSeparator(firstLine);
    }
    
    var csvStore = new dojox.data.CsvStore({
      data: data,
      separator: separator
    });
    var count = (dojo.isIE < 9) ? 750 : 1001;
    csvStore.fetch({
      start: 0,
      count: count,
      onComplete: function(items, request){
        var objectId = 0;
        
        var featureCollection = {
          "layerDefinition": layerJson.layerDefinition,
          "featureSet": {
            "features": [],
            "geometryType": "esriGeometryPoint"
          }
        };
        
        var objectIdFieldName = featureCollection.layerDefinition.objectIdField;
        if (!objectIdFieldName) {
          if (!dojo.some(featureCollection.layerDefinition.fields, function(field){
            if (field.type == 'esriFieldTypeOID') {
              objectIdFieldName = field.name;
              return true;
            }
            return false;
          })) {
            featureCollection.layerDefinition.fields.push({
              "name": "__OBJECTID",
              "alias": "__OBJECTID",
              "type": "esriFieldTypeOID",
              "editable": false,
              "domain": null
            });
            objectIdFieldName = "__OBJECTID";
          }
        }
        
        var latField, longField;
        
        // var fieldNames = csvStore.getAttributes(items[0]); if first item has null values we end up missing fields 
        var fieldNames = csvStore._attributes;
        
        var dateFieldPosList = [];
        var numberFieldPosList = [];
        dojo.forEach(featureCollection.layerDefinition.fields, function(field, index){
          if (field.type === "esriFieldTypeDate") {
            dateFieldPosList.push(field.name);
          } else if (field.type === "esriFieldTypeDouble" || field.type === "esriFieldTypeInteger") {
            numberFieldPosList.push(field.name);
          }
        });
        
        if (layerJson.locationInfo && layerJson.locationInfo.locationType === "coordinates") {
          latField = layerJson.locationInfo.latitudeFieldName;
          longField = layerJson.locationInfo.longitudeFieldName;
        } else {
          dojo.forEach(fieldNames, function(fieldName){
            var matchId;
            matchId = dojo.indexOf(EAC.latFieldStrings, fieldName.toLowerCase());
            if (matchId !== -1) {
              latField = fieldName;
            }
            
            matchId = dojo.indexOf(EAC.longFieldStrings, fieldName.toLowerCase());
            if (matchId !== -1) {
              longField = fieldName;
            }
          }, this);
        }
        
        if (!latField || !longField) {
          // otherwise dialog doesn't show up in IE or Safari
          setTimeout(function(){
            console.error("File does not seem to contain fields with point coordinates.");
          }, 1);
          return;
        }
        
        // Add records in this CSV store as graphics
        var i = 0, il = items.length;
        for (i; i < il; i++) {
          if (featureCollection.featureSet.features.length >= 1000) {
            // setTimeout for Safari
            setTimeout(function(){
              console.error("1000 feature limit reached. Unable to load any more data.");
            }, 1);
            break;
          }
          
          var item = items[i];
          
          var attrs = csvStore.getAttributes(item), attributes = {};
          
          // Read all the attributes for  this record/item
          dojo.forEach(attrs, function(attr, index){
        	  
            if (attr) {
				var origAttr = attr;
				if (attr.length === 0) {
					dojo.forEach(featureCollection.layerDefinition.fields, function(field, idx){
						if (field.name === "attribute_" + (idx - 1)) {
							attr = "attribute_" + (idx - 1);
						}
					});
				}
				
                // objectId field is added as first field...
                if (dojo.some(dateFieldPosList, function(a){
                  return a === attr;
                })) {
                  // date field
                  var val = csvStore.getValue(item, origAttr), date = new Date(val);
                  attributes[attr] = EAC._isValidDate(date, val) ? date.getTime() : null;
                } else if (dojo.some(numberFieldPosList, function(a){
                  return a === attr;
                })) {
                  // number fields
                  var value = dojo.number.parse(csvStore.getValue(item, origAttr));
                  if ((attr == latField || attr == longField) && (isNaN(value) || Math.abs(value) > 181)) {
                    // locale set to english:
                    // dojo.number.parse works fine for 1.234
                    // dojo.number.parse returns 1234 for 1,234
                    // dojo.number.parse returns NaN for 1,2345
                    // parseFloat returns 1 for 1,234
                    // locale set to french:
                    // dojo.number.parse works fine for 1,234
                    // dojo.number.parse returns 1234 for 1.234
                    // dojo.number.parse returns NaN for 1.2345
                    // parseFloat works for 1.234
                    value = parseFloat(csvStore.getValue(item, origAttr));
                    if (isNaN(value)) {
                      attributes[attr] = null;
                    } else {
                      attributes[attr] = value;
                    }
                  } else if (isNaN(value)) {
                    attributes[attr] = null;
                  } else {
                    attributes[attr] = value;
                  }
                } else {
                  attributes[attr] = csvStore.getValue(item, origAttr);
                }
            } // else CSV file bad. Line has more values than fields
          });
          
          attributes[objectIdFieldName] = objectId;
          objectId++;
          
          var latitude = attributes[latField];
          var longitude = attributes[longField];
          
          // values are null if field is type number, but actual value is a string
          if (longitude == null || latitude == null || isNaN(latitude) || isNaN(longitude)) {
            continue;
          }
          
          var geometry = new esri.geometry.Point(longitude, latitude, new esri.SpatialReference({
            wkid: 4326
          }));
          var feature = {
            "geometry": geometry.toJson(),
            "attributes": attributes
          };
          featureCollection.featureSet.features.push(feature);
        }
        
        featureCollection.layerDefinition.name = "csv";
        
        if (handler) {
          handler(featureCollection);
        }
        
      },
      onError: function(error){
        console.error("Error fetching items from CSV store: ", error);
      }
    });
    
    return true;
  };
  
  EAC._getSeparator = function(string){
    var separators = [",", " ", ";", "|", "\t"];
    var maxSeparatorLength = 0;
    var maxSeparatorValue = "";
    dojo.forEach(separators, function(separator){
      var length = string.split(separator).length;
      if (length > maxSeparatorLength) {
        maxSeparatorLength = length;
        maxSeparatorValue = separator;
      }
    });
    return maxSeparatorValue;
  };
  
  EAC._isValidDate = function(d, strValue){
    if (!d || Object.prototype.toString.call(d) !== "[object Date]" || isNaN(d.getTime())) {
      return false;
    }
    
    var isDate = true;
    
    // Check for false positives in Chrome where the following strings are
    // parsed as Date objects:
    //   new Date("technology 10")
    //   new Date("http://a.com/b/c/570")
    // Related bug: http://code.google.com/p/chromium/issues/detail?id=53209
    // The situation is a real mess.
    // http://www.google.com/codesearch#search&q=DateParseString+package:http://v8\.googlecode\.com
    // http://www.google.com/codesearch#W9JxUuHYyMg/trunk/src/dateparser-inl.h
    // Note these comments in dateparser-inl.h:
    //   Any unrecognized word before the first number is ignored.
    //   Garbage words are illegal if a number has been read.
    // http://code.google.com/p/v8/source/browse/trunk/src/date.js#1056
    // http://code.google.com/p/v8/source/browse/trunk/src/date.js#534
    
    // IMPORTANT NOTE
    // If this routine is updated, make sure esri\arcgisonline\map\fileImport.js
    // is updated as well
    
    if (dojo.isChrome && /\d+\W*$/.test(strValue)) { // strings ends with a number
      var match = strValue.match(/[a-zA-Z]{2,}/);
      if (match) { // process all words that have only alphabet characters
        var garbageFound = false, i = 0, len = match.length, reKeywords = /^((jan(uary)?)|(feb(ruary)?)|(mar(ch)?)|(apr(il)?)|(may)|(jun(e)?)|(jul(y)?)|(aug(ust)?)|(sep(tember)?)|(oct(ober)?)|(nov(ember)?)|(dec(ember)?)|(am)|(pm)|(gmt)|(utc))$/i;
        
        while (!garbageFound && (i <= len) && !(garbageFound = !reKeywords.test(match[i]))) {
          i++;
        }
        
        isDate = !garbageFound;
      }
    }
    
    return isDate;
  };
  
  EAC._projectFeatureSet = function(fcLayer, oldSpatialReference, newSpatialReference, handler){
    if (!fcLayer.featureSet || fcLayer.featureSet.length === 0) {
      return;
    }
    
    if (EAC._sameSpatialReference(newSpatialReference, oldSpatialReference)) {
      handler(fcLayer);
      return;
    }
    
    var projectHandler = function(jsonGeometries){
      var newFeatures = [];
      dojo.forEach(fcLayer.featureSet.features, function(feature, i){
        if (jsonGeometries[i]) {
          feature.geometry = jsonGeometries[i];
          newFeatures.push(feature);
        } // else feature could not get projected; take it out
      }, this);
      // fcLayer.featureSet.features = newFeatures;
      // update extent
      //results in bad JSON in config fcLayer.layerDefinition.extent = esri.arcgisonline.map.featColl.getFeatureSetFullExtent(fcLayer.featureSet);
      handler(fcLayer);
    };
    
    var projectErrorHandler = function(result, args){
      console.error("error projecting featureSet (" + fcLayer.layerDefinition.name + "). Try one more time.");
      // give it one more try
      EAC._projectGeometries(geometries, fcLayer.featureSet.geometryType, oldSpatialReference, newSpatialReference, dojo.hitch(this, projectHandler), dojo.hitch(this, finalProjectErrorHandler));
    };
    
    var finalProjectErrorHandler = function(result, args){
      // don't do anything
      console.error("error projecting featureSet (" + fcLayer.layerDefinition.name + "). Final try.");
      // fcLayer.layerDefinition.extent = null;
      handler(fcLayer);
    };
    
    if (fcLayer.featureSet.features && fcLayer.featureSet.features.length > 0) {
      var geometries = [];
      dojo.forEach(fcLayer.featureSet.features, function(feature){
        geometries.push(feature.geometry);
      });
      EAC._projectGeometries(geometries, fcLayer.featureSet.geometryType, oldSpatialReference, newSpatialReference, dojo.hitch(this, projectHandler), dojo.hitch(this, projectErrorHandler));
    } else {
      // fcLayer.layerDefinition.extent = null;
      handler(fcLayer);
    }
  };
  
  EAC._projectGeometries = function(jsonGeometries, geometryType, inSR, outSR, handler, errorHandler){
    if (jsonGeometries.length === 0) {
      handler(null);
    }
    
    // build esri.Geometry objects 
    var Geometry = esri.geometry.getGeometryType(geometryType);
    var geometries = [];
    dojo.forEach(jsonGeometries, function(jsonGeometry){
      var geometry = new Geometry(jsonGeometry);
      geometry.spatialReference = inSR;
      geometries.push(geometry);
    }, this);
    
    var mercator = [102113, 102100, 3857];
    if (inSR.wkid && inSR.wkid === 4326 && outSR.wkid && dojo.indexOf(mercator, outSR.wkid) > -1) {
    
      dojo.forEach(geometries, function(geometry){
        // clip it, so it's not going to Infinity
        if (geometry.xmin) {
          geometry.xmin = Math.max(geometry.xmin, -180);
          geometry.xmax = Math.min(geometry.xmax, 180);
          geometry.ymin = Math.max(geometry.ymin, -89.99);
          geometry.ymax = Math.min(geometry.ymax, 89.99);
        } else if (geometry.rings) {
          dojo.forEach(geometry.rings, function(ring){
            dojo.forEach(ring, function(point){
              point[0] = Math.min(Math.max(point[0], -180), 180);
              point[1] = Math.min(Math.max(point[1], -89.99), 89.99);
            }, this);
          }, this);
        } else if (geometry.paths) {
          dojo.forEach(geometry.paths, function(path){
            dojo.forEach(path, function(point){
              point[0] = Math.min(Math.max(point[0], -180), 180);
              point[1] = Math.min(Math.max(point[1], -89.99), 89.99);
            }, this);
          }, this);
        } else if (geometry.x) {
          geometry.x = Math.min(Math.max(geometry.x, -180), 180);
          geometry.y = Math.min(Math.max(geometry.y, -89.99), 89.99);
        }
      }, this);
      
      jsonGeometries = [];
      dojo.forEach(geometries, function(geometry){
        var outGeometry = esri.geometry.geographicToWebMercator(geometry);
        if (outSR.wkid !== 102100) {
          // geographicToWebMercator returns 102100; make sure it's what we want
          outGeometry.spatialReference = outSR;
        }
        jsonGeometries.push(outGeometry.toJson());
      }, this);
      handler(jsonGeometries);
      
    } else if (inSR.wkid !== null && dojo.indexOf(mercator, inSR.wkid) > -1 && outSR.wkid !== null && outSR.wkid === 4326) {
    
      jsonGeometries = [];
      dojo.forEach(geometries, function(geometry){
        jsonGeometries.push(esri.geometry.webMercatorToGeographic(geometry).toJson());
      }, this);
      handler(jsonGeometries);
      
    } else {
    
      var projectHandler = function(result, args){
        // check if response is valid
        // [{"type":"extent","xmin":NaN,"ymin":NaN,"xmax":NaN,"ymax":NaN,"spatialReference":{"wkid":29902,"wkt":null,"declaredClass":"esri.SpatialReference"},"declaredClass":"esri.geometry.Extent"}]
        if (result && result.length === jsonGeometries.length) {
          jsonGeometries = [];
          dojo.forEach(result, function(geometry){
            if (geometry &&
            ((geometry.rings && geometry.rings.length > 0 && geometry.rings[0].length > 0 && geometry.rings[0][0].length > 0 && !isNaN(geometry.rings[0][0][0]) && !isNaN(geometry.rings[0][0][1])) ||
            (geometry.paths && geometry.paths.length > 0 && geometry.paths[0].length > 0 && geometry.paths[0][0].length > 0 && !isNaN(geometry.paths[0][0][0]) && !isNaN(geometry.paths[0][0][1])) ||
            (geometry.xmin && !isNaN(geometry.xmin) && geometry.ymin && !isNaN(geometry.ymin)) ||
            (geometry.x && !isNaN(geometry.x) && geometry.y && !isNaN(geometry.y)))) {
              jsonGeometries.push(geometry.toJson());
            } else {
              // invalid geometry
              jsonGeometries.push(null);
            }
          }, this);
          handler(jsonGeometries);
        } else {
          errorHandler(result, args);
        }
      };
      if (esri.config.defaults.geometryService) {
        esri.config.defaults.geometryService.project(geometries, outSR, dojo.hitch(this, projectHandler), errorHandler);
      } else {
        handler(null);
      }
    }
  };
  
  EAC._sameSpatialReference = function(sp1, sp2){
    var mercator = [102113, 102100, 3857];
    if (sp1 && sp2 && sp1.wkid === sp2.wkid && sp1.wkt === sp2.wkt) {
      return true;
    } else if (sp1 && sp2 && sp1.wkid && sp2.wkid && dojo.indexOf(mercator, sp1.wkid) > -1 && dojo.indexOf(mercator, sp2.wkid) > -1) {
      return true;
    }
    
    return false;
  };
  
}()); // end of module anonymous

});

},
'dojox/charting/scaler/linear':function(){
define("dojox/charting/scaler/linear", ["dojo/_base/lang", "./common"], 
	function(lang, common){
	var linear = lang.getObject("dojox.charting.scaler.linear", true);
	
	var deltaLimit = 3,	// pixels
		findString = common.findString,
		getLabel = common.getNumericLabel;
	
	var calcTicks = function(min, max, kwArgs, majorTick, minorTick, microTick, span){
		kwArgs = lang.delegate(kwArgs);
		if(!majorTick){
			if(kwArgs.fixUpper == "major"){ kwArgs.fixUpper = "minor"; }
			if(kwArgs.fixLower == "major"){ kwArgs.fixLower = "minor"; }
		}
		if(!minorTick){
			if(kwArgs.fixUpper == "minor"){ kwArgs.fixUpper = "micro"; }
			if(kwArgs.fixLower == "minor"){ kwArgs.fixLower = "micro"; }
		}
		if(!microTick){
			if(kwArgs.fixUpper == "micro"){ kwArgs.fixUpper = "none"; }
			if(kwArgs.fixLower == "micro"){ kwArgs.fixLower = "none"; }
		}
		var lowerBound = findString(kwArgs.fixLower, ["major"]) ?
				Math.floor(kwArgs.min / majorTick) * majorTick :
					findString(kwArgs.fixLower, ["minor"]) ?
						Math.floor(kwArgs.min / minorTick) * minorTick :
							findString(kwArgs.fixLower, ["micro"]) ?
								Math.floor(kwArgs.min / microTick) * microTick : kwArgs.min,
			upperBound = findString(kwArgs.fixUpper, ["major"]) ?
				Math.ceil(kwArgs.max / majorTick) * majorTick :
					findString(kwArgs.fixUpper, ["minor"]) ?
						Math.ceil(kwArgs.max / minorTick) * minorTick :
							findString(kwArgs.fixUpper, ["micro"]) ?
								Math.ceil(kwArgs.max / microTick) * microTick : kwArgs.max;
								
		if(kwArgs.useMin){ min = lowerBound; }
		if(kwArgs.useMax){ max = upperBound; }
		
		var majorStart = (!majorTick || kwArgs.useMin && findString(kwArgs.fixLower, ["major"])) ?
				min : Math.ceil(min / majorTick) * majorTick,
			minorStart = (!minorTick || kwArgs.useMin && findString(kwArgs.fixLower, ["major", "minor"])) ?
				min : Math.ceil(min / minorTick) * minorTick,
			microStart = (! microTick || kwArgs.useMin && findString(kwArgs.fixLower, ["major", "minor", "micro"])) ?
				min : Math.ceil(min / microTick) * microTick,
			majorCount = !majorTick ? 0 : (kwArgs.useMax && findString(kwArgs.fixUpper, ["major"]) ?
				Math.round((max - majorStart) / majorTick) :
				Math.floor((max - majorStart) / majorTick)) + 1,
			minorCount = !minorTick ? 0 : (kwArgs.useMax && findString(kwArgs.fixUpper, ["major", "minor"]) ?
				Math.round((max - minorStart) / minorTick) :
				Math.floor((max - minorStart) / minorTick)) + 1,
			microCount = !microTick ? 0 : (kwArgs.useMax && findString(kwArgs.fixUpper, ["major", "minor", "micro"]) ?
				Math.round((max - microStart) / microTick) :
				Math.floor((max - microStart) / microTick)) + 1,
			minorPerMajor  = minorTick ? Math.round(majorTick / minorTick) : 0,
			microPerMinor  = microTick ? Math.round(minorTick / microTick) : 0,
			majorPrecision = majorTick ? Math.floor(Math.log(majorTick) / Math.LN10) : 0,
			minorPrecision = minorTick ? Math.floor(Math.log(minorTick) / Math.LN10) : 0,
			scale = span / (max - min);
		if(!isFinite(scale)){ scale = 1; }
		
		return {
			bounds: {
				lower:	lowerBound,
				upper:	upperBound,
				from:	min,
				to:		max,
				scale:	scale,
				span:	span
			},
			major: {
				tick:	majorTick,
				start:	majorStart,
				count:	majorCount,
				prec:	majorPrecision
			},
			minor: {
				tick:	minorTick,
				start:	minorStart,
				count:	minorCount,
				prec:	minorPrecision
			},
			micro: {
				tick:	microTick,
				start:	microStart,
				count:	microCount,
				prec:	0
			},
			minorPerMajor:	minorPerMajor,
			microPerMinor:	microPerMinor,
			scaler:			linear
		};
	};
	
	return lang.mixin(linear, {
		buildScaler: function(/*Number*/ min, /*Number*/ max, /*Number*/ span, /*Object*/ kwArgs){
			var h = {fixUpper: "none", fixLower: "none", natural: false};
			if(kwArgs){
				if("fixUpper" in kwArgs){ h.fixUpper = String(kwArgs.fixUpper); }
				if("fixLower" in kwArgs){ h.fixLower = String(kwArgs.fixLower); }
				if("natural"  in kwArgs){ h.natural  = Boolean(kwArgs.natural); }
			}
			
			// update bounds
			if("min" in kwArgs){ min = kwArgs.min; }
			if("max" in kwArgs){ max = kwArgs.max; }
			if(kwArgs.includeZero){
				if(min > 0){ min = 0; }
				if(max < 0){ max = 0; }
			}
			h.min = min;
			h.useMin = true;
			h.max = max;
			h.useMax = true;
			
			if("from" in kwArgs){
				min = kwArgs.from;
				h.useMin = false;
			}
			if("to" in kwArgs){
				max = kwArgs.to;
				h.useMax = false;
			}
			
			// check for erroneous condition
			if(max <= min){
				return calcTicks(min, max, h, 0, 0, 0, span);	// Object
			}
			
			var mag = Math.floor(Math.log(max - min) / Math.LN10),
				major = kwArgs && ("majorTickStep" in kwArgs) ? kwArgs.majorTickStep : Math.pow(10, mag),
				minor = 0, micro = 0, ticks;
				
			// calculate minor ticks
			if(kwArgs && ("minorTickStep" in kwArgs)){
				minor = kwArgs.minorTickStep;
			}else{
				do{
					minor = major / 10;
					if(!h.natural || minor > 0.9){
						ticks = calcTicks(min, max, h, major, minor, 0, span);
						if(ticks.bounds.scale * ticks.minor.tick > deltaLimit){ break; }
					}
					minor = major / 5;
					if(!h.natural || minor > 0.9){
						ticks = calcTicks(min, max, h, major, minor, 0, span);
						if(ticks.bounds.scale * ticks.minor.tick > deltaLimit){ break; }
					}
					minor = major / 2;
					if(!h.natural || minor > 0.9){
						ticks = calcTicks(min, max, h, major, minor, 0, span);
						if(ticks.bounds.scale * ticks.minor.tick > deltaLimit){ break; }
					}
					return calcTicks(min, max, h, major, 0, 0, span);	// Object
				}while(false);
			}
	
			// calculate micro ticks
			if(kwArgs && ("microTickStep" in kwArgs)){
				micro = kwArgs.microTickStep;
				ticks = calcTicks(min, max, h, major, minor, micro, span);
			}else{
				do{
					micro = minor / 10;
					if(!h.natural || micro > 0.9){
						ticks = calcTicks(min, max, h, major, minor, micro, span);
						if(ticks.bounds.scale * ticks.micro.tick > deltaLimit){ break; }
					}
					micro = minor / 5;
					if(!h.natural || micro > 0.9){
						ticks = calcTicks(min, max, h, major, minor, micro, span);
						if(ticks.bounds.scale * ticks.micro.tick > deltaLimit){ break; }
					}
					micro = minor / 2;
					if(!h.natural || micro > 0.9){
						ticks = calcTicks(min, max, h, major, minor, micro, span);
						if(ticks.bounds.scale * ticks.micro.tick > deltaLimit){ break; }
					}
					micro = 0;
				}while(false);
			}
	
			return micro ? ticks : calcTicks(min, max, h, major, minor, 0, span);	// Object
		},
		buildTicks: function(/*Object*/ scaler, /*Object*/ kwArgs){
			var step, next, tick,
				nextMajor = scaler.major.start,
				nextMinor = scaler.minor.start,
				nextMicro = scaler.micro.start;
			if(kwArgs.microTicks && scaler.micro.tick){
				step = scaler.micro.tick, next = nextMicro;
			}else if(kwArgs.minorTicks && scaler.minor.tick){
				step = scaler.minor.tick, next = nextMinor;
			}else if(scaler.major.tick){
				step = scaler.major.tick, next = nextMajor;
			}else{
				// no ticks
				return null;
			}
			// make sure that we have finite bounds
			var revScale = 1 / scaler.bounds.scale;
			if(scaler.bounds.to <= scaler.bounds.from || isNaN(revScale) || !isFinite(revScale) ||
					step <= 0 || isNaN(step) || !isFinite(step)){
				// no ticks
				return null;
			}
			// loop over all ticks
			var majorTicks = [], minorTicks = [], microTicks = [];
			while(next <= scaler.bounds.to + revScale){
				if(Math.abs(nextMajor - next) < step / 2){
					// major tick
					tick = {value: nextMajor};
					if(kwArgs.majorLabels){
						tick.label = getLabel(nextMajor, scaler.major.prec, kwArgs);
					}
					majorTicks.push(tick);
					nextMajor += scaler.major.tick;
					nextMinor += scaler.minor.tick;
					nextMicro += scaler.micro.tick;
				}else if(Math.abs(nextMinor - next) < step / 2){
					// minor tick
					if(kwArgs.minorTicks){
						tick = {value: nextMinor};
						if(kwArgs.minorLabels && (scaler.minMinorStep <= scaler.minor.tick * scaler.bounds.scale)){
							tick.label = getLabel(nextMinor, scaler.minor.prec, kwArgs);
						}
						minorTicks.push(tick);
					}
					nextMinor += scaler.minor.tick;
					nextMicro += scaler.micro.tick;
				}else{
					// micro tick
					if(kwArgs.microTicks){
						microTicks.push({value: nextMicro});
					}
					nextMicro += scaler.micro.tick;
				}
				next += step;
			}
			return {major: majorTicks, minor: minorTicks, micro: microTicks};	// Object
		},
		getTransformerFromModel: function(/*Object*/ scaler){
			var offset = scaler.bounds.from, scale = scaler.bounds.scale;
			return function(x){ return (x - offset) * scale; };	// Function
		},
		getTransformerFromPlot: function(/*Object*/ scaler){
			var offset = scaler.bounds.from, scale = scaler.bounds.scale;
			return function(x){ return x / scale + offset; };	// Function
		}
	});
});

},
'dojox/gfx/gradutils':function(){
// Various generic utilities to deal with a linear gradient

define("dojox/gfx/gradutils", ["./_base", "dojo/_base/lang", "./matrix", "dojo/_base/Color"], 
  function(g, lang, m, Color){
  
	/*===== g= dojox.gfx =====*/
	var gradutils = g.gradutils = {};
	/*===== g= dojox.gfx; gradutils = dojox.gfx.gradutils; =====*/

	function findColor(o, c){
		if(o <= 0){
			return c[0].color;
		}
		var len = c.length;
		if(o >= 1){
			return c[len - 1].color;
		}
		//TODO: use binary search
		for(var i = 0; i < len; ++i){
			var stop = c[i];
			if(stop.offset >= o){
				if(i){
					var prev = c[i - 1];
					return Color.blendColors(new Color(prev.color), new Color(stop.color),
						(o - prev.offset) / (stop.offset - prev.offset));
				}
				return stop.color;
			}
		}
		return c[len - 1].color;
	}

	gradutils.getColor = function(fill, pt){
		// summary:
		//		sample a color from a gradient using a point
		// fill: Object:
		//		fill object
		// pt: dojox.gfx.Point:
		//		point where to sample a color
		var o;
		if(fill){
			switch(fill.type){
				case "linear":
					var angle = Math.atan2(fill.y2 - fill.y1, fill.x2 - fill.x1),
						rotation = m.rotate(-angle),
						projection = m.project(fill.x2 - fill.x1, fill.y2 - fill.y1),
						p = m.multiplyPoint(projection, pt),
						pf1 = m.multiplyPoint(projection, fill.x1, fill.y1),
						pf2 = m.multiplyPoint(projection, fill.x2, fill.y2),
						scale = m.multiplyPoint(rotation, pf2.x - pf1.x, pf2.y - pf1.y).x;
					o = m.multiplyPoint(rotation, p.x - pf1.x, p.y - pf1.y).x / scale;
					break;
				case "radial":
					var dx = pt.x - fill.cx, dy = pt.y - fill.cy;
					o = Math.sqrt(dx * dx + dy * dy) / fill.r;
					break;
			}
			return findColor(o, fill.colors);	// dojo.Color
		}
		// simple color
		return new Color(fill || [0, 0, 0, 0]);	// dojo.Color
	};

	gradutils.reverse = function(fill){
		// summary:
		//		reverses a gradient
		// fill: Object:
		//		fill object
		if(fill){
			switch(fill.type){
				case "linear":
				case "radial":
					fill = lang.delegate(fill);
					if(fill.colors){
						var c = fill.colors, l = c.length, i = 0, stop,
							n = fill.colors = new Array(c.length);
						for(; i < l; ++i){
							stop = c[i];
							n[i] = {
								offset: 1 - stop.offset,
								color:  stop.color
							};
						}
						n.sort(function(a, b){ return a.offset - b.offset; });
					}
					break;
			}
		}
		return fill;	// Object
	};

	return gradutils;
});

},
'dojox/charting/plot2d/Base':function(){
define("dojox/charting/plot2d/Base", ["dojo/_base/lang", "dojo/_base/declare", "dojo/_base/connect", 
		"../Element", "./_PlotEvents", "dojo/_base/array",
		"../scaler/primitive", "./common", "dojox/gfx/fx"],
	function(lang, declare, hub, Element, PlotEvents, arr, primitive, common, fx){
/*=====
var Element = dojox.charting.Element;
var PlotEvents = dojox.charting.plot2d._PlotEvents;
dojox.charting.plot2d.__PlotCtorArgs = function(){
	//	summary:
	//		The base keyword arguments object for plot constructors.
	//		Note that the parameters for this may change based on the
	//		specific plot type (see the corresponding plot type for
	//		details).
}
=====*/
return declare("dojox.charting.plot2d.Base", [Element, PlotEvents], {
	constructor: function(chart, kwArgs){
		//	summary:
		//		Create a base plot for charting.
		//	chart: dojox.chart.Chart
		//		The chart this plot belongs to.
		//	kwArgs: dojox.charting.plot2d.__PlotCtorArgs?
		//		An optional arguments object to help define the plot.
		this.zoom = null,
		this.zoomQueue = [];	// zooming action task queue
		this.lastWindow = {vscale: 1, hscale: 1, xoffset: 0, yoffset: 0};
	},
	clear: function(){
		//	summary:
		//		Clear out all of the information tied to this plot.
		//	returns: dojox.charting.plot2d.Base
		//		A reference to this plot for functional chaining.
		this.series = [];
		this._hAxis = null;
		this._vAxis = null;
		this.dirty = true;
		return this;	//	dojox.charting.plot2d.Base
	},
	setAxis: function(axis){
		//	summary:
		//		Set an axis for this plot.
		//	axis: dojox.charting.axis2d.Base
		//		The axis to set.
		//	returns: dojox.charting.plot2d.Base
		//		A reference to this plot for functional chaining.
		if(axis){
			this[axis.vertical ? "_vAxis" : "_hAxis"] = axis;
		}
		return this;	//	dojox.charting.plot2d.Base
	},
	toPage: function(coord){
		//	summary:
		//		Compute page coordinates from plot axis data coordinates.
		//	coord: Object?
		//		The coordinates in plot axis data coordinate space. For cartesian charts that is of the following form:
		//			`{ hAxisName: 50, vAxisName: 200 }`
		//		If not provided return the tranform method instead of the result of the transformation.
		//	returns: Object
		//		The resulting page pixel coordinates. That is of the following form:
		//			`{ x: 50, y: 200 }`
		var ah = this._hAxis, av = this._vAxis, 
			sh = ah.getScaler(), sv = av.getScaler(),  
			th = sh.scaler.getTransformerFromModel(sh),
			tv = sv.scaler.getTransformerFromModel(sv),
			c = this.chart.getCoords(),
			o = this.chart.offsets, dim = this.chart.dim;
		var t = function(coord){
			var r = {};
			r.x = th(coord[ah.name]) + c.x + o.l;
			r.y = c.y + dim.height - o.b - tv(coord[av.name]);
			return r;
		};
		// if no coord return the function so that we can capture the current transforms
		// and reuse them later on
		return coord?t(coord):t;
	},
	toData: function(coord){
		//	summary:
		//		Compute plot axis data coordinates from page coordinates.
		//	coord: Object
		//		The pixel coordinate in page coordinate space. That is of the following form:
		//			`{ x: 50, y: 200 }`
		//		If not provided return the tranform method instead of the result of the transformation.
		//	returns: Object
		//		The resulting plot axis data coordinates. For cartesian charts that is of the following form:
		//			`{ hAxisName: 50, vAxisName: 200 }`
		var ah = this._hAxis, av = this._vAxis, 
			sh = ah.getScaler(), sv = av.getScaler(),  
			th = sh.scaler.getTransformerFromPlot(sh),
			tv = sv.scaler.getTransformerFromPlot(sv),
			c = this.chart.getCoords(),
			o = this.chart.offsets, dim = this.chart.dim;
		var t = function(coord){
			var r = {};
			r[ah.name] = th(coord.x - c.x - o.l);
			r[av.name] = tv(c.y + dim.height - coord.y  - o.b);
			return r;
		};
		// if no coord return the function so that we can capture the current transforms
		// and reuse them later on
		return coord?t(coord):t;
	},
	addSeries: function(run){
		//	summary:
		//		Add a data series to this plot.
		//	run: dojox.charting.Series
		//		The series to be added.
		//	returns: dojox.charting.plot2d.Base
		//		A reference to this plot for functional chaining.
		this.series.push(run);
		return this;	//	dojox.charting.plot2d.Base
	},
	getSeriesStats: function(){
		//	summary:
		//		Calculate the min/max on all attached series in both directions.
		//	returns: Object
		//		{hmin, hmax, vmin, vmax} min/max in both directions.
		return common.collectSimpleStats(this.series);
	},
	calculateAxes: function(dim){
		//	summary:
		//		Stub function for running the axis calculations (depricated).
		//	dim: Object
		//		An object of the form { width, height }
		//	returns: dojox.charting.plot2d.Base
		//		A reference to this plot for functional chaining.
		this.initializeScalers(dim, this.getSeriesStats());
		return this;	//	dojox.charting.plot2d.Base
	},
	isDirty: function(){
		//	summary:
		//		Returns whether or not this plot needs to be rendered.
		//	returns: Boolean
		//		The state of the plot.
		return this.dirty || this._hAxis && this._hAxis.dirty || this._vAxis && this._vAxis.dirty;	//	Boolean
	},
	isDataDirty: function(){
		//	summary:
		//		Returns whether or not any of this plot's data series need to be rendered.
		//	returns: Boolean
		//		Flag indicating if any of this plot's series are invalid and need rendering.
		return arr.some(this.series, function(item){ return item.dirty; });	//	Boolean
	},
	performZoom: function(dim, offsets){
		//	summary:
		//		Create/alter any zooming windows on this plot.
		//	dim: Object
		//		An object of the form { width, height }.
		//	offsets: Object
		//		An object of the form { l, r, t, b }.
		//	returns: dojox.charting.plot2d.Base
		//		A reference to this plot for functional chaining.

		// get current zooming various
		var vs = this._vAxis.scale || 1,
			hs = this._hAxis.scale || 1,
			vOffset = dim.height - offsets.b,
			hBounds = this._hScaler.bounds,
			xOffset = (hBounds.from - hBounds.lower) * hBounds.scale,
			vBounds = this._vScaler.bounds,
			yOffset = (vBounds.from - vBounds.lower) * vBounds.scale,
			// get incremental zooming various
			rVScale = vs / this.lastWindow.vscale,
			rHScale = hs / this.lastWindow.hscale,
			rXOffset = (this.lastWindow.xoffset - xOffset)/
				((this.lastWindow.hscale == 1)? hs : this.lastWindow.hscale),
			rYOffset = (yOffset - this.lastWindow.yoffset)/
				((this.lastWindow.vscale == 1)? vs : this.lastWindow.vscale),

			shape = this.group,
			anim = fx.animateTransform(lang.delegate({
				shape: shape,
				duration: 1200,
				transform:[
					{name:"translate", start:[0, 0], end: [offsets.l * (1 - rHScale), vOffset * (1 - rVScale)]},
					{name:"scale", start:[1, 1], end: [rHScale, rVScale]},
					{name:"original"},
					{name:"translate", start: [0, 0], end: [rXOffset, rYOffset]}
				]}, this.zoom));

		lang.mixin(this.lastWindow, {vscale: vs, hscale: hs, xoffset: xOffset, yoffset: yOffset});
		//add anim to zooming action queue,
		//in order to avoid several zooming action happened at the same time
		this.zoomQueue.push(anim);
		//perform each anim one by one in zoomQueue
		hub.connect(anim, "onEnd", this, function(){
			this.zoom = null;
			this.zoomQueue.shift();
			if(this.zoomQueue.length > 0){
				this.zoomQueue[0].play();
			}
		});
		if(this.zoomQueue.length == 1){
			this.zoomQueue[0].play();
		}
		return this;	//	dojox.charting.plot2d.Base
	},
	render: function(dim, offsets){
		//	summary:
		//		Render the plot on the chart.
		//	dim: Object
		//		An object of the form { width, height }.
		//	offsets: Object
		//		An object of the form { l, r, t, b }.
		//	returns: dojox.charting.plot2d.Base
		//		A reference to this plot for functional chaining.
		return this;	//	dojox.charting.plot2d.Base
	},
	getRequiredColors: function(){
		//	summary:
		//		Get how many data series we have, so we know how many colors to use.
		//	returns: Number
		//		The number of colors needed.
		return this.series.length;	//	Number
	},
	initializeScalers: function(dim, stats){
		//	summary:
		//		Initializes scalers using attached axes.
		//	dim: Object:
		//		Size of a plot area in pixels as {width, height}.
		//	stats: Object:
		//		Min/max of data in both directions as {hmin, hmax, vmin, vmax}.
		//	returns: dojox.charting.plot2d.Base
		//		A reference to this plot for functional chaining.
		if(this._hAxis){
			if(!this._hAxis.initialized()){
				this._hAxis.calculate(stats.hmin, stats.hmax, dim.width);
			}
			this._hScaler = this._hAxis.getScaler();
		}else{
			this._hScaler = primitive.buildScaler(stats.hmin, stats.hmax, dim.width);
		}
		if(this._vAxis){
			if(!this._vAxis.initialized()){
				this._vAxis.calculate(stats.vmin, stats.vmax, dim.height);
			}
			this._vScaler = this._vAxis.getScaler();
		}else{
			this._vScaler = primitive.buildScaler(stats.vmin, stats.vmax, dim.height);
		}
		return this;	//	dojox.charting.plot2d.Base
	}
});
});

},
'dojox/charting/plot2d/Default':function(){
define("dojox/charting/plot2d/Default", ["dojo/_base/lang", "dojo/_base/declare", "dojo/_base/array", 
		"./Base", "./common", "dojox/lang/functional", "dojox/lang/functional/reversed", "dojox/lang/utils", "dojox/gfx/fx"], 
	function(lang, declare, arr, Base, dc, df, dfr, du, fx){

	/*=====
	dojo.declare("dojox.charting.plot2d.__DefaultCtorArgs", dojox.charting.plot2d.__PlotCtorArgs, {
		//	summary:
		//		The arguments used for any/most plots.
	
		//	hAxis: String?
		//		The horizontal axis name.
		hAxis: "x",
	
		//	vAxis: String?
		//		The vertical axis name
		vAxis: "y",
	
		//	lines: Boolean?
		//		Whether or not to draw lines on this plot.  Defaults to true.
		lines:   true,
	
		//	areas: Boolean?
		//		Whether or not to draw areas on this plot. Defaults to false.
		areas:   false,
	
		//	markers: Boolean?
		//		Whether or not to draw markers at data points on this plot. Default is false.
		markers: false,
	
		//	tension: Number|String?
		//		Whether or not to apply 'tensioning' to the lines on this chart.
		//		Options include a number, "X", "x", or "S"; if a number is used, the
		//		simpler bezier curve calculations are used to draw the lines.  If X, x or S
		//		is used, the more accurate smoothing algorithm is used.
		tension: "",
	
		//	animate: Boolean?
		//		Whether or not to animate the chart to place.
		animate: false,
	
		//	stroke: dojox.gfx.Stroke?
		//		An optional stroke to use for any series on the plot.
		stroke:		{},
	
		//	outline: dojox.gfx.Stroke?
		//		An optional stroke used to outline any series on the plot.
		outline:	{},
	
		//	shadow: dojox.gfx.Stroke?
		//		An optional stroke to use to draw any shadows for a series on a plot.
		shadow:		{},
	
		//	fill: dojox.gfx.Fill?
		//		Any fill to be used for elements on the plot (such as areas).
		fill:		{},
	
		//	font: String?
		//		A font definition to be used for labels and other text-based elements on the plot.
		font:		"",
	
		//	fontColor: String|dojo.Color?
		//		The color to be used for any text-based elements on the plot.
		fontColor:	"",
	
		//	markerStroke: dojo.gfx.Stroke?
		//		An optional stroke to use for any markers on the plot.
		markerStroke:		{},
	
		//	markerOutline: dojo.gfx.Stroke?
		//		An optional outline to use for any markers on the plot.
		markerOutline:		{},
	
		//	markerShadow: dojo.gfx.Stroke?
		//		An optional shadow to use for any markers on the plot.
		markerShadow:		{},
	
		//	markerFill: dojo.gfx.Fill?
		//		An optional fill to use for any markers on the plot.
		markerFill:			{},
	
		//	markerFont: String?
		//		An optional font definition to use for any markers on the plot.
		markerFont:			"",
	
		//	markerFontColor: String|dojo.Color?
		//		An optional color to use for any marker text on the plot.
		markerFontColor:	"",
		
		//	enableCache: Boolean?
		//		Whether the markers are cached from one rendering to another. This improves the rendering performance of
		//		successive rendering but penalize the first rendering.  Default false.
		enableCache: false
	});
	
	var Base = dojox.charting.plot2d.Base;
=====*/

	var purgeGroup = dfr.lambda("item.purgeGroup()");

	var DEFAULT_ANIMATION_LENGTH = 1200;	// in ms

	return declare("dojox.charting.plot2d.Default", Base, {
		defaultParams: {
			hAxis: "x",		// use a horizontal axis named "x"
			vAxis: "y",		// use a vertical axis named "y"
			lines:   true,	// draw lines
			areas:   false,	// draw areas
			markers: false,	// draw markers
			tension: "",	// draw curved lines (tension is "X", "x", or "S")
			animate: false, // animate chart to place
			enableCache: false 
		},
		optionalParams: {
			// theme component
			stroke:		{},
			outline:	{},
			shadow:		{},
			fill:		{},
			font:		"",
			fontColor:	"",
			markerStroke:		{},
			markerOutline:		{},
			markerShadow:		{},
			markerFill:			{},
			markerFont:			"",
			markerFontColor:	""
		},

		constructor: function(chart, kwArgs){
			//	summary:
			//		Return a new plot.
			//	chart: dojox.charting.Chart
			//		The chart this plot belongs to.
			//	kwArgs: dojox.charting.plot2d.__DefaultCtorArgs?
			//		An optional arguments object to help define this plot.
			this.opt = lang.clone(this.defaultParams);
            du.updateWithObject(this.opt, kwArgs);
            du.updateWithPattern(this.opt, kwArgs, this.optionalParams);
			this.series = [];
			this.hAxis = this.opt.hAxis;
			this.vAxis = this.opt.vAxis;

			// animation properties
			this.animate = this.opt.animate;
		},

		createPath: function(run, creator, params){
			var path;
			if(this.opt.enableCache && run._pathFreePool.length > 0){
				path = run._pathFreePool.pop();
				path.setShape(params);
				// was cleared, add it back
				creator.add(path);
			}else{
				path = creator.createPath(params);
			}
			if(this.opt.enableCache){
				run._pathUsePool.push(path);
			}
			return path;
		},

		render: function(dim, offsets){
			//	summary:
			//		Render/draw everything on this plot.
			//	dim: Object
			//		An object of the form { width, height }
			//	offsets: Object
			//		An object of the form { l, r, t, b }
			//	returns: dojox.charting.plot2d.Default
			//		A reference to this plot for functional chaining.

			// make sure all the series is not modified
			if(this.zoom && !this.isDataDirty()){
				return this.performZoom(dim, offsets);
			}

			this.resetEvents();
			this.dirty = this.isDirty();
			if(this.dirty){
				arr.forEach(this.series, purgeGroup);
				this._eventSeries = {};
				this.cleanGroup();
				this.group.setTransform(null);
				var s = this.group;
				df.forEachRev(this.series, function(item){ item.cleanGroup(s); });
			}
			var t = this.chart.theme, stroke, outline, marker, events = this.events();

			for(var i = this.series.length - 1; i >= 0; --i){
				var run = this.series[i];
				if(!this.dirty && !run.dirty){
					t.skip();
					this._reconnectEvents(run.name);
					continue;
				}
				run.cleanGroup();
				if(this.opt.enableCache){
					run._pathFreePool = (run._pathFreePool?run._pathFreePool:[]).concat(run._pathUsePool?run._pathUsePool:[]);
					run._pathUsePool = [];
				}
				if(!run.data.length){
					run.dirty = false;
					t.skip();
					continue;
				}

				var theme = t.next(this.opt.areas ? "area" : "line", [this.opt, run], true),
					s = run.group, rsegments = [], startindexes = [], rseg = null, lpoly,
					ht = this._hScaler.scaler.getTransformerFromModel(this._hScaler),
					vt = this._vScaler.scaler.getTransformerFromModel(this._vScaler),
					eventSeries = this._eventSeries[run.name] = new Array(run.data.length);
				
				// optim works only for index based case
				var indexed = typeof run.data[0] == "number";
				var min = indexed?Math.max(0, Math.floor(this._hScaler.bounds.from - 1)):0, 
						max = indexed?Math.min(run.data.length, Math.ceil(this._hScaler.bounds.to)):run.data.length;

                // split the run data into dense segments (each containing no nulls)
                for(var j = min; j < max; j++){
                    if(run.data[j] != null){
                        if(!rseg){
                            rseg = [];
                            startindexes.push(j);
                            rsegments.push(rseg);
                        }
                        rseg.push(run.data[j]);
                    }else{
                        rseg = null;
                    }
                }

                for(var seg = 0; seg < rsegments.length; seg++){
					if(typeof rsegments[seg][0] == "number"){
						lpoly = arr.map(rsegments[seg], function(v, i){
							return {
								x: ht(i + startindexes[seg] + 1) + offsets.l,
								y: dim.height - offsets.b - vt(v)
							};
						}, this);
					}else{
						lpoly = arr.map(rsegments[seg], function(v, i){
							return {
								x: ht(v.x) + offsets.l,
								y: dim.height - offsets.b - vt(v.y)
							};
						}, this);
					}

					var lpath = this.opt.tension ? dc.curve(lpoly, this.opt.tension) : "";

					if(this.opt.areas && lpoly.length > 1){
						var fill = theme.series.fill;
						var apoly = lang.clone(lpoly);
						if(this.opt.tension){
							var apath = "L" + apoly[apoly.length-1].x + "," + (dim.height - offsets.b) +
								" L" + apoly[0].x + "," + (dim.height - offsets.b) +
								" L" + apoly[0].x + "," + apoly[0].y;
							run.dyn.fill = s.createPath(lpath + " " + apath).setFill(fill).getFill();
						} else {
							apoly.push({x: lpoly[lpoly.length - 1].x, y: dim.height - offsets.b});
							apoly.push({x: lpoly[0].x, y: dim.height - offsets.b});
							apoly.push(lpoly[0]);
							run.dyn.fill = s.createPolyline(apoly).setFill(fill).getFill();
						}
					}
					if(this.opt.lines || this.opt.markers){
						// need a stroke
						stroke = theme.series.stroke;
						if(theme.series.outline){
							outline = run.dyn.outline = dc.makeStroke(theme.series.outline);
							outline.width = 2 * outline.width + stroke.width;
						}
					}
					if(this.opt.markers){
						run.dyn.marker = theme.symbol;
					}
					var frontMarkers = null, outlineMarkers = null, shadowMarkers = null;
					if(stroke && theme.series.shadow && lpoly.length > 1){
						var shadow = theme.series.shadow,
							spoly = arr.map(lpoly, function(c){
								return {x: c.x + shadow.dx, y: c.y + shadow.dy};
							});
						if(this.opt.lines){
							if(this.opt.tension){
								run.dyn.shadow = s.createPath(dc.curve(spoly, this.opt.tension)).setStroke(shadow).getStroke();
							} else {
								run.dyn.shadow = s.createPolyline(spoly).setStroke(shadow).getStroke();
							}
						}
						if(this.opt.markers && theme.marker.shadow){
							shadow = theme.marker.shadow;
							shadowMarkers = arr.map(spoly, function(c){
								return this.createPath(run, s, "M" + c.x + " " + c.y + " " + theme.symbol).
									setStroke(shadow).setFill(shadow.color);
							}, this);
						}
					}
					if(this.opt.lines && lpoly.length > 1){
						if(outline){
							if(this.opt.tension){
								run.dyn.outline = s.createPath(lpath).setStroke(outline).getStroke();
							} else {
								run.dyn.outline = s.createPolyline(lpoly).setStroke(outline).getStroke();
							}
						}
						if(this.opt.tension){
							run.dyn.stroke = s.createPath(lpath).setStroke(stroke).getStroke();
						} else {
							run.dyn.stroke = s.createPolyline(lpoly).setStroke(stroke).getStroke();
						}
					}
					if(this.opt.markers){
						frontMarkers = new Array(lpoly.length);
						outlineMarkers = new Array(lpoly.length);
						outline = null;
						if(theme.marker.outline){
							outline = dc.makeStroke(theme.marker.outline);
							outline.width = 2 * outline.width + (theme.marker.stroke ? theme.marker.stroke.width : 0);
						}
						arr.forEach(lpoly, function(c, i){
							var path = "M" + c.x + " " + c.y + " " + theme.symbol;
							if(outline){
								outlineMarkers[i] = this.createPath(run, s, path).setStroke(outline);
							}
							frontMarkers[i] = this.createPath(run, s, path).setStroke(theme.marker.stroke).setFill(theme.marker.fill);
						}, this);
						run.dyn.markerFill = theme.marker.fill;
						run.dyn.markerStroke = theme.marker.stroke;
						if(events){
							arr.forEach(frontMarkers, function(s, i){
								var o = {
									element: "marker",
									index:   i + startindexes[seg],
									run:     run,
									shape:   s,
									outline: outlineMarkers[i] || null,
									shadow:  shadowMarkers && shadowMarkers[i] || null,
									cx:      lpoly[i].x,
									cy:      lpoly[i].y
								};
								if(typeof rsegments[seg][0] == "number"){
									o.x = i + startindexes[seg] + 1;
									o.y = rsegments[seg][i];
								}else{
									o.x = rsegments[seg][i].x;
									o.y = rsegments[seg][i].y;
								}
								this._connectEvents(o);
								eventSeries[i + startindexes[seg]] = o;
							}, this);
						}else{
							delete this._eventSeries[run.name];
						}
					}
                }
				run.dirty = false;
			}
			if(this.animate){
				// grow from the bottom
				var plotGroup = this.group;
				fx.animateTransform(lang.delegate({
					shape: plotGroup,
					duration: DEFAULT_ANIMATION_LENGTH,
					transform:[
						{name:"translate", start: [0, dim.height - offsets.b], end: [0, 0]},
						{name:"scale", start: [1, 0], end:[1, 1]},
						{name:"original"}
					]
				}, this.animate)).play();
			}
			this.dirty = false;
			return this;	//	dojox.charting.plot2d.Default
		}
	});
});

},
'dojox/charting/plot2d/StackedLines':function(){
define("dojox/charting/plot2d/StackedLines", ["dojo/_base/declare", "./Stacked"], function(declare, Stacked){
/*=====
var Stacked = dojox.charting.plot2d.Stacked;
=====*/
	return declare("dojox.charting.plot2d.StackedLines", Stacked, {
		//	summary:
		//		A convenience object to create a stacked line chart.
		constructor: function(){
			//	summary:
			//		Force our Stacked base to be lines only.
			this.opt.lines = true;
		}
	});
});

},
'dojox/color/Palette':function(){
define("dojox/color/Palette", ["dojo/_base/kernel", "../main", "dojo/_base/lang", "dojo/_base/array", "./_base"], 
	function(dojo, dojox, lang, arr, dxc){

	/***************************************************************
	*	dojox.color.Palette
	*
	*	The Palette object is loosely based on the color palettes
	*	at Kuler (http://kuler.adobe.com).  They are 5 color palettes
	*	with the base color considered to be the third color in the
	*	palette (for generation purposes).
	*
	*	Palettes can be generated from well-known algorithms or they
	* 	can be manually created by passing an array to the constructor.
	*
	*	Palettes can be transformed, using a set of specific params
	*	similar to the way shapes can be transformed with dojox.gfx.
	*	However, unlike with transformations in dojox.gfx, transforming
	* 	a palette will return you a new Palette object, in effect
	* 	a clone of the original.
	***************************************************************/

	//	ctor ----------------------------------------------------------------------------
	dxc.Palette = function(/* String|Array|dojox.color.Color|dojox.color.Palette */base){
		//	summary:
		//		An object that represents a palette of colors.
		//	description:
		//		A Palette is a representation of a set of colors.  While the standard
		//		number of colors contained in a palette is 5, it can really handle any
		//		number of colors.
		//
		//		A palette is useful for the ability to transform all the colors in it
		//		using a simple object-based approach.  In addition, you can generate
		//		palettes using dojox.color.Palette.generate; these generated palettes
		//		are based on the palette generators at http://kuler.adobe.com.
		//
		//	colors: dojox.color.Color[]
		//		The actual color references in this palette.
		this.colors = [];
		if(base instanceof dxc.Palette){
			this.colors = base.colors.slice(0);
		}
		else if(base instanceof dxc.Color){
			this.colors = [ null, null, base, null, null ];
		}
		else if(lang.isArray(base)){
			this.colors = arr.map(base.slice(0), function(item){
				if(lang.isString(item)){ return new dxc.Color(item); }
				return item;
			});
		}
		else if (lang.isString(base)){
			this.colors = [ null, null, new dxc.Color(base), null, null ];
		}
	}

	//	private functions ---------------------------------------------------------------

	//	transformations
	function tRGBA(p, param, val){
		var ret = new dxc.Palette();
		ret.colors = [];
		arr.forEach(p.colors, function(item){
			var r=(param=="dr")?item.r+val:item.r,
				g=(param=="dg")?item.g+val:item.g,
				b=(param=="db")?item.b+val:item.b,
				a=(param=="da")?item.a+val:item.a
			ret.colors.push(new dxc.Color({
				r: Math.min(255, Math.max(0, r)),
				g: Math.min(255, Math.max(0, g)),
				b: Math.min(255, Math.max(0, b)),
				a: Math.min(1, Math.max(0, a))
			}));
		});
		return ret;
	}

	function tCMY(p, param, val){
		var ret = new dxc.Palette();
		ret.colors = [];
		arr.forEach(p.colors, function(item){
			var o=item.toCmy(),
				c=(param=="dc")?o.c+val:o.c,
				m=(param=="dm")?o.m+val:o.m,
				y=(param=="dy")?o.y+val:o.y;
			ret.colors.push(dxc.fromCmy(
				Math.min(100, Math.max(0, c)),
				Math.min(100, Math.max(0, m)),
				Math.min(100, Math.max(0, y))
			));
		});
		return ret;
	}

	function tCMYK(p, param, val){
		var ret = new dxc.Palette();
		ret.colors = [];
		arr.forEach(p.colors, function(item){
			var o=item.toCmyk(),
				c=(param=="dc")?o.c+val:o.c,
				m=(param=="dm")?o.m+val:o.m,
				y=(param=="dy")?o.y+val:o.y,
				k=(param=="dk")?o.b+val:o.b;
			ret.colors.push(dxc.fromCmyk(
				Math.min(100, Math.max(0, c)),
				Math.min(100, Math.max(0, m)),
				Math.min(100, Math.max(0, y)),
				Math.min(100, Math.max(0, k))
			));
		});
		return ret;
	}

	function tHSL(p, param, val){
		var ret = new dxc.Palette();
		ret.colors = [];
		arr.forEach(p.colors, function(item){
			var o=item.toHsl(),
				h=(param=="dh")?o.h+val:o.h,
				s=(param=="ds")?o.s+val:o.s,
				l=(param=="dl")?o.l+val:o.l;
			ret.colors.push(dxc.fromHsl(h%360, Math.min(100, Math.max(0, s)), Math.min(100, Math.max(0, l))));
		});
		return ret;
	}

	function tHSV(p, param, val){
		var ret = new dxc.Palette();
		ret.colors = [];
		arr.forEach(p.colors, function(item){
			var o=item.toHsv(),
				h=(param=="dh")?o.h+val:o.h,
				s=(param=="ds")?o.s+val:o.s,
				v=(param=="dv")?o.v+val:o.v;
			ret.colors.push(dxc.fromHsv(h%360, Math.min(100, Math.max(0, s)), Math.min(100, Math.max(0, v))));
		});
		return ret;
	}

	//	helper functions
	function rangeDiff(val, low, high){
		//	given the value in a range from 0 to high, find the equiv
		//		using the range low to high.
		return high-((high-val)*((high-low)/high));
	}

	//	object methods ---------------------------------------------------------------
	lang.extend(dxc.Palette, {
		transform: function(/* dojox.color.Palette.__transformArgs */kwArgs){
			//	summary:
			//		Transform the palette using a specific transformation function
			//		and a set of transformation parameters.
			//	description:
			//		{palette}.transform is a simple way to uniformly transform
			//		all of the colors in a palette using any of 5 formulae:
			//		RGBA, HSL, HSV, CMYK or CMY.
			//
			//		Once the forumula to be used is determined, you can pass any
			//		number of parameters based on the formula "d"[param]; for instance,
			//		{ use: "rgba", dr: 20, dg: -50 } will take all of the colors in
			//		palette, add 20 to the R value and subtract 50 from the G value.
			//
			//		Unlike other types of transformations, transform does *not* alter
			//		the original palette but will instead return a new one.
			var fn=tRGBA;	//	the default transform function.
			if(kwArgs.use){
				//	we are being specific about the algo we want to use.
				var use=kwArgs.use.toLowerCase();
				if(use.indexOf("hs")==0){
					if(use.charAt(2)=="l"){ fn=tHSL; }
					else { fn=tHSV; }
				}
				else if(use.indexOf("cmy")==0){
					if(use.charAt(3)=="k"){ fn=tCMYK; }
					else { fn=tCMY; }
				}
			}
			//	try to guess the best choice.
			else if("dc" in kwArgs || "dm" in kwArgs || "dy" in kwArgs){
				if("dk" in kwArgs){ fn = tCMYK; }
				else { fn = tCMY; }
			}
			else if("dh" in kwArgs || "ds" in kwArgs){
				if("dv" in kwArgs){ fn = tHSV; }
				else { fn = tHSL; }
			}

			var palette = this;
			for(var p in kwArgs){
				//	ignore use
				if(p=="use"){ continue; }
				palette = fn(palette, p, kwArgs[p]);
			}
			return palette;		//	dojox.color.Palette
		},
		clone: function(){
			//	summary:
			//		Clones the current palette.
			return new dxc.Palette(this);	//	dojox.color.Palette
		}
	});

/*=====
dojox.color.Palette.__transformArgs = function(use, dr, dg, db, da, dc, dm, dy, dk, dh, ds, dv, dl){
	//	summary:
	//		The keywords argument to be passed to the dojox.color.Palette.transform function.  Note that
	//		while all arguments are optional, *some* arguments must be passed.  The basic concept is that
	//		you pass a delta value for a specific aspect of a color model (or multiple aspects of the same
	//		color model); for instance, if you wish to transform a palette based on the HSV color model,
	//		you would pass one of "dh", "ds", or "dv" as a value.
	//
	//	use: String?
	//		Specify the color model to use for the transformation.  Can be "rgb", "rgba", "hsv", "hsl", "cmy", "cmyk".
	//	dr: Number?
	//		The delta to be applied to the red aspect of the RGB/RGBA color model.
	//	dg: Number?
	//		The delta to be applied to the green aspect of the RGB/RGBA color model.
	//	db: Number?
	//		The delta to be applied to the blue aspect of the RGB/RGBA color model.
	//	da: Number?
	//		The delta to be applied to the alpha aspect of the RGBA color model.
	//	dc: Number?
	//		The delta to be applied to the cyan aspect of the CMY/CMYK color model.
	//	dm: Number?
	//		The delta to be applied to the magenta aspect of the CMY/CMYK color model.
	//	dy: Number?
	//		The delta to be applied to the yellow aspect of the CMY/CMYK color model.
	//	dk: Number?
	//		The delta to be applied to the black aspect of the CMYK color model.
	//	dh: Number?
	//		The delta to be applied to the hue aspect of the HSL/HSV color model.
	//	ds: Number?
	//		The delta to be applied to the saturation aspect of the HSL/HSV color model.
	//	dl: Number?
	//		The delta to be applied to the luminosity aspect of the HSL color model.
	//	dv: Number?
	//		The delta to be applied to the value aspect of the HSV color model.
	this.use = use;
	this.dr = dr;
	this.dg = dg;
	this.db = db;
	this.da = da;
	this.dc = dc;
	this.dm = dm;
	this.dy = dy;
	this.dk = dk;
	this.dh = dh;
	this.ds = ds;
	this.dl = dl;
	this.dv = dv;
}
dojox.color.Palette.__generatorArgs = function(base){
	//	summary:
	//		The keyword arguments object used to create a palette based on a base color.
	//
	//	base: dojo.Color
	//		The base color to be used to generate the palette.
	this.base = base;
}
dojox.color.Palette.__analogousArgs = function(base, high, low){
	//	summary:
	//		The keyword arguments object that is used to create a 5 color palette based on the
	//		analogous rules as implemented at http://kuler.adobe.com, using the HSV color model.
	//
	//	base: dojo.Color
	//		The base color to be used to generate the palette.
	//	high: Number?
	//		The difference between the hue of the base color and the highest hue.  In degrees, default is 60.
	//	low: Number?
	//		The difference between the hue of the base color and the lowest hue.  In degrees, default is 18.
	this.base = base;
	this.high = high;
	this.low = low;
}
dojox.color.Palette.__splitComplementaryArgs = function(base, da){
	//	summary:
	//		The keyword arguments object used to create a palette based on the split complementary rules
	//		as implemented at http://kuler.adobe.com.
	//
	//	base: dojo.Color
	//		The base color to be used to generate the palette.
	//	da: Number?
	//		The delta angle to be used to determine where the split for the complementary rules happen.
	//		In degrees, the default is 30.
	this.base = base;
	this.da = da;
}
=====*/
	lang.mixin(dxc.Palette, {
		generators: {
			analogous:function(/* dojox.color.Palette.__analogousArgs */args){
				//	summary:
				//		Create a 5 color palette based on the analogous rules as implemented at
				//		http://kuler.adobe.com.
				var high=args.high||60, 	//	delta between base hue and highest hue (subtracted from base)
					low=args.low||18,		//	delta between base hue and lowest hue (added to base)
					base = lang.isString(args.base)?new dxc.Color(args.base):args.base,
					hsv=base.toHsv();

				//	generate our hue angle differences
				var h=[
					(hsv.h+low+360)%360,
					(hsv.h+Math.round(low/2)+360)%360,
					hsv.h,
					(hsv.h-Math.round(high/2)+360)%360,
					(hsv.h-high+360)%360
				];

				var s1=Math.max(10, (hsv.s<=95)?hsv.s+5:(100-(hsv.s-95))),
					s2=(hsv.s>1)?hsv.s-1:21-hsv.s,
					v1=(hsv.v>=92)?hsv.v-9:Math.max(hsv.v+9, 20),
					v2=(hsv.v<=90)?Math.max(hsv.v+5, 20):(95+Math.ceil((hsv.v-90)/2)),
					s=[ s1, s2, hsv.s, s1, s1 ],
					v=[ v1, v2, hsv.v, v1, v2 ]

				return new dxc.Palette(arr.map(h, function(hue, i){
					return dxc.fromHsv(hue, s[i], v[i]);
				}));		//	dojox.color.Palette
			},

			monochromatic: function(/* dojox.color.Palette.__generatorArgs */args){
				//	summary:
				//		Create a 5 color palette based on the monochromatic rules as implemented at
				//		http://kuler.adobe.com.
				var base = lang.isString(args.base)?new dxc.Color(args.base):args.base,
					hsv = base.toHsv();
				
				//	figure out the saturation and value
				var s1 = (hsv.s-30>9)?hsv.s-30:hsv.s+30,
					s2 = hsv.s,
					v1 = rangeDiff(hsv.v, 20, 100),
					v2 = (hsv.v-20>20)?hsv.v-20:hsv.v+60,
					v3 = (hsv.v-50>20)?hsv.v-50:hsv.v+30;

				return new dxc.Palette([
					dxc.fromHsv(hsv.h, s1, v1),
					dxc.fromHsv(hsv.h, s2, v3),
					base,
					dxc.fromHsv(hsv.h, s1, v3),
					dxc.fromHsv(hsv.h, s2, v2)
				]);		//	dojox.color.Palette
			},

			triadic: function(/* dojox.color.Palette.__generatorArgs */args){
				//	summary:
				//		Create a 5 color palette based on the triadic rules as implemented at
				//		http://kuler.adobe.com.
				var base = lang.isString(args.base)?new dxc.Color(args.base):args.base,
					hsv = base.toHsv();

				var h1 = (hsv.h+57+360)%360,
					h2 = (hsv.h-157+360)%360,
					s1 = (hsv.s>20)?hsv.s-10:hsv.s+10,
					s2 = (hsv.s>90)?hsv.s-10:hsv.s+10,
					s3 = (hsv.s>95)?hsv.s-5:hsv.s+5,
					v1 = (hsv.v-20>20)?hsv.v-20:hsv.v+20,
					v2 = (hsv.v-30>20)?hsv.v-30:hsv.v+30,
					v3 = (hsv.v-30>70)?hsv.v-30:hsv.v+30;

				return new dxc.Palette([
					dxc.fromHsv(h1, s1, hsv.v),
					dxc.fromHsv(hsv.h, s2, v2),
					base,
					dxc.fromHsv(h2, s2, v1),
					dxc.fromHsv(h2, s3, v3)
				]);		//	dojox.color.Palette
			},

			complementary: function(/* dojox.color.Palette.__generatorArgs */args){
				//	summary:
				//		Create a 5 color palette based on the complementary rules as implemented at
				//		http://kuler.adobe.com.
				var base = lang.isString(args.base)?new dxc.Color(args.base):args.base,
					hsv = base.toHsv();

				var h1 = ((hsv.h*2)+137<360)?(hsv.h*2)+137:Math.floor(hsv.h/2)-137,
					s1 = Math.max(hsv.s-10, 0),
					s2 = rangeDiff(hsv.s, 10, 100),
					s3 = Math.min(100, hsv.s+20),
					v1 = Math.min(100, hsv.v+30),
					v2 = (hsv.v>20)?hsv.v-30:hsv.v+30;

				return new dxc.Palette([
					dxc.fromHsv(hsv.h, s1, v1),
					dxc.fromHsv(hsv.h, s2, v2),
					base,
					dxc.fromHsv(h1, s3, v2),
					dxc.fromHsv(h1, hsv.s, hsv.v)
				]);		//	dojox.color.Palette
			},

			splitComplementary: function(/* dojox.color.Palette.__splitComplementaryArgs */args){
				//	summary:
				//		Create a 5 color palette based on the split complementary rules as implemented at
				//		http://kuler.adobe.com.
				var base = lang.isString(args.base)?new dxc.Color(args.base):args.base,
					dangle = args.da || 30,
					hsv = base.toHsv();

				var baseh = ((hsv.h*2)+137<360)?(hsv.h*2)+137:Math.floor(hsv.h/2)-137,
					h1 = (baseh-dangle+360)%360,
					h2 = (baseh+dangle)%360,
					s1 = Math.max(hsv.s-10, 0),
					s2 = rangeDiff(hsv.s, 10, 100),
					s3 = Math.min(100, hsv.s+20),
					v1 = Math.min(100, hsv.v+30),
					v2 = (hsv.v>20)?hsv.v-30:hsv.v+30;

				return new dxc.Palette([
					dxc.fromHsv(h1, s1, v1),
					dxc.fromHsv(h1, s2, v2),
					base,
					dxc.fromHsv(h2, s3, v2),
					dxc.fromHsv(h2, hsv.s, hsv.v)
				]);		//	dojox.color.Palette
			},

			compound: function(/* dojox.color.Palette.__generatorArgs */args){
				//	summary:
				//		Create a 5 color palette based on the compound rules as implemented at
				//		http://kuler.adobe.com.
				var base = lang.isString(args.base)?new dxc.Color(args.base):args.base,
					hsv = base.toHsv();

				var h1 = ((hsv.h*2)+18<360)?(hsv.h*2)+18:Math.floor(hsv.h/2)-18,
					h2 = ((hsv.h*2)+120<360)?(hsv.h*2)+120:Math.floor(hsv.h/2)-120,
					h3 = ((hsv.h*2)+99<360)?(hsv.h*2)+99:Math.floor(hsv.h/2)-99,
					s1 = (hsv.s-40>10)?hsv.s-40:hsv.s+40,
					s2 = (hsv.s-10>80)?hsv.s-10:hsv.s+10,
					s3 = (hsv.s-25>10)?hsv.s-25:hsv.s+25,
					v1 = (hsv.v-40>10)?hsv.v-40:hsv.v+40,
					v2 = (hsv.v-20>80)?hsv.v-20:hsv.v+20,
					v3 = Math.max(hsv.v, 20);

				return new dxc.Palette([
					dxc.fromHsv(h1, s1, v1),
					dxc.fromHsv(h1, s2, v2),
					base,
					dxc.fromHsv(h2, s3, v3),
					dxc.fromHsv(h3, s2, v2)
				]);		//	dojox.color.Palette
			},

			shades: function(/* dojox.color.Palette.__generatorArgs */args){
				//	summary:
				//		Create a 5 color palette based on the shades rules as implemented at
				//		http://kuler.adobe.com.
				var base = lang.isString(args.base)?new dxc.Color(args.base):args.base,
					hsv = base.toHsv();

				var s  = (hsv.s==100 && hsv.v==0)?0:hsv.s,
					v1 = (hsv.v-50>20)?hsv.v-50:hsv.v+30,
					v2 = (hsv.v-25>=20)?hsv.v-25:hsv.v+55,
					v3 = (hsv.v-75>=20)?hsv.v-75:hsv.v+5,
					v4 = Math.max(hsv.v-10, 20);

				return new dxc.Palette([
					new dxc.fromHsv(hsv.h, s, v1),
					new dxc.fromHsv(hsv.h, s, v2),
					base,
					new dxc.fromHsv(hsv.h, s, v3),
					new dxc.fromHsv(hsv.h, s, v4)
				]);		//	dojox.color.Palette
			}
		},
		generate: function(/* String|dojox.color.Color */base, /* Function|String */type){
			//	summary:
			//		Generate a new Palette using any of the named functions in
			//		dojox.color.Palette.generators or an optional function definition.  Current
			//		generators include "analogous", "monochromatic", "triadic", "complementary",
			//		"splitComplementary", and "shades".
			if(lang.isFunction(type)){
				return type({ base: base });	//	dojox.color.Palette
			}
			else if(dxc.Palette.generators[type]){
				return dxc.Palette.generators[type]({ base: base });	//	dojox.color.Palette
			}
			throw new Error("dojox.color.Palette.generate: the specified generator ('" + type + "') does not exist.");
		}
	});
	
	return dxc.Palette;
});

},
'url:dijit/templates/Tooltip.html':"<div class=\"dijitTooltip dijitTooltipLeft\" id=\"dojoTooltip\"\r\n\t><div class=\"dijitTooltipContainer dijitTooltipContents\" data-dojo-attach-point=\"containerNode\" role='alert'></div\r\n\t><div class=\"dijitTooltipConnector\" data-dojo-attach-point=\"connectorNode\"></div\r\n></div>\r\n",
'dojox/charting/axis2d/common':function(){
define("dojox/charting/axis2d/common", ["dojo/_base/lang", "dojo/_base/html", "dojo/_base/window", "dojo/dom-geometry", "dojox/gfx"], 
	function(lang, html, win, domGeom, g){

	var common = lang.getObject("dojox.charting.axis2d.common", true);
	
	var clearNode = function(s){
		s.marginLeft   = "0px";
		s.marginTop    = "0px";
		s.marginRight  = "0px";
		s.marginBottom = "0px";
		s.paddingLeft   = "0px";
		s.paddingTop    = "0px";
		s.paddingRight  = "0px";
		s.paddingBottom = "0px";
		s.borderLeftWidth   = "0px";
		s.borderTopWidth    = "0px";
		s.borderRightWidth  = "0px";
		s.borderBottomWidth = "0px";
	};

	var getBoxWidth = function(n){
		// marginBox is incredibly slow, so avoid it if we can
		if(n["getBoundingClientRect"]){
			var bcr = n.getBoundingClientRect();
			return bcr.width || (bcr.right - bcr.left);
		}else{
			return domGeom.getMarginBox(n).w;
		}
	};

	return lang.mixin(common, {
		//	summary:
		//		Common methods to be used by any axis.  This is considered "static".
		createText: {
			gfx: function(chart, creator, x, y, align, text, font, fontColor){
				//	summary:
				//		Use dojox.gfx to create any text.
				//	chart: dojox.charting.Chart
				//		The chart to create the text into.
				//	creator: dojox.gfx.Surface
				//		The graphics surface to use for creating the text.
				//	x: Number
				//		Where to create the text along the x axis (CSS left).
				//	y: Number
				//		Where to create the text along the y axis (CSS top).
				//	align: String
				//		How to align the text.  Can be "left", "right", "center".
				//	text: String
				//		The text to render.
				//	font: String
				//		The font definition, a la CSS "font".
				//	fontColor: String|dojo.Color
				//		The color of the resultant text.
				//	returns: dojox.gfx.Text
				//		The resultant GFX object.
				return creator.createText({
					x: x, y: y, text: text, align: align
				}).setFont(font).setFill(fontColor);	//	dojox.gfx.Text
			},
			html: function(chart, creator, x, y, align, text, font, fontColor, labelWidth){
				//	summary:
				//		Use the HTML DOM to create any text.
				//	chart: dojox.charting.Chart
				//		The chart to create the text into.
				//	creator: dojox.gfx.Surface
				//		The graphics surface to use for creating the text.
				//	x: Number
				//		Where to create the text along the x axis (CSS left).
				//	y: Number
				//		Where to create the text along the y axis (CSS top).
				//	align: String
				//		How to align the text.  Can be "left", "right", "center".
				//	text: String
				//		The text to render.
				//	font: String
				//		The font definition, a la CSS "font".
				//	fontColor: String|dojo.Color
				//		The color of the resultant text.
				//	labelWidth: Number?
				//		The maximum width of the resultant DOM node.
				//	returns: DOMNode
				//		The resultant DOMNode (a "div" element).

				// setup the text node
				var p = win.doc.createElement("div"), s = p.style, boxWidth;
				// bidi support, if this function exists the module was loaded 
				if(chart.getTextDir){
					p.dir = chart.getTextDir(text);
				}
				clearNode(s);
				s.font = font;
				p.innerHTML = String(text).replace(/\s/g, "&nbsp;");
				s.color = fontColor;
				// measure the size
				s.position = "absolute";
				s.left = "-10000px";
				win.body().appendChild(p);
				var size = g.normalizedLength(g.splitFontString(font).size);

				// do we need to calculate the label width?
				if(!labelWidth){
					boxWidth = getBoxWidth(p);
				}
				// when the textDir is rtl, but the UI ltr needs
				// to recalculate the starting point
				if(p.dir == "rtl"){
					x += labelWidth ? labelWidth : boxWidth;
				}

				// new settings for the text node
				win.body().removeChild(p);

				s.position = "relative";
				if(labelWidth){
					s.width = labelWidth + "px";
					// s.border = "1px dotted grey";
					switch(align){
						case "middle":
							s.textAlign = "center";
							s.left = (x - labelWidth / 2) + "px";
							break;
						case "end":
							s.textAlign = "right";
							s.left = (x - labelWidth) + "px";
							break;
						default:
							s.left = x + "px";
							s.textAlign = "left";
							break;
					}
				}else{
					switch(align){
						case "middle":
							s.left = Math.floor(x - boxWidth / 2) + "px";
							// s.left = Math.floor(x - p.offsetWidth / 2) + "px";
							break;
						case "end":
							s.left = Math.floor(x - boxWidth) + "px";
							// s.left = Math.floor(x - p.offsetWidth) + "px";
							break;
						//case "start":
						default:
							s.left = Math.floor(x) + "px";
							break;
					}
				}
				s.top = Math.floor(y - size) + "px";
				s.whiteSpace = "nowrap";	// hack for WebKit
				// setup the wrapper node
				var wrap = win.doc.createElement("div"), w = wrap.style;
				clearNode(w);
				w.width = "0px";
				w.height = "0px";
				// insert nodes
				wrap.appendChild(p)
				chart.node.insertBefore(wrap, chart.node.firstChild);
				return wrap;	//	DOMNode
			}
		}
	});
});

},
'dojo/fx/easing':function(){
define(["../_base/lang"], function(lang) {
// module:
//		dojo/fx/easing
// summary:
//		This module defines standard easing functions that are useful for animations.

var easingFuncs = /*===== dojo.fx.easing= =====*/ {
	// summary:
	//		Collection of easing functions to use beyond the default
	//		`dojo._defaultEasing` function.
	//
	// description:
	//
	//		Easing functions are used to manipulate the iteration through
	//		an `dojo.Animation`s _Line. _Line being the properties of an Animation,
	//		and the easing function progresses through that Line determing
	//		how quickly (or slowly) it should go. Or more accurately: modify
	//		the value of the _Line based on the percentage of animation completed.
	//
	//		All functions follow a simple naming convention of "ease type" + "when".
	//		If the name of the function ends in Out, the easing described appears
	//		towards the end of the animation. "In" means during the beginning,
	//		and InOut means both ranges of the Animation will applied, both
	//		beginning and end.
	//
	//		One does not call the easing function directly, it must be passed to
	//		the `easing` property of an animation.
	//
	//	example:
	//	|	dojo.require("dojo.fx.easing");
	//	|	var anim = dojo.fadeOut({
	//	|		node: 'node',
	//	|		duration: 2000,
	//	|		//	note there is no ()
	//	|		easing: dojo.fx.easing.quadIn
	//	|	}).play();
	//

	linear: function(/* Decimal? */n){
		// summary: A linear easing function
		return n;
	},

	quadIn: function(/* Decimal? */n){
		return Math.pow(n, 2);
	},

	quadOut: function(/* Decimal? */n){
		return n * (n - 2) * -1;
	},

	quadInOut: function(/* Decimal? */n){
		n = n * 2;
		if(n < 1){ return Math.pow(n, 2) / 2; }
		return -1 * ((--n) * (n - 2) - 1) / 2;
	},

	cubicIn: function(/* Decimal? */n){
		return Math.pow(n, 3);
	},

	cubicOut: function(/* Decimal? */n){
		return Math.pow(n - 1, 3) + 1;
	},

	cubicInOut: function(/* Decimal? */n){
		n = n * 2;
		if(n < 1){ return Math.pow(n, 3) / 2; }
		n -= 2;
		return (Math.pow(n, 3) + 2) / 2;
	},

	quartIn: function(/* Decimal? */n){
		return Math.pow(n, 4);
	},

	quartOut: function(/* Decimal? */n){
		return -1 * (Math.pow(n - 1, 4) - 1);
	},

	quartInOut: function(/* Decimal? */n){
		n = n * 2;
		if(n < 1){ return Math.pow(n, 4) / 2; }
		n -= 2;
		return -1 / 2 * (Math.pow(n, 4) - 2);
	},

	quintIn: function(/* Decimal? */n){
		return Math.pow(n, 5);
	},

	quintOut: function(/* Decimal? */n){
		return Math.pow(n - 1, 5) + 1;
	},

	quintInOut: function(/* Decimal? */n){
		n = n * 2;
		if(n < 1){ return Math.pow(n, 5) / 2; }
		n -= 2;
		return (Math.pow(n, 5) + 2) / 2;
	},

	sineIn: function(/* Decimal? */n){
		return -1 * Math.cos(n * (Math.PI / 2)) + 1;
	},

	sineOut: function(/* Decimal? */n){
		return Math.sin(n * (Math.PI / 2));
	},

	sineInOut: function(/* Decimal? */n){
		return -1 * (Math.cos(Math.PI * n) - 1) / 2;
	},

	expoIn: function(/* Decimal? */n){
		return (n == 0) ? 0 : Math.pow(2, 10 * (n - 1));
	},

	expoOut: function(/* Decimal? */n){
		return (n == 1) ? 1 : (-1 * Math.pow(2, -10 * n) + 1);
	},

	expoInOut: function(/* Decimal? */n){
		if(n == 0){ return 0; }
		if(n == 1){ return 1; }
		n = n * 2;
		if(n < 1){ return Math.pow(2, 10 * (n - 1)) / 2; }
		--n;
		return (-1 * Math.pow(2, -10 * n) + 2) / 2;
	},

	circIn: function(/* Decimal? */n){
		return -1 * (Math.sqrt(1 - Math.pow(n, 2)) - 1);
	},

	circOut: function(/* Decimal? */n){
		n = n - 1;
		return Math.sqrt(1 - Math.pow(n, 2));
	},

	circInOut: function(/* Decimal? */n){
		n = n * 2;
		if(n < 1){ return -1 / 2 * (Math.sqrt(1 - Math.pow(n, 2)) - 1); }
		n -= 2;
		return 1 / 2 * (Math.sqrt(1 - Math.pow(n, 2)) + 1);
	},

	backIn: function(/* Decimal? */n){
		// summary:
		//		An easing function that starts away from the target,
		//		and quickly accelerates towards the end value.
		//
		//		Use caution when the easing will cause values to become
		//		negative as some properties cannot be set to negative values.
		var s = 1.70158;
		return Math.pow(n, 2) * ((s + 1) * n - s);
	},

	backOut: function(/* Decimal? */n){
		// summary:
		//		An easing function that pops past the range briefly, and slowly comes back.
		//
		// description:
		//		An easing function that pops past the range briefly, and slowly comes back.
		//
		//		Use caution when the easing will cause values to become negative as some
		//		properties cannot be set to negative values.

		n = n - 1;
		var s = 1.70158;
		return Math.pow(n, 2) * ((s + 1) * n + s) + 1;
	},

	backInOut: function(/* Decimal? */n){
		// summary:
		//		An easing function combining the effects of `backIn` and `backOut`
		//
		// description:
		//		An easing function combining the effects of `backIn` and `backOut`.
		//		Use caution when the easing will cause values to become negative
		//		as some properties cannot be set to negative values.
		var s = 1.70158 * 1.525;
		n = n * 2;
		if(n < 1){ return (Math.pow(n, 2) * ((s + 1) * n - s)) / 2; }
		n-=2;
		return (Math.pow(n, 2) * ((s + 1) * n + s) + 2) / 2;
	},

	elasticIn: function(/* Decimal? */n){
		// summary:
		//		An easing function the elastically snaps from the start value
		//
		// description:
		//		An easing function the elastically snaps from the start value
		//
		//		Use caution when the elasticity will cause values to become negative
		//		as some properties cannot be set to negative values.
		if(n == 0 || n == 1){ return n; }
		var p = .3;
		var s = p / 4;
		n = n - 1;
		return -1 * Math.pow(2, 10 * n) * Math.sin((n - s) * (2 * Math.PI) / p);
	},

	elasticOut: function(/* Decimal? */n){
		// summary:
		//		An easing function that elasticly snaps around the target value,
		//		near the end of the Animation
		//
		// description:
		//		An easing function that elasticly snaps around the target value,
		//		near the end of the Animation
		//
		//		Use caution when the elasticity will cause values to become
		//		negative as some properties cannot be set to negative values.
		if(n==0 || n == 1){ return n; }
		var p = .3;
		var s = p / 4;
		return Math.pow(2, -10 * n) * Math.sin((n - s) * (2 * Math.PI) / p) + 1;
	},

	elasticInOut: function(/* Decimal? */n){
		// summary:
		//		An easing function that elasticly snaps around the value, near
		//		the beginning and end of the Animation.
		//
		// description:
		//		An easing function that elasticly snaps around the value, near
		//		the beginning and end of the Animation.
		//
		//		Use caution when the elasticity will cause values to become
		//		negative as some properties cannot be set to negative values.
		if(n == 0) return 0;
		n = n * 2;
		if(n == 2) return 1;
		var p = .3 * 1.5;
		var s = p / 4;
		if(n < 1){
			n -= 1;
			return -.5 * (Math.pow(2, 10 * n) * Math.sin((n - s) * (2 * Math.PI) / p));
		}
		n -= 1;
		return .5 * (Math.pow(2, -10 * n) * Math.sin((n - s) * (2 * Math.PI) / p)) + 1;
	},

	bounceIn: function(/* Decimal? */n){
		// summary:
		//		An easing function that 'bounces' near the beginning of an Animation
		return (1 - easingFuncs.bounceOut(1 - n)); // Decimal
	},

	bounceOut: function(/* Decimal? */n){
		// summary:
		//		An easing function that 'bounces' near the end of an Animation
		var s = 7.5625;
		var p = 2.75;
		var l;
		if(n < (1 / p)){
			l = s * Math.pow(n, 2);
		}else if(n < (2 / p)){
			n -= (1.5 / p);
			l = s * Math.pow(n, 2) + .75;
		}else if(n < (2.5 / p)){
			n -= (2.25 / p);
			l = s * Math.pow(n, 2) + .9375;
		}else{
			n -= (2.625 / p);
			l = s * Math.pow(n, 2) + .984375;
		}
		return l;
	},

	bounceInOut: function(/* Decimal? */n){
		// summary:
		//		An easing function that 'bounces' at the beginning and end of the Animation
		if(n < 0.5){ return easingFuncs.bounceIn(n * 2) / 2; }
		return (easingFuncs.bounceOut(n * 2 - 1) / 2) + 0.5; // Decimal
	}
};

lang.setObject("dojo.fx.easing", easingFuncs);

return easingFuncs;
});

},
'dojox/charting/plot2d/StackedAreas':function(){
define("dojox/charting/plot2d/StackedAreas", ["dojo/_base/declare", "./Stacked"], function(declare, Stacked){
/*=====
var Stacked = dojox.charting.plot2d.Stacked;
=====*/
	return declare("dojox.charting.plot2d.StackedAreas", Stacked, {
		//	summary:
		//		A convenience object to set up a stacked area plot.
		constructor: function(){
			//	summary:
			//		Force our Stacked plotter to include both lines and areas.
			this.opt.lines = true;
			this.opt.areas = true;
		}
	});
});


},
'dojox/charting/themes/PlotKit/base':function(){
define("dojox/charting/themes/PlotKit/base", ["dojo/_base/kernel","dojo/_base/lang","../../Theme", "../common"], 
	function(dojo, lang, Theme, themes){

	// the baseline theme for all PlotKIt themes
	var pk = lang.getObject("PlotKit", true, themes);

	pk.base = new Theme({
		chart:{
			stroke: null,
			fill:   "yellow"
		},
		plotarea:{
			stroke: null,
			fill:   "yellow"
		},
		axis:{
			stroke:    {color:"#fff", width:1},
			line:      {color:"#fff", width:.5},
			majorTick: {color: "#fff", width: .5, length: 6},
			minorTick: {color: "#fff", width: .5, length: 3},
			tick:      {font: "normal normal normal 7pt Helvetica,Arial,sans-serif", fontColor: "#999"}
		},
		series:{
			stroke:    {width: 2.5, color:"#fff"},
			fill:      "#666",
			font:      "normal normal normal 7.5pt Helvetica,Arial,sans-serif",	//	label
			fontColor: "#666"
		},
		marker:{	//	any markers on a series.
			stroke:    {width: 2},
			fill:      "#333",
			font:      "normal normal normal 7pt Helvetica,Arial,sans-serif",	//	label
			fontColor: "#666"
		},
		colors: ["red", "green", "blue"]
	});

	pk.base.next = function(elementType, mixin, doPost){
		var theme = Theme.prototype.next.apply(this, arguments);
		if(elementType == "line"){
			theme.marker.outline = {width: 2, color: "#fff"};
			theme.series.stroke.width = 3.5;
			theme.marker.stroke.width = 2;
		} else if (elementType == "candlestick"){
			theme.series.stroke.width = 1;
		} else {
			theme.series.stroke.color = "#fff";
		}
		return theme;
	};
	
	return pk;
});

},
'dojo/data/util/simpleFetch':function(){
define(["dojo/_base/lang", "dojo/_base/window", "./sorter"], 
  function(lang, winUtil, sorter) {
	// module:
	//		dojo/data/util/simpleFetch
	// summary:
	//		TODOC

var simpleFetch = lang.getObject("dojo.data.util.simpleFetch", true);

simpleFetch.fetch = function(/* Object? */ request){
	//	summary:
	//		The simpleFetch mixin is designed to serve as a set of function(s) that can
	//		be mixed into other datastore implementations to accelerate their development.
	//		The simpleFetch mixin should work well for any datastore that can respond to a _fetchItems()
	//		call by returning an array of all the found items that matched the query.  The simpleFetch mixin
	//		is not designed to work for datastores that respond to a fetch() call by incrementally
	//		loading items, or sequentially loading partial batches of the result
	//		set.  For datastores that mixin simpleFetch, simpleFetch
	//		implements a fetch method that automatically handles eight of the fetch()
	//		arguments -- onBegin, onItem, onComplete, onError, start, count, sort and scope
	//		The class mixing in simpleFetch should not implement fetch(),
	//		but should instead implement a _fetchItems() method.  The _fetchItems()
	//		method takes three arguments, the keywordArgs object that was passed
	//		to fetch(), a callback function to be called when the result array is
	//		available, and an error callback to be called if something goes wrong.
	//		The _fetchItems() method should ignore any keywordArgs parameters for
	//		start, count, onBegin, onItem, onComplete, onError, sort, and scope.
	//		The _fetchItems() method needs to correctly handle any other keywordArgs
	//		parameters, including the query parameter and any optional parameters
	//		(such as includeChildren).  The _fetchItems() method should create an array of
	//		result items and pass it to the fetchHandler along with the original request object
	//		-- or, the _fetchItems() method may, if it wants to, create an new request object
	//		with other specifics about the request that are specific to the datastore and pass
	//		that as the request object to the handler.
	//
	//		For more information on this specific function, see dojo.data.api.Read.fetch()
	request = request || {};
	if(!request.store){
		request.store = this;
	}
	var self = this;

	var _errorHandler = function(errorData, requestObject){
		if(requestObject.onError){
			var scope = requestObject.scope || winUtil.global;
			requestObject.onError.call(scope, errorData, requestObject);
		}
	};

	var _fetchHandler = function(items, requestObject){
		var oldAbortFunction = requestObject.abort || null;
		var aborted = false;

		var startIndex = requestObject.start?requestObject.start:0;
		var endIndex = (requestObject.count && (requestObject.count !== Infinity))?(startIndex + requestObject.count):items.length;

		requestObject.abort = function(){
			aborted = true;
			if(oldAbortFunction){
				oldAbortFunction.call(requestObject);
			}
		};

		var scope = requestObject.scope || winUtil.global;
		if(!requestObject.store){
			requestObject.store = self;
		}
		if(requestObject.onBegin){
			requestObject.onBegin.call(scope, items.length, requestObject);
		}
		if(requestObject.sort){
			items.sort(sorter.createSortFunction(requestObject.sort, self));
		}
		if(requestObject.onItem){
			for(var i = startIndex; (i < items.length) && (i < endIndex); ++i){
				var item = items[i];
				if(!aborted){
					requestObject.onItem.call(scope, item, requestObject);
				}
			}
		}
		if(requestObject.onComplete && !aborted){
			var subset = null;
			if(!requestObject.onItem){
				subset = items.slice(startIndex, endIndex);
			}
			requestObject.onComplete.call(scope, subset, requestObject);
		}
	};
	this._fetchItems(request, _fetchHandler, _errorHandler);
	return request;	// Object
};

return simpleFetch;
});

},
'dojox/charting/plot2d/_PlotEvents':function(){
define("dojox/charting/plot2d/_PlotEvents", ["dojo/_base/lang", "dojo/_base/array", "dojo/_base/declare", "dojo/_base/connect"], 
	function(lang, arr, declare, hub){

	return declare("dojox.charting.plot2d._PlotEvents", null, {
		constructor: function(){
			this._shapeEvents = [];
			this._eventSeries = {};
		},
		destroy: function(){
			//	summary:
			//		Destroy any internal elements and event handlers.
			this.resetEvents();
			this.inherited(arguments);
		},
		plotEvent: function(o){
			//	summary:
			//		Stub function for use by specific plots.
			//	o: Object
			//		An object intended to represent event parameters.
		},
		raiseEvent: function(o){
			//	summary:
			//		Raises events in predefined order
			//	o: Object
			//		An object intended to represent event parameters.
			this.plotEvent(o);
			var t = lang.delegate(o);
			t.originalEvent = o.type;
			t.originalPlot  = o.plot;
			t.type = "onindirect";
			arr.forEach(this.chart.stack, function(plot){
				if(plot !== this && plot.plotEvent){
					t.plot = plot;
					plot.plotEvent(t);
				}
			}, this);
		},
		connect: function(object, method){
			//	summary:
			//		Helper function to connect any object's method to our plotEvent.
			//	object: Object
			//		The object to connect to.
			//	method: String|Function
			//		The method to fire when our plotEvent is fired.
			//	returns: Array
			//		The handle as returned from dojo.connect (see dojo.connect).
			this.dirty = true;
			return hub.connect(this, "plotEvent", object, method);	//	Array
		},
		events: function(){
			//	summary:
			//		Find out if any event handlers have been connected to our plotEvent.
			//	returns: Boolean
			//		A flag indicating that there are handlers attached.
			return !!this.plotEvent.after;
		},
		resetEvents: function(){
			//	summary:
			//		Reset all events attached to our plotEvent (i.e. disconnect).
			if(this._shapeEvents.length){
				arr.forEach(this._shapeEvents, function(item){
					item.shape.disconnect(item.handle);
				});
				this._shapeEvents = [];
			}
			this.raiseEvent({type: "onplotreset", plot: this});
		},
		_connectSingleEvent: function(o, eventName){
			this._shapeEvents.push({
				shape:  o.eventMask,
				handle: o.eventMask.connect(eventName, this, function(e){
					o.type  = eventName;
					o.event = e;
					this.raiseEvent(o);
					o.event = null;
				})
			});
		},
		_connectEvents: function(o){
			if(o){
				o.chart = this.chart;
				o.plot  = this;
				o.hAxis = this.hAxis || null;
				o.vAxis = this.vAxis || null;
				o.eventMask = o.eventMask || o.shape;
				this._connectSingleEvent(o, "onmouseover");
				this._connectSingleEvent(o, "onmouseout");
				this._connectSingleEvent(o, "onclick");
			}
		},
		_reconnectEvents: function(seriesName){
			var a = this._eventSeries[seriesName];
			if(a){
				arr.forEach(a, this._connectEvents, this);
			}
		},
		fireEvent: function(seriesName, eventName, index, eventObject){
			//	summary:
			//		Emulates firing an event for a given data value (specified by
			//		an index) of a given series.
			//	seriesName: String:
			//		Series name.
			//	eventName: String:
			//		Event name to emulate.
			//	index:	Number:
			//		Valid data value index used to raise an event.
			//	eventObject: Object?:
			//		Optional event object. Especially useful for synthetic events.
			//		Default: null.
			var s = this._eventSeries[seriesName];
			if(s && s.length && index < s.length){
				var o = s[index];
				o.type  = eventName;
				o.event = eventObject || null;
				this.raiseEvent(o);
				o.event = null;
			}
		}
	});
});

},
'esri/PopupBase':function(){
// wrapped by build app
define(["dijit","dojo","dojox"], function(dijit,dojo,dojox){
dojo.provide("esri.PopupBase");


/*****************
 * esri.PopupBase
 *****************/

dojo.declare("esri.PopupBase", null, {
  
  /****************************
   * Properties:
   *   Graphic[] features
   *  Deferred[] deferreds
   *      Number count
   *      Number selectedIndex
   *      Symbol markerSymbol
   *      Symbol lineSymbol
   *      Symbol fillSymbol
   */
  
  /*********
   * Events
   *********/
  
  onSetFeatures: function() {
    //console.log("onSetFeatures");
  },
  
  onClearFeatures: function() {
    //console.log("onClearFeatures");
  },
  
  onSelectionChange: function() {
    //console.log("onSelectionChange");
  },
  
  onDfdComplete: function() {
    //console.log("onDfdComplete");
    
    var location = this._marked;
    if (location) {
      //console.log("=== enter ===");
      this._marked = null;
      this.showClosestFirst(location);
      //console.log("=== exit ===");
    }
  },
  
  /*****************
   * Public Methods
   *****************/

  initialize: function() {
    //console.log("initialize");
    this.count = 0;
    this.selectedIndex = -1;
  },
  
  cleanup: function() {
    this.features = this.deferreds = null;
  },
  
  setFeatures: function(/*Graphic[] or Deferred[]*/ arg) {
    if (!arg || !arg.length) {
      return;
    }
    
    // TODO
    // If some features in the input are already
    // being viewed in the popup, retain them. But
    // how does it work for deferreds?? Should we
    // retain the old features so that I can compare
    // when deferreds finish?
    
    this.clearFeatures();

    // classify
    var features, deferreds;
    if (arg[0] instanceof dojo.Deferred) {
      deferreds = arg; 
    }
    else {
      features = arg; 
    }

    //this.show();
    
    // process
    if (features) {
      this._updateFeatures(null, features);
    }
    else {
      this.deferreds = deferreds;
      
      // When selecting features in a feature collection, where
      // query operation is performed on the client, _updateFeatures
      // executes within the call to addCallback which ends up 
      // modifying the deferreds array and causing confusion in the
      // loop below by corrupting the positional index of deferreds
      // in the array. Let's create a new array and avodi this problem. 
      deferreds = deferreds.slice(0);
      
      dojo.forEach(deferreds, function(dfd) {
        dfd.addBoth(dojo.hitch(this, this._updateFeatures, dfd));
      }, this);
      //this._updateUI();
    }
    
    //dojo.removeClass(this._actionList, "hidden");
  },
  
  clearFeatures: function() {
    //this.setTitle("&nbsp;");
    //this.setContent("&nbsp;");
    //this._setPagerCallbacks(this);
    //dojo.addClass(this._actionList, "hidden");

    this.features = this.deferreds = this._marked = null;
    this.count = 0;

    var beforePtr = this.selectedIndex;
    this.selectedIndex = -1;

    /*this._updateUI();
    if (this._highlighted) {
      this._highlighted.hide();
    }*/
    
    if (beforePtr > -1) {
      this.onSelectionChange();
    }
    this.onClearFeatures();
  },
  
  /**************************************
   * Methods to manage feature selection
   **************************************/
  
  getSelectedFeature: function() {
    var features = this.features;
    if (features) {
      return features[this.selectedIndex];
    }
  },
  
  select: function(index) {
    if (index < 0 || index >= this.count) {
      return;
    }
    
    this.selectedIndex = index;
    this.onSelectionChange();
  },
  
  /************************************************
   * Helper methods to manage feature highlighting
   ************************************************/
  
  enableHighlight: function(map) {
    this._highlighted = map.graphics.add(new esri.Graphic(new esri.geometry.Point(0, 0, map.spatialReference)));
    this._highlighted.hide();
    
    var ESYM = esri.symbol;
    if (!this.markerSymbol) {
      var symbol = (this.markerSymbol = new ESYM.SimpleMarkerSymbol());
      symbol.setStyle(ESYM.SimpleMarkerSymbol.STYLE_TARGET);
      symbol._setDim(16, 16, 7);
      
      /*symbol.setOutline(new esri.symbol.SimpleLineSymbol(
        esri.symbol.SimpleLineSymbol.STYLE_SOLID,
        new dojo.Color([0, 255, 255]),
        2
      ));*/
     
      symbol.setOutline(new ESYM.CartographicLineSymbol(
        ESYM.SimpleLineSymbol.STYLE_SOLID,
        new dojo.Color([0, 255, 255]),
        2,
        ESYM.CartographicLineSymbol.CAP_ROUND,
        ESYM.CartographicLineSymbol.JOIN_ROUND
      ));
      
      symbol.setColor(new dojo.Color([0, 0, 0, 0]));
    }
    
    if (!this.lineSymbol) {
      this.lineSymbol = new ESYM.SimpleLineSymbol(
        ESYM.SimpleLineSymbol.STYLE_SOLID,
        new dojo.Color([0, 255, 255]),
        2
      );
    }
    
    if (!this.fillSymbol) {
      this.fillSymbol = new ESYM.SimpleFillSymbol(
        ESYM.SimpleFillSymbol.STYLE_NULL,
        new ESYM.SimpleLineSymbol(
          ESYM.SimpleLineSymbol.STYLE_SOLID,
          new dojo.Color([0, 255, 255]),
          2
        ),
        new dojo.Color([0, 0, 0, 0])
      );
    }
  },
  
  disableHighlight: function(map) {
    var highlighted = this._highlighted;
    if (highlighted) {
      highlighted.hide();
      map.graphics.remove(highlighted);
      delete this._highlighted;
    }
    
    this.markerSymbol = this.lineSymbol = this.fillSymbol = null;
  },
  
  showHighlight: function() {
    if (this._highlighted && this.features && this.features[this.selectedIndex]) {
      this._highlighted.show();
    }
  },
  
  hideHighlight: function() {
    if (this._highlighted) {
      this._highlighted.hide();
    }
  },
  
  updateHighlight: function(map, feature) {
    var geometry = feature.geometry, highlighted = this._highlighted;
    if (!geometry || !highlighted) {
      return;
    }
    
    highlighted.hide();
    
    if (!highlighted.getLayer() && map) {
      map.graphics.add(highlighted);
    }
    
    highlighted.setGeometry(esri.geometry.fromJson(geometry.toJson()));
    
    var symbol;
    switch(geometry.type) {
      case "point":
      case "multipoint":
        symbol = this.markerSymbol;
        
        symbol.setOffset(0, 0);
        symbol.setAngle(0);

        var lyr = feature.getLayer();
        if (lyr) {
          var realSymbol = lyr._getSymbol(feature),
              width, height, xoff = 0, yoff = 0, angle = 0;
              
          if (realSymbol) {
            switch(realSymbol.type) {
              case "simplemarkersymbol":
                width = height = (realSymbol.size || 0);
                break;
              case "picturemarkersymbol":
                width = (realSymbol.width || 0);
                height = (realSymbol.height || 0);
                break;
            }
            
            xoff = realSymbol.xoffset || 0;
            yoff = realSymbol.yoffset || 0;
            angle = realSymbol.angle || 0;
          } // realSymbol
          
          if (width && height) {
            //console.log("Inferred width and height = ", (width + 1), (height + 1));
            symbol._setDim(width + 1, height + 1, 7);
          }
          
          symbol.setOffset(xoff, yoff);
          symbol.setAngle(angle);
        }
        break;
      case "polyline":
        symbol = this.lineSymbol;
        break;
      case "polygon":
        symbol = this.fillSymbol;
        break;
    }
    highlighted.setSymbol(symbol);
  },
  
  showClosestFirst: function(location) {
    var features = this.features;
    
    if (features && features.length) {
      if (features.length > 1) {
        //console.log("_moveClosestToFront processing...");
        
        var i, minDistance = Infinity, closestIdx = -1, geom,
            getLength = esri.geometry.getLength, distance;
        
        for (i = features.length - 1; i >= 0; i--) {
          geom = features[i].geometry;
          distance = 0;
          
          try {
            distance = (geom.type === "point") ? 
                        getLength(location, geom) : 
                        getLength(location, geom.getExtent().getCenter());
          }
          catch(e) {
            // ssshhh...squelch
            // We'll silently ignore this exceptions since "moveClosestToFront" 
            // is not a critical operation
          }
          
          //console.log("distance = ", distance, i);
          if (distance > 0 && distance < minDistance) {
            minDistance = distance;
            closestIdx = i;
          }
        }
        
        if (closestIdx > 0) {
          //console.log("closest = ", closestIdx);
          features.splice( 0, 0, features.splice(closestIdx, 1)[0] );
          this.select(0);
        }
      }
    }
    else if (this.deferreds) {
      //console.log("marking....");
      this._marked = location;
    }
  },
  
  /*******************
   * Internal Methods
   *******************/
  
  _unbind: function(dfd) {
    var index = dojo.indexOf(this.deferreds, dfd);
    if (index === -1) {
      return; // dfd not found
    }
    
    this.deferreds.splice(index, 1);
    if (!this.deferreds.length) {
      this.deferreds = null;
      return 2; // indicates we received results from all expected deferreds
    }
    
    return 1; // dfd found and removed
  },
  
  _updateFeatures: function(dfd, features) {
    //console.log("REGISTER: ", arguments);
    
    if (dfd) {
      if (this.deferreds) {
        var res = this._unbind(dfd);
        if (!res) {
          // dfd not in the current working set
          //console.log("Ignoring dfd...");
          return;
        }

        if (features && features instanceof Error) {
          // discard err-ed out dfd
          //console.log("Error case: ", features);
          //this._updateUI();
          
          this.onDfdComplete(features);
          if (res === 2) {
            this.onSetFeatures();
          }
          return;
        }
        
        if (features && features.length) {
          if (!this.features) {
            this.features = features;
            this.count = features.length;
            this.selectedIndex = 0;
            
            /*this._updateUI();
            if (res === 2) {
              this.onSetFeatures();
            }
            this._displayFeature(true);*/
           
            this.onDfdComplete();
            if (res === 2) {
              this.onSetFeatures();
            }
            this.select(0);
          }
          else {
            //this.features = this.features.concat(features);

            // TODO
            // TEST
            // Verify that duplicate features are ignored
            
            var filtered = dojo.filter(features, function(feature) {
              return dojo.indexOf(this.features, feature) === -1;
            }, this);
            
            this.features = this.features.concat(filtered);
            this.count = this.features.length;
            
            //this._updateUI();
            this.onDfdComplete();
            if (res === 2) {
              this.onSetFeatures();
            }
          }
        }
        else {
          //this._updateUI();
          this.onDfdComplete();
          if (res === 2) {
            this.onSetFeatures();
          }
        }
      }
    }
    else {
      this.features = features;
      this.count = features.length;
      this.selectedIndex = 0;
      
      /*this._updateUI();
      this.onSetFeatures();
      this._displayFeature(true);*/
     
      this.onSetFeatures();
      this.select(0);
    }
  }
});


/*************************
 * esri.PopupInfoTemplate
 * 
 * Sub-classes MUST override getTitle and getContent methods
 * and can make use of helpers: getComponents and getAttachments
 *************************/

dojo.declare("esri.PopupInfoTemplate", [ esri.InfoTemplate ], {
  "-chains-": {
    // Incompatible constructor arguments. So let's cut-off
    // the inheritance chain. Note also that sub-classes have
    // to explicitly call the ctor of this class like this:
    // this.inherited(arguments);
    constructor: "manual"
  },
  
  initialize: function(json) {
    // Spec for "json":
    // http://mediawikidev.esri.com/index.php/ArcGIS.com/V1.2#Popups

    if (!json) {
      return;
    }
    
    this.info = json;
    
    // InfoTemplate API defines title and content that
    // can be functions. Wire them up.
    this.title = this.getTitle;
    this.content = this.getContent;
    
    // Store field info in a dictionary for later use
    var flabels = (this._fieldLabels = {}),
        fmaps = (this._fieldsMap = {});
    if (json.fieldInfos) {
      dojo.forEach(json.fieldInfos, function(fieldInfo) {
        flabels[fieldInfo.fieldName] = fieldInfo.label;
        fmaps[fieldInfo.fieldName] = fieldInfo;
      });
    }
  },
  
  toJson: function() {
    return dojo.fromJson(dojo.toJson(this.info));
  },
  
  getTitle: function(/* graphic */) {
    // To be implemented by sub-classes
  },
  
  getContent: function(/* graphic */) {
    // To be implemented by sub-classes
  },
  
  /*****************
   * Helper Methods
   *****************/
  
  getComponents: function(graphic) {
    var popupInfo = this.info,
        layer = graphic.getLayer(),
        attributes = dojo.clone(graphic.attributes) || {},
        formatted = dojo.clone(attributes),
        fieldInfos = popupInfo.fieldInfos,
        titleText = "", descText = "", tableView, fieldName, value,
        properties = layer && layer._getDateOpts && layer._getDateOpts().properties,
        substOptions = {
          // FeatureLayer::_getDateOpts caches result, but we're going to
          // add "formatter" to it. So, lets create a new object
          dateFormat: {
            properties: properties,
            formatter: "DateFormat" + this._dateFormats["shortDateShortTime"]
          }
        };
    
    if (fieldInfos) {
      //this._format(formatted, fieldInfos, substOptions, this._fieldLabels, this._fieldsMap);

      // Format values as per fieldInfos and keep them handy
      dojo.forEach(fieldInfos, function(fieldInfo) {
        var fieldName = fieldInfo.fieldName, val = formatted[fieldName];
        
        formatted[fieldName] = this._formatValue(val, fieldName, substOptions);
        
        // Let's not double format this field, so remove it from the generic
        // "properties" list
        if (properties && fieldInfo.format && fieldInfo.format.dateFormat) {
          var pos = dojo.indexOf(properties, fieldName);
          if (pos > -1) {
            properties.splice(pos, 1);
          }
        }
        
      }, this);
    }
    
    if (layer) {
      var types = layer.types,
          typeField = layer.typeIdField,
          typeId = typeField && attributes[typeField];

      for (fieldName in attributes) {
        value = attributes[fieldName];
        
        if (esri._isDefined(value)) {
          var domainName = this._getDomainName(layer, types, typeId, fieldName, value);
          if (esri._isDefined(domainName)) {
            formatted[fieldName] = domainName;
          }
          else if (fieldName === typeField) {
            var typeName = this._getTypeName(layer, value);
            if (esri._isDefined(typeName)) {
              formatted[fieldName] = typeName;
            }
          }
        }
        
      } // loop
    }
    
    // Main Section: title
    if (popupInfo.title) {
      titleText = dojo.trim(esri.substitute(formatted, this._fixTokens(popupInfo.title), substOptions) || "");
      //console.log("Title text = ", titleText);
    }
    
    // Main Section: description
    if (popupInfo.description) {
      descText = dojo.trim(esri.substitute(formatted, this._fixTokens(popupInfo.description), substOptions) || "");
      //console.log("Desc text = ", descText);
    }
    
    if (fieldInfos) {
      tableView = [];
      
      dojo.forEach(fieldInfos, function(fieldInfo) {
        fieldName = fieldInfo.fieldName;
        if (fieldName && fieldInfo.visible) {
          tableView.push([
            // Field Name:
            fieldInfo.label || fieldName,

            // Field Value:
            esri.substitute(formatted, "${" + fieldName + "}", substOptions) || ""
          ]);
        }
      });
    }

    // Filter out mediaInfos for which one of the following is true:
    // image:
    //  - no sourceURL (invalid mediaInfo)
    //  - feature does not have a value for sourceURL field
    // chart:
    //  - type not one of pie, line, column, bar
    //  - feature does not have values for any of the fields
    var filteredMedia, valid;
    
    if (popupInfo.mediaInfos) {
      filteredMedia = [];
      
      dojo.forEach(popupInfo.mediaInfos, function(minfo) {
        valid = 0;
        value = minfo.value;
        
        switch(minfo.type) {
          case "image":
            var url = value.sourceURL;
            url = url && dojo.trim(esri.substitute(attributes, this._fixTokens(url)));
            //console.log("URL = ", url);
            valid = !!url;
            break;
            
          case "piechart":
          case "linechart":
          case "columnchart":
          case "barchart":
            valid = dojo.some(value.fields, function(field) {
                     return esri._isDefined(attributes[field]);
                   });
            break;
            
          default:
            return;
        }
        
        if (valid) {
          // Clone media info, make substitutions and push into the 
          // outgoing array
          minfo = dojo.clone(minfo);
          value = minfo.value;
          
          minfo.title = minfo.title ? dojo.trim(esri.substitute(formatted, this._fixTokens(minfo.title), substOptions) || "") : "";
          //console.log("Media title text = ", minfo.title);
          
          minfo.caption = minfo.caption ? dojo.trim(esri.substitute(formatted, this._fixTokens(minfo.caption), substOptions) || "") : "";
          //console.log("Media caption text = ", minfo.caption);
          
          if (minfo.type === "image") {
            value.sourceURL = esri.substitute(attributes, this._fixTokens(value.sourceURL));
            
            if (value.linkURL) {
              value.linkURL = dojo.trim(esri.substitute(attributes, this._fixTokens(value.linkURL)) || "");
            }
          }
          else { // chart
            var normalizer = attributes[value.normalizeField] || 0;
            
            value.fields = dojo.map(value.fields, function(fieldName) {
              var data = attributes[fieldName];
              // NOTE
              // Not clear why charting code does not equate
              // undefined values to null
              data = (data === undefined) ? null : data; 
              if (data && normalizer) {
                data = data / normalizer;
                //console.log("[PIE] Normalized data = ", data);
              }
              
              return {
                y: data,
                tooltip: (this._fieldLabels[fieldName] || fieldName) + ":<br/>" + this._formatValue(data, fieldName, substOptions) // formatted[fieldName]
              };
            }, this);
          }
          
          filteredMedia.push(minfo);
        }
      }, this);
    }
    
    return {
      title: titleText,
      description: descText,
      fields: (tableView && tableView.length) ? tableView : null,
      mediaInfos: (filteredMedia && filteredMedia.length) ? filteredMedia : null,
      formatted: formatted,
      editSummary: (layer && layer.getEditSummary) ? layer.getEditSummary(graphic) : ""
    };
  },
  
  getAttachments: function(graphic) {
    var layer = graphic.getLayer(), attributes = graphic.attributes;
    
    if (this.info.showAttachments && layer && layer.hasAttachments && layer.objectIdField) {
      var oid = attributes && attributes[layer.objectIdField];
      if (oid) {
        return layer.queryAttachmentInfos(oid);
      }
    }
  },
  
  /*******************
   * Internal Members
   *******************/
  
  _dateFormats: {
    "shortDate":            "(datePattern: 'M/d/y', selector: 'date')",
    "longMonthDayYear":     "(datePattern: 'MMMM d, y', selector: 'date')", 
    "dayShortMonthYear":    "(datePattern: 'd MMM y', selector: 'date')", 
    "longDate":             "(datePattern: 'EEEE, MMMM d, y', selector: 'date')", 
    "shortDateShortTime":   "(datePattern: 'M/d/y', timePattern: 'h:mm a', selector: 'date and time')", 
    "shortDateShortTime24": "(datePattern: 'M/d/y', timePattern: 'H:mm', selector: 'date and time')", 
    "longMonthYear":        "(datePattern: 'MMMM y', selector: 'date')", 
    "shortMonthYear":       "(datePattern: 'MMM y', selector: 'date')",
    "year":                 "(datePattern: 'y', selector: 'date')"
  },
  
  _fixTokens: function(template) {
    // Replace {xyz} with ${xyz}
    
    // Note: existing ${xyz} are retained. 
    // Update: We may not be able to support this case because a 
    // arcgis.com user might enter a monetary value like this: 
    // ${AMOUNT} where expected result is: $10000.
    // This means that a popupInfo constructed in an app built 
    // using the JSAPI cannot use the ${TOKEN} format either as it
    // gets ambiguous
    //return template.replace(/\$?(\{[^\{\r\n]+\})/g, "$$$1");
    return template.replace(/(\{[^\{\r\n]+\})/g, "$$$1");
  },
  
  _formatValue: function(val, fieldName, substOptions) {
    var fieldInfo = this._fieldsMap[fieldName], 
        fmt = fieldInfo && fieldInfo.format;
    
    if (!esri._isDefined(val) || !fieldInfo || 
        !esri._isDefined(fmt)
    ) {
      return val;
    }
    
    var formatterFunc = "", options = [],
        isNumberFormat = fmt.hasOwnProperty("places") || fmt.hasOwnProperty("digitSeparator"),
        digitSep = fmt.hasOwnProperty("digitSeparator") ? fmt.digitSeparator : true;
    
    if (isNumberFormat) {
      formatterFunc = "NumberFormat";
      
      options.push("places: " + (esri._isDefined(fmt.places) ? Number(fmt.places) : "Infinity"));
      
      if (options.length) {
        formatterFunc += ("(" + options.join(",") + ")");
      }
    }
    else if (fmt.dateFormat) {
      // guard against unknown format string
      formatterFunc = "DateFormat" + (this._dateFormats[fmt.dateFormat] || this._dateFormats["shortDateShortTime"]);
    }
    else {
      // unknown format definition
      return val;
    }

    //console.log("formatterFunc = ", formatterFunc);
    
    var formattedValue = esri.substitute(
      { "myKey": val }, 
      "${myKey:" + formatterFunc + "}", 
      substOptions
    ) || "";
    
    // Remove digit separator if not required
    if (isNumberFormat && !digitSep) {
      var bundle = dojo.i18n.getLocalization("dojo.cldr", "number");
          
      if (bundle.group) {
        formattedValue = formattedValue.replace(new RegExp("\\" + bundle.group, "g"), "");
      }
    }
    
    //console.log("Formatted: ", fieldName, ": ", formattedValue);
    
    return formattedValue;
  },

  _getDomainName: function(layer, types, typeId, fieldName, value) {
    var domain, stop;

    // start looking for domain in sub-types
    if (types && esri._isDefined(typeId)) {
      
      dojo.some(types, function(typeInfo) {
        if (typeInfo.id == typeId) {
          domain = typeInfo.domains && typeInfo.domains[fieldName];
          
          if (domain && domain.type === "inherited") {
            // let's find out if the field has a domain defined
            // in the layer's fields description
            domain = this._getLayerDomain(layer, fieldName);
            
            stop = true; // indicates that layer.fields has been searched.
          }
          
          // Note that a sub-type with no domain implies
          // no domains for all fields. Shouldnt go looking
          // for domain defined in layer's fields description
          
          return true;
        }
        return false;
      }, this);
    }
    
    
    if (!stop && !domain) {
      domain = this._getLayerDomain(layer, fieldName);
    }
    
    // Let's find out the domain name from its code value
    if (domain && domain.codedValues) {
      var domainName;
      
      dojo.some(domain.codedValues, function(codedValue) {
        if (codedValue.code == value) {
          domainName = codedValue.name;
          return true;
        }
        return false;
      });
      
      return domainName;
    }
  },
  
  _getLayerDomain: function(layer, fieldName) {
    var fields = layer.fields;
    if (fields) {
      var domain; 
      
      dojo.some(fields, function(fieldInfo) {
        if (fieldInfo.name === fieldName) {
          domain = fieldInfo.domain;
          return true;
        }
        return false;
      });
      
      return domain;
    }
  },
  
  _getTypeName: function(layer, id) {
    var types = layer.types;
    if (types) {
      var typeName;
      
      dojo.some(types, function(typeInfo) {
        if (typeInfo.id == id) {
          typeName = typeInfo.name;
          return true;
        }
        return false;
      });
      
      return typeName;
    }
  }
});

});

},
'dojox/charting/Element':function(){
define("dojox/charting/Element", ["dojo/_base/lang", "dojo/_base/array", "dojo/dom-construct","dojo/_base/declare", "dojox/gfx", "dojox/gfx/utils", "dojox/gfx/shape"],
	function(lang, arr, domConstruct, declare, gfx, utils, shape){
	
	return declare("dojox.charting.Element", null, {
		//	summary:
		//		A base class that is used to build other elements of a chart, such as
		//		a series.
		//	chart: dojox.charting.Chart
		//		The parent chart for this element.
		//	group: dojox.gfx.Group
		//		The visual GFX group representing this element.
		//	htmlElement: Array
		//		Any DOMNodes used as a part of this element (such as HTML-based labels).
		//	dirty: Boolean
		//		A flag indicating whether or not this element needs to be rendered.
	
		chart: null,
		group: null,
		htmlElements: null,
		dirty: true,
	
		constructor: function(chart){
			//	summary:
			//		Creates a new charting element.
			//	chart: dojox.charting.Chart
			//		The chart that this element belongs to.
			this.chart = chart;
			this.group = null;
			this.htmlElements = [];
			this.dirty = true;
			this.trailingSymbol = "...";
			this._events = [];
		},
		createGroup: function(creator){
			//	summary:
			//		Convenience function to create a new dojox.gfx.Group.
			//	creator: dojox.gfx.Surface?
			//		An optional surface in which to create this group.
			//	returns: dojox.charting.Element
			//		A reference to this object for functional chaining.
			if(!creator){ creator = this.chart.surface; }
			if(!this.group){
				this.group = creator.createGroup();
			}
			return this;	//	dojox.charting.Element
		},
		purgeGroup: function(){
			//	summary:
			//		Clear any elements out of our group, and destroy the group.
			//	returns: dojox.charting.Element
			//		A reference to this object for functional chaining.
			this.destroyHtmlElements();
			if(this.group){
				// since 1.7.x we need dispose shape otherwise there is a memoryleak
				utils.forEach(this.group, function(child){
					shape.dispose(child);
				});
				this.group.clear();
				this.group.removeShape();
				this.group = null;
			}
			this.dirty = true;
			if(this._events.length){
				arr.forEach(this._events, function(item){
					item.shape.disconnect(item.handle);
				});
				this._events = [];
			}
			return this;	//	dojox.charting.Element
		},
		cleanGroup: function(creator){
			//	summary:
			//		Clean any elements (HTML or GFX-based) out of our group, and create a new one.
			//	creator: dojox.gfx.Surface?
			//		An optional surface to work with.
			//	returns: dojox.charting.Element
			//		A reference to this object for functional chaining.
			this.destroyHtmlElements();
			if(!creator){ creator = this.chart.surface; }
			if(this.group){
				this.group.clear();
			}else{
				this.group = creator.createGroup();
			}
			this.dirty = true;
			return this;	//	dojox.charting.Element
		},
		destroyHtmlElements: function(){
			//	summary:
			//		Destroy any DOMNodes that may have been created as a part of this element.
			if(this.htmlElements.length){
				arr.forEach(this.htmlElements, domConstruct.destroy);
				this.htmlElements = [];
			}
		},
		destroy: function(){
			//	summary:
			//		API addition to conform to the rest of the Dojo Toolkit's standard.
			this.purgeGroup();
		},
		//text utilities
		getTextWidth: function(s, font){
			return gfx._base._getTextBox(s, {font: font}).w || 0;
		},
		getTextWithLimitLength: function(s, font, limitWidth, truncated){
			//	summary:
			//		Get the truncated string based on the limited width in px(dichotomy algorithm)
			//	s: String?
			//		candidate text.
			//	font: String?
			//		text's font style.
			//	limitWidth: Number?
			//		text limited width in px.
			//	truncated: Boolean?
			//		whether the input text(s) has already been truncated.
			//	returns: Object
			//		{
			//			text: processed text, maybe truncated or not
			//			truncated: whether text has been truncated
			//		}
			if (!s || s.length <= 0) {
				return {
					text: "",
					truncated: truncated || false
				};
			}
			if(!limitWidth || limitWidth <= 0){
				return {
					text: s,
					truncated: truncated || false
				};
			}
			var delta = 2,
				//golden section for dichotomy algorithm
				trucPercentage = 0.618,
				minStr = s.substring(0,1) + this.trailingSymbol,
				minWidth = this.getTextWidth(minStr, font);
			if (limitWidth <= minWidth) {
				return {
					text: minStr,
					truncated: true
				};
			}
			var width = this.getTextWidth(s, font);
			if(width <= limitWidth){
				return {
					text: s,
					truncated: truncated || false
				};
			}else{
				var begin = 0,
					end = s.length;
				while(begin < end){
					if(end - begin <= delta ){
						while (this.getTextWidth(s.substring(0, begin) + this.trailingSymbol, font) > limitWidth) {
							begin -= 1;
						}
						return {
							text: (s.substring(0,begin) + this.trailingSymbol),
							truncated: true
						};
					}
					var index = begin + Math.round((end - begin) * trucPercentage),
						widthIntercepted = this.getTextWidth(s.substring(0, index), font);
					if(widthIntercepted < limitWidth){
						begin = index;
						end = end;
					}else{
						begin = begin;
						end = index;
					}
				}
			}
		},
		getTextWithLimitCharCount: function(s, font, wcLimit, truncated){
			//	summary:
			//		Get the truncated string based on the limited character count(dichotomy algorithm)
			//	s: String?
			//		candidate text.
			//	font: String?
			//		text's font style.
			//	wcLimit: Number?
			//		text limited character count.
			//	truncated: Boolean?
			//		whether the input text(s) has already been truncated.
			//	returns: Object
			//		{
			//			text: processed text, maybe truncated or not
			//			truncated: whether text has been truncated
			//		}
			if (!s || s.length <= 0) {
				return {
					text: "",
					truncated: truncated || false
				};
			}
			if(!wcLimit || wcLimit <= 0 || s.length <= wcLimit){
				return {
					text: s,
					truncated: truncated || false
				};
			}
			return {
				text: s.substring(0, wcLimit) + this.trailingSymbol,
				truncated: true
			};
		},
		// fill utilities
		_plotFill: function(fill, dim, offsets){
			// process a plot-wide fill
			if(!fill || !fill.type || !fill.space){
				return fill;
			}
			var space = fill.space;
			switch(fill.type){
				case "linear":
					if(space === "plot" || space === "shapeX" || space === "shapeY"){
						// clone a fill so we can modify properly directly
						fill = gfx.makeParameters(gfx.defaultLinearGradient, fill);
						fill.space = space;
						// process dimensions
						if(space === "plot" || space === "shapeX"){
							// process Y
							var span = dim.height - offsets.t - offsets.b;
							fill.y1 = offsets.t + span * fill.y1 / 100;
							fill.y2 = offsets.t + span * fill.y2 / 100;
						}
						if(space === "plot" || space === "shapeY"){
							// process X
							var span = dim.width - offsets.l - offsets.r;
							fill.x1 = offsets.l + span * fill.x1 / 100;
							fill.x2 = offsets.l + span * fill.x2 / 100;
						}
					}
					break;
				case "radial":
					if(space === "plot"){
						// this one is used exclusively for scatter charts
						// clone a fill so we can modify properly directly
						fill = gfx.makeParameters(gfx.defaultRadialGradient, fill);
						fill.space = space;
						// process both dimensions
						var spanX = dim.width  - offsets.l - offsets.r,
							spanY = dim.height - offsets.t - offsets.b;
						fill.cx = offsets.l + spanX * fill.cx / 100;
						fill.cy = offsets.t + spanY * fill.cy / 100;
						fill.r  = fill.r * Math.sqrt(spanX * spanX + spanY * spanY) / 200;
					}
					break;
				case "pattern":
					if(space === "plot" || space === "shapeX" || space === "shapeY"){
						// clone a fill so we can modify properly directly
						fill = gfx.makeParameters(gfx.defaultPattern, fill);
						fill.space = space;
						// process dimensions
						if(space === "plot" || space === "shapeX"){
							// process Y
							var span = dim.height - offsets.t - offsets.b;
							fill.y = offsets.t + span * fill.y / 100;
							fill.height = span * fill.height / 100;
						}
						if(space === "plot" || space === "shapeY"){
							// process X
							var span = dim.width - offsets.l - offsets.r;
							fill.x = offsets.l + span * fill.x / 100;
							fill.width = span * fill.width / 100;
						}
					}
					break;
			}
			return fill;
		},
		_shapeFill: function(fill, bbox){
			// process shape-specific fill
			if(!fill || !fill.space){
				return fill;
			}
			var space = fill.space;
			switch(fill.type){
				case "linear":
					if(space === "shape" || space === "shapeX" || space === "shapeY"){
						// clone a fill so we can modify properly directly
						fill = gfx.makeParameters(gfx.defaultLinearGradient, fill);
						fill.space = space;
						// process dimensions
						if(space === "shape" || space === "shapeX"){
							// process X
							var span = bbox.width;
							fill.x1 = bbox.x + span * fill.x1 / 100;
							fill.x2 = bbox.x + span * fill.x2 / 100;
						}
						if(space === "shape" || space === "shapeY"){
							// process Y
							var span = bbox.height;
							fill.y1 = bbox.y + span * fill.y1 / 100;
							fill.y2 = bbox.y + span * fill.y2 / 100;
						}
					}
					break;
				case "radial":
					if(space === "shape"){
						// this one is used exclusively for bubble charts and pie charts
						// clone a fill so we can modify properly directly
						fill = gfx.makeParameters(gfx.defaultRadialGradient, fill);
						fill.space = space;
						// process both dimensions
						fill.cx = bbox.x + bbox.width  / 2;
						fill.cy = bbox.y + bbox.height / 2;
						fill.r  = fill.r * bbox.width  / 200;
					}
					break;
				case "pattern":
					if(space === "shape" || space === "shapeX" || space === "shapeY"){
						// clone a fill so we can modify properly directly
						fill = gfx.makeParameters(gfx.defaultPattern, fill);
						fill.space = space;
						// process dimensions
						if(space === "shape" || space === "shapeX"){
							// process X
							var span = bbox.width;
							fill.x = bbox.x + span * fill.x / 100;
							fill.width = span * fill.width / 100;
						}
						if(space === "shape" || space === "shapeY"){
							// process Y
							var span = bbox.height;
							fill.y = bbox.y + span * fill.y / 100;
							fill.height = span * fill.height / 100;
						}
					}
					break;
			}
			return fill;
		},
		_pseudoRadialFill: function(fill, center, radius, start, end){
			// process pseudo-radial fills
			if(!fill || fill.type !== "radial" || fill.space !== "shape"){
				return fill;
			}
			// clone and normalize fill
			var space = fill.space;
			fill = gfx.makeParameters(gfx.defaultRadialGradient, fill);
			fill.space = space;
			if(arguments.length < 4){
				// process both dimensions
				fill.cx = center.x;
				fill.cy = center.y;
				fill.r  = fill.r * radius / 100;
				return fill;
			}
			// convert to a linear gradient
			var angle = arguments.length < 5 ? start : (end + start) / 2;
			return {
				type: "linear",
				x1: center.x,
				y1: center.y,
				x2: center.x + fill.r * radius * Math.cos(angle) / 100,
				y2: center.y + fill.r * radius * Math.sin(angle) / 100,
				colors: fill.colors
			};
			return fill;
		}
	});
});

},
'dojox/charting/axis2d/Base':function(){
define("dojox/charting/axis2d/Base", ["dojo/_base/declare", "../Element"], 
	function(declare, Element){
/*=====
var Element = dojox.charting.Element;
=====*/ 
return declare("dojox.charting.axis2d.Base", Element, {
	//	summary:
	//		The base class for any axis.  This is more of an interface/API
	//		definition than anything else; see dojox.charting.axis2d.Default
	//		for more details.
	constructor: function(chart, kwArgs){
		//	summary:
		//		Return a new base axis.
		//	chart: dojox.charting.Chart
		//		The chart this axis belongs to.
		//	kwArgs: dojox.charting.axis2d.__AxisCtorArgs?
		//		An optional arguments object to define the axis parameters.
		this.vertical = kwArgs && kwArgs.vertical;
	},
	clear: function(){
		//	summary:
		//		Stub function for clearing the axis.
		//	returns: dojox.charting.axis2d.Base
		//		A reference to the axis for functional chaining.
		return this;	//	dojox.charting.axis2d.Base
	},
	initialized: function(){
		//	summary:
		//		Return a flag as to whether or not this axis has been initialized.
		//	returns: Boolean
		//		If the axis is initialized or not.
		return false;	//	Boolean
	},
	calculate: function(min, max, span){
		//	summary:
		//		Stub function to run the calcuations needed for drawing this axis.
		//	returns: dojox.charting.axis2d.Base
		//		A reference to the axis for functional chaining.
		return this;	//	dojox.charting.axis2d.Base
	},
	getScaler: function(){
		//	summary:
		//		A stub function to return the scaler object created during calculate.
		//	returns: Object
		//		The scaler object (see dojox.charting.scaler.linear for more information)
		return null;	//	Object
	},
	getTicks: function(){
		//	summary:
		//		A stub function to return the object that helps define how ticks are rendered.
		//	returns: Object
		//		The ticks object.
		return null;	//	Object
	},
	getOffsets: function(){
		//	summary:
		//		A stub function to return any offsets needed for axis and series rendering.
		//	returns: Object
		//		An object of the form { l, r, t, b }.
		return {l: 0, r: 0, t: 0, b: 0};	//	Object
	},
	render: function(dim, offsets){
		//	summary:
		//		Stub function to render this axis.
		//	returns: dojox.charting.axis2d.Base
		//		A reference to the axis for functional chaining.
		this.dirty = false;
		return this;	//	dojox.charting.axis2d.Base
	}
});
});

},
'dojox/lang/functional/scan':function(){
define("dojox/lang/functional/scan", ["dojo/_base/kernel", "dojo/_base/lang", "./lambda"], function(d, darray, df){

// This module adds high-level functions and related constructs:
//	- "scan" family of functions

// Notes:
//	- missing high-level functions are provided with the compatible API:
//		scanl, scanl1, scanr, scanr1

// Defined methods:
//	- take any valid lambda argument as the functional argument
//	- operate on dense arrays
//	- take a string as the array argument
//	- take an iterator objects as the array argument (only scanl, and scanl1)

	var empty = {};

	d.mixin(df, {
		// classic reduce-class functions
		scanl: function(/*Array|String|Object*/ a, /*Function|String|Array*/ f, /*Object*/ z, /*Object?*/ o){
			// summary: repeatedly applies a binary function to an array from left
			//	to right using a seed value as a starting point; returns an array
			//	of values produced by foldl() at that point.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || d.global; f = df.lambda(f);
			var t, n, i;
			if(d.isArray(a)){
				// array
				t = new Array((n = a.length) + 1);
				t[0] = z;
				for(i = 0; i < n; z = f.call(o, z, a[i], i, a), t[++i] = z);
			}else if(typeof a.hasNext == "function" && typeof a.next == "function"){
				// iterator
				t = [z];
				for(i = 0; a.hasNext(); t.push(z = f.call(o, z, a.next(), i++, a)));
			}else{
				// object/dictionary
				t = [z];
				for(i in a){
					if(!(i in empty)){
						t.push(z = f.call(o, z, a[i], i, a));
					}
				}
			}
			return t;	// Array
		},
		scanl1: function(/*Array|String|Object*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary: repeatedly applies a binary function to an array from left
			//	to right; returns an array of values produced by foldl1() at that
			//	point.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || d.global; f = df.lambda(f);
			var t, n, z, first = true;
			if(d.isArray(a)){
				// array
				t = new Array(n = a.length);
				t[0] = z = a[0];
				for(var i = 1; i < n; t[i] = z = f.call(o, z, a[i], i, a), ++i);
			}else if(typeof a.hasNext == "function" && typeof a.next == "function"){
				// iterator
				if(a.hasNext()){
					t = [z = a.next()];
					for(i = 1; a.hasNext(); t.push(z = f.call(o, z, a.next(), i++, a)));
				}
			}else{
				// object/dictionary
				for(i in a){
					if(!(i in empty)){
						if(first){
							t = [z = a[i]];
							first = false;
						}else{
							t.push(z = f.call(o, z, a[i], i, a));
						}
					}
				}
			}
			return t;	// Array
		},
		scanr: function(/*Array|String*/ a, /*Function|String|Array*/ f, /*Object*/ z, /*Object?*/ o){
			// summary: repeatedly applies a binary function to an array from right
			//	to left using a seed value as a starting point; returns an array
			//	of values produced by foldr() at that point.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || d.global; f = df.lambda(f);
			var n = a.length, t = new Array(n + 1), i = n;
			t[n] = z;
			for(; i > 0; --i, z = f.call(o, z, a[i], i, a), t[i] = z);
			return t;	// Array
		},
		scanr1: function(/*Array|String*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary: repeatedly applies a binary function to an array from right
			//	to left; returns an array of values produced by foldr1() at that
			//	point.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || d.global; f = df.lambda(f);
			var n = a.length, t = new Array(n), z = a[n - 1], i = n - 1;
			t[i] = z;
			for(; i > 0; --i, z = f.call(o, z, a[i], i, a), t[i] = z);
			return t;	// Array
		}
	});
});

},
'esri/layers/wms':function(){
// wrapped by build app
define(["dijit","dojo","dojox","dojo/require!esri/layers/dynamic,esri/layers/agscommon"], function(dijit,dojo,dojox){
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

},
'dojox/charting/scaler/primitive':function(){
define("dojox/charting/scaler/primitive", ["dojo/_base/lang"], 
  function(lang){
	var primitive = lang.getObject("dojox.charting.scaler.primitive", true);
	return lang.mixin(primitive, {
		buildScaler: function(/*Number*/ min, /*Number*/ max, /*Number*/ span, /*Object*/ kwArgs){
			if(min == max){
				// artificially extend bounds
				min -= 0.5;
				max += 0.5;
				// now the line will be centered
			}
			return {
				bounds: {
					lower: min,
					upper: max,
					from:  min,
					to:    max,
					scale: span / (max - min),
					span:  span
				},
				scaler: primitive
			};
		},
		buildTicks: function(/*Object*/ scaler, /*Object*/ kwArgs){
			return {major: [], minor: [], micro: []};	// Object
		},
		getTransformerFromModel: function(/*Object*/ scaler){
			var offset = scaler.bounds.from, scale = scaler.bounds.scale;
			return function(x){ return (x - offset) * scale; };	// Function
		},
		getTransformerFromPlot: function(/*Object*/ scaler){
			var offset = scaler.bounds.from, scale = scaler.bounds.scale;
			return function(x){ return x / scale + offset; };	// Function
		}
	});
});

},
'dojox/gfx/fx':function(){
define("dojox/gfx/fx", ["dojo/_base/lang", "./_base", "./matrix", "dojo/_base/Color", "dojo/_base/array", "dojo/_base/fx", "dojo/_base/connect"], 
  function(lang, g, m, Color, arr, fx, Hub){
	var fxg = g.fx = {};
	/*===== g = dojox.gfx; fxg = dojox.gfx.fx; =====*/

	// Generic interpolators. Should they be moved to dojox.fx?

	function InterpolNumber(start, end){
		this.start = start, this.end = end;
	}
	InterpolNumber.prototype.getValue = function(r){
		return (this.end - this.start) * r + this.start;
	};

	function InterpolUnit(start, end, units){
		this.start = start, this.end = end;
		this.units = units;
	}
	InterpolUnit.prototype.getValue = function(r){
		return (this.end - this.start) * r + this.start + this.units;
	};

	function InterpolColor(start, end){
		this.start = start, this.end = end;
		this.temp = new Color();
	}
	InterpolColor.prototype.getValue = function(r){
		return Color.blendColors(this.start, this.end, r, this.temp);
	};

	function InterpolValues(values){
		this.values = values;
		this.length = values.length;
	}
	InterpolValues.prototype.getValue = function(r){
		return this.values[Math.min(Math.floor(r * this.length), this.length - 1)];
	};

	function InterpolObject(values, def){
		this.values = values;
		this.def = def ? def : {};
	}
	InterpolObject.prototype.getValue = function(r){
		var ret = lang.clone(this.def);
		for(var i in this.values){
			ret[i] = this.values[i].getValue(r);
		}
		return ret;
	};

	function InterpolTransform(stack, original){
		this.stack = stack;
		this.original = original;
	}
	InterpolTransform.prototype.getValue = function(r){
		var ret = [];
		arr.forEach(this.stack, function(t){
			if(t instanceof m.Matrix2D){
				ret.push(t);
				return;
			}
			if(t.name == "original" && this.original){
				ret.push(this.original);
				return;
			}
			if(!(t.name in m)){ return; }
			var f = m[t.name];
			if(typeof f != "function"){
				// constant
				ret.push(f);
				return;
			}
			var val = arr.map(t.start, function(v, i){
							return (t.end[i] - v) * r + v;
						}),
				matrix = f.apply(m, val);
			if(matrix instanceof m.Matrix2D){
				ret.push(matrix);
			}
		}, this);
		return ret;
	};

	var transparent = new Color(0, 0, 0, 0);

	function getColorInterpol(prop, obj, name, def){
		if(prop.values){
			return new InterpolValues(prop.values);
		}
		var value, start, end;
		if(prop.start){
			start = g.normalizeColor(prop.start);
		}else{
			start = value = obj ? (name ? obj[name] : obj) : def;
		}
		if(prop.end){
			end = g.normalizeColor(prop.end);
		}else{
			if(!value){
				value = obj ? (name ? obj[name] : obj) : def;
			}
			end = value;
		}
		return new InterpolColor(start, end);
	}

	function getNumberInterpol(prop, obj, name, def){
		if(prop.values){
			return new InterpolValues(prop.values);
		}
		var value, start, end;
		if(prop.start){
			start = prop.start;
		}else{
			start = value = obj ? obj[name] : def;
		}
		if(prop.end){
			end = prop.end;
		}else{
			if(typeof value != "number"){
				value = obj ? obj[name] : def;
			}
			end = value;
		}
		return new InterpolNumber(start, end);
	}

	fxg.animateStroke = function(/*Object*/ args){
		// summary:
		//	Returns an animation which will change stroke properties over time.
		// example:
		//	|	dojox.gfx.fx.animateStroke{{
		//	|		shape: shape,
		//	|		duration: 500,
		//	|		color: {start: "red", end: "green"},
		//	|		width: {end: 15},
		//	|		join:  {values: ["miter", "bevel", "round"]}
		//	|	}).play();
		if(!args.easing){ args.easing = fx._defaultEasing; }
		var anim = new fx.Animation(args), shape = args.shape, stroke;
		Hub.connect(anim, "beforeBegin", anim, function(){
			stroke = shape.getStroke();
			var prop = args.color, values = {}, value, start, end;
			if(prop){
				values.color = getColorInterpol(prop, stroke, "color", transparent);
			}
			prop = args.style;
			if(prop && prop.values){
				values.style = new InterpolValues(prop.values);
			}
			prop = args.width;
			if(prop){
				values.width = getNumberInterpol(prop, stroke, "width", 1);
			}
			prop = args.cap;
			if(prop && prop.values){
				values.cap = new InterpolValues(prop.values);
			}
			prop = args.join;
			if(prop){
				if(prop.values){
					values.join = new InterpolValues(prop.values);
				}else{
					start = prop.start ? prop.start : (stroke && stroke.join || 0);
					end = prop.end ? prop.end : (stroke && stroke.join || 0);
					if(typeof start == "number" && typeof end == "number"){
						values.join = new InterpolNumber(start, end);
					}
				}
			}
			this.curve = new InterpolObject(values, stroke);
		});
		Hub.connect(anim, "onAnimate", shape, "setStroke");
		return anim; // dojo.Animation
	};

	fxg.animateFill = function(/*Object*/ args){
		// summary:
		//	Returns an animation which will change fill color over time.
		//	Only solid fill color is supported at the moment
		// example:
		//	|	dojox.gfx.fx.animateFill{{
		//	|		shape: shape,
		//	|		duration: 500,
		//	|		color: {start: "red", end: "green"}
		//	|	}).play();
		if(!args.easing){ args.easing = fx._defaultEasing; }
		var anim = new fx.Animation(args), shape = args.shape, fill;
		Hub.connect(anim, "beforeBegin", anim, function(){
			fill = shape.getFill();
			var prop = args.color, values = {};
			if(prop){
				this.curve = getColorInterpol(prop, fill, "", transparent);
			}
		});
		Hub.connect(anim, "onAnimate", shape, "setFill");
		return anim; // dojo.Animation
	};

	fxg.animateFont = function(/*Object*/ args){
		// summary:
		//	Returns an animation which will change font properties over time.
		// example:
		//	|	dojox.gfx.fx.animateFont{{
		//	|		shape: shape,
		//	|		duration: 500,
		//	|		variant: {values: ["normal", "small-caps"]},
		//	|		size:  {end: 10, units: "pt"}
		//	|	}).play();
		if(!args.easing){ args.easing = fx._defaultEasing; }
		var anim = new fx.Animation(args), shape = args.shape, font;
		Hub.connect(anim, "beforeBegin", anim, function(){
			font = shape.getFont();
			var prop = args.style, values = {}, value, start, end;
			if(prop && prop.values){
				values.style = new InterpolValues(prop.values);
			}
			prop = args.variant;
			if(prop && prop.values){
				values.variant = new InterpolValues(prop.values);
			}
			prop = args.weight;
			if(prop && prop.values){
				values.weight = new InterpolValues(prop.values);
			}
			prop = args.family;
			if(prop && prop.values){
				values.family = new InterpolValues(prop.values);
			}
			prop = args.size;
			if(prop && prop.units){
				start = parseFloat(prop.start ? prop.start : (shape.font && shape.font.size || "0"));
				end = parseFloat(prop.end ? prop.end : (shape.font && shape.font.size || "0"));
				values.size = new InterpolUnit(start, end, prop.units);
			}
			this.curve = new InterpolObject(values, font);
		});
		Hub.connect(anim, "onAnimate", shape, "setFont");
		return anim; // dojo.Animation
	};

	fxg.animateTransform = function(/*Object*/ args){
		// summary:
		//	Returns an animation which will change transformation over time.
		// example:
		//	|	dojox.gfx.fx.animateTransform{{
		//	|		shape: shape,
		//	|		duration: 500,
		//	|		transform: [
		//	|			{name: "translate", start: [0, 0], end: [200, 200]},
		//	|			{name: "original"}
		//	|		]
		//	|	}).play();
		if(!args.easing){ args.easing = fx._defaultEasing; }
		var anim = new fx.Animation(args), shape = args.shape, original;
		Hub.connect(anim, "beforeBegin", anim, function(){
			original = shape.getTransform();
			this.curve = new InterpolTransform(args.transform, original);
		});
		Hub.connect(anim, "onAnimate", shape, "setTransform");
		return anim; // dojo.Animation
	};
	
	return fxg;
});

},
'dojox/charting/plot2d/StackedColumns':function(){
define("dojox/charting/plot2d/StackedColumns", ["dojo/_base/lang", "dojo/_base/array", "dojo/_base/declare", "./Columns", "./common", 
	"dojox/lang/functional", "dojox/lang/functional/reversed", "dojox/lang/functional/sequence"], 
	function(lang, arr, declare, Columns, dc, df, dfr, dfs){

	var	purgeGroup = dfr.lambda("item.purgeGroup()");
/*=====
var Columns = dojox.charting.plot2d.Columns;
=====*/
	return declare("dojox.charting.plot2d.StackedColumns", Columns, {
		//	summary:
		//		The plot object representing a stacked column chart (vertical bars).
		getSeriesStats: function(){
			//	summary:
			//		Calculate the min/max on all attached series in both directions.
			//	returns: Object
			//		{hmin, hmax, vmin, vmax} min/max in both directions.
			var stats = dc.collectStackedStats(this.series);
			this._maxRunLength = stats.hmax;
			stats.hmin -= 0.5;
			stats.hmax += 0.5;
			return stats;
		},
		render: function(dim, offsets){
			//	summary:
			//		Run the calculations for any axes for this plot.
			//	dim: Object
			//		An object in the form of { width, height }
			//	offsets: Object
			//		An object of the form { l, r, t, b}.
			//	returns: dojox.charting.plot2d.StackedColumns
			//		A reference to this plot for functional chaining.
			if(this._maxRunLength <= 0){
				return this;
			}

			// stack all values
			var acc = df.repeat(this._maxRunLength, "-> 0", 0);
			for(var i = 0; i < this.series.length; ++i){
				var run = this.series[i];
				for(var j = 0; j < run.data.length; ++j){
					var value = run.data[j];
					if(value !== null){
						var v = typeof value == "number" ? value : value.y;
						if(isNaN(v)){ v = 0; }
						acc[j] += v;
					}
				}
			}
			// draw runs in backwards
			if(this.zoom && !this.isDataDirty()){
				return this.performZoom(dim, offsets);
			}
			this.resetEvents();
			this.dirty = this.isDirty();
			if(this.dirty){
				arr.forEach(this.series, purgeGroup);
				this._eventSeries = {};
				this.cleanGroup();
				var s = this.group;
				df.forEachRev(this.series, function(item){ item.cleanGroup(s); });
			}
			var t = this.chart.theme, f, gap, width,
				ht = this._hScaler.scaler.getTransformerFromModel(this._hScaler),
				vt = this._vScaler.scaler.getTransformerFromModel(this._vScaler),
				events = this.events();
			f = dc.calculateBarSize(this._hScaler.bounds.scale, this.opt);
			gap = f.gap;
			width = f.size;
			for(var i = this.series.length - 1; i >= 0; --i){
				var run = this.series[i];
				if(!this.dirty && !run.dirty){
					t.skip();
					this._reconnectEvents(run.name);
					continue;
				}
				run.cleanGroup();
				var theme = t.next("column", [this.opt, run]), s = run.group,
					eventSeries = new Array(acc.length);
				for(var j = 0; j < acc.length; ++j){
					var value = run.data[j];
					if(value !== null){
						var v = acc[j],
							height = vt(v),
							finalTheme = typeof value != "number" ?
								t.addMixin(theme, "column", value, true) :
								t.post(theme, "column");
						if(width >= 1 && height >= 0){
							var rect = {
								x: offsets.l + ht(j + 0.5) + gap,
								y: dim.height - offsets.b - vt(v),
								width: width, height: height
							};
							var specialFill = this._plotFill(finalTheme.series.fill, dim, offsets);
							specialFill = this._shapeFill(specialFill, rect);
							var shape = s.createRect(rect).setFill(specialFill).setStroke(finalTheme.series.stroke);
							run.dyn.fill   = shape.getFill();
							run.dyn.stroke = shape.getStroke();
							if(events){
								var o = {
									element: "column",
									index:   j,
									run:     run,
									shape:   shape,
									x:       j + 0.5,
									y:       v
								};
								this._connectEvents(o);
								eventSeries[j] = o;
							}
							if(this.animate){
								this._animateColumn(shape, dim.height - offsets.b, height);
							}
						}
					}
				}
				this._eventSeries[run.name] = eventSeries;
				run.dirty = false;
				// update the accumulator
				for(var j = 0; j < run.data.length; ++j){
					var value = run.data[j];
					if(value !== null){
						var v = typeof value == "number" ? value : value.y;
						if(isNaN(v)){ v = 0; }
						acc[j] -= v;
					}
				}
			}
			this.dirty = false;
			return this;	//	dojox.charting.plot2d.StackedColumns
		}
	});
});

},
'dojo/data/util/filter':function(){
define(["dojo/_base/lang"], function(lang) {
	// module:
	//		dojo/data/util/filter
	// summary:
	//		TODOC

var filter = lang.getObject("dojo.data.util.filter", true);

filter.patternToRegExp = function(/*String*/pattern, /*boolean?*/ ignoreCase){
	//	summary:
	//		Helper function to convert a simple pattern to a regular expression for matching.
	//	description:
	//		Returns a regular expression object that conforms to the defined conversion rules.
	//		For example:
	//			ca*   -> /^ca.*$/
	//			*ca*  -> /^.*ca.*$/
	//			*c\*a*  -> /^.*c\*a.*$/
	//			*c\*a?*  -> /^.*c\*a..*$/
	//			and so on.
	//
	//	pattern: string
	//		A simple matching pattern to convert that follows basic rules:
	//			* Means match anything, so ca* means match anything starting with ca
	//			? Means match single character.  So, b?b will match to bob and bab, and so on.
	//      	\ is an escape character.  So for example, \* means do not treat * as a match, but literal character *.
	//				To use a \ as a character in the string, it must be escaped.  So in the pattern it should be
	//				represented by \\ to be treated as an ordinary \ character instead of an escape.
	//
	//	ignoreCase:
	//		An optional flag to indicate if the pattern matching should be treated as case-sensitive or not when comparing
	//		By default, it is assumed case sensitive.

	var rxp = "^";
	var c = null;
	for(var i = 0; i < pattern.length; i++){
		c = pattern.charAt(i);
		switch(c){
			case '\\':
				rxp += c;
				i++;
				rxp += pattern.charAt(i);
				break;
			case '*':
				rxp += ".*"; break;
			case '?':
				rxp += "."; break;
			case '$':
			case '^':
			case '/':
			case '+':
			case '.':
			case '|':
			case '(':
			case ')':
			case '{':
			case '}':
			case '[':
			case ']':
				rxp += "\\"; //fallthrough
			default:
				rxp += c;
		}
	}
	rxp += "$";
	if(ignoreCase){
		return new RegExp(rxp,"mi"); //RegExp
	}else{
		return new RegExp(rxp,"m"); //RegExp
	}

};

return filter;
});

},
'dojox/charting/plot2d/OHLC':function(){
define("dojox/charting/plot2d/OHLC", ["dojo/_base/lang", "dojo/_base/array", "dojo/_base/declare", "./Base", "./common", 
	"dojox/lang/functional", "dojox/lang/functional/reversed", "dojox/lang/utils", "dojox/gfx/fx"],
	function(lang, arr, declare, Base, dc, df, dfr, du, fx){
/*=====
var Base = dojox.charting.plot2d.Base;
=====*/

	var purgeGroup = dfr.lambda("item.purgeGroup()");

	//	Candlesticks are based on the Bars plot type; we expect the following passed
	//	as values in a series:
	//	{ x?, open, close, high, low }
	//	if x is not provided, the array index is used.
	//	failing to provide the OHLC values will throw an error.
	return declare("dojox.charting.plot2d.OHLC", Base, {
		//	summary:
		//		A plot that represents typical open/high/low/close (financial reporting, primarily).
		//		Unlike most charts, the Candlestick expects data points to be represented by
		//		an object of the form { x?, open, close, high, low, mid? }, where both
		//		x and mid are optional parameters.  If x is not provided, the index of the
		//		data array is used.
		defaultParams: {
			hAxis: "x",		// use a horizontal axis named "x"
			vAxis: "y",		// use a vertical axis named "y"
			gap:	2,		// gap between columns in pixels
			animate: null	// animate chart to place
		},
		optionalParams: {
			minBarSize: 1,	// minimal bar size in pixels
			maxBarSize: 1,	// maximal bar size in pixels
			// theme component
			stroke:		{},
			outline:	{},
			shadow:		{},
			fill:		{},
			font:		"",
			fontColor:	""
		},

		constructor: function(chart, kwArgs){
			//	summary:
			//		The constructor for a candlestick chart.
			//	chart: dojox.charting.Chart
			//		The chart this plot belongs to.
			//	kwArgs: dojox.charting.plot2d.__BarCtorArgs?
			//		An optional keyword arguments object to help define the plot.
			this.opt = lang.clone(this.defaultParams);
			du.updateWithObject(this.opt, kwArgs);
			du.updateWithPattern(this.opt, kwArgs, this.optionalParams);
			this.series = [];
			this.hAxis = this.opt.hAxis;
			this.vAxis = this.opt.vAxis;
			this.animate = this.opt.animate;
		},

		collectStats: function(series){
			//	summary:
			//		Collect all statistics for drawing this chart.  Since the common
			//		functionality only assumes x and y, OHLC must create it's own
			//		stats (since data has no y value, but open/close/high/low instead).
			//	series: dojox.charting.Series[]
			//		The data series array to be drawn on this plot.
			//	returns: Object
			//		Returns an object in the form of { hmin, hmax, vmin, vmax }.

			//	we have to roll our own, since we need to use all four passed
			//	values to figure out our stats, and common only assumes x and y.
			var stats = lang.delegate(dc.defaultStats);
			for(var i=0; i<series.length; i++){
				var run = series[i];
				if(!run.data.length){ continue; }
				var old_vmin = stats.vmin, old_vmax = stats.vmax;
				if(!("ymin" in run) || !("ymax" in run)){
					arr.forEach(run.data, function(val, idx){
						if(val !== null){
							var x = val.x || idx + 1;
							stats.hmin = Math.min(stats.hmin, x);
							stats.hmax = Math.max(stats.hmax, x);
							stats.vmin = Math.min(stats.vmin, val.open, val.close, val.high, val.low);
							stats.vmax = Math.max(stats.vmax, val.open, val.close, val.high, val.low);
						}
					});
				}
				if("ymin" in run){ stats.vmin = Math.min(old_vmin, run.ymin); }
				if("ymax" in run){ stats.vmax = Math.max(old_vmax, run.ymax); }
			}
			return stats;
		},

		getSeriesStats: function(){
			//	summary:
			//		Calculate the min/max on all attached series in both directions.
			//	returns: Object
			//		{hmin, hmax, vmin, vmax} min/max in both directions.
			var stats = this.collectStats(this.series);
			stats.hmin -= 0.5;
			stats.hmax += 0.5;
			return stats;
		},

		render: function(dim, offsets){
			//	summary:
			//		Run the calculations for any axes for this plot.
			//	dim: Object
			//		An object in the form of { width, height }
			//	offsets: Object
			//		An object of the form { l, r, t, b}.
			//	returns: dojox.charting.plot2d.OHLC
			//		A reference to this plot for functional chaining.
			if(this.zoom && !this.isDataDirty()){
				return this.performZoom(dim, offsets);
			}
			this.resetEvents();
			this.dirty = this.isDirty();
			if(this.dirty){
				arr.forEach(this.series, purgeGroup);
				this._eventSeries = {};
				this.cleanGroup();
				var s = this.group;
				df.forEachRev(this.series, function(item){ item.cleanGroup(s); });
			}
			var t = this.chart.theme, f, gap, width,
				ht = this._hScaler.scaler.getTransformerFromModel(this._hScaler),
				vt = this._vScaler.scaler.getTransformerFromModel(this._vScaler),
				baseline = Math.max(0, this._vScaler.bounds.lower),
				baselineHeight = vt(baseline),
				events = this.events();
			f = dc.calculateBarSize(this._hScaler.bounds.scale, this.opt);
			gap = f.gap;
			width = f.size;
			for(var i = this.series.length - 1; i >= 0; --i){
				var run = this.series[i];
				if(!this.dirty && !run.dirty){
					t.skip();
					this._reconnectEvents(run.name);
					continue;
				}
				run.cleanGroup();
				var theme = t.next("candlestick", [this.opt, run]), s = run.group,
					eventSeries = new Array(run.data.length);
				for(var j = 0; j < run.data.length; ++j){
					var v = run.data[j];
					if(v !== null){
						var finalTheme = t.addMixin(theme, "candlestick", v, true);

						//	calculate the points we need for OHLC
						var x = ht(v.x || (j+0.5)) + offsets.l + gap,
							y = dim.height - offsets.b,
							open = vt(v.open),
							close = vt(v.close),
							high = vt(v.high),
							low = vt(v.low);
						if(low > high){
							var tmp = high;
							high = low;
							low = tmp;
						}

						if(width >= 1){
							var hl = {x1: width/2, x2: width/2, y1: y - high, y2: y - low},
								op = {x1: 0, x2: ((width/2) + ((finalTheme.series.stroke.width||1)/2)), y1: y-open, y2: y-open},
								cl = {x1: ((width/2) - ((finalTheme.series.stroke.width||1)/2)), x2: width, y1: y-close, y2: y-close};
							var shape = s.createGroup();
							shape.setTransform({dx: x, dy: 0});
							var inner = shape.createGroup();
							inner.createLine(hl).setStroke(finalTheme.series.stroke);
							inner.createLine(op).setStroke(finalTheme.series.stroke);
							inner.createLine(cl).setStroke(finalTheme.series.stroke);

							//	TODO: double check this.
							run.dyn.stroke = finalTheme.series.stroke;
							if(events){
								var o = {
									element: "candlestick",
									index:   j,
									run:     run,
									shape:	 inner,
									x:       x,
									y:       y-Math.max(open, close),
									cx:		 width/2,
									cy:		 (y-Math.max(open, close)) + (Math.max(open > close ? open-close : close-open, 1)/2),
									width:	 width,
									height:  Math.max(open > close ? open-close : close-open, 1),
									data:	 v
								};
								this._connectEvents(o);
								eventSeries[j] = o;
							}
						}
						if(this.animate){
							this._animateOHLC(shape, y - low, high - low);
						}
					}
				}
				this._eventSeries[run.name] = eventSeries;
				run.dirty = false;
			}
			this.dirty = false;
			return this;	//	dojox.charting.plot2d.OHLC
		},
		_animateOHLC: function(shape, voffset, vsize){
			fx.animateTransform(lang.delegate({
				shape: shape,
				duration: 1200,
				transform: [
					{name: "translate", start: [0, voffset - (voffset/vsize)], end: [0, 0]},
					{name: "scale", start: [1, 1/vsize], end: [1, 1]},
					{name: "original"}
				]
			}, this.animate)).play();
		}
	});
});

},
'dojo/data/util/sorter':function(){
define(["dojo/_base/lang"], function(lang) {
	// module:
	//		dojo/data/util/sorter
	// summary:
	//		TODOC

var sorter = lang.getObject("dojo.data.util.sorter", true);

sorter.basicComparator = function(	/*anything*/ a,
													/*anything*/ b){
	//	summary:
	//		Basic comparision function that compares if an item is greater or less than another item
	//	description:
	//		returns 1 if a > b, -1 if a < b, 0 if equal.
	//		'null' values (null, undefined) are treated as larger values so that they're pushed to the end of the list.
	//		And compared to each other, null is equivalent to undefined.

	//null is a problematic compare, so if null, we set to undefined.
	//Makes the check logic simple, compact, and consistent
	//And (null == undefined) === true, so the check later against null
	//works for undefined and is less bytes.
	var r = -1;
	if(a === null){
		a = undefined;
	}
	if(b === null){
		b = undefined;
	}
	if(a == b){
		r = 0;
	}else if(a > b || a == null){
		r = 1;
	}
	return r; //int {-1,0,1}
};

sorter.createSortFunction = function(	/* attributes array */sortSpec, /*dojo.data.core.Read*/ store){
	//	summary:
	//		Helper function to generate the sorting function based off the list of sort attributes.
	//	description:
	//		The sort function creation will look for a property on the store called 'comparatorMap'.  If it exists
	//		it will look in the mapping for comparisons function for the attributes.  If one is found, it will
	//		use it instead of the basic comparator, which is typically used for strings, ints, booleans, and dates.
	//		Returns the sorting function for this particular list of attributes and sorting directions.
	//
	//	sortSpec: array
	//		A JS object that array that defines out what attribute names to sort on and whether it should be descenting or asending.
	//		The objects should be formatted as follows:
	//		{
	//			attribute: "attributeName-string" || attribute,
	//			descending: true|false;   // Default is false.
	//		}
	//	store: object
	//		The datastore object to look up item values from.
	//
	var sortFunctions=[];

	function createSortFunction(attr, dir, comp, s){
		//Passing in comp and s (comparator and store), makes this
		//function much faster.
		return function(itemA, itemB){
			var a = s.getValue(itemA, attr);
			var b = s.getValue(itemB, attr);
			return dir * comp(a,b); //int
		};
	}
	var sortAttribute;
	var map = store.comparatorMap;
	var bc = sorter.basicComparator;
	for(var i = 0; i < sortSpec.length; i++){
		sortAttribute = sortSpec[i];
		var attr = sortAttribute.attribute;
		if(attr){
			var dir = (sortAttribute.descending) ? -1 : 1;
			var comp = bc;
			if(map){
				if(typeof attr !== "string" && ("toString" in attr)){
					 attr = attr.toString();
				}
				comp = map[attr] || bc;
			}
			sortFunctions.push(createSortFunction(attr,
				dir, comp, store));
		}
	}
	return function(rowA, rowB){
		var i=0;
		while(i < sortFunctions.length){
			var ret = sortFunctions[i++](rowA, rowB);
			if(ret !== 0){
				return ret;//int
			}
		}
		return 0; //int
	}; // Function
};

return sorter;
});

},
'dojo/colors':function(){
define(["./_base/kernel", "./_base/lang", "./_base/Color", "./_base/array"], function(dojo, lang, Color, ArrayUtil) {
	// module:
	//		dojo/colors
	// summary:
	//		TODOC

	var ColorExt = lang.getObject("dojo.colors", true);

//TODO: this module appears to break naming conventions

/*=====
	lang.mixin(dojo, {
		colors: {
			// summary: Color utilities, extending Base dojo.Color
		}
	});
=====*/

	// this is a standard conversion prescribed by the CSS3 Color Module
	var hue2rgb = function(m1, m2, h){
		if(h < 0){ ++h; }
		if(h > 1){ --h; }
		var h6 = 6 * h;
		if(h6 < 1){ return m1 + (m2 - m1) * h6; }
		if(2 * h < 1){ return m2; }
		if(3 * h < 2){ return m1 + (m2 - m1) * (2 / 3 - h) * 6; }
		return m1;
	};
	// Override base Color.fromRgb with the impl in this module
	dojo.colorFromRgb = Color.fromRgb = function(/*String*/ color, /*dojo.Color?*/ obj){
		// summary:
		//		get rgb(a) array from css-style color declarations
		// description:
		//		this function can handle all 4 CSS3 Color Module formats: rgb,
		//		rgba, hsl, hsla, including rgb(a) with percentage values.
		var m = color.toLowerCase().match(/^(rgba?|hsla?)\(([\s\.\-,%0-9]+)\)/);
		if(m){
			var c = m[2].split(/\s*,\s*/), l = c.length, t = m[1], a;
			if((t == "rgb" && l == 3) || (t == "rgba" && l == 4)){
				var r = c[0];
				if(r.charAt(r.length - 1) == "%"){
					// 3 rgb percentage values
					a = ArrayUtil.map(c, function(x){
						return parseFloat(x) * 2.56;
					});
					if(l == 4){ a[3] = c[3]; }
					return Color.fromArray(a, obj); // dojo.Color
				}
				return Color.fromArray(c, obj); // dojo.Color
			}
			if((t == "hsl" && l == 3) || (t == "hsla" && l == 4)){
				// normalize hsl values
				var H = ((parseFloat(c[0]) % 360) + 360) % 360 / 360,
					S = parseFloat(c[1]) / 100,
					L = parseFloat(c[2]) / 100,
					// calculate rgb according to the algorithm
					// recommended by the CSS3 Color Module
					m2 = L <= 0.5 ? L * (S + 1) : L + S - L * S,
					m1 = 2 * L - m2;
				a = [
					hue2rgb(m1, m2, H + 1 / 3) * 256,
					hue2rgb(m1, m2, H) * 256,
					hue2rgb(m1, m2, H - 1 / 3) * 256,
					1
				];
				if(l == 4){ a[3] = c[3]; }
				return Color.fromArray(a, obj); // dojo.Color
			}
		}
		return null;	// dojo.Color
	};

	var confine = function(c, low, high){
		// summary:
		//		sanitize a color component by making sure it is a number,
		//		and clamping it to valid values
		c = Number(c);
		return isNaN(c) ? high : c < low ? low : c > high ? high : c;	// Number
	};

	Color.prototype.sanitize = function(){
		// summary: makes sure that the object has correct attributes
		var t = this;
		t.r = Math.round(confine(t.r, 0, 255));
		t.g = Math.round(confine(t.g, 0, 255));
		t.b = Math.round(confine(t.b, 0, 255));
		t.a = confine(t.a, 0, 1);
		return this;	// dojo.Color
	};

	ColorExt.makeGrey = Color.makeGrey = function(/*Number*/ g, /*Number?*/ a){
		// summary: creates a greyscale color with an optional alpha
		return Color.fromArray([g, g, g, a]);	// dojo.Color
	};

	// mixin all CSS3 named colors not already in _base, along with SVG 1.0 variant spellings
	lang.mixin(Color.named, {
		"aliceblue":	[240,248,255],
		"antiquewhite": [250,235,215],
		"aquamarine":	[127,255,212],
		"azure":	[240,255,255],
		"beige":	[245,245,220],
		"bisque":	[255,228,196],
		"blanchedalmond":	[255,235,205],
		"blueviolet":	[138,43,226],
		"brown":	[165,42,42],
		"burlywood":	[222,184,135],
		"cadetblue":	[95,158,160],
		"chartreuse":	[127,255,0],
		"chocolate":	[210,105,30],
		"coral":	[255,127,80],
		"cornflowerblue":	[100,149,237],
		"cornsilk": [255,248,220],
		"crimson":	[220,20,60],
		"cyan": [0,255,255],
		"darkblue": [0,0,139],
		"darkcyan": [0,139,139],
		"darkgoldenrod":	[184,134,11],
		"darkgray": [169,169,169],
		"darkgreen":	[0,100,0],
		"darkgrey": [169,169,169],
		"darkkhaki":	[189,183,107],
		"darkmagenta":	[139,0,139],
		"darkolivegreen":	[85,107,47],
		"darkorange":	[255,140,0],
		"darkorchid":	[153,50,204],
		"darkred":	[139,0,0],
		"darksalmon":	[233,150,122],
		"darkseagreen": [143,188,143],
		"darkslateblue":	[72,61,139],
		"darkslategray":	[47,79,79],
		"darkslategrey":	[47,79,79],
		"darkturquoise":	[0,206,209],
		"darkviolet":	[148,0,211],
		"deeppink": [255,20,147],
		"deepskyblue":	[0,191,255],
		"dimgray":	[105,105,105],
		"dimgrey":	[105,105,105],
		"dodgerblue":	[30,144,255],
		"firebrick":	[178,34,34],
		"floralwhite":	[255,250,240],
		"forestgreen":	[34,139,34],
		"gainsboro":	[220,220,220],
		"ghostwhite":	[248,248,255],
		"gold": [255,215,0],
		"goldenrod":	[218,165,32],
		"greenyellow":	[173,255,47],
		"grey": [128,128,128],
		"honeydew": [240,255,240],
		"hotpink":	[255,105,180],
		"indianred":	[205,92,92],
		"indigo":	[75,0,130],
		"ivory":	[255,255,240],
		"khaki":	[240,230,140],
		"lavender": [230,230,250],
		"lavenderblush":	[255,240,245],
		"lawngreen":	[124,252,0],
		"lemonchiffon": [255,250,205],
		"lightblue":	[173,216,230],
		"lightcoral":	[240,128,128],
		"lightcyan":	[224,255,255],
		"lightgoldenrodyellow": [250,250,210],
		"lightgray":	[211,211,211],
		"lightgreen":	[144,238,144],
		"lightgrey":	[211,211,211],
		"lightpink":	[255,182,193],
		"lightsalmon":	[255,160,122],
		"lightseagreen":	[32,178,170],
		"lightskyblue": [135,206,250],
		"lightslategray":	[119,136,153],
		"lightslategrey":	[119,136,153],
		"lightsteelblue":	[176,196,222],
		"lightyellow":	[255,255,224],
		"limegreen":	[50,205,50],
		"linen":	[250,240,230],
		"magenta":	[255,0,255],
		"mediumaquamarine": [102,205,170],
		"mediumblue":	[0,0,205],
		"mediumorchid": [186,85,211],
		"mediumpurple": [147,112,219],
		"mediumseagreen":	[60,179,113],
		"mediumslateblue":	[123,104,238],
		"mediumspringgreen":	[0,250,154],
		"mediumturquoise":	[72,209,204],
		"mediumvioletred":	[199,21,133],
		"midnightblue": [25,25,112],
		"mintcream":	[245,255,250],
		"mistyrose":	[255,228,225],
		"moccasin": [255,228,181],
		"navajowhite":	[255,222,173],
		"oldlace":	[253,245,230],
		"olivedrab":	[107,142,35],
		"orange":	[255,165,0],
		"orangered":	[255,69,0],
		"orchid":	[218,112,214],
		"palegoldenrod":	[238,232,170],
		"palegreen":	[152,251,152],
		"paleturquoise":	[175,238,238],
		"palevioletred":	[219,112,147],
		"papayawhip":	[255,239,213],
		"peachpuff":	[255,218,185],
		"peru": [205,133,63],
		"pink": [255,192,203],
		"plum": [221,160,221],
		"powderblue":	[176,224,230],
		"rosybrown":	[188,143,143],
		"royalblue":	[65,105,225],
		"saddlebrown":	[139,69,19],
		"salmon":	[250,128,114],
		"sandybrown":	[244,164,96],
		"seagreen": [46,139,87],
		"seashell": [255,245,238],
		"sienna":	[160,82,45],
		"skyblue":	[135,206,235],
		"slateblue":	[106,90,205],
		"slategray":	[112,128,144],
		"slategrey":	[112,128,144],
		"snow": [255,250,250],
		"springgreen":	[0,255,127],
		"steelblue":	[70,130,180],
		"tan":	[210,180,140],
		"thistle":	[216,191,216],
		"tomato":	[255,99,71],
		"turquoise":	[64,224,208],
		"violet":	[238,130,238],
		"wheat":	[245,222,179],
		"whitesmoke":	[245,245,245],
		"yellowgreen":	[154,205,50]
	});

	return Color;
});

},
'dojox/lang/functional/reversed':function(){
define("dojox/lang/functional/reversed", ["dojo/_base/lang", "dojo/_base/window" ,"./lambda"], 
	function(lang, win, df){
// This module adds high-level functions and related constructs:
//	- reversed versions of array-processing functions similar to standard JS functions

// Notes:
//	- this module provides reversed versions of standard array-processing functions:
//		forEachRev, mapRev, filterRev

// Defined methods:
//	- take any valid lambda argument as the functional argument
//	- operate on dense arrays
//	- take a string as the array argument

/*=====
	var df = dojox.lang.functional;
 =====*/
	lang.mixin(df, {
		// JS 1.6 standard array functions, which can take a lambda as a parameter.
		// Consider using dojo._base.array functions, if you don't need the lambda support.
		filterRev: function(/*Array|String*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary: creates a new array with all elements that pass the test
			//	implemented by the provided function.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || win.global; f = df.lambda(f);
			var t = [], v, i = a.length - 1;
			for(; i >= 0; --i){
				v = a[i];
				if(f.call(o, v, i, a)){ t.push(v); }
			}
			return t;	// Array
		},
		forEachRev: function(/*Array|String*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary: executes a provided function once per array element.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || win.global; f = df.lambda(f);
			for(var i = a.length - 1; i >= 0; f.call(o, a[i], i, a), --i);
		},
		mapRev: function(/*Array|String*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary: creates a new array with the results of calling
			//	a provided function on every element in this array.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || win.global; f = df.lambda(f);
			var n = a.length, t = new Array(n), i = n - 1, j = 0;
			for(; i >= 0; t[j++] = f.call(o, a[i], i, a), --i);
			return t;	// Array
		},
		everyRev: function(/*Array|String*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary: tests whether all elements in the array pass the test
			//	implemented by the provided function.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || win.global; f = df.lambda(f);
			for(var i = a.length - 1; i >= 0; --i){
				if(!f.call(o, a[i], i, a)){
					return false;	// Boolean
				}
			}
			return true;	// Boolean
		},
		someRev: function(/*Array|String*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary: tests whether some element in the array passes the test
			//	implemented by the provided function.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || win.global; f = df.lambda(f);
			for(var i = a.length - 1; i >= 0; --i){
				if(f.call(o, a[i], i, a)){
					return true;	// Boolean
				}
			}
			return false;	// Boolean
		}
	});
	
	return df;
});

},
'dojox/charting/Chart':function(){
define("dojox/charting/Chart", ["dojo/_base/lang", "dojo/_base/array","dojo/_base/declare", "dojo/_base/html", 
	"dojo/dom", "dojo/dom-geometry", "dojo/dom-construct","dojo/_base/Color", "dojo/_base/sniff",
	"./Element", "./Theme", "./Series", "./axis2d/common",
	"dojox/gfx", "dojox/lang/functional", "dojox/lang/functional/fold", "dojox/lang/functional/reversed"], 
	function(lang, arr, declare, html, 
	 		 dom, domGeom, domConstruct, Color, has,
	 		 Element, Theme, Series, common, 
	 		 g, func, funcFold, funcReversed){
	/*=====
	dojox.charting.__ChartCtorArgs = function(margins, stroke, fill, delayInMs){
		//	summary:
		//		The keyword arguments that can be passed in a Chart constructor.
		//
		//	margins: Object?
		//		Optional margins for the chart, in the form of { l, t, r, b}.
		//	stroke: dojox.gfx.Stroke?
		//		An optional outline/stroke for the chart.
		//	fill: dojox.gfx.Fill?
		//		An optional fill for the chart.
		//	delayInMs: Number
		//		Delay in ms for delayedRender(). Default: 200.
		this.margins = margins;
		this.stroke = stroke;
		this.fill = fill;
		this.delayInMs = delayInMs;
	}
	 =====*/
	var dc = dojox.charting,
		clear = func.lambda("item.clear()"),
		purge = func.lambda("item.purgeGroup()"),
		destroy = func.lambda("item.destroy()"),
		makeClean = func.lambda("item.dirty = false"),
		makeDirty = func.lambda("item.dirty = true"),
		getName = func.lambda("item.name");

	declare("dojox.charting.Chart", null, {
		//	summary:
		//		The main chart object in dojox.charting.  This will create a two dimensional
		//		chart based on dojox.gfx.
		//
		//	description:
		//		dojox.charting.Chart is the primary object used for any kind of charts.  It
		//		is simple to create--just pass it a node reference, which is used as the
		//		container for the chart--and a set of optional keyword arguments and go.
		//
		//		Note that like most of dojox.gfx, most of dojox.charting.Chart's methods are
		//		designed to return a reference to the chart itself, to allow for functional
		//		chaining.  This makes defining everything on a Chart very easy to do.
		//
		//	example:
		//		Create an area chart, with smoothing.
		//	|	new dojox.charting.Chart(node))
		//	|		.addPlot("default", { type: "Areas", tension: "X" })
		//	|		.setTheme(dojox.charting.themes.Shrooms)
		//	|		.addSeries("Series A", [1, 2, 0.5, 1.5, 1, 2.8, 0.4])
		//	|		.addSeries("Series B", [2.6, 1.8, 2, 1, 1.4, 0.7, 2])
		//	|		.addSeries("Series C", [6.3, 1.8, 3, 0.5, 4.4, 2.7, 2])
		//	|		.render();
		//
		//	example:
		//		The form of data in a data series can take a number of forms: a simple array,
		//		an array of objects {x,y}, or something custom (as determined by the plot).
		//		Here's an example of a Candlestick chart, which expects an object of
		//		{ open, high, low, close }.
		//	|	new dojox.charting.Chart(node))
		//	|		.addPlot("default", {type: "Candlesticks", gap: 1})
		//	|		.addAxis("x", {fixLower: "major", fixUpper: "major", includeZero: true})
		//	|		.addAxis("y", {vertical: true, fixLower: "major", fixUpper: "major", natural: true})
		//	|		.addSeries("Series A", [
		//	|				{ open: 20, close: 16, high: 22, low: 8 },
		//	|				{ open: 16, close: 22, high: 26, low: 6, mid: 18 },
		//	|				{ open: 22, close: 18, high: 22, low: 11, mid: 21 },
		//	|				{ open: 18, close: 29, high: 32, low: 14, mid: 27 },
		//	|				{ open: 29, close: 24, high: 29, low: 13, mid: 27 },
		//	|				{ open: 24, close: 8, high: 24, low: 5 },
		//	|				{ open: 8, close: 16, high: 22, low: 2 },
		//	|				{ open: 16, close: 12, high: 19, low: 7 },
		//	|				{ open: 12, close: 20, high: 22, low: 8 },
		//	|				{ open: 20, close: 16, high: 22, low: 8 },
		//	|				{ open: 16, close: 22, high: 26, low: 6, mid: 18 },
		//	|				{ open: 22, close: 18, high: 22, low: 11, mid: 21 },
		//	|				{ open: 18, close: 29, high: 32, low: 14, mid: 27 },
		//	|				{ open: 29, close: 24, high: 29, low: 13, mid: 27 },
		//	|				{ open: 24, close: 8, high: 24, low: 5 },
		//	|				{ open: 8, close: 16, high: 22, low: 2 },
		//	|				{ open: 16, close: 12, high: 19, low: 7 },
		//	|				{ open: 12, close: 20, high: 22, low: 8 },
		//	|				{ open: 20, close: 16, high: 22, low: 8 },
		//	|				{ open: 16, close: 22, high: 26, low: 6 },
		//	|				{ open: 22, close: 18, high: 22, low: 11 },
		//	|				{ open: 18, close: 29, high: 32, low: 14 },
		//	|				{ open: 29, close: 24, high: 29, low: 13 },
		//	|				{ open: 24, close: 8, high: 24, low: 5 },
		//	|				{ open: 8, close: 16, high: 22, low: 2 },
		//	|				{ open: 16, close: 12, high: 19, low: 7 },
		//	|				{ open: 12, close: 20, high: 22, low: 8 },
		//	|				{ open: 20, close: 16, high: 22, low: 8 }
		//	|			],
		//	|			{ stroke: { color: "green" }, fill: "lightgreen" }
		//	|		)
		//	|		.render();
		
		//	theme: dojox.charting.Theme?
		//		An optional theme to use for styling the chart.
		//	axes: dojox.charting.Axis{}?
		//		A map of axes for use in plotting a chart.
		//	stack: dojox.charting.plot2d.Base[]
		//		A stack of plotters.
		//	plots: dojox.charting.plot2d.Base{}
		//		A map of plotter indices
		//	series: dojox.charting.Series[]
		//		The stack of data runs used to create plots.
		//	runs: dojox.charting.Series{}
		//		A map of series indices
		//	margins: Object?
		//		The margins around the chart. Default is { l:10, t:10, r:10, b:10 }.
		//	stroke: dojox.gfx.Stroke?
		//		The outline of the chart (stroke in vector graphics terms).
		//	fill: dojox.gfx.Fill?
		//		The color for the chart.
		//	node: DOMNode
		//		The container node passed to the constructor.
		//	surface: dojox.gfx.Surface
		//		The main graphics surface upon which a chart is drawn.
		//	dirty: Boolean
		//		A boolean flag indicating whether or not the chart needs to be updated/re-rendered.
		//	coords: Object
		//		The coordinates on a page of the containing node, as returned from dojo.coords.

		constructor: function(/* DOMNode */node, /* dojox.charting.__ChartCtorArgs? */kwArgs){
			//	summary:
			//		The constructor for a new Chart.  Initializes all parameters used for a chart.
			//	returns: dojox.charting.Chart
			//		The newly created chart.

			// initialize parameters
			if(!kwArgs){ kwArgs = {}; }
			this.margins   = kwArgs.margins ? kwArgs.margins : {l: 10, t: 10, r: 10, b: 10};
			this.stroke    = kwArgs.stroke;
			this.fill      = kwArgs.fill;
			this.delayInMs = kwArgs.delayInMs || 200;
			this.title     = kwArgs.title;
			this.titleGap  = kwArgs.titleGap;
			this.titlePos  = kwArgs.titlePos;
			this.titleFont = kwArgs.titleFont;
			this.titleFontColor = kwArgs.titleFontColor;
			this.chartTitle = null;

			// default initialization
			this.theme = null;
			this.axes = {};		// map of axes
			this.stack = [];	// stack of plotters
			this.plots = {};	// map of plotter indices
			this.series = [];	// stack of data runs
			this.runs = {};		// map of data run indices
			this.dirty = true;
			this.coords = null;

			// create a surface
			this.node = dom.byId(node);
			var box = domGeom.getMarginBox(node);
			this.surface = g.createSurface(this.node, box.w || 400, box.h || 300);
		},
		destroy: function(){
			//	summary:
			//		Cleanup when a chart is to be destroyed.
			//	returns: void
			arr.forEach(this.series, destroy);
			arr.forEach(this.stack,  destroy);
			func.forIn(this.axes, destroy);
			if(this.chartTitle && this.chartTitle.tagName){
				// destroy title if it is a DOM node
				domConstruct.destroy(this.chartTitle);
			}
			this.surface.destroy();
		},
		getCoords: function(){
			//	summary:
			//		Get the coordinates and dimensions of the containing DOMNode, as
			//		returned by dojo.coords.
			//	returns: Object
			//		The resulting coordinates of the chart.  See dojo.coords for details.
			return html.coords(this.node, true); // Object
		},
		setTheme: function(theme){
			//	summary:
			//		Set a theme of the chart.
			//	theme: dojox.charting.Theme
			//		The theme to be used for visual rendering.
			//	returns: dojox.charting.Chart
			//		A reference to the current chart for functional chaining.
			this.theme = theme.clone();
			this.dirty = true;
			return this;	//	dojox.charting.Chart
		},
		addAxis: function(name, kwArgs){
			//	summary:
			//		Add an axis to the chart, for rendering.
			//	name: String
			//		The name of the axis.
			//	kwArgs: dojox.charting.axis2d.__AxisCtorArgs?
			//		An optional keyword arguments object for use in defining details of an axis.
			//	returns: dojox.charting.Chart
			//		A reference to the current chart for functional chaining.
			var axis, axisType = kwArgs && kwArgs.type || "Default";
			if(typeof axisType == "string"){
				if(!dc.axis2d || !dc.axis2d[axisType]){
					throw Error("Can't find axis: " + axisType + " - Check " + "require() dependencies.");
				}
				axis = new dc.axis2d[axisType](this, kwArgs);
			}else{
				axis = new axisType(this, kwArgs);
			}
			axis.name = name;
			axis.dirty = true;
			if(name in this.axes){
				this.axes[name].destroy();
			}
			this.axes[name] = axis;
			this.dirty = true;
			return this;	//	dojox.charting.Chart
		},
		getAxis: function(name){
			//	summary:
			//		Get the given axis, by name.
			//	name: String
			//		The name the axis was defined by.
			//	returns: dojox.charting.axis2d.Default
			//		The axis as stored in the chart's axis map.
			return this.axes[name];	//	dojox.charting.axis2d.Default
		},
		removeAxis: function(name){
			//	summary:
			//		Remove the axis that was defined using name.
			//	name: String
			//		The axis name, as defined in addAxis.
			//	returns: dojox.charting.Chart
			//		A reference to the current chart for functional chaining.
			if(name in this.axes){
				// destroy the axis
				this.axes[name].destroy();
				delete this.axes[name];
				// mark the chart as dirty
				this.dirty = true;
			}
			return this;	//	dojox.charting.Chart
		},
		addPlot: function(name, kwArgs){
			//	summary:
			//		Add a new plot to the chart, defined by name and using the optional keyword arguments object.
			//		Note that dojox.charting assumes the main plot to be called "default"; if you do not have
			//		a plot called "default" and attempt to add data series to the chart without specifying the
			//		plot to be rendered on, you WILL get errors.
			//	name: String
			//		The name of the plot to be added to the chart.  If you only plan on using one plot, call it "default".
			//	kwArgs: dojox.charting.plot2d.__PlotCtorArgs
			//		An object with optional parameters for the plot in question.
			//	returns: dojox.charting.Chart
			//		A reference to the current chart for functional chaining.
			var plot, plotType = kwArgs && kwArgs.type || "Default";
			if(typeof plotType == "string"){
				if(!dc.plot2d || !dc.plot2d[plotType]){
					throw Error("Can't find plot: " + plotType + " - didn't you forget to dojo" + ".require() it?");
				}
				plot = new dc.plot2d[plotType](this, kwArgs);
			}else{
				plot = new plotType(this, kwArgs);
			}
			plot.name = name;
			plot.dirty = true;
			if(name in this.plots){
				this.stack[this.plots[name]].destroy();
				this.stack[this.plots[name]] = plot;
			}else{
				this.plots[name] = this.stack.length;
				this.stack.push(plot);
			}
			this.dirty = true;
			return this;	//	dojox.charting.Chart
		},
		getPlot: function(name){
			//	summary:
			//		Get the given plot, by name.
			//	name: String
			//		The name the plot was defined by.
			//	returns: dojox.charting.plot2d.Base
			//		The plot.
			return this.stack[this.plots[name]];
		},
		removePlot: function(name){
			//	summary:
			//		Remove the plot defined using name from the chart's plot stack.
			//	name: String
			//		The name of the plot as defined using addPlot.
			//	returns: dojox.charting.Chart
			//		A reference to the current chart for functional chaining.
			if(name in this.plots){
				// get the index and remove the name
				var index = this.plots[name];
				delete this.plots[name];
				// destroy the plot
				this.stack[index].destroy();
				// remove the plot from the stack
				this.stack.splice(index, 1);
				// update indices to reflect the shift
				func.forIn(this.plots, function(idx, name, plots){
					if(idx > index){
						plots[name] = idx - 1;
					}
				});
				// remove all related series
				var ns = arr.filter(this.series, function(run){ return run.plot != name; });
				if(ns.length < this.series.length){
					// kill all removed series
					arr.forEach(this.series, function(run){
						if(run.plot == name){
							run.destroy();
						}
					});
					// rebuild all necessary data structures
					this.runs = {};
					arr.forEach(ns, function(run, index){
						this.runs[run.plot] = index;
					}, this);
					this.series = ns;
				}
				// mark the chart as dirty
				this.dirty = true;
			}
			return this;	//	dojox.charting.Chart
		},
		getPlotOrder: function(){
			//	summary:
			//		Returns an array of plot names in the current order
			//		(the top-most plot is the first).
			//	returns: Array
			return func.map(this.stack, getName); // Array
		},
		setPlotOrder: function(newOrder){
			//	summary:
			//		Sets new order of plots. newOrder cannot add or remove
			//		plots. Wrong names, or dups are ignored.
			//	newOrder: Array:
			//		Array of plot names compatible with getPlotOrder().
			//	returns: dojox.charting.Chart
			//		A reference to the current chart for functional chaining.
			var names = {},
				order = func.filter(newOrder, function(name){
					if(!(name in this.plots) || (name in names)){
						return false;
					}
					names[name] = 1;
					return true;
				}, this);
			if(order.length < this.stack.length){
				func.forEach(this.stack, function(plot){
					var name = plot.name;
					if(!(name in names)){
						order.push(name);
					}
				});
			}
			var newStack = func.map(order, function(name){
					return this.stack[this.plots[name]];
				}, this);
			func.forEach(newStack, function(plot, i){
				this.plots[plot.name] = i;
			}, this);
			this.stack = newStack;
			this.dirty = true;
			return this;	//	dojox.charting.Chart
		},
		movePlotToFront: function(name){
			//	summary:
			//		Moves a given plot to front.
			//	name: String:
			//		Plot's name to move.
			//	returns: dojox.charting.Chart
			//		A reference to the current chart for functional chaining.
			if(name in this.plots){
				var index = this.plots[name];
				if(index){
					var newOrder = this.getPlotOrder();
					newOrder.splice(index, 1);
					newOrder.unshift(name);
					return this.setPlotOrder(newOrder);	//	dojox.charting.Chart
				}
			}
			return this;	//	dojox.charting.Chart
		},
		movePlotToBack: function(name){
			//	summary:
			//		Moves a given plot to back.
			//	name: String:
			//		Plot's name to move.
			//	returns: dojox.charting.Chart
			//		A reference to the current chart for functional chaining.
			if(name in this.plots){
				var index = this.plots[name];
				if(index < this.stack.length - 1){
					var newOrder = this.getPlotOrder();
					newOrder.splice(index, 1);
					newOrder.push(name);
					return this.setPlotOrder(newOrder);	//	dojox.charting.Chart
				}
			}
			return this;	//	dojox.charting.Chart
		},
		addSeries: function(name, data, kwArgs){
			//	summary:
			//		Add a data series to the chart for rendering.
			//	name: String:
			//		The name of the data series to be plotted.
			//	data: Array|Object:
			//		The array of data points (either numbers or objects) that
			//		represents the data to be drawn. Or it can be an object. In
			//		the latter case, it should have a property "data" (an array),
			//		destroy(), and setSeriesObject().
			//	kwArgs: dojox.charting.__SeriesCtorArgs?:
			//		An optional keyword arguments object that will be mixed into
			//		the resultant series object.
			//	returns: dojox.charting.Chart:
			//		A reference to the current chart for functional chaining.
			var run = new Series(this, data, kwArgs);
			run.name = name;
			if(name in this.runs){
				this.series[this.runs[name]].destroy();
				this.series[this.runs[name]] = run;
			}else{
				this.runs[name] = this.series.length;
				this.series.push(run);
			}
			this.dirty = true;
			// fix min/max
			if(!("ymin" in run) && "min" in run){ run.ymin = run.min; }
			if(!("ymax" in run) && "max" in run){ run.ymax = run.max; }
			return this;	//	dojox.charting.Chart
		},
		getSeries: function(name){
			//	summary:
			//		Get the given series, by name.
			//	name: String
			//		The name the series was defined by.
			//	returns: dojox.charting.Series
			//		The series.
			return this.series[this.runs[name]];
		},
		removeSeries: function(name){
			//	summary:
			//		Remove the series defined by name from the chart.
			//	name: String
			//		The name of the series as defined by addSeries.
			//	returns: dojox.charting.Chart
			//		A reference to the current chart for functional chaining.
			if(name in this.runs){
				// get the index and remove the name
				var index = this.runs[name];
				delete this.runs[name];
				// destroy the run
				this.series[index].destroy();
				// remove the run from the stack of series
				this.series.splice(index, 1);
				// update indices to reflect the shift
				func.forIn(this.runs, function(idx, name, runs){
					if(idx > index){
						runs[name] = idx - 1;
					}
				});
				this.dirty = true;
			}
			return this;	//	dojox.charting.Chart
		},
		updateSeries: function(name, data){
			//	summary:
			//		Update the given series with a new set of data points.
			//	name: String
			//		The name of the series as defined in addSeries.
			//	data: Array|Object:
			//		The array of data points (either numbers or objects) that
			//		represents the data to be drawn. Or it can be an object. In
			//		the latter case, it should have a property "data" (an array),
			//		destroy(), and setSeriesObject().
			//	returns: dojox.charting.Chart
			//		A reference to the current chart for functional chaining.
			if(name in this.runs){
				var run = this.series[this.runs[name]];
				run.update(data);
				this._invalidateDependentPlots(run.plot, false);
				this._invalidateDependentPlots(run.plot, true);
			}
			return this;	//	dojox.charting.Chart
		},
		getSeriesOrder: function(plotName){
			//	summary:
			//		Returns an array of series names in the current order
			//		(the top-most series is the first) within a plot.
			//	plotName: String:
			//		Plot's name.
			//	returns: Array
			return func.map(func.filter(this.series, function(run){
					return run.plot == plotName;
				}), getName);
		},
		setSeriesOrder: function(newOrder){
			//	summary:
			//		Sets new order of series within a plot. newOrder cannot add
			//		or remove series. Wrong names, or dups are ignored.
			//	newOrder: Array:
			//		Array of series names compatible with getPlotOrder(). All
			//		series should belong to the same plot.
			//	returns: dojox.charting.Chart
			//		A reference to the current chart for functional chaining.
			var plotName, names = {},
				order = func.filter(newOrder, function(name){
					if(!(name in this.runs) || (name in names)){
						return false;
					}
					var run = this.series[this.runs[name]];
					if(plotName){
						if(run.plot != plotName){
							return false;
						}
					}else{
						plotName = run.plot;
					}
					names[name] = 1;
					return true;
				}, this);
			func.forEach(this.series, function(run){
				var name = run.name;
				if(!(name in names) && run.plot == plotName){
					order.push(name);
				}
			});
			var newSeries = func.map(order, function(name){
					return this.series[this.runs[name]];
				}, this);
			this.series = newSeries.concat(func.filter(this.series, function(run){
				return run.plot != plotName;
			}));
			func.forEach(this.series, function(run, i){
				this.runs[run.name] = i;
			}, this);
			this.dirty = true;
			return this;	//	dojox.charting.Chart
		},
		moveSeriesToFront: function(name){
			//	summary:
			//		Moves a given series to front of a plot.
			//	name: String:
			//		Series' name to move.
			//	returns: dojox.charting.Chart
			//		A reference to the current chart for functional chaining.
			if(name in this.runs){
				var index = this.runs[name],
					newOrder = this.getSeriesOrder(this.series[index].plot);
				if(name != newOrder[0]){
					newOrder.splice(index, 1);
					newOrder.unshift(name);
					return this.setSeriesOrder(newOrder);	//	dojox.charting.Chart
				}
			}
			return this;	//	dojox.charting.Chart
		},
		moveSeriesToBack: function(name){
			//	summary:
			//		Moves a given series to back of a plot.
			//	name: String:
			//		Series' name to move.
			//	returns: dojox.charting.Chart
			//		A reference to the current chart for functional chaining.
			if(name in this.runs){
				var index = this.runs[name],
					newOrder = this.getSeriesOrder(this.series[index].plot);
				if(name != newOrder[newOrder.length - 1]){
					newOrder.splice(index, 1);
					newOrder.push(name);
					return this.setSeriesOrder(newOrder);	//	dojox.charting.Chart
				}
			}
			return this;	//	dojox.charting.Chart
		},
		resize: function(width, height){
			//	summary:
			//		Resize the chart to the dimensions of width and height.
			//	description:
			//		Resize the chart and its surface to the width and height dimensions.
			//		If no width/height or box is provided, resize the surface to the marginBox of the chart.
			//	width: Number
			//		The new width of the chart.
			//	height: Number
			//		The new height of the chart.
			//	returns: dojox.charting.Chart
			//		A reference to the current chart for functional chaining.
			var box;
			switch(arguments.length){
				// case 0, do not resize the div, just the surface
				case 1:
					// argument, override node box
					box = lang.mixin({}, width);
					domGeom.setMarginBox(this.node, box);
					break;
				case 2:
					box = {w: width, h: height};
					// argument, override node box
					domGeom.setMarginBox(this.node, box);
					break;
			}
			// in all cases take back the computed box
			box = domGeom.getMarginBox(this.node);
			var d = this.surface.getDimensions();
			if(d.width != box.w || d.height != box.h){
				// and set it on the surface
				this.surface.setDimensions(box.w, box.h);
				this.dirty = true;
				return this.render();	//	dojox.charting.Chart
			}else{
				return this;
			}
		},
		getGeometry: function(){
			//	summary:
			//		Returns a map of information about all axes in a chart and what they represent
			//		in terms of scaling (see dojox.charting.axis2d.Default.getScaler).
			//	returns: Object
			//		An map of geometry objects, a one-to-one mapping of axes.
			var ret = {};
			func.forIn(this.axes, function(axis){
				if(axis.initialized()){
					ret[axis.name] = {
						name:		axis.name,
						vertical:	axis.vertical,
						scaler:		axis.scaler,
						ticks:		axis.ticks
					};
				}
			});
			return ret;	//	Object
		},
		setAxisWindow: function(name, scale, offset, zoom){
			//	summary:
			//		Zooms an axis and all dependent plots. Can be used to zoom in 1D.
			//	name: String
			//		The name of the axis as defined by addAxis.
			//	scale: Number
			//		The scale on the target axis.
			//	offset: Number
			//		Any offest, as measured by axis tick
			//	zoom: Boolean|Object?
			//		The chart zooming animation trigger.  This is null by default,
			//		e.g. {duration: 1200}, or just set true.
			//	returns: dojox.charting.Chart
			//		A reference to the current chart for functional chaining.
			var axis = this.axes[name];
			if(axis){
				axis.setWindow(scale, offset);
				arr.forEach(this.stack,function(plot){
					if(plot.hAxis == name || plot.vAxis == name){
						plot.zoom = zoom;
					}
				});
			}
			return this;	//	dojox.charting.Chart
		},
		setWindow: function(sx, sy, dx, dy, zoom){
			//	summary:
			//		Zooms in or out any plots in two dimensions.
			//	sx: Number
			//		The scale for the x axis.
			//	sy: Number
			//		The scale for the y axis.
			//	dx: Number
			//		The pixel offset on the x axis.
			//	dy: Number
			//		The pixel offset on the y axis.
			//	zoom: Boolean|Object?
			//		The chart zooming animation trigger.  This is null by default,
			//		e.g. {duration: 1200}, or just set true.
			//	returns: dojox.charting.Chart
			//		A reference to the current chart for functional chaining.
			if(!("plotArea" in this)){
				this.calculateGeometry();
			}
			func.forIn(this.axes, function(axis){
				var scale, offset, bounds = axis.getScaler().bounds,
					s = bounds.span / (bounds.upper - bounds.lower);
				if(axis.vertical){
					scale  = sy;
					offset = dy / s / scale;
				}else{
					scale  = sx;
					offset = dx / s / scale;
				}
				axis.setWindow(scale, offset);
			});
			arr.forEach(this.stack, function(plot){ plot.zoom = zoom; });
			return this;	//	dojox.charting.Chart
		},
		zoomIn:	function(name, range){
			//	summary:
			//		Zoom the chart to a specific range on one axis.  This calls render()
			//		directly as a convenience method.
			//	name: String
			//		The name of the axis as defined by addAxis.
			//	range: Array
			//		The end points of the zoom range, measured in axis ticks.
			var axis = this.axes[name];
			if(axis){
				var scale, offset, bounds = axis.getScaler().bounds;
				var lower = Math.min(range[0],range[1]);
				var upper = Math.max(range[0],range[1]);
				lower = range[0] < bounds.lower ? bounds.lower : lower;
				upper = range[1] > bounds.upper ? bounds.upper : upper;
				scale = (bounds.upper - bounds.lower) / (upper - lower);
				offset = lower - bounds.lower;
				this.setAxisWindow(name, scale, offset);
				this.render();
			}
		},
		calculateGeometry: function(){
			//	summary:
			//		Calculate the geometry of the chart based on the defined axes of
			//		a chart.
			//	returns: dojox.charting.Chart
			//		A reference to the current chart for functional chaining.
			if(this.dirty){
				return this.fullGeometry();
			}

			// calculate geometry
			var dirty = arr.filter(this.stack, function(plot){
					return plot.dirty ||
						(plot.hAxis && this.axes[plot.hAxis].dirty) ||
						(plot.vAxis && this.axes[plot.vAxis].dirty);
				}, this);
			calculateAxes(dirty, this.plotArea);

			return this;	//	dojox.charting.Chart
		},
		fullGeometry: function(){
			//	summary:
			//		Calculate the full geometry of the chart.  This includes passing
			//		over all major elements of a chart (plots, axes, series, container)
			//		in order to ensure proper rendering.
			//	returns: dojox.charting.Chart
			//		A reference to the current chart for functional chaining.
			this._makeDirty();

			// clear old values
			arr.forEach(this.stack, clear);

			// rebuild new connections, and add defaults

			// set up a theme
			if(!this.theme){
				this.setTheme(new Theme(dojox.charting._def));
			}

			// assign series
			arr.forEach(this.series, function(run){
				if(!(run.plot in this.plots)){
					if(!dc.plot2d || !dc.plot2d.Default){
						throw Error("Can't find plot: Default - didn't you forget to dojo" + ".require() it?");
					}
					var plot = new dc.plot2d.Default(this, {});
					plot.name = run.plot;
					this.plots[run.plot] = this.stack.length;
					this.stack.push(plot);
				}
				this.stack[this.plots[run.plot]].addSeries(run);
			}, this);
			// assign axes
			arr.forEach(this.stack, function(plot){
				if(plot.hAxis){
					plot.setAxis(this.axes[plot.hAxis]);
				}
				if(plot.vAxis){
					plot.setAxis(this.axes[plot.vAxis]);
				}
			}, this);

			// calculate geometry

			// 1st pass
			var dim = this.dim = this.surface.getDimensions();
			dim.width  = g.normalizedLength(dim.width);
			dim.height = g.normalizedLength(dim.height);
			func.forIn(this.axes, clear);
			calculateAxes(this.stack, dim);

			// assumption: we don't have stacked axes yet
			var offsets = this.offsets = { l: 0, r: 0, t: 0, b: 0 };
			func.forIn(this.axes, function(axis){
				func.forIn(axis.getOffsets(), function(o, i){ offsets[i] += o; });
			});
			// add title area
			if(this.title){
				this.titleGap = (this.titleGap==0) ? 0 : this.titleGap || this.theme.chart.titleGap || 20;
				this.titlePos = this.titlePos || this.theme.chart.titlePos || "top";
				this.titleFont = this.titleFont || this.theme.chart.titleFont;
				this.titleFontColor = this.titleFontColor || this.theme.chart.titleFontColor || "black";
				var tsize = g.normalizedLength(g.splitFontString(this.titleFont).size);
				offsets[this.titlePos=="top" ? "t":"b"] += (tsize + this.titleGap);
			}
			// add margins
			func.forIn(this.margins, function(o, i){ offsets[i] += o; });

			// 2nd pass with realistic dimensions
			this.plotArea = {
				width: dim.width - offsets.l - offsets.r,
				height: dim.height - offsets.t - offsets.b
			};
			func.forIn(this.axes, clear);
			calculateAxes(this.stack, this.plotArea);

			return this;	//	dojox.charting.Chart
		},
		render: function(){
			//	summary:
			//		Render the chart according to the current information defined.  This should
			//		be the last call made when defining/creating a chart, or if data within the
			//		chart has been changed.
			//	returns: dojox.charting.Chart
			//		A reference to the current chart for functional chaining.
			if(this.theme){
				this.theme.clear();
			}

			if(this.dirty){
				return this.fullRender();
			}

			this.calculateGeometry();

			// go over the stack backwards
			func.forEachRev(this.stack, function(plot){ plot.render(this.dim, this.offsets); }, this);

			// go over axes
			func.forIn(this.axes, function(axis){ axis.render(this.dim, this.offsets); }, this);

			this._makeClean();

			// BEGIN FOR HTML CANVAS
			if(this.surface.render){ this.surface.render(); };
			// END FOR HTML CANVAS

			return this;	//	dojox.charting.Chart
		},
		fullRender: function(){
			//	summary:
			//		Force a full rendering of the chart, including full resets on the chart itself.
			//		You should not call this method directly unless absolutely necessary.
			//	returns: dojox.charting.Chart
			//		A reference to the current chart for functional chaining.

			// calculate geometry
			this.fullGeometry();
			var offsets = this.offsets, dim = this.dim, rect;

			// get required colors
			//var requiredColors = func.foldl(this.stack, "z + plot.getRequiredColors()", 0);
			//this.theme.defineColors({num: requiredColors, cache: false});

			// clear old shapes
			arr.forEach(this.series, purge);
			func.forIn(this.axes, purge);
			arr.forEach(this.stack,  purge);
			if(this.chartTitle && this.chartTitle.tagName){
				// destroy title if it is a DOM node
			    domConstruct.destroy(this.chartTitle);
            }
			this.surface.clear();
			this.chartTitle = null;

			// generate shapes

			// draw a plot background
			var t = this.theme,
				fill   = t.plotarea && t.plotarea.fill,
				stroke = t.plotarea && t.plotarea.stroke,
				// size might be neg if offsets are bigger that chart size this happens quite often at 
				// initialization time if the chart widget is used in a BorderContainer
				// this will fail on IE/VML
				w = Math.max(0, dim.width  - offsets.l - offsets.r),
				h = Math.max(0, dim.height - offsets.t - offsets.b),
				rect = {
					x: offsets.l - 1, y: offsets.t - 1,
					width:  w + 2,
					height: h + 2
				};
			if(fill){
				fill = Element.prototype._shapeFill(Element.prototype._plotFill(fill, dim, offsets), rect);
				this.surface.createRect(rect).setFill(fill);
			}
			if(stroke){
				this.surface.createRect({
					x: offsets.l, y: offsets.t,
					width:  w + 1,
					height: h + 1
				}).setStroke(stroke);
			}

			// go over the stack backwards
			func.foldr(this.stack, function(z, plot){ return plot.render(dim, offsets), 0; }, 0);

			// pseudo-clipping: matting
			fill   = this.fill   !== undefined ? this.fill   : (t.chart && t.chart.fill);
			stroke = this.stroke !== undefined ? this.stroke : (t.chart && t.chart.stroke);

			//	TRT: support for "inherit" as a named value in a theme.
			if(fill == "inherit"){
				//	find the background color of the nearest ancestor node, and use that explicitly.
				var node = this.node, fill = new Color(html.style(node, "backgroundColor"));
				while(fill.a==0 && node!=document.documentElement){
					fill = new Color(html.style(node, "backgroundColor"));
					node = node.parentNode;
				}
			}

			if(fill){
				fill = Element.prototype._plotFill(fill, dim, offsets);
				if(offsets.l){	// left
					rect = {
						width:  offsets.l,
						height: dim.height + 1
					};
					this.surface.createRect(rect).setFill(Element.prototype._shapeFill(fill, rect));
				}
				if(offsets.r){	// right
					rect = {
						x: dim.width - offsets.r,
						width:  offsets.r + 1,
						height: dim.height + 2
					};
					this.surface.createRect(rect).setFill(Element.prototype._shapeFill(fill, rect));
				}
				if(offsets.t){	// top
					rect = {
						width:  dim.width + 1,
						height: offsets.t
					};
					this.surface.createRect(rect).setFill(Element.prototype._shapeFill(fill, rect));
				}
				if(offsets.b){	// bottom
					rect = {
						y: dim.height - offsets.b,
						width:  dim.width + 1,
						height: offsets.b + 2
					};
					this.surface.createRect(rect).setFill(Element.prototype._shapeFill(fill, rect));
				}
			}
			if(stroke){
				this.surface.createRect({
					width:  dim.width - 1,
					height: dim.height - 1
				}).setStroke(stroke);
			}

			//create title: Whether to make chart title as a widget which extends dojox.charting.Element?
			if(this.title){
				var forceHtmlLabels = (g.renderer == "canvas"),
					labelType = forceHtmlLabels || !has("ie") && !has("opera") ? "html" : "gfx",
					tsize = g.normalizedLength(g.splitFontString(this.titleFont).size);
				this.chartTitle = common.createText[labelType](
					this,
					this.surface,
					dim.width/2,
					this.titlePos=="top" ? tsize + this.margins.t : dim.height - this.margins.b,
					"middle",
					this.title,
					this.titleFont,
					this.titleFontColor
				);
			}

			// go over axes
			func.forIn(this.axes, function(axis){ axis.render(dim, offsets); });

			this._makeClean();

			// BEGIN FOR HTML CANVAS
			if(this.surface.render){ this.surface.render(); };
			// END FOR HTML CANVAS

			return this;	//	dojox.charting.Chart
		},
		delayedRender: function(){
			//	summary:
			//		Delayed render, which is used to collect multiple updates
			//		within a delayInMs time window.
			//	returns: dojox.charting.Chart
			//		A reference to the current chart for functional chaining.

			if(!this._delayedRenderHandle){
				this._delayedRenderHandle = setTimeout(
					lang.hitch(this, function(){
						clearTimeout(this._delayedRenderHandle);
						this._delayedRenderHandle = null;
						this.render();
					}),
					this.delayInMs
				);
			}

			return this;	//	dojox.charting.Chart
		},
		connectToPlot: function(name, object, method){
			//	summary:
			//		A convenience method to connect a function to a plot.
			//	name: String
			//		The name of the plot as defined by addPlot.
			//	object: Object
			//		The object to be connected.
			//	method: Function
			//		The function to be executed.
			//	returns: Array
			//		A handle to the connection, as defined by dojo.connect (see dojo.connect).
			return name in this.plots ? this.stack[this.plots[name]].connect(object, method) : null;	//	Array
		},
		fireEvent: function(seriesName, eventName, index){
			//	summary:
			//		Fires a synthetic event for a series item.
			//	seriesName: String:
			//		Series name.
			//	eventName: String:
			//		Event name to simulate: onmouseover, onmouseout, onclick.
			//	index: Number:
			//		Valid data value index for the event.
			//	returns: dojox.charting.Chart
			//		A reference to the current chart for functional chaining.
			if(seriesName in this.runs){
				var plotName = this.series[this.runs[seriesName]].plot;
				if(plotName in this.plots){
					var plot = this.stack[this.plots[plotName]];
					if(plot){
						plot.fireEvent(seriesName, eventName, index);
					}
				}
			}
			return this;	//	dojox.charting.Chart
		},
		_makeClean: function(){
			// reset dirty flags
			arr.forEach(this.axes,   makeClean);
			arr.forEach(this.stack,  makeClean);
			arr.forEach(this.series, makeClean);
			this.dirty = false;
		},
		_makeDirty: function(){
			// reset dirty flags
			arr.forEach(this.axes,   makeDirty);
			arr.forEach(this.stack,  makeDirty);
			arr.forEach(this.series, makeDirty);
			this.dirty = true;
		},
		_invalidateDependentPlots: function(plotName, /* Boolean */ verticalAxis){
			if(plotName in this.plots){
				var plot = this.stack[this.plots[plotName]], axis,
					axisName = verticalAxis ? "vAxis" : "hAxis";
				if(plot[axisName]){
					axis = this.axes[plot[axisName]];
					if(axis && axis.dependOnData()){
						axis.dirty = true;
						// find all plots and mark them dirty
						arr.forEach(this.stack, function(p){
							if(p[axisName] && p[axisName] == plot[axisName]){
								p.dirty = true;
							}
						});
					}
				}else{
					plot.dirty = true;
				}
			}
		}
	});

	function hSection(stats){
		return {min: stats.hmin, max: stats.hmax};
	}

	function vSection(stats){
		return {min: stats.vmin, max: stats.vmax};
	}

	function hReplace(stats, h){
		stats.hmin = h.min;
		stats.hmax = h.max;
	}

	function vReplace(stats, v){
		stats.vmin = v.min;
		stats.vmax = v.max;
	}

	function combineStats(target, source){
		if(target && source){
			target.min = Math.min(target.min, source.min);
			target.max = Math.max(target.max, source.max);
		}
		return target || source;
	}

	function calculateAxes(stack, plotArea){
		var plots = {}, axes = {};
		arr.forEach(stack, function(plot){
			var stats = plots[plot.name] = plot.getSeriesStats();
			if(plot.hAxis){
				axes[plot.hAxis] = combineStats(axes[plot.hAxis], hSection(stats));
			}
			if(plot.vAxis){
				axes[plot.vAxis] = combineStats(axes[plot.vAxis], vSection(stats));
			}
		});
		arr.forEach(stack, function(plot){
			var stats = plots[plot.name];
			if(plot.hAxis){
				hReplace(stats, axes[plot.hAxis]);
			}
			if(plot.vAxis){
				vReplace(stats, axes[plot.vAxis]);
			}
			plot.initializeScalers(plotArea, stats);
		});
	}
	
	return dojox.charting.Chart;
});

},
'dojox/charting/plot2d/Candlesticks':function(){
define("dojox/charting/plot2d/Candlesticks", ["dojo/_base/lang", "dojo/_base/declare", "dojo/_base/array", "./Base", "./common", 
		"dojox/lang/functional", "dojox/lang/functional/reversed", "dojox/lang/utils", "dojox/gfx/fx"], 
	function(lang, declare, arr, Base, dc, df, dfr, du, fx){
/*=====
var Base = dojox.charting.plot2d.Base;
=====*/

	var purgeGroup = dfr.lambda("item.purgeGroup()");

	//	Candlesticks are based on the Bars plot type; we expect the following passed
	//	as values in a series:
	//	{ x?, open, close, high, low, mid? }
	//	if x is not provided, the array index is used.
	//	failing to provide the OHLC values will throw an error.
	return declare("dojox.charting.plot2d.Candlesticks", Base, {
		//	summary:
		//		A plot that represents typical candlesticks (financial reporting, primarily).
		//		Unlike most charts, the Candlestick expects data points to be represented by
		//		an object of the form { x?, open, close, high, low, mid? }, where both
		//		x and mid are optional parameters.  If x is not provided, the index of the
		//		data array is used.
		defaultParams: {
			hAxis: "x",		// use a horizontal axis named "x"
			vAxis: "y",		// use a vertical axis named "y"
			gap:	2,		// gap between columns in pixels
			animate: null   // animate bars into place
		},
		optionalParams: {
			minBarSize:	1,	// minimal candle width in pixels
			maxBarSize:	1,	// maximal candle width in pixels
			// theme component
			stroke:		{},
			outline:	{},
			shadow:		{},
			fill:		{},
			font:		"",
			fontColor:	""
		},

		constructor: function(chart, kwArgs){
			//	summary:
			//		The constructor for a candlestick chart.
			//	chart: dojox.charting.Chart
			//		The chart this plot belongs to.
			//	kwArgs: dojox.charting.plot2d.__BarCtorArgs?
			//		An optional keyword arguments object to help define the plot.
			this.opt = lang.clone(this.defaultParams);
			du.updateWithObject(this.opt, kwArgs);
			du.updateWithPattern(this.opt, kwArgs, this.optionalParams);
			this.series = [];
			this.hAxis = this.opt.hAxis;
			this.vAxis = this.opt.vAxis;
			this.animate = this.opt.animate;
		},

		collectStats: function(series){
			//	summary:
			//		Collect all statistics for drawing this chart.  Since the common
			//		functionality only assumes x and y, Candlesticks must create it's own
			//		stats (since data has no y value, but open/close/high/low instead).
			//	series: dojox.charting.Series[]
			//		The data series array to be drawn on this plot.
			//	returns: Object
			//		Returns an object in the form of { hmin, hmax, vmin, vmax }.

			//	we have to roll our own, since we need to use all four passed
			//	values to figure out our stats, and common only assumes x and y.
			var stats = lang.delegate(dc.defaultStats);
			for(var i=0; i<series.length; i++){
				var run = series[i];
				if(!run.data.length){ continue; }
				var old_vmin = stats.vmin, old_vmax = stats.vmax;
				if(!("ymin" in run) || !("ymax" in run)){
					arr.forEach(run.data, function(val, idx){
						if(val !== null){
							var x = val.x || idx + 1;
							stats.hmin = Math.min(stats.hmin, x);
							stats.hmax = Math.max(stats.hmax, x);
							stats.vmin = Math.min(stats.vmin, val.open, val.close, val.high, val.low);
							stats.vmax = Math.max(stats.vmax, val.open, val.close, val.high, val.low);
						}
					});
				}
				if("ymin" in run){ stats.vmin = Math.min(old_vmin, run.ymin); }
				if("ymax" in run){ stats.vmax = Math.max(old_vmax, run.ymax); }
			}
			return stats;	//	Object
		},

		getSeriesStats: function(){
			//	summary:
			//		Calculate the min/max on all attached series in both directions.
			//	returns: Object
			//		{hmin, hmax, vmin, vmax} min/max in both directions.
			var stats = this.collectStats(this.series);
			stats.hmin -= 0.5;
			stats.hmax += 0.5;
			return stats;
		},

		render: function(dim, offsets){
			//	summary:
			//		Run the calculations for any axes for this plot.
			//	dim: Object
			//		An object in the form of { width, height }
			//	offsets: Object
			//		An object of the form { l, r, t, b}.
			//	returns: dojox.charting.plot2d.Candlesticks
			//		A reference to this plot for functional chaining.
			if(this.zoom && !this.isDataDirty()){
				return this.performZoom(dim, offsets);
			}
			this.resetEvents();
			this.dirty = this.isDirty();
			if(this.dirty){
				arr.forEach(this.series, purgeGroup);
				this._eventSeries = {};
				this.cleanGroup();
				var s = this.group;
				df.forEachRev(this.series, function(item){ item.cleanGroup(s); });
			}
			var t = this.chart.theme, f, gap, width,
				ht = this._hScaler.scaler.getTransformerFromModel(this._hScaler),
				vt = this._vScaler.scaler.getTransformerFromModel(this._vScaler),
				baseline = Math.max(0, this._vScaler.bounds.lower),
				baselineHeight = vt(baseline),
				events = this.events();
			f = dc.calculateBarSize(this._hScaler.bounds.scale, this.opt);
			gap = f.gap;
			width = f.size;
			for(var i = this.series.length - 1; i >= 0; --i){
				var run = this.series[i];
				if(!this.dirty && !run.dirty){
					t.skip();
					this._reconnectEvents(run.name);
					continue;
				}
				run.cleanGroup();
				var theme = t.next("candlestick", [this.opt, run]), s = run.group,
					eventSeries = new Array(run.data.length);
				for(var j = 0; j < run.data.length; ++j){
					var v = run.data[j];
					if(v !== null){
						var finalTheme = t.addMixin(theme, "candlestick", v, true);

						//	calculate the points we need for OHLC
						var x = ht(v.x || (j+0.5)) + offsets.l + gap,
							y = dim.height - offsets.b,
							open = vt(v.open),
							close = vt(v.close),
							high = vt(v.high),
							low = vt(v.low);
						if("mid" in v){
							var mid = vt(v.mid);
						}
						if(low > high){
							var tmp = high;
							high = low;
							low = tmp;
						}

						if(width >= 1){
							//	draw the line and rect, set up as a group and pass that to the events.
							var doFill = open > close;
							var line = { x1: width/2, x2: width/2, y1: y - high, y2: y - low },
								rect = {
									x: 0, y: y-Math.max(open, close),
									width: width, height: Math.max(doFill ? open-close : close-open, 1)
								};
							var shape = s.createGroup();
							shape.setTransform({dx: x, dy: 0 });
							var inner = shape.createGroup();
							inner.createLine(line).setStroke(finalTheme.series.stroke);
							inner.createRect(rect).setStroke(finalTheme.series.stroke).
								setFill(doFill ? finalTheme.series.fill : "white");
							if("mid" in v){
								//	add the mid line.
								inner.createLine({
									x1: (finalTheme.series.stroke.width||1), x2: width - (finalTheme.series.stroke.width || 1),
									y1: y - mid, y2: y - mid
								}).setStroke(doFill ? "white" : finalTheme.series.stroke);
							}

							//	TODO: double check this.
							run.dyn.fill   = finalTheme.series.fill;
							run.dyn.stroke = finalTheme.series.stroke;
							if(events){
								var o = {
									element: "candlestick",
									index:   j,
									run:     run,
									shape:   inner,
									x:       x,
									y:       y-Math.max(open, close),
									cx:		 width/2,
									cy:		 (y-Math.max(open, close)) + (Math.max(doFill ? open-close : close-open, 1)/2),
									width:	 width,
									height:  Math.max(doFill ? open-close : close-open, 1),
									data:	 v
								};
								this._connectEvents(o);
								eventSeries[j] = o;
							}
						}
						if(this.animate){
							this._animateCandlesticks(shape, y - low, high - low);
						}
					}
				}
				this._eventSeries[run.name] = eventSeries;
				run.dirty = false;
			}
			this.dirty = false;
			return this;	//	dojox.charting.plot2d.Candlesticks
		},
		_animateCandlesticks: function(shape, voffset, vsize){
			fx.animateTransform(lang.delegate({
				shape: shape,
				duration: 1200,
				transform: [
					{name: "translate", start: [0, voffset - (voffset/vsize)], end: [0, 0]},
					{name: "scale", start: [1, 1/vsize], end: [1, 1]},
					{name: "original"}
				]
			}, this.animate)).play();
		}
	});
});

},
'dojox/charting/axis2d/Default':function(){
define("dojox/charting/axis2d/Default", ["dojo/_base/lang", "dojo/_base/array","dojo/_base/sniff", "dojo/_base/declare", 
	"dojo/_base/connect", "dojo/_base/html", "dojo/dom-geometry", "./Invisible", 
	"../scaler/common", "../scaler/linear", "./common", "dojox/gfx", "dojox/lang/utils"], 
	function(lang, arr, has, declare, connect, html, domGeom, Invisible, scommon, 
			lin, acommon, g, du){

	/*=====
		dojox.charting.axis2d.__AxisCtorArgs = function(
			vertical, fixUpper, fixLower, natural, leftBottom,
			includeZero, fixed, majorLabels, minorTicks, minorLabels, microTicks, htmlLabels,
			min, max, from, to, majorTickStep, minorTickStep, microTickStep,
			labels, labelFunc, maxLabelSize,
			stroke, majorTick, minorTick, microTick, tick,
			font, fontColor
		){
		//	summary:
		//		Optional arguments used in the definition of an axis.
		//
		//	vertical: Boolean?
		//		A flag that says whether an axis is vertical (i.e. y axis) or horizontal. Default is false (horizontal).
		//	fixUpper: String?
		//		Align the greatest value on the axis with the specified tick level. Options are "major", "minor", "micro", or "none".  Defaults to "none".
		//	fixLower: String?
		//		Align the smallest value on the axis with the specified tick level. Options are "major", "minor", "micro", or "none".  Defaults to "none".
		//	natural: Boolean?
		//		Ensure tick marks are made on "natural" numbers. Defaults to false.
		//	leftBottom: Boolean?
		//		The position of a vertical axis; if true, will be placed against the left-bottom corner of the chart.  Defaults to true.
		//	includeZero: Boolean?
		//		Include 0 on the axis rendering.  Default is false.
		//	fixed: Boolean?
		//		Force all axis labels to be fixed numbers.  Default is true.
		//	majorLabels: Boolean?
		//		Flag to draw all labels at major ticks. Default is true.
		//	minorTicks: Boolean?
		//		Flag to draw minor ticks on an axis.  Default is true.
		//	minorLabels: Boolean?
		//		Flag to draw labels on minor ticks. Default is true.
		//	microTicks: Boolean?
		//		Flag to draw micro ticks on an axis. Default is false.
		//	htmlLabels: Boolean?
		//		Flag to use HTML (as opposed to the native vector graphics engine) to draw labels. Default is true.
		//	min: Number?
		//		The smallest value on an axis. Default is 0.
		//	max: Number?
		//		The largest value on an axis. Default is 1.
		//	from: Number?
		//		Force the chart to render data visible from this value. Default is 0.
		//	to: Number?
		//		Force the chart to render data visible to this value. Default is 1.
		//	majorTickStep: Number?
		//		The amount to skip before a major tick is drawn.  Default is 4.
		//	minorTickStep: Number?
		//		The amount to skip before a minor tick is drawn. Default is 2.
		//	microTickStep: Number?
		//		The amount to skip before a micro tick is drawn. Default is 1.
		//	labels: Object[]?
		//		An array of labels for major ticks, with corresponding numeric values, ordered by value.
		//	labelFunc: Function?
		//		An optional function used to compute label values.
		//	maxLabelSize: Number?
		//		The maximum size, in pixels, for a label.  To be used with the optional label function.
		//	stroke: dojox.gfx.Stroke?
		//		An optional stroke to be used for drawing an axis.
		//	majorTick: Object?
		//		An object containing a dojox.gfx.Stroke, and a length (number) for a major tick.
		//	minorTick: Object?
		//		An object containing a dojox.gfx.Stroke, and a length (number) for a minor tick.
		//	microTick: Object?
		//		An object containing a dojox.gfx.Stroke, and a length (number) for a micro tick.
		//	tick: Object?
		//		An object containing a dojox.gfx.Stroke, and a length (number) for a tick.
		//	font: String?
		//		An optional font definition (as used in the CSS font property) for labels.
		//	fontColor: String|dojo.Color?
		//		An optional color to be used in drawing labels.
		//	enableCache: Boolean?
		//		Whether the ticks and labels are cached from one rendering to another. This improves the rendering performance of
		//		successive rendering but penalize the first rendering. For labels it is only working with gfx labels
		//		not html ones.  Default false.
	
		this.vertical = vertical;
		this.fixUpper = fixUpper;
		this.fixLower = fixLower;
		this.natural = natural;
		this.leftBottom = leftBottom;
		this.includeZero = includeZero;
		this.fixed = fixed;
		this.majorLabels = majorLabels;
		this.minorTicks = minorTicks;
		this.minorLabels = minorLabels;
		this.microTicks = microTicks;
		this.htmlLabels = htmlLabels;
		this.min = min;
		this.max = max;
		this.from = from;
		this.to = to;
		this.majorTickStep = majorTickStep;
		this.minorTickStep = minorTickStep;
		this.microTickStep = microTickStep;
		this.labels = labels;
		this.labelFunc = labelFunc;
		this.maxLabelSize = maxLabelSize;
		this.stroke = stroke;
		this.majorTick = majorTick;
		this.minorTick = minorTick;
		this.microTick = microTick;
		this.tick = tick;
		this.font = font;
		this.fontColor = fontColor;
		this.enableCache = enableCache;
	}
	var Invisible = dojox.charting.axis2d.Invisible
	=====*/

	var labelGap = 4,			// in pixels
		centerAnchorLimit = 45;	// in degrees

	return declare("dojox.charting.axis2d.Default", Invisible, {
		//	summary:
		//		The default axis object used in dojox.charting.  See dojox.charting.Chart.addAxis for details.
		//
		//	defaultParams: Object
		//		The default parameters used to define any axis.
		//	optionalParams: Object
		//		Any optional parameters needed to define an axis.

		/*
		//	TODO: the documentation tools need these to be pre-defined in order to pick them up
		//	correctly, but the code here is partially predicated on whether or not the properties
		//	actually exist.  For now, we will leave these undocumented but in the code for later. -- TRT

		//	opt: Object
		//		The actual options used to define this axis, created at initialization.
		//	scalar: Object
		//		The calculated helper object to tell charts how to draw an axis and any data.
		//	ticks: Object
		//		The calculated tick object that helps a chart draw the scaling on an axis.
		//	dirty: Boolean
		//		The state of the axis (whether it needs to be redrawn or not)
		//	scale: Number
		//		The current scale of the axis.
		//	offset: Number
		//		The current offset of the axis.

		opt: null,
		scalar: null,
		ticks: null,
		dirty: true,
		scale: 1,
		offset: 0,
		*/
		defaultParams: {
			vertical:    false,		// true for vertical axis
			fixUpper:    "none",	// align the upper on ticks: "major", "minor", "micro", "none"
			fixLower:    "none",	// align the lower on ticks: "major", "minor", "micro", "none"
			natural:     false,		// all tick marks should be made on natural numbers
			leftBottom:  true,		// position of the axis, used with "vertical"
			includeZero: false,		// 0 should be included
			fixed:       true,		// all labels are fixed numbers
			majorLabels: true,		// draw major labels
			minorTicks:  true,		// draw minor ticks
			minorLabels: true,		// draw minor labels
			microTicks:  false,		// draw micro ticks
			rotation:    0,			// label rotation angle in degrees
			htmlLabels:  true,		// use HTML to draw labels
			enableCache: false		// whether we cache or not
		},
		optionalParams: {
			min:			0,	// minimal value on this axis
			max:			1,	// maximal value on this axis
			from:			0,	// visible from this value
			to:				1,	// visible to this value
			majorTickStep:	4,	// major tick step
			minorTickStep:	2,	// minor tick step
			microTickStep:	1,	// micro tick step
			labels:			[],	// array of labels for major ticks
								// with corresponding numeric values
								// ordered by values
			labelFunc:		null, // function to compute label values
			maxLabelSize:	0,	// size in px. For use with labelFunc
			maxLabelCharCount:	0,	// size in word count.
			trailingSymbol:	null,

			// TODO: add support for minRange!
			// minRange:		1,	// smallest distance from min allowed on the axis

			// theme components
			stroke:			{},	// stroke for an axis
			majorTick:		{},	// stroke + length for a tick
			minorTick:		{},	// stroke + length for a tick
			microTick:		{},	// stroke + length for a tick
			tick:           {},	// stroke + length for a tick
			font:			"",	// font for labels
			fontColor:		"",	// color for labels as a string
			title:		 		"",	// axis title
			titleGap:	 		0,		// gap between axis title and axis label
			titleFont:	 		"",		// axis title font
			titleFontColor:	 	"",		// axis title font color
			titleOrientation: 	""		// "axis" means the title facing the axis, "away" means facing away
		},

		constructor: function(chart, kwArgs){
			//	summary:
			//		The constructor for an axis.
			//	chart: dojox.charting.Chart
			//		The chart the axis belongs to.
			//	kwArgs: dojox.charting.axis2d.__AxisCtorArgs?
			//		Any optional keyword arguments to be used to define this axis.
			this.opt = lang.clone(this.defaultParams);
            du.updateWithObject(this.opt, kwArgs);
			du.updateWithPattern(this.opt, kwArgs, this.optionalParams);
			if(this.opt.enableCache){
				this._textFreePool = [];
				this._lineFreePool = [];
				this._textUsePool = [];
				this._lineUsePool = [];
			}
		},
		getOffsets: function(){
			//	summary:
			//		Get the physical offset values for this axis (used in drawing data series).
			//	returns: Object
			//		The calculated offsets in the form of { l, r, t, b } (left, right, top, bottom).
			var s = this.scaler, offsets = { l: 0, r: 0, t: 0, b: 0 };
			if(!s){
				return offsets;
			}
			var o = this.opt, labelWidth = 0, a, b, c, d,
				gl = scommon.getNumericLabel,
				offset = 0, ma = s.major, mi = s.minor,
				ta = this.chart.theme.axis,
				// TODO: we use one font --- of major tick, we need to use major and minor fonts
				taFont = o.font || (ta.majorTick && ta.majorTick.font) || (ta.tick && ta.tick.font),
				taTitleFont = o.titleFont || (ta.tick && ta.tick.titleFont),
				taTitleGap = (o.titleGap==0) ? 0 : o.titleGap || (ta.tick && ta.tick.titleGap) || 15,
				taMajorTick = this.chart.theme.getTick("major", o),
				taMinorTick = this.chart.theme.getTick("minor", o),
				size = taFont ? g.normalizedLength(g.splitFontString(taFont).size) : 0,
				tsize = taTitleFont ? g.normalizedLength(g.splitFontString(taTitleFont).size) : 0,
				rotation = o.rotation % 360, leftBottom = o.leftBottom,
				cosr = Math.abs(Math.cos(rotation * Math.PI / 180)),
				sinr = Math.abs(Math.sin(rotation * Math.PI / 180));
			this.trailingSymbol = (o.trailingSymbol === undefined || o.trailingSymbol === null) ? this.trailingSymbol : o.trailingSymbol;
			if(rotation < 0){
				rotation += 360;
			}

			if(size){
				// we need width of all labels
				if(this.labels){
					labelWidth = this._groupLabelWidth(this.labels, taFont, o.maxLabelCharCount);
				}else{
					labelWidth = this._groupLabelWidth([
						gl(ma.start, ma.prec, o),
						gl(ma.start + ma.count * ma.tick, ma.prec, o),
						gl(mi.start, mi.prec, o),
						gl(mi.start + mi.count * mi.tick, mi.prec, o)
					], taFont, o.maxLabelCharCount);
				}
				labelWidth = o.maxLabelSize ? Math.min(o.maxLabelSize, labelWidth) : labelWidth;
				if(this.vertical){
					var side = leftBottom ? "l" : "r";
					switch(rotation){
						case 0:
						case 180:
							offsets[side] = labelWidth;
							offsets.t = offsets.b = size / 2;
							break;
						case 90:
						case 270:
							offsets[side] = size;
							offsets.t = offsets.b = labelWidth / 2;
							break;
						default:
							if(rotation <= centerAnchorLimit || (180 < rotation && rotation <= (180 + centerAnchorLimit))){
								offsets[side] = size * sinr / 2 + labelWidth * cosr;
								offsets[leftBottom ? "t" : "b"] = size * cosr / 2 + labelWidth * sinr;
								offsets[leftBottom ? "b" : "t"] = size * cosr / 2;
							}else if(rotation > (360 - centerAnchorLimit) || (180 > rotation && rotation > (180 - centerAnchorLimit))){
								offsets[side] = size * sinr / 2 + labelWidth * cosr;
								offsets[leftBottom ? "b" : "t"] = size * cosr / 2 + labelWidth * sinr;
								offsets[leftBottom ? "t" : "b"] = size * cosr / 2;
							}else if(rotation < 90 || (180 < rotation && rotation < 270)){
								offsets[side] = size * sinr + labelWidth * cosr;
								offsets[leftBottom ? "t" : "b"] = size * cosr + labelWidth * sinr;
							}else{
								offsets[side] = size * sinr + labelWidth * cosr;
								offsets[leftBottom ? "b" : "t"] = size * cosr + labelWidth * sinr;
							}
							break;
					}
					offsets[side] += labelGap + Math.max(taMajorTick.length, taMinorTick.length) + (o.title ? (tsize + taTitleGap) : 0);
				}else{
					var side = leftBottom ? "b" : "t";
					switch(rotation){
						case 0:
						case 180:
							offsets[side] = size;
							offsets.l = offsets.r = labelWidth / 2;
							break;
						case 90:
						case 270:
							offsets[side] = labelWidth;
							offsets.l = offsets.r = size / 2;
							break;
						default:
							if((90 - centerAnchorLimit) <= rotation && rotation <= 90 || (270 - centerAnchorLimit) <= rotation && rotation <= 270){
								offsets[side] = size * sinr / 2 + labelWidth * cosr;
								offsets[leftBottom ? "r" : "l"] = size * cosr / 2 + labelWidth * sinr;
								offsets[leftBottom ? "l" : "r"] = size * cosr / 2;
							}else if(90 <= rotation && rotation <= (90 + centerAnchorLimit) || 270 <= rotation && rotation <= (270 + centerAnchorLimit)){
								offsets[side] = size * sinr / 2 + labelWidth * cosr;
								offsets[leftBottom ? "l" : "r"] = size * cosr / 2 + labelWidth * sinr;
								offsets[leftBottom ? "r" : "l"] = size * cosr / 2;
							}else if(rotation < centerAnchorLimit || (180 < rotation && rotation < (180 - centerAnchorLimit))){
								offsets[side] = size * sinr + labelWidth * cosr;
								offsets[leftBottom ? "r" : "l"] = size * cosr + labelWidth * sinr;
							}else{
								offsets[side] = size * sinr + labelWidth * cosr;
								offsets[leftBottom ? "l" : "r"] = size * cosr + labelWidth * sinr;
							}
							break;
					}
					offsets[side] += labelGap + Math.max(taMajorTick.length, taMinorTick.length) + (o.title ? (tsize + taTitleGap) : 0);
				}
			}
			if(labelWidth){
				this._cachedLabelWidth = labelWidth;
			}
			return offsets;	//	Object
		},
		cleanGroup: function(creator){
			if(this.opt.enableCache && this.group){
				this._lineFreePool = this._lineFreePool.concat(this._lineUsePool);
				this._lineUsePool = [];
				this._textFreePool = this._textFreePool.concat(this._textUsePool);
				this._textUsePool = [];
			}
			this.inherited(arguments);
		},
		createText: function(labelType, creator, x, y, align, textContent, font, fontColor, labelWidth){
			if(!this.opt.enableCache || labelType=="html"){
				return acommon.createText[labelType](
						this.chart,
						creator,
						x,
						y,
						align,
						textContent,
						font,
						fontColor,
						labelWidth
					);
			}
			var text;
			if (this._textFreePool.length > 0){
				text = this._textFreePool.pop();
				text.setShape({x: x, y: y, text: textContent, align: align});
				// For now all items share the same font, no need to re-set it
				//.setFont(font).setFill(fontColor);
				// was cleared, add it back
				creator.add(text);
			}else{
				text = acommon.createText[labelType](
						this.chart,
						creator,
						x,
						y,
						align,
						textContent,
						font,
						fontColor,
						labelWidth
					);			}
			this._textUsePool.push(text);
			return text;
		},
		createLine: function(creator, params){
			var line;
			if(this.opt.enableCache && this._lineFreePool.length > 0){
				line = this._lineFreePool.pop();
				line.setShape(params);
				// was cleared, add it back
				creator.add(line);
			}else{
				line = creator.createLine(params);
			}
			if(this.opt.enableCache){
				this._lineUsePool.push(line);
			}
			return line;
		},
		render: function(dim, offsets){
			//	summary:
			//		Render/draw the axis.
			//	dim: Object
			//		An object of the form { width, height}.
			//	offsets: Object
			//		An object of the form { l, r, t, b }.
			//	returns: dojox.charting.axis2d.Default
			//		The reference to the axis for functional chaining.
			if(!this.dirty){
				return this;	//	dojox.charting.axis2d.Default
			}
			// prepare variable
			var o = this.opt, ta = this.chart.theme.axis, leftBottom = o.leftBottom, rotation = o.rotation % 360,
				start, stop, titlePos, titleRotation=0, titleOffset, axisVector, tickVector, anchorOffset, labelOffset, labelAlign,

				// TODO: we use one font --- of major tick, we need to use major and minor fonts
				taFont = o.font || (ta.majorTick && ta.majorTick.font) || (ta.tick && ta.tick.font),
				taTitleFont = o.titleFont || (ta.tick && ta.tick.titleFont),
				// TODO: we use one font color --- we need to use different colors
				taFontColor = o.fontColor || (ta.majorTick && ta.majorTick.fontColor) || (ta.tick && ta.tick.fontColor) || "black",
				taTitleFontColor = o.titleFontColor || (ta.tick && ta.tick.titleFontColor) || "black",
				taTitleGap = (o.titleGap==0) ? 0 : o.titleGap || (ta.tick && ta.tick.titleGap) || 15,
				taTitleOrientation = o.titleOrientation || (ta.tick && ta.tick.titleOrientation) || "axis",
				taMajorTick = this.chart.theme.getTick("major", o),
				taMinorTick = this.chart.theme.getTick("minor", o),
				taMicroTick = this.chart.theme.getTick("micro", o),

				tickSize = Math.max(taMajorTick.length, taMinorTick.length, taMicroTick.length),
				taStroke = "stroke" in o ? o.stroke : ta.stroke,
				size = taFont ? g.normalizedLength(g.splitFontString(taFont).size) : 0,
				cosr = Math.abs(Math.cos(rotation * Math.PI / 180)),
				sinr = Math.abs(Math.sin(rotation * Math.PI / 180)),
				tsize = taTitleFont ? g.normalizedLength(g.splitFontString(taTitleFont).size) : 0;
			if(rotation < 0){
				rotation += 360;
			}
			if(this.vertical){
				start = {y: dim.height - offsets.b};
				stop  = {y: offsets.t};
				titlePos = {y: (dim.height - offsets.b + offsets.t)/2};
				titleOffset = size * sinr + (this._cachedLabelWidth || 0) * cosr + labelGap + Math.max(taMajorTick.length, taMinorTick.length) + tsize + taTitleGap;
				axisVector = {x: 0, y: -1};
				labelOffset = {x: 0, y: 0};
				tickVector = {x: 1, y: 0};
				anchorOffset = {x: labelGap, y: 0};
				switch(rotation){
					case 0:
						labelAlign = "end";
						labelOffset.y = size * 0.4;
						break;
					case 90:
						labelAlign = "middle";
						labelOffset.x = -size;
						break;
					case 180:
						labelAlign = "start";
						labelOffset.y = -size * 0.4;
						break;
					case 270:
						labelAlign = "middle";
						break;
					default:
						if(rotation < centerAnchorLimit){
							labelAlign = "end";
							labelOffset.y = size * 0.4;
						}else if(rotation < 90){
							labelAlign = "end";
							labelOffset.y = size * 0.4;
						}else if(rotation < (180 - centerAnchorLimit)){
							labelAlign = "start";
						}else if(rotation < (180 + centerAnchorLimit)){
							labelAlign = "start";
							labelOffset.y = -size * 0.4;
						}else if(rotation < 270){
							labelAlign = "start";
							labelOffset.x = leftBottom ? 0 : size * 0.4;
						}else if(rotation < (360 - centerAnchorLimit)){
							labelAlign = "end";
							labelOffset.x = leftBottom ? 0 : size * 0.4;
						}else{
							labelAlign = "end";
							labelOffset.y = size * 0.4;
						}
				}
				if(leftBottom){
					start.x = stop.x = offsets.l;
					titleRotation = (taTitleOrientation && taTitleOrientation == "away") ? 90 : 270;
					titlePos.x = offsets.l - titleOffset + (titleRotation == 270 ? tsize : 0);
					tickVector.x = -1;
					anchorOffset.x = -anchorOffset.x;
				}else{
					start.x = stop.x = dim.width - offsets.r;
					titleRotation = (taTitleOrientation && taTitleOrientation == "axis") ? 90 : 270;
					titlePos.x = dim.width - offsets.r + titleOffset - (titleRotation == 270 ? 0 : tsize);
					switch(labelAlign){
						case "start":
							labelAlign = "end";
							break;
						case "end":
							labelAlign = "start";
							break;
						case "middle":
							labelOffset.x += size;
							break;
					}
				}
			}else{
				start = {x: offsets.l};
				stop  = {x: dim.width - offsets.r};
				titlePos = {x: (dim.width - offsets.r + offsets.l)/2};
				titleOffset = size * cosr + (this._cachedLabelWidth || 0) * sinr + labelGap + Math.max(taMajorTick.length, taMinorTick.length) + tsize + taTitleGap;
				axisVector = {x: 1, y: 0};
				labelOffset = {x: 0, y: 0};
				tickVector = {x: 0, y: 1};
				anchorOffset = {x: 0, y: labelGap};
				switch(rotation){
					case 0:
						labelAlign = "middle";
						labelOffset.y = size;
						break;
					case 90:
						labelAlign = "start";
						labelOffset.x = -size * 0.4;
						break;
					case 180:
						labelAlign = "middle";
						break;
					case 270:
						labelAlign = "end";
						labelOffset.x = size * 0.4;
						break;
					default:
						if(rotation < (90 - centerAnchorLimit)){
							labelAlign = "start";
							labelOffset.y = leftBottom ? size : 0;
						}else if(rotation < (90 + centerAnchorLimit)){
							labelAlign = "start";
							labelOffset.x = -size * 0.4;
						}else if(rotation < 180){
							labelAlign = "start";
							labelOffset.y = leftBottom ? 0 : -size;
						}else if(rotation < (270 - centerAnchorLimit)){
							labelAlign = "end";
							labelOffset.y = leftBottom ? 0 : -size;
						}else if(rotation < (270 + centerAnchorLimit)){
							labelAlign = "end";
							labelOffset.y = leftBottom ? size * 0.4 : 0;
						}else{
							labelAlign = "end";
							labelOffset.y = leftBottom ? size : 0;
						}
				}
				if(leftBottom){
					start.y = stop.y = dim.height - offsets.b;
					titleRotation = (taTitleOrientation && taTitleOrientation == "axis") ? 180 : 0;
					titlePos.y = dim.height - offsets.b + titleOffset - (titleRotation ? tsize : 0);
				}else{
					start.y = stop.y = offsets.t;
					titleRotation = (taTitleOrientation && taTitleOrientation == "away") ? 180 : 0;
					titlePos.y = offsets.t - titleOffset + (titleRotation ? 0 : tsize);
					tickVector.y = -1;
					anchorOffset.y = -anchorOffset.y;
					switch(labelAlign){
						case "start":
							labelAlign = "end";
							break;
						case "end":
							labelAlign = "start";
							break;
						case "middle":
							labelOffset.y -= size;
							break;
					}
				}
			}

			// render shapes

			this.cleanGroup();

			try{
				var s = this.group,
					c = this.scaler,
					t = this.ticks,
					canLabel,
					f = lin.getTransformerFromModel(this.scaler),
					// GFX Canvas now supports labels, so let's _not_ fallback to HTML anymore on canvas, just use
					// HTML labels if explicitly asked + no rotation + no IE + no Opera
					labelType = (!o.title || !titleRotation) && !rotation && this.opt.htmlLabels && !has("ie") && !has("opera") ? "html" : "gfx",
					dx = tickVector.x * taMajorTick.length,
					dy = tickVector.y * taMajorTick.length;

				s.createLine({
					x1: start.x,
					y1: start.y,
					x2: stop.x,
					y2: stop.y
				}).setStroke(taStroke);
				
				//create axis title
				if(o.title){
					var axisTitle = acommon.createText[labelType](
						this.chart,
						s,
						titlePos.x,
						titlePos.y,
						"middle",
						o.title,
						taTitleFont,
						taTitleFontColor
					);
					if(labelType == "html"){
						this.htmlElements.push(axisTitle);
					}else{
						//as soon as rotation is provided, labelType won't be "html"
						//rotate gfx labels
						axisTitle.setTransform(g.matrix.rotategAt(titleRotation, titlePos.x, titlePos.y));
					}
				}
				
				// go out nicely instead of try/catch
				if(t==null){
					this.dirty = false;
					return this;
				}

				arr.forEach(t.major, function(tick){
					var offset = f(tick.value), elem,
						x = start.x + axisVector.x * offset,
						y = start.y + axisVector.y * offset;
						this.createLine(s, {
							x1: x, y1: y,
							x2: x + dx,
							y2: y + dy
						}).setStroke(taMajorTick);
						if(tick.label){
							var label = o.maxLabelCharCount ? this.getTextWithLimitCharCount(tick.label, taFont, o.maxLabelCharCount) : {
								text: tick.label,
								truncated: false
							};
							label = o.maxLabelSize ? this.getTextWithLimitLength(label.text, taFont, o.maxLabelSize, label.truncated) : label;
							elem = this.createText(labelType,
								s,
								x + dx + anchorOffset.x + (rotation ? 0 : labelOffset.x),
								y + dy + anchorOffset.y + (rotation ? 0 : labelOffset.y),
								labelAlign,
								label.text,
								taFont,
								taFontColor
								//this._cachedLabelWidth
							);
							
							// if bidi support was required, the textDir is "auto" and truncation
							// took place, we need to update the dir of the element for cases as: 
							// Fool label: 111111W (W for bidi character)
							// truncated label: 11... 
							// in this case for auto textDir the dir will be "ltr" which is wrong.
							if(this.chart.truncateBidi  && label.truncated){
								this.chart.truncateBidi(elem, tick.label, labelType);
							}
							label.truncated && this.labelTooltip(elem, this.chart, tick.label, label.text, taFont, labelType);
							if(labelType == "html"){
								this.htmlElements.push(elem);
							}else if(rotation){
								elem.setTransform([
									{dx: labelOffset.x, dy: labelOffset.y},
									g.matrix.rotategAt(
										rotation,
										x + dx + anchorOffset.x,
										y + dy + anchorOffset.y
									)
								]);
							}
						}
				}, this);

				dx = tickVector.x * taMinorTick.length;
				dy = tickVector.y * taMinorTick.length;
				canLabel = c.minMinorStep <= c.minor.tick * c.bounds.scale;
				arr.forEach(t.minor, function(tick){
					var offset = f(tick.value), elem,
						x = start.x + axisVector.x * offset,
						y = start.y + axisVector.y * offset;
						this.createLine(s, {
							x1: x, y1: y,
							x2: x + dx,
							y2: y + dy
						}).setStroke(taMinorTick);
						if(canLabel && tick.label){
							var label = o.maxLabelCharCount ? this.getTextWithLimitCharCount(tick.label, taFont, o.maxLabelCharCount) : {
								text: tick.label,
								truncated: false
							};
							label = o.maxLabelSize ? this.getTextWithLimitLength(label.text, taFont, o.maxLabelSize, label.truncated) : label;
							elem = this.createText(labelType,
								s,
								x + dx + anchorOffset.x + (rotation ? 0 : labelOffset.x),
								y + dy + anchorOffset.y + (rotation ? 0 : labelOffset.y),
								labelAlign,
								label.text,
								taFont,
								taFontColor
								//this._cachedLabelWidth
							);
							// if bidi support was required, the textDir is "auto" and truncation
							// took place, we need to update the dir of the element for cases as: 
							// Fool label: 111111W (W for bidi character)
							// truncated label: 11... 
							// in this case for auto textDir the dir will be "ltr" which is wrong.
							if(this.chart.getTextDir && label.truncated){
								this.chart.truncateBidi(elem, tick.label, labelType);
							}
							label.truncated && this.labelTooltip(elem, this.chart, tick.label, label.text, taFont, labelType);
							if(labelType == "html"){
								this.htmlElements.push(elem);
							}else if(rotation){
								elem.setTransform([
									{dx: labelOffset.x, dy: labelOffset.y},
									g.matrix.rotategAt(
										rotation,
										x + dx + anchorOffset.x,
										y + dy + anchorOffset.y
									)
								]);
							}
						}
				}, this);

				dx = tickVector.x * taMicroTick.length;
				dy = tickVector.y * taMicroTick.length;
				arr.forEach(t.micro, function(tick){
					var offset = f(tick.value), elem,
						x = start.x + axisVector.x * offset,
						y = start.y + axisVector.y * offset;
						this.createLine(s, {
							x1: x, y1: y,
							x2: x + dx,
							y2: y + dy
						}).setStroke(taMicroTick);
				}, this);
			}catch(e){
				// squelch
			}

			this.dirty = false;
			return this;	//	dojox.charting.axis2d.Default
		},
		labelTooltip: function(elem, chart, label, truncatedLabel, font, elemType){
			var modules = ["dijit/Tooltip"];
			var aroundRect = {type: "rect"}, position = ["above", "below"],
				fontWidth = g._base._getTextBox(truncatedLabel, {font: font}).w || 0,
				fontHeight = font ? g.normalizedLength(g.splitFontString(font).size) : 0;
			if(elemType == "html"){
				lang.mixin(aroundRect, html.coords(elem.firstChild, true));
				aroundRect.width = Math.ceil(fontWidth);
				aroundRect.height = Math.ceil(fontHeight);
				this._events.push({
					shape:  dojo,
					handle: connect.connect(elem.firstChild, "onmouseover", this, function(e){
						require(modules, function(Tooltip){
							Tooltip.show(label, aroundRect, position);
						});
					})
				});
				this._events.push({
					shape:  dojo,
					handle: connect.connect(elem.firstChild, "onmouseout", this, function(e){
						require(modules, function(Tooltip){
							Tooltip.hide(aroundRect);
						});
					})
				});
			}else{
				var shp = elem.getShape(),
					lt = html.coords(chart.node, true);
				aroundRect = lang.mixin(aroundRect, {
					x: shp.x - fontWidth / 2,
					y: shp.y
				});
				aroundRect.x += lt.x;
				aroundRect.y += lt.y;
				aroundRect.x = Math.round(aroundRect.x);
				aroundRect.y = Math.round(aroundRect.y);
				aroundRect.width = Math.ceil(fontWidth);
				aroundRect.height = Math.ceil(fontHeight);
				this._events.push({
					shape:  elem,
					handle: elem.connect("onmouseenter", this, function(e){
						require(modules, function(Tooltip){
							Tooltip.show(label, aroundRect, position);
						});
					})
				});
				this._events.push({
					shape:  elem,
					handle: elem.connect("onmouseleave", this, function(e){
						require(modules, function(Tooltip){
							Tooltip.hide(aroundRect);
						});
					})
				});
			}
		}
	});
});

},
'dojox/charting/plot2d/Scatter':function(){
define("dojox/charting/plot2d/Scatter", ["dojo/_base/lang", "dojo/_base/array", "dojo/_base/declare", "./Base", "./common", 
	"dojox/lang/functional", "dojox/lang/functional/reversed", "dojox/lang/utils", "dojox/gfx/fx", "dojox/gfx/gradutils"],
	function(lang, arr, declare, Base, dc, df, dfr, du, fx, gradutils){
/*=====
var Base = dojox.charting.plot2d.Base;
=====*/
	var purgeGroup = dfr.lambda("item.purgeGroup()");

	return declare("dojox.charting.plot2d.Scatter", Base, {
		//	summary:
		//		A plot object representing a typical scatter chart.
		defaultParams: {
			hAxis: "x",		// use a horizontal axis named "x"
			vAxis: "y",		// use a vertical axis named "y"
			shadows: null,	// draw shadows
			animate: null	// animate chart to place
		},
		optionalParams: {
			// theme component
			markerStroke:		{},
			markerOutline:		{},
			markerShadow:		{},
			markerFill:			{},
			markerFont:			"",
			markerFontColor:	""
		},

		constructor: function(chart, kwArgs){
			//	summary:
			//		Create the scatter plot.
			//	chart: dojox.charting.Chart
			//		The chart this plot belongs to.
			//	kwArgs: dojox.charting.plot2d.__DefaultCtorArgs?
			//		An optional keyword arguments object to help define this plot's parameters.
			this.opt = lang.clone(this.defaultParams);
            du.updateWithObject(this.opt, kwArgs);
            du.updateWithPattern(this.opt, kwArgs, this.optionalParams);
			this.series = [];
			this.hAxis = this.opt.hAxis;
			this.vAxis = this.opt.vAxis;
			this.animate = this.opt.animate;
		},

		render: function(dim, offsets){
			//	summary:
			//		Run the calculations for any axes for this plot.
			//	dim: Object
			//		An object in the form of { width, height }
			//	offsets: Object
			//		An object of the form { l, r, t, b}.
			//	returns: dojox.charting.plot2d.Scatter
			//		A reference to this plot for functional chaining.
			if(this.zoom && !this.isDataDirty()){
				return this.performZoom(dim, offsets);
			}
			this.resetEvents();
			this.dirty = this.isDirty();
			if(this.dirty){
				arr.forEach(this.series, purgeGroup);
				this._eventSeries = {};
				this.cleanGroup();
				var s = this.group;
				df.forEachRev(this.series, function(item){ item.cleanGroup(s); });
			}
			var t = this.chart.theme, events = this.events();
			for(var i = this.series.length - 1; i >= 0; --i){
				var run = this.series[i];
				if(!this.dirty && !run.dirty){
					t.skip();
					this._reconnectEvents(run.name);
					continue;
				}
				run.cleanGroup();
				if(!run.data.length){
					run.dirty = false;
					t.skip();
					continue;
				}

				var theme = t.next("marker", [this.opt, run]), s = run.group, lpoly,
					ht = this._hScaler.scaler.getTransformerFromModel(this._hScaler),
					vt = this._vScaler.scaler.getTransformerFromModel(this._vScaler);
				if(typeof run.data[0] == "number"){
					lpoly = arr.map(run.data, function(v, i){
						return {
							x: ht(i + 1) + offsets.l,
							y: dim.height - offsets.b - vt(v)
						};
					}, this);
				}else{
					lpoly = arr.map(run.data, function(v, i){
						return {
							x: ht(v.x) + offsets.l,
							y: dim.height - offsets.b - vt(v.y)
						};
					}, this);
				}

				var shadowMarkers  = new Array(lpoly.length),
					frontMarkers   = new Array(lpoly.length),
					outlineMarkers = new Array(lpoly.length);

				arr.forEach(lpoly, function(c, i){
					var finalTheme = typeof run.data[i] == "number" ?
							t.post(theme, "marker") :
							t.addMixin(theme, "marker", run.data[i], true),
						path = "M" + c.x + " " + c.y + " " + finalTheme.symbol;
					if(finalTheme.marker.shadow){
						shadowMarkers[i] = s.createPath("M" + (c.x + finalTheme.marker.shadow.dx) + " " +
							(c.y + finalTheme.marker.shadow.dy) + " " + finalTheme.symbol).
							setStroke(finalTheme.marker.shadow).setFill(finalTheme.marker.shadow.color);
						if(this.animate){
							this._animateScatter(shadowMarkers[i], dim.height - offsets.b);
						}
					}
					if(finalTheme.marker.outline){
						var outline = dc.makeStroke(finalTheme.marker.outline);
						outline.width = 2 * outline.width + finalTheme.marker.stroke.width;
						outlineMarkers[i] = s.createPath(path).setStroke(outline);
						if(this.animate){
							this._animateScatter(outlineMarkers[i], dim.height - offsets.b);
						}
					}
					var stroke = dc.makeStroke(finalTheme.marker.stroke),
						fill = this._plotFill(finalTheme.marker.fill, dim, offsets);
					if(fill && (fill.type === "linear" || fill.type == "radial")){
						var color = gradutils.getColor(fill, {x: c.x, y: c.y});
						if(stroke){
							stroke.color = color;
						}
						frontMarkers[i] = s.createPath(path).setStroke(stroke).setFill(color);
					}else{
						frontMarkers[i] = s.createPath(path).setStroke(stroke).setFill(fill);
					}
					if(this.animate){
						this._animateScatter(frontMarkers[i], dim.height - offsets.b);
					}
				}, this);
				if(frontMarkers.length){
					run.dyn.stroke = frontMarkers[frontMarkers.length - 1].getStroke();
					run.dyn.fill   = frontMarkers[frontMarkers.length - 1].getFill();
				}

				if(events){
					var eventSeries = new Array(frontMarkers.length);
					arr.forEach(frontMarkers, function(s, i){
						var o = {
							element: "marker",
							index:   i,
							run:     run,
							shape:   s,
							outline: outlineMarkers && outlineMarkers[i] || null,
							shadow:  shadowMarkers && shadowMarkers[i] || null,
							cx:      lpoly[i].x,
							cy:      lpoly[i].y
						};
						if(typeof run.data[0] == "number"){
							o.x = i + 1;
							o.y = run.data[i];
						}else{
							o.x = run.data[i].x;
							o.y = run.data[i].y;
						}
						this._connectEvents(o);
						eventSeries[i] = o;
					}, this);
					this._eventSeries[run.name] = eventSeries;
				}else{
					delete this._eventSeries[run.name];
				}
				run.dirty = false;
			}
			this.dirty = false;
			return this;	//	dojox.charting.plot2d.Scatter
		},
		_animateScatter: function(shape, offset){
			fx.animateTransform(lang.delegate({
				shape: shape,
				duration: 1200,
				transform: [
					{name: "translate", start: [0, offset], end: [0, 0]},
					{name: "scale", start: [0, 0], end: [1, 1]},
					{name: "original"}
				]
			}, this.animate)).play();
		}
	});
});

},
'dojox/data/CsvStore':function(){
define("dojox/data/CsvStore", ["dojo/_base/lang", "dojo/_base/declare", "dojo/_base/xhr", "dojo/_base/window","dojo/data/util/filter", "dojo/data/util/simpleFetch"], 
  function(lang, declare, xhr, winUtil, filterUtil, simpleFetch) {

var CsvStore = declare("dojox.data.CsvStore", null, {
	// summary:
	//		The CsvStore implements the dojo.data.api.Read API and reads
	//		data from files in CSV (Comma Separated Values) format.
	//		All values are simple string values. References to other items
	//		are not supported as attribute values in this datastore.
	//
	//		Example data file:
	//		name, color, age, tagline
	//		Kermit, green, 12, "Hi, I'm Kermit the Frog."
	//		Fozzie Bear, orange, 10, "Wakka Wakka Wakka!"
	//		Miss Piggy, pink, 11, "Kermie!"
	//
	//		Note that values containing a comma must be enclosed with quotes ("")
	//		Also note that values containing quotes must be escaped with two consecutive quotes (""quoted"")
	//
	// examples:
	//		var csvStore = new dojox.data.CsvStore({url:"movies.csv");
	//		var csvStore = new dojox.data.CsvStore({url:"http://example.com/movies.csv");

	constructor: function(/* Object */ keywordParameters){
		// summary:
		//		initializer
		// keywordParameters: {url: String}
		// keywordParameters: {data: String}
		// keywordParameters: {label: String} The column label for the column to use for the label returned by getLabel.
		// keywordParameters: {identifier: String} The column label for the column to use for the identity.  Optional.  If not set, the identity is the row number.
		
		this._attributes = [];			// e.g. ["Title", "Year", "Producer"]
		this._attributeIndexes = {};	// e.g. {Title: 0, Year: 1, Producer: 2}
 		this._dataArray = [];			// e.g. [[<Item0>],[<Item1>],[<Item2>]]
 		this._arrayOfAllItems = [];		// e.g. [{_csvId:0,_csvStore:store},...]
		this._loadFinished = false;
		if(keywordParameters.url){
			this.url = keywordParameters.url;
		}
		this._csvData = keywordParameters.data;
		if(keywordParameters.label){
			this.label = keywordParameters.label;
		}else if(this.label === ""){
			this.label = undefined;
		}
		this._storeProp = "_csvStore";	// Property name for the store reference on every item.
		this._idProp = "_csvId"; 		// Property name for the Item Id on every item.
		this._features = {
			'dojo.data.api.Read': true,
			'dojo.data.api.Identity': true
		};
		this._loadInProgress = false;	//Got to track the initial load to prevent duelling loads of the dataset.
		this._queuedFetches = [];
		this.identifier = keywordParameters.identifier;
		if(this.identifier === ""){
			delete this.identifier;
		}else{
			this._idMap = {};
		}
		if("separator" in keywordParameters){
			this.separator = keywordParameters.separator;
		}
		if("urlPreventCache" in keywordParameters){
			this.urlPreventCache = keywordParameters.urlPreventCache?true:false;
		}
	},

	// url: [public] string
	//		Declarative hook for setting Csv source url.
	url: "",

	// label: [public] string
	//		Declarative hook for setting the label attribute.
	label: "",

	// identifier: [public] string
	//		Declarative hook for setting the identifier.
	identifier: "",

	// separator: [public] string
	//		Declatative and programmatic hook for defining the separator
	//		character used in the Csv style file.
	separator: ",",

	// separator: [public] string
	//		Parameter to allow specifying if preventCache should be passed to
	//		the xhrGet call or not when loading data from a url.
	//		Note this does not mean the store calls the server on each fetch,
	//		only that the data load has preventCache set as an option.
	urlPreventCache: false,

	_assertIsItem: function(/* item */ item){
		// summary:
		//      This function tests whether the item passed in is indeed an item in the store.
		// item:
		//		The item to test for being contained by the store.
		if(!this.isItem(item)){
			throw new Error(this.declaredClass + ": a function was passed an item argument that was not an item");
		}
	},
	
	_getIndex: function(item){
		// summary:
		//		Internal function to get the internal index to the item data from the item handle
		// item:
		//		The idem handle to get the index for.
		var idx = this.getIdentity(item);
		if(this.identifier){
			idx = this._idMap[idx];
		}
		return idx;
	},

/***************************************
     dojo.data.api.Read API
***************************************/
	getValue: function(	/* item */ item,
						/* attribute || attribute-name-string */ attribute,
						/* value? */ defaultValue){
		// summary:
		//      See dojo.data.api.Read.getValue()
		//		Note that for the CsvStore, an empty string value is the same as no value,
		// 		so the defaultValue would be returned instead of an empty string.
		this._assertIsItem(item);
		var itemValue = defaultValue;
		if(typeof attribute === "string"){
			var ai = this._attributeIndexes[attribute];
			if(ai != null){
				var itemData = this._dataArray[this._getIndex(item)];
				itemValue = itemData[ai] || defaultValue;
			}
		}else{
			throw new Error(this.declaredClass + ": a function was passed an attribute argument that was not a string");
		}
		return itemValue; //String
	},

	getValues: function(/* item */ item,
						/* attribute || attribute-name-string */ attribute){
		// summary:
		//		See dojo.data.api.Read.getValues()
		// 		CSV syntax does not support multi-valued attributes, so this is just a
		// 		wrapper function for getValue().
		var value = this.getValue(item, attribute);
		return (value ? [value] : []); //Array
	},

	getAttributes: function(/* item */ item){
		// summary:
		//		See dojo.data.api.Read.getAttributes()
		this._assertIsItem(item);
		var attributes = [];
		var itemData = this._dataArray[this._getIndex(item)];
		for(var i=0; i<itemData.length; i++){
			// Check for empty string values. CsvStore treats empty strings as no value.
			if(itemData[i] !== ""){
				attributes.push(this._attributes[i]);
			}
		}
		return attributes; //Array
	},

	hasAttribute: function(	/* item */ item,
							/* attribute-name-string */ attribute){
		// summary:
		//		See dojo.data.api.Read.hasAttribute()
		// 		The hasAttribute test is true if attribute has an index number within the item's array length
		// 		AND if the item has a value for that attribute. Note that for the CsvStore, an
		// 		empty string value is the same as no value.
		this._assertIsItem(item);
		if(typeof attribute === "string"){
			var attributeIndex = this._attributeIndexes[attribute];
			var itemData = this._dataArray[this._getIndex(item)];
			return (typeof attributeIndex !== "undefined" && attributeIndex < itemData.length && itemData[attributeIndex] !== ""); //Boolean
		}else{
			throw new Error(this.declaredClass + ": a function was passed an attribute argument that was not a string");
		}
	},

	containsValue: function(/* item */ item,
							/* attribute || attribute-name-string */ attribute,
							/* anything */ value){
		// summary:
		//		See dojo.data.api.Read.containsValue()
		var regexp = undefined;
		if(typeof value === "string"){
			regexp = filterUtil.patternToRegExp(value, false);
		}
		return this._containsValue(item, attribute, value, regexp); //boolean.
	},

	_containsValue: function(	/* item */ item,
								/* attribute || attribute-name-string */ attribute,
								/* anything */ value,
								/* RegExp?*/ regexp){
		// summary:
		//		Internal function for looking at the values contained by the item.
		// description:
		//		Internal function for looking at the values contained by the item.  This
		//		function allows for denoting if the comparison should be case sensitive for
		//		strings or not (for handling filtering cases where string case should not matter)
		//
		// item:
		//		The data item to examine for attribute values.
		// attribute:
		//		The attribute to inspect.
		// value:
		//		The value to match.
		// regexp:
		//		Optional regular expression generated off value if value was of string type to handle wildcarding.
		//		If present and attribute values are string, then it can be used for comparison instead of 'value'
		// tags:
		//		private
		var values = this.getValues(item, attribute);
		for(var i = 0; i < values.length; ++i){
			var possibleValue = values[i];
			if(typeof possibleValue === "string" && regexp){
				return (possibleValue.match(regexp) !== null);
			}else{
				//Non-string matching.
				if(value === possibleValue){
					return true; // Boolean
				}
			}
		}
		return false; // Boolean
	},

	isItem: function(/* anything */ something){
		// summary:
		//		See dojo.data.api.Read.isItem()
		if(something && something[this._storeProp] === this){
			var identity = something[this._idProp];
			//If an identifier was specified, we have to look it up via that and the mapping,
			//otherwise, just use row number.
			if(this.identifier){
				var data = this._dataArray[this._idMap[identity]];
				if(data){
					return true;
				}
			}else{
				if(identity >= 0 && identity < this._dataArray.length){
					return true; //Boolean
				}
			}
		}
		return false; //Boolean
	},

	isItemLoaded: function(/* anything */ something){
		// summary:
		//		See dojo.data.api.Read.isItemLoaded()
		//		The CsvStore always loads all items, so if it's an item, then it's loaded.
		return this.isItem(something); //Boolean
	},

	loadItem: function(/* item */ item){
		// summary:
		//		See dojo.data.api.Read.loadItem()
		// description:
		//		The CsvStore always loads all items, so if it's an item, then it's loaded.
		//		From the dojo.data.api.Read.loadItem docs:
		//			If a call to isItemLoaded() returns true before loadItem() is even called,
		//			then loadItem() need not do any work at all and will not even invoke
		//			the callback handlers.
	},

	getFeatures: function(){
		// summary:
		//		See dojo.data.api.Read.getFeatures()
		return this._features; //Object
	},

	getLabel: function(/* item */ item){
		// summary:
		//		See dojo.data.api.Read.getLabel()
		if(this.label && this.isItem(item)){
			return this.getValue(item,this.label); //String
		}
		return undefined; //undefined
	},

	getLabelAttributes: function(/* item */ item){
		// summary:
		//		See dojo.data.api.Read.getLabelAttributes()
		if(this.label){
			return [this.label]; //array
		}
		return null; //null
	},


	// The dojo.data.api.Read.fetch() function is implemented as
	// a mixin from dojo.data.util.simpleFetch.
	// That mixin requires us to define _fetchItems().
	_fetchItems: function(	/* Object */ keywordArgs,
							/* Function */ findCallback,
							/* Function */ errorCallback){
		// summary:
		//		See dojo.data.util.simpleFetch.fetch()
		// tags:
		//		protected
		var self = this;
		var filter = function(requestArgs, arrayOfAllItems){
			var items = null;
			if(requestArgs.query){
				var key, value;
				items = [];
				var ignoreCase = requestArgs.queryOptions ? requestArgs.queryOptions.ignoreCase : false;

				//See if there are any string values that can be regexp parsed first to avoid multiple regexp gens on the
				//same value for each item examined.  Much more efficient.
				var regexpList = {};
				for(key in requestArgs.query){
					value = requestArgs.query[key];
					if(typeof value === "string"){
						regexpList[key] = filterUtil.patternToRegExp(value, ignoreCase);
					}
				}

				for(var i = 0; i < arrayOfAllItems.length; ++i){
					var match = true;
					var candidateItem = arrayOfAllItems[i];
					for(key in requestArgs.query){
						value = requestArgs.query[key];
						if(!self._containsValue(candidateItem, key, value, regexpList[key])){
							match = false;
						}
					}
					if(match){
						items.push(candidateItem);
					}
				}
			}else{
				// We want a copy to pass back in case the parent wishes to sort the array.  We shouldn't allow resort
				// of the internal list so that multiple callers can get lists and sort without affecting each other.
				items = arrayOfAllItems.slice(0,arrayOfAllItems.length);
				
			}
			findCallback(items, requestArgs);
		};

		if(this._loadFinished){
			filter(keywordArgs, this._arrayOfAllItems);
		}else{
			if(this.url !== ""){
				//If fetches come in before the loading has finished, but while
				//a load is in progress, we have to defer the fetching to be
				//invoked in the callback.
				if(this._loadInProgress){
					this._queuedFetches.push({args: keywordArgs, filter: filter});
				}else{
					this._loadInProgress = true;
					var getArgs = {
							url: self.url,
							handleAs: "text",
							preventCache: self.urlPreventCache
						};
					var getHandler = xhr.get(getArgs);
					getHandler.addCallback(function(data){
						try{
							self._processData(data);
							filter(keywordArgs, self._arrayOfAllItems);
							self._handleQueuedFetches();
						}catch(e){
							errorCallback(e, keywordArgs);
						}
					});
					getHandler.addErrback(function(error){
						self._loadInProgress = false;
						if(errorCallback){
							errorCallback(error, keywordArgs);
						}else{
							throw error;
						}
					});
					//Wire up the cancel to abort of the request
					//This call cancel on the deferred if it hasn't been called
					//yet and then will chain to the simple abort of the
					//simpleFetch keywordArgs
					var oldAbort = null;
					if(keywordArgs.abort){
						oldAbort = keywordArgs.abort;
					}
					keywordArgs.abort = function(){
						var df = getHandler;
						if(df && df.fired === -1){
							df.cancel();
							df = null;
						}
						if(oldAbort){
							oldAbort.call(keywordArgs);
						}
					};
				}
			}else if(this._csvData){
				try{
					this._processData(this._csvData);
					this._csvData = null;
					filter(keywordArgs, this._arrayOfAllItems);
				}catch(e){
					errorCallback(e, keywordArgs);
				}
			}else{
				var error = new Error(this.declaredClass + ": No CSV source data was provided as either URL or String data input.");
				if(errorCallback){
					errorCallback(error, keywordArgs);
				}else{
					throw error;
				}
			}
		}
	},
	
	close: function(/*dojo.data.api.Request || keywordArgs || null */ request){
		 //	summary:
		 //		See dojo.data.api.Read.close()
	},
	
	
	// -------------------------------------------------------------------
	// Private methods
	_getArrayOfArraysFromCsvFileContents: function(/* string */ csvFileContents){
		// summary:
		//		Parses a string of CSV records into a nested array structure.
		// description:
		//		Given a string containing CSV records, this method parses
		//		the string and returns a data structure containing the parsed
		//		content.  The data structure we return is an array of length
		//		R, where R is the number of rows (lines) in the CSV data.  The
		//		return array contains one sub-array for each CSV line, and each
		//		sub-array contains C string values, where C is the number of
		//		columns in the CSV data.
		// example:
		//		For example, given this CSV string as input:
		//			"Title, Year, Producer \n Alien, 1979, Ridley Scott \n Blade Runner, 1982, Ridley Scott"
		//		this._dataArray will be set to:
		//			[["Alien", "1979", "Ridley Scott"],
		//			["Blade Runner", "1982", "Ridley Scott"]]
		//		And this._attributes will be set to:
		//			["Title", "Year", "Producer"]
		//		And this._attributeIndexes will be set to:
		//			{ "Title":0, "Year":1, "Producer":2 }
		// tags:
		//		private
		if(lang.isString(csvFileContents)){
			var leadingWhiteSpaceCharacters = new RegExp("^\\s+",'g');
			var trailingWhiteSpaceCharacters = new RegExp("\\s+$",'g');
			var doubleQuotes = new RegExp('""','g');
			var arrayOfOutputRecords = [];
			var i;
			
			var arrayOfInputLines = this._splitLines(csvFileContents);
			for(i = 0; i < arrayOfInputLines.length; ++i){
				var singleLine = arrayOfInputLines[i];
				if(singleLine.length > 0){
					var listOfFields = singleLine.split(this.separator);
					var j = 0;
					while(j < listOfFields.length){
						var space_field_space = listOfFields[j];
						var field_space = space_field_space.replace(leadingWhiteSpaceCharacters, ''); // trim leading whitespace
						var field = field_space.replace(trailingWhiteSpaceCharacters, ''); // trim trailing whitespace
						var firstChar = field.charAt(0);
						var lastChar = field.charAt(field.length - 1);
						var secondToLastChar = field.charAt(field.length - 2);
						var thirdToLastChar = field.charAt(field.length - 3);
						if(field.length === 2 && field == "\"\""){
							listOfFields[j] = ""; //Special case empty string field.
						}else if((firstChar == '"') &&
								((lastChar != '"') ||
								 ((lastChar == '"') && (secondToLastChar == '"') && (thirdToLastChar != '"')))){
							if(j+1 === listOfFields.length){
								// alert("The last field in record " + i + " is corrupted:\n" + field);
								return; //null
							}
							var nextField = listOfFields[j+1];
							listOfFields[j] = field_space + this.separator + nextField;
							listOfFields.splice(j+1, 1); // delete element [j+1] from the list
						}else{
							if((firstChar == '"') && (lastChar == '"')){
								field = field.slice(1, (field.length - 1)); // trim the " characters off the ends
								field = field.replace(doubleQuotes, '"'); // replace "" with "
							}
							listOfFields[j] = field;
							j += 1;
						}
					}
					arrayOfOutputRecords.push(listOfFields);
				}
			}
			
			// The first item of the array must be the header row with attribute names.
			this._attributes = arrayOfOutputRecords.shift();
			for(i = 0; i<this._attributes.length; i++){
				// Store the index of each attribute
				this._attributeIndexes[this._attributes[i]] = i;
			}
			this._dataArray = arrayOfOutputRecords; //Array
		}
	},

	_splitLines: function(csvContent){
		// summary:
		//		Function to split the CSV file contents into separate lines.
		//		Since line breaks can occur inside quotes, a Regexp didn't
		//		work as well.  A quick passover parse should be just as efficient.
		// tags:
		//		private
		var split = [];
		var i;
		var line = "";
		var inQuotes = false;
		for(i = 0; i < csvContent.length; i++){
			var c = csvContent.charAt(i);
			switch(c){
				case '\"':
					inQuotes = !inQuotes;
					line += c;
					break;
				case '\r':
					if(inQuotes){
						line += c;
					}else{
						split.push(line);
						line = "";
						if(i < (csvContent.length - 1) && csvContent.charAt(i + 1) == '\n'){
							i++; //Skip it, it's CRLF
						}
					}
					break;
				case '\n':
					if(inQuotes){
						line += c;
					}else{
						split.push(line);
						line = "";
					}
					break;
				default:
					line +=c;
			}
		}
		if(line !== ""){
			split.push(line);
		}
		return split;
	},
	
	_processData: function(/* String */ data){
		// summary:
		//		Function for processing the string data from the server.
		// data: String
		//		The CSV data.
		// tags:
		//		private
		this._getArrayOfArraysFromCsvFileContents(data);
		this._arrayOfAllItems = [];

		//Check that the specified Identifier is actually a column title, if provided.
		if(this.identifier){
			if(this._attributeIndexes[this.identifier] === undefined){
				throw new Error(this.declaredClass + ": Identity specified is not a column header in the data set.");
			}
		}

		for(var i=0; i<this._dataArray.length; i++){
			var id = i;
			//Associate the identifier to a row in this case
			//for o(1) lookup.
			if(this.identifier){
				var iData = this._dataArray[i];
				id = iData[this._attributeIndexes[this.identifier]];
				this._idMap[id] = i;
			}
			this._arrayOfAllItems.push(this._createItemFromIdentity(id));
		}
		this._loadFinished = true;
		this._loadInProgress = false;
	},
	
	_createItemFromIdentity: function(/* String */ identity){
		// summary:
		//		Function for creating a new item from its identifier.
		// identity: String
		//		The identity
		// tags:
		//		private
		var item = {};
		item[this._storeProp] = this;
		item[this._idProp] = identity;
		return item; //Object
	},
	
	
/***************************************
     dojo.data.api.Identity API
***************************************/
	getIdentity: function(/* item */ item){
		// summary:
		//		See dojo.data.api.Identity.getIdentity()
		// tags:
		//		public
		if(this.isItem(item)){
			return item[this._idProp]; //String
		}
		return null; //null
	},

	fetchItemByIdentity: function(/* Object */ keywordArgs){
		// summary:
		//		See dojo.data.api.Identity.fetchItemByIdentity()
		// tags:
		//		public
		var item;
		var scope = keywordArgs.scope?keywordArgs.scope:winUtil.global;
		//Hasn't loaded yet, we have to trigger the load.
		if(!this._loadFinished){
			var self = this;
			if(this.url !== ""){
				//If fetches come in before the loading has finished, but while
				//a load is in progress, we have to defer the fetching to be
				//invoked in the callback.
				if(this._loadInProgress){
					this._queuedFetches.push({args: keywordArgs});
				}else{
					this._loadInProgress = true;
					var getArgs = {
							url: self.url,
							handleAs: "text"
						};
					var getHandler = xhr.get(getArgs);
					getHandler.addCallback(function(data){
						try{
							self._processData(data);
							var item = self._createItemFromIdentity(keywordArgs.identity);
							if(!self.isItem(item)){
								item = null;
							}
							if(keywordArgs.onItem){
								keywordArgs.onItem.call(scope, item);
							}
							self._handleQueuedFetches();
						}catch(error){
							if(keywordArgs.onError){
								keywordArgs.onError.call(scope, error);
							}
						}
					});
					getHandler.addErrback(function(error){
						this._loadInProgress = false;
						if(keywordArgs.onError){
							keywordArgs.onError.call(scope, error);
						}
					});
				}
			}else if(this._csvData){
				try{
					self._processData(self._csvData);
					self._csvData = null;
					item = self._createItemFromIdentity(keywordArgs.identity);
					if(!self.isItem(item)){
						item = null;
					}
					if(keywordArgs.onItem){
						keywordArgs.onItem.call(scope, item);
					}
				}catch(e){
					if(keywordArgs.onError){
						keywordArgs.onError.call(scope, e);
					}
				}
			}
		}else{
			//Already loaded.  We can just look it up and call back.
			item = this._createItemFromIdentity(keywordArgs.identity);
			if(!this.isItem(item)){
				item = null;
			}
			if(keywordArgs.onItem){
				keywordArgs.onItem.call(scope, item);
			}
		}
	},

	getIdentityAttributes: function(/* item */ item){
		// summary:
		//		See dojo.data.api.Identity.getIdentifierAttributes()
		// tags:
		//		public
		 
		//Identity isn't a public attribute in the item, it's the row position index.
		//So, return null.
		if(this.identifier){
			return [this.identifier];
		}else{
			return null;
		}
	},

	_handleQueuedFetches: function(){
		// summary:
		//		Internal function to execute delayed request in the store.
		// tags:
		//		private

		//Execute any deferred fetches now.
		if(this._queuedFetches.length > 0){
			for(var i = 0; i < this._queuedFetches.length; i++){
				var fData = this._queuedFetches[i];
				var delayedFilter = fData.filter;
				var delayedQuery = fData.args;
				if(delayedFilter){
					delayedFilter(delayedQuery, this._arrayOfAllItems);
				}else{
					this.fetchItemByIdentity(fData.args);
				}
			}
			this._queuedFetches = [];
		}
	}
});
//Mix in the simple fetch implementation to this class.
lang.extend(CsvStore, simpleFetch);

return CsvStore;
});

},
'dojox/charting/plot2d/ClusteredColumns':function(){
define("dojox/charting/plot2d/ClusteredColumns", ["dojo/_base/array", "dojo/_base/declare", "./Columns", "./common", 
		"dojox/lang/functional", "dojox/lang/functional/reversed", "dojox/lang/utils"], 
	function(arr, declare, Columns, dc, df, dfr, du){
/*=====
var Columns = dojox.charting.plot2d.Columns;
=====*/

	var purgeGroup = dfr.lambda("item.purgeGroup()");

	return declare("dojox.charting.plot2d.ClusteredColumns", Columns, {
		//	summary:
		//		A plot representing grouped or clustered columns (vertical bars).
		render: function(dim, offsets){
			//	summary:
			//		Run the calculations for any axes for this plot.
			//	dim: Object
			//		An object in the form of { width, height }
			//	offsets: Object
			//		An object of the form { l, r, t, b}.
			//	returns: dojox.charting.plot2d.ClusteredColumns
			//		A reference to this plot for functional chaining.
			if(this.zoom && !this.isDataDirty()){
				return this.performZoom(dim, offsets);
			}
			this.resetEvents();
			this.dirty = this.isDirty();
			if(this.dirty){
				arr.forEach(this.series, purgeGroup);
				this._eventSeries = {};
				this.cleanGroup();
				var s = this.group;
				df.forEachRev(this.series, function(item){ item.cleanGroup(s); });
			}
			var t = this.chart.theme, f, gap, width, thickness,
				ht = this._hScaler.scaler.getTransformerFromModel(this._hScaler),
				vt = this._vScaler.scaler.getTransformerFromModel(this._vScaler),
				baseline = Math.max(0, this._vScaler.bounds.lower),
				baselineHeight = vt(baseline),
				events = this.events();
			f = dc.calculateBarSize(this._hScaler.bounds.scale, this.opt, this.series.length);
			gap = f.gap;
			width = thickness = f.size;
			for(var i = 0; i < this.series.length; ++i){
				var run = this.series[i], shift = thickness * i;
				if(!this.dirty && !run.dirty){
					t.skip();
					this._reconnectEvents(run.name);
					continue;
				}
				run.cleanGroup();
				var theme = t.next("column", [this.opt, run]), s = run.group,
					eventSeries = new Array(run.data.length);
				for(var j = 0; j < run.data.length; ++j){
					var value = run.data[j];
					if(value !== null){
						var v = typeof value == "number" ? value : value.y,
							vv = vt(v),
							height = vv - baselineHeight,
							h = Math.abs(height),
							finalTheme = typeof value != "number" ?
								t.addMixin(theme, "column", value, true) :
								t.post(theme, "column");
						if(width >= 1 && h >= 0){
							var rect = {
								x: offsets.l + ht(j + 0.5) + gap + shift,
								y: dim.height - offsets.b - (v > baseline ? vv : baselineHeight),
								width: width, height: h
							};
							var specialFill = this._plotFill(finalTheme.series.fill, dim, offsets);
							specialFill = this._shapeFill(specialFill, rect);
							var shape = s.createRect(rect).setFill(specialFill).setStroke(finalTheme.series.stroke);
							run.dyn.fill   = shape.getFill();
							run.dyn.stroke = shape.getStroke();
							if(events){
								var o = {
									element: "column",
									index:   j,
									run:     run,
									shape:   shape,
									x:       j + 0.5,
									y:       v
								};
								this._connectEvents(o);
								eventSeries[j] = o;
							}
							if(this.animate){
								this._animateColumn(shape, dim.height - offsets.b - baselineHeight, h);
							}
						}
					}
				}
				this._eventSeries[run.name] = eventSeries;
				run.dirty = false;
			}
			this.dirty = false;
			return this;	//	dojox.charting.plot2d.ClusteredColumns
		}
	});
});

},
'dojo/DeferredList':function(){
define(["./_base/kernel", "./_base/Deferred", "./_base/array"], function(dojo, Deferred, darray) {
	// module:
	//		dojo/DeferredList
	// summary:
	//		TODOC


dojo.DeferredList = function(/*Array*/ list, /*Boolean?*/ fireOnOneCallback, /*Boolean?*/ fireOnOneErrback, /*Boolean?*/ consumeErrors, /*Function?*/ canceller){
	// summary:
	//		Provides event handling for a group of Deferred objects.
	// description:
	//		DeferredList takes an array of existing deferreds and returns a new deferred of its own
	//		this new deferred will typically have its callback fired when all of the deferreds in
	//		the given list have fired their own deferreds.  The parameters `fireOnOneCallback` and
	//		fireOnOneErrback, will fire before all the deferreds as appropriate
	//
	// list:
	//		The list of deferreds to be synchronizied with this DeferredList
	// fireOnOneCallback:
	//		Will cause the DeferredLists callback to be fired as soon as any
	//		of the deferreds in its list have been fired instead of waiting until
	//		the entire list has finished
	// fireonOneErrback:
	//		Will cause the errback to fire upon any of the deferreds errback
	// canceller:
	//		A deferred canceller function, see dojo.Deferred
	var resultList = [];
	Deferred.call(this);
	var self = this;
	if(list.length === 0 && !fireOnOneCallback){
		this.resolve([0, []]);
	}
	var finished = 0;
	darray.forEach(list, function(item, i){
		item.then(function(result){
			if(fireOnOneCallback){
				self.resolve([i, result]);
			}else{
				addResult(true, result);
			}
		},function(error){
			if(fireOnOneErrback){
				self.reject(error);
			}else{
				addResult(false, error);
			}
			if(consumeErrors){
				return null;
			}
			throw error;
		});
		function addResult(succeeded, result){
			resultList[i] = [succeeded, result];
			finished++;
			if(finished === list.length){
				self.resolve(resultList);
			}

		}
	});
};
dojo.DeferredList.prototype = new Deferred();

dojo.DeferredList.prototype.gatherResults = function(deferredList){
	// summary:
	//		Gathers the results of the deferreds for packaging
	//		as the parameters to the Deferred Lists' callback
	// deferredList: dojo.DeferredList
	//		The deferred list from which this function gathers results.
	// returns: dojo.DeferredList
	//		The newly created deferred list which packs results as
	//		parameters to its callback.

	var d = new dojo.DeferredList(deferredList, false, true, false);
	d.addCallback(function(results){
		var ret = [];
		darray.forEach(results, function(result){
			ret.push(result[1]);
		});
		return ret;
	});
	return d;
};

return dojo.DeferredList;
});

},
'dojo/io/iframe':function(){
define(["../main", "require"], function(dojo, require) {
	// module:
	//		dojo/io/iframe
	// summary:
	//		TODOC

dojo.getObject("io", true, dojo);

/*=====
dojo.declare("dojo.io.iframe.__ioArgs", dojo.__IoArgs, {
	constructor: function(){
		//	summary:
		//		All the properties described in the dojo.__ioArgs type, apply
		//		to this type. The following additional properties are allowed
		//		for dojo.io.iframe.send():
		//	method: String?
		//		The HTTP method to use. "GET" or "POST" are the only supported
		//		values.  It will try to read the value from the form node's
		//		method, then try this argument. If neither one exists, then it
		//		defaults to POST.
		//	handleAs: String?
		//		Specifies what format the result data should be given to the
		//		load/handle callback. Valid values are: text, html, xml, json,
		//		javascript. IMPORTANT: For all values EXCEPT html and xml, The
		//		server response should be an HTML file with a textarea element.
		//		The response data should be inside the textarea element. Using an
		//		HTML document the only reliable, cross-browser way this
		//		transport can know when the response has loaded. For the html
		//		handleAs value, just return a normal HTML document.  NOTE: xml
		//		is now supported with this transport (as of 1.1+); a known issue
		//		is if the XML document in question is malformed, Internet Explorer
		//		will throw an uncatchable error.
		//	content: Object?
		//		If "form" is one of the other args properties, then the content
		//		object properties become hidden form form elements. For
		//		instance, a content object of {name1 : "value1"} is converted
		//		to a hidden form element with a name of "name1" and a value of
		//		"value1". If there is not a "form" property, then the content
		//		object is converted into a name=value&name=value string, by
		//		using dojo.objectToQuery().
		this.method = method;
		this.handleAs = handleAs;
		this.content = content;
	}
});
=====*/

dojo.io.iframe = {
	// summary:
	//		Sends an Ajax I/O call using and Iframe (for instance, to upload files)

	create: function(/*String*/fname, /*String*/onloadstr, /*String?*/uri){
		//	summary:
		//		Creates a hidden iframe in the page. Used mostly for IO
		//		transports.  You do not need to call this to start a
		//		dojo.io.iframe request. Just call send().
		//	fname: String
		//		The name of the iframe. Used for the name attribute on the
		//		iframe.
		//	onloadstr: String
		//		A string of JavaScript that will be executed when the content
		//		in the iframe loads.
		//	uri: String
		//		The value of the src attribute on the iframe element. If a
		//		value is not given, then dojo/resources/blank.html will be
		//		used.
		if(window[fname]){ return window[fname]; }
		if(window.frames[fname]){ return window.frames[fname]; }
		var turi = uri;
		if(!turi){
			if(dojo.config["useXDomain"] && !dojo.config["dojoBlankHtmlUrl"]){
				console.warn("dojo.io.iframe.create: When using cross-domain Dojo builds,"
					+ " please save dojo/resources/blank.html to your domain and set djConfig.dojoBlankHtmlUrl"
					+ " to the path on your domain to blank.html");
			}
			turi = (dojo.config["dojoBlankHtmlUrl"]||require.toUrl("../resources/blank.html"));
		}
		var cframe = dojo.place(
			'<iframe id="'+fname+'" name="'+fname+'" src="'+turi+'" onload="'+onloadstr+
			'" style="position: absolute; left: 1px; top: 1px; height: 1px; width: 1px; visibility: hidden">',
		dojo.body());

		window[fname] = cframe;

		return cframe;
	},

	setSrc: function(/*DOMNode*/iframe, /*String*/src, /*Boolean*/replace){
		//summary:
		//		Sets the URL that is loaded in an IFrame. The replace parameter
		//		indicates whether location.replace() should be used when
		//		changing the location of the iframe.
		try{
			if(!replace){
				if(dojo.isWebKit){
					iframe.location = src;
				}else{
					frames[iframe.name].location = src;
				}
			}else{
				// Fun with DOM 0 incompatibilities!
				var idoc;
				if(dojo.isIE || dojo.isWebKit){
					idoc = iframe.contentWindow.document;
				}else{ //  if(d.isMozilla){
					idoc = iframe.contentWindow;
				}

				//For Safari (at least 2.0.3) and Opera, if the iframe
				//has just been created but it doesn't have content
				//yet, then iframe.document may be null. In that case,
				//use iframe.location and return.
				if(!idoc){
					iframe.location = src;
				}else{
					idoc.location.replace(src);
				}
			}
		}catch(e){
			console.log("dojo.io.iframe.setSrc: ", e);
		}
	},

	doc: function(/*DOMNode*/iframeNode){
		//summary: Returns the document object associated with the iframe DOM Node argument.
		return iframeNode.contentDocument || // W3
			(
				(
					(iframeNode.name) && (iframeNode.document) &&
					(dojo.doc.getElementsByTagName("iframe")[iframeNode.name].contentWindow) &&
					(dojo.doc.getElementsByTagName("iframe")[iframeNode.name].contentWindow.document)
				)
			) ||  // IE
			(
				(iframeNode.name)&&(dojo.doc.frames[iframeNode.name])&&
				(dojo.doc.frames[iframeNode.name].document)
			) || null;
	},

	send: function(/*dojo.io.iframe.__ioArgs*/args){
		//summary:
		//		Function that sends the request to the server.
		//		This transport can only process one send() request at a time, so if send() is called
		//multiple times, it will queue up the calls and only process one at a time.
		if(!this["_frame"]){
			this._frame = this.create(this._iframeName, dojo._scopeName + ".io.iframe._iframeOnload();");
		}

		//Set up the deferred.
		var dfd = dojo._ioSetArgs(
			args,
			function(/*Deferred*/dfd){
				//summary: canceller function for dojo._ioSetArgs call.
				dfd.canceled = true;
				dfd.ioArgs._callNext();
			},
			function(/*Deferred*/dfd){
				//summary: okHandler function for dojo._ioSetArgs call.
				var value = null;
				try{
					var ioArgs = dfd.ioArgs;
					var dii = dojo.io.iframe;
					var ifd = dii.doc(dii._frame);
					var handleAs = ioArgs.handleAs;

					//Assign correct value based on handleAs value.
					value = ifd; //html
					if(handleAs != "html"){
						if(handleAs == "xml"){
							//	FF, Saf 3+ and Opera all seem to be fine with ifd being xml.  We have to
							//	do it manually for IE6-8.  Refs #6334.
							if(dojo.isIE < 9 || (dojo.isIE && dojo.isQuirks)){
								dojo.query("a", dii._frame.contentWindow.document.documentElement).orphan();
								var xmlText=(dii._frame.contentWindow.document).documentElement.innerText;
								xmlText=xmlText.replace(/>\s+</g, "><");
								xmlText=dojo.trim(xmlText);
								//Reusing some code in base dojo for handling XML content.  Simpler and keeps
								//Core from duplicating the effort needed to locate the XML Parser on IE.
								var fauxXhr = { responseText: xmlText };
								value = dojo._contentHandlers["xml"](fauxXhr); // DOMDocument
							}
						}else{
							value = ifd.getElementsByTagName("textarea")[0].value; //text
							if(handleAs == "json"){
								value = dojo.fromJson(value); //json
							}else if(handleAs == "javascript"){
								value = dojo.eval(value); //javascript
							}
						}
					}
				}catch(e){
					value = e;
				}finally{
					ioArgs._callNext();
				}
				return value;
			},
			function(/*Error*/error, /*Deferred*/dfd){
				//summary: errHandler function for dojo._ioSetArgs call.
				dfd.ioArgs._hasError = true;
				dfd.ioArgs._callNext();
				return error;
			}
		);

		//Set up a function that will fire the next iframe request. Make sure it only
		//happens once per deferred.
		dfd.ioArgs._callNext = function(){
			if(!this["_calledNext"]){
				this._calledNext = true;
				dojo.io.iframe._currentDfd = null;
				dojo.io.iframe._fireNextRequest();
			}
		};

		this._dfdQueue.push(dfd);
		this._fireNextRequest();

		//Add it the IO watch queue, to get things like timeout support.
		dojo._ioWatch(
			dfd,
			function(/*Deferred*/dfd){
				//validCheck
				return !dfd.ioArgs["_hasError"];
			},
			function(dfd){
				//ioCheck
				return (!!dfd.ioArgs["_finished"]);
			},
			function(dfd){
				//resHandle
				if(dfd.ioArgs._finished){
					dfd.callback(dfd);
				}else{
					dfd.errback(new Error("Invalid dojo.io.iframe request state"));
				}
			}
		);

		return dfd;
	},

	_currentDfd: null,
	_dfdQueue: [],
	_iframeName: dojo._scopeName + "IoIframe",

	_fireNextRequest: function(){
		//summary: Internal method used to fire the next request in the bind queue.
		try{
			if((this._currentDfd)||(this._dfdQueue.length == 0)){ return; }
			//Find next deferred, skip the canceled ones.
			do{
				var dfd = this._currentDfd = this._dfdQueue.shift();
			} while(dfd && dfd.canceled && this._dfdQueue.length);

			//If no more dfds, cancel.
			if(!dfd || dfd.canceled){
				this._currentDfd =  null;
				return;
			}

			var ioArgs = dfd.ioArgs;
			var args = ioArgs.args;

			ioArgs._contentToClean = [];
			var fn = dojo.byId(args["form"]);
			var content = args["content"] || {};
			if(fn){
				if(content){
					// if we have things in content, we need to add them to the form
					// before submission
					var pHandler = function(name, value) {
						dojo.create("input", {type: "hidden", name: name, value: value}, fn);
						ioArgs._contentToClean.push(name);
					};
					for(var x in content){
						var val = content[x];
						if(dojo.isArray(val) && val.length > 1){
							var i;
							for (i = 0; i < val.length; i++) {
								pHandler(x,val[i]);
							}
						}else{
							if(!fn[x]){
								pHandler(x,val);
							}else{
								fn[x].value = val;
							}
						}
					}
				}
				//IE requires going through getAttributeNode instead of just getAttribute in some form cases,
				//so use it for all.  See #2844
				var actnNode = fn.getAttributeNode("action");
				var mthdNode = fn.getAttributeNode("method");
				var trgtNode = fn.getAttributeNode("target");
				if(args["url"]){
					ioArgs._originalAction = actnNode ? actnNode.value : null;
					if(actnNode){
						actnNode.value = args.url;
					}else{
						fn.setAttribute("action",args.url);
					}
				}
				if(!mthdNode || !mthdNode.value){
					if(mthdNode){
						mthdNode.value= (args["method"]) ? args["method"] : "post";
					}else{
						fn.setAttribute("method", (args["method"]) ? args["method"] : "post");
					}
				}
				ioArgs._originalTarget = trgtNode ? trgtNode.value: null;
				if(trgtNode){
					trgtNode.value = this._iframeName;
				}else{
					fn.setAttribute("target", this._iframeName);
				}
				fn.target = this._iframeName;
				dojo._ioNotifyStart(dfd);
				fn.submit();
			}else{
				// otherwise we post a GET string by changing URL location for the
				// iframe
				var tmpUrl = args.url + (args.url.indexOf("?") > -1 ? "&" : "?") + ioArgs.query;
				dojo._ioNotifyStart(dfd);
				this.setSrc(this._frame, tmpUrl, true);
			}
		}catch(e){
			dfd.errback(e);
		}
	},

	_iframeOnload: function(){
		var dfd = this._currentDfd;
		if(!dfd){
			this._fireNextRequest();
			return;
		}

		var ioArgs = dfd.ioArgs;
		var args = ioArgs.args;
		var fNode = dojo.byId(args.form);

		if(fNode){
			// remove all the hidden content inputs
			var toClean = ioArgs._contentToClean;
			for(var i = 0; i < toClean.length; i++) {
				var key = toClean[i];
				//Need to cycle over all nodes since we may have added
				//an array value which means that more than one node could
				//have the same .name value.
				for(var j = 0; j < fNode.childNodes.length; j++){
					var chNode = fNode.childNodes[j];
					if(chNode.name == key){
						dojo.destroy(chNode);
						break;
					}
				}
			}

			// restore original action + target
			if(ioArgs["_originalAction"]){
				fNode.setAttribute("action", ioArgs._originalAction);
			}
			if(ioArgs["_originalTarget"]){
				fNode.setAttribute("target", ioArgs._originalTarget);
				fNode.target = ioArgs._originalTarget;
			}
		}

		ioArgs._finished = true;
	}
};

return dojo.io.iframe;
});

},
'dojox/lang/functional/lambda':function(){
define("dojox/lang/functional/lambda", ["../..", "dojo/_base/kernel", "dojo/_base/lang", "dojo/_base/array"], function(dojox, dojo, lang, arr){
	var df = lang.getObject("lang.functional", true, dojox);

// This module adds high-level functions and related constructs:
//	- anonymous functions built from the string

// Acknoledgements:
//	- lambda() is based on work by Oliver Steele
//		(http://osteele.com/sources/javascript/functional/functional.js)
//		which was published under MIT License

// Notes:
//	- lambda() produces functions, which after the compilation step are
//		as fast as regular JS functions (at least theoretically).

// Lambda input values:
//	- returns functions unchanged
//	- converts strings to functions
//	- converts arrays to a functional composition

	var lcache = {};

	// split() is augmented on IE6 to ensure the uniform behavior
	var split = "ab".split(/a*/).length > 1 ? String.prototype.split :
			function(sep){
				 var r = this.split.call(this, sep),
					 m = sep.exec(this);
				 if(m && m.index == 0){ r.unshift(""); }
				 return r;
			};
			
	var lambda = function(/*String*/ s){
		var args = [], sects = split.call(s, /\s*->\s*/m);
		if(sects.length > 1){
			while(sects.length){
				s = sects.pop();
				args = sects.pop().split(/\s*,\s*|\s+/m);
				if(sects.length){ sects.push("(function(" + args + "){return (" + s + ")})"); }
			}
		}else if(s.match(/\b_\b/)){
			args = ["_"];
		}else{
			var l = s.match(/^\s*(?:[+*\/%&|\^\.=<>]|!=)/m),
				r = s.match(/[+\-*\/%&|\^\.=<>!]\s*$/m);
			if(l || r){
				if(l){
					args.push("$1");
					s = "$1" + s;
				}
				if(r){
					args.push("$2");
					s = s + "$2";
				}
			}else{
				// the point of the long regex below is to exclude all well-known
				// lower-case words from the list of potential arguments
				var vars = s.
					replace(/(?:\b[A-Z]|\.[a-zA-Z_$])[a-zA-Z_$\d]*|[a-zA-Z_$][a-zA-Z_$\d]*:|this|true|false|null|undefined|typeof|instanceof|in|delete|new|void|arguments|decodeURI|decodeURIComponent|encodeURI|encodeURIComponent|escape|eval|isFinite|isNaN|parseFloat|parseInt|unescape|dojo|dijit|dojox|window|document|'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"/g, "").
					match(/([a-z_$][a-z_$\d]*)/gi) || [], t = {};
				arr.forEach(vars, function(v){
					if(!(v in t)){
						args.push(v);
						t[v] = 1;
					}
				});
			}
		}
		return {args: args, body: s};	// Object
	};

	var compose = function(/*Array*/ a){
		return a.length ?
					function(){
						var i = a.length - 1, x = df.lambda(a[i]).apply(this, arguments);
						for(--i; i >= 0; --i){ x = df.lambda(a[i]).call(this, x); }
						return x;
					}
				:
					// identity
					function(x){ return x; };
	};

	lang.mixin(df, {
		// lambda
		rawLambda: function(/*String*/ s){
			// summary:
			//		builds a function from a snippet, or array (composing),
			//		returns an object describing the function; functions are
			//		passed through unmodified.
			// description:
			//		This method is to normalize a functional representation (a
			//		text snippet) to an object that contains an array of
			//		arguments, and a body , which is used to calculate the
			//		returning value.
			return lambda(s);	// Object
		},
		buildLambda: function(/*String*/ s){
			// summary:
			//		builds a function from a snippet, returns a string, which
			//		represents the function.
			// description:
			//		This method returns a textual representation of a function
			//		built from the snippet. It is meant to be evaled in the
			//		proper context, so local variables can be pulled from the
			//		environment.
			s = lambda(s);
			return "function(" + s.args.join(",") + "){return (" + s.body + ");}";	// String
		},
		lambda: function(/*Function|String|Array*/ s){
			// summary:
			//		builds a function from a snippet, or array (composing),
			//		returns a function object; functions are passed through
			//		unmodified.
			// description:
			//		This method is used to normalize a functional
			//		representation (a text snippet, an array, or a function) to
			//		a function object.
			if(typeof s == "function"){ return s; }
			if(s instanceof Array){ return compose(s); }
			if(s in lcache){ return lcache[s]; }
			s = lambda(s);
			return lcache[s] = new Function(s.args, "return (" + s.body + ");");	// Function
		},
		clearLambdaCache: function(){
			// summary:
			//		clears internal cache of lambdas
			lcache = {};
		}
	});
	
	return df;
});

},
'dojox/charting/themes/common':function(){
define("dojox/charting/themes/common", ["dojo/_base/lang"], function(lang){
	return lang.getObject("dojox.charting.themes", true);
});

},
'dojox/charting/plot2d/MarkersOnly':function(){
define("dojox/charting/plot2d/MarkersOnly", ["dojo/_base/declare", "./Default"], function(declare, Default){
/*=====
var Default = dojox.charting.plot2d.Default;
=====*/
	return declare("dojox.charting.plot2d.MarkersOnly", Default, {
		//	summary:
		//		A convenience object to draw only markers (like a scatter but not quite).
		constructor: function(){
			//	summary:
			//		Set up our default plot to only have markers and no lines.
			this.opt.lines   = false;
			this.opt.markers = true;
		}
	});
});

},
'esri/dijit/Popup':function(){
// wrapped by build app
define(["dijit","dojo","dojox","dojo/require!esri/InfoWindowBase,esri/PopupBase,esri/utils,dijit/_Widget,dijit/_Templated,dojo/number,dojo/date/locale,dojox/charting/Chart2D,dojox/charting/themes/PlotKit/base,dojox/charting/action2d/Tooltip,dojo/i18n"], function(dijit,dojo,dojox){
dojo.provide("esri.dijit.Popup");

dojo.require("esri.InfoWindowBase");
dojo.require("esri.PopupBase");
dojo.require("esri.utils");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");

// TODO
// Should these be dynamic dependencies?
// Modules required for date and number formatting
dojo.require("dojo.number");
dojo.require("dojo.date.locale");
// Modules requried for charting
dojo.require("dojox.charting.Chart2D");
dojo.require("dojox.charting.themes.PlotKit.base");
dojo.require("dojox.charting.action2d.Tooltip");
//dojo.require("dojox.charting.action2d.MoveSlice");
//dojo.require("dojox.charting.action2d.Magnify");
//dojo.require("dojox.charting.action2d.Highlight");
//dojo.require("dojox.charting.widget.Legend");
dojo.require("dojo.i18n");

// Based on dojox.charting.themes.PlotKit.blue theme
(function(){
  var dc = dojox.charting, pk = dc.themes.PlotKit;

  pk.popup = pk.base.clone();
  pk.popup.chart.fill = pk.popup.plotarea.fill = "#e7eef6";
  
  // Based on colors used by Explorer Online
  pk.popup.colors = [ // 15 colors
    "#284B70", // Blue
    "#702828", // Red
    "#5F7143", // Light Green
    "#F6BC0C", // Yellow
    "#382C6C", // Indigo
    "#50224F", // Magenta
    "#1D7554", // Dark Green
    "#4C4C4C", // Gray Shade
    "#0271AE", // Light Blue
    "#706E41", // Brown
    "#446A73", // Cyan
    "#0C3E69", // Medium Blue
    "#757575", // Gray Shade 2
    "#B7B7B7", // Gray Shade 3
    "#A3A3A3" // Gray Shade 4
  ];
  pk.popup.series.stroke.width = 1;
  pk.popup.marker.stroke.width = 1;
}());

// TODO
// Optimal max-height for the content pane could be
// (map.height / 2) - (approx height of title pane + actions pane) - (approx height of the popup tail)

/*******************
 * esri.dijit.Popup
 *******************/
dojo.declare("esri.dijit.Popup", [ esri.InfoWindowBase, esri.PopupBase ], {
  
  offsetX: 3,
  offsetY: 3,
  zoomFactor: 4,
  marginLeft: 25,
  marginTop: 25,
  highlight: true,
  
  constructor: function(parameters, srcNodeRef) {
    /**
     * Supported parameters:
     *   markerSymbol
     *   lineSymbol
     *   fillSymbol
     *   offsetX (in pixels)
     *   offsetY (in pixels)
     *   zoomFactor (number of levels to zoom in)
     *   marginLeft (in pixels)
     *   marginTop (in pixels)
     *   highlight
     */
    this.initialize();
    dojo.mixin(this, parameters);
    this.domNode = dojo.byId(srcNodeRef);
    
    var nls = this._nls = dojo.mixin({}, esri.bundle.widgets.popup);

    var domNode = this.domNode;
    dojo.addClass(domNode, "esriPopup");

    /***************************
     * Create the DOM structure
     ***************************/
    
    var structure = 
      "<div class='esriPopupWrapper' style='position: absolute;'>" +
      "<div class='sizer'>" +
        "<div class='titlePane'>" +
          "<div class='spinner hidden' title='" + nls.NLS_searching + "...'></div>" +
          "<div class='title'></div>" +
          "<div class='titleButton prev hidden' title='" + nls.NLS_prevFeature + "'></div>" +
          "<div class='titleButton next hidden' title='" + nls.NLS_nextFeature + "'></div>" +
          "<div class='titleButton maximize' title='" + nls.NLS_maximize + "'></div>" +
          "<div class='titleButton close' title='" + nls.NLS_close + "'></div>" +
        "</div>" +
      "</div>" +
      
      "<div class='sizer content'>" +
        "<div class='contentPane'>" + 
        "</div>" +
      "</div>" +
      
      "<div class='sizer'>" + 
        "<div class='actionsPane'>" + 
          "<div class='actionList hidden'>" + 
            "<a class='action zoomTo' href='javascript:void(0);'>" + nls.NLS_zoomTo + "</a>" + 
          "</div>" +
        "</div>" +
      "</div>" +
      
      /*"<div class='pointer top hidden'></div>" +
      "<div class='pointer bottom hidden'></div>" +
      "<div class='pointer left hidden'></div>" +
      "<div class='pointer right hidden'></div>" +
      "<div class='pointer topLeft hidden'></div>" +
      "<div class='pointer topRight hidden'></div>" +
      "<div class='pointer bottomLeft hidden'></div>" +
      "<div class='pointer bottomRight hidden'></div>" + */

      "<div class='pointer hidden'></div>" +
      "</div>" +
      "<div class='outerPointer hidden'></div>";

    dojo.attr(domNode, "innerHTML", structure);
    
    // Get references to nodes for later use so that we don't 
    // have to perform DOM queries often
    this._sizers = dojo.query(".sizer", domNode);
    
    var titlePane = dojo.query(".titlePane", domNode)[0];
    dojo.setSelectable(titlePane, false);
    
    this._title = dojo.query(".title", titlePane)[0];
    this._prevFeatureButton = dojo.query(".prev", titlePane)[0];
    this._nextFeatureButton = dojo.query(".next", titlePane)[0];
    this._maxButton = dojo.query(".maximize", titlePane)[0];
    this._spinner = dojo.query(".spinner", titlePane)[0];
    
    this._contentPane = dojo.query(".contentPane", domNode)[0];
    this._positioner = dojo.query(".esriPopupWrapper", domNode)[0];
    this._pointer = dojo.query(".pointer", domNode)[0];
    this._outerPointer = dojo.query(".outerPointer", domNode)[0];

    this._actionList = dojo.query(".actionsPane .actionList", domNode)[0];
    
    /***********************
     * Setup event handlers
     ***********************/
    
    this._eventConnections = [
      dojo.connect(dojo.query(".close", titlePane)[0], "onclick", this, this.hide),
      dojo.connect(this._prevFeatureButton, "onclick", this, this.selectPrevious),
      dojo.connect(this._nextFeatureButton, "onclick", this, this.selectNext),
      dojo.connect(this._maxButton, "onclick", this, this._toggleSize),
      dojo.connect(dojo.query(".zoomTo", this._actionList)[0], "onclick", this, this._zoomToFeature)
    ];

    // iOS wants the user to do two-finger scrolling for overflowing elements 
    // inside the body. We want to let the users do this with one finger.
    if (esri.isTouchEnabled) {
      var handles = esri.setScrollable(this._contentPane);
      this._eventConnections.push(handles[0], handles[1]);
    }

    // Hidden initially
    //esri.hide(domNode);
    this._setVisibility(false);
    this.isShowing = false;
  },
  
  /*****************************************
   * Override and implement methods defined  
   * by the base class: InfoWindowBase
   *****************************************/
  
  setMap: function(map) {
    // Run logic defined in the base class
    this.inherited(arguments);
    
    dojo.place(this.domNode, map.root);
   
    if (this.highlight) {
      this.enableHighlight(map);
    }
    
    this._maxHeight = dojo.style(this._contentPane, "maxHeight");
  },
  
  unsetMap: function() {
    this.disableHighlight(this.map);

    // Run logic defined in the base class
    this.inherited(arguments);
  },
  
  setTitle: function(title) {
    if (!esri._isDefined(title) || title === "") {
      title = "&nbsp;";
    }
    
    this.destroyDijits(this._title);
    this.place(title, this._title);
    if (this.isShowing) {
      this.startupDijits(this._title);
      this.reposition();
    }
  },
  
  setContent: function(content) {
    if (!esri._isDefined(content) || content === "") {
      content = "&nbsp;";
    }
    
    this.destroyDijits(this._contentPane);
    this.place(content, this._contentPane);
    if (this.isShowing) {
      this.startupDijits(this._contentPane);
      this.reposition();
    }
  },
  
  show: function(location, options) {
    if (!location) {
      //esri.show(this.domNode);
      this._setVisibility(true);
      this.isShowing = true;
      return;
    }
    
    // Is location specified in map coordinates?
    var map = this.map, screenLocation;
    if (location.spatialReference) {
      this._location = location;
      screenLocation = map.toScreen(location);
    }
    else {
      this._location = map.toMap(location);
      screenLocation = location;
    }
    
    var mapFrameWidth = map._getFrameWidth();
    if (mapFrameWidth !== -1) {
      screenLocation.x = screenLocation.x % mapFrameWidth;
      if (screenLocation.x < 0) {
        screenLocation.x += mapFrameWidth;
      }
      if (map.width > mapFrameWidth) {
        var margin = (map.width - mapFrameWidth)/2;
        while (screenLocation.x < margin) {
          screenLocation.x += mapFrameWidth;
        }
      }
    }

    if (this._maximized) {
      this.restore();
    }
    else {
      this._setPosition(screenLocation);
    }    
    
    if (options && options.closestFirst) {
      this.showClosestFirst(this._location);
    }
    
    // Display
    if (!this.isShowing) {
      //esri.show(this.domNode);
      this._setVisibility(true);
      this.isShowing = true;
      this.onShow();
    }
  },
  
  hide: function() {
    if (this.isShowing) {
      //esri.hide(this.domNode);
      this._setVisibility(false);
      this.isShowing = false;
      this.onHide();
    }
  },
  
  resize: function(width, height) {
    this._sizers.style({
      width: width + "px"
    });
    
    dojo.style(this._contentPane, "maxHeight", height + "px");
    this._maxHeight = height;
    
    if (this.isShowing) {
      this.reposition();
    }
  },
  
  reposition: function() {
    // NOP if the popup is maximized
    // NOP if the popup is not currently showing
    if (this.map && this._location && !this._maximized && this.isShowing) {
      this._setPosition(this.map.toScreen(this._location));
    }
  },
  
  onShow: function() {
    this._followMap();
    this.startupDijits(this._title);
    this.startupDijits(this._contentPane);
    this.reposition();
    this.showHighlight();
  },
  
  onHide: function() {
    this._unfollowMap();
    this.hideHighlight();
  },
  
  /************************************
   * Defining some methods specific to
   * this popup info window
   ************************************/
  
  maximize: function() {
    var map = this.map;
    if (!map || this._maximized) {
      return;
    }
    
    this._maximized = true;

    var max = this._maxButton;
    dojo.removeClass(max, "maximize");
    dojo.addClass(max, "restore");
    dojo.attr(max, "title", this._nls.NLS_restore);

    var marginLeft = this.marginLeft, marginTop = this.marginTop,
        width = map.width - (2 * marginLeft), height = map.height - (2 * marginTop),
        domNode = this.domNode;
    
    // New positioning
    dojo.style(domNode, {
      left: marginLeft + "px",
      right: null,
      top: marginTop + "px",
      bottom: null
    });
    
    dojo.style(this._positioner, {
      left: null,
      right: null,
      top: null,
      bottom: null
    });

    // Save current size    
    this._savedWidth = dojo.style(this._sizers[0], "width");
    this._savedHeight = dojo.style(this._contentPane, "maxHeight");
    
    // New size
    //dojo.removeClass(domNode, "attached");
    
    this._sizers.style({
      width: width + "px"
    });
    
    // TODO
    // Instead of using magic# 65, obtain the current size
    // of title bar plus action bar
    dojo.style(this._contentPane, {
      maxHeight: (height - 65) + "px",
      height: (height - 65) + "px"
    });
    
    // Hide all tails
    this._showPointer("");
    
    // Disconnect from map
    this._unfollowMap();
    dojo.addClass(this.domNode, "esriPopupMaximized");
    
    this.onMaximize();
  },
  
  restore: function() {
    var map = this.map;
    if (!map || !this._maximized) {
      return;
    }
    
    this._maximized = false;

    var max = this._maxButton;
    dojo.removeClass(max, "restore");
    dojo.addClass(max, "maximize");
    dojo.attr(max, "title", this._nls.NLS_maximize);
   
    dojo.style(this._contentPane, "height", null);
    
    //dojo.addClass(domNode, "attached");
    this.resize(this._savedWidth, this._savedHeight);
    this._savedWidth = this._savedHeight = null;

    this.show(this._location);
    
    // Re-connect to map
    this._followMap();
    dojo.removeClass(this.domNode, "esriPopupMaximized");
    
    this.onRestore();
  },
  
  destroy: function() {
    if (this.map) {
      this.unsetMap();
    }
    this.cleanup();
    if (this.isShowing) {
      this.hide();
    }
    this.destroyDijits(this._title);
    this.destroyDijits(this._content);
    dojo.forEach(this._eventConnections, dojo.disconnect);
    dojo.destroy(this.domNode);
    
    this._sizers = this._contentPane = this._actionList =
    this._positioner = this._pointer = this._outerPointer = 
    this._title = this._prevFeatureButton = 
    this._nextFeatureButton = this._spinner = this._eventConnections = 
    this._pagerScope = this._targetLocation = this._nls = 
    this._maxButton = null;
  },
  
  selectNext: function() {
    this.select(this.selectedIndex + 1);
  },
  
  selectPrevious: function() {
    this.select(this.selectedIndex - 1);
  },
  
  /***********************************************
   * Overriding some methods defined in PopupBase
   ***********************************************/
 
  setFeatures: function() {
    this.inherited(arguments);
    
    // TODO
    // We want to do this only when deferreds are
    // passed as arguments. As far as I know there is no
    // harm in doing this for features
    this._updateUI();
  },
  
  onSetFeatures: function() {
    //console.log("onSetFeatures");
  },
  
  onClearFeatures: function() {
    //console.log("onClearFeatures");

    this.setTitle("&nbsp;");
    this.setContent("&nbsp;");
    this._setPagerCallbacks(this);
    
    this._updateUI();
    this.hideHighlight();
  },
  
  onSelectionChange: function() {
    //console.log("onSelectionChange");
    
    var ptr = this.selectedIndex;
    
    this._updateUI();
    
    if (ptr >= 0) {
      this.setContent(this.features[ptr].getContent());
      
      //this._highlight(this.features[ptr]);
      this.updateHighlight(this.map, this.features[ptr]);
      if (this.isShowing) {
        this.showHighlight();
      }
    }
  },
  
  onDfdComplete: function() {
    //console.log("onDfdComplete");
    this.inherited(arguments);
    this._updateUI();
  },
  
  onMaximize: function() {},
  onRestore: function() {},
  
  /*******************
   * Internal Methods
   *******************/
  
  _setVisibility: function(visible) {
    //this.reposition();

    //esri[visible ? "show" : "hide"](this.domNode);
    dojo.style(this.domNode, "visibility", visible ? "visible" : "hidden");
  },
  
  _followMap: function() {
    this._unfollowMap();
    //console.log("register");
    
    // Setup handlers for map navigation events
    var map = this.map;
    this._handles = [
      dojo.connect(map, "onPanStart", this, this._onPanStart),
      dojo.connect(map, "onPan", this, this._onPan),
      dojo.connect(map, "onZoomStart", this, this._onZoomStart),
      dojo.connect(map, "onExtentChange", this, this._onExtentChange)
    ];
  },
  
  _unfollowMap: function() {
    //console.log("UNregister");
    
    var handles = this._handles;
    if (handles) {
      dojo.forEach(handles, dojo.disconnect, dojo);
      this._handles = null;
    }
  },
  
  _onPanStart: function() {
    // Record the current position of my info window
    var style = this.domNode.style;
    this._panOrigin = { left: style.left, top: style.top, right: style.right, bottom: style.bottom };
  },
  
  _onPan: function(extent, delta) {
    var origin = this._panOrigin, dx = delta.x, dy = delta.y,
        left = origin.left, top = origin.top, 
        right = origin.right, bottom = origin.bottom;
    
    if (left) {
      left = (parseFloat(left) + dx) + "px";
    }
    if (top) {
      top = (parseFloat(top) + dy) + "px";
    }
    if (right) {
      right = (parseFloat(right) - dx) + "px";
    }
    if (bottom) {
      bottom = (parseFloat(bottom) - dy) + "px";
    }
    
    // Relocate the info window by the amount of pan delta
    dojo.style(this.domNode, { left: left, top: top, right: right, bottom: bottom });
  },
  
  _onZoomStart: function() {
    // Temporarily hide the info window
    //esri.hide(this.domNode);
    this._setVisibility(false);
  },
  
  _onExtentChange: function(extent, delta, levelChange) {
    if (levelChange) {
      //esri.show(this.domNode);
      this._setVisibility(true);
      this.show(this._targetLocation || this._location);
    }
    this._targetLocation = null;
  },
  
  _toggleSize: function() {
    if (this._maximized) {
      this.restore();
    }
    else {
      this.maximize();
    }
  },
  
  _setPosition: function(location) {
    var posX = location.x, posY = location.y, offX = this.offsetX || 0, offY = this.offsetY || 0, 
        pointerW = 0, pointerH = 0,
        mapBox = dojo.position(this.map.container, true), width = mapBox.w, height = mapBox.h,
        classX = "Left", classY = "bottom",
        popBox = dojo.contentBox(this._positioner), halfPopW = popBox.w/2, halfPopH = popBox.h/2,
        maxH = dojo.style(this._sizers[0], "height") + this._maxHeight + dojo.style(this._sizers[2], "height"), 
        halfMaxH = maxH / 2,
        xmin = 0, ymin = 0, xmax = width, ymax = height,
        pageX = posX, pageY = posY;

    // Take into account the current view box. The bbox
    // for calculations below expands or shrinks based on 
    // the current dimensions of the doc view box
    var docBox = dojo.getObject("dojo.window.getBox");
    if (docBox) {
      docBox = docBox();
      xmin = Math.max(docBox.l, mapBox.x);
      xmax = Math.min(docBox.l + docBox.w, mapBox.x + mapBox.w);
      ymin = Math.max(docBox.t, mapBox.y);
      ymax = Math.min(docBox.t + docBox.h, mapBox.y + mapBox.h);
      pageX += mapBox.x;
      pageY += mapBox.y;
    }
    //console.log(xmin, xmax, ymin, ymax);

    // TODO
    // 1. Find the real maximum height (maxH) from all the sizers
    // 2. Call this method whenever popup renderer content changes
    // 3. Include pointer width/height in the comparison below

    //console.log("max allowed height = " + maxH);
    //console.log("popup content box = " + dojo.toJson(popBox));
    
    // Check horizontal space first
    if ( ((pageY - ymin) > halfMaxH) && ((ymax - pageY) >= halfMaxH ) ) {
      if ( (xmax - pageX) >= popBox.w ) {
        classY  = "";
        classX = "Left";
      }
      else if ((pageX - xmin) >= popBox.w) {
        classY  = "";
        classX = "Right";
      }
    }
    
    // Check vertical space
    if (classX && classY) {
      if ( ((pageX - xmin) > halfPopW) && ((xmax - pageX) >= halfPopW ) ) {
        if ((pageY - ymin) >= maxH) {
          classX  = "";
          classY = "bottom";
        }
        else if ( (ymax - pageY) >= maxH ) {
          classX  = "";
          classY = "top";
        }
      }
    }
    
    // Check corners
    if (classX && classY) {
      if (pageX <= xmax / 2) {
        classX = "Left";
      }
      else if (pageX <= xmax) {
        classX = "Right";
      }
  
      if (pageY <= ymax / 2) {
        classY = "top";
      }
      else if (pageY <= ymax) {
        classY = "bottom";
      }
    }
    
    var className = classY + classX;
    
    // Height of the pointers (from popup.css)
    switch(className) {
      case "top":
      case "bottom":
        pointerH = 14; // 26;
        break;
      case "Left":
      case "Right":
        pointerW = 13; // 25; 
        break;
      case "topLeft":
      case "topRight":
      case "bottomLeft":
      case "bottomRight":
        pointerH = 45;
        break;
    }

    // Place popup at the right position
    dojo.style(this.domNode, {
      left: posX + "px",
      top: posY + "px",
      right: null,
      bottom: null
    });
    
    var styleVal = { left: null, right: null, top: null, bottom: null };
    
    if (classX) {
      styleVal[classX.toLowerCase()] = (pointerW + offX) + "px";
    }
    else {
      styleVal.left = (-halfPopW) + "px";
    }
    
    if (classY) {
      styleVal[classY] = (pointerH + offY) + "px";
    }
    else {
      styleVal.top = (-halfPopH) + "px";
    }

    dojo.style(this._positioner, styleVal);

    // Display pointer
    this._showPointer(className);


    /*switch(orientation) {
      case "top":
        dojo.style(this.domNode, {
          left: (posX - 135) + "px",
          right: null,
          top: null,
          bottom: (height - posY + tailDy + offY) + "px"
        });
        break;
      case "bottom":
        dojo.style(this.domNode, {
          left: (posX - 135) + "px",
          right: null,
          top: (posY + tailDy + offY) + "px",
          bottom: null
        });
        break;
      case "topLeft":
        dojo.style(this.domNode, {
          left: null,
          right: (width - posX + offX) + "px",
          top: null,
          bottom: (height - posY + tailDy + offY) + "px"
        });
        break;
      case "topRight":
        dojo.style(this.domNode, {
          left: (posX + offX) + "px",
          right: null,
          top: null,
          bottom: (height - posY + tailDy + offY) + "px"
        });
        break;
      case "bottomLeft":
        dojo.style(this.domNode, {
          left: null,
          right: (width - posX + offX) + "px",
          top: (posY + tailDy + offY) + "px",
          bottom: null
        });
        break;
      case "bottomRight":
        dojo.style(this.domNode, {
          left: (posX + offX) + "px",
          right: null,
          top: (posY + tailDy + offY) + "px",
          bottom: null
        });
        break;
    }
        
    if (orientation.indexOf("Left") !== -1) {
      posX -= box.w;
      bufferX *= -1;
    }
    if (orientation.indexOf("top") !== -1) {
      posY -= box.h;
      bufferY *= -1;
    }*/
  },
  
  _showPointer: function(className) {
    /*var pointers = [ 
      "top", "bottom", "right", "left",
      "topLeft", "topRight", "bottomRight", "bottomLeft" 
    ];
    
    dojo.forEach(pointers, function(ptr) {
      if (ptr === className) {
        dojo.query(".pointer." + ptr, this.domNode).removeClass("hidden");
      }
      else {
        dojo.query(".pointer." + ptr, this.domNode).addClass("hidden");
      }
    }, this);*/
   
    dojo.removeClass(this._pointer, [
      "top", "bottom", "right", "left",
      "topLeft", "topRight", "bottomRight", "bottomLeft", 
      "hidden" 
    ]);

    dojo.removeClass(this._outerPointer, [
      "right", "left", "hidden"
    ]);
    
    if (className === "Right" || className === "Left") {
      className = className.toLowerCase();
      dojo.addClass(this._outerPointer, className);
    }
    else {
      dojo.addClass(this._pointer, className);
    }
  },
  
  _setPagerCallbacks: function(scope, prevFunc, nextFunc) {
    if (scope === this && (!this._pagerScope || this._pagerScope === this)) {
      //console.log("return 1");
      return;
    }
    
    if (scope === this._pagerScope) {
      //console.log("return 2");
      return;
    }
    
    this._pagerScope = scope;
    
    if (scope === this) {
      prevFunc = this.selectPrevious;
      nextFunc = this.selectNext;
    }
    
    var connections = this._eventConnections;
    dojo.disconnect(connections[1]);
    dojo.disconnect(connections[2]);
    
    if (prevFunc) {
      connections[1] = dojo.connect(this._prevFeatureButton, "onclick", scope, prevFunc);
    }
    if (nextFunc) {
      connections[2] = dojo.connect(this._nextFeatureButton, "onclick", scope, nextFunc);
    }
  },
  
  _zoomToFeature: function() {
    var features = this.features, ptr = this.selectedIndex, map = this.map;
    
    if (features) {
      //var location = this._getLocation(features[ptr]);
      var geometry = features[ptr].geometry, point, extent, maxDelta = 0, maxEx;
      
      if (geometry) {
        switch(geometry.type) {
          case "point":
            point = geometry;
            break;
          case "multipoint":
            point = geometry.getPoint(0);
            extent = geometry.getExtent();
            break;
          case "polyline":
            point = geometry.getPoint(0, 0);
            extent = geometry.getExtent();
            if (map._getFrameWidth() !== -1) {
              //find the biggest geometry to zoom to.              
              dojo.forEach(geometry.paths, function(path){
                var subPolylineJson = {"paths": [path, map.spatialReference]},
                    subPolyline = new esri.geometry.Polyline(subPolylineJson),
                    subEx = subPolyline.getExtent(),
                    deltaY = Math.abs(subEx.ymax - subEx.ymin),
                    deltaX = Math.abs(subEx.xmax - subEx.xmin),
                    delta = (deltaX > deltaY) ? deltaX: deltaY;
                if (delta > maxDelta) {
                  maxDelta = delta;
                  maxEx = subEx;
                }
              });
							maxEx.spatialReference = extent.spatialReference;
              extent = maxEx;
            }
            break;
          case "polygon":
            point = geometry.getPoint(0, 0);
            extent = geometry.getExtent();
            //for wrap around case, find the smaller extent to fit the geometries with multi-parts.
            if (map._getFrameWidth() !== -1) {
              //find the biggest geometry to zoom to.
              dojo.forEach(geometry.rings, function(ring){
                var subPolygonJson = {"rings": [ring, map.spatialReference]},
                    subPolygon = new esri.geometry.Polygon(subPolygonJson),
                    subEx = subPolygon.getExtent(),
                    deltaY = Math.abs(subEx.ymax - subEx.ymin),
                    deltaX = Math.abs(subEx.xmax - subEx.xmin),
                    delta = (deltaX > deltaY) ? deltaX: deltaY;
                if (delta > maxDelta) {
                  maxDelta = delta;
                  maxEx = subEx;
                }
              });
              maxEx.spatialReference = extent.spatialReference;
              extent = maxEx;
            }
            break;
        }
      }
      
      if (!point) {
        point = this._location;
      }

      // Got to make sure that popup is "show"ed "at" the feature 
      // after zooming in.
      if (!extent || !extent.intersects(this._location)) {
        //this._targetLocation = location[0];
        this._location = point;
      }

      if (extent) { // line or polygon
        map.setExtent(extent, /*fit*/ true);
      }
      else { // point
        var numLevels = map.getNumLevels(), currentLevel = map.getLevel(), 
            last = numLevels - 1, factor = this.zoomFactor || 1;
        
        if (numLevels > 0) { // tiled base layer
          if (currentLevel === last) {
            return;
          }
        
          var targetLevel = currentLevel + factor;
          if (targetLevel > last) {
            targetLevel = last;
          }
          
          //map.centerAndZoom(location[0], targetLevel);
          
          // TODO
          // Expose this functionality via public map API
          map._scrollZoomHandler({ 
            value: (targetLevel - currentLevel), 
            mapPoint: point 
          }, true);
        }
        else { // dynamic base layer
          map._scrollZoomHandler({ 
            value: (1 / Math.pow(2, factor)) * 2, 
            mapPoint: point 
          }, true);
        }
      }
    } // features
  },
  
  _updateUI: function() {
    // TODO
    // A state machine based manipulation of UI elements'
    // visibility would greatly simplify this process
    
    var title = "&nbsp;", ptr = this.selectedIndex,
        features = this.features, deferreds = this.deferreds,
        prev = this._prevFeatureButton, next = this._nextFeatureButton,
        spinner = this._spinner, actionList = this._actionList,
        nls = this._nls;
    
    if (features && features.length > 1) {
      //title = "(" + (ptr+1) + " of " + features.length + ")";
      
      if (nls.NLS_pagingInfo) {
        title = esri.substitute({
          index: (ptr+1), 
          total: features.length
        }, nls.NLS_pagingInfo);
      }

      if (ptr === 0) {
        dojo.addClass(prev, "hidden");
      }
      else {
        dojo.removeClass(prev, "hidden");
      }
      
      if (ptr === features.length-1) {
        dojo.addClass(next, "hidden");
      }
      else {
        dojo.removeClass(next, "hidden");
      }
    }
    else {
      dojo.addClass(prev, "hidden");
      dojo.addClass(next, "hidden");
    }
    this.setTitle(title);
    
    if (deferreds && deferreds.length) {
      if (features) {
        dojo.removeClass(spinner, "hidden");
      }
      else {
        this.setContent("<div style='text-align: center;'>" + nls.NLS_searching + "...</div>");
      }
    }
    else {
      dojo.addClass(spinner, "hidden");
      if (!features || !features.length) {
        this.setContent("<div style='text-align: center;'>" + nls.NLS_noInfo + ".</div>");
      }
    }
    
    if (features && features.length) {
      dojo.removeClass(actionList, "hidden");
    }
    else {
      dojo.addClass(actionList, "hidden");
    }
  }
});


/***************************
 * esri.dijit.PopupTemplate
 ***************************/

dojo.declare("esri.dijit.PopupTemplate", [ esri.PopupInfoTemplate ], {
  chartTheme: "dojox.charting.themes.PlotKit.popup",
  
  constructor: function(json, options) {
    dojo.mixin(this, options);
    
    this.initialize(json);
    this._nls = dojo.mixin({}, esri.bundle.widgets.popup);
  },
  
  getTitle: function(graphic) {
    return this.info ? this.getComponents(graphic).title : "";
    //return "&nbsp;";
  },
  
  getContent: function(graphic) {
    return this.info ? new esri.dijit._PopupRenderer({
      template: this,
      graphic: graphic,
      chartTheme: this.chartTheme,
      _nls: this._nls
    }, dojo.create("div")).domNode : "";
  }
});

/****************************
 * esri.dijit._PopupRenderer
 ****************************/

dojo.declare("esri.dijit._PopupRenderer", [ dijit._Widget, dijit._Templated ], {
  /**
   * Properties:
   *   template
   *   graphic
   *   _nls
   */
  
  // TODO
  // Can I do this without being "Templated". Perhaps,
  // enlist dojo.parser's help?
  
  templateString:
    "<div class='esriViewPopup'>" +
  
      /** Title and Description **/
      "<div class='mainSection'>" + 
        "<div class='header' dojoAttachPoint='_title'></div>" + 
        "<div class='hzLine'></div>" + 
        "<div dojoAttachPoint='_description'></div>" +
        "<div class='break'></div>" +
      "</div>" +
      
      /** Attachments **/
      "<div class='attachmentsSection hidden'>" +
        "<div>${_nls.NLS_attach}:</div>" +
        "<ul dojoAttachPoint='_attachmentsList'>" +
        "</ul>" +
        "<div class='break'></div>" + 
      "</div>" +  
      
      /** Media Section **/
      "<div class='mediaSection hidden'>" + 
        "<div class='header' dojoAttachPoint='_mediaTitle'></div>" + 
        "<div class='hzLine'></div>" +
        "<div class='caption' dojoAttachPoint='_mediaCaption'></div>" +
        
        /** Media Gallery **/
        "<div class='gallery' dojoAttachPoint='_gallery'>" +
          "<div class='mediaHandle prev' dojoAttachPoint='_prevMedia' dojoAttachEvent='onclick: _goToPrevMedia'></div>" + 
          "<div class='mediaHandle next' dojoAttachPoint='_nextMedia' dojoAttachEvent='onclick: _goToNextMedia'></div>" + 
         
          "<ul class='summary'>" +
            "<li class='image mediaCount hidden' dojoAttachPoint='_imageCount'>0</li>" +
            "<li class='image mediaIcon hidden'></li>" +
            "<li class='chart mediaCount hidden' dojoAttachPoint='_chartCount'>0</li>" +
            "<li class='chart mediaIcon hidden'></li>" +
          "</ul>" +
          
          "<div class='frame' dojoAttachPoint='_mediaFrame'></div>" +
          
        "</div>" + // Media Gallery
        
      "</div>" + // Media Section
      
      /** Edit Summary **/
      "<div class='editSummarySection hidden' dojoAttachPoint='_editSummarySection'>" +
        "<div class='break'></div>" +
        "<div class='break hidden' dojoAttachPoint='_mediaBreak'></div>" +
        "<div class='editSummary' dojoAttachPoint='_editSummary'></div>" +
      "</div>" +
    
    "</div>",
  
  startup: function() {
    this.inherited(arguments);
    
    var template = this.template,
        graphic = this.graphic,
        components = template.getComponents(graphic),
        titleText = components.title,
        descText = components.description,
        fields = components.fields,
        mediaInfos = components.mediaInfos,
        domNode = this.domNode,
        nls = this._nls; //, tableView;
    
    this._prevMedia.title = nls.NLS_prevMedia;
    this._nextMedia.title = nls.NLS_nextMedia;
    
    // Main Section: title
    dojo.attr(this._title, "innerHTML", titleText);
    
    if (!titleText) {
      dojo.addClass(this._title, "hidden");
    }
    
    // Main Section: description
    if (!descText && fields) {
      descText = "";
      
      dojo.forEach(fields, function(row) {
        descText += ("<tr valign='top'>");
        descText += ("<td class='attrName'>" + row[0] + "</td>");

        // Note: convert attribute field values that just contain URLs 
        // into clickable links
        descText += ("<td class='attrValue'>" + 
                    row[1].replace(/^\s*(https?:\/\/[^\s]+)\s*$/i, "<a target='_blank' href='$1' title='$1'>" + nls.NLS_moreInfo + "</a>") + 
                    "</td>");
        descText += ("</tr>");
      });
      
      if (descText) {
        //tableView = 1;
        descText = "<table class='attrTable' cellpadding='0px' cellspacing='0px'>" + descText + "</table>";
      }
    }

    dojo.attr(this._description, "innerHTML", descText);
    
    if (!descText) {
      dojo.addClass(this._description, "hidden");
    }
    
    // Make links open in a new tab/window
    dojo.query("a", this._description).forEach(function(node) {
      //console.log("Link: ", node.target, node.href);
      dojo.attr(node, "target", "_blank");
    });

    if (titleText && descText) {
      dojo.query(".mainSection .hzLine", domNode).removeClass("hidden");
    }
    else {
      if (titleText || descText) {
        dojo.query(".mainSection .hzLine", domNode).addClass("hidden");
      }
      else {
        dojo.query(".mainSection", domNode).addClass("hidden");
      }
    }

    // Attachments Section
    var dfd = (this._dfd = template.getAttachments(graphic));
    if (dfd) {
      dfd.addBoth(dojo.hitch(this, this._attListHandler, dfd));
      
      dojo.attr(this._attachmentsList, "innerHTML", "<li>" + nls.NLS_searching + "...</li>");
      dojo.query(".attachmentsSection", domNode).removeClass("hidden");
    }
    
    // Media Section
    if (mediaInfos && mediaInfos.length) {
      dojo.query(".mediaSection", domNode).removeClass("hidden");
      dojo.setSelectable(this._mediaFrame, false);

      this._mediaInfos = mediaInfos;
      this._mediaPtr = 0;
      this._updateUI();
      this._displayMedia();
    }
    
    // Edit summary
    if (components.editSummary /*&& !tableView*/) {
      dojo.attr(this._editSummary, "innerHTML", components.editSummary);
      
      // We need this due to the manner in which the attachments section
      // is rendered (i.e. floating media info elements)
      if (mediaInfos && mediaInfos.length) {
        dojo.removeClass(this._mediaBreak, "hidden");
      }

      dojo.removeClass(this._editSummarySection, "hidden");
    }
  },
  
  destroy: function() {
    if (this._dfd) {
      this._dfd.cancel();
    }
    
    this._destroyFrame();
    
    this.template = this.graphic = this._nls = this._mediaInfos = 
    this._mediaPtr = this._dfd = null;
    
    this.inherited(arguments);
    //console.log("PopupRenderer: destroy");
  },
  
  /*******************
   * Internal Methods
   *******************/
  
  _goToPrevMedia: function() {
    var ptr = this._mediaPtr - 1;
    if (ptr < 0) {
      return;
    }
    
    this._mediaPtr--;
    this._updateUI();
    this._displayMedia();
  },
  
  _goToNextMedia: function() {
    var ptr = this._mediaPtr + 1;
    if (ptr === this._mediaInfos.length) {
      return;
    }
    
    this._mediaPtr++;
    this._updateUI();
    this._displayMedia();
  },
  
  _updateUI: function() {
    var infos = this._mediaInfos, count = infos.length, domNode = this.domNode,
        prevMedia = this._prevMedia, nextMedia = this._nextMedia;
    
    if (count > 1) {
      var numImages = 0, numCharts = 0;
      dojo.forEach(infos, function(info) {
        if (info.type === "image") {
          numImages++;
        }
        else if (info.type.indexOf("chart") !== -1) {
          numCharts++;
        }
      });
      
      if (numImages) {
        dojo.attr(this._imageCount, "innerHTML", numImages);
        dojo.query(".summary .image", domNode).removeClass("hidden");
      }
      
      if (numCharts) {
        dojo.attr(this._chartCount, "innerHTML", numCharts);
        dojo.query(".summary .chart", domNode).removeClass("hidden");
      }
    }
    else {
      dojo.query(".summary", domNode).addClass("hidden");
      dojo.addClass(prevMedia, "hidden");
      dojo.addClass(nextMedia, "hidden");
    }
    
    var ptr = this._mediaPtr;
    if (ptr === 0) {
      dojo.addClass(prevMedia, "hidden");
    }
    else {
      dojo.removeClass(prevMedia, "hidden");
    }
    
    if (ptr === count-1) {
      dojo.addClass(nextMedia, "hidden");
    }
    else {
      dojo.removeClass(nextMedia, "hidden");
    }
    
    this._destroyFrame();
  },
  
  _displayMedia: function() {
    var info = this._mediaInfos[this._mediaPtr],
        titleText = info.title, capText = info.caption,
        hzLine = dojo.query(".mediaSection .hzLine", this.domNode)[0];
      
    dojo.attr(this._mediaTitle, "innerHTML", titleText);
    dojo[titleText ? "removeClass" : "addClass" ](this._mediaTitle, "hidden");
      
    dojo.attr(this._mediaCaption, "innerHTML", capText);
    dojo[capText ? "removeClass" : "addClass"](this._mediaCaption, "hidden");
    
    dojo[(titleText && capText) ? "removeClass" : "addClass"](hzLine, "hidden");
    
    if (info.type === "image") {
      this._showImage(info.value);
    }
    else {
      this._showChart(info.type, info.value);
    }
  },
  
  _showImage: function(value) {
    dojo.addClass(this._mediaFrame, "image");
    
    var galleryHeight = dojo.style(this._gallery, "height"),
        html = "<img src='" + value.sourceURL + "' onload='esri.dijit._PopupRenderer.prototype._imageLoaded(this," + galleryHeight + ");' />";
    
    if (value.linkURL) {
      html = "<a target='_blank' href='" + value.linkURL + "'>" + html + "</a>";
    }
    
    dojo.attr(this._mediaFrame, "innerHTML", html);
  },
  
  _showChart: function(type, value) {
    dojo.removeClass(this._mediaFrame, "image");
    
    var chart = this._chart = new dojox.charting.Chart2D(dojo.create("div", { 
      "class": "chart" 
    }, this._mediaFrame), { 
      margins: { l:4, t:4, r:4, b:4 } 
    });
    
    // "value.theme" is not part of webmap popup spec, but we
    // added it so that developers can override default theme
    var chartTheme = value.theme || this.chartTheme || "PlotKit.popup";
    chart.setTheme(
      dojo.getObject(chartTheme) || 
      dojo.getObject("dojox.charting.themes." + chartTheme)
    );

    // TODO
    // A "grid" plot for line, column and bar charts would be
    // useful
    
    switch(type) {
      case "piechart":
        chart.addPlot("default", { type: "Pie", /*font: "14t", fontColor: "white",*/ labels: false });
        chart.addSeries("Series A", value.fields);
        break;
        
      case "linechart":
        chart.addPlot("default", { type: "Markers" });
        chart.addAxis("x", { min: 0, majorTicks: false, minorTicks: false, majorLabels: false, minorLabels: false });
        chart.addAxis("y", { includeZero: true, vertical: true, fixUpper: "minor" });
        dojo.forEach(value.fields, function(info, idx) {
          info.x = idx + 1;
        });
        chart.addSeries("Series A", value.fields);
        break;

      case "columnchart":
        chart.addPlot("default", { type: "Columns", gap: 3 });
        chart.addAxis("y", { includeZero: true, vertical: true, fixUpper: "minor" });
        chart.addSeries("Series A", value.fields);
        break;
        
      case "barchart":
        chart.addPlot("default", { type: "Bars", gap: 3 });
        chart.addAxis("x", { includeZero: true, fixUpper: "minor", minorLabels: false });
        chart.addAxis("y", { vertical: true, majorTicks: false, minorTicks: false, majorLabels: false, minorLabels: false });
        chart.addSeries("Series A", value.fields);
        break;
    }
    
    this._action = new dojox.charting.action2d.Tooltip(chart);
    // Tooltip action operates on mouseover, let's
    // intercept and use onclick event. Be careful, this will
    // probably not work for other actions
    // Ref:
    // http://dojotoolkit.org/reference-guide/dojox/charting.html
    // http://www.sitepen.com/blog/2008/06/12/dojo-charting-widgets-tooltips-and-legend/
    // TODO
    /*if (esri.isTouchEnabled) {
      this._action.disconnect();
      chart.connectToPlot("default", this, this._processPlotEvent);
    }*/
    
    chart.render();

    //this._legend = new dojox.charting.widget.Legend({chart: chart}, dojo.byId("legendNode"));
  },
  
  /*_processPlotEvent: function(o) {
    if (o.type === "onmouseover") {
      o.shape.rawNode.style.cursor = "pointer";
      return;
    }
    if (o.type === "onclick") {
      o.type = "onmouseover";
    }
    this._action.process(o);
  },*/
  
  _destroyFrame: function() {
    if (this._chart) {
      this._chart.destroy();
      this._chart = null;
    }

    // There is a reason for action being destroyed after
    // the chart: chart.destroy seems to fire onplotreset
    // event. I suspect we should let it be processed in our
    // _processPlotEvent
    if (this._action) {
      this._action.destroy();
      this._action = null;
    }
    
    dojo.attr(this._mediaFrame, "innerHTML", "");
  },
  
  _imageLoaded: function(img, galleryHeight) {
    //console.log("Height = ", img.height, ", Expected = ", galleryHeight);
    
    var imgHeight = img.height;
    if (imgHeight < galleryHeight) {
      var diff = Math.round((galleryHeight - imgHeight) / 2);
      dojo.style(img, "marginTop", diff + "px");
      //console.log("Adjusted margin-top: ", diff);
    }
  },
  
  _attListHandler: function(dfd, attInfos) {
    if (dfd === this._dfd) {
      this._dfd = null;

      /*// For debugging only. Comment this out in
      // production code when checking in to starteam
      if (attInfos instanceof Error) {
        console.log("query attachments ERROR: ", attInfos);
      }*/
      
      var html = "";
      
      if (!(attInfos instanceof Error) && attInfos && attInfos.length) {
        dojo.forEach(attInfos, function(info) {
          html += ("<li>");
          html += ("<a href='" + info.url + "' target='_blank'>" + (info.name || "[No name]") + "</a>");
          html += ("</li>");
        });
      }
      
      // TODO
      // Can we store this result in a cache? But when will the 
      // cache entries be invalidated or removed? This is tricky.
      // Policy could be:
      // - clear cache when the number of entries has reached a preset limit
      // - remove the entry for a feature if the user has edited the
      //   attachments while in "Edit" mode
      // - associate timestamps with each entry and clear them after they
      //   attain certain age.
      // I think we need a global resource cache of some sort that the viewer
      // can manage
      
      dojo.attr(this._attachmentsList, "innerHTML", html || "<li>" + this._nls.NLS_noAttach + "</li>");
    }
  }
});

});

},
'dojox/charting/scaler/common':function(){
define("dojox/charting/scaler/common", ["dojo/_base/lang"], function(lang){

	var eq = function(/*Number*/ a, /*Number*/ b){
		// summary: compare two FP numbers for equality
		return Math.abs(a - b) <= 1e-6 * (Math.abs(a) + Math.abs(b));	// Boolean
	};
	
	var common = lang.getObject("dojox.charting.scaler.common", true);
	
	var testedModules = {};

	return lang.mixin(common, {
		doIfLoaded: function(moduleName, ifloaded, ifnotloaded){
			if(testedModules[moduleName] == undefined){
				try{
					testedModules[moduleName] = require(moduleName);
				}catch(e){
					testedModules[moduleName] = null;
				}
			}
			if(testedModules[moduleName]){
				return ifloaded(testedModules[moduleName]);
			}else{
				return ifnotloaded();
			}
		},
		findString: function(/*String*/ val, /*Array*/ text){
			val = val.toLowerCase();
			for(var i = 0; i < text.length; ++i){
				if(val == text[i]){ return true; }
			}
			return false;
		},
		getNumericLabel: function(/*Number*/ number, /*Number*/ precision, /*Object*/ kwArgs){
			var def = "";
			common.doIfLoaded("dojo/number", function(numberLib){
				def = (kwArgs.fixed ? numberLib.format(number, {places : precision < 0 ? -precision : 0}) :
					numberLib.format(number)) || "";
			}, function(){
				def = kwArgs.fixed ? number.toFixed(precision < 0 ? -precision : 0) : number.toString();
			});
			if(kwArgs.labelFunc){
				var r = kwArgs.labelFunc(def, number, precision);
				if(r){ return r; }
				// else fall through to the regular labels search
			}
			if(kwArgs.labels){
				// classic binary search
				var l = kwArgs.labels, lo = 0, hi = l.length;
				while(lo < hi){
					var mid = Math.floor((lo + hi) / 2), val = l[mid].value;
					if(val < number){
						lo = mid + 1;
					}else{
						hi = mid;
					}
				}
				// lets take into account FP errors
				if(lo < l.length && eq(l[lo].value, number)){
					return l[lo].text;
				}
				--lo;
				if(lo >= 0 && lo < l.length && eq(l[lo].value, number)){
					return l[lo].text;
				}
				lo += 2;
				if(lo < l.length && eq(l[lo].value, number)){
					return l[lo].text;
				}
				// otherwise we will produce a number
			}
			return def;
		}
	});
});

},
'esri/layers/FeatureLayer':function(){
// wrapped by build app
define(["dijit","dojo","dojox","dojo/require!esri/layers/graphics,esri/tasks/query,dojo/io/iframe,esri/layers/agscommon,dojo/date/locale"], function(dijit,dojo,dojox){
dojo.provide("esri.layers.FeatureLayer");

dojo.require("esri.layers.graphics");
dojo.require("esri.tasks.query");
dojo.require("dojo.io.iframe");
dojo.require("esri.layers.agscommon");
dojo.require("dojo.date.locale");

// TODO
// Support for spatial definition in snapshot mode
// Optimize zoom-in operation in on-demand mode
// In snapshot mode, "selection" and "query" should happen on the client for most cases.
// Looks like we need to "suspend" the layer when the layer defn and map time extent did not overlap 
// [NEED TO REPRO] In snapshot mode, panning after zooming into a small area with a handful of features causes page freeze for a while.
//   - Need to optimize this based on a spatial index featureMap/cellMap similar to on-demand mode
// what about onLoad, onUpdate(on-demand mode) etc?
// onUpdate/onRefresh/onRedraw
// data store
// clustering
// modify GL to perform clipping using the grid extent in ondemand mode
// should the graphics layer always display the selected features? (clipping). Yes - it will be good for user experience 
// [FIXED] modify esri.request to fix the etag issue - utils.js, query.js, xhr.js
// [DONE] time offset
// [DONE] Client-side selection should honor query.timeExtent (i.e. time definition, map time extent)
// [DONE] Apply - layer defn expr, layer time defn, map time extent - to selectFeatures, queryFeatures, queryIds
// [DONE] Layer refresh is not honoring the map's time extent
// [DONE] Snapshot mode should honor map time extent (i.e. filter) after querying
// [DONE] Add refresh impl
// [NON-ISSUE] fix coded values domain format
// [DONE] min/max scale
// [DONE] enable infoTemplate
// [PARTIAL] [haitham] select a feature and move it, then zoom in, the feature layer shows the feature in the old location
//   - the feature will be in the new location as long as it remains selected thru the zoom operation
//   - need not be selected if the FL caches features across zoom levels
// [JEREMY] Unable to change the selection symbol between various types.
// [DONE] Add add/remove/refresh impl [NOTE: may be revoked later]
// [DONE] do not "select" when double clicking on a feature (map zoom in).
// [AS DESIGNED] add selectFeatures(oids/features, selectionMethod)?
// [DONE] add query methods
// [DONE] definition expression. set "null" in snapshot mode does "1=1", in ondemand mode uses "null". getter should return appropriate value
// [DONE] initial implementation for editing
// [DONE] add "map-render" mode
// [DONE] outFields issue - oidField in snapshot, ondemand modes
// [DONE] cannot lose selection on zoom in/out, property change
// [DONE] add "paging" mode for tables? - FeatureLayer will act as a data source in this case.
// [DONE] update/finish snapshot mode
// [DONE] get rid of the dependency on layer's full extent (need to discuss this with keyur again)
// [DONE] cannot remove a "selected" feature even when it goes out of focus or extent changes
// [DONE] panning the map by dragging on a feature "selects" it. fix it. -- jayant fixed it for 1.5 - yay! 

/***************************
 * esri.layers.FeatureLayer
 ***************************/

dojo.declare("esri.layers.FeatureLayer", esri.layers.GraphicsLayer, {
  
  /************
   * Overrides 
   ************/
  
  // TODO
  // At Dojo 1.4, we have more control over how the constructor
  // chaining happens between subclass and super classes.
  // When we move to 1.4, we need to take advantage of that
  // and remove the ugly hack from <_GraphicsLayer> constructor
  // REF: http://docs.dojocampus.org/dojo/declare#manual-constructor-chaining

  constructor: function(/*String*/ url, /*Object?*/ options) {
    // "url" is processed by <Layer> and "options" is processed by <_GraphicsLayer>
    //console.log("featurelayer: ", url, options);
    
    // custom options
    this._outFields = options && options.outFields;
    //this._infoTemplate = options && options.infoTemplate; // || "${*}";
    this._loadCallback = options && options.loadCallback;
    
    var patch = options && options._usePatch;
    this._usePatch = (patch === null || patch === undefined) ? true : patch;
    //console.log("patch status: ", this._usePatch);
    
    this._trackIdField = options && options.trackIdField;
    this.objectIdField = options && options.objectIdField;
    this._maxOffset = options && options.maxAllowableOffset;
    this._optEditable = options && options.editable;
    this._optAutoGen = options && options.autoGeneralize;
    this.editSummaryCallback = options && options.editSummaryCallback;
    this.userId = options && options.userId;
    this.userIsAdmin = options && options.userIsAdmin;

    this.useMapTime = (options && options.hasOwnProperty("useMapTime")) ? 
                      (!!options.useMapTime) : 
                      true;
    this.source = options && options.source;
    this.gdbVersion = options && options.gdbVersion;
    
    // other defaults
    this._selectedFeatures = {};
    this._selectedFeaturesArr = [];
    this._newFeatures = [];
    this._deletedFeatures = {};

    // this value will be unique for each feature layer
    // in an application
    this._ulid = this._getUniqueId();
    
    // construct appropriate "mode"
    var ctor = this.constructor, mode = this.mode = (esri._isDefined(options && options.mode) ? options.mode : ctor.MODE_ONDEMAND);
    switch(mode) {
      case ctor.MODE_SNAPSHOT:
        this._mode = new esri.layers._SnapshotMode(this);
        this._isSnapshot = true;
        break;
      case ctor.MODE_ONDEMAND:
        this._tileWidth = (options && options.tileWidth) || 512;
        this._tileHeight = (options && options.tileHeight) || 512;
        this._mode = new esri.layers._OnDemandMode(this);
    
        var lattice = options && options.latticeTiling;
        this.latticeTiling = /*!esri._isDefined(lattice) ||*/ lattice;
        break;
      case ctor.MODE_SELECTION:
        this._mode = new esri.layers._SelectionMode(this);
        this._isSelOnly = true;
        break;
    }

    this._initLayer = dojo.hitch(this, this._initLayer);
    //this._preprocess = dojo.hitch(this, this._preprocess);
    this._selectHandler = dojo.hitch(this, this._selectHandler);
    this._editable = false;
    
    // Deal with feature collection
    if (dojo.isObject(url) && url.layerDefinition) {
      var json = url;
      this._collection = true;
      this.mode = ctor.MODE_SNAPSHOT;
      this._initLayer(json);
      return this;
    }

    this._task = new esri.tasks.QueryTask(this.url, {
      source: this.source, 
      gdbVersion: this.gdbVersion
    });
    
    // is the layer editable?
    var urlPath = this._url.path;
    this._fserver = false;
    if (urlPath.search(/\/FeatureServer\//i) !== -1) {
      // TODO
      // template picker uses this variable as well
      this._fserver = true;
      //console.log(" -- is editable --");
    }

    var resourceInfo = options && options.resourceInfo;
    if (resourceInfo) {
      this._initLayer(resourceInfo);
    }
    else {
      // fetch layer information
      if (this.source) {
        var layer = {source: this.source.toJson()};
        this._url.query = dojo.mixin(this._url.query, {layer: dojo.toJson(layer)});
      }
      if (this.gdbVersion) {
        this._url.query = dojo.mixin(this._url.query, {gdbVersion: this.gdbVersion});
      }
      esri.request({
        url: urlPath,
        content: dojo.mixin({ f:"json" }, this._url.query),
        callbackParamName: "callback",
        load: this._initLayer, // this._preprocess,
        error: this._errorHandler
      });
    }
  },
  
  // (override)
  _initLayer: function(response, io) {
    // do not enter if this method is invoked by GraphicsLayer constructor
    if (response || io) {
      this._json = response; // TODO
      
      this._findCredential();
      
      // See esri.request for context regarding "_ssl"
      var ssl = (this.credential && this.credential.ssl) || (response && response._ssl);
      if (ssl) {
        this._useSSL();
        this._task._useSSL();
      }
      
      // check if this an ArcGIS Online Feature Collection Item
      if (this._collection) {
        // force snapshot mode
        this._mode = new esri.layers._SnapshotMode(this);
        this._isSnapshot = true;
        this._featureSet = response.featureSet;
        this._nextId = response.nextObjectId; // webmap spec
        response = response.layerDefinition;
      }
      
      if (response.hasOwnProperty("capabilities")) {
        var capabilities = (this.capabilities = response.capabilities);
        if (capabilities && capabilities.toLowerCase().indexOf("editing") !== -1) {
          this._editable = true;
        }
        else {
          this._editable = false;
        }
      }
      else if (!this._collection) {
        this._editable = this._fserver;
      }
      
      if (esri._isDefined(this._optEditable)) {
        this._editable = this._optEditable;
        delete this._optEditable;
      }
      
      //if (!this._collection) {
        // let's serialize and store
        this._json = dojo.toJson(this._json);
      //}
      
      // offset not applicable when the layer is editable
      if (this.isEditable()) {
        delete this._maxOffset;
      }
      // autoGeneralize applicable to non-editable, on-demand layers only
      else if (
        this.mode !== this.constructor.MODE_SNAPSHOT &&
        ((response.geometryType === "esriGeometryPolyline") || (response.geometryType === "esriGeometryPolygon"))
      ) {
        this._autoGeneralize = esri._isDefined(this._optAutoGen) ? 
                                this._optAutoGen :
                                (this.mode === this.constructor.MODE_ONDEMAND); 
        delete this._optAutoGen;
      }
      
      // process layer information
      this.minScale = response.effectiveMinScale || response.minScale || 0;
      this.maxScale = response.effectiveMaxScale || response.maxScale || 0;

      this.layerId = response.id;
      this.name = response.name;
      this.description = response.description;
      this.copyright = response.copyrightText;
      this.type = response.type;
      this.geometryType = response.geometryType;
      this.displayField = response.displayField;
      this.defaultDefinitionExpression = response.definitionExpression;
      this.fullExtent = new esri.geometry.Extent(response.extent);
      this.defaultVisibility = response.defaultVisibility;
      
      // disable lattice tiling for point and multipoint layers
      if (
        (this.geometryType === "esriGeometryPoint") || 
        (this.geometryType === "esriGeometryMultipoint")
      ) {
        this.latticeTiling = false;
      }
      
      // properties added since server 10.1
      this.indexedFields = response.indexedFields;
      this.maxRecordCount = response.maxRecordCount;
      this.canModifyLayer = response.canModifyLayer;
      this.supportsStatistics = response.supportsStatistics;
      this.supportsAdvancedQueries = response.supportsAdvancedQueries;
      this.hasLabels = response.hasLabels;
      this.canScaleSymbols = response.canScaleSymbols;
      this.supportsRollbackOnFailure = response.supportsRollbackOnFailure;
      this.syncCanReturnChanges = response.syncCanReturnChanges;
      this.isDataVersioned = response.isDataVersioned;
      this.editFieldsInfo = response.editFieldsInfo;
      this.ownershipBasedAccessControlForFeatures = response.ownershipBasedAccessControlForFeatures;
      if (this.editFieldsInfo && this.ownershipBasedAccessControlForFeatures) {
        this.creatorField = this.editFieldsInfo.creatorField;
      }
      this.relationships = response.relationships;
      this.allowGeometryUpdates = esri._isDefined(response.allowGeometryUpdates) ? response.allowGeometryUpdates : true;
      
      this._isTable = (this.type === "Table");
      
      // TODO
      // This is related to adding a FL as the base map layer. There
      // are some difficulties in _addLayerHandler in map code.
      //this.spatialReference = this.fullExtent.spatialReference;
      
      // fields
      var fieldObjs = (this.fields = []),
          fields = response.fields, i;
      
      for (i = 0; i < fields.length; i++) {
        fieldObjs.push(new esri.layers.Field(fields[i]));
      }
      
      // determine object id field for this layer
      if (!this.objectIdField) {
        /*if (this._collection) {
          this.objectIdField = "__object__id__";
        }
        else {*/
          this.objectIdField = response.objectIdField;
          if (!this.objectIdField) {
            // identify the field that provides unique id for the features in the layer
            fields = response.fields;
            for (i = 0; i < fields.length; i++) {
              var field = fields[i];
              if (field.type === "esriFieldTypeOID") {
                this.objectIdField = field.name;
                break;
              }
            }
          }
        //}
        
        if (!this.objectIdField) {
          console.debug("esri.layers.FeatureLayer: " + esri.substitute({ url: this.url }, esri.bundle.layers.FeatureLayer.noOIDField));
        }
      }

      if (!esri._isDefined(this._nextId)) {
        // Let's determine the oid that we need to use if a feature
        // is added
        var oidField = this.objectIdField, maxId = -1;
        if (this._collection && oidField) {
          var fset = this._featureSet, 
              features = fset && fset.features, 
              il = features ? features.length : 0, oid, attr;
          
          // find the max of existing oids
          for (i = 0; i < il; i++) {
            attr = features[i].attributes;
            oid = attr && attr[oidField];
    
            if (oid > maxId) {
              maxId = oid;
            }
          }
        }
        
        this._nextId = /*(maxId === -1) ? this._getUniqueId() :*/ (maxId + 1);
      }
      
      this.globalIdField = response.globalIdField;
      
      var fieldName = (this.typeIdField = response.typeIdField), fieldInfo;

      // Fix typeIdField if necessary - it's known to have different case
      // compared to this.fields
      if (fieldName) {
        fieldInfo = !this._getField(fieldName) && this._getField(fieldName, true);
        
        if (fieldInfo) {
          this.typeIdField = fieldInfo.name;
        }
      }
      
      // webmap spec
      this.visibilityField = response.visibilityField;
      
      // default symbol
      var symbol = response.defaultSymbol;

      if (symbol) {
        this.defaultSymbol = esri.symbol.fromJson(symbol);
      }
      
      // sub-types
      var typeObjs = this.types = [],
          types = response.types,
          fType, fTemplates, protoAttributes,
          fieldsInfo = this.editFieldsInfo, 
          creatorField = fieldsInfo && fieldsInfo.creatorField,
          editorField = fieldsInfo && fieldsInfo.editorField,
          fix = (creatorField || editorField), fixList = [];
          
      if (types) {
        for (i = 0; i < types.length; i++) {
          fType = new esri.layers.FeatureType(types[i]);
          
          fTemplates = fType.templates;
          if (fix && fTemplates && fTemplates.length) {
            fixList = fixList.concat(fTemplates);
          }
          
          typeObjs.push(fType);
        }
      }
      
      // templates for the layer
      var templates = response.templates, template,
          templateObjs = this.templates = [];
          
      if (templates) {
        for (i = 0; i < templates.length; i++) {
          template = new esri.layers.FeatureTemplate(templates[i]);
          
          if (fix) {
            fixList.push(template);
          }
          
          templateObjs.push(template);
        }
      }
      
      // Fix 10.1 server bug where prototypes contain null values for 
      // creator and editor fields. null values have special meaning as
      // userIds and hence should not be returned with prototypes
      // Server CR 222052 (Prototype feature should not return the read-only fields) 
      // for this issue is scheduled to be fixed in 10.1 SP1
      for (i = 0; i < fixList.length; i++) {
        protoAttributes = dojo.getObject("prototype.attributes", false, fixList[i]);

        if (protoAttributes) {
          if (creatorField) {
            delete protoAttributes[creatorField];
          }
          if (editorField) {
            delete protoAttributes[editorField];
          }
        }
      }
      
      // the layer is time aware if it has time info
      var timeInfo = response.timeInfo;
      if (timeInfo) {
        this.timeInfo = new esri.layers.TimeInfo(timeInfo);
        this._startTimeField = timeInfo.startTimeField;
        this._endTimeField = timeInfo.endTimeField;
        if (this._startTimeField && this._endTimeField) {
          this._twoTimeFields = true;
        }
        
        if (this._trackIdField) {
          timeInfo.trackIdField = this._trackIdField;
        }
        else {
          this._trackIdField = timeInfo.trackIdField;
        }
      }
      
      this.hasAttachments = (!this._collection && response.hasAttachments) ? true : false;
      this.htmlPopupType = response.htmlPopupType;

      var drawingInfo = response.drawingInfo, renderer;      
      if (!this.renderer) {
        
        if (drawingInfo && drawingInfo.renderer) {
          renderer = drawingInfo.renderer;
          this.setRenderer(esri.renderer.fromJson(renderer));
          if (renderer.type === "classBreaks") {
            this.renderer._setMaxInclusiveness(true);
          }
          
          // translate relative image resources defined in pms/pfs to absolute paths
          // see - http://nil/rest-docs/msimage.html
          if (!this._collection) {
            
            var rendererType = renderer.type, symbols = [];
            renderer = this.renderer;
            
            switch(rendererType) {
              case "simple":
                symbols.push(renderer.symbol);
                break;
              case "uniqueValue":
              case "classBreaks":
                symbols.push(renderer.defaultSymbol);
                symbols = symbols.concat(dojo.map(renderer.infos, function(info) {
                  return info.symbol;
                }));
                break;
            } // switch
            
            symbols = dojo.filter(symbols, esri._isDefined);
            
            var baseUrl = this._url.path + "/images/", token = this._getToken();
            dojo.forEach(symbols, function(sym) {
              var url = sym.url;
              if (url) {
                // translate relative image resources defined in pms/pfs to absolute paths
                if ( (url.search(/https?\:/) === -1) && (url.indexOf("data:") === -1) ) {
                  sym.url = baseUrl + url;
                }
                //console.log(sym.url);
                
                // append token
                if (token && sym.url.search(/https?\:/) !== -1) {
                  sym.url += ("?token=" + token);
                }
              }
            });
            
          } // not a collection
        }
        else if (symbol) { // default symbol defined in the layer resource
          types = this.types;
          if (types.length > 0) {
            renderer = new esri.renderer.UniqueValueRenderer(this.defaultSymbol, this.typeIdField);
            
            dojo.forEach(types, function(type) {
              renderer.addValue(type.id, type.symbol);
            });
          }
          else {
            renderer = new esri.renderer.SimpleRenderer(this.defaultSymbol);
          }
          
          this.setRenderer(renderer);
        }
        else if (!this._isTable) { // fallback
          var fallbackSymbol;
          switch(this.geometryType) {
            case "esriGeometryPoint":
            case "esriGeometryMultipoint":
              fallbackSymbol = new esri.symbol.SimpleMarkerSymbol();
              break;
            case "esriGeometryPolyline":
              fallbackSymbol = new esri.symbol.SimpleLineSymbol();
              break;
            case "esriGeometryPolygon":
              fallbackSymbol = new esri.symbol.SimpleFillSymbol();
              break;
          }
          
          this.setRenderer(fallbackSymbol ? new esri.renderer.SimpleRenderer(fallbackSymbol) : null);
        }
      } // renderer
      
      // layer transparency
      var transparency = (drawingInfo && drawingInfo.transparency) || 0 ;
      if (!esri._isDefined(this.opacity) && transparency > 0) {
        this.opacity = 1 - (transparency / 100);
      }
    
//      // initialize the "mode" with layer info
//      var mode = this._mode;
//      if (mode) {
//        mode.layerInfoHandler(response);
//      }

      // REST added currentVersion property to some resources
      // at 10 SP1
      this.version = response.currentVersion;
      
      if (!this.version) {
        var ver;
        
        if (
          "capabilities" in response || "drawingInfo" in response || 
          "hasAttachments" in response || "htmlPopupType" in response || 
          "relationships" in response || "timeInfo" in response || 
          "typeIdField" in response || "types" in response 
        ) {
          ver = 10;
        }
        else {
          ver = 9.3; // or could be 9.3.1
        }
        
        this.version = ver;
      } // version
      
      if ((dojo.isIE || dojo.isSafari) && this.isEditable() && this.version < 10.02) {
        this._ts = true;
      }
      
      // announce "loaded", imples ready to be added to the map
      this.loaded = true;
      
      this._fixRendererFields();
      this._checkFields();
      this._updateCaps();

      if (this._collection) {
        this._fireUpdateStart();
        
        var featureSet = this._featureSet;
        delete this._featureSet;
        
        this._mode._drawFeatures(new esri.tasks.FeatureSet(featureSet));
        this._fcAdded = true;
      }

      this.onLoad(this);
      var callback = this._loadCallback;
      if (callback) {
        delete this._loadCallback;
        callback(this);
      }
    }
  },
    
  // (extend)
  setRenderer: function(ren) {
    this.inherited("setRenderer", arguments);
    
    var renderer = this.renderer;
    if (renderer) {
      this._ager = (renderer.declaredClass.indexOf("TemporalRenderer") !== -1 && renderer.observationAger && renderer.observationRenderer);
      
      var renderers = dojo.filter([
        renderer, renderer.observationRenderer, 
        renderer.latestObservationRenderer, renderer.trackRenderer
      ], esri._isDefined);
      
      var fields = [];
      dojo.forEach(renderers, function(rnd) {
        fields.push(rnd.attributeField);
        fields.push(rnd.attributeField2);
        fields.push(rnd.attributeField3);
      }, this);
      this._rendererFields = dojo.filter(fields, esri._isDefined);
    } 
    else {
      this._ager = false;
      this._rendererFields = [];
    }
    
    if (this.loaded && this._rendererFields.length > 0) {
      this._fixRendererFields();
      this._checkFields(this._rendererFields);
    }

    if (this.loaded && this._collection) {
      // we want to write out the renderer in toJson()
      this._typesDirty = true;
    }
  },

  // (extend)
  _setMap: function(map, surface) {
    this._map = map;

    // if the layer is time-aware, listen for changes in time extent
    this._toggleTime(true);
    
    // invoke superclass version of this method
    var div = this.inherited("_setMap", arguments);
    
    this.clearSelection(); // flush out features brought down before being added to the map
    
    // do we have a temporal renderer?
    var renderer = this.renderer;
    /*if (renderer) {
      this._ager = (renderer.declaredClass.indexOf("TemporalRenderer") !== -1 && renderer.observationAger);
      
      //this._rendererAttrField = renderer.observationRenderer ? renderer.observationRenderer.attributeField : renderer.attributeField;
      
      var renderers = dojo.filter([
        renderer, renderer.observationRenderer, 
        renderer.latestObservationRenderer, renderer.trackRenderer
      ], esri._isDefined);
      
      var fields = [];
      dojo.forEach(renderers, function(rnd) {
        fields.push(rnd.attributeField);
        fields.push(rnd.attributeField2);
        fields.push(rnd.attributeField3);
      });
      this._rendererFields = dojo.filter(fields, esri._isDefined);
    } 
    
    this._checkFields();*/
    
    if (this.timeInfo) {
      // tracking management
      if (this._trackIdField || ( renderer && (renderer.latestObservationRenderer || renderer.trackRenderer) )) {
        this._trackManager = new esri.layers._TrackManager(this);
        this._trackManager.initialize(map);
      }
    }
    
    /*// listen for map zoom to act on scale dependency
    //this.minScale = 0; this.maxScale = 44000;
    if (this.minScale !== 0 || this.maxScale !== 0) {
      this._zoomConnect = dojo.connect(map, "onZoomEnd", this, this._updateStatus);
      //this._zoomHandler();
    }*/
   
    // listen for map zoom end to act on scale dependency and auto-generalization
    this._zoomConnect = dojo.connect(map, "onZoomEnd", this, this._zoomHandler);
    this._zoomHandler();
   
    //this.setScaleRange(this.minScale, this.maxScale);
    
    // initialize the "mode" with map
    var mode = this._mode;
    if (mode) {
      mode.initialize(map);
    }
    
    return div;
  },
  
  // (extend)
  _unsetMap: function(map, surface) {
    var mode = this._mode;
    if (mode) {
      mode.destroy();
      this._mode = null;
    }
    if (this._trackManager) {
      this._trackManager.destroy();
      this._trackManager = null;
    }
    dojo.disconnect(this._zoomConnect);
    this._zoomConnect = null;
    this._toggleTime(false);
    this.inherited("_unsetMap", arguments);
  },
  
//  // (override)
//  add: function(graphic) {
//    graphic.attributes = graphic.attributes || {};
//    var attributes = graphic.attributes, oidField = this.objectIdField;
//    if (/*!attributes ||*/ !attributes[oidField]) { // brand new feature
//      this._registerNew(graphic);
//      return this._add(graphic);
//    }
//    else { // feature that was previously removed (known to feature layer)
//      this._unRegisterDelete(graphic);
//      this._mode.drawFeature(graphic);
//      return graphic;
//    }
//  },
//  
//  // (override)
//  remove: function(graphic) {
//    var attributes = graphic.attributes, oidField = this.objectIdField;
//    if (/*!attributes ||*/ !attributes[oidField]) { // brand new feature previously added
//      this._unRegisterNew(graphic);
//      
//      // unselect
//      this._unSelectNewFeature(graphic);
//      
//      return this._remove(graphic);
//    }
//    else { // existing feature (known to feature layer)
//      this._registerDelete(graphic);
//      
//      var oid = attributes[oidField], mode = this._mode;
//      
//      // unselect
//      this._unSelectFeatureIIf(oid, mode);
//      
//      // remove
//      graphic._count = 0;
//      return mode._removeFeatureIIf(oid);
//    }
//  },

  // (incompatible override)
  refresh: function() {
    // Lose all the features and fetch them again 
    // from the server
    var mode = this._mode;
    if (mode) {
      mode.refresh();
    }
  },
  
  /*****************
   * Public Methods
   *****************/
  
  setEditable: function(/*Boolean*/ editable) {
    // Currently supported for by-value layers only
    if (!this._collection) {
      console.log("FeatureLayer:setEditable - this functionality is not yet supported for layer in a feature service");
      return this;
    }
    
    if (!this.loaded) {
      // Just record user's choice and leave. We'll process them
      // when the layer has loaded
      this._optEditable = editable;
      return this;
    }
    
    var previousState = this._editable;
    this._editable = editable;
    this._updateCaps();
    
    if (previousState !== editable) {
      this.onCapabilitiesChange();
    }
    return this;
  },
  
  getEditCapabilities: function(options) {
    /*
      // Tests:
      (function() {
      
      var scope = {
            loaded: false, _editable: null,
            capabilities: null,
            editFieldsInfo: null,
            ownershipBasedAccessControlForFeatures: null,
            getUserId: esri.layers.FeatureLayer.prototype.getUserId,
            isEditable: esri.layers.FeatureLayer.prototype.isEditable
          }, 
          fieldsInfo = { creatorField: "creator" },
          othersTT = { allowUpdateToOthers: true, allowDeleteToOthers: true },
          othersFF = { allowUpdateToOthers: false, allowDeleteToOthers: false },
          othersTF = { allowUpdateToOthers: true, allowDeleteToOthers: false },
          othersFT = { allowUpdateToOthers: false, allowDeleteToOthers: true };
      
      var FFF = '{"canCreate":false,"canUpdate":false,"canDelete":false}',
          TTT = '{"canCreate":true,"canUpdate":true,"canDelete":true}',
          TFF = '{"canCreate":true,"canUpdate":false,"canDelete":false}',
          FTF = '{"canCreate":false,"canUpdate":true,"canDelete":false}',
          FFT = '{"canCreate":false,"canUpdate":false,"canDelete":true}',
          TTF = '{"canCreate":true,"canUpdate":true,"canDelete":false}',
          FTT = '{"canCreate":false,"canUpdate":true,"canDelete":true}',
          TFT = '{"canCreate":true,"canUpdate":false,"canDelete":true}',
          T = true,
          F = false;
      
      var fUserA = { attributes: { creator: "UserA" } },
          fUserB = { attributes: { creator: "UserB" } },
          fUserAnonymous = { attributes: { creator: "" } },
          fUserNull = { attributes: { creator: null } },
          fNoAttr = {},
          fNoField = { attributes: {} },
          opts = {}, result;
      
      ////////// Layer level capabilities //////////
      console.log("Layer level capabilities");
      
      scope.loaded = F; scope._editable = F;
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("1. " + (result === FFF));

      scope.loaded = T; scope._editable = F;
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("2. " + (result === FFF));

      scope.loaded = T; scope._editable = F;
      scope.userIsAdmin = true;
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("2.1. " + (result === TTT));
      scope.userIsAdmin = undefined;

      scope.loaded = T; scope._editable = T;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("3. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("4. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("5. " + (result === FTF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("6. " + (result === FFT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("7. " + (result === TTF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("8. " + (result === TFT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("9. " + (result === FTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("10. " + (result === TTT));
      
      console.log("Layer level capabilities, loggedInUser: IS-ADMIN");
      scope.userIsAdmin = true;
      
      scope.capabilities = "Map,Query";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("2. " + (result === TTT));
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("3. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("4. " + (result === TTT));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("5. " + (result === TTT));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("6. " + (result === TTT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("7. " + (result === TTT));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("8. " + (result === TTT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("9. " + (result === TTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("10. " + (result === TTT));
      
      scope.userIsAdmin = undefined;
      
      console.log("Layer level capabilities, feature Y");
      opts.feature = fUserA;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("11. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("12. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("13. " + (result === FTF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("14. " + (result === FFT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("15. " + (result === TTF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("16. " + (result === TFT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("17. " + (result === FTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("18. " + (result === TTT));
      
      scope.userIsAdmin = true;
      console.log("Layer level capabilities, loggedInUser: IS-ADMIN, feature Y");
      opts.feature = fUserA;
      
      scope.capabilities = "Map,Query";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("10. " + (result === TTT));
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("11. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("12. " + (result === TTT));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("13. " + (result === TTT));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("14. " + (result === TTT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("15. " + (result === TTT));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("16. " + (result === TTT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("17. " + (result === TTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("18. " + (result === TTT));
      
      scope.userIsAdmin = undefined;
    
      ////////// LoggedInUser = Creator //////////
      
      opts.userId = "UserA";
      opts.feature = fUserA;
    
      console.log("LoggedInUser = Creator, No Access Control");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = null;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("1. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("2. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("3. " + (result === FTF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("4. " + (result === FFT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("5. " + (result === TTF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("6. " + (result === TFT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("7. " + (result === FTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("8. " + (result === TTT));
    
      console.log("LoggedInUser = Creator, AccessControl = othersFF");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = othersFF;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("9. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("10. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("11. " + (result === FTF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("12. " + (result === FFT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("13. " + (result === TTF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("14. " + (result === TFT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("15. " + (result === FTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("16. " + (result === TTT));
    
      opts.userId = "UserA";
      opts.feature = fUserAnonymous;
      console.log("LoggedInUser = Creator, Feature owned by ANONYMOUS, AccessControl = othersFF");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = othersFF;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("17. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("18. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("19. " + (result === FTF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("20. " + (result === FFT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("21. " + (result === TTF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("22. " + (result === TFT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("23. " + (result === FTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("24. " + (result === TTT));
    
      ////////// LoggedInUser !== Creator //////////
      
      opts.userId = "UserA";
      opts.feature = fUserB;
    
      console.log("LoggedInUser !== Creator, No Access Control");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = null;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("1. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("2. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("3. " + (result === FTF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("4. " + (result === FFT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("5. " + (result === TTF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("6. " + (result === TFT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("7. " + (result === FTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("8. " + (result === TTT));
    
      console.log("LoggedInUser !== Creator, AccessControl = othersFF");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = othersFF;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("9. " + (result === TFF));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("10. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("11. " + (result === FFF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("12. " + (result === FFF));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("13. " + (result === TFF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("14. " + (result === TFF));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("15. " + (result === FFF));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("16. " + (result === TFF));
    
      scope.userIsAdmin = true;
      console.log("LoggedInUser !== Creator, LoggedInUser: IS-ADMIN, AccessControl = othersFF");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = othersFF;
      
      scope.capabilities = "Map,Query";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("8. " + (result === TTT));
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("9. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("10. " + (result === TTT));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("11. " + (result === TTT));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("12. " + (result === TTT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("13. " + (result === TTT));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("14. " + (result === TTT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("15. " + (result === TTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("16. " + (result === TTT));

      scope.userIsAdmin = undefined;
    
      console.log("LoggedInUser !== Creator, AccessControl = othersTT");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = othersTT;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("17. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("18. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("19. " + (result === FTF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("20. " + (result === FFT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("21. " + (result === TTF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("22. " + (result === TFT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("23. " + (result === FTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("24. " + (result === TTT));
    
      console.log("LoggedInUser !== Creator, AccessControl = othersTF");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = othersTF;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("25. " + (result === TTF));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("26. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("27. " + (result === FTF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("28. " + (result === FFF));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("29. " + (result === TTF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("30. " + (result === TFF));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("31. " + (result === FTF));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("32. " + (result === TTF));
    
      console.log("LoggedInUser !== Creator, AccessControl = othersFT");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = othersFT;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("33. " + (result === TFT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("34. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("35. " + (result === FFF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("36. " + (result === FFT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("37. " + (result === TFF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("38. " + (result === TFT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("39. " + (result === FFT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("40. " + (result === TFT));
      
      ////////// NO LoggedInUser //////////

      opts.userId = "";
      opts.feature = fUserB;
    
      console.log("NO LoggedInUser, AccessControl = othersTT");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = othersTT;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("1. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("2. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("3. " + (result === FTF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("4. " + (result === FFT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("5. " + (result === TTF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("6. " + (result === TFT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("7. " + (result === FTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("8. " + (result === TTT));
    
      console.log("NO LoggedInUser, AccessControl = othersFF");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = othersFF;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("9. " + (result === TFF));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("10. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("11. " + (result === FFF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("12. " + (result === FFF));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("13. " + (result === TFF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("14. " + (result === TFF));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("15. " + (result === FFF));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("16. " + (result === TFF));

      opts.userId = "";
      opts.feature = fUserNull;
      console.log("NO LoggedInUser, Feature owned by NULL, AccessControl = othersTT");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = othersTT;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("17. " + (result === TTT));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("18. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("19. " + (result === FTF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("20. " + (result === FFT));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("21. " + (result === TTF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("22. " + (result === TFT));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("23. " + (result === FTT));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("24. " + (result === TTT));

      opts.userId = "";
      opts.feature = fUserNull;
      console.log("NO LoggedInUser, Feature owned by NULL, AccessControl = othersFF");
      scope.editFieldsInfo = fieldsInfo;
      scope.ownershipBasedAccessControlForFeatures = othersFF;
      
      scope.capabilities = "Editing";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("25. " + (result === TFF));

      scope.capabilities = "Editing,Create";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("26. " + (result === TFF));

      scope.capabilities = "Editing,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("27. " + (result === FFF));

      scope.capabilities = "Editing,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("28. " + (result === FFF));

      scope.capabilities = "Editing,Create,Update";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("29. " + (result === TFF));

      scope.capabilities = "Editing,Create,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("30. " + (result === TFF));

      scope.capabilities = "Editing,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("31. " + (result === FFF));

      scope.capabilities = "Editing,Create,Update,Delete";
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope, opts));
      console.log("32. " + (result === TFF));
    
      }());
    
      result = dojo.toJson(featureLayer.getEditCapabilities.call(scope));
      console.log("X. " + (result === TTT));
    */
    
    var denyAll = { "canCreate": false, "canUpdate": false, "canDelete": false };
    
    if (!this.loaded || !this.isEditable()) {
      return denyAll;
    }
    
    var feature = options && options.feature, userId = options && options.userId,
        caps = dojo.map((this.capabilities ? this.capabilities.toLowerCase().split(",") : []), dojo.trim),
        layerEditing = dojo.indexOf(caps, "editing") > -1,
        layerCreate = layerEditing && (dojo.indexOf(caps, "create") > -1),
        layerUpdate = layerEditing && (dojo.indexOf(caps, "update") > -1),
        layerDelete = layerEditing && (dojo.indexOf(caps, "delete") > -1),
        accessCtrl = this.ownershipBasedAccessControlForFeatures,
        fieldsInfo = this.editFieldsInfo,
        creatorField = fieldsInfo && fieldsInfo.creatorField,
        realm = fieldsInfo && fieldsInfo.realm,
        attributes = feature && feature.attributes,
        creator = (attributes && creatorField) ? attributes[creatorField] : undefined,
        retVal, userIsAdmin = !!this.userIsAdmin,
        othersCanUpdate = !accessCtrl || userIsAdmin || !!(accessCtrl.allowOthersToUpdate || accessCtrl.allowUpdateToOthers), 
        othersCanDelete = !accessCtrl || userIsAdmin || !!(accessCtrl.allowOthersToDelete || accessCtrl.allowDeleteToOthers);
    
    if (
      userIsAdmin || // arcgis.com use-case
      (layerEditing && !(layerCreate || layerUpdate || layerDelete)) // Pre 10.1 layers
    ) {
      layerCreate = layerUpdate = layerDelete = true;
    }
    
    // Start with what layer allows
    retVal = {
      "canCreate": layerCreate, 
      "canUpdate": layerUpdate, 
      "canDelete": layerDelete 
    };
    
    // Refine retVal based on various available information
    if (creator === null) {
      // Feature created by no one:
      // Can be updated or deleted by "" or "<userId>" if accessCtrl allows
      // "Feature created by null is owned by no one"
      retVal.canUpdate = layerUpdate && othersCanUpdate;
      retVal.canDelete = layerDelete && othersCanDelete;
    }
    else if (creator === "") {
      // Feature created by an anonymous user:
      // Use layer's capabilities.
      // "Feature created by anonymous users is owned by everyone"
      return retVal;
    }
    else if (creator) {
      // userId can only be "" or "<userId>". You cannot login as null.
      userId = userId || this.getUserId();
      
      if (userId && realm) {
        userId = userId + "@" + realm;
        
        // Note that realm will not be appended to anonymous users 
        // (i.e. <empty-string> values) either
      }

      if (userId.toLowerCase() === creator.toLowerCase()) {
        // Logged in user is the owner
        return retVal;
      }
      else {
        // Logged in user is NOT the owner
        // Or, user is not logged in at all (anonymous) 
        retVal.canUpdate = layerUpdate && othersCanUpdate;
        retVal.canDelete = layerDelete && othersCanDelete;
      }
    }
    
    return retVal;
  },
  
  getUserId: function() {
    var userId;
    
    if (this.loaded) {
      userId = (this.credential && this.credential.userId) || this.userId || "";
    }

    return userId;
  },
  
  setUserIsAdmin: function(isAdmin) {
    // This information will be factored in within the getEditCapabilities
    // logic above - so that widgets and other consuming code can allow or
    // disallow certain editing tools.
    // It is assumed that the calling code "somehow" determined that the 
    // logged in user is someone who owns this layer i.e. an "admin" in 
    // arcgis.com context
    this.userIsAdmin = isAdmin;
  },
  
  setEditSummaryCallback: function(callback) {
    this.editSummaryCallback = callback;
  },
  
  getEditSummary: function(feature, options, /*For Testing Only*/ currentTime) {
    // Requirements driven by arcgis.com
    // Example:
    //   Edited by Mikem on 2/1/2012 at 3:28 PM
    //   Edited by MWaltuch on Tuesday at 1:20 PM
    //   Created by mapper on Wednesday at 1:20 PM
    // Action: 
    //   Edited
    //   Created
    // Name: 
    //   by <userId>
    // Date/Time:
    //   0 - less than   1 min:   "seconds ago"
    //   1 - less than   2 mins:  "a minute ago"
    //   2 - less than  60 mins:  "<n> minutes ago" (round down)
    //  60 - less than 120 mins:  "an hour ago"
    //   2 - less than  24 hours: "<n> hours ago" (round down)
    //   1 - less than   7 days:  "on <day of the week> at <time>"
    //   Equals or greater than 7 days: "on <date> at <time>"

    /*
      // Tests:
      (function() {
      
      var scope = {
            loaded: false,
            editFieldsInfo: null,
            getEditInfo: esri.layers.FeatureLayer.prototype.getEditInfo,
            _getEditData: esri.layers.FeatureLayer.prototype._getEditData
          }, 
          testFunc = esri.layers.FeatureLayer.prototype.getEditSummary,
          infoA = { creatorField: "creator", creationDateField: "creationDate", editorField: "editor", editDateField: "editDate" }, 
          infoB = { creatorField: "creator", editorField: "editor" }, 
          infoC = { creationDateField: "creationDate", editDateField: "editDate" }, 
          infoD = { creatorField: "creator", creationDateField: "creationDate" }, 
          infoE = { editorField: "editor", editDateField: "editDate" }, 
          infoF = { creatorField: "creator" }, 
          infoG = { editorField: "editor" }, 
          infoH = { creationDateField: "creationDate" }, 
          infoI = { editDateField: "editDate" };
      
      var noAttr = {},
          emptyAttr = { attributes: {} },
          attrA1 = { attributes: { creator: "UserA", creationDate: 0 } },
          attrA2 = { attributes: { creator: "UserA", creationDate: 0, editor: "UserB", editDate: 1 } },
          attrB1 = { attributes: { creator: "UserA" } },
          attrB2 = { attributes: { creator: "UserA", editor: "UserB" } },
          attrC1 = { attributes: { creationDate: 0 } },
          attrC2 = { attributes: { creationDate: 0, editDate: 1 } },
          attrD = { attributes: { creator: "UserA", creationDate: 0 } },
          attrE = { attributes: { editor: "UserB", editDate: 1 } },
          attrF = { attributes: { creator: "UserA" } },
          attrG = { attributes: { editor: "UserB" } },
          attrH = { attributes: { creationDate: 0 } },
          attrI = { attributes: { editDate: 1 } };
      
      var printFunc = function(testNum, check, result) {
        console[check ? "log" : "error"](testNum + check + " - " + result + (result ? (" - " + esri.bundle.layers.FeatureLayer[result]) : "") );
      };
      
      var wrapper = function(testNum, attr, currentTime, expectedResult1, expectedResult2, expectedResult3) {
        var result;
        
        result = testFunc.call(scope, attr, null, currentTime);
        printFunc(testNum + "a. ", (result === expectedResult1), result);
        
        result = testFunc.call(scope, attr, { action: "creation" }, currentTime);
        printFunc(testNum + "b. ", (result === expectedResult2), result);

        result = testFunc.call(scope, attr, { action: "edit" }, currentTime);
        printFunc(testNum + "c. ", (result === expectedResult3), result);

        result = testFunc.call(scope, attr, { 
          callback: function(feature, info) {} 
        }, currentTime);
        printFunc(testNum + "d. ", (result === ""), result);

        result = testFunc.call(scope, attr, { 
          callback: function(feature, info) {
            return "<testing callback>";
          } 
        }, currentTime);
        printFunc(testNum + "e. ", (result === "<testing callback>"), result);

        scope.editSummaryCallback = function(feature, info) {
          return "<testing callback>";
        };
        result = testFunc.call(scope, attr, currentTime);
        printFunc(testNum + "f. ", (result === "<testing callback>"), result);
        scope.editSummaryCallback = null;

        result = testFunc.call(scope, attr, { 
          callback: function(feature, info) {
            if (info && (info.displayPattern === "Full")) {
              info.displayPattern = "WeekDay";
            }
            return info;
          } 
        }, currentTime);
        var exp = ( 
                    expectedResult1.indexOf("Full") > -1 ? 
                    expectedResult1.replace("Full", "WeekDay") : 
                    expectedResult1 
                   );
        printFunc(testNum + "g. ", (result === exp), result);
      };
      
      scope.loaded = false;
      console.log("0. " + (testFunc.call(scope, emptyAttr) === ""));
          
      scope.loaded = true;
      console.log("0. " + (testFunc.call(scope, emptyAttr) === ""));
      
      scope.editFieldsInfo = infoA;
      
      attrA1.attributes.creationDate = -40000;
      wrapper(1, attrA1, 0, "createUserSeconds", "createUserSeconds", "");
      attrA1.attributes.creationDate = -80000;
      wrapper(2, attrA1, 0, "createUserMinute", "createUserMinute", "");
      attrA1.attributes.creationDate = -3000000;
      wrapper(3, attrA1, 0, "createUserMinutes", "createUserMinutes", "");
      attrA1.attributes.creationDate = -2 * 3000000;
      wrapper(4, attrA1, 0, "createUserHour", "createUserHour", "");
      attrA1.attributes.creationDate = -24 * 3000000;
      wrapper(5, attrA1, 0, "createUserHours", "createUserHours", "");
      attrA1.attributes.creationDate = -7 * 24 * 3000000;
      wrapper(6, attrA1, 0, "createUserWeekDay", "createUserWeekDay", "");
      attrA1.attributes.creationDate = -14 * 24 * 3000000;
      wrapper(7, attrA1, 0, "createUserFull", "createUserFull", "");
      
      attrA2.attributes.editDate = attrA2.attributes.creationDate = -40000;
      wrapper(8, attrA2, 0, "editUserSeconds", "createUserSeconds", "editUserSeconds");
      attrA2.attributes.editDate = attrA2.attributes.creationDate = -80000;
      wrapper(9, attrA2, 0, "editUserMinute", "createUserMinute", "editUserMinute");
      attrA2.attributes.editDate = attrA2.attributes.creationDate = -3000000;
      wrapper(10, attrA2, 0, "editUserMinutes", "createUserMinutes", "editUserMinutes");
      attrA2.attributes.editDate = attrA2.attributes.creationDate = -2 * 3000000;
      wrapper(11, attrA2, 0, "editUserHour", "createUserHour", "editUserHour");
      attrA2.attributes.editDate = attrA2.attributes.creationDate = -24 * 3000000;
      wrapper(12, attrA2, 0, "editUserHours", "createUserHours", "editUserHours");
      attrA2.attributes.editDate = attrA2.attributes.creationDate = -7 * 24 * 3000000;
      wrapper(13, attrA2, 0, "editUserWeekDay", "createUserWeekDay", "editUserWeekDay");
      attrA2.attributes.editDate = attrA2.attributes.creationDate = -14 * 24 * 3000000;
      wrapper(14, attrA2, 0, "editUserFull", "createUserFull", "editUserFull");
      
      scope.editFieldsInfo = infoB;
      wrapper(15, attrB1, 0, "createUser", "createUser", "");
      wrapper(16, attrB2, 0, "editUser", "createUser", "editUser");
      
      scope.editFieldsInfo = infoC;
      
      attrC1.attributes.creationDate = -40000;
      wrapper(17, attrC1, 0, "createSeconds", "createSeconds", "");
      attrC1.attributes.creationDate = -80000;
      wrapper(18, attrC1, 0, "createMinute", "createMinute", "");
      attrC1.attributes.creationDate = -3000000;
      wrapper(19, attrC1, 0, "createMinutes", "createMinutes", "");
      attrC1.attributes.creationDate = -2 * 3000000;
      wrapper(20, attrC1, 0, "createHour", "createHour", "");
      attrC1.attributes.creationDate = -24 * 3000000;
      wrapper(21, attrC1, 0, "createHours", "createHours", "");
      attrC1.attributes.creationDate = -7 * 24 * 3000000;
      wrapper(22, attrC1, 0, "createWeekDay", "createWeekDay", "");
      attrC1.attributes.creationDate = -14 * 24 * 3000000;
      wrapper(23, attrC1, 0, "createFull", "createFull", "");
      
      attrC2.attributes.editDate = attrC2.attributes.creationDate = -40000;
      wrapper(24, attrC2, 0, "editSeconds", "createSeconds", "editSeconds");
      attrC2.attributes.editDate = attrC2.attributes.creationDate = -80000;
      wrapper(25, attrC2, 0, "editMinute", "createMinute", "editMinute");
      attrC2.attributes.editDate = attrC2.attributes.creationDate = -3000000;
      wrapper(26, attrC2, 0, "editMinutes", "createMinutes", "editMinutes");
      attrC2.attributes.editDate = attrC2.attributes.creationDate = -2 * 3000000;
      wrapper(27, attrC2, 0, "editHour", "createHour", "editHour");
      attrC2.attributes.editDate = attrC2.attributes.creationDate = -24 * 3000000;
      wrapper(28, attrC2, 0, "editHours", "createHours", "editHours");
      attrC2.attributes.editDate = attrC2.attributes.creationDate = -7 * 24 * 3000000;
      wrapper(29, attrC2, 0, "editWeekDay", "createWeekDay", "editWeekDay");
      attrC2.attributes.editDate = attrC2.attributes.creationDate = -14 * 24 * 3000000;
      wrapper(30, attrC2, 0, "editFull", "createFull", "editFull");
      
      scope.editFieldsInfo = infoD;
      
      attrD.attributes.creationDate = -40000;
      wrapper(31, attrD, 0, "createUserSeconds", "createUserSeconds", "");
      attrD.attributes.creationDate = -80000;
      wrapper(32, attrD, 0, "createUserMinute", "createUserMinute", "");
      attrD.attributes.creationDate = -3000000;
      wrapper(33, attrD, 0, "createUserMinutes", "createUserMinutes", "");
      attrD.attributes.creationDate = -2 * 3000000;
      wrapper(34, attrD, 0, "createUserHour", "createUserHour", "");
      attrD.attributes.creationDate = -24 * 3000000;
      wrapper(35, attrD, 0, "createUserHours", "createUserHours", "");
      attrD.attributes.creationDate = -7 * 24 * 3000000;
      wrapper(36, attrD, 0, "createUserWeekDay", "createUserWeekDay", "");
      attrD.attributes.creationDate = -14 * 24 * 3000000;
      wrapper(37, attrD, 0, "createUserFull", "createUserFull", "");
      
      scope.editFieldsInfo = infoE;
      
      attrE.attributes.editDate = -40000;
      wrapper(38, attrE, 0, "editUserSeconds", "", "editUserSeconds");
      attrE.attributes.editDate = -80000;
      wrapper(39, attrE, 0, "editUserMinute", "", "editUserMinute");
      attrE.attributes.editDate = -3000000;
      wrapper(40, attrE, 0, "editUserMinutes", "", "editUserMinutes");
      attrE.attributes.editDate = -2 * 3000000;
      wrapper(41, attrE, 0, "editUserHour", "", "editUserHour");
      attrE.attributes.editDate = -24 * 3000000;
      wrapper(42, attrE, 0, "editUserHours", "", "editUserHours");
      attrE.attributes.editDate = -7 * 24 * 3000000;
      wrapper(43, attrE, 0, "editUserWeekDay", "", "editUserWeekDay");
      attrE.attributes.editDate = -14 * 24 * 3000000;
      wrapper(44, attrE, 0, "editUserFull", "", "editUserFull");
      
      scope.editFieldsInfo = infoF;
      wrapper(45, attrF, 0, "createUser", "createUser", "");
      
      scope.editFieldsInfo = infoG;
      wrapper(46, attrG, 0, "editUser", "", "editUser");
                
      scope.editFieldsInfo = infoH;
      
      attrH.attributes.creationDate = -40000;
      wrapper(47, attrH, 0, "createSeconds", "createSeconds", "");
      attrH.attributes.creationDate = -80000;
      wrapper(48, attrH, 0, "createMinute", "createMinute", "");
      attrH.attributes.creationDate = -3000000;
      wrapper(49, attrH, 0, "createMinutes", "createMinutes", "");
      attrH.attributes.creationDate = -2 * 3000000;
      wrapper(50, attrH, 0, "createHour", "createHour", "");
      attrH.attributes.creationDate = -24 * 3000000;
      wrapper(51, attrH, 0, "createHours", "createHours", "");
      attrH.attributes.creationDate = -7 * 24 * 3000000;
      wrapper(52, attrH, 0, "createWeekDay", "createWeekDay", "");
      attrH.attributes.creationDate = -14 * 24 * 3000000;
      wrapper(53, attrH, 0, "createFull", "createFull", "");
      
      scope.editFieldsInfo = infoI;
      
      attrI.attributes.editDate = -40000;
      wrapper(54, attrI, 0, "editSeconds", "", "editSeconds");
      attrI.attributes.editDate = -80000;
      wrapper(55, attrI, 0, "editMinute", "", "editMinute");
      attrI.attributes.editDate = -3000000;
      wrapper(56, attrI, 0, "editMinutes", "", "editMinutes");
      attrI.attributes.editDate = -2 * 3000000;
      wrapper(57, attrI, 0, "editHour", "", "editHour");
      attrI.attributes.editDate = -24 * 3000000;
      wrapper(58, attrI, 0, "editHours", "", "editHours");
      attrI.attributes.editDate = -7 * 24 * 3000000;
      wrapper(59, attrI, 0, "editWeekDay", "", "editWeekDay");
      attrI.attributes.editDate = -14 * 24 * 3000000;
      wrapper(60, attrI, 0, "editFull", "", "editFull");

      }());
    */
    
    currentTime = esri._isDefined(currentTime) ? currentTime : (new Date()).getTime();

    var summary = "", info = this.getEditInfo(feature, options, currentTime),
        callback = (options && options.callback) || this.editSummaryCallback;
    
    // Callback support for developer customization
    if (callback) {
      info = callback(feature, info) || "";
      
      // callback function may return one of the following:
      // - "info" object with modified properties
      // - final "summary" string (callback should take care of localization if needed)
      // - null/undefined/"" implying empty string
    }
    
    if (dojo.isString(info)) {
      summary = info;
    }
    else {
      if (info) {
        var action = info.action, userId = info.userId, timeValue = info.timeValue,
            count = 0;
        
        // How many display components do we have?
        if (action) { count++; }
        if (userId) { count++; } // null and <empty string> are not displayworthy
        if (esri._isDefined(timeValue)) { count++; }
        
        // We need atleast two components to display a meaningful summary
        if (count > 1) {
          summary = (action === "edit" ? "edit" : "create") + 
                    (userId ? "User" : "") + 
                    (esri._isDefined(timeValue) ? info.displayPattern : "");
        }
      }

      // NOTE
      // Comment out this section when testing using the unit test cases at the
      // beginning of this method
      //console.log(info, summary);
      summary = summary && esri.substitute(info, esri.bundle.layers.FeatureLayer[summary]);
    }
    
    return summary;
  },
  
  getEditInfo: function(feature, options, /*For Testing Only*/ currentTime) {
    if (!this.loaded) {
      return;
    }
    
    currentTime = esri._isDefined(currentTime) ? currentTime : (new Date()).getTime();
    
    var reqAction = (options && options.action) || "last",
        fieldsInfo = this.editFieldsInfo,
        creatorField = fieldsInfo && fieldsInfo.creatorField,
        creationDateField = fieldsInfo && fieldsInfo.creationDateField,
        editorField = fieldsInfo && fieldsInfo.editorField,
        editDateField = fieldsInfo && fieldsInfo.editDateField,
        realm = fieldsInfo && fieldsInfo.realm,
        attributes = feature && feature.attributes,
        creator = (attributes && creatorField) ? attributes[creatorField] : undefined,
        creationDate = (attributes && creationDateField) ? attributes[creationDateField] : null,
        editor = (attributes && editorField) ? attributes[editorField] : undefined,
        editDate = (attributes && editDateField) ? attributes[editDateField] : null,
        creationData = this._getEditData(creator, creationDate, currentTime),
        editData = this._getEditData(editor, editDate, currentTime),
        retVal;
    
    switch(reqAction) {
      case "creation":
        retVal = creationData;
        break;
      case "edit":
        retVal = editData;
        break;
      case "last":
        retVal = editData || creationData;
        break;
    }
    
    if (retVal) {
      retVal.action = (retVal === editData) ? "edit" : "creation";
      //retVal.userId = retVal.userId || ""; // we don't want to show null and "" as userIds
    }
    
    return retVal;
  },
  
  _getEditData: function(userId, timeValue, currentTime) {
    var data, timeDiff, displayPattern,
        oneMin = 60000,
        mins60 = 3600000, // 60 * 60 * 1000,
        mins120 = 2 * mins60,
        hours24 = 24 * mins60,
        days7 = 7 * hours24;
    
    if (esri._isDefined(timeValue)) {
      timeDiff = currentTime - timeValue;
      //console.log(currentTime, timeValue, timeDiff );
      
      if (timeDiff < 0) {
        // This condition is really a fallback for assertion failure.
        // Assertion: a feature cannot have timestamp later than current time
        displayPattern = "Full";
      }
      else if (timeDiff < oneMin) {
        displayPattern = "Seconds";
      }
      else if (timeDiff < (2 * oneMin)) {
        displayPattern = "Minute";
      }
      else if (timeDiff < mins60) {
        displayPattern = "Minutes";
      }
      else if (timeDiff < mins120) {
        displayPattern = "Hour";
      }
      else if (timeDiff < hours24) {
        displayPattern = "Hours";
      }
      else if (timeDiff < days7) {
        displayPattern = "WeekDay";
      }
      else {
        displayPattern = "Full";
      }
    }

    if ((userId !== undefined) || displayPattern) {
      data = data || {};

      data.userId = userId; // can be undefined, null, "" or "<userId>"

      if (displayPattern) {
        var localeFormat = dojo.date.locale.format, dateObject = new Date(timeValue);
        
        data.minutes = Math.floor(timeDiff / oneMin);
        data.hours = Math.floor(timeDiff / mins60);
        data.weekDay = localeFormat(dateObject, { datePattern: "EEEE", selector: "date" });
        data.formattedDate = localeFormat(dateObject, { selector: "date" });
        data.formattedTime = localeFormat(dateObject, { selector: "time" });
        data.displayPattern = displayPattern;
        data.timeValue = timeValue;
      }
    }
    
    return data; // can be: undefined/have userId/have time components/have both userId and time
  },
  
  isEditable: function() {
    return !!(this._editable || this.userIsAdmin);
  },
  
  setMaxAllowableOffset: function(offset) {
    if (!this.isEditable()) {
      this._maxOffset = offset;
    }
    return this;
  },
  
  getMaxAllowableOffset: function() {
    return this._maxOffset;
  },
  
  setAutoGeneralize: function(enable) {
    if (!this.loaded) {
      this._optAutoGen = enable;
    }
    else if (
      !this.isEditable() && 
      (this.mode !== this.constructor.MODE_SNAPSHOT) &&
      ((this.geometryType === "esriGeometryPolyline") || (this.geometryType === "esriGeometryPolygon"))
    ) {
      this._autoGeneralize = enable;
      
      if (enable) {
        var map = this._map;
        if (map && map.loaded) {
          this._maxOffset = Math.floor(map.extent.getWidth() / map.width);
        }
      }
      else {
        delete this._maxOffset;
      }
    }
    
    return this;
  },
  
  setScaleRange: function(/*Number*/ minScale, /*Number*/ maxScale) {
    this.minScale = minScale || 0;
    this.maxScale = maxScale || 0;
    
    // listen for map zoom end to act on scale dependency
    //this.minScale = 0; this.maxScale = 44000;
    if (this._map && this._map.loaded) {
      /*if (minScale !== 0 || maxScale !== 0) {
        if (!this._zoomConnect) {
          this._zoomConnect = dojo.connect(this._map, "onZoomEnd", this, this._updateStatus);
        }
      }
      else {
        dojo.disconnect(this._zoomConnect);
        this._zoomConnect = null;
      }*/

      // effective immediately
      this._updateStatus();
    }
  },
  
  setGDBVersion: function(versionName) {
    if (
      !this._collection && 
      (versionName !== this.gdbVersion) && 
      (versionName || this.gdbVersion) // to catch null !== undefined !== "" passing the above condition
    ) {
      this.gdbVersion = versionName;
      this._task.gdbVersion = versionName;
      this._url.query = dojo.mixin(this._url.query, { gdbVersion: versionName });
      
      if (this.loaded) { // layer has loaded
        // this should finalize ongoing edits
        this.clearSelection();
        
        if (this._map) { // layer has been added to the map
          this.refresh();
        }
      }
      
      this.onGDBVersionChange();
    }
    
    return this;
  },
  
  setDefinitionExpression: function(/*String*/ expr) {
    this._defnExpr = expr;
    var mode = this._mode;
    if (mode) {
      mode.propertyChangeHandler(/*definition expression changed*/ 1);
    }
    return this;
  },
  
  getDefinitionExpression: function() {
    return this._defnExpr; // === undefined ? this.defaultDefinitionExpression : this._defnExpr;
  },
  
  setTimeDefinition: function(/*esri.TimeExtent*/ timeDefn) {
    if (/*this.timeInfo &&*/ this._isSnapshot) {
      this._timeDefn = timeDefn;
  
      var mode = this._mode;
      if (mode) {
        mode.propertyChangeHandler(/*snapshot time definition changed*/ 2);
      }
    }
    return this;
  },
  
  getTimeDefinition: function() {
    return this._timeDefn;
  },
  
  setTimeOffset: function(offsetValue, offsetUnits) {
    this._timeOffset = offsetValue;
    this._timeOffsetUnits = offsetUnits;
    var mode = this._mode;
    if (mode) {
      mode.propertyChangeHandler(/*map time extent changed*/ 0);
    }
    return this;
  },
  
  setUseMapTime: function(use) {
    this.useMapTime = use;
    this._toggleTime(!this._suspended);

    var mode = this._mode;
    if (mode) {
      mode.propertyChangeHandler(/*map time extent changed*/ 0);
    }
  },
  
  selectFeatures: function(/*esri.tasks.Query*/ query, /*Number?*/ selectionMethod, /*Function?*/ callback, /*Function?*/ errback) {
    selectionMethod = selectionMethod || this.constructor.SELECTION_NEW;
    
    var query2 = this._getShallowClone(query),
        map = this._map, featureSet,
        dfd = esri._fixDfd(new dojo.Deferred(esri._dfdCanceller));
    
    // override user query
    query2.outFields = this._getOutFields();
    query2.returnGeometry = true;
    if (map) {
      query2.outSpatialReference = new esri.SpatialReference(map.spatialReference.toJson());
    }
    
    // apply query filters
    if (!this._applyQueryFilters(query2)) {
//      return; // abort selection
      featureSet = { features: [] };
      // TODO
      // Need to consider doing setTimeout with delay=0
      this._selectHandler(featureSet, selectionMethod, callback, errback, dfd);
      //return this._getDeferred([featureSet.features, selectionMethod]);
      return dfd;
    }
    
    var queryTypes = this._canDoClientSideQuery(query2);
    if (queryTypes) { // use client-side implementation of selection
      featureSet = { features: this._doQuery(query2, queryTypes) };
      this._selectHandler(featureSet, selectionMethod, callback, errback, dfd);
      //return this._getDeferred([featureSet.features, selectionMethod]);
      return dfd;
    }
    else { // go to server
      if (this._collection) {
        var err = new Error("FeatureLayer::selectFeatures - " + esri.bundle.layers.FeatureLayer.invalidParams);
        /*if (errback) {
          errback(err);
        }
        return this._getDeferred(null, err);*/
       
        this._resolve([err], null, errback, dfd, true);
        return dfd;
      }

      var self = this;
      
      if (this._ts) {
        query2._ts = (new Date()).getTime();
      }

      var temp = dfd._pendingDfd = this._task.execute(query2);
      temp.addCallbacks(
        function(response) {
          self._selectHandler(response, selectionMethod, callback, errback, dfd);
        }, 
        function(err) {
          //dfd.errback(err);
          self._resolve([err], null, errback, dfd, true);
        }
      );
      
      return dfd;
    }
  },
  
  getSelectedFeatures: function() {
    var selected = this._selectedFeatures, retVal = [], item;
    
    for (item in selected) {
      if (selected.hasOwnProperty(item)) {
        retVal.push(selected[item]);
      }
    }
    
    /*selected = this._selectedFeaturesArr;
    if (selected.length > 0) {
      retVal = retVal.concat(selected);
    }*/
    
    return retVal;
  },
  
  clearSelection: function(silent) {
    // unselect and clear the selection
    var selected = this._selectedFeatures, mode = this._mode, item;
    
    for (item in selected) {
      if (selected.hasOwnProperty(item)) {
        this._unSelectFeatureIIf(item, mode);
        mode._removeFeatureIIf(item);
      }
    }
    this._selectedFeatures = {};
    
    /*selected = this._selectedFeaturesArr;
    var i = selected.length;
    while (i >= 0) {
      this._unSelectNewFeature(selected[i]);
      i--;
    }
    this._selectedFeaturesArr = [];*/

    if (this._isSelOnly) {
      mode._applyTimeFilter(true);
    }
    
    if (!silent) {
      this.onSelectionClear();
    }
    return this;
  },
  
  setSelectionSymbol: function(/*esri.symbol.Symbol*/ symbol) {
    this._selectionSymbol = symbol;
    
    if (symbol) {
      // apply it to the current selection
      var selected = this._selectedFeatures, item;
      for (item in selected) {
        if (selected.hasOwnProperty(item)) {
          selected[item].setSymbol(symbol);
        }
      }
    }
    
    return this;
  },
  
  getSelectionSymbol: function() {
    return this._selectionSymbol;
  },
  
  // Methods to be wrapped with normalize logic
  __msigns: [
    {
      n: "applyEdits",
      c: 5, // number of arguments expected by the method before the normalize era
      a: [ // arguments or properties of arguments that need to be normalized
        { i: 0 },
        { i: 1 }
      ],
      e: 4,
      f: 1
    }
  ],
  
  applyEdits: function(/*esri.Graphic[]*/ adds, /*esri.Graphic[]*/ updates, /*esri.Graphic[]*/ deletes, 
                       /*Function?*/ callback, /*Function?*/ errback, context) {
    
    // Use normalized geometries in place of the originals
    var assembly = context.assembly, dfd = context.dfd;
    // "adds" and "updates" will be mutated in-place
    this._applyNormalized(adds, assembly && assembly[0]);
    this._applyNormalized(updates, assembly && assembly[1]);
    
    // This event will be fired just before the edits request is sent 
    // to the server when 'FeatureLayer.applyEdits' method is called. 
    // You wouldn't need to use this event for most cases. But when 
    // using the Editor widget, this event can be used to intercept 
    // feature edits to, for example, to add additional attributes to 
    // newly created features that you did not want to show in the 
    // attribute inspector.
    this.onBeforeApplyEdits(adds, updates, deletes);
    
    var i, updatesMap = {}, oidField = this.objectIdField, content = { f: "json" }, dirty = false;

    if (this._collection) {
      // process edits on the client. there is no service to talk to.
      var response = {};
      
      response.addResults = adds ? dojo.map(adds, function() {
        dirty = true;
        return { objectId: this._nextId++, success: true };
      }, this) : null;
      
      response.updateResults = updates ? dojo.map(updates, function(feature) {
        dirty = true;
        var oid = feature.attributes[oidField];
        updatesMap[oid] = feature;
        return { objectId: oid, success: true };
      }, this) : null;
      
      response.deleteResults = deletes ? dojo.map(deletes, function(feature) {
        dirty = true;
        return { objectId: feature.attributes[oidField], success: true };
      }, this) : null;
      
      if (dirty) {
        this._editHandler(response, adds, updatesMap, callback, errback, dfd);
        //return this._getDeferred([response.addResults, response.updateResults, response.deleteResults]);
      }
      return;
    }
    
    // add features
    if (adds && adds.length > 0) {
      content.adds = this._convertFeaturesToJson(adds, 0, 1);
      dirty = true;
    }
    
    // update features
    if (updates && updates.length > 0) {
      for (i = 0; i < updates.length; i++) {
        var update = updates[i];
        updatesMap[update.attributes[oidField]] = update;
      }
      content.updates = this._convertFeaturesToJson(updates, 0, 0, 1);
      dirty = true;
    }
    
    // delete features
    if (deletes && deletes.length > 0) {
      var ids = [];
      for (i = 0; i < deletes.length; i++) {
        ids.push(deletes[i].attributes[oidField]);
      }
      content.deletes = ids.join(",");
      dirty = true;
    }
    
    if (dirty) {
      var self = this;
      
      return esri.request({
        url: this._url.path + "/applyEdits",
        content: dojo.mixin(content, this._url.query),
        callbackParamName: "callback",
        load: function(response) {
          self._editHandler(response, adds, updatesMap, callback, errback, dfd);
        },
        error: function(err) {
          self._resolve([err], null, errback, dfd, true);
        }
      }, { usePost: true });
    }
  },
  
  queryFeatures: function(/*esri.tasks.Query*/ query, /*Function?*/ callback, /*Function?*/ errback) {
    return this._query("execute", "onQueryFeaturesComplete", query, callback, errback);
  },
  
  queryRelatedFeatures: function(/*esri.tasks.RelationshipQuery*/ query, /*Function?*/ callback, /*Function?*/ errback) {
    return this._query("executeRelationshipQuery", "onQueryRelatedFeaturesComplete", query, callback, errback);
  },
  
  queryIds: function(/*esri.tasks.Query*/ query, /*Function?*/ callback, /*Function?*/ errback) {
    return this._query("executeForIds", "onQueryIdsComplete", query, callback, errback);
  },
  
  queryCount: function(/*esri.tasks.Query*/ query, /*Function?*/ callback, /*Function?*/ errback) {
    return this._query("executeForCount", "onQueryCountComplete", query, callback, errback);
  },
  
  queryAttachmentInfos: function(/*Number*/ objectId, callback, errback) {
    var url = this._url.path + "/" + objectId + "/attachments",
        dfd = new dojo.Deferred(esri._dfdCanceller),
        self = this;
    
    dfd._pendingDfd = esri.request({
      url: url,
      content: dojo.mixin({ f: "json" }, this._url.query),
      callbackParamName: "callback",
      
      load: function(response) {
        var infos = response.attachmentInfos,
          params;
        dojo.forEach(infos, function(info) {
          params = dojo.objectToQuery({
            gdbVersion: self._url.query && self._url.query.gdbVersion,
            layer: self._url.query && self._url.query.layer,
            token: self._getToken()
          });
          info.url = url + "/" + info.id + (params ? ("?" + params) : "");
          info.objectId = objectId;
        });
        
        /*this.onQueryAttachmentInfosComplete(infos);
        if (callback) {
          callback(infos);
        }*/
        
        self._resolve([infos], "onQueryAttachmentInfosComplete", callback, dfd);
      },
      
      error: function(err) {
        self._resolve([err], null, errback, dfd, true);
      }
    });
    
    return dfd;
  },
  
  addAttachment: function(/*Number*/ objectId, formNode, callback, errback) {
    return this._sendAttachment("add", objectId, formNode, callback, errback);
  },
  
  updateAttachment: function(/*Number*/ objectId, /*Number*/ attachmentId, formNode, callback, errback) {
    formNode.appendChild( dojo.create("input", { type: "hidden", name: "attachmentId", value: attachmentId }) );
    return this._sendAttachment("update", objectId, formNode, callback, errback);
  },
  
  deleteAttachments: function(/*Number*/ objectId, /*Number[]*/ attachmentIds, callback, errback) {
    var url = this._url.path + "/" + objectId + "/deleteAttachments",
        dfd = new dojo.Deferred(esri._dfdCanceller),
        self = this,
        content = {
          f: "json",
          attachmentIds: attachmentIds.join(",")
        };
    
    dfd._pendingDfd = esri.request({
      url: url,
      content: dojo.mixin(content, this._url.query),
      callbackParamName: "callback",
      
      load: dojo.hitch(this, function(response) {
        var results = response.deleteAttachmentResults;
        results = dojo.map(results, function(result) {
          var res = new esri.layers.FeatureEditResult(result);
          res.attachmentId = res.objectId;
          res.objectId = objectId;
          return res;
        });
        
        /*this.onDeleteAttachmentsComplete(results);
        if (callback) {
          callback(results);
        }*/
        
        self._resolve([results], "onDeleteAttachmentsComplete", callback, dfd);
      }), // load handler
      
      error: function(err) {
        self._resolve([err], null, errback, dfd, true);
      }
    }, { usePost: true });
    
    return dfd;
  },
  
  addType: function(newType) {
    // we want to add types to FS layers that are editable but don't have types and templates
    // this is the case for old hosted FS
    //if (!this._collection) {
    //  return false;
    //}
    
    var types = this.types;

    if (types) {
      var found = dojo.some(types, function(type) {
        if (type.id == newType.id) {
          return true;
        }
        return false;
      }); // some
      
      if (found) { // type already exists
        return false;
      }
      else { // new type, add it
        types.push(newType);
      }
    }
    else { // layer has no types yet
      this.types = [ newType ];
    }

    this._typesDirty = true;
    return true;
  },
  
  deleteType: function(typeId) {
    if (!this._collection) {
      return;
    }
    
    var types = this.types;
    
    if (types) {
      var found = -1;
      dojo.some(types, function(type, index) {
        if (type.id == typeId) {
          found = index;
          return true;
        }
        return false;
      }); // some
      
      if (found > -1) { // type exists
        this._typesDirty = true;
        return types.splice(found, 1)[0];
      }
    }
  },
  
  toJson: function() {
    var _json = this._json, json = dojo.isString(_json) ? dojo.fromJson(_json) : dojo.clone(_json);
    if (!json) {
      return;
    }
    
    json = json.layerDefinition ? json : { layerDefinition: json };
    
    var definition = json.layerDefinition, collection = this._collection;
    
    // if collection, update layerDefinition
    if (collection && this._typesDirty) {
      // update types
      definition.types = dojo.map(this.types || [], function(type) {
        return type.toJson();
      });

      // update renderer
      var renderer = this.renderer, drawInfo = definition.drawingInfo;
      if (drawInfo && renderer && renderer.declaredClass.indexOf("TemporalRenderer") === -1) {
        drawInfo.renderer = renderer.toJson();
      }
    }
    
    var outFeatureSet = null;
    if (!(collection && !this._fcAdded)) {
      outFeatureSet = {
        geometryType: definition.geometryType,
        features: this._convertFeaturesToJson(this.graphics, true/*, collection ? this.objectIdField : null*/)
      };
    }
    
    json.featureSet = dojo.mixin({}, json.featureSet || {}, outFeatureSet);
    
    // webmap spec
    if (collection) {
      json.nextObjectId = this._nextId;
      definition.capabilities = this.capabilities;
    }
    
    return json;
  },
  
  /*********
   * Events
   *********/
  
  onSelectionComplete: function() {},
  onSelectionClear: function() {},
  onBeforeApplyEdits: function() {},
  onEditsComplete: function() {},
  onQueryFeaturesComplete: function() {},
  onQueryRelatedFeaturesComplete: function() {},
  onQueryIdsComplete: function() {},
  onQueryCountComplete: function() {},
  onQueryAttachmentInfosComplete: function() {},
  onAddAttachmentComplete: function() {},
  onUpdateAttachmentComplete: function() {},
  onDeleteAttachmentsComplete: function() {},
  onCapabilitiesChange: function() {},
  onGDBVersionChange: function() {},
  onQueryLimitExceeded: function() {},
  
  /*******************
   * Internal Methods
   *******************/
  
  _updateCaps: function() {
    /*
      // Tests:
      (function() {
      
      var scope = { _editable: null, capabilities: null },
          result;
      
      console.log("Editable = FALSE");
      
      scope._editable = false; scope.capabilities = "";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("1. " + (scope.capabilities === ""));
          
      scope._editable = false; scope.capabilities = "Editing";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("2. " + (scope.capabilities === ""));
          
      scope._editable = false; scope.capabilities = "Editing,Create";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("3. " + (scope.capabilities === ""));
          
      scope._editable = false; scope.capabilities = "Editing,Create,Update";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("4. " + (scope.capabilities === ""));
          
      scope._editable = false; scope.capabilities = "Editing,Create,Update,Delete";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("5. " + (scope.capabilities === ""));
      
      scope._editable = false; scope.capabilities = undefined;
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("6. " + (scope.capabilities === ""));
          
      scope._editable = false; scope.capabilities = "Query";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("7. " + (scope.capabilities === "Query"));
          
      scope._editable = false; scope.capabilities = "Query,Editing";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("8. " + (scope.capabilities === "Query"));
      
      console.log("Editable = TRUE");
      
      scope._editable = true; scope.capabilities = "";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("1. " + (scope.capabilities === "Editing"));
          
      scope._editable = true; scope.capabilities = "Editing";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("2. " + (scope.capabilities === "Editing"));
          
      scope._editable = true; scope.capabilities = "Editing,Create";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("3. " + (scope.capabilities === "Editing,Create"));
          
      scope._editable = true; scope.capabilities = "Editing,Create,Update";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("4. " + (scope.capabilities === "Editing,Create,Update"));
          
      scope._editable = true; scope.capabilities = "Editing,Create,Update,Delete";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("5. " + (scope.capabilities === "Editing,Create,Update,Delete"));
      
      scope._editable = true; scope.capabilities = undefined;
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("6. " + (scope.capabilities === "Editing"));
          
      scope._editable = true; scope.capabilities = "Query";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("7. " + (scope.capabilities === "Query,Editing"));
          
      scope._editable = true; scope.capabilities = "Query,Editing";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("8. " + (scope.capabilities === "Query,Editing"));

      console.log("Editable = TRUE, SPACES in capabilities");
          
      scope._editable = true; scope.capabilities = "Query, Editing, Delete";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("1. " + (scope.capabilities === "Query,Editing,Delete"));
          
      scope._editable = true; scope.capabilities = "Query, Editing, Update";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("2. " + (scope.capabilities === "Query,Editing,Update"));
          
      scope._editable = true; scope.capabilities = "Query, Editing, Update, Delete";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("3. " + (scope.capabilities === "Query,Editing,Update,Delete"));
          
      scope._editable = true; scope.capabilities = "Query, Editing, Create, Delete";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("4. " + (scope.capabilities === "Query,Editing,Create,Delete"));
          
      scope._editable = true; scope.capabilities = "Query, Editing, Create, Update";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("5. " + (scope.capabilities === "Query,Editing,Create,Update"));
          
      scope._editable = true; scope.capabilities = "Query, Editing, Create";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("6. " + (scope.capabilities === "Query,Editing,Create"));
          
      scope._editable = true; scope.capabilities = "Query, Editing, Create, Update, Delete";
      dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("7. " + (scope.capabilities === "Query,Editing,Create,Update,Delete"));
      
      }());
      
      result = dojo.toJson(featureLayer._updateCaps.call(scope));
      console.log("X. " + (result === TTT));
    */
    
    // Update "capabilities" to reflect current state of the layer's
    // editability
    
    var editable = this._editable, capabilities = dojo.trim(this.capabilities || ""),
        outCaps = dojo.map((capabilities ? capabilities.split(",") : []), dojo.trim),
        caps = dojo.map((capabilities ? capabilities.toLowerCase().split(",") : []), dojo.trim),
        found = dojo.indexOf(caps, "editing"), cap, i, toRemove,
        specifics = {
          "Create": dojo.indexOf(caps, "create"),
          "Update": dojo.indexOf(caps, "update"),
          "Delete": dojo.indexOf(caps, "delete")
        };
    
    if (editable && found === -1) {
      outCaps.push("Editing");
      
      // Push Create, Update and Delete as well
      /*for (cap in specifics) {
        if (specifics[cap] === -1) {
          outCaps.push(cap);
        }
      }*/
    }
    else if (!editable && found > -1) {
      toRemove = [ found ];
      
      // Remove Create, Update and Delete as well
      for (cap in specifics) {
        if (specifics[cap] > -1) {
          toRemove.push(specifics[cap]);
        }
      }
      
      toRemove.sort();
      for (i = toRemove.length - 1; i >=0; i--) {
        outCaps.splice(toRemove[i], 1);
      }
    }
    
    this.capabilities = outCaps.join(",");
  },
  
  _counter: { value: 0 }, // this object will be shared by all feature layer instances
  
  _getUniqueId: function() {
    return this._counter.value++;
  },
    
  // (override)
  _getDesiredStatus: function() {
    // Returns true if the layer shold be alive, false otherwise
    return this.visible && this._isMapAtVisibleScale();
  },
  
  _isMapAtVisibleScale: function() {
    if (!this._map) {
      return false;
    }
    
    var scale = esri.geometry.getScale(this._map);
    //console.info(scale);
    
    // Examples:
    // minScale = 25000, maxScale = 7500
    // minScale = 0, maxScale = 7500
    // minScale = 7499, maxScale = 0
    // minScale = 0, maxScale = 0
    // More on semantics here: http://webhelp.esri.com/arcgisdesktop/9.3/index.cfm?TopicName=Displaying_layers_at_certain_scales
    
    var minScale = this.minScale, maxScale = this.maxScale, minPassed = !minScale, maxPassed = !maxScale;
    if (!minPassed && scale <= minScale) {
      minPassed = true;
    }
    if (!maxPassed && scale >= maxScale) {
      maxPassed = true;
    }
    
    return (minPassed && maxPassed) ? true : false;
  },
  
  // (extend)
  _suspend: function() {
    //console.info("suspending...");
    this.inherited("_suspend", arguments);
    this._toggleTime(false);
    var mode = this._mode;
    if (mode) {
      mode.suspend();
    }
  },
  
  // (extend)
  _resume: function() {
    //console.info("resuming...");
    this.inherited("_resume", arguments);
    this._toggleTime(true);
    var mode = this._mode;
    if (mode) {
      mode.resume();
    }
  },
  
  _zoomHandler: function() {
    var map = this._map;

    if (map && map.loaded) {
      if (this._autoGeneralize) {
        this._maxOffset = Math.floor(map.extent.getWidth() / map.width);
      }

      this._updateStatus();
    }
  },
  
  _toggleTime: function(enable) {
    //if (this.timeInfo) {
      var map = this._map;
      if (enable && this.timeInfo && this.useMapTime && map) {
        this._mapTimeExtent = map.timeExtent;
        if (!this._timeConnect) {
          this._timeConnect = dojo.connect(map, "onTimeExtentChange", this, this._timeChangeHandler);
        }
      }
      else {
        this._mapTimeExtent = null;
        dojo.disconnect(this._timeConnect);
        this._timeConnect = null;
      }
    //} 
  },
  
  _timeChangeHandler: function(newTimeExtent) {
    this._mapTimeExtent = newTimeExtent;
    var mode = this._mode;
    if (mode) {
      mode.propertyChangeHandler(/*map time extent changed*/ 0);
    }
  },
  
  _getOffsettedTE: function(timeExtent) {
    var offset = this._timeOffset, units = this._timeOffsetUnits;
    return (timeExtent && offset && units) ? timeExtent.offset(-1 * offset, units) : timeExtent;
  },
  
  _getTimeOverlap: function(timeExtent1, timeExtent2) {
    if (timeExtent1 && timeExtent2) {
      return timeExtent1.intersection(timeExtent2);
    }
    else {
      return timeExtent1 || timeExtent2;
    }
  },
  
  _getTimeFilter: function(queryTime) {
    // The effective time filter is the overlap
    // between query time, layer time defn and map time extent
    // If atleast two of the above variables have values and there is no
    // overlap, then ABORT selection
    
    // Group 1: NO queryTime
    
    /*// Subgroup 1: NO time definition, NO time extent
       var tDefn = null;
       var tExtent = null;
       console.log( (ov = _getTimeFilter(null)) && ov[0] === true && !ov[1] );
    
    // Subgroup 2: time definition + time extent
    
    //   Subgroup 1: overlap
         var tDefn = { startTime: 10, endTime: 20 };
         var tExtent = { startTime: 5, endTime: 15 };
         console.log( (ov = _getTimeFilter(null)) && ov[0] === true && (ov[1].startTime + "," + ov[1].endTime === "10,15") );
    
    //   Subgroup 2: NO overlap
         var tDefn = { startTime: 10, endTime: 20 };
         var tExtent = { startTime: 30, endTime: 40 };
         console.log( (ov = _getTimeFilter(null)) && ov[0] === false );
    
    // Subgroup 3: time definition + NO time extent
       var tDefn = { startTime: 10, endTime: 20 };
       var tExtent = null;
       console.log( (ov = _getTimeFilter(null)) && ov[0] === true && (ov[1].startTime + "," + ov[1].endTime === "10,20") );
    
    // Subgroup 4: NO time definition + time extent
       var tDefn = null;
       var tExtent = { startTime: 5, endTime: 10 };
       console.log( (ov = _getTimeFilter(null)) && ov[0] === true && (ov[1].startTime + "," + ov[1].endTime === "5,10") );*/

    // Group 2: queryTime is defined
    
    /*// Subgroup 1: NO time definition, NO time extent
       var tDefn = null;
       var tExtent = null;
       console.log( (ov = _getTimeFilter({ startTime: 5, endTime: 15 })) && ov[0] === true && (ov[1].startTime + "," + ov[1].endTime === "5,15") );
    
    // Subgroup 2: time definition + time extent
    
    //   Subgroup 1: overlap
         var tDefn = { startTime: 13, endTime: 20 };
         var tExtent = { startTime: 11, endTime: 17 };
         console.log( (ov = _getTimeFilter({ startTime: 5, endTime: 15 })) && ov[0] === true && (ov[1].startTime + "," + ov[1].endTime === "13,15") );
         console.log( (ov = _getTimeFilter({ startTime: 5, endTime: 12 })) && ov[0] === false );
         console.log( (ov = _getTimeFilter({ startTime: 18, endTime: 20 })) && ov[0] === false );
         console.log( (ov = _getTimeFilter({ startTime: 5, endTime: 10 })) && ov[0] === false );
    
    //   Subgroup 2: NO overlap
         var tDefn = { startTime: 20, endTime: 30 };
         var tExtent = { startTime: 35, endTime: 45 };
         console.log( (ov = _getTimeFilter({ startTime: 5, endTime: 15 })) && ov[0] === false );
         console.log( (ov = _getTimeFilter({ startTime: 15, endTime: 25 })) && ov[0] === false );
         console.log( (ov = _getTimeFilter({ startTime: 35, endTime: 40 })) && ov[0] === false );
    
    // Subgroup 3: time definition + NO time extent
       var tDefn = { startTime: 10, endTime: 20 };
       var tExtent = null;
       console.log( (ov = _getTimeFilter({ startTime: 5, endTime: 15 })) && ov[0] === true && (ov[1].startTime + "," + ov[1].endTime === "10,15") );
       console.log( (ov = _getTimeFilter({ startTime: 1, endTime: 5 })) && ov[0] === false );
    
    // Subgroup 4: NO time definition + time extent
       var tDefn = null;
       var tExtent = { startTime: 10, endTime: 20 };
       console.log( (ov = _getTimeFilter({ startTime: 5, endTime: 15 })) && ov[0] === true && (ov[1].startTime + "," + ov[1].endTime === "10,15") );
       console.log( (ov = _getTimeFilter({ startTime: 1, endTime: 5 })) && ov[0] === false );*/
    

    // Updated Test Cases: "map time extent is never used"
    
    /*// Group 1: NO queryTime
    var tDefn = null;
    console.log( (ov = _getTimeFilter(null)) && ov[0] === true && !ov[1] );

    var tDefn = new esri.TimeExtent();
    tDefn.startTime = new Date(10);
    tDefn.endTime = new Date(20);
    console.log( (ov = _getTimeFilter(null)) && ov[0] === true && (ov[1].startTime.getTime() + "," + ov[1].endTime.getTime() === "10,20") );
    
    // Group 2: queryTime is defined
    var tDefn = null;
    var qTime = new esri.TimeExtent();
    qTime.startTime = new Date(5);
    qTime.endTime = new Date(15);
    console.log( (ov = _getTimeFilter(qTime)) && ov[0] === true && (ov[1].startTime.getTime() + "," + ov[1].endTime.getTime() === "5,15") );

    var tDefn = new esri.TimeExtent();
    tDefn.startTime = new Date(10);
    tDefn.endTime = new Date(20);
    
    var qTime = new esri.TimeExtent();
    qTime.startTime = new Date(1);
    qTime.endTime = new Date(5);
    console.log( (ov = _getTimeFilter(qTime)) && ov[0] === false );
    
    var qTime = new esri.TimeExtent();
    qTime.startTime = new Date(25);
    qTime.endTime = new Date(30);
    console.log( (ov = _getTimeFilter(qTime)) && ov[0] === false );

    var qTime = new esri.TimeExtent();
    qTime.startTime = new Date(5);
    qTime.endTime = new Date(15);
    console.log( (ov = _getTimeFilter(qTime)) && ov[0] === true && (ov[1].startTime.getTime() + "," + ov[1].endTime.getTime() === "10,15") );

    var qTime = new esri.TimeExtent();
    qTime.startTime = new Date(15);
    qTime.endTime = new Date(23);
    console.log( (ov = _getTimeFilter(qTime)) && ov[0] === true && (ov[1].startTime.getTime() + "," + ov[1].endTime.getTime() === "15,20") );*/
    
    
    var timeDefn = this.getTimeDefinition(), mapTime = null /*this._getOffsettedTE(this._mapTimeExtent)*/, overlap;
    if (timeDefn || mapTime) {
      overlap = this._getTimeOverlap(timeDefn, mapTime);
      if (!overlap) {
        return [ false ]; // abort selection
      }
    }
    
    if (queryTime) {
      queryTime = overlap ? this._getTimeOverlap(queryTime, overlap) : queryTime;
      if (!queryTime) {
        return [ false ]; // abort selection
      }
    }
    else {
      queryTime = overlap;
    }
    
    return [ true, queryTime ];
  },
  
  _getAttributeFilter: function(queryWhere) {
    // The effective where clause is an AND 
    // between query where and layer definition
    
    // TODO
    // Add test cases
    
    var defExpr = this.getDefinitionExpression();
    if (queryWhere) {
      //queryWhere = defExpr ? queryWhere + " AND " + defExpr : queryWhere;
      queryWhere = defExpr ? "(" + defExpr + ") AND (" + queryWhere + ")" : queryWhere;
    }
    else {
      queryWhere = defExpr;
    }
    return queryWhere;
  },
  
  _applyQueryFilters: function(query) {
    // definition expression
    query.where = this._getAttributeFilter(query.where);
    query.maxAllowableOffset = this._maxOffset;
    
    // time
    if (this.timeInfo) {
      var result = this._getTimeFilter(query.timeExtent);
      if (!result[0]) {
        return false; // abort
      }
      else {
        query.timeExtent = result[1];
        //console.log("Time Filter ", "query.timeExtent: ", query.timeExtent.startTime, ", ", query.timeExtent.endTime);
      }
    }
    
    return true;
  },
  
  /*_registerNew: function(feature) {
    this._unRegisterNew(feature);
    this._newFeatures.push(feature);
    feature._count = 1;
  },
  
  _unRegisterNew: function(feature) {
    var newFeatures = this._newFeatures;
    var index = dojo.indexOf(newFeatures, feature);
    if (index !== -1) {
      newFeatures.splice(index, 1);
      feature._count = 0;
    }
  },
  
  _isNew: function(feature) {
    var index = dojo.indexOf(this._newFeatures, feature);
    return index === -1 ? false : true;
  },*/
  
  /*_registerDelete: function(feature) {
    var attributes = feature.attributes, oidField = this.objectIdField, oid = attributes[oidField];
    this._deletedFeatures[oid] = feature;
  },
  
  _unRegisterDelete: function(feature) {
    var attributes = feature.attributes, oidField = this.objectIdField, oid = attributes[oidField];
    delete this._deletedFeatures[oid];
  },
  
  _isDeleted: function(feature) {
    var attributes = feature.attributes, oidField = this.objectIdField, oid = attributes[oidField];
    return this._deletedFeatures[oid] ? true : false;
  },*/
  
  _add: function(graphic) {
    var symbol = this._selectionSymbol, attr = graphic.attributes,
        visField = this.visibilityField;

    // set correct symbology for the graphic
    if (symbol && this._isSelOnly) {
      graphic.setSymbol(symbol);
    }
    
    // webmap spec
    if (visField && attr && attr.hasOwnProperty(visField)) {
      graphic[attr[visField] ? "show" : "hide"]();
    }
    
    // [Dojo 1.4.0] Calling an inherited method by name from a function 
    // that does not have the same name as the overridden method does not 
    // work at Dojo 1.4.0 (If the derived class had a method with the same 
    // name as the inherited method, then that would be called instead)
    
    //return this.inherited("add", arguments);
    return this.add.apply(this, arguments);
  },
  
  _remove: function() {
    //return this.inherited("remove", arguments);
    return this.remove.apply(this, arguments);
  },
  
  _canDoClientSideQuery: function(query) {
    // Return values:
    //  null/undefined --> cannot perform client-side query
    //  1 --> can do client side query for "extent"
    //  2 --> can do client side query for "object ids"
    //  3 --> can do client side query for "time"
    //console.log("_canDoClientSideQuery");
    var retVal = [], map = this._map;
    
    if (this._isTable || !map) {
      return;
    }
    
    // cannot do most attribute based queries on the client
    if ( query.text || (query.where && query.where !== this.getDefinitionExpression()) ) {
      return;
    }
    
    var isSnapshot = this._isSnapshot, selOnly = this._isSelOnly;
    
    // geometry
    var geometry = query.geometry;
    if (geometry) {
      if (!selOnly && 
          query.spatialRelationship === esri.tasks.Query.SPATIAL_REL_INTERSECTS && 
          (geometry.type === "extent" && (isSnapshot || map.extent.contains(geometry)))
      ) {
        // can do extent based intersection query, if it is within the current map extent
        retVal.push(1);
      }
      else {
        return;
      }
    }

    // object ids
    var ids = query.objectIds;
    if (ids) {
      if (isSnapshot) {
        retVal.push(2);
      }
      else {
        var len = ids.length, mode = this._mode, matchCount = 0, i;
        for (i = 0; i < len; i++) {
          if (mode._getFeature(ids[i])) {
            matchCount++;
          }
        }
        
        if (matchCount === len) {
          // can do client-side if "all" object ids in the request are
          // currently available locally
          retVal.push(2);
        }
        else {
          return;
        }
      } // if snapshot
    }
    
    // time
    if (this.timeInfo) {
      var queryTime = query.timeExtent, mapTime = this._mapTimeExtent;
      
      if (isSnapshot) {
        if (queryTime) {
          retVal.push(3);
        }
      }
      else if (selOnly) {
        if (queryTime) {
          return;
        }
      }
      else { // on-demand
        if (mapTime) {
          if (dojo.indexOf(retVal, 2) !== -1) {
            if (queryTime) {
              retVal.push(3);
            }
          }
          else {
            // Does not matter if query has time or not - 
            // we need to go to the server
            return;
          }
        }
        else {
          if (retVal.length > 0) {
            if (queryTime) {
              retVal.push(3);
            }
          }
          else {
            if (queryTime) {
              return;
            }
          }
        } // mapTime
      } // on-demand
    }
    
//    // time
//    if (query.timeExtent) {
//      if (isSnapshot) {
//        retVal.push(3);
//      }
//      else {
//        if (selOnly) {
//          return;
//        }
//        else { // on-demand mode
//          if (retVal.length > 0) {
//            retVal.push(3);
//          }
//        } // if selOnly
//      } // if isSnapshot
//    }
    
    return retVal.length > 0 ? retVal : null;
  },

  _doQuery: function(query, queryTypes, returnIdsOnly) {
    //console.log("_doQuery");
    var matched = [], mode = this._mode, oidField = this.objectIdField, i,
        len, features;

    if (dojo.indexOf(queryTypes, 2) !== -1) { // object ids
      matched = [];
      var ids = query.objectIds;
      len = ids.length;
      for (i = 0; i < len; i++) {
        var obj = mode._getFeature(ids[i]);
        if (obj) {
          matched.push(obj);
        }
      }
      
      if (matched.length === 0) {
        return [];
      }
    }

    if (dojo.indexOf(queryTypes, 1) !== -1) { // query extent
      features = matched.length > 0 ? matched : this.graphics; 
      len = features.length; 
      
      var extent = query.geometry._normalize(null, true); // can be an extent or an array of extents
      
      matched = [];
      
      for (i = 0; i < len; i++) {
        var feature = features[i], geometry = feature.geometry;
        
        if (geometry) {
          if (this.normalization && extent.length) {
            // there will be two extents in the array (see Extent::_normalize to understand why)
            if (extent[0].intersects(geometry) || extent[1].intersects(geometry)) {
              matched.push(feature);
            }
          }
          else {
            if (extent.intersects(geometry)) {
              matched.push(feature);
            }
          }
        }
      }
      
      if (matched.length === 0) {
        return [];
      }
    }

    if (dojo.indexOf(queryTypes, 3) !== -1) { // time
      if (this.timeInfo) {
        // layer is time-aware
        features = matched.length > 0 ? matched : this.graphics;
        var time = query.timeExtent, result = this._filterByTime(features, time.startTime, time.endTime);
        matched = result.match;
      }
    }

    if (returnIdsOnly) {
      return dojo.map(matched, function(obj) {
        return obj.attributes[oidField];
      }, this);
    }
    else {
      return matched;
    }
  },
  
  _filterByTime: function(graphics, startTime, endTime) {
    var startTimeField = this._startTimeField, endTimeField = this._endTimeField, timeField;
    if (!this._twoTimeFields) {
      timeField = startTimeField || endTimeField;
    }
    
    var isDef = esri._isDefined, yea = [], nay = [], i, len = graphics.length, graphic, attributes;
    startTime = startTime ? startTime.getTime() : -Infinity;
    endTime = endTime ? endTime.getTime() : Infinity;
    
    /*if (startTime && endTime) { // time extent?
      startTime = startTime.getTime();
      endTime = endTime.getTime();*/

      if (timeField) { // there is only one time field
        for (i = 0; i < len; i++) {
          graphic = graphics[i];
          attributes = graphic.attributes;
          
          var time = attributes[timeField];
          
          if ( time >= startTime && time <= endTime ) {
            yea.push(graphic); //graphic.show();
          }
          else {
            nay.push(graphic); //graphic.hide();
          }
        } // loop
      }
      else { // we have start and end time fields
        for (i = 0; i < len; i++) {
          graphic = graphics[i];
          attributes = graphic.attributes;
          
          var start = attributes[startTimeField], end = attributes[endTimeField];
          start = isDef(start) ? start : -Infinity;
          end = isDef(end) ? end : Infinity;
          
          // Should it be INTERSECTS or CONTAINS? Looks like it should be
          // INTERSECTS
          if ( (start >= startTime && start <= endTime) || // feature-start within filter's timespan
               (end >= startTime && end <= endTime) || //  feature-end within filter's timespan
               (startTime >= start && endTime <= end) // filter's timespan completely within feature's timespan
             ) {
            yea.push(graphic); //graphic.show();
          }
          else {
            nay.push(graphic); //graphic.hide();
          }
        }
      } // timeField
      
    /*}
    else if (startTime || endTime) { // time instant?
      startTime = (startTime || endTime).getTime();

      if (timeField) { // there is only one time field
        for (var i = 0, len = graphics.length; i < len; i++) {
          var graphic = graphics[i], attributes = graphic.attributes;
          var time = attributes[timeField];
          
          if (time === startTime) {
            yea.push(graphic); //graphic.show();
          }
          else {
            nay.push(graphic); //graphic.hide();
          }
        } // loop
      }
      else { // we have start and end time fields
        for (var i = 0, len = graphics.length; i < len; i++) {
          var graphic = graphics[i], attributes = graphic.attributes;
          var start = attributes[startTimeField], end = attributes[endTimeField];
          start = isNotDefined(start) ? -Infinity : start;
          end = isNotDefined(end) ? Infinity : end;
          
          if (startTime >= start && startTime <= end) {
            yea.push(graphic); //graphic.show();
          }
          else {
            nay.push(graphic); //graphic.hide();
          }
        }
      } // timeField

    }*/
    return { match: yea, noMatch: nay };
  },
  
  /*_getDeferred: function(response, error) {
    var df = new dojo.Deferred();
    
    if (error) {
      df.errback(error);
    }
    else {
      //df.callback(response);
      if (dojo.isArray(response) && response.length > 1) {
        df = esri._fixDfd(df);
      }
      esri._resDfd(df, response);
    }
    
    return df;
  },*/
  
  _resolve: function(args, eventName, callback, dfd, isError) {
    // Fire Event
    if (eventName) {
      this[eventName].apply(this, args);
    }
    
    // Invoke Callback
    if (callback) {
      callback.apply(null, args);
    }
    
    // Resolve Deferred
    if (dfd) {
      esri._resDfd(dfd, args, isError);
    }
  },
  
  _getShallowClone: function(query) {
    // clone (shallow) query object
    var query2 = new esri.tasks.Query(), prop;
    for (prop in query) {
      if (query.hasOwnProperty(prop)) {
        query2[prop] = query[prop];
      }
    }
    return query2;
  },
  
  _query: function(type, eventName, query, callback, errback) {
    var that = this, 
        dfd = new dojo.Deferred(esri._dfdCanceller);
    
    var cbFunc = function(response, noLookup) {
      if (!noLookup && type === "execute" && !that._isTable) {
        // if some features are already on the client,
        // we need to replace them with references that we
        // already have
        var features = response.features, mode = that._mode, oidField = that.objectIdField,
            il = features.length, i;
            
        for (i = il - 1; i >= 0; i--) {
          var oid = features[i].attributes[oidField];
          var localRef = mode._getFeature(oid);
          if (localRef) {
            features.splice(i, 1, localRef);
          }
        }
      }
      
      /*that[eventName](response);
      if (callback) {
        callback(response);
      }
      if (dfd) {
        esri._resDfd(dfd, [response]);
      }*/
      that._resolve([response], eventName, callback, dfd);
    };

    if (type !== "executeRelationshipQuery") {
      query = this._getShallowClone(query);
      query.outFields = this._getOutFields();
      query.returnGeometry = true;
      
      var map = this._map, output;
      if (map) {
        query.outSpatialReference = new esri.SpatialReference(map.spatialReference.toJson());
      }
      
      // apply query filters
      if (!this._applyQueryFilters(query)) {
        //var output = (type === "execute") ? new esri.tasks.FeatureSet({ features: [] }) : [];
        switch(type) {
          case "execute":
            output = new esri.tasks.FeatureSet({ features: [] });
            break;
          case "executeForIds":
            output = [];
            break;
          case "executeForCount":
            output = 0;
            break;
        }
        
        cbFunc(output, true);
        //return this._getDeferred([output]);
        return dfd;
      }
      
      // execute the query: client-side or server-side
      var queryTypes = this._canDoClientSideQuery(query);
      if (queryTypes) {
        var features = this._doQuery(query, queryTypes, (type === "executeForIds" || type === "executeForCount"));
        
        //var output = (type === "execute") ? { features: features } : features;
        /*var output = features;
        if (type === "execute") {
          output = new esri.tasks.FeatureSet();
          output.features = features;
        }*/
        
        switch(type) {
          case "execute":
            output = new esri.tasks.FeatureSet();
            output.features = features;
            break;
          case "executeForIds":
            output = features;
            break;
          case "executeForCount":
            output = features.length;
            break;
        }
        
        cbFunc(output, true);
        //return this._getDeferred([output]);
        return dfd;
      }
    }

    if (this._collection) {
      var err = new Error("FeatureLayer::_query - " + esri.bundle.layers.FeatureLayer.invalidParams);
      /*if (errback) {
        errback(err);
      }
      return this._getDeferred(null, err);*/
     
      this._resolve([err], null, errback, dfd, true);
      return dfd;
    }

    if (this._ts) {
      query._ts = (new Date()).getTime();
    }
    
    var temp = dfd._pendingDfd = this._task[type](query);
    temp.addCallbacks(
      cbFunc,
      function(err) {
        that._resolve([err], null, errback, dfd, true);
      }
    );
    
    return dfd;
  },
  
  _convertFeaturesToJson: function(features, dontStringify, isAdd, isUpdate) {
    var json = [], selSymbol = this._selectionSymbol,
        visField = this.visibilityField, i, nonEditableFields,
        oidField = this.objectIdField;
    
    // Identify non-editable fields so that we can avoid sending
    // them to the server
    if (this.loaded && (isAdd || isUpdate)) {
      nonEditableFields = dojo.filter(this.fields, function(field) {
        return (field.editable === false) && 
               (!isUpdate || (field.name !== oidField));
      });
    }
    
    for (i = 0; i < features.length; i++) {
      var feature = features[i], featureJson = {}, 
          geometry = feature.geometry, attr = feature.attributes,
          symbol = feature.symbol;
          
      if (geometry && (!isUpdate || !this.loaded || this.allowGeometryUpdates)) {
        featureJson.geometry = geometry.toJson();
      }
      
      // webmap spec
      // Write out visibilityField
      if (visField) {
        featureJson.attributes = attr = dojo.mixin({}, attr);
        attr[visField] = feature.visible ? 1 : 0;
      }
      else if (attr) {
        featureJson.attributes = dojo.mixin({}, attr);
        /*if (suppressField) {
          delete featureJson.attributes[suppressField];
        }*/
      }
      
      // Remove non-editable fields from the attributes
      if (featureJson.attributes && nonEditableFields && nonEditableFields.length) {
        dojo.forEach(nonEditableFields, function(field) {
          delete featureJson.attributes[field.name];
        });
      }
      
      if (symbol && (symbol !== selSymbol)) {
        featureJson.symbol = symbol.toJson();
      }
      
      json.push(featureJson);
    }
    
    return dontStringify ? json : dojo.toJson(json);
  },
  
  _selectHandler: function(response, selectionMethod, callback, errback, dfd) {
    //console.log(" select features: ", response);

    // To select or to not select these new features?
    var doSelect, ctor = this.constructor;
    switch(selectionMethod) {
      case ctor.SELECTION_NEW:
        this.clearSelection(true);
        doSelect = true;
        break;
      case ctor.SELECTION_ADD:
        doSelect = true;
        break;
      case ctor.SELECTION_SUBTRACT:
        doSelect = false;
        break;
    }
    
    // process the features
    var i, features = response.features, mode = this._mode, retVal = [], oidField = this.objectIdField,
        feature, oid;
    if (doSelect) {
      for (i = 0; i < features.length; i++) {
        feature = features[i];
        oid = feature.attributes[oidField];
        
        /*if (this._isNew(feature)) {
          retVal.push(feature);
          this._selectNewFeature(feature);
        }
        else if (!this._isDeleted(feature)) {*/
          var added = mode._addFeatureIIf(oid, feature);
          retVal.push(added);
          this._selectFeatureIIf(oid, added, mode);
        //}
      }
    }
    else {
      for (i = 0; i < features.length; i++) {
        feature = features[i];
        oid = feature.attributes[oidField];
        
        /*if (this._isNew(feature)) {
          retVal.push(feature);
          this._unSelectNewFeature(feature);
        }
        else {*/
          this._unSelectFeatureIIf(oid, mode);
          var removed = mode._removeFeatureIIf(oid);
          retVal.push(removed || feature);
        //}
      }
    }

    if (this._isSelOnly) {
      mode._applyTimeFilter(true);
    }
    
    /*this.onSelectionComplete(retVal, selectionMethod);
    if (callback) {
      callback(retVal, selectionMethod);
    }
    if (dfd) {
      esri._resDfd(dfd, [retVal, selectionMethod]);
    }*/

    this._resolve(
      [retVal, selectionMethod, response.exceededTransferLimit ? { queryLimitExceeded: true } : null], 
      "onSelectionComplete", callback, dfd
    );
    
    if (response.exceededTransferLimit) {
      this.onQueryLimitExceeded();
    }
  },
  
  _selectFeatureIIf: function(oid, feature, mode) {
    var selected = this._selectedFeatures, found = selected[oid]; //, symbol = this._selectionSymbol, isSelOnly = this._isSelOnly;
    if (!found) {
      mode._incRefCount(oid);
      selected[oid] = feature;
      if (!this._isTable) {
        this._setSelectSymbol(feature);
      }
    }
    return found || feature;
  },

  _unSelectFeatureIIf: function(oid, mode) {
    var found = this._selectedFeatures[oid];
    if (found) {
      mode._decRefCount(oid);
      delete this._selectedFeatures[oid];
      if (!this._isTable) {
        this._setUnSelectSymbol(found);
      }
    }
    return found;
  },
  
  /*_selectNewFeature: function(feature) {
    var selected = this._selectedFeaturesArr;
    var index = dojo.indexOf(selected, feature);
    if (index === -1) {
      selected.push(feature);
      feature._count++;
      this._setSelectSymbol(feature);
    }
    return feature;
  },
  
  _unSelectNewFeature: function(feature) {
    var selected = this._selectedFeaturesArr;
    var index = dojo.indexOf(selected, feature), found;
    if (index !== -1) {
      found = selected[index];
      found._count = 1;
      this._setUnSelectSymbol(found);
      selected.splice(index, 1);
    }
    return found;
  },*/
  
  _isSelected: function(feature) {
    // TODO
  },
  
  _setSelectSymbol: function(feature) {
    var symbol = this._selectionSymbol;
    if (symbol && !this._isSelOnly) {
      // TODO 
      // How should we handle if feature
      // has its own symbol?
      feature.setSymbol(symbol);
    }
  },
  
  _setUnSelectSymbol: function(feature) {
    var symbol = this._selectionSymbol;
    if (symbol && !this._isSelOnly) {
      //feature.setSymbol(this.renderer.getSymbol(feature));
      if (symbol === feature.symbol) {
        feature.setSymbol(null, true);
      }
    }
  },
  
  /*_getSymbol: function(feature) {
    if (this.isEditable()) { // layer in a feature service 
      return this._getSymbolByType(feature.attributes[this.typeIdField]) || this.defaultSymbol;
    }
    else { // layer in a map service
      return null;
    }
  },
  
  _getSymbolByType: function(typeId) {
    if (typeId === undefined || typeId === null) {
      return null;
    }
    
    var types = this.types;
    for (var i = 0; i < types.length; i++) {
      var type = types[i];
      if (type.id == typeId) {
        return type.symbol;
      }
    }
    return null;
  },*/
  
  _getOutFields: function() {
    // Test Cases:
    /*console.log(featureLayer._getOutFields.call({
      objectIdField: "oid",
      typeIdField: "tid",
      _startTimeField: "stid",
      _endTimeField: "endid",
      _trackIdField: "tkid",
      
      _rendererFields: [ "rndid", "rndid2" ],
      _outFields: null
    }).join(",") === "oid,tid,stid,endid,tkid,rndid,rndid2");
    
    console.log(featureLayer._getOutFields.call({
      objectIdField: "oid",
      typeIdField: "tid",
      _startTimeField: "stid",
      _endTimeField: "endid",
      _trackIdField: "tkid",
      
      _rendererFields: [ "rndid" ],
      _outFields: [ "*" ]
    }).join(",") === "*");
    
    console.log(featureLayer._getOutFields.call({
      objectIdField: "oid",
      typeIdField: "tid",
      _startTimeField: "stid",
      _endTimeField: "endid",
      _trackIdField: "tkid",
      
      _rendererFields: [ "rndid" ],
      _outFields: ["f1", "f2"]
    }).join(",") === "f1,f2,oid,tid,stid,endid,tkid,rndid");
    
    console.log(featureLayer._getOutFields.call({
      objectIdField: "oid",
      typeIdField: "tid",
      _startTimeField: "stid",
      _endTimeField: "endid",
      _trackIdField: "tkid",
      
      _rendererFields: [ "rndid" ],
      _outFields: ["oid", "tkid", "f1", "f2"]
    }).join(",") === "oid,tkid,f1,f2,tid,stid,endid,rndid");
    
    console.log(featureLayer._getOutFields.call({
      objectIdField: "oid",
      typeIdField: null,
      _startTimeField: "stid",
      _endTimeField: null,
      _trackIdField: null,
      
      _rendererFields: [ "rndid" ],
      _outFields: null
    }).join(",") === "oid,stid,rndid");
    
    console.log(featureLayer._getOutFields.call({
      objectIdField: null,
      typeIdField: null,
      _startTimeField: null,
      _endTimeField: null,
      _trackIdField: null,
      
      _rendererFields: null,
      _outFields: null
    }).join(",") === "");
    
    console.log(featureLayer._getOutFields.call({
      objectIdField: "OBJECTID",
      typeIdField: "",
      _startTimeField: null,
      _endTimeField: null,
      _trackIdField: "",
      
      _rendererFields: [ "rndid", null, "" ],
      _outFields: null
    }).join(",") === "OBJECTID,rndid");
    
    console.log(featureLayer._getOutFields.call({
      objectIdField: "oid",
      typeIdField: "stid",
      _startTimeField: null,
      _endTimeField: null,
      _trackIdField: "oid",
      
      _rendererFields: [ "stid" ],
      _outFields: null
    }).join(",") === "oid,stid");
    */
    
    var requiredFields = dojo.filter([
      this.objectIdField,
      this.typeIdField,
      this.creatorField,
      this._startTimeField,
      this._endTimeField,
      this._trackIdField
    ].concat(this._rendererFields), function(field, index, arr) {
      return !!field && (dojo.indexOf(arr, field) === index);
    });
    
    var outFields = dojo.clone(this._outFields);
    if (outFields) {
      if (dojo.indexOf(outFields, "*") !== -1) {
        return outFields;
      }
      
      dojo.forEach(requiredFields, function(field) {
        if (dojo.indexOf(outFields, field) === -1) {
          outFields.push(field);
        }
      });
      return outFields;
    }
    else {
      return requiredFields;
    }
  },
  
  _checkFields: function(inFields) {
    var requiredFields = inFields || this._getOutFields();
    
    dojo.forEach(requiredFields, function(reqField) {
      if (reqField === "*" /*|| reqField === "__object__id__"*/) {
        return;
      }
      
//      var found = dojo.some(this.fields, function(fieldInfo) {
//        return (fieldInfo && fieldInfo.name === reqField) ? true : false;
//      });
      
      if (!this._getField(reqField)) {
        console.debug("esri.layers.FeatureLayer: " + esri.substitute({ url: this.url, field: reqField }, esri.bundle.layers.FeatureLayer.fieldNotFound));
      }
    }, this);
    
    if (!inFields && !this._isTable && !this._fserver && !this._collection) {
      var found = dojo.some(this.fields, function(fieldInfo) {
        return (fieldInfo && fieldInfo.type === "esriFieldTypeGeometry") ? true : false;
      });
      
      if (!found) {
        console.debug("esri.layers.FeatureLayer: " + esri.substitute({ url: this.url }, esri.bundle.layers.FeatureLayer.noGeometryField));
      }
    }
  },
  
  _fixRendererFields: function() {
    var renderer = this.renderer;
    
    if (renderer && this.fields.length > 0) {
      var renderers = dojo.filter([
        renderer, renderer.observationRenderer, 
        renderer.latestObservationRenderer, renderer.trackRenderer
      ], esri._isDefined);
      
      var fields = [];
      dojo.forEach(renderers, function(rnd) {
        var fieldInfo, fieldName;
        
        fieldName = rnd.attributeField;
        if (fieldName) {
          fieldInfo = !this._getField(fieldName) && this._getField(fieldName, true);
          if (fieldInfo) {
            rnd.attributeField = fieldInfo.name;
          }
        }

        fieldName = rnd.attributeField2;
        if (fieldName) {
          fieldInfo = !this._getField(fieldName) && this._getField(fieldName, true);
          if (fieldInfo) {
            rnd.attributeField2 = fieldInfo.name;
          }
        }

        fieldName = rnd.attributeField3;
        if (fieldName) {
          fieldInfo = !this._getField(fieldName) && this._getField(fieldName, true);
          if (fieldInfo) {
            rnd.attributeField3 = fieldInfo.name;
          }
        }

        fields.push(rnd.attributeField);
        fields.push(rnd.attributeField2);
        fields.push(rnd.attributeField3);
      }, this); // for loop
      
      this._rendererFields = dojo.filter(fields, esri._isDefined);
      
    } // if renderer
  },
  
  _getField: function(fieldName, ignoreCase) {
    var fields = this.fields;
    if (fields.length === 0) {
      return null;
    }

    var retVal;
    
    if (ignoreCase) {
      fieldName = fieldName.toLowerCase();
    }
    
    dojo.some(fields, function(fieldInfo) {
      var found = false;
      if (ignoreCase) {
        found = (fieldInfo && fieldInfo.name.toLowerCase() === fieldName) ? true : false;
      }
      else {
        found = (fieldInfo && fieldInfo.name === fieldName) ? true : false;
      }
      
      if (found) {
        retVal = fieldInfo;
      }
      
      return found;
    });
    
    return retVal;
  },
  
  _getDateOpts: function() {
    /*
     * Internally used by Graphic::getTitle and 
     * getContent methods
     */
    
    if (!this._dtOpts) {
      var props = dojo.map(
        dojo.filter(this.fields, function(fieldInfo) {
          return !!(fieldInfo && fieldInfo.type === "esriFieldTypeDate");
        }),
        function(fieldInfo) {
          return fieldInfo.name;
        }
      );
      
      // See esri.substitute for this object's spec
      this._dtOpts = { properties: props };
    }

    return this._dtOpts;
  },
  
  _applyNormalized: function(features, normalized) {
    // note: "features" are mutated with "normalized"
    
    if (features && normalized) {
      dojo.forEach(features, function(feature, index) {
        if (feature && normalized[index]) {
          feature.setGeometry(normalized[index]);
        }
      });
    }
  },
  
  _editHandler: function(response, adds, updatesMap, callback, errback, dfd) {
    var addResults = response.addResults, updateResults = response.updateResults, 
        deleteResults = response.deleteResults, i, result, oid, feature,
        attr, oidField = this.objectIdField,
        mode = this._mode, isTable = this._isTable/*, calculate,
        extent, newExtent, dataSR, fullExtent = this.fullExtent,
        extSR = fullExtent && fullExtent.spatialReference*/;
    
    // TODO
    // do not do display related stuff if the FL is not on the map

    var fieldsInfo = this.editFieldsInfo,
        outFields = this._getOutFields() || [],
        creatorField = fieldsInfo && fieldsInfo.creatorField,
        creationDateField = fieldsInfo && fieldsInfo.creationDateField,
        editorField = fieldsInfo && fieldsInfo.editorField,
        editDateField = fieldsInfo && fieldsInfo.editDateField,
        realm = fieldsInfo && fieldsInfo.realm;
    
    // Make sure the editor tracking fields are defined in the layer's outFields config
    // If they are not defined, we don't want to assign time and userId
    // for newly added and updated features
    if (dojo.indexOf(outFields, "*") === -1) {
      if (creatorField && dojo.indexOf(outFields, creatorField) === -1) {
        creatorField = null;
      }

      if (creationDateField && dojo.indexOf(outFields, creationDateField) === -1) {
        creationDateField = null;
      }

      if (editorField && dojo.indexOf(outFields, editorField) === -1) {
        editorField = null;
      }

      if (editDateField && dojo.indexOf(outFields, editDateField) === -1) {
        editDateField = null;
      }
    }

    // Calculate currentTime and userId if required
    var currentTime = (creationDateField || editDateField) ? 
                      (new Date()).getTime() : null,
        userId = (creatorField || editorField) ? 
                 this.getUserId() : undefined;
    
    if (userId && realm) {
      userId = userId + "@" + realm;
      
      // Note that realm will not be appended to anonymous users 
      // (i.e. <empty-string> values) either
    }
    
    if (addResults) {
      /*if (this._collection) {
        dataSR = dojo.getObject("0.geometry.spatialReference", false, adds);

        if ( !extSR || (dataSR && extSR._isEqual(dataSR)) ) {
          console.log("[ calculating extent 2... ]");
          calculate = true;
        }
      }*/
      
      for (i = 0; i < addResults.length; i++) {
        addResults[i] = new esri.layers.FeatureEditResult(addResults[i]);
        if (isTable) {
          continue;
        }
        
        result = addResults[i];
        if (result.success) {
          oid = result.objectId;
          feature = adds[i];
          
          var gl = feature._graphicsLayer;
          if (gl && gl !== this) {
            gl.remove(feature);
          }
          
          // attach the object id returned to the feature
          attr = feature.attributes || {};
          
          attr[oidField] = oid;
          
          if (creatorField) {
            attr[creatorField] = userId;
          }
          
          if (editorField) {
            attr[editorField] = userId;
          }
          
          if (creationDateField) {
            attr[creationDateField] = currentTime;
          }
          
          if (editDateField) {
            attr[editDateField] = currentTime;
          }
          
          feature.setAttributes(attr);
          
          if (mode._init) {
            mode.drawFeature(feature);
          }
          
          // extent calculation
          /*if (calculate) {
            extent = feature.geometry && feature.geometry.getExtent();
            
            if (extent) {
              newExtent = newExtent ? (newExtent.union(extent)) : extent;
            }
          }*/
          
        }
      } // for
      
      /*if (newExtent) {
        this.fullExtent = extSR ? (fullExtent.union(newExtent)) : newExtent;
      }*/
    }
    
    if (updateResults) {
      //var selected = this._selectedFeatures, selSymbol = this._selectionSymbol;
      for (i = 0; i < updateResults.length; i++) {
        updateResults[i] = new esri.layers.FeatureEditResult(updateResults[i]);
        if (isTable) {
          continue;
        }
        
        result = updateResults[i];
        if (result.success) {
          oid = result.objectId;
          feature = updatesMap[oid];
          
          // update geometry - technically we don't have to
          // update because "found" and "feature" should be
          // one and the same 
          var found = mode._getFeature(oid);
          if (found) {
            if (found.geometry !== feature.geometry) {
              found.setGeometry(esri.geometry.fromJson(feature.geometry.toJson()));
            }
            
            /*if (!(oid in selected) || !selSymbol) {
              // trigger repaint
              found.setSymbol(null);
            }*/
            this._repaint(found, oid);
          } // found
          
          feature = found || feature;

          attr = feature.attributes || {};
          
          if (editorField) {
            attr[editorField] = userId;
          }
          
          if (editDateField) {
            attr[editDateField] = currentTime;
          }

          feature.setAttributes(attr);
        }
      } // for
    }
    
    if (deleteResults) {
      var unselected = [];
      for (i = 0; i < deleteResults.length; i++) {
        deleteResults[i] = new esri.layers.FeatureEditResult(deleteResults[i]);
        if (isTable) {
          continue;
        }
        
        result = deleteResults[i];
        if (result.success) {
          oid = result.objectId;
          feature = mode._getFeature(oid);
          if (feature) {
            // unselect
            if (this._unSelectFeatureIIf(oid, mode)) {
              unselected.push(feature);
            }
            
            // force remove
            feature._count = 0;
            mode._removeFeatureIIf(oid);
          } // if feature
        }
      } // for
      
      /*if (this._collection && this.graphics.length === 0) {
        console.log("deleting fullExtent property");
        delete this.fullExtent;
      }*/
      
      if (unselected.length > 0) {
        this.onSelectionComplete(unselected, this.constructor.SELECTION_SUBTRACT);
      }
    }
    
    // disseminate the information
    /*this.onEditsComplete(addResults, updateResults, deleteResults);
    if (callback) {
      callback(addResults, updateResults, deleteResults);
    }*/
    this._resolve([addResults, updateResults, deleteResults], "onEditsComplete", callback, dfd);
  },
  
  _sendAttachment: function(type, objectId, formNode, callback, errback) {
    var operationName = (type === "add") ? "addAttachment" : "updateAttachment",
        url = this._url.path + "/" + objectId + "/" + operationName,
        self = this;

    /*formNode.enctype = "multipart/form-data";
    if (dojo.isIE < 9) {
      // in IE, dynamically setting the value of "enctype" attribute
      // does not seem to take effect
      formNode.encoding = "multipart/form-data";
    }
    formNode.method = "post";
    
    var elements = formNode.elements;
    
    // add "f" if not already in the form
    if ( !dojo.some(elements, function(el) { return el.name === "f"; }) ) {
      formNode.appendChild( dojo.create("input", { type: "hidden", name: "f", value: "json" }) );
    }
    
    // add "callback.html" if not already in the form
    if ( !dojo.some(elements, function(el) { return el.name === "callback.html"; }) ) {
      formNode.appendChild( dojo.create("input", { type: "hidden", name: "callback.html", value: "textarea" }) );
    }
    
    // add token
    var token = this._getToken();
    if (token && !dojo.some(elements, function(el) { return el.name === "token"; }) ) {
      formNode.appendChild( dojo.create("input", { type: "hidden", name: "token", value: token }) );
    }
    
    var dfd = new dojo.Deferred(esri._dfdCanceller),
        self = this,
        _errorFunc = function(error) {
          if (!(error instanceof Error)) {
            error = dojo.mixin(new Error(), error);
          }
          //if (errback) {
            //errback(error);
          //}
          self._resolve([error], null, errback, dfd, true);
        },
        proxy = (esri.config.defaults.io.alwaysUseProxy || !esri._hasSameOrigin(url, window.location.href)) ? 
                esri._getProxyUrl() : 
                null;
    
    dfd._pendingDfd = dojo.io.iframe.send({
      url: (proxy ? (proxy.path + "?") : "") + url + "?callback.html=textarea",
      form: formNode,
      handleAs: "json",
      
      load:  dojo.hitch(this, function(response, io) {
        var error = response.error;
        if (error) {
          _errorFunc(error);
          return;
        }
        
        var propertyName = (type === "add") ? "addAttachmentResult" : "updateAttachmentResult";
        var eventName = (type === "add") ? "onAddAttachmentComplete" : "onUpdateAttachmentComplete";
        
        var result = new esri.layers.FeatureEditResult(response[propertyName]);
        result.attachmentId = result.objectId;
        result.objectId = objectId;
        
        //this[eventName](result);
        //if (callback) {
          //callback(result);
        //}
        
        self._resolve([result], eventName, callback, dfd);
      }), // load handler
      
      error: _errorFunc
    });*/
    
    var dfd = esri.request({
      url: url,
      form: formNode,
      content: dojo.mixin(this._url.query, {f:"json", token: this._getToken() || undefined}),
      callbackParamName: "callback.html",
      handleAs: "json"
    })
    .addCallback(function(response) {
      var propertyName = (type === "add") ? "addAttachmentResult" : "updateAttachmentResult",
          eventName = (type === "add") ? "onAddAttachmentComplete" : "onUpdateAttachmentComplete",
          result = new esri.layers.FeatureEditResult(response[propertyName]);
          
      result.attachmentId = result.objectId;
      result.objectId = objectId;
      
      self._resolve([result], eventName, callback);
      return result;
    })
    .addErrback(function(error) {
      self._resolve([error], null, errback, null, true);
    });
    
    return dfd;
  },
  
  _repaint: function(feature, oid, force) {
    oid = esri._isDefined(oid) ? oid : feature.attributes[this.objectIdField];
    if (!(oid in this._selectedFeatures) || !this._selectionSymbol) {
      // repaint only when:
      // - the feature is not selected, or
      // - the feature is selected but the layer has no selection symbol
      feature.setSymbol(feature.symbol, force);
    }
  },
  
  /***************************
   * Tracking related methods
   ***************************/
  
  _getKind: function(feature) {
    var trackManager = this._trackManager;
    if (trackManager) {
      return trackManager.isLatestObservation(feature) ? 1 : 0;
    }
    return 0;
  }
  
});

// mixin enums for FeatureLayer
dojo.mixin(esri.layers.FeatureLayer, {
  MODE_SNAPSHOT: 0,
  MODE_ONDEMAND: 1,
  MODE_SELECTION: 2,
  SELECTION_NEW: 3,
  SELECTION_ADD: 4,
  SELECTION_SUBTRACT: 5,
  POPUP_NONE: "esriServerHTMLPopupTypeNone",
  POPUP_HTML_TEXT: "esriServerHTMLPopupTypeAsHTMLText",
  POPUP_URL: "esriServerHTMLPopupTypeAsURL"
});

esri._createWrappers("esri.layers.FeatureLayer");

/**************************
 * esri.layers.FeatureType
 **************************/

dojo.declare("esri.layers.FeatureType", null, {
  constructor: function(json) {
    if (json && dojo.isObject(json)) {
      this.id = json.id;
      this.name = json.name;

      var symbol = json.symbol;
      
      if (symbol) {
        this.symbol = esri.symbol.fromJson(symbol);
      }
      
      // domains
      var domains = json.domains, field, i;
      var domainObjs = this.domains = {};
      for (field in domains) {
        if (domains.hasOwnProperty(field)) {
          var domain = domains[field];
          switch(domain.type) {
            case "range":
              domainObjs[field] = new esri.layers.RangeDomain(domain);
              break;
            case "codedValue":
              domainObjs[field] = new esri.layers.CodedValueDomain(domain);
              break;
            case "inherited":
              domainObjs[field] = new esri.layers.InheritedDomain(domain);
              break;
          }
        } // if
      }
      
      // templates
      var templates = json.templates;
      if (templates) {
        var templateObjs = this.templates = [];
        for (i = 0; i < templates.length; i++) {
          templateObjs.push(new esri.layers.FeatureTemplate(templates[i]));
        }
      }
      
    } // json
  },
  
  toJson: function() {
    var json = {
      id: this.id,
      name: this.name,
      symbol: this.symbol && this.symbol.toJson()
    };
    
    var field, domains = this.domains, templates = this.templates, sanitize = esri._sanitize;
    if (domains) {
      var newCopy = json.domains = {};
      for (field in domains) {
        if (domains.hasOwnProperty(field)) {
          newCopy[field] = domains[field] && domains[field].toJson();
        }
      }
      sanitize(newCopy);
    }
    if (templates) {
      json.templates = dojo.map(templates, function(template) {
        return template.toJson();
      });
    }
    
    return sanitize(json);
  }
});

/******************************
 * esri.layers.FeatureTemplate
 ******************************/

dojo.declare("esri.layers.FeatureTemplate", null, {
  constructor: function(json) {
    if (json && dojo.isObject(json)) {
      this.name = json.name;
      this.description = json.description;
      this.drawingTool = json.drawingTool;
      
      // prototypical feature
      var prototype = json.prototype;
      this.prototype = new esri.Graphic(prototype.geometry, null, prototype.attributes);
    }
  },
  
  toJson: function() {
    return esri._sanitize({
      name: this.name,
      description: this.description,
      drawingTool: this.drawingTool,
      prototype: this.prototype && this.prototype.toJson() 
    });
  }
});

// mixin enums for FeatureTemplate
dojo.mixin(esri.layers.FeatureTemplate, {
  TOOL_AUTO_COMPLETE_POLYGON: "esriFeatureEditToolAutoCompletePolygon",
  TOOL_CIRCLE: "esriFeatureEditToolCircle", // mapped to TOOL_POLYGON
  TOOL_ELLIPSE: "esriFeatureEditToolEllipse", // mapped to TOOL_POLYGON
  TOOL_FREEHAND: "esriFeatureEditToolFreehand",
  TOOL_LINE: "esriFeatureEditToolLine",
  TOOL_NONE: "esriFeatureEditToolNone", // for non-spatial tables; cannot be set for spatial data in ArcMap
  TOOL_POINT: "esriFeatureEditToolPoint",
  TOOL_POLYGON: "esriFeatureEditToolPolygon",
  TOOL_RECTANGLE: "esriFeatureEditToolRectangle",
  TOOL_ARROW: "esriFeatureEditToolArrow",
  TOOL_TRIANGLE: "esriFeatureEditToolTriangle",
  TOOL_LEFT_ARROW: "esriFeatureEditToolLeftArrow",
  TOOL_RIGHT_ARROW: "esriFeatureEditToolRightArrow",
  TOOL_UP_ARROW: "esriFeatureEditToolUpArrow",
  TOOL_DOWN_ARROW: "esriFeatureEditToolDownArrow"
});

/********************************
 * esri.layers.FeatureEditResult
 ********************************/

dojo.declare("esri.layers.FeatureEditResult", null, {
  constructor: function(json) {
    if (json && dojo.isObject(json)) {
      this.objectId = json.objectId;
      this.success = json.success;
      if (!json.success) {
        var err = json.error;
        this.error = new Error();
        this.error.code = err.code;
        this.error.message = err.description;
      }
    }
  }
});

/**************************
 * esri.layers._RenderMode
 **************************/

dojo.declare("esri.layers._RenderMode", null, {
  constructor: function() {
    this._prefix = "jsonp_" + (dojo._scopeName || "dojo") + "IoScript";
  },
//  layerInfoHandler: function(layerInfo) {},
  initialize: function(map) {},
  propertyChangeHandler: function(type) {
    /*
     * type = 0 denotes map time extent changed
     * type = 1 denotes layer definition expression changed
     * type = 2 denotes layer time definition changed
     */
  },
  destroy: function() {},
  drawFeature: function(feature) {},
  suspend: function() {},
  resume: function() {},
  refresh: function() {},
  
  _incRefCount: function(oid) {
    var found = this._featureMap[oid];
    if (found) {
      found._count++;
    }
  },
  
  _decRefCount: function(oid) {
    var found = this._featureMap[oid];
    if (found) {
      found._count--;
    }
  },
  
  _getFeature: function(oid) {
    return this._featureMap[oid];
  },
  
  _addFeatureIIf: function(oid, feature) {
    var fmap = this._featureMap, found = fmap[oid], layer = this.featureLayer; //, template = layer._infoTemplate;
    if (!found) {
      fmap[oid] = feature;
      /*if (template) {
        feature.setInfoTemplate(template);
      }*/
      layer._add(feature);
      feature._count = 0;
    }
    return found || feature;
  },
  
  _removeFeatureIIf: function(oid) {
    var found = this._featureMap[oid], layer = this.featureLayer;
    if (found) {
      if (found._count) {
        return;
      }
      delete this._featureMap[oid];
      layer._remove(found); 
    }
    return found;
  },
  
  _clearIIf: function() {
    var i, layer = this.featureLayer, graphics = layer.graphics, 
        selected = layer._selectedFeatures, oidField = layer.objectIdField;
        
    for (i = graphics.length - 1; i >= 0; i--) {
      var feature = graphics[i];
      var oid = feature.attributes[oidField];
      if (oid in selected) {
        feature._count = 1;
        continue;
      }
      feature._count = 0;
      this._removeFeatureIIf(oid);
    }
  },
  
//  _fireUpdateStart: function() {
//    if (this._started) {
//      return;
//    }
//    this._started = true;
//    this.featureLayer.onUpdateStart();
//  },
//  
//  _fireUpdateEnd: function() {
//    this._started = false;
//    this.featureLayer.onUpdateEnd();
//  },
  
  _isPending: function(id) {
    var dfd = dojo.io.script[this._prefix + id]; // see dojo.io.script._makeScriptDeferred
    return dfd ? true : false;
  },
  
  // Methods to make ETags useful
  _cancelPendingRequest: function(dfd, id) {
    dfd = dfd || dojo.io.script[this._prefix + id]; // see dojo.io.script._makeScriptDeferred
    if (dfd) {
      try {
        dfd.cancel(); // call ends up at dojo.io.script._deferredCancel
        dojo.io.script._validCheck(dfd);
        //console.info(dfd.startTime, dfd.canceled, dfd);
      }
      catch(e) {}
    }
  },
  
  _purgeRequests: function() {
    // The first argument is not used in this method
    dojo.io.script._validCheck(null);
  },

  _toggleVisibility: function(/*Boolean*/ show) {
    var layer = this.featureLayer, graphics = layer.graphics, 
        methodName = show ? "show" : "hide", i, len = graphics.length;
    
    show = show && layer._ager; // show morphs here
    for (i = 0; i < len; i++) {
      var graphic = graphics[i];
      graphic[methodName]();
      if (show) {
        layer._repaint(graphic);
      }
    }
  },

  _applyTimeFilter: function(silent) {
    // Display only features that belong in the intersection of
    // snapshot time definition and map time extent
    
    var layer = this.featureLayer;
    if (!layer.timeInfo || layer._suspended) {
      // layer is not time aware
      return;
    }
    
    if (!silent) {
      layer._fireUpdateStart();
    }
    
    // clear all the track lines
    var trackManager = layer._trackManager;
    if (trackManager) {
      trackManager.clearTracks();
    }
     
    var defn = layer.getTimeDefinition(), timeExtent = layer._getOffsettedTE(layer._mapTimeExtent);
    if (timeExtent) {
      timeExtent = layer._getTimeOverlap(defn, timeExtent);
      if (timeExtent) { // there is overlap, do filter
        //console.log("Snapshot Client Filter ", "query.timeExtent: ", timeExtent.startTime, ", ", timeExtent.endTime);
        var result = layer._filterByTime(layer.graphics, timeExtent.startTime, timeExtent.endTime);
    
        if (trackManager) {
          trackManager.addFeatures(result.match);
        }
        dojo.forEach(result.match, function(graphic) {
          var shape = graphic._shape;
          if (!graphic.visible) {
            graphic.show();
            shape = graphic._shape;
            shape && shape._moveToFront();
          }
          if (layer._ager && shape) {
            layer._repaint(graphic);
          }
        });
        
        dojo.forEach(result.noMatch, function(graphic) {
          if (graphic.visible) {
            graphic.hide();
          }
        });
      }
      else { // there is no overlap, so hide everything
        this._toggleVisibility(false);
      }
    }
    else { // map time extent is set to null
      if (trackManager) {
        trackManager.addFeatures(layer.graphics);
      }
      this._toggleVisibility(true);
    }
    
    // draw track lines corresponding to the observations
    if (trackManager) {
      trackManager.moveLatestToFront();
      trackManager.drawTracks();
    }
    
    if (!silent) {
      layer._fireUpdateEnd();
    }
  }
});

/*****************************
 * esri.layers._SelectionMode
 *****************************/

dojo.declare("esri.layers._SelectionMode", [ esri.layers._RenderMode ], {
  
  /************
   * Overrides 
   ************/
  
  constructor: function(featureLayer) {
    //console.log("entering 'selection only' mode...");
    this.featureLayer = featureLayer;
    this._featureMap = {};
  },
  
//  layerInfoHandler: function(layerInfo) {
//    this.layerInfo = layerInfo;
//  },

  initialize: function(map) {
    this.map = map;
    this._init = true;
  },

  propertyChangeHandler: function(type) {
    if (this._init && type === 0) {
      // map time extent changed
      this._applyTimeFilter();
    }
  },

  destroy: function() {
    this._init = false;
  },
  
  resume: function() {
    this.propertyChangeHandler(0);
  }
});

/****************************
 * esri.layers._SnapshotMode
 ****************************/

dojo.declare("esri.layers._SnapshotMode", [ esri.layers._RenderMode ], {
  
  /************
   * Overrides 
   ************/
  
  constructor: function(featureLayer) {
    //console.log("entering 'snapshot' mode...");
    this.featureLayer = featureLayer;
    this._featureMap = {};
    this._drawFeatures = dojo.hitch(this, this._drawFeatures);
    this._queryErrorHandler = dojo.hitch(this, this._queryErrorHandler);
  },
  
//  layerInfoHandler: function(layerInfo) {
//    this.layerInfo = layerInfo;
//  },

  initialize: function(map) {
    this.map = map;
    var layer = this.featureLayer;
    if (layer._collection) {
      /*layer._fireUpdateStart();
      
      // create and assign unique ids for features 
      var featureSet = layer._featureSet;
      delete layer._featureSet;
      
      this._drawFeatures(new esri.tasks.FeatureSet(featureSet));
      layer._fcAdded = true;*/
     
      this._applyTimeFilter();
    }
    else {
      this._fetchAll();
    }
    this._init = true;
  },

  propertyChangeHandler: function(type) {
    if (this._init) {
      if (type) {
        this._fetchAll();
      }
      else { // map time extent changed
        this._applyTimeFilter();
      }
    }
  },

  destroy: function() {
    this._init = false;
  },
  
  drawFeature: function(feature) {
    var layer = this.featureLayer, oidField = layer.objectIdField, oid = feature.attributes[oidField];
    //if (!layer._isDeleted(feature)) {
      this._addFeatureIIf(oid, feature);
      this._incRefCount(oid);
    //}
  },
  
  resume: function() {
    this.propertyChangeHandler(0);
  },
  
  refresh: function() {
    var layer = this.featureLayer;
    
    if (layer._collection) {
      layer._fireUpdateStart();
      layer._refresh(true);
      layer._fireUpdateEnd();
    }
    else {
      this._fetchAll();
    }
  },
  
  /*******************
   * Internal Methods
   *******************/
  
  _getRequestId: function(layer) {
    var id = "_" + layer.name + layer.layerId + layer._ulid;
    return id.replace(/[^a-zA-Z0-9\_]+/g, "_"); // cannot have hyphens in callback function names
  },
  
  _fetchAll: function() {
    var layer = this.featureLayer;
    if (layer._collection) {
      return;
    }

    layer._fireUpdateStart();
    this._clearIIf();
    this._sendRequest();
  },
  
  _sendRequest: function() {
    //console.log("fetching...");
    var map = this.map, layer = this.featureLayer, defExpr = layer.getDefinitionExpression();
    
    var query = new esri.tasks.Query();
    query.outFields = layer._getOutFields();
    query.where = defExpr || "1=1";
    query.returnGeometry = true;
    query.outSpatialReference = new esri.SpatialReference(map.spatialReference.toJson());
    query.timeExtent = layer.getTimeDefinition();
    //query.timeExtent && console.log("Snapshot ", "query.timeExtent: ", query.timeExtent.startTime, ", ", query.timeExtent.endTime);
    query.maxAllowableOffset = layer._maxOffset;
    if (layer._ts) {
      query._ts = (new Date()).getTime();
    }

    var callbackSuffix;
    if (layer._usePatch) {
      // get an id for this request
      callbackSuffix = this._getRequestId(layer);

      // cancel the previous request of the same kind
      this._cancelPendingRequest(null, callbackSuffix);
    }
  
    layer._task.execute(query, this._drawFeatures, this._queryErrorHandler, callbackSuffix);
  },
    
  _drawFeatures: function(response) {
    //console.log("drawing");
    this._purgeRequests();

    var features = response.features, layer = this.featureLayer, 
        oidField = layer.objectIdField, i, len = features.length,
        feature, oid/*, newExtent, extent, calculate*/;
    
    /*if (layer._collection) {
      var extSR = layer.fullExtent && layer.fullExtent.spatialReference;
      
      if (!extSR) {
        console.log("[ calculating extent... ]");
        calculate = true;
      }
    }*/
    
    // add features to the map
    for (i = 0; i < len; i++) {
      feature = features[i];
      oid = feature.attributes[oidField];
      //if (!layer._isDeleted(feature)) {
        this._addFeatureIIf(oid, feature);
        this._incRefCount(oid);
      //}
      
      /*if (calculate) {
        extent = feature.geometry && feature.geometry.getExtent();
        
        if (extent) {
          newExtent = newExtent ? (newExtent.union(extent)) : extent;
        }
      }*/
    }
    
    /*if (newExtent) {
      layer.fullExtent = newExtent;
    }*/
    
    // process and apply map time extent
    this._applyTimeFilter(true);
    
    layer._fireUpdateEnd(null, response.exceededTransferLimit ? { queryLimitExceeded: true } : null);
    
    if (response.exceededTransferLimit) {
      layer.onQueryLimitExceeded();
    }
  },
  
  _queryErrorHandler: function(err) {
    //console.log("query error! ", err);
    
    this._purgeRequests();
    
    var layer = this.featureLayer;
    layer._errorHandler(err);
    layer._fireUpdateEnd(err);
  }
  
});

/****************************
 * esri.layers._OnDemandMode
 ****************************/

dojo.declare("esri.layers._OnDemandMode", [ esri.layers._RenderMode ], {
  
  /************
   * Overrides 
   ************/
  
  constructor: function(featureLayer) {
    //console.log("entering 'on-demand' mode...");
    this.featureLayer = featureLayer;
    this._featureMap = {};
    this._queryErrorHandler = dojo.hitch(this, this._queryErrorHandler);
  },
  
//  layerInfoHandler: function(layerInfo) {
//    this.layerInfo = layerInfo;
//  },
  
  initialize: function(map) {
    this.map = map;
    this._initialize();
    this._init = true;
  },
  
  propertyChangeHandler: function(type) {
    if (this._init) {
      if (type < 2) {
        this._zoomHandler();
      }
      // On-demand mode is not affected by time definition (type = 2)?
    }
  },
  
  destroy: function() {
    this._disableConnectors();
    this._init = false;
  },
  
  drawFeature: function(feature) {
    // find the cells touching the feature
    var gridLayer = this._gridLayer, geom = feature.geometry, cells = [];

    if (!geom) {
      return;
    }
    
    cells = gridLayer.getCellsInExtent(
      (geom.type === "point") ?
       { xmin: geom.x, ymin: geom.y, xmax: geom.x, ymax: geom.y } :
       geom.getExtent(),
       false
    ).cells;
    
    //console.log("cells = ", cells);
    
    // add and set ref-count based on the #cells this feature intersects
    var cellMap = this._cellMap, i, cell,
        oid = feature.attributes[this.featureLayer.objectIdField],
        cLatticeID, row, col;
    
    for (i = 0; i < cells.length; i++) {
      cell = cells[i];
      cLatticeID = cell.latticeID;
      row = cell.row;
      col = cell.col;
      
      if (cLatticeID) {
        cell = (cellMap[cLatticeID] = (cellMap[cLatticeID] || cell));
      }
      else {
        cellMap[row] = cellMap[row] || {};
        cell = (cellMap[row][col] = (cellMap[row][col] || cell));
      }
      
      cell.features = cell.features || [];
      cell.features.push(feature);
      
      this._addFeatureIIf(oid, feature);
      this._incRefCount(oid);
    }
  },
  
  suspend: function() {
    if (!this._init) {
      return;
    }
    this._disableConnectors();
  },
  
  resume: function() {
    if (!this._init) {
      return;
    }
    this._enableConnectors();
    this._zoomHandler();
  },
  
  refresh: function() {
    this._zoomHandler();
  },
  
  /*******************
   * Internal Methods
   *******************/
  
  _initialize: function() {
    var map = this.map, layer = this.featureLayer;
    
    // Set -180 as the grid layout origin
    // NOTE: _wrap and _srInfo are defined by _GraphicsLayer::_setMap
    var srInfo = /*layer._wrap &&*/ layer._srInfo;
    
    this._gridLayer = new esri.layers._GridLayout(
//      map.extent.getCenter(),
      new esri.geometry.Point(srInfo ? srInfo.valid[0] : map.extent.xmin, map.extent.ymax, map.spatialReference),
      { width: layer._tileWidth, height: layer._tileHeight }, 
      { width: map.width, height: map.height },
      srInfo
    );
  
    this._ioQueue = [];
    if (!layer._suspended) {
      this._zoomHandler();
      this._enableConnectors();
    }
  },
  
  _enableConnectors: function() {
    var map = this.map;
    this._zoomConnect = dojo.connect(map, "onZoomEnd", this, this._zoomHandler);
    this._panConnect = dojo.connect(map, "onPanEnd", this, this._panHandler);
    this._resizeConnect = dojo.connect(map, "onResize", this, this._panHandler);
  },
  
  _disableConnectors: function() {
    dojo.disconnect(this._zoomConnect);
    dojo.disconnect(this._panConnect);
    dojo.disconnect(this._resizeConnect);
  },
    
  _zoomHandler: function() {
    this._processIOQueue(true);
    var layer = this.featureLayer, map = this.map;
    
    // we need to do this check here because even though
    // this zoom handler is disconnected on suspend, the handler
    // is still called one last time. Reason: suspension also happens in one of 
    // the zoom end listeners and this handler is not removed (in practice) from the
    // list of listeners that dojo maintains as part of connect-disconnect
    // infrastructure (the zoom end callback sequence has already started)
    // Perhaps, we can remove this check when ondemand uses "onExtentChange"
    // instead of "onZoomEnd"
    if (layer._suspended) {
      return;
    }
    
    /*if (layer._autoGeneralize) {
      layer._maxOffset = Math.floor(map.extent.getWidth() / map.width);
    }*/

    layer._fireUpdateStart();
    this._clearIIf();
    var trackManager = layer._trackManager;
    if (trackManager) {
      trackManager.clearTracks();
    }

    this._cellMap = {};
    this._gridLayer.setResolution(map.extent);
    
    this._sendRequest();
  },
    
  _panHandler: function() {
    this.featureLayer._fireUpdateStart();
    this._sendRequest(this.featureLayer._resized && arguments[0]);
  },
  
  _getRequestId: function(layer, cell) {
    var id = "_" + layer.name + layer.layerId + layer._ulid + "_" + cell.resolution + "_" + 
             (cell.latticeID || (cell.row + "_" +  cell.col));
    
    return id.replace(/[^a-zA-Z0-9\_]+/g, "_"); // cannot have hyphens in callback function names
  },
  
  _sendRequest: function(resized) {
    //console.log("fetching...");
    this._exceeds = false;
    
    var layer = this.featureLayer, map = this.map, extent = resized || map.extent,
        gridInfo = this._gridLayer.getCellsInExtent(extent, layer.latticeTiling), 
        cells = gridInfo.cells;
    
    //console.log(gridInfo.minRow, gridInfo.maxRow, gridInfo.minCol, gridInfo.maxCol);
    
//    // debug
//    this._debugClear();
//    this._debugInfo(cells);

    if (!layer.isEditable()) {
      // filter out the cells that already have content (optimization for non-editable layers)
      var cellMap = this._cellMap;
      cells = dojo.filter(cells, function(cell) {
        // cell map lookup
        if (cell.lattice) {
          if (cellMap[cell.latticeID]) {
            return false;
          }
        }
        else if (cellMap[cell.row] && cellMap[cell.row][cell.col]) {
          return false;
        }
        return true;
      });
    }

    var fields = layer._getOutFields(),
        where = layer.getDefinitionExpression(),
        time = layer._getOffsettedTE(layer._mapTimeExtent),
        patch = layer._usePatch, ioQueue = this._ioQueue, i,
        self = this, func = this._drawFeatures, cell, query, callbackSuffix;
    //time && console.log("OnDemand ", "query.timeExtent: ", time.startTime, ", ", time.endTime);
    
    // send requests
    //this._pending = cells.length;
    this._pending = this._pending || 0;
    for (i = 0; i < cells.length; i++) {
      cell = cells[i];
      
      // query
      query = new esri.tasks.Query();
      query.geometry = cell.extent || cell.lattice;
      query.outFields = fields;
      query.where = where;
      if (layer.latticeTiling && cell.extent) {
        query.spatialRelationship = esri.tasks.Query.SPATIAL_REL_CONTAINS;
      }
      query.returnGeometry = true;
      query.timeExtent = time;
      query.maxAllowableOffset = layer._maxOffset;
      if (layer._ts) {
        query._ts = (new Date()).getTime();
      }
      
      callbackSuffix = null;
      if (patch) {
        // callback suffix
        callbackSuffix = this._getRequestId(layer, cell);
        
        // cancel the previous request for the given zoom level, row, col
        //this._cancelPendingRequest(callbackSuffix);
        
        if (this._isPending(callbackSuffix)) {
          continue;
        }
      }
    
      // execute
      //console.log("requesting for cell: ", cell.row, cell.col);
      this._pending++;
      ioQueue.push(layer._task.execute(query, function() {
        var cellInfo = cell;
        return function(response) { // callback
          func.apply(self, [ response, cellInfo ]);
        };
      }.call(this), this._queryErrorHandler, callbackSuffix));
    } // loop
    
    //console.log("pending = ", this._pending, ioQueue);
    this._removeOldCells(extent);
    this._endCheck();
  },
    
  _drawFeatures: function(response, cell) {
    //console.log("drawing " + cell.row + ", " + cell.col + "," + cell.resolution);
    this._exceeds = this._exceeds || response.exceededTransferLimit;
    this._finalizeIO();
    
    var layer = this.featureLayer, map = this.map, mExtent = map.extent, 
        cExtent = cell.extent, row = cell.row, col = cell.col, 
        oidField = layer.objectIdField,
        features = response.features, gridLayer = this._gridLayer,
        // lookup cell map
        cellMap = this._cellMap, i, len,
        cLatticeID = cell.latticeID,
        found = cLatticeID ? cellMap[cLatticeID] : (cellMap[row] && cellMap[row][col]);
    
    // don't add the cell if it does not intersect the current map extent or does not belong to this level
    if ( 
      (cell.resolution != gridLayer._resolution) || 
      ( 
        cLatticeID ? 
        (cLatticeID !== gridLayer.getLatticeID(mExtent)) : 
        (!gridLayer.intersects(cExtent, mExtent)) 
      )
    ) {
      if (found) {
        this._removeCell(row, col, cLatticeID);
      }
    }
    // already displayed, update it
    else if (found) {
      // update existing cell with new features
      this._updateCell(found, features);
    }
    else {
      // record
      cell.features = features;
      
      if (cLatticeID) {
        cellMap[cLatticeID] = cell;
      }
      else {
        cellMap[row] = cellMap[row] || {};
        cellMap[row][col] = cell;
      }
      
      len = features.length;
      
      // add features to the map
      for (i = 0; i < len; i++) {
        var feature = features[i];
        var oid = feature.attributes[oidField];
        
        //if (!layer._isDeleted(feature)) {
          this._addFeatureIIf(oid, feature);
          this._incRefCount(oid);
        //}
        //console.log(" [count] ", feature.attributes["STATE_NAME"], fmap[oid]._count);
      } // loop
    }
    
    // Be careful when adding code here! Consider branching above.

    // finalize the request    
    this._endCheck();
  },
  
  _queryErrorHandler: function(err) {
    //console.log("query error! ", err);
    
    this._finalizeIO();
    this.featureLayer._errorHandler(err);
    this._endCheck(true);
  },
  
  _finalizeIO: function() {
    this._purgeRequests();
    this._pending--;
  },
  
  _endCheck: function(isError) {
    if (this._pending === 0) {
      this._processIOQueue();
      
      // tracking functionality
      var layer = this.featureLayer, trackManager = layer._trackManager;
      if (trackManager) {
        trackManager.clearTracks();
        trackManager.addFeatures(layer.graphics);
        if (layer._ager) {
          dojo.forEach(layer.graphics, function(graphic) {
            if (graphic._shape) {
              layer._repaint(graphic);
            }
          });
        }
        trackManager.moveLatestToFront();
        trackManager.drawTracks();
      }
      
      this.featureLayer._fireUpdateEnd(
        isError && new Error("FeatureLayer: " + esri.bundle.layers.FeatureLayer.updateError),
        this._exceeds ? { queryLimitExceeded: true } : null
      );
      
      if (this._exceeds) {
        layer.onQueryLimitExceeded();
      }
    }
  },
  
  _processIOQueue: function(cancel) {
    this._ioQueue = dojo.filter(this._ioQueue, function(dfd) {
      var keep = dfd.fired > -1 ? /*success or error*/ false : /*initial condition*/ true;
      return keep;
    });
    
    if (cancel) {
      dojo.forEach(this._ioQueue, this._cancelPendingRequest);
    }
  },
  
  _removeOldCells: function(extent) {
    var cellMap = this._cellMap, gridLayer = this._gridLayer, rowNum, colNum;
    
    for (rowNum in cellMap) {
      if (cellMap[rowNum]) { // can be a rowNum or latticeID
        var row = cellMap[rowNum],
            cLatticeID = row.latticeID,
            count = 0, removed = 0;
        
        if (cLatticeID) { // lattice entry
          count++;
          if (cLatticeID !== gridLayer.getLatticeID(extent)) {
            this._removeCell(null, null, cLatticeID);
            removed++;
          }
        }
        else { // regular row/col entry
          for (colNum in row) {
            if (row[colNum]) {
              count++;
              var cExtent = row[colNum].extent;
              //if (!cExtent.intersects(extent)) { // remove the cell if it does not intersect the given extent
              if (!gridLayer.intersects(cExtent, extent)) {
                //console.log("[removing old cell] ", rowNum, colNum);
                this._removeCell(rowNum, colNum);
                removed++;
              } // does not intersect
            }
          } // cols
        }
        
        if (removed === count) { // empty row
          delete cellMap[rowNum];
        }
      }
    } // rows
  },
  
  _updateCell: function(cell, latestFeatures) {
    //console.log("_updateCell");
    var layer = this.featureLayer, oidField = layer.objectIdField, selected = layer._selectedFeatures,
        i, len = latestFeatures.length;
    
    cell.features = cell.features || [];
    
    for (i = 0; i < len; i++) {
      var feature = latestFeatures[i];
      var oid = feature.attributes[oidField];
      
      var found = this._addFeatureIIf(oid, feature);
      if (found === feature) { // this feature is a new member of the cell
        this._incRefCount(oid);
        cell.features.push(found);
      }
      else { // update the existing feature (geometry and attributes) if not selected
        if (!(oid in selected)) {
          found.setGeometry(feature.geometry);
          found.setAttributes(feature.attributes);
        }
      }
    } // for loop
  },
    
  _removeCell: function(row, col, cLatticeID) {
    var cellMap = this._cellMap, layer = this.featureLayer, oidField = layer.objectIdField;
    var cell = cLatticeID ? cellMap[cLatticeID] : (cellMap[row] && cellMap[row][col]);

    if (cell) {
      // delete cell map 
      if (cLatticeID) {
        delete cellMap[cLatticeID];
      }
      else {
        delete cellMap[row][col];
      }

      // remove cell's features
      var features = cell.features, i;
      for (i = 0; i < features.length; i++) {
        var feature = features[i];
        var oid = feature.attributes[oidField];
        //console.log("- attempting ", oid, feature.attributes["STATE_NAME"], row, col);
        this._decRefCount(oid);
        if (oid in layer._selectedFeatures) { // this may not be needed after all because we are ref-counting the selection.
          continue; // do not remove if this feature is currently selected. DON'T BREAK THE CONTRACT
        }
        this._removeFeatureIIf(oid);
        //console.log("--- removing ", oid, feature.attributes["STATE_NAME"], row, col);
      }
    } // if
  }//,
    
  /*************************
   * For debugging purposes
   *************************/
  
  /*_debugClear: function() {
    var gs = this._cellExtentGraphics, i;
    if (gs) {
      for (i = 0; i < gs.length; i++) {
        this.map.graphics.remove(gs[i]);
      }
      this._cellExtentGraphics = null;
    }
  },
  
  _debugInfo: function(cells) {
    // draw the cell extents
    var outline = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0, 0, 0, 1]), 1),
        i, symbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, outline, new dojo.Color([0, 0, 0, 0.25]));
    
    this._cellExtentGraphics = [];
    for (i = 0; i < cells.length; i++) {
      var polygon = this._extentToPolygon(this._gridLayer.getCellExtent(cells[i].row, cells[i].col));
      var graphic = new esri.Graphic(polygon, symbol);
      this.map.graphics.add(graphic);
      this._cellExtentGraphics.push(graphic);
    }
  },

  _extentToPolygon: function(extent) {
    //console.log("_extentToPolygon");
    var xmin = extent.xmin, ymin = extent.ymin, xmax = extent.xmax, ymax = extent.ymax;
    return new esri.geometry.Polygon({
      "rings": [
        [ [ xmin, ymin ], [ xmin, ymax ], [ xmax, ymax ], [ xmax, ymin ], [ xmin, ymin ] ]
      ],
      "spatialReference": extent.spatialReference.toJson()
    });
  }*/
});


/**************************
 * esri.layers._GridLayout
 **************************/

dojo.declare("esri.layers._GridLayout", null, {
  /*
   * cellSize = { width: <Number>, height: <Number> }
   * mapSize  = { width: <Number>, height: <Number> }
   */
  constructor: function(origin, cellSize, mapSize, srInfo) {
    this.origin = origin;
    this.cellWidth = cellSize.width;
    this.cellHeight = cellSize.height;
    this.mapWidth = mapSize.width;
    this.mapHeight = mapSize.height;
    this.srInfo = srInfo; // map wrapping is enabled and sr is wrappable
  },
  
  /*****************
   * Public Methods
   *****************/
  
  setResolution: function(mapExtent) {
    this._resolution = (mapExtent.xmax - mapExtent.xmin) / this.mapWidth;

    if (this.srInfo) {
      // Logic borrowed from tiled layer
      var pixelsCoveringWorld = Math.round((2 * this.srInfo.valid[1]) / this._resolution),
          numTiles = Math.round(pixelsCoveringWorld / this.cellWidth);
      
      this._frameStats = [ 
        /* #tiles */ numTiles, 
        /* -180 */ 0, 
        /* +180 */ numTiles - 1 
      ];
    }
  },
  
  getCellCoordinates: function(point) {
    //console.log("getCellCoordinates");
    var res = this._resolution,
        origin = this.origin;
    return {
      row: Math.floor((origin.y - point.y) / (this.cellHeight * res)),
      col: Math.floor((point.x - origin.x) / (this.cellWidth * res))
    };
  },
  
  normalize: function(col) {
    var frameStats = this._frameStats;
    if (frameStats) {
      // Logic borrowed from tiled layer
      var total_cols = frameStats[0], m180 = frameStats[1], p180 = frameStats[2];

      if (col < m180) {
        /*while (col < m180) {
          col += total_cols;
        }*/
        col = col % total_cols;
        col = col < m180 ? col + total_cols : col;
      }
      else if (col > p180) {
        /*while (col > p180) {
          col -= total_cols;
        }*/
        col = col % total_cols;
      }
    }
    
    return col;
  },
  
  intersects: function(cExtent, mExtent) {
    // cExtent assumed to be normalized already
    // and does not span across dateline
    
    var srInfo = this.srInfo;
    if (srInfo) {
      return dojo.some(mExtent._getParts(srInfo), function(mePart) {
        return cExtent.intersects(mePart.extent);
      });
    }
    else {
      return cExtent.intersects(mExtent);
    }
  },
  
  getCellExtent: function(row, col) {
    //console.log("getCellExtent");
    var res = this._resolution,
        origin = this.origin,
        cellWidth = this.cellWidth,
        cellHeight = this.cellHeight;
        
    return new esri.geometry.Extent(
      (col * cellWidth * res) + origin.x,
      origin.y - ( (row + 1) * cellHeight * res),
      ( (col + 1) * cellWidth * res) + origin.x,
      origin.y - (row * cellHeight * res),
      new esri.SpatialReference(origin.spatialReference.toJson())
    );
  },
  
  getLatticeID: function(mExtent) {
    var topLeftCoord = this.getCellCoordinates({ x: mExtent.xmin, y: mExtent.ymax }),
        bottomRightCoord = this.getCellCoordinates({ x: mExtent.xmax, y: mExtent.ymin }),
        minRow = topLeftCoord.row, 
        maxRow = bottomRightCoord.row,
        minCol = this.normalize(topLeftCoord.col), 
        maxCol = this.normalize(bottomRightCoord.col);
        
    return minRow + "_" + maxRow + "_" + minCol + "_" + maxCol;
  },
  
  sorter: function(a, b) {
    return (a < b) ? -1 : 1;
  },
  
  getCellsInExtent: function(extent, needLattice) {
    //console.log("getCellsInExtent");
    var topLeftCoord = this.getCellCoordinates({ x: extent.xmin, y: extent.ymax }),
        bottomRightCoord = this.getCellCoordinates({ x: extent.xmax, y: extent.ymin }),
        minRow = topLeftCoord.row, maxRow = bottomRightCoord.row,
        minCol = topLeftCoord.col, maxCol = bottomRightCoord.col,
        cells = [], i, j, nj, xcoords = [], ycoords = [], 
        len, xmin, xmax, ymin, ymax, paths = [], lattice, latticeID;
        
    for (i = minRow; i <= maxRow; i++) {
      for (j = minCol; j <= maxCol; j++) {
        nj = this.normalize(j);
        extent = this.getCellExtent(i, nj);
        
        cells.push({ 
          row: i, col: nj, 
          extent: extent, 
          resolution: this._resolution 
        });
        
        if (needLattice) {
          xcoords.push(extent.xmin, extent.xmax);
          ycoords.push(extent.ymin, extent.ymax);
        }
      }
    }
    //console.log(cells);
    
    minCol = this.normalize(minCol);
    maxCol = this.normalize(maxCol);
    
    // create a unique lost of x-coordinatesd and y-coordinates
    xcoords.sort(this.sorter);
    ycoords.sort(this.sorter);
    
    len = xcoords.length;
    for (i = len - 1; i >= 0; i--) {
      if (i < (len - 1)) {
        if (xcoords[i] === xcoords[i + 1]) {
          xcoords.splice(i, 1);
        }
      }
    }
    
    len = ycoords.length;
    for (i = len - 1; i >= 0; i--) {
      if (i < (len - 1)) {
        if (ycoords[i] === ycoords[i + 1]) {
          ycoords.splice(i, 1);
        }
      }
    }
    //console.log(xcoords, ycoords);
    
    // create the lattice
    if (xcoords.length && ycoords.length) {
      xmin = xcoords[0];
      xmax = xcoords[xcoords.length - 1];
      ymin = ycoords[0];
      ymax = ycoords[ycoords.length - 1];
      //console.log(xmin, xmax, ymin, ymax);
  
      len = xcoords.length;
      for (i = 0; i < len; i++) {
        // a line from ymax to ymin at this x-coordinate
        paths.push([ 
          [xcoords[i], ymax],
          [xcoords[i], ymin]
        ]);
      }
  
      len = ycoords.length;
      for (i = 0; i < len; i++) {
        // a line from xmin to xmax at this y-coordinate
        paths.push([
          [xmin, ycoords[i]],
          [xmax, ycoords[i]]
        ]);
      }
      
      lattice = new esri.geometry.Polyline({
        paths: paths,
        spatialReference: this.origin.spatialReference.toJson()
      });

      latticeID = minRow + "_" + maxRow + "_" + minCol + "_" + maxCol;
      
      //console.log("lattice = ", paths.length, dojo.toJson(lattice.toJson()));
      //console.log("key = " + latticeID);
      
      cells.push({
        latticeID: latticeID,
        lattice: lattice, // a polyline
        resolution: this._resolution
      });
    }
    
    return {
      minRow: minRow,
      maxRow: maxRow,
      minCol: minCol,
      maxCol: maxCol,
      cells: cells
    }; // cellInfo
  }
});

  
/****************************
 * esri.layers._TrackManager
 ****************************/

dojo.declare("esri.layers._TrackManager", null, {
  constructor: function(layer) {
    this.layer = layer;
    this.trackMap = {};
  },
  
  initialize: function(map) {
    this.map = map;
    
    var layer = this.layer, trackRenderer = layer.renderer.trackRenderer;
    if (trackRenderer && (layer.geometryType === "esriGeometryPoint")) {
      // TODO
      // Investigate the feasibility of doing this using a 
      // GroupElement or GroupGraphic that can be added to 
      // a graphics layer
      
      var container = (this.container = new esri.layers._GraphicsLayer({ 
        id: layer.id + "_tracks",
        _child: true 
      }));
      
      //container._onPanHandler = function() {}; // we don't want "translate" applied twice on pan
      container._setMap(map, layer._div);
      container.setRenderer(trackRenderer);
    }
  },
  
  addFeatures: function(features) {
    var tkid, trackMap = this.trackMap, layer = this.layer, tkidField = layer._trackIdField;
    
    // create a list of all the tracks and their corresponding features
    dojo.forEach(features, function(feature) {
      var attributes = feature.attributes; 
      tkid = attributes[tkidField];
      var ary = (trackMap[tkid] = (trackMap[tkid] || []));
      ary.push(feature);
    });

    // sort features in each track from oldest to newest
    var timeField = layer._startTimeField, oidField = layer.objectIdField;
    
    var sorter = function(a, b) {
      var time1 = a.attributes[timeField], time2 = b.attributes[timeField];
      if (time1 === time2) {
        // See:
        // http://code.google.com/p/v8/issues/detail?id=324
        // http://code.google.com/p/v8/issues/detail?id=90
        return (a.attributes[oidField] < b.attributes[oidField]) ? -1 : 1;
      }
      else {
        return (time1 < time2) ? -1 : 1;
      }
    };
    
    for (tkid in trackMap) {
      trackMap[tkid].sort(sorter);
      
      /*var ary = trackMap[tkid];
      ary.sort(function(a, b){
        var time1 = a.attributes[timeField], time2 = b.attributes[timeField];
        if (time1 === time2) {
          // See:
          // http://code.google.com/p/v8/issues/detail?id=324
          // http://code.google.com/p/v8/issues/detail?id=90
          return (a.attributes[oidField] < b.attributes[oidField]) ? -1 : 1;
        }
        else {
          return (time1 < time2) ? -1 : 1;
        }

//        if (time1 < time2) {
//          return -1;
//        }
//        if (time1 >= time2) {
//          return 1;
//        }
//        return 0;
      });*/
      
//      if (latestRendering) {
//        layer._repaint(ary[ary.length - 1]);
//      }
    }
  },
  
  drawTracks: function() {
    var container = this.container;
    if (!container) {
      return;
    }
    
    var trackMap = this.trackMap, sr = this.map.spatialReference,
        tkid, ary, path, i, point, tkidField = this.layer._trackIdField,
        attrs;
    
    /*var mapper = function(feature) {
      var point = feature.geometry;
      return [point.x, point.y];
    };*/
    
    // draw track lines
    for (tkid in trackMap) {
      // create polyline representing a track and add it to the container
      //var path = dojo.map(trackMap[tkid], mapper);
      ary = trackMap[tkid];
      path = [];
      
      for (i = ary.length - 1; i >=0 ; i--) {
        point = ary[i].geometry;
        
        if (point) {
          path.push([ point.x, point.y ]);
        }
      }
      
      attrs = {};
      attrs[tkidField] = tkid;
      
      if (path.length > 0) {
        container.add(
          new esri.Graphic(
            new esri.geometry.Polyline({ paths: [path], spatialReference: sr }),
            null,
            attrs
          )
        );
      }
    }
  },
  
  moveLatestToFront: function() {
    /*var layer = this.layer;
    if (!layer.renderer.latestObservationRenderer) {
      return;
    }
    
    var trackMap = this.trackMap;
    
    for (var tkid in trackMap) {
      var ary = trackMap[tkid];
      var graphic = ary[ary.length - 1], shape = graphic._shape;
      shape && shape._moveToFront();
      layer._repaint(graphic);
    }*/

    dojo.forEach(this.getLatestObservations(), function(graphic) {
      var shape = graphic._shape;
      shape && shape._moveToFront();
      this._repaint(graphic, null, true);
    }, this.layer);
  },
  
  getLatestObservations: function() {
    var retVal = [];
    if (!this.layer.renderer.latestObservationRenderer) {
      return retVal;
    }
    
    var trackMap = this.trackMap, tkid;
    
    for (tkid in trackMap) {
      var ary = trackMap[tkid];
      retVal.push(ary[ary.length - 1]);
    }
    
    return retVal;
  },
  
  clearTracks: function() {
    var latest = this.getLatestObservations();
    
    this.trackMap = {};
    var container = this.container;
    if (container) {
      container.clear();
    }
    
    dojo.forEach(latest, function(graphic) {
      this._repaint(graphic, null, true);
    }, this.layer);
  },
  
  isLatestObservation: function(feature) {
    var tkidField = this.layer._trackIdField;
    var track = this.trackMap[feature.attributes[tkidField]];
    if (track) {
      return (track[track.length - 1] === feature); 
    }
    return false;
  },
  
  destroy: function() {
    var container = this.container;
    if (container) {
      container.clear();
      container._unsetMap(this.map, this.layer._div);
      this.container = null;
    }
    this.map = null;
    this.layer = null;
    this.trackMap = null;
  }
});

});

},
'dojox/charting/plot2d/Bubble':function(){
define("dojox/charting/plot2d/Bubble", ["dojo/_base/lang", "dojo/_base/declare", "dojo/_base/array", 
		"./Base", "./common", "dojox/lang/functional", "dojox/lang/functional/reversed", 
		"dojox/lang/utils", "dojox/gfx/fx"], 
	function(lang, declare, arr, Base, dc, df, dfr, du, fx){
/*=====
var Base = dojox.charting.plot2d.Base;
=====*/

	var purgeGroup = dfr.lambda("item.purgeGroup()");

	return declare("dojox.charting.plot2d.Bubble", Base, {
		//	summary:
		//		A plot representing bubbles.  Note that data for Bubbles requires 3 parameters,
		//		in the form of:  { x, y, size }, where size determines the size of the bubble.
		defaultParams: {
			hAxis: "x",		// use a horizontal axis named "x"
			vAxis: "y",		// use a vertical axis named "y"
			animate: null   // animate bars into place
		},
		optionalParams: {
			// theme component
			stroke:		{},
			outline:	{},
			shadow:		{},
			fill:		{},
			font:		"",
			fontColor:	""
		},

		constructor: function(chart, kwArgs){
			//	summary:
			//		Create a plot of bubbles.
			//	chart: dojox.charting.Chart
			//		The chart this plot belongs to.
			//	kwArgs: dojox.charting.plot2d.__DefaultCtorArgs?
			//		Optional keyword arguments object to help define plot parameters.
			this.opt = lang.clone(this.defaultParams);
            du.updateWithObject(this.opt, kwArgs);
            du.updateWithPattern(this.opt, kwArgs, this.optionalParams);
            this.series = [];
			this.hAxis = this.opt.hAxis;
			this.vAxis = this.opt.vAxis;
			this.animate = this.opt.animate;
		},

		//	override the render so that we are plotting only circles.
		render: function(dim, offsets){
			//	summary:
			//		Run the calculations for any axes for this plot.
			//	dim: Object
			//		An object in the form of { width, height }
			//	offsets: Object
			//		An object of the form { l, r, t, b}.
			//	returns: dojox.charting.plot2d.Bubble
			//		A reference to this plot for functional chaining.
			if(this.zoom && !this.isDataDirty()){
				return this.performZoom(dim, offsets);
			}
			this.resetEvents();
			this.dirty = this.isDirty();
			if(this.dirty){
				arr.forEach(this.series, purgeGroup);
				this._eventSeries = {};
				this.cleanGroup();
				var s = this.group;
				df.forEachRev(this.series, function(item){ item.cleanGroup(s); });
			}

			var t = this.chart.theme,
				ht = this._hScaler.scaler.getTransformerFromModel(this._hScaler),
				vt = this._vScaler.scaler.getTransformerFromModel(this._vScaler),
				events = this.events();

			for(var i = this.series.length - 1; i >= 0; --i){
				var run = this.series[i];
				if(!this.dirty && !run.dirty){
					t.skip();
					this._reconnectEvents(run.name);
					continue;
				}
				run.cleanGroup();
				if(!run.data.length){
					run.dirty = false;
					t.skip();
					continue;
				}

				if(typeof run.data[0] == "number"){
					console.warn("dojox.charting.plot2d.Bubble: the data in the following series cannot be rendered as a bubble chart; ", run);
					continue;
				}

				var theme = t.next("circle", [this.opt, run]), s = run.group,
					points = arr.map(run.data, function(v, i){
						return v ? {
							x: ht(v.x) + offsets.l,
							y: dim.height - offsets.b - vt(v.y),
							radius: this._vScaler.bounds.scale * (v.size / 2)
						} : null;
					}, this);

				var frontCircles = null, outlineCircles = null, shadowCircles = null;

				// make shadows if needed
				if(theme.series.shadow){
					shadowCircles = arr.map(points, function(item){
						if(item !== null){
							var finalTheme = t.addMixin(theme, "circle", item, true),
								shadow = finalTheme.series.shadow;
							var shape = s.createCircle({
								cx: item.x + shadow.dx, cy: item.y + shadow.dy, r: item.radius
							}).setStroke(shadow).setFill(shadow.color);
							if(this.animate){
								this._animateBubble(shape, dim.height - offsets.b, item.radius);
							}
							return shape;
						}
						return null;
					}, this);
					if(shadowCircles.length){
						run.dyn.shadow = shadowCircles[shadowCircles.length - 1].getStroke();
					}
				}

				// make outlines if needed
				if(theme.series.outline){
					outlineCircles = arr.map(points, function(item){
						if(item !== null){
							var finalTheme = t.addMixin(theme, "circle", item, true),
								outline = dc.makeStroke(finalTheme.series.outline);
							outline.width = 2 * outline.width + theme.series.stroke.width;
							var shape = s.createCircle({
								cx: item.x, cy: item.y, r: item.radius
							}).setStroke(outline);
							if(this.animate){
								this._animateBubble(shape, dim.height - offsets.b, item.radius);
							}
							return shape;
						}
						return null;
					}, this);
					if(outlineCircles.length){
						run.dyn.outline = outlineCircles[outlineCircles.length - 1].getStroke();
					}
				}

				//	run through the data and add the circles.
				frontCircles = arr.map(points, function(item){
					if(item !== null){
						var finalTheme = t.addMixin(theme, "circle", item, true),
							rect = {
								x: item.x - item.radius,
								y: item.y - item.radius,
								width:  2 * item.radius,
								height: 2 * item.radius
							};
						var specialFill = this._plotFill(finalTheme.series.fill, dim, offsets);
						specialFill = this._shapeFill(specialFill, rect);
						var shape = s.createCircle({
							cx: item.x, cy: item.y, r: item.radius
						}).setFill(specialFill).setStroke(finalTheme.series.stroke);
						if(this.animate){
							this._animateBubble(shape, dim.height - offsets.b, item.radius);
						}
						return shape;
					}
					return null;
				}, this);
				if(frontCircles.length){
					run.dyn.fill   = frontCircles[frontCircles.length - 1].getFill();
					run.dyn.stroke = frontCircles[frontCircles.length - 1].getStroke();
				}

				if(events){
					var eventSeries = new Array(frontCircles.length);
					arr.forEach(frontCircles, function(s, i){
						if(s !== null){
							var o = {
								element: "circle",
								index:   i,
								run:     run,
								shape:   s,
								outline: outlineCircles && outlineCircles[i] || null,
								shadow:  shadowCircles && shadowCircles[i] || null,
								x:       run.data[i].x,
								y:       run.data[i].y,
								r:       run.data[i].size / 2,
								cx:      points[i].x,
								cy:      points[i].y,
								cr:      points[i].radius
							};
							this._connectEvents(o);
							eventSeries[i] = o;
						}
					}, this);
					this._eventSeries[run.name] = eventSeries;
				}else{
					delete this._eventSeries[run.name];
				}

				run.dirty = false;
			}
			this.dirty = false;
			return this;	//	dojox.charting.plot2d.Bubble
		},
		_animateBubble: function(shape, offset, size){
			fx.animateTransform(lang.delegate({
				shape: shape,
				duration: 1200,
				transform: [
					{name: "translate", start: [0, offset], end: [0, 0]},
					{name: "scale", start: [0, 1/size], end: [1, 1]},
					{name: "original"}
				]
			}, this.animate)).play();
		}
	});
});

},
'*noref':1}});

require(["dojo/i18n"], function(i18n){
i18n._preloadLocalizations("esri/arcgis/nls/utils", []);
});
// wrapped by build app
define("esri/arcgis/utils", ["dijit","dojo","dojox","dojo/require!esri/map,esri/layers/agsimageservice,esri/layers/osm,esri/layers/FeatureLayer,esri/layers/KMLLayer,esri/layers/wms,esri/virtualearth/VETiledLayer,esri/tasks/geometry,dojo/DeferredList,esri/dijit/Popup,esri/arcgis/csv"], function(dijit,dojo,dojox){
dojo.provide("esri.arcgis.utils");

dojo.require("esri.map");
dojo.require("esri.layers.agsimageservice");
dojo.require("esri.layers.osm");
dojo.require("esri.layers.FeatureLayer");
dojo.require("esri.layers.KMLLayer");
dojo.require("esri.layers.wms");
dojo.require("esri.virtualearth.VETiledLayer");
dojo.require("esri.tasks.geometry");
dojo.require("dojo.DeferredList");
dojo.require("esri.dijit.Popup");
dojo.require("esri.arcgis.csv");

// NOTE
// Make sure you also include /js/esri/dijit/css/Popup.css in the application

(function(){

  var EAU = esri.arcgis.utils;
  
  EAU.arcgisUrl = location.protocol + "//www.arcgis.com/sharing/rest/content/items";
  
  String.prototype.endsWith = function(str){
    return (this.match(str + "$") == str);
  };
  
  /*****************
   * Public methods
   *****************/
  EAU.getItem = function(/*String*/itemId){
  
    // for backward compatibility
    if (EAU._arcgisUrl && EAU._arcgisUrl.length > 0) {
      EAU.arcgisUrl = EAU._arcgisUrl;
    }
    
    var url = EAU.arcgisUrl + "/" + itemId;
    var retVal = {}, deferred = new dojo.Deferred();
    
    esri.request({
      url: url,
      content: {
        f: "json"
      },
      callbackParamName: "callback",
      
      load: function(response){
        retVal.item = response;
        
        esri.request({
          url: url + "/data",
          content: {
            f: "json"
          },
          callbackParamName: "callback",
          
          load: function(response){
            retVal.itemData = response;
            deferred.callback(retVal);
          },
          
          error: function(error){
            deferred.errback(error);
          }
        }); // end of inner request
      },
      
      error: function(error){
        deferred.errback(error);
      }
    }); // end of outer request
    return deferred;
  };
  
  /**
   * Notes about the behavior:
   * Errback will be called under the following conditions:
   * - getItem failed
   * - the base map layer cannot be loaded
   */
  EAU.createMap = function(/*itemId or {item, itemData}*/arg1, /*String or DOM Node*/ mapDiv, /*Object?*/ options){
    var deferred = new dojo.Deferred();
    options = options || {};
    
    // Determine the info template class
    var clazz = options.infoTemplateClass;
    options._clazz = (clazz && dojo.getObject(clazz)) || esri.dijit.PopupTemplate;
    
    if (dojo.isString(arg1)) {
      EAU.getItem(arg1).addCallback(function(response1){
        EAU._getItemProps(response1, options).addCallback(function(response){
          EAU._getLayers(response.itemData, options).addCallback(dojo.hitch(null, EAU._preCreateMap, response, mapDiv, options, deferred));
        });
      }).addErrback(dojo.hitch(deferred, deferred.errback));
    } else {
      EAU._getItemProps(arg1, options).addCallback(function(response){
        EAU._getLayers(response.itemData, options).addCallback(dojo.hitch(null, EAU._preCreateMap, response, mapDiv, options, deferred));
      });
    }
    
    return deferred;
  };
  
  
  /*******************
   * Internal methods
   *******************/
  // keep for backward compatibility
  EAU._arcgisUrl = null;
  
  // check if some of the map service items used in this webmap have item properties set
  EAU._getItemProps = function(createMapResponse, options){
  
    var deferred = new dojo.Deferred();
    
    var webMap = createMapResponse.itemData;
    var deferreds = [];
    var layers = [];
    
    dojo.forEach(webMap.operationalLayers, function(layer){
      // an empty layers list ([]) means that the user doesn't want item properties (pop-ups,renderer,scales) from the service item either
      if (layer.itemId && !layer.type) {
        if (layer.url.indexOf("/FeatureServer") > -1) {
          layers.push(layer);
          deferreds.push(EAU._getItemData(layer));
        } else if (!layer.layers && layer.url.indexOf("/MapServer") > -1 && layer.url.indexOf("/MapServer/") === -1) {
          layers.push(layer);
          deferreds.push(EAU._getItemData(layer));
        }
      }
    });
    if (deferreds.length > 0) {
      var deferredsList = new dojo.DeferredList(deferreds);
      deferredsList.addCallback(function(response){
        dojo.forEach(layers, function(layer, i){
          var itemData = response[i][1]; // deferreds[i].ioArgs.json;
          if (itemData && itemData.layers) {
            if (layer.url.indexOf("/FeatureServer") > -1) {
              dojo.forEach(itemData.layers, function(props){
                if (layer.url.endsWith("/FeatureServer/" + props.id)) {
                  layer.itemProperties = props;
                  EAU._processFSItemProperties(layer);
                }
              });
            } else {
              layer.layers = itemData.layers;
            }
          } // else ignore error
        });
        deferred.callback(createMapResponse);
      });
    } else {
      deferred.callback(createMapResponse);
    }
    return deferred;
  };
  
  EAU._getItemData = function(operationalLayer){
  
    var url = EAU.arcgisUrl + "/" + operationalLayer.itemId + "/data";
    
    var request = esri.request({
      url: url,
      content: {
        f: "json"
      },
      callbackParamName: "callback"
    }); // ignore error; we won't have a popup then
    return request;
  };
  
  EAU._processFSItemProperties = function(layer){
  
    // layer object is not created yet
    if (layer.itemProperties.layerDefinition) {
      if (layer.layerDefinition) {
        if (!layer.layerDefinition.drawingInfo) {
          layer.layerDefinition.drawingInfo = layer.itemProperties.layerDefinition.drawingInfo;
        }
        if (!layer.layerDefinition.definitionExpression) {
          layer.layerDefinition.definitionExpression = layer.itemProperties.layerDefinition.definitionExpression;
        }
        if (layer.layerDefinition.minScale === null) {
          layer.layerDefinition.minScale = layer.itemProperties.layerDefinition.minScale;
        }
        if (layer.layerDefinition.maxScale === null) {
          layer.layerDefinition.maxScale = layer.itemProperties.layerDefinition.maxScale;
        }
      } else {
        layer.layerDefinition = layer.itemProperties.layerDefinition;
      }
    }
    
    if (layer.itemProperties.popupInfo && !layer.popupInfo && !layer.disablePopup) {
      layer.popupInfo = layer.itemProperties.popupInfo;
    }
  };
  
  EAU._getLayers = function(webMap, options){
    var layers = [];
    var deferreds = [];
    var newOpLayers = [];
    var deferred = new dojo.Deferred();
    
    dojo.forEach(webMap.operationalLayers, function(layer, index){ //look for feature collections and explode them out as individual feature layers
      if (layer.featureCollection) {
        dojo.forEach(layer.featureCollection.layers, function(fcLayer, idx){
					// operational layer must be visible and layer index must be in visibleLayers list for layer to be visible 
					var layerVisible = true;
					if (layer.visibleLayers) {
						if (dojo.indexOf(layer.visibleLayers, idx) == -1) {
							layerVisible = false;
						}
					}
          fcLayer.visibility = (layer.visibility && layerVisible);
          fcLayer.opacity = layer.opacity;
          fcLayer.id = (layer.id || ("operational" + index)) + "_" + idx;
          newOpLayers.push(fcLayer);
        }, this);
      } else {
        newOpLayers.push(layer);
      }
    });
    
    // TODO
    // Find another way to pass "id" to _initLayer instead of
    // adding it as a member of the layer object. Also, other
    // properties like "baseMapLayer", "resourceInfo", "errors"
    // "deferredsPos", "layerObject"
    dojo.forEach(webMap.baseMap.baseMapLayers, function(layer, index){
      layer.baseMapLayer = true;
      layer.id = layer.id || ("base" + index);
      layers.push(layer);
    });
    dojo.forEach(newOpLayers, function(layer, index){
      layer.id = layer.id || ("operational" + index);
      layers.push(layer);
    });
    
    dojo.forEach(layers, function(layer){
      if (layer.url && !layer.type) {
        // ArcGIS
        layer.deferredsPos = deferreds.length;
        layer.errors = [];
        deferreds.push(EAU._getServiceInfo(layer.url, layer.errors));
        // no mapSR yet				
        //      } else {
        //        layer.layerObject = EAU._initLayer(layer, layers, options);
      } else if (layer.url && layer.type == "CSV") {
        // CSV by reference
        layer.deferredsPos = deferreds.length;
        deferreds.push(esri.arcgis.csv.buildCSVFeatureCollection(layer));
      }
    });
    
    if (deferreds.length == 0) {
      // map contains no ArcGIS or CSV by reference layers
      var mapSR = EAU._getMapSR(layers);
      layers = EAU._buildLayerObjects(layers, options, mapSR);
      deferred.callback(layers);
    } else {
      var deferredsList = new dojo.DeferredList(deferreds);
      deferredsList.addCallback(function(response){
        EAU._preBuildLayerObjects(response, layers, options, deferreds, deferred);
      });
    }
    
    return deferred;
  };
  
  EAU._preBuildLayerObjects = function(response, layers, options, deferreds, deferred){
  
    dojo.forEach(layers, function(layer, index){
      if (layer.url && !layer.type) {
        // ArcGIS
				//if (deferreds[layer.deferredsPos] && deferreds[layer.deferredsPos].ioArgs) {
					layer.resourceInfo = response[layer.deferredsPos][1]; //deferreds[layer.deferredsPos].ioArgs.json;
					delete layer.deferredsPos;
				//}
      } else if (layer.url && layer.type == "CSV") {
        // CSV by reference
        layer.featureCollection = deferreds[layer.deferredsPos].results[0];
        delete layer.deferredsPos;
      }
    });
    
    var mapSR = EAU._getMapSR(layers);
    
    // project 'CSV by reference' feature collection into correct spatial reference
    var deferreds2 = [];
    var deferred2 = new dojo.Deferred();
    
    dojo.forEach(layers, function(layer){
      if (layer.url && layer.type == "CSV") {
        // CSV by reference
        layer.deferredsPos = deferreds2.length;
        deferreds2.push(esri.arcgis.csv.projectFeatureCollection(layer.featureCollection, mapSR));
      }
    });
    
    if (deferreds2.length == 0) {
      // map contains no CSV by reference layers
      layers = EAU._buildLayerObjects(layers, options, mapSR);
      deferred.callback(layers);
    } else {
      var deferredsList = new dojo.DeferredList(deferreds2);
      deferredsList.addCallback(function(){
        dojo.forEach(layers, function(layer){
          if (layer.url && layer.type == "CSV") {
            // CSV by reference
            layer.featureCollection = deferreds2[layer.deferredsPos].results[0];
            delete layer.deferredsPos;
          }
        });
        
        layers = EAU._buildLayerObjects(layers, options, mapSR);
        deferred.callback(layers);
      });
    }
  };
  
  EAU._buildLayerObjects = function(layers, options, mapSR){
  
    dojo.forEach(layers, function(layer, index){
      if (layer.url && !layer.type) {
        // ArcGIS
        if (index === 0 || layers[0].layerObject) {
          layer.layerObject = EAU._initLayer(layer, layers, options, mapSR);
        }
      } else if (layer.url && layer.type == "CSV") {
        // CSV by reference
        layer.layerObject = EAU._initLayer(layer, layers, options, mapSR);
      } else {
        layer.layerObject = EAU._initLayer(layer, layers, options, mapSR);
      }
    });
    
    var nonRefLayers = dojo.filter(layers, function(lyr){
      return !lyr.isReference;
    });
    var refLayers = dojo.filter(layers, function(lyr){
      return !!lyr.isReference;
    });
    layers = nonRefLayers.concat(refLayers);
    return layers;
  };
  
  EAU._preCreateMap = function(itemInfo, mapDiv, options, deferred, layers){
  
    try {
    
      var mapOptions = options.mapOptions || {};
      
      // mapOptions.extent is updated below. _createMap will not
      // see this extent unless we either do this here or add one more arg
      // to _createMap passing in "mapOptions" in addition to "options".
      options.mapOptions = mapOptions;
      
      var card = itemInfo.item;
      
      //add other layers
      var mapLayers = [];
      dojo.forEach(layers, function(layer){
        if (dojo.isArray(layer.layerObject)) {
          // e.g. KML
          dojo.forEach(layer.layerObject, function(l){
            mapLayers.push(l);
          });
        } else {
          mapLayers.push(layer.layerObject);
        }
      });
      
      if (!mapLayers[0]) {
        deferred.errback(new Error(esri.bundle.arcgis.utils.baseLayerError));
        return;
      }
      
      // lets not try to add layers that could not be loaded
      mapLayers = dojo.filter(mapLayers, esri._isDefined);
      
      if (card) {
        if (card.extent) {
          if (!mapOptions.extent) {
            // convert the item card GCS extent into basemap spatial reference
            var extentGCS = new esri.geometry.Extent(card.extent[0][0], card.extent[0][1], card.extent[1][0], card.extent[1][1], new esri.SpatialReference({
              wkid: 4326
            }));
            var basemapSR = mapLayers[0].spatialReference;
            if (basemapSR.wkid === 4326) {
              mapOptions.extent = extentGCS;
              EAU._createMap(mapLayers, layers, itemInfo, mapDiv, options, deferred);
            } else if (basemapSR.wkid === 102100 || basemapSR.wkid === 102113 || basemapSR.wkid === 3857) {
              // clip it, so it's not going to Infinity; otherwise the map doesn't load
              extentGCS.xmin = Math.max(extentGCS.xmin, -180);
              extentGCS.xmax = Math.min(extentGCS.xmax, 180);
              extentGCS.ymin = Math.max(extentGCS.ymin, -89.99);
              extentGCS.ymax = Math.min(extentGCS.ymax, 89.99);
              mapOptions.extent = esri.geometry.geographicToWebMercator(extentGCS);
              EAU._createMap(mapLayers, layers, itemInfo, mapDiv, options, deferred);
            } else {
              if (options.geometryServiceURL || esri.config.defaults.geometryService) {
                var gs;
                if (options.geometryServiceURL) {
                  gs = new esri.tasks.GeometryService(options.geometryServiceURL);
                } else {
                  gs = esri.config.defaults.geometryService;
                }
                gs.project([extentGCS], basemapSR, function(geometries){
                  var mapExtent = geometries[0];
                  mapOptions.extent = mapOptions.extent || mapExtent;
                  EAU._createMap(mapLayers, layers, itemInfo, mapDiv, options, deferred);
                });
              } else {
                deferred.errback(new Error(esri.bundle.arcgis.utils.geometryServiceError));
                //EAU._createMap(mapLayers, layers, itemInfo, mapDiv, options, deferred);
              }
            }
          } else {
            EAU._createMap(mapLayers, layers, itemInfo, mapDiv, options, deferred);
          }
        } else {
          EAU._createMap(mapLayers, layers, itemInfo, mapDiv, options, deferred);
        }
      } else {
        EAU._createMap(mapLayers, layers, itemInfo, mapDiv, options, deferred);
      }
      
    } 
    catch (err) {
      deferred.errback(err);
    }
    //_preCreateMap
  };
  
  EAU._getMapSR = function(layers){
  
    // first layer in map defines map spatial reference
    var mapSR = null;
    var layer = layers[0];
    if (layer.url && !layer.type) {
      // ArcGIS
      if (layer.resourceInfo.spatialReference) {
        mapSR = new esri.SpatialReference();
        if (layer.resourceInfo.spatialReference.wkid) {
          mapSR.wkid = layer.resourceInfo.spatialReference.wkid;
        }
        if (layer.resourceInfo.spatialReference.wkt) {
          mapSR.wkt = layer.resourceInfo.spatialReference.wkt;
        }
      }
    } else if (layer.type.indexOf("BingMaps") > -1 || layer.type == "OpenStreetMap") {
      // BING, OSM
      mapSR = new esri.SpatialReference({
        wkid: 102100
      });
    } else if (layer.type == "WMS") {
      // WMS
      mapSR = new esri.SpatialReference({
        wkid: layer.spatialReferences[0]
      });
    }
    return mapSR;
  };
  
  EAU._createMap = function(mapLayers, layers, itemInfo, mapDiv, options, deferred){
    var mapOptions = (options.mapOptions || {}), popup, handle;
    
    if (!mapOptions.infoWindow) {
      popup = new esri.dijit.Popup(null, dojo.create("div"));
      
      mapOptions.infoWindow = popup;
    }
    
    // Let's disable map's built-in behavior that
    // shows info window when a graphic is clicked
    //map.setInfoWindowOnClick(false);
    if (!esri._isDefined(mapOptions.showInfoWindowOnClick)) {
      mapOptions.showInfoWindowOnClick = false;
    }
    
    var map = new esri.Map(mapDiv, mapOptions);
    
    /*if (popup) {
     // Map would have finished creating its DOM structure
     // when the constructor above returns. Placing popup
     // inside the "root" eliminates the need to position map
     // container as "relative"
     dojo.place(popup.domNode, map.root);
     }*/
    
    if (options.ignorePopups) {
      // TODO
      // We need to not create InfoTemplates instead of
      // creating them elsewhere and deleting here
      dojo.forEach(mapLayers, function(mapLayer){
        delete mapLayer.infoTemplate;
      });
    }
    
    if (!(options.ignorePopups || options.disableClickBehavior)) {
      // TODO
      // Do I have to add click behavior even when
      // webmap does not have any popup defined?
      // Probably not.
      // We need to make this decision after selection
      // layers have been identified and processed
      handle = dojo.connect(map, "onClick", EAU._showPopup);
    }
    
    dojo.connect(map, "onLayersAddResult", EAU._onLayersAddResult);
    
    map.addLayers(mapLayers);
    
    if (!options.ignorePopups) {
      // add these layers after the basemap is added
      EAU._addSelectionLayers(mapLayers, map, options._clazz);
    }
    
    var errors = [];
    dojo.forEach(layers, function(layer){
      errors = errors.concat(layer.errors);
    }, this);
    
    deferred.callback({
      map: map,
      itemInfo: itemInfo,
      errors: errors,
      clickEventHandle: handle,
      clickEventListener: EAU._showPopup
    });
  };
  
  EAU._addSelectionLayers = function(mapLayers, map, clazz){
    // Add feature layers (in selection only mode) for map
    // service sublayers
    
    var deferreds = [];
    
    dojo.forEach(mapLayers, function(mapLayer){
      var popups = mapLayer.__popups; // see _loadAsDynamic function 
      if (popups && popups.length > 1 && mapLayer.version >= 10) {
        mapLayer.__deferredsPos = deferreds.length;
        deferreds.push(EAU._getLayersInfo(mapLayer));
      }
    });
    
    var selectionLayers = [];
    if (deferreds.length > 0) {
      var deferredsList = new dojo.DeferredList(deferreds);
      deferredsList.addCallback(function(response){
        dojo.forEach(mapLayers, function(mapLayer){
          if (mapLayer.__popups && mapLayer.__popups.length > 0) {
            if (mapLayer.__deferredsPos || mapLayer.__deferredsPos === 0) {
              var result = response[mapLayer.__deferredsPos][1]; //deferreds[mapLayer.__deferredsPos].ioArgs.json;
              selectionLayers = selectionLayers.concat(EAU._createSelectionFeatureLayers(mapLayer, result.layers, clazz, map));
              delete mapLayer.__deferredsPos;
            } else {
              selectionLayers = selectionLayers.concat(EAU._createSelectionFeatureLayers(mapLayer, null, clazz, map));
            }
          }
        });
        map.addLayers(selectionLayers);
      });
    } else {
      dojo.forEach(mapLayers, function(mapLayer){
        if (mapLayer.__popups && mapLayer.__popups.length > 0) {
          selectionLayers = selectionLayers.concat(EAU._createSelectionFeatureLayers(mapLayer, null, clazz, map));
        }
      });
      map.addLayers(selectionLayers);
    }
  };
  
  EAU._createSelectionFeatureLayers = function(mapLayer, layers, clazz, map){
    var url = mapLayer.url;
    var popups = mapLayer.__popups; // see _loadAsDynamic function 
    var ids = mapLayer.__popupIds;
    var urls = mapLayer.__popupUrls;
    var serviceResourceInfo = mapLayer.__resourceInfo;
    
    var selectionLayers = [];
    
    dojo.forEach(popups, function(popup, index){
      var i, resourceInfo = null;
      if (layers) {
        for (i = 0; i < layers.length; i++) {
          if (layers[i].id === ids[index]) {
            resourceInfo = layers[i];
            break;
          }
        }
      }

      var queryUrl = url + "/" + ids[index];
			if (urls[index].length) {
				queryUrl = urls[index];
			}
      
      var featureLayer = new esri.layers.FeatureLayer(EAU._checkUrl(queryUrl), {
        id: mapLayer.id + '_' + ids[index],
        outFields: ["*"],
        mode: esri.layers.FeatureLayer.MODE_SELECTION,
        infoTemplate: popup && new clazz(popup),
        drawMode: false,
        visible: mapLayer.visible,
        resourceInfo: resourceInfo,
        autoGeneralize: true
    });
      
      // to fix group layer scale issue for servers <= 10.1
      if (featureLayer.loaded) {
        EAU._updateLayerScaleInfo(serviceResourceInfo.layers, featureLayer);
			} else {
				dojo.connect(featureLayer, "onLoad", function(layer){
					EAU._updateLayerScaleInfo(serviceResourceInfo.layers, layer);
				});
			}
      
      selectionLayers.push(featureLayer);
    });
		
		if (selectionLayers.length > 0) {
			var onVisibilityChange = function(selectionLayers, visibility) {
        dojo.forEach(selectionLayers, function(layer) {
					if (visibility) {
						layer.show();
					} else {
						layer.hide();
					}
				});
      };
      dojo.connect(mapLayer, "onVisibilityChange", dojo.hitch(this, onVisibilityChange, selectionLayers));

      var onLayerRemove = function(mapLayer, selectionLayers, removedLayer) {
				if (mapLayer.id === removedLayer.id) {
					dojo.forEach(selectionLayers, function(layer){
  					map.removeLayer(layer);
					});
				}
      };
      dojo.connect(map, "onLayerRemove", dojo.hitch(this, onLayerRemove, mapLayer, selectionLayers));
		}
    
    delete mapLayer.__popups;
    delete mapLayer.__popupIds;
		delete mapLayer.__popupUrls;
    delete mapLayer.__resourceInfo;
    
    return selectionLayers;
  };
  
  EAU._getServiceInfo = function(url, errors){
		var url2 = EAU._checkUrl(url);
    return esri.request({
      url: url2,
      content: {
        f: "json"
      },
      callbackParamName: "callback",
      error: function(error, io){
        if (error.message) {
          error.message += " [url:" + url2 + "]";
        } else {
          error.message = "[url:" + url2 + "]";
        }
        errors.push(error);
        esri.config.defaults.io.errorHandler(error, io);
      }
    });
  };
  
  EAU._getLayersInfo = function(mapLayer){
    return esri.request({
      url: EAU._checkUrl(mapLayer.url + "/layers"),
      content: {
        f: "json"
      },
      callbackParamName: "callback",
      error: function(){
        // don't do anything
      }
    });
  };
  
  EAU._initLayer = function(layerObject, layers, options, mapSR){
    //console.log("initLayer " + (layerObject.url) ? layerObject.url : layerObject.type);
    var layer, clazz = options._clazz;
		
    if (layerObject.type === "OpenStreetMap") {
    
      layer = new esri.layers.OpenStreetMapLayer({
        id: layerObject.id
      });
      
    } else if (layerObject.type === "WMS") {
    
      // make all layers visible by default if not specified otherwise
      var visibleLayers = [];
      var layerInfos = [];
      dojo.forEach(layerObject.layers, function(layer){
        layerInfos.push(new esri.layers.WMSLayerInfo({
          name: layer.name,
          title: layer.title,
          legendURL: layer.legendURL
        }));
        visibleLayers.push(layer.name);
      }, this);
      
      if (layerObject.visibleLayers) {
        visibleLayers = layerObject.visibleLayers;
      }
      
      var gcsExtent = new esri.geometry.Extent(layerObject.extent[0][0], layerObject.extent[0][1], layerObject.extent[1][0], layerObject.extent[1][1], new esri.SpatialReference({
        wkid: 4326
      }));
      
      var resourceInfo = {
        extent: gcsExtent,
        layerInfos: layerInfos,
        version: layerObject.version,
        maxWidth: layerObject.maxWidth,
        maxHeight: layerObject.maxHeight,
        getMapUrl: layerObject.mapUrl,
        spatialReferences: layerObject.spatialReferences,
        title: layerObject.title,
        copyright: layerObject.copyright
      };
      
      layer = new esri.layers.WMSLayer(layerObject.url, {
        id: layerObject.id,
        visibleLayers: visibleLayers,
        format: "png",
        transparent: layerObject.baseMapLayer ? false : true,
        opacity: layerObject.opacity,
        visible: (layerObject.visibility !== null) ? layerObject.visibility : true,
        resourceInfo: resourceInfo
      });

      // layer should be set to first id in spatial reference list
      layer.spatialReference.wkid = resourceInfo.spatialReferences[0];
      
    } else if (layerObject.type === "KML") {
    
      layer = new esri.layers.KMLLayer(layerObject.url, {
        id: layerObject.id,
				visible: (layerObject.visibility !== null) ? layerObject.visibility : true,
        outSR: mapSR
      });

      dojo.connect(layer, "onLoad", function(){

        var setKMLLayerOpacity = function(internalLayers){
					dojo.forEach(internalLayers, function(llayer){
						if (llayer.declaredClass === "esri.layers.FeatureLayer" || llayer.declaredClass === "esri.layers.MapImageLayer") {
							llayer.setOpacity(layerObject.opacity);
						} else if (llayer.declaredClass === "esri.layers.KMLLayer") {
              if (llayer.loaded) {
                setKMLLayerOpacity(llayer.getLayers());
							} else {
								dojo.connect(llayer, "onLoad", dojo.hitch(this, function(lyr){
                  setKMLLayerOpacity(lyr.getLayers());
								}));
							}
						}
					});
				};
        if (layerObject.opacity !== null) {
          setKMLLayerOpacity(layer.getLayers());
        }
        
        if (layerObject.visibleFolders) {
          dojo.forEach(layer.folders, function(folder){
            if (dojo.indexOf(layerObject.visibleFolders, folder.id) > -1) {
              layer.setFolderVisibility(folder, true);
            } else {
              layer.setFolderVisibility(folder, false);
            }
          }, this);
        }
      });
      
    } else if (layerObject.type == "CSV" && layerObject.url) {
    
      layer = new esri.layers.FeatureLayer(layerObject.featureCollection, {
        infoTemplate: new esri.dijit.PopupTemplate(layerObject.popupInfo ? layerObject.popupInfo : esri.arcgis.csv.generateDefaultPopupInfo(layerObject.featureCollection)),
        id: layerObject.id ? layerObject.id : null,
        outFields: ["*"],
        visible: (layerObject.visibility !== null) ? layerObject.visibility : true,
        opacity: layerObject.opacity ? layerObject.opacity : 1,
        autoGeneralize: true
      });
      
    } else if (layerObject.layerDefinition && !layerObject.url) { //feature layer from featureCollection
      var clonedLayerObject = dojo.fromJson(dojo.toJson(layerObject)); //clone to eliminate circular reference problems with _json property in featurelayer
      delete clonedLayerObject.id;
      delete clonedLayerObject.opacity;
      delete clonedLayerObject.visibility;
      
      layer = new esri.layers.FeatureLayer(clonedLayerObject, {
        id: layerObject.id,
        opacity: layerObject.opacity,
        visible: layerObject.visibility,
        outFields: ["*"],
        infoTemplate: clonedLayerObject.popupInfo && new clazz(clonedLayerObject.popupInfo),
        autoGeneralize: true
      });
      
    } else if (layerObject.type === "BingMapsAerial" || layerObject.type === "BingMapsRoad" || layerObject.type === "BingMapsHybrid") {
    
      var style = esri.virtualearth.VETiledLayer.MAP_STYLE_AERIAL_WITH_LABELS; // type == "BingMapsHybrid"
      if (layerObject.type === "BingMapsAerial") {
        style = esri.virtualearth.VETiledLayer.MAP_STYLE_AERIAL;
      } else if (layerObject.type === "BingMapsRoad") {
        style = esri.virtualearth.VETiledLayer.MAP_STYLE_ROAD;
      }
      
      // load as Bing layer
      layer = new esri.virtualearth.VETiledLayer({
        bingMapsKey: options.bingMapsKey,
        mapStyle: style,
        id: layerObject.id
      });
      
    } else if (layerObject.resourceInfo && layerObject.resourceInfo.mapName) {
    
      //map service
      if (layerObject.resourceInfo.singleFusedMapCache === true) {
        if (!layerObject.baseMapLayer) {
          if (EAU._sameSpatialReferenceAsBasemap(layerObject, layers)) {
            if (EAU._sameTilingSchemeAsBasemap(layerObject, layers)) {
              layer = EAU._loadAsCached(layerObject);
            } else {
              layer = EAU._loadAsDynamic(layerObject);
            }
          } else {
            layer = EAU._loadAsDynamic(layerObject);
          }
        } else {
          layer = EAU._loadAsCached(layerObject);
        }
      } else {
        layer = EAU._loadAsDynamic(layerObject);
      }
      
    } else if (layerObject.resourceInfo && layerObject.resourceInfo.pixelSizeX) {
    
      //image service
      var imageServiceParameters = new esri.layers.ImageServiceParameters();
      imageServiceParameters.bandIds = layerObject.bandIds;
      if (!layerObject.bandIds && layerObject.resourceInfo.bandCount && parseInt(layerObject.resourceInfo.bandCount, 10) > 3) {
        imageServiceParameters.bandIds = [0, 1, 2];
      }
      layer = new esri.layers.ArcGISImageServiceLayer(EAU._checkUrl(layerObject.url), {
        resourceInfo: layerObject.resourceInfo,
        opacity: layerObject.opacity,
        visible: layerObject.visibility,
        id: layerObject.id,
        imageServiceParameters: imageServiceParameters
      });
      
    } else if (layerObject.resourceInfo && layerObject.resourceInfo.type === "Feature Layer") {
    
      //Feature layer
      layer = new esri.layers.FeatureLayer(EAU._checkUrl(layerObject.url), {
        resourceInfo: layerObject.resourceInfo,
        opacity: layerObject.opacity,
        visible: layerObject.visibility,
        id: layerObject.id,
        mode: esri._isDefined(layerObject.mode) ? layerObject.mode : esri.layers.FeatureLayer.MODE_ONDEMAND,
        outFields: ['*'],
        infoTemplate: layerObject.popupInfo && new clazz(layerObject.popupInfo),
        autoGeneralize: true
      });
      
      if (layerObject.layerDefinition) {
      
        // is there a renderer defined for the layer
        if (layerObject.layerDefinition.drawingInfo && layerObject.layerDefinition.drawingInfo.renderer) {
          var renderer = esri.renderer.fromJson(layerObject.layerDefinition.drawingInfo.renderer);
          layer.setRenderer(renderer);
        }
        
        if (layerObject.layerDefinition.definitionExpression) {
          layer.setDefinitionExpression(layerObject.layerDefinition.definitionExpression);
        }
        
        if (esri._isDefined(layerObject.layerDefinition.minScale)) {
          layer.minScale = layerObject.layerDefinition.minScale;
        }
        if (esri._isDefined(layerObject.layerDefinition.maxScale)) {
          layer.maxScale = layerObject.layerDefinition.maxScale;
        }
      }
    } // else layer is not accessible or of unknown type
    
		if (layer) {
			layer.arcgisProps = {
				title: layerObject.title
			};
		}
		 
    return layer;
    //_initLayer
  };
  
  EAU._loadAsCached = function(layerObject){
    var serviceLods = [];
    
    if (!layerObject.displayLevels) {
      serviceLods = dojo.map(layerObject.resourceInfo.tileInfo.lods, function(lod){
        return lod.level;
      });
    }
    
    var layer = new esri.layers.ArcGISTiledMapServiceLayer(EAU._checkUrl(layerObject.url) , {
      resourceInfo: layerObject.resourceInfo,
      opacity: layerObject.opacity,
      visible: layerObject.visibility,
      displayLevels: layerObject.displayLevels || serviceLods,
      id: layerObject.id
    });
    
    EAU._processPopups(layer, layerObject);
    
    return layer;
  };
  
  EAU._loadAsDynamic = function(layerObject){
  
    var imageParameters = new esri.layers.ImageParameters();
    imageParameters.format = "png24";
    if (layerObject.resourceInfo && layerObject.resourceInfo.supportedImageFormatTypes && layerObject.resourceInfo.supportedImageFormatTypes.indexOf("PNG32") > -1) {
      imageParameters.format = "png32";
    }
    
    var layer = new esri.layers.ArcGISDynamicMapServiceLayer(EAU._checkUrl(layerObject.url), {
      resourceInfo: layerObject.resourceInfo,
      opacity: layerObject.opacity,
      visible: layerObject.visibility,
      id: layerObject.id,
      imageParameters: imageParameters
    });
    
    if (!layerObject.visibleLayers) {
      // get service default list
      var subIds = "";
      var layerInfos = layer.layerInfos;
      dojo.forEach(layerInfos, function(layerInfo){
        if (layerInfo.defaultVisibility) {
          subIds += (subIds.length > 0 ? "," : "") + layerInfo.id;
        }
      });
      layerObject.visibleLayers = subIds;
    }
    // don't list the group layers 
    var visibleLayers = EAU._getVisibleFeatureLayers(layer.layerInfos, layerObject.visibleLayers);
    layer.setVisibleLayers(visibleLayers);
    
    if (layerObject.layers && layerObject.layers.length > 0) {
      var layerDefinitions = [];
      dojo.forEach(layerObject.layers, function(layerInfo){
        if (layerInfo.layerDefinition && layerInfo.layerDefinition.definitionExpression) {
          layerDefinitions[layerInfo.id] = layerInfo.layerDefinition.definitionExpression;
        }
      }, this);
      if (layerDefinitions.length > 0) {
        layer.setLayerDefinitions(layerDefinitions);
      }
    }
    
    EAU._processPopups(layer, layerObject);
    
    return layer;
  };
  
  EAU._processPopups = function(layer, layerObject){
  
    // Process popups defined for the map service
    var layerInfos = layer.layerInfos;
    var popupLayers = layerObject.layers;
    if (popupLayers && layerInfos) {
      var popups = [], ids = [], urls = [];
      
      dojo.forEach(layerInfos, function(layerInfo){
        var id = layerInfo.id, i;
        if (!layerInfo.subLayerIds && dojo.indexOf(layer.visibleLayers, id) !== -1) {
          for (i = 0; i < popupLayers.length; i++) {
            var popupLayer = popupLayers[i];
            if (popupLayer.id === id) {
              ids.push(id);
              popups.push(popupLayer.popupInfo);
							urls.push(popupLayer.layerUrl || "");
              break;
            }
          }
        }
      });
      
      if (popups.length) {
        layer.__popups = popups;
        layer.__popupIds = ids;
				layer.__popupUrls = urls;
        layer.__resourceInfo = layerObject.resourceInfo;
      }
    }
  };
  
  EAU._onLayersAddResult = function(results){
    // add text symbols
    dojo.forEach(results, function(result){
      var layer = result.layer;
      if (layer.toJson) {
        var json = layer.toJson();
        if (json.featureSet && layer.name.indexOf("Text") > -1) {
          // create text graphics
          dojo.forEach(json.featureSet.features, function(feature, idx){
            if (feature.attributes.TEXT) {
              // graphic is there, but symbol is not quite right
              var graphic = layer.graphics[idx];
              graphic.symbol.setText(feature.attributes.TEXT);
              if (feature.symbol.horizontalAlignment) {
                graphic.symbol.align = feature.symbol.horizontalAlignment;
              }
              graphic.setSymbol(graphic.symbol);
              graphic.setAttributes(feature.attributes);
            }
          }, this);
        }
      }
    });
  };
  
  EAU._sameSpatialReferenceAsBasemap = function(layerObject, layers){
    var mercator = [102113, 102100, 3857];
    
    // basemap layer
    var sp1 = layers[0].layerObject.fullExtent.spatialReference;
    
    // operational layer
    var sp2 = new esri.SpatialReference(layerObject.resourceInfo.fullExtent.spatialReference);
    
    if (dojo.toJson(sp1.toJson()) === dojo.toJson(sp2.toJson())) {
      return true;
    } else if (dojo.some(mercator, function(wkid){
      return wkid === sp2.wkid;
    }) &&
    dojo.some(mercator, function(wkid){
      return wkid === sp1.wkid;
    })) {
      return true;
    }
    return false;
  };
  
  EAU._sameTilingSchemeAsBasemap = function(layerObject, layers){
    // is basemap a cached service?
    if (!layers[0].layerObject.tileInfo) {
      return false;
    }
    
    // get all basemap lod scales
    var basemapScales = [];
    dojo.forEach(layers, function(layer){
      if (layer.baseMapLayer) {
        if (layer.layerObject.tileInfo) {
          basemapScales = basemapScales.concat(dojo.map(layer.layerObject.tileInfo.lods, function(lod){
            return lod.scale;
          }));
        }
      }
    });
    
    // if one scale value is the same we assume they fit
    var areEqual = dojo.some(layerObject.resourceInfo.tileInfo.lods, function(lod){
      return dojo.some(basemapScales, function(bScale){
        return bScale === lod.scale;
      });
    });
    
    //console.log(areEqual);
    return areEqual;
  };
  
  /****************
   * Map Behaviors
   ****************/
  EAU._showPopup = function(evt){
    //console.log("Map clicked");
    
    var map = this, infoWindow = map.infoWindow, clickedGraphic = evt.graphic;
    if (!map.loaded) {
      return;
    }
    
    infoWindow.hide();
    infoWindow.clearFeatures();
    
    // Get relevant feature layers from the map
    var featureLayers = [];
    dojo.forEach(map.graphicsLayerIds, function(layerId){
      var layer = map.getLayer(layerId);
      
      if (layer && layer.declaredClass.indexOf("FeatureLayer") !== -1 && layer.loaded && layer.visible) {
        layer.clearSelection();
        
        if (layer.infoTemplate && !layer._suspended) {
          // layer is in scale ...
          featureLayers.push(layer);
        }
      }
    });
    
    // Let's make sure this graphic is of interest to us.
    // Note: It's important that we're checking for this "here"
    // after any previous feature layer selection has been cleared above.
    clickedGraphic = (clickedGraphic && clickedGraphic._getEffInfoTemplate()) ? clickedGraphic : null;
    
    if (!featureLayers.length && !clickedGraphic) {
      //console.log("No valid feature layers");
      return;
    }
    
    var tolerance = EAU._calculateClickTolerance(featureLayers);
    // Calculate the query extent
    var screenPoint = evt.screenPoint, bottomLeft = map.toMap(new esri.geometry.Point(screenPoint.x - tolerance, screenPoint.y + tolerance)), topRight = map.toMap(new esri.geometry.Point(screenPoint.x + tolerance, screenPoint.y - tolerance)), extent = new esri.geometry.Extent(bottomLeft.x, bottomLeft.y, topRight.x, topRight.y, map.spatialReference);
    
    // Create query parameters
    var query = new esri.tasks.Query();
    query.geometry = extent;
    query.timeExtent = map.timeExtent;
    
    // Perform selection
    var selectionDeferreds = dojo.map(featureLayers, function(layer){
      var dfd = layer.selectFeatures(query);
      
      dfd.addCallback(function(){
        var selectedFeatures = layer.getSelectedFeatures();
        // Let's take care of the duplicate selections in
        // the Popup impl
        //console.log(" Selected features: ", selectedFeatures.length, selectedFeatures);
        
        // Make sure we return the array of features here because
        // Popup impl expects to receive an array of features.
        return selectedFeatures; // gets passed on to the popup impl
      });
      
      return dfd;
    });
    
    if (clickedGraphic) {
      var dfd = new dojo.Deferred();
      dfd.callback([clickedGraphic]);
      selectionDeferreds.splice(0, 0, dfd);
    }
    
    //console.log("Selection deferreds: ", selectionDeferreds);
    
    // Let's verify if all deferreds have been "fired". If so,
    // are there any features found?
    var pending = dojo.some(selectionDeferreds, function(dfd){
      return dfd.fired === -1;
    });
    
    if (!pending) {
      // All deferreds have been resolved
      var count = clickedGraphic ? 1 : 0;
      dojo.forEach(featureLayers, function(layer){
        count = count + layer.getSelectedFeatures().length;
      });
      
      if (!count) {
        // There are no selected features. Let's exit.
        //console.log("All deferreds resolved but no features.");
        return;
      }
    }
    
    infoWindow.setFeatures(selectionDeferreds);
    infoWindow.show(evt.mapPoint, {
      closestFirst: true
    });
  };
  
  EAU._calculateClickTolerance = function(featureLayers){
    // take a big symbol offset into consideration
    var tolerance = 6;
    dojo.forEach(featureLayers, function(layer){
      var renderer = layer.renderer;
      if (renderer.declaredClass === "esri.renderer.SimpleRenderer") {
        var symbol = renderer.symbol;
        if (symbol && symbol.xoffset) {
          tolerance = Math.max(tolerance, Math.abs(symbol.xoffset));
        }
        if (symbol && symbol.yoffset) {
          tolerance = Math.max(tolerance, Math.abs(symbol.yoffset));
        }
      } else if (renderer.declaredClass === "esri.renderer.UniqueValueRenderer" || renderer.declaredClass === "esri.renderer.ClassBreaksRenderer") {
        dojo.forEach(renderer.infos, function(info){
          // kml servlet sometimes returns renderer.infos with no symbol at all
          var symbol = info.symbol;
          if (symbol && symbol.xoffset) {
            tolerance = Math.max(tolerance, Math.abs(symbol.xoffset));
          }
          if (symbol && symbol.yoffset) {
            tolerance = Math.max(tolerance, Math.abs(symbol.yoffset));
          }
        });
      }
    });
    return tolerance;
  };
  
  EAU._getVisibleFeatureLayers = function(layerInfos, visibleLayers){
    // don't list the group layers
    if (!layerInfos || !visibleLayers || visibleLayers.length === 0) {
      return [];
    }
    
    var tocLayers = "," + visibleLayers + ",";
    var realVisibleLayers = [];
    var comma = "";
    var k, dontUseLayerIds = ",";
    for (k = 0; k < layerInfos.length; k++) {
      if (layerInfos[k].subLayerIds !== null) {
        if (tocLayers.indexOf("," + layerInfos[k].id + ",") === -1 || dontUseLayerIds.indexOf("," + layerInfos[k].id + ",") > -1) {
          // group layer is switched off or it's inside a group layer that's switched off
          dontUseLayerIds += layerInfos[k].subLayerIds.toString() + ",";
        }
        //else {
        // group layer is switched on and not inside a switched off group layer
        //}
      } else if (tocLayers.indexOf("," + layerInfos[k].id + ",") > -1 && dontUseLayerIds.indexOf("," + layerInfos[k].id + ",") === -1) {
        // layer is switched on and is not a group layer and not inside a switched off group layer
        realVisibleLayers.push(layerInfos[k].id);
        comma = ",";
      } // else layer is switched off or is inside a switched off group layer
    }
    return realVisibleLayers;
  };
  
  EAU._updateLayerScaleInfo = function(layers, layer){
    // for ArcGIS < v10.1 beta2 one must also consider parent layer scale info
    // and this works only for ArcGIS v10.01 where scale info gets returned for each layer in a service info request
    // nothing (reasonable) that can be done for ArcGIS <= v10.0
    if (layer.version <= 10.1 && layers) {
      var i, id = parseInt(layer.url.substring(layer.url.lastIndexOf("/") + 1, layer.url.length));
      // layers are ordered by id
      for (i = layers.length - 1; i >= 0; i--) {
        if (layers[i].id == id) {
          // merge scales
          if (layer.minScale == 0 && layers[i].minScale > 0) {
            layer.minScale = layers[i].minScale;
          } else if (layer.minScale > 0 && layers[i].minScale == 0) {
            layer.minScale = layer.minScale;
          } else if (layer.minScale > 0 && layers[i].minScale > 0) {
            layer.minScale = Math.min(layer.minScale, layers[i].minScale);
          }
          layer.maxScale = Math.max(layer.maxScale || 0, layers[i].maxScale || 0);
          // is this layer in a group layer?
          if (layers[i].parentLayerId > -1) {
            id = layers[i].parentLayerId;
          } else {
            break;
          }
        }
      }
    }
  };
  
  EAU._checkUrl = function(url){
		if (location.protocol === "https:" && (EAU._isHostedService(url) || EAU._isAgolService(url))) {
			url = url.replace('http:', 'https:');
		}
		return url;
	};
	
  EAU._isHostedService = function(url){
    if (!url) {
      return false;
    }
    // hosted service: http://services.arcgis.com/<id>/arcgis/rest/services/<title>/FeatureServer
    // uploaded KML service: http://www.arcgis.com/sharing/content/items/<id>/data
    var arcgis = ".arcgis.com/";
    var sharing = (new dojo._Url(EAU.arcgisUrl)).authority;
    return (url.indexOf(arcgis) !== -1 || url.indexOf(sharing) !== -1);
  }; 
  
  EAU._isAgolService = function(url){
    if (!url) {
      return false;
    }
    return (url.indexOf("/services.arcgisonline.com/") !== -1 || url.indexOf("/server.arcgisonline.com/") !== -1);
  };
	  
}()); // end of module anonymous

});
