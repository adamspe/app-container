angular.module('app-container-common.providers',[
    'ngResource'
])
.provider('$typeAheadFinder',[function(){
    this.$get = ['$q','$timeout','$log',function($q,$timeout,$log){
        return function(resource,filterGenerator,filterFunctor) {
            filterGenerator = filterGenerator||function(s){
                return 'contains(text,\''+s+'\')';
            };
            filterFunctor = filterFunctor||angular.identity;
            var $t_promise;
            return function(s) {
                if($t_promise) {
                    $timeout.cancel($t_promise);
                }
                var def = $q.defer();
                $t_promise = $timeout(function(){
                    $log.debug('typeaheadFinder',s);
                    resource.query({
                        $filter: filterGenerator(s)
                    },function(response) {
                        def.resolve(response.list.filter(filterFunctor));
                    });
                    def.promise.then(function(list) {
                        return list;
                    });
                },500);
                return def.promise;
            };
        };
    }];
}])
.provider('$appService',[function(){
    this.apiRoot = '/api/v1/';
    this.$get = ['$resource','$http','$q','$sce',function($resource,$http,$q,$sce){
        var apiRoot = this.apiRoot;
        return function(path,htmlAtts,eachCb) {
            var singleTxfResponse = function(data,header) {
                    var wrapped = angular.fromJson(data);
                    return new R(wrapped);
                },
                BaseCls = $resource(apiRoot+path,{},{
                get: {
                    method: 'GET',
                    transformResponse: singleTxfResponse
                },
                query: {
                    method: 'GET',
                    isArray: false,
                    transformResponse: function(data,header) {
                        var wrapped = angular.fromJson(data);
                        if(wrapped && wrapped.list && wrapped.list.length) {
                            wrapped.list = wrapped.list.map(function(o) {
                                return new R(o);
                            });
                        }
                        return wrapped;
                    }
                },
                update: {
                    method: 'PUT',
                    transformRequest: transformRequest,
                    transformResponse: singleTxfResponse
                },
                save: {
                    method: 'POST',
                    transformRequest: transformRequest,
                    transformResponse: singleTxfResponse
                }
            }),
            R = function() {
                BaseCls.apply(this,arguments);
                R.$$each(this);
            };
            function transformRequest(data,headers) {
                // clean up any trusted HTML references
                R.$$htmlAtts.forEach(function(att){
                    delete data['$'+att];
                });
                // for references that have objects in their place collapse them down to the references the object's contain
                Object.keys(data).forEach(function(att) {
                    if(/^_/.test(att) && angular.isObject(data[att]) && data[att]._id) {
                        data[att] = data[att]._id;
                    }
                });
                return angular.toJson(data);
            }
            Object.getOwnPropertyNames(BaseCls).forEach(function(prop){
                if(['caller','arguments'].indexOf(prop) === -1) {
                    R[prop] = BaseCls[prop];
                }
            });
            R.$$htmlAtts = htmlAtts||[];
            R.$$custom_each = eachCb||angular.identity;
            R.$$each = function(o) {
                o = R.$$custom_each(o);
                R.$$htmlAtts.forEach(function(att){
                    if(o[att]) {
                        o['$'+att] = $sce.trustAsHtml(o[att]);
                    }
                });
                return o;
            };
            R.prototype.chaseLink = function(linkName,ResourceCls,config) {
                var def = $q.defer(),
                    url = this._links[linkName];
                config = config||{};
                $http.get(url,config).then(function(httpR){
                    var response = httpR.data;
                    if(response && response.list) {
                        response.list = response.list.map(function(o){
                            return new ResourceCls(o);
                        });
                        def.resolve(response);
                    } else {
                        def.reject();
                    }
                });
                return def.promise;
            };

            return R;
        };
    }];
}]);
