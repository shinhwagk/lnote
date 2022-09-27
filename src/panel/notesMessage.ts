export namespace ToWebView {
    export interface WVNote {
        nId: string;
        contents: string[];
        doc: boolean;
        files: boolean;
        labels?: string[];
        cDate: string;
        mDate: string;
    }

    export interface WVCategory {
        name: string;
        labels: string[];
        notes: WVNote[];
    }

    export interface WVDomain {
        dpath: string[];
        categories: WVCategory[];
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
