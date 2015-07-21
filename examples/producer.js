var client = require('redis').createClient();
var Queue = require('../').Queue;
var queue = new Queue('a', client);

queue.enqueue('test message', function() {
  process.exit();
});
