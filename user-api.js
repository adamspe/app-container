var prefix = '/api/v1/',
    Resource = require('odata-resource'),
    mongoose = require('mongoose'),
    _ = require('lodash'),
    debug = require('debug')('api');

console.log('user-api #1');
var users = new Resource({
        rel: prefix+'user',
        model: require('./User'),
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
        if(!req.user) {
            return Resource.sendError(res,403,'Forbidden');
        } else if(!req.user.isAdmin()) {
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
        if(!req.user || !req.user.isAdmin()) {
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
})(users,users.update);
console.log('user-api #end');
module.exports = users;
