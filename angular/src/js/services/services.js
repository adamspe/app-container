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
