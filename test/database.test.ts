import * as path from 'path';
import { vfs } from '../src/helper';
import { metaFileName } from '../src/constants';
import { NoteDatabase } from '../src/database';
import { mkdirpSync, rmdirSync } from 'fs-extra';

const testNotesPath = './vscode-note/notes';

const exampleDataNotes = [
    {
        id: '1',
        domain: ['adf', 'abc'], category: 'test',
        contents: ['adfdf', 'sdfdf']
    },
    {
        id: '2',
        domain: ['adf', 'abc'], category: 'test',
        contents: ['adfdf', 'sdfdf']
    },
    {
        id: '3',
        domain: ['adf', 'abc', 'ccc'], category: 'test',
        contents: ['adfdf', 'sdfdf']
    },
    {
        id: '4',
        domain: ['g', 'abc'], category: 'test',
        contents: ['adfdf', 'sdfdf']
    }
];

const resultData = JSON.parse(
    '{"adf":{"abc":{".notes":["1","2"],"ccc":{".notes":["3"]}}},"g":{"abc":{".notes":["4"]}},".notes":[]}'
);

function createTestFileAndDirectory() {
    for (const testNote of exampleDataNotes) {
        const noteDir = path.join(testNotesPath, testNote.id);
        mkdirpSync(noteDir);
        const noteMetaFile = path.join(noteDir, metaFileName);
        vfs.writeJsonSync(noteMetaFile, testNote);
    }
}

let dbFileSystem: NoteDatabase;

describe('test select', () => {
    beforeAll(() => {
        mkdirpSync(testNotesPath);
        createTestFileAndDirectory();
        dbFileSystem = new NoteDatabase(testNotesPath);
    });

    afterAll(() => {
        rmdirSync(testNotesPath);
    });

    test('cache domain', () => {
        expect(dbFileSystem.dch.selectDomain([])).toEqual(resultData);
    });

    test('test note under domain', () => {
        expect(dbFileSystem.dch.selectNotesUnderDomain(['adf', 'abc'])).toEqual(['1', '2']);
    });

    test('test all note under domain', () => {
        expect(dbFileSystem.dch.selectAllNotesUnderDomain(['adf']).sort()).toEqual(['1', '2', '3'].sort());
    });

    test('domain add', () => {
        dbFileSystem.dch.createDomain(['afd'], 'xxx');
        expect(dbFileSystem.dch.selectDomain(['afd', 'xxx'])).toEqual({});
    });
});

describe('test modify', () => {
    beforeAll(() => {
        mkdirpSync(testNotesPath);
        createTestFileAndDirectory();
        dbFileSystem = new NoteDatabase(testNotesPath);
    });

    afterAll(() => {
        rmdirSync(testNotesPath);
    });

    test('update tag', () => {
        dbFileSystem.updateNotesDomain(['adf', 'abc'], ['adf', 'acc'], false);
        dbFileSystem = new NoteDatabase(testNotesPath);
        resultData['adf']['acc'] = {};
        resultData['adf']['acc']['.notes'] = resultData['adf']['abc']['.notes'];
        delete resultData['adf']['abc']['.notes'];
        expect(dbFileSystem.dch.selectDomain()).toEqual(resultData);
    });
});

describe('test modify domain cascade', () => {
    beforeAll(() => {
        mkdirpSync(testNotesPath);
        createTestFileAndDirectory();
        dbFileSystem = new NoteDatabase(testNotesPath);
    });

    afterAll(() => {
        rmdirSync(testNotesPath);
    });

    test('update tag', () => {
        const resultData = JSON.parse(
            '{"adf":{"abc":{".notes":["1","2"],"ccc":{".notes":["3"]}}},"g":{"abc":{".notes":["4"]}},".notes":[]}'
        );
        dbFileSystem.updateNotesDomain(['adf', 'abc'], ['adf', 'acc', 'abc'], true);
        dbFileSystem = new NoteDatabase(testNotesPath);
        resultData['adf']['acc'] = { abc: { '.notes': [] } };
        resultData['adf']['acc']['abc'] = resultData['adf']['abc'];
        delete resultData['adf']['abc'];
        expect(dbFileSystem.dch.selectDomain()).toEqual(resultData);
    });
});
// test('update tag cascade', () => {
//     dbFileSystem.updateNotesTagPath(['adf', 'abc'], ['adf', 'acc'], true);
//     dbFileSystem = new NoteDatabase(testDataPath);
//     expect(dbFileSystem.dch.selectDomain())
//         .toEqual(JSON.parse('{"adf":{"acc":{".notes":["1","2"],"ccc":{".notes":["3"]}}},"g":{"abc":{".notes":["4"]}},".notes":[]}'));
// });
// test('cache tags', async () => {
//     const domainDB: Domain = await cacheTags();
//     const domain = await selectAllNotesUnderDomain(domainDB['g'] as Domain);
//     console.log(domain);
//     // expect(domainDB).toEqual(JSON.parse('{"adf":{"abc":{".notes":[1]}}}'));
// });

// test('true', async () => {
//     const domain = await selectDomain('/powershell');
//     expect(domain.domains.length >= 1 ? true : false).toBe(true);
// });

// test('select domain, dpath: /', async () => {
//     const domains: string[] = Object.keys(exampleDataDomains);
//     const expectData: VSNDomain = { domains, notes: exampleDataDomains['.notes'] };
//     expect(await selectDomain('/')).toEqual(expectData);
// });

// test('select domain childs length', async () => {
//     const domain = await selectDomain('/oracle');
//     expect(domain.domains.length >= 1 ? true : false).toBe(false);
// });

// test('create note', async () => {
//     await createNote('/powershell');
//     const noteseq = Number(fs.readFileSync(testNotesSeq, { encoding: 'utf-8' }));
//     expect(fs.existsSync(path.join(testDataNotesPath, 'notes', noteseq.toString()))).toEqual(true);
// });

// test('dqual powershell notes', () => {
//     expect(vscodeDB!.readNotesIdOfDomain('/powershell')).toEqual(testDataDomains.powershell[".notes"]);
// });

// test('select note', () => {
//     expect(selectNote(1)).toEqual(exampleDataNote);
// });

// test('inc seq', () => {
//     const id = incSeq();
//     const noteseq = Number(fs.readFileSync(testNotesSeq, { encoding: 'utf-8' }));
//     expect(id).toEqual(noteseq);
// });

// test('select seq', () => {
//     const id = selectSeq();
//     const noteseq = Number(fs.readFileSync(testNotesSeq, { encoding: 'utf-8' }));
//     expect(id).toEqual(noteseq);
// });

// test('fusion notes', () => {
//     const cname = testDataNote.category;
//     const nid: number = testDataNote.id;
//     const ncontents: string[] = testDataNote.contents;
//     expect(vscodeDB!.fusionNote([testDataNote]))
//         .toEqual([{ name: cname, notes: [{ id: nid, contents: ncontents }] }]);
// });
