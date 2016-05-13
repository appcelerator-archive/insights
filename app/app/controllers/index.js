// android takes forever to process app setup, so get this going right away...
if (OS_ANDROID) {
    $.appWin.open();

    var androidViews = {
        startupWin: Ti.UI.createView({ zIndex:9999, top:0, right:0, bottom:0, left:0 }),
        loaderParent: Ti.UI.createView({ top:0, right:0, bottom:0, left:0, backgroundImage:'/images/loader/loader.png' }),
        loaderActInd: Ti.UI.createActivityIndicator({ /* style:Ti.UI.ActivityIndicatorStyle.BIG, */ bottom:40, width:Ti.UI.SIZE, height:Ti.UI.SIZE })
    };

    androidViews.loaderActInd.show();

    androidViews.loaderParent.add(androidViews.loaderActInd);
    androidViews.startupWin.add(androidViews.loaderParent);

    $.appWin.add(androidViews.startupWin);
}

// #SETUP; global object...
Alloy.Globals.insights = {
    info: {
        version: {
            codename: 'No Cities to Love', // #CHANGE: should be updated for every major and minor production release
            major: 2,
            point: 0,
            minor: '01281502', // #CHANGE: app version
            demo: 'demo-020002.json', // #CHANGE: demo json name; older demo data is saved for legacy support
            app: 'app-020002.json', // #CHANGE: app verioning and other app configs; doesn't need to change for legacy as of 02.18.2014
            video: 'video-020002.json' // #CHANGE: video asset info
        },
        preProdUrlBase: 'http://dev.anovice.com/insights/',
        prodUrlBase: 'https://s3.amazonaws.com/appcelerator-platform/'
    },
    appWin: $.appWin,
    intervals: {
        sessions: 30000 // current sessions map updates every 30 seconds
    },
    timeout: 45000, // This is a global timeout for requests. It may be changed based on remote config. checkAppVersionAndConfig()
    guid: -1, // currently selected app guid; -1 is demo app
    data: null, // processed data for the selected app...
    calls: [], // #DEBUG; for debugging...
    updating: {
        app: false // whenever the app is performing async request operation
    },
    state: {
        user: {
            org: null
        },
        android: {
            // note 10.1 will return xLarge...
            xLarge: (OS_IOS) ? null : Ti.Platform.Android.physicalSizeCategory === Ti.Platform.Android.PHYSICAL_SIZE_CATEGORY_XLARGE || false,
        },
        customDomain: null, // #VPC support
        appList: null,
        currentUserEmailAddress: null,
        debug: true,          // #DEBUG #CHANGE: THIS MUST BE SET TO FALSE AT PRODUCTION
        preProd: false,       // #DEBUG #CHANGE: this is set in the debug menu: menuRight.js; must be set to false for production builds
        singleAppMode: false, // #DEBUG #CHANGE: should stay false; must be set to false for production builds
        loginVisible: false,
        menuLeftVisible: false,
        menuRightVisible: false,
        loggedIn: false,
        postLoginMethod: null,
        menuTip: null, // so that we can destroy the visible menu tip using other methods...
        current: {
            context: {
                startup: false,
                login: false,
                menu: {
                    left: false,
                    right: false
                },
                apps: {
                    map: true,
                    catOverview: false,
                    catDetailStandard: false,
                    catDetailFunnel: false
                }
            }
        }
    },
    controllers: {
        setContext: function(context) {
            Alloy.Globals.insights.state.current.context.apps.map = false;
            Alloy.Globals.insights.state.current.context.apps.catOverview = false;
            Alloy.Globals.insights.state.current.context.apps.catDetailStandard = false;
            Alloy.Globals.insights.state.current.context.apps.catDetailFunnel = false;

            Alloy.Globals.insights.state.current.context.apps[context] = true;

            Ti.API.info(Alloy.Globals.insights.state.current.context.apps);
        },
        tips: Alloy.createController('tips'),
        guide: null,
        wash: {
            show: function(force, onComplete) {
                var _force      = force || false,
                    _onComplete = onComplete || null;

                if (overlays && overlays.wash) {
                    showWash(overlays.wash, _force, _onComplete);
                } else {
                    Ti.API.info('Unable to show application wash. Attempting to call onComplete...');
                    if (_onComplete) { _onComplete(); }
                }
            },
            hide: function(force, onComplete) {
                var _force      = force || false,
                    _onComplete = onComplete || null;

                if (overlays && overlays.wash) {
                    hideWash(overlays.wash, _force, _onComplete);
                } else {
                    Ti.API.info('Unable to show application wash. Attempting to call onComplete...');
                    if (_onComplete) { _onComplete(); }
                }
            }
        },
        menu: {
            right: {
                hide: null,
                show: null
            },
            left: {
                hide: null,
                show: null
            }
        }
    },
    utils: {
        PXToDP: function(pixels) { return (OS_ANDROID) ? pixels / (Ti.Platform.displayCaps.dpi / 160) : pixels; }
    },
    // #TODO: refactor current/android/ipad
    specs: {
        supported: ['androidTablet', 'ipad'],
        current: {}, 
        android: {
            // available app space in dp
            nexus7: [960, 552], // -48 dp for navigation bar
            note10: [1280, 800]
        },
        ios: {
            ipad: [1024, 768]
        }
    }
};

// #SETUP; define app...
var app = {
    state: {
        currentOrientation: null,
        properties: {
            app: null,
            user: null
        },
        init: false,
        forcedLogout: false,
        feedback: {
            visible: false
        },
        wash: {
            visible: false
        }
    },
    timers: {
        lastUpdated: null,
        sessions: null
    }
};

// #SETUP; create libs #TODO: Most of this will go away, as controllers are internally creating...
var lib = {
    client: {
        app: require('client/app')(),
        users: require('client/users')(),
        ui: (OS_IOS) ? require('ti.insights') : require('client/tiinsights')(), // #ATEMP
        configConsumer: require('client/configConsumer')(),
        processor: require('client/processor')(),
        time: require('client/time')(),
        appInfo: require('client/appInfo')(),
        map: require('client/map')({
            width: (OS_IOS) ? 2252 : (Alloy.Globals.insights.state.android.xLarge) ? 1280 : 960,
            height: (OS_IOS) ? 1931 : (Alloy.Globals.insights.state.android.xLarge) ? 800 : 552,
            latitude: {
                boundsBottom: -80,
                boundsBottomDegree: 0
            },
            longitude: {
                boundsLeft: -180,
                boundsRight: 180,
                delta: 0
            }
        })
    },
    platform: {
        auth: require('platform/auth')(),
        apiConsumer: require('platform/apiConsumer')({
            callbacks: {
                onRequestError: processRequestError
            }
        })
    }
};

// #SETUP; create controllers...
var controllers = {
    startup: Alloy.createController('startup'),
    login: Alloy.createController('login'),
    browser: Alloy.createController('browser'),
    clock: Alloy.createController('clock'),
    menu: {
        left: Alloy.createController('menuLeft'),
        right: Alloy.createController('menuRight')
    },
    apps: {
        map: Alloy.createController('appMap'),
        overview: Alloy.createController('appCategoryOverview'),
        detail: Alloy.createController('appCategoryDetail')
    }
};

var loader = {
    bg: Ti.UI.createView({ zIndex:1, width:Alloy.Globals.insights.utils.PXToDP(Ti.Platform.displayCaps.platformWidth), height:Alloy.Globals.insights.utils.PXToDP(Ti.Platform.displayCaps.platformHeight), backgroundImage:(OS_IOS) ? 'loader/bg.png' : '' }),
    largeIndicator: lib.client.ui.createLoadingIndicatorLargeView({ touchEnabled:false, opacity:0.0, width: 700, height: 700, touchEnabled: false })
};

// app-specific ui...
// overlays are typically views that must sit 'on top' of the entire interface...
// #TODO: move ui out...
var overlays = {
    bg: Ti.UI.createView({ width:Ti.UI.FILL, height:Ti.UI.FILL, opacity:0.0, visible:(OS_ANDROID) ? false : true /* #WORKAROUND visible for Android */ }), // this prevents interaction below the wash
    wash: Ti.UI.createView({ bubbleParent:false, bottom:Alloy.Globals.insights.utils.PXToDP(Ti.Platform.displayCaps.platformHeight), width:Alloy.Globals.insights.utils.PXToDP(Ti.Platform.displayCaps.platformWidth), height:Alloy.Globals.insights.utils.PXToDP(Ti.Platform.displayCaps.platformHeight) }),
    trans: lib.client.ui.createBlurView({ touchEnabled:false, width:Ti.UI.FILL, height:Ti.UI.FILL, translucentTintColor:'#000000', translucentAlpha:1.0, translucentStyle:1, translucent:1 }),
    swipeDetectors: {
        left: Ti.UI.createView({ left:0, width:5, height:Ti.UI.FILL }),
        right: Ti.UI.createView({ right:0, width:5, height:Ti.UI.FILL }),
        top: Ti.UI.createView({ top:0, left:5, right:5, height:10 }),
        bottom: Ti.UI.createView({ bottom:0, left:5, right:5, height:10 })
    }
};

