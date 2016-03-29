var should = require('should'),
    util = require('./util/util'),
    _ = require('lodash');

describe('User Permissions',function(){
    var admin,joe;

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
                admin = created[0];
                joe = created[1];
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
        var me;
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
                    me = res.body.list[0];
                    done();
                 });
        });
        // cannot create
        it('create',function(done){
            util.api.post('/api/user')
                .send({
                    email: 'bob@test.com',
                    secret: 'password',
                    fname: 'Bob',
                    sname: 'User',
                    roles: ['user','admin']
                })
                .expect(403,done);
        });
        // cannot delete
        it('delete',function(done){
            util.api.delete(me._links.self)
                .expect(403,done);
        });
        // can update self
        it('acceptable update',function(done){
            util.api.put(me._links.self)
                .send(_.extend({},me,{fname: 'Moonbeam'}))
                .expect(200)
                .end(function(err,res){
                    util.debug(res.body);
                    res.body.should.have.property('fname').and.equal('Moonbeam');
                    res.body.should.have.property('sname').and.equal('User');
                    done();
                });
        });
        // cannot change own roles
        it('unacceptable update',function(done){
            util.api.put(me._links.self)
                .send(_.extend({},me,{roles: ['user','admin']}))
                .expect(403,done);
        });
        // cannot update another user
        it('update another',function(done){
            util.api.put('/api/user/'+admin._id)
                .send({secret: 'newpassword',roles:joe.roles})
                .expect(403,done);
        });
    });

    describe('Admin',function(){
        var me,joe,bob;
        before(function(done){
            util.login('admin@test.com','password',done);
        });
        after(function(done){
            util.logout(done);
        });
        it('list one',function(done){
            util.api.get('/api/user?$filter=endswith(email,\'@test.com\')')
                 .end(function(err,res){
                    if(err) {
                        throw err;
                    }
                    util.debug(res.body);
                    res.body.should.have.property('list').and.be.instanceof(Array).with.lengthOf(2);
                    me = res.body.list.filter(function(u) { return u.email === 'admin@test.com'; })[0];
                    joe = res.body.list.filter(function(u) { return u.email === 'joe@test.com'; })[0];
                    done();
                 });
        });
        it('create',function(done){
            util.api.post('/api/user')
                .send({
                    email: 'bob@test.com',
                    secret: 'password',
                    fname: 'Bob',
                    sname: 'User',
                    roles: ['user']
                })
                .expect(200,done);
        });
        it('update',function(done){
            util.api.put(joe._links.self)
                .send(_.extend({},joe,{roles: ['user','admin']}))
                .expect(200,done);
        });
        it('list two',function(done){
            util.api.get('/api/user?$filter=endswith(email,\'@test.com\')')
                 .end(function(err,res){
                    if(err) {
                        throw err;
                    }
                    util.debug(res.body);
                    res.body.should.have.property('list').and.be.instanceof(Array).with.lengthOf(3);
                    joe = res.body.list.filter(function(u) { return u.email === 'joe@test.com'; })[0];
                    bob = res.body.list.filter(function(u) { return u.email === 'bob@test.com'; })[0];
                    done();
                 });
        });
        it('delete',function(done){
            util.api.delete(bob._links.self)
                .expect(200,done);
        });
        it('list three',function(done){
            util.api.get('/api/user?$filter=endswith(email,\'@test.com\')')
                 .end(function(err,res){
                    if(err) {
                        throw err;
                    }
                    util.debug(res.body);
                    res.body.should.have.property('list').and.be.instanceof(Array).with.lengthOf(2);
                    done();
                 });
        });
    });
});