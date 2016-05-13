/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiUIView.h"

@interface TiInsightsBlurView : TiUIView {
    UIView *nonexistentSubview; //this is first child view of ILTranslucentView. It is not available trough "Managing the View Hierarchy" methods.
    UIView *toolbarContainerClipView; //view which contain UIToolbar as child subview
    UIToolbar *toolBarBG; //this is empty toolbar which we use to produce blur (translucent) effect
    UIView *overlayBackgroundView; //view over toolbar that is responsive to backgroundColor property
    BOOL initComplete;
}

@property (nonatomic) BOOL translucent; //do you want blur effect? (default: YES)
@property (nonatomic) CGFloat translucentAlpha; //alpha of translucent  effect (default: 1)
@property (nonatomic) UIBarStyle translucentStyle; //blur style, Default or Black
@property (nonatomic) CGFloat alpha; // FS: creates a cool monochrome effect
@property (nonatomic, strong) UIColor *translucentTintColor; //tint color of blur, [UIColor clearColor] is default

@property (nonatomic, copy) UIColor *ilColorBG; //backGround color
@property (nonatomic, copy) UIColor *ilDefaultColorBG; //default Apple's color of UIToolbar

@end
