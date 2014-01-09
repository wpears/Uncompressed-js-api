//>>built
// wrapped by build app
define("esri/dijit/editing/tools/MenuItemBase", ["dijit","dojo","dojox","dojo/require!esri/dijit/editing/tools/ToolBase,dijit/MenuItem,esri/toolbars/draw"], function(dijit,dojo,dojox){
dojo.provide("esri.dijit.editing.tools.MenuItemBase");
dojo.require("esri.dijit.editing.tools.ToolBase");
dojo.require("dijit.MenuItem");
dojo.require("esri.toolbars.draw");

dojo.declare("esri.dijit.editing.tools.MenuItemBase", [dijit.MenuItem, esri.dijit.editing.tools.ToolBase] ,{
    /************
    * Overrides 
    ************/
    destroy: function(){
        dijit.MenuItem.prototype.destroy.apply(this, arguments);  
        esri.dijit.editing.tools.ToolBase.prototype.destroy.apply(this, arguments);
    }
});

});
