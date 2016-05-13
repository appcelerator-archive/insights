/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUIView.h"
#import "constants.h"

@interface TiInsightsOrbView : TiUIView {
    CALayer *colorParent;
    CALayer *grayParent;
    
    CAShapeLayer *centerCircle;
    CAShapeLayer *centerCircleBg;
}

@property (nonatomic) BOOL colorActive;

@property (nonatomic, assign) NSInteger percent;
@property (nonatomic, retain) NSMutableArray *outerCirclesBase;
@property (nonatomic, retain) NSMutableArray *outerCirclesBg;
@property (nonatomic, retain) NSMutableArray *outerCirclesFull;
@property (nonatomic, retain) NSMutableArray *outerCirclesGrayBase;
@property (nonatomic, retain) NSMutableArray *outerCirclesGrayBg;
@property (nonatomic, retain) NSMutableArray *outerCirclesGrayFull;

@property (nonatomic, retain) NSMutableArray *innerCirclesBase;
@property (nonatomic, retain) NSMutableArray *innerCirclesBg;
@property (nonatomic, retain) NSMutableArray *innerCirclesFull;
@property (nonatomic, retain) NSMutableArray *innerCirclesGrayBase;
@property (nonatomic, retain) NSMutableArray *innerCirclesGrayBg;
@property (nonatomic, retain) NSMutableArray *innerCirclesGrayFull;

@end
