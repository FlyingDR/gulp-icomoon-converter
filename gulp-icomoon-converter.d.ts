
type ICFilename = string;
type ICBuiltInTemplate = string;
type ICInlineTemplate = string;
type ICTemplateRenderer = (vars: IcomoonConverterTemplateVars) => string;

type IcomoonConverterTemplate = ICFilename | ICBuiltInTemplate | ICInlineTemplate | ICTemplateRenderer;

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

interface IcomoonConverterIconInfo {
    icon: IcomoonProjectIcon,
    properties: IcomoonProjectSelection,
}

interface IcomoonConverterCustomOptions {
    [name: string]: any,
}

interface IcomoonConverterFilters {
    iconSetFilter?: (iconSet: IcomoonProjectIconSet, options?: IcomoonConverterCustomOptions) => boolean,
    iconFilter?: (iconInfo: IcomoonConverterIconInfo, options?: IcomoonConverterCustomOptions) => boolean,
}

interface IcomoonConverterTransformers {
    nameTransformer?: (name: string, iconInfo?: IcomoonConverterIconInfo, options?: IcomoonConverterCustomOptions) => string,
    iconTransformer?: (icon: IcomoonConverterIconInfo, options?: IcomoonConverterCustomOptions) => ICIconTemplateInfo,
}

interface IcomoonConverterHandlers extends IcomoonConverterFilters, IcomoonConverterTransformers {

}

interface IcomoonConverterOptions extends IcomoonConverterHandlers, IcomoonConverterCustomOptions {
    template?: IcomoonConverterTemplate,
    templateVars?: IcomoonConverterTemplateVars,
    filename?: string,
}
