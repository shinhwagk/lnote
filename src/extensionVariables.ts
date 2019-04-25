import { DomainExplorerProvider, DomainNode } from './explorer/domainExplorer';
import { FilesExplorerProvider } from './explorer/filesExplorer';
import { homedir, platform } from 'os';
import * as path from 'path';
import { section } from './constants';
import { DatabaseFileSystem } from './database';
import { ExtensionContext, workspace, window, OutputChannel, ConfigurationChangeEvent, TreeView, commands } from 'vscode';
import { NotesPanelView } from './panel/notesPanelView';
import { pga } from './ga';
import { existsSync, mkdirpSync } from 'fs-extra';

export namespace ext {
    export let context: ExtensionContext;
    export let domainProvider: DomainExplorerProvider;
    export let domainTreeView: TreeView<DomainNode>;
    export let filesProvider: FilesExplorerProvider;
    export let notesPanelView: NotesPanelView;
    export let dbDirPath: string;
    export let notesPath: string;
    export let activeNote: ActiveNote;
    export let dbFS: DatabaseFileSystem;
    // export let gitNotes: GitNotes;
    export let outputChannel: OutputChannel;
    export let ga: (ec: string, ea: string) => void;
    export const setContext = <T>(ctx: string, value: T) => commands.executeCommand('setContext', ctx, value);
    export const registerCommand = (command: string, callback: (...args: any[]) => any, thisArg?: any) => context.subscriptions.push(commands.registerCommand(command, callback, thisArg));
}

export function getConfigure<T>(name: string, defaultValue: T): T {
    return workspace.getConfiguration(section).get(name) || defaultValue;
}

function getDbDirPath() {
    const joinFun = platform() === 'win32' ? path.win32.join : path.join;
    const p = getConfigure('dbpath', path.join(homedir(), 'vscode-note'));
    return p.startsWith('~/') ? joinFun(homedir(), p.substr(2)) : p;
}

function listenerConfigure(ctx: ExtensionContext) {
    ctx.subscriptions.push(
        workspace.onDidChangeConfiguration(async (e: ConfigurationChangeEvent) => {
            if (e.affectsConfiguration(section)) {
                ext.dbFS = new DatabaseFileSystem(getDbDirPath());
                ext.dbDirPath = getDbDirPath();
                ext.ga = pga(getConfigure('ga', true));
            }
        })
    );
}

export function initializeExtensionVariables(ctx: ExtensionContext): void {
    listenerConfigure(ctx);
    ext.context = ctx;

    // delete soon
    ext.dbDirPath = getDbDirPath();

    ext.notesPath = path.join(ext.dbDirPath, 'notes');

    if (!existsSync(ext.dbDirPath)) {
        mkdirpSync(ext.dbDirPath);
        copySync(path.join(ext.context.extensionPath, 'data-template'), ext.notesPath);
    }

    ext.dbFS = new DatabaseFileSystem(ext.notesPath);

    ext.ga = pga(getConfigure('ga', true));

    // ext.gitNotes = new GitNotes(ext.dbDirPath);
    ext.outputChannel = window.createOutputChannel('vscode-note');

    ext.activeNote = new ActiveNote();

    if (!ext.notesPanelView) {
        ext.notesPanelView = new NotesPanelView();
    }

    if (!ext.domainProvider || !ext.domainTreeView) {
        ext.domainProvider = new DomainExplorerProvider();
        ext.domainTreeView = window.createTreeView('domainExplorer', { treeDataProvider: ext.domainProvider });
        ext.domainTreeView.onDidChangeVisibility(e => ext.ga('domain-explorer', e.visible ? 'activate' : 'deactivate'));
    }

    if (!ext.filesProvider) {
        ext.filesProvider = new FilesExplorerProvider();
        window.createTreeView('filesExplorer', { treeDataProvider: ext.filesProvider });
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
