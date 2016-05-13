var globalData = null;

var lib = {
    events: require('client/events')(),
    number: require('client/number')(),
    scaler: require('client/scaler')(),
    map: require('client/map')({
        width: (OS_IOS) ? 2252 : (Alloy.Globals.insights.state.android.xLarge) ? 2334 : 1750, // 0.75
        height: (OS_IOS) ? 1931 : (Alloy.Globals.insights.state.android.xLarge) ? 2000 : 1500, // 0.75
        latitude: {
            boundsBottom: -80,
            boundsBottomDegree: 0
        },
        longitude: {
            boundsLeft: -180,
            boundsRight: 180,
            delta: 0
        }
    })
};

var appMap = {
    // zones keep track of where session blips are 
    // based on 4x4 grid...
    zones: {
        layout: {
            cols: 4,
            rows: 4
        }
    }
};

var state = {
    initComplete: false,
    callbacks: {
        notifyOrbsVisibility: null
    },
    expandedSessionCountShowing: false,
    returningToCenter: false,
    currentMapOffset: {
        x: 0,
        y: 0
    },
    // this arr keeps track of all blips
    blips: [],
    // 16 zones; 4x4...
    // blips are placed in these zones and the cluster method (lib/client/map.js) 
    // will determine how blips should be clustered...
    // #TODO: do this programatically, if performance is slow and the grid 
    // needs to be resized based on session total...
    zones: [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []],
    // this arr keeps track of clustered sessions for ui display
    clusters: []
};

var positionOffset = {
    center : {
        x : ($.mapContainer.width - Alloy.Globals.insights.utils.PXToDP(Ti.Platform.displayCaps.platformWidth)) / 2,
        y : ($.mapContainer.height - Alloy.Globals.insights.utils.PXToDP(Ti.Platform.displayCaps.platformHeight)) / 2
    }
};

var baseScaleAsNum = {
    x: $.mapContainer.width - Alloy.Globals.insights.utils.PXToDP(Ti.Platform.displayCaps.platformWidth),
    y: $.mapContainer.height - Alloy.Globals.insights.utils.PXToDP(Ti.Platform.displayCaps.platformHeight)
};

function returnMapToCenter(animated) {
    if (animated) {
        state.returningToCenter = true;
    }

    $.mapScrollView.setContentOffset(positionOffset.center, { animated:animated });

    // #FIX - annoying workaround, as the scroll end event doesn't fire 
    // when repositioning during init...
    if (!state.initComplete && !animated) {
        setTimeout(function() {
            state.initComplete = true;
        }, 10);
    }
}

function getParentView() {
    return $.parentView;
}

function processScroll(e) {
    if (state.initComplete) {
        // #FIX - I exposed zoomScale for this event in platform
        if (e.zoomScale <= 1.0) {
            state.callbacks.notifyOrbsVisibility(false, false);
        } else if (e.zoomScale > 1.0) {
            state.callbacks.notifyOrbsVisibility(true);
        }
    }
}

function processScale(e) {
    if (state.initComplete && $.mapScrollView.zoomScale > 1.0) {
        // state.callbacks.notifyOrbsVisibility(true);
    }
}

function processSingleTap(e) {
    if (state.initComplete) {
        state.callbacks.notifyOrbsVisibility(null, true);
    }
}

function processDoubleTap(e) {
    if (state.initComplete) {
        if ($.mapScrollView.zoomScale === 1.0) {
            $.mapScrollView.setZoomScale($.mapScrollView.maxZoomScale, { animated:true });
        } else {
            $.mapScrollView.setZoomScale($.mapScrollView.minZoomScale, { animated:true });
            
            returnMapToCenter(true);
            
            setTimeout(function() {
                state.returningToCenter = false;
                state.callbacks.notifyOrbsVisibility(false, true); // #FIX - workaround, since we don't get a callback on animation complete
            }, 500);
        }
    }
}

function processScrollEnd(e) {
    var _delta          = (($.mapContainer.height * $.mapScrollView.zoomScale) | 0) - Alloy.Globals.insights.utils.PXToDP(Ti.Platform.displayCaps.platformHeight),
        _contentOffsetY = $.mapScrollView.contentOffset.y | 0;

    // this checks to see if the user has scrolled the map to the bottom bounds...
    // if they have, we show the orbs...
    // as the accuracy of the check may be off, we allow +-1 variance...
    if (_delta <= _contentOffsetY + 1 || _delta <= _contentOffsetY - 1) {
        state.callbacks.notifyOrbsVisibility(false, false);
    }
}

