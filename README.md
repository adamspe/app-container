# app-container

## app-container module convention

### index.js

```
var AppContainer = require('app-container'),
    appModule = {
        // initialize an existing container with this module's
        // resources, etc.
        init: function(container) {
            // E.g.
            // container.addResource(require('./resource'));
        },
        container: function(config) {
            return appModule.init(new AppContainer(config));
        }
    };

module.exports = appModule;
```

### start.js (convention only)

```
require('./index').container().start();
```

### package.json (fragment)

```
"main": "index.js",
"scripts": {
  "start": "node start.js",
  "test": "make test"
},
```

In this way a module can be run as a standalone service via `npm start` and yet
the module can be wired into an existing container (e.g. a monolithic app-container)
via by calling `init` on the module with the desired container to wire the services
into, or the module can be loaded to create local tests without starting a container.
