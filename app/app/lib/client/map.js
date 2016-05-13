// Generates a map surface object with useful 
// utils for mercator projections
var mapDetails = {
    width: 0,
    height: 0,
    latitude: {
        boundsBottom: 0,
        boundsBottomDegree: 0
    },
    longitude : {
        boundsLeft: 0,
        boundsRight: 0,
        delta: 0
    }
};

function convertGeoToPixelPosition(latitude, longitude) {
    var _latitude           = latitude || 0,
        _longitude          = longitude || 0,
        _worldWidth         = 0,
        _offsetY            = 0,
        _finalPixelPosition = { x:0, y:0 };

    // MATHS!!!
    _finalPixelPosition.x = ((_longitude - mapDetails.longitude.boundsLeft) * (mapDetails.width / mapDetails.longitude.delta)) / 2 | 0;
    _latitude            *= Math.PI / 180;
    _worldWidth           = ((mapDetails.width / mapDetails.longitude.delta) * 360) / (2 * Math.PI);
    _offsetY              = (_worldWidth / 2 * Math.log((1 + Math.sin(mapDetails.latitude.boundsBottomDegree)) / (1 - Math.sin(mapDetails.latitude.boundsBottomDegree))));
    _finalPixelPosition.y = (mapDetails.height - ((_worldWidth / 2 * Math.log((1 + Math.sin(_latitude)) / (1 - Math.sin(_latitude)))) - _offsetY)) / 2 | 0;

    return _finalPixelPosition;
}

function notIntersecting(rectA, rectB) {
    return rectA.x + rectA.width < rectB.x || 
           rectB.x + rectB.width < rectA.x ||
           rectA.y + rectA.height < rectB.y ||
           rectB.y + rectB.height < rectA.y;
}

// only supports a single level of clustering...
function cluster(zonesArr, clustersArr) {
    var _zonesArr    = zonesArr || [],
        _clustersArr = clustersArr || [];
    
    var _currentClusterIndex = 0;
    
    var _rectA = { x:0, y:0, width:0, height:0 },
        _rectB = { x:0, y:0, width:0, height:0 };
        
    var _firstElementPushed = false;
            
    // begin loop through all zones
    for (var zai = 0, zal = _zonesArr.length; zai < zal; zai++) {
        // loop through current zone blips
        for (var zi = 0, zil = _zonesArr[zai].length; zi < zil; zi++) {
            // if clusters arr is empty, push the first blip in initial array
            // this will only happen once per cluster call
            if (!_firstElementPushed) {
                _firstElementPushed = true;
                _clustersArr.push([_zonesArr[zai][zi]]);
            } else {
                // iterate through each blip in the current cluster
                // and see if the current blip intersects with blips 
                // in current cluster
                
                for (var ci = 0, cil = _clustersArr[_currentClusterIndex].length; ci < cil; ci++) {
                    // current blip in the current zone arr
                    // we assume we have only center (from element state object)
                    _rectA = { x:_zonesArr[zai][zi].state.center.x - (_zonesArr[zai][zi].state.width / 2), y:_zonesArr[zai][zi].state.center.y - (_zonesArr[zai][zi].state.height / 2), width:_zonesArr[zai][zi].state.width, height:_zonesArr[zai][zi].state.height},
                    // this is the current blip in the current cluster arr
                    _rectB = { x:_clustersArr[_currentClusterIndex][ci].state.center.x - (_clustersArr[_currentClusterIndex][ci].state.width / 2), y:_clustersArr[_currentClusterIndex][ci].state.center.y - (_clustersArr[_currentClusterIndex][ci].state.height / 2), width:_clustersArr[_currentClusterIndex][ci].state.width, height:_clustersArr[_currentClusterIndex][ci].state.height };

                    
                    if (notIntersecting(_rectA, _rectB)) {
                        // push to new cluster arr
                        _currentClusterIndex ++;
                        _clustersArr.push([_zonesArr[zai][zi]]);
                        
                        // we need to update cached arr length
                        cil = _clustersArr[_currentClusterIndex].length;
                    } else {
                        // push to current cluster arr
                        _clustersArr[_currentClusterIndex].push(_zonesArr[zai][zi]);
                        break;
                    }
                }
            }
        }
    }
}

function assignZone(element, zonesArr, layout, size) {
    var _zoneWidth  = size.width / layout.cols, // should be 150
        _zoneHeight = size.height / layout.rows, // should be 150
        _zoneTotal  = layout.cols * layout.rows;
                    
    var _foundZone = {
        col: 0,
        row: 0
    };
    
    var _index = 0;
    
    // find column
    for (var ci = 0; ci < layout.cols; ci++) {     
        // this isn't handling out of bounds
        if (element.state.center.x >= _zoneWidth * ci && element.state.center.x <= _zoneWidth * (ci + 1)) {
            _foundZone.col = ci;
            break;
        }
    }
    
    for (var ri = 0; ri < layout.rows; ri++) {
        // this isn't handling out of bounds
        if (element.state.center.y >= _zoneHeight * ri && element.state.center.y <= _zoneHeight * (ri + 1)) {
            _foundZone.row = ri;
            break;
        }
    }
    
    _index = (Math.max(_foundZone.col, _foundZone.row) * Math.sqrt(_zoneTotal)) + Math.min(_foundZone.col, _foundZone.row);
    
    // find the right index (sequential zones arr) and push element
    zonesArr[_index].push(element);
}

module.exports = function(config) {
    var _config = config || {};

    // setup
    mapDetails                             = _config;
    mapDetails.longitude.delta             = mapDetails.longitude.boundsRight - mapDetails.longitude.boundsLeft;
    mapDetails.latitude.boundsBottomDegree = mapDetails.latitude.boundsBottom * (Math.PI / 180);

    return {
        convertGeoToPixelPosition: convertGeoToPixelPosition,
        assignZone: assignZone,
        cluster: cluster
    };
};