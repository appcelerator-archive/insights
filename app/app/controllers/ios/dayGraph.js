var globalData = null;

var lib = {
    number: require('client/number')()
};

var dayGraph = {
    bars: {
        vert: {
            offset: 56,
            total: 7,
            height: 348
        }
    },
    colors: {
        acquisition: {
            base: '#8dc63f'
        },
        engagement: {
            base: '#f7941d'
        },
        quality: {
            base: '#0072bc'
        },
        retention: {
            base: '#942c61'
        }
    }
};

var state = {
    selected: {
        category: 'acquisition',
        metric: 'installs',
        day: null,
        bar: false
    },
    init: false,
    callout: {
        showing: false
    },
    callbacks: {
        notifyDetail: null
    }
};

// see updateData
var data = {};

function getParentView() {
    return $.parentView;
}

function updateData() {
    globalData = Alloy.Globals.insights.data;

    data = {
        dayGraph: {
            acquisition: {
                metrics: {
                    installs: {
                        name: globalData.categories.acquisition.metrics.installs.name,
                        total: lib.number.getSum(globalData.categories.acquisition.metrics.installs.weekByDays),
                        last7Days: globalData.categories.acquisition.metrics.installs.last7Days,
                        median: lib.number.getMedian(globalData.categories.acquisition.metrics.installs.weekByDays),
                        avg: lib.number.getAvg(globalData.categories.acquisition.metrics.installs.weekByDays),
                        daily: globalData.categories.acquisition.metrics.installs.weekByDays,
                        floorCeil: lib.number.getFloorCeil(globalData.categories.acquisition.metrics.installs.weekByDays)
                    },
                    pushDevices: {
                        name: globalData.categories.acquisition.metrics.pushDevices.name,
                        total: lib.number.getSum(globalData.categories.acquisition.metrics.pushDevices.weekByDays),
                        last7Days: globalData.categories.acquisition.metrics.pushDevices.last7Days,
                        change: [globalData.categories.acquisition.metrics.pushDevices.weekByDays[0], globalData.categories.acquisition.metrics.pushDevices.weekByDays[6]],
                        median: lib.number.getMedian(globalData.categories.acquisition.metrics.pushDevices.weekByDays),
                        avg: lib.number.getAvg(globalData.categories.acquisition.metrics.pushDevices.weekByDays),
                        daily: globalData.categories.acquisition.metrics.pushDevices.weekByDays,
                        floorCeil: lib.number.getFloorCeil(globalData.categories.acquisition.metrics.pushDevices.weekByDays)
                    }
                }
            },
            engagement: {
                metrics: {
                    sessions: {
                        name: globalData.categories.engagement.metrics.sessions.name,
                        total: lib.number.getSum(globalData.categories.engagement.metrics.sessions.weekByDays),
                        last7Days: globalData.categories.engagement.metrics.sessions.last7Days,
                        median: lib.number.getMedian(globalData.categories.engagement.metrics.sessions.weekByDays),
                        avg: lib.number.getAvg(globalData.categories.engagement.metrics.sessions.weekByDays),
                        daily: globalData.categories.engagement.metrics.sessions.weekByDays,
                        floorCeil: lib.number.getFloorCeil(globalData.categories.engagement.metrics.sessions.weekByDays)
                    },
                    sessionLength: {
                        name: globalData.categories.engagement.metrics.sessionLength.name,
                        total: lib.number.getSum(globalData.categories.engagement.metrics.sessionLength.weekByDays),
                        last7Days: globalData.categories.engagement.metrics.sessionLength.last7Days,
                        median: lib.number.getMedian(globalData.categories.engagement.metrics.sessionLength.weekByDays),
                        avg: lib.number.getAvg(globalData.categories.engagement.metrics.sessionLength.weekByDays),
                        daily: globalData.categories.engagement.metrics.sessionLength.weekByDays,
                        floorCeil: lib.number.getFloorCeil(globalData.categories.engagement.metrics.sessionLength.weekByDays)
                    }
                }
            },
            quality: {
                metrics: {
                    crashFrequency: {
                        name: globalData.categories.quality.metrics.crashFrequency.name,
                        total: lib.number.getSum(globalData.categories.quality.metrics.crashFrequency.weekByDays),
                        last7Days: globalData.categories.quality.metrics.crashFrequency.last7Days,
                        median: lib.number.getMedian(globalData.categories.quality.metrics.crashFrequency.weekByDays),
                        avg: lib.number.getAvg(globalData.categories.quality.metrics.crashFrequency.weekByDays),
                        daily: globalData.categories.quality.metrics.crashFrequency.weekByDays,
                        floorCeil: lib.number.getFloorCeil(globalData.categories.quality.metrics.crashFrequency.weekByDays)
                    },
                    sessionsOverCrashes: {
                        name: globalData.categories.quality.metrics.sessionsOverCrashes.name,
                        total: lib.number.getSum(globalData.categories.quality.metrics.sessionsOverCrashes.weekByDays),
                        last7Days: globalData.categories.quality.metrics.sessionsOverCrashes.last7Days,
                        median: lib.number.getMedian(globalData.categories.quality.metrics.sessionsOverCrashes.weekByDays),
                        avg: lib.number.getAvg(globalData.categories.quality.metrics.sessionsOverCrashes.weekByDays),
                        daily: globalData.categories.quality.metrics.sessionsOverCrashes.weekByDays,
                        floorCeil: lib.number.getFloorCeil(globalData.categories.quality.metrics.sessionsOverCrashes.weekByDays)
                    },
                    uniqueCrashes: {
                        name: globalData.categories.quality.metrics.uniqueCrashes.name,
                        total: lib.number.getSum(globalData.categories.quality.metrics.uniqueCrashes.weekByDays),
                        last7Days: globalData.categories.quality.metrics.uniqueCrashes.last7Days,
                        median: lib.number.getMedian(globalData.categories.quality.metrics.uniqueCrashes.weekByDays),
                        avg: lib.number.getAvg(globalData.categories.quality.metrics.uniqueCrashes.weekByDays),
                        daily: globalData.categories.quality.metrics.uniqueCrashes.weekByDays,
                        floorCeil: lib.number.getFloorCeil(globalData.categories.quality.metrics.uniqueCrashes.weekByDays)
                    }
                }
            },
            retention: {
                metrics: {
                    retentionRate: {
                        name: globalData.categories.retention.metrics.retentionRate.name,
                        total: lib.number.getSum(globalData.categories.retention.metrics.retentionRate.weekByDays),
                        last7Days: globalData.categories.retention.metrics.retentionRate.last7Days,
                        median: lib.number.getMedian(globalData.categories.retention.metrics.retentionRate.weekByDays),
                        avg: lib.number.getAvg(globalData.categories.retention.metrics.retentionRate.weekByDays),
                        daily: globalData.categories.retention.metrics.retentionRate.weekByDays,
                        floorCeil: lib.number.getFloorCeil(globalData.categories.retention.metrics.retentionRate.weekByDays)
                    },
                    uniqueDevices: {
                        name: globalData.categories.retention.metrics.uniqueDevices.name,
                        total: lib.number.getSum(globalData.categories.retention.metrics.uniqueDevices.weekByDays),
                        last7Days: globalData.categories.retention.metrics.uniqueDevices.last7Days,
                        median: lib.number.getMedian(globalData.categories.retention.metrics.uniqueDevices.weekByDays),
                        avg: lib.number.getAvg(globalData.categories.retention.metrics.uniqueDevices.weekByDays),
                        daily: globalData.categories.retention.metrics.uniqueDevices.weekByDays,
                        floorCeil: lib.number.getFloorCeil(globalData.categories.retention.metrics.uniqueDevices.weekByDays)
                    }
                }
            }
        }
    };
}

