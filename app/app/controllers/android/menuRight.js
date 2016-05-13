// #TODO: callbacks should be consolidated...

var menu = {
    open: false,
    transform: null,
    delta: {
        start: 0,
        end: 0
    },
    callbacks: {
        onCloseMenu: null
    },
    tipsRowIndex: 2,
    feedbackRowIndex: 3,
    aboutRowIndex: 5,
    debugMenuRowIndex: 6,
    versionRowIndex: 7,
    indentStepWidth: 24,
    rows: [
        {
            title: 'Insights Help',
            onSelect: null,
            indent: false,
            indentSteps: 0,
            debugItem: false
        },
        {
            title: 'What am I looking at?',
            onSelect: toggleTips,
            indent: true,
            indentSteps: 1,
            debugItem: false
        },
        {
            title: 'View User Guide',
            onSelect: openUserGuide,
            indent: true,
            indentSteps: 1,
            debugItem: false
        },
        {
            title: 'Submit Feedback',
            onSelect: showFeedbackMenu,
            indent: false,
            indentSteps: 0,
            debugItem: false,
            feedbackRow: true
        },
        {
            title: 'Privacy Policy',
            onSelect: openPrivacyPolicy,
            indent: false,
            indentSteps: 0,
            debugItem: false
        },
        {
            title: 'About Insights',
            onSelect: openAbout,
            indent: false,
            indentSteps: 0,
            debugItem: false,
            aboutRow: true
        },
        {
            title: 'Debug',
            onSelect: showDebugMenu,
            indent: false,
            indentSteps: 0,
            debugItem: true,
            debugRow: true
        },
        {
            title: 'versionNum',
            onSelect: toggleVersion,
            indent: false,
            indentSteps: 0,
            debugItem: true,
            versionRow: true
        }
    ]
};

var state = {
    focusedRowIndex: -1,
    menuRows: [],
    browser: null,
    callbacks: {
        onCloseMenu: null,
        onOpenMenu: null,
        onUpdateRequest: null,
        onShowLoginRequest: null,
        onLogoutRequest: null,
        onUserGuideRequest: null
    },
    viewingDark: false
};

var lib = {
    appInfo: require('client/appInfo')(),
    events: require('client/events')(),
    scaler: require('client/scaler')()
};

function getParentView() {
    return $.parentContainer;
}

function toggleVersion() {
    if (state.menuRows[menu.versionRowIndex].controllers.getTitle() === Alloy.Globals.insights.info.version.codename) {
        state.menuRows[menu.versionRowIndex].controllers.setTitle(lib.appInfo.getVersionAsString());
    } else {
        state.menuRows[menu.versionRowIndex].controllers.setTitle(Alloy.Globals.insights.info.version.codename);
    }
}

function openRequestEmail() {
    var _emailDialog = Ti.UI.createEmailDialog({ subject:'Insights Debug Data', toRecipients:['support@appcelerator.com'] });

    if (Alloy.Globals.insights.calls.length > 0) {
        _emailDialog.messageBody = 'Insights Build Number: TBD\n\n##### CALLS #####\n\nCall Order: session data, week/day data, month/quarter data\n\n' + Alloy.Globals.insights.calls + '\n\n##### DATA #####\n\n' + JSON.stringify(Alloy.Globals.insights.data);
        _emailDialog.open();
    } else {
        alert('Please change to a production application. Are you looking at demo data?');
    }
}

function showDebugMenu(e) {
    //debugMenuRowIndex
    var _menu = Ti.UI.createOptionDialog({ buttonNames:['Send Request Data', (Alloy.Globals.insights.state.preProd) ? 'ENV: Pre-production (toggle)' : 'ENV: Production (toggle)'] });

    _menu.addEventListener('click', function(e) {
        _menu.hide();

        switch (e.index) {
            case 0:
                openRequestEmail();
                break;
            case 1:
                Alloy.Globals.insights.state.singleAppMode = false;         

                // log the user out...
                // messy, but who cares...
                if (Alloy.Globals.insights.state.loggedIn) {
                    hideMenu(
                        {}, 
                        function() {
                            state.callbacks.onLogoutRequest(function() {
                                // toggle pre-production flag...
                                // we need to do this after logout...
                                Alloy.Globals.insights.state.preProd = !Alloy.Globals.insights.state.preProd;
                                alert((Alloy.Globals.insights.state.preProd) ? 'ENV: Pre-production enabled...' : 'ENV: Production enabled...');
                            });
                        }, 
                        true);
                } else {
                    Alloy.Globals.insights.state.preProd = !Alloy.Globals.insights.state.preProd;
                    alert((Alloy.Globals.insights.state.preProd) ? 'ENV: Pre-production enabled...' : 'ENV: Production enabled...');
                }

                break;
            default: break;
        }
    });

    _menu.show();
}

