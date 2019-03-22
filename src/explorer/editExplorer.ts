import { TreeItem, TreeDataProvider, EventEmitter, Event, Uri } from 'vscode';
import * as path from 'path';
import { ext } from '../extensionVariables';
import { readdirSync } from 'fs';
import { DBCxt } from '../database';
import { metaFileName } from '../constants';

export class EditExplorerProvider implements TreeDataProvider<TreeItem> {
    private _onDidChangeTreeData: EventEmitter<TreeItem> = new EventEmitter<TreeItem>();
    public readonly onDidChangeTreeData: Event<TreeItem> = this._onDidChangeTreeData.event;

    public refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    public getTreeItem(element: TreeItem): TreeItem {
        element.command = {
            command: 'editExplorer.openFileResource',
            arguments: [element.resourceUri!],
            title: path.basename(element.resourceUri!.path)
        };
        return element;
    }

    public async getChildren(element?: TreeItem): Promise<TreeItem[]> {
        if (element) return [];
        const nid = ext.context.globalState.get<string>('nid');
        if (!nid) return [];
        return await getNoteFiles(nid);
    }
}

async function getNoteFiles(nid: string): Promise<TreeItem[]> {
    const notePath = path.join(DBCxt.dbDirPath, nid);
    const isColFile = (n: string) => /^[1-9]+[0-9]*\.[a-z]+$/.test(n);
    const firstNote = new TreeItem(Uri.file(path.join(notePath, '1.txt')), 0);

    const editNotes = readdirSync(notePath)
        .filter(isColFile)
        .filter(f => f !== '1.txt')
        .map(f => {
            const item = new TreeItem(Uri.file(path.join(notePath, f)), 0);
            item.contextValue = 'editNoteNode';
            return item;
        });

    const uri = Uri.file(path.join(notePath, metaFileName));
    const metaNote = new TreeItem(uri, 0);

    return [firstNote].concat(editNotes).concat(metaNote);
}