var largeIndicator = lib.client.ui.createLoadingIndicatorLargeView({
    width: 700,
    height: 700,
    opacity: 0.0,
    touchEnabled: false
});

var feedbackContainer = Ti.UI.createView({ touchEnabled:false, center:{ x:Alloy.Globals.insights.utils.PXToDP(Ti.Platform.displayCaps.platformWidth) / 2, y:Alloy.Globals.insights.utils.PXToDP(Ti.Platform.displayCaps.platformHeight) / 2 }, transform:Ti.UI.create2DMatrix({ scale:1.2 }), backgroundImage:(OS_ANDROID) ? '/images/general/message-bg.png' : 'general/message-bg.png', backgroundLeftCap:5, backgroundTopCap:5, width:354, height:138, opacity:0.0 });
var feedbackLbl = Ti.UI.createLabel({ font:{fontFamily: "TitilliumText22L-1wt", fontSize:20}, color:'#333', touchEnabled:false, left:30, right:30, bottom:10, top:10, textAlign:'center' });

// #VPC
function setCustomDomain(domain) {
    var _domain = domain || null;

    if (_domain) { _domain = 'https://' + _domain + '/'; }

    Alloy.Globals.insights.state.customDomain = _domain || null;
    lib.client.app.update.props.customDomain(Alloy.Globals.insights.state.customDomain);
}

function openUserGuide(onOpen, animated, showWelcome, postLoginTip) {
    var _postLoginTip = postLoginTip || false;

    Alloy.Globals.insights.controllers.guide = Alloy.createController('guide');

    Alloy.Globals.insights.controllers.guide._init({
        browser: controllers.browser,
        animated: animated,
        showWelcome: showWelcome,
        callbacks: {
            onClose: function() {
                if (!app.state.properties.app.firstRun) {
                    app.state.properties.app.firstRun = true;
                    lib.client.app.update.props.firstRun(app.state.properties.app.firstRun);

                    initTips();
                }

                if (_postLoginTip) {
                    // Alloy.Globals.insights.state.menuTip.controllers.show(null);
                }

                // after the user makes a selection on the previous alert, this will clear out...
                // if (!app.state.properties.user.firstRun) {
                //     app.state.properties.user.firstRun = true;
                //     lib.client.users.update.props.firstRun(Alloy.Globals.insights.state.currentUserEmailAddress, app.state.properties.user.firstRun);
                // }
            },
            onHideRequest: function() {
                Alloy.Globals.insights.controllers.guide._hide(function() {
                    $.appWin.remove(Alloy.Globals.insights.controllers.guide._getParentView());

                    Alloy.Globals.insights.controllers.guide = null;
                });

                hideWash(overlays.wash);
            }
        }
    });

    // hide menu if it is open...
    // it's important to note that the guide can be evoked from other places...
    if (Alloy.Globals.insights.state.menuRightVisible) {
        controllers.menu.right._hideMenu({},
            function() {
                $.appWin.add(Alloy.Globals.insights.controllers.guide._getParentView());
                
                Alloy.Globals.insights.controllers.guide._show();
            },
            true);
    } else {
        $.appWin.add(Alloy.Globals.insights.controllers.guide._getParentView());
                
        Alloy.Globals.insights.controllers.guide._show();
    }    
}

// retrieves demo data and sets global app data object (Alloy.Globals.insights.data) 
// to local if there is an error - then, callback...
// this method is also used for reselecting the demo app...
// #TODO: demo related implementation should be moved out...
function getDemoData(callback) {
    // #BUG - Android has an exception after timeout, even when a connection isn't available... shouldn't it just timeout immediately?
    var client = Ti.Network.createHTTPClient({ timeout:10000 });

    client.onload = function() {
        try {
            Alloy.Globals.insights.data = JSON.parse(this.responseText);

            callback(false);
        } catch(err) {
            Ti.API.info(err);
            callback(true);
        }
    }

    client.onerror = function() {
        // #BUG
        Alloy.Globals.insights.data = JSON.parse(Ti.Filesystem.getFile((OS_IOS) ? 'common/demo.json' : '../../common/demo.json').read().text);

        Ti.API.debug('Unable to retrieve latest demo data. Using offline, local data...');
        callback(true);
    }

    // #DEBUG; getDemoData is called if the user switch back to demo app, so 
    // we must clear out debug calls array - not useful for demo
    Alloy.Globals.insights.calls.length = 0;
    Alloy.Globals.insights.calls = [];

    client.open('GET', (Alloy.Globals.insights.state.debug) ? (Alloy.Globals.insights.info.preProdUrlBase + Alloy.Globals.insights.info.version.demo) : (Alloy.Globals.insights.info.prodUrlBase + Alloy.Globals.insights.info.version.demo));
    client.send(null);
}

function showLogin(start) {
    if (app.state.init) {
        showWash(overlays.wash, (start) ? true : false);
    }

    setTimeout(function() {
        controllers.login._show();
    }, 500);
}

function hideLogin() {
    var _dialog = null;

    hideWash(overlays.wash);
    controllers.login._hide(false, function() {
        if (Alloy.Globals.insights.state.singleAppMode) {
            alert('Single app mode cancelled...');
            Alloy.Globals.insights.state.singleAppMode = false;
        }

        // we should check for last user here, because the user may decide not to resume...
        if (app.state.properties.app.lastUser) {
            Ti.API.info('User decided not to login (from login ribbon) after resuming from a force close...');

            // we also remove the previously selected app for security concerns...
            lib.client.users.update.props.lastSelectedGuid(app.state.properties.app.lastUser, null);

            app.state.properties.app.lastUser = null;
            lib.client.app.update.props.lastUser(null);

            _dialog = Ti.UI.createAlertDialog({ title:'Resume Cancelled', message:'To protect the security of your account, your username has been cleared.', buttonNames:['Ok'] });

            _dialog.show();
        }
    });
}

function showWash(wash, force, onComplete) {
    if (!app.state.wash.visible) {        
        app.state.wash.visible = true;

        if (Alloy.Globals.insights.controllers.tips._isInit()) {
            // we need to hide the tips container if the was has been opened (used typically for first run)
            Alloy.Globals.insights.controllers.tips._hide();
        }

        // #BUG: this locks orientation so that the blur effect isn't screwy on orientation change...
        // $.appWin.orientationModes = [app.state.currentOrientation];

        controllers.clock._toggleBg(false);

        // this prevents interaction below the wash
        overlays.bg.opacity = 1.0;

        // #WORKAROUND
        // opacity isn't enough on Android to allow touch below layer...
        if (OS_ANDROID) { overlays.bg.visible = true; }

        if (force) {
            wash.bottom = 0;
            if (onComplete) { onComplete(); }
        } else {
            wash.animate({ bottom:0, duration:250 }, function() {
                if (onComplete) { onComplete(); }
            });
        }
    } else {
        Ti.API.info('Wash already visible. Attempting to call onComplete...');
        if (onComplete) { onComplete(); }
    }
}

function hideWash(wash, force, onComplete) {
    var _menuLeftOpen  = controllers.menu.left._isOpen(),
        _menuRightOpen = controllers.menu.right._isOpen();

    if (_menuLeftOpen) { controllers.menu.left._hideMenu({ preventCallback:true }); }
    if (_menuRightOpen) { controllers.menu.right._hideMenu({ preventCallback:true }); }
    
    if (app.state.wash.visible) {
        app.state.wash.visible = false;
        
        // #BUG allow both landscape orientations...
        // $.appWin.orientationModes = [3, 4];

        // this prevents interaction below the wash
        overlays.bg.opacity = 0.0;

        // #WORKAROUND
        // opacity isn't enough on Android to allow touch below layer...
        if (OS_ANDROID) { overlays.bg.visible = false; }

        if (force) {
            wash.bottom = Alloy.Globals.insights.utils.PXToDP(Ti.Platform.displayCaps.platformHeight);
            controllers.clock._toggleBg(true);

            if (Alloy.Globals.insights.controllers.tips._isInit()) {
                // we can reveal the tips container (a tip may not be visible, which is fine)
                Alloy.Globals.insights.controllers.tips._show();
            }

            if (onComplete) { onComplete(); }
        } else {
            wash.animate({ bottom:Alloy.Globals.insights.utils.PXToDP(Ti.Platform.displayCaps.platformHeight), duration:250 }, function() {
                controllers.clock._toggleBg(true);

                if (Alloy.Globals.insights.controllers.tips._isInit()) {
                    // we can reveal the tips container (a tip may not be visible, which is fine)
                    Alloy.Globals.insights.controllers.tips._show();
                }

                if (onComplete) { onComplete(); }
            });
        }
    } else {
        Ti.API.info('Wash already visible. Attempting to call onComplete...');
        if (onComplete) { onComplete(); }
    }
}

