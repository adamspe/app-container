var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    User = require('./models/User'),
    debug = require('debug')('auth'),
    uuid = require('node-uuid'),
    loginRouter = require('express').Router();

module.exports = function(app) {
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

    passport.use(new LocalStrategy(
        function(username,password,done) {
            debug('login(%s,%s)',username,(!!password ? '****' : ''));
            User.findOne({
                email: username
            },function(err,user){
                if(err) {
                    return done(err);
                }
                debug('found user %s',user);
                if(!user) {
                    return done(null,false,{ message: 'Unknown username or password.'});
                }
                user.validatePassword(password,function(err,res){
                    if(!res) {
                        return done(null, false, { message: 'Unknown username or password.' });
                    }
                    return done(null,user);
                });
            });
        }
    ));

    loginRouter.get('/', function(req, res) {
      var messages = req.flash();
      debug('flash',messages);
      res.render('login', { title: 'Login', messages: messages });
    });
    app.use('/login',loginRouter);

    app.post('/login',
        passport.authenticate('local', {
            successRedirect: '/',
            failureRedirect: '/login',
            failureFlash: true
       })
    );

    app.get('/logout', function(req, res){
      if(req.session) {
        delete req.session.csrfToken;
        debug('dropped CSRF token for user with id \'%s\'', (req.user ? req.user._id.toString() : undefined));
      }
      req.logout();
      res.redirect('/');
    });

    app.all('*',function(req,res,next){
        if(req.user){
            if(req.user && !req.session.csrfToken) {
              req.session.csrfToken = uuid.v4();
              debug('generated new CSRF token \'%s\' for user widh id \'%s\'', req.session.csrfToken, req.user._id.toString());
            }
            next();
        } else {
            res.redirect('/login');
        }
    });

};