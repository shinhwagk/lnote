export interface IMetaTag {
    domain: string[];
    category: string;
    links?: string[]; // link to other note
    weight?: number; // sort at category
    valid?: boolean; // when note deleted
}