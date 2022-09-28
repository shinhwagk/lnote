import * as path from 'path';

import * as vscode from 'vscode';

import { ext } from '../extensionVariables';
import { ToWebView as twv } from './notesMessage';
import { ExtCmds } from '../extensionCommands';

export class NotesPanelView {
  private panel: vscode.WebviewPanel | undefined = undefined;
  private viewData: twv.WVDomain | undefined;
  private domainNode: string[] = [];

  private assetsFile = (name: string) => {
    const file = path.join(ext.context.extensionPath, 'out', name);
    return vscode.Uri.file(file).with({ scheme: 'vscode-resource' }).toString();
  };

  // const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);
  private getWebviewContent() {
    const stylesPathMainPath = vscode.Uri.joinPath(ext.context.extensionUri, 'out', 'main.css');
    const stylesMainUri = this.panel?.webview.asWebviewUri(stylesPathMainPath);
    const nonce = getNonce();
    return `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <link href="${stylesMainUri}" rel="stylesheet">
                    <script nonce="${nonce}" src="https://kit.fontawesome.com/61b8139299.js" crossorigin="anonymous" ></script>
                    <title>vscode-note</title>
                </head>
                <body>
                    <div id="root">
                        <div id="content"></div>
                        <ul id="contextMenu" class="contextMenu"></ul>
                    </div>
                    <script>
                        const vscode = acquireVsCodeApi();
                    </script>
                    <script nonce="${nonce}" src="${this.assetsFile('main.js')}"></script>
                </body>
                </html>`;
  }

  showNotesPlanView(): void {
    if (!this.panel) {
      this.initPanel();
    }

    this.panel!.webview.postMessage({
      command: 'post-data',
      data: {
        domainNotes: ext.notebookDatabase.getNotesOfDomain(this.domainNode),
        domainNode: this.domainNode,
        domainLabels: ext.notebookDatabase.getLabelsOfDomain(this.domainNode).sort()
      }
    });
    if (!this.panel!.visible) {
      this.panel!.reveal(vscode.ViewColumn.One);
    }
  }

  public postNote(note: any) {
    this.panel!.webview.postMessage({
      command: 'post-note',
      data: { note: note }
    });
  }

  public removeNote(nId: string) {
    this.panel!.webview.postMessage({
      command: 'delete-note',
      data: { nId: nId }
    });
  }

