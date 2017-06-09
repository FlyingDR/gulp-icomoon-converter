# gulp-icomoon-converter
Gulp plugin for converting [icomoon.io](https://icomoon.io/app/) project files into information about font icons.

# Purpose
When using font icons into CSS it is normally desirable to refer these icons by names rather then by codes, especially if CSS code is compiled by some CSS preprocessor. This plugins aims to provide you with such ability by converting information about icons into format, suitable for further use. Main purpose is to provide information for CSS pre-processors in a form of variables / lists, but plugin is flexible enough to be able to convert information into other formats too.  

# Options
Plugin behavior is controlled by options. There is [TypeScript interfaces definition](gulp-icomoon-converter.d.ts) is available for formal description if necessary.

## template
Type: [`IcomoonConverterTemplate`](gulp-icomoon-converter.d.ts)

Template to use for rendering information about font icons. Plugin uses [Handlebars](http://handlebarsjs.com/) as template engine, but can use other renderers too. 

Template can be passed into one of the following formats:
  1. Name of one of [built-in](templates) templates (without `.hbs` extension). This is default mode and default template is [icons.scss](templates/icons.scss.hbs) that is defined by name `icons.scss`.
  2. Path to any custom Handlebars template to use
  3. String with inline Handlebars template to use
  4. Function to use for rendering template. Function signature type is [`ICTemplateRenderer`](gulp-icomoon-converter.d.ts).
  
There is [pre-defined templates](templates) to render list of font icons as set of variables for [SCSS](templates/icons.scss.hbs), [Stylus](templates/icons.styl.hbs), [Less](templates/icons.less.hbs) and [CSS](templates/icons.css.hbs). There is also templates to render font icons as [SCSS list](templates/icons-list.scss.hbs), [Stylus hash](templates/icons-list.styl.hbs) and [JSON](templates/icons.json.hbs).   
  
## templateVars
Type [`IcomoonConverterTemplateVars`](gulp-icomoon-converter.d.ts)

Additional variables to pass to template renderer along with information extracted from icomoon.io project file. It is advisable that default default template vars `icons` and `chars` are not get overridden.

It should be also noted that some built-in templates (and custom templates if needed) can provide their own template variables. These are defined as `name: value` pairs at the top of template (one variable per line) and separated from template itself by `---` line. Example:
```
variable1: value1
variable2: value2
---
{{variable1}} {{variable2}}
```
Live example can be seen, for example, [here](templates/icons-list.scss.hbs). 

## filename
Type ```String```
Name of target file. When plugin uses [built-in template](templates) for rendering - it is possible to omit file extension in filename, in this case file extension will be taken from template itself. For example for configuration like:
```
template: 'icons.scss',
filename: 'icons',
```
resulted file name will be `icons.scss`.

## iconSetFilter
Type [`IcomoonConverterFilters.iconSetFilter`](gulp-icomoon-converter.d.ts)
Filter function to decide if given icon set should be includes into resulted file. Receives [`IcomoonProjectIconSet`](icomoon-project.d.ts) with icon set configuration from icomoon.io project file and plugin's options. Should return `Boolean`. By default all icon sets are accepted.

## iconFilter
Type [`IcomoonConverterFilters.iconFilter`](gulp-icomoon-converter.d.ts)
Filter function to decide if given icon should be included into resulted file. Receives [`IcomoonConverterIconInfo`](gulp-icomoon-converter.d.ts) with icon information from icomoon.io project file and plugin's options. Should return ```Boolean```.
By default all icons are accepted.

## nameTransformer
Type [`IcomoonConverterTransformers.nameTransformer`](gulp-icomoon-converter.d.ts)
Icon name transformation function. Receives icon name, icon information ([`IcomoonConverterIconInfo`](gulp-icomoon-converter.d.ts)) and plugin's options. Should return `String` with icon's name to use in template. By default icon name is converted into lower case with dash as separator.

## iconTransformer
Type [`IcomoonConverterTransformers.iconTransformer`](gulp-icomoon-converter.d.ts)
Icon information transformation function. icon information ([`IcomoonConverterIconInfo`](gulp-icomoon-converter.d.ts)) and plugin's options. Should return icon information suitable for use in template ([`ICIconTemplateInfo`](gulp-icomoon-converter.d.ts)).

# Use with Gulp
Normally practical scenario with dealing with font icons from icomoon.io includes 2 steps:
 1. Extraction of font files with icons somewhere into project
 2. Construction of references to icons in these font files into project's CSS code
 
Both steps are pretty easy to implement, but good example always may help. Example of Gulp task that implements both steps with use of this plugin along with example of exported icomoon.io project can be found in [example](example) directory of the repository. Required dependencies for running this example are listed into `devDependencies` section of [package.json](package.json). Of course you will also need to include plugin itself into your project.

Plugin by itself requires only icomoon.io project file to be available, but it have little meaning without font files with icons. Hence you normally need to put both files (project file in JSON format and fonts distributive in ZIP format) into your project.
  
**IMPORTANT:** You need to perform these steps in icomoon.io application in order to be able to get correct results from use of this plugin and example Gulp task:   
 1. Select all icons that you plan to use on your site by using "Select" tool
 2. Click on "Generate Font" tab at the bottom of the screen
 3. Click on "Download" button to get font files distributive and put received ZIP file into your project 
 4. Click on "Manage project" icon near your project name at the top right corner of the screen
 5. Download your project file and put received JSON file into your project

It is important that you **generate font before downloading project**! Icomoon assigns character codes for icons only at a time of font generation and if you will download project before generating font - you will get no character codes or they may be broken.  
