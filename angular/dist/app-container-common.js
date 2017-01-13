/*
 * app-container-common
 * Version: 1.0.0 - 2017-01-13
 */

angular.module('app-container-common.filters',[
]);

angular.module('app-container-common',[
    'templates-app-container-common',
    'app-container-common.filters',
    'app-container-common.services',
    'app-container-common.providers'
])
.config(['$logProvider',function($logProvider) {
    $logProvider.debugEnabled(window.location.hash && window.location.hash.match(/^#.*#debug/));
}]);

angular.module('templates-app-container-common', ['js/services/confirm-dialog.html', 'js/services/notification-area.html']);

angular.module("js/services/confirm-dialog.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("js/services/confirm-dialog.html",
    "<div class=\"modal-header\">\n" +
    "    <span ng-if=\"!contents.noIcon\"><i class=\"fa fa-{{contents.icon||'exclamation-triangle'}} fa-{{contents.iconSize||'3'}}x\"></i></span>\n" +
    "    <h4>{{contents.question}}</h4>\n" +
    "</div>\n" +
    "<div class=\"modal-body\">\n" +
    "    <p ng-if=\"contents.warning\" class=\"text-danger\">Warning: {{contents.warning}}</p>\n" +
    "    <p ng-if=\"contents.more\">{{contents.more}}</p>\n" +
    "</div>\n" +
    "<div class=\"modal-footer\">\n" +
    "    <button class=\"btn btn-default\" ng-click=\"no()\">{{contents.noText||'No'}}</button>\n" +
    "    <button class=\"btn btn-default\" ng-click=\"yes()\">{{contents.yesText||'Yes'}}</button>\n" +
    "</div>");
}]);

angular.module("js/services/notification-area.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("js/services/notification-area.html",
    "<div id=\"notification-area\">\n" +
    "    <uib-alert ng-repeat=\"alert in alerts\" type=\"{{alert.type}}\" close=\"closeAlert($index)\"><span ng-bind-html=\"alert.msg\"></span></uib-alert>\n" +
    "</div>");
}]);

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
    this.$get = ['$resource','$http','$q','$sce',function($resource,$http,$q,$sce){
        return function(path,htmlAtts,eachCb) {
            var singleTxfResponse = function(data,header) {
                    var wrapped = angular.fromJson(data);
                    return new R(wrapped);
                },
                BaseCls = $resource(path,{},{
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

angular.module('app-container-common.services',[
    'app-container-common.providers'
])
.controller('ConfirmDialogCtrl',['$scope','$uibModalInstance','contents',function($scope,$uibModalInstance,contents){
    $scope.contents = contents;
    $scope.yes = $uibModalInstance.close;
    $scope.no = $uibModalInstance.dismiss;
}])
.factory('DialogService',['$q','$uibModal',function($q,$uibModal){
    var service = {
        confirm: function(contents) {
            var def = $q.defer();
            $uibModal.open({
                controller: 'ConfirmDialogCtrl',
                templateUrl: 'js/services/confirm-dialog.html',
                windowClass: 'confirm-dialog',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    contents: function() { return contents; }
                }
            }).result.then(def.resolve,def.reject);
            return def.promise;
        }
    };
    return service;
}])
.directive('notificationArea',['NotificationService',function(NotificationService){
    return {
        restrict: 'E',
        templateUrl: 'js/services/notification-area.html',
        link: function($scope) {
            $scope.alerts = NotificationService.getAlerts();
            $scope.closeAlert = NotificationService.closeAlert;
        }
    };
}])
.factory('NotificationService',['$log','$timeout','$sce',function($log,$timeout,$sce){
    var alerts = [];
    var closeAlert = function(index){
        alerts.splice(index,1);
    };
    var service = {
        closeAlert: closeAlert,
        getAlerts: function() {
            return alerts;
        },
        addError: function(error) {
            var errMessage = error && error.statusText ? error.statusText : '';
            if(error && error.data && error.data.message) {
                errMessage += ' : '+error.data.message;
            }
            alerts.push ({type:'danger',msg:$sce.trustAsHtml(errMessage)});
        },
        addInfo: function (message) {
            message = $sce.trustAsHtml(message);
            var ttl = 5000;
            if ( arguments.length > 1 ) { ttl = arguments[1]; }
            var index = (alerts.push({type:'success',msg:message})-1);
            if ( ttl > 0 ) {
              $timeout(function(){closeAlert(index);},ttl);
            }
        },
        clear: function() {
          alerts.length = 0;
        }
    };
    return service;
}]);
