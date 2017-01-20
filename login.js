var db = require('./db'),
    debug = require('debug')('app-container'),
    User = require('./User'),
    mongoose = require('mongoose');

module.exports = function(username,password,next) {
    function login(done) {
        User.findOne({
            email: username
        },function(err,user){
            if(err) {
                return done(err);
            }
            debug('found user %s',user);
            if(!user) {
                return done(new Error('Unknown username or password.'));
            }
            user.validatePassword(password,function(err,res){
                if(!res) {
                    return done(new Error('Unknown username or password.'));
                }
                return done(null,user);
            });
        });
    }
    if(!mongoose.connection.readyState) {
        // not connected, get connected and disconnect when done
        db(function(err){
            if(err) {
                return next(err);
            }
            login(function(err,user) {
                mongoose.connection.close(function(cerr) {
                    next(err,user);
                });
            });
        })
    } else {
        login(next);
    }
};
