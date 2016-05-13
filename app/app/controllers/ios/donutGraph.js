var globalData = null;

var lib = {
    insights: require('ti.insights'),
    number: require('client/number')()
};

var donutGraph = {
    view: null,
    zeroView: null,
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
    },
    callouts: []
};

var state = {
    init: false,
    current: {
        category: 'acquisition',
        metric: 'installs'
    },
    graph: {
        visible: true
    }
};

function getParentView() {
    return $.parentView;
}

function destroyCallouts() {
    for (var c = 0, cl = donutGraph.callouts.length; c < cl; c++) {
        donutGraph.callouts[c].controllers.destroy();
    }

    donutGraph.callouts.length = 0;
}

function update(category, metric, animate) {
    var _arr = lib.number.getAnglesAndPoints(globalData.categories[category].metrics[metric].platform, {x:226,y:226}, 120),
        _processedArr = [],
        _total = null;
        _currentPoint = null;
    
    state.current.category = category || state.current.category;
    state.current.metric = metric || state.current.metric;

    donutGraph.view.color = donutGraph.colors[category].base;

    destroyCallouts();

    // disable donut graph for retention rate
    if (_arr.length > 0 && metric !== 'retentionRate') {
        for (var i = 0, il = _arr.length; i < il; i++) {
            _processedArr.push([_arr[i].angles.start, _arr[i].angles.end]);

            switch (metric) {
                case 'installs':
                    _total = lib.number.abbr(_arr[i].total, 1);
                    break;
                case 'pushDevices':
                    _total = lib.number.abbr(_arr[i].total, 1);
                    break;
                case 'sessionLength':
                    _total = lib.number.msecToTime(_arr[i].total, 1);
                    break;
                case 'sessions':
                    _total = lib.number.abbr(_arr[i].total, 1);
                    break;
                case 'crashFrequency':
                    _total = lib.number.msecToTime(_arr[i].total, 1);
                    break;
                case 'sessionsOverCrashes':
                    _total = (_arr[i].total % 1 === 0) ? lib.number.abbr(_arr[i].total, 1) : lib.number.abbr(_arr[i].total.toFixed(2), 1);
                    break;
                case 'uniqueCrashes':
                    _total = (_arr[i].total % 1 === 0) ? lib.number.abbr(_arr[i].total, 1) : lib.number.abbr(_arr[i].total.toFixed(2), 1);
                    break;
                case 'retentionRate':
                    // this metric is disabled
                    _total = (_arr[i].total % 1 === 0) ? _arr[i].total + '%' : _arr[i].total.toFixed(2) + '%';
                    break;
                case 'uniqueDevices':
                    // the processor will calculate average for the week
                    _total = (_arr[i].total % 1 === 0) ? lib.number.abbr(_arr[i].total, 1) : lib.number.abbr(_arr[i].total.toFixed(2), 1);
                    break; 
                default:
                    _total = lib.number.abbr(_arr[i].total, 1);
                    break;
            }

            donutGraph.callouts.push(createCallout({
                parent: $.parentView,
                color: donutGraph.colors[category].base,
                name: _arr[i].name,
                total: _total,
                centers: {
                    inner: _arr[i].innerCentroid,
                    outer: _arr[i].outerCentroid
                }
            }));

            $.parentView.add(donutGraph.callouts[i].parentView);

            donutGraph.callouts[i].controllers.show();
        }

        if (!state.graph.visible) {
            state.graph.visible = true;
            donutGraph.zeroView.animate({ opacity:0.0, duration:100 });
            donutGraph.view.opacity = 1.0;
        }

        donutGraph.view.data = _processedArr;
    } else {
        state.graph.visible = false;

        donutGraph.view.animate({ opacity:0.0, duration:250 }, function() {
            donutGraph.view.data = [[0,0]];
        });

        donutGraph.zeroView.animate({ opacity:1.0, duration:250 });
    }
}

// #TODO
function finalizeInit() {
    if (!state.init) {
        state.init = true;
        update('acquisition', 'installs', false);
    }
}

