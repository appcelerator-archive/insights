var guide = {
    // will probably want to consider moving this to Node.ACS server...
    content: {
        welcome: {
            title: [ 'Welcome to Insights' ],
            image: 'guide/temp-image-layout.png',
            copy: 'guide/copy-welcome.png',
            displayRemaining: false,
        },
        standard: [
            [
                {
                    title: [ 'Overview' ],
                    image: 'guide/art-overview-01.png',
                    copy: 'guide/copy-overview-01.png',
                    displayRemaining: false,
                }
            ],
            [
                {
                    title: [ 'Navigation' ],
                    image: 'guide/art-nav-01.png',
                    copy: 'guide/copy-nav-01.png',
                    displayRemaining: true,
                },
                {
                    title: [ 'Navigation' ],
                    image: 'guide/art-nav-02.png',
                    copy: 'guide/copy-nav-02.png',
                    displayRemaining: true,
                },
                {
                    title: [ 'Navigation' ],
                    image: 'guide/art-nav-03.png',
                    copy: 'guide/copy-nav-03.png',
                    displayRemaining: true,
                },
                {
                    title: [ 'Navigation' ],
                    image: 'guide/art-nav-04.png',
                    copy: 'guide/copy-nav-04.png',
                    displayRemaining: true,
                },
                {
                    title: [ 'Navigation' ],
                    image: 'guide/art-nav-05.png',
                    copy: 'guide/copy-nav-05.png',
                    displayRemaining: true,
                },
                {
                    title: [ 'Navigation' ],
                    image: 'guide/art-nav-06.png',
                    copy: 'guide/copy-nav-06.png',
                    displayRemaining: true,
                }
            ],
            [
                {
                    title: [ 'Home' ],
                    image: 'guide/art-home-01.png',
                    copy: 'guide/copy-home-01.png',
                    displayRemaining: true,
                },
                {
                    title: [ 'Home' ],
                    image: 'guide/art-home-02.png',
                    copy: 'guide/copy-home-02.png',
                    displayRemaining: true,
                }
            ],
            [
                {
                    title: [ 'Acquisition' ],
                    image: 'guide/art-acquisition-01.png',
                    copy: 'guide/copy-acquisition-01.png',
                    displayRemaining: true,
                },
                {
                    title: [ 'Acquisition' ],
                    image: 'guide/art-acquisition-02.png',
                    copy: 'guide/copy-acquisition-02.png',
                    displayRemaining: true,
                }
            ],
            [
                {
                    title: [ 'Engagement' ],
                    image: 'guide/art-engagement-01.png',
                    copy: 'guide/copy-engagement-01.png',
                    displayRemaining: true,
                },
                {
                    title: [ 'Engagement' ],
                    image: 'guide/art-engagement-02.png',
                    copy: 'guide/copy-engagement-02.png',
                    displayRemaining: true,
                }
            ],
            [
                {
                    title: [ 'Retention' ],
                    image: 'guide/art-retention-01.png',
                    copy: 'guide/copy-retention-01.png',
                    displayRemaining: true,
                },
                {
                    title: [ 'Retention' ],
                    image: 'guide/art-retention-02.png',
                    copy: 'guide/copy-retention-02.png',
                    displayRemaining: true,
                }
            ],
            [
                {
                    title: [ 'Quality' ],
                    image: 'guide/art-quality-01.png',
                    copy: 'guide/copy-quality-01.png',
                    displayRemaining: true,
                },
                {
                    title: [ 'Quality' ],
                    image: 'guide/art-quality-02.png',
                    copy: 'guide/copy-quality-02.png',
                    displayRemaining: true,
                },
                {
                    title: [ 'Quality' ],
                    image: 'guide/art-quality-03.png',
                    copy: 'guide/copy-quality-03.png',
                    displayRemaining: true,
                }
            ]
        ]
    }
};

var state = {
    seenPointy: false,
    browser: null,
    animated: true,
    showWelcome: true,
    finishedWelcomeCard: true,
    startingCardIndex: 0,
    callbacks: {
        onHideRequest: null
    },
    transitioning: false,
    currentPage: 0,
    scrollingStarted: false,
    currentCard: 0,
    currentSection: 0,
    sectionContainerLeft: null,
    sectionContainerRight: null,
    pinching: false,
    shouldClose: false,
    sectionIndexes: [],
    sectionRows: [],
    sectionRowSpacers: [],
    cards: []
};

function getParentView() {
    return $.parentContainer;
}

