import { DomainExplorerProvider, DomainNode } from './explorer/domainExplorer';
import { FilesExplorerProvider } from './explorer/filesExplorer';
import { homedir, platform } from 'os';
import * as path from 'path';
import { section } from './constants';
import { NoteDatabase } from './database';
import { ExtensionContext, workspace, window, OutputChannel, ConfigurationChangeEvent, TreeView, commands } from 'vscode';
import { NotesPanelView } from './panel/notesPanelView';
import { existsSync, mkdirpSync, mkdirsSync, copySync } from 'fs-extra';
import { initClient } from './client';

export namespace ext {
    export let context: ExtensionContext;
    export let domainProvider: DomainExplorerProvider;
    export let domainTreeView: TreeView<DomainNode>;
    export let filesProvider: FilesExplorerProvider;
    export let notesPanelView: NotesPanelView;
    export let masterPath: string;
    export let notesPath: string;
    export let activeNote: ActiveNote;
    export let dbFS: NoteDatabase;
    export let clientActions: (action: string) => void;
    export let outputChannel: OutputChannel;
    export const setContext = <T>(ctx: string, value: T) => commands.executeCommand('setContext', ctx, value);
    export const registerCommand = (command: string, callback: (...args: any[]) => any, thisArg?: any) =>
        context.subscriptions.push(commands.registerCommand(command, callback, thisArg));
}

export function getConfigure<T>(name: string, defaultValue: T): T {
    return workspace.getConfiguration(section).get(name) || defaultValue;
}

function getMasterPath() {
    const joinFun = platform() === 'win32' ? path.win32.join : path.join;
    const p = getConfigure('dbpath', path.join(homedir(), 'vscode-note'));
    return p.startsWith('~/') ? joinFun(homedir(), p.substr(2)) : p;
}

function getNotesPath() {
    return path.join(ext.masterPath, 'notes');
}

function listenConfigure(ctx: ExtensionContext) {
    ctx.subscriptions.push(
        workspace.onDidChangeConfiguration(async (e: ConfigurationChangeEvent) => {
            if (e.affectsConfiguration(section)) {
                ext.masterPath = getMasterPath();
                ext.dbFS = new NoteDatabase(ext.masterPath);
            }
        })
    );
}

export function initializeExtensionVariables(ctx: ExtensionContext): void {
    listenConfigure(ctx);
    ext.context = ctx;

    // delete soon
    ext.masterPath = getMasterPath();
    ext.notesPath = getNotesPath();

    initializeMasterDirectory(ext.masterPath);
    initializeNotesDirectory(ext.notesPath);
    ext.clientActions = initClient();

    ext.outputChannel = window.createOutputChannel('vscode-note');
    ext.dbFS = new NoteDatabase(ext.notesPath);

    ext.activeNote = new ActiveNote();

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
}

function initializeMasterDirectory(masterPath: string) {
    existsSync(masterPath) || mkdirpSync(masterPath);
}

function initializeNotesDirectory(notesPath: string) {
    if (!existsSync(notesPath)) {
        mkdirsSync(notesPath);
        copySync(path.join(ext.context.extensionPath, 'notes-usage', 'notes'), notesPath);
    }
}

export class ActiveNote {
    id: string = '';
    files: boolean = false;
    doc: boolean = false;
    category: string = '';
    domainNode: DomainNode = '';
    dpath: string[] = [];
}
