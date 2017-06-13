angular.module('app-container-common.services',[
    'app-container-common.providers'
])
.factory('DialogService',['$q','$log','$mdDialog',function($q,$log,$mdDialog){
    var service = {
        confirm: function(contents) {
            $log.warn('DialogService deprecated: use $mdDialog directly.');
            var def = $q.defer(),
                confirm = $mdDialog.confirm()
                .title(contents.question)
                .textContent(contents.warning)
                .ariaLabel(contents.ariaLabel)
                .ok(contents.yesText||'Yes')
                .cancel(contents.noText||'No');
            $mdDialog.show(confirm).then(def.resolve,def.reject);
            return def.promise;
        }
    };
    return service;
}])
.factory('NotificationService',['$log','$timeout','$sce','$mdToast',function($log,$timeout,$sce,$mdToast){
    var service = {
        addError: function(error) {
            var errMessage = typeof(error) === 'string' ? error :
                error && error.statusText ? error.statusText : '';
            if(error && error.data && error.data.message) {
                errMessage += ' : '+error.data.message;
            }
            $mdToast.show($mdToast.simple().textContent(errMessage).position('bottom right').action('OK').highlightAction(true).highlightClass('md-warn').hideDelay(0));
        },
        addInfo: function (message) {
            $mdToast.show($mdToast.simple().textContent(message).position('bottom right'));
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
