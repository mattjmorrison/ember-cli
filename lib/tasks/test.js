'use strict';

var Task        = require('../models/task');
var Promise     = require('../ext/promise');
var SilentError = require('../errors/silent');

module.exports = Task.extend({
  init: function() {
    this.runner = this.runner || new (require('testem'))(); // TODO: make generic
  },
  invokeRunner: function (options) {
    var runner = this.runner;

    return new Promise(function(resolve, reject) {
      runner.startCI(this.runnerOptions(options), function(exitCode) {
        if (!runner.app.reporter.total) {
          reject(new SilentError('No tests were run, please check whether any errors occurred in the page (ember test --server) and ensure that you have a test launcher (e.g. PhantomJS) enabled.'));
        }

        resolve(exitCode);
      });
    }.bind(this));
  },

  addonMiddlewares: function() {
    this.project.initializeAddons();

    return this.project.addons.reduce(function(addons, addon) {
      if (addon.runnerMiddleware) {
        addons.push(addon.runnerMiddleware.bind(addon));
      }

      return addons;
    }, []);
  },

  runnerOptions: function(options) {
    return {
      file: options.configFile,
      port: options.port,
      cwd: options.outputPath,
      middleware: this.addonMiddlewares()
    };
  },

  run: function(options) {
    return this.invokeRunner(options);
  }
});
