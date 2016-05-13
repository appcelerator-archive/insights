var globalData = null;

var lib = {
    number: require('client/number')(),
    events: require('client/events')()
};

var overview = {
    categories: {
        acquisition: {
            label: 'Acquisition',
            color: ''
        },
        engagement: {
            label: 'Engagement',
            color: ''
        },
        quality: {
            label: 'Quality',
            color: ''
        },
        retention: {
            label: 'Retention',
            color: ''
        }
    }
};

var ui = require('ti.insights');

var state = {
    transitioning: false,
    currentCategory: 'acquisition', // default
    orbsAnimating: false,
    showing: true,
    expanded: false,
    expandedFull: false,
    currentOrb: null,
    orbs: {
        acquisition: null,
        engagement: null,
        quality: null,
        retention: null
    },
    callbacks: {
        notifyMap: null,
        notifyDetail: null
    }
};

var data = {
    // installs
    acquisition: {
        lastWeek: null,
        thisWeek: null
    },
    // Avg Session Length (time)
    engagement: {
        lastWeek: null,
        thisWeek: null
    },
    // avg crashes per session
    quality: {
        lastWeek: null,
        thisWeek: null
    },
    retention: {
        // (current ud / current installs) / previous ud
        lastWeek: null,
        thisWeek: null
    }
};

function updateData() {
    globalData = Alloy.Globals.insights.data;

    data = {
        // installs
        acquisition: {
            lastWeek: globalData.categories.acquisition.lastWeek,
            thisWeek: globalData.categories.acquisition.thisWeek
        },
        // Avg Session Length (time)
        engagement: {
            lastWeek: globalData.categories.engagement.lastWeek,
            thisWeek: globalData.categories.engagement.thisWeek
        },
        // avg crashes per session
        quality: {
            lastWeek: globalData.categories.quality.lastWeek,
            thisWeek: globalData.categories.quality.thisWeek
        },
        retention: {
            // (current ud / current installs) / previous ud
            lastWeek: globalData.categories.retention.lastWeek,
            thisWeek: globalData.categories.retention.thisWeek
        }
    };
}

function getOrbView() {
    return $.orbContainer;
}

function getWash() {
    return $.wash;
}

function getOverviewView() {
    return $.overviewContainer;
}

function getPercentForAcquisition() {
    var _percent = null;

    // if both are same, no growth or if last week is null or 0 and this week is >= 0, no growth or if both are null, no growth
    if ((data.acquisition.lastWeek === data.acquisition.thisWeek) || (!data.acquisition.lastWeek && data.acquisition.thisWeek >= 0) || (data.acquisition.lastWeek === null && data.acquisition.thisWeek === null)) {
        _percent = null;
    } else if (data.acquisition.lastWeek < data.acquisition.thisWeek) {
        // we should not encounter a division by zero, based on previous condition...
        _percent = (((data.acquisition.thisWeek - data.acquisition.lastWeek)) / data.acquisition.lastWeek) * 100;
    } else if (data.acquisition.lastWeek > data.acquisition.thisWeek) {
        if (data.acquisition.thisWeek !== 0) {
            _percent = (((data.acquisition.lastWeek - data.acquisition.thisWeek)) / data.acquisition.thisWeek) * -100;
        } else {
            _percent = -100;
        }
    }

    return _percent;
}

function getResultsForAcquisition() {
    var _finalPercent = null;

    var _lastWeek = lib.number.withCommas(data.acquisition.lastWeek) || '--',
        _thisWeek = lib.number.withCommas(data.acquisition.thisWeek) || '--',
        _percent  = getPercentForAcquisition(),
        _barWidth = (data.acquisition.thisWeek / (data.acquisition.lastWeek + data.acquisition.thisWeek)) * $.barContainer.width,
        _increase = (data.acquisition.lastWeek === null || data.acquisition.thisWeek === null) ? null : data.acquisition.lastWeek < data.acquisition.thisWeek || null,
        _decrease = (data.acquisition.lastWeek === null || data.acquisition.thisWeek === null) ? null : data.acquisition.lastWeek > data.acquisition.thisWeek || null

    if (_percent === null) {
        _finalPercent = '--';
    } else if ((_percent | 0) === 0) {
        _finalPercent = (_percent | 0) + '%';
    } else {
        _finalPercent = ((_increase) ? '+' : '') + (_percent | 0) + '%';
    }

    return {
        lastWeek: _lastWeek,
        thisWeek: _thisWeek,
        increase: _increase,
        decrease: _decrease,
        percentAsInt: (_percent === null) ? null : _percent | 0,
        percent: (_finalPercent === '0%') ? '--' : _finalPercent,
        barWidth: ((_barWidth | 0) === 0) ? 1 : (_barWidth | 0)
    };
}

function getPercentForEngagement() {
    var _percent = null;

    // if both are same, no growth or if last week is null or 0 and this week is >= 0, no growth or if both are null, no growth
    if ((data.engagement.lastWeek === data.engagement.thisWeek) || (!data.engagement.lastWeek && data.engagement.thisWeek >= 0) || (data.engagement.lastWeek === null && data.engagement.thisWeek === null)) {
        _percent = null;
    } else if (data.engagement.lastWeek < data.engagement.thisWeek) {
        // we should not encounter a division by zero, based on previous condition...
        _percent = (((data.engagement.thisWeek - data.engagement.lastWeek)) / data.engagement.lastWeek) * 100;
    } else if (data.engagement.lastWeek > data.engagement.thisWeek) {
        if (data.engagement.thisWeek !== 0) {
            _percent = (((data.engagement.lastWeek - data.engagement.thisWeek)) / data.engagement.thisWeek) * -100;
        } else {
            _percent = -100;
        }
    }

    return _percent;
}

