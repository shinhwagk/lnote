import { homedir } from 'os';
import * as path from 'path';
import { ExtensionContext, workspace, window } from 'vscode';
import untildify = require('untildify');

export namespace ext {
    export let context: ExtensionContext;

    export let dbDirPath: string;
    export let notesDirPath: string;
    export let domainsFilePath: string;
    export let seqFilePath: string;
}

export function initializeExtensionVariables(ctx: ExtensionContext): void {
    const dbpath: string | undefined = workspace.getConfiguration('vscode-note').get('dbpath');

    ext.context = ctx;
    ext.dbDirPath = path.join(dbpath ? untildify(dbpath) : path.join(homedir(), '.vscode-note'));
    window.showInformationMessage(ext.dbDirPath);
    // ext.notesDirPath = path.join(ext.dbDirPath, 'notes');
    // ext.domainsFilePath = path.join(ext.dbDirPath, 'domains.json');
    // ext.seqFilePath = path.join(ext.dbDirPath, 'seq');
}
