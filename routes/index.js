var router = require('express').Router();

router.get('/', function(req, res) {
  res.render('index', {
    title: 'Starter App',
    user: req.user
  });
});

module.exports = router;
