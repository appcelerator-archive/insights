/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiInsightsOrbView.h"
#import <CoreImage/CoreImage.h>


@implementation TiInsightsOrbView

@synthesize innerCirclesBase;
@synthesize innerCirclesFull;
@synthesize innerCirclesBg;
@synthesize innerCirclesGrayBase;
@synthesize innerCirclesGrayFull;
@synthesize innerCirclesGrayBg;

@synthesize outerCirclesBase;
@synthesize outerCirclesFull;
@synthesize outerCirclesBg;
@synthesize outerCirclesGrayBase;
@synthesize outerCirclesGrayFull;
@synthesize outerCirclesGrayBg;

- (void)dealloc
{
    RELEASE_TO_NIL(self.outerCirclesBase);
    RELEASE_TO_NIL(self.outerCirclesFull);
    RELEASE_TO_NIL(self.outerCirclesBg);
    RELEASE_TO_NIL(self.innerCirclesBase);
    RELEASE_TO_NIL(self.innerCirclesFull);
    RELEASE_TO_NIL(self.innerCirclesBg);
    
    RELEASE_TO_NIL(centerCircle);
    RELEASE_TO_NIL(centerCircleBg);
    
    [super dealloc];
}

- (void)enableRaster:(id)args
{
    [[self layer] setShouldRasterize:YES];
}

- (void)disableRaster:(id)args
{
    [[self layer] setShouldRasterize:NO];

}

- (void)showGray:(id)args
{
    self.colorActive = NO;
    
    [CATransaction setAnimationDuration:2];
    [colorParent setOpacity:0.0];
    [grayParent setOpacity:0.4];
}

- (void)showColor:(id)args
{
    self.colorActive = YES;
    
    [CATransaction setAnimationDuration:2];
    [colorParent setOpacity:1.0];
    [grayParent setOpacity:0.0];
}

- (id)init
{
    if ((self = [super init]))
    {
        [[self layer] setRasterizationScale:[[UIScreen mainScreen] scale]];

        self.percent = 110;
        self.colorActive = YES;
        
        colorParent = [CALayer layer];
        grayParent = [CALayer layer];
        
        centerCircle = [CAShapeLayer layer];
        centerCircleBg = [CAShapeLayer layer];
        
        self.outerCirclesBase = [NSMutableArray array];
        self.outerCirclesFull = [NSMutableArray array];
        self.outerCirclesBg = [NSMutableArray array];
        self.outerCirclesGrayBase = [NSMutableArray array];
        self.outerCirclesGrayFull = [NSMutableArray array];
        self.outerCirclesGrayBg = [NSMutableArray array];
        
        self.innerCirclesBase = [NSMutableArray array];
        self.innerCirclesFull = [NSMutableArray array];
        self.innerCirclesBg = [NSMutableArray array];
        self.innerCirclesGrayBase = [NSMutableArray array];
        self.innerCirclesGrayFull = [NSMutableArray array];
        self.innerCirclesGrayBg = [NSMutableArray array];
        
        [grayParent setOpacity:0.0];
        
        [centerCircle setFillColor:[self colorFromTi:kOrbCenterCircleColor]];
        
        [centerCircleBg setFillColor:[self colorFromTi:kOrbCenterCircleBgColor]];
        [centerCircleBg setOpacity:kOrbCenterCircleBgOpacity];
        
        [[self layer] addSublayer:centerCircleBg];
        [[self layer] addSublayer:centerCircle];
        
        
        [[self layer] addSublayer:colorParent];
        [[self layer] addSublayer:grayParent];

        for (int i = 0; i < kOrbTotalCircles; i ++)
        {
            // gen color
            [self generateCirclesWithBaseArray:innerCirclesBase andFullArray:innerCirclesFull andBgArray:innerCirclesBg andCurrentCount:i andStrokeColor:[self colorFromTi:kOrbStrokeColorNegative] andParent:colorParent];
            
            // gen grayscale
            [self generateCirclesWithBaseArray:innerCirclesGrayBase andFullArray:innerCirclesGrayFull andBgArray:innerCirclesGrayBg andCurrentCount:i andStrokeColor:[self colorFromTi:kOrbStrokeGrayNegative] andParent:grayParent];
            
            // gen color
            [self generateCirclesWithBaseArray:self.outerCirclesBase andFullArray:outerCirclesFull andBgArray:outerCirclesBg andCurrentCount:i andStrokeColor:[self colorFromTi:kOrbStrokeColorPositive] andParent:colorParent];
            
            // gen grayscale
            [self generateCirclesWithBaseArray:self.outerCirclesGrayBase andFullArray:outerCirclesGrayFull andBgArray:outerCirclesGrayBg andCurrentCount:i andStrokeColor:[self colorFromTi:kOrbStrokeGrayPositive] andParent:grayParent];
        }
    }
    
    return self;
}

- (void)generateCirclesWithBaseArray:(NSMutableArray*)baseArray andFullArray:(NSMutableArray*)fullArray andBgArray:(NSMutableArray*)bgArray andCurrentCount:(NSInteger)currentCount andStrokeColor:(CGColorRef)strokeColor andParent:(CALayer*)parent
{
    CAShapeLayer *baseLayer = [CAShapeLayer layer];
    CAShapeLayer *fullLayer = [CAShapeLayer layer];
    CAShapeLayer *bgLayer = [CAShapeLayer layer];
    
    [baseLayer setLineWidth:kOrbStrokeWidthBase];
    [fullLayer setLineWidth:kOrbStrokeWidthFull];
    [bgLayer setLineWidth:kOrbStrokeWidthBase];
    
    [baseLayer setFillColor:[[UIColor clearColor] CGColor]];
    [fullLayer setFillColor:[[UIColor clearColor] CGColor]];
    [bgLayer setFillColor:[[UIColor clearColor] CGColor]];
    
    [baseLayer setStrokeColor:strokeColor];
    [fullLayer setStrokeColor:strokeColor];
    [bgLayer setStrokeColor:[self colorFromTi:kOrbStrokeColorBase]];
    
    [baseArray addObject:baseLayer];
    [fullArray addObject:fullLayer];
    [bgArray addObject:bgLayer];
    
    [parent addSublayer:[bgArray objectAtIndex:currentCount]];
    [parent addSublayer:[baseArray objectAtIndex:currentCount]];
    [parent addSublayer:[fullArray objectAtIndex:currentCount]];
}

