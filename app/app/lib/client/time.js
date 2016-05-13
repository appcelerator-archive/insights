   var milliIn = {
    day: 86400000,
    week: 604800000,
    month: 2628000000,
    hour: 3600000,
    minute: {
        one: 60000,
        five: 300000
    }
};

var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

function getEodAsMilli() {
    var _now = new Date();

    _now.setUTCHours(23, 59, 59, 999);

    // #UTC
    return _now.getTime();
}

// #UTC
function getCurrentDate() {
    var _now = new Date(),
        _day = _now.getUTCDate();

    return months[_now.getUTCMonth()] + ((_day < 10) ? ' 0' + _day : ' ' + _day);
}

// #UTC
function getCurrentTime() {
    var _now          = new Date(),
        _hour         = _now.getUTCHours(),
        _format12Hour = (((_hour) + 11) % 12) + 1,
        _min          = _now.getUTCMinutes(),
        _sec          = _now.getUTCSeconds();

    // #TODO: since hour and format is the only difference, composite...
    return {
        format12: {
            hour: (_format12Hour < 10) ? '0' + _format12Hour : _format12Hour,
            min: (_min < 10) ? '0' + _min : _min,
            sec: (_sec < 10) ? '0' + _sec : _sec,
            format: (_hour > 11) ? 'PM UTC' : 'AM UTC'
        },
        format24: {
            hour: (_hour < 10) ? '0' + _hour : _hour,
            min: (_min < 10) ? '0' + _min : _min,
            sec: (_sec < 10) ? '0' + _sec : _sec,
            format: '24H UTC'
        }
    };
}

function createTimer(onUpdate, interval, cycles) {
    var _interval = interval || 1000,
        _cycles   = cycles || null,
        _onUpdate = onUpdate || function() {};
        
    var _timer = {
        timer: null
    };
    
    _timer.state = {
        running: false,
        count: 0
    };
    
    _timer.controllers = {
        start: function() {
            _timer.state.running = true;
        },
        // pasues timer (no reset)
        pause: function() {
            _timer.state.running = false;
        },
        // resumes timer (same as start at the moment)
        resume: function() {
            _timer.state.running = true;
        },
        // resets timer
        stop: function() {
            _timer.controllers.pause();
            _timer.state.count = 0;
        },
        destroy: function() {
            _timer.controllers.stop();
            clearInterval(_timer.timer);
            _timer = null;
        }
    };

    _timer.timer = setInterval(function() {
        if (_timer.state.running) {
            _timer.state.count += _interval;
            _onUpdate(_timer.state.count);
        }
    }, _interval);
        
    return _timer;
}

// #APPTS-3742: pass in timestamp instead of current count from timer...
function getLastUpdated(timestamp) {
    var _lastUpdated = null,
        _now         = new Date().getTime(),
        _delta       = _now - timestamp;
    
    Ti.API.info('Last Updated Delta: ' + _delta);
    
    if      (_delta <    60000) { _lastUpdated =    '< 1 min'; }
    else if (_delta <   300000) { _lastUpdated =    '< 5 min'; }
    else if (_delta <  3600000) { _lastUpdated =   '< 1 hour'; }
    else if (_delta >  3600000) { _lastUpdated =   '> 1 hour'; }
    else if (_delta > 43200000) { _lastUpdated = '> 12 hours'; }
    else if (_delta > 86400000) { _lastUpdated = '> 24 hours'; }
    else                        { _lastUpdated =         null; }
    
    return _lastUpdated;
}

function getNow() {
    return (new Date()).getTime();
}

module.exports = function(config) {
    var _config = config || {};
    
    return {
        createTimer: createTimer,
        getLastUpdated: getLastUpdated,
        getNow: getNow,
        milliIn: milliIn,
        // for clock, so very specific...
        getCurrentTime: getCurrentTime,
        getCurrentDate: getCurrentDate
    };
};