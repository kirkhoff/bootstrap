
// base path, that will be used to resolve files and exclude
basePath = '.';

// list of files / patterns to load in the browser
files = [
  JASMINE,
  JASMINE_ADAPTER,
  'misc/test-lib/jquery-1.8.2.min.js',
  'misc/test-lib/angular.js',
  'misc/test-lib/angular-mocks.js',
  'misc/test-lib/helpers.js',
  'http://ie7-js.googlecode.com/svn/version/2.1(beta4)/IE9.js',
  'http://cdnjs.cloudflare.com/ajax/libs/es5-shim/1.2.4/es5-shim.min.js',
  'dist/ieshiv-*.js',
  'src/**/*.js',
  'template/**/*.js'
];

// list of files to exclude
exclude = [
  //ieshiv was included, be sure to exclude minified version otherwise it will be included 2 times
  'dist/ieshiv-*.min.js'
];

// Start these browsers, currently available:
// - Chrome
// - ChromeCanary
// - Firefox
// - Opera
// - Safari
// - PhantomJS
browsers = [
  
];

// test results reporter to use
// possible values: dots || progress
reporter = 'progress';

// web server port
port = 9018;

// cli runner port
runnerPort = 9100;

// enable / disable colors in the output (reporters and logs)
colors = true;

// level of logging
// possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
logLevel = LOG_INFO;

// enable / disable watching file and executing tests whenever any file changes
autoWatch = true;

// Continuous Integration mode
// if true, it capture browsers, run tests and exit
singleRun = false;

