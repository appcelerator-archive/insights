/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiInsightsDonutView.h"
#define DEG2RADOFFSET(angle)          (angle - 90) * M_PI / 180.0

@implementation TiInsightsDonutView

- (void)dealloc
{    
    RELEASE_TO_NIL(self.segmentColor);
    RELEASE_TO_NIL(self.segmentLayers);
    RELEASE_TO_NIL(self.values);
    
    [super dealloc];
}

// offset bool is used to determine if a 1px offset is needed
// if only 1 segment is generated, complete the circle
- (CGPathRef)generatePathWithCenter:(CGPoint)center andRadius:(CGFloat)radius andStartAngle:(CGFloat)startAngle andEndAngle:(CGFloat)endAngle andUseOffset:(BOOL)useOffset
{
    UIBezierPath *path = [UIBezierPath bezierPath];
    
    [path addArcWithCenter:center radius:radius startAngle:DEG2RADOFFSET(startAngle) endAngle:DEG2RADOFFSET(endAngle - ((useOffset) ? 0 : 1)) clockwise:YES];
    
    return [path CGPath];
}

- (CAShapeLayer*)generateSegmentWithStrokeColor:(CGColorRef)color andLineWidth:(CGFloat)lineWidth
{
    CAShapeLayer *layer = [CAShapeLayer layer];
    
    [layer setLineWidth:lineWidth];
    [layer setStrokeColor:color];
    [layer setFillColor:[[UIColor clearColor] CGColor]];
    
    return layer;
}

- (void)animateInWithSegment:(CAShapeLayer*)segment
{
    CAAnimationGroup *segmentAnimationGroup = [CAAnimationGroup animation];
    // CABasicAnimation *segmentStrokeStartAnimation = [CABasicAnimation animationWithKeyPath:@"strokeStart"];
    CABasicAnimation *segmentStrokeEndAnimation = [CABasicAnimation animationWithKeyPath:@"strokeEnd"];
    CABasicAnimation *segmentOpacityAnimation = [CABasicAnimation animationWithKeyPath:@"opacity"];

    // [segmentStrokeStartAnimation setFromValue:[NSNumber numberWithFloat:0.5]];
    // [segmentStrokeStartAnimation setToValue:[NSNumber numberWithFloat:0.0]];
    
    [segmentStrokeEndAnimation setFromValue:[NSNumber numberWithFloat:0.0]];
    [segmentStrokeEndAnimation setToValue:[NSNumber numberWithFloat:1.0]];
    
    [segmentOpacityAnimation setFromValue:[NSNumber numberWithFloat:0.0]];
    [segmentOpacityAnimation setFromValue:[NSNumber numberWithFloat:1.0]];
    
    // [segmentAnimationGroup setDelegate:self]; not sure if i want to implement delegate methods yet
    // [segmentAnimationGroup setAnimations:[NSArray arrayWithObjects:segmentStrokeStartAnimation, segmentStrokeEndAnimation, segmentOpacityAnimation, nil]];
    
    [segmentAnimationGroup setAnimations:[NSArray arrayWithObjects:segmentStrokeEndAnimation, segmentOpacityAnimation, nil]];
    [segmentAnimationGroup setTimingFunction:[CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionEaseInEaseOut]];
    [segmentAnimationGroup setDuration:0.25];

    [segment addAnimation:segmentAnimationGroup forKey:@"segmentAnimationIn"];
    [segment setStrokeStart:0.0];
    [segment setStrokeEnd:1.0];
    [segment setOpacity:1.0];
    
}

- (void)animateOut
{
    // not sure if using
}

- (void)update
{
    [[self layer] setSublayers:nil];
    
    for (int i = 0; i < [[self values] count]; i ++)
    {
        CAShapeLayer *segment = [self generateSegmentWithStrokeColor:[[self segmentColor] CGColor] andLineWidth:(([TiUtils floatValue:[[[self values] objectAtIndex:i] objectAtIndex:1]] - [TiUtils floatValue:[[[self values] objectAtIndex:i] objectAtIndex:0]]) / 360.0) * 50];
        
        // if count is 1, don't use an offset
        segment.path = [self generatePathWithCenter:CGPointMake(self.frame.size.width / 2, self.frame.size.height / 2) andRadius:240 / 2 andStartAngle:[TiUtils floatValue:[[[self values] objectAtIndex:i] objectAtIndex:0]] andEndAngle:[TiUtils floatValue:[[[self values] objectAtIndex:i] objectAtIndex:1]] andUseOffset:[[self values] count] == 1];
        
        [segment setStrokeStart:0.5];
        [segment setStrokeEnd:0.5];
        [segment setOpacity:0.0];
        
        [[self segmentLayers] addObject:segment];
        
        [[self layer] addSublayer:segment];
        
        [self animateInWithSegment:segment];
        
        
    }
}

- (id)init
{
    if ((self = [super init])) {
        [[self layer] setRasterizationScale:[[UIScreen mainScreen] scale]];
        
        [[self layer] shouldRasterize];
    }
    
    return self;
}

- (void)setData_:(id)newData
{
    ENSURE_UI_THREAD_1_ARG(newData);
    
    self.segmentLayers = nil;
    
    self.values = newData;
    
    [self update];
}

- (void)setColor_:(id)color
{
    ENSURE_UI_THREAD_1_ARG(color);
    
    self.segmentColor = [[TiUtils colorValue:color] color];
    
    for (int i = 0; i < [[self segmentLayers] count]; i ++)
    {
        [[[self segmentLayers] objectAtIndex:i] setStrokeColor:[[self segmentColor] CGColor]];
    }
}

- (void)bakeLayout {}

- (void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
    // [self bakeLayout];
}


@end
