angular.module('app.menu',[
])
.directive('mainMenu',[function(){
    return {
        restrict: 'E',
        templateUrl: 'js/menu/menu.html',
    };
}]);