function zoomMapparentViewOut() {
    // $.mapContainer.animate({ transform:Ti.UI.create2DMatrix({ scale:0.9 }), duration:250 });
}

function zoomMapparentViewIn() {
    // $.mapContainer.animate({ transform:Ti.UI.create2DMatrix({ scale:1.0 }), duration:500 });
}

function toggleExpandedSessionCount() {
    Ti.API.info('Toggle Expanded Session Count Fired');
    
    if (!state.expandedSessionCountShowing) {
        lib.events.fireEvent(lib.events.EVT.HOME.ACTIVESESSION);

        $.sessionCurrentCountContainer.animate({ curve:Ti.UI.ANIMATION_CURVE_EASE_IN, top:lib.scaler.sv(74, false), duration:150 }, function() {
            $.sessionCurrentCountContainer.animate({ top:lib.scaler.sv(70, false), duration:100 }, function() {
                $.sessionCurrentCountContainer.top = lib.scaler.sv(70, false);
            });
        });

        $.sessionCountContainer.animate({ opacity:1.0, duration:250 });
    } else {
        $.sessionCurrentCountContainer.animate({ curve:Ti.UI.ANIMATION_CURVE_EASE_IN, top:lib.scaler.sv(36, false), duration:150 }, function() {
            $.sessionCurrentCountContainer.animate({ top:lib.scaler.sv(40, false), duration:100 }, function() {
                $.sessionCurrentCountContainer.top = lib.scaler.sv(40, false);
            });
        });

        $.sessionCountContainer.animate({ opacity:0.0, duration:250 });
    }

    state.expandedSessionCountShowing = !state.expandedSessionCountShowing;
}

function hideCountLabels() {
    $.sessionCurrentCountContainer.animate({ opacity:0.0, top:$.sessionCurrentCountContainer.top - lib.scaler.sv(20, false), duration: 500 }, function() {
        $.sessionCurrentCountContainer.top = $.sessionCurrentCountContainer.top - lib.scaler.sv(20, false);
        $.sessionCurrentCountContainer.opacity = 0.0;
    });

    $.sessionCountContainer.animate({ opacity:0.0, top:$.sessionCountContainer.top - lib.scaler.sv(20, false), duration: 500 }, function() {
        $.sessionCountContainer.top = $.sessionCountContainer.top - lib.scaler.sv(20, false);
        $.sessionCountContainer.opacity = 0.0;
    });
}

function showCountLabels() {
    $.sessionCurrentCountContainer.animate({ opacity:1.0, curve:Ti.UI.ANIMATION_CURVE_EASE_IN, top:$.sessionCurrentCountContainer.top + lib.scaler.sv(24, false), duration: 400 }, function() {
        $.sessionCurrentCountContainer.top = $.sessionCurrentCountContainer.top + lib.scaler.sv(24, false);
        $.sessionCurrentCountContainer.opacity = 1.0;
        $.sessionCurrentCountContainer.animate({ top:(state.expandedSessionCountShowing) ? lib.scaler.sv(70, false) : lib.scaler.sv(40, false), duration:100 }, function() {
            $.sessionCurrentCountContainer.top = (state.expandedSessionCountShowing) ? lib.scaler.sv(70, false) : lib.scaler.sv(40, false);
        });
    });

    $.sessionCountContainer.animate({ opacity:(state.expandedSessionCountShowing) ? 1.0 : 0.0, curve:Ti.UI.ANIMATION_CURVE_EASE_IN, top:$.sessionCountContainer.top + lib.scaler.sv(24, false), duration:400 }, function() {
        $.sessionCountContainer.opacity = (state.expandedSessionCountShowing) ? 1.0 : 0.0;
        $.sessionCountContainer.top = $.sessionCountContainer.top + lib.scaler.sv(24, false);
        $.sessionCountContainer.animate({ top:lib.scaler.sv(40, false), duration:100 }, function() {
            $.sessionCountContainer.top = lib.scaler.sv(40, false);
        });
    });
}

function getSessionCurrentCountView() {
    return $.sessionCurrentCountContainer;
}

