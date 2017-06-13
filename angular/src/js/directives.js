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
