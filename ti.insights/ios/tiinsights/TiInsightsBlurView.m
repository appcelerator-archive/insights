/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiInsightsBlurView.h"
#define SYSTEM_VERSION_GREATER_THAN_OR_EQUAL_TO(v)  ([[[UIDevice currentDevice] systemVersion] compare:v options:NSNumericSearch] != NSOrderedAscending)

@implementation TiInsightsBlurView

@synthesize translucentAlpha = _translucentAlpha;

#pragma mark - Initalization
- (id)initWithFrame:(CGRect)frame //code
{
    self = [super initWithFrame:frame];
    if (self) {
        [self createUI];
    }
    return self;
}

- (id) initWithCoder:(NSCoder *)aDecoder { //XIB
    self = [super initWithCoder:aDecoder];
    if (self) {
        [self createUI];
    }
    return self;
}


- (void) createUI {
    
    if (SYSTEM_VERSION_GREATER_THAN_OR_EQUAL_TO(@"7.0")) {
        _ilColorBG = self.backgroundColor; //get background color of view (can be set trough interface builder before)
        self.ilDefaultColorBG=toolBarBG.barTintColor; //Apple's default background color
        
        _translucent = YES;
        _translucentAlpha = 1;
        
        // creating nonexistentSubview
        nonexistentSubview = [[UIView alloc] initWithFrame:self.bounds];
        nonexistentSubview.backgroundColor=[UIColor clearColor];
        nonexistentSubview.clipsToBounds=YES;
        nonexistentSubview.autoresizingMask = UIViewAutoresizingFlexibleBottomMargin | UIViewAutoresizingFlexibleLeftMargin | UIViewAutoresizingFlexibleRightMargin | UIViewAutoresizingFlexibleTopMargin;
        [self insertSubview:nonexistentSubview atIndex:0];
        
        //creating toolbarContainerClipView
        toolbarContainerClipView = [[UIView alloc] initWithFrame:self.bounds];
        toolbarContainerClipView.backgroundColor=[UIColor clearColor];
        toolbarContainerClipView.clipsToBounds=YES;
        toolbarContainerClipView.autoresizingMask = UIViewAutoresizingFlexibleBottomMargin | UIViewAutoresizingFlexibleLeftMargin | UIViewAutoresizingFlexibleRightMargin | UIViewAutoresizingFlexibleTopMargin;
        [nonexistentSubview addSubview:toolbarContainerClipView];
        
        //creating toolBarBG
        //we must clip 1px line on the top of toolbar
        CGRect rect= self.bounds;
        rect.origin.y-=1;
        rect.size.height+=1;
        toolBarBG =[[UIToolbar alloc] initWithFrame:rect];
        toolBarBG.frame=rect;
        toolBarBG.autoresizingMask= UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
        [toolbarContainerClipView addSubview:toolBarBG];
        
        
        
        
        //view above toolbar, great for changing blur color effect
        overlayBackgroundView = [[UIView alloc] initWithFrame:self.bounds];
        overlayBackgroundView.backgroundColor = self.backgroundColor;
        overlayBackgroundView.autoresizingMask= UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
        [toolbarContainerClipView addSubview:overlayBackgroundView];
        
        
        [self setBackgroundColor:[UIColor clearColor]]; //view must be transparent :)
        
        initComplete = YES;
    }
    
}

#pragma mark - Configuring a View’s Visual Appearance



- (BOOL) isItClearColor: (UIColor *) color {
    CGFloat red = 0.0, green = 0.0, blue = 0.0, alpha =0.0;
    [color getRed:&red green:&green blue:&blue alpha:&alpha];
    
    if (red!=0 || green != 0 || blue != 0 || alpha != 0) {
        return NO;
    }
    else {
        return YES;
    }
}

- (void) setFrame:(CGRect)frame {
    
    
    //     - Setting frame of view -
    // UIToolbar's frame is not great at animating. It produces lot of glitches.
    // Because of that, we never actually reduce size of toolbar"
    
    if (SYSTEM_VERSION_GREATER_THAN_OR_EQUAL_TO(@"7.0")) {
        CGRect rect = frame;
        rect.origin.x=0;
        rect.origin.y=0;
        
        if (toolbarContainerClipView.frame.size.width>rect.size.width) {
            rect.size.width=toolbarContainerClipView.frame.size.width;
        }
        if (toolbarContainerClipView.frame.size.height>rect.size.height) {
            rect.size.height=toolbarContainerClipView.frame.size.height;
        }
        
        toolbarContainerClipView.frame=rect;
        
        [super setFrame:frame];
        [nonexistentSubview setFrame:self.bounds];
    }
    else
        [super setFrame:frame];
}

- (void) setBounds:(CGRect)bounds {
    
    //     - Setting bounds of view -
    // UIToolbar's bounds is not great at animating. It produces lot of glitches.
    // Because of that, we never actually reduce size of toolbar"
    
    
    if (SYSTEM_VERSION_GREATER_THAN_OR_EQUAL_TO(@"7.0")) {
        CGRect rect = bounds;
        rect.origin.x=0;
        rect.origin.y=0;
        
        if (toolbarContainerClipView.bounds.size.width>rect.size.width) {
            rect.size.width=toolbarContainerClipView.bounds.size.width;
        }
        if (toolbarContainerClipView.bounds.size.height>rect.size.height) {
            rect.size.height=toolbarContainerClipView.bounds.size.height;
        }
        
        toolbarContainerClipView.bounds=rect;
        [super setBounds:bounds];
        [nonexistentSubview setFrame:self.bounds];
    }
    else
        [super setBounds:bounds];
    
}


