// TODO: change filename
var lib = {
    scaler: require('client/scaler')()
};

// finds the biggest drop in an array of numbers
// e.g. [10,8,6,3,2,1] would return [3]
// an array is returned as we may find multiples that
// fit within the criteria e.g. [500,400,300,250,200,100]
// would return array [1,2,5] (all 100 diff)
function getBiggestDropIndexes(array) {
    var _origArr       = array || [],
        _origArrLength = _origArr.length,
        _diffArr       = [];

    _diffArr = _origArr.map(function(element, index, arr) {
        if (index < _origArrLength - 1) {
            return element - (arr[index + 1] || 0);
        } else {
            return null;
        }
    }, []);

    return _diffArr.map(function(element, index) {
        return element == this && index + 1;
    }, Math.max.apply(0, _diffArr)).filter(Boolean);
}

// gets new array created from elements in an array of 
// absolute values to percentage-based drop rates (funnels)
function getDropRateArr(array) {
    var _origArr       = array,
        _origArrLength = _origArr.length,
        _convertedArr  = [];

    _convertedArr = _origArr.map(function(element, index, arr) {
        if (index < _origArrLength - 1) {
            // we won't deal with percentages...
            return Math.round((1 - (arr[index + 1] / element)) * 100);
        } else {
            return null; // this will be the last element that we throw away
        }
    }, []);

    _convertedArr.pop(); // get rid of the last element we don't need i.e. we can't find the drop rate for a non-existent next step

    return _convertedArr;
}

// this will return an array of indexes where the highest drop rate(s)
// exist within the passed array (funnels)
function getHighestDropRatesIndexes(array) {
    var _origArr = array.concat(); // clone, because we're going to potentially pop

    if (_origArr.length > 1 && typeof _origArr[_origArr.length - 1] === 'string') { // last element is expected to be a string
        _origArr.pop();
    }

    return _origArr.map(function(element, index, arr) {
        return element == this && index;
    }, Math.max.apply(0, _origArr)).filter(function(element) {
        return element !== false; // if we don't explicitly check for false, 0 index will be filtered out
    });
}


// DONUT START
function getDegToRad(deg, offset) {
    return (deg - (offset || 0)) * (Math.PI / 180);
}

// do zones contain point?
function getZoneFromPoint(zones, point) {
    for (var i = 0; i < zones.length; i++) {
        if (point.x >= zones[i][0] && point.y >= zones[i][1] && point.x <= (zones[i][0] + zones[i][2]) && point.y <= (zones[i][1] + zones[i][3])) {
            return i;
        } else {
            if (i === zones.length - 1) {
                return -1;
            }
        }
    }
}

