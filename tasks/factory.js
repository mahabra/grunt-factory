/*
 * grunt-factory
 * https://github.com/morulus/factory
 *
 * Copyright (c) 2015 Vladimir Morulus
 * Licensed under the MIT license.
 */

'use strict';
var path = require('path');
var fs = require('fs');

module.exports = function (grunt) {
	grunt.registerMultiTask('factory', 'execute code in node', function () {

		// Tell grunt this task is asynchronous.
    	var task=this, done = this.async(),processes=0;

    	if (!this.data.contents) {
			 grunt.log.warn('Template file not specified');
			 return false;
		}

		if (!this.data.contents) {
			 grunt.log.warn('Content not specified');
			 return false;
		}

		if (!this.data.dist) {
			grunt.log.warn('Destination folder not specified');
			 return false;
		}

		require(__dirname+'/lib/factory.js')({
			task: task,
			grunt: grunt,
			cwd: process.cwd()
		}, done);
		return true;
	});
};