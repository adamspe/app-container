var appDef,
    service = {
        User: require('./User'),
        get: function(config){
            if(!appDef) {
                appDef = require('./app')(config||{});
            }
            return appDef;
        },
        start: function(){
            appDef.then(
                function(app){
                    var http = require('http').createServer(app).listen((process.env.PORT || 8080),'0.0.0.0',function(){
                        console.log('Listening for HTTP requests on %s',http.address().port);
                    });
                },
                function(err) {
                    console.error(err);
                    process.exit(1);
                });
        }
    };

module.exports = service;