function determineQuadAndAngle(rect, point) {
    var _rect  = rect,
        _point = point;
        
    var _zone = [],
        _angle = 0;
        
    if (_point.x >= 0 && _point.y >= 0 && point.x <= _rect.width && _point.y <= _rect.height) {
        _zone[0] = (_point.x >= _rect.width / 2) ? 1 : 0;
        _zone[1] = (_point.y >= _rect.height / 2) ? 1 : 0;
        
        _tempArr = _zone;
        
        if (_zone[0] === 0) {
            // #TODO
            _angle = (_zone[1] === 0) ? -135 : 135;
        } else if (_zone[0] === 1) {
            _angle = (_zone[1] === 0) ? -45 : 45;
        }
    } else {
        _zone = [-1, -1]; // out of bounds
        _angle = null;
    }
    
    return {
        zone: _zone,
        angle: _angle   
    };
}

function processDaySelect(e) {
    var _dayClean               = e.source.id.replace('Container', ''),
        _pointContainerName     = 'day0' + e.source.number + 'PointContainer',
        _pointViewName          = 'day0' + e.source.number + 'PointView',
        _pointFocusViewName     = 'day0' + e.source.number + 'PointFocusView',
        _total                  = null,
        _determinedQuadAndAngle = null;

    if (_dayClean !== state.selected.day) {
        _total = data.dayGraph[state.selected.category].metrics[state.selected.metric].daily[e.source.number];
        
        if (_total !== null) {
            $.barSelectedView.opacity = 0.0;

            if (state.selected.day) {
                $[state.selected.day + 'Lbl'].animate({ opacity:1.0, duration:250 });
                $[state.selected.day + 'FocusLbl'].animate({ opacity:0.0, duration:250 });
                $[state.selected.day + 'PointView'].animate({ opacity:1.0, duration:250 });
                $[state.selected.day + 'PointFocusView'].animate({ opacity:0.0, duration:250 });

                $.dayCalloutContainer.opacity = 0.0;
                $.dayCalloutAngleBar.opacity = 0.0;
                $.dayCalloutAngleBar.left = 39;
                $.dayCalloutStraightBar.opacity = 0.0;
                $.dayCalloutStraightBar.right = 4;
                $.dayCalloutLblContainer.opacity = 0.0;
            }
            
            state.selected.day = _dayClean;
            
            $.barSelectedView.left = e.source.number * dayGraph.bars.vert.offset;
            $.barSelectedView.animate({ opacity:1.0, duration:250 });
            $[state.selected.day + 'Lbl'].animate({ opacity:0.0, duration:250 });
            $[state.selected.day + 'FocusLbl'].animate({ opacity:1.0, duration:250 });
            $[_pointViewName].animate({ opacity:0.0, duration:250 });
            $[_pointFocusViewName].animate({ opacity:1.0, duration:250 });

            // layout and present callout (#TODO: break this out to a separate method and clean up to get rid of hardcoded values)
            switch (state.selected.metric) {
                case 'installs':
                    $.dayCalloutLbl.text = lib.number.abbr(_total, 1);
                    break;
                case 'pushDevices':
                    // show positive indicator
                    $.dayCalloutLbl.text = lib.number.abbr(_total, 1);
                    break;
                case 'sessionLength':
                    $.dayCalloutLbl.text = lib.number.msecToTime(_total);
                    break;
                case 'sessions':
                    $.dayCalloutLbl.text = lib.number.abbr(_total, 1);
                    break;
                case 'crashFrequency':
                    $.dayCalloutLbl.text = (_total === null) ? '--' : lib.number.msecToTime(_total);
                    break;
                case 'sessionsOverCrashes':
                    $.dayCalloutLbl.text = (!_total === null) ? '--' : (_total % 1 === 0) ? lib.number.abbr(_total, 1) : lib.number.abbr(_total.toFixed(2), 1);
                    break;
                case 'uniqueCrashes':
                    $.dayCalloutLbl.text = lib.number.abbr(_total, 1);
                    break;
                case 'retentionRate':
                    $.dayCalloutLbl.text = (!_total === null) ? '--' : (_total % 1 === 0) ? _total + '%' : _total.toFixed(2) + '%';
                    break;
                case 'uniqueDevices':
                    $.dayCalloutLbl.text = (_total % 1 === 0) ? lib.number.abbr(_total, 1) : lib.number.abbr(_total.toFixed(2), 1);
                    break; 
                default:
                    $.dayCalloutLbl.text = lib.number.abbr(_total, 1);
                    break;
            }

            // add day container width
            _determinedQuadAndAngle = determineQuadAndAngle({ width:$.parentView.width + 56, height:$.parentView.height }, $[_pointContainerName].center);

            $.dayCalloutAngleBarRotationContainer.transform = Ti.UI.create2DMatrix({ rotate:_determinedQuadAndAngle.angle });

            if (_determinedQuadAndAngle.zone[0] === 0) {
                if (_determinedQuadAndAngle.zone[1] === 0) {
                    $.dayCalloutContainer.center = {
                        y: $[_pointContainerName].center.y + 24.5,
                        x: $.parentView.width / 2
                    };

                    $.dayCalloutBarContainer.top = 0;
                    $.dayCalloutBarContainer.left = $[_pointContainerName].center.x - $.graphContainer.left;
                    $.dayCalloutAngleBarContainer.left = 0;
                    $.dayCalloutAngleBarContainer.top = 0;
                    $.dayCalloutStraightBarContainer.top = 21;
                    $.dayCalloutStraightBarContainer.left = 23;
                    
                    $.dayCalloutLblContainer.right = null;
                    $.dayCalloutLblContainer.left = ($[_pointContainerName].center.x - $.graphContainer.left) + 30;
                } else if (_determinedQuadAndAngle.zone[1] === 1) {
                    $.dayCalloutContainer.center = {
                        y: $[_pointContainerName].center.y - 24.5,
                        x: $.parentView.width / 2
                    };

                    $.dayCalloutBarContainer.top = 18;
                    $.dayCalloutBarContainer.left = $[_pointContainerName].center.x - $.graphContainer.left;
                    $.dayCalloutAngleBarContainer.left = 0;
                    $.dayCalloutAngleBarContainer.top = 5;
                    $.dayCalloutStraightBarContainer.top = 2;
                    $.dayCalloutStraightBarContainer.left = 23;

                    $.dayCalloutLblContainer.right = null;
                    $.dayCalloutLblContainer.left = ($[_pointContainerName].center.x - $.graphContainer.left) + 30;
                }
            } else if (_determinedQuadAndAngle.zone[0] === 1) {
                if (_determinedQuadAndAngle.zone[1] === 0) {
                    $.dayCalloutContainer.center = {
                        y: $[_pointContainerName].center.y + 24.5,
                        x: $.parentView.width / 2
                    };

                    $.dayCalloutBarContainer.top = 0;
                    $.dayCalloutBarContainer.left = ($[_pointContainerName].center.x - $.graphContainer.left) - 30;
                    $.dayCalloutAngleBarContainer.left = 5;
                    $.dayCalloutAngleBarContainer.top = 0;
                    $.dayCalloutStraightBarContainer.top = 21;
                    $.dayCalloutStraightBarContainer.left = 0;

                    $.dayCalloutLblContainer.left = null;
                    $.dayCalloutLblContainer.right = ($.parentView.width - $[_pointContainerName].center.x) + 30;
                } else if (_determinedQuadAndAngle.zone[1] === 1) {
                    $.dayCalloutContainer.center = {
                        y: $[_pointContainerName].center.y - 24.5,
                        x: $.parentView.width / 2
                    };

                    $.dayCalloutBarContainer.top = 18;
                    $.dayCalloutBarContainer.left = ($[_pointContainerName].center.x - $.graphContainer.left) - 30;
                    $.dayCalloutAngleBarContainer.left = 5;
                    $.dayCalloutAngleBarContainer.top = 5;
                    $.dayCalloutStraightBarContainer.top = 2;
                    $.dayCalloutStraightBarContainer.left = 0;

                    $.dayCalloutLblContainer.left = null;
                    $.dayCalloutLblContainer.right = ($.parentView.width - $[_pointContainerName].center.x) + 30;
                }
            }

            showCallout(true);
        }
    } else {
        hideCallout(true);        

        state.selected.day = null;
    }
}

