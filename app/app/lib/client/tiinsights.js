// iOS blur not supported on Android...
function createBlurView(config) {
    var _view = Ti.UI.createView(config);

    _view.backgroundColor = '#000',
    _view.opacity         = 0.8;

    return _view;
}

// #TODO: This needs to be completed... Using standard activity indicators...
function createLoadingIndicatorLargeView(config) {
    var _view = Ti.UI.createView(config);

    _view.start  = function() {},
    _view.cancel = function() {};
    
    return _view;
}

// #TODO: This needs to be completed... Using standard activity indicators...
function createLoadingIndicatorSmallView(config) {
    var _view = Ti.UI.createView(config);

    _view.start  = function() {},
    _view.cancel = function() {};
    
    return _view;
}

function createOrbView(config) {
    var _view = Ti.UI.createView(config);

    _view.showColor     = function() {},
    _view.showGray      = function() {},
    _view.enableRaster  = function() {},
    _view.disableRaster = function() {};

    _view.backgroundImage = '/images/overview/orb-temp.png';

    return _view;
}

// THIS IS FINISHED
function createDonutView(config) {
    var _view = Ti.UI.createView(config);

    _view.backgroundImage = '/images/detail/donut-graph-zero-bg.png';

    return _view;
}

module.exports = function() { 
    return {
        createBlurView: createBlurView,
        createLoadingIndicatorLargeView: createLoadingIndicatorLargeView,
        createLoadingIndicatorSmallView: createLoadingIndicatorSmallView,
        createOrbView: createOrbView,
        createDonutView: createDonutView
    };
};