//>>built
define("dgrid/extensions/DnD",["dojo/_base/declare","dojo/_base/lang","dojo/_base/Deferred","dojo/dnd/Source","dojo/dnd/Manager","put-selector/put","xstyle/css!dojo/resources/dnd.css"],function(_1,_2,_3,_4,_5,_6){var _7=_1(_4,{grid:null,getObject:function(_8){var _9=this.grid;return _9.store.get(_9.row(_8).id);},_legalMouseDown:function(_a){var _b=this.inherited("_legalMouseDown",arguments);return _b&&_a.target!=this.grid.bodyNode;},onDrop:function(_c,_d,_e){var _f=this,_10=this._targetAnchor=this.targetAnchor,_11=this.grid,_12=_11.store;if(!this.before&&_10){_10=_10.nextSibling;}_10=_10&&_11.row(_10);_3.when(_10&&_12.get(_10.id),function(_13){if(_f!=_c){_f.onDropExternal(_c,_d,_e,_13);}else{_f.onDropInternal(_d,_e,_13);}});},onDropInternal:function(_14,_15,_16){var _17=this.grid.store,_18=this,_19=this.grid,_1a=_18._targetAnchor,_1b;if(_1a){_1b=this.before?_1a.previousSibling:_1a.nextSibling;}if(!_15&&(_1b===_14[0]||(!_16&&_19.down(_19.row(_14[0])).element==_14[0]))){return;}_14.forEach(function(_1c){_3.when(_18.getObject(_1c),function(_1d){_17[_15&&_17.copy?"copy":"put"](_1d,{before:_16});});});},onDropExternal:function(_1e,_1f,_20,_21){var _22=this.grid.store,_23=_1e.grid;_1f.forEach(function(_24,i){_3.when(_1e.getObject(_24),function(_25){if(!_20){if(_23){_3.when(_23.store.getIdentity(_25),function(id){!i&&_1e.selectNone();_1e.delItem(_24.id);_23.store.remove(id);});}else{_1e.deleteSelectedNodes();}}_22[_22.copy?"copy":"put"](_25,{before:_21});});});},onDndStart:function(_26,_27,_28){this.inherited(arguments);if(_26==this){_5.manager().avatar.node.style.width=this.grid.domNode.offsetWidth/2+"px";}},checkAcceptance:function(_29,_2a){return _29.getObject&&_4.prototype.checkAcceptance.apply(this,arguments);}});function _2b(_2c){if(_2c.dndSource){return;}_2c.dndSource=new (_2c.dndConstructor||_7)(_2c.bodyNode,_2.mixin(_2c.dndParams,{grid:_2c,dropParent:_2c.contentNode}));};var DnD=_1("dgrid.extensions.DnD",[],{dndSourceType:"dgrid-row",dndParams:null,dndConstructor:_7,postMixInProperties:function(){this.inherited(arguments);this.dndParams=_2.mixin({accept:[this.dndSourceType]},this.dndParams);},postCreate:function(){this.inherited(arguments);_2b(this);},insertRow:function(_2d){var row=this.inherited(arguments);_6(row,".dojoDndItem");_2b(this);this.dndSource.setItem(row.id,{data:_2d,type:[this.dndSourceType]});return row;}});DnD.GridSource=_7;return DnD;});