function generateSessionUpdateTimer() {
    app.timers.sessions = lib.client.time.createTimer(function(time) {
        // will update map with latest sessions every 30 seconds
        Ti.API.info('Current Session Timer Tick: ' + time);
        if (time >= Alloy.Globals.insights.intervals.sessions && !Alloy.Globals.insights.updating.app) {
            app.timers.sessions.controllers.stop();
            updateSessionsUI(time);
        } else {
            if (Alloy.Globals.insights.updating.app) {
                Ti.API.info('Attempt to call updateSessionsUI. Aborting as app is being updated...');
            }
        }
    }, 1000);
}

// refresh map ui with current session data
// #TODO: is time arg actually used?
function updateSessionsUI(time) {
    var _apiConsumer = null;

    // get only current session data for the currently selected app
    if (!Alloy.Globals.insights.updating.app) {
        if (Alloy.Globals.insights.guid !== -1) {
            lib.platform.apiConsumer.getSessionData({
                guid: Alloy.Globals.insights.guid,
                justSessions: true,
                events: {
                    onUpdate: function(error, msg) {
                        // if we do encounter an error, just restart the timer and 
                        // try again after the next cycle
                        // #TODO: communicate this error to user
                        if (error) {
                            Ti.API.info('onUpdate Error: ' + msg);

                            if (!Alloy.Globals.insights.updating.app) {
                                app.timers.sessions.controllers.start();
                            }
                        }
                    },
                    onComplete: function(data) {
                        var _points            = [],
                            _totalSessionCount = 0;

                        Ti.API.info('FROM UPDATE SESSIONS');
                        // #TODO: must ensure that updating is not going on...
                        // update current session data
                        try {
                            if (!Alloy.Globals.insights.updating.app) {
                                for (var pi = 0, pl = data.data['sessions_geo'].points.length; pi < pl; pi ++) {
                                    _points.push({
                                        lat: data.data['sessions_geo'].points[pi].lat,
                                        lng: data.data['sessions_geo'].points[pi].lng,
                                        count: data.data['sessions_geo'].points[pi].count
                                    });

                                    _totalSessionCount += data.data['sessions_geo'].points[pi].count;
                                }

                                Alloy.Globals.insights.data.sessions.current = _points;
                                Alloy.Globals.insights.data.sessions.currentTotal = _totalSessionCount;
                                Alloy.Globals.insights.data.sessions.today = data.data.recentSessionsData.today;
                                Alloy.Globals.insights.data.sessions.yesterday = data.data.recentSessionsData.yesterday;

                                // refresh map ui with new session data
                                controllers.apps.map._refreshUI(false, false);

                                app.timers.sessions.controllers.start();
                            } else {
                                Ti.API.info('Attempt to update with new session data. Current app is being updated. Aborting attempt to update sessions UI...');
                            }
                        } catch(err) {
                            Ti.API.info('Unable to update current sessions...');
                            Ti.API.info(err);
                            
                            // just in-case we get an update conflict...
                            if (!Alloy.Globals.insights.updating.app) {                    
                                app.timers.sessions.controllers.start();
                            }
                        }
                    }
                }
            });
        } else {
            Ti.API.info('Demo app selected. Not updating sessions...');
        }
    } else {
        Ti.API.info('Attempt to retrieve new sessions data. Current app is being updated. Aborting attempt to update sessions UI...');
    }
}

function updateLastUpdated(time) {
    // time is the current tick time and is not used currently...

    // APPTS-3862: we also want to pass if this is the demo up to avoid changing the last updated label to a time...
    if (Alloy.Globals.insights.guid !== -1) {
        controllers.menu.left._updateLastUpdated(lib.client.time.getLastUpdated(app.state.properties.user[5]), Alloy.Globals.insights.guid === -1);
    }
}

function generateLastUpdatedTimer() {
    app.timers.lastUpdated = lib.client.time.createTimer(updateLastUpdated, 1000);
}

// #APPTS-5034
function updateFunnelCompareTimestamp() {
    Ti.API.info('Updating funnel compare timestamp...');
    lib.client.users.update.props.funnelCompareTimestamp(Alloy.Globals.insights.state.currentUserEmailAddress, new Date().getTime());

    Ti.API.info('Updating current user properties...');
    app.state.properties.user = lib.client.users.getUserData(Alloy.Globals.insights.state.currentUserEmailAddress);
}

// #APPTS-5034
function compareFunnelTimestamps(callback) {
    var _data                          = Alloy.Globals.insights.data.categories,
        _currentFunnelCompareTimestamp = app.state.properties.user[6],
        _currentCatName                = null,
        _currentFunnelNameLength       = 0,
        _alertText                     = '';

    // meow...
    var _cats = [{
            cat: "acquisition",
            funnelNames: []
        }, {
            cat: "engagement",
            funnelNames: []
        }, {
            cat: "retention",
            funnelNames: []
        }, {
            cat: "quality",
            funnelNames: []
    }];

    Ti.API.info('Checking funnel compare timestamp...');

    for (var category in _data) {
        for (var fi = 0, fil = _data[category].funnels.length; fi < fil; fi ++) {
            if (_currentFunnelCompareTimestamp < _data[category].funnels[fi].updated) {
                for (var ci = 0, cil = _cats.length; ci < cil; ci ++) {
                    if (_cats[ci].cat === category) {
                        _cats[ci].funnelNames.push(_data[category].funnels[fi].name);
                    }
                }
            }
        }
    }

    for (var fci = 0, fcil = _cats.length; fci < fcil; fci ++) {
        if (_cats[fci].funnelNames.length > 0) {
            if (!_currentCatName) {
                _currentCatName = _cats[fci].cat.charAt(0).toUpperCase() + _cats[fci].cat.substring(1);
                _alertText     += _currentCatName + ': ';
            }

            for (var fni = 0, fnil = _cats[fci].funnelNames.length; fni < fnil; fni ++) {
                _alertText += (fni === fnil - 1) ? '"' + _cats[fci].funnelNames[fni] + '"\n\n' : '"' + _cats[fci].funnelNames[fni] + '", ';

                if (fni === fnil - 1) {
                    _currentCatName = null;
                }
            }
        }
    }

    // keep this simple and remove the last two line breaks
    if (_alertText.length > 0) { _alertText = _alertText.substr(0, _alertText.length - 2); }

    updateFunnelCompareTimestamp();

    if (callback) { callback((_alertText.length > 0) ? _alertText : null); }
}

