var insights = require('client/tiinsights')(); // #ATEMP

var browser = {
    transform: {
        in: Ti.UI.create2DMatrix({ scale:1.0 }),
        out: Ti.UI.create2DMatrix({ scale:1.2 })
    },
    loadingIndicator: null,
    webView: null
};

var state = {
    showing: false,
    canGoBack: false,
    canGoBack: false,
    beforeLoadFired: true
};

function focusCloseBtn() {
    $.closeBtn.animate({ opacity:0.0, duration:100 });
    $.closeBtnTouch.animate({ opacity:1.0, duration:100 });
}

function blurCloseBtn() {
    $.closeBtn.animate({ opacity:1.0, duration:100 });
    $.closeBtnTouch.animate({ opacity:0.0, duration:100 });
}

function focusBackBtn() {
    if (state.canGoBack) {
        $.backBtn.animate({ opacity:0.0, duration:100 });
        $.backBtnTouch.animate({ opacity:1.0, duration:100 });
    }
}

function blurBackBtn() {
    if (state.canGoBack) {
        $.backBtn.animate({ opacity:1.0, duration:100 });
        $.backBtnTouch.animate({ opacity:0.0, duration:100 });
    }
}

function focusRefreshBtn() {
    $.refreshBtn.animate({ opacity:0.0, duration:100 });
    $.refreshBtnTouch.animate({ opacity:1.0, duration:100 });
}

function blurRefreshBtn() {
    $.refreshBtn.animate({ opacity:1.0, duration:100 });
    $.refreshBtnTouch.animate({ opacity:0.0, duration:100 });
}

function focusForwardBtn() {
    if (state.canGoForward) {
        $.forwardBtn.animate({ opacity:0.0, duration:100 });
        $.forwardBtnTouch.animate({ opacity:1.0, duration:100 });
    }
}

function blurForwardBtn() {
    if (state.canGoForward) {
        $.forwardBtn.animate({ opacity:1.0, duration:100 });
        $.forwardBtnTouch.animate({ opacity:0.0, duration:100 });
    }
}

function onLoadStart(e) {
    if (state.showing && state.beforeLoadFired) {
        // FIX - UGH.... This will fire but not always get the resulting load event...
        state.beforeLoadFired = false;

        $.refreshBtnContainer.visible = false;

        Ti.API.info('LOAD START');

        browser.loadingIndicator.show();
    }
}

function onLoadEnd(e) {
    if (browser.webView) {
        state.canGoBack    = browser.webView.canGoBack(),
        state.canGoForward = browser.webView.canGoForward();
    }
    
    if (state.showing && !state.beforeLoadFired) {
        // FIX - UGH.... This will fire but not always get the resulting load event...
        state.beforeLoadFired = true;

        browser.loadingIndicator.hide();

        $.refreshBtnContainer.visible = true;

        if (state.canGoBack) {
            $.backBtnDisabled.animate({ opacity:0.0, duration:250 });
            $.backBtn.animate({ opacity:1.0, duration:250 });
        } else {
            $.backBtnDisabled.animate({ opacity:1.0, duration:250 });
            $.backBtn.animate({ opacity:0.0, duration:250 });
        }

        if (state.canGoForward) {
            $.forwardBtnDisabled.animate({ opacity:0.0, duration:250 });
            $.forwardBtn.animate({ opacity:1.0, duration:250 });
        } else {
            $.forwardBtnDisabled.animate({ opacity:1.0, duration:250 });
            $.forwardBtn.animate({ opacity:0.0, duration:250 });
        }
    }
}

function goBack() {
    if (state.showing && state.canGoBack && browser.webView) {
        if (Ti.Network.online) {
            browser.webView.goBack();
        } else {
            showError(goBack);
        }
    }
}

function goForward() {
    if (state.showing && state.canGoForward && browser.webView) {
        if (Ti.Network.online) {
            browser.webView.goForward();
        } else {
            showError(goForward);
        }
    }
}

function refresh() {
    if (state.showing && browser.webView) {
        if (Ti.Network.online) {
            browser.webView.reload();
        } else {
            showError(refresh);
        }
    }
}

function hide() {
    state.showing = false;

    function _cleanWebView() {
        $.webViewContainer.remove(browser.webView);
        browser.webView = null;

        $.parentContainer.removeEventListener('close', _cleanWebView);
    }

    $.parentContainer.addEventListener('close', _cleanWebView);

    $.parentContainer.close();
}

function showError(onRetry) {
    var _dialog = Ti.UI.createAlertDialog({ title:'Browser Error', buttonNames:['Cancel', 'Try Again'] });

    _dialog.message = 'An internet connection is required to complete this request. Please check your connection.\n\nWould you like to try again?';

    _dialog.addEventListener('click', function(e) {
        if (e.index === 1) {
            onRetry();
        }
    });

    _dialog.show();
}

function show(title, url) {
    if (Ti.Network.online) {
        state.showing = true;

        browser.webView = Ti.UI.createWebView({
            enableZoomControls: false,
            width: Ti.UI.FILL,
            height: Ti.UI.FILL,
            hideLoadIndicator: true,
            softKeyboardOnFocus: Ti.UI.Android.SOFT_KEYBOARD_HIDE_ON_FOCUS
        });

        browser.webView.addEventListener('beforeload', onLoadStart);
        browser.webView.addEventListener('load', onLoadEnd);

        $.webViewContainer.add(browser.webView);

        browser.webView.url = url;
        $.pageTitleLbl.text = title;

        $.parentContainer.open();
    } else {
        showError(function() {
            show(title, url);
        });
    }
}

function getParentView() {
    return $.parentContainer;
}

function init(config) {
    browser.loadingIndicator = Ti.UI.createActivityIndicator({
        width: 50,
        height: 50,
        right: 50,
        touchEnabled: false
    });

    $.closeBtnContainer.addEventListener('click', hide);
    $.closeBtnContainer.addEventListener('touchstart', focusCloseBtn);
    $.closeBtnContainer.addEventListener('touchend', blurCloseBtn);

    $.backBtnContainer.addEventListener('click', goBack);
    $.backBtnContainer.addEventListener('touchstart', focusBackBtn);
    $.backBtnContainer.addEventListener('touchend', blurBackBtn);

    $.refreshBtnContainer.addEventListener('click', refresh);
    $.refreshBtnContainer.addEventListener('touchstart', focusRefreshBtn);
    $.refreshBtnContainer.addEventListener('touchend', blurRefreshBtn);

    $.forwardBtnContainer.addEventListener('click', goForward);
    $.forwardBtnContainer.addEventListener('touchstart', focusForwardBtn);
    $.forwardBtnContainer.addEventListener('touchend', blurForwardBtn);

    $.navContainer.add(browser.loadingIndicator);
}

exports._init          = init,
exports._getParentView = getParentView,
exports._show          = show,
exports._hide          = hide;