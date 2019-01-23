import { TreeItem, TreeDataProvider, EventEmitter, Event, Uri } from 'vscode';
import * as path from 'path';
import { ext } from '../extensionVariables';
import { readdirSync } from 'fs';

export class VSNSampleEditExplorerProvider implements TreeDataProvider<TreeItem> {
    private _onDidChangeTreeData: EventEmitter<TreeItem> = new EventEmitter<TreeItem>();
    public readonly onDidChangeTreeData: Event<TreeItem> = this._onDidChangeTreeData.event;

    public refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    public getTreeItem(element: TreeItem): TreeItem {
        element.command = {
            command: 'vsnoteEditExplorer.openFileResource',
            arguments: [element.resourceUri!],
            title: path.basename(element.resourceUri!.path)
        };
        return element;
    }

    public async getChildren(element?: TreeItem): Promise<TreeItem[]> {
        const nid = ext.context.globalState.get<number>('nid');
        if (element) return [];
        if (!nid) return [];
        return (await getNoteFiles(nid)).concat(await getDocMainFile(nid));
    }
}

async function getNoteFiles(nid: number): Promise<TreeItem[]> {
    const notePath = path.join(ext.dbDirPath, 'notes', nid.toString());

    const isColFile = (n: string) => /^[1-9]+[0-9]*\.[a-z]+$/.test(n);

    const nodes = [];

    const item = new TreeItem(Uri.file(path.join(notePath, '1.txt')), 0);
    item.contextValue = 'finalNoteNode';
    nodes.push(item);

    readdirSync(notePath)
        .filter(isColFile)
        .filter(f => f !== '1.txt')
        .forEach(f => {
            const item = new TreeItem(Uri.file(path.join(notePath, f)), 0);
            item.contextValue = 'editNoteNode';
            nodes.push(item);
        });

    const uri = Uri.file(path.join(notePath, '.n.yml'));
    nodes.push(new TreeItem(uri, 0));
    return nodes;
}

async function getDocMainFile(nid: number): Promise<TreeItem> {
    const docFilePath = path.join(ext.dbDirPath, 'notes', nid.toString(), 'doc', 'README.md');
    const uri = Uri.file(docFilePath);
    const item = new TreeItem(uri, 0);
    item.contextValue = 'editDocNode';
    return item;
}
