/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUIView.h"

@interface TiInsightsBlipView : TiUIView {
    CAShapeLayer *centerCircle;
    CAShapeLayer *innerCircle;
    CAShapeLayer *outerCircle;
        
    BOOL animationStopped;
    float radius;
}

@end
