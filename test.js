var test = require('tape');
var Queue = require('./').Queue;
var TimeoutError = require('./').TimeoutError;
var prefix = Date.now().toString() + '_';
var childProcess = require('child_process');

test('Push and Pop', function(t) {
  var producerClient = require('redis').createClient();
  var consumerClient = require('redis').createClient();

  var producer = new Queue(prefix + 'pnp', producerClient, { timeout: 2 });
  var consumer = new Queue(prefix + 'pnp', consumerClient, { timeout: 2 });

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

  var producer = new Queue(prefix + 'size', producerClient, { timeout: 2 });

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

  var producer = new Queue(prefix + 'items', producerClient, { timeout: 2 });

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

  var producer = new Queue(prefix + 'emptybu', producerClient, { timeout: 2 });
  var consumer = new Queue(prefix + 'emptybu', consumerClient, { timeout: 2 });

  consumer.dequeue(function(error, message, done) {
    done();

    consumer.itemsInProgress(function(listError, progress) {
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

  var producer = new Queue(prefix + 'bu', producerClient, { timeout: 2 });
  var consumer = new Queue(prefix + 'bu', consumerClient, { timeout: 2 });

  consumer.dequeue(function(error, message, done) {
    done(new Error('oh no'));

    consumer.itemsInProgress(function(listError, progress) {
      t.deepEqual(progress, [ 'mymessage' ]);
      t.end();
      consumerClient.quit();
    });
  });

  producer.enqueue('mymessage', function() {
    producerClient.quit();
  });
});

test('Timeout', function(t) {
  var consumerClient = require('redis').createClient();
  var consumer = new Queue(prefix + 'timeout', consumerClient, { timeout: 1 });

  consumer.dequeue(function(error) {
    t.ok(error instanceof TimeoutError, 'Should be a TimeoutError');
    t.end();
    consumerClient.quit();
  });
});

test('Name of the key', function(t) {
  var client = require('redis').createClient();
  var q1 = new Queue('test', client);
  t.equal(q1.key, 'ost:test');

  var q2 = new Queue('test', client, { prefix: 'kute' });
  t.equal(q2.key, 'kute:test');

  t.end();
  client.quit();
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
