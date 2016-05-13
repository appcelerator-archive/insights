var globalData = null;

var lib = {
    number: require('client/number')()
};

var funnels = {
    minWidth: 8,
    maxWidth: 20,
    minBars: 5,
    maxBars: 40,
    eventRowMinHeight: 50, // used originally to allow collapsing...
    eventRowMaxHeight: 80,
    colors: {
        acquisition: {
            base: '#8dc63f'
        },
        engagement: {
            base: '#f7941d'
        },
        quality: {
            base: '#0072bc'
        },
        retention: {
            base: '#942c61'
        }
    },
    rangeImages: {
        acquisition: 'detail/funnel-range-selection-acquisition.png',
        engagement: 'detail/funnel-range-selection-engagement.png',
        quality: 'detail/funnel-range-selection-quality.png',
        retention: 'detail/funnel-range-selection-retention.png'
    }
};

var state = {
    visible: false,
    selectionArrowDisabled: true,
    canSelect: false,
    canSelectIndex: null,
    ordered: {
        names: [],
        counts: [],
        incomings: [],
        dropRates: [] // there will never be a drop rate to match the last index of all events
    },
    fadesShowing: {
        top: false,
        bottom: true
    },
    highestCount: null,
    largestDropRateIndexes: [],
    selected: {
        category: null,
        funnelIndex: null,
        eventRow: null,
        bar: null
    },
    barRanges: [],
    bars: [],
    rows: []
};

function extendState() {
    state.barRanges.length              = 0,
    state.largestDropRateIndexes.length = 0,
    state.ordered.names.length          = 0,
    state.ordered.counts.length         = 0,
    state.ordered.incomings.length      = 0,
    state.ordered.dropRates.length      = 0,
    state.bars.length                   = 0,
    state.rows.length                   = 0;

    return {
        visible: false,
        selectionArrowDisabled: true,
        canSelect: false,
        canSelectIndex: null,
        ordered: {
            names: [],
            counts: [],
            incomings: [],
            dropRates: []
        },
        fadesShowing: {
            top: false,
            bottom: true
        },
        highestCount: null,
        largestDropRateIndexes: [],
        selected: {
            category: null,
            funnelIndex: null,
            eventRow: null,
            bar: null
        },
        barRanges: [],
        bars: [],
        rows: []
    };
}

