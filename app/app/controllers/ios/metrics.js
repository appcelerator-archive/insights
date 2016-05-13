var globalData = null;

var lib = {
    number: require('client/number')(),
    events: require('client/events')()
};

var metrics = {
    // #TODO: Update so that metrics are an ordered array
    ordered: {
        // acquisition: ['installs', 'pushDevices', 'newUsers'],
        acquisition: ['installs', 'pushDevices'],
        engagement: ['sessionLength', 'sessions'],
        retention: ['retentionRate', 'uniqueDevices'],
        quality: ['crashFrequency', 'sessionsOverCrashes', 'uniqueCrashes']
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
    init: false,
    refreshing: false,
    selected: {
        category: null,
        metrics: null,
        metric: null,
        element: null
    },
    metricElements: null,
    callbacks: {
        notifyDetail: null
    },
    size: {
        widthOfMetricContainer: 40, // we need to figure this out in postlayout (starts with the two spacers)
        totalMetrics: 0, // we need to know how many total metrics so we can check to see how many have been checked
        currentMetricCount: 0 // where is the counter?
    }
};

// #TODO: this will need to be dynamic...
function processAnalyticsEvents() {
    switch (state.selected.metric) {
        case 'installs':
            lib.events.fireEvent(lib.events.EVT.METRICS.INSTALLS);
            break;
        case 'pushDevices':
            lib.events.fireEvent(lib.events.EVT.METRICS.PUSHDEVICES);
            break;
        case 'sessionLength':
            lib.events.fireEvent(lib.events.EVT.METRICS.SESSIONLENGTH);
            break;
        case 'sessions':
            lib.events.fireEvent(lib.events.EVT.METRICS.SESSIONS);
            break;
        case 'retentionRate':
            lib.events.fireEvent(lib.events.EVT.METRICS.RETENTIONRATE);
            break;
        case 'uniqueDevices':
            lib.events.fireEvent(lib.events.EVT.METRICS.UNIQUEDEVICES);
            break;
        case 'crashFrequency':
            lib.events.fireEvent(lib.events.EVT.METRICS.CRASHFREQUENCY);
            break;
        case 'sessionsOverCrashes':
            lib.events.fireEvent(lib.events.EVT.METRICS.SESSIONS_CRASHES);
            break;
        case 'uniqueCrashes':
            lib.events.fireEvent(lib.events.EVT.METRICS.UNIQUECRASHES);
            break;
        default: break;
    }
}

function processMetricClick(e) {
    var _selectedCenter = null,
        _centerOffset   = 20; // start at left shadow

    if (state.selected.element.parentView.id !== e.source.id) {
        state.selected.element.controllers.deselect();
        state.metricElements[e.source.index].controllers.select();
        state.selected.metric = e.source.id;
        state.selected.element = state.metricElements[e.source.index];

        processAnalyticsEvents();

        // a little opportunity to finish the scroll so we don't stuffter...
        setTimeout(function() {
            state.callbacks.notifyDetail({ category:state.selected.category, update:true, fromMetrics:true, metric:state.selected.metric, type:e.source.type, index:e.source.index, funnelIndex:e.source.funnelIndex });
        }, 250);
    } else {
        state.selected.element.controllers.cycle();
    }

    // center object
    for (var mei = 0, mel = e.source.index + 1; mei < mel; mei ++) {
        _centerOffset += state.metricElements[mei].state.width;
        Ti.API.info('Center Offset (' + mei + '): ' + _centerOffset);
    }

    Ti.API.info('Metric Element Width: ' + state.selected.element.state.width);
    Ti.API.info('Metric Slider Width: ' + $.metricScrollView.width);
    Ti.API.info('Metric Slider Content Width: ' + state.size.widthOfMetricContainer);
    
    _selectedCenter = _centerOffset - (state.selected.element.state.width / 2);

    Ti.API.info('Selected Center: ' + _selectedCenter);

    if ($.metricScrollView.width >= state.size.widthOfMetricContainer) {
        Ti.API.info('1st Fired...');
        // do not scroll
    } else if (0 + _selectedCenter > $.metricScrollView.width / 2 && state.size.widthOfMetricContainer - _selectedCenter > $.metricScrollView.width / 2) {
        Ti.API.info('2nd Fired...');
        // horizontally center selected item
        $.metricScrollView.scrollTo((_centerOffset - state.selected.element.state.width) - (($.metricScrollView.width / 2) - (state.selected.element.state.width / 2)), 0);
    } else if (state.size.widthOfMetricContainer - _selectedCenter < $.metricScrollView.width / 2) {
        Ti.API.info('3rd Fired...');
        // scroll to far right
        $.metricScrollView.scrollToBottom();
    } else {
        Ti.API.info('4th Fired...');
        $.metricScrollView.scrollTo(0, 0);
    }
}

// #TODO: widget
// this needs to be abstracted, but the data model needs to change... requires more time...
// adding 'funnel' boolean arg for quick implementation
function createMetricElement(count, spacer, offset, index, funnel) {
    var _metricElement = {};

    var _metric    = (funnel) ? globalData.categories[state.selected.category].funnels[index] : globalData.categories[state.selected.category].metrics[metrics.ordered[state.selected.category][index]],
        _isDefault = null;

    // This is for persistence of the selected metric... doesn't work with the funnel changes and not a major feature
    // look at this in the future as it would be nice to switch between categories and have selected metric persistence...
    // #TODO: come on! this is messy...
    // first check to see if we are refreshing (not composite)...
    // if (state.refreshing) {
    //     // next, check to see if the current metric matches the selected metric
    //     if (metrics.ordered[state.selected.category][count] === state.selected.metric) {
    //         state.refreshing = false;
    //         _isDefault = true;
    //     }
    // } else {
        if (!funnel) { // funnels can't be default today, but they might in the future
            _isDefault = metrics.ordered[state.selected.category][index] === globalData.categories[state.selected.category].defaultMetric;
        }
    // }  

    var _directionBgBase = (funnel) ? null : (_metric.direction === 0) ? 'detail/metric-trend-arrow-none' : (_metric.direction === -1) ? 'detail/metric-trend-arrow-down' : 'detail/metric-trend-arrow-up';

    _metricElement.state = {
        selected: _isDefault,
        currentRange: 0,
        width: 0,
        init: false
    };

    // #TODO: move to views obj 
    var _container = Ti.UI.createView({ left:0, opacity:0.0, width:Ti.UI.SIZE, height:100, top:offset, touchEnabled:false }),
        _spacer = null;

    var _metricContainer        = Ti.UI.createView({ opacity:(_isDefault) ? 0.0 : 1.0, width:Ti.UI.SIZE, height:100, top:0, touchEnabled:false }),
        _titleContainer         = Ti.UI.createView({ top:0, height:18, width:Ti.UI.SIZE, layout:"horizontal" }),
        _typeIcon               = null,
        _typeSpacer             = Ti.UI.createView({ width:8 }),
        _nameLbl                = Ti.UI.createLabel({ top:0, width:Ti.UI.SIZE, height:18, color:'#4c4c4c', font:{ fontFamily: "TitilliumText22L-250wt", fontSize:16 }, text:_metric.name }),
        _dividerLbl             = null, // this is only generated for funnels
        _descLbl                = null, // this is only generated for funnels
        _totalLbl               = Ti.UI.createLabel({ width:Ti.UI.SIZE, height:52, color:'#4c4c4c', font:{ fontFamily: "TitilliumText22L-1wt", fontSize:50 } }),
        _rangeAndTrendContainer = Ti.UI.createView({ height:16, bottom:0 }),
        _rangeLbl               = Ti.UI.createLabel({ width:112, height:16, color:'#4c4c4c', font:{ fontFamily: "TitilliumText22L-250wt", fontSize:16 }, text:_metric.range[_metricElement.state.currentRange].name }),
        _trendIconView          = Ti.UI.createView({ right:30, width:9, height:10, top:2, backgroundImage:_directionBgBase + '-inactive.png' }),
        _trendLbl               = Ti.UI.createLabel({ right:0, width:26, height:16, color:'#4c4c4c', font:{ fontFamily: "TitilliumText22L-250wt", fontSize:16 }, text:'24h' });

    var _metricFocusContainer        = Ti.UI.createView({ opacity:(_isDefault) ? 1.0 : 0.0, width:Ti.UI.SIZE, height:100, top:0, touchEnabled:false }),
        _titleFocusContainer         = Ti.UI.createView({ top:0, height:18, width:Ti.UI.SIZE, layout:"horizontal" }),
        _typeFocusIcon               = Ti.UI.createView({ height:18, width:28 }), // icon is determined further down
        _typeFocusSpacer             = Ti.UI.createView({ width:8 }),
        _nameFocusLbl                = Ti.UI.createLabel({ top:0, width:Ti.UI.SIZE, height:18, color:'#f2f2f2', font:{ fontFamily: "TitilliumText22L-250wt", fontSize:16 }, text:_metric.name }),
        _dividerFocusLbl             = null, // this is only generated for funnels
        _descFocusLbl                = null, // this is only generated for funnels
        _totalFocusLbl               = Ti.UI.createLabel({ width:Ti.UI.SIZE, height:52, color:metrics.colors[state.selected.category].base, font:{ fontFamily: "TitilliumText22L-1wt", fontSize:50 } }),
        _rangeAndTrendFocusContainer = Ti.UI.createView({ height:16, bottom:0 }),
        _rangeFocusLbl               = Ti.UI.createLabel({ width:112, height:16, color:'#f2f2f2', font:{ fontFamily: "TitilliumText22L-250wt", fontSize:16 }, text:_metric.range[0].name }),
        _trendIconFocusView          = Ti.UI.createView({ right:30, width:9, height:10, top:2, backgroundImage:_directionBgBase + '.png' }),
        _trendFocusLbl               = Ti.UI.createLabel({ right:0, width:26, height:16, color:'#f2f2f2', font:{ fontFamily: "TitilliumText22L-250wt", fontSize:16 }, text:'24h' });

    _metricElement.controllers = {
        animateIn: function() {
            _container.animate({ opacity:1.0, top:0, duration:750 });
        },
        focusNumber: function() {
            if (_metricElement.state.selected) {
                _totalFocusLbl.animate({ transform:Ti.UI.create2DMatrix({ scale:0.94 }), duration:100 });
            } else {
                _totalLbl.animate({ transform:Ti.UI.create2DMatrix({ scale:0.94 }), duration:100 });
            }
        },
        blurNumber: function() {
            if (_metricElement.state.selected) {
                _totalFocusLbl.animate({ transform:Ti.UI.create2DMatrix({ scale:1.0 }), duration:100 });
            } else {
                _totalLbl.animate({ transform:Ti.UI.create2DMatrix({ scale:1.0 }), duration:100 });
            }
        },
        updateWidth: function(width) {
            _metricElement.parentView.width = _container.width = _metricContainer.width = _metricFocusContainer.width = width;
        },
        cycle: function() {
            _totalFocusLbl.opacity = 0.0;

            if (_metricElement.state.currentRange === _metric.range.length - 1) {
                _metricElement.state.currentRange = 0;
            } else {
                _metricElement.state.currentRange ++;
            }
            
            if (funnel) {
                _totalLbl.text = _totalFocusLbl.text = _metric.range[_metricElement.state.currentRange].total + '%';
            } else {
                switch (_metric.name) {
                    case 'Installs':
                        _totalLbl.text = _totalFocusLbl.text = lib.number.withCommas(_metric.range[_metricElement.state.currentRange].total);
                        break;
                    // #HOTFIX: APPTS-3947; (v1) production v1.0.01151401 uses older label...
                    case 'Push Devices':
                    case 'Total Push Devices':
                        _totalLbl.text = _totalFocusLbl.text = (_metric.range[_metricElement.state.currentRange].total > 0) ? '+' + lib.number.withCommas(_metric.range[_metricElement.state.currentRange].total) : lib.number.withCommas(_metric.range[_metricElement.state.currentRange].total);
                        break;
                    case 'Avg Session Length':
                        _totalLbl.text = _totalFocusLbl.text = lib.number.msecToTime(_metric.range[_metricElement.state.currentRange].total);
                        break;
                    case 'Total Sessions':
                        _totalLbl.text = _totalFocusLbl.text = lib.number.withCommas(_metric.range[_metricElement.state.currentRange].total);
                        break;
                    case 'Crash Frequency':
                        _totalLbl.text = _totalFocusLbl.text = (_metric.range[_metricElement.state.currentRange].total === null) ? '--' : lib.number.msecToTime(_metric.range[_metricElement.state.currentRange].total);
                        break;
                    case 'Sessions / Crashes':
                        _totalLbl.text = _totalFocusLbl.text = (_metric.range[_metricElement.state.currentRange].total === null) ? '--' : (_metric.range[_metricElement.state.currentRange].total % 1 === 0) ? lib.number.withCommas(_metric.range[_metricElement.state.currentRange].total) : lib.number.withCommas(_metric.range[_metricElement.state.currentRange].total.toFixed(2));
                        break;
                    case 'Unique Crashes':
                        _totalLbl.text = _totalFocusLbl.text = (_metric.range[_metricElement.state.currentRange].total % 1 === 0) ? lib.number.withCommas(_metric.range[_metricElement.state.currentRange].total) : lib.number.withCommas(_metric.range[_metricElement.state.currentRange].total.toFixed(2));
                        break;
                    case 'Retention Rate':
                        _totalLbl.text = _totalFocusLbl.text = (_metric.range[_metricElement.state.currentRange].total === null) ? '--' : (_metric.range[_metricElement.state.currentRange].total % 1 === 0) ? _metric.range[_metricElement.state.currentRange].total + '%' : _metric.range[_metricElement.state.currentRange].total.toFixed(2) + '%';
                        break;
                    case 'Unique Devices':
                        _totalLbl.text = _totalFocusLbl.text = lib.number.withCommas(_metric.range[_metricElement.state.currentRange].total);
                        break;
                    default:
                        _totalLbl.text = _totalFocusLbl.text = lib.number.withCommas(_metric.range[_metricElement.state.currentRange].total);
                        break;
                }
            }

            _rangeLbl.text = _rangeFocusLbl.text = _metric.range[_metricElement.state.currentRange].name;

            _totalFocusLbl.animate({ opacity:1.0, duration:250 });
        },
        deselect: function() {
            if (_metricElement.state.selected) {
                _metricElement.state.selected = false;
            
                _metricContainer.animate({ opacity:1.0, duration:250 });
                _metricFocusContainer.animate({ opacity:0.0, duration:250 });
            }
        },
        select: function() {
            if (!_metricElement.state.selected) {
                _metricElement.state.selected = true;
            
                _metricContainer.animate({ opacity:0.0, duration:250 });
                _metricFocusContainer.animate({ opacity:1.0, duration:250 });
            }
        },
        destroy: function() {
            _container = null;
            _spacer = null;

            _metricContainer = null;
            _titleContainer = null;
            _typeIcon = null;
            _nameLbl = null;
            _dividerLbl = null;
            _descLbl = null;
            _totalLbl = null;
            _rangeAndTrendContainer = null;
            _rangeLbl = null;
            _trendIconView = null;
            _trendLbl = null;

            _metricFocusContainer = null;
            _titleFocusContainer = null;
            _typeFocusIcon = null;
            _nameFocusLbl = null;
            _dividerFocusLbl = null;
            _descFocusLbl = null;
            _totalFocusLbl = null;
            _rangeAndTrendFocusContainer = null;
            _rangeFocusLbl = null;
            _trendIconFocusView = null;
            _trendFocusLbl = null;

            _metricElement.parentView = null;
            _metricElement = null;
        }
    };

    if (funnel) {
        _dividerLbl    = Ti.UI.createLabel({ color:'#4c4c4c', text:'/', textAlign:'center', width:18, height:Ti.UI.FILL, font:{ fontFamily: "TitilliumText22L-250wt", fontSize:16 } }),
        _descLbl       = Ti.UI.createLabel({ color:'#4c4c4c', text:'CR', width:Ti.UI.SIZE, height:Ti.UI.FILL, font:{ fontFamily: "TitilliumText22L-250wt", fontSize:16 } }),
        _typeIcon      = Ti.UI.createView({ height:18, width:15, backgroundImage:'detail/metric-type-icon-funnel-inactive.png' }),
        _typeFocusIcon = Ti.UI.createView({ height:18, width:15, backgroundImage:'detail/metric-type-icon-funnel.png' });

        _dividerFocusLbl = Ti.UI.createLabel({ color:'#4c4c4c', text:'/', textAlign:'center', width:18, height:Ti.UI.FILL, font:{ fontFamily: "TitilliumText22L-250wt", fontSize:16 } }),
        _descFocusLbl = Ti.UI.createLabel({ color:'#f2f2f2', text:'CR', width:Ti.UI.SIZE, height:Ti.UI.FILL, font:{ fontFamily: "TitilliumText22L-250wt", fontSize:16 } }),

        _totalLbl.text = _totalFocusLbl.text = _metric.range[_metricElement.state.currentRange].total + '%';
        _rangeLbl.textAlign = _rangeFocusLbl.textAlign = 'center'; 
        _rangeAndTrendContainer.width = _rangeAndTrendFocusContainer.width = 112;
    } else {
        _typeIcon      = Ti.UI.createView({ height:18, width:28, backgroundImage:'detail/metric-type-icon-standard-inactive.png' }),
        _typeFocusIcon = Ti.UI.createView({ height:18, width:28, backgroundImage:'detail/metric-type-icon-standard.png' });

        _rangeLbl.left = _rangeFocusLbl.left = 0;
        _rangeAndTrendContainer.width = _rangeAndTrendFocusContainer.width = 158;

        switch (metrics.ordered[state.selected.category][index]) {
            case 'installs':
                _totalLbl.text = _totalFocusLbl.text = lib.number.withCommas(_metric.range[_metricElement.state.currentRange].total);
                break;
            case 'pushDevices':
                _totalLbl.text = _totalFocusLbl.text = (_metric.range[_metricElement.state.currentRange].total > 0) ? '+' + lib.number.withCommas(_metric.range[_metricElement.state.currentRange].total) : lib.number.withCommas(_metric.range[_metricElement.state.currentRange].total);
                break;
            case 'sessionLength':
                _totalLbl.text = _totalFocusLbl.text = lib.number.msecToTime(_metric.range[_metricElement.state.currentRange].total);
                break;
            case 'sessions':
                _totalLbl.text = _totalFocusLbl.text = lib.number.withCommas(_metric.range[_metricElement.state.currentRange].total);
                break;
            case 'crashFrequency':
                _totalLbl.text = _totalFocusLbl.text = (_metric.range[_metricElement.state.currentRange].total === null) ? '--' : lib.number.msecToTime(_metric.range[_metricElement.state.currentRange].total);
                break;
            case 'sessionsOverCrashes':
                _totalLbl.text = _totalFocusLbl.text = (_metric.range[_metricElement.state.currentRange].total === null) ? '--' : (_metric.range[_metricElement.state.currentRange].total % 1 === 0) ? lib.number.withCommas(_metric.range[_metricElement.state.currentRange].total) : lib.number.withCommas(_metric.range[_metricElement.state.currentRange].total.toFixed(2));
                break;
            case 'uniqueCrashes':
                _totalLbl.text = _totalFocusLbl.text = (_metric.range[_metricElement.state.currentRange].total % 1 === 0) ? lib.number.withCommas(_metric.range[_metricElement.state.currentRange].total) : lib.number.withCommas(_metric.range[_metricElement.state.currentRange].total.toFixed(2));
                break;
            case 'retentionRate':
                _totalLbl.text = _totalFocusLbl.text = (_metric.range[_metricElement.state.currentRange].total === null) ? '--' : (_metric.range[_metricElement.state.currentRange].total % 1 === 0) ? _metric.range[_metricElement.state.currentRange].total + '%' : _metric.range[_metricElement.state.currentRange].total.toFixed(2) + '%';
                break;
            case 'uniqueDevices':
                _totalLbl.text = _totalFocusLbl.text = lib.number.withCommas(_metric.range[_metricElement.state.currentRange].total);
                break;
            default:
                _totalLbl.text = _totalFocusLbl.text = lib.number.withCommas(_metric.range[_metricElement.state.currentRange].total);
                break;
        }
    }

    _metricElement.parentView = Ti.UI.createView({ top:0, index:count, type:_metric.type, funnelIndex:(funnel) ? index : null, id:(funnel) ? globalData.categories[state.selected.category].funnels[index].id : metrics.ordered[state.selected.category][index], width:Ti.UI.SIZE, height:140, layout:'horizontal' });

    _rangeAndTrendContainer.add(_rangeLbl);
    _rangeAndTrendFocusContainer.add(_rangeFocusLbl);
    
    if (!funnel) {
        _rangeAndTrendContainer.add(_trendIconView);
        _rangeAndTrendContainer.add(_trendLbl);

        _rangeAndTrendFocusContainer.add(_trendIconFocusView);
        _rangeAndTrendFocusContainer.add(_trendFocusLbl);
    }

    _titleContainer.add(_typeIcon);
    _titleContainer.add(_typeSpacer);
    _titleContainer.add(_nameLbl);

    _titleFocusContainer.add(_typeFocusIcon);
    _titleFocusContainer.add(_typeFocusSpacer);
    _titleFocusContainer.add(_nameFocusLbl);
    
    if (funnel) {
        _titleContainer.add(_dividerLbl);
        _titleContainer.add(_descLbl);

        _titleFocusContainer.add(_dividerFocusLbl);
        _titleFocusContainer.add(_descFocusLbl);   
    }

    _metricContainer.add(_titleContainer);
    _metricContainer.add(_totalLbl);
    _metricContainer.add(_rangeAndTrendContainer);

    _metricFocusContainer.add(_titleFocusContainer);
    _metricFocusContainer.add(_totalFocusLbl);
    _metricFocusContainer.add(_rangeAndTrendFocusContainer);

    _container.add(_metricContainer);
    _container.add(_metricFocusContainer);

    _metricElement.parentView.add(_container);

    // #TODO: it would be nice to dynamically layout range/trend views
    // _metricElement.parentView.addEventListener('postlayout', function(e) {
    //     if (!state.metricElements[e.source.index].state.init) {
    //         state.metricElements[e.source.index].state.init = true;
    //         state.metricElements[e.source.index].controllers.updateWidth(e.source.size.width);
    //     }        
    // });

    if (spacer) {
        _spacer = Ti.UI.createView({ width:30, height:5, right:0, touchEnabled:false });
        _metricElement.parentView.add(_spacer);
    }

    _metricElement.parentView.addEventListener('click', processMetricClick);

    _metricElement.parentView.addEventListener('touchstart', _metricElement.controllers.focusNumber);
    _metricElement.parentView.addEventListener('touchend', _metricElement.controllers.blurNumber);
    
    if (_isDefault) {
        state.selected.element = _metricElement;
    }

    _metricElement.parentView.addEventListener('postlayout', function(e) {
        if (state.metricElements[e.source.index] && state.metricElements[e.source.index].state) {
            state.metricElements[e.source.index].state.width = e.source.size.width;
        }
    });

    return _metricElement;
}

// #WORKAROUND
function determineFinalWidth(e) {
    state.size.widthOfMetricContainer += e.source.size.width;

    e.source.removeEventListener('postlayout', determineFinalWidth);

    state.size.currentMetricCount ++;

    if (state.size.currentMetricCount === state.size.totalMetrics) {
        $.metricContainer.width = state.size.widthOfMetricContainer;

        // we animate here to prevent container from being clipped on the left when animating in...
        for (var m = 0; m < state.size.currentMetricCount; m ++) {
            state.metricElements[m].controllers.animateIn();
        }
    }
}

// TODO: more abstraction is needed so that the complexity can be reduced and we can support more metric types
// funnel types implementation should be temporary
function generateMetricElements() {
    var _offset  = 140,
        _counter = 0; // now that we are adding elements beyond just standard metrics...

    state.metricElements = [];

    $.metricContainer.width = 10000; // reset
    $.metricScrollView.scrollTo(0, 0);
    state.size.totalMetrics = state.selected.metrics.length + globalData.categories[state.selected.category].funnels.length; // reset
    state.size.currentMetricCount = 0; // reset
    state.size.widthOfMetricContainer = 40; // reset

    // standard metrics
    for (var me = 0; me < state.selected.metrics.length; me ++) {
        state.metricElements.push(createMetricElement(_counter, (me < state.selected.metrics.length - 1) ? true : (globalData.categories[state.selected.category].funnels.length > 0) ? true : false, _offset, me, false));

        $.metricContainer.add(state.metricElements[_counter].parentView);

        state.metricElements[_counter].parentView.addEventListener('postlayout', determineFinalWidth);

        _offset += 60;
        _counter ++;
    }

    // funnel metrics
    for (var fe = 0, fel = globalData.categories[state.selected.category].funnels.length; fe < fel; fe ++) {
        state.metricElements.push(createMetricElement(_counter, (fe < fel - 1) ? true : false, _offset, fe, true));

        $.metricContainer.add(state.metricElements[_counter].parentView);

        state.metricElements[_counter].parentView.addEventListener('postlayout', determineFinalWidth);

        _offset += 60;
        _counter ++;
    }

    state.finished = true;
}

function getParentView() {
    return $.parentView;
}

function update(category) {
    if (category !== state.selected.category || !state.init || state.refreshing) {
        state.selected.category = category;
        state.selected.metrics = metrics.ordered[state.selected.category];

        if (!state.refreshing) {
            state.selected.metric = globalData.categories[state.selected.category].defaultMetric;
        }

        if (state.metricElements) {
            for (var me = 0, mel = state.metricElements.length; me < mel; me ++) {
                $.metricContainer.remove(state.metricElements[me].parentView);
                state.metricElements[me].controllers.destroy();
            }
        }

        generateMetricElements();
    }
}

function refreshUI() {
    state.refreshing = true;

    globalData = Alloy.Globals.insights.data;

    update(state.selected.category, true);
}

function init(config) {
    var _config = config || {};

    globalData = Alloy.Globals.insights.data;

    $.parentView.addEventListener('postlayout', function() {
        
    });

    state.callbacks.notifyDetail = _config.callbacks.notifyDetail;

    state.selected.category = 'acquisition';
    state.selected.metrics = metrics.ordered[state.selected.category];
    state.selected.metric = globalData.categories[state.selected.category].defaultMetric;

    update(state.selected.category);

    state.init = true;
}

exports._init          = init,
exports._update        = update,
exports._refreshUI     = refreshUI,
exports._getParentView = getParentView;