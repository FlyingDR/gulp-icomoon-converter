# gulp-icomoon-converter
Gulp plugin for converting IcoMoon configuration files based on given template file. Both IcoMoon project files and IcoMoon selection files are supported.

# Options
Plugin behavior is controlled by following options

## template
Type ```String```
Template to use for conversion. Plugin uses [Handlebars](http://handlebarsjs.com/) as template engine. Default template converts icons into list of SCSS variables. By default template receives only two variables:
 - ```prefix``` - prefix for icon names, either [given explicitly](./README.md#prefix) or taken from IcoMoon configuration
 - ```icons``` - array of information about icons. Each entry contains ```name``` and ```code``` properties.
However it can be changed by providing [custom template vars](./README.md#templateVars) or even [custom information transformer](./README.md#transform).

## templateVars
Type ```Object```
Additional variables to pass to template for rendering.

## prefix
Type ```String```
Prefix for icon names. If not defined - prefix will be taken from IcoMoon configuration file.

## filename
Type ```String```
Name of target file.

## iconSetFilter
Type ```Function```
Filter function to decide what icon sets should be includes into resulted file. Receives ```Object``` with icon set configuration from IcoMoon configuration file, should return ```Boolean```. By default all icon sets are accepted. Only called for complete IcoMoon configuration files, not used for selection files.

## iconFilter
Type ```Function```
Filter function to decide what icons should be includes into resulted file. Receives ```Object``` with following information: 
 - ```icon``` - Information about icon itself, example can be seen by path like ```iconSets[0].icons[0]``` into IcoMoon configuration file
 - ```selection``` - Information about icon selection properties, example can be seen by path like ```iconSets[0].selection[0]``` into IcoMoon configuration file.
Should return ```Boolean```.
By default all icons are accepted, if you want to accept only selected icons - you can pass following function as icon filter: 
```js
function(info) {
  return info.selection.order > 0;
}
```

## transform
Type ```Function```
Function to transform icon information into ```Object``` with icon information that will be passed into template. Receives ```Object``` with icon information as single argument, structure is same as for [iconFilter](./README.md#iconFilter) function. 
Should return ```Object```.
