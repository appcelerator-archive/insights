var win = Ti.UI.createWindow({ backgroundColor:'#e6e6e6' });
var insights = require('ti.insights');
var view = Ti.UI.createView({ width:200, height:200, backgroundColor:'#f00' });
// adjusting opacity reduces the effect, but below 0.8, the blur isn't very noticeable...
// dark tints are not all that great
// var blur = insights.createBlurView({ backgroundColor:'#f00', translucentTintColor:'#111', top:0, width:200, height:200 });
// I prefer this method of tinting, as it doesn't require tweaking of the blur amount - should refactor to remove need for child view
var blur = insights.createBlurView({ top:0, width:200, height:200 });
var color = Ti.UI.createView({ backgroundColor:'#0f0', opacity:0.8 });
var btn = Ti.UI.createButton({ left:20, right:20, bottom:20, height:50, title:'toggle' });

var trans = true;

btn.addEventListener('click', function() {
    trans = !trans;
    blur.translucent = trans;
});

blur.add(color);
win.add(view);
win.add(blur);
win.add(btn);
win.open();

blur.animate({ top:320, duration:5000 });
