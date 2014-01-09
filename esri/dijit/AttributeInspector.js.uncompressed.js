//>>built
// wrapped by build app
define("esri/dijit/AttributeInspector", ["dijit","dojo","dojox","dojo/require!dojo/fx,dojox/gfx,dijit/_Widget,dijit/_Templated,dijit/Editor,dijit/_editor/plugins/LinkDialog,dijit/_editor/plugins/TextColor,esri/dijit/editing/AttachmentEditor,esri/dijit/editing/Util,esri/tasks/query,dijit/form/DateTextBox,dijit/form/TextBox,dijit/form/NumberTextBox,dijit/form/FilteringSelect,dijit/form/NumberSpinner,dijit/form/Button,dijit/form/SimpleTextarea,dijit/Tooltip,dojo/data/ItemFileReadStore"], function(dijit,dojo,dojox){
dojo.provide("esri.dijit.AttributeInspector");

dojo.require("dojo.fx");
dojo.require("dojox.gfx");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");

dojo.require("dijit.Editor");
dojo.require("dijit._editor.plugins.LinkDialog");
dojo.require("dijit._editor.plugins.TextColor");

dojo.require("esri.dijit.editing.AttachmentEditor");
dojo.require("esri.dijit.editing.Util");
dojo.require("esri.tasks.query");

dojo.require("dijit.form.DateTextBox");
dojo.require("dijit.form.TextBox");
dojo.require("dijit.form.NumberTextBox");
dojo.require("dijit.form.FilteringSelect");
dojo.require("dijit.form.NumberSpinner");
dojo.require("dijit.form.Button");
dojo.require("dijit.form.SimpleTextarea");
dojo.require("dijit.Tooltip");

dojo.require("dojo.data.ItemFileReadStore");

//dojo.require("dojox.date.islamic");
//dojo.require("dojox.date.islamic.Date");
//dojo.require("dojox.date.islamic.locale");

/***************
 * CSS Includes
 ***************/
//anonymous function to load CSS files required for this module
 (function(){
    var link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = dojo.moduleUrl("esri", "dijit/css/AttributeInspector.css");
    document.getElementsByTagName("head").item(0).appendChild(link);

})();

/******************
 * CSS class names
 ******************
 *  esriAttributeInspector
 *    atiLayerName
 *    atiField
 *      atiRichTextField
 *      atiTextAreaField
 *    atiLabel
 *    atiNavMessage
 *    atiButtons
 *    atiNavButtons
 *    atiButton
 *    atiPrevIcon
 *    atiNextIcon
 *    atiFirstIcon
 *    atiLastIcon
 *    atiDeleteButton
 *    atiAttachmentEditor
 *    atiTooltip
 ******************/

/*******************************
 * esri.dijit.AttributeInspector
 ******************************/
dojo.declare("esri.dijit.AttributeInspector", [dijit._Widget, dijit._Templated], {

    widgetsInTemplate: true,
    templateString:"<div class=\"esriAttributeInspector\">\r\n    <div class=\"atiLayerName\" dojoAttachPoint=\"layerName\"></div>\r\n    <div class=\"atiAttributes\" dojoAttachPoint=\"attributeTable\"></div>\r\n    <div dojoAttachPoint=\"attachmentEditor\"></div>\r\n    <div class=\"atiEditorTrackingInfo\" dojoAttachPoint=\"editorTrackingInfoDiv\"></div>\r\n    <div class=\"atiButtons\" dojoAttachPoint=\"editButtons\">\r\n        <button  dojoType=\"dijit.form.Button\" class=\"atiButton atiDeleteButton\"  dojoAttachPoint=\"deleteBtn\" dojoAttachEvent=\"onClick: onDeleteBtn\" showLabel=\"true\" type=\"button\">${NLS_deleteFeature}</button>\r\n        <div class=\"atiNavButtons\" dojoAttachPoint=\"navButtons\">\r\n            <div class=\"atiNavMessage\" dojoAttachPoint=\"navMessage\"></div>\r\n            <button  dojoType=\"dijit.form.Button\" iconClass=\"atiButton atiFirstIcon\" dojoAttachPoint=\"firstFeatureButton\" dojoAttachEvent=\"onClick: onFirstFeature\" showLabel=\"false\" type=\"button\">${NLS_first}</button>\r\n            <button  dojoType=\"dijit.form.Button\" iconClass=\"atiButton atiPrevIcon\" dojoAttachPoint=\"prevFeatureButton\" dojoAttachEvent=\"onClick: onPreviousFeature\" showLabel=\"false\" type=\"button\">${NLS_previous}</button>\r\n            <button  dojoType=\"dijit.form.Button\" iconClass=\"atiButton atiNextIcon\" dojoAttachPoint=\"nextFeatureButton\" dojoAttachEvent=\"onClick: onNextFeature\" showLabel=\"false\" type=\"button\">${NLS_next}</button>\r\n            <button  dojoType=\"dijit.form.Button\" iconClass=\"atiButton atiLastIcon\" dojoAttachPoint=\"lastFeatureButton\" dojoAttachEvent=\"onClick: onLastFeature\" showLabel=\"false\" type=\"button\">${NLS_last}</button>\r\n        </div>\r\n    </div>\r\n</div>\r\n",
    _navMessage: "( ${idx} ${of} ${numFeatures} )",

    /*********
    * Events
    *********/
    onUpdate: function(){},
    onDelete: function(){},
    onAttributeChange: function(){},
    onNext: function(){},
    onReset: function(){},
    onCancel: function(){},

   /************
   * Overrides
   ************/
    constructor: function(params, srcNodeRef){
        // Mixin i18n strings
        dojo.mixin(this, esri.bundle.widgets.attributeInspector);
        params = params || {};
        if (!params.featureLayer && !params.layerInfos){
            console.error("esri.AttributeInspector: please provide correct parameter in the constructor");
        }
        //specify user ids for each secured layer
        this._userIds = {};
        if (params.featureLayer && params.featureLayer.credential) {
          var layerId = params.featureLayer.id;
          this._userIds[layerId] = params.featureLayer.credential.userId;
        }
        else if (params.layerInfos) {
          var lInfos = params.layerInfos;
          dojo.forEach(lInfos, function(layer) {
            if (layer.featureLayer){
              var layerId = layer.featureLayer.id;
              if (layer.featureLayer.credential) {
                this._userIds[layerId] = layer.featureLayer.credential.userId;
              }
              if (layer.userId) {
                this._userIds[layerId] = layer.userId;
              }
            }
          }, this);
        }
        
        this._datePackage = this._getDatePackage(params);
        this._layerInfos = params.layerInfos || [{ featureLayer: params.featureLayer, options: params.options || [] }];
        this._aiConnects = [];
        this._selection = [];
        this._toolTips = [];
        this._numFeatures = 0;
        this._featureIdx = 0;
        this._currentLInfo = null;
        this._currentFeature = null;
        this._hideNavButtons = params.hideNavButtons || false;
    },

    postCreate: function(){
        this._initLayerInfos();
        this._createAttachmentEditor();
        this.onFirstFeature();
    },

    destroy: function(){
        this._destroyAttributeTable();

        dojo.forEach( this._aiConnects, dojo.disconnect );
        delete this._aiConnects;

        if (this._attachmentEditor){
            this._attachmentEditor.destroy();
            delete this._attachmentEditor;
        }
        
        delete this._layerInfos;
        
        this._selection = this._currentFeature = this._currentLInfo = this._attributes = this._layerInfos = null;
        this.inherited(arguments);
    },

   /*****************
   * Public Methods
   *****************/
    refresh: function(){
        this._updateSelection();
    },

    first: function(){
        this.onFirstFeature();
    },

    last: function(){
        this.onLastFeature();
    },

    next: function(){
        this.onNextFeature();
    },

    previous: function(){
        this.onPreviousFeature();
    },
    
    showFeature: function(feature, fLayer){
      if (fLayer) {
        this._createOnlyFirstTime = true;
      }
      this._updateSelection([feature], fLayer);
      this._updateUI();
    },

   /*****************
   * Event Listeners
   *****************/
    onLayerSelectionChange: function(layer, selection, selectionMethod){
        this._createOnlyFirstTime = false;
        this._featureIdx = (selectionMethod === esri.layers.FeatureLayer.SELECTION_NEW) ? 0 : this._featureIdx;
        this._updateSelection();
        this._updateUI();
    },

    onLayerSelectionClear: function(){
        if (!this._selection || this._selection.length <= 0){ return; }
        this._numFeatures = 0;
        this._featureIdx = 0;
        this._selection = [];
        this._currentFeature = null;
        this._currentLInfo = null;
        this._updateUI();
    },

    onLayerEditsComplete: function(lInfo, adds, updates, deletes){
        deletes = deletes || [];
        if (deletes.length){
          var selection = this._selection;
          var oidFld = lInfo.featureLayer.objectIdField;
          dojo.forEach(deletes, dojo.hitch(this, function(del){
            dojo.some(selection, dojo.hitch(this, function(item, idx){
                if (item.attributes[oidFld] !== del.objectId){ return false; }
                this._selection.splice(idx, 1);
                return true;
            }));
          }));
       }

        adds = adds || [];
        if (adds.length){
            this._selection = esri.dijit.editing.Util.LayerHelper.findFeatures(adds, lInfo.featureLayer);
            this._featureIdx = 0;
        }

        var numFeatures = this._numFeatures = this._selection ? this._selection.length : 0;
        if (adds.length){
            var feature = numFeatures ? this._selection[this._featureIdx] : null;
            if (feature) {
              var fLayer = feature.getLayer();
              var editCapabilities = fLayer.getEditCapabilities();
              if (!(editCapabilities.canCreate && !editCapabilities.canUpdate)) {
                this._showFeature(feature);
              }
            }
        }
        this._updateUI();
    },

    onFieldValueChange: function(fInfo, newFieldVal){
        newFieldVal = (typeof newFieldVal === 'undefined') ? null : newFieldVal;
        var field = fInfo.field;
        // Convert to epoch time if fieldType is date/time
        if (field.type === "esriFieldTypeDate"){
            newFieldVal = (newFieldVal && newFieldVal.getTime) ? newFieldVal.getTime() : (newFieldVal && newFieldVal.toGregorian ? newFieldVal.toGregorian().getTime() : newFieldVal);
        }
        if (this._currentFeature.attributes[field.name] === newFieldVal){ return; }
        var lInfo = this._currentLInfo;
        var feature = this._currentFeature;
        var fieldName = field.name;
        // If typeField changed, update all domain fields
        if (fieldName === lInfo.typeIdField){
            var type = this._findFirst(lInfo.types, 'id', newFieldVal);
            var fInfos = lInfo.fieldInfos;
            dojo.forEach(fInfos, function(fInfo){
              field = fInfo.field;
              if (!field || field.name === lInfo.typeIdField){ return; }
              var node = fInfo.dijit;
              var domain = this._setFieldDomain(node, type, field);
              if (domain && node){
                this._setValue(node, feature.attributes[field.name] + '');
                if (node.isValid() === false){
                  this._setValue(node, null);
                }
              }
            }, this);
        }
        // Fire onAttributeChange to listeners
        this.onAttributeChange(feature, fieldName, newFieldVal);
    },

    onDeleteBtn: function(evt){
        this._deleteFeature();
    },

    onNextFeature: function(evt){
        this._onNextFeature(1);
    },

    onPreviousFeature: function(evt){
        this._onNextFeature( -1);
    },

    onFirstFeature: function(evt){
        this._onNextFeature(this._featureIdx * -1);
    },

    onLastFeature: function(evt){
        this._onNextFeature((this._numFeatures - 1) - this._featureIdx);
    },

   /*******************
   * Internal Methods
   *******************/
    _initLayerInfos: function(){
        var lInfos = this._layerInfos;
        this._editorTrackingInfos = {};
        dojo.forEach(lInfos, this._initLayerInfo, this);
    },

    _initLayerInfo: function(lInfo){
        var fLayer = lInfo.featureLayer;
        // Connect events
        this._connect(fLayer, "onSelectionComplete", dojo.hitch(this, "onLayerSelectionChange", lInfo));
        this._connect(fLayer, "onSelectionClear", dojo.hitch(this, "onLayerSelectionClear", lInfo));
        this._connect(fLayer, 'onEditsComplete', dojo.hitch(this, 'onLayerEditsComplete', lInfo));

        // Initialize layerInfo metadata
        lInfo.showAttachments = fLayer.hasAttachments ? (esri._isDefined(lInfo.showAttachments) ? lInfo.showAttachments : true) : false;
        lInfo.hideFields = lInfo.hideFields || [];
        lInfo.htmlFields = lInfo.htmlFields || [];
        lInfo.isEditable = fLayer.isEditable() ? (esri._isDefined(lInfo.isEditable) ? lInfo.isEditable : true) : false;
        lInfo.typeIdField = fLayer.typeIdField;
        lInfo.layerId = fLayer.id;
        lInfo.types = fLayer.types;
        if (!lInfo.showGlobalID && fLayer.globalIdField){ lInfo.hideFields.push(fLayer.globalIdField); }
        if (!lInfo.showObjectID){ lInfo.hideFields.push(fLayer.objectIdField); }

        // Initialize fieldInfos (if no fieldInfos in layerInfo then create default fieldInfos)
        var fields = this._getFields(lInfo.featureLayer);
        if (!fields){ return; }
        //var fInfos = (lInfo.fieldInfos && lInfo.fieldInfos.length) ? dojo.clone(lInfo.fieldInfos) : [];
        var fInfos = lInfo.fieldInfos || [];
        fInfos = dojo.map(fInfos, function(fInfo){
          return dojo.mixin({}, fInfo);
        });
        if (!fInfos.length){
            fields = dojo.filter(fields, dojo.hitch(this, function(field){ return !this._isInFields(field.name, lInfo.hideFields); }));
            lInfo.fieldInfos = dojo.map(fields, dojo.hitch(this, function(field){
                var stringFieldOption = (this._isInFields(field.name, lInfo.htmlFields ) ? esri.dijit.AttributeInspector.STRING_FIELD_OPTION_RICHTEXT : esri.dijit.AttributeInspector.STRING_FIELD_OPTION_TEXTBOX);
                return {'fieldName':field.name, 'field':field, 'stringFieldOption': stringFieldOption};
            }));
        } else {
            lInfo.fieldInfos = dojo.filter(dojo.map(fInfos, dojo.hitch(this, function(fInfo){
              var stringFieldOption = fInfo.stringFieldOption || (this._isInFields(fInfo.fieldName, lInfo.htmlFields) ? esri.dijit.AttributeInspector.STRING_FIELD_OPTION_RICHTEXT : esri.dijit.AttributeInspector.STRING_FIELD_OPTION_TEXTBOX);
              return dojo.mixin(fInfo, {'field': this._findFirst(fields, 'name', fInfo.fieldName), 'stringFieldOption':stringFieldOption});
            })), 'return item.field;');
        }        
        //find editor tracking info
        var editorTrackingFields = [];
        if (fLayer.editFieldsInfo){
          if (fLayer.editFieldsInfo.creatorField) {
            editorTrackingFields.push(fLayer.editFieldsInfo.creatorField);
          }
          if (fLayer.editFieldsInfo.creationDateField) {
            editorTrackingFields.push(fLayer.editFieldsInfo.creationDateField);
          }
          if (fLayer.editFieldsInfo.editorField) {
            editorTrackingFields.push(fLayer.editFieldsInfo.editorField);
          }
          if (fLayer.editFieldsInfo.editDateField) {
            editorTrackingFields.push(fLayer.editFieldsInfo.editDateField);
          }
        }
        this._editorTrackingInfos[fLayer.id] = editorTrackingFields;
    },

    _createAttachmentEditor: function(){
        this._attachmentEditor = null;
        var lInfos = this._layerInfos;
        var create = dojo.filter(lInfos, 'return item.showAttachments');
        if (!create || !create.length){ return; }
        this._attachmentEditor = new esri.dijit.editing.AttachmentEditor({'class':'atiAttachmentEditor'}, this.attachmentEditor);
        this._attachmentEditor.startup();
    },

    _setCurrentLInfo: function(lInfo){
        // Set the layerInfo for the feature currently being edited
        var currentLayer = this._currentLInfo ? this._currentLInfo.featureLayer : null;
        var fLayer = lInfo.featureLayer;
        //Update currentLayerInfo only if layer has changed since last call
        //But if ownershipbasedAccessControl is enabled, it should recreate the table since the editable fields may change according to features
        //If it's a create only feature layer, the table should be recreated every time as well.        
        if (currentLayer && currentLayer.id === fLayer.id && !currentLayer.ownershipBasedAccessControlForFeatures){
            var editCapabilities = fLayer.getEditCapabilities();
            if (!(editCapabilities.canCreate && !editCapabilities.canUpdate)) {
                return;
            }
        }
        this._currentLInfo = lInfo;
        this._createTable();
    },

    _updateSelection: function(selectedFeatures, fLayer) {
        this._selection = selectedFeatures || [];
        var lInfos = this._layerInfos;
        dojo.forEach(lInfos, this._getSelection, this);
        var numFeatures = this._numFeatures = this._selection.length;
        var feature = numFeatures ? this._selection[this._featureIdx] : null;
        this._showFeature(feature, fLayer);
    },

    _getSelection: function(lInfo){
        var selection = lInfo.featureLayer.getSelectedFeatures();
        this._selection = this._selection.concat(selection);
        //dojo.forEach(selection, function(feature){ feature.__lInfo = lInfo; }, this);
    },

    _updateUI: function(){
        var numFeatures = this._numFeatures;
        var lInfo = this._currentLInfo;
        this.layerName.innerHTML = (!lInfo || numFeatures === 0) ? this.NLS_noFeaturesSelected : (lInfo.featureLayer ? lInfo.featureLayer.name : '');

        dojo.style(this.attributeTable, "display", numFeatures ? "" : "none");
        dojo.style(this.editButtons, "display", numFeatures ? "": "none");
        dojo.style(this.navButtons, "display", (!this._hideNavButtons && (numFeatures > 1) ? "": "none"));
        this.navMessage.innerHTML = esri.substitute({idx: this._featureIdx + 1, of:this.NLS_of, numFeatures:this._numFeatures}, this._navMessage);
        
        if (this._attachmentEditor){
            dojo.style(this._attachmentEditor.domNode, "display", ((lInfo && lInfo.showAttachments) && numFeatures) ? "": "none");
        }
        
        var showDeleteBtn = ((lInfo && lInfo.showDeleteButton === false) || !this._canDelete) ? false: true;
        dojo.style(this.deleteBtn.domNode, "display", showDeleteBtn ? "": "none");
        
        // Reset the scrollbar to top
        if (this.domNode.parentNode && this.domNode.parentNode.scrollTop > 0){ this.domNode.parentNode.scrollTop = 0; }
    },

    _onNextFeature: function(direction){
        this._featureIdx += direction;
        if (this._featureIdx < 0){
            this._featureIdx = this._numFeatures - 1;
        } else if (this._featureIdx >= this._numFeatures){
            this._featureIdx = 0;
        }
        var feature = this._selection.length ? this._selection[this._featureIdx] : null;
        this._showFeature(feature);
        this._updateUI();
        this.onNext(feature);
    },

    _deleteFeature: function(){
        this.onDelete(this._currentFeature);
    },

    _showFeature: function(feature, fLayer){
        //Return if called with feature already being edited
        //if (!feature || feature === this._currentFeature){ return; }
        if (!feature){ return; }
        this._currentFeature = feature;
        var featureLayer = fLayer? fLayer: feature.getLayer();
        //get edit capabilities info
        var featureEditCapabilities = featureLayer.getEditCapabilities({feature: feature, userId: this._userIds[featureLayer.id]});
        this._canUpdate = featureEditCapabilities.canUpdate;
        this._canDelete = featureEditCapabilities.canDelete;
        
        var lInfo = this._getLInfoFromFeatureLayer(featureLayer);
        if (!lInfo){ return; }
        this._setCurrentLInfo(lInfo);
        var attributes = feature.attributes;
        var type = this._findFirst(lInfo.types, 'id', attributes[lInfo.typeIdField]);
        var node, field = null;
        var fInfos = lInfo.fieldInfos;
        dojo.forEach(fInfos, function(fInfo){
            field = fInfo.field;
            node = fInfo.dijit || null;
            if (!node){ return; }
            var domain = this._setFieldDomain(node, type, field);
            var value = attributes[field.name];
            value = (value && domain && domain.codedValues && domain.codedValues.length) ? (domain.codedValues[value] ? domain.codedValues[value].name : value) : value;
            if (!esri._isDefined(value)){ value = ''; }
            if (node.declaredClass === 'dijit.form.DateTextBox'){
                value = (value === '') ? null : new Date(value);
            } else if (node.declaredClass === 'dijit.form.FilteringSelect'){
                node._lastValueReported = null;
                value = attributes[field.name] + '';
            }
            try{
                this._setValue(node, value);
                if (node.declaredClass === 'dijit.form.FilteringSelect' && node.isValid() === false){
                  this._setValue(node, null);
                }
            } catch(error){
                node.set('displayedValue', this.NLS_errorInvalid, false);
            }
        }, this);
        if (this._attachmentEditor && lInfo.showAttachments){
            this._attachmentEditor.showAttachments(this._currentFeature);
        }
        var editorTrackingInfo = featureLayer.getEditSummary(feature);
        if (editorTrackingInfo) {
          this.editorTrackingInfoDiv.innerHTML = editorTrackingInfo;
          esri.show(this.editorTrackingInfoDiv);
        }
        else {
          esri.hide(this.editorTrackingInfoDiv);
        }
    },

    _setFieldDomain: function(node, type, field){
        if (!node){ return null; }
        var domain = field.domain;
        if (type && type.domains){
            if (type.domains[field.name] && type.domains[field.name] instanceof esri.layers.InheritedDomain === false){
                domain = type.domains[field.name];
            }
        }
        if (!domain){ return null; }
        if (domain.codedValues && domain.codedValues.length > 0){
            node.set("store", this._toStore(dojo.map(domain.codedValues, "return { id: item.code += '', name: item.name };")));
            this._setValue(node, domain.codedValues[0].code);
        } else{
            node.constraints = { min: esri._isDefined(domain.minValue) ? domain.minValue : Number.MIN_VALUE,  max: esri._isDefined(domain.maxValue) ? domain.maxValue : Number.MAX_VALUE};
            this._setValue(node, node.constraints.min);
        }
        return domain;
    },
    
    _setValue : function(node, value){
        if (!node.set){ return; }
        node._onChangeActive = false;
        node.set('value', value, true);
        node._onChangeActive = true;
    },

    _getFields: function(featureLayer){
        var outFields = featureLayer._getOutFields();
        if (!outFields){ return null; }
        var fields = featureLayer.fields;
        return (outFields == "*") ? fields : dojo.filter(dojo.map(outFields, dojo.hitch(this, '_findFirst', fields, 'name')), esri._isDefined);
    },

    _isInFields: function(fieldName, fieldArr){
        if (!fieldName || !fieldArr && !fieldArr.length){ return false; }
        return dojo.some(fieldArr, function(name){ return name.toLowerCase() === fieldName.toLowerCase(); });
    },

    _findFirst: function(collection, propertyName, value){
        var result = dojo.filter(collection, function(item){ return item.hasOwnProperty(propertyName) && item[propertyName] === value; });
        return (result && result.length) ? result[0] : null;
    },
    
    _getLInfoFromFeatureLayer: function(fLayer){
        var layerId = fLayer ? fLayer.id : null;
        return this._findFirst(this._layerInfos, "layerId", layerId);
    },

    _createTable: function(){
        this._destroyAttributeTable();
        this.attributeTable.innerHTML = "";
        this._attributes = dojo.create("table", { cellspacing: "0", cellpadding: "0" }, this.attributeTable);
        var tbody = dojo.create("tbody", null, this._attributes);
        var feature = this._currentFeature;
        var lInfo = this._currentLInfo;
        var type = this._findFirst(lInfo.types, 'id', feature.attributes[lInfo.typeIdField]);
        var fInfos = lInfo.fieldInfos;
        dojo.forEach(fInfos, dojo.hitch(this, '_createField', type, tbody), this);
        this._createOnlyFirstTime = false;
    },
    
    _createField: function(type, tbody, fInfo){
        var lInfo = this._currentLInfo;
        var field = fInfo.field;
        if (this._isInFields(field.name, lInfo.hideFields)){ return; }
        if (this._isInFields(field.name, this._editorTrackingInfos[lInfo.featureLayer.id])){ return; }
        var node = dojo.create("tr", null, tbody);
        //var isRichTextFld = fInfo.stringFieldOption === esri.dijit.AttributeInspector.STRING_FIELD_OPTION_RICHTEXT;
        var td = dojo.create("td", { innerHTML: fInfo.label || field.alias || field.name, 'class': 'atiLabel' }, node);
        //if (!isRichTextFld){ td = dojo.create("td", null, node); }
        td = dojo.create("td", null, node);
        
        var fieldDijit = null;
        var disabled = false;
        if (fInfo.customField){
          dojo.place(fInfo.customField.domNode || fInfo.customField, dojo.create("div", null, td), "first");
          fieldDijit = fInfo.customField;
        }
        //check ownership based access control and capabilities by this._canUpdate
        else if (lInfo.isEditable === false || field.editable === false || fInfo.isEditable === false ||
                   field.type === "esriFieldTypeOID" || field.type === "esriFieldTypeGlobalID"|| 
	          (!this._canUpdate && !this._createOnlyFirstTime)){
            disabled = true;
        }
        
        if (!fieldDijit && (lInfo.typeIdField && field.name.toLowerCase() == lInfo.typeIdField.toLowerCase())){
            fieldDijit = this._createTypeField(field, fInfo, td);
        } else if (!fieldDijit) {
            fieldDijit = this._createDomainField(field, fInfo, type, td);
        }
        
        if (!fieldDijit){
            switch (field.type){
            case "esriFieldTypeString":
                fieldDijit = this._createStringField(field, fInfo, td);
                break;
            case "esriFieldTypeDate":
                fieldDijit = this._createDateField(field, fInfo, td);
                break;
            case "esriFieldTypeInteger":
            case "esriFieldTypeSmallInteger":
                fieldDijit = this._createIntField(field, fInfo, td);
                break;
            case "esriFieldTypeSingle":
            case "esriFieldTypeDouble":
                fieldDijit = this._createFltField(field, fInfo, td);
                break;
            default:
                fieldDijit = this._createStringField(field, fInfo, td);
                break;
            }
        }
        // Add tooltip
        if (fInfo.tooltip && fInfo.tooltip.length){ this._toolTips.push(new dijit.Tooltip({ connectId: [fieldDijit.id], label:fInfo.tooltip}));}
        fieldDijit.onChange = dojo.hitch(this, "onFieldValueChange", fInfo);
        fieldDijit.set('disabled', disabled);
        fInfo.dijit = fieldDijit;
    },

    _createTypeField: function(field, fInfo, node){
        return new dijit.form.FilteringSelect({
            'class': 'atiField',
            name: field.alias || field.name,
            store: this._toStore(dojo.map(this._currentLInfo.types, "return { id: item.id, name: item.name };")),
            searchAttr: "name"
        }, dojo.create("div", null, node));
    },

    _createDomainField: function(field, fInfo, type, node){
        var domain = field.domain;
        if (type && type.domains){
            if (type.domains[field.name] && type.domains[field.name] instanceof esri.layers.InheritedDomain === false){
                domain = type.domains[field.name];
            }
        }
        if (!domain){ return null; }
        if (domain.codedValues){
            return new dijit.form.FilteringSelect({
                'class': 'atiField',
                name: field.alias || field.name,
                store: null,
                searchAttr: "name",
                required: field.nullable || false
            }, dojo.create("div", null, node));
        } else{
            return new dijit.form.NumberSpinner({
              'class': 'atiField'
            }, dojo.create("div", null, node));
        }
    },

    _createStringField: function(field, fInfo, node){
        var params = {
            'class': 'atiField',
            trim: true,
            maxLength: field.length
        };
        if (fInfo.stringFieldOption === esri.dijit.AttributeInspector.STRING_FIELD_OPTION_TEXTAREA){
              params['class'] += ' atiTextAreaField';
              return new dijit.form.SimpleTextarea(params, dojo.create("div", null, node));
        } else if (fInfo.stringFieldOption === esri.dijit.AttributeInspector.STRING_FIELD_OPTION_RICHTEXT){
              //node.colSpan = 2;
              params['class'] += ' atiRichTextField';
              params.height = '100%';
              params.width = '100%';
              params.plugins = fInfo.richTextPlugins || ['bold', 'italic', 'underline', 'foreColor', 'hiliteColor', '|', 'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull', '|', 'insertOrderedList', 'insertUnorderedList', 'indent', 'outdent', '|', 'createLink']; 
              return new dijit.Editor(params, dojo.create("div", null, node));
        } else{ 
            return new dijit.form.TextBox(params, dojo.create("div", null, node));
        }
    },

    _createDateField: function(field, fInfo, node){
        var params = {'class': 'atiField', 'trim': true};
        if (this._datePackage){
          params.datePackage = this._datePackage;
        }
        return new dijit.form.DateTextBox(params, dojo.create("div", null, node));
    },

    _createIntField: function(field, fInfo, node){
        return new dijit.form.NumberTextBox({
            'class': 'atiField',
            constraints: { places: 0 },
            invalidMessage: this.NLS_validationInt,
            trim: true
        }, dojo.create("div", null, node));
    },

    _createFltField: function(field, fInfo, node){
        return new dijit.form.NumberTextBox({
            'class': 'atiField',
            trim: true,
            invalidMessage: this.NLS_validationFlt
        }, dojo.create("div", null, node));
    },

    _toStore: function(items){
        return new dojo.data.ItemFileReadStore({
            data: { identifier: "id", label: "name", items: items }
        });
    },
    
    _connect: function(node, evt, func){
        this._aiConnects.push(dojo.connect(node, evt, func));
    },
    
    _getDatePackage: function(params) {
      if (params.datePackage === null){
        return null;
      } else if (params.datePackage){
        return params.datePackage;
      } //else if (dojo.locale === 'ar'){
        //return 'dojox.date.islamic';        
      //}      
      return null;
    },

    _destroyAttributeTable: function(){
        var lInfos = this.layerInfos;
        dojo.forEach(lInfos, function(lInfo){
            var fInfos = lInfo.fieldInfos;
            dojo.forEach(fInfos, function(fInfo){
              var dijit = fInfo.dijit;
              if (dijit){ 
                dijit._onChangeHandle = null;
                if (fInfo.customField){ return; }
                if (dijit.destroyRecursive){
                  dijit.destroyRecursive();
                } else if (dijit.destroy){
                  dijit.destroy();
                } 
              }
              fInfo.dijit = null;
            }, this);
        }, this);
        var toolTips = this._toolTips;
        dojo.forEach(toolTips, 'item.destroy(); delete item;');
        this._toolTips = [];
        if (this._attributes){
            dojo.destroy(this._attributes);
        }
    }
});
dojo.mixin(esri.dijit.AttributeInspector, {
    STRING_FIELD_OPTION_RICHTEXT: "richtext", STRING_FIELD_OPTION_TEXTAREA: "textarea", STRING_FIELD_OPTION_TEXTBOX: "textbox"
});
});
