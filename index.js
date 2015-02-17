var uuid = require('node-uuid');

var request = function(method, params, id) {
  return {
    jsonrpc: '2.0',
    method: method,
    params: params,
    id: id
  };
};

module.exports = function(channel) {
  var responseListeners = {};
  var messageQueue = [];

  var flushMessageQueue = function() {
    var data;
    var message;

    if (messageQueue.length === 0) {
      return;
    }

    if (messageQueue.length === 1) {
      data = messageQueue[0];
    } else {
      data = messageQueue;
    }

    message = JSON.stringify(data);
    messageQueue = [];

    channel.send.call(channel, message);
  };

  channel.on('message', function(message) {
    var data = JSON.parse(message);

    if (data.jsonrpc !== '2.0') {
      return;
    }

    if (!responseListeners[data.id]) {
      return;
    }

    responseListeners[data.id].call(null, data.error, data.result);

    delete responseListeners[data.id];
  });

  return function (method, params, fn) {
    var id;
    var message;

    if (typeof params === 'function') {
      fn = params;
    }

    if (typeof fn === 'function') {
      id = uuid.v4();
      responseListeners[id] = fn;
    }

    message = request(method, params, id);
    messageQueue.push(message);

    process.nextTick(flushMessageQueue);
  };
};
