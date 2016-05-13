var timeout = 10000;

var url = {
    preProdBase: 'https://360-preprod.appcelerator.com/',
    base: 'https://dashboard.appcelerator.com/',
    login: 'api/v1/auth/login',
    logout: 'api/v1/auth/logout/'
};

// username, password, from, callback(error, msg *opt)
function login(obj) {    
    var _obj      = obj || {},
        _username = _obj.username,
        _password = _obj.password,
        _from     = _obj.from,
        _callback = _obj.callback;

    var _client = Ti.Network.createHTTPClient({ timeout:timeout });

    _client.onload = function() {
        var _data = null;

        try {
            if (this.status === 503) {
                _callback(true, 'The service is currently unavailable.\n\nIf this problem persists, please contact your administrator.', 503);
            } else {
                // #BUG: Android couldn't process responseData
                _data = JSON.parse(this.responseText);

                try {
                    Alloy.Globals.insights.state.user.org = _data.result.org_id;

                    Ti.API.info('User logged in with org id: ' + Alloy.Globals.insights.state.user.org);
                } catch(error) {
                    Ti.API.info('Do not know what the user\'s current org id is...');
                    Ti.API.info(error);
                }

                if (_data.success) {
                    _callback(false, null, null);
                } else {
                    if (_data.description) {
                        _callback(true, _data.description, null);
                    } else {
                        _callback(true, 'An unknown login error has occured.\n\n' + ((Alloy.Globals.insights.state.customDomain) ? 'Please ensure that the custom domain you have entered is valid.\n\n' : '') + 'If this problem persists, please contact your administrator.', null);
                    }
                }
            }
        } catch(err) {
            Ti.API.info(err);
            _callback(true, 'An unknown login error has occured.\n\n' + ((Alloy.Globals.insights.state.customDomain) ? 'Please ensure that the custom domain you have entered is valid.\n\n' : '') + 'If this problem persists, please contact your administrator.', null);
        }
    };

    _client.onerror = function(error) {
        var _data  = null,
            _code  = null,
            _error = error || {};
            
        if (_error.code === 503) {
            _code = _error.code;
        } else {
            try {
                _data = JSON.parse(this.responseText) || {},
                _code = _data.code || null;
            } catch(err) {
                Ti.API.info(err);
                _callback(true, 'An unknown login error has occured.\n\n' + ((Alloy.Globals.insights.state.customDomain) ? 'Please ensure that the custom domain you have entered is valid.\n\n' : '') + 'If this problem persists, please contact your administrator.', null);
                return; // we don't need to do anything else...
            }
        }

        // checking code as we may want to do additional work here...
        switch (_code) {
            case 503:
                _callback(true, 'The service is currently unavailable.\n\nIf this problem persists, please contact your administrator.', _code);
                break;
            case 400:
            case 403:
                _callback(true, _data.description, _code);
                break;
            default:

                switch (_error.code) {
                    case 1:
                        _callback(true, 'A connection error has occured. You may be offline.\n\nPlease check your connection' + ((Alloy.Globals.insights.state.customDomain) ? ' and custom domain, ' : '') + 'and try again.', 1);
                        break;
                    case 2:
                        _callback(true, 'Your login request timed out.\n\nPlease check your connection' + ((Alloy.Globals.insights.state.customDomain) ? ' and custom domain, ' : '') + 'and try again.', 1);
                        break;
                    default:
                        _callback(true, 'An unknown login error has occured.\n\n' + ((Alloy.Globals.insights.state.customDomain) ? 'Please ensure that the custom domain you have entered is valid.\n\n' : '') + 'If this problem persists, please contact your administrator.', null);
                        break;
                }
                
                break;
        }       
    };

    _client.open('POST', ((Alloy.Globals.insights.state.preProd) ? (Alloy.Globals.insights.state.customDomain || url.preProdBase) + url.login : (Alloy.Globals.insights.state.customDomain || url.base) + url.login));
    _client.send({
        "username" : _username,
        "password" : _password,
        "from"     : _from
    });
}

// callback(error, msg)
function logout(callback) {
    var _callback = callback;

    var _client = Ti.Network.createHTTPClient({ timeout:timeout });

    _client.onload = function() {
        try {
            if (this.status === 200) {
                _callback(false);
            } else {
                _callback(true, 'Logout Error Occured.');
            }
        } catch(err) {
            Ti.API.info(err);
            _callback(true, 'Logout Error Occured.');
        }
    };

    _client.onerror = function() {
        _callback(true, 'Logout Error Occured.');
    };

    _client.open('GET', ((Alloy.Globals.insights.state.preProd) ? (Alloy.Globals.insights.state.customDomain || url.preProdBase) + url.logout : (Alloy.Globals.insights.state.customDomain || url.base) + url.logout));
    _client.send(null);
}

module.exports = function(config) {
    return {
        login  : login,
        logout : logout
    };
};