angular.module('app.uadmin',[
])
.controller('EditUserController',['$scope','$uibModalInstance','User','theUser','existingEmails','title',function($scope,$uibModalInstance,User,theUser,existingEmails,title){
    $scope.me = User.me();
    $scope.title = title;
    $scope.isModal = true;
    $scope.user = theUser;
    $scope.existingEmails = existingEmails;
    $scope.dismiss = $uibModalInstance.dismiss;
    $scope.resetPassword = theUser._id ? false : true;
    $scope.ok = function() {
        $uibModalInstance.close($scope.user);
    };
}])
.directive('userProfile',['$log','User','NotificationService',function($log,User,NotificationService){
    return {
        restrict: 'E',
        templateUrl: 'js/uadmin/edit-user.html',
        link: function($scope,$element,$attrs) {
            User.me().$promise.then(function(me) {
                $scope.me = me;
                $scope.user = angular.extend({},me);
                $scope.title = 'Profile';
                $scope.ok = function() {
                    angular.extend(me,$scope.user);
                    me.$update({id: me._id},function(){
                        NotificationService.addInfo('Profile updated');
                    },NotificationService.addError);
                };
            });
        }
    };
}])
.directive('existingEmails',['$q','$parse',function($q,$parse){
    return {
        require: 'ngModel',
        link: function($scope,$element,$attrs,$ctrl) {
            var existing = $parse($attrs.existingEmails)($scope);
            if(existing) {
                $ctrl.$asyncValidators['existingEmails'] = function(modelValue,newValue) {
                    var def = $q.defer();
                    if(existing.indexOf(modelValue) === -1) {
                        def.resolve(true);
                    } else {
                        def.reject();
                    }
                    return def.promise;
                };
            }
        }
    };
}])
.directive('passwordValidate',['$q','$parse',function($q,$parse){
    return {
        require: 'ngModel',
        link: function($scope,$element,$attrs,$ctrl) {
            var user = $parse($attrs.passwordValidate)($scope);
            if(user && $attrs.passwordValidateKey) {
                $ctrl.$asyncValidators[$attrs.passwordValidateKey] = function(modelValue,newValue) {
                    var def = $q.defer();
                    if(newValue && newValue.match(/(?=.{8,})(?=.*?[^\w\s])(?=.*?[0-9])(?=.*?[A-Z]).*?[a-z].*/)) {
                        def.resolve(true);
                    } else {
                        def.reject();
                    }
                    return def.promise;
                };
            }
        }
    };
}])
.directive('passwordConfirm',[function(){
    return {
        restrict: 'E',
        templateUrl: 'js/uadmin/password-confirm.html',
        scope: {
            user: '='
        }
    };
}])
.directive('userAdministration',['$log','$uibModal','User','DialogService','NotificationService',function($log,$uibModal,User,DialogService,NotificationService){
    return {
        restrict: 'E',
        templateUrl: 'js/uadmin/user-administration.html',
        link: function($scope,$element,$attrs) {
            function list() {
                User.query(function(users){
                    $scope.users = users.list.filter(function(u){
                        return u._id !== $scope.me._id;
                    });
                });
                $scope.create = function() {
                    $uibModal.open({
                        templateUrl: 'js/uadmin/edit-user.html',
                        controller: 'EditUserController',
                        windowClass: 'edit-user',
                        size: 'lg',
                        backdrop: 'static',
                        keyboard: false,
                        resolve: {
                            theUser: function() { return new User({level: 1}); },
                            title: function() { return 'Create User'; },
                            existingEmails: function() { return $scope.users.map(function(u) { return u.email; }).concat([$scope.me.email]); }
                        }
                    }).result.then(function(user){
                        user.$save(function(){
                            NotificationService.addInfo('User created.');
                            list();
                        },NotificationService.addError);
                    });
                };
                $scope.edit = function(user) {
                    $uibModal.open({
                        templateUrl: 'js/uadmin/edit-user.html',
                        controller: 'EditUserController',
                        windowClass: 'edit-user',
                        size: 'lg',
                        backdrop: 'static',
                        keyboard: false,
                        resolve: {
                            theUser: function() { return angular.extend({},user); },
                            title: function() { return 'Edit User'; },
                            existingEmails: function() {
                                return $scope.users.filter(function(u){
                                    return u._id !== user._id;
                                }).map(function(u) { return u.email; }).concat([$scope.me.email]);
                            }
                        }
                    }).result.then(function(updates){
                        angular.extend(user,updates);
                        user.$update({id: user._id},function(){
                            NotificationService.addInfo('User updated.');
                        },NotificationService.addError);
                    });
                };
                $scope.delete = function(user) {
                    DialogService.confirm({
                        question: 'Are you sure you want to delete '+user.email+'?',
                        warning: 'This cannot be undone.'
                    }).then(function(){
                        user.$remove({id:user._id},function(){
                            NotificationService.addInfo('User deleted.');
                            list();
                        },NotificationService.addError);
                    });
                };
            }
            User.me().$promise.then(function(me) {
                if(me.isAdmin()) {
                    $scope.me = me;
                    list();
                }
            });
        }
    };
}]);