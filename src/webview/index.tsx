import { faFileAlt } from '@fortawesome/free-solid-svg-icons/faFileAlt';
import { faPen } from '@fortawesome/free-solid-svg-icons/faPen';
import { faPlus } from '@fortawesome/free-solid-svg-icons/faPlus';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
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
const editContentFile = (id: string, n: string) => () => vscode.postMessage({ command: 'edit-contentFile', data: { id, n } });
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
            <FontAwesomeIcon inverse={true} icon={faFileAlt} />
            <span>{' '}</span>
        </a>
    );
}

function VSNNotes(props: twv.WVNote) {
    const contents = props.contents.map((c, i) => (
        <div className='col' onDoubleClick={editContentFile(props.nId, (i + 1).toString())}>
            <pre>{c}</pre>
        </div>
    ));

    const isDoc = props.doc ? renderNoteDoc({ id: props.nId }) : <span>{props.nId}</span>;
    const isFiles = props.files ? renderNoteFiles({ id: props.nId }) : <span />;
    return (
        <div className='row'>
            <div className='col col-1'>
                <pre>
                    {isDoc}
                </pre>
            </div>
            {contents}
            <div className='col col-1'>
                <pre>
                    {isFiles}
                    <a onClick={editNote(props.nId)}>
                        <FontAwesomeIcon inverse={true} icon={faPen} />
                    </a>
                </pre>
            </div>
        </div>
    );
}

function VSNCategory(props: twv.WVCategory) {
    const listnote = props.notes.map((note: twv.WVNote) =>
        <VSNNotes nId={note.nId} contents={note.contents} doc={note.doc} files={note.files} />
    );

    return (
        <div className='card bg-dark text-white'>
            <div className='card-header'>{props.name + ' '}
                <a onClick={addNote(props.name!)}>
                    <FontAwesomeIcon inverse={true} icon={faPlus} />
                </a>
            </div>
            <div className='card-body'>
                <div className='container-fluid'>{listnote}</div>

            </div>
        </div>
    );
}

function VNSDomain(props: twv.WVDomain) {

    const categories = props.categories.map((category: twv.WVCategory) => (
        <div>
            <VSNCategory name={category.name} notes={category.notes} />
            <p />
        </div>
    ));

    return (
        <div>
            <h1>{props.name + ' '}
                <a onClick={addCategory()}>
                    <FontAwesomeIcon inverse={true} icon={faPlus} />
                </a>
            </h1>

            <div>{categories}</div>
        </div>
    );
}

window.addEventListener('message', (event) => {
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

vscode.postMessage({ command: 'ready' });
console.log('web view ready.');
