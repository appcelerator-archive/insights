/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUIView.h"
//#import "constants.h"

@interface TiInsightsLoadingIndicatorSmallView : TiUIView {
    CAShapeLayer *rightCircle;
    CAShapeLayer *leftCircle;
    
    UIBezierPath *rightCirclePath;
    UIBezierPath *leftCirclePath;

    bool animationStopped;
}

@end
