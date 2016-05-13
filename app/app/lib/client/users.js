// o   First run experience
// o   Persist (force close handling) login, selected app, pins by user
// o   User timeout

var update = {
    props: {}
};

// data[0]
update.props.firstRun = function(username, firstRun) {
    var _data = getUserList(username);

    _data[0] = firstRun;

    updateUser(username, _data);
};

// expecting array of guids
// data[1]
update.props.pins = function(username, pins) {
    updatePinnedList(username, pins);
};

// data[2]
update.props.lastSelectedGuid = function(username, guid) {
    var _data = null;

    // don't set this when the user is using single app mode...
    if (!Alloy.Globals.insights.state.singleAppMode) {
        _data = getUserList(username);

        _data[2] = guid || null;

        updateUser(username, _data);
    }
};

// data[3]
update.props.sessionExpired = function(username, expired) {
    var _data = getUserList(username);

    _data[3] = expired || false;

    updateUser(username, _data);
};

// data[4]
update.props.twoFactor = function(username, authd) {};

// #APPTS-3862: data[5]
update.props.appLastUpdated = function(username, timestamp) {
    var _data = getUserList(username);

    _data[5] = timestamp || null;

    updateUser(username, _data);
};

// data[6]
update.props.funnelCompareTimestamp = function(username, timestamp) {
    var _data = getUserList(username);

    _data[6] = timestamp || null;

    updateUser(username, _data);
};

function updatePinnedList(username, updatedData) {
    Ti.App.Properties.setList(username + 'Pins', updatedData);
}

function createdPinnedList(username) {
    Ti.App.Properties.setList(username + 'Pins', []);
}

function getPinnedListData(username) {
    var _pinnedList = Ti.App.Properties.getList(username + 'Pins', []);

    if (_pinnedList.length === 0) { createdPinnedList(username); }

    return Ti.App.Properties.getList(username + 'Pins', []);
}

function updateUser(username, updatedData) {
    Ti.App.Properties.setList(username, updatedData);
}

function createUser(username) {
    // [ firstRun, pin ID, lastSelectedGuid, sessionExpired, 2-factor complete, #APPTS-3862: app last updated, #APPTS-5034: funnel compare timestamp ]
    // #TODO: for v1, every user is flagged true for completing 2-factor auth...
    Ti.App.Properties.setList(username, [false, username + 'Pins', null, false, true, null, true, null, null]);
}

function getUserList(username) {
    return Ti.App.Properties.getList(username, []);
}

function getUserData(username) {
    var _userList = Ti.App.Properties.getList(username, []);

    // this will only run once per installation...
    if (_userList.length === 0) { createUser(username); }

    return getUserList(username);
}

module.exports = function() {
    return {
        getPinnedListData: getPinnedListData,
        getUserData: getUserData,
        update: update
    };
};