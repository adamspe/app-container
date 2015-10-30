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
    User.prototype.isAdmin = function() {
        return this.level === 0;
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
}]);