- (CGColorRef)colorFromTi:(id)color
{
    return [[[TiUtils colorValue:color] color] CGColor];
}
                  
- (void)setPercent_:(id)newPercent
{
    ENSURE_UI_THREAD_1_ARG(newPercent);
    
    self.percent = [TiUtils intValue:newPercent];
    
    [self update];
}

// This needs a serious refactor...
- (void)update
{
    CAShapeLayer *bgLayer;
    CAShapeLayer *bgGrayLayer;
    CAShapeLayer *bgLayerExtra;
    CAShapeLayer *bgGrayLayerExtra;
    CAShapeLayer *baseLayer;
    CAShapeLayer *baseGrayLayer;
    CAShapeLayer *baseLayerExtra;
    CAShapeLayer *baseGrayLayerExtra;
    UIBezierPath *path;
    UIBezierPath *pathGray;
    
    int correctedAngle;
    
    for (int i = 0; i < 5; i ++)
    {
        CAShapeLayer *currentInnerBaseLayer = [self.innerCirclesBase objectAtIndex:i];
        CAShapeLayer *currentInnerFullLayer = [self.innerCirclesFull objectAtIndex:i];
        CAShapeLayer *currentInnerBgLayer = [self.innerCirclesBg objectAtIndex:i];
        CAShapeLayer *currentInnerGrayBaseLayer = [self.innerCirclesGrayBase objectAtIndex:i];
        CAShapeLayer *currentInnerGrayFullLayer = [self.innerCirclesGrayFull objectAtIndex:i];
        CAShapeLayer *currentInnerGrayBgLayer = [self.innerCirclesGrayBg objectAtIndex:i];
        
        CAShapeLayer *currentOuterBaseLayer = [self.outerCirclesBase objectAtIndex:i];
        CAShapeLayer *currentOuterFullLayer = [self.outerCirclesFull objectAtIndex:i];
        CAShapeLayer *currentOuterBgLayer = [self.outerCirclesBg objectAtIndex:i];
        CAShapeLayer *currentOuterGrayBaseLayer = [self.outerCirclesGrayBase objectAtIndex:i];
        CAShapeLayer *currentOuterGrayFullLayer = [self.outerCirclesGrayFull objectAtIndex:i];
        CAShapeLayer *currentOuterGrayBgLayer = [self.outerCirclesGrayBg objectAtIndex:i];
        
        [currentInnerBaseLayer setOpacity:0.0];
        [currentInnerFullLayer setOpacity:0.0];
        [currentInnerBgLayer setOpacity:0.0];
        [currentInnerGrayBaseLayer setOpacity:0.0];
        [currentInnerGrayFullLayer setOpacity:0.0];
        [currentInnerGrayBgLayer setOpacity:0.0];
        
        [currentOuterBaseLayer setOpacity:0.0];
        [currentOuterFullLayer setOpacity:0.0];
        [currentOuterBgLayer setOpacity:0.0];
        [currentOuterGrayBaseLayer setOpacity:0.0];
        [currentOuterGrayFullLayer setOpacity:0.0];
        [currentOuterGrayBgLayer setOpacity:0.0];
        
        [currentInnerBaseLayer setFrame:[self frameWidthRadius:kOrbCenterCircleBgRadius - (kOrbCircleOffset * i) - kOrbStrokeRadiusOffset]];
        [currentInnerFullLayer setFrame:[self frameWidthRadius:kOrbCenterCircleBgRadius - (kOrbCircleOffset * i)]];
        [currentInnerGrayBaseLayer setFrame:[self frameWidthRadius:kOrbCenterCircleBgRadius - (kOrbCircleOffset * i) - kOrbStrokeRadiusOffset]];
        [currentInnerGrayFullLayer setFrame:[self frameWidthRadius:kOrbCenterCircleBgRadius - (kOrbCircleOffset * i)]];
        
        if (i == 0)
        {
            [currentInnerBgLayer setFrame:[self frameWidthRadius:kOrbCenterCircleBgRadius - (kOrbCircleOffset * i)]];
            [currentInnerGrayBgLayer setFrame:[self frameWidthRadius:kOrbCenterCircleBgRadius - (kOrbCircleOffset * i)]];
        }
        else
        {
            [currentInnerBgLayer setFrame:[self frameWidthRadius:kOrbCenterCircleBgRadius - (kOrbCircleOffset * i) - kOrbStrokeRadiusOffset]];
            [currentInnerGrayBgLayer setFrame:[self frameWidthRadius:kOrbCenterCircleBgRadius - (kOrbCircleOffset * i) - kOrbStrokeRadiusOffset]];
            
        }
        
        
        [currentOuterBaseLayer setFrame:[self frameWidthRadius:kOrbCenterCircleBgRadius + (kOrbCircleOffset * i) + kOrbStrokeRadiusOffset]];
        [currentOuterFullLayer setFrame:[self frameWidthRadius:kOrbCenterCircleBgRadius + (kOrbCircleOffset * i)]];
        [currentOuterBgLayer setFrame:[self frameWidthRadius:kOrbCenterCircleBgRadius + (kOrbCircleOffset * i) + kOrbStrokeRadiusOffset]];
        
        [currentOuterGrayBaseLayer setFrame:[self frameWidthRadius:kOrbCenterCircleBgRadius + (kOrbCircleOffset * i) + kOrbStrokeRadiusOffset]];
        [currentOuterGrayFullLayer setFrame:[self frameWidthRadius:kOrbCenterCircleBgRadius + (kOrbCircleOffset * i)]];
        [currentOuterGrayBgLayer setFrame:[self frameWidthRadius:kOrbCenterCircleBgRadius + (kOrbCircleOffset * i) + kOrbStrokeRadiusOffset]];
    }
    
    if (self.percent >= 0 && self.percent < 100 || self.percent <= 0 && self.percent > -100)
    {
        bgLayer = [innerCirclesBg objectAtIndex:0];
        bgGrayLayer = [innerCirclesGrayBg objectAtIndex:0];
        path = [UIBezierPath bezierPath];
        pathGray = [UIBezierPath bezierPath];
        
        [bgLayer setOpacity:1.0];
        [bgGrayLayer setOpacity:1.0];
        
        [bgLayer setPath:[self circlePathWithRadius:bgLayer.frame.size.width / 2]];
        [bgGrayLayer setPath:[self circlePathWithRadius:bgGrayLayer.frame.size.width / 2]];
        
        if (self.percent > 0)
        {
            baseLayer = [self.outerCirclesBase objectAtIndex:0];
            baseGrayLayer = [self.outerCirclesGrayBase objectAtIndex:0];
            
            [path addArcWithCenter:CGPointMake(baseLayer.frame.size.width / 2, baseLayer.frame.size.height / 2) radius:kOrbCenterCircleBgRadius startAngle:DEG2RADOFFSET(0) endAngle:DEG2RADOFFSET(PERCENTTOANGLE(self.percent)) clockwise:YES];
            
            [pathGray addArcWithCenter:CGPointMake(baseGrayLayer.frame.size.width / 2, baseGrayLayer.frame.size.height / 2) radius:kOrbCenterCircleBgRadius startAngle:DEG2RADOFFSET(0) endAngle:DEG2RADOFFSET(PERCENTTOANGLE(self.percent)) clockwise:YES];
            
            [baseLayer setPath:[path CGPath]];
            [baseGrayLayer setPath:[pathGray CGPath]];
            
            [baseLayer setOpacity:1.0];
            [baseGrayLayer setOpacity:1.0];

        }
        else if (self.percent < 0)
        {
            baseLayer = [innerCirclesBase objectAtIndex:0];
            baseGrayLayer = [innerCirclesGrayBase objectAtIndex:0];
            
            [path addArcWithCenter:CGPointMake(baseLayer.frame.size.width / 2, baseLayer.frame.size.height / 2) radius:kOrbCenterCircleBgRadius startAngle:DEG2RADOFFSET(0) endAngle:DEG2RADOFFSET(PERCENTTOANGLE(self.percent)) clockwise:NO];
            [pathGray addArcWithCenter:CGPointMake(baseGrayLayer.frame.size.width / 2, baseGrayLayer.frame.size.height / 2) radius:kOrbCenterCircleBgRadius startAngle:DEG2RADOFFSET(0) endAngle:DEG2RADOFFSET(PERCENTTOANGLE(self.percent)) clockwise:NO];
            
            [baseLayer setPath:[path CGPath]];
            [baseGrayLayer setPath:[pathGray CGPath]];
            
            [baseLayer setOpacity:1.0];
            [baseGrayLayer setOpacity:1.0];
        }
    }
    
    if (self.percent >= 100 && self.percent <= 199)
    {
        correctedAngle = self.percent - 100;
        
        path = [UIBezierPath bezierPath];
        pathGray = [UIBezierPath bezierPath];
        baseLayer = [self.outerCirclesFull objectAtIndex:0];
        baseGrayLayer = [self.outerCirclesGrayFull objectAtIndex:0];
        bgLayerExtra = [self.outerCirclesBg objectAtIndex:1];
        bgGrayLayerExtra = [self.outerCirclesGrayBg objectAtIndex:1];
        baseLayerExtra = [self.outerCirclesBase objectAtIndex:1];
        baseGrayLayerExtra = [self.outerCirclesGrayBase objectAtIndex:1];

        [baseLayer setPath:[self circlePathWithRadius:baseLayer.frame.size.width / 2]];
        [baseGrayLayer setPath:[self circlePathWithRadius:baseGrayLayer.frame.size.width / 2]];
        
        [baseLayer setOpacity:1.0];
        [baseGrayLayer setOpacity:1.0];
        
        [bgLayerExtra setPath:[self circlePathWithRadius:bgLayerExtra.frame.size.width / 2]];
        [bgGrayLayerExtra setPath:[self circlePathWithRadius:bgGrayLayerExtra.frame.size.width / 2]];
        
        [bgLayerExtra setOpacity:1.0];
        [bgGrayLayerExtra setOpacity:1.0];
        
        [path addArcWithCenter:CGPointMake(baseLayerExtra.frame.size.width / 2, baseLayerExtra.frame.size.height / 2) radius:baseLayerExtra.bounds.size.width / 2 startAngle:DEG2RADOFFSET(0) endAngle:DEG2RADOFFSET(PERCENTTOANGLE(correctedAngle)) clockwise:YES];
        [pathGray addArcWithCenter:CGPointMake(baseGrayLayerExtra.frame.size.width / 2, baseGrayLayerExtra.frame.size.height / 2) radius:baseGrayLayerExtra.bounds.size.width / 2 startAngle:DEG2RADOFFSET(0) endAngle:DEG2RADOFFSET(PERCENTTOANGLE(correctedAngle)) clockwise:YES];
        
        [baseLayerExtra setPath:[path CGPath]];
        [baseGrayLayerExtra setPath:[pathGray CGPath]];
        
        [baseLayerExtra setOpacity:1.0];
        [baseGrayLayerExtra setOpacity:1.0];
    }
    
    if (self.percent >= 200 && self.percent <= 299)
    {
        CAShapeLayer *fillLayer01 = [self.outerCirclesFull objectAtIndex:0];
        CAShapeLayer *fillGrayLayer01 = [self.outerCirclesGrayFull objectAtIndex:0];
        CAShapeLayer *fillLayer02 = [self.outerCirclesFull objectAtIndex:1];
        CAShapeLayer *fillGrayLayer02 = [self.outerCirclesGrayFull objectAtIndex:1];
        CAShapeLayer *bgLayer = [self.outerCirclesBg objectAtIndex:2];
        CAShapeLayer *bgGrayLayer = [self.outerCirclesGrayBg objectAtIndex:2];
        UIBezierPath *arcPath = [UIBezierPath bezierPath];
        UIBezierPath *arcGrayPath = [UIBezierPath bezierPath];
        CAShapeLayer *arcLayer = [self.outerCirclesBase objectAtIndex:2];
        CAShapeLayer *arcGrayLayer = [self.outerCirclesGrayBase objectAtIndex:2];
        
        correctedAngle = self.percent - 200;
        
        [fillLayer01 setPath:[self circlePathWithRadius:fillLayer01.frame.size.width / 2]];
        [fillGrayLayer01 setPath:[self circlePathWithRadius:fillGrayLayer01.frame.size.width / 2]];
        [fillLayer02 setPath:[self circlePathWithRadius:fillLayer02.frame.size.width / 2]];
        [fillGrayLayer02 setPath:[self circlePathWithRadius:fillGrayLayer02.frame.size.width / 2]];
        [bgLayer setPath:[self circlePathWithRadius:bgLayer.frame.size.width / 2]];
        [bgGrayLayer setPath:[self circlePathWithRadius:bgGrayLayer.frame.size.width / 2]];

        [fillLayer01 setOpacity:1.0];
        [fillGrayLayer01 setOpacity:1.0];
        [fillLayer02 setOpacity:1.0];
        [fillGrayLayer02 setOpacity:1.0];
        [bgLayer setOpacity:1.0];
        [bgGrayLayer setOpacity:1.0];
        
        [arcPath addArcWithCenter:CGPointMake(arcLayer.frame.size.width / 2, arcLayer.frame.size.height / 2) radius:arcLayer.bounds.size.width / 2 startAngle:DEG2RADOFFSET(0) endAngle:DEG2RADOFFSET(PERCENTTOANGLE(correctedAngle)) clockwise:YES];

        [arcGrayPath addArcWithCenter:CGPointMake(arcGrayLayer.frame.size.width / 2, arcGrayLayer.frame.size.height / 2) radius:arcGrayLayer.bounds.size.width / 2 startAngle:DEG2RADOFFSET(0) endAngle:DEG2RADOFFSET(PERCENTTOANGLE(correctedAngle)) clockwise:YES];

        [arcLayer setPath:[arcPath CGPath]];
        [arcGrayLayer setPath:[arcGrayPath CGPath]];
        [arcLayer setOpacity:1.0];
        [arcGrayLayer setOpacity:1.0];
    }
    
    if (self.percent >= 300 && self.percent <= 399)
    {
        CAShapeLayer *fillLayer01 = [self.outerCirclesFull objectAtIndex:0];
        CAShapeLayer *fillGrayLayer01 = [self.outerCirclesGrayFull objectAtIndex:0];
        CAShapeLayer *fillLayer02 = [self.outerCirclesFull objectAtIndex:1];
        CAShapeLayer *fillGrayLayer02 = [self.outerCirclesGrayFull objectAtIndex:1];
        CAShapeLayer *fillLayer03 = [self.outerCirclesFull objectAtIndex:2];
        CAShapeLayer *fillGrayLayer03 = [self.outerCirclesGrayFull objectAtIndex:2];
        CAShapeLayer *bgLayer = [self.outerCirclesBg objectAtIndex:3];
        CAShapeLayer *bgGrayLayer = [self.outerCirclesGrayBg objectAtIndex:3];
        UIBezierPath *arcPath = [UIBezierPath bezierPath];
        UIBezierPath *arcGrayPath = [UIBezierPath bezierPath];
        CAShapeLayer *arcLayer = [self.outerCirclesBase objectAtIndex:3];
        CAShapeLayer *arcGrayLayer = [self.outerCirclesGrayBase objectAtIndex:3];
        
        correctedAngle = self.percent - 300;
        
        [fillLayer01 setPath:[self circlePathWithRadius:fillLayer01.frame.size.width / 2]];
        [fillGrayLayer01 setPath:[self circlePathWithRadius:fillGrayLayer01.frame.size.width / 2]];
        [fillLayer02 setPath:[self circlePathWithRadius:fillLayer02.frame.size.width / 2]];
        [fillGrayLayer02 setPath:[self circlePathWithRadius:fillGrayLayer02.frame.size.width / 2]];
        [fillLayer03 setPath:[self circlePathWithRadius:fillLayer03.frame.size.width / 2]];
        [fillGrayLayer03 setPath:[self circlePathWithRadius:fillGrayLayer03.frame.size.width / 2]];
        [bgLayer setPath:[self circlePathWithRadius:bgLayer.frame.size.width / 2]];
        [bgGrayLayer setPath:[self circlePathWithRadius:bgGrayLayer.frame.size.width / 2]];
        
        [fillLayer01 setOpacity:1.0];
        [fillGrayLayer01 setOpacity:1.0];
        [fillLayer02 setOpacity:1.0];
        [fillGrayLayer02 setOpacity:1.0];
        [fillLayer03 setOpacity:1.0];
        [fillGrayLayer03 setOpacity:1.0];
        [bgLayer setOpacity:1.0];
        [bgGrayLayer setOpacity:1.0];
        
        [arcPath addArcWithCenter:CGPointMake(arcLayer.frame.size.width / 2, arcLayer.frame.size.height / 2) radius:arcLayer.bounds.size.width / 2 startAngle:DEG2RADOFFSET(0) endAngle:DEG2RADOFFSET(PERCENTTOANGLE(correctedAngle)) clockwise:YES];
        [arcGrayPath addArcWithCenter:CGPointMake(arcGrayLayer.frame.size.width / 2, arcGrayLayer.frame.size.height / 2) radius:arcGrayLayer.bounds.size.width / 2 startAngle:DEG2RADOFFSET(0) endAngle:DEG2RADOFFSET(PERCENTTOANGLE(correctedAngle)) clockwise:YES];
        
        [arcLayer setPath:[arcPath CGPath]];
        [arcGrayLayer setPath:[arcGrayPath CGPath]];
        [arcLayer setOpacity:1.0];
        [arcGrayLayer setOpacity:1.0];
    }
    
    if (self.percent >= 400 && self.percent <= 499)
    {
        CAShapeLayer *fillLayer01 = [self.outerCirclesFull objectAtIndex:0];
        CAShapeLayer *fillGrayLayer01 = [self.outerCirclesGrayFull objectAtIndex:0];
        CAShapeLayer *fillLayer02 = [self.outerCirclesFull objectAtIndex:1];
        CAShapeLayer *fillGrayLayer02 = [self.outerCirclesGrayFull objectAtIndex:1];
        CAShapeLayer *fillLayer03 = [self.outerCirclesFull objectAtIndex:2];
        CAShapeLayer *fillGrayLayer03 = [self.outerCirclesGrayFull objectAtIndex:2];
        CAShapeLayer *fillLayer04 = [self.outerCirclesFull objectAtIndex:3];
        CAShapeLayer *fillGrayLayer04 = [self.outerCirclesGrayFull objectAtIndex:3];
        CAShapeLayer *bgLayer = [self.outerCirclesBg objectAtIndex:4];
        CAShapeLayer *bgGrayLayer = [self.outerCirclesGrayBg objectAtIndex:4];
        UIBezierPath *arcPath = [UIBezierPath bezierPath];
        UIBezierPath *arcGrayPath = [UIBezierPath bezierPath];
        CAShapeLayer *arcLayer = [self.outerCirclesBase objectAtIndex:4];
        CAShapeLayer *arcGrayLayer = [self.outerCirclesGrayBase objectAtIndex:4];
        
        correctedAngle = self.percent - 400;
        
        [fillLayer01 setPath:[self circlePathWithRadius:fillLayer01.frame.size.width / 2]];
        [fillGrayLayer01 setPath:[self circlePathWithRadius:fillGrayLayer01.frame.size.width / 2]];
        [fillLayer02 setPath:[self circlePathWithRadius:fillLayer02.frame.size.width / 2]];
        [fillGrayLayer02 setPath:[self circlePathWithRadius:fillGrayLayer02.frame.size.width / 2]];
        [fillLayer03 setPath:[self circlePathWithRadius:fillLayer03.frame.size.width / 2]];
        [fillGrayLayer03 setPath:[self circlePathWithRadius:fillGrayLayer03.frame.size.width / 2]];
        [fillLayer04 setPath:[self circlePathWithRadius:fillLayer04.frame.size.width / 2]];
        [fillGrayLayer04 setPath:[self circlePathWithRadius:fillGrayLayer04.frame.size.width / 2]];
        [bgLayer setPath:[self circlePathWithRadius:bgLayer.frame.size.width / 2]];
        [bgGrayLayer setPath:[self circlePathWithRadius:bgGrayLayer.frame.size.width / 2]];
        
        [fillLayer01 setOpacity:1.0];
        [fillGrayLayer01 setOpacity:1.0];
        [fillLayer02 setOpacity:1.0];
        [fillGrayLayer02 setOpacity:1.0];
        [fillLayer03 setOpacity:1.0];
        [fillGrayLayer03 setOpacity:1.0];
        [fillLayer04 setOpacity:1.0];
        [fillGrayLayer04 setOpacity:1.0];
        [bgLayer setOpacity:1.0];
        [bgGrayLayer setOpacity:1.0];
        
        [arcPath addArcWithCenter:CGPointMake(arcLayer.frame.size.width / 2, arcLayer.frame.size.height / 2) radius:arcLayer.bounds.size.width / 2 startAngle:DEG2RADOFFSET(0) endAngle:DEG2RADOFFSET(PERCENTTOANGLE(correctedAngle)) clockwise:YES];
        [arcGrayPath addArcWithCenter:CGPointMake(arcGrayLayer.frame.size.width / 2, arcGrayLayer.frame.size.height / 2) radius:arcGrayLayer.bounds.size.width / 2 startAngle:DEG2RADOFFSET(0) endAngle:DEG2RADOFFSET(PERCENTTOANGLE(correctedAngle)) clockwise:YES];
        
        [arcLayer setPath:[arcPath CGPath]];
        [arcGrayLayer setPath:[arcGrayPath CGPath]];
        [arcLayer setOpacity:1.0];
        [arcGrayLayer setOpacity:1.0];
    }
    
    if (self.percent >= 500)
    {
        CAShapeLayer *fillLayer01 = [self.outerCirclesFull objectAtIndex:0];
        CAShapeLayer *fillGrayLayer01 = [self.outerCirclesGrayFull objectAtIndex:0];
        CAShapeLayer *fillLayer02 = [self.outerCirclesFull objectAtIndex:1];
        CAShapeLayer *fillGrayLayer02 = [self.outerCirclesGrayFull objectAtIndex:1];
        CAShapeLayer *fillLayer03 = [self.outerCirclesFull objectAtIndex:2];
        CAShapeLayer *fillGrayLayer03 = [self.outerCirclesGrayFull objectAtIndex:2];
        CAShapeLayer *fillLayer04 = [self.outerCirclesFull objectAtIndex:3];
        CAShapeLayer *fillGrayLayer04 = [self.outerCirclesGrayFull objectAtIndex:3];
        CAShapeLayer *fillLayer05 = [self.outerCirclesFull objectAtIndex:4];
        CAShapeLayer *fillGrayLayer05 = [self.outerCirclesGrayFull objectAtIndex:4];
        
        [fillLayer01 setPath:[self circlePathWithRadius:fillLayer01.frame.size.width / 2]];
        [fillGrayLayer01 setPath:[self circlePathWithRadius:fillGrayLayer01.frame.size.width / 2]];
        [fillLayer02 setPath:[self circlePathWithRadius:fillLayer02.frame.size.width / 2]];
        [fillGrayLayer02 setPath:[self circlePathWithRadius:fillGrayLayer02.frame.size.width / 2]];
        [fillLayer03 setPath:[self circlePathWithRadius:fillLayer03.frame.size.width / 2]];
        [fillGrayLayer03 setPath:[self circlePathWithRadius:fillGrayLayer03.frame.size.width / 2]];
        [fillLayer04 setPath:[self circlePathWithRadius:fillLayer04.frame.size.width / 2]];
        [fillGrayLayer04 setPath:[self circlePathWithRadius:fillGrayLayer04.frame.size.width / 2]];
        [fillLayer05 setPath:[self circlePathWithRadius:fillLayer05.frame.size.width / 2]];
        [fillGrayLayer05 setPath:[self circlePathWithRadius:fillGrayLayer05.frame.size.width / 2]];

        [fillLayer01 setOpacity:1.0];
        [fillGrayLayer01 setOpacity:1.0];
        [fillLayer02 setOpacity:1.0];
        [fillGrayLayer02 setOpacity:1.0];
        [fillLayer03 setOpacity:1.0];
        [fillGrayLayer03 setOpacity:1.0];
        [fillLayer04 setOpacity:1.0];
        [fillGrayLayer04 setOpacity:1.0];
        [fillLayer05 setOpacity:1.0];
        [fillGrayLayer05 setOpacity:1.0];
    }
    
    if (self.percent <= -100 && self.percent >= -199)
    {
        CAShapeLayer *fillLayer01 = [self.innerCirclesFull objectAtIndex:0];
        CAShapeLayer *fillGrayLayer01 = [self.innerCirclesGrayFull objectAtIndex:0];
        CAShapeLayer *bgLayer = [self.innerCirclesBg objectAtIndex:1];
        CAShapeLayer *bgGrayLayer = [self.innerCirclesGrayBg objectAtIndex:1];
        UIBezierPath *arcPath = [UIBezierPath bezierPath];
        UIBezierPath *arcGrayPath = [UIBezierPath bezierPath];
        CAShapeLayer *arcLayer = [self.innerCirclesBase objectAtIndex:1];
        CAShapeLayer *arcGrayLayer = [self.innerCirclesGrayBase objectAtIndex:1];
        
        correctedAngle = self.percent + 100;
        
        [fillLayer01 setPath:[self circlePathWithRadius:fillLayer01.frame.size.width / 2]];
        [fillGrayLayer01 setPath:[self circlePathWithRadius:fillGrayLayer01.frame.size.width / 2]];
        [bgLayer setPath:[self circlePathWithRadius:bgLayer.frame.size.width / 2]];
        [bgGrayLayer setPath:[self circlePathWithRadius:bgGrayLayer.frame.size.width / 2]];
        
        [fillLayer01 setOpacity:1.0];
        [fillGrayLayer01 setOpacity:1.0];
        [bgLayer setOpacity:1.0];
        [bgGrayLayer setOpacity:1.0];
        
        [arcPath addArcWithCenter:CGPointMake(arcLayer.frame.size.width / 2, arcLayer.frame.size.height / 2) radius:arcLayer.bounds.size.width / 2 startAngle:DEG2RADOFFSET(0) endAngle:DEG2RADOFFSET(PERCENTTOANGLE(correctedAngle)) clockwise:NO];
        [arcGrayPath addArcWithCenter:CGPointMake(arcGrayLayer.frame.size.width / 2, arcGrayLayer.frame.size.height / 2) radius:arcGrayLayer.bounds.size.width / 2 startAngle:DEG2RADOFFSET(0) endAngle:DEG2RADOFFSET(PERCENTTOANGLE(correctedAngle)) clockwise:NO];
        
        [arcLayer setPath:[arcPath CGPath]];
        [arcGrayLayer setPath:[arcGrayPath CGPath]];
        [arcLayer setOpacity:1.0];
        [arcGrayLayer setOpacity:1.0];

    }
    
    if (self.percent <= -200 && self.percent >= -299)
    {
        CAShapeLayer *fillLayer01 = [self.innerCirclesFull objectAtIndex:0];
        CAShapeLayer *fillGrayLayer01 = [self.innerCirclesGrayFull objectAtIndex:0];
        CAShapeLayer *fillLayer02 = [self.innerCirclesFull objectAtIndex:1];
        CAShapeLayer *fillGrayLayer02 = [self.innerCirclesGrayFull objectAtIndex:1];
        CAShapeLayer *bgLayer = [self.innerCirclesBg objectAtIndex:2];
        CAShapeLayer *bgGrayLayer = [self.innerCirclesGrayBg objectAtIndex:2];
        UIBezierPath *arcPath = [UIBezierPath bezierPath];
        UIBezierPath *arcGrayPath = [UIBezierPath bezierPath];
        CAShapeLayer *arcLayer = [self.innerCirclesBase objectAtIndex:2];
        CAShapeLayer *arcGrayLayer = [self.innerCirclesGrayBase objectAtIndex:2];
        
        correctedAngle = self.percent + 200;
        
        [fillLayer01 setPath:[self circlePathWithRadius:fillLayer01.frame.size.width / 2]];
        [fillGrayLayer01 setPath:[self circlePathWithRadius:fillGrayLayer01.frame.size.width / 2]];
        [fillLayer02 setPath:[self circlePathWithRadius:fillLayer02.frame.size.width / 2]];
        [fillGrayLayer02 setPath:[self circlePathWithRadius:fillGrayLayer02.frame.size.width / 2]];
        [bgLayer setPath:[self circlePathWithRadius:bgLayer.frame.size.width / 2]];
        [bgGrayLayer setPath:[self circlePathWithRadius:bgGrayLayer.frame.size.width / 2]];
        
        [fillLayer01 setOpacity:1.0];
        [fillGrayLayer01 setOpacity:1.0];
        [fillLayer02 setOpacity:1.0];
        [fillGrayLayer02 setOpacity:1.0];
        [bgLayer setOpacity:1.0];
        [bgGrayLayer setOpacity:1.0];
        
        [arcPath addArcWithCenter:CGPointMake(arcLayer.frame.size.width / 2, arcLayer.frame.size.height / 2) radius:arcLayer.bounds.size.width / 2 startAngle:DEG2RADOFFSET(0) endAngle:DEG2RADOFFSET(PERCENTTOANGLE(correctedAngle)) clockwise:NO];
        [arcGrayPath addArcWithCenter:CGPointMake(arcGrayLayer.frame.size.width / 2, arcGrayLayer.frame.size.height / 2) radius:arcGrayLayer.bounds.size.width / 2 startAngle:DEG2RADOFFSET(0) endAngle:DEG2RADOFFSET(PERCENTTOANGLE(correctedAngle)) clockwise:NO];
        
        [arcLayer setPath:[arcPath CGPath]];
        [arcGrayLayer setPath:[arcGrayPath CGPath]];
        [arcLayer setOpacity:1.0];
        [arcGrayLayer setOpacity:1.0];
    }
    
    if (self.percent <= -300 && self.percent >= -399)
    {
        CAShapeLayer *fillLayer01 = [self.innerCirclesFull objectAtIndex:0];
        CAShapeLayer *fillGrayLayer01 = [self.innerCirclesGrayFull objectAtIndex:0];
        CAShapeLayer *fillLayer02 = [self.innerCirclesFull objectAtIndex:1];
        CAShapeLayer *fillGrayLayer02 = [self.innerCirclesGrayFull objectAtIndex:1];
        CAShapeLayer *fillLayer03 = [self.innerCirclesFull objectAtIndex:2];
        CAShapeLayer *fillGrayLayer03 = [self.innerCirclesGrayFull objectAtIndex:2];
        CAShapeLayer *bgLayer = [self.innerCirclesBg objectAtIndex:3];
        CAShapeLayer *bgGrayLayer = [self.innerCirclesGrayBg objectAtIndex:3];
        UIBezierPath *arcPath = [UIBezierPath bezierPath];
        UIBezierPath *arcGrayPath = [UIBezierPath bezierPath];
        CAShapeLayer *arcLayer = [self.innerCirclesBase objectAtIndex:3];
        CAShapeLayer *arcGrayLayer = [self.innerCirclesGrayBase objectAtIndex:3];
        
        correctedAngle = self.percent + 300;
        
        [fillLayer01 setPath:[self circlePathWithRadius:fillLayer01.frame.size.width / 2]];
        [fillGrayLayer01 setPath:[self circlePathWithRadius:fillGrayLayer01.frame.size.width / 2]];
        [fillLayer02 setPath:[self circlePathWithRadius:fillLayer02.frame.size.width / 2]];
        [fillGrayLayer02 setPath:[self circlePathWithRadius:fillGrayLayer02.frame.size.width / 2]];
        [fillLayer03 setPath:[self circlePathWithRadius:fillLayer03.frame.size.width / 2]];
        [fillGrayLayer03 setPath:[self circlePathWithRadius:fillGrayLayer03.frame.size.width / 2]];
        [bgLayer setPath:[self circlePathWithRadius:bgLayer.frame.size.width / 2]];
        [bgGrayLayer setPath:[self circlePathWithRadius:bgGrayLayer.frame.size.width / 2]];
        
        [fillLayer01 setOpacity:1.0];
        [fillGrayLayer01 setOpacity:1.0];
        [fillLayer02 setOpacity:1.0];
        [fillGrayLayer02 setOpacity:1.0];
        [fillLayer03 setOpacity:1.0];
        [fillGrayLayer03 setOpacity:1.0];
        [bgLayer setOpacity:1.0];
        [bgGrayLayer setOpacity:1.0];
        
        [arcPath addArcWithCenter:CGPointMake(arcLayer.frame.size.width / 2, arcLayer.frame.size.height / 2) radius:arcLayer.bounds.size.width / 2 startAngle:DEG2RADOFFSET(0) endAngle:DEG2RADOFFSET(PERCENTTOANGLE(correctedAngle)) clockwise:NO];
        [arcGrayPath addArcWithCenter:CGPointMake(arcGrayLayer.frame.size.width / 2, arcGrayLayer.frame.size.height / 2) radius:arcGrayLayer.bounds.size.width / 2 startAngle:DEG2RADOFFSET(0) endAngle:DEG2RADOFFSET(PERCENTTOANGLE(correctedAngle)) clockwise:NO];
        
        [arcLayer setPath:[arcPath CGPath]];
        [arcGrayLayer setPath:[arcGrayPath CGPath]];
        [arcLayer setOpacity:1.0];
        [arcGrayLayer setOpacity:1.0];
    }
    
    if (self.percent <= -400 && self.percent >= -499)
    {
        CAShapeLayer *fillLayer01 = [self.innerCirclesFull objectAtIndex:0];
        CAShapeLayer *fillGrayLayer01 = [self.innerCirclesGrayFull objectAtIndex:0];
        CAShapeLayer *fillLayer02 = [self.innerCirclesFull objectAtIndex:1];
        CAShapeLayer *fillGrayLayer02 = [self.innerCirclesGrayFull objectAtIndex:1];
        CAShapeLayer *fillLayer03 = [self.innerCirclesFull objectAtIndex:2];
        CAShapeLayer *fillGrayLayer03 = [self.innerCirclesGrayFull objectAtIndex:2];
        CAShapeLayer *fillLayer04 = [self.innerCirclesFull objectAtIndex:3];
        CAShapeLayer *fillGrayLayer04 = [self.innerCirclesGrayFull objectAtIndex:3];
        CAShapeLayer *bgLayer = [self.innerCirclesBg objectAtIndex:4];
        CAShapeLayer *bgGrayLayer = [self.innerCirclesGrayBg objectAtIndex:4];
        UIBezierPath *arcPath = [UIBezierPath bezierPath];
        UIBezierPath *arcGrayPath = [UIBezierPath bezierPath];
        CAShapeLayer *arcLayer = [self.innerCirclesBase objectAtIndex:4];
        CAShapeLayer *arcGrayLayer = [self.innerCirclesGrayBase objectAtIndex:4];
        
        correctedAngle = self.percent + 400;
        
        [fillLayer01 setPath:[self circlePathWithRadius:fillLayer01.frame.size.width / 2]];
        [fillGrayLayer01 setPath:[self circlePathWithRadius:fillGrayLayer01.frame.size.width / 2]];
        [fillLayer02 setPath:[self circlePathWithRadius:fillLayer02.frame.size.width / 2]];
        [fillGrayLayer02 setPath:[self circlePathWithRadius:fillGrayLayer02.frame.size.width / 2]];
        [fillLayer03 setPath:[self circlePathWithRadius:fillLayer03.frame.size.width / 2]];
        [fillGrayLayer03 setPath:[self circlePathWithRadius:fillGrayLayer03.frame.size.width / 2]];
        [fillLayer04 setPath:[self circlePathWithRadius:fillLayer04.frame.size.width / 2]];
        [fillGrayLayer04 setPath:[self circlePathWithRadius:fillGrayLayer04.frame.size.width / 2]];
        [bgLayer setPath:[self circlePathWithRadius:bgLayer.frame.size.width / 2]];
        [bgGrayLayer setPath:[self circlePathWithRadius:bgGrayLayer.frame.size.width / 2]];
        
        [fillLayer01 setOpacity:1.0];
        [fillGrayLayer01 setOpacity:1.0];
        [fillLayer02 setOpacity:1.0];
        [fillGrayLayer02 setOpacity:1.0];
        [fillLayer03 setOpacity:1.0];
        [fillGrayLayer03 setOpacity:1.0];
        [fillLayer04 setOpacity:1.0];
        [fillGrayLayer04 setOpacity:1.0];
        [bgLayer setOpacity:1.0];
        [bgGrayLayer setOpacity:1.0];
        
        [arcPath addArcWithCenter:CGPointMake(arcLayer.frame.size.width / 2, arcLayer.frame.size.height / 2) radius:arcLayer.bounds.size.width / 2 startAngle:DEG2RADOFFSET(0) endAngle:DEG2RADOFFSET(PERCENTTOANGLE(correctedAngle)) clockwise:NO];
        [arcGrayPath addArcWithCenter:CGPointMake(arcGrayLayer.frame.size.width / 2, arcGrayLayer.frame.size.height / 2) radius:arcGrayLayer.bounds.size.width / 2 startAngle:DEG2RADOFFSET(0) endAngle:DEG2RADOFFSET(PERCENTTOANGLE(correctedAngle)) clockwise:NO];
        
        [arcLayer setPath:[arcPath CGPath]];
        [arcGrayLayer setPath:[arcGrayPath CGPath]];
        [arcLayer setOpacity:1.0];
        [arcGrayLayer setOpacity:1.0];
    }
    
    if (self.percent <= -500)
    {
        CAShapeLayer *fillLayer01 = [self.innerCirclesFull objectAtIndex:0];
        CAShapeLayer *fillGrayLayer01 = [self.innerCirclesGrayFull objectAtIndex:0];
        CAShapeLayer *fillLayer02 = [self.innerCirclesFull objectAtIndex:1];
        CAShapeLayer *fillGrayLayer02 = [self.innerCirclesGrayFull objectAtIndex:1];
        CAShapeLayer *fillLayer03 = [self.innerCirclesFull objectAtIndex:2];
        CAShapeLayer *fillGrayLayer03 = [self.innerCirclesGrayFull objectAtIndex:2];
        CAShapeLayer *fillLayer04 = [self.innerCirclesFull objectAtIndex:3];
        CAShapeLayer *fillGrayLayer04 = [self.innerCirclesGrayFull objectAtIndex:3];
        CAShapeLayer *fillLayer05 = [self.innerCirclesFull objectAtIndex:4];
        CAShapeLayer *fillGrayLayer05 = [self.innerCirclesGrayFull objectAtIndex:4];

        
        [fillLayer01 setPath:[self circlePathWithRadius:fillLayer01.frame.size.width / 2]];
        [fillGrayLayer01 setPath:[self circlePathWithRadius:fillGrayLayer01.frame.size.width / 2]];
        [fillLayer02 setPath:[self circlePathWithRadius:fillLayer02.frame.size.width / 2]];
        [fillGrayLayer02 setPath:[self circlePathWithRadius:fillGrayLayer02.frame.size.width / 2]];
        [fillLayer03 setPath:[self circlePathWithRadius:fillLayer03.frame.size.width / 2]];
        [fillGrayLayer03 setPath:[self circlePathWithRadius:fillGrayLayer03.frame.size.width / 2]];
        [fillLayer04 setPath:[self circlePathWithRadius:fillLayer04.frame.size.width / 2]];
        [fillGrayLayer04 setPath:[self circlePathWithRadius:fillGrayLayer04.frame.size.width / 2]];
        [fillLayer05 setPath:[self circlePathWithRadius:fillLayer05.frame.size.width / 2]];
        [fillGrayLayer05 setPath:[self circlePathWithRadius:fillGrayLayer05.frame.size.width / 2]];

        [fillLayer01 setOpacity:1.0];
        [fillGrayLayer01 setOpacity:1.0];
        [fillLayer02 setOpacity:1.0];
        [fillGrayLayer02 setOpacity:1.0];
        [fillLayer03 setOpacity:1.0];
        [fillGrayLayer03 setOpacity:1.0];
        [fillLayer04 setOpacity:1.0];
        [fillGrayLayer04 setOpacity:1.0];
        [fillLayer05 setOpacity:1.0];
        [fillGrayLayer05 setOpacity:1.0];
    }
}

