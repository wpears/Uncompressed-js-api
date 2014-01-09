//>>built
// wrapped by build app
define("esri/dijit/editing/tools/ButtonToolBase", ["dijit","dojo","dojox","dojo/require!esri/dijit/editing/tools/ToolBase,dijit/form/Button"], function(dijit,dojo,dojox){
dojo.provide("esri.dijit.editing.tools.ButtonToolBase");
dojo.require("esri.dijit.editing.tools.ToolBase");
dojo.require("dijit.form.Button");

dojo.declare("esri.dijit.editing.tools.ButtonToolBase", [dijit.form.Button, esri.dijit.editing.tools.ToolBase] ,{
    /************
    * Overrides 
    ************/
    postCreate : function() {
        this.inherited(arguments);
        if (this._setShowLabelAttr){
            this._setShowLabelAttr(false);
        }
    },

    destroy: function(){
        dijit.form.Button.prototype.destroy.apply(this, arguments);  
        esri.dijit.editing.tools.ToolBase.prototype.destroy.apply(this, arguments);
    }
});

});