function processEvents(events) {
    var _events = events || {};

    Ti.API.info('MAP - Process Events Fired');

    if (_events.onMapShow) {
        zoomMapparentViewIn();
    }

    if (_events.onMapHide) {
        zoomMapparentViewOut();
    }

    if (_events.onShowDetail) {
        hideCountLabels();
    }

    if (_events.onHideDetail) {
        showCountLabels();
    }
}

function getActiveSessionsView() {
    return $.activeSessionsContainer;
}

function createBlip(config) {
    var _blip   = {},
        _config = config || {};

    var _center = Ti.UI.createView({ width:lib.scaler.sv(10, false), height:lib.scaler.sv(10, false), backgroundImage:'/images/map/blip-center.png' });
        // _outer  = Ti.UI.createView({ width:10, height:10, backgroundImage:'/map/blip-outer.png' }),
        // _inner  = Ti.UI.createView({ width:10, height:10, backgroundImage:'/map/blip-outer.png' });

    _blip.state = {
        parent: _config.parent || null,
        // describes the rect for each location for clustering...
        width: lib.scaler.sv(4, false),
        height: lib.scaler.sv(4, false),
        center: _config.center || { x:0, y:0 }
    };

    _blip.controllers = {
        // #TODO: refactor
        animate: function() {
            if (_blip && _blip.controllers && !Alloy.Globals.insights.state.current.context.apps.catDetail) {
                _outer.animate({ width:70, height:70, opacity:0.0, duration:1500 });

                setTimeout(function() {
                    if (_blip && _blip.controllers && !Alloy.Globals.insights.state.current.context.apps.catDetail) {
                        _inner.animate({ width:60, height:60, opacity:0.0, duration:2500 }, function() {
                            if (_blip && _blip.controllers && !Alloy.Globals.insights.state.current.context.apps.catDetail) {
                                _outer.animate({ width:10, height:10, opacity:1.0, duration:0 });
                                _inner.animate({ width:10, height:10, opacity:1.0, duration:0 }, function() {
                                    if (_blip && _blip.controllers && !Alloy.Globals.insights.state.current.context.apps.catDetail) {
                                        _outer.width = 10;
                                        _outer.height = 10;
                                        _outer.opacity = 1.0;
                                        _inner.width = 10;
                                        _inner.height = 10;
                                        _inner.opacity = 1.0;
                                        
                                        setTimeout(function() {
                                            if (_blip && _blip.controllers) { _blip.controllers.animate(); }
                                        }, lib.number.getRandomInt(2000, 6000));
                                    } else if (_blip &&  _blip.controllers) {
                                        _blip.controllers.animate();
                                    }
                                });
                            } else if (_blip && _blip.controllers) {
                                _blip.controllers.animate();
                            }
                        });
                    } else if (_blip && _blip.controllers) {
                        _blip.controllers.animate();
                    }
                }, 250);
            } else if (_blip && _blip.controllers) {
                setTimeout(function() { if (_blip && _blip.controllers) { _blip.controllers.animate(); } }, 6000);
            }
        },
        show: function(notAnimated) {
            if (_blip.parentView && _blip) {
                if (notAnimated) {
                    _blip.parentView.opacity = 1.0;
                } else {
                    _blip.parentView.animate({ opacity:1.0, duration:250 });
                }
            }
        },
        scale: function(scaleVal) {
            _blip.parentView.transform = Ti.UI.create2DMatrix({ scale:Number(scaleVal).toFixed(2) });
        },
        remove: function(notAnimated) {
            if (_blip.parentView && _blip) {
                if (notAnimated) {
                    _blip.state.parent.remove(_blip.parentView);

                    _blip.controllers.destroy();
                } else {
                    _blip.parentView.animate({ opacity:0.0, duration:250 }, function() {
                        _blip.state.parent.remove(_blip.parentView);

                        _blip.controllers.destroy();
                    });
                }
            }
        },
        destroy: function() {
            _center = null;
            _outer = null;
            _inner = null;
            
            _blip.parentView = null;
            _blip = null;
        }
    }  

    _blip.parentView = Ti.UI.createView({ center:_blip.state.center, opacity:0.0, width:lib.scaler.sv(70, false), height:lib.scaler.sv(70, false) });

    // _blip.parentView.add(_outer);
    // _blip.parentView.add(_inner);
    _blip.parentView.add(_center);

    // APPTS-3926: temporarily disable blip animation...
    // setTimeout(function() {
    //     if (_blip) {
    //         _blip.controllers.animate();
    //     }
    // }, lib.number.getRandomInt(1000, 6000));

    return _blip;
}

