var appPromise;

/**
 * Connects to the database and initializes a single minimally configured express application.
 * @param config App/db config (TBD).
 * @return {Promise} A promise that will be resolved with the app once a db connection is made and the app configured.
 */
module.exports.get = function(config){
    if(!appPromise) {
        appPromise = require('./app')(config||{});
    }
    return appPromise;
};

/**
 * Starts the application listening on HTTP.
 */
module.exports.start = function(){
    appPromise.then(
        function(app){
            var http = require('http').createServer(app).listen((process.env.PORT || 8080),'0.0.0.0',function(){
                console.log('Listening for HTTP requests on %s',http.address().port);
            });
        },
        module.exports.logAndExit);
};

/**
 * Re-usable system level error handler (log and exit).
 */
module.exports.logAndExit = function(err) {
    console.error(err);
    process.exit(1);
};

/**
 * The user resource is being held at the service level so that other api services may link up with it.
 * (E.g. modified by, created by, etc.)  But individual services may or may not need it directly.
 *
 * @parameter {int} version The current api version.
 * @return {Resource} The user resource (not configured into the app).
 */
module.exports.userResource = function(version) {
    return require('./user-api');
};

/**
 * Adds a REST resource to the application.  This utility method
 * will impose common error handling on the resource router.
 */
module.exports.addResource = function(app,resource) {
    var Resource = require('odata-resource'),
        router = resource.initRouter();
    router.use(function(err,req,res,next){
        console.error(err);
        Resource.sendError(res,err.status||500,err.message);
    });
    app.use(resource.getRel(),router);
};
