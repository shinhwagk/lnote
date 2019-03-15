import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen } from '@fortawesome/free-solid-svg-icons/faPen';
import { faPlus } from '@fortawesome/free-solid-svg-icons/faPlus';
import { faFileAlt } from '@fortawesome/free-solid-svg-icons/faFileAlt';
import { ToWebView as twv } from '../panel/notesMessage';

import './index.scss';

interface vscode {
    postMessage(message: any): void;
}
declare function acquireVsCodeApi(): vscode;
const vscode: vscode = acquireVsCodeApi();

const addCategory = () => () => vscode.postMessage({ command: 'add-category' });
const addNote = (category: string) => () => vscode.postMessage({ command: 'add', data: category });
const editNote = (id: string) => () => vscode.postMessage({ command: 'edit', data: id });
const viewDoc = (id: string) => () => vscode.postMessage({ command: 'doc', data: id });
const viewFiles = (id: string) => () => vscode.postMessage({ command: 'files', data: id });

function renderNoteDoc(props: { id: string }) {
    return (
        <a onClick={viewDoc(props.id)}>
            <span>{props.id}</span>
        </a>
    );
}

function renderNoteFiles(props: { id: string }) {
    return (
        <a onClick={viewFiles(props.id)}>
            <FontAwesomeIcon inverse icon={faFileAlt} />
            <span> </span>
        </a>
    );
}

function VSNNotes(props: twv.VSNWVNote) {
    const contents = props.contents.map(c => (
        <div className="col">
            <pre>{c}</pre>
        </div>
    ));

    const isDoc = props.doc ? renderNoteDoc({ id: props.id }) : <span>{props.id}</span>;
    const isFiles = props.files ? renderNoteFiles({ id: props.id }) : <span />;
    return (
        <div className="row">
            <div className="col col-1">
                <pre>
                    {isDoc}
                </pre>
            </div>
            {contents}
            <div className="col col-1">
                <pre>
                    {isFiles}
                    <a onClick={editNote(props.id)}>
                        <FontAwesomeIcon inverse icon={faPen} />
                    </a>
                </pre>
            </div>
        </div>
    );
}

function VSNCategory(props: twv.VSNWVCategory) {
    const listnote = props.notes.map((note: twv.VSNWVNote) => (
        <VSNNotes id={note.id} contents={note.contents} doc={note.doc} files={note.files} />
    ));

    return (
        <div className="card bg-dark text-white">
            <div className="card-header">{props.name + ' '}
                <a onClick={addNote(props.name!)}>
                    <FontAwesomeIcon inverse icon={faPlus} />
                </a>
            </div>
            <div className="card-body">
                <div className="container-fluid">{listnote}</div>
            </div>
        </div>
    );
}

function VNSDomain(props: twv.VSNWVDomain) {
    const categorys = props.categorys;
    const listCategory = categorys.map((category: twv.VSNWVCategory) => (
        <div>
            <VSNCategory name={category.name} notes={category.notes} />
            <p></p>
        </div>
    ));

    return (
        <div>
            <h1>{props.name + ' '}
                <a onClick={addCategory()}>
                    <FontAwesomeIcon inverse icon={faPlus} />
                </a>
            </h1>

            <div>{listCategory} </div>
        </div>
    );
}

window.addEventListener('message', event => {
    const message: twv.DomainData = event.data;
    switch (message.command) {
        case 'data':
            const name = message.data.name;
            const categorys = message.data.categorys;
            ReactDOM.render(<VNSDomain name={name} categorys={categorys} />, document.getElementById('root'));
            break;
        default:
            ReactDOM.render(<h1>Error: {message}</h1>, document.getElementById('root'));
    }
});

vscode.postMessage({ command: 'ready', data: true });
console.log('web view ready.');
