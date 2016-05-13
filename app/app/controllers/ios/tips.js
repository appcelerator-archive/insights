var tips = {
    arrow: {
        width: 0,
        height: 0
    }
};

var state = {
    jsonPath: 'common/tips.json',
    tipsData: null,
    readyToDestroy: false,
    enabled: {
        map: false,
        overview: false,
        detailStandard: false,
        detailFunnel: false
    },
    remaining: {
        map: 0,
        overview: 0,
        detailStandard: 0,
        detailFunnel: 0
    },
    tipTotal: {
        map: 0,
        overview: 0,
        detailStandard: 0,
        detailFunnel: 0
    },
    currentTip: null,
    currentTipToShow: null,
    callbacks: {
        onComplete: null, // this is a temporary callback referenced until a tip is destroyed
        showTipsForContext: null,
        onDisable: null,
        onEnable: null
    },
    init: false
};

function processTipData() {
    state.tipsData = JSON.parse(Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory + state.jsonPath).read().text);

    for (var category in state.tipsData.tips) {
        switch (category) {
            case 'currentSessionMap':
                state.tipTotal.map += state.tipsData.tips[category].length;
                break;
            case 'metricCategoryOverview':
                state.tipTotal.overview += state.tipsData.tips[category].length;
                break;
            case 'detailMetricStandard':
                state.tipTotal.detailStandard += state.tipsData.tips[category].length;
                break;
            case 'detailMetricFunnel':
                state.tipTotal.detailFunnel += state.tipsData.tips[category].length;
                break;
            default: break;
        }
    }

    Ti.API.info('Total map tips: ' + state.tipTotal.map);
    Ti.API.info('Total overview tips: ' + state.tipTotal.overview);
    Ti.API.info('Total detail standard tips: ' + state.tipTotal.detailStandard);
    Ti.API.info('Total detail funnel tips: ' + state.tipTotal.detailFunnel);

    state.remaining.map            = state.tipTotal.map,
    state.remaining.overview       = state.tipTotal.overview,
    state.remaining.detailStandard = state.tipTotal.detailStandard,
    state.remaining.detailFunnel   = state.tipTotal.detailFunnel;
}

function getAppendText() {
    if (state.remaining[state.currentTipToShow] + 1 === state.tipTotal[state.currentTipToShow]) {
        // frist tip in set
        return '<span class="sub-highlight">Swipe left</span> to continue or <span class="sub-highlight">pinch</span> to dismiss tips for this screen...';
    } else if (state.remaining[state.currentTipToShow] === 0) {
        // last tip in set
        return '<span class="sub-highlight">Swipe left</span> to dismiss tips for this screen or <span class="sub-highlight">swipe right</span> to view previous tip...';
    } else {
        return '<span class="sub-highlight">Swipe left</span> to continue, <span class="sub-highlight">swipe right</span> to view previous tip, or <span class="sub-highlight">pinch</span> to dismiss tips for this screen...';
    }
}

function getBaseHTML(containerData) {
    var _html     = {},
        _width    = containerData.width,
        _position = containerData.position, // array: [top, left]
        _padding  = 20;

    _html.start = 

    '<!DOCTYPE html>
        <html>
            <head>
                <style>
                    @font-face { 
                        font-family: TitilliumText22L-250wt; 
                        src: "/fonts/TitilliumText22L002.otf";
                    }

                    @font-face { 
                        font-family: TitilliumText22L-800wt; 
                        src: "/fonts/TitilliumText22L005.otf";
                    }

                    * {
                        padding: 0px;
                        margin: 0px;
                    }

                    div.wrapper {
                        padding: ' + _padding + 'px; 
                        position: absolute;
                        top: ' + (_position[0] - _padding) + 'px;
                        left: ' + _position[1] + 'px;
                        width: ' + (_width - (_padding * 2)) + 'px;
                        z-index: 0;
                    }

                    div.bg {
                        position: absolute;
                        left: 0px;
                        right: 0px;
                        bottom: 0px;
                        top: 0px;
                        padding: ' + _padding + 'px;
                        background-color: #1a1a1a; 
                        border-radius: 8px 4px 8px 4px;
                        opacity: 0.8;
                        z-index: 1;
                    }

                    p { 
                        text-align: center;
                        font-size: 16px;
                        line-height: 24px;
                        margin-bottom: 15px;
                        color: #f2f2f2;
                        position: relative;
                        font-family: "TitilliumText22L-250wt";
                        z-index: 2;
                    }

                    .keyword-highlight {
                        font-family: "TitilliumText22L-800wt";
                        color: #00aeef;
                    }

                    .action-highlight {
                        font-family: "TitilliumText22L-800wt";
                        color: #ffff00;
                    }

                    .sub-highlight {
                        color: #aaa;
                    }

                    .outro {
                        font-size: 12px;
                        line-height: 18px;
                        color: #666;
                        margin-bottom: 0px;
                    }

                    .count {
                        font-family: "TitilliumText22L-250wt";
                        font-size: 10px;
                        color: #aaa;
                        position: absolute;
                        bottom: 10px;
                        right: 15px;
                        z-index: 2;
                    }
                </style>
            </head>
            <body>
                <div class="wrapper">';

    _html.end =

                    '<p class="outro">' + getAppendText() + '</p>
                    <div class="count">' + (state.tipTotal[state.currentTipToShow] - state.remaining[state.currentTipToShow]) + ' / ' + state.tipTotal[state.currentTipToShow] + '</div>
                    <div class="bg" />
                </div>
            </body>
        </html>';

    return _html;
}

