import * as path from 'path';
import { readdirSync, statSync, pathExistsSync, existsSync } from 'fs-extra';
import * as objectPath from 'object-path';
import { vpath, vfs } from './helper';

const noteNameRegex = /^[0-9]\.[a-z]+$/;

export interface Domain {
    '.notes': number[];
    [domain: string]: number[] | Domain;
}

export namespace DBCxt {
    export let dbDirPath: string;
    export let domainCache: Domain;
}

export async function initializeDBVariables(dbDirPath: string): Promise<void> {
    DBCxt.dbDirPath = dbDirPath;
    DBCxt.domainCache = await cacheTags();
}

export async function initializeDatabase(dbDirPath: string): Promise<void> {
    if (!existsSync(dbDirPath)) {
        vfs.mkdirsSync(dbDirPath);
        await createExampleData(dbDirPath);
    }
    await initializeDBVariables(dbDirPath);
}

export async function cacheTags(): Promise<Domain> {
    const cacheTags: any = {};
    for (const id of readdirSync(DBCxt.dbDirPath)
        .filter(f => f !== 'seq')
        .filter(f => f !== '.git')) {
        const noteMetaFile = path.join(DBCxt.dbDirPath, id, '.n.yml');
        const noteMeta = vfs.readYamlSync(noteMetaFile);
        const tags = noteMeta['tags'];
        for (const tag of tags) {
            const t: string = tag['tag'];
            const sp = vpath.splitPath(path.join(t, '.notes'));
            objectPath.ensureExists(cacheTags, sp, []);
            const notes: number[] = objectPath.get(cacheTags, sp);
            notes.push(Number(id));
            objectPath.set(cacheTags, sp, notes);
        }
    }
    return cacheTags;
}

export async function selectAllNotesUnderDomain(domain: Domain): Promise<number[]> {
    const childDomainNames: string[] = Object.keys(domain).filter(name => name !== '.notes');
    const notes: number[] = domain['.notes'] || [];
    if (childDomainNames.length === 0) return notes;
    const total: number[] = [];
    for (const name of childDomainNames) {
        const childDomain: Domain = domain[name] as Domain;
        const childDomainNotes: number[] = await selectAllNotesUnderDomain(childDomain);
        total.push(...childDomainNotes);
    }
    return total.concat(notes);
}

export function selectDocReadmeFile(nId: number): string {
    return path.join(DBCxt.dbDirPath, nId.toString(), 'doc', 'README.md');
}

export function selectDocExist(nId: number): boolean {
    return pathExistsSync(selectDocReadmeFile(nId));
}
export function selectFilesExist(nId: number): boolean {
    const filesDirPath = path.join(DBCxt.dbDirPath, nId.toString(), 'files');
    return pathExistsSync(filesDirPath);
}

export async function selectDomain(dpath: string): Promise<Domain> {
    return objectPath.get(DBCxt.domainCache, vpath.splitPath(dpath));
}

export async function selectNoteContent(id: number): Promise<string[]> {
    const notePath = path.join(DBCxt.dbDirPath, id.toString());
    const contents = readdirSync(notePath)
        .filter(f => noteNameRegex.test(f))
        .map(n => path.join(notePath, n))
        .filter(f => statSync(f).isFile)
        .map(f => vfs.readFileSync(f));
    return contents;
}

// export async function createNote(dpath: string): Promise<number> {
//     const noteid: number = await incSeq();
//     const oPath = vpath.splitPath(path.join(dpath, '.notes'));
//     const notes = objectPath.get<number[]>(DBCxt.domainCache, oPath, []);
//     notes.push(noteid);
//     objectPath.set(DBCxt.domainCache, oPath, notes);
//     const notePath = path.join(DBCxt.dbDirPath, noteid.toString());

//     mkdirSync(notePath);

//     vfs.writeFileSync(path.join(notePath, '1.txt'), '');
//     vfs.writeFileSync(path.join(notePath, '.n.yml'), 'category:');

//     vfs.mkdirsSync(path.join(notePath, 'doc'), path.join(notePath, 'files'));
//     vfs.writeFileSync(path.join(notePath, 'doc', 'README.md'), '');
//     vfs.writeFileSync(path.join(notePath, 'files', 'main.txt'), '');

//     await checkout();
//     return noteid;
// }

