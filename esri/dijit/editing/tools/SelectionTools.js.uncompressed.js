//>>built
// wrapped by build app
define("esri/dijit/editing/tools/SelectionTools", ["dijit","dojo","dojox","dojo/require!esri/dijit/editing/tools/ButtonToolBase"], function(dijit,dojo,dojox){
dojo.require("esri.dijit.editing.tools.ButtonToolBase");
dojo.provide("esri.dijit.editing.tools.SelectionTools");

esri.dijit.editing.tools.SelectionTools = {
    select : {
        id            : "btnNewSelection",
        _enabledIcon  : "toolbarIcon newSelectionIcon",
        _disabledIcon : "toolbarIcon newSelectionIcon",
        _drawType     : esri.toolbars.Draw.EXTENT,
        _selectMethod : esri.layers.FeatureLayer.SELECTION_NEW,
        _label: "NLS_selectionNewLbl"
    },
    selectadd: {
      id: "btnAddToSelection",
      _enabledIcon: "toolbarIcon addToSelectionIcon",
      _disabledIcon: "toolbarIcon addToSelectionIcon",
      _drawType: esri.toolbars.Draw.EXTENT,
      _selectMethod: esri.layers.FeatureLayer.SELECTION_ADD,
      _label: "NLS_selectionAddLbl"
    },
    selectremove: {
      id: "btnSubtractFromSelection",
      _enabledIcon: "toolbarIcon removeFromSelectionIcon",
      _disabledIcon: "toolbarIcon removeFromSelectionIcon",
      _drawType: esri.toolbars.Draw.EXTENT,
      _selectMethod: esri.layers.FeatureLayer.SELECTION_SUBTRACT,
      _label: "NLS_selectionRemoveLbl"
    },
    selectClear: {
       id: "btnClearSelection",
       _enabledIcon: "toolbarIcon clearSelectionIcon",
       _disabledIcon: "toolbarIcon clearSelectionIcon",
       _enabled: false,
       _label: "NLS_selectionClearLbl"
    }
};
});