function hideCallout(animate) {
    if (state.callout.showing) {
        state.callout.showing = false;

        if (animate) {
            $.dayCalloutContainer.animate({ opacity:0.0, duration:250 }, function() {
                $.dayCalloutAngleBar.opacity = 0.0;
                $.dayCalloutAngleBar.left = 39;
                $.dayCalloutStraightBar.opacity = 0.0;
                $.dayCalloutStraightBar.right = 4;
                $.dayCalloutLblContainer.opacity = 0.0;
            });

            $.barSelectedView.animate({ opacity:0.0, duration:250 });
            $[state.selected.day + 'Lbl'].animate({ opacity:1.0, duration:250 });
            $[state.selected.day + 'FocusLbl'].animate({ opacity:0.0, duration:250 });
            $[state.selected.day + 'PointView'].animate({ opacity:1.0, duration:250 });
            $[state.selected.day + 'PointFocusView'].animate({ opacity:0.0, duration:250 });
        } else {
            $.dayCalloutContainer.opacity = 0.0;
            $.dayCalloutAngleBar.opacity = 0.0;
            $.dayCalloutAngleBar.left = 39;
            $.dayCalloutStraightBar.opacity = 0.0;
            $.dayCalloutStraightBar.right = 4;
            $.dayCalloutLblContainer.opacity = 0.0;

            $.barSelectedView.opacity = 0.0;
            $[state.selected.day + 'Lbl'].opacity = 1.0;
            $[state.selected.day + 'FocusLbl'].opacity = 0.0;
            $[state.selected.day + 'PointView'].opacity = 1.0;
            $[state.selected.day + 'PointFocusView'].opacity = 0.0;
        }
    }
}

