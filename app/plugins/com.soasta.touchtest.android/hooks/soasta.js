// This is the main entry point of the plugin.
// This is a direct conversion of TouchTest Python plugin file.

var bindings = require('./bindings'),
	compiler = require('./compiler'),
	exec = require('child_process').exec,
	fs = require('fs'),
	HU = require('./hookutil'),
	jar = require('./jar'),
	os = require('os'),
	path = require('path');

var BLACKLIST = 'blacklist.txt',
	MODULE_ID = 'com.soasta.touchtest',
	LIB_DIR = path.join(__dirname, '..', 'lib'),
	LINEBREAK_RX = /(?:\r\n|\n|\r)/,
	IS_WINDOWS = /^win/i.test(os.platform()),
	SEP = IS_WINDOWS ? ';' : ':';

var logger, config, appc, skip, restored, moduleEnabled, touchtestModuleDirCreated;

// Export supported versions
exports.cliVersion = '>=3.X';

// Main entry point for hook
exports.init = function (_logger, _config, cli, _appc) 
{
	// Prep logger and config for use throughout hook
	appc = _appc;
	logger = _logger;
	config = _config;
	config.platform = cli.argv.platform;
	config.tiapp = cli.tiapp;
	config.target = cli.argv.target;
	config.deployType = HU.mapTargetToDeployType(config.target);
	touchtestModuleDirCreated = [];

	// This is where we add the CLI finalize hook
	cli.addHook('build.finalize', function(build, done) 
	{
		if (skip) 
		{ 
		  return done(); 
	  }

		// If the module is enabled and we haven't already restored
		if (moduleEnabled && !restored) 
		{
			logger.debug('TouchTest: Restoring files changed during build.');

			// Remove TouchTest directories no longer needed
			touchtestModuleDirCreated.forEach(function(dir) 
	    {
				if (fs.existsSync(dir)) 
				{
					HU.rmdirSyncRecursive(dir);
				}
			});

			restore("titanium");
      restore("modules/titanium-ui");
      restored = true;
      logger.debug('TouchTest: The application is now TouchTest ready.');
		}

		return done();
	});

	// Add the compiler hook
	cli.addHook('build.pre.compile', function (build, done) 
  {
		// There is no reliable way to determine the current TiSDK version that
		// we are building against when using TiSDK and CLI < 3.2.0. For this
		// reason we need to do the soft version check here. If
		// build.titaniumSdkVersion is undefined, it's older than 3.2.0.
		if (!build.titaniumSdkVersion) 
		{
			skip = true;
			logger.debug('Touchtest: Deferring to legacy python plugin...');
			return done();
		}

		// This Plugin is only for the Android platform.
		if (config.platform !== 'android') 
		{
			skip = true;
			logger.trace('Touchtest: Plugin is only for android, skipping...');
			return done();
		}

		// Create a single config object
		config.projectDir = build.projectDir;
		config.globalModulesPath = build.globalModulesPath;
		config.titaniumSdkPath = build.titaniumSdkPath;
		config.templateDir = path.join(config.titaniumSdkPath, 'android');
		config.androidJar = build.androidTargetSDK.androidJar;

		// Initialize modules
		bindings.init(config.templateDir);
		jar.init(appc, logger);

		// Make sure module is installed in tiapp.xml
		moduleEnabled = isAndroidModuleEnabled();
		if (!moduleEnabled) 
		{
			logger.trace('Touchtest: Hook launched, but module not found, skipping...');
			return done();
		}

		// Generate the blacklist of modules
		var blacklist = getBlackList();
		blacklist.push(MODULE_ID);

		// Find android modules to be weaved
		var jars = findAndroidModuleJars(blacklist);

		// Initialize classpath
		var classpaths = HU.unique([ config.androidJar ]
			.concat(compiler.findCompilerJarLibraries(config.templateDir, logger))
			.concat([
				path.join(LIB_DIR, 'aspectjrt.jar'),
				path.join(LIB_DIR, 'aspectjtools.jar')
			])
			.concat(jars));
		var classpath = classpaths.join(SEP);
		// logger.debug('Touchtest: Using classpath ' + classpath);

		createBackup("titanium");
		createBackup("modules/titanium-ui");

		// Create array of functions to be executed in sequence via async
		// These functions will be executed asynchronously. We need to make sure nobody is touching Titanium SDK
		// while we are performing these functions.
		var funcs = [
			function(cb) 
			{
				logger.debug('Touchtest: instrumenting titanium.jar');
				instrument(classpath, 'titanium', cb);
			},
			function(cb) 
			{
				logger.debug('Touchtest: instrumenting modules/titanium-ui.jar');
				instrument(classpath, 'modules/titanium-ui', cb);
			}
		];
		jars.forEach(function(jar) 
    {
			funcs.push(function(cb) 
	    {
				logger.debug('Touchtest: instrumenting ' + jar);
				instrumentExternalJars(classpath, jar, cb);
			});
		});
		funcs.push(function(cb) 
    {
			logger.debug('Touchtest: merging jars for driver');
			merge(cb);
		});

		// Instrument all jars
		try 
		{
			appc.async.series(this, funcs, function(err) 
	    {
				if (err) 
				{ 
				  throw err; 
				}
				
				logger.debug('TouchTest: TouchTest Driver for Android installed');
				return done(err);
			});
	  } catch (e) 
	  {
			logger.error('TouchTest: ' + e.stack);
			logger.error('TouchTest: Exception occured. Restoring Titanium jar files.');
			restore("titanium");
			restore("modules/titanium-ui");
			logger.error('TouchTest: TouchTest Driver was not installed.');
			return done(e);
		}
	});
};

