var mongoose = require('mongoose'),
    bcrypt = require('bcryptjs'),
    salt = bcrypt.genSaltSync(10),
    schema = mongoose.Schema({
        fname: { type: String, trim: true},
        sname: { type: String, trim: true},
        secret: { type: String, required: true},
        email: { type: String, required: true, unique: true},
        level: { type: Number, required: true, min: 0, max: 1}
    }),
    ADMIN = 0,
    NORMAL = 1,
    CRYPT_PFX = 'CRYPT:';

function isEncrypted(secret) {
    return secret && secret.length > CRYPT_PFX.length &&
           secret.substring(0,CRYPT_PFX.length) === CRYPT_PFX;
}

schema.virtual('fullName').get(function () {
  return this.fname + ' ' + this.sname;
});

schema.methods.validatePassword = function(pass) {
console.log('secret',this.secret);
console.log('sans pfx',this.secret.substring(CRYPT_PFX.length));
    return this.secret &&
           isEncrypted(this.secret) &&
           bcrypt.compareSync(pass, this.secret.substring(CRYPT_PFX.length));
};

schema.methods.isAdmin = function() {
    return this.level === ADMIN;
};

schema.pre('save',function(next){
    console.log(this);
    // setting or changing secret, encrypt it.
    if(this.secret && !isEncrypted(this.secret)) {
        this.secret = CRYPT_PFX+bcrypt.hashSync(this.secret, salt);
    }
    next();
});

schema.set('collection', 'User');

var User = mongoose.model('User',schema);

module.exports = User;