// #TODO: nested functions
function openOverviewVideo() {
    var _video = null,
        _alert = null;

    function _showVideo() {
        _video = Alloy.createController('video');

        _video._init({
            callbacks: {
                onUserGuideRequest: state.callbacks.onUserGuideRequest
            }
        });

        Alloy.Globals.insights.controllers.wash.show(false, function() {
            if (Alloy.Globals.insights.state.menuRightVisible) {
                hideMenu({}, function() {            
                    _video._show();
                }, true);
            } else {
                _video._show();
            }
        });
    }

    if (Ti.Network.online) {
        _showVideo();
    } else {
        _alert = Ti.UI.createAlertDialog({ title:'Connection Error', message:'Video playback requires an Internet connection. Please check your connection and try again.\n\nAlternatively, you can check out the offline-capable Insights User Guide.', buttonNames:['Cancel', 'Try Again', 'Open User Guide'] });
    
        _alert.addEventListener('click', function(e) {
            if (e.index === 1) {
                openOverviewVideo();
            } else if (e.index === 2) {
                openUserGuide();
            }
        });

        _alert.show();
    }
}

function openUserGuide(showWash) {
    Alloy.Globals.insights.controllers.wash.show();

    state.callbacks.onUserGuideRequest(function() {
        Ti.API.info('Opened user guide...');
    }, true);
}

// #TODO: CONFIRM THAT SUBMIT FEEDBACK FLOW WORKS FOR LOGGED IN AND OUT STATES
// #TODO: CONFIRM EMAIL ON DEVICE
// #TODO #workaround - Don't hardcode, read value...
function openBugReportDialog() {
    var _emailDialog = Ti.UI.createEmailDialog({ subject:'Insights Bug Report - v' + lib.appInfo.getVersionAsString() + ' - Android', toRecipients:['platform-feedback@appcelerator.com'] });

    _emailDialog.messageBody = 'Please describe the issue:\n\n\n' + 'If possible, please provide the steps to reproduce the issue:\n\n\nAny additional details?\n\n\nMay we contact you via email in regards to this report? Yes / No\n\n--------------------\n- Insights v' + lib.appInfo.getVersionAsString() + '\n - ' + Ti.Platform.model + ' ' + Ti.Platform.version + ' ' + Ti.Platform.architecture;

    _emailDialog.addEventListener('complete', function(e) {
        var _dialog = null;

        switch (e.result) {
            // #ANDROID: #BUG: We won't show a sent state alert as this also happens if the user discards. Sent as a state makes absolutely no sense if the user discards... I guess we can't tell what the user does to distinguish?
            // case _emailDialog.SENT:
            //     _dialog = Ti.UI.createAlertDialog({ title:'Thank You', message:'Your bug report has been submitted.' });
            //     _dialog.show();
            //     break;
            case _emailDialog.FAILED:
                // #APPTS-3835
                _dialog = Ti.UI.createAlertDialog({ title:'Email Error', message:'Your bug report could not be sent due to an error. Please check your email configuration, network connection, and try again.\n\nWe apologize for any inconvenience.' });
                _dialog.show();
                break;
            default: break;
        }
    });

    _emailDialog.open();
}

