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
import { DomainDatabase } from './database';
import { NotesPanelView } from './panel/notesPanelView';

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
    export let domainDB: DomainDatabase;
    export let isInit = false;
    export const setContext = <T>(ctx: string, value: T) => commands.executeCommand('setContext', ctx, value);
    export const registerCommand = (command: string, callback: (...args: any[]) => any, thisArg?: any) =>
        context.subscriptions.push(commands.registerCommand(command, callback, thisArg));
    export let domainShortcutStatusBarItem: StatusBarItem;
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
                console.log('333333333333');
                ext.masterPath = notespath;
                ext.domainDB = new DomainDatabase(ext.masterPath);
                initializecomponents();
                ext.domainDB.refresh();
                ext.domainProvider.refresh();
            }
        })
    );
}

function initializecomponents() {
    if (!ext.isInit) {
        if (!ext.notesPanelView) {
            ext.notesPanelView = new NotesPanelView();
        }

        if (!ext.domainProvider || !ext.domainTreeView) {
            ext.domainProvider = new DomainExplorerProvider(ext.domainDB);
            ext.domainTreeView = window.createTreeView('domainExplorer', { treeDataProvider: ext.domainProvider });
        }

        if (!ext.filesProvider) {
            ext.filesProvider = new FilesExplorerProvider();
            window.createTreeView('filesExplorer', { treeDataProvider: ext.filesProvider });
        }
        ext.isInit = true;
    }
}

export function initializeExtensionVariables(ctx: ExtensionContext): void {
    ext.context = ctx;
    listenConfiguration(ctx);
    const notespath = workspace.getConfiguration(section).get<string>('notespath');

    if (notespath === undefined || notespath === '') {
        return;
    }
    ext.masterPath = notespath;
    ext.domainDB = new DomainDatabase(ext.masterPath);
    ext.globalState = new GlobalState();
    initializecomponents();

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
}

export class GlobalState {
    nId: string = '';
    domainNode: DomainNode = '';
}
