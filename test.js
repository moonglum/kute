var test = require('tape');
var Queue = require('./').Queue;
var prefix = Date.now().toString() + '_';
var childProcess = require('child_process');

test('Push and Pop', function(t) {
  var producerClient = require('redis').createClient();
  var consumerClient = require('redis').createClient();

  var producer = new Queue(prefix + 'pnp', producerClient, 2);
  var consumer = new Queue(prefix + 'pnp', consumerClient, 2);

  consumer.dequeue(function(error, message, done) {
    done();
    t.equal(message, 'mymessage');
    t.end();
    consumerClient.quit();
  });

  producer.enqueue('mymessage', function() {
    producerClient.quit();
  });
});

test('Size', function(t) {
  var producerClient = require('redis').createClient();

  var producer = new Queue(prefix + 'size', producerClient, 2);

  producer.size(function(err, size) {
    t.equal(size, 0);
  });

  producer.enqueue('mymessage', function() {
    producer.size(function(err, size) {
      t.equal(size, 1);
    });
    t.end();
    producerClient.quit();
  });
});

test('Items', function(t) {
  var producerClient = require('redis').createClient();

  var producer = new Queue(prefix + 'items', producerClient, 2);

  producer.items(function(err, items) {
    t.deepEqual(items, []);
  });

  producer.enqueue('mymessage', function() {
    producer.items(function(err, items) {
      t.deepEqual(items, ['mymessage']);
    });
    t.end();
    producerClient.quit();
  });
});

test('Remove from `progress` when worker succeeded', function(t) {
  var producerClient = require('redis').createClient();
  var consumerClient = require('redis').createClient();

  var producer = new Queue(prefix + 'emptybu', producerClient, 2);
  var consumer = new Queue(prefix + 'emptybu', consumerClient, 2);

  consumer.dequeue(function(error, message, done) {
    done();

    consumerClient.lrange([consumer.progress, 0, -1], function(listError, progress) {
      console.log(listError);
      t.deepEqual(progress, []);
      t.end();
      consumerClient.quit();
    });
  });

  producer.enqueue('mymessage', function() {
    producerClient.quit();
  });
});

test('Keep in `progress` when worker failed', function(t) {
  var producerClient = require('redis').createClient();
  var consumerClient = require('redis').createClient();

  var producer = new Queue(prefix + 'bu', producerClient, 2);
  var consumer = new Queue(prefix + 'bu', consumerClient, 2);

  consumer.dequeue(function(error, message, done) {
    done(new Error('oh no'));

    consumerClient.lrange([consumer.progress, 0, -1], function(listError, progress) {
      t.deepEqual(progress, [ 'mymessage' ]);
      t.end();
      consumerClient.quit();
    });
  });

  producer.enqueue('mymessage', function() {
    producerClient.quit();
  });
});

test('Examples', function(t) {
  var consumer = childProcess.spawn('node', ['examples/consumer.js']);

  consumer.stdout.on('data', function(rawData) {
    t.equal(rawData.toString(), '"test message" received by worker 0\n');
    consumer.kill();
    t.end();
  });

  childProcess.spawn('node', ['examples/producer.js']);
});
