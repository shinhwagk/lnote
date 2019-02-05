import * as fse from 'fs-extra';
import * as path from 'path';
import * as jsyml from 'js-yaml';
import { fusionNoteTags } from '../src/database';
import { TestFileStructure } from './lib';

const testDataRootPath = './';
const testDataNotesPath = path.join(testDataRootPath, '.vscode-note');

const exampleDataNote = {
    id: 1,
    tags: [{ tag: '/adf/abc', category: 'test' }],
    contents: ['adfdf', 'sdfdf']
};

const tdl: TestFileStructure[] = [
    { path: '', kind: 'd' },
    { path: `${exampleDataNote.id}`, kind: 'd' },
    { path: `${exampleDataNote.id}/1.txt`, kind: 'f', content: exampleDataNote.contents[0] },
    { path: `${exampleDataNote.id}/2.sql`, kind: 'f', content: exampleDataNote.contents[1] },
    {
        path: `${exampleDataNote.id}/.n.yml`,
        kind: 'f',
        content: jsyml.safeDump({ tags: exampleDataNote.tags })
    },
    { path: `seq`, kind: 'f', content: '3' }
];

async function createTestFileAndDirectory(tdl: TestFileStructure[]) {
    for (const f of tdl) {
        const p = path.join(testDataNotesPath, f.path);
        switch (f.kind) {
            case 'd':
                fse.ensureDirSync(p);
                break;
            case 'f':
                fse.writeFileSync(p, f.content, { encoding: 'utf-8' });
        }
    }
}

// function removeTestData() {
//     rimraf.sync(testDataNotesPath);
// }

beforeAll(async () => {
    await createTestFileAndDirectory(tdl);
});

// afterAll(removeTestData);

test('fusionNoteTags', async () => {
    const cacheTags = await fusionNoteTags(testDataNotesPath);
    expect(cacheTags).toEqual(JSON.parse('{"adf":{"abc":{".notes":[1]}}}'));
});

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
