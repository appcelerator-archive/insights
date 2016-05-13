var config = require('alloy').CFG;

var timeout = 10000;

var lib = {
    network: require('client/net')(),
    time: require('client/time')()
};

// defaults; could be overriden
var url = {
    preProdBase: 'https://360-preprod.cloud.appctest.com/',
    base: 'https://platform.appcelerator.com/',
    app: {
        list        : 'api/v1/insights/apps/?deploytype=production',
        deployTypes : 'api/v1/analytics/@app_guid/deploy_types/',
        composite   : 'installs_platform,sessions_platform,sessionsavg_platform,apmcrash_platform,apmunique_platform,u_platform/',
        append      : '@app_guid/@granularity/@time_range/@deploy_type',
        query       : {
            deployType            : '?deploytype=production'
        },
        installs    : {
            totalsByPlatform      : 'api/v1/analytics3/installs_platform/',
        },
        sessions    : {
            totalByPlatform       : 'api/v1/analytics3/sessions_platform/',
            totalByGeo            : 'api/v1/analytics3/sessions_geo/',
            avgByPlatform         : 'api/v1/analytics3/sessionsavg_platform/'
        },
        crash       : {
            totalByPlatform       : 'api/v1/analytics3/apmcrash_platform/',
            totalUniqueByPlatform : 'api/v1/analytics3/apmunique_platform/'
        },
        devices     : {
            totalUniqueByPlatform : 'api/v1/analytics3/u_platform/'
        }
    }
};

var finder = {
    app_guid    : '@app_guid',
    deploy_type : '@deploy_type',
    granularity : '@granularity',
    time_range  : '@time_range'
};

var granularity = {
    minute : 'minute',
    hours  : 'hour',
    days   : 'day',
    months : 'month',
    years  : 'years'
};

var apiConsumer = {
    demo: {
        name: config.demo.name,
        guid: config.demo.guid
    }
};

var state = {
    updating: false,
    guid: null,
    calls: {
        count: 0
    },
    callbacks: {
        onRequestError: null
    },
    events: {
        onUpdate: function() {},
        onComplete: function() {}
    },
    data: []
};

var env         = '&deploytype=production',
    doNotCache  = '&donotcache=true',
    geoParams   = '&precision=5';

var calls = {
    recentSessions: {
        api: 'api/v1/analytics3/sessions_platform/'
    },
    findSession: {
        api: 'api/v1/auth/findSession'
    },
    switchLoggedInOrg: {
        api: 'api/v1/auth/switchLoggedInOrg'
    },
    urls: [
        {
            msg: 'current sessions...',
            api: 'api/v1/analytics4/geo/sessions/',
            granularity: '/', // current sessions does not use granularity
            type: 'currentSessions'
        },
        {
            // we request 3 weeks worth of data
            // 2 weeks is user contextual
            msg: 'last 2 weeks metrics...',
            api: 'api/v1/analytics3/installs_platform,sessions_platform,sessionsavg_platform,apmcrash_platform,apmunique_platform,acspushdev_platform,u_platform/',
            granularity: '/day/',
            type: '3weeks'
        },
        {
            // we request current and last quarter
            // current quarter is user contextual
            msg: 'current quarter metrics...',
            api: 'api/v1/analytics3/installs_platform,sessions_platform,sessionsavg_platform,apmcrash_platform,apmunique_platform,acspushdev_platform,u_platform/',
            granularity: '/month/',
            type: 'quarter'
        },
        {
            msg: 'current quarter of funnels...',
            api: 'api/v1/app/@app_guid/funnel', // don't need the trailing forward slash
            granularity: '/month/',
            type: 'funnelQuarter'
        },
        {
            msg: 'current month of funnels...',
            api: 'api/v1/app/@app_guid/funnel', // don't need the trailing forward slash
            granularity: '/month/',
            type: 'funnelMonth'
        },
        {
            msg: 'last 7 days of funnels...',
            api: 'api/v1/app/@app_guid/funnel', // don't need the trailing forward slash
            granularity: '/day/',
            type: 'funnelDays'
        }
    ]
};

