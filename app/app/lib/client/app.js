var update = {
    props: {}
};

update.props.firstRun = function(firstRun) {
    var _data = getAppData();

    _data.firstRun = firstRun;

    updateAppObj(_data);
};

update.props.lastUser = function(lastUser) {
    var _data = getAppData();

    _data.lastUser = lastUser || null;

    updateAppObj(_data);
};

// #VPC support, #APPTS-3858
update.props.customDomain = function(customDomain) {
    var _data = getAppData();

    _data.customDomain = customDomain || null;

    updateAppObj(_data);
};

update.props.tipsMapEnabled = function(tipsMapEnabled) {
    var _data = getAppData();

    _data.tipsMapEnabled = tipsMapEnabled;

    updateAppObj(_data);
};

update.props.tipsOverviewEnabled = function(tipsOverviewEnabled) {
    var _data = getAppData();

    _data.tipsOverviewEnabled = tipsOverviewEnabled;

    updateAppObj(_data);
};

update.props.tipsDetailStandardEnabled = function(tipsDetailStandardEnabled) {
    var _data = getAppData();

    _data.tipsDetailStandardEnabled = tipsDetailStandardEnabled;

    updateAppObj(_data);
};

update.props.tipsDetailFunnelEnabled = function(tipsDetailFunnelEnabled) {
    var _data = getAppData();

    _data.tipsDetailFunnelEnabled = tipsDetailFunnelEnabled;

    updateAppObj(_data);
};

function extendNewAppObj() {
    // there are two first run props...
    // this prop is used for first run; initial installation...
    // the user prop is for first login (user gets confirm alert); initial installation...
    return {
        firstRun: false,
        lastUser: null,
        customDomain: null,  // #VPC support, #APPTS-3858
        tipsMapEnabled: true,
        tipsOverviewEnabled: true,
        tipsDetailStandardEnabled: true,
        tipsDetailFunnelEnabled: true
    };
}

function updateAppObj(updatedAppObj) {
    Ti.App.Properties.setObject('app', updatedAppObj);
}

function createAppObj() {
    updateAppObj(extendNewAppObj());
}

function getAppData() {    
    // this will only run once per installation...
    if (!Ti.App.Properties.getObject('app', null)) {
        createAppObj();
    }

    return Ti.App.Properties.getObject('app', null);
}

module.exports = function() {
    return {
        getAppData: getAppData,
        update: update
    };
};