function generateGraphBar(id, count, barWidth, barSpacing) {
    var _bar = {};

    _bar.state = {
        id: id,
        height: (count === null) ? 0 : Math.round(($.eventGraphContainer.height * count) / state.highestCount),
        disabled: count === null
    };

    var _largeDropParent  = null,
        _largeDropPattern = null,
        _compareBarLeft   = Ti.UI.createView({ touchEnabled:false, opacity:0.0, height:1, left:0, right:0, top:0, backgroundColor:'#f2f2f2' }),
        _compareBarRight  = Ti.UI.createView({ touchEnabled:false, opacity:0.0, height:1, left:0, right:0, top:0, backgroundColor:'#f2f2f2' }),
        _totalBar         = Ti.UI.createView({ touchEnabled:false, height:_bar.state.height, left:0, right:0, bottom:0, backgroundColor:'#4b4b4b' });

    _bar.controllers = {
        show: function(delayer) {
            _bar.parentView.animate({ opacity:1.0, duration:delayer * 200 });
        },
        showDropPattern: function() {
            if (_largeDropParent) {
                _largeDropParent.opacity = 0.0;
                _largeDropPattern.backgroundImage = 'detail/funnel-hash.png';
                _largeDropParent.animate({ opacity:1.0, duration:250 });
            }
        },
        hideDropPattern: function() {
            if (_largeDropParent) {
                _largeDropParent.opacity = 0.0;
                _largeDropPattern.backgroundImage = 'detail/funnel-hash-inactive.png';
                _largeDropParent.animate({ opacity:1.0, duration:250 });
            }
        },
        showLeftBar: function(bottom) {
            _compareBarLeft.animate({ top:$.eventGraphContainer.height - bottom, opacity:1.0, duration:250 });
        },
        showRightBar: function(bottom) {
            _compareBarRight.animate({ top:$.eventGraphContainer.height - bottom, opacity:1.0, duration:250 });
        },
        hideLeftBar: function(id) {
            _compareBarLeft.animate({ top:0, opacity:0.0, duration:250 });
        },
        hideRightBar: function(id) {
            _compareBarRight.animate({ top:0, opacity:0.0, duration:250 });
        },
        toggle: function(inactive) {
            _totalBar.animate({ opacity:0.0, duration:0 });

            if (inactive) {
                if (state.selected.bar.state.id === 0) {
                    state.bars[id + 1].controllers.hideRightBar();
                } else if (state.selected.bar.state.id === state.ordered.counts.length - 1) {
                    state.bars[id - 1].controllers.hideLeftBar();
                } else {
                    state.bars[id + 1].controllers.hideRightBar();
                    state.bars[id - 1].controllers.hideRightBar();
                }

                _totalBar.backgroundColor = '#4b4b4b';
            } else {
                if (state.selected.bar.state.id === 0) {
                    state.bars[id + 1].controllers.showRightBar(state.bars[id].state.height);
                } else if (state.selected.bar.state.id === state.ordered.counts.length - 1) {
                    state.bars[id - 1].controllers.showLeftBar(state.bars[id].state.height);
                } else {
                    state.bars[id + 1].controllers.showRightBar(state.bars[id].state.height);
                    state.bars[id - 1].controllers.showRightBar(state.bars[id].state.height);
                }

                _totalBar.backgroundColor = '#f2f2f2';
            }

            _totalBar.animate({ opacity:1.0, duration:250 });
        },
        deselect: function() {
            if (!_bar.state.disabled && state.selected.bar) {
                if (state.largestDropRateIndexes.indexOf(_bar.state.id) !== -1 && state.ordered.dropRates[_bar.state.id] > 0) {
                    state.bars[_bar.state.id + 1].controllers.hideDropPattern();
                }

                _bar.controllers.toggle(true);
            }
        },
        select: function(e) {
            var _selectedCenter = null;

            if (!_bar.state.disabled) {
                _selectedCenter = ((_bar.state.id + 1) * funnels.eventRowMaxHeight) - (funnels.eventRowMaxHeight / 2);

                if ($.eventScrollView.height >= state.rows.length * funnels.eventRowMaxHeight) { 
                    // do not scroll
                } else if (0 + _selectedCenter > $.eventScrollView.height / 2 && (state.rows.length * funnels.eventRowMaxHeight) - _selectedCenter > $.eventScrollView.height / 2) {
                    // vertically center selected row
                    $.eventScrollView.scrollTo(0, (_bar.state.id * funnels.eventRowMaxHeight) - (($.eventScrollView.height / 2) - (funnels.eventRowMaxHeight / 2)));
                } else if ((state.rows.length * funnels.eventRowMaxHeight) - _selectedCenter < $.eventScrollView.height / 2) {
                    // scroll to bottom
                    $.eventScrollView.scrollToBottom();
                } else {
                    // scroll to top
                    $.eventScrollView.scrollTo(0, 0);
                }
                
                if (state.largestDropRateIndexes.indexOf(_bar.state.id) !== -1 && state.ordered.dropRates[_bar.state.id] > 0) {
                    state.bars[_bar.state.id + 1].controllers.showDropPattern();
                }

                if (state.selected.bar) {
                    // deselect the currently selected bar...
                    state.selected.bar.controllers.deselect();

                    // check if we deselcted the bar we previously had selected...
                    if (state.selected.bar.state.id !== _bar.state.id) {
                        // if not, select new bar...
                        state.selected.bar = _bar;

                        _bar.controllers.toggle(false);
                    } else {
                        // if so, null he reference...
                        state.selected.bar = null;
                    }
                } else {
                    state.selected.bar = _bar;
                    
                    _bar.controllers.toggle(false);
                }

                if (e.source.name === "bar") {
                    state.rows[_bar.state.id].controllers.select({ source:{ name:null } });
                }
            }
        },
        destroy: function() {}
    };

    if (!_bar.state.disabled) {
        _bar.parentView = Ti.UI.createView({ touchEnabled:false, opacity:0.0, name:'bar', width:barWidth, left:id * (barSpacing + barWidth), height:$.eventGraphContainer.height, backgroundColor:'#383838' });
    } else {
        _bar.parentView = Ti.UI.createView({ touchEnabled:false, opacity:0.0, name:'bar', width:barWidth, left:id * (barSpacing + barWidth), height:$.eventGraphContainer.height, backgroundImage:'detail/funnel-bar-inactive.png' });
    }

    // used to determine selection
    state.barRanges.push([_bar.parentView.left, _bar.parentView.left + barWidth]);

    if (state.largestDropRateIndexes.indexOf(id - 1) !== -1 && state.ordered.dropRates[id - 1] > 0) {
        _largeDropParent  = Ti.UI.createView({ touchEnabled:false, height:state.bars[id - 1].state.height, bottom:0, width:20 }),
        _largeDropPattern = Ti.UI.createView({ touchEnabled:false, height:370, width:20, backgroundImage:'detail/funnel-hash-inactive.png' });

        _largeDropParent.add(_largeDropPattern);
        _bar.parentView.add(_largeDropParent);
    }

    _bar.parentView.add(_totalBar);
    _bar.parentView.add(_compareBarLeft);
    _bar.parentView.add(_compareBarRight);

    // _bar.parentView.addEventListener.addEventListener('click', _bar.controllers.select);

    return _bar;
}

