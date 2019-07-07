import { IMetaTag } from "./IMetaTag";

export interface INoteMeta {
    version?: string;
    tags: IMetaTag[];
    doc?: string;
}