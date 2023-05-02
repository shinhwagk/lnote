import { ArrayLabels } from "../types";

export interface IWebNote {
    nb: string;
    id: string;
    contents: string[]
    doc: boolean;
    files: boolean;
    cts: number;
    mts: number;
    als: ArrayLabels
}