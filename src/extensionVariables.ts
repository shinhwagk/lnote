import * as vscode from 'vscode';
import { DomainExplorerProvider, DomainNode } from './explorer/domainExplorer';
import { EditExplorerProvider } from './explorer/editExplorer';
import { FilesExplorerProvider } from './explorer/filesExplorer';

export namespace ext {
    export let context: vscode.ExtensionContext;
    export let domainProvider: DomainExplorerProvider;
    export let domainTree: vscode.TreeView<DomainNode>;
    export let editProvider: EditExplorerProvider;
    export let FilesProvider: FilesExplorerProvider;
}

export async function initializeExtensionVariables(ctx: vscode.ExtensionContext): Promise<void> {
    ext.context = ctx;

    if (!ext.domainProvider) {
        ext.domainProvider = new DomainExplorerProvider();
    }
    if (!ext.domainTree) {
        ext.domainTree = vscode.window.createTreeView('domainExplorer', {
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
