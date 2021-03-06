var express = require('express'),
    mongoose = require('mongoose'),
    q = require('q'),
    _ = require('lodash'),
    debug = require('debug')('app-container'),
    conf = require('app-container-conf');

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
 * @param  {Object} container The container
 * @return {Object} The init pipline.
 */
module.exports = function(container,initPipeline) {
    var app = container.app();

    initPipeline = initPipeline||{};

    function pipelineHook(key) {
        initPipeline[key] = initPipeline[key]||function(app){
            debug('init '+key+' (unused)');
        };
    }

    pipelineHook('pre');
    pipelineHook('pre_loggers');
    initPipeline.loggers = initPipeline.loggers||function(app) {
        debug('init loggers');
        app.use(require('morgan')('combined'));
    };
    pipelineHook('post_loggers');
    pipelineHook('pre_parsers');
    initPipeline.parsers = initPipeline.parsers||function(app) {
        debug('init parsers');
        var bodyParser = require('body-parser');
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: false }));
        app.use(require('cookie-parser')());
    };
    pipelineHook('post_parsers');
    pipelineHook('pre_session');
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
    pipelineHook('post_session');
    pipelineHook('pre_passport');
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
                debug('found %s',(user ? user.email : '?'))
                done(err,user);
            });
        });
        // CSRF
        if(!conf.get('disableCSRF')) {
            var uuid = require('node-uuid');
            debug('configuring CSRF checking.');
            app.all('*',function(req,res,next){
                if(req.user && req.session && !req.session.csrfToken) {
                    req.session.csrfToken = uuid.v4();
                    debug('generated new CSRF token "%s" for user widh id "%s"', req.session.csrfToken, req.user._id.toString());
                }
                next();
            });
            function checkCSRF(req,res,next) {
                if(req.path !== '/login' &&
                   (!req.session ||
                   !req.session.csrfToken ||
                   req.session.csrfToken !== req.headers['x-csrf-token'])) {
                   var err = new Error('Bad Request');
                   err.status = 400;
                   return next(err);
                }
                next();
            }
            app.put('*',checkCSRF);
            app.post('*',checkCSRF);
            app.delete('*',checkCSRF);
            app.get('/logout',function(req,res,next){
                if(req.session && req.session.csrfToken) {
                    delete req.session.csrfToken;
                    debug('dropped CSRF token for user with id "%s"', (req.user ? req.user._id.toString() : undefined));
                }
                next();
            });
        }
    };
    pipelineHook('post_passport');
    initPipeline.post = initPipeline.post||_.noop;

    ['pre',
     'pre_loggers','loggers','post_loggers',
     'pre_parsers','parsers','post_parsers',
     'pre_session','session','post_session',
     'pre_passport','passport','post_passport',
     'post'].forEach(function(step) {
                initPipeline[step](app);
            });
    debug('init complete');
};
