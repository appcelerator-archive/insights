// THE MOST CONVOLUTED (BUT AWESOME) LOGIN MECHANISM OF ALL TIME
var rule = {
    isValidUsername: function(username) {
        var re = /\S+@\S+\.\S+/; // testing for valid email address - won't catch much, but good enough

        return re.test(username);
    },
    isValidPassword: function(password) {
        return password.length >= 4
    }
};

var lib = {
    auth: require('platform/auth')(),
    events: require('client/events')()
};

var state = {
    customDomain: null,
    login: {
        visible: false
    },
    currentKeyboardFrameHeight: 0, // this is used for bouncing the login context offset correctly when keyboard is visible
    username: {
        focused: false,
        valid: false
    },
    password: {
        focused: false,
        valid: false
    },

    domain: {
        focused: false,
        valid: false,
        visible: false
    },
    callbacks: {
        onLoginStart: null,
        onLoginComplete: null,
        onLogoutStart: null,
        onLogoutComplete: null,
        onLoginCancel: null, // #DEMO
        onCustomDomain: null
    },
    context: {
        login: true,
        learnMore: false,
    },
    browser: null
};

// going to kill this when login is closed
// TODO: Actually, we'll see how this does remaining in memory... not rendering many images, app wide
var context = {
    learnMore: null
};

function determineAndSetFocus() {
    if (!state.username.focused && ($.usernameField.value.length === 0 || !state.username.valid)) {
        focusUsernameField();
    } else if (!state.password.focused && state.username.valid && !state.password.valid) {
        focusPasswordField();
    }
}

// when user taps on the 'wash' (which is really #touch), wiggle component and focus username field
// also wiggle and clear password on login failure
function wiggleLoginContext(e) {
    var _acceptableObj = e.source === $.loginContentWrapper || e.source === $.learnMoreContentContainer || e.source === $.fieldContainer || e.source === $.loginContentContainer || e.source === $.loginWrapper || e.source === $.touch || e.type === 'manual';

    if ((!state.username.valid || !state.password.valid) && (_acceptableObj)) {
        $.parentContainer.animate({ left:-20, duration:100, curve:Ti.UI.ANIMATION_CURVE_EASE_IN }, function() {
            $.parentContainer.animate({ left:0, duration:50, curve:Ti.UI.ANIMATION_CURVE_LINEAR }, function() {
                $.parentContainer.animate({ left:-10, duration:50 }, function() {
                    if (state.context.learnMore) {
                        determineAndSetContext({ direction:null });    
                    } else {
                        determineAndSetFocus();
                    }                
                });
            });
        });
    } else if (_acceptableObj) {
        if (state.context.learnMore) {
            determineAndSetContext({ direction:null });
        } else if (state.username.valid && state.password.valid) {
            $.loginBtn.animate({ transform:Ti.UI.create2DMatrix({ scale:0.8 }), opacity:0.0, duration:100 }, function() {
                $.loginBtn.animate({ transform:Ti.UI.create2DMatrix({ scale:1.0}), opacity:1.0, duration:250 });
            });
        }
    }
}

// #TODO: as learn more has been removed, this should be changed to a more appropriate name...
function determineAndSetContext(e) {
    var _direction = e.direction || null;

    if (_direction === 'down') {
        if (state.username.focused) {
            unfocusUsernameField({ type:'blur' });
        }

        if (state.password.focused) {
            unfocusPasswordField({ type:'blur' });
        }

        if (state.domain.focused) {
            unfocusDomainField({ type:'blur' });
        }
    }
}

