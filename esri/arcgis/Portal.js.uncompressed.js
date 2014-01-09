//>>built
// wrapped by build app
define("esri/arcgis/Portal", ["dijit","dojo","dojox","dojo/require!dojox/socket,dojox/socket/Reconnect,dojo/DeferredList,esri/IdentityManager"], function(dijit,dojo,dojox){
dojo.provide("esri.arcgis.Portal");

dojo.require("dojox.socket");
dojo.require("dojox.socket.Reconnect");
dojo.require("dojo.DeferredList");
dojo.require("esri.IdentityManager");

(function () {
  var esriPortal = {'options':{'disableIdentityLookup':true}, 'requestParams':{'f':'json'}};
  dojo.declare("esri.arcgis.Portal", null, {
    onLoad:function () {
    },

    constructor:function (url) {
      dojo.mixin(this, {'url':url});
      this.init(url).then(dojo.hitch(this, 'onLoad', this));
    },

    init:function (url, credential) {
      url = (url || this.portalUrl).replace(/\/+$/, "");
      var idx = url.indexOf('/sharing');
      this.portalUrl = (idx !== -1 ? (url + '/') : (url + '/sharing/rest/'));
      return this._getSelf(this.portalUrl).then(dojo.hitch(this, function (result) {
        var self = result;
        var userInfo = result.user;
        if (userInfo) {
          userInfo.portal = this;
          userInfo = new esri.arcgis.PortalUser(userInfo);
        }
        esriPortal.self = dojo.mixin({}, self);
        // Set extra query to limit searches to org, if searching public is false        
        if (esriPortal.self.id && esriPortal.self.canSearchPublic === false){
          esriPortal.extraQuery = ' AND orgid:' + self.id;
        }
        dojo.mixin(this, esriPortal.self);
        esriPortal.loggedInUser = dojo.mixin({}, dojo.mixin(userInfo, {'credential':credential}));
        this.thumbnailUrl = esri.arcgis.PortalUtil.formatUrl(this.portalUrl + 'accounts/self/resources/' + this.thumbnail);
        this.isOrganization = (this.access && this.access.length) || false;
        this.created = new Date(this.created);
        this.modified = new Date(this.modified);
        this.defaultExtent = this.defaultExtent;
        return this;
      }));
    },

    signIn:function () {
      esriPortal.options.disableIdentityLookup = false;
      return esri.id.getCredential(this.url).then(dojo.hitch(this, 'init', this.url)).then(function () {
        return esriPortal.loggedInUser;
      }, function (error) {
        esriPortal.options.disableIdentityLookup = true;
        throw error;
      });
    },

    signOut:function () {
      esriPortal.loggedInUser.credential && esriPortal.loggedInUser.credential.destroy();
      esriPortal.loggedInUser = null;
      esriPortal.options.disableIdentityLookup = true;
      esri.arcgis.PortalUtil.clearFieldsFromObject(esriPortal.self, this);
      esriPortal.self = null;
      return this.init(this.url);
    },

    queryGroups:function (queryParams) {
      return this._queryPortal(this.portalUrl + 'community/groups', esri.arcgis.PortalUtil.formatQueryParams({}, queryParams), esri.arcgis.PortalGroup);
    },

    queryItems:function (queryParams) {
      return this._queryPortal(this.portalUrl + 'search', esri.arcgis.PortalUtil.formatQueryParams({}, queryParams), esri.arcgis.PortalItem);
    },

    queryUsers:function (queryParams) {
      return this._queryPortal(this.portalUrl + 'community/users', esri.arcgis.PortalUtil.formatQueryParams({'sortField':'username'}, queryParams), esri.arcgis.PortalUser);
    },

    _getSelf:function (url) {
      var selfUrl = url + "accounts/self?" + "culture=" + dojo.locale;
      return esri.arcgis.PortalUtil.request(selfUrl);
    },

    _queryPortal:function (url, queryParams, type) {
      var params = dojo.mixin({'num':10, 'start':0, 'sortField':'title', 'sortOrder':'asc'}, queryParams),
        hideFields = ['start', 'query', 'num', 'nextStart'],
        dfd = esri.arcgis.PortalUtil.request(url, params).then(dojo.hitch(this, function (result) {
          result.results = esri.arcgis.PortalUtil.resultsToTypedArray(type, {'portal':this}, result.results);
          result.queryParams = dojo.mixin({}, params);
          result.nextQueryParams = dojo.mixin(params, {'start':result.nextStart});
          return esri.arcgis.PortalUtil.clearFieldsFromObject(hideFields, result);
        }));
      dfd = dojo.delegate(dfd);
      dfd.queryParams = dojo.mixin({}, params);
      dfd.nextQueryParams = dojo.when(dfd, function (result) {
        return result.nextQueryParams;
      });
      return esri.arcgis.PortalResult(dfd);
    }
  });

  esri.arcgis.PortalResult = function (result) {
    if (!result) {
      return result;
    }

    if (result.then) {
      result = dojo.delegate(result);
    }

    if (!result.total) {
      result.total = dojo.when(result, function (result) {
        return esri._isDefined(result.total) ? result.total : (result.length || 0);
      });
    }

    function addIterativeMethod(method) {
      if (!result[method]) {
        result[method] = function () {
          var args = arguments;
          return dojo.when(result, function (result) {
            Array.prototype.unshift.call(args, (result.results || result));
            return esri.arcgis.PortalResult(dojo[method].apply(dojo, args));
          });
        };
      }
    }

    addIterativeMethod("forEach");
    addIterativeMethod("filter");
    addIterativeMethod("map");
    addIterativeMethod("some");
    addIterativeMethod("every");

    return result;
  };

  dojo.declare("esri.arcgis.PortalFolder", null, {
    constructor:function (params) {
      dojo.mixin(this, params);
      this.url = (this.portal && this.portal.portalUrl) + 'content/users/' + this.username + '/' + this.id;
      this.created = new Date(this.created);
    },

    getItems:function () {
      return esri.arcgis.PortalUtil.requestToTypedArray(this.url, null, null, esri.arcgis.PortalItem, {'portal':this.portal, 'folderId':this.id});
    }
  });

  dojo.declare("esri.arcgis.PortalGroup", null, {
    constructor:function (params) {
      dojo.mixin(this, params);
      this.url = (this.portal && this.portal.portalUrl) + 'community/groups/' + this.id;
      this.thumbnailUrl = esri.arcgis.PortalUtil.formatUrl(this.url + '/info/' + this.thumbnail);
      this.modified = new Date(this.modified);
      this.created = new Date(this.created);
    },

    getMembers:function () {
      return esri.arcgis.PortalUtil.request(this.url + '/users');
    },

    queryItems:function (queryParams) {
      queryParams = esri.arcgis.PortalUtil.formatQueryParams({}, queryParams);
      queryParams.q = 'group:' + this.id + (queryParams.q ? (' ' + queryParams.q) : '');
      return this.portal.queryItems(queryParams);
    }
  });

  dojo.declare("esri.arcgis.PortalItem", null, {
    constructor:function (params) {
      dojo.mixin(this, params);
      this.itemUrl = (this.portal && this.portal.portalUrl) + 'content/items/' + this.id;
      this.userItemUrl = esri.arcgis.PortalUtil.formatUrl(this.itemUrl.replace('content', ('content/users/' + this.owner) + (this.folderId ? '/' + this.folderId : '')));
      this.itemDataUrl = esri.arcgis.PortalUtil.formatUrl(this.itemUrl + '/data');
      this.thumbnailUrl = esri.arcgis.PortalUtil.formatUrl(this.itemUrl + '/info/' + this.thumbnail);
      this.extent = this.extent;
      this.spatialReference = this.spatialReference;
      this.created = new Date(this.created);
      this.uploaded = new Date(this.uploaded);
      this.modified = new Date(this.modified);
    },

    addComment:function (comment) {
      var params = dojo.isString(comment) ? {'comment':comment} : comment;
      return esri.arcgis.PortalUtil.request(this.itemUrl + '/addComment', params, {'usePost':true}).then(dojo.hitch(this, function (result) {
        return new esri.arcgis.PortalComment(dojo.mixin(params, {'id':result.commentId, 'item':this}));
      }));
    },

    updateComment:function (comment) {
      if (comment && comment.url && comment.comment) {
        var params = {'comment':comment.comment};
        return esri.arcgis.PortalUtil.request(comment.url + '/update', params, {'usePost':true}).then(function (result) {
          comment.id = result.commentId
          return comment;
        });
      } else {
        throw new Error();
      }
    },

    getComments:function () {
      return esri.arcgis.PortalUtil.requestToTypedArray(this.itemUrl + '/comments', null, null, esri.arcgis.PortalComment, {'item':this});
    },

    deleteComment:function (comment) {
      if (comment && comment.url) {
        return esri.arcgis.PortalUtil.request(comment.url + '/delete', null, {'usePost':true});
      } else {
        throw new Error();
      }
    },

    addRating:function (rating) {
      var params = dojo.isObject(rating) ? rating : {'rating':parseFloat(rating)};
      return esri.arcgis.PortalUtil.request(this.itemUrl + '/addRating', params, {'usePost':true}).then(dojo.hitch(this, function (result) {
        return new esri.arcgis.PortalRating(dojo.mixin(params, {'id':result.ratingId, 'item':this}));
      }));
    },

    getRating:function () {
      return esri.arcgis.PortalUtil.request(this.itemUrl + '/rating').then(dojo.hitch(this, function (rating) {
        return new esri.arcgis.PortalRating(dojo.mixin(rating, {'item':this}));
      }));
    },

    deleteRating:function () {
      return esri.arcgis.PortalUtil.request(this.itemUrl + '/deleteRating', null, {'usePost':true});
    }
  });

  dojo.declare("esri.arcgis.PortalComment", null, {
    constructor:function (params) {
      dojo.mixin(this, params);
      this.url = this.item.itemUrl + '/comments/' + this.id;
      this.created = new Date(this.created);
    }
  });

  dojo.declare("esri.arcgis.PortalRating", null, {
    constructor:function (params) {
      dojo.mixin(this, params);
      this.url = this.item.itemUrl + '/rating';
      this.created = new Date(this.created);
    }
  });

  dojo.declare("esri.arcgis.PortalUser", null, {
    constructor:function (params) {
      dojo.mixin(this, params);
      this.url = (this.portal && this.portal.portalUrl) + 'community/users/' + this.username;
      this.thumbnailUrl = esri.arcgis.PortalUtil.formatUrl(this.url + '/info/' + this.thumbnail);
      this.extent = this.extent;
      this.modified = new Date(this.modified);
      this.created = new Date(this.created);
    },

    getGroups:function () {
      return esri.arcgis.PortalResult(esri.arcgis.PortalUtil.request(this.url).then(function (result) {
        return esri.arcgis.PortalUtil.resultsToTypedArray(esri.arcgis.PortalGroup, {'portal':this.portal}, result.groups);
      }));
    },

    getNotifications:function () {
      return esri.arcgis.PortalUtil.requestToTypedArray(this.url + '/notifications', null, null, null, {'portal':this.portal});
    },

    getGroupInvitations:function () {
      return esri.arcgis.PortalUtil.requestToTypedArray(this.url + '/invitations', null, null, null, {'portal':this.portal});
    },

    getTags:function () {
      return esri.arcgis.PortalUtil.requestToTypedArray(this.url + '/tags', null, null, null, {'portal':this.portal});
    },

    getFolders:function () {
      return esri.arcgis.PortalResult(this.getContent().then(function (result) {
        return result.folders;
      }));
    },

    getItems:function (folderId) {
      return esri.arcgis.PortalResult(this.getContent(folderId).then(function (result) {
        return result.items;
      }));
    },

    getContent:function (folderId) {
      var url = (this.url.replace('community', 'content')) + (folderId ? ('/' + folderId) : '');
      return esri.arcgis.PortalUtil.request(url).then(dojo.hitch(this, function (content) {
        content.folders = esri.arcgis.PortalUtil.resultsToTypedArray(esri.arcgis.PortalFolder, {'portal':this.portal}, content.folders);
        content.items = esri.arcgis.PortalUtil.resultsToTypedArray(esri.arcgis.PortalItem, {'portal':this.portal, 'folderId':folderId}, content.items);
        return content;
      }));
    }
  });

  esri.arcgis.PortalUtil = {
    useSSL:function (currentProtocol, url) {
      return (currentProtocol.indexOf('https:') !== -1 || (esriPortal.self && esriPortal.self.allSSL)) ? url.replace('http:', 'https:') : url;
    },

    formatUrl:function (url) {
      var token = esriPortal.loggedInUser && esriPortal.loggedInUser.credential && esriPortal.loggedInUser.credential.token;
      return url.indexOf('null') !== -1 ? null : (token ? url + (url.indexOf('?') !== -1 ? '&' : '?') + ('token=' + token) : url);
    },

    resultsToTypedArray:function (type, mixin, results) {
      results = results ? (results.notifications || results.userInvitations || results.tags || results.items || results.groups || results.comments || results.results || results) : [];
      return  dojo.map(results, function (result) {
        result = dojo.mixin(result, mixin || {});
        return type ? new type(result) : result;
      });
    },

    clearFieldsFromObject:function (flds, obj) {
      if (!dojo.isArray(flds)) {
        for (var fld in flds) {
          delete obj[fld];
        }
      } else {
        for (var i = 0, l = flds.length; i < l; i++) {
          delete obj[flds[i]];
        }
      }
      return obj;
    },

    getSocket:function (url, options) {
      options = options || {};
      var socket = dojox.socket({
        url:url,
        transport:options.transport || esri.arcgis.PortalUtil.request,
        interval:options.interval || 60000
      });
      if (!options.reconnect === false) {
        socket = dojox.socket.Reconnect(socket);
      }
      return socket;
    },

    requestToTypedArray:function (url, params, options, type, parent) {
      return esri.arcgis.PortalResult(esri.arcgis.PortalUtil.request(url, params, options).then(dojo.partial(esri.arcgis.PortalUtil.resultsToTypedArray, type, parent)));
    },

    request:function (url, params, options) {
      params && params.portal && delete params.portal;
      var content = dojo.mixin(dojo.mixin({}, params || {}), esriPortal.requestParams);
      var rOptions = dojo.mixin(options || {}, esriPortal.options);
      return esri.request({
        url:esri.arcgis.PortalUtil.useSSL(window.location.protocol, (url.url || url)),
        content:content,
        callbackParamName:'callback',
        timeout:(rOptions && rOptions.timeout) || 0
      }, rOptions);
    },

    formatQueryParams:function (defaultValues, queryParams) {
      var qp = dojo.mixin(dojo.mixin({}, defaultValues), (dojo.isString(queryParams) ? {'q':queryParams} : (queryParams || {})));           
      qp.q = esriPortal.extraQuery ? '(' + qp.q + ')' + esriPortal.extraQuery : qp.q;            
      return qp;
    }
  };
})();

});