function generateEventRow(id, eventName, count, preventLastBar) {
    var _row = {};

    _row.state = {
        id: id
    };

    var _divider = Ti.UI.createView({ touchEnabled:false, left:15, right:15, height:1, bottom:0, backgroundColor:'#585858' }),
        _rowNumberLbl = Ti.UI.createLabel({ font:{ fontFamily:"TitilliumText22L-250wt", fontSize:16 }, color:'#585858', touchEnabled:false, width:Ti.UI.SIZE, left:20, top:0, height:funnels.eventRowMinHeight, text:(id < 9) ? '0' + (id + 1) : id + 1 }),
        _eventNameLbl = Ti.UI.createLabel({ font:{ fontFamily:"TitilliumText22L-1wt", fontSize:20 }, color:'#808080', touchEnabled:false, left:45, width:170, minimumFontSize:18, top:0, height:funnels.eventRowMinHeight, text:eventName }),
        _countLbl = Ti.UI.createLabel({ font:{ fontFamily:"TitilliumText22L-1wt", fontSize:24 }, color:'#808080', touchEnabled:false, width:Ti.UI.SIZE, top:0, right:20, height:funnels.eventRowMinHeight, text:count }),
        _detailContainer = Ti.UI.createView({ touchEnabled:false, left:20, right:20, top:48, height:14, opacity:1.0 }),
        _incomingContainer = Ti.UI.createView({ width:Ti.UI.SIZE, height:Ti.UI.FILL, left:0, layout:'horizontal' }),
        _incomingLbl = Ti.UI.createLabel({ font:{ fontFamily:"TitilliumText22L-250wt", fontSize:12 }, width:Ti.UI.SIZE, height:Ti.UI.FILL, color:'#585858', text:'Incoming' }),
        _incomingValueLbl = Ti.UI.createLabel({ font:{ fontFamily:"TitilliumText22L-250wt", fontSize:12 }, width:Ti.UI.SIZE, height:Ti.UI.FILL, color:'#808080', text:state.ordered.incomings[id] + '%' }),
        _dropRateContainer = Ti.UI.createView({ width:Ti.UI.SIZE, height:Ti.UI.FILL, right:0, layout:'horizontal' }),
        _dropRateIcon = null,
        _dropRateLbl = Ti.UI.createLabel({ font:{ fontFamily:"TitilliumText22L-250wt", fontSize:12 }, width:Ti.UI.SIZE, height:Ti.UI.FILL, color:(state.largestDropRateIndexes.indexOf(_row.state.id) !== -1 && state.ordered.dropRates[_row.state.id] > 0) ? '#808080' : '#585858', text:'Drop-off' }),
        _dropRateValueLbl = Ti.UI.createLabel({ font:{ fontFamily:"TitilliumText22L-250wt", fontSize:12 }, width:Ti.UI.SIZE, height:Ti.UI.FILL, color:'#808080', text:(typeof state.ordered.dropRates[id] === 'string') ? state.ordered.dropRates[id] : (state.ordered.dropRates[_row.state.id] < 0) ? '--' : state.ordered.dropRates[id] + '%' });

    var _touchBg = Ti.UI.createView({ touchEnabled:false, backgroundColor:'#525252', opacity:0.0, left:15, right:15, height:Ti.UI.FILL });

    _row.controllers = {
        toggle: function(inactive) {
            if (inactive) {
                if (_dropRateIcon) {
                    _dropRateIcon.backgroundImage = 'detail/funnel-hash-icon-inactive.png';
                }

                _divider.backgroundColor = '#585858',
                _rowNumberLbl.color = '#585858',
                _eventNameLbl.color = '#808080',
                _countLbl.color = '#808080';
                _incomingLbl.color = '#585858';
                _dropRateLbl.color = (state.largestDropRateIndexes.indexOf(_row.state.id) !== -1 && state.ordered.dropRates[_row.state.id] > 0) ? '#808080' : '#585858';
                _incomingValueLbl.color = '#808080';
                _dropRateValueLbl.color = '#808080';
            } else {
                if (_dropRateIcon) {
                    _dropRateIcon.backgroundImage = 'detail/funnel-hash-icon.png';
                }

                _divider.backgroundColor = '#f2f2f2';
                _rowNumberLbl.color = funnels.colors[state.selected.category].base,
                _eventNameLbl.color = '#f2f2f2',
                _countLbl.color = '#f2f2f2';

                _incomingLbl.color = funnels.colors[state.selected.category].base;
                _dropRateLbl.color = funnels.colors[state.selected.category].base;
                _incomingValueLbl.color = '#f2f2f2';
                _dropRateValueLbl.color = '#f2f2f2';
            }
        },
        show: function(delayer, callback) {
            _row.parentView.animate({ opacity:1.0, duration:delayer * 200 }, function() {
                if (callback) { callback(_row.state.id); }
            });
        },
        select: function(e) {
            if (state.selected.eventRow) {
                state.selected.eventRow.controllers.deselect();

                if (state.selected.eventRow.state.id !== _row.state.id) {
                    state.selected.eventRow = _row;

                    _row.controllers.toggle(false);
                } else {
                    state.selected.eventRow = null;
                }
            } else {
                state.selected.eventRow = _row;

                _divider.backgroundColor = '#f2f2f2';
                
                _row.controllers.toggle(false);
            }

            if (e.source.name === "row") {
                state.bars[_row.state.id].controllers.select({ source:{ name:null } });
            }
        },
        deselect: function() {
            if (state.selected.eventRow) {
                _row.controllers.toggle(true);
            }
        },
        destroy: function() {}
    };

    _row.parentView = Ti.UI.createView({ opacity:0.0, name:'row', id:id, anchorPoint:{x:0, y:1}, height:funnels.eventRowMaxHeight, left:0, right:0 });

    _row.parentView.add(_touchBg);

    _incomingContainer.add(_incomingLbl);
    _incomingContainer.add(Ti.UI.createView({ width:10 }));
    _incomingContainer.add(_incomingValueLbl);

    if (state.largestDropRateIndexes.indexOf(_row.state.id) !== -1 && state.ordered.dropRates[_row.state.id] > 0) {
        _dropRateIcon = Ti.UI.createView({ width:12, height:12, backgroundImage:'detail/funnel-hash-icon-inactive.png' });
        _dropRateContainer.add(_dropRateIcon);
        _dropRateContainer.add(Ti.UI.createView({ width:10 }));
    }

    _dropRateContainer.add(_dropRateLbl);
    _dropRateContainer.add(Ti.UI.createView({ width:10 }));
    _dropRateContainer.add(_dropRateValueLbl);

    _detailContainer.add(_incomingContainer);
    _detailContainer.add(_dropRateContainer);

    _row.parentView.add(_rowNumberLbl);
    _row.parentView.add(_eventNameLbl);
    _row.parentView.add(_countLbl);
    _row.parentView.add(_detailContainer);
    _row.parentView.add(_detailContainer);
    
    if (!preventLastBar) {
        _row.parentView.add(_divider);
    }

    _row.parentView.addEventListener('click', _row.controllers.select);
    _row.parentView.addEventListener('touchstart', function() {
        _touchBg.animate({ opacity:1.0, duration:100 }, function() {
            _touchBg.animate({ opacity:0.0, duration:100 });
        });
    });

    return _row;
}