function animateOpacityIn(row) {
    setTimeout(function() {
        row.controllers.hideShade();
        row.parentView.animate({ opacity:1.0, duration:250 });
    }, 250);
}

function animateInLeft(row) {
    var _transformLeft     = Ti.UI.create3DMatrix();
        
    _transformLeft.m34 = -1.0/-65;

    animateOpacityIn(row);
    row.parentView.animate({ transform:_transformLeft, curve:Ti.UI.ANIMATION_CURVE_EASE_IN_OUT, duration:500 });
}

function showPointy() {
    if (!state.seenPointy) {
        state.seenPointy = true;

        $.parentContainer.touchEnabled = false;

        $.pointy.animate({ opacity:1.0, transform:Ti.UI.create2DMatrix({ scale:0.8}), duration:150 }, function() {
            $.pointy.animate({ transform:Ti.UI.create2DMatrix({ scale:1.0 }), duration:100 }, function() {
                $.pointy.animate({ left:100, duration:250 }, function() {
                    $.pointy.animate({ left:820, duration:250 }, function() {
                        $.pointy.animate({ left:807, duration:100 }, function() {
                            $.pointy.animate({ opacity:0.0, transform:Ti.UI.create2DMatrix({ scale:1.2 }), duration:150 }, function() {
                                $.parentContainer.touchEnabled = true;
                            });
                        });
                    });
                })
            });
        });
    }
}

function animateOutLeft(row, onComplete) {
    var _transformLeft     = Ti.UI.create3DMatrix(),
        _transformLeft     = _transformLeft.rotate(-45, 0, 1, 0);
        
    _transformLeft.m34 = 1.0/45;

    row.controllers.showShade();
    row.parentView.animate({ opacity:0.0, duration:250 });
    row.parentView.animate({ transform:_transformLeft, curve:Ti.UI.ANIMATION_CURVE_EASE_IN_OUT, duration:500 }, function() {
        if (onComplete) { onComplete(); }
    });
}

function animateInRight(row) {
    var _transformRight     = Ti.UI.create3DMatrix();
        
    _transformRight.m34 = -1.0/65;

    animateOpacityIn(row);
    row.parentView.animate({ transform:_transformRight, curve:Ti.UI.ANIMATION_CURVE_EASE_IN_OUT, duration:500 });
}

function animateOutRight(row, onComplete) {
    var _transformRight     = Ti.UI.create3DMatrix(),
        _transformRight     = _transformRight.rotate(-45, 0, 1, 0);
        
    _transformRight.m34 = -1.0/45;

    row.controllers.showShade();
    row.parentView.animate({ opacity:0.0, duration:250 });
    row.parentView.animate({ transform:_transformRight, curve:Ti.UI.ANIMATION_CURVE_EASE_IN_OUT, duration:500 }, function() {
        if (onComplete) { onComplete(); }
    });
}

function openMenu() {
    var _transformLeft = null,
        _transformRight = null;

    if (!state.transitioning) {
        state.transitioning = true;

        positionSectionRows();
        $.menuContainer.opacity = 1.0;

        state.sectionRowContainerLeft.animate({ transform:Ti.UI.create2DMatrix({ scale:1.0 }), duration:500 });
        state.sectionRowContainerRight.animate({ transform:Ti.UI.create2DMatrix({ scale:1.0 }), duration:500 });

        for (var sri = 0, srl = state.sectionRows.length; sri < srl; sri++) {
            if (state.sectionRows[sri].state.left) {
                animateInLeft(state.sectionRows[sri]);
            } else {
                animateInRight(state.sectionRows[sri]);
            }
        }

        $.menuIconContainer.opacity = 0.0;
        $.menuExpandedContainer.opacity = 1.0;

        $.menuTopBottomIcon.animate({ left:5, duration:100 });
        $.menuMiddleIcon.animate({ right:5, duration:100 });

        setTimeout(function() {
            state.transitioning = false;
        }, 550);
    }
}

function finishMenuClose() {
    $.menuContainer.opacity = 0.0;

    clearSectionRowSpacers();
    clearSectionRows();

    $.menuContainer.remove(state.sectionRowContainerLeft);
    $.menuContainer.remove(state.sectionRowContainerRight);

    state.sectionRowContainerLeft  = null,
    state.sectionRowContainerRight = null;
}

