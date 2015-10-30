angular.module('app.filters',[
])
.filter('fullName',[function(){
    return function(user) {
        if(user && (user.fname || user.sname)){
            if(user.fname && user.sname) {
                return user.fname + ' ' + user.sname;
            }
            return user.fname ? user.fname : user.sname;
        }
    };
}])
.filter('linkFormat',[function(){
    var TOKEN_RE = /\{([^\}]+)\}/g;
    return function(input,format){
        if(format && input) {
            var m,result = ''+format;
            do {
                m = TOKEN_RE.exec(format);
                if(m) {
                    result = result.replace('{'+m[1]+'}',input[m[1]]);
                }
            } while(m);
            return result;
        }
    };
}])
.filter('faFileTypeClass',[function(){
    var TEXT = /^text\//;
    return function(input) {
        if(typeof(input) === 'string') {
            if(input === 'application/pdf') {
                return 'fa-file-pdf-o';
            } else if (input.match(TEXT)) {
                return 'fa-file-text-o';
            }
            return 'fa-file-o';
        }
    };
}])
.filter('cssClassify',[function(){
    return function(input) {
        if(typeof(input) === 'string') {
            return input.trim().toLowerCase().replace(/\s+/g,'-');
        }
        return input;
    };
}])
.filter('yesNo',[function(){
    return function(input) {
        return input ? 'Yes' : 'No';
    };
}])
.filter('gte',[function(){
    return function(input,num) {
        if(!num || !angular.isArray(input)) {
            return input;
        }
        return input.filter(function(i){
            return i >= num;
        });
    };
}])
.filter('lte',[function(){
    return function(input,num) {
        if(!num || !angular.isArray(input)) {
            return input;
        }
        return input.filter(function(i){
            return i <= num;
        });
    };
}])
.filter('trim',[function(){
    return function(input) {
        if(angular.isString(input)) {
            return input.trim();
        }
        return input;
    };
}])
.filter('ellipses',[function(){
    return function(input) {
        var maxLen = arguments.length == 2 ? arguments[1] : 55;
        if(typeof(input) == 'string' && input.length > maxLen) {
            return input.substring(0,maxLen)+' ...';
        }
        return input;
    };
}]);