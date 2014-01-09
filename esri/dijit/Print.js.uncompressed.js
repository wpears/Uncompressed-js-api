//>>built
// wrapped by build app
define("esri/dijit/Print", ["dijit","dojo","dojox","dojo/require!dijit/Menu,dijit/form/Button,esri/tasks/PrintTask"], function(dijit,dojo,dojox){
dojo.provide("esri.dijit.Print");

dojo.require("dijit.Menu");
dojo.require("dijit.form.Button");
dojo.require("esri.tasks.PrintTask");

dojo.declare("esri.dijit.Print", null, {
  onPrintComplete: function () {},
  onError: function () {},
  onPrintStart: function () {},

  constructor: function (params, srcNodeRef) {
    params = params || {};
    this.url = params.url;
    this.async = params.async;
    this.map = params.map;
    this.templates = params.templates;
    var localStrings = esri.bundle.widgets.print;
    this._printText = localStrings.NLS_print;
    this._printingText = localStrings.NLS_printing;
    this._printoutText = localStrings.NLS_printout;
    if (!this.templates) {
      this.templates = [{
        label: this._printText,
        format: "PNG32",
        layout: "MAP_ONLY",
        exportOptions: {
          width: 800,
          height: 1100,
          dpi: 96
        }
      }];
    }

    this.printDomNode = dojo.create("div");
    dojo.addClass(this.printDomNode, "esriPrint");
    srcNodeRef = dojo.byId(srcNodeRef);
    srcNodeRef.appendChild(this.printDomNode);
  },

  startup: function () {
    this._createPrintButton();
  },

  destroy: function () {
    this.map = null;
    dojo.destroy(this.printDomNode);
  },

  hide: function () {
    esri.hide(this.printDomNode);
  },

  show: function () {
    esri.show(this.printDomNode);
  },

  printMap: function (template) {
    this.onPrintStart();
    this._printButton.setAttribute("label", this._printingText);
    this._printButton.setAttribute("disabled", true);
    var map = this.map;
    var printTask = new esri.tasks.PrintTask(this.url, {async: this.async});
    var params = new esri.tasks.PrintParameters();
    params.map = map;
    params.template = template;
    printTask.execute(params, dojo.hitch(this, this._printComplete), dojo.hitch(this, this._printError));
  },

  _createPrintButton: function () {
    var templates = this.templates;

    if (templates.length === 1) {
      this._printButton = new dijit.form.Button({
        label: this._printText,
        onClick: dojo.hitch(this, function () {
          this.printMap(templates[0]);
        })
      });
      this.printDomNode.appendChild(this._printButton.domNode);

    } else {
      this._printButton = new dijit.form.ComboButton({
        label: this._printText,
        onClick: dojo.hitch(this, function () {
          this.printMap(templates[0]);
        })
      });
      this.printDomNode.appendChild(this._printButton.domNode);
      var menu = new dijit.Menu({
        style: "display: none;"
      });
      dojo.forEach(templates, function (template) {
        var menuItem = new dijit.MenuItem({
          label: template.label,
          onClick: dojo.hitch(this, function () {
            this.printMap(template);
          })
        });
        menu.addChild(menuItem);
      }, this);

      this._printButton.setAttribute("dropDown", menu);
    }
    dojo.addClass(this._printButton.domNode, "esriPrintButton");
  },

  _printComplete: function (result) {
    this.onPrintComplete(result);
    var appHostSplits = window.location.host.split(".");
    var appDomain = appHostSplits.length > 1 ? appHostSplits[appHostSplits.length - 2] + "." + appHostSplits[appHostSplits.length - 1] : window.location.host;
    var urlHostSplits = result.url.split("://")[1].split("/")[0].split(".");
    var urlDomain = urlHostSplits.length > 1 ? urlHostSplits[urlHostSplits.length - 2] + "." + urlHostSplits[urlHostSplits.length - 1] : result.url.split("://")[1].split("/")[0];
    if (appDomain.toLowerCase() === urlDomain.toLowerCase()) {
      window.open(result.url);
      this._removeAllChildren(this.printDomNode);
      this._createPrintButton();
    } else {
      this._printButton.domNode.style.display = "none";
      var printAnchor = dojo.create("a", {
        href: result.url,
        target: "_blank",
        innerHTML: this._printoutText
      });
      dojo.connect(printAnchor, "onclick", dojo.hitch(this, this._hyperlinkClick));
      this._removeAllChildren(this.printDomNode);
      dojo.addClass(printAnchor, "esriPrintout");
      this.printDomNode.appendChild(printAnchor);
    }
  },

  _printError: function (err) {
    this._removeAllChildren(this.printDomNode);
    this._createPrintButton();
    console.error(err);
    this.onError(err);
  },

  _hyperlinkClick: function () {
    this._removeAllChildren(this.printDomNode);
    this._createPrintButton();
  },

  _removeAllChildren: function (domNode) {
    while (domNode.hasChildNodes()) {
      domNode.removeChild(domNode.lastChild);
    }
  }
});
});