function isValidModule(theModule) 
{
	return HU.contains(theModule.platform, 'android') &&
		(!theModule['deploy-type'] || HU.contains(theModule['deploy-type'], config.deployType));
}

// Is the TouchTest android module enabled?
function isAndroidModuleEnabled() 
{
	var tiapp = config.tiapp;

	if (!tiapp.modules) 
	{ 
	  return false; 
  }

	// check all tiapp modules for android soasta
	for (var i = 0; i < tiapp.modules.length; i++) 
	{
		var mod = tiapp.modules[i];
		if (isValidModule(mod) && mod.id === MODULE_ID) 
		{
			return true;
		}
	}

	return false;
}

// Load the black listed modules from blacklist.txt
function getBlackList() 
{
	var file = path.join(__dirname, '..', BLACKLIST),
		list = [],
		contents;

	// Make sure the blacklist.txt file exists and contains data
	if (!fs.existsSync(file) || !(contents = fs.readFileSync(file, 'utf8'))) 
	{
		return list;
	}

	// Read each line of the blacklist, skipping comments
	contents.split(LINEBREAK_RX).forEach(function(line) 
  {
		line = line.trim();
		if (!line || line.indexOf('#') === 0) 
		{ 
		  return; 
		}
		list.push(line);
	});

	logger.debug('Touchtest: Blacklisted modules: ' + JSON.stringify(list));

	return list;
}

