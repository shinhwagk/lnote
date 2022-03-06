import { homedir, platform } from 'os';
import * as path from 'path';

import { copySync, existsSync, mkdirpSync, mkdirsSync, writeJsonSync } from 'fs-extra';
import {
    ExtensionContext,
    workspace,
    window,
    OutputChannel,
    ConfigurationChangeEvent,
    TreeView,
    commands,
    StatusBarItem,
    StatusBarAlignment,
} from 'vscode';

import { DomainExplorerProvider, DomainNode } from './explorer/domainExplorer';
import { FilesExplorerProvider } from './explorer/filesExplorer';
import { section } from './constants';
import { DomainDatabase, VNDatabase } from './database';

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
    export let vnDB: VNDatabase;
    // export let clientActions: (action: string) => void;
    // export let sendGA: (ec: string, ea: string) => void;
    export let outputChannel: OutputChannel;
    export const setContext = <T>(ctx: string, value: T) => commands.executeCommand('setContext', ctx, value);
    export const registerCommand = (command: string, callback: (...args: any[]) => any, thisArg?: any) =>
        context.subscriptions.push(commands.registerCommand(command, callback, thisArg));
    export let domainShortcutStatusBarItem: StatusBarItem;
}

export function getConfigure<T>(name: string, defaultValue: T): T {
    return workspace.getConfiguration(section).get(name) || defaultValue;
}

function getMasterPath() {
    const joinFun = platform() === 'win32' ? path.win32.join : path.join;
    const p = getConfigure('dbpath', path.join(homedir(), 'vscode-note'));
    return p.startsWith('~/') ? joinFun(homedir(), p.substr(2)) : p;
}

function getShortcutsFilePath() {
    return path.join(ext.masterPath, 'shortcuts.json');
}

function listenConfigure(ctx: ExtensionContext) {
    ctx.subscriptions.push(
        workspace.onDidChangeConfiguration(async (e: ConfigurationChangeEvent) => {
            if (e.affectsConfiguration(section)) {
                ext.masterPath = getMasterPath();
                ext.domainDB = new DomainDatabase(ext.masterPath);
                ext.domainProvider.refresh();
            }
        })
    );
}

export function initializeExtensionVariables(ctx: ExtensionContext): void {
    listenConfigure(ctx);
    ext.context = ctx;

    // delete soon
    ext.masterPath = getMasterPath();
    // ext.notesPath = getNotesPath();
    // ext.shortcutsFilePath = getShortcutsFilePath();

    //initializeShortcutsFile(ext.shortcutsFilePath);
    // addUsageNotes(ext.notesPath);
    // ext.clientActions = initClient(ext.context.extensionPath);

    ext.outputChannel = window.createOutputChannel('vscode-note');
    // DomainDatabase.initDirectory();
    ext.domainDB = new DomainDatabase(ext.masterPath);

    ext.globalState = new GlobalState();

    if (!ext.notesPanelView) {
        ext.notesPanelView = new NotesPanelView();
    }

    if (!ext.domainProvider || !ext.domainTreeView) {
        ext.domainProvider = new DomainExplorerProvider();
        ext.domainTreeView = window.createTreeView('domainExplorer', { treeDataProvider: ext.domainProvider });
        // ext.domainTreeView.onDidChangeVisibility(e =>
        //     e.visible ? ext.clientActions('domain-tree.open') : ext.clientActions('domain-tree.close')
        // );
    }

    if (!ext.filesProvider) {
        ext.filesProvider = new FilesExplorerProvider();
        window.createTreeView('filesExplorer', { treeDataProvider: ext.filesProvider });
    }

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
    // files: boolean = false;
    // doc: boolean = false;
    // category: string = '';
    domainNode: DomainNode = '';
    // dpath: string[] = [];
}
