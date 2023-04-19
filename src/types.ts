export type ArrayLabels = string[];
export type GroupLables = { [gl: string]: string[] };

export interface INBNote {
    contents: string[];
    cts: number;
    mts: number;
    labels: GroupLables; // label group
}
// export type NoteDataLabel = { [gl: string]: string[] };
// export type EditKind = 'NotesSetCommonGroupLabels' | 'NoteData' | 'DomainGroupLabel' = 'DomainGroupLabel'