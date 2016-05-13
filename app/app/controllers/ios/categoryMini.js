var globalData = null;

var lib = {
    number: require('client/number')()
};

var categoryMini = {
    colors: {
        up: '#089cdf',
        down: '#ff0080',
        none: '#4b4b4b',
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
    }
};

var state = {
    init: false,
    selected: {
        category: null,
        orb: null
    },
    callbacks: {
        notifyDetail: null
    }
};

function getParentView() {
    return $.parentView;
}

// #TODO: this needs to be more dynamic
function updateUI() {
    var _selectedCategory = globalData.categories[state.selected.category],
        _color            = null;

    $.orbAcquisitionContainer.backgroundImage = (globalData.categories.acquisition.direction === 0) ? 'detail/metric-category-ring-none.png' : (globalData.categories.acquisition.direction === -1) ? 'detail/metric-category-ring-down.png' : 'detail/metric-category-ring-up.png';
    $.orbEngagementContainer.backgroundImage = (globalData.categories.engagement.direction === 0) ? 'detail/metric-category-ring-none.png' : (globalData.categories.engagement.direction === -1) ? 'detail/metric-category-ring-down.png' : 'detail/metric-category-ring-up.png';
    $.orbQualityContainer.backgroundImage = (globalData.categories.quality.direction === 0) ? 'detail/metric-category-ring-none.png' : (globalData.categories.quality.direction === -1) ? 'detail/metric-category-ring-down.png' : 'detail/metric-category-ring-up.png';
    $.orbRetentionContainer.backgroundImage = (globalData.categories.retention.direction === 0) ? 'detail/metric-category-ring-none.png' : (globalData.categories.retention.direction === -1) ? 'detail/metric-category-ring-down.png' : 'detail/metric-category-ring-up.png';

    $.orbAcquisitionView.backgroundImage = 'detail/metric-category-selected-icon-acquisition.png';
    $.orbEngagementView.backgroundImage = 'detail/metric-category-inactive-icon-engagement.png';
    $.orbQualityView.backgroundImage = 'detail/metric-category-inactive-icon-quality.png';
    $.orbRetentionView.backgroundImage = 'detail/metric-category-inactive-icon-retention.png';

    if (_selectedCategory.lastWeek === _selectedCategory.thisWeek) {
        _color = categoryMini.colors.none;
    // } else if (_selectedCategory.lastWeek === 0 && _selectedCategory.thisWeek > 0) {
        // _color = categoryMini.colors.none;
    // } else if (_selectedCategory.thisWeek === 0 && _selectedCategory.lastWeek > 0) {
        // _color = categoryMini.colors.none;
    } else {
        _color = (_selectedCategory.direction === 0) ? categoryMini.colors.none : (_selectedCategory.direction === -1) ? categoryMini.colors.down : categoryMini.colors.up;
    }
    
    $.thisWeekBarView.backgroundColor = _color;
    // $.thisWeekLbl.color = _color;
    $.percentLbl.color = _color;
}

function focusOrb(e) {
    e.source.animate({ transform:Ti.UI.create2DMatrix({ scale:0.94 }), duration:100 });
}

function blurOrb(e) {
    e.source.animate({ transform:Ti.UI.create2DMatrix({ scale:1.0 }), duration:100 });
}

