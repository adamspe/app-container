/*
 * app-container-common
 * Version: 1.0.0 - 2017-01-29
 */

angular.module('app-container-common.directives',[
])
.directive('spinner',[function(){
    return {
        restrict: 'AEC',
        template: '<i ng-if="working()" class="fa fa-spinner fa-pulse fa-2x"></i>',
        scope: {
            working: '&isWorking'
        }
    };
}]);

angular.module('app-container-common.filters',[
]);

angular.module('app-container-common',[
    'app-container-common.providers',
    'templates-app-container-common',
    'app-container-common.filters',
    'app-container-common.services',
    'app-container-common.directives',
    'app-container-common.panes'
])
.config(['$logProvider',function($logProvider) {
    $logProvider.debugEnabled(window.location.hash && window.location.hash.match(/^#.*#debug/));
}]);

angular.module('app-container-common.panes', [
])
.service('PaneStateService',[function(){
    var states = {},
        service = {
            getState: function(setId,paneId) {
                if(!states[paneId]) {
                    states[paneId] = {
                        paneId: paneId,
                        setId: setId,
                        active: false
                    };
                }
                return states[paneId];
            },
            getStates: function(setId) {
                return Object.keys(states).reduce(function(set,paneId){
                    if(states[paneId].setId === setId) {
                        set.push(states[paneId]);
                    }
                    return set;
                },[]);
            },
            activate: function(paneId) {
                if(states[paneId]) {
                    service.getStates(states[paneId].setId).forEach(function(s){
                        s.active = s.paneId === paneId;
                    });
                }
            },
            deactivate: function(setId) {
                service.getStates(setId).forEach(function(s) {
                    s.active = false;
                });
            },
            anyActive: function(setId) {
                return service.getStates(setId).reduce(function(active,state) {
                    return active||state.active;
                },false);
            },
            updatePaneId: function(newId,oldId) {
                if(newId !== oldId && states[oldId]) {
                    console.log('preUpdate',states,newId,oldId);
                    states[newId] = states[oldId];
                    states[newId].paneId = newId;
                    delete states[oldId];
                    console.log('postUpdate',states);
                    return states[newId];
                }
            }
        };
    return service;
}])
.controller('PaneSetController',['$scope','PaneStateService',function($scope,PaneStateService){
    if(!$scope.uniqueId) {
        throw 'pane-set requires a unique-id.';
    }
    var ctrl = this,
        setId = $scope.uniqueId;

    ctrl.panes = [];
    ctrl.anyActive = function() {
        return PaneStateService.anyActive(setId);
    };
    ctrl.closeContents = function() {
        PaneStateService.deactivate(setId);
    };
    ctrl.addPane = function(pane) {
        //console.log('adding pane ',pane.uniqueId);
        var p = {
            pane: pane
        };
        p.pane.state = PaneStateService.getState(setId,p.pane.uniqueId);
        //p.state =
        ctrl.panes.push(p);
    };
    ctrl.updatePaneId = function(pane,newId,oldId) {
        PaneStateService.updatePaneId(newId,oldId);
    };
    ctrl.removePane = function(pane){
        // not sure if needed yet
    };
    ctrl.select = function(pane,$event,ifNoOtherOpen){
        if(ifNoOtherOpen) {
            if(!ctrl.anyActive()) {
                PaneStateService.activate(pane.uniqueId);
            }
        } else {
            PaneStateService.activate(pane.uniqueId);
        }
    };
}])
.directive('paneSet',[function(){
    return {
        transclude: {
            header: '?paneSetHeader',
            footer: '?paneSetFooter'
        },
        replace: true,
        scope: {
            uniqueId: '@'
        },
        controller: 'PaneSetController',
        controllerAs: 'paneset',
        templateUrl: 'js/panes/paneset.html',
        link: function($scope,$elm,$attrs) {
            var openHeadingCols = parseInt($attrs.openHeadingCols||'6');
            $scope.$watch('paneset.anyActive()',function(active){
                if(!active) {
                    $scope.openLeftCols = 'col-xs-12';
                    $scope.openRightCols = 'col-xs-0';
                } else {
                    $scope.openLeftCols = 'col-xs-0 col-sm-'+openHeadingCols;
                    $scope.openRightCols = 'col-xs-12 col-sm-'+(12-openHeadingCols);
                }
            });
        }
    };
}])
.directive('pane',['$parse',function($parse){
    return {
        restrict: 'E',
        require: '^paneSet',
        transclude: true,
        replace: true,
        templateUrl: 'js/panes/pane.html',
        scope: {
            uniqueId: '@',
            open: '@paneOpen'
        },
        controller: [function(){}], // so other directives can "require"
        controllerAs: 'pane',
        link: function($scope, $elm, $attrs, $paneSetCtrl, $transclude) {
            if(!$scope.uniqueId){
                throw 'pane requires a unique-id.';
            }
            $paneSetCtrl.addPane($scope);
            $scope.$watch('uniqueId',function(newId,oldId) {
                $paneSetCtrl.updatePaneId($scope,newId,oldId);
            });
            $scope.selectability = 'selectable';
            if(typeof($attrs.headingOnly) === 'undefined') {
                $scope.select = function($event) {
                    $paneSetCtrl.select($scope,$event);
                };
            } else {
                $scope.selectability = 'not-selectable';
            }
            $scope.$on('$destroy',function() {
                $paneSetCtrl.removePane($scope);
            });
            $scope.$transcludeFn = $transclude;
            // this does not over-ride previous state, it's initialization only (first time a pane-set is rendered)
            $scope.$watch('open',function(open) {
                if(open === 'true') {
                    $paneSetCtrl.select($scope,{},true);
                }
            });
        }
    };
}])
.directive('paneHeadingTransclude',[function(){
    return {
        restrict: 'A',
        require: '^pane',
        link: function($scope,$elm) {
            $scope.$watch('headingElement',function(heading){
                if(heading) {
                    $elm.html('');
                    $elm.append(heading);
                }
            });
        }
    };
}])
.directive('paneContentTransclude',['$animate','$compile',function($animate,$compile){
    function isPaneHeading(node){
        return node.tagName &&
               (node.tagName.toLowerCase() === 'pane-heading' || node.tagName.toLowerCase() === 'pane-title');
    }
    function getPaneHeading(node) {
        var i;
        if(node.tagName && node.childNodes && node.childNodes.length) {
            for(i = 0; i < node.childNodes.length; i++) {
                if(isPaneHeading(node.childNodes[i])) {
                    return node.childNodes[i];
                }
            }
        }
    }
    return {
        restrict: 'A',
        require: '^paneSet',
        transclude: true,
        link: function($scope,$elm,$attrs,$paneSetCtrl,$transclude) {
            var pane = $scope.$eval($attrs.paneContentTransclude).pane;
            $scope.pane = pane;
            $scope.$watch('pane.state.active',function(active){
                $elm.html('');
                pane.headingElement = null;
                pane.$transcludeFn(pane.$parent,function(contents,scope){
                    angular.forEach(contents,function(node,i){
                        var h;
                        if(!pane.headingElement && isPaneHeading(node)) {
                            pane.headingElement = node;
                        } else {
                            // so nested controllers can bind dynamic content to the heading allow one more level
                            if(!pane.headingElement && (h = getPaneHeading(node))) {
                                pane.headingElement = h;
                            }
                            if(active){
                                $elm.append(node);
                            }
                        }
                    });
                });
            });
        }
    };
}])
.directive('paneTitle',[function(){
    return {
        restrict: 'E',
        template: '<div class="pane-title"><label>{{title}}</label></div>',
        scope: {
            title: '@'
        },
        link: function($scope) {
        }
    };
}])
.directive('paneSetTitle',[function(){
    return {
        restrict: 'C',
        template: '<h3>{{$paneSetTitle}}</h3>',
        link: function($scope,$element,$attrs) {
            $attrs.$observe('title',function(title){
                $scope.$paneSetTitle = title;
            });
        }
    };
}])
.directive('staticPaneSet',[function(){
    return {
        restrict: 'E',
        templateUrl: 'js/panes/static-pane-set.html',
        transclude: {
            header: '?paneSetHeader',
            footer: '?paneSetFooter',
            left: '?paneSetLeft',
            right: '?paneSetRight'
        },
        link: function($scope,$elm,$attrs) {
            // not isolated scope so polluting the parent
            var leftCols = parseInt($attrs.openHeadingCols||'6');
            $scope.$openLeftCols = 'col-xs-'+leftCols;
            $scope.$openRightCols = 'col-xs-'+(12-leftCols);
        }
    };
}]);

angular.module('templates-app-container-common', ['js/panes/pane.html', 'js/panes/paneset.html', 'js/panes/static-pane-set.html', 'js/services/confirm-dialog.html', 'js/services/notification-area.html']);

angular.module("js/panes/pane.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("js/panes/pane.html",
    "<li class=\"pane-heading\" ng-class=\"[{active: state.active},selectability]\" ng-click=\"select($event)\" pane-heading-transclude></li>\n" +
    "");
}]);

