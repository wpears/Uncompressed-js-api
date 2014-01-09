//>>built
// wrapped by build app
define("esri/dijit/editing/tools/ToolBase", ["dijit","dojo","dojox","dojo/require!esri/toolbars/draw"], function(dijit,dojo,dojox){
dojo.provide("esri.dijit.editing.tools.ToolBase");
dojo.require("esri.toolbars.draw");

dojo.declare("esri.dijit.editing.tools.ToolBase", null ,{
    
    _enabled : true,    
    showLabel: false,
    
    /************
    * Overrides 
    ************/      
    constructor: function(params, srcNodeRef){
        params = params || {};
        dojo.mixin(this, params);
        
        this.label = this._label ? esri.bundle.widgets.editor.tools[this._label] : "";

        this._settings        = params.settings;
        this._toolbar         = params.settings.drawToolbar;
        this._editToolbar     = params.settings.editToolbar;
        
        this._initializeTool();
    },    

    /*********
    * Events
    *********/    
    onFinished    : function(){},
    onDrawEnd     : function(){},
    onApplyEdits  : function() {},
        
    /************
    * Overrides 
    ************/
     postCreate : function() {
        this.deactivate();
        this.inherited(arguments);
    },
    
    destroy: function(){},
             
    /********************
    * Public Methods
    *********************/
    activate : function(layer){
        if (this._toolbar) { this._toolbar.deactivate(); }
        if (this._editToolbar) { this._editToolbar.deactivate(); } 
        if (!this._enabled) { return; }
            
        this._checked = true;
        this._layer = layer;
                       
        if (this._toolbar && this._drawType) {
            this._toolbar.activate(this._drawType);
        }
    },
    
    deactivate : function(){
        if (this._toolbar) { this._toolbar.deactivate(); }
        if (this._editToolbar) { this._editToolbar.deactivate(); }
        this.setChecked(false);
        this._updateUI();
    },
    
    setEnabled : function(enable){
        this._enabled = enable;
        this._updateUI();
    },
    
    setChecked : function(checked) {
       this._checked = checked;
    },

    enable : function(geomtry){
        this._updateUI();
    },
    
    isEnabled : function() {
        return _enabled;   
    },
    
    getToolName : function() {
        return this._toolName;  
    },
                  
   /*******************
   * Internal Methods
   *******************/       
    _initializeTool : function() {},
    _updateUI : function() {
      this.disabled = !this._enabled;
      this.attr('iconClass', this._enabled ? this._enabledIcon : this._disabledIcon);
    }
});

});