function showFeedbackMenu() {
    hideMenu({}, function() {
        var _bg        = Ti.UI.createView({ width:Ti.UI.FILL, height:Ti.UI.FILL, backgroundColor:'#e6e6e6' }),
            _container = Ti.UI.createView({ width:lib.scaler.sv(400, true), height:Ti.UI.FILL }),
            _reportBtn = Ti.UI.createView({ width:lib.scaler.sv(95, true), height:lib.scaler.sv(149, true), left:lib.scaler.sv(40, true), backgroundImage:'/images/nav/feedback-menu-report-btn.png' }),
            _surveyBtn = Ti.UI.createView({ width:lib.scaler.sv(95, true), height:lib.scaler.sv(149, true), right:lib.scaler.sv(40, true), backgroundImage:'/images/nav/feedback-menu-survey-btn.png' });

        var _menu = Ti.UI.createOptionDialog({ reportTapped:false, androidView:_bg });

        _reportBtn.addEventListener('click', function() {
            _menu.hide();
            openBugReportDialog();
        });

        _surveyBtn.addEventListener('click', function() {
            _menu.hide();
            openFeedback();
        });

        // the container helps us to auto center
        _container.add(_reportBtn);
        _container.add(_surveyBtn);

        _bg.add(_container);

        _menu.show();
    }, false);
}

function showInsightsFeedbackAlert() {
    var _dialog = Ti.UI.createAlertDialog({ 
        title: 'Insights Feedback', 
        message: 'Your opinion is critical.\n\nBefore we get started, you can choose to either submit anonymously or with your email address.\n\nBy incuding your email address, you are agreeing to allow us to contact you regarding your feedback.',
        // #BUG: can't show more than 3 buttons; probably platform constraint
        buttonNames: ['Cancel', /*'View Privacy Policy',*/ 'Submit Anonymously', 'Submit w/ Email Address']
    });

    _dialog.addEventListener('click', function(e) {
        switch (e.index) {
            // case 1:
            //     openPrivacyPolicy();
            //     break;
            case 1:
                lib.events.fireEvent(lib.events.EVT.HOME.SURVEY);
                state.browser._show('Appcelerator Insights Feedback  |  Submitting anonymously...', 'https://www.surveymonkey.com/s/QX7XLW5');
                break;
            case 2:
                lib.events.fireEvent(lib.events.EVT.HOME.SURVEY);
                state.browser._show('Appcelerator Insights Feedback  |  Submitting w/ email address...', 'https://www.surveymonkey.com/s/QX7XLW5?c=' + Alloy.Globals.insights.state.currentUserEmailAddress);
                break;
            default: break;
        }
        
    });

    _dialog.show();
}

function openFeedback() {
    var _dialog = null,
        _error  = null;

    if (Alloy.Globals.insights.state.loggedIn) {
        showInsightsFeedbackAlert();
    } else {
        _error = Ti.UI.createAlertDialog({
            title: 'Feedback Error',
            message: 'Thank you for your interest.\n\nTo submit feedback, you must be logged in to your Appcelerator Platform account.\n\nWould you like to login now?',
            buttonNames: ['Cancel', 'Login']
        });

        _error.addEventListener('click', function(e) {
            // show login UI
            if (e.index === 1) {
                Alloy.Globals.insights.state.postLoginMethod = showInsightsFeedbackAlert;
                Alloy.Globals.insights.state.loginVisible = true;
                Alloy.Globals.insights.controllers.wash.show();
                state.callbacks.onShowLoginRequest();
            } else {
                Alloy.Globals.insights.state.postLoginMethod = null;
            }
        });

        _error.show();
    }
}

function openPrivacyPolicy() {
    state.browser._show('Appcelerator Privacy Policy', 'http://www.appcelerator.com/privacy/');
}