function closeMenu(e) {
    $.menuTopBottomIcon.animate({ left:10, duration:100 });
    $.menuMiddleIcon.animate({ right:10, duration:100 }, function() {
        $.menuIconContainer.opacity = 1.0;
        $.menuExpandedContainer.opacity = 0.0;
    });

    state.sectionRowContainerLeft.animate({ transform:Ti.UI.create2DMatrix({ scale:0.6 }), duration:500 });
    state.sectionRowContainerRight.animate({ transform:Ti.UI.create2DMatrix({ scale:0.6 }), duration:500 });

    for (var sri = 0, srl = state.sectionRows.length; sri < srl; sri++) {
        if (state.sectionRows[sri].state.left) {
            if (sri === srl - 1) {
                animateOutLeft(state.sectionRows[sri], finishMenuClose);
            } else {
                animateOutLeft(state.sectionRows[sri]);
            }
            
        } else {
            if (sri === srl - 1) {
                animateOutRight(state.sectionRows[sri], finishMenuClose);
            } else {
                animateOutRight(state.sectionRows[sri]);
            }
        }
    }
}

function clearSectionRowSpacers() {
    for (var si = 0, sl = state.sectionRowSpacers.length; si < sl; si++) {
        state.sectionRowSpacers[si].parent.remove(state.sectionRowSpacers[si].view);
        
        state.sectionRowSpacers[si].parent = null,
        state.sectionRowSpacers[si].view   = null;
    }

    state.sectionRowSpacers.length = 0;
    state.sectionRowSpacers = [];
}

function clearSectionRows() {
    for (var sri = 0, srl = state.sectionRows.length; sri < srl; sri++) {
        state.sectionRows[sri].controllers.removeFromParent();
    }
}

// #TODO: there is quite a bit here that can be consolidated, as not all updates are dependant
// on position...
function positionSectionRows() {
    var _transformLeft  = null,
        _transformRight = null;

    state.sectionRowContainerLeft  = Ti.UI.createView({ anchorPoint:{ x:1, y:0.5 }, width:334, left:0, height:Ti.UI.SIZE, layout:'vertical', transform:Ti.UI.create2DMatrix({ scale:0.6 }) }),
    state.sectionRowContainerRight = Ti.UI.createView({ anchorPoint:{ x:0, y:0.5 }, width:334, right:0, height:Ti.UI.SIZE, layout:'vertical', transform:Ti.UI.create2DMatrix({ scale:0.6 }) });

    for (var sri = 0, srl = state.sectionRows.length; sri < srl; sri++) {
        if (state.currentPage >= state.sectionIndexes[sri] && state.finishedWelcomeCard) {
            if (state.sectionIndexes[sri + 1]) {
                if (state.currentPage >= state.sectionIndexes[sri] && state.currentPage < state.sectionIndexes[sri + 1]) {
                    state.sectionRows[sri].controllers.setSelectedText();
                } else {
                    state.sectionRows[sri].controllers.setNonSelectedText();
                }
            } else if (state.currentPage >= state.sectionIndexes[sri] && sri === srl - 1) {
                state.sectionRows[sri].controllers.setSelectedText();
            } else {
                state.sectionRows[sri].controllers.setNonSelectedText();
            }

            state.sectionRows[sri].controllers.setShadeDirection(false);
            state.sectionRows[sri].views.shadeBg.opacity = 1.0;
            state.sectionRows[sri].parentView.opacity = 0.0;

            state.sectionRows[sri].state.left = true;
            state.sectionRows[sri].state.right = false;

            state.sectionRows[sri].parentView.anchorPoint = {x:1, y:0.5};

            _transformLeft = Ti.UI.create3DMatrix();
            _transformLeft = _transformLeft.rotate(-60, 0, 1, 0);
            _transformLeft.m34 = 1.0/45;

            state.sectionRows[sri].parentView.transform = _transformLeft;
            state.sectionRows[sri].controllers.addToParent(state.sectionRowContainerLeft);
            
            state.sectionRowSpacers.push({
                parent: state.sectionRowContainerLeft,
                view: Ti.UI.createView({ height:10 })
            });

            state.sectionRowContainerLeft.add(state.sectionRowSpacers[sri].view);
        } else {
            state.sectionRows[sri].controllers.setNonSelectedText();

            state.sectionRows[sri].controllers.setShadeDirection(true);
            state.sectionRows[sri].views.shadeBg.opacity = 1.0;
            state.sectionRows[sri].parentView.opacity = 0.0;

            state.sectionRows[sri].state.left = false;
            state.sectionRows[sri].state.right = true;

            state.sectionRows[sri].parentView.anchorPoint = {x:0, y:0.5};

            _transformRight = Ti.UI.create3DMatrix();
            _transformRight = _transformRight.rotate(-60, 0, 1, 0);
            _transformRight.m34 = -1.0/45;
            
            state.sectionRows[sri].parentView.transform = _transformRight;
            state.sectionRows[sri].controllers.addToParent(state.sectionRowContainerRight);

            state.sectionRowSpacers.push({
                parent: state.sectionRowContainerRight,
                view: Ti.UI.createView({ height:10 })
            });

            state.sectionRowContainerRight.add(state.sectionRowSpacers[sri].view);
        }
    }

    $.menuContainer.add(state.sectionRowContainerLeft);
    $.menuContainer.add(state.sectionRowContainerRight);
}

