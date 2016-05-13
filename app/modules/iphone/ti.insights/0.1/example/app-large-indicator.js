var win = Ti.UI.createWindow({ backgroundColor:'#000' });
var insights = require('ti.insights');

var loadingIndicator = insights.createLoadingIndicatorLargeView({
    width: 700,
    height: 700,
    backgroundColor:'#333'
});

var toggle = Ti.UI.createButton({ backgroundColor:'#f00', bottom:0, left:0, right:0, height:44 });

toggle.addEventListener('click', function() {
    loadingIndicator.toggle();
})

win.add(toggle);
win.add(loadingIndicator);
win.open();