var config = require('alloy').CFG;

var menu = {
    open: false,
    transform: null,
    delta: {
        start: 0,
        end: 0
    },
    demo: {
        name: config.demo.name,
        guid: config.demo.guid
    }
};

var state = {
    filtered: false,
    totalAllowedPinnedApps: 3,
    currentKeyboardFrameHeight: 0,
    unpinnedApp: null,
    unpinnedAppRowIndex: null,
    focusedRowIndex: -1, // this is used for when the table is scrolled (tochend won't be enough)
    viewingDark: false,
    selectedAppGuid: null,
    selectedAppRow: null,
    currentApp: null,
    currentAppIndex: null,
    apps: [],
    appRows: [],
    filter: {
        focused: false
    },
    callbacks: {
        onCloseMenu: null,
        onOpenMenu: null,
        onUpdateRequest: null
    }
};

var lib = {
    events: require('client/events')(),
    users: require('client/users')()
};

function getParentView() {
    return $.parentContainer;
}

function getPlatformIcon(url) {
    var _url = (url && url !== 'undefined') ? url : null;
 
    var _platforms = {
        ios: {
            finder: 'apple.png',
            url: '/images/nav/platform-ios.png'
        },
        android: {
            finder: 'android.png',
            url: '/images/nav/platform-android.png'
        }
    };
 
    var _prepend = '/img/placeholders/appicons/native-appdefault-';
 
    var _indexPlatform = -1,
        _indexPrepend  = (_url) ? _url.indexOf(_prepend) : -1;
 
    var _finalUrlIcon = null;
 
    if (_url && _url !== 'undefined') {
        if (_indexPrepend !== -1) {
            for (var _i in _platforms) {
                _indexPlatform = _url.indexOf(_platforms[_i].finder);
 
                if (_indexPlatform !== -1) {
                    _finalUrlIcon = _platforms[_i].url;
                    break;
                }
            }
 
            if (_indexPlatform === -1) { _finalUrlIcon = null; }
        } else {
            _finalUrlIcon = null;
        }
    }
 
    return _finalUrlIcon;
}

function showMenuManual() {
    showMenu({ type:'manual' });
}

function hideMenuManual() {
    hideMenu({ type:'manual' });
}

function reposition(e) {
    if (Ti.App.keyboardVisible) {
        $.appListEmptyContainer.animate({ bottom:e.keyboardFrame.height, duration:250 });
        $.loginContainer.animate({ bottom:e.keyboardFrame.height, duration:250 });
    } else {
        $.appListEmptyContainer.animate({ bottom:88, duration:250 });
        $.loginContainer.animate({ bottom:88, duration:250 });
    }
}

function showMenu(e, callback) {
    var _source = e.source || {};
        _id     = _source.id || null;

    if (!menu.open && !Alloy.Globals.insights.state.menuRightVisible) {
        menu.open = true;
        Alloy.Globals.insights.state.menuLeftVisible = true; // prevent both menus from being open at once

        if (_id === 'overlayBtnContainer') {
            focusMoreBtn();
            // if (state.viewingDark) {
            //     $.moreBtnDark.opacity = 0.0;
            // } else {
            //     $.moreBtnLight.opacity = 0.0;
            // }

            // $.moreBtnTouch.opacity = 1.0;
        }

        lib.events.fireEvent(lib.events.EVT.HOME.APPSELECTOR);

        notifyMenuIsShowing();

        if (!e.preventCallback) {
            state.callbacks.onOpenMenu();
        }

        if (callback) { callback(); }
    }

    if (!Alloy.Globals.insights.state.menuRightVisible) {
        // this will bounce if the menu is still open
        $.parentContainer.animate({ transform:Ti.UI.create2DMatrix({ scale:1.0 }), left:-6, duration:150, curve:Ti.UI.ANIMATION_CURVE_EASE_IN }, function() {
            // if we don't check this callback, it will be possible to open both menus
            if (menu.open) {
                $.parentContainer.animate({ left:-10, duration:100 }, function() {
                    $.currentAppInMenuContainer.animate({ opacity:1.0, duration:250 });
                });
            }
        });
    }
}

function hideMenu(e, callback, preventHideWash) {
    if (menu.open) {
        menu.open = Alloy.Globals.insights.state.menuLeftVisible = false;

        if (!e.preventCallback) {
            state.callbacks.onCloseMenu(preventHideWash);
        }

        if (state.filter.focused) {
            blurFilterField({ type:'force' });
        }

        $.parentContainer.animate({ transform:Ti.UI.create2DMatrix({ scale:1.2 }), left:-402, duration:250 }, function() {
            notifyMenuIsHidden();

            if (callback) {
                callback();
            }

            // $.parentContainer.opacity = 1.0;
            $.currentAppInMenuContainer.opacity = 0.0;
        });
    }
}

function isOpen() {
    return menu.open;
}

function filterAppList() {
    for (var a = 0, al = state.apps.length; a < al; a ++) {
        if (state.apps[a].name.toLowerCase().indexOf($.filterField.value.toLowerCase()) !== -1) {
            state.appRows[a].state.inList = true;
            Ti.API.info('APP OK: ' + state.apps[a].name);
        } else {
            state.appRows[a].state.inList = false;
            Ti.API.info('FILTERING OUT: ' + state.apps[a].name);
        }
    }

    updateAppListFromFilter();
}

