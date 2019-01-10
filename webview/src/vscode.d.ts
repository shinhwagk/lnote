declare function acquireVsCodeApi(): vscode;

declare interface vscode {
    postMessage(message: any): void;
}
