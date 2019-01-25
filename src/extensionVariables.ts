import { homedir } from 'os';
import * as path from 'path';
import { ExtensionContext, workspace, window, TreeView } from 'vscode';
import untildify = require('untildify');
import { VSNDomainExplorerProvider, VSNDomainNode } from './explorer/domainExplorer';
import { VSNWebviewPanel } from './panel/notesPanel';
import { VSNSampleEditExplorerProvider } from './explorer/sampleEditExplorer';
import { VSNFilesExplorerProvider } from './explorer/filesExplorer';
import { initDB } from './database';

export namespace ext {
    export let context: ExtensionContext;
    export let dbDirPath: string;
    export let vsnDomainProvider: VSNDomainExplorerProvider;
    export let vsnDomainTree: TreeView<VSNDomainNode>;
    export let vsnEditProvider: VSNSampleEditExplorerProvider;
    export let vsnFilesProvider: VSNFilesExplorerProvider;
    export let vsnPanel: VSNWebviewPanel;
}

export async function initializeExtensionVariables(ctx: ExtensionContext): Promise<void> {
    const dbpath: string | undefined = workspace.getConfiguration('vscode-note').get('dbpath');
    ext.context = ctx;
    ext.dbDirPath = path.join(dbpath ? untildify(dbpath) : path.join(homedir(), '.vscode-note'));

    await initDB();

    if (!ext.vsnDomainProvider) {
        ext.vsnDomainProvider = new VSNDomainExplorerProvider();
    }
    if (!ext.vsnDomainTree) {
        ext.vsnDomainTree = window.createTreeView('vsnoteDomainExplorer', {
            treeDataProvider: ext.vsnDomainProvider
        });
    }

    if (!ext.vsnEditProvider) {
        ext.vsnEditProvider = new VSNSampleEditExplorerProvider();
        window.createTreeView('vsnoteEditExplorer', { treeDataProvider: ext.vsnEditProvider });
    }

    if (!ext.vsnFilesProvider) {
        ext.vsnFilesProvider = new VSNFilesExplorerProvider();
        window.createTreeView('vsnoteFilesExplorer', { treeDataProvider: ext.vsnFilesProvider });
    }

    if (!ext.vsnPanel) {
        ext.vsnPanel = new VSNWebviewPanel();
    }
}
