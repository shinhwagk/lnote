export namespace ToWebView {
    export interface WVDomain {
        dpath: string[];
        categories: WVCategory[];
    }

    export interface WVCategory {
        name: string;
        notes: WVNote[];
    }

    export interface WVNote {
        nId: string;
        contents: string[];
        doc: boolean;
        files: boolean;
    }

    export interface DomainData {
        command: 'data';
        data: WVDomain;
    }
}

// export namespace ToExtension {
//     export interface WebReady {
//         command: 'ready';
//         data: boolean;
//     }
//     export interface EditNote {
//         command: 'edit';
//         data: number;
//     }
// }