// TODO: refactor these methods to reduce processing and repetition
function getResultsForEngagement() {
    var _finalPercent = null;

    var _lastWeek = lib.number.msecToTime(data.engagement.lastWeek) || '--',
        _thisWeek = lib.number.msecToTime(data.engagement.thisWeek) || '--',
        _percent  = getPercentForEngagement(),
        _barWidth = (data.engagement.thisWeek / (data.engagement.lastWeek + data.engagement.thisWeek)) * $.barContainer.width,
        _increase = (data.engagement.lastWeek === null || data.engagement.thisWeek === null) ? null : data.engagement.lastWeek < data.engagement.thisWeek || null,
        _decrease = (data.engagement.lastWeek === null || data.engagement.thisWeek === null) ? null : data.engagement.lastWeek > data.engagement.thisWeek || null

    if (_percent === null) {
        _finalPercent = '--';
    } else if ((_percent | 0) === 0) {
        _finalPercent = (_percent | 0) + '%';
    } else {
        _finalPercent = ((_increase) ? '+' : '') + (_percent | 0) + '%';
    }

    return {
        lastWeek: _lastWeek,
        thisWeek: _thisWeek,
        increase: _increase,
        decrease: _decrease,
        percentAsInt: (_percent === null) ? null : _percent | 0,
        percent: (_finalPercent === '0%') ? '--' : _finalPercent,
        barWidth: ((_barWidth | 0) === 0) ? 1 : (_barWidth | 0)
    };
}

function getPercentForQuality() {
    var _percent = null;

    // if both are same, no growth or if last week is null or 0 and this week is >= 0, no growth or if both are null, no growth
    if ((data.quality.lastWeek === data.quality.thisWeek) || (!data.quality.lastWeek && data.quality.thisWeek >= 0) || (data.quality.lastWeek === null && data.quality.thisWeek === null)) {
        _percent = null;
    } else if (data.quality.lastWeek < data.quality.thisWeek) {
        // we should not encounter a division by zero, based on previous condition...
        _percent = (((data.quality.thisWeek - data.quality.lastWeek)) / data.quality.lastWeek) * 100;
    } else if (data.quality.lastWeek > data.quality.thisWeek) {
        if (data.quality.thisWeek !== 0) {
            _percent = (((data.quality.lastWeek - data.quality.thisWeek)) / data.quality.thisWeek) * -100;
        } else {
            _percent = -100;
        }
    }

    return _percent;
}

function getResultsForQuality() {
    var _finalPercent = null;

    var _lastWeek = lib.number.msecToTime(data.quality.lastWeek) || '--',
        _thisWeek = lib.number.msecToTime(data.quality.thisWeek) || '--',
        _percent  = getPercentForQuality(),
        _barWidth = (data.quality.thisWeek / (data.quality.lastWeek + data.quality.thisWeek)) * $.barContainer.width,
        _increase = (data.quality.lastWeek === null || data.quality.thisWeek === null) ? null : data.quality.lastWeek < data.quality.thisWeek || null,
        _decrease = (data.quality.lastWeek === null || data.quality.thisWeek === null) ? null : data.quality.lastWeek > data.quality.thisWeek || null;
    
    if (_percent === null) {
        _finalPercent = '--';
    } else if ((_percent | 0) === 0) {
        _finalPercent = (_percent | 0) + '%';
    } else {
        _finalPercent = ((_increase) ? '+' : '') + (_percent | 0) + '%';
    }
    
    return {
        lastWeek: _lastWeek,
        thisWeek: _thisWeek,
        increase: _increase,
        decrease: _decrease,
        percentAsInt: ((data.quality.lastWeek === null && !data.quality.thisWeek === null) || _percent === null) ? null : _percent | 0,
        percent: (_finalPercent === '0%') ? '--' : _finalPercent,
        barWidth: ((_barWidth | 0) === 0) ? 1 : (_barWidth | 0)
    };
}

function getPercentForRetention() {
    var _percent = 0;

    // if both are same, no growth or if last week is null or 0 and this week is >= 0, no growth or if both are null, no growth
    if ((data.retention.lastWeek === data.retention.thisWeek) || (!data.retention.lastWeek && data.retention.thisWeek >= 0) || (data.retention.lastWeek === null && data.retention.thisWeek === null)) {
        _percent = null;
    } else if (data.retention.lastWeek < data.retention.thisWeek) {
        // we should not encounter a division by zero, based on previous condition...
        _percent = (((data.retention.thisWeek - data.retention.lastWeek)) / data.retention.lastWeek) * 100;
    } else if (data.retention.lastWeek > data.retention.thisWeek) {
        if (data.retention.thisWeek !== 0) {
            _percent = (((data.retention.lastWeek - data.retention.thisWeek)) / data.retention.thisWeek) * -100;
        } else {
            _percent = -100;
        }
    }

    return _percent;
}

