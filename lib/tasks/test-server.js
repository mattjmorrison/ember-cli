'use strict';

var TestTask = require('./test');
var Promise  = require('../ext/promise');
var rimraf   = Promise.denodeify(require('rimraf'));
var chalk    = require('chalk');

module.exports = TestTask.extend({
  init: function() {
    this.runner = this.runner || new (require('testem'))();
  },
  invokeRunner: function(options) {
    this.runner.startDev(this.runnerOptions(options), function(code) {
      rimraf(options.outputPath)
        .finally(function() {
          process.exit(code);
        });
    });
  },
  run: function(options) {
    var ui = this.ui;
    var runner = this.runner;
    var self = this;

    // The building has actually started already, but we want some output while we wait for the server
    ui.startProgress(chalk.green('Building'), chalk.green('.'));

    return new Promise(function() {
      var watcher = options.watcher;
      var started = false;

      // Wait for a build and then either start or restart the runner
      watcher.on('change', function() {
        if (started) {
          runner.restart();
        } else {
          started = true;

          ui.stopProgress();
          self.invokeRunner(options);
        }
      });
    });
  }
});
