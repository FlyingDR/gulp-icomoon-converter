interface IcomoonProjectSelection {
    id: number,
    name: string,
    order: number,
    prevSize: number,
    code?: number,
    tempChar?: string,
    ligatures?: string,
}

interface IcomoonProjectIcon {
    id: number,
    paths: string[],
    attrs: string[],
    isMulticolor: boolean,
    isMulticolor2: boolean,
    tags: string[],
    defaultCode: number,
    grid: number,
}

interface IcomoonProjectIconSetMetadata {
    name: string,
}

interface IcomoonProjectIconSet {
    id: number,
    metadata: IcomoonProjectIconSetMetadata,
    height: number,
    prevSize: number,
    colorThemes: string[],
    selection: IcomoonProjectSelection[],
    icons: IcomoonProjectIcon[],
}

interface IcomoonProjectConfig {
    metadata: object,
    iconSets: IcomoonProjectIconSet[],
    uid: number,
    preferences: object,
}
