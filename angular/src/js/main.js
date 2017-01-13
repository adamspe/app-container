angular.module('app-container-common',[
    'templates-app-container-common',
    'app-container-common.services',
    'app-container-common.providers'
])
.config(['$logProvider',function($logProvider) {
    $logProvider.debugEnabled(window.location.hash && window.location.hash.match(/^#.*#debug/));
}]);