function bounceLoginContextVertical() {
    if (!Ti.App.keyboardVisible) {
        $.loginContentWrapper.animate({ center:{x:Alloy.Globals.insights.utils.PXToDP(Ti.Platform.displayCaps.platformWidth) / 2, y:320}, duration:150, curve:Ti.UI.ANIMATION_CURVE_EASE_IN }, function() {
            $.loginContentWrapper.animate({ center:{x:Alloy.Globals.insights.utils.PXToDP(Ti.Platform.displayCaps.platformWidth) / 2, y:330}, duration:100 });
        });

    } else {
        $.loginContentWrapper.animate({
            center: {
                x: Alloy.Globals.insights.utils.PXToDP(Ti.Platform.displayCaps.platformWidth) / 2,
                y: ((Alloy.Globals.insights.utils.PXToDP(Ti.Platform.displayCaps.platformHeight) - state.currentKeyboardFrameHeight) / 2) - 10
            },
            duration: 150
        }, function() {
            $.loginContentWrapper.animate({
                center: {
                    x: Alloy.Globals.insights.utils.PXToDP(Ti.Platform.displayCaps.platformWidth) / 2,
                    y: (Alloy.Globals.insights.utils.PXToDP(Ti.Platform.displayCaps.platformHeight) - state.currentKeyboardFrameHeight) / 2
                },
                duration: 100
            });
        });
    }
}

function getParentView() {
    return $.parentContainer;
}

function disableLoginBtn() {
    $.loginBtnTouch.opacity = 0.0;

    $.loginBtnDisabled.animate({ opacity:1.0, duration:100 });
    $.loginBtn.animate({ opacity:0.0, duration:100 }, function() {
        $.loginBtn.visible = false; // #WORKAROUND
    });
}

function enableLoginBtn() {
    $.loginBtnTouch.opacity = 0.0;

    $.loginBtnDisabled.animate({ opacity:0.0, duration:100 });
    $.loginBtn.visible = true; // #WORKAROUND
    $.loginBtn.animate({ opacity:1.0, duration:100 });
}

function validateFields() {
    var _isValidUsername = rule.isValidUsername($.usernameField.value),
        _isValidPassword = rule.isValidPassword($.passwordField.value);
    
    if (_isValidUsername) {
        state.username.valid = true;

        $.usernameValidInd.opacity = 1.0;
        $.usernameValidInd.visible = true; // #WORKAROUND
    } else {
        state.username.valid = false;

        $.usernameValidInd.opacity = 0.0;
        $.usernameValidInd.visible = false; // #WORKAROUND
        
        $.loginBtn.opacity = 0.0;
        $.loginBtn.visible = false; // #WORKAROUND
    }

    if (_isValidPassword) {
        state.password.valid = true;
        
        if (_isValidUsername) {
            $.loginBtn.opacity = 1.0;
            $.loginBtn.visible = true; // #WORKAROUND
        }
    } else {
        state.password.valid = false;

        $.loginBtn.opacity = 0.0;
        $.loginBtn.visible = false; // #WORKAROUND
    }

    // FIX: this doesn't work...
    // $.usernameField.returnKeyType = (_isValidUsername && _isValidPassword) ? Ti.UI.RETURNKEY_GO : Ti.UI.RETURNKEY_NEXT;
    // $.passwordField.returnKeyType = (_isValidUsername && _isValidPassword) ? Ti.UI.RETURNKEY_GO : Ti.UI.RETURNKEY_NEXT;
}

function usernameFieldChanged(e) {
    if ($.usernameField.value.length > 0) {
        $.usernameLbl.opacity = 0.0;
    } else {
        $.usernameLbl.animate({ opacity:1.0, duration:250 });
    }

    validateFields();
}

function passwordFieldChanged(e) {
    if ($.passwordField.value.length > 0) {
        $.passwordLbl.opacity = 0.0;
    } else {
        $.passwordLbl.animate({ opacity:1.0, duration:250 });
    }

    validateFields();
}

function domainFieldChanged(e) {
    if ($.domainField.value.length > 0) {
        $.domainFieldLbl.opacity = 0.0;
    } else {
        $.domainFieldLbl.animate({ opacity:1.0, duration:250 });
    }

    // validateFields();
}