// #UTC
// will return timestamps from offset (as milliseconds) to now
// example return (string): 1384356243164/1384961043164
function getTimestamps(offset, currentSessions) {
    var _now       = null,
        _startDate = null,
        _endDate   = null;

    // we don't want to do any offsets for current sessions
    if (currentSessions) {
        _now = new Date();
        _startDate = new Date(_now.getUTCFullYear(), _now.getUTCMonth(), _now.getUTCDate(), _now.getUTCHours(), _now.getUTCMinutes() - 60, 0, 0);
        _endDate = new Date(_now.getUTCFullYear(), _now.getUTCMonth(), _now.getUTCDate(), _now.getUTCHours(), _now.getUTCMinutes(), 59, 999);

        return (_startDate.getTime() - (_startDate.getTimezoneOffset() * lib.time.milliIn.minute.one)) + '/' + (_endDate.getTime() - (_endDate.getTimezoneOffset() * lib.time.milliIn.minute.one));
    } else {
        _startDate = (new Date((new Date()).getTime() - offset));
        _endDate = new Date();
        _startDate.setUTCHours(0, 0, 0, 0);
        _endDate.setUTCHours(23, 59, 59, 999);

        return _startDate.getTime() + '/' + _endDate.getTime();
    }
}

// #UTC
// returns timestamps for begining og current month and end of now
function getCurrentMonthTimestamps() {
    var _now              = new Date(),
        _lastDay          = new Date(_now.getUTCFullYear(), _now.getUTCMonth() + 1, 0),
        _currentMonthDate = null;

    _currentMonthDate = new Date(_now.getUTCFullYear(), _now.getUTCMonth(), 1),
    _currentMonthDate = new Date(_currentMonthDate.getTime() - (_currentMonthDate.getTimezoneOffset() * lib.time.milliIn.minute.one)),
    _lastDay          = new Date(_lastDay.getTime() - (_lastDay.getTimezoneOffset() * lib.time.milliIn.minute.one)),
    
    _currentMonthDate.setUTCHours(0, 0, 0, 0);
    _lastDay.setUTCHours(23, 59, 59, 999);     
    
    return _currentMonthDate.getTime() + '/' + _lastDay.getTime();
}


// #UTC
// returns timestamps for begining of current quarter and end of now
function getCurrentQuarterTimestamps() {
    var _now                = new Date(),
        _currentQuarter     = ((_now.getUTCMonth() / 3) | 0) + 1,
        _lastDay            = new Date(_now.getUTCFullYear(), _now.getUTCMonth() + 1, 0),
        _quarterMonth       = _currentQuarter && (_currentQuarter - 1) * 3,
        _currentQuarterDate = null;

    _currentQuarterDate = new Date(_now.getUTCFullYear(), _quarterMonth - 3, 1); // get the previous quarter as well; -3 month
    _currentQuarterDate = new Date(_currentQuarterDate.getTime() - (_currentQuarterDate.getTimezoneOffset() * lib.time.milliIn.minute.one)),
    _lastDay            = new Date(_lastDay.getTime() - (_lastDay.getTimezoneOffset() * lib.time.milliIn.minute.one)),
    
    _currentQuarterDate.setUTCHours(0, 0, 0, 0);
    _lastDay.setUTCHours(23, 59, 59, 999);     
    
    return _currentQuarterDate.getTime() + '/' + _lastDay.getTime();
}

function formatUrl(urlToProcess, guid, granularity, timeRange) {
    return urlToProcess.replace(finder.app_guid, guid).replace(finder.granularity, granularity).replace(finder.time_range, timeRange).replace(finder.deploy_type, url.app.query.deployType);
}

function setUrls(urls) {}

