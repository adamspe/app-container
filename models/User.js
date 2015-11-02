var mongoose = require('mongoose'),
    bcrypt = require('bcryptjs'),
    salt = bcrypt.genSaltSync(10),
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
    CRYPT_PFX = 'CRYPT:';

function isEncrypted(secret) {
    return secret && secret.length > CRYPT_PFX.length &&
           secret.substring(0,CRYPT_PFX.length) === CRYPT_PFX;
}

schema.virtual('fullName').get(function () {
  return this.fname + ' ' + this.sname;
});

schema.methods.validatePassword = function(pass) {
    return this.secret &&
           isEncrypted(this.secret) &&
           bcrypt.compareSync(pass, this.secret.substring(CRYPT_PFX.length));
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
        this.secret = CRYPT_PFX+bcrypt.hashSync(this.secret, salt);
    }
    next();
});

schema.set('collection', 'User');

var User = mongoose.model('User',schema);

module.exports = User;