function updateAppList(apps) {
    // check to see if the user is logged in...
    if (Alloy.Globals.insights.state.loggedIn) {
        state.apps = apps || [];

        if (state.apps.length > 0) {
            // update the value in the filter component...
            $.filterTotalCountLbl.text = (state.apps.length < 10) ? ('0' + state.apps.length) : state.apps.length;

            // do we have pinned apps?
            if (getPinnedAppsList()) {
                updateAppListWithPinnedApps();
            } else {
                setAppList();
            }

            if (!state.currentApp) {
                updateCurrentApp(state.apps[0], 0);
            }
        } else {
            Ti.API.info('No apps to render in app list...');
            setAppList();
        }
    } else {
        // if not, still set the app list, but disable the table
        setAppList();
    }
}

function getOverlayBtnContainer() {
    return $.overlayBtnContainer;
}

function notifyMenuIsShowing() {
    $.overlayBtnContainer.animate({ opacity:0.0, duration:250 });
}

function notifyMenuIsHidden() {
    $.overlayBtnContainer.animate({ opacity:1.0, duration:250 });
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

function processSwipe(e) {
    if (e.direction === 'left') {
        hideMenu(e);
    } else if (e.direction === 'right') {
        showMenu(e);
    }
}

function updateCurrentApp(app, index) {
    var _app   = app || {},
        _index = index; // -1 is demo

    if (_index === -1 && state.selectedAppRow) {
        state.selectedAppRow.controllers.setCurrent(false);
    }

    state.currentApp = _app;
    state.currentAppIndex = (_index === -1) ? -1 : 0;

    $.currentAppNameLblDark.text = $.currentAppNameLblLight.text = state.currentApp.name;
    $.currentAppInMenuLbl.text = state.currentApp.name;

    $.demoBgTouch.opacity = (state.currentAppIndex === -1) ? 1.0 : 0.0;
    $.demoBg.opacity = (state.currentAppIndex === -1) ? 0.0 : 1.0;
}

// TODO: also animate filter count
function blurFilterField(e) {
    var _obj  = e || {},
        _type = _obj.type || null;

    state.filter.focused = false;

    if (_type !== 'blur' || _type === 'force') {
        $.filterField.softKeyboardOnFocus = Ti.UI.Android.SOFT_KEYBOARD_HIDE_ON_FOCUS;
        $.filterField.blur();
    }

    $.filterField.editable = false;
    $.filterField.touchEnabled = false;

    $.clearFilterBtn.animate({ opacity:0.0, duration:250 }, function() {
        $.clearFilterBtn.visible = false;
    });
    $.filterBg.animate({ backgroundColor:'#969696', duration:250 });

    if ($.filterField.value.length > 0) {
        $.filterField.color = '#333';
        $.filterField.animate({ left:38, duration:250 });
        $.filterLbl.animate({ left:50, duration:250 });
    } else {
        $.filterLbl.animate({ left:50, opacity:1.0, duration:250 });
    }
}

function focusFilterField(e) {
    var _dialog = null;

    if (Alloy.Globals.insights.state.loggedIn && state.apps.length > 0) {
        state.filter.focused = true;

        $.filterField.color = '#f2f2f2', 

        $.filterBg.animate({ backgroundColor:'#333', duration:250 });
        $.clearFilterBtn.visible = true;
        $.clearFilterBtn.animate({ opacity:1.0, duration:250 });
        $.filterField.animate({ left:68, duration:250 });
        $.filterLbl.animate({ left:80, duration:250 }, function() {
            $.filterField.editable = true;
            $.filterField.touchEnabled = true;
            $.filterField.softKeyboardOnFocus = Ti.UI.Android.SOFT_KEYBOARD_SHOW_ON_FOCUS;
            $.filterField.focus();
        });
    } else {
        $.filterLbl.animate({ left:40, duration:100, curve:Ti.UI.ANIMATION_CURVE_EASE_IN }, function() {
            $.filterLbl.animate({ left:60, duration:50, curve:Ti.UI.ANIMATION_CURVE_LINEAR }, function() {
                $.filterLbl.animate({ left:50, duration:50 }, function() {
                    if (menu.open) {
                        _dialog = Ti.UI.createAlertDialog({
                            title: 'Filter Error',
                            message: (Alloy.Globals.insights.state.loggedIn && state.apps.length === 0) ? 'There aren\'t any production apps available to filter.\n\nPlease contact your administrator for additional information.' : 'You must be logged in to filter your production apps.\n\nWould you like to login now?',
                            buttonNames: (Alloy.Globals.insights.state.loggedIn && state.apps.length === 0) ? ['Ok'] : ['Cancel', 'Login']
                        });

                        _dialog.addEventListener('click', function(e) {
                            // show login UI
                            if (e.index === 1) {
                                // #TODO: not providing a post-login method (re-open the left menu)...
                                // will see what customer feedback is (we don't do this now for the login message in the left menu)
                                // Alloy.Globals.insights.state.postLoginMethod = showInsightsFeedbackAlert;
                                
                                Alloy.Globals.insights.state.loginVisible = true;
                                hideMenu({}, state.callbacks.onShowLoginRequest, true);
                            } else {
                                // #TODO: see above note...
                                // Alloy.Globals.insights.state.postLoginMethod = null;
                            }
                        });

                        _dialog.show();
                    }
                });
            });
        });
    }
}

function clearFilterField(e, preventFilter) {
    if ($.filterField.value.length > 0) {
        $.filterField.value = '';

        // #BUG: weird that i have to call this manually
        // we need to sometime prevent filtering e.g. logout reset...
        filterFieldChanged({}, preventFilter);
    } else {
        blurFilterField(e);
    }
}

// last (bool)
function createAppRow(config) {
    var _config = config || {}; 
    
    var _appRow = {
        parent: null,
        controllers: {
            setCurrent: function(current) {
                _bar.backgroundColor = (current) ? '#f2f2f2' : '#969696';
            },
            focusRow: function() {
                state.focusedRowIndex = _appRow.state.index;
                _appRow.views.focusBg.animate({ opacity:1.0, duration:0 }, function() {
                    state.focusedRowIndex = -1;
                    _appRow.views.focusBg.animate({ opacity:0.0, duration:100 });
                });
            },
            blurRow: function() {
                state.focusedRowIndex = -1;
                _appRow.views.focusBg.animate({ opacity:0.0, duration:100 });
            },
            destroy: function() {
                Ti.API.info('Deleting row from app list...');

                _pinnedBtn     = null,
                _pinnedDelBtn  = null,
                _bar           = null,
                _lbl           = null,
                _focusBg       = null,
                _appRow.parent = null,
                _appRow        = null;
            }
        },
        state: {
            inList: true,
            index: _config.index,
            selected: true
        },
        views: {
            focusBg: Ti.UI.createView({ touchEnabled:false, opacity:0.0, backgroundColor:'#999', width:Ti.UI.FILL, height:Ti.UI.FILL })
        }
    };

    var _lbl = Ti.UI.createLabel({
        font: {
            fontFamily: "TitilliumText22L-1wt",
            fontSize: 16
        },
        color: '#333',
        height: Ti.UI.SIZE,
        left: (_config.nativeIcon) ? 96 : 50,
        width: (_config.nativeIcon) ? 190 : 236,
        text: state.apps[_config.index].name,
        touchEnabled: false,
        includeFontPadding: false // #WORKAROUND
    });

    var _bar = Ti.UI.createView({ touchEnabled:false, height:1, left:50, right:0, backgroundColor:'#969696', bottom:0 });
    
    var _pinnedBtn    = null,
        _pinnedDelBtn = null;

    var _nativeIcon = (_config.nativeIcon) ? Ti.UI.createView({ touchEnabled:false, left:50, width:36, height:19, backgroundImage:_config.nativeIcon }) : null;

    _appRow.parent = Ti.UI.createTableViewRow({ className:'appRow', backgroundImage:'', backgroundColor:'transparent', backgroundSelectedColor:'transparent', width:Ti.UI.FILL, height:50 });
    
    _appRow.parent.add(_appRow.views.focusBg);
    _appRow.parent.add(_lbl);

    // TODO: it would be nice to not render the last bar, but need to handle filtering
    // if (!_config.last) {
        _appRow.parent.add(_bar);
    // }

    if (_nativeIcon) { _appRow.parent.add(_nativeIcon); }

    // views and related for pinned app rows
    if (state.apps[_config.index].pinned) {
        _pinnedBtn = Ti.UI.createView({ index:_config.index, bubbleParent:false, width:50, height:50, backgroundImage:'/images/nav/pinned-app-icon.png', right:0 });
        _pinnedDelBtn = Ti.UI.createView({ opacity:0.0, transform:Ti.UI.create2DMatrix({ scale:0.1 }), backgroundImage:'/images/nav/pinned-app-delete-icon.png', width:50, height:50, right:0, touchEnabled:false });
        
        _appRow.parent.add(_pinnedBtn);
        _appRow.parent.add(_pinnedDelBtn);

        _pinnedBtn.addEventListener('click', function(e) {
            var _app   = state.apps[e.source.index],
                _index = e.source.index;
            
            var _unpinDialog = Ti.UI.createAlertDialog({ 
                title: 'Unpin Application', 
                message: 'Are you sure you want to unpin the application "' + _app.name + '"?',
                buttonNames: ['Cancel', 'Unpin']
            });

            _pinnedBtn.animate({ opacity:0.0, duration:250, transform:Ti.UI.create2DMatrix({ scale:0.1 }) });
            _pinnedDelBtn.animate({ opacity:1.0, duration:250, transform:Ti.UI.create2DMatrix({ scale:1.0 }) });
            
            _unpinDialog.addEventListener('click', function(e) {
                if (e.index === 1) {
                    _pinnedDelBtn.animate({ opacity:0.0, duration:250 });
                    _bar.animate({ left:70, opacity:0.0, duration:250 });
                    _lbl.animate({ left:70, opacity:0.0, duration:250 }, function() {
                        unpinApp(_app, _index);
                    });
                } else {
                    _pinnedBtn.animate({ opacity:1.0, duration:250, transform:Ti.UI.create2DMatrix({ scale:1.0 }) });
                    _pinnedDelBtn.animate({ opacity:0.0, duration:250, transform:Ti.UI.create2DMatrix({ scale:0.1 }) });
                }
            });

            _unpinDialog.show();
        });
    }

    // if this row is selected, create reference so that we can update the bar
    if (state.selectedAppGuid === _config.guid) {
        state.selectedAppRow = _appRow;
        _appRow.controllers.setCurrent(true);
    }

    _appRow.parent.index = _config.index;

    _appRow.parent.addEventListener('touchstart', _appRow.controllers.focusRow);
    // _appRow.parent.addEventListener('touchend', _appRow.controllers.blurRow);

    return _appRow;
}

function unpinApp(app, index) {
    var _currentPinnedAppList = getPinnedAppsList();

    // it should be the currently selected app, which is always index 0
    if (index === 0) {
        state.unpinnedApp = app.guid;
    }

    _currentPinnedAppList.splice(_currentPinnedAppList.indexOf(app.guid), 1);

    lib.users.update.props.pins(Alloy.Globals.insights.state.currentUserEmailAddress, _currentPinnedAppList);

    updateAppListWithPinnedApps();
}

function setPinnedAppsList(guid) {
    var _currentPinnedAppList = getPinnedAppsList(), // grab pins for the current user...
        _alreadyExists        = false,
        _foundIndex           = 0,
        _atTop                = false;

    if (_currentPinnedAppList) {
        // check to see if the app already exists
        for (var pai = 0, pal = _currentPinnedAppList.length; pai < pal; pai++) {
            if (guid === _currentPinnedAppList[pai] && guid === _currentPinnedAppList[0]) {
                Ti.API.info('App already pinned and is at top. Aborting...');

                _alreadyExists = true;
                _atTop         = true;
                break;
            } else if (guid === _currentPinnedAppList[pai] && guid !== _currentPinnedAppList[0]) {
                Ti.API.info('App already pinned, but is not at top.');

                _alreadyExists = true;
                _atTop         = false;
                break;
            }
        }

        // only change if the guid doesn't already exist or if the app is pinned,
        // but is not at the top
        if (!_alreadyExists || !_atTop) {
            if (_alreadyExists) {
                // find the index for the existing app that is not at the top
                _foundIndex = _currentPinnedAppList.indexOf(guid);

                // get rid of the found app so that it can be placed at the start
                _currentPinnedAppList.splice(_foundIndex, 1);

                Ti.API.info('Removed previously pinned app not at top and re-adding to top...');
            } else if (_currentPinnedAppList.length === state.totalAllowedPinnedApps) {
                // remove last guid, but only if we have a full list
                _currentPinnedAppList.pop();

                Ti.API.info('Pinned app does not already exist. Adding...');
            }

            // add guid to start
            _currentPinnedAppList.unshift(guid);

            lib.users.update.props.pins(Alloy.Globals.insights.state.currentUserEmailAddress, _currentPinnedAppList);
            // Ti.App.Properties.setList('pinnedAppsList', _currentPinnedAppList);
        }
    } else {
        // create prop with initial guid
        lib.users.update.props.pins(Alloy.Globals.insights.state.currentUserEmailAddress, [guid]);
        // Ti.App.Properties.setList('pinnedAppsList', [guid]); 
    }
}

function getPinnedAppsList() {
    return lib.users.getPinnedListData(Alloy.Globals.insights.state.currentUserEmailAddress);
}

function deletePinnedAppsList() {
    // Ti.App.Properties.setList('pinnedAppsList', null);
}

function changeApp(e, callback, fromResumeOrRefresh, guid) {
    var _index = null;

    // if the user is currently in a demo state, provide confirmation
    if (state.currentAppIndex === -1) {
        // TODO
        // alert('PLACEHOLDER, disable demo confirmation');
    }

    // single app mode
    if (Alloy.Globals.insights.state.singleAppMode) {
        state.callbacks.onUpdateRequest(null, null, callback);
    // TODO
    // we need to confirm with the user whether or not they would like to also
    // enable the tour or just view the data without
    } else if (e.type === 'demo') {
        // #APPTS-3642: don't allow the user to reselect the demo app if already selected
        if (state.selectedAppGuid !== -1) {
            // #APPTS-3742: reset...
            $.lastUpdatedLbl.text = '--';

            state.selectedAppGuid = -1;
            
            state.callbacks.onUpdateRequest(-1, null, callback); // #DEMO

            if (menu.open) {
                hideMenu({}, function() {
                    updateCurrentApp(menu.demo, -1);
                }, true);
            } else {
                updateCurrentApp(menu.demo, -1);
            }
        } else {
            // #APPTS-3642: // don't refresh - just close - if demo is already selected
            if (menu.open) {
                hideMenu({}, function() {}, false);
            }
        }
    } else {
        // #TODO: duplicate code; refactor this...
        if (menu.open) {
            hideMenu({}, function() {
                // for resume or refresh, we have to find the right index so we select the correct row...
                // #TODO: refresh doesn't need to do this...
                if (fromResumeOrRefresh) {
                    for (var ai = 0, al = state.apps.length; ai < al; ai++) {
                        if (state.apps[ai].guid === guid) {
                            _index = ai;
                            break;
                        }
                    }
                } else {
                    _index = e.source.index; // it's important to use the source index, due to filtering...
                }

                state.callbacks.onUpdateRequest(state.apps[_index].guid, state.apps[_index].org, callback, function(error) {
                    // we don't want to update the UI if there is a request error...
                    if (!error) {
                        state.selectedAppGuid = state.apps[_index].guid;

                        lib.events.fireEvent(lib.events.EVT.HOME.SELECTAPP);
                        
                        // do menu based updates first then callback
                        if (menu.open) {
                            hideMenu({}, function() {
                                updateCurrentApp(state.apps[_index], _index);

                                // pin app...
                                setPinnedAppsList(state.apps[_index].guid);

                                // then update the app list...
                                updateAppListWithPinnedApps();

                                $.appListContainer.scrollToTop(0, { animated:false });
                            }, true);
                        } else {
                            updateCurrentApp(state.apps[_index], _index);

                            // pin app...
                            setPinnedAppsList(state.apps[_index].guid);

                            // then update the app list...
                            updateAppListWithPinnedApps();

                            $.appListContainer.scrollToTop(0, { animated:false });
                        }
                    } else {
                        Ti.API.info('There was a request error and the app list UI will not update...');
                        hideMenu({}, null, true);
                    }
                });
            }, true);
        } else {
            // for resume or refresh, we have to find the right index so we select the correct row...
            // #TODO: refresh doesn't need to do this...
            if (fromResumeOrRefresh) {
                for (var ai = 0, al = state.apps.length; ai < al; ai++) {
                    if (state.apps[ai].guid === guid) {
                        _index = ai;
                        break;
                    }
                }
            } else {
                _index = e.source.index; // it's important to use the source index, due to filtering...
            }

            state.callbacks.onUpdateRequest(state.apps[_index].guid, state.apps[_index].org, callback, function(error) {
                // we don't want to update the UI if there is a request error...
                if (!error) {
                    state.selectedAppGuid = state.apps[_index].guid;

                    lib.events.fireEvent(lib.events.EVT.HOME.SELECTAPP);
                    
                    // do menu based updates first then callback
                    if (menu.open) {
                        hideMenu({}, function() {
                            updateCurrentApp(state.apps[_index], _index);

                            // pin app...
                            setPinnedAppsList(state.apps[_index].guid);

                            // then update the app list...
                            updateAppListWithPinnedApps();

                            $.appListContainer.scrollToTop(0, { animated:false });
                        }, true);
                    } else {
                        updateCurrentApp(state.apps[_index], _index);

                        // pin app...
                        setPinnedAppsList(state.apps[_index].guid);

                        // then update the app list...
                        updateAppListWithPinnedApps();

                        $.appListContainer.scrollToTop(0, { animated:false });
                    }
                } else {
                    Ti.API.info('There was a request error and the app list UI will not update...');
                    hideMenu({}, null, true);
                }
            });
        }
    }
}

function updateAppListFromFilter() {
    var _count                  = 0,
        _appLength              = state.apps.length,
        _filteredAppListViewArr = [];

    for (var na = 0, nal = state.apps.length; na < nal; na++) {
        if (state.appRows[na].state.inList) {
            _filteredAppListViewArr.push(state.appRows[na].parent);
            _count ++;
        }
    }

    $.appListContainer.data = _filteredAppListViewArr;

    $.filterCountLbl.text = (_count < 10) ? ('0' + _count) : _count;
    $.filterTotalCountLbl.text = (_appLength < 10) ? ('0' + state.apps.length) : state.apps.length;
}

// this will iterate the app list and remove any pinned apps that are no longer available...
function cleanPinnedApps() {
    var _pinnedAppsList = getPinnedAppsList() || [],
        _found          = false,
        _didItChange    = false;

    for (var pi = 0, pl = _pinnedAppsList.length; pi < pl; pi++) {
        for (var ai = 0, al = state.apps.length; ai < al; ai++) {
            if (_pinnedAppsList[pi] === state.apps[ai].guid) {
                _found = true;
                break;
            } else {
                _found = false;
            }
        }

        if (!_found) {
            _didItChange = true;
            _pinnedAppsList.splice(pi, 1);
            
            pl = _pinnedAppsList.length,
            pi = -1; // start back at zero
        }
    }

    if (_didItChange) {
        Ti.API.info('Not all pinned apps are available. Updating...');
        lib.users.update.props.pins(Alloy.Globals.insights.state.currentUserEmailAddress, _pinnedAppsList);
    } else {
        Ti.API.info('All apps that are pinned are available...');
    }
}

function updateAppListWithPinnedApps() {
    var _sortedAppsListViewArr = [],
        _pinnedAppsList        = null,
        _pinnedAppsListLength  = 0,
        _foundIndex            = 0,
        _pinnedAppsToInsert    = [];

    // clean-up pins, first...
    cleanPinnedApps();

    // ...then, set the pinned list and length
    _pinnedAppsList       = getPinnedAppsList(),
    _pinnedAppsListLength = _pinnedAppsList.length;

    // first, expand array to total number of pinned apps
    for (var pi = 0, pil = _pinnedAppsListLength; pi < pil; pi++) {
        _pinnedAppsToInsert.push(0);
    }

    // iterate through entire app list...
    // #TODO: use binary search to make this faster for larger lists...
    for (var ai = 0, al = state.apps.length; ai < al; ai++) {
        // see if we can find a match
        _foundIndex = _pinnedAppsList.indexOf(state.apps[ai].guid);

        // add property, which is not on the original object...
        state.apps[ai].pinned = false;
        
        // if we did...
        if (_foundIndex !== -1) {
            // ...lets insert the app in our insert arr, at the right position
            _pinnedAppsToInsert[_foundIndex] = state.apps[ai];
            _pinnedAppsToInsert[_foundIndex].pinned = true; // change property

            // ...then remove the matched app from the existing apps array and update length
            // and reset iterator...
            state.apps.splice(ai, 1);

            al = state.apps.length,
            ai = -1; // start back at zero
        }
    }

    // re-order alpha...
    // #TODO: this is repeated in api consumer...
    state.apps.sort(function(a, b) {
        // case should not be a factor when sorting...
         var aName = a.name.toLowerCase(),
             bName = b.name.toLowerCase();

        // sort apps alphabetically...
        return (aName < bName) ? -1 : (aName > bName) ? 1 : 0;
    });

    // iterate backwards and unshift
    for (var pii = _pinnedAppsToInsert.length - 1; pii > -1; pii--) {
        state.apps.unshift(_pinnedAppsToInsert[pii]);
    }

    setAppList();
}

function deleteAppRows() {
    state.selectedAppRow = null;

    for (var ari = 0, arl = state.appRows.length; ari < arl; ari++) {
        state.appRows[ari].controllers.destroy();
        state.appRows[ari] = null;
    }

    state.appRows.length = 0;
    state.appRows = [];
}

function setAppList() {
    var _appListViewArr = [];

    // delete any app rows before creating app rows...
    deleteAppRows();

    if (Alloy.Globals.insights.state.loggedIn) {
        if (state.apps.length > 0) {
            enableAppList();

            for (var a = 0, al = state.apps.length; a < al; a ++) {
                state.appRows.push(createAppRow({
                    onClick: changeApp,
                    guid: state.apps[a].guid,
                    nativeIcon: getPlatformIcon(state.apps[a].icon),
                    index: a,
                    last: a === al - 1,
                }));

                _appListViewArr.push(state.appRows[a].parent);

                // if it's a long list, scroll to the unpinned index...
                if (state.unpinnedApp && state.apps[a].guid === state.unpinnedApp) {
                    state.unpinnedApp = null;
                    state.unpinnedAppRowIndex = a;
                }
            }

            // #TODO: this animation isn't always necessary
            $.appListContainer.animate({ opacity:0.0, left:50, duration:250 }, function() {
                $.appListContainer.data = _appListViewArr;

                if (state.filtered) {
                    filterAppList();
                }

                $.appListContainer.animate({ left:-4, opacity:1.0, duration:150, curve:Ti.UI.ANIMATION_CURVE_EASE_IN }, function() {
                    $.appListContainer.animate({ left:0, duration:100 }, function() {
                        if (state.unpinnedAppRowIndex) {
                            $.appListContainer.scrollToIndex(state.unpinnedAppRowIndex);
                            state.unpinnedAppRowIndex = null;
                        }
                    });
                });
            });
        } else {
            enableEmptyAppList();
        }
    } else {
        disableAppList();
    }
}

function focusLoginBtn() {
    $.loginLbl.animate({ opacity:0.0, duration:100 }, function() {
        $.loginLbl.animate({ opacity:1.0, duration:100 });
    });

    $.loginLblTouch.animate({ opacity:1.0, duration:100 }, function() {
        $.loginLblTouch.animate({ opacity:0.0, duration:100 });
    });
}

function blurLoginBtn() {
    $.loginLbl.animate({ opacity:1.0, duration:100 });
    $.loginLblTouch.animate({ opacity:0.0, duration:100 });
}

function enableEmptyAppList() {
    $.loginContainer.opacity = 0.0;
    $.loginContainer.visible = false; // #WORKAROUND
    $.appListEmptyContainer.opacity = 1.0;
    $.appListEmptyContainer.visible = true; // #WORKAROUND
}

function enableAppList() {
    $.appListContainer.opacity = 1.0;
    $.appListContainer.visible = true; // #WORKAROUND
    $.loginContainer.opacity = 0.0;
    $.loginContainer.visible = false; // #WORKAROUND
    $.appListEmptyContainer.opacity = 0.0;
    $.appListEmptyContainer.visible = false; // #WORKAROUND
}

function disableAppList() {
    $.appListContainer.opacity = 0.0;
    $.appListContainer.visible = false; // #WORKAROUND
    $.loginContainer.opacity = 1.0;
    $.loginContainer.visible = true; // #WORKAROUND
    $.appListEmptyContainer.opacity = 0.0;
    $.appListEmptyContainer.visible = false; // #WORKAROUND
}

function filterFieldChanged(e, preventFilter) {
    if ($.filterField.value.length > 0) {
        state.filtered = true;

        $.filterLbl.opacity = 0.0;
        $.filterCountLbl.opacity = 1.0;
        $.filterCountBgFocus.opacity = 1.0;
        $.filterCountBgBlur.opacity = 0.0;
    } else {
        state.filtered = false;

        $.filterLbl.animate({ opacity:1.0, duration:250 });
        $.filterCountLbl.animate({ opacity:0.0, duration:250 });
        $.filterCountBgFocus.animate({ opacity:0.0, duration:250 });
        $.filterCountBgBlur.animate({ opacity:1.0, duration:250 });
    }

    if (!preventFilter) {
        filterAppList();
    }
}

function focusDemoBtn(e) {
    $.demoBg.animate({ opacity:(state.currentAppIndex === -1) ? 1.0 : 0.0, duration:100 }, function() {
        $.demoBg.animate({ opacity:(state.currentAppIndex === -1) ? 0.0 : 1.0, duration:100 });
    });

    $.demoBgTouch.animate({ opacity:(state.currentAppIndex === -1) ? 0.0 : 1.0, duration:100 }, function() {
        $.demoBgTouch.animate({ opacity:(state.currentAppIndex === -1) ? 1.0 : 0.0, duration:100 });
    });
}

function blurDemoBtn(e) {
    $.demoBg.animate({ opacity:(state.currentAppIndex === -1) ? 0.0 : 1.0, duration:100 });
    $.demoBgTouch.animate({ opacity:(state.currentAppIndex === -1) ? 1.0 : 0.0, duration:100 });
}

function focusRefreshBtn() {
    $.refreshIcon.animate({ opacity:0.0, duration:100 }, function() {
        $.refreshIcon.animate({ opacity:1.0, duration:100 });
    });

    $.refreshIconTouch.animate({ opacity:1.0, duration:100 }, function() {
        $.refreshIconTouch.animate({ opacity:0.0, duration:100 });
    });
}

function refreshCurrentApp() {
    var _dialog = null;

    if (state.selectedAppGuid !== -1) {
        changeApp({}, function() {}, true, state.selectedAppGuid);
    } else {
        $.refreshContainer.animate({ left:40, duration:100, curve:Ti.UI.ANIMATION_CURVE_EASE_IN }, function() {
            $.refreshContainer.animate({ left:60, duration:50, curve:Ti.UI.ANIMATION_CURVE_LINEAR }, function() {
                $.refreshContainer.animate({ left:50, duration:50 }, function() {
                    if (menu.open) {
                        _dialog = Ti.UI.createAlertDialog({
                            title: 'Refresh Error',
                            message: (Alloy.Globals.insights.state.loggedIn) ? 'Demo application data is currently loaded and can not be refreshed.\n\nIf available, please select a production application before refreshing.' : 'Demo application data is currently loaded and can not be refreshed.\n\nPlease login and, if available, select a production application before refreshing.',
                            buttonNames: (Alloy.Globals.insights.state.loggedIn) ? ['Ok'] : ['Cancel', 'Login']
                        });

                        _dialog.addEventListener('click', function(e) {
                            // show login UI
                            if (e.index === 1) {
                                // #TODO: not providing a post-login method (re-open the left menu)...
                                // will see what customer feedback is (we don't do this now for the login message in the left menu)
                                // Alloy.Globals.insights.state.postLoginMethod = showInsightsFeedbackAlert;
                                
                                Alloy.Globals.insights.state.loginVisible = true;
                                hideMenu({}, state.callbacks.onShowLoginRequest, true);
                            } else {
                                // #TODO: see above note...
                                // Alloy.Globals.insights.state.postLoginMethod = null;
                            }
                        });

                        _dialog.show();
                    }
                });
            });
        });
    }
}

function blurRefreshBtn() {
    $.refreshIcon.animate({ opacity:1.0, duration:100 });
    $.refreshIconTouch.animate({ opacity:0.0, duration:100 });
}

function showAppNameLblDark() {
    $.currentAppNameLblDark.animate({ opacity:1.0, duration:250 });
    $.currentAppNameLblLight.animate({ opacity:0.0, duration:250 });
}

function showAppNameLblLight() {
    $.currentAppNameLblDark.animate({ opacity:0.0, duration:250 });
    $.currentAppNameLblLight.animate({ opacity:1.0, duration:250 });
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

function processEvents(types) {
    var _types = types || {};

    if (_types.showDark) {
        showMoreBtnLight();
        showAppNameLblDark();
    }

    if (_types.showLight) {
        showMoreBtnDark();
        showAppNameLblLight();
    }
}

function processAppListScroll() {
    $.filterField.blur();

    if (state.focusedRowIndex !== -1) {
        state.appRows[state.focusedRowIndex].controllers.blurRow();
    }
}

function updateLastUpdated(lastUpdatedTime, demoSelected) {
    var _lastUpdatedTime = lastUpdatedTime || null,
        _demoSelected    = demoSelected || false;

    // only update if we get a time and it's not that same...
    if (_lastUpdatedTime && $.lastUpdatedLbl.text !== _lastUpdatedTime && !_demoSelected) {
        $.lastUpdatedLbl.text = _lastUpdatedTime;
    } else if (_demoSelected && $.lastUpdatedLbl.text !== '--') {
        // APPTS-3862
        $.lastUpdatedLbl.text = '--';
    }
}

function resetFromLogin() {
    clearFilterField(null, true);
}

function resetFromLogout(callback) {
    state.selectedAppRow = null;
    state.selectedAppGuid = null;
    state.apps.length = 0;
    state.appRows.length = 0;
    state.apps = [];
    state.appRows = [];

    $.filterTotalCountLbl.text = '00';

    clearFilterField(null, true);
    updateAppList(null);
    
    if (Alloy.Globals.insights.state.singleAppMode) {
        changeApp(null, callback);
    } else {
        changeApp({ type:'demo' }, callback);
    }
}

function init(config) {
    var _config = config || {};

    state.callbacks.onCloseMenu = _config.callbacks.onCloseMenu;
    state.callbacks.onOpenMenu = _config.callbacks.onOpenMenu;
    state.callbacks.onUpdateRequest = _config.callbacks.onUpdateRequest;
    state.callbacks.onShowLoginRequest = _config.callbacks.onShowLoginRequest;
    
    $.parentContainer.transform = Ti.UI.create2DMatrix({ scale:1.2 });

    $.parentContainer.addEventListener('swipe', processSwipe);
    $.menu.addEventListener('touchstart', function(e) {
        if (state.filter.focused && (e.source.id === 'menu' || e.source.id === 'appListContainer')) {
            blurFilterField();
        }
    });

    $.overlayBtnContainer.addEventListener('touchstart', function(e) {
        // #TODO
        // if (Alloy.Globals.insights.state.menuTip.state.visible) {
        //     Alloy.Globals.insights.state.menuTip.controllers.hide(false, function() {                
        //         showMenu(e, function() {
        //             // #TODO: improve this; shouldn't be necessary to have a post method call to compensate for menu tip...
        //             blurMoreBtn();
        //         });
        //     });
        // } else {
            showMenu(e);
        // }
    });
    // $.overlayBtnContainer.addEventListener('touchstart', focusMoreBtn);
    // $.overlayBtnContainer.addEventListener('touchend', blurMoreBtn);

    $.currentAppInMenuContainer.addEventListener('click', hideMenu);
    $.currentAppInMenuContainer.addEventListener('touchstart', focusBackBtn);
    // $.currentAppInMenuContainer.addEventListener('touchend', blurBackBtn);

    $.touchRedirect.addEventListener('click', focusFilterField);
    $.filterBg.addEventListener('click', focusFilterField);
    $.clearFilterBtn.addEventListener('click', clearFilterField);
    $.filterField.addEventListener('change', filterFieldChanged);
    $.filterField.addEventListener('blur', blurFilterField);
    $.filterField.addEventListener('return', blurFilterField);

    $.demoContainer.addEventListener('click', function() {
        changeApp({ type:'demo' });
    });
    $.demoContainer.addEventListener('touchstart', focusDemoBtn);
    // $.demoContainer.addEventListener('touchend', blurDemoBtn);

    $.refreshContainer.addEventListener('click', refreshCurrentApp);
    $.refreshContainer.addEventListener('touchstart', focusRefreshBtn);
    // $.refreshContainer.addEventListener('touchend', blurRefreshBtn);

    $.appListContainer.addEventListener('scroll', processAppListScroll);

    $.appListContainer.addEventListener('click', changeApp);

    $.loginLblContainer.addEventListener('click', function() {
        Alloy.Globals.insights.state.loginVisible = true;
        hideMenu({}, state.callbacks.onShowLoginRequest, true);
    });
    $.loginLblContainer.addEventListener('touchstart', focusLoginBtn);
    // $.loginLblContainer.addEventListener('touchend', blurLoginBtn);

    // #DEBUG TODO - if you need to clear out the pinned apps...
    deletePinnedAppsList();

    // #PREBUILD
    changeApp({ type:'demo' });
}

exports._isOpen                 = isOpen,
exports._reposition             = reposition,
exports._getParentView          = getParentView,
exports._getOverlayBtnContainer = getOverlayBtnContainer,
exports._notifyMenuIsHidden     = notifyMenuIsHidden,
exports._hideMenu               = hideMenu,
exports._showMenu               = showMenu,
exports._updateCurrentApp       = updateCurrentApp,
exports._resetFromLogin         = resetFromLogin,
exports._resetFromLogout        = resetFromLogout,
exports._updateAppList          = updateAppList,
exports._updateLastUpdated      = updateLastUpdated,
exports._processEvents          = processEvents,
exports._changeApp              = changeApp,
exports._init                   = init;