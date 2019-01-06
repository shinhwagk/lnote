import * as fs from "fs";
import * as path from "path";

import rimraf = require("rimraf");

import * as db from '../src/database';
import { TestFileStructure } from "./lib";

let vscodeDB: db.VSNoteDatabase | undefined = undefined;

const testDataDir = "./.vscode-note";

const testDataDomains = {
    powershell: {
        install: {},
        ".notes": [1, 2, 3]
    },
    oracle: {
        ".notes": []
    }
};

const testDataNote = { id: 1, contents: ["test", "select * from dual;"] };

const tdl: TestFileStructure[] = [
    { path: '', kind: "d" },
    { path: 'domains.json', kind: "f", content: JSON.stringify(testDataDomains) },
    { path: 'notes', kind: "d" },
    { path: `notes/${testDataNote.id}`, kind: "d" },
    { path: `notes/${testDataNote.id}/1.txt`, kind: "f", content: testDataNote.contents[0] },
    { path: `notes/${testDataNote.id}/2.sql`, kind: "f", content: testDataNote.contents[1] }
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

test('false', () => {
    expect(vscodeDB!.existChildDomain("/oracle")).toBe(false);
});

test('dqual powershell notes', () => {
    expect(vscodeDB!.readNotesIdOfDomain('/powershell')).toEqual(testDataDomains.powershell[".notes"]);
});

test('dqual powershell notes', () => {
    expect(vscodeDB!.readNoteById(1)).toEqual(testDataNote);
});
