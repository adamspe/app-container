var mongoose = require('mongoose'),
    bcrypt = require('bcryptjs'),
    serverSecret = 'W6?2ZheV>N]-.Wc~', // probably should be changed per app
    canned_roles = {
        admin: 'admin',
        user: 'user'
    },
    schema = mongoose.Schema({
        fname: { type: String, trim: true},
        sname: { type: String, trim: true},
        secret: { type: String, required: true},
        email: { type: String, required: true, unique: true},
        roles: { type: [String], default: [canned_roles.user], required: true }
    }),
    CRYPT_PFX = 'CRYPT:',
    debug = require('debug')('model');

function isEncrypted(secret) {
    return secret && secret.length > CRYPT_PFX.length &&
           secret.substring(0,CRYPT_PFX.length) === CRYPT_PFX;
}

schema.virtual('fullName').get(function () {
  return this.fname + ' ' + this.sname;
});

schema.methods.validatePassword = function(pass,next) {
    if(!this.secret || !isEncrypted(this.secret)) {
        return next(null,false);
    }
    bcrypt.compare(serverSecret+this._id.toString()+pass,this.secret.substring(CRYPT_PFX.length),next);
};

schema.methods.isUserInRole = function(role) {
    return this.roles.indexOf(role) !== -1;
};

schema.methods.isAdmin = function() {
    return this.isUserInRole(canned_roles.admin);
};

schema.pre('save',function(next){
    // setting or changing secret, encrypt it.
    if(this.secret && !isEncrypted(this.secret)) {
        var self = this;
        // generate a salt using from 1-11 rounds with the default PRNG
        bcrypt.genSalt(Math.round(Math.random()*10)+1,function(err,salt){
            if(err) {
                console.error(err);
                return next(err);
            }
            bcrypt.hash(serverSecret+self._id.toString()+self.secret, salt,function(err,hash){
                if(err) {
                    console.error(err);
                    return next(err);
                }
                self.secret = CRYPT_PFX+hash;
                next();
            });
        });
    } else {
        next();
    }
});

/*
schema.post('remove',function(user) {
    debug('user has been deleted.',user);
});*/

schema.set('collection', 'User');

var User = mongoose.model('User',schema);

module.exports = User;