- (void)setTranslucentStyle_:(id)newTranslucentStyle {
    // UIBarStyle
//    toolBarBG.barStyle = [TiUtils intValue:newTranslucentStyle];
    toolBarBG.barStyle = 1;
}

- (UIBarStyle)translucentStyle {
    return toolBarBG.barStyle;
}


- (void)setTranslucentTintColor_:(id)newTranslucentTintColor
{
    ENSURE_UI_THREAD_1_ARG(newTranslucentTintColor);
    
// FOR V1, disabling setters
    //    const CGFloat* components = CGColorGetComponents([[[TiUtils colorValue:newTranslucentTintColor] color] CGColor]);
//    
//    // FS: setting the alpha to 0.2
//    _translucentTintColor = [UIColor colorWithRed:components[0] green:components[1] blue:components[2] alpha:self.alpha];
//
//    //tint color of toolbar
//    if ([self isItClearColor:_translucentTintColor])
//    {
//        [toolBarBG setBarTintColor:self.ilDefaultColorBG];
//    }
//    else
//    {
//        [toolBarBG setBarTintColor:_translucentTintColor];
//    }
    
    [toolBarBG setBarTintColor:[UIColor colorWithRed:0 green:0 blue:0 alpha:0.8]];
}

- (void)setTranslucentAlpha_:(id)newTranslucentAlpha {
    //changing alpha of toolbar
    
    ENSURE_UI_THREAD_1_ARG(newTranslucentAlpha);
    
// FOR V1, disabling setters
    //    _translucentAlpha = [TiUtils floatValue:newTranslucentAlpha];
//    
//    if (_translucentAlpha > 1.0)
//    {
//        _translucentAlpha = 1.0;
//    }
//    else if (_translucentAlpha < 0.0)
//    {
//        _translucentAlpha = 0.0;
//    }
    
//    toolBarBG.alpha = _translucentAlpha;
    toolBarBG.alpha = 1;
    
}

- (void)setAlpha_:(id)alpha
{
    self.alpha = [TiUtils floatValue:alpha];
}

- (void)setTranslucent_:(id)isTranslucent {
    
    //enabling and disabling blur effect
    _translucent = [TiUtils boolValue:isTranslucent];
    
    toolBarBG.translucent = _translucent;
    
    if (_translucent)
    {
        toolBarBG.hidden = NO;
        
        [toolBarBG setBarTintColor:self.ilColorBG];
        [self setBackgroundColor:[UIColor clearColor]];
    }
    else
    {
        toolBarBG.hidden = YES;
        
        [self setBackgroundColor:self.ilColorBG];
    }
}


// FS: Setter for this, but not super useful unless addressing
// a slow device where alpha would result in a significant
// performance hit...
- (void)setBackgroundColor_:(id)newBackgroundColor {
    
    //changing backgroundColor of view actually change tintColor of toolbar
    if (initComplete) {
        
        self.ilColorBG = [[TiUtils colorValue:newBackgroundColor] color];
        
        if (_translucent)
        {
            // FS: It isn't really useful to do this...
            // Also, it's better to add a subview with an alpha...
            // overlayBackgroundView.backgroundColor = self.ilColorBG;
            
            [super setBackgroundColor:[UIColor clearColor]];
        }
        else
        {
            [super setBackgroundColor:self.ilColorBG];
        }
        
    }
    else
    {
        [super setBackgroundColor:self.ilColorBG];
    }
}

#pragma mark - Managing the View Hierarchy

- (NSArray *) subviews {
    
    // must exclude nonexistentSubview
    
    if (initComplete) {
        NSMutableArray *array = [NSMutableArray arrayWithArray:[super subviews]];
        [array removeObject:nonexistentSubview];
        return (NSArray *)array;
    }
    else {
        return [super subviews];
    }
    
}
- (void) sendSubviewToBack:(UIView *)view {
    
    // must exclude nonexistentSubview
    
    if (initComplete) {
        [self insertSubview:view aboveSubview:toolbarContainerClipView];
        return;
    }
    else
        [super sendSubviewToBack:view];
}
- (void) insertSubview:(UIView *)view atIndex:(NSInteger)index {
    
    // must exclude nonexistentSubview
    
    if (initComplete) {
        [super insertSubview:view atIndex:(index+1)];
    }
    else
        [super insertSubview:view atIndex:index];
    
}
- (void) exchangeSubviewAtIndex:(NSInteger)index1 withSubviewAtIndex:(NSInteger)index2 {
    
    // must exclude nonexistentSubview
    
    if (initComplete)
        [super exchangeSubviewAtIndex:(index1+1) withSubviewAtIndex:(index2+1)];
    else
        [super exchangeSubviewAtIndex:(index1) withSubviewAtIndex:(index2)];
}


/*
 // Only override drawRect: if you perform custom drawing.
 // An empty implementation adversely affects performance during animation.
 - (void)drawRect:(CGRect)rect
 {
 // Drawing code
 }
 */


@end
