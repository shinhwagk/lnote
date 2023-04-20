import { ArrayLabels } from "../types";

export interface IWebNote {
    nb: string;
    nid: string;
    contents: string[];
    doc: boolean;
    files: boolean;
    cts: number;
    mts: number;
    labels: ArrayLabels
}