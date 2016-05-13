// #TODO: this will need to be based on dynamic categories in the future...
var EVT = {
    HOME: {
        // when the user opens the platform page
        INFO: 'home.info', // implemented
        SURVEY: 'home.survey', // implemented
        // when user opens the left menu...
        APPSELECTOR: 'home.appselector', // implemented
        // when user selected an app from the left menu...
        SELECTAPP: 'home.appselector.selectapp', // implemented
        // when user taps the top session number to expand, only...
        ACTIVESESSION: 'home.activesession', // implemented
        // when the user logs out from the right menu...
        LOGOUT: 'home.logout', // implemented
        // when the user switches between orbs...
        ACQUISITION: 'home.acquisition', // implemented
        ENGAGEMENT: 'home.engagement', // implemented
        RETENTION: 'home.retention', // implemented
        QUALITY: 'home.quality' // implemented
    },
    // when user navigates from overview to detail...
    OVERVIEW: {
        ACQUISITION: 'home.acquisition.detail1', // implemented
        ENGAGEMENT: 'home.engagement.detail1', // implemented
        RETENTION: 'home.retention.detail1', // implemented
        QUALITY: 'home.quality.detail1', // implemented
    },
    // when user switches between categories at detail...
    DETAIL: {
        ACQUISITION: 'home.acquisition.detail2', // implemented
        ENGAGEMENT: 'home.engagement.detail2', // implemented
        RETENTION: 'home.retention.detail2', // implemented
        QUALITY: 'home.quality.detail2', // implemented
    },
    // when user switches between metrics...
    METRICS: {
        INSTALLS: 'home.acquisition.detail2.installs', // implemented
        PUSHDEVICES: 'home.acquisition.detail2.pushdevices', // implemented
        SESSIONLENGTH: 'home.engagement.detail2.sessionlength', // implemented
        SESSIONS: 'home.engagement.detail2.sessions', // implemented
        RETENTIONRATE: 'home.retention.detail2.retentionrate', // implemented
        UNIQUEDEVICES: 'home.retention.detail2.dailyuniques', // implemented; though the key is 'UNIQUEDEVICES' keep event name as originally implemented
        CRASHFREQUENCY: 'home.quality.detail2.crashfrequency', // implemented
        SESSIONS_CRASHES: 'home.quality.detail2.sessions_crashes', // implemented
        UNIQUECRASHES: 'home.quality.detail2.uniquecrashes', // implemented
    }
};

function fireEvent(event) {
    Ti.API.info('Firing event: ' + event);
    Ti.Analytics.featureEvent(event);
}

module.exports = function(config) {
    var _config = config || null;

    return {
        fireEvent: fireEvent,
        EVT: EVT
    };
}