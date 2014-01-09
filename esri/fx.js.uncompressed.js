//>>built
// wrapped by build app
define("esri/fx", ["dijit","dojo","dojox","dojo/require!dojo/fx"], function(dijit,dojo,dojox){
dojo.provide("esri.fx");

dojo.require("dojo.fx");

esri.fx.animateRange = function(/*Object*/ args) {
  //summary: Returns an animation for animating numbers in a given range
  // args: Object: Parameters for creating range animation
  //     : range: Object: Object representing range for start and end
  //     : range.start: Number: Starting of range
  //     : range.end: Number: End of range
  var range = args.range;
  return new dojo._Animation(dojo.mixin({
    curve:new dojo._Line(range.start, range.end)
  }, args));
};

esri.fx.resize = function(/*Object*/ args) {
  //summary: Returns an animation for resizing args.node.
  //  args: Object: Parameters for creating resize animation
  //      : node: DOMNode: Node to be resized
  //      : start: {left,top,width,height}: Start dimesions for node resizing. Overrides dimensions of node
  //      : end: {left,top,width,height}: End dimesions for node resizing. Overrides args.size and args.anchor
  //      : anchor: {x,y}: Point to be used as anchor point for resizing. If no anchor is specified and using size, the top-left of the node will be used as anchor
  //      : size: {width,height}: Ending width and height of node

  var node = (args.node = dojo.byId(args.node)),
  start = args.start,
  end = args.end;

  if (! start) {
    var mb = dojo._getMarginBox(node),
    pb = dojo._getPadBorderExtents(node);
    start = (args.start = { left:mb.l + pb.l, top:mb.t + pb.t, width:mb.w - pb.w, height:mb.h - pb.h });
  }

  if (! end) {
    var anchor = args.anchor ? args.anchor : { x:start.left, y:start.top },
    size = args.size;
    end = args.end = { left:(start.left - ((size.width - start.width) * (anchor.x - start.left) / start.width)),
                 top:(start.top - ((size.height - start.height) * (anchor.y - start.top) / start.height)),
                 width:size.width,
                 height:size.height };
  }

  return dojo.animateProperty(dojo.mixin({
		properties: {
      left: { start:start.left, end:end.left },
			top: { start:start.top, end:end.top },
      width: { start:start.width, end:end.width },
      height: { start:start.height, end:end.height }
		}
	}, args));
};

esri.fx.slideTo = function(/*Object?*/ args){
	// summary
	//		Returns an animation that will slide "node" 
	//		defined in args Object from its current position to
	//		the position defined by (args.left, args.top).

	var node = (args.node = dojo.byId(args.node)),
	    compute = dojo.getComputedStyle,

	    top = null,
	    left = null,

	init = (function(){
		var innerNode = node;
		return function(){
      var pos = innerNode.style.position == "absolute" ? "absolute" : "relative";
			top = (pos == 'absolute' ? node.offsetTop : parseInt(compute(node).top) || 0);
			left = (pos == 'absolute' ? node.offsetLeft : parseInt(compute(node).left) || 0);

			if(pos != 'absolute' && pos != 'relative'){
				var ret = dojo.coords(innerNode, true);
				top = ret.y;
				left = ret.x;
				innerNode.style.position="absolute";
				innerNode.style.top=top+"px";
				innerNode.style.left=left+"px";
			}
		};
	})();
	init();

	var anim = dojo.animateProperty(dojo.mixin({
		properties: {
			top: { start: top, end: args.top||0 },
			left: { start: left, end: args.left||0 }
		}
	}, args));
	dojo.connect(anim, "beforeBegin", anim, init);

	return anim; // dojo._Animation
};

esri.fx.flash = function(/*Object*/ args) {
  // summary: Returns any animation to flash args.node background color.
  // node: HTMLElement: The node to flash
  // start?: String: Starting color. Defaults to current background color.
  // end?: String: Ending color. Defaults is "#f00" (red)
  // count?: Number: Number of times to flash. Default is 1
  args = dojo.mixin({ end:"#f00", duration:500, count:1 }, args);
  args.duration /= args.count * 2;

  var node = dojo.byId(args.node),
      start = args.start;
  if (! start) {
    start = dojo.getComputedStyle(node).backgroundColor;
  }
  
  var end = args.end,
      duration = args.duration,
      anims = [],
      base = { node:node, duration:duration };
  for (var i=0, il=args.count; i<il; i++) {
    anims.push(dojo.animateProperty(dojo.mixin({ properties:{ backgroundColor:{ start:start, end:end } } }, base)));
    anims.push(dojo.animateProperty(dojo.mixin({ properties:{ backgroundColor:{ start:end, end:start } } }, base)));
  }
  return dojo.fx.chain(anims);
};
});