function getResultsForRetention() {
    var _finalPercent = null;

    var _lastWeek = (data.retention.lastWeek === null) ? '--' : (data.retention.lastWeek % 1 === 0) ? data.retention.lastWeek + '%' : data.retention.lastWeek.toFixed(2) + '%',
        _thisWeek = (data.retention.thisWeek === null) ? '--' : (data.retention.thisWeek % 1 === 0) ? data.retention.thisWeek + '%' : data.retention.thisWeek.toFixed(2) + '%',
        _percent  = getPercentForRetention(),
        _barWidth = (data.retention.thisWeek / (data.retention.lastWeek + data.retention.thisWeek)) * $.barContainer.width,
        _increase = (data.retention.lastWeek === null || data.retention.thisWeek === null) ? null : data.retention.lastWeek < data.retention.thisWeek || null,
        _decrease = (data.retention.lastWeek === null || data.retention.thisWeek === null) ? null : data.retention.lastWeek > data.retention.thisWeek || null;
    
    if (_percent === null) {
        _finalPercent = '--';
    } else if ((_percent | 0) === 0) {
        _finalPercent = (_percent | 0) + '%';
    } else {
        _finalPercent = ((_increase) ? '+' : '') + (_percent | 0) + '%';
    }

    return {
        lastWeek: _lastWeek,
        thisWeek: _thisWeek,
        increase: _increase,
        decrease: _decrease,
        percentAsInt: ((data.retention.lastWeek === null && data.retention.thisWeek === null) || _percent === null) ? null : _percent | 0,
        percent: (_finalPercent === '0%') ? '--' : _finalPercent,
        barWidth: ((_barWidth | 0) === 0) ? 1 : (_barWidth | 0)
    };
}

// #TODO: convert to widget
// color, name, assetBase, rect
function createOrb(config) {
    var _config = config || {},
        _orb    = {
            state: {
                increase: _config.increase,
                decrease: _config.decrease,
                assetBase: _config.assetBase,
                percent: (_config.percent === null) ? null : _config.percent | 0
            }
        };

    var _orbitView = null;

    var _assetViews = {
        icon: {
            container: Ti.UI.createView({ touchEnabled:false, width:25, height:25, bottom:80 }),
            active: Ti.UI.createView({ opacity:0.0, width:25, height:25, backgroundImage:'overview/' + _config.assetBase + '-icon-active.png' }),
            inactive: Ti.UI.createView({ opacity:1.0, width:25, height:25, backgroundImage:'overview/' + _config.assetBase + '-icon.png' })
        },
        touchOutline: Ti.UI.createView({ touchEnabled:false, opacity:0.0, width:88, height:88, backgroundImage:'overview/' + _config.assetBase + '-touch-outline.png' })
     };

     var _colors = {
        increase: '#00b0ff',
        decrease: '#ff0080',
        zero: '#ccc'
     };

     var _performanceLabel = Ti.UI.createLabel({
        font: {
            fontFamily: "TitilliumText22L-1wt",
            fontSize: 30
        },
        color: (_orb.state.increase === null && _orb.state.decrease === null) ? '#ccc' : (_orb.state.increase) ? _colors.increase : _colors.decrease,
        top: 88,
        width: 68,
        height: 30,
        textAlign: 'center',
        touchEnabled: false,
        minimumFontSize: 20
     });

     switch (_config.assetBase) {
        case 'engagement':
        case 'quality':
            _performanceLabel.text = lib.number.msecToTime(globalData.categories[_config.assetBase].thisWeek) || '--';
            break;
        case 'retention':
            _performanceLabel.text = (globalData.categories[_config.assetBase].thisWeek === null) ? '--' : (globalData.categories[_config.assetBase].thisWeek % 1 === 0) ? globalData.categories[_config.assetBase].thisWeek + '%' : globalData.categories[_config.assetBase].thisWeek.toFixed(2) + '%';
            break;
        default: 
            _performanceLabel.text = (globalData.categories[_config.assetBase].thisWeek === 0) ? '0' : lib.number.abbr(globalData.categories[_config.assetBase].thisWeek, 1) || '--';
            break;
     }

    _orb.id    = _config.name.toLowerCase();
    _orb.name = _config.name;

    _orb.controllers = {
        update: function(config) {
            var _config = config || {};

            _orb.state.increase = _config.increase,
            _orb.state.decrease = _config.decrease,
            _orb.state.percent  = _config.percent | 0;

            switch (_orb.state.assetBase) {
                case 'engagement':
                case 'quality':
                    _performanceLabel.text = lib.number.msecToTime(globalData.categories[_orb.state.assetBase].thisWeek) || '--';
                    break;
                case 'retention':
                    _performanceLabel.text = (globalData.categories[_orb.state.assetBase].thisWeek === null) ? '--' : (globalData.categories[_orb.state.assetBase].thisWeek % 1 === 0) ? globalData.categories[_orb.state.assetBase].thisWeek + '%' : globalData.categories[_orb.state.assetBase].thisWeek.toFixed(2) + '%';
                    break;
                default:
                    _performanceLabel.text = (globalData.categories[_orb.state.assetBase].thisWeek === 0) ? '0' : lib.number.abbr(globalData.categories[_orb.state.assetBase].thisWeek, 1) || '--';
                    break;
             }

            if (!state.expanded) {
                _performanceLabel.color = (_orb.state.increase === null && _orb.state.decrease === null) ? '#ccc' : (_orb.state.increase) ? _colors.increase : _colors.decrease;
            }
            
            _orbitView.percent = (_orb.state.increase === null && _orb.state.decrease === null) ? 0 : _orb.state.percent;
        },
        showColor: function(animate) {
            if (animate) {
                _performanceLabel.animate({ opacity:1.0, color:(_orb.state.increase === null && _orb.state.decrease === null) ? _colors.zero : (_orb.state.increase) ? _colors.increase : _colors.decrease, duration:250 });
            } else {
                _performanceLabel.color = (_orb.state.increase === null && _orb.state.decrease === null) ? _colors.zero : (_orb.state.increase) ? _colors.increase : _colors.decrease;
            }

            _orbitView.showColor();
        },
        showGray: function() {
            _performanceLabel.animate({ opacity:1.0, color:'#ccc', duration:250 });
            _orbitView.showGray();
        },
        setActive: function(callback) {
            _performanceLabel.animate({ opacity:0.0, duration:250 });
            _assetViews.icon.container.animate({ bottom:99, duration:250 });
            _assetViews.icon.active.animate({ opacity:1.0, duration:250 });
            _assetViews.icon.inactive.animate({ opacity:0.0, duration:250 }, function() {
                if (callback) { callback(); }

                state.transitioning = false;

                if (state.expanded) {
                    _orb.controllers.showColor(false);
                } else {
                    _orb.controllers.showColor(true);
                }
            });            
        },
        setInactive: function(callback) {
            _assetViews.icon.container.animate({ bottom:80, duration:250 });
            _assetViews.icon.active.animate({ opacity:0.0, duration:250 });
            _assetViews.icon.inactive.animate({ opacity:1.0, duration:250 }, function() {
                if (callback) { callback(); }

                state.transitioning = false;

                // we don't want to show gray when collapsing
                if (state.expanded) {
                    _orb.controllers.showGray();
                } else {
                    _performanceLabel.animate({ opacity:1.0, color:(_orb.state.increase === null && _orb.state.decrease === null) ? _colors.zero : (_orb.state.increase) ? _colors.increase : _colors.decrease, duration:250 });
                }
            });            
        },
        enableRaster: function() {
            _orbitView.enableRaster();
        },
        disableRaster: function() {
            _orbitView.disableRaster();
        },
        destroy: function() {
            _orbitView = null;
            _orb.parent = null;
            _orb = null;
        }
    };

    Ti.API.info('----------ORB STATE: ');
    Ti.API.info(_orb.state);

    _orb.parentView = Ti.UI.createView({ id:_config.name.toLowerCase(), width:_config.rect.width, height:_config.rect.height, left:_config.rect.left, top:_config.rect.top });
    _orbitView = ui.createOrbView({ percent:(_orb.state.increase === null && _orb.state.decrease === null) ? 0 : _orb.state.percent, width:Ti.UI.FILL, height:Ti.UI.FILL, touchEnabled:false });

    _orb.parentView.addEventListener('click', _config.events.onClick);

    _orb.parentView.addEventListener('touchstart', function() {
        var matrix = Ti.UI.create2DMatrix({ scale:0.9 });

        _orb.parentView.animate({ transform:matrix, duration:250 });
    });
    
    _orb.parentView.addEventListener('touchend', function() {
        var matrix = Ti.UI.create2DMatrix({ scale:1.0 });

        _orb.parentView.animate({ transform:matrix, duration:250 });
    });

    _assetViews.icon.container.add(_assetViews.icon.active);
    _assetViews.icon.container.add(_assetViews.icon.inactive);

    _orb.parentView.add(_orbitView);
    _orb.parentView.add(_assetViews.icon.container);
    _orb.parentView.add(_performanceLabel);

    _orb.parentView.add(_assetViews.touchOutline);

    return _orb;
}