function changeToApp(guid, org, callback, onAppDataRecieved) {
    // set selected app guid
    Alloy.Globals.insights.guid = guid || -1;

    if (app.timers.sessions) {
        app.timers.sessions.controllers.stop();
    }

    if (app.timers.lastUpdated) {
        app.timers.lastUpdated.controllers.stop();
    }

    // flag for updating the app...
    // this is used to block other requests that already be processing...
    Alloy.Globals.insights.updating.app = true;  

    if (Alloy.Globals.insights.state.singleAppMode && guid === null) {
        // single app mode...
        hideFeedbackUI(callback);
    } else if (guid === -1 && app.state.init) {
        // #DEMO
        showWash(overlays.wash, true);

        updateFeedbackUIMsg('Retrieving demo data...');
        showFeedbackUI();

        getDemoData(function(error) {
            if (error) {
                Ti.API.info('There was an error retrieving demo app data. No worries. Local data loaded...');
            }

            updateFeedbackUIMsg('Processing Complete\n\nUpdating interface...');
            controllers.apps.map._refreshUI(true, true); // not animated...

            hideFeedbackUI(function() {
                hideWash(overlays.wash, false, function() {
                    // #TODO: for performance reasons, it may be best to update the context that the user is looking at first...
                    controllers.apps.overview._refreshUI();
                    controllers.apps.detail._refreshUI();

                    Alloy.Globals.insights.updating.app = false;

                    // #APPTS-3742: Demo app does not show when it was last updated...
                    // app.timers.lastUpdated.controllers.start();

                    if (callback) { callback(); }
                });
            });
        });
    // #TODO
    // check if application has been init
    } else if (!app.state.init) {
        app.state.init = true;

        // for startup...
        // start the last updated timer and update the app list with null...
        // #APPTS-3742: Demo app does not show when it was last updated...
        // app.timers.lastUpdated.controllers.start();
        controllers.menu.left._updateAppList(null);
    } else {
        showWash(overlays.wash, true);

        updateFeedbackUIMsg('Retrieving application data...');
        showFeedbackUI();
        
        // #DEBUG
        Alloy.Globals.insights.calls.length = 0;
        Alloy.Globals.insights.calls = [];
        // #DEBUG

        lib.platform.apiConsumer.getAppData({
            guid: guid,
            org: org || null, // if the user doesn't have this org selected, select it for them before getting app data
            justSessions: false,
            events: {
                onUpdate: function(msg) {
                    updateFeedbackUIMsg(msg);
                },
                onComplete: function(data) {
                    var _dialog = null;

                    // code, msg
                    if (data.error) {
                        // inform the left menu of error to prevent UI update...
                        if (onAppDataRecieved) { onAppDataRecieved(true); }

                        hideFeedbackUI(function() {
                            _dialog = Ti.UI.createAlertDialog({ title:'App Data Request Error', message:data.msg });

                            switch (data.code) {
                                case 503:
                                case 1:
                                case 2:
                                    _dialog.buttonNames = ['Cancel', 'Try Again'];
                                    break;
                                case 3:
                                case 401:
                                    // #TODO: post v1... let users log back in...
                                    // _dialog.buttonNames = ['Cancel', 'Login'];
                                    // break;
                                default:
                                    _dialog.buttonNames = ['Ok'];
                                    break;
                            }

                            _dialog.addEventListener('click', function(e) {
                                if (e.index === 1) {
                                    if (data.code === 401 || data.code === 3 || !data.code) {
                                        // #TODO: post v1 login and post request
                                        controllers.login._logout();
                                    } else {
                                        changeToApp(guid, callback, onAppDataRecieved);
                                    }
                                } else {
                                    // the user tapped cancel on a 401
                                    if (data.code === 401 || data.code === 3 || !data.code) {
                                        controllers.login._logout();
                                    } else {
                                        hideWash(overlays.wash);
                                    }
                                }
                            })

                            _dialog.show();
                        });
                    } else {
                        // inform the left menu of no error to allow UI update...
                        if (onAppDataRecieved) { onAppDataRecieved(false); }

                        updateFeedbackUIMsg('Processing application data...');

                        // this will store the selected app guid for resume purposes...
                        lib.client.users.update.props.lastSelectedGuid(Alloy.Globals.insights.state.currentUserEmailAddress, guid);

                        
                        Ti.API.info(data);
                        lib.client.processor.processData({
                            data: data,
                            events: {
                                onComplete: function(data) {
                                    if (data.error) {

                                    } else {
                                        Alloy.Globals.insights.data = data;

                                        updateFeedbackUIMsg('Processing Complete\n\nUpdating interface...');

                                        controllers.apps.map._refreshUI(true, true); // not animated...

                                        hideFeedbackUI(function() {
                                            hideWash(overlays.wash, false, function() {
                                                // #TODO: for performance reasons, it may be best to update the context that the user is looking at first...
                                                controllers.apps.overview._refreshUI();
                                                controllers.apps.detail._refreshUI();
                                                
                                                Alloy.Globals.insights.updating.app = false;

                                                // APPTS-3742: store timestamp so that we can provide an accurate last updated value...
                                                lib.client.users.update.props.appLastUpdated(Alloy.Globals.insights.state.currentUserEmailAddress, new Date().getTime());
                                                // ...then update the user object...
                                                app.state.properties.user = lib.client.users.getUserData(Alloy.Globals.insights.state.currentUserEmailAddress);

                                                app.timers.sessions.controllers.start();
                                                app.timers.lastUpdated.controllers.start();

                                                // #APPTS-5034
                                                compareFunnelTimestamps(function(alertText) {
                                                    var _alert     = null,
                                                        _alertText = alertText || null;

                                                    if (_alertText) {
                                                        Ti.API.info('New funnels found. Throwing alert...');

                                                        _alert = Ti.UI.createAlertDialog({
                                                            title: 'App Funnel Updates',
                                                            message: 'The following funnels are now available to Insights or have been updated for this app.\n\n' + _alertText,
                                                        }).show();
                                                    } else {
                                                        Ti.API.info('No new funnels were found...');
                                                    }
                                                    
                                                    // this is the top level callback
                                                    if (callback) { callback(); }
                                                });

                                                
                                            });
                                        });
                                    }
                                }
                            }
                        });
                    }
                }
            }
        });
    }
}

function showFeedbackUI(onComplete) {
    app.state.feedback.visible = true;

    controllers.clock._toggleBg(false);

    largeIndicator.start();
    largeIndicator.animate({ opacity:1.0, duration:250 });

    feedbackContainer.animate({ transform:Ti.UI.create2DMatrix({ scale:1.0 }), opacity:1.0, duration:250 }, function() {
        if (onComplete) { onComplete(); }
    });
}

function hideFeedbackUI(onComplete) {
    largeIndicator.animate({ opacity:0.0, duration:250 });

    setTimeout(function() {
        feedbackContainer.animate({ transform:Ti.UI.create2DMatrix({ scale:1.2 }), opacity:0.0, duration:250 }, function() {
            app.state.feedback.visible = false;

            feedbackContainer.center = { x:Alloy.Globals.insights.utils.PXToDP(Ti.Platform.displayCaps.platformWidth) / 2, y:Alloy.Globals.insights.utils.PXToDP(Ti.Platform.displayCaps.platformHeight) / 2 };

            largeIndicator.cancel();
            if (onComplete) { onComplete(); }
        });
    }, 1000);
}

function updateFeedbackUIMsg(msg, preventAnimate) {
    // disable animation for now...
    // if (!preventAnimate) {
    //     feedbackLbl.opacity = 0.0;
    // }

    feedbackLbl.text = msg;

    // if (!preventAnimate) {
    //     feedbackLbl.animate({ opacity:1.0, duration:100 });
    // }
}

function processRequestError(type) {
    // #TODO: finish handling    
    // #TODO: messy
    controllers.login._logout();
    // processLogoutComplete(false, null, function() {
    //     var _dialog = Ti.UI.createAlertDialog({ title:'Request Error', message:'TEMP: THIS HANDLING AND FEEDBACK IS NOT YET COMPLETE.\n\nThere was a problem completing your request.\n\nThis most commonly occurs when an internet connection is unavailable or you have logged into Insights from a different device.\n\nIf this problem persists, please contact your administrator.', buttonNames:['Cancel', 'Log In'] });

    //     _dialog.addEventListener('click', function(e) {
    //         if (e.index === 1) {
    //             controllers.login._show();
    //         } else {
    //             hideWash(overlays.wash);
    //         }
    //     });

    //     _dialog.show();
    // });
}

function showSingleAppModal() {
    var _modal        = Ti.UI.createWindow(),
        _scrollView    = Ti.UI.createScrollView({ contentHeight:'auto', contentWidth:'auto', top:0, left:0, right:0, bottom:50 }),
        _navContainer = Ti.UI.createView({ bottom:0, left:0, right:0, height:50, backgroundColor:'#ccc' }),
        _cancelLbl    = Ti.UI.createLabel({ text:'Cancel', left:20, top:0, bottom:0, width:Ti.UI.SIZE }),
        _loadLbl      = Ti.UI.createLabel({ text:'Load App', right:20, top:0, bottom:0, width:Ti.UI.SIZE }),
        _content      = Ti.UI.createView({ left:20, right:20, top:20, height:Ti.UI.SIZE, layout:'vertical' });

    var _headerLbl = Ti.UI.createLabel({ text:'Single App Mode', width:Ti.UI.SIZE, height:Ti.UI.SIZE });

    var _appContainer    = Ti.UI.createView({ width:Ti.UI.FILL, height:50 }),
        _appDirectionLbl = Ti.UI.createLabel({ touchEnabled:false, text:'Selected App: ', width:Ti.UI.SIZE, height:Ti.UI.SIZE, left:0 }),
        _appControlLbl   = Ti.UI.createLabel({ touchEnabled:false, text:'--', width:Ti.UI.SIZE, height:Ti.UI.SIZE, right:0 });

    var _tsContainer    = Ti.UI.createView({ width:Ti.UI.FILL, height:50 }),
        _tsDirectionLbl = Ti.UI.createLabel({ touchEnabled:false, text:'Selected Request Time: ', width:Ti.UI.SIZE, height:Ti.UI.SIZE, left:0 }),
        _tsControlLbl   = Ti.UI.createLabel({ touchEnabled:false, text:'--', width:Ti.UI.SIZE, height:Ti.UI.SIZE, right:0 });

    var _infoLbl = Ti.UI.createLabel({ left:100, right:100, height:Ti.UI.SIZE, font:{fontSize:12}, textAlign:'center', text:'Tap a row above to make your selection. Once you have finished, tap "Load App".\n\nRequest time selection will be based on local device time and corrected for UTC.\n\nIMPORTANT: Single app mode should be used to gather request and client processor data. Left and right menu UI will not be updated. Once finished, return to the debug menu to disable this mode.' });

    var _selectedAppGuid = null,
        _selectedTS      = null;

    _appContainer.addEventListener('click', function() {
        var _popover    = Ti.UI.iPad.createPopover({ navBarHidden:true, width:300, height:400 }),
            _table      = Ti.UI.createTableView({ width:Ti.UI.FILL, height:Ti.UI.FILL }),
            _row        = null,
            _appNameLbl = null,
            _appGuidLbl = null;

        var _data = [];

        for (var a = 0, al = Alloy.Globals.insights.state.appList.length; a < al; a ++) {
            _row = Ti.UI.createTableViewRow({ id:Alloy.Globals.insights.state.appList[a].guid, appName:Alloy.Globals.insights.state.appList[a].name, height:60, width:Ti.UI.FILL }),
            _appNameLbl = Ti.UI.createLabel({ text:Alloy.Globals.insights.state.appList[a].name, left:10, right:10, font:{fontSize:16, fontWeight:'bold'}, height:14, top:10 }),
            _appGuidLbl = Ti.UI.createLabel({ text:Alloy.Globals.insights.state.appList[a].guid, left:10, right:10, font:{fontSize:12}, height:10, bottom:10 });

            _row.add(_appNameLbl);
            _row.add(_appGuidLbl);

            _data.push(_row);
        }

        _table.data = _data;

        _table.addEventListener('click', function(e) {
            _selectedAppGuid = e.rowData.id,
            _appControlLbl.text = e.rowData.appName;

            _popover.hide();
        });

        _popover.add(_table);

        _popover.show({ view:_appControlLbl });
    });

    _tsContainer.addEventListener('click', function() {
        alert('Custom request time is currently disabled...');
        // var _popover = Ti.UI.iPad.createPopover({ navBarHidden:true, width:Ti.UI.SIZE, height:Ti.UI.SIZE }),
        //     _picker  = Ti.UI.createPicker({ type:Ti.UI.PICKER_TYPE_DATE_AND_TIME, minDate:new Date(2013, 0, 1), maxDate:new Date(2016, 12, 31), value:new Date() });

        // _picker.addEventListener('change', function(e) {
        //     _selectedTS        = e.value,
        //     _tsControlLbl.text = e.value;
        //     Ti.API.info(typeof(e.value));
        // });

        // _popover.add(_picker);

        // _popover.show({ view:_tsControlLbl });
    })

    _loadLbl.addEventListener('click', function() {
        if (_selectedAppGuid) {
        // if (_selectedAppGuid && _selectedTS) {
            changeToApp(_selectedAppGuid, function() {
                    alert('Single app mode enabled...\n\nApp Name: ' + _appControlLbl.text + '\nGUID: ' + _selectedAppGuid + '\nREQUEST TIME: ' + _selectedTS);
                }, null, _selectedTS);

            _modal.close();
        } else {
            alert('Please select a valid app and request time...');
        }
    });

    _cancelLbl.addEventListener('click', function() {
        Alloy.Globals.insights.state.singleAppMode = false;

        controllers.login._logout(function() {
            alert('Single app mode cancelled...');
        });

        _modal.close();
    });

    _navContainer.add(_cancelLbl);
    _navContainer.add(_loadLbl);

    _appContainer.add(_appDirectionLbl);
    _appContainer.add(_appControlLbl);

    _tsContainer.add(_tsDirectionLbl);
    _tsContainer.add(_tsControlLbl);

    _content.add(_headerLbl);
    _content.add(Ti.UI.createView({ width:Ti.UI.FILL, height:25 }));
    _content.add(_appContainer);
    _content.add(Ti.UI.createView({ width:Ti.UI.FILL, height:10 }));
    _content.add(_tsContainer);
    _content.add(Ti.UI.createView({ width:Ti.UI.FILL, height:25 }));
    _content.add(_infoLbl);

    _scrollView.add(_content);
    
    _modal.add(_scrollView);
    _modal.add(_navContainer);

    _modal.open({ modalStyle:Ti.UI.iPhone.MODAL_PRESENTATION_FORMSHEET, modal:true });
}

