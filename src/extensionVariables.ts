import { homedir } from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import untildify = require('untildify');
import { VSNDomainExplorerProvider, VSNDomainNode } from './explorer/domainExplorer';
import { VSNSampleEditExplorerProvider } from './explorer/sampleEditExplorer';
import { VSNFilesExplorerProvider } from './explorer/filesExplorer';
import { initDB } from './database';

export namespace ext {
    export let context: vscode.ExtensionContext;
    export let dbDirPath: string;
    export let vsnDomainProvider: VSNDomainExplorerProvider;
    export let vsnDomainTree: vscode.TreeView<VSNDomainNode>;
    export let vsnEditProvider: VSNSampleEditExplorerProvider;
    export let vsnFilesProvider: VSNFilesExplorerProvider;
}

export async function initializeExtensionVariables(ctx: vscode.ExtensionContext): Promise<void> {
    const dbpath: string | undefined = vscode.workspace.getConfiguration('vscode-note').get('dbpath');
    ext.dbDirPath = path.join(dbpath ? untildify(dbpath) : path.join(homedir(), '.vscode-note'));
    ext.context = ctx;

    await initDB();

    if (!ext.vsnDomainProvider) {
        ext.vsnDomainProvider = new VSNDomainExplorerProvider();
    }
    if (!ext.vsnDomainTree) {
        ext.vsnDomainTree = vscode.window.createTreeView('vsnoteDomainExplorer', {
            treeDataProvider: ext.vsnDomainProvider
        });
    }

    if (!ext.vsnEditProvider) {
        ext.vsnEditProvider = new VSNSampleEditExplorerProvider();
        vscode.window.createTreeView('vsnoteEditExplorer', { treeDataProvider: ext.vsnEditProvider });
    }

    if (!ext.vsnFilesProvider) {
        ext.vsnFilesProvider = new VSNFilesExplorerProvider();
        vscode.window.createTreeView('vsnoteFilesExplorer', { treeDataProvider: ext.vsnFilesProvider });
    }
}
