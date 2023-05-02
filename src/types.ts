export type ArrayLabel = string; // exp: "group->label"
export type ArrayLabels = ArrayLabel[];
export type GroupLables = { [g: string]: string[] };

export interface INBNote {
    contents: string[];
    cts: number;
    mts: number;
    gls: GroupLables; // label group
}

export type NoteId = string;
// export type NoteDataLabel = { [gl: string]: string[] };
// export type EditKind = 'NotesSetCommonGroupLabels' | 'NoteData' | 'DomainGroupLabel' = 'DomainGroupLabel'