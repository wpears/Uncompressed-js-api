//>>built
// wrapped by build app
define("esri/dijit/Bookmarks", ["dijit","dojo","dojox","dojo/require!esri/map,esri/geometry"], function(dijit,dojo,dojox){
dojo.provide("esri.dijit.Bookmarks");
dojo.require("esri.map");
dojo.require("esri.geometry");

dojo.declare("esri.dijit.BookmarkItem", null, {
  constructor: function (params) {
    this.name = params.name;
    this.extent = params.extent;
  },
  toJson: function () {
    var json = {};
    var extent = this.extent.toJson();
    //Instead of using json.extent = this.extent.toJson();
    //The following line of code is a workaround for desktop to recognize the json. 
    //CR220356 has details.
    json.extent = {spatialReference: extent.spatialReference, xmax: extent.xmax, xmin: extent.xmin, ymax: extent.ymax, ymin: extent.ymin};
    json.name = this.name;
    return json;
  }
});

dojo.declare("esri.dijit.Bookmarks", null, {
  constructor: function (params, srcNodeRef) {
    this.map = params.map;
    this.editable = params.editable;
    this.initBookmarks = params.bookmarks;
    this._clickHandlers = this._mouseOverHandlers = this._mouseOutHandlers = this._removeHandlers = this._editHandlers = [];
    this.bookmarkDomNode = dojo.create("div");
    dojo.addClass(this.bookmarkDomNode, "esriBookmarks");
    this.bookmarkTable = dojo.create("table");
    dojo.addClass(this.bookmarkTable, "esriBookmarkTable");
    this.bookmarkDomNode.appendChild(this.bookmarkTable);
    srcNodeRef = dojo.byId(srcNodeRef);
    srcNodeRef.appendChild(this.bookmarkDomNode);
    this._addInitialBookmarks();
  },
  
  onClick: function () {},
  onEdit: function () {},
  onRemove: function () {},

  addBookmark: function (bookmarkItem) {
    var newBookmark;
    if (bookmarkItem.declaredClass == "esri.dijit.BookmarkItem") {
      newBookmark = bookmarkItem;
      this.bookmarks.push(newBookmark);
    } else {
      var newExtent = new esri.geometry.Extent(bookmarkItem.extent);
      newBookmark = new esri.dijit.BookmarkItem({
        name: bookmarkItem.name,
        extent: newExtent
      });
      this.bookmarks.push(newBookmark);
    }
    
    var domNode;
    if (this.editable) {
      var localStrings = esri.bundle.widgets.bookmarks; console.log(localStrings);
      var bookmarkEditStr = localStrings.NLS_bookmark_edit;
      var bookmarkRemoveStr = localStrings.NLS_bookmark_remove;
      domNode = dojo.create("div", {
        innerHTML: "<div class='esriBookmarkLabel'>" + bookmarkItem.name + "</div><div title='" + bookmarkRemoveStr + "' class='esriBookmarkRemoveImage'><br/></div><div title='" + bookmarkEditStr + "' class='esriBookmarkEditImage'><br/></div>"
      });
      var editImage = dojo.query('.esriBookmarkEditImage', domNode)[0];
      var removeImage = dojo.query('.esriBookmarkRemoveImage', domNode)[0];
      this._removeHandlers.push(dojo.connect(removeImage, "onclick", this, "_removeBookmark"));
      this._editHandlers.push(dojo.connect(editImage, "onclick", this, "_editBookmarkLabel"));
    } else {
      domNode = dojo.create("div", {
        innerHTML: "<div class='esriBookmarkLabel' style='width: 210px;'>" + bookmarkItem.name + "</div>"
      });
    }
    dojo.addClass(domNode, "esriBookmarkItem");
    var bookmarkExtent;
    if (bookmarkItem.extent.declaredClass == "esri.geometry.Extent") {
      bookmarkExtent = bookmarkItem.extent;
    } else {
      bookmarkExtent = new esri.geometry.Extent(bookmarkItem.extent);
    }

    var bookmarkLabel = dojo.query('.esriBookmarkLabel', domNode)[0];
    this._clickHandlers.push(dojo.connect(bookmarkLabel, "onclick", dojo.hitch(this, "_onClickHandler", bookmarkItem)));
    this._mouseOverHandlers.push(dojo.connect(domNode, "onmouseover", function () {
      dojo.addClass(this, "esriBookmarkHighlight");
    }));
    this._mouseOutHandlers.push(dojo.connect(domNode, "onmouseout", function () {
      dojo.removeClass(this, "esriBookmarkHighlight");
    }));
    var table = this.bookmarkTable;
    var insertPosition;
    if (this.editable) {
      insertPosition = table.rows.length - 1;
    } else {
      insertPosition = table.rows.length;
    }
    var newRow = table.insertRow(insertPosition);
    var newCell = newRow.insertCell(0);
    newCell.appendChild(domNode);
  },

  removeBookmark: function (bookmarkName) {
    var bookMarksDom = dojo.query(".esriBookmarkLabel", this.bookmarkDomNode);
    var removedBookmarks = dojo.filter(bookMarksDom, function (item) {
      return item.innerHTML == bookmarkName;
    });
    dojo.forEach(removedBookmarks, function (removedBookmark) {
      removedBookmark.parentNode.parentNode.parentNode.parentNode.removeChild(removedBookmark.parentNode.parentNode.parentNode);
    });
    for (var i = this.bookmarks.length - 1; i >= 0; i-- ) {
      if (this.bookmarks[i].name == bookmarkName) {
        this.bookmarks.splice(i, 1);
      }
    }
    this.onRemove();
  },

  hide: function () {
    esri.hide(this.bookmarkDomNode);
  },

  show: function () {
    esri.show(this.bookmarkDomNode);
  },

  destroy: function () {
    this.map = null;
    dojo.forEach(this._clickHandlers, function (handler, idx) {
      dojo.disconnect(handler);
    });
    dojo.forEach(this._mouseOverHandlers, function (handler, idx) {
      dojo.disconnect(handler);
    });
    dojo.forEach(this._mouseOutHandlers, function (handler, idx) {
      dojo.disconnect(handler);
    });
    dojo.forEach(this._removeHandlers, function (handler, idx) {
      dojo.disconnect(handler);
    });
    dojo.forEach(this._editHandlers, function (handler, idx) {
      dojo.disconnect(handler);
    });
    dojo.destroy(this.bookmarkDomNode);
  },

  toJson: function () {
    var jsonArray = [];
    dojo.forEach(this.bookmarks, function (bookmarkItem, idx) {
      jsonArray.push(bookmarkItem.toJson());
    });
    return jsonArray;
  },

  _addInitialBookmarks: function () {
    if (this.editable) {
      var localStrings = esri.bundle.widgets.bookmarks;
      var addBookmarkStr = localStrings.NLS_add_bookmark;
      var newBookmarkDom = dojo.create("div", {
        innerHTML: "<div>" + addBookmarkStr + "</div>"
      });
      dojo.addClass(newBookmarkDom, 'esriBookmarkItem');
      dojo.addClass(newBookmarkDom, 'esriAddBookmark');
      this._clickHandlers.push(dojo.connect(newBookmarkDom, "onclick", this, this._newBookmark));
      this._mouseOverHandlers.push(dojo.connect(newBookmarkDom, "onmouseover", function () {
        dojo.addClass(this, "esriBookmarkHighlight");
      }));
      this._mouseOutHandlers.push(dojo.connect(newBookmarkDom, "onmouseout", function () {
        dojo.removeClass(this, "esriBookmarkHighlight");
      }));
      var table = this.bookmarkTable;
      var newRow = table.insertRow(0);
      var newCell = newRow.insertCell(0);
      newCell.appendChild(newBookmarkDom);
    }
    this.bookmarks = [];
    dojo.forEach(this.initBookmarks, function (bookmarkItem, idx) {
      this.addBookmark(bookmarkItem);
    }, this);
  },

  _removeBookmark: function (e) {
    this.bookmarks.splice(e.target.parentNode.parentNode.parentNode.rowIndex, 1);
    e.target.parentNode.parentNode.parentNode.parentNode.removeChild(e.target.parentNode.parentNode.parentNode);
    this.onRemove();
  },

  _editBookmarkLabel: function (e) {
    var node = e.target.parentNode;
    var position = dojo.position(node, true);
    var y = position.y;
    var editBox = dojo.create("div", {
      innerHTML: "<input type='text' class='esriBookmarkEditBox' style='left:" + position.x + "px; top:" + y + "px;'/>"
    });
    this._inputBox = dojo.query("input", editBox)[0];
    this._label = dojo.query('.esriBookmarkLabel', node)[0];
    var localStrings = esri.bundle.widgets.bookmarks;
    var untitled = localStrings.NLS_new_bookmark;
    if (this._label.innerHTML == untitled) {
      this._inputBox.value =  "";
    }
    else {
      this._inputBox.value = this._label.innerHTML;
    }
    dojo.connect(this._inputBox, "onkeyup", this, function(key){
      switch(key.keyCode){
        case dojo.keys.ENTER:
          this._finishEdit();
          break;
        default:
          break;     
      }
    });
    dojo.connect(this._inputBox, "onblur", this, "_finishEdit");
    node.appendChild(editBox);
    this._inputBox.focus();
  },
  
  _finishEdit: function () {
    this._inputBox.parentNode.parentNode.removeChild(this._inputBox.parentNode);
    var localStrings = esri.bundle.widgets.bookmarks;
    var untitled = localStrings.NLS_new_bookmark;
    if (this._inputBox.value == "") {
      this._label.innerHTML = untitled;
    }
    else {
      this._label.innerHTML = this._inputBox.value;
    }
    var bookMarksDom = dojo.query(".esriBookmarkLabel", this.bookmarkDomNode);
    dojo.forEach(this.bookmarks, function (bookmarkItem, idx) {
      bookmarkItem.name = bookMarksDom[idx].innerHTML;
    });
    this.onEdit();
  },

  _newBookmark: function () {
    var localStrings = esri.bundle.widgets.bookmarks;
    var bookmarkName = localStrings.NLS_new_bookmark;
    var bookmarkItem = new esri.dijit.BookmarkItem({
      "name": bookmarkName,
      "extent": this.map.extent
    });
    this.addBookmark(bookmarkItem);
    var bookmarkItemNodes = dojo.query('.esriBookmarkItem', this.bookmarkDomNode);
    //as in editable mode, the newest added item is always the second last one.
    var newBookmarkItemNode = bookmarkItemNodes[bookmarkItemNodes.length - 2];
    var e = {
      "target": {
        "parentNode": null
      }
    };
    e.target.parentNode = newBookmarkItemNode;
    this._editBookmarkLabel(e);
  }, 
  
  _onClickHandler: function (bookmarkItem){
    var bookmarkExtent = bookmarkItem.extent;
    if (!bookmarkItem.extent.declaredClass) {
      bookmarkExtent = new esri.geometry.Extent(bookmarkItem.extent);
    }
    this.map.setExtent(bookmarkExtent);
    this.onClick();
  }
});
});
