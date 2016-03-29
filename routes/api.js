var prefix = '/api/',
    Resource = require('odata-resource'),
    mongoose = require('mongoose'),
    _ = require('lodash'),
    debug = require('debug')('api');

module.exports = function(app) {
    var resources = [];
    // users
    var users = new Resource({
            rel: prefix+'user',
            model: require('../models/User'),
            $select: '-secret',
        });
    users.staticLink('me',function(req,res) {
        users.singleResponse(req,res,req.user,function(u){
            u.secret = undefined;
            return u;
        });
    });
    users.find = (function(self){
        var superFind = self.find;
        return function(req,res) {
            if(!req.user.isAdmin()) {
                // not an admin, only let them see themselves, but do
                // so as a normal list response so that the response can
                // also carry meta information.
                return users.listResponse(req,res,[req.user],function(u){
                    u.secret = undefined;
                    return u;
                });
            }
            return superFind.apply(self,arguments);
        };
    })(users);

    // only administrators can create and delete users.
    function adminOnly(self,superFunc) {
        return function(req,res) {
            if(!req.user.isAdmin()) {
                return Resource.sendError(res,403,'Forbidden');
            }
            superFunc.apply(self,arguments);
        };
    }
    users.create = adminOnly(users,users.create);
    users.delete = adminOnly(users,users.delete);

    users.update = (function(self,superFunc) {
        return function(req,res) {
            if(!req.user.isAdmin() && !_.isEqual(req.user.roles,req.body.roles)) {
                console.error('User %s attempted to update roles to \'%s\'',req.user.email,req.body.roles);
                return Resource.sendError(res,403,'Forbidden');
            }
            if(!req.user.isAdmin() && req.user._id.toString() != req._resourceId) {
                console.error('User %s attempted to update another user with id \'%s\'',req.user.email,req._resourceId);
                return Resource.sendError(res,403,'Forbidden');
            }
            superFunc.apply(self,arguments);
        }
    })(users,users.update)
    resources.push(users);

    if(!process.env.TestEnv) {
        // require all api calls to supply the token (generated on a per login basis in /auth.js)
        app.all('/api/*',function(req,res,next){
            debug('CSRF server:\'%s\' client:\'%s\'', req.session.csrfToken, req.headers['x-csrf-token']);
            if(req.session.csrfToken !== req.headers['x-csrf-token']) {
                return Resource.sendError(res,403,'Forbidden');
            }
            next();
        });
    }

    // ADDITIONAL RESOURCES HERE

    // setup routers
    resources.forEach(function(r) {
        r.initRouter(app);
    });

};