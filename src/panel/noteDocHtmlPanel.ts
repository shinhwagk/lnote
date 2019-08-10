import { basename } from 'path';
import * as vscode from 'vscode';
import { ext } from '../extensionVariables';

const viewType = 'htmlShowPreview';
const title = viewType;

let _panel: vscode.WebviewPanel | undefined;
const _disposables: vscode.Disposable[] = [];

export function noteDocHtmlPanel(htmlFile: string) {
    if (_panel) {
        _update(_panel!, htmlFile);
        return;
    }
    _panel = createPanel();
    noteDocHtmlPanel(htmlFile);
}

function createPanel() {
    const panel = vscode.window.createWebviewPanel(viewType, title, vscode.ViewColumn.Two, {
        localResourceRoots: [vscode.Uri.file(ext.masterPath)]
    });
    panel.onDidDispose(() => _dispose(), null, _disposables);
    return panel;
}

function _dispose() {
    _panel = undefined;
    _disposables.forEach(d => d.dispose());
}

function _update(panel: vscode.WebviewPanel, htmlFile: string) {
    panel.title = 'vscode-note' + ' -> ' + basename(htmlFile);
    panel.webview.html = _getHtmlForWebview(htmlFile);
}

function _getHtmlForWebview(htmlFile: string) {
    const onDiskPath = vscode.Uri.file(htmlFile);
    const src = onDiskPath.with({ scheme: 'vscode-resource' });
    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Cat Coding13</title>
            <style>
                body.vscode-dark { background-color: white; }
                body, html {
                    margin: 0;
                    padding: 0;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                }
            </style>
        </head>
        <body>
            <iframe src="${src}" width="100%" height="100%" seamless frameborder=0></iframe>
        </body>
        </html>`;
}
