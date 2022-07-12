import { join, basename } from 'path';

import { TreeItem, TreeDataProvider, Uri, EventEmitter, Event } from 'vscode';
import { readdirSync, statSync } from 'fs-extra';

import { ext } from '../extensionVariables';
import { Tools } from './domainExplorer';

export class FilesExplorerProvider implements TreeDataProvider<TreeItem> {
    private _onDidChangeTreeData: EventEmitter<TreeItem | undefined> = new EventEmitter<TreeItem>();
    public readonly onDidChangeTreeData: Event<TreeItem | undefined> = this._onDidChangeTreeData.event;

    public refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    async getTreeItem(element: TreeItem): Promise<TreeItem> {
        return element;
    }

    async getChildren(element?: TreeItem): Promise<TreeItem[]> {
        const fPath: string = element
            ? element.resourceUri!.fsPath
            : ext.notesDatabase.getFilesPath(Tools.splitDomaiNode(ext.globalState.domainNode), ext.globalState.nId);
        return readdirSync(fPath).map((f) => {
            const uri = Uri.file(join(fPath, f));
            if (statSync(uri.fsPath).isDirectory()) {
                return new TreeItem(uri, 1);
            } else {
                const item = new TreeItem(uri, 0);
                item.command = {
                    command: 'editExplorer.openFileResource',
                    arguments: [uri],
                    title: basename(uri.path),
                };
                item.contextValue = 'file';
                return item;
            }
        });
    }
}
