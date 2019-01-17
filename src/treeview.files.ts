// import * as path from 'path';

// import {
//     TreeViewVisibilityChangeEvent,
//     Event,
//     TreeDataProvider,
//     window,
//     TreeItem,
//     TreeItemCollapsibleState,
//     EventEmitter,
//     Uri,
//     FileType,
//     FileSystemProvider
// } from 'vscode';
// import { readdirSync, statSync } from 'fs-extra';

// interface FileNode {
//     uri: Uri;
// }

// export function VSNFilesExplorer(dpath: string) {
//     const treeDataProvider = new VSNFilesTreeExplorer(dpath);
//     return window.createTreeView('vsnoteFilesExplorer', { treeDataProvider });
// }

// function readDirectory(uri: Uri): Thenable<[string, FileType][]> {
//     const files = readdirSync(uri.fsPath);
//     const result:[string,FileType][] = files.map(name => {
//         return [name, { uri: Uri.parse(path.join(uri.fsPath, name)) }]
//     }    );
//     const fs = []
//     return result;

// class VSNFilesTreeExplorer implements TreeDataProvider<FileNode> {
//     onDidChangeTreeData?: Event<FileNode>;

//     readonly dpath: string;
//     constructor(dpath: string) {
//         this.dpath = dpath;
//     }

//     getTreeItem(element: FileNode): Thenable<TreeItem> {
//         const treeItem = new TreeItem(element.uri, TreeItemCollapsibleState.None);

//         treeItem.command = {
//             command: 'fileExplorer.openFile',
//             title: 'Open File',
//             arguments: [element.uri]
//         };
//         treeItem.contextValue = 'file';

//         return Promise.resolve(treeItem);
//     }

//     getChildren(element?: FileNode): Thenable<FileNode[]> {
//         if (element) {
//             const files = await this.readDirectory(element.uri);
//             return files.map(([name, type]) => ({
//                 uri: Uri.file(path.join(element.uri.fsPath, name)),
//                 type
//             }));
//         }
//         return Promise.resolve([]);
//     }
// }
