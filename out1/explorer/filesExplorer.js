"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesExplorerProvider = void 0;
const path_1 = require("path");
const vscode_1 = require("vscode");
const fs_extra_1 = require("fs-extra");
const extensionVariables_1 = require("../extensionVariables");
class FilesExplorerProvider {
    _onDidChangeTreeData = new vscode_1.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    refresh() {
        this._onDidChangeTreeData.fire(undefined);
    }
    async getTreeItem(element) {
        return element;
    }
    async getChildren(element) {
        const fPath = element
            ? element.resourceUri.fsPath
            : extensionVariables_1.ext.gs.lnb?.getln().getById(extensionVariables_1.ext.gs.id).getFilesPath();
        if (!fPath) {
            return [];
        }
        return (0, fs_extra_1.readdirSync)(fPath).map((f) => {
            const uri = vscode_1.Uri.file((0, path_1.join)(fPath, f));
            if ((0, fs_extra_1.statSync)(uri.fsPath).isDirectory()) {
                return new vscode_1.TreeItem(uri, 1);
            }
            else {
                const item = new vscode_1.TreeItem(uri, 0);
                item.command = {
                    command: 'editExplorer.openFileResource',
                    arguments: [uri],
                    title: (0, path_1.basename)(uri.path)
                };
                item.contextValue = 'file';
                return item;
            }
        });
    }
}
exports.FilesExplorerProvider = FilesExplorerProvider;
//# sourceMappingURL=filesExplorer.js.map