function showCallout(animate) {
    state.callout.showing = true;

    $.dayCalloutContainer.opacity = 1.0;

    $.dayCalloutAngleBar.animate({ curve:Ti.UI.ANIMATION_CURVE_EASE_IN, left:0, opacity:1.0, duration:150 }, function() {
        $.dayCalloutStraightBar.animate({ right:0, opacity:1.0, duration:100 });
    });

    $.dayCalloutLblContainer.animate({ opacity:1.0, duration:250 });
}

function showDayBg(e) {
    if (!state.selected.bar) {
        state.selected.bar = true;
        $[e.source.id.replace('Container', 'Bg')].animate({ opacity:1.0, duration:100 });
    }
}

function hideDayBg(e) {
    state.selected.bar = false;
    $[e.source.id.replace('Container', 'Bg')].animate({ opacity:0.0, duration:100 });
}

function updateDayGraphValuesAndUI(currentCount, center, hide) {
    var _barVertProps       = dayGraph.bars.vert,
        _data               = data.dayGraph[state.selected.category].metrics[state.selected.metric],
        _pointContainerName = 'day0' + currentCount + 'PointContainer',
        _pointViewName      = 'day0' + currentCount + 'PointView',
        _pointFocusViewName = 'day0' + currentCount + 'PointFocusView',
        _calculatedY        = null,
        _calculatedCenter   = null;

    $[_pointFocusViewName].backgroundImage = 'detail/line-graph-day-dot-callout-' + state.selected.category + '.png';
    $[_pointViewName].backgroundImage = 'detail/line-graph-day-dot-' + state.selected.category + '.png';

    if (center) {
        // ( ( ( mx - mn ) / 2 ) + mn * h ) + 0
        _calculatedY = (_barVertProps.height / 2) + (($[_pointViewName].height / 2) + 3);
    } else {
        // ( ( ( mx - a ) / ( mx - mn ) ) * h)  + o
        _calculatedY = (((_data.floorCeil[1] - _data.daily[currentCount]) / (_data.floorCeil[1] - _data.floorCeil[0])) * _barVertProps.height) + (($[_pointViewName].height / 2) + 3);
    }

    _calculatedCenter = {
        x: (currentCount * _barVertProps.offset) + $.valueColumnContainer.width + 0.5, 
        y: _calculatedY + 30
    };

    $[_pointContainerName].animate({ center:_calculatedCenter, opacity:(hide) ? 0.0 : 1.0, duration:250 }, function() {
        $[_pointContainerName].center = _calculatedCenter;
    });
}

