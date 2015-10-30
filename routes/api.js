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
    resources.push(users);

    // ADDITIONAL RESOURCES HERE

    // setup routers
    resources.forEach(function(r) {
        r.initRouter(app);
    });

};