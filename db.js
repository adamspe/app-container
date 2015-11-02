var pkg = require('./package.json'),
    debug = require('debug')('db'),
    mongoose = require('mongoose'),
    config = {
      uri: 'mongodb://'+(process.env.MONGO_HOST || 'localhost')+':'+(process.env.MONGO_PORT || 27017)+'/'+(process.env.MONGO_DB || pkg.name),
      options: {} // later
    };

module.exports = function(next){
    mongoose.connect(config.uri,config.options,function(err) {
        if(err) {
            console.error(err);
            process.exit(1);
        }
        debug('Connected to MongoDb "%s"',config.uri);
        next();
    })
};