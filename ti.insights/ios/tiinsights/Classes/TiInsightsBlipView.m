/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiInsightsBlipView.h"

@implementation TiInsightsBlipView

- (void)dealloc
{
    RELEASE_TO_NIL(centerCircle);
    RELEASE_TO_NIL(outerCircle);
    RELEASE_TO_NIL(innerCircle);
    
    [super dealloc];
}

- (id)init
{
    if ((self = [super init]))
    {
        CGColorRef borderFillColor = [[UIColor clearColor] CGColor];
        CGFloat borderLineWidth = 1.0;
        
        animationStopped = YES;
        
        centerCircle = [CAShapeLayer layer];
        innerCircle = [CAShapeLayer layer];
        outerCircle = [CAShapeLayer layer];
        
        [innerCircle setFillColor:borderFillColor];
        [outerCircle setFillColor:borderFillColor];
        
        [innerCircle setLineWidth:borderLineWidth];
        [outerCircle setLineWidth:borderLineWidth];

        
        [[self layer] addSublayer:innerCircle];
        [[self layer] addSublayer:outerCircle];
        [[self layer] addSublayer:centerCircle];
    }
    
    return self;
}

// scaleValues and opacityValues should be an NSArray with first index
// indicating fromValue and second index indicating toValue
- (CAAnimationGroup*)borderAnimationGroupWithScaleValues:(NSArray*)scaleValues andOpacityValues:(NSArray*)opacityValues andDuration:(float)duration andId:(NSString*)id
{
    CAAnimationGroup *borderAnimationGroup = [CAAnimationGroup animation];
    CABasicAnimation *borderScale = [CABasicAnimation animationWithKeyPath:@"transform.scale"];
    CABasicAnimation *borderOpacity = [CABasicAnimation animationWithKeyPath:@"opacity"];
    
    [borderAnimationGroup setValue:id forKey:@"id"];
    
    [borderAnimationGroup setAnimations:[NSArray arrayWithObjects:borderScale, borderOpacity, nil]];
    
    [borderScale setFromValue:[scaleValues objectAtIndex:0]];
    [borderScale setToValue:[scaleValues objectAtIndex:1]];
    
    [borderOpacity setFromValue:[opacityValues objectAtIndex:0]];
    [borderOpacity setToValue:[opacityValues objectAtIndex:1]];
    
    [borderAnimationGroup setDuration:duration];

    [borderAnimationGroup setDelegate:self];
    
    return borderAnimationGroup;
}

- (void)toggle:(id)args
{
    if (animationStopped)
    {
        [self animateInnerCircle];
        [self animateOuterCircle];
    }
    
    animationStopped = !animationStopped;
    
    // Animation will be removed by the delegate method 'animationDidStop'
    // so that the animation is removed smoothly.
    //
    // TODO: Need to possibly implement force cancel.
    //
    // Toggle is not 'complete' as we don't check for animation
    // complete, which will result in messed up animation if toggle
    // is called multiple times before animation finishes.
}

- (void)animateInnerCircle
{
    [innerCircle addAnimation:[self borderAnimationGroupWithScaleValues:[NSArray arrayWithObjects:@(1.0), @(2.0), nil] andOpacityValues:[NSArray arrayWithObjects:@(0.8), @(0.0), nil] andDuration:2.0 andId:@"innerCircleAnimationGroup"] forKey:@"scaleAndOpacityInner"];
}

- (void)animateOuterCircle
{
    [outerCircle addAnimation:[self borderAnimationGroupWithScaleValues:[NSArray arrayWithObjects:@(1.0), @(2.0), nil] andOpacityValues:[NSArray arrayWithObjects:@(0.6), @(0.0), nil] andDuration:1.0 andId:@"outerCircleAnimationGroup"] forKey:@"scaleAndOpacityOuter"];
}

- (void)animationDidStop:(CAAnimationGroup *)theAnimation finished:(BOOL)flag
{
    if ([[theAnimation valueForKey:@"id"] isEqual:@"innerCircleAnimationGroup"])
    {
        if (!animationStopped)
        {
            [self animateInnerCircle];
        }
        else
        {
            [innerCircle removeAllAnimations];
        }
    }
    
    if ([[theAnimation valueForKey:@"id"] isEqual:@"outerCircleAnimationGroup"])
    {
        if (!animationStopped)
        {
            [self animateOuterCircle];
        }
        else
        {
            [outerCircle removeAllAnimations];
        }
    }
}


- (void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{    
    [self bakeLayout];
}

- (void)bakeLayout
{
    CGRect frameSize = CGRectMake((self.bounds.size.width - (radius * 2)) / 2, (self.bounds.size.height - (radius * 2)) / 2, radius * 2, radius * 2);
    CGPathRef path = [[UIBezierPath bezierPathWithOvalInRect:CGRectMake(0, 0, radius * 2, radius * 2)] CGPath];
    
    [centerCircle setFrame:frameSize];
    [innerCircle setFrame:frameSize];
    [outerCircle setFrame:frameSize];
    
    [centerCircle setPath:path];
    [innerCircle setPath:path];
    [outerCircle setPath:path];
}

- (void)setRadius_:(id)newRadius
{
    radius = [TiUtils floatValue:newRadius];
    
    [self bakeLayout];
}

- (void)setBlipColor_:(id)newColor
{
    CGColorRef color = [[[TiUtils colorValue:newColor] color] CGColor];
    
    [centerCircle setFillColor:color];
    [innerCircle setStrokeColor:color];
    [outerCircle setStrokeColor:color];
}

@end