// callback(obj error, msg, apps)
function getAppList(callback) {
    var _callback = callback;

    var _client = Ti.Network.createHTTPClient({ timeout:timeout }),
        _apps   = [];

    _client.onload = function() {
        var _data        = null,
            _tempElement = null;

        try {
            _data = JSON.parse(this.responseText).result;

            for (var a = 0, al = _data.length; a < al; a ++) {
                if (_data[a].app_guid !== apiConsumer.demo.guid && _data[a].app_name !== apiConsumer.demo.name) {
                    _apps.push({
                        name: _data[a].app_name,
                        guid: _data[a].app_guid,
                        org: _data[a].org_id,
                        icon: _data[a].icon
                    });
                }
            }

            // order alpha...
            _apps.sort(function(a, b) {
                // Case should not be a factor when sorting...
                 var aName = a.name.toLowerCase(),
                     bName = b.name.toLowerCase();

                // Sort apps alphabetically...
                return aName < bName ? -1 : (aName > bName ? 1 : 0);
            });

            _callback({
                error : false,
                msg   : null,
                apps  : _apps
            });
        } catch(err) {
            Ti.API.info(err);

            _callback({
                error: true,
                msg: 'An unknown error has occured and it was not possible to retrieve your app list.\n\nWould you like to try again?\n\nIf you decide to cancel, you will be logged out.',
                apps: null,
                code: null
            });
        }
    };

    _client.onerror = function(error) {
        var _error = error || {};

        switch (_error.code) {
            case 1:
                _callback({
                    error: true,
                    msg: 'A connection error has occured and it was not possible to retrieve your app list. You may be offline.\n\nWould you like to try again?\n\nIf you decide to cancel, you will be logged out.',
                    apps: null,
                    code: 1
                });
                break;
            case 2:
                _callback({
                    error: true,
                    msg: 'The request to retrieve your app list has timed out. Please check your connection.\n\nWould you like to try again?\n\nIf you decide to cancel, you will be logged out.',
                    apps: null,
                    code: 2
                });
                break;
            default:
                _callback({
                    error: true,
                    msg: 'An unknown error has occured and it was not possible to retrieve your app list.\n\nWould you like to try again?\n\nIf you decide to cancel, you will be logged out.',
                    apps: null,
                    code: null
                });
                break;
        }
    };

    if (Alloy.Globals.insights.state.preProd) {
        _client.open('GET', (Alloy.Globals.insights.state.customDomain || url.preProdBase) + url.app.list);
    } else {
        _client.open('GET', (Alloy.Globals.insights.state.customDomain || url.base) + url.app.list);
    }
    
    _client.send(null);
}

function reset() {
    state.updating          = false,
    state.guid              = null,
    state.calls.count       = 0,
    state.data.length       = 0,
    state.events.onUpdate   = function() {};
    state.events.onComplete = function() {};
}

function getQuery(sessions) {
    // analytics4 for sessions
    return '?' + (sessions ? geoParams + doNotCache : '') + env;
}

// for today and yesterday...
function getRecentSessionsTotals(config, onComplete) {
    var _config = config || {};

    var _client = null,
        _range  = null;
    
    _range = getTimestamps(lib.time.milliIn.day, false);

    _client = lib.network.createClient({
        url: (Alloy.Globals.insights.state.preProd) ? (Alloy.Globals.insights.state.customDomain || url.preProdBase) + calls.recentSessions.api + _config.guid + '/day/' + _range + getQuery(false) : (Alloy.Globals.insights.state.customDomain || url.base) + calls.recentSessions.api + _config.guid + '/day/' + _range + getQuery(false),
        type: 'GET',
        onLoad: function(data) {
            _client.controllers.destroy();
            _client = null;

            onComplete({ yesterday:data.sessions_platform.dailyTotals[0], today:data.sessions_platform.dailyTotals[1] }, false);
        },
        onError: function(error) {
            _client.controllers.destroy();
            _client = null;

            onComplete(null, true);
        }
    });

    _client.controllers.makeRequest();
}