function openAbout() {
    var _bg         = Ti.UI.createView({ touchEnabled:false, width:lib.scaler.sv(335, false), height:lib.scaler.sv(579, false) }),
        _content    = Ti.UI.createView({ top:0, touchEnabled:false, width:lib.scaler.sv(225, false), height:lib.scaler.sv(542, false), backgroundImage:'/images/about/bg.png' }),
        _versionLbl = Ti.UI.createLabel({ touchEnabled:false, font:{ fontFamily: "TitilliumText22L-250wt", fontSize:lib.scaler.sv(12, false) }, color:'#999', bottom:0, text:'Insights v' + lib.appInfo.getVersionAsString(), width:Ti.UI.SIZE, height:Ti.UI.SIZE, includeFontPadding:false /* #WORKAROUND */ });

    var _menu = Ti.UI.createWindow({ orientationModes: [Ti.UI.LANDSCAPE_RIGHT, Ti.UI.LANDSCAPE_LEFT], backgroundColor:'#e6e6e6', width:Ti.UI.FILL, height:Ti.UI.FILL, fullscreen:true, navBarHidden:true });

    _menu.addEventListener('click', function(e) {
        e.source.close();
        // #REJECT: APPLE
        // _menu.hide();
        // lib.events.fireEvent(lib.events.EVT.HOME.INFO);
        // state.browser._show('The Appcelerator Platform', 'http://www.appcelerator.com/platform/appcelerator-platform/');
    });

    _bg.add(_content);
    _bg.add(_versionLbl);

    _menu.add(_bg);

    _menu.open();
}

function createMenuRow(rowData, index) {
    var _menuRow = {
        parent: null
    };

    var _debugIcon  = null,
        _indentIcon = null,
        _bar        = null,
        _lbl        = null,
        _row        = null;

    _menuRow.state = {
        index: index,
        focusedRowIndex: -1
    };

    _menuRow.controllers = {
        focusRow: function() {
            // On Android, we will simply cause the focus element to immediately hide after touch start...
            state.focusedRowIndex = _menuRow.state.index;
            _menuRow.views.focusBg.animate({ opacity:1.0, duration:0 }, function() {
                state.focusedRowIndex = -1;
                _menuRow.views.focusBg.animate({ opacity:0.0, duration:100 });
            });
        },
        blurRow: function() {
            // state.focusedRowIndex = -1;
            _menuRow.views.focusBg.animate({ opacity:0.0, duration:100 });
        },
        getTitle: function() {
            return _lbl.text;
        },
        setTitle: function(title) {
            _lbl.text = title;
        },
        setColor: function(color) {
            _lbl.color = color;
        },
        getMenuView: function() {
            return _menuRow.views.menuView;
        },
        // #TODO: this doesn't get destroyed today...
        destroy: function() {}
    };

    _menuRow.views = {
        focusBg: Ti.UI.createView({ touchEnabled:false, opacity:0.0, backgroundColor:'#999', width:Ti.UI.FILL, height:Ti.UI.FILL })
    };

    _menuRow.parent = Ti.UI.createTableViewRow({ className:'menuRow', backgroundImage:'', backgroundColor:'transparent', backgroundSelectedColor:'transparent', width:Ti.UI.FILL, height:50 });

    // used for popovers
    _menuRow.views.menuView = Ti.UI.createView({ width:346, height:Ti.UI.FILL, touchEnabled:false });

    _bar = Ti.UI.createView({ touchEnabled:false, height:1, left:0, right:50, backgroundColor:'#969696', bottom:0 });

    _lbl = Ti.UI.createLabel({
        font: {
            fontFamily: "TitilliumText22L-1wt",
            fontSize: 16
        },
        color: '#333',
        height: Ti.UI.SIZE,
        // #TODO: Scale correctly, if needed
        left: (rowData.debugItem) ? 74 : (rowData.indent && rowData.indentSteps) ? (menu.indentStepWidth * rowData.indentSteps) + 40 : 40,
        right: 50,
        text: (rowData.versionRow) ? lib.appInfo.getVersionAsString() : rowData.title,
        touchEnabled: false,
        includeFontPadding:false // #WORKAROUND
    });

    _menuRow.parent.add(_menuRow.views.focusBg);

    if (rowData.debugItem) {
        _debugIcon = Ti.UI.createView({ touchEnabled:false, backgroundImage:'/images/nav/debug-icon.png', touchEnabled:false, width:50, height:50, left:24 });
        _menuRow.parent.add(_debugIcon);
    }

    if (rowData.indent) {
        _indentIcon = Ti.UI.createView({ touchEnabled:false, backgroundImage:'/images/nav/indent-icon-1x.png', touchEnabled:false, width:50, height:50, left:24 });
        _menuRow.parent.add(_indentIcon);
    }

    _menuRow.parent.add(_menuRow.views.menuView);
    _menuRow.parent.add(_bar);
    _menuRow.parent.add(_lbl);

    _menuRow.parent.addEventListener('touchstart', _menuRow.controllers.focusRow);
    // _menuRow.parent.addEventListener('touchend', _menuRow.controllers.blurRow); // #BUG

    return _menuRow;
}

