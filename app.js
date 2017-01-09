var express = require('express'),
    session = require('express-session'),
    MongoStore = require('connect-mongo')(session),
    mongoose = require('mongoose'),
    passport = require('passport'),
    User = require('./User'),
    q = require('q'),
    _ = require('lodash'),
    debug = require('debug')('app-service');

/**
 * @param  {Object} c App configuration.
 * @return {Object} A promise that will resolve to the app or be rejected with an error.
 */
module.exports = function(c) {
    var config = _.extend({
            dev: false,
        },c),
        app = express(),
        def = q.defer();
    app.set('env',config.dev ? 'development': 'production');
    function setup(err) {
        if(err) {
            return def.reject(err);
        }

        app.use(require('morgan')('combined'));

        var bodyParser = require('body-parser');
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: false }));

        app.use(require('cookie-parser')());

        debug('session setup');
        var sessionTtl = (14 * 24 * 60 * 60); // 14 days
        app.use(session({
            cookie: {
                maxAge: (sessionTtl*1000)
            },
            secret: 'application-secret',
            resave: false,
            saveUninitialized: true,
            store: new MongoStore({
                mongooseConnection: mongoose.connection,
                ttl:  sessionTtl
            })
        }));

        debug('passport setup');
        app.use(passport.initialize());
        app.use(passport.session());

        passport.serializeUser(function(user, done) {
          done(null, user._id);
        });

        passport.deserializeUser(function(id, done) {
          debug('looking user by id %s',id);
          User.findById(id,function(err,user){
            done(err,user);
          });
        });

        debug('setup complete');
        def.resolve(app);
    }
    require('./db')(setup,config.db);
    return def.promise;
};
