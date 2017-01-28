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
