angular.module('app.menu',[
])
.directive('mainMenu',['User',function(User){
    return {
        restrict: 'E',
        templateUrl: 'js/menu/menu.html',
        link: function($scope,$element,$attrs) {
            $scope.me = User.me();
        }
    };
}]);