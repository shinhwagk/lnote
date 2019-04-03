import { DomainExplorerProvider } from './explorer/domainExplorer';
import { EditExplorerProvider } from './explorer/editExplorer';
import { FilesExplorerProvider } from './explorer/filesExplorer';
import { homedir } from 'os';
import * as path from 'path';
import untildify = require('untildify');
import { vscodeConfigSection } from './constants';
import { DatabaseFileSystem } from './database';
import { ExtensionContext, workspace, window, OutputChannel, ConfigurationChangeEvent } from 'vscode';
import { NotesPanelView } from './panel/notesPanelView';
import { GitNotes } from './abccc';

export namespace ext {
    export let context: ExtensionContext;
    export let domainProvider: DomainExplorerProvider;
    export let editProvider: EditExplorerProvider;
    export let filesProvider: FilesExplorerProvider;
    export let notesPanelView: NotesPanelView;
    export let dbDirPath: string;
    export let activeNote: ActiveNote;
    export let dbFS: DatabaseFileSystem;
    export let gitNotes: GitNotes;
    export let outputChannel: OutputChannel;
}

export function getDbDirPath() {
    const dbpath: string | undefined = workspace.getConfiguration(vscodeConfigSection).get('dbpath');
    return path.join(dbpath ? untildify(dbpath) : path.join(homedir(), '.vscode-note'));
}

function listenerDbDirPath(ctx: ExtensionContext) {
    ctx.subscriptions.push(
        workspace.onDidChangeConfiguration(async (e: ConfigurationChangeEvent) => {
            if (e.affectsConfiguration(vscodeConfigSection)) {
                ext.dbDirPath = getDbDirPath();
                ext.dbFS = new DatabaseFileSystem(getDbDirPath());
            }
        })
    );
}

export function initializeExtensionVariables(ctx: ExtensionContext): void {
    listenerDbDirPath(ctx);
    ext.context = ctx;

    ext.dbDirPath = getDbDirPath();

    ext.dbFS = new DatabaseFileSystem(ext.dbDirPath);

    ext.gitNotes = new GitNotes(ext.dbDirPath);
    ext.outputChannel = window.createOutputChannel('vscode-note');

    ext.activeNote = new ActiveNote();

    if (!ext.notesPanelView) {
        ext.notesPanelView = new NotesPanelView();
    }

    if (!ext.domainProvider) {
        ext.domainProvider = new DomainExplorerProvider();
        window.registerTreeDataProvider('domainExplorer', ext.domainProvider);
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
    dpath: string[] = [];
    id: string = '';
    files: boolean = false;
    doc: boolean = false;
    category: string = '';
}