function findAndroidModuleJars(blacklist) 
{
	var jars = [],
		tiapp = config.tiapp;

	if (!tiapp.modules) 
	{ 
	  return jars; 
  }

	// Check all tiapp modules
	for (var i = 0; i < tiapp.modules.length; i++) 
	{
		var mod = tiapp.modules[i],
			version = mod.version;

		// Make sure it's a non-blacklisted android module
		if (!isValidModule(mod) || HU.contains(blacklist, mod.id)) 
		{
			continue;
		}

		// Use the valid module version, or find the latest
		if (!version) 
		{
			version = getModuleVersion(mod);
			if (!version) 
			{
				continue;
			}
		}

		// Get the path to the module
		var modulePath = getModulePath(mod, version);
		if (!modulePath) 
		{
			logger.debug('TouchTest : Module ' + mod.id + ' not found, skipping the module.');
			continue;
		}

		// We will create a copy of the module directory with a suffix .touchtest
		// Thus, if the current module directory is module/1.1, the copy will be module/1.1.touchtest
		mod.version = version + '.touchtest';
		var modulePathTouchTest = modulePath + '.touchtest';

		if (fs.existsSync(modulePathTouchTest)) 
		{
			HU.rmdirSyncRecursive(modulePathTouchTest);
		}

		appc.fs.copyDirSyncRecursive(modulePath, modulePathTouchTest);
		touchtestModuleDirCreated.push(modulePathTouchTest);
		modulePath = modulePathTouchTest;

		// Find all jars in module path
		HU.readdirSyncRecursive(modulePath).forEach(function(file) 
    {
			var fullpath = path.join(modulePath, file);
			if (!fs.statSync(fullpath).isFile()) 
			{ 
			  return; 
			}
			if (path.extname(file) === '.jar') 
			{
				jars.push(fullpath);
			}
		});

		// Find all jars in module lib path
		var moduleLibPath = path.join(modulePath, 'lib');
		if (fs.existsSync(moduleLibPath)) 
		{
			HU.readdirSyncRecursive(moduleLibPath).forEach(function(file) 
	    {
				var fullpath = path.join(moduleLibPath, file);
				if (!fs.statSync(fullpath).isFile()) 
				{ 
				  return; 
				}
				if (path.extname(file) === '.jar') 
				{
					jars.push(fullpath);
				}
			});
		}
	}

	return jars;
}

function getModulePath(theModule, version) 
{
	var moduleDir = path.join('modules', 'android', theModule.id, version);
	var paths = [
		path.join(config.projectDir, moduleDir),
		path.join(config.globalModulesPath, '..', '..', moduleDir)
	];

	for (var i = 0; i < paths.length; i++) 
	{
		if (fs.existsSync(paths[i])) 
		{
			logger.debug('Touchtest: Module ' + theModule.id + ' found at ' + paths[i]);
			return paths[i];
		}
	}

	return null;
}

function getModuleVersion(theModule) 
{
	var moduleDir = path.join('modules', 'android', theModule.id),
		versions = [];

	// Compile list of version folders from project and global
	[
		path.join(config.projectDir, moduleDir),
		path.join(config.globalModulesPath, '..', '..', moduleDir)
	].forEach(function(dir) 
    {
  		if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) 
  		{
  			versions = versions.concat(fs.readdirSync(dir));
  		}
    });

	// Get the latest version out of the list
	var latest = ['-1'];
	versions.forEach(function(version) 
  {
		var current = version.split('.');
		for (var i = 0; i < current.length; i++) 
		{
			var latestPart, currentPart;
			try 
			{
				latestPart = parseInt(latest[i] || '-1', 10);
				currentPart = parseInt(current[i] || '-1', 10);
			} 
			catch(e) 
			{
				return;
			}

			if (latestPart > currentPart) {
				return;
			} else if (latestPart < currentPart) {
				latest = current;
				return;
			}
		}
	});

	if (latest[0] === '-1') 
	{
		logger.debug('TouchTest: No versions found for module ' + theModule.id);
		return null;
	}

	var finalVersion = latest.join('.');
	logger.debug('TouchTest: Latest Version for module ' + theModule.id + " is " + finalVersion);
	return finalVersion;
}

function createBackup(jar) 
{
	var jarFile = path.join(config.templateDir, jar) + '.jar';
	var jarBakFile = jarFile + '.bak';

	if (!fs.existsSync(jarBakFile)) 
	{
		logger.debug('TouchTest : Creating backup of file: ' + jarFile);
		appc.fs.copyFileSync(jarFile, jarBakFile);
	} 
	else 
	{
		logger.debug('TouchTest : Backpup already present: ' + jarFile);
		appc.fs.copyFileSync(jarBakFile, jarFile);
	}
}

function restore(jar) 
{
	var jarFile = path.join(config.templateDir, jar) + '.jar';
	var jarBakFile = jarFile + '.bak';

	logger.debug('TouchTest : Restoring file: ' + jarFile);
	appc.fs.copyFileSync(jarBakFile, jarFile);
	fs.unlinkSync(jarBakFile);
}

