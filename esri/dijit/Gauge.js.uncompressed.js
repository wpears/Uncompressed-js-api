//>>built
// wrapped by build app
define("esri/dijit/Gauge", ["dijit","dojo","dojox","dojo/require!dojo/cache,dijit/_Widget,dijit/_Templated,dojox/widget/AnalogGauge,dojox/widget/gauge/AnalogArcIndicator"], function(dijit,dojo,dojox){
dojo.provide("esri.dijit.Gauge");

dojo.require("dojo.cache");
dojo.require("dijit._Widget");
dojo.require("dijit._Templated");
dojo.require("dojox.widget.AnalogGauge");
dojo.require("dojox.widget.gauge.AnalogArcIndicator");

dojo.declare("esri.dijit.Gauge", [dijit._Widget, dijit._Templated], {
  templateString: dojo.cache("esri.dijit", "templates/Gauge.html", "<div class=\"gaugeContainer\">\r\n  <div data-dojo-attach-point=\"titleNode\" class=\"gaugeTitle\">${title}</div>\r\n  <div data-dojo-attach-point=\"dataLabelWrapperNode\">\r\n    <div data-dojo-attach-point=\"dataLabelNode\">${dataLabel}</div>\r\n  </div>\r\n  <div data-dojo-attach-point=\"gaugeNode\" style=\"margin: -10px auto 10px auto; width: 240px; height: 120px;\"></div>\r\n  <div data-dojo-attach-point=\"captionNode\" class=\"gaugeCaption\">${caption}</div>\r\n</div>\r\n"),
  widgetsInTemplate: false,
  constructor: function(options, srcRefNode) {
    // expected properties and values for the options argument:
    //  caption:  text to display below the gauge
    //  color:  color for the gauge indicator
    //  dataField:  attribute field used to drive the gauge
    //  dataFormat:  whether to display an actual value or a percentage, valid values are "value" or "percentage", tick marks are only added when this is "percentage"
    //  dataLabelField:  attribute field to use display a feature's name, displayed below gauge title
    //  maxDataValue:  maximum value for the gauge
    //  noDataLabel:  string to use when a feature doesn't have a value for dataLabelField
    //  numberFormat:  object passed to dojo.number.format, see dojo documentation for details:  http://dojotoolkit.org/api/1.6/dojo/number, most common options:  specify a number of decimal places, for instance: { "places": 2 }
    //  title:  title for the gauge
    //  unitLabel:  label attribute field being displayed, use "" for no label
    //  fromWebmap:  boolean, if true, all options listed above are ignored and the JSON from a webmap is used to create the gauge
    //
    // srcRefNode is the DOM node where the gauge will be created

    // set up widget defaults
    this.caption = "&nbsp;";
    this.color = "#000";
    this.dataFormat = "value";
    this.maxDataValue = 100;
    this.title = "&nbsp;";
    this.unitLabel = "";
    this.fromWebmap = false;

    // used to keep a reference to the current graphic
    this.feature = null;

    // start with no feature name
    this.dataLabel = "&nbsp;";

    // mixin constructor options 
    dojo.safeMixin(this, options);

    // default is to not show ticks on the gauge
    this._majorTicks = "";
    
    // initialize value to zero
    this.value = 0;

    // default to zero decimal places if numberFormat is not provided
    this.numberFormat = this.numberFormat || { "places": 0 };

    if ( this.fromWebmap ) {
      // map properties from webmap JSON gadget to names that the gauge widget expected
      this.dataField = this.field;
      this.dataFormat = this.valueLabel;
      this.dataLabelField = this.displayField;
      this.maxDataValue = this.target;
      this.unitLabel = "";
    }

    if ( this.dataFormat == "percentage" ) {
      this.unitLabel = "%";
      this._majorTicks = { offset: 90, interval: 25, length: 3, color: "black" };
    }

    // watch updates of public properties and update the widget accordingly
    this.watch("caption", this._updateCaption);
    this.watch("dataLabel", this._updateDataLabel); 
    this.watch("title", this._updateTitle);
    this.watch("value", this._updateValue); 
    this.watch("feature", this._updateFeature); 
  },

  startup: function() {
    this.inherited(arguments);

    // create gauge now that the template has been inserted into the DOM
    // using startup instead of postCreate because some element
    // dimensions are needed
    var gaugeBackground = new dojox.widget.gauge.AnalogArcIndicator({
      interactionMode: "gauge",
      noChange: true,
      value: this.maxDataValue,
      width: 20,
      offset: 65,
      color: [204, 204, 204, 1], 
      title: "value",
      hideValue: true,
      duration: 100 // default in dojo is 1000
    });
    
    var indicator = new dojox.widget.gauge.AnalogArcIndicator({
      interactionMode: "gauge",
      noChange: false,
      value: this.value,
      width: 20,
      offset: 65,
      color: this.color,
      title: "value",
      hideValue: true,
      duration: 100 // default in dojo is 1000
    });

    this.gaugeWidget = new dojox.widget.AnalogGauge({
      background: [204, 204, 204, 0.0],
      width: parseInt(this.gaugeNode.style.width),
      height: parseInt(this.gaugeNode.style.height) + 10, // add 10 px so ticks show
      cx: parseInt(this.gaugeNode.style.width) / 2, 
      cy: parseInt(this.gaugeNode.style.height),
      style: "position: absolute;",
      radius: parseInt(this.gaugeNode.style.width) / 2, 
      useTooltip: false,
      ranges: [{ low: 0, high: this.maxDataValue, color: "rgba(255,0,0,0)" }],
      majorTicks: this._majorTicks, 
      indicators: [ gaugeBackground, indicator ]
    }, dojo.create("div", null, this.gaugeNode));
    this.gaugeWidget.startup();

    // add percent label
    this.valueNode = dojo.create("div",{
      "innerHTML": "0" + this.unitLabel,
      "style": {
        "bottom": parseInt(this.gaugeNode.style.height) - (this.gaugeWidget.cy - 20) + "px",
        "color": "#000",
        "font-family": "arial",
        "font-size": "1em",
        "left": "-1000px",
        "position": "absolute"
      }
    }, this.gaugeWidget.domNode);
    
    // put the percent label in the middle of the gauge
    var contentBox = dojo.contentBox(this.valueNode);
    dojo.style(this.valueNode, "left", this.gaugeWidget.cx + "px");
    dojo.style(this.valueNode, "marginLeft", (-contentBox.w/2) + "px");
    if( this.gaugeWidget.cx ) {
      dojo.style(this.valueNode, "marginBottom", (-contentBox.h/2) + "px");
    }

    // only do this if a layer is passed in
    if ( this.layer ) {
      this._connectMouseOver();
    }
  },

  destroy: function() {
    if ( this._mouseOverHandler ) {
      dojo.disconnect(this._mouseOverHandler);
    }
    this.gaugeWidget.destroy();
    dojo.empty(this.domNode);
    // this.inherited(arguments);
  },

  _connectMouseOver: function() {
    this._mouseOverHandler = dojo.connect(this.layer, "onMouseOver", dojo.hitch(this, function(e) {
      this.set("feature", e);
    }));
  },

  _formatValue: function(val) {
    if ( this.dataFormat == "percentage" ) {
      // calculate the percentage
      val = Math.round(( val / this.maxDataValue ) * 100);
    }
    return dojo.number.format(val, this.numberFormat);
  },

  _updateCaption: function(attr, oldVal, newVal) {
    this.captionNode.innerHTML = newVal;
  },

  _updateTitle: function(attr, oldVal, newVal) {
    this.titleNode.innerHTML = newVal;
  }, 

  _updateValue: function(attr, oldVal, newVal) {
    var val = this._formatValue(newVal);
    this.valueNode.innerHTML = val + this.unitLabel;
    this.gaugeWidget.indicators[1].update(parseInt(val));
  },

  _updateDataLabel: function(attr, oldVal, newVal) {
    this.dataLabelNode.innerHTML = newVal;
  },

  _updateFeature: function(attr, oldVal, newVal) {
    // check that this is either a graphic or
    // or an event object with a graphic as a property
    if ( ! newVal || 
         ( newVal.hasOwnPropety && // this is for IE8, using hasOwnProperty was causing an error
           ! newVal.hasOwnProperty("graphic") && 
           ! newVal.declaredClass == "esri.Graphic" )
       ) {
      console.log("Gauge Dijit:  a graphic is required to update the gauge.");
      return;
    }

    this.feature = newVal.graphic || newVal;
    
    // update the widget's percent value
    // use zero when feature's don't have a valid value
    this.set("value", this.feature.attributes[this.dataField] || 0);
    this.set("dataLabel", this.feature.attributes[this.dataLabelField] || this.noDataLabel);
  }

});


});