// #TODO: this is just a quick fix... require caches...
function getSessionData(config) {
    var _config = config || {};

    var _client = null,
        _range  = null;

    var _recentSessionsData = { yesterday:0, today:0 };
    
    // first, get totals for today and yesterday...
    getRecentSessionsTotals({ guid:_config.guid }, function(data, error) {
        if (error) {
            _config.events.onUpdate(true, 'Problem retrieving data...');

            // this is a silent update, so we'll just ignore the error for now
            // #TODO: we need to inform the user so that they are aware that they aren't looking at latest sessions data...
            // state.callbacks.onRequestError();

            reset();
        // then, if we don't have error, get current sessions...
        } else {
            _recentSessionsData.yesterday = data.yesterday,
            _recentSessionsData.today     = data.today;

            _range = getTimestamps(lib.time.milliIn.hour, true);

            _client = lib.network.createClient({
                url: (Alloy.Globals.insights.state.preProd) ? (Alloy.Globals.insights.state.customDomain || url.preProdBase) + calls.urls[0].api + _config.guid + '/' + _range + getQuery(true) : (Alloy.Globals.insights.state.customDomain || url.base) + calls.urls[0].api + _config.guid + '/' + _range + getQuery(true),
                type: 'GET',
                onLoad: function(data) {
                    var _data = data;

                    _data.recentSessionsData = _recentSessionsData;

                    _config.events.onUpdate(false, 'Retrieved data for ' + calls.urls[0].msg);

                    _client.controllers.destroy();
                    _client = null;

                    _config.events.onComplete({
                        type: calls.urls[0].type,
                        data: _data
                    });
                },
                onError: function(error) {
                    _config.events.onUpdate(true, 'Problem retrieving data...');

                    _client.controllers.destroy();
                    _client = null;

                    // this is a silent update, so we'll just ignore the error for now
                    // #TODO: we need to inform the user so that they are aware that they aren't looking at latest sessions data...
                    // state.callbacks.onRequestError();

                    reset();
                }
            });

            _config.events.onUpdate(false, 'Retrieving data for ' + calls.urls[0].msg);
            _client.controllers.makeRequest();
        }
    });
}

function getCurrentSession(callback) {
    var _client =  lib.network.createClient({
        url: (Alloy.Globals.insights.state.preProd) ? (Alloy.Globals.insights.state.customDomain || url.preProdBase) + calls.findSession.api : (Alloy.Globals.insights.state.customDomain || url.base) + calls.findSession.api,
        type: 'GET',
        onLoad: function(data) {
            Alloy.Globals.insights.state.user.org = data.org_id || null;

            Ti.API.info('User\'s current org is: ' + Alloy.Globals.insights.state.user.org);

            callback();
        },
        onError: function(data) {
            Ti.API.info('There was an error checking session...');
            Ti.API.info(data);

            callback();
        }
    });

    state.events.onUpdate('Checking current session...');
    _client.controllers.makeRequest();
}

function switchOrg(appOrg, callback) {
    var _client =  lib.network.createClient({
        url: (Alloy.Globals.insights.state.preProd) ? (Alloy.Globals.insights.state.customDomain || url.preProdBase) + calls.switchLoggedInOrg.api : (Alloy.Globals.insights.state.customDomain || url.base) + calls.switchLoggedInOrg.api,
        type: 'POST',
        onLoad: function(data) {
            Alloy.Globals.insights.state.user.org = appOrg || null;
            
            Ti.API.info('User\'s org was different. Setting it to: ' + Alloy.Globals.insights.state.user.org);

            callback();
        },
        onError: function(data) {
            Ti.API.info('There was an error switching org...');
            Ti.API.info(data);

            callback();
        }
    });

    state.events.onUpdate('Switching organization...');
    _client.controllers.makeRequest({
        org_id: appOrg
    });
}

