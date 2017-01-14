var debug = require('debug')('db'),
    conf = require('app-container-conf'),
    mongoose = require('mongoose'),
    _ = require('lodash');

mongoose.Promise = require('q').Promise;

module.exports = function(next /* optional */){
    if(mongoose.connection.readyState) {
        debug('Already connected to MongoDb');
        return;
    }
    var config = _.extend({
        host: 'localhost',
        port: 27107,
        db: 'app-db'
    },require('app-container-conf').get('database'));
    config.uri = 'mongodb://'+config.host+':'+config.port+'/'+config.db;
    debug('Attempting connection to "%s"',config.uri);
    mongoose.connect(config.uri,config.options).then(function(err) {
        debug('Connected to MongoDb');
        if(next) {
            next();
        }
    },function(err){
        if(next) {
            next(err);
        } else {
            console.error(err);
            process.exit(1);
        }
    });
};