function processLoginStart(onUIReady) {
    updateFeedbackUIMsg('Logging in...');
    showFeedbackUI(onUIReady);
}

function processLoginComplete(error, msg, code, username) {
    var _code = code || null;

    if (error) {
        updateFeedbackUIMsg('Error logging in...');

        hideFeedbackUI(function() {
            var _dialog = Ti.UI.createAlertDialog({ title:'Login Error' });

            _dialog.message = msg || 'An unknown login error has occured.';

            switch (_code) {
                case 400:
                    // message:'There was a problem logging in.\n\nWould you like to review your credentials and try again?\n\nIf this problem persists, please contact your administrator.'
                    // invalid login credentials
                    _dialog.buttonNames = ['Cancel', 'Try Again'];
                    break;
                case 403:
                    // don't have insights access
                    _dialog.buttonNames = ['Ok'];
                    break;
                case 1:
                    // connection error
                    _dialog.buttonNames = ['Cancel', 'Try Again'];
                    break;
                case 2:
                    // timed out
                    _dialog.buttonNames = ['Cancel', 'Try Again'];
                    break;
                default:
                    _dialog.buttonNames = ['Cancel', 'Try Again'];
                    break;
            }

            _dialog.addEventListener('click', function(e) {
                // some errors don't allow for a try again option...
                if (e.index === 1) {
                    controllers.login._show();
                } else {
                    if (Alloy.Globals.insights.state.singleAppMode) {
                        alert('Single app mode cancelled...');
                        Alloy.Globals.insights.state.singleAppMode = false;
                    }

                    if (app.state.properties.app.lastUser) {
                        // we also remove the previously selected app for security concerns...
                        lib.client.users.update.props.lastSelectedGuid(app.state.properties.app.lastUser, null);

                        app.state.properties.app.lastUser = null;
                        lib.client.app.update.props.lastUser(null);
                    }

                    Alloy.Globals.insights.state.postLoginMethod = null;
                    controllers.login._reset();
                    hideWash(overlays.wash);
                }
            });

            _dialog.show();
        });
    } else {
        Ti.API.info('User logged in...');

        Alloy.Globals.insights.state.loggedIn = true;
        Alloy.Globals.insights.state.currentUserEmailAddress = username.toLowerCase();

        if (Alloy.Globals.insights.state.singleAppMode) {
            hideFeedbackUI(function() {
                startup(showSingleAppModal);
            });
        } else {
            // on post login, get user properties or create a new user...
            app.state.properties.user = lib.client.users.getUserData(username);

            // update the prop that indicates whether or not the user session has expired
            lib.client.users.update.props.sessionExpired(Alloy.Globals.insights.state.currentUserEmailAddress, false);

            // #APPTS-5034
            updateFunnelCompareTimestamp();

            // next, we store the username as the lastUser...
            // this is used for scenarios where the app is force closed and the user restarts...
            // we also check the user's sessionExpired prop to confirm that we need assume the user is logged in...
            lib.client.app.update.props.lastUser(Alloy.Globals.insights.state.currentUserEmailAddress);  

            controllers.login._reset();
            controllers.menu.left._resetFromLogin();
            controllers.menu.right._onLogin();

            // post startup, we check to see if the user has run the application for the first time...
            // if this user has run the application before, we then check other essential user props: 
            startup(function() {
                var _dialog = null;

                if (!app.state.properties.user[0]) {
                    // clear the flag regardless of whether or not user looks at the guide...
                    app.state.properties.user.firstRun = true;
                    lib.client.users.update.props.firstRun(Alloy.Globals.insights.state.currentUserEmailAddress, app.state.properties.user.firstRun);

                    _dialog = Ti.UI.createAlertDialog({ title:'New Login Detected', message:'It looks like this is your first time logging in on this device or this is a new install.\n\nWould you like to take a look at the user guide?\n\nThe user guide is always accessible from the right application menu.', buttonNames:['Cancel', 'Open User Guide'] });
                    
                    _dialog.addEventListener('click', function(e) {
                        if (e.index === 1) {
                            openUserGuide(null, true, false, true); // we let the user guide know that on close, the menu tip should be shown...
                        } else {
                            hideWash(overlays.wash, false, function() {
                                // Alloy.Globals.insights.state.menuTip.controllers.show(null);
                            });
                        }
                    });

                    _dialog.show();
                } else {
                    // this prop should only have a value if the user did not logout themselves...
                    if (app.state.properties.user[2] && lib.platform.apiConsumer.guidInList(app.state.properties.user[2], Alloy.Globals.insights.state.appList)) {
                        Ti.API.info('Previously selected app found for the current user. Loading...');
                        controllers.menu.left._changeApp({}, function() {}, true, app.state.properties.user[2]);

                        app.state.properties.user[2] = null;
                        lib.client.users.update.props.lastSelectedGuid(Alloy.Globals.insights.state.currentUserEmailAddress, null);
                    } else {
                        // clear previously selected, if exists, because it is not longer in the list...
                        app.state.properties.user[2] = null;
                        lib.client.users.update.props.lastSelectedGuid(Alloy.Globals.insights.state.currentUserEmailAddress, null);

                        hideWash(overlays.wash, false, function() {
                            // Alloy.Globals.insights.state.menuTip.controllers.show(null);
                        });
                    }
                }           
            });
        }
    }
}

function processLogoutStart(onUIReady) {
    updateFeedbackUIMsg('Logging out...');
    showFeedbackUI(onUIReady);
}

function processLogoutComplete(error, msg, callback) {
    if (error) {
        // #TODO #ERROR: do nothing right now
    }

    // on logout, we expire the user's session prop...
    lib.client.users.update.props.sessionExpired(Alloy.Globals.insights.state.currentUserEmailAddress, true);

    // we also remove the previously selected app for security concerns...
    if (app.state.properties.user) { app.state.properties.user[2] = null; }    
    lib.client.users.update.props.lastSelectedGuid(Alloy.Globals.insights.state.currentUserEmailAddress, null);
    
    // on logout, we remove the last user from app props...
    app.state.properties.app.lastUser = null;
    lib.client.app.update.props.lastUser(null);

    Alloy.Globals.insights.state.loggedIn = false;
    Alloy.Globals.insights.state.currentUserEmailAddress = null;
    
    updateFeedbackUIMsg('Logout completed...');

    controllers.menu.left._resetFromLogout(callback);
    controllers.menu.right._onLogout();

    // user may logout before this is dismissed; will only hide if visible
    // Alloy.Globals.insights.state.menuTip.controllers.hide(false, null);
}

