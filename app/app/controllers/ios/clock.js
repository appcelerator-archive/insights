var clock = {};

// #UTC
var state = {
    timer: null,
    showing: {
        dark: true,
        light: false,
    },
    bg: {
        visible: false
    },
    current: {
        date: 'Jan 01',
        hour: '00',
        min: '00',
        sec: '00',
        format: 'AM UTC',
        format12: true
    }
};

var lib = {
    time: require('client/time')()
};

function getParentView() {
    return $.parentContainer;
}

// return {
//         format12: {
//             hour: (((_hour) + 11) % 12) + 1,
//             min: _min,
//             sec: _sec,
//             format: (_hour > 11) ? 'PM' : 'AM'
//         },
//         format24: {
//             hour: _hour,
//             min: _min,
//             sec: _sec,
//             format: '+'
//         }
//     };

// date: 'Jan 01',
//         hour: '00',
//         min: '00',
//         sec: '00',
//         format: 'AM',
//         format12: true

function processUpdate(time) {
    var _currentDate = lib.time.getCurrentDate(),
        _currentTime = lib.time.getCurrentTime();

    blinkDivs();

    // order in frequency of update...
    // seconds...
    if (state.current.sec !== _currentTime.format12.sec) {
        state.current.sec = _currentTime.format12.sec
        $.timeSecondLightLbl.text = $.timeSecondDarkLbl.text = state.current.sec;
    }

    // minute...
    if (state.current.min !== _currentTime.format12.min) {
        state.current.min = _currentTime.format12.min;
        $.timeMinuteLightLbl.text = $.timeMinuteDarkLbl.text = state.current.min;
    } 

    // only for hour...
    if (state.current.format12) {
        if (state.current.format !== _currentTime.format12.format) {
            state.current.format = _currentTime.format12.format;
            $.timeFormatLightLbl.text = $.timeFormatDarkLbl.text = state.current.format;
        }

        if (state.current.hour !== _currentTime.format12.hour) {
            state.current.hour = _currentTime.format12.hour;
            $.timeHourLightLbl.text = $.timeHourDarkLbl.text = state.current.hour;
        }
    } else {
        if (state.current.format !== _currentTime.format24.format) {
            state.current.format = _currentTime.format24.format;
            $.timeFormatLightLbl.text = $.timeFormatDarkLbl.text = state.current.format;
        }

        if (state.current.hour !== _currentTime.format24.hour) {
            state.current.hour = _currentTime.format24.hour;
            $.timeHourLightLbl.text = $.timeHourDarkLbl.text = state.current.hour;
        }
    }

    // month...
    if (_currentDate !== state.current.date) {
        state.current.date = _currentDate,
        $.dateLightLbl.text = $.dateDarkLbl.text = state.current.date;
    }
}

function toggleFormat() {
    if (state.showing.dark) {
        $.darkTimeContainer.opacity = 0.0;
    } else {
        $.lightTimeContainer.opacity = 0.0;
    }

    state.current.format12 = !state.current.format12;
    processUpdate();
    
    if (state.showing.dark) {
        $.darkTimeContainer.animate({ opacity:1.0, duration:100 });
    } else {
        $.lightTimeContainer.animate({ opacity:1.0, duration:100 });
    }
}

function toggleColor(dark) {
    if (dark) {
        onDarkBg();
    } else {
        onLightBg();
    }
}

function onLightBg() {
    state.showing.dark  = true,
    state.showing.light = false;

    $.lightTimeContainer.animate({ opacity:0.0, duration:100 });
    $.darkTimeContainer.animate({ opacity:1.0, duration:100 });

    $.timeDivDark01Lbl.opacity = 1.0;
    $.timeDivDark02Lbl.opacity = 1.0;
}

function onDarkBg() {
    state.showing.dark  = false,
    state.showing.light = true;

    $.lightTimeContainer.animate({ opacity:1.0, duration:100 });
    $.darkTimeContainer.animate({ opacity:0.0, duration:100 });

    $.timeDivLight01Lbl.opacity = 1.0;
    $.timeDivLight02Lbl.opacity = 1.0;
}

// this used to be a background, but has been disabled to opt for a different label color
function toggleBg(hide) {
    if (hide && state.bg.visible) {
        state.bg.visible = false;
        
        $.dateLightLbl.color = $.timeHourLightLbl.color = $.timeMinuteLightLbl.color = $.timeSecondLightLbl.color = '#999';
        $.lightPipe.color = $.timeDivLight01Lbl.color = $.timeDivLight02Lbl.color = $.timeFormatLightLbl.color = '#4c4c4c';

        $.dateDarkLbl.color = $.timeHourDarkLbl.color = $.timeMinuteDarkLbl.color = $.timeSecondDarkLbl.color = '#666';
        $.darkPipe.color = $.timeDivDark01Lbl.color = $.timeDivDark02Lbl.color = $.timeFormatDarkLbl.color = '#999';

        // $.background.animate({ opacity:0.0, top:-35, duration:250 });
    } else if (!hide && !state.bg.visible) {
        state.bg.visible = true;

        $.dateLightLbl.color = $.timeHourLightLbl.color = $.timeMinuteLightLbl.color = $.timeSecondLightLbl.color = '#f2f2f2';
        $.dateDarkLbl.color = $.timeHourDarkLbl.color = $.timeMinuteDarkLbl.color = $.timeSecondDarkLbl.color = '#f2f2f2';
        $.lightPipe.color = $.darkPipe.color = $.timeDivLight01Lbl.color = $.timeDivLight02Lbl.color = $.timeDivDark01Lbl.color = $.timeDivDark02Lbl.color = $.timeFormatLightLbl.color =  $.timeFormatDarkLbl.color = '#a6a6a6';
        
        // $.background.animate({ opacity:1.0, top:0, duration:250 });
    }
}

function blinkDivs() {
    if (state.showing.dark) {
        $.timeDivDark01Lbl.opacity = 0.0;
        $.timeDivDark02Lbl.opacity = 0.0;

        $.timeDivDark01Lbl.animate({ opacity:1.0, duration:250 });
        $.timeDivDark02Lbl.animate({ opacity:1.0, duration:250 });
    } else {
        $.timeDivLight01Lbl.opacity = 0.0;
        $.timeDivLight02Lbl.opacity = 0.0;

        $.timeDivLight01Lbl.animate({ opacity:1.0, duration:250 });
        $.timeDivLight02Lbl.animate({ opacity:1.0, duration:250 });
    }
}

function init(config) {
    $.parentContainer.addEventListener('click', toggleFormat);

    state.timer = lib.time.createTimer(processUpdate, 1000);

    state.timer.controllers.start();
}

exports._init          = init,
exports._toggleBg      = toggleBg,
exports._getParentView = getParentView,
exports._toggleColor   = toggleColor;