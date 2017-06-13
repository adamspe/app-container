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