// fullUpdate: changing/refreshing application?
function updateUIWithData(fullUpdate) {
    var _selectedCategory = null,
        _barWidth         = 1,
        _color            = null;    

    _selectedCategory = globalData.categories[state.selected.category];

    _color = (_selectedCategory.direction === 0) ? categoryMini.colors.none : (_selectedCategory.direction === -1) ? categoryMini.colors.down : categoryMini.colors.up;

    if (fullUpdate) {
        $.orbAcquisitionContainer.backgroundImage = (globalData.categories.acquisition.direction === 0) ? 'detail/metric-category-ring-none.png' : (globalData.categories.acquisition.direction === -1) ? 'detail/metric-category-ring-down.png' : 'detail/metric-category-ring-up.png';
        $.orbEngagementContainer.backgroundImage = (globalData.categories.engagement.direction === 0) ? 'detail/metric-category-ring-none.png' : (globalData.categories.engagement.direction === -1) ? 'detail/metric-category-ring-down.png' : 'detail/metric-category-ring-up.png';
        $.orbQualityContainer.backgroundImage = (globalData.categories.quality.direction === 0) ? 'detail/metric-category-ring-none.png' : (globalData.categories.quality.direction === -1) ? 'detail/metric-category-ring-down.png' : 'detail/metric-category-ring-up.png';
        $.orbRetentionContainer.backgroundImage = (globalData.categories.retention.direction === 0) ? 'detail/metric-category-ring-none.png' : (globalData.categories.retention.direction === -1) ? 'detail/metric-category-ring-down.png' : 'detail/metric-category-ring-up.png';
    } else {
        state.selected.orb.opacity = 0.0;
        state.selected.orb.backgroundImage = 'detail/metric-category-selected-icon-' + state.selected.category + '.png';
        state.selected.orb.animate({ opacity:1.0, duration:250 });
    }

    $.thisWeekContainer.opacity = 0.0;

    if (_selectedCategory.direction === 0) {
        $.percentLbl.text = '--';
    } else if (_selectedCategory.lastWeek < _selectedCategory.thisWeek) {
        $.percentLbl.text = (((_selectedCategory.thisWeek - _selectedCategory.lastWeek)) / _selectedCategory.lastWeek) * 100;
    } else if (_selectedCategory.lastWeek > _selectedCategory.thisWeek) {
        if (_selectedCategory.thisWeek !== 0) {
            $.percentLbl.text = (((_selectedCategory.lastWeek - _selectedCategory.thisWeek)) / _selectedCategory.thisWeek) * -100;
        } else {
            $.percentLbl.text = -100;
        }
    }
    
    switch (state.selected.category) {
        case 'acquisition':
            $.thisWeekTotalLbl.text = lib.number.withCommas(_selectedCategory.thisWeek) || '--';
            $.primaryMetricContainer.backgroundImage = 'detail/primary-metric-acquisition-bg.png';
            break;
        case 'engagement':
            $.thisWeekTotalLbl.text = lib.number.msecToTime(_selectedCategory.thisWeek) || '--';
            $.primaryMetricContainer.backgroundImage = 'detail/primary-metric-engagement-bg.png';
            break;
        case 'quality':
            $.thisWeekTotalLbl.text = (_selectedCategory.thisWeek === null) ? '--' : lib.number.msecToTime(_selectedCategory.thisWeek);
            $.primaryMetricContainer.backgroundImage = 'detail/primary-metric-quality-bg.png';
            break;
        case 'retention':
            $.thisWeekTotalLbl.text = (_selectedCategory.thisWeek === null) ? '--' : (_selectedCategory.thisWeek % 1 === 0) ? _selectedCategory.thisWeek + '%' : _selectedCategory.thisWeek.toFixed(2) + '%';
            $.primaryMetricContainer.backgroundImage = 'detail/primary-metric-retention-bg.png';
            break;
        default:
            $.thisWeekTotalLbl.text = lib.number.withCommas(_selectedCategory.thisWeek) || '--';
            break;
    }

    // pre/append change and % symbols
    if ($.percentLbl.text !== '--') {
        if (($.percentLbl.text | 0) === 0) {
            $.percentLbl.text = '--';
        } else {
            $.percentLbl.text = (_selectedCategory.direction === -1) ? ($.percentLbl.text | 0) + '%' : '+' + ($.percentLbl.text | 0) + '%';
        }
    }

    _barWidth = (_selectedCategory.thisWeek / (_selectedCategory.thisWeek + _selectedCategory.lastWeek)) * $.barContainer.width;
    
    $.primaryMetricLbl.text = _selectedCategory.metrics[_selectedCategory.defaultMetric].name;

    $.thisWeekBarView.backgroundColor = _color;
    $.percentLbl.color = _color;

    $.thisWeekBarView.animate({ width:((_barWidth | 0) === 0) ? 1 : (_barWidth | 0), opacity:(_selectedCategory.direction === 0 || _selectedCategory.thisWeek === 0) ? 0.0 : 1.0, duration:250 });

    $.thisWeekContainer.animate({ opacity:1.0, duration:250 });
}

function processOrbClick(e) {
    var _color = null,
        _selectedCategory = null;

    if (e.source.category !== state.selected.category || !state.init) {
        state.selected.orb.backgroundImage = 'detail/metric-category-inactive-icon-' + state.selected.category + '.png';
        state.selected.orb = $[e.source.id.replace('Container', 'View')];
        state.selected.category = e.source.category;

        updateUIWithData(false);

        if (!e.source.fromUpdate) {
            state.callbacks.notifyDetail({ categoryMini:true, category:state.selected.category });
        }
    }
}

function update(category) {
    processOrbClick({
        source: {
            fromUpdate: true,
            category: category,
            id: 'orb' + (category.charAt(0).toUpperCase() + category.slice(1)) + 'Container'
        }
    });
}

function refreshUI() {
    globalData = Alloy.Globals.insights.data;

    updateUIWithData(true);
}

function init(config) {
    var _config  = config || {},
        _refresh = false;

    globalData = Alloy.Globals.insights.data;

    state.callbacks.notifyDetail = _config.callbacks.notifyDetail;

    state.selected.orb = $.orbAcquisitionView;
    state.selected.category = 'acquisition';

    $.parentView.addEventListener('postlayout', function(e) {
        if (!_refresh) {
            _refresh = true;
            
            updateUI();

            // #TODO: MESSY
            processOrbClick({
                source: {
                    fromUpdate: true,
                    category: state.selected.category,
                    id: 'orb' + (state.selected.category.charAt(0).toUpperCase() + state.selected.category.slice(1)) + 'Container'
                }
            });

            state.init = true;
        }
    });

    $.orbAcquisitionContainer.addEventListener('touchstart', focusOrb);
    $.orbAcquisitionContainer.addEventListener('touchend', blurOrb);
    $.orbAcquisitionContainer.addEventListener('click', processOrbClick);
    
    $.orbEngagementContainer.addEventListener('touchstart', focusOrb);
    $.orbEngagementContainer.addEventListener('touchend', blurOrb);
    $.orbEngagementContainer.addEventListener('click', processOrbClick);
    
    $.orbQualityContainer.addEventListener('touchstart', focusOrb);
    $.orbQualityContainer.addEventListener('touchend', blurOrb);
    $.orbQualityContainer.addEventListener('click', processOrbClick);
    
    $.orbRetentionContainer.addEventListener('touchstart', focusOrb);
    $.orbRetentionContainer.addEventListener('touchend', blurOrb);
    $.orbRetentionContainer.addEventListener('touchend', processOrbClick);

    $.weekCompareContainer.addEventListener('click', function() {
        state.callbacks.notifyDetail({ hide:true });
    });
    
    $.thisWeekContainer.addEventListener('click', function() {
        state.callbacks.notifyDetail({ hide:true });
    });  
}

exports._init = init,
exports._getParentView = getParentView,
exports._refreshUI = refreshUI,
exports._update = update;