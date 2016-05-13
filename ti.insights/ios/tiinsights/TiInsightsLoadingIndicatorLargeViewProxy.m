/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiInsightsLoadingIndicatorLargeViewProxy.h"
#import "TiUtils.h"

@implementation TiInsightsLoadingIndicatorLargeViewProxy

- (void)start:(id)args
{
	[[self view] performSelectorOnMainThread:@selector(start:) withObject:args waitUntilDone:NO];
}

- (void)cancel:(id)args
{
	[[self view] performSelectorOnMainThread:@selector(cancel:) withObject:args waitUntilDone:NO];
}

@end
