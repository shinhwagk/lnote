import * as fs from 'fs';
import * as path from 'path';

import rimraf = require('rimraf');

import * as db from '../src/database';
import { TestFileStructure } from './lib';

let vscodeDB: db.VSNDatabase | undefined;

const testDataRootPath = './';
const testDataPath = path.join(testDataRootPath, '.vscode-note');
const testNotesSeq = path.join(testDataPath, 'seq');

const exampleDataDomains: { [domain: string]: any } = {
    powershell: {
        install: {},
        '.notes': [1, 2, 3]
    },
    oracle: {
        '.notes': []
    }
};

const exampleDataNote: db.VSNNote = {
    id: 1,
    contents: ['test', 'select * from dual;'],
    meta: { category: 'test' }
};

const tdl: TestFileStructure[] = [
    { path: '', kind: 'd' },
    { path: 'domains.json', kind: 'f', content: JSON.stringify(exampleDataDomains) },
    { path: 'notes', kind: 'd' },
    { path: `notes/${exampleDataNote.id}`, kind: 'd' },
    { path: `notes/${exampleDataNote.id}/1.txt`, kind: 'f', content: exampleDataNote.contents[0] },
    { path: `notes/${exampleDataNote.id}/2.sql`, kind: 'f', content: exampleDataNote.contents[1] },
    {
        path: `notes/${exampleDataNote.id}/.n.json`,
        kind: 'f',
        content: JSON.stringify({ category: exampleDataNote.meta.category })
    },
    { path: `seq`, kind: 'f', content: '3' }
];

function createTestFileAndDirectory(tdl: TestFileStructure[]) {
    for (const f of tdl) {
        const p = path.join(testDataRootPath, '.vscode-note', f.path);
        switch (f.kind) {
            case 'd':
                fs.mkdirSync(p);
                break;
            case 'f':
                fs.writeFileSync(p, f.content, { encoding: 'utf-8' });
        }
    }
}

function removeTestData() {
    rimraf.sync(testDataPath);
}

beforeAll(() => {
    createTestFileAndDirectory(tdl);
    vscodeDB = new db.VSNDatabase(testDataRootPath);
});

afterAll(removeTestData);

test('true', () => {
    expect(vscodeDB.selectDomain('/powershell').domains.length >= 1 ? true : false).toBe(true);
});

test('select domain, dpath: /', () => {
    const domains: string[] = Object.keys(exampleDataDomains);
    const expectData: db.VSNDomain = { domains, notes: exampleDataDomains['.notes'] };
    expect(vscodeDB.selectDomain('/')).toEqual(expectData);
});

test('select domain childs length', () => {
    expect(vscodeDB.selectDomain('/oracle').domains.length >= 1 ? true : false).toBe(false);
});

// test('dqual powershell notes', () => {
//     expect(vscodeDB!.readNotesIdOfDomain('/powershell')).toEqual(testDataDomains.powershell[".notes"]);
// });

test('select note', () => {
    expect(vscodeDB.selectNote(1)).toEqual(exampleDataNote);
});

test('inc seq', () => {
    const id = vscodeDB.incSeq();
    const noteseq = Number(fs.readFileSync(testNotesSeq, { encoding: 'utf-8' }));
    expect(id).toEqual(noteseq);
});

test('select seq', () => {
    const id = vscodeDB.selectSeq();
    const noteseq = Number(fs.readFileSync(testNotesSeq, { encoding: 'utf-8' }));
    expect(id).toEqual(noteseq);
});

test('create note', () => {
    vscodeDB.createNote('/powershell');
    const noteseq = Number(fs.readFileSync(testNotesSeq, { encoding: 'utf-8' }));
    expect(fs.existsSync(path.join(testDataPath, 'notes', noteseq.toString()))).toEqual(true);
});

// test('fusion notes', () => {
//     const cname = testDataNote.category;
//     const nid: number = testDataNote.id;
//     const ncontents: string[] = testDataNote.contents;
//     expect(vscodeDB!.fusionNote([testDataNote]))
//         .toEqual([{ name: cname, notes: [{ id: nid, contents: ncontents }] }]);
// });