function createSectionRow(title, index) {
    var _sectionRow = {};

    _sectionRow.state = {
        index: index,
        selected: false,
        currentParent: null,
        left: false,
        right: false
    };

    _sectionRow.views = {
        shadeBg: Ti.UI.createView({ touchEnabled:false, width:265, height:50 })
    };

    _sectionRow.controllers = {
        removeFromParent: function() {
            if (_sectionRow.state.currentParent) {
                if (_sectionRow.state.selected) {
                    _sectionRow.state.selected = false;
                    _bg.opacity = 1.0;
                    _selectedBg.opacity = 0.0;
                    _titleLbl.color = '#333';
                }

                _sectionRow.state.currentParent.remove(_sectionRow.parentView);
                _sectionRow.state.currentParent = null;
            }
        },
        setShadeDirection: function(right) {
            _sectionRow.views.shadeBg.backgroundImage = (right) ? 'guide/bg-shade-right.png' : 'guide/bg-shade-left.png'
        },
        setSelectedText: function() {
            if (_titleLbl.text !== ('[ ' + _title + ' ]')) {
                _titleLbl.text = '[ ' + _title + ' ]';
            }

            _titleLbl.color = '#c41230';
        },
        setNonSelectedText: function() {
            if (_titleLbl.text !== _title) {
                _titleLbl.text = _title;
            }

            _titleLbl.color = '#333';
        },
        hideShade: function() {
            _sectionRow.views.shadeBg.animate({ opacity:0.0, duration:250 });
        },
        showShade: function() {
            _sectionRow.views.shadeBg.animate({ opacity:1.0, duration:250 });
        },
        addToParent: function(parent) {
            _sectionRow.state.currentParent = parent;
            _sectionRow.state.currentParent.add(_sectionRow.parentView);
        },
        destroy: function() {
            _sectionRow.parentView          = null,
            _sectionRow.views.shadeBg       = null,
            _sectionRow.state.currentParent = null,
            _sectionRow.state               = null,
            _title                          = null,
            _titleLbl                       = null,
            _bg                             = null,
            _selectedBg                     = null,
            _setionRow                      = null;
        }
    };

    var _title = title;

    var _titleLbl   = Ti.UI.createLabel({ color:'#333', text:_title, touchEnabled:false, font:{ fontFamily: "TitilliumText22L-1wt", fontSize:18 }, textAlign:'center', width:Ti.UI.FILL, height:Ti.UI.FILL }),
        _bg         = Ti.UI.createView({ touchEnabled:false, width:265, height:50, backgroundImage:'guide/bg.png', backgroundLeftCap:5, backgroundTopCap:5 }),
        _selectedBg = Ti.UI.createView({ opacity:0.0, touchEnabled:false, width:265, height:50, backgroundImage:'guide/bg-touch.png', backgroundLeftCap:5, backgroundTopCap:5 });

    _sectionRow.parentView = Ti.UI.createView({ bubbleParent:false, width:265, height:50 });

    _sectionRow.parentView.add(_bg);
    _sectionRow.parentView.add(_selectedBg);
    _sectionRow.parentView.add(_titleLbl);
    _sectionRow.parentView.add(_sectionRow.views.shadeBg);

    _sectionRow.parentView.addEventListener('touchstart', function() {
        _bg.backgroundImage = 'guide/bg-tap.png';
    });

    _sectionRow.parentView.addEventListener('touchend', function() {
        _bg.backgroundImage = 'guide/bg.png';
    });

    _sectionRow.parentView.addEventListener('swipe', function(e) {
        processTransition(e);
        closeMenu(e);
    });

    _sectionRow.parentView.addEventListener('click', function(e) {
        if (!state.transitioning) {
            state.transitioning = true;
            _sectionRow.state.selected = true;
            
            _titleLbl.color = '#f2f2f2';
            _bg.animate({ opacity:0.0, duration:100 });
            
            _selectedBg.animate({ opacity:1.0, duration:100 }, function() {
                animateToCard(_sectionRow.state.index);
                closeMenu(e);
            });
        }
    });

    return _sectionRow;
}

