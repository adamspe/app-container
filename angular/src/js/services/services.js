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