function unfocusUsernameField(e) {
    var _obj  = e || {},
        _type = _obj.type || null;

    state.username.focused = false;

    if (_type !== 'blur') {
        $.usernameField.softKeyboardOnFocus = Ti.UI.Android.SOFT_KEYBOARD_HIDE_ON_FOCUS;
        $.usernameField.blur();
    }

    $.usernameField.editable = false;
    $.usernameField.touchEnabled = false;

    $.clearUsernameBtn.animate({ opacity:0.0, duration:250 }, function() {
        $.clearUsernameBtn.visible = false; // #WORKAROUND
    });
    $.usernameBg.animate({ backgroundColor:'#969696', duration:250 });

    // #BUG: labels prevent interaction for some reason...
    if ($.usernameField.value.length > 0) {
        $.usernameField.color = '#333';
        $.usernameField.animate({ left:28, duration:250 });
        $.usernameLbl.animate({ left:40, duration:250 });
    } else {
        $.usernameLbl.animate({ left:40, opacity:1.0, duration:250 });
    }
}

function unfocusPasswordField(e) {
    var _obj  = e || {},
        _type = _obj.type || null;

    state.password.focused = false;

    if (_type !== 'blur') {
        $.passwordField.softKeyboardOnFocus = Ti.UI.Android.SOFT_KEYBOARD_HIDE_ON_FOCUS;
        $.passwordField.blur();
    }

    $.passwordField.editable = false;
    $.passwordField.touchEnabled = false;

    $.clearPasswordBtn.animate({ opacity:0.0, duration:250 }, function() {
        $.clearPasswordBtn.visible = false;
    });
    $.passwordBg.animate({ backgroundColor:'#969696', duration:250 });

    if ($.passwordField.value.length > 0) {
        $.passwordField.color = '#333';
        $.passwordField.animate({ left:28, duration:250 });
        $.passwordLbl.animate({ left:40, duration:250 });
    } else {
        $.passwordLbl.animate({ left:40, opacity:1.0, duration:250 });
    }
}