function destroyPreviousBlips(onComplete, notAnimated) {
    for (var bi = 0, bil = state.blips.length; bi < bil; bi++) {
        $.activeSessionsContainer.remove(state.blips[bi].parentView);
        state.blips[bi] = null;
    }
        
    state.blips.length = 0;
    state.blips = [];

    onComplete();
}

function getCurrentSessionTotal(currentSessionArr) {
    var _totalSessionCount = 0;

    for (var csi = 0, csil = currentSessionArr.length; csi < csil; csi ++) {
        _totalSessionCount += currentSessionArr[csi].count;
    }

    return _totalSessionCount;
}

function updateSessionLbls() {
    // update total current sessions label
    $.currentSessionCountLbl.text = lib.number.withCommas(Alloy.Globals.insights.data.sessions.currentTotal);
    $.sessionCountYesterdayLbl.text = Alloy.Globals.insights.data.sessions.yesterday + ' /';
    $.sessionCountTodayLbl.text = Alloy.Globals.insights.data.sessions.today;

    if (Alloy.Globals.insights.data.sessions.yesterday > Alloy.Globals.insights.data.sessions.today) {
        $.sessionCountTodayLbl.color = '#ff0080';
    } else if (Alloy.Globals.insights.data.sessions.yesterday < Alloy.Globals.insights.data.sessions.today) {
        $.sessionCountTodayLbl.color = '#00b0ff';
    } else {
        $.sessionCountTodayLbl.color = '#999';
    }
}

function generateCurrentBlips(notAnimated) {
    var _totalSessions  = 0,
        _currentSession = null,
        _blip           = null;

    var _countsArr = [],
        _maxCount  = 0,
        _scaleVal  = 0,
        _minScale  = 0.2,
        _maxScale  = 1.0;

    _totalSessions = Alloy.Globals.insights.data.sessions.current.length;
    
    // generate blips for all current sessions
    for (var pi = 0, pil = _totalSessions; pi < pil; pi ++) {
        _currentSession = Alloy.Globals.insights.data.sessions.current[pi];

        _blip = createBlip({
            parent: $.activeSessionsContainer,
            center: lib.map.convertGeoToPixelPosition(_currentSession.lat, _currentSession.lng)
        });

        state.blips.push(_blip);

        _countsArr.push(_currentSession.count);
    }

    _maxCount = Math.max.apply(Math, _countsArr);

    for (var sbi = 0, sbl = state.blips.length; sbi < sbl; sbi ++) {
        _scaleVal = (_maxScale * _countsArr[sbi]) / _maxCount;
        state.blips[sbi].controllers.scale((_scaleVal < _minScale) ? _minScale : _scaleVal);
        $.activeSessionsContainer.add(state.blips[sbi].parentView);
        state.blips[sbi].controllers.show(notAnimated);
    }
}

function blinkCurrentSessionCount(previousSessionCount, callback) {
    var _previousSessionCount = previousSessionCount || 0;

    $.sessionCurrentCountContainer.animate({ opacity:0.0, duration:50 }, function() {
        // update session labels after hiding current session label...
        updateSessionLbls();

        if (_previousSessionCount !== Alloy.Globals.insights.data.sessions.currentTotal) {
            $.currentSessionCountLbl.color = (_previousSessionCount > Alloy.Globals.insights.data.sessions.currentTotal) ? '#ff0080' : '#00b0ff';
        } else {
            $.currentSessionCountLbl.color = '#333';
        }

        $.sessionCurrentCountContainer.animate({ opacity:1.0, duration:250 }, function() {
            $.sessionCurrentCountContainer.animate({ opacity:0.0, duration:50 }, function() {
                $.sessionCurrentCountContainer.animate({ opacity:1.0, duration:250 }, function() {
                    $.sessionCurrentCountContainer.animate({ opacity:0.0, duration:50 }, function() {
                        $.sessionCurrentCountContainer.animate({ opacity:1.0, duration:250 }, function() {
                            if (callback) { callback(); }
                        });
                    });
                });
            });
        });
    });
}

function refreshUI(notAnimated, appChanged) {
    var _previousSessionCount = Number($.currentSessionCountLbl.text);

    // first, remove existing blips and then generate new blips 
    // from new data...
    // each method is responsible for knowing whether or not 
    // they should process...
    destroyPreviousBlips(function() {
        if (!notAnimated && !appChanged) { 
            blinkCurrentSessionCount(_previousSessionCount, function() {
                generateCurrentBlips(notAnimated);
            });
        } else {
            updateSessionLbls();
            generateCurrentBlips(notAnimated);
            $.currentSessionCountLbl.color = '#333';
        }
    }, notAnimated);
}

