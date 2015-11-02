var mongoose = require('mongoose'),
    should = require('should'),
    supertest = require('supertest');

var util = {
    api: undefined,
    User: require('../../models/User'),
    debug: require('debug')('app-test'),
    before: function(done) {
        require('../../app')().then(function(app){
            util.api = supertest.agent(app);
            done();
        },function(err){
            throw err;
        });
    },
    login: function(email,password,done){
        util.api.post('/login')
            .send('username='+email+'&password='+password)
            .expect(302)
            .end(function(err,res){
                // verify re-direct to root
                res.headers.location.should.equal('/');
                done();
            });
    },
    logout: function(done){
        util.api.get('/logout')
            .expect(302,done);
    }
};

module.exports = util;