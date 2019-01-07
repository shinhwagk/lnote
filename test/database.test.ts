import * as fs from "fs";
import * as path from "path";

import rimraf = require("rimraf");

import * as db from '../src/database';
import { TestFileStructure } from "./lib";

let vscodeDB: db.VSNoteDatabase | undefined = undefined;

const testDataDir = "./.vscode-note";

const testDataDomains: { [domain: string]: any } = {
    powershell: {
        install: {},
        ".notes": [1, 2, 3]
    },
    oracle: {
        ".notes": []
    }
};

const testDataNote: db.VSNNote = { id: 1, contents: ["test", "select * from dual;"], category: "test" };

const tdl: TestFileStructure[] = [
    { path: '', kind: "d" },
    { path: 'domains.json', kind: "f", content: JSON.stringify(testDataDomains) },
    { path: 'notes', kind: "d" },
    { path: `notes/${testDataNote.id}`, kind: "d" },
    { path: `notes/${testDataNote.id}/1.txt`, kind: "f", content: testDataNote.contents[0] },
    { path: `notes/${testDataNote.id}/2.sql`, kind: "f", content: testDataNote.contents[1] },
    { path: `notes/${testDataNote.id}/.n.json`, kind: "f", content: JSON.stringify({ category: testDataNote.category }) },
];

function createTestFileAndDirectory(tdl: TestFileStructure[]) {
    for (const f of tdl) {
        const p = path.join(testDataDir, f.path);
        switch (f.kind) {
            case "d": fs.mkdirSync(p); break;
            case "f": fs.writeFileSync(p, f.content, { encoding: "utf-8" }); break;
        }
    }
}
function removeTestData() {
    rimraf.sync(testDataDir);
}

beforeAll(() => {
    createTestFileAndDirectory(tdl);
    vscodeDB = new db.VSNoteDatabase(testDataDir);
});

afterAll(() => removeTestData());

test('true', () => {
    expect(vscodeDB!.existChildDomain("/powershell")).toBe(true);
});

test('child domain', () => {
    const name1: string = Object.keys(testDataDomains)[0];
    const name2: string = Object.keys(testDataDomains)[1];
    const expectData: db.VSNDomain[] = [
        { name: name1, notes: testDataDomains[name1][".notes"] },
        { name: name2, notes: testDataDomains[name2][".notes"] }
    ];
    expect(vscodeDB!.readChildDomain("/")).toEqual(expectData);
});

test('false', () => {
    expect(vscodeDB!.existChildDomain("/oracle")).toBe(false);
});

test('dqual powershell notes', () => {
    expect(vscodeDB!.readNotesIdOfDomain('/powershell')).toEqual(testDataDomains.powershell[".notes"]);
});

test('test read note', () => {
    expect(vscodeDB!.readNoteById(1)).toEqual(testDataNote);
});

test('fusion notes', () => {
    const cname = testDataNote.category;
    const nid: number = testDataNote.id;
    const ncontents: string[] = testDataNote.contents;
    expect(vscodeDB!.fusionNote([testDataNote]))
        .toEqual([{ name: cname, notes: [{ id: nid, contents: ncontents }] }]);
});