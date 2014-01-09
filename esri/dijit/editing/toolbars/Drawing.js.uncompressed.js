//>>built
// wrapped by build app
define("esri/dijit/editing/toolbars/Drawing", ["dijit","dojo","dojox","dojo/require!dijit/_CssStateMixin,esri/dijit/editing/toolbars/ToolbarBase,esri/dijit/editing/tools/Editing,esri/dijit/editing/tools/Selection,esri/dijit/editing/tools/AdvancedTools"], function(dijit,dojo,dojox){
dojo.provide("esri.dijit.editing.toolbars.Drawing");
dojo.require("dijit._CssStateMixin");
dojo.require("esri.dijit.editing.toolbars.ToolbarBase");

//Required Tools
dojo.require("esri.dijit.editing.tools.Editing");
dojo.require("esri.dijit.editing.tools.Selection");
dojo.require("esri.dijit.editing.tools.AdvancedTools");

/***************
 * CSS Includes
 ***************/

//anonymous function to load CSS files required for this module
 (function(){
    var css = [ dojo.moduleUrl("esri.dijit.editing", "css/drawingToolbar.css") ];
    var head = document.getElementsByTagName("head").item(0), link;
    for (i = 0, il = css.length; i < il; i++){
        link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = css[i];
        head.appendChild(link);
    }
})();

dojo.declare("esri.dijit.editing.toolbars.Drawing", [esri.dijit.editing.toolbars.ToolbarBase, dijit._CssStateMixin], {
    /*********
    * Events
    *********/
    onShowAttributeInspector: function(){},

    /************
    * Overrides 
    ************/
    _activateTool: function(tool, deactivateIfSelected){
        this._settings.editor._activeTool = tool;
        if (tool !== "EDITING"){
            this._settings.templatePicker.clearSelection();
        }

        if (tool !== "ATTRIBUTES"){
            this._settings.editor._hideAttributeInspector();
        }

        if (tool === "CLEAR"){
            return;
        }
        this.inherited(arguments);
    },
    
    /*******************
   * Internal Methods
   *******************/
    _initializeToolbar: function(){
        var layers = this._settings.layers;
        dojo.forEach(layers, function(layer){
            this._tbConnects.push(dojo.connect(layer, "onSelectionComplete", this, "_updateUI"));
        }, this);
    },

    activateEditing: function(drawTool, layer){
        this._tools.EDITING._activateTool(drawTool, layer.geometryType);
        this._activeTool = this._tools.EDITING;
        this._activeTool.setChecked(true);
    },

    _updateUI: function(){
        if (this._settings.undoManager){
            this._tools.UNDO.set('disabled', this._settings.undoManager.canUndo === false);
            this._tools.REDO.set('disabled', this._settings.undoManager.canRedo === false);
        }
        this._selectedFeatures = esri.dijit.editing.Util.LayerHelper.getSelection(this._settings.layers);
        var count = this._selectedFeatures.length;
        if (this._tools.DELETE) {
            this._tools.DELETE.set('disabled', count <= 0);
        }
        if (this._tools.CLEAR) {
            this._tools.CLEAR.set('disabled', count <= 0);
        }
        if (this._tools.ATTRIBUTES){
            this._tools.ATTRIBUTES.set('disabled', count <= 0);
        }
        if (this._tools.UNION){ 
            this._tools.UNION.set('disabled', count < 2);
        }
    },

    _toolFinished: function(tool){
        if (tool === "ATTRIBUTES" && (this._selectedFeatures && this._selectedFeatures.length)){
            this.onShowAttributeInspector(this._selectedFeatures[0]);
        }

        if (tool === "SELECT" || tool === "CUT" || tool === "RESHAPING" || tool === "EDITING"){
            this._activeTool.deactivate();
            this._activeTool.setChecked(false);
            this._activeTool = null;
        }
        
        if (tool === "DELETE"){
            this.onDelete();
        }

        this._updateUI();
    },

    _createTools: function(){
        this._tools.SELECT = new esri.dijit.editing.tools.Selection({
            settings: this._settings,
            onClick: dojo.hitch(this, "_activateTool", "SELECT", true),
            onFinished: dojo.hitch(this, "_toolFinished", "SELECT")
        });
        this.addChild(this._tools.SELECT);

        this._tools.CLEAR = new esri.dijit.editing.tools.ButtonToolBase(dojo.mixin(esri.dijit.editing.tools.SelectionTools.selectClear,{
            settings: this._settings,
            onClick: dojo.hitch(this._settings.editor, "_clearSelection", false)
        }));
        this.addChild(this._tools.CLEAR);
        this._createSeparator();

        this._tools.ATTRIBUTES = new esri.dijit.editing.tools.ButtonToolBase(dojo.mixin(esri.dijit.editing.tools.EditingTools.attributes,
        {
            settings: this._settings,
            onClick: dojo.hitch(this, "_toolFinished", "ATTRIBUTES")
        }));
        this.addChild(this._tools.ATTRIBUTES);
        this._createSeparator();

        this._tools.EDITING = new esri.dijit.editing.tools.Editing({
            settings: this._settings,
            onClick: dojo.hitch(this, "_activateTool", "EDITING", true),
            onApplyEdits: dojo.hitch(this, "onApplyEdits"),
            onFinished: dojo.hitch(this, "_toolFinished", "EDITING")
        });
        this.addChild(this._tools.EDITING);

        this._tools.DELETE = new esri.dijit.editing.tools.ButtonToolBase(dojo.mixin(esri.dijit.editing.tools.EditingTools.del,
        {
            settings: this._settings,
            onClick: dojo.hitch(this, "_toolFinished", "DELETE")
        }));
        this.addChild(this._tools.DELETE);

        if (this._settings.toolbarOptions){
            if (this._settings.toolbarOptions.cutVisible || this._settings.toolbarOptions.mergeVisible || this._settings.toolbarOptions.reshapeVisible){
                this._createSeparator();
            }
            if (this._settings.toolbarOptions.cutVisible){
                this._tools.CUT = new esri.dijit.editing.tools.Cut({
                    settings: this._settings,
                    onFinished: dojo.hitch(this, "_toolFinished", "CUT"),
                    onClick: dojo.hitch(this, "_activateTool", "CUT", true),
                    onApplyEdits: dojo.hitch(this, "onApplyEdits")
                });
                this.addChild(this._tools.CUT);
            }

            if (this._settings.toolbarOptions.mergeVisible){
                this._tools.UNION = new esri.dijit.editing.tools.Union({
                    settings: this._settings,
                    onFinished: dojo.hitch(this, "_toolFinished", "UNION"),
                    onApplyEdits: dojo.hitch(this, "onApplyEdits")

                });
                this.addChild(this._tools.UNION);
            }

            if (this._settings.toolbarOptions.reshapeVisible){
                this._tools.RESHAPING = new esri.dijit.editing.tools.Reshape({
                    settings: this._settings,
                    onClick: dojo.hitch(this, "_activateTool", "RESHAPING", true),
                    onFinished: dojo.hitch(this, "_toolFinished", "RESHAPING"),
                    onApplyEdits: dojo.hitch(this, "onApplyEdits")
                });
                this.addChild(this._tools.RESHAPING);
            }
        }
        
        if (this._settings.enableUndoRedo){
            this._createSeparator();
            this._tools.UNDO = new esri.dijit.editing.tools.ButtonToolBase(dojo.mixin(esri.dijit.editing.tools.EditingTools.undo,
            {
                settings: this._settings,
                onClick: dojo.hitch(this, function() { this._tools.UNDO.set('disabled', true); this._tools.REDO.set('disabled', true); this._settings.editor._undo(); })
            }));
            
            this.addChild(this._tools.UNDO);
            this._tools.REDO = new esri.dijit.editing.tools.ButtonToolBase(dojo.mixin(esri.dijit.editing.tools.EditingTools.redo,
            {
                settings: this._settings,
                onClick: dojo.hitch(this, function() { this._tools.UNDO.set('disabled', true); this._tools.REDO.set('disabled', true); this._settings.editor._redo(); })
            }));
            this.addChild(this._tools.REDO);
        }
    }
});

});