function showResumeAppAlert() {
    var _dialog = Ti.UI.createAlertDialog({ title:'App Restarted', message:'The application has been restarted after a force close. To protect the security of your account, your session has been expired.\n\nWould you like to log back in?\n\nYour production app list and previously selected app will be reloaded, if the production app is still available.\n\nIf you decide to cancel, your username will be cleared.', buttonNames:['Cancel', 'Login'] });

    _dialog.addEventListener('click', function(e) {
        if (e.index === 1) {
            Alloy.Globals.insights.state.loginVisible = true;
            showWash(overlays.wash);
            controllers.clock._toggleBg(true);
            controllers.login._show(null, app.state.properties.app.lastUser, true);
        } else {
            Ti.API.info('User decided not to login after resuming from a force close...');
            // we also remove the previously selected app for security concerns...
            lib.client.users.update.props.lastSelectedGuid(app.state.properties.app.lastUser, null);

            app.state.properties.app.lastUser = null;
            lib.client.app.update.props.lastUser(null);

            initTips();
        }
    })

    _dialog.show();
}

function finalizeUI() {
    // lib/androidBack will manage the back button long term
    if (OS_ANDROID) {
        $.appWin.addEventListener('androidback', function(e) {
            var alertDiag = null;

            if (controllers.menu.left._isOpen()) {
                controllers.menu.left._hideMenu(e);
            } else if (controllers.menu.right._isOpen()) {
                controllers.menu.right._hideMenu(e);
            } else if (controllers.login._isVisible()) {
                hideLogin();
            } else if (Alloy.Globals.insights.controllers.tips._isShowing()) {
                Alloy.Globals.insights.controllers.tips._closeTips();
            } else if (Alloy.Globals.insights.controllers.guide && Alloy.Globals.insights.controllers.guide._isShowing()) {
                Alloy.Globals.insights.controllers.guide._hide(function() {
                    $.appWin.remove(Alloy.Globals.insights.controllers.guide._getParentView());

                    Alloy.Globals.insights.controllers.guide = null;
                });

                hideWash(overlays.wash);
            } else {
                alertDiag = Ti.UI.createAlertDialog({ title:'Close Insights', message:'Are you sure you want to close Insights?', buttonNames:['Cancel', 'Yes'] });

                alertDiag.addEventListener('click', function(e) {
                    if (e.index === 1) {
                        $.appWin.close();
                    }
                });

                alertDiag.show();
            }
        });
    }

    controllers.apps.map._init({
        callbacks: {
            notifyOrbsVisibility: controllers.apps.overview._determineVisibility
        }
    });

    controllers.apps.overview._init({
        callbacks: {
            notifyDetail: controllers.apps.detail._processEvents,
            notifyMap: controllers.apps.map._processEvents
        }
    });

    controllers.apps.detail._init({
        callbacks: {
            notifyOverview: controllers.apps.overview._processEvents,
            notifyClock: controllers.clock._toggleColor,
            notifyLeftMenu: controllers.menu.left._processEvents,
            notifyRightMenu: controllers.menu.right._processEvents
        }
    });

    controllers.clock._init();

    // delay start to avoid stuttering as the map is reset
    if (OS_IOS) {
        setTimeout(function() {
            // #LOADER
            loader.largeIndicator.start();
            loader.largeIndicator.animate({ opacity:1.0, duration:250 });
        }, 500);
    }

    // artificial delay
    setTimeout(function() {
        if (OS_IOS) {
            // #LOADER
            // after hiding the logo, let's check if we need to resume...
            hideLoader(function() {
                if (app.state.properties.app.lastUser) {
                    // if there was a last user, we know that there is an associated user object 
                    // and that the app probably force closed...
                    // because of this, we need to get the user object and see if any persistence data 
                    // exists, like last app selected, for immediate action...
                    Ti.API.info ('Last user does exist and app will attempt to resume post-loader close...');
                    showResumeAppAlert();
                } else if (!app.state.properties.app.firstRun) {
                    // here we check whether or not the application has been run...
                    // if not, we need to also load up the user guide and do any other 
                    // first run activities...
                    // we will need to update this flag after the user guide is closed, because 
                    // we don't know if the app will crash from here until then...
                    Ti.API.info('First time running app on this device. Opening user guide...');
                    startWelcome();
                } else {
                    checkAppVersionAndConfig(null);

                    initTips();
                }
            });
        } else if (OS_ANDROID) {
            androidViews.startupWin.animate({ opacity:0.0, duration:100 }, function() {
                $.appWin.remove(androidViews.startupWin);

                androidViews.startupWin = null;
            });

            if (app.state.properties.app.lastUser) {
                showResumeAppAlert();
            } else if (!app.state.properties.app.firstRun) {
                Ti.API.info('First time running app on this device. Opening user guide...');
                startWelcome();
            } else {
                checkAppVersionAndConfig(null);

                initTips();
            }
        }
    }, 2500);
}

