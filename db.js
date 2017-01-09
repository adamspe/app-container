var debug = require('debug')('db'),
    mongoose = require('mongoose'),
    _ = require('lodash');

mongoose.Promise = require('q').Promise;

module.exports = function(next,overrides){
    if(mongoose.connection.readyState) {
        debug('Already connected to MongoDb');
        return next();
    }
    var config = {
        host: (process.env.MONGO_HOST || 'localhost'),
        port: (process.env.MONGO_PORT || 27017),
        db: (process.env.MONGO_DB || 'app-db'),
    };
    if(overrides) {
        _.extend(config,overrides);
    }
    config.uri = 'mongodb://'+config.host+':'+config.port+'/'+config.db;
    debug('Attempting connection to "%s"',config.uri);
    mongoose.connect(config.uri,config.options).then(function(err) {
        debug('Connected to MongoDb');
        next();
    },function(err){
        next(err);
    })
};
