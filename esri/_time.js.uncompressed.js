//>>built
// wrapped by build app
define("esri/_time", ["dijit","dojo","dojox"], function(dijit,dojo,dojox){
dojo.provide("esri._time");

dojo.declare("esri.TimeExtent", null, {
    constructor: function(json) {
      if (arguments.length > 1) { // multiple arguments: <Date> start, <Date> end
        this._create(arguments[0], arguments[1]);
      }
      else { // one argument
        if (json) {
          if (dojo.isArray(json)) {
            var start = json[0], end = json[1];
            this.startTime = (start === null || start === "null") ? null : new Date(start);                             
            this.endTime = (end === null || end === "null") ? null : new Date(end);              
          }
          else if (json instanceof Date) {
            this._create(json, null);
          }
          /*else if (json.declaredClass === "esri.TimeExtent") {
            this._create(json.startTime, json.endTime);
          }*/
        } // json
      } // one
    },
    
    offset: function(/*Number*/ offsetValue, /*String*/ offsetUnits) {
      var retVal = new esri.TimeExtent();
      
      var start = this.startTime, end = this.endTime;
      if (start) {
        retVal.startTime = this._getOffsettedDate(start, offsetValue, offsetUnits);
      }
      if (end) {
        retVal.endTime = this._getOffsettedDate(end, offsetValue, offsetUnits);
      }
      
      return retVal;
    },
    
    intersection: function(inTimeExtent) {
      return this._intersection(this, inTimeExtent);
    },
    
    toJson: function() {
      var retVal = [];
      
      var start = this.startTime;
      retVal.push(start ? start.getTime() : "null");
      
      var end   = this.endTime;
      retVal.push(end ? end.getTime() : "null");
      
      return retVal;
    },
    
    /***********
     * Internal
     ***********/
    
    _create: function(/*Date*/ start, /*Date*/ end) {
      this.startTime = start ? new Date(start) : null;
      this.endTime = end ? new Date(end) : null;
    },
    
    // some reference data for calculating date/time offsets
    _refData: {
      "esriTimeUnitsMilliseconds":   { getter: "getUTCMilliseconds", setter: "setUTCMilliseconds", multiplier: 1 },
      "esriTimeUnitsSeconds":   { getter: "getUTCSeconds", setter: "setUTCSeconds", multiplier: 1 },
      "esriTimeUnitsMinutes":   { getter: "getUTCMinutes", setter: "setUTCMinutes", multiplier: 1 },
      "esriTimeUnitsHours":     { getter: "getUTCHours", setter: "setUTCHours", multiplier: 1 },
      "esriTimeUnitsDays":      { getter: "getUTCDate", setter: "setUTCDate", multiplier: 1 },
      "esriTimeUnitsWeeks":     { getter: "getUTCDate", setter: "setUTCDate", multiplier: 7 },
      "esriTimeUnitsMonths":    { getter: "getUTCMonth", setter: "setUTCMonth", multiplier: 1 },
      "esriTimeUnitsYears":     { getter: "getUTCFullYear", setter: "setUTCFullYear", multiplier: 1 },
      "esriTimeUnitsDecades":   { getter: "getUTCFullYear", setter: "setUTCFullYear", multiplier: 10 },
      "esriTimeUnitsCenturies": { getter: "getUTCFullYear", setter: "setUTCFullYear", multiplier: 100 }
    },
    
    /*_intersection: function(timeExtent1, timeExtent2) {
      // Test cases
      // instants
      console.log( _intersection({startTime: 1}, {endTime: 6}) === null );
      console.log( _intersection({endTime: 3}, {startTime: 3}).join(",") === "3" );
      
      // instant, extent
      console.log( _intersection({startTime: 1}, {startTime: 2, endTime: 6}) === null );
      console.log( _intersection({endTime: 3}, {startTime: 2, endTime: 6}).join(",") === "3" );
      
      // extent, instant
      console.log( _intersection({startTime: 2, endTime: 6}, {startTime: 10}) === null );
      console.log( _intersection({startTime: 2, endTime: 6}, {endTime: 6}).join(",") === "6" );
      
      // invalid arguments
      console.log( _intersection({startTime: 1, endTime: 2}, {}) === null );
      console.log( _intersection({}, {startTime: 1, endTime: 2}) === null );
      console.log( _intersection({}, {}) === null );

      // no overlap
      console.log( _intersection({startTime: 1, endTime: 2}, {startTime: 3, endTime: 4}) === null );
      console.log( _intersection({startTime: 3, endTime: 4}, {startTime: 1, endTime: 2}) === null );
      
      // overlap in the middle
      console.log( _intersection({startTime: 1, endTime: 4}, {startTime: 2, endTime: 6}).join(",") === "2,4" );
      console.log( _intersection({startTime: 2, endTime: 6}, {startTime: 1, endTime: 4}).join(",") === "2,4" );
      
      // overlap to the left
      console.log( _intersection({startTime: 1, endTime: 4}, {startTime: 1, endTime: 2}).join(",") === "1,2" );
      console.log( _intersection({startTime: 1, endTime: 2}, {startTime: 1, endTime: 4}).join(",") === "1,2" );
      
      // overlap to the right
      console.log( _intersection({startTime: 1, endTime: 4}, {startTime: 3, endTime: 4}).join(",") === "3,4" );
      console.log( _intersection({startTime: 3, endTime: 4}, {startTime: 1, endTime: 4}).join(",") === "3,4" );
      
      // contains
      console.log( _intersection({startTime: 1, endTime: 5}, {startTime: 2, endTime: 3}).join(",") === "2,3" );
      console.log( _intersection({startTime: 2, endTime: 3}, {startTime: 1, endTime: 5}).join(",") === "2,3" );
      
      // within
      console.log( _intersection({startTime: 2, endTime: 4}, {startTime: 1, endTime: 5}).join(",") === "2,4" );
      console.log( _intersection({startTime: 1, endTime: 5}, {startTime: 2, endTime: 4}).join(",") === "2,4" );

      if (timeExtent1 && timeExtent2) {
        var res1 = this._getKind(timeExtent1), valid1 = res1[0], kind1 = res1[1];
        var res2 = this._getKind(timeExtent2), valid2 = res2[0], kind2 = res2[1];
        
        // invalid arguments
        if (!(valid1 && valid2)) {
          return null;
        }
        
        var isInstant1 = (kind1 === "instant");
        var isInstant2 = (kind2 === "instant");
        
        // both instants
        if (isInstant1 && isInstant2) {
          return this._instantsIntersection(timeExtent1, timeExtent2);
        }
        
        if (isInstant1) {
          return this._mixedIntersection(timeExtent1, timeExtent2);
        }
        else if (isInstant2) {
          return this._mixedIntersection(timeExtent2, timeExtent1);
        }
        
        var start1 = timeExtent1.startTime.getTime(), end1 = timeExtent1.endTime.getTime();
        var start2 = timeExtent2.startTime.getTime(), end2 = timeExtent2.endTime.getTime();
        var start, end;
        
        // Is 'start2' in between the first extent?
        if (start2 >= start1 && start2 <= end1) {
          start = start2;
        }
        // Is 'start1' in between the second extent? 
        else if (start1 >= start2 && start1 <= end2) {
          start = start1;
        }
        
        // Is 'end1' in between the second extent?
        if (end1 >= start2 && end1 <= end2) {
          end = end1;
        }
        // Is 'end2' in between the first extent?
        else if (end2 >= start1 && end2 <= end1) {
          end = end2;
        }
    
        if (start && end) {
          var overlap = new esri.TimeExtent();
          overlap.startTime = new Date(start);
          overlap.endTime = new Date(end);
          return overlap;
        }
        else {
          return null;
        }
      }
      else {
        return null;
      }
    },*/
    
    _intersection: function(timeExtent1, timeExtent2) {
      /*// Test cases:
      // null - null
      console.log("1. ", _intersection(null, null) === null );
      
      // value - null
      console.log("2. ", _intersection({startTime: new Date(100), endTime: new Date(200)}, null) === null );
      
      // null - value
      console.log("3. ", _intersection(null, {startTime: new Date(100), endTime: new Date(200)}) === null );
      
      // value1 - value2
      //  [1] value1 = instant, value2 = instant
      //  no overlap
      console.log("4. ", _intersection({startTime: new Date(100), endTime: new Date(100)}, 
                                 {startTime: new Date(200), endTime: new Date(200)}) === null );
      //  overlap
      console.log("5. ", _intersection({startTime: new Date(100), endTime: new Date(100)}, 
                                 {startTime: new Date(100), endTime: new Date(100)})
                                 .toJson().join(",") === "100,100" );
      
      //  [2] value1 = instant, value2 = extent
      //  no overlap
      console.log("6. ", _intersection({startTime: new Date(100), endTime: new Date(100)}, 
                                 {startTime: new Date(200), endTime: new Date(300)}) === null );
      //  overlap: middle
      console.log("7. ", _intersection({startTime: new Date(100), endTime: new Date(100)}, 
                                 {startTime: new Date(50), endTime: new Date(150)})
                                 .toJson().join(",") === "100,100" );
      
      //  overlap: left
      console.log("8. ", _intersection({startTime: new Date(100), endTime: new Date(100)}, 
                                 {startTime: new Date(100), endTime: new Date(150)})
                                 .toJson().join(",") === "100,100" );

      //  overlap: right
      console.log("9. ", _intersection({startTime: new Date(100), endTime: new Date(100)}, 
                                 {startTime: new Date(50), endTime: new Date(100)})
                                 .toJson().join(",") === "100,100" );
      
      //  [3] value1 = instant, value2 = special
      //  no overlap: left
      console.log("10. ", _intersection({startTime: new Date(100), endTime: new Date(100)}, 
                                 {startTime: new Date(200), endTime: null}) === null );
      //  no overlap: right
      console.log("11. ", _intersection({startTime: new Date(400), endTime: new Date(400)}, 
                                 {startTime: null, endTime: new Date(300)}) === null );
      //  overlap: middle, special = start
      console.log("12. ", _intersection({startTime: new Date(200), endTime: new Date(200)}, 
                                 {startTime: null, endTime: new Date(300)})
                                 .toJson().join(",") === "200,200" );
      //  overlap: middle, special = end
      console.log("13. ", _intersection({startTime: new Date(300), endTime: new Date(300)}, 
                                 {startTime: new Date(200), endTime: null})
                                 .toJson().join(",") === "300,300" );
      //  overlap with start
      console.log("14. ", _intersection({startTime: new Date(300), endTime: new Date(300)}, 
                                 {startTime: new Date(300), endTime: null})
                                 .toJson().join(",") === "300,300" );
      //  overlap with end
      console.log("15. ", _intersection({startTime: new Date(200), endTime: new Date(200)}, 
                                 {startTime: null, endTime: new Date(200)})
                                 .toJson().join(",") === "200,200" );
      
      //  [4] value1 = extent, value2 = extent
      //  no overlap
      console.log("16. ", _intersection({startTime: new Date(100), endTime: new Date(200)}, 
                                 {startTime: new Date(300), endTime: new Date(400)}) === null );
      //  overlap: middle
      console.log("17. ", _intersection({startTime: new Date(100), endTime: new Date(200)}, 
                                 {startTime: new Date(150), endTime: new Date(250)})
                                 .toJson().join(",") === "150,200" );
      //  overlap: left
      console.log("18. ", _intersection({startTime: new Date(100), endTime: new Date(200)}, 
                                 {startTime: new Date(100), endTime: new Date(150)})
                                 .toJson().join(",") === "100,150" );
      //  overlap: right
      console.log("19. ", _intersection({startTime: new Date(100), endTime: new Date(200)}, 
                                 {startTime: new Date(150), endTime: new Date(200)})
                                 .toJson().join(",") === "150,200" );
      //  contains
      console.log("20. ", _intersection({startTime: new Date(100), endTime: new Date(200)}, 
                                 {startTime: new Date(125), endTime: new Date(175)})
                                 .toJson().join(",") === "125,175" );
      
      //  [5] value1 = special, value2 = special
      //  value1: start, value2: start
      console.log("21. ", _intersection({startTime: new Date(200), endTime: null}, 
                                 {startTime: new Date(100), endTime: null})
                                 .toJson().join(",") === "200,null" );
      //  value1: start, value2: end
      //  no overlap
      console.log("22. ", _intersection({startTime: new Date(400), endTime: null}, 
                                 {startTime: null, endTime: new Date(300)}) === null );
      //  overlap
      console.log("23. ", _intersection({startTime: new Date(400), endTime: null}, 
                                 {startTime: null, endTime: new Date(450)})
                                 .toJson().join(",") === "400,450" );
      //  value1: end, value2: start
      //  no overlap
      console.log("24. ", _intersection({startTime: null, endTime: new Date(400)}, 
                                 {startTime: new Date(500), endTime: null}) === null );
      //  overlap
      console.log("25. ", _intersection({startTime: null, endTime: new Date(450)}, 
                                 {startTime: new Date(400), endTime: null})
                                 .toJson().join(",") === "400,450" );
      //  value1: end, value2: end
      console.log("26. ", _intersection({startTime: null, endTime: new Date(300)}, 
                                 {startTime: null, endTime: new Date(400)})
                                 .toJson().join(",") === "null,300" );*/
      
      if (timeExtent1 && timeExtent2) {
        var start1 = timeExtent1.startTime, end1 = timeExtent1.endTime;
        var start2 = timeExtent2.startTime, end2 = timeExtent2.endTime;
        start1 = start1 ? start1.getTime() : -Infinity;
        start2 = start2 ? start2.getTime() : -Infinity;
        end1 = end1 ? end1.getTime() : Infinity;
        end2 = end2 ? end2.getTime() : Infinity;

        var start, end;
        
        // Is 'start2' in between the first extent?
        if (start2 >= start1 && start2 <= end1) {
          start = start2;
        }
        // Is 'start1' in between the second extent? 
        else if (start1 >= start2 && start1 <= end2) {
          start = start1;
        }
        
        // Is 'end1' in between the second extent?
        if (end1 >= start2 && end1 <= end2) {
          end = end1;
        }
        // Is 'end2' in between the first extent?
        else if (end2 >= start1 && end2 <= end1) {
          end = end2;
        }
    
        if (!isNaN(start) && !isNaN(end)) {
          var overlap = new esri.TimeExtent();
          overlap.startTime = (start === -Infinity) ? null : new Date(start);
          overlap.endTime = (end === Infinity) ? null : new Date(end);
          return overlap;
        }
        else {
          return null;
        }
      }
      else {
        return null;
      }
    },
    
    /*_instantsIntersection: function(instant1, instant2) {
      var time1 = (instant1.startTime || instant1.endTime).getTime();
      var time2 = (instant2.startTime || instant2.endTime).getTime();
      
      if (time1 === time2) {
        var out = new esri.TimeExtent();
        out.startTime = new Date(time1);
        return out;
      }
      return null;
    },
    
    _mixedIntersection: function(instant, extent) {
      var instantTime = (instant.startTime || instant.endTime).getTime();
      var start = extent.startTime.getTime(), end = extent.endTime.getTime();
      
      if (instantTime >= start && instantTime <= end) {
        var out = new esri.TimeExtent();
        out.startTime = new Date(instantTime);
        return out;
      }
      return null;
    },
    
    _getKind: function(extent) {
      var start = extent.startTime, end = extent.endTime;
      if (start && end) {
        return [true, "extent"];
      }
      if (start || end) {
        return [ true, "instant" ];
      }
      return [ false ];
    },*/
    
    _getOffsettedDate: function(inDate, offset, units) {
      /*// Test cases:
      console.log("45000 ms - ", esri.TimeExtent.prototype._getOffsettedDate(new Date(1990, 0, 1), 45000, "UNIT_MILLISECONDS"));
      console.log("1000 s - ", esri.TimeExtent.prototype._getOffsettedDate(new Date(1990, 0, 1), 1000, "UNIT_SECONDS"));
      console.log("1500 m - ", esri.TimeExtent.prototype._getOffsettedDate(new Date(1990, 0, 1), 1500, "UNIT_MINUTES"));
      console.log("100 h - ", esri.TimeExtent.prototype._getOffsettedDate(new Date(1990, 0, 1), 100, "UNIT_HOURS"));
      console.log("100 days - ", esri.TimeExtent.prototype._getOffsettedDate(new Date(1990, 0, 1), 100, "UNIT_DAYS"));
      console.log("100 weeks - ", esri.TimeExtent.prototype._getOffsettedDate(new Date(1990, 0, 1), 100, "UNIT_WEEKS"));
      console.log("100 months - ", esri.TimeExtent.prototype._getOffsettedDate(new Date(1990, 0, 1), 100, "UNIT_MONTHS"));
      console.log("100 years - ", esri.TimeExtent.prototype._getOffsettedDate(new Date(1990, 0, 1), 100, "UNIT_YEARS"));
      console.log("7 decades - ", esri.TimeExtent.prototype._getOffsettedDate(new Date(1990, 0, 1), 7, "UNIT_DECADES"));
      console.log("5 centuries - ", esri.TimeExtent.prototype._getOffsettedDate(new Date(1990, 0, 1), 5, "UNIT_CENTURIES"));*/
      
      var data = this._refData;
      var outDate = new Date(inDate.getTime());
       
      if (offset && units) {
        var data = data[units];
        outDate[data.setter](outDate[data.getter]() + (offset * data.multiplier));
      }
      
      return outDate;
    }
    
  }
);
 
dojo.declare("esri.TimeReference", null, {
   constructor: function(json) {
     //respectsDaylightSaving : Boolean      
     //timeZone : String
     if (json) {
         dojo.mixin(this, json);      
     }             
   }
 }
);

});
