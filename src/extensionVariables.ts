import { DomainExplorerProvider } from './explorer/domainExplorer';
import { EditExplorerProvider } from './explorer/editExplorer';
import { FilesExplorerProvider } from './explorer/filesExplorer';
import { homedir } from 'os';
import * as path from 'path';
import untildify = require('untildify');
import { vscodeConfigSection } from './constants';
import { PanelViewCache as PanelViewCache } from './panel/notePanelViewCache';
import { DatabaseFileSystem } from './database';
import { ExtensionContext, workspace, window } from 'vscode';

export namespace ext {
    export let context: ExtensionContext;
    export let domainProvider: DomainExplorerProvider;
    export let editProvider: EditExplorerProvider;
    export let FilesProvider: FilesExplorerProvider;
    export let panelViewCache: PanelViewCache;
    export let dbDirPath: string;
    export let activeDpath: string[];
    export let activeNoteId: string;
    export let dbFS: DatabaseFileSystem;
}

export function getDbDirPath() {
    const dbpath: string | undefined = workspace.getConfiguration(vscodeConfigSection).get('dbpath');
    return path.join(dbpath ? untildify(dbpath) : path.join(homedir(), '.vscode-note'));
}

export function initializeExtensionVariables(ctx: ExtensionContext): void {
    ext.context = ctx;

    ext.dbDirPath = getDbDirPath();

    ext.dbFS = new DatabaseFileSystem(ext.dbDirPath);

    if (!ext.panelViewCache) {
        ext.panelViewCache = new PanelViewCache(ext.dbFS);
    }

    if (!ext.domainProvider) {
        ext.domainProvider = new DomainExplorerProvider();
        window.createTreeView('domainExplorer', { treeDataProvider: ext.domainProvider });
    }

    if (!ext.editProvider) {
        ext.editProvider = new EditExplorerProvider();
        window.createTreeView('editExplorer', { treeDataProvider: ext.editProvider });
    }

    if (!ext.FilesProvider) {
        ext.FilesProvider = new FilesExplorerProvider();
        window.createTreeView('filesExplorer', { treeDataProvider: ext.FilesProvider });
    }
}