function generateGraph(id, count) {
    var _bar                = null,
        _totalBars          = globalData.categories[state.selected.category].funnels[state.selected.funnelIndex].events.length,
        // if we have <= minBars, default to maxWidth; otherwise, scale
        _barWidth           = Math.round((_totalBars <= funnels.minBars) ? funnels.maxWidth : funnels.maxWidth - ((funnels.maxWidth - funnels.minWidth) / (funnels.maxBars - funnels.minBars) * _totalBars)),
        _normalizedBarTotal = (_totalBars <= funnels.minBars) ? funnels.minBars : _totalBars,
        _barSpacing         = Math.round(($.eventGraphContainer.width - (_normalizedBarTotal * _barWidth)) / (_normalizedBarTotal - 1)),
        _event              = null;

    for (var nb = 0; nb < _normalizedBarTotal; nb ++) {
        _eventCount = (globalData.categories[state.selected.category].funnels[state.selected.funnelIndex].events[nb]) ? globalData.categories[state.selected.category].funnels[state.selected.funnelIndex].events[nb].count : null; // we may render more bars than we have data

        _bar = generateGraphBar(nb, _eventCount, _barWidth, _barSpacing);
        state.bars.push(_bar);

        $.eventGraphContainer.add(_bar.parentView);
    }
}

