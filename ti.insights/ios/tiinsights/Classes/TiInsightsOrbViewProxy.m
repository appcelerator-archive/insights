/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiInsightsOrbViewProxy.h"
#import "TiUtils.h"

@implementation TiInsightsOrbViewProxy

- (void)enableRaster:(id)args
{
	[[self view] performSelectorOnMainThread:@selector(enableRaster:) withObject:args waitUntilDone:NO];
}

- (void)disableRaster:(id)args
{
	[[self view] performSelectorOnMainThread:@selector(disableRaster:) withObject:args waitUntilDone:NO];
}

- (void)showGray:(id)args
{
	[[self view] performSelectorOnMainThread:@selector(showGray:) withObject:args waitUntilDone:NO];
}

- (void)showColor:(id)args
{
	[[self view] performSelectorOnMainThread:@selector(showColor:) withObject:args waitUntilDone:NO];
}

@end
