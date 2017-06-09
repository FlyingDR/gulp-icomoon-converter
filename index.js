'use strict';

var fs = require('fs');
var gutil = require('gulp-util');
var through = require('through2');
var handlebars = require('handlebars');
var merge = require('merge');

var PluginError = gutil.PluginError;
var PLUGIN_NAME = 'gulp-icomoon-converter';

module.exports = function (opts) {
    return through.obj(function (file, enc, cb) {
        if (file.isNull()) {
            return cb(null, file);
        }
        if (file.isStream()) {
            return cb(new PluginError(PLUGIN_NAME, 'Streaming is not supported'));
        }

        var icomoon, template;
        //noinspection JSUnusedLocalSymbols
        var options = merge({
            template: 'icons.scss',
            templateVars: {},
            separator: undefined,
            filename: '_font-icons',
            iconSetFilter: undefined,
            iconFilter: undefined,
            transform: undefined
        }, opts);

        // Prepare template transformation function
        if (typeof options.template === 'function') {
            // Template is given as transformation function 
            template = options.template;
        } else if (typeof options.template === 'string') {
            // This is some kind of template
            if (options.template.indexOf('{') !== -1) {
                // Template is given explicitly
                template = options.template;
            } else {
                [
                    options.template,
                    __dirname + '/templates/' + options.template + '.hbs'
                ].forEach(function (fp) {
                    if (!template) {
                        try {
                            fs.accessSync(fp, fs.R_OK);
                            template = fs.readFileSync(fp).toString();
                            var ext = options.template.split('.').pop();
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
                    var tplParams = {} ;
                    params.shift().split(/[\r\n]+/).forEach(function (param) {
                        var p = param.split(':', 2);
                        var name = p.shift();
                        if (typeof name === 'string' && name.length) {
                            var value = p.shift();
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
        //noinspection JSUnresolvedVariable
        if (!Array.isArray(icomoon.iconSets) || typeof icomoon.preferences !== 'object') {
            return cb(new PluginError(PLUGIN_NAME, 'IcoMoon project file is either corrupted or have unsupported format'));
        }

        // Prepare template file variables
        //noinspection JSUnresolvedVariable
        var vars = merge.recursive(true, {
            icons: [],
            chars: {
                backslash: '\\',
                openBracket: '{',
                closeBracket: '}'
            }
        }, typeof options.templateVars === 'object' ? options.templateVars : {});

        // Prepare filtering functions
        var iconSetFilter = typeof options.iconSetFilter === 'function' ? options.iconSetFilter : function () {
            return true;
        };
        var iconFilter = typeof options.iconFilter === 'function' ? options.iconFilter : function () {
            return true;
        };

        // Prepare icon information transformer
        var haveIcons = false, haveIconCode = false;
        var defaultTransformer = function (info, options) {
            var name = info.properties.name || undefined;
            name = name.split(',').shift().trim().toLowerCase();
            if (options.separator !== undefined) {
                name = name.replace(/[^a-z0-9]+/g, options.separator);
            }
            var code = info.properties.code;
            haveIcons = true;
            haveIconCode |= code !== undefined;
            return {
                name: name,
                code: Number(code || 0).toString(16)
            };
        };
        var iconTransformer = defaultTransformer;
        if (typeof options.transform === 'function') {
            iconTransformer = options.transform;
        }

        // Transform icomoon.io icons information into template variables information
        //noinspection JSUnresolvedVariable
        (icomoon.iconSets || []).forEach(function (iconSet) {
            if (typeof iconSet !== 'object' || !Array.isArray(iconSet.icons) || !Array.isArray(iconSet.selection)) {
                return;
            }
            if (iconSetFilter(iconSet, options)) {
                var info;
                do {
                    info = {
                        icon: iconSet.icons.shift(),
                        properties: iconSet.selection.shift()
                    };
                    if (iconFilter(info, options)) {
                        if (!Array.isArray(vars.icons)) {
                            vars.icons = [];
                        }
                        vars.icons.push(iconTransformer(info, options));
                    }
                } while (iconSet.icons.length);
            }
        });

        // Check for common problems with resulted set of icons
        if (iconTransformer === defaultTransformer) {
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
        //noinspection JSUnresolvedFunction
        cb(null, new gutil.File({
            cwd: file.cwd,
            base: file.base,
            path: file.base + options.filename,
            contents: new Buffer(result)
        }));
    });
};