function prepareUI(onUIPrepared) {
    // #BUG: used to lock orientation change when wash is open (blur)...
    // Titanium.Gesture.addEventListener('orientationchange', function(e) {
    //     if (e.orientation === 3 || e.orientation === 4) {
    //         app.state.currentOrientation = e.orientation;
    //     }
    // });

    // for closing menus...
    overlays.wash.addEventListener('touchstart', function(e) {
        var _menuLeftOpen  = controllers.menu.left._isOpen(),
            _menuRightOpen = controllers.menu.right._isOpen(),
            _center        = null;

        if (app.state.wash.visible && (_menuLeftOpen || _menuRightOpen)) {
            if (_menuLeftOpen) { controllers.menu.left._hideMenu(e); }
            if (_menuRightOpen) { controllers.menu.right._hideMenu(e); }

            hideWash(overlays.wash);
        } else if (app.state.wash.visible && app.state.feedback.visible) {
            _center = { x:Alloy.Globals.insights.utils.PXToDP(Ti.Platform.displayCaps.platformWidth) / 2, y:Alloy.Globals.insights.utils.PXToDP(Ti.Platform.displayCaps.platformHeight) / 2 };
            
            feedbackContainer.animate({ center:{ x:_center.x - 6, y:_center.y }, curve:Ti.UI.ANIMATION_CURVE_EASE_IN, duration:100 }, function() {
                feedbackContainer.animate({ center:{ x:_center.x + 3, y:_center.y }, curve:Ti.UI.ANIMATION_CURVE_LINEAR, duration:100 }, function() {
                    feedbackContainer.animate({ center:{ x:_center.x, y:_center.y }, duration:50 });
                });    
            });
        }
    });

    // for opening left menu...
    overlays.swipeDetectors.left.addEventListener('touchstart', function(e) {
        var _menuLeftOpen  = controllers.menu.left._isOpen(),
            _menuRightOpen = controllers.menu.right._isOpen(),
            _loginVisible  = controllers.login._isVisible();

        if (!Alloy.Globals.insights.state.loginVisible) {
            if (!_menuLeftOpen && !app.state.feedback.visible) {
                if (!app.state.wash.visible) { showWash(overlays.wash); }
                if (_menuRightOpen) { controllers.menu.right._hideMenu({ preventCallback:true }); }            
                if (!_menuLeftOpen) { 
                    // if (Alloy.Globals.insights.state.menuTip.state.visible) {
                        // Alloy.Globals.insights.state.menuTip.controllers.hide(false, function() {
                            // controllers.menu.left._showMenu(e);
                        // });
                    // } else {
                        controllers.menu.left._showMenu(e);
                    // }
                }
            } else if (!app.state.feedback.visible) {
                // bounce menu
                if (_menuLeftOpen) { 
                    controllers.menu.left._showMenu(e);
                }
            }
        } else {
            Ti.API.info('Attempted to open left menu while login UI is visible...');
        }
    });

    // for opening right menu...
    overlays.swipeDetectors.right.addEventListener('touchstart', function(e) {
        var _menuLeftOpen  = controllers.menu.left._isOpen(),
            _menuRightOpen = controllers.menu.right._isOpen(),
            _loginVisible  = controllers.login._isVisible();

        if (!Alloy.Globals.insights.state.loginVisible) {
            if (!_menuRightOpen && !app.state.feedback.visible) {
                if (!app.state.wash.visible) { showWash(overlays.wash); }
                if (_menuLeftOpen) { controllers.menu.left._hideMenu({ preventCallback:true }); }
                if (!_menuRightOpen) { controllers.menu.right._showMenu(e); }
            } else if (!app.state.feedback.visible) {
                // bounce menu
                if (_menuRightOpen) { controllers.menu.right._showMenu(e); }
            }
        } else {
            Ti.API.info('Attempted to open right menu while login UI is visible...');
        }
    });

    overlays.swipeDetectors.top.addEventListener('touchstart', function(e) {        
        if (!app.state.feedback.visible && !app.state.wash.visible) {
            if (Alloy.Globals.insights.state.current.context.apps.map && controllers.apps.overview._isOrbsVisible()) {
                // hide orbs
                controllers.apps.overview._determineVisibility(true);
            } else if (Alloy.Globals.insights.state.current.context.apps.catOverview) {
                controllers.apps.overview._processSwipe({ direction:'down' });
            } else if (Alloy.Globals.insights.state.current.context.apps.catDetail) {
                controllers.apps.detail._hide();
            }
        }
    });

    overlays.swipeDetectors.bottom.addEventListener('touchstart', function(e) {        
        if (!app.state.feedback.visible && !app.state.wash.visible) {
            if (Alloy.Globals.insights.state.current.context.apps.map) {
                if (!controllers.apps.overview._isOverviewExpanded() && controllers.apps.overview._isOrbsVisible()) {
                    controllers.apps.overview._expandOverview();
                } else {
                    // show orbs
                    controllers.apps.overview._determineVisibility(false);
                }
            } else if (Alloy.Globals.insights.state.current.context.apps.catOverview) {
                controllers.apps.overview._processShowDetailRequest();
            } else if (Alloy.Globals.insights.state.current.context.apps.catDetail) {
                Ti.API.info('bounce');
            }
        }
    });

    // the menu container deals with handling of event to close...
    controllers.menu.left._init({
        callbacks: {
            onCloseMenu: function(preventHideWash) {
                if (app.state.wash.visible && !preventHideWash) {
                    hideWash(overlays.wash);
                }
            },
            onOpenMenu: function() {
                showWash(overlays.wash);
            },
            onUpdateRequest: changeToApp,
            onShowLoginRequest: function(callback) {
                Alloy.Globals.insights.state.loginVisible = true;
                controllers.clock._toggleBg(true);
                controllers.login._show(callback);
            }
        }
    });

    // the menu container deals with handling of event to close...
    controllers.menu.right._init({
        browser: controllers.browser,
        callbacks: {
            onCloseMenu: function(preventHideWash) {
                if (app.state.wash.visible && !preventHideWash) {
                    hideWash(overlays.wash);
                }
            },
            onOpenMenu: function() {
                showWash(overlays.wash);
            },
            onUserGuideRequest: openUserGuide,
            onUpdateRequest: function() {},
            onShowLoginRequest: function(callback) {
                Alloy.Globals.insights.state.loginVisible = true;
                controllers.clock._toggleBg(true);
                controllers.login._show(callback);
            },
            onLogoutRequest: function(callback) {
                controllers.login._logout(callback);
            }
        },
        notifications: {
            onTipsToggled: null
        }
    });

    controllers.login._init({
        browser: controllers.browser,
        callbacks: {
            onLoginStart: processLoginStart,
            onLoginComplete: processLoginComplete,
            onLogoutStart: processLogoutStart,
            onLogoutComplete: processLogoutComplete,
            onLoginCancel: hideLogin,
            onCustomDomain: setCustomDomain
        }
    });

    controllers.browser._init();

    // add primary views...
    $.appWin.add(controllers.apps.map._getParentView());
    $.appWin.add(controllers.apps.overview._getWash());
    $.appWin.add(controllers.apps.overview._getOrbView());
    $.appWin.add(controllers.apps.overview._getOverviewView());
    $.appWin.add(controllers.apps.detail._getParentView());

    // add menu tip
    // #TEMP Alloy.createController('tips')._createMenuTip($.appWin, {x:56, y:73});
    // Alloy.Globals.insights.state.menuTip.controllers.hide(true, null);

    // add menu overlay views
    $.appWin.add(controllers.menu.left._getOverlayBtnContainer());
    $.appWin.add(controllers.menu.right._getOverlayBtnContainer());

    // these detectors can be below the wash
    $.appWin.add(overlays.swipeDetectors.top);
    $.appWin.add(overlays.swipeDetectors.bottom);

    // wash should be positioned above any app views
    $.appWin.add(overlays.bg);
    overlays.wash.add(overlays.trans);
    $.appWin.add(overlays.wash);
    $.appWin.add(largeIndicator);

    // add menus
    $.appWin.add(controllers.menu.left._getParentView());
    $.appWin.add(controllers.menu.right._getParentView());
    // these are on top of the wash to allow for menu switching
    $.appWin.add(overlays.swipeDetectors.left);
    $.appWin.add(overlays.swipeDetectors.right);

    // clock
    $.appWin.add(controllers.clock._getParentView());
    
    $.appWin.add(controllers.login._getParentView());

    // #DEMO
    feedbackContainer.add(feedbackLbl);
    $.appWin.add(feedbackContainer);

    // we do this earlier with android
    if (OS_IOS) {
        $.appWin.open();
    }

    finalizeUI();
}

// obj: onStartupComplete (callback), apps (array)
function processAppList(obj) {
    // this is used to see if a previously selected GUID exists...
    Alloy.Globals.insights.state.appList = obj.apps || [];

    if (Alloy.Globals.insights.state.singleAppMode) {
        showSingleAppModal();
    } else {
        if (Alloy.Globals.insights.state.appList.length > 0) {
            updateFeedbackUIMsg('Processing Complete\n\nUpdating app list...');
        } else {
            updateFeedbackUIMsg('No production apps found...');
        }

        hideFeedbackUI(function () {
            controllers.menu.left._updateAppList(Alloy.Globals.insights.state.appList);

            // we don't want to hide the wash if we're showing the user guide
            if (!obj.onStartupComplete) {
                hideWash(overlays.wash);
            }

            // after hiding the wash, let's add the views
            controllers.menu.left._notifyMenuIsHidden();

            // #DEMO
            controllers.apps.overview._getOrbView().animate({ opacity:1.0, duration:250 });
            controllers.menu.left._getOverlayBtnContainer().animate({ opacity:1.0, duration:250 });
            controllers.menu.right._getOverlayBtnContainer().animate({ opacity:1.0, duration:250 });
            controllers.apps.map._getSessionCurrentCountView().animate({ opacity:1.0, duration:250 });

            // #BUG: have to be explicit...
            if (Alloy.Globals.insights.state.postLoginMethod !== null) {
                hideWash(overlays.wash);
                Alloy.Globals.insights.state.postLoginMethod();
                Alloy.Globals.insights.state.postLoginMethod = null;
            } else if (obj.onStartupComplete) {
                // we want to do the post login method... assumes user doesn't want the guide...
                obj.onStartupComplete();
            }
        });
    }
}

function retrieveAppList(onStartupComplete) {
    var _dialog = null; // for potential errors along the way...

    lib.platform.apiConsumer.getAppList(function(obj) {
        // recursive error handling...
        if (obj.error) {           
            updateFeedbackUIMsg('Error retrieving app list...');

            hideFeedbackUI(function() {
                _dialog = Ti.UI.createAlertDialog({ title:'App List Error', message:obj.msg, buttonNames:['Cancel', 'Try Again'] });

                _dialog.addEventListener('click', function(e) {
                    if (e.index === 1) {
                        updateFeedbackUIMsg('Retrieving production apps...');
                        showFeedbackUI();

                        retrieveAppList(onStartupComplete);
                    } else {           
                        Alloy.Globals.insights.state.singleAppMode = false;

                        controllers.login._logout();
                    }
                });

                _dialog.show();
            });
        } else {
            updateFeedbackUIMsg('Processing app list...');

            processAppList({
                onStartupComplete: onStartupComplete, 
                apps: obj.apps
            });
        }
    });
}

// post-login callback
// #TODO: onStartupComplete gets passed around alot at this point (recursive error handling), so this obviously needs refactoring...
function startup(onStartupComplete, resume) {
    if (Alloy.Globals.insights.state.singleAppMode) {
        generateSessionUpdateTimer();

        retrieveAppList(onStartupComplete);
    } else {
        // this is when the application is being resumed from a force close and the user session has not expired...
        if (resume) {
            showWash(overlays.wash, true);
            updateFeedbackUIMsg('Resuming session...');
            showFeedbackUI();
        } else {
            updateFeedbackUIMsg('Retrieving production apps...');
        }

        generateSessionUpdateTimer();

        retrieveAppList(onStartupComplete);
    }
}

function hideLoader(onComplete) {
    var _onComplete = onComplete || null;

    if (OS_IOS) {
        loader.largeIndicator.cancel();
    }

    loader.bg.animate({ opacity:0.0, transform:Ti.UI.create2DMatrix({ scale:1.2 }), duration:500 }, function() {
        if (_onComplete) { _onComplete(); }
    });
}

function disableTips(type) {
    Alloy.Globals.insights.controllers.tips._disable(type);
}

function enableTips(type) {
    Alloy.Globals.insights.controllers.tips._enable(type);
}

// these tips are shown when the user is at the base of the app
function showMapTipSet() {
    Alloy.Globals.insights.controllers.tips._showTips('currentSessionMap');
}

