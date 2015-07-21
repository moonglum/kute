var inherits = require('util').inherits;
var nido = function(arr) { return arr.join(':'); };

var TimeoutError = function(message) {
  this.name = 'TimeoutError';
  this.message = message;
};
inherits(TimeoutError, Error);

var Queue = function(name, redis, opts) {
  opts = opts || {};
  var prefix = opts.prefix || 'ost';
  this.key = nido([prefix, name]);
  this.progress = nido([prefix, name, 'progress']);
  this.redis = redis;
  this.timeout = opts.timeout || 0;
};

Queue.prototype.enqueue = function(value, cb) {
  this.redis.lpush([this.key, value], cb);
};

Queue.prototype.dequeue = function(cb) {
  var redis = this.redis;
  var progress = this.progress;

  this.redis.brpoplpush([this.key, this.progress, this.timeout], function(err, reply) {
    if (err) {
      cb(err);
      return;
    }

    if (reply) {
      cb(null, reply, function(consumerError) {
        if (!consumerError) {
          redis.lrem([progress, 1, reply], function() {});
        }
      });
    } else {
      cb(new TimeoutError('Timeout'));
    }
  });
};

Queue.prototype.items = function(cb) {
  this.redis.lrange([this.key, 0, -1], cb);
};

Queue.prototype.size = function(cb) {
  this.redis.llen([this.key], cb);
};

Queue.prototype.itemsInProgress = function(cb) {
  this.redis.lrange([this.progress, 0, -1], cb);
};

exports.Queue = Queue;
exports.TimeoutError = TimeoutError;