function scale() {
    lib.scaler.sp($.sessionCountContainer, { top:40, height:24 });
    lib.scaler.sp($.sessionCountYesterdayLbl, { font:{ fontSize:21 } });
    lib.scaler.sp($.sessionCountTodayLbl, { font:{ fontSize:21 } });
    lib.scaler.sp($.sessionCurrentCountContainer, { top:40 });
    lib.scaler.sp($.sessionCountContainer01, { width:4 });
    lib.scaler.sp($.currentSessionCountLbl, { font:{ fontSize:50 } });

    lib.scaler.sp($.sessionCountYesterdayDescipLbl, { font:{ fontSize:12 }, height:12 });
    lib.scaler.sp($.sessionCountTodayDescipLbl, { font:{ fontSize:12 }, height:12 });

    lib.scaler.sp($.sessionCountYesterdayDescipBgSpacer, { width:5 });
    lib.scaler.sp($.sessionCountYesterdayDescipLblSpacer, { width:5 });
    lib.scaler.sp($.sessionCountContainerSpacer, { width:10 });
    lib.scaler.sp($.sessionCountTodayLblSpacer, { width:10 });
    lib.scaler.sp($.sessionCountTodayDescipBgSpacer, { width:5 });
    lib.scaler.sp($.sessionCountTodayDescipLblSpacer, { width:5 });
}

function init(config) {
    var _config = config || {};

    scale();

    if (OS_ANDROID) {
        // keep the same aspect ratio always...
        $.map.width = (Alloy.Globals.insights.state.android.xLarge) ? 1280 : 960,
        $.map.height = (Alloy.Globals.insights.state.android.xLarge) ? 800 : 600;

        $.mapContainer.top    = (Alloy.Globals.insights.state.android.xLarge) ? -30 : -50, // use same offset as image is using same aspect ratio across devices...
        $.mapContainer.width  = (Alloy.Globals.insights.state.android.xLarge) ? 1280 : 960,
        $.mapContainer.height = (Alloy.Globals.insights.state.android.xLarge) ? 800 : 600;

        $.activeSessionsContainer.top    = 0,
        $.activeSessionsContainer.width  = (Alloy.Globals.insights.state.android.xLarge) ? 1167 : 875, // 0.75
        $.activeSessionsContainer.height = (Alloy.Globals.insights.state.android.xLarge) ? 1000 : 750; // 0.75

        // $.activeSessionsContainer.backgroundColor = '#f00';
        // $.activeSessionsContainer.opacity = 0.6;
    }

    globalData = Alloy.Globals.insights.data;

    state.callbacks.notifyOrbsVisibility = _config.callbacks.notifyOrbsVisibility;

    $.currentSessionCountLbl.text = lib.number.withCommas(globalData.sessions.currentTotal);
    $.sessionCountYesterdayLbl.text = lib.number.withCommas(globalData.sessions.yesterday) + ' /'
    $.sessionCountTodayLbl.text = lib.number.withCommas(globalData.sessions.today);

    $.mapScrollView.addEventListener('singletap', processSingleTap);
    
    // #ATEMP
    // $.mapScrollView.addEventListener('doubletap', processDoubleTap);
    // $.mapScrollView.addEventListener('scroll', processScroll);
    // $.mapScrollView.addEventListener('scrollend', processScrollEnd);
    // #FIX: it would be nice to have (maybe in scroll event) that returns zoomScale as it's changing
    // contentOFfset will have to do, but it complicated processing
    // $.mapScrollView.addEventListener('scale', processScale);

    $.sessionCountContainer.addEventListener('click', toggleExpandedSessionCount);
    $.sessionCurrentCountContainer.addEventListener('click', toggleExpandedSessionCount);

    // #ATEMP
    // returnMapToCenter(false);

    refreshUI(false, true);
}

exports._getParentView              = getParentView,
exports._getActiveSessionsView      = getActiveSessionsView,
exports._getSessionCurrentCountView = getSessionCurrentCountView, // #DEMO
exports._refreshUI                  = refreshUI,
exports._processEvents              = processEvents,
exports._init                       = init;