function generateMenuRows() {
    var _menuRows  = [],
        _menuRow   = null,
        _rowCounter = 0;

    for (var ri = 0, rl = menu.rows.length; ri < rl; ri++) {
        if ((menu.rows[ri].debugItem && Alloy.Globals.insights.state.debug) || !menu.rows[ri].debugItem) {
            _menuRow = createMenuRow(menu.rows[ri], _rowCounter);
            
            _menuRows.push(_menuRow.parent);
            state.menuRows.push(_menuRow);

            _rowCounter ++;
        }
    }

    $.menuList.data = _menuRows;
}

// #BUG this method is not used on Android
function processMenuListScroll() {
    if (state.focusedRowIndex !== -1) {
        state.menuRows[state.focusedRowIndex].controllers.blurRow();
    }
}

function processMenuListTap(e) {
    // #BUG? have to explicitly check for null...
    if (menu.rows[e.index].onSelect !== null) {
        menu.rows[e.index].onSelect(e);
    }
}

function showMenuManual() {
    showMenu({ type:'manual' });
}

function hideMenuManual() {
    hideMenu({ type:'manual' });
}

// #BUG
function processMenuListTapStart(e) {
    // as we are filtering all table touches to this handler, we must filter out non-existing rows...
    if (e.index !== null && state.menuRows[e.index]) {
        state.menuRows[e.index].controllers.focusRow();
    }
}

// SEE FILE HISTORY
function showHelpMenu() {
    var _bg        = Ti.UI.createView({ width:Ti.UI.FILL, height:Ti.UI.FILL, backgroundColor:'#e6e6e6' }),
        _container = Ti.UI.createView({ width:lib.scaler.sv(400, true), height:Ti.UI.FILL }),
        _tipsBtn   = Ti.UI.createView({ width:lib.scaler.sv(89, true), height:lib.scaler.sv(149, true), left:lib.scaler.sv(40, true), backgroundImage:'/images/nav/help-menu-tips-show-btn.png' }),
        _guideBtn  = Ti.UI.createView({ width:lib.scaler.sv(91, true), height:lib.scaler.sv(149, true), right:lib.scaler.sv(40, true), backgroundImage:'/images/nav/help-menu-user-guide-btn.png' });

    var _menu = Ti.UI.createOptionDialog({ androidView: _bg });

    _tipsBtn.addEventListener('click', function() {
        _menu.hide();
        toggleTips();
    });

    _guideBtn.addEventListener('click', function() {
        _menu.hide();
        openUserGuide(true);
    });

    _container.add(_tipsBtn);
    _container.add(_guideBtn);

    _bg.add(_container);

    _menu.show();
}

function showMenu(e) {
    var _source = e.source || {};
        _id     = _source.id || null;

    if (!menu.open && !Alloy.Globals.insights.state.menuLeftVisible) {
        menu.open = true;
        Alloy.Globals.insights.state.menuRightVisible = true; // prevent both menus from being open at once

        if (_id === 'overlayBtnContainer') {
            focusMoreBtn();
            // if (state.viewingDark) {
            //     $.moreBtnDark.opacity = 0.0;
            // } else {
            //     $.moreBtnLight.opacity = 0.0;
            // }

            // $.moreBtnTouch.opacity = 1.0;
        }

        notifyMenuIsShowing();

        if (!e.preventCallback) {
            state.callbacks.onOpenMenu();
        }
    }

    if (!Alloy.Globals.insights.state.menuLeftVisible) {
        // this will bounce if the menu is still open
        $.parentContainer.animate({ transform:Ti.UI.create2DMatrix({ scale:1.0 }), right:-6, duration:150, curve:Ti.UI.ANIMATION_CURVE_EASE_IN }, function() {
            // if we don't check this callback, it will be possible to open both menus
            if (menu.open) {
                $.parentContainer.animate({ right:-10, duration:100 }, function(){
                    $.headerContentContainer.animate({ opacity:1.0, duration:250 });
                });
            }
        });
    }
}

