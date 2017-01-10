var express = require('express'),
    mongoose = require('mongoose'),
    q = require('q'),
    _ = require('lodash'),
    debug = require('debug')('app-container');

/**
 * Initial app initialization is broken down into a pipline that can be overridden
 * via `c.initPipeline` which is an object with the following optional keys
 * `pre`, `loggers`, `parsers`, `session`, `passport` and `post`
 * Each may point to a function accepting a single argument, the app.
 * They are executed in the order defined above.
 *
 * So for example if you wanted to disable sessions and passport authentication
 * you could pass in a config object like `{initPipeline:{session:_.noop,passport:_.noop}}`
 * or you could over-ride the behavior of any  of the base initialization steps.
 *
 * The `pre` and `post` pipeline steps are intentionally left empty for custom app
 * initialization (e.g. setup static resource service via `pre`).
 * 
 * @param  {Object} c App configuration.
 * @return {Object} The app object.  If there is an error connecting to Mongo the process will exit.
 */
module.exports = function(c) {
    var config = _.extend({},c),
        app = express(),
        initPipeline = (config.initPipeline||{});

    initPipeline.pre = initPipeline.pre||_.noop;
    initPipeline.loggers = initPipeline.loggers||function(app) {
        debug('init loggers');
        app.use(require('morgan')('combined'));
    };
    initPipeline.parsers = initPipeline.parsers||function(app) {
        debug('init parsers');
        var bodyParser = require('body-parser');
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: false }));
        app.use(require('cookie-parser')());
    };
    initPipeline.session = initPipeline.session||function(app) {
        debug('init session');
        var session = require('express-session'),
            MongoStore = require('connect-mongo')(session),
            sessionTtl = (14 * 24 * 60 * 60); // 14 days
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
    };
    initPipeline.passport = initPipeline.passport||function(app) {
        debug('init passport');
        var passport = require('passport'),
            User = require('./User');
        app.use(passport.initialize());
        app.use(passport.session());
        passport.serializeUser(function(user, done) { done(null, user._id); });
        passport.deserializeUser(function(id, done) {
            debug('looking user by id %s',id);
            User.findById(id,function(err,user){
                done(err,user);
            });
        });
    };
    initPipeline.post = initPipeline.post||_.noop;

    require('./db')(config.db);
    ['pre','loggers','parsers','session','passport','post'].forEach(function(step) {
        initPipeline[step](app);
    });
    debug('init complete');

    return app;
};
