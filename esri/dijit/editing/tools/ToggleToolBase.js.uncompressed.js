//>>built
// wrapped by build app
define("esri/dijit/editing/tools/ToggleToolBase", ["dijit","dojo","dojox","dojo/require!esri/dijit/editing/tools/ToolBase,dijit/form/ToggleButton,esri/toolbars/draw"], function(dijit,dojo,dojox){
dojo.provide("esri.dijit.editing.tools.ToggleToolBase");
dojo.require("esri.dijit.editing.tools.ToolBase");
dojo.require("dijit.form.ToggleButton");
dojo.require("esri.toolbars.draw");

dojo.declare("esri.dijit.editing.tools.ToggleToolBase", [dijit.form.ToggleButton, esri.dijit.editing.tools.ToolBase] ,{
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
        dijit.form.ToggleButton.prototype.destroy.apply(this, arguments);  
        esri.dijit.editing.tools.ToolBase.prototype.destroy.apply(this, arguments);
    },

    /*****************
    * Event Listeners
    *****************/
    setChecked : function(checked) {
       dijit.form.ToggleButton.prototype.setChecked.apply(this, arguments);
    }
});

});
