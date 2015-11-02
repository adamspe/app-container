var should = require('should'),
    util = require('./util/util');

describe('User Permissions',function(){

    before(function(done){
        util.before(function(){
            util.User.create([{
                email: 'admin@test.com',
                secret: 'password',
                fname: 'Admin',
                sname: 'User',
                roles: ['user','admin']
            },{
                email: 'joe@test.com',
                secret: 'password',
                fname: 'Joe',
                sname: 'User',
                roles: ['user']
            }],function(err,created){
                if(err) {
                    throw err;
                }
                util.debug('created users',created);
                done();
            });
        });
    });

    after(function(done){
        util.User.find({email: /@test.com$/}).remove(function(err){
            if(err) {
                throw err;
            }
            done();
        });
    });

    describe('Non-admin',function(){
        before(function(done){
            util.login('joe@test.com','password',done);
        });
        after(function(done){
            util.logout(done);
        });
        it('list',function(done){
            util.api.get('/api/user')
                 .end(function(err,res){
                    if(err) {
                        throw err;
                    }
                    util.debug(res.body);
                    res.body.should.have.property('list').and.be.instanceof(Array).with.lengthOf(1);
                    util.logout(done);
                 });
        });
    });

    describe('Admin',function(){
        before(function(done){
            util.login('admin@test.com','password',done);
        });
        after(function(done){
            util.logout(done);
        });
        it('list',function(done){
            util.api.get('/api/user?$filter=endswith(email,\'@test.com\')')
                 .end(function(err,res){
                    if(err) {
                        throw err;
                    }
                    util.debug(res.body);
                    res.body.should.have.property('list').and.be.instanceof(Array).with.lengthOf(2);;
                    util.logout(done);
                 });
        });
    });
});