angular.module('app-container-common',[
    'app-container-common.providers',
    'templates-app-container-common',
    'app-container-common.filters',
    'app-container-common.services',
    'app-container-common.directives'
])
.config(['$logProvider',function($logProvider) {
    $logProvider.debugEnabled(window.location.hash && window.location.hash.match(/^#.*#debug/));
}]);
