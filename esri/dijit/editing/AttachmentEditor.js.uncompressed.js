//>>built
// wrapped by build app
define("esri/dijit/editing/AttachmentEditor", ["dijit","dojo","dojox","dojo/require!dijit/_Widget,dijit/_Templated"], function(dijit,dojo,dojox){
dojo.provide("esri.dijit.editing.AttachmentEditor");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");
//dojo.require("dojo.data.ItemFileReadStore");
//dojo.require("dojox.grid.DataGrid");

/***************
 * CSS Includes
 ***************/
//anonymous function to load CSS files required for this module
(function() {
    var css = [dojo.moduleUrl("esri.dijit.editing", "css/attachment.css")];

    var head = document.getElementsByTagName("head").item(0), link,
        i, il = css.length;
    for (i = 0; i < il; i++) {
        link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = css[i];
        head.appendChild(link);
    }
}());

/************************
 * Attachment Editor Dijit
 ************************/
dojo.declare("esri.dijit.editing.AttachmentEditor", [dijit._Widget, dijit._Templated], {

    widgetsInTemplate: true,
    templateString:"<div class=\"attachmentEditor\">\r\n    <br />\r\n    <div>\r\n        <b>${NLS_attachments}</b>\r\n        <hr />\r\n        <br /> \r\n        <span dojoAttachPoint='_attachmentList' style='word-wrap: break-word;'></span>\r\n        <br><br>\r\n        <form dojoAttachPoint='_uploadForm'> ${NLS_add}:&nbsp;&nbsp;<input type='file' name='attachment' dojoAttachPoint='_uploadField' /> </form>\r\n    </div>\r\n</div>",
    basePath: dojo.moduleUrl("esri.dijit.editing"),

    _listHtml: "<span id='node_${oid}_${attid}'><a href='${href}' target='_blank'>${name}</a>",
    _deleteBtnHtml: "(<span style='cursor:pointer;color:red;font-weight:bold;' class='deleteAttachment' id='${attid}');'>X</span>)",
    _endHtml: "<br/></span>",
    _aeConnects: [],
    _layerEditingCapChecked: {},
    _layerEditingCap: {},

    /*************
     * Overrides
     *************/
    constructor: function(params, srcNodeRef) {
        // Mixin i18n strings
        dojo.mixin(this, esri.bundle.widgets.attachmentEditor);
    },

    startup: function() {
        this.inherited(arguments);
        this._uploadField_connect = dojo.connect(this._uploadField, "onchange", this, "_addAttachment");
    },

    destroy: function() {
        dojo.forEach(this._aeConnects, dojo.disconnect);
        dojo.disconnect(this._uploadField_connect);
        this.inherited(arguments);
    },

    /*****************
     * Public Methods
     *****************/
    showAttachments: function(feature, featureLayer) {
        var list = this._attachmentList;
        list.innerHTML = this.NLS_none;
        this._uploadField.value = "";
        if (!feature) { return; }
        this._featureLayer = feature.getLayer() || featureLayer;
        if (!this._featureLayer) { return; }
        this._currentLayerId = this._featureLayer.id;
        if (!this._layerEditingCapChecked[this._currentLayerId]) {
          this._layerEditingCap[this._currentLayerId] = this._featureLayer.getEditCapabilities();
          this._layerEditingCapChecked[this._currentLayerId] = true;
        }
        this._featureCanUpdate = this._featureLayer.getEditCapabilities({feature: feature}).canUpdate;
        this._oid = feature.attributes[this._featureLayer.objectIdField];
        this._getAttachments(feature);
    },

    /*******************
     * Internal Methods
     *******************/
    _getAttachments: function(feature) {
        if (!this._featureLayer || !this._featureLayer.queryAttachmentInfos){ return; }
        this._featureLayer.queryAttachmentInfos(this._oid, dojo.hitch(this, "_onQueryAttachmentInfosComplete"));
    },

    _addAttachment: function() {
        if (!this._featureLayer || !this._featureLayer.addAttachment){ return; }
        this._featureLayer.addAttachment(this._oid, this._uploadForm, dojo.hitch(this, "_onAddAttachmentComplete"));
    },

    _deleteAttachment: function(oid, attid) {
        this._featureLayer.deleteAttachments(oid, [attid], dojo.hitch(this, "_onDeleteAttachmentComplete"));
    },

    _onQueryAttachmentInfosComplete: function(response) {
        var htmlMarkup = this._listHtml + this._deleteBtnHtml + this._endHtml;
        this._uploadForm.style.display = "block";
        if ((!this._featureCanUpdate && this._layerEditingCap[this._currentLayerId].canUpdate) || 
           (!this._layerEditingCap[this._currentLayerId].canCreate && !this._layerEditingCap[this._currentLayerId].canUpdate)) {
          htmlMarkup = this._listHtml + this._endHtml;
          this._uploadForm.style.display = "none";
        }
        else if (this._layerEditingCap[this._currentLayerId].canCreate && !this._layerEditingCap[this._currentLayerId].canUpdate) {
          htmlMarkup = this._listHtml + this._endHtml;
        }
        var list = this._attachmentList,
            links = dojo.map(response, dojo.hitch(this, function(info) {
                return esri.substitute({
                    href: info.url,
                    name: info.name,
                    oid: info.objectId,
                    attid: info.id
                }, htmlMarkup);
            }));
        
        list.innerHTML = links.join("") || this.NLS_none;
        this._updateConnects();
    },

    _onAddAttachmentComplete: function(response) {
        var uploadField = this._uploadField;
        var uploadFieldVal = uploadField.value;
        var pos = uploadFieldVal.lastIndexOf("\\");
        if (pos > -1) {
            uploadFieldVal = uploadFieldVal.substring(pos + 1, uploadFieldVal.length);
        }
        uploadFieldVal = uploadFieldVal.replace(/\ /g, '_');

        var list = this._attachmentList,
            params = dojo.objectToQuery({
              gdbVersion: this._featureLayer.gdbVersion,
              token: this._featureLayer._getToken()
            });
            
        var htmlMarkup = this._listHtml + this._deleteBtnHtml + this._endHtml;
        if (this._layerEditingCap[this._currentLayerId].canCreate && !this._layerEditingCap[this._currentLayerId].canUpdate) {
          htmlMarkup = this._listHtml + this._endHtml;
        }
        var link = esri.substitute({
            href: this._featureLayer._url.path + "/" + response.objectId + "/attachments/" + response.attachmentId + (params ? ("?" + params) : ""),
            name: uploadFieldVal,
            oid: response.objectId,
            attid: response.attachmentId
        }, htmlMarkup);
        list.innerHTML = list.innerHTML == this.NLS_none ? link : (list.innerHTML + link);
        this._updateConnects();
        uploadField.value = "";
    },

    _onDeleteAttachmentComplete: function(response) {
        var success = dojo.every(response, function(result) { return result.success; });
        if (success) { dojo.byId("node_" + response[0].objectId + "_" + response[0].attachmentId).innerHTML = ""; }
    },

    _updateConnects: function() {
        dojo.forEach(this._aeConnects, dojo.disconnect);
        dojo.query('.deleteAttachment').forEach( function(item) {
            this._aeConnects.push(dojo.connect(item, "onclick", dojo.hitch(this, "_deleteAttachment", this._oid, item.id)));
        }, this);
    }
});

});
