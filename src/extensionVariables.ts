import { homedir } from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import untildify = require('untildify');
import { DomainExplorerProvider, DomainNode } from './explorer/domainExplorer';
import { EditExplorerProvider } from './explorer/editExplorer';
import { FilesExplorerProvider } from './explorer/filesExplorer';
import { initializeDBVariables } from './database';

export namespace ext {
    export let context: vscode.ExtensionContext;
    export let domainProvider: DomainExplorerProvider;
    export let vsnDomainTree: vscode.TreeView<DomainNode>;
    export let editProvider: EditExplorerProvider;
    export let FilesProvider: FilesExplorerProvider;
}

export async function initializeExtensionVariables(ctx: vscode.ExtensionContext): Promise<void> {
    const dbpath: string | undefined = vscode.workspace.getConfiguration('vscode-note').get('dbpath');
    const dbDirPath = path.join(dbpath ? untildify(dbpath) : path.join(homedir(), '.vscode-note'));
    ext.context = ctx;

    await initializeDBVariables(dbDirPath);

    if (!ext.domainProvider) {
        ext.domainProvider = new DomainExplorerProvider();
    }
    if (!ext.vsnDomainTree) {
        ext.vsnDomainTree = vscode.window.createTreeView('domainExplorer', {
            treeDataProvider: ext.domainProvider
        });
    }

    if (!ext.editProvider) {
        ext.editProvider = new EditExplorerProvider();
        vscode.window.createTreeView('editExplorer', { treeDataProvider: ext.editProvider });
    }

    if (!ext.FilesProvider) {
        ext.FilesProvider = new FilesExplorerProvider();
        vscode.window.createTreeView('filesExplorer', { treeDataProvider: ext.FilesProvider });
    }
}
