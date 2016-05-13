// timeout, url, type, onLoad, onError
function createClient(config) {
    var _config = config || {};

    var _client = {};

    _client.client = Ti.Network.createHTTPClient({ validatesSecureCertificate:true, timeout:Alloy.Globals.insights.timeout });

    _client.state = {};

    _client.controllers = {
        makeRequest: function(sendWith) {
            var _sendWith = sendWith || null;
            
            Ti.API.info('#REQUEST: ' + _config.url);
            
            // #DEBUG
            Alloy.Globals.insights.calls.push((new Date()).getTime() + ': ' + _config.url + '\n\n');
            // #DEBUG
            
            _client.client.open(_config.type, _config.url);
            _client.client.send(_sendWith);
        },
        destroy: function() {
            _client.client = null;
            _client = null;
        }
    };

    _client.client.onload = function() {
        var _data = JSON.parse(this.responseText);

        try {
            if (_data.success) {
                _config.onLoad(_data.result);
            } else {
                // user is no longer logged in...
                _config.onError(401);
            }
        } catch(err) {
            Ti.API.info(err);
            _config.onError(null);
        }
        
    };

    _client.client.onerror = function(error) {
        var _error = error || {};

        Ti.API.info(JSON.stringify(_error));
        Ti.API.info(_error.code);

        _config.onError(_error.code);
    };

    return _client;
}

module.exports = function() {
    return {
        createClient: createClient
    };
};