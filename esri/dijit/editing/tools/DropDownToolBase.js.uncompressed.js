//>>built
// wrapped by build app
define("esri/dijit/editing/tools/DropDownToolBase", ["dijit","dojo","dojox","dojo/require!dijit/form/ComboButton,esri/dijit/editing/tools/ToolBase"], function(dijit,dojo,dojox){
dojo.provide("esri.dijit.editing.tools.DropDownToolBase");
dojo.require("dijit.form.ComboButton");
dojo.require("esri.dijit.editing.tools.ToolBase");

dojo.declare("esri.dijit.editing.tools.DropDownToolBase", [dijit.form.ComboButton, esri.dijit.editing.tools.ToolBase] ,{
    _enabled  : false,
    _checked  : false,
    
    /************
    * Overrides 
    ************/
    postCreate : function() {
        this._tools = [];
        this._createTools();
        this.inherited(arguments);
        if (this._setShowLabelAttr){
            this._setShowLabelAttr(false);
        }
    },
    
    destroy: function(){
        var tools = this._tools;
        for (var tool in tools){
            if (tools.hasOwnProperty(tool) && esri._isDefined(tools[tool])){
                tools[tool].destroy();
            }
        }
        this.inherited(arguments);
    },
    _createTools    : function() {
        var mnu = new dijit.Menu();
        this.dropDown = mnu;
        for (var i in this._tools){
            if (this._tools.hasOwnProperty(i)){
                mnu.addChild(this._tools[i]);
            }
        }
        this._activeTool = mnu.getChildren()[0];
        this._updateUI();
    },
               
    /********************
    * Public Methods
    *********************/
    activate : function(layer){
        this.inherited(arguments);
        if (!this._activeTool){
            this._activateDefaultTool();
        } else {
            this._activeTool.activate();
        }
    },
    
    deactivate : function(){
        this.inherited(arguments);
        if (this._activeTool){
            this._activeTool.deactivate();
        }
    }, 
            
    enable : function(geometry){
       for (var tool in this._tools){
           if (this._tools.hasOwnProperty(tool)){
               this._tools[tool].enable(geometry);
           }
       } 
       this.setEnabled(true);
       this.inherited(arguments);
    },
          
    setChecked : function(checked) {
       this._checked = checked;
       this._updateUI();
    },
           
    /*****************
    * Event Listeners
    *****************/ 
    _onDrawEnd : function(geometry) {},
    
    onLayerChange : function(layer, type, template){ 
        this._activeTool = null;
        this._activeType = type;
        this._activeTemplate = template;
        this._activeLayer = layer;
    },
    
    onItemClicked : function(evt){
      if (this._activeTool){
          this._activeTool.deactivate();
      }
      
      this._activeTool = dijit.byId(evt.currentTarget.id);
            
      // Activate this drop down tool when clicking a menu item
      if (this._checked === false) {
          this._onClick();
      } else {
          this._updateUI();
          if (this._activeTool) {
              this._activeTool.activate();
              this._activeTool.setChecked(true);
          }
      }
    },
    
    _onClick : function(evt) {
      if (this._enabled === false){
          return;
      }
      this._checked = !this._checked;
      this.inherited(arguments);
    },

  /*******************
  * Internal Methods
  *******************/  
   _updateUI : function() {
      this.attr('disabled',  !this._enabled);
      dojo.style(this.focusNode, {outline: 'none'});
      dojo.style(this.titleNode, {padding: '0px', border:'none'});
      
      if (this._checked) {
          dojo.style(this.titleNode, {
              backgroundColor: '#D4DFF2',
              border: '1px solid #316AC5'
          });
      }
      else{
          dojo.style(this.titleNode, {
              backgroundColor: '',
              border: ''
          });
      } 
      
      if (this._activeTool){
          this.attr("iconClass", this._checked ? this._activeTool._enabledIcon : this._activeTool._disabledIcon);
          this.attr("label", this._activeTool.label);
      }
  }
});

});
