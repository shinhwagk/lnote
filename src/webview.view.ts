import * as path from 'path';

import * as vscode from 'vscode';

import { VSNDatabase, VSNNote } from './database';
import { VSNWVCategory, VSNWVDomain, VSNWVNote } from './webview/lib';

function assetsFile(extensionPath: string, name: string): string {
    const file = path.join(extensionPath, 'out', name);
    return vscode.Uri.file(file)
        .with({
            scheme: 'vscode-resource'
        })
        .toString();
}

function getWebviewContent(extPath: string) {
    const scriptPath = assetsFile(extPath, 'main.wv.js');
    const reactPath = assetsFile(extPath, 'react.production.min.js');
    const reactDompath = assetsFile(extPath, 'react-dom.production.min.js');
    return `<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cat Coding</title>
        <script src="${reactPath}" crossorigin></script>
        <script src="${reactDompath}" crossorigin></script>
	</head>
    <body>
        <div id="root"></div>
        <script src="${scriptPath}"></script>
	</body>
	</html>`;
}

class PanelState {
    public panel: vscode.WebviewPanel | undefined = undefined;
    private state: boolean = false;
    private trayCnt: number = 0;
    private extensionPath: string;

    constructor(extensionPath: string) {
        this.extensionPath = extensionPath;
    }

    listener = () => {
        this.panel = undefined;
        this.state = false;
        console.log('vsnote webview closed.');
    };

    createPanel() {
        this.panel = vscode.window.createWebviewPanel('catCoding', 'vs notes', vscode.ViewColumn.One, {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(path.join(this.extensionPath, 'out'))]
        });
    }

    updateWebviewContent(domain: VSNWVDomain): void {
        if (this.trayCnt >= 50) {
            vscode.window.showErrorMessage('webview update failse 50 times.');
            return;
        }
        if (!this.state) {
            setTimeout(() => this.updateWebviewContent(domain), 100);
            this.trayCnt += 1;
            return;
        }
        if (this.panel) {
            vscode.window.showInformationMessage(`success ${this.trayCnt}`);
            vscode.window.showInformationMessage('post message.');
            this.panel!.webview.postMessage(domain);
        }
    }

    didReceiveMessage(context) {
        this.panel.webview.onDidReceiveMessage(
            message => {
                if (message.state) {
                    this.state = true;
                }
            },
            undefined,
            context.subscriptions
        );
    }

    html() {
        this.panel.webview.html = getWebviewContent(this.extensionPath);
    }
}

export function VSNWebviewView(context: vscode.ExtensionContext, db: VSNDatabase) {
    const panelState = new PanelState(context.extensionPath);
    context.subscriptions.push(
        vscode.commands.registerCommand('updateOrCreateWebview', (dpath: string) => {
            if (!panelState.panel) {
                panelState.createPanel();
                panelState.panel.onDidDispose(panelState.listener, null, context.subscriptions);
                panelState.didReceiveMessage(context);
                panelState.html();
            }

            const notes: VSNNote[] = db.selectNotes(dpath);
            const categorys: VSNWVCategory[] = fusionNote(notes);
            const domain: VSNWVDomain = {
                name: dpath,
                categorys: [{ name: 'install', notes: [{ id: 1, contents: ['dfdf', 'dfd'] }] }]
            };
            panelState.updateWebviewContent(domain);
        })
    );
}

function fusionNote(ns: VSNNote[]): VSNWVCategory[] {
    const categorys: VSNWVCategory[] = [];
    function testCategoryExist(name: string): boolean {
        return categorys.filter(c => c.name === name).length >= 1 ? true : false;
    }
    for (const n of ns) {
        if (!testCategoryExist(n.meta.category)) {
            categorys.push({ name: n.meta.category, notes: [] });
        }
        categorys.filter(c => c.name === n.meta.category)[0].notes.push({ id: n.id, contents: n.contents });
    }
    return categorys;
}
