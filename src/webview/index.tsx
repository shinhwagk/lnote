import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faPen } from '@fortawesome/free-solid-svg-icons';
import { ToWebView as twv, ToExtension as te } from '../panel/message';
import ReactTable from 'react-table';
import './index.scss';

interface vscode {
    postMessage(message: any): void;
}

declare function acquireVsCodeApi(): vscode;

const vscode: vscode = acquireVsCodeApi();

const editNote = (id: number) => () => vscode.postMessage({ command: 'edit', data: id });
const viewDoc = (id: number) => () => vscode.postMessage({ command: 'doc', data: id });

function VSNNotes(props: twv.VSNWVNote) {
    const contents = props.contents.map(c => (
        <td>
            <pre>{c}</pre>
        </td>
    ));

    const domId = props.id === 123 ? <a onClick={viewDoc(props.id)}>{props.id}</a> : <span>{props.id}</span>;

    return (
        <tr>
            <td className="id">{domId}</td>
            {contents}
            <td>
                <a onClick={editNote(props.id)}>
                    <FontAwesomeIcon inverse icon={faPen} />
                </a>
            </td>
        </tr>
    );
}

function VSNCategory(props: twv.VSNWVCategory) {
    const listnote = props.notes.map((note: any) => <VSNNotes id={note.id} contents={note.contents} />);
    return (
        <div>
            <h3>{props.name}</h3>
            <table>{listnote}</table>
        </div>
    );
}

function VNSDomain(props: twv.VSNWVDomain) {
    const categorys = props.categorys;
    const listCategory = categorys.map((category: twv.VSNWVCategory) => (
        <VSNCategory name={category.name} notes={category.notes} />
    ));
    const data = [{ abc: 11 }];
    const columns = [
        {
            Header: 'Name',
            accessor: 'name'
        }
    ]; // String-based value accessors!
    const TheadComponent = props => null; // a component returning null (to hide) or you could write as per your requirement

    return (
        <div>
            <h1>{props.name}</h1>
            <ReactTable data={data} columns={columns} TheadComponent={TheadComponent} />
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
            ReactDOM.render(<h1>Error</h1>, document.getElementById('root'));
    }
});

vscode.postMessage({ command: 'ready', data: true });
console.log('web view ready.');