function focusDonut() {
    $.toggleBtn.animate({ opacity:0.0, transform:Ti.UI.create2DMatrix({ scale:1.04 }), duration:250 });
    $.toggleBtnTouch.animate({ opacity:1.0, transform:Ti.UI.create2DMatrix({ scale:1.00 }), duration:250 });

    // #TODO keep track of prop to smooth animation
    $.centerIndicator.animate({ transform:Ti.UI.create2DMatrix({ scale:0.8 }), opacity:1.0, duration:100 });
}

function blurDonut() {
    $.toggleBtn.animate({ opacity:1.0, transform:Ti.UI.create2DMatrix({ scale:1.0 }), duration:250 });
    $.toggleBtnTouch.animate({ opacity:0.0, transform:Ti.UI.create2DMatrix({ scale:0.96 }), duration:250 });

    $.centerIndicator.animate({ transform:Ti.UI.create2DMatrix({ scale:1.0 }), opacity:0.0, duration:500 });
}

function createCallout(config) {
    var _config  = config || {},
        _callout = {};

    var _bg = Ti.UI.createView({ layout:'horizontal', height:64, width:Ti.UI.SIZE }),
        _lblContainer = Ti.UI.createView({ width:Ti.UI.SIZE, height:64 }),
        _totalLbl = Ti.UI.createLabel({ text:_config.total, font:{ fontFamily:"TitilliumText22L-1wt", fontSize:24 }, width:Ti.UI.SIZE, height:Ti.UI.SIZE, color:'#f2f2f2', bottom:10, right:0 }),
        _platformLbl = Ti.UI.createLabel({ text:(_config.name === 'Mobileweb') ? 'Mobile Web' : _config.name, font:{ fontFamily:"TitilliumText22L-250wt", fontSize:16 }, width:Ti.UI.SIZE, height:Ti.UI.SIZE, color:_config.color, top:12, right:0 });        
        _leftSpacer = Ti.UI.createView({ width:15 }),
        _rightSpacer = Ti.UI.createView({ width:15 });

    _callout.controllers = {
        show: function() {
            _callout.parentView.animate({ opacity:1.0, center:_config.centers.outer, duration:500 });
        },
        hide: function() {
            _callout.parentView.opacity = 0.0;
        },
        destroy: function() {
            _callout.parentView.animate({ opacity:0.0, duration:100, center:_config.centers.inner }, function() {
                _config.parent.remove(_callout.parentView);

                _config = null;

                _bg = null,
                _lblContainer = null,
                _totalLbl = null,
                _platformLbl = null,
                _leftSpacer = null,
                _rightSpacer = null,
                _callout.parentView = null;
                
                _callout = null;
            });
        }
    };

    _lblContainer.add(_totalLbl);
    _lblContainer.add(_platformLbl);

    _bg.add(_leftSpacer);
    _bg.add(_lblContainer);
    _bg.add(_rightSpacer);

    _callout.parentView = Ti.UI.createView({ width:Ti.UI.SIZE, height:Ti.UI.SIZE, opacity:0.0, center:_config.centers.inner });
    _callout.parentView.add(_bg);

    return _callout;
}

function refreshUI(animate) {
    globalData = Alloy.Globals.insights.data;

    update(state.current.category, state.current.metric, animate);
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

    $.parentView.addEventListener('postlayout', function(e) {
        if (!_refresh) {
            _refresh = true;

            refreshUI();
        }
    });

    $.toggleBtnTouch.transform = Ti.UI.create2DMatrix({ scale:0.96 });

    donutGraph.view = lib.insights.createDonutView({ width:340, height:340, color:'#000' });
    donutGraph.zeroView = Ti.UI.createView({ backgroundImage:'detail/donut-graph-zero-bg.png', width:340, height:340, opacity:0.0 });

    donutGraph.view.addEventListener('touchstart', focusDonut);
    donutGraph.view.addEventListener('touchend', blurDonut);
    
    $.parentView.add(donutGraph.zeroView);
    $.parentView.add(donutGraph.view);
}

exports._init          = init,
exports._finalizeInit  = finalizeInit,
exports._update        = update,
exports._refreshUI     = refreshUI,
exports._hide          = hide,
exports._show          = show,
exports._getParentView = getParentView;