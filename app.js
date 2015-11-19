var express = require('express'),
    path = require('path'),
    favicon = require('serve-favicon'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    MongoStore = require('connect-mongo')(session),
    flash = require('connect-flash'),
    mongoose = require('mongoose'),
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
    function setup(err) {
        if(err) {
            return def.reject(err);
        }
        // view engine setup
        app.set('views', path.join(__dirname, 'views'));
        app.set('view engine', 'jade');

        // uncomment after placing your favicon in /public
        //app.use(favicon(__dirname + '/favicon.ico'));
        if(config.dev) {
            app.use(logger('dev'));
        }
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: false }));
        app.use(cookieParser());

        var sessionTtl = 14 * 24 * 60 * 60; // 14 days
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
        app.use(flash()); // necessary at least for authentication flash messages.

        app.use(express.static(path.join(__dirname, 'public')));

        require('./auth')(app);
        app.use('/', require('./routes/index'));
        require('./routes/api')(app);

        // catch 404 and forward to error handler
        app.use(function(req, res, next) {
            var err = new Error('Not Found');
            err.status = 404;
            next(err);
        });

        // error handlers

        // development error handler
        // will print stacktrace
        if (app.get('env') === 'development') {
            app.use(function(err, req, res, next) {
                res.status(err.status || 500);
                res.render('error', {
                    message: err.message,
                    error: err
                });
            });
        }

        // production error handler
        // no stacktraces leaked to user
        app.use(function(err, req, res, next) {
            res.status(err.status || 500);
            res.render('error', {
                message: err.message,
                error: {}
            });
        });

        def.resolve(app);
    }
    require('./db')(setup,config.db);
    return def.promise;
};