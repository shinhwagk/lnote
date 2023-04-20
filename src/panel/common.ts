// import { NBNote } from "../database/note";
// import { ExtCmds } from "../extensionCommands";
// import { ext } from "../extensionVariables";
// import { IWebNote } from "./itypes";


// export function convertForWebStruct(notes: NBNote[]): IWebNote[] {
//     return notes
//         .map(n => {
//             const isDoc = n.checkDocExist();
//             const isFiles = n.checkFilesExist();
//             const _n = JSON.parse(JSON.stringify(n)); // clone obj
//             const alOfNote = n.getDataArrayLabels(); //.concat(ext.gs.nbName);
//             _n['labels'] = alOfNote;
//             return { nb: n.getNBName(), nId: n.getId(), doc: isDoc, files: isFiles, labels: alOfNote, ..._n };
//         });
// }

// export function async postNotes(notes: IWebNote[]) {
//     await ext.panel!.webview.postMessage({
//         command: 'post-notes',
//         data: { notes: notes }
//     });
// }

// export const xx = async (msg) => {
//     switch (msg.command) {
//         case 'search':
//             const notes = ext.lnbs.search(msg.data.keywords);
//             await this.postNotes(convertForWebStruct(notes));
//             break;
//         case 'note-edit':
//             ExtCmds.cmdHdlNoteEditor(msg.params);
//             break;
//         case 'note-doc-show':
//             ExtCmds.cmdHdlNotebookNoteDocShow(msg.params);
//             break;
//         case 'note-files-open':
//             ExtCmds.cmdHdlNoteFilesOpen(msg.params);
//             break;
//         case 'note-files-create':
//             ExtCmds.cmdHdlNoteFilesCreate(msg.params);
//             break;
//         case 'note-doc-create':
//             ExtCmds.cmdHdlNBNoteDocCreate(msg.params);
//             break;
//         case 'edit-note-openfolder':
//             ExtCmds.cmdHdlNoteOpenFolder(msg.data.nId);
//             break;
//     }
// }