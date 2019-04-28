import { faPen } from '@fortawesome/free-solid-svg-icons/faPen';
import { faPlus } from '@fortawesome/free-solid-svg-icons/faPlus';
import { faLink } from '@fortawesome/free-solid-svg-icons/faLink'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ToWebView as twv } from '../panel/notesMessage';

import './index.scss';

interface vscode {
    postMessage(message: any): void;
}
// declare function acquireVsCodeApi(): vscode;
declare const vscode: vscode;

const addCategory = () => () => vscode.postMessage({ command: 'add-category' });
const addNote = (category: string) => () => vscode.postMessage({ command: 'add', data: category });
const editNote = (id: string, category: string) => () => vscode.postMessage({ command: 'edit', data: { id, category } });
const editContentFile = (id: string, n: string) => () => vscode.postMessage({ command: 'edit-contentFile', data: { id, n } });
const editCol = (id: string, cn: string) => () => vscode.postMessage({ command: 'edit-col', data: { id, cn } });
const viewDoc = (id: string) => () => vscode.postMessage({ command: 'doc', data: id });
const viewFiles = (id: string) => () => vscode.postMessage({ command: 'files', data: id });
const viewLinks = (id: string) => () => vscode.postMessage({ command: 'links', data: id });

function renderNoteDoc(props: { id: string }) {
    return (
        <a onClick={viewDoc(props.id)}>
            <span>{props.id.substr(0, 3)}</span>
        </a>
    );
}

function renderNoteFiles(props: { id: string }) {
    return (
        <a onClick={viewFiles(props.id)}>
            <span>{props.id.substr(3, 3)}</span>
        </a>
    );
}

function VSNNotes(props: WVNote) {
    const contents = props.contents.map((c, i) => (
        <div
            className="col"
            onDoubleClick={editContentFile(props.nId, (i + 1).toString())}
            onContextMenu={editCol(props.nId, (i + 1).toString())}
        >
            <pre className="vsn-col">{c || ' '}</pre>
        </div>
    ));

    const isDoc = props.doc ? renderNoteDoc({ id: props.nId }) : <span>{props.nId.substr(0, 3)}</span>;
    const isFiles = props.files ? renderNoteFiles({ id: props.nId }) : <span>{props.nId.substr(3, 3)}</span>;
    const islinks = props.links ? <a onClick={viewLinks(props.nId)}><FontAwesomeIcon inverse={true} icon={faLink} /></a> : <span />;

    return (
        <div className="row">
            <div className="col col-1">
                <pre>
                    {isDoc}
                    {isFiles}
                </pre>
            </div>
            {contents}
            <div className="col col-1">
                <pre>
                    <a onClick={editNote(props.nId, props.category)}>
                        <FontAwesomeIcon inverse={true} icon={faPen} />
                    </a>
                    {' '}
                    {islinks}
                </pre>
            </div>
        </div>
    );
}

function VSNCategory(props: twv.WVCategory) {
    const listnote = props.notes.map((note: twv.WVNote) => (
        <VSNNotes category={props.name} nId={note.nId} contents={note.contents} doc={note.doc} files={note.files} links={note.links} />
    ));

    return (
        <div id={props.name} className="card bg-dark text-white">
            <div className="card-header">
                {props.name + ' '}
                <a onClick={addNote(props.name)}>
                    <FontAwesomeIcon inverse={true} icon={faPlus} />
                </a>
            </div>
            <div className="card-body">
                <div className="container-fluid">{listnote}</div>
            </div>
        </div>
    );
}

// function VSNCategoryTitle(props: { cnames: string[] }) {
//     const categoryList = props.cnames.map(name => (
//         <a href={'#' + name} className="badge badge-info">
//             {name}
//         </a>
//     ));
//     return (
//         <div>
//             {categoryList}
//             <p />
//         </div>
//     );
// }

function VNSDomain(props: twv.WVDomain) {
    const categories = props.categories.map((category: twv.WVCategory) => (
        <div>
            <VSNCategory name={category.name} notes={category.notes} />
            <p />
        </div>
    ));

    return (
        <div>
            <h1>
                {props.name + ' '}
                <a onClick={addCategory()}>
                    <FontAwesomeIcon inverse={true} icon={faPlus} />
                </a>
            </h1>
            {/* <VSNCategoryTitle cnames={props.categories.map(c => c.name)} /> */}
            <div>{categories}</div>
        </div>
    );
}

window.addEventListener('message', event => {
    const message: twv.DomainData = event.data;

    switch (message.command) {
        case 'data':
            const name = message.data.name;
            const categories = message.data.categories;
            ReactDOM.render(<VNSDomain name={name} categories={categories} />, document.getElementById('root'));
            break;
        default:
            ReactDOM.render(<h1>loading...{message}</h1>, document.getElementById('root'));
    }
});

interface WVNote {
    category: string;
    nId: string;
    contents: string[];
    doc: boolean;
    files: boolean;
    links: boolean;
}
