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
            return cb(new PluginError(PLUGIN_NAME, 'Streaming not supported'));
        }

        var options, icomoon, vars, template, iconSetFilter, iconFilter;
        //noinspection JSUnusedLocalSymbols,JSLint
        options = merge({
            template: __dirname + '/template/icomoon-icons.mustache',
            templateVars: {},
            prefix: undefined,
            filename: '_icomoon-icons.scss',
            iconSetFilter: undefined,
            iconFilter: undefined,
            transform: function (info) {
                return {
                    name: info.selection.name || undefined,
                    code: '\\' + Number(info.selection.code || 0).toString(16)
                };
            }
        }, opts);
        if (options.template === undefined) {
            return cb(new PluginError(PLUGIN_NAME, 'No template is defined'));
        }
        try {
            //noinspection JSLint
            fs.accessSync(options.template, fs.R_OK);
        } catch (e) {
            return cb(new PluginError(PLUGIN_NAME, 'Given template file is either missed ot unreadable'));
        }
        try {
            icomoon = JSON.parse(file.contents.toString(enc));
        } catch (e) {
            return cb(new PluginError(PLUGIN_NAME, 'Failed to parse IcoMoon JSON: ' + e.message));
        }
        vars = merge(options.templateVars || {}, {
            prefix: (options.prefix !== undefined) ? options.prefix : icomoon.preferences.imagePref.prefix,
            icons: []
        });
        iconSetFilter = (typeof options.iconSetFilter === 'function') ? options.iconSetFilter : function () {
            return true;
        };
        iconFilter = (typeof options.iconFilter === 'function') ? options.iconFilter : function () {
            return true;
        };
        //noinspection JSUnresolvedVariable
        if ((icomoon.IcoMoonType || false) === 'selection') {
            (icomoon.icons || []).forEach(function (icon) {
                var info = {
                    icon: icon.icon,
                    selection: icon.selection
                };
                if (iconFilter(info)) {
                    vars.icons.push(options.transform(info));
                }
            });
        } else {
            //noinspection JSUnresolvedVariable
            (icomoon.iconSets || []).forEach(function (iconSet) {
                if (iconSetFilter(iconSet)) {
                    var info;
                    do {
                        info = {
                            icon: iconSet.icons.shift(),
                            selection: iconSet.selection.shift()
                        };
                        if (iconFilter(info)) {
                            vars.icons.push(options.transform(info));
                        }
                    } while (iconSet.icons.length);
                }
            });
        }

        //noinspection JSUnresolvedFunction,JSLint
        template = handlebars.compile(fs.readFileSync(options.template).toString());
        cb(null, new gutil.File({
            cwd: file.cwd,
            base: file.base,
            path: file.base + options.filename,
            contents: new Buffer(template(vars))
        }));
    });
};