// isWelcome.. we will render the card a little differently...
// #TODO: rename copy to art...
function createCard(config, current, total, index, isWelcome) {
    var _card   = {},
        _config = config || {};

    var _content = null,
        _copy    = null;
    
    if (isWelcome) {
        _copy = Ti.UI.createView({ backgroundImage:_config.copy, width:295, height:445, top:20 });
    } else {
        _content = Ti.UI.createView({ backgroundImage:_config.image, width:295, height:285, top:20 }),
        _copy    = Ti.UI.createView({ backgroundImage:_config.copy, width:295, height:140, bottom:20 });
    }

    _card.state = {
        index: index,
        title: null,
        visible: false
    };

    _card.controllers = {
        destroy: function() {
            _card.parentView = null,
            _card.state      = null,
            _content         = null,
            _copy            = null,
            _card            = null;
        }
    };

    if (_config.displayRemaining) {
        _card.state.title = (total === 0) ? _config.title[0] : _config.title[0] + ' - ' + current + ' of ' + total; // in the future, we might show subs
    } else {
        _card.state.title = _config.title[0];
    }

    _card.parentView = Ti.UI.createView({ opacity:0.0, width:335, height:480, top:0 });

    if (isWelcome) {
        _card.parentView.add(_copy);
    } else {
        _card.parentView.add(_content);
        _card.parentView.add(_copy);
    }

    return _card;
}

// content.welcome obj
// content.standard arr or arr of obj
// title: [ 'Navigation' ],
// image: 'guide/temp-image-layout.png',
// copy: 'guide/temp-copy-layout.png',
// displayRemaining: true,

function generateUI() {
    var _card      = null,
        _fakeViews = [];

    var _renderedFirstCard = false;

    var _counter = 0;

    if (state.showWelcome) {
        _card = createCard(guide.content.welcome, 1, 0, null, true);

        _card.state.visible = true;
        _card.parentView.opacity = 1.0;
        
        state.cards.push(_card);
        _fakeViews.push(Ti.UI.createView({ width:Ti.UI.FILL, height:Ti.UI.FILL }));

        $.cardsContainer.add(_card.parentView);

        _renderedFirstCard = true;
    }

    for (var ci = 0, cl = guide.content.standard.length; ci < cl; ci++) {
        var _sl = guide.content.standard[ci].length;

        if (_sl > 0) {
            for (var si = 0, sl = _sl; si < sl; si++) {
                _card = createCard(guide.content.standard[ci][si], si + 1, sl, _counter);

                if (!_renderedFirstCard) {
                    _renderedFirstCard = true;
                    _card.state.visible = true;
                    _card.parentView.opacity = 1.0;
                }

                if (si === 0) {
                    state.sectionIndexes.push(_counter);
                    state.sectionRows.push(createSectionRow(guide.content.standard[ci][si].title[0], _counter, $.sectionRowContainerLeft));
                }

                state.cards.push(_card);
                _fakeViews.push(Ti.UI.createView({ width:Ti.UI.FILL, height:Ti.UI.FILL }));

                $.cardsContainer.add(_card.parentView);

                _counter ++;
            }
        }
    }

    $.scrollable.views = _fakeViews;
}

function setCurrentSection() {
    var _cardIndex = state.sectionIndexes.indexOf(state.currentPage);

    if (_cardIndex !== -1) {
        Ti.API.info('Setting section...');
        state.currentSection = _cardIndex;
    }
}

function removeWelcomeCard() {
    state.cards.splice(0, 1);
    state.finishedWelcomeCard = true;
}

