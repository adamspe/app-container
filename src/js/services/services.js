angular.module('app.services',[
    'ngResource'
])
.provider('$appService',[function(){
    this.$get = ['$resource',function($resource){
        return function(path) {
            var BaseCls = $resource(path,{},{
                query: {
                    method: 'GET',
                    isArray: false,
                    transformResponse: function(data,header) {
                        var wrapped = angular.fromJson(data);
                        if(wrapped && wrapped.list && wrapped.list.length) {
                            wrapped.list = wrapped.list.map(function(o) {
                                return new BaseCls(o);
                            });
                        }
                        return wrapped;
                    }
                },
                update: { method: 'PUT' },
            });

            return BaseCls;
        };
    }];
}])
.service('User',['$appService',function($appService) {
    var User = $appService('/api/user/:id'),
        me;
    // the server side uses a role array but for the purposes
    // of the starter app dumbing this down to admin/non-admin.
    User.prototype.isAdmin = function() {
        return this.roles && this.roles.length && this.roles.indexOf('admin') !== -1;
    };
    User.prototype.makeAdmin = function() {
        if(!this.isAdmin()){
            this.roles.push('admin');
        }
    };
    User.prototype.makeNormal = function() {
        if(this.isAdmin()) {
            this.roles.splice(this.roles.indexOf('admin'),1);
        }
    };
    User.me = function() {
        if(me) {
            return me;
        }
        return (me = User.get({id: 'me'}));
    };
    return User;
}])
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