//>>built
// wrapped by build app
define("esri/dijit/editing/editOperation", ["dijit","dojo","dojox","dojo/require!esri/undoManager"], function(dijit,dojo,dojox){
dojo.provide("esri.dijit.editing.editOperation");
dojo.require("esri.undoManager");

dojo.declare("esri.dijit.editing.Add", esri.OperationBase, {
  type: "edit",
  label: "Add Features",
  constructor: function ( /*featureLayer, addedGraphics*/ params) {
    params = params || {};
    if (!params.featureLayer) {
      console.error("In constructor of 'esri.dijit.editing.Add', featureLayer is not provided");
      return;
    }
    this._featureLayer = params.featureLayer;

    if (!params.addedGraphics) {
      console.error("In constructor of 'esri.dijit.editing.Add', no graphics provided");
      return;
    }
    this._addedGraphics = params.addedGraphics;
  },

  performUndo: function () {
    this._featureLayer.applyEdits(null, null, this._addedGraphics);
  },

  performRedo: function () {
    this._featureLayer.applyEdits(this._addedGraphics, null, null);
  }
});

dojo.declare("esri.dijit.editing.Delete", esri.OperationBase, {
  //Delete is the opposite of Add
  type: "edit",
  label: "Delete Features",
  constructor: function ( /*featureLayer, deletedGraphics*/ params) {
    params = params || {};
    this._add = new esri.dijit.editing.Add({
      featureLayer: params.featureLayer,
      addedGraphics: params.deletedGraphics
    });
  },

  performUndo: function () {
    this._add.performRedo();
  },

  performRedo: function () {
    this._add.performUndo();
  }
});

dojo.declare("esri.dijit.editing.Update", esri.OperationBase, {
  type: "edit",
  label: "Update Features",
  constructor: function ( /*featureLayer, preUpdatedGraphics, postUpdatedGraphics*/ params) {
    params = params || {};
    if (!params.featureLayer) {
      console.error("In constructor of 'esri.dijit.editing.Update', featureLayer not provided");
      return;
    }
    this._featureLayer = params.featureLayer;

    if (!params.preUpdatedGraphics) {
      console.error("In constructor of 'esri.dijit.editing.Update', preUpdatedGraphics not provided");
      return;
    }
    this._preUpdatedGraphicsGeometries = [];
    this._preUpdatedGraphicsAttributes = [];
    for (var i = 0; i < params.preUpdatedGraphics.length; i++) {
      this._preUpdatedGraphicsGeometries.push(params.preUpdatedGraphics[i].geometry.toJson());
      this._preUpdatedGraphicsAttributes.push(params.preUpdatedGraphics[i].attributes);
    }

    if (!params.postUpdatedGraphics) {
      console.error("In constructor of 'esri.dijit.editing.Update', postUpdatedGraphics not provided");
      return;
    }
    //this._postUpdatedGraphics refer to the actual graphics which have been updated
    //undo/redo should be done to the referred graphics
    this._postUpdatedGraphics = params.postUpdatedGraphics;
    this._postUpdatedGraphicsGeometries = [];
    this._postUpdatedGraphicsAttributes = [];
    for (i = 0; i < params.postUpdatedGraphics.length; i++) {
      this._postUpdatedGraphicsGeometries.push(params.postUpdatedGraphics[i].geometry.toJson());
      this._postUpdatedGraphicsAttributes.push(dojo.clone(params.postUpdatedGraphics[i].attributes));
    }
  },

  performUndo: function () {
    for (var i = 0; i < this._postUpdatedGraphics.length; i++) {
      this._postUpdatedGraphics[i].setGeometry(esri.geometry.fromJson(this._preUpdatedGraphicsGeometries[i]));
      this._postUpdatedGraphics[i].setAttributes(this._preUpdatedGraphicsAttributes[i]);
    }
    this._featureLayer.applyEdits(null, this._postUpdatedGraphics, null);
  },

  performRedo: function () {
    for (var i = 0; i < this._postUpdatedGraphics.length; i++) {
      this._postUpdatedGraphics[i].setGeometry(esri.geometry.fromJson(this._postUpdatedGraphicsGeometries[i]));
      this._postUpdatedGraphics[i].setAttributes(this._postUpdatedGraphicsAttributes[i]);
    }
    this._featureLayer.applyEdits(null, this._postUpdatedGraphics, null);
  }
});

dojo.declare("esri.dijit.editing.Cut", esri.OperationBase, {
  type: "edit",
  label: "Cut Features",
  constructor: function ( /*featureLayer, addedGraphics, preUpdatedGraphics, postUpdatedGraphics*/ params) {
    params = params || {};
    if (!params.featureLayer) {
      console.error("In constructor of 'esri.dijit.editing.Cut', featureLayer not provided");
      return;
    }
    this._featureLayer = params.featureLayer;

    if (!params.addedGraphics) {
      console.error("In constructor of 'esri.dijit.editing.Cut', addedGraphics for cut not provided");
      return;
    }
    this._addedGraphics = params.addedGraphics;

    if (!params.preUpdatedGraphics) {
      console.error("In constructor of 'esri.dijit.editing.Cut', preUpdatedGraphics not provided");
      return;
    }
    this._preUpdatedGraphicsGeometries = [];
    this._preUpdatedGraphicsAttributes = [];
    for (var i = 0; i < params.preUpdatedGraphics.length; i++) {
      this._preUpdatedGraphicsGeometries.push(params.preUpdatedGraphics[i].geometry.toJson());
      this._preUpdatedGraphicsAttributes.push(params.preUpdatedGraphics[i].attributes);
    }

    if (!params.postUpdatedGraphics) {
      console.error("In constructor of 'esri.dijit.editing.Cut', postUpdatedGraphics not provided");
      return;
    }
    //this._postUpdatedGraphics refer to the actual graphics which have been updated
    //undo/redo should be done to the referred graphics
    this._postUpdatedGraphics = params.postUpdatedGraphics;
    this._postUpdatedGraphicsGeometries = [];
    this._postUpdatedGraphicsAttributes = [];
    for (i = 0; i < params.postUpdatedGraphics.length; i++) {
      this._postUpdatedGraphicsGeometries.push(params.postUpdatedGraphics[i].geometry.toJson());
      this._postUpdatedGraphicsAttributes.push(dojo.clone(params.postUpdatedGraphics[i].attributes));
    }
  },

  performUndo: function () {
    for (var i = 0; i < this._postUpdatedGraphics.length; i++) {
      this._postUpdatedGraphics[i].setGeometry(esri.geometry.fromJson(this._preUpdatedGraphicsGeometries[i]));
      this._postUpdatedGraphics[i].setAttributes(this._preUpdatedGraphicsAttributes[i]);
    }
    this._featureLayer.applyEdits(null, this._postUpdatedGraphics, this._addedGraphics);
  },

  performRedo: function () {
    for (var i = 0; i < this._postUpdatedGraphics.length; i++) {
      this._postUpdatedGraphics[i].setGeometry(esri.geometry.fromJson(this._postUpdatedGraphicsGeometries[i]));
      this._postUpdatedGraphics[i].setAttributes(this._postUpdatedGraphicsAttributes[i]);
    }
    this._featureLayer.applyEdits(this._addedGraphics, this._postUpdatedGraphics, null);
  }
});

dojo.declare("esri.dijit.editing.Union", esri.OperationBase, {
  type: "edit",
  label: "Union Features",
  // Union is the same as Cut. the only difference is that Cut has exactly opposite way when doing undo/redo  
  constructor: function ( /*featureLayer, deletedGraphics, preUpdatedGraphics, postUpdatedGraphics*/ params) {
    params = params || {};
    this._cut = new esri.dijit.editing.Cut({
      featureLayer: params.featureLayer,
      addedGraphics: params.deletedGraphics,
      preUpdatedGraphics: params.preUpdatedGraphics,
      postUpdatedGraphics: params.postUpdatedGraphics
    });
  },

  performUndo: function () {
    this._cut.performRedo();
  },

  performRedo: function () {
    this._cut.performUndo();
  }
});
});