async function selectSeq(seqFile: string): Promise<number> {
    return Number(vfs.readFileSync(seqFile));
}

async function incSeq(): Promise<number> {
    const seqFile = path.join(DBCxt.dbDirPath, 'seq');
    const seq = (await selectSeq(seqFile)) + 1;
    vfs.writeFileSync(seqFile, seq.toString());
    return seq;
}

export async function createNode(dpath: string): Promise<number> {
    const newId = await incSeq();
    const newNoteMetaFile = path.join(DBCxt.dbDirPath, newId.toString(), '.n.yml');
    const newNoteOneFIle = path.join(DBCxt.dbDirPath, newId.toString(), '1.txt');
    vfs.writeYamlSync(newNoteMetaFile, { tags: [{ tag: dpath, category: 'default' }] });
    vfs.writeFileSync(newNoteOneFIle, '');
    DBCxt.domainCache = await cacheTags();
    return newId;
}

export async function createNodeCol(nid: number): Promise<void> {
    const notePath = path.join(DBCxt.dbDirPath, nid.toString());
    const cnt = readdirSync(notePath).filter(f => /[1-9]+.*/.test(f)).length + 1;
    vfs.writeFileSync(path.join(notePath, `${cnt}.txt`), '');
}

export async function createDomain(dpath: string, name: string): Promise<void> {
    const oPath = vpath.splitPath(path.join(dpath, name));
    if (objectPath.has(DBCxt.domainCache, oPath)) return;
    objectPath.set(DBCxt.domainCache, oPath, {});
}

export async function renameDomain(dpath: string, newName: string): Promise<void> {
    const opath = vpath.splitPath(dpath);
    const domain = await selectDomain(dpath);
    opath[opath.length - 1] = newName;
    objectPath.set(DBCxt.domainCache, opath, domain);
    const notes = await selectAllNotesUnderDomain(domain);
    notes.forEach(id => resetNoteDomain(id, dpath, '/' + opath.join('/')));
}

export function getNotePath(id: number | string): string {
    const noteId: string = typeof id === 'number' ? id.toString() : id;
    return path.join(DBCxt.dbDirPath, noteId);
}
export function getNoteMetaFile(id: number | string): string {
    return path.join(getNotePath(id), '.n.yml');
}

export async function resetNoteDomain(id: number, oldDomain: string, newDomain: string): Promise<void> {
    const noteMetaFile = getNoteMetaFile(id);
    const noteMeta = vfs.readYamlSync(noteMetaFile);
    for (let i = 0; i < noteMeta['tags'].length; i++) {
        if (noteMeta['tags'][i].tag + '/'.startsWith(oldDomain + '/')) {
            noteMeta['tags'][i].tag = newDomain;
        }
    }
    vfs.writeYamlSync(noteMetaFile, noteMeta);
}

// async function deleteDomain(): Promise<void> {
//     DBCxt.domainCache = await cacheTags();
// }

export async function deleteNote(dpath: string, noteId: number): Promise<void> {
    const domain = objectPath.get(DBCxt.domainCache, vpath.splitPath(dpath));
    const newNotes = domain['.notes'].filter((i: number) => i !== noteId);
    objectPath.set(DBCxt.domainCache, vpath.splitPath(path.join(dpath, '.notes')), newNotes);
}

async function createExampleData(dbDirPath: string): Promise<void> {
    console.log('111');
    vfs.writeFileSync(path.join(dbDirPath, 'seq'), '1');
    const notePath: string = path.join(dbDirPath, '1');
    vfs.mkdirsSync(notePath);
    vfs.writeFileSync(path.join(notePath, '1.txt'), 'windows');
    vfs.writeFileSync(path.join(notePath, '2.txt'), 'chose install powershell');
    vfs.writeFileSync(
        path.join(notePath, '.n.yml'),
        'tags:\n    - tag: /powershell/install\n      category: install'
    );
    vfs.mkdirsSync(path.join(notePath, 'doc'));
    vfs.writeFileSync(path.join(notePath, 'doc', 'README.md'), 'example.');
    vfs.mkdirsSync(path.join(notePath, 'files'));
    vfs.writeFileSync(path.join(notePath, 'files', 'example_01.txt'), 'example 01.');
    vfs.writeFileSync(path.join(notePath, 'files', 'example_02.txt'), 'example 02.');
}
