var profile = (function(){
  var testResourceRe = /^esri\/tests\//,

    copyOnly = function(filename, mid){
      var list = {
        "esri/package.json":1,
        "esri/esri.profile.js":1,
        "esri/esri.js":1
      };
      
      return (mid in list);
    };

  return {
    resourceTags:{
      test: function(filename, mid){
        return testResourceRe.test(mid) || (mid.search(/\.17$/) !== -1);
      },

      copyOnly: function(filename, mid){
        return copyOnly(filename, mid);
      },

      amd: function(filename, mid){
        return mid.search(/esri\/main/) !== -1;
      }
    }
  };
})();
