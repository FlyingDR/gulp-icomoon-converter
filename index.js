'use strict';

var fs = require('fs');
var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');
var handlebars = require('handlebars');
var merge = require('merge');

var PluginError = gutil.PluginError;
var PLUGIN_NAME = 'gulp-icomoon-converter';

module.exports = function (/** IcomoonConverterOptions*/opts) {
    return through.obj(function (file, enc, cb) {
        if (file.isNull()) {
            return cb(null, file);
        }
        if (file.isStream()) {
            return cb(new PluginError(PLUGIN_NAME, 'Streaming is not supported'));
        }

        /** @type {IcomoonProjectConfig} */
        var icomoon;
        /* @type {IcomoonConverterTemplate} */
        var template;
        /** @type {IcomoonConverterOptions} */
        var options = merge({
            template: 'icons.scss',
            templateVars: {},
            filename: '_font-icons'
        }, opts);

        // Prepare template transformation function
        if (typeof options.template === 'function') {
            // Template is given as transformation function
            template = options.template;
        } else if (typeof options.template === 'string') {
            // This is some kind of template
            var tpl = /** @type {string} */options.template;
            if (tpl.indexOf('{') !== -1) {
                // Template is given explicitly
                template = tpl;
            } else {
                [
                    tpl,
                    __dirname + '/templates/' + tpl + '.hbs'
                ].forEach(function (fp) {
                    if (!template) {
                        try {
                            fs.accessSync(fp, fs.R_OK);
                            template = fs.readFileSync(fp).toString();
                            var ext = tpl.split('.').pop();
                            // Built-in template is used and output filename have no extension - use one defined by template
                            if (fp.match(new RegExp('\\.' + ext + '\\.hbs$')) && options.filename.indexOf('.') === -1) {
                                options.filename += '.' + ext;
                            }
                        } catch (e) {
                        }
                    }
                });
            }
            if (template) {
                // Check if we have any built-in parameters in template
                if (template.match(/^---$/m)) {
                    var params = template.split(/^---[\r\n]*/m, 2);
                    template = params.pop();
                    var tplParams = {};
                    params.shift().split(/[\r\n]+/).forEach(function (param) {
                        var p = param.split(':', 1);
                        var name = p.shift();
                        if (typeof name === 'string' && name.length) {
                            var value = param.substr(name.length + 1);
                            if (typeof value === 'string') {
                                tplParams[name] = value.trim();
                            }
                        }
                    });
                    options.templateVars = merge(true, tplParams, options.templateVars);
                }
                try {
                    template = handlebars.compile(template);
                } catch (e) {
                    return cb(new PluginError(PLUGIN_NAME, 'Failed to compile template, please check if it is valid Handlebars template'));
                }
            } else {
                return cb(new PluginError(PLUGIN_NAME, 'Given font icons list template is either missed or unreadable'));
            }
        } else {
            return cb(new PluginError(PLUGIN_NAME, 'Font icons list template should be given either as filename, name of pre-defined template, explicit template or transformation function'));
        }

        // Load icomoon.io project file
        try {
            icomoon = JSON.parse(file.contents.toString(enc));
        } catch (e) {
            return cb(new PluginError(PLUGIN_NAME, 'Failed to parse IcoMoon project file: ' + e.message));
        }

        // Perform basic validation of project file structure validity
        if (!Array.isArray(icomoon.iconSets) || typeof icomoon.preferences !== 'object') {
            return cb(new PluginError(PLUGIN_NAME, 'IcoMoon project file is either corrupted or have unsupported format'));
        }

        // Prepare template file variables
        //noinspection JSUnresolvedFunction
        var vars = merge.recursive(true, {
            icons: [],
            chars: {
                backslash: '\\',
                openBracket: '{',
                closeBracket: '}'
            }
        }, typeof options.templateVars === 'object' ? options.templateVars : {});

        // Prepare handlers
        var haveIcons = false, haveIconCode = false;
        var handlers = /** @type {IcomoonConverterHandlers} */{};
        var defaultHandlers = /** @type {IcomoonConverterHandlers} */{
            iconSetFilter: function () {
                return true;
            },
            iconFilter: function () {
                return true;
            },
            nameTransformer: function (name) {
                if (typeof name !== 'string') {
                    return '';
                }
                return name.split(',').shift().trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
            },
            iconTransformer: function (info) {
                var code = info.properties.code;
                haveIcons = true;
                haveIconCode |= code !== undefined;
                return {
                    name: handlers.nameTransformer(info.properties.name),
                    code: Number(code || 0).toString(16)
                };
            }
        };
        Object.keys(defaultHandlers).forEach(function (type) {
            handlers[type] = typeof options[type] === 'function' ? options[type] : defaultHandlers[type];
        });


        // Transform icomoon.io icons information into template variables information
        (icomoon.iconSets || []).forEach(function (iconSet) {
            if (typeof iconSet !== 'object' || !Array.isArray(iconSet.icons) || !Array.isArray(iconSet.selection)) {
                return;
            }
            if (handlers.iconSetFilter(iconSet, options)) {
                var info;
                do {
                    info = {
                        icon: iconSet.icons.shift(),
                        properties: iconSet.selection.shift()
                    };
                    if (handlers.iconFilter(info, options)) {
                        if (!Array.isArray(vars.icons)) {
                            vars.icons = [];
                        }
                        vars.icons.push(handlers.iconTransformer(info, options));
                    }
                } while (iconSet.icons.length);
            }
        });

        // Check for common problems with resulted set of icons
        if (handlers.iconTransformer === defaultHandlers.iconTransformer) {
            // We can detected missed icons or unassigned char codes only if we use default transformer
            if (!haveIcons) {
                return cb(new PluginError(PLUGIN_NAME, 'Either no font icons are available or they\'re filtered out, please check your project and settings'));
            } else if (!haveIconCode) {
                return cb(new PluginError(PLUGIN_NAME, 'No char codes are assigned to font icons. Make sure that you have generated icon font before downloading project file'));
            }
        }

        // Generate resulted file from template and variables
        try {
            var result = template(vars);
        } catch (e) {
            return cb(new PluginError(PLUGIN_NAME, 'Error occurs while running transforming icons into file: ' + e.message));
        }

        // Pass it for further processing by Gulp
        cb(null, new gutil.File({
            cwd: file.cwd,
            base: file.base,
            path: path.resolve(file.base, options.filename),
            contents: new Buffer(result)
        }));
    });
};
