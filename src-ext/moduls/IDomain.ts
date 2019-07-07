export interface IDomain {
    '.notes': string[];
    [domain: string]: string[] | IDomain;
}