function processTransition(e) {
    var _direction = null;

    state.seenPointy = true; // don't show pointy if user already knows...

    if (!state.transitioning) {
        state.transitioning = true;

        _direction = e.direction;

        if (_direction === 'left') {
            if (state.currentPage < state.cards.length - 1) {
                $.cardTitleLbl.opacity = 0.0;
                $.cardTitleLbl.text = state.cards[state.currentPage + 1].state.title;
                
                state.cards[state.currentPage].parentView.transform = Ti.UI.create2DMatrix({ scale:1.0 });
                state.cards[state.currentPage].parentView.animate({ opacity:0.0, transform:Ti.UI.create2DMatrix({ scale:0.8 }), duration:100 }, function() {
                    $.cardTitleLbl.animate({ opacity:1.0, duration:500 });

                    state.cards[state.currentPage + 1].parentView.transform = Ti.UI.create2DMatrix({ scale:1.1 });
                    state.cards[state.currentPage + 1].parentView.animate({ opacity:1.0, transform:Ti.UI.create2DMatrix({ scale:1.0 }), duration:500 }, function() {
                        if (!state.finishedWelcomeCard) {
                            removeWelcomeCard();
                            state.currentPage = 0;
                            setCurrentSection();
                        } else {
                            state.currentPage ++;
                            setCurrentSection();
                        }

                        state.transitioning = false;
                    });
                });
            } else {
                state.cards[state.currentPage].parentView.transform = Ti.UI.create2DMatrix({ scale:1.0 });
                state.cards[state.currentPage].parentView.animate({ transform:Ti.UI.create2DMatrix({ scale:0.95 }), curve:Ti.UI.ANIMATION_CURVE_EASE_IN, duration:100 }, function() {
                    state.cards[state.currentPage].parentView.animate({ transform:Ti.UI.create2DMatrix({ scale:1.0 }), duration:250 }, function() {
                        state.transitioning = false;
                    });
                });
            }
        } else if (_direction = 'right') {
            if (state.currentPage > 0) {
                $.cardTitleLbl.opacity = 0.0;
                $.cardTitleLbl.text = state.cards[state.currentPage - 1].state.title;

                state.cards[state.currentPage].parentView.transform = Ti.UI.create2DMatrix({ scale:1.0 });
                state.cards[state.currentPage].parentView.animate({ opacity:0.0, transform:Ti.UI.create2DMatrix({ scale:1.1 }), duration:100 }, function() {
                    $.cardTitleLbl.animate({ opacity:1.0, duration:500 });

                    state.cards[state.currentPage - 1].parentView.transform = Ti.UI.create2DMatrix({ scale:0.8 });
                    state.cards[state.currentPage - 1].parentView.animate({ opacity:1.0, transform:Ti.UI.create2DMatrix({ scale:1.0 }), duration:500 }, function() {
                        state.currentPage --;
                        setCurrentSection();
                        state.transitioning = false;
                    });
                });
            } else {
                state.cards[state.currentPage].parentView.transform = Ti.UI.create2DMatrix({ scale:1.0 });
                state.cards[state.currentPage].parentView.animate({ transform:Ti.UI.create2DMatrix({ scale:1.05 }), curve:Ti.UI.ANIMATION_CURVE_EASE_IN, duration:100 }, function() {
                    state.cards[state.currentPage].parentView.animate({ transform:Ti.UI.create2DMatrix({ scale:1.0 }), duration:250 }, function() {
                        state.transitioning = false;
                    });
                });
            }
        }
    }
}

function processCloseRequest() {
    // destroy is run after the guide is hidden...
    state.callbacks.onHideRequest();
}

function show(onShow) {
    generateUI();

    if (state.animated) {
        $.parentContainer.animate({ opacity:1.0, transform:Ti.UI.create2DMatrix({ scale:1.0 }), duration:250 }, function() {        
            if (onShow) { onShow(); }

            $.parentContainer.touchEnabled = true;
        });
    } else {
        $.parentContainer.opacity = 1.0;
        $.parentContainer.transform = Ti.UI.create2DMatrix({ scale:1.0 });
        if (onShow) { onShow(); }
        $.parentContainer.touchEnabled = true;
    }
}

function hide(onHide) {
    $.parentContainer.touchEnabled = false;

    $.parentContainer.animate({ opacity:0.0, transform:Ti.UI.create2DMatrix({ scale:1.1 }), duration:250 }, function() {
        if (onHide) { onHide(); }
        if (state.callbacks.onClose) { state.callbacks.onClose(); }

        destroy();
    });
}

