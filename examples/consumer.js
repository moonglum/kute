var client = require('redis').createClient();
var EventEmitter = require('events').EventEmitter;
var capacity = 1;
var Queue = require('../').Queue;

var workerPool = new EventEmitter();
workerPool.setMaxListeners(1);
var queue = new Queue('a', client);

var publish = function(error, result) {
  if (error) {
    console.log('Error!' + error);
  } else {
    console.log(result);
  }
};

workerPool.on('free', function(worker) {
  queue.dequeue(function(error, message, done) {
    if (error) {
      publish(error);
      workerPool.emit('free', worker);
    } else {
      worker.work(message, function(error2, result) {
        publish(error, result);
        done();
        workerPool.emit('free', worker);
      });
    }
  });
});

var Worker = function(id) {
  this.id = id;
};

Worker.prototype.work = function(message, cb) {
  var worker = this;
  // This simulates a call to an external system for example
  setTimeout(function() {
    var result = '"' + message + '" received by worker ' + worker.id;
    cb(null, result);
  }, 100);
};

// Add one worker to the pool
var i;
for (i = 0; i < capacity; i++) {
  workerPool.emit('free', new Worker(i));
}
