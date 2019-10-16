import { faPen } from '@fortawesome/free-solid-svg-icons/faPen';
import { faPlus } from '@fortawesome/free-solid-svg-icons/faPlus';
import { faSearch } from '@fortawesome/free-solid-svg-icons/faSearch';
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

// const searchNotes = (key: string) => () => vscode.postMessage({ command: 'search-notes', data: key });
const addCategory = () => () => vscode.postMessage({ command: 'add-category' });
const addNote = (category: string) => () => vscode.postMessage({ command: 'add', data: category });
const editNote = (id: string, category: string) => () => vscode.postMessage({ command: 'edit', data: { id, category } });
const editContentFile = (id: string, n: string) => () => vscode.postMessage({ command: 'edit-contentFile', data: { id, n } });
const editCol = (id: string, cn: string) => () => vscode.postMessage({ command: 'edit-col', data: { id, cn } });
const viewDoc = (id: string) => () => vscode.postMessage({ command: 'doc', data: id });
const viewFiles = (id: string) => () => vscode.postMessage({ command: 'files', data: id });

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
            onDoubleClick={editContentFile(props.nId, (i + 1).toString())}
            onContextMenu={editCol(props.nId, (i + 1).toString())}
        >
            {c || ' '}
        </div>
    ));

    const isDoc = props.doc ? renderNoteDoc({ id: props.nId }) : <span>{props.nId.substr(0, 3)}</span>;
    const isFiles = props.files ? renderNoteFiles({ id: props.nId }) : <span>{props.nId.substr(3, 3)}</span>;
    const gridNoteContentStyle: React.CSSProperties = { gridTemplateColumns: `repeat(${contents.length}, 1fr)` };

    return (
        <div className="grid-note">
            <div className="grid-note-id">
                {isDoc}
                {isFiles}
            </div>
            <div className="grid-note-content" style={gridNoteContentStyle}>
                {contents}
            </div>
            <div className="grid-note-edit">
                <a onClick={editNote(props.nId, props.category)}>
                    <FontAwesomeIcon className="icon" icon={faPen} />
                </a>
            </div>
        </div>
    );
}

function VSNCategory(props: twv.WVCategory) {
    const listnote = props.notes.map((note: twv.WVNote) => (
        <VSNNotes category={props.name} nId={note.nId} contents={note.contents} doc={note.doc} files={note.files} />
    ));

    return (
        <div id={props.name} className="grid-category">
            <div className="grid-category-name">
                {props.name + ' '}
                <a onClick={addNote(props.name)}>
                    <FontAwesomeIcon className="icon" size="xs" icon={faPlus} />
                </a>
            </div>
            <div className="grid-category-body">{listnote}</div>
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

function filterNotes(categories: twv.WVCategory[], key: string) {
    const newCategory: twv.WVCategory[] = [];
    for (const category of categories) {
        const newNotes: twv.WVNote[] = [];
        for (const note of category.notes) {
            for (const content of note.contents) {
                const result = new RegExp(key).test(content);
                if (result) {
                    newNotes.push(note);
                }
            }
        }
        if (newNotes.length >= 1) {
            newCategory.push({ name: category.name, notes: newNotes });
        }
    }
    return newCategory;
}

function VNSDomain(props: WVDomain) {
    const [name, setName] = React.useState({ switch: false, key: '' });

    let filterCategories: twv.WVCategory[] = props.categories;

    const categories = () => {
        console.log('pppp' + JSON.stringify(filterCategories));
        return filterNotes(props.categories, name.key).map((category: twv.WVCategory) => (
            <div>
                <VSNCategory name={category.name} notes={category.notes} />
                <p />
            </div>
        ));
    };

    const handleLogoutClick = () => {
        console.log(name.switch);
        if (name.switch) {
            setName({ switch: false, key: '' });
            filterCategories = props.categories;
        } else {
            setName({ switch: true, key: '' });
        }
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setName({ switch: true, key: event.target.value });
    };

    const search = () => {
        if (name.switch) {
            return <input type="text" onChange={handleChange}></input>;
        }
        return <a></a>;
    };

    return (
        <div>
            <h2>
                {props.dpath.join(' / ') + ' '}
                <a onClick={addCategory()}>
                    <FontAwesomeIcon className="icon" size="sm" icon={faPlus} />
                </a>
                <a onClick={handleLogoutClick}>
                    <FontAwesomeIcon className="icon" size="sm" icon={faSearch} />
                </a>
            </h2>
            {search()}
            {/* <VSNCategoryTitle cnames={props.categories.map(c => c.name)} /> */}
            <div className="grid-notes">{categories()}</div>
        </div>
    );
}

window.addEventListener('message', event => {
    const message: twv.DomainData = event.data;

    switch (message.command) {
        case 'data':
            const dpath = message.data.dpath;
            const categories = message.data.categories;
            ReactDOM.render(<VNSDomain dpath={dpath} categories={categories} />, document.getElementById('root'));
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
}

interface WVDomain {
    dpath: string[];
    categories: twv.WVCategory[];
}
