var client = require('redis').createClient();
var Kute = require('../');

Kute.redis = client;

Kute.queue('a').enqueue('test message', function() {
  process.exit();
});
