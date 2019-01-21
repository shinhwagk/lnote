import * as vscode from 'vscode';
import { NodeBase } from './nodeBase';
import { readdirSync, statSync } from 'fs';
import * as path from 'path';

export class FileSystemFileNode extends NodeBase {
    public static readonly contextValue: string = 'localDocFileNode';
    public readonly contextValue: string = FileSystemFileNode.contextValue;

    public uri: vscode.Uri;
    public type: vscode.FileType;
    constructor(label: string, uri: vscode.Uri, type: vscode.FileType) {
        super(label);
        this.uri = uri;
        this.type = type;
    }

    public getTreeItem(): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(
            this.uri,
            this.type === vscode.FileType.Directory
                ? vscode.TreeItemCollapsibleState.Collapsed
                : vscode.TreeItemCollapsibleState.None
        );
        if (this.type === vscode.FileType.File) {
            treeItem.command = {
                command: 'vsnoteEditExplorer.openFileResource',
                title: 'Open File',
                arguments: [this.uri]
            };
            treeItem.contextValue = 'file';
        }

        return treeItem;
    }

    public async getChildren(element: FileSystemFileNode): Promise<FileSystemFileNode[]> {
        if (element) {
            if (element.type == vscode.FileType.Directory) {
                const children: [string, vscode.FileType][] = [];

                for (const f of readdirSync(this.uri.fsPath)) {
                    const stat = statSync(path.join(this.uri.fsPath, f));
                    const fileType = stat.isDirectory ? vscode.FileType.Directory : vscode.FileType.File;
                    children.push([f, fileType]);
                }
                return children.map(
                    ([name, type]) =>
                        new FileSystemFileNode(name, vscode.Uri.file(path.join(this.uri.fsPath, name)), type)
                );
            }
        }
        return [];
    }
}
