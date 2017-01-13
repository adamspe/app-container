/**
 * Creates a new AppContainer and connects to the database and initializes a single minimally configured express application.
 * @param config App/db config (TBD).
 * @return {Promise} A promise that will be resolved with the app once a db connection is made and the app configured.
 */
var debug = require('debug')('app-container'),
    express = require('express'),
    AppContainer = function() {
        this.$app = express();
    };

/**
 * Allows for independent access to making db connections.
 */
AppContainer.db = require('./db');

/**
 * The mongoose model for User.
 */
AppContainer.User = require('./User');

/**
 * initialize the app
 */
AppContainer.prototype.init = function(config) {
    config = config||{};
    AppContainer.db(config.db);
    require('./app-init')(this,config);
    return this;
};

/**
 * @return {Object} The express app.
 */
AppContainer.prototype.app = function() {
    return this.$app;
};

/**
 * Starts the application listening on HTTP.
 */
AppContainer.prototype.start = function() {
    var self = this;
    if(!self.$http) {
        self.$http = require('http').createServer(self.app()).listen((process.env.PORT || 8080),'0.0.0.0',function(){
            console.log('Listening for HTTP requests on %s',self.$http.address().port);
        });
    } else {
        debug('Already listening for HTTP requests on %s',self.$http.address().port);
    }
    return self;
};


/**
 * Re-usable system level error handler (log and exit).
 */
AppContainer.logAndExit = function(err) {
    console.error(err);
    process.exit(1);
};



/**
 * The user resource is being held at the service level so that other api services may link up with it.
 * (E.g. modified by, created by, etc.)  But individual services may or may not need it directly.
 *
 * @parameter {Object} version The current api version.
 * @return {Resource} The user resource (not configured into the app).
 */
AppContainer.userResource = require('./user-api');

/**
 * Adds a REST resource to the application.  This utility method
 * will impose common error handling on the resource router.
 */
AppContainer.prototype.addResource = function(resource) {
    var app = this.app();
    if(app) {
        var Resource = require('odata-resource'),
            router = resource.initRouter();
        router.use(function(err,req,res,next){
            console.error(err);
            Resource.sendError(res,err.status||500,err.message);
        });
        app.use(resource.getRel(),router);
    }
    return this;
};

module.exports = AppContainer;
