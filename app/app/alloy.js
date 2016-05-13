// START: APM service code injection
// Require the apm module
Alloy.Globals.apm = undefined;
try {
Alloy.Globals.apm = require("com.appcelerator.apm");
}
catch (e) {
Ti.API.info("com.appcelerator.apm module is not available");
}

// Initialize the module if it is defined
Alloy.Globals.apm && Alloy.Globals.apm.init();
// END: APM code injection

// The contents of this file will be executed before any of
// your view controllers are ever executed, including the index.
// You have access to all functionality on the `Alloy` namespace.
//
// This is a great place to do any initialization for your app
// or create any global variables/functions that you'd like to
// make available throughout your app. You can easily make things
// accessible globally by attaching them to the `Alloy.Globals`
// object. For example:
//
// Alloy.Globals.someGlobalFunction = function(){};