// tips controls have been instantiated @ global > controllers object
function initTips() {
    if (!Alloy.Globals.insights.controllers.tips._isInit()) {
        Alloy.Globals.insights.controllers.tips._init({
            enabled: {
                map: app.state.properties.app.tipsMapEnabled,
                overview: app.state.properties.app.tipsOverviewEnabled,
                detailStandard: app.state.properties.app.tipsDetailStandardEnabled,
                detailFunnel: app.state.properties.app.tipsDetailFunnelEnabled
            },
            callbacks: {
                onEnable: function() {
                    if (Alloy.Globals.insights.state.current.context.apps.map) {
                        lib.client.app.update.props.tipsMapEnabled(true);
                    }

                    if (Alloy.Globals.insights.state.current.context.apps.catOverview) {
                        lib.client.app.update.props.tipsOverviewEnabled(true);
                    }

                    if (Alloy.Globals.insights.state.current.context.apps.catDetailStandard) {
                        lib.client.app.update.props.tipsDetailStandardEnabled(true);
                    }

                    if (Alloy.Globals.insights.state.current.context.apps.catDetailFunnel) {
                        lib.client.app.update.props.tipsDetailFunnelEnabled(true);
                    }
                },
                onDisable: function() {
                    if (Alloy.Globals.insights.state.current.context.apps.map) {
                        lib.client.app.update.props.tipsMapEnabled(false);
                    }

                    if (Alloy.Globals.insights.state.current.context.apps.catOverview) {
                        lib.client.app.update.props.tipsOverviewEnabled(false);
                    }

                    if (Alloy.Globals.insights.state.current.context.apps.catDetailStandard) {
                        lib.client.app.update.props.tipsDetailStandardEnabled(false);
                    }

                    if (Alloy.Globals.insights.state.current.context.apps.catDetailFunnel) {
                        lib.client.app.update.props.tipsDetailFunnelEnabled(false);
                    }
                },
                showTipsForContext: function() {
                    if (Alloy.Globals.insights.state.current.context.apps.map) {
                        Ti.API.info('Show map tip set if possible...');
                        
                        if (Alloy.Globals.insights.controllers.tips._isMapEnabled()) {
                            showMapTipSet();
                        }
                    }

                    if (Alloy.Globals.insights.state.current.context.apps.catOverview) {
                        Ti.API.info('Show overview tip set if possible...');

                        if (Alloy.Globals.insights.controllers.tips._isOverviewEnabled()) {
                            controllers.apps.overview._showOverviewTipSet();
                        }
                    }

                    if (Alloy.Globals.insights.state.current.context.apps.catDetailStandard) {
                        Ti.API.info('Show detail standard tip set if possible...');

                        if (Alloy.Globals.insights.controllers.tips._isDetailStandardEnabled()) {
                            controllers.apps.detail._showDetailStandardTipSet();
                        }
                    }

                    if (Alloy.Globals.insights.state.current.context.apps.catDetailFunnel) {
                        Ti.API.info('Show detail funnel tip set if possible...');

                        if (Alloy.Globals.insights.controllers.tips._isDetailFunnelEnabled()) {
                            controllers.apps.detail._showDetailFunnelTipSet();
                        }
                    }
                }
            }
        });

        $.appWin.add(Alloy.Globals.insights.controllers.tips._getParentView());

        if (Alloy.Globals.insights.controllers.tips._isMapEnabled()) {
            Alloy.Globals.insights.controllers.tips._enable();
        }
    }
}

function startWelcome() {
    var _welcomeController = Alloy.createController('welcome');

    _welcomeController._init({
        callbacks: {
            onUserGuideRequest: openUserGuide,
            onVideoClose: function() {
                if (!app.state.properties.app.firstRun) {
                    app.state.properties.app.firstRun = true;
                    lib.client.app.update.props.firstRun(app.state.properties.app.firstRun);

                    initTips();
                }
            }
        }
    });

    $.appWin.add(_welcomeController._getParentView());

    showWash(overlays.wash, true);
}

// prepares app by requesting demo data (using local if error), 
// setting up ui, and presenting login ui...
function prepareApp() {
    // we might get an error, but the getDemoData function will handle it 
    // for us...
    Alloy.Globals.insights.updating.app = true;
    
    generateLastUpdatedTimer();

    // show loader on applciation start
    loader.bg.add(loader.largeIndicator);
    if (!OS_ANDROID) { $.appWin.add(loader.bg); } // #ATEMP: not yet supported on Android...

    // GET APP AND USER DATA...
    // we need to get user data first in-case there is a need to refresh persisted data...
    app.state.properties.app = lib.client.app.getAppData();

    // #VPC support
    Alloy.Globals.insights.state.customDomain = app.state.properties.app.customDomain || null;

    getDemoData(function(error) {
        Alloy.Globals.insights.updating.app = false;

        prepareUI();

        // we open the apen window a little later... #TODO
        if (OS_IOS) {
            $.appWin.open();
        }
    });
    
}

// This also grabs the app configuration!
function checkAppVersionAndConfig(onComplete) {
    var _client     = Ti.Network.createHTTPClient({ timeout:10000 }),
        _onComplete = onComplete || null;

    _client.onload = function() {
        var _parsedData  = null,
            _data        = null,
            _versionData = null,
            _updateData  = null,
            _appStoreUrl = null,
            _dialog      = null;

        try {
            _parsedData  = JSON.parse(this.responseText);
            _data        = _parsedData[Alloy.Globals.insights.specs.supported[(OS_ANDROID) ? 0 : 1]],
            _versionData = _data.version,
            _updateData  = _data.update,
            _appStoreUrl = _data.appStoreUrl,
            _dialog      = null;

            Alloy.Globals.insights.timeout = _parsedData.config.timeout;

            Ti.API.info('Data request timeout set to: ' + Alloy.Globals.insights.timeout);

            if (!lib.client.appInfo.isCurrent(_versionData)) {
                if (_onComplete) { _onComplete(); }

                _dialog = Ti.UI.createAlertDialog({ title:_updateData.title, message:_updateData.message + '\n\nLatest Version: ' + lib.client.appInfo.formatVersionFromSegments(_versionData) + '\nYour Version: ' + lib.client.appInfo.getVersionAsString(), buttonNames:['Cancel', _updateData.btnTitle] });
                
                _dialog.addEventListener('click', function(e) {
                    if (e.index === 1) {
                        Ti.Platform.openURL(_appStoreUrl);
                    }
                });

                Ti.API.info('New version is available.');

                _dialog.show();
            } else {
                Ti.API.info('No new version is available.');

                if (_onComplete) { _onComplete(); }
            } 
        } catch(err) {
            Ti.API.info('App config read error...');
            Ti.API.info(err);
            if (_onComplete) { _onComplete(); }
        }
    };

    _client.onerror = function() {
        Ti.API.info('Unable to process remote appconfiguration. Skipping...');
        if (onComplete) { onComplete(); }
    };

    _client.open('GET', (Alloy.Globals.insights.state.debug) ? (Alloy.Globals.insights.info.preProdUrlBase + Alloy.Globals.insights.info.version.app) : (Alloy.Globals.insights.info.prodUrlBase + Alloy.Globals.insights.info.version.app));
    _client.send(null);
}

// destroy session timer...
// #TODO: do we need to pause the data age timer?
function onAppPaused(e) {
    Ti.API.info('App Paused...');

    if (app.timers.sessions) {
        // app.timers.sessions.controllers.stop();
    }
}

// refresh app, which will resume sessoin timer...
function onAppResumed(e) {
    // #APPTS-3700: Update sessions map...
    if (!Alloy.Globals.insights.updating.app && Alloy.Globals.insights.guid !== -1) {
        Ti.API.info('App resumed...');

        // #APPTS-5034
        updateFunnelCompareTimestamp();
        
        Ti.API.info('App Resumed, reloading session data for selected app...');
        app.timers.sessions.controllers.stop();
        updateSessionsUI(null);
    } else {
        Ti.API.info('App Resumed, but not reloading session data for demo app or client is updating...');
    }
}

if (OS_IOS) {
    Ti.App.addEventListener('paused', onAppPaused);
    Ti.App.addEventListener('resumed', onAppResumed);
    Ti.App.addEventListener('keyboardframechanged', function(e) {
        // we don't check to see if these are visible...
        controllers.login._reposition(e);
        controllers.menu.left._reposition(e);
    });
}

prepareApp();

if (Ti.Platform.osname === 'iphone' || Ti.Platform.osname === 'ipad') {
    var touchTestModule = undefined;
    try {
        touchTestModule = require("com.soasta.touchtest");
    } catch (tt_exception) {
        Ti.API.error("com.soasta.touchest module is required");
    }

    var cloudTestURL = Ti.App.getArguments().url;
    if (cloudTestURL != null) {
        // The URL will be null if we don't launch through TouchTest.
        touchTestModule && touchTestModule.initTouchTest(cloudTestURL);
    }

    Ti.App.addEventListener('resumed', function(e) {
        // Hook the resumed from background
        var cloudTestURL = Ti.App.getArguments().url;
        if (cloudTestURL != null) {
            touchTestModule && touchTestModule.initTouchTest(cloudTestURL);
        }
    });
}