// not currently used
- (void)updateGrayscaleOrbs
{
    // this updates the backing monochromatic version
    UIGraphicsBeginImageContextWithOptions(self.frame.size, NO, 0.0);
    [colorParent renderInContext:UIGraphicsGetCurrentContext()];
    UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
    UIGraphicsEndImageContext();
    
    CIImage *beginImage = [CIImage imageWithCGImage:[image CGImage]];
    
    CIImage *output = [CIFilter filterWithName:@"CIColorMonochrome" keysAndValues:kCIInputImageKey, beginImage, @"inputIntensity", [NSNumber numberWithFloat:1.0], @"inputColor", [[CIColor alloc] initWithColor:[UIColor colorWithRed:178.0/255.0 green:178.0/255.0 blue:178.0/255.0 alpha:1]], nil].outputImage;
    
    CIContext *context = [CIContext contextWithOptions:nil];
    CGImageRef cgiimage = [context createCGImage:output fromRect:CGRectMake(0, 0, self.frame.size.width * 2, self.frame.size.height * 2)];
    UIImage *newImage = [UIImage imageWithCGImage:cgiimage];
    
    CGImageRelease(cgiimage);
    
    [grayParent setContents:(id)[newImage CGImage]];
}

- (void)bakeLayout
{
    [colorParent setFrame:self.frame];
    
    [centerCircle setFrame:[self frameWidthRadius:kOrbCenterCircleRadius]];
    [centerCircleBg setFrame:[self frameWidthRadius:kOrbCenterCircleBgRadius]];
    
    [centerCircle setPath:[self circlePathWithRadius:kOrbCenterCircleRadius]];
    [centerCircleBg setPath:[self circlePathWithRadius:kOrbCenterCircleBgRadius]];
    
    [grayParent setFrame:self.frame];
    
    [self update];
}

- (void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
    [self bakeLayout];
}

- (CGRect)frameWidthRadius:(NSInteger)radius
{
    return CGRectMake((self.bounds.size.width - (radius * 2)) / 2, (self.bounds.size.height - (radius * 2)) / 2, radius * 2, radius * 2);
}

- (CGPathRef)circlePathWithRadius:(NSInteger)radius
{
    return [[UIBezierPath bezierPathWithOvalInRect:CGRectMake(0, 0,  radius * 2, radius * 2)] CGPath];
}

@end
