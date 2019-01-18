import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { ToWebView as twv } from '../panel/message';

import './index.scss';

interface vscode {
    postMessage(message: any): void;
}

declare function acquireVsCodeApi(): vscode;

const vscode: vscode = acquireVsCodeApi();

function VSNNotes(props: twv.VSNWVNote) {
    const contents = props.contents.map(c => <td>{c}</td>);
    return (
        <tr>
            <td>{props.id}</td>
            {contents}
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
    return (
        <div>
            <h1>{props.name}</h1>
            <div>{listCategory} </div>
        </div>
    );
}

window.addEventListener('message', event => {
    console.log(event.data);
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

vscode.postMessage({ state: true });
console.log('web post');
