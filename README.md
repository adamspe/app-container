#MongoD

```
% mongod --dbpath ~/MongoDB
```

#Grunt

```
% grunt [server]
```

When running the server target `./bin/www` will be executed (the server started) and a `watch` started to compile the contents of `src/...` into `public/app/...`.

Running just `grunt` will build the `css` and `JavaScript` source of the application.

#./bin/www

This node based shell script started from the normal express seed application.  The shebang line has been edited manually (and committed to source control) for now to execute using nodemon with specific `--ignore` arguments to ignore app source and generated results.  The end result is that if developing via `grunt server` that both changes to the Node (Express) source and the Angular source will automatically be incorporated into the running system without the need for restarts, just browser refreshes.