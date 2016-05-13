var welcome = {};

var lib = {
    scaler: require('client/scaler')()
};

var state = {
    callbacks: {
        onUserGuideRequest: null
    }
};

// #TODO: kill this context
function close() {
    $.parentView.parent.remove($.parentView);
}

function show() {}

function hide(onComplete) {
    $.parentView.animate({ transform:Ti.UI.create2DMatrix({ scale:0.8 }), opacity:0.0, duration:100 }, function() {
        if (onComplete) { onComplete(); }
        close();
    });
}

// #TODO: nested function
function gotoNext() {
    var _alert = null;

    function _showVideo() {
        _video = Alloy.createController('video');

        _video._init({
            callbacks: {
                onUserGuideRequest: state.callbacks.onUserGuideRequest,
                onVideoClose: state.callbacks.onVideoClose
            }
        });

        _video._show();
    }

    // #TEMP: for 2.0.0 release
    // if (Ti.Network.online) {
    //     hide(_showVideo);
    // } else {
    //     _alert = Ti.UI.createAlertDialog({ 
    //         title: 'Connection Error', 
    //         message: 'We\'re unable show you an overview of Insights, as video playback requires an Internet connection. Please check your connection and try again.\n\nAdditional help can be found from the top help and right app menus.', 
    //         buttonNames: ['Start Using Insights', 'Try Again']
    //     });
    
    //     _alert.addEventListener('click', function(e) {
    //         if (e.index === 0) {
    //             hide(Alloy.Globals.insights.controllers.wash.hide);
    //         } else if (e.index === 1) {
    //             gotoNext();
    //         }
    //     });

    //     _alert.show();
    // }

    // #TEMP: for 2.0.0 release
    hide(function() {
        state.callbacks.onUserGuideRequest(function() {
            Ti.API.info('Opened user guide...');
        }, true);
    });
}

function focusVideoMsgBtn(e) {
    $.videoMsgLbl.animate({ opacity:0.0, duration:100 });
    $.videoMsgLblTouch.animate({ opacity:1.0, duration:100 });
}

function blurVideoMsgBtn(e) {
    $.videoMsgLbl.animate({ opacity:1.0, duration:100 });
    $.videoMsgLblTouch.animate({ opacity:0.0, duration:100 });
}

function getParentView() {
    return $.parentView;
}

function scale() {
    // YAY!
    $.contentView.width = lib.scaler.sv(335, !Alloy.Globals.insights.state.android.xLarge),
    $.contentView.height = lib.scaler.sv(530, !Alloy.Globals.insights.state.android.xLarge),
    $.contentContainer.height = lib.scaler.sv(490, !Alloy.Globals.insights.state.android.xLarge),
    $.welcomeView.width = lib.scaler.sv(295, !Alloy.Globals.insights.state.android.xLarge),
    $.welcomeView.height = lib.scaler.sv(445, !Alloy.Globals.insights.state.android.xLarge),
    $.welcomeView.top = lib.scaler.sv(20, !Alloy.Globals.insights.state.android.xLarge),
    $.navContainer.height = lib.scaler.sv(50, !Alloy.Globals.insights.state.android.xLarge),
    $.videoMsgLbl.font.fontSize = lib.scaler.sv(14, !Alloy.Globals.insights.state.android.xLarge),
    $.videoMsgLblTouch.font.fontSize = lib.scaler.sv(14, !Alloy.Globals.insights.state.android.xLarge);
}

function init(config) {
    var _config = config || {};

    state.callbacks.onUserGuideRequest = _config.callbacks.onUserGuideRequest || null;
    state.callbacks.onVideoClose       = _config.callbacks.onVideoClose || null;

    scale();

    $.contentView.addEventListener('click', gotoNext);
    $.contentView.addEventListener('touchstart', focusVideoMsgBtn);
    $.contentView.addEventListener('touchend', blurVideoMsgBtn);
}

exports._init          = init,
exports._getParentView = getParentView,
exports._show          = show,
exports._hide          = hide;