function generateEventRows() {
    var _row = null;

    for (var e = 0, el = globalData.categories[state.selected.category].funnels[state.selected.funnelIndex].events.length; e < el; e ++) {
        // id, eventName, count, preventLastBar
        _row = generateEventRow(e, state.ordered.names[e], state.ordered.counts[e], (e + 1 === el) ? true : false);
        state.rows.push(_row);

        $.eventContainer.add(_row.parentView);
    }
}

function destroyUI(callback) {
    $.loadingDataLbl.animate({ opacity:1.0, duration:250 });

    $.rightContainer.animate({ opacity:0.0, duration:0 });

    if (state.rows.length > 0 && state.bars.length > 0) {
        state.visible = false;

        $.eventGraphContainer.animate({ opacity:0.0, duration:0 });
        $.eventScrollViewContainer.animate({ opacity:0.0, left:10, duration:0 }, function() {
            if (state.rows.length > 0) {
                for (var r = 0, rl = state.rows.length; r < rl; r ++) {
                    $.eventContainer.remove(state.rows[r].parentView);
                    state.rows[r].controllers.destroy();
                }
            }

            if (state.bars.length > 0) {
                for (var b = 0, bl = state.bars.length; b < bl; b ++) {
                    $.eventGraphContainer.remove(state.bars[b].parentView);
                    state.bars[b].controllers.destroy();
                }
            }

            $.eventGraphContainer.animate({ opacity:1.0, duration:0 });

            if (callback) { callback(); }
        });
    } else {
        state.visible = true;

        if (callback) { callback(); }
    }
}

function updateUI() {
    $.rightContainer.animate({ opacity:0.0, duration:0 });

    $.weekLbl.color = funnels.colors[state.selected.category].base;
    $.totalLbl.text = globalData.categories[state.selected.category].funnels[state.selected.funnelIndex].last7Days + '%';

    state.fadesShowing.top = false;
    state.fadesShowing.bottom = true;

    $.eventScrollViewFadeTop.animate({ opacity:0.0, duration:0 });
    $.eventScrollViewFadeBottom.animate({ opacity:1.0, duration:0 });

    $.rightContainer.animate({ opacity:1.0, duration:250 });

    generateEventRows();
    generateGraph();

    Ti.API.info('UPDATING FUNNELS: ' + state.selected.category);
}

