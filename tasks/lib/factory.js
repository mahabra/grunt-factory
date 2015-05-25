var HTMLParser = require('fast-html-parser');
var fs = require('fs');
var emitter = require('event-emitter')({});
var _ = require('underscore');
var extend = require('extend');
var path = require('path');
var prettify = require('js-beautify').html;
var sct = ['wbr','track','source','param','keygen','area','img','base','br','col','command','embed','input', 'meta', 'link', 'hr', 'base', 'embed', 'spacer']; // Self closing tags

module.exports = function(api, done) {
	var template;

	// Fix prettify option
	if (api.task.data.options.prettify===true) api.task.data.options.prettify = {};

	var options = extend({
		template: path.resolve(process.cwd()+'/'+api.task.data.template),
		contents: path.resolve(process.cwd()+'/'+api.task.data.contents),
		dist: path.resolve(process.cwd()+'/'+api.task.data.dist),
		prettify: {
			indent_size: 2,
		    condense: true,
		    padcomments: false,
		    preserveBOM: false,
		    indent_char: "	",
		    indent_inner_html: false,
		    indent_scripts: "keep",
		    brace_style: "expand",
		    preserve_newline: true,
		    max_preserve_newline: 0,
		    wrap_line_length: 0
		}
	}, api.task.data.options||{});

	var dataToRawAttr = function(data) {
		var raw = [];
		for (var prop in data) {
			if (data.hasOwnProperty(prop)) {
				raw.push(prop+"="+(data[prop].substr(0,1)==='"' ? data[prop] : '"'+data[prop]+'"'));
			}
		}

		return raw.join(' ');
	}

	var repairNodeContent = function(node) {		
		if (node.childNodes) {
			var html = [],tag;
			node.childNodes.forEach(function(subnode) {
				if ("undefined"===typeof subnode.tagName) {
					if (!/^[ \t\v\r\n\f]*$/.test(subnode.text))
					html.push(subnode.text.trim());
				} else {
					tag=[];
					tag.push('<'+subnode.tagName);
					
					for (var prop in subnode.attributes) if (subnode.attributes.hasOwnProperty(prop)) {
						tag.push(' '+dataToRawAttr(subnode.attributes)); break;
					}
					
					if (sct.indexOf(subnode.tagName.toLowerCase())>-1) {
						tag.push(' />');
					} else {
						tag.push('>');
						tag.push(repairNodeContent(subnode));
						tag.push('</'+subnode.tagName+'>')
					}
					
					html.push(tag.join(''));
				}
			});
			return html.join("\n");
		} else {
			return node;
		}
	}

	var stampFile = function(template, content, cb) {
			var root = HTMLParser.parse(content),
			contents = {},result;
			root.childNodes.forEach(function(node) {
				if ("undefined"!==typeof node.tagName) {
					contents[node.tagName] = repairNodeContent(node);
				}
			});
			result = template(contents);
			// Prettify html
			if (options.prettify!==false) {
				result = cb(prettify(result, options.prettify));
			}
			return result;
	}

	var files=0, complete = function() {
		files--; if (files===0) done();
	};

	// Get template
	fs.readFile(options.template, 'utf-8', function(err, templateContent) {
		template = _.template(templateContent);
		fs.readdir(options.contents, function(err, result) {
			if (result instanceof Array) result.forEach(function(fn) {
				fs.readFile(options.contents+'/'+fn, 'utf-8', function(err, content) {
					if (err) {
						api.grunt.fail.warn('file does not exist ' + __dirname+'/pages/'+fn);
						done(); return false;
					} else {
						files++;
						stampFile(template, content, function(fileImage) {

							fs.writeFile(options.dist+'/'+fn, fileImage, function(err) {
								if (err) {
									api.grunt.fail.warn('Error creating file '+String(options.dist+'/'+fn).white);
								} else {
									api.grunt.log.writeln ('Created '.white + String(options.dist+'/'+fn).cyan);
								}

								complete();
							});
						});
					}
				});
			});
		});
	});
}
 
 /*
var root = HTMLParser.parse('<ul id="list"><li>Hello World</li></ul>');
 
console.log(root.firstChild.structure);
*/