export namespace ToWebView {
    export interface VSNWVDomain {
        name: string;
        categorys: VSNWVCategory[];
    }

    export interface VSNWVCategory {
        name?: string;
        notes: VSNWVNote[];
    }

    export interface VSNWVNote {
        id: string;
        contents: string[];
        doc: boolean;
        files: boolean;
    }

    export interface DomainData {
        command: 'data';
        data: VSNWVDomain;
    }
}

export namespace ToExtension {
    export interface WebReady {
        command: 'ready';
        data: boolean;
    }
    export interface EditNote {
        command: 'edit';
        data: number;
    }
}