function showOverviewTipSet() {
    Alloy.Globals.insights.controllers.tips._showTips('metricCategoryOverview');
}

function expandOverview(toDetail) {
    if (!toDetail) {
        Alloy.Globals.insights.controllers.setContext('catOverview');

        state.expanded = true;

        for (var orb in state.orbs) {
            if (state.currentOrb.id === state.orbs[orb].id) {
                state.currentOrb.controllers.showColor();
            } else {
                state.orbs[orb].controllers.showGray();
            }
        }

        state.callbacks.notifyMap({ onMapHide:true });

        $.wash.animate({ opacity:1.0, duration:250 });
        $.orbContainer.animate({ curve:Ti.UI.ANIMATION_CURVE_EASE_IN, center:{x:0, y:(Ti.Platform.displayCaps.platformHeight / 2) - 4}, duration:150 }, function() {
            $.orbContainer.animate({ center:{x:0, y:Ti.Platform.displayCaps.platformHeight / 2}, duration:100 });
        });
        
        // tips shown when cat overview is seen
        $.overviewContainer.animate({ bottom:0, duration:500 }, Alloy.Globals.insights.controllers.tips._showTipsForContext);
    } else {
        state.expandedFull = true;
        $.orbContainer.animate({ opacity:0.0, center:{x:0, y:$.orbContainer.height / 2}, duration:500 });
        state.callbacks.notifyMap({ onShowDetail:true });
    }
}

