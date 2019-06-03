//jshint strict: false
module.exports = function(config) {
  config.set({

    basePath: './app',

    files: [

      'lib/angular/angular.js',
      'lib/angular-route/angular-route.js',
      '../node_modules/angular-mocks/angular-mocks.js',
      '../node_modules/js-sha256/src/sha256.js',
      'app.js',
      '*/*.js',

    ],

    autoWatch: true,

    frameworks: ['jasmine'],

    browsers: ['Chrome'],

    plugins: [
      'karma-chrome-launcher',
      'karma-jasmine',
      'karma-coverage'
    ],

    reporters: ['progress', 'coverage'],


    preprocessors: {
      '*/!(*spec|*mock).js': ['coverage'],
    },

    coverageReporter: {
      type : 'html',
      dir : 'coverage/'
    },
  });
};
