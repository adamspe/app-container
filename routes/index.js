var pkg = require('../package.json'),
    router = require('express').Router();

router.get('/', function(req, res) {
  res.render('index', {
    title: pkg.name,
    user: req.user,
    session: req.session
  });
});

module.exports = router;
