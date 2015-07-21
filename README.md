# Kute [![build status](https://travis-ci.org/moonglum/kute.svg)](https://travis-ci.org/moonglum/kute)

A minimalistic queue library for Node.js based on Redis inspired by [OST](https://github.com/soveran/ost). Why? Because I needed something small and cute that only offers `enqueue` and `dequeue` – you know, like a [queue](https://en.wikipedia.org/wiki/Queue_(abstract_data_type)) does. It is compatible with [OST](https://github.com/soveran/ost) as it is basically a port of OST to JS (with certain adjustments to the non-blocking environment).

## Installation

Install it in your project via:

```
npm install kute --save
```

## Usage

Enqueue an entry:

```js
var producerClient = require('redis').createClient();
var producer = new Queue('queuename', producerClient);
producer.enqueue('mymessage', function(error) {
});
```

Dequeue an entry:

```js
var consumerClient = require('redis').createClient();
var consumer = new Queue('queuename', consumerClient);
consumer.dequeue(function(error, entry, done) {
  console.log('I just got the entry "', entry, '" from the queue');
  done();
});
```

Dequeue an entry and hit an error:

```js
var consumerClient = require('redis').createClient();
var consumer = new Queue('queuename', consumerClient);
consumer.dequeue(function(error, entry, done) {
  console.log('I had an error while processing');
  done(new Error('darn it'));
});
```

Get the number of items on the queue:

```js
queue.size(function(err, size) {
  console.log('There are', size, 'items on the queue');
});
```

Get all items that are on the queue:

```js
queue.items(function(err, items) {
  console.log('There are the following items on the queue:', items);
});
```

Get all items that are in progress:

```js
queue.itemsInProgress(function(err, progress) {
  console.log('There are the following items on the queue:', progress);
});
```

By the way: You can also consume entries created by OST or create entries to be consumed by OST (This is the reason it uses an `ost` prefix in Redis instead of a `kute` prefix).

### Options

You can provide optional parameters in the form of an Object as a third argument to the Queue constructor:

* `timeout`: If you want the `dequeue` operation to time out after not receiving a job for a certain time (because no one enqueued any values), you can set this option to a value in seconds. Per default, there is no timeout. If you run into a Timeout, you will receive a `TimeoutError` as the first argument to your `dequeue` handler.
* `prefix`: The default `prefix` of the created Redis entries is `ost`, but you can change it with this option.

## Differences to OST (and other queues)

OST offers an `each` method that yields to a block for every new entry on the queue ([kue](https://github.com/Automattic/kue) does something similar with `process`). Kute is just a queue – you can enqueue and dequeue. If you want to dequeue multiple times, then do that. This is a big advantage in a non-blocking environment as you can use it in combination with a worker pool that always dequeues an entry when a worker in the pool is free. You can see an example of that in the `consumer.js` file in the examples folder.

About enqueue/dequeue: In the parlance of Redis, enqueue is `lpush` and dequeue is `rpop`. But I prefer to use the terminology used for the abstract data type [queue](https://en.wikipedia.org/wiki/Queue_(abstract_data_type)).

Kute keeps entries that are being processed with one central `progress` list (opposed to Kute, which uses [one per worker](https://github.com/soveran/ost#failures) as suggested in the [reliable queue pattern](http://redis.io/commands/rpoplpush#pattern-reliable-queue). If a consumer reports an error in the `done` callback, the entry will not be removed from the progress list. You can monitor the progress list to keep track of entries that stay in there too long (because the worker crashed or ran into an error).

## Anti-Features

You might say: "Hu? A queue based on Redis? But... But... Redis is not a queue!" I don't agree. Redis has support for the queue operations, and this is a mere wrapper around them. Redis is however not a priority queue or job queue, and this is reflected in the following statements about Kute:

* **Only a message, no data:** Your worker knows how to get the data. It could access the database for that or you could use something like [storage-pod](https://github.com/moonglum/storage-pod).
* **No events for finished or failed events:** You can use Redis PubSub if you need it. If you need that feature it could also mean that you should use a [MOM](https://en.wikipedia.org/wiki/Message_oriented_middleware).
* **No monitoring:** And you might not need it. We for example use a central logging and monitoring solution to see the throughput of our queue etc.
* **No retries:** But you could implement that by monitoring the `progress` list.
* **No priorities**
* **No delayed jobs or scheduling.**
* **No web interface.**
* **No job TTL.**
* **No searching through jobs.**

Yes, that might mean that Kute is not the right queue for you. There are a lot of excellent [queues out there](http://queues.io). Choose the one that has the right feature set for your use case.

## Contributing

First install all development dependencies with `npm install`. Then run `npm run ci` to see if the code:

* Passes the test suite (aka. `npm test`)
* Passes the linter (aka. `npm run jshint`)
* Passes the code style checker (aka. `npm run jscs`)

This will also automatically happen before every commit and be checked by Travis CI. Tests are written using [tape](https://github.com/substack/tape).

## #lesscode

This library is inspired by the [\#lesscode](http://lesscode.is) movement: It has a very specific purpose, only one runtime dependency (a Redis client, which you need to provide to it and is therefore not a runtime dependency of the package) and just a few lines of code.

Thanks to [soveran](https://github.com/soveran) for the inspiration (especially [OST](https://github.com/soveran/ost)).

## License

This code is published under the MIT license.
