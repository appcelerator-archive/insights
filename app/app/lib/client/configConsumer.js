var url = (ENV_PRODUCTION) ? 
    'final_url_goes_here' : 'http://dev.anovice.com/appcelerator/platform/config.json';

function getClientConfig(callback) {}

module.exports = function(config) {
    return {
        getClientConfig: getClientConfig
    };
};