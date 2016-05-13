// VIDEO CONTROLS: http://developer.vimeo.com/player/js-api

var video = {
    requestUrl: 'https://api.vimeo.com/videos/',
    at: '387f151985c423f8c8311z6e10f4d2a24',
    videoQualityValue: 'hls'
};

var state = {
    callbacks: {
        onUserGuideRequest: null,
        onVideoClose: null
    },
    videoId: null,
    videoUrl: null
};

function getVideoId(callback) {
    var _client   = Ti.Network.createHTTPClient({ timeout:10000 }),
        _callback = callback || function() {};

    _client.onload = function() {
        var _data = null;

        try {
            _data = JSON.parse(this.responseText);

            if (_data.intro.enabled) {
                state.videoId = _data.intro.id;

                _callback(false);
            } else {
                _callback(true, 'This video has been temporarily disabled as we update Insights video content.\n\nWe apologize for the inconvenience and hope you will try again in the near future.');
            }
        } catch(err) {
            Ti.API.info(err);
            _callback(true);
        }
    };

    _client.onerror = function() {
        Ti.API.info(this.responseText);

        _callback(true);
    };

    Ti.API.info(Alloy.Globals.insights.info[(Alloy.Globals.insights.state.debug) ? "preProdUrlBase" : "prodUrlBase"] + Alloy.Globals.insights.info.version.video);

    _client.open('GET',  Alloy.Globals.insights.info[(Alloy.Globals.insights.state.debug) ? "preProdUrlBase" : "prodUrlBase"] + Alloy.Globals.insights.info.version.video);
    _client.send();
}

function getVideoData(callback) {
    var _client   = Ti.Network.createHTTPClient({ validatesSecureCertificate:true, timeout:10000 }),
        _callback = callback || function() {};

    _client.onload = function() {
        var _data = null;

        Ti.API.info('onload:');
        Ti.API.info(this.responseText);

        try {
            _data = JSON.parse(this.responseText);
            
            if (_data.error) {
                Ti.API.info(_data);
                _callback(true);
            } else {
                for (var fi = 0, fil = _data.files.length; fi < fil; fi ++) {
                    if (_data.files[fi].quality === video.videoQualityValue) {
                        state.videoUrl = _data.files[fi].link;
                        break;
                    } 
                }

                _callback(false);
            }
        } catch(err) {
            Ti.API.info(err);
            _callback(true);
        }
    };

    _client.onerror = function() {
        Ti.API.info('onerror:');
        Ti.API.info(this.responseText);
        _callback(true);
    };

    Ti.API.info(video.requestUrl + state.videoId);
    Ti.API.info(video.at);
    
    _client.open('GET', video.requestUrl + state.videoId);
    _client.setRequestHeader('Authorization', 'Bearer ' + video.at);
    _client.setRequestHeader('Accept', '*/*'); // without this, we get a 500 error
    _client.send();
}

function throwVideoLoadError(customMessage) {
    var _alert = Ti.UI.createAlertDialog({ title:'Video Error', message:(!customMessage) ? 'There was an error loading the overview video.\n\nWe apologize for the inconvenience.\n\nWould you like to try again?' : customMessage, buttonNames:(!customMessage) ? ['Cancel', 'Retry'] : ['Ok'] });
    
    _alert.addEventListener('click', function(e) {
        if (e.index === 1) {
            loadVideo();
        } else {
            closeVideoView();
        }
    });

    $.loadingLblContainer.animate({ opacity:0.0, duration:250 }, function() {
        _alert.show();
    });
}

function loadVideo() {
    $.loadingLblContainer.animate({ opacity:1.0, duration:250 }, function() {
        getVideoId(function(error, customMessage) {
            if (error) {
                throwVideoLoadError(customMessage || null);
            } else {
                getVideoData(function(error) {
                    if (error) {
                        throwVideoLoadError();
                    } else {
                        $.videoView.url = state.videoUrl;
                    }
                });
            }
        });
    });    
}

function show() {
    Alloy.Globals.insights.appWin.add($.parentContainer);

    $.parentView.animate({ opacity:1.0, transform:Ti.UI.create2DMatrix({ scale:1.0 }), duration:250 }, loadVideo);
}

function openUserGuide(showWash) {
    var _alert = Ti.UI.createAlertDialog({
        title:'Open User Guide',
        message:'Would you like to close the overview video and view the Insights User Guide?',
        buttonNames: ['Cancel', 'Open User Guide']
    });

    $.videoView.pause();

    _alert.addEventListener('click', function(e) {
        if (e.index === 1) {
            // #TODO: this skips close, which will hide the wash
            hide(function() {
                state.callbacks.onUserGuideRequest(function() {
                    Ti.API.info('Opened user guide...');
                }, true);
            });
        }
    });
    
    _alert.show();
}

function hide(onComplete) {
    var _onComplete = onComplete || null;

    $.parentView.animate({ opacity:0.0, transform:Ti.UI.create2DMatrix({ scale:1.1 }), duration:250 }, function() {
        $.videoView.release();
        Alloy.Globals.insights.appWin.remove($.parentContainer);

        if (_onComplete) { _onComplete(); }
    });
}

function closeVideoView() {
    if (state.callbacks.onVideoClose) { state.callbacks.onVideoClose(); };
    
    Alloy.Globals.insights.controllers.wash.hide();
    hide();
}

function focusCloseBtn() {
    $.closeIcon.animate({ opacity:0.0, duration:100 });
    $.closeIconTouch.animate({ opacity:1.0, duration:100 });
}

function blurCloseBtn() {
    $.closeIcon.animate({ opacity:1.0, duration:100 });
    $.closeIconTouch.animate({ opacity:0.0, duration:100 });
}

function focusGuideBtn() {
    $.guideIcon.animate({ opacity:0.0, duration:100 });
    $.guideIconTouch.animate({ opacity:1.0, duration:100 });
}

function blurGuideBtn() {
    $.guideIcon.animate({ opacity:1.0, duration:100 });
    $.guideIconTouch.animate({ opacity:0.0, duration:100 });
}

function processPinch(e) {
    if (e.scale < 0.8) {
        $.parentContainer.animate({ transform:Ti.UI.create2DMatrix({ scale:0.8 }), duration:100 }, function() {
            closeVideoView();
        });
    }
}

function getParentView() {
    return $.parentContainer;
}

function init(config) {
    var _config = config || {};

    state.callbacks.onUserGuideRequest = _config.callbacks.onUserGuideRequest || null;
    state.callbacks.onVideoClose       = _config.callbacks.onVideoClose || null;

    $.parentView.transform = Ti.UI.create2DMatrix({ scale:1.1 });

    $.videoView.addEventListener('load', function() {
        $.loadingLblContainer.animate({ opacity:0.0, duration:250 });
    });

    $.parentContainer.addEventListener('pinch', processPinch);

    $.closeBtn.addEventListener('click', closeVideoView);
    $.closeBtn.addEventListener('touchstart', focusCloseBtn);
    $.closeBtn.addEventListener('touchend', blurCloseBtn);

    $.guideBtn.addEventListener('click', openUserGuide);
    $.guideBtn.addEventListener('touchstart', focusGuideBtn);
    $.guideBtn.addEventListener('touchend', blurGuideBtn);
}

exports._init          = init,
exports._getParentView = getParentView,
exports._show          = show,
exports._hide          = hide;