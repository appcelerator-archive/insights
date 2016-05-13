function getVersionAsString() {
    var _version = Alloy.Globals.insights.info.version;

    return _version.major + '.' + _version.point + '.' + _version.minor;
}

function formatVersionFromSegments(versionData) {
    return versionData.major + '.' + versionData.point + '.' + versionData.minor;
}

function isCurrent(versionData) {
    var _version = Alloy.Globals.insights.info.version;
    
    return (_version.major === versionData.major && _version.point === versionData.point && _version.minor === versionData.minor) ? true : false;
}

module.exports = function(config) {
    var _config = config || {};
    
    return {
        isCurrent: isCurrent,
        formatVersionFromSegments: formatVersionFromSegments,
        getVersionAsString: getVersionAsString
    };
};