function hideMenu(e, callback, preventHideWash) {
    if (menu.open) {
        menu.open = Alloy.Globals.insights.state.menuRightVisible = false;

        if (!e.preventCallback) {
            state.callbacks.onCloseMenu(preventHideWash);
        }

        $.parentContainer.animate({ transform:Ti.UI.create2DMatrix({ scale:1.2 }), right:-402, duration:250 }, function() {
            notifyMenuIsHidden();

            if (callback) {
                callback();
            }

            $.headerContentContainer.opacity = 0.0;
        });
    }
}

function notifyMenuIsShowing() {
    $.overlayBtnContainer.animate({ opacity:0.0, duration:250 });
}

function notifyMenuIsHidden() {
    $.overlayBtnContainer.animate({ opacity:1.0, duration:250 });
}

function isOpen() {
    return menu.open;
}

function getOverlayBtnContainer() {
    return $.overlayBtnContainer;
}

function focusMoreBtn() {
    if (state.viewingDark) {
        $.moreBtnDark.animate({ opacity:0.0, duration:100 }, function() {
            $.moreBtnLight.opacity = 0.0;
            $.moreBtnDark.animate({ opacity:1.0, duration:100 });
        });
    } else {
        $.moreBtnLight.animate({ opacity:0.0, duration:100 }, function() {
            $.moreBtnDark.opacity = 0.0;
            $.moreBtnLight.animate({ opacity:1.0, duration:100 });
        });
    }

    // $.moreBtnTouch.animate({ opacity:1.0, duration:100 });
}

function processSwipe(e) {
    if (e.direction === 'right') {
        hideMenu(e);
    } else if (e.direction === 'left') {
        showMenu(e);
    }
}

function blurMoreBtn() {
    if (state.viewingDark) {
        $.moreBtnLight.opacity = 0.0;
        $.moreBtnDark.animate({ opacity:1.0, duration:100 });
    } else {
        $.moreBtnDark.opacity = 0.0;
        $.moreBtnLight.animate({ opacity:1.0, duration:100 });
    }

    $.moreBtnTouch.animate({ opacity:0.0, duration:100 });
}

function focusBackBtn() {
    $.backBtn.animate({ opacity:0.0, duration:100 }, function() {
        $.backBtn.animate({ opacity:1.0, duration:100 });
    });

    $.backBtnTouch.animate({ opacity:1.0, duration:100 }, function() {
        $.backBtnTouch.animate({ opacity:0.0, duration:100 });
    });
}

function blurBackBtn() {
    $.backBtn.animate({ opacity:1.0, duration:100 });
    $.backBtnTouch.animate({ opacity:0.0, duration:100 });
}

// this also adjusts help icon
function showLogoRed() {
    $.logoRed.animate({ opacity:1.0, duration:250 });
    $.logoWhite.animate({ opacity:0.0, duration:250 });

    $.helpLight.animate({ opacity:1.0, duration:250 });
    $.helpDark.animate({ opacity:0.0, duration:250 });
}

// this also adjusts help icon
function showLogoWhite() {
    $.logoRed.animate({ opacity:0.0, duration:250 });
    $.logoWhite.animate({ opacity:1.0, duration:250 });

    $.helpLight.animate({ opacity:0.0, duration:250 });
    $.helpDark.animate({ opacity:1.0, duration:250 });
}

function showMoreBtnDark() {
    state.viewingDark = true;
    $.moreBtnLight.animate({ opacity:0.0, duration:250 });
    $.moreBtnDark.animate({ opacity:1.0, duration:250 });
}

function showMoreBtnLight() {
    state.viewingDark = false;
    $.moreBtnLight.animate({ opacity:1.0, duration:250 });
    $.moreBtnDark.animate({ opacity:0.0, duration:250 });
}