// #TODO: state is cached! this is not a useful lib method; refactor...
function getAppData(config) {
    var _config = config || {};

    var _client = null,
        _range  = null,
        _url    = null;

    if (!state.guid) {
        state.updating          = true,
        state.guid              = _config.guid,
        state.events.onUpdate   = _config.events.onUpdate || function() {};
        state.events.onComplete = _config.events.onComplete || function() {};
    }

    if (!_config.justSessions) {
        // only allow recursion if getting all app data
        // timeout, url, type, onLoad, onError
        if (state.calls.count !== calls.urls.length) {
            switch (calls.urls[state.calls.count].type) {
                case 'currentSessions':
                    _range = getTimestamps(lib.time.milliIn.hour, true);
                    break;
                case '3weeks':
                    _range = getTimestamps((lib.time.milliIn.week * 3) - lib.time.milliIn.day); // only need 21 days, including today
                    break;
                case 'quarter':
                    _range = getCurrentQuarterTimestamps();
                    break;
                case 'funnelQuarter':
                    _range = getCurrentQuarterTimestamps();
                    break;
                case 'funnelMonth':
                    _range = getCurrentMonthTimestamps();
                    break;
                case 'funnelDays':
                    _range = getTimestamps(lib.time.milliIn.week - lib.time.milliIn.day);
                    break;
                default: break;
            }

            if (calls.urls[state.calls.count].type !== 'funnelQuarter' && calls.urls[state.calls.count].type !== 'funnelMonth' && calls.urls[state.calls.count].type !== 'funnelDays') {
                _url = (Alloy.Globals.insights.state.preProd) ? (Alloy.Globals.insights.state.customDomain || url.preProdBase) + calls.urls[state.calls.count].api + state.guid + calls.urls[state.calls.count].granularity + _range + getQuery(calls.urls[state.calls.count].type === 'currentSessions') : (Alloy.Globals.insights.state.customDomain || url.base) + calls.urls[state.calls.count].api + state.guid + calls.urls[state.calls.count].granularity + _range + getQuery(calls.urls[state.calls.count].type === 'currentSessions');
            } else {
                // https://360-preprod.appcelerator.com/api/v1/app/02a0b629-df19-4049-8f32-4e7948a30cd0/funnel/day/1402012799999/1402617599999/?insightsOnly=true
                _url = (Alloy.Globals.insights.state.preProd) ? (Alloy.Globals.insights.state.customDomain || url.preProdBase) + calls.urls[state.calls.count].api.replace('@app_guid', state.guid) + calls.urls[state.calls.count].granularity + _range + getQuery(false) + '&insightsOnly=true' : (Alloy.Globals.insights.state.customDomain || url.base) + calls.urls[state.calls.count].api.replace('@app_guid', state.guid) + calls.urls[state.calls.count].granularity + _range + getQuery(false) + '&insightsOnly=true';
            }
            
            _client = lib.network.createClient({
                url: _url,
                type: 'GET',
                onLoad: function(data) {
                    state.events.onUpdate('Retrieved data for ' + calls.urls[state.calls.count].msg);

                    state.data.push({
                        type: calls.urls[state.calls.count].type,
                        data: data
                    });

                    _client.controllers.destroy();
                    _client = null;

                    state.calls.count ++;
                    getAppData();
                },
                onError: function(code) {
                    var _msg = null;

                    state.events.onUpdate('Problem retrieving data...');

                    _client.controllers.destroy();
                    _client = null;

                    switch (code) {
                        case 3:
                        case 401:
                            // no longer logged in
                            _msg = 'Your session has expired on this device.\n\nThis can occur if you have logged into Insights from a different device.\n\nTo protect the security of your account, the app on this device will now reset.';
                            break;
                        case 403:
                            _msg = 'A permission error has occurred.\n\nIf this problem persists, please contact your administrator.';
                            break;    
                        case 503:
                            _msg = 'The service is currently unavailable.\n\nIf this problem persists, please contact your administrator.';
                            break;
                        case 1:
                            // connection issue
                            _msg = 'A connection error has occured and it was not possible to retrieve your selected app data. You may be offline.\n\nWould you like to try again?';
                            break;
                        case 2:
                            // timeout issue
                            _msg = 'The request to retrieve your selected app data has timed out. Please check your connection.\n\nWould you like to try again?';
                            break;
                        default:
                            // unknown issue
                            _msg = 'An unknown error has occured and your selected app data could not be retrieved.\n\nPlease contact your administrator.\n\nYou will now be logged out.';
                            break;
                    }

                    state.events.onComplete({ error:true, msg:_msg, code:code });
                    
                    reset();
                }
            });

            // assume first call and that org will not always be the same
            if (state.calls.count === 0) {
                Ti.API.info('Checking org...');

                getCurrentSession(function() {
                    if (Alloy.Globals.insights.state.user.org === _config.org) {
                        Ti.API.info('Org is the same. Not switching...');

                        state.events.onUpdate('Retrieving data for ' + calls.urls[state.calls.count].msg);
                        _client.controllers.makeRequest();
                    } else {
                        Ti.API.info('Org not the same. Switching...');

                        switchOrg(_config.org, function() {
                            state.events.onUpdate('Retrieving data for ' + calls.urls[state.calls.count].msg);
                            _client.controllers.makeRequest();
                        });
                    }
                });
            } else {
                state.events.onUpdate('Retrieving data for ' + calls.urls[state.calls.count].msg);
                _client.controllers.makeRequest();
            }
        } else {
            if (_client) {
                _client.controllers.destroy();
                _client = null;
            }

            state.events.onComplete(state.data);

            reset();
        }
    // if we're only getting session data
    } else {
        _range = getTimestamps(lib.time.milliIn.hour, true);

        _client = lib.network.createClient({
            url: (Alloy.Globals.insights.state.preProd) ? (Alloy.Globals.insights.state.customDomain || url.preProdBase) + calls.urls[0].api + state.guid + calls.urls[0].granularity + _range + getQuery() : (Alloy.Globals.insights.state.customDomain || url.base) + calls.urls[0].api + state.guid + calls.urls[0].granularity + _range + getQuery(),
            type: 'GET',
            onLoad: function(data) {
                state.events.onUpdate(false, 'Retrieved data for ' + calls.urls[0].msg);

                _client.controllers.destroy();
                _client = null;

                state.events.onComplete({
                    type: calls.urls[0].type,
                    data: data
                });
            },
            onError: function(error) {
                state.events.onUpdate(true, 'Problem retrieving data...');

                _client.controllers.destroy();
                _client = null;

                state.callbacks.onRequestError();

                reset();
            }
        });

        state.events.onUpdate(false, 'Retrieving data for ' + calls.urls[0].msg);
        _client.controllers.makeRequest();
    }
}

