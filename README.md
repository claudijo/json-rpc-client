# json rpc client

A [JSON-RPC 2.0](http://www.jsonrpc.org/specification) client implementation, which can be used with an arbitrary transport. For corresponding server implementation, see [json-rpc-server](https://github.com/claudijo/json-rpc-server).

> The Client is defined as the origin of Request objects and the handler of Response objects.

## Usage

Create request function with an arbitrary transport. The transport object MUST have a `send` method for sending string messages and it MUST have an `on` method for adding `message` event listeners.

Messages are batched if they are sent within the same event loop.

### Example

```js
// Channel "interface"
var channel = {
  // Sends the specified string over the wire.
  send: function(json) {
    // ...
  },

  // This method will be called with the sting `message` as event and a callback
  // that expects the incoming message payload as a string.
  on: function(event, listener) {
    // ...
  },
};

var request = require('json-rpc-client')(channel);

// rpc call with positional parameters
// --> {"jsonrpc": "2.0", "method": "subtract", "params": [42, 23], "id": "generated-uuid"}
request('subtract', [42, 23], function(err, result) {
  // ...
});

//rpc call with named parameters
// --> {"jsonrpc": "2.0", "method": "subtract", "params": {"subtrahend": 23, "minuend": 42}, "id": "generated-uuid"}
request('subtract', {subtrahend: 23, minuend: 42}, function(err, result) {
  // ...
});

// a notification
--> {"jsonrpc": "2.0", "method": "update", "params": [1,2,3,4,5]}
request('update', [1, 2, 3, 4, 5]);
```

## Test

Run unit tests:

`$ npm test`

Create test coverage report:

`$ npm run-script test-cov`

## License

[MIT](LICENSE)
