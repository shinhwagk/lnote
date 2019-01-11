import * as React from "react";
import * as ReactDOM from "react-dom";

/// <reference path ="webview.d.ts">

const vscode = acquireVsCodeApi();

export interface NoteProps {
    cols: string[];
}

export interface DomainProps {
    name: string;
    categorys?: CategoryProps[];
}

export interface CategoryProps {
    name: string;
    notes: NoteProps[];
}

class VSNNotes extends React.Component<NoteProps, {}> {
    render() {
        return <td>
            <tr> {this.props.cols.map(col => <td>col</td>)} </tr>
        </td>;
    }
}

function VSNCategory(props: CategoryProps) {
    const listnote = this.props.notes.map((note: any) => <tr></tr>);
    return <div>
        <h1>222</h1>
        <table>{listnote}</table>
    </div>;
}

function VNSDomain(props: DomainProps) {
    // const categorys = props.categorys;
    // const listCategory = categorys.map((category: CategoryProps) =>
    //     <VSNCategory name={category.name} notes={category.notes} />);
    return <div>
        <h1>{props.name}</h1>
    </div>;
}

window.addEventListener('message', event => {
    console.log(JSON.stringify(event.data))
    const message: DomainProps = event.data;
    const name = message.name;
    const categorys = message.categorys;
    ReactDOM.render(<VNSDomain name={name} categorys={categorys} />, document.getElementById("root"));
});
vscode.postMessage({status:"ready"});
console.log("web post");