var queues = {};
var nido = function(arr) { return arr.join(':'); };

var Queue = function(name, redis, timeout) {
  this.key = nido(['ost', name]);
  this.progress = nido(['ost', name, 'progress']);
  this.redis = redis;
  this.timeout = timeout;
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
