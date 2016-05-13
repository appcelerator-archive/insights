var globalData = null;

var state = {
    showing: false,
    current: {
        category: 'acquisition',
        metric: 'installs'
    },
    callbacks: {
        notifyOverview: null,
        notifyLeftMenu: null,
        notifyRightMenu: null,
        notifyClock: null
    },
    currentContext: 'acquisition',
    metricTypeContext: {
        standard: true,
        funnel: false
    }
};

var color = {
    acquisition: {
        base: '#8dc63f',
        highlight: '#b7ff52'
    },
    engagement: {
        base: '#f7941d',
        highlight: '#ffd200'
    },
    quality: {
        base: '#0072bc',
        highlight: '#009bff'
    },
    retention: {
        base: '#942c61',
        highlight: '#ff4ca7'
    }
};

var controllers = {
    dayGraph: Alloy.createController('dayGraph'),
    donutGraph: Alloy.createController('donutGraph'),
    categoryMini: Alloy.createController('categoryMini'),
    metrics: Alloy.createController('metrics'),
    funnels: Alloy.createController('funnels')
};

function getParentView() {
    return $.parentView;
}

function createDayGraph() {}

function showDetailStandardTipSet() {
    Alloy.Globals.insights.controllers.tips._showTips('detailMetricStandard');
}

function showDetailFunnelTipSet() {
    Alloy.Globals.insights.controllers.tips._showTips('detailMetricFunnel');
}

function showDetail() {
    if (!state.showing) {
        state.showing = true;

        if (state.metricTypeContext.standard) {
            Alloy.Globals.insights.controllers.setContext('catDetailStandard');
        } else {
            Alloy.Globals.insights.controllers.setContext('catDetailFunnel');
        }

        state.callbacks.notifyLeftMenu({ showLight:true });
        state.callbacks.notifyRightMenu({ onShowLogoWhite:true });
        state.callbacks.notifyClock(true);
        
        $.parentView.animate({ top:0, duration:250 }, Alloy.Globals.insights.controllers.tips._showTipsForContext);
    }
}

function hide() {
    if (state.showing) {
        state.showing = false;

        Alloy.Globals.insights.controllers.setContext('catOverview');

        state.callbacks.notifyLeftMenu({ showDark:true });
        state.callbacks.notifyRightMenu({ onShowLogoRed:true });
        state.callbacks.notifyClock(false);

        $.parentView.animate({ top:Ti.Platform.displayCaps.platformHeight, duration:250 });

        state.callbacks.notifyOverview({ showFromDetail:true });
    }
}

function update(type, animate) {
    if (animate) {
        // $.selectedCategoryContainer.opacity = 0.0;
        $.selectedCategoryIconView.backgroundImage = 'detail/metric-category-current-icon-' + type + '.png';
        $.selectedCategoryLbl.text = globalData.categories[type].name;

        // $.selectedCategoryContainer.animate({ opacity:1.0, duration:250 });
    } else {
        $.selectedCategoryIconView.backgroundImage = 'detail/metric-category-current-icon-' + type + '.png';
        $.selectedCategoryLbl.text = globalData.categories[type].name;
    }
}

function hideStandardUI(callback) {
    if (state.metricTypeContext.standard) {
        Ti.API.info('Hide Standard');
        state.metricTypeContext.standard = false;

        controllers.dayGraph._hide();
        controllers.donutGraph._hide(callback || function() {});
    }
}

function showStandardUI(callback) {
    if (!state.metricTypeContext.standard) {
        state.metricTypeContext.standard = true;
        
        Ti.API.info('Show Standard');

        if (state.showing) {
            Alloy.Globals.insights.controllers.setContext('catDetailStandard');
            Alloy.Globals.insights.controllers.tips._showTipsForContext();
        }

        controllers.dayGraph._show();
        controllers.donutGraph._show();
    }
}

function hideFunnelUI(callback) {
    if (state.metricTypeContext.funnel) {
        Ti.API.info('Hide Funnel');
        state.metricTypeContext.funnel = false;

        controllers.funnels._hide(callback || function() {});
    }
}

function showFunnelUI(callback) {
    if (!state.metricTypeContext.funnel) {
        state.metricTypeContext.funnel = true;
        
        Ti.API.info('Show Funnel');
        
        if (state.showing) {
            Alloy.Globals.insights.controllers.setContext('catDetailFunnel');
            controllers.funnels._show(Alloy.Globals.insights.controllers.tips._showTipsForContext);
        } else {
            controllers.funnels._show();
        }
    }
}

// #TODO THIS IS INSANE
function processEvents(eventData) {
    var _eventData = eventData || {};

    // #TODO: the only place nested functions are used... address that in the future
    // #TODO: animate boolean is not supported yet, but should be to improve performance...
    function _processStandard(animate) {
        Ti.API.info('Processing Standard');
        if (!_eventData.fromMetrics) {
            update(_eventData.category, false);

            controllers.metrics._update(_eventData.category);
            controllers.categoryMini._update(_eventData.category);
            controllers.dayGraph._update(_eventData.category);
        } else if (_eventData.fromMetrics) {
            controllers.dayGraph._update(_eventData.category, _eventData.metric);
        }
    
        controllers.donutGraph._update(_eventData.category, _eventData.metric || globalData.categories[_eventData.category].defaultMetric, animate);
    }

    function _processStandardFromMini(animate) {
        update(_eventData.category, true);

        controllers.metrics._update(_eventData.category);
        controllers.dayGraph._update(_eventData.category);
        controllers.donutGraph._update(_eventData.category, _eventData.metric || globalData.categories[_eventData.category].defaultMetric, true);
        state.callbacks.notifyOverview({ update:true, category:_eventData.category });

        $.metricsContainer.animate({ opacity:1.0, bottom:0, duration:125 });
    }

    // #TODO: animate boolean is not supported yet, but should be to improve performance...
    function _processFunnel(animate) {
        Ti.API.info('Processing Funnel');

        Ti.API.info(_eventData);

        controllers.funnels._update(_eventData.category, _eventData.funnelIndex);
    }

    if (_eventData.category) {
        state.current.category = _eventData.category;
    }

    if (_eventData.metric) {
        state.current.metric = _eventData.metric;
    } else {
        state.current.metric = state.current.metric || globalData.categories[state.current.category].defaultMetric;
    } 

    if (_eventData.show) {
        showDetail();
    }

    if (_eventData.hide) {
        hide();
    }

    if (_eventData.categoryMini) {
        $.metricsContainer.animate({ opacity:0.0, bottom:-20, duration:125 }, function() {
            if (state.metricTypeContext.funnel) {
                hideFunnelUI(function() {
                    _processStandardFromMini(false);
                    showStandardUI();
                });
            } else {
                _processStandardFromMini(true);
            }
        });
    }

    if (_eventData.update) {
        switch (_eventData.type) {
            case 'standard': // basic metrics
                if (state.metricTypeContext.standard) {
                    // straight up process that change in metric
                    _processStandard(true);
                } else {
                    // pdate the standard ui (without animation; it's hidden), hide funnel ui, show standard ui

                    _processStandard(false);
                    hideFunnelUI(showStandardUI);
                }

                break;
            case 'funnel':
                if (state.metricTypeContext.funnel) {
                    // straight up process that change in metric
                    _processFunnel(true);
                } else {
                    // update the funnel ui (without animation; it's hidden), hide standard ui, show funnel ui
                    
                    _processFunnel(false);
                    hideStandardUI(showFunnelUI);
                }

                break;
            default: break;
        }
    }
}

function processSwipe(e) {
    if (e.direction === 'down') {
        hide();
    }
}

function refreshUI() {
    globalData = Alloy.Globals.insights.data;
    
    if (state.metricTypeContext.funnel) {
        hideFunnelUI(showStandardUI);
    }

    controllers.categoryMini._refreshUI();
    controllers.dayGraph._refreshUI();
    controllers.donutGraph._refreshUI(state.showing);
    controllers.metrics._refreshUI(state.current.category, state.current.metric);
}

function init(config) {
    var _config = config || {};

    globalData = Alloy.Globals.insights.data;

    state.callbacks.notifyOverview  = _config.callbacks.notifyOverview,
    state.callbacks.notifyLeftMenu  = _config.callbacks.notifyLeftMenu,
    state.callbacks.notifyRightMenu = _config.callbacks.notifyRightMenu,
    state.callbacks.notifyClock     = _config.callbacks.notifyClock;

    controllers.donutGraph._init();

    controllers.categoryMini._init({
        callbacks: {
            notifyDetail: processEvents
        }
    });

    controllers.dayGraph._init({
        callbacks: {
            notifyDetail: processEvents
        }
    });

    controllers.funnels._init();
    
    controllers.metrics._init({
        callbacks: {
            notifyDetail: processEvents
        }
    });

    // standard metric ui
    $.parentView.add(controllers.categoryMini._getParentView());
    $.parentView.add(controllers.dayGraph._getParentView());
    $.parentView.add(controllers.donutGraph._getParentView());

    // funnel metric ui
    $.parentView.add(controllers.funnels._getParentView());
    
    // metric ticker
    $.metricsContainer.add(controllers.metrics._getParentView());

    $.parentView.addEventListener('swipe', processSwipe);
}

exports._init = init,
exports._getParentView            = getParentView,
exports._hide                     = hide,
exports._refreshUI                = refreshUI,
exports._controllers              = controllers,
exports._showDetailStandardTipSet = showDetailStandardTipSet,
exports._showDetailFunnelTipSet   = showDetailFunnelTipSet,
exports._processEvents            = processEvents;