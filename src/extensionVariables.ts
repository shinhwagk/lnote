import {
    ExtensionContext,
    workspace,
    window,
    ConfigurationChangeEvent,
    TreeView,
    commands,
    StatusBarItem,
    // StatusBarAlignment,
} from 'vscode';

import { DomainExplorerProvider, DomainNode } from './explorer/domainExplorer';
import { FilesExplorerProvider } from './explorer/filesExplorer';
import { section } from './constants';
import { NoteBookDatabase } from './database';
import { NotesPanelView } from './panel/notesPanelView';
import { tools } from './helper';
import path from 'path';

// import { initClient, sendGA } from './client';

export namespace ext {
    export let context: ExtensionContext;
    export let domainProvider: DomainExplorerProvider;
    export let domainTreeView: TreeView<DomainNode>;
    export let filesProvider: FilesExplorerProvider;
    export let notesPanelView: NotesPanelView;
    export let masterPath: string;
    export let shortcutsFilePath: string;
    export let globalState: GlobalState;
    export let notebookDatabase: NoteBookDatabase;
    export const setContext = <T>(ctx: string, value: T) => commands.executeCommand('setContext', ctx, value);
    export const registerCommand = (command: string, callback: (...args: any[]) => any, thisArg?: any) =>
        context.subscriptions.push(commands.registerCommand(command, callback, thisArg));
    export let domainShortcutStatusBarItem: StatusBarItem;
    export const editNotes = new Map<string, string[]>()
}

// function getShortcutsFilePath() {
//     return path.join(ext.masterPath, 'shortcuts.json');
// }

function listenConfiguration(ctx: ExtensionContext) {
    ctx.subscriptions.push(
        workspace.onDidChangeConfiguration(async (e: ConfigurationChangeEvent) => {
            if (e.affectsConfiguration(section)) {
                const notespath = workspace.getConfiguration(section).get<string>('notespath');
                if (notespath === undefined || notespath === '') {
                    window.showInformationMessage('configuretion "notespath" wrong.');
                    return;
                }
                ext.masterPath = notespath;
                ext.notebookDatabase = new NoteBookDatabase(ext.masterPath);
                // initializecomponents();
                ext.notebookDatabase.refresh();
                ext.domainProvider.refresh();
            }
        })
    );
}

export function initializeExtensionVariables(ctx: ExtensionContext): void {
    ext.context = ctx;
    listenConfiguration(ctx);
    const notespath = workspace.getConfiguration(section).get<string>('notespath');

    if (notespath === undefined || notespath === '') {
        return;
    }
    ext.masterPath = notespath.endsWith('/') ? notespath : notespath + '/';
    ext.notebookDatabase = new NoteBookDatabase(ext.masterPath);
    ext.globalState = new GlobalState();

    if (!ext.notesPanelView) {
        ext.notesPanelView = new NotesPanelView();
    }

    if (!ext.domainProvider || !ext.domainTreeView) {
        ext.domainProvider = new DomainExplorerProvider();
        ext.domainTreeView = window.createTreeView('domainExplorer', { treeDataProvider: ext.domainProvider });
    }

    if (!ext.filesProvider) {
        ext.filesProvider = new FilesExplorerProvider();
        window.createTreeView('filesExplorer', { treeDataProvider: ext.filesProvider });
    }

    // if (!ext.notesPanelView) {
    //     ext.notesPanelView = new NotesPanelView();
    // }

    // if (!ext.domainProvider || !ext.domainTreeView) {
    //     ext.domainProvider = new DomainExplorerProvider(ext.domainDB);
    //     ext.domainTreeView = window.createTreeView('domainExplorer', { treeDataProvider: ext.domainProvider });
    // }

    // if (!ext.filesProvider) {
    //     ext.filesProvider = new FilesExplorerProvider();
    //     window.createTreeView('filesExplorer', { treeDataProvider: ext.filesProvider });
    // }
    // if (!ext.domainShortcutStatusBarItem) {
    //     ext.domainShortcutStatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 1);
    //     ext.domainShortcutStatusBarItem.text = '$(list-unordered) Domains(Last)';
    //     ext.domainShortcutStatusBarItem.command = 'vscode-note.shortcuts.last';
    //     ext.domainShortcutStatusBarItem.show();
    //     ext.context.subscriptions.push(ext.domainShortcutStatusBarItem);
    // }

    ext.context.subscriptions.push(
        workspace.onDidSaveTextDocument((f) => {
            const notesCacheDirectory = ext.notebookDatabase.notesCacheDirectory
            if (f.uri.fsPath.startsWith(notesCacheDirectory)) {
                const fileName = path.basename(f.uri.fsPath)
                if (fileName.endsWith('.txt')) {
                    const [nbName, nId] = fileName.split('.')[0].split('_')
                    const contents = f.getText().split('+=+=+=').map(c => c.trim())
                    ext.notebookDatabase.updateNoteContent(nbName, nId, contents)
                }
            }
        })
    )

    ext.context.subscriptions.push(
        workspace.onDidCloseTextDocument((f) => {
            const notesCacheDirectory = ext.notebookDatabase.notesCacheDirectory
            if (f.uri.fsPath.startsWith(notesCacheDirectory)) {
                const fileName = path.basename(f.uri.fsPath)
                if (fileName.endsWith('.txt')) {
                    const [nbName, nId] = fileName.split('.')[0].split('_')
                    ext.notebookDatabase.removeEditNoteEnv(nbName, nId)
                }
            }
        })
    )
}

export class GlobalState {
    nId: string = '';
    domainNode: DomainNode = '';
    nbName: string = ''
}
