var win = Ti.UI.createWindow({ backgroundColor:'#e6e6e6' });
var insights = require('ti.insights');

var wrapper = Ti.UI.createView({
    width: 222,
    height: 222,
    backgroundColor:'#f00'
});

var orb = insights.createOrbView({
    width: Ti.UI.FILL,
    height: Ti.UI.FILL,
    percent: 0
});

var label = Ti.UI.createLabel({
    height: Ti.UI.SIZE,
    width: Ti.UI.SIZE,
    text: 0,
    color: '#ccc'
});

var slider = Ti.UI.createSlider({
    bottom: 40,
    height: Ti.UI.SIZE,
    left: 40, 
    right: 40,
    value: 0,
    min: -500,
    max: 500
});

slider.addEventListener('change', function(e) {
    var newPercent = parseInt(e.value);
    
    label.color = (newPercent === 0) ? '#ccc' : (newPercent > 0) ? '#00b1ff' : '#ff0080';
    label.text = newPercent;
    
    orb.percent = newPercent;
});

wrapper.addEventListener('click', function() {
    alert('tapped orb');
});

wrapper.add(orb);
wrapper.add(label);

win.add(wrapper);
win.add(slider);
win.open();