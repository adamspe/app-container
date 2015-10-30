var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    User = require('./models/User'),
    debug = require('debug')('auth'),
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
                if(!user.validatePassword(password)) {
                    return done(null, false, { message: 'Unknown username or password.' });
                }
                return done(null,user);
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
      req.logout();
      res.redirect('/');
    });

    app.all('*',function(req,res,next){
        if(req.user){
            debug('user',req.user);
            next();
        } else {
            res.redirect('/login');
        }
    });

};