export interface VSNWVDomain {
    name: string;
    categorys: VSNWVCategory[];
}

export interface VSNWVCategory {
    name: string;
    notes: VSNWVNote[];
}

export interface VSNWVNote {
    id: number;
    contents: string[];
}