function createTip(tipData) {
    var _tip          = {},
        _baseHTML     = getBaseHTML(tipData.container),
        _lblContainer = Ti.UI.createWebView({ html:_baseHTML.start + tipData.html + _baseHTML.end, hideLoadIndicator:true, backgroundColor:'transparent', top:0, width:Ti.Platform.displayCaps.platformWidth, height:Ti.Platform.displayCaps.platformHeight });

    _tip.state = {
        shouldAnimate: false
    };

    _tip.controllers = {
        animate: function() {
            if (_tip && _tip.state.shouldAnimate) {
                _lblContainer.animate({ top:_lblContainer.top - 5, duration:2000 }, function() {
                    if (_tip && _tip.state.shouldAnimate) {
                        _lblContainer.animate({ top:_lblContainer.top + 10, duration:2000 }, function() {
                            if (_tip && _tip.state.shouldAnimate) {
                                _tip.controllers.animate();
                            }
                        });
                    }
                });
            }
        },
        show: function(onShow) {
            var _onShow = onShow || null;

            _tip.state.shouldAnimate = true;

            _tip.controllers.animate();

            _tip.parentView.animate({ opacity:1.0, duration:250 }, function() {
                state.readyToDestroy = true;

                if (_onShow) { _onShow(); }
            });
        },
        hide: function(fromGoBack, fromGoForward, onHide) {
            var _onHide = onHide || null;

            if (fromGoBack) {
                Ti.API.info('Going back...');

                _tip.parentView.animate({ left:20, opacity:0.0, duration:250 }, function() {
                    _tip.state.shouldAnimate = false;                

                    if (_onHide) { _onHide(); }
                });
            } else if (fromGoForward) {
                Ti.API.info('Going forward...');

                _tip.parentView.animate({ left:-20, opacity:0.0, duration:250 }, function() {
                    _tip.state.shouldAnimate = false;                

                    if (_onHide) { _onHide(); }
                });
            } else {
                _tip.parentView.animate({ opacity:0.0, duration:250 }, function() {
                    _tip.state.shouldAnimate = false;                

                    if (_onHide) { _onHide(); }
                });
            }
        },
        wiggle: function() {
            _tip.parentView.animate({ center:{ x:(Ti.Platform.displayCaps.platformWidth / 2) - 6, y:Ti.Platform.displayCaps.platformHeight / 2 }, curve:Ti.UI.ANIMATION_CURVE_EASE_IN, duration:100 }, function() {
                _tip.parentView.animate({ center:{ x:(Ti.Platform.displayCaps.platformWidth / 2) + 3, y:Ti.Platform.displayCaps.platformHeight / 2 }, curve:Ti.UI.ANIMATION_CURVE_LINEAR, duration:100 }, function() {
                    _tip.parentView.animate({ center:{ x:Ti.Platform.displayCaps.platformWidth / 2, y:Ti.Platform.displayCaps.platformHeight / 2 }, duration:50 });
                });    
            });
        },
        destroy: function() {
            Ti.API.info('Current tip destroyed...');

            // _tip.parentView.remove(_lblContainer);

            _baseHTML       = null;
            _tipContainer   = null;
            _lblContainer   = null;
            _tip.parentView = null;
            _tip            = null;
        }
    }

    _tip.parentView = Ti.UI.createView({ opacity:0.0, width:Ti.Platform.displayCaps.platformWidth, height:Ti.Platform.displayCaps.platformHeight, touchEnabled:false });

    _tip.parentView.add(_lblContainer);

    return _tip;
}

