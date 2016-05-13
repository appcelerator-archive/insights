// #NOTES (02.05.2014): Depending on how this will work long term, controller may need significant refactoring.
// For now, implemented LCD for APPTS-3912

// It should be possible to close a tip by tapping it or by completing tip instruction...
var tips = {};

var state = {};

function createMenuTip(parent, position) {
    var _tip      = {},
        _parent   = parent || null,
        _position = position || { x:0, y:0 };

    _tip.state = {
        cycled: false,
        visible: false
    };

    _tip.controllers = {
        destroy: function() {
            if (_tip) { _parent.remove(_tip.parent); }

            Alloy.Globals.insights.state.menuTip = null;

            _parent     = null,
            _tip.parent = null,
            _tip        = null;
        },
        hide: function(destroy, callback) {
            if (_tip) {
                if (_tip.state.visible) {
                    _tip.state.visible = false;

                    _tip.parent.animate({ opacity:0.0, duration:250 }, function() {
                        if (callback) { callback(); }
                        if (destroy) { _tip.controllers.destroy(); }
                    });
                }
            }
        },
        show: function(callback) {
            if (_tip) {
                if (!_tip.state.visible) {
                    _tip.state.visible = true;

                    _tip.parent.animate({ top:_position.y - 3, opacity:1.0, duration:1000 }, function() {
                        if (_tip) {
                            _tip.controllers.hover();
                        }
                    });
                }
            }
        },
        hover: function() {
            if (_tip) {
                if (_tip.state.visible) {
                    _tip.parent.animate({ top:_position.y + ((_tip.state.cycled) ? -3 : 3), duration:1000 }, function() {
                        if (_tip) {
                            _tip.state.cycled = !_tip.state.cycled;
                            _tip.controllers.hover();
                        }
                    });
                }
            }
        }
    };

    _tip.parent = Ti.UI.createView({ width:285, height:50, backgroundImage:'tips/app-list.png', left:_position.x, top:_position.y + 3, opacity:0.0 });

    Alloy.Globals.insights.state.menuTip = _tip; // so that we can control this elsewhere

    _tip.parent.addEventListener('touchstart', function() {
        _tip.controllers.hide(false, null);
    });

    _parent.add(_tip.parent);
}

function showMenuTip(parent, position) {}

function removeMenuTip() {
    if (Alloy.Globals.insights.state.menuTip) {
        Alloy.Globals.insights.state.menuTip.controllers.hide(true, null);
    }
}

function init(config) {}

exports._init          = init,
exports._createMenuTip = createMenuTip,
exports._showMenuTip   = showMenuTip,
exports._removeMenuTip = removeMenuTip;