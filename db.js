var pkg = require('./package.json'),
    debug = require('debug')('db'),
    mongoose = require('mongoose'),
    _ = require('lodash');

module.exports = function(next,overrides){
    if(mongoose.connection.readyState) {
        debug('Already connected to MongoDb');
        return next();
    }
    var config = {
        host: (process.env.MONGO_HOST || 'localhost'),
        port: (process.env.MONGO_PORT || 27017),
        db: (process.env.MONGO_DB || pkg.name),
        options: require('./db.json')
    };
    if(overrides) {
        _.extend(config,overrides);
    }
    config.uri = 'mongodb://'+config.host+':'+config.port+'/'+config.db;
    mongoose.connect(config.uri,config.options,function(err) {
        if(err) {
            console.error(err);
            process.exit(1);
        }
        debug('Connected to MongoDb "%s"',config.uri);
        next();
    })
};