function animateUI() {
    var _largetDropRateElementSelected = false;

    $.loadingDataLbl.animate({ opacity:0.0, duration:250 }, function() {
        $.eventScrollViewContainer.animate({ opacity:1.0, left:0, duration:150 });

        for (var r = 0, rl = state.rows.length; r < rl; r ++) {
            if (state.largestDropRateIndexes.indexOf(r) !== -1 && !_largetDropRateElementSelected && state.ordered.dropRates[r] > 0) {
                _largetDropRateElementSelected = true;

                state.rows[r].controllers.show(r + 1, function(index) {
                    setTimeout(function() {
                        state.bars[index].controllers.select({ source:{ name:'bar' } });
                    }, 250);
                });
            } else {
                state.rows[r].controllers.show(r + 1, null);
            }
        }

        for (var b = 0, bl = state.bars.length; b < bl; b ++) {
            state.bars[b].controllers.show(b + 1, null);
        }

        // if we didn't have a largest drop, select the first
        if (!_largetDropRateElementSelected) {
            setTimeout(function() {
                state.bars[0].controllers.select({ source:{ name:'bar' } });
            }, 250);
        }
    });
}

function update(category, funnelIndex) {
    var _funnelEvents = null,
        _tempCountArr = [];

    destroyUI(function() {
        state = extendState();

        globalData                 = Alloy.Globals.insights.data,
        state.selected.category    = category,
        state.selected.funnelIndex = funnelIndex;

        $.selectionArrow.backgroundColor = funnels.colors[state.selected.category].base;
        $.selectionRange.backgroundImage = funnels.rangeImages[state.selected.category];

        _funnelEvents = globalData.categories[state.selected.category].funnels[state.selected.funnelIndex].events;    

        for (var ci = 0, cil = _funnelEvents.length; ci < cil; ci ++) {
            state.ordered.names.push(_funnelEvents[ci].name);
            state.ordered.counts.push(_funnelEvents[ci].count);
            
            // we won't append % at this point
            state.ordered.incomings.push(_funnelEvents[ci].incoming);
            state.ordered.dropRates.push(_funnelEvents[ci].dropOff);
        }

        state.highestCount = Math.max.apply(Math, state.ordered.counts);

        Ti.API.info('------------' + state.highestCount)

        state.largestDropRateIndexes = lib.number.getHighestDropRatesIndexes(state.ordered.dropRates);


        updateUI();   

        if (!state.visible) {
            state.visible = true;

            animateUI();
        }
    });
}

function hide(callback) {
    $.parentView.animate({ opacity:0.0, duration:250 });

    if (callback) { callback(); }
}

function show(callback) {
    $.parentView.animate({ opacity:1.0, duration:250 }, function() {
        if (callback) { callback(); }
    });
}

function determineSelection(x) {
    // #TODO: it would be faster to do binary search, but seems fast enough for now
    for (var ri = 0, ril = state.barRanges.length; ri < ril; ri ++) {
        // #APPTS-5116: expand range test
        // #TODO: cache some of these values that don't require re-calculation
        if (x > (state.barRanges[ri][0] - Math.floor((($.eventGraphContainer.width / ((state.ordered.names.length < funnels.minBars) ? funnels.minBars : state.ordered.names.length)) / 2))) && x < state.barRanges[ri][1] + Math.floor((($.eventGraphContainer.width / ((state.ordered.names.length < funnels.minBars) ? funnels.minBars : state.ordered.names.length)) / 2))) {
            return {
                canSelect: true,
                range: state.barRanges[ri],
                index: ri
            };
        }
    }

    return {
        canSelect: false,
        range: null,
        index: null
    };
}

function getParentView() {
    return $.parentView;
}

