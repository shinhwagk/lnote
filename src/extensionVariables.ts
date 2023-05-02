import { existsSync, watchFile } from 'fs';
import path from 'path';
import {
  commands, ConfigurationChangeEvent, ExtensionContext, StatusBarItem, TreeView, window, workspace
} from 'vscode';

import { section } from './constants';
import { LNotebook } from './database/notebook';
import { LNotebooks } from './database/notebooks';
import { DomainExplorerProvider } from './explorer/domainExplorer';
import { FilesExplorerProvider } from './explorer/filesExplorer';
import { vfs } from './helper';
import { LWebPanelView } from './panel/webPanelView';
import { DomainNode, DomainNodeSplit, NoteId } from './types';
// import { WebStatus } from './panel/web';

export class GlobalState {
  id: NoteId = '';
  nb: string | undefined; //notebook name
  lnb: LNotebook | undefined;
  domainNode: DomainNodeSplit = [];

  update(nb: string) {
    this.nb = nb;
    this.lnb = ext.lnbs.get(nb);
  }
}

export namespace ext {
  export let context: ExtensionContext;
  export let domainProvider: DomainExplorerProvider;
  export let domainTreeView: TreeView<DomainNode>;
  export let filesProvider: FilesExplorerProvider;
  export let lwebPanelView: LWebPanelView;
  export let notebookPath: string;
  export let shortcutsFilePath: string;
  export const gs: GlobalState = new GlobalState();
  export let lnbs: LNotebooks;
  export const setContext = <T>(ctx: string, value: T) => commands.executeCommand('setContext', ctx, value);
  export const registerCommand = (command: string, callback: (...args: any[]) => any, thisArg?: any) =>
    context.subscriptions.push(commands.registerCommand(command, callback, thisArg));
  export let domainShortcutStatusBarItem: StatusBarItem;
  export let windowId = (new Date()).getTime().toString();
  // export const webState = new WebStatus();

  // export const editNotes = new Map<string, string[]>();
}

// function getShortcutsFilePath() {
//     return path.join(ext.masterPath, 'shortcuts.json');
// }

export function listenConfiguration(ctx: ExtensionContext) {
  ctx.subscriptions.push(
    workspace.onDidChangeConfiguration(async (e: ConfigurationChangeEvent) => {
      if (e.affectsConfiguration(section)) {
        const notebookPath = workspace.getConfiguration(section).get<string>('notespath');
        if (notebookPath === undefined || notebookPath === '') {
          window.showInformationMessage('configuretion "notespath" wrong.');
          return;
        }
        ext.notebookPath = notebookPath;
        ext.lnbs = new LNotebooks(ext.notebookPath);
        initializeExtensionVariables(ctx);
        ext.domainProvider.refresh();
      }
    })
  );
}

export function listenEditorFileClose(ctx: ExtensionContext) {
  ctx.subscriptions.push(
    workspace.onDidCloseTextDocument((e) => {
      // if (ext.vnNotebookSet === undefined) { return; }
      if (
        ext.lnbs
        && ext.lnbs.editor.checkEditorFile()
        // && ext.lnbs.getEditorFile() === e.fileName
      ) {
        ext.lnbs.editor.archiveEditor();
        // ext.gs.nb.processEditEnv();
        // if (!ext.gs.nb.checkEditorCleaned()) {
        //   window.showErrorMessage(`The editing environment is not cleaned up.\n File: ${ext.gs.nb.getEditorFile()}`);
        //   // commands.executeCommand('editExplorer.openFileResource', Uri.file(ext.gs.nb.getEditorFile()));
        //   return
        // }
        // ext.gs.nb.clearEditor();

        // ext.gs.nb.deleteEditEnv();
        // const fileName = path.basename(f.uri.fsPath);
        // if (fileName.endsWith('.yaml')) {
        //   const [nId,] = fileName.split('.');
        //   ext.gs.nbNotes.removeEditNoteEnv(nId);
        //   // ext.notesPanelView.postNote(ext.gs.nbNotes.getNoteByid(nId));
        // }
      }
    })
  );
}

export function listenEditorFileSave(ctx: ExtensionContext) {
  ctx.subscriptions.push(
    workspace.onDidSaveTextDocument(async () => {
      if (
        ext.lnbs && ext.lnbs.editor.checkEditorFile()
      ) {
        try {
          ext.lnbs.processEditor();
        } catch (e) {
          window.showErrorMessage(`${e}`);
          return;
        }
        ext.lwebPanelView.refresh();
      }
    })
  );
}

export function listenVscodeWindowChange() {
  const vscodeWindowCheckFile = path.join(ext.notebookPath, 'windowid');
  if (!existsSync(vscodeWindowCheckFile)) {
    vfs.writeFileSync(vscodeWindowCheckFile, ext.windowId);
  }
  watchFile(vscodeWindowCheckFile, () => {
    if (vfs.readFileSync(vscodeWindowCheckFile) !== ext.windowId) {
      ext.windowId = (new Date()).getTime().toString();
      vfs.writeFileSync(vscodeWindowCheckFile, ext.windowId);
      ext.lnbs.refresh();
    }
  });
}

export function initializeExtensionVariables(ctx: ExtensionContext): void {
  ext.context = ctx;

  const notespath = workspace.getConfiguration(section).get<string>('notespath');

  if (notespath === undefined || notespath === '') {
    return;
  }
  ext.notebookPath = notespath.endsWith('/') ? notespath : notespath + '/';
  ext.lnbs = new LNotebooks(ext.notebookPath);
  // ext.gs = new GlobalState();

  if (!ext.lwebPanelView) {
    ext.lwebPanelView = new LWebPanelView();
  }

  if (!ext.domainProvider || !ext.domainTreeView) {
    ext.domainProvider = new DomainExplorerProvider();
    ext.domainTreeView = window.createTreeView('domainExplorer', { treeDataProvider: ext.domainProvider });
  }

  if (!ext.filesProvider) {
    ext.filesProvider = new FilesExplorerProvider();
    window.createTreeView('filesExplorer', { treeDataProvider: ext.filesProvider });
  }

  // if (!ext.notesPanelView) {
  //     ext.notesPanelView = new NotesPanelView();
  // }

  // if (!ext.domainProvider || !ext.domainTreeView) {
  //     ext.domainProvider = new DomainExplorerProvider(ext.domainDB);
  //     ext.domainTreeView = window.createTreeView('domainExplorer', { treeDataProvider: ext.domainProvider });
  // }

  // if (!ext.filesProvider) {
  //     ext.filesProvider = new FilesExplorerProvider();
  //     window.createTreeView('filesExplorer', { treeDataProvider: ext.filesProvider });
  // }
  // if (!ext.domainShortcutStatusBarItem) {
  //     ext.domainShortcutStatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 1);
  //     ext.domainShortcutStatusBarItem.text = '$(list-unordered) Domains(Last)';
  //     ext.domainShortcutStatusBarItem.command = 'lnote.shortcuts.last';
  //     ext.domainShortcutStatusBarItem.show();
  //     ext.context.subscriptions.push(ext.domainShortcutStatusBarItem);
  // }
}

