declare function acquireVsCodeApi(): VsCode;

declare interface VsCode {
    postMessage(message: any): void;
}
