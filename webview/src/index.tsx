import * as React from "react";
import * as ReactDOM from "react-dom";

/// <reference path ="vscode.d.ts">

const vscode = acquireVsCodeApi();

class Foo extends React.Component {
    constructor(props:any) {
        
        super(props);
        this.handleClick = this.handleClick.bind(this);
    }
    handleClick() {
        vscode.postMessage({
            command: 'alert'
        })
        console.log('Click happened');
    }
    render() {
        return <button onClick={this.handleClick}>Click Me</button>;
    }
}

ReactDOM.render(
    <Foo />,
    document.getElementById("root")
);