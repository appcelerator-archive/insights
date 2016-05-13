/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiInsightsLoadingIndicatorSmallView.h"

@implementation TiInsightsLoadingIndicatorSmallView

- (void)dealloc
{
    RELEASE_TO_NIL(rightCircle);
    RELEASE_TO_NIL(leftCircle);
    RELEASE_TO_NIL(rightCirclePath);
    RELEASE_TO_NIL(leftCirclePath);
    
    [super dealloc];
}

- (void)animationDidStop:(CAAnimation *)theAnimation finished:(BOOL)flag
{
    if (!animationStopped)
    {
        if ([[theAnimation valueForKey:@"id"] isEqual:@"rightCircleAnim"])
        {
            [self animateLeft];
        }
        else if ([[theAnimation valueForKey:@"id"] isEqual:@"leftCircleAnim"])
        {
            [self animateRight];
        }
    }
}

- (void)bakeLayout
{
    [rightCircle setFrame:CGRectMake(self.bounds.size.width / 2, self.bounds.size.height / 2, 20, 20)];
    [leftCircle setFrame:CGRectMake(self.bounds.size.width / 2, self.bounds.size.height / 2, 20, 20)];

}

- (void)start:(id)args
{
    animationStopped = YES;
    
    [leftCircle removeAllAnimations];
    [rightCircle removeAllAnimations];
    
    animationStopped = NO;
    
    [self animateRight];
}

- (void)cancel:(id)args
{
    animationStopped = YES;
    
    [leftCircle removeAllAnimations];
    [rightCircle removeAllAnimations];
}


- (void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
    [self bakeLayout];
}

- (void)animateLeft
{
    if (!animationStopped)
    {
        CAAnimationGroup *leftCircleAnimGroup = [CAAnimationGroup animation];
        CABasicAnimation *leftCircleAnimStart = [CABasicAnimation animationWithKeyPath:@"strokeStart"];
        CABasicAnimation *leftCircleAnimEnd = [CABasicAnimation animationWithKeyPath:@"strokeEnd"];
        CABasicAnimation *leftCircleAnimOpacity = [CABasicAnimation animationWithKeyPath:@"opacity"];
        
        [leftCircleAnimGroup setValue:@"leftCircleAnim" forKey:@"id"];
        [leftCircleAnimStart setFromValue:[NSNumber numberWithFloat:0.0]];
        [leftCircleAnimStart setToValue:[NSNumber numberWithFloat:0.5]];
        
        [leftCircleAnimEnd setFromValue:[NSNumber numberWithFloat:0.0]];
        [leftCircleAnimEnd setToValue:[NSNumber numberWithFloat:1.0]];
        
        [leftCircleAnimOpacity setFromValue:[NSNumber numberWithFloat:1.0]];
        [leftCircleAnimOpacity setToValue:[NSNumber numberWithFloat:0.0]];
        
        [leftCircleAnimGroup setDelegate:self];
        leftCircleAnimGroup.animations = [NSArray arrayWithObjects:leftCircleAnimStart, leftCircleAnimEnd, leftCircleAnimOpacity, nil];
        leftCircleAnimGroup.duration = 0.5;
        
        [leftCircleAnimGroup setTimingFunction:[CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionEaseOut]];
        
        [leftCircle addAnimation:leftCircleAnimGroup forKey:@"leftCircleAnim"];
        [leftCircle setOpacity:0.0];
    }
}

- (void)animateRight
{
    if (!animationStopped)
    {
        CAAnimationGroup *rightCircleAnimGroup = [CAAnimationGroup animation];
        CABasicAnimation *rightCircleAnimStart = [CABasicAnimation animationWithKeyPath:@"strokeStart"];
        CABasicAnimation *rightCircleAnimEnd = [CABasicAnimation animationWithKeyPath:@"strokeEnd"];
        CABasicAnimation *rightCircleAnimOpacity = [CABasicAnimation animationWithKeyPath:@"opacity"];
        
        [rightCircleAnimGroup setValue:@"rightCircleAnim" forKey:@"id"];
        
        
        
        [rightCircleAnimStart setFromValue:[NSNumber numberWithFloat:0.0]];
        [rightCircleAnimStart setToValue:[NSNumber numberWithFloat:0.5]];
        
        [rightCircleAnimEnd setFromValue:[NSNumber numberWithFloat:0.0]];
        [rightCircleAnimEnd setToValue:[NSNumber numberWithFloat:1.0]];
        
        [rightCircleAnimOpacity setFromValue:[NSNumber numberWithFloat:1.0]];
        [rightCircleAnimOpacity setToValue:[NSNumber numberWithFloat:0.0]];
        
        
        [rightCircleAnimGroup setDelegate:self];
        rightCircleAnimGroup.animations = [NSArray arrayWithObjects:rightCircleAnimStart, rightCircleAnimEnd, rightCircleAnimOpacity, nil];
        rightCircleAnimGroup.duration = 0.5;
        
        [rightCircleAnimGroup setTimingFunction:[CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionEaseOut]];
        
        [rightCircle addAnimation:rightCircleAnimGroup forKey:@"rightCircleAnim"];
        [rightCircle setOpacity:0.0];
    }
}

- (id)init
{
    if (self = [super init])
    {
        animationStopped = YES;
        
        rightCircle = [CAShapeLayer layer];
        leftCircle = [CAShapeLayer layer];
        
        rightCirclePath = [UIBezierPath bezierPath];
        leftCirclePath = [UIBezierPath bezierPath];
    
        [rightCirclePath addArcWithCenter:CGPointMake(self.bounds.size.width / 2, self.bounds.size.height / 2) radius:10 startAngle:degreesToRadians(225) endAngle:degreesToRadians(45) clockwise:YES];
        
        [leftCirclePath addArcWithCenter:CGPointMake(self.bounds.size.width / 2, self.bounds.size.height / 2) radius:10 startAngle:degreesToRadians(45) endAngle:degreesToRadians(225) clockwise:YES];
        
        [rightCircle setFillColor:[[UIColor clearColor] CGColor]];
        [leftCircle setFillColor:[[UIColor clearColor] CGColor]];

        
        [rightCircle setLineWidth:1.0];
        [leftCircle setLineWidth:1.0];
        
        [rightCircle setStrokeColor:[[[TiUtils colorValue:@"#f2f2f2"] color] CGColor]];
        [leftCircle setStrokeColor:[[[TiUtils colorValue:@"#f2f2f2"] color] CGColor]];
        
        [rightCircle setPath:[rightCirclePath CGPath]];
        [leftCircle setPath:[leftCirclePath CGPath]];
        
        [[self layer] addSublayer:rightCircle];
        [[self layer] addSublayer:leftCircle];
        
        [leftCircle setOpacity:0.0];
        [rightCircle setOpacity:0.0];
    }
    
    return self;
}

@end
