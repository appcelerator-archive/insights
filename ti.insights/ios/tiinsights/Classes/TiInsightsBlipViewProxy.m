/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiInsightsBlipViewProxy.h"
#import "TiUtils.h"

@implementation TiInsightsBlipViewProxy

- (void)toggle:(id)args
{
	[[self view] performSelectorOnMainThread:@selector(toggle:) withObject:args waitUntilDone:NO];
}

@end