angular.module("js/panes/paneset.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("js/panes/paneset.html",
    "<div class=\"container-fluid panes\">\n" +
    "    <div class=\"row\">\n" +
    "        <div class=\"pane headings\" ng-class=\"[openLeftCols]\">\n" +
    "            <div class=\"pane-contents\">\n" +
    "                <div class=\"pane-set-header\" ng-transclude=\"header\"></div>\n" +
    "                <ul class=\"inner list-unstyled\" ng-transclude></ul>\n" +
    "                <div class=\"pane-set-footer\" ng-transclude=\"footer\"></div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <div class=\"pane contents closeable\" ng-class=\"[openRightCols]\">\n" +
    "            <a href class=\"contents-close\" ng-click=\"paneset.closeContents()\"></a>\n" +
    "            <div class=\"pane-contents\">\n" +
    "                <div class=\"inner\" ng-repeat=\"pane in paneset.panes\" ng-show=\"pane.state.active\" pane-content-transclude=\"pane\"></div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("js/panes/static-pane-set.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("js/panes/static-pane-set.html",
    "<div class=\"container-fluid panes static\">\n" +
    "    <div class=\"row\">\n" +
    "        <div class=\"pane headings\" ng-class=\"[$openLeftCols]\">\n" +
    "            <div class=\"pane-contents\">\n" +
    "                <div class=\"pane-set-header\" ng-transclude=\"header\"></div>\n" +
    "                <div class=\"inner\" ng-transclude=\"left\"></div>\n" +
    "                <div class=\"pane-set-footer\" ng-transclude=\"footer\"></div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <div class=\"pane contents\" ng-class=\"[$openRightCols]\">\n" +
    "            <div class=\"pane-contents\">\n" +
    "                <div class=\"inner\" ng-transclude=\"right\"></div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

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
    "    <div uib-alert ng-repeat=\"alert in alerts\" ng-class=\"'alert-'+alert.type\" close=\"closeAlert($index)\"><span ng-bind-html=\"alert.msg\"></span></div>\n" +
    "</div>\n" +
    "");
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
.provider('$apiConfig',[function(){
    this.apiRoot = '/api/v1/';
    this.$get = [function(){
        return {
            apiRoot: this.apiRoot
        };
    }];
}])
.provider('$appService',[function(){
    this.$get = ['$log','$resource','$http','$q','$sce','$apiConfig',function($log,$resource,$http,$q,$sce,$apiConfig){
        $log.debug('$apiConfig',$apiConfig);
        var apiRoot = $apiConfig.apiRoot;
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
}])
.factory('WebSocketConnection',['$log','$window','$apiConfig',function($log,$window,$apiConfig){
    var WebSocket = $window.WebSocket || $window.MozWebSocket;
    function WebSocketConnection(path,onOpen) {
        this.$wsUrl = 'ws://'+$window.location.host+(path.charAt(0) === '/' ? path : ($apiConfig.apiRoot)+path);
        $log.debug('WebSocketConnection.wsUrl',this.$wsUrl);
        this.$cx = new WebSocket(this.$wsUrl);
        if(typeof(onOpen) === 'function') {
            this.$cx.onopen = onOpen;
        }
    }
    WebSocketConnection.prototype.url = function() {
        return this.$wsUrl;
    };
    WebSocketConnection.prototype.connection = function() {
        return this.$cx;
    };
    WebSocketConnection.prototype.onMessage = function (handler) {
        var self = this;
        self.connection().onmessage = function(event) {
            $log.debug('WebSocketConnection.message',event);
            var msg = event.data;
            if(typeof(msg) === 'string' && msg.charAt(0) === '{') {
                msg = JSON.parse(msg);
            }
            handler(msg,event);
        };
    };
    WebSocketConnection.prototype.send = function(msg) {
        if(typeof(msg) === 'object') {
            msg = JSON.stringify(msg);
        }
        $log.debug('WebSocketConnection.send',msg);
        this.connection().send(msg);
    };
    WebSocketConnection.prototype.connectionCloser = function() {
        var self = this;
        return function() {
            self.connection().close();
        };
    };
    return WebSocketConnection;
}]);
