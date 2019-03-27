import * as fse from 'fs-extra';
import * as path from 'path';
import rimraf = require('rimraf');
import { vfs } from '../src/helper';
import { metaFileName } from '../src/constants';
import { DatabaseFileSystem } from '../src/database';

const testDataPath = './.vscode-note';

const exampleDataNotes = [
    {
        id: '1',
        tags: [{ tag: '/adf/abc', category: 'test' }],
        contents: ['adfdf', 'sdfdf']
    },
    {
        id: '2',
        tags: [{ tag: '/adf/abc', category: 'test' }],
        contents: ['adfdf', 'sdfdf']
    },
    {
        id: '3',
        tags: [{ tag: '/g/abc', category: 'test' }],
        contents: ['adfdf', 'sdfdf']
    }
];

async function createTestFileAndDirectory() {
    for (const testNote of exampleDataNotes) {
        const noteDir = path.join(testDataPath, testNote.id);
        fse.ensureDirSync(noteDir);
        const noteMetaFile = path.join(noteDir, metaFileName);
        vfs.writeYamlSync(noteMetaFile, { tags: testNote.tags });
    }
}

function removeTestData() {
    rimraf.sync(testDataPath);
}

beforeAll(async () => {
    await createTestFileAndDirectory();
});

afterAll(removeTestData);

test('cache tags', async () => {
    const dbFileSystem = new DatabaseFileSystem(testDataPath);
    expect(dbFileSystem.domainCache).toEqual(
        JSON.parse(
            '{"adf":{"abc":{".notes":["1","2"]}},"g":{"abc":{".notes":["3"]}},".notes":[]}'
        )
    );
});


test('add category', async () => {
    const dbFileSystem = new DatabaseFileSystem(testDataPath);
    expect(dbFileSystem.domainCache).toEqual(
        JSON.parse(
            '{"adf":{"abc":{".notes":["1","2"]}},"g":{"abc":{".notes":["3"]}},".notes":[]}'
        )
    );
});

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
