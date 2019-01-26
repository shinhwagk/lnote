import { TreeItem, TreeDataProvider, Uri, EventEmitter, Event } from 'vscode';
import { ext } from '../extensionVariables';
import { readdirSync, statSync } from 'fs';
import { join, basename } from 'path';

export class VSNFilesExplorerProvider implements TreeDataProvider<TreeItem> {
    private _onDidChangeTreeData: EventEmitter<TreeItem> = new EventEmitter<TreeItem>();
    public readonly onDidChangeTreeData: Event<TreeItem> = this._onDidChangeTreeData.event;

    public refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    async getTreeItem(element: TreeItem): Promise<TreeItem> {
        return element;
    }

    async getChildren(element?: TreeItem | undefined): Promise<TreeItem[]> {
        const nid = ext.context.globalState.get<number>('nid');
        if (!element) {
            if (!nid) return [];
            const noteFileDirPath = join(ext.dbDirPath, 'notes', nid.toString(), 'files');
            return readdirSync(noteFileDirPath).map(f => {
                const uri = Uri.file(join(noteFileDirPath, f));
                if (statSync(uri.fsPath).isDirectory()) {
                    return new TreeItem(uri, 1);
                } else {
                    const item = new TreeItem(uri, 0);
                    item.command = {
                        command: 'vsnoteEditExplorer.openFileResource',
                        arguments: [uri],
                        title: basename(uri.path)
                    };
                    return item;
                }
            });
        }
        return [];
    }
}