function getC(d) {
    return Math.PI * d;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function getPointAlongC(center, r, rad) {
    return {
        x: center.x + (r * Math.cos(rad)),
        y: center.y + (r * Math.sin(rad))
    };
}

function getMidAngle(sA, eA) {
    return (sA + eA) / 2;
}

function removeNullsFromArr(arr) {
    var _arr = arr || [];
    
    for (var i = 0, il = _arr.length; i < il; i ++) {
        if (_arr[i] === null) {
            _arr.splice(i, 1);
            i --;
        }
    }
    
    return _arr;
}

//  returns a new array with original objects 
// and additional angles and points necessary 
// to correctly render donut graph
function getAnglesAndPoints(arr, center, r) {
    var _total            = 0,
        _orderedArr       = arr.slice(0), // copy
        _orderedArrLength = null,
        _totalCounter     = 0,
        _processedArr     = [];
        
    var _angles = {
        start: 0,
        mid: 0,
        end: 0
    };
    
    var _radians = {
        start: 0,
        mid: 0,
        end: 0
    };

    // sort array by total (descending)
    _orderedArr.sort(function(a, b) {
        return b.total - a.total;
    });
    
    _orderedArrLength = _orderedArr.length;
    
    for (var t = 0, tl = _orderedArrLength; t < tl; t ++) {
        _total += arr[t].total;
    }
    
    for (var i = 0, il = _orderedArrLength; i < il; i ++) {
        if (_orderedArr[i].total > 0) {
            _angles = {
                start: (_processedArr[i - 1]) ? _processedArr[i - 1].angles.end : 0,
                mid: 0,
                end: ((_orderedArr[i].total + _totalCounter) / _total) * 360
            };
            
            _angles.mid = getMidAngle(_angles.start, _angles.end);
            
            _radians = {
                start: getDegToRad(_angles.start, -90),
                mid: getDegToRad(_angles.mid, -90),
                end: getDegToRad(_angles.end, -90)
            };
                        
            _processedArr.push({
                name: _orderedArr[i].name,
                total: _orderedArr[i].total,
                angles: {
                    start: _angles.start,
                    mid: _angles.mid,
                    end: _angles.end
                },
                points: {
                    start: getPointAlongC(center, r, getDegToRad(_angles.start, 90)),
                    end: getPointAlongC(center, r, getDegToRad(_angles.end, 90))
                },
                innerCentroid: getPointAlongC(center, r, getDegToRad(_angles.mid, 90)),
                outerCentroid: getPointAlongC(center, r + (r / 2), getDegToRad(_angles.mid, 90))
            });
                        
            _totalCounter += _processedArr[i].total;
        }
    }
    
    return _processedArr;
}
// DONUT END

// http://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
function withCommas(number) {
    return (number === null) ? null : number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// all we need right now
function sort(a, b) {
    return a - b;
}

// this is only for week
function getMedian(arr) {
    var _arr            = arr,
        _cleanArr       = [],
        _cleanArrLength = 0;
    
    // filter out the nulls, but keep the 0s...
    for (var i = 0, il = _arr.length; i < il; i++) {
        if (_arr[i] !== null) {
            _cleanArr.push(_arr[i]);
        }
    }

    _cleanArrLength = _cleanArr.length; // cache

    // nothin' but nulls!
    if (_cleanArrLength === 0) {
        return null;
    } else {
        // put elements in order from low to high
        _cleanArr.sort(sort);

        if ((_cleanArrLength / 2) % 1 === 0) {
            // if even, add middle pair and divide by 2, then return
            return (_cleanArr[((_cleanArrLength / 2) | 0) - 1] + _cleanArr[(_cleanArrLength / 2) | 0]) / 2;            
        } else {
            // if odd, return middle number
            return _cleanArr[(_cleanArrLength / 2) | 0];
        }
    }
}

function getSum(arr) {
    var _sum = 0;

    for (var i = 0, il = arr.length; i < il; i++) {
        if (arr[i] !== null) {
            _sum += arr[i];
        }
    }

    return _sum;
}

function getFloorCeil(arr) {
    var _arr      = arr,
        _cleanArr = [];
    
    // filter out the nulls, but keep the 0s...
    for (var i = 0, il = _arr.length; i < il; i++) {
        if (_arr[i] !== null) {
            _cleanArr.push(_arr[i]);
        }
    }
    
    _cleanArr.sort(sort);
    
    // return first and last value after sorting low to high...
    return [_cleanArr[0], _cleanArr[_cleanArr.length - 1]];
}

function getAvg(arr) {
    var _sum    = 0,
        _length = arr.length || 0,
        _counter = _length || 0;

    for (var i = 0, il = _length; i < il; i++) {
        // #APPTS-3983: filter null ONLY and reduce the number we divide by...
        if (arr[i] !== null) {
            _sum += arr[i];
        } else {
            _counter --;
        }
    }

    return (_counter === 0) ? 0 : _sum / _counter;
}

// this will check a calculated result for 'bad'...
function processForValid(result, defaultVal) {
    var _result     = result,
        _defaultVal = defaultVal;
    
    return (!_result || isNaN(_result) || !isFinite(_result)) ? _defaultVal : _result;
}

// http://stackoverflow.com/questions/2692323/code-golf-friendly-number-abbreviator
function abbr(number, decPlaces) {
    // Enumerate number abbreviations
    var abbrev = null;
    
    if (number === null) {
        return null;
    } else {
        abbrev = ["k", "m", "b", "t"];

        // 2 decimal places => 100, 3 => 1000, etc
        decPlaces = Math.pow(10, decPlaces);    

        // Go through the array backwards, so we do the largest first
        for (var i = abbrev.length - 1; i >= 0; i--) {

            // Convert array index to "1000", "1000000", etc
            var size = Math.pow(10, (i + 1) * 3);

            // If the number is bigger or equal do the abbreviation
            if (size <= number) {
                 // Here, we multiply by decPlaces, round, and then divide by decPlaces.
                 // This gives us nice rounding to a particular decimal place.
                 number = Math.round(number * decPlaces / size) / decPlaces;

                 // Add the letter for the abbreviation
                 number += abbrev[i];

                 // We are done... stop
                 break;
            }
        }

        return number;
    }
}

function msecToTime(msec) {
    var _msec    = (msec === null) ? null : msec,
        _seconds = ((_msec / 1000) % 60),
        _minutes = (((_msec / 1000) / 60) % 60) | 0,
        _hours   = (((_msec / 1000) / 60) / 60) | 0;
        
    if (_msec === null) {
        return null;
    } else if (_msec < 10 && _msec !== 0) {
        if (_msec < 1) {
            return '<1ms'
        } else {
            return Number(_msec).toFixed(2) + 'ms';
        }
    } else {
        if (_hours > 0) {
            return (_seconds >= 1) ? _hours + 'h ' + _minutes + 'm ' + (_seconds | 0) + 's' : _hours + 'h ' + _minutes + 'm';
        } else if (_minutes > 0) {
            return (_seconds >= 1) ? _minutes + 'm ' + (_seconds | 0) + 's' : _minutes + 'm';
        } else if (_seconds > 0) {
            return (_seconds % 1 !== 0) ? _seconds.toFixed(2) + 's' : _seconds + 's';
        } else {
            if (_msec < 1 || _msec === 0) {
                return '0s';
            } else {
                return (_msec / 1000).toFixed(2) + 's';
            }
        }
    }
}

function allAreSame(arr) {
    var _arr      = arr || [],
        _cleanArr = [];

    // filter out nulls...
    for (var i = 0, il = _arr.length; i < il; i ++) {
        if (_arr[i] !== null) {
            _cleanArr.push(_arr[i]);
        }
    }
    
    // then check for matches...
    for (var c = 0, cl = _cleanArr.length; c < cl; c ++) {
        if (_cleanArr[c] !== _cleanArr[0]) {
            return false;
        }
    }
    
    return true;
}

function allAreNull(arr) {
    var _arr = arr || [];

    for (var i = 0, il = _arr.length; i < il; i ++) {
        // check specifically for null...
        if (_arr[i] !== null) {
            return false;
        }
    }

    return true;
}

module.exports = function(config) {
    return {
        abbr: abbr, 
        withCommas: withCommas,
        getFloorCeil: getFloorCeil,
        getAvg: getAvg,
        getMedian: getMedian,
        getSum: getSum,
        getAnglesAndPoints: getAnglesAndPoints,
        getZoneFromPoint: getZoneFromPoint,
        msecToTime: msecToTime,
        allAreSame: allAreSame,
        allAreNull: allAreNull,
        getRandomInt: getRandomInt,
        removeNullsFromArr: removeNullsFromArr,
        processForValid: processForValid,
        getBiggestDropIndexes: getBiggestDropIndexes,
        getDropRateArr: getDropRateArr,
        getHighestDropRatesIndexes: getHighestDropRatesIndexes
    };
};