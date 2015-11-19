angular.module('app',[
    'ngAnimate',
    'ngRoute',
    'templates-app',
    'ui.bootstrap',
    'app.filters',
    'app.services',
    'app.uadmin',
    'app.menu'
])
.config(['$logProvider','$routeProvider','$httpProvider',function($logProvider,$routeProvider,$httpProvider) {
    $logProvider.debugEnabled(window.location.hash && window.location.hash.match(/^#.*#debug/));
    $routeProvider.when('/uadmin',{templateUrl:'js/routes/uadmin.html'});
    $routeProvider.when('/profile',{templateUrl:'js/routes/user-profile.html'});
    $routeProvider.otherwise({templateUrl:'js/routes/welcome.html'});
    if(typeof(csrfToken) !== 'undefined') {
        // the parent page must supply this global variable...
        $httpProvider.defaults.headers.common['X-CSRF-Token'] = csrfToken;
    }
}]);