function updateUI() {
    var _barVertProps  = dayGraph.bars.vert,
        _data          = data.dayGraph[state.selected.category].metrics[state.selected.metric],
        _allSame       = lib.number.allAreSame(_data.daily),
        _allNull       = lib.number.allAreNull(_data.daily),
        _calculatedY   = null,
        _total         = null,
        _containerName = null,
        _date          = null;

    hideCallout(false);

    $.valueCeilLbl.opacity = 0.0;
    $.valueMidLbl.opacity = 0.0;
    $.valueFloorLbl.opacity = 0.0;
    $.totalLbl.opacity = 0.0;
    $.primaryMetricContainer.opacity = 0.0;

    // position vert bars
    for (var b = 0; b < _barVertProps.total; b++) {
        _containerName = 'day0' + b + 'Container';
        $[_containerName].number = b;
        $[_containerName].left = b * _barVertProps.offset;
        
        // we want to position null points to vertical center and also hide them...
        updateDayGraphValuesAndUI(b, _allSame || _data.daily[b] === null, _data.daily[b] === null);

        if (!state.init) {
            $[_containerName].addEventListener('touchstart', showDayBg);
            $[_containerName].addEventListener('touchend', hideDayBg);
            $[_containerName].addEventListener('click', processDaySelect);
        }
    }

    // position median bar
    if (_allSame || _allNull) {
        // ( ( ( mx - mn ) / 2 ) + mn * h ) + 0
        _calculatedY = (_barVertProps.height / 2) + (10 + 3);
    } else {
        // ( ( ( mx - a ) / ( mx - mn ) ) * h)  + o
        _calculatedY = (((_data.floorCeil[1] - _data.median) / (_data.floorCeil[1] - _data.floorCeil[0])) * _barVertProps.height) + (10 + 3);
    }

    $.medianBarView.animate({ top:_calculatedY - 1, opacity:(_allNull) ? 0.0 : 1.0, duration:250 });

    // update labels
    // #TODO: it's not necessary to render this everytime...
    for (var d = 0; d < 7; d++) {
        _date = new Date();
        _date.setDate(_date.getDate() + (d - 6));
        
        // #UTC
        $['day0' + d + 'Lbl'].text = $['day0' + d + 'FocusLbl'].text = _date.getUTCDate();
    }

    $['day06Lbl'].color = $.weekLbl.color = $.barSelectedView.backgroundColor = dayGraph.colors[state.selected.category].base;

    switch (state.selected.metric) {
        case 'installs':
            $.totalLbl.text = lib.number.abbr(data.dayGraph[state.selected.category].metrics[state.selected.metric].total, 1);
            $.primaryMetricLbl.text = 'Total';
            $.valueCeilLbl.text = lib.number.abbr(_data.floorCeil[1], 1);
            $.valueMidLbl.text = lib.number.abbr(_data.floorCeil[0] + ((_data.floorCeil[1] - _data.floorCeil[0]) / 2), 1);
            $.valueFloorLbl.text = lib.number.abbr(_data.floorCeil[0], 1);
            break;
        case 'pushDevices':
            $.totalLbl.text = (data.dayGraph[state.selected.category].metrics[state.selected.metric].last7Days > 0) ? '+' + lib.number.abbr(data.dayGraph[state.selected.category].metrics[state.selected.metric].last7Days, 1) : lib.number.abbr(data.dayGraph[state.selected.category].metrics[state.selected.metric].last7Days, 1);
            $.primaryMetricLbl.text = 'Change';
            $.valueCeilLbl.text = lib.number.abbr(_data.floorCeil[1], 1);
            $.valueMidLbl.text = lib.number.abbr(_data.floorCeil[0] + ((_data.floorCeil[1] - _data.floorCeil[0]) / 2), 1);
            $.valueFloorLbl.text = lib.number.abbr(_data.floorCeil[0], 1);
            break;
        case 'sessionLength':
            $.totalLbl.text = lib.number.msecToTime(data.dayGraph[state.selected.category].metrics[state.selected.metric].last7Days);
            $.primaryMetricLbl.text = 'Avg';
            $.valueCeilLbl.text = lib.number.msecToTime(_data.floorCeil[1]);
            $.valueMidLbl.text = lib.number.msecToTime(_data.floorCeil[0] + ((_data.floorCeil[1] - _data.floorCeil[0]) / 2));
            $.valueFloorLbl.text = lib.number.msecToTime(_data.floorCeil[0]);
            break;
        case 'sessions':
            $.totalLbl.text = lib.number.abbr(data.dayGraph[state.selected.category].metrics[state.selected.metric].total, 1);
            $.primaryMetricLbl.text = 'Total';
            $.valueCeilLbl.text = lib.number.abbr(_data.floorCeil[1], 1);
            $.valueMidLbl.text = lib.number.abbr(_data.floorCeil[0] + ((_data.floorCeil[1] - _data.floorCeil[0]) / 2), 1);
            $.valueFloorLbl.text = lib.number.abbr(_data.floorCeil[0], 1);
            break;
        case 'crashFrequency':
            $.totalLbl.text = (_allNull) ? '--' : lib.number.msecToTime(data.dayGraph[state.selected.category].metrics[state.selected.metric].last7Days);
            $.primaryMetricLbl.text = 'Avg';
            $.valueCeilLbl.text = (_allNull) ? '--' : lib.number.msecToTime(_data.floorCeil[1]);
            $.valueMidLbl.text = (_allNull) ? '--' : lib.number.msecToTime(_data.floorCeil[0] + ((_data.floorCeil[1] - _data.floorCeil[0]) / 2));
            $.valueFloorLbl.text = (_allNull) ? '--' : lib.number.msecToTime(_data.floorCeil[0]);
            break;
        case 'sessionsOverCrashes':
            $.totalLbl.text = (_allNull) ? '--' : (data.dayGraph[state.selected.category].metrics[state.selected.metric].last7Days % 1 === 0) ? lib.number.abbr(data.dayGraph[state.selected.category].metrics[state.selected.metric].last7Days, 1): lib.number.abbr(data.dayGraph[state.selected.category].metrics[state.selected.metric].last7Days.toFixed(2), 1);
            $.primaryMetricLbl.text = 'Avg';
            $.valueCeilLbl.text = (_allNull) ? '--' : (_data.floorCeil[1] % 1 === 0) ? lib.number.abbr(_data.floorCeil[1], 1) : _data.floorCeil[1].toFixed(2);
            $.valueMidLbl.text = (_allNull) ? '--' : ((_data.floorCeil[0] + ((_data.floorCeil[1] - _data.floorCeil[0]) / 2)) % 1 === 0) ? lib.number.abbr(_data.floorCeil[0] + ((_data.floorCeil[1] - _data.floorCeil[0]) / 2), 1) : lib.number.abbr((_data.floorCeil[0] + ((_data.floorCeil[1] - _data.floorCeil[0]) / 2)).toFixed(2), 1);
            $.valueFloorLbl.text = (_allNull) ? '--' : (_data.floorCeil[0] % 1 === 0) ? lib.number.abbr(_data.floorCeil[0], 1) : lib.number.abbr(_data.floorCeil[0].toFixed(2), 1);
            break;
        case 'uniqueCrashes':
            $.totalLbl.text = lib.number.abbr(data.dayGraph[state.selected.category].metrics[state.selected.metric].total, 1);
            $.primaryMetricLbl.text = 'Total';
            $.valueCeilLbl.text = lib.number.abbr(_data.floorCeil[1], 1);
            $.valueMidLbl.text = lib.number.abbr(_data.floorCeil[0] + ((_data.floorCeil[1] - _data.floorCeil[0]) / 2), 1);
            $.valueFloorLbl.text = lib.number.abbr(_data.floorCeil[0], 1);
            break;
        case 'retentionRate':
            $.totalLbl.text = (_allNull) ? '--' : (data.dayGraph[state.selected.category].metrics[state.selected.metric].last7Days % 1 === 0) ? data.dayGraph[state.selected.category].metrics[state.selected.metric].last7Days : data.dayGraph[state.selected.category].metrics[state.selected.metric].last7Days.toFixed(2);
            $.primaryMetricLbl.text = '% Avg';
            $.valueCeilLbl.text = (_allNull) ? '--' : (_data.floorCeil[1] % 1 === 0) ? _data.floorCeil[1] + '%' : _data.floorCeil[1].toFixed(2) + '%';
            $.valueMidLbl.text = (_allNull) ? '--' : ((_data.floorCeil[0] + ((_data.floorCeil[1] - _data.floorCeil[0]) / 2)) % 1 === 0) ? (_data.floorCeil[0] + ((_data.floorCeil[1] - _data.floorCeil[0]) / 2)) + '%' : ((_data.floorCeil[0] + ((_data.floorCeil[1] - _data.floorCeil[0]) / 2))).toFixed(2) + '%';
            $.valueFloorLbl.text = (_allNull) ? '--' : (_data.floorCeil[0] % 1 === 0) ? _data.floorCeil[0] + '%' : _data.floorCeil[0].toFixed(2) + '%';
            break;
        case 'uniqueDevices':
            $.totalLbl.text = lib.number.abbr(data.dayGraph[state.selected.category].metrics[state.selected.metric].total, 1);
            $.primaryMetricLbl.text = 'Total';
            $.valueCeilLbl.text = lib.number.abbr(_data.floorCeil[1], 1);
            $.valueMidLbl.text = lib.number.abbr(_data.floorCeil[0] + ((_data.floorCeil[1] - _data.floorCeil[0]) / 2), 1);
            $.valueFloorLbl.text = lib.number.abbr(_data.floorCeil[0], 1);

            // $.dayCalloutLbl.text = (_value % 1 === 0) ? lib.number.abbr(_value, 1) : lib.number.abbr(_value.toFixed(2), 1);
            break; 
        default:
            $.totalLbl.text = lib.number.abbr(data.dayGraph[state.selected.category].metrics[state.selected.metric].total, 1);
            $.primaryMetricLbl.text = 'Total';
            $.valueCeilLbl.text = lib.number.abbr(_data.floorCeil[1], 1);
            $.valueMidLbl.text = lib.number.abbr(_data.floorCeil[0] + ((_data.floorCeil[1] - _data.floorCeil[0]) / 2), 1);
            $.valueFloorLbl.text = lib.number.abbr(_data.floorCeil[0], 1);
            break;
    }

    $.dayCalloutAngleBar.backgroundColor = dayGraph.colors[state.selected.category].base;
    $.dayCalloutStraightBar.backgroundColor = dayGraph.colors[state.selected.category].base;
    $.medianBarView.backgroundImage = 'detail/median-fade-' + state.selected.category + '.png';

    if (!_allSame) {
        $.valueCeilLbl.animate({ opacity:1.0, duration:250 });
        $.valueFloorLbl.animate({ opacity:1.0, duration:250 });
    }
    
    $.valueMidLbl.animate({ opacity:1.0, duration:250 });
    $.totalLbl.animate({ opacity:1.0, duration:250 });
    $.primaryMetricContainer.animate({ opacity:1.0, duration:250 });
}

function update(category, metric) {
    state.selected.category = category,
    state.selected.metric   = (metric) ? metric : globalData.categories[state.selected.category].defaultMetric;

    updateUI();
}

function processEvents(type) {
    var _type = type || {};
}

function refreshUI(type, metric) {
    updateData();
    updateUI();
}

function hide(callback) {
    $.parentView.animate({ opacity:0.0, duration:250 });

    if (callback) { callback(); }
}

function show(callback) {
    $.parentView.animate({ opacity:1.0, duration:250 });

    if (callback) { callback(); }
}

function init(config) {
    var _config  = config || {},
        _refresh = false;

    state.callbacks.notifyDetail = _config.callbacks.notifyDetail;

    $.parentView.addEventListener('postlayout', function(e) {
        if (!_refresh) {
            _refresh = true;

            updateData();
            updateUI();

            state.init = true;
        }
    });
}

exports._init          = init,
exports._update        = update,
exports._refreshUI     = refreshUI,
exports._hide          = hide,
exports._show          = show,
exports._getParentView = getParentView;