function destroyCurrentlyRenderedTip(fromGoBack, fromGoForward, onDestroy) {
    var _onDestroy = onDestroy || null;

    if (state.currentTip) {
        state.currentTip.controllers.hide(fromGoBack, fromGoForward, function() {
            if (onDestroy) { onDestroy(); }
        });
    }
}

function renderTip(tip) {    
    if (!state.currentTip) {
        $.parentView.add($.tipContainer);

        $.tipContainer.animate({ opacity:1.0, duration:100 }, function() {
            $.tipContainer.opacity = 1.0;

            state.currentTip = createTip(tip);

            $.tipContainer.add(state.currentTip.parentView);

            state.currentTip.controllers.show();
        });
    }
}

function getTipData(category, index) {
    if (state.tipsData.tips[category]) {
        return state.tipsData.tips[category][index] || null;
    } else {
        return null;
    }
}

// onStart: When the tip is just about to show
// onComplete: When the user taps on the tip and the tip is destroyed
function showTips(category, index) {
    var _tip = null;

    switch (category) {
        case 'currentSessionMap':
            state.currentTipToShow = 'map';
            break;
        case 'metricCategoryOverview':
            state.currentTipToShow = 'overview';
            break;
        case 'detailMetricStandard':
            state.currentTipToShow = 'detailStandard';
            break;
        case 'detailMetricFunnel':
            state.currentTipToShow = 'detailFunnel';
            break;
        default: break;
    }

    if (state.enabled[state.currentTipToShow] && state.remaining[state.currentTipToShow] > 0) {
        $.parentView.touchEnabled = true;

        _tip = getTipData(category, state.tipTotal[state.currentTipToShow] - state.remaining[state.currentTipToShow]);

        if (_tip !== null) {
            state.remaining[state.currentTipToShow] --;
            
            state.callbacks.onComplete = function() {
                showTips(category, state.tipTotal[state.currentTipToShow] - state.remaining[state.currentTipToShow]);
            };

            renderTip(_tip);
        } else {
            $.parentView.touchEnabled = false;

            Ti.API.info(state.currentTipToShow + 'tip does not exist. Calling back, if possible...');

            disable();

            if (state.callbacks.onComplete) { state.callbacks.onComplete(); }
        }
    } else if (state.remaining[state.currentTipToShow] === 0) {
        Ti.API.info('All ' + state.currentTipToShow + ' tips have been seen...');
    } else {
        Ti.API.info(state.currentTipToShow + ' tips are disabled...');
    }
}

function isMapEnabled() {
    return state.enabled.map;
}

function isOverviewEnabled() {
    return state.enabled.overview;
}

function isDetailStandardEnabled() {
    return state.enabled.detailStandard;
}

function isDetailFunnelEnabled() {
    return state.enabled.detailFunnel;
}

function enableMap() {
    state.enabled.map   = true,
    state.remaining.map = state.tipTotal.map;

    showTipsForContext();
}

function disableMap() {
    state.enabled.map   = false,
    state.remaining.map = 0;
}

function enableOverview() {
    state.enabled.overview   = true,
    state.remaining.overview = state.tipTotal.overview;

    showTipsForContext();
}

function disableOverview() {
    state.enabled.overview   = false,
    state.remaining.overview = 0;
}

function enableDetailStandard() {
    state.enabled.detailStandard   = true,
    state.remaining.detailStandard = state.tipTotal.detailStandard;

    showTipsForContext();
}

function disableDetailStandard() {
    state.enabled.detailStandard   = false,
    state.remaining.detailStandard = 0;
}

function enableDetailFunnel() {
    state.enabled.detailFunnel   = true,
    state.remaining.detailFunnel = state.tipTotal.detailFunnel;

    showTipsForContext();
}

function disableDetailFunnel() {
    state.enabled.detailFunnel   = false,
    state.remaining.detailFunnel = 0;
}

function disable() {
    if (Alloy.Globals.insights.state.current.context.apps.map) {
        disableMap();
    }

    if (Alloy.Globals.insights.state.current.context.apps.catOverview) {
        disableOverview();
    }

    if (Alloy.Globals.insights.state.current.context.apps.catDetailStandard) {
        disableDetailStandard();         
    }

    if (Alloy.Globals.insights.state.current.context.apps.catDetailFunnel) {
        disableDetailFunnel();         
    }

    if (state.callbacks.onDisable) { state.callbacks.onDisable(); }
}