  private initPanel() {
    this.panel = vscode.window.createWebviewPanel('vscode-note', 'vscode-note', vscode.ViewColumn.One, {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(ext.context.extensionUri, 'out')]
    });
    this.panel.iconPath = vscode.Uri.joinPath(ext.context.extensionUri, 'images/wv-icon.svg');
    this.panel.onDidDispose(
      () => {
        this.panel = undefined;
        console.log('vsnote webview closed.');
      },
      null,
      ext.context.subscriptions
    );
    this.panel.onDidChangeViewState(
      (e) => {
        const panel = e.webviewPanel;
        if (panel.visible) {
          // this.parseDomain();
          // this.showNotesPlanView();
        }
      },
      null,
      ext.context.subscriptions
    );
    this.panel.webview.onDidReceiveMessage(
      (msg) => {
        switch (msg.command) {
          case 'get-data':
            this.panel!.webview.postMessage({
              command: 'post-data',
              data: {
                domainNotes: ext.notebookDatabase.getNotesOfDomain(this.domainNode),
                domainNode: this.domainNode,
                domainLabels: ext.notebookDatabase.getLabelsOfDomain(this.domainNode).sort()
              }
            });
            break;
          case 'get-notes':
            this.panel!.webview.postMessage({
              command: 'post-notes',
              data: {
                notes: ext.notebookDatabase.getNotesOfDomain(this.domainNode)
              }
            });
            break;
          case 'get-domain':
            this.panel!.webview.postMessage({
              command: 'post-domain',
              data: {
                domainNode: this.domainNode,
                domainLabels: ext.notebookDatabase.getLabelsOfDomain(this.domainNode).sort()
              }
            });
            console.log(ext.notebookDatabase.getLabelsOfDomain(this.domainNode));
            break;
          case 'get-labels':
            const labelsOfNotebook = [...ext.notebookDatabase.getNBLabels(this.domainNode[0]).keys()];
            const labelsOfDomainNode = ext.notebookDatabase.getLabelsOfDomain(this.domainNode);
            this.panel!.webview.postMessage({
              command: 'post-labels',
              data: {
                checkedLabels: labelsOfDomainNode,
                unCheckedLabels: labelsOfNotebook.filter(l => !labelsOfDomainNode.includes(l))
              }
            });
            break;
          case 'get-notes-by-labels':
            const notes = ext.notebookDatabase.getNotesByLabels(this.domainNode[0], msg.data.checkedLabels);
            this.panel!.webview.postMessage({
              command: 'post-notes',
              data: {
                notes: notes
              }
            });
            break;
          case 'note-add':
            ExtCmds.cmdHdlNoteAdd(msg.data.labels);
            break;
          case 'notebook-note-edit':
            ExtCmds.cmdHdlNotebookNoteEdit(msg.data.nId);
            break;
          case 'notes-edit-labels':
            ExtCmds.cmdHdlNotesEditlabels(msg.data.nIds, msg.data.labels);
            break;
          // case 'notebook-note-contents-add':
          //   ExtCmds.cmdHdlNotebookNoteContentsAdd(msg.data.nId, msg.data.cn);
          //   break;
          case 'notebook-note-doc-show':
            ExtCmds.cmdHdlNotebookNoteDocShow(msg.data.nId);
            break;
          case 'notebook-note-files-open':
            ExtCmds.cmdHdlNoteFilesOpen(msg.data.nId);
            break;
          case 'notebook-note-files-create':
            ExtCmds.cmdHdlNoteFilesCreate(msg.data.nId);
            break;
          case 'notebook-note-doc-create':
            ExtCmds.cmdHdlNBNoteDocCreate(msg.data.nId);
            break;
          case 'note-remove':
            ExtCmds.cmdHdlNBNoteRemove(msg.data.nId);
            break;
          case 'edit-note-openfolder':
            ExtCmds.cmdHdlNoteOpenFolder(msg.data.nId);
            break;
          case 'category-add':
            ExtCmds.cmdHdlDomainCategoryAdd();
            break;
          case 'col-to-terminal':
            ExtCmds.cmdHdlNoteColToActiveTermianl(msg.data.id, msg.data.cidx);
            break;
          case 'col-to-terminal-args':
            ExtCmds.cmdHdlNoteColToActiveTermianl(msg.data.id, msg.data.cidx);
            break;
          case 'domain-relabels':
            ExtCmds.cmdHdlDomainRelabels(msg.data.labels);
            break;
        }
      },
      undefined,
      ext.context.subscriptions
    );
    this.panel.webview.html = this.getWebviewContent();
  }

  public parseDomain(domainNode?: string[], labels?: string[]) {
    this.domainNode = domainNode || this.domainNode;
    // this.viewData = this.genViewData(labels);
    return this;
  }



  // private genViewData(checkedLabels?: string[]): any {
  //   const wvCategories: twv.WVCategory[] = [];
  //   const labels = checkedLabels === undefined ? ext.notebookDatabase.getLabelsOfDomain(this.domainNode) : checkedLabels;
  //   const labelsOfNotebook = [...ext.notebookDatabase.getNBLabels(this.domainNode[0]).keys()];
  //   const notes = ext.notebookDatabase.getNotesByLabels(this.domainNode[0], labels);
  //   // const notesOfLabels = ext.notebookDatabase.getNBLabels(this.domainNode[0]);
  //   for (const note of notes) {
  //     const cname = note.category;
  //     if (wvCategories.filter((c) => c.name === cname).length === 0) {
  //       wvCategories.push({ name: cname, notes: [], labels: labels[cname] });
  //     }
  //     const isDoc = ext.notebookDatabase.checkDocExist(this.domainNode[0], note.nId);
  //     const isFiles = ext.notebookDatabase.checkFilesExist(this.domainNode[0], note.nId);
  //     const contents = note.contents;
  //     const cDate = (new Date(note.cts)).toISOString();
  //     const mDate = (new Date(note.mts)).toISOString();
  //     if (wvCategories.filter((c) => c.name === cname).length >= 1) {
  //       wvCategories.filter((c) => c.name === cname)[0].notes.push({ nId: note.nId, contents, doc: isDoc, files: isFiles, cDate, mDate });
  //     }
  //   }
  //   return {
  //     dpath: this.domainNode,
  //     categories: wvCategories,
  //     checkedLabels: labels,
  //     unCheckedLabels: labelsOfNotebook.filter(l => !labels.includes(l))
  //   };

  // }

}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