function collapseOverview(fromDetail) {
    if (!fromDetail) {
        Alloy.Globals.insights.controllers.setContext('map');

        state.expanded = false;

        for (var orb in state.orbs) {
            if (state.currentOrb.id !== state.orbs[orb].id) {
                state.orbs[orb].controllers.showColor(true);
            }
        }

        state.callbacks.notifyMap({ onMapShow:true });

        $.wash.animate({ opacity:0.0, duration:250 });
        $.orbContainer.animate({ curve:Ti.UI.ANIMATION_CURVE_EASE_IN, center:{x:0, y:641}, duration:150 }, function() {
            $.orbContainer.animate({ center:{x:0, y:637}, duration:100 });
        });

        // show tips when category is collapsed and viewing map
        $.overviewContainer.animate({ bottom:-180, duration:250 }, Alloy.Globals.insights.controllers.tips._showTipsForContext);
    } else {
        state.expandedFull = false;

        Alloy.Globals.insights.controllers.setContext('catOverview');
        Alloy.Globals.insights.controllers.tips._showTipsForContext();

        $.orbContainer.animate({ opacity:1.0, curve:Ti.UI.ANIMATION_CURVE_EASE_IN, center:{x:0, y:(Ti.Platform.displayCaps.platformHeight / 2) + 4}, duration:150 }, function() {
            $.orbContainer.animate({ center:{x:0, y:Ti.Platform.displayCaps.platformHeight / 2}, duration:100 });
        });
        state.callbacks.notifyMap({ onHideDetail:true });
    }
}

function updateValuesUI(animate) {
    var _data = null;

    $.catMetricBg.backgroundImage = 'overview/' + state.currentOrb.id + '-metric-bg.png';
    $.catIcon.backgroundImage = 'overview/' + state.currentOrb.id + '-icon-bordered.png';
    $.catLbl.text = state.currentOrb.name;

    switch (state.currentOrb.id) {
        case state.orbs.acquisition.id:
            _data = getResultsForAcquisition();

            $.catMetricLbl.text = 'Installs';
            $.catMetricLblRange.color = '#b7ff52';

            $.lastWeekLbl.text = _data.lastWeek;
            $.thisWeekLbl.text = _data.thisWeek;
            break;
        case state.orbs.engagement.id:
            _data = getResultsForEngagement();

            $.catMetricLbl.text = 'Avg Session Length';
            $.catMetricLblRange.color = '#ffd200';

            $.lastWeekLbl.text = _data.lastWeek;
            $.thisWeekLbl.text = _data.thisWeek;
            break;
        case state.orbs.quality.id:
            _data = getResultsForQuality();

            $.catMetricLbl.text = 'Crash Frequency';
            $.catMetricLblRange.color = '#009bff';

            $.lastWeekLbl.text = _data.lastWeek;
            $.thisWeekLbl.text = _data.thisWeek;
            break;
        case state.orbs.retention.id:
            _data = getResultsForRetention();

            $.catMetricLbl.text = 'Retention Rate';
            $.catMetricLblRange.color = '#ff4ca7';

            $.lastWeekLbl.text = _data.lastWeek;
            $.thisWeekLbl.text = _data.thisWeek;
            break;
        default: break;
    }

    if (_data.increase === null && _data.decrease === null) {
        $.thisWeekPercentLbl.color = '#b2b2b2';
    } else {
        $.thisWeekPercentLbl.color = (_data.increase) ? '#00b0ff' : '#ff0080';
        $.thisWeekBar.backgroundColor = (_data.increase) ? '#00b0ff' : '#ff0080';
        $.thisWeekBarBlip.backgroundImage = (_data.increase) ? 'overview/bar-indicator-increase.png' : 'overview/bar-indicator-decrease.png';
    }
    
    // #APPTS-3608: if percent as int is null or 0, render n/a...
    $.thisWeekPercentLbl.text = (_data.increase === null && _data.decrease === null) ? '--' : _data.percent;

    // #TODO: staticThisWeekLbl is a terrible name...
    if (animate) {
        // we also check for null (division by zero)...
        if (_data.increase === null && _data.decrease === null) {
            $.staticThisWeekLblIncrease.animate({ opacity:0.0, duration:250 });
            $.staticThisWeekLblDecrease.animate({ opacity:0.0, duration:250 });
            $.staticThisWeekLbl.animate({ opacity:1.0, duration:250 });

            $.thisWeekBarContainer.animate({ width:1, opacity:0.0, duration:250 }, function() {
                $.thisWeekBarContainer.width = 1;
            });
        } else {
            if (_data.increase) {
                $.staticThisWeekLblIncrease.animate({ opacity:1.0, duration:250 });
                $.staticThisWeekLblDecrease.animate({ opacity:0.0, duration:250 });
                $.staticThisWeekLbl.animate({ opacity:0.0, duration:250 });
            } else {
                $.staticThisWeekLblIncrease.animate({ opacity:0.0, duration:250 });
                $.staticThisWeekLblDecrease.animate({ opacity:1.0, duration:250 });
                $.staticThisWeekLbl.animate({ opacity:0.0, duration:250 });
            }

            $.thisWeekBarContainer.animate({ curve:Ti.UI.ANIMATION_CURVE_EASE_IN, width:($.thisWeekBarContainer.width < _data.barWidth) ? _data.barWidth + 2 : _data.barWidth - 2, opacity:1.0, duration:150 }, function() {
                $.thisWeekBarContainer.animate({ width:_data.barWidth, duration:100 }, function() {
                    $.thisWeekBarContainer.width = _data.barWidth;
                });
            });
        }
    } else {
        // we also check for null (division by zero)...
        if (_data.increase === null && _data.decrease === null) {
            $.staticThisWeekLblIncrease.opacity = 0.0;
            $.staticThisWeekLblDecrease.opacity = 0.0;
            $.staticThisWeekLbl.opacity = 1.0;

            $.thisWeekBarContainer.opacity = 0.0;
            $.thisWeekBarContainer.width = 1;
        } else {
            if (_data.increase) {
                $.staticThisWeekLblIncrease.opacity = 1.0;
                $.staticThisWeekLblDecrease.opacity = 0.0;
                $.staticThisWeekLbl.opacity = 0.0;
            } else {
                $.staticThisWeekLblIncrease.opacity = 0.0;
                $.staticThisWeekLblDecrease.opacity = 1.0;
                $.staticThisWeekLbl.opacity = 0.0;
            }
            
            $.thisWeekBarContainer.opacity = 1.0;
            $.thisWeekBarContainer.width = _data.barWidth;
        }        
    }
}