function init(config) {
    var _config = config || {};

    // #TODO: move all anonymous handler functions out to named...
    $.eventGraphContainer.addEventListener('touchstart', function(e) {
        var _selectionData = determineSelection(e.x);

        state.selectionArrowDisabled = false;
        state.canSelect = _selectionData.canSelect;
        
        if (_selectionData.canSelect && !state.bars[_selectionData.index].state.disabled) {
            state.canSelectIndex = _selectionData.index;

            $.topCountLbl.text = lib.number.abbr(state.ordered.counts[_selectionData.index], 1);

            $.selectionRange.width = _selectionData.range[1] - _selectionData.range[0];

            $.topCountLblContainer.animate({ opacity:1.0, center:{x:(_selectionData.range[0] + ($.selectionRange.width / 2)) + ($.topCountContainer.width - ($.eventGraphContainer.width + $.eventGraphContainer.right)), y:$.topCountContainer.height / 2}, duration:0 });
            $.selectionRange.animate({ opacity:1.0, center:{x:_selectionData.range[0] + ($.selectionRange.width / 2), y:$.selectionArrowContainer.height - (($.selectionRange.height + $.selectionRange.bottom) / 2)}, duration:0 });
            $.selectionArrow.animate({ opacity:1.0, center:{ x:_selectionData.range[0] + ($.selectionRange.width / 2), y:$.selectionArrow.height / 2 }, duration:0 });
        } else {
            state.canSelectIndex = null;
        }
    });

    $.eventGraphContainer.addEventListener('touchmove', function(e) {
        if (e.x >= 0 && e.x <= $.eventGraphContainer.width) {
            var _selectionData = determineSelection(e.x);

            state.selectionArrowDisabled = false;
            state.canSelect = _selectionData.canSelect;

            if (_selectionData.canSelect && !state.bars[_selectionData.index].state.disabled) {
                state.canSelectIndex = _selectionData.index;

                $.topCountLbl.text = lib.number.abbr(state.ordered.counts[_selectionData.index], 1);

                $.selectionRange.width = _selectionData.range[1] - _selectionData.range[0];

                $.selectionRange.animate({ opacity:1.0, center:{x:_selectionData.range[0] + ($.selectionRange.width / 2), y:$.selectionArrowContainer.height - (($.selectionRange.height + $.selectionRange.bottom) / 2)}, duration:0 });
                $.topCountLblContainer.animate({ opacity:1.0, center:{x:(_selectionData.range[0] + ($.selectionRange.width / 2)) + ($.topCountContainer.width - ($.eventGraphContainer.width + $.eventGraphContainer.right)), y:$.topCountContainer.height / 2}, duration:0 });
                $.selectionArrow.animate({ opacity:1.0, center:{ x:_selectionData.range[0] + ($.selectionRange.width / 2), y:$.selectionArrow.height / 2 }, duration:0 });
            } else {
                state.canSelectIndex = null;

                $.selectionArrow.animate({ opacity:0.0, duration:0 });
                $.topCountLblContainer.animate({ opacity:0.0, duration:0 });
                $.selectionRange.animate({ opacity:0.0, duration:0 });
            }
        } else {
            // out of bounds
            if (e.x <= $.eventGraphContainer.width || e.x >= $.eventGraphContainer.width) {
                state.selectionArrowDisabled = true;
                state.canSelect = false;
                state.canSelectIndex = null;

                $.topCountLblContainer.animate({ opacity:0.0, duration:0 });
                $.selectionRange.animate({ opacity:0.0, duration:0 });
                $.selectionArrow.animate({ opacity:0.0, duration:0 });
            }
        }
    });

    $.eventGraphContainer.addEventListener('touchend', function(e) {
        if (state.canSelectIndex !== null) {
            state.rows[state.canSelectIndex].controllers.select({ source:{ name:'row' } });

            state.canSelectIndex = null;
        }

        $.topCountLblContainer.animate({ opacity:0.0, duration:500 });
        $.selectionRange.animate({ opacity:0.0, duration:500 });
        $.selectionArrow.animate({ opacity:0.0, duration:500 });

        state.selectionArrowDisabled = true;
        state.canSelect = false;
    });

    $.eventScrollView.addEventListener('scroll', function(e) {
        if (e.y <= 0) {
            state.fadesShowing.top = false;
            $.eventScrollViewFadeTop.animate({ opacity:0.0, duration:0 });
        } else if (e.y >= ((state.rows.length * funnels.eventRowMaxHeight) - $.eventScrollView.height)) {
            state.fadesShowing.bottom = false;
            $.eventScrollViewFadeBottom.animate({ opacity:0.0, duration:0 });
        } else if (e.y > 0 && e.y < ((state.rows.length * funnels.eventRowMaxHeight) - $.eventScrollView.height)) {
            // show both
            if (!state.fadesShowing.top) {
                state.fadesShowing.top = true;
                $.eventScrollViewFadeTop.animate({ opacity:1.0, duration:0 });
            }

            if (!state.fadesShowing.bottom) {
                state.fadesShowing.bottom = true;
                $.eventScrollViewFadeBottom.animate({ opacity:1.0, duration:0 });
            }
        }
    });
}

exports._init          = init,
exports._update        = update,
exports._hide          = hide,
exports._show          = show,
exports._getParentView = getParentView;