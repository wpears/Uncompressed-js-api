/*
 COPYRIGHT 2009 ESRI

 TRADE SECRETS: ESRI PROPRIETARY AND CONFIDENTIAL
 Unpublished material - all rights reserved under the
 Copyright Laws of the United States and applicable international
 laws, treaties, and conventions.

 For additional information, contact:
 Environmental Systems Research Institute, Inc.
 Attn: Contracts and Legal Services Department
 380 New York Street
 Redlands, California, 92373
 USA

 email: contracts@esri.com
 */
//>>built
define(["dijit","dojo","dojox","dojo/require!esri/utils"],function(_1,_2,_3){_2.provide("esri.layers.layer");_2.require("esri.utils");_2.declare("esri.layers.Layer",null,{constructor:function(_4,_5){if(_4&&_2.isString(_4)){this._url=esri.urlToObject(this.url=_4);}else{this.url=(this._url=null);_5=_5||_4;if(_5&&_5.layerDefinition){_5=null;}}this._map=this._div=null;this.normalization=true;if(_5){if(_5.id){this.id=_5.id;}if(_5.visible===false){this.visible=false;}if(_5.opacity!==undefined){this.opacity=_5.opacity;}}this._errorHandler=_2.hitch(this,this._errorHandler);},id:null,visible:true,loaded:false,_errorHandler:function(_6){this.onError(_6);},_setMap:function(_7,_8,_9,_a){},_unsetMap:function(_b,_c){},_cleanUp:function(){this._map=this._div=null;},_fireUpdateStart:function(){if(this.updating){return;}this.updating=true;this.onUpdateStart();if(this._map){this._map._incr();}},_fireUpdateEnd:function(_d,_e){this.updating=false;this.onUpdateEnd(_d,_e);if(this._map){this._map._decr();}},_getToken:function(){var _f=this._url,crd=this.credential;return (_f&&_f.query&&_f.query.token)||(crd&&crd.token)||undefined;},_findCredential:function(){this.credential=esri.id&&this._url&&esri.id.findCredential(this._url.path);},_useSSL:function(){var _10=this._url,re=/^http:/i,rep="https:";if(this.url){this.url=this.url.replace(re,rep);}if(_10&&_10.path){_10.path=_10.path.replace(re,rep);}},refresh:function(){},show:function(){this.setVisibility(true);},hide:function(){this.setVisibility(false);},getResourceInfo:function(){var _11=this.resourceInfo;return _2.isString(_11)?_2.fromJson(_11):_2.clone(_11);},setNormalization:function(_12){this.normalization=_12;},setVisibility:function(v){if(this.visible!==v){this.visible=v;this.onVisibilityChange(this.visible);}},onLoad:function(){},onVisibilityChange:function(){},onUpdate:function(){},onUpdateStart:function(){},onUpdateEnd:function(){},onError:function(){}});});