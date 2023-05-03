export type ArrayLabel = string; // exp: "group->label"
export type ArrayLabels = ArrayLabel[];
export type GroupLables = { [g: string]: string[] };

export type DomainNode = string;
export type DomainNodeSplit = string[];

// used note permanent
export interface INBNote {
    contents: string[];
    cts: number;
    mts: number;
    gls: GroupLables; // label group
}

export type NoteId = string;

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

export interface IEditNote {
    nb: string,
    id: string,
    gls: GroupLables,
    contents: string[]
}

export interface IEditNotesGls {
    nb: string,
    ids: string[],
    gls: GroupLables,
}

export type IEditor = 'note' | 'notesgls' | 'domaingls';
// export type NoteDataLabel = { [gl: string]: string[] };
// export type EditKind = 'NotesSetCommonGroupLabels' | 'NoteData' | 'DomainGroupLabel' = 'DomainGroupLabel'