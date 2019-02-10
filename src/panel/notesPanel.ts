import * as path from 'path';
import * as vscode from 'vscode';
import { selectNoteContent, getNoteMetaFile, selectFilesExist, selectDocExist } from '../database';
import { ToWebView as twv } from './message';
import { ext } from '../extensionVariables';
import { vfs } from '../helper';

const assetsFile = (name: string) => {
    const file = path.join(ext.context.extensionPath, 'out', name);
    return vscode.Uri.file(file)
        .with({ scheme: 'vscode-resource' })
        .toString();
};

function getWebviewContent() {
    return `<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>vscode-note</title>
	</head>
    <body>
        <div id="root"></div>
        <script src="${assetsFile('main.wv.js')}"></script>
	</body>
	</html>`;
}

let panel: vscode.WebviewPanel | undefined = undefined;
let state: boolean = false;
let tryCnt: number = 0;

export async function updateContent(notes: number[]): Promise<void> {
    if (!panel) init();

    if (tryCnt >= 50) {
        vscode.window.showErrorMessage('webview update failse 50 times.');
        return;
    }
    if (!state) {
        setTimeout(async () => await updateContent(notes), 100);
        tryCnt += 1;
        return;
    }
    if (panel) {
        tryCnt = 0;
        const command = 'data';
        const data = await fusionNotes(notes);
        panel.webview.postMessage({ command, data });
    }
}

function init() {
    panel = vscode.window.createWebviewPanel('vscode-note', 'vscode-note', vscode.ViewColumn.One, {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.file(path.join(ext.context.extensionPath, 'out'))]
    });
    panel.onDidDispose(
        () => {
            panel = undefined;
            state = false;
            console.log('vsnote webview closed.');
        },
        null,
        ext.context.subscriptions
    );
    panel.webview.onDidReceiveMessage(
        message => {
            switch (message.command) {
                case 'ready':
                    state = message.data;
                    break;
                case 'edit':
                    vscode.commands.executeCommand('vscode-note.note.edit', message.data);
                    break;
                case 'doc':
                    vscode.commands.executeCommand('vscode-note.note.doc.show', message.data);
                    break;
                case 'files':
                    vscode.commands.executeCommand('vscode-note.note.file.show', message.data);
                    break;
            }
        },
        undefined,
        ext.context.subscriptions
    );
    panel.webview.html = getWebviewContent();
}

export async function fusionNotes(notes: number[]): Promise<twv.VSNWVDomain> {
    const dpath = ext.context.globalState.get<string>('dpath')!;
    const cs = notes
        .map(getNoteMetaFile)
        .map(vfs.readYamlSync)
        .map(m => m.tags.filter((t: any) => t.tag === dpath)[0].category);

    const categorys: twv.VSNWVCategory[] = [];
    function testCategoryExist(name: string): boolean {
        return categorys.filter(c => c.name === name).length >= 1 ? true : false;
    }
    for (let i = 0; i < notes.length; i++) {
        const id = notes[i];
        const category = cs[i];
        if (!testCategoryExist(category)) {
            categorys.push({ name: category, notes: [] });
        }
        const contents = await selectNoteContent(id);
        categorys
            .filter(c => c.name === category)[0]
            .notes.push({ id: id, contents: contents, doc: selectDocExist(id), files: selectFilesExist(id) });
    }
    return { name: path.basename(dpath), categorys };
}
