var express = require('express'),
    session = require('express-session'),
    MongoStore = require('connect-mongo')(session),
    mongoose = require('mongoose'),
    passport = require('passport'),
    User = require('./User'),
    q = require('q'),
    _ = require('lodash'),
    debug = require('debug')('app-container');

/**
 * @param  {Object} c App configuration.
 * @return {Object} The app object.  If there is an error connecting to Mongo the process will exit.
 */
module.exports = function(c) {
    var config = _.extend({},c),
        app = express();

    require('./db')(config.db);

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

    passport.serializeUser(function(user, done) { done(null, user._id); });

    passport.deserializeUser(function(id, done) {
        debug('looking user by id %s',id);
        User.findById(id,function(err,user){
            done(err,user);
        });
    });

    debug('setup complete');

    return app;
};
