var os = require('os');
var queues = {};
var nido = function(arr) { return arr.join(':'); };

var Queue = function(name, redis, timeout) {
  this.key = nido(['ost', name]);
  this.backup = nido(['ost', name, os.hostname(), process.pid]);
  this.redis = redis;
  this.timeout = timeout;
};

Queue.prototype.enqueue = function(value, cb) {
  this.redis.lpush([this.key, value], cb);
};

Queue.prototype.dequeue = function(cb) {
  var redis = this.redis;
  var backup = this.backup;

  this.redis.brpoplpush([this.key, this.backup, this.timeout], function(err, reply) {
    if (err) {
      cb(err);
      return;
    }

    if (reply) {
      cb(null, reply, function() {
        redis.lpop([backup]);
      });
    } else {
      cb(new Error('Timeout'));
    }
  });
};

Queue.prototype.items = function(cb) {
  this.redis.lrange([this.key, 0, -1], cb);
};

Queue.prototype.size = function(cb) {
  this.redis.llen([this.key], cb);
};

exports.Queue = Queue;

exports.queue = function(name) {
  if (!queues.hasOwnProperty(name)) {
    queues[name] = new Queue(name, this.redis, this.timeout);
  }

  return queues[name];
};

exports.timeout = '2';