function processEvents(events) {
    var _events = events || {};

    if (_events.onShowLogoRed) {
        showLogoRed();
        showMoreBtnLight();
    }

    if (_events.onShowLogoWhite) {
        showLogoWhite();
        showMoreBtnDark();
    }
}

function onLogin() {
    $.loginLbl.text = 'Logout';
    $.currentUsername.text = Alloy.Globals.insights.state.currentUserEmailAddress;
}

function onLogout() {
    $.loginLbl.text = 'Login';
    $.currentUsername.text = 'to view your production apps...';
}

function processLoginLogout() {
    var _dialog = null;

    if (Alloy.Globals.insights.state.loggedIn) {
        _dialog = Ti.UI.createAlertDialog({ title:'Confirm Logout', message:'Are you sure you would like to log out of your account?', buttonNames:['Cancel', 'Logout'] });

        _dialog.addEventListener('click', function(e) {
            if (e.index === 1) {
                lib.events.fireEvent(lib.events.EVT.HOME.LOGOUT);
                hideMenu({}, state.callbacks.onLogoutRequest, true);
            }
        });

        _dialog.show();
    } else {
        Alloy.Globals.insights.state.loginVisible = true;
        hideMenu({}, state.callbacks.onShowLoginRequest, true);
    }
}

function focusLoginBtn(e) {
    $.loginBg.animate({ opacity:0.0, duration:100 }, function() {
        $.loginBg.animate({ opacity:1.0, duration:100 });
    });

    $.loginBgTouch.animate({ opacity:1.0, duration:100 }, function() {
        $.loginBgTouch.animate({ opacity:0.0, duration:100 });
    });
}

function blurLoginBtn(e) {
    $.loginBg.animate({ opacity:1.0, duration:100 });
    $.loginBgTouch.animate({ opacity:0.0, duration:100 });
}

function toggleTips() {
    if (menu.open) {
        hideMenu({}, Alloy.Globals.insights.controllers.tips._enable, false);
    } else {
        Alloy.Globals.insights.controllers.tips._enable();
    }
}

function init(config) {
    var _config = config || {};

    state.callbacks.onCloseMenu        = _config.callbacks.onCloseMenu,
    state.callbacks.onOpenMenu         = _config.callbacks.onOpenMenu,
    state.callbacks.onUpdateRequest    = _config.callbacks.onUpdateRequest,
    state.callbacks.onShowLoginRequest = _config.callbacks.onShowLoginRequest,
    state.callbacks.onLogoutRequest    = _config.callbacks.onLogoutRequest,
    state.callbacks.onUserGuideRequest = _config.callbacks.onUserGuideRequest;

    state.browser = _config.browser; 

    generateMenuRows();

    $.parentContainer.transform = Ti.UI.create2DMatrix({ scale:1.2 });

    $.parentContainer.addEventListener('swipe', processSwipe);

    $.helpBtnContainer.addEventListener('click', showHelpMenu);

    $.overlayBtnContainer.addEventListener('touchstart', showMenu);
    // $.overlayBtnContainer.addEventListener('touchstart', focusMoreBtn);
    // $.overlayBtnContainer.addEventListener('touchend', blurMoreBtn);

    $.headerContainer.addEventListener('click', hideMenu);
    $.headerContainer.addEventListener('touchstart', focusBackBtn);
    // $.headerContainer.addEventListener('touchend', blurBackBtn);

    $.loginContainer.addEventListener('click', processLoginLogout);
    $.loginContainer.addEventListener('touchstart', focusLoginBtn);
    // $.loginContainer.addEventListener('touchend', blurLoginBtn);

    // $.menuList.addEventListener('scroll', processMenuListScroll); // #BUG
    $.menuList.addEventListener('click', processMenuListTap);
    $.menuList.addEventListener('touchstart', processMenuListTapStart); // #BUG
}

exports._isOpen                 = isOpen,
exports._getParentView          = getParentView,
exports._getOverlayBtnContainer = getOverlayBtnContainer,
exports._hideMenu               = hideMenu,
exports._showMenu               = showMenu,
exports._onLogin                = onLogin,
exports._onLogout               = onLogout,
exports._processEvents          = processEvents,
exports._toggleTips             = toggleTips,
exports._init                   = init;