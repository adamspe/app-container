/*
 * app-container-common
 * Version: 1.0.0 - 2017-06-26
 */

angular.module('app-container-common.directives',[
])
.directive('spinner',['$log',function($log){
    return {
        restrict: 'AEC',
        template: '<md-progress-circular ng-if="working()" md-mode="indeterminate" class="{{class}}"></md-progress-circular>',
        scope: {
            working: '&isWorking'
        },
        link: function($scope,$element,$attrs){
            $log.warn('spinner directive is deprecated, use md-progress-circular directly');
            $scope.class = $attrs.class||'md-accent';
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

/**
 * Deprecated: This code relies on bootstrap CSS and since moving to angular material
 * would be outside of the set of UI elements that should be considered.
 * leaving for now.
 */
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
            isActive: function(paneId){
                return (states[paneId] && states[paneId].active);
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
            var pane = $scope.pane = $scope.$eval($attrs.paneContentTransclude).pane;
            pane.$transcludeFn(pane.$parent,function(contents/*,scope*/){
                angular.forEach(contents,function(node,i){
                    var h;
                    if(!pane.headingElement && isPaneHeading(node)) {
                        pane.headingElement = node;
                    } else {
                        // so nested controllers can bind dynamic content to the heading allow one more level
                        if(!pane.headingElement && (h = getPaneHeading(node))) {
                            pane.headingElement = h;
                        }
                        $elm.append(node);
                    }
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

angular.module('templates-app-container-common', ['js/panes/pane.html', 'js/panes/paneset.html', 'js/panes/static-pane-set.html']);

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
                    var params = filterGenerator(s),
                        input = typeof(params) === 'string' ? {
                            $filter: params
                        } : params;
                    resource.query(input,function(response) {
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
            R.$basePath = (function(fullPath){
                return fullPath.substring(0,fullPath.lastIndexOf('/'));
            })(apiRoot+path);

            return R;
        };
    }];
}]);

angular.module('app-container-common.services',[
    'app-container-common.providers'
])
.factory('DialogService',['$q','$log','$mdDialog',function($q,$log,$mdDialog){
    var service = {
        confirm: function(contents) {
            $log.warn('DialogService deprecated: use $mdDialog directly.');
            var def = $q.defer(),
                confirm = $mdDialog.confirm()
                .title(contents.question)
                .textContent(contents.warning)
                .ariaLabel(contents.ariaLabel)
                .ok(contents.yesText||'Yes')
                .cancel(contents.noText||'No');
            $mdDialog.show(confirm).then(def.resolve,def.reject);
            return def.promise;
        }
    };
    return service;
}])
.factory('NotificationService',['$log','$timeout','$sce','$mdToast',function($log,$timeout,$sce,$mdToast){
    var service = {
        addError: function(error) {
            var errMessage = typeof(error) === 'string' ? error :
                error && error.statusText ? error.statusText : '';
            if(error && error.data && error.data.message) {
                errMessage += ' : '+error.data.message;
            }
            return $mdToast.show($mdToast.simple().textContent(errMessage).position('bottom').action('OK').highlightAction(true).highlightClass('md-warn').hideDelay(0));
        },
        addInfo: function (message) {
            return $mdToast.show($mdToast.simple().textContent(message).position('bottom'));
        },
        hideToast: $mdToast.hide, // resolve existing promise
        cancelToast: $mdToast.cancel // reject existing promise
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
