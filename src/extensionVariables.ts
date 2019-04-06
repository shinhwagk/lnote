import { DomainExplorerProvider, DomainNode } from './explorer/domainExplorer';
import { EditExplorerProvider } from './explorer/editExplorer';
import { FilesExplorerProvider } from './explorer/filesExplorer';
import { homedir, platform } from 'os';
import * as path from 'path';
import { section } from './constants';
import { DatabaseFileSystem } from './database';
import { ExtensionContext, workspace, window, OutputChannel, ConfigurationChangeEvent, TreeView } from 'vscode';
import { NotesPanelView } from './panel/notesPanelView';
import { pga } from './ga';
import { GitNotes } from './gitNotes';

export namespace ext {
    export let context: ExtensionContext;
    export let domainProvider: DomainExplorerProvider;
    export let domainTreeView: TreeView<DomainNode>;
    export let editProvider: EditExplorerProvider;
    export let filesProvider: FilesExplorerProvider;
    export let notesPanelView: NotesPanelView;
    export let dbDirPath: string;
    export let activeNote: ActiveNote;
    export let dbFS: DatabaseFileSystem;
    export let gitNotes: GitNotes;
    export let outputChannel: OutputChannel;
    export let ga: (ec: string, ea: string) => void;
}

export function getConfigure<T>(name: string, defaultValue: T): T {
    return workspace.getConfiguration(section).get(name) || defaultValue;
}

function getDbDirPath() {
    const joinFun = platform() === 'win32' ? path.win32.join : path.join;
    return getConfigure('dbpath', joinFun(homedir(), 'vscode-note'));
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
    window.showInformationMessage(ext.dbDirPath);

    ext.dbFS = new DatabaseFileSystem(ext.dbDirPath);

    ext.ga = pga(getConfigure('ga', true));

    ext.gitNotes = new GitNotes(ext.dbDirPath, getConfigure('github', ''));
    ext.outputChannel = window.createOutputChannel('vscode-note');

    ext.activeNote = new ActiveNote();

    if (!ext.notesPanelView) {
        ext.notesPanelView = new NotesPanelView();
    }

    if (!ext.domainProvider || !ext.domainTreeView) {
        ext.domainProvider = new DomainExplorerProvider();
        ext.domainTreeView = window.createTreeView('domainExplorer', { treeDataProvider: ext.domainProvider });
    }

    if (!ext.editProvider) {
        ext.editProvider = new EditExplorerProvider();
        window.createTreeView('editExplorer', { treeDataProvider: ext.editProvider });
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
    domainNode: DomainNode | undefined;
}