function weaveJar(classpath, inpath, aspectpath, outjar, callback) 
{
	var args = [
		'java',
		'-classpath',
		'"' + classpath + '"',
		'-Xmx256M',
		'org.aspectj.tools.ajc.Main',
		'-Xlint:ignore',
		'-inpath',
		'"' + inpath + '"',
		'-aspectpath',
		'"' + aspectpath + '"',
		'-outjar',
		'"' + outjar + '"'
	];

	logger.debug('Touchtest: weaving jar to create ' + outjar);
	// logger.trace('Touchtest: ' + args.join(' '));
	try 
	{
		exec(args.join(' '), function(err) 
    {
			return callback(err);
		});
	} 
	catch(e) 
	{
		return callback(e);
	}
}

function instrument(classpath, jar, callback) 
{
	var touchtestDir = path.join(config.templateDir, 'touchtest');
	if (!fs.existsSync(touchtestDir)) 
	{
		fs.mkdirSync(touchtestDir);
	}

	var outjar = path.join(config.templateDir, jar) + '.jar',
		inpath = outjar + '.bak',
		aspectpath = path.join(LIB_DIR, 'TouchTestDriver.jar') + SEP + path.join(LIB_DIR, 'TouchTestDriver-Titanium.jar');

	logger.debug('Touchtest: process ' + inpath);
	if (fs.existsSync(outjar)) 
	{
		fs.unlinkSync(outjar);
	}

	weaveJar(classpath, inpath, aspectpath, outjar, callback);
}

function instrumentExternalJars(classpath, jar, callback) 
{
	var inpath = jar + '.original';
	appc.fs.copyFileSync(jar, inpath);

	logger.debug('Touchtest: processing ' + jar);
	var aspectpath = path.join(LIB_DIR, 'TouchTestDriver.jar') + SEP + path.join(LIB_DIR, 'TouchTestDriver-Titanium.jar'),
		outjar = jar;

	if (fs.existsSync(outjar)) 
	{
		fs.unlinkSync(outjar);
	}

	try 
	{
		weaveJar(classpath, inpath, aspectpath, outjar, function(err) 
    {
			if (err) 
			{ 
			  return callback(err); 
		  }

			if (fs.existsSync(inpath)) 
			{
				fs.unlinkSync(inpath);
			}
			return callback();
		});
	} 
	catch (e) 
	{
		logger.error('TouchTest : Unexpected error: ' + JSON.stringify(e));
		logger.error('TouchTest : Exception occured. Restoring ' + jar + ' file.');
		appc.fs.copyFileSync(inpath, jar);
	}
}

function merge(callback) 
{
	logger.debug('Touchtest: Add Touchtest capabilities in ' + config.templateDir + '/titanium.jar');

	var titaniumJar = path.join(config.templateDir, 'titanium.jar');
	var jars = [
		'aspectjrt.jar',
		'TouchTestDriver-APIv12.jar',
		'TouchTestDriver-APIv11.jar',
		'TouchTestDriver-Titanium.jar',
		'TouchTestDriver.jar'
	];
	var jarPaths = [ titaniumJar ];
	jars.forEach(function(j) 
  {
		jarPaths.push(path.join(LIB_DIR, j));
	});

	mergeAll(jarPaths, titaniumJar, callback);
}

function mergeAll(jars, targetJar, callback) 
{
	var tmpJar = targetJar + '.tmp';
	if (fs.existsSync(tmpJar)) 
	{
		fs.unlinkSync(tmpJar);
	}

	jar.extract(jars, function(err, result) 
  {
		if (err)
		{ 
		  throw err; 
	  }
		jar.create(tmpJar, result, function(err) 
    {
			if (err) 
			{ 
			  throw err; 
		  }
			if (fs.existsSync(targetJar)) 
			{
				fs.unlinkSync(targetJar);
			}
			fs.renameSync(tmpJar, targetJar);
			return callback();
		});
	});
}