function animateToCard(index) {
    var _index = index;

    if (state.currentPage !== _index || !state.finishedWelcomeCard) {
        state.transitioning = true;
        
        // go forward
        if (state.currentPage < _index && state.currentPage !== state.cards.length - 1 || !state.finishedWelcomeCard) {
            if (!state.finishedWelcomeCard) { 
                _index ++;
            }

            $.cardTitleLbl.opacity = 0.0;
            $.cardTitleLbl.text = state.cards[_index].state.title;
            
            state.cards[state.currentPage].parentView.transform = Ti.UI.create2DMatrix({ scale:1.0 });
            state.cards[state.currentPage].parentView.animate({ opacity:0.0, transform:Ti.UI.create2DMatrix({ scale:0.8 }), duration:100 }, function() {
                $.cardTitleLbl.animate({ opacity:1.0, duration:500 });

                state.cards[_index].parentView.transform = Ti.UI.create2DMatrix({ scale:1.1 });
                state.cards[_index].parentView.animate({ opacity:1.0, transform:Ti.UI.create2DMatrix({ scale:1.0 }), duration:500 }, function() {
                    if (!state.finishedWelcomeCard) {
                        removeWelcomeCard();
                        state.currentPage = _index - 1;
                        setCurrentSection();
                    } else {
                        state.currentPage = _index;
                        setCurrentSection();
                    }

                    showPointy();

                    state.transitioning = false;
                });
            });
        // go backward
        } else if (state.currentPage > _index && state.currentPage !== 0) {
            $.cardTitleLbl.opacity = 0.0;
            $.cardTitleLbl.text = state.cards[_index].state.title;

            state.cards[state.currentPage].parentView.transform = Ti.UI.create2DMatrix({ scale:1.0 });
            state.cards[state.currentPage].parentView.animate({ opacity:0.0, transform:Ti.UI.create2DMatrix({ scale:1.1 }), duration:100 }, function() {
                $.cardTitleLbl.animate({ opacity:1.0, duration:500 });

                state.cards[_index].parentView.transform = Ti.UI.create2DMatrix({ scale:0.8 });
                state.cards[_index].parentView.animate({ opacity:1.0, transform:Ti.UI.create2DMatrix({ scale:1.0 }), duration:500 }, function() {
                    state.transitioning = false;
                    state.currentPage = _index;
                    setCurrentSection();

                    showPointy();
                });
            });
        } else {
            state.transitioning = false;
            state.currentPage = _index;
            setCurrentSection();

            showPointy();
        }
    } else {
        state.transitioning = false;
        showPointy();
    }
}

function openOldMenu(e) {
    var _menu = Ti.UI.iPad.createPopover({
        width: 313,
        height: 500,
        navBarHidden: true,
        // #BUG: this doesn't seem to work...
        tintColor: "#c41230"
    });

    var _table   = Ti.UI.createTableView(),
        _data    = [],
        _indexes = [];

    var _gotoIndex = -1;

    var _counter = 0;

    for (var ci = 0, cl = guide.content.standard.length; ci < cl; ci++) {
        var _sl = guide.content.standard[ci].length;

        if (_sl > 0) {
            for (var si = 0, sl = _sl; si < sl; si++) {
                _indexes.push([ci, si]);

                // welcome card will not have an index...
                if (state.finishedWelcomeCard && state.cards[_counter].state.index === state.currentPage) {
                    _data.push(Ti.UI.createTableViewRow({ title:'Selected: ' + guide.content.standard[ci][si].title + ' - ' + (si + 1) }));
                } else {
                    _data.push(Ti.UI.createTableViewRow({ title:guide.content.standard[ci][si].title + ' - ' + (si + 1) }));
                }

                _counter ++;
            }
        }
    }

    _table.data = _data;

    _menu.add(_table);

    _table.addEventListener('click', function(e) {
        _menu.hide();
        _gotoIndex = e.index;
    });

    _menu.addEventListener('hide', function() {
        $.menuBtnContainer.animate({ transform:Ti.UI.create2DMatrix({ rotate:0 }), duration:100 });

        if (_gotoIndex !== -1) {
            animateToCard(_gotoIndex);
        }
    });

    $.menuBtnContainer.animate({ transform:Ti.UI.create2DMatrix({ rotate:180 }), duration:100 });

    _menu.show({ view:$.menuPopoverHandler });
}

function focusCloseBtn() {
    $.closeBtn.animate({ opacity:0.0, duration:100 });
    $.closeBtnTouch.animate({ opacity:1.0, duration:100 });
}

function blurCloseBtn() {
    $.closeBtn.animate({ opacity:1.0, duration:100 });
    $.closeBtnTouch.animate({ opacity:0.0, duration:100 });
}

function focusMenuBtn() {
    $.menuBtn.animate({ opacity:0.0, duration:100 });
    $.menuBtnTouch.animate({ opacity:1.0, duration:100 });
}

function blurMenuBtn() {
    $.menuBtn.animate({ opacity:1.0, duration:100 });
    $.menuBtnTouch.animate({ opacity:0.0, duration:100 });
}

