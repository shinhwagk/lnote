import { existsSync, watchFile } from 'fs';
import path from 'path';
import {
  commands, ConfigurationChangeEvent, ExtensionContext, StatusBarItem, TreeView, window, workspace
} from 'vscode';

import { section } from './constants';
import { VNNotebook } from './database/notebook';
import { VNNotebookSet } from './database/notebookset';
import { DomainExplorerProvider, DomainNode } from './explorer/domainExplorer';
import { FilesExplorerProvider } from './explorer/filesExplorer';
import { tools, vfs } from './helper';
import { NotesPanelView } from './panel/notesPanelView';

export class GlobalState {
  nId: string = '';
  domainNode: DomainNode;
  domainNodeFormat: string[];
  // domainNodeFormatWithoutNBName: string[];
  nbName: string; //notebook name
  nb: VNNotebook;

  constructor(domainNode: string) {
    this.domainNode = domainNode;
    this.domainNodeFormat = tools.splitDomaiNode(domainNode);
    // this.domainNodeFormatWithoutNBName = this.domainNodeFormat.slice(1);
    this.nbName = this.domainNodeFormat[0];
    this.nb = ext.vnNotebookSet.getNB(this.nbName);
    // this.nbDomain = domain;
    // this.nbNotes = notes;
    // this.vnNoteBook = new VNNotebook(ext.notebookPath)
  }

  static update(domainNode: string) {
    ext.gs = new GlobalState(domainNode);
  }
}

export namespace ext {
  export let context: ExtensionContext;
  export let domainProvider: DomainExplorerProvider;
  export let domainTreeView: TreeView<DomainNode>;
  export let filesProvider: FilesExplorerProvider;
  export let notesPanelView: NotesPanelView;
  export let notebookPath: string;
  export let shortcutsFilePath: string;
  export let gs: GlobalState;
  export const updateGS = GlobalState.update;
  export let vnNotebookSet: VNNotebookSet;
  export const setContext = <T>(ctx: string, value: T) => commands.executeCommand('setContext', ctx, value);
  export const registerCommand = (command: string, callback: (...args: any[]) => any, thisArg?: any) =>
    context.subscriptions.push(commands.registerCommand(command, callback, thisArg));
  export let domainShortcutStatusBarItem: StatusBarItem;
  export let windowId = (new Date()).getTime().toString();

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
        ext.vnNotebookSet = new VNNotebookSet(ext.notebookPath);
        initializeExtensionVariables(ctx);
        ext.domainProvider.refresh();
      }
    })
  );
}

export function listenEditFileClose(ctx: ExtensionContext) {
  ctx.subscriptions.push(
    workspace.onDidCloseTextDocument(() => {
      // if (ext.vnNotebookSet === undefined) { return; }
      if (ext.vnNotebookSet && ext.gs.nb && existsSync(ext.gs.nb.editFile)) {
        ext.gs.nb.processEditEnv();
        if (!ext.gs.nb.checkEditEnvClear()) {
          window.showErrorMessage(`The editing environment is not cleaned up.\n File: ${ext.gs.nb.editFile}`);
        }
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

export function listenEditFileSave(ctx: ExtensionContext) {
  ctx.subscriptions.push(
    workspace.onDidSaveTextDocument(async () => {
      // if (ext.vnNotebookSet === undefined) { return; }
      if (ext.vnNotebookSet && ext.gs.nb && existsSync(ext.gs.nb.editFile)) {
        ext.gs.nb.processEditEnv();
        // const fileName = path.basename(f.uri.fsPath);
        // if (fileName.endsWith('.yaml')) {
        //   const [nId,] = fileName.split('.');
        //   const enote = tools.readYamlSync(f.uri.fsPath);
        //   // ext.gs.nb.updateNote(nId, enote.contents, enote.labels);
        //   const n = ext.gs.nb.getNoteById(nId);
        //   n.updateDataContents(enote.contents);
        //   n.updateLabels(enote.labels);
        //   // const note = ext.gs.nbNotes.getNoteByid(nId)
        //   // ext.notesPanelView.postNote({ nId: nId, ...note });
        //   await ext.notesPanelView.postData();
        // }
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
      ext.vnNotebookSet.refresh();
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
  ext.vnNotebookSet = new VNNotebookSet(ext.notebookPath);
  // ext.gs = new GlobalState();

  if (!ext.notesPanelView) {
    ext.notesPanelView = new NotesPanelView();
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

