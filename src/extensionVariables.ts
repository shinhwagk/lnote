import { homedir } from 'os';
import * as path from 'path';
import { ExtensionContext, workspace } from 'vscode';
import untildify = require('untildify');

export namespace ext {
    export let context: ExtensionContext;
    export let dbDirPath: string;
}

export function initializeExtensionVariables(ctx: ExtensionContext): void {
    const dbpath: string | undefined = workspace.getConfiguration('vscode-note').get('dbpath');
    ext.context = ctx;
    ext.dbDirPath = path.join(dbpath ? untildify(dbpath) : path.join(homedir(), '.vscode-note'));
}
