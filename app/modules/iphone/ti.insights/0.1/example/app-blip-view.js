var win = Ti.UI.createWindow();
var insights = require('ti.insights');

var wrapper01 = Ti.UI.createView({
    width: 200,
    height: 200,
    top: 20,
    backgroundColor: '#f00'
});

var wrapper02 = Ti.UI.createView({
    width: 100,
    height: 100,
    bottom: 20,
    backgroundColor: '#0f0'
});

var blip01 = insights.createBlipView({
    touchEnabled: false,
    width: Ti.UI.FILL,
    height: Ti.UI.FILL,
    radius: 50,
    blipColor: '#333'
});

var blip02 = insights.createBlipView({
    touchEnabled: false,
    width: Ti.UI.FILL,
    height: Ti.UI.FILL,
    radius: 25,
    blipColor: '#666'
});

var label01 = Ti.UI.createLabel({
    touchEnabled: false,
    text: '1',
    fontWeight: 'bold',
    color: '#f2f2f2',
    width: Ti.UI.SIZE,
    height: Ti.UI.SIZE
});

var label02 = Ti.UI.createLabel({
    touchEnabled: false,
    text: '2',
    fontWeight: 'bold',
    color: '#f2f2f2',
    width: Ti.UI.SIZE,
    height: Ti.UI.SIZE
});

wrapper01.addEventListener('click', function() {
    blip01.toggle();
});

wrapper02.addEventListener('click', function() {
    blip02.toggle();
});

wrapper01.add(blip01);
wrapper01.add(label01);

wrapper02.add(blip02);
wrapper02.add(label02);

win.add(wrapper01);
win.add(wrapper02);

win.open();
