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
    feedbackRowIndex: 4,
    aboutRowIndex: 6,
    debugMenuRowIndex: 7,
    versionRowIndex: 8,
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
            title: 'Watch Overview Video',
            onSelect: openOverviewVideo,
            indent: true,
            indentSteps: 1,
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
    events: require('client/events')()
};

function getParentView() {
    return $.parentContainer;
}

function toggleVersion(e) {
    if (e.source.versionRow) {
        if (state.menuRows[e.index].controllers.getTitle() === Alloy.Globals.insights.info.version.codename) {
            state.menuRows[e.index].controllers.setTitle(lib.appInfo.getVersionAsString());
        } else {
            state.menuRows[e.index].controllers.setTitle(Alloy.Globals.insights.info.version.codename);
        }
    }
}

function openRequestEmail() {
    // #BUG iOS8, will not open unless right menu is closed first
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
    var _menu = Ti.UI.iPad.createPopover({
        width: 335,
        height: Ti.UI.SIZE,
        title: 'Debug Menu (' + lib.appInfo.getVersionAsString() + ')',
        // #BUG: this doesn't seem to work...
        tintColor: "#c41230"
    });

    var _table = Ti.UI.createTableView({ backgroundImage:'', width:Ti.UI.FILL, height:Ti.UI.SIZE });

    var _rows = [
        {
            title: 'Send Request Data...',
            onSelect: function() {
                _menu.hide();
                hideMenu({}, function() { openRequestEmail(); }, false);
            },
            active: true
        },
        {
            title: (Alloy.Globals.insights.state.singleAppMode) ? 'Disable Single App Mode...' : 'Enable Single App Mode...',
            onSelect: function() {
                Alloy.Globals.insights.state.singleAppMode = !Alloy.Globals.insights.state.singleAppMode;

                _menu.hide();

                if (Alloy.Globals.insights.state.loggedIn) {
                    hideMenu(
                        {}, 
                        function() {
                            state.callbacks.onLogoutRequest(function() {
                                if (Alloy.Globals.insights.state.singleAppMode) {
                                    state.callbacks.onShowLoginRequest();
                                } else {
                                    alert('Disabled single app mode...');
                                }
                            });
                        }, 
                        true);
                } else {
                    if (Alloy.Globals.insights.state.singleAppMode) {
                        hideMenu({}, state.callbacks.onShowLoginRequest, true);
                    } else {
                        // state.callbacks.onLogoutRequest(function() {
                        //     if (Alloy.Globals.insights.state.singleAppMode) {
                        //         state.callbacks.onShowLoginRequest();
                        //     } else {
                        //         alert('Disabled single app mode...');
                        //     }
                        // });
                    }
                }
            },
            active: true
        },
        {
            title: (Alloy.Globals.insights.state.preProd) ? 'ENV: Pre-production (toggle)' : 'ENV: Production (toggle)',
            onSelect: function() {
                _menu.hide();    

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
            },
            active: true
        }
    ];

    var _row = null;

    var _rowData = [];

    for (var ri = 0, rl = _rows.length; ri < rl; ri++) {
        _row = Ti.UI.createTableViewRow({ height:50, backgroundImage:'', backgroundColor:'transparent', className:'debugItem' });
        _row.add(Ti.UI.createLabel({ color:'#333', text:_rows[ri].title, height:Ti.UI.FILL, left:40, right:40 }));
        
        _rowData.push(_row);
    }

    _table.data = _rowData;

    _table.addEventListener('click', function(e) {
        if (_rows[e.index].active) {
            _rows[e.index].onSelect(null);
        }
    });

    _menu.add(_table);

    _menu.show({ view:state.menuRows[menu.debugMenuRowIndex].controllers.getMenuView() });
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

function openBugReportDialog() {
    var _emailDialog = Ti.UI.createEmailDialog({ subject:'Insights Bug Report - v' + lib.appInfo.getVersionAsString() + ' - iPad', toRecipients:['platform-feedback@appcelerator.com'] });

    _emailDialog.messageBody = 'Please describe the issue:\n\n\n' + 'If possible, please provide the steps to reproduce the issue:\n\n\nAny additional details?\n\n\nMay we contact you via email in regards to this report? Yes / No\n\n--------------------\n- Insights v' + lib.appInfo.getVersionAsString() + '\n - ' + Ti.Platform.model + ' ' + Ti.Platform.version + ' ' + Ti.Platform.architecture;

    _emailDialog.addEventListener('complete', function(e) {
        var _dialog = null;

        switch (e.result) {
            case _emailDialog.SENT:
                _dialog = Ti.UI.createAlertDialog({ title:'Thank You', message:'Your bug report has been submitted.' });
                _dialog.show();
                break;
            case _emailDialog.SAVED:
                _dialog = Ti.UI.createAlertDialog({ title:'Thank You', message:'Your bug report has been saved (offline) and can be sent from the mail app.' });
                _dialog.show();
                break;
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
    var _menu = Ti.UI.iPad.createPopover({
        width: 335,
        height: (Ti.Platform.version.search('8') === 0) ? 140 : Ti.UI.SIZE, // #BUG: have to designate a height with iOS 8
        navBarHidden: true,
        // #BUG: this doesn't seem to work...
        tintColor: "#c41230"
    });

    var _bg        = Ti.UI.createView({ backgroundImage:'nav/bug-survey-bg.png', width:335, height:90 }),
        _reportBtn = Ti.UI.createView({ left:0, height:90, width:167 }),
        _surveyBtn = Ti.UI.createView({ right:0, height:90, width:167 });

    _reportBtn.addEventListener('click', function() {
        _menu.hide();
        hideMenu({}, function() { openBugReportDialog(); }, false);
    });

    _surveyBtn.addEventListener('click', function() {
        _menu.hide();
        openFeedback();
    });

    _menu.add(_bg);
    _menu.add(_reportBtn);
    _menu.add(_surveyBtn);

    _menu.show({ view:state.menuRows[menu.feedbackRowIndex].controllers.getMenuView() });
}

function showInsightsFeedbackAlert() {
    var _dialog = Ti.UI.createAlertDialog({ 
        title: 'Insights Feedback', 
        message: 'Your opinion is critical.\n\nBefore we get started, you can choose to either submit anonymously or with your email address.\n\nBy incuding your email address, you are agreeing to allow us to contact you regarding your feedback.',
        buttonNames: ['Cancel', 'View Privacy Policy', 'Submit Anonymously', 'Submit w/ Email Address']
    });

    _dialog.addEventListener('click', function(e) {
        switch (e.index) {
            case 1:
                openPrivacyPolicy();
                break;
            case 2:
                lib.events.fireEvent(lib.events.EVT.HOME.SURVEY);
                state.browser._show('Appcelerator Insights Feedback  |  Submitting anonymously...', 'https://www.surveymonkey.com/s/QX7XLW5');
                break;
            case 3:
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
        hideMenu({}, showInsightsFeedbackAlert, false);
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
                hideMenu({}, state.callbacks.onShowLoginRequest, true);
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
    var _menu = Ti.UI.iPad.createPopover({
        width: 335,
        height: 600,
        navBarHidden: true
    });

    var _content = Ti.UI.createView({ width:335, height:559, top:20, backgroundImage:'about/bg.png' }),
        _versionLbl = Ti.UI.createLabel({ font:{ fontFamily: "TitilliumText22L-250wt", fontSize:12 }, color:'#999', top:600, text:'Insights v' + lib.appInfo.getVersionAsString(), width:Ti.UI.SIZE, height:Ti.UI.SIZE });

    _menu.addEventListener('click', function() {
        // #REJECT: APPLE
        // _menu.hide();
        // lib.events.fireEvent(lib.events.EVT.HOME.INFO);
        // state.browser._show('The Appcelerator Platform', 'http://www.appcelerator.com/platform/appcelerator-platform/');
    });

    _menu.add(_content);
    _menu.add(_versionLbl);

    _menu.show({ view:state.menuRows[menu.aboutRowIndex].controllers.getMenuView() });
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
            state.focusedRowIndex = _menuRow.state.index;
            _menuRow.views.focusBg.animate({ opacity:1.0, duration:0 });
        },
        blurRow: function() {
            state.focusedRowIndex = -1;
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

    _menuRow.parent = Ti.UI.createTableViewRow({ versionRow:rowData.versionRow, selectionStyle:Ti.UI.iPhone.TableViewCellSelectionStyle.NONE, className:'menuRow', backgroundImage:'', backgroundColor:'transparent', width:Ti.UI.FILL, height:50 });

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
        left: (rowData.debugItem) ? 74 : (rowData.indent && rowData.indentSteps) ? (menu.indentStepWidth * rowData.indentSteps) + 40 : 40,
        right: 50,
        text: (rowData.versionRow) ? lib.appInfo.getVersionAsString() : rowData.title,
        touchEnabled: false
    });

    _menuRow.parent.add(_menuRow.views.focusBg);

    if (rowData.debugItem) {
        _debugIcon = Ti.UI.createView({ backgroundImage:'nav/debug-icon.png', touchEnabled:false, width:50, height:50, left:24 });
        _menuRow.parent.add(_debugIcon);
    }

    if (rowData.indent) {
        _indentIcon = Ti.UI.createView({ backgroundImage:'nav/indent-icon-1x.png', touchEnabled:false, width:50, height:50, left:24 });
        _menuRow.parent.add(_indentIcon);
    }

    _menuRow.parent.add(_menuRow.views.menuView);
    _menuRow.parent.add(_bar);
    _menuRow.parent.add(_lbl);

    _menuRow.parent.addEventListener('touchstart', _menuRow.controllers.focusRow);
    _menuRow.parent.addEventListener('touchend', _menuRow.controllers.blurRow);

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

function processMenuListScroll() {
    if (state.focusedRowIndex !== -1) {
        state.menuRows[state.focusedRowIndex].controllers.blurRow();
    }
}

function processMenuListTap(e) {
    menu.rows[e.index].onSelect(e);
}

function showMenuManual() {
    showMenu({ type:'manual' });
}

function hideMenuManual() {
    hideMenu({ type:'manual' });
}

function showHelpMenu() {
    var _menu = Ti.UI.iPad.createPopover({
        width: 180,
        height: Ti.UI.SIZE,
        navBarHidden: true,
        // #BUG: this doesn't seem to work...
        tintColor: "#c41230",
    });

    var _bg       = Ti.UI.createView({ width:180, height:402 }),
        _videoBtn = Ti.UI.createView({ width:180, height:149, top:0, backgroundImage:'nav/help-menu-video-overview-btn.png' }),
        _tipsBtn  = Ti.UI.createView({ width:180, height:149, backgroundImage:'nav/help-menu-tips-show-btn.png' }),
        _guideBtn = Ti.UI.createView({ width:180, height:148, bottom:0, backgroundImage:'nav/help-menu-user-guide-btn.png' });

    _videoBtn.addEventListener('click', function() {
        _menu.hide();
        openOverviewVideo();
    });

    _tipsBtn.addEventListener('click', function() {
        toggleTips();
        _menu.hide();
    });

    _guideBtn.addEventListener('click', function() {
        _menu.hide();
        openUserGuide(true);
    });

    _menu.add(_bg);
    _menu.add(_videoBtn);
    _menu.add(_tipsBtn);
    _menu.add(_guideBtn);

    _menu.show({ view:$.helpMenuHelper });
}

function showMenu(e) {
    var _source = e.source || {};
        _id     = _source.id || null;

    if (!menu.open && !Alloy.Globals.insights.state.menuLeftVisible) {
        menu.open = true;
        Alloy.Globals.insights.state.menuRightVisible = true; // prevent both menus from being open at once

        if (_id === 'overlayBtnContainer') {
            if (state.viewingDark) {
                $.moreBtnDark.opacity = 0.0;
            } else {
                $.moreBtnLight.opacity = 0.0;
            }

            $.moreBtnTouch.opacity = 1.0;
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
        $.moreBtnDark.animate({ opacity:0.0, duration:100 });
    } else {
        $.moreBtnLight.animate({ opacity:0.0, duration:100 });
    }

    $.moreBtnTouch.animate({ opacity:1.0, duration:100 });
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
    $.backBtn.animate({ opacity:0.0, duration:100 });
    $.backBtnTouch.animate({ opacity:1.0, duration:100 });
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
    $.loginBg.animate({ opacity:0.0, duration:100 });
    $.loginBgTouch.animate({ opacity:1.0, duration:100 });
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
    $.overlayBtnContainer.addEventListener('touchend', blurMoreBtn);

    $.headerContainer.addEventListener('click', hideMenu);
    $.headerContainer.addEventListener('touchstart', focusBackBtn);
    $.headerContainer.addEventListener('touchend', blurBackBtn);

    $.loginContainer.addEventListener('click', processLoginLogout);
    $.loginContainer.addEventListener('touchstart', focusLoginBtn);
    $.loginContainer.addEventListener('touchend', blurLoginBtn);

    $.menuList.addEventListener('scroll', processMenuListScroll);
    $.menuList.addEventListener('click', processMenuListTap);
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