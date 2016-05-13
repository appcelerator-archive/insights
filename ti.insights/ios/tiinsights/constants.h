// For future iterations of Insights, consider getters/setters
// on proxies...

#define DEG2RAD(angle)             angle * M_PI / 180.0
#define DEG2RADOFFSET(angle)       (angle - 90) * M_PI / 180.0
#define PERCENTTOANGLE(percent)    (percent * 360) / 100


// TiInsightsOrbView
NSInteger  const    kOrbTotalCircles          = 5;
NSInteger  const    kOrbCircleOffset          = 6;
NSInteger  const    kOrbStrokeRadiusOffset    = 3;
NSInteger  const    kOrbStrokeWidthBase       = 1;
NSInteger  const    kOrbStrokeWidthFull       = 7;
NSInteger  const    kOrbCenterCircleRadius    = 44;
NSInteger  const    kOrbCenterCircleBgRadius  = 83;
CGFloat    const    kOrbFrameWidth            = 222;
CGFloat    const    kOrbFrameHeight           = 222;
NSString  *const    kOrbCenterCircleColor     = @"#f9f9f9";
NSString  *const    kOrbCenterCircleBgColor   = @"#f9f9f9";
CGFloat    const    kOrbCenterCircleBgOpacity = 0.2;
NSString  *const    kOrbStrokeColorBase       = @"#cccccc";
NSString  *const    kOrbStrokeColorPositive   = @"#00b1ff";
NSString  *const    kOrbStrokeColorNegative   = @"#ff0080";
NSString  *const    kOrbStrokeGrayPositive    = @"#999999";
NSString  *const    kOrbStrokeGrayNegative    = @"#999999";

