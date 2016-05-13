// scaler.js is primarly used for android and should be more accomodating to other sizes
// global utils 'PXToDP' may be moved to this location
// it would useful to allow entire objects and/or proxies to be processed, rather than property by property
// it would be ideal to have these utilities as part of Ti or allow for a flag that will do all of this automatically

// defines supported device sizes
var devices = {
    // base represents an iPad
    base: {
        w: 1024,
        h: 768
    },
    // note 10.1 2014 edition
    note10: {
        w: 1280,
        h: 800
    },
    // nexus 7 2013 edition
    nexus7: {
        w: 960,
        h: 552
    }
};

var nexusWidth = 960;

// cache current device
var currentDevice = (Alloy.Globals.insights.state.android.xLarge) ? devices.note10 : devices.nexus7;

// 1 is horizontal, -1 is vertical
var propsDef = {
    width: 1,
    left: 1,
    right: 1,
    height: -1,
    top: -1,
    bottom: -1,
    font: {
        fontSize: -1
    },
    center: {
        x: 1,
        y: -1
    }
}

// scale single value along horiz or vert axis
function scaleVal(baseVal, scaleAlongHorizontal) {
    var _baseVal         = baseVal || 0,
        _scaleAlongHoriz = scaleAlongHorizontal || false;

    return (_scaleAlongHoriz) ? Math.round((currentDevice.w * _baseVal) / devices.base.w) : Math.round((currentDevice.h * _baseVal) / devices.base.h);
}

// proxy can be an object literal for scaling styles...
// this will automatically determine scale axis
// propsToGetSameVal is an array that has props as strings
function scaleProps(proxy, scaleFromProps, propsToGetSameVal) {
    var _proxy               = proxy || null,
        _scaleFromProps      = scaleFromProps || {}, // obj: props for proxy that require scaling
        _propsToGetSameVal   = propsToGetSameVal || null,
        _applyToAllProps     = _propsToGetSameVal !== null,
        _cachedValForAllProps = null, // we will scale one val and apply to all other props, if needed
        _scaleAlongHoriz     = false, // bool: flag for indicating scale axis
        _isFont              = false;

    // we check this flag to see if we need to scale all props to the same value...
    if (!_applyToAllProps) {
        // run through all passed props
        for (var _p in _scaleFromProps) {
            // check if the base object exists against our defined props...
            if (propsDef[_p]) {
                // check if the current prop val is an object...
                if (typeof(_scaleFromProps[_p]) === 'object') {
                    // if the current prop val is an object, iterate through sub props...
                    _isFont = _p === "font"; // if it's a font we are scaling, we need to apply the full font object

                    for (var _sp in _scaleFromProps[_p]) {
                        if (propsDef[_p][_sp] === 1) {
                            _proxy[_p][_sp] = scaleVal(_scaleFromProps[_p][_sp], true); // horiz
                        } else if (propsDef[_p][_sp] === -1) {
                            // we are only checking it here as font is limited to scaling vertically
                            if (_isFont) {
                                _proxy.font = {
                                    fontFamily: _proxy.font.fontFamily || null,
                                    fontSize: scaleVal(_scaleFromProps[_p][_sp], false) // vert
                                };
                            } else {
                                _proxy[_p][_sp] = scaleVal(_scaleFromProps[_p][_sp], false); // vert
                            }
                        }
                    }
                // if the current prop val is not an object, immediatly scale
                } else {
                    if (propsDef[_p] === 1) {
                        _proxy[_p] = scaleVal(_scaleFromProps[_p], true); // horiz
                    } else if (propsDef[_p] === -1) {
                        _proxy[_p] = scaleVal(_scaleFromProps[_p], false); // vert
                    }
                }
            }
        }
    // if the flag is false, we will scale primary value and apply it to all other props
    // this does not support sub props at this time (e.g. center, font, etc.)
    // center.x and center.y should have values scaled independantly until this is addressed...
    } else {
        // it is assumed that this loop will only need to iterate once
        // if not used properly, the cached value will be whatever the first selected prop value is...
        for (var _p in _scaleFromProps) {
            if (propsDef[_p] === 1) {
                _cachedValForAllProps = scaleVal(_scaleFromProps[_p], true); // horiz
            } else if (propsDef[_p] === -1) {
                _cachedValForAllProps = scaleVal(_scaleFromProps[_p], false); // vert
            }

            _proxy[_p] = _cachedValForAllProps; // set the scale value for the prop...

            break; // we only want this to iterate once...
        }

        // iterate through other props and set using cached value
        for (var _pi = 0, _pil = _propsToGetSameVal.length; _pi < _pil; _pi ++) {
            _proxy[_propsToGetSameVal[_pi]] = _cachedValForAllProps;
        }
    }
}

module.exports = function(config) {
    var _config = config || {};

    return {
        scaleVal: scaleVal,
        sv: scaleVal,
        scaleProps: scaleProps,
        sp: scaleProps
    };
};