function unfocusDomainField(e) {
    var _obj     = e || {},
        _type    = _obj.type || null,
        _wasHttp = false; // this flag is used to show a post-sanitize alert...

    state.domain.focused = false;

    if (_type !== 'blur') {
        $.passwordField.softKeyboardOnFocus = Ti.UI.Android.SOFT_KEYBOARD_HIDE_ON_FOCUS;
        $.domainField.blur();
    }

    $.domainField.editable = false;
    $.domainField.touchEnabled = false;

    $.clearDomainBtn.animate({ opacity:0.0, duration:250 }, function() {
        $.clearDomainBtn.visible = false;
    });
    $.domainBg.animate({ backgroundColor:'#969696', duration:250 });

    if ($.domainField.value.length > 0) {
        if ($.domainField.value.indexOf('http://') === 0) { _wasHttp = true; } // keep track, post-sanitize...

        // sanitize the url
        $.domainField.value = $.domainField.value.replace(/https:\/\//g, '');
        $.domainField.value = $.domainField.value.replace(/http:\/\//g, '');
        $.domainField.value = $.domainField.value.replace(/\//g, '');

        if ($.domainField.value.length > 0) {
            if (_wasHttp) {
                Ti.UI.createAlertDialog({ title:'Domain Error', message:'Only secure connections to domains are permitted.\n\nThe entered domain has been adjusted to use HTTPS intead of HTTP.', buttonNames:['Ok'] }).
                    show();
            }

            state.callbacks.onCustomDomain($.domainField.value); // set #VPC domain

            $.domainField.color = '#333';
            $.domainField.animate({ left:28, duration:250 });
            $.domainFieldLbl.animate({ left:40, duration:250 });
        } else {
            $.domainFieldLbl.animate({ left:40, opacity:1.0, duration:250 }, hideDomainField);
        }
    } else {
        $.domainFieldLbl.animate({ left:40, opacity:1.0, duration:250 }, hideDomainField);
    }
}

function focusUsernameField(e) {
    state.username.focused = true;

    Ti.API.info('USERNAME FOCUSED');

    $.usernameField.color = '#f2f2f2';
    $.usernameBg.animate({ backgroundColor:'#333', duration:250 });
    $.clearUsernameBtn.visible = true; // #WORKAROUND
    $.clearUsernameBtn.animate({ opacity:1.0, duration:250 });
    $.usernameField.animate({ left:58, duration:250 });
    $.usernameLbl.animate({ left:70, duration:250 }, function() {
        $.usernameField.editable = true;
        $.usernameField.touchEnabled = true;
        $.usernameField.softKeyboardOnFocus = Ti.UI.Android.SOFT_KEYBOARD_SHOW_ON_FOCUS;
        $.usernameField.focus();
    });
}

function focusPasswordField(e) {
    state.password.focused = true;

    Ti.API.info('PASSWORD FOCUSED');

    $.passwordField.color = '#f2f2f2'; 
    $.passwordBg.animate({ backgroundColor:'#333', duration:250 });
    $.clearPasswordBtn.visible = true; // #WORKAROUND
    $.clearPasswordBtn.animate({ opacity:1.0, duration:250 });
    $.passwordField.animate({ left:58, duration:250 });
    $.passwordLbl.animate({ left:70, duration:250 }, function() {
        $.passwordField.editable = true;
        $.passwordField.touchEnabled = true;
        $.passwordField.softKeyboardOnFocus = Ti.UI.Android.SOFT_KEYBOARD_SHOW_ON_FOCUS;
        $.passwordField.focus();
    });
}

function focusDomainField(e) {
    state.domain.focused = true;

    Ti.API.info('DOMAIN FOCUSED');

    $.domainField.color = '#f2f2f2', 
    $.domainBg.animate({ backgroundColor:'#333', duration:250 });
    $.clearDomainBtn.visible = true;
    $.clearDomainBtn.animate({ opacity:1.0, duration:250 });
    $.domainField.animate({ left:58, duration:250 });
    $.domainFieldLbl.animate({ left:70, duration:250 }, function() {
        $.domainField.editable = true;
        $.domainField.touchEnabled = true;
        $.domainField.softKeyboardOnFocus = Ti.UI.Android.SOFT_KEYBOARD_SHOW_ON_FOCUS;
        $.domainField.focus();
    });
}

// we also clear out the password
function clearUsernameField(e) {
    if ($.usernameField.value.length > 0) {
        $.usernameField.value = '';

        // weird that i have to call these manually
        usernameFieldChanged();

        // TODO: now that i'm using it this way, should refactor to have two separate methods
        unfocusPasswordField(e);
    } else {
        unfocusUsernameField(e);
    }

    if ($.passwordField.value.length > 0) {
        $.passwordField.value = '';

        // weird that i have to call this manually
        passwordFieldChanged();
    }
}

function clearPasswordField(e) {
    if ($.passwordField.value.length > 0) {
        $.passwordField.value = '';

        // weird that i have to call this manually
        passwordFieldChanged();
    } else {
        unfocusPasswordField(e);
    }
}

function clearDomainField(e) {
    var _evt    = e || {},
        _source = _evt.source || {};

    if ($.domainField.value.length > 0) {
        confirmDomainClear(function(cleared) {
            if (cleared) {
                // the user may just wish to clear what they have entered, but don't remove focus...
                if (_source.id !== 'clearDomainBtn') {
                    if (state.domain.focused) {
                        unfocusDomainField();
                    } else {
                        hideDomainField();
                    }
                }

                $.domainField.value = '';

                // weird that i have to call this manually
                domainFieldChanged();

                if (_source.id !== 'clearDomainBtn') {
                    Ti.UI.createAlertDialog({ title:'Domain Reset', message:'The default domain has been restored.', buttonNames:['Ok'] })
                        .show();
                }
            }
        });
    } else {
        unfocusDomainField(e);
    }
}

function reposition(e) {
    if (Ti.App.keyboardVisible) {
        state.currentKeyboardFrameHeight = e.keyboardFrame.height;

        $.loginContentWrapper.animate({
            center: {
                x: Alloy.Globals.insights.utils.PXToDP(Ti.Platform.displayCaps.platformWidth) / 2,
                y: (Alloy.Globals.insights.utils.PXToDP(Ti.Platform.displayCaps.platformHeight) - e.keyboardFrame.height) / 2 
            },
            duration: 250
        });
    } else {
        $.loginContentWrapper.animate({
            center: {
                x: Alloy.Globals.insights.utils.PXToDP(Ti.Platform.displayCaps.platformWidth) / 2,
                y: 330
            },
            duration: 250
        });
    }
}

function focusDomainLbl(e) {
    $.domainLbl.animate({ opacity:0.0, duration:100 }, function() {
        $.domainLbl.animate({ opacity:1.0, duration:100 });
    });

    $.domainLblTouch.animate({ opacity:1.0, duration:100 }, function() {
        $.domainLblTouch.animate({ opacity:0.0, duration:100 });
    });
}

function blurDomainLbl(e) {
    $.domainLbl.animate({ opacity:1.0, duration:100 });
    $.domainLblTouch.animate({ opacity:0.0, duration:100 });
}

function focusCancelLbl(e) {
    $.cancelLbl.animate({ opacity:0.0, duration:100 }, function() {
        $.cancelLbl.animate({ opacity:1.0, duration:100 });
    });

    $.cancelLblTouch.animate({ opacity:1.0, duration:100 }, function() {
        $.cancelLblTouch.animate({ opacity:0.0, duration:100 });        
    });
}

function blurCancelLbl(e) {
    $.cancelLbl.animate({ opacity:1.0, duration:100 });
    $.cancelLblTouch.animate({ opacity:0.0, duration:100 });
}

function processUsernameField(e) {
    if (state.username.valid && state.password.valid) {
        processLogin(e);
    } else if (state.username.valid) {
        determineAndSetFocus();
    } else if (!state.username.valid || !state.password.valid) {
        wiggleLoginContext({ type:'manual' });
    }
}

function processPasswordField(e) {
    if (state.username.valid && state.password.valid) {
        processLogin(e);
    } else if (!state.username.valid || !state.password.valid) {
        wiggleLoginContext({ type:'manual' });
    }
}

function processDomainField(e) {
    if (state.username.valid && state.password.valid) {
        processLogin(e);
    } else if (state.username.valid) {
        determineAndSetFocus();
    } else if (!state.username.valid || !state.password.valid) {
        wiggleLoginContext({ type:'manual' });
    }
}

function blurAll() {
    $.usernameField.blur();
    $.passwordField.blur();
    $.domainField.blur();
}

function focusLoginBtn() {
    $.loginBtn.animate({ transform:Ti.UI.create2DMatrix({ scale:0.8 }), duration:100 }, function() {
        $.loginBtn.animate({ transform:Ti.UI.create2DMatrix({ scale:1.0 }), duration:100 });
    });
}

function blurLoginBtn() {
    $.loginBtn.animate({ transform:Ti.UI.create2DMatrix({ scale:1.0 }), duration:100 });
}

function processLogout(callback) {
    state.callbacks.onLogoutStart(function() {
        lib.auth.logout(function(error) {
            if (error) {
                // #TODO #ERROR don't do anything yet
            }

            state.callbacks.onLogoutComplete(error, null, callback); // would also be msg
        });
    });
}

function processLogin(e) {
    if (state.username.valid && state.password.valid) {
        blurAll();

        // hide ui, then start login process...
        // also, prevent reset, as login might fail...
        hide(true, function() {
            // show ui first, and then attempt login...
            state.callbacks.onLoginStart(function() {
                lib.auth.login({
                    username: $.usernameField.value,
                    password: $.passwordField.value,
                    from: 'insights',
                    callback: function(error, msg, code) {
                        state.callbacks.onLoginComplete(error, msg, code, $.usernameField.value);
                    }
                });
            });
        });
    } else {
        wiggleLoginContext({ type:'manual' });
    }
}

function openLearnMorePage() {
    if (state.browser) {
        blurAll();

        // #REJECT: APPLE
        // lib.events.fireEvent(lib.events.EVT.HOME.INFO);
        // state.browser._show('The Appcelerator Platform', 'http://www.appcelerator.com/platform/appcelerator-platform/');
    }
}

function confirmDomainClear(callback) {
    var _dialog = Ti.UI.createAlertDialog({ title:'Reset Custom Domain', message:'Are you sure you want to clear your custom domain?\n\nIf you are encountering problems, please contact your administrator.', buttonNames:['Cancel', 'Ok'] });

    _dialog.addEventListener('click', function(e) {
        if (e.index === 1) {
            if (callback) { callback(true); }
        }
    });

    _dialog.show();
}

function hideDomainField() {
    // #BUG: this is being called 3 times and animation never completes...
    if (state.domain.visible) {
        state.callbacks.onCustomDomain(null); // set #VPC domain

        state.domain.visible = false;
        $.moreContainer.opacity = 0.0;

        $.domainLbl.text      = 'Change Domain',
        $.domainLblTouch.text = 'Change Domain';

        $.loginContentWrapper.height = 310;
        $.domainBg.opacity = 0.0;
        $.moreContainer.opacity = 1.0;
    }
}

function showDomainField(preventFocusAndAnimation) {
    if (!state.domain.visible) {
        state.domain.visible = true;
        
        if (!preventFocusAndAnimation) {
            $.moreContainer.animate({ opacity:0.0, duration:0 });
        }

        $.domainLbl.text      = 'Reset Domain',
        $.domainLblTouch.text = 'Reset Domain';

        $.loginContentWrapper.animate({ height:380, duration:(preventFocusAndAnimation) ? 0 : 250 });
        $.domainBg.animate({ opacity:1.0, duration:(preventFocusAndAnimation) ? 0 : 250 }, function() {
            if (!preventFocusAndAnimation) { 
                focusDomainField();
                $.moreContainer.animate({ opacity:1.0, duration:(preventFocusAndAnimation) ? 0 : 100 });
            }
        });
    }
}

function toggleDomain() {
    if (!state.domain.visible) {
        showDomainField();
    } else {
        if ($.domainField.value.length > 0) {
            clearDomainField();
        } else {
            if (state.domain.focused) {
                unfocusDomainField();
            } else {
                hideDomainField();
            }
        }
    }
}

function openContactPage() {
    if (state.browser) {
        lib.events.fireEvent(lib.events.EVT.HOME.SURVEY);
        state.browser._show('Appcelerator Insights Survey', 'https://www.surveymonkey.com/s/QX7XLW5');
    }
}

function prefillUsername(username) {
    // fix UI
    $.usernameLbl.opacity = 0.0;
    $.usernameField.color = '#333';
    $.usernameField.left = 40;
    $.usernameLbl.left = 40;

    $.usernameField.value = username;

    validateFields();
}

function prefillDomain(customDomain) {
    var _customDomain = customDomain || '';

    // fix UI
    $.domainFieldLbl.opacity = 0.0;
    $.domainField.color = '#333';
    $.domainField.left = 40;
    $.domainFieldLbl.left = 40;

    _customDomain = _customDomain.replace('https://', '');

    $.domainField.value = _customDomain.replace('/', '');
}

// onShow is callback, username for resume, focusPassword
function show(onShow, username, focusPassword) {
    if (!state.login.visible) {
        if (username) {
            prefillUsername(username);
        }

        if (Alloy.Globals.insights.state.customDomain) {
            prefillDomain(Alloy.Globals.insights.state.customDomain);
            showDomainField(true);
        }

        Alloy.Globals.insights.state.loginVisible = true;
        state.login.visible = true;

        // #WORKAROUND
        $.parentContainer.visible = true;

        $.parentContainer.opacity = 1.0;
        $.loginWrapper.animate({ transform:Ti.UI.create2DMatrix({ scale:1.0 }), opacity:1.0, duration:250 }, function() {
            if (onShow) { onShow(); }
            if (focusPassword) { focusPasswordField(); }
        });
    }
}

function hide(preventReset, onHide) {
    if (state.login.visible) {
        Alloy.Globals.insights.state.loginVisible = false;
        state.login.visible = false;

        $.loginWrapper.animate({ transform:Ti.UI.create2DMatrix({ scale:1.2 }), opacity:0.0, duration:250 }, function() {
            // #WORKAROUND
            $.parentContainer.visible = false;
            
            $.parentContainer.opacity = 0.0;

            if (!preventReset) { reset(); }
            if (onHide) { onHide(); }
        });
    }
}

function reset() {
    clearUsernameField();
    clearPasswordField();
    blurAll();
}

function logout(callback) {
    processLogout(callback);
}

function isVisible() {
    return state.login.visible;
}

// TODO: field handling needs to be consolidated... too much duplicate code
function init(config) {
    var _config = config || {};

    // FLEXIBLE LAYOUT
    // $.loginContentContainer.height = Alloy.Globals.insights.utils.PXToDP(Ti.Platform.displayCaps.platformHeight);

    $.parentContainer.width = Alloy.Globals.insights.utils.PXToDP(Ti.Platform.displayCaps.platformWidth) + 20;
    $.parentContainer.left = -10;

    // #ATEMP disabled for position
    // $.loginContentWrapper.center = {
    //     x: Alloy.Globals.insights.utils.PXToDP(Ti.Platform.displayCaps.platformWidth) / 2,
    //     y: 330
    // };

    state.browser = config.browser || null;

    $.loginWrapper.transform = Ti.UI.create2DMatrix({ scale:1.2 });

    state.callbacks.onLoginStart     = _config.callbacks.onLoginStart,
    state.callbacks.onLoginComplete  = _config.callbacks.onLoginComplete,
    state.callbacks.onLogoutStart    = _config.callbacks.onLogoutStart,
    state.callbacks.onLogoutComplete = _config.callbacks.onLogoutComplete,
    state.callbacks.onLoginCancel    = _config.callbacks.onLoginCancel,
    state.callbacks.onCustomDomain   = _config.callbacks.onCustomDomain;

    $.touch.addEventListener('click', wiggleLoginContext);
    $.touch.addEventListener('swipe', determineAndSetContext);
    $.loginWrapper.addEventListener('click', wiggleLoginContext);
    $.loginWrapper.addEventListener('swipe', determineAndSetContext);

    $.usernameBg.addEventListener('click', focusUsernameField);
    $.usernameField.addEventListener('click', focusUsernameField);
    $.usernameField.addEventListener('change', usernameFieldChanged);
    $.usernameField.addEventListener('blur', unfocusUsernameField);
    $.clearUsernameBtn.addEventListener('click', clearUsernameField);
    $.usernameField.addEventListener('return', processUsernameField);

    $.passwordBg.addEventListener('click', focusPasswordField);
    $.passwordField.addEventListener('click', focusPasswordField);
    $.passwordField.addEventListener('return', processPasswordField);
    $.passwordField.addEventListener('change', passwordFieldChanged);
    $.passwordField.addEventListener('blur', unfocusPasswordField);
    $.clearPasswordBtn.addEventListener('click', clearPasswordField);

    $.domainField.addEventListener('return', processDomainField);
    $.domainBg.addEventListener('click', focusDomainField);
    $.domainField.addEventListener('click', focusDomainField);
    $.domainField.addEventListener('change', domainFieldChanged);
    $.domainField.addEventListener('blur', unfocusDomainField);
    $.clearDomainBtn.addEventListener('click', clearDomainField);
    $.domainContainer.addEventListener('click', toggleDomain);
    $.domainContainer.addEventListener('touchstart', focusDomainLbl);

    $.cancelContainer.addEventListener('click', state.callbacks.onLoginCancel);
    $.cancelContainer.addEventListener('touchstart', focusCancelLbl);
    // $.cancelContainer.addEventListener('touchend', blurCancelLbl);

    $.loginBtn.addEventListener('click', processLogin);
    $.loginBtn.addEventListener('touchstart', focusLoginBtn);
    // $.loginBtn.addEventListener('touchend', blurLoginBtn);
}

exports._getParentView   = getParentView,
exports._reposition      = reposition,
exports._isVisible       = isVisible,
exports._reset           = reset,
exports._logout          = logout,
exports._show            = show,
exports._hide            = hide,
exports._init            = init;