function getTotalSessionsForDay(guid, callback) {}

function isUpdating() {
    return state.updating;
}

function guidInList(lastSelectedGuid, appList) {
    var _inList = false;

    for (var ai = 0, al = appList.length; ai < al; ai++) {
        Ti.API.info(appList[ai].guid);
        Ti.API.info(lastSelectedGuid);
        if (appList[ai].guid === lastSelectedGuid) {
            _inList = true;
            break;
        }
    }

    return _inList;
}

// override urls with those from remote config
module.exports = function(config) {
    var _config = config || {};

    state.callbacks.onRequestError = _config.callbacks.onRequestError;

    // override urls
    if (_config.urls) {
        setUrls(_config.urls);
    }

    return {
        getAppList: getAppList,
        getAppData: getAppData,
        getSessionData: getSessionData,
        // getCurrentSessions: getCurrentSessions,
        isUpdating: isUpdating,
        guidInList: guidInList
    };
};

// this isn't used...
// function getCurrentSessions(guid, callback) {
//     var _guid     = guid,
//         _callback = callback;

//     var _client   = Ti.Network.createHTTPClient({ timeout:timeout }),
//         _sessions = [];

//     _client.onload = function() {
//         var _data   = JSON.parse(this.responseData) || {},
//             _points = [];
//             _reorderedPointsObj = {},
//             _reorderedPoints = [];

//         if (_data.success) {
//             _points = _data.result.sessions_geo.points;

//             // Run through our points array, find and group dupes
//             // TODO: Grouping will need to be more complex, based on zoom level
//             for (var p = 0, pl = _points.length; p < pl; p ++) {
//                 if (!_reorderedPointsObj["lat" + _points[p].lat + "lng" + _points[p].lng]) {
//                     _reorderedPointsObj["lat" + _points[p].lat + "lng" + _points[p].lng] = {
//                         lat: _points[p].lat,
//                         lng: _points[p].lng,
//                         count: 1
//                     };
//                 } else {
//                     _reorderedPointsObj["lat" + _points[p].lat + "lng" + _points[p].lng].count ++;
//                 }
//             }

//             // Push back to array
//             for (var po in _reorderedPointsObj) {
//                 _reorderedPoints.push(_reorderedPointsObj[po]);
//             }

//             callback({
//                 error  : false,
//                 msg    : null,
//                 points : _reorderedPoints
//             });
//         }
//     };

//     _client.onerror = function() {
//         _callback({
//             error    : true,
//             msg      : 'App Current Session Error',
//             sessions : null
//         });
//     };

//     if (Alloy.Globals.insights.state.preProd) {
//         _client.open('GET', formatUrl((url.preProdBase + url.app.sessions.totalByGeo + url.app.append), _guid, granularity.minute, 1));
//     } else {
//         _client.open('GET', formatUrl((url.base + url.app.sessions.totalByGeo + url.app.append), _guid, granularity.minute, 1));
//     }

//     _client.send(null);
// }