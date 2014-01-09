//>>built
// wrapped by build app
define("esri/dijit/editing/Util", ["dijit","dojo","dojox","dojo/require!dojo/DeferredList"], function(dijit,dojo,dojox){
dojo.provide("esri.dijit.editing.Util");
dojo.require("dojo.DeferredList");

esri.dijit.editing.Util.LayerHelper = {
    findFeatures : function(ids, layer, callback){
        var oidFld   = layer.objectIdField;
        var graphics = layer.graphics;
        var features = dojo.filter(graphics, function(graphic){
            return dojo.some(ids, function(id){
                return graphic.attributes[oidFld] === id.objectId;
            });
        });        
        if (callback){
            callback(features);
        } else {        
            return features;
        }
    },
    
    getSelection : function(layers) {
        var selectedFeatures = [];                    
        dojo.forEach(layers, function(layer){            
            var selection = layer.getSelectedFeatures();                        
             dojo.forEach(selection, function(feature){
                 selectedFeatures.push(feature);       
             });            
        });        
        return selectedFeatures;             
      }
};

});
