import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { VSNWVDomain, VSNWVCategory, VSNWVNote } from './lib';

import './index.scss';
/// <reference path ="api.d.ts">

const vscode = acquireVsCodeApi();

function VSNNotes(props: VSNWVNote) {
    const contents = props.contents.map(c => <td>{c}</td>);
    return (
        <tr>
            <td>{props.id}</td>
            {contents}
        </tr>
    );
}

function VSNCategory(props: VSNWVCategory) {
    const listnote = props.notes.map((note: any) => <VSNNotes id={note.id} contents={note.contents} />);
    return (
        <div>
            <h1>{props.name}</h1>
            <table>{listnote}</table>
        </div>
    );
}

function VNSDomain(props: VSNWVDomain) {
    console.log(props.name, 'vns domain');
    const categorys = props.categorys;
    const listCategory = categorys.map((category: VSNWVCategory) => (
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
    const message: VSNWVDomain = event.data;
    const name = message.name;
    console.log(`name ${name}`);
    const categorys = message.categorys;
    console.log(`categosy ${JSON.stringify(categorys)}`);
    ReactDOM.render(<VNSDomain name={name} categorys={categorys} />, document.getElementById('root'));
});

vscode.postMessage({ state: true });
console.log('web post');
