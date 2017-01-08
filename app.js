var express = require('express'),
    session = require('express-session'),
    MongoStore = require('connect-mongo')(session),
    mongoose = require('mongoose'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    User = require('./User'),
    q = require('q'),
    _ = require('lodash'),
    debug = require('debug')('app');

/**
 * @param  {Object} dbInfo keys; host,port,db
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
        // uncomment after placing your favicon in /public
        //app.use(favicon(__dirname + '/favicon.ico'));
        app.use(require('morgan')('combined'));

        var bodyParser = require('body-parser');
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: false }));

        app.use(require('cookie-parser')());

        app.use(session({
            cookie: {
                maxAge: (sessionTtl*1000)
            },
            secret: 'application-secret',
            resave: false,
            saveUninitialized: true,
            store: new MongoStore({
                mongooseConnection: mongoose.connection,
                ttl:  (14 * 24 * 60 * 60) // 14 days
            })
        }));

        debug('setting up passport local authentication');
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

        // catch 404 and forward to error handler
        app.use(function(req, res, next) {
            var err = new Error('Not Found');
            err.status = 404;
            next(err);
        });

        if (app.get('env') === 'development') {
            // development error handler will print stacktrace
            app.use(function(err, req, res, next) {
                res.status(err.status || 500);
                res.render('error', {
                    message: err.message,
                    error: err
                });
            });
        } else {
            // production error handler no stacktraces leaked to user
            app.use(function(err, req, res, next) {
                res.status(err.status || 500);
                res.render('error', {
                    message: err.message,
                    error: {}
                });
            });
        }

        def.resolve(app);
    }
    require('./db')(setup,config.db);
    return def.promise;
};
