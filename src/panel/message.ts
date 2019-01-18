export namespace ToWebView {
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

    export interface DomainData {
        command: 'domain-data';
        data: VSNWVDomain;
    }
}

export namespace ToExtension {
    export interface WebReady {
        command: 'ready';
        data: boolean;
    }
}