function processPinch(e) {
    if (e.scale < 0.8 && !state.transitioning) {
        state.transitioning = true;

        $.contentContainer.animate({ transform:Ti.UI.create2DMatrix({ scale:0.8 }), duration:100 }, function() {
            processCloseRequest();
        });
    }

    // if (!state.pinching) {
    //     state.pinching = true;
    // }

    // if (e.scale < 1 && e.scale > 0.5 && state.pinching) {
    //     $.contentContainer.transform = Ti.UI.create2DMatrix({ scale:e.scale.toFixed(2) });
    //     state.shouldClose = (e.scale.toFixed(2) < 0.70) ? true : false;
    // }
}

function processPinchEnd(e) {
    // if (state.pinching) {
    //     if (state.shouldClose) {
    //         state.shouldClode = false;
    //         state.pinching = false;

    //         processCloseRequest();
    //     } else {
    //         state.shouldClose = false;
    //         state.pinching = false;

    //         $.contentContainer.animate({ transform:Ti.UI.create2DMatrix({ scale:1.0 }), duration:250 }, function() {
    //             state.transitioning = false;
    //         });                
    //     }
    // } else {
    //     state.shouldClode = false;
    //     state.transitioning = false;
    // }
}

function destroy(onDestroy) {
    for (var ci = 0, cl = state.cards.length; ci < cl; ci++) {
        state.cards[ci].controllers.destroy();
        state.cards[ci] = null;
    }

    for (var sri = 0, srl = state.sectionRows.length; sri < srl; sri++) {
        state.sectionRows[sri].controllers.destroy();
        state.sectionRows[sri] = null;
    }

    for (var srsi = 0, srsl = state.sectionRowSpacers.length; srsi < srsl; srsi++) {
        state.sectionRowSpacers[srsi].view = null;
    }

    state.sectionIndexes.length    = 0,
    state.cards.length             = 0,
    state.sectionRows.length       = 0,
    state.sectionRowSpacers.length = 0,

    guide = null;
    state = null;

    Ti.API.info('Guide has been destroyed...');
}

function init(config) {
    var _config = config || {};

    state.callbacks.onHideRequest = _config.callbacks.onHideRequest || null,
    state.callbacks.onClose       = _config.callbacks.onClose || null,
    state.animated                = _config.animated || true,
    state.showWelcome             = _config.showWelcome || false,
    state.browser                 = _config.browser;

    $.parentContainer.transform = Ti.UI.create2DMatrix({ scale:1.1 });

    $.closeBtnContainer.addEventListener('click', processCloseRequest);
    $.closeBtnContainer.addEventListener('touchstart', focusCloseBtn);
    $.closeBtnContainer.addEventListener('touchend', blurCloseBtn);

    $.menuBtnContainer.addEventListener('click', openMenu);
    $.menuBtnContainer.addEventListener('touchstart', focusMenuBtn);
    $.menuBtnContainer.addEventListener('touchend', blurMenuBtn);

    $.menuContainer.addEventListener('click', closeMenu);
    $.menuContainer.addEventListener('swipe', function(e) {
        processTransition(e);
        closeMenu(e);
    });

    $.scrollable.addEventListener('swipe', processTransition);
    $.scrollable.addEventListener('touchend', processPinchEnd);
    $.scrollable.addEventListener('pinch', processPinch);
    $.scrollable.addEventListener('click', openMenu);
    
    $.contentContainer.addEventListener('click', function(e) {
        if (state.finishedWelcomeCard) {
            openMenu(e);
        } else {
            // #REJECT: APPLE
            // state.browser._show('The Appcelerator Platform', 'http://www.appcelerator.com/platform/appcelerator-platform/');
        }
    });

    $.contentContainer.addEventListener('swipe', processTransition);
    $.contentContainer.addEventListener('touchend', processPinchEnd);
    $.contentContainer.addEventListener('pinch', processPinch);

    $.cardTitleLbl.text = (state.showWelcome) ? guide.content.welcome.title[0] : (guide.content.standard[0][0].displayRemaining) ? guide.content.standard[0][0].title[0] + ' - 1 of 6' : guide.content.standard[0][0].title[0];

    state.finishedWelcomeCard = (state.showWelcome) ? false : true;

    $.pointy.transform = Ti.UI.create2DMatrix({ scale:1.2 });
}

exports._init          = init,
exports._getParentView = getParentView,
exports._show          = show,
exports._hide          = hide;