function enable() {
    if (Alloy.Globals.insights.state.current.context.apps.map) {
        enableMap();
    }

    if (Alloy.Globals.insights.state.current.context.apps.catOverview) {
        enableOverview();
    }

    if (Alloy.Globals.insights.state.current.context.apps.catDetailStandard) {
        enableDetailStandard();      
    }

    if (Alloy.Globals.insights.state.current.context.apps.catDetailFunnel) {
        enableDetailFunnel();
    }

    if (state.callbacks.onEnable) { state.callbacks.onEnable(); }
}

function getParentView() {
    return $.parentView;
}

function clearTip(fromGoBack, fromGoForward) {
    if (state.currentTip && state.readyToDestroy) {
        state.readyToDestroy = false;

        destroyCurrentlyRenderedTip(fromGoBack, fromGoForward, function() {
            if (state.remaining[state.currentTipToShow] === 0) {
                Ti.API.info('All tips have now been seen for ' + state.currentTipToShow + ' ...');
                
                state.callbacks.onComplete = null;

                disable();
            }

            // destroy current tip
            $.tipContainer.animate({ opacity:(state.callbacks.onComplete) ? 1.0 : 0.0, duration:(state.callbacks.onComplete) ? 0 : 100 }, function() {
                $.tipContainer.remove(state.currentTip.parentView);
                state.currentTip.controllers.destroy();
                state.currentTip = null;

                if (!state.callbacks.onComplete) {
                    $.tipContainer.opacity = 0.0;
                }

                $.tipContainer.left = 0;

                $.parentView.touchEnabled = false;

                if (state.callbacks.onComplete) { state.callbacks.onComplete(); }
            });
        });
    }
}

function hide() {
    $.parentView.opacity = 0.0;
}

function show() {
    $.parentView.opacity = 1.0;
}

function isInit() {
    return state.init;
}

function showTipsForContext() {
    if (state.callbacks.showTipsForContext && !state.currentTip) { state.callbacks.showTipsForContext(); }
}

function init(config) {
    var _config = config || {};

    state.callbacks.showTipsForContext = _config.callbacks.showTipsForContext || null,
    state.callbacks.onEnable           = _config.callbacks.onEnable || null,
    state.callbacks.onDisable          = _config.callbacks.onDisable || null;

    // this is based on app configuration
    state.enabled.map            = _config.enabled.map,
    state.enabled.overview       = _config.enabled.overview,
    state.enabled.detailStandard = _config.enabled.detailStandard,
    state.enabled.detailFunnel   = _config.enabled.detailFunnel;

    $.parentView.remove($.tipContainer);

    $.parentView.addEventListener('pinch', function(e) {
        if (e.scale < 0.8) {
            if (state.currentTip) {
                state.currentTip.parentView.animate({ transform:Ti.UI.create2DMatrix({ scale:0.8 }), duration:100 }, function() {
                    disable();

                    state.callbacks.onComplete = null;

                    clearTip(false, false);
                });
            }
        }
    });

    $.parentView.addEventListener('swipe', function(e) {
        if (state.currentTip) {
            if (e.direction === 'right') {
                if (state.remaining[state.currentTipToShow] + 2 <= state.tipTotal[state.currentTipToShow]) {
                    state.remaining[state.currentTipToShow] += 2;

                    // go back, not forward
                    clearTip(true, false);
                } else {
                    if (state.currentTip) {
                        // at the first tip
                        state.currentTip.controllers.wiggle();
                    }
                }
            } else if (e.direction === 'left') {
                if (state.remaining[state.currentTipToShow] > 0) {
                    // do not go back, go foward
                    clearTip(false, true);
                } else {
                    // no more tips, close them for this section
                    clearTip(false, false);
                }
            }
        }
    });

    processTipData(state.tipsData);
    
    state.init = true;
}

exports._init          = init,
exports._isInit        = isInit,
exports._getParentView = getParentView,

exports._isMapEnabled            = isMapEnabled,
exports._enableMap               = enableMap,
exports._disableMap              = disableMap,
exports._isOverviewEnabled       = isOverviewEnabled,
exports._enableOverview          = enableOverview,
exports._disableOverview         = disableOverview,
exports._isDetailStandardEnabled = isDetailStandardEnabled,
exports._enableDetailStandard    = enableDetailStandard,
exports._disableDetailStandard   = disableDetailStandard,
exports._isDetailFunnelEnabled   = isDetailFunnelEnabled,
exports._enableDetailFunnel      = enableDetailFunnel,
exports._disableDetailFunnel     = disableDetailFunnel,

exports._enable             = enable,
exports._disable            = disable,
exports._showTips           = showTips,
exports._show               = show,
exports._showTipsForContext = showTipsForContext,
exports._hide               = hide;