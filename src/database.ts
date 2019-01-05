import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import * as vscode from "vscode";

import untildify = require('untildify');

const config = vscode.workspace.getConfiguration('vsnote');

// vscode-note://domains/
// vscode-note://notes/
const defaultDBPath: string = untildify(config.get<string>('db') || os.homedir());
const defaultDomainsPath = path.join(defaultDBPath, "domains.json");
const defaultNotesPath = path.join(defaultDBPath, "notes");

const cacheDomains: any = JSON.parse(fs.readFileSync(defaultDomainsPath, { encoding: "utf-8" }));

// export function isDirectory(fp: string): Boolean {
//     return fs.statSync(fp).isDirectory();
// }

// export function readChildDomainName(vsnUri?: vscode.Uri) {

// }

export function readChildDomain(domainUri: vscode.Uri): vscode.Uri[] {
    let tmpDomains = cacheDomains;
    const domainPath: string = domainUri.path || "/";
    for (const domain of domainPath.split("/").filter(p => !!p)) {
        tmpDomains = tmpDomains[domain];
    }
    return Object.keys(tmpDomains)
        .filter(domain => domain !== ".notes")
        .map(d => vscode.Uri.parse(domainUri.toString() + d + "/"));
}

export function checkoutDB(): void {
    fs.writeFileSync(defaultDomainsPath, JSON.stringify(cacheDomains), { encoding: "utf-8" });
}

export function existChildDomain(domainUrl: vscode.Uri): Boolean {
    return readChildDomain(domainUrl).length >= 1 ? true : false;
}

export function readNotesIdOfDomain(domainUrl: vscode.Uri): number[] {
    // node
    return [1, 2, 3];

}

export function addNoteDomain(domainUrl: string, noteId: number): void {
    // objectPath.insert(cacheDomains, url.parse(domainUrl).path.split("/"), noteId);
}

export function delNoteDomain(domainUrl: string, noteId: number): void {
    // objectPath.del(cacheDomains, url.parse(domainUrl).path.split("/"));
}

export function createDBIfNotExist(): void {
    if (!fs.existsSync(defaultDBPath)) {
        fs.mkdirSync(defaultDBPath);
    }
}

export function selectDomain(domainUri: vscode.Uri): any {
    let tmpDomains = cacheDomains;
    const domainPath: string = domainUri.path || "/";
    for (const domain of domainPath.split("/").filter(p => !!p)) {
        tmpDomains = tmpDomains[domain];
    }
    // tmpDomains.notes.forEach(noteId =>)
}

export function readNoteContent(id: number) {
    const noteDir = path.join(defaultNotesPath, id.toString());
    const fr = /^([0-1])+\.([a-z]+)$/;
    fs.readdirSync(noteDir).filter(f => f !== ".n.json").filter(f => fr.test(f)).sort().map(f => {

    });

}