function updateOverviewUI(animate) {
    var _data = null;

    if (animate) {
        $.lastWeekLbl.animate({ left:20, opacity:0.0, duration:250 });
        $.thisWeekLbl.animate({ right:20, opacity:0.0, duration:250 });
        $.thisWeekPercentLbl.animate({ opacity:0.0, duration:250 });

        $.categoryHeaderContainer.animate({ opacity:0.0, bottom:20, duration:250 }, function() {
            updateValuesUI(true);
            
            $.categoryHeaderContainer.animate({ curve:Ti.UI.ANIMATION_CURVE_EASE_IN, opacity:1.0, bottom:42, duration:150}, function() {
                $.categoryHeaderContainer.animate({ bottom:40, duration:100 });
            });

            $.lastWeekLbl.animate({ curve:Ti.UI.ANIMATION_CURVE_EASE_IN, left:42, opacity:1.0, duration:150 }, function() {
                $.lastWeekLbl.animate({ left:40, duration:100 });
            });

            $.thisWeekLbl.animate({ curve:Ti.UI.ANIMATION_CURVE_EASE_IN, right:42, opacity:1.0, duration:150 }, function() {
                $.thisWeekLbl.animate({ right:40, duration:100 });
            });

            $.thisWeekPercentLbl.animate({ opacity:1.0, duration:250 });
        });
    } else {
        updateValuesUI(false);
    }
}

// did the user change cetegory from home or detail?
// if the user is going from overview to detail, use fromOverview
function processAnalyticsEvents(fromDetail, fromOverview) {
    switch (state.currentCategory) {
        case 'acquisition':
            if (fromDetail) {
                lib.events.fireEvent(lib.events.EVT.DETAIL.ACQUISITION);
            } else if (fromOverview) {
                lib.events.fireEvent(lib.events.EVT.OVERVIEW.ACQUISITION);
            } else {
                lib.events.fireEvent(lib.events.EVT.HOME.ACQUISITION);
            }

            break;
        case 'engagement':
            if (fromDetail) {
                lib.events.fireEvent(lib.events.EVT.DETAIL.ENGAGEMENT);
            } else if (fromOverview) {
                lib.events.fireEvent(lib.events.EVT.OVERVIEW.ENGAGEMENT);
            } else {
                lib.events.fireEvent(lib.events.EVT.HOME.ENGAGEMENT);
            }

            break;
        case 'retention':
            if (fromDetail) {
                lib.events.fireEvent(lib.events.EVT.DETAIL.RETENTION);
            } else if (fromOverview) {
                lib.events.fireEvent(lib.events.EVT.OVERVIEW.RETENTION);
            } else {
                lib.events.fireEvent(lib.events.EVT.HOME.RETENTION);
            }
            
            break;
        case 'quality':
            if (fromDetail) {
                lib.events.fireEvent(lib.events.EVT.DETAIL.QUALITY);
            } else if (fromOverview) {
                lib.events.fireEvent(lib.events.EVT.OVERVIEW.QUALITY);
            } else {
                lib.events.fireEvent(lib.events.EVT.HOME.QUALITY);
            }

            break;
        default: break;
    }
}

function processOrbClick(e) {
    // if we're making a selection of orb when overview is expanded, but not fully expanded, meaning 
    // detail context is currently showing...
    if (!state.transitioning) {
        state.transitioning = true;

        if (state.expanded && !state.expandedFull) {
            if (state.currentOrb.id !== e.source.id) {
                state.currentCategory = e.source.id;

                state.callbacks.notifyDetail({ update:true, category:e.source.id, type:'standard' });
                state.currentOrb.controllers.setInactive();
                state.currentOrb = state.orbs[e.source.id];

                // lib.events.fireEvent(lib.events.EVT.HOME.APPSELECTOR);
                state.currentOrb.controllers.setActive();
               
                updateOverviewUI(true);
            } else {
                state.currentOrb.controllers.setInactive(collapseOverview);
            }

            processAnalyticsEvents(); // this will fire an anylitics event for the currently selected category
        } else {            
            // when the overview is fully collapsed, but orbs are visible...
            if (state.currentOrb.id !== e.source.id) {
                state.currentCategory = e.source.id;

                state.currentOrb.controllers.setInactive();
                state.currentOrb = state.orbs[e.source.id];

                updateOverviewUI(false);

                if (!state.expandedFull) {
                    setActiveAndExpandOverview(); // exposed method
                } else {
                    state.currentOrb.controllers.setActive();
                }
            } else {
                if (!state.expandedFull) {
                    state.currentOrb.controllers.setActive(expandOverview);
                } else {
                    state.currentOrb.controllers.setActive();
                }
            }

            // #TODO: may need to check e.fromUpdate to see if this came from the detail context and filter...
            if (e.source.fromUpdate) {
                processAnalyticsEvents(true);
            } else {
                processAnalyticsEvents(); // this will fire an anylitics event for the currently selected category
            }
        }
    }
}

function isOrb(id) {
    return id === state.orbs.acquisition.id || id === state.orbs.engagement.id || id === state.orbs.quality.id || id === state.orbs.retention.id;
}

// This has been separated for exposure
function setActiveAndExpandOverview() {
    state.currentOrb.controllers.setActive(expandOverview);
    state.callbacks.notifyDetail({ update:true, category:state.currentCategory, type:'standard' });
}

function processSwipe(e) {
    var _direction = e.direction;

    if (_direction === 'up') {
        if (!state.expanded) {
            if (isOrb(e.source.id)) {
                processOrbClick(e);
            } else {
                setActiveAndExpandOverview(); // exposed method
                // state.currentOrb.controllers.setActive(expandOverview);
            }
        } else {
            processShowDetailRequest();
        }
    } else if (_direction === 'down' || e.type === 'click') {
        if (state.expanded) {
            state.currentOrb.controllers.setInactive(collapseOverview);
        } else if (state.showing) {
            hideOrbs();
        }
    }
}

function hideOrbs(bounce) {
    if (state.showing && !state.orbsAnimating) {
        state.showing = false;
        state.orbsAnimating = false;

        $.orbContainer.animate({ center:{x:0, y:Ti.Platform.displayCaps.platformHeight + ($.orbContainer.height / 2)}, duration:250 }, function() {
            state.orbsAnimating = false;
        });
    }
}

function showOrbs(bounce) {
    if (!state.showing && !state.orbsAnimating) {
        state.showing = true;
        state.orbsAnimating = true;

        $.orbContainer.animate({ curve:(bounce) ? Ti.UI.ANIMATION_CURVE_EASE_IN : Ti.UI.ANIMATION_CURVE_EASE_OUT, center:{x:0, y:(bounce) ? 633 : 637}, duration:150 }, function() {
            if (bounce) {
                $.orbContainer.animate({ center:{x:0, y:637}, duration:100 }, function() {
                    state.orbsAnimating = false;
                    
                });
            } else {
                state.orbsAnimating = false;
            }
        });
    }
}

function determineVisibility(hide, bounce) {
    // check if we are just toggling
    if (hide === null) {
        if (state.showing) {
            hideOrbs(bounce);
        } else {
            showOrbs(true);
            // showOrbs(bounce); // Since reducing scrollview movement, this probably won't be necessary
        }
    } else {
        if (hide) {
            hideOrbs(bounce);
        } else {
            showOrbs(true);
            // showOrbs(bounce); // Since reducing scrollview movement, this probably won't be necessary
        }
    }
}

function isOrbsVisible() {
    return state.showing;
}

function isOverviewExpanded() {
    return state.expanded;
}

function showOverview() {}

function hideOverview() {}

function processShowDetailRequest() {
    if (state.expanded) {
        processAnalyticsEvents(false, true);
        
        expandOverview(true);
        state.callbacks.notifyDetail({ show:true });
    }
}

function processEvents(type) {
    var _type = type || {};

    if (_type.showFromDetail) {
        collapseOverview(true);
    }

    if (_type.hideFromDetail) {
        expandOverview(true);
    }

    if (_type.update) {
        if (state.currentOrb.id !== _type.category) {
            processOrbClick({ 
                source: {
                    id: _type.category,
                    fromUpdate: true
                }
            });
        }
    }
}

function refreshUI() {    
    updateData();

    state.orbs.acquisition.controllers.update({
        percent: getPercentForAcquisition(),
        increase: (globalData.categories.acquisition.lastWeek === null || globalData.categories.acquisition.thisWeek === null) ? null : globalData.categories.acquisition.lastWeek < globalData.categories.acquisition.thisWeek || null,
        decrease: (globalData.categories.acquisition.lastWeek === null || globalData.categories.acquisition.thisWeek === null) ? null : globalData.categories.acquisition.lastWeek > globalData.categories.acquisition.thisWeek || null
    });

    state.orbs.engagement.controllers.update({
        percent: getPercentForEngagement(),
        increase: (globalData.categories.engagement.lastWeek === null || globalData.categories.engagement.thisWeek === null) ? null : globalData.categories.engagement.lastWeek < globalData.categories.engagement.thisWeek || null,
        decrease: (globalData.categories.engagement.lastWeek === null || globalData.categories.engagement.thisWeek === null) ? null : globalData.categories.engagement.lastWeek > globalData.categories.engagement.thisWeek || null
    });

    state.orbs.quality.controllers.update({
        percent: getPercentForQuality(),
        increase: (globalData.categories.quality.lastWeek === null || globalData.categories.quality.thisWeek === null) ? null : globalData.categories.quality.lastWeek < globalData.categories.quality.thisWeek || null,
        decrease: (globalData.categories.quality.lastWeek === null || globalData.categories.quality.thisWeek === null) ? null : globalData.categories.quality.lastWeek > globalData.categories.quality.thisWeek || null
    });

    state.orbs.retention.controllers.update({
        percent: getPercentForRetention(),
        increase: (globalData.categories.retention.lastWeek === null || globalData.categories.retention.thisWeek === null) ? null : globalData.categories.retention.lastWeek < globalData.categories.retention.thisWeek || null,
        decrease: (globalData.categories.retention.lastWeek === null || globalData.categories.retention.thisWeek === null) ? null : globalData.categories.retention.lastWeek > globalData.categories.retention.thisWeek || null
    });

    updateOverviewUI(state.expanded);
}

function init(config) {
    var _config  = config || {},
        _refresh = false;

    // #TODO: cat overview and orbs should be updated at the same time...
    state.callbacks.notifyDetail = _config.callbacks.notifyDetail;
    state.callbacks.notifyMap = _config.callbacks.notifyMap;

    updateData();

    $.overviewContainer.addEventListener('postlayout', function(e) {
        if (!_refresh) {
            _refresh = true;

            updateOverviewUI(false);
        }
    });

    state.orbs.acquisition = createOrb({
        name: overview.categories.acquisition.label,
        color: overview.categories.acquisition.color,
        assetBase: 'acquisition',
        rect: {
            width:222,
            height:222,
            left: 20,
            top: 0
        },
        events: {
            onClick: processOrbClick
        },
        percent: getPercentForAcquisition(),
        increase: (globalData.categories.acquisition.lastWeek === null || globalData.categories.acquisition.thisWeek === null) ? null : globalData.categories.acquisition.lastWeek < globalData.categories.acquisition.thisWeek || null,
        decrease: (globalData.categories.acquisition.lastWeek === null || globalData.categories.acquisition.thisWeek === null) ? null : globalData.categories.acquisition.lastWeek > globalData.categories.acquisition.thisWeek || null
    });

    state.orbs.engagement = createOrb({
        name: overview.categories.engagement.label,
        color: overview.categories.engagement.color,
        assetBase: 'engagement',
        rect: {
            width:222,
            height:222,
            left: 274,
            top: 0
        },
        events: {
            onClick: processOrbClick
        },
        percent: getPercentForEngagement(),
        increase: (globalData.categories.engagement.lastWeek === null || globalData.categories.engagement.thisWeek === null) ? null : globalData.categories.engagement.lastWeek < globalData.categories.engagement.thisWeek || null,
        decrease: (globalData.categories.engagement.lastWeek === null || globalData.categories.engagement.thisWeek === null) ? null : globalData.categories.engagement.lastWeek > globalData.categories.engagement.thisWeek || null
    });

    state.orbs.quality = createOrb({
        name: overview.categories.quality.label,
        color: overview.categories.quality.color,
        assetBase: 'quality',
        rect: {
            width:222,
            height:222,
            left: 782,
            top: 0
        },
        events: {
            onClick: processOrbClick
        },
        percent: getPercentForQuality(),
        increase: (globalData.categories.quality.lastWeek === null || globalData.categories.quality.thisWeek === null) ? null : globalData.categories.quality.lastWeek < globalData.categories.quality.thisWeek || null,
        decrease: (globalData.categories.quality.lastWeek === null || globalData.categories.quality.thisWeek === null) ? null : globalData.categories.quality.lastWeek > globalData.categories.quality.thisWeek || null
    });

    state.orbs.retention = createOrb({
        name: overview.categories.retention.label,
        color: overview.categories.retention.color,
        assetBase: 'retention',
        rect: {
            width:222,
            height:222,
            left: 528,
            top: 0
        },
        events: {
            onClick: processOrbClick
        },
        percent: getPercentForRetention(),
        increase: (globalData.categories.retention.lastWeek === null || globalData.categories.retention.thisWeek === null) ? null : globalData.categories.retention.lastWeek < globalData.categories.retention.thisWeek || null,
        decrease: (globalData.categories.retention.lastWeek === null || globalData.categories.retention.thisWeek === null) ? null : globalData.categories.retention.lastWeek > globalData.categories.retention.thisWeek || null
    });

    $.orbContainer.add(state.orbs.acquisition.parentView);
    $.orbContainer.add(state.orbs.engagement.parentView);
    $.orbContainer.add(state.orbs.quality.parentView);
    $.orbContainer.add(state.orbs.retention.parentView);

    // allow raster when not updating - because these are within a parent view,
    // we only need to disable raster when changing the orb percent value
    state.orbs.retention.controllers.enableRaster();
    state.orbs.acquisition.controllers.enableRaster();
    state.orbs.engagement.controllers.enableRaster();
    state.orbs.quality.controllers.enableRaster();

    $.wash.addEventListener('click', processSwipe);
    $.wash.addEventListener('swipe', processSwipe);
    $.orbContainer.addEventListener('swipe', processSwipe);
    $.overviewContainer.addEventListener('swipe', processSwipe);

    $.categoryHeaderContainer.addEventListener('click', processShowDetailRequest);

    // this is the default
    state.currentOrb = state.orbs.acquisition;
}

exports._init                     = init,
exports._getWash                  = getWash,
exports._getOrbView               = getOrbView,
exports._getOverviewView          = getOverviewView,
exports._hideOrbs                 = hideOrbs,
exports._showOrbs                 = showOrbs,
exports._isOrbsVisible            = isOrbsVisible,
exports._isOverviewExpanded       = isOverviewExpanded,
exports._collapseOverview         = collapseOverview,
exports._processSwipe             = processSwipe,
exports._processShowDetailRequest = processShowDetailRequest,
exports._expandOverview           = setActiveAndExpandOverview,
exports._processEvents            = processEvents,
exports._refreshUI                = refreshUI,
exports._showOverviewTipSet       = showOverviewTipSet,
exports._determineVisibility      = determineVisibility;