#express-app-template

This is a simple starter AngularJS app running on the MEAN stack (there are probably many of these out there).  It's intended to be a re-usable starting point for a basic web app that needs simple local user authentication.

It's generally probably better to go with something like [mean.io](http://mean.io/#!/) but this is as much, perhaps, something useful as it is a means of learning more about developing on MEAN.

##MongoD

###Unauthenticated

This kind of environment is probably only suitable for development.

```
% echo {} > db.json
% mongod --dbpath ~/MongoDB
```

###Authenticated

Enable authentication [per the instructions](https://docs.mongodb.org/manual/tutorial/enable-authentication/) with credentials `mongoDbAdmin/?`

E.g.

generate passwords for mongo as well as the app and its test db.

_Note:_ you probably want to avoid passwords containing backslashes since char sequences like `\t` will translate to `<tab>` which then can be difficult to enter from the command-line to authenticate to your database (in the case of tab `^V <tab>`).

```
use admin
db.createUser(
  {
    user: "mongoDbAdmin",
    pwd: "5VQ,JjY#5LA9q@tf",
    roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
  }
)
```

Create a user for the app and for the testing db (assuming you've renamed the package name replace `express-app-template` with the name of your app) E.g.

```
use express-app-template
db.createUser(
  {
    user: "appAdmin",
    pwd: "6KQW{Y4g,q%D2kS#",
    roles: [ { role:"readWrite", db: "express-app-template" } ]
  }
)
use express-app-template-test
db.createUser(
  {
    user: "appAdmin",
    pwd: "6KQW{Y4g,q%D2kS#",
    roles: [ { role:"readWrite", db: "express-app-template-test" } ]
  }
)
```

restart mongod with the `--auth` flag

place the credentials in `db.json`

```
{
    "user": "appAdmin",
    "pass": "6KQW{Y4g,q%D2kS#"
}
```

From this point on if using mongo shell you'll need to authenticate yourself.

E.g.

```
mongo -u mongoDbAdmin -p '5VQ,JjY#5LA9q@tf' --authenticationDatabase admin
```

##Grunt

```
% grunt [server]
```

When running the server target `./bin/dev` will be executed (the server started) and a `watch` started to compile the contents of `src/...` into `public/app/...`.

Running just `grunt` will build the `css` and `JavaScript` source of the application.

##Test (API)

```
% npm test
```

##./bin/dev

This node based shell script starts the seed application in development mode (HTTP only, default port 3000).  The shebang line is setup to run the server with nodemon (exclusions in nodemon.json).  The end result is that if developing via `grunt server` that both changes to the Node (Express) source and the Angular source will automatically be incorporated into the running system without the need for restarts, just browser refreshes.

##./bin/www

This is a straight node script (no shebang) for running the server in standard mode via HTTP and/or HTTPS.  The decision of noshebang is intentional since one may want to start the application using a utility like [forever](https://github.com/foreverjs/forever).

By default HTTP is on port 8080 and HTTPS on 8443 these values can be changed using the `PORT` and `SSL_PORT` environment variables respectively.

###HTTP Only

```
% cd bin; PORT=8080 node bin/www
```

###HTTPS Only

_Note:_ SSL requires there be an `<app>-cert.pem` and `<app>-key.pem` saved in bin directory (where `<app>` is the package name like `express-app-template`).  A google search will help here for how to generate.
```
% cd bin; SSL_PORT=8443 node bin/www --https
```

###HTTP and HTTPS

```
% cd bin; PORT=8080 SSL_PORT=8443 node www --http --https
```
