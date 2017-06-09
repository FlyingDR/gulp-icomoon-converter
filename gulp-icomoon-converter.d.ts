
type ICFilename = string;
type ICBuiltInTemplate = string;
type ICInlineTemplate = string;
type ICTemplateRenderer = (vars: IcomoonConverterTemplateVars) => string;

type IcomoonConverterTemplate = ICFilename | ICBuiltInTemplate | ICInlineTemplate | ICTemplateRenderer;

interface ICIconInfo {
    icon: IcomoonProjectIcon,
    properties: IcomoonProjectSelection,
}

interface ICIconTemplateInfo {
    name: string,
    code: string,
}

interface ICCharsTemplateInfo {
    backslash: string,
    openBracket: string,
    closeBracket: string,
}

interface IcomoonConverterTemplateVars {
    icons: ICIconTemplateInfo[],
    chars: ICCharsTemplateInfo,
    [name: string]: any,
}

interface IcomoonConverterCustomOptions {
    [name: string]: any,
}

interface IcomoonConverterFilters {
    iconSetFilter?: (iconSet: IcomoonProjectIconSet, options?: IcomoonConverterCustomOptions) => boolean,
    iconFilter?: (iconInfo: ICIconInfo, options?: IcomoonConverterCustomOptions) => boolean,
}

interface IcomoonConverterTransformers {
    nameTransformer?: (name: string, iconInfo?: ICIconInfo, options?: IcomoonConverterCustomOptions) => string,
    iconTransformer?: (icon: ICIconInfo, options?: IcomoonConverterCustomOptions) => ICIconTemplateInfo,
}

interface IcomoonConverterHandlers extends IcomoonConverterFilters, IcomoonConverterTransformers {

}

interface IcomoonConverterOptions extends IcomoonConverterHandlers, IcomoonConverterCustomOptions {
    template?: IcomoonConverterTemplate,
    templateVars?: IcomoonConverterTemplateVars,
    filename?: string,
}
