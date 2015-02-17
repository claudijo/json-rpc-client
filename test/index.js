var assert = require('assert');
var createRequest = require('..');

var uuidRegExp = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

describe('JSON RPC server', function() {
  var request;
  var channel;

  beforeEach(function() {
    channel = {
      _listeners: {},

      send: function(json) {
        throw new Error('Method "send" not implemented');
      },

      on: function(event, listener) {
        this._listeners[event] = listener;
      },

      _receive: function(event, data) {
        this._listeners[event] && this._listeners[event].call(null, data);
      }
    };

    request = createRequest(channel);
  });

  it('should send request with json rpc version', function(done) {
    channel.send = function(json) {
      var data = JSON.parse(json);
      assert(data.jsonrpc === '2.0');
      done();
    };

    request('subtract', [42, 23], function(err, response) {});
  });

  it('should send request with method name', function(done) {
    channel.send = function(json) {
      var data = JSON.parse(json);
      assert(data.method === 'subtract');
      done();
    };

    request('subtract', [42, 23], function(err, response) {});
  });

  it('should send request with by-position parameters', function(done) {
    channel.send = function(json) {
      var data = JSON.parse(json);
      assert(data.params[0] === 42);
      assert(data.params[1] === 23);
      done();
    };

    request('subtract', [42, 23], function(err, response) {});
  });

  it('should send request with by-name parameters', function(done) {
    channel.send = function(json) {
      var data = JSON.parse(json);
      assert(data.params.a === 42);
      assert(data.params.b === 23);
      done();
    };

    request('subtract', {a: 42, b: 23}, function(err, response) {});
  });

  it('should send request with id if params and callback are provided',
      function(done) {
    channel.send = function(json) {
      var data = JSON.parse(json);
      assert(uuidRegExp.test(data.id));
      done();
    };

    request('subtract', [42, 23], function(err, response) {});
  });

  it('should send request with id if callback is provided but params are ' +
  'omitted', function(done) {
    channel.send = function(json) {
      var data = JSON.parse(json);
      assert(uuidRegExp.test(data.id));
      done();
    };

    request('subtract', function(err, response) {});
  });

  it('should send request without id if by-prder params are provided but ' +
  'callback is omitted', function(done) {
    channel.send = function(json) {
      var data = JSON.parse(json);
      assert(typeof data.id === 'undefined');
      done();
    };

    request('subtract', [42, 23]);
  });

  it('should send request without id if by-name params are provided but ' +
  'callback is omitted', function(done) {
    channel.send = function(json) {
      var data = JSON.parse(json);
      assert(typeof data.id === 'undefined');
      done();
    };

    request('subtract', { a: 42, b: 23 });
  });

  it('should send request without id if params and callback are omitted',
      function(done) {
    channel.send = function(json) {
      var data = JSON.parse(json);
      assert(typeof data.id === 'undefined');
      done();
    };

    request('subtract');
  });

  it('should batch up requests if several requests are sent in the same event loop', function(done) {
    channel.send = function(json) {
      var data = JSON.parse(json);

      assert(data[0].method === 'subtract');
      assert(data[0].params[0] === 42);
      assert(data[0].params[1] === 23);
      assert(uuidRegExp.test(data[0].id));

      assert(data[1].method === 'add');
      assert(data[1].params.a === 24);
      assert(data[1].params.b === 32);
      assert(uuidRegExp.test(data[1].id));

      done();
    };

    request('subtract', [42, 23], function(err, response) {});
    request('add', { a: 24, b: 32 }, function(err, response) {});
  });

  it('should invoke callback with result when channel receives response', function(done) {
    channel.send = function(json) {
      var data = JSON.parse(json);

      channel._receive('message', JSON.stringify({
        jsonrpc: '2.0',
        result: 65,
        id: data.id
      }));
    };

    request('subtract', [42, 23], function(err, result) {
      assert(result === 65);
      done();
    });
  });

  it('should ignore response that does not contain protocol version', function(done) {
    var callCount = 0;

    channel.send = function(json) {
      var data = JSON.parse(json);

      channel._receive('message', JSON.stringify({
        result: 65,
        id: data.id
      }));
    };

    request('subtract', [42, 23], function(err, result) {
      callCount += 1;
    });

    setTimeout(function() {
      assert(callCount === 0);
      done();
    }, 0);
  });

  it('should invoke callback with error when channel receives error', function(done) {
    channel.send = function(json) {
      var data = JSON.parse(json);

      channel._receive('message', JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -1,
          message: 'test error'
        },
        id: data.id
      }));
    };

    request('subtract', [42, 23], function(err, response) {
      assert(err.code === -1);
      assert(err.message === 'test error');
      done();
    });
  });

  it('should ignore response that does not contain valid id', function(done) {
    var callCount = 0;

    channel.send = function(json) {
      var data = JSON.parse(json);

      channel._receive('message', JSON.stringify({
        jsonrpc: '2.0',
        result: 65,
        id: 'invalid-id-here'
      }));
    };

    request('subtract', [42, 23], function(err, result) {
      callCount += 1;
    });

    setTimeout(function() {
      assert(callCount === 0);
      done();
    }, 0);
  });
});
