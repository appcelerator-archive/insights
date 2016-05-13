var win = Ti.UI.createWindow({ backgroundColor:'#e6e6e6' });
var insights = require('ti.insights');

var donut = insights.createDonutView({ color:'#f00', width:100, height:100, backgroundColor:'#f00' });
var label = Ti.UI.createLabel({ bottom:0, height:Ti.UI.SIZE, width:Ti.UI.SIZE });
var update = false;
donut.color = '#f0f';
donut.data = [];

Ti.API.info(donut.data);
Ti.API.info('TEST');

label.text = donut.data;
win